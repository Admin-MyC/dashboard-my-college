// Preset heraldic shields for schools
export interface ShieldPreset {
  id: string;
  nombre: string;
  svgDataUrl: string;
}

export const createShieldSvg = (
  primaryColor: string,
  goldColor: string,
  initials: string,
  symbolType: 'book' | 'torch' | 'owl' | 'compass' = 'book'
): string => {
  const symbolSvg = {
    book: `
      <path d="M70 100 C80 92 90 92 100 96 C110 92 120 92 130 100 C120 108 110 108 100 104 C90 108 80 108 70 100 Z" fill="${goldColor}"/>
      <path d="M72 108 C82 100 92 100 100 104 C108 100 118 100 128 108 C118 116 108 116 100 112 C92 116 82 116 72 108 Z" fill="#ffffff" opacity="0.9"/>
    `,
    torch: `
      <polygon points="96,95 104,95 102,120 98,120" fill="${primaryColor}"/>
      <path d="M100 78 C95 84 92 88 100 95 C108 88 105 84 100 78 Z" fill="${goldColor}"/>
      <circle cx="100" cy="87" r="4" fill="#ffedd5"/>
    `,
    owl: `
      <ellipse cx="100" cy="100" rx="18" ry="22" fill="${primaryColor}" stroke="${goldColor}" stroke-width="2"/>
      <circle cx="93" cy="94" r="5" fill="#ffffff"/>
      <circle cx="93" cy="94" r="2.5" fill="${goldColor}"/>
      <circle cx="107" cy="94" r="5" fill="#ffffff"/>
      <circle cx="107" cy="94" r="2.5" fill="${goldColor}"/>
      <polygon points="98,100 102,100 100,105" fill="${goldColor}"/>
    `,
    compass: `
      <circle cx="100" cy="100" r="20" fill="none" stroke="${goldColor}" stroke-width="2.5"/>
      <polygon points="100,82 105,97 100,95 95,97" fill="${goldColor}"/>
      <polygon points="100,118 105,103 100,105 95,103" fill="${primaryColor}"/>
    `,
  }[symbolType];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="#030b14"/>
      </linearGradient>
    </defs>
    <!-- Outer Shield with Gold Accent -->
    <path d="M100 12 L165 36 C165 125 100 178 100 178 C100 178 35 125 35 36 L100 12 Z" fill="none" stroke="${goldColor}" stroke-width="6" stroke-linejoin="round"/>
    <!-- Inner Shield Body -->
    <path d="M100 20 L157 41 C157 118 100 168 100 168 C100 168 43 118 43 41 L100 20 Z" fill="url(#shieldGrad)"/>
    <!-- Diagonal Sash -->
    <path d="M43 55 L130 162 L150 152 L60 45 Z" fill="${goldColor}" opacity="0.35"/>
    <!-- Heraldic Chevron Header -->
    <path d="M100 32 L145 48 L100 64 L55 48 Z" fill="none" stroke="${goldColor}" stroke-width="2"/>
    ${symbolSvg}
    <!-- School Initials Banner -->
    <rect x="65" y="132" width="70" height="22" rx="4" fill="${goldColor}"/>
    <text x="100" y="148" font-family="'Outfit', sans-serif" font-weight="800" font-size="13" fill="${primaryColor}" text-anchor="middle" letter-spacing="1.5">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Escudo oficial institucional de DUNOR (Colegio Cervantes Moderno)
 * Cuatro cuarteles: Árbol del saber, Cruz radiante, fondo carmesí y fondo celeste,
 * con cinta central oficial con tipografía institucional "DUNOR".
 */
export const createDunorShieldSvg = (): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <clipPath id="shieldClip">
        <path d="M100 16 L168 38 C168 128 100 182 100 182 C100 182 32 128 32 38 Z"/>
      </clipPath>
    </defs>
    <!-- Outer Shield Gold Border -->
    <path d="M100 12 L172 36 C172 132 100 188 100 188 C100 188 28 132 28 36 Z" fill="#D97706" stroke="#92400E" stroke-width="2"/>
    
    <!-- Quarters Group clipped to shield -->
    <g clip-path="url(#shieldClip)">
      <!-- Top-Left Quarter: Deep Navy with Tree -->
      <rect x="0" y="0" width="100" height="100" fill="#0E3A75"/>
      <!-- Tree of knowledge -->
      <path d="M60 88 L63 68 L57 68 L60 88 Z" fill="#FFFFFF"/>
      <circle cx="60" cy="54" r="16" fill="#FFFFFF"/>
      <circle cx="50" cy="58" r="12" fill="#FFFFFF"/>
      <circle cx="70" cy="58" r="12" fill="#FFFFFF"/>
      <circle cx="60" cy="46" r="12" fill="#FFFFFF"/>
      <path d="M60 68 L60 52 M60 62 L52 54 M60 60 L68 52" stroke="#0E3A75" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Top-Right Quarter: Radiant Yellow with Cross -->
      <rect x="100" y="0" width="100" height="100" fill="#FBBF24"/>
      <!-- Radiant rays -->
      <path d="M140 54 L122 36 M140 54 L158 36 M140 54 L122 72 M140 54 L158 72" stroke="#FEF08A" stroke-width="2" stroke-linecap="round"/>
      <circle cx="140" cy="54" r="2" fill="#FFFFFF"/>
      <!-- Christian Cross -->
      <rect x="137" y="38" width="6" height="32" rx="1.5" fill="#FFFFFF"/>
      <rect x="127" y="47" width="26" height="6" rx="1.5" fill="#FFFFFF"/>

      <!-- Bottom-Left Quarter: Crimson Red -->
      <rect x="0" y="100" width="100" height="100" fill="#B91C1C"/>

      <!-- Bottom-Right Quarter: Royal / Sky Blue -->
      <rect x="100" y="100" width="100" height="100" fill="#0284C7"/>

      <!-- Horizontal Ribbon with DUNOR Banner -->
      <rect x="25" y="86" width="150" height="28" fill="#FFFFFF" stroke="#0E3A75" stroke-width="1.5"/>
      <text x="100" y="106" font-family="'Outfit', 'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="16" fill="#0E3A75" text-anchor="middle" letter-spacing="3.5">DUNOR</text>
    </g>

    <!-- Shield Outline Accent -->
    <path d="M100 16 L168 38 C168 128 100 182 100 182 C100 182 32 128 32 38 Z" fill="none" stroke="#FFFFFF" stroke-width="3"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
