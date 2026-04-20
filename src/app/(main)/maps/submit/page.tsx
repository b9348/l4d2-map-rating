'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mapSchema, type MapInput } from '@/lib/validations'
import { toast } from 'sonner'
import { ExternalLink, Plus, X } from 'lucide-react'
import { api, safeAsync } from '@/lib/http'

export default function SubmitMapPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [images, setImages] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MapInput>({
    resolver: zodResolver(mapSchema),
  })
  
  const nameZh = watch('nameZh')
  const nameEn = watch('nameEn')
  
  // 检查登录状态
  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }
  
  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-lg mb-4">请先登录后再提交地图</p>
        <Button onClick={() => router.push('/auth/signin')}>
          去登录
        </Button>
      </div>
    )
  }
  
  const handleAddImage = () => {
    if (images.length < 9) {
      setImages([...images, ''])
    }
  }
  
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }
  
  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images]
    newImages[index] = value
    setImages(newImages)
  }
  
  const openImageHost = () => {
    window.open('https://www.boltp.com/', '_blank')
  }
  
  const onSubmit = async (data: MapInput) => {
    const validImages = images.filter(img => img.trim() !== '')

    if (validImages.length === 0) {
      toast.error('请至少添加一张图片')
      return
    }

    setIsSubmitting(true)

    const [error, result] = await safeAsync(
      api.post<{ message: string }>('/api/maps', {
        ...data,
        images: validImages,
      })
    )

    setIsSubmitting(false)

    if (error) return

    toast.success(result!.message)
    router.push('/')
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">提交新地图</CardTitle>
          <CardDescription>
            分享您喜爱的 L4D2 自定义地图，帮助其他玩家发现精彩内容
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 中文名称 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                中文名称 <span className="text-muted-foreground">(可选)</span>
              </label>
              <Input
                placeholder="例如：死亡中心重制版"
                {...register('nameZh')}
                disabled={isSubmitting}
              />
              {errors.nameZh && (
                <p className="text-sm text-red-500">{errors.nameZh.message}</p>
              )}
            </div>
            
            {/* 英文名称 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                英文名称 <span className="text-muted-foreground">(可选)</span>
              </label>
              <Input
                placeholder="例如：Dead Center Remastered"
                {...register('nameEn')}
                disabled={isSubmitting}
              />
              {errors.nameEn && (
                <p className="text-sm text-red-500">{errors.nameEn.message}</p>
              )}
              {(!errors.nameZh && !errors.nameEn) && 
               !nameZh && !nameEn && (
                <p className="text-xs text-amber-500">
                  至少需要填写中文或英文名称之一
                </p>
              )}
            </div>
            
            {/* 描述 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                地图描述 <span className="text-muted-foreground">(可选)</span>
              </label>
              <Textarea
                placeholder="介绍这张地图的特色、玩法、注意事项等..."
                {...register('description')}
                rows={5}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
            
            {/* 图片URLs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  地图截图 <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openImageHost}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  推荐图床
                </Button>
              </div>
              
              <div className="space-y-3">
                {images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`图片 URL ${index + 1}`}
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      disabled={isSubmitting}
                    />
                    {images.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {images.length < 9 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddImage}
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                  添加更多图片 (最多9张)
                </Button>
              )}
              
              <p className="text-xs text-muted-foreground">
                建议使用稳定的图床服务，如 sm.ms、imgur 等
              </p>
            </div>
            
            {/* 提交按钮 */}
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '提交地图'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
