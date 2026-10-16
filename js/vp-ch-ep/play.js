// ══════════════════════════════════════════════════════════════════════
// vp-ch-ep/play.js — every game played the way its rules say
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15, watching the first build: "the challenges are rather
// expeditive, what is supposed to happen doesn't show". A daily was a rules card,
// three lines about who was in front, and the winner. Here each game is played
// out in the order its own description gives (js/ch/dailies.js, js/ch/arena.js
// `desc`: the set-up, what they do, what goes wrong, how it is won): people
// swim, climb, pull and dig on the plate, the props change, and a board keeps
// the count that game is won on (buoys reached, flags, letters, a total, a tank).
//
// Every number is read from the record. A unit's place in the daily's finishing
// order (ch-run.js dailyOf: the units by score, best first) sets how far along
// it is at each moment, so the board always agrees with the result the engine
// gave, and the winner is never ahead of the step that names them. The words
// are plain and say what the camera sees; nothing here decides anything.
import { pickBy, hashOf, nameList } from './games.js';
import { band, spotAt } from './ground.js';

const unitName = u => nameList(u);
const first = u => u[0];
// how far along a unit is at a moment (0..1), from its finishing place
const along = (rank, R, t) => Math.max(0, Math.min(1, t * (1.18 - (rank / Math.max(1, R - 1)) * .62)));

/** The game's sequence: { steps, finish } — `finish` is merged into the step where TJ calls the result. */
export function dailyPlay(d, ctx) {
  const P = PLAYS[d.id];
  if (!P) return null;
  const units = d.order || [];
  const R = units.length;
  const win = new Set(d.winners || []);
  const isWin = u => u.some(n => win.has(n));
  const winners = units.filter(isWin);
  const losers = units.filter(u => !isWin(u));
  const g = {
    d, key: ctx.key, seed: `${ctx.seed}|${d.id}`, units, R, winners, losers, isWin,
    lead: winners[0] || units[0], back: units[R - 1], second: losers[0] || units[1] || units[0],
    thrower: units.find(u => u.some(n => (d.throws || []).includes(n))) || null,
    pick: (arr, k = '') => pickBy(arr, `${ctx.seed}|${d.id}|${k}`),
    rank: u => units.indexOf(u),
  };
  const res = P(g);
  if (res) res.steps = widen(g, res.steps);
  return res;
}

// The user, 2026-10-15: "the challenges are too quick to finish". Between the game's own beats, the
// middle of the pack (three more players doing the game in its own words), TJ shouting from the side,
// and somebody pulling level with the leader before the finish. {u} is the one doing it, {v} another.
const MID = {
  'night-swim': ['{u} swims past the third buoy and stops to read the lantern.', '{u} treads water and says the numbers out loud to keep them straight.',
    '{u} loses count halfway round and swims back to the first buoy.', '{u} and {v} are stroke for stroke out at the far buoy.'],
  'reef-dash': ['{u} comes up with the fourteen and swims straight back out.', '{u} goes under three times before finding a token.',
    '{u} drops onto the sand, gasping, then goes back in.', '{u} and {v} reach the same buoy at once and both dive.'],
  'cliff-relay': ['{u} gets halfway up the ladder and has to stop and breathe.', '{u} jumps feet first and comes up laughing.',
    '{u} stands shaking at the top for a long time, then jumps anyway.', '{u} and {v} race up the ladder side by side.'],
  'truck-tug': ['{u} digs in, and the truck lurches forward a metre.', '{u} is rubbed raw by the harness and keeps pulling.',
    '{u} shouts the count so everybody pulls at the same time.', '{u} and {v} are level with half the track to go.'],
  'jungle-maze': ['{u} finds a letter behind a wall of bamboo.', '{u} runs past the same station twice without seeing it.',
    '{u} shouts for {v} through the bamboo. Nobody answers.', '{u} scratches the letters into the dirt so as not to forget them.'],
  'balance-beam': ['{u} gets all the way across without spilling a drop.', '{u} crawls the last metre with the bucket held up high.',
    '{u} spills half the bucket on the way and keeps going anyway.', '{u} and {v} are on the beam at the same time, and nobody can pass.'],
  'gauntlet-run': ['{u} flies through the tires.', '{u} gets stuck in the mud crawl and has to wriggle free.',
    '{u} needs three tries to get over the wall.', '{u} drags the sandbag the last few metres to the bell.'],
  any: ['{u} keeps going, slower than before.', '{u} and {v} are neck and neck.'],
};
const NO_MID = new Set(['lagoon-quiz', 'demolition', 'hang-on']);
function widen(g, steps) {
  if (steps.length < 2) return steps;
  const used = new Set([g.lead, g.back, g.second, g.thrower, ...g.winners]);
  const mids = NO_MID.has(g.d.id) ? [] : g.units.filter(u => !used.has(u)).slice(0, 3);
  const pool = MID[g.d.id] || MID.any;
  const off = hashOf(`${g.seed}|mid`);
  const extra = mids.map((u, k) => {
    const v = mids[(k + 1) % mids.length] !== u ? mids[(k + 1) % mids.length] : g.lead;
    const t = pool[(off + k) % pool.length];
    return { dir: t.replace(/\{u\}/g, first(u)).replace(/\{v\}/g, first(v)), focus: [first(u), ...(t.includes('{v}') ? [first(v)] : [])], mid: first(u) };
  });
  extra.splice(Math.min(1, extra.length), 0, { tjCall: { a: first(g.lead), b: first(g.back) }, focus: ['TJ', first(g.lead)] });
  // somebody catches the leader; when a man and a woman both win, the two of them are the ones out in front
  if (g.winners.length > 1 && !NO_MID.has(g.d.id)) extra.push({ dir: `${unitName(g.winners[1])} ${g.winners[1].length > 1 ? 'are' : 'is'} keeping pace with ${unitName(g.lead)}. Those two are the ones to beat today.`, focus: [first(g.winners[1]), first(g.lead)], act: { [first(g.winners[1])]: 'cheer' } });
  else if (g.second !== g.lead && !NO_MID.has(g.d.id)) extra.push({ dir: `${unitName(g.second)} ${g.second.length > 1 ? 'pull' : 'pulls'} level with ${unitName(g.lead)}. For a moment it could go either way.`, focus: [first(g.second), first(g.lead)], act: { [first(g.second)]: 'cheer' } });
  extra.push({ tjCall: { a: first(g.lead), b: first(g.second) }, close: 1, focus: ['TJ'] });
  const out = [];
  let e = 0;
  const from = steps.length > 2 ? 1 : 0, last = steps.length - 1;
  steps.forEach((s, i) => {
    out.push(s);
    if (i < from || i >= last) return;
    const n = Math.ceil((extra.length - e) / (last - i));
    for (let j = 0; j < n && e < extra.length; j++) out.push(extra[e++]);
  });
  return out;
}

// The board along the top: the best six units, and anyone the step names.
function tally(g, title, val, { names = [], mark = {} } = {}) {
  const show = [...g.units.slice(0, 6)];
  for (const u of g.units) if (u.some(n => names.includes(n)) && !show.includes(u)) show.push(u);
  return { title, rows: show.slice(0, 7).map(u => ({ who: [...u], ...val(u, g.rank(u)), mark: mark[first(u)] || null })) };
}
// Everybody's first member placed in a band of the plate (the rest of a pair or a team stand behind).
function bandMove(g, members, opt) {
  const spots = band(g.key, members.length, opt);
  return Object.fromEntries(members.map((n, i) => [n, spots[i]]));
}
const all = g => g.units.flat();
const pose = (names, p) => Object.fromEntries(names.map(n => [n, p]));

// ── the dailies ───────────────────────────────────────────────────────
const PLAYS = {
  // After dark: a loop of glowing buoys, each lantern a number; swim back, add them up, write the total.
  'night-swim': g => {
    const B = 6, nums = Array.from({ length: B }, (_, i) => 1 + hashOf(`${g.seed}|b${i}`) % 9);
    const total = nums.reduce((a, b) => a + b, 0);
    const buoys = lit => nums.map((n, i) => ({ k: 'buoy', u: .1 + i * .11, v: .6 + (i % 2) * .03, lit, num: n }));
    const reached = (u, t) => Math.min(B, Math.round(along(g.rank(u), g.R, t) * B));
    const wrong = total + (hashOf(g.seed) % 2 ? 4 : -3);
    const lead = g.lead, x = g.second;
    const boardAt = { u: .76, v: .77, w: 13 };
    return { steps: [
      { dir: 'Six buoys float off the point, each with a lantern on top. Everybody wades into the dark water.', move: bandMove(g, all(g), { u0: .06, u1: .68, v0: .66, v1: .75, k: 1 }), pose: pose(all(g), 'swim'), props: buoys(false), focus: [] },
      { dir: 'The lanterns come on. Each one shows a number, and they have to remember all six.', props: buoys(true), focus: [], tally: tally(g, 'BUOYS REACHED', u => ({ txt: `${reached(u, .2)}/6`, v: reached(u, .2) / 6 })) },
      { dir: `${unitName(lead)} ${lead.length > 1 ? 'reach' : 'reaches'} the last buoy first.`, focus: lead.slice(0, 2), props: buoys(true), move: { [first(lead)]: spotAt(g.key, .66, .62, .8) },
        tally: tally(g, 'BUOYS REACHED', u => ({ txt: `${reached(u, .7)}/6`, v: reached(u, .7) / 6 })) },
      { dir: `${unitName(g.back)} ${g.back.length > 1 ? 'turn' : 'turns'} back with only ${Math.max(2, reached(g.back, .7))} numbers.`, focus: g.back.slice(0, 2), act: { [first(g.back)]: 'slump' }, props: buoys(true),
        tally: tally(g, 'BUOYS REACHED', u => ({ txt: `${reached(u, .9)}/6`, v: reached(u, .9) / 6 }), { names: g.back }) },
      { dir: `${unitName(x)} ${x.length > 1 ? 'run' : 'runs'} up the beach and ${x.length > 1 ? 'write' : 'writes'} ${wrong} on the board. That's wrong. Back out to check.`, focus: x.slice(0, 2), act: { [first(x)]: 'flinch' }, cut: { plate: 'board', who: x.slice(0, 2) },
        move: { [first(x)]: spotAt(g.key, .72, .7, .8) }, pose: { [first(x)]: 'swim' },
        props: [...buoys(true), { k: 'board', ...boardAt, title: 'TOTALS', rows: [{ n: first(x), t: wrong, ok: false }] }] },
    ], finish: {
      move: Object.fromEntries(g.winners.map((u, i) => [first(u), spotAt(g.key, .72 + i * .08, .78, 1)])), pose: pose(g.winners.map(first), null),
      props: [...buoys(true), { k: 'board', ...boardAt, title: 'TOTALS', rows: [{ n: first(x), t: wrong, ok: false }, ...g.winners.map(u => ({ n: first(u), t: total, ok: true }))] }],
      dir: `${nameList(g.winners.map(first))} ${g.winners.length > 1 ? 'both write' : 'writes'} ${total}. That's right.`,
    } };
  },

  // Twenty numbered buoys, a token under each; swim, dive, bring them back one at a time; the current; the horn.
  'reef-dash': g => {
    const buoys = Array.from({ length: 8 }, (_, i) => ({ k: 'buoy', u: .08 + i * .085, v: .6 + (i % 2) * .035, lit: true, num: [3, 17, 8, 12, 20, 5, 14, 9][i], c: '#ffd21a' }));
    const top = 48;
    const tot = (u, t) => Math.round(along(g.rank(u), g.R, t) * top);
    const x = g.losers[g.losers.length - 1] || g.back;
    return { steps: [
      { dir: 'Twenty numbered buoys float over the reef, a token tied under each one. Everybody runs in and swims for them.', move: bandMove(g, all(g), { u0: .06, u1: .72, v0: .65, v1: .74, k: .8 }), pose: pose(all(g), 'swim'), props: buoys, focus: [] },
      { dir: `${unitName(g.lead)} ${g.lead.length > 1 ? 'dive' : 'dives'} under the twenty and ${g.lead.length > 1 ? 'come' : 'comes'} up with its token.`, focus: g.lead.slice(0, 2), props: [...buoys, { k: 'token', u: .43, v: .58, num: 20 }],
        tally: tally(g, 'TOKEN TOTAL', u => ({ txt: String(tot(u, .35)), v: tot(u, .35) / top })) },
      { dir: 'The current drags everybody to the left. They have to swim twice as hard to get back to the buoys.', focus: [], props: buoys, shift: { du: -.04 },
        tally: tally(g, 'TOKEN TOTAL', u => ({ txt: String(tot(u, .6)), v: tot(u, .6) / top })) },
      { dir: `${unitName(x)} ${x.length > 1 ? 'bring' : 'brings'} back a token from the wrong buoy. It's worth nothing.`, focus: x.slice(0, 2), act: { [first(x)]: 'slump' }, props: buoys,
        tally: tally(g, 'TOKEN TOTAL', u => ({ txt: String(tot(u, .8)), v: tot(u, .8) / top }), { names: x, mark: { [first(x)]: 'x' } }) },
      { dir: 'The horn goes. Time is up, and everybody swims in.', cut: { plate: 'board', who: g.units.slice(0, 5).map(first) }, move: bandMove(g, all(g), { u0: .2, u1: .95, v0: .76, v1: .79, k: .9 }), pose: pose(all(g), null), props: buoys, focus: [],
        tally: tally(g, 'TOKEN TOTAL', u => ({ txt: String(tot(u, 1)), v: tot(u, 1) / top })) },
    ], finish: { props: buoys, tally: tally(g, 'TOKEN TOTAL', u => ({ txt: String(tot(u, 1)), v: tot(u, 1) / top, win: g.isWin(u) })) } };
  },

  // A rope ladder up the sea cliff, a flag clipped every ten metres: climb, unclip, jump, swim back, climb again.
  'cliff-relay': g => {
    const flags = u => Math.max(0, 6 - Math.round((g.rank(u) / Math.max(1, g.R - 1)) * 5));
    const at = (u, t) => Math.round(flags(u) * t);
    const L = { u: .628 };
    const climbers = g.units.slice(0, 3).map(first);
    const x = g.thrower || g.back, y = g.losers[Math.floor(g.losers.length / 2)] || g.second;
    const flagRow = [.25, .38, .5, .62].map(v => ({ k: 'flag', u: .642, v }));
    return { steps: [
      { dir: 'A rope ladder hangs down the cliff face, with a flag clipped every ten metres. The first climbers start up.', focus: climbers.slice(0, 1), props: flagRow,
        move: Object.fromEntries(climbers.map((n, i) => [n, spotAt(g.key, L.u, .62 - i * .14, .55)])), pose: pose(climbers, 'climb') },
      { dir: `${first(g.lead)} unclips a flag at the top, steps to the edge and jumps.`, focus: [first(g.lead)], props: flagRow.slice(1), cut: { plate: 'cliff-top', who: [first(g.lead)] },
        move: { [first(g.lead)]: spotAt(g.key, .7, .16, .6) }, pose: { [first(g.lead)]: null },
        tally: tally(g, 'FLAGS', u => ({ txt: String(at(u, .2)), v: at(u, .2) / 6 })) },
      { dir: `${first(g.lead)} hits the lagoon, swims back to the ladder and starts up again.`, focus: [first(g.lead)], drop: [first(g.lead)], splash: 1,
        move: { [first(g.lead)]: spotAt(g.key, .42, .74, .7) }, props: flagRow.slice(1),
        tally: tally(g, 'FLAGS', u => ({ txt: String(at(u, .45)), v: at(u, .45) / 6 })) },
      { dir: `${first(x)} gets to the top and won't jump. ${first(x)} has to climb all the way back down.`, focus: [first(x)], act: { [first(x)]: 'flinch' },
        move: { [first(x)]: spotAt(g.key, .66, .16, .6) }, props: flagRow.slice(1), tally: tally(g, 'FLAGS', u => ({ txt: String(at(u, .65)), v: at(u, .65) / 6 }), { names: x }) },
      { dir: `${first(y)} drops a flag on the way down. It sinks, and it doesn't count.`, focus: [first(y)], act: { [first(y)]: 'slump' }, drop: [first(y)], splash: 1,
        move: { [first(y)]: spotAt(g.key, .36, .76, .7) }, tally: tally(g, 'FLAGS', u => ({ txt: String(at(u, .85)), v: at(u, .85) / 6 }), { names: y, mark: { [first(y)]: 'x' } }) },
      { dir: 'Twenty minutes are up. TJ counts the flags.', focus: [], tally: tally(g, 'FLAGS', u => ({ txt: String(flags(u)), v: flags(u) / 6 })) },
    ], finish: { tally: tally(g, 'FLAGS', u => ({ txt: String(flags(u)), v: flags(u) / 6, win: g.isWin(u) })) } };
  },

  // Harnessed to a pickup truck: drag it down the sand to the finish, then the puzzle that only opens after.
  'truck-tug': g => {
    const two = g.units.length === 2;
    const [A, B] = two ? g.units : [g.lead, g.second];
    const dist = (u, t) => Math.round(along(g.rank(u), g.R, t) * 100);
    const pullers = (u, side) => Object.fromEntries(u.slice(0, 3).map((n, i) => [n, spotAt(g.key, (side ? .62 : .32) + i * .035, .47 - i * .012, .7)]));
    const heat = two ? 'Both sides' : `${unitName(A)} and ${unitName(B)} go in the last heat. Each side`;
    return { steps: [
      { dir: `${heat} straps into the harnesses in front of a truck.`, focus: [first(A), first(B)], cut: { plate: 'truck-pull', who: A.slice(0, 3), group: 'pull' }, move: { ...pullers(A, 0), ...pullers(B, 1) }, pose: pose([...A.slice(0, 3), ...B.slice(0, 3)], 'pull') },
      { dir: 'The trucks start to roll. Sand piles up under the wheels whenever they slow down.', focus: [], tally: tally(g, 'METRES DRAGGED', u => ({ txt: `${dist(u, .35)}m`, v: dist(u, .35) / 100 })) },
      { dir: `${unitName(g.back)} ${g.back.length > 1 ? 'stop' : 'stops'} for a rest, and getting the truck moving again takes everything.`, focus: g.back.slice(0, 2), act: { [first(g.back)]: 'slump' },
        tally: tally(g, 'METRES DRAGGED', u => ({ txt: `${dist(u, .7)}m`, v: dist(u, .7) / 100 }), { names: g.back }) },
      { dir: `${unitName(g.lead)} ${g.lead.length > 1 ? 'drag' : 'drags'} the truck over the line and ${g.lead.length > 1 ? 'run' : 'runs'} to the puzzle table under the arch.`, focus: g.lead.slice(0, 2), pose: pose(g.lead, null),
        move: Object.fromEntries(g.lead.slice(0, 3).map((n, i) => [n, spotAt(g.key, .5 + i * .03, .35, .7)])), props: [{ k: 'puzzle', u: .52, v: .29, w: 4, n: 5 }],
        tally: tally(g, 'METRES DRAGGED', u => ({ txt: `${dist(u, .95)}m`, v: dist(u, .95) / 100 })) },
    ], finish: { props: [{ k: 'puzzle', u: .52, v: .29, w: 4, n: 12, locked: true }], tally: tally(g, 'METRES DRAGGED', u => ({ txt: g.isWin(u) ? 'DONE' : `${dist(u, 1)}m`, v: g.isWin(u) ? 1 : dist(u, 1) / 100, win: g.isWin(u) })) } };
  },

  // Floating platforms in the lagoon; a right answer lets you knock a rival in with a padded pole.
  'lagoon-quiz': g => {
    const PL = [[.27, .655], [.42, .6], [.55, .56], [.66, .53], [.75, .5], [.82, .47]];
    const six = g.units.slice(0, 6);
    const early = g.units.slice(6);
    const steps = [{ dir: 'Everybody climbs onto a platform out on the water. TJ has a stack of questions about the house and the island.',
      move: Object.fromEntries(six.map((u, i) => [first(u), spotAt(g.key, PL[i][0], PL[i][1], .75)])), focus: [] }];
    if (early.length) steps.push({ dir: `The first rounds knock out ${early.length} of them. Six are left standing.`, drop: early.flat(), focus: [] });
    const left = [...six];
    let k = 0;
    while (left.length > (g.winners.length || 1)) {
      const out = left[left.length - 1];
      if (g.isWin(out)) break;
      const by = left[hashOf(`${g.seed}|k${k}`) % Math.max(1, left.length - 1)];
      steps.push({ dir: k % 2
        ? `${first(out)} gets one wrong and falls in trying to stay on the platform.`
        : `${first(by)} gets a question right and knocks ${first(out)} off with the pole.`, focus: [first(by), first(out)], act: { [first(by)]: 'shout', [first(out)]: 'flinch' }, drop: [first(out)], splash: 1 });
      left.pop(); k++;
    }
    return { steps, finish: {} };
  },

  // A bamboo maze with five hidden stations, one letter at each; spell the word, shout it at the exit.
  'jungle-maze': g => {
    const WORDS = ['CORAL', 'SHARK', 'TIDES', 'FLAME', 'STORM', 'WAVES', 'REEFS', 'TORCH'];
    const word = g.pick(WORDS, 'word');
    const wrong = word.split('').reverse().join('') === word ? word.slice(1) + word[0] : word[1] + word[0] + word.slice(2);
    const found = (u, t) => Math.min(5, Math.round(along(g.rank(u), g.R, t) * 5));
    const shown = (u, t) => word.split('').map((c, i) => (i < found(u, t) ? c : '_')).join(' ');
    const x = g.back, y = g.second;
    const gate = spotAt(g.key, .49, .69, 1);
    return { steps: [
      { dir: 'Everybody runs into the maze. Somewhere inside there are five stations, each with one letter.', hide: all(g), move: Object.fromEntries(all(g).map(n => [n, gate])), focus: [] },
      { dir: `${unitName(g.lead)} ${g.lead.length > 1 ? 'find' : 'finds'} the first station. It's a ${word[0]}.`, focus: [], cut: { plate: 'maze-in', who: g.lead.slice(0, 2) }, props: [{ k: 'letter', u: .5, v: .4, ch: word[0] }],
        tally: tally(g, 'LETTERS', u => ({ txt: shown(u, .25), v: found(u, .25) / 5 })) },
      { dir: `${unitName(x)} ${x.length > 1 ? 'hit' : 'hits'} a dead end. Then another one.`, focus: [], tally: tally(g, 'LETTERS', u => ({ txt: shown(u, .6), v: found(u, .6) / 5 }), { names: x }) },
      { dir: `${unitName(y)} ${y.length > 1 ? 'come' : 'comes'} out of the maze and ${y.length > 1 ? 'shout' : 'shouts'} "${wrong}!" That's not the word. Back in for a letter they missed.`,
        show: [first(y)], move: { [first(y)]: spotAt(g.key, .55, .76, 1) }, focus: [first(y)], act: { [first(y)]: 'shout' },
        tally: tally(g, 'LETTERS', u => ({ txt: shown(u, .85), v: found(u, .85) / 5 }), { mark: { [first(y)]: 'x' } }) },
    ], finish: {
      show: g.winners.flat(), hide: [first(y)], move: Object.fromEntries(g.winners.flat().map((n, i) => [n, spotAt(g.key, .44 + i * .07, .76, 1)])),
      props: word.split('').map((c, i) => ({ k: 'letter', u: .38 + i * .06, v: .4, ch: c })),
      dir: `${nameList(g.winners.map(first))} ${g.winners.length > 1 ? 'both come' : 'comes'} out and ${g.winners.length > 1 ? 'shout' : 'shouts'} "${word}!" That's it.`,
      tally: tally(g, 'LETTERS', u => ({ txt: g.isWin(u) ? word.split('').join(' ') : shown(u, .95), v: g.isWin(u) ? 1 : found(u, .95) / 5, win: g.isWin(u) })),
    } };
  },

  // A tower of crates in each corner of a sand ring; padded rams; the last tower standing.
  demolition: g => {
    const T = [[.06, .76], [.21, .47], [.46, .44], [.88, .76]];
    const four = g.units.slice(0, 4);
    const before = g.units.slice(4);
    const towerOf = u => T[four.indexOf(u)];
    const at = u => towerOf(u) ? spotAt(g.key, Math.min(.9, towerOf(u)[0] + .07), Math.min(.78, towerOf(u)[1] + .02), .9) : null;
    const steps = [{ dir: 'Every side runs to its tower of crates and picks up a padded ram.', move: Object.fromEntries(four.map(u => [first(u), at(u)]).filter(x => x[1])), focus: [] }];
    if (before.length) steps.push({ dir: `In the first round, ${before.length} towers come down. Four sides are left.`, drop: before.flat(), focus: [] });
    const fall = four.filter(u => !g.isWin(u)).reverse();
    const down = [];
    fall.forEach((u, k) => {
      down.push(u);
      const by = four.filter(x => !down.includes(x))[k % Math.max(1, four.length - down.length)] || g.lead;
      steps.push({ dir: k === 1 ? `${unitName(u)} ${u.length > 1 ? 'step' : 'steps'} out of the ring to grab a ram and can't come back in. Their tower falls with nobody guarding it.`
        : `${unitName(by)} ${by.length > 1 ? 'hit' : 'hits'} ${unitName(u)}'s tower with a ram, and it comes down.`, focus: [first(by), first(u)], act: { [first(by)]: 'shout', [first(u)]: 'slump' }, shake: 1,
        props: down.map(d => ({ k: 'tower', u: towerOf(d)[0], v: towerOf(d)[1] - .06, down: true, w: 6 })), tally: { title: 'TOWERS STANDING', rows: four.map(x => ({ who: [...x], txt: down.includes(x) ? 'DOWN' : 'UP', v: down.includes(x) ? 0 : 1, mark: down.includes(x) ? 'x' : null })) } });
    });
    return { steps, finish: { props: fall.map(d => ({ k: 'tower', u: towerOf(d)[0], v: towerOf(d)[1] - .06, down: true, w: 6 })) } };
  },

  // A greased beam over the pool: carry a full bucket across to the tank; a fall means an empty bucket.
  'balance-beam': g => {
    const fill = (u, t) => along(g.rank(u), g.R, t);
    const three = g.units.slice(0, 3);
    const tanks = t => three.map((u, i) => ({ k: 'tank', u: .885 - i * .028, v: .18, fill: fill(u, t), label: first(u).slice(0, 6) }));
    const x = g.back, y = g.second;
    return { steps: [
      { dir: 'The first ones step onto the beam with full buckets. The tank waits on the far platform.', focus: [first(g.lead), first(y)],
        move: { [first(g.lead)]: spotAt(g.key, .32, .335, .9), [first(y)]: spotAt(g.key, .22, .335, .9) }, props: [...tanks(.05), { k: 'bucket', u: .33, v: .31 }, { k: 'bucket', u: .23, v: .31 }] },
      { dir: `${first(x)} slips and goes into the pool. Back to the start with an empty bucket.`, focus: [first(x)], cut: { plate: 'beam-close', who: [first(x)], group: 'beam' }, move: { [first(x)]: spotAt(g.key, .45, .4, .9) }, drop: [first(x)], splash: 1, props: tanks(.3),
        tally: tally(g, 'TANK', u => ({ txt: `${Math.round(fill(u, .3) * 100)}%`, v: fill(u, .3) }), { names: x }) },
      { dir: 'The beam gets more slippery with every crossing. Most of them are crawling now.', focus: [], props: tanks(.6), tally: tally(g, 'TANK', u => ({ txt: `${Math.round(fill(u, .6) * 100)}%`, v: fill(u, .6) })) },
      { dir: `${first(g.lead)} pours in another bucket. That tank is nearly full.`, focus: [first(g.lead)], move: { [first(g.lead)]: spotAt(g.key, .86, .33, .9) }, props: tanks(.9),
        tally: tally(g, 'TANK', u => ({ txt: `${Math.round(fill(u, .9) * 100)}%`, v: fill(u, .9) })) },
    ], finish: { props: tanks(1), tally: tally(g, 'TANK', u => ({ txt: `${Math.round(fill(u, 1) * 100)}%`, v: fill(u, 1), win: g.isWin(u) })) } };
  },

  // A beach course run in heats against the clock: tyres, mud crawl, wall, sandbags, the bell.
  'gauntlet-run': g => {
    const secs = u => 150 + Math.round((g.rank(u) / Math.max(1, g.R - 1)) * 140) + hashOf(`${g.seed}|${first(u)}`) % 9;
    const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const C = { tyres: [.3, .76], mud: [.45, .72], wall: [.55, .69], bags: [.62, .7], bell: [.68, .67] };
    const run = (n, at) => ({ [n]: spotAt(g.key, C[at][0], C[at][1], .9) });
    const x = g.back, y = g.second;
    const board = (done, mark = {}) => tally(g, 'TIMES', u => (done.includes(u) ? { txt: fmt(secs(u)), v: 1 - (secs(u) - 140) / 200 } : { txt: '–', v: 0 }), { mark });
    return { steps: [
      { dir: 'They run it one heat at a time: the tyres, the mud crawl under the rope, the wall, the sandbag carry, and the bell.', focus: [first(x)], move: run(first(x), 'tyres'), pose: { [first(x)]: 'run' }, props: [{ k: 'sandbag', u: .6, v: .73 }] },
      { dir: `${first(x)} misses a tire. That's a minute on the clock.`, focus: [first(x)], cut: { plate: 'gauntlet-tyres', who: [first(x)], group: 'run' }, act: { [first(x)]: 'slump' }, move: run(first(x), 'mud'), board: 1, tally: board([x], { [first(x)]: 'x' }) },
      { dir: `${first(y)} drops a sandbag halfway. It goes back to the pile, and so does ${first(y)}.`, focus: [first(y)], cut: { plate: 'gauntlet-bags', who: [first(y)], group: 'run' }, move: run(first(y), 'bags'), pose: { [first(y)]: 'run', [first(x)]: null }, act: { [first(y)]: 'flinch' }, tally: board([x, y]) },
      { dir: `${first(g.lead)} goes over the wall clean and grabs the sandbags.`, focus: [first(g.lead)], cut: { plate: 'gauntlet-wall', who: [first(g.lead)], group: 'run' }, move: run(first(g.lead), 'wall'), pose: { [first(g.lead)]: 'run', [first(y)]: null }, tally: board([x, y]) },
    ], finish: { move: run(first(g.lead), 'bell'), pose: { [first(g.lead)]: null }, gong: 1, tally: tally(g, 'TIMES', u => ({ txt: fmt(secs(u)), v: 1 - (secs(u) - 140) / 200, win: g.isWin(u) })),
      dir: g.winners.length > 1
        ? `${first(g.lead)} rings the bell in ${fmt(secs(g.lead))}. ${g.winners.slice(1).map(u => `${first(u)}'s ${fmt(secs(u))}`).join(' and ')} is the best time in the other division.`
        : `${first(g.lead)} rings the bell in ${fmt(secs(g.lead))}. Nobody beats it.` } };
  },
};

// ── the Arena, game by game ───────────────────────────────────────────
// What a round or a stage of each game looks like, in that game's own terms, and its set drawn on the floor
// (until the painted set plates, art jobs D01-D11). {w} won the round or leads the stage, {l} is the other.
export const ARENA_PLAY = {
  'pole-grapple': { set: t => [{ k: 'pole', u: .5, v: .64, tilt: t.tilt || 0 }],
    round: ['{w} twists the pole out of {l}\'s hands. That\'s round {n}.', '{w} drives {l} back with their legs and rips the pole free.', '{l} slips, and {w} pulls the pole away. Round {n} to {w}.'] },
  'hallway-hustle': { set: () => [{ k: 'hallway', u: .5, v: .62 }],
    round: ['{w} runs straight through {l} and rings the bell behind.', '{w} drives {l} all the way back and rings the bell. Round {n}.', 'They hit in the middle. {w} gets past and rings it.'] },
  'tug-pit': { set: t => [{ k: 'rope', u: .5, v: .62, sag: t.sag ?? 30 }],
    round: ['{w} drags {l} to the edge of the pit and grabs the flag.', '{l} slips into the water, and {w} reaches back for the flag. Round {n}.'] },
  'ball-brawl': { set: t => [{ k: 'ballring', u: .5, v: .62, ball: t.ball || 0 }],
    round: ['{w} wrestles the ball away from {l} and throws it through the hoop.', '{w} carries the ball through {l} and scores. That\'s {n}.', '{l} gets dragged out of the ring with the ball. Point to {w}.'] },
  'knot-bomb': { set: t => [{ k: 'frames', u: .5, v: .52 }, { k: 'lockbox', u: .38, v: .7, smoke: t.done === 'L' }, { k: 'lockbox', u: .62, v: .7, smoke: t.done === 'R' }],
    stage: [['Both of them start on the knots. {w} is faster with the first few.'], ['{w} pulls the rope free and digs for the key at the end of it.'], ['{w} runs the key back to the podium.']],
    finish: '{w} opens the box, and the smoke bomb goes off.' },
  'puzzle-pit': { set: t => [{ k: 'pit', u: .5, v: .66, pieces: 1 }, { k: 'puzzle', u: .22, v: .74, n: t.nL || 0, locked: t.done === 'L' }, { k: 'puzzle', u: .78, v: .74, n: t.nR || 0, locked: t.done === 'R' }],
    stage: [['They dig through the sand for pieces. {w} has more of them.'], ['{w} runs an armful up the ramp to the board.', '{w} is fitting pieces into the board already.'], ['{l}\'s board won\'t lock. One piece is in the wrong place.', '{w} has two pieces left.']],
    finish: '{w} locks the board and hits the buzzer.' },
  'ram-wall': { set: t => [{ k: 'crates', u: .5, v: .52, smashed: [t.nL || 0, t.nR || 0] }],
    stage: [['They throw their shoulders into the crates. {w} breaks through first.'], ['{w} digs a battery out of the wreck and runs it back to the panel.'], ['{w} has two batteries in. {l} is still digging.']],
    finish: '{w} puts the third battery in, and the panel lights up.' },
  'memory-swim': { set: t => [{ k: 'buoy', u: .5, v: .44, lit: true, c: '#2fb7e8' }, { k: 'rafts', u: .5, v: .7, laid: [t.nL || 0, t.nR || 0] }],
    stage: [['They swim out to the buoy. {w} gets there first and stares at the colors.'], ['{w} swims back and starts laying tiles.'], ['{l} gets the order wrong and has to swim out to look again.', '{w} has six tiles down.']],
    finish: '{w} lays the last tile, and it\'s right.' },
  'barrel-ramp': { set: t => [{ k: 'ramps', u: .5, v: .76, up: [t.nL || 0, t.nR || 0] }],
    stage: [['They start rolling barrels up the ramp. {w} gets the first one up.'], ['A barrel gets away from {l} and rolls all the way down.', '{w} has four barrels standing.'], ['{w} is on the last few barrels.']],
    finish: '{w} stands the tenth barrel on the platform.' },
  'spin-stack': { set: t => [{ k: 'bats', u: .5, v: .56, stack: [t.nL || 0, t.nR || 0] }],
    stage: [['They spin ten times on the bats and stagger to the tables. {w} gets there first.'], ['{l}\'s tower falls over. Back to the bottom.', '{w} has five blocks up and goes back to spin again.'], ['{w} is dizzy but still stacking.']],
    finish: '{w} puts the last block on, and the tower matches the picture.' },
  'hang-time': { set: t => [{ k: 'pit', u: .5, v: .72, mud: 1 }, { k: 'bar', u: .5, v: .36, low: t.low || 0 }],
    hold: ['They\'re both still hanging. {w} looks stronger.', 'TJ lowers the bar a notch. {w} is holding on better.', 'The platform is gone. {l} is shaking.'],
    finish: '{l} lets go and drops into the mud. {w} wins it.' },
};
