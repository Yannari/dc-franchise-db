// ══════════════════════════════════════════════════════════════════════
// bb/story/director.js — which three to five conversations a stretch airs
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3.2. Runs once a week, after the week has happened (simulateBBWeek
// calls airStorylines(week) just before it returns), so it reads the whole
// week in order and touches no game state: it files every house beat into its
// storyline, and for each stretch between ceremonies picks the steps worth a
// scene. A step airs only if it can be UNDERSTOOD: the earlier step it answers
// either aired or is said plainly at the top of the scene (recap). An
// apology with no offence on record has no cause and never airs.
//
// Each aired scene is stored on the act its step came from (`act.scenes`), so
// the viewer and the transcript keep the week's real order.

import { gs } from '../../core.js';
import { classify, file, causeOf } from './storylines.js';
import { writeStoryScene, writeSetPiece, writeGameTalk, writeCampaignScene, writeEngineScene, hasPool, roomName } from './write.js';
import { gameTalkFor, bondTalkFor, styleTalkFor, phaseOf, hohWeekFor } from './gametalk.js';
import { writeMilestone } from './milestone.js';

const CEREMONY = new Set(['hoh', 'nominations', 'veto', 'veto-ceremony', 'eviction']);
// the ceremonies' own moments (kept in step with vp-bb-ep/steps.js NOM_MOMENT / VETO_MOMENT)
const CER_NOM = /^(nom-stoic|nom-blindside|nom-pawn-reassured|power-ceremony-confrontation)$/;
const CER_VETO = /^(veto-seated|veto-left-on-block|veto-saved-gratitude|veto-backdoor-lands|veto-replacement-shock|power-replacement-fallout|power-ceremony-confrontation)$/;

// How much each step is worth on screen (narrative weighting, never gameplay).
const DRAMA = {
  'feud.friction.snap': 7, 'feud.friction.chores': 5, 'feud.friction.joke': 5, 'feud.argument': 9, 'feud.apology': 6, 'feud.cold': 4,
  'alliance.formed': 7, 'alliance.formed.pact': 5, 'alliance.recruit': 5, 'alliance.checkin': 4, 'alliance.leftout': 6, 'alliance.poach': 6,
  'alliance.exposed': 8, 'alliance.betrayal': 9, 'alliance.repair': 6,
  'showmance.spark': 5, 'showmance.kiss': 7, 'showmance.declare': 8, 'showmance.hiding': 4, 'showmance.jealous': 7,
  'showmance.fight': 8, 'showmance.breakup': 9,
  'target.pitch': 6, 'target.gossip': 4, 'target.lobby': 6, 'target.block': 6, 'target.backdoor': 7, 'target.count': 5,
  'scheme.lie': 6, 'scheme.caught': 9,
  'life.banter': 3, 'life.prank': 4, 'life.chores': 3, 'life.latenight': 3, 'life.friends': 3, 'life.homesick': 4, 'life.breakdown': 6,
};
const dramaOf = s => DRAMA[`${s.type}.${s.step}.${s.outcome}`] ?? DRAMA[`${s.type}.${s.step}`] ?? 3;

// ...and the house's own clock: a vote count needs nominees, a pitch needs an HOH.
const NEEDS_WEEK = {
  // nobody breaks down or gets homesick on the first night: the house has not happened yet
  'life.breakdown': 'hoh', 'life.homesick': 'hoh',
  'target.pitch': 'hoh', 'target.backdoor': 'hoh', 'target.lobby': 'noms', 'target.block': 'noms', 'target.count': 'noms',
};

// The kinds of moment that can happen in front of the whole house: they play INSIDE the
// stretch's set piece (a dig at dinner, a fight that clears the kitchen, flirting on the sofa),
// with everybody else in the room. Deals, pitches and schemes stay private.
const PUBLIC = p => (p.line.type === 'feud' && ['friction', 'argument'].includes(p.step.step))
  || (p.line.type === 'life' && ['banter', 'prank', 'chores'].includes(p.step.step))
  || (p.line.type === 'showmance' && p.step.step === 'spark' && p.step.outcome !== 'couple');

/** File the week and choose what airs. Words only: no game state moves. */
export function airStorylines(week) {
  if (!week || !Array.isArray(week.acts)) return;
  let stretch = 0;
  let at = 0;
  let pending = [];   // { act, line, step } filed this stretch
  let stretchBeats = [];   // every beat of the stretch, filed or not: { act, beat }
  const clock = { hoh: false, noms: false, nomsJust: false, hohJust: false, veto: false, safety: false, cer: false };
  // the game talk this week has aired (gametalk.js): one of each kind a week, one talk per pair
  const talked = new Set();
  const talkedPairs = new Set();
  // a week the season turns a corner (milestone.js) opens on the house noticing it: the jury
  // begins, five left, four, the last three (the user, 2026-10-07: "they don't acknowledge the
  // important moments... it seems monotone")
  try {
    const ms = writeMilestone(week, { present: (week.houseAtStart || []).slice() });
    const first = week.acts.find(a => a && a.type !== 'jury-house');
    if (ms && first) (first.scenes ||= []).unshift(ms);
    // the final four's eviction leaves three, and the next thing is finale night: the last three,
    // alone in the house, close the week
    if ((week.houseAtStart || []).length === 4 && week.evicted) {
      const three = (week.houseAtStart || []).filter(n => n !== week.evicted);
      const f3 = writeMilestone(week, { present: three }, 'f3');
      const last = [...week.acts].reverse().find(a => a && a.type !== 'jury-house');
      if (f3 && last) { f3.id = `milestone:${week.num || 0}:f3`; (last.scenes ||= []).push(f3); }
    }
  } catch { /* the week airs without it */ }
  const season = phaseOf(week);
  // Who is in the house: everybody who started the week, less whoever has gone out of the
  // front door, less latecomers (Rivals) until they walk in.
  const late = new Set(week.acts.find(a => a?.type === 'rivals-open')?.arrived || []);
  const gone = new Set();
  const present = () => (week.houseAtStart || []).filter(n => !gone.has(n) && !late.has(n));
  // how often each kind of scene has aired this season (kept with the storylines)
  const seasonAired = ((gs.bb ||= {}).storyAired ||= {});
  // Who each alliance's title card has shown in it, all season: somebody already shown as a
  // founder is not "recruited" into it later (the audit, 2026-10-06: Axel founded The Guard on
  // the grass, and three days later was asked to join it)
  const shownIn = (gs.bb.allianceShown ||= {});
  const rejoins = sc => sc?.title?.kind === 'joined' && (shownIn[sc.title.name] || []).some(n => (sc.title.members || []).includes(n));
  const remember = sc => {
    const t = sc?.title;
    if (t?.name && (t.kind === 'alliance' || t.kind === 'joined')) shownIn[t.name] = [...new Set([...(shownIn[t.name] || []), ...(t.members || [])])];
  };
  const lastGone = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted)?.evicted || null;
  const ctxOf = () => ({ week, hoh: clock.hoh ? (week.hoh || null) : null,
    nominees: clock.noms ? ((clock.cer ? week.finalNominees : week.initialNominees) || week.finalNominees || week.initialNominees || []) : [], stretch,
    firstNight: (week.num || 0) === 1 && stretch === 0, present: present(), phase: season.phase, jurors: season.jurors });

  // Which whole-house set piece opens this stretch.
  const setFor = ctx => {
    if (ctx.firstNight) return 'firstnight';
    if (clock.hohJust && ctx.hoh) return 'hohroom';
    if (clock.nomsJust && ctx.nominees.length >= 2) return 'afternoms';
    if (stretch === 0 && lastGone) return 'morningafter';
    const rota = ['dinner', 'backyard', 'gamenight'];
    return rota[((week.num || 0) * 3 + stretch) % rota.length];
  };

  const airEngine = (ctx, atStart) => {
    // ── the engine's own moments, so nothing that moves the game is lost ──
    // Ranked by what they do to the game; texture (chores, boredom, the weather) stays optional.
    // Up to three a stretch, one per set of people, never somebody not in the house yet.
    // 4: the machinery of the vote (who the group is voting for, recruiting, pleading, blame)
    // (and, the user 2026-10-06: "do they ask to be picked for veto, ask that the veto is used on
    // them, try to play the HOH… house meetings?" — every one of those at 0% before this)
    // The airing audit, 2026-10-07 (the user: "the pawn pitch, is it in the viewer? did you forget
    // other things like this?"): two seasons, every kind of engine moment counted against how often
    // it aired. About seventy kinds never did, because the tiers below gave them nothing and a
    // weight under 2 is never considered. The game moments always air now; the relationship and
    // house-pressure moments when there is room; the texture fills a quiet stretch.
    // (power-pawn-ask is the HOH-week pawn scene now: gametalk.js hohWeekFor, every ask)
    const MUST = /^(power-pawn-resents|power-block-pressure|power-fears-backdoor|campaign-declined|alliance-shaped-block|alliance-wrong-blame|scheme-false-majority|deals-hedged|target-survives-regroup|arc-promise-exposed-by-count|arc-endgame-|jury-written-off|jury-bubble-nerves|jury-told-to-their-face|jury-seat-as-payment|reign-loyalty-test|reign-announces-target|reign-house-decides|showmance-two-votes|showmance-block-pressure|romance-showmanceTarget|alliance-betrayal-unseen|editorial-vote-flip-room|pawn-in-danger-panic|arc-rogue-vote-denial|phase-replacement-fear)/;
    const ROOM = /^(social-grudge-hardens|power-hoh-room-spy|power-hoh-traffic|power-hoh-weight|alliance-inner-circle|showmance-leak-channel|showmance-game-vs-heart|showmance-blind-spot|showmance-hiding-it|followup-overheard-confrontation|arc-blindside-rewatch|arc-threatened-remembers|jury-counting-down|jury-line-crossed|phase-power-changes-people|social-drifting-out|upkeep-|drinks-|romance-triangle|reign-apologises|alliance-unauthorized-vote-fear|power-hoh-room-queue)/;
    const TEXTURE = /^(venue-|bond-quiet-night|life-diary-room|texture-diary-room-rant|phase-safe-relief|power-hoh-room-last-night)/;
    const WEIGHT = id => MUST.test(id) ? 4 : ROOM.test(id) ? 3 : TEXTURE.test(id) ? 2 : /^(bloc-|plan-|fallout-blame|fallout-word|phase-lobby-veto|phase-targets|veto-left|scheme-campaign|power-nom-campaign|deals-vote|power-pick-me|power-veto-promise|power-hoh-pitch|power-hoh-promise|power-hoh-deciding|power-hoh-refuses|phase-veto-holder-weighs|phase-hoh-pressures|life-house-meeting|reign-house-meeting|veto-overruled|veto-debt)/.test(id) ? 4
      : /^(power-hoh-|phase-hoh-room|texture-hoh-letter|editorial-hoh-orbit|editorial-meeting-crash|veto-shrug|deals-competing)/.test(id) ? 3 : /^(bloc-|plan-|fallout-|scheme-|power-nom|power-ceremony|phase-lobby-veto|phase-replacement|phase-targets|phase-house-takes-sides|arc-lie|followup-lie|veto-left|alliance-name-slips|alliance-overlap|social-paranoia|social-grudge|deals-exposed|deals-defection|deals-vote-flip|deals-safety|deals-jury|arc-comfort-becomes|arc-fight-splits|reign-reckoning|phase-scramble|phase-hoh-pressures|phase-block-isolation|phase-outgoing|power-veto-promise|power-veto-draw|alliance-side-deal|campaign-declined|texture-pantry-name|editorial-secret|editorial-interrupted|editorial-meeting-crash)/.test(id) ? 3
      : /^(deals-|alliance-|power-|reign-|arc-|followup-|phase-|social-info|social-blow|jury-)/.test(id) ? 2 : 0;
    const shown = new Set();
    const eng = stretchBeats.filter(({ beat }) => !beat.aired && beat.eventId !== 'campaign-pitch' && WEIGHT(String(beat.eventId || '')) >= 2
      && (beat.players || []).length)
      // most important first; inside a weight, the kind of moment this season has aired least
      .sort((x, y) => WEIGHT(String(y.beat.eventId)) - WEIGHT(String(x.beat.eventId))
        || (seasonAired[`ev:${x.beat.eventId}`] || 0) - (seasonAired[`ev:${y.beat.eventId}`] || 0));
    let engAired = 0;
    // A moment that is only a confessional or two is not a scene on its own: the stretch's are
    // cut together into one Diary Room run, the way the show strings confessionals between scenes
    // (2026-10-07: the airing audit unlocked dozens of game moments, many a single Diary Room line).
    const round = [];
    for (const { act: ea, beat } of eng) {
      // three a stretch; a busy stretch makes room for two more that move the game
      const wt = WEIGHT(String(beat.eventId));
      if (engAired >= 10 || (engAired >= 6 && wt < 4) || (engAired >= 4 && wt < 3)) { if (wt < 4) continue; break; }
      const key = [...beat.players].sort().join('|');
      if (shown.has(key) || shown.has(String(beat.eventId))) continue;
      const sc = writeEngineScene(beat, { ...ctx, present: ctx.present.filter(n => atStart.includes(n)) }, at);
      if (!sc || rejoins(sc)) continue;
      // a fragment that moves nothing (a single spoken line, no setup) does not air; the moments that
      // move the game (vote machinery, HOH, veto, house meetings) still do, however short
      if (sc.lines.filter(l => l.kind === 'say').length === 1 && !sc.lines.some(l => l.kind === 'dr') && WEIGHT(String(beat.eventId)) < 4) continue;
      remember(sc);
      shown.add(key); shown.add(String(beat.eventId));
      beat.aired = true; engAired++;
      seasonAired[`ev:${beat.eventId}`] = (seasonAired[`ev:${beat.eventId}`] || 0) + 1;
      const confessional = sc.lines.length <= 2 && sc.lines.some(l => l.kind === 'dr') && !sc.lines.some(l => l.kind === 'say');
      if (confessional) round.push({ ea, sc });
      else (ea.scenes ||= []).push(sc);
    }
    if (round.length === 1) (round[0].ea.scenes ||= []).push(round[0].sc);
    else if (round.length > 1) {
      // only the confessionals: a stage direction belongs to the room it was written for
      const lines = round.flatMap(({ sc }) => sc.lines.filter(l => l.kind === 'dr'));
      const cast = [...new Set(lines.map(l => l.by).filter(Boolean))];
      const first = round[0].sc;
      (round.at(-1).ea.scenes ||= []).push({ ...first, id: `drround:${week.num || 0}:${stretch}`, step: 'dr-round', room: 'diary-room', roomName: 'Diary Room',
        cast, lines, why: round.map(({ sc }) => sc.why).filter(Boolean).flat(), title: null, ownRoom: false });
    }

  };

  let presentAtStart = null;
  const choose = () => {
    const ctx = ctxOf();
    const atStart = presentAtStart || ctx.present;
    presentAtStart = null;
    if (!pending.length) { airEngine(ctx, atStart); stretchBeats = []; return; }
    const cand = pending.filter(p => {
      const need = NEEDS_WEEK[`${p.line.type}.${p.step.step}`];
      if (need && !clock[need]) return false;
      if (causeOf(p.line, p.step) === false) return false;
      if ([p.step.roles.a, p.step.roles.b, p.step.roles.c].some(n => n && !ctx.present.includes(n))) return false;
      return hasPool(p.line.type, p.step.step, p.step.outcome);
    });
    // Most at stake first; a step continuing a storyline the viewer is following counts more.
    // A storyline that aired last stretch rests unless this is a real turn in it, and none
    // airs more than twice a week: one feud on every screen is a soap, not a house.
    const airedIn = (p, pred) => p.line.steps.filter(s => s.aired && pred(s)).length;
    const score = p => {
      let v = dramaOf({ type: p.line.type, step: p.step.step, outcome: p.step.outcome })
        + (p.line.steps.some(s => s.aired) ? 3 : 0) + (p.line.type === 'life' ? 0 : 0.5);
      if (airedIn(p, s => s.week === (week.num || 0) && s.stretch === stretch - 1)) v -= 4;
      // a season spreads across kinds of scene: every earlier airing of this kind costs a little
      v -= 0.6 * (seasonAired[`${p.line.type}.${p.step.step}.${p.step.outcome}`] || 0);
      return v;
    };
    const ranked = cand.slice().sort((x, y) => score(y) - score(x) || x.step.at - y.step.at);
    // A stretch is an episode segment: a whole-house set piece and six to eight private
    // conversations (the user, 2026-10-06: "too damn short", "you don't feel what's happening").
    const target = ctx.firstNight ? 5 : ranked.filter(p => score(p) >= 8).length >= 3 ? 8 : 6;
    const picked = [];
    const embedded = [];
    const onScreen = {};
    let life = 0;
    const allowed = p => {
      const cast = [p.step.roles.a, p.step.roles.b, p.step.roles.c].filter(Boolean);
      if (cast.some(n => (onScreen[n] || 0) >= 3)) return false;
      if (p.line.type === 'life' && life >= (ctx.firstNight ? 3 : 2)) return false;
      // the end of a showmance is the payoff of its whole story: it airs even in a week (or a
      // stretch) its fight already aired in; a breakup the viewer never saw was a couple who just
      // stopped sitting together
      const ending = p.line.type === 'showmance' && p.step.step === 'breakup';
      if (!ending && [...picked, ...embedded].some(q => q.line === p.line)) return false;   // one step per storyline a stretch
      if (!ending && airedIn(p, s => s.week === (week.num || 0)) >= 2) return false;
      // the same kind of scene in the same storyline rests a fortnight: being left out of a
      // meeting every single week stops being news the second time
      if (p.line.type !== 'life' && airedIn(p, s => s.step === p.step.step && (week.num || 0) - s.week < 2)) return false;
      // a first clash is a first clash: once a feud has aired, more friction is not news
      if (p.line.type === 'feud' && p.step.step === 'friction' && airedIn(p, s => (week.num || 0) - s.week < 2)) return false;
      return true;
    };
    const take = (p, into) => {
      into.push(p);
      if (p.line.type === 'life') life++;
      [p.step.roles.a, p.step.roles.b, p.step.roles.c].filter(Boolean).forEach(n => { onScreen[n] = (onScreen[n] || 0) + 1; });
    };
    // the set piece's public moments first (at most two), then the private conversations
    // (a private room — the HOH room reveal, lights out on the first night — hosts no other moment)
    const hosts = !['hohroom', 'firstbed'].includes(setFor(ctx));
    for (const p of ranked) if (hosts && embedded.length < 2 && PUBLIC(p) && allowed(p)) take(p, embedded);
    for (const p of ranked) {
      if (picked.length >= target) break;
      if (embedded.includes(p) || !allowed(p)) continue;
      take(p, picked);
    }
    // A cause that happened in this same stretch airs as its own scene, first, rather than
    // being recapped in the scene after it.
    for (const p of [...picked, ...embedded]) {
      const cause = causeOf(p.line, p.step);
      if (!cause || cause.aired || picked.length > target) continue;
      const q = cand.find(x => x.step === cause);
      if (q && !picked.includes(q) && !embedded.includes(q)) picked.push(q);
    }
    const note = p => { const k = `${p.line.type}.${p.step.step}.${p.step.outcome}`; seasonAired[k] = (seasonAired[k] || 0) + 1; };
    const firstAct = pending[0].act;

    // ── the set piece: the whole house in one room, with the public moments inside it ──
    const inside = [];
    for (const p of embedded.sort((x, y) => x.step.at - y.step.at)) {
      const sc = writeStoryScene(p.line, p.step, { ...ctx, inSet: true });
      if (!sc || rejoins(sc)) continue;
      remember(sc);
      inside.push({ p, sc });
    }
    // a moment that happens in a room of its own (the bedroom after lights out) is cut to, not
    // played inside the kitchen set piece
    const inSet = inside.filter(x => !x.sc.ownRoom);
    const set = atStart.length >= 4
      ? writeSetPiece(setFor(ctx), { ...ctx, present: ctx.present.filter(n => atStart.includes(n)) }, inSet.map(x => x.sc), { gone: lastGone, at: pending[0].step.at - 0.5 }) : null;
    if (set) (firstAct.scenes ||= []).push(set);
    for (const { p, sc } of inside) {
      p.step.aired = true; p.beat.aired = true; note(p);
      // no set piece to stage it in, or a room of its own: it airs on its own
      if (!set || sc.ownRoom) (p.act.scenes ||= []).push(sc);
    }

    // ── the private conversations, in the order they happened ──
    // A scene that does not set its own room is wherever the event put it, which is mostly
    // the bedroom: five bedroom scenes in a row read as one long night. Move it along.
    const ROTA = ['kitchen', 'living-room', 'backyard', 'bedroom'];
    let lastRoom = set?.room || null;
    // The game talk of the moment (gametalk.js): what the house is saying about THIS week of
    // the game — the Block Buster, the veto, jury, the end — and one conversation driven by a
    // bond, warm or sour. They air in the middle of the stretch's private scenes. A stretch
    // that already holds the Block Buster has played it: nobody plans for it afterwards.
    const talks = [];
    // the house as it was when the stretch began (a Rivals latecomer is not in it yet)
    // and a latecomer is not in it while the act it would air on comes before they walk in
    const arriveAt = week.acts.findIndex(x => x?.type === 'rivals-hoh');
    const lateNames = new Set(week.acts.find(x => x?.type === 'rivals-open')?.arrived || []);
    const before = arriveAt >= 0 && week.acts.indexOf(pending[0].act) < arriveAt;
    const tctx = { ...ctx, present: ctx.present.filter(n => atStart.includes(n) && !(before && lateNames.has(n))) };
    if (!ctx.firstNight) {
      // the HOH's week first (gametalk.js hohWeekFor): the plan, the pawn ask, the target
      // fishing, a floater, or the morning-after verdict on how the week went
      const hw = hohWeekFor(week, tctx, clock, talked, lastGone).slice(0, 4);
      talks.push(...hw);
      const game = hw.length >= 3 ? null : gameTalkFor(week, tctx, { ...clock, safety: clock.safety || pending.some(p => p.act.type === 'safety') }, talked, lastGone)[0];
      if (game) talks.push(game);
      const bond = stretch % 2 === 1 || !game ? bondTalkFor(week, tctx, talkedPairs) : null;
      if (bond && !talked.has(bond.kind)) talks.push(bond);
      // and one houseguest playing their own game (gametalk.js styleTalkFor)
      const style = styleTalkFor(week, tctx, seasonAired);
      if (style) talks.push(style);
    }
    const ordered = picked.sort((x, y) => x.step.at - y.step.at);
    const mid = Math.max(1, Math.floor(ordered.length / 2));
    const airTalks = act => {
      for (const t of talks.splice(0)) {
        const scene = writeGameTalk(t, { ...tctx, avoidRoom: lastRoom }, pending[0].step.at);
        if (!scene) continue;
        talked.add(t.kind);
        lastRoom = scene.room;
        (act.scenes ||= []).push(scene);
      }
    };
    ordered.forEach((p, i) => {
      if (i === mid) airTalks(p.act);
      // the house as the stretch began, latecomers not in it yet: the background of a scene is
      // drawn from this (a Rivals latecomer was asleep on a lounger before walking in)
      const scene = writeStoryScene(p.line, p.step, { ...ctx, present: tctx.present, avoidRoom: lastRoom });
      if (!scene) return;
      if (rejoins(scene)) { p.step.aired = true; return; }
      remember(scene);
      lastRoom = scene.room;
      p.step.aired = true;
      p.beat.aired = true;
      (p.act.scenes ||= []).push(scene);
      note(p);
    });
    if (talks.length) airTalks((ordered.at(-1) || pending[0]).act);
    airEngine(ctx, atStart);

    // The first night ends with the lights going out on a full house.
    if (ctx.firstNight) {
      const bed = writeSetPiece('firstbed', ctx, [], { at: at + 0.5 });
      if (bed) (pending[pending.length - 1].act.scenes ||= []).push(bed);
    }
    pending = [];
    stretchBeats = [];
  };

  // ── the campaign: the nominees work the house ──
  // The user, 2026-10-06: "do they even campaign in your house life?" The engine writes a pitch
  // for every nominee-voter conversation, and none of them aired: a pitch is not a storyline
  // step. Each campaign act airs up to four of its pitches, every nominee at least once,
  // the ones that moved a vote first, never the same nominee and voter twice in a week.
  const pitchedPairs = new Set();
  const airCampaign = act => {
    const ctx = ctxOf();
    const pitches = (act.socialBeats || []).filter(b => b && b.eventId === 'campaign-pitch' && (b.players || []).length >= 2
      && b.players.every(n => ctx.present.includes(n)) && !pitchedPairs.has(b.players.join('>')));
    const rank = b => (b.pitchOutcome === 'worn' ? 3 : b.pitchOutcome === 'receptive' ? 2 : 1);
    const chosen = [];
    const voter = b => b.players[b.players.length - 1];
    for (const nominee of [...new Set(pitches.map(b => b.players[0]))]) {
      const best = pitches.filter(b => b.players[0] === nominee && !chosen.some(c => voter(c) === voter(b))).sort((x, y) => rank(y) - rank(x))[0];
      if (best) chosen.push(best);
    }
    for (const b of pitches.slice().sort((x, y) => rank(y) - rank(x))) {
      if (chosen.length >= 4) break;
      if (!chosen.includes(b) && !chosen.some(c => voter(c) === voter(b))) chosen.push(b);
    }
    chosen.slice(0, 4).forEach((b, i) => {
      const sc = writeCampaignScene(b, ctx, at + i * 0.1, `${week.num || 0}|${act.campaignIndex ?? 0}|${i}|${b.players.join('>')}`);
      if (!sc) return;
      pitchedPairs.add(b.players.join('>'));
      b.aired = true;
      (act.scenes ||= []).push(sc);
    });
  };

  for (const act of week.acts) {
    if (!act) continue;
    if (act.type === 'campaign') airCampaign(act);
    if (CEREMONY.has(act.type)) {
      choose();
      stretch++;
      clock.hohJust = act.type === 'hoh';
      clock.nomsJust = act.type === 'nominations';
      if (act.type === 'hoh') clock.hoh = true;
      if (act.type === 'nominations') clock.noms = true;
      if (act.type === 'veto') clock.veto = true;
      if (act.type === 'veto-ceremony') clock.cer = true;
      if (act.type === 'eviction' && act.evicted) gone.add(act.evicted);
    } else if (act.type === 'rivals-hoh') late.clear();
    if (act.type === 'safety') clock.safety = true;
    for (const beat of act.socialBeats || []) {
      at++;
      // a moment that happens AT a ceremony plays in the ceremony screen (vp-bb-ep/steps.js)
      if ((act.type === 'nominations' && CER_NOM.test(String(beat.eventId || ''))) || (act.type === 'veto-ceremony' && CER_VETO.test(String(beat.eventId || '')))) { beat.aired = true; continue; }
      stretchBeats.push({ act, beat });
      const c = classify(beat);
      if (!c) continue;
      if (!pending.length && !presentAtStart) presentAtStart = present();
      const { line, step } = file(c, { week: week.num || 0, stretch, beatAt: at });
      pending.push({ act, line, step, beat });
    }
  }
  choose();
}
