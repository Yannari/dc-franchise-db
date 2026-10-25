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
import { lineAired } from '../script/write.js';
import { writeStoryScene, writeSetPiece, writeGameTalk, writeCampaignScene, writeEngineScene, writeWitnessAfter, writeVoteTalk, writeArcScene, hasPool, roomName } from './write.js';
import { voteTalkFor } from './votetalk.js';
import { runnerDue, arcDue } from './arcs.js';
import { gameTalkFor, bondTalkFor, styleTalkFor, phaseOf, hohWeekFor } from './gametalk.js';
import { writeMilestone } from './milestone.js';
import { hohRoomBeats } from '../hoh-room.js';

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

/**
 * When a backdoor can be told, by where the week is: 'wait' before the nomination ceremony, 'open' between it
 * and the veto competition, 'gone' once the veto has been played (the user, 2026-10-24: "this should only be
 * before veto and after hoh and nomination ceremony").
 */
export const backdoorWindow = clock => (clock?.veto ? 'gone' : clock?.noms ? 'open' : 'wait');

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
    firstNight: (week.num || 0) === 1 && stretch === 0, present: present(), phase: season.phase, jurors: season.jurors,
    // has the veto meeting happened (a line about who goes up in the veto's place airs only before it)
    cer: !!clock.cer,
    // ...and the veto competition (a line about who might play it or win it airs only before it)
    veto: !!clock.veto });

  // Which whole-house set piece opens this stretch.
  const setFor = ctx => {
    if (ctx.firstNight) return 'firstnight';
    if (clock.hohJust && ctx.hoh) return 'hohroom';
    if (clock.nomsJust && ctx.nominees.length >= 2) return 'afternoms';
    if (stretch === 0 && lastGone) return 'morningafter';
    const rota = ['dinner', 'backyard', 'gamenight'];
    return rota[((week.num || 0) * 3 + stretch) % rota.length];
  };

  // A game moment of one to three spoken lines is a sketch, not a scene (the season read,
  // 2026-10-13: 148 of 659 scenes; Total Drama drops them). It is folded into a conversation the same
  // people are already having this stretch, before its closing confessionals, so the moment still
  // airs and the scene grows. Two sketches that share a speaker become one conversation.
  const spokenOf = sc => sc.lines.filter(l => l.kind === 'say').length;
  const GAME_HOST = new Set(['alliance', 'target', 'talk', 'campaign', 'scheme']);
  // a confrontation is its own scene: folded into somebody's friendly talk it turns it ("Another comp, another
  // loss", then Beth to her own showmance: "You told everybody you were voting Axel out", read 2026-10-14)
  const CONFRONT = /^(arc-promise-exposed|fallout-(blame|denial|hypocrisy)|arc-lie|followup-lie|social-blow|deals-exposed|arc-rogue-vote-denial|deals-broken-promise)/;
  const ROOM_OPEN = /^(the )?(kitchen|backyard|bedroom|living room|hoh room|hoh suite|storage room|bathroom|diary room|pool|hot tub|have-not|dining room)\b/i;
  const placed = sc => sc.lines.some(l => l.kind === 'beat' && ROOM_OPEN.test(String(l.text || '')));
  // what carries one conversation into the next thing said in it: sometimes nothing (people just keep
  // talking), otherwise the least-heard of these this season
  const LINK = ['Then, quieter.', 'Neither of them gets up yet.', 'It turns, the way talk in here always does, to the vote.',
    'A pause. Then the thing they actually came to say.', 'Somebody checks the doorway first.', 'The voices drop.',
    'They lean in a little closer.', 'One more thing, before anybody leaves.', 'The jokes stop for a second.',
    'A glance at the camera. They keep going anyway.', 'Nobody moves to leave.', 'And then, lower:'];
  // what a speaker has already said in a conversation about a vote: a moment folded into it cannot have
  // them say the opposite (read 2026-10-14: "I hugged Chase that morning and wrote his name down that
  // night", then, folded in, "I'd never vote against Chase")
  const VOTE_DENY = /\b(never|didn't|did not|wouldn't|would never) (vote|write|put)\b|\bwasn't me\b|\bnot my vote\b/i;
  const VOTE_ADMIT = /\b(wrote|write) (his|her|their|[A-Z]\w*'s) name\b|\bI voted (against|him|her|them|[A-Z]\w*) ?(out)?\b(?! to keep)/;
  const stanceOf = lines => {
    const m = new Map();
    for (const l of lines) {
      if (l.kind !== 'say' || !l.by) continue;
      const t = String(l.text || '');
      if (VOTE_DENY.test(t)) m.set(l.by, (m.get(l.by) || '') + 'd');
      if (VOTE_ADMIT.test(t)) m.set(l.by, (m.get(l.by) || '') + 'a');
    }
    return m;
  };
  const clashes = (host, sc) => {
    const h = stanceOf(host.lines);
    for (const [n, s] of stanceOf(sc.lines)) {
      const was = h.get(n) || '';
      if ((s.includes('d') && was.includes('a')) || (s.includes('a') && was.includes('d'))) return true;
    }
    return false;
  };
  const fold = (host, sc, salt) => {
    const tail = [];
    while (host.lines.length && host.lines.at(-1).kind === 'dr') tail.unshift(host.lines.pop());
    const hostSpoke = host.lines.some(l => l.kind === 'say');
    let h = 0; for (const c of String(salt)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    // the moment's own opening ("Up at the lookout...") belongs to a scene of its own: inside somebody
    // else's conversation it is a second location (the read of 2026-10-14: a lookout in a kitchen row)
    // ...but only an opening that sets a PLACE: one that sets up the moment itself ("Caleb finds Chase on
    // the floor with the letter open") is kept, or "I'm fine. Happy tears." answers nothing (read 2026-10-14)
    const PLACE = /\b(kitchen|backyard|bedroom|living room|storage|pantry|lookout|pier|pond|hot tub|pool|garden|deck|bathroom|HOH room|hammock|sofa|couch|stairs|fence|loungers?|grass|path|volcano|lagoon|waterfall|beach|dock|reeds|log|umbrella|spray|court|gym|memory wall)\b|^(Up|Out|Down|Over) (at|on|by|in)\b/i;
    const firstSay = sc.lines.findIndex(l => l.kind === 'say');
    const own = sc.lines.filter((l, i) => l.kind !== 'dr' && !l.bg && !(l.kind === 'beat' && i < firstSay && PLACE.test(String(l.text || ''))));
    const drs = sc.lines.filter(l => l.kind === 'dr');
    const joiners = [...new Set(own.map(l => l.by).filter(n => n && !host.cast.includes(n)))];
    const linkUsed = (gs.bb.linkUsed ||= {});
    const links = LINK.filter(t => !/to the vote/.test(t) || /bloc-|plan-|vote|campaign|deals-|scheme-|power-nom|phase-/.test(String(sc.step || '')));
    const link = hostSpoke && !own.some(l => l.by && !host.cast.includes(l.by)) ? links.slice().sort((x, y) => (linkUsed[x] || 0) - (linkUsed[y] || 0) || ((h + LINK.indexOf(x)) % 7) - ((h + LINK.indexOf(y)) % 7))[0] : null;
    if (link) linkUsed[link] = (linkUsed[link] || 0) + 1;
    host.lines.push(...(link ? [{ kind: 'beat', by: null, text: link }] : []),
      ...joiners.map(n => ({ kind: 'beat', by: null, text: `${n} comes over.` })), ...own, ...tail, ...drs);
    host.cast = [...new Set([...host.cast, ...joiners])];
    host.why = [...new Set([...(host.why || []), ...(sc.why || [])])];
    if (!host.title && sc.title) host.title = sc.title;
    (host.folded ||= []).push(sc.id || null);
  };
  const airEngine = (ctx, atStart, before = new Set()) => {
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
    const MUST = /^(power-pawn-resents|power-block-pressure|power-fears-backdoor|campaign-declined|alliance-shaped-block|alliance-wrong-blame|scheme-false-majority|deals-hedged|target-survives-regroup|arc-promise-exposed-by-count|arc-endgame-|jury-written-off|jury-bubble-nerves|jury-told-to-their-face|jury-seat-as-payment|reign-loyalty-test|reign-announces-target|reign-house-decides|showmance-two-votes|showmance-block-pressure|romance-showmanceTarget|alliance-betrayal-unseen|editorial-vote-flip-room|pawn-in-danger-panic|arc-rogue-vote-denial|phase-replacement-fear|theme-|island-|cheat-)/;
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
    // this stretch's own conversations, which a short game moment can fold into
    const hosts = week.acts.flatMap(a => a?.scenes || []).filter(x => !before.has(x) && x.type !== 'set' && x.step !== 'dr-round'
      && Array.isArray(x.lines) && Array.isArray(x.cast) && spokenOf(x) >= 4);
    const loose = [];
    for (const { act: ea, beat } of eng) {
      // three a stretch; a busy stretch makes room for two more that move the game
      const wt = WEIGHT(String(beat.eventId));
      if (engAired >= 10 || (engAired >= 6 && wt < 4) || (engAired >= 4 && wt < 3)) { if (wt < 4) continue; break; }
      const key = [...beat.players].sort().join('|');
      if (shown.has(key) || shown.has(String(beat.eventId))) continue;
      // a nominee working a voter is a campaign pitch, and airs as one: found alone, the case and the
      // reply, the last push and a Diary Room (the read of 2026-10-14: it aired as the case and a
      // one-line reply, "You made a good point. It doesn't change anything.", and nothing else)
      const ectx = { ...ctx, present: ctx.present.filter(n => atStart.includes(n)) };
      const pitch = beat.eventId === 'power-nom-campaign' && (beat.players || []).length === 2
        ? writeCampaignScene(beat, ectx, at, `nom|${week.num || 0}|${beat.players.join('>')}`) : null;
      const sc = pitch ? { ...pitch, step: beat.eventId } : writeEngineScene(beat, ectx, at);
      if (!sc || rejoins(sc)) continue;
      // a fragment that moves nothing (a single spoken line, no setup) does not air; the moments that
      // move the game (vote machinery, HOH, veto, house meetings) still do, however short
      if (sc.lines.filter(l => l.kind === 'say').length === 1 && !sc.lines.some(l => l.kind === 'dr') && WEIGHT(String(beat.eventId)) < 4) continue;
      const confessional = sc.lines.some(l => l.kind === 'dr') && !sc.lines.some(l => l.kind === 'say' || (l.kind === 'beat' && !l.bg));
      const airs = () => {
        remember(sc);
        shown.add(key); shown.add(String(beat.eventId));
        beat.aired = true; engAired++; lineAired(beat.lineToken);
        seasonAired[`ev:${beat.eventId}`] = (seasonAired[`ev:${beat.eventId}`] || 0) + 1;
      };
      // A confessional airs beside the scene it is about (the user, 2026-10-14: "why is Spencer even in
      // this conversation, what's the correlation with his DR"): a stretch's loose confessionals strung
      // together after whatever scene came last read as that scene's, about nothing on screen. It goes
      // after a conversation its speaker is in or is talked about in, and that has whoever it names; one
      // with no such scene stays off camera unless it is the vote's own machinery.
      if (confessional) {
        const drs = sc.lines.filter(l => l.kind === 'dr');
        const by = drs[0]?.by;
        const text = drs.map(l => String(l.text || '')).join(' ');
        const esc = n => String(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const says = (n, t) => new RegExp(`\\b${esc(n)}\\b`).test(t);
        const named = (ctx.present || []).filter(n => n !== by && says(n, text));
        const fits = x => {
          const t = x.lines.filter(l => l.kind !== 'beat').map(l => String(l.text || '')).join(' ');
          const has = n => (x.cast || []).includes(n) || says(n, t);
          // (named and IN it: a confessional about Emmah's visits to the HOH room closed a poach that only
          // mentioned Emmah, read 2026-10-14)
          if (x.type === 'showmance' && !/^(showmance|romance|couple)/.test(String(sc.step || ''))) return false;
          if (/isolation|avoid|cold-war|silent/.test(String(sc.step || ''))) return false;
          // a scheme told to the camera (a rumour started, a whisper campaign) is the close of a game talk,
          // not of a cushion fort or a heart-to-heart with the person it is aimed at
          if (/^(scheme-|social-rumou?r|deals-)/.test(String(sc.step || '')) && !GAME_HOST.has(x.type)) return false;
          // a quiet night's confessional ("we talked about everything except the game") does not close a talk
          // about the HOH's week (read 2026-10-14)
          if (/^(bond-quiet|texture-|life-|venue-)/.test(String(sc.step || '')) && (GAME_HOST.has(x.type) || /hohweek|plan|vote|nom|veto|target|block|campaign/.test(`${x.step || ''} ${x.type || ''}`))) return false;
          if (/^(power-|phase-power|phase-scramble|reign-|editorial-hoh)/.test(String(sc.step || '')) && !/hoh|reign|power|nom|veto|block/.test(`${x.step || ''} ${x.type || ''}`)) return false;
          // somebody's suspicion is not the close of a laugh about food (read 2026-10-15: "Chase keeps ending
          // conversations the second I walk into the room", closing a banter about pizza)
          if (/paranoia|grudge/.test(String(sc.step || '')) && !GAME_HOST.has(x.type)) return false;
          // the guest who will not leave is a joke, not the close of a talk about who goes up (read 2026-10-15:
          // "It's three in the morning. I've stopped answering in sentences", after a pawn said no)
          if (/overstay/.test(String(sc.step || '')) && /pawn|plan|nom|target|block|fish|veto/.test(`${x.step || ''} ${x.type || ''}`)) return false;
          // a grudge is not the close of an apology the speaker just made (Hicks said sorry to Bowie, then:
          // "I'm not looking for an apology from Bowie any more")
          if (/apolog|makeup|reconcil|forgive/.test(String(x.step || '')) && /grudge|blame|feud|cold|paranoia|rant/.test(String(sc.step || ''))) return false;
          return by && (x.cast || []).includes(by) && named.length > 0 && named.every(n => (x.cast || []).includes(n));
        };
        const into = hosts.filter(x => (x.folded || []).length < 2).find(fits);
        if (into) { airs(); into.lines.push(...drs); (into.folded ||= []).push(sc.id || null); continue; }
        if (wt >= 4) { airs(); round.push({ ea, sc }); }
        continue;
      }
      const n = spokenOf(sc);
      if (n >= 1 && n <= 3) {
        // into a conversation the speakers are already in (one newcomer at most, who comes over)
        const speakers = [...new Set(sc.lines.filter(l => l.kind === 'say').map(l => l.by).filter(Boolean))];
        // only a GAME conversation takes a game moment (never a couple's scene, a fight or a heart-to-heart),
        // and only one where every speaker of the moment is already talking (not somebody in the background)
        const talkers = x => new Set(x.lines.filter(l => l.kind === 'say' && l.by && !l.bg).map(l => l.by).filter(n => x.lines.filter(l => l.by === n && l.kind === 'say').length >= 2));
        // a public moment ("The room goes quiet", somebody watching it in the Diary Room) is not a
        // line in two people's private talk (the read of 2026-10-14: the HOH's "as HOH, clean the kitchen"
        // folded into the pawn plan in the HOH room, and Ripper, not there, commenting on it)
        const sayers = new Set(sc.lines.filter(l => l.kind === 'say' && l.by).map(l => l.by));
        const publicMoment = sc.lines.some(l => l.kind === 'beat' && /\b(room|house|everyone|everybody|nobody|table|kitchen|half|people|hands)\b/i.test(String(l.text || '')))
          || sc.lines.some(l => l.kind === 'dr' && l.by && !sayers.has(l.by));
        const confront = CONFRONT.test(String(beat.eventId || ''));
        // (nor a row: "Wow." / "No, I wouldn't. That's the difference between us." / "They lean in a little closer."
        // / "What would you want from someone sitting in the final two?", read 2026-10-15)
        const host = placed(sc) || publicMoment || confront ? null : hosts.filter(x => GAME_HOST.has(x.type) && x.mood !== 'secret' && (x.folded || []).length < 2
          && !/betrayal|fight|argument|blow|confront|exposed|leftout/.test(String(x.step || ''))
          && speakers.every(s2 => talkers(x).has(s2)) && (sc.cast || []).every(n => (x.cast || []).includes(n)) && !/^texture-/.test(String(beat.eventId || ''))
          && !clashes(x, sc))
          .sort((x, y) => (x.folded || []).length - (y.folded || []).length)[0];
        if (host) { airs(); fold(host, sc, `${week.num}|${stretch}|${beat.eventId}`); continue; }
        loose.push({ ea, sc, beat, key, wt: confront ? Math.max(wt, 4) : wt, airs, confront });
        continue;
      }
      airs();
      (ea.scenes ||= []).push(sc);
    }
    // the sketches left over: two that share a speaker are one conversation; a lone one airs only if
    // it is the vote's own machinery, otherwise it stays off camera (the transcript still has it)
    const used = new Set();
    for (const a of loose) {
      if (used.has(a)) continue;
      // the same people talking: one shared speaker was enough before, and two unrelated moments read
      // as one conversation ("Beth voted against Ripper" / "Beth comes over" / "What's it like up here?")
      const sp = sc => new Set(sc.lines.filter(l => l.kind === 'say' && l.by).map(l => l.by));
      const same = (x, y) => x.size === y.size && [...x].every(n => y.has(n));
      const castOf = sc => new Set(sc.cast || []);
      const mate = a.confront ? null : loose.find(b => b !== a && !used.has(b) && !b.confront && !placed(b.sc) && same(sp(b.sc), sp(a.sc)) && sp(a.sc).size >= 2 && same(castOf(b.sc), castOf(a.sc)) && !clashes(a.sc, b.sc));
      if (mate) {
        used.add(a); used.add(mate);
        a.airs(); mate.airs();
        const merged = { ...a.sc, cast: [...a.sc.cast], lines: [...a.sc.lines], why: [...(a.sc.why || [])] };
        fold(merged, mate.sc, `${week.num}|${stretch}|${mate.beat.eventId}`);
        (a.ea.scenes ||= []).push(merged);
      } else if (a.wt >= 4) { used.add(a); a.airs(); (a.ea.scenes ||= []).push(a.sc); }
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

  // ── witnesses, later: a row the viewer saw, with somebody taking a side, comes back in the next
  // stretch (or the next week's first, when it closed the week), between the witness and the one
  // they went against. One a stretch; kept on gs.bb so a row on eviction night still gets its talk.
  const afterQueue = (gs.bb.witnessAfter ||= []);
  const airAfter = (act, ctx) => {
    if (!act) return;
    for (let i = 0; i < afterQueue.length; i++) {
      const q = afterQueue[i];
      if (q.week === (week.num || 0) && q.stretch >= stretch) continue;
      afterQueue.splice(i, 1); i--;
      const sc = writeWitnessAfter(q.w, ctx, at + 0.2);
      if (sc) { (act.scenes ||= []).push(sc); break; }
    }
    // a row more than a week old is not "earlier" any more
    for (let i = afterQueue.length - 1; i >= 0; i--) if ((week.num || 0) - afterQueue[i].week > 1) afterQueue.splice(i, 1);
  };
  const queueAfter = before => {
    for (const sc of week.acts.flatMap(a => a?.scenes || [])) {
      if (before.has(sc) || !sc.witnessed?.length) continue;
      const w = sc.witnessed.find(x => x.stance !== 'side') || sc.witnessed[0];
      if (w && !afterQueue.some(q => q.w.name === w.name && q.week === (week.num || 0))) afterQueue.push({ week: week.num || 0, stretch, w });
    }
  };

  // ── a running gag and a week of an arc (bb/story/arcs.js): one of each a week at most. An arc beat
  // that belongs before the nominations airs in the stretch after the HOH; one that answers the
  // nominations (payback, the block) in the stretch after them; a runner wherever a stretch has room
  let arcAired = false, runAired = false;
  const arcSpec = (() => { try { return arcDue(week, (week.houseAtStart || []).filter(n => !late.has(n))); } catch { return null; } })();
  const airArcs = (act, ctx) => {
    if (!act) return;
    if (!arcAired && arcSpec && ((arcSpec.when === 'early' && clock.hoh && !clock.noms) || (arcSpec.when === 'late' && clock.noms)
      || (arcSpec.when === 'cer' && clock.cer))) {
      const sc = writeArcScene(arcSpec, ctx, at + 0.3);
      if (sc) { (act.scenes ||= []).push(sc); arcSpec.commit(); arcAired = true; }
    }
    if (!runAired && clock.hoh && stretch >= 1) {
      const r = (() => { try { return runnerDue(week, ctx.present); } catch { return null; } })();
      const sc = r && writeArcScene(r, ctx, at + 0.35);
      if (sc) { (act.scenes ||= []).push(sc); r.commit(); runAired = true; }
    }
  };

  let presentAtStart = null;
  const choose = () => {
    const ctx = ctxOf();
    const atStart = presentAtStart || ctx.present;
    presentAtStart = null;
    const sceneBefore = new Set(week.acts.flatMap(a => a?.scenes || []));
    if (!pending.length) { airAfter(stretchBeats[0]?.act || week.acts.find(Boolean), ctx); airEngine(ctx, atStart, sceneBefore); queueAfter(sceneBefore); stretchBeats = []; return; }
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
      // ...and one of a kind per person: two storylines can both be "Caleb is homesick" (read 2026-10-15: the
      // same four cheered Caleb up twice in a row, a blanket then a dinner)
      if ([...picked, ...embedded].some(q => q.line.type === p.line.type && q.step.step === p.step.step && q.step.roles.a === p.step.roles.a)) return false;
      if (!ending && airedIn(p, s => s.week === (week.num || 0)) >= 2) return false;
      // the same kind of scene in the same storyline rests a fortnight: being left out of a
      // meeting every single week stops being news the second time
      if (p.line.type !== 'life' && airedIn(p, s => s.step === p.step.step && (week.num || 0) - s.week < 2)) return false;
      // a first clash is a first clash: once a feud has aired, more friction is not news
      if (p.line.type === 'feud' && p.step.step === 'friction' && airedIn(p, s => (week.num || 0) - s.week < 2)) return false;
      // move-in night has room for a first clash, not a row about how somebody has been "since earlier,
      // at dinner, in the kitchen" (read 2026-10-15): the rest of a feud waits for the next stretch
      if (ctx.firstNight && p.line.type === 'feud' && p.step.step !== 'friction') return false;
      // the HOH's plan scene already laid the backdoor out to their closest person: telling it again
      // ("Can you keep a secret? Hicks goes up after the veto") to the same person is a rerun (read 2026-10-14)
      if (p.line.type === 'target' && p.step.step === 'backdoor' && [...talked].some(k => /^hohweek\.plan3?\.backdoor/.test(k))) { p.step.aired = true; return false; }
      // A backdoor is told between the nomination ceremony and the veto competition, and only then (the user,
      // 2026-10-24: "Michele goes up after the veto", aired once Michele had won it; "this should only be before
      // veto and after hoh and nomination ceremony"). Before the nominations it waits for them; once the veto has
      // been played it is gone.
      if (p.line.type === 'target' && p.step.step === 'backdoor') {
        const w = backdoorWindow(clock);
        if (w === 'gone') { p.step.aired = true; return false; }
        if (w === 'wait') return false;
      }
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
      // (a week whose target changed has one more: the switch is a beat of its own)
      const hw0 = hohWeekFor(week, tctx, clock, talked, lastGone);
      const hw = hw0.slice(0, hw0.some(t => t.kind.startsWith('hohweek.switch')) ? 5 : 4);
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
        // the engine moment this scene plays (a switch plays its pitch) does not air again on its own
        for (const m of t.mute || []) m.aired = true;
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
    airAfter((ordered.at(-1) || pending[0]).act, ctx);
    airArcs((ordered.at(-1) || pending[0]).act, ctx);
    airEngine(ctx, atStart, sceneBefore);
    queueAfter(sceneBefore);

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
  const pitchedBy = new Map();   // how many pitches of each nominee have aired this week
  const airCampaign = act => {
    const ctx = ctxOf();
    const pitches = (act.socialBeats || []).filter(b => b && b.eventId === 'campaign-pitch' && (b.players || []).length >= 2
      // (a return visit that wore the voter down airs after its first visit did: the second time, on screen)
      && b.players.every(n => ctx.present.includes(n)) && (!pitchedPairs.has(b.players.join('>')) || b.pitchOutcome === 'worn'));
    const rank = b => (b.pitchOutcome === 'worn' ? 3 : b.pitchOutcome === 'receptive' ? 2 : 1);
    const chosen = [];
    const voter = b => b.players[b.players.length - 1];
    // Who works the room most on screen must not tell the viewer who the vote is really between (the
    // user, 2026-10-24, of a Block Buster week: "it's too obvious who is still on the block with the way
    // they're campaigning"). The one the Block Buster will save has fresh voters left when the other two
    // have worked theirs, so they are never seen campaigning more than the busiest of them.
    const seen = n => chosen.filter(c => c.players[0] === n).length + (pitchedBy.get(n) || 0);
    const third = week.blockBeforeSafety?.length && week.safetyWinner ? week.safetyWinner : null;
    const most = () => Math.max(0, ...(week.blockBeforeSafety || []).filter(n => n !== third).map(seen));
    const order = [...new Set(pitches.map(b => b.players[0]))].sort((x, y) => (x === third) - (y === third));
    for (const nominee of order) {
      if (nominee === third && seen(third) > most()) continue;
      const best = pitches.filter(b => b.players[0] === nominee && !chosen.some(c => voter(c) === voter(b))).sort((x, y) => rank(y) - rank(x))[0];
      if (best) chosen.push(best);
    }
    // ...then the rest go to whoever has been seen campaigning least this week
    for (;;) {
      if (chosen.length >= 4) break;
      const left = pitches.filter(b => !chosen.includes(b) && !chosen.some(c => voter(c) === voter(b))
        && !(third && b.players[0] === third && seen(third) >= most()));
      if (!left.length) break;
      chosen.push(left.sort((x, y) => seen(x.players[0]) - seen(y.players[0]) || rank(y) - rank(x))[0]);
    }
    chosen.slice(0, 4).forEach((b, i) => {
      b.firstAired = pitchedPairs.has(b.players.join('>'));
      const sc = writeCampaignScene(b, ctx, at + i * 0.1, `${week.num || 0}|${act.campaignIndex ?? 0}|${i}|${b.players.join('>')}`);
      if (!sc) return;
      pitchedPairs.add(b.players.join('>'));
      pitchedBy.set(b.players[0], (pitchedBy.get(b.players[0]) || 0) + 1);
      b.aired = true;
      (act.scenes ||= []).push(sc);
    });
  };

  // ── the vote talk: the last thing before the live vote (bb/story/votetalk.js) ──
  // the plan, the swing and the one going home, true of the ballots, on the act before the eviction
  const airVoteTalk = evAct => {
    const i = week.acts.indexOf(evAct);
    const host = week.acts.slice(0, i).reverse().find(a => a && !CEREMONY.has(a.type)) || week.acts.slice(0, i).reverse().find(Boolean);
    if (!host) return;
    const ctx = ctxOf();
    let n = 0;
    for (const t of voteTalkFor(evAct, week, ctx.present)) {
      const sc = writeVoteTalk(t, { ...ctx, avoidRoom: (host.scenes || []).at(-1)?.room }, at + 0.5 + n * 0.1);
      if (sc) { (host.scenes ||= []).push(sc); n++; }
    }
  };

  // the night the HOH room opens plays in its own screen, straight after the competition (bb/hoh-room.js)
  const roomBeats = new Set((week.acts || []).flatMap((a, i) => hohRoomBeats(week.acts, i)));
  for (const act of week.acts) {
    if (!act) continue;
    if (act.type === 'campaign') airCampaign(act);
    if (CEREMONY.has(act.type)) {
      choose();
      if (act.type === 'eviction') { try { airVoteTalk(act); } catch { /* the vote airs without it */ } }
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
      if ((act.type === 'nominations' && CER_NOM.test(String(beat.eventId || ''))) || (act.type === 'veto-ceremony' && CER_VETO.test(String(beat.eventId || '')))) { beat.aired = true; lineAired(beat.lineToken); continue; }
      if (roomBeats.has(beat)) { beat.aired = true; lineAired(beat.lineToken); continue; }
      stretchBeats.push({ act, beat });
      const c = classify(beat);
      if (!c) continue;
      if (!pending.length && !presentAtStart) presentAtStart = present();
      const { line, step } = file(c, { week: week.num || 0, stretch, beatAt: at });
      pending.push({ act, line, step, beat });
    }
  }
  choose();
  // a nominee the engine has sitting the campaign out does not say so in a week where House Life shows
  // them working the house (read 2026-10-15: "I'm not going round begging", from somebody who lobbied
  // three rooms that week)
  const lobbied = new Set(week.acts.flatMap(a => a?.scenes || [])
    .filter(x => /^(pitch|lobby|power-nom-campaign)$/.test(String(x.step || '')) && (x.cast || []).length).map(x => x.cast[0]));
  for (const act of week.acts) {
    if (act?.scenes) act.scenes = act.scenes.filter(x => !(x.step === 'campaign-declined' && lobbied.has((x.cast || [])[0])));
  }
}
