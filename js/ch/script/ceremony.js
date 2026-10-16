// ══════════════════════════════════════════════════════════════════════
// ch/script/ceremony.js — the vote, read out loud
// ══════════════════════════════════════════════════════════════════════
//
// On The Challenge the vote is not secret: TJ asks each player, in front of
// everybody, and they say the name and why. Every voter is shown (the user's
// rule for a reading: show every voter), and the reason is the engine's
// (vote.js: the plan, kept their word, their own read, a false yes, broke
// from the plan, changed their mind). The words are picked from the ballot
// pools with the voter as `a` and the name as `b`.
//
// Ballots carry their own bond at the vote (vote.js), so a reading replayed
// later never reads feelings from after it.
import { writeScene } from './write.js';

const WHY = {
  'the plan': 'plan', 'kept their word': 'word', 'own read': 'own', 'false yes': 'falseyes',
  'broke from the plan': 'broke', 'changed their mind': 'changed',
};

function synthetic(state, ep, day, kind, who, data, bond) {
  return { id: `${kind}:${ep}:${who.join('>')}`, ep, day, kind, who, data, seenBy: state.cast, spot: 'deliberation',
    snap: { bond, house: data.house } };
}

export function writeVote(state, epRec, vote, day) {
  const out = [];
  const house = vote.ballots.length;
  const open = writeScene(state, synthetic(state, epRec.ep, day, 'cer-open', [vote.ballots[0]?.voter], { house, division: epRec.division }, 0));
  if (open) out.push({ kind: 'cer-open', script: open });
  for (const b of vote.ballots) {
    const sc = synthetic(state, epRec.ep, day, 'ballot', [b.voter, b.target], { why: WHY[b.why] || 'own', flip: b.flip, house }, b.bond);
    const w = writeScene(state, sc);
    out.push({ kind: 'ballot', voter: b.voter, target: b.target, why: b.why, script: w });
  }
  const tally = Object.entries(vote.tally).sort((x, y) => y[1] - x[1]);
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three'];
  const res = vote.tribunal
    ? writeScene(state, synthetic(state, epRec.ep, day, 'cer-nominees', vote.tribunal.nominees, { house, tribunal: vote.tribunal.tribunal }, 0))
    : writeScene(state, synthetic(state, epRec.ep, day, 'cer-result', [vote.votedIn],
      { count: WORDS[tally[0][1]] || String(tally[0][1]), tie: !!vote.tiebreak, house }, 0));
  if (res) out.push({ kind: 'cer-result', script: res });
  return out;
}

export { WHY };
