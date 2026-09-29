// ══════════════════════════════════════════════════════════════════════
// ci/party.js — themed nights (spec §13.4)
// ══════════════════════════════════════════════════════════════════════
//
// Props arrive at every door ("We got pizza. Yeah, buddy!"), players dance
// alone, and the party moves into Circle Chat: Never Have I Ever (1×02),
// where an answer becomes something everybody knows about you. Guards drop —
// more slips, more flirting — and nobody is lonely for a night.
import { PARTY_THEMES, NEVER_HAVE_I_EVER } from './games-data.js';
import { rel, bump, S, clamp, addScene } from './state.js';
import { attractionOk } from './chat.js';
import { rollSlips } from './slips.js';
import { runCircleChat } from './feed.js';

export const NHIE_ROUNDS = 4;

function drawTheme(state, rng) {
  const thrown = (state.partiesThrown ||= []);
  const left = PARTY_THEMES.filter(t => !thrown.includes(t.id));
  const theme = (left.length ? left : PARTY_THEMES)[Math.floor(rng() * (left.length || PARTY_THEMES.length))];
  thrown.push(theme.id);
  return theme;
}

export function runParty(state, rng, { theme = null } = {}) {
  const all = [...state.active];
  const t = theme || drawTheme(state, rng);
  const sc = addScene(state, 'party', all, { theme: t.id, props: [...t.props], rounds: [] }, all);
  const askers = [...all].sort((a, b) => S(state, b, 'boldness') - S(state, a, 'boldness') || (rng() - 0.5));
  const used = new Set();
  for (let i = 0; i < Math.min(NHIE_ROUNDS, all.length); i++) {
    const by = askers[i];
    const pool = NEVER_HAVE_I_EVER.filter(x => !used.has(x.id));
    const st = pool[Math.floor(rng() * pool.length)];
    used.add(st.id);
    const admitted = all.filter(h => rng() < clamp(S(state, h, st.stat) / 12 + rng() * 0.3 - 0.15, 0.02, 0.95));
    for (const h of admitted) {
      for (const obs of all) if (obs !== h && attractionOk(state, obs, h) && rel(obs, h, 'attraction') > 2) bump(obs, h, 'attraction', 0.3);
      rollSlips(state, rng, h, all, { specific: 0.5, party: true, attention: 0.6 }, sc);
    }
    sc.data.rounds.push({ by, statement: st.id, admitted });
  }
  for (const a of all) for (const b of all) {
    if (a !== b && attractionOk(state, a, b) && rel(a, b, 'attraction') > 3) bump(a, b, 'attraction', 0.5);
  }
  runCircleChat(state, rng, { party: true });
  return sc;
}
