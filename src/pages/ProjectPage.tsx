import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProjectsStore } from '../store/projectsStore'
import StepScript from '../components/steps/StepScript'
import StepStoryboard from '../components/steps/StepStoryboard'
import StepRender from '../components/steps/StepRender'
import StepPublish from '../components/steps/StepPublish'

const STEPS = [
  { key: 'script', label: '1. Script' },
  { key: 'storyboard', label: '2. Storyboard' },
  { key: 'render', label: '3. Rendu' },
  { key: 'publish', label: '4. Publication' },
] as const

type StepKey = (typeof STEPS)[number]['key']

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = useProjectsStore((s) => s.projects.find((p) => p.id === projectId))
  const [activeStep, setActiveStep] = useState<StepKey>('script')

  if (!project) {
    return (
      <div className="space-y-4">
        <p>Projet introuvable.</p>
        <Link to="/" className="underline text-brand-200">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-white/50 hover:text-white">
          ← Tous les projets
        </Link>
        <h1 className="text-2xl font-semibold mt-1">{project.topic}</h1>
      </div>

      <nav className="flex gap-2 border-b border-white/10 pb-2">
        {STEPS.map((step) => (
          <button
            key={step.key}
            onClick={() => setActiveStep(step.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeStep === step.key
                ? 'bg-brand-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {step.label}
          </button>
        ))}
      </nav>

      {activeStep === 'script' && <StepScript project={project} />}
      {activeStep === 'storyboard' && <StepStoryboard project={project} />}
      {activeStep === 'render' && <StepRender project={project} />}
      {activeStep === 'publish' && <StepPublish project={project} />}
    </div>
  )
}
