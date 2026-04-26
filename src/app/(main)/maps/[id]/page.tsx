'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RatingStars } from '@/components/RatingStars'
import { RatingModal } from '@/components/RatingModal'
import { ImageGallery } from '@/components/ImageGallery'
import { ImageCarousel } from '@/components/ImageCarousel'
import { WorkshopDescription } from '@/components/WorkshopDescription'
import { Star, Calendar, User, Edit2, ExternalLink, Gamepad2, Save, X, Languages } from 'lucide-react'
import { api } from '@/lib/http'
import { useAuth } from '@/lib/auth-context'
import { getGuestId } from '@/lib/guest-id'
import { toast } from 'sonner'

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
    workshopId: string | null
    steamData: string | null
    submitterId: string
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
  guestId: string | null
  createdAt: string
  updatedAt: string
  user?: {
    name: string | null
    avatar: string | null
  }
}

const ratingsFetcher = (url: string) => api.get<Rating[]>(url)

export default function MapDetailPage() {
  const params = useParams()
  const mapId = params.id as string
  const { session } = useAuth()

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    nameZh: '',
    nameEn: '',
    description: '',
  })

  const { data: mapData, isLoading: mapLoading, mutate: mutateMap } = useSWR(
    mapId ? `/api/maps?id=${mapId}` : null,
    fetcher
  )

  const { data: ratings, mutate: mutateRatings } = useSWR(
    mapId ? `/api/ratings?mapId=${mapId}` : null,
    ratingsFetcher
  )

  const userRating = useMemo(() => {
    if (!ratings?.length) return null

    if (session?.user?.id) {
      return ratings.find(r => r.userId === session.user.id) || null
    }

    const guestId = getGuestId()
    if (guestId) {
      return ratings.find(r => r.guestId === guestId) || null
    }

    return null
  }, [ratings, session])

  const map = mapData?.maps?.[0]
  
  // 判断当前用户是否为上传者
  const isOwner = session?.user?.id && map && session.user.id === map.submitterId
  
  // 进入编辑模式时初始化表单
  const handleStartEdit = () => {
    if (map) {
      setEditForm({
        nameZh: map.nameZh || '',
        nameEn: map.nameEn || '',
        description: map.description || '',
      })
      setIsEditMode(true)
    }
  }
  
  // 保存编辑
  const handleSaveEdit = async () => {
    if (!mapId) return
    
    setIsSaving(true)
    try {
      await api.put(`/api/maps/${mapId}`, editForm)
      toast.success('保存成功')
      setIsEditMode(false)
      // 刷新数据
      mutateMap()
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setIsSaving(false)
    }
  }
  
  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false)
  }

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

  const handleOpenRatingModal = (edit = false) => {
    setIsEditMode(edit)
    setIsRatingModalOpen(true)
  }

  const handleRatingSuccess = () => {
    mutateRatings()
    mutateMap()
  }

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
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      编辑地图信息
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? '保存中...' : '保存'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                        <X className="h-4 w-4 mr-1" />
                        取消
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="nameZh">中文名称</Label>
                      <Input
                        id="nameZh"
                        value={editForm.nameZh}
                        onChange={(e) => setEditForm({ ...editForm, nameZh: e.target.value })}
                        placeholder="输入中文地图名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameEn">英文名称</Label>
                      <Input
                        id="nameEn"
                        value={editForm.nameEn}
                        onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                        placeholder="输入英文地图名称"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-2xl leading-tight">{displayName}</CardTitle>
                      {map.nameZh && map.nameEn && (
                        <p className="text-muted-foreground text-sm">{map.nameEn}</p>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                        className="shrink-0"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    )}
                  </div>
                </div>
              )}
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

              {/* 用户已评分提示 */}
              {userRating && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">我的评分:</span>
                      <RatingStars rating={userRating.score} size="sm" />
                      <span className="font-medium">{userRating.score} 星</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenRatingModal(true)}
                      className="h-8 gap-1"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      修改
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* 来源信息 - 如果从创意工坊导入 */}
              {map.workshopId ? (
                <div>
                  <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    来源信息
                  </h3>
                  <Badge variant="outline" className="mb-3">
                    来自 Steam 创意工坊
                  </Badge>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => 
                        window.open(
                          `https://steamcommunity.com/sharedfiles/filedetails/?id=${map.workshopId}`,
                          '_blank'
                        )
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      查看创意工坊页面
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => 
                        window.location.href = `/workshop/${map.workshopId}`
                      }
                    >
                      <Gamepad2 className="h-4 w-4" />
                      在本站浏览
                    </Button>
                  </div>
                </div>
              ) : (
                /* 非创意工坊导入时显示上传者 */
                map.submitter && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                )
              )}

              <Separator />

              {/* 元信息 */}
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>发布于: {new Date(map.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>

              {/* 评分按钮 */}
              <Button
                onClick={() => handleOpenRatingModal(false)}
                size="lg"
                className="w-full gap-2 mt-2"
              >
                <Star className="h-5 w-5" />
                {userRating ? '重新评分' : '评分'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 描述卡片 - 独立显示 */}
      {(map.description || isEditMode) && (
        <Card>
          <CardHeader>
            <CardTitle>地图描述</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="description">描述内容 (支持 BBCode)</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="输入地图描述，支持 BBCode 格式"
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  支持格式: [b]加粗[/b], [i]斜体[/i], [url]链接[/url], [img]图片[/img], [h1]标题[/h1] 等
                </p>
              </div>
            ) : (
              <WorkshopDescription description={map.description || ''} />
            )}
          </CardContent>
        </Card>
      )}

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
        onSuccess={handleRatingSuccess}
        initialScore={isEditMode && userRating ? userRating.score : 0}
        initialComment={isEditMode && userRating ? (userRating.comment || '') : ''}
        isEdit={isEditMode}
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
