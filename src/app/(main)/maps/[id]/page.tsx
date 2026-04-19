'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RatingStars } from '@/components/RatingStars'
import { RatingModal } from '@/components/RatingModal'
import { ImageGallery } from '@/components/ImageGallery'
import { Star, Calendar, User } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

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
    fetcher
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
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 图片画廊 */}
      {images && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img: string, index: number) => (
            <div
              key={index}
              onClick={() => handleImageClick(index)}
              className="relative aspect-video cursor-pointer overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            >
              <Image
                src={img}
                alt={`${displayName} - ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* 地图信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{displayName}</CardTitle>
              {map.nameZh && map.nameEn && (
                <p className="text-muted-foreground">{map.nameEn}</p>
              )}
            </div>
            <Button onClick={() => setIsRatingModalOpen(true)} size="lg" className="gap-2">
              <Star className="h-5 w-5" />
              评分
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 评分统计 */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <RatingStars rating={Math.round(map.averageRating)} size="lg" />
              <span className="text-2xl font-bold">{map.averageRating.toFixed(1)}</span>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {map.ratingCount} 条评价
            </Badge>
          </div>
          
          <Separator />
          
          {/* 描述 */}
          {map.description && (
            <div>
              <h3 className="font-semibold mb-2">地图描述</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{map.description}</p>
            </div>
          )}
          
          <Separator />
          
          {/* 元信息 */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {map.submitter && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>上传者: {map.submitter.name || '匿名用户'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>发布于: {new Date(map.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 评价列表 */}
      {ratings && ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>玩家评价 ({ratings.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.map((rating: any) => (
              <div key={rating.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {rating.user && (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {rating.user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
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
                {rating.comment && (
                  <p className="text-muted-foreground mt-2">{rating.comment}</p>
                )}
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
