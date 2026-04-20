import { z } from 'zod'

export const mapSchema = z.object({
  nameZh: z.string().max(100).optional().or(z.literal('')),
  nameEn: z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
}).refine(data => {
  // 至少需要一个名称
  if ((!data.nameZh || data.nameZh.trim() === '') && (!data.nameEn || data.nameEn.trim() === '')) {
    return false
  }
  return true
}, {
  message: '至少需要填写中文或英文名称',
  path: ['nameZh'],
})

export const ratingSchema = z.object({
  mapId: z.string(),
  score: z.number().int().min(0).max(5),
  comment: z.string().max(500).optional().or(z.literal('')),
})

export type MapInput = z.infer<typeof mapSchema>
export type RatingInput = z.infer<typeof ratingSchema>
