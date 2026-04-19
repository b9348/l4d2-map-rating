import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      steamId?: string | null
    } & DefaultSession["user"]
  }
}

export interface MapData {
  id: string
  nameZh: string | null
  nameEn: string | null
  description: string | null
  images: string[]
  submitterId: string
  averageRating: number
  ratingCount: number
  createdAt: Date
  updatedAt: Date
  submitter?: {
    name: string | null
    avatar: string | null
  }
  _count?: {
    ratings: number
  }
}

export interface RatingData {
  id: string
  score: number
  comment: string | null
  mapId: string
  userId: string | null
  createdAt: Date
  user?: {
    name: string | null
    avatar: string | null
  }
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}
