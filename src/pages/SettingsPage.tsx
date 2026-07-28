import { useSettingsStore } from '../store/settingsStore'

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Réglages</h1>
        <p className="text-white/60 text-sm">
          Ces clés sont stockées uniquement dans le navigateur (localStorage) et ne transitent que
          vers les fournisseurs concernés (Google, OpenAI, Anthropic). Elles ne sont jamais
          envoyées ailleurs ni écrites dans le code de l'application.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Publication YouTube</h2>
        <label className="block text-sm">
          Google OAuth Client ID
          <input
            value={settings.googleClientId}
            onChange={(e) => updateSettings({ googleClientId: e.target.value })}
            placeholder="xxxxxxxxxx.apps.googleusercontent.com"
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 font-mono text-sm"
          />
        </label>
        <p className="text-xs text-white/50">
          Créé dans Google Cloud Console → APIs &amp; Services → Identifiants → ID client OAuth
          (type « Application Web »), avec l'API YouTube Data v3 activée et l'origine de cette
          appli ajoutée aux origines JavaScript autorisées.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Génération de script par IA (optionnel)</h2>
        <label className="block text-sm">
          Fournisseur
          <select
            value={settings.llmProvider}
            onChange={(e) =>
              updateSettings({ llmProvider: e.target.value as typeof settings.llmProvider })
            }
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500"
          >
            <option value="none">Aucun (modèle local, gratuit)</option>
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="google">Google AI (Gemini)</option>
          </select>
        </label>
        <label className="block text-sm">
          Clé API
          <input
            type="password"
            value={settings.llmApiKey}
            onChange={(e) => updateSettings({ llmApiKey: e.target.value })}
            disabled={settings.llmProvider === 'none'}
            className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-brand-500 disabled:opacity-50 font-mono text-sm"
          />
        </label>
      </section>
    </div>
  )
}
