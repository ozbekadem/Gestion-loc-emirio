import { useState } from 'react'

/**
 * Factorise le pattern "modal de création/édition" répété sur chaque page de
 * gestion de collection (Immeubles, Locataires, Baux, Travaux, Prestataires,
 * Candidatures, Agenda, Sinistres...) : un seul state { mode, id, values },
 * l'ouverture en mode création ou édition, et l'enregistrement via l'API
 * add/update de useStore().
 *
 * @param {{add: Function, update: Function}} collection  API de collection (ex. `const { baux } = useStore()`)
 * @param {object} emptyValues  valeurs par défaut d'un formulaire de création ; sert aussi à
 *   compléter les champs manquants d'un enregistrement plus ancien à l'édition
 * @param {(values: object) => object} [transform]  applique une transformation (coercions
 *   numériques, champs calculés) juste avant l'appel add/update
 */
export function useCrudModal(collection, emptyValues, transform = (v) => v) {
  const [modal, setModal] = useState(null)

  function openNew(overrides) {
    const extra = typeof overrides === 'function' ? overrides() : overrides
    setModal({ mode: 'create', values: { ...emptyValues, ...extra } })
  }

  function openEdit(item, overrides) {
    const extra = typeof overrides === 'function' ? overrides(item) : overrides
    setModal({ mode: 'edit', id: item.id, values: { ...emptyValues, ...item, ...extra } })
  }

  function close() {
    setModal(null)
  }

  // Fusionne un patch partiel dans les valeurs courantes. `patch` peut être un
  // objet, ou une fonction (valeursCourantes) => patchPartiel quand la mise à
  // jour dépend de la valeur actuelle (ex. calculer un champ à partir d'un autre).
  function setValues(patch) {
    setModal((m) => {
      if (!m) return m
      const partial = typeof patch === 'function' ? patch(m.values) : patch
      return { ...m, values: { ...m.values, ...partial } }
    })
  }

  // Raccourci pour brancher un champ contrôlé : onChange={field('prenom')}
  function field(key) {
    return (e) => setValues({ [key]: e.target.value })
  }

  function save(e) {
    e?.preventDefault?.()
    const { mode, id, values } = modal
    const payload = transform(values)
    if (mode === 'create') collection.add(payload)
    else collection.update(id, payload)
    close()
  }

  return { modal, openNew, openEdit, close, setValues, field, save }
}
