const SUPPORT_CHAR = '◌'; // ◌

export function normalize(str, method = null) {
  if (method) return str.normalize(method);
  return str;
}

export function getHex(char) {
  return char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Mirrors Python's Replacement.normalized():
 * 1. NFD-decompose
 * 2. strip ◌ (U+25CC) support characters
 * 3. re-normalize to target method
 */
export function normalizedChar(str, normalization = null) {
  const stripped = str.normalize('NFD').replaceAll(SUPPORT_CHAR, '');
  return normalization ? stripped.normalize(normalization) : stripped;
}
