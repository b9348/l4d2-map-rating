import { NextRequest, NextResponse } from 'next/server'
import { getSteamAuthUrl } from '@/lib/auth-steam'

export async function GET(request: NextRequest) {
  // 使用客户端传递的 origin
  const clientOrigin = request.nextUrl.searchParams.get('origin')
  if (!clientOrigin) {
    return NextResponse.json({ error: '缺少 origin 参数' }, { status: 400 })
  }
  
  const steamAuthUrl = getSteamAuthUrl(clientOrigin)
  
  return NextResponse.redirect(steamAuthUrl)
}
