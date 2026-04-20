import { NextRequest, NextResponse } from 'next/server'
import { getSteamAuthUrl } from '@/lib/auth-steam'

export async function GET(request: NextRequest) {
  const returnUrl = request.nextUrl.origin
  const steamAuthUrl = getSteamAuthUrl(returnUrl)
  
  return NextResponse.redirect(steamAuthUrl)
}
