import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { guestIds } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

// POST - 验证或创建访客ID
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guestId } = body

    // 如果提供了 guestId，验证它是否存在
    if (guestId) {
      const [existing] = await db.select()
        .from(guestIds)
        .where(eq(guestIds.id, guestId))
        .limit(1)

      if (existing) {
        return NextResponse.json({ guestId: existing.id })
      }
    }

    // 创建新的访客ID
    const newGuestId = crypto.randomUUID()
    await db.insert(guestIds).values({
      id: newGuestId,
    })

    return NextResponse.json({ guestId: newGuestId })
  } catch (error: any) {
    console.error('Error handling guest ID:', error)
    return NextResponse.json({
      error: error.message,
    }, { status: 500 })
  }
}
