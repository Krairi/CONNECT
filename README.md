# DOMYLI CONNECT

Front-end DOMYLI connecté à Supabase via RPC sur le schéma `app`.

## Positionnement

DOMYLI est un système d’exploitation du foyer / ERP domestique intelligent.
Ce dépôt contient le front-end de mise en œuvre et d’exploitation des capacités DOMYLI.

## Parcours actuellement livré

- Landing premium
- Authentification Supabase
- Création du premier foyer
- Création du premier profil
- Dashboard minimum
- Inventory
- Shopping
- Meals
- Status
- Tasks
- Capacity

## Architecture

- React
- TypeScript
- Vite
- Tailwind CSS v4
- Supabase
- RPC front via `supabase.schema("app").rpc(...)`

## Variables d’environnement

Créer `.env.local` à partir de `.env.example` :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_NAME`
- `VITE_APP_ENV`
- `VITE_ENABLE_MONITORING`

## Installation

```bash
npm install