# Architecture

Ce document détaille comment l'application est construite, pour faciliter sa
maintenance et son évolution par d'autres développeurs. Pour l'installation
et les commandes de base, voir le [README](../README.md).

## Vue d'ensemble

```
main.jsx
  └─ StoreProvider (lib/store.jsx)   ← state global + persistance localStorage
       └─ App.jsx                     ← shell : barre latérale, page active
            └─ NavProvider (lib/nav.jsx)
                 └─ <Page />          ← une des pages de src/pages/
```

- Pas de routeur (pas d'URL par page) : `App.jsx` garde la page active dans
  un `useState('dashboard')` et affiche le composant correspondant depuis
  `NAV_SECTIONS`.
- Pas de backend : `StoreProvider` charge le state depuis `localStorage` au
  démarrage (ou génère des données de démonstration s'il est vide) et
  réécrit `localStorage` à chaque changement de state.

## Le store (`src/lib/store.jsx`)

Un reducer unique gère toutes les collections de données. Le state a la
forme :

```js
{
  immeubles: [...],
  biens: [...],
  locataires: [...],
  baux: [...],
  paiements: [...],
  travaux: [...],
  prestataires: [...],
  candidatures: [...],
  agenda: [...],
  sinistres: [...],
  messages: [...],
  documents: [...],
  etatsDesLieux: [...],
}
```

`useStore()` retourne `{ state, ...actionsParCollection, resetDemo, importState }`.
Pour chaque nom de collection `c` dans `COLLECTIONS`, on obtient
`useStore()[c]` avec trois méthodes :

```js
const { locataires } = useStore()
locataires.add({ nom: 'Dupuis', prenom: 'Julie', ... })   // ajoute, génère un id (makeId())
locataires.update(id, { statut: 'bon_payeur' })            // fusionne un patch (shallow merge)
locataires.remove(id)                                       // supprime par id
```

Deux actions globales complètent l'API :

- `resetDemo()` — régénère entièrement le state avec `seedData()` (écrase
  tout, utilisé par la page Paramètres).
- `importState(data)` — remplace chaque collection présente dans `data` par
  sa valeur ; les collections absentes de `data` sont conservées telles
  quelles. Utilisé pour restaurer une sauvegarde JSON exportée.

**Règle importante : ne jamais muter `state` directement.** Toute
modification passe par ces actions, qui déclenchent le reducer et la
persistance automatique.

### Ajouter une nouvelle collection

1. Ajouter son nom dans le tableau `COLLECTIONS` (`src/lib/store.jsx`).
2. Si elle doit être peuplée par les données de démonstration, l'ajouter au
   retour de `seedData()` (`src/data/seed.js`).
3. C'est tout — `add` / `update` / `remove` sont génériques et fonctionnent
   immédiatement pour la nouvelle collection.

## Navigation (`src/lib/nav.jsx`, `App.jsx`)

`App.jsx` définit `NAV_SECTIONS`, une liste de sections contenant chacune des
entrées `{ id, label, icon, Component }`. Chaque entrée devient un item de la
barre latérale ; cliquer dessus met à jour `active` et rend le composant
associé.

`NavProvider` expose `useNavigate()` aux pages enfants pour qu'elles
puissent rediriger l'utilisateur (par exemple, cliquer sur une tâche urgente
dans le Dashboard navigue vers la page concernée).

### Ajouter une nouvelle page

1. Créer `src/pages/MaPage.jsx` exportant un composant par défaut. Utiliser
   `useStore()` pour lire/écrire les données et les composants partagés de
   `src/components/ui.jsx` (`Card`, `PageHeader`, `Button`, `Modal`, `Field`,
   `Input`, `Select`, `Textarea`, `Badge`, `EmptyState`, `StatCard`) pour
   rester cohérent visuellement.
2. L'importer dans `App.jsx` et l'ajouter à `NAV_SECTIONS` (dans la section
   la plus pertinente, ou une nouvelle section) avec un `id` unique, un
   `label`, une icône et le composant.
3. Si la page doit être atteignable depuis une autre page (ex. un lien
   "voir le détail"), utiliser `useNavigate()` (`lib/nav.jsx`) plutôt que de
   coupler les pages entre elles directement.

## Modèle de données détaillé

Les relations entre collections se font par identifiants (pas
d'imbrication) : `biens.immeubleId`, `locataires.bienId`, `baux.locataireId`
+ `baux.bienId`, `paiements.bailId`, `travaux.immeubleId` / `bienId`, etc.
Les champs ci-dessous sont ceux réellement utilisés par les pages et le seed
(la liste n'est pas figée par un schéma formel — voir la remarque en fin de
section).

| Collection | Champs principaux |
| --- | --- |
| `immeubles` | `nom`, `adresse`, `codePostal`, `ville`, `type`, `proprietaireNom`, `proprietaireEmail`, `proprietaireTelephone` |
| `biens` | `immeubleId`, `nom`, `etage`, `surface`, `loyerBase`, `charges` |
| `locataires` | `bienId`, `nom`, `prenom`, `email`, `telephone`, `dateEntree`, `statut` (`excellent_payeur` / `bon_payeur` / `mauvais_payeur` / `nouveau`), `notes` |
| `baux` | `locataireId`, `bienId`, `dateDebut`, `dateFin`, `loyer`, `charges`, `depotGarantie`, `statut` (`actif` / `termine` / ...), `frequence`, `loyerInitial`, `indiceInitial`, `indiceActuel`, `dateIndexation`, `fraisGestion`, checklist administratif : `dateEntretienChaudiere`, `dateAttestationAssurance`, `dateVisiteAnnuelle`, `dateOres`, `dateSwde` |
| `paiements` | `bailId`, `mois` (`AAAA-MM`), `montantAttendu`, `montantPaye`, `datePaiement`, `statut` (`paye` / `partiel` / `retard` / `attendu`), `fraisGestion`, `dateReversement` |
| `travaux` | `immeubleId`, `bienId`, `titre`, `description`, `prestataireId`, `statut` (`a_planifier` / `en_cours` / `termine`), `cout`, `date`, `categorie`, `urgence` (`normale` / `urgente`) |
| `prestataires` | `nom`, `metier`, `telephone`, `email`, `adresse` |
| `sinistres` | `immeubleId`, `bienId`, `type`, `compagnieAssurance`, `numeroDossier`, `dateSinistre`, `description`, `statut` (`en_cours` / `cloture`), `montantEstime` |
| `candidatures` | dossier de candidature locataire (formulaire libre, voir `Candidatures.jsx`) |
| `agenda` | événements (visites, rendez-vous, échéances) — voir `Agenda.jsx` |
| `messages` | `locataireId` ou `immeubleId`, `destinataire` (`locataire` / `proprietaire`), `date`, contenu du message |
| `documents` | `locataireId`, `bailId`, `type` (ex. `carte_identite`), `nom`, `mime`, `dataUrl`, `dateAjout` |
| `etatsDesLieux` | `bailId`, `type` (`entree` / `sortie`), `date`, `pieces` (tableau `{nom, etat, commentaire}`), `compteurs`, `nombreCles`, `observations` |

> Il n'y a pas de validation de schéma centralisée : les champs sont définis
> par les formulaires de chaque page (`src/pages/*.jsx`) qui construisent
> l'objet passé à `collection.add(...)`. Si vous ajoutez un champ à un
> formulaire, il apparaît automatiquement dans les objets stockés — pensez à
> mettre à jour cette table et, le cas échéant, `src/data/seed.js` pour que
> les données de démonstration restent représentatives.

## Le moteur de tâches (`src/lib/taches.js`)

`getTaches(state)` parcourt le state et produit une liste de tâches
`{ id, type, urgence, titre, detail, lieu?, locataireId?, immeubleId?, page }`
triée par urgence (`haute` > `moyenne` > `basse`). C'est une fonction pure
(aucune mutation, aucun effet de bord), ce qui la rend facile à tester
unitairement — voir `src/lib/taches.test.js` pour la spécification exacte de
chaque règle (délais, seuils d'urgence) avant de la modifier.

Règles actuelles (voir le code pour le détail précis) :

- Loyer encaissé non reversé depuis plus de 7 jours (`reversement_en_attente`).
- Dossier administratif de bail incomplet (`dossier_administratif`).
- Échéance de bail à moins de 90 jours (`echeance_bail`).
- État des lieux d'entrée manquant sur un bail actif (`etat_des_lieux`).
- Pièce d'identité manquante pour un locataire (`identite_manquante`).
- Contact propriétaire manquant sur un immeuble (`proprietaire_manquant`).
- Sinistre en cours non suivi depuis plus de 30 jours (`sinistre_suivi`).
- Travaux urgents non terminés (`travaux_urgent`).

Pour ajouter une nouvelle règle, suivre le même patron : dériver la tâche
depuis `state`, lui donner un `id` stable et unique (préfixe de type +
identifiant de l'entité source), choisir une `urgence`, puis ajouter un test
dans `taches.test.js` couvrant le cas positif et le cas négatif (seuils).

## Étendre vers un vrai backend

Le store actuel isole déjà la logique métier (reducer + actions) de la
persistance (un seul `useEffect` qui sérialise dans `localStorage`). Pour
brancher une API :

1. Remplacer `loadInitialState()` par un chargement asynchrone (fetch au
   montage, avec un état de chargement) plutôt qu'une lecture synchrone de
   `localStorage`.
2. Remplacer le `useEffect` de sauvegarde par des appels réseau dans les
   actions (`add` / `update` / `remove`), en gardant la même signature pour
   ne pas avoir à toucher aux pages qui consomment `useStore()`.
3. `resetDemo` et `importState` resteront utiles en local/démo mais
   devraient être désactivés ou adaptés en production multi-utilisateurs.

## Tests

Voir la section [Tests du README](../README.md#tests) pour la commande et
l'organisation générale. En résumé :

- Testez la logique métier pure (`src/lib/*.js`) directement, sans rendu
  React — c'est le plus rapide et le plus stable dans le temps.
- Testez les flux de composants critiques avec `@testing-library/react`, en
  préparant un state déterministe via `localStorage.setItem(...)` avant le
  rendu plutôt qu'en dépendant des données de démonstration de `seed.js`
  (générées avec des dates relatives, donc non stables d'une exécution à
  l'autre).
