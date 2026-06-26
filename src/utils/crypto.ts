export interface EncryptedFileResult {
  encryptedBlob: Blob;
  ivBase64: string;
  rawFileKey: Uint8Array;
}

export interface WrappedKeyResult {
  encryptedFileKey: string;
  keyId: string;
}

function toBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

export async function encryptFile(file: File): Promise<EncryptedFileResult> {
  const fileKey = crypto.getRandomValues(new Uint8Array(32));
  const iv      = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    'raw', fileKey, { name: 'AES-GCM' }, false, ['encrypt'],
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    await file.arrayBuffer(),
  );

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    ivBase64: toBase64(iv),
    rawFileKey: fileKey,
  };
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  rawFileKey: Uint8Array,
  ivBase64: string,
): Promise<ArrayBuffer> {
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'raw', rawFileKey, { name: 'AES-GCM' }, false, ['decrypt'],
  );
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
