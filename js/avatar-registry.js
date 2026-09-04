// The one and only authority on which image file represents a player.
//
// Before this module a player's artwork was chosen by MUTATING player.slug to
// `{slug}-returnee`, which meant every one of ~100 screens picked the variant
// up by accident, artwork and identity were the same field, and a person could
// have exactly two looks ever. Portraits are now declared in
// assets/avatars/portrait-catalog.json, scoped to a show, and chosen per season
// appearance. Returning-player status is continuity metadata and chooses
// nothing.
import { SHOWS } from './shows.js';

export const AVATAR_DIR = 'assets/avatars/';

let _catalog = null;
let _files = null;          // Set<string> of basenames, or null = "unknown, assume present"
let _loadPromise = null;
const _warned = new Set();

const IMAGE_RE = /\.(png|webp|jpe?g|gif)$/i;

export function isSafePortraitFile(file) {
  return typeof file === 'string' && !!file
    && !/[\\/]/.test(file) && !file.includes('..') && !file.includes(':')
    && !file.startsWith('.') && IMAGE_RE.test(file);
}

export function setPortraitCatalog(catalog, availableFiles) {
  _catalog = catalog || null;
  _files = Array.isArray(availableFiles) ? new Set(availableFiles)
    : (availableFiles instanceof Set ? availableFiles : null);
  _warned.clear();
  return _catalog;
}

export function getPortraitCatalog() { return _catalog; }

/**
 * Browser-side load. Cached, de-duped, and never throws: a failed load simply
 * leaves resolution on season snapshots and the legacy base file, which is why
 * an archived season still renders when the catalog is unavailable.
 */
export function loadPortraitCatalog({ force = false } = {}) {
  if (_catalog && !force) return Promise.resolve(_catalog);
  if (_loadPromise && !force) return _loadPromise;
  if (typeof fetch !== 'function') return Promise.resolve(_catalog);
  const j = url => fetch(url, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  _loadPromise = Promise.all([j(`${AVATAR_DIR}portrait-catalog.json`), j(`${AVATAR_DIR}available-files.json`)])
    .then(([cat, files]) => setPortraitCatalog(cat, files?.files));
  return _loadPromise;
}

function isKnownShow(show) { return typeof show === 'string' && Object.prototype.hasOwnProperty.call(SHOWS, show); }
function entryFor(slug) { return (slug && _catalog?.players?.[slug]) || null; }
function fileExists(file) { return !_files || _files.has(file); }
function urlFor(file) { return isSafePortraitFile(file) ? `${AVATAR_DIR}${file}` : ''; }

function devWarn(key, message) {
  if (_warned.has(key)) return;
  _warned.add(key);
  if (typeof console !== 'undefined' && console.warn) console.warn(`[avatar-registry] ${message}`);
}

/** Show-specific portraits first, then the player's global portrait. */
export function portraitOptions(playerSlug, show) {
  const entry = entryFor(playerSlug);
  if (!entry) return [];
  const key = isKnownShow(show) ? show : null;
  const list = (entry.portraits || []).filter(p => p && isSafePortraitFile(p.file));
  const scoped = key ? list.filter(p => p.show === key) : [];
  const global = list.filter(p => p.show === 'global');
  return [...scoped, ...global].map(p => ({
    id: p.id, show: p.show, label: p.label, file: p.file,
    url: urlFor(p.file), missing: !fileExists(p.file), isGlobal: p.show === 'global',
  }));
}

/** True when this player has nothing authored for this show - the builder says why. */
export function hasShowPortraits(playerSlug, show) {
  return portraitOptions(playerSlug, show).some(o => !o.isGlobal);
}

function found(playerSlug, portrait, source) {
  return {
    playerSlug, avatarId: portrait.id, file: portrait.file,
    url: urlFor(portrait.file), source, missing: !fileExists(portrait.file),
  };
}

/**
 * @returns {{playerSlug:string, avatarId:string|null, file:string, url:string,
 *   source:'season-snapshot'|'selected-id'|'show-default'|'global-default'|'legacy-default'|'fallback',
 *   missing:boolean}}
 */
export function resolvePortrait({ playerSlug, show, avatarId, avatarFile } = {}) {
  const slug = typeof playerSlug === 'string' ? playerSlug.trim() : '';
  if (!slug) return { playerSlug: '', avatarId: null, file: '', url: '', source: 'fallback', missing: true };

  // 1. the historical snapshot - an archived season renders even with no catalog
  if (avatarFile) {
    if (isSafePortraitFile(avatarFile)) {
      const known = entryFor(slug)?.portraits?.find(p => p.file === avatarFile);
      if (avatarId && known && known.id !== avatarId) {
        devWarn(`mismatch:${slug}:${avatarId}`, `${slug}: snapshot ${avatarFile} disagrees with avatarId "${avatarId}"; the snapshot wins`);
      }
      return {
        playerSlug: slug, avatarId: known?.id || avatarId || null, file: avatarFile,
        url: urlFor(avatarFile), source: 'season-snapshot', missing: !fileExists(avatarFile),
      };
    }
    devWarn(`unsafe:${slug}:${avatarFile}`, `${slug}: refused unsafe portrait file "${avatarFile}"`);
  }

  const entry = entryFor(slug);
  if (entry) {
    const byId = new Map((entry.portraits || []).filter(p => isSafePortraitFile(p.file)).map(p => [p.id, p]));
    const alias = entry.aliases?.[avatarId];

    // 2. the requested id
    const sel = byId.get(avatarId) || (alias ? byId.get(alias) : null);
    if (sel) return found(slug, sel, 'selected-id');
    if (avatarId) devWarn(`unknown-id:${slug}:${avatarId}`, `${slug}: unknown avatarId "${avatarId}" - falling back to a default`);

    // 3. the show default. An unknown show has none, and never borrows Total
    //    Drama's: printing one show's look over another is the whole bug class.
    if (isKnownShow(show)) {
      const d = byId.get(entry.defaults?.[show]);
      if (d) return found(slug, d, 'show-default');
    }

    // 4. the global default
    const g = byId.get(entry.defaults?.global)
      || (entry.portraits || []).find(p => p.show === 'global' && isSafePortraitFile(p.file));
    if (g) return found(slug, g, 'global-default');
  }

  // 5. the legacy convention
  const legacy = `${slug}.png`;
  return { playerSlug: slug, avatarId: null, file: legacy, url: urlFor(legacy), source: 'legacy-default', missing: !fileExists(legacy) };
  // 6. the initials/emoji fallback is the caller's job: they render it when
  //    `missing` is true or the <img> errors.
}

/**
 * The single call every screen makes.
 * @param {string|object} context a slug, or an object with
 *   { slug|playerSlug|baseSlug, show, avatarId, avatarFile }
 */
export function avatarUrl(context) {
  if (typeof context === 'string') return resolvePortrait({ playerSlug: context }).url;
  if (!context) return '';
  const slug = context.playerSlug || context.slug || context.baseSlug || '';
  return resolvePortrait({
    playerSlug: String(slug).replace(/-returnee$/, ''),
    show: context.show, avatarId: context.avatarId, avatarFile: context.avatarFile,
  }).url;
}

/**
 * One-way repair for records written before avatarId existed. Reads the three
 * legacy shapes - bare slug, mutated `{slug}-returnee`, and
 * `isReturnee` + `_returneeAvatarOk` - and returns the selection they meant.
 * Only ever called for a player with no avatarId; once somebody has chosen a
 * portrait, isReturnee stops having any say.
 */
export function legacyPortraitSelection(player, show) {
  if (!player) return { avatarId: null, avatarFile: '' };
  // Read BOTH fields: the legacy repair wrote the canonical name to baseSlug
  // and the mutated one to slug, so looking at only the first hides the very
  // suffix this function exists to notice.
  const raw = String(player.baseSlug || player.slug || '').trim();
  const effective = String(player.slug || player.baseSlug || '').trim();
  const base = raw.replace(/-returnee$/, '');
  const wantsReturnee = /-returnee$/.test(effective)
    || (!!player.isReturnee && !!player._returneeAvatarOk);

  if (wantsReturnee && isKnownShow(show)) {
    const legacyFile = `${base}-returnee.png`;
    const match = entryFor(base)?.portraits?.find(p => p.file === legacyFile && p.show === show);
    if (match) return { avatarId: match.id, avatarFile: match.file };
  }
  const r = resolvePortrait({ playerSlug: base, show });
  return { avatarId: r.avatarId, avatarFile: r.file };
}
