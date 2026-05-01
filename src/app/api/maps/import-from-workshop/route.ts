import { NextRequest, NextResponse } from 'next/server'
import { getWorkshopItemDetails, extractWorkshopId } from '@/lib/steam-workshop'
import { getSession } from '@/lib/auth-custom'
import { db } from '@/lib/db'
import { maps } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { deleteCache } from '@/lib/cache'

export async function POST(request: NextRequest) {
  try {
    // 检查登录状态
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { workshopId: rawWorkshopId } = body

    if (!rawWorkshopId) {
      return NextResponse.json(
        { error: '请提供 Workshop ID 或链接' },
        { status: 400 }
      )
    }

    // 提取 Workshop ID
    const workshopId = extractWorkshopId(rawWorkshopId)
    if (!workshopId) {
      return NextResponse.json(
        { error: '无效的 Workshop ID 或链接' },
        { status: 400 }
      )
    }

    // 检查是否已存在
    const [existingMap] = await db
      .select()
      .from(maps)
      .where(eq(maps.workshopId, workshopId))
      .limit(1)

    if (existingMap) {
      return NextResponse.json({
        message: '该地图已存在',
        mapId: existingMap.id,
        existed: true,
      })
    }

    // 从 Steam 获取地图信息
    const item = await getWorkshopItemDetails(workshopId)
    if (!item) {
      return NextResponse.json(
        { error: '未找到该 Workshop 物品，请检查 ID 是否正确' },
        { status: 404 }
      )
    }

    // 创建地图记录
    const newMapId = crypto.randomUUID()
    const steamData = {
      rating: item.vote_data?.score || 0,
      subscriptions: item.subscriptions,
      favorites: item.favorited,
      views: item.views,
      tags: item.tags?.map(t => t.tag) || [],
    }

    await db.insert(maps).values({
      id: newMapId,
      nameEn: item.title,
      nameZh: null,
      description: item.description,
      images: JSON.stringify([item.preview_url]),
      submitterId: session.user.id,
      workshopId: workshopId,
      steamData: JSON.stringify(steamData),
      lastSyncAt: new Date(),
    })

    // 清除相关缓存
    await deleteCache('stats')
    await deleteCache('maps:list:home')

    return NextResponse.json({
      message: '地图导入成功',
      mapId: newMapId,
      existed: false,
    })
  } catch (error: any) {
    console.error('导入 Workshop 地图失败:', error)
    return NextResponse.json(
      { error: error.message || '导入地图失败' },
      { status: 500 }
    )
  }
}
