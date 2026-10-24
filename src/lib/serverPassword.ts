import crypto from 'node:crypto';

/**
 * Server-side Password Hashing (SHA-256 + Salt)
 */
export function hashPassword(plainPassword: string, customSalt?: string): string {
  if (!plainPassword) return '';
  if (plainPassword.startsWith('sha256$')) {
    return plainPassword; // already hashed
  }
  const salt = customSalt || crypto.randomBytes(12).toString('hex');
  const hash = crypto.createHash('sha256').update(`${salt}:${plainPassword}`).digest('hex');
  return `sha256$${salt}$${hash}`;
}

export function verifyPassword(plainPassword: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.startsWith('sha256$')) {
    return plainPassword === storedHash;
  }
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHash] = parts;
  const actualHash = crypto.createHash('sha256').update(`${salt}:${plainPassword}`).digest('hex');
  return actualHash === expectedHash;
}
