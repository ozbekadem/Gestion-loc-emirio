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

### Intégrité référentielle à la suppression

Le store ne connaît pas les relations entre collections (`add`/`update`/
`remove` sont génériques) : c'est aux pages de décider quoi faire des
enregistrements qui référencent l'élément supprimé, avant d'appeler
`remove()`. Deux stratégies coexistent selon la page :

- **Bloquer la suppression** si des enfants existent (`Immeubles.jsx` refuse
  de supprimer un immeuble tant qu'il contient des biens, ou un bien tant
  qu'il est occupé).
- **Avertir puis cascader** quand bloquer serait trop contraignant en usage
  réel (`Baux.jsx` : supprimer un bail supprime aussi ses `paiements` et
  `etatsDesLieux`, après confirmation mentionnant le nombre d'enregistrements
  concernés).

Si vous ajoutez une suppression sur une collection qui sert de "parent" à
d'autres (un `bailId`, `immeubleId`, `locataireId`, etc. référencé ailleurs),
choisissez explicitement l'une de ces deux stratégies plutôt que de laisser
les enfants devenir orphelins. Un enregistrement orphelin silencieux est
dangereux dès qu'une page agrège des montants en itérant directement sur la
collection enfant (comme `Reversements.jsx` ou `Comptabilite.jsx` le font
sur `paiements`) : il continue à être compté dans les totaux financiers
indéfiniment, sans qu'aucune page ne permette de l'identifier ou de le
supprimer. C'est exactement le bug qu'a corrigé `Baux.jsx` `remove()` — voir
`src/pages/Baux.test.jsx` pour la régression associée.

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
4. Si la page gère une collection avec un formulaire de création/édition en
   modale (le cas le plus courant), utiliser `useCrudModal` plutôt que de
   réécrire le pattern à la main — voir la section suivante.

## Modales de formulaire (`useCrudModal`) et confirmations (`useConfirm`)

Ces deux primitives évitent de dupliquer le code que chaque page CRUD
réécrivait auparavant (state de modale, ouverture en création/édition,
`window.confirm`/`window.alert`).

### `useCrudModal` (`src/lib/useCrudModal.js`)

Encapsule le pattern "modale de création/édition" utilisé par Immeubles,
Locataires, Baux, Travaux, Prestataires, Candidatures, Agenda et Sinistres :

```jsx
const emptyLocataire = { nom: '', prenom: '', statut: 'nouveau' }

function MaPage() {
  const { locataires } = useStore()
  const modal = useCrudModal(locataires, emptyLocataire)
  // optionnel : un 3e argument (values) => payload pour coercer des nombres,
  // calculer des champs dérivés, etc. avant add/update — voir Baux.jsx ou
  // Sinistres.jsx pour un exemple.

  return (
    <>
      <Button onClick={() => modal.openNew()}>+ Ajouter</Button>
      {/* modal.openNew(overrides) et modal.openEdit(item, overrides) acceptent
          un objet ou une fonction pour préremplir certains champs */}

      <Modal open={!!modal.modal} onClose={modal.close} ...>
        <form onSubmit={modal.save}>
          <Input value={modal.modal.values.nom} onChange={modal.field('nom')} />
          {/* field(key) est un raccourci pour un onChange qui met à jour
              modal.modal.values[key] avec e.target.value */}
        </form>
      </Modal>
    </>
  )
}
```

`modal.setValues(patch)` reste disponible pour les cas qui ne sont pas un
simple champ texte (un `onChange` qui réinitialise un autre champ, un
tableau de photos ajouté par un `FileReader`...) — voir `Travaux.jsx`.

Ne pas utiliser `useCrudModal` pour une modale qui n'est pas un
"formulaire → add/update d'une entité" (ex. la modale de cellule de
`GrillePaiements.jsx`, ou la modale à 3 modes `create`/`view` des états des
lieux dans `DossierLocataire.jsx`) : le pattern générique ajouterait de la
confusion plutôt que d'en retirer.

### `useConfirm` (`src/lib/confirm.jsx`)

Remplace `window.confirm()` / `window.alert()` par une boîte de dialogue
stylée cohérente avec le reste de l'app (les dialogues natifs du navigateur
sont visuellement disparates et ne peuvent pas être habillés). Rendue une
seule fois au sommet de l'app (`ConfirmProvider` dans `main.jsx`) :

```jsx
const confirm = useConfirm()

// Remplace : if (confirm('Supprimer ?')) foo.remove(id)
async function remove(item) {
  if (await confirm(`Supprimer "${item.nom}" ?`, { danger: true })) foo.remove(item.id)
}

// Remplace : alert('Action impossible.')
await confirm('Action impossible : ...', { okOnly: true })
```

`danger: true` met le bouton de confirmation en évidence (action
destructive) ; `okOnly: true` n'affiche qu'un bouton "OK" (équivalent d'une
alerte) et résout toujours `true`.

## Listes de statuts (`createStatutLookup`) et notification propriétaire

### `createStatutLookup` (`src/lib/utils.js`)

Plusieurs pages définissent une liste de statuts/types (`STATUTS`, `TYPES`)
accompagnée d'une fonction locale `statutInfo(v)` / `typeInfo(v)` qui
retrouve l'entrée correspondante avec un repli sur une valeur par défaut si
`v` est absente ou inconnue. `createStatutLookup(list, fallbackIndex = 0)`
fabrique directement cette fonction :

```js
const STATUTS = [
  { value: 'actif', label: 'Actif', tone: 'green' },
  { value: 'termine', label: 'Terminé', tone: 'slate' },
]

const statutInfo = createStatutLookup(STATUTS)          // repli sur STATUTS[0]
const typeInfo = createStatutLookup(TYPES, 3)             // repli sur TYPES[3]
```

Utilisé par `Baux.jsx`, `Sinistres.jsx`, `Candidatures.jsx`, `Travaux.jsx` et
`Agenda.jsx`. `statutPaiementInfo` et `statutLocataireInfo` (aussi dans
`utils.js`) sont eux-mêmes construits avec cette factory.

`calculerStatutPaiement(montantPaye, montantAttendu)` centralise la règle
"retard / partiel / payé" utilisée à la fois par `GrillePaiements.jsx` et
`Paiements.jsx`, pour éviter de dupliquer le même ternaire à plusieurs
endroits d'un même fichier.

### `useNotifierProprietaire` (`src/lib/useNotifierProprietaire.js`)

`Sinistres.jsx` et `Travaux.jsx` notifient toutes deux le propriétaire d'un
immeuble en créant un message interne puis en affichant son récapitulatif
dans une modale. Ce hook porte la partie mécanique commune (création du
message, mémorisation du récapitulatif) ; chaque page reste responsable de
retrouver l'immeuble concerné et de composer son texte, propre à son métier :

```jsx
const { notif, setNotif, notifier } = useNotifierProprietaire()

function notifierProprietaire(sinistre) {
  const immeuble = state.immeubles.find((i) => i.id === sinistre.immeubleId)
  if (!immeuble) return
  const texte = /* texte spécifique au sinistre */
  notifier(immeuble, `Sinistre — ${sinistre.type} — ${immeuble.nom}`, texte)
}
```

## Découper une page volumineuse en sous-composants

`DossierLocataire.jsx` est composé de plusieurs sections indépendantes
(coordonnées, bail, paiements, suivi administratif, documents, travaux,
états des lieux, messagerie) suivies de plusieurs modales. Plutôt que de
garder tout ça dans un seul fichier, chaque section vit dans
`src/pages/dossier-locataire/` :

- `constants.js` — listes et fonctions pures partagées par les sous-composants
  (`TYPES_DOCUMENT`, `emptyEtatDesLieux`, `toneEtat`...).
- `Carte*.jsx` — un composant de présentation par section, qui reçoit ses
  données et ses callbacks en props (aucun ne lit `useStore()` directement).
- `Modal*.jsx` — une modale par cas d'usage (relance, aperçu de document,
  état des lieux).

`DossierLocataire.jsx` reste le seul composant à lire `useStore()` : il
calcule les données dérivées, définit les handlers (mutations du store,
confirmations) et les distribue aux sous-composants. Ce découpage (état et
effets de bord dans la page, présentation pure dans les sous-composants)
est le patron à suivre si une autre page grossit au point de devenir
difficile à lire : créer un sous-dossier `src/pages/<nom-de-la-page>/` plutôt
que d'ajouter des composants génériques partagés entre pages sans rapport.

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
- Pour une page qui utilise `useConfirm()` (la plupart des pages avec une
  suppression), utiliser `renderWithProviders` (`src/test/renderWithProviders.jsx`)
  plutôt que d'envelopper manuellement `<StoreProvider>`/`<ConfirmProvider>` —
  et interagir avec la boîte de dialogue de confirmation comme avec n'importe
  quel autre élément de l'UI (elle n'est plus un `window.confirm` à mocker) :
  voir `src/pages/Baux.test.jsx` pour un exemple complet.
