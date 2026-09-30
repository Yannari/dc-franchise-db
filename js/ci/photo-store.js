// ══════════════════════════════════════════════════════════════════════
// ci/photo-store.js — the author's own catfish images: this browser + the cloud
// ══════════════════════════════════════════════════════════════════════
//
// The user makes the catfish images (2026-09-30). Each one lives in two places:
//
//   THIS BROWSER — IndexedDB (`dc_circle`, store `photos`), so a photo shows at
//   once and works offline. Where there is no IndexedDB (tests), a plain
//   in-memory map stands in.
//
//   THE CLOUD — the character gallery's R2 bucket, behind the Studio Worker,
//   in its own folder: `circle-photos/<id>.jpg` (user: "do it now like the
//   gallery in the profile player website"). Anyone reads it; writing needs
//   the studio token (`localStorage.studio_api_token`, the same one the
//   gallery and the Casting Studio use). With a token a new photo goes up at
//   once; without one it stays here until "back up" is pressed with one.
//
// A persona names its image `photo:<id>`. A browser that does not have it
// (another device, a visitor on the live site) reads it from the cloud.
import { GALLERY_API } from '../gallery-io.js';

let _dbP = null;
let _mem = null;
const _cache = new Map();
const FOLDER = 'circle-photos';

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
// Lowercase letters and digits only: the Worker's key rule for this folder.
let _n = 0;
const newId = () => `${Date.now().toString(36)}${(++_n).toString(36).padStart(2, '0')}`;

/** Where a photo lives in the cloud (public to read). */
export const cloudUrlOf = id => `${GALLERY_API}/gallery/${FOLDER}/${id}.jpg`;
const storedToken = () => { try { return localStorage.getItem('studio_api_token') || ''; } catch { return ''; } };

async function keepLocal(id, dataUrl) {
  const db = _db();
  if (!db) { _mem.set(id, dataUrl); _cache.set(id, dataUrl); return; }
  const d = await db;
  await new Promise((res, rej) => { const tx = d.transaction('photos', 'readwrite'); tx.objectStore('photos').put({ id, dataUrl }); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  _cache.set(id, dataUrl);
}
async function localOnly(id) {
  const c = _cache.get(id);
  if (c && c.startsWith('data:')) return c;
  const db = _db();
  if (!db) return _mem.get(id) || null;
  const d = await db;
  return new Promise(res => { const r = d.transaction('photos', 'readonly').objectStore('photos').get(id); r.onsuccess = () => res(r.result?.dataUrl || null); r.onerror = () => res(null); });
}
// A data URL as the bytes to upload (no fetch: that would be a request).
function blobOf(dataUrl) {
  const [head, b64] = String(dataUrl).split(',');
  const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
  const bin = atob(b64 || '');
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return { blob: new Blob([buf], { type }), type };
}
async function cloudPut(id, dataUrl, token) {
  const { blob, type } = blobOf(dataUrl);
  const res = await fetch(cloudUrlOf(id), { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': type }, body: blob });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
}

/** Keep an image (a data URL): here, and in the cloud when there is a token.
 *  Returns its id. A failed upload never loses the photo: it stays here. */
export async function putPhoto(dataUrl, { token = storedToken() } = {}) {
  const id = newId();
  await keepLocal(id, dataUrl);
  if (token) { try { await cloudPut(id, dataUrl, token); } catch { /* back up later */ } }
  return id;
}

/** Keep an image under a given id (a season pack brings its own ids). */
export async function putPhotoWithId(id, dataUrl) { await keepLocal(id, dataUrl); return id; }

/** The image a `photo:<id>` face names: this browser's copy, else the cloud's. */
export async function photoURL(face) {
  const id = String(face || '').startsWith('photo:') ? face.slice(6) : null;
  if (!id) return null;
  if (_cache.has(id)) return _cache.get(id);
  const url = (await localOnly(id)) || cloudUrlOf(id);
  _cache.set(id, url);
  return url;
}

/** Already known, without waiting (for drawing): local copy, or null. */
export const cachedPhoto = face => (String(face || '').startsWith('photo:') ? _cache.get(face.slice(6)) || null : null);
/** What an <img> should load right now: the local copy, else the cloud. */
export const photoSrc = face => (String(face || '').startsWith('photo:') ? _cache.get(face.slice(6)) || cloudUrlOf(face.slice(6)) : null);

/** Upload every photo in `faces` that the cloud does not have yet. */
export async function backUpPhotos(faces, token = storedToken()) {
  if (!token) throw new Error('A studio token is needed to back up to the cloud.');
  const ids = [...new Set(faces.filter(f => String(f || '').startsWith('photo:')).map(f => f.slice(6)))];
  const r = await fetch(`${GALLERY_API}/api/gallery/${FOLDER}?t=${Date.now()}`, { cache: 'no-store' });
  const have = new Set(((await r.json().catch(() => ({}))).images || []).map(i => String(i.file).replace(/\.[a-z]+$/, '')));
  let uploaded = 0, already = 0, failed = 0;
  for (const id of ids) {
    if (have.has(id)) { already++; continue; }
    const data = await localOnly(id);
    if (!data) { failed++; continue; }
    try { await cloudPut(id, data, token); uploaded++; } catch { failed++; }
  }
  return { uploaded, already, failed };
}

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
