import type { PublishMetadata } from '../types'

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

let gisLoadPromise: Promise<void> | null = null

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Impossible de charger l'API Google Identity Services"))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

/**
 * Opens the Google OAuth consent popup and resolves with a short-lived
 * access token scoped to YouTube uploads. There is no refresh token in this
 * implicit flow — the user re-authorizes each time they publish.
 */
export async function requestYoutubeAccessToken(clientId: string): Promise<string> {
  if (!clientId.trim()) {
    throw new Error('Google Client ID manquant — configure-le dans Réglages.')
  }

  await loadGoogleIdentityServices()

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: YOUTUBE_UPLOAD_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error ?? "Échec de l'autorisation Google"))
          return
        }
        resolve(response.access_token)
      },
    })
    client.requestAccessToken()
  })
}

async function startResumableUploadSession(
  accessToken: string,
  metadata: PublishMetadata,
  video: Blob,
): Promise<string> {
  const response = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'x-upload-content-type': video.type || 'video/webm',
        'x-upload-content-length': String(video.size),
      },
      body: JSON.stringify({
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId,
        },
        status: {
          privacyStatus: metadata.privacyStatus,
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Échec de l'initialisation de l'upload YouTube (${response.status}): ${body}`)
  }

  const location = response.headers.get('Location')
  if (!location) {
    throw new Error("La réponse YouTube ne contient pas d'URL de session d'upload")
  }
  return location
}

export interface YoutubeUploadResult {
  videoId: string
  videoUrl: string
}

/**
 * Uploads a rendered video to YouTube via the resumable upload protocol,
 * entirely from the browser (no backend involved).
 */
export async function uploadVideoToYoutube(
  accessToken: string,
  video: Blob,
  metadata: PublishMetadata,
  onProgress?: (fraction: number) => void,
): Promise<YoutubeUploadResult> {
  const uploadUrl = await startResumableUploadSession(accessToken, metadata, video)

  const videoId = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl, true)
    xhr.setRequestHeader('content-type', video.type || 'video/webm')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data.id)
        } catch {
          reject(new Error('Réponse YouTube illisible après upload'))
        }
      } else {
        reject(new Error(`Échec de l'upload YouTube (${xhr.status}): ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload YouTube"))
    xhr.send(video)
  })

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}

/**
 * Sets a custom thumbnail on an already-uploaded video. Requires the
 * channel to be phone-verified on YouTube — if it isn't, the API rejects
 * the request and the caller should treat this as a non-fatal warning
 * (the video itself is still published).
 */
export async function setYoutubeThumbnail(
  accessToken: string,
  videoId: string,
  image: Blob,
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': image.type || 'image/jpeg',
      },
      body: image,
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Échec de l'envoi de la miniature (${response.status}): ${body}`)
  }
}
