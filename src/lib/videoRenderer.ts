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

async function loadImage(url: string): Promise<HTMLImageElement | undefined> {
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Image de scène introuvable: ${url}`))
      img.src = url
    })
  } catch {
    // Fall back to the flat-color placeholder if the AI image can't be loaded.
    return undefined
  }
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, scale: number) {
  const canvasRatio = WIDTH / HEIGHT
  const imageRatio = image.width / image.height

  let drawWidth = WIDTH * scale
  let drawHeight = HEIGHT * scale
  if (imageRatio > canvasRatio) {
    drawHeight = HEIGHT * scale
    drawWidth = drawHeight * imageRatio
  } else {
    drawWidth = WIDTH * scale
    drawHeight = drawWidth / imageRatio
  }

  const dx = (WIDTH - drawWidth) / 2
  const dy = (HEIGHT - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  progress: number,
  image: HTMLImageElement | undefined,
) {
  // Slow "Ken Burns" style zoom for a less static shot.
  const scale = 1 + progress * 0.06

  if (image) {
    drawImageCover(ctx, image, scale)

    const gradient = ctx.createLinearGradient(0, HEIGHT * 0.5, 0, HEIGHT)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
  } else {
    ctx.fillStyle = scene.backgroundColor
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.save()
    ctx.translate(WIDTH / 2, HEIGHT / 2)
    ctx.scale(scale, scale)
    ctx.translate(-WIDTH / 2, -HEIGHT / 2)
  }

  ctx.fillStyle = '#ffffff'
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lines = wrapText(ctx, scene.text, WIDTH - 160)
  const lineHeight = 58
  const centerY = image ? HEIGHT - lines.length * lineHeight : HEIGHT / 2
  const startY = centerY - ((lines.length - 1) * lineHeight) / 2

  lines.forEach((line, index) => {
    ctx.fillText(line, WIDTH / 2, startY + index * lineHeight)
  })

  if (!image) {
    ctx.restore()
  }
}

/**
 * Renders a silent video from the storyboard scenes using canvas +
 * MediaRecorder. Scenes with an AI-generated image (see aiImageGenerator.ts)
 * are animated with a Ken Burns pan/zoom; scenes without one fall back to a
 * flat-color placeholder card.
 */
export async function renderScenesToVideo(
  scenes: Scene[],
  onProgress?: (fraction: number) => void,
): Promise<RenderResult> {
  if (scenes.length === 0) {
    throw new Error('Aucune scène à rendre')
  }

  const images = await Promise.all(
    scenes.map((scene) => (scene.imageUrl ? loadImage(scene.imageUrl) : Promise.resolve(undefined))),
  )

  return new Promise((resolve, reject) => {
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

      drawScene(ctx!, scene, sceneProgress, images[sceneIndex])
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
