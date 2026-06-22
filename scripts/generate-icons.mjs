/**
 * Generates minimal valid PNG icon files for PWA manifest.
 * Uses only Node.js built-ins (zlib, fs, path) — no external dependencies.
 * Produces solid-color icons: accent green (#22c55e) centered logo on dark bg (#0a0e1a).
 */

import { deflateRawSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function makePng(size, bgR, bgG, bgB, fgR, fgG, fgB) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build raw scanlines: filter byte (0) + RGB per pixel
  // Simple design: solid bg with a centered rounded-square accent block (60% of size)
  const margin = Math.floor(size * 0.2);
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const inBlock = x >= margin && x < size - margin && y >= margin && y < size - margin;
      const r = inBlock ? fgR : bgR;
      const g = inBlock ? fgG : bgG;
      const b = inBlock ? fgB : bgB;
      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const compressed = deflateRawSync(raw, { level: 6 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// bg: #0a0e1a → r=10, g=14, b=26
// fg: #22c55e → r=34, g=197, b=94
const bg = [10, 14, 26];
const fg = [34, 197, 94];

for (const size of [192, 512]) {
  const png = makePng(size, ...bg, ...fg);
  const out = join(outDir, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`Created ${out} (${png.length} bytes)`);
}
