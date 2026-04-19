'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2 } from 'lucide-react'

export default function SignInPage() {
  const handleGitHubLogin = () => {
    signIn('github', { callbackUrl: '/' })
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
            使用 GitHub 账号登录，开始探索和分享 L4D2 自定义地图
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            className="w-full h-12 text-lg gap-3 bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            使用 GitHub 登录
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
