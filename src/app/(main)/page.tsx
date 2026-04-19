'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { MapGrid } from '@/components/MapGrid'
import { SearchFilter } from '@/components/SearchFilter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight, Star, Users, MapIcon } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HomePage() {
  const [params, setParams] = useState({ page: 1, search: '', sortBy: 'newest' })
  
  const { data, isLoading } = useSWR(
    `/api/maps?page=${params.page}&search=${params.search}&sortBy=${params.sortBy}`,
    fetcher,
    { revalidateOnFocus: false }
  )
  
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <Badge variant="secondary" className="mb-4">
          Left 4 Dead 2
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          L4D2 地图推荐评分站
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          发现、分享和评价精彩的自定义地图。与全球玩家一起探索无限可能。
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link href="/maps/submit">
            <Button size="lg" className="gap-2">
              提交地图
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            了解更多
          </Button>
        </div>
        
        {/* 统计信息 */}
        <div className="flex justify-center gap-8 pt-8 text-sm">
          <div className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <span>100+ 地图</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>1000+ 评分</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <span>500+ 玩家</span>
          </div>
        </div>
      </section>
      
      {/* 搜索和过滤 */}
      <SearchFilter onFilter={setParams} />
      
      {/* 地图列表 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {params.search ? `搜索结果` : '热门地图'}
          </h2>
          {data?.pagination && (
            <span className="text-sm text-muted-foreground">
              共 {data.pagination.total} 张地图
            </span>
          )}
        </div>
        
        <MapGrid maps={data?.maps} loading={isLoading} />
        
        {/* 分页提示 */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              显示第 {((params.page - 1) * 12) + 1}-{Math.min(params.page * 12, data.pagination.total)} 条，
              共 {data.pagination.total} 条
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
