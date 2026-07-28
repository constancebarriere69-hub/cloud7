import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectsStore } from '../store/projectsStore'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  scripted: 'Script prêt',
  storyboarded: 'Storyboard prêt',
  rendered: 'Vidéo rendue',
  published: 'Publiée',
}

export default function HomePage() {
  const [topic, setTopic] = useState('')
  const projects = useProjectsStore((s) => s.projects)
  const addProject = useProjectsStore((s) => s.addProject)
  const removeProject = useProjectsStore((s) => s.removeProject)
  const navigate = useNavigate()

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim()) return
    const project = addProject(topic.trim())
    setTopic('')
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Nouveau projet vidéo</h1>
        <p className="text-white/60 mb-4">
          Décris le sujet de ta vidéo. Le script, le storyboard, le rendu et la publication YouTube
          se font ensuite étape par étape.
        </p>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex : 5 astuces pour apprendre plus vite"
            className="flex-1 rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-500 hover:bg-brand-600 px-4 py-2 font-medium transition-colors"
          >
            Créer
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Mes projets</h2>
        {projects.length === 0 ? (
          <p className="text-white/50">Aucun projet pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-4 py-3"
              >
                <button
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="text-left flex-1"
                >
                  <div className="font-medium">{project.topic}</div>
                  <div className="text-sm text-white/50">
                    {STATUS_LABELS[project.status]} ·{' '}
                    {new Date(project.updatedAt).toLocaleString('fr-FR')}
                  </div>
                </button>
                <button
                  onClick={() => removeProject(project.id)}
                  className="text-white/40 hover:text-red-400 text-sm px-2"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
