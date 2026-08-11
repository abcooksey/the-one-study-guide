// Battle Code Generation and Validation
// 4-character alphanumeric codes avoiding confusing characters (0, O, 1, I, L)

// Characters that won't be confused when typed
const CODE_CHARACTERS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 4;

/**
 * Generate a random 4-character battle code
 * Uses characters that are unlikely to be confused (no 0/O, 1/I/L)
 */
export function generateBattleCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARACTERS.length);
    code += CODE_CHARACTERS[randomIndex];
  }
  return code;
}

/**
 * Validate a battle code format
 * Must be exactly 4 alphanumeric characters
 */
export function isValidBattleCode(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }

  // Check that all characters are valid
  const upperCode = code.toUpperCase();
  for (const char of upperCode) {
    if (!CODE_CHARACTERS.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalize a battle code (uppercase, trimmed)
 */
export function normalizeBattleCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Format a battle code for display (with spacing for readability)
 * e.g., "7A3K" -> "7A 3K" (optional, keeping simple for now)
 */
export function formatBattleCode(code: string): string {
  return code.toUpperCase();
}
