# 🔒 Guide de sécurisation de la clé API Airtable

## ✅ Ce qui a été fait

Votre clé API Airtable est maintenant **sécurisée** et ne sera plus visible dans le code front-end ! Voici les changements :

### 1. **API Backend créée** (`/api/airtable.ts`)
- Fonction serverless Vercel qui gère toutes les requêtes Airtable
- La clé API reste côté serveur (invisible pour l'utilisateur)
- Support des actions : fetch, create, update

### 2. **Front-end modifié** (`index.tsx`)
- Toutes les requêtes passent maintenant par l'API backend
- Plus de clé API exposée dans le navigateur
- Même fonctionnalité, meilleure sécurité

### 3. **Configuration**
- `vercel.json` : Configuration du déploiement
- `env.example` : Template pour les variables d'environnement

## 🚀 Déploiement sur Vercel

### Étape 1 : Configurer les variables d'environnement sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez ces variables :

```
VITE_AIRTABLE_API_KEY=votre_vraie_clé_api
VITE_AIRTABLE_BASE_ID=votre_base_id
```

**OU** (alternative) :

```
AIRTABLE_API_KEY=votre_vraie_clé_api
AIRTABLE_BASE_ID=votre_base_id
```

### Étape 2 : Déployer

Poussez le code sur GitHub (déjà fait ✅) et Vercel redéploiera automatiquement.

Ou manuellement :
```bash
vercel --prod
```

## 📝 Pour le développement local

1. Créez un fichier `.env.local` à la racine :
```bash
VITE_AIRTABLE_API_KEY=votre_clé_api
VITE_AIRTABLE_BASE_ID=votre_base_id
```

2. Lancez le serveur de dev :
```bash
npm run dev
```

## 🔍 Vérification

Pour vérifier que la clé est bien masquée :
1. Ouvrez l'inspecteur du navigateur (F12)
2. Allez dans l'onglet **Network**
3. Les requêtes vont vers `/api/airtable` au lieu de `api.airtable.com`
4. Aucune clé API visible ! ✅

## ⚠️ Important

- **NE JAMAIS** commiter le fichier `.env.local`
- Le fichier `.env.local` est déjà dans `.gitignore`
- Seul le fichier `env.example` (template) est versionné

## 📚 Architecture

```
Frontend (index.tsx)
    ↓ fetch('/api/airtable')
Backend Serverless (/api/airtable.ts)
    ↓ avec clé API sécurisée
Airtable API
```

La clé API reste toujours côté serveur, invisible pour le client ! 🔐
