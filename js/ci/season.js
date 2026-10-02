// ══════════════════════════════════════════════════════════════════════
// ci/season.js — a whole season of The Circle, headless
// ══════════════════════════════════════════════════════════════════════
//
// The Perfect Match / Traitors shape: replaces `gs`, plays every day, writes
// one `gs.episodeHistory` row a day stamped `format`, and returns the Circle
// state. The caller owns `players` (setPlayers) — truths are read from it.
//
// DICE: the pool draw from `pool`, profiles from `profiles`, first sparks from
// `spark`, and every day from `day:N` — one day's draws never move another's
// (ADDING-A-SHOW §11.5 M).
//
// FRANCHISE: this function sets its own gs, so it gets none of the franchise's
// seeded bonds for free (ADDING-A-SHOW §8.3). The caller (js/ci-run.js, Plan 4)
// passes franchise-carry's `carriedFor(...)` as `carried`; the ledger write is
// Plan 6.
import { changesOf } from './web-data.js';
import { snapshotEnd } from './snapshot.js';
import { formAlliance, checkIn, activeAlliances, afterRatings, doubleAgents, drift } from './alliances.js';
import { gs, setGs, players } from '../core.js';
import { streamFor } from '../dr/rng.js';
import { CIRCLE_FORMAT } from '../shows.js';
import { newState, addScene, bump, peopleOf, peopleAtScene, moveIn } from './state.js';
import { truthOf, drawPersonas, buildProfiles } from './profiles.js';
import { setBelief, nudgeBelief } from './beliefs.js';
import { bioFor } from './persona-data.js';
import { S, rel } from './state.js';
import { initMind, driftMind } from './mind.js';
import { seedAttraction, planChats, contextFor } from './chat.js';
import { groupChats } from './groupchats.js';
import { compareNotes } from './twotiming.js';
import { kinRecognise } from './kin.js';
import { runChat } from './conversation.js';
import { morningFeed, runCircleChat } from './feed.js';
import { runRating } from './ratings.js';
import { standardBlocking, goodbyeVideo, deliverReports, applyBlock } from './blocking.js';
import { FORMATS, prepareNight, runBlocking } from './formats.js';
import { bookSeason } from './timeline.js';
import { arrive, chooseNewcomer } from './arrivals.js';
import { powersMorning, jokerMeets, runDisrupter } from './powers.js';
import { runEvent, endSwap } from './twists.js';
import { addAI } from './ai.js';
import { openLedger, noteJoin, airDay, fanFavorite, publicPick, publicSnapshot, publicStanding } from './public.js';
import { buildSchedule, rhythmOf } from './schedule.js';
import { finalDay, finaleDay } from './finale.js';
import { chooseAired } from './airing.js';
import { writeDay } from './script.js';
import { pickGame, runGame } from './games.js';
import { runParty } from './party.js';
import { apartmentLife, videoFromHome } from './life.js';

export const CARRY = 0.6;

/** Past seasons (spec §4.7): only a player who can SEE who the other is carries the feeling. */
export function applyCarried(state, carried) {
  for (const { a, b, delta } of carried?.sums || []) {
    const ha = state.handleOf[a], hb = state.handleOf[b];
    if (!ha || !hb || ha === hb) continue;
    if (state.profiles[hb].mode !== 'catfish') { bump(ha, hb, 'affection', delta * CARRY); bump(ha, hb, 'trust', delta * CARRY); }
    if (state.profiles[ha].mode !== 'catfish') { bump(hb, ha, 'affection', delta * CARRY); bump(hb, ha, 'trust', delta * CARRY); }
  }
}

/** A catfish wearing an alum's face is recognised by anyone who knows that alum. */
// A famous face is recognised (user, 2026-09-30). A player who shows their
// own face and is famous may be recognised by anyone who sees their profile:
// the more famous, and the sharper the one looking, the likelier. Once a pair.
// The one who recognises them knows the profile is real, sees a bigger threat
// (a fan base), and warms to a fan favourite or resents a known villain. A
// catfish hiding their fame is never recognised this way: that is why a
// celebrity catfishes.
// What the big moments' screens draw (js/vp-ci/moments.js), kept small: a
// ranking board, the names at risk, who was blocked, the finale board.
const board = d => ({ ballots: (d.ballots || []).map(b => ({ voter: b.voter, order: b.order, ...(b.reasons ? { reasons: b.reasons } : {}) })),
  results: (d.results || []).map(r => ({ profile: r.profile, place: r.place })), influencers: d.influencers || [] });
const BEAT_KEEP = new Set(['phase', 'round', 'kind', 'by', 'about', 'c', 'n', 'answer', 'right', 'promptId', 'factId', 'qid',
  'tone', 'qkind', 'anon', 'tier', 'split', 'strong', 'everyone', 'mutual', 'many', 'warm', 'off', 'all', 'votes']);
/** Likes received, from a likes scene's record (liker -> the profiles they liked). */
export function likeCounts(likes = {}) {
  const out = {};
  for (const [h, liked] of Object.entries(likes || {})) { out[h] ??= 0; for (const o of liked || []) out[o] = (out[o] || 0) + 1; }
  return out;
}
export const STAGE_DATA = {
  ratings: board, 'final-ratings': board,
  hangout: d => ({ atRisk: d.atRisk || [], target: d.target ?? null, runnerUp: d.runnerUp?.handle ?? null }),
  // The visit: why they came, and, if it turned into an argument, how (blocking.js clash).
  visit: d => ({ motive: d.motive || null, clash: d.clash || null }),
  blocking: d => ({ target: d.target ?? null, by: d.by || [], channel: d.channel || null, secret: !!d.secret, reason: d.reason || null }),
  reveal: d => ({ placements: (d.placements || []).map(p => ({ profile: p.profile, place: p.place })) }),
  party: d => ({ theme: d.theme, props: d.props || [] }),
  // The Newsfeed: how many likes each player's post got this morning.
  likes: d => ({ counts: likeCounts(d.likes) }),
  'group-chat': d => ({ name: d.name, formed: !!d.formed, declined: d.declined || [], plan: d.plan || null, event: d.event || null }),
  audience: d => ({ mode: d.mode, candidates: [...d.candidates], shares: [...d.shares], saved: d.saved ?? null, target: d.target ?? null, winner: d.winner ?? null }),
  // A game's beats, trimmed to what a board draws (js/vp-ci/boards.js).
  game: d => ({ gameId: d.gameId, family: d.family, beats: (d.beats || []).map(b =>
    Object.fromEntries(Object.entries(b).filter(([k, v]) => BEAT_KEEP.has(k) && v != null && v !== false))) }),
};

// Who suspects whom, the closest bonds, the worst grudges, who holds power:
// the room at a moment, for the screens' sidebar. Rounded and capped.
// A crush the sidebar names (attraction 0-10).
export const SPARK_AT = 4.5;
// How often an evening gets a second Circle Chat (no party that night).
export const EVENING_CHAT = 0.2;
export function roomAt(state) {
  const act = [...state.active];
  const suspects = [], bonds = [], rivals = [], sparks = [];
  const alliances = activeAlliances(state).map(a => [a.name, a.members.filter(m => act.includes(m))]).filter(([, m]) => m.length >= 2);
  for (const o of act) for (const t of act) {
    if (o === t) continue;
    const real = state.beliefs?.[o]?.[t]?.real;
    if (real != null && real < 0.5) suspects.push([o, t, Math.round(real * 100)]);
  }
  act.forEach((a, i) => act.slice(i + 1).forEach(b => {
    const aff = (rel(a, b, 'affection') + rel(b, a, 'affection')) / 2;
    const res = Math.max(rel(a, b, 'resentment'), rel(b, a, 'resentment'));
    if (aff > 3) bonds.push([a, b, Math.round(aff * 10) / 10]);
    // Grudges run lower than affection (it reaches 10; resentment rarely passes 3).
    if (res >= 1.5) rivals.push([a, b, Math.round(res * 10) / 10]);
    // Sparks: a crush one way, or both ways (attraction, 0-10).
    const ab = rel(a, b, 'attraction'), ba = rel(b, a, 'attraction');
    if (ab >= SPARK_AT && ba >= SPARK_AT) sparks.push([a, b, 'mutual', Math.round((ab + ba) * 5) / 10]);
    else if (ab >= SPARK_AT || ba >= SPARK_AT) sparks.push(ab >= ba ? [a, b, 'crush', Math.round(ab * 10) / 10] : [b, a, 'crush', Math.round(ba * 10) / 10]);
  }));
  const infl = (state.ratings || []).filter(r => !r.final && !r.hidden).at(-1)?.influencers || [];
  return { active: act, influencers: infl.filter(h => act.includes(h)),
    suspects: suspects.sort((x, y) => x[2] - y[2]).slice(0, 8),
    bonds: bonds.sort((x, y) => y[2] - x[2]).slice(0, 6), rivals: rivals.sort((x, y) => y[2] - x[2]).slice(0, 5),
    // Both ways first, then the biggest crushes.
    sparks: sparks.sort((x, y) => (y[2] === 'mutual') - (x[2] === 'mutual') || y[3] - x[3]).slice(0, 5), alliances };
}

export const FAME_SEEN = { celebrity: 0.8, threat: 0.45, villain: 0.45, known: 0.18 };
function recogniseFame(state, rng) {
  const seen = state.recognised;
  for (const [h, p] of Object.entries(state.profiles)) {
    if (!state.active.includes(h) || p.mode === 'catfish') continue;
    const person = state.people[p.players[0]];
    const base = FAME_SEEN[person?.rep];
    if (!base) continue;
    // An edited profile that hides the fame still shows the face: half as likely.
    const odds = base * ((p.edits || []).includes('fame') ? 0.5 : 1);
    for (const obs of state.active) {
      const key = `fame:${obs}>${h}`;
      if (obs === h || seen[key]) continue;
      seen[key] = true;
      if (rng() >= odds * S(state, obs, 'intuition') / 10) continue;
      const sc = addScene(state, 'recognise', [obs], { profile: h, fame: person.rep }, [obs]);
      nudgeBelief(state, obs, h, 'real', 0.35, sc);
      nudgeBelief(state, obs, h, 'threat', person.rep === 'celebrity' ? 0.45 : 0.3, sc);
      if (person.rep === 'villain') bump(obs, h, 'resentment', 1); else bump(obs, h, 'affection', 0.8);
    }
  }
}

function recognise(state, carried) {
  const known = carried?.sums || [];
  const seen = state.recognised;
  for (const [h, p] of Object.entries(state.profiles)) {
    const face = p.shown?.face || '';
    if (!face.startsWith('alum:') || !state.active.includes(h)) continue;
    const alum = face.slice(5);
    for (const obs of state.active) {
      if (obs === h || seen[`${obs}>${h}`]) continue;
      const knows = peopleOf(state, obs).some(n => known.some(s => (s.a === n && s.b === alum) || (s.b === n && s.a === alum)));
      if (!knows) continue;
      seen[`${obs}>${h}`] = true;
      const sc = addScene(state, 'recognise', [obs], { profile: h, alum }, [obs]);
      setBelief(state, obs, h, 'real', 0.05, sc);
      setBelief(state, obs, h, 'guessOf', alum, sc);
    }
  }
}

export function playCircleSeason({ cast, setup = {}, pool = [], options = {}, seed = 1, carried = null, kin = [] }) {
  setGs({ bonds: {}, perceivedBonds: {}, relationshipDimensions: {}, activePlayers: [],
    episodeHistory: [], popularity: {} });
  const state = newState(seed, options);
  const truths = cast.map(name => truthOf(players.find(p => p.name === name) || { name, stats: {} }, setup[name] || {}));
  const draw = drawPersonas(truths, pool, streamFor(seed, 'pool'), state.options.pickBy);
  const handles = buildProfiles(state, truths, draw, pool, streamFor(seed, 'profiles'));
  // What the draw dealt each player, as it stood before anything aired: the
  // cast cards show it (js/ci-cast-ui.js). Twists change profiles later.
  state.dealt = Object.fromEntries(truths.map(t => {
    const p = state.profiles[state.handleOf[t.name]];
    return [t.name, { mode: p.mode, personaId: p.personaId ?? null, reason: p.reason ?? null,
      edits: [...(p.edits || [])], shown: { ...p.shown }, with: p.players.filter(n => n !== t.name) }];
  }));
  state.dealtUnused = [...state.unused];
  // The AI player (US 6), a season option: one more starter from Day 1.
  if (state.options.ai) handles.push(addAI(state));
  openLedger(state);
  seedAttraction(state, streamFor(seed, 'spark'));
  applyCarried(state, carried);
  // Family, partners and old friends in the cast, by person (ci-run.js, ci/kin.js).
  state.kin = (kin || []).filter(e => e && e.a !== e.b);

  const isNewcomer = h => peopleOf(state, h).every(n => state.people[n].role === 'newcomer');
  const starters = handles.filter(h => !isNewcomer(h));
  const queue = handles.filter(isNewcomer);
  const schedule = buildSchedule({ total: handles.length, starters: starters.length,
    finalists: state.options.finalists, days: state.options.days, rhythm: state.options.rhythm ?? rhythmOf(cast) });
  // What each ratings night is: booked by slot, or drawn (Plan 3b).
  const booked = bookSeason(schedule, streamFor(seed, 'timeline'),
    { total: handles.length, finalists: state.options.finalists, bookings: state.options.bookings || {}, fixed: !!state.options.fixed,
      surprises: state.options.surprises !== false });
  schedule.splice(0, schedule.length, ...booked);
  state.schedule = schedule;

  const rows = [];
  let finalRow = null, result = null;
  // A night whose ratings closed yesterday's episode: its Hangout, blocking,
  // visit and goodbye video open today's (the show's cliffhanger).
  let tonight = null;
  for (const d of schedule) {
    state.day = d.day;
    const start = roomAt(state);
    // A re-run turns this day's dice once more (options.rerolls[day]); every
    // other day keeps its own, so earlier episodes come back identical.
    const turn = (state.options.rerolls || {})[d.day];
    const ds = name => streamFor(seed, turn ? `${name}#${turn}` : name);
    const rng = ds(`day:${d.day}`);
    if (d.day === 1) {
      for (const h of starters) { state.active.push(h); moveIn(state, h); state.joinedDay[h] = 1; initMind(state, h); noteJoin(state, h); }
      addScene(state, 'profiles', [...starters], {}, [...starters]);
    } else {
      for (const h of state.active) driftMind(state, h);
      if (tonight) {
        // An audience vote reads the audience's standing, handed in here (formats.js).
        state.publicStanding = String(tonight.night?.format || '').startsWith('audience-') ? publicStanding(state) : null;
        runBlocking(state, ds(`block:${d.day}`), tonight.rating, tonight.night);
        tonight = null;
      }
      // The goodbye video plays in the episode of the blocking, after the visit.
      for (const h of state.pendingGoodbyes.splice(0)) goodbyeVideo(state, rng, h);
      deliverReports(state, rng);
      powersMorning(state, ds(`powers:${d.day}`));
      endSwap(state);
      if (d.twist) {
        const nextBlock = schedule.find(x => x.day > d.day && x.block)?.day ?? d.day + 1;
        const finalDayN = schedule.find(x => x.final)?.day ?? schedule.length;
        const out = runEvent(state, ds(`twist:${d.day}`), d.twist,
          { until: d.twist === 'swap' ? nextBlock : finalDayN });
        // A clone vote ends with whoever the room called fake leaving.
        if (d.twist === 'clone' && out?.fake) {
          applyBlock(state, out.fake, 'clone', [], out.scene);
          state.pendingGoodbyes.push(out.fake);
        }
      }
      // Finale day is the studio: the phones are off after the final ratings.
      if (!d.finale) morningFeed(state, rng);
    }
    // Chosen by the Influencers: they pick which of two waiting profiles comes
    // in now; the other waits for the next arrival (US 4 Ep 1, US 6 Ep 1).
    let entry = d.entry || 'snoop', entryCtx = {};
    if (entry === 'chosen') {
      const by = state.ratings.filter(r => !r.final && !r.hidden).at(-1)?.influencers?.filter(i => state.active.includes(i)) || [];
      if (d.arrivals === 1 && queue.length >= 2 && by.length) {
        const offered = queue.slice(0, 2);
        const pick = chooseNewcomer(state, ds(`chosen:${d.day}`), offered, by);
        if (pick !== queue[0]) queue.splice(0, 2, pick, queue[0]);
        entryCtx = { offered, by };
      } else entry = 'snoop';
    }
    const arriving = queue.splice(0, d.arrivals);
    if (arriving.length) {
      arrive(state, ds(`arrive:${d.day}`), arriving, entry, entryCtx);
      for (const h of arriving) noteJoin(state, h);
      jokerMeets(state, ds(`joker:${d.day}`), arriving);
    }
    recognise(state, carried);
    recogniseFame(state, ds(`fame:${d.day}`));
    // A sister, an ex, a best friend: recognised (ci/kin.js).
    if (!d.finale) kinRecognise(state, ds(`kin:${d.day}`));
    // Day 1 opens like the show: the first Circle Chat, where the strangers
    // say hello, straight after the profiles and before any private chat.
    if (d.day === 1) runCircleChat(state, ds('open:1'), { first: true, when: 'day' });
    // CIRCLE CHAT AT ITS HOUR (user: 'how many Circle Chats are we supposed
    // to have'). The transcripts: one or two an episode, at any time of day
    // (15%, 32%, 93% of the way through). The main one is the morning or the
    // middle of the day; some evenings get a second. Each on its own stream.
    const ccMain = d.day > 1 && !d.finale ? (ds(`cc:${d.day}`)() < 0.5 ? 'morning' : 'day') : null;
    if (ccMain === 'morning') runCircleChat(state, ds(`cc:${d.day}:morning`), { when: 'morning' });

    // Alone in the apartment, then the chats, the game, and the evening:
    // a party (a party day, or a prize) or Circle Chat; then videos from home.
    if (!d.finale) apartmentLife(state, ds(`life:${d.day}`));
    const ctx = contextFor(state, d);
    if (!d.finale) for (const plan of planChats(state, rng, ctx)) runChat(state, rng, plan, ctx);
    if (ccMain === 'day') runCircleChat(state, ds(`cc:${d.day}:day`), { when: 'day' });
    // Group chats: an alliance may form, a standing one may check in (alliances.js).
    if (!d.finale) {
      formAlliance(state, ds(`ally:${d.day}`)); checkIn(state, ds(`ally-check:${d.day}`));
      // ...and come apart: a double agent caught, a member who has gone cold.
      doubleAgents(state, ds(`ally-double:${d.day}`)); drift(state, ds(`ally-drift:${d.day}`));
      // ...and the ones that are not alliances: a friend group, a peace talk, a ratings plan.
      groupChats(state, ds(`gc:${d.day}`), { ratingSoon: !!d.block && !d.final });
      // Two people the same player is romancing compare notes (twotiming.js).
      compareNotes(state, ds(`notes:${d.day}`));
    }
    if (d.disrupter) runDisrupter(state, ds(`disrupter:${d.day}`));
    if (d.game) {
      const g = pickGame(state, ds(`game:${d.day}`), { days: schedule.length });
      if (g) runGame(state, ds(`game:${d.day}:play`), g);
    }
    if (!d.finale) {
      if (d.party || state.partyNext) { state.partyNext = false; runParty(state, ds(`party:${d.day}`)); }
      else if (d.day !== 1 && ds(`cc:${d.day}:late`)() < EVENING_CHAT) runCircleChat(state, ds(`cc:${d.day}:evening`), { when: 'evening' });
    }
    const videos = new Set(state.homeVideoFor || []);
    state.homeVideoFor = [];
    if (d.homeVideos) for (const h of state.active) if (!(state.homeVideosSeen || []).includes(h)) videos.add(h);
    if (videos.size) videoFromHome(state, ds(`home:${d.day}`), [...videos]);

    let rating = null;
    if (d.block) {
      const night = prepareNight(state, { ...(d.night || { format: 'standard' }) }, ds(`night:${d.day}`));
      state.publicChoice = night.format === 'public-super' ? publicPick(state) : null;
      const f = FORMATS[night.format] || FORMATS.standard;
      rating = runRating(state, rng, { seats: f.seats ?? 2, pick: f.pick, hidden: !!f.hidden, human: !!f.human });
      // Did an ally rate me low? (alliances.js: the group may vote them out.)
      afterRatings(state, ds(`ally-rate:${d.day}`), rating);
      // An instant block happens on the spot (US 1 Ep 9); every other night
      // ends the episode on the ratings and blocks at the start of the next.
      if (night.format === 'instant') {
        runBlocking(state, rng, rating, night);
        for (const h of state.pendingGoodbyes.splice(0)) goodbyeVideo(state, rng, h);
      } else tonight = { rating, night };
    }
    if (d.final) { finalRow = finalDay(state, rng); rating = finalRow; }
    if (d.finale) result = finaleDay(state, rng, finalRow);

    // The edit, then the words: what aired is decided first, and the writing
    // layer has its own dice (Plan 2), so neither can move a result.
    chooseAired(state, d.day);
    if (state.options.script !== false) writeDay(state, d.day);
    airDay(state);
    // `num` and the people still in are what the site's run tab reads; the
    // name map lets an episode be shown later without the engine's state.
    // Who left, in the shape every screen reads (shows.js roundExits): the
    // people behind each blocked profile, the profile the room knew, and who
    // did the blocking.
    const exits = state.blocked.filter(b => b.day === d.day).flatMap(b => {
      const p = state.profiles[b.handle] || {};
      const by = (b.by || []).map(h => state.profiles[h]?.shown?.name).filter(Boolean);
      return (p.players || []).map(name => ({ name, verb: 'blocked', channel: b.channel || 'blocking',
        profile: p.shown?.name || null, by, ...(b.secret ? { secret: true } : {}) }));
    });
    const row = { num: d.day, episode: d.day, day: d.day, format: CIRCLE_FORMAT, slot: d.slot, exits,
      ci: { active: [...state.active], rating,
        // The room at the end of the episode (snapshot.js): the web screen and Debug read it.
        end: (() => {
          const end = snapshotEnd(state, publicSnapshot(state));
          // What moved since the last episode (the web screen and the backlog).
          end.changes = changesOf(rows.at(-1)?.ci?.end || null, end, h => state.profiles[h]?.shown?.name || h);
          return end;
        })(),
        // The night's blocking format, and whether the author booked it (or
        // booked one that could not run, and it fell back).
        night: d.night ? { format: d.night.format, booked: !!d.night.booked, fellBack: d.night.fellBack || null } : null,
        people: state.active.flatMap(h => peopleOf(state, h)),
        profiles: Object.fromEntries(Object.entries(state.profiles).map(([h, p]) =>
          // face: what the room sees (a persona's `photo:<id>`, a player's
          // `portrait:<name>`, or null); age/job for the profile card. The
          // screens read these (js/vp-ci), never the engine's state.
          [h, { name: p.shown?.name, people: [...p.players], mode: p.mode, face: p.shown?.face ?? null, room: state.rooms?.[h] ?? null,
            age: p.shown?.age ?? null, job: p.shown?.job ?? null, personaId: p.personaId ?? null,
            status: p.shown?.status ?? null, reason: p.reason ?? null, edits: [...(p.edits || [])],
            bio: (() => { const pr = p.personaId && state.pool.find(x => x.id === p.personaId); return pr ? (pr.bio || bioFor(pr)) : null; })() }])),
        // Who each player really is (the arrival screens): the viewer is
        // told; the room is not.
        cast: Object.fromEntries(Object.values(state.people).map(t => [t.name,
          { age: t.age ?? null, job: t.job ?? null, hometown: t.hometown ?? null, rep: t.rep || 'none', stars: t.stars ?? null }])),
        // The room as the day began (the screens' live sidebar): nothing in
        // it can spoil the episode, which the sidebar then plays forward.
        start,
        blocked: state.blocked.filter(b => b.day === d.day).map(b => b.handle),
        arrivals: arriving, scenes: state.scenes.filter(s => s.day === d.day).length,
        aired: state.scenes.filter(s => s.day === d.day && s.aired)
          .map(s => ({ id: s.id, kind: s.kind, who: s.who, script: s.script || null,
            ...((p => (p ? { people: p } : {}))(peopleAtScene(state, s.id, Object.keys(state.profiles)))),
            ...(s.kind === 'game' ? { game: s.data.gameId } : {}),
            ...(s.kind === 'recognise' && s.data.profile ? { about: s.data.profile } : {}),
            ...(STAGE_DATA[s.kind] ? { d: STAGE_DATA[s.kind](s.data, s) } : {}) })) } };
    rows.push(row);
    gs.episodeHistory.push(row);
  }
  result.fanFavorite = fanFavorite(state);
  return { rows, state, result };
}
