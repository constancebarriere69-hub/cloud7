import { useState } from 'react'
import type { Project } from '../../types'
import { useProjectsStore } from '../../store/projectsStore'
import { scriptToScenes } from '../../lib/scriptGenerator'
import { generateSceneImage } from '../../lib/aiImageGenerator'

export default function StepStoryboard({ project }: { project: Project }) {
  const setScenes = useProjectsStore((s) => s.setScenes)
  const updateScene = useProjectsStore((s) => s.updateScene)
  const [bulkGenerating, setBulkGenerating] = useState(false)

  function handleGenerateFromScript() {
    setScenes(project.id, scriptToScenes(project.script))
  }

  function removeScene(id: string) {
    setScenes(
      project.id,
      project.scenes.filter((s) => s.id !== id),
    )
  }

  async function generateImageForScene(sceneId: string, sceneText: string) {
    updateScene(project.id, sceneId, { imageStatus: 'generating', imageError: undefined })
    try {
      const imageUrl = await generateSceneImage(sceneText, project.topic)
      updateScene(project.id, sceneId, { imageUrl, imageStatus: 'ready' })
    } catch (err) {
      updateScene(project.id, sceneId, {
        imageStatus: 'error',
        imageError: err instanceof Error ? err.message : "Échec de la génération d'image",
      })
    }
  }

  async function handleGenerateAllImages() {
    setBulkGenerating(true)
    try {
      for (const scene of project.scenes) {
        await generateImageForScene(scene.id, scene.text)
      }
    } finally {
      setBulkGenerating(false)
    }
  }

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.durationSeconds, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">2. Storyboard</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateFromScript}
            disabled={!project.script.trim()}
            className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Découper le script en scènes
          </button>
          <button
            onClick={handleGenerateAllImages}
            disabled={bulkGenerating || project.scenes.length === 0}
            className="rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {bulkGenerating ? 'Génération des images…' : 'Générer toutes les images IA'}
          </button>
        </div>
      </div>

      <p className="text-sm text-white/50">
        Les images sont générées gratuitement par IA (Pollinations.ai) à partir du texte de chaque
        scène, puis animées (zoom/pan) lors du rendu. Sans image générée, la scène reste un simple
        fond de couleur avec le texte.
      </p>

      {project.scenes.length === 0 ? (
        <p className="text-white/50 text-sm">
          Pas encore de scènes. Écris d'abord un script, puis découpe-le.
        </p>
      ) : (
        <>
          <p className="text-sm text-white/50">
            {project.scenes.length} scène(s) · {totalDuration}s au total
          </p>
          <ul className="space-y-3">
            {project.scenes.map((scene, index) => (
              <li key={scene.id} className="rounded-md border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-white/50">
                  <span>Scène {index + 1}</span>
                  <button
                    onClick={() => removeScene(scene.id)}
                    className="text-white/40 hover:text-red-400"
                  >
                    Supprimer
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="w-32 h-18 shrink-0 rounded overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                    {scene.imageStatus === 'generating' ? (
                      <span className="text-xs text-white/50">Génération…</span>
                    ) : scene.imageUrl ? (
                      <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span
                        className="w-full h-full"
                        style={{ backgroundColor: scene.backgroundColor }}
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={scene.text}
                      onChange={(e) => updateScene(project.id, scene.id, { text: e.target.value })}
                      rows={2}
                      className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-1 outline-none focus:border-brand-500 text-sm"
                    />
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        Durée (s)
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={scene.durationSeconds}
                          onChange={(e) =>
                            updateScene(project.id, scene.id, {
                              durationSeconds: Number(e.target.value) || 1,
                            })
                          }
                          className="w-16 rounded-md bg-white/5 border border-white/10 px-2 py-1 outline-none focus:border-brand-500"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        Couleur
                        <input
                          type="color"
                          value={scene.backgroundColor}
                          onChange={(e) =>
                            updateScene(project.id, scene.id, { backgroundColor: e.target.value })
                          }
                          className="h-7 w-10 rounded border border-white/10 bg-transparent"
                        />
                      </label>
                      <button
                        onClick={() => generateImageForScene(scene.id, scene.text)}
                        disabled={scene.imageStatus === 'generating'}
                        className="text-brand-200 hover:text-white disabled:opacity-50"
                      >
                        {scene.imageUrl ? 'Régénérer image IA' : 'Générer image IA'}
                      </button>
                    </div>
                    {scene.imageStatus === 'error' && (
                      <p className="text-xs text-red-400">{scene.imageError}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
