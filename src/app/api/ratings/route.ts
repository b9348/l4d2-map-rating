import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { ratingSchema } from '@/lib/validations'

// GET - 获取某地图的评分
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mapId = searchParams.get('mapId')
    
    if (!mapId) {
      return NextResponse.json({ error: 'mapId required' }, { status: 400 })
    }
    
    const ratings = await prisma.rating.findMany({
      where: { mapId },
      include: {
        user: {
          select: { name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(ratings)
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
    const existing = await prisma.rating.findFirst({
      where: {
        mapId: validated.data.mapId,
        userId: userId
      }
    })
    
    if (existing) {
      // 更新评分
      await prisma.rating.update({
        where: { id: existing.id },
        data: {
          score: validated.data.score,
          comment: validated.data.comment || null
        }
      })
    } else {
      // 创建新评分
      await prisma.rating.create({
        data: {
          score: validated.data.score,
          comment: validated.data.comment || null,
          mapId: validated.data.mapId,
          userId
        }
      })
    }
    
    // 重新计算平均分
    const stats = await prisma.rating.aggregate({
      where: { mapId: validated.data.mapId },
      _avg: { score: true },
      _count: { _all: true }
    })
    
    await prisma.map.update({
      where: { id: validated.data.mapId },
      data: {
        averageRating: stats._avg.score || 0,
        ratingCount: stats._count._all
      }
    })
    
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
