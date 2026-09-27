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
