// Family 3 of the scene catalogue: group rooms, three or more teams in one place
// (docs/ridonculous-race-scenes.md §3). The talk layer seats up to four people (ctx.people)
// from the teams present (ctx.present); `A`,`B` is the first team, `C`,`D` the second.
import { K, register } from './registry.js';
import { mayScheme } from '../state.js';

// the seated people (talk.js seats up to four); the first is the one the scene is about
const seat = c => (c.people?.length ? c.people : [c.A, c.B, c.C, c.D].filter(Boolean));
const first = c => seat(c)[0];
const second = c => seat(c)[1] || seat(c)[0];
const across = c => seat(c).find(n => n !== first(c) && ![c.state.teams[c.tid]?.a, c.state.teams[c.tid]?.b].includes(n)) || second(c);
const all = c => (c.present || []).filter(id => c.state.teams[id]);
const everyone = (c, fn) => { for (const id of all(c)) for (const n of [c.state.teams[id].a, c.state.teams[id].b]) fn(n, id); };
const pairsTeams = (fx, c, d) => { const ids = all(c); for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) fx.teams(ids[i], ids[j], d); };

register([
  K({ id: 'airport-crowd', family: 3, cast: 'group', moments: ['airport'], endings: {
    scramble: { w: 2, fx: (fx, c) => { fx.time(c.tid, 5); fx.mind(first(c), 'stress', 4); } },
    cooperate: { w: c => (c.allied() ? 2 : 0.4), fx: (fx, c) => fx.teams(c.tid, c.oid, 0.5) },
    // a lie is a scheme: only somebody who may scheme tells it (CLAUDE.md archetype rules)
    'lie-about-flight': { w: c => (!mayScheme(first(c)) ? 0 : c.rivalry() ? 1 : 0.2), fx: (fx, c) => fx.believe([c.C, c.D], { about: 'flight', claim: 'next', value: 'later', truth: false, source: c.tid }) },
  } }),
  K({ id: 'plane-row', family: 3, cast: 'group', moments: ['plane'], endings: {
    'seatmates-talk': { w: 2, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    'sleep-talk': { w: 0.5, fx: (fx, c) => fx.believe(seat(c).filter(n => n !== first(c)), { about: first(c), claim: 'said-in-sleep', value: true }) },
    plot: { w: c => c.S(first(c), 'strategic') / 6, fx: (fx, c) => fx.note(`plot:${c.tid}`, c.state.leg) },
    'fear-of-flying': { w: c => (10 - c.S(first(c), 'boldness')) / 10, fx: (fx, c) => fx.bond(first(c), second(c), 0.5) },
  } }),
  K({ id: 'bus-ride', family: 3, cast: 'group', moments: ['bus'], endings: {
    'lead-lost': { w: c => (c.rank(c.tid) < 0.3 ? 2 : 0.5), fx: (fx, c) => fx.mind(first(c), 'morale', -5) },
    games: { w: 1, fx: (fx, c) => pairsTeams(fx, c, 0.5) },
    squabble: { w: c => (10 - c.S(first(c), 'temperament')) / 8, fx: (fx, c) => fx.bond(first(c), second(c), -0.5) },
  } }),
  K({ id: 'closed-for-night', family: 3, cast: 'group', moments: ['closed'], endings: {
    campfire: { w: 2, fx: (fx, c) => pairsTeams(fx, c, 0.5) },
    'secret-meeting': { w: c => c.S(first(c), 'strategic') / 5, fx: (fx, c) => fx.ally(c.tid, c.oid) },
    'cant-sleep': { w: 1, fx: (fx, c) => seat(c).forEach(n => fx.mind(n, 'energy', -10)) },
    prank: { w: c => (c.rivalry() ? 0.6 : 0.1), fx: (fx, c) => { fx.rivalry(c.tid, c.oid, 1); fx.mind(across(c), 'energy', -10); } },
  } }),
  K({ id: 'queue-crowd', family: 3, cast: 'group', moments: ['queue'], endings: {
    banter: { w: 2, fx: (fx, c) => pairsTeams(fx, c, 0.3) },
    'bottleneck-fury': { w: 1, fx: (fx, c) => seat(c).forEach(n => fx.mind(n, 'stress', 5)) },
    'who-goes-next': { w: 0.7, fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
  } }),
  K({ id: 'watching-together', family: 3, cast: 'group', moments: ['watching'], endings: {
    'cheer-a-rival': { w: c => c.S(first(c), 'social') / 5, fx: (fx, c) => fx.teams(c.tid, c.oid, 1) },
    heckle: { w: c => (c.rivalry() ? 1.5 : 0.2), fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
    'learn-from-it': { w: c => c.S(first(c), 'intuition') / 5, fx: (fx, c) => fx.pass(c.tid, 0.1) },
  } }),
  K({ id: 'mat-crowd', family: 3, cast: 'group', moments: ['mat-crowd'], endings: {
    applause: { w: 2, fx: (fx, c) => fx.mind(first(c), 'morale', 3) },
    // the crowd boos a team that was caught messing with others, and nobody else
    boos: { w: c => ((c.state.rec[c.tid]?.caught || 0) > 0 ? 3 : 0), fx: (fx, c) => { fx.mind(first(c), 'morale', -5); fx.pop(first(c), -1); } },
    relief: { w: c => (c.allied() ? 2 : 0.5), fx: (fx, c) => fx.teams(c.tid, c.oid, 0.5) },
  } }),
  K({ id: 'superteam-pick', family: 3, cast: 'group', moments: ['superteam'], endings: {
    chosen: { w: c => 1 + Math.max(0, c.teamBond()) / 3, fx: (fx, c) => { fx.teams(c.tid, c.oid, 1); fx.ally(c.tid, c.oid); } },
    'left-over': { w: 0.5, fx: (fx, c) => fx.mind(first(c), 'morale', -5) },
    'forced-with-enemies': { w: c => (c.rivalry() ? 2 : 0.2), fx: (fx, c) => fx.rivalry(c.tid, c.oid, 1) },
  } }),
]);
