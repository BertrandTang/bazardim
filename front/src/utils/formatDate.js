/** Formate une date de l'API ("2026-11-23T10:15:00Z") en texte français : "23/11/2026". */
export function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR');
}
