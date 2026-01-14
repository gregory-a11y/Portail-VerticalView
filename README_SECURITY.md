# Portail Client Vertical View

## Sécurité API

Ce projet utilise des **API Routes Vercel** pour sécuriser les appels Airtable côté serveur.

### Configuration Vercel

1. Aller sur https://vercel.com → votre projet
2. Settings → Environment Variables
3. Ajouter les variables suivantes :
   - `AIRTABLE_API_KEY` = votre clé API Airtable
   - `AIRTABLE_BASE_ID` = votre base ID Airtable
4. Cocher "Production, Preview, Development"
5. Redéployer le projet

### API Routes

Les endpoints suivants sont disponibles :

- `GET /api/client?clientId=xxx` - Récupérer toutes les données client (client, contrats, vidéos, équipe)
- `POST /api/feedback` - Créer un feedback sur une vidéo
- `PATCH /api/update-video` - Mettre à jour le statut d'une vidéo

**Important** : Les clés API ne sont JAMAIS exposées côté client.

## Développement Local

```bash
npm install
npm run dev
```

## Déploiement

Le projet se déploie automatiquement sur Vercel à chaque push sur `main`.
