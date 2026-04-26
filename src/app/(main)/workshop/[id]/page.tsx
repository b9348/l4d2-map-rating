'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Star, Eye, Users, Heart, Download, ArrowLeft } from 'lucide-react'
import { api, safeAsync } from '@/lib/http'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { ImageCarousel } from '@/components/ImageCarousel'
import { ImageGallery } from '@/components/ImageGallery'
import { WorkshopDescription } from '@/components/WorkshopDescription'

/**
 * 从 BBCode 描述中提取所有图片 URL
 */
function extractImagesFromDescription(description: string): string[] {
  if (!description) return []
  
  const images: string[] = []
  const imgRegex = /\[img\]([\s\S]*?)\[\/img\]/g
  let match
  
  while ((match = imgRegex.exec(description)) !== null) {
    images.push(match[1].trim())
  }
  
  return images
}

interface WorkshopItemDetail {
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
  createdAt: number
  updatedAt: number
  tags: string[]
  fileUrl?: string
  localMap?: {
    id: string
    averageRating: number
    ratingCount: number
  } | null
}

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const { session } = useAuth()
  const [item, setItem] = useState<WorkshopItemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // 合并所有图片：预览图 + 描述中的图片
  const allImages = useMemo(() => {
    if (!item) return []
    const images = [item.previewUrl]
    const descriptionImages = extractImagesFromDescription(item.description)
    return [...images, ...descriptionImages]
  }, [item])

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsImageGalleryOpen(true)
  }

  useEffect(() => {
    loadItem()
  }, [unwrappedParams.id])

  const loadItem = async () => {
    setLoading(true)
    const [error, data] = await safeAsync(
      api.get<WorkshopItemDetail>(`/api/workshop/${unwrappedParams.id}`)
    )

    if (error || !data) {
      toast.error('加载失败: ' + (error?.message || '未知错误'))
      setLoading(false)
      return
    }

    setItem(data)
    setLoading(false)
  }

  const handleImport = async () => {
    if (!session) {
      toast.error('请先登录')
      router.push('/auth/signin')
      return
    }

    setImporting(true)
    const [error, data] = await safeAsync(
      api.post<{ message: string; mapId: string; existed: boolean }>(
        '/api/maps/import-from-workshop',
        { workshopId: unwrappedParams.id }
      )
    )

    setImporting(false)

    if (error || !data) {
      toast.error('导入失败: ' + (error?.message || '未知错误'))
      return
    }

    if (data.existed) {
      toast.success('该地图已存在，跳转到地图详情页')
    } else {
      toast.success('导入成功！')
    }

    router.push(`/maps/${data.mapId}`)
  }

  const getRatingPercentage = () => {
    if (!item) return 0
    const total = item.votesUp + item.votesDown
    if (total === 0) return 0
    return Math.round((item.votesUp / total) * 100)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">加载中...</div>
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">未找到该地图</p>
        <Button onClick={() => router.back()}>返回</Button>
      </div>
    )
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：图片和基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 图片轮播 */}
          <ImageCarousel
            images={allImages}
            alt={item.title}
            onImageClick={handleImageClick}
          />

          {/* 描述 */}
          <Card>
            <CardHeader>
              <CardTitle>地图描述</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkshopDescription description={item.description} />
            </CardContent>
          </Card>

          {/* 标签 */}
          {item.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>标签</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：操作和统计 */}
        <div className="space-y-6">
          {/* 标题 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 操作按钮 */}
              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={handleImport}
                  disabled={importing}
                >
                  <Download className="h-4 w-4" />
                  {importing ? '导入中...' : item.localMap ? '前往评分' : '导入到评分系统'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    window.open(
                      `https://steamcommunity.com/sharedfiles/filedetails/?id=${item.id}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                  在 Steam 中打开
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    window.open(`steam://url/CommunityFilePage/${item.id}`, '_blank')
                  }
                >
                  在 Steam 客户端中打开
                </Button>
              </div>

              {/* 本站评分 */}
              {item.localMap && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">本站评分</div>
                  <div className="text-2xl font-bold text-green-500">
                    ⭐ {item.localMap.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.localMap.ratingCount} 人评分
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Steam 统计 */}
          <Card>
            <CardHeader>
              <CardTitle>Steam 数据</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">订阅数</span>
                </div>
                <span className="font-semibold">{item.subscriptions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">收藏数</span>
                </div>
                <span className="font-semibold">{item.favorites.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">浏览量</span>
                </div>
                <span className="font-semibold">{item.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">好评率</span>
                </div>
                <span className="font-semibold">{getRatingPercentage()}%</span>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div>创建时间: {formatDate(item.createdAt)}</div>
                <div>更新时间: {formatDate(item.updatedAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* 图片画廊弹窗 */}
      <ImageGallery
        images={allImages}
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        initialIndex={selectedImageIndex}
      />
    </div>
  )
}
