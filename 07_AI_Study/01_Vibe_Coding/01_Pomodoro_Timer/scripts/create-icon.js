// Create a 256x256 ICO icon for the Pomodoro Timer app
const fs = require('fs');
const path = require('path');

function createIco(outputPath) {
  const size = 256;
  const bpp = 32;
  const imageSize = size * size * 4;
  
  // For 256x256, ICO uses PNG format inside
  // Let's create a proper PNG-inside-ICO approach
  // Actually, for simplicity with ICO format, 256x256 images are stored as PNG
  // Let's create a minimal valid PNG
  
  const { createPNG } = (() => {
    // Minimal PNG creation
    function crc32(buf) {
      let crc = 0xFFFFFFFF;
      const table = new Int32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c;
      }
      for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
      }
      return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    
    function adler32(buf) {
      let a = 1, b = 0;
      for (let i = 0; i < buf.length; i++) {
        a = (a + buf[i]) % 65521;
        b = (b + a) % 65521;
      }
      return ((b << 16) | a) >>> 0;
    }
    
    function deflateRaw(data) {
      // Simple "stored" deflate (no compression, just wrapping)
      const chunks = [];
      const maxBlock = 65535;
      for (let offset = 0; offset < data.length; offset += maxBlock) {
        const end = Math.min(offset + maxBlock, data.length);
        const block = data.slice(offset, end);
        const isLast = end >= data.length;
        const header = Buffer.alloc(5);
        header[0] = isLast ? 0x01 : 0x00;
        header.writeUInt16LE(block.length, 1);
        header.writeUInt16LE(~block.length & 0xFFFF, 3);
        chunks.push(header, block);
      }
      return Buffer.concat(chunks);
    }
    
    function createPNG(width, height, pixelData) {
      // PNG signature
      const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      
      // IHDR
      const ihdrData = Buffer.alloc(13);
      ihdrData.writeUInt32BE(width, 0);
      ihdrData.writeUInt32BE(height, 4);
      ihdrData[8] = 8;  // bit depth
      ihdrData[9] = 6;  // color type (RGBA)
      ihdrData[10] = 0; // compression
      ihdrData[11] = 0; // filter
      ihdrData[12] = 0; // interlace
      const ihdr = makeChunk('IHDR', ihdrData);
      
      // IDAT - raw pixel data with filter bytes
      const rawData = Buffer.alloc(height * (1 + width * 4));
      for (let y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0; // filter: none
        for (let x = 0; x < width; x++) {
          const srcIdx = (y * width + x) * 4;
          const dstIdx = y * (1 + width * 4) + 1 + x * 4;
          rawData[dstIdx] = pixelData[srcIdx];     // R
          rawData[dstIdx + 1] = pixelData[srcIdx + 1]; // G
          rawData[dstIdx + 2] = pixelData[srcIdx + 2]; // B
          rawData[dstIdx + 3] = pixelData[srcIdx + 3]; // A
        }
      }
      
      // zlib wrapper around deflate
      const deflated = deflateRaw(rawData);
      const zlibHeader = Buffer.from([0x78, 0x01]); // CMF, FLG
      const adlerSum = adler32(rawData);
      const adlerBuf = Buffer.alloc(4);
      adlerBuf.writeUInt32BE(adlerSum, 0);
      const compressedData = Buffer.concat([zlibHeader, deflated, adlerBuf]);
      const idat = makeChunk('IDAT', compressedData);
      
      // IEND
      const iend = makeChunk('IEND', Buffer.alloc(0));
      
      return Buffer.concat([signature, ihdr, idat, iend]);
    }
    
    function makeChunk(type, data) {
      const length = Buffer.alloc(4);
      length.writeUInt32BE(data.length, 0);
      const typeBuffer = Buffer.from(type);
      const crcData = Buffer.concat([typeBuffer, data]);
      const crcValue = crc32(crcData);
      const crcBuffer = Buffer.alloc(4);
      crcBuffer.writeUInt32BE(crcValue, 0);
      return Buffer.concat([length, typeBuffer, data, crcBuffer]);
    }
    
    return { createPNG };
  })();
  
  // Generate pixel data - tomato/coral circle with gradient
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < r - 1) {
        // Main circle - coral/tomato gradient
        const t = dist / r;
        const angle = Math.atan2(dy, dx);
        const highlight = Math.max(0, -Math.sin(angle - 0.8) * 0.3 - t * 0.2 + 0.3);
        
        const baseR = 255;
        const baseG = 123;
        const baseB = 137;
        
        pixels[idx] = Math.min(255, Math.floor(baseR * (1 - t * 0.15) + highlight * 80));   // R
        pixels[idx + 1] = Math.min(255, Math.floor(baseG * (1 - t * 0.2) + highlight * 60)); // G
        pixels[idx + 2] = Math.min(255, Math.floor(baseB * (1 - t * 0.15) + highlight * 40)); // B
        pixels[idx + 3] = 255; // A
      } else if (dist < r) {
        // Anti-aliased edge
        const alpha = Math.floor((r - dist) * 255);
        pixels[idx] = 255;
        pixels[idx + 1] = 123;
        pixels[idx + 2] = 137;
        pixels[idx + 3] = Math.max(0, Math.min(255, alpha));
      } else {
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }
  
  const pngData = createPNG(size, size, pixels);
  
  // Create ICO with PNG data inside
  // ICO Header
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);     // Reserved
  icoHeader.writeUInt16LE(1, 2);     // Type: ICO
  icoHeader.writeUInt16LE(1, 4);     // Number of images
  
  // Directory entry for 256x256 (use 0 for 256)
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(0, 0);         // Width (0 = 256)
  dirEntry.writeUInt8(0, 1);         // Height (0 = 256)
  dirEntry.writeUInt8(0, 2);         // Color palette
  dirEntry.writeUInt8(0, 3);         // Reserved  
  dirEntry.writeUInt16LE(1, 4);      // Color planes
  dirEntry.writeUInt16LE(32, 6);     // BPP
  dirEntry.writeUInt32LE(pngData.length, 8);  // Size of PNG data
  dirEntry.writeUInt32LE(22, 12);    // Offset (6 + 16 = 22)
  
  const ico = Buffer.concat([icoHeader, dirEntry, pngData]);
  fs.writeFileSync(outputPath, ico);
  console.log(`Icon created: ${outputPath} (${ico.length} bytes, ${size}x${size})`);
}

const outputPath = path.join(__dirname, '..', 'build', 'icon.ico');
const buildDir = path.dirname(outputPath);
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

createIco(outputPath);
