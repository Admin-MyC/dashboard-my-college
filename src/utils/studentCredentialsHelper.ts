import { Student } from '../types';

/**
 * Strips accents/diacritics and non-alphanumeric characters from a string.
 */
export function cleanAlphanumericLower(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

/**
 * Generates the official student username:
 * [primer letra de su primer nombre] + [primer apellido] + [4 dígitos aleatorios]
 * Example: "Santiago", "Hernández Ramírez" -> "shernandez4821"
 */
export function generateOfficialStudentUsername(
  nombre: string,
  apellidos: string,
  fixed4Digits?: string
): string {
  const trimmedNombre = (nombre || '').trim();
  const trimmedApellidos = (apellidos || '').trim();

  let firstWord = trimmedNombre.split(/\s+/)[0] || 'a';
  let firstSurname = trimmedApellidos.split(/\s+/)[0] || '';

  // If apellidos is empty and full name was stored inside nombre
  if (!firstSurname) {
    const parts = trimmedNombre.split(/\s+/);
    if (parts.length > 1) {
      firstWord = parts[0];
      firstSurname = parts[1];
    } else {
      firstSurname = parts[0] || 'alumno';
    }
  }

  const firstLetter = cleanAlphanumericLower(firstWord).charAt(0) || 'a';
  const cleanSurname = cleanAlphanumericLower(firstSurname) || 'alumno';
  const digits =
    fixed4Digits && /^\d{4}$/.test(fixed4Digits)
      ? fixed4Digits
      : String(Math.floor(1000 + Math.random() * 9000));

  return `${firstLetter}${cleanSurname}${digits}`;
}

/**
 * Generates an automatic random password of exactly 8 characters
 * combining letters, numbers, and common special characters.
 */
export function generateOfficialStudentPassword(length = 8): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const specials = '@#$%&*!?';
  const allChars = letters + numbers + specials;

  const finalLen = Math.max(8, length);
  const chars: string[] = [
    letters.charAt(Math.floor(Math.random() * letters.length)),
    letters.charAt(Math.floor(Math.random() * letters.length)),
    numbers.charAt(Math.floor(Math.random() * numbers.length)),
    numbers.charAt(Math.floor(Math.random() * numbers.length)),
    specials.charAt(Math.floor(Math.random() * specials.length)),
  ];

  while (chars.length < finalLen) {
    chars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

/**
 * Validates whether a username follows the official student format:
 * lowercase letters followed by 4 digits (and is NOT a matricula with hyphens).
 */
export function isValidStudentUsername(
  usuarioLogin?: string,
  matricula?: string
): boolean {
  if (!usuarioLogin || typeof usuarioLogin !== 'string') return false;
  const clean = usuarioLogin.trim();
  if (!clean) return false;
  if (clean.includes('-')) return false;
  if (matricula && clean.toLowerCase() === matricula.trim().toLowerCase()) {
    return false;
  }
  return /^[a-z]+[0-9]{4}$/i.test(clean);
}

/**
 * Validates whether a password is a generated alphanumeric password of >= 8 chars
 * and NOT a generic placeholder like 'admin123' or '123456'.
 */
export function isValidStudentPassword(password?: string): boolean {
  if (!password || typeof password !== 'string') return false;
  const clean = password.trim();
  if (clean.length < 8) return false;
  const forbidden = ['admin123', '123456', '12345678', 'password'];
  if (forbidden.includes(clean.toLowerCase())) return false;
  const hasLetter = /[a-zA-Z]/.test(clean);
  const hasNumber = /[0-9]/.test(clean);
  return hasLetter && hasNumber;
}

/**
 * Deterministic fallback map for known initial student IDs so they stay stable across reloads
 * if the database didn't have them stored yet.
 */
const KNOWN_INITIAL_CREDENTIALS: Record<
  string,
  { usuarioLogin: string; password: string }
> = {
  'std-1': { usuarioLogin: 'shernandez3492', password: 'k8Px2mQ9' },
  'std-2': { usuarioLogin: 'vgomez7821', password: 'm9Rt5vW2' },
  'std-3': { usuarioLogin: 'mrodriguez4519', password: 'p4Lw7xN3' },
  'std-4': { usuarioLogin: 'calvarez6284', password: 'z6Tq9bK5' },
  'std-5': { usuarioLogin: 'evega9137', password: 'r3Yh8dM4' },
};

/**
 * Ensures a student object always has valid automatic credentials:
 * usuario: primer letra de su primer nombre + apellido + 4 dígitos aleatorios
 * password: aleatoria mínimo 8 caracteres entre letras y números
 */
export function ensureStudentCredentials(
  student: Pick<
    Student,
    'id' | 'nombre' | 'apellidos' | 'matricula' | 'usuarioLogin' | 'password'
  >
): { usuarioLogin: string; password: string; wasUpdated: boolean } {
  const known = student.id ? KNOWN_INITIAL_CREDENTIALS[student.id] : undefined;

  let usuarioLogin = student.usuarioLogin?.trim() || '';
  let password = student.password?.trim() || '';
  let wasUpdated = false;

  if (!isValidStudentUsername(usuarioLogin, student.matricula)) {
    usuarioLogin = known
      ? known.usuarioLogin
      : generateOfficialStudentUsername(student.nombre, student.apellidos);
    wasUpdated = true;
  }

  if (!isValidStudentPassword(password)) {
    password = known ? known.password : generateOfficialStudentPassword(8);
    wasUpdated = true;
  }

  return { usuarioLogin, password, wasUpdated };
}
