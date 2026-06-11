import { useState, useEffect, useCallback } from 'react'
import InputArea from './components/InputArea'
import PreviewArea from './components/PreviewArea'
import SettingsPanel from './components/SettingsPanel'
import type { CardSettings, Card } from './types/card'
import { loadCustomFonts } from './utils/fontManager'
import { splitIntoCards } from './utils/textSplitter'

const SETTINGS_VERSION = 1

const defaultSettings: CardSettings = {
  ratio: '3:4',
  backgroundColor: '#f5f0e8',
  backgroundImage: null,
  fontSize: 18,
  lineHeight: 1.6,
  paddingX: 40,
  paddingY: 40,
  color: '#333333',
  fontFamily: 'HuiwenMingchao',
  copyright: '',
  textAlign: 'center',
  verticalAlign: 'center',
  showQuoteBar: true,
  titleMarginBottom: 0.5,
  textMarginY: 0.5,
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

function App() {
  const [text, setText] = useState(() => {
    return localStorage.getItem('poetry-text') || '### 静夜思\n\n床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。'
  })

  const [settings, setSettings] = useState<CardSettings>(() => {
    const saved = localStorage.getItem('poetry-settings')
    const savedVersion = localStorage.getItem('poetry-settings-version')
    if (saved && savedVersion === String(SETTINGS_VERSION)) {
      return JSON.parse(saved)
    }
    return defaultSettings
  })

  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    localStorage.setItem('poetry-text', text)
  }, [text])

  useEffect(() => {
    localStorage.setItem('poetry-settings', JSON.stringify(settings))
    localStorage.setItem('poetry-settings-version', String(SETTINGS_VERSION))
  }, [settings])

  useEffect(() => {
    loadCustomFonts()
  }, [])

  const splitCards = useCallback(() => {
    const { width, height } = getCardDimensions(settings.ratio)
    const newCards = splitIntoCards(text, width, height, {
      fontSize: settings.fontSize,
      lineHeight: settings.lineHeight,
      paddingX: settings.paddingX,
      paddingY: settings.paddingY,
    })
    setCards(newCards)
  }, [text, settings])

  useEffect(() => {
    splitCards()
  }, [splitCards])

  return (
    <div className="flex h-screen bg-gray-50 p-4">
      <div className="w-80 flex-shrink-0">
        <InputArea text={text} onTextChange={setText} />
      </div>
      <PreviewArea cards={cards} settings={settings} />
      <SettingsPanel settings={settings} onSettingsChange={setSettings} />
    </div>
  )
}

export default App
