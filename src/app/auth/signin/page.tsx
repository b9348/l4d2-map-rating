'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2 } from 'lucide-react'

export default function SignInPage() {
  const handleSteamLogin = () => {
    signIn('steam', { callbackUrl: '/' })
  }
  
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Gamepad2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">欢迎回来</CardTitle>
          <CardDescription>
            使用 Steam 账号登录，开始探索和分享 L4D2 自定义地图
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSteamLogin}
            className="w-full h-12 text-lg gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12.001-5.373 12.001-12S18.606 0 11.979 0z"/>
            </svg>
            使用 Steam 登录
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>登录后您可以:</p>
            <ul className="mt-2 space-y-1">
              <li>✓ 提交自定义地图</li>
              <li>✓ 留下评分和评语</li>
              <li>✓ 管理您的内容</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
