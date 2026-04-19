import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 并行查询统计数据
    const [mapCount, ratingCount, userCount] = await Promise.all([
      prisma.map.count(),
      prisma.rating.count(),
      prisma.user.count(),
    ])

    return NextResponse.json({
      mapCount,
      ratingCount,
      userCount,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
