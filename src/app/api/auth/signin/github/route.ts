import { NextRequest, NextResponse } from 'next/server'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID

export async function GET(request: NextRequest) {
  if (!GITHUB_CLIENT_ID) {
    return NextResponse.json({ error: 'GitHub 配置错误' }, { status: 500 })
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/callback/github`
  const scope = 'user:email'
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`
  
  return NextResponse.redirect(githubAuthUrl)
}
