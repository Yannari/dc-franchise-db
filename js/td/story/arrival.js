// ══════════════════════════════════════════════════════════════════════
// td/story/arrival.js — episode one's arrivals as small scenes
// ══════════════════════════════════════════════════════════════════════
//
// twists.js generateDockArrivals decides who comes and in what order; this writes what is said,
// from the same pools and voices as the camp (lines/n-arrival.js). Each arrival is:
//   the host's introduction ('arrive.host.<archetype>'): who they are, by archetype, stats, age;
//   their entrance ('arrive.new.<archetype>' / 'arrive.back.<archetype>'): a first-timer meeting
//     the place and the host, a returnee coming back;
//   a moment with someone already waiting ('arrive.meet.<kind>'), when there is a reason for one:
//     a shared past first (siblings, exes, the one who blindsided them: historyOf), then a fan
//     meeting a returnee they watched, then the archetypes' chemistry (DOCK_CHEMISTRY_PAIRS).
// Words only: nothing here moves a bond or a vote.
import { writeStory } from './write.js';
import { historyOf } from './director.js';
import { factsFor } from '../script/facts.js';

const LANDING = { 'hosted-camp': 'the dock', 'film-lot': 'the backlot', 'world-tour': 'the runway', 'survival-island': 'the beach', carnival: 'the gate' };

/** The scene for one arrival: { lines, hostLine, playerLine, dockReaction } or null. */
export function writeArrival({ ep, p, n, host, onDock, chem, venue }) {
  const name = p.name;
  const landing = LANDING[venue] || 'the dock';
  const lines = [];
  const add = w => { if (w) lines.push(...w.lines.map(l => ({ kind: l.kind, by: l.by, text: l.text }))); return w; };
  const base = (who, extra = {}) => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet: false, returnee: !!p.isReturnee, ...extra });
  const ctx = k => ({ ep: ep.num, camp: 'arrival', phase: 'pre', n: n * 10 + k, place: 'public' });
  const arch = p.archetype || 'floater';
  const data = { landing };

  // the host's introduction, then their entrance
  add(writeStory('arrive.host', arch, { a: name, h: host }, data, base({ a: name }), ctx(1)));
  add(writeStory(p.isReturnee ? 'arrive.back' : 'arrive.new', arch, { a: name, h: host }, data, base({ a: name }), ctx(2)));

  // someone already waiting, when there is a reason
  let meet = null;
  const known = onDock.map(d => [d, historyOf(name, d.name)]).find(([, h]) => h.facts.hist !== 'none');
  if (known) {
    const [d, h] = known;
    meet = { b: d.name, key: `arrive.meet.history`, ending: h.facts.hist, data: { ...data, ...h.data }, facts: { hist: h.facts.hist } };
  } else if (!p.isReturnee && onDock.some(d => d.isReturnee)) {
    meet = { b: onDock.find(d => d.isReturnee).name, key: 'arrive.meet', ending: 'fan-of-them', data, facts: {} };
  } else if (p.isReturnee && onDock.some(d => !d.isReturnee) && n % 3 === 0) {
    meet = { b: onDock.find(d => !d.isReturnee).name, key: 'arrive.meet', ending: 'fan', data, facts: {} };
  } else if (chem) {
    meet = { b: chem.reactor, key: 'arrive.meet', ending: chem.chemType, data, facts: {} };
  }
  let reaction = null;
  if (meet) {
    const who = { a: name, b: meet.b, h: host };
    const w = add(writeStory(meet.key, meet.ending, who, meet.data, base(who, { ...meet.facts, returneeB: !!onDock.find(d => d.name === meet.b)?.isReturnee }), ctx(3)));
    if (w) reaction = { reactor: meet.b, text: (w.lines.find(l => l.by === meet.b) || {}).text || '', chemType: meet.ending };
  }
  if (!lines.length) return null;
  return {
    lines,
    hostLine: (lines.find(l => l.by === host) || {}).text || '',
    playerLine: (lines.find(l => l.by === name && l.kind === 'say') || {}).text || '',
    dockReaction: reaction,
  };
}
