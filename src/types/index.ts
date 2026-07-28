export type ProjectStatus = 'draft' | 'scripted' | 'storyboarded' | 'rendered' | 'published'

export interface Scene {
  id: string
  text: string
  durationSeconds: number
  backgroundColor: string
  imageUrl?: string
}

export interface PublishMetadata {
  title: string
  description: string
  tags: string[]
  privacyStatus: 'private' | 'unlisted' | 'public'
  categoryId: string
}

export interface RenderResult {
  blobUrl: string
  mimeType: string
  width: number
  height: number
  renderedAt: string
}

export interface PublishResult {
  videoId: string
  videoUrl: string
  publishedAt: string
}

export interface Project {
  id: string
  createdAt: string
  updatedAt: string
  status: ProjectStatus
  topic: string
  script: string
  scenes: Scene[]
  publishMetadata: PublishMetadata
  render?: RenderResult
  publish?: PublishResult
}

export interface AppSettings {
  googleClientId: string
  llmProvider: 'none' | 'openai' | 'anthropic' | 'google'
  llmApiKey: string
}
