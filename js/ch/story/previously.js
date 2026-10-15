// ══════════════════════════════════════════════════════════════════════
// ch/story/previously.js — "Previously on The Challenge..."
// ══════════════════════════════════════════════════════════════════════
//
// TJ opens every episode after the first with what happened last time, in
// his own voice. Every clause comes from the record and names its subject the
// right way round (manual §19.2 step 8): who went into the Arena and who they
// called out, who won it and who went home, and the biggest story the last
// episode AIRED — a betrayal, a new couple, a fight that got somebody sent
// home, a quit. Nothing that did not air is recapped: the viewer was never
// shown it.
import { stableRng } from '../../script/rng.js';
import { pronouns } from '../../players.js';

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

export function previouslyFor(state, prev) {
  if (!prev) return null;
  const rng = stableRng(state.seed, 'previously', prev.ep);
  const lines = [];
  const say = text => lines.push({ kind: 'say', by: 'TJ', text });
  say(pick(rng, ['Previously on The Challenge...', 'Last time, on The Challenge...', 'Previously, on the Blue Lagoon...']));
  // the vote and the call-out
  for (const [i, v] of prev.votes.entries()) {
    const co = prev.callouts.find(c => c.by === v.votedIn);
    if (!co) continue;
    const n = v.tally[v.votedIn];
    lines.push({ kind: 'say', by: 'TJ', text: pick(rng, [
      `The house voted ${v.votedIn} into the Arena with ${n} votes, and ${v.votedIn} called out ${co.opponent}.`,
      `${n} people said ${v.votedIn}'s name out loud, and ${v.votedIn} dragged ${co.opponent} in with ${pronouns(v.votedIn).obj}.`,
      `${v.votedIn} got voted in, and picked ${co.opponent} for the fight.`,
    ]) });
    if (i > 0) break;
  }
  // a volunteer
  const vol = prev.callouts.find(c => !prev.votes.some(v => v.votedIn === c.by));
  if (vol) say(pick(rng, [`${vol.by} volunteered for the Arena, and went after ${vol.opponent}.`,
    `${vol.by} didn't wait for a vote. ${vol.by} volunteered and called out ${vol.opponent}.`]));
  // the Arena
  for (const a of prev.arena) {
    say(a.comeback ? pick(rng, [`${a.winner} came back from the dead in ${a.gameName} and sent ${a.loser} home.`, `${a.loser} had it won, until ${a.winner} took it away.`])
      : a.upset ? pick(rng, [`Nobody gave ${a.winner} a chance against ${a.loser}. ${a.winner} won anyway.`, `${a.winner} pulled off the upset, and ${a.loser} went home.`])
      : pick(rng, [`In ${a.gameName}, ${a.winner} beat ${a.loser}, and ${a.loser} went home.`, `${a.winner} won the elimination. ${a.loser} did not.`]));
  }
  // the biggest story that aired
  const aired = (prev.aired || []).map(x => x.scene).filter(Boolean);
  const has = k => aired.find(s => s.kind === k);
  const big = has('disqualified') ? { s: has('disqualified'), t: s => `${s.who[0]} put hands on ${s.who[1]}, and I sent ${s.who[0]} home. Keep your hands to yourselves, people.` }
    : has('quit') ? { s: has('quit'), t: s => `${s.who[0]} quit. On me. On this show. I'm still not over it.` }
    : has('alliance-betrayal') ? { s: has('alliance-betrayal'), t: s => `${s.who[0]} turned on ${s.who[1]}, inside their own alliance.` }
    : has('outing') ? { s: has('outing'), t: s => `${s.who[0]} told the whole house about ${s.data.name}.` }
    // a couple split by the Arena the same week is recapped as that, never "love is in the air"
    : has('showmance') ? { s: has('showmance'), t: s => {
      const left = s.who.find(n => prev.arena.some(x => x.loser === n));
      return left ? `${s.who[0]} and ${s.who[1]} got together, and then ${left} went home.`
        : `${s.who[0]} and ${s.who[1]} made it official. Love is in the air. Also sand.`;
    } }
    : has('breakup') ? { s: has('breakup'), t: s => `${s.who[0]} and ${s.who[1]} broke up, in a house they can't leave.` }
    : has('fight') ? { s: has('fight'), t: s => `${s.who[0]} and ${s.who[1]} nearly tore the bar apart.` }
    : null;
  if (big) say(big.t(big.s));
  say(pick(rng, ['And tonight... it gets WEIRD.', 'And now... let\'s see who\'s still standing.', 'Buckle up, buttercups.']));
  return { kind: 'previously', lines };
}
