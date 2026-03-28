/**
 * Generates resources/icon.png and resources/icon.ico
 * Planner-themed icon: indigo background with a white calendar grid + checkmark.
 * Uses only Node.js built-ins (zlib, crypto, fs).
 *
 * Run: node scripts/gen-icon.mjs
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── CRC32 ───────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([len, typeBytes, data, crcBuf])
}

// ─── PNG Builder ─────────────────────────────────────────────────────────────
function buildPNG(w, h, pixels /* Uint8Array RGBA */) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  // compress=0, filter=0, interlace=0 already zero

  // Raw scanlines: filter byte (0=None) + row data
  const raw = Buffer.alloc((1 + w * 4) * h)
  for (let y = 0; y < h; y++) {
    raw[(1 + w * 4) * y] = 0 // filter None
    for (let x = 0; x < w; x++) {
      const si = (y * w + x) * 4
      const di = (1 + w * 4) * y + 1 + x * 4
      raw[di]     = pixels[si]
      raw[di + 1] = pixels[si + 1]
      raw[di + 2] = pixels[si + 2]
      raw[di + 3] = pixels[si + 3]
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

// ─── Icon Drawing ─────────────────────────────────────────────────────────────
function drawIcon(size) {
  const px = new Uint8Array(size * size * 4)

  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return
    const i = (y * size + x) * 4
    px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a
  }

  const fill = (x0, y0, x1, y1, r, g, b, a = 255) => {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) set(x, y, r, g, b, a)
  }

  // Helpers — all coords are 0..1 ratios of size
  const S = (v) => Math.round(v * size)

  // Background: transparent (will fill with rounded rect)
  // Full transparent first
  for (let i = 0; i < size * size * 4; i += 4) {
    px[i] = 0; px[i+1] = 0; px[i+2] = 0; px[i+3] = 0
  }

  // Draw rounded rectangle background (indigo #4f46e5)
  const R = Math.round(size * 0.18) // corner radius
  const [IR, IG, IB] = [79, 70, 229] // #4f46e5

  // Fill circle quadrants at corners, then rects
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = false
      // Check if inside rounded rect
      const inX = (x >= R && x < size - R)
      const inY = (y >= R && y < size - R)
      if (inX || inY) {
        inside = (x >= 0 && x < size && y >= 0 && y < size)
        // Exclude corners
        if (!inX && !inY) {
          // Corner area — check circle
          const cx = x < R ? R : size - 1 - R
          const cy = y < R ? R : size - 1 - R
          const dx = x - cx, dy = y - cy
          inside = dx * dx + dy * dy <= R * R
        } else {
          inside = true
        }
      } else {
        // Corner quadrant
        const cx = x < R ? R : size - 1 - R
        const cy = y < R ? R : size - 1 - R
        const dx = x - cx, dy = y - cy
        inside = dx * dx + dy * dy <= R * R
      }
      if (inside) set(x, y, IR, IG, IB, 255)
    }
  }

  // Header bar (top ~30% of rounded rect): slightly darker indigo
  const headerBottom = S(0.32)
  fill(R, R, size - R - 1, headerBottom, 47, 38, 204, 255)
  // Fix corners of header
  for (let x = 0; x < size; x++) {
    for (let y = R; y <= headerBottom; y++) {
      const i = (y * size + x) * 4
      if (px[i+3] === 255) set(x, y, 47, 38, 204, 255)
    }
  }

  // White horizontal divider line below header
  const divY = headerBottom + 1
  for (let x = S(0.1); x <= S(0.9); x++) set(x, divY, 255, 255, 255, 180)

  // Header: "📅" — draw small white calendar icon chars
  // Draw "M" shape for the month top of mini-calendar in header
  const hCY = Math.round((R + headerBottom) / 2)
  const hCX = Math.round(size / 2)
  // Small page fold dots
  const dotR = Math.max(1, Math.round(size * 0.025))
  // Two white binder rings at top
  const ringY = R + Math.round(size * 0.04)
  fill(hCX - S(0.15), ringY - dotR, hCX - S(0.15) + dotR, ringY + dotR, 255, 255, 255, 220)
  fill(hCX + S(0.05), ringY - dotR, hCX + S(0.05) + dotR, ringY + dotR, 255, 255, 255, 220)
  // Month label area: small white rect
  fill(S(0.2), S(0.12), S(0.8), S(0.28), 255, 255, 255, 40)

  // Draw grid of date cells (3 columns × 3 rows) in body area
  const bodyTop = divY + S(0.06)
  const bodyBottom = S(0.88)
  const bodyLeft = S(0.1)
  const bodyRight = S(0.9)
  const cols = 3, rows = 3
  const cellW = Math.floor((bodyRight - bodyLeft) / (cols + 0.5))
  const cellH = Math.floor((bodyBottom - bodyTop) / (rows + 0.5))
  const gap = Math.max(1, Math.round(size * 0.025))

  let cellIdx = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx0 = bodyLeft + col * (cellW + gap)
      const cy0 = bodyTop + row * (cellH + gap)
      const cx1 = cx0 + cellW - 1
      const cy1 = cy0 + cellH - 1

      // Highlight the middle cell (today indicator)
      if (row === 1 && col === 1) {
        fill(cx0, cy0, cx1, cy1, 255, 255, 255, 255)
        // Draw a small indigo dot inside the white cell
        const mx = Math.round((cx0 + cx1) / 2), my = Math.round((cy0 + cy1) / 2)
        const dr = Math.max(1, Math.round(cellW * 0.25))
        for (let dy = -dr; dy <= dr; dy++)
          for (let dx = -dr; dx <= dr; dx++)
            if (dx*dx+dy*dy <= dr*dr) set(mx+dx, my+dy, IR, IG, IB, 255)
      } else if (cellIdx % 3 === 2) {
        // Some cells are "filled" (events)
        fill(cx0, cy0, cx1, cy1, 255, 255, 255, 180)
      } else {
        // Most cells are outlined
        fill(cx0, cy0, cx1, cy1, 255, 255, 255, 80)
      }
      cellIdx++
    }
  }

  // Draw a checkmark in bottom-right (completed task hint)
  const chkX = Math.round(size * 0.72)
  const chkY = Math.round(size * 0.72)
  const chkS = Math.max(2, Math.round(size * 0.14))
  // Small white circle background
  for (let dy = -chkS; dy <= chkS; dy++)
    for (let dx = -chkS; dx <= chkS; dx++)
      if (dx*dx+dy*dy <= chkS*chkS) set(chkX+dx, chkY+dy, 255, 255, 255, 255)
  // Green checkmark inside
  const [GR, GG, GB] = [34, 197, 94]
  const cT = Math.max(1, Math.round(chkS * 0.2))
  for (let t = 0; t <= chkS * 0.45; t++) {
    const tt = Math.round(t)
    set(chkX - chkS/2 + tt, chkY + tt, GR, GG, GB, 255)
    set(chkX - chkS/2 + tt, chkY + tt + 1, GR, GG, GB, 255)
  }
  for (let t = 0; t <= chkS * 0.75; t++) {
    const tt = Math.round(t)
    set(chkX, chkY + chkS/2 - tt, GR, GG, GB, 255)
    set(chkX + 1, chkY + chkS/2 - tt, GR, GG, GB, 255)
  }

  return px
}

// ─── ICO Builder (single image, PNG format inside ICO) ───────────────────────
function buildICO(pngBufs) {
  // pngBufs: array of {size, buf}
  const count = pngBufs.length
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffset = headerSize + dirEntrySize * count

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)     // reserved
  header.writeUInt16LE(1, 2)     // type: ICO
  header.writeUInt16LE(count, 4) // count

  let offset = dataOffset
  const entries = []
  for (const { size, buf } of pngBufs) {
    const entry = Buffer.alloc(dirEntrySize)
    entry[0] = size >= 256 ? 0 : size  // width (0 = 256)
    entry[1] = size >= 256 ? 0 : size  // height
    entry[2] = 0   // color count
    entry[3] = 0   // reserved
    entry.writeUInt16LE(1, 4)    // planes
    entry.writeUInt16LE(32, 6)   // bit count
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    offset += buf.length
  }

  return Buffer.concat([header, ...entries, ...pngBufs.map(p => p.buf)])
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const resourcesDir = join(ROOT, 'resources')
mkdirSync(resourcesDir, { recursive: true })

const SIZES = [256, 64, 48, 32, 16]
const pngBufs = SIZES.map(size => {
  const pixels = drawIcon(size)
  const buf = buildPNG(size, size, pixels)
  return { size, buf }
})

// Write primary 256px PNG
writeFileSync(join(resourcesDir, 'icon.png'), pngBufs[0].buf)
console.log('✓ Wrote resources/icon.png (256×256)')

// Write ICO with all sizes
const icoBuf = buildICO(pngBufs)
writeFileSync(join(resourcesDir, 'icon.ico'), icoBuf)
console.log(`✓ Wrote resources/icon.ico (${SIZES.join(', ')}px)`)
