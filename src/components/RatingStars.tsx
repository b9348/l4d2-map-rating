'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  interactive?: boolean
  onRate?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingStars({
  rating,
  maxRating = 5,
  interactive = false,
  onRate,
  size = 'md',
  className
}: RatingStarsProps) {
  const stars = []
  
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= rating
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
    
    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onRate?.(i)}
        className={cn(
          'transition-all duration-200',
          interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default',
          !interactive && 'pointer-events-none'
        )}
      >
        <Star
          className={cn(
            starSize,
            isFilled 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      </button>
    )
  }
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {stars}
    </div>
  )
}
