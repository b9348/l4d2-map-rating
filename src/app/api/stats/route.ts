import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { maps, ratings, users } from '@/lib/schema'
import { count } from 'drizzle-orm'
import { withCache } from '@/lib/cache'

export async function GET() {
  try {
    const data = await withCache(
      'stats',
      async () => {
        // 并行查询统计数据
        const [mapResult, ratingResult, userResult] = await Promise.all([
          db.select({ count: count() }).from(maps),
          db.select({ count: count() }).from(ratings),
          db.select({ count: count() }).from(users),
        ])

        return {
          mapCount: mapResult[0]?.count || 0,
          ratingCount: ratingResult[0]?.count || 0,
          userCount: userResult[0]?.count || 0,
        }
      },
      60 // 统计数据缓存 1 分钟
    )

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
