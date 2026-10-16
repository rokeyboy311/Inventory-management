import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const toCrc = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(toCrc), 8 + len);
  return chunk;
}

function generatePng(width, height, isMaskable = false) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte per scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;
  const innerR = maxR * (isMaskable ? 0.75 : 0.88);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep rich navy gradient background (#1e3a8a to #0f172a)
      const gradRatio = (y / height);
      let r = Math.round(30 * (1 - gradRatio) + 15 * gradRatio);
      let g = Math.round(58 * (1 - gradRatio) + 23 * gradRatio);
      let b = Math.round(138 * (1 - gradRatio) + 42 * gradRatio);
      let a = 255;

      // Outer border / decorative ring
      if (dist >= innerR - 6 && dist <= innerR) {
        // Gold / Amber accent ring (#f59e0b)
        r = 245; g = 158; b = 11;
      } else if (dist < innerR - 6) {
        // Inner badge area
        // Check if inside transformer / zap lightning or "Dk" emblem
        const nx = (x - cx) / innerR; // -1 to 1
        const ny = (y - cy) / innerR; // -1 to 1

        // Electric lightning bolt shape
        // (y from -0.5 to 0.5)
        const isZap = (
          (ny >= -0.5 && ny <= 0.0 && nx >= ny * 0.4 - 0.15 && nx <= ny * 0.4 + 0.15) ||
          (ny >= -0.05 && ny <= 0.05 && nx >= -0.4 && nx <= 0.3) ||
          (ny >= 0.0 && ny <= 0.5 && nx >= (ny - 0.2) * 0.4 - 0.12 && nx <= (ny - 0.2) * 0.4 + 0.12)
        );

        // "Dk" emblem in lower-right or center-bottom
        const isDkZone = (ny >= 0.25 && ny <= 0.55 && nx >= -0.45 && nx <= 0.45);

        if (isZap) {
          // Brilliant lightning gold / electric yellow
          r = 253; g = 224; b = 71;
        } else if (isDkZone) {
          // Elegant cyan / electric blue glow
          r = 56; g = 189; b = 248;
        } else {
          // Background of inner circle: royal blue gradient
          r = Math.round(29 + 15 * (1 - dist / innerR));
          g = Math.round(78 + 30 * (1 - dist / innerR));
          b = Math.round(216 + 20 * (1 - dist / innerR));
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate standard icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePng(64, 64, false));

console.log('Successfully generated PWA icon assets in public/ directory!');
