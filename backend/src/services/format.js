// Petites mises en forme partagées (heures à Tunis)
const versDate = (v) => (v?.toDate ? v.toDate() : new Date(v));
const heureCourte = (v) =>
  v ? versDate(v).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
module.exports = { heureCourte };
