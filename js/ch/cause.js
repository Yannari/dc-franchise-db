// ══════════════════════════════════════════════════════════════════════
// ch/cause.js — what a fight is about
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16, after two fights at the episode-1 night out: "are those fight due to something? i dont
// want random fight ... i didnt even know they didnt like each other". A fight needs a reason the viewer saw (or
// can be told in one line): something one of them did to the other, remembered (rel.js remember). Disliking
// somebody's face is not enough; the bond alone can come from nothing more than first impressions.
//
// causeOf(a, b) finds the strongest such memory either way round and says it in one sentence, which the fight
// opens with (write.js: data.causeLine), so a fight never starts in the middle of a feud nobody knew about.
import { strongestStrategicMemory } from '../strategy-memory.js';
import { pronouns } from '../players.js';

// observer {o} holds it against subject {s}. Every one is something that happened on camera.
const SAY = {
  'voted-for-me': "{o} hasn't forgotten that {s} said {op} name at the vote.",
  'sent-me-in': "{o} hasn't forgotten that {s} helped send {oo} into the Arena.",
  'called-me-out': "{o} still hasn't forgiven {s} for the call-out.",
  'eliminated-ally': "{o} blames {s} for sending {ally} home.",
  'named-me': "{o} is still angry about what {s} said about {oo} at the daily.",
  'mocked-me': "{o} hasn't let go of {s} laughing at {oo} after the daily.",
  'laughed-at-me': "{o} hasn't let go of {s} laughing at {oo}.",
  'taunted-me': "{o} is still angry about {s}'s taunting.",
  'gloated': "{o} still remembers {s} gloating after the vote.",
  'rubbed-it-in': "{o} still remembers {s} rubbing it in.",
  'plotting-against-me': "{o} knows {s} has been plotting against {oo}.",
  'coming-for-me': "{o} knows {s} is coming for {oo}.",
  'threatened-me': "{o} hasn't forgotten {s} coming after {oo} the morning after the Arena.",
  'yelled-at-me': "{o} is still sore about {s} yelling at {oo} during the daily.",
  'blew-up-at-me': "{o} is still sore about {s} blowing up at {oo}.",
  'old-grudge': "{o} and {s} have history from before this season, and it hasn't gone away.",
  'started-a-fight': "{o} and {s} have fought before, and neither of them has let it go.",
  'alliance-betrayal': "{o} hasn't forgiven {s} for turning on the alliance.",
  'loose-lips': "{o} is furious that {s} spilled the alliance's plans.",
  'leaked-my-plan': "{o} is furious that {s} leaked {op} plan.",
  'talked-behind-my-back': "{o} found out {s} has been talking behind {op} back.",
  'lied-to-me': "{o} found out {s} lied to {oo}.",
  'sent-me-away': "{o} blames {s} for the trip to Redemption House.",
  'picked-me': "{o} hasn't forgotten {s} picking {oo} at the table.",
  'took-my-money': "{o} hasn't forgotten {s} taking half of {op} bank.",
  'knocked-me-off': "{o} hasn't forgotten {s} knocking {oo} off in the daily.",
  'sabotaged-me': "{o} is sure {s} sabotaged {oo}.",
  'got-my-friend-expelled': "{o} blames {s} for getting a friend sent home.",
  'went-after-my-friend': "{o} hasn't forgiven {s} for going after {op} friend.",
  'went-after-my-partner': "{o} hasn't forgiven {s} for going after {op} partner.",
  'dumped-me': "{o} hasn't gotten over {s} ending things.",
  'called-me-a-floater': "{o} is still angry that {s} called {oo} a floater in front of everybody.",
};
// what kind of reason it is, so the fight's words claim only what is true (facts.js `cause`): a line about a
// name "coming out of your mouth" needs talk; "you said my name" needs a vote; with no event, it is dislike
export const GROUP = {
  'voted-for-me': 'vote', 'sent-me-in': 'vote', 'gloated': 'vote', 'rubbed-it-in': 'vote',
  'called-me-out': 'callout',
  'eliminated-ally': 'ally', 'got-my-friend-expelled': 'ally', 'went-after-my-friend': 'ally', 'went-after-my-partner': 'ally',
  'named-me': 'talk', 'talked-behind-my-back': 'talk', 'leaked-my-plan': 'talk', 'loose-lips': 'talk', 'lied-to-me': 'talk',
  'plotting-against-me': 'talk', 'coming-for-me': 'talk', 'called-me-a-floater': 'talk',
};
// a memory this faint was a passing irritation, not a reason to fight
const MIN = 0.8;

/** { line, type, by, at } for the strongest on-camera grievance between a and b, or null. */
export function causeOf(a, b, ep) {
  const best = [[a, b], [b, a]].map(([o, s]) => ({ o, s, m: strongestStrategicMemory(o, s, ep) }))
    .filter(x => x.m && SAY[x.m.type] && x.m.weight >= MIN)
    .sort((x, y) => y.m.weight - x.m.weight)[0];
  if (!best) return null;
  const ally = best.m.details?.ally || 'a friend';
  const pr = pronouns(best.o) || {};
  const line = SAY[best.m.type].replace(/\{op\}/g, pr.posAdj || 'their').replace(/\{oo\}/g, pr.obj || 'them')
    .replace(/\{o\}/g, best.o).replace(/\{s\}/g, best.s).replace(/\{ally\}/g, ally);
  return { line, type: best.m.type, group: GROUP[best.m.type] || 'clash', holder: best.o, against: best.s };
}

// No event between them, only two people who can't stand each other (the user: fine, as long as nobody claims
// something that never happened: "just say i dont really like u we dont connect"). Said as what it is.
export function dislikeOf(a, b, ep) {
  const when = ep <= 1 ? 'since they got off the plane' : 'since day one';
  return { line: `${a} and ${b} have rubbed each other the wrong way ${when}.`, type: 'dislike', group: 'dislike', holder: a, against: b };
}
