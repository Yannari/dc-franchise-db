// ══════════════════════════════════════════════════════════════════════
// ci/photo-store.js — the author's own catfish images, kept in this browser
// ══════════════════════════════════════════════════════════════════════
//
// The user makes the catfish images (2026-09-30). They live in IndexedDB
// (`dc_circle`, store `photos`), like the Casting Studio's characters, so the
// site on GitHub Pages works with nothing uploaded anywhere. A persona names
// its image as `photo:<id>`; the image is shrunk to 512px before it is kept.
// Where there is no IndexedDB (tests), a plain in-memory map stands in.

let _dbP = null;
let _mem = null;
const _cache = new Map();

/** Tests: use an in-memory store instead of IndexedDB. */
export function _memoryPhotos() { _mem = new Map(); _cache.clear(); }

function _db() {
  if (_mem || typeof indexedDB === 'undefined') { _mem ||= new Map(); return null; }
  if (_dbP) return _dbP;
  _dbP = new Promise((res, rej) => {
    const rq = indexedDB.open('dc_circle', 1);
    rq.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' }); };
    rq.onsuccess = e => res(e.target.result);
    rq.onerror = () => rej(rq.error);
  });
  return _dbP;
}

// The clock and a counter: unique in this browser, and no dice (tests/ci-guards).
let _n = 0;
const newId = () => `${Date.now().toString(36)}${(++_n).toString(36)}`;

/** Keep an image (a data URL); returns its id. */
export async function putPhoto(dataUrl) {
  const id = newId();
  const db = _db();
  if (!db) { _mem.set(id, dataUrl); _cache.set(id, dataUrl); return id; }
  const d = await db;
  await new Promise((res, rej) => { const tx = d.transaction('photos', 'readwrite'); tx.objectStore('photos').put({ id, dataUrl }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  _cache.set(id, dataUrl);
  return id;
}

/** Keep an image under a given id (a season pack brings its own ids). */
export async function putPhotoWithId(id, dataUrl) {
  const db = _db();
  if (!db) { _mem.set(id, dataUrl); _cache.set(id, dataUrl); return id; }
  const d = await db;
  await new Promise((res, rej) => { const tx = d.transaction('photos', 'readwrite'); tx.objectStore('photos').put({ id, dataUrl }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  _cache.set(id, dataUrl);
  return id;
}

/** The image a `photo:<id>` face names, or null. */
export async function photoURL(face) {
  const id = String(face || '').startsWith('photo:') ? face.slice(6) : null;
  if (!id) return null;
  if (_cache.has(id)) return _cache.get(id);
  const db = _db();
  if (!db) return _mem.get(id) || null;
  const d = await db;
  const url = await new Promise(res => { const r = d.transaction('photos', 'readonly').objectStore('photos').get(id); r.onsuccess = () => res(r.result?.dataUrl || null); r.onerror = () => res(null); });
  if (url) _cache.set(id, url);
  return url;
}

/** Already loaded, without waiting (for drawing). */
export const cachedPhoto = face => (String(face || '').startsWith('photo:') ? _cache.get(face.slice(6)) || null : null);

/** A picked file, shrunk to fit 512px (and cropped square from the middle
 *  when asked, as the spec wants for the Photos panel), as a data URL. */
export function shrinkImage(file, max = 512, square = false) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => res(fr.result);
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = square ? (img.width - side) / 2 : 0, sy = square ? (img.height - side) / 2 : 0;
        const sw = square ? side : img.width, sh = square ? side : img.height;
        const k = Math.min(1, max / Math.max(sw, sh));
        const c = document.createElement('canvas');
        c.width = Math.round(sw * k); c.height = Math.round(sh * k);
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.88));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
