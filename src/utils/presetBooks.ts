// 预置的古诗 md 文件列表
export const presetBooks = [
  { filename: '一年级上学期.md', title: '一年级上学期' },
  { filename: '一年级下学期.md', title: '一年级下学期' },
  { filename: '二年级上学期.md', title: '二年级上学期' },
  { filename: '二年级下学期.md', title: '二年级下学期' },
  { filename: '三年级上学期.md', title: '三年级上学期' },
  { filename: '三年级下学期.md', title: '三年级下学期' },
  { filename: '四年级上学期.md', title: '四年级上学期' },
  { filename: '四年级下学期.md', title: '四年级下学期' },
  { filename: '五年级上学期.md', title: '五年级上学期' },
  { filename: '五年级下学期.md', title: '五年级下学期' },
  { filename: '六年级上学期.md', title: '六年级上学期' },
  { filename: '六年级下学期.md', title: '六年级下学期' },
  { filename: '七年级上学期.md', title: '七年级上学期' },
  { filename: '七年级下学期.md', title: '七年级下学期' },
  { filename: '八年级上学期.md', title: '八年级上学期' },
  { filename: '八年级下学期.md', title: '八年级下学期' },
  { filename: '九年级上学期.md', title: '九年级上学期' },
  { filename: '九年级下学期.md', title: '九年级下学期' },
  { filename: '高中必修（上册）.md', title: '高中必修（上册）' },
  { filename: '高中必修（下册）.md', title: '高中必修（下册）' },
  { filename: '高中选修（上册）.md', title: '高中选修（上册）' },
  { filename: '高中选修（中册）.md', title: '高中选修（中册）' },
  { filename: '高中选修（下册）.md', title: '高中选修（下册）' },
]

export async function fetchPresetBook(filename: string): Promise<string> {
  const response = await fetch(`/gushi_md/${filename}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filename}`)
  }
  const text = await response.text()

  // 尝试解析 JSON 格式
  try {
    const json = JSON.parse(text)
    if (json.data && json.data.markdown) {
      return json.data.markdown
    }
  } catch {
    // 不是 JSON，直接返回原文
  }

  return text
}
