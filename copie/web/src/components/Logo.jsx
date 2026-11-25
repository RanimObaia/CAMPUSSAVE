// Logo CampusSave : une assiette vue de dessus, avec une cloche (le repas sauvé).
export function Assiette({ taille = 32, className = '' }) {
  return (
    <svg className={className} width={taille} height={taille} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="var(--assiette-bord, #1C6A4B)" />
      <circle cx="32" cy="32" r="21" fill="var(--assiette-fond, #F3EDE1)" />
      <path d="M20 37a12 12 0 0 1 24 0z" fill="var(--harissa, #B5432A)" />
      <rect x="18" y="37" width="28" height="3.5" rx="1.75" fill="var(--harissa, #B5432A)" />
      <circle cx="32" cy="23.5" r="2.2" fill="var(--harissa, #B5432A)" />
    </svg>
  )
}

export default function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <Assiette taille={30} />
      <span>CampusSave</span>
    </span>
  )
}
