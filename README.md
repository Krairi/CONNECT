# DOMYLI Front

Front-end DOMYLI construit avec React, TypeScript, Vite et Supabase.

## Objectif

Cette application est un front branché sur la base DOMYLI via des RPC du schéma `app`.
Le front ne doit pas appeler directement les tables métier depuis les composants.

## Pré-requis

- Node.js 20+
- npm 10+
- un projet Supabase fonctionnel
- les variables d’environnement renseignées

## Variables d’environnement

Créer un fichier `.env.local` à la racine du projet à partir de `.env.example`.

Exemple :

```bash
cp .env.example .env.local