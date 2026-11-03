// Kristal-talKs exit interviews — a Ridonculous Race racer's own story.
//
// The user, 2026-11-03: "theres no exit interview for the eliminated in ridonculous race". Like a Perfect Match
// islander (pm-story.js, the user 2026-10-30: "the answers are barely related to the question ... come back to her
// adventure in the show"), a racer is asked about what happened to THEM, read off the legs that aired
// (rr-run.js raceRows: rr.order, rr.how, rr.aired.segments) up to the one they went out on: their partner and how the
// two of them held up, the legs they won and the ones they came last, the team they couldn't stand, the Boomerang that
// hit them, the fear they faced, a crush, and how it ended. Read only: nothing here changes a season.

const FIGHTS = new Set(['snap', 'blame', 'silent-treatment', 'old-wound', 'sore-spot', 'dig', 'frenemy-turn', 'cold-shoulder']);
const MAKEUPS = new Set(['makeup', 'clear-the-air', 'bond-moment']);
const CLASHES = new Set(['trash-talk', 'gloat', 'shove', 'push', 'accusation', 'confront', 'mock-the-struggle', 'alliance-betrayal',
  'deal-broken', 'steal', 'ram', 'course-sabotage', 'kidnap-pet', 'fake-shortcut', 'mind-game', 'admin-sabotage', 'revenge']);
const FEARS = new Set(['phobia', 'fear-through']);
// a crush across two teams (the lovers are on the scene's two teams), and one on their own partner (scenes/crush.js)
const ROMANCE_X = new Set(['flirt', 'near-kiss', 'confession', 'confession-attempt', 'crush-confided', 'torch']);
const ROMANCE_PARTNER = new Set(['pining', 'crush-out', 'crush-jealous']);

/** The racer's story from the legs aired up to and including `row`. `teams`: gs.rr.teams (relationship, feeling). */
export function rrStory(name, row, history, teams = []) {
  const rows = (history || []).filter(r => r && r.rr && Number(r.num) <= Number(row?.num ?? Infinity));
  if (row?.rr && !rows.includes(row)) rows.push(row);
  const mine = rows.map(r => (r.rr.order || []).find(o => o.a === name || o.b === name)).find(Boolean);
  if (!mine) return null;
  const tid = mine.team;
  const partner = mine.a === name ? mine.b : mine.a;
  const t = (teams || []).find(x => x.id === tid) || null;
  const segs = rows.flatMap(r => (r.rr.aired?.segments || []).map(s => ({ ...s, leg: r.rr.leg, placeName: r.rr.placeName })));
  const ours = s => (s.teams || [])[0] === tid;
  const spoke = s => (s.lines || []).some(l => l.by === name);

  // the legs: won, last, where
  const legs = rows.filter(r => r.rr.kind !== 'final');
  const won = legs.filter(r => r.rr.order?.[0]?.team === tid).map(r => r.rr.placeName).filter(Boolean);
  const lastSafe = legs.filter(r => r.rr.kind === 'non' && r.rr.order?.at(-1)?.team === tid).length;

  // the two of them: how often they fell out on screen, and whether they made it up
  const fights = segs.filter(s => ours(s) && FIGHTS.has(s.kind)).length;
  const madeUp = segs.some(s => ours(s) && MAKEUPS.has(s.kind));

  // the team they couldn't stand: the most clashes either way
  const clash = {};
  for (const s of segs.filter(s => CLASHES.has(s.kind) && (s.teams || []).length >= 2 && s.teams.includes(tid))) {
    const other = s.teams.find(x => x !== tid);
    if (!other) continue;
    (clash[other] ||= { team: other, n: 0, theyStarted: 0 }).n++;
    if (s.teams[0] === other) clash[other].theyStarted++;
  }
  const top = Object.values(clash).sort((a, b) => b.n - a.n)[0] || null;
  const teamRow = id => rows.map(r => (r.rr.order || []).find(o => o.team === id)).find(Boolean);
  const rival = top ? { names: [teamRow(top.team)?.a, teamRow(top.team)?.b].filter(Boolean), name: teamRow(top.team)?.name || null,
    n: top.n, theyStarted: top.theyStarted > top.n / 2 } : null;

  // the Boomerang: hit by it (teams[0] is the team it hit, teams[1] who threw it, or who they guessed)
  const hit = [...segs].reverse().find(s => s.kind === 'boomerang-hit' && ours(s));
  const thrower = hit && hit.ending !== 'blind-guess' ? teamRow(hit.teams?.[1]) : null;
  const boomerang = hit ? { by: thrower ? [thrower.a, thrower.b].filter(Boolean) : null, blind: hit.ending === 'blind-guess', place: hit.placeName || null } : null;

  // the fear they faced (theirs: they spoke in it), a crush
  const fear = [...segs].reverse().find(s => FEARS.has(s.kind) && ours(s) && spoke(s));
  // (their own: a romance scene's lines include the lovers' partners, so only somebody on the OTHER team, who spoke)
  const other = s => { const o = (s.teams || []).find(x => x !== tid); const tr = o ? teamRow(o) : null; return tr ? [tr.a, tr.b] : []; };
  const crossed = segs.find(s => ROMANCE_X.has(s.kind) && (s.teams || []).includes(tid) && spoke(s)
    && (s.lines || []).some(l => other(s).includes(l.by)));
  const crushWith = crossed ? (crossed.lines || []).map(l => l.by).find(x => other(crossed).includes(x)) || null : null;
  const onPartner = (t?.feel0 || t?.feel) === 'crush' && segs.some(s => ROMANCE_PARTNER.has(s.kind) && ours(s));

  // how it ended
  const how = (row?.exits || []).find(x => x.name === name)?.channel || null;
  return {
    partner: { who: partner, rel: t?.rel || null, feel: t?.feel0 || t?.feel || null, fights, madeUp },
    won, lastSafe, legs: legs.length, rival, boomerang,
    fear: fear ? { place: fear.placeName || null } : null,
    crush: onPartner ? { who: partner, partner: true } : crushWith ? { who: crushWith } : null,
    how,
    lastPlace: row?.rr?.placeName || null,
  };
}
