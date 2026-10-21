// ══════════════════════════════════════════════════════════════════════
// js/dramagram-sync.js — a season's photos go to the cast's Dramagram
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-21: "can u automatically put those pics in their dramagram
// same for returnees avatar if they get one". Dramagram builds its posts from a
// character's gallery (js/dramagram.js postsFor: the numbered queue, claimed by
// life events and moments), so a photo reaches the feed by being put in it.
//
// After an export, two kinds of picture are added, once each:
//   - The Circle: the photos the author made for a player in cast setup (their
//     OWN slots, ci/photos.js; a catfish persona's pictures are somebody else's
//     face and never go on the real person's account). Each carries a mood, so
//     the feed posts it as a moment in the right register: a throwback is
//     nostalgic, the naughty one flirty.
//   - Any show: a returning player whose portrait this season is not one any of
//     their earlier seasons used. The new look is posted.
//
// Never fails an export, never asks for a token (a stored one or nothing), and
// never fills a gallery past its limit. What was sent is remembered in this
// browser, so a re-export does not post the same picture twice.
import { listGallery, freeSlots, putImage, setImageMeta } from './gallery-io.js';

// The register each Circle photo is posted in (js/dramagram.js moodFor's moods).
export const SLOT_MOOD = { profile: null, real: null, earned: 'flex', means: 'soft', nice: 'soft', naughty: 'flirty',
  throwback: 'nostalgic', childhood: 'nostalgic' };
const SYNCED_KEY = 'dc_dramagram_synced';
const slugify = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const baseName = f => String(f || '').split(/[\\/]/).pop();

/**
 * What to send, without sending it: [{ slug, key, kind, face | url, mood }].
 *
 * `cast` the season's people; `ciPhotos` seasonConfig.ciPhotos (null for another show); `dealt` who played as a
 * persona (their own slots are not theirs to post); `playersDb` the published record, for earlier seasons'
 * portraits; `portraitOf(name)` this season's { file, url }; `synced` what this browser already sent.
 */
export function photosToSync({ cast = [], seasonId = null, ciPhotos = null, dealt = {}, playersDb = null, portraitOf = () => null, synced = new Set() } = {}) {
  const rows = playersDb?.players || playersDb || [];
  const out = [];
  const add = item => { if (!synced.has(item.key) && !out.some(o => o.key === item.key)) out.push(item); };
  for (const name of cast) {
    const rec = rows.find(p => p?.name === name);
    const slug = rec?.id || rec?.slug || slugify(name);
    // The Circle: their own photos. A catfish's slots other than "real" belong to the persona, never shown here.
    const mine = ciPhotos?.[name] || {};
    const catfish = dealt?.[name]?.mode === 'catfish';
    for (const [kind, face] of Object.entries(mine)) {
      if (!String(face || '').startsWith('photo:') || (catfish && kind !== 'real')) continue;
      add({ slug, key: `${slug}|${face}`, kind, face, mood: SLOT_MOOD[kind] ?? null });
    }
    // A returnee's new look: a portrait none of their earlier seasons used.
    const now = portraitOf(name);
    const earlier = (rec?.seasonDetails || []).filter(d => d && d.seasonId !== seasonId);
    if (now?.url && earlier.length) {
      const before = new Set(earlier.map(d => baseName(d.avatarFile)).filter(Boolean));
      const file = baseName(now.file || now.url);
      if (file && !before.has(file)) add({ slug, key: `${slug}|avatar:${file}`, kind: 'avatar', url: now.url, mood: 'flex' });
    }
  }
  return out;
}

function readSynced() {
  try { return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]')); } catch { return new Set(); }
}
function writeSynced(set) {
  try { localStorage.setItem(SYNCED_KEY, JSON.stringify([...set].slice(-5000))); } catch { /* storage blocked */ }
}
const extOf = type => (/png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : /gif/.test(type) ? 'gif' : 'jpg');

/** Send them. Returns { sent, full, failed, skipped } and a sentence; never throws. */
export async function syncDramagram(plan, { token, onStatus = () => {}, photoURL = null } = {}) {
  const res = { sent: 0, full: 0, failed: 0 };
  if (!plan.length) return { ...res, reason: 'no new photos for Dramagram' };
  if (!token) return { ...res, reason: `${plan.length} photo${plan.length === 1 ? '' : 's'} not sent to Dramagram: no studio token in this browser` };
  const synced = readSynced();
  const bySlug = new Map();
  for (const item of plan) (bySlug.get(item.slug) || bySlug.set(item.slug, []).get(item.slug)).push(item);
  for (const [slug, items] of bySlug) {
    let slots;
    try { slots = freeSlots(await listGallery(slug, { fresh: true }), items.length); } catch { res.failed += items.length; continue; }
    res.full += Math.max(0, items.length - slots.length);
    for (let i = 0; i < slots.length; i++) {
      const it = items[i];
      try {
        const src = it.url || (photoURL ? await photoURL(it.face) : null);
        if (!src) throw new Error('no image');
        const blob = await fetch(src).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); });
        const ext = extOf(blob.type);
        await putImage(slug, slots[i], { blob, ext, type: blob.type || 'image/jpeg' }, token);
        if (it.mood) { try { await setImageMeta(slug, `${slots[i]}.${ext}`, { mood: it.mood }, token); } catch { /* the photo is up; the mood is extra */ } }
        synced.add(it.key); res.sent++;
      } catch { res.failed++; }
    }
  }
  writeSynced(synced);
  const parts = [`${res.sent} photo${res.sent === 1 ? '' : 's'} sent to Dramagram`];
  if (res.full) parts.push(`${res.full} skipped (gallery full)`);
  if (res.failed) parts.push(`${res.failed} failed`);
  onStatus(parts.join(', '));
  return { ...res, reason: parts.join(', ') };
}

/** The export's call: plan from the season just exported, then send. */
export async function syncAfterExport({ cast, seasonId, ciPhotos = null, dealt = {}, portraitOf, token, onStatus, photoURL }) {
  const playersDb = await fetch('players_database.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
  const plan = photosToSync({ cast, seasonId, ciPhotos, dealt, playersDb, portraitOf, synced: readSynced() });
  return syncDramagram(plan, { token, onStatus, photoURL });
}
