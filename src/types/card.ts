export type CardRatio = '3:4' | '9:16' | '1:1'

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'center' | 'bottom'

export interface CardSettings {
  ratio: CardRatio
  backgroundColor: string
  backgroundImage: string | null
  fontSize: number
  lineHeight: number
  paddingX: number
  paddingY: number
  color: string
  fontFamily: string
  copyright: string
  textAlign: TextAlign
  verticalAlign: VerticalAlign
  showQuoteBar: boolean
  titleMarginBottom: number
  textMarginY: number
}

export interface TextBlock {
  id: string
  type: 'title' | 'highlight' | 'ordered-list' | 'unordered-list' | 'quote' | 'text' | 'empty'
  content: string
  level?: 'h1' | 'h2' | 'h3'
}

export interface Card {
  id: string
  blocks: TextBlock[]
  isOverflow?: boolean
}
