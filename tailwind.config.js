/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "Clarté" (design system partagé, voir docs/ARCHITECTURE.md)
        // appliquée sur les jetons existants : chaque page qui écrit déjà
        // bg-brand-600, text-slate-500, etc. en hérite sans aucune
        // modification de fichier — seule la valeur du jeton change.
        //
        // Primaire — indigo → violet, dégradé 135°, une seule action
        // principale par écran.
        brand: {
          50: '#eef0ff',
          100: '#e0e3fc',
          200: '#c7cbf9',
          300: '#a5abf3',
          400: '#8b5cf6', // primaire-2 (fin du dégradé)
          500: '#6a5cee',
          600: '#4f46e5', // primaire
          700: '#3730a3', // primaire-texte
          800: '#2e2680',
          900: '#241d63',
        },
        // Accent — brass/or chaud, conservé tel quel : Clarté ne définit pas
        // de second accent, et ce ton sert déjà à distinguer un signal "au
        // top" (ex. recouvrement à 100%) d'un succès générique.
        accent: {
          50: '#fdf8ec',
          100: '#faedc9',
          200: '#f5d98d',
          300: '#eebd52',
          400: '#e2a02e',
          500: '#cc841c',
          600: '#a86615',
          700: '#854f14',
          800: '#6b3f14',
          900: '#583414',
        },
        // Suivi — statut d'un dossier : à jour (vert), partiel/à traiter
        // (orange), en retard (rouge). Seule la couleur change de valeur ;
        // toujours accompagnée d'un mot (jamais la couleur seule).
        success: {
          50: '#eafaf0',
          100: '#d1f5e0',
          200: '#a3ebc2',
          500: '#16b364', // suivi-vert
          600: '#0f9552',
          700: '#0c7a43',
        },
        warning: {
          50: '#fff3ea',
          100: '#ffe4cc',
          200: '#ffc89a',
          500: '#f97316', // suivi-orange
          600: '#ea670a',
          700: '#c2570a',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444', // suivi-rouge (valeur déjà identique)
          600: '#dc2626',
          700: '#b91c1c',
        },
        // WhatsApp — couleur de marque, réservée au bouton de contact
        // WhatsApp (jamais pour un statut).
        whatsapp: {
          500: '#25d366',
          600: '#1fb155',
        },
        // Neutres Clarté : fond (50), surface-2 (100), bord (200), doux
        // (500), texte (900). 300/400/600/700/800 restent les gris Tailwind
        // par défaut, déjà très proches des valeurs Clarté non spécifiées.
        slate: {
          50: '#f4f5fa',
          100: '#eef0f5',
          200: '#e5e7ef',
          500: '#6b7280',
          900: '#111827',
        },
      },
      backgroundImage: {
        // Dégradé principal "Clarté" : primaire → primaire-2, 135°, réservé
        // à une seule action principale par écran (bouton primaire, bandeau
        // d'accueil, jour choisi, logo).
        'gradient-brand': 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #eebd52 0%, #cc841c 60%, #a86615 100%)',
        'gradient-whatsapp': 'linear-gradient(135deg, #25d366 0%, #1fb155 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1c2545 0%, #161d38 45%, #10152a 100%)',
        'gradient-mesh': 'radial-gradient(60rem 30rem at 100% -10%, rgba(79,70,229,0.10), transparent 60%), radial-gradient(50rem 26rem at -10% 0%, rgba(204,132,28,0.08), transparent 55%)',
        'gradient-card-brand': 'linear-gradient(135deg, rgba(79,70,229,0.10), rgba(79,70,229,0.02))',
        'gradient-card-accent': 'linear-gradient(135deg, rgba(204,132,28,0.12), rgba(204,132,28,0.02))',
        'gradient-card-success': 'linear-gradient(135deg, rgba(22,179,100,0.12), rgba(22,179,100,0.02))',
        'gradient-card-danger': 'linear-gradient(135deg, rgba(239,68,68,0.10), rgba(239,68,68,0.02))',
      },
      boxShadow: {
        // "ombre-carte" du design Clarté : à peine visible, pour tout ce qui
        // est posé (cartes, boutons secondaires).
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 6px 24px -8px rgba(15,23,42,0.10)',
        // "ombre-flottante" : pour ce qui flotte au-dessus du contenu (barre
        // d'onglets, bouton d'action flottant, feuilles).
        'soft-lg': '0 10px 30px -8px rgba(15,23,42,0.25), 0 2px 6px rgba(15,23,42,0.08)',
        // "ombre-primaire" : halo coloré sous un élément en dégradé.
        'glow-brand': '0 10px 24px -8px rgba(79,70,229,0.5)',
        'glow-accent': '0 10px 26px -8px rgba(204,132,28,0.45)',
        'glow-whatsapp': '0 10px 24px -8px rgba(37,211,102,0.45)',
        'inner-line': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp .35s ease-out both',
      },
    },
  },
  plugins: [],
}
