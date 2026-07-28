import { useState } from 'react'
import type { Project } from '../../types'
import { useProjectsStore } from '../../store/projectsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { requestYoutubeAccessToken, uploadVideoToYoutube } from '../../lib/youtube'

export default function StepPublish({ project }: { project: Project }) {
  const [publishing, setPublishing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState(project.publishMetadata.tags.join(', '))

  const setPublishMetadata = useProjectsStore((s) => s.setPublishMetadata)
  const setPublishResult = useProjectsStore((s) => s.setPublishResult)
  const settings = useSettingsStore((s) => s.settings)

  const metadata = project.publishMetadata

  function updateMetadata(patch: Partial<typeof metadata>) {
    setPublishMetadata(project.id, patch)
  }

  async function handlePublish() {
    if (!project.render) return
    setError(null)
    setPublishing(true)
    setProgress(0)
    try {
      const accessToken = await requestYoutubeAccessToken(settings.googleClientId)
      const videoBlob = await fetch(project.render.blobUrl).then((r) => r.blob())
      const result = await uploadVideoToYoutube(accessToken, videoBlob, metadata, setProgress)
      setPublishResult(project.id, {
        videoId: result.videoId,
        videoUrl: result.videoUrl,
        publishedAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la publication YouTube')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">4. Publication YouTube</h2>

      {!settings.googleClientId.trim() && (
        <p className="text-sm text-amber-400">
          Configure ton Google Client ID dans Réglages avant de pouvoir publier.
        </p>
      )}

      <div className="space-y-3">
        <label className="block text-sm">
          Titre
          <input
            value={metadata.title}
            onChange={(e) => updateMetadata({ title: e.target.value })}
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>
        <label className="block text-sm">
          Description
          <textarea
            value={metadata.description}
            onChange={(e) => updateMetadata({ description: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>
        <label className="block text-sm">
          Tags (séparés par des virgules)
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={() =>
              updateMetadata({
                tags: tagsInput
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>
        <label className="block text-sm">
          Confidentialité
          <select
            value={metadata.privacyStatus}
            onChange={(e) =>
              updateMetadata({ privacyStatus: e.target.value as typeof metadata.privacyStatus })
            }
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          >
            <option value="private">Privée</option>
            <option value="unlisted">Non répertoriée</option>
            <option value="public">Publique</option>
          </select>
        </label>
      </div>

      <button
        onClick={handlePublish}
        disabled={publishing || !project.render || !settings.googleClientId.trim()}
        className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-4 py-2 font-medium transition-colors"
      >
        {publishing ? `Publication… ${Math.round(progress * 100)}%` : 'Publier sur YouTube'}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {project.publish && (
        <p className="text-sm text-green-400">
          Publiée :{' '}
          <a href={project.publish.videoUrl} target="_blank" rel="noreferrer" className="underline">
            {project.publish.videoUrl}
          </a>
        </p>
      )}
    </div>
  )
}
