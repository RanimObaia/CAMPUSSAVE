// Petites icônes au trait (24×24), dessinées pour CampusSave.
// Elles prennent la couleur du texte (currentColor) et sont décoratives (aria-hidden).
const TRACES = {
  tableau: <><rect x="3.5" y="3.5" width="7" height="8" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="5" rx="1.5" /><rect x="13.5" y="11.5" width="7" height="9" rx="1.5" /><rect x="3.5" y="14.5" width="7" height="6" rx="1.5" /></>,
  etiquette: <><path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.3 7.3a1 1 0 0 1-1.4 0z" /><circle cx="8" cy="8" r="1.4" /></>,
  ticket: <><path d="M5 3.5h14v17l-2.3-1.5-2.4 1.5-2.3-1.5-2.3 1.5-2.4-1.5L5 20.5z" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" /></>,
  qr: <><rect x="3.5" y="3.5" width="6" height="6" rx="1" /><rect x="14.5" y="3.5" width="6" height="6" rx="1" /><rect x="3.5" y="14.5" width="6" height="6" rx="1" /><path d="M14.5 14.5h2.5v2.5M20.5 14.5v6h-3M14.5 20.5v-1.5" /></>,
  boutique: <><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 11.5v9h13v-9M10 20.5v-5h4v5" /></>,
  personne: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6" /></>,
  personnes: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.7-3.6 3.2-5.5 6.5-5.5s5.8 1.9 6.5 5.5" /><path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.7c2.1.6 3.5 2.3 4 5.3" /></>,
  verifie: <><path d="M12 3.2 14.4 5l3-.2.8 2.9 2.5 1.7-1.1 2.8 1.1 2.8-2.5 1.7-.8 2.9-3-.2L12 20.8 9.6 19l-3 .2-.8-2.9-2.5-1.7L4.4 12 3.3 9.2l2.5-1.7.8-2.9 3 .2z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>,
  panier: <><path d="M3.5 4.5h2.2l2.4 11h10.4l2-8H7" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  horloge: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  lieu: <><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" /><circle cx="12" cy="9.8" r="2.3" /></>,
  sortie: <><path d="M14 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8" /><path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" /></>,
  loupe: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
  feuille: <><path d="M5 19c0-9 5.5-14 15-14 0 9.5-5 15-14 15" /><path d="M5 19c3-4 6-6.5 9.5-8.5" /></>,
  fleche: <path d="M19 12H5m6-6-6 6 6 6" />,
  // Catégories d'offres
  PLATS: <><path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z" /><path d="M8.5 9c-.6-1 .6-1.8 0-3M12 9c-.6-1 .6-1.8 0-3M15.5 9c-.6-1 .6-1.8 0-3" /></>,
  BOULANGERIE: <><path d="M3.5 15.5c0-5 3.8-9 8.5-9s8.5 4 8.5 9c0 1.2-1 2-2.2 2H5.7c-1.2 0-2.2-.8-2.2-2z" /><path d="M8 9.5l1.5 8M16 9.5l-1.5 8M12 6.5v11" /></>,
  PATISSERIE: <><path d="M5 11.5h14l-1.5 9h-11z" /><path d="M5 11.5c0-3 2.5-5 5-5 .5-1.5 1.5-2.5 2-2.5s1.5 1 2 2.5c2.5 0 5 2 5 5" /><path d="M9.5 11.5l.5 9M14.5 11.5l-.5 9" /></>,
  BOISSONS: <><path d="M6 6.5h12l-1.5 14h-9z" /><path d="M6.5 11h11M14 6.5l1.5-3.5" /></>,
}

export default function Icone({ nom, taille = 20, className = '' }) {
  return (
    <svg
      className={`icone ${className}`}
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRACES[nom] || TRACES.PLATS}
    </svg>
  )
}
