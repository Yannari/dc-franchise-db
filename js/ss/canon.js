// ══════════════════════════════════════════════════════════════════════
// ss/canon.js — a Secret Story secret becomes part of who somebody is
// ══════════════════════════════════════════════════════════════════════
//
// Once a season starts, each housemate's PERSONAL secret (drawn from the pool
// or written by the user) is written to the character: the D1 roster's
// `secret` column, write-once (worker/worker-studio.js rosterSecret). From
// then on it is theirs on every page and in every later season.
//
// Two ways it gets there, so a secret is never lost:
//   1. at the start of the season, from this browser, when it holds the
//      Studio key (localStorage 'studio_api_token');
//   2. on publish: the season document carries `canonSecrets`, and the worker
//      writes whatever is still missing.
// Real ties and real-history secrets are facts already on record, and roles
// from the Voice are jobs, not biography: none of those are written.

const PERSONAL = new Set(['pool', 'own']);
const slugify = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * The canon this season creates.
 *   state:  gs.bb.secretStory
 *   season: 'ss-N'
 *   slugOf: name → roster slug
 */
export function canonSecretsOf(state, { season = null, slugOf = slugify } = {}) {
  return (state?.secrets || [])
    .filter(s => PERSONAL.has(s.source) && (s.holders || []).length === 1)
    .map(s => ({
      slug: slugOf(s.holders[0]) || slugify(s.holders[0]),
      name: s.holders[0],
      secret: { text: s.text, kind: s.kind === 'personal' ? (s.secretKind || 'past') : s.kind,
        clues: [...(s.clues || [])], tells: [...(s.tells || [])], difficulty: s.difficulty,
        ...(s.poolId ? { id: s.poolId } : {}), ...(season ? { firstSeason: season } : {}) },
    }));
}

/**
 * Send the canon to the roster, when this browser can. Never throws: the
 * publish path is the safety net. Resolves to the worker's answer, or null.
 */
export async function pushCanonSecrets(list) {
  if (!Array.isArray(list) || !list.length || typeof fetch !== 'function') return null;
  let base = '', token = '';
  try {
    base = (localStorage.getItem('studio_api_base') || 'https://dc-studio.yannari19.workers.dev').replace(/\/+$/, '');
    token = localStorage.getItem('studio_api_token') || '';
  } catch { return null; }
  if (!token) return null;
  try {
    const r = await fetch(base + '/api/roster/secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ secrets: list.map(({ slug, secret }) => ({ slug, secret })) }),
    });
    const j = await r.json().catch(() => null);
    return r.ok && j?.ok ? j : null;
  } catch { return null; }
}
