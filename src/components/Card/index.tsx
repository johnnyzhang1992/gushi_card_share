import type { Card as CardType, CardSettings } from '../../types/card'

interface CardProps {
  card: CardType
  settings: CardSettings
  isPreview?: boolean
  zoomScale?: number
}

function getCardDimensions(ratio: string) {
  switch (ratio) {
    case '3:4':
      return { width: 600, height: 800 }
    case '9:16':
      return { width: 540, height: 960 }
    case '1:1':
      return { width: 720, height: 720 }
    default:
      return { width: 600, height: 800 }
  }
}

function renderBlock(block: CardType['blocks'][0], settings: CardSettings, scale: number = 1) {
  const isTitle = block.type === 'title'
  const isHighlight = block.type === 'highlight'
  const isQuote = block.type === 'quote'
  const isOrderedList = block.type === 'ordered-list'
  const isUnorderedList = block.type === 'unordered-list'

  let titleScale = 1.5
  if (block.level === 'h1') titleScale = 2
  else if (block.level === 'h2') titleScale = 1.75

  const baseFontSize = isTitle ? settings.fontSize * titleScale : settings.fontSize
  const baseStyle: React.CSSProperties = {
    fontFamily: settings.fontFamily,
    fontSize: baseFontSize * scale,
    lineHeight: settings.lineHeight,
    color: settings.color,
    textAlign: settings.textAlign,
  }

  if (isTitle) {
    return (
      <div key={block.id} style={{ ...baseStyle, fontWeight: 'bold', marginBottom: `${baseFontSize * settings.titleMarginBottom * scale}px` }}>
        {block.content}
      </div>
    )
  }

  if (isHighlight) {
    return (
      <div key={block.id} style={{ ...baseStyle, backgroundColor: 'rgba(255, 255, 0, 0.3)', padding: `${0.2 * scale}em ${0.5 * scale}em`, borderRadius: 4 * scale, marginBottom: `${baseFontSize * 0.5 * scale}px` }}>
        {block.content}
      </div>
    )
  }

  if (isQuote) {
    const quoteStyle: React.CSSProperties = settings.showQuoteBar
      ? { borderLeft: `${3 * scale}px solid ${settings.color}`, paddingLeft: `${1 * scale}em` }
      : { paddingLeft: '0.5em' }
    return (
      <div key={block.id} style={baseStyle}>
        <span style={{ ...quoteStyle, opacity: 0.6 }}>
          {block.content}
        </span>
      </div>
    )
  }

  if (isOrderedList) {
    const items = block.content.split('\n')
    return (
      <ol key={block.id} style={{ ...baseStyle, paddingLeft: `${1.5 * scale}em`, margin: 0, marginBottom: `${baseFontSize * 0.5 * scale}px` }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    )
  }

  if (isUnorderedList) {
    const items = block.content.split('\n')
    return (
      <ul key={block.id} style={{ ...baseStyle, paddingLeft: `${1.5 * scale}em`, margin: 0, marginBottom: `${baseFontSize * 0.5 * scale}px` }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }

  if (block.type === 'empty') {
    return <div key={block.id} style={{ height: `${baseFontSize * settings.lineHeight * scale}px` }} />
  }

  return (
    <div key={block.id} style={{ ...baseStyle, margin: `${baseFontSize * settings.textMarginY * scale}px 0` }}>
      {block.content}
    </div>
  )
}

export default function Card({ card, settings, isPreview = false, zoomScale = 1 }: CardProps) {
  const { width, height } = getCardDimensions(settings.ratio)
  const scale = isPreview ? 0.5 * zoomScale : zoomScale

  const verticalAlignStyle: React.CSSProperties = {
    top: { justifyContent: 'flex-start' },
    center: { justifyContent: 'center' },
    bottom: { justifyContent: 'flex-end' },
  }[settings.verticalAlign] || { justifyContent: 'flex-start' }

  const cardStyle: React.CSSProperties = {
    width: width * scale,
    height: height * scale,
    padding: `${settings.paddingY * scale}px ${settings.paddingX * scale}px`,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    ...verticalAlignStyle,
    backgroundColor: settings.backgroundImage ? 'transparent' : settings.backgroundColor,
    backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    borderRadius: 8 * scale,
  }

  return (
    <div style={cardStyle}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...verticalAlignStyle }}>
        {card.blocks.map((block) => renderBlock(block, settings, scale))}
      </div>
      {settings.copyright && (
        <div
          style={{
            position: 'absolute',
            bottom: 16 * scale,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 12 * scale,
            opacity: 0.6,
            fontFamily: settings.fontFamily,
            color: settings.color,
          }}
        >
          {settings.copyright}
        </div>
      )}
    </div>
  )
}
