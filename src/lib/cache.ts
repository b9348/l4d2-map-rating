/**
 * EdgeOne Pages/Functions KV 缓存封装
 * 用于减少数据库查询压力，提升 API 响应速度
 *
 * EdgeOne KV 特性：
 * - 键值对存储，值最大 25MB
 * - 支持 TTL（秒）
 * - 边缘节点本地读取，延迟极低
 */

// 简化 KV 接口定义，避免依赖 @cloudflare/workers-types
interface SimpleKV {
  get(key: string, type: 'json'): Promise<unknown>;
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// EdgeOne Pages Functions 提供的全局 KV 绑定
// 需要在 edgeone 控制台配置 KV 命名空间绑定到环境变量 MAP_CACHE
declare global {
  var MAP_CACHE: SimpleKV | undefined;
}

const DEFAULT_TTL = 300; // 默认缓存 5 分钟

function getKV(): SimpleKV | null {
  // 优先使用 EdgeOne Pages Functions 绑定的 KV
  if (typeof globalThis !== 'undefined' && (globalThis as any).MAP_CACHE) {
    return (globalThis as any).MAP_CACHE;
  }
  // 兼容 Cloudflare Pages
  if (typeof globalThis !== 'undefined' && (globalThis as any).env?.MAP_CACHE) {
    return (globalThis as any).env.MAP_CACHE;
  }
  return null;
}

/**
 * 从缓存获取数据
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const kv = getKV();
  if (!kv) return null;

  try {
    const data = await kv.get(key, 'json');
    return data as T;
  } catch {
    return null;
  }
}

/**
 * 写入缓存
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  const kv = getKV();
  if (!kv) return;

  try {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds,
    });
  } catch {
    // 缓存写入失败不影响主流程
  }
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;

  try {
    await kv.delete(key);
  } catch {
    // 删除失败忽略
  }
}

/**
 * 按前缀批量删除缓存（用于数据变更后清除相关缓存）
 */
export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;

  try {
    // EdgeOne KV 不支持 list，这里用常见的 key 模式清除
    // 实际生产环境可以维护一个 key 索引
    const keys = [
      'stats',
      'maps:list:home',
      'maps:list:search:',
      'maps:list:sort:',
    ];

    for (const key of keys) {
      if (key.startsWith(prefix) || prefix === 'all') {
        await kv.delete(key).catch(() => {});
      }
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 缓存包装器：先读缓存，未命中则执行函数并写入缓存
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  // 先尝试读缓存
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 执行查询
  const data = await fetcher();

  // 写入缓存（异步，不阻塞返回）
  setCache(key, data, ttlSeconds).catch(() => {});

  return data;
}
