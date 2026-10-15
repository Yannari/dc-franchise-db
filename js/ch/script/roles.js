// ══════════════════════════════════════════════════════════════════════
// ch/script/roles.js — who plays which part in a scene, and how it ended
// ══════════════════════════════════════════════════════════════════════
//
// The engine records a scene as { kind, who: [...], data }. A pool line is
// written for parts — a (speaks first), b, c, d — and an ENDING the engine
// already decided (manual §19.2: the engine decides, the words describe).
// This table turns one into the other, per kind, so a line for "the one who
// called out" never lands on the one who was called.
//
// Slots a line may name besides the parts: {target}, {alliance}, {game},
// {gone}, {show_a}, {show_b}, {need}. A slot is filled only from the scene's
// own data; a line whose slot is empty is never picked (write.js).
import { SHOWS } from '../../shows.js';

const showName = slug => (slug && SHOWS[slug]?.name) || null;
const yes = (v, a, b) => (v ? a : b);

// kind → (scene, state) → { roles: {a,b,c,d}, ending, slots }
const COUNT_WORD = ['None', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

export const ROLES = {
  arrival: (sc, st) => {
    const r = sc.data.recognised?.[0];
    return r ? { roles: { a: r[0], b: r[1] }, ending: 'reunion', slots: { show_a: showName(st.origin[r[0]]) } }
      : { roles: { a: sc.who[0], b: sc.who[1] }, ending: 'strangers' };
  },
  'villa-reveal': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // a proposes, b is the name, c objects (with their own name when they have one), d backs a
  'house-debate': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2], d: sc.who[3] }, ending: sc.data.alt ? 'split' : 'one', slots: { alt: sc.data.alt } }),
  // the day of the Arena: a (going in) thinks the pick through with b, naming two people it could be
  'pick-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { opt1: sc.data.options?.[0], opt2: sc.data.options?.[1] } }),
  // the people who might be picked, waiting; {target} is the one picking
  'pick-guess': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any', slots: { target: sc.data.by } }),
  'after-vote': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.data.stung || undefined }, ending: sc.data.stung ? 'stung' : 'any', slots: { count: COUNT_WORD[sc.data.count] || String(sc.data.count) } }),
  daily: sc => ({ roles: { a: sc.data.winners[0], b: sc.data.winners[1], c: sc.data.last?.[0] }, ending: sc.data.mode,
    slots: { game: sc.data.dailyName } }),
  meeting: sc => {
    const r = sc.data.responses || {};
    const pick = ['refuses', 'false-yes', 'reluctant', 'yes'].map(x => Object.keys(r).find(k => r[k] === x)).find(Boolean);
    const ending = Object.values(r).includes('refuses') ? 'refusal' : Object.values(r).includes('reluctant') ? 'pushback'
      : Object.values(r).includes('false-yes') ? 'falseyes' : 'united';
    return { roles: { a: sc.data.organiser, b: pick, c: Object.keys(r).find(k => k !== sc.data.organiser && k !== pick) },
      ending, slots: { target: sc.data.target, alliance: sc.data.name, reason: sc.data.reasonKey } };
  },
  recruit: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.answer, slots: { target: sc.data.target } }),
  plea: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.moved, 'moved', 'held') }),
  'leverage-threat': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.bluff, 'bluff', 'credible') }),
  outing: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { alliance: sc.data.name } }),
  volunteer: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.who[1], 'targeted', 'open'), slots: { target: sc.who[1] } }),
  callout: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.reason }),
  arena: sc => ({ roles: { a: sc.data.winner, b: sc.data.loser }, ending: sc.data.tj, slots: { game: sc.data.gameName } }),
  return: sc => ({ roles: { a: sc.who[0], b: sc.who[1] },
    ending: sc.data.volunteered ? 'volunteered' : sc.data.calledOut ? 'calledout' : yes(sc.who[1], 'faced', 'quiet'), slots: { gone: sc.data.beat } }),
  // b is never a again: one relieved player alone gets the one-person scripts, not both halves of a
  // two-person exchange (season 777: "I slept better last night" / "Don't say that out loud", both Jake).
  'morning-after': sc => { const a = sc.data.hurt?.[0] || sc.who[0];
    return { roles: { a, b: [sc.data.hurt?.[1], ...(sc.data.relieved || [])].find(x => x && x !== a) },
    ending: sc.data.hurt?.length ? (sc.data.hurt.length > 1 ? 'mourning' : 'alone') : 'relief', slots: { gone: sc.data.gone } }; },
  quit: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  medical: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  disqualified: sc => ({ roles: { a: sc.who[1] }, ending: 'any', slots: { gone: sc.who[0] } }),
  'tj-house-meeting': sc => ({ roles: { a: sc.data.victim }, ending: 'any', slots: { gone: sc.data.gone } }),
  // ── the house ──
  prank: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.laughs, 'laughs', 'war') }),
  'kitchen-disaster': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.saved, 'saved', 'alone') }),
  'gym-flex': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'hot-tub-truths': sc => {
    // the one who answers a confession is a friend in the tub, never the person it's about
    const on = sc.data.slip?.on;
    const [a, ...rest] = sc.who;
    const others = rest.filter(n => n !== on);
    return { roles: { a, b: others[0], c: others[1] }, ending: sc.data.slip?.kind || 'none', slots: { target: on } };
  },
  'tj-at-breakfast': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'bunk-war': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.moved, 'moved', 'stuck') }),
  'show-banter': (sc, st) => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.ok, 'ok', 'sour'),
    slots: { show_a: showName(sc.data.a), show_b: showName(sc.data.b) } }),
  'rookie-hazing': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.plays, 'plays', 'refuses') }),
  'kitchen-blowup': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  receipts: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.owns ? 'owns' : sc.data.apology ? 'apology' : 'denies' }),
  'old-show-grudge': (sc, st) => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.settled, 'settled', 'reopened'),
    slots: { show_a: showName(st.origin[sc.who[0]]) } }),
  'trash-talk': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.bites, 'bites', 'shrugs') }),
  'floater-callout': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.firesBack, 'firesback', 'takes') }),
  'gossip-backfire': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.tells, 'told', 'kept') }),
  homesick: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.comforted, 'comforted', 'alone') }),
  jealousy: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.blowup, 'blowup', 'quiet') }),
  flirt: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.back, 'back', 'rebuffed') }),
  'beach-date': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  pda: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  'ex-in-the-house': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.rekindle, 'rekindle', 'cold') }),
  overheard: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'ride-to-the-final': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'loyalty-test': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.leaks, 'leaks', 'holds') }),
  'vet-mentors-rookie': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'scheme-lie': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.data.believed, 'believed', 'seen') }),
  // ── alliances, deals, romance ──
  'alliance-form': sc => ({ roles: { a: sc.data.leader, b: sc.who.find(x => x !== sc.data.leader), c: sc.who.filter(x => x !== sc.data.leader)[1] },
    ending: yes(sc.data.origin, 'sameshow', 'any'), slots: { alliance: sc.data.name } }),
  'alliance-grow': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { alliance: sc.data.name } }),
  'alliance-betrayal': sc => ({ roles: { a: sc.who[1], b: sc.who[0] }, ending: sc.data.how }),
  'alliance-leave': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  'alliance-end': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  'rookie-uprising': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  deal: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'deal-broken': sc => ({ roles: { a: sc.who[1], b: sc.who[0] }, ending: sc.data.how }),
  spark: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  showmance: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  breakup: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  apology: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: yes(sc.data.accepted, 'accepted', 'rejected') }),
  psyche: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.need, slots: { need: sc.data.need } }),
  // ── the daily, partners, the night before ──
  'throw-caught': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  throw: sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'daily-clutch': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'daily-choke': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'call-home': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'picked-last': sc => ({ roles: { a: sc.who[0], b: sc.data.by }, ending: 'any' }),
  'partner-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'partner-carried': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'team-blame': sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: yes(sc.who[2], 'defended', 'alone') }),
  'arena-eve-pep': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arena-eve-alone': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'arena-eve-confront': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.rattled === sc.who[1] ? 'rattled' : 'backfires' }),
  'vet-dismisses': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // the night out: the two who drank most lead it
  party: sc => {
    const top = Object.entries(sc.data.drink || {}).sort((x, y) => y[1] - x[1]).map(([n]) => n);
    return { roles: { a: top[0], b: top[1], c: top[2] }, ending: 'any' };
  },
  'partner-draw': sc => ({ roles: { a: sc.data.pairs?.[0]?.[0], b: sc.data.pairs?.[0]?.[1] }, ending: 'any' }),
  'partner-pick': sc => ({ roles: { a: sc.data.pairs?.[0]?.[0], b: sc.data.pairs?.[0]?.[1] }, ending: 'any' }),
  'meeting-spotted': (sc, st) => ({ roles: { a: sc.who[0], b: sc.data.present?.[0], c: sc.data.present?.[1] }, ending: 'any',
    slots: { alliance: st.alliances.find(x => x.id === sc.data.alliance)?.name } }),
  overnight: sc => ({ roles: { a: sc.who[0], b: sc.who[1], c: sc.who[2] }, ending: 'any' }),
  fight: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'fight-physical': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  // ── the vote, read out loud (ceremony.js builds these scenes) ──
  'cer-open': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.division === 'all' ? 'all' : sc.data.division }),
  ballot: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.why }),
  'cer-result': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.tie ? 'tie' : 'clear', slots: { count: sc.data.count } }),
  // ── the arcs (story/arcs.js): words only, read from the record ──
  'arc-payback': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arc-showdown': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'arc-beast': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { target: sc.data.target } }),
  'arc-beast-feared': sc => ({ roles: { a: sc.who[0] }, ending: 'any', slots: { target: sc.data.target } }),
  'arc-giant-falls': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any', slots: { gone: sc.data.gone } }),
  'arc-underdog': sc => ({ roles: { a: sc.who[0] }, ending: sc.data.how }),
  'run-name': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-snacks': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-protein': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-speech': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  'run-mirror': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: sc.data.stage }),
  // ── the final ──
  'final-start': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'instant-elimination': sc => ({ roles: { a: sc.data.winner, b: sc.who.find(x => x !== sc.data.winner) }, ending: 'any' }),
  'overnight-sabotage': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'overnight-quit': sc => ({ roles: { a: sc.who[0] }, ending: 'any' }),
  'final-pact-help': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  'final-pact-broken': sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
  champions: sc => ({ roles: { a: sc.who[0], b: sc.who[1] }, ending: 'any' }),
};

export function rolesOf(scene, state) {
  const f = ROLES[scene.kind];
  if (!f) return null;
  const r = f(scene, state);
  // Drop empty parts, so a line for c is never picked for a two-person scene.
  for (const k of Object.keys(r.roles)) if (!r.roles[k]) delete r.roles[k];
  // Everybody else in the conversation, in order, as x, y and z (the user, 2026-10-15: "we have group
  // conversations, trio, duo, quatuor and more"). A turn marked { opt: 1 } is theirs to say when they are
  // there and is dropped when they are not, so one conversation plays as a duo, a trio or a four.
  const taken = new Set(Object.values(r.roles));
  const rest = (scene.who || []).filter(n => n && n !== 'TJ' && !taken.has(n));
  ['x', 'y', 'z'].forEach((k, i) => { if (rest[i] && !r.roles[k]) r.roles[k] = rest[i]; });
  r.slots ||= {};
  for (const k of Object.keys(r.slots)) if (r.slots[k] == null) delete r.slots[k];
  return r;
}
