import html2canvas from 'html2canvas'

export async function exportCard(
  element: HTMLElement,
  filename: string = 'card.png'
): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      width: element.scrollWidth,
      height: element.scrollHeight,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (err) {
    console.error('Export failed:', err)
    throw err
  }
}
