// ══════════════════════════════════════════════════════════════════════
// ch/script/rankings.js — TJ reads his power rankings out loud
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "TJ's power rankings were more important than that, barely anyone reacting". TJ reads
// the bottom three from the bottom, the biggest fall and the biggest climb, then counts down the top five to
// number one; everybody named answers. One telling for the stepped viewer (vp-ch-ep/steps.js draws a place chip
// on each) and the text backlog (ch/transcript.js prints the same lines). The ranking is stakes.js's.
const hashOf = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (list, key) => list[hashOf(key) % list.length];

const OPEN = ["Good morning, beautiful people! You know what day it is. Power rankings! I watched every daily, every vote and every fight, and here's where you all stand.",
  "Everybody up! Coffee later. I've ranked every single one of you, top to bottom, and I'm reading it out loud.",
  "Rankings time! Some of you are going to love me today. Some of you are going to hate me. Let's go."];
const UP = ["Up {n}! Let's go!", "See? I told you.", 'Finally, some respect.', 'Climbing. Keep watching.'];
const DOWN = ['Down {n}? Seriously?', 'That is a joke.', "I'll remember that, TJ.", 'Based on what?'];
const SAME = ['I can live with that.', "Fine. I'll take it.", "That's fair, honestly.", 'Okay.'];
const NEW = ['Not bad for a first list.', "I'll take it.", 'Watch me move up.'];
const LAST = ["Last? I'm going to prove you wrong, TJ.", 'Wow. Thanks for that.', 'Last is just a number.', 'Good. Underestimate me.'];
const FIRST = ["That's a target on my back, and you know it, TJ.", "I'll take it. I earned it.", "Great. Now everybody's coming for me.", 'Number one. Say it again.'];
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));

/** The reading: [{ kind: 'tj' | 'say', by, text, fx: { who, rank, move } }]. */
export function rankLines(rows = [], { seed = '' } = {}) {
  if (!rows.length) return [];
  const out = [];
  const used = new Set();
  const pick = (list, k) => { const free = list.filter(x => !used.has(x)); const t = pickBy(free.length ? free : list, `${seed}|${k}`); used.add(t); return t; };
  const move = r => (r.was ? r.was - r.rank : null);
  const react = (r, k) => {
    const m = move(r);
    const list = r.rank === 1 ? FIRST : r.rank === rows.length ? LAST : m == null ? NEW : m > 0 ? UP : m < 0 ? DOWN : SAME;
    out.push({ kind: 'say', by: r.n, text: fill(pick(list, k), { n: Math.abs(m || 0) }), fx: { who: r.n, rank: r.rank, move: m } });
  };
  out.push({ kind: 'tj', by: 'TJ', text: pickBy(OPEN, `${seed}|open`), fx: {} });
  const n = rows.length;
  // the bottom three, from the very bottom
  const bottom = rows.slice(-3).reverse();
  bottom.forEach((r, i) => {
    out.push({ kind: 'tj', by: 'TJ', text: i === 0 ? `At the very bottom, number ${n}: ${r.n}.` : `Number ${r.rank}: ${r.n}.`, fx: { who: r.n, rank: r.rank, move: move(r) } });
    react(r, `b${i}`);
  });
  // the biggest fall and the biggest climb, out of the middle of the list
  const mid = rows.slice(5, -3);
  const fall = [...mid].filter(r => (move(r) || 0) <= -2).sort((x, y) => move(x) - move(y))[0];
  const climb = [...mid].filter(r => (move(r) || 0) >= 2).sort((x, y) => move(y) - move(x))[0];
  if (fall) { out.push({ kind: 'tj', by: 'TJ', text: `Biggest fall this week: ${fall.n}, down ${-move(fall)} to number ${fall.rank}.`, fx: { who: fall.n, rank: fall.rank, move: move(fall) } }); react(fall, 'fall'); }
  if (climb) { out.push({ kind: 'tj', by: 'TJ', text: `Biggest climb: ${climb.n}, up ${move(climb)} to number ${climb.rank}.`, fx: { who: climb.n, rank: climb.rank, move: move(climb) } }); react(climb, 'climb'); }
  // the top five, counting down
  const top = rows.slice(0, Math.min(5, n - 3)).reverse();
  top.forEach((r, i) => {
    const one = r.rank === 1;
    out.push({ kind: 'tj', by: 'TJ', text: one ? `And number one this week... ${r.n}!` : r.rank === 2 ? `Number two: ${r.n}. So close.` : `Number ${r.rank}: ${r.n}.`, fx: { who: r.n, rank: r.rank, move: move(r), top: one } });
    if (one || r.rank === 2 || (move(r) || 0) !== 0) react(r, `t${i}`);
  });
  return out;
}
