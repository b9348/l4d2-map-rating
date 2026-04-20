'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageCarouselProps {
  images: string[]
  alt: string
  onImageClick?: (index: number) => void
}

export function ImageCarousel({ images, alt, onImageClick }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  const goPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  // 键盘左右箭头导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrevious()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrevious, goNext])

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) goNext()
    if (isRightSwipe) goPrevious()
  }

  // 鼠标滚轮切换
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY > 0) goNext()
    else goPrevious()
  }

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-video bg-muted rounded-xl flex items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-2">
          <ImageIcon className="w-12 h-12" />
          <span>暂无图片</span>
        </div>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className="space-y-3">
      {/* 主轮播区 */}
      <div
        className="relative aspect-video bg-black rounded-xl overflow-hidden group select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <img
          src={currentImage}
          alt={`${alt} - ${currentIndex + 1}`}
          className="w-full h-full object-contain cursor-zoom-in"
          onClick={() => onImageClick?.(currentIndex)}
          draggable={false}
        />

        {/* 左右切换按钮 - 桌面端显示 */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrevious() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
              aria-label="上一张"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
              aria-label="下一张"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* 图片计数 */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* 点击提示 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          点击查看大图
        </div>
      </div>

      {/* 缩略图导航 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                'relative flex-shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all',
                idx === currentIndex
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={img}
                alt={`${alt} 缩略图 ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
