import { NextRequest, NextResponse } from 'next/server'
import { handleGitHubCallback } from '@/lib/auth-github'
import { setAuthCookie } from '@/lib/auth-custom'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${process.env.PROD_URL}/auth/signin?error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.PROD_URL}/auth/signin?error=缺少授权码`)
  }

  const { token, redirectUrl } = await handleGitHubCallback(code)
  
  const response = NextResponse.redirect(redirectUrl)
  await setAuthCookie(token)
  
  return response
}
