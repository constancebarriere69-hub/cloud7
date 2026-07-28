import { useState } from 'react'
import type { Project } from '../../types'
import { useProjectsStore } from '../../store/projectsStore'
import { renderScenesToVideo } from '../../lib/videoRenderer'

export default function StepRender({ project }: { project: Project }) {
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const setRender = useProjectsStore((s) => s.setRender)

  async function handleRender() {
    setError(null)
    setRendering(true)
    setProgress(0)
    try {
      const result = await renderScenesToVideo(project.scenes, setProgress)
      setRender(project.id, result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec du rendu vidéo')
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">3. Rendu vidéo</h2>
        <button
          onClick={handleRender}
          disabled={rendering || project.scenes.length === 0}
          className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {rendering ? `Rendu… ${Math.round(progress * 100)}%` : 'Générer la vidéo'}
        </button>
      </div>

      <p className="text-sm text-white/50">
        Vidéo assemblée dans le navigateur (canvas + enregistrement vidéo) : les scènes avec une
        image IA générée à l'étape précédente sont animées (zoom/pan), les autres restent un fond
        de couleur avec le texte.
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {project.render && (
        <div className="space-y-2">
          <video
            key={project.render.blobUrl}
            src={project.render.blobUrl}
            controls
            className="w-full max-w-xl rounded-md border border-white/10"
          />
          <a
            href={project.render.blobUrl}
            download={`${project.topic || 'video'}.webm`}
            className="inline-block rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Télécharger la vidéo
          </a>
        </div>
      )}
    </div>
  )
}
