import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-custom'

export async function POST() {
  await clearAuthCookie()
  
  const response = NextResponse.json({ success: true })
  return response
}
