import { STATUTS } from '../utils/format'

export function Badge({ type, valeur }) {
  const [label, kind] = STATUTS[type][valeur] || [valeur, '']
  return <span className={`cs-badge ${kind}`}>{label}</span>
}

export function Stat({ label, valeur, note }) {
  return (
    <div className="cs-card cs-stat">
      <span>{label}</span>
      <b>{valeur}</b>
      {note && <span>{note}</span>}
    </div>
  )
}

export function Table({ colonnes, lignes, vide = 'Aucun élément.' }) {
  return (
    <div className="cs-tablebox">
      <table>
        <thead><tr>{colonnes.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>
          {lignes.length === 0 && <tr><td colSpan={colonnes.length} className="cs-empty">{vide}</td></tr>}
          {lignes.map((cells, i) => <tr key={i}>{cells.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}

export function Entete({ titre, sous, action }) {
  return (
    <div className="cs-top">
      <div><h1>{titre}</h1>{sous && <p className="cs-sub">{sous}</p>}</div>
      {action}
    </div>
  )
}
