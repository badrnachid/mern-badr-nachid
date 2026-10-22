# MERN Badr Nachid

Petite application MERN pour afficher et ajouter des éléments. Le frontend peut basculer du backend principal vers un backend de secours si la requête échoue.

## Prérequis

- Node.js 18 ou plus récent et npm
- Git
- Une base MongoDB Atlas de test
- Comptes Vercel, Railway et GitHub pour les déploiements

## Installation locale

```bash
git clone https://github.com/badrnachid/mern-badr-nachid.git
cd mern-badr-nachid/backend
npm install
```

Copiez `.env.example` vers `.env`, puis renseignez `MONGODB_URI` avec l'URI de votre base de test. Le fichier `.env` est ignoré par Git et ne doit jamais être publié.

## Démarrage

Depuis `backend/` :

```bash
npm start       # serveur Node.js
npm run badr    # serveur de développement avec nodemon
```

Le serveur écoute sur `PORT` ou `3000`. Pour le frontend local, servez `frontend/` avec Live Server (origine par défaut autorisée : `http://localhost:5500`). Modifiez les deux URL de `frontend/config.js` selon les backends à utiliser.

## Variables d'environnement du backend

| Variable | Utilisation |
|---|---|
| `MONGODB_URI` | URI secrète de la base Atlas de test |
| `PORT` | Port fourni par Railway ou valeur locale `3000` |
| `NODE_ENV` | `development` ou `production` |
| `CORS_ORIGINS` | Origines frontend autorisées, séparées par des virgules |

Configurez ces variables séparément dans les projets Vercel et Railway. Utilisez la même base de test sur les deux backends pour conserver les mêmes données et assurer l'idempotence entre eux. N'affichez jamais les valeurs secrètes dans une démonstration.

## Routes API

| Méthode | Route | Résultat |
|---|---|---|
| `GET` | `/api/health` | Statut de disponibilité du processus API |
| `GET` | `/api/items` | Liste des éléments MongoDB |
| `POST` | `/api/items` | Crée un élément avec `name` (2 à 120 caractères), `description` (facultative, max. 500) et `requestId` (facultatif) |

`requestId` sert de clé d'idempotence : un nouvel essai avec le même identifiant retourne l'élément existant. Pour que cela protège aussi contre les bascules entre les deux backends, les deux doivent partager la même base MongoDB. Chaque nouvelle soumission de formulaire crée un nouvel identifiant.

## Frontend et bascule

Dans `frontend/config.js`, définissez :

- `PRIMARY_API` : URL complète du backend principal (Railway)
- `SECONDARY_API` : URL complète du backend de secours (Vercel)
- `TIMEOUT_MS` : délai maximal d'une tentative, en millisecondes

La fonction `apiFetch()` vérifie `response.ok`, applique un délai avec `AbortController` et essaie le backend secondaire après une erreur réseau, un délai dépassé ou une réponse HTTP 4xx/5xx. Si les deux tentatives échouent, l'interface affiche un message d'erreur.

Pour vérifier la bascule :

1. Avec les deux backends disponibles, vérifiez que la requête aboutit sur Railway.
2. Remplacez temporairement l'URL principale par une URL invalide et vérifiez le repli vers Vercel.
3. Rendez les deux URL invalides et vérifiez le message d'erreur dans l'interface.
4. Soumettez un élément en partageant la même base entre les backends et vérifiez qu'un retry ayant le même `requestId` ne crée pas de doublon.

Un retry HTTP ne peut pas garantir l'absence de doublons si le premier serveur a écrit dans une base distincte ou si le second n'a pas accès à la même clé d'idempotence.

## Déploiement

### Frontend Vercel

Importez le dépôt GitHub dans Vercel, choisissez `frontend/` comme Root Directory, renseignez les vraies URL des deux backends dans `frontend/config.js`, puis déployez le site statique. Ajoutez les origines Vercel aux variables `CORS_ORIGINS` des deux backends.

### Backend Vercel

Importez le dépôt, choisissez `backend/` comme Root Directory et déployez avec `backend/vercel.json`. Dans les paramètres du projet, configurez `MONGODB_URI`, `NODE_ENV=production` et `CORS_ORIGINS`, puis vérifiez `/api/health` et `/api/items`.

### Backend Railway

Créez un projet Railway depuis le dépôt avec `backend/` comme dossier racine. La commande de démarrage est `npm start`. Configurez séparément `MONGODB_URI`, `NODE_ENV=production` et `CORS_ORIGINS` dans les variables Railway, puis vérifiez `/api/health` et `/api/items`.

## Liens de livraison

- Dépôt GitHub : <https://github.com/badrnachid/mern-badr-nachid>
- Frontend Vercel : à renseigner après déploiement
- Backend Vercel (`/api/health`) : à renseigner après déploiement
- Backend Railway (`/api/health`) : à renseigner après déploiement

## Git et secrets

`.gitignore` exclut `node_modules/`, `.env`, les fichiers `.env.*` (sauf `.env.example`), les sorties de build et les paramètres locaux Vercel. Faites un commit séparé pour chaque étape demandée et poussez les commits après validation.
