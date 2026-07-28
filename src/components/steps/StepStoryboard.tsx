import type { Project, Scene } from '../../types'
import { useProjectsStore } from '../../store/projectsStore'
import { scriptToScenes } from '../../lib/scriptGenerator'

export default function StepStoryboard({ project }: { project: Project }) {
  const setScenes = useProjectsStore((s) => s.setScenes)

  function handleGenerateFromScript() {
    setScenes(project.id, scriptToScenes(project.script))
  }

  function updateScene(id: string, patch: Partial<Scene>) {
    setScenes(
      project.id,
      project.scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    )
  }

  function removeScene(id: string) {
    setScenes(
      project.id,
      project.scenes.filter((s) => s.id !== id),
    )
  }

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.durationSeconds, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">2. Storyboard</h2>
        <button
          onClick={handleGenerateFromScript}
          disabled={!project.script.trim()}
          className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          Découper le script en scènes
        </button>
      </div>

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
                <textarea
                  value={scene.text}
                  onChange={(e) => updateScene(scene.id, { text: e.target.value })}
                  rows={2}
                  className="w-full rounded-md bg-white/5 border border-white/10 px-2 py-1 outline-none focus:border-brand-500 text-sm"
                />
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    Durée (s)
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={scene.durationSeconds}
                      onChange={(e) =>
                        updateScene(scene.id, { durationSeconds: Number(e.target.value) || 1 })
                      }
                      className="w-16 rounded-md bg-white/5 border border-white/10 px-2 py-1 outline-none focus:border-brand-500"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    Couleur
                    <input
                      type="color"
                      value={scene.backgroundColor}
                      onChange={(e) => updateScene(scene.id, { backgroundColor: e.target.value })}
                      className="h-7 w-10 rounded border border-white/10 bg-transparent"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
