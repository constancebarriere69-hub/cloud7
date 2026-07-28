import type { AppSettings, Scene } from '../types'

function sceneId(): string {
  return crypto.randomUUID()
}

const SCENE_COLORS = ['#7e14ff', '#560cb8', '#0b0c10', '#1f2028', '#47bfff']

export function generateScriptTemplate(topic: string): string {
  const subject = topic.trim() || 'ce sujet'
  return [
    `Accroche : Aujourd'hui on parle de ${subject}.`,
    `Point 1 : Pourquoi ${subject} est important en ce moment.`,
    `Point 2 : Ce qu'il faut savoir sur ${subject}.`,
    `Point 3 : Une astuce concrète à retenir sur ${subject}.`,
    `Conclusion : Résumé et appel à l'action (like, abonne-toi).`,
  ].join('\n\n')
}

export function scriptToScenes(script: string): Scene[] {
  const paragraphs = script
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return paragraphs.map((text, index) => ({
    id: sceneId(),
    text,
    durationSeconds: Math.max(3, Math.min(8, Math.round(text.length / 18))),
    backgroundColor: SCENE_COLORS[index % SCENE_COLORS.length],
  }))
}

interface LlmCallResult {
  script: string
}

async function callAnthropic(apiKey: string, prompt: string): Promise<LlmCallResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`)
  const data = await response.json()
  const script = data.content?.map((block: { text?: string }) => block.text ?? '').join('\n') ?? ''
  return { script }
}

async function callOpenAI(apiKey: string, prompt: string): Promise<LlmCallResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`)
  const data = await response.json()
  const script = data.choices?.[0]?.message?.content ?? ''
  return { script }
}

async function callGoogle(apiKey: string, prompt: string): Promise<LlmCallResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  })
  if (!response.ok) throw new Error(`Google AI API error: ${response.status}`)
  const data = await response.json()
  const script = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('\n') ?? ''
  return { script }
}

function buildPrompt(topic: string): string {
  return [
    `Écris le script d'une courte vidéo YouTube (60-90 secondes, style short/vertical) sur : "${topic}".`,
    'Structure le script en paragraphes séparés par une ligne vide : une accroche, 2 à 4 points clés, une conclusion avec appel à l\'action.',
    'Réponds uniquement avec le script, sans titre ni commentaire.',
  ].join(' ')
}

/**
 * Generates a script. Uses the configured LLM provider when a key is set,
 * otherwise falls back to a deterministic local template.
 *
 * Note: the API key lives in the browser (localStorage) and is sent directly
 * from the client to the provider — fine for personal/local use, but never
 * ship this key handling as-is to a multi-user production deployment.
 */
export async function generateScript(topic: string, settings: AppSettings): Promise<string> {
  if (settings.llmProvider === 'none' || !settings.llmApiKey.trim()) {
    return generateScriptTemplate(topic)
  }

  const prompt = buildPrompt(topic)
  try {
    const result =
      settings.llmProvider === 'anthropic'
        ? await callAnthropic(settings.llmApiKey, prompt)
        : settings.llmProvider === 'openai'
          ? await callOpenAI(settings.llmApiKey, prompt)
          : await callGoogle(settings.llmApiKey, prompt)

    return result.script.trim() || generateScriptTemplate(topic)
  } catch {
    return generateScriptTemplate(topic)
  }
}
