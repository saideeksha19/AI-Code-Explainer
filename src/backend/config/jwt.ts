import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// In production, MONGODB_URI and JWT_SECRET are configured by the platform.
// For dynamic/unconfigured environments, we avoid hardcoding a fallback signature key.
// Instead, we dynamically generate a high-entropy, 512-bit secure random secret on startup and cache it locally.
// This guarantees that JWT tokens cannot be forged or cracked using standard dictionary words and stay stable across restarts.
export const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const secretPath = path.join(process.cwd(), '.jwt_secret.key');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing && existing.length >= 32) {
        return existing;
      }
    }
  } catch (err) {
    // Silently fall back to generating a new key if reading fails
  }

  const newSecret = crypto.randomBytes(64).toString('hex');
  try {
    fs.writeFileSync(secretPath, newSecret, { mode: 0o600 });
  } catch (err) {
    // Silently fall back if writing fails (e.g., read-only filesystem)
  }
  return newSecret;
})();

