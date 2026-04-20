import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ratings, maps, users } from '@/lib/schema'
import { getSession } from '@/lib/auth-custom'
import { ratingSchema } from '@/lib/validations'
import { eq, and, desc, avg, count, isNull } from 'drizzle-orm'
import { withCache, deleteCache } from '@/lib/cache'

// GET - 获取某地图的评分
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mapId = searchParams.get('mapId')

    if (!mapId) {
      return NextResponse.json({ error: 'mapId required' }, { status: 400 })
    }

    const data = await withCache(
      `ratings:${mapId}`,
      async () => {
        const result = await db.select({
          id: ratings.id,
          score: ratings.score,
          comment: ratings.comment,
          userId: ratings.userId,
          guestId: ratings.guestId,
          createdAt: ratings.createdAt,
          updatedAt: ratings.updatedAt,
          userName: users.name,
          userAvatar: users.image,
        })
        .from(ratings)
        .leftJoin(users, eq(ratings.userId, users.id))
        .where(eq(ratings.mapId, mapId))
        .orderBy(desc(ratings.createdAt))

        return result.map(r => ({
          ...r,
          user: r.userId ? { name: r.userName, avatar: r.userAvatar } : null
        }))
      },
      60 // 评分列表缓存 1 分钟
    )

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

// POST - 提交/更新评分
export async function POST(request: Request) {
  const session = await getSession()
  const body = await request.json()
  const validated = ratingSchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.issues }, { status: 400 })
  }

  const userId = session?.user?.id || null
  const guestId = userId ? null : (validated.data.guestId || null)

  if (!userId && !guestId) {
    return NextResponse.json({ error: '未登录用户需要提供 guestId' }, { status: 400 })
  }

  // 检查是否已评分（根据 userId 或 guestId）
  let existing = null

  if (userId) {
    // 已登录用户：通过 userId 查找
    const [found] = await db.select()
      .from(ratings)
      .where(and(
        eq(ratings.mapId, validated.data.mapId),
        eq(ratings.userId, userId)
      ))
      .limit(1)
    existing = found
  } else if (guestId) {
    // 未登录用户：通过 guestId 查找
    const [found] = await db.select()
      .from(ratings)
      .where(and(
        eq(ratings.mapId, validated.data.mapId),
        eq(ratings.guestId, guestId)
      ))
      .limit(1)
    existing = found
  }

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
      userId,
      guestId
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

  // 清除相关缓存
  await deleteCache(`ratings:${validated.data.mapId}`)
  await deleteCache(`map:${validated.data.mapId}`)
  await deleteCache('stats')
  await deleteCache('maps:list:home')

  return NextResponse.json({
    message: existing ? '评分更新成功' : '评分提交成功'
  })
}
