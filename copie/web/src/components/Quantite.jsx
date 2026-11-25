// Sélecteur de quantité − 1 + (boutons désactivés aux limites)
export default function Quantite({ valeur, min = 1, max, onChange, label = 'Quantité' }) {
  return (
    <div className="et-qte" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(valeur - 1)} disabled={valeur <= min} aria-label="Diminuer">−</button>
      <span aria-live="polite">{valeur}</span>
      <button type="button" onClick={() => onChange(valeur + 1)} disabled={valeur >= max} aria-label="Augmenter">+</button>
    </div>
  )
}
