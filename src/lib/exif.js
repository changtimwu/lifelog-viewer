// Minimal in-browser EXIF reader — just the fields the viewer needs:
// capture time (DateTimeOriginal) and GPS position. Dependency-free; parses the
// JPEG APP1/TIFF structure directly. Feed it an ArrayBuffer of (at least) the
// start of a JPEG; EXIF lives near the front, so the first ~256 KB is plenty.
//
// Returns { dateTime, lat, lng, orientation } with any field omitted when
// absent. `dateTime` is normalised to a naive ISO string (no `Z`) to match how
// the rest of the app reads timestamps (see lib/time.js).

const DATETIME_ORIGINAL = 0x9003;
const DATETIME_DIGITIZED = 0x9004;
const EXIF_IFD_POINTER = 0x8769;
const GPS_IFD_POINTER = 0x8825;
const ORIENTATION = 0x0112;
const GPS_LAT_REF = 0x0001;
const GPS_LAT = 0x0002;
const GPS_LNG_REF = 0x0003;
const GPS_LNG = 0x0004;

// "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
function normalizeExifDate(s) {
  const m = String(s)
    .trim()
    .match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

// [deg, min, sec] + ref ("N"/"S"/"E"/"W") -> signed decimal degrees.
function toDecimal(rationals, ref) {
  if (!rationals || rationals.length < 3) return null;
  const [d, m, s] = rationals;
  const v = d + m / 60 + s / 3600;
  return ref === "S" || ref === "W" ? -v : v;
}

// Read one IFD into { tag: { type, count, value|ascii|rationals } }.
function readIFD(view, tiffStart, ifdOffset, little) {
  const u16 = (o) => view.getUint16(o, little);
  const u32 = (o) => view.getUint32(o, little);
  const out = {};
  if (ifdOffset + 2 > view.byteLength) return out;
  const n = u16(ifdOffset);
  for (let i = 0, p = ifdOffset + 2; i < n; i++, p += 12) {
    if (p + 12 > view.byteLength) break;
    const tag = u16(p);
    const type = u16(p + 2);
    const count = u32(p + 4);
    const valOff = p + 8;
    const entry = { type, count };
    if (type === 3) entry.value = u16(valOff); // SHORT
    else if (type === 4) entry.value = u32(valOff); // LONG
    else if (type === 2) {
      // ASCII (inline when it fits in the 4-byte value slot)
      const strOff = count <= 4 ? valOff : tiffStart + u32(valOff);
      let s = "";
      for (let k = 0; k < count && strOff + k < view.byteLength; k++) {
        const c = view.getUint8(strOff + k);
        if (c === 0) break;
        s += String.fromCharCode(c);
      }
      entry.ascii = s;
    } else if (type === 5) {
      // RATIONAL (num/den pairs, stored at an offset)
      const arrOff = tiffStart + u32(valOff);
      const r = [];
      for (let k = 0; k < count && arrOff + k * 8 + 8 <= view.byteLength; k++) {
        const num = u32(arrOff + k * 8);
        const den = u32(arrOff + k * 8 + 4);
        r.push(den ? num / den : 0);
      }
      entry.rationals = r;
    }
    out[tag] = entry;
  }
  return out;
}

// Parse the TIFF block that starts at `start` (right after "Exif\0\0").
function parseTiff(view, start) {
  const order = view.getUint16(start);
  const little = order === 0x4949; // 'II'; 'MM' (0x4D4D) is big-endian
  if (!little && order !== 0x4d4d) return {};
  if (view.getUint16(start + 2, little) !== 0x002a) return {};
  const ifd0 = start + view.getUint32(start + 4, little);
  const t0 = readIFD(view, start, ifd0, little);

  const out = {};
  if (t0[ORIENTATION]) out.orientation = t0[ORIENTATION].value;

  const exifPtr = t0[EXIF_IFD_POINTER]?.value;
  if (exifPtr) {
    const te = readIFD(view, start, start + exifPtr, little);
    const dt = te[DATETIME_ORIGINAL]?.ascii || te[DATETIME_DIGITIZED]?.ascii;
    const norm = dt && normalizeExifDate(dt);
    if (norm) out.dateTime = norm;
  }

  const gpsPtr = t0[GPS_IFD_POINTER]?.value;
  if (gpsPtr) {
    const tg = readIFD(view, start, start + gpsPtr, little);
    const lat = toDecimal(tg[GPS_LAT]?.rationals, tg[GPS_LAT_REF]?.ascii);
    const lng = toDecimal(tg[GPS_LNG]?.rationals, tg[GPS_LNG_REF]?.ascii);
    if (Number.isFinite(lat)) out.lat = lat;
    if (Number.isFinite(lng)) out.lng = lng;
  }
  return out;
}

// ArrayBuffer of a JPEG -> { dateTime?, lat?, lng?, orientation? }.
export function readPhotoMeta(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {}; // not JPEG
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00) break; // lost sync
    if (marker === 0xffda) break; // start of scan — no more metadata
    const size = view.getUint16(offset + 2);
    if (
      marker === 0xffe1 && // APP1
      view.getUint32(offset + 4) === 0x45786966 && // "Exif"
      view.getUint16(offset + 8) === 0x0000
    ) {
      return parseTiff(view, offset + 10);
    }
    offset += 2 + size;
  }
  return {};
}
