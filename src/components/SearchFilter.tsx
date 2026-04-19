'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface SearchFilterProps {
  onFilter: (params: { page: number; search: string; sortBy: string }) => void
}

export function SearchFilter({ onFilter }: SearchFilterProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  const handleSearch = () => {
    onFilter({ page: 1, search, sortBy })
  }
  
  const handleSortChange = (value: string) => {
    setSortBy(value)
    onFilter({ page: 1, search, sortBy: value })
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索地图名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        
        {/* 排序选择 */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">最新发布</SelectItem>
            <SelectItem value="rating">最高评分</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 搜索按钮 */}
        <Button onClick={handleSearch} className="sm:w-auto w-full">
          搜索
        </Button>
      </div>
    </div>
  )
}
