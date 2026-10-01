// ══════════════════════════════════════════════════════════════════════
// ci/web-data.js — the Circle web: who is what to whom, and what moved
// ══════════════════════════════════════════════════════════════════════
//
// PURE: two end-of-episode snapshots in (ci/snapshot.js: this episode's and
// the last one's), the ties and the changes out. The web screen draws them;
// the text backlog prints the same changes.
//   ties     { a, b, kind: bond | grudge | crush | mutual, w: 1..3 }
//   changes  { kind, text, a?, b?, alliance? } — most important first
export const BOND_AT = 4;      // mutual affection that reads as close
export const GRUDGE_AT = 2;    // resentment either way that reads as a grudge
export const CRUSH_AT = 5.5;   // attraction one way, for a person's single strongest pull
export const CLOSER = 1.2;     // affection gained since last episode that counts as "closer"

const get = (end, a, b) => end?.rel?.[`${a}>${b}`] || [0, 0, 0, 0];
const level = (v, lo, hi) => (v >= hi ? 3 : v >= (lo + hi) / 2 ? 2 : 1);

/** Every tie between two players still in, at the end of an episode — read
 *  the way a person reads a room: each one's single strongest crush (mutual
 *  when they are each other's), their few closest, their worst grudges. */
export const TOP_BONDS = 3, TOP_GRUDGES = 2;
export function tiesOf(end) {
  if (!end) return [];
  const people = end.people || [];
  const out = [];
  const pair = (a, b) => [a, b].sort().join('|');
  // Crushes: who each one is most drawn to, if it is strong.
  const crushOf = {};
  for (const a of people) {
    const best = people.filter(b => b !== a).map(b => [b, get(end, a, b)[1]]).sort((x, y) => y[1] - x[1])[0];
    if (best && best[1] >= CRUSH_AT) crushOf[a] = best;
  }
  const loveDone = new Set();
  for (const [a, [b, v]] of Object.entries(crushOf)) {
    if (loveDone.has(pair(a, b))) continue;
    loveDone.add(pair(a, b));
    if (crushOf[b]?.[0] === a) out.push({ a, b, kind: 'mutual', w: level((v + crushOf[b][1]) / 2, CRUSH_AT, 9) });
    else out.push({ a, b, kind: 'crush', w: level(v, CRUSH_AT, 9) });
  }
  // Closeness and grudges: each one's few, kept if it is in either's few.
  const topOf = (a, score, min, n) => people.filter(b => b !== a).map(b => [b, score(a, b)]).filter(([, v]) => v >= min)
    .sort((x, y) => y[1] - x[1]).slice(0, n).map(([b]) => b);
  const aff = (a, b) => (get(end, a, b)[0] + get(end, b, a)[0]) / 2;
  const res = (a, b) => Math.max(get(end, a, b)[2], get(end, b, a)[2]);
  const bonds = new Set(), grudges = new Set();
  for (const a of people) {
    for (const b of topOf(a, res, GRUDGE_AT, TOP_GRUDGES)) grudges.add(pair(a, b));
    for (const b of topOf(a, aff, BOND_AT, TOP_BONDS)) bonds.add(pair(a, b));
  }
  for (const k of grudges) { const [a, b] = k.split('|'); out.push({ a, b, kind: 'grudge', w: level(res(a, b), GRUDGE_AT, 6) }); }
  for (const k of bonds) { if (grudges.has(k)) continue; const [a, b] = k.split('|'); out.push({ a, b, kind: 'bond', w: level(aff(a, b), BOND_AT, 9) }); }
  return out;
}

const key = t => `${t.kind === 'mutual' || t.kind === 'crush' ? 'love' : t.kind}:${[t.a, t.b].sort().join('|')}`;

/** What moved between two snapshots, in words a host could say. */
export function changesOf(prev, cur, nameOf) {
  if (!cur) return [];
  const N = h => nameOf(h);
  const out = [];
  // Who left tonight.
  for (const h of cur.leftToday || []) out.push({ kind: 'blocked', a: h, text: `${N(h)} was blocked and left The Circle.`, rank: 0 });
  // Alliances: formed, lost somebody, came apart.
  const before = new Map((prev?.alliances || []).map(a => [a.id, a]));
  for (const al of cur.alliances || []) {
    const was = before.get(al.id);
    if (!was && al.status === 'active') out.push({ kind: 'formed', alliance: al.id, text: `${al.name} formed: ${al.members.map(N).join(', ')}.`, rank: 1 });
    if (!was) continue;
    const gone = was.members.filter(m => !al.members.includes(m));
    const out1 = gone.filter(m => !(cur.leftToday || []).includes(m)), blocked1 = gone.filter(m => (cur.leftToday || []).includes(m));
    if (was.status === 'active' && al.status === 'broken') out.push({ kind: 'broken', alliance: al.id, a: al.brokenBy?.[0], text: `${al.name} broke: ${N(al.brokenBy?.[0])} turned on their own.`, rank: 1 });
    else if (was.status === 'active' && al.status === 'over') {
      // One event, one line: why it ended.
      out.push({ kind: 'broken', alliance: al.id, a: out1[0] || blocked1[0], text: out1.length ? `${N(out1[0])} is out of ${al.name}, and that's the end of it.`
        : blocked1.length ? `With ${N(blocked1[0])} blocked, ${al.name} is over.` : `${al.name} is over.`, rank: 2 });
    } else for (const m of out1) out.push({ kind: 'left', alliance: al.id, a: m, text: `${N(m)} is out of ${al.name}.`, rank: 2 });
  }
  // Ties: new crushes and sparks, new grudges, new closeness, and who got closer.
  const old = new Map(tiesOf(prev).map(t => [key(t), t]));
  const present = new Set(cur.people || []);
  for (const t of tiesOf(cur)) {
    const was = old.get(key(t));
    if (t.kind === 'mutual' && was?.kind !== 'mutual') out.push({ kind: 'mutual', a: t.a, b: t.b, text: `${N(t.a)} and ${N(t.b)}: a spark, both ways.`, rank: 3 });
    else if (t.kind === 'crush' && !was) out.push({ kind: 'crush', a: t.a, b: t.b, text: `${N(t.a)} has a crush on ${N(t.b)}.`, rank: 4 });
    else if (t.kind === 'grudge' && !was) out.push({ kind: 'grudge', a: t.a, b: t.b, text: `${N(t.a)} and ${N(t.b)} have a grudge now.`, rank: 4 });
    else if (t.kind === 'bond' && !was && prev?.people?.includes(t.a) && prev?.people?.includes(t.b)) out.push({ kind: 'bond', a: t.a, b: t.b, text: `${N(t.a)} and ${N(t.b)} are close now.`, rank: 5 });
  }
  if (prev) {
    const people = cur.people || [];
    people.forEach((a, i) => people.slice(i + 1).forEach(b => {
      if (!prev.people?.includes(a) || !prev.people?.includes(b)) return;
      const now = (get(cur, a, b)[0] + get(cur, b, a)[0]) / 2, then = (get(prev, a, b)[0] + get(prev, b, a)[0]) / 2;
      const already = out.some(c => (c.kind === 'bond' || c.kind === 'mutual') && [c.a, c.b].sort().join('|') === [a, b].sort().join('|'));
      if (!already && now - then >= CLOSER && now >= BOND_AT) out.push({ kind: 'closer', a, b, text: `${N(a)} and ${N(b)} got closer.`, rank: 6, by: now - then });
    }));
  }
  // A tie that was there last episode, between two still in, and is gone.
  for (const [, t] of old) {
    if (!present.has(t.a) || !present.has(t.b)) continue;
    if (!tiesOf(cur).some(x => key(x) === key(t)) && t.kind === 'bond') out.push({ kind: 'cooled', a: t.a, b: t.b, text: `${N(t.a)} and ${N(t.b)} have cooled off.`, rank: 7 });
  }
  // At most two crush lines: the night's other moves get room.
  let crushes = 0;
  return out.sort((x, y) => x.rank - y.rank || (y.by || 0) - (x.by || 0))
    .filter(c => c.kind !== 'crush' || ++crushes <= 2).slice(0, 8);
}
