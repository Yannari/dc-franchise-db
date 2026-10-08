// ══════════════════════════════════════════════════════════════════════
// td/story/phrase.js — the same move, in every voice
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "a kid wouldn't talk like a 50 year old", "we don't have this freedom
// with this many variants". A scene says WHAT happens; the phrasebook says HOW each person says
// it. A turn written as `{ by: 'b', move: 'pushback' }` is said in b's own words: the phrasebook
// (td/story/phrases/) has each move in many voices (voice.js tags: dry, loud, warm, quiet...)
// and age bands (teen, adult, grown), and the speaker gets, in order:
//   their strongest voice tags with their age band ('loud+teen'),
//   their strongest voice tags ('loud'),
//   their age band ('teen'),
//   anybody ('any').
// A move can be namespaced, 'pushback.lead' (pushing back on someone taking charge), and falls
// back to 'pushback'. A phrase may name the person spoken to as {to}. Nobody says the same phrase
// twice in a season; the least used wins. Words only: nothing here touches the game.
import { gs } from '../../core.js';
import { voiceOf } from './voice.js';
import { PHRASES } from './phrases/index.js';

export const AGES = new Set(['teen', 'adult', 'grown']);
const book = () => ((gs.tdStory ||= {}).phrases ||= { by: {}, uses: {} });

const chainOf = move => { const out = []; for (let m = move; m; m = m.includes('.') ? m.slice(0, m.lastIndexOf('.')) : null) out.push(m); return out; };

/** True when the phrasebook has this move (or a parent of it). */
export const hasMove = move => chainOf(move).some(m => PHRASES[m]);

/** A line for `speaker` making `move`. `to`: whether there is somebody to address ({to}). */
export function phrase(move, speaker, rng, { to = true } = {}) {
  const B = book();
  const said = (B.by[speaker] ||= []);
  const tags = voiceOf(speaker);
  const top = tags.filter(t => !AGES.has(t)).slice(0, 3);
  const age = tags.find(t => AGES.has(t)) || null;
  const ok = x => to || !/\{to(\.\w+)?\}/.test(x);
  let fallback = null;
  for (const m of chainOf(move)) {
    const P = PHRASES[m];
    if (!P) continue;
    const tiers = [age ? top.flatMap(t => P[`${t}+${age}`] || []) : [], top.flatMap(t => P[t] || []), age ? P[age] || [] : [], P.any || []];
    for (const tier of tiers) {
      const fits = tier.filter(ok);
      if (!fits.length) continue;
      fallback ||= fits;
      const fresh = fits.filter(x => !said.includes(x));
      if (!fresh.length) continue;
      const least = Math.min(...fresh.map(x => B.uses[x] || 0));
      const pool = fresh.filter(x => (B.uses[x] || 0) === least);
      return note(B, said, pool[Math.floor(rng() * pool.length)]);
    }
  }
  // everything that fits has been said by this speaker: the least used of their best tier
  if (fallback) {
    const least = Math.min(...fallback.map(x => B.uses[x] || 0));
    return note(B, said, fallback.find(x => (B.uses[x] || 0) === least));
  }
  return null;
}

function note(B, said, x) {
  said.push(x);
  B.uses[x] = (B.uses[x] || 0) + 1;
  return x;
}
