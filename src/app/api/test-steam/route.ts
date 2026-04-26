import { NextResponse } from 'next/server'

export async function GET() {
  const STEAM_API_KEY = process.env.STEAM_API_KEY

  if (!STEAM_API_KEY) {
    return NextResponse.json({ error: 'STEAM_API_KEY 未配置' }, { status: 500 })
  }

  try {
    // 测试简单的 Steam API 调用
    const testUrl = `https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/?key=${STEAM_API_KEY}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(testUrl, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Steam API 返回错误: ${response.status}`,
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Steam API 连接正常',
      serverTime: data.servertime,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || '连接失败',
      details: error.cause?.message || error.toString(),
    })
  }
}
