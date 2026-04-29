import crypto from 'node:crypto';

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set');
  return Buffer.from(secret).subarray(0, 32).equals(Buffer.alloc(32))
    ? crypto.scryptSync(secret, 'garmin-salt', 32)
    : Buffer.from(secret.padEnd(32, '0').slice(0, 32), 'utf8');
}

export function encryptPassword(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPassword(stored: string): string {
  const [ivHex, authTagHex, cipherHex] = stored.split(':');
  if (!ivHex || !authTagHex || !cipherHex) throw new Error('Invalid encrypted format');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(Buffer.from(cipherHex, 'hex')).toString('utf8') + decipher.final('utf8');
}
