import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { maps } from '@/lib/schema'
import { getSession } from '@/lib/auth-custom'

/**
 * 更新地图信息
 * PUT /api/maps/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: '请先登录' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { nameZh, nameEn, description } = body

    // 查询地图，检查权限
    const [existingMap] = await db
      .select({
        id: maps.id,
        submitterId: maps.submitterId,
      })
      .from(maps)
      .where(eq(maps.id, id))

    if (!existingMap) {
      return NextResponse.json(
        { message: '地图不存在' },
        { status: 404 }
      )
    }

    // 只有上传者可以编辑
    if (existingMap.submitterId !== session.user.id) {
      return NextResponse.json(
        { message: '无权编辑此地图' },
        { status: 403 }
      )
    }

    // 更新地图信息
    await db
      .update(maps)
      .set({
        ...(nameZh !== undefined && { nameZh: nameZh || null }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(description !== undefined && { description: description || null }),
      })
      .where(eq(maps.id, id))

    // 获取更新后的数据
    const [updatedMap] = await db
      .select()
      .from(maps)
      .where(eq(maps.id, id))
      .limit(1)

    return NextResponse.json({
      message: '更新成功',
      map: updatedMap,
    })
  } catch (error) {
    console.error('Update map error:', error)
    return NextResponse.json(
      { message: '更新失败' },
      { status: 500 }
    )
  }
}
