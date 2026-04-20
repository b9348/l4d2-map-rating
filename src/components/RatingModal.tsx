'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RatingStars } from './RatingStars'
import { toast } from 'sonner'
import { api } from '@/lib/http'
import { ensureGuestId } from '@/lib/guest-id'

interface RatingModalProps {
  mapId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialScore?: number
  initialComment?: string
  isEdit?: boolean
}

export function RatingModal({ mapId, isOpen, onClose, onSuccess, initialScore = 0, initialComment = '', isEdit = false }: RatingModalProps) {
  const { session } = useAuth()
  const [score, setScore] = useState(initialScore)
  const [comment, setComment] = useState(initialComment)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setScore(initialScore)
      setComment(initialComment)
    }
  }, [isOpen, initialScore, initialComment])

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error('请选择评分')
      return
    }

    setIsSubmitting(true)

    const payload: Record<string, unknown> = {
      mapId,
      score,
      comment: session ? comment : undefined,
    }

    if (!session) {
      const guestId = await ensureGuestId()
      payload.guestId = guestId
    }

    const result = await api.post<{ message: string }>('/api/ratings', payload)

    toast.success(result.message)
    onSuccess?.()
    onClose()
    setScore(0)
    setComment('')
    setIsSubmitting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '修改评分' : '为地图评分'}</DialogTitle>
          <DialogDescription>
            {session
              ? '登录后可以留下评语,帮助其他玩家更好地了解这张地图'
              : '未登录用户只能打分,登录后可留下评语'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 星级评分 */}
          <div className="flex flex-col items-center gap-3">
            <label className="text-sm font-medium">评分</label>
            <RatingStars
              rating={score}
              interactive
              onRate={setScore}
              size="lg"
            />
            <span className="text-sm text-muted-foreground">
              {score > 0 ? `${score} 星` : '点击星星评分'}
            </span>
          </div>

          {/* 评语输入(仅登录用户) */}
          {session && (
            <div className="space-y-2">
              <label className="text-sm font-medium">评语 (可选)</label>
              <Textarea
                placeholder="分享你对这张地图的看法..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comment.length}/500
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || score === 0}>
            {isSubmitting ? '提交中...' : (isEdit ? '更新评分' : '提交评分')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
