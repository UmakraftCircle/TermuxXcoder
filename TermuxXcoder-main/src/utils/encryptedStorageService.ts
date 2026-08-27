const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (buf: ArrayBuffer | Uint8Array): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const fromB64 = (str: string): Uint8Array => {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export interface VaultEntry {
  ciphertext: string;
  iv: string;
  salt: string;
  createdAt: number;
}

export async function encryptContent(
  passphrase: string,
  plaintext: string,
): Promise<VaultEntry> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return {
    ciphertext: toB64(ct),
    iv: toB64(iv),
    salt: toB64(salt),
    createdAt: Date.now(),
  };
}

export async function decryptContent(
  passphrase: string,
  entry: VaultEntry,
): Promise<string> {
  const salt = fromB64(entry.salt);
  const iv = fromB64(entry.iv);
  const key = await deriveKey(passphrase, salt);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    fromB64(entry.ciphertext),
  );
  return dec.decode(pt);
}

export async function computeSha256(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return toB64(digest);
}

export async function verifyChecksum(data: string, expected: string): Promise<boolean> {
  const actual = await computeSha256(data);
  return actual === expected;
}
