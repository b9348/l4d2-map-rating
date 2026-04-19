'use client'

import { MapCard } from './MapCard'
import { Skeleton } from '@/components/ui/skeleton'
import { MapData } from '@/types'

interface MapGridProps {
  maps?: MapData[]
  loading?: boolean
}

export function MapGrid({ maps, loading }: MapGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  
  if (!maps || maps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          暂无地图数据
        </p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {maps.map((map) => (
        <MapCard key={map.id} map={map} />
      ))}
    </div>
  )
}
