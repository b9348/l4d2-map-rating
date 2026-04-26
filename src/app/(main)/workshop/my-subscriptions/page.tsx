'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Star, Eye, Users, ArrowLeft } from 'lucide-react'
import { api, safeAsync } from '@/lib/http'
import { toast } from 'sonner'

interface WorkshopItem {
  id: string
  title: string
  description: string
  previewUrl: string
  subscriptions: number
  favorites: number
  views: number
  rating: number
  votesUp: number
  votesDown: number
  tags: string[]
  localMap?: {
    id: string
    averageRating: number
    ratingCount: number
  } | null
}

export default function MySubscriptionsPage() {
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  const [items, setItems] = useState<WorkshopItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!session?.user?.steamId) {
        toast.error('请先使用 Steam 登录')
        router.push('/auth/signin')
        return
      }
      loadSubscriptions()
    }
  }, [authLoading, session])

  const loadSubscriptions = async () => {
    setLoading(true)
    const [error, data] = await safeAsync(
      api.get<{ items: WorkshopItem[] }>('/api/workshop/my-subscriptions')
    )

    if (error || !data) {
      toast.error('加载失败: ' + (error?.message || '未知错误'))
      setLoading(false)
      return
    }

    setItems(data.items)
    setLoading(false)
  }

  const handleViewDetails = (id: string) => {
    router.push(`/workshop/${id}`)
  }

  const getRatingPercentage = (item: WorkshopItem) => {
    const total = item.votesUp + item.votesDown
    if (total === 0) return 0
    return Math.round((item.votesUp / total) * 100)
  }

  const getStatusBadge = (item: WorkshopItem) => {
    if (item.localMap) {
      return (
        <Badge className="bg-green-500">
          已评分 ⭐{item.localMap.averageRating.toFixed(1)}
        </Badge>
      )
    }
    return <Badge variant="secondary">未收录</Badge>
  }

  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8 text-center">加载中...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        className="mb-4 gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </Button>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的订阅</h1>
        <p className="text-muted-foreground">
          你在 Steam 上订阅的 L4D2 地图（共 {items.length} 个）
        </p>
      </div>

      {/* 地图列表 */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">你还没有订阅任何地图</p>
          <Button onClick={() => router.push('/workshop')}>
            去 Workshop 浏览
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(item.id)}
            >
              {/* 封面图 */}
              <div className="relative aspect-video bg-muted">
                <img
                  src={item.previewUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {/* 状态标签 */}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(item)}
                </div>
              </div>

              <CardContent className="p-4">
                {/* 标题 */}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {item.title}
                </h3>

                {/* 统计数据 */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {item.subscriptions.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    {getRatingPercentage(item)}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {item.views.toLocaleString()}
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.description || '暂无描述'}
                </p>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(item.id)
                    }}
                  >
                    {item.localMap ? '查看评分' : '导入评分'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(
                        `https://steamcommunity.com/sharedfiles/filedetails/?id=${item.id}`,
                        '_blank'
                      )
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
