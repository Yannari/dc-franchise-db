// ══════════════════════════════════════════════════════════════════════
// ch/story/previously.js — "Previously on The Challenge..."
// ══════════════════════════════════════════════════════════════════════
//
// TJ opens every episode after the first with what happened last time. The user, 2026-10-15:
// "previously is too quick; get inspired from Total Drama's previously, but make it better". So it is
// cut the way the show cuts it (td/story/previously.js): the daily (who won it, who came last), the
// stories that moved last episode (an alliance born, a betrayal, a couple, a fight, a deal broken, the
// house arguing about a name), each with a clip of the line that mattered, said by the person who said it,
// on the place it was said (`shot`: the viewer cuts back there); then the vote and why, the call-out in the
// caller's own words, the Arena and the loser's last word, how many are left, and the tease.
//
// Nothing that did not air is recapped (the viewer was never shown it), and every clause comes from the
// record and names its subject the right way round (manual §19.2 step 8).
import { stableRng } from '../../script/rng.js';
import { pronouns } from '../../players.js';

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four'];
const num = n => W[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const list = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

// The line that mattered in a scene: something a protagonist said out loud (else to the camera), long
// enough to mean something and short enough to be a clip.
function clipOf(aired, who) {
  const lines = (aired?.script?.lines || []).filter(l => l.by && who.includes(l.by) && l.by !== 'TJ' && l.text && !l.recap);
  const fits = l => l.text.length >= 24 && l.text.length <= 150;
  const said = lines.filter(l => l.kind === 'say' && fits(l));
  const conf = lines.filter(l => l.kind === 'conf' && fits(l));
  // the strongest: a line that names somebody, or raises its voice; else the longest that fits
  // a reply means nothing out of its scene ("I know. I heard. Thank you."): a clip has to stand on its own
  const reply = /^(I don't know|Maybe\b|I know|I heard|Thank|Thanks|Okay\b|Ok\b|Yes\b|Yeah\b|No\b|Me too|Same|Why|What|It |That's|That was|Good|Fine|Sure|Deal|Really|Wow)/i;
  // ...and a line said in the speaker's own voice is the one that sounds like them
  const score = l => (/[A-Z][a-z]+/.test(l.text.slice(1)) ? 2 : 0) + (/!/.test(l.text) ? 1 : 0) + l.text.length / 150 - (reply.test(l.text) ? 4 : 0) + (l.voice ? 1 : 0);
  const all = [...said, ...conf].sort((x, y) => score(y) - score(x));
  const best = all.find(l => score(l) > 0) || null;
  if (!best) return null;
  // the clip is the line as it aired: its voice, and (not enumerable, as write.js has it) the turn it came from
  const clip = { kind: best.kind, by: best.by, text: best.text, voice: best.voice || null };
  if (best.turn) Object.defineProperty(clip, 'turn', { value: best.turn, enumerable: false });
  return clip;
}
const shotOf = a => ({ spot: a.script?.at || a.scene?.spot || null, kind: a.kind, who: [...(a.scene?.who || [])].slice(0, 4) });

// The stories worth a recap, most first, and how TJ tells each (from the scene's record).
const STORIES = [
  ['disqualified', s => `${s.who[0]} put hands on ${s.who[1]}, and I sent ${s.who[0]} home. Keep your hands to yourselves, people.`],
  ['quit', s => `${s.who[0]} quit. On me. On this show. I'm still not over it.`],
  ['alliance-betrayal', s => `${s.who[0]} turned on ${s.who[1]}${s.data?.name ? `, inside ${s.data.name}` : ', inside their own alliance'}.`],
  ['deal-broken', s => `${s.who[0]} broke a deal with ${s.who[1]}, and ${s.who[1]} found out the hard way.`],
  ['empty-threat', s => `${s.who[1]} swore it would be ${s.who[0]} at the call-out, then picked ${s.data?.opponent || 'somebody else'}.`],
  ['counter-pitch', s => `${s.who[0]} tried to put ${s.data?.alt || s.who[1]} in instead${s.data?.moved?.length ? ', and some of the house listened' : ''}.`],
  ['outing', s => `${s.who[0]} told the whole house about ${s.data?.name || 'the alliance running it'}.`],
  ['alliance-form', s => `${s.data?.leader || s.who[0]} started an alliance${s.data?.name ? `, ${s.data.name},` : ''} with ${list(s.who.filter(n => n !== (s.data?.leader || s.who[0])).slice(0, 4))}.`],
  ['showmance', s => `${s.who[0]} and ${s.who[1]} made it official.`],
  ['breakup', s => `${s.who[0]} and ${s.who[1]} broke up, in a house they can't leave.`],
  ['fight-physical', s => `${s.who[0]} and ${s.who[1]} had to be pulled apart.`],
  ['fight', s => `${s.who[0]} and ${s.who[1]} went at it, in front of everybody.`],
  ['house-debate', s => `${s.who[0]} said ${s.data?.target || s.who[1]}'s name out loud in front of the whole house, and ${s.who[2]} pushed back.`],
  ['alliance-end', s => `${s.data?.name || 'An alliance'} fell apart.`],
  ['jealousy', s => `${s.who[0]} didn't like how close ${s.who[1]} and ${s.who[2] || 'somebody'} were getting, and said so.`],
  ['kitchen-blowup', s => `${s.who[0]} and ${s.who[1]} blew up in the kitchen, and it wasn't about the food.`],
  ['receipts', s => `${s.who[0]} went to find out why ${s.who[1]} said ${pronouns(s.who[0])?.posAdj || 'their'} name at the vote.`],
];

export function previouslyFor(state, prev) {
  if (!prev) return null;
  const rng = stableRng(state.seed, 'previously', prev.ep);
  const lines = [];
  const say = (text, shot = null) => lines.push({ kind: 'say', by: 'TJ', text, ...(shot ? { shot } : {}) });
  const clip = (c, shot) => { if (c) lines.push({ ...c, clip: true, shot }); };
  const aired = (prev.aired || []).filter(a => a.scene && a.script);
  const find = (kind, f = () => true) => aired.find(a => a.kind === kind && f(a));
  say(pick(rng, ['Previously on The Challenge...', 'Last time, on The Challenge...', 'Previously, on the Blue Lagoon...']));

  // the daily
  const d = prev.daily;
  if (d?.winners?.length) {
    const ds = find('daily');
    const shot = { daily: d.id, who: [...d.winners].slice(0, 3) };
    say(d.winners.length > 1 ? pick(rng, [`${list(d.winners)} won ${d.name}, and nobody could touch them at the vote.`, `${d.name}: ${list(d.winners)} took it, and bought themselves a safe week.`])
      : pick(rng, [`${d.winners[0]} won ${d.name}, and was safe at the vote.`, `${d.name} went to ${d.winners[0]}. Safe for the week.`]), shot);
    if (ds) clip(clipOf(ds, d.winners), shot);
    const last = (d.last || [])[0];
    if (last && !d.winners.includes(last)) say(pick(rng, [`${last} came in last.`, `And ${last} finished dead last.`]), { daily: d.id, who: [last] });
  }

  // the stories that moved: up to three, the biggest first, each with its clip
  let told = 0;
  const usedScenes = new Set();
  for (const [kind, tell] of STORIES) {
    if (told >= 3) break;
    const a = find(kind, x => !usedScenes.has(x.scene.id));
    if (!a) continue;
    usedScenes.add(a.scene.id);
    const shot = shotOf(a);
    say(tell(a.scene), shot);
    clip(clipOf(a, a.scene.who.slice(0, 3)), shot);
    told++;
  }

  // the vote, and why; then the one voted in, in their own words
  for (const [i, v] of (prev.votes || []).entries()) {
    const n = v.tally?.[v.votedIn] || 0;
    const vs = find('house-debate', x => x.scene.data?.target === v.votedIn);
    const shot = { spot: 'deliberation', kind: 'ceremony', who: [v.votedIn] };
    say(pick(rng, [`At the vote, ${num(n)} people said ${v.votedIn}'s name out loud.`, `The house voted ${v.votedIn} into the Arena, ${num(n)} votes.`, `${Cap(num(n))} votes. ${v.votedIn} was going into the Arena.`]), shot);
    if (vs && !usedScenes.has(vs.scene.id)) say(`${vs.scene.data?.organiser || vs.scene.who[0]} pushed for it, and the house went along.`, shot);
    const after = find('after-vote', x => x.scene.who[0] === v.votedIn);
    if (after) clip(clipOf(after, [v.votedIn]), shotOf(after));
    if (i > 0) break;
  }
  // a volunteer
  const vol = (prev.callouts || []).find(c => !(prev.votes || []).some(v => v.votedIn === c.by));
  if (vol) say(pick(rng, [`${vol.by} volunteered for the Arena, and went after ${vol.opponent}.`, `${vol.by} didn't wait for a vote. ${vol.by} volunteered and called out ${vol.opponent}.`]), { spot: 'arena', who: [vol.by, vol.opponent] });

  // the call-out, in the caller's words; the Arena, and the loser's last word
  for (const co of (prev.callouts || [])) {
    const cs = find('callout', x => x.scene.who[0] === co.by);
    const shot = { spot: 'arena', kind: 'arena', who: [co.by, co.opponent] };
    if (!vol || vol.by !== co.by) say(pick(rng, [`${co.by} called out ${co.opponent}.`, `${co.by} looked across the Arena and picked ${co.opponent}.`]), shot);
    if (cs) clip(clipOf(cs, [co.by]), shot);
  }
  for (const a of prev.arena || []) {
    const shot = { spot: 'arena', kind: 'arena', who: [a.winner, a.loser] };
    say(a.comeback ? pick(rng, [`${a.winner} came back from the dead in ${a.gameName} and sent ${a.loser} home.`, `${a.loser} had it won, until ${a.winner} took it away.`])
      : a.upset ? pick(rng, [`Nobody gave ${a.winner} a chance against ${a.loser}. ${a.winner} won anyway.`, `${a.winner} pulled off the upset, and ${a.loser} went home.`])
      : pick(rng, [`In ${a.gameName}, ${a.winner} beat ${a.loser}, and ${a.loser} went home.`, `${a.winner} won the elimination. ${a.loser} did not.`]), shot);
    const ar = find('arena', x => x.scene.who.includes(a.loser));
    if (ar) clip(clipOf(ar, [a.loser]), shot);
  }

  // who is left, and the tease
  // as last episode ended (the season has long since played on by the time it airs)
  const left = prev.intel?.end?.players?.length || 0;
  if (left) lines.push({ kind: 'say', by: 'TJ', text: pick(rng, [`${Cap(num(left))} players left.`, `${Cap(num(left))} of you still standing.`]), roster: true });
  say(pick(rng, ['And tonight... it gets WEIRD.', 'And now... let\'s see who\'s still standing.', 'Buckle up, buttercups.', 'Tonight, somebody else goes home. Let\'s find out who.']));
  return { kind: 'previously', lines };
}
