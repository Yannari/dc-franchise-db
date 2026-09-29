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
import { feel } from './mind.js';
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
    }
    sc.data.rounds.push({ by, statement: st.id, admitted });
  }
  // What someone admits can give them away — rolled once per player for the
  // whole game (per admission, the audit counted six misreads a party).
  const admittedAny = [...new Set(sc.data.rounds.flatMap(r => r.admitted))];
  for (const h of admittedAny) rollSlips(state, rng, h, all, { specific: 0.8, party: true, attention: 0.6 }, sc);
  const flirts = [];
  for (const a of all) for (const b of all) {
    if (a !== b && attractionOk(state, a, b) && rel(a, b, 'attraction') > 3) {
      bump(a, b, 'attraction', 0.5);
      if (a < b && attractionOk(state, b, a) && rel(b, a, 'attraction') > 3) flirts.push([a, b]);
    }
  }
  // Dancing alone in the apartment (the boldest), and party photos posted to
  // the Newsfeed: whoever likes one warms to whoever posted it.
  const dancers = [...all].sort((x, y) => S(state, y, 'boldness') - S(state, x, 'boldness') || (rng() - 0.5)).slice(0, Math.min(3, all.length));
  for (const h of dancers) feel(state, h, 'elation', 0.5);
  const photos = [...all].sort(() => rng() - 0.5).slice(0, Math.min(3, all.length)).map(h => {
    const likers = all.filter(o => o !== h && rel(o, h, 'affection') + rng() * 2 > 0.5);
    for (const o of likers) bump(o, h, 'affection', 0.2);
    return { by: h, likers };
  });
  Object.assign(sc.data, { dancers, photos, flirts });
  runCircleChat(state, rng, { party: true });
  return sc;
}
