// ══════════════════════════════════════════════════════════════════════
// ci/public.js — what the audience thinks, from what aired (spec §16)
// ══════════════════════════════════════════════════════════════════════
//
// Perfect Match's two ledgers, IMPORTED (js/pm/ledger.js): approval (-100..100)
// and fame (never falls). The only file under js/ci/ allowed to touch them —
// no player's decision may read the public (tests/ci-guards.test.js).
import { createLedger, noteArrival, recordAired, closeEpisode, readApproval } from '../pm/ledger.js';
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
      break;
    }
    case 'circle-chat': for (const t of sc.data.theories || []) add(t.by, APPROVAL.theory); break;
    case 'blocking': {
      const t = sc.data.target;
      add(t, sc.data.reason === 'fake' && state.profiles[t].mode !== 'catfish' ? APPROVAL.wronglyBlocked : APPROVAL.blocked);
      break;
    }
    case 'report': add(sc.who[0], APPROVAL.visitLie); break;
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

export function fanFavorite(state) {
  return Object.keys(state.people)
    .sort((a, b) => readApproval(state.ledger, b) - readApproval(state.ledger, a) || (a < b ? -1 : 1))[0];
}
