import { marked } from 'marked'

export interface TOCItem {
  id: string
  title: string
  level: number
}

export interface ParsedContent {
  html: string
  toc: TOCItem[]
}

// 自定义渲染器，为标题添加 id
const renderer = new marked.Renderer()
const toc: TOCItem[] = []
let headingCounter = 0

renderer.heading = function ({ text, depth }: any) {
  const id = `heading-${headingCounter++}`
  const title = typeof text === 'string' ? text : String(text)
  toc.push({ id, title, level: depth })
  return `<h${depth} id="${id}"><b>${text}</b></h${depth}>`
}

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
})

export function parseMarkdown(markdown: string): ParsedContent {
  headingCounter = 0
  toc.length = 0

  // 移除 --- 行
  let cleanedMarkdown = markdown.replace(/^---\s*$/gm, '')

  // 将连续空行转换为占位符，保留空行
  cleanedMarkdown = cleanedMarkdown.replace(/\n{2,}/g, '\n\n&#8203;\n\n')

  const html = marked.parse(cleanedMarkdown) as string

  // 将占位符转换为空段落
  const finalHtml = html.replace(/&#8203;/g, '<br>')

  return { html: finalHtml, toc: [...toc] }
}
