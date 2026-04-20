import { NextRequest, NextResponse } from 'next/server'
import { handleSteamCallback } from '@/lib/auth-steam'
import { setAuthCookie } from '@/lib/auth-custom'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const { token, redirectUrl } = await handleSteamCallback(searchParams)
  
  const response = NextResponse.redirect(new URL(redirectUrl, request.url))
  await setAuthCookie(token)
  
  return response
}
