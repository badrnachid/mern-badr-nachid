# MERN Badr Nachid

Application full stack MERN (Node.js, Express, MongoDB Atlas, HTML/CSS/JS) : afficher et ajouter des éléments, avec basculement automatique entre deux backends.

## Prérequis
- Node.js 18+
- Git
- Compte MongoDB Atlas (cluster de test)

## Installation
```bash
git clone https://github.com/badrnachid/mern-badr-nachid.git
cd mern-badr-nachid/backend
npm install
```
Créer `backend/.env` à partir de `backend/.env.example` avec vos propres valeurs (ne jamais le committer).

## Commandes
- `npm start` : démarrage avec Node.js
- `npm run badr` : démarrage en développement (nodemon)
- Frontend : ouvrir `frontend/index.html` avec Live Server

## Variables d'environnement
| Variable | Description |
|---|---|
| MONGODB_URI | URI de connexion MongoDB Atlas |
| PORT | Port du serveur (3000 par défaut) |
| NODE_ENV | development ou production |
| CORS_ORIGINS | Origines frontend autorisées (séparées par des virgules) |

## Routes API
- `GET /api/health` : vérifie que le serveur répond
- `GET /api/items` : liste des éléments
- `POST /api/items` : crée un élément (`name` requis, min 2 caractères)

## Liens de déploiement
- Frontend Vercel : (à compléter)
- Backend Vercel : (à compléter)
- Backend Railway : (à compléter)