import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllBooks, saveBook, deleteBook, type Book } from '../../utils/db/bookDb'
import { presetBooks, fetchPresetBook } from '../../utils/presetBooks'

export default function BookList() {
  const [books, setBooks] = useState<Book[]>([])
  const [showModal, setShowModal] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [importing, setImporting] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    const list = await getAllBooks()
    setBooks(list)
  }

  const handleCreate = async () => {
    if (!newBookTitle.trim()) return

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: newBookTitle.trim(),
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await saveBook(newBook)
    setNewBookTitle('')
    setShowModal(false)
    navigate(`/book/${newBook.id}`)
  }

  const handleImport = async (filename: string, title: string) => {
    // 检查是否已导入
    const existing = books.find(b => b.title === title)
    if (existing) {
      if (!confirm(`"${title}" 已存在，是否覆盖？`)) return
    }

    setImporting(filename)
    try {
      const content = await fetchPresetBook(filename)
      const book: Book = {
        id: existing?.id || `book-${Date.now()}`,
        title,
        content,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }
      await saveBook(book)
      await loadBooks()
    } catch (err) {
      alert('导入失败：' + err)
    } finally {
      setImporting(null)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定删除这本书吗？')) return
    await deleteBook(id)
    loadBooks()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  // 检查书籍是否已导入
  const isImported = (title: string) => books.some(b => b.title === title)

  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 用户书籍 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-medium text-gray-800">我的书架</h1>
              <p className="text-sm text-gray-500 mt-1">创建和管理你的电子书</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              新建书籍
            </button>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-gray-500">还没有书籍，点击上方按钮创建或下方导入</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{book.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {book.content ? `${book.content.length} 字` : '空书籍'} · {formatDate(book.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(book.id, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 预置书籍 */}
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-800">古诗词教材</h2>
            <p className="text-sm text-gray-500 mt-1">点击导入到书架</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {presetBooks.map((item) => {
              const imported = isImported(item.title)
              return (
                <button
                  key={item.filename}
                  onClick={() => handleImport(item.filename, item.title)}
                  disabled={importing === item.filename}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    imported
                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  } ${importing === item.filename ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {importing === item.filename ? '导入中...' : imported ? '已导入' : '点击导入'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-medium mb-4">新建书籍</h2>
            <input
              type="text"
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder="输入书名"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowModal(false); setNewBookTitle('') }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
