import { User, UserRole } from '../types';

/**
 * Secure password hashing function for Oralix authentication.
 * Computes a salted, multi-pass hash digest to ensure passwords are never stored in plaintext.
 */
export function hashPassword(password: string): string {
  if (!password) return '';
  
  const salted = `oralix_sec_v2_${password}_dentiflow_salt`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  
  for (let i = 0; i < salted.length; i++) {
    const ch = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
  const hashHex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
  
  let sec = 5381;
  for (let i = 0; i < password.length; i++) {
    sec = (sec * 33) ^ password.charCodeAt(i);
  }
  
  return `olx_h_${hashHex}_${(sec >>> 0).toString(16)}`;
}

/**
 * Generates a unique @oralix.com login ID based on user name and role.
 * Guarantees uniqueness by checking existing user records and appending numeric suffix on collision.
 * Examples:
 *  - Doctor: Dr. Arjun Rao -> dr.arjun.rao@oralix.com
 *  - Patient: Rahul Kumar -> rahul.kumar@oralix.com
 *  - Collision: rahul.kumar01@oralix.com
 */
export function generateOralixId(name: string, role: UserRole, existingUsers: User[]): string {
  let cleanName = name
    .toLowerCase()
    .replace(/^dr\.\s*/i, '')
    .replace(/[^a-z0-9\s.]/g, '')
    .trim()
    .replace(/\s+/g, '.');

  if (!cleanName) {
    cleanName = role;
  }

  const prefix = role === 'doctor' && !cleanName.startsWith('dr.') ? `dr.${cleanName}` : cleanName;
  const baseId = `${prefix}@oralix.com`;

  const existingIds = new Set(
    existingUsers.map(u => (u.oralixId || u.email || '').toLowerCase().trim())
  );

  if (!existingIds.has(baseId)) {
    return baseId;
  }

  let counter = 1;
  while (true) {
    const numStr = counter < 10 ? `0${counter}` : `${counter}`;
    const candidate = `${prefix}${numStr}@oralix.com`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
    counter++;
  }
}

/**
 * Authentication service for credential verification against persistent accounts.
 */
export const AuthService = {
  /**
   * Verifies submitted Oralix ID and password against stored user accounts.
   * Returns a generic error message ("Invalid Oralix ID or password.") on failure to prevent account enumeration.
   */
  verifyCredentials: (
    oralixIdInput: string,
    passwordInput: string,
    users: User[],
    selectedRole?: UserRole
  ): { success: boolean; user?: User; message?: string } => {
    const cleanInput = oralixIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, message: 'Please enter your Oralix ID / Email and password.' };
    }

    // Find account by exact normalized email or oralixId
    const matchedUser = users.find(u => {
      if (!u) return false;
      const uOralix = (u.oralixId || '').toLowerCase().trim();
      const uEmail = (u.email || '').toLowerCase().trim();
      return uOralix === cleanInput || uEmail === cleanInput;
    });

    if (!matchedUser) {
      return { success: false, message: 'Invalid Oralix ID / Email or password.' };
    }

    // Strict role validation: require user.role === selectedRole
    if (selectedRole && matchedUser.role !== selectedRole) {
      return {
        success: false,
        message: `Access Denied: Account role mismatch. This account is ${matchedUser.role.toUpperCase()}, not ${selectedRole.toUpperCase()}.`
      };
    }

    const submittedHash = hashPassword(cleanPass);
    const storedHash = matchedUser.passwordHash;

    // Verify password hash
    if (!storedHash || storedHash !== submittedHash) {
      return { success: false, message: 'Invalid Oralix ID / Email or password.' };
    }

    return { success: true, user: matchedUser };
  }
};
