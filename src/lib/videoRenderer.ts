import type { RenderResult, Scene } from '../types'

const WIDTH = 1280
const HEIGHT = 720

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, progress: number) {
  ctx.fillStyle = scene.backgroundColor
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Slow "Ken Burns" style zoom for a less static placeholder.
  const scale = 1 + progress * 0.04
  ctx.save()
  ctx.translate(WIDTH / 2, HEIGHT / 2)
  ctx.scale(scale, scale)
  ctx.translate(-WIDTH / 2, -HEIGHT / 2)

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = wrapText(ctx, scene.text, WIDTH - 160)
  const lineHeight = 58
  const startY = HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2

  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, startY + index * lineHeight)
  })

  ctx.restore()
}

/**
 * Renders a silent placeholder video from the storyboard scenes using
 * canvas + MediaRecorder. This stands in for a real AI video-generation
 * backend until one is wired up.
 */
export function renderScenesToVideo(
  scenes: Scene[],
  onProgress?: (fraction: number) => void,
): Promise<RenderResult> {
  return new Promise((resolve, reject) => {
    if (scenes.length === 0) {
      reject(new Error('Aucune scène à rendre'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 2D non disponible'))
      return
    }

    const stream = canvas.captureStream(30)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: BlobPart[] = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }

    recorder.onerror = (event) => reject(event)

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      resolve({
        blobUrl: URL.createObjectURL(blob),
        mimeType,
        width: WIDTH,
        height: HEIGHT,
        renderedAt: new Date().toISOString(),
      })
    }

    const totalDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0)
    let elapsed = 0
    let sceneIndex = 0
    let sceneStart = performance.now()

    recorder.start()

    function tick(now: number) {
      const scene = scenes[sceneIndex]
      const sceneElapsedMs = now - sceneStart
      const sceneDurationMs = scene.durationSeconds * 1000
      const sceneProgress = Math.min(1, sceneElapsedMs / sceneDurationMs)

      drawScene(ctx!, scene, sceneProgress)
      onProgress?.(Math.min(1, (elapsed + sceneElapsedMs / 1000) / totalDuration))

      if (sceneProgress >= 1) {
        elapsed += scene.durationSeconds
        sceneIndex += 1
        sceneStart = now
        if (sceneIndex >= scenes.length) {
          recorder.stop()
          return
        }
      }

      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}
