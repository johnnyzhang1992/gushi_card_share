import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '卡片分享' },
    { path: '/book', label: '电子书' },
  ]

  // 书籍详情页不显示顶部导航（有自己的导航）
  if (location.pathname.startsWith('/book/')) {
    return <>{children}</>
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <nav className="h-12 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-medium text-gray-800">
            古诗卡片
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
