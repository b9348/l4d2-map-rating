import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { maps, users, ratings } from '@/lib/schema'
import { getSession } from '@/lib/auth-custom'
import { mapSchema } from '@/lib/validations'
import { eq, or, like, desc, count, sql } from 'drizzle-orm'
import { withCache, deleteCache } from '@/lib/cache'

// GET - 获取地图列表(支持分页、搜索、排序)或单个地图
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // 如果提供了ID,返回单个地图
    if (id) {
      const data = await withCache(
        `map:${id}`,
        async () => {
          const [map] = await db.select({
            id: maps.id,
            nameZh: maps.nameZh,
            nameEn: maps.nameEn,
            description: maps.description,
            images: maps.images,
            averageRating: maps.averageRating,
            ratingCount: maps.ratingCount,
            createdAt: maps.createdAt,
            workshopId: maps.workshopId,
            steamData: maps.steamData,
            submitterId: maps.submitterId,
            submitterName: users.name,
            submitterAvatar: users.image,
          })
          .from(maps)
          .leftJoin(users, eq(maps.submitterId, users.id))
          .where(eq(maps.id, id))
          .limit(1)

          if (!map) {
            return null
          }

          return {
            maps: [{
              ...map,
              images: JSON.parse(map.images as string),
              submitter: { name: map.submitterName, avatar: map.submitterAvatar },
              submitterId: map.submitterId,
            }]
          }
        },
        300 // 单个地图缓存 5 分钟
      )

      if (!data) {
        return NextResponse.json({ error: 'Map not found' }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    // 否则返回列表
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'

    const offset = (page - 1) * limit

    // 首页无搜索时缓存，其他情况不走缓存
    const shouldCache = page === 1 && !search && sortBy === 'newest'
    const cacheKey = `maps:list:home`

    const fetchMapsList = async () => {
      const whereClause = search ? or(
        like(maps.nameZh, `%${search}%`),
        like(maps.nameEn, `%${search}%`),
        like(maps.description, `%${search}%`)
      ) : undefined

      const orderByClause = sortBy === 'rating'
        ? desc(maps.averageRating)
        : desc(maps.createdAt)

      const [mapsList, totalResult] = await Promise.all([
        db.select({
          id: maps.id,
          nameZh: maps.nameZh,
          nameEn: maps.nameEn,
          description: maps.description,
          images: maps.images,
          averageRating: maps.averageRating,
          ratingCount: maps.ratingCount,
          createdAt: maps.createdAt,
          submitterId: maps.submitterId,
          submitterName: users.name,
          submitterAvatar: users.image,
        })
        .from(maps)
        .leftJoin(users, eq(maps.submitterId, users.id))
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
        db.select({ count: count() }).from(maps).where(whereClause)
      ])

      // 解析images JSON字符串
      const mapsWithParsedImages = mapsList.map((map: any) => ({
        ...map,
        images: JSON.parse(map.images as string),
        submitter: { name: map.submitterName, avatar: map.submitterAvatar }
      }))

      return {
        maps: mapsWithParsedImages,
        pagination: {
          page,
          limit,
          total: totalResult[0]?.count || 0,
          totalPages: Math.ceil((totalResult[0]?.count || 0) / limit)
        }
      }
    }

    const data = shouldCache
      ? await withCache(cacheKey, fetchMapsList, 120) // 首页缓存 2 分钟
      : await fetchMapsList()

    return NextResponse.json(data)
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
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const body = await request.json()
  const validated = mapSchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json({ error: validated.error.issues }, { status: 400 })
  }

  const newMapId = crypto.randomUUID();
  await db.insert(maps).values({
    id: newMapId,
    nameZh: validated.data.nameZh || null,
    nameEn: validated.data.nameEn || null,
    description: validated.data.description || null,
    images: JSON.stringify(body.images || []),
    submitterId: session.user.id,
  });

  // 清除相关缓存
  await deleteCache('stats')
  await deleteCache('maps:list:home')

  // 重新查询以获取完整信息
  const [map] = await db.select({
    id: maps.id,
    nameZh: maps.nameZh,
    nameEn: maps.nameEn,
    description: maps.description,
    images: maps.images,
    averageRating: maps.averageRating,
    ratingCount: maps.ratingCount,
    createdAt: maps.createdAt,
    submitterName: users.name,
    submitterAvatar: users.image,
  })
  .from(maps)
  .leftJoin(users, eq(maps.submitterId, users.id))
  .where(eq(maps.id, newMapId))

  return NextResponse.json({
    message: '地图提交成功',
    map: {
      ...map,
      images: JSON.parse(map.images as string),
      submitter: { name: map.submitterName, avatar: map.submitterAvatar }
    }
  }, { status: 201 })
}
