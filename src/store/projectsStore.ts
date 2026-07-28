import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import type { Project, Scene, PublishMetadata, RenderResult, PublishResult } from '../types'

// Scenes carry base64 AI-generated images, which can quickly outgrow
// localStorage's ~5MB quota. IndexedDB has a much larger practical limit.
const indexedDbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => idbDel(name),
}

function createId(): string {
  return crypto.randomUUID()
}

function defaultPublishMetadata(topic: string): PublishMetadata {
  return {
    title: topic || 'Nouvelle vidéo',
    description: '',
    tags: [],
    privacyStatus: 'private',
    categoryId: '22',
  }
}

export function createProject(topic: string): Project {
  const now = new Date().toISOString()
  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    topic,
    script: '',
    scenes: [],
    publishMetadata: defaultPublishMetadata(topic),
  }
}

interface ProjectsStore {
  projects: Project[]
  addProject: (topic: string) => Project
  removeProject: (id: string) => void
  getProject: (id: string) => Project | undefined
  updateProject: (id: string, updater: (project: Project) => Project) => void
  setScript: (id: string, script: string) => void
  setScenes: (id: string, scenes: Scene[]) => void
  updateScene: (id: string, sceneId: string, patch: Partial<Scene>) => void
  setRender: (id: string, render: RenderResult) => void
  setPublishMetadata: (id: string, metadata: Partial<PublishMetadata>) => void
  setPublishResult: (id: string, publish: PublishResult) => void
}

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (topic) => {
        const project = createProject(topic)
        set((state) => ({ projects: [project, ...state.projects] }))
        return project
      },

      removeProject: (id) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      updateProject: (id, updater) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updater(p) : p)),
        })),

      setScript: (id, script) =>
        get().updateProject(id, (p) => ({
          ...p,
          script,
          status: script.trim() ? 'scripted' : 'draft',
          updatedAt: new Date().toISOString(),
        })),

      setScenes: (id, scenes) =>
        get().updateProject(id, (p) => ({
          ...p,
          scenes,
          status: scenes.length > 0 ? 'storyboarded' : p.status,
          updatedAt: new Date().toISOString(),
        })),

      updateScene: (id, sceneId, patch) =>
        get().updateProject(id, (p) => ({
          ...p,
          scenes: p.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)),
          updatedAt: new Date().toISOString(),
        })),

      setRender: (id, render) =>
        get().updateProject(id, (p) => ({
          ...p,
          render,
          status: 'rendered',
          updatedAt: new Date().toISOString(),
        })),

      setPublishMetadata: (id, metadata) =>
        get().updateProject(id, (p) => ({
          ...p,
          publishMetadata: { ...p.publishMetadata, ...metadata },
          updatedAt: new Date().toISOString(),
        })),

      setPublishResult: (id, publish) =>
        get().updateProject(id, (p) => ({
          ...p,
          publish,
          status: 'published',
          updatedAt: new Date().toISOString(),
        })),
    }),
    {
      name: 'ai-video-studio-projects',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => ({
        projects: state.projects.map((p) => ({
          ...p,
          // Object URLs from MediaRecorder don't survive reloads; drop them on persist.
          render: undefined,
        })),
      }),
    },
  ),
)
