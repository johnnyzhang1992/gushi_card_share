export interface FontItem {
  name: string
  extra_name: string
  isCustom?: boolean
}

export const FontList: FontItem[] = [
  { name: 'HuiwenMingchao', extra_name: '汇文明朝体', isCustom: true },
  { name: 'ChillKai', extra_name: '寒蝉行楷体', isCustom: true },
  { name: 'AlimamaDaoLiTi', extra_name: '阿里妈妈刀隶体', isCustom: true },
  { name: 'HanyiZhongliShujian', extra_name: '汉仪中隶书简', isCustom: true },
  { name: 'KingHwa', extra_name: '京华老宋体', isCustom: true },
  { name: 'Arial, sans-serif', extra_name: 'Arial' },
  { name: "'Microsoft YaHei', sans-serif", extra_name: '微软雅黑' },
  { name: "'SimSun', serif", extra_name: '宋体' },
  { name: "'SimHei', sans-serif", extra_name: '黑体' },
  { name: "'KaiTi', serif", extra_name: '楷体' },
]

const customFonts = [
  { file: 'HuiwenMingchao.ttf', name: 'HuiwenMingchao' },
  { file: 'ChillKai_Big5.woff2', name: 'ChillKai' },
  { file: 'AlimamaDaoLiTi.woff2', name: 'AlimamaDaoLiTi' },
  { file: 'HanyiZhongliShujian.ttf', name: 'HanyiZhongliShujian' },
  { file: 'KingHwa.ttf', name: 'KingHwa' },
]

const loadedFonts = new Set<string>()

export async function loadCustomFonts(): Promise<void> {
  const promises = customFonts.map(async (font) => {
    if (loadedFonts.has(font.name)) return

    try {
      const fontFace = new FontFace(font.name, `url(/fonts/${font.file})`)
      await fontFace.load()
      document.fonts.add(fontFace)
      loadedFonts.add(font.name)
    } catch (err) {
      console.error(`Failed to load font ${font.name}:`, err)
    }
  })

  await Promise.all(promises)
}
