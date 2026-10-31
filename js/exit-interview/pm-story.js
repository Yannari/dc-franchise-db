// Kristal-talKs exit interviews — a Perfect Match islander's own story.
//
// The user, 2026-10-30: "the podcast barely asks interesting questions and the
// answers are barely related to the question. Is she still in love with Dante?
// Come back to her adventure in the show: her couple, her fight, her
// friendship, her triangle, her drama." What the aired rows say happened to
// the guest, read when they leave (js/exit-interview/aired.js): who they were
// coupled with and how they feel about them now, the ex they still love, the
// one they fought with, their best friend, the night they were stolen from or
// turned on, and how they went. Read only: nothing here changes a season.
//
// Feelings come from the row's relationship snapshot (pm/season.js
// relationshipSnapshot: `a→b` = [romance, friendship, shown, believed]), taken
// from the last row the guest was still in the villa.

const FIGHTS = new Set(['argument', 'jealous-confront', 'told-confront', 'blowup', 'enemy-clash', 'enemy-snipe', 'rival-row',
  'feud-confront', 'camp-confront', 'camp-clash', 'grudge-clash', 'betray-confront', 'grass-confront', 'vote-callout', 'chal-row']);
const pairOf = (couples, n) => { const c = (couples || []).find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

/** The guest's story from the rows aired up to and including `row`. */
export function pmStory(name, row, history) {
  const rows = (history || []).filter(r => r && (r.format === 'perfect-match' || r.pm) && Number(r.num) <= Number(row?.num ?? Infinity));
  if (!rows.some(r => r === row)) rows.push(row);
  const inVilla = rows.filter(r => (r.pm?.villa || []).includes(name) || (r.pm?.couplesBefore || []).some(c => c.includes(name)));
  if (!inVilla.length) return null;
  // How they feel, read on the last night they were in.
  const snapRow = [...rows].reverse().find(r => Object.keys(r.pm?.relationships || {}).some(k => k.startsWith(`${name}→`))) || null;
  const rel = snapRow?.pm?.relationships || {};
  const feel = x => rel[`${name}→${x}`]?.[0] ?? 0;
  const friend = x => rel[`${name}→${x}`]?.[1] ?? 0;
  const theirs = x => rel[`${x}→${name}`]?.[0] ?? null;

  // Every partner, in order; the last one is who they left beside or behind.
  const partners = [];
  for (const r of rows) for (const cs of [r.pm?.couplesBefore, r.pm?.couples]) {
    const p = pairOf(cs, name);
    if (p && partners[partners.length - 1] !== p) partners.push(p);
  }
  const last = pairOf(row?.pm?.couplesBefore, name) || partners[partners.length - 1] || null;
  const villaNow = row?.pm?.villa || [];
  const partner = last ? { who: last, feel: feel(last), theirs: theirs(last), stays: villaNow.includes(last),
    weeks: Math.max(1, rows.filter(r => pairOf(r.pm?.couples, name) === last).length) } : null;
  // An ex they still feel for: someone they were with before, not the last.
  const exes = [...new Set(partners.filter(p => p !== last))];
  const ex = exes.map(x => ({ who: x, feel: feel(x), stays: villaNow.includes(x) })).sort((a, b) => b.feel - a.feel)[0] || null;
  // The one they wanted most, if it wasn't who they were with.
  const crush = Object.keys(rel).filter(k => k.startsWith(`${name}→`)).map(k => k.split('→')[1])
    .filter(x => x !== last && feel(x) >= 5 && feel(x) > (last ? feel(last) : 0) + 1).sort((a, b) => feel(b) - feel(a))[0] || null;

  const events = rows.flatMap(r => (r.pm?.events || []).filter(e => e.aired !== false).map(e => ({ ...e, ep: r.num })));
  const mine = e => e.players?.slice(0, 2).includes(name);
  // Who they fought with most, and what about.
  const fights = {};
  for (const e of events.filter(e => FIGHTS.has(e.kind) && mine(e))) {
    const o = e.players.slice(0, 2).find(n => n !== name);
    if (!o) continue;
    (fights[o] ||= { who: o, n: 0, cause: null, mine: true }).n++;
    // A row's cause is said from its starter's side (pm/events.js argumentReasons):
    // "{b} took {about} from {a}" is the other way round when the guest is {b}.
    if (e.extra?.cause) { fights[o].cause = e.extra.cause; fights[o].mine = e.players[0] === name; }
  }
  const fight = Object.values(fights).sort((a, b) => b.n - a.n)[0] || null;
  if (fight) { fight.partner = fight.who === last || partners.includes(fight.who); fight.feel = feel(fight.who); }
  // Their best friend: the strongest friendship that was never a romance.
  const bestFriend = Object.keys(rel).filter(k => k.startsWith(`${name}→`)).map(k => k.split('→')[1])
    .filter(x => !partners.includes(x) && friend(x) >= 3 && feel(x) < 3).sort((a, b) => friend(b) - friend(a))[0] || null;

  // The nights that happened to them.
  const turned = [...events].reverse().find(e => e.kind === 'graft-turn' && e.players[1] === name);
  const robbed = [...events].reverse().find(e => (e.kind === 'recouple-pick' && e.extra?.stole && e.players[2] === name) || (e.kind === 'steal' && e.players[2] === name));
  const stole = [...events].reverse().find(e => (e.kind === 'recouple-pick' && e.extra?.stole && e.players[0] === name) || (e.kind === 'steal' && e.players[0] === name));
  const told = [...events].reverse().find(e => e.kind === 'gossip' && e.players[1] === name);
  const ended = [...events].reverse().find(e => e.kind === 'doubt-end' && e.extra?.of === 'friends' && e.players[1] === name);
  const tonight = (row?.pm?.events || []);
  const unfair = tonight.find(e => e.kind === 'dump-unfair' && e.players.slice(0, 2).includes(name));
  const bitter = tonight.some(e => e.kind === 'dump-goodbye' && e.players[0] === name && e.extra?.bitter);
  const loveSaid = events.some(e => e.kind === 'love-said' && e.players.includes(name) && e.players.includes(last));
  return {
    partner, ex, crush, fight, bestFriend, loveSaid,
    turnedOn: turned ? { by: turned.players[0], for: turned.players[2] || null } : null,
    robbed: robbed ? { by: robbed.players[0], took: robbed.players[1] } : null,
    stole: stole ? { took: stole.players[1], from: stole.players[2] } : null,
    cheatedOn: told ? { by: told.players[2] || null } : null,
    endedBy: ended ? ended.players[0] : null,
    unfair: unfair ? { with: unfair.players.slice(0, 2).find(n => n !== name) || null } : null,
    bitter,
    days: inVilla.length,
  };
}
