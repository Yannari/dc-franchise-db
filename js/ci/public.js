// ══════════════════════════════════════════════════════════════════════
// ci/public.js — what the audience thinks, from what aired (spec §16)
// ══════════════════════════════════════════════════════════════════════
//
// Perfect Match's two ledgers, IMPORTED (js/pm/ledger.js): approval (-100..100)
// and fame (never falls). The only file under js/ci/ allowed to touch them —
// no player's decision may read the public (tests/ci-guards.test.js).
import { createLedger, noteArrival, recordAired, closeEpisode, readApproval, labelFor } from '../pm/ledger.js';
import { peopleOf } from './state.js';

export const APPROVAL = {
  chat: { warm: 0.25, neutral: 0.05, cold: -0.15 },
  intent: { plant: -1.0, credit: -0.4, confront: -0.3, checkin: 0.5, confess: 0.8, repair: 0.4 },
  theory: -0.3,
  wronglyBlocked: 1.5,
  blocked: 0.3,
  visitLie: -1.5,
  kiss: 0.5,
  protectiveReveal: 0.8,
  strategicReveal: -0.3,
  // What the audience makes of the newer scenes (2026-10-01).
  deep: 0.4,            // a heart-to-heart
  welcome: 0.25,        // first to welcome a newcomer warmly
  jealousCold: -0.3,    // a jealous message that turned sour
  allianceBetrayal: -1.5, // an Influencer blocking their own ally
  wronglyKicked: 1.0,   // thrown out of an alliance for a treason they didn't commit
  doubleAgent: -0.6,    // caught in two alliances
  trophy: 0.4,          // won a judged game
};

export function openLedger(state) { state.ledger = createLedger(); }
export function noteJoin(state, h) { for (const n of peopleOf(state, h)) noteArrival(state.ledger, n, state.day); }

export function sceneApproval(state, sc) {
  const out = {};
  const add = (h, v) => { out[h] = (out[h] || 0) + v; };
  switch (sc.kind) {
    case 'chat': {
      const [from, to] = sc.who;
      add(from, (APPROVAL.chat[sc.data.ending] || 0) + (APPROVAL.intent[sc.data.intent] || 0));
      add(to, (APPROVAL.chat[sc.data.ending] || 0) * 0.5);
      if (sc.data.deep) { add(from, APPROVAL.deep); add(to, APPROVAL.deep); }
      if (sc.data.intent === 'jealous' && sc.data.ending === 'cold') add(from, APPROVAL.jealousCold);
      break;
    }
    case 'circle-chat': for (const t of sc.data.theories || []) add(t.by, APPROVAL.theory); break;
    case 'blocking': {
      const t = sc.data.target;
      add(t, sc.data.reason === 'fake' && state.profiles[t].mode !== 'catfish' ? APPROVAL.wronglyBlocked : APPROVAL.blocked);
      for (const br of sc.data.betrayed || []) add(br.betrayer, APPROVAL.allianceBetrayal);
      break;
    }
    case 'report': add(sc.who[0], APPROVAL.visitLie); break;
    case 'welcome': if (sc.data.ending === 'warm' && sc.data.first) add(sc.who[0], APPROVAL.welcome); break;
    case 'group-chat':
      if (sc.data.event === 'kick' && !sc.data.right) add(sc.data.kicked, APPROVAL.wronglyKicked);
      if (sc.data.event === 'confront') add(sc.data.agent, APPROVAL.doubleAgent);
      break;
    case 'game': if (sc.data.prize?.kind === 'trophy') for (const w of sc.data.prize.to) add(w, APPROVAL.trophy); break;
    case 'visit': if (sc.data.kiss) for (const h of sc.who) add(h, APPROVAL.kiss); break;
    case 'goodbye': {
      const p = state.profiles[sc.who[0]];
      if (p.mode === 'catfish') add(sc.who[0], p.reason === 'strategic' ? APPROVAL.strategicReveal : APPROVAL.protectiveReveal);
      break;
    }
  }
  return out;
}

export function airDay(state) {
  for (const sc of state.scenes) {
    if (sc.day !== state.day || !sc.aired) continue;
    const ap = sceneApproval(state, sc);
    for (const h of sc.who) for (const n of peopleOf(state, h)) {
      recordAired(state.ledger, { who: n, approval: ap[h] || 0, fame: 1 });
    }
  }
  return closeEpisode(state.ledger, state.day, null);
}

/** The audience, for the record (the screens' Debug): approval -100..100, fame, the label. */
export function publicSnapshot(state) {
  const L = state.ledger;
  if (!L) return {};
  const out = {};
  for (const h of Object.keys(state.profiles)) {
    const ppl = peopleOf(state, h);
    const ap = ppl.reduce((s, n) => s + readApproval(L, n), 0) / Math.max(1, ppl.length);
    const fame = ppl.reduce((s, n) => s + (L.fame?.[n] || 0), 0);
    out[h] = { approval: Math.round(ap * 10) / 10, fame: Math.round(fame * 10) / 10, label: labelFor(ap) };
  }
  return out;
}

export function fanFavorite(state) {
  return Object.keys(state.people)
    .sort((a, b) => readApproval(state.ledger, b) - readApproval(state.ledger, a) || (a < b ? -1 : 1))[0];
}

/** The audience's pick among `pool`: the one exception where the audience
 *  decides something in the game, because the real show let it (UK 2 Ep 17,
 *  the public Super Influencer). season.js hands it to the night; no engine
 *  module reads the ledger. */
export function publicPick(state, pool = state.active) {
  const ap = h => peopleOf(state, h).reduce((s, n) => s + readApproval(state.ledger, n), 0) / Math.max(1, peopleOf(state, h).length);
  return [...pool].sort((a, b) => ap(b) - ap(a) || (a < b ? -1 : 1))[0];
}
