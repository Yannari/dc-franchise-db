// Reading and writing a character's gallery.
//
// The photographs live in an R2 bucket behind the Studio Worker:
//
//   GET    /api/gallery/<slug>          -> { images: [{ file, size }] }
//   PUT    /gallery/<slug>/<n>.<ext>    -> upload, token required
//   DELETE /gallery/<slug>/<n>.<ext>    -> remove, token required
//
// ── WHY THIS IS A MODULE ──
//
// player.html has done all of this since the gallery was built, and Dramagram
// needs the same four operations. Writing them a second time would mean two
// implementations of the slot allocator, two encoders, and — the expensive part
// — two chances to relearn the cache trap documented on `listGallery` below.
//
// So the IO lives here and both pages keep their own interface on top of it.
// What is shared is the part that talks to the bucket; what is not shared is
// what a drop zone looks like, which is different on the two pages and should
// be.

export const GALLERY_API = 'https://dc-studio.yannari19.workers.dev';

/** The bucket's own limit on how many a character may have. */
export const GALLERY_MAX = 14;

const EXT_OF = name => String(name).split('.').pop().toLowerCase();

/**
 * What the bucket actually holds for somebody.
 *
 * `fresh` skips the HTTP cache, and EVERYTHING THAT WRITES MUST PASS IT. The
 * listing is served with max-age=30, which is right for drawing a page and
 * wrong for every other caller: an upload that finished would not appear until
 * the cache expired — it looked like a silent failure and was reported as one —
 * and worse, a second upload inside the same thirty seconds would compute its
 * free slots from the stale list and overwrite the first one.
 */
export async function listGallery(slug, { fresh = false, base = GALLERY_API } = {}) {
  const url = `${base}/api/gallery/${encodeURIComponent(slug)}`
    + (fresh ? `?t=${Date.now()}` : '');
  const r = await fetch(url, fresh ? { cache: 'no-store' } : undefined);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'could not list the gallery');
  return j.images || [];
}

/** The full URL of one image. */
export const imageUrl = (slug, file, base = GALLERY_API) =>
  `${base}/gallery/${encodeURIComponent(slug)}/${file}`;

/**
 * Which numbered slots are free, given what is taken.
 *
 * Slots are numbers rather than names because the Worker's key whitelist is
 * `<slug>/<digits>.<ext>` — anything else is refused rather than repaired.
 */
export function freeSlots(taken, want, max = GALLERY_MAX) {
  const used = new Set((taken || []).map(o => parseInt(o.file, 10)).filter(Boolean));
  const free = [];
  for (let i = 1; i <= max && free.length < want; i++) if (!used.has(i)) free.push(i);
  return free;
}

/**
 * A file, ready to upload: downscaled and re-encoded.
 *
 * Transparent cut-out poses are most of this gallery, so there is no white
 * fill — the alpha channel has to survive or a page cannot tell a pose from a
 * scene shot, and it crops the tall ones through the head.
 *
 * An animation is passed through untouched: re-encoding a gif to webp on a
 * canvas keeps the first frame and silently throws the rest away.
 */
export async function prepareImage(file, { cap = 1600 } = {}) {
  const ext = EXT_OF(file.name);
  if (ext === 'gif' || file.type === 'image/gif') {
    return { blob: file, ext: 'gif', type: 'image/gif' };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('not a readable image'));
      im.src = url;
    });
    const scale = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(res => c.toBlob(res, 'image/webp', 0.9));
    if (!blob) throw new Error('could not encode');
    // A re-encode that made it BIGGER is not worth having.
    if (blob.size >= file.size && scale === 1) {
      const keep = ext === 'jpeg' ? 'jpg' : ext;
      if (['png', 'jpg', 'webp'].includes(keep)) return { blob: file, ext: keep, type: file.type };
    }
    return { blob, ext: 'webp', type: 'image/webp' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Put one prepared image in one slot. Throws with the Worker's own message. */
export async function putImage(slug, slot, { blob, ext, type }, token, base = GALLERY_API) {
  const res = await fetch(`${base}/gallery/${encodeURIComponent(slug)}/${slot}.${ext}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': type },
    body: blob,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

/** Remove one. There is no other copy — callers confirm before calling. */
export async function deleteImage(slug, file, token, base = GALLERY_API) {
  const res = await fetch(`${base}/gallery/${encodeURIComponent(slug)}/${file}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

/**
 * Upload several files into the free slots, one at a time.
 *
 * Returns what happened rather than talking to the user: the two pages report
 * progress differently and neither should have to unpick an alert() from a
 * shared module.
 */
export async function uploadMany(slug, files, token, { base = GALLERY_API, onProgress } = {}) {
  const taken = await listGallery(slug, { fresh: true, base });
  const slots = freeSlots(taken, files.length);
  const done = [];
  const failed = [];
  for (let i = 0; i < slots.length; i++) {
    onProgress?.(i + 1, slots.length, files[i]);
    try {
      const prepared = await prepareImage(files[i]);
      await putImage(slug, slots[i], prepared, token, base);
      done.push(`${slots[i]}.${prepared.ext}`);
    } catch (err) {
      failed.push(`${files[i].name}: ${err.message}`);
    }
  }
  return { done, failed, skipped: Math.max(0, files.length - slots.length), full: !slots.length };
}

/**
 * The whole gallery document: the numbered queue AND the posted archive.
 *
 * `listGallery` above returns the queue alone because every caller written
 * before the archive existed reasons about numbered slots. New code that needs
 * both — the feed, which draws archived photos, and the wiki gallery, which
 * must not lose a picture just because a post claimed it — reads this instead.
 */
export async function galleryFull(slug, { fresh = false, base = GALLERY_API } = {}) {
  const url = `${base}/api/gallery/${encodeURIComponent(slug)}`
    + (fresh ? `?t=${Date.now()}` : '');
  const r = await fetch(url, fresh ? { cache: 'no-store' } : undefined);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'could not list the gallery');
  return { images: j.images || [], posted: j.posted || [] };
}

/**
 * Set a photograph's facts: its mood, and whether it is the profile picture.
 *
 * On the object itself, in R2 metadata, because the first version kept the pin
 * in localStorage and a per-browser opinion is not a fact — pinned here,
 * unpinned on your phone. Pass `mood: null` to clear; `pinned: true` clears the
 * previous holder server-side, so one character never has two faces.
 */
export async function setImageMeta(slug, file, { mood, pinned } = {}, token, base = GALLERY_API) {
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(slug)}/meta`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, mood, pinned }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

/**
 * Archive a photograph a post has claimed.
 *
 * Moves <slug>/<n>.<ext> to <slug>/posted/<id>.<ext> — the key itself records
 * which post owns the picture, so there is no second file to keep in step. The
 * numbered slot frees up for the next dump; the image survives for the feed
 * and the wiki gallery both.
 */
export async function postPhoto(slug, file, id, token, base = GALLERY_API) {
  const res = await fetch(`${base}/api/gallery/${encodeURIComponent(slug)}/post`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, id }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || `HTTP ${res.status}`);
  return j;
}

/**
 * Every character's pinned face, in one request — for the 152-tile directory,
 * where asking each slug's listing would be 152 requests for one page.
 */
export async function fetchPins(base = GALLERY_API) {
  try {
    const j = await fetch(`${base}/api/gallery-pins`).then(r => r.json());
    return j.ok ? (j.pins || {}) : {};
  } catch { return {}; }
}
