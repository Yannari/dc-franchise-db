// Finding a character's art on the wikis, and filling their gallery with it.
//
// ── EXTRACTED, NOT INVENTED ──
//
// player.html has done all of this since the gallery was built: find the
// article, keep the files named after the character, rank portraits first,
// fetch through the Worker's proxy, cap the transparent cut-outs, upload into
// free slots. Dramagram needed the same button, and a second copy of this logic
// is how the two would come to fill the same gallery two different ways — the
// name-matching alone (Aaliyah vs Aaliyah Anderson vs Aaliyahna) carries three
// bugs' worth of lessons that must not be relearned.
//
// The interactive parts stay OUT. Which candidate article to use and what to do
// when nothing matches are questions for a person, so they arrive as callbacks
// (`pickCandidate`, `askExact`) and each page asks in its own voice.
//
// scripts/fetch_gallery.py is the batch ancestor of the same rules.

import { listGallery, putImage, GALLERY_API, GALLERY_MAX } from './gallery-io.js';

/** The wikis the cast is drawn from. Both API and image host send ACAO *. */
export const WIKIS = [
  { name: 'Total Drama', api: 'https://totaldrama.fandom.com/api.php' },
  { name: 'Disventure Camp', api: 'https://disventurecamp.fandom.com/api.php' },
  // A lower floor here: this wiki's character art IS its icons, and at the
  // default 300 the whole cast comes back with one picture each.
  { name: 'Mad House', api: 'https://mhrp.fandom.com/api.php', minDim: 200, allowIcon: true },
];

/** Lowercase, strip accents and punctuation — "Rosa-Maria" matches "Rosa María". */
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

async function wikiApi(base, params) {
  // origin=* is what makes an anonymous cross-origin MediaWiki request legal.
  const q = new URLSearchParams({ ...params, format: 'json', origin: '*' });
  const r = await fetch(`${base}?${q}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function* nameVariants(name) {
  yield name;
  if (name.includes(' ')) yield name.replace(/ /g, '_');
  if (name.includes('-')) yield name.replace(/-/g, ' ');
  if (name.includes('-')) yield name.replace(/-/g, '');
}

/**
 * Find a character's article on one wiki.
 *
 * Returns `{title}` when it is certain, `{candidates}` when several articles
 * could be the person, and `{}` when nothing matches. The `candidates` case is
 * why this is not a boolean: the roster holds first names and some wikis title
 * articles with full ones, and picking the first search hit would quietly fill
 * a gallery with somebody else's face.
 */
export async function findArticle(base, name) {
  for (const v of new Set(nameVariants(name))) {
    try {
      const d = await wikiApi(base, { action: 'query', titles: v, prop: 'info', redirects: 1 });
      const page = Object.values(d.query.pages)[0];
      if (page && !('missing' in page) && page.title) return { title: page.title };
    } catch { /* try the next variant */ }
  }
  const skip = t => {
    const low = t.toLowerCase();
    return low.includes('/beta') || low.includes('/interactions') || low.includes(' and ');
  };
  try {
    const d = await wikiApi(base, { action: 'query', list: 'search', srsearch: name, srlimit: '10' });
    const hits = (d.query.search || []).map(h => h.title).filter(t => !skip(t));
    for (const t of hits) if (norm(t) === norm(name)) return { title: t };
    // "Aaliyah" is the whole first word of "Aaliyah Anderson", but only a
    // fragment of "Aaliyahna" — a word boundary, not a prefix.
    const want = norm(name);
    const firstName = hits.filter(t => norm(t.split(/\s+/)[0]) === want);
    if (firstName.length === 1) return { title: firstName[0] };
    if (firstName.length > 1) return { candidates: firstName };
  } catch { /* no search, no match */ }
  return {};
}

/**
 * Keep only the files named after this character, if any are.
 *
 * An article does not only embed its own subject's pictures — a season template
 * at the bottom drags in the whole cast's icons. All-or-nothing on purpose:
 * where filenames carry names this is decisive, and where they do not, no file
 * matches and everything is kept.
 */
function ownFiles(files, name) {
  const keys = [norm(name), norm(String(name).split(/\s+/)[0])].filter(k => k.length >= 3);
  if (!keys.length) return files;
  const mine = files.filter(f => keys.some(k => norm(f.title).includes(k)));
  return mine.length ? mine : files;
}

/** Usable images embedded on an article, portrait-led. Mirrors fetch_gallery.py. */
export async function articleImages(base, title, name, minDim = 300, allowIcon = false) {
  // "icon" usually means interface furniture; on the Mad House wiki it is the
  // naming convention for the cast portraits themselves.
  const DENY = ['wiki', 'wordmark', 'favicon', 'site-logo', 'logo', 'icon', 'badge',
    'spinner', 'loading', 'placeholder', 'stub', 'spoiler', 'vote', 'star',
    'userbox', 'emoji', 'button', 'nav', 'banner-', 'header-']
    .filter(d => d !== 'icon' || !allowIcon);
  const MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
  const files = [];
  let cont = null;
  for (let page = 0; page < 6; page++) {
    const p = { action: 'query', prop: 'images', titles: title, imlimit: '500', redirects: 1 };
    if (cont) p.imcontinue = cont;
    const d = await wikiApi(base, p);
    const pg = Object.values(d.query.pages)[0];
    if (!pg || 'missing' in pg) return { images: [], fileCount: 0 };
    files.push(...(pg.images || []).map(im => im.title));
    cont = d.continue?.imcontinue;
    if (!cont) break;
  }
  const out = [];
  for (let i = 0; i < files.length; i += 50) {
    const d = await wikiApi(base, { action: 'query', titles: files.slice(i, i + 50).join('|'),
      prop: 'imageinfo', iiprop: 'url|size|mime' });
    for (const pg of Object.values(d.query.pages || {})) {
      const ii = (pg.imageinfo || [])[0];
      if (!ii) continue;
      const low = (pg.title || '').toLowerCase();
      const w = ii.width || 0, h = ii.height || 0;
      if (!MIME[ii.mime]) continue;
      if (Math.min(w, h) < minDim) continue;       // icons and sprites
      if (DENY.some(x => low.includes(x))) continue;
      if (w >= 3 * h) continue;                    // banners and title cards
      out.push({ title: pg.title, url: ii.url, w, h, area: w * h, aspect: w / Math.max(1, h) });
    }
  }
  const seen = new Set();
  const uniq = ownFiles(out.filter(im => !seen.has(im.url) && seen.add(im.url)), name || title);
  // Solo character renders are square or tall; episode stills and group scenes
  // are wide. Leading with portraits opens the gallery on THIS character.
  const by = () => (b, c) => c.area - b.area;
  return {
    fileCount: files.length,
    images: [
      ...uniq.filter(i => i.aspect <= 1.1).sort(by()),
      ...uniq.filter(i => i.aspect > 1.1 && i.aspect <= 1.6).sort(by()),
      ...uniq.filter(i => i.aspect > 1.6).sort(by()),
    ],
  };
}

/** Is this a transparent cut-out pose rather than a scene? */
export function isCutout(img) {
  try {
    const c = document.createElement('canvas');
    c.width = 24; c.height = 24;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 24, 24);
    const px = ctx.getImageData(0, 0, 24, 24).data;
    let clear = 0;
    for (let p = 3; p < px.length; p += 4) if (px[p] < 250) clear++;
    return clear / (px.length / 4) > 0.10;
  } catch { return false; }
}

/**
 * The whole fill: search, choose, fetch through the Worker, cap the poses,
 * upload into free slots. Filling never replaces what is there.
 *
 * `say(text)`            progress, for a button label.
 * `pickCandidate(w, cs)` several articles could be the person — which? null skips.
 * `askExact(name, why)`  nothing matched — the exact article title, or null.
 *
 * Returns { added, poses, foundTitle, wikiName, free, failed[], why[] } and
 * throws only on the unrecoverable (no slots is a return, not a throw).
 */
export async function fillFromWiki(slug, name, token, {
  base = GALLERY_API,
  say = () => {},
  pickCandidate = async () => null,
  askExact = async () => null,
} = {}) {
  const taken = new Set((await listGallery(slug, { fresh: true, base }))
    .map(o => parseInt(o.file, 10)).filter(Boolean));
  const free = [];
  for (let i = 1; i <= GALLERY_MAX; i++) if (!taken.has(i)) free.push(i);
  if (!free.length) return { added: 0, poses: 0, free: 0, failed: [], why: ['the gallery is already full'] };

  // ── find the character ──
  //
  // Every wiki is tried and every outcome recorded, because "not found" is the
  // answer that needs explaining: whether the article is missing, or found but
  // carrying nothing usable, is the difference between a wrong name and a thin
  // page.
  say('Searching…');
  const why = [];
  let found = null;
  for (const wiki of WIKIS) {
    try {
      const hit = await findArticle(wiki.api, name);
      let title = hit.title;
      if (!title && hit.candidates) {
        title = await pickCandidate(wiki.name, hit.candidates);
        if (!title) { why.push(`${wiki.name}: ${hit.candidates.length} possible matches, none chosen`); continue; }
      }
      if (!title) { why.push(`${wiki.name}: no article for "${name}"`); continue; }
      const { images, fileCount } = await articleImages(wiki.api, title, name, wiki.minDim, wiki.allowIcon);
      if (!images.length) {
        why.push(`${wiki.name}: found "${title}" but none of its ${fileCount} files are usable `
          + '(too small, or logos and banners)');
        continue;
      }
      found = { wiki, title, images };
      break;
    } catch (err) { why.push(`${wiki.name}: ${err.message}`); }
  }

  if (!found) {
    const exact = await askExact(name, why);
    if (exact && exact.trim()) {
      for (const wiki of WIKIS) {
        try {
          const { images } = await articleImages(wiki.api, exact.trim(), exact.trim(), wiki.minDim, wiki.allowIcon);
          if (images.length) { found = { wiki, title: exact.trim(), images }; break; }
        } catch { /* next wiki */ }
      }
    }
    if (!found) return { added: 0, poses: 0, free: free.length, failed: [], why };
  }

  // ── take the images ──
  //
  // Cut-outs are capped. These wikis are dominated by transparent pose assets,
  // and a gallery of nothing but them is what this cap exists to prevent —
  // scene shots go in first, poses fill what is left.
  let added = 0, poses = 0;
  const failed = [];
  for (const cand of found.images) {
    if (added >= free.length) break;
    say(`Adding ${added + 1}…`);
    try {
      // Through the Worker, never straight from the wiki — a direct request
      // gets a 404 served AS AN IMAGE, which decodes happily and uploads as a
      // grey square.
      const wr = await fetch(`${base}/api/wiki-image?url=${encodeURIComponent(cand.url)}`,
        { headers: { Authorization: 'Bearer ' + token } });
      if (!wr.ok) {
        const j = await wr.json().catch(() => ({}));
        throw new Error(j.error || `fetch failed (${wr.status})`);
      }
      const src = URL.createObjectURL(await wr.blob());
      let img;
      try {
        img = await new Promise((res, rej) => {
          const im = new Image();
          im.onload = () => res(im);
          im.onerror = () => rej(new Error('could not decode'));
          im.src = src;
        });
      } finally { URL.revokeObjectURL(src); }
      // The wiki said how big this is. Anything that decodes far smaller is not
      // the file we asked for — a placeholder, an error card, a thumbnail.
      if (cand.w && img.naturalWidth < Math.min(cand.w, 300) * 0.6) {
        throw new Error(`got ${img.naturalWidth}x${img.naturalHeight}, expected ${cand.w}x${cand.h}`);
      }
      const cutout = isCutout(img);
      if (cutout && poses >= 2) continue;
      const cap = 1600;
      const scale = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(r2 => c.toBlob(r2, 'image/webp', 0.9));
      if (!blob) throw new Error('could not encode');
      // This importer's own encode: it needs the decoded image for the cut-out
      // check, which prepareImage does not do. The upload itself is the shared one.
      await putImage(slug, free[added], { blob, ext: 'webp', type: 'image/webp' }, token, base);
      added++;
      if (cutout) poses++;
    } catch (err) { failed.push(err.message); }
  }
  return { added, poses, free: free.length, failed, why,
    foundTitle: found.title, wikiName: found.wiki.name };
}
