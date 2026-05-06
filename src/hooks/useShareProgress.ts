import { useState } from 'react'

type ShareStatus = 'idle' | 'sharing' | 'copied' | 'shared' | 'error'

export function useShareProgress() {
  const [status, setStatus] = useState<ShareStatus>('idle')

  async function share(canvas: HTMLCanvasElement) {
    setStatus('sharing')

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create image')), 'image/png')
      })

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'glp1-progress.png', { type: 'image/png' })
        const shareData = { files: [file], title: 'My GLP-1 Progress', text: 'Check out my GLP-1 progress!' }

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          setStatus('shared')
          setTimeout(() => setStatus('idle'), 2000)
          return
        }
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        return
      }
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = 'glp1-progress.png'
        link.href = dataUrl
        link.click()
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    }
  }

  return { share, status }
}
