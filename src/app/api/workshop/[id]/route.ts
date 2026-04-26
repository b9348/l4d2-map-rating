import { NextRequest, NextResponse } from 'next/server'
import { getWorkshopItemDetails } from '@/lib/steam-workshop'
import { withCache } from '@/lib/cache'
import { db } from '@/lib/db'
import { maps } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workshopId } = await params

    // 缓存键
    const cacheKey = `workshop:detail:${workshopId}`

    const data = await withCache(
      cacheKey,
      async () => {
        const item = await getWorkshopItemDetails(workshopId)

        if (!item) {
          return null
        }

        // 检查是否已在本站收录
        const [existingMap] = await db
          .select({
            id: maps.id,
            averageRating: maps.averageRating,
            ratingCount: maps.ratingCount,
          })
          .from(maps)
          .where(eq(maps.workshopId, workshopId))
          .limit(1)

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
          fileUrl: item.file_url,
          // 本站数据
          localMap: existingMap ? {
            id: existingMap.id,
            averageRating: existingMap.averageRating,
            ratingCount: existingMap.ratingCount,
          } : null,
        }
      },
      3600 // 缓存 1 小时
    )

    if (!data) {
      return NextResponse.json(
        { error: '未找到该 Workshop 物品' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('获取 Workshop 详情失败:', error)
    return NextResponse.json(
      { error: error.message || '获取 Workshop 详情失败' },
      { status: 500 }
    )
  }
}
