
import { useState } from 'react'
import type { CardSettings, CardRatio, TextAlign, VerticalAlign } from '../../types/card'
import { FontList } from '../../utils/fontManager'
import { BackgroundImages } from '../../utils/backgrounds'

interface SettingsPanelProps {
  settings: CardSettings
  onSettingsChange: (settings: CardSettings) => void
}

const ratios: CardRatio[] = ['3:4', '9:16', '1:1']
const textAligns: { value: TextAlign; label: string }[] = [
  { value: 'left', label: '左' },
  { value: 'center', label: '中' },
  { value: 'right', label: '右' },
]
const verticalAligns: { value: VerticalAlign; label: string }[] = [
  { value: 'top', label: '顶' },
  { value: 'center', label: '中' },
  { value: 'bottom', label: '底' },
]

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
  const [customImages, setCustomImages] = useState<{ id: string; name: string; url: string }[]>([])

  const update = (key: keyof CardSettings, value: unknown) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      const newImage = { id: `custom-${Date.now()}`, name: file.name, url }
      setCustomImages(prev => [...prev, newImage])
      update('backgroundImage', url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xs font-medium text-gray-700">卡片设置</h2>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">比例</label>
          <div className="flex gap-1">
            {ratios.map((r) => (
              <button
                key={r}
                onClick={() => update('ratio', r)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  settings.ratio === r
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">背景</label>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => update('backgroundImage', null)}
              className={`w-8 h-8 rounded border-2 transition-colors ${
                !settings.backgroundImage
                  ? 'border-blue-500'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
              style={{ backgroundColor: settings.backgroundColor }}
            />
            {BackgroundImages.map((bg) => (
              <button
                key={bg.id}
                onClick={() => update('backgroundImage', bg.url)}
                className={`w-8 h-8 rounded border-2 bg-cover bg-center transition-colors ${
                  settings.backgroundImage === bg.url
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundImage: `url(${bg.url})` }}
                title={bg.name}
              />
            ))}
            {customImages.map((bg) => (
              <button
                key={bg.id}
                onClick={() => update('backgroundImage', bg.url)}
                className={`w-8 h-8 rounded border-2 bg-cover bg-center transition-colors ${
                  settings.backgroundImage === bg.url
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundImage: `url(${bg.url})` }}
                title={bg.name}
              />
            ))}
            <label className="w-8 h-8 rounded border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            背景色 <span className="text-gray-400">{settings.backgroundColor}</span>
          </label>
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => update('backgroundColor', e.target.value)}
            className="w-full h-6 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            字号 <span className="text-gray-400">{settings.fontSize}px</span>
          </label>
          <input
            type="range"
            min="12"
            max="48"
            value={settings.fontSize}
            onChange={(e) => update('fontSize', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            行间距 <span className="text-gray-400">{settings.lineHeight}</span>
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => update('lineHeight', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            横向内间距 <span className="text-gray-400">{settings.paddingX}px</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={settings.paddingX}
            onChange={(e) => update('paddingX', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            垂直内间距 <span className="text-gray-400">{settings.paddingY}px</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={settings.paddingY}
            onChange={(e) => update('paddingY', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            文字颜色 <span className="text-gray-400">{settings.color}</span>
          </label>
          <input
            type="color"
            value={settings.color}
            onChange={(e) => update('color', e.target.value)}
            className="w-full h-6 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">字体</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => update('fontFamily', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none focus:border-blue-500"
          >
            {FontList.map((font) => (
              <option key={font.name} value={font.name}>
                {font.extra_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">文本排列</label>
          <div className="flex gap-1">
            {textAligns.map((t) => (
              <button
                key={t.value}
                onClick={() => update('textAlign', t.value)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  settings.textAlign === t.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">垂直排列</label>
          <div className="flex gap-1">
            {verticalAligns.map((v) => (
              <button
                key={v.value}
                onClick={() => update('verticalAlign', v.value)}
                className={`flex-1 py-1 text-xs rounded border transition-colors ${
                  settings.verticalAlign === v.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">版权信息</label>
          <input
            type="text"
            value={settings.copyright}
            onChange={(e) => update('copyright', e.target.value)}
            placeholder="留空则不显示"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-500">引用色块</label>
          <button
            onClick={() => update('showQuoteBar', !settings.showQuoteBar)}
            className={`w-9 h-5 rounded-full transition-colors relative ${settings.showQuoteBar ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.showQuoteBar ? 'left-4.5 translate-x-0' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            标题间距 <span className="text-gray-400">{settings.titleMarginBottom}em</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.titleMarginBottom}
            onChange={(e) => update('titleMarginBottom', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">
            正文间距 <span className="text-gray-400">{settings.textMarginY}em</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.textMarginY}
            onChange={(e) => update('textMarginY', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
