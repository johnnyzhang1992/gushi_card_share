import type { Card, TextBlock } from '../types/card'

let blockId = 0

function createBlock(type: TextBlock['type'], content: string, level?: 'h1' | 'h2' | 'h3'): TextBlock {
  return { id: `block-${++blockId}`, type, content, level }
}

function parseTextToBlocks(text: string): TextBlock[] {
  const lines = text.split('\n')
  const blocks: TextBlock[] = []

  let listType: 'ordered-list' | 'unordered-list' | null = null
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      blocks.push(createBlock(listType, listItems.join('\n')))
      listItems = []
      listType = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      blocks.push(createBlock('empty', ''))
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      blocks.push(createBlock('title', trimmed.slice(4), 'h3'))
    } else if (trimmed.startsWith('## ')) {
      flushList()
      blocks.push(createBlock('title', trimmed.slice(3), 'h2'))
    } else if (trimmed.startsWith('# ')) {
      flushList()
      blocks.push(createBlock('title', trimmed.slice(2), 'h1'))
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList()
      blocks.push(createBlock('highlight', trimmed.slice(2, -2)))
    } else if (/^\d+\.\s/.test(trimmed)) {
      listType = 'ordered-list'
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listType = 'unordered-list'
      listItems.push(trimmed.slice(2))
    } else if (trimmed.startsWith('> ')) {
      flushList()
      blocks.push(createBlock('quote', trimmed.slice(2)))
    } else {
      flushList()
      blocks.push(createBlock('text', trimmed))
    }
  }

  flushList()
  return blocks
}

function measureBlockHeight(block: TextBlock, cardWidth: number, settings: {
  fontSize: number
  lineHeight: number
  paddingX: number
}): number {
  const { fontSize, lineHeight, paddingX } = settings
  const contentWidth = cardWidth - paddingX * 2

  const isTitle = block.type === 'title'
  let titleScale = 1.5
  if (block.level === 'h1') titleScale = 2
  else if (block.level === 'h2') titleScale = 1.75

  const actualFontSize = isTitle ? fontSize * titleScale : fontSize
  const actualLineHeight = actualFontSize * lineHeight

  const lines = block.content.split('\n')
  let totalLines = 0

  for (const line of lines) {
    const charsPerLine = Math.floor(contentWidth / actualFontSize)
    const lineCount = Math.max(1, Math.ceil(line.length / charsPerLine))
    totalLines += lineCount
  }

  const textHeight = totalLines * actualLineHeight
  const marginBottom = actualFontSize * 0.5

  return textHeight + marginBottom
}

export function splitIntoCards(
  text: string,
  cardWidth: number,
  cardHeight: number,
  settings: {
    fontSize: number
    lineHeight: number
    paddingX: number
    paddingY: number
  }
): Card[] {
  const allBlocks = parseTextToBlocks(text)

  if (allBlocks.length === 0) {
    return [{ id: 'card-1', blocks: [createBlock('text', '请输入内容')] }]
  }

  const usableHeight = cardHeight - settings.paddingY * 2
  const cards: Card[] = []
  let currentBlocks: TextBlock[] = []
  let currentHeight = 0

  for (const block of allBlocks) {
    const blockHeight = measureBlockHeight(block, cardWidth, settings)

    if (currentHeight + blockHeight > usableHeight && currentBlocks.length > 0) {
      cards.push({ id: `card-${cards.length + 1}`, blocks: currentBlocks })
      currentBlocks = [block]
      currentHeight = blockHeight
    } else {
      currentBlocks.push(block)
      currentHeight += blockHeight
    }
  }

  if (currentBlocks.length > 0) {
    cards.push({ id: `card-${cards.length + 1}`, blocks: currentBlocks })
  }

  return cards
}
