import { useState } from 'react'
import type { Project } from '../../types'
import { useProjectsStore } from '../../store/projectsStore'
import { useSettingsStore } from '../../store/settingsStore'
import { generateScript } from '../../lib/scriptGenerator'

export default function StepScript({ project }: { project: Project }) {
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState(project.script)
  const setScript = useProjectsStore((s) => s.setScript)
  const settings = useSettingsStore((s) => s.settings)

  async function handleGenerate() {
    setLoading(true)
    try {
      const script = await generateScript(project.topic, settings)
      setDraft(script)
      setScript(project.id, script)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    setScript(project.id, draft)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">1. Script</h2>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-50 px-3 py-1.5 text-sm font-medium transition-colors"
        >
          {loading ? 'Génération…' : 'Générer un script'}
        </button>
      </div>
      <p className="text-sm text-white/50">
        {settings.llmProvider === 'none'
          ? "Aucune clé IA configurée : un script d'exemple sera généré à partir d'un modèle local. Ajoute une clé dans Réglages pour un script personnalisé par IA."
          : `Génération via ${settings.llmProvider}.`}
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        rows={10}
        placeholder="Le script de la vidéo, un paragraphe par scène (sépare les scènes par une ligne vide)."
        className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 font-mono text-sm"
      />
    </div>
  )
}
