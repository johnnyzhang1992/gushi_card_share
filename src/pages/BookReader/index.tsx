import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import HTMLFlipBook from 'react-pageflip'
import { getBook, saveBook, type Book } from '../../utils/db/bookDb'
import { parseMarkdown, type TOCItem } from '../../utils/markdownParser'

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [content, setContent] = useState('')
  const [toc, setToc] = useState<TOCItem[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [showTOC, setShowTOC] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const flipBookRef = useRef<any>(null)
  const [printPages, setPrintPages] = useState<string[]>([])

  useEffect(() => {
    if (id) loadBook(id)
    // 组件卸载时恢复原始标题
    return () => {
      document.title = '古诗卡片分享'
    }
  }, [id])

  useEffect(() => {
    const updateSize = () => {
      // 检测是否是移动端（屏幕宽度 <= 768px）
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)

      // A4 宽高比 1:1.414（宽:高）
      const ASPECT_RATIO = 1.414
      const availableHeight = window.innerHeight - 48 - 40 - 32
      const availableWidth = window.innerWidth - 64
      // 单页宽度
      const pageWidth = Math.floor(availableHeight / ASPECT_RATIO)

      if (mobile) {
        // 移动端：单页模式，宽度不超过屏幕
        const finalPageWidth = Math.min(pageWidth, availableWidth)
        setContainerSize({
          width: finalPageWidth,
          height: Math.floor(finalPageWidth * ASPECT_RATIO),
        })
      } else {
        // PC端：双页模式，宽度不超过屏幕一半
        const maxWidth = Math.floor(availableWidth / 2)
        const finalPageWidth = Math.min(pageWidth, maxWidth)
        setContainerSize({
          width: finalPageWidth,
          height: Math.floor(finalPageWidth * ASPECT_RATIO),
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [showEditor])

  useEffect(() => {
    if (content) {
      const { html, toc: parsedToc } = parseMarkdown(content)
      setToc(parsedToc)
      paginateContent(html)
      // 为打印重新分页
      paginateForPrint(html)
    }
  }, [content, containerSize])

  const paginateForPrint = (html: string) => {
    const padding = 40
    // A4 尺寸：210mm x 297mm，按 96 DPI 换算为像素
    const A4_WIDTH = 794
    const A4_HEIGHT = 1123
    const printWidth = A4_WIDTH - padding * 2
    const printHeight = A4_HEIGHT - padding * 2

    // 调试：打印计算值
    console.log('=== Print Pagination Debug ===')
    console.log('A4 width:', A4_WIDTH, 'A4 height:', A4_HEIGHT)
    console.log('printWidth:', printWidth)
    console.log('printHeight:', printHeight)
    console.log('availableHeight (printHeight - 100):', printHeight - 100)
    console.log('============================')

    const tempDiv = document.createElement('div')
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${printWidth}px;
      font-size: 15px;
      line-height: 1.8;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #1f2937;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `
    document.body.appendChild(tempDiv)

    // 可用高度，留足页眉页脚空间
    const availableHeight = printHeight - 100
    const atoms = splitIntoAtoms(html)
    const newPages: string[] = []
    let currentHTML = ''

    // 辅助函数：测量 HTML 高度
    const measureHeight = (htmlContent: string): number => {
      tempDiv.innerHTML = htmlContent
      return tempDiv.scrollHeight
    }

    for (const atom of atoms) {
      if (atom.startsWith('%%PAGE_BREAK%%') && currentHTML) {
        newPages.push(currentHTML)
        currentHTML = atom.replace('%%PAGE_BREAK%%', '')
        continue
      }

      const cleanAtom = atom.replace('%%PAGE_BREAK%%', '')
      const testHTML = currentHTML + cleanAtom
      const testHeight = measureHeight(testHTML)

      if (testHeight > availableHeight) {
        if (currentHTML) {
          newPages.push(currentHTML)
        }
        currentHTML = cleanAtom
      } else {
        currentHTML = testHTML
      }
    }

    if (currentHTML) {
      newPages.push(currentHTML)
    }

    document.body.removeChild(tempDiv)

    // 过滤掉只有空白内容的页面
    const filteredPages = newPages.filter(page => {
      const text = page.replace(/<[^>]+>/g, '').trim()
      return text.length > 0
    })

    setPrintPages(filteredPages.length > 0 ? filteredPages : ['<p style="text-align:center;color:#999;">请添加内容</p>'])
  }

  const loadBook = async (bookId: string) => {
    const data = await getBook(bookId)
    if (data) {
      setBook(data)
      setContent(data.content)
      setEditContent(data.content)
      // 设置文档标题为书名，PDF 导出时会用作文件名
      document.title = data.title || '古诗卡片分享'
    }
  }

  const paginateContent = (html: string) => {
    const padding = 32
    const contentWidth = containerSize.width - padding * 2

    const tempDiv = document.createElement('div')
    tempDiv.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${contentWidth}px;
      font-size: 15px;
      line-height: 1.8;
      padding: 0;
      box-sizing: border-box;
      font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
      color: #1f2937;
    `
    document.body.appendChild(tempDiv)

    const availableHeight = containerSize.height - padding * 2 - 20

    // 将 HTML 拆分为可独立渲染的原子单元
    const atoms = splitIntoAtoms(html)

    // 逐个填充页面
    const newPages: string[] = []
    let currentHTML = ''

    for (const atom of atoms) {
      // 检查是否是强制换页标记
      if (atom.startsWith('%%PAGE_BREAK%%') && currentHTML) {
        newPages.push(currentHTML)
        currentHTML = atom.replace('%%PAGE_BREAK%%', '')
        continue
      }

      const cleanAtom = atom.replace('%%PAGE_BREAK%%', '')
      tempDiv.innerHTML = currentHTML + cleanAtom
      const totalHeight = tempDiv.scrollHeight

      if (totalHeight > availableHeight && currentHTML) {
        newPages.push(currentHTML)
        currentHTML = cleanAtom
      } else {
        currentHTML += cleanAtom
      }
    }

    if (currentHTML) {
      newPages.push(currentHTML)
    }

    document.body.removeChild(tempDiv)

    // 过滤掉只有空白内容的页面
    const filteredPages = newPages.filter(page => {
      const text = page.replace(/<[^>]+>/g, '').trim()
      return text.length > 0
    })

    setPages(filteredPages.length > 0 ? filteredPages : ['<p style="text-align:center;color:#999;">请添加内容</p>'])
  }

  const splitIntoAtoms = (html: string): string[] => {
    const atoms: string[] = []

    // 先处理 blockquote
    let processedHtml = html
    const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi
    const blockquotes: string[] = []

    processedHtml = processedHtml.replace(blockquoteRegex, (_match, content) => {
      const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
      let pMatch
      const pContents: string[] = []
      while ((pMatch = pRegex.exec(content)) !== null) {
        pContents.push(pMatch[1])
      }
      const combined = pContents.join('<br>')
      blockquotes.push(combined)
      return `%%BLOCKQUOTE_${blockquotes.length - 1}%%`
    })

    // 按块级元素分割，保留所有内容
    const parts = processedHtml.split(/(?=<(?:h[1-6]|p|ul|ol|pre|div|hr|table|%%BLOCKQUOTE)[^>]*>)/i)

    for (let part of parts) {
      // 保留空行（空白字符）
      if (!part.trim() && !part.includes('%%BLOCKQUOTE')) {
        atoms.push('<p><br></p>')
        continue
      }

      if (!part.trim()) continue

      // 二级标题强制换页
      if (part.match(/^<h2[^>]*>/i)) {
        atoms.push(`%%PAGE_BREAK%%${part}`)
        continue
      }

      // 处理 blockquote 占位符
      const bqPlaceholderMatch = part.match(/%%BLOCKQUOTE_(\d+)%%/)
      if (bqPlaceholderMatch) {
        const index = parseInt(bqPlaceholderMatch[1])
        const content = blockquotes[index]
        const lines = content.split(/<br\s*\/?>/i)
        for (const line of lines) {
          const text = line.replace(/<[^>]+>/g, '').trim()
          if (text.length > 40) {
            const chunks = text.split(/(?<=[。])/)
            let currentText = ''
            for (const chunk of chunks) {
              if ((currentText + chunk).length > 40 && currentText) {
                atoms.push(`<blockquote><p>${currentText}</p></blockquote>`)
                currentText = chunk
              } else {
                currentText += chunk
              }
            }
            if (currentText) {
              atoms.push(`<blockquote><p>${currentText}</p></blockquote>`)
            }
          } else {
            atoms.push(line.trim() ? `<blockquote><p>${line}</p></blockquote>` : '<blockquote><p><br></p></blockquote>')
          }
        }
        continue
      }

      // 检查是否是段落
      const pMatch = part.match(/^<p[^>]*>([\s\S]*)<\/p>$/i)
      if (pMatch) {
        const content = pMatch[1]
        // 如果内容只有 <br>，保留空行
        if (content.trim() === '' || content.trim() === '<br>' || content.trim() === '<br/>') {
          atoms.push('<p><br></p>')
          continue
        }
        const lines = content.split(/<br\s*\/?>/i)
        for (const line of lines) {
          const text = line.replace(/<[^>]+>/g, '').trim()
          if (text.length > 40) {
            const chunks = text.split(/(?<=[。])/)
            let currentText = ''
            for (const chunk of chunks) {
              if ((currentText + chunk).length > 40 && currentText) {
                atoms.push(`<p>${currentText}</p>`)
                currentText = chunk
              } else {
                currentText += chunk
              }
            }
            if (currentText) {
              atoms.push(`<p>${currentText}</p>`)
            }
          } else {
            atoms.push(line.trim() ? `<p>${line}</p>` : '<p><br></p>')
          }
        }
      } else {
        atoms.push(part)
      }
    }

    return atoms
  }

  const handleSave = async () => {
    if (!book) return
    const updated = {
      ...book,
      content: editContent,
      updatedAt: Date.now(),
    }
    await saveBook(updated)
    setBook(updated)
    setContent(editContent)
    setShowEditor(false)
  }

  const handlePageFlip = (e: any) => {
    setCurrentPage(e.data)
  }

  const goToPage = (pageIndex: number) => {
    if (flipBookRef.current) {
      flipBookRef.current.pageFlip().flip(pageIndex)
    }
  }

  // 处理目录页，添加页码
  const processTocPage = (pageHtml: string): string => {
    // 检测是否包含目录列表
    if (!pageHtml.includes('<ul>') && !pageHtml.includes('<ol>')) return pageHtml

    // 提取列表项
    const liRegex = /<li[^>]*>(.*?)<\/li>/gi
    let match
    const items: { text: string; full: string }[] = []

    while ((match = liRegex.exec(pageHtml)) !== null) {
      items.push({ text: match[1].replace(/<[^>]+>/g, '').trim(), full: match[0] })
    }

    if (items.length === 0) return pageHtml

    // 为每个列表项查找页码
    let processedHtml = pageHtml
    for (const item of items) {
      // 规范化标题文本（去除特殊字符和空格）
      const normalizedTitle = item.text.replace(/[\/\(\)（）\[\]「」\s]+/g, '').toLowerCase()

      // 搜索包含该文本的页面
      const pageNum = pages.findIndex((p, idx) => {
        if (idx === 0) return false
        const text = p.replace(/<[^>]+>/g, '')
        const normalizedText = text.replace(/[\/\(\)（）\[\]「」\s]+/g, '').toLowerCase()
        // 完整匹配或包含标题的前8个字符
        return normalizedText.includes(normalizedTitle) ||
               (normalizedTitle.length > 5 && normalizedText.includes(normalizedTitle.substring(0, 8)))
      })

      const page_num = pageNum !== -1 ? pageNum + 1 : '-'

      // 替换列表项，添加虚线和页码
      const newLi = `<li style="display:flex;align-items:center;gap:4px;list-style:none;margin:4px 0">
        <span style="flex-shrink:0;max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${item.text}">${item.text}</span>
        <span style="flex:1;border-bottom:1px dashed #ccc;margin:0 4px"></span>
        <span style="flex-shrink:0;color:#999;font-size:12px;text-align:right">${page_num}</span>
      </li>`

      processedHtml = processedHtml.replace(item.full, newLi)
    }

    return processedHtml
  }

  const goToHeading = (headingId: string) => {
    const index = pages.findIndex((page) => page.includes(headingId))
    if (index !== -1) {
      goToPage(index)
    }
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/book')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-medium text-gray-800 truncate max-w-xs">{book.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className={`px-3 py-1 text-xs rounded ${showTOC ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            目录
          </button>
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-3 py-1 text-xs rounded ${showEditor ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            编辑
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1 text-xs rounded hover:bg-gray-100 text-gray-600"
          >
            导出PDF
          </button>
          <span className="text-xs text-gray-400">
            {currentPage + 1} / {pages.length}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* TOC Sidebar */}
        {showTOC && (
          <div className="w-48 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <div className="p-3">
              <h3 className="text-xs font-medium text-gray-500 mb-2">目录</h3>
              {toc.length === 0 ? (
                <p className="text-xs text-gray-400">无目录</p>
              ) : (
                <ul className="space-y-1">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => goToHeading(item.id)}
                      className="text-xs text-gray-600 hover:text-blue-500 cursor-pointer truncate"
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Editor / Reader */}
        {showEditor ? (
          <div className="flex-1 flex flex-col p-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1 w-full p-4 text-sm leading-relaxed border border-gray-300 rounded-lg outline-none resize-none font-mono"
              placeholder="输入 Markdown 内容..."
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setShowEditor(false); setEditContent(book.content) }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="flex-1 flex items-center justify-center p-4">
            {containerSize.width > 0 && (
              <div style={{ width: isMobile ? containerSize.width : containerSize.width * 2, height: containerSize.height }}>
                <HTMLFlipBook
                  ref={flipBookRef}
                  width={containerSize.width}
                  height={containerSize.height}
                  size="fixed"
                  showCover={false}
                  onFlip={handlePageFlip}
                  className="shadow-lg"
                  style={{ minHeight: 'unset', minWidth: 'unset' }}
                  startPage={0}
                  minWidth={containerSize.width}
                  maxWidth={containerSize.width}
                  minHeight={containerSize.height}
                  maxHeight={containerSize.height}
                  drawShadow={true}
                  flippingTime={1000}
                  usePortrait={isMobile}
                  startZIndex={0}
                  autoSize={false}
                  maxShadowOpacity={0.5}
                  mobileScrollSupport={true}
                  clickEventForward={true}
                  useMouseEvents={true}
                  swipeDistance={30}
                  showPageCorners={true}
                  disableFlipByClick={false}
                >
                {pages.map((page, i) => {
                  const processedPage = processTocPage(page)
                  return (
                    <div key={i} className="bg-white p-8 overflow-hidden relative" style={{ height: containerSize.height }}>
                      {/* 页眉 */}
                      <div className="absolute top-2 left-8 right-8 flex items-center justify-between text-xs text-gray-400">
                        <span>{book?.title || ''}</span>
                        <span>{i + 1}</span>
                      </div>
                      <div
                        className="text-sm leading-relaxed text-gray-800"
                        style={{ fontSize: '15px', lineHeight: '1.8' }}
                        dangerouslySetInnerHTML={{ __html: processedPage }}
                      />
                      <div className="absolute bottom-2 left-8 right-8 flex items-center justify-between text-xs text-gray-400">
                        <span>@学古诗</span>
                        <span>{i + 1}</span>
                        <span>xuegushi.com</span>
                      </div>
                    </div>
                  )
                })}
              </HTMLFlipBook>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {!showEditor && (
        <div className="h-10 bg-white border-t border-gray-200 flex items-center justify-center gap-4">
          <button
            onClick={() => goToPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600">
            {currentPage + 1} / {pages.length}
          </span>
          <button
            onClick={() => goToPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 打印用隐藏容器 */}
      <div id="print-container" className="print-container">
        {printPages.map((page, i) => (
          <div key={i} className="print-page">
            <div className="print-content">
              <div className="print-header">
                <span>{book?.title || ''}</span>
                <span>@学古诗</span>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: '15px', lineHeight: '1.8', color: '#1f2937', paddingTop: '24px' }}
                  dangerouslySetInnerHTML={{ __html: processTocPage(page) }}
                />
              </div>
              <div className="print-footer">
                <span>@学古诗</span>
                <span>{i + 1}</span>
                <span>xuegushi.com</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
