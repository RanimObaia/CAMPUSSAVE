// Graphiques légers en SVG pour le tableau de bord administrateur (aucune bibliothèque).

export const COULEURS = ['var(--vert)', 'var(--ble, #d9ad55)', 'var(--harissa)', '#4f8fa8', '#8a6fb0', '#8d9a91']

// Camembert (anneau) avec le total au centre et une légende : libellé, valeur, pourcentage.
// donnees : [{ libelle, valeur, couleur? }]
export function Camembert({ titre, sous, donnees, centre, unite, vide = 'Aucune donnée pour le moment.' }) {
  const parts = donnees.filter((d) => d.valeur > 0)
  const total = parts.reduce((n, d) => n + d.valeur, 0)
  const R = 15.9155 // circonférence = 100 : une part de 25 % = 25 unités de trait
  let cumul = 0
  const resume = parts.map((d) => `${d.libelle} : ${d.valeur}`).join(', ')
  return (
    <section className="cs-card camembert">
      <h2>{titre}</h2>
      {sous && <p className="cs-sub">{sous}</p>}
      {total === 0 ? (
        <p className="cs-sub camembert-vide">{vide}</p>
      ) : (
        <div className="camembert-corps">
          <svg viewBox="0 0 42 42" role="img" aria-label={`${titre} : ${resume}`}>
            <circle cx="21" cy="21" r={R} fill="none" stroke="var(--sable)" strokeWidth="6" />
            {parts.map((d, i) => {
              const part = (d.valeur / total) * 100
              const cercle = (
                <circle key={d.libelle} cx="21" cy="21" r={R} fill="none" strokeWidth="6"
                  stroke={d.couleur || COULEURS[i % COULEURS.length]}
                  strokeDasharray={`${part} ${100 - part}`} strokeDashoffset={25 - cumul}>
                  <title>{`${d.libelle} : ${d.valeur} (${Math.round(part)} %)`}</title>
                </circle>
              )
              cumul += part
              return cercle
            })}
            <text x="21" y={unite ? 21.5 : 23.5} textAnchor="middle" className="camembert-total">{centre ?? total}</text>
            {unite && <text x="21" y="26.5" textAnchor="middle" className="camembert-unite">{unite}</text>}
          </svg>
          <ul className="camembert-legende">
            {parts.map((d, i) => (
              <li key={d.libelle}>
                <i style={{ background: d.couleur || COULEURS[i % COULEURS.length] }} aria-hidden="true" />
                <span>{d.libelle}</span>
                <b>{d.valeur}</b>
                <em>{Math.round((d.valeur / total) * 100)} %</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// Courbe avec aire (une valeur par point). points : [{ etiquette, valeur }]
export function Courbe({ titre, sous, points, format = (v) => v }) {
  const L = 560
  const H = 190
  const m = 28
  const max = Math.max(1, ...points.map((p) => p.valeur))
  const x = (i) => m + (i * (L - 2 * m)) / Math.max(1, points.length - 1)
  const y = (v) => H - m - (v / max) * (H - 2 * m)
  const ligne = points.map((p, i) => `${x(i)},${y(p.valeur)}`).join(' ')
  const aire = `${x(0)},${H - m} ${ligne} ${x(points.length - 1)},${H - m}`
  const reperes = [0, Math.floor((points.length - 1) / 2), points.length - 1]
  return (
    <section className="cs-card courbe">
      <h2>{titre}</h2>
      {sous && <p className="cs-sub">{sous}</p>}
      <svg viewBox={`0 0 ${L} ${H}`} role="img" aria-label={`${titre} : ${points.map((p) => `${p.etiquette} ${format(p.valeur)}`).join(', ')}`}>
        <line x1={m} x2={L - m} y1={H - m} y2={H - m} className="courbe-base" />
        <line x1={m} x2={L - m} y1={y(max)} y2={y(max)} className="courbe-base courbe-pointille" />
        <text x={m} y={y(max) - 6} className="courbe-axe">{format(max)}</text>
        <polygon points={aire} className="courbe-aire" />
        <polyline points={ligne} className="courbe-ligne" />
        {points.map((p, i) => (
          <circle key={p.etiquette} cx={x(i)} cy={y(p.valeur)} r="3.5" className="courbe-point">
            <title>{`${p.etiquette} : ${format(p.valeur)}`}</title>
          </circle>
        ))}
        {reperes.map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} className="courbe-axe">{points[i]?.etiquette}</text>
        ))}
      </svg>
    </section>
  )
}
