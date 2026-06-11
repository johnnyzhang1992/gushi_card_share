import { useRef, useState } from 'react'
import Card from '../Card'
import type { Card as CardType, CardSettings } from '../../types/card'
import { exportCard } from '../../utils/export'

interface PreviewAreaProps {
  cards: CardType[]
  settings: CardSettings
}

export default function PreviewArea({ cards, settings }: PreviewAreaProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [scale, setScale] = useState(50)

  const handleExport = async (card: CardType) => {
    const element = cardRefs.current.get(card.id)
    if (element) {
      await exportCard(element, `card-${card.id}.png`)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 10, 150))
  const zoomOut = () => setScale(prev => Math.max(prev - 10, 20))

  return (
    <div className="flex-1 bg-gray-100 p-6 overflow-auto relative">
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded shadow px-2 py-1 z-10">
        <button onClick={zoomOut} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">-</button>
        <span className="text-xs text-gray-500 w-10 text-center">{scale}%</span>
        <button onClick={zoomIn} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-sm font-bold">+</button>
      </div>

      <div className="flex flex-wrap justify-center" style={{ gap: '12px' }}>
        {cards.map((card) => (
          <div key={card.id} className="relative group">
            <div ref={(el) => { if (el) cardRefs.current.set(card.id, el) }}>
              <Card card={card} settings={settings} isPreview zoomScale={scale / 50} />
            </div>
            <button
              onClick={() => handleExport(card)}
              className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              导出
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
