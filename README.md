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
- Zustand (projets et réglages persistés en localStorage)
- Canvas + MediaRecorder pour le rendu vidéo côté navigateur
- Google Identity Services + YouTube Data API v3 (upload résumable) pour la publication

## Pipeline

1. **Script** — écrit à la main ou généré (modèle local par défaut, ou via une
   clé API OpenAI / Anthropic / Google renseignée dans Réglages).
2. **Storyboard** — le script est découpé en scènes éditables (texte, durée,
   couleur de fond).
3. **Rendu** — génère une vidéo placeholder (texte animé sur fond coloré)
   directement dans le navigateur. Cette étape sera branchée sur un vrai
   moteur de génération vidéo IA plus tard ; pour l'instant elle sert à
   valider tout le pipeline jusqu'à la publication.
4. **Publication** — connexion OAuth à un compte YouTube et upload
   automatique de la vidéo avec titre, description, tags et statut de
   confidentialité.

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

- Le rendu vidéo est un placeholder (pas de génération vidéo IA réelle pour
  l'instant), sans narration audio.
- Le flux OAuth utilisé est un flux implicite : le token d'accès est
  de courte durée et l'utilisateur doit se reconnecter à chaque publication.
- Les clés API de génération de script, si configurées, sont utilisées
  directement depuis le navigateur : adapté à un usage personnel, pas à un
  déploiement multi-utilisateurs sans backend intermédiaire.
