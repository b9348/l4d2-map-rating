import { NextRequest, NextResponse } from 'next/server'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID

export async function GET(request: NextRequest) {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: 'GitHub 配置错误' }, { status: 500 })
  }

  // 使用客户端传递的 origin
  const clientOrigin = request.nextUrl.searchParams.get('origin')
  if (!clientOrigin) {
    return NextResponse.json({ error: '缺少 origin 参数' }, { status: 400 })
  }
  
  const redirectUri = `${clientOrigin}/api/auth/callback/github`
  const scope = 'user:email'
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`
  
  return NextResponse.redirect(githubAuthUrl)
}
