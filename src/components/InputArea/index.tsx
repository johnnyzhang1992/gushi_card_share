

interface InputAreaProps {
  text: string
  onTextChange: (text: string) => void
}

export default function InputArea({ text, onTextChange }: InputAreaProps) {
  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = text.substring(start, end)

    if (selected.includes('\n') && (prefix === '- ' || prefix === '1. ')) {
      const lines = selected.split('\n')
      const formatted = lines.map((line, i) => {
        if (prefix === '1. ') return `${i + 1}. ${line}`
        return `${prefix}${line}`
      }).join('\n')
      const newText = text.substring(0, start) + formatted + text.substring(end)
      onTextChange(newText)
    } else {
      const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end)
      onTextChange(newText)
    }

    setTimeout(() => {
      textarea.focus()
    }, 0)
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-medium text-gray-700">文案输入</h2>
      </div>

      <div className="px-4 py-2 border-b border-gray-200 flex flex-wrap gap-1">
        <button onClick={() => insertText('# ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="一级标题">H1</button>
        <button onClick={() => insertText('## ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="二级标题">H2</button>
        <button onClick={() => insertText('### ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="三级标题">H3</button>
        <button onClick={() => insertText('**', '**')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="高亮">高亮</button>
        <button onClick={() => insertText('> ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="引用">引用</button>
        <button onClick={() => insertText('- ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="无序列表">列表</button>
        <button onClick={() => insertText('1. ')} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded" title="有序列表">序号</button>
      </div>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="请输入文案内容..."
        className="flex-1 p-4 resize-none outline-none text-sm leading-relaxed font-[inherit]"
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  )
}
