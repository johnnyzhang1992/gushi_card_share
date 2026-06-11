import html2canvas from 'html2canvas'

export async function exportCard(
  element: HTMLElement,
  filename?: string
): Promise<void> {
  try {
    const timestamp = Date.now()
    const exportFilename = filename || `card_shard_${timestamp}.png`

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 3,
      width: element.scrollWidth,
      height: element.scrollHeight,
    })

    const link = document.createElement('a')
    link.download = exportFilename
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Export failed:', err)
    throw err
  }
}
