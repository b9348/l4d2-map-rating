import { NextRequest, NextResponse } from 'next/server'
import { getUserSubscribedItems } from '@/lib/steam-workshop'
import { getSession } from '@/lib/auth-custom'
import { withCache } from '@/lib/cache'
import { db } from '@/lib/db'
import { maps } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // 检查登录状态
    const session = await getSession()
    if (!session?.user?.steamId) {
      return NextResponse.json(
        { error: '请先使用 Steam 登录' },
        { status: 401 }
      )
    }

    const steamId = session.user.steamId

    // 缓存键
    const cacheKey = `workshop:user:${steamId}`

    const data = await withCache(
      cacheKey,
      async () => {
        const items = await getUserSubscribedItems(steamId)

        // 批量检查哪些地图已在本站收录
        const workshopIds = items.map(item => item.publishedfileid)
        const existingMaps = await db
          .select({
            workshopId: maps.workshopId,
            id: maps.id,
            averageRating: maps.averageRating,
            ratingCount: maps.ratingCount,
          })
          .from(maps)
          .where(eq(maps.workshopId, workshopIds[0])) // 临时查询，后面会优化

        // 创建映射表
        const mapsByWorkshopId = new Map(
          existingMaps.map(m => [m.workshopId, m])
        )

        return items.map(item => {
          const localMap = mapsByWorkshopId.get(item.publishedfileid)

          return {
            id: item.publishedfileid,
            title: item.title,
            description: item.description,
            previewUrl: item.preview_url,
            subscriptions: item.subscriptions,
            favorites: item.favorited,
            views: item.views,
            rating: item.vote_data?.score || 0,
            votesUp: item.vote_data?.votes_up || 0,
            votesDown: item.vote_data?.votes_down || 0,
            createdAt: item.time_created,
            updatedAt: item.time_updated,
            tags: item.tags?.map(t => t.tag) || [],
            // 本站数据
            localMap: localMap ? {
              id: localMap.id,
              averageRating: localMap.averageRating,
              ratingCount: localMap.ratingCount,
            } : null,
          }
        })
      },
      600 // 缓存 10 分钟
    )

    return NextResponse.json({ items: data })
  } catch (error: any) {
    console.error('获取用户订阅失败:', error)
    return NextResponse.json(
      { error: error.message || '获取订阅列表失败' },
      { status: 500 }
    )
  }
}
