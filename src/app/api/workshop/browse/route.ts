import { NextRequest, NextResponse } from 'next/server'
import { queryWorkshopItems } from '@/lib/steam-workshop'
import { withCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sort = (searchParams.get('sort') || 'popular') as 'popular' | 'recent' | 'trend'
    const searchText = searchParams.get('search') || undefined

    // 缓存键
    const cacheKey = `workshop:list:${sort}:${searchText || 'all'}:page${page}`

    const data = await withCache(
      cacheKey,
      async () => {
        const result = await queryWorkshopItems({
          page,
          limit,
          sort,
          searchText,
        })

        return {
          items: result.items.map(item => ({
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
          })),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
          },
        }
      },
      3600 // 缓存 1 小时
    )

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('浏览 Workshop 失败:', error)
    return NextResponse.json(
      { error: error.message || '获取 Workshop 数据失败' },
      { status: 500 }
    )
  }
}
