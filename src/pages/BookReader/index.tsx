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
  const containerRef = useRef<HTMLDivElement>(null)
  const flipBookRef = useRef<any>(null)

  useEffect(() => {
    if (id) loadBook(id)
  }, [id])

  useEffect(() => {
    const updateSize = () => {
      // A4 宽高比 1:1.414（宽:高），双页模式
      const ASPECT_RATIO = 1.414
      const availableHeight = window.innerHeight - 48 - 40 - 32
      const availableWidth = window.innerWidth - 64
      // 单页宽度
      const pageWidth = Math.floor(availableHeight / ASPECT_RATIO)
      // 限制单页宽度不超过可用宽度的一半
      const maxWidth = Math.floor(availableWidth / 2)
      const finalPageWidth = Math.min(pageWidth, maxWidth)
      setContainerSize({
        width: finalPageWidth,
        height: Math.floor(finalPageWidth * ASPECT_RATIO),
      })
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
    }
  }, [content, containerSize])

  const loadBook = async (bookId: string) => {
    const data = await getBook(bookId)
    if (data) {
      setBook(data)
      setContent(data.content)
      setEditContent(data.content)
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

    const availableHeight = containerSize.height - padding * 2 - 40

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
    setPages(newPages.length > 0 ? newPages : ['<p style="text-align:center;color:#999;">请添加内容</p>'])
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
          if (text.length > 80) {
            const chunks = text.split(/(?<=[。])/)
            let currentText = ''
            for (const chunk of chunks) {
              if ((currentText + chunk).length > 80 && currentText) {
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
          if (text.length > 80) {
            const chunks = text.split(/(?<=[。])/)
            let currentText = ''
            for (const chunk of chunks) {
              if ((currentText + chunk).length > 80 && currentText) {
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
              <div style={{ width: containerSize.width * 2, height: containerSize.height }}>
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
                  usePortrait={false}
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
                {pages.map((page, i) => (
                  <div key={i} className="bg-white p-8 overflow-hidden relative" style={{ height: containerSize.height }}>
                    <div
                      className="text-sm leading-relaxed text-gray-800 pb-6"
                      style={{ fontSize: '15px', lineHeight: '1.8' }}
                      dangerouslySetInnerHTML={{ __html: page }}
                    />
                    <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-400">
                      {i + 1}
                    </div>
                  </div>
                ))}
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-500">
            {currentPage + 1} / {pages.length}
          </span>
          <button
            onClick={() => goToPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
