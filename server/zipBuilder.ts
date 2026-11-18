import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectFiles(rootDir: string, prefix = ''): Array<{ relPath: string; fullPath: string }> {
  if (!fs.existsSync(rootDir)) return [];
  const results: Array<{ relPath: string; fullPath: string }> = [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist-electron') continue;
    const fullPath = path.join(rootDir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      results.push({ relPath, fullPath });
    }
  }
  return results;
}

export function buildZipFromDirectories(
  sources: Array<{ dir: string; zipPrefix: string }>,
  extraFiles: Array<{ relPath: string; fullPath: string }> = []
): Buffer {
  const files: Array<{ zipPath: string; data: Buffer }> = [];

  for (const src of sources) {
    for (const f of collectFiles(src.dir)) {
      files.push({
        zipPath: `${src.zipPrefix}/${f.relPath}`.replace(/\\/g, '/'),
        data: fs.readFileSync(f.fullPath),
      });
    }
  }
  for (const extra of extraFiles) {
    if (fs.existsSync(extra.fullPath)) {
      files.push({
        zipPath: extra.relPath.replace(/\\/g, '/'),
        data: fs.readFileSync(extra.fullPath),
      });
    }
  }

  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.zipPath, 'utf8');
    const compressed = zlib.deflateRawSync(file.data);
    const crc = crc32(file.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(8, 8); // deflate
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0x5421, 12); // mod date
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}
