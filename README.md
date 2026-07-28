# AI Video Studio

Application web pour préparer des vidéos courtes (script → storyboard → rendu →
publication) et les publier directement sur YouTube.

## Démarrer

```bash
npm install
npm run dev
```

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- React Router
- Zustand (réglages en localStorage, projets en IndexedDB via idb-keyval —
  les images IA embarquées dépassent vite le quota localStorage)
- Pollinations.ai (texte→image gratuit, sans clé) pour les visuels de scène
- Canvas + MediaRecorder pour le rendu vidéo côté navigateur
- Google Identity Services + YouTube Data API v3 (upload résumable et
  miniature personnalisée) pour la publication

## Pipeline

1. **Script** — écrit à la main ou généré (modèle local par défaut, ou via une
   clé API OpenAI / Anthropic / Google renseignée dans Réglages).
2. **Storyboard** — le script est découpé en scènes éditables (texte, durée,
   couleur de fond). Chaque scène peut générer gratuitement une image IA
   (Pollinations.ai, sans clé ni inscription) illustrant son texte.
3. **Rendu** — assemble les scènes en une vidéo directement dans le
   navigateur : les scènes avec une image IA sont animées (zoom/pan, effet
   Ken Burns), les autres restent un fond de couleur avec le texte.
4. **Publication** — connexion OAuth à un compte YouTube et upload
   automatique de la vidéo avec titre, description, tags, statut de
   confidentialité, et miniature personnalisée optionnelle (choisie parmi
   les images IA générées).

## Configuration YouTube (OAuth)

1. Crée un projet dans la [Google Cloud Console](https://console.cloud.google.com/).
2. Active l'API **YouTube Data API v3**.
3. Configure l'écran de consentement OAuth (mode test suffit pour un usage
   personnel).
4. Crée un identifiant **OAuth Client ID** de type « Application Web » et
   ajoute l'origine de cette application (ex : `http://localhost:5173`, ou
   l'URL de déploiement) dans les « Origines JavaScript autorisées ».
5. Colle le Client ID obtenu dans **Réglages** de l'application.

Aucune clé ou secret n'est codé en dur dans l'application : le Client ID
et les éventuelles clés de génération de script sont saisis par
l'utilisateur et stockés uniquement dans le `localStorage` du navigateur.

## Limites connues

- Les visuels de scène sont des images IA statiques animées (zoom/pan), pas
  une vidéo générée image par image par un modèle de diffusion vidéo — Veo,
  Runway et équivalents n'ont pas d'offre API réellement gratuite, donc pas
  branchés pour l'instant. Pas de narration audio non plus.
- Pollinations.ai peut être lent ou temporairement indisponible (service
  gratuit, sans SLA) ; en cas d'échec la scène retombe automatiquement sur
  un fond de couleur avec le texte.
- Le flux OAuth utilisé est un flux implicite : le token d'accès est
  de courte durée et l'utilisateur doit se reconnecter à chaque publication.
- La miniature personnalisée nécessite une chaîne YouTube vérifiée par
  téléphone ; sinon YouTube refuse l'envoi (la vidéo reste publiée, un
  message le signale).
- Les clés API de génération de script, si configurées, sont utilisées
  directement depuis le navigateur : adapté à un usage personnel, pas à un
  déploiement multi-utilisateurs sans backend intermédiaire.
