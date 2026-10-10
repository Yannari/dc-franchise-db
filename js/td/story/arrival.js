// ══════════════════════════════════════════════════════════════════════
// td/story/arrival.js — episode one's arrivals as small scenes
// ══════════════════════════════════════════════════════════════════════
//
// twists.js generateDockArrivals decides who comes and in what order; this writes what is said,
// from the same pools and voices as the camp (lines/n-arrival.js). Each arrival is:
//   the host's introduction ('arrive.host.<archetype>'): who they are, by archetype, stats, age;
//   their entrance ('arrive.new.<archetype>' / 'arrive.back.<archetype>');
//   a moment with somebody already waiting (everyone after the first gets one; the user,
//     2026-10-08: "they should interact during arrivals"), the first reason that applies:
//     a shared past (historyOf: siblings, exes, the one who blindsided them), a first-timer who
//     watched a returnee, the archetypes' chemistry the engine chose (DOCK_CHEMISTRY_PAIRS), or a
//     plain first hello in the tone the two voices make ('arrive.meet.greet.<tone>'). The one who
//     reacts is whoever on the dock has said least so far, so everybody waiting gets a turn; now
//     and then a second person joins in (c);
//   every few arrivals, the people waiting talk among themselves about who has shown up
//     ('arrive.wait').
// Words only: nothing here moves a bond or a vote.
import { writeStory } from './write.js';
import { historyOf } from './director.js';
import { voiceOf } from './voice.js';
import { factsFor } from '../script/facts.js';

const LANDING = { 'hosted-camp': 'the dock', 'film-lot': 'the backlot', 'world-tour': 'the runway', 'survival-island': 'the beach', carnival: 'the gate' };

// the tone of a first hello between two strangers, from the strongest voices on either side
function toneOf(a, b) {
  const va = voiceOf(a).slice(0, 4), vb = voiceOf(b).slice(0, 4);
  const either = t => va.includes(t) || vb.includes(t);
  if (either('flirty')) return 'flirt';
  if (either('cruel') || (va.includes('dry') && vb.includes('dry'))) return 'snark';
  if (either('anxious') || either('nerdy')) return 'awkward';
  if (either('loud') || either('goofy') || either('chaotic') || either('theatrical')) return 'hype';
  if (either('competitive') || either('tough')) return 'size';
  if (either('warm') || either('earnest')) return 'friendly';
  return 'plain';
}

/** state: { spoke: { name: lines } } shared across one arrival day. */
export function writeArrival({ ep, p, n, host, onDock, chem, venue, state = { spoke: {} } }) {
  const name = p.name;
  const landing = LANDING[venue] || 'the dock';
  const lines = [];
  const add = w => {
    if (!w) return w;
    lines.push(...w.lines.map(l => ({ kind: l.kind, by: l.by, text: l.text })));
    for (const l of w.lines) if (l.by) state.spoke[l.by] = (state.spoke[l.by] || 0) + 1;
    return w;
  };
  // the authored hometown and job, when the character has them ({home}, {job})
  const home = p.hometown || null, job = p.occupation || null;
  const base = (who, extra = {}) => ({ ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), venue, voteYet: false, returnee: !!p.isReturnee, home: !!home, job: !!job, ...extra });
  const ctx = k => ({ ep: ep.num, camp: 'arrival', phase: 'pre', n: n * 10 + k, place: 'public', noSetup: true });
  const data = { landing, ...(home ? { home } : {}), ...(job ? { job } : {}) };
  const quiet = list => [...list].sort((x, y) => (state.spoke[x.name] || 0) - (state.spoke[y.name] || 0) || x.name.localeCompare(y.name));

  // the host's introduction, then their entrance
  // a returnee is introduced as somebody the host already knows (lines/n-returnee.js arrive.hostback): 'meet {a}' is for strangers
  add(writeStory(p.isReturnee ? 'arrive.hostback' : 'arrive.host', 'any', { a: name, h: host }, data, base({ a: name }), ctx(1)));
  add(writeStory(p.isReturnee ? 'arrive.back' : 'arrive.new', 'any', { a: name, h: host }, data, base({ a: name }), ctx(2)));

  // somebody already waiting: the first reason that applies
  let meet = null;
  const known = onDock.map(d => [d, historyOf(name, d.name)]).find(([, h]) => h.facts.hist !== 'none');
  if (known) {
    const [d, h] = known;
    meet = { b: d.name, key: 'arrive.meet.history', ending: h.facts.hist, data: { ...data, ...h.data }, facts: { hist: h.facts.hist } };
  } else if (!p.isReturnee && onDock.some(d => d.isReturnee)) {
    meet = { b: quiet(onDock.filter(d => d.isReturnee))[0].name, key: 'arrive.meet', ending: 'fan-of-them', data, facts: {} };
  } else if (p.isReturnee && onDock.some(d => !d.isReturnee) && n % 2 === 0) {
    meet = { b: quiet(onDock.filter(d => !d.isReturnee))[0].name, key: 'arrive.meet', ending: 'fan', data, facts: {} };
  } else if (chem) {
    meet = { b: chem.reactor, key: 'arrive.meet', ending: chem.chemType, data, facts: {} };
  } else if (onDock.length) {
    const b = quiet(onDock)[0].name;
    meet = { b, key: 'arrive.meet.greet', ending: toneOf(name, b), data, facts: {} };
  }
  let reaction = null;
  if (meet) {
    // now and then a second person on the dock joins in
    const c = onDock.length >= 4 && n % 3 === 0 ? quiet(onDock.filter(d => d.name !== meet.b))[0]?.name || null : null;
    const who = { a: name, b: meet.b, h: host, ...(c ? { c } : {}) };
    const w = add(writeStory(meet.key, meet.ending, who, meet.data, base(who, { ...meet.facts, returneeB: !!onDock.find(d => d.name === meet.b)?.isReturnee }), ctx(3)));
    if (w) reaction = { reactor: meet.b, text: (w.lines.find(l => l.by === meet.b) || {}).text || '', chemType: meet.ending };
  }

  // every few arrivals, the people waiting talk about who has shown up so far
  if (n > 0 && n % 4 === 3 && onDock.length >= 3) {
    const [a2, b2, c2, d2] = quiet(onDock.filter(d => d.name !== meet?.b));
    if (a2 && b2 && c2) {
      const who = { a: a2.name, b: b2.name, c: c2.name, ...(d2 ? { d: d2.name } : {}) };
      add(writeStory('arrive.wait', 'any', who, { ...data, latest: name }, base(who), ctx(4)));
    }
  }
  if (!lines.length) return null;
  return {
    lines,
    hostLine: (lines.find(l => l.by === host) || {}).text || '',
    playerLine: (lines.find(l => l.by === name && l.kind === 'say') || {}).text || '',
    dockReaction: reaction,
  };
}
