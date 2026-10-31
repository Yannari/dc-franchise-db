// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-context-tapes.js — a tape before every moment of the prime
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-31: "we need a tape before every moment in the prime, like tape often give context, like night
// of the dilemma 'x and y started flirting in the house, it's them versus the rest' etc, a whole narration with
// flashback dialogue, and right after, a dilemma concerning the two that could break them... tape can be harmless
// and just give recap of what happened... the prime theme appear all over the night".
//
// Before each live moment of the prime (a dilemma, a mission's result, the golden buzz, a buzz's answer, a themed
// night's segment...), a tape: its title card (the night's name on it when the night has a theme), the narrator on
// what happened between the people the moment is about this week, the lines they actually said in the days played
// back as a flashback, and the way into the moment. Built from the week's own screens and acts, after they are laid
// out (steps.js's Secret Story pass), so a flashback is only ever something that aired.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const listOf = xs => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
const STUDIO = { set: 'studio-wide', plate: 'ss-studio', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio', cast: [] };
const ON_TAPE = { set: 'ceremony', plate: 'living-sofas', room: 'Living Room', cam: 1, kicker: 'This week, on tape' };
const xs = n => (n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(30 + (40 * i) / (n - 1))));

// the prime's own frame, and what already is a tape: no tape before these
const NO_TAPE = /^bb-ss-prime-(voice|package|open|chat|airlock|kitties|verdict|walk|mag|tape|break)|^bb-ss-after-/;
const nameOf = c => (Array.isArray(c) ? c[0] : c);

/** Who a screen is about: the people who talk in it most, two at most. */
function peopleOf(s, cast, skip) {
  // (a buzz's answer: the two on the stools, by its id; the prime fills that room with the whole house)
  const rv = /^bb-ss-prime-reveal-([^-]+)-([^-]+)-w\d+$/.exec(String(s.id || ''));
  if (rv && cast.includes(rv[1]) && cast.includes(rv[2])) return [rv[1], rv[2]];
  const n = new Map();
  for (const st of s.steps || []) {
    if ((st.k === 'say' || st.k === 'dr') && cast.includes(st.by) && !skip.includes(st.by)) n.set(st.by, (n.get(st.by) || 0) + 2);
    for (const c of st.scene?.cast || []) { const w = nameOf(c); if (cast.includes(w)) n.set(w, (n.get(w) || 0) + 0.25); }
  }
  for (const c of s.cast || []) { const w = nameOf(c); if (cast.includes(w)) n.set(w, (n.get(w) || 0) + 1); }
  return [...n.entries()].filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 2);
}

/** What the week was between two people (or for one), from the acts and the bond. */
function storyOf(acts, who, bond) {
  const [x, y] = who;
  if (!y) return { kind: 'solo' };
  const both = (a, b) => [a, b].includes(x) && [a, b].includes(y);
  const party = acts.filter(a => a?.type === 'ss-party').flatMap(a => a.moments || []);
  if (acts.some(a => a?.type === 'ss-love' && both(a.a, a.b)) || party.some(m => m.kind === 'kiss' && both(...(m.who || [])))) return { kind: 'couple' };
  const buzz = acts.find(a => a?.type === 'ss-buzz' && both(a.by, a.target));
  if (buzz) return { kind: 'buzz', buzz };
  if (party.some(m => m.kind === 'fight' && both(...(m.who || []))) || bond(x, y) <= -3) return { kind: 'feud' };
  if (bond(x, y) >= 4) return { kind: 'close' };
  return { kind: 'apart' };
}

/** The narrator on the week (two or three lines). */
// `held(b)`: that buzz's answer is still to come tonight, on the prime: never said before it airs
function narration(story, who, acts, noms, k, held) {
  const [x, y] = who;
  if (story.kind === 'couple') return [
    pickBy([`This week, ${x} and ${y} could not stay away from each other.`, `It started with long talks, late at night. By the end of the week, ${x} and ${y} were never apart.`], `${k}|c0`),
    pickBy([`The whole house noticed. And in this game, a couple is two votes that always go together.`, `For the rest of the house, it is simple now: it is ${x} and ${y} against everybody else.`], `${k}|c1`),
  ];
  if (story.kind === 'buzz') {
    const b = story.buzz;
    return [
      `This week, ${b.by} went into the confessional and pressed the buzzer on ${b.target}.`,
      b.outcome === 'withdrawn' ? `Face to face, ${b.target} gave nothing away, and ${b.by} backed out.` : held(b) ? `${b.by} confirmed it. The answer comes tonight, live.` : b.outcome === 'right' ? `${b.by} was right. ${b.target}'s secret, and ${b.target}'s money, were gone.` : `${b.by} was wrong, and paid five thousand dollars for it, to ${b.target}.`,
      `${b.target} has not forgotten it.`,
    ];
  }
  if (story.kind === 'feud') return [
    pickBy([`Between ${x} and ${y}, it has been tense all week.`, `${x} and ${y} have not had one easy conversation this week.`], `${k}|f0`),
    pickBy([`The house has felt it. When one of them talks, the other goes quiet.`, `Everybody in the house has picked up on it, and nobody wants to be caught in the middle.`], `${k}|f1`),
  ];
  if (story.kind === 'close') return [
    pickBy([`${x} and ${y} have stuck together all week.`, `All week, wherever ${x} was, ${y} was not far.`], `${k}|a0`),
    pickBy([`In a house where everybody hides something, they trust each other. For now.`, `They tell each other what they hear. And so far, it has worked.`], `${k}|a1`),
  ];
  if (story.kind === 'apart') return [
    pickBy([`${x} and ${y} have hardly spoken to each other this week.`, `${x} and ${y} have spent this week in different corners of the house.`], `${k}|p0`),
    `Tonight, the Voice puts them side by side.`,
  ];
  // one person's week, from what they did
  const facts = [];
  if (noms.includes(x)) facts.push(`${x} is nominated tonight, and has known it for days.`);
  const bz = acts.find(a => a?.type === 'ss-buzz' && a.by === x);
  if (bz) facts.push(bz.outcome === 'withdrawn' ? `${x} pressed the buzzer on ${bz.target} this week, then backed out.` : held(bz) ? `${x} pressed the buzzer on ${bz.target} this week, and confirmed it.` : `${x} pressed the buzzer on ${bz.target} this week, and was ${bz.outcome === 'right' ? 'right' : 'wrong'}.`);
  const hit = acts.find(a => a?.type === 'ss-buzz' && a.target === x && a.outcome !== 'withdrawn');
  if (hit) facts.push(`${hit.by} came after ${x}'s secret this week.`);
  const clue = acts.find(a => a?.type === 'ss-clue' && a.got === x);
  if (clue) facts.push(`In the confessional, the Voice handed ${x} a clue this week.`);
  if (acts.some(a => a?.type === 'ss-rule' && a.who === x)) facts.push(`${x} broke one of the Voice's commandments this week.`);
  return facts.length ? facts.slice(0, 2) : [pickBy([`${x} has kept a low profile this week.`, `It has been a quiet week for ${x}. On the surface.`], `${k}|s0`)];
}

/** The lines they actually said in the days: an exchange between the two, and a confessional. */
function flashback(daily, who) {
  const [x, y] = who;
  const ex = [], drs = [];
  // (a buzz's confrontation is its own story: its lines are not somebody's week)
  for (const s of daily.filter(d => !d.buzzOf)) {
    let scene = { set: s.set, plate: s.plate, room: s.room, cam: s.cam, cast: s.cast || [] };
    const steps = s.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      if (st.scene) scene = { ...scene, ...st.scene };
      const line = String(st.t || '');
      if (line.length < 18 || /^["'‘“]/.test(line)) continue;
      const here = (scene.cast || []).map(nameOf);
      if (st.k === 'dr' && (y ? (st.by === x && line.includes(y)) || (st.by === y && line.includes(x)) : st.by === x)) drs.push({ st, scene });
      if (st.k !== 'say') continue;
      if (y) {
        const nx = steps[i + 1];
        if ((st.by === x || st.by === y) && here.includes(x) && here.includes(y) && nx?.k === 'say' && (nx.by === x || nx.by === y) && nx.by !== st.by && String(nx.t || '').length >= 12 && !/^["'‘“]/.test(String(nx.t))) ex.push([{ st, scene }, { st: nx, scene }]);
      } else if (st.by === x) ex.push([{ st, scene }]);
    }
  }
  // (the exchange that says the most: one that names somebody, asks something, and is more than a word)
  const named = t => /\b[A-Z][a-z]+\b/.test(String(t).replace(/^\S+/, ''));
  const score = e => e.reduce((v, { st }) => v + Math.min(2, String(st.t).length / 40) + (named(st.t) ? 1.5 : 0) + (/\?$/.test(String(st.t).trim()) ? 0.5 : 0), 0);
  const pickEx = ex.slice().sort((a, b) => score(b) - score(a))[0] || [];
  const dr = drs.slice().sort((a, b) => score([b]) - score([a]))[0];
  const out = [...pickEx, ...(dr ? [dr] : [])].slice(0, 4);
  return out.map(({ st, scene }, i) => ({ k: st.k, by: st.by, t: st.t, flashback: true,
    ...(i === 0 ? { toast: ['FLASHBACK', '#8b8fa3'] } : {}),
    ...(st.k === 'dr' ? {} : { scene: { ...scene, kicker: `Earlier this week · ${scene.room || 'The house'}` } }) }));
}

/** The way into the moment. */
function into(s, who, k) {
  const id = String(s.id || '');
  const p = listOf(who);
  if (/^bb-ss-prime-dil-/.test(id)) return who[1] ? `Tonight, the Voice has a dilemma for ${who[0]}. And ${who[1]} is part of it.` : `Tonight, the Voice has a dilemma for ${who[0]}.`;
  if (/^bb-ss-missionres-/.test(id)) return `Tonight, live, ${p} find${who.length > 1 ? '' : 's'} out if the mission worked.`;
  if (/^bb-ss-prime-reveal-/.test(id)) return 'Tonight, live, in front of the whole house: the answer.';
  if (/^bb-ss-prime-goldenbuzz/.test(id)) return `Tonight, ${p} could walk away with the golden buzz.`;
  return pickBy([`Tonight, all eyes are on ${p}.`, `And tonight, live, it is ${p}'s turn.`], `${k}|in`);
}

/**
 * Puts a tape before every moment of the prime. Mutates `out`.
 * @param {any[]} out the week's screens, laid out
 * @param {{ row: any, ctx: any, partOf: (s: any) => string, bond: (a: string, b: string) => number }} o
 */
export function ssContextTapes(out, { row, ctx, partOf, bond }) {
  const acts = row?.acts || [];
  const prime = acts.find(a => a?.type === 'ss-prime');
  if (!prime) return out;
  const cast = (row.houseAtStart || []).filter(Boolean);
  const host = ctx.host || 'Josh';
  const skip = [host, 'The Voice'];
  const noms = prime.nominees || [];
  const daily = out.filter(s => partOf(s) === 'daily');
  // the night's name on every tape when the night has a theme (the theme all night)
  const sub = prime.name || 'This week';
  // what a tape already told (the night's packages, ss-magneto.js)
  const told = new Set(out.filter(s => partOf(s) === 'prime').flatMap(s => (s.steps || []).filter(st => st.magneto?.who?.length).map(st => [...st.magneto.who].sort().join('|'))));
  const taped = new Set();
  let n = 0;
  for (let i = 0; i < out.length; i++) {
    const s = out[i];
    const id = String(s?.id || '');
    // (the prime's own moments only: never the house that night, after it)
    if (partOf(s) !== 'prime' || s.ssAfterPrime || !/^bb-ss-(prime|missionres)-/.test(id) || NO_TAPE.test(id) || /-c[1-9]\d*$/.test(id)) continue;
    const who = peopleOf(s, cast, skip);
    if (!who.length) continue;
    const key = [...who].sort().join('|');
    // (the night's own package already told this story, right before it)
    // (and one story is told once a night: a second moment for the same people goes straight in)
    if (told.has(key) && (/^bb-ss-prime-(mag|tape)/.test(String(out[i - 1]?.id || '')) || taped.has(key))) continue;
    taped.add(key);
    const k = `${ctx.week}|tape|${id}`;
    const story = storyOf(acts, who, bond);
    const held = b => out.findIndex((x, j) => j >= i && (x.id === `bb-ss-prime-reveal-${b.by}-${b.target}-w${ctx.week}` || (x.merged || []).includes(`bb-ss-prime-reveal-${b.by}-${b.target}-w${ctx.week}`))) >= 0;
    const title = story.kind === 'couple' ? `${who[0]} and ${who[1]}` : story.kind === 'feud' || story.kind === 'buzz' ? `${who[0]} versus ${who[1]}` : who[1] ? `${who[0]} and ${who[1]}` : `${who[0]}'s week`;
    const sym = story.kind === 'couple' ? '♥' : story.kind === 'feud' || story.kind === 'buzz' ? 'VS' : '';
    const scene = { ...ON_TAPE, cast: who.map((w, j) => [w, xs(who.length)[j]]) };
    /** @type {any[]} */ const steps = [
      { k: 'host', by: host, scene: STUDIO, t: ['Before that, a look at the week.', "First, let's see how we got here.", "Here's what happened in the house.", 'Before we go live, the tape.', "Let's go back a few days."][(n + (ctx.week || 0)) % 5] },
      { k: 'beat', t: title, magneto: { title, sub, who, sym }, scene },
      ...narration(story, who, acts, noms, k, held).map((t, j) => ({ k: 'beat', t, ...(j === 0 ? { scene } : {}) })),
      ...flashback(daily, who),
      { k: 'beat', t: into(s, who, k), scene: { ...ON_TAPE, kicker: 'Tonight, live', cast: who.map((w, j) => [w, xs(who.length)[j]]) } },
    ];
    told.add(key);
    out.splice(i, 0, { id: `bb-ss-prime-tape-${n}-w${ctx.week}`, kind: 'twist', anchor: s.anchor, day: s.day, time: 'LIVE', ...STUDIO, sceneful: true, ss: true,
      kicker: 'The week, on tape', title, label: `The Tape: ${s.label || s.title || who.join(' & ')}`, sub, steps });
    i++; n++;
  }
  return out;
}
