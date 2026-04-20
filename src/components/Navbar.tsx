'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Gamepad2, LogIn, LogOut, Plus } from 'lucide-react'

export function Navbar() {
  const { session, loading, signOut } = useAuth()
  
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              L4D2 Maps
            </span>
          </Link>
          
          {/* 右侧操作区 */}
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {session ? (
                  <>
                    {/* 提交地图按钮 */}
                    <Link href="/maps/submit">
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">提交地图</span>
                      </Button>
                    </Link>
                    
                    {/* 用户菜单 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                          <Avatar>
                            <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                            <AvatarFallback>
                              {session.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium">{session.user?.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {session.user?.email}
                          </p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()} className="gap-2">
                          <LogOut className="h-4 w-4" />
                          退出登录
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  /* 登录按钮 - 跳转到登录页选择方式 */
                  <Link href="/auth/signin">
                    <Button size="sm" className="gap-2">
                      <LogIn className="h-4 w-4" />
                      登录
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
