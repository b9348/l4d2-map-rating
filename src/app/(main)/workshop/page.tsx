'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, ExternalLink, Star, Eye, Users, TrendingUp } from 'lucide-react'
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

export default function WorkshopPage() {
  const router = useRouter()
  const [items, setItems] = useState<WorkshopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [sort, setSort] = useState<'popular' | 'recent' | 'trend'>('popular')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadItems()
  }, [sort, page])

  const loadItems = async () => {
    setLoading(true)
    const [error, data] = await safeAsync(
      api.get<{
        items: WorkshopItem[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>(`/api/workshop/browse?sort=${sort}&page=${page}&search=${searchText}`)
    )

    if (error || !data) {
      toast.error('加载失败: ' + (error?.message || '未知错误'))
      setLoading(false)
      return
    }

    setItems(data.items)
    setTotalPages(data.pagination.totalPages)
    setLoading(false)
  }

  const handleSearch = () => {
    setPage(1)
    loadItems()
  }

  const handleViewDetails = (id: string) => {
    router.push(`/workshop/${id}`)
  }

  const getRatingPercentage = (item: WorkshopItem) => {
    const total = item.votesUp + item.votesDown
    if (total === 0) return 0
    return Math.round((item.votesUp / total) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Steam Workshop 浏览</h1>
        <p className="text-muted-foreground">
          浏览 Left 4 Dead 2 创意工坊地图，发现精彩内容
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="搜索地图名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            搜索
          </Button>
        </div>

        <Tabs value={sort} onValueChange={(v) => setSort(v as any)}>
          <TabsList>
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              最受欢迎
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              最新发布
            </TabsTrigger>
            <TabsTrigger value="trend" className="gap-2">
              趋势
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 地图列表 */}
      {loading ? (
        <div className="text-center py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          未找到地图
        </div>
      ) : (
        <>
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
                  {/* 收录状态标签 */}
                  {item.localMap && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      已收录 ⭐{item.localMap.averageRating.toFixed(1)}
                    </div>
                  )}
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
                      查看详情
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

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <div className="flex items-center px-4">
                第 {page} / {totalPages} 页
              </div>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
