// ══════════════════════════════════════════════════════════════════════
// bb/mastermind-reveal.js — who the Mastermind was (A Summer of Mystery)
// ══════════════════════════════════════════════════════════════════════
//
// BB27's finale unmasked the Mastermind as Dr. Will Kirby, a past winner — and
// then showed that he had been set up. There were three Masterminds, Eric
// Stein, Jessie Godderz and Frankie Grande, each wearing a different mask,
// each out for revenge on the twist that cost them their own season (America's
// Player, the Coup d'Etat, the Rewind Button).
//
// Ours is the same shape, cast from the franchise's own history: the framed
// one is its most recent winner, and the three are its most recent players who
// came closest without winning (a runner-up first, then any finalist). Nobody
// in this season's cast can be either. Too little history and there is no
// reveal at all, rather than one made of strangers.
import { activeSeasons, seasonKeyParts } from '../franchise-meta.js';
import { SHOWS, DEFAULT_FORMAT } from '../shows.js';

const whereOf = p => (!p.format || p.format === DEFAULT_FORMAT ? `Season ${p.num}` : `${SHOWS[p.format]?.name || 'Season'} ${p.num}`);

export function mastermindReveal(cast = []) {
  let seasons = [];
  try {
    seasons = Object.entries(activeSeasons() || {}).filter(([, s]) => s?.players)
      .map(([k, s]) => ({ s, p: seasonKeyParts(k, s) })).reverse();   // latest first
  } catch { return null; }
  const out = new Set(cast);
  let framed = null;
  const three = [];
  for (const { s, p } of seasons) {
    for (const [name, rec] of Object.entries(s.players || {})) {
      if (out.has(name) || !rec) continue;
      if (!framed && rec.winner) { framed = { name, where: whereOf(p) }; continue; }
    }
  }
  for (const pass of ['runner-up', 'finalist']) {
    for (const { s, p } of seasons) {
      for (const [name, rec] of Object.entries(s.players || {})) {
        if (three.length >= 3) break;
        if (!rec || rec.winner || out.has(name) || name === framed?.name || three.some(x => x.name === name)) continue;
        const hit = pass === 'runner-up' ? Number(rec.placement) === 2 : !!rec.finalist;
        if (hit) three.push({ name, where: whereOf(p), placement: Number(rec.placement) || null });
      }
    }
  }
  if (!framed || three.length < 1) return null;
  return { framed, masterminds: three };
}
