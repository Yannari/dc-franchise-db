// ══════════════════════════════════════════════════════════════════════
// bb/story/milestone.js — the weeks the season turns a corner
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "there's no finale announcement, they don't seem to acknowledge the
// important moments: top five, the start of the jury phase, final three. It seems monotone and
// continuous, so it becomes boring." The house notices these weeks on the real show: the first
// morning after somebody leaves for the jury, the five left on the sofas counting who is gone,
// the last veto at four, the last three alone in a house built for sixteen.
//
// One whole-house scene at the top of such a week, written from the game as it stands when the
// week is played (competition wins, bonds, the jury), so a replay never reads today's state.
// Words only: it moves nothing.

import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { stableRng } from '../knowledge.js';
import { evictionSeatsAJuror } from '../jury.js';

const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen'];
const word = n => W[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const winsOf = n => { const s = gs.bb?.stats?.[n] || {}; return (s.hohWins || 0) + (s.vetoWins || 0) + (s.blockBusterWins || 0); };
const winSay = n => { const k = winsOf(n); return k === 0 ? 'nothing' : k === 1 ? 'one competition' : `${word(k)} competitions`; };

/** Which corner this week turns, or null: 'jury' (the first week after a juror left), 'f5', 'f4', 'f3'. */
export function milestoneOf(week) {
  const size = (week?.houseAtStart || []).length;
  if (size === 4) return 'f4';
  if (size === 5) return 'f5';
  // the first week after an eviction seated a juror
  const weeks = (gs.bb?.weeks || []).filter(w => w !== week && (w.num || 0) < (week?.num || 0));
  const seats = w => !!w?.evicted && !w.evictionReversed && evictionSeatsAJuror((w.houseAtStart || []).length);
  const prev = weeks.at(-1);
  if (seats(prev) && !weeks.slice(0, -1).some(seats)) return 'jury';
  return null;
}

const CARD = { jury: ['THE JURY BEGINS', 'Jury Phase'], f5: ['FIVE REMAIN', 'Final Five'], f4: ['FOUR REMAIN', 'Final Four'], f3: ['THE LAST THREE', 'Final Three'] };

/** The scene, or null: { type:'set', step:'milestone', room, cast, lines, title, mood, why }. */
export function writeMilestone(week, ctx, forced = null) {
  const kind = forced || milestoneOf(week);
  const house = (ctx.present || []).slice();
  if (!kind || house.length < 3) return null;
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'milestone', week.num || 0);
  const pickOne = xs => xs[Math.floor(rng() * xs.length) % xs.length];
  const byWins = house.slice().sort((a, b) => winsOf(b) - winsOf(a));
  const top = byWins[0], low = byWins.at(-1);
  const social = house.slice().sort((a, b) => house.reduce((s, x) => s + getBond(x, b), 0) - house.reduce((s, x) => s + getBond(x, a), 0))[0];
  // the closest pair still in the house
  let pair = null;
  for (const a of house) for (const b of house) if (a < b && (!pair || getBond(a, b) > getBond(pair[0], pair[1]))) pair = [a, b];
  const started = (gs.bb?.weeks?.[0]?.houseAtStart || []).length || house.length;
  const lastOut = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted)?.evicted || null;
  const L = [];
  const beat = t => L.push({ kind: 'beat', by: null, text: t });
  const say = (by, t) => L.push({ kind: 'say', by, text: t });
  const dr = (by, t) => L.push({ kind: 'dr', by, text: t });
  const other = (...not) => house.find(n => !not.includes(n)) || house[0];
  let room = 'living-room';

  if (kind === 'jury') {
    const a = social, b = other(a);
    beat(pickOne([
      `The morning after ${lastOut} left. The house is quiet at breakfast, and nobody says why.`,
      `Kitchen, the morning after the eviction. Everyone is up early, and nobody is talking much.`,
    ]));
    room = 'kitchen';
    say(b, `${lastOut} is on the jury now.`);
    say(a, `I know. The first one.`);
    say(b, `Which means from now on, everybody who walks out that door gets a vote on who wins.`);
    say(a, `So now it matters how we do it, not just who.`);
    say(b, `Every one of them is going to remember how they went out.`);
    dr(a, `Everything changed last night. Every person I help evict from now on is somebody I have to face at the end and ask for a vote. I can't burn anybody any more.`);
    if (top !== a && top !== b) dr(top, `I've won ${winSay(top)} in here. The jury will respect that. But first I have to get to the end, and everyone here knows I'm the one to stop.`);
  } else if (kind === 'f5') {
    const a = social, b = other(a, top);
    beat(`Living room, the night after the eviction. The five who are left sit together on the sofas, closer than they need to.`);
    say(a, `Five. There were ${word(started)} of us on move-in day.`);
    say(b, `It feels like a year ago.`);
    say(top, `And I've had to fight for every single one of them.`);
    say(a, `One of us is next. Nobody say it.`);
    beat(`Nobody says it. Everybody looks around the room anyway.`);
    dr(top, `I've won ${winSay(top)}. With five left, everybody knows I'm the biggest threat. I have to win nearly every week from here, or I'm next.`);
    if (low !== top) dr(low, winsOf(low) === 0
      ? `I haven't won a single competition, and I'm in the final five. The others all think somebody else is the threat. That's exactly how I want it.`
      : `I'm not the one everybody's afraid of, and that's kept me here. At five, though, there's nowhere left to hide.`);
    if (pair && getBond(pair[0], pair[1]) >= 4) { say(pair[0], `Still you and me?`); say(pair[1], `Still you and me.`); dr(pair[1], `${pair[0]} and I have made it this far together. With five left, one of us is going to have to choose between the other and the money. I hope it isn't me.`); }
  } else if (kind === 'f4') {
    const a = social, b = other(a);
    beat(`Kitchen. Four people at a table built for ${word(started)}, and too many empty chairs.`);
    room = 'kitchen';
    say(a, `Four.`);
    say(b, `This is the last veto of the season.`);
    say(a, `And whoever wins it decides who goes home. On their own. One vote.`);
    say(b, `So it all comes down to one competition.`);
    dr(a, `At four, the veto holder casts the only vote. Winning it is the difference between deciding and being decided about.`);
    if (pair && getBond(pair[0], pair[1]) >= 4) dr(pair[0], `${pair[1]} and I have been closest in this house the whole way. At four, that starts costing something. If I win the veto, I find out how loyal I really am.`);
    else dr(top, `I've won ${winSay(top)}. If I don't win this veto, I think the other three send me home.`);
  } else if (kind === 'f3') {
    const [a, b, c] = house;
    beat(`The night after the last eviction. The house is almost silent: three people left, in a house built for ${word(started)}.`);
    say(a, `It's just us.`);
    say(b, `Three people and a lot of empty beds.`);
    say(c, `The final HOH is in three parts. Whoever wins it picks who sits next to them on finale night.`);
    say(a, `And evicts the other one. Live. In front of everyone.`);
    // each of the three in their own words (two winners side by side said the same sentence)
    const BIG = [
      n => `I've won ${winSay(n)}. I have to win the final HOH. If I win, I choose who sits next to me. If I lose, I'm probably the one who goes.`,
      n => `${winSay(n).replace(/^./, ch => ch.toUpperCase())}, and none of them matter now. All that matters is the final HOH. Everyone knows I'm the one they can't beat in front of the jury.`,
      n => `I've won ${winSay(n)}, so nobody's going to want to sit next to me at the end. I can't rely on anyone taking me. I have to win it myself.`,
    ];
    const SOME = [
      n => `I've won ${winSay(n)}. I'm one competition away from the final two, and one bad night away from the jury.`,
      n => `I've won ${winSay(n)}. Not the most, not the least. I need to win one more, or convince whoever wins that I'm the safest person to take.`,
    ];
    const NONE = [
      n => `I haven't won a competition all season, and I'm in the final three. Now I need one win, or I need whoever wins to believe I'm the easiest person to beat.`,
      n => `No wins, and I'm still here. Everyone thinks I'm the easy seat at the end. I'm counting on it.`,
    ];
    const used = { big: 0, some: 0, none: 0 };
    for (const n of [a, b, c]) {
      const w = winsOf(n);
      const [pool, k] = w >= 3 ? [BIG, 'big'] : w === 0 ? [NONE, 'none'] : [SOME, 'some'];
      dr(n, pool[used[k]++ % pool.length](n));
    }
  }
  const [over, name] = CARD[kind];
  const cast = [...new Set(L.filter(l => l.by).map(l => l.by))];
  return { id: `milestone:${week.num || 0}`, type: 'set', step: 'milestone', outcome: kind, room, roomName: room === 'kitchen' ? 'Kitchen' : 'Living Room',
    cast: house.length <= 6 ? house : cast, lines: L, mood: 'plan', fixedRoom: true, recap: false, lineId: null,
    title: { kind: 'milestone', over, name, members: house.slice(0, 6) },
    why: [kind === 'jury' ? `${lastOut} was the first juror. Everyone evicted from now on votes for the winner.` : `${house.length} houseguests remain.`] };
}
