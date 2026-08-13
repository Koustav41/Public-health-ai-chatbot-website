const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(width, height) {
  // Create an uncompressed PNG chunk sequence
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth 8
  ihdrData[9] = 6; // color type 6 (RGBA)
  ihdrData[10] = 0; // compression 0
  ihdrData[11] = 0; // filter 0
  ihdrData[12] = 0; // interlace 0
  
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  
  // Create raw pixel data (RGBA)
  // Background: dark #0b0f19 (11, 15, 25, 255)
  // Primary Teal: #10b981 (16, 185, 129, 255)
  // White: #ffffff (255, 255, 255, 255)
  
  const rowSize = width * 4 + 1; // +1 for filter byte
  const rawData = Buffer.alloc(height * rowSize);
  
  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * 0.42;
  const innerR = width * 0.38;
  const crossWidth = width * 0.08;
  const crossLength = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default dark rounded background
      let r = 11, g = 15, b = 25, a = 255;

      // Outer ring / circle badge background (#10b981 with gradient effect)
      if (dist <= outerR) {
        r = 16; g = 185; b = 129; a = 255;
      }
      if (dist <= innerR) {
        r = 11; g = 15; b = 25; a = 255;
      }

      // Medical cross in center (White / Teal)
      const inVertCross = Math.abs(dx) <= crossWidth && Math.abs(dy) <= crossLength;
      const inHorizCross = Math.abs(dy) <= crossWidth && Math.abs(dx) <= crossLength;

      if (inVertCross || inHorizCross) {
        r = 255; g = 255; b = 255; a = 255;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const bufToCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(bufToCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), makePNG(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), makePNG(512, 512));
console.log('Successfully generated icon-192.png and icon-512.png in icons/');
