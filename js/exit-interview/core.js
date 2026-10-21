// Kristal-talKs exit interviews — the show-blind core.
//
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
//
// The user, 2026-10-21: Kristal only records between seasons, "but we need her
// to do exit interviews too during the season" — every boot, the week they
// leave, like RHAP's Big Brother exit interviews. And it is a podcast, so it
// changes things: fans move, and the people it names hear it — "depending if
// that person heard their podcast before or after they get out" — and answer
// back in their own.
//
// ── DECIDED HERE, WRITTEN ON THE SITE ──
//
// This file decides WHAT the interview is: the kind of exit, the guest's mood,
// the segments, who gets named and how, the winner they predict, and what it
// does. The words are composed on kristal.html (js/kristal-exit.js) from this
// record, so nothing in the simulator prints a line and no number here depends
// on which words get drawn.
//
// ── THEY ONLY KNOW WHAT THEY KNEW ──
//
// A show adapter builds the FACTS from what the guest could know the night they
// left: who they suspect comes from their perceived bonds and can be wrong.
// The aired truth — who actually flipped — is Kristal's, because the audience
// watched the ballots; she plays it to them on 'the tape'.
//
// ── HEARD, NOT SAID ──
//
// Bonds move when a named person HEARS it, not when it is recorded. The
// adapter says who can hear right now (out and not sequestered);
// deliverInterviews stamps `heardBy` so nothing is heard twice.

export const EXIT_KINDS = ['first-boot', 'blindside', 'seen-it-coming', 'backdoor', 'walked',
  'expelled', 'medical', 'lost-challenge', 'lost-duel', 'murdered', 'lip-sync', 'dumped', 'blocked',
  'lost-elimination', 'showmance', 'double', 'finalist', 'again'];
export const MOODS = ['bitter', 'gracious', 'denial', 'relieved', 'gutted', 'elated'];
export const SEGMENTS = ['the-tape', 'answer-back', 'fan-mail', 'rank-them', 'message-in',
  'caller', 'who-next'];
export const STANCES = ['blame', 'drag', 'warn', 'praise', 'miss', 'respect'];

// Nice archetypes never scheme, sabotage or go vicious (CLAUDE.md).
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
// `lost-challenge`: a show that eliminates by challenge (Total Drama's
// sudden death, a duel) — nobody wrote a name down.
// `lost-duel`: voted out earlier, then beaten on a return path (Redemption Island).
// The other shows' doors, none of them a vote the guest lost: murdered in the
// night (The Traitors), sent home after a lip sync (Drag Race), dumped (Perfect
// Match), blocked (The Circle), beaten in an elimination (The Challenge).
const NO_VOTE = new Set(['walked', 'expelled', 'medical', 'lost-challenge', 'lost-duel', 'finalist',
  'murdered', 'lip-sync', 'dumped', 'blocked', 'lost-elimination']);

/** How hard each stance lands on the person who hears it, before temperament. */
// Calibrated on five seeded twelve-person Big Brother seasons (2026-10-21):
// at the first draft (drag -1.6) a season's hearings summed to about -35 and
// added up to five pairs past the export's bad-blood line (-5). A podcast is a
// lighter touch than a week in the house, so it is roughly half that now.
const STANCE_BOND = { blame: -0.7, drag: -1.0, warn: -0.35, praise: 0.6, miss: 0.5, respect: 0.35 };
/** What fans make of what was said about somebody still playing, per unit of heat. */
const STANCE_POP = { blame: -0.3, drag: -0.4, warn: -0.2, praise: 0.3, miss: 0.15, respect: 0.2 };
/** What fans make of the guest, by how the hour went. */
const RECEPTION_POP = { warm: 0.8, mixed: 0.1, cold: -0.7 };
/** How loud each stance is, for the heat of the hour. */
const STANCE_HEAT = { blame: 0.8, drag: 1, warn: 0.6, praise: 0.4, miss: 0.5, respect: 0.3 };
const MOOD_HEAT = { bitter: 1.3, denial: 1.2, gutted: 1.1, gracious: 0.75, relieved: 0.7, elated: 0.8 };
const MOOD_RECEPTION = { gracious: 1.2, gutted: 0.8, relieved: 0.6, elated: 0.5, denial: -0.8, bitter: -1.0 };

const STAT_DEFAULT = 5;
const statOf = (stats, k) => Number.isFinite(Number(stats?.[k])) ? Number(stats[k]) : STAT_DEFAULT;

function weighted(rng, pairs) {
  const live = pairs.filter(([, w]) => w > 0);
  const total = live.reduce((n, [, w]) => n + w, 0);
  if (!total) return null;
  let r = rng() * total;
  for (const [v, w] of live) { r -= w; if (r <= 0) return v; }
  return live[live.length - 1][0];
}

function kindOf(f) {
  if (NO_VOTE.has(f.how)) return f.how;
  if (f.again) return 'again';
  if (f.with) return 'double';
  if (f.firstBoot) return 'first-boot';
  if (f.blindside) return 'blindside';
  if (f.backdoor) return 'backdoor';
  if (f.partner && f.partnerStillIn) return 'showmance';
  return 'seen-it-coming';
}

function moodOf(f, kind, rng) {
  if (kind === 'finalist' && f.placement === 1) return 'elated';
  const s = f.profile?.stats || {};
  const arch = f.profile?.archetype || '';
  const t = statOf(s, 'temperament');
  const shock = kind === 'blindside' || kind === 'backdoor' ? 1 : 0;
  return weighted(rng, [
    ['bitter', (10 - t) * 0.5 + shock * 2 + (VILLAIN.has(arch) ? 1.5 : 0)],
    ['gracious', t * 0.4 + statOf(s, 'strategic') * 0.25 + (NICE.has(arch) ? 1.5 : 0)],
    ['denial', statOf(s, 'boldness') * 0.3 + (10 - statOf(s, 'intuition')) * 0.2 + (VILLAIN.has(arch) ? 1 : 0)],
    ['relieved', (kind === 'walked' || kind === 'medical' ? 4 : 0.6) + (10 - statOf(s, 'endurance')) * 0.1],
    ['gutted', statOf(s, 'loyalty') * 0.35 + shock * 1.5 + (f.partnerStillIn ? 1.5 : 0)],
  ]) || 'gracious';
}

/** Who gets named and how. One stance per person, the loudest. A friend the
 *  tape shows voted against them is blamed now — they learn it on the air. */
function namedOf(f, kind, mood, nice, truth = null) {
  const out = new Map();
  const exposed = new Set((truth?.flippers || []).filter(x => !(f.suspected || []).includes(x)));
  const put = (who, stance, still, force = false) => {
    if (!who || who === f.guest || who === f.with) return;
    if (nice && stance === 'drag') stance = 'warn';
    const prev = out.get(who);
    // What the tape showed them overrides how they felt walking in.
    if (prev && (prev.forced || (!force && STANCE_HEAT[prev.stance] >= STANCE_HEAT[stance]))) return;
    out.set(who, force ? { who, stance, still: !!still, heat: 0, forced: true } : { who, stance, still: !!still, heat: 0 });
  };
  const inGame = new Set(f.stillIn || []);
  if (!NO_VOTE.has(kind)) {
    for (const who of (f.suspected || []).slice(0, 2)) put(who, mood === 'gracious' ? 'respect' : 'blame', inGame.has(who));
  }
  for (const who of [...exposed].slice(0, 2)) {
    put(who, mood === 'gracious' || mood === 'relieved' ? 'respect' : 'blame', inGame.has(who), true);
  }
  for (const who of (f.rivals || []).slice(0, 2)) put(who, mood === 'gracious' ? 'warn' : 'drag', inGame.has(who));
  for (const who of (f.allies || []).slice(0, 2)) put(who, mood === 'gutted' ? 'miss' : 'praise', inGame.has(who));
  if (f.partner) put(f.partner, 'miss', inGame.has(f.partner));
  const named = [...out.values()].slice(0, 4).map(({ forced, ...n }) => n);
  for (const n of named) n.heat = Math.round(STANCE_HEAT[n.stance] * (MOOD_HEAT[mood] || 1) * 100) / 100;
  return named;
}

function answerStance(stance, mood) {
  const hostile = stance === 'drag' || stance === 'blame' || stance === 'warn';
  if (!hostile) return mood === 'gutted' ? 'miss' : 'praise';
  if (mood === 'gracious' || mood === 'relieved') return 'respect';
  if (mood === 'gutted') return 'warn';
  return 'drag';
}

function segmentsOf(f, kind, truth, rng, earlier) {
  const fixed = [];
  if (truth && truth.flippers.length) fixed.push('the-tape');
  if ((f.heardAboutMe || []).length) fixed.push('answer-back');
  const stillIn = (f.stillIn || []).length;
  const pool = ['fan-mail'];
  if (stillIn >= 3 && kind !== 'finalist') pool.push('rank-them', 'who-next');
  if (stillIn >= 1 && ((f.allies || []).length || f.partnerStillIn)) pool.push('message-in');
  if ((f.outNow || []).length) pool.push('caller');
  // Least recently used first: a segment two interviews running is rarer.
  const recent = earlier.slice(-2).flatMap(e => e.segments || []);
  const want = Math.max(1, Math.min(3 - fixed.length, 1 + (rng() < 0.55 ? 1 : 0)));
  const picked = [];
  const left = pool.slice();
  while (picked.length < want && left.length) {
    // A caller is an event, not a fixture: it would otherwise air most weeks
    // once the outside fills up (the first season read: seven in ten).
    const g = weighted(rng, left.map(s => [s, (recent.includes(s) ? 0.35 : 1) * (s === 'caller' ? 0.5 : 1)]));
    picked.push(g);
    left.splice(left.indexOf(g), 1);
  }
  let segs = [...fixed, ...picked].slice(0, 3);
  // Never the same rotation three interviews running.
  const key = segs.join('+');
  const last2 = earlier.slice(-2).map(e => (e.segments || []).join('+'));
  if (last2.length === 2 && last2.every(k => k === key)) {
    const swap = pool.find(s => !segs.includes(s));
    if (swap && picked.length) segs = [...fixed, ...picked.slice(0, -1), swap].slice(0, 3);
    else if (swap) segs = [...fixed, swap].slice(0, 3);
    else if (segs.length > 1) segs = segs.slice(0, -1);
  }
  return segs.length ? segs : ['fan-mail'];
}

/**
 * Decide one exit interview from the facts a show adapter built.
 * `rng` is the episode's own random stream, so a rerun re-rolls it with the
 * rest of the episode; `earlier` is this season's interviews so far.
 */
export function decideExitInterview(f, { rng = Math.random, earlier = [] } = {}) {
  const kind = kindOf(f);
  const nice = NICE.has(f.profile?.archetype || '');
  const mood = moodOf(f, kind, rng);
  const voted = !NO_VOTE.has(kind) && Number(f.votesTotal) > 0;
  const truth = voted && ((f.flippers || []).length || (f.suspected || []).length)
    ? { flippers: [...(f.flippers || [])], suspected: [...(f.suspected || [])],
      right: !(f.flippers || []).length || (f.flippers || []).some(x => (f.suspected || []).includes(x)) }
    : null;
  const named = namedOf(f, kind, mood, nice, truth);
  const answerBack = (f.heardAboutMe || []).slice(0, 2).map(h => {
    const stance = nice && answerStance(h.stance, mood) === 'drag' ? 'warn' : answerStance(h.stance, mood);
    return { id: h.id, who: h.from, stance, was: h.stance };
  });
  for (const a of answerBack) {
    if (a.who === f.guest || named.some(n => n.who === a.who)) continue;
    named.push({ who: a.who, stance: a.stance, still: false,
      heat: Math.round(STANCE_HEAT[a.stance] * (MOOD_HEAT[mood] || 1) * 100) / 100 });
  }
  const segments = segmentsOf(f, kind, truth, rng, earlier);
  let caller = null;
  if (segments.includes('caller')) {
    const out = f.outNow || [];
    const linked = out.filter(n => answerBack.some(a => a.who === n) || named.some(x => x.who === n));
    caller = (linked.length ? linked : out)[Math.floor(rng() * (linked.length ? linked : out).length)] || null;
  }
  const still = new Set(f.stillIn || []);
  // Nobody roots for the friend the tape just exposed — unless they took it well.
  const forgiving = mood === 'gracious' || mood === 'relieved';
  const burned = new Set(forgiving ? [] : (truth?.flippers || []));
  const prediction = kind === 'finalist' ? null
    : weighted(rng, (f.predictFrom || []).filter(([n]) => still.has(n) && !burned.has(n)))
      || (f.stillIn || []).find(n => !burned.has(n)) || (f.stillIn || [])[0] || null;
  const heat = Math.min(10, Math.round((named.reduce((n, x) => n + x.heat, 0)
    + (kind === 'blindside' || kind === 'backdoor' ? 2 : 0)
    + (mood === 'bitter' || mood === 'denial' ? 1.5 : 0)
    + (truth && !truth.right ? 1 : 0) + answerBack.length * 1.5) * 10) / 10);
  const social = statOf(f.profile?.stats, 'social');
  const score = (MOOD_RECEPTION[mood] || 0) + (social - 5) * 0.15
    - named.filter(n => n.stance === 'drag').length * 0.3 + (rng() - 0.5) * 0.6;
  const reception = score > 0.6 ? 'warm' : score < -0.4 ? 'cold' : 'mixed';
  return {
    id: `${f.show || 'show'}-w${f.week}-${String(f.guest).replace(/\s+/g, '_')}`,
    show: f.show, week: f.week, guest: f.guest, with: f.with || null,
    kind, mood, juror: !!f.juror, placement: f.placement ?? null, how: f.how,
    votes: voted ? { against: Number(f.votesAgainst) || 0, total: Number(f.votesTotal) || 0 } : null,
    segments, named, truth, prediction, caller, answerBack,
    allies: [...(f.allies || [])].slice(0, 3), rivals: [...(f.rivals || [])].slice(0, 3),
    partner: f.partner || null, stillIn: [...(f.stillIn || [])],
    heat, reception, profile: { archetype: f.profile?.archetype || '', stats: { ...(f.profile?.stats || {}) } },
    effects: { popularity: {}, bonds: [] }, heardBy: {},
  };
}

const fuse = stats => 0.6 + (10 - statOf(stats, 'temperament')) * 0.08;
const r2 = n => Math.round(n * 100) / 100;

/**
 * What recording it does at once: the guest's fans, the people named who are
 * still playing, and the guest learning on the tape who really flipped.
 * `ops = { addBond(a,b,d), addPopularity(name,d), popularityOf(name), statsOf(name) }`.
 */
export function applyRecording(record, ops) {
  const stats = record.profile?.stats || ops.statsOf?.(record.guest) || {};
  const self = r2((RECEPTION_POP[record.reception] || 0) * (0.5 + statOf(stats, 'social') / 10));
  if (self) {
    ops.addPopularity(record.guest, self);
    record.effects.popularity[record.guest] = r2((record.effects.popularity[record.guest] || 0) + self);
  }
  // Fans believe a guest they like.
  const credibility = Math.max(0.2, 0.7 + 0.1 * (Number(ops.popularityOf?.(record.guest)) || 0));
  for (const n of record.named || []) {
    if (!n.still) continue;
    const d = r2((STANCE_POP[n.stance] || 0) * n.heat * credibility);
    if (!d) continue;
    ops.addPopularity(n.who, d);
    record.effects.popularity[n.who] = r2((record.effects.popularity[n.who] || 0) + d);
  }
  const t = record.truth;
  if (t) {
    for (const who of t.flippers.filter(x => !t.suspected.includes(x))) {
      const d = r2(-1.0 * fuse(stats));
      ops.addBond(record.guest, who, d);
      record.effects.bonds.push({ a: record.guest, b: who, delta: d, when: 'recorded' });
    }
  }
  return record;
}

/**
 * Everybody named who can hear right now and has not: their bond with the
 * guest moves by the stance, harder on a short fuse. Returns who heard what.
 */
export function deliverInterviews(records, { at, canHear, ops }) {
  const heard = [];
  for (const r of records || []) {
    r.heardBy ||= {};
    for (const n of r.named || []) {
      if (n.who === r.guest || r.heardBy[n.who] != null || !canHear(n.who)) continue;
      const d = r2((STANCE_BOND[n.stance] || 0) * n.heat * fuse(ops.statsOf?.(n.who)));
      if (d) ops.addBond(n.who, r.guest, d);
      r.heardBy[n.who] = at;
      (r.effects ||= { popularity: {}, bonds: [] }).bonds.push({ a: n.who, b: r.guest, delta: d, when: at });
      heard.push({ id: r.id, hearer: n.who });
    }
  }
  return heard;
}

/** What `name` has heard said about them, oldest first. */
export function heardAbout(records, name) {
  return (records || []).filter(r => r.heardBy?.[name] != null)
    .flatMap(r => (r.named || []).filter(n => n.who === name)
      .map(n => ({ id: r.id, from: r.guest, stance: n.stance })));
}
