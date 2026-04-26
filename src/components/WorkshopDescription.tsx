'use client'

import { useEffect, useRef } from 'react'

interface WorkshopDescriptionProps {
  description: string
}

/**
 * 清理并转换 Steam Workshop 描述中的 BBCode
 */
function processWorkshopDescription(description: string): string {
  if (!description) return ''
  
  let html = description
    // 标准化换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    
    // 处理 [h1]-[h6] 标题
    .replace(/\[h1\](.*?)\[\/h1\]/gi, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\[h2\](.*?)\[\/h2\]/gi, '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>')
    .replace(/\[h3\](.*?)\[\/h3\]/gi, '<h3 class="text-lg font-bold mt-3 mb-2">$1</h3>')
    .replace(/\[h4\](.*?)\[\/h4\]/gi, '<h4 class="text-base font-bold mt-2 mb-1">$1</h4>')
    .replace(/\[h5\](.*?)\[\/h5\]/gi, '<h5 class="text-sm font-bold mt-2 mb-1">$1</h5>')
    .replace(/\[h6\](.*?)\[\/h6\]/gi, '<h6 class="text-xs font-bold mt-2 mb-1">$1</h6>')
    
    // 处理 [b] 加粗
    .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
    
    // 处理 [i] 斜体
    .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
    
    // 处理 [u] 下划线
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    
    // 处理 [s] 删除线
    .replace(/\[s\](.*?)\[\/s\]/gi, '<s>$1</s>')
    
    // 处理 [strike] 删除线
    .replace(/\[strike\](.*?)\[\/strike\]/gi, '<s>$1</s>')
    
    // 处理 [url] 链接
    .replace(/\[url=(https?:\/\/[^\]]+)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$2</a>')
    .replace(/\[url\](https?:\/\/[^\[]+)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    
    // 处理 [img] 图片 - 只处理有效的 URL
    .replace(/\[img\](https?:\/\/[^\s\[]+)\[\/img\]/gi, '<img src="$1" alt="Workshop image" class="max-w-full h-auto rounded-lg my-2" loading="lazy" />')
    
    // 移除无效的 [img] 标签
    .replace(/\[img\]\s*\[\/img\]/gi, '')
    .replace(/\[img\]\s+(true|false)\s*\[\/img\]/gi, '')
    .replace(/\[img\]\s*\{.*?\}\s*\[\/img\]/gi, '')
    .replace(/\[img\]\s*(?:https?:\/\/)?\s*\[\/img\]/gi, '')
    
    // 处理 [list] 列表
    .replace(/\[list\]/gi, '<ul class="list-disc ml-6 my-2">')
    .replace(/\[\/list\]/gi, '</ul>')
    .replace(/\[\*\]/g, '<li>')
    // 修复 </li> 后面紧跟 <li> 的情况
    .replace(/<\/li><li>/g, '</li>\n<li>')
    // 为没有闭合的 <li> 添加 </li>
    .replace(/<li>([^<]*)(?=<li>|<\/ul>|$)/g, '<li>$1</li>')
    
    // 处理 [spoiler]
    .replace(/\[spoiler\]/gi, '<div class="mt-4 p-2 bg-muted rounded"><strong>Tags:</strong> ')
    .replace(/\[\/spoiler\]/gi, '</div>')
    
    // 处理等号加粗格式 =text
    .replace(/^=(.+)$/gm, '<strong>$1</strong>')
    
    // 处理换行符为 <br>
    .replace(/\n/g, '<br />')
    
    // 清理多余的 <br>
    .replace(/(<br \s*\/?>\s*){3,}/g, '<br /><br />')
    
    // 转义剩余的 [ 和 ]
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
  
  return html
}

/**
 * Workshop 描述渲染组件
 * 使用 BBob 库解析 Steam BBCode 格式
 */
export function WorkshopDescription({ description }: WorkshopDescriptionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  if (!description) {
    return <p className="text-muted-foreground text-sm italic">暂无描述</p>
  }

  // 处理并转换 BBCode 为 HTML
  const htmlContent = processWorkshopDescription(description)

  // 组件挂载后，移除所有空 src 的 img 元素
  useEffect(() => {
    if (containerRef.current) {
      const images = containerRef.current.querySelectorAll('img')
      images.forEach(img => {
        const src = img.getAttribute('src')
        // 移除所有无效的图片
        if (!src || 
            src.trim() === '' || 
            src === window.location.href ||
            src === 'about:blank') {
          console.warn('[WorkshopDescription] Removing invalid image with src:', src)
          img.remove()
        }
      })
      
      // 为所有图片添加样式
      const allImages = containerRef.current.querySelectorAll('img')
      allImages.forEach(img => {
        if (!img.classList.contains('max-w-full')) {
          img.classList.add('max-w-full', 'h-auto', 'rounded-lg', 'my-2')
          img.setAttribute('loading', 'lazy')
        }
      })
    }
  }, [htmlContent])
  return (
    <div 
      ref={containerRef} 
      className="text-sm leading-relaxed space-y-1"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
