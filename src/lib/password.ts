/**
 * Password Hashing & Verification Utilities
 * 密碼加密編碼與驗證模組
 * 採用 SHA-256 加鹽（Salt）雜湊架構，支援瀏覽器與 Node.js 全環境執行。
 */

/**
 * 將明文密碼進行加鹽 SHA-256 加密編碼
 * 輸出格式：sha256${salt}${hashHex}
 */
export async function hashPasswordWeb(plainPassword: string, customSalt?: string): Promise<string> {
  if (!plainPassword) return '';
  if (plainPassword.startsWith('sha256$')) {
    return plainPassword; // 已加密編碼，避免重複加密
  }

  const salt =
    customSalt ||
    (typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      : Math.random().toString(36).slice(2, 14));

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${plainPassword}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `sha256$${salt}$${hashHex}`;
}

/**
 * 驗證輸入的明文密碼是否與資料庫儲存的加密雜湊值相符
 * 同時相容早期純文字密碼（自動比對通過）
 */
export async function verifyPasswordWeb(plainPassword: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  // 若為舊格式純文字密碼，直接比對
  if (!storedHash.startsWith('sha256$')) {
    return plainPassword === storedHash;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHash] = parts;

  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${plainPassword}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const actualHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return actualHash === expectedHash;
}

/**
 * 產生 10 位高安全度英數隨機臨時密碼（排除易混淆字元如 0, O, 1, l, I）
 */
export function generateRandomTempPassword(length = 10): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let result = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return result;
}
