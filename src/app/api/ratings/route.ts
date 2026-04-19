import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ratings, maps, users } from '@/lib/schema'
import { auth } from '@/lib/auth'
import { ratingSchema } from '@/lib/validations'
import { eq, and, desc, avg, count } from 'drizzle-orm'

// GET - 获取某地图的评分
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mapId = searchParams.get('mapId')
    
    if (!mapId) {
      return NextResponse.json({ error: 'mapId required' }, { status: 400 })
    }
    
    const result = await db.select({
      id: ratings.id,
      score: ratings.score,
      comment: ratings.comment,
      userId: ratings.userId,
      createdAt: ratings.createdAt,
      userName: users.name,
      userAvatar: users.avatar,
    })
    .from(ratings)
    .leftJoin(users, eq(ratings.userId, users.id))
    .where(eq(ratings.mapId, mapId))
    .orderBy(desc(ratings.createdAt))
    
    const formattedRatings = result.map(r => ({
      ...r,
      user: r.userId ? { name: r.userName, avatar: r.userAvatar } : null
    }));

    return NextResponse.json(formattedRatings)
  } catch (error: any) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

// POST - 提交评分
export async function POST(request: Request) {
  try {
    const session = await auth()
    const body = await request.json()
    const validated = ratingSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 })
    }
    
    let userId = session?.user?.id || null
    
    // 检查是否已评分
    const [existing] = await db.select()
      .from(ratings)
      .where(and(
        eq(ratings.mapId, validated.data.mapId),
        userId ? eq(ratings.userId, userId) : undefined
      ))
      .limit(1)
    
    if (existing) {
      // 更新评分
      await db.update(ratings)
        .set({
          score: validated.data.score,
          comment: validated.data.comment || null
        })
        .where(eq(ratings.id, existing.id))
    } else {
      // 创建新评分
      await db.insert(ratings).values({
        id: crypto.randomUUID(),
        score: validated.data.score,
        comment: validated.data.comment || null,
        mapId: validated.data.mapId,
        userId
      })
    }
    
    // 重新计算平均分
    const [stats] = await db.select({
      avgScore: avg(ratings.score),
      totalCount: count()
    })
    .from(ratings)
    .where(eq(ratings.mapId, validated.data.mapId))
    
    await db.update(maps)
      .set({
        averageRating: Number(stats.avgScore) || 0,
        ratingCount: stats.totalCount
      })
      .where(eq(maps.id, validated.data.mapId))
    
    return NextResponse.json({ 
      message: '评分提交成功'
    })
  } catch (error: any) {
    console.error('Error submitting rating:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
