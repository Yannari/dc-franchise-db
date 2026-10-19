// ══════════════════════════════════════════════════════════════════════
// rr/script/identity.js — the team identity's own lines (the identity layer)
// ══════════════════════════════════════════════════════════════════════
//
// docs/ridonculous-race-identities.md "Custom identities": every identity has two kinds of
// line, kept apart.
//   voice      the attitude, never naming the identity's own things ("Count us in. Smile,
//              they're watching."): a custom identity borrows these from its voice identity
//   specific   the identity's world ("Board wax", "the bats are waking up"): built-in only,
//              never in the mouth of a custom team
// A pool turn { by: 'a', id: '<hook>' } speaks the speaker's team line for that hook; with
// nothing to say there (no identity, no line for the hook), the turn's own `say` speaks.
// Hooks: good, bad (a task the identity is good / bad at), win, struggle, lose, quit,
// about-friction, about-friend, arrive, mat-first, mat-last, elim.
// Kit lines may name {partner} (the speaker's partner), {identity}, {teamB}, {identityB}.
import athletes from './identity/athletes.js';
import performers from './identity/performers.js';
import subcultures from './identity/subcultures.js';
import uniforms from './identity/uniforms.js';
import online from './identity/online.js';
import online2 from './identity/online-2.js';
import brains from './identity/brains.js';
import handsOn from './identity/hands-on.js';
import lifestyle from './identity/lifestyle.js';
import everyday from './identity/everyday.js';

export const HOOKS = ['good', 'bad', 'win', 'struggle', 'lose', 'quit', 'about-friction', 'about-friend', 'arrive',
  'mat-first', 'mat-last', 'elim'];
export const KITS = Object.assign({}, athletes, performers, subcultures, uniforms, online, online2, brains, handsOn, lifestyle, everyday);

const teamOfName = (st, n) => Object.values(st.teams).find(t => t.a === n || t.b === n) || null;

// The line a speaker's team says at a hook, or null. A built-in identity draws from both kinds;
// a custom one only from its voice identity's voice lines.
export function identityLine(state, speaker, hook, rng = Math.random) {
  const t = teamOfName(state, speaker);
  if (!t) return null;
  // a line the user wrote for this team at this moment (the Pairs view), before anything from a kit
  const mine = [].concat(t.lines?.[hook] || []).filter(Boolean);
  let lines = [];
  if (t.identity && KITS[t.identity]) {
    const k = KITS[t.identity];
    lines = [...(k.specific?.[hook] || []), ...(k.voice?.[hook] || [])];
  } else if (t.custom?.voice && KITS[t.custom.voice]) {
    lines = [...(t.custom.lines?.[hook] || []), ...(KITS[t.custom.voice].voice?.[hook] || [])];
  }
  // a team says each kit line once a season (state.kitLedger, reset with the line ledger); none left, it stays quiet
  state.kitLedger ||= {};
  const used = (state.kitLedger[t.id ?? t.name] ||= []);
  const ownFresh = mine.filter(l => !used.includes(l));
  if (ownFresh.length) { used.push(ownFresh[0]); return ownFresh[0]; }
  const fresh = lines.filter(l => !used.includes(l));
  if (!fresh.length) return null;
  const pick = fresh[Math.floor(rng() * fresh.length) % fresh.length];
  used.push(pick);
  return pick;
}
