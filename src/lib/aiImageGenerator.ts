const REQUEST_TIMEOUT_MS = 45_000

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Lecture du fichier image échouée'))
    reader.readAsDataURL(blob)
  })
}

function buildPollinationsUrl(prompt: string, width: number, height: number): string {
  const seed = Math.floor(Math.random() * 1_000_000)
  const encodedPrompt = encodeURIComponent(prompt)
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`
}

/**
 * Generates a background image for a scene using Pollinations.ai's free,
 * key-less text-to-image endpoint. This is the "AI" half of the video
 * pipeline: the image is then animated (Ken Burns pan/zoom) by the video
 * renderer instead of being a flat color, without requiring any paid
 * text-to-video API.
 *
 * Returns a data URL (not an object URL) so the image survives being
 * persisted to localStorage and reloaded in a later session.
 */
export async function generateSceneImage(
  sceneText: string,
  topic: string,
  width = 1280,
  height = 720,
): Promise<string> {
  const prompt = `${sceneText}, illustration cinématographique pour une vidéo sur "${topic}", style moderne, haute qualité`
  const url = buildPollinationsUrl(prompt, width, height)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Génération d'image IA échouée (${response.status})`)
    }
    const blob = await response.blob()
    return blobToDataUrl(blob)
  } finally {
    clearTimeout(timeout)
  }
}
