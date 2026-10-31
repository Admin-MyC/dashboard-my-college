import { createDunorShieldSvg } from './shieldHelper';

export type ImageFallbackType = 'student' | 'user' | 'product' | 'shield' | 'book' | 'generic';

// Deterministic string hash for consistent palette selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Extract up to 2 uppercase initials from a full name
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'MC';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Student & User Avatar Palettes
const AVATAR_PALETTES = [
  { bg1: '#0F2B5C', bg2: '#1E40AF', text: '#FFFFFF', ring: '#93C5FD' }, // Navy / Royal
  { bg1: '#064E3B', bg2: '#047857', text: '#FFFFFF', ring: '#6EE7B7' }, // Emerald
  { bg1: '#312E81', bg2: '#4F46E5', text: '#FFFFFF', ring: '#C7D2FE' }, // Indigo
  { bg1: '#134E4A', bg2: '#0D9488', text: '#FFFFFF', ring: '#99F6E4' }, // Teal
  { bg1: '#881337', bg2: '#BE123C', text: '#FFFFFF', ring: '#FECDD3' }, // Crimson
  { bg1: '#581C87', bg2: '#7E22CE', text: '#FFFFFF', ring: '#E9D5FF' }, // Purple
  { bg1: '#78350F', bg2: '#D97706', text: '#FFFFFF', ring: '#FDE68A' }, // Amber
  { bg1: '#0C4A6E', bg2: '#0284C7', text: '#FFFFFF', ring: '#BAE6FD' }, // Sky
];

/**
 * Generates a high-quality inline SVG avatar for a student with their initials,
 * academic badge rings, and deterministic color scheme.
 */
export function getStudentAvatarFallback(name: string = 'Estudiante', gradeOrId?: string): string {
  const hash = hashString(name + (gradeOrId || ''));
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const initials = getInitials(name);
  const sublabel = gradeOrId ? gradeOrId.slice(0, 10) : 'ALUMNO';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <!-- Background Circle -->
    <rect width="160" height="160" rx="80" fill="url(#grad-${hash})"/>
    
    <!-- Subtle academic background pattern -->
    <circle cx="80" cy="80" r="70" fill="none" stroke="${palette.ring}" stroke-width="2" stroke-dasharray="4 4" opacity="0.4"/>
    <circle cx="80" cy="80" r="58" fill="none" stroke="${palette.ring}" stroke-width="1.5" opacity="0.25"/>
    
    <!-- Graduation Cap / Academic Symbol -->
    <g transform="translate(80, 42) scale(0.65)" opacity="0.85">
      <polygon points="0,-12 28,0 0,12 -28,0" fill="${palette.ring}"/>
      <path d="M-18,5 L-18,18 C-18,24 18,24 18,18 L18,5" fill="none" stroke="${palette.ring}" stroke-width="2"/>
      <line x1="16" y1="5" x2="24" y2="16" stroke="${palette.ring}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="24" cy="18" r="2" fill="${palette.ring}"/>
    </g>

    <!-- Initials -->
    <text x="80" y="104" font-family="'Outfit', system-ui, -apple-system, sans-serif" font-weight="800" font-size="38" fill="${palette.text}" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>

    <!-- Sublabel (Alumno or Grado) -->
    <rect x="40" y="122" width="80" height="18" rx="9" fill="#000000" fill-opacity="0.3"/>
    <text x="80" y="134" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="9" fill="${palette.ring}" text-anchor="middle" letter-spacing="1">
      ${sublabel.toUpperCase()}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG avatar for a user/staff member based on role or name.
 */
export function getUserAvatarFallback(name: string = 'Usuario', role?: string): string {
  const hash = hashString(name + (role || ''));
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const initials = getInitials(name);
  const roleLabel = role ? role.slice(0, 12).toUpperCase() : 'USUARIO';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="userGrad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="80" fill="url(#userGrad-${hash})"/>
    <circle cx="80" cy="80" r="72" fill="none" stroke="${palette.ring}" stroke-width="2" opacity="0.3"/>
    
    <!-- Initials -->
    <text x="80" y="94" font-family="'Outfit', system-ui, -apple-system, sans-serif" font-weight="800" font-size="44" fill="${palette.text}" text-anchor="middle">
      ${initials}
    </text>

    <!-- Role pill -->
    <rect x="30" y="118" width="100" height="20" rx="10" fill="#000000" fill-opacity="0.35"/>
    <text x="80" y="132" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="9" fill="${palette.ring}" text-anchor="middle" letter-spacing="1.2">
      ${roleLabel}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates a stylized, appetizing vector card illustration for cafeteria products.
 * Tailored specifically for Mexican school cafeterias (Sandwich, Molletes, Chilaquiles, Torta, Ensalada, Jugos, etc.).
 */
export function getCafeteriaProductFallback(productName: string = 'Alimento', category: string = 'Cafetería'): string {
  const cat = category.toLowerCase();
  const name = productName.toLowerCase();

  let bg1 = '#451A03';
  let bg2 = '#B45309';
  let accent = '#FDE68A';
  let iconSvg = '';

  if (cat.includes('desayun') || name.includes('sandwich') || name.includes('mollete') || name.includes('chilaquil')) {
    // Warm breakfast amber/gold
    bg1 = '#78350F';
    bg2 = '#D97706';
    accent = '#FEF3C7';
    iconSvg = `
      <!-- Bread / Sandwich illustration -->
      <path d="M50 90 L150 90 C155 90 160 95 155 105 L145 125 C140 135 130 140 120 140 L80 140 C70 140 60 135 55 125 L45 105 C40 95 45 90 50 90 Z" fill="#F59E0B" stroke="#92400E" stroke-width="4"/>
      <!-- Filling: Green lettuce & red tomato -->
      <path d="M48 108 Q60 115 75 108 Q90 102 105 108 Q120 115 135 108 Q145 104 152 108" stroke="#10B981" stroke-width="6" stroke-linecap="round" fill="none"/>
      <rect x="70" y="113" width="60" height="6" rx="3" fill="#EF4444"/>
      <!-- Top bread slice -->
      <path d="M52 95 Q100 65 148 95 L144 104 Q100 78 56 104 Z" fill="#FBBF24" stroke="#92400E" stroke-width="3"/>
      <!-- Sesame seeds -->
      <circle cx="85" cy="85" r="2" fill="#FFFFFF"/>
      <circle cx="105" cy="82" r="2" fill="#FFFFFF"/>
      <circle cx="120" cy="88" r="2" fill="#FFFFFF"/>
    `;
  } else if (cat.includes('salud') || name.includes('ensalada') || name.includes('wrap') || name.includes('cesar')) {
    // Fresh green salad/wrap
    bg1 = '#064E3B';
    bg2 = '#059669';
    accent = '#A7F3D0';
    iconSvg = `
      <!-- Salad bowl -->
      <path d="M45 105 C45 145 155 145 155 105 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="4"/>
      <ellipse cx="100" cy="105" rx="55" ry="12" fill="#CBD5E1"/>
      <!-- Leaves / avocado / tomato in bowl -->
      <path d="M60 100 Q75 70 95 95 Q115 70 135 100" fill="#10B981"/>
      <circle cx="80" cy="95" r="9" fill="#34D399"/>
      <circle cx="115" cy="92" r="9" fill="#34D399"/>
      <circle cx="100" cy="86" r="6" fill="#EF4444"/>
      <circle cx="126" cy="100" r="5" fill="#EF4444"/>
      <!-- Fork in bowl -->
      <path d="M125 65 L135 95" stroke="#64748B" stroke-width="4" stroke-linecap="round"/>
    `;
  } else if (cat.includes('bebid') || name.includes('jugo') || name.includes('licuado') || name.includes('agua')) {
    // Cool refreshing cyan/blue
    bg1 = '#0C4A6E';
    bg2 = '#0284C7';
    accent = '#BAE6FD';
    iconSvg = `
      <!-- Beverage cup -->
      <path d="M70 75 L78 140 C79 146 84 150 90 150 L110 150 C116 150 121 146 122 140 L130 75 Z" fill="#FFFFFF" fill-opacity="0.9" stroke="#38BDF8" stroke-width="4"/>
      <!-- Liquid inside -->
      <path d="M74 95 L80 138 C80 142 84 145 88 145 L112 145 C116 145 120 142 120 138 L126 95 Z" fill="#F59E0B" fill-opacity="0.85"/>
      <!-- Straw -->
      <path d="M102 50 L102 85 L95 130" stroke="#EF4444" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Fruit slice or bubbles -->
      <circle cx="100" cy="115" r="4" fill="#FFFFFF" fill-opacity="0.6"/>
      <circle cx="108" cy="128" r="3" fill="#FFFFFF" fill-opacity="0.6"/>
      <circle cx="92" cy="124" r="2.5" fill="#FFFFFF" fill-opacity="0.6"/>
    `;
  } else if (cat.includes('postre') || cat.includes('snack') || name.includes('galleta') || name.includes('fruta')) {
    // Sweet chocolate/cookie warm purple/pink
    bg1 = '#581C87';
    bg2 = '#9333EA';
    accent = '#F5D0FE';
    iconSvg = `
      <!-- Cookie -->
      <circle cx="100" cy="108" r="40" fill="#D97706" stroke="#92400E" stroke-width="4"/>
      <circle cx="85" cy="98" r="4.5" fill="#451A03"/>
      <circle cx="112" cy="95" r="5" fill="#451A03"/>
      <circle cx="100" cy="115" r="4" fill="#451A03"/>
      <circle cx="118" cy="118" r="4" fill="#451A03"/>
      <circle cx="86" cy="122" r="4" fill="#451A03"/>
    `;
  } else {
    // General Comida / Savory dish
    bg1 = '#1E293B';
    bg2 = '#475569';
    accent = '#F1F5F9';
    iconSvg = `
      <!-- Cloche / Plate -->
      <ellipse cx="100" cy="130" rx="55" ry="14" fill="#E2E8F0" stroke="#94A3B8" stroke-width="4"/>
      <path d="M60 126 C60 85 140 85 140 126 Z" fill="#CBD5E1" stroke="#94A3B8" stroke-width="4"/>
      <circle cx="100" cy="80" r="7" fill="#94A3B8"/>
      <!-- Steam lines -->
      <path d="M85 65 Q80 55 85 45" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M100 62 Q95 50 100 40" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
      <path d="M115 65 Q120 55 115 45" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
    `;
  }

  const cleanName = productName.length > 22 ? productName.slice(0, 20) + '...' : productName;
  const cleanCat = category.toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <defs>
      <linearGradient id="foodGrad-${hashString(productName)}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <!-- Background Card -->
    <rect width="200" height="200" fill="url(#foodGrad-${hashString(productName)})"/>
    
    <!-- Subtle circular glow -->
    <circle cx="100" cy="100" r="75" fill="#FFFFFF" fill-opacity="0.08"/>

    <!-- Category Pill -->
    <rect x="20" y="16" width="${Math.max(65, cleanCat.length * 8 + 16)}" height="22" rx="11" fill="#000000" fill-opacity="0.4"/>
    <text x="${20 + Math.max(65, cleanCat.length * 8 + 16) / 2}" y="31" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="10" fill="${accent}" text-anchor="middle" letter-spacing="1">
      ${cleanCat}
    </text>

    <!-- Food Illustration -->
    ${iconSvg}

    <!-- Product Name at bottom -->
    <rect x="0" y="165" width="200" height="35" fill="#000000" fill-opacity="0.5"/>
    <text x="100" y="187" font-family="'Outfit', system-ui, -apple-system, sans-serif" font-weight="700" font-size="12" fill="#FFFFFF" text-anchor="middle">
      ${cleanName}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Fallback for library book covers.
 */
export function getBookCoverFallback(title: string = 'Libro', author?: string): string {
  const hash = hashString(title);
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const cleanTitle = title.length > 25 ? title.slice(0, 23) + '...' : title;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 220" width="160" height="220">
    <defs>
      <linearGradient id="bookGrad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
    </defs>
    <!-- Book Body -->
    <rect width="160" height="220" rx="8" fill="url(#bookGrad-${hash})"/>
    <!-- Book Spine line -->
    <rect x="18" y="0" width="3" height="220" fill="${palette.ring}" opacity="0.4"/>
    <rect x="0" y="0" width="18" height="220" fill="#000000" opacity="0.2"/>
    <!-- Gold emblem border -->
    <rect x="30" y="30" width="112" height="160" rx="4" fill="none" stroke="${palette.ring}" stroke-width="2" opacity="0.6"/>
    <!-- Book icon -->
    <g transform="translate(86, 75) scale(0.8)">
      <path d="M-20,-10 C-10,-15 0,-15 10,-10 L10,20 C0,15 -10,15 -20,20 Z" fill="${palette.ring}" opacity="0.8"/>
      <path d="M10,-10 C20,-15 30,-15 40,-10 L40,20 C30,15 20,15 10,20 Z" fill="${palette.ring}" opacity="0.8"/>
    </g>
    <!-- Title -->
    <text x="86" y="125" font-family="'Outfit', system-ui, sans-serif" font-weight="800" font-size="13" fill="${palette.text}" text-anchor="middle">
      ${cleanTitle}
    </text>
    ${author ? `<text x="86" y="145" font-family="system-ui, sans-serif" font-weight="600" font-size="10" fill="${palette.ring}" text-anchor="middle">${author.slice(0, 20)}</text>` : ''}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns college shield fallback.
 */
export function getCollegeShieldFallback(): string {
  return createDunorShieldSvg();
}

/**
 * Universal fallback dispatcher by type.
 */
export function getFallbackForType(
  type: ImageFallbackType = 'student',
  name: string = '',
  extra: string = ''
): string {
  switch (type) {
    case 'student':
      return getStudentAvatarFallback(name, extra);
    case 'user':
      return getUserAvatarFallback(name, extra);
    case 'product':
      return getCafeteriaProductFallback(name, extra);
    case 'book':
      return getBookCoverFallback(name, extra);
    case 'shield':
      return getCollegeShieldFallback();
    case 'generic':
    default:
      return getStudentAvatarFallback(name || 'My College');
  }
}

/**
 * Handles image onError event seamlessly: prevents recursive loops,
 * sets fallback SVG data URI and hides broken-image icons completely.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackType: ImageFallbackType = 'student',
  name: string = '',
  extra: string = ''
): void {
  const img = event.currentTarget;
  const fallbackUrl = getFallbackForType(fallbackType, name, extra);
  if (img.src !== fallbackUrl) {
    img.onerror = null; // Prevent infinite error loops
    img.src = fallbackUrl;
  }
}
