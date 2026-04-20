import { toast } from 'sonner'

/**
 * 统一HTTP请求封装
 * - 自动处理JSON序列化
 * - 统一错误抛出(直接透传后端返回的错误信息)
 * - 支持自定义headers和options
 */

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  headers?: Record<string, string>
  body?: any
}

export class HttpError extends Error {
  status: number
  data: any

  constructor(status: number, message: string, data?: any) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.data = data
  }
}

export async function http<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...restOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      const error = new HttpError(
        response.status,
        data.error || data.message,
        data
      )
      // 全局错误拦截 - 自动显示toast
      toast.error(error.message)
      throw error
    }

    return data as T
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }
    // 网络错误或其他异常
    console.error('Request failed:', error)
    const httpError = new HttpError(
      0,
      error instanceof Error ? error.message : 'Unknown error',
      error
    )
    // 全局错误拦截 - 自动显示toast
    toast.error(httpError.message)
    throw httpError
  }
}

// 便捷方法
export const api = {
  get: <T>(url: string, options?: RequestOptions) => 
    http<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, body?: any, options?: RequestOptions) => 
    http<T>(url, { ...options, method: 'POST', body }),
  
  put: <T>(url: string, body?: any, options?: RequestOptions) => 
    http<T>(url, { ...options, method: 'PUT', body }),
  
  delete: <T>(url: string, options?: RequestOptions) => 
    http<T>(url, { ...options, method: 'DELETE' }),
}

/**
 * 安全的异步操作执行器
 * - 自动捕获错误
 * - 返回 [error, data] 元组
 * - 无需在组件内写 try-catch
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[Error | null, T | null]> {
  try {
    const data = await promise
    return [null, data]
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    return [err, null]
  }
}

/**
 * 统一的API响应处理器
 * - 返回处理结果
 * - 完全解耦错误判断逻辑
 */
export function handleApiResponse(
  error: Error | null,
  result: any
): { success: boolean; message?: string } {
  if (error) {
    return { success: false, message: error.message }
  }
  
  return { success: true, message: result?.message }
}
