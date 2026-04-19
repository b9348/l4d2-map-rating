import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { maps, ratings, users } from '@/lib/schema'
import { count } from 'drizzle-orm'

export async function GET() {
  try {
    // 并行查询统计数据
    const [mapResult, ratingResult, userResult] = await Promise.all([
      db.select({ count: count() }).from(maps),
      db.select({ count: count() }).from(ratings),
      db.select({ count: count() }).from(users),
    ])

    return NextResponse.json({
      mapCount: mapResult[0]?.count || 0,
      ratingCount: ratingResult[0]?.count || 0,
      userCount: userResult[0]?.count || 0,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
