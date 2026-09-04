# Emirio — Gestion locative

Application de gestion locative (immeubles, biens, locataires, baux, paiements,
travaux, prestataires, candidatures, agenda, documents et comptabilité).

Le dépôt ne contenait à l'origine qu'un export HTML minifié sans code source
(`emirio-application.html`, conservé ici à titre de référence). Ce projet est
une réécriture avec du code source réel (React + Vite + Tailwind CSS) afin de
pouvoir reprendre le développement de l'application.

Les données sont stockées dans le `localStorage` du navigateur (pas de
backend pour l'instant).

## Démarrer

```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
```
