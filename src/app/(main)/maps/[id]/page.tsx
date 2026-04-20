'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RatingStars } from '@/components/RatingStars'
import { RatingModal } from '@/components/RatingModal'
import { ImageGallery } from '@/components/ImageGallery'
import { ImageCarousel } from '@/components/ImageCarousel'
import { Star, Calendar, User } from 'lucide-react'
import { api } from '@/lib/http'

interface MapDetailResponse {
  maps: Array<{
    id: string
    nameZh: string | null
    nameEn: string | null
    description: string | null
    images: string[]
    averageRating: number
    ratingCount: number
    createdAt: string
    submitter: {
      name: string | null
      avatar: string | null
    }
  }>
}

const fetcher = (url: string) => api.get<MapDetailResponse>(url)

interface Rating {
  id: string
  score: number
  comment: string | null
  userId: string | null
  createdAt: string
  user?: {
    name: string | null
    avatar: string | null
  }
}

const ratingsFetcher = (url: string) => api.get<Rating[]>(url)

export default function MapDetailPage() {
  const params = useParams()
  const mapId = params.id as string

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // 获取地图详情
  const { data: mapData, isLoading: mapLoading } = useSWR(
    mapId ? `/api/maps?id=${mapId}` : null,
    fetcher
  )

  // 获取评分列表
  const { data: ratings, mutate: mutateRatings } = useSWR(
    mapId ? `/api/ratings?mapId=${mapId}` : null,
    ratingsFetcher
  )

  const map = mapData?.maps?.[0]

  if (mapLoading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!map) {
    return <div className="text-center py-12">地图不存在</div>
  }

  const displayName = map.nameZh || map.nameEn || '未命名地图'
  const images = typeof map.images === 'string' ? JSON.parse(map.images) : map.images

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
    setIsImageGalleryOpen(true)
  }

  const reviewRatings = ratings?.filter((r: any) => r.comment && r.comment.trim().length > 0) || []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 顶部区域：图片轮播 + 地图信息并排 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左侧：图片轮播 */}
        <div className="lg:col-span-3">
          <ImageCarousel
            images={images}
            alt={displayName}
            onImageClick={handleImageClick}
          />
        </div>

        {/* 右侧：地图信息卡片 */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl leading-tight">{displayName}</CardTitle>
                {map.nameZh && map.nameEn && (
                  <p className="text-muted-foreground text-sm">{map.nameEn}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 评分统计 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <RatingStars rating={Math.round(map.averageRating)} size="lg" />
                  <span className="text-3xl font-bold">{map.averageRating.toFixed(1)}</span>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {map.ratingCount} 条评价
                </Badge>
              </div>

              <Separator />

              {/* 描述 */}
              {map.description ? (
                <div>
                  <h3 className="font-semibold mb-2 text-sm">地图描述</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap line-clamp-6">
                    {map.description}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">暂无描述</p>
              )}

              <Separator />

              {/* 元信息 */}
              <div className="space-y-3 text-sm text-muted-foreground">
                {map.submitter && (
                  <div className="flex items-center gap-2">
                    {map.submitter.avatar ? (
                      <img
                        src={map.submitter.avatar}
                        alt={map.submitter.name || '上传者头像'}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span>上传者: {map.submitter.name || '匿名用户'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>发布于: {new Date(map.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>

              {/* 评分按钮 */}
              <Button
                onClick={() => setIsRatingModalOpen(true)}
                size="lg"
                className="w-full gap-2 mt-2"
              >
                <Star className="h-5 w-5" />
                评分
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 评价列表 - 只显示有评论的评价 */}
      {reviewRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>玩家评价 ({reviewRatings.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewRatings.map((rating: any) => (
              <div key={rating.id} className="border-b border-border/50 pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {rating.user && (
                      <>
                        {rating.user.avatar ? (
                          <img
                            src={rating.user.avatar}
                            alt={rating.user.name || '用户头像'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {rating.user.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{rating.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(rating.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <RatingStars rating={rating.score} size="sm" />
                </div>
                <p className="text-muted-foreground mt-2">{rating.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 评分弹窗 */}
      <RatingModal
        mapId={mapId}
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        onSuccess={() => {
          mutateRatings()
        }}
      />

      {/* 图片画廊弹窗 */}
      <ImageGallery
        images={images}
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        initialIndex={selectedImageIndex}
      />
    </div>
  )
}
