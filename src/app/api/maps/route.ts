import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { mapSchema } from '@/lib/validations'

// GET - 获取地图列表(支持分页、搜索、排序)或单个地图
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // 如果提供了ID,返回单个地图
    if (id) {
      const map = await prisma.map.findUnique({
        where: { id },
        include: {
          submitter: {
            select: { name: true, avatar: true }
          },
          _count: {
            select: { ratings: true }
          }
        }
      })
      
      if (!map) {
        return NextResponse.json({ error: 'Map not found' }, { status: 404 })
      }
      
      return NextResponse.json({
        maps: [{
          ...map,
          images: JSON.parse(map.images as string)
        }]
      })
    }
    
    // 否则返回列表
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    
    const skip = (page - 1) * limit
    
    const where = search ? {
      OR: [
        { nameZh: { contains: search } },
        { nameEn: { contains: search } },
        { description: { contains: search } },
      ]
    } : {}
    
    const orderBy = sortBy === 'rating' 
      ? { averageRating: 'desc' as const }
      : { createdAt: 'desc' as const }
    
    const [maps, total] = await Promise.all([
      prisma.map.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          submitter: {
            select: { name: true, avatar: true }
          },
          _count: {
            select: { ratings: true }
          }
        }
      }),
      prisma.map.count({ where })
    ])
    
    // 解析images JSON字符串
    const mapsWithParsedImages = maps.map(map => ({
      ...map,
      images: JSON.parse(map.images as string)
    }))
    
    return NextResponse.json({
      maps: mapsWithParsedImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching maps:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}

// POST - 创建新地图(需要登录)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validated = mapSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.issues }, { status: 400 })
    }
    
    const map = await prisma.map.create({
      data: {
        nameZh: validated.data.nameZh || null,
        nameEn: validated.data.nameEn || null,
        description: validated.data.description || null,
        images: JSON.stringify(validated.data.images),
        submitterId: session.user.id,
      },
      include: {
        submitter: {
          select: { name: true, avatar: true }
        }
      }
    })
    
    return NextResponse.json({
      message: '地图提交成功',
      map: {
        ...map,
        images: JSON.parse(map.images as string)
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating map:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
