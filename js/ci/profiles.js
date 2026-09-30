// ══════════════════════════════════════════════════════════════════════
// ci/profiles.js — who plays whom
// ══════════════════════════════════════════════════════════════════════
//
// Spec §4. Each player has a TRUTH (the person) and a PROFILE (what the room
// sees). The author writes a Catfish Pool of personas each season; players
// take them by MOTIVE (stats, and what their real facts cost in this cast)
// or at random, and personas nobody takes stay in the pool as stock for later
// twists (spec §4.2). The engine never invents a persona: a motivated player
// who finds none plays EDITED — same face, one to three facts changed.
//
// All weights are proportional (stat × factor). MOTIVE_LINE is a gameplay
// constant tuned by audit:ci-spec so that a pool big enough gives roughly a
// third of the cast a persona (spec §2.2: about a third of real casts).
import { rolesFor } from './shared.js';
import { clamp, personMayScheme } from './state.js';
import { jobOf, tellsOf } from './persona-data.js';

// Calibrated on the roster the site plays (tests/helpers/ci-cast.js
// rosterCast), 2026-09-30: most roster players have no age, so strategy and
// nerve must carry the motive themselves. 0.07/0.05 gave 14% catfish on real
// casts (synthetic casts, whose ages spread 21-58, had hidden it at 31%);
// 0.10/0.07 gives 32%, and catfish win about a third of seasons.
export const MOTIVE = { age: 0.08, alum: 0.6, threatRep: 1.0, villainRep: 1.4, celebRep: 1.6, job: 1.0,
  strategic: 0.10, boldness: 0.07, loyalty: 0.06 };
// 0.75 gave 6.1 of 13 a persona once the pool had eight (47%) — the audit's
// pool of six had been capping it. 1.0 gives 4.1 (31%) with the default pool.
export const MOTIVE_LINE = 1.0;
// Below the persona line, a reason to hide one costly fact (a job, an age, a
// marriage) while playing yourself: an EDITED profile. US 1's Alana kept
// quiet about modelling. Above both lines with no persona left, edited too.
export const EDIT_LINE = 0.75;
export const RANDOM_TAKE = 0.5;
const EDIT_JOBS = ['student', 'teacher', 'barista', 'personal trainer', 'marketing assistant',
  'bartender', 'nurse', 'graphic designer'];

// Years since a birthdate ('YYYY-MM-DD'), or null. The Profile Plan shows it too.
export function ageFrom(birthdate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(birthdate || ''));
  if (!m) return null;
  const now = new Date();
  let a = now.getFullYear() - Number(m[1]);
  if (now.getMonth() + 1 < Number(m[2]) || (now.getMonth() + 1 === Number(m[2]) && now.getDate() < Number(m[3]))) a--;
  return a > 0 && a < 120 ? a : null;
}

// How the room might already know them (the Profile Plan's "Already famous?"):
// nobody; known from TV; a big threat (a past winner or finalist, a household
// name); a villain; a celebrity (the franchise's fame stars, js/fame.js). The
// more famous, the more reason to hide behind a persona.
export const REPS = ['none', 'known', 'threat', 'villain', 'celebrity'];

export function truthOf(player, setup = {}) {
  // An older saved pin named a persona in `catfish`; it reads as Yes + that persona.
  const legacyPin = setup.catfish && !['decide', 'never', 'always'].includes(setup.catfish) ? setup.catfish : null;
  // Set on the plan, else what the season hands in from their past seasons
  // (ci-run.js circleKnownAs), else a returnee is at least known.
  const rep = REPS.includes(setup.rep) ? setup.rep : REPS.includes(setup.autoRep) ? setup.autoRep
    : (setup.alum ?? player.isReturnee) ? 'known' : 'none';
  return {
    name: player.name, gender: player.gender || 'f', sexuality: player.sexuality || 'straight',
    archetype: player.archetype || 'floater', stats: { ...player.stats },
    // The Profile Plan starts from Create Character (the roster's age or
    // birthdate, occupation, hometown); anything set on the plan wins.
    // `setup.from` is the roster's copy (ci-run.js rosterFactsOf): a cast
    // entry does not carry these.
    age: setup.age ?? player.age ?? setup.from?.age ?? ageFrom(player.birthdate ?? setup.from?.birthdate) ?? 25,
    job: setup.job ?? ((player.occupation ?? setup.from?.occupation) ? String(player.occupation ?? setup.from.occupation).toLowerCase() : null),
    hometown: setup.hometown ?? player.hometown ?? setup.from?.hometown ?? null,
    status: setup.status ?? 'Single', alum: rep !== 'none', rep,
    jobCost: setup.jobCost ?? 0, role: setup.role || 'starter',
    // Plays as someone else: 'decide' (the motive decides), 'always' (yes) or
    // 'never' (no); and, for Decide or Yes, which persona when they do.
    catfish: legacyPin ? 'always' : setup.catfish === 'always' || setup.catfish === 'never' ? setup.catfish : 'decide',
    persona: setup.persona ?? legacyPin ?? null,
    partner: setup.partner || null,
    // The Profile Plan's mode pin for a player without a persona: 'honest',
    // 'polished' or 'edited'; null lets the motive decide (spec 4.2).
    mode: ['honest', 'polished', 'edited'].includes(setup.mode) ? setup.mode : null,
    // A shared profile (spec §14.8): who is the face and who the brain, and the
    // facts of a life the profile might hide ("three kids at home").
    face: setup.face ?? null, brain: setup.brain ?? null, facts: [...(setup.facts || [])],
    // How they type, if an author wrote it (ci/register.js, voice.js byAuthored).
    chatVoice: setup.chatVoice ?? player.chatVoice ?? null,
    // How ready they are to type like somebody else, 0..1 (ci/cover.js).
    prep: setup.prep ?? 0,
  };
}

export function medianAge(truths) {
  const a = truths.map(t => t.age).sort((x, y) => x - y);
  return a.length ? a[a.length >> 1] : 25;
}

/** What each true fact costs to show in this room (spec §4.3). */
export function factCosts(t, median) {
  return { age: Math.abs(t.age - median) * MOTIVE.age, alum: t.alum ? MOTIVE.alum : 0,
    rep: t.rep === 'celebrity' ? MOTIVE.celebRep : t.rep === 'villain' ? MOTIVE.villainRep : t.rep === 'threat' ? MOTIVE.threatRep : 0,
    job: (t.jobCost || 0) * MOTIVE.job };
}

export function catfishMotive(t, median) {
  const c = factCosts(t, median);
  return c.age + c.alum + c.rep + c.job
    + (t.stats.strategic ?? 5) * MOTIVE.strategic
    + (t.stats.boldness ?? 5) * MOTIVE.boldness
    - (t.stats.loyalty ?? 5) * MOTIVE.loyalty;
}

/** The first of the persona's reasons this person may use; strategic is scheme-only (spec §4.4). */
export function reasonFor(t, persona) {
  const ok = (persona.reasons || []).filter(r => r !== 'strategic' || personMayScheme(t));
  return ok[0] ?? null;
}

/** How well a persona hides what this player wants hidden. -Infinity = unusable. */
export function fitScore(t, persona, median) {
  if (!reasonFor(t, persona)) return -Infinity;
  const f = persona.fits || {};
  let s = 0;
  if (f.gender && f.gender !== t.gender) s -= 1;
  if (f.ageMin != null && t.age < f.ageMin) s -= 1;
  if (f.ageMax != null && t.age > f.ageMax) s -= 1;
  if (f.archetypes && !f.archetypes.includes(t.archetype)) s -= 0.5;
  if (t.age > median + 5 && persona.age < t.age) s += 1;
  if (t.age < median - 5 && persona.age > t.age) s += 1;
  if (t.alum) s += 0.5;
  return s;
}

function shuffled(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function drawPersonas(truths, pool, rng, pickBy = 'stats') {
  const median = medianAge(truths);
  const left = [...pool];
  const assigned = {};
  const take = (t, p) => {
    assigned[t.name] = { personaId: p.id, reason: reasonFor(t, p) };
    left.splice(left.indexOf(p), 1);
  };
  // The persona chosen on the plan, when it is still free and suits them;
  // else the one that hides them best.
  const best = t => {
    const mine = t.persona && left.find(x => x.id === t.persona);
    if (mine && reasonFor(t, mine)) return mine;
    return left.map(p => [p, fitScore(t, p, median)]).filter(([, s]) => s > -1)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  // A player whose partner comes earlier in the cast joins that partner's
  // profile (spec §14.8): they draw nothing of their own, or the persona they
  // drew would vanish — neither played nor left in the pool.
  const seen = new Set();
  const follower = new Set();
  for (const t of truths) { if (t.partner && seen.has(t.partner)) follower.add(t.name); seen.add(t.name); }
  const drawing = truths.filter(t => !follower.has(t.name));

  // Pins first: Yes with a persona. A persona that is not in the pool is ignored.
  for (const t of drawing) {
    if (t.catfish !== 'always' || !t.persona) continue;
    const p = left.find(x => x.id === t.persona);
    if (p && reasonFor(t, p)) take(t, p);
  }
  const open = drawing.filter(t => !assigned[t.name] && t.catfish !== 'never');
  const motive = Object.fromEntries(open.map(t => [t.name, catfishMotive(t, median)]));

  if (pickBy === 'random') {
    for (const t of open.filter(t => t.catfish === 'always')) { const p = best(t); if (p) take(t, p); }
    for (const p of shuffled(left, rng)) {
      if (rng() > RANDOM_TAKE) continue;
      const takers = open.filter(t => !assigned[t.name] && reasonFor(t, p));
      if (takers.length) take(takers[Math.floor(rng() * takers.length)], p);
    }
  } else {
    const order = open.map(t => [t, motive[t.name] + (t.catfish === 'always' ? 99 : 0) + rng() * 1.2])
      .sort((a, b) => b[1] - a[1]).map(([t]) => t);
    for (const t of order) {
      if (t.catfish !== 'always' && motive[t.name] < MOTIVE_LINE) continue;
      const p = best(t);
      if (p) take(t, p);
    }
  }
  // Edited: pinned, or a reason to hide something. "Never" rules out a
  // persona, not an edit; an honest or polished pin rules out both.
  const edited = drawing.filter(t => !assigned[t.name] && (t.mode === 'edited'
    || (!t.mode && (t.catfish === 'always' || catfishMotive(t, median) >= EDIT_LINE)))).map(t => t.name);
  return { assigned, unused: left.map(p => p.id), edited };
}

/** Texting voice (spec §4.5): numbers 0..1 that Plan 2 turns into words. */
export function voiceOf(age, stats) {
  return {
    emoji: clamp(stats.social / 10 + (age < 30 ? 0.2 : -0.1), 0, 1),
    hashtags: clamp(stats.boldness / 10 + (age < 35 ? 0.1 : -0.2), 0, 1),
    caps: clamp((stats.boldness - 4) / 10, 0, 1),
    length: clamp(stats.mental / 10, 0, 1),
    speed: clamp((stats.social + stats.boldness) / 20, 0, 1),
  };
}

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '') || 'player';
function uniqueHandle(base, taken) {
  let h = `@${slug(base)}`, i = 2;
  while (taken[h]) h = `@${slug(base)}${i++}`;
  return h;
}

function editsFor(t, median, rng) {
  const c = factCosts(t, median);
  const shown = {};
  const edits = [];
  const ranked = Object.entries(c).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [fact] of ranked) {
    if (fact === 'age') { shown.age = Math.round(median + (t.age > median ? 2 : -2) * rng()); edits.push('age'); }
    if (fact === 'job') { shown.job = EDIT_JOBS[Math.floor(rng() * EDIT_JOBS.length)]; edits.push('job'); }
    if (fact === 'alum' || fact === 'rep') { if (!edits.includes('fame')) edits.push('fame'); }
  }
  if (t.status !== 'Single' && rng() < (t.stats.strategic ?? 5) / 20) { shown.status = 'Single'; edits.push('status'); }
  if (!edits.length) { shown.job = EDIT_JOBS[Math.floor(rng() * EDIT_JOBS.length)]; edits.push('job'); }
  return { shown, edits };
}

/** What the room sees of a persona: the picked job's name unless the author
 *  titled it, and the job and style picks the cover model reads. */
export function personaShown(persona) {
  return { name: persona.handle, age: persona.age, gender: persona.gender,
    job: persona.job || jobOf(persona)?.name?.toLowerCase() || null,
    status: persona.status, hometown: persona.hometown ?? null, face: persona.face ?? null,
    ...(persona.jobId ? { jobId: persona.jobId } : {}), ...(persona.register ? { register: persona.register } : {}) };
}

export function buildProfiles(state, truths, draw, pool, rng) {
  const median = medianAge(truths);
  const personas = Object.fromEntries(pool.map(p => [p.id, p]));
  state.pool = pool.map(p => ({ ...p }));
  state.unused = [...draw.unused];
  const handles = [];
  for (const t of truths) {
    state.people[t.name] = t;
    // A partner already on a profile: join it (spec §14.8).
    const partnerHandle = t.partner && state.handleOf[t.partner];
    if (partnerHandle && state.profiles[partnerHandle].players.length === 1) {
      const p = state.profiles[partnerHandle];
      // A pair behind a persona stays a catfish; an honest pair is 'shared'.
      p.players.push(t.name); p.shared = true;
      if (p.mode !== 'catfish') p.mode = 'shared';
      p.gap = Math.max(p.gap, 0.5);
      p.roles = rolesFor(state, p.players);
      // An honest pair shows the face: their name, their photos.
      if (p.mode === 'shared' && p.roles.face !== p.players[0]) {
        const f = state.people[p.roles.face];
        p.shown = { name: f.name, age: f.age, gender: f.gender, job: f.job, status: f.status,
          hometown: f.hometown, face: `portrait:${f.name}` };
      }
      state.handleOf[t.name] = partnerHandle;
      continue;
    }
    const a = draw.assigned[t.name];
    const persona = a && personas[a.personaId];
    let mode = 'honest', shown, edits = [], tells = [], gap = 0;
    const own = { name: t.name, age: t.age, gender: t.gender, job: t.job, status: t.status,
      hometown: t.hometown, face: `portrait:${t.name}` };
    if (persona) {
      mode = 'catfish';
      shown = personaShown(persona);
      tells = tellsOf(persona);
      // Not gender: keeping a persona up is style, age and smarts (ci/cover.js).
      gap = 1 + Math.abs(persona.age - t.age) / 10;
    } else if (draw.edited.includes(t.name)) {
      mode = 'edited';
      const e = editsFor(t, median, rng);
      shown = { ...own, ...e.shown }; edits = e.edits; gap = 0.3 * edits.length;
    } else {
      mode = t.mode === 'honest' || t.mode === 'polished' ? t.mode : catfishMotive(t, median) > 0 ? 'polished' : 'honest';
      shown = own;
    }
    const handle = uniqueHandle(shown.name, state.profiles);
    state.profiles[handle] = { handle, players: [t.name], mode, personaId: persona?.id ?? null,
      reason: a?.reason ?? null, shown, edits, tells, gap, voice: voiceOf(shown.age, t.stats),
      // How the persona itself talks, if the pool's author wrote it.
      personaVoice: persona?.chatVoice || null };
    state.handleOf[t.name] = handle;
    handles.push(handle);
  }
  return handles;
}
