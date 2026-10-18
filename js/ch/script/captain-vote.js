// ══════════════════════════════════════════════════════════════════════
// ch/script/captain-vote.js — a team picks its captain, out loud
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-18: "we don't even see the votes of many people talking about it", and "it's super repetitive,
// we need personality". The captain scene (teams.js electCaptain) is written in four parts, the way the house vote
// is (ceremony.js): each candidate's pitch in their own style (a schemer's plan, a hero's promise to carry, a
// hothead's want to win, a wildcard's joke, a reluctant shrug); the outcome's own exchange (a clash, a fight, a
// concession); every ballot said out loud with its reason, then the count; and the aftermath. The outcome's pool
// marks where the pitches and the ballots go with a beat that says PITCHES or VOTE.
import { writeScene, transcript } from './write.js';

const PITCHES = 'PITCHES', VOTE = 'VOTE';
const NUM = ['', 'One', 'Two', 'Three', 'Four'];
const list = ns => ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`;
const beat = text => ({ kind: 'beat', by: null, text, voice: null });

// one piece, never an entry this vote has already used (thirteen ballots drawn from a pool repeat otherwise:
// "We've got each other's backs" twice in one vote, read 2026-10-18)
function part(state, scene, kind, who, data, used) {
  let first = null;
  for (let k = 0; k < 8; k++) {
    const sc = { id: `${kind}:${scene.id}:${who.join('>')}${k ? `#${k}` : ''}`, ep: scene.ep, day: scene.day, kind, who, data,
      seenBy: scene.seenBy, spot: scene.spot, snap: scene.snap };
    const s = writeScene(state, sc);
    if (!s) return [];
    first = first || s;
    if (!used.has(s.lineId)) { used.add(s.lineId); return s.lines; }
  }
  return first.lines;
}

export function writeCaptainVote(state, scene, script) {
  const d = scene?.data;
  if (!script || !d) return script;
  const used = new Set();
  const lines = [...script.lines];
  const at = text => lines.findIndex(l => l.kind === 'beat' && l.text === text);
  // the pitches: every candidate when there was a race (the frontrunner first, the way they stepped forward)
  const racing = (d.candidates || []).length > 1;
  const pitches = racing ? d.candidates.flatMap(c => part(state, scene, 'captain-pitch', [c], { pitch: d.pitches?.[c] || 'win', team: d.team }, used)) : [];
  const p = at(PITCHES);
  // the pitches open on who stepped up, unless the scene has just said so
  if (pitches.length && !(p > 0 && lines[p - 1].kind === 'beat')) pitches.unshift(beat(`${NUM[d.candidates.length] || 'Several'} people put their names up for captain of ${d.team}: ${list(d.candidates)}.`));
  if (p >= 0) lines.splice(p, 1, ...pitches);
  else if (pitches.length) lines.splice(Math.max(0, lines.findIndex(l => l.kind !== 'beat')), 0, ...pitches);
  // the ballots: the candidates' own votes in one line, then everybody else's, out loud; a supporter who has just
  // said "I'm with you" is not heard saying it twice
  const vote = at(VOTE);
  const spoke = new Set(lines.slice(0, vote < 0 ? lines.length : vote).filter(l => l.kind === 'say').map(l => l.by));
  const all = d.ballots || [];
  const selves = all.filter(b => b.why === 'self').map(b => b.voter);
  // three shrugs are heard; after that the ones who just say a name are told in one line (six "I don't mind"s in a
  // row, read 2026-10-18)
  let shrugs = 0;
  const quiet = [];
  const ballots = [
    ...(selves.length ? [beat(selves.length === 1 ? `${selves[0]} votes for ${selves[0]}.` : `${list(selves)} each vote for themselves.`)] : []),
    ...all.filter(b => b.why !== 'self' && !(b.voter === d.supporter && spoke.has(b.voter)))
      .flatMap(b => {
        if (b.why === 'shrug' && ++shrugs > 3) { quiet.push(b); return []; }
        return part(state, scene, 'captain-ballot', [b.voter, b.pick, ...(b.against ? [b.against] : [])], { why: b.why, team: d.team }, used);
      }),
  ];
  if (quiet.length) ballots.push(beat(quiet.length === 1 ? `${quiet[0].voter} says ${quiet[0].pick}.`
    : `${list(quiet.map(b => `${b.voter} says ${b.pick}`))}.`));
  const count = Object.entries(d.votes || {}).sort((x, y) => y[1] - x[1]);
  const tally = count.length > 1 ? [beat(`The count: ${count.map(([n, v]) => `${n} ${v}`).join(', ')}.`)] : [];
  const v = at(VOTE);
  if (v >= 0) lines.splice(v, 1, ...ballots, ...tally);
  else if (all.length) {
    const firstConf = lines.findIndex(l => l.kind === 'conf');
    lines.splice(firstConf < 0 ? lines.length : firstConf, 0, ...ballots, ...tally);
  }
  // a marker that found nothing to hold is never printed
  const out = lines.filter(l => !(l.kind === 'beat' && (l.text === PITCHES || l.text === VOTE)));
  return { ...script, lines: out, text: transcript(out) };
}
