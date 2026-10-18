// Family 2 of the scene catalogue: two teams at one place (docs/ridonculous-race-scenes.md §2).
// Offered by the talk layer whenever two teams overlap (moment 'overlap'); console also at the mat.
// `A`,`B` are the team at the centre (the one arriving), `C`,`D` the team already there.
import { K, register } from './registry.js';
import { archetypeOf } from '../state.js';

const lead = (c, id) => c.state.lead[id];
const otherFails = c => c.state.attempts?.[c.oid]?.[c.stretch?.id]?.fails || 0;
const firstMeet = c => c.state.seen?.[c.tid]?.[c.oid]?.leg !== c.state.leg;
const hasDeal = c => (c.state.deals || []).some(d => !d.done && ((d.a === c.tid && d.b === c.oid) || (d.a === c.oid && d.b === c.tid)));
const hero = (c, n) => ['hero', 'loyal-soldier', 'social-butterfly'].includes(archetypeOf(n));

register([
  K({ id: 'size-up', family: 2, cast: 'teams', moments: ['overlap'], when: c => ((c.firstMeet ?? firstMeet(c)) ? 1 : 0), endings: {
    friendly: { w: c => c.S(c.lead, 'social') / 3, fx: (fx, c) => fx.teams(c.tid, c.oid, 0.5) },
    wary: { w: c => c.S(c.lead, 'strategic') / 3, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'threat', value: true }) },
    dismissive: { w: c => (c.friction() ? 2 : 0.3), fx: (fx, c) => fx.teams(c.tid, c.oid, -0.5) },
  } }),
  K({ id: 'small-talk', family: 2, cast: 'teams', moments: ['overlap'], when: c => (Math.max(c.stress(c.A), c.stress(c.C)) < 50 ? 0.8 : 0.2), endings: {
    click: { w: c => (c.S(c.A, 'social') + c.S(c.C, 'social')) / 8, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    awkward: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -1) },
    overshare: { w: 0.6, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.C, claim: 'backstory', value: true }) },
  } }),
  K({ id: 'queue-jump', family: 2, cast: 'teams', moments: ['overlap'], when: c => (c.stretch?.capacity ? 0.3 : 0), endings: {
    allowed: { w: c => Math.max(0.2, 1 + c.teamBond() / 3), fx: (fx, c) => fx.teams(c.tid, c.oid, 0.2) },
    'called-out': { w: 1, fx: (fx, c) => { fx.teams(c.tid, c.oid, -1); fx.rivalry(c.tid, c.oid, 1); } },
    fight: { w: c => (10 - c.S(c.A, 'temperament')) / 8, fx: (fx, c) => { fx.time(c.tid, 5); fx.time(c.oid, 5); } },
  } }),
  K({ id: 'alliance-pitch', family: 2, cast: 'teams', moments: ['overlap'], when: c => (!c.allied() && c.S(c.lead, 'strategic') >= 6 ? 0.15 * c.S(c.lead, 'strategic') / 10 : 0), endings: {
    accepted: { w: c => Math.max(0.2, 1 + c.teamBond() / 3), fx: (fx, c) => fx.ally(c.tid, c.oid) },
    refused: { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, -0.3) },
    trial: { w: 0.6, fx: (fx, c) => { fx.ally(c.tid, c.oid); fx.note(`trial:${c.tid}|${c.oid}`, c.state.leg); } },
    'laughed-off': { w: c => (c.friction() ? 1 : 0.2), fx: (fx, c) => fx.mind(c.lead, 'morale', -3) },
  } }),
  K({ id: 'alliance-check', family: 2, cast: 'teams', moments: ['overlap'], when: c => (c.allied() ? 0.3 : 0), endings: {
    solid: { w: c => 1 + c.teamBond() / 3, fx: (fx, c) => fx.teams(c.tid, c.oid, 0.5) },
    doubts: { w: c => c.S(c.lead, 'intuition') / 6, fx: (fx, c) => fx.believe([c.A, c.B], { about: c.oid, claim: 'loyal', value: false }) },
    test: { w: 0.5, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.3); fx.time(c.tid, 3); } },
  } }),
  K({ id: 'alliance-betrayal', family: 2, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (c.allied() && c.rank(c.tid) < 0.6 ? 0.03 : 0), endings: {
    discovered: { w: c => c.S(c.C, 'intuition') / 5, fx: (fx, c) => { fx.teams(c.tid, c.oid, -3); fx.rivalry(c.tid, c.oid, 2); fx.unally(c.tid, c.oid); fx.pop(c.A, -2); } },
    hidden: { w: 1, fx: (fx, c) => { fx.believe([c.A, c.B], { about: c.oid, claim: 'betrayed', value: true }); fx.time(c.oid, 10); } },
  } }),
  K({ id: 'deal', family: 2, cast: 'teams', moments: ['overlap'], when: c => (otherFails(c) >= 1 || c.money(c.oid) < 30 ? 0.15 : 0), endings: {
    struck: { w: c => 1 + c.teamBond() / 4, fx: (fx, c) => { (c.state.deals ||= []).push({ a: c.tid, b: c.oid, leg: c.state.leg, done: false }); fx.owe(c.oid, c.tid); fx.time(c.oid, -10); } },
    refused: { w: 1, fx: (fx, c) => fx.teams(c.tid, c.oid, -0.3) },
  } }),
  K({ id: 'deal-broken', family: 2, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (hasDeal(c) ? 0.2 : 0), endings: {
    'walk-away': { w: 1, fx: (fx, c) => { for (const d of c.state.deals || []) if ((d.a === c.oid && d.b === c.tid) || (d.a === c.tid && d.b === c.oid)) d.done = 'broken'; fx.teams(c.tid, c.oid, -3); fx.rivalry(c.tid, c.oid, 2); fx.pop(c.A, -2); } },
    'thinks-twice': { w: c => c.S(c.A, 'loyalty') / 5, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.3); fx.mind(c.A, 'stress', 3); } },
  } }),
  K({ id: 'trash-talk', family: 2, cast: 'teams', moments: ['overlap'], when: c => (c.rivalry() >= 1 || c.friction() || c.teamBond() <= -2 ? 0.5 : 0), endings: {
    exchange: { w: 1, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.mind(c.A, 'morale', 3); fx.mind(c.C, 'morale', -3); } },
    'one-sided': { w: c => (10 - c.S(c.C, 'boldness')) / 6, fx: (fx, c) => fx.mind(c.C, 'morale', -3) },
    escalates: { w: c => (10 - c.S(c.A, 'temperament')) / 8, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
  }, next: { escalates: 'shove' } }),
  K({ id: 'gloat', family: 2, cast: 'teams', moments: ['overlap', 'mat'], when: c => (c.rivalry() >= 1 || c.friction() ? 0.2 : 0.02), endings: {
    'rubbed-in': { w: c => c.S(c.A, 'boldness') / 5, fx: (fx, c) => { fx.mind(c.C, 'morale', -5); fx.rivalry(c.tid, c.oid, 1); } },
    backfires: { w: 0.5, fx: (fx, c) => fx.time(c.tid, 5) },
  } }),
  K({ id: 'shove', family: 2, cast: 'teams', scheme: true, moments: ['overlap'], when: c => (c.rivalry() >= 2 ? 0.1 * (10 - c.S(c.A, 'temperament')) / 10 : 0), endings: {
    shove: { w: 1, fx: (fx, c) => { fx.time(c.oid, 10); fx.time(c.tid, 5); fx.rivalry(c.tid, c.oid, 2); } },
    'held-back': { w: c => c.S(c.B, 'temperament') / 5, fx: (fx, c) => fx.bond(c.A, c.B, 0.3) },
  } }),
  K({ id: 'help-offer', family: 2, cast: 'teams', moments: ['overlap'], when: c => (otherFails(c) >= 2 ? Math.max(0, c.teamBond() + 3) * 0.1 * (hero(c, c.A) ? 2 : 1) : 0), endings: {
    accepted: { w: 2, fx: (fx, c) => { fx.time(c.tid, 10); fx.time(c.oid, -15); fx.owe(c.oid, c.tid); fx.teams(c.tid, c.oid, 1.5); fx.pop(c.A, 2); c.state.rec[c.tid].helped++; } },
    refused: { w: c => c.S(c.C, 'boldness') / 6, fx: (fx, c) => fx.mind(c.C, 'stress', 3) },
    'rejected-rudely': { w: c => (c.rivalry() ? 1 : 0.2), fx: (fx, c) => fx.teams(c.tid, c.oid, -1) },
  } }),
  K({ id: 'rescue', family: 2, cast: 'teams', moments: ['overlap'], when: c => ((c.stretch?.types || []).some(t => ['nerve', 'water', 'heights'].includes(t)) && otherFails(c) >= 2 ? 0.05 : 0), endings: {
    saves: { w: 2, fx: (fx, c) => { fx.time(c.tid, 20); fx.time(c.oid, -20); fx.owe(c.oid, c.tid); fx.teams(c.tid, c.oid, 2); fx.pop(c.A, 3); c.state.rec[c.tid].helped++; } },
    'both-stuck': { w: 1, fx: (fx, c) => { fx.time(c.tid, 20); fx.time(c.oid, 20); fx.teams(c.tid, c.oid, 1); } },
  } }),
  K({ id: 'mentor', family: 2, cast: 'teams', moments: ['overlap'], when: c => (c.state.teams[c.tid].rel === 'parent-child' || c.state.teams[c.oid].rel === 'parent-child' ? 0.05 : 0.01), endings: {
    advice: { w: 2, fx: (fx, c) => { fx.teams(c.tid, c.oid, 1); fx.pass(c.oid, 0.05); } },
    'bad-advice': { w: 1, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.5); fx.time(c.oid, 5); } },
  } }),
  K({ id: 'tug-of-war', family: 2, cast: 'teams', moments: ['overlap'], when: c => ((c.stretch?.types || []).some(t => ['search', 'hands'].includes(t)) ? 0.1 : 0), endings: {
    win: { w: c => c.S(c.A, 'physical') / 5, fx: (fx, c) => { fx.time(c.tid, -5); fx.time(c.oid, 10); fx.rivalry(c.tid, c.oid, 1); } },
    lose: { w: c => c.S(c.C, 'physical') / 5, fx: (fx, c) => { fx.time(c.tid, 10); fx.rivalry(c.tid, c.oid, 1); } },
    share: { w: c => Math.max(0.1, 1 + c.teamBond() / 3), fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    'third-team-takes-it': { w: 0.3, fx: (fx, c) => { fx.time(c.tid, 10); fx.time(c.oid, 10); } },
  } }),
  K({ id: 'collision', family: 2, cast: 'teams', moments: ['overlap'], when: c => (['drive', 'taxi', 'foot', 'boat'].includes(c.stretch?.mode) ? 0.05 : 0), endings: {
    crash: { w: 1, fx: (fx, c) => { fx.time(c.tid, 8); fx.time(c.oid, 8); } },
    apology: { w: c => c.S(c.A, 'social') / 5, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.5); fx.time(c.tid, 3); fx.time(c.oid, 3); } },
    blame: { w: c => (c.rivalry() ? 1.5 : 0.5), fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.time(c.tid, 5); fx.time(c.oid, 5); } },
  } }),
  K({ id: 'accusation', family: 2, cast: 'teams', moments: ['overlap', 'mat'], when: c => (c.state.sabotaged?.[c.tid]?.leg === c.state.leg && !c.state.sabotaged[c.tid].seen ? 0.5 : 0), endings: {
    right: { w: c => (c.state.sabotaged[c.tid]?.by === c.oid ? 3 : 0.2), fx: (fx, c) => fx.rivalry(c.tid, c.oid, 2) },
    wrong: { w: c => (c.state.sabotaged[c.tid]?.by === c.oid ? 0.2 : 2), fx: (fx, c) => { fx.teams(c.tid, c.oid, -2); fx.rivalry(c.tid, c.oid, 1); } },
  } }),
  K({ id: 'confront', family: 2, cast: 'teams', moments: ['overlap', 'mat'], when: c => (c.state.sabotaged?.[c.tid]?.by === c.oid && c.state.sabotaged[c.tid].seen && c.state.sabotaged[c.tid].leg >= c.state.leg - 1 ? 1 : 0), endings: {
    denied: { w: 1, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
    admitted: { w: c => c.S(c.C, 'loyalty') / 5, fx: (fx, c) => fx.teams(c.tid, c.oid, -1) },
    'revenge-vowed': { w: c => c.S(c.A, 'boldness') / 5, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 2); fx.note(`revenge:${c.tid}|${c.oid}`, c.state.leg); } },
  } }),
  K({ id: 'tag-along', family: 2, cast: 'teams', moments: ['separate'], endings: {
    welcomed: { w: 2, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    awkward: { w: 1, fx: (fx, c) => fx.mind(c.A, 'morale', -2) },
  } }),
  K({ id: 'follow', family: 2, cast: 'teams', moments: ['overlap'], when: c => (c.stretch?.kind === 'travel' && c.stretch?.mode !== 'flight' ? 0.1 * (10 - c.S(c.lead, 'intuition')) / 10 : 0), endings: {
    'follows-right': { w: c => c.S(lead(c, c.oid), 'intuition') / 5, fx: (fx, c) => { fx.time(c.tid, -5); fx.believe([c.A, c.B], { about: c.oid, claim: 'knows-the-way', value: true }); } },
    'follows-wrong': { w: c => (10 - c.S(lead(c, c.oid), 'intuition')) / 5, fx: (fx, c) => fx.time(c.tid, 25) },
  } }),
  K({ id: 'mock-the-struggle', family: 2, cast: 'teams', moments: ['overlap'], when: c => (otherFails(c) >= 2 && (c.rivalry() || c.friction()) ? 0.2 : 0), endings: {
    laugh: { w: c => (10 - c.S(c.A, 'loyalty')) / 5, fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.mind(c.C, 'stress', 5); } },
    sympathy: { w: c => c.S(c.A, 'social') / 5, fx: (fx, c) => fx.teams(c.tid, c.oid, 0.5) },
  } }),
  K({ id: 'console', family: 2, cast: 'teams', moments: ['mat'], when: c => (c.event?.consoleTarget === c.oid ? 1 : 0), endings: {
    kind: { w: c => 1 + Math.max(0, c.teamBond()) / 3, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    clumsy: { w: 0.5, fx: (fx, c) => { fx.teams(c.tid, c.oid, 0.2); fx.mind(c.C, 'morale', -1); } },
  } }),
]);
