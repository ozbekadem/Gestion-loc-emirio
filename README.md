# Emirio — Gestion locative

Application de gestion locative (immeubles, biens, locataires, baux, paiements,
reversements, travaux, sinistres, prestataires, candidatures, agenda,
messagerie, documents et comptabilité), pensée pour un petit agent immobilier
gérant lui-même son portefeuille.

Le dépôt ne contenait à l'origine qu'un export HTML minifié sans code source
(`emirio-application.html`, conservé ici à titre de référence historique).
Ce projet est une réécriture avec du code source réel (React + Vite +
Tailwind CSS) permettant de reprendre et faire évoluer le développement.

> **Pas de backend.** Toutes les données sont stockées dans le
> `localStorage` du navigateur (voir [Modèle de données](#modèle-de-données)
> et [Limites connues](#limites-connues)).

## Sommaire

- [Démarrage rapide](#démarrage-rapide)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Flux utilisateurs clés](#flux-utilisateurs-clés)
- [Tests](#tests)
- [Conventions de code](#conventions-de-code)
- [Limites connues](#limites-connues)

## Démarrage rapide

Prérequis : [Node.js](https://nodejs.org/) 18+ et npm.

```bash
npm install
npm run dev       # serveur de développement (http://localhost:5173)
```

Au premier chargement, l'application initialise automatiquement un jeu de
données de démonstration (5 immeubles, 20 locataires, baux, paiements,
travaux, un sinistre, etc. — voir `src/data/seed.js`) et le persiste dans le
`localStorage`. Pour repartir de zéro, utilisez le bouton de réinitialisation
dans la page **Paramètres**, ou videz le `localStorage` du site dans les
outils de développement du navigateur.

## Scripts disponibles

| Commande            | Effet                                                        |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Démarre le serveur de développement Vite (rechargement à chaud). |
| `npm run build`        | Build de production dans `dist/`.                             |
| `npm run preview`      | Sert le build de production localement pour vérification.     |
| `npm test`             | Exécute la suite de tests une fois (mode CI).                 |
| `npm run test:watch`   | Exécute les tests en mode watch pendant le développement.     |

## Structure du projet

```
src/
  main.jsx              Point d'entrée React (monte <App/> dans un <StoreProvider>)
  App.jsx                Shell applicatif : barre latérale, navigation, badges de comptage
  index.css              Directives Tailwind
  lib/
    store.jsx             State management (reducer + Context) et persistance localStorage
    nav.jsx                Contexte de navigation (pour naviguer depuis une page enfant)
    taches.js              Moteur de "tâches automatiques" (voir Flux utilisateurs clés)
    utils.js                Formatage (montants, dates), statuts de paiement, liens WhatsApp/mailto
    id.js                   Génération d'identifiants (makeId)
  data/
    seed.js                 Génération des données de démonstration
  components/
    ui.jsx                  Composants UI génériques (Button, Card, Modal, Field, StatCard, ...)
    charts.jsx               Composants de graphiques (LineChart, DonutChart)
    GrillePaiements.jsx       Grille annuelle de saisie des paiements par locataire × mois
  pages/
    Dashboard.jsx, Immeubles.jsx, Locataires.jsx, Baux.jsx, Paiements.jsx,
    Reversements.jsx, Travaux.jsx, Sinistres.jsx, Prestataires.jsx,
    Candidatures.jsx, Agenda.jsx, Messagerie.jsx, Documents.jsx,
    Comptabilite.jsx, Taches.jsx, Parametres.jsx, DossierLocataire.jsx
    Une page = une section de la navigation (voir NAV_SECTIONS dans App.jsx).
docs/
  ARCHITECTURE.md          Explique plus en détail le store, le modèle de données
                            et comment ajouter une page / une collection.
```

## Architecture

- **React 18 + Vite** pour le build et le serveur de dev, **Tailwind CSS**
  pour le style (palette de marque personnalisée dans `tailwind.config.js`).
- **State management** : un unique reducer (`src/lib/store.jsx`) expose,
  pour chaque collection de données (`immeubles`, `locataires`, `baux`,
  `paiements`, ...), des actions `add` / `update` / `remove` via le hook
  `useStore()`. Le state complet est sérialisé dans le `localStorage` à
  chaque changement (`useEffect` sur `state`).
- **Navigation** : pas de routeur — `App.jsx` garde la page active dans un
  `useState` et rend le composant correspondant. `lib/nav.jsx` fournit un
  contexte `useNavigate()` pour qu'une page enfant (ex. Dashboard) puisse
  rediriger vers une autre page (ex. cliquer sur une tâche urgente ouvre la
  page Locataires).
- **Pas de backend / API** : toute la persistance est côté navigateur. Voir
  `docs/ARCHITECTURE.md` pour le détail du schéma de données et des points
  d'extension (ajouter une page, une collection, brancher un vrai backend).

Pour une explication plus complète (schéma de données par collection,
comment ajouter une page ou une collection), voir
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Modèle de données

Le state est un objet avec une clé par collection (voir `COLLECTIONS` dans
`src/lib/store.jsx`) :

`immeubles`, `biens`, `locataires`, `baux`, `paiements`, `travaux`,
`prestataires`, `candidatures`, `agenda`, `sinistres`, `messages`,
`documents`, `etatsDesLieux`.

Les relations se font par identifiants (`bienId`, `bailId`, `locataireId`,
`immeubleId`, ...) plutôt que par imbrication — chaque collection reste un
tableau plat. Le détail des champs par collection est documenté dans
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#modèle-de-données-détaillé).

## Flux utilisateurs clés

- **Encaisser un loyer** (`Paiements` → `GrillePaiements.jsx`) : une grille
  12 mois × locataires actifs ; cliquer une cellule ouvre une modale pour
  choisir le statut (`payé`, `partiel`, `retard`, `attendu`) et le montant
  perçu. Passer une cellule à `attendu` supprime le paiement existant plutôt
  que d'enregistrer une ligne vide.
- **Reverser un loyer au propriétaire** (`Reversements.jsx`) : une fois un
  loyer encaissé, l'application déduit les frais de gestion
  (`montantAReverser` dans `utils.js`) et suit s'il a été reversé
  (`statutReversement`).
- **Tâches automatiques** (`lib/taches.js`, page `Taches.jsx`) : un moteur de
  règles dérive une liste de tâches à traiter à partir du state (loyers
  encaissés non reversés depuis plus de 7 jours, dossiers administratifs
  incomplets, échéances de bail à moins de 90 jours, état des lieux d'entrée
  manquant, pièce d'identité manquante, sinistre non suivi depuis 30 jours,
  travaux urgents non terminés...), triée par urgence
  (`haute` > `moyenne` > `basse`). C'est le cœur métier de l'application —
  voir `src/lib/taches.test.js` pour la spécification exacte de chaque règle.
- **Contacter un prestataire** (`Prestataires.jsx`, `utils.js`) : génère des
  liens `wa.me` (WhatsApp) et `mailto:` pré-remplis pour relancer un
  prestataire, sans passer par une API tierce.
- **Sauvegarde / restauration** (`Parametres.jsx`) : export/import de
  l'intégralité du state en JSON (`importState` dans le store), utile en
  l'absence de backend.

## Tests

Le projet utilise [Vitest](https://vitest.dev/) (aligné sur Vite) avec
[Testing Library](https://testing-library.com/react) pour les tests de
composants, et [jsdom](https://github.com/jsdom/jsdom) comme environnement
DOM.

```bash
npm test          # exécute toute la suite une fois (CI)
npm run test:watch  # mode watch pendant le développement
```

Organisation : les tests vivent à côté du code testé
(`src/lib/utils.test.js` à côté de `src/lib/utils.js`, etc.) plutôt que dans
un dossier `__tests__` séparé, pour qu'ils restent visibles et faciles à
maintenir en même temps que le code.

Couverture actuelle :

- `src/lib/utils.test.js` — fonctions pures de formatage et de calcul
  (montants, dates, statuts de paiement/reversement, liens WhatsApp/mailto).
- `src/lib/id.test.js` — génération d'identifiants.
- `src/lib/taches.test.js` — le moteur de tâches automatiques (une des
  logiques métier les plus critiques de l'app), règle par règle.
- `src/lib/store.test.jsx` — le reducer et la persistance `localStorage`
  (ajout/mise à jour/suppression, rechargement, réinitialisation, import).
- `src/components/GrillePaiements.test.jsx` — flux utilisateur de bout en
  bout : enregistrer un loyer perçu via la grille de paiements et vérifier
  que la cellule affichée et le state persisté sont cohérents.

Ce n'est pas une couverture exhaustive de chaque page (l'UI React elle-même
change souvent) : l'effort est concentré sur la logique métier pure (`lib/`)
et sur un flux transactionnel représentatif de bout en bout, qui sont les
parties les plus coûteuses à casser silencieusement.

Pour ajouter un test :

1. Logique pure (`src/lib/*.js`) → fichier `*.test.js` à côté, tests directs
   sur les fonctions exportées.
2. Composant/page → fichier `*.test.jsx` à côté, rendu avec
   `@testing-library/react` sous un `<StoreProvider>`. Pour un état
   déterministe, pré-remplissez `localStorage.setItem('emirio-gestion-loc-data', JSON.stringify(state))`
   avant le rendu plutôt que de dépendre des données de démonstration
   générées par `seed.js` (qui contiennent des dates relatives et ne sont
   pas garanties stables).

## Conventions de code

- Interface utilisateur et noms de domaine (variables, champs de données) en
  **français**, pour rester cohérent avec le métier ciblé (agences
  immobilières francophones). Le code (noms de fonctions techniques,
  commentaires) suit la même convention dans ce dépôt.
- Pas de framework CSS de composants : tout le style passe par les classes
  utilitaires Tailwind, avec quelques composants UI partagés dans
  `src/components/ui.jsx` (Button, Card, Modal, Field, StatCard...) à
  réutiliser plutôt que dupliquer du balisage stylé.
- Le state ne se modifie jamais directement : toujours passer par les
  actions `add` / `update` / `remove` de `useStore()`.
- Une page = un fichier sous `src/pages/`, ajoutée à `NAV_SECTIONS` dans
  `App.jsx` pour apparaître dans la navigation (voir
  `docs/ARCHITECTURE.md` pour la marche à suivre complète).

## Limites connues

- Pas de backend : toutes les données vivent dans le `localStorage` d'un
  seul navigateur — pas de synchronisation multi-appareils, pas de
  sauvegarde automatique hors export manuel (page Paramètres).
- Pas d'authentification : l'application est prévue pour un usage local /
  mono-utilisateur.
- `emirio-application.html` est un export figé de l'ancienne version
  (minifiée, sans code source associé) conservé uniquement à titre de
  référence historique — il n'est pas maintenu.
