'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { RatingStars } from './RatingStars'
import { MapData } from '@/types'
import { cn } from '@/lib/utils'

interface MapCardProps {
  map: MapData
  className?: string
}

export function MapCard({ map, className }: MapCardProps) {
  const firstImage = map.images && map.images.length > 0 ? map.images[0] : null
  const displayName = map.nameZh || map.nameEn || '未命名地图'
  
  return (
    <Link href={`/maps/${map.id}`} prefetch={true}>
      <Card className={cn(
        'group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        'bg-white dark:bg-gray-800 border-border/70 dark:border-border/50',
        className
      )}>
        {/* 图片区域 */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
          {firstImage ? (
            <img
              src={firstImage}
              alt={displayName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              暂无图片
            </div>
          )}
        </div>
        
        {/* 内容区域 */}
        <CardContent className="p-4">
          {/* 标题 */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900 dark:text-gray-100">
            {displayName}
          </h3>
          
          {/* 评分信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RatingStars rating={Math.round(map.averageRating)} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {map.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {map.ratingCount} 条评价
            </span>
          </div>
          
          {/* 上传者信息 */}
          {map.submitter && (
            <div className="mt-3 pt-3 border-t border-border/50 dark:border-border/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                by {map.submitter.name || '匿名用户'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
