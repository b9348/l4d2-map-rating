/**
 * Steam Workshop API 工具库
 * 用于获取 L4D2 创意工坊数据
 */

const STEAM_API_KEY = process.env.STEAM_API_KEY
const L4D2_APP_ID = '550' // Left 4 Dead 2 的 Steam App ID
const HTTP_PROXY = process.env.HTTP_PROXY // 可选：HTTP 代理

if (!STEAM_API_KEY) {
  throw new Error('STEAM_API_KEY 环境变量未配置')
}

export interface WorkshopItem {
  publishedfileid: string
  title: string
  description: string
  creator: string
  time_created: number
  time_updated: number
  subscriptions: number
  favorited: number
  views: number
  preview_url: string
  file_url?: string
  tags?: Array<{ tag: string }>
  vote_data?: {
    score: number
    votes_up: number
    votes_down: number
  }
}

export interface WorkshopQueryResult {
  items: WorkshopItem[]
  total: number
}

/**
 * 获取单个 Workshop 物品详情
 */
export async function getWorkshopItemDetails(workshopId: string): Promise<WorkshopItem | null> {
  const url = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/'

  const formData = new URLSearchParams()
  formData.append('itemcount', '1')
  formData.append('publishedfileids[0]', workshopId)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`Steam API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const item = data.response?.publishedfiledetails?.[0]

    if (!item || item.result !== 1) {
      return null
    }

    return item
  } catch (error) {
    console.error('获取 Workshop 物品详情失败:', error)
    return null
  }
}

/**
 * 查询 Workshop 物品列表
 */
export async function queryWorkshopItems(options: {
  page?: number
  limit?: number
  sort?: 'popular' | 'recent' | 'trend'
  searchText?: string
}): Promise<WorkshopQueryResult> {
  const { page = 1, limit = 20, sort = 'popular', searchText } = options

  const url = 'https://api.steampowered.com/IPublishedFileService/QueryFiles/v1/'

  const params = new URLSearchParams({
    key: STEAM_API_KEY as string,
    appid: L4D2_APP_ID,
    numperpage: limit.toString(),
    page: page.toString(),
    return_vote_data: 'true',
    return_tags: 'true',
    return_previews: 'true',
    return_metadata: 'true',
  })

  // 排序方式
  if (sort === 'popular') {
    params.append('query_type', '0') // RankedByVote
  } else if (sort === 'recent') {
    params.append('query_type', '1') // RankedByPublicationDate
  } else if (sort === 'trend') {
    params.append('query_type', '3') // RankedByTrend
  }

  // 搜索文本
  if (searchText) {
    params.append('search_text', searchText)
  }

  let lastError: Error | null = null

  // 最多重试 3 次
  for (let i = 0; i < 3; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const response = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Steam API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      const publishedfiledetails = data.response?.publishedfiledetails || []
      const total = data.response?.total || 0

      return {
        items: publishedfiledetails,
        total,
      }
    } catch (error) {
      lastError = error as Error
      console.error(`查询 Workshop 物品失败 (尝试 ${i + 1}/3):`, error)
      if (i < 2) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
      }
    }
  }

  console.error('查询 Workshop 物品最终失败:', lastError)
  return { items: [], total: 0 }
}

/**
 * 从 Workshop URL 提取 ID
 */
export function extractWorkshopId(input: string): string | null {
  // 支持多种格式:
  // https://steamcommunity.com/sharedfiles/filedetails/?id=123456789
  // steam://url/CommunityFilePage/123456789
  // 123456789

  const urlMatch = input.match(/[?&]id=(\d+)/)
  if (urlMatch) {
    return urlMatch[1]
  }

  const steamProtocolMatch = input.match(/CommunityFilePage\/(\d+)/)
  if (steamProtocolMatch) {
    return steamProtocolMatch[1]
  }

  // 纯数字
  if (/^\d+$/.test(input.trim())) {
    return input.trim()
  }

  return null
}
