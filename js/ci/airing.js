// ══════════════════════════════════════════════════════════════════════
// ci/airing.js — what makes the episode (spec §16)
// ══════════════════════════════════════════════════════════════════════
//
// Every big moment airs. Of the day's private chats, the most dramatic nine
// air (a real episode shows eight to twelve), and three statuses. The public
// only ever reacts to what aired. Its own dice: a line cannot move a result,
// and neither can the edit.
import { streamFor } from '../dr/rng.js';

export const ALWAYS_AIRS = new Set(['profiles', 'recognise', 'arrival', 'after-party', 'likes', 'circle-chat',
  'ratings', 'hangout', 'blocking', 'visit', 'report', 'goodbye', 'final-ratings', 'meet', 'reveal',
  'game', 'party', 'life', 'home-video']);
export const CHATS_PER_DAY = 9;
export const STATUSES_PER_DAY = 3;
const DRAMA = { bond: 0.5, checkin: 0.8, ally: 1.2, flirt: 1.3, probe: 1.6, pump: 1.2, compare: 1.8,
  plant: 2, credit: 1.4, repair: 1.2, confront: 2, pitch: 1, confess: 2.5 };
const TONE = { low: 2, high: 1.5, steady: 0.5 };

export function chooseAired(state, day) {
  const rng = streamFor(state.seed, `air:${day}`);
  const today = state.scenes.filter(s => s.day === day);
  for (const s of today) s.aired = ALWAYS_AIRS.has(s.kind);
  const chats = today.filter(s => s.kind === 'chat').map(s => [s,
    (DRAMA[s.data.intent] || 0.5) + (s.data.ending === 'cold' ? 1.5 : 0) + (s.data.claims?.length || 0)
    + 1.5 * (s.data.slips || []).filter(x => x.noticedBy.length).length + (s.data.probes?.length || 0)
    + (s.data.pact ? 0.8 : 0) + rng() * 0.5]);
  chats.sort((a, b) => b[1] - a[1]).slice(0, CHATS_PER_DAY).forEach(([s]) => { s.aired = true; });
  today.filter(s => s.kind === 'status').map(s => [s, (TONE[s.data.tone] || 0) + rng()])
    .sort((a, b) => b[1] - a[1]).slice(0, STATUSES_PER_DAY).forEach(([s]) => { s.aired = true; });
}
