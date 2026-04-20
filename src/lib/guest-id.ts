/**
 * 访客ID管理工具
 * - 为未登录用户分配唯一标识
 * - 存储在 localStorage 中
 * - 登录后不再使用
 */

const GUEST_ID_KEY = 'l4d2_map_rating_guest_id'

/**
 * 从 localStorage 获取访客ID
 */
export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(GUEST_ID_KEY)
}

/**
 * 保存访客ID到 localStorage
 */
export function setGuestId(guestId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GUEST_ID_KEY, guestId)
}

/**
 * 从服务端获取或验证访客ID
 */
export async function ensureGuestId(): Promise<string> {
  const existingId = getGuestId()

  const response = await fetch('/api/guest-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guestId: existingId }),
  })

  if (!response.ok) {
    throw new Error('Failed to get guest ID')
  }

  const data = await response.json()

  // 如果服务端返回了新的ID（或验证后的ID），保存到 localStorage
  if (data.guestId && data.guestId !== existingId) {
    setGuestId(data.guestId)
  }

  return data.guestId
}

/**
 * 清除访客ID（用户登录后调用）
 */
export function clearGuestId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GUEST_ID_KEY)
}
