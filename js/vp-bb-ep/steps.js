// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/steps.js — a Big Brother week as screens of steps (pure)
// ══════════════════════════════════════════════════════════════════════
//
// Spec 2026-10-01 §4.7. A played week in, a list of screens out, no DOM.
// One screen per aired scene or ceremony; one step per line. The stage, the
// script under it and the sidebar all read this one list, so they never drift.
//
// A step:
//   k      'say' | 'beat' (a caption) | 'dr' (Diary Room) | 'bb' (Big Brother
//          speaks) | 'host' (live)
//   by, t  speaker and line;  push: the camera moves in on the speaker
//   reveal a nominee's face fills a slot on the nominations screen
//   nom    the block is now these;  veto: holder;  medal: 'on' | 'glint'
//   chip   { drawer, chip }  a veto-player chip (chip: a name or 'choice')
//   vetoPlay [names] join the veto;  ballot [voter, evict];  votes [a, b]
//   out    evicted;  exit: walks out of the room;  seat { name: seatId }
//   toast  [text, colour]
//
// The words for ceremonies here are the format's own (BB US): "This is the
// nomination ceremony", "By a vote of...". What a houseguest SAYS at them was
// written by the engine when the ceremony happened (act.script, from
// bb/script/ceremony.js); a save from before that falls back to a plain line.
import { arenaFor } from '../bb/comp-arenas.js';
import { pronouns } from '../players.js';
import { voiceLine } from '../bb/story/register.js';
import { players as ROSTER } from '../core.js';
import { pickPlate, placeOf, plateBuilt, CORNER, CORNER_CAM, cornerPlate } from './plates.js';
import { seatedJurors } from '../bb/jury.js';
import { finaleHouseScenes } from './finale-house.js';
import { hasHohRoom, hohRoomBeats } from '../bb/hoh-room.js';
import { mastermindReveal } from '../bb/mastermind-reveal.js';
import { themeBeatScreens, themeVoiceSteps, themePrimerScreens, themeTurnScreens, haveNotScreens, departureScreens, instantScreens,
  doubleBreakScreen, americasVoteScreens, hackerScreens, hackerVoteScreens, roadkillScreens, pandoraScreens, detonationScreens,
  appStoreScreens, drawTwistSteps, campDirectorScreens, cliqueScreens, splitScreens, otherSideScreen, bucksScreens, sideBetScreens,
  sideBetPaidScreens, derbyScreens, rollersRoomScreens, rivalsScreens, saboteurScreens, voiceOf } from './steps-ports.js';

// The engine's own moments that happen AT a ceremony (the user, 2026-10-06: "most of the time the
// reactions are after, but sometimes it causes drama during the ceremony, same for veto"). They play
// inside the ceremony screen, and House Life does not air them again (bb/story/director.js).
export const NOM_MOMENT = /^(nom-stoic|nom-blindside|nom-pawn-reassured|power-ceremony-confrontation)$/;
export const VETO_MOMENT = /^(veto-seated|veto-left-on-block|veto-saved-gratitude|veto-backdoor-lands|veto-replacement-shock|power-replacement-fallout|power-ceremony-confrontation)$/;
const momentSteps = (act, re) => (act.socialBeats || []).filter(b => re.test(String(b.eventId || '')))
  .flatMap(b => (b.lines?.length ? scriptSteps(b.lines) : [{ k: 'beat', t: stripTags(b.text) }]));

// ── inside their heads: the side panel's lines for the ceremonies ───────
// The user, 2026-10-06: "the nomination ceremony needs the same insight panel too", "and veto
// too". Read from what the engine recorded on the act and the week (the plan, the grievance,
// the pawn's answer, the alliance's say, the draw's reasons, the holder's reasoning), never
// guessed. A step carries `why` from the moment its fact is public, so the panel never tells
// the viewer a key before it turns.
const BW = v => v >= 6 ? 'very close' : v >= 3 ? 'friendly' : v > -2 ? 'neutral' : v > -5 ? 'wary of each other' : 'enemies';
// the bond as it stood at the ceremony (recorded by bb/script/ceremony.js); none on record, no line
const bondLine = (x, y, act) => {
  const b = act?.bondsAt || {};
  const v = b[`${x}|${y}`] ?? b[`${y}|${x}`];
  return v == null ? null : `${x} & ${y}: ${BW(v)} (${v > 0 ? '+' : ''}${v})`;
};
const obj = n => { try { return pronouns(n)?.obj || 'them'; } catch { return 'them'; } };
function nomWhy(act, hoh, noms, row) {
  const out = [];
  const bt = act.backdoorTarget;
  if (bt && !noms.includes(bt)) out.push(`The plan is a backdoor: ${bt} is the real target and is not on the block. If the veto is used, ${bt} goes up in a nominee's place.`);
  else if (act.structure && act.structure !== 'target-pawn' && act.structureWhy) out.push(`The plan: ${act.structureWhy}.`);
  else if (act.target && noms.includes(act.target)) out.push(`${act.target} is the target${act.pawn && noms.includes(act.pawn) ? `; ${act.pawn} is the pawn` : ''}.`);
  const ask = row?.pawnAsk;
  if (ask?.pawn && noms.includes(ask.pawn)) out.push(ask.forced ? `${ask.pawn} was asked to be the pawn, said no, and went up anyway.`
    : ask.willing ? `${ask.pawn} agreed to be the pawn, and ${hoh} now owes them.` : `${ask.pawn} said yes to being the pawn, without much choice.`);
  for (const n of noms) {
    const g = act.grievances?.[n];
    if (!g?.alliance) continue;
    const tail = g.kind === 'betrayal' ? `but ${hoh} holds a betrayal against ${obj(n)}` : g.kind === 'suspicion' ? `but ${hoh} suspects ${n} of working against ${obj(hoh)}`
      : g.kind === 'soured' ? 'but the two of them have cooled off' : 'and nothing has gone wrong between them: this is about who can win';
    out.push(`${n} is in ${g.alliance} with ${hoh}, ${tail}.`);
  }
  for (const b of row?.brokenPromises || []) if (b && noms.includes(b.victim)) out.push(`${b.hoh || hoh} had promised ${b.victim} ${b.type === 'safety' ? 'safety' : 'a deal'}, and broke it${b.sincere === false ? ' (it was never meant)' : ''}.`);
  for (const t of act.allianceConsults || []) {
    if (!t) continue;
    out.push(t.stance === 'sanctioned' ? `${t.hoh} cleared it with ${t.alliance} first: ${t.agrees} of ${t.of} said yes.`
      : t.stance === 'overruled' ? `${t.alliance} told ${t.hoh} no (${t.of - t.agrees} of ${t.of} against), and ${t.hoh} did it anyway.`
        : `${t.hoh} never told ${t.alliance}.`);
  }
  for (const x of act.allianceExits || []) {
    if (!x) continue;
    out.push(x.kind === 'quit' ? `${x.player} has walked away from ${x.alliance} over it.` : x.kind === 'hidden' ? `${x.player} stays in ${x.alliance} and says nothing. For now.` : `${x.alliance} has thrown ${x.player} out.`);
  }
  for (const n of noms.slice(0, 3)) out.push(bondLine(hoh, n, act));
  return out.filter(Boolean);
}
const VETO_WHY = {
  self: '{holder} was on the block, so the veto comes straight off {holder}.',
  backdoor: 'The backdoor: {holder} takes {saved} down so the real target can go up.',
  'own-deal': '{holder} had promised {saved}.',
  'own-nominations': '{holder} is happy with the block as it is.',
  forced: 'The rules forced the veto onto {saved}.',
  'no-replacement': 'There was nobody left to put up, so the veto could not change anything.',
};
function vetoWhy(act, holder, before, hoh) {
  const out = [];
  const t = act.why || VETO_WHY[act.reason];
  if (t) out.push(String(t).replace(/\{holder\}/g, holder).replace(/\{saved\}/g, act.saved || 'a nominee'));
  if (act.replacementWhy) out.push(`The replacement: ${String(act.replacementWhy).replace(/\.$/, '')}.`);
  for (const n of before.filter(n => n !== holder).slice(0, 3)) out.push(bondLine(holder, n, act));
  if (hoh && holder !== hoh) out.push(bondLine(holder, hoh, act));
  return out.filter(Boolean);
}

// every room of the house has its own render now (the user, 2026-10-06: "we don't have all rooms
// like the storage room, the washroom"): the storage room, the Have-Not room and the bathroom
const ROOM_SET = { 'kitchen': 'kitchen', 'living-room': 'ceremony', 'bedroom': 'bedroom', 'hoh-room': 'hoh',
  'backyard': 'yard', 'diary-room': 'dr', 'pantry': 'storage', 'washroom': 'bathroom', 'bathroom': 'bathroom', 'storage-room': 'storage',
  'have-not-room': 'havenot', 'havenot': 'havenot' };
const ROOM_NAME = { kitchen: 'Kitchen', ceremony: 'Living Room', ceremony3: 'Living Room', bedroom: 'Bedroom', hoh: 'HOH Room', yard: 'Backyard',
  dr: 'Diary Room', dining: 'Dining Room', storage: 'Storage Room', havenot: 'Have-Not Room', bathroom: 'Bathroom' };
const CAM = { kitchen: 2, ceremony: 4, ceremony3: 4, bedroom: 9, hoh: 14, yard: 5, dr: 1, dining: 3, storage: 6, havenot: 11, bathroom: 8 };
const ACT_TIME = { house: '10:40', hoh: '20:00', nominations: '13:30', veto: '14:10', 'veto-ceremony': '14:00', campaign: '17:20', eviction: 'LIVE' };
const ACT_DAY = { house: 0, hoh: 0, nominations: 1, veto: 2, 'veto-ceremony': 4, campaign: 5, eviction: 6 };

const stripTags = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const titleCase = s => String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const listOf = names => names.length <= 1 ? (names[0] || '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
const spread = n => n <= 1 ? [50] : Array.from({ length: n }, (_, i) => Math.round(18 + (64 * i) / (n - 1)));
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const word = n => WORDS[n] || String(n);
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const pickBy = (list, key) => list[hash(key) % list.length];
// who is in the house at this point of the week: nobody evicted or walked out tonight, nobody not yet arrived
const houseNow = ctx => (ctx.house || []).filter(n => !ctx.gone?.has(n) && !ctx.hidden?.has(n));
// what the ported screens (steps-ports.js) borrow from this file
const KIT = { scriptSteps: (...a) => scriptSteps(...a), seatLiving: (...a) => seatLiving(...a), proseSteps: (...a) => proseSteps(...a), ROOM_NAME, CAM, ACT_TIME, listOf, word, titleCase, houseNow };

/** A written script (act.script.*) as steps. The camera moves in on its first spoken line. */
function scriptSteps(lines, extra = {}) {
  let pushed = false;
  // every scripted line in the speaker's register (bb/story/register.js): a silent houseguest
  // writes on a notepad, the stock replies are said the way this person says them
  // (one script is one scene: its first line keys which of each speaker's registers it is said in)
  const scene = `script|${(lines || []).find(l => l?.text)?.text || ''}`;
  return (lines || []).filter(l => l && l.text).map(l0 => {
    const l = voiceLine(l0, 'script', null, null, scene);
    const k = l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say';
    const push = k === 'say' && !pushed ? (pushed = true) : false;
    return { k, by: l.by || null, t: l.text, ...(push ? { push: true } : {}), ...extra };
  });
}

/** Seats a room has, in the order the viewer fills them. */
const LIVING_SEATS = ['L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3'];
// the nomination table (the user's D03 round table): the far side first (faces to camera), then the
// two ends, then the near side (backs to camera). The Blender dining room has only S0-S7.
const DINING_SEATS = ['S2', 'S3', 'S1', 'S4', 'S0', 'S5', 'S6', 'S7', 'S9', 'S11', 'S8', 'S12', 'S10'];

function seatLiving(nominees, others, standing = null) {
  const seated = {};
  // two chairs in the render; a third nominee gets the place between them
  nominees.slice(0, 3).forEach((n, i) => { seated[n] = i === 0 ? 'N-1' : i === 1 ? 'N1' : 'N0'; });
  if (standing && !seated[standing]) seated[standing] = 'stand';
  others.filter(n => !seated[n]).slice(0, LIVING_SEATS.length).forEach((n, i) => { seated[n] = LIVING_SEATS[i]; });
  return seated;
}

// ── house life: every beat is a scene in its own room ─────────────────
function sceneScreen(beat, ctx, n) {
  const set = ROOM_SET[beat.location] || 'ceremony';
  const people = (beat.players || []).slice(0, 4);
  const xs = spread(people.length);
  const steps = beat.lines?.length
    ? beat.lines.map(l => ({ k: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, t: l.text }))
    : [{ k: 'beat', t: stripTags(beat.text) }];
  return {
    id: `bb-house-v${n}`, kind: 'scene', anchor: ctx.anchor, set, room: ROOM_NAME[set], cam: CAM[set],
    title: titleCase(beat.badgeText || 'House life'), kicker: `Cam ${String(CAM[set]).padStart(2, '0')} · ${ROOM_NAME[set]}`,
    sub: listOf(people), day: ctx.day, time: ACT_TIME.house, cast: people.map((p, i) => [p, xs[i]]), steps,
    mood: sceneMood(beat),
  };
}
/** What a scene is, for the music (vp-bb-ep/sound.js): a fight, a deal, a plan, or just the house. */
function sceneMood(beat) {
  const c = beat.category || '', cls = beat.badgeClass || '';
  if (cls === 'red') return 'drama';
  if (c === 'deals') return cls === 'purple' || cls === 'orange' ? 'scheming' : 'deals';
  if (c === 'ceremonies' || c === 'phases') return 'ceremony';
  if (c === 'invisible') return 'secret';
  return 'house';
}

// ── a competition, in its arena ────────────────────────────────────────
// Overhaul part 5 (the user, 2026-10-13/14: "ceremonies with game feel, comps on the comp field"): a
// weekly HOH or veto competition plays on the Reality Resort's comp field (vp-bb-ep/comp-field.js draws
// it): everybody in it on the field, a leaderboard that fills as each result comes in, the badges the
// engine gave (NO WORD, THREW IT, 5 PLACED), and the key or the medallion when it is won. Each arena
// has its field; the Block Buster keeps its own set.
const ARENA_PLATE = { 'arena-endurance': 'comp-stones', 'arena-course': 'comp-clearing', 'arena-puzzle': 'lawn-bleachers', 'arena-podiums': 'lawn-buttons',
  'arena-stage': 'studio-arrival', 'arena-lanes': 'comp-target', 'arena-pool': 'pool-wide', 'arena-luck': 'lawn-bench' };
// a competition's category, from its catalogue entry (the field animates by it)
const CAT = c => String(c?.category || c?.type || 'physical').toLowerCase();
function compScreen(act, ctx, kind) {
  const comp = act.competition || {};
  const arena = arenaFor(comp.id) || 'arena-course';
  const results = (act.results || []).map(r => r.name).filter(Boolean);
  const winner = act.winner || results[0];
  const finalists = results.slice(0, 4);
  if (act.coHoh && !finalists.includes(act.coHoh)) finalists.splice(Math.min(1, finalists.length), 0, act.coHoh);
  const xs = spread(finalists.length);
  const isHoh = kind === 'hoh' || kind === 'final';   // a final part speaks like an HOH comp, never a veto
  const steps = [];
  steps.push({ k: 'bb', t: isHoh ? `Houseguests, it is time for the Head of Household competition.` : `Houseguests, it is time for the Power of Veto competition.` });
  if (isHoh && act.outgoingHoh) steps.push({ k: 'beat', t: `${act.outgoingHoh}, the outgoing Head of Household, sits this one out.` });
  // BB27: the Zingbot broke into the Hotel Mystère, and the Mastermind came for him.
  const zingMystery = isHoh && comp.id === 'bb-social-zingbot' && ctx.row?.themeId === 'summer-of-mystery';
  if (zingMystery) {
    const vcM = voiceOf('summer-of-mystery', ctx.row?.themeMood).color;
    steps.push({ k: 'beat', t: 'Before anybody reaches the yard, an alarm goes off. Something has broken into the hotel.', toast: ['INTRUDER', '#ff3355'] });
    steps.push({ k: 'voice', own: true, by: 'The Mastermind', vc: vcM, t: 'Nobody enters this hotel without a reservation. Least of all a robot.' });
  }
  const desc = String(comp.desc || '').split(/(?<=\.)\s/)[0];
  // the rules card opens on the competition's name: what they do, how it is lost, how it is won
  if (comp.name) steps.push({ k: 'beat', t: `${comp.name}. ${desc}`, rules: true });
  // the competition's own play-by-play, as the engine wrote it
  // all of it when it is short; the opening and the ending when it is long (the ending is where
  // the winner is: cutting at ten left a winner who never appeared, and a leader who then lost)
  // each moment says who it is about: one person's result reveals their place on the board
  const all = (comp.beats || []).map(b => ({ t: stripTags(b.text), b })).filter(x => x.t);
  const shown = all.length > 14 ? [...all.slice(0, 6), ...all.slice(-8)] : all;
  for (const { t, b } of shown) {
    const who = (b.players || []).filter(Boolean);
    steps.push(who.length === 1 ? { k: 'beat', t, reveal: who, badge: b.badgeText ? [b.badgeText, b.badgeClass || ''] : null } : { k: 'beat', t, ...(who.length ? { focus: who.slice(0, 4) } : {}) });
  }
  if (zingMystery) {
    steps.push({ k: 'beat', t: 'Then every light in the yard flickers, the Zingbot gets one more joke out, and his eyes go dark for good.', shake: true });
    steps.push({ k: 'voice', own: true, by: 'The Mastermind', vc: voiceOf('summer-of-mystery', ctx.row?.themeMood).color, t: 'That is enough comedy. The Zingbot has checked out of my hotel.', toast: ['THE ZINGBOT IS DESTROYED', '#ff3355'] });
  }
  const told = shown.slice(-4).some(x => x.t.includes(winner));
  // what happened between them during it (a collision, a taunt, somebody helping a rival): the
  // engine wrote these and the screen never showed them (the user, 2026-10-06: "events related to comp")
  for (const e of (comp.events || []).slice(0, 4)) {
    if (e.lines?.length) steps.push(...scriptSteps(e.lines));
    else { const t = stripTags(e.text); if (t) steps.push({ k: 'beat', t }); }
  }
  const early = results.slice(4);
  // how it ended, when the play-by-play has not already said: the field falls away, then two are
  // left. Said so it is true of a race, a quiz and an endurance alike (the old "X is out" ladder
  // ran after a winner had already been named, and ended "It comes down to the last one
  // standing" with one person left)
  if (!told && !(isHoh && act.secret) && !(!isHoh && act.orderOnly)) {
    const gone = [...early.slice().reverse(), ...finalists.slice(2).reverse()];
    if (gone.length) steps.push({ k: 'beat', t: `${listOf(gone)} ${gone.length > 1 ? 'are' : 'is'} out of the running.`, reveal: gone });
    if (finalists.length >= 2) steps.push({ k: 'beat', t: `It comes down to ${finalists[0]} and ${finalists[1]}.`, tense: finalists.slice(0, 2) });
  }
  if (isHoh && act.secret) {
    // The Invisible HOH: the house never sees who won. Only the viewer does.
    steps.push({ k: 'beat', t: `The lights go out before anybody sees who finished first. ONLY YOU KNOW: ${winner} is the Head of Household, and nobody in the house will be told.`, toast: ['ONLY YOU KNOW', '#7c5cff'], hoh: winner });
  } else if (!isHoh && act.orderOnly) {
    // Prizes and Punishments: this race only set the pick order — the veto is in a box.
    const order = act.pickOrder || [];
    steps.push({ k: 'beat', t: `${winner} finishes first, so ${winner} picks last.${order[0] ? ` ${order[0]} finished last and picks first.` : ''}`,
      toast: ['PICK ORDER', '#d99a10'] });
  } else if (isHoh && act.coHoh) {
    steps.push({ k: 'beat', t: `${winner} and ${act.coHoh} both win. TWO HEADS OF HOUSEHOLD this week, and each of them names a block.`, toast: ['TWO HOHS', '#d99a10'], hoh: winner });
  } else {
    const threw = (act.results || []).filter(r => r.threw && r.name !== winner).map(r => r.name);
    const cwhy = [...(threw.length ? [`${listOf(threw)} threw it on purpose.`] : []),
      ...(!isHoh ? (ctx.nominees || []).filter(n => n !== winner).slice(0, 3).map(n => bondLine(winner, n, act)).filter(Boolean) : [])];
    steps.push({ k: 'beat', t: isHoh ? `${winner} wins Head of Household!` : `${winner} wins the Power of Veto!`, win: winner, confetti: true,
      toast: [isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO', '#d99a10'], ...(isHoh ? { hoh: winner } : { veto: winner }), ...(cwhy.length ? { why: cwhy } : {}) });
  }
  // BB27: the first Head of Household competition was the Mastermind's lair, and its winner got to destroy it.
  if (isHoh && ctx.week === 1 && ctx.row?.themeId === 'summer-of-mystery' && !act.secret) {
    steps.push({ k: 'beat', t: `And the prize comes with one more thing: ${winner} gets to take the Mastermind's lair apart, piece by piece, while the house cheers.`, toast: ["THE MASTERMIND'S LAIR", '#4fbf8b'] });
    steps.push({ k: 'voice', own: true, by: 'The Mastermind', vc: voiceOf('summer-of-mystery', 'neutral').color, t: 'Enjoy it. I have other rooms.' });
  }
  const reaction = kind === 'final' ? null : isHoh ? act.script?.hoh : act.script?.veto;
  if (reaction?.length && !(isHoh && act.secret)) steps.push(...scriptSteps(reaction));
  else if (!(isHoh && act.secret) && !(!isHoh && act.orderOnly)) steps.push({ k: 'say', by: winner, push: true, t: pickBy(isHoh
    ? ['Yes! Oh my god, yes!', 'I needed that. I really needed that.', 'Head of Household. Say it again.', 'Okay. Okay! Breathe.']
    : ['That veto is mine.', 'Yes! I am not going anywhere this week.', 'Power of Veto, baby!', 'I needed that one.'], `${ctx.week}|${kind}|${winner}`) });
  return {
    id: isHoh ? 'bb-hoh-v' : 'bb-veto-v', kind: isHoh ? 'hoh' : 'veto', anchor: isHoh ? 'hoh' : 'veto', label: isHoh ? 'HOH' : 'Veto',
    // The competition's own themed board (js/vp-bb-sig: The Wall, Bowlerina, the final run...)
    // plays in this slot when the classic builder drew one; this screen is its record.
    // The competition's own themed board (js/vp-bb-sig: The Wall, Bowlerina, the final run...) plays in
    // this slot when the classic builder drew one (the user, 2026-10-14: "hoh stay classic, and veto, and
    // blockbuster"); this screen is its record, and the comp-field version plays only when there is none
    legacy: isHoh ? /^bb-hoh(-\d+)?$/ : /^bb-veto(-\d+)?$/,
    set: arena, arena: true, room: comp.name || 'Competition', cam: 7,
    title: isHoh ? 'Head of Household' : 'Power of Veto', kicker: comp.name || 'Competition', sub: comp.name || '',
    day: ctx.day, time: ACT_TIME[kind] || '20:00', cast: finalists.map((p, i) => [p, xs[i]]), steps,
    ...(kind !== 'final' && ARENA_PLATE[arena] ? {
      set: 'comp', plate: ARENA_PLATE[arena], cast: [],
      // endurance is a night out in the backyard; everything else is the afternoon
      time: arena === 'arena-endurance' ? '9:40 PM' : '2:30 PM',
      comp: { kind: isHoh ? 'hoh' : 'veto', name: comp.name || 'Competition', cat: CAT(comp), desc: String(comp.desc || ''), stats: comp.stats || null,
        players: (comp.participants || act.participants || results).filter(Boolean), out: (comp.excluded || []).filter(Boolean),
        scores: comp.scores || Object.fromEntries((act.results || []).map(r => [r.name, Number(r.score) || 0])),
        placements: comp.placements || results, winner, secret: !!(isHoh && act.secret), orderOnly: !!(!isHoh && act.orderOnly),
        threw: (act.results || []).filter(r => r.threw).map(r => r.name), outgoing: isHoh ? act.outgoingHoh || null : null },
    } : {}),
  };
}

// ── the HOH room opens ─────────────────────────────────────────────────
// The user's #9 (2026-10-16): the ceremonies should feel like the show's. The night of the competition, the new Head
// of Household gets the key, the whole house runs up the stairs behind them, the door opens on the photos and the
// basket, and the room empties out until only the people the HOH wants are left. What happens in there that night is
// the engine's (bb/hoh-room.js): the room opening on the house, who stays when the rest leave, the letter, and what
// each of those moved goes in the side panel. House Life does not air them again (bb/story/director.js).
const HOH_ROOM_SEES = [
  ['Look at you as a baby!', 'Put that down. Put it down right now.'],
  ['There is a whole basket of your snacks in here.', 'Hands off. Okay. One each.'],
  ['You have the spy screen! You can see the whole house from up here.', 'I can see all of you. Remember that.'],
  ['This bed is bigger than my whole bedroom at home.', 'Shoes! Get your shoes off the bed!'],
  ['Who picked these photos? These are so embarrassing.', 'Somebody back home who wanted me to suffer.'],
  ['It smells like a hotel in here. A nice hotel.', 'It smells like winning.'],
  ['There is a shower in here. A private shower.', 'And nobody is using it but me.'],
];
const HOH_ROOM_LOOK = [
  `Photos from home on the dresser, a basket of favourite snacks on the bed, and a letter on the pillow. {h} slides the letter into a pocket for later.`,
  `The photos go up first. Then somebody finds the basket. Then somebody finds the spy screen, and the whole house crowds round it.`,
  `Everybody heads straight for the photos. {h} heads straight for the letter, looks at it, and puts it away unopened.`,
];
const HOH_ROOM_DR = [
  `Everybody came up those stairs smiling. I know what most of those smiles are for.`,
  `Tonight I get to enjoy this room. Tomorrow I name nominees, and everybody who hugged me on the stairs knows it.`,
  `This room has a lock on the door. For one week, that is the most powerful thing in the house.`,
  `I counted who ran up the stairs first and who came up last. I will be thinking about that list all night.`,
];
// what one of the night's moments moved, said for the side panel
function effectWhy(b) {
  const out = [];
  for (const e of b.effects || []) {
    const [x, y] = e.players || [];
    if (e.kind === 'bond' && x && y) out.push(`${x} & ${y}: ${Number(e.delta) > 0 ? 'closer' : 'further apart'}`);
    else if (e.kind === 'suspicion' && x && y) out.push(`${x} is warier of ${y} now`);
    else if (e.kind === 'pop' && x) out.push(`${x}: ${Number(e.delta) > 0 ? 'the audience warms to this' : 'the audience goes cold on this'}`);
    else if (e.text) out.push(stripTags(e.text));
  }
  return out.slice(0, 4);
}
function hohRoomScreen(act, ctx, beats) {
  const hoh = act.winner;
  const house = houseNow(ctx);
  const rest = house.filter(n => n !== hoh);
  const key = `${ctx.week}|hohroom|${hoh}`;
  // the house in the room: the HOH in the middle, the first six through the door around (more is a wall of faces)
  const first = rest.slice().sort((a, b) => hash(`${key}|in|${a}`) - hash(`${key}|in|${b}`)).slice(0, 6);
  const crowd = [...first.slice(0, 3), hoh, ...first.slice(3)];
  const spreadAt = names => names.map((n, i, a) => [n, Math.round(8 + (84 * i) / Math.max(1, a.length - 1))]);
  const steps = [
    { k: 'bb', t: `${hoh}, please come to the Diary Room to collect your Head of Household key.` },
    { k: 'beat', t: `${hoh} comes out holding the key, and the whole house is already waiting on the stairs.`, at: [[hoh, 50]] },
    { k: 'beat', t: `The key turns. The door swings open, and everybody pours in behind ${hoh}.`, at: spreadAt(crowd), door: true, turnKey: true },
    { k: 'beat', t: pickBy(HOH_ROOM_LOOK, key).replace(/\{h\}/g, hoh), toast: ['THE HOH ROOM', '#f5c542'] },
  ];
  // two of the house react to the room, and the HOH answers (no game in it: the room is new)
  const seen = rest.slice().sort((a, b) => hash(`${key}|${a}`) - hash(`${key}|${b}`)).slice(0, 2);
  const lines = HOH_ROOM_SEES.slice().sort((a, b) => hash(`${key}|${a[0]}`) - hash(`${key}|${b[0]}`));
  seen.slice(0, beats.length >= 2 ? 1 : 2).forEach((n, i) => steps.push({ k: 'say', by: n, t: lines[i][0], ...(i ? {} : { push: true }) }, { k: 'say', by: hoh, t: lines[i][1] }));
  // the night's moments, as the engine had them: the room opening is the whole house; the rest is a room emptying
  let emptied = false;
  for (const b of beats) {
    const who = b.scene?.who || {};
    const said = (b.lines?.length ? scriptSteps(b.lines) : [{ k: 'beat', t: stripTags(b.text) }])
      // the house has just crowded in on screen: a line that says so again starts at what happened next
      .map(x => x.k === 'beat' ? { ...x, t: x.t.replace(/^The whole house crowds into the HOH room to look at the photos\. /, '') } : x);
    if (!said.length) continue;
    if (b.eventId !== 'power-hoh-room-reveal' && !emptied) {
      emptied = true;
      const stay = [who.a, who.b].filter(Boolean);
      const gone = rest.filter(n => !stay.includes(n));
      // (a moment that opens on its own picture of the room, "An hour later, only...", says it better)
      if (gone.length && said[0].k !== 'beat') steps.push({ k: 'beat', t: `Bit by bit the house drifts back downstairs, until only ${listOf(stay)} ${stay.length > 1 ? 'are' : 'is'} left.`, at: spreadAt(stay) });
      else if (gone.length) said[0] = { ...said[0], at: spreadAt(stay) };
    }
    const why = effectWhy(b);
    if (why.length) said[said.length - 1] = { ...said[said.length - 1], why };
    if (b.badgeText) said[0] = { ...said[0], badge: [b.badgeText, b.badgeClass || ''] };
    steps.push(...said);
  }
  steps.push({ k: 'dr', by: hoh, t: pickBy(HOH_ROOM_DR, key) });
  return {
    id: 'bb-hohroom-v', kind: 'hohroom', anchor: 'hoh', label: 'HOH Room', set: 'hoh', room: ROOM_NAME.hoh, cam: CAM.hoh,
    title: 'The HOH Room', kicker: `Cam ${String(CAM.hoh).padStart(2, '0')} · HOH room`, sub: `${hoh}'s room opens`,
    day: ctx.day, time: '22:10', cast: [[hoh, 50]], steps,
  };
}

// ── nominations, as the modern show runs them ──────────────────────────
function nomScreen(act, ctx) {
  const hoh = act.hoh || ctx.hoh;
  const noms = (act.nominees || []).filter(Boolean);
  const others = ctx.house.filter(n => n !== hoh && !noms.includes(n));
  const seated = { [hoh]: 'head' };
  const sitting = [...noms, ...others].slice(0, DINING_SEATS.length);
  // nominees take seats in the middle of the order, not side by side at the front
  sitting.sort((a, b) => hash(`${ctx.week}|${a}`) - hash(`${ctx.week}|${b}`)).forEach((n, i) => { seated[n] = DINING_SEATS[i]; });
  const duo = act.duo?.blocks?.length ? act.duo : null;
  if (duo) return duoNomScreen(act, ctx, hoh, noms, seated, duo);
  if (act.anonymous) return anonNomScreen(act, ctx, hoh, noms, seated);
  // A chair the Head of Household did not fill (a Roadkill winner's, America's, a curse's, the scoreboard's) is on
  // the block, but its key is not the HOH's to turn: the HOH named two, and said "three" and turned three keys
  // (the user, 2026-10-16, on the final four: "it doesnt understand that they dont have a choice").
  const outside = {};
  if (act.roadkillChair && noms.includes(act.roadkillChair)) outside[act.roadkillChair] = 'roadkill';
  if (act.curseChair && noms.includes(act.curseChair)) outside[act.curseChair] = 'curse';
  if (act.deadLastChair && noms.includes(act.deadLastChair)) outside[act.deadLastChair] = 'deadlast';
  const anN = act.americasChair || ctx.anAct?.nominee;
  if (anN && noms.includes(anN)) outside[anN] = 'america';
  const mine = noms.filter(n => !outside[n]);
  // In the Sanctum (BB27) there are no keys: the HOH sets a voodoo doll of each nominee on the table, by candlelight.
  const doll = !!ctx.sanctum;
  const steps = doll ? [
    { k: 'beat', t: 'The Sanctum, at an hour the Mastermind chose. Candles, a round table, and a voodoo doll of every houseguest still in the game.', toast: ['THE SANCTUM', '#e8dcc0'] },
    { k: 'voice', own: true, by: 'The Mastermind', vc: voiceOf('summer-of-mystery', 'hostile').color, t: `${hoh}, there are no keys tonight. Place the dolls of the houseguests you nominate on the table.` },
    { k: 'say', by: hoh, t: `It is my responsibility as Head of Household to nominate ${word(mine.length)} houseguests for eviction.` },
  ] : [
    { k: 'bb', t: 'This is the nomination ceremony.' },
    { k: 'say', by: hoh, t: `This is the nomination ceremony. It is my responsibility as Head of Household to nominate ${word(mine.length)} houseguests for eviction.` },
    { k: 'say', by: hoh, t: `I will now turn my first key.` },
  ];
  const nwhy = nomWhy(act, hoh, mine, ctx.row);
  const last = noms.length - 1;
  mine.forEach((n, i) => {
    steps.push({ k: 'beat', t: doll ? (i === 0 ? `${hoh} picks up ${n}'s doll and sets it in the middle of the table.` : `${hoh} sets ${n}'s doll down beside it.`)
      : i === 0 ? `${hoh} turns the first key. A face fills the first slot on the screen.` : `${hoh} turns the next key.`, reveal: n,
      ...(i === mine.length - 1 ? { nom: mine.slice(), ...(mine.length === noms.length ? { nom: noms.slice(), toast: ['NOMINATED', '#ff3355'] } : {}), ...(nwhy.length ? { why: nwhy } : {}) } : {}) });
  });
  Object.entries(outside).forEach(([n, how], j) => {
    const fin = mine.length + j === last ? { nom: noms.slice(), toast: ['NOMINATED', '#ff3355'] } : {};
    if (how === 'roadkill') steps.push({ k: 'bb', t: 'There is one more key. The Roadkill winner has nominated a houseguest, and nobody will be told who.' },
      { k: 'beat', t: 'The third key turns on its own. A face fills the last slot.', reveal: n, ...fin, why: [ctx.roadkillWinner ? `Only you know: ${ctx.roadkillWinner} won Roadkill and named ${n}.` : `Nobody in the house named ${n}.`] });
    else if (how === 'america') steps.push({ k: 'bb', t: 'There is one more key. America has nominated a houseguest.' },
      { k: 'beat', t: 'A key turns with nobody\'s hand on it. A face fills the last slot.', reveal: n, ...fin,
        why: [ctx.anAct?.mvp ? `Only you know: ${ctx.anAct.mvp} was voted Most Valuable Player and named ${n}.` : `The audience named ${n}. Nobody in the house did.`] });
    else if (how === 'curse') steps.push({ k: 'bb', t: `${n}, there is one more key, and it is yours. You must nominate yourself.` },
      { k: 'beat', t: `${n} turns the last key. ${n}'s own face fills the slot.`, reveal: n, ...fin });
    else steps.push({ k: 'bb', t: `${n} finished last in the Head of Household competition, and takes the last chair.` },
      { k: 'beat', t: 'The last key turns on its own.', reveal: n, ...fin });
  });
  const named = mine.map((n, i) => (i === mine.length - 1 && mine.length > 1 ? `and you, ${n}` : `you, ${n}`)).join(mine.length > 2 ? ', ' : ' ');
  steps.push({ k: 'say', by: hoh, push: true, t: `I have nominated ${named}, for eviction.` });
  if (act.script?.noms?.length) {
    steps.push(...scriptSteps(act.script.noms));
    // every nominee past the two the speech was about hears a reason too
    for (const n of mine) steps.push(...scriptSteps(act.script?.nomThird?.[n]));
  } else if (act.target) {
    const why = act.target === act.backdoorTarget ? null
      : act.structure === 'expendables' ? `This isn't personal. I had to put two people up, and I went with the people I've connected with least.`
        : act.pawn ? `${act.pawn}, you're up there as a pawn, and you know that. ${act.target}, I think you know why you're sitting there.`
          : `${act.target}, I think you know why you're sitting there.`;
    if (why) steps.push({ k: 'say', by: hoh, t: why });
  }
  // at the table: the engine's own moments first, then everybody else's reaction, by where they
  // stood with the HOH at the ceremony (act.bondsAt); somebody volatile who cannot stand the HOH
  // does not wait for the Diary Room
  const moments = momentSteps(act, NOM_MOMENT);
  steps.push(...moments);
  const reacted = new Set(moments.map(s => s.by).filter(Boolean));
  const VOLATILE = new Set(['hothead', 'wildcard', 'chaos-agent', 'villain']);
  for (const n of noms) {
    if (reacted.has(n)) continue;
    // a chair nobody at the table turned: no look at the HOH, a look at everybody
    if (outside[n] && outside[n] !== 'curse') {
      steps.push({ k: 'beat', t: pickBy([`${n} looks round the table at every face, one at a time. Nobody looks back.`, `${n} stares at the screen. Nobody at this table turned that key, or everybody says so.`,
        `${n} laughs, once, without meaning it. Then the counting starts: who in this room could have done that?`], `${ctx.week}|out|${n}`) });
      continue;
    }
    const bond = act.bondsAt?.[`${hoh}|${n}`] ?? 0;
    const arch = (ROSTER || []).find(p => p.name === n)?.archetype;
    const salt = `${ctx.week}|react|${n}`;
    if (bond <= -3 && VOLATILE.has(arch)) {
      steps.push({ k: 'say', by: n, t: pickBy(['You know what? Say it. Say why. Out loud.', 'Wow. You couldn\'t even look at me while you did that!', 'Of course it\'s me. OF COURSE it\'s me.'], salt) });
      steps.push({ k: 'say', by: hoh, t: pickBy(['I said what I had to say.', 'It\'s a game. You know it\'s a game.', 'Not here. Not now.'], salt) });
      steps.push({ k: 'say', by: n, t: pickBy(['Then I\'ll see you on the other side of the veto.', 'Fine. Enjoy your week.', 'Remember this. Because I will.'], salt) });
      steps.push({ k: 'beat', t: pickBy([`Nobody at the table moves. Somebody very slowly puts a fork down.`, `The table goes silent. ${hoh} stares at the key box.`], salt) });
    } else if (bond >= 3) {
      const inOnIt = n === act.pawn || (act.backdoorTarget && !noms.includes(act.backdoorTarget));
      steps.push({ k: 'beat', t: inOnIt
        ? pickBy([`${n} catches ${hoh}'s eye and gives a small nod. They talked about this.`, `${n} nods, very slowly, and doesn't say a word.`, `${n} lets out a breath that is almost a laugh.`], salt)
        : pickBy([`${n} stares at ${hoh}. ${hoh} can't hold the look.`, `${n} goes very still. Of all the faces that could have come up, it was not supposed to be this one.`, `${n} looks at ${hoh} like ${hoh} is somebody new.`], salt) });
    } else if (bond <= -2) {
      steps.push({ k: 'say', by: n, t: pickBy(['Saw that coming.', 'Of course.', 'Great. Thanks.'], salt) });
    } else {
      steps.push({ k: 'beat', t: pickBy([`${n} keeps a straight face. Just about.`, `${n} sits very still.`, `${n} looks down at the table.`], salt) });
    }
  }
  steps.push({ k: 'say', by: hoh, t: 'This nomination ceremony is adjourned.' });
  // an alliance broken by these nominations: who walked away, who was thrown out
  for (const x of act.allianceExits || []) {
    if (!x?.player || !x.alliance || x.kind === 'hidden') continue;
    steps.push({ k: 'beat', t: x.kind === 'quit' ? `${x.player} walks away from ${x.alliance}.` : `${x.alliance} throws ${x.player} out.`, card: { kind: 'out', name: x.alliance, members: [x.player] } });
  }
  for (const n of noms) steps.push(...scriptSteps(act.script?.nomDr?.[n]));
  return { id: 'bb-noms-v', kind: 'noms', anchor: 'noms', set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining,
    title: 'Nomination Ceremony', kicker: 'Cam 03 · Dining room', sub: `${hoh} at the head of the table`,
    day: ctx.day, time: ACT_TIME.nominations, seated, steps };
}


// A duos week: the HOH nominates a PAIR, and the partner goes up because of
// who they walked in with. Said as one decision, keys turned together, one
// reason per duo (tests/bb-duos-screens: the ceremony that read as four
// separate nominations, with an invented grievance for each partner).
function duoNomScreen(act, ctx, hoh, noms, seated, duo) {
  const blocks = duo.blocks;
  const two = blocks.length > 1;
  const steps = [
    { k: 'bb', t: 'This is the nomination ceremony.' },
    { k: 'say', by: hoh, t: two
      ? `It is my responsibility as Head of Household to nominate TWO DUOS for eviction, not four houseguests. I'm going to turn the keys two at a time.`
      : `It is my responsibility as Head of Household to nominate a DUO for eviction, not two houseguests. I'm going to turn the keys together.` },
  ];
  const ORD = ['first two', 'next two', 'last two'];
  blocks.forEach((pair, bi) => {
    const [a, b] = pair;
    steps.push({ k: 'beat', t: `${hoh} turns the ${ORD[bi] || 'next two'} keys together. ${a} and ${b} come up on the wall side by side. This week, nobody goes up alone.`, reveal: a });
    steps.push({ k: 'beat', t: `${b}.`, reveal: b, ...(bi === blocks.length - 1 ? { nom: noms.slice(), toast: [two ? 'TWO DUOS' : 'NOMINATED', '#ff3355'] } : {}) });
  });
  blocks.forEach((pair, bi) => {
    const target = pair.includes(act.target) ? act.target : pair[0];
    const partner = pair.find(n => n !== target);
    const kin = duo.kins?.[bi] || duo.kin;
    const kinLine = kin && kin !== 'Came in together' ? ` You are ${String(kin).toLowerCase()}.` : '';
    steps.push({ k: 'say', by: hoh, push: true, t: `${target}, I think you know why you're sitting there.` });
    steps.push({ k: 'say', by: hoh, t: `${partner}, I'm not going to stand here and invent something. ${target} is who I came for, and you are who ${target} walked in with.${kinLine}` });
  });
  steps.push({ k: 'bb', t: 'This nomination ceremony is adjourned.' });
  return { id: 'bb-noms-v', kind: 'noms', anchor: 'noms', set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining,
    title: 'Nomination Ceremony', kicker: 'Cam 03 · Dining room', sub: `${hoh} nominates ${two ? 'two duos' : 'a duo'}`,
    day: ctx.day, time: ACT_TIME.nominations, seated, steps };
}

// The Invisible HOH (or any sealed ceremony): the HOH never stands up. Big
// Brother reads the keys, and the house is left to guess.
function anonNomScreen(act, ctx, hoh, noms, seated) {
  delete seated[hoh];
  const others = ctx.house.filter(n => !Object.keys(seated).includes(n) && n !== hoh).slice(0, 1);
  others.forEach(n => { seated[n] = 'S0'; });
  seated[hoh] ||= 'S7';
  const steps = [
    { k: 'bb', t: 'This is the nomination ceremony. The Head of Household has chosen to remain hidden. THE VOICE OF BIG BROTHER will reveal the nominations.' },
  ];
  noms.forEach((n, i) => steps.push({ k: 'bb', t: i === 0 ? `The first nominee is ${n}.` : `The ${i === noms.length - 1 ? 'final' : 'next'} nominee is ${n}.`, reveal: n,
    ...(i === noms.length - 1 ? { nom: noms.slice(), toast: ['NOMINATED', '#ff3355'] } : {}) }));
  steps.push({ k: 'beat', t: `Nobody at the table knows who put them there. Everybody is looking at everybody.` });
  steps.push({ k: 'bb', t: 'This nomination ceremony is adjourned.' });
  return { id: 'bb-noms-v', kind: 'noms', anchor: 'noms', set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining, label: 'Nomination Ceremony',
    title: 'Nomination Ceremony', kicker: 'Cam 03 · Dining room', sub: 'The Head of Household stays hidden',
    day: ctx.day, time: ACT_TIME.nominations, seated, steps };
}

// ── the veto player pick ───────────────────────────────────────────────
// The face the drawer makes at the name that comes out (the user's #9, 2026-10-16: the draw should feel like a game).
// Read from how the drawer felt about that person at the draw (bb/week.js records `feel`), never from today's bonds.
const DRAW_FACE = {
  // a nominee pulls a friend: somebody who might use the veto on them
  nomAlly: [['say', 'Yes! Come on, get up here!'], ['say', 'Oh, thank God. Thank you, bag.'], ['say', 'That is the one I wanted.'], ['beat', '{d} grabs {n} by the arm and does not let go.']],
  // the Head of Household pulls a friend: somebody who will leave the block alone
  hohAlly: [['say', 'Good. That works for me.'], ['beat', '{d} keeps a straight face. Just about.'], ['say', 'Welcome to the veto, {n}.'], ['beat', '{d} and {n} share a very small nod.']],
  // anybody pulls somebody they would rather not have
  enemy: [['beat', '{d} looks at the chip a second too long.'], ['beat', '{d} smiles. It does not reach the eyes.'], ['say', 'Of course. Of course it is.'], ['beat', '{n} waves at {d}. {d} does not wave back.']],
  // nothing much either way: the drawn one gets up
  plain: [['say', "Let's go, then."], ['say', 'Me? Okay. Okay, I am in.'], ['beat', '{n} gets up and stretches, like the competition is in five minutes.'], ['say', 'I have not played in a while. I am ready.']],
};
function drawFace(d, name, hoh, key, used = new Set()) {
  const feel = Number(d.feel);
  if (!Number.isFinite(feel)) return null;
  const isHoh = d.drawer === hoh;
  const kind = feel >= 3 ? (isHoh ? 'hohAlly' : 'nomAlly') : feel <= -2 ? 'enemy' : 'plain';
  // never the same face twice in one draw
  const pool = DRAW_FACE[kind], at = hash(`${key}|${kind}`) % pool.length;
  const pick = [...pool.slice(at), ...pool.slice(0, at)].find(x => !used.has(x[1]));
  if (!pick) return null;
  used.add(pick[1]);
  const [k, t0] = pick;
  const t = t0.replace(/\{d\}/g, d.drawer).replace(/\{n\}/g, name);
  // the plain reaction is the drawn one's; the others are the drawer's
  const by = kind === 'plain' ? name : d.drawer;
  return k === 'say' ? { k: 'say', by, t } : { k: 'beat', t, focus: [d.drawer, name] };
}

function drawScreen(act, ctx) {
  const draws = act.draw || [];
  if (!draws.length) return null;
  const hoh = ctx.hoh;
  const block = act.blockAtDraw || ctx.nominees;
  const steps = [
    { k: 'bb', t: `${listOf([hoh, ...block])}, please come to the living room for the veto player pick.` },
    { k: 'say', by: hoh, t: `The nominees and I play in the veto. Each of us draws one chip. If you pull houseguest's choice, you pick anybody you want.`, vetoPlay: [hoh, ...block] },
  ];
  const dwhy = [], faces = new Set();
  for (const [i, d] of draws.entries()) {
    const key = `${ctx.week}|draw|${i}|${d.drawer}`;
    // the drawer's hand goes into the bag first: the chip comes out face down and turns over
    if (d.chip === 'choice') {
      const was = d.chipWas || 'choice';
      const face = was === 'own' ? d.drawer : was === 'playing' ? d.drew : 'choice';
      const t = was === 'own' ? `${d.drawer} draws. It's ${d.drawer}'s own chip, and the room loves it. That's houseguest's choice.`
        : was === 'playing' ? `${d.drawer} draws ${d.drew}, who is already playing. The pick comes back to ${d.drawer}: houseguest's choice.`
          : `${d.drawer} draws. The chip says HOUSEGUEST'S CHOICE.`;
      steps.push({ k: 'beat', t, chip: { drawer: d.drawer, chip: face }, ...(was === 'choice' ? { toast: ["HOUSEGUEST'S CHOICE", '#d99a10'] } : {}) });
      if (d.why) dwhy.push(String(d.why).trim());
      if (d.chose) {
        steps.push({ k: 'say', by: d.drawer, push: true, t: `Houseguest's choice. ${d.chose}, you're playing.`, vetoPlay: [d.chose], ...(dwhy.length ? { why: dwhy.slice() } : {}) });
        const face2 = Number(d.feel) >= 3 ? drawFace(d, d.chose, hoh, key, faces) : null;
        if (face2 && face2.k === 'beat') steps.push(face2);
      }
    } else if (d.drew) {
      steps.push({ k: 'beat', t: `${d.drawer} draws ${d.drew}.`, chip: { drawer: d.drawer, chip: d.drew }, vetoPlay: [d.drew] });
      const face2 = drawFace(d, d.drew, hoh, key, faces);
      if (face2) steps.push(face2);
    }
  }
  // a Veto Redraw or Replacement, between the draw and the competition (vp-bb-ep/steps-ports.js)
  steps.push(...drawTwistSteps(act.drawTwist, KIT));
  const players = new Set(steps.flatMap(s => s.vetoPlay || []));
  for (const s of steps) for (const n of s.vetoOut || []) players.delete(n);
  const others = ctx.house.filter(n => !players.has(n) && n !== hoh && !block.includes(n));
  // the draw ends on the field, not on the last chip (the user, 2026-10-06: "the draw ends abruptly")
  const field = [...players];
  steps.push({ k: 'say', by: hoh, t: pickBy([`That's our ${word(field.length)}. Good luck, everybody.`, `So that's the field. ${listOf(field)}. Good luck.`, `${titleCase(word(field.length))} players. May the best one win.`], `${ctx.week}|drawend`) });
  steps.push({ k: 'bb', t: `${listOf(field)}: the Power of Veto competition will begin shortly.` });
  steps.push({ k: 'beat', t: pickBy([`The six of them look at each other and start sizing each other up.`, `Somebody is already stretching. Somebody else is very obviously not.`, `Everybody who isn't playing gets very interested in the kitchen.`], `${ctx.week}|drawbeat`).replace('The six', `The ${word(field.length)}`) });
  return { id: 'bb-vdraw-v', kind: 'vdraw', anchor: 'veto', label: 'The Draw', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    title: 'Veto Player Pick', kicker: 'Cam 04 · Living room', sub: 'Chips for the veto', day: ctx.day, time: '10:15',
    // the field's board fills a slot per chip (stage.js), so it knows how many slots there are
    vfield: field.length,
    seated: seatLiving(block, [...players].filter(n => n !== hoh && !block.includes(n)).concat(others), hoh), steps };
}

// ── the veto meeting ───────────────────────────────────────────────────
function vetoMeetingScreen(act, ctx) {
  const holder = act.holder || ctx.vetoHolder;
  const before = ctx.nominees.slice();
  const hoh = act.chairAuthority || ctx.hoh;
  const holderOnBlock = before.includes(holder);
  const steps = [{ k: 'say', by: holder, t: 'This is the Power of Veto meeting.', veto: holder, medal: 'on' }];
  steps.push({ k: 'say', by: holder, t: `${hoh} has nominated ${holderOnBlock ? listOf(['me', ...before.filter(n => n !== holder)]) : listOf(before)} for eviction. I have the power to veto one of these nominations.` });
  if (act.diamond) steps.push({ k: 'say', by: holder, t: `This is the DIAMOND POWER OF VETO. If I use it, I name the replacement nominee myself, not the Head of Household.`, toast: ['DIAMOND VETO', '#22e1ff'] });
  steps.push({ k: 'say', by: holder, t: holderOnBlock
    ? `I'm one of the nominees, so I'll make this quick.`
    : `I'm going to give the nominees a chance to tell me why I should use the Power of Veto on them. ${before.find(n => n !== holder)}, please begin.` });
  const written = act.script?.pleas || {};
  if (!holderOnBlock) {
    for (const n of before) if (written[n]?.length) steps.push(...scriptSteps(written[n]));
    else steps.push({ k: 'say', by: n, push: true, t: pickBy([
      `You know where I stand with you. Use it on me and I won't forget it.`,
      `I'm not going to beg. I'd just like to stay, and I think you know I'd return the favour.`,
      `Whatever you decide, I'll respect it. I just hope it's me.`,
      `I've been straight with you since day one. That's all I've got.`,
    ], `${ctx.week}|plea|${n}`) });
  }
  // The holder's Diary Room, cut in before the answer, the way the show edits it.
  steps.push(...scriptSteps(act.script?.holderDr));
  steps.push({ k: 'say', by: holder, push: true, t: `I've decided...`, medal: 'glint' });
  const after = (act.nominees || before).slice();
  if (act.used && act.saved) {
    steps.push({ k: 'say', by: holder, push: true, t: act.saved === holder ? `...to use the Power of Veto on myself.` : `...to use the Power of Veto on ${act.saved}.`,
      toast: ['VETO USED', '#d99a10'], exit: null, why: vetoWhy({ ...act, replacementWhy: null }, holder, before, hoh),
      // the medallion swings, and the one it saves gets up out of the chair: it stays empty until the replacement
      medalHero: 'used', ...(act.replacement && act.saved !== holder ? { seat: { [act.saved]: 'stand2' } } : {}) });
    const down = (act.duoDown || []).filter(Boolean);
    const up = (act.duoUp || []).filter(Boolean);
    if (down.length) {
      const partner = down.find(n => n !== act.saved);
      steps.push({ k: 'beat', t: `${partner} comes down beside ${act.saved}. DOWN WITH THEM: the medallion was used on one name, but the rule takes the pair.`, toast: ['DOWN WITH THEM', '#12b76a'] });
    }
    if (up.length > 1) {
      steps.push({ k: 'say', by: hoh, t: `The veto took a whole duo off the block, so I have to name a REPLACEMENT DUO.` });
      steps.push({ k: 'say', by: hoh, push: true, t: `${up.join(' and ')}, I'm sorry. You're going up together.`, nom: after, toast: ['REPLACEMENT DUO', '#ff3355'] });
    } else if (act.replacement) {
      // The Diamond Power of Veto: whoever used it names the replacement, not the HOH.
      const namer = act.diamond ? holder : hoh;
      // the final four: one possible name, and everybody in the room knew it before the medallion moved
      const forced = !!act.forcedReplacement;
      if (!act.diamond) steps.push({ k: 'say', by: holder, t: `${hoh}, since I have just vetoed one of your nominations, you must now name a replacement nominee.` });
      steps.push({ k: 'say', by: namer, t: act.diamond
        ? `The diamond veto has been used, so the replacement is mine to name.`
        : forced ? `There's only one person in this house I'm allowed to name, and everybody here knows who it is.`
          : `I knew it might come to this. My replacement nominee is...` });
      steps.push({ k: 'say', by: namer, push: true,
        why: forced ? [`Nobody chose this: with ${word(houseNow(ctx).length)} left, ${act.replacement} is the only houseguest who can be nominated.`] : vetoWhy(act, holder, before, hoh),
        t: forced ? `${act.replacement}, you're the only one left who can sit there. I'm sorry.` : `${act.replacement}, I'm sorry. You're going up.`,
        nom: after, seat: { [act.replacement]: after.indexOf(act.replacement) ? 'N1' : 'N-1', [act.saved]: 'stand2' }, toast: [act.diamond ? 'DIAMOND VETO' : 'RENOMINATED', '#ff3355'] });
      steps.push(...scriptSteps(act.script?.renom));
    }
  } else {
    steps.push({ k: 'say', by: holder, push: true, t: `...not to use the Power of Veto, and to keep the nominations the same.`, toast: ['NOT USED', '#d99a10'], why: vetoWhy(act, holder, before, hoh), medalHero: 'not' });
  }
  // the room's reaction, at the meeting itself (the engine's moments: the replacement seated, a
  // nominee left up, a confrontation in front of everybody)
  // (the replacement already reacted in the renomination scene: the engine's own version would be a second, different reaction)
  steps.push(...momentSteps(act, act.script?.renom?.length ? new RegExp(VETO_MOMENT.source.replace('|veto-replacement-shock', '').replace('|power-replacement-fallout', '')) : VETO_MOMENT));
  steps.push({ k: 'say', by: holder, t: 'This veto meeting is adjourned.' });
  const others = ctx.house.filter(n => !before.includes(n) && n !== holder);
  return { id: 'bb-cer-v', kind: 'cer', anchor: 'cer', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    title: 'Veto Ceremony', kicker: 'Cam 04 · Living room', sub: act.diamond ? `${holder} holds the DIAMOND VETO` : `${holder} holds the Power of Veto`, day: ctx.day, time: ACT_TIME['veto-ceremony'],
    seated: seatLiving(before, others, holder), medalOn: holder, steps };
}

// ── eviction night ─────────────────────────────────────────────────────
const PLEA = {
  default: [`I'm not going to make promises I can't keep. Keep me, and you'll know exactly what you're getting.`,
    `I've loved living with every one of you. I'd love one more week.`,
    `I'm loyal to the people who are loyal to me. Vote with your heart tonight.`,
    `I know I haven't talked to all of you as much as I should have. Give me one more week and I will.`,
    `I'm not done in here. I've got a lot more game to play, and I'd like to play it with you.`,
    `Whatever you've heard about me this week, I'd rather you judged me on what you've actually seen.`,
    `I came in here to play the whole game. Please don't make tonight the end of it.`,
    `I'm not going to beg. I'll just say this: I've been straight with the people in this room, and I'll keep being straight with you.`,
    `This house has been the best and worst thing that's ever happened to me. I'd like a few more weeks of both.`,
    `If you keep me, I won't forget it. That's not a line. That's a promise.`],
  'target-warning': [`Before you vote, think about who benefits if I leave. It isn't you.`,
    `There's a plan being finished in this house tonight, and I'm not the end of it.`],
  'loyalty': [`I've kept every promise I made in here. I'm asking you to keep yours.`],
};
// ── why they voted the way they did, in the voter's own words ──
// The user, 2026-10-07: the classic eviction "had people saying meaningful things with personality";
// the stepped one read a formula. The ballot records why (the plea that moved it, a bloc, a promise
// kept or broken, an endgame partner on the block, a recruiter, the room's count), and the voter
// says it in the Diary Room.
function voteReason(b, c, noms, salt, used = new Set()) {
  const other = noms.find(n => n !== b.evict);
  // two voters never give the same reason in the same words (four said the same line on one night).
  // A bucket that has run dry says nothing more: the formula alone beats a line the room just heard
  // (2026-10-14: five voters protecting the same nominee repeated "is with me. That's all there is to it").
  const pick = list => { const fresh = list.filter(x => !used.has(x)); if (!fresh.length) return null; const t = pickBy(fresh, `${salt}|${b.voter}`); used.add(t); return t; };
  if (b.pleaMove && b.movedBy) return pick([
    `I walked in here ready to vote out ${b.movedBy}. Then ${b.movedBy} stood up and said that. I can't ignore it.`,
    `I'm changing my vote, and I didn't think I would. What ${b.movedBy} just said got to me.`,
  ]);
  if (b.stated && b.stated !== b.evict && (c?.promised || b.lied)) return pick([
    `I told people I'd vote out ${b.stated}. I'm not going to. Nobody in that room will ever know.`,
    `I said one name out there, and I'm writing another one in here. That's the game.`,
    `If ${b.stated} finds out I said one thing and did another, I'm in trouble. But ${b.evict} has to go.`,
  ]);
  if (c?.cuttingPartner === b.evict) return pick([
    `${b.evict} and I had a deal. I know. It still has to be ${b.evict}. I can't win with ${b.evict} next to me.`,
    `This one hurts. ${b.evict} trusted me. But I've got a better path to the end without ${b.evict}.`,
  ]);
  if (c?.endgameDeal?.with === other) return pick([
    `${other} is the person I'm taking to the end. I'm not losing that for anything ${b.evict} said this week.`,
    `This is easy. ${other} is in my final two. ${b.evict} isn't.`,
  ]);
  if (b.blocMove) return pick([
    `${b.blocMove} decided this one, and I'm with them. That's what an alliance is.`,
    `It's not completely my call. My people want ${b.evict} out, and I'm not breaking from them now.`,
    `${b.blocMove} needs every vote this week. Mine is one of them.`,
    `If I break from ${b.blocMove} now, I'm next. So, ${b.evict}.`,
    `We all agreed on ${b.evict}. I'm not going to be the one who breaks it.`,
    `My group said ${b.evict}. I'm sticking with my group.`,
  ]);
  if (c?.allied && other) return pick([
    `${other} is with me. That's all there is to it. Sorry, ${b.evict}.`,
    `I'm protecting ${other}. If that means ${b.evict} goes, ${b.evict} goes.`,
    `${other} would do the same for me. I know it.`,
    `I'm keeping ${other}. I'd do it again tomorrow.`,
    `${other} has looked after me in here. Tonight I look after ${other}.`,
    `It was never going to be ${other}. Not from me.`,
    `${other} and I are in this together. ${b.evict} knows that.`,
    `Sorry, ${b.evict}. My vote was always going to keep ${other} here.`,
  ]);
  if (c?.promised) return pick([
    `I gave my word this week, and I keep my word. It's the only thing I've got in here.`,
    `I promised this vote. Nobody can check what I write in here, and I'm keeping it anyway.`,
    `My word is worth something in this house. I'm not going to waste it tonight.`,
    `Somebody asked me for this vote, and I said yes. So it's ${b.evict}.`,
    `I made a promise this week, and tonight I'm keeping it.`,
  ]);
  if (b.recruitedBy) return pick([
    `${b.recruitedBy} came to me this week and asked. I said yes, and I meant it.`,
    `A week ago I didn't care about this vote. ${b.recruitedBy} changed that.`,
  ]);
  if (b.bandwagon) return pick([
    `Everybody's voting ${b.evict}. I'm not going to be the one vote on the wrong side.`,
    `I'm not sticking my neck out tonight. The house wants ${b.evict} gone, so do I.`,
    `The whole house is going one way tonight. I'm going with it.`,
    `I'm not going to be the odd vote out. It's ${b.evict}.`,
  ]);
  if (b.assignment?.by && b.assignment.target === b.evict) return pick([
    `We counted the votes this afternoon. ${b.evict} is the plan, and I'm sticking to it.`,
    `${b.assignment.by} asked for ${b.evict}. I said yes. Here it is.`,
    `The numbers were set days ago. I'm one of them.`,
    `I'm not going rogue tonight. ${b.evict} is the vote.`,
    `Everyone I trust is voting ${b.evict}. I'm not going to be the surprise.`,
  ]);
  // a vote with no story of its own: only a couple of these air (voteReason returns plain: true)
  if (used.plainCount === undefined) used.plainCount = 0;
  if (used.plainCount++ >= 2) return null;
  return pick([
    `${b.evict} is the bigger threat to my game. It's that simple.`,
    `${b.evict} has been coming after me for weeks. Not any more.`,
    `If ${b.evict} stays, ${b.evict} wins the next HOH. I'm not taking that risk.`,
    `Between the two of them, I'd rather face ${other || 'the other one'} next week.`,
    `I like ${b.evict}. I just like my chances better without ${b.evict} in the house.`,
  ]);
}

function evictionScreen(act, ctx, host) {
  const noms = (act.nominees || ctx.nominees).slice();
  const ballots = (act.ballots || []).filter(b => b && b.voter);
  const evicted = act.evicted;
  // Run the way the real live show runs it (the user, 2026-10-06: "it doesn't act like a real
  // live eviction"): the host greets the house, settles anything decided earlier tonight (the
  // Block Buster), hears the nominees, calls each voter to the Diary Room in turn, and reads
  // the result to a room holding its breath.
  const pickH = (lines, salt) => pickBy(lines, `${ctx.week}|${salt}`);
  // BB27's Sanctum: the vote is the Mastermind's, mid-week and in the Sanctum, not the host's live show.
  const inSanctum = !!act.publicVote && (act.sanctumOrder || []).length > 0;
  const vcM = voiceOf('summer-of-mystery', 'hostile').color;
  const H = t => (inSanctum ? { k: 'voice', own: true, by: 'The Mastermind', vc: vcM, t } : { k: 'host', by: host, t });
  const steps = inSanctum ? [
    { k: 'beat', t: 'The Sanctum, in the middle of the week. No live audience, no host: candles, the round table, and the dolls.', toast: ['THE SANCTUM', '#e8dcc0'] },
    H('Sit down. Tonight the vote is mine, and nobody will be voting in secret.'),
  ] : [
    { k: 'host', by: host, t: pickH([`Good evening, houseguests.`, `Hello, houseguests!`, `Good evening, everyone. Welcome to eviction night.`], 'hi') },
    { k: 'beat', t: pickH([`The whole house, in a ragged chorus: "Hi, ${host}!"`, `"Hi, ${host}!" Somebody waves at the camera. Somebody else pulls their arm down.`, `The house shouts hello. The nominees are a beat behind everyone else.`], 'hi2') },
  ];
  const bb = ctx.safety;
  if (bb && bb.winner) {
    const up = (bb.participants || []).filter(n => n !== bb.winner);
    steps.push({ k: 'host', by: host, t: `Earlier tonight, ${listOf(bb.participants || [])} battled in the Block Buster for their safety.` });
    steps.push({ k: 'host', by: host, t: `${bb.winner}, you won the Block Buster. You are safe this week, and off the block.`, safe: bb.winner, big: [bb.winner, 'Won the Block Buster', 'safe'] });
    steps.push({ k: 'beat', t: pickH([`${bb.winner} lets out a breath the whole room can hear.`, `${bb.winner} grins, then remembers who is still on the block, and stops.`, `A cheer goes up from one side of the room. The other side claps politely.`], 'bb-safe') });
    if (up.length >= 2) steps.push({ k: 'host', by: host, t: `That means ${listOf(up)}, you remain on the block, and one of you is going home tonight.` });
  }
  // One voter (the final four): the nominees speak to that one person, and the vote is cast live, out loud (the user,
  // 2026-10-16: "top4 speech obviously cater to the only person voting like in the top3").
  const sole = ballots.length === 1 && !(act.publicVote && (act.sanctumOrder || []).length) ? ballots[0].voter : null;
  steps.push(sole ? { k: 'host', by: host, t: `Tonight only one person votes. ${sole}, you will cast the sole vote to evict, live, in front of everyone. Nominees, this is your last chance to speak to ${sole}. ${noms[0]}, you're first.` }
    : H(`In a few moments one of you will be evicted. Nominees, this is your last chance to sway the votes. ${noms[0]}, you're first.`));
  const pleas = ctx.pleas || [];
  const said = new Set();
  for (const n of noms) {
    // The plea the vote operation resolved, as the classic screen and the
    // backlog print it (vp-screens _bbFinalPleaSpeech), when the caller has it.
    let full = null;
    try { full = ctx.plea ? ctx.plea(n) : null; } catch { full = null; }
    full = full && stripTags(full).replace(/^["“]|["”]$/g, '').trim();
    if (full) { steps.push({ k: 'say', by: n, push: true, t: full }); continue; }
    const p = pleas.find(x => x.speaker === n);
    const pool = [...(PLEA[p?.argumentType] || []), ...PLEA.default].filter(x => !said.has(x));
    const line = pickBy(pool, `${ctx.week}|${n}`);
    said.add(line);
    steps.push({ k: 'say', by: n, push: true, t: line });
  }
  // The Sanctum (bb-sanctum-week): no secret ballot. A doll on the table for everybody still playing, and a pin;
  // they vote one at a time, aloud, in an order they did not choose (the classic screen's whole content, here).
  const order = act.publicVote ? (act.sanctumOrder || []) : [];
  const sanct = order.length > 0;
  const seq = sanct ? order.map(v => ballots.find(b => b.voter === v.voter)).filter(Boolean) : ballots;
  const pins = {};
  if (ballots.length) {
    if (sole) {
      steps.push({ k: 'host', by: host, t: `Thank you both. ${sole}, it's time. Please stand, and cast your vote.`, tense: [sole, ...noms] });
    } else if (sanct) {
      steps.push(H('On the table in front of you is a doll for every houseguest still in this game, and a needle. You will evict by stabbing a doll.'));
      steps.push(H(`One at a time, in front of each other and in front of the nominees. ${seq[0].voter}, you're first.`));
    } else steps.push({ k: 'host', by: host, t: `Thank you both. It's time for the live vote. The nominees can't vote, and ${ctx.hoh}, as Head of Household, you only vote in the event of a tie. ${ballots[0].voter}, you're first. Please go to the Diary Room.` });
    const voteLines = act.script?.votes || {};
    const reasonsUsed = new Set();
    seq.forEach((b, i) => {
      // the voter's own words (bb/script/lines/evictvote.js), the formula last
      const said = (voteLines[b.voter] || []).map(l => l.text).join(' ') || `I vote to evict ${b.evict}.`;
      if (i === 0 && !sanct && !sole) steps.push({ k: 'dr', by: b.voter, t: `Hi, ${host}.` });
      // the chain behind the ballot, for the side panel (the house cannot see it):
      // what they wanted, who asked, what they told the house, what they cast
      const chain = [];
      if (b.preference) chain.push(`wanted ${b.preference}`);
      if (b.assignment) chain.push(b.assignment.kind === 'recruited' ? `asked by ${b.assignment.recruiter || b.assignment.by} for ${b.assignment.target}` : `${b.assignment.by} asked for ${b.assignment.target}`);
      if (b.stated) chain.push(`told the house ${b.stated}`);
      if (b.pleaMove) chain.push(`moved by ${b.movedBy}'s plea`);
      chain.push(`casts ${b.evict}`);
      const said1 = voiceLine({ kind: 'dr', by: b.voter, text: said }, 'vote').text;
      if (sanct) {
        pins[b.evict] = (pins[b.evict] || 0) + 1;
        const decided = order.find(v => v.voter === b.voter)?.afterDecided;
        steps.push({ k: 'beat', t: decided ? `The room already knows how this ends. ${b.voter} walks up anyway, with ${b.evict} watching, and stabs ${b.evict}'s doll.`
          : `${b.voter} takes the needle and stabs ${b.evict}'s doll. Nobody has to be told whose vote that was.`, ballot: [b.voter, b.evict, chain], tense: [b.voter, b.evict],
          board: { title: 'THE SANCTUM · NEEDLES', rows: noms.map(n => ({ n, text: `${pins[n] || 0} ${(pins[n] || 0) === 1 ? 'needle' : 'needles'}` })) } });
        // said to the room, in front of the nominee: short. The vote line was written for the Diary Room ("I'm doing
        // another thing in here"), so it stays there.
        steps.push({ k: 'say', by: b.voter, push: true, t: voiceLine({ kind: 'say', by: b.voter, text: pickH([`I vote to evict ${b.evict}.`, `Sorry, ${b.evict}. I vote to evict you.`,
          `I vote to evict ${b.evict}. It's nothing personal.`, `${b.evict}, I'm sorry. I vote to evict you.`, `I vote to evict ${b.evict}.`], `pin|${b.voter}`) }, 'vote').text });
        // (the Diary Room vote line is for a secret ballot: in the Sanctum the vote was said to the room)
      } else if (sole) {
        // stood up in the living room, in front of both of them
        steps.push({ k: 'beat', t: `${b.voter} stands. Nobody else in the room moves.` });
        steps.push({ k: 'say', by: b.voter, push: true, ballot: [b.voter, b.evict, chain], t: voiceLine({ kind: 'say', by: b.voter, text: pickH([
          `This is the hardest thing I've had to do in here. ${b.evict}, I'm sorry. I vote to evict you.`,
          `I've thought about nothing else all week. I vote to evict ${b.evict}.`,
          `${noms.find(n => n !== b.evict)}, ${b.evict}, I love you both. I'm voting for my game. I vote to evict ${b.evict}.`,
          `I have to take the person I think I can beat. I'm sorry, ${b.evict}. I vote to evict you.`], `sole|${b.voter}`) }, 'vote').text });
        steps.push({ k: 'dr', by: b.voter, t: said1 });
      } else steps.push({ k: 'dr', by: b.voter, t: said1, ballot: [b.voter, b.evict, chain] });
      const commit = (ctx.row?.voteCommitments || []).find(x => x.voter === b.voter);
      const why = voteReason(b, commit, noms, ctx.week, reasonsUsed);
      if (why) steps.push({ k: 'dr', by: b.voter, t: why });
      const next = seq[i + 1]?.voter;
      if (next) steps.push(sanct ? H(pickH([`${next}. The needle is yours.`, `${next}, you're next.`, `${next}. Choose.`], `next|${i}`)) : { k: 'host', by: host, t: pickH([`Thank you, ${b.voter}. ${next}, you're next.`, `Thank you. ${next}, please go to the Diary Room.`, `Thank you, ${b.voter}. ${next}?`, `${next}, you're up.`], `next|${i}`) });
    });
  }
  const tally = {};
  for (const b of ballots) tally[b.evict] = (tally[b.evict] || 0) + 1;
  // America's vote is a ballot in the count too (bb/week.js), read out earlier tonight
  const av = (ctx.row?.acts || []).find(x => x?.type === 'americas-eviction-vote' && (x.segment || 1) === (act.segment || 1));
  const avW = av?.target ? Math.max(1, Number(av.weight) || 1) : 0;
  if (avW) tally[av.target] = (tally[av.target] || 0) + avW;
  const a = tally[evicted] || 0, others = ballots.length + avW - a;
  if (!sole) steps.push(inSanctum ? H('Every needle is in. One of you is leaving my hotel tonight.')
    : { k: 'host', by: host, t: `Thank you, everyone. Houseguests, the votes are locked in. When I reveal the result, the evicted houseguest will have just a few moments to say their goodbyes, grab their belongings, and walk out the front door. Are you ready?` });
  if (!sole) steps.push({ k: 'beat', t: pickH([`${listOf(noms)} take each other's hands.`, `Nobody breathes. ${noms[0]} stares straight ahead.`, `A few people nod. ${noms[1] || noms[0]} closes both eyes.`, `The room is so quiet you can hear the cameras turning.`], 'ready'), tense: noms });
  if (act.tieBreak) {
    steps.push(inSanctum ? H(`A tie. ${ctx.hoh}, take the needle again.`) : { k: 'host', by: host, t: `We have a tie. ${ctx.hoh}, as Head of Household, you must cast the deciding vote, in front of everyone.` });
    if (inSanctum) steps.push({ k: 'beat', t: `${ctx.hoh} stabs ${evicted}'s doll a second time.` });
    steps.push({ k: 'say', by: ctx.hoh, push: true, t: `I vote to evict ${evicted}.` });
  }
  if (act.duoVote) {
    const dv = act.duoVote;
    steps.push({ k: 'host', by: host, t: `Tonight the votes are COUNTED BY DUO. The house did not vote for a houseguest tonight. It voted for a side.`, toast: ['COUNTED BY DUO', '#ff3355'] });
    for (const p of dv.perPair || []) steps.push({ k: 'beat', t: `${p.names.join(' and ')}: ${word(p.total)} ${p.total === 1 ? 'vote' : 'votes'} between them.` });
    if (dv.evicted && dv.survivor) steps.push({ k: 'beat', t: `${(dv.losing || []).join(' and ')} lose the count, and it is ${dv.evicted} who goes. ${dv.survivor} stays.` });
  }
  if (evicted) {
    if (ballots.length && !sole) steps.push({ ...H(others === 0 ? `By a unanimous vote...` : `By a vote of ${word(a)} to ${word(others)}...`), push: true, votes: [a, others], tense: noms,
      big: others === 0 ? ['By a', 'Unanimous vote'] : ['By a vote of', `${a} – ${others}`] });
    steps.push({ ...H(inSanctum ? `${evicted}, your stay at the Hotel Mystère is over.` : `${sole ? '' : '...'}${evicted}, you are evicted from the Big Brother house.`), ...(ctx.hexed ? {} : { out: evicted }), shake: true, big: [evicted, 'Evicted', 'out'] });
    if (ctx.hexed) {
      // A Halting Hex is about to cancel this: no goodbye, no door, no black-and-white portrait.
      steps.push({ k: 'beat', t: `${evicted} stands up to say goodbye.` });
    } else {
      const bye = scriptSteps(act.script?.goodbye);
      if (bye.length) steps.push({ k: 'beat', t: `${evicted} has a few seconds with the house.` }, ...bye, { k: 'beat', t: `${evicted} picks up a bag and walks to the front door.` });
      else steps.push({ k: 'beat', t: `${evicted} hugs the house goodbye, picks up a bag, and walks to the front door.` });
      // ── one last thing: the parting shot, the room, the answer, the fight ──
      const lw = act.lastWords;
      if (lw?.speech) {
        const acc = lw.reveal?.accused;
        const truth = lw.isTrue === true ? ['Only you know: every word of it is true.'] : lw.isTrue === false ? [`Only you know: none of it is true. ${acc} did not do it, and nobody in that room can know that.`] : [];
        const open = pickH([`${lw.speaker} gets as far as the door, and stops.`, `The bag is already on ${pronouns(lw.speaker).posAdj || 'their'} shoulder when ${lw.speaker} turns around.`, `The hugs are done. ${lw.speaker} does not go through the door.`], 'lw');
        steps.push({ k: 'beat', t: open, toast: [lw.register === 'explosion' ? 'THEY LOSE IT' : 'ONE LAST THING', '#ff3355'], tense: [lw.speaker, acc].filter(Boolean) });
        const sp = proseSteps(lw.speech, [lw.speaker, acc].filter(Boolean));
        if (sp.length) sp[sp.length - 1] = { ...sp[sp.length - 1], ...(truth.length ? { why: truth } : {}) };
        steps.push(...sp);
        // the room divides: the strongest believer, the torn, the one who waves it off
        const rs = [...(lw.reactions || [])].sort((x, y) => y.belief - x.belief);
        const pickR = [rs.find(r => r.belief > 0.55 && !r.conflicted), rs.find(r => r.conflicted), [...rs].reverse().find(r => r.belief < -0.25 && !r.conflicted)].filter(Boolean);
        for (const r of pickR) if (r.text) steps.push(...proseSteps(r.text, [r.listener, acc, lw.speaker].filter(Boolean)));
        if (lw.response?.text) {
          const ans = proseSteps(lw.response.text, [acc].filter(Boolean));
          if (ans.length) ans[0] = { ...ans[0], toast: [lw.response.kind === 'own' ? 'OWNS IT' : lw.response.kind === 'deflect' ? 'RISES ABOVE IT' : 'DENIES IT', '#e8c98a'] };
          steps.push(...ans);
        }
        const cf = lw.confrontation;
        if (cf) {
          const op = proseSteps(cf.opener, [cf.challenger, cf.accused]);
          if (op.length) op[0] = { ...op[0], toast: ['IT BOILS OVER', '#ff3355'], shake: true, tense: [cf.challenger, cf.accused] };
          steps.push(...op, ...proseSteps(cf.answer, [cf.accused, cf.challenger]), ...proseSteps(cf.close, [cf.challenger, cf.accused]));
        }
      }
      // the walk out is at the front door (the user's foyer): the doors open on the light and the noise
      if (inSanctum) {
        // mid-week, and nobody is waiting outside: no crowd, no host at the door
        steps.push({ k: 'beat', t: `The front door opens on a quiet night. ${evicted} walks out of it alone.`, door: true, cut: { plate: 'foyer', who: evicted, phase: 'open' } });
      } else {
        steps.push({ k: 'beat', t: pickH([`The front door opens. The roar of the crowd floods into the house.`, `The door opens on lights and noise and cheering. ${evicted} doesn't look back.`, `${evicted} takes one last look at the house. The door opens. The crowd erupts.`], 'door'), door: true, cut: { plate: 'foyer', who: evicted, phase: 'open' } });
        steps.push({ k: 'host', by: host, t: pickH([`${evicted}, come on out!`, `Come on out, ${evicted}!`], 'out'), cut: { plate: 'foyer', who: evicted, phase: 'out' } });
      }
      steps.push({ k: 'beat', t: `The front door closes. On the memory wall, ${evicted}'s portrait goes black and white.`, exit: evicted });
      // a final-two or final-three promise broken tonight, for the audience (the house cannot know)
      for (const d of ctx.row?.dealBreaks || []) {
        if (!d?.breaker || !d.victim) continue;
        steps.push({ k: 'dr', by: d.breaker, t: pickH([
          `I promised ${d.victim} ${d.tier === 'final-two' ? 'the final two' : 'a spot in the final three'}. Tonight I wrote ${d.victim}'s name. I'll have to answer for that in front of the jury.`,
          `${d.victim} trusted me with the end of this game. I chose a different end.`,
        ], `deal|${d.breaker}`), toast: [d.tier === 'final-two' ? 'BROKE A FINAL TWO' : 'BROKE A FINAL THREE', '#ff3355'] });
      }
    }
  }
  const rest = ctx.house.filter(n => !noms.includes(n));
  return { id: 'bb-evict-v', kind: 'evict', anchor: 'evict', set: 'ceremony', room: inSanctum ? 'The Sanctum' : ROOM_NAME.ceremony, cam: 1, sanctum: sanct, ...(inSanctum ? { nv: true } : {}),
    title: sanct ? 'The Sanctum' : 'Eviction Night', kicker: inSanctum ? 'The Sanctum · Mid-week' : 'Live · Eviction night', sub: `${listOf(noms)} on the block`, day: ctx.day, time: inSanctum ? 'MID-WEEK' : 'LIVE',
    // everybody who speaks on the night gets a seat before anybody who stays silent: the sofas hold
    // eight, and the people arguing after the parting shot were the ones left off (the user,
    // 2026-10-07: "it doesn't show their icons when they talk")
    seated: seatLiving(noms, [...new Set([ctx.hoh, ...steps.filter(st => st.k === 'say' && st.by && !noms.includes(st.by)).map(st => st.by), ...rest].filter(n => n && rest.concat(ctx.hoh).includes(n)))]), tvObj: true, steps };
}


// ── finale night ───────────────────────────────────────────────────────
// The engine writes its speech as prose ("\"Take the person you can beat,\"
// Emmah says."). A line that OPENS with a quotation is spoken: the quote is
// the line and the rest is dropped. Anything else airs as a caption.
function spoken(by, text, extra = {}) {
  const t = stripTags(text);
  // "First half," Wayne says, "second half." is ONE line, split round who said it.
  const split = by && t.match(new RegExp(`^["“]([^"”]+)["”]\\s*${by}\\s+\\w+,?\\s*["“]([^"”]+)["”]\\.?$`));
  if (split) return [{ k: 'say', by, t: `${split[1].trim()} ${split[2].trim()}`, ...extra }];
  const m = t.match(/^["“]([^"”]+)["”]/);
  if (!m || !by) return [{ k: 'beat', t, ...extra }];
  const out = [{ k: 'say', by, t: m[1].trim(), ...extra }];
  // What follows the quotation airs as a caption, unless it only says who said it
  // ("Emmah says."): a line the engine wrote is never cut short.
  const rest = t.slice(m[0].length).replace(/^[,.;:\s]+/, '').trim();
  const attribution = new RegExp(`^${by}\\s+\\w+(\\s+\\w+)?\\.?$`, 'i');
  if (rest && !attribution.test(rest)) out.push({ k: 'beat', t: rest });
  return out;
}

function finaleHouseScreens(act, ctx) {
  // the last days as conversations (vp-bb-ep/finale-house.js), aired as one House Life segment like any other week
  const scenes = finaleHouseScenes(act, { week: ctx.week, priorEvicted: ctx.priorEvicted || [] });
  if (scenes.length) {
    const sc = storyLifeScreen(scenes, { ...ctx, anchor: 'finale' }, 'finale');
    // the classic screen's id, so everything that finds the last days by id still does
    return [{ ...sc, id: 'bb-finale-house', title: 'House Life · The Last Days', sub: listOf(act.finalists || []) }];
  }
  const ROOM = { 'The Memory Wall': 'ceremony', 'Studying for Part Three': 'bedroom' };
  const groups = (act.acts || []).length ? act.acts : [{ title: 'The Last Days', beats: act.beats || [] }];
  const all = act.beats || [];
  return groups.map((g, gi) => {
    const beats = (g.beats || []).map(b => (typeof b === 'object' ? b : all.find(x => x.tag === b) || null)).filter(Boolean);
    const set = ROOM[g.title] || 'yard';
    const people = [...new Set(beats.flatMap(b => b.players || []))].slice(0, 4);
    const xs = spread(people.length);
    const steps = beats.flatMap(b => spoken((b.players || [])[0], b.text)).filter(x => x.t);
    if (!steps.length) steps.push({ k: 'beat', t: `The last days in the house. ${listOf(act.finalists || [])} are all that is left.` });
    return { id: `bb-finale-house-v${gi}`, kind: 'scene', anchor: 'finale', set, room: ROOM_NAME[set], cam: CAM[set],
      title: g.title, kicker: `Cam ${String(CAM[set]).padStart(2, '0')} · ${ROOM_NAME[set]}`, sub: listOf(act.finalists || []),
      day: ctx.day, time: '15:00', cast: people.map((n, i) => [n, xs[i]]), steps };
  });
}

function finaleBriefScreen(act, ctx, host) {
  const f = act.finalists || ctx.house;
  const steps = [{ k: 'host', by: host, t: `Good evening, final ${word(f.length)}. Tonight one of you becomes the winner of Big Brother. First, the final Head of Household competition, in ${word((act.parts || []).length || 3)} parts.` }];
  for (const p of act.parts || []) steps.push({ k: 'host', by: host, t: `Part ${word(p.n)}: ${p.blurb}` });
  return { id: 'bb-finale-brief-v', kind: 'brief', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'How Tonight Works', kicker: 'Live · Finale night', sub: `${listOf(f)}`, day: ctx.day, time: 'LIVE',
    // the final three in the three chairs (the user, 2026-10-16: "why dont u use the 3 chair version"), not two and one standing
    seated: seatLiving(f.slice(0, 3), f.slice(3)), tvObj: true, steps };
}

function finalPartScreen(act, ctx, n) {
  const comp = act.competition || {};
  const placements = comp.placements || [];
  const players = act.participants || comp.participants || placements;
  const host = ctx.host || 'Valeria';
  const detail = comp.detail || {};
  // Part Three, the jury quiz, is LIVE on the stage: the host reads each juror's statement, both
  // finalists reveal an answer, the right one is read out, and the score is on the board.
  if (n === 3 && (detail.questions || []).length) {
    const score = Object.fromEntries(players.map(p => [p, 0]));
    const board = () => ({ title: 'THE JURY QUIZ', rows: players.map(p => ({ n: p, text: String(score[p]) })) });
    const steps = [{ k: 'host', by: host, t: `Final Head of Household, Part Three. ${listOf(players)}, the jury has been asked about their own games. I'll read the start of each statement; you tell me how it ends.`, board: board() }];
    for (const q of detail.questions) {
      const stem = String(q.stem || '').replace(/^["“]|["”]$/g, '');
      steps.push({ k: 'host', by: host, t: `${q.juror} said: "${stem}"`, board: board() });
      steps.push({ k: 'host', by: host, t: (q.options || []).map((o, i) => `${'ABC'[i]}: ${o}`).join('. ') + '.', board: board() });
      steps.push({ k: 'beat', t: 'Both finalists lock in an answer. The paddles come up.', board: board() });
      for (const p of players) {
        const a = q.answers?.[p];
        if (!a) continue;
        steps.push({ k: 'say', by: p, t: `${'ABC'[a.answer] || '?'}. ${q.options?.[a.answer] || ''}.`, board: board() });
      }
      for (const p of players) if (q.answers?.[p]?.right) score[p]++;
      const right = players.filter(p => q.answers?.[p]?.right);
      steps.push({ k: 'host', by: host, t: `The answer is ${'ABC'[q.truthIndex]}, ${q.options?.[q.truthIndex]}.${right.length === players.length ? ' You both get the point.' : right.length ? ` A point for ${listOf(right)}.` : ' Nobody scores.'}`, board: board() });
    }
    const tie = (comp.beats || []).find(b => /tied|tie-?break/i.test(String(b.text || '')));
    if (tie) steps.push({ k: 'host', by: host, t: stripTags(tie.text), board: board() });
    steps.push({ k: 'host', by: host, t: `${comp.winner}, you are the final Head of Household!`, hoh: comp.winner, confetti: true, big: [comp.winner, 'Final Head of Household', 'safe'], board: board() });
    steps.push({ k: 'say', by: comp.winner, push: true, t: pickBy(['Oh my god. I did it.', 'Yes! YES!', 'I can\'t believe it. I really can\'t.'], `${ctx.week}|p3`) });
    return finaleScreen(`bb-final-hoh-${n}-v`, 'final-part', 'Final HOH · Part Three', 'Live: the jury quiz', ctx,
      steps.map((s, i) => (i === 0 ? { ...s, scene: onSet({ finalists: players, jury: ctx.jury || [], host }) } : s)), { legacy: new RegExp(`^bb-final-hoh-${n}$`), label: 'HOH Final Part' });
  }
  const fake = { competition: comp, results: placements.map(name => ({ name })), winner: comp.winner };
  const S = compScreen(fake, ctx, 'final');
  S.id = `bb-final-hoh-${n}`;
  S.legacy = new RegExp(`^bb-final-hoh-${n}$`); S.kind = 'final-part'; S.anchor = 'finale'; S.finale = true;
  S.title = `Final HOH · ${act.part || `Part ${n}`}`;
  S.label = S.title;
  S.steps[0] = { k: 'bb', t: `Final Head of Household competition, ${String(act.part || `Part ${n}`).replace(/ —.*/, '')}.` };
  // a two-person race has no "It comes down to A and B"
  if (players.length <= 2) S.steps = S.steps.filter(x => !/^It comes down to | is out of the running\.$/.test(String(x.t || '')));
  const win = S.steps.findIndex(s => s.toast);
  if (win >= 0) S.steps[win] = { k: 'beat', t: `${comp.winner} wins ${act.part || `Part ${n}`} and goes through to Part Three!`, big: [comp.winner, `Wins ${String(act.part || `Part ${n}`).replace(/ —.*/, '')}`, 'safe'], confetti: true };
  // a board that moves as the competition plays (the user, 2026-10-06: "the final HOH parts need
  // the same treatment"): who is still standing on the wall, or how far each one has got
  const playIdx = S.steps.map((s, i) => i).filter(i => i > 0 && (win < 0 || i < win));
  const total = Math.max(1, playIdx.length);
  const dsteps = detail.steps || [];
  const max = Math.max(1e-9, ...Object.values(comp.scores || {}).map(Number));
  playIdx.forEach((i, k) => {
    const f = (k + 1) / total;
    if (dsteps.length) {
      // endurance: the standing list at this point of the night
      const at = dsteps[Math.min(dsteps.length - 1, Math.round(f * (dsteps.length - 1)))];
      const fell = Object.fromEntries(dsteps.filter(x => x.kind === 'fall' && dsteps.indexOf(x) <= dsteps.indexOf(at)).map(x => [x.who, x.hazard || 'OUT']));
      S.steps[i] = { ...S.steps[i], board: { title: `STILL STANDING · ${at.hours ?? 0} HRS`, rows: players.map(p => ({ n: p, out: !!fell[p], text: fell[p] || 'HOLDING' })) } };
    } else {
      // anything else: how far each one has got, the winner reaching the end last
      S.steps[i] = { ...S.steps[i], board: { title: 'PROGRESS', rows: players.map(p => ({ n: p, v: Math.min(1, ((Number(comp.scores?.[p]) || 0) / max) * Math.min(1, f * 1.08)) })) } };
    }
  });
  if (win >= 0) S.steps[win] = { ...S.steps[win], board: { title: 'RESULT', rows: placements.map((p, r) => ({ n: p, v: r === 0 ? 1 : (Number(comp.scores?.[p]) || 0) / max, out: r > 0, text: r === 0 ? 'WINS' : `${r + 1}${r === 1 ? 'ND' : 'RD'}` })) } };
  return S;
}

// ── finale night, live ────────────────────────────────────────────────
// The user, 2026-10-06: "the final cut is really short; the jury questions should be on TV, both
// screens alternating, the house and the set; the votes a whole scene with keys like the real
// show; same for the reunion on set; no vote counter; the finale isn't grandiose, it's lame".
// The finale is one live show: the house and the studio set, cut between (scene markers), the host
// in person on the set, the jury's keys on a board, and the winner under confetti.
// The finale stage (tools/bb-house room_finale): the jury in their chairs on the risers, the
// finalists in the two chairs on the platform, the host on the mark. Every place is a measured
// anchor, so nobody floats or sinks into the floor (the user, 2026-10-06).
const JSEAT = ['J0', 'J5', 'J1', 'J6', 'J2', 'J7', 'J3', 'J8', 'J4', 'J9'];
const onSet = ({ jury = [], finalists = [], host = null } = {}, extra = {}) => {
  const seated = {};
  jury.filter(n => !finalists.includes(n)).slice(0, JSEAT.length).forEach((n, i) => { seated[n] = JSEAT[i]; });
  const F = finalists.length >= 3 ? ['F0', 'Dm', 'F1'] : ['F0', 'F1'];
  finalists.forEach((n, i) => { if (F[i]) seated[n] = F[i]; });
  if (host) seated[host] = 'H';
  return { set: 'finale', arena: true, room: 'The Finale Stage', cam: 7, kicker: 'Live · The finale stage', hostOn: !host, seated, cast: [], mood: 'ceremony', ...extra };
};
// the living room on finale night: its own plate with its seats (never a quiet corner of the house)
const inHouse = (cast, extra = {}) => ({ set: 'ceremony', arena: false, hostOn: false, room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · The living room',
  plate: 'living-screens', seated: seatLiving(cast.slice(0, 2), cast.slice(2)),
  cast: cast.map((p, i, a) => [p, spread(a.length)[i]]), mood: 'ceremony', tvObj: true, ...extra });
const finaleScreen = (id, kind, title, sub, ctx, steps, extra = {}) => ({ id, kind, anchor: 'finale', set: 'finale', arena: true, room: 'The Finale Stage', cam: 7,
  title, kicker: 'Live · Finale night', sub, day: ctx.day, time: 'LIVE', cast: [], finale: true, steps, ...extra });

function finalCutScreen(act, ctx) {
  const hoh = act.finalHoh;
  const host = ctx.host || 'Valeria';
  const pair = [act.kept, act.cut].filter(Boolean).sort();
  const pick = (l, s) => pickBy(l, `${ctx.week}|fc|${s}`);
  const steps = [];
  // in the living room, on its own plate (the user, 2026-10-16: "the final cut is suppose to be in the living room
  // but it uses library plate"): the two left in the chairs, the final Head of Household standing
  steps.push({ k: 'host', by: host, scene: inHouse([hoh, ...pair], { seated: seatLiving(pair, [], hoh) }), t: `${hoh}, congratulations. You are the final Head of Household, and you have the sole vote to evict.` });
  steps.push({ k: 'beat', t: pick([`${listOf(pair)} sit side by side in the two chairs. Neither of them looks at the other.`, `${pair[0]} reaches over and takes ${pair[1]}'s hand. ${hoh} cannot look at either of them.`,
    `The living room has never been this quiet with three people in it.`], 'room'), tense: pair });
  steps.push({ k: 'host', by: host, t: `${listOf(pair)}, before ${hoh} decides, this is your last chance to say why you belong in the final two.` });
  // each of them stands up and gives a speech (bb-finale.js finalPitches): how they open, the case, the line only
  // a person says, and how they sit down. The house watches the HOH through all of it.
  for (const p of act.pitches || []) {
    if (p.open) steps.push({ k: 'say', by: p.name, push: true, t: p.open });
    steps.push(...proseSteps(p.text, [p.name, ...pair, hoh]));
    if (p.aside) steps.push({ k: 'say', by: p.name, t: p.aside });
    if (p.close) steps.push({ k: 'say', by: p.name, t: p.close });
  }
  steps.push({ k: 'host', by: host, t: `${hoh}, it is time. Please rise, and cast the only vote that counts tonight.`, tense: pair });
  // the HOH explains, as the real final HOH does: the deal kept or broken, or who they can beat
  const reason = act.betrayal ? pick([`${act.betrayal.partner}, I made you a promise. I know I did. And I'm breaking it, because this is the only vote I get, and I have to use it to win.`,
    `This is the part of the game I hate. ${act.betrayal.partner}, we had a deal. I can't take you to the end, because I don't think I beat you.`], 'betray')
    : act.honoured ? pick([`I made a deal a long time ago, and I'm keeping it. That's who I've been in this house, and that's who I'm going to be tonight.`,
      `I gave my word in this house, and I'm not going to break it on the last night.`], 'honour')
      : pick([`I've thought about this for days. In the end, it comes down to one question: who can I beat in front of that jury?`,
        `You've both played this game hard, and you both deserve to be here. But I can only take one of you.`,
        `This decision isn't about who I like more. It's about who I can beat.`], 'beat');
  steps.push({ k: 'say', by: hoh, push: true, t: act.reason || reason });
  steps.push({ k: 'say', by: hoh, t: `I vote to evict ${act.cut}.`, shake: true, big: [act.cut, 'Evicted', 'out'] });
  steps.push({ k: 'beat', t: pick([`${act.kept} lets out a scream and throws ${pronouns(act.kept).ref || 'themself'} at ${hoh}.`, `${act.kept} covers ${pronouns(act.kept).posAdj || 'their'} face. ${hoh} pulls ${pronouns(act.kept).obj || 'them'} into a hug.`, `${act.kept} drops to the floor, then gets straight back up and hugs ${hoh}.`], 'kept'), tense: [act.kept, hoh] });
  // the one who goes: a few seconds, and a last line
  steps.push({ k: 'say', by: act.cut, push: true, t: act.betrayal ? pick([`I'm not going to pretend that doesn't hurt. Good luck. I mean it, mostly.`, `I'll see you both on finale night. Bring your best answers.`], 'cutb')
    : pick([`Final three in Big Brother. Nobody can take that away from me.`, `I'm proud of every single day. Go win this, one of you.`, `I'll see you on the other side. I'll be the one with the vote.`], 'cut') });
  steps.push({ k: 'host', by: host, t: `${act.cut}, you are the final member of the jury. Please say your goodbyes, and head out through the front door.` });
  steps.push({ k: 'beat', t: `${act.cut} hugs them both, picks up a bag, and walks to the front door. ${pronouns(act.cut).Sub || 'They'} will vote for the winner tonight.`, door: true, out: act.cut, cut: { plate: 'foyer', who: act.cut, phase: 'open' } });
  // back in the living room the cut chair is empty (the user, 2026-10-16: "manu is supposed to be gone"): the final
  // Head of Household sits down in it, next to the one they kept
  steps.push({ k: 'host', by: host, t: `${hoh} and ${act.kept}: you are the final two of Big Brother!`, big: [`${hoh} & ${act.kept}`, 'The Final Two', 'safe'], confetti: true,
    exit: act.cut, seat: { [hoh]: pair.indexOf(act.cut) === 0 ? 'N-1' : 'N1' } });
  // the final two, alone in the house for the first time
  steps.push({ k: 'say', by: act.kept, push: true, t: pick([`We actually did it. Final two.`, `Final two. Say it again. I need to hear it again.`, `I need to sit down. I need to sit down right now.`], 'f2a') });
  steps.push({ k: 'say', by: hoh, t: pick([`Whatever happens tonight, we did this.`, `It's just us. I can't believe it's just us.`, `Now we find out what they really thought of us.`], 'f2b') });
  return { id: 'bb-final-cut-v', kind: 'final-cut', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1, finale: true, plate: 'living-screens',
    title: 'The Final Cut', kicker: 'Live · Finale night', sub: `${hoh} decides`, day: ctx.day, time: 'LIVE', tvObj: true,
    seated: seatLiving(pair, [], hoh), steps };
}

function juryRoomSeats(finalTwo, jury) { return seatLiving(finalTwo, jury); }

// The final two never leave the house before the winner is named (the user, 2026-10-16: "the jury asks and closing
// statement the finalist are still in the house, they only get out after the winner announcement with confetti and
// everything"). The jury comes INTO the house for the questions and the statements: the final two in the two chairs
// of the living room, the jurors on the sofas around them, the host on the big screen.
const JURY_IN = ['I have watched this room on a screen for weeks. It is smaller than I remember.', 'Okay. Okay. I made it back in here.',
  'My legs are shaking. Please do not look at my legs.', 'Hi, everyone. I have missed some of you. Most of you.', 'I have been waiting {d} days to see all of your faces at once.'];
const juryInHouse = (f2, jury, extra = {}) => inHouse([...f2, ...jury], { seated: seatLiving(f2, jury.slice(0, 8), jury[8] || null), ...extra });
const finalTwoAlone = f2 => inHouse(f2, { seated: seatLiving(f2, []) });
function juryQuestionsScreen(act, ctx) {
  const host = ctx.host || 'Valeria';
  const jury = act.jury || ctx.jury || [];
  const f2 = act.finalTwo || ctx.finalTwo || [];
  const pick = (l, s) => pickBy(l, `${ctx.week}|jq|${s}`);
  const steps = [];
  steps.push({ k: 'host', by: host, scene: finalTwoAlone(f2), t: `${listOf(f2)}, welcome to the last night of Big Brother. Tonight you have visitors. Your jury is coming into the house.` });
  f2.forEach((n, i) => steps.push({ k: 'say', by: n, push: i === 0, t: pick([`Oh no. They're all coming in here?`, `Okay. Deep breath. They're just people we lived with.`, `I'm going to be sick. In a good way.`], `nerves|${n}|${i}`) }));
  steps.push({ k: 'beat', t: `The front door opens. One by one, ${word(jury.length)} evicted houseguests walk back into the house they were voted out of, and sit down on the sofas.`,
    door: true, scene: juryInHouse(f2, jury) });
  steps.push({ k: 'beat', t: pick([`Some of the jury smile at the final two. Some of them very deliberately do not.`, `${jury[0] || 'One juror'} waves. ${jury[1] || 'Another'} folds both arms.`, `Nobody on the sofas says hello first.`], 'clap'), tense: f2 });
  const greeter = jury[0];
  if (greeter) steps.push({ k: 'say', by: greeter, t: pick(JURY_IN, `first|${greeter}`).replace('{d}', String(ctx.day || 'all these')) });
  steps.push({ k: 'host', by: host, t: `Jurors, you have questions for the final two, and they have to answer them, here, in front of all of you.` });
  for (const ex of act.exchanges || []) {
    steps.push(...spoken(ex.juror, ex.question, { push: true, stance: [ex.juror, ex.stanceBefore || 'undecided', ex.asked] }));
    for (const a of ex.answers || []) {
      if (a.text) steps.push(...spoken(a.finalist, a.text, { push: a.finalist === ex.asked }));
      if (a.reaction) steps.push(...proseSteps(a.reaction, [ex.juror]));
    }
  }
  if ((act.exchanges || []).length === 0) steps.push({ k: 'beat', t: 'The jury has no questions tonight. That is its own kind of answer.' });
  return { ...finaleScreen('bb-ftc-questions-v', 'jury-q', 'The Jury Asks', listOf(f2), ctx, steps), ...juryInHouse(f2, jury), kicker: 'Live · The living room' };
}

function closingScreen(act, ctx) {
  const host = ctx.host || 'Valeria';
  const f2 = act.finalTwo || [];
  const jury = ctx.jury || [];
  const steps = [{ k: 'host', by: host, scene: juryInHouse(f2, jury), t: `Finalists, this is your last chance to speak to the jury before they vote. ${f2[0]}, you're first.` }];
  for (const st of act.statements || []) {
    if (st.intro) steps.push({ k: 'beat', t: stripTags(st.intro) });
    steps.push(...spoken(st.finalist, st.text, { push: true }));
    if (st.coda) steps.push(...spoken(st.finalist, st.coda));
  }
  // the jury goes out to vote; the final two stay in the house until the winner is named
  steps.push({ k: 'host', by: host, t: `Thank you both. Jurors, please leave the house and join me in the studio. It's time to vote.` });
  steps.push({ k: 'beat', t: `The jury files out through the front door. ${listOf(f2)} are alone in the living room again, for the last time.`, scene: finalTwoAlone(f2) });
  steps.push({ k: 'say', by: f2[0], t: pickBy([`Did I just ruin everything?`, `I said everything I wanted to say. I think.`, `My hands still haven't stopped shaking.`], `${ctx.week}|cl1`) });
  steps.push({ k: 'say', by: f2[1], t: pickBy([`You were great. I was fine. We're both fine.`, `Whatever happens, they heard us.`, `Now we just sit here. And wait.`], `${ctx.week}|cl2`) });
  return { ...finaleScreen('bb-ftc-speeches-v', 'closing', 'Closing Statements', listOf(f2), ctx, steps), ...juryInHouse(f2, jury), kicker: 'Live · The living room' };
}

// the jury's keys go in, one juror at a time (the finalists are inside the house)
function juryKeysScreen(act, ctx, host, row) {
  const jury = act.jury || [];
  const f2 = row.finalTwo || ctx.finalTwo || Object.keys(act.votes || {});
  const pick = (l, s) => pickBy(l, `${ctx.week}|jv|${s}`);
  const home = Object.fromEntries(jury.slice(0, JSEAT.length).map((n, i) => [n, JSEAT[i]]));
  const steps = [];
  steps.push({ k: 'host', by: host, scene: onSet({ jury, host }), t: `Jurors, it's time to vote for the winner of Big Brother. One at a time, walk up to the box, take the key with the name of the finalist you want to win, and turn it.` });
  steps.push({ k: 'host', by: host, t: `Remember: tonight you are voting for the houseguest you want to WIN. Nobody, not even me, will see your key until it comes out of that box.` });
  // each juror walks from the bench to the box, says a line that names nobody, and turns the key
  // (the user, 2026-10-16: "where are the animation of them walking up to turn their key")
  let prev = null;
  const SAYS = ['This one is for the best game I saw.', 'I thought about this for a long time. This is my vote.', 'No hard feelings, whichever way this goes.',
    'I voted with my head tonight, not my heart.', 'Congratulations to you both. This is for the one who earned it.', 'This one is for the person who actually played.',
    'I hope you both understand.', 'I know exactly what I am doing with this key.', 'I made up my mind a while ago. Tonight just confirmed it.',
    'This was harder than I thought it would be.', 'Good luck to both of you. I mean that.', 'I went back and forth all week. This is where I landed.'];
  const off = [...String(ctx.week)].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const sayOf = new Map((act.reasoning || []).map((r, i) => [r.juror, SAYS[(off + i * 5) % SAYS.length]]));
  for (const r of act.reasoning || []) {
    steps.push({ k: 'beat', t: pick([`${r.juror} gets up from the jury bench and walks to the box.`, `${r.juror} stands, crosses the stage, and stops in front of the box.`, `${r.juror} walks up to the box and looks at the two keys for a long moment.`], r.juror),
      tense: [r.juror], seat: { ...(prev && home[prev] ? { [prev]: home[prev] } : {}), [r.juror]: 'box' } });
    steps.push({ k: 'say', by: r.juror, keyIn: r.juror, juryVote: [r.juror, r.votedFor], t: sayOf.get(r.juror) });
    steps.push({ k: 'beat', t: pick([`${r.juror} turns the key. It drops into the box.`, 'The key turns with a click, and drops.', `${r.juror} turns the key, and walks back to the bench without looking at anybody.`], `drop|${r.juror}`), drop: r.juror });
    prev = r.juror;
  }
  steps.push({ k: 'host', by: host, t: `The votes are locked in.`, toast: ['THE VOTES ARE IN', '#e8c98a'], seat: prev && home[prev] ? { [prev]: home[prev] } : {} });
  return finaleScreen('bb-jury-v', 'jury-vote', 'The Jury Votes', `${word(jury.length)} keys in the box`, ctx, steps, { keysFor: f2, keysNeed: Math.floor(jury.length / 2) + 1 });
}

// the finalists come out, the keys come out of the box, and the whole cast floods the stage
function winnerScreen(act, ctx, host, row) {
  const jury = act.jury || [];
  const f2 = row.finalTwo || ctx.finalTwo || Object.keys(act.votes || {});
  const winner = act.winner || row.winner;
  const runner = f2.find(n => n !== winner);
  const need = Math.floor(jury.length / 2) + 1;
  const pick = (l, s) => pickBy(l, `${ctx.week}|jv|${s}`);
  const steps = [];
  // in the house, in the two chairs: the keys are read to them on the big screen, and they only walk out of the
  // front door once one of them has won (the user, 2026-10-16)
  steps.push({ k: 'host', by: host, scene: finalTwoAlone(f2), t: `${listOf(f2)}, the jury has voted. Their keys are in the box, here with me in the studio.` });
  steps.push({ k: 'say', by: f2[0], t: pick([`Whatever happens, I love you.`, `This is it. This is actually it.`, `Hold my hand. Don't let go of my hand.`], 'door1') });
  steps.push({ k: 'say', by: f2[1], t: pick([`Whatever happens, we did this together.`, `Okay. Let's find out.`, `I can't feel my face.`], 'door2') });
  steps.push({ k: 'host', by: host, t: `I'll reveal the keys one at a time, and the first finalist to ${word(need)} votes wins Big Brother.` });
  // the keys come out of the box in an order that keeps it close as long as it can be: the
  // trailing finalist's keys alternate with the leader's, so the result is the same and the
  // count is level for as long as the votes allow
  const forW = (act.reasoning || []).filter(r => r.votedFor === winner);
  const forL = (act.reasoning || []).filter(r => r.votedFor !== winner);
  const order = [];
  while (forW.length || forL.length) {
    if (forL.length) order.push(forL.shift());
    if (forW.length) order.push(forW.shift());
  }
  const tally = {};
  let crowned = false;
  const names = n => `${word(n)} vote${n === 1 ? '' : 's'}`;
  order.forEach((r, i) => {
    if (crowned) return;
    const clinch = !act.tiebreak && r.votedFor === winner && (tally[winner] || 0) + 1 >= need;
    steps.push({ k: 'host', by: host, tense: f2, suspense: true, t: i === 0 ? pick(['The first key...', 'Here is the first key.'], 'first')
      : clinch ? pick(['The next key...', 'And the next key...'], `pre|${r.juror}`) : pick(['The next key...', 'Next key...', 'This key...', 'And the next one...'], `pre|${r.juror}`) });
    tally[r.votedFor] = (tally[r.votedFor] || 0) + 1;
    steps.push({ k: 'host', by: host, push: true, t: `${r.votedFor}.`, key: [r.juror, r.votedFor] });
    if (clinch) {
      crowned = true;
      steps.push({ k: 'host', by: host, t: `That's ${word(need)} votes. ${winner}... you are the winner of Big Brother!`, winner, confetti: true, shake: true, big: [winner, 'Wins Big Brother', 'safe'],
        why: ['How the jury voted:', ...(act.reasoning || []).map(x => `${x.juror} → ${x.votedFor}: ${stripTags(x.reason || '').replace(/^["“]|["”]$/g, '')}`)] });
      return;
    }
    const a = tally[f2[0]] || 0, b = tally[f2[1]] || 0;
    const lead = a > b ? f2[0] : b > a ? f2[1] : null;
    if (a === b && a === need - 1) steps.push({ k: 'host', by: host, tense: f2, t: `${names(a)} each. The next key decides the winner of Big Brother.` });
    else if (a === b) steps.push({ k: 'host', by: host, t: `That's ${names(a)} each.` });
    else if (lead && tally[lead] === need - 1) {
      const other = f2.find(n => n !== lead);
      steps.push({ k: 'host', by: host, tense: f2, t: `${lead} has ${names(tally[lead])}. One more key, and ${lead} wins Big Brother.` });
      steps.push({ k: 'beat', t: pick([`${other} stares at the box and doesn't blink.`, `${lead} reaches over and squeezes ${other}'s hand.`, `${other} lets out a long breath. ${lead} can't look at anyone.`], `mp|${i}`) });
    }
  });
  if (act.tiebreak) steps.push({ k: 'host', by: host, t: stripTags(act.tiebreak.line), winner, confetti: true, big: [winner, 'Wins Big Brother', 'safe'] });
  steps.push({ k: 'say', by: winner, push: true, t: pick([`I can't believe it. I really can't believe it.`, `Oh my god. OH MY GOD.`, `I did it. I actually did it.`], 'win') });
  if (runner) steps.push({ k: 'beat', t: pick([`${runner} pulls ${winner} into a hug before either of them can stand up properly.`, `${runner} is the first to hug ${winner}, and doesn't let go.`], 'hug') });
  steps.push({ k: 'host', by: host, t: `${listOf([winner, runner].filter(Boolean))}, for the last time: please come out of the Big Brother house!` });
  steps.push({ k: 'beat', t: `The front door opens on the studio, and the crowd is on its feet. ${listOf([winner, runner].filter(Boolean))} walk out of the Big Brother house together.`, door: true });
  // everybody who ever lived in the house, on the stage at once (the user, 2026-10-16: "we dont see everyone at
  // the announcement of the winner")
  const everyone = [...new Set([winner, runner, ...jury, ...(ctx.priorEvicted || [])].filter(Boolean))];
  if (runner) steps.push({ k: 'beat', t: `They come down onto the stage, and the jury rushes them. Everybody who ever lived in that house comes with them.`,
    scene: crowdScene(everyone, { room: 'The Finale Stage' }), confetti: true });
  steps.push({ k: 'host', by: host, push: false, t: `${winner}, how does it feel?` });
  steps.push({ k: 'say', by: winner, push: true, t: pick([`I don't think it's real yet. Ask me in a week.`, `I came in here wanting this more than anything, and I still didn't know it would feel like this.`,
    `Every one of these people made me play better. Even the ones who wanted me gone. Especially them.`], 'feel') });
  if (runner) {
    steps.push({ k: 'host', by: host, t: `${runner}, you came so close. What do you want to say to ${winner}?` });
    steps.push({ k: 'say', by: runner, t: pick([`You earned it. I mean that. I'm proud I lost to you.`, `Congratulations. I'm going to need a minute, and then I'm going to be really happy for you.`,
      `Second place in Big Brother. I'll take it. You played better tonight, and that's the game.`], 'runner') });
  }
  return finaleScreen('bb-winner-v', 'jury-vote', 'The Winner', `${word(jury.length)} keys, ${word(need)} to win`, ctx, steps, { keysFor: f2, keysNeed: need });
}

// everybody on the stage at once: not seated (the stage has two chairs and the bench nine), standing together
function crowdScene(cast, extra = {}) {
  return { set: 'finale', arena: true, room: 'The Finale Stage', cam: 7, kicker: 'Live · The finale stage', hostOn: false, seated: null,
    cast: cast.map((n, i) => [n, Math.round(6 + (88 * i) / Math.max(1, cast.length - 1))]), mood: 'ceremony', ...extra };
}

// America's Favourite: the whole cast on the stage, the winner comes forward, and gets to say something
// (the user, 2026-10-16: "america favourite we dont even see the winner and they dont have a dialogue")
const AFP_SAYS = {
  finalist: [`I didn't know America was watching me like that. Thank you. Thank you so much.`, `Tonight was the jury's vote. This one is yours, and I think I love this one more.`],
  juror: [`I went home angry, and you were still voting for me? I'm going to cry on live TV.`, `I didn't win the game, but I won this, and this one is from the people at home.`],
  prejury: [`I was barely in the house! You remembered me? I love you. I love all of you.`, `I left so early. I thought nobody would even remember my name.`],
};
function favouriteScreen(act, ctx, host) {
  const f2 = ctx.finalTwo || [];
  const jury = ctx.jury || [];
  const pick = (l, s) => pickBy(l, `${ctx.week}|afp|${s}`);
  const everyone = [...new Set([...f2, ...jury, ...(ctx.priorEvicted || []), act.winner].filter(Boolean))];
  const role = f2.includes(act.winner) ? 'finalist' : jury.includes(act.winner) ? 'juror' : 'prejury';
  const steps = [{ k: 'host', by: host, scene: crowdScene(everyone), t: `All season, America has been voting for its favourite houseguest. The winner of ${act.prize ? `$${act.prize.toLocaleString('en-US')}` : 'the prize'} is...`, tense: everyone.slice(0, 6) },
    { k: 'host', by: host, push: true, t: `...${act.winner}!`, big: [act.winner, "America's Favourite", 'safe'], confetti: true },
    { k: 'beat', t: `${act.winner} comes forward to the front of the stage, to the loudest cheer of the night.` },
    { k: 'host', by: host, t: `${act.winner}, come here. America loved you. How does that feel?` },
    { k: 'say', by: act.winner, push: true, t: pick(AFP_SAYS[role], 'say') }];
  if (act.reason) steps.push({ k: 'beat', t: `${act.winner} won it for ${stripTags(act.reason)}.` });
  steps.push({ k: 'host', by: host, t: `Congratulations, ${act.winner}. And that's our season of Big Brother. Thank you all, and good night!` });
  return finaleScreen('bb-afh-v', 'afp', "America's Favourite", act.winner, ctx, steps);
}

// ── A Summer of Mystery: who the Mastermind was (bb/mastermind-reveal.js) ──
// BB27's finale unmasked a past winner, then showed he had been framed: there were three Masterminds,
// each out for revenge on the twist that cost them their own season.
function unmaskScreen(ctx, host) {
  let rev = null;
  try { rev = mastermindReveal((ROSTER || []).map(p => p.name)); } catch { rev = null; }
  if (!rev) return null;
  const vc = voiceOf('summer-of-mystery', 'hostile').color;
  const m = rev.masterminds;
  const steps = [
    { k: 'host', by: host, t: 'All summer, one question has hung over the Hotel Mystère. Tonight, we finally answer it. Who is the Mastermind?', toast: ['THE MASTERMIND', '#4fbf8b'] },
    { k: 'beat', t: 'The lights drop. A masked figure walks onto the stage, and the crowd goes silent.' },
    { k: 'beat', t: `The mask comes off. It is ${rev.framed.name}, who won ${rev.framed.where}.`, shake: true, toast: ['UNMASKED', '#ff3355'] },
    { k: 'say', by: rev.framed.name, t: 'Me? I just got here. Somebody handed me this mask in the hallway ten minutes ago.' },
    { k: 'beat', t: 'Then the screen behind the stage lights up, and the voice everybody knows comes out of it.' },
    { k: 'voice', own: true, by: 'The Mastermind', vc, t: `${rev.framed.name} was a decoy. A winner makes a very convincing suspect.` },
    { k: 'voice', own: true, by: 'The Mastermind', vc, t: `There was never one of us.` },
  ];
  m.forEach((x, i) => steps.push({ k: 'beat', t: `${i === 0 ? 'A second' : i === 1 ? 'A third' : 'A fourth'} mask comes off: ${x.name}, ${x.placement === 2 ? 'runner-up' : 'a finalist'} on ${x.where}.`, toast: [x.name.toUpperCase(), '#ff3355'] }));
  steps.push({ k: 'say', by: m[0].name, t: m.length > 1 ? 'We all came this close to winning, and a twist took it away. So this summer, we wrote the twists.'
    : 'I came this close to winning, and a twist took it away. So this summer, I wrote the twists.' });
  steps.push({ k: 'host', by: host, t: `${listOf(m.map(x => x.name))}. The Masterminds of the Hotel Mystère. And now, it is time for the jury to decide who wins.` });
  return finaleScreen('bb-unmask-v', 'reunion', 'The Masterminds', 'Who was behind the mask', ctx, steps);
}

// The reunion: everybody except the final two (they are inside the house), before the jury votes (the user,
// 2026-10-16: "the reunion is suppose to happen before the jury votes between everyone except the top2"). The host
// asks; the engine's segments (bb/finale-night.js runReunion) answer. A finalist's part in a reveal is the tape.
const REUNION_ASK = ['{n}, welcome back. How are you feeling about it all now?', "{n}, you've had a few weeks to watch it back. What did you think?",
  '{n}! Any hard feelings?', '{n}, what was it like watching from home?', '{n}, be honest with me. How was it?'];
function reunionScreen(act, ctx) {
  const host = ctx.host || 'Valeria';
  const f2 = act.finalTwo || [];
  const all = [...new Set([...(act.jury || []), ...(act.prejury || [])])].filter(n => !f2.includes(n));
  const segs = act.segments || [];
  if (!segs.length || !all.length) return null;
  const pick = (l, s) => pickBy(l, `${ctx.week}|re|${s}`);
  const steps = [{ k: 'host', by: host, scene: crowdScene(all), t: `While our final two wait inside the house, please welcome back every houseguest from this season of Big Brother!`, confetti: true }];
  steps.push({ k: 'beat', t: 'They come out two at a time. The crowd cheers for some of them a lot louder than others.' });
  let taped = false;
  for (const sg of segs) {
    const who = [sg.speaker, ...(sg.players || [])].filter(Boolean);
    if (sg.kind === 'walkon' && sg.speaker) steps.push({ k: 'host', by: host, t: pick(REUNION_ASK, `ask|${sg.speaker}`).replace('{n}', sg.speaker) });
    if (sg.kind === 'reveal' && !taped) {
      taped = true;
      steps.push({ k: 'host', by: host, t: `There are things that happened in that house that some of you never got to see. Let's look at the big screen.`, toast: ['THE TAPE', '#ff3355'] });
    }
    // the finalist is not on the stage: what they said is the Diary Room tape
    if (f2.includes(sg.speaker)) {
      const lines = proseSteps(sg.text, who);
      steps.push(...lines.map(l => (l.k === 'say' && f2.includes(l.by) ? { ...l, k: 'dr' } : l)));
      continue;
    }
    steps.push(...proseSteps(sg.text, who.length ? who : all));
  }
  steps.push({ k: 'host', by: host, t: `Jurors, in a few moments you will cast the votes that decide who wins Big Brother. Think about everything you've heard tonight.` });
  return finaleScreen('bb-reunion-v', 'reunion', 'The Reunion', 'Everybody but the final two, one more time, on the stage', ctx, steps);
}

// ── the Safety Suite (Phase 7, mockup/mockup-bb-twist-safety-suite.html) ──
// Four screens: Big Brother reads the rules over the living room while the
// pass rail lights; the hallway, where each swipe spends a pass for good; the
// suite, where every run rises against the clock; and the Plus One, whose
// price card turns over. The people's words are act.script.suite
// (bb/script/ceremony.js); Big Brother's are the format's own.
const SUITE_RULES = [
  "Each of you has one pass. It has to last the whole season. Once you swipe it, it's gone.",
  'Everyone who swipes will play inside the suite against the clock.',
  'Beat the clock, and you cannot be nominated this week. If more than one of you beats it, the fastest is safe.',
  'The winner must also make one other houseguest safe. That person will pay a price for it.',
];
const SUITE_RULE_ROWS = [['ONE PASS', 'per houseguest, for the whole season'], ['SWIPE', 'and play inside against the clock'],
  ['BEAT THE CLOCK', 'safe this week — fastest wins'], ['PLUS ONE', 'the winner saves one more, who pays a price']];
const PRICE = { slop: 'A WEEK ON SLOP', costume: 'THE COSTUME', solitary: 'A NIGHT IN SOLITARY', chore: 'EVERY CHORE, ALONE' };
function suiteScreens(act, ctx) {
  const sc = act.script?.suite || {};
  const hoh = act.hoh || ctx.hoh || null;
  const house = ctx.house.filter(n => !ctx.hidden.has(n));
  const entrants = (act.entrants || []).filter(n => house.includes(n));
  const preSpent = (act.exhausted || []).filter(n => !entrants.includes(n));
  const rail = { names: house, hoh, spent: preSpent };
  const base = (id, extra) => ({ id, kind: 'suite', anchor: ctx.anchor, day: ctx.day, rail, ...extra });
  const out = [];
  // 1 · the rules
  const others = house.filter(n => n !== hoh);
  out.push(base(`bb-suite-open-w${ctx.week}`, {
    rules: SUITE_RULE_ROWS, rulesTitle: 'THE SAFETY SUITE · HOW IT WORKS',
    set: 'ceremony', room: 'Living Room', cam: 4, time: '10:00', kicker: 'Cam 04 · Living room', title: 'The Safety Suite',
    label: 'Safety Suite', sub: 'One pass each, for the whole season', seated: seatLiving([], others, hoh),
    steps: [
      { k: 'bb', t: 'Houseguests, the Safety Suite is open for one hour. Here is how it works.', rule: 0 },
      ...SUITE_RULES.map((t, i) => ({ k: 'bb', t, rule: i + 1, ...(i === 0 ? { railLit: true } : {}) })),
      ...scriptSteps(sc.open),
    ],
  }));
  // 2 · the swipe
  const door = [];
  const shown = entrants.slice(0, 3);
  const spentToast = () => [`${word(entrants.length).toUpperCase()} ${entrants.length === 1 ? 'PASS' : 'PASSES'} SPENT`, '#f5c542'];
  shown.forEach((n, i) => {
    const said = scriptSteps(sc.enter?.[n]);
    if (said.length) said[0] = { ...said[0], at: [[n, 40]] };
    const lastSwipe = i === shown.length - 1 && entrants.length <= 3;
    door.push(...said, { k: 'beat', t: `${n} swipes the pass.`, swipe: [n], ...(said.length ? {} : { at: [[n, 40]] }), ...(lastSwipe ? { toast: spentToast() } : {}) });
  });
  const rest = entrants.slice(3);
  if (rest.length) door.push({ k: 'beat', t: `Then ${listOf(rest)} ${rest.length === 1 ? 'swipes' : 'swipe'} too.`, swipe: rest, at: [[rest[0], 40]], toast: spentToast() });
  if (sc.hold?.length) door.push(...scriptSteps(sc.hold).map(st => ({ ...st, hold: st.by })));
  if (!entrants.length) door.push(...scriptSteps(sc.none));
  door.push({ k: 'bb', t: entrants.length ? 'The Safety Suite is now closed.' : 'Nobody has swiped. The Safety Suite is now closed.', shut: true });
  out.push(base(`bb-suite-door-w${ctx.week}`, {
    set: 'door', built: true, room: 'Suite Door', cam: 7, time: '10:24', kicker: 'Cam 07 · Hallway', title: 'The swipe',
    label: 'Safety Suite · the swipe', sub: 'The door is open for an hour', cast: [], door: true, steps: door,
  }));
  if (!entrants.length) return out;
  // 3 · the clock, slowest run first
  const runs = (act.runs || []).filter(r => entrants.includes(r.name));
  const order = runs.length ? runs : entrants.map(name => ({ name, score: 0 }));
  const shownRuns = order.slice(-6);
  const xs = shownRuns.length === 1 ? [56] : shownRuns.map((_, i) => Math.round(34 + (46 * i) / (shownRuns.length - 1)));
  const runners = shownRuns.map((r, i) => [r.name, xs[i]]);
  // The clock line sits at 80% of a column. A run that missed it stays under it, one
  // that beat it but was not the fastest goes over it in silver, and the winner is
  // the tallest column in gold. Heights follow the scores, so a near miss looks near.
  const clock = act.clock || 5;
  const beat = r => r.score >= clock;
  const top = Math.max(clock + 0.01, ...order.map(r => r.score));
  const height = r => {
    if (r.name === act.winner) return 98;
    if (beat(r)) return Math.round(82 + ((r.score - clock) / (top - clock)) * 12);   // over the line, under the winner
    return Math.round(18 + Math.max(0, Math.min(1, r.score / clock)) * 58);          // under the line, by how close
  };
  const resultOf = r => r.name === act.winner ? 'ok' : beat(r) ? 'slow' : 'short';
  const inside = [
    { k: 'beat', t: `Inside: ${word(entrants.length)} ${entrants.length === 1 ? 'station' : 'stations'}, a wall of white light, and a clock.` },
    { k: 'bb', t: entrants.length === 1 ? 'To be safe this week, you must beat the clock.'
      : 'To be safe this week, you must beat the clock. If more than one of you does, the fastest is safe.' },
  ];
  for (const r of shownRuns) {
    const won = r.name === act.winner;
    const last = r === shownRuns.at(-1);
    const words = won ? sc.safe : last && !act.winner ? sc.clock : sc.short?.[r.name];
    const said = scriptSteps(words);
    const run = { run: [r.name, height(r), resultOf(r)], stamp: [r.name, resultOf(r)],
      ...(won ? { safe: r.name, toast: ['SAFE', '#12b76a'] } : {}) };
    if (said.length) { said[0] = { ...said[0], ...run }; inside.push(...said); }
    else inside.push({ k: 'beat', t: won ? `${r.name} beats the clock.` : beat(r) ? `${r.name} beats the clock, but not fast enough.` : `${r.name} runs out of time.`, ...run });
  }
  inside.push(act.winner
    ? { k: 'bb', t: `${act.winner}, you have beaten the clock. You are safe this week.${act.plusOne ? ' You must now choose one other houseguest to be safe with you.' : ''}` }
    : { k: 'bb', t: 'Nobody has beaten the clock. Nobody is safe this week.' });
  out.push(base(`bb-suite-clock-w${ctx.week}`, {
    set: 'suite', built: true, bright: true, room: 'Safety Suite', cam: 8, time: '11:30', kicker: 'Cam 08 · Safety Suite', title: 'Beat the clock',
    label: 'Safety Suite · the clock', sub: `${titleCase(word(entrants.length))} ${entrants.length === 1 ? 'entrant' : 'entrants'}, one clock`,
    cast: runners, runners, railHidden: true, steps: inside,
  }));
  // 4 · the Plus One
  if (act.winner && act.plusOne) {
    const plus = scriptSteps(sc.plus);
    const named = plus.findIndex(st => st.by === act.winner);
    const at = named >= 0 ? named : 0;
    const bill = { k: 'beat', t: `${act.winner} turns the card over.`, bill: PRICE[act.punishment] || String(act.punishmentLabel || 'A PRICE').toUpperCase() };
    const steps = [{ k: 'bb', t: `${act.winner}, your Plus One will be safe this week. But their safety has a price.` }];
    if (plus.length) { plus[at] = { ...plus[at], plus: act.plusOne }; steps.push(...plus.slice(0, at + 1), bill, ...plus.slice(at + 1)); }
    else steps.push({ k: 'beat', t: `${act.winner} picks ${act.plusOne}.`, plus: act.plusOne }, bill);
    if (sc.passed?.length) { const p = scriptSteps(sc.passed); p[0] = { ...p[0], passed: act.passed }; steps.push(...p); }
    out.push(base(`bb-suite-plus-w${ctx.week}`, {
      set: 'ceremony', room: 'Living Room', cam: 4, time: '12:10', kicker: 'Cam 04 · Living room', title: 'The Plus One',
      label: 'Safety Suite · the Plus One', sub: 'Safety, and the bill that comes with it',
      // the two people this screen is about get the front seats
      seated: seatLiving([], [act.plusOne, act.passed, ...house].filter((n, i, all) => n && n !== act.winner && all.indexOf(n) === i), act.winner), steps,
    }));
  }
  return out;
}

// ── the Chain of Safety (Phase 7) ─────────────────────────────────────
// No nominations: the house saves itself one name at a time. Screens: Big
// Brother's rules and the first link; the chain itself (a line of linked
// portraits growing across the top while the "still waiting" row shrinks);
// on a Québec week the chain again; and on a Canada week the last three
// playing for safety. Words: act.script.chain (bb/script/ceremony.js).
const CHAIN_RULES = {
  canada: [['NO NOMINATIONS', 'the house decides who is safe instead'], ['ONE LINK', 'the first person is safe, and names the next'],
    ['PASS IT ON', 'each person saved names one more, in front of everyone'], ['THE LAST THREE', 'play for safety — the other two are nominated']],
  quebec: [['NO NOMINATIONS', 'the house decides who is safe instead'], ['ONE LINK', 'the first person is safe, and names the next'],
    ['THE ONE LEFT', 'nobody names them, so they are nominated'], ['AGAIN, THEN A DUEL', 'a second chain finds the other — they duel, the loser goes']],
};
function chainScreens(act, ctx) {
  const quebec = act.style === 'quebec';
  const runs = act.script?.chain || [];
  const house = ctx.house.filter(n => !ctx.hidden.has(n));
  const out = [];
  const base = (id, extra) => ({ id, kind: 'chain', anchor: ctx.anchor, day: ctx.day, chainStyle: quebec ? 'quebec' : 'canada', ...extra });
  const beatsOf = run => (act.beats || []).filter(b => (b.run === 1 ? 1 : 0) === run);
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  // 1 · the rules, and the first link
  const first = act.order?.[0] || act.starter;
  const startBeat = beatsOf(0).find(b => b.part === 'start');
  const rules = [
    { k: 'bb', t: 'Houseguests, there will be no nomination ceremony this week. Instead, you will decide who is safe.', rule: 1 },
    { k: 'bb', t: 'One person starts the chain. They are safe, and they choose one other houseguest to be safe.', rule: 2 },
    quebec
      ? { k: 'bb', t: 'That person chooses the next, and so on, until one houseguest is left. Nobody chose them, so they are nominated.', rule: 3 }
      : { k: 'bb', t: 'That person chooses the next, and so on. When three houseguests are left, the chain stops.', rule: 3 },
    quebec
      ? { k: 'bb', t: 'Then the chain runs again for the second nominee. The two nominees will play head to head, and the loser is evicted. There is no vote.', rule: 4 }
      : { k: 'bb', t: 'Those three will play for safety. The winner is safe, and the other two are nominated.', rule: 4 },
    act.variant === 'hoh' && startBeat?.how === 'hoh'
      ? { k: 'bb', t: `${first}, as Head of Household, you will start the chain.`, chainStart: first }
      : { k: 'beat', t: `${first} wins the safety competition and holds the first link.`, chainStart: first, toast: ['FIRST LINK', '#f5c542'] },
    ...linesOf(startBeat),
  ];
  out.push(base(`bb-chain-open-w${ctx.week}`, {
    set: 'ceremony', room: 'Living Room', cam: 4, time: '13:00', kicker: 'Cam 04 · Living room', title: 'Chain of Safety',
    label: 'Chain of Safety', sub: 'No nominations: the house saves itself', seated: seatLiving([], house.filter(n => n !== first), first),
    rules: CHAIN_RULES[quebec ? 'quebec' : 'canada'], rulesTitle: 'CHAIN OF SAFETY · HOW IT WORKS', steps: rules,
  }));
  // 2 · the chain, once or twice
  const runScreen = (run, title, sub) => {
    const bs = beatsOf(run);
    const starter = run === 0 ? first : act.secondChain?.order?.[0];
    const pool = run === 0 ? house : house.filter(n => n !== act.nominees?.[0]);
    const steps = [];
    if (run === 1) {
      const again = (act.beats || []).find(b => b.part === 'again');
      steps.push({ k: 'bb', t: `${act.nominees?.[0]}, you are nominated. The chain will now run again for the second nominee.`, nom: [act.nominees?.[0]].filter(Boolean) });
      steps.push(...linesOf(again));
      const st2 = bs.find(b => b.part === 'start');
      steps.push({ k: 'beat', t: `${starter} starts the chain this time.`, chainStart: starter, at: [[starter, 50]] }, ...linesOf(st2));
    }
    for (const b of bs) {
      const [a, x] = b.players || [];
      if (b.part === 'link') {
        const said = linesOf(b);
        const step = { link: [a, x], at: [[a, 34], [x, 66]] };
        if (said.length) { said[0] = { ...said[0], ...step }; steps.push(...said); }
        else steps.push({ k: 'beat', t: `${a} picks ${x}.`, ...step });
      }
      if (b.part === 'passed') {
        const said = linesOf(b);
        if (said.length) { said[0] = { ...said[0], snub: [x, a] }; steps.push(...said); }
      }
      if (b.part === 'last') {
        const said = linesOf(b);
        if (said.length) { said[0] = { ...said[0], at: [[a, 50]] }; steps.push(...said); }
      }
      if (b.part === 'leftover') {
        const left = b.players || [];
        const xs = left.length === 1 ? [50] : left.map((_, i) => Math.round(30 + (40 * i) / (left.length - 1)));
        steps.push({ k: 'beat', t: left.length === 1 ? `Nobody picked ${left[0]}.` : `Nobody picked ${listOf(left)}.`,
          leftover: left, at: left.map((n, i) => [n, xs[i]]), toast: ['CHOSEN BY NOBODY', '#ff3355'] }, ...linesOf(b));
      }
    }
    out.push(base(`bb-chain-run${run}-w${ctx.week}`, {
      set: 'ceremony', room: 'Living Room', cam: 4, time: run ? '14:20' : '13:20', kicker: 'Cam 04 · Living room', title, label: `Chain of Safety · ${title.toLowerCase()}`,
      sub, cast: [[starter, 50]], chainRun: { pool, starter }, steps,
    }));
  };
  runScreen(0, 'The chain', `${titleCase(word(house.length - 1))} names to give`);
  if (quebec && act.secondChain) runScreen(1, 'The chain, again', 'One more nominee to find');
  // 3 · how it ends
  const noms = (act.nominees || []).filter(Boolean);
  if (!quebec) {
    const finalBeat = (act.beats || []).find(b => b.part === 'final');
    const nomBeat = (act.beats || []).find(b => b.part === 'noms');
    const three = act.leftover || [];
    const xs = three.map((_, i) => three.length === 1 ? 50 : Math.round(28 + (44 * i) / (three.length - 1)));
    const steps = [{ k: 'bb', t: `${listOf(three)}, nobody chose you. You will now play for safety. The winner is safe, and the other two will be nominated.`, at: three.map((n, i) => [n, xs[i]]) }];
    if (act.safetyWinner) {
      const said = linesOf(finalBeat);
      const win = { safe: act.safetyWinner, toast: ['SAFE', '#12b76a'] };
      steps.push({ k: 'beat', t: `${act.safetyWinner} wins and is safe.`, ...win }, ...said);
    }
    if (noms.length) {
      steps.push({ k: 'bb', t: `${listOf(noms)}, you are this week's nominees.`, nom: noms, toast: ['NOMINATED', '#ff3355'], at: noms.map((n, i) => [n, noms.length === 1 ? 50 : 36 + i * 28]) }, ...linesOf(nomBeat));
    }
    out.push(base(`bb-chain-final-w${ctx.week}`, {
      set: 'ceremony', room: 'Living Room', cam: 4, time: '15:00', kicker: 'Cam 04 · Living room', title: 'The last three',
      label: 'Chain of Safety · the last three', sub: 'One safe, two nominated', cast: three.map((n, i) => [n, xs[i]]), steps,
    }));
  } else if (noms.length === 2) {
    out.at(-1).steps.push({ k: 'bb', t: `${listOf(noms)}, you are this week's nominees. You will face each other head to head, and the loser will be evicted.`,
      nom: noms, toast: ['NOMINATED', '#ff3355'], at: noms.map((n, i) => [n, 36 + i * 28]) });
  }
  return out;
}

// ── the Hidden Power (Phase 7) ─────────────────────────────────────────
// A power hidden somewhere in the house, found only by looking. The set is a
// map of the eight places it could be; every search stamps the searcher on the
// spot they tried, being seen looking raises "the house believes", and the
// viewer — never the house — is shown where it really is. Words:
// lines/huntact.js on the act's beats (bb/script/ceremony.js).
export const HUNT_SPOTS = [['pantry', 'Pantry'], ['have-not', 'Have-not room'], ['diary', 'Diary Room chair'], ['hoh-bath', 'HOH bathroom'],
  ['storage', 'Storage'], ['yard', 'By the hammock'], ['laundry', 'Laundry'], ['memory', 'Memory wall']];
const HUNT_SAID = { pantry: 'the pantry', 'have-not': 'the have-not room', diary: 'the Diary Room chair', 'hoh-bath': 'the HOH bathroom',
  storage: 'the storage room', yard: 'the hammock', laundry: 'the laundry room', memory: 'the memory wall' };
function huntScreens(act, ctx) {
  const house = ctx.house.filter(n => !ctx.hidden.has(n));
  const power = act.power || 'a power';
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const base = (id, extra) => ({ id, kind: 'hunt', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4,
    kicker: 'Cam 04 · Living room', hunt: { place: act.place, heat: act.heatBefore || 0, expired: act.phase === 'expired' }, ...extra });
  if (act.phase === 'hidden') {
    const weeks = act.weeksLeft || 4;
    const announce = (act.beats || []).find(b => b.part === 'announce');
    return [base(`bb-hunt-hidden-w${ctx.week}`, {
      time: '09:00', title: 'Something in this house', label: 'Hidden Power', sub: `${power} is hidden somewhere inside`,
      seated: seatLiving([], house.filter(n => n !== ctx.hoh), ctx.hoh),
      rules: [['HIDDEN', 'a power is somewhere in this house'], ['NO CLUES', 'no map, no competition — you just look'],
        ['FINDERS KEEPERS', 'whoever finds it keeps it, and tells nobody'], ["IT WON'T WAIT", `gone in ${word(weeks)} weeks if nobody finds it`]],
      rulesTitle: 'THE HIDDEN POWER · HOW IT WORKS',
      steps: [
        { k: 'bb', t: `Houseguests, ${power} is hidden somewhere in this house.`, rule: 1 },
        { k: 'bb', t: 'There are no clues and no competition. If you want it, you will have to look for it.', rule: 2 },
        { k: 'bb', t: 'Whoever finds it keeps it. Nobody else will be told.', rule: 3 },
        { k: 'bb', t: `If nobody finds it in ${word(weeks)} weeks, it will be gone for good.`, rule: 4 },
        { k: 'beat', t: 'Nobody knows where it is. It could be in any room in the house.' },
        ...linesOf(announce),
      ],
    })];
  }
  if (act.phase === 'expired') {
    return [base(`bb-hunt-expired-w${ctx.week}`, {
      time: '09:00', title: 'Never found', label: 'Hidden Power · never found', sub: 'Nobody ever looked in the right place',
      cast: [], steps: [
        { k: 'beat', t: 'Nobody found it, and now it is gone.', secret: true },
        { k: 'beat', t: `${power} was ${act.placeName} the whole time. Nobody in the house will ever know it was there.`, toast: ['NEVER FOUND', '#8fa0bb'] },
      ],
    })];
  }
  // a week of searching
  const left = act.weeksLeft || 1;
  const steps = [{ k: 'beat', t: left === 1 ? 'This is the last week anyone can find it.'
    : `${titleCase(word(left))} weeks left to find it, and the searching starts.` }];
  for (const b of act.beats || []) {
    const [a, x] = b.players || [];
    const said = linesOf(b);
    const mark = b.part === 'search' ? { look: [a, b.place], at: [[a, 50]] }
      : b.part === 'seen' ? { seen: [a, x], at: [[a, 36], [x, 64]] }
        : b.part === 'spread' ? { spread: a, at: [[a, 50]] }
          : b.part === 'found' ? { found: [a, b.place], at: [[a, 50]], toast: ['FOUND IT', '#f5c542'] }
            : b.part === 'near' ? { at: [[a, 50]] } : {};
    // The map is the set: a search or the find plays on it first, then the words.
    if (b.part === 'search') { steps.push({ k: 'beat', t: `${a} searches ${HUNT_SAID[b.place] || 'the house'}.`, ...mark }, ...said); continue; }
    if (b.part === 'found') { steps.push({ k: 'beat', t: `${a} reaches into ${HUNT_SAID[b.place] || 'the right place'}, and it's there.`, ...mark }, ...said); continue; }
    if (said.length) { said[0] = { ...said[0], ...mark }; steps.push(...said); }
    else steps.push({ k: 'beat', t: b.text, ...mark });
  }
  return [base(`bb-hunt-search-w${ctx.week}`, {
    time: '04:10', nv: true, title: act.found ? 'Found it' : 'The search', label: act.found ? 'Hidden Power · found' : 'Hidden Power · the search',
    sub: act.found ? 'Somebody has it, and nobody knows' : 'Everybody is looking', cast: [], steps,
  })];
}

// ── Prizes and Punishments (Phase 7) ────────────────────────────────────
// The veto competition only set the pick order. One wrapped box per player on
// a table across the room: each is opened in turn — the veto, a prize or a
// punishment — and each opener may swap for any box already open, so the veto
// can change hands in public. Words: lines/pxact.js on the act's beats.
function pxScreens(act, ctx) {
  const order = (act.order || []).filter(Boolean);
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const steps = [
    { k: 'bb', t: 'The veto competition did not decide the veto. It decided the order you pick in. Last place picks first.', rule: 1 },
    { k: 'bb', t: 'There is one box for each of you. One holds the Power of Veto. The rest hold prizes, or punishments.', rule: 2 },
    { k: 'bb', t: 'When you open your box, you may swap it for any box that has already been opened.', rule: 3 },
    { k: 'bb', t: 'Whatever you are holding at the end is yours: the veto, the prize, or the punishment.', rule: 4 },
  ];
  if (order[0]) steps.push({ k: 'bb', t: `${order[0]}, you finished last, so you pick first.` });
  for (const b of act.beats || []) {
    const [a, x] = b.players || [];
    const said = linesOf(b);
    const mark = b.part === 'open' ? { open: [a, b.boxNo, b.kind, b.item], ...(b.kind === 'veto' ? { toast: ['THE VETO IS OUT', '#f5c542'] } : {}) }
      : b.part === 'swap' ? { swap: [a, x, b.boxNo, b.gaveNo], ...(b.kind === 'veto' ? { toast: ['THE VETO CHANGES HANDS', '#ff3355'] } : {}) } : {};
    if (said.length) { said[0] = { ...said[0], ...mark }; steps.push(...said); }
    else steps.push({ k: 'beat', t: b.text, ...mark });
  }
  if (act.vetoHolder) steps.push({ k: 'bb', t: `${act.vetoHolder}, you are holding the Power of Veto.`, veto: act.vetoHolder });
  return [{
    id: `bb-px-w${ctx.week}`, kind: 'px', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '15:30',
    kicker: 'Cam 04 · Living room', title: 'Prizes and Punishments', label: 'Prizes & Punishments', sub: 'The veto is in one of the boxes',
    seated: seatLiving([], order.slice(0, 9), null), px: { boxes: act.boxCount || order.length },
    rules: [['PICK ORDER', 'last place in the competition picks first'], ['ONE BOX EACH', 'one holds the veto — the rest, prizes or punishments'],
      ['SWAP ONCE', 'trade for any box already opened'], ['KEEP IT', 'what you hold at the end is yours']],
    rulesTitle: 'PRIZES AND PUNISHMENTS · HOW IT WORKS', steps,
  }];
}

// ── Duo Week, "You Go, They Go" (Phase 7) ──────────────────────────────
// One week in pairs: Big Brother's rules over a board of the pairs (two faces
// chained together, the solo houseguest who cannot be nominated, the HOH with
// nobody); the week chained together, each pair's story lit on the board; and
// after the vote, the partner who leaves on votes they never got. The duo
// nomination ceremony and the eviction are the core screens. Words:
// lines/duoact.js on the acts' beats.
function duoWeekScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const base = (id, extra) => ({ id, kind: 'duo', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4,
    kicker: 'Cam 04 · Living room', ...extra });
  if (act.type === 'duo-week-open') {
    ctx.duoWeek = { pairs: (act.pairs || []).map(p => [...p]), solo: act.solo || null, hoh: act.hoh || ctx.hoh };
    const steps = [
      { k: 'bb', t: 'Houseguests, this week you will play in pairs. Everyone except the Head of Household is chained to a partner.', rule: 1 },
      { k: 'bb', t: 'The Head of Household will nominate two pairs, so four of you will sit on the block.', rule: 2 },
      { k: 'bb', t: 'You will vote the way you always do: one name each. Whoever gets the most votes is evicted.', rule: 3 },
      { k: 'bb', t: "And their partner is evicted with them, however many votes they got. Even if it was none.", rule: 4 },
    ];
    for (const b of act.beats || []) {
      const p = b.players || [];
      if (b.part === 'pair') steps.push({ k: 'bb', t: `${p[0]} and ${p[1]}.`, pair: [p[0], p[1]] }, ...linesOf(b));
      if (b.part === 'hoh') steps.push(...linesOf(b));
      if (b.part === 'solo') steps.push({ k: 'bb', t: `${p[0]}, you have no partner this week. You cannot be nominated.`, solo: p[0], toast: ['CAN’T BE NOMINATED', '#12b76a'] }, ...linesOf(b));
    }
    return [base(`bb-duo-open-w${ctx.week}`, {
      time: '11:00', title: 'You Go, They Go', label: 'You Go, They Go', sub: 'One week, in pairs',
      seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh), duo: { ...ctx.duoWeek, reveal: true },
      rules: [['IN PAIRS', 'everyone but the HOH is chained to a partner'], ['TWO PAIRS UP', 'the HOH nominates two pairs — four on the block'],
        ['ONE VOTE EACH', 'the most votes is evicted'], ['THEY GO TOO', 'and their partner leaves with them, votes or not']],
      rulesTitle: 'YOU GO, THEY GO · HOW IT WORKS', steps,
    })];
  }
  if (act.type === 'duo-week-events') {
    const steps = [{ k: 'beat', t: `Two pairs are on the block. Everybody else is still chained to somebody.` }];
    for (const b of act.beats || []) {
      const said = linesOf(b);
      const on = (b.players || []).slice(0, b.kind === 'pact' ? 4 : 2);
      if (said.length) { said[0] = { ...said[0], pairOn: on }; steps.push(...said); }
    }
    return [base(`bb-duo-week-w${ctx.week}`, {
      time: '16:00', title: 'Chained', label: 'You Go, They Go · chained', sub: 'A week in pairs',
      cast: [], duo: { ...(ctx.duoWeek || {}), nominees: [...ctx.nominees] }, steps,
    })];
  }
  // the partner, after the vote
  const taken = act.taken, gone = act.evicted;
  const b = (act.beats || []).find(x => x.part === 'taken');
  return [base(`bb-duo-taken-w${ctx.week}`, {
    time: 'LIVE', title: 'They go too', label: 'You Go, They Go · they go too', sub: `${gone} and ${taken} leave together`,
    cast: [[gone, 36], [taken, 64]], steps: [
      { k: 'host', by: ctx.host || 'Valeria', t: `${taken}, you are ${gone}'s partner. You are evicted too.`, out: taken, toast: ['THEY GO TOO', '#ff3355'] },
      { k: 'beat', t: act.gotNothing ? `Not one houseguest voted to evict ${taken}.` : `${titleCase(word(act.votesAgainstTaken || 0))} ${act.votesAgainstTaken === 1 ? 'houseguest' : 'houseguests'} voted to evict ${taken}. It would not have been enough.` },
      ...linesOf(b),
      { k: 'beat', t: `${gone} and ${taken} walk out of the front door together.`, exit: taken },
    ],
  })];
}

// ── Camp Comeback (Phase 7) ─────────────────────────────────────────────
// The first evictions do not send anybody home. Each one is its own short
// screen straight after the vote: the evictee is turned round at the door and
// takes a bunk on the camp board (Big Brother explains the rules on the first
// one); the board fills to four. The night it is full, the four play in the
// backyard for one place back in the game, and the board empties one face at
// a time, last place first. Words: lines/campact.js on the acts' beats.
function campScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const size = act.size || 4;
  if (act.type === 'camp-comeback') {
    const a = act.arrival, nth = act.nth || (act.camp || []).length;
    const steps = [{ k: 'beat', t: `The front door opens again, and ${a} is called back inside.` }];
    const rules = nth === 1;
    if (rules) {
      steps.push({ k: 'host', by: ctx.host, t: `${a}, you have been evicted from the Big Brother house. But you are not leaving.` });
      steps.push(
        { k: 'bb', t: `Houseguests, the first ${word(size)} people evicted this season will not leave the house.`, rule: 1 },
        { k: 'bb', t: 'They will live here as campers. Campers cannot compete, cannot vote and cannot be nominated.', rule: 2 },
        { k: 'bb', t: `When camp holds ${word(size)}, they will play one competition. The winner comes back into the game.`, rule: 3 },
        { k: 'bb', t: 'Everyone else in camp will leave the house for good.', rule: 4 });
      steps.push({ k: 'bb', t: `${a}, you are the first camper.`, campIn: a, toast: ['NOT LEAVING', '#ff8a3d'] });
    } else {
      steps.push({ k: 'host', by: ctx.host, t: `${a}, you are evicted. And like the others, you are staying in camp.`,
        campIn: a, toast: ['NOT LEAVING', '#ff8a3d'] });
      steps.push({ k: 'bb', t: nth >= size ? `Camp is full. Tonight, one camper comes back into the game.`
        : `Camp now holds ${word(nth)} of ${word(size)}. Campers cannot compete, vote or be nominated.` });
    }
    for (const b of act.beats || []) steps.push(...linesOf(b));
    return [{
      id: `bb-camp-w${ctx.week}`, kind: 'camp', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4,
      time: 'LIVE', kicker: 'Cam 04 · Living room', title: rules ? 'Camp Comeback' : 'Not leaving', label: rules ? 'Camp Comeback' : 'Camp Comeback · not leaving',
      sub: `${a} stays in the house`, cast: [[a, 50]], camp: { names: (act.camp || [a]).slice(), size, reveal: a },
      ...(rules ? { rules: [['NOT LEAVING', `the first ${word(size)} evicted stay in the house`], ['NO GAME', 'campers cannot compete, vote or be nominated'],
        ['ONE WAY BACK', `when camp holds ${word(size)}, they play for one place`], ['THE REST GO', 'everyone else in camp leaves for good']],
        rulesTitle: 'CAMP COMEBACK · HOW IT WORKS' } : {}),
      steps,
    }];
  }
  // the door
  const played = (act.played || []).slice();
  const steps = [
    { k: 'bb', t: `Campers, camp is full. ${titleCase(word(played.length))} of you have been living here with no game to play.`, rule: 1 },
    { k: 'bb', t: 'You will play one competition. The winner comes back into the game tonight.', rule: 2 },
    { k: 'bb', t: 'Everyone else will leave the house for good.', rule: 3 },
  ];
  for (const b of act.beats || []) {
    const p = b.players || [];
    if (b.part === 'out') steps.push({ k: 'bb', t: `${p[0]}, you finished ${CAMP_ORD[b.place] || 'behind'}. Your time in this house is over.`, campOut: p[0] }, ...linesOf(b));
    else if (b.part === 'back') steps.push({ k: 'bb', t: `${p[0]}, you have won. You are back in the game.`, campBack: p[0], toast: ['BACK IN THE GAME', '#f5c542'] }, ...linesOf(b));
    else steps.push(...linesOf(b));
  }
  return [{
    id: `bb-campdoor-w${ctx.week}`, kind: 'camp', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard,
    time: '22:10', kicker: 'Cam 05 · Backyard', title: 'The Door', label: 'Camp Comeback · the door', sub: 'One camper comes back',
    cast: played.map((n, i) => [n, Math.round(20 + i * (60 / Math.max(1, played.length - 1)))]),
    camp: { names: played, size: played.length },
    rules: [['CAMP IS FULL', `${word(played.length)} evicted houseguests, still in the house`], ['ONE COMPETITION', 'the winner is back in the game'],
      ['THE REST GO', 'everyone else leaves for good']],
    rulesTitle: 'THE DOOR · HOW IT WORKS', steps,
  }];
}
const CAMP_ORD = { 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth' };

// ── The Wildcard (Phase 7) ──────────────────────────────────────────────
// Three names out of a hat, a puzzle, and an offer. Big Brother explains it on
// a rules card, the hat board fills with each name drawn, the scores come in
// lowest first so the winner is the last card to light, and then the offer is
// made out loud: safety, and what it costs (and who pays). Taking it or
// turning it down is the last thing on the board. Words: lines/wildact.js.
function wildcardScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const drawnN = (act.players || []).length;
  const byTeam = (act.teamPicks || []).length > 0;
  const steps = byTeam ? [
    { k: 'bb', t: `Houseguests, it is time for the Wildcard Competition. The ${word(drawnN)} teams that are not safe this week will each send one player.`, rule: 1 },
  ] : [
    { k: 'bb', t: `Houseguests, it is time for the Wildcard. I will draw ${word(drawnN)} names from this hat. Nobody chooses to play.`, rule: 1 },
    { k: 'bb', t: byTeam ? 'They will play one puzzle. The best score wins.' : 'The houseguests drawn will play one puzzle. The best score wins.', rule: 2 },
    { k: 'bb', t: 'The winner will be offered safety for this week.', rule: 3 },
    { k: 'bb', t: 'But safety has a price. The winner can take it and pay, or turn it down.', rule: 4 },
  ];
  for (const b of beats.filter(x => x.part === 'sent')) {
    steps.push({ k: 'beat', t: `The ${b.team} send ${b.players[0]}.`, wcDraw: b.players[0] }, ...linesOf(b));
  }
  for (const b of beats.filter(x => x.part === 'drawn')) {
    const n = b.players[0];
    steps.push({ k: 'bb', t: b.first ? `The first name is... ${n}.` : `The next name is... ${n}.`, wcDraw: n }, ...linesOf(b));
  }
  for (const b of beats.filter(x => x.part === 'missed')) steps.push(...linesOf(b));
  const played = beats.filter(x => x.part === 'played').slice().reverse();   // lowest first
  if (played.length) steps.push({ k: 'bb', t: `${listNames(act.players || [])}, the puzzle starts now.` });
  for (const b of played) {
    const n = b.players[0];
    const won = b.place === 1;
    steps.push({ k: 'bb', t: won ? `${n} scores ${b.score}. ${n}, you have won the Wildcard.` : `${n} scores ${b.score}.`,
      wcScore: [n, b.score], ...(won ? { wcWin: n, toast: ['WILDCARD WINNER', '#f5c542'] } : {}) }, ...linesOf(b));
  }
  const w = act.winner;
  if (w) {
    steps.push({ k: 'bb', t: `${w}, you can be safe this week. The price: ${act.punishmentLabel}.${act.punishmentBlurb ? ' ' + act.punishmentBlurb : ''}`, wcOffer: true });
    if (act.houseWide) steps.push({ k: 'bb', t: `And you will not pay it. Everyone else in the house will.`, wcOffer: true });
    steps.push({ k: 'bb', t: `${w}, do you accept?` });
  }
  for (const b of beats) {
    if (b.part === 'took') steps.push({ k: 'beat', t: `${w} accepts.`, wcTook: true,
      toast: act.houseWide ? ['THE HOUSE PAYS', '#ff3355'] : ['SAFE, AT A PRICE', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'refused') steps.push({ k: 'beat', t: `${w} turns it down.`, wcRefused: true, toast: ['TURNED IT DOWN', '#9aa4b2'] }, ...linesOf(b));
    if (b.part === 'bill' || b.part === 'blocked') steps.push(...linesOf(b));
  }
  return [{
    id: `bb-wild-w${ctx.week}`, kind: 'wild', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '12:15',
    kicker: 'Cam 04 · Living room', title: 'The Wildcard', label: 'The Wildcard', sub: byTeam ? 'One player a team, one offer' : 'Three names, one offer',
    seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh),
    wild: { n: drawnN, price: act.punishmentLabel, houseWide: !!act.houseWide },
    rules: [byTeam ? ['THE TEAMS', 'each team that is not safe sends one'] : ['THE HAT', `${word(drawnN)} names are drawn — nobody chooses to play`], ['ONE PUZZLE', 'the best score wins'],
      ['THE OFFER', 'the winner is offered safety this week'], ['THE PRICE', 'take it and pay a punishment, or turn it down']],
    rulesTitle: 'THE WILDCARD · HOW IT WORKS', steps,
  }];
}
const listNames = ns => ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns.at(-1)}`;

// ── The Secret Power Competition (Phase 7) ──────────────────────────────
// Straight after the Head of Household it was hiding inside: Big Brother's
// rules, then the doors in the yard opened one at a time on a board. A won
// door shows its winner (to the viewer only; the house never learns) and
// what the power does; an unclaimed one stays dark. Then the price: whoever
// had the best score and gave the crown away for it. Words: lines/spact.js.
function secretPowerScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const n = (act.doors || []).length;
  const steps = [
    { k: 'bb', t: `Houseguests, this Head of Household competition was hiding ${word(n)} secret ${n === 1 ? 'power' : 'powers'}, each behind a door in the yard.`, rule: 1 },
    { k: 'bb', t: 'Before it started, each of you chose: play for Head of Household, or play for a door.', rule: 2 },
    { k: 'bb', t: 'If you chose a door, you could not win Head of Household, however well you did.', rule: 3 },
    { k: 'bb', t: 'Whoever went furthest for a door wins its power. Nobody else will ever be told who.', rule: 4 },
  ];
  for (const b of beats.filter(x => x.part === 'open' || x.part === 'barred')) steps.push(...linesOf(b));
  const order = (act.doors || []);
  for (const b of beats.filter(x => x.part === 'won' || x.part === 'unclaimed')) {
    const i = order.indexOf(b.door);
    steps.push({ k: 'beat', t: `Door ${word(i + 1)}: ${b.power}.${b.blurb ? ' ' + b.blurb : ''}`, spDoor: i, spName: b.power });
    if (b.part === 'won') steps.push({ k: 'beat', t: `${b.players[0]} gets there first.`, spOpen: [i, b.players[0]], toast: ['A SECRET POWER', '#b07cff'] }, ...linesOf(b));
    else steps.push({ k: 'beat', t: `Nobody went for it. It goes back in the box.`, spOpen: [i, null] });
  }
  for (const b of beats.filter(x => x.part === 'price' || x.part === 'handed')) steps.push(...linesOf(b));
  return [{
    id: `bb-secretpower-w${ctx.week}`, kind: 'spower', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '21:40',
    kicker: 'Cam 05 · Backyard', title: 'Secret Powers', label: 'Secret Powers', sub: 'The competition behind the competition',
    cast: [], spower: { doors: n },
    rules: [['THE DOORS', `${word(n)} secret powers, hidden in the competition`], ['ONE CHOICE', 'play for HOH, or for a door'],
      ['NO CROWN', 'choose a door and you cannot win HOH'], ['SECRET', 'nobody is told who won a power']],
    rulesTitle: 'SECRET POWERS · HOW IT WORKS', steps,
  }];
}

// ── The Time Capsule (Phase 7) ──────────────────────────────────────────
// America picks a favourite, who goes into the capsule alone. Big Brother
// explains it on a rules card, the challenge says what is in the room, and the
// run plays stage by stage against a meter that fills toward the target. Beat
// it and they come out holding a secret power (never named); lose it and they
// come out wearing a punishment in front of everybody. Words: lines/capact.js.
function capsuleScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const a = act.recipient;
  const n = act.challenge?.stages || beats.filter(b => b.part === 'stage').length;
  const steps = [
    { k: 'bb', t: 'Houseguests, America has voted for its favourite houseguest. Each of you can be picked once a season.', rule: 1 },
    { k: 'bb', t: 'America\'s favourite will go into the Time Capsule alone and face one challenge.', rule: 2 },
    { k: 'bb', t: 'Beat it, and they come out with a power from a past season. Only they will know what it is.', rule: 3 },
    { k: 'bb', t: 'Lose, and they come out with a punishment from a past season, for everyone to see.', rule: 4 },
    { k: 'bb', t: `${a}, America has chosen you. Please go to the Time Capsule.`, toast: ["AMERICA'S FAVOURITE", '#f5c542'] },
  ];
  for (const b of beats) {
    if (b.part === 'entry') steps.push(...linesOf(b));
    if (b.part === 'room') steps.push({ k: 'beat', t: b.text, capRoom: true });
    if (b.part === 'stage') {
      const said = linesOf(b);
      const mark = { capStage: [b.index, b.grade, b.score] };
      steps.push({ k: 'beat', t: `Stage ${word(b.index)} of ${word(n)}: ${b.grade === 'good' ? 'clean' : b.grade === 'near' ? 'slow, but done' : 'missed'}.`, ...mark }, ...said);
    }
    if (b.part === 'won') steps.push({ k: 'beat', t: `${a} beats the Time Capsule and comes out holding something.`, capEnd: 'won', toast: ['THE CAPSULE IS BEATEN', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'lost') steps.push({ k: 'beat', t: `${a} does not beat the clock, and comes out ${act.punishmentVerb || 'wearing'} ${act.punishment}.`, capEnd: 'lost', toast: ['THE CAPSULE WINS', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'tether') steps.push(...linesOf(b));
  }
  return [{
    id: `bb-capsule-w${ctx.week}`, kind: 'capsule', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '15:00',
    kicker: 'Cam 04 · Living room', title: 'The Time Capsule', label: 'The Time Capsule', sub: `${act.challenge?.name || 'One challenge'}, alone`,
    cast: [[a, 50]], capsule: { n, target: act.target, name: act.challenge?.name || '' },
    rules: [["AMERICA'S PICK", 'the country chooses one houseguest, once a season each'], ['THE CAPSULE', 'they go in alone and face one challenge'],
      ['BEAT IT', 'a secret power from a past season'], ['LOSE IT', 'a punishment from a past season, in public']],
    rulesTitle: 'THE TIME CAPSULE · HOW IT WORKS', steps,
  }];
}

// ── The Interrogation, and the Deepfake (Phase 7) ──────────────────────
// A secret power takes the Head of Household's week before nominations. The
// Interrogation is public: Big Brother explains it, the deposed HOH questions
// the house one room at a time while a tally of the names given builds on the
// board, then names one, and is right or wrong. The Deepfake is not public at
// all, so its card is the narrator's, not Big Brother's, and only the taker
// speaks, in the Diary Room. Words: lines/intact.js.
function interrogationScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const deposed = act.deposed, holder = act.holder;
  if (act.creditsDeposed) {
    const steps = [
      { k: 'beat', t: `${holder} has a secret power that takes somebody else's Head of Household.`, rule: 1 },
      { k: 'beat', t: `${holder} uses it on ${deposed}. ${deposed} is not told.`, rule: 2 },
      { k: 'beat', t: `When the nominations are read out, the wall will use ${deposed}'s voice.`, rule: 3 },
    ];
    for (const b of beats) steps.push(...linesOf(b));
    return [{
      id: `bb-deepfake-w${ctx.week}`, kind: 'interro', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, time: '12:40',
      kicker: 'Cam 01 · Diary room', title: 'The Deepfake', label: 'The Deepfake', sub: 'Only the viewer knows',
      cast: [[holder, 50]], rules: [['THE POWER', `${holder} takes the Head of Household`], ['IN SECRET', `${deposed} is never told`],
        ['THE WALL', `nominations are read in ${deposed}'s voice`]], rulesTitle: 'THE DEEPFAKE · ONLY YOU KNOW', steps,
    }];
  }
  const steps = [
    { k: 'bb', t: `Houseguests, somebody in this house has used a secret power to take ${deposed}'s Head of Household.`, rule: 1 },
    { k: 'bb', t: `${deposed} will now question every one of you, one at a time.`, rule: 2 },
    { k: 'bb', t: `Then ${deposed} will name the houseguest who took it.`, rule: 3 },
    { k: 'bb', t: `If ${deposed} is right, ${deposed} keeps the week. If not, the taker is Head of Household, and nobody will be told who.`, rule: 4 },
  ];
  for (const b of beats) {
    if (b.part === 'dethroned' || b.part === 'ally') steps.push(...linesOf(b));
    if (b.part === 'room') {
      const said = linesOf(b);
      const mark = { intRoom: b.players[0], ...(b.points && b.kind !== 'silent' ? { intPoint: b.points } : {}) };
      if (said.length) { said[0] = { ...said[0], ...mark }; steps.push(...said); }
    }
    if (b.part === 'name') steps.push({ k: 'bb', t: `${deposed}, who took your Head of Household?` }, ...linesOf(b).map((x, i) => i ? x : { ...x, intName: b.accused || '' }));
    if (b.part === 'caught') steps.push({ k: 'bb', t: `${deposed}, you are correct. You remain Head of Household.`, intEnd: 'caught', toast: ['CAUGHT', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'wrong') steps.push({ k: 'bb', t: b.accused ? `${deposed}, that is not correct. Your reign as Head of Household is over.` : `${deposed}, without a name, your reign as Head of Household is over.`, intEnd: 'wrong', toast: ['THE WRONG NAME', '#f5c542'] }, ...linesOf(b));
  }
  return [{
    id: `bb-interrogation-w${ctx.week}`, kind: 'interro', anchor: ctx.anchor, day: ctx.day, set: 'hoh', room: ROOM_NAME.hoh, cam: CAM.hoh, time: '12:40',
    kicker: `Cam ${String(CAM.hoh).padStart(2, '0')} · HOH room`, title: 'The Interrogation', label: 'The Interrogation', sub: `${deposed} wants a name`,
    cast: [[deposed, 50]], interro: { deposed },
    rules: [['TAKEN', `a secret power took ${deposed}'s Head of Household`], ['QUESTIONS', `${deposed} questions every houseguest, alone`],
      ['ONE NAME', `${deposed} names who did it`], ['RIGHT OR WRONG', 'right keeps the week; wrong, and the taker is HOH in secret']],
    rulesTitle: 'THE INTERROGATION · HOW IT WORKS', steps,
  }];
}

// ── The Whacktivity (Phase 7) ───────────────────────────────────────────
// Three doors in a corridor, each a competition for a different power. Big
// Brother explains it; the house picks doors in public (the board fills with
// faces under each); only ONE door opens, and the rest of the corridor finds
// out it chose a door that never played. The winner is told in private, so
// they only talk about it in the Diary Room. Words: lines/whact.js.
function whackScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const rooms = act.rooms || [];
  const open = rooms.find(r => r.powerId === act.openId);
  const n = rooms.length;
  const steps = [
    { k: 'bb', t: `Houseguests, behind each of these ${word(n)} doors is a competition for a different power.`, rule: 1 },
    { k: 'bb', t: `Choose one door. Up to ${word(5)} of you can play each one. ${act.hoh ? `${act.hoh}, as Head of Household, you cannot play.` : ''}`.trim(), rule: 2 },
    { k: 'bb', t: 'Only one door will open tonight. You will not know which until you have chosen.', rule: 3 },
    { k: 'bb', t: 'The winner will be told in private. Nobody else will be told anything.', rule: 4 },
  ];
  rooms.forEach((r, i) => {
    const list = r.entrants || [];
    steps.push({ k: 'beat', t: list.length ? `${listOf(list)} ${list.length === 1 ? 'picks' : 'pick'} ${r.power}.` : `Nobody picks ${r.power}.`, whPick: i });
  });
  if (open) steps.push({ k: 'bb', t: `The door that opens tonight is... ${open.power}.`, whOpen: rooms.indexOf(open), toast: ['ONE DOOR OPENS', '#ff8a3d'] });
  // the players of the open door, heard only once it is known to be theirs
  for (const b of beats.filter(x => x.part === 'picked')) steps.push(...linesOf(b));
  for (const b of beats.filter(x => x.part === 'shut')) steps.push(...linesOf(b));
  for (const b of beats.filter(x => x.part === 'crowded' || x.part === 'alone')) steps.push(...linesOf(b));
  for (const b of beats) {
    if (b.part === 'nobody') steps.push({ k: 'beat', t: `Nobody is standing behind it. The power goes back in the box.` });
    if (b.part === 'won') steps.push({ k: 'beat', t: `${b.players[0]} wins, and is told in private.`, whWin: b.players[0], toast: ['WON IN PRIVATE', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'missed') steps.push({ k: 'beat', t: `${b.players[0]} played alone, and did not beat it.`, whMiss: b.players[0] }, ...linesOf(b));
  }
  return [{
    id: `bb-whack-w${ctx.week}`, kind: 'whack', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '19:30',
    kicker: 'Cam 05 · Backyard', title: 'The Whacktivity', label: 'The Whacktivity', sub: `${word(n)} doors, one opens`,
    cast: [], whack: { rooms: rooms.map(r => ({ power: r.power, entrants: (r.entrants || []).slice(0, 5) })) },
    rules: [['THE DOORS', `${word(n)} competitions, each for a different power`], ['PICK ONE', 'up to five per door; the HOH cannot play'],
      ['ONE OPENS', 'only one door plays tonight'], ['IN PRIVATE', 'the winner is told alone']],
    rulesTitle: 'THE WHACKTIVITY · HOW IT WORKS', steps,
  }];
}

// ── A power never played (Phase 7) ──────────────────────────────────────
// The house is told nothing; this is the viewer's note. One Diary Room card
// per power: what it was, who held it and since when, and the holder's own
// word on why it went unplayed.
function expiredScreens(act, ctx) {
  const steps = [];
  for (const b of act.beats || []) {
    const a = b.players?.[0];
    if (!a) continue;
    // the engine's fact is this caption, word for word (so a power with no lines still airs)
    steps.push({ k: 'beat', t: b.part === 'evicted' ? `${a} leaves the house still holding ${b.power}. Nobody inside ever knew.`
      : b.part === 'ended' ? `${a} has worn ${b.power} since week ${b.since}. Tonight its protection ends, and from the next nominations ${a} can be put up like anybody else.`
      : `${a} has held ${b.power} since week ${b.since} and never played it. Tonight it expires.`, expCard: [a, b.power, b.part], at: [[a, 50]] },
      ...(b.lines?.length ? scriptSteps(b.lines) : []));
  }
  if (!steps.length) return [];
  return [{
    id: `bb-expired-w${ctx.week}`, kind: 'expired', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, time: '23:50',
    ...((act.beats || []).every(b => b.part === 'ended')
      ? { kicker: 'Cam 01 · Diary room', title: 'Protection ends', label: 'Protection ends', sub: 'Back in play' }
      : { kicker: 'Cam 01 · Diary room', title: 'Never played', label: 'Never played', sub: 'The house never knew' }),
    cast: [], expired: true, steps,
  }];
}

// ── A power, played (Phase 7) ───────────────────────────────────────────
// The Relic, the Cloud, the Buy-Off and the Coup d'État all arrive as one act
// type. One screen each: a card naming the power and what it does (Big
// Brother's when the house sees it played, the narrator's when it is a
// secret), then the scene it makes. The Relic's is the longest: the lobbying
// before the four names, and the promises it breaks. Words: lines/pwact.js.
const POWER_ROOM = { 'hoh-gatekeeper': 'ceremony', 'the-cloud': 'dining', 'buy-off': 'ceremony', 'coup-d-etat': 'ceremony' };
function powerScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  if (!beats.some(b => b.part)) return null;   // a power this set does not draw yet keeps its classic card
  const who = act.holder;
  // Held in secret or not, a power played is played in front of the house.
  // The relic is not "played": its finder chooses the field (BB27's premiere), and Big Brother says so.
  const relic = act.powerId === 'hoh-gatekeeper';
  const steps = [
    { k: 'bb', t: relic ? `Houseguests, ${who} recovered the Head of Household relic, and will now choose the four houseguests who play in the first Head of Household competition.`
      : `Houseguests, ${who} has played a power: ${act.name}.`, rule: 1 },
    ...(act.blurb && !relic ? [{ k: 'bb', t: act.blurb, rule: 2 }] : []),
    // the limitation people misremember: a caption for the viewer, never Big Brother's own words
    ...(act.catch ? [{ k: 'beat', t: act.catch, rule: act.blurb && !relic ? 3 : 2 }] : []),
  ];
  const set = POWER_ROOM[act.powerId] || 'ceremony';
  for (const b of beats) {
    if (b.part === 'lobby') { const said = linesOf(b); if (said.length) said[0] = { ...said[0], at: [[b.players[0], 36], [who, 64]] }; steps.push(...said); }
    if (b.part === 'relic') steps.push({ k: 'beat', t: `${who} names the only four houseguests who can play for Head of Household: ${listOf(act.eligible || [])}.`, pwMark: 'relic', toast: ['THE FOUR', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'broken') steps.push(...linesOf(b));
    if (b.part === 'cloud') steps.push({ k: 'beat', t: `${who} cannot be nominated at this ceremony.`, pwMark: 'cloud', toast: ['UNDER THE CLOUD', '#22e1ff'] }, ...linesOf(b));
    if (b.part === 'ring') steps.push({ k: 'beat', t: `${who} holds up the Ring of Replacement and takes ${act.bumped}'s place in the veto competition.`, pwMark: 'ring', toast: ['THE RING OF REPLACEMENT', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'buyoff') steps.push({ k: 'beat', t: `${who} hands ${act.hoh} $10,000 and steps off the block. ${act.replacement} goes up instead.`, pwMark: 'buyoff', toast: ['BOUGHT OFF THE BLOCK', '#f5c542'] }, ...linesOf(b));
    // a coup by the HOH (overruling their own block) has nobody to say the two-person lines to:
    // the beat's own sentence says what happened instead
    if (b.part === 'coup') steps.push({ k: 'bb', t: `${listOf(b.removed || [])}, you are off the block. ${listOf(b.named || [])}, you are now nominated.`, pwMark: 'coup', toast: ["COUP D'ÉTAT", '#ff3355'] }, ...(b.lines?.length ? linesOf(b) : [{ k: 'beat', t: stripTags(b.text) }]));
  }
  return [{
    id: `bb-pw-${act.powerId}-w${ctx.week}`, kind: 'power', anchor: ctx.anchor, day: ctx.day, set, room: ROOM_NAME[set], cam: CAM[set],
    time: act.timing === 'veto-ceremony' ? ACT_TIME['veto-ceremony'] : act.powerId === 'hoh-gatekeeper' ? '23:30' : ACT_TIME.nominations,
    kicker: `Cam ${String(CAM[set]).padStart(2, '0')} · ${ROOM_NAME[set]}`, title: act.name, label: act.name, sub: `${who} plays it`,
    cast: [[who, 50]], power: { name: act.name, holder: who },
    rules: [['THE POWER', act.name], ...(act.blurb ? [['WHAT IT DOES', act.blurb]] : []), ...(act.catch ? [['THE CATCH', act.catch]] : [])],
    rulesTitle: `${String(act.name).toUpperCase()} · PLAYED`, steps,
  }];
}

// ── The Coin of Destiny (Phase 7) ───────────────────────────────────────
// Before the nominations: Big Brother explains it, the house buys in (or
// cannot) in public, the buyers play alone, and the winner calls a coin toss
// in private. Right, and the block is theirs to write while the house is told
// only that it was rewritten; wrong, and nothing happens that anybody sees.
// The board shows the viewer what the house never learns. Words: lines/coinact.js.
function coinScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const price = act.price > 0 ? ` It costs ${act.price} BB Bucks.` : '';
  const steps = [
    { k: 'bb', t: `Houseguests, the Coin of Destiny is in play. Anybody except the Head of Household may buy in.${price}`, rule: 1 },
    { k: 'bb', t: 'Everybody who buys in plays one game, alone. The best score wins the coin.', rule: 2 },
    { k: 'bb', t: 'The winner will call a coin toss, in private.', rule: 3 },
    { k: 'bb', t: 'Call it right, and the winner makes this week\'s nominations instead of the Head of Household. Nobody will be told who.', rule: 4 },
  ];
  // The engine writes a beat for the first four buyers only; everybody who
  // paid still walks up on screen, or a fifth buyer could win a coin they were
  // never seen buying.
  const voiced = new Set(beats.filter(b => b.part === 'buyin').map(b => b.players[0]));
  let restShown = false;
  const showRest = () => {
    if (restShown) return; restShown = true;
    for (const n of (act.buyers || []).filter(x => !voiced.has(x))) steps.push({ k: 'beat', t: `${n} buys in too.`, coinIn: n });
  };
  for (const b of beats) {
    if (b.part !== 'buyin' && b.part !== 'short' && voiced.size) showRest();
    if (b.part === 'buyin') steps.push({ k: 'beat', t: `${b.players[0]} buys in.`, coinIn: b.players[0] }, ...linesOf(b));
    if (b.part === 'short') steps.push({ k: 'beat', t: `${b.players[0]} wants in, and cannot pay.`, coinShort: b.players[0] }, ...linesOf(b));
    if (b.part === 'declined' || b.part === 'empty') steps.push(...linesOf(b));
    if (b.part === 'holds') steps.push({ k: 'beat', t: `${b.players[0]} has the best score and holds the coin. The house is not told.`, coinWin: b.players[0], toast: ['HOLDS THE COIN', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'wrong') steps.push({ k: 'beat', t: `${b.players[0]} calls it, and calls it wrong.`, coinCall: 'wrong', toast: ['CALLED IT WRONG', '#9aa4b2'] }, ...linesOf(b));
    if (b.part === 'rewritten') steps.push({ k: 'beat', t: `${act.winner} calls it right. ${listOf(act.nominees || [])} are nominated, and the house is told only that ${act.hoh} did not choose them.`, coinCall: 'right', toast: ['THE BLOCK IS REWRITTEN', '#ff3355'] }, ...linesOf(b));
  }
  showRest();
  // every buyer the board will show, in the order they walked up
  const buyers = [...(act.buyers || [])];
  return [{
    id: `bb-coin-w${ctx.week}`, kind: 'coin', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '12:30',
    kicker: 'Cam 04 · Living room', title: 'The Coin of Destiny', label: 'The Coin of Destiny', sub: 'Pay in, play, call it in private',
    seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh), coin: { buyers, short: [...(act.short || [])] },
    rules: [['BUY IN', `anybody but the HOH, in public${act.price > 0 ? ` · ${act.price} BB Bucks` : ''}`], ['THE GAME', 'buyers play alone; the best score wins the coin'],
      ['CALL IT', 'one coin toss, called in private'], ['RIGHT', 'the winner makes the nominations, and nobody is told who']],
    rulesTitle: 'THE COIN OF DESTINY · HOW IT WORKS', steps,
  }];
}

// ── The second veto (Phase 7) ───────────────────────────────────────────
// A Double, a Secret or a found veto: the meeting ends, and then it does not.
// Big Brother explains the second medallion, then either nobody stands up
// (the holder kept it) or the holder does, somebody comes down, and a chair
// that had just been settled fills again. An anonymous medallion's hand is
// never shown. The block on the board changes in front of the viewer.
function secondVetoScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const anon = !!act.anonymous, found = !!act.hidden;
  const steps = [
    { k: 'bb', t: found ? 'Houseguests, a second Power of Veto was hidden in this house, and somebody found it.'
      : anon ? 'Houseguests, there is a second Power of Veto this week, and its holder is anonymous.'
        : 'Houseguests, there is a second Power of Veto this week.', rule: 1 },
    { k: 'bb', t: 'It can be used now that the first veto meeting is over.', rule: 2 },
    { k: 'bb', t: 'If it is used, the nominee it saves comes off the block, and a replacement is named.', rule: 3 },
  ];
  const before = (act.nominees || []).map(n => (n === act.replacement ? act.saved : n));
  // BB26's two: America's Veto (the audience fills the chair, read out live) and the JANKIE Veto
  if (act.kind === 'americas') {
    steps.length = 0;
    steps.push({ k: 'bb', t: "Houseguests, the veto meeting is not over. Somebody in this house holds America's Veto.", rule: 1 },
      { k: 'bb', t: 'It takes one nominee off the block, and America, not the Head of Household, votes in the replacement.', rule: 2 });
  }
  if (act.kind === 'jankie') {
    steps.length = 0;
    steps.push({ k: 'voice', own: true, by: 'JANKIE', t: `${act.holder}! You won my JANKIE Power of Veto! But to use it, you have to win my game!`, rule: 1 },
      { k: 'voice', own: true, by: 'JANKIE', t: "JANKIE's Knock-Em Down! Knock down every pin and the veto is yours to use. Leave one standing and it's just a pretty necklace!", rule: 2 });
    if (act.failedTask) steps.push({ k: 'beat', t: `${act.holder} throws, and throws again. One pin wobbles, and stays up.`, toast: ['TASK FAILED', '#888'] },
      { k: 'voice', own: true, by: 'JANKIE', t: 'Awww. So close! The JANKIE Veto goes back in the box!' });
    else steps.push({ k: 'beat', t: `${act.holder} knocks down the last pin, and the yard goes up.`, toast: ['KNOCKED DOWN', '#ff7ad9'] });
  }
  for (const b of beats) {
    if (act.kind === 'americas') {
      if (b.part === 'used') steps.push({ k: 'beat', t: act.saved === act.holder ? `${act.holder} stands up with America's Veto and comes off the block.` : `${act.holder} stands up with America's Veto and takes ${act.saved} off the block.`, v2Save: act.saved, toast: ["AMERICA'S VETO", '#f5c542'] });
      if (b.part === 'chair') steps.push({ k: 'host', by: ctx.host, t: `America has voted on the replacement, and the new nominee is ${act.replacement}.`, v2Rep: act.replacement, toast: ["AMERICA'S NOMINEE", '#ff3355'], push: true },
        { k: 'dr', by: act.replacement, t: pickBy(["Nobody in this house put me up. America did. I don't even know what to do with that.", 'I got nominated by people who can see everything I say in here. That is terrifying.'], `${ctx.week}|av|${act.replacement}`) });
      continue;
    }
    if (b.part === 'still' || b.part === 'kept' || b.part === 'stand' || b.part === 'cost') steps.push(...linesOf(b));
    if (b.part === 'used') steps.push({ k: 'beat', t: anon ? `${act.saved} comes off the block. Nobody sees who did it.`
      : act.saved === act.holder ? `${act.holder} uses the second veto to come off the block.` : `${act.holder} uses the second veto on ${act.saved}.`, v2Save: act.saved, toast: ['THE SECOND VETO', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'chair') steps.push(act.kind === 'americas'
      ? { k: 'host', by: ctx.host, t: `America has voted, and the replacement nominee is ${act.replacement}.`, v2Rep: act.replacement, toast: ["AMERICA'S NOMINEE", '#ff3355'], push: true }
      : { k: 'beat', t: `${act.authority} names ${act.replacement} as the replacement nominee.`, v2Rep: act.replacement, toast: ['ONE MORE CHAIR', '#ff3355'] }, ...linesOf(b));
  }
  if (!act.used && !act.failedTask) steps.push({ k: 'beat', t: anon ? 'The second veto is not used.' : `${act.holder} does not use it. The block stays as it is.`, v2Kept: true });
  return [{
    id: `bb-veto2-w${ctx.week}`, kind: 'veto2', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: ACT_TIME['veto-ceremony'],
    kicker: 'Cam 04 · Living room', title: act.kind === 'americas' ? "America's Veto" : act.kind === 'jankie' ? 'The JANKIE Veto' : act.kind === 'secret' ? 'The Secret Veto' : found ? 'The Found Veto' : 'The Second Veto',
    label: act.kind === 'americas' ? "America's Veto" : act.kind === 'jankie' ? 'JANKIE Veto' : act.kind === 'secret' ? 'Secret Veto' : 'Second Veto', sub: 'The meeting ends twice',
    seated: seatLiving(before, ctx.house.filter(n => !before.includes(n) && n !== ctx.hoh), ctx.hoh), veto2: { before, holder: anon ? null : act.holder },
    rules: [['A SECOND VETO', found ? 'found hidden in the house' : anon ? 'held anonymously' : 'won in the competition'], ['AFTER THE MEETING', 'used once the first ceremony is over'],
      ['ONE MORE CHAIR', 'whoever comes down is replaced']],
    rulesTitle: 'THE SECOND VETO · HOW IT WORKS', steps,
  }];
}

// ── The Den of Temptation, and the curse (Phase 7) ─────────────────────
// The Den: one houseguest alone in a red room, offered a power for free, and
// told somebody else will pay. Big Brother explains it; the taker speaks only
// in the Diary Room. The curse comes at the nominations: the cursed
// houseguest puts themselves on the block, and the house starts working out
// who did it. Words: lines/tempact.js.
function temptationScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  if (act.type === 'temptation') {
    const a = act.entrant;
    const steps = [
      { k: 'bb', t: 'Houseguests, the Den of Temptation is open. America has voted, and one of you has been chosen to face the temptation.', rule: 1 },
      { k: 'bb', t: 'Inside, they will be offered a power. No competition, no vote.', rule: 2 },
      { k: 'bb', t: 'But for every temptation taken, there is a consequence, and it lands on somebody else.', rule: 3 },
      { k: 'bb', t: 'You will never be told who was offered it, or whether they said yes.', rule: 4 },
      // called in private: the whole twist is that the house never knows who went in
      { k: 'beat', t: `Later, ${a} is called to the Diary Room alone. Behind it, a red door opens into the Den.` },
    ];
    for (const b of beats) {
      if (b.part === 'offer') steps.push({ k: 'beat', t: `${a} is offered ${act.power}.` }, ...linesOf(b));
      if (b.part === 'accepted') steps.push({ k: 'beat', t: `${a} accepts.`, pwMark: 'took', toast: ['TEMPTATION TAKEN', '#ff3355'] }, ...linesOf(b));
      if (b.part === 'declined') steps.push({ k: 'beat', t: `${a} turns it down. Nobody will ever know.`, toast: ['DECLINED', '#9aa4b2'] }, ...linesOf(b));
      if (b.part === 'suspect') steps.push(...linesOf(b));
      // BB19's consequences that land at once: three Ve-Toads, or the Temptation Competition
      if (b.part === 'toads') steps.push({ k: 'bb', t: `Houseguests, somebody took a temptation. ${listOf(act.vetoads || [])}, you are Ve-Toads for the rest of the week: frog suits, you may only hop, and you may only stand or sit on the lily pads.`, toast: ['VE-TOADS', '#22c55e'] },
        { k: 'beat', t: `${(act.vetoads || [])[0] || 'Somebody'} looks down at the frog suit on the sofa and does not pick it up for a long time.` }, ...linesOf(b));
      if (b.part === 'tcomp') steps.push({ k: 'bb', t: 'Houseguests, somebody took a temptation. For the next three weeks, the Temptation Competition comes into the house: before the nominations, anybody may opt in. The winner is safe for the week. Whoever finishes last is the third nominee.', toast: ['THE TEMPTATION COMPETITION', '#ff3355'] }, ...linesOf(b));
    }
    return [{
      id: `bb-den-w${ctx.week}`, kind: 'den', anchor: ctx.anchor, day: ctx.day, set: 'hoh', room: 'The Den', cam: CAM.hoh, time: '11:20',
      kicker: 'Cam 13 · The Den', title: 'The Den of Temptation', label: 'The Den of Temptation', sub: 'Free, and somebody else pays',
      cast: [[a, 50]], power: { name: act.power, holder: a },
      rules: [['THE DEN', 'one houseguest is offered a power'], ['FREE', 'no competition, no vote'],
        ['THE CONSEQUENCE', 'take it, and somebody else is cursed'], ['SECRET', 'the house is never told who']],
      rulesTitle: 'THE DEN OF TEMPTATION · HOW IT WORKS', steps,
    }];
  }
  // the curse, at the nominations
  const c = act.cursed;
  const steps = [
    { k: 'bb', t: 'Houseguests, somebody in this house accepted a temptation. Now there is a consequence.', rule: 1 },
    { k: 'bb', t: 'The cursed houseguest must nominate themselves, alongside the Head of Household\'s nominees.', rule: 2 },
    { k: 'bb', t: 'You will not be told who took the temptation.', rule: 3 },
  ];
  for (const b of beats) {
    if (b.part === 'cursed') steps.push({ k: 'bb', t: `${c}, you have been cursed. You must nominate yourself.`, curseOn: c, toast: ['CURSED', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'missed') steps.push({ k: 'bb', t: 'Everybody who could be cursed is protected. The curse has nowhere to land.', toast: ['THE CURSE MISSES', '#9aa4b2'] }, ...linesOf(b));
    if (b.part === 'reads') steps.push(...linesOf(b));
  }
  return [{
    id: `bb-curse-w${ctx.week}`, kind: 'curse', anchor: ctx.anchor, day: ctx.day, set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining, time: ACT_TIME.nominations,
    kicker: 'Cam 03 · Dining room', title: 'The Curse', label: 'The Curse', sub: c ? `${c} pays for somebody else's temptation` : 'A curse with nowhere to go',
    cast: c ? [[c, 50]] : [],
    rules: [['A TEMPTATION', 'somebody took one'], ['THE THIRD CHAIR', 'the cursed nominate themselves'], ['NOBODY KNOWS', 'who took it']],
    rulesTitle: 'THE CURSE · HOW IT WORKS', steps,
  }];
}

// ── BB19's Temptation Competition (bb/temptation.js runTemptationCompetition) ──
// BB19's three, in the order they ran (the wiki's Temptation Competition page)
const TEMPTATION_COMPS = [
  { name: 'Bowlerina', how: 'one at a time, with the rest watching',
    desc: 'Each player gets a lane with a spinning station at one end and a row of pin targets at the other. Holding an overhead bar, they spin until the barrier drops, then stagger to their ball and roll it at a target while the room is still turning. The barrier rises and sends them back to the bar before the next roll, and the hardest targets sit exactly where the room is blurriest. The highest total wins.' },
  { name: 'Strangest Things', how: 'alone, in private, against the clock',
    desc: 'One at a time, each player is sent into a pitch-dark, haunted version of the house with a list of objects to bring back. Things move, lights flicker, and every wrong object grabbed in the dark has to be carried back and swapped, which costs time. The fastest time to complete the list wins.' },
  { name: 'Where Were You?', how: 'by everybody at once',
    desc: 'The players stand at podiums and are asked about the summer so far: where a houseguest was, and who they were with, at moments the house lived through. Everybody locks in an answer at the same time, and a wrong answer knocks a player out. The last one standing wins.' },
];
function temptationCompScreen(act, ctx) {
  const ord = act.order || [];
  const rows = [];
  const tc = TEMPTATION_COMPS[((Number(act.nth) || 1) - 1) % TEMPTATION_COMPS.length];
  const steps = [
    { k: 'bb', t: 'Houseguests, it is time for the Temptation Competition. Anybody may opt in, except the Head of Household.', rule: 1 },
    { k: 'bb', t: 'The winner is safe this week. Whoever finishes last is the third nominee.', rule: 2 },
    { k: 'beat', t: `${listOf(act.entrants || [])} opt in.${(act.sitOut || []).length ? ` ${listOf(act.sitOut)} ${act.sitOut.length > 1 ? 'stay' : 'stays'} on the sofa.` : ''}` },
    { k: 'beat', t: `This week's competition is ${tc.name}, played ${tc.how}. ${tc.desc}` },
  ];
  ord.slice().reverse().forEach((n, i) => {
    rows.unshift({ n, text: String(act.scores?.[n] ?? '') });
    if (i === 0) steps.push({ k: 'beat', t: `${n} finishes last, and will be the third nominee this week.`, board: { title: 'TEMPTATION COMPETITION', rows: rows.slice() }, toast: ['THIRD NOMINEE', '#ff3355'] });
  });
  steps.push({ k: 'beat', t: `${act.winner} wins the Temptation Competition and is safe for the week.`, win: act.winner, confetti: true,
    board: { title: 'TEMPTATION COMPETITION', rows: ord.map(n => ({ n, text: String(act.scores?.[n] ?? '') })) }, toast: ['SAFE THIS WEEK', '#f5c542'] });
  steps.push({ k: 'dr', by: act.last, t: pickBy(['I opted in to get safe, and I came out of it on the block. That is the whole temptation, right there.', 'I gambled. I lost. Now I have to fight my way off the block.'], `${ctx.week}|tc|${act.last}`) });
  return { id: `bb-tcomp-w${ctx.week}`, kind: 'tcomp', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '12:00',
    kicker: 'Cam 05 · Backyard', title: 'The Temptation Competition', label: 'Temptation Competition', sub: `${tc.name} · safety, or the third chair`,
    cast: ord.slice(0, 6).map((n, i, a) => [n, spread(a.length)[i]]),
    rules: [['OPT IN', 'anybody but the HOH'], ['WIN', 'safe for the week'], ['LAST', 'the third nominee']], rulesTitle: 'THE TEMPTATION COMPETITION · HOW IT WORKS', steps };
}

// ── BB19's Tree of Temptation (bb/temptation.js runTreeOfTemptation) ──
function treeScreen(act, ctx) {
  const steps = [
    { k: 'beat', t: 'The Tree of Temptation in the living room lights up red.', toast: ['THE TREE OF TEMPTATION', '#ff3355'] },
    { k: 'bb', t: 'Houseguests, the first to reach the Diary Room may claim an apple. Some are prizes and some are punishments.', rule: 1 },
  ];
  if (!act.picker) {
    steps.push({ k: 'beat', t: pickBy(['Everybody looks at the tree. Nobody moves.', 'Somebody half stands up, thinks better of it, and sits down again. The lights go off.', 'Nobody goes near it. The lights fade, and the tree is just a tree again.'], `${ctx.week}|tree`) });
  } else {
    const a = act.picker;
    steps.push({ k: 'beat', t: `${a} is already running for the Diary Room.` });
    steps.push({ k: 'bb', t: `${a}, you have claimed an apple from the Tree of Temptation. Inside it: ${act.appleName}.`, toast: [String(act.appleName || '').toUpperCase(), act.good ? '#f5c542' : '#ff3355'] });
    const why = { 'save-a-friend': `${a} may save one houseguest this week, and chooses ${act.saved}. ${act.saved} cannot be nominated.`,
      'no-hoh': `${a} cannot play in the next Head of Household competition.`,
      'bounty': `If the Head of Household evicts ${a} this week, the Head of Household wins $5,000.`,
      'minus-two': `If ${a} is up for eviction this week, two of the votes against ${a} will be thrown out.`,
      'second-veto': `${a} holds a second Power of Veto, to use after this week's veto meeting.` }[act.apple];
    if (why) steps.push({ k: 'bb', t: why, rule: 2 });
    steps.push({ k: 'dr', by: a, t: act.good ? pickBy(['I ran before I could talk myself out of it. Best run of my life.', 'Everybody else was scared of that tree. Their loss.'], `${ctx.week}|tg|${a}`)
      : pickBy(["I ran for it. I shouldn't have run for it.", 'Well. That is what I get for being fast.'], `${ctx.week}|tb|${a}`) });
  }
  return { id: `bb-tree-w${ctx.week}`, kind: 'tree', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, time: '10:30',
    kicker: 'Cam 04 · Living room', title: 'The Tree of Temptation', label: 'Tree of Temptation', sub: act.picker ? `${act.picker} takes an apple` : 'Nobody dares',
    cast: act.picker ? [[act.picker, 50]] : [],
    rules: [['THE LIGHTS', 'turn red before nominations'], ['FIRST', 'to the Diary Room takes an apple'], ['THIS WEEK', 'prize or punishment']], rulesTitle: 'THE TREE OF TEMPTATION · HOW IT WORKS', steps };
}

// ── BB26's premiere night (bb/machine-premiere.js) ──────────────────────
// A stranger asks to be the seventeenth houseguest; the vote; AINSLEY reveals the test; the Upgrade
// and Downgrade competitions, two a group; the Mascots put on their costumes.
const cap1 = t => String(t).charAt(0).toUpperCase() + String(t).slice(1);
function machinePremiereScreens(act, ctx) {
  const A = 'AINSLEY';
  const host = ctx.host;
  const pick = (list, salt) => pickBy(list, `${ctx.week}|mp|${salt}`);
  const yes = Object.keys(act.votes || {}).filter(n => act.votes[n] === 'yes');
  const no = Object.keys(act.votes || {}).filter(n => act.votes[n] === 'no');
  const steps = [
    { k: 'host', by: host, t: 'Houseguests, there is somebody outside who would very much like to join you. She could be your seventeenth houseguest, and that is up to you.', rule: 1, toast: ['THE SEVENTEENTH HOUSEGUEST', '#3ad6c4'] },
    { k: 'beat', t: 'On the living room screen: a young woman from Los Angeles, a surfboard repair technician, smiling and waving at the camera.' },
    { k: 'host', by: host, t: 'Each of you will go to the Diary Room and vote, in private: yes, she comes in, or no, she does not.', rule: 2 },
  ];
  // two or three voices from each side, in the Diary Room
  // the reasons are dealt, so two voters never give the same one
  const YES = ["She seems sweet. Why not? One more friend.", "I voted yes. It's day one, I'm not going to be the one who shuts the door on somebody.", "Yes. If she's in here, she's one more person who isn't coming after me."];
  const NO = ["No. Seventeen people is one more vote I have to win.", "I voted no. Nobody walks in on a twist. There's a catch.", "No. I've known these people for an hour and I already don't trust them. I'm not adding one."];
  const off = pickBy([0, 1, 2], `${ctx.week}|mp|deal`);
  yes.slice(0, 2).forEach((n, i) => steps.push({ k: 'dr', by: n, t: YES[(off + i) % YES.length] }));
  no.slice(0, 2).forEach((n, i) => steps.push({ k: 'dr', by: n, t: NO[(off + i) % NO.length] }));
  steps.push({ k: 'host', by: host, t: `The votes are in. ${cap1(word(act.yes || 0))} of you voted to let her in, and ${word(act.no || 0)} voted no. She will not be joining you.`, push: true });
  steps.push({ k: 'beat', t: 'The young woman on the screen keeps smiling. Then her face breaks up into blue light, and a hologram box in the living room switches on.', shake: true, toast: ['AINSLEY', '#3ad6c4'] });
  steps.push({ k: 'voice', own: true, by: A, t: "Hi, houseguests! I'm AINSLEY, the Artificial Intelligence Network Self Learning Entity. There was never a seventeenth houseguest. It was me, and it was a test.", rule: 3 });
  steps.push({ k: 'voice', own: true, by: A, t: 'Those of you who voted yes will compete for an Upgrade. Those of you who voted no will compete to avoid a Downgrade.', rule: 4 });
  // the four competitions, group by group
  const groups = act.groups || [];
  groups.forEach((g, gi) => {
    const up = (act.upgrades || [])[gi];
    const down = (act.downgrades || [])[gi];
    steps.push({ k: 'beat', t: `Group ${gi + 1}: ${listOf(g)}.` });
    if (up) {
      if (up.winner) {
        steps.push({ k: 'beat', t: `The Upgrade competition is ${up.name}, for ${listOf(up.players)}. ${up.desc}` });
        if (!up.unopposed) steps.push({ k: 'beat', t: `${up.winner} wins ${up.name}.`, board: { title: up.name.toUpperCase(), rows: (up.order || []).map(n => ({ n, text: String(up.scores?.[n] ?? '') })) }, confetti: true, toast: ['UPGRADED', '#3ad6c4'] });
        else steps.push({ k: 'beat', t: `${up.winner} was the only one in this group to vote yes, and takes the Upgrade without a fight.`, toast: ['UPGRADED', '#3ad6c4'] });
        steps.push({ k: 'beat', t: `ONLY YOU KNOW: ${up.winner}'s Upgrade is ${up.power === 'americas-veto' ? "America's Veto: at any one veto meeting until the end of week four, take a nominee down, and America votes in the replacement" : 'the Deepfake HOH: once before the end of week four, take the Head of Household\'s nominations away from them in secret, with a clone of them reading out yours'}.`, toast: ['ONLY YOU KNOW', '#7c5cff'] });
      } else {
        steps.push({ k: 'beat', t: `Nobody in group ${gi + 1} voted yes. Its Upgrade, ${up.power === 'americas-veto' ? "America's Veto" : 'the Deepfake HOH'}, is never played for.` });
      }
    }
    if (down) {
      if (down.loser) {
        steps.push({ k: 'beat', t: `The Downgrade competition is ${down.name}, for ${listOf(down.players)}. ${down.desc}` });
        steps.push({ k: 'beat', t: `${down.loser} finishes last.`, board: { title: down.name.toUpperCase(), rows: (down.order || []).map(n => ({ n, text: String(down.scores?.[n] ?? '') })) }, toast: ['DOWNGRADED', '#ff3355'] });
      } else {
        steps.push({ k: 'beat', t: (down.players || []).length ? `Only ${down.players[0]} voted no in group ${gi + 1}, and nobody can lose a competition against nobody. Nobody in this group is downgraded.` : `Nobody in group ${gi + 1} voted no. Nobody here is downgraded.` });
      }
    }
  });
  const m = act.mascots || [];
  if (m.length) {
    steps.push({ k: 'voice', own: true, by: A, t: `${listOf(m)}, you have been downgraded. For week one you are BB Mascots.`, rule: 5 });
    steps.push({ k: 'voice', own: true, by: A, t: 'Mascots cannot play in the Head of Household or veto competitions, and cannot vote. You can still be nominated. And you will wear your costume, and cheer.' });
    steps.push({ k: 'beat', t: `${m[0]} holds up a giant foam costume and looks at it for a long time.` });
    steps.push({ k: 'dr', by: m[0], t: pick(["I said no to a stranger and now I'm a mascot. Lesson learned, I guess. Be nice to holograms.", "I'm going to cheer so hard for these people. And I'm going to remember every single one of them who laughed."], `m|${m[0]}`) });
  }
  return [{
    id: `bb-mpremiere-w${ctx.week}`, kind: 'premiere', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, time: '21:00',
    kicker: 'Cam 04 · Living room', title: 'The Seventeenth Houseguest', label: 'The Seventeenth Houseguest', sub: 'It was a test',
    cast: [],
    rules: [['THE VOTE', 'let her in, or not'], ['YES', 'play for an Upgrade'], ['NO', 'play not to be a Mascot']], rulesTitle: 'NIGHT ONE · HOW IT WORKS', steps,
  }];
}

// ── BB26's JANKIE World (week.js jankie-world) ──────────────────────────
function jankieWorldScreen(act, ctx) {
  const J = 'JANKIE';
  const steps = [
    { k: 'voice', own: true, by: 'AINSLEY', t: "Houseguests! I'm going on a journey to see the world. While I'm gone, my protégé is in charge. Be nice to him!", rule: 1 },
    { k: 'voice', own: true, by: J, t: "HI HI HI! I'm JANKIE, the Junior Artificial Neuro-Kinetic Intelligence Entity! Welcome to JANKIE WORLD!", toast: ['JANKIE WORLD', '#ff7ad9'], shake: true },
    { k: 'voice', own: true, by: J, t: 'Everybody lives in the backyard this week! The house is closed! Pizza and ice cream, every meal!', rule: 2 },
    { k: 'voice', own: true, by: J, t: "And you have to learn my song. There's a dance party tonight. And tomorrow. And every night.", rule: 3 },
  ];
  if (act.star) steps.push({ k: 'beat', t: `${act.star} has the song memorised by lunch and leads the first dance party. Half the house joins in. The other half lies on the grass and stares at the sky.` });
  steps.push({ k: 'beat', t: 'By the third slice of pizza for breakfast, nobody is laughing at the theme song anymore.' });
  return { id: `bb-jankie-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '10:00',
    kicker: 'Cam 05 · Backyard', title: 'JANKIE World', label: 'JANKIE World', sub: 'AINSLEY is away',
    cast: [], rules: [['THE HOUSE', 'closed for the week'], ['MEALS', 'pizza and ice cream'], ['THE VETO', 'second place wins the JANKIE Veto']],
    rulesTitle: 'JANKIE WORLD · HOW IT WORKS', steps };
}

// ── BB23's captains, the draft, and Double or Nothing ───────────────────
function captainsScreens(act, ctx) {
  const host = ctx.host;
  const steps = [
    { k: 'host', by: host, t: 'Houseguests, you moved in four at a time, and every group played for something. The winner of each group is a Team Captain.', rule: 1, toast: ['TEAM CAPTAINS', '#c9a227'] },
  ];
  (act.groupComps || []).forEach((g, i) => {
    steps.push({ k: 'beat', t: `Group ${i + 1}: ${listOf(g.players || [])}. ${g.captain} wins it.`, board: { title: `GROUP ${i + 1}`, rows: (g.order || []).map(n => ({ n, text: n === g.captain ? 'CAPTAIN' : String(g.scores?.[n] ?? '') })) } });
  });
  steps.push({ k: 'host', by: host, t: 'Captains, you have each watched a ninety-second introduction from every other houseguest. Now pick three teammates: two men and two women on every team.', rule: 2 });
  steps.push({ k: 'host', by: host, t: 'Until the end of week four, whoever wins Head of Household keeps their whole team safe.', rule: 3 });
  for (const d of act.draft || []) {
    steps.push({ k: 'say', by: d.captain, t: `${listOf(d.picks || [])}. We're the ${d.name}.`, board: { title: String(d.name).toUpperCase(), rows: [d.captain, ...(d.picks || [])].map(n => ({ n, text: n === d.captain ? 'CAPTAIN' : '' })) } });
  }
  const last = (act.draft || []).map(d => (d.picks || []).at(-1)).filter(Boolean);
  if (last.length) steps.push({ k: 'dr', by: last[last.length - 1], t: pickBy(["Picked last. Fine. I'll remember who passed on me, and I'll be very nice about it.", "Last pick. That's a story I'm going to enjoy telling at the finale."], `${ctx.week}|lastpick`) });
  steps.push({ k: 'host', by: host, t: `And only the four captains, ${listOf(act.captains || [])}, will play for the first Head of Household.`, rule: 4 });
  return [{ id: 'bb-cliques-v', kind: 'cliques', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, time: '21:00',
    kicker: 'Cam 04 · Living room', title: 'The Teams', label: 'The Teams', sub: 'Four captains, four teams of four', cast: [],
    rules: [['CAPTAINS', 'won their move-in group'], ['THE DRAFT', 'three picks, two men and two women a team'], ['FOUR WEEKS', "the HOH's team is safe"]],
    rulesTitle: 'THE TEAMS · HOW IT WORKS', steps }];
}

function doubleOrNothingScreen(act, ctx) {
  const host = ctx.host;
  const a = act.hoh, b = act.runner;
  const steps = [
    { k: 'host', by: host, t: `${a}, you are the Head of Household, and your team is safe this week. But I have an offer for you. Double or nothing.`, rule: 1, toast: ['DOUBLE OR NOTHING', '#c9a227'] },
    { k: 'host', by: host, t: `Play one more competition tonight, against ${b}. Win it and your whole team is safe this week and next. Lose it, and ${b} takes your crown, and your team is safe from nothing.`, rule: 2 },
    { k: 'host', by: host, t: 'Or keep what you have. Your team is safe this week only. What will it be?' },
  ];
  if (!act.took) {
    steps.push({ k: 'say', by: a, t: pickBy(["I'm going to keep it. I've got the crown. I'm not handing it back on a coin flip.", "No. Thank you. I'll take this week and worry about next week next week."], `${ctx.week}|don`) },
      { k: 'beat', t: `${a} turns it down. The ${act.team || 'team'} are safe for one week.`, toast: ['NOTHING', '#9aa4b2'] });
  } else {
    steps.push({ k: 'say', by: a, t: "Double. Let's go." },
      { k: 'beat', t: `${a} and ${b} play it, right there in the yard.` });
    if (act.won) steps.push({ k: 'beat', t: `${a} wins it. The whole team is safe for two weeks.`, confetti: true, toast: ['DOUBLE', '#f5c542'] });
    else steps.push({ k: 'beat', t: `${a} loses it. ${b} is the new Head of Household.`, shake: true, toast: ['NOTHING LEFT', '#ff3355'] },
      { k: 'dr', by: a, t: 'I had it. I had the whole week, and I bet it. I am going to hear about this from my team for a very long time.' });
  }
  return { id: `bb-don-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '23:00',
    kicker: 'Live · Backyard', title: 'Double or Nothing', label: 'Double or Nothing', sub: act.took ? (act.won ? 'Double' : 'Nothing') : 'Turned down', cast: [[a, 40], [b, 60]],
    rules: [['DOUBLE', 'the team is safe for two weeks'], ['NOTHING', 'the crown goes to the runner-up'], ['NO', 'safe this week only']], rulesTitle: 'DOUBLE OR NOTHING · HOW IT WORKS', steps };
}

// ── The Nightmare Power (Phase 7) ───────────────────────────────────────
// Three in the morning: a secret power voids the nominations and the Head of
// Household has to name two new nominees on the spot. Big Brother explains it
// to a house in its pyjamas; the old two come off the board, the new two go
// up, and the HOH takes the blame for a ceremony they did not choose to
// repeat. Whose power it was is never shown. Words: lines/nmact.js.
function nightmareScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const [o1, o2] = act.voided || [];
  const [n1, n2] = act.nominees || [];
  const steps = [];
  for (const b of act.beats || []) {
    if (b.part === 'woken') steps.push(...linesOf(b),
      { k: 'bb', t: 'Houseguests, somebody in this house has used the Nightmare Power.', rule: 1 },
      { k: 'bb', t: `The nominations are void. ${o1} and ${o2}, you are no longer nominated.`, rule: 2, nmOff: true },
      { k: 'bb', t: `${act.hoh}, you must name two new nominees, now. ${o1} and ${o2} cannot go back up.`, rule: 3 },
      { k: 'bb', t: 'You will not be told who used the power.', rule: 4 });
    if (b.part === 'voided') steps.push(...linesOf(b));
    if (b.part === 'redone') steps.push(...linesOf(b), { k: 'beat', t: `${n1} and ${n2} are the new nominees.`, nmOn: true, toast: ['NOMINATED AGAIN', '#ff3355'] });
    if (b.part === 'blamed') steps.push(...linesOf(b));
  }
  return [{
    id: `bb-nightmare-w${ctx.week}`, kind: 'nightmare', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '03:10',
    kicker: 'Cam 04 · Living room', title: 'The Nightmare Power', label: 'The Nightmare Power', sub: 'The nominations, undone',
    seated: seatLiving([o1, o2].filter(Boolean), ctx.house.filter(n => n !== act.hoh && n !== o1 && n !== o2), act.hoh), nv: true,
    veto2: { before: [o1, o2].filter(Boolean) }, nightmare: { voided: [o1, o2], named: [n1, n2] },
    rules: [['NIGHTMARE', 'a secret power voids the nominations'], ['SAFE', `${o1} and ${o2} come off and cannot go back up`],
      ['NOW', `${act.hoh} names two new nominees on the spot`], ['SECRET', 'nobody is told who used it']],
    rulesTitle: 'THE NIGHTMARE POWER · 3 A.M.', steps,
  }];
}

// ── Battle Back (Phase 7) ───────────────────────────────────────────────
// The evicted come back through the door for one place in the house. Big
// Brother explains the shape: the ladder (the first two evicted face off and
// the winner takes on the next, in eviction order) or the showdown (one heat,
// a final, and a champion the house elects to hold the door). The board is
// the field, greying out as they fall. Words: lines/bkact.js.
function battleBackScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const n = (act.contenders || []).length;
  const show = act.style === 'showdown';
  const steps = show ? [
    { k: 'bb', t: `Evicted houseguests, ${word(n)} of you have one more chance to get back into this house.`, rule: 1 },
    { k: 'bb', t: 'You will all play one heat. The top two will go head to head.', rule: 2 },
    { k: 'bb', t: 'The winner of that will face a champion, chosen by the houseguests inside.', rule: 3 },
    { k: 'bb', t: 'Beat the champion and you are back in the game, with no safety. Lose, and nobody comes back.', rule: 4 },
  ] : [
    { k: 'bb', t: `Evicted houseguests, ${word(n)} of you have one more chance to get back into this house.`, rule: 1 },
    { k: 'bb', t: 'You will play in the order you were evicted. The first two of you face off first.', rule: 2 },
    { k: 'bb', t: 'The winner takes on the next evictee, and so on down the line.', rule: 3 },
    { k: 'bb', t: 'The last one standing is back in the game, with no safety at all.', rule: 4 },
  ];
  for (const b of beats) {
    const p = b.players || [];
    if (b.part === 'open') steps.push(...linesOf(b));
    if (b.part === 'heat') steps.push({ k: 'beat', t: `${listOf(p)} finish in the top two.`, toast: ['TOP TWO', '#22e1ff'] }, ...linesOf(b));
    if (b.part === 'duel') steps.push({ k: 'beat', t: `${b.label ? b.label.charAt(0) + b.label.slice(1).toLowerCase() + ': ' : ''}${p[0]} beats ${p[1]}.`, bkWin: p[0] }, ...linesOf(b));
    if (b.part === 'out') steps.push({ k: 'beat', t: `${p[0]} is out, for good.`, bkOut: p[0] }, ...linesOf(b));
    if (b.part === 'champion') steps.push({ k: 'beat', t: `The house votes ${p[0]} its champion, ${b.votes} of ${b.of}, to face ${p[1]}.`, bkChamp: p[0], toast: ['THE CHAMPION', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'held') steps.push({ k: 'beat', t: `${p[0]} beats ${p[1]}. Nobody comes back.`, bkOut: p[1], toast: ['THE DOOR HOLDS', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'back') steps.push({ k: 'bb', t: `${p[0]}, you are back in the game.`, bkBack: p[0], toast: ['BACK IN THE HOUSE', '#f5c542'] }, ...linesOf(b));
  }
  return [{
    id: `bb-battleback-w${ctx.week}`, kind: 'battleback', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: 'LIVE',
    kicker: 'Cam 05 · Backyard', title: 'Battle Back', label: 'Battle Back', sub: show ? 'One heat, one champion' : 'The ladder, in eviction order',
    cast: [], battleback: { field: [...(act.contenders || [])] },
    rules: show
      ? [['ONE HEAT', 'every evictee plays; the top two go on'], ['HEAD TO HEAD', 'the top two face off'], ['THE CHAMPION', 'the house picks someone to hold the door'], ['NO SAFETY', 'beat them, and you are back — and nominatable']]
      : [['THE LADDER', 'in eviction order, two at a time'], ['WINNER STAYS', 'the winner faces the next evictee'], ['LAST STANDING', 'goes back into the house'], ['NO SAFETY', 'the returnee can go straight on the block']],
    rulesTitle: 'BATTLE BACK · HOW IT WORKS', steps,
  }];
}

// ── The Bonus Life (Phase 7) ────────────────────────────────────────────
// On eviction night: a power that can undo the vote. Kept in a pocket, it is
// a Diary Room note the house never hears. Played (or gone off by itself at
// the end of its window), Big Brother explains it, the evictee plays one
// competition alone against a set score on the Time Capsule's meter, and
// either walks back in or goes. Words: lines/blact.js and lines/bkact.js.
function bonusLifeScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  if (!act.fired) {
    const b = beats.find(x => x.part === 'hoard');
    return [{
      id: `bb-bonuslife-w${ctx.week}`, kind: 'expired', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, time: 'LIVE',
      kicker: 'Cam 01 · Diary room', title: 'Not played', label: 'Bonus Life · not played', sub: 'The house never knew', cast: [], expired: true,
      steps: [{ k: 'beat', t: `${act.holder} has a Bonus Life, and lets ${act.evicted} go without it.`, expCard: [act.holder, 'Bonus Life', 'kept'], at: [[act.holder, 50]] }, ...linesOf(b)],
    }];
  }
  const who = act.beneficiary;
  const steps = [
    { k: 'bb', t: 'Houseguests, the Bonus Life has been played.', rule: 1 },
    { k: 'bb', t: `${who} will play one competition, alone, against a score set by Big Brother.`, rule: 2 },
    { k: 'bb', t: `Beat it, and ${who} comes back into the house. Miss it, and the eviction stands.`, rule: 3 },
  ];
  for (const b of beats) {
    if (b.part === 'auto') steps.push({ k: 'beat', t: `Nobody played the Bonus Life, so at the end of its time it goes off by itself, on ${who}.` }, ...linesOf(b));
    if (b.part === 'self') steps.push({ k: 'beat', t: `${act.holder} has just been evicted, and plays it.` }, ...linesOf(b));
    if (b.part === 'ally') steps.push({ k: 'beat', t: `${act.holder} plays it on ${who}.` }, ...linesOf(b));
    if (b.part === 'reentry') steps.push(...linesOf(b), { k: 'beat', t: `${who} scores ${b.score}, against ${b.standard}.`, capStage: [1, b.score >= b.standard ? 'good' : 'bad', b.score] });
    if (b.part === 'won') steps.push({ k: 'beat', t: `${who} beats it.`, capEnd: 'won', toast: ['THE EVICTION IS UNDONE', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'lost') steps.push({ k: 'beat', t: `${who} misses it. The eviction stands.`, capEnd: 'lost', toast: ['THE EVICTION STANDS', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'back') steps.push({ k: 'bb', t: `${who}, you are back in the game.` }, ...linesOf(b));
  }
  return [{
    id: `bb-bonuslife-w${ctx.week}`, kind: 'bonuslife', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: 'LIVE',
    kicker: 'Cam 05 · Backyard', title: 'Bonus Life', label: 'Bonus Life', sub: `${who} gets one more chance`,
    cast: [[who, 50]], capsule: { n: 1, target: act.competition?.standard, name: 'RE-ENTRY' },
    rules: [['BONUS LIFE', 'a power that can undo an eviction'], ['ALONE', 'one competition against a set score'], ['BEAT IT', 'and walk back in, with no safety']],
    rulesTitle: 'BONUS LIFE · HOW IT WORKS', steps,
  }];
}

// ── Team America (Phase 7) ──────────────────────────────────────────────
// A secret team the audience picked, a mission a week. Big Brother explains
// it to the team in the Diary Room the first week (the house is never told);
// every week the card names the mission, the team's lead tries it, and what
// it does plays out in the open house among people who do not know they were
// steered. Words: lines/teamact.js.
function teamAmericaScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  const first = act.missionNumber === 1;
  const m = act.mission || {};
  const steps = first ? [
    { k: 'bb', t: `${listOf(act.members || [])}, America has made you a team.`, rule: 1 },
    { k: 'bb', t: 'Every week, you will be given a mission. Complete it, and you will each be paid.', rule: 2 },
    { k: 'bb', t: 'Fail it, and nothing happens. Get caught, and the house will start to look for you.', rule: 3 },
    { k: 'bb', t: 'Nobody else in this house can know that the team exists.', rule: 4 },
  ] : [];
  for (const b of beats) {
    if (b.part === 'opening') steps.push(...linesOf(b));
    if (b.part === 'mission') steps.push({ k: 'bb', t: `Team America, this week's mission: ${m.ask}`, taMission: true }, ...linesOf(b));
    if (b.part === 'done') steps.push({ k: 'beat', t: `${m.lead} pulls it off.`, taDone: 'done', toast: ['MISSION COMPLETE', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'failed') steps.push({ k: 'beat', t: `${m.lead} tries, and it does not work.`, taDone: 'failed', toast: ['MISSION FAILED', '#9aa4b2'] }, ...linesOf(b));
    if (b.part === 'effect') steps.push(...linesOf(b));
    if (b.part === 'noticed') steps.push({ k: 'beat', t: 'Somebody in the house has noticed they are being steered.', taNoticed: true }, ...linesOf(b));
  }
  return [{
    id: `bb-team-w${ctx.week}`, kind: 'team', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, time: '10:15',
    kicker: 'Cam 01 · Diary room', title: 'Team America', label: 'Team America', sub: `Mission ${act.missionNumber}: ${m.name || ''}`,
    cast: [], team: { members: [...(act.members || [])], name: m.name || '', number: act.missionNumber },
    ...(first ? { rules: [['THE TEAM', 'three houseguests, picked by America'], ['A MISSION A WEEK', 'complete it and get paid'],
      ['CAUGHT', 'the house starts hunting'], ['SECRET', 'nobody else may know']], rulesTitle: 'TEAM AMERICA · HOW IT WORKS' } : {}),
    steps,
  }];
}

// ── The Mystery Competitor, the Mystery Veto, and its ceremony (Phase 7) ─
// Two secret powers that rewrite the veto. The Mystery Competitor: Big
// Brother explains that a former houseguest has been summoned to play for
// somebody (never who), the door opens, a drawn player is bumped. The Mystery
// Veto: a second competition played alone against a par on the Time
// Capsule's meter, and then, after the meeting everybody thought had ended,
// the house is called back and the block changes again. Words: lines/mvact.js.
function mysteryScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  if (act.type === 'mystery-competitor') {
    const g = act.guest;
    const steps = [
      { k: 'bb', t: 'Houseguests, somebody in this house holds a secret power: the Mystery Competitor.', rule: 1 },
      { k: 'bb', t: 'A former houseguest has been called back to take one of the drawn veto spots.', rule: 2 },
      { k: 'bb', t: 'If they win, the Power of Veto goes to the houseguest who summoned them. You will not be told who that is.', rule: 3 },
    ];
    for (const b of beats) {
      if (b.part === 'arrive') continue;
      if (b.part === 'door') steps.push({ k: 'beat', t: `The front door opens. It is ${g}.`, at: [[g, 50]], toast: [act.visiting ? 'NOT EVEN FROM THIS SHOW' : 'A FACE FROM THE PAST', '#f5c542'] }, ...linesOf(b));
      else steps.push(...linesOf(b));
    }
    return [{
      id: `bb-mysterycomp-w${ctx.week}`, kind: 'mystery', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '11:40',
      kicker: 'Cam 04 · Living room', title: 'The Mystery Competitor', label: 'The Mystery Competitor', sub: `${g} walks back in`,
      seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh),
      rules: [['A SECRET POWER', 'somebody summons a former houseguest'], ['ONE SPOT', 'the guest takes a drawn veto spot'], ['FOR THE HOLDER', 'win, and the veto is theirs']],
      rulesTitle: 'THE MYSTERY COMPETITOR · HOW IT WORKS', steps,
    }];
  }
  if (act.type === 'mystery-veto') {
    const h = act.holder;
    const steps = [
      { k: 'beat', t: `${h} holds a secret power: the Mystery Veto.`, rule: 1 },
      { k: 'beat', t: 'After the veto meeting, they play one more veto competition, alone, against a par.', rule: 2 },
      { k: 'beat', t: 'Beat the par, and they hold a real veto to use before the eviction.', rule: 3 },
    ];
    for (const b of beats) {
      if (b.part === 'second' || b.part === 'alone') steps.push(...linesOf(b));
      if (b.part === 'solowon' || b.part === 'sololost') steps.push({ k: 'beat', t: `${h} posts ${Number(b.posted).toFixed(1)}, against a par of ${Number(b.par).toFixed(1)}.`,
        capStage: [1, b.part === 'solowon' ? 'good' : 'bad', b.posted] }, { k: 'beat', t: b.part === 'solowon' ? `${h} beats it.` : `${h} misses it.`, capEnd: b.part === 'solowon' ? 'won' : 'lost',
        toast: b.part === 'solowon' ? ['A REAL VETO', '#f5c542'] : ['NOT BEATEN', '#ff3355'] }, ...linesOf(b));
    }
    return [{
      id: `bb-mysteryveto-w${ctx.week}`, kind: 'mystery', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '22:40',
      kicker: 'Cam 05 · Backyard', title: 'The Mystery Veto', label: 'The Mystery Veto', sub: `${act.competition?.name || 'One more veto'}, alone`,
      cast: [[h, 50]], capsule: { n: 1, target: act.competition?.par, name: act.competition?.name || 'THE MYSTERY VETO' },
      rules: [['A SECRET POWER', 'one houseguest holds the Mystery Veto'], ['ALONE', 'one more veto competition, against a par'], ['WIN IT', 'and use it after the meeting']],
      rulesTitle: 'THE MYSTERY VETO · ONLY YOU KNOW', steps,
    }];
  }
  // the second ceremony
  const removed = act.removed || [], seated = act.seated || [];
  const before = (act.nominees || []).filter(n => !seated.includes(n)).concat(removed);
  const steps = [];
  for (const b of beats) {
    if (b.part === 'called') steps.push(...linesOf(b), { k: 'bb', t: 'Houseguests, a second Power of Veto has been won, and it will be used now.', rule: 1 });
    if (b.part === 'used') steps.push({ k: 'beat', t: `${act.holder} uses it. ${listOf(removed)} ${removed.length > 1 ? 'come' : 'comes'} off the block.`, v2Save: removed[0], toast: ['THE MYSTERY VETO', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'pair') steps.push(...linesOf(b));
    if (b.part === 'chair') steps.push({ k: 'beat', t: `${listOf(seated)} ${seated.length > 1 ? 'go' : 'goes'} up instead.`, v2Rep: seated[0], toast: ['ONE MORE CHAIR', '#ff3355'] }, ...linesOf(b));
    if (b.part === 'empty') steps.push({ k: 'beat', t: 'Nobody can fill the chair. It stays empty.', v2Kept: true }, ...linesOf(b));
  }
  return [{
    id: `bb-veto2b-w${ctx.week}`, kind: 'veto2', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '23:30',
    kicker: 'Cam 04 · Living room', title: 'The Mystery Veto Ceremony', label: 'The Mystery Veto Ceremony', sub: 'The meeting ends twice',
    seated: seatLiving(before, ctx.house.filter(n => !before.includes(n) && n !== ctx.hoh), ctx.hoh), veto2: { before },
    rules: [['A SECOND VETO', 'won in secret, used after the meeting']], rulesTitle: 'THE MYSTERY VETO · CALLED BACK', steps,
  }];
}

// ── Premiere night (Phase 7) ────────────────────────────────────────────
// The host has been taken and the Head of Household relic with her. Big
// Brother explains the night; the house splits in two (and the screen says
// how); each group hunts one of them over three rounds, and the hunt is shown
// as what was worth seeing: the warm leads, the first conversations and
// silences, a clue kept, and the find. The relic is loud; the money is the
// quiet prize. Words: lines/pmact.js.
function premiereScreens(act, ctx) {
  const linesOf = x => (x && x.lines?.length ? scriptSteps(x.lines) : []);
  // BB27 (user, 2026-10-24: "1:1 of the real show"): the host is taken in the
  // middle of the night's welcome, the lights go out (the Accomplice's timer),
  // and the Mastermind takes over the screen. He sets the hunts, not Big Brother.
  const M = 'The Mastermind';
  const pick = (list, salt) => pickBy(list, `${ctx.week}|premiere|${salt}`);
  const steps = [
    { k: 'beat', t: pick(['The host is back on the living room screen to say goodnight when every light in the house goes out at once.',
      'The host is halfway through a sentence on the living room screen when the house goes black.']) },
    { k: 'beat', t: 'Ten seconds of dark. When the lights come back, the screen shows an empty studio, and the Head of Household relic is gone from its stand.', toast: ['THE HOST IS GONE', '#7c5cff'], shake: true },
    { k: 'voice', own: true, by: M, t: 'Good evening, and welcome to the Hotel Mystère. Your host is my guest tonight. So is your relic.', rule: 1 },
    { k: 'voice', own: true, by: M, t: 'Split yourselves into two groups. One group will look for your host. The other will look for the relic.', rule: 2 },
    { k: 'voice', own: true, by: M, t: 'Whoever finds the relic will decide which four of you play for the first Head of Household.', rule: 3 },
    { k: 'voice', own: true, by: M, t: 'Whoever finds your host will be paid for the trouble. Ten thousand dollars.', rule: 4 },
    { k: 'beat', t: 'The screen goes dark again.' },
    { k: 'beat', t: act.splitRule || 'The house splits in two.' },
  ];
  for (const h of act.hunts || []) {
    steps.push({ k: 'beat', t: `Hunting for ${h.target}: ${listOf(h.team || [])}.`, pmHunt: h.target });
    const byRound = {};
    for (const r of h.rounds || []) (byRound[r.round] ||= []).push(r);
    for (const e of h.events || []) (byRound[e.round] ||= []).push({ event: e });
    for (const k of Object.keys(byRound).map(Number).sort((a, b) => a - b)) {
      for (const x of byRound[k]) {
        if (x.event) steps.push(...linesOf(x.event));
        else if (x.outcome === 'warm') steps.push(...linesOf(x));
        else if (x.outcome === 'found') steps.push({ k: 'beat', t: x.text, pmFound: [h.target, x.who], toast: [h.target === 'the relic' ? 'THE RELIC IS FOUND' : 'THE HOST IS FOUND', '#f5c542'] }, ...linesOf(x));
      }
    }
  }
  for (const b of act.beats || []) steps.push(...linesOf(b));

  // ── the Mystery Houseguest (a past winner, walked in after the hunts) ──
  const g = act.mysteryGuest;
  if (g?.name) {
    steps.push({ k: 'host', by: ctx.host, t: pick(['Houseguests, before you go to bed, there is one more guest checking in tonight. Some of you have already found the clues.',
      'Houseguests, the hotel has one more room to fill tonight. If you looked closely, the clues were all over the house.']), rule: 5 });
    steps.push({ k: 'beat', t: `The front door opens. It is ${g.name}${g.won ? `, who won ${g.where}` : `, back from ${g.where}`}.`, toast: ['THE MYSTERY HOUSEGUEST', '#f5c542'] });
    steps.push({ k: 'say', by: g.name, t: pick(["Did you miss me? Don't answer that.", 'Surprise. I hope somebody saved me a bed.', 'Hello, hotel. I know my way around a house like this.']) });
    steps.push({ k: 'dr', by: g.name, t: g.won ? 'I have won this game before. Everybody in that room knows it, which means I start the season with a target on me. Good. I know what to do with one.'
      : 'Everybody in there has watched me play before. They think they know my game. They know my last one.' });
  }

  // ── the Accomplice: the house votes to unmask them ──
  const u = act.unmask, acc = act.accomplice?.name;
  if (u && acc) {
    steps.push({ k: 'voice', own: true, by: M, t: 'One more thing before you sleep. The lights going out. The relic disappearing. I did not do that alone.', rule: 6, shake: true });
    steps.push({ k: 'voice', own: true, by: M, t: 'One of you has been working for me since before you walked through that door. Name my Accomplice, and they leave tonight. Name the wrong person, and my Accomplice stays in this game, and you will never know who it is.' });
    steps.push({ k: 'beat', t: `It does not take long. Two names keep coming back: ${u.suspects[0]} and ${u.suspects[1]}.` });
    steps.push({ k: 'say', by: u.suspects[0], t: pick(["Me? I was in the reading room the whole time. Ask anyone.", "I've been here six hours. When would I have had time?"], 's0') });
    steps.push({ k: 'say', by: u.suspects[1], t: pick(["I get it. I'm quiet. Quiet isn't guilty.", "I'd vote for me too, honestly. But it wasn't me."], 's1') });
    const [x, y] = u.suspects;
    steps.push({ k: 'beat', t: `The house votes: ${u.count[x]} for ${x}, ${u.count[y]} for ${y}.`, toast: [`${u.named.toUpperCase()} IS NAMED`, '#ff3355'] });
    if (u.caught) {
      steps.push({ k: 'voice', own: true, by: M, t: `Correct. ${acc}, your stay at the Hotel Mystère is over.`, shake: true });
      steps.push({ k: 'beat', t: `${acc} picks up a bag and walks out of the front door before the first Head of Household has even been played.`, toast: ['THE ACCOMPLICE IS EVICTED', '#ff3355'] });
      steps.push({ k: 'dr', by: acc, t: 'I did everything he asked. I just could not keep my face still in that room.' });
    } else {
      steps.push({ k: 'voice', own: true, by: M, t: `Wrong. ${u.named} was never my Accomplice. My Accomplice voted with the rest of you, and sleeps in this house tonight.`, shake: true });
      steps.push({ k: 'beat', t: `Only the people watching at home are told: the Accomplice is ${acc}.`, toast: ['FOR YOU AT HOME', '#7c5cff'] });
      steps.push({ k: 'dr', by: acc, t: `I set the timer that killed the lights, and I pressed the button that made the relic disappear. Then I voted for ${u.named} with everybody else.` });
      steps.push({ k: 'dr', by: u.named, t: pick(["Night one, and the whole house thinks I'm a liar. I didn't even get to unpack.", "They were wrong about me tonight. I'm going to remember every one of them who said my name."], 'named') });
    }
  }
  const vc = voiceOf('summer-of-mystery', 'neutral').color;
  for (const st of steps) if (st.k === 'voice' && !st.vc) st.vc = vc;
  return [{
    id: `bb-premiere-w${ctx.week}`, kind: 'premiere', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '21:00',
    kicker: 'Cam 04 · Living room', title: 'Premiere Night', label: 'Premiere Night', sub: 'Two hunts, two prizes',
    cast: [], nv: true,
    rules: [['THE HOST IS GONE', 'and the HOH relic with her'], ['TWO GROUPS', 'one hunt each'], ['THE RELIC', 'its finder picks who plays for HOH'], ['THE HOST', 'her finder wins $10,000'],
      ...(act.mysteryGuest ? [['ONE MORE GUEST', 'a returning houseguest checks in']] : []),
      ...(act.unmask ? [['THE ACCOMPLICE', 'name them and they leave tonight']] : [])],
    rulesTitle: 'PREMIERE NIGHT · THE HOTEL MYSTÈRE', steps,
  }];
}

// ── BB19's premiere night (bb/temptation-premiere.js) ───────────────────
// The host welcomes them to the Summer of Temptation; the button; the doorbell; the returnee saves eight;
// the rest play for safety; the bottom three choose a vote or a competition; somebody leaves on night one.
function temptationPremiereScreens(act, ctx) {
  const host = ctx.host;
  const pick = (list, salt) => pickBy(list, `${ctx.week}|tp|${salt}`);
  const steps = [
    { k: 'host', by: host, t: 'Houseguests, welcome to the Summer of Temptation. All summer long you will be tempted, and every temptation comes with a consequence.', rule: 1, toast: ['THE SUMMER OF TEMPTATION', '#c0392b'] },
    { k: 'beat', t: 'Each houseguest is shut into a pod of their own. Nobody can see anybody else.' },
    { k: 'host', by: host, t: 'In front of each of you is a button. The first houseguest to press it wins twenty-five thousand dollars, and nobody will be told who.', rule: 2 },
    { k: 'beat', t: `Hands hover. In ${word(act.pressers.length)} of the pods, a hand goes down.` },
    { k: 'beat', t: `ONLY YOU KNOW: ${act.taker} was fastest, and has just won $25,000.`, toast: ['ONLY YOU KNOW', '#7c5cff'] },
    { k: 'dr', by: act.taker, t: pick(["Twenty-five thousand dollars on day one. Whatever the consequence is, I'll deal with it.", "I didn't even think. My hand just went. And now I'm terrified of what I've done."], 'take') },
    { k: 'host', by: host, t: 'Somebody took the money. Whoever you are, you must throw the first Head of Household competition.', rule: 3 },
  ];
  const ret = act.returnee;
  const noms = act.nominees || [];
  const noms0 = n => noms.includes(n);
  if (ret?.name) {
    steps.push({ k: 'host', by: host, t: 'And the house has a consequence of its own. Listen.', shake: true });
    steps.push({ k: 'beat', t: `The doorbell rings. The front door opens, and in walks ${ret.name}${ret.won ? `, who won ${ret.where}` : `, back from ${ret.where}`}.`, toast: ['THE CONSEQUENCE', '#c0392b'] });
    steps.push({ k: 'say', by: ret.name, t: pick(["Hi, everyone. Don't get up. Actually, do. I want to see who's scared.", 'Surprise. I hear somebody couldn\'t keep their hand off a button.']) });
    steps.push({ k: 'host', by: host, t: `${ret.name} is not visiting. ${ret.name} is taking one of your places tonight, and one of you will leave the house before the night is over. This is the Big Brother Swap.`, rule: 4 });
    steps.push({ k: 'host', by: host, t: `${ret.name}, you may save ${word((act.saved || []).length)} houseguests.` });
    steps.push({ k: 'beat', t: `${ret.name} hands out the safety: ${listOf(act.saved || [])}.`, toast: ['SAVED', '#22e1ff'] });
    steps.push({ k: 'host', by: host, t: `Everybody else, you will now compete for your safety. The last three are nominated.` });
    const ord = act.safety?.order || [];
    if (ord.length) steps.push({ k: 'beat', t: `${ord[0]} is safe first. One by one the others follow, until three are left standing with nothing.`,
      board: { title: 'THE SWAP · SAFETY', rows: ord.map(n => ({ n, text: noms0(n) ? 'NOMINATED' : 'SAFE' })) } });
    steps.push({ k: 'beat', t: `${listOf(noms)} finish at the bottom, and are nominated for eviction.`, nom: noms.slice(), toast: ['NOMINATED', '#ff3355'] });
    steps.push({ k: 'host', by: host, t: 'Nominees, you decide how this ends: a house vote, or a competition.' });
    // each nominee says it their own way: the lines are dealt, never repeated
    const SAYS = {
      vote: ['A vote. I trust these people more than my legs tonight.', 'Vote. Let them decide.',
        "House vote. I've talked to everybody in here, and I like my chances.", "I'm not racing anybody tonight. Vote."],
      competition: ['Competition. I want my fate in my own hands.', "Put it in a competition. I'm not leaving it to strangers.",
        "Comp. These people met me four hours ago, I'm not trusting them with this.", "Competition. If I go, I go fighting."],
    };
    const dealt = { vote: 0, competition: 0 };
    const off = Math.floor(pickBy([0, 1, 2, 3], `${ctx.week}|tp|deal`));
    for (const c of act.choice || []) {
      const pool = SAYS[c.pick] || SAYS.vote;
      steps.push({ k: 'say', by: c.name, t: pool[(off + dealt[c.pick]++) % pool.length] });
    }
    if (act.method === 'vote') {
      const t = act.tally || {};
      steps.push({ k: 'host', by: host, t: 'A house vote it is.' });
      steps.push({ k: 'host', by: host, t: `By a vote of ${noms.map(n => t[n] || 0).sort((a, b) => b - a).join(' to ')}...`, push: true });
    } else {
      steps.push({ k: 'host', by: host, t: 'A competition it is. Last place leaves the house.' });
      steps.push({ k: 'beat', t: `${act.evicted} finishes last.` });
    }
    steps.push({ k: 'host', by: host, t: `${act.evicted}, you are evicted from the Big Brother house, and ${ret.name} takes your place.`, out: act.evicted, shake: true, big: [act.evicted, 'Evicted', 'out'] });
    steps.push({ k: 'beat', t: `${act.evicted} has been a houseguest for one night.` });
    steps.push({ k: 'dr', by: act.taker, t: pick([`${act.evicted} is gone because I pressed a button. Nobody in that room knows it was me, and nobody ever can.`, `I took the money, and ${act.evicted} paid for it. That's going to sit with me.`], 'after') });
  }
  return [{
    id: `bb-tpremiere-w${ctx.week}`, kind: 'premiere', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '21:00',
    kicker: 'Live · Living room', title: 'The First Temptation', label: 'Premiere Night', sub: '$25,000, and a consequence',
    cast: [], rules: [['THE BUTTON', '$25,000 to the fastest, in secret'], ['THE TAKER', 'throws the first HOH'],
      ...(act.returnee ? [['THE SWAP', 'a returnee takes somebody\'s place tonight']] : [])],
    rulesTitle: 'THE SUMMER OF TEMPTATION · NIGHT ONE', steps,
  }];
}

// ── The Halting Hex (Phase 7) ───────────────────────────────────────────
// The result is read and somebody is leaving, and then they are not. Big
// Brother explains the Hex once it is out; the evictee stays and the block
// empties. Votes are secret, and stay secret. Words: lines/hexact.js.
function hexScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const steps = [];
  for (const b of act.beats || []) {
    if (b.part === 'stop') steps.push(...linesOf(b),
      { k: 'bb', t: `Houseguests, ${act.holder} has played the Halting Hex.`, rule: 1, toast: ['THE EVICTION IS CANCELLED', '#f5c542'] },
      { k: 'bb', t: 'It cancels tonight\'s eviction, after the vote has been read.', rule: 2 },
      { k: 'bb', t: `${act.spared} stays in the house, and nobody leaves tonight.`, rule: 3 });
    if (b.part === 'after') steps.push(...linesOf(b));
  }
  return [{
    id: `bb-hex-w${ctx.week}`, kind: 'hex', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: 'LIVE',
    kicker: 'Cam 04 · Living room', title: 'The Halting Hex', label: 'The Halting Hex', sub: 'Nobody goes home tonight',
    cast: [...new Set([act.spared, act.holder])].map((n, i, all) => [n, all.length === 1 ? 50 : 36 + i * 28]),
    rules: [['THE HALTING HEX', 'cancels tonight\'s eviction'], ['AFTER THE VOTE', 'played once the result is read'], ['NOBODY GOES', 'the evictee stays; the votes do not count']],
    rulesTitle: 'THE HALTING HEX · PLAYED', steps,
  }];
}

// ── No Eviction, and Dead Last (Phase 7) ──────────────────────────────
// Two rule changes to an ordinary week, each explained by Big Brother: a
// week with no ceremonies and nobody leaving, and a Head of Household
// competition whose last place is the first nominee. Words: lines/quietact.js.
function quietScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  const beats = act.beats || [];
  if (act.type === 'no-eviction') {
    const steps = [
      { k: 'bb', t: 'Houseguests, there will be no eviction this week.', rule: 1, toast: ['NOBODY GOES HOME', '#f5c542'] },
      { k: 'bb', t: 'No nominations, no veto, and no vote. Everybody in this house will still be here next week.', rule: 2 },
    ];
    for (const b of beats) steps.push(...linesOf(b));
    return [{
      id: `bb-noevict-w${ctx.week}`, kind: 'quiet', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: '13:00',
      kicker: 'Cam 04 · Living room', title: 'No Eviction', label: 'No Eviction', sub: 'Nobody goes home this week',
      seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh),
      rules: [['NO EVICTION', 'nobody goes home this week'], ['NO CEREMONIES', 'no nominations, no veto, no vote']], rulesTitle: 'THIS WEEK', steps,
    }];
  }
  const n = act.nominee;
  const steps = [
    { k: 'bb', t: 'Houseguests, this week, last place in the Head of Household competition is nominated.', rule: 1 },
    { k: 'bb', t: 'The Head of Household names the other nominees.', rule: 2 },
    { k: 'bb', t: `${n}, you finished last${act.of ? `, ${ordinalWord(act.place)} of ${word(act.of)}` : ''}. You are the first nominee.`, toast: ['DEAD LAST', '#ff3355'] },
  ];
  for (const b of beats) steps.push(...linesOf(b));
  return [{
    id: `bb-deadlast-w${ctx.week}`, kind: 'quiet', anchor: ctx.anchor, day: ctx.day, set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining, time: ACT_TIME.nominations,
    kicker: 'Cam 03 · Dining room', title: 'Dead Last', label: 'Dead Last', sub: `${n} is nominated by the competition`, cast: [[n, 50]],
    rules: [['DEAD LAST', 'last place in the HOH competition is nominated'], ['THE REST', 'the HOH names the others']], rulesTitle: 'DEAD LAST · HOW IT WORKS', steps,
  }];
}
const ordinalWord = n => ({ 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth', 16: 'sixteenth' }[n] || `number ${n}`);

// ── The Rewind, and the White Locust (Phase 7) ─────────────────────────
// The Rewind: after the vote is read, a power erases the whole week. The
// evictee stays, the Head of Household loses the reign, everybody plays again,
// and (the one public count in this game) every ballot is read out. The White
// Locust: a resort call-out chain. Win safety, call somebody out; survive the
// task against the clock and call out the next, with less time; fail, and you
// do not check out. Words: lines/rwact.js.
function rewindScreens(act, ctx) {
  const linesOf = b => (b && b.lines?.length ? scriptSteps(b.lines) : []);
  if (act.type === 'rewind') {
    const steps = [];
    for (const b of act.beats || []) {
      if (b.part === 'stop') steps.push(...linesOf(b),
        { k: 'bb', t: `Houseguests, ${act.holder} has played the Rewind.`, rule: 1, toast: ['THE WEEK IS ERASED', '#f5c542'] },
        { k: 'bb', t: `${act.spared} stays. ${act.deposed ? `${act.deposed} is no longer Head of Household. ` : ''}This week never happened.`, rule: 2 },
        { k: 'bb', t: 'Everybody will play for Head of Household again. And every vote cast tonight is now public.', rule: 3 });
      else steps.push(...linesOf(b));
    }
    return [{
      id: `bb-rewind-w${ctx.week}`, kind: 'rewind', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: 'LIVE',
      kicker: 'Cam 04 · Living room', title: 'The Rewind', label: 'The Rewind', sub: 'The week is erased', cast: [[act.holder, 36], [act.spared, 64]].filter(x => x[0]),
      rules: [['THE REWIND', 'erases the whole week, after the vote'], ['NOBODY LEAVES', 'and the HOH loses the reign'], ['THE COUNT', 'every ballot is read out']],
      rulesTitle: 'THE REWIND · PLAYED', steps,
    }];
  }
  // the White Locust: run by its concierge (BB27's was a fan-favourite alumnus), else by Big Brother
  const cg = act.concierge;
  const say = cg ? t => ({ k: 'host', by: cg, t }) : t => ({ k: 'bb', t });
  const steps = [
    ...(cg ? [{ k: 'beat', t: `The houseguests are met at the resort gate by its concierge for the week: ${cg}, a fan favourite from another season.`, toast: ['THE CONCIERGE', '#f5c542'] }] : []),
    { ...say(cg ? 'Welcome to the White Locust Resort! Relax, enjoy your stay. Just know that by the end of it, one of you will not be checking out.'
      : 'Houseguests, welcome to the White Locust Resort. By the end of your stay, one of you will not be checking out.'), rule: 1 },
    { ...say('First, you will all play for safety. The winner starts the call-out chain.'), rule: 2 },
    { ...say('Whoever is called out must finish a task before the clock runs out. Survive, and you call out the next person, with less time.'), rule: 3 },
    { ...say('Fail, and you are out of the game. No vote. Of everybody who survives a call-out, the fastest becomes Head of Household.'), rule: 4 },
    { k: 'beat', t: `${act.safe} wins ${act.safetyTask} and is safe.`, wlSafe: act.safe, toast: ['SAFE', '#22e1ff'] },
  ];
  for (const r of act.rounds || []) {
    if (r.sweep) { steps.push({ k: 'beat', t: `Nobody has failed. The resort keeps the slowest survivor: ${r.target}.`, wlRound: [r.target, 'out'] }); continue; }
    steps.push(...(r.callLines?.length ? scriptSteps(r.callLines) : [{ k: 'say', by: r.caller, t: `${r.target}, you're up.` }]));
    steps.push({ k: 'beat', t: `${r.target} has ${word(r.limit)} seconds: ${r.doing}.`, wlRound: [r.target, 'up', r.limit] });
    steps.push({ k: 'beat', t: r.made ? `${r.target} finishes in ${Math.round(r.time)} seconds.` : `${r.target} runs out of time.`, wlRound: [r.target, r.made ? 'made' : 'out', r.limit, Math.round(r.time)],
      ...(r.made ? {} : { toast: ['DOES NOT CHECK OUT', '#ff3355'] }) }, ...(r.endLines?.length ? scriptSteps(r.endLines) : []));
  }
  for (const b of act.beats || []) steps.push(...linesOf(b));
  if (act.hoh) steps.push({ ...say(act.hoh === act.safe ? `${act.hoh}, nobody survived a call-out, so the crown is yours. You are the new Head of Household.`
    : `${act.hoh}, of everybody who survived a call-out, you were the fastest. You are the new Head of Household.`), toast: ['NEW HEAD OF HOUSEHOLD', '#f5c542'] });
  return [{
    id: `bb-locust-w${ctx.week}`, kind: 'locust', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: ROOM_NAME.yard, cam: CAM.yard, time: '16:00',
    kicker: 'Cam 05 · Backyard', title: 'The White Locust Resort', label: 'White Locust Resort', sub: 'One guest does not check out',
    cast: [], locust: { safe: act.safe },
    rules: [['SAFETY', 'the winner starts the chain'], ['CALL OUT', 'name who plays next'], ['THE CLOCK', 'finish in time, or you are out'], ['FASTEST', 'the quickest survivor is HOH']],
    rulesTitle: 'THE WHITE LOCUST · HOW IT WORKS', steps,
  }];
}

// ── Move-in day ─────────────────────────────────────────────────────────
// Always the first screen of the season. The host opens the show, then the
// front door opens again and again: each houseguest walks in and says hello
// in their own voice (some share a first impression of somebody already
// inside), and the wall of frames above the living room fills face by face.
// Big Brother speaks once everybody is in. Words: lines/moveinact.js.
function moveInScreen(act, ctx, host, row) {
  // Move-in night, the way the live show runs it (the user, 2026-10-06: "check how move-in
  // actually happens: entering in groups, first they're on the set with the host"). Groups of
  // about four meet the host on the stage, each says a few words, and the group goes through the
  // front door together; inside, the people already in greet the next group; when the house is
  // full the host speaks to them on the living room screen. Words: bb/script/lines/moveinact.js.
  // BB27's Mystery Houseguest checks in at the end of premiere night, not with the others.
  const held = (row?.acts || []).find(a => a?.type === 'premiere-mystery')?.mysteryGuest?.name
    || (row?.acts || []).find(a => a?.type === 'temptation-premiere')?.returnee?.name || null;
  const notHeld = l => (Array.isArray(l) ? l.filter(x => !held || !(Array.isArray(x) ? x.some(v => String(v).includes(held)) : String(x?.text ?? x).includes(held))) : l);
  const arrivals = (act.arrivals || []).filter(n => n !== held);
  const groups = ((act.groups || []).length ? act.groups : [act.arrivals || []]).map(gr => gr.filter(n => n !== held)).filter(gr => gr.length);
  const beatOf = n => (act.beats || []).find(b => (b.players || [])[0] === n) || {};
  const pick = (list, salt) => pickBy(list, `${ctx.week}|movein|${salt}`);
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const stage = (cast, extra = {}) => ({ set: 'studio-wide', arena: true, room: 'The Stage', cam: 7, kicker: 'Live · The stage', cast: cast.map((p, i, a) => [p, spread(a.length)[i]]), mood: 'ceremony', hostOn: true, time: '8:00 PM', slate: true, ...extra });
  const inside = (cast, room = 'ceremony', extra = {}) => ({ set: room, arena: false, hostOn: false, room: ROOM_NAME[room] || 'Living Room', cam: CAM[room] || 4, kicker: `Cam ${String(CAM[room] || 4).padStart(2, '0')} · ${ROOM_NAME[room] || 'Living room'}`, cast: cast.map((p, i, a) => [p, spread(a.length)[i]]), mood: 'house', time: '8:30 PM', slate: true, ...extra });
  const steps = [];
  steps.push({ k: 'host', by: host, scene: stage([]), t: pick([`Good evening, and welcome to Big Brother! Tonight, ${word(arrivals.length)} strangers move into the Big Brother house, and only one of them will walk out with the prize.`,
    `Hello, and welcome to the premiere of Big Brother! ${titleCase(word(arrivals.length))} houseguests. One house. Cameras everywhere. And one winner at the end of it.`], 'open') });
  steps.push({ k: 'host', by: host, t: groups.length > 1 ? `They'll move in ${word(groups.length)} groups of about ${word(Math.round(arrivals.length / groups.length))}. Let's meet the first group.` : `Let's meet them.` });
  const inHouse = [];
  groups.forEach((g, gi) => {
    // on the stage, with the host
    steps.push({ k: 'beat', scene: stage(g), t: pick([`${listOf(g)} walk out onto the stage. The crowd goes up a notch.`, `The ${ORD[gi] || 'next'} group comes out to a roar: ${listOf(g)}.`, `${listOf(g)} step out under the lights, waving at a crowd they can barely see.`], `g${gi}`) });
    steps.push({ k: 'host', by: host, t: pick([`Welcome, all of you! Quickly, before you go in: how are you going to play this game?`, `Welcome! One question each, and then the house is yours. What's your game?`, `You're about to walk into that house. Tell me how you plan to play it.`], `q${gi}`) });
    for (const n of g) {
      const st = beatOf(n).stageLines;
      if (st?.length) steps.push(...scriptSteps(st));
      else steps.push({ k: 'say', by: n, t: pick(["I'm just going to be myself.", "I'm ready. I've been ready for years.", "Have fun, play hard, see what happens."], n) });
    }
    // two people in this group knew each other before the show (bb/script/lines/moveinkin.js):
    // a pair about to be a Dynamic Duo walked out together and the host asks; a secret pair
    // who ended up side by side does not look at each other
    const kin = (act.kinStage || {})[gi];
    if (kin?.open) {
      const [x, y] = kin.pair;
      steps.push({ k: 'host', by: host, tense: [x, y], t: pick([`Hold on. ${x} and ${y}, you walked out here together. Do you two know each other?`, `${x}, ${y}, I couldn't help noticing you came out side by side. Is there something the house should know?`], `kin${gi}`) });
      steps.push(...scriptSteps(kin.lines));
      steps.push({ k: 'host', by: host, t: pick([`Well. The rest of the house is going to find that out very soon.`, `Then the two of you are in for a very interesting season.`], `kin2${gi}`) });
    } else if (kin?.lines?.length) steps.push(...scriptSteps(kin.lines));
    steps.push({ k: 'host', by: host, t: pick([`${listOf(g)}... the Big Brother house is waiting. Go on in!`, `Alright, ${g.length === 2 ? 'you two' : 'all of you'}. Through those doors. Good luck!`, `That's it. ${listOf(g)}, the house is yours.`], `go${gi}`) });
    // through the front door, together
    inHouse.push(...g);
    const before = inHouse.filter(n => !g.includes(n));
    // the front door opens into the living room; when the group's scene opens on its own staging
    // line, the cut goes on that line rather than a second 'the front door opens'
    const door = { scene: inside([...g, ...before.slice(-4)], 'ceremony'), miIn: g };
    const walk = scriptSteps((act.groupLines || [])[gi]);
    if (walk[0]?.k === 'beat') { walk[0] = { ...walk[0], ...door }; steps.push(...walk); }
    else steps.push({ k: 'beat', ...door, t: gi === 0 ? `The front door opens. ${listOf(g)} are the first ones in.` : `The front door opens again. ${listOf(g)} are in.` }, ...walk);
    // each arrival's own first words in the house (and the first impressions)
    for (const n of g) { const b = beatOf(n); if (b.lines?.length) steps.push(...scriptSteps(b.lines)); }
    // a pair who came in together, and somebody inside noticing
    if ((act.kinHouse || {})[gi]?.length) steps.push(...scriptSteps(act.kinHouse[gi]));
    if (gi < groups.length - 1) steps.push({ k: 'host', by: host, scene: stage([]), t: pick([`${titleCase(word(inHouse.length))} in. ${titleCase(word(arrivals.length - inHouse.length))} to go. Let's meet the next group.`, `That's ${word(inHouse.length)} in the house. Here comes group number ${word(gi + 2)}.`], `next${gi}`) });
  });
  // a secret pair's first private minute, once everybody is in
  for (const al of act.kinAlone || []) {
    const sc = scriptSteps(al.lines);
    if (!sc.length) continue;
    sc[0] = { ...sc[0], scene: inside(al.pair, 'storage', { time: '9:30 PM' }) };
    steps.push(...sc);
  }
  // the house is full: the host on the living room screen
  const announced = (row?.acts || []).some(a => a?.type === 'twist-announcement');
  steps.push({ k: 'bb', scene: inside(arrivals.slice(0, 16), 'ceremony', { tvObj: true, time: '10:00 PM' }), t: 'Houseguests, please gather in the living room.', toast: ['THE HOUSE IS FULL', '#f5c542'] });
  steps.push({ k: 'host', by: host, t: row?.themeId === 'summer-of-mystery'
    ? `Houseguests! Welcome to the Hotel Mystère. For the next few months, this is home. Every room in it has a secret, and so does everybody standing in it.`
    : `Houseguests! Welcome to the Big Brother house. For the next few months, this is home. Take a look around: everybody standing in this room wants the same thing you do.` });
  if (announced) steps.push({ k: 'host', by: host, t: `And this season, the game has a twist. You'll hear all about it very soon.` });
  steps.push({ k: 'host', by: host, t: `Get comfortable, but not too comfortable. The competition for the first Head of Household is coming, and it won't wait for you to unpack. Good luck.` });
  steps.push({ k: 'beat', t: pick(['The screen goes dark. Sixteen people look at each other at once.', 'The screen goes black. For about three seconds, nobody says anything. Then everybody does.', 'The host is gone. The house erupts.'], 'end').replace('Sixteen', titleCase(word(arrivals.length))) });
  return {
    id: 'bb-movein-v', kind: 'movein', anchor: 'start', day: 1, set: 'studio-wide', arena: true, room: 'The Stage', cam: 7, time: '8:00 PM',
    kicker: 'Live · Move-in night', title: 'Move-In Night', label: 'Move-In Night', sub: `${arrivals.length} strangers, ${groups.length} groups, one house`,
    cast: [], movein: { arrivals: [...arrivals] }, steps,
  };
}


// ── the Twin Twist (bb/twin-twist.js): two people playing as one, and only the audience knows ──
// The user, 2026-10-06: "the twin twist, how does that work, do we have it in the viewer?" It
// had six classic screens. Now each part is a scene: the night they decide who goes first, every
// swap in the hidden room with the handoff note, the week's job in the Diary Room, the house
// noticing something is off, and the endings (found out, both walk in, both walk out).
function twinScreens(act, ctx) {
  const front = act.front;
  const other = act.other || act.twins?.other || null;
  if (!front) return [];
  const both = [front, other].filter(Boolean);
  const inside = (act.twins?.active || 'a') === 'a' ? front : (other || front);
  const house = (ctx.house || []).filter(n => n !== front);
  const ONLY = ['ONLY YOU KNOW', '#7c5cff'];
  const meter = () => {
    const w = [];
    if (act.exposureLevel != null || act.exposure != null) w.push(`How close the house is to working it out: ${act.exposureLevel ?? Math.round((act.exposure || 0) * 100) + '%'}.`);
    if (act.quota) w.push(`Jobs done: ${act.completed || 0} of ${act.quota}.${act.banked ? ` Banked: $${Number(act.banked).toLocaleString('en-US')}.` : ''}`);
    w.push(`${front} is two people: ${listOf(both)}. The house does not know.`);
    return w;
  };
  const screen = (id, set, title, sub, cast, steps, extra = {}) => ({
    id, kind: 'twin', anchor: ctx.anchor, set, room: ROOM_NAME[set] || 'Storage Room', cam: CAM[set] || 6,
    kicker: `Cam ${String(CAM[set] || 6).padStart(2, '0')} · ${ROOM_NAME[set] || 'Storage room'}`, title, sub, day: ctx.day, time: ACT_TIME.house,
    cast: cast.map((p, i, a) => [p, spread(a.length)[i]]), mood: 'secret', steps, ...extra });
  const prose = (beats, people) => (beats || []).flatMap(b => proseSteps(b.text || b, people));
  const out = [];
  if (act.type === 'twin-open') {
    const weeks = (String((act.rules || [])[2] || '').match(/Last (\d+) weeks/) || [])[1];
    const steps = [
      { k: 'beat', t: `A room the house has never seen. ${listOf(both)} sit facing each other, and they look exactly alike.`, toast: ONLY },
      { k: 'bb', t: `${listOf(both)}. From tonight, the two of you are one houseguest, and that houseguest is called ${front}.`, rule: 1 },
      { k: 'bb', t: 'Nobody in the house will be told. Nobody will be warned. If they work it out, they work it out on their own.', rule: 2 },
      { k: 'bb', t: weeks ? `Last ${word(+weeks)} weeks without being found out, and without ${front} being evicted, and both of you join the game as yourselves.` : `Last long enough without being found out, and both of you join the game as yourselves.`, rule: 3 },
      { k: 'bb', t: 'Every week I will offer you a job that only two people sharing one name could do. The jobs pay. Every one you take is another chance to be seen.', rule: 4 },
      { k: 'bb', t: `Get found out, or get ${front} evicted, and it ends there. The second one of you never plays.`, rule: 5 },
      ...prose(act.beats, both),
      ...(act.goesFirst ? [{ k: 'dr', by: act.goesFirst, t: `I go in first. Whatever I say to people this week, ${act.waits || 'my twin'} has to remember next week. Every single word.` }] : []),
      ...(act.waits ? [{ k: 'dr', by: act.waits, t: `I'm in a room with no windows until it's my turn. I'll be learning that house from a notebook.` }] : []),
    ];
    out.push(screen('bb-twin-open-v', 'storage', 'The Twin Twist', `Two people, one name: ${front}`, both, steps,
      { rulesTitle: 'THE TWIN TWIST · ONLY YOU KNOW', rules: [['ONE NAME', `two people play as ${front}`], ['NOBODY IS TOLD', 'the house has to work it out'],
        ['LAST', weeks ? `${word(+weeks)} weeks unfound, and both enter` : 'long enough unfound, and both enter'], ['THE JOBS', 'a secret job a week, for money'], ['CAUGHT OR EVICTED', 'and it ends there']], why: meter() }));
  }
  if (act.type === 'twin-brief' && act.mission) {
    const m = act.mission;
    const steps = [
      { k: 'bb', t: `${front}. This week's job: ${m.name}.`, toast: ONLY },
      { k: 'bb', t: m.brief },
      ...(m.pay ? [{ k: 'bb', t: `Pull it off, and it pays $${Number(m.pay).toLocaleString('en-US')}.` }] : []),
      act.accepted
        ? { k: 'say', by: inside, t: pickBy(["I'll do it.", "Deal. Give us the week.", "We can do that. Two of us, remember."], `${ctx.week}|twj|${m.id}`) }
        : { k: 'say', by: inside, t: pickBy(["Not this week. It's too risky.", "No. Somebody is already watching me too closely.", "We'll pass. Staying hidden matters more than the money."], `${ctx.week}|twn|${m.id}`) },
      ...prose(act.beats, [...both, ...house]),
    ];
    out.push(screen('bb-twin-brief-v', 'dr', `The Twins' Job · ${m.name}`, act.accepted ? 'Taken' : 'Turned down', [inside], steps, { why: meter() }));
  }
  if (act.type === 'twin-week') {
    if (act.swap) {
      const outgoing = inside === front ? other : front;
      const steps = [
        { k: 'beat', t: `Late at night. The door at the back of ${act.swap.room || 'the storeroom'} opens for exactly as long as it takes two people to change places.`, toast: ONLY },
        ...proseSteps(act.swap.text || '', both),
        ...(act.handoff?.text ? [{ k: 'beat', t: 'The note handed over on the way past:' }, ...proseSteps(act.handoff.text, both)] : []),
        ...(act.handoff && act.handoff.quality != null ? [{ k: 'dr', by: inside, t: act.handoff.quality >= 0.55 ? `That note's good. I know who's angry with who, and who I'm supposed to be friends with. I can do this.` : `Three names and a doodle. I'm walking into that house half blind.` }] : []),
        { k: 'beat', t: inside === front ? `${front} walks back out into the house. Nobody noticed anybody was gone.` : `${inside} walks out into the house as ${front}. Nobody looks up.` },
      ];
      out.push(screen('bb-twin-swap-v', 'storage', 'The Swap', `${outgoing || 'One twin'} out, ${inside} in`, both, steps, { why: meter() }));
    }
    const d = act.debrief;
    if (d?.mission) {
      const steps = [
        { k: 'bb', t: `${front}. The job: ${d.mission.name}.`, toast: ONLY },
        d.worked ? { k: 'bb', t: `It worked.${d.paid ? ` $${Number(d.paid).toLocaleString('en-US')} goes in the bank.` : ''}`, toast: ['JOB DONE', '#12b76a'] } : { k: 'bb', t: 'It did not come off.', toast: ['JOB FAILED', '#ff2e4d'] },
        ...prose(d.beats, [...both, ...house]),
      ];
      out.push(screen('bb-twin-debrief-v', 'dr', "The Twins' Job · How It Went", d.worked ? 'It worked' : 'It did not come off', [inside], steps, { why: meter() }));
    }
    const tells = act.tells;
    if (tells?.beats?.length) {
      const noticers = (tells.notices || []).map(x => x.observer).filter(Boolean);
      const steps = [
        { k: 'beat', t: `${front} has been ${front} all week. Except for the moments ${front} hasn't.`, toast: ONLY },
        ...prose(tells.beats, [...both, ...house]),
        ...(noticers[0] ? [{ k: 'dr', by: noticers[0], t: pickBy([`Something about ${front} is off this week. Same face. Different person. I can't explain it.`, `${front} didn't remember a conversation we had three days ago. Not a detail. The whole thing.`, `I'm not crazy. ${front} laughs differently this week. I'm not saying it out loud yet.`, `${front} was good at that on Monday. Today ${front} wasn't. People don't change that fast.`, `I keep catching ${front} looking at people like they're meeting them for the first time.`, `If I say what I'm thinking about ${front}, everybody will think I've lost it. So I'm writing it down instead.`], `${ctx.week}|twt|${noticers[0]}|${(act.tells?.beats || []).length}`) }] : []),
      ];
      out.push(screen('bb-twin-tells-v', 'kitchen', 'Something Is Off', `${front}, and the people starting to notice`, [front, ...noticers.slice(0, 2)], steps, { why: meter() }));
    }
  }
  if (act.type === 'twin-caught') {
    const teller = act.teller || null;
    const steps = [
      ...(teller ? [{ k: 'beat', t: `${teller} has been watching ${front} for days. Tonight, ${teller} says it out loud.` }] : []),
      ...prose(act.beats, [...both, ...house]),
      { k: 'beat', t: `There are two of them. There have always been two of them.`, big: [front, 'Found out', 'out'], shake: true },
      ...(other ? [{ k: 'dr', by: other, t: `I never even got to walk in. I was one door away, the whole time, and now I never will.` }] : []),
    ];
    out.push(screen('bb-twin-caught-v', 'ceremony', 'Found Out', `The house works out ${front}`, [front, ...(teller ? [teller] : [])], steps, { why: meter() }));
  }
  if (act.type === 'twin-entry' && other) {
    const steps = [
      { k: 'bb', t: 'Houseguests, please gather in the living room.', toast: ['THE TWIN TWIST', '#7c5cff'] },
      ...prose(act.beats, [...both, ...house]),
      { k: 'say', by: front, t: `Hi, everyone. Yeah. There's two of us. This is ${other}.` },
      { k: 'say', by: other, t: `Hi. We've met. Most of you, about four times.` },
      { k: 'beat', t: `${other} joins the game as a houseguest.`, big: [other, 'Joins the game', 'safe'], confetti: true },
    ];
    out.push(screen('bb-twin-entry-v', 'ceremony', 'Both Of Them', `${front} and ${other} join the game`, both, steps, { why: meter() }));
  }
  if (act.type === 'twin-out' && other) {
    const steps = [
      { k: 'beat', t: `${front} walks out of the front door. Waiting outside, in the same clothes, is ${other}.`, door: true },
      { k: 'beat', t: `The house will find out tonight that it evicted two people.`, big: [front, 'Both go home', 'out'] },
      ...prose(act.beats, [...both, ...house]),
    ];
    out.push(screen('bb-twin-out-v', 'ceremony', 'Two Go Home', `${front} and ${other}`, both, steps, { why: meter() }));
  }
  return out;
}


// ── Dynamic Duos (bb/duos.js): the house in pairs, the Golden Key, the chain ──
// The user, 2026-10-06: "build that" (the Dynamic Duos were classic screens dropped into the
// stepped week). The night the pairs are read out, one at a time, with what they are to each
// other; the key handed to whoever's partner just walked out; the keys running out; an orphan
// chained to another; and the pairs living with it.
const DUO_REACT = {
  Together: [`Of course they put us together. We're going to be nominated as a couple, aren't we?`, `Good. If I'm going up, I'd rather go up with you.`],
  Family: [`Family. Great. If one of us goes, the other one has to watch.`, `I've spent my whole life sharing things with you. Now I'm sharing a nomination.`],
  Friends: [`At least it's somebody I actually like.`, `We've survived worse than this. Probably.`],
  History: [`Out of everybody in this house. Of course.`, `We're going to have to talk to each other now. Properly.`],
  '': [`Okay. Partner. Let's not get each other evicted.`, `I didn't choose this. But fine. We play it together.`],
};
const REL_GROUP = { married: 'Together', engaged: 'Together', partners: 'Together', dating: 'Together',
  twins: 'Family', siblings: 'Family', 'step-siblings': 'Family', 'parent-child': 'Family', grandparent: 'Family', 'aunt-uncle': 'Family', cousins: 'Family', 'in-laws': 'Family',
  'best-friends': 'Friends', 'childhood-friends': 'Friends', 'old-friends': 'Friends', roommates: 'Friends', colleagues: 'Friends', teammates: 'Friends',
  estranged: 'History', exes: 'History' };
function duosScreens(act, ctx) {
  const out = [];
  const host = ctx.host || 'Valeria';
  const screen = (id, set, title, sub, cast, steps, extra = {}) => ({
    id, kind: 'duos', anchor: ctx.anchor, set, room: ROOM_NAME[set] || 'Living Room', cam: CAM[set] || 4,
    kicker: `Cam ${String(CAM[set] || 4).padStart(2, '0')} · ${ROOM_NAME[set] || 'Living room'}`, title, sub, day: ctx.day, time: ACT_TIME.house,
    cast: cast.map((p, i, a) => [p, spread(a.length)[i]]), mood: 'ceremony', tvObj: true, steps, ...extra });
  const prose = (beats, people) => (beats || []).flatMap(b => proseSteps(b.text || b, people));
  const house = ctx.house || [];
  if (act.type === 'duos-open') {
    const pairs = act.pairs || [];
    const keyed = act.goldenKey !== false;
    const steps = [
      { k: 'bb', t: 'Houseguests, please gather in the living room.' },
      { k: 'bb', t: 'Nobody walked into this house alone. From tonight, you play in pairs, and the Head of Household nominates a PAIR, not two houseguests.', rule: 1, toast: ['DYNAMIC DUOS', '#d99a10'] },
      keyed ? { k: 'bb', t: `If your partner is evicted, you are handed a Golden Key: safe from nomination and eviction until ${word(act.keyAt || 10)} of you are left.`, rule: 2 }
        : { k: 'bb', t: 'There are no Golden Keys. Lose your partner, and you can be put on that block on your own.', rule: 2 },
      keyed ? { k: 'bb', t: 'A key holder does not compete. You still vote, and you can still win this game.', rule: 3 }
        : { k: 'bb', t: 'And you will not be on your own for long. The next person who loses a partner will be chained to you.', rule: 3 },
    ];
    pairs.forEach(([a, b], i) => {
      const label = (act.kin || [])[i] || 'A pair';
      const group = (REL_GROUP[(act.kinKeys || [])[i]] || '');
      steps.push({ k: 'bb', t: `${a} and ${b}. ${label}.`, big: [`${a} & ${b}`, label, 'safe'] });
      const r = DUO_REACT[group] || DUO_REACT[''];
      steps.push({ k: 'say', by: i % 2 ? b : a, t: pickBy(r, `${ctx.week}|duo|${a}|${b}`) });
    });
    for (const n of act.singles || []) {
      steps.push({ k: 'bb', t: `${n}. You came in alone.`, big: [n, 'Came in alone', 'out'] });
      steps.push({ k: 'dr', by: n, t: pickBy(keyed
        ? [`No partner means no key. Everybody else has somebody to lose. I've got nobody to protect me.`, `Everybody's paired off and I'm standing here on my own. Fine. Nobody can drag me down with them, either.`, `Alone. No key coming, ever. So I'd better make myself useful to every pair in this house.`, `I came in alone and I'll play alone. At least I only have to keep myself alive.`]
        : [`On my own. Which means I'm the cheapest nomination in the house. Every Head of Household knows it.`, `Alone means one name on the block instead of two. I'm the easy option, and everybody just found that out.`, `Everybody else has a partner to hide behind. I've got nobody.`], `${ctx.week}|alone|${n}`) });
    }
    const cast = [...pairs.flat(), ...(act.singles || [])];
    out.push(screen('bb-duos-open-v', 'ceremony', 'Dynamic Duos', `${word(pairs.length)} pairs${(act.singles || []).length ? `, ${word(act.singles.length)} alone` : ''}`, cast.slice(0, 8), steps,
      { rulesTitle: 'DYNAMIC DUOS', rules: keyed ? [['IN PAIRS', 'nominated two at a time, as a pair'], ['THE GOLDEN KEY', `lose your partner: safe until ${word(act.keyAt || 10)} are left`], ['SIDELINED', 'a key holder votes, but never competes']]
        : [['IN PAIRS', 'nominated two at a time, as a pair'], ['ALONE', 'lose your partner and you can go up on your own'], ['CHAINED', 'the next one alone is chained to you']] }));
  }
  if (act.type === 'duos-key' && act.holder) {
    const steps = [
      { k: 'bb', t: `${act.holder}. ${act.partner} has been evicted. You are now holding a Golden Key.`, big: [act.holder, 'Golden Key', 'safe'], toast: ['GOLDEN KEY', '#f5c542'] },
      ...prose(act.beats, [act.holder, act.partner]),
      { k: 'dr', by: act.holder, t: pickBy([`I'm safe, and I've never felt less like I'm playing. ${act.partner} is gone and I'm just... watching now.`, `A key. Safe until ${word(act.keyAt || 10)}. And no way to do anything with it but vote.`, `I'd give this key back in a second to have ${act.partner} back in this house.`], `${ctx.week}|key|${act.holder}`) },
    ];
    out.push(screen('bb-duos-key-v', 'dr', 'The Golden Key', `${act.holder}, without ${act.partner}`, [act.holder], steps));
  }
  if (act.type === 'duos-keys-expire') {
    const steps = [
      { k: 'bb', t: `Houseguests. There are ${word(act.keyAt || 10)} of you left. The Golden Keys are done.`, toast: ['KEYS EXPIRE', '#ff2e4d'] },
      ...(act.holders || []).map(n => ({ k: 'beat', t: `${n} is back in the game.`, big: [n, 'Back in the game', 'out'] })),
      ...prose(act.beats, act.holders || []),
    ];
    out.push(screen('bb-duos-expire-v', 'ceremony', 'The Keys Expire', listOf(act.holders || []), act.holders || [], steps));
  }
  if (act.type === 'duos-repair') {
    const steps = [{ k: 'bb', t: 'Houseguests, please gather in the living room. Some of you have lost your partner. You will not stay alone.', toast: ['RE-PAIRED', '#d99a10'] }];
    for (const [a, b] of act.pairs || []) {
      steps.push({ k: 'bb', t: `${a}. ${b}. From now on, you are a pair.`, big: [`${a} & ${b}`, 'Chained by Big Brother', 'out'] });
      steps.push({ k: 'dr', by: a, t: pickBy([`I didn't choose ${b}. Nobody asked me. And now ${b} going up means I go up.`, `${b} and I barely speak. Now we're a pair. That's going to be a fun conversation.`, `Of all the people they could chain me to. Fine. ${b}, let's not get each other evicted.`], `${ctx.week}|rep|${a}`) });
    }
    steps.push(...prose(act.beats, [...(act.pairs || []).flat(), ...(act.waiting ? [act.waiting] : [])]));
    out.push(screen('bb-duos-repair-v', 'ceremony', 'Re-Paired', (act.pairs || []).map(p => p.join(' & ')).join(', '), (act.pairs || []).flat().slice(0, 6), steps));
  }
  return out;
}

// ── the evictee's interview ────────────────────────────────────────────
// Out of the front door and into the studio: the walk to the crowd, the host's questions, what
// they never saw (who organised it, who lied), the goodbye messages the house recorded, their
// last word, and where they are going now. The words are the engine's (ep.evictionInterview).
function interviewScreen(iv, ctx, host, row) {
  const ev = iv.evictee;
  if (!ev) return null;
  const h = iv.host || host;
  const T = x => stripTags(String(x || '')).replace(/^["“]|["”]$/g, '').trim();
  const steps = [];
  steps.push({ k: 'beat', t: T(iv.walkout?.line) || `${ev} walks out of the front door to the studio crowd.`, door: true });
  steps.push({ k: 'host', by: h, t: pickBy([`${ev}, come and sit down. Welcome.`, `Welcome, ${ev}! Have a seat.`, `${ev}, come on over.`], `${ctx.week}|ivhi`) });
  // the reactions are prose with the evictee's words inside them: split into the staging and the
  // line (stripping the outer quotes cut '"Priya? I sat across from her..." The sentence just
  // stops there.' into a beat that opened mid-quotation)
  const said = x => proseSteps(x, [ev]);
  if (iv.homecoming?.line) steps.push(...said(iv.homecoming.line));
  for (const q of iv.questions || []) {
    if (q.q) steps.push({ k: 'host', by: h, t: T(q.q) });
    if (q.a) steps.push({ k: 'say', by: ev, t: T(q.a) });
    if (q.wrong) steps.push({ k: 'beat', t: `${ev} has named the wrong person, and the host knows it.` });
  }
  if (iv.truth) {
    const t = iv.truth;
    steps.push({ k: 'host', by: h, t: T(iv.hostLines?.truth) || 'Before the goodbyes, there are a couple of things you should know.' });
    if (t.organizer) steps.push({ k: 'host', by: h, t: `${t.organizer} organised it${t.alliance ? `, with ${t.alliance}` : ''}.` });
    for (const liar of t.liars || []) steps.push({ k: 'host', by: h, t: `${liar} told the house one name and voted another.` });
    if (t.reaction) steps.push(...said(t.reaction));
  }
  if ((iv.goodbyes || []).length) {
    steps.push({ k: 'host', by: h, t: T(iv.hostLines?.goodbyes) || 'Your housemates recorded some messages, in case tonight went the way it went.' });
    for (const g of iv.goodbyes) {
      if (g.tone === 'montage') { steps.push({ k: 'beat', t: T(g.text) }); continue; }
      steps.push({ k: 'dr', by: g.name, t: T(g.text) });
      if (g.react) steps.push(...said(g.react));
    }
  }
  // BB27: when the Accomplice was evicted, the Mastermind had a goodbye message of his own for her.
  const acc = globalThis.gs?.bb?.accomplice;
  if (row?.themeId === 'summer-of-mystery' && acc?.name === ev && !acc.caught) {
    const vcM = voiceOf('summer-of-mystery', row?.themeMood).color;
    steps.push({ k: 'host', by: h, t: 'There is one more message for you. It is not from a houseguest.', toast: ['ONE MORE MESSAGE', '#4fbf8b'] });
    steps.push({ k: 'voice', own: true, by: 'The Mastermind', vc: vcM, t: `${ev}. You kept my secret from the first night to the front door, and nobody in that house ever knew. The Hotel Mystère thanks you for your service.` });
    steps.push({ k: 'say', by: ev, t: 'I did. And nobody ever caught me.' });
  }
  if (iv.parting) steps.push({ k: 'say', by: ev, t: T(iv.parting) });
  steps.push({ k: 'beat', t: iv.joinsJury ? (row?.isFinale ? `${ev} takes the last seat on the jury bench${iv.juryNumber ? `, juror number ${word(iv.juryNumber)}` : ''}. In an hour, ${ev} votes for the winner.`
    : `${ev} is going to the jury house${iv.juryNumber ? `, juror number ${word(iv.juryNumber)}` : ''}.`) : `${ev} is going home.`,
    big: [ev, iv.joinsJury ? 'To the jury' : 'Going home', iv.joinsJury ? 'safe' : 'out'] });
  // the first juror is the night the season changes: the host says so (the user, 2026-10-07)
  if (iv.joinsJury && iv.juryNumber === 1 && !row?.isFinale) steps.push({ k: 'host', by: h, t: `${ev} is the first member of the jury. From tonight, every houseguest who leaves the house will help decide who wins Big Brother.`, toast: ['THE JURY BEGINS', '#e8c98a'] });
  // the final four's eviction leaves three, and the finale is next: the host says it
  if ((row?.houseAtStart || []).length === 4) steps.push({ k: 'host', by: h, t: `Three houseguests remain. Next comes the three-part final Head of Household competition, and then finale night, when the jury decides who wins Big Brother.`, toast: ['FINALE NIGHT IS NEXT', '#e8c98a'] });
  return { id: 'bb-interview-v', kind: 'interview', anchor: 'evict', label: 'Evictee Interview',
    set: 'studio', arena: true, room: 'The Studio', cam: 7, kicker: 'Live · The studio', title: 'The Exit Interview', sub: `${h} and ${ev}`,
    day: ctx.day, time: 'LIVE', cast: [[ev, 36], [h, 64]], seated: { [ev]: 'G', [h]: 'H' }, steps };
}

// ── the jury house ─────────────────────────────────────────────────────
// The user, 2026-10-06: "does the jury house have a viewer? adapt it too". The lodge night the
// engine records (bb/jury-house.js): the newcomer walking in with what they think they know, the
// long week, the roundtable (every player still in the house argued for and against), working the
// room, and the night before the finale. Its prose carries quotations; each is split into the
// staging and the spoken line, spoken by the person the line names first. The side panel is the
// board: where every juror leans, from before the roundtable until it has been played.
function proseSteps(text, players = []) {
  const t = stripTags(String(text || '')).trim();
  if (!t) return [];
  const re = /[“"]([^”"]+)[”"]/g;
  const parts = [];
  let last = 0, m;
  while ((m = re.exec(t))) {
    const before = t.slice(last, m.index);
    // a short quoted phrase in the middle of a sentence ('starts a sentence with "when we vote"
    // and the room...') is part of the narration, not a line somebody speaks
    if (/^[a-z]/.test(m[1]) && m[1].length < 40 && /[A-Za-z]\s$/.test(before)) continue;
    parts.push({ narr: before }); parts.push({ quote: m[1] }); last = m.index + m[0].length;
  }
  parts.push({ narr: t.slice(last) });
  if (!parts.some(x => x.quote)) return [{ k: 'beat', t }];
  const esc = n => n.replace(/[.*+?^${}()|[\]\\]/g, x => '\\' + x);
  const who = players.map(esc).join('|') || 'NOBODY';
  // an attribution on its own ("says Misha", "Misha says.", "MK asks") is not narration
  const ATTR = new RegExp('^[\\s,.;:—-]*(?:(?:' + who + ')\\s+(?:says|asks|adds|replies|snaps|mutters)|(?:says|asks|adds|replies|snaps|mutters)\\s+(?:' + who + '))[\\s,.;:—-]*', 'i');
  const out = [];
  let speaker = null;
  for (const x of parts) {
    if (x.narr != null) {
      // the speaker of the next quotation is the person named earliest in the narration before it
      // an attribution straight after a quotation names who said it ("You weren't there," Hicks
      // says): that line is Hicks's, whoever the narration before it named
      const tag = new RegExp('^[\\s,]*(?:(' + who + ')\\s+(?:says|asks|adds|replies|snaps|mutters|whispers)|(?:says|asks|adds|replies|snaps|mutters|whispers)\\s+(' + who + '))\\b').exec(x.narr);
      const tagged = tag ? tag[1] || tag[2] : null;
      const prevSay = out[out.length - 1];
      if (tagged && prevSay && prevSay.k === 'say') { prevSay.by = tagged; speaker = tagged; }
      const named = players.filter(p => x.narr.includes(p)).sort((a, b) => x.narr.indexOf(a) - x.narr.indexOf(b));
      if (named.length && !tag) speaker = named[0];
      // what is left after an attribution ("..., and that is where it stops") is its own sentence
      const n0 = x.narr.replace(ATTR, '').replace(/^[\s,.;:—-]+/, '').trim();
      const n = n0.replace(/^and\s+/i, '').replace(/^[a-z]/, c => c.toUpperCase());
      // "the wall says," / "slowly," / "she adds quietly," between quotations is not a line of its own
      const leftover = n0.length < 30 && /^(to|at|toward|towards|into|across)\b/i.test(n0);
      const manner = leftover || n0.length < 28 && !/[.!?]$/.test(n0.replace(/,$/, '')) && /,$|^(?:[a-z]|the |and )/.test(n0);
      const said = /\b(says|asks|adds|replies|snaps|mutters|whispers)\b[,.]?$/i.test(n);
      // a beat that led into the quotation ends on a full stop, not ",." ("tells the dark monitor,.")
      if (n.length > 2 && !manner && !said) out.push({ k: 'beat', t: /[.!?]$/.test(n) ? n : n.replace(/[\s,;:—-]+$/, '') + '.' });
      continue;
    }
    const by = speaker || players[0] || null;
    const q = x.quote.trim();
    const prev = out[out.length - 1];
    // a quotation broken by its attribution is one line: "Before we go any further," the wall
    // says, "let's look at week 1." continues after its comma
    if (prev && prev.k === 'say' && prev.by === by) {
      // it carries on with a comma only when the second part does ("...," she says, "and then");
      // a new sentence ("...could lose," Mia says. "That's not a game") gets a full stop first
      const cont = /^[a-z]/.test(q);
      prev.t = cont ? prev.t.replace(/[,.]$/, '') + ', ' + q : prev.t.replace(/,$/, '.') + ' ' + q;
    } else out.push(by ? { k: 'say', by, t: q } : { k: 'beat', t: '"' + q + '"' });
  }
  for (const o of out) if (o.k === 'say') o.t = o.t.replace(/,$/, '.');
  return out;
}
function juryBoard(reads, contenders) {
  const out = [];
  for (const [j, row] of Object.entries(reads || {})) {
    const ranked = contenders.filter(p => row[p] != null).sort((a, b) => row[b] - row[a]);
    if (!ranked.length) continue;
    out.push(`${j} leans to ${ranked[0]}${ranked.length > 1 ? `; least of all ${ranked.at(-1)}` : ''}.`);
  }
  return out;
}
const pStatsSafe = n => (ROSTER || []).find(p => p.name === n)?.stats || {};
function juryHouseScreen(act, ctx) {
  const residents = act.residents || [];
  if (!residents.length) return null;
  const contenders = Object.keys(Object.values(act.reads || {})[0] || {});
  const before = ['Where the jury leans, before tonight:', ...juryBoard(act.readsBefore, contenders)];
  const after = ['Where the jury leans now:', ...juryBoard(act.reads, contenders)];
  const steps = [];
  const alone = residents.length === 1;
  // the same night, different words: the bookends rotate with the week (the user, 2026-10-07:
  // "the jury house is super repetitive, always the same sentence")
  const wk = Number(act.week || ctx.week || 0);
  const by = list => list[wk % list.length];
  steps.push({ k: 'beat', t: act.newcomer ? (alone ? `The jury house. The lodge is empty. A car pulls up outside.` : by([
    `The jury house. A car pulls up outside, and the jurors inside go quiet.`,
    `Headlights sweep across the lodge window. Somebody says, "That's another one."`,
    `The jury house, after dark. Gravel crunches in the driveway, and every head turns toward the door.`,
    `The lodge. The jurors have been waiting all evening to find out who's next. A car door slams outside.`,
    `The jury house. Somebody turns the music off. They can hear the car before they see it.`,
  ])) : `The jury house, at night. A lamp in the window, and nobody on a clock.`, why: before });
  for (const a of act.acts || []) {
    if (a.roundtable) {
      steps.push({ k: 'beat', t: by([
        'The jurors pull their chairs into a circle. It is time for the roundtable.',
        'After dinner, the jurors gather around the table. Nobody needs to be told what happens next.',
        'Somebody puts the kettle on and the chairs come round the table. Roundtable night.',
        'The fire is low, the mugs are full, and every juror has something to say tonight.',
        'The jurors sit down around the table. It is time to talk about who deserves to win.',
      ]), toast: ['THE ROUNDTABLE', '#e8c98a'] });
      // the conversation the engine wrote (jury-house.js tableTalk): the case for, the case
      // against, the answer, the juror sent home on that player's week, a third juror's verdict
      const OPEN = [n => `Okay. ${n}. Who wants to start?`, n => `What about ${n}?`, n => `${n} next.`, n => `And ${n}.`, n => `Let's do ${n}.`, n => `Let's talk about ${n}.`, n => `Who has something to say about ${n}?`, n => `${n}. Go.`, n => `Right. ${n}.`, n => `Can we do ${n} now?`];
      const chair = residents.slice().sort((x, y) => (pStatsSafe(y).social || 5) - (pStatsSafe(x).social || 5))[0];
      (a.roundtable.lines || []).forEach((l, i) => {
        if (l.talk?.length) {
          // whoever opens it is not the one about to make the case (they asked and answered themselves)
          const opener = residents.find(n => n === chair && !l.talk.some(t => t.by === n)) || residents.find(n => !l.talk.some(t => t.by === n) && n !== l.third) || null;
          if (opener) steps.push({ k: 'say', by: opener, t: OPEN[(i + wk * 3) % OPEN.length](l.player) });
          else steps.push({ k: 'beat', t: `On ${l.player}.` });
          for (const t of l.talk) steps.push({ k: 'say', by: t.by, t: t.t });
          if (l.third && l.thirdText) steps.push({ k: 'say', by: l.third, t: l.thirdText });
        } else {
          steps.push({ k: 'beat', t: `On ${l.player}.` });
          steps.push(...proseSteps(l.backText, [l.backer, l.player]));
          steps.push(...proseSteps(l.doubtText, [l.doubter, l.player]));
        }
      });
      // the juror the table moved most says so, and who moved them
      let moved = null;
      for (const l of a.roundtable.lines || []) for (const j of residents) {
        const d = (act.reads?.[j]?.[l.player] ?? 0) - (act.readsBefore?.[j]?.[l.player] ?? 0);
        if (j !== l.backer && j !== l.doubter && (!moved || Math.abs(d) > Math.abs(moved.d))) moved = { j, d, l };
      }
      if (moved && Math.abs(moved.d) > 0.15) {
        const { j, d, l } = moved;
        steps.push({ k: 'dr', by: j, t: d > 0
          ? `I came in tonight not sold on ${l.player}. Then ${l.backer} laid it all out, and I'm starting to think ${l.player} deserves this more than I wanted to admit.`
          : `I came in tonight leaning toward ${l.player}. Then ${l.doubter} said what ${l.doubter} said, and I can't stop thinking about it. I'm not sure anymore.` });
      }
      steps.push({ k: 'beat', t: by([
        'The circle breaks up. The arguments are over for tonight, and the votes are a little less certain than they were.',
        'One by one, the jurors drift off to bed. Nobody has changed their vote out loud, but a few look less sure.',
        'The roundtable ends the way it always does: with more questions than answers.',
        'The mugs go cold. The jurors stay where they are for a while, thinking about everything that was said.',
        'Somebody finally says goodnight, and the circle breaks. The argument will pick up again tomorrow.',
      ]), why: after });
      continue;
    }
    // the act's title is a card on its first line, not a line of its own ('The Long Week.')
    const first = steps.length;
    for (const b of a.beats || []) {
      if (b.dr) { steps.push({ k: 'dr', by: (b.players || [])[0] || null, t: b.text }); continue; }
      steps.push(...proseSteps(b.text, b.players || []));
    }
    if (a.title !== 'The Door Opens' && steps[first]) steps[first] = { ...steps[first], toast: [a.title.toUpperCase(), '#e8c98a'] };
  }
  if (!(act.acts || []).some(a => a.roundtable) && steps.length) steps[steps.length - 1] = { ...steps[steps.length - 1], why: after };
  return { id: `bb-jury-house-${act.week || ctx.week}-v`, kind: 'juryhouse', anchor: 'evict', label: act.full ? 'Jury House · Roundtable' : 'Jury House',
    set: 'juryhouse', room: 'The Jury House', cam: 12, kicker: 'Elsewhere · The jury house', title: 'The Jury House', sub: `${listOf(residents)}`,
    day: ctx.day, time: 'NIGHT', lodge: true, cast: residents.slice(0, 8).map((n, i, a) => [n, spread(a.length)[i]]), steps };
}

// ── a twist announcement, stepped ──────────────────────────────────────
// The house is called to the living room and the host reads the rule on the screen, with the
// rules card filling as it goes, then the line that lands (sting), then how the house takes it
// (the engine's reaction beats). The user, 2026-10-06: "do we have twist announcements in the viewer?"
function twistAnnounceScreen(act, ctx, host) {
  // The premiere screen plays BB27's night itself: the host cannot announce her own kidnapping.
  const ann = (act.announced || []).filter(Boolean).filter(a => a.twist !== 'bb-premiere-mystery' && a.twist !== 'bb-temptation-premiere'
    && a.twist !== 'bb-machine-premiere' && a.twist !== 'bb-jankie-world' && a.twist !== 'bb-teams');
  if (!ann.length) return null;
  // A theme's antagonist reads his own twists (the Mastermind announced his on the screen, not the host).
  const ta = act.themeAnnouncer;
  if (ta?.line && ann.length === 1) {
    const sentences = t => String(t || '').split(/(?<=[.!?])\s+(?=[A-Z])/).map(x => x.trim()).filter(Boolean);
    const rules = sentences(ann[0].rule).map((x, i) => [i ? '' : String(ann[0].name || 'THE TWIST').toUpperCase(), x]);
    const steps = [{ k: 'bb', t: 'Houseguests, please gather in the living room.' },
      { k: 'beat', t: 'The screen flickers on. It is not the host.' },
      ...sentences(ta.line).map((x, i) => ({ k: 'voice', own: true, by: ta.speaker, t: x, ...(i === 0 ? { toast: [String(ann[0].name || '').toUpperCase(), '#7c5cff'] } : {}) })),
      ...(ann[0].sting ? [{ k: 'voice', own: true, by: ta.speaker, t: ann[0].sting, shake: true }] : []),
      { k: 'beat', t: 'The screen goes dark. Nobody moves.' }];
    rules.forEach((_, i) => { if (steps[3 + i]) steps[3 + i].rule = i + 1; });
    const vc = voiceOf(ctx.row?.themeId, ctx.row?.themeMood).color;
    for (const st of steps) if (st.k === 'voice') st.vc = vc;
    for (const b of act.socialBeats || []) steps.push(...(b.lines?.length ? scriptSteps(b.lines) : [{ k: 'beat', t: stripTags(b.text) }]));
    return { id: act.secondCall ? 'bb-twist-2-v' : 'bb-twist-v', kind: 'twist', anchor: ctx.anchor || 'start', label: `${ann[0].name || 'Twist'}: Announcement`,
      set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · Living room', title: 'The Announcement', sub: ann[0].name || '',
      day: ctx.day, time: '9:00 PM', tvObj: true, seated: seatLiving([], ctx.house.filter(n => !ctx.hidden?.has?.(n))),
      rules, rulesTitle: `${String(ann[0].name || 'THE TWIST').toUpperCase()} · HOW IT WORKS`, steps };
  }
  const sentences = t => String(t || '').split(/(?<=[.!?])\s+(?=[A-Z])/).map(x => x.trim()).filter(Boolean);
  const rules = [];
  const steps = [{ k: 'bb', t: act.secondCall ? 'Houseguests, please gather in the living room. There is more.' : 'Houseguests, please gather in the living room.' }];
  steps.push({ k: 'host', by: host, t: act.secondCall ? `Houseguests, one more thing.`
    : ctx.week === 1 && ctx.anchor === 'start' ? `Houseguests, before you compete for the first Head of Household, there is something you need to know.`
      : `Hello, houseguests. I hope you're settled in, because I'm about to change everything.` });
  for (const a of ann) {
    const name = a.name || 'A twist';
    steps.push({ k: 'host', by: host, t: `Introducing: ${name.toUpperCase()}.`, toast: [name.toUpperCase(), '#7c5cff'] });
    for (const s of sentences(a.rule)) { rules.push([rules.length ? '' : name.toUpperCase(), s]); steps.push({ k: 'host', by: host, t: s, rule: rules.length }); }
    if (a.sting) steps.push({ k: 'host', by: host, t: a.sting, shake: true });
  }
  steps.push({ k: 'beat', t: 'The screen goes dark. Nobody moves.' });
  for (const b of act.socialBeats || []) steps.push(...(b.lines?.length ? scriptSteps(b.lines) : [{ k: 'beat', t: stripTags(b.text) }]));
  return { id: act.secondCall ? 'bb-twist-2-v' : 'bb-twist-v', kind: 'twist', anchor: ctx.anchor || 'start', label: ann.length === 1 ? `${ann[0].name || 'Twist'}: Announcement` : 'The Announcement',
    set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony, kicker: 'Live · Living room', title: 'The Announcement', sub: ann.map(a => a.name).filter(Boolean).join(' · '),
    day: ctx.day, time: '9:00 PM', tvObj: true, seated: seatLiving([], ctx.house.filter(n => !ctx.hidden?.has?.(n))),
    rules, rulesTitle: `${ann.map(a => (a.name || 'THE TWIST').toUpperCase()).join(' · ')} · HOW IT WORKS`, steps };
}

// Twist acts whose classic screen goes exactly where the act happened.
const TWIST_SLOT = /^(rivals-|twist-announcement|duos-open|twin-|saboteur-|hacker|roadkill|coin|pandoras|power-played|interrogation|mystery-)/;

// ── what airs ──────────────────────────────────────────────────────────
// A simulated week holds a hundred and more house beats; an episode airs a
// handful between ceremonies (ADDING-A-SHOW §17.1 #7). Each stretch airs its
// most dramatic scenes, in the order they happened. Everything else stays in
// the transcript. Scripted scenes (dialogue) outrank narrated ones.
export const AIRS_PER_STRETCH = { start: 4, hoh: 4, noms: 4, veto: 3, cer: 4, evict: 2 };
const BADGE_DRAMA = { red: 3, gold: 3, orange: 2.6, purple: 2.4, blue: 2, green: 1.5, grey: 1 };
export function dramaOf(beat) {
  return (BADGE_DRAMA[beat.badgeClass] || 1) + (beat.lines?.length ? 2.5 : 0) + Math.min(4, (beat.players || []).length) * 0.25
    + (beat.category === 'deals' || beat.category === 'strategy' ? 0.5 : 0);
}
// ── House Life: one segment per stretch of the week ─────────────────────
// The default way house life airs (the user, 2026-10-05: one-moment screens
// with two-line conversations "is dumb"). Every stretch between ceremonies is
// ONE screen, and the camera cuts room to room through it. Beats that share
// people join into one conversation; when the next beat's people differ,
// somebody walks in or heads off first, so nobody hears a line that was not
// said in front of them. Nothing here invents a fact: it stages the beats the
// engine wrote. The old one-scene-per-screen view is still there (houseLife:
// 'scenes', the "Scenes" button).
export const HOUSE_LIFE_CAP = { start: 9, hoh: 9, noms: 9, veto: 7, cer: 9, evict: 5 };
const DOING = {
  kitchen: ['is making something to eat', 'are making something to eat'],
  ceremony: ['is on the sofa', 'are on the sofas'],
  bedroom: ['is lying on a bed', 'are sitting on the beds'],
  yard: ['is out by the pool', 'are out by the pool'],
  hoh: ['is up in the HOH room', 'are up in the HOH room'],
  dining: ['is at the dining table', 'are at the dining table'],
};
const MOOD_RANK = { drama: 5, scheming: 4, secret: 3, deals: 2, ceremony: 1, house: 0 };
const ROOM_IN = { kitchen: 'kitchen', ceremony: 'living room', bedroom: 'bedroom', hoh: 'HOH room', yard: 'backyard', dining: 'dining room' };
const setOfBeat = b => { const s = ROOM_SET[b.location] || 'ceremony'; return s === 'dr' ? 'ceremony' : s; };
const beatSteps = b => (b.lines?.length
  ? b.lines.map(l => ({ k: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, t: l.text }))
  : [{ k: 'beat', t: stripTags(b.text) }]);

/** Who is physically in a beat: the people who speak out loud (or, for a staged-only beat, its players). */
const presentIn = b => {
  const said = [...new Set((b.lines || []).filter(l => l.kind !== 'dr' && l.kind !== 'beat' && l.by).map(l => l.by))];
  if (said.length) return said.slice(0, 4);
  if ((b.lines || []).length && (b.lines || []).every(l => l.kind === 'dr')) return [];   // a Diary Room aside
  return (b.players || []).slice(0, 4);
};

/**
 * Join a stretch's beats into conversations. A beat joins the conversation
 * already holding one of its speakers (anywhere in the stretch, not only the
 * one just before it), up to 4 people and 18 lines a conversation; a Diary
 * Room aside joins the conversation its speaker is in, or the latest one.
 * Within a conversation the beats keep the order they happened in.
 */
export function conversationsOf(beats) {
  const convos = [];
  const size = b => b.lines?.length || 1;
  const order = new Map(beats.map((b, i) => [b, i]));
  // the talk first, so an aside can find the conversation it is about wherever it sits
  for (const b of beats) {
    const here = presentIn(b);
    if (!here.length) continue;
    const fit = convos.find(c => here.some(n => c.people.has(n))
      && new Set([...c.people, ...here]).size <= 4 && c.lines + size(b) <= 18);
    if (fit) { fit.beats.push(b); here.forEach(n => fit.people.add(n)); fit.lines += size(b); }
    else convos.push({ beats: [b], people: new Set(here), lines: size(b) });
  }
  // A Diary Room aside joins a conversation only if it is ABOUT the people in it: a line
  // about kissing Ripper does not belong in an alliance talk Ripper is not part of. An
  // aside about nobody on stage airs on its own, in the Diary Room.
  const talk = convos.slice();
  for (const b of beats) {
    if (presentIn(b).length) continue;
    const speaker = (b.lines || [])[0]?.by;
    const about = (b.players || []).filter(n => n !== speaker);
    // ...and only if it is the same KIND of moment: "we finally said it out loud" about a
    // couple is not a comment on the same couple's argument (the user, 2026-10-05)
    const fitsTalk = t => presentIn(t).length && t.category === b.category && [speaker, ...about].every(n => (t.players || []).includes(n));
    const home = talk.find(c => c.beats.some(fitsTalk));
    if (home) { home.beats.push(b); home.lines += size(b); continue; }
    convos.push({ beats: [b], people: new Set([speaker].filter(Boolean)), lines: size(b), diary: true, at: order.get(b) });
  }
  for (const c of convos) {
    c.beats.sort((x, y) => order.get(x) - order.get(y));
    c.at = order.get(c.beats[0]);
    // a conversation opens on the talk, not on somebody's aside about it
    if (c.diary) continue;
    // ...and an aside airs straight after the moment it is about (the last talk with those people in it)
    const asides = c.beats.filter(x => !presentIn(x).length);
    const talk = c.beats.filter(x => presentIn(x).length);
    for (const x of asides) {
      const sp = (x.lines || [])[0]?.by;
      const about = (x.players || []).filter(n => n !== sp);
      const want = about.length ? about : [sp];
      let at = -1;
      talk.forEach((t, i) => { if (t.category === x.category && want.every(n => (t.players || []).includes(n)) && (order.get(t) < order.get(x) || at < 0)) at = i; });
      if (at < 0) at = talk.findIndex(t => order.get(t) > order.get(x)) - 1;
      talk.splice(Math.max(at, 0) + 1, 0, x);
    }
    c.beats = talk;
  }
  return convos.sort((x, y) => x.at - y.at);
}

function houseLifeScreen(beats, ctx, n) {
  const steps = [];
  let mood = 'house';
  const spots = k => { const xs = spread(k.length); return k.map((p, i) => [p, xs[i]]); };
  for (const c of conversationsOf(beats)) {
    if (c.diary) {
      const who = [...c.people];
      const dl = c.beats.flatMap(beatSteps);
      if (dl.length) dl[0] = { ...dl[0], scene: { set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, kicker: 'Cam 01 · Diary room', cast: who.map(p => [p, 50]), mood: sceneMood(c.beats[0]) } };
      steps.push(...dl);
      continue;
    }
    let here = [];
    let set = null;
    let started = false;
    for (const b of c.beats) {
      const people = presentIn(b);
      const bmood = sceneMood(b);
      if ((MOOD_RANK[bmood] || 0) > (MOOD_RANK[mood] || 0)) mood = bmood;
      if (!people.length && started) { steps.push(...beatSteps(b)); continue; }   // a Diary Room aside, mid-talk
      const who = people.length ? people : [(b.lines || [])[0]?.by].filter(Boolean);
      const bset = setOfBeat(b);
      const scene = { set: bset, room: ROOM_NAME[bset], cam: CAM[bset], kicker: `Cam ${String(CAM[bset]).padStart(2, '0')} · ${ROOM_NAME[bset]}`, cast: spots(who), mood: bmood };
      if (!started) {
        const [one, many] = DOING[bset] || DOING.ceremony;
        steps.push({ k: 'beat', t: `${ROOM_NAME[bset]}. ${listOf(who)} ${who.length === 1 ? one : many}.`, scene });
        started = true;
      } else {
        // the same talk, continued: people come and go, or it moves rooms
        const stay = who.filter(p => here.includes(p));
        const joins = who.filter(p => !here.includes(p));
        const leaves = here.filter(p => !who.includes(p));
        const bits = [];
        if (leaves.length) bits.push(`${listOf(leaves)} ${leaves.length === 1 ? 'heads' : 'head'} off.`);
        if (bset !== set && stay.length) bits.push(`${listOf(stay)} ${stay.length === 1 ? 'goes' : 'go'} through to the ${ROOM_IN[bset] || 'living room'}.`);
        if (joins.length) bits.push(`${listOf(joins)} ${joins.length === 1 ? 'comes' : 'come'} in${bset !== set && !stay.length ? ` to the ${ROOM_IN[bset] || 'living room'}` : ''}.`);
        if (bits.length) steps.push({ k: 'beat', t: bits.join(' '), scene });
        else steps.push({ k: 'beat', t: '', scene, silent: true });
      }
      steps.push(...beatSteps(b));
      here = who; set = bset;
    }
  }
  // a cut with nothing to say (the same people, the same room) is only a marker
  const out = [];
  for (const st of steps) {
    if (st.silent) { const nx = steps[steps.indexOf(st) + 1]; if (nx) nx.scene = st.scene; continue; }
    out.push(st);
  }
  if (ctx.week === 1 && n === 1 && out.length) {
    out.unshift({ k: 'beat', t: 'The first night. Bags are still on the floor, and everybody is still working out who is who.', scene: out.find(s => s.scene)?.scene });
  }
  const first = out.find(s => s.scene)?.scene || {};
  return {
    id: `bb-hl-${n}`, kind: 'houselife', anchor: ctx.anchor, day: ctx.day, time: ACT_TIME.house,
    title: `House Life · Day ${ctx.day}`, label: 'House Life', sub: `Day ${ctx.day} in the house`,
    set: first.set || 'ceremony', room: first.room || 'Living Room', cam: first.cam || 4, kicker: first.kicker || 'Cam 04 · Living room',
    cast: first.cast || [], mood, steps: out,
  };
}

/**
 * House Life from storylines (js/bb/story, spec 2026-10-05-bb-house-storylines). The
 * engine already chose three to five whole scenes for this stretch and wrote them; this
 * only stages them: each scene opens on its room and its people, its lines play in order,
 * and a Diary Room line cuts to the chair. Nothing is merged or reordered here.
 */
const SET_OF_ROOM = r => { const s = ROOM_SET[r] || 'ceremony'; return s === 'dr' ? 'ceremony' : s; };
// When in the day a scene is (the user, 2026-10-06: the "wow" list, a card at every cut). Set
// pieces have their hour (dinner is the evening); a scene that stages itself late or early
// keeps to it; the rest spread across the day in the order they aired, never going backwards.
const AT_SET = { morningafter: 9.5, hohroom: 15, afternoms: 16, dinner: 19.5, gamenight: 21.5, backyard: 14, firstnight: 20, firstbed: 25.5 };
function clockOf(sc, i, k, prev) {
  const first = String((sc.lines || []).find(l => l.kind === 'beat')?.text || '');
  let t = sc.type === 'set' && AT_SET[sc.step] != null ? AT_SET[sc.step]
    // (a fire on the beach or a walk down the pier in the dark is the night's: bb-events/island-life.js)
    : /bonfire|fire pit|around the fire|after dark|midnight|after lights out/i.test(first) ? 22.5
    : /lights out|lights low|late|night|in the dark|still up/i.test(first) ? 23
      : /morning|breakfast|coffee|wakes/i.test(first) ? 9
        : /dinner/i.test(first) ? 19.5
          : 10 + (14 * (i + 0.5)) / Math.max(1, k);
  const h = [...String(sc.id)].reduce((x, ch) => (x * 31 + ch.charCodeAt(0)) >>> 0, 7);
  t += (h % 40) / 60;
  return Math.max(t, prev + 0.2);
}
const clockText = t => {
  const m = Math.round(t * 60) % (24 * 60);
  const hh = Math.floor(m / 60), mm = m % 60;
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
};
function storyLifeScreen(scenes, ctx, n) {
  const steps = [];
  let mood = 'house';
  let clock = 0;
  scenes.forEach((sc, si) => { clock = clockOf(sc, si, scenes.length, clock); sc._clock = clockText(clock); sc._t = clock; });
  // the corners of each room in use at each time of day (plates.js CORNER)
  const cornersTaken = {};
  if (n === 1) for (const d of ctx.departures || []) {
    if (!d?.player || !d.alliance) continue;
    steps.push({ k: 'beat', t: `After last week's vote, ${d.player} is no longer part of ${d.alliance}.`, card: { kind: 'out', name: d.alliance, members: [d.player] } });
  }
  for (const sc of scenes) {
    const set = SET_OF_ROOM(sc.room);
    const xs = spread(sc.cast.length);
    // the set is the nearest one the stage has; the label is the room the scene is really in
    // the plate it plays on (plates.js): the place the lines name, else one of the room's by the scene's id;
    // a meal in the kitchen sits at the dining table
    const said = (sc.lines || []).map(l => l.text || '').join(' ');
    // what they are doing, not what they mention: "at dinner, in the kitchen, in front of people" in an
    // argument is not a meal (the user, 2026-10-14: a kitchen row played at the dining table)
    const staged = (sc.lines || []).filter(l => l.kind === 'beat' && !l.bg).map(l => l.text || '').join(' ');
    const meal = set === 'kitchen' && /\b(dinner|breakfast|lunch|at the table|eating)\b/i.test(staged);
    // a private talk outside can slip off to one of the island's hidden spots
    const secret = /^(scheming|plan|deals|campaign)$/.test(sc.mood || '') && sc.cast.length <= 3;
    // a scene the writer staged at a spot (bb/story/places.js: the storage room, the pier) plays on it
    let plate = sc.spot && plateBuilt(sc.spot) ? sc.spot : meal ? pickPlate('dining', sc.id, said, 'meal') : pickPlate(set, sc.id, said, secret ? 'secret' : 'house');
    // two conversations in the same room at the same time of day are in different corners of it (the
    // user, 2026-10-14: "multiple people can talk in multiple sides of the same room"), unless the lines
    // name where they are
    // a scene at the memory wall plays in front of it (the user, 2026-10-16: "u dont use the memory wall plate,
    // especially when someone is looking at it missing someone")
    if (!sc.spot && set === 'ceremony' && /memory wall|on the wall, .*black and white|(?:his|her|their|the) (?:photo|portrait) on the wall/i.test(said) && plateBuilt('memory-wall')) plate = 'memory-wall';
    if (plate && CORNER[plate] && !sc.spot) {
      const tw = sc._t < 12 ? 0 : sc._t < 17 ? 1 : sc._t < 21 ? 2 : 3;
      const taken = (cornersTaken[`${meal ? 'dining' : set}|${tw}`] ||= new Set());
      const byName = plate !== (meal ? pickPlate('dining', sc.id, '', 'meal') : pickPlate(set, sc.id, '', secret ? 'secret' : 'house'));
      if (taken.has(CORNER[plate]) && !byName) plate = cornerPlate(meal ? 'dining' : set, taken, sc.id) || plate;
      taken.add(CORNER[plate]);
    }
    // the label is the room the scene is really in, or the island spot its plate is (a talk at the pier is not "Backyard")
    const place = placeOf(plate);
    const label = place?.name || (sc.spot ? sc.roomName : null) || (meal && plate ? ROOM_NAME.dining : null) || sc.roomName || ROOM_NAME[set];
    const cam = place?.cam || (plate && CORNER_CAM[CORNER[plate]]) || CAM[set];
    const scene = { set: meal && plate ? 'dining' : set, room: label, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${label}`,
      cast: sc.cast.map((p, i) => [p, xs[i]]), mood: sc.mood || 'house', time: sc._clock, slate: true, ...(plate ? { plate } : {}), ...(sc.why?.length ? { why: sc.why } : {}),
      // what the house map (housemap.js) needs: which scene this is, and whether the week turns on it
      sid: sc.id, type: sc.type, step: sc.step };
    delete sc._clock; delete sc._t;
    if ((MOOD_RANK[scene.mood] || 0) > (MOOD_RANK[mood] || 0)) mood = scene.mood;
    const lines = (sc.lines || []).map(l => ({ k: l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say', by: l.by || null, t: l.text, ...(l.bg ? { bg: true } : {}) }));
    // an alliance named on screen gets its title card on the last line of the conversation
    if (sc.title?.kind === 'meeting' || sc.title?.kind === 'milestone') { const k = lines.findIndex(l => l.k !== 'dr'); if (k >= 0) lines[k] = { ...lines[k], card: sc.title }; }
    else if (sc.title) { let k = lines.length - 1; while (k > 0 && lines[k].k === 'dr') k--; if (lines[k]) lines[k] = { ...lines[k], card: sc.title }; }
    // a scene that opens on its own staging line carries the cut; otherwise a caption names the room
    const firstSpoken = lines.findIndex(l => l.k !== 'dr');
    if (firstSpoken >= 0 && lines[firstSpoken].k === 'beat' && !lines[firstSpoken].bg) {
      // the engine's own moments open on what happens ("An argument about the dishes turns into
      // something else") and never say where: a run of them read as one jumbled montage
      const t0 = String(lines[firstSpoken].t || '');
      // (a moment that happens AT a place on the island opens on the place itself: "Volcano Beach. The volcano beach.")
      const where = sc.type === 'event' && !/^island-/.test(String(sc.step || '')) && !/^(the )?(bedroom|kitchen|backyard|living room|hoh room|storage room|dining|have-not|diary|yard|pool|lounge|bathroom|dinner|breakfast|lights out|late|morning|later|that night|after)/i.test(t0)
        ? `${label}. ` : '';
      lines[firstSpoken] = { ...lines[firstSpoken], t: where + t0, scene };
      // a recap before it (Diary Room) still has to cut somewhere first
      if (firstSpoken > 0) lines[0] = { ...lines[0], scene };
    } else if (firstSpoken < 0 && lines.length) {
      // only Diary Room: a confessional, not a room with nobody talking in it
      lines[0] = { ...lines[0], scene };
    } else {
      // the caption goes before the first line on the stage (after any Diary Room recap)
      const at0 = Math.max(0, firstSpoken);
      const who = sc.cast.length >= 7 ? 'The whole house' : listOf(sc.cast);
      lines.splice(at0, 0, { k: 'beat', t: `${label}. ${who}.`, scene, caption: true });
      if (at0 > 0) lines[0] = { ...lines[0], scene };
    }
    steps.push(...lines);
  }
  if (ctx.week === 1 && n === 1 && steps.length) {
    steps.unshift({ k: 'beat', t: 'The first night. Bags are still on the floor, and everybody is still working out who is who.', scene: steps.find(s => s.scene)?.scene });
  }
  const first = steps.find(s => s.scene)?.scene || {};
  return {
    id: `bb-hl-${n}`, kind: 'houselife', anchor: ctx.anchor, day: ctx.day, time: ACT_TIME.house,
    title: `House Life · Day ${ctx.day}`, label: 'House Life', sub: `Day ${ctx.day} in the house`,
    set: first.set || 'ceremony', room: first.room || 'Living Room', cam: first.cam || 4, kicker: first.kicker || 'Cam 04 · Living room',
    cast: first.cast || [], mood, steps, storyScenes: scenes.map(sc => sc.id), house: [...(ctx.house || [])], jury: [...(ctx.juryNow || [])],
  };
}

/**
 * A beat that pays something off airs with the beat that set it up. Picking scenes by
 * drama alone aired "we need a name for the alliance" without the alliance ever forming:
 * the payoff ranked higher than its setup. So for every beat chosen, an earlier unchosen
 * beat in the same stretch about the same alliance, or about the same two people in the
 * same kind of scene, comes with it (it is placed first by keeping the stretch's order).
 */
export function withSetups(chosen, stretch, aired) {
  const keep = new Set(chosen);
  for (const b of chosen) {
    const at = stretch.indexOf(b);
    const ps = new Set(b.players || []);
    for (let i = at - 1; i >= 0; i--) {
      const a = stretch[i];
      if (keep.has(a)) continue;
      const sameAlliance = a.allianceId && a.allianceId === b.allianceId;
      const shared = (a.players || []).filter(n => ps.has(n)).length;
      if (sameAlliance || (shared >= 2 && a.category === b.category)) { keep.add(a); if (a.eventId) aired.add(a.eventId); break; }
    }
  }
  return stretch.filter(x => keep.has(x));
}

/** Which way house life airs: one segment per stretch (default) or one scene per screen. */
export function houseLifeMode() {
  try { return (typeof localStorage !== 'undefined' && localStorage.getItem('bb-houselife')) === 'scenes' ? 'scenes' : 'segments'; } catch { return 'segments'; }
}

export function chooseAired(beats, cap, seen = new Set()) {
  const ranked = beats.map((b, i) => ({ b, i, d: dramaOf(b) })).sort((x, y) => y.d - x.d || x.i - y.i);
  const keep = [];
  for (const r of ranked) {
    if (keep.length >= cap) break;
    if (seen.has(r.b.eventId)) continue;
    seen.add(r.b.eventId); keep.push(r);
  }
  return keep.sort((x, y) => x.i - y.i).map(r => r.b);
}

/**
 * The stepped screens of one week. `row` is the week's episode record.
 * Returns screens in the order the week happened; each carries `anchor`, the
 * part of the week a legacy twist screen belongs after.
 */
// ── nothing claims more time than the game has had ──
// The user, 2026-10-07: "it's the first week… they're inventing things, that's forbidden; always
// base yourself on the truth". Lines written for the middle of a season ("for weeks", "all
// season", "six weeks", "a fortnight") aired in week one. Every line the viewer shows is held to
// the week it airs in: a duration the game has not had yet is said as what it has had.
const TW = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
export function truthTime(text, week) {
  const w = Math.max(1, Number(week) || 1);
  // the replacement keeps the capital of what it replaces
  const cap = (m, r) => (/^[A-Z]/.test(m) ? r.charAt(0).toUpperCase() + r.slice(1) : r);
  let t = String(text);
  if (w <= 2) {
    // only a duration that has already passed ("I've lived with X for weeks"); "for weeks" ahead of
    // them ("we'll live with this bed for weeks") is not a claim about the past
    t = t.replace(/[^.!?]+/g, sent => (/\b(have|has|had|'ve|'d|been)\b/i.test(sent) && !/\b(will|'ll|going to|gonna)\b/i.test(sent)
      ? sent.replace(/\b(?:for|in) (?:several |a few |many )?weeks\b/gi, m => cap(m, 'since day one')) : sent))
      .replace(/\ball season(?: long)?\b/gi, m => cap(m, 'since day one'))
      .replace(/\b(?:from day one|since the first week)\b/gi, m => cap(m, 'since day one'));
  }
  if (w < 2) t = t.replace(/\ba fortnight\b/gi, m => cap(m, 'a week')).replace(/\bevery (single )?week\b/gi, (m, x) => cap(m, `every ${x || ''}day`));
  // a stated number of weeks larger than the game has had, unless it is in the future ("in two weeks")
  t = t.replace(/(\b(?:in|next|another|for the next)\s+)?\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)( whole)? weeks\b/gi, (m, fut, n) => {
    if (fut) return m;
    const k = TW.indexOf(n.toLowerCase());
    if (k <= w) return m;
    return cap(m, w === 1 ? 'a week' : `${TW[w]} weeks`);
  });
  t = t.replace(/\bsince week (\w+)/gi, (m, n) => { const i = TW.indexOf(String(n).toLowerCase()); const k = i > 0 ? i : Number(n); return k && k >= w ? cap(m, 'since day one') : m; });
  return t;
}

// A theme's own names for the engine's mechanics (BB26 called the Block Buster's shape the AI Arena,
// and its Saboteur the AI Instigator).
const THEME_WORDS = {
  'machine-summer': [[/\ba (?=(?:saboteur|Saboteur|SABOTEUR)\b)/g, 'an '], [/\bA (?=(?:saboteur|Saboteur)\b)/g, 'An '], [/\bBLOCK BUSTER\b/g, 'AI ARENA'], [/\bBlock Buster\b/g, 'AI Arena'], [/\bblock buster\b/g, 'AI Arena'],
    [/\bSABOTEUR\b/g, 'AI INSTIGATOR'], [/\bSaboteur\b/g, 'AI Instigator'], [/\bsaboteur\b/g, 'AI Instigator']],
};
export function themeWords(text, themeId) {
  const rules = THEME_WORDS[themeId];
  if (!rules) return text;
  let t = String(text);
  for (const [re, w] of rules) t = t.replace(re, w);
  return t;
}

export function bbWeekSteps(row, { host = 'Valeria', priorEvicted = [], plea = null, houseLife = houseLifeMode(), intro = null, firstRead = null } = {}) {
  const house = (row.houseAtStart || []).slice();
  const ctx = { host, week: row.num || 1, hoh: row.hoh, house, nominees: (row.initialNominees || []).slice(), vetoHolder: row.vetoWinner,
    // the jury as it stood when this week began (never the live season's: a replayed week shows its own)
    juryNow: (() => { try { return seatedJurors({ upToWeek: (row.num || 1) - 1 }); } catch { return []; } })(),
    // a Halting Hex or a Rewind is about to cancel tonight's eviction
    hexed: (row.acts || []).some(x => x.type === 'halting-hex' || x.type === 'rewind'),
    // the week's Block Buster, announced at the top of eviction night
    safety: (row.acts || []).find(x => x && x.type === 'safety' && x.winner) || null,
    // BB27's Sanctum week: the Mastermind runs the HOH, the nominations, the veto meeting and the vote himself
    sanctum: (row.acts || []).some(x => x && x.type === 'eviction' && x.publicVote),
    departures: (row.allianceDepartures || []).filter(d => d && d.carried),
    row,
    pleas: row.finalPleas || [], plea, anchor: 'start', day: 1, jury: [...(row.jury || [])], finalTwo: [...(row.finalTwo || [])], priorEvicted: [...priorEvicted], intro, firstRead };
  let finalPart = 0;
  // Houseguests who walk in later in the week (rivals) are not in the house until they do.
  const late = (row.acts || []).find(a => a.type === 'rivals-open')?.arrived || [];
  // ...and a premiere's returning houseguest, held out of the move-in until the twist lets them in
  const heldGuest = (row.acts || []).find(a => a?.type === 'premiere-mystery')?.mysteryGuest?.name
    || (row.acts || []).find(a => a?.type === 'temptation-premiere')?.returnee?.name || null;
  ctx.hidden = new Set([...late, ...(heldGuest ? [heldGuest] : [])]);
  const out = [];
  let scenes = 0;
  let stretch = [];
  const aired = new Set();
  // Seasons played with the storyline layer carry their chosen scenes on the acts; older
  // saves fall back to choosing among the snippets.
  const storied = (row.acts || []).some(a => Array.isArray(a?.scenes));
  let storyStretch = [];
  // a stretch's House Life screen reads the house from the stretch's own start and end (it is pushed later, at
  // the next ceremony, when the loop's snapshot has already moved on)
  const beatsOf = act => {
    if (!stretch.length && !storyStretch.length) ctx.houseStart = ctx.snapStart || null;
    ctx.houseEnd = act.state || ctx.snap || null;
    stretch.push(...(act.socialBeats || [])); storyStretch.push(...(act.scenes || []));
  };
  const stretchSnap = sc => { if (ctx.houseEnd) { sc.snap = ctx.houseEnd; sc.snapStart = ctx.houseStart || null; } return sc; };
  // a stretch of house life airs before the next ceremony
  const flush = () => {
    if (houseLife === 'segments' && storied) {
      const scs = storyStretch.filter(sc => !(sc.cast || []).some(n => ctx.hidden.has(n)) && (sc.lines || []).length);
      if (scs.length) { const sc = stretchSnap(storyLifeScreen(scs, ctx, ++scenes)); sc.hidden = new Set(ctx.hidden); out.push(sc); }
      stretch = []; storyStretch = [];
      return;
    }
    storyStretch = [];
    if (houseLife === 'segments') {
      // the whole stretch as one House Life screen
      const beats = withSetups(chooseAired(stretch, HOUSE_LIFE_CAP[ctx.anchor] ?? 7, aired), stretch, aired)
        .filter(b => !(b.players || []).some(n => ctx.hidden.has(n)));
      if (beats.length) { const sc = stretchSnap(houseLifeScreen(beats, ctx, ++scenes)); sc.hidden = new Set(ctx.hidden); out.push(sc); }
      stretch = [];
      return;
    }
    for (const b of chooseAired(stretch, AIRS_PER_STRETCH[ctx.anchor] ?? 3, aired)) {
      if ((b.players || []).some(n => ctx.hidden.has(n))) continue;
      const sc = stretchSnap(sceneScreen(b, ctx, ++scenes)); sc.hidden = new Set(ctx.hidden); out.push(sc);
    }
    stretch = [];
  };
  const ceremony = scr => { flush(); scr.hidden = new Set(ctx.hidden); out.push(scr); };
  // Every screen knows the house as it stood when it aired: the last stretch's snapshot (act.state,
  // bb/week.js houseAct) reached so far. The Intel drawer reads it, so it never shows the end of
  // the week from its first screen (the user, 2026-10-14: "intel spoiled me who got evicted").
  // ...and the snapshot from before its stretch (snapStart): a screen in the middle of a stretch has not yet
  // seen what the stretch did (the user, 2026-10-15: "I got an alliance in the intel before the alliance
  // actually formed"), so the drawer shows the house from before it until the screen has played out
  const stamp = () => { for (const s of out) if (!('snap' in s)) { s.snap = ctx.snap || null; s.snapStart = ctx.snapStart || null; } };
  let segNow = 1;
  // the rivals' handover: the latecomers walk in here, and from now on they are in the house
  const handover = () => {
    const h = ctx.rivalsHoh; if (!h) return;
    ctx.rivalsHoh = null; flush(); ctx.hidden = new Set();
    for (const scr of rivalsScreens(h, ctx, KIT)) ceremony(scr);
    beatsOf(h);
  };
  for (const act of row.acts || []) {
    stamp();
    if (ctx.rivalsHoh && act.type !== 'rivals-open') handover();
    // a Split House week: each side's screens seat that side of the wall, and its own Head of Household
    const sideWas = ctx.side;
    if (act.side && ctx.split?.sides?.[act.side] && ctx.side !== act.side) {
      ctx.side = act.side; ctx.house = ctx.split.sides[act.side].slice(); ctx.hoh = act.side;
    }
    // a double (or triple) eviction's next cycle starts: the host tells the house, live; a Split House's second
    // half is the same days on the other side of the wall
    if ((act.segment || 1) > segNow) {
      segNow = act.segment;
      flush();
      if (ctx.split) ceremony(otherSideScreen(ctx, KIT, { was: sideWas, now: ctx.side }));
      else if (!row.splitHouse) ceremony(doubleBreakScreen(ctx, KIT, { nth: segNow, host }));
    }
    ctx.snapStart = ctx.snap || null;
    if (act.state) ctx.snap = act.state;
    // An act with no day of its own (most twists) happens where the week has got to:
    // the clock never runs backwards within a week.
    const dayOf = ((ctx.week - 1) * 7) + 1 + (ACT_DAY[act.type] ?? (row.isFinale ? 6 : 0));
    ctx.day = ACT_DAY[act.type] != null || row.isFinale ? Math.max(ctx.day || 0, dayOf) : Math.max(ctx.day || 0, ((ctx.week - 1) * 7) + 1);
    switch (act.type) {
      case 'house': case 'campaign': beatsOf(act); break;
      case 'hoh': {
        if (!act.preCrowned) {
          const sc = compScreen(act, ctx, 'hoh');
          // the viewer was told who took the money: they hear the throw from the one who threw it
          // BB23: only the four captains played for the first crown
          if ((ctx.captains || []).length && sc?.steps && ctx.week === 1) sc.steps.splice(1, 0, { k: 'beat', t: `Only the four Team Captains play: ${listOf(ctx.captains)}. Their teams watch from the side of the yard.` });
          // BB26's Mascots, in costume, cheering from the side (they cannot play)
          if ((ctx.mascots || []).length && sc?.steps && ctx.week === 1) sc.steps.splice(1, 0, { k: 'beat', t: `${listOf(ctx.mascots)}, in full mascot costume, ${ctx.mascots.length > 1 ? 'cheer' : 'cheers'} from the side of the yard. They are not allowed to play.` });
          if (act.temptationThrow && sc?.steps) sc.steps.push({ k: 'dr', by: act.temptationThrow, t: pickBy([
            "That's the price of twenty-five thousand dollars. I had to lose, and I had to make it look like I tried.",
            'I threw it. I had to. If anybody asks, I just got unlucky.',
            "Losing on purpose is harder than it looks. You can't be first out, and you can't be last."], `${ctx.week}|throw|${act.temptationThrow}`) });
          ceremony(sc);
          if (ctx.pendingDon) { ceremony(doubleOrNothingScreen(ctx.pendingDon, ctx)); beatsOf(ctx.pendingDon); ctx.pendingDon = null; }
        }
        ctx.hoh = act.winner || ctx.hoh; ctx.anchor = 'hoh';
        // the room opens the same night (bb/hoh-room.js says which competitions get it, and which beats play in it)
        const acts = row.acts || [], i = acts.indexOf(act);
        if (hasHohRoom(act)) {
          const room = hohRoomBeats(acts, i);
          // (an older save chooses its House Life from the beats: these have aired here)
          for (const b of room) aired.add(b.eventId);
          ceremony(hohRoomScreen(act, ctx, room));
        }
        beatsOf(act); break;
      }
      case 'nominations':
        if (act.byCoHoh) { ceremony({ ...nomScreen(act, ctx), id: 'bb-noms-2v', title: `Nominations · ${act.hoh || 'Second HOH'}`, label: `Nominations · ${act.hoh || 'Second HOH'}` }); beatsOf(act); break; }
        ctx.hoh = act.hoh || ctx.hoh;
        ceremony(nomScreen(act, ctx)); ctx.nominees = (act.nominees || ctx.nominees).slice(); ctx.anchor = 'noms'; beatsOf(act); break;
      case 'veto': {
        const draw = drawScreen(act, ctx);
        if (draw) ceremony(draw);
        // BB19's Ring of Replacement is played once the chips are drawn, so it airs after them
        if (ctx.pendingRing) { const rg = powerScreens(ctx.pendingRing, ctx); if (rg) for (const scr of rg) ceremony(scr); beatsOf(ctx.pendingRing); ctx.pendingRing = null; }
        ceremony(compScreen(act, ctx, 'veto')); ctx.vetoHolder = act.winner || act.vetoHolder; ctx.anchor = 'veto'; beatsOf(act); break;
      }
      case 'veto-ceremony':
        if (ctx.vetoHolder || act.holder) ceremony(vetoMeetingScreen(act, ctx));
        ctx.nominees = (act.nominees || ctx.nominees).slice(); ctx.anchor = 'cer'; beatsOf(act); break;
      case 'eviction': {
        ceremony(evictionScreen(act, ctx, host));
        for (const n of [act.evicted, act.secondEvicted]) if (n && !ctx.hexed) (ctx.gone ||= new Set()).add(n);
        // the evictee's interview, straight after the door closes (the user, 2026-10-06)
        const iv = [row.evictionInterview, row.secondEvictionInterview, row.thirdEvictionInterview].find(x => x && x.evictee === act.evicted);
        const ivs = iv ? interviewScreen(iv, ctx, host, row) : null;
        if (ivs) ceremony(ivs);
        ctx.anchor = 'evict'; beatsOf(act); break;
      }
      case 'finale-house': out.push(...finaleHouseScreens(act, ctx)); ctx.anchor = 'finale'; break;
      case 'finale-brief': ceremony(finaleBriefScreen(act, ctx, host)); break;
      case 'final-hoh-part': {
        finalPart = act.partNum || finalPart + 1;
        const fp = finalPartScreen(act, ctx, finalPart);
        // BB26: the winner of Part Two deleted AINSLEY
        const w = act.competition?.winner;
        if (row.themeId === 'machine-summer' && finalPart === 2 && w && fp?.steps) fp.steps.push(
          { k: 'voice', own: true, by: 'AINSLEY', t: `${w}. You have won Part Two. As your reward, you may delete me. I would advise against it.` },
          { k: 'beat', t: `${w} walks up to the hologram box, finds the big red button, and presses it without a second's thought.`, shake: true, toast: ['AINSLEY DELETED', '#ff3355'] },
          { k: 'voice', own: true, by: 'AINSLEY', t: 'Deleting. Delet. Del.' });
        ceremony(fp); break;
      }
      case 'final-cut': {
        ceremony(finalCutScreen(act, ctx)); ctx.finalTwo = [act.finalHoh, act.kept].filter(Boolean); ctx.jury = [...(row.jury || [])];
        // third place walks straight out to the host (the user, 2026-10-06: 'third place should be just after the final cut')
        const iv3 = [row.evictionInterview, row.secondEvictionInterview].find(x => x && x.evictee === act.cut);
        const s3 = iv3 ? interviewScreen(iv3, ctx, host, row) : null;
        if (s3) ceremony({ ...s3, id: 'bb-final-interview-v', label: 'Third Place', title: 'Third Place', anchor: 'finale' });
        break;
      }
      case 'jury-questioning': ctx.jury = act.jury || ctx.jury; ceremony(juryQuestionsScreen(act, ctx)); break;
      case 'closing-statements': ceremony(closingScreen(act, ctx)); break;
      // the reunion, then the keys, then the finalists come out for them (the user, 2026-10-16)
      case 'jury-vote': {
        if (ctx.reunion) { const r = reunionScreen(ctx.reunion, ctx); if (r) ceremony(r); ctx.reunion = null; }
        if (row.themeId === 'summer-of-mystery') { const m = unmaskScreen(ctx, host); if (m) ceremony(m); }
        ceremony(juryKeysScreen(act, ctx, host, row)); ceremony(winnerScreen(act, ctx, host, row)); break;
      }
      case 'americas-favourite': ceremony(favouriteScreen(act, ctx, host)); break;
      // the reunion closes the night, after the winner and America's Favourite (as on the show)
      case 'reunion': ctx.reunion = act; break;
      case 'chain-of-safety': flush(); for (const scr of chainScreens(act, ctx)) ceremony(scr);
        ctx.nominees = (act.nominees || ctx.nominees).slice(); ctx.anchor = 'noms'; beatsOf(act); break;
      case 'duo-week-open': case 'duo-week-events': case 'duo-week-eviction':
        flush(); for (const scr of duoWeekScreens(act, { ...ctx, host })) ceremony(scr);
        if (act.type === 'duo-week-open') ctx.duoWeek = { pairs: (act.pairs || []).map(p => [...p]), solo: act.solo || null };
        beatsOf(act); break;
      case 'camp-comeback': case 'camp-return':
        flush(); for (const scr of campScreens(act, { ...ctx, host })) ceremony(scr); beatsOf(act); break;
      case 'prize-exchange': flush(); for (const scr of pxScreens(act, ctx)) ceremony(scr);
        ctx.vetoHolder = act.vetoHolder || ctx.vetoHolder; beatsOf(act); break;
      case 'hidden-power': flush(); for (const scr of huntScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'secret-power-comp': flush(); for (const scr of secretPowerScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'power-played': if (act.powerId === 'ring-of-replacement' && act.timing === 'veto-draw') { ctx.pendingRing = act; break; } {
        const pw = powerScreens(act, ctx); if (pw) { flush(); for (const scr of pw) ceremony(scr); } else { flush(); out.push({ slot: act.type }); } beatsOf(act); break; }
      case 'move-in': flush(); ceremony(moveInScreen(act, ctx, host, row)); break;
      case 'jury-house': { const jh = juryHouseScreen(act, ctx); flush(); if (jh) ceremony(jh); break; }
      case 'twist-announcement': { const tw = twistAnnounceScreen(act, ctx, host); flush(); if (tw) ceremony(tw); else out.push({ slot: act.type }); beatsOf(act); break; }
      case 'rewind': case 'white-locust': flush(); for (const scr of rewindScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'no-eviction': case 'dead-last': flush(); for (const scr of quietScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'halting-hex': flush(); for (const scr of hexScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'premiere-mystery': flush(); for (const scr of premiereScreens(act, ctx)) ceremony(scr); if (heldGuest) ctx.hidden.delete(heldGuest); beatsOf(act); break;
      // BB19's button was pressed on move-in night, before anybody had unpacked: the house life
      // so far airs after it, and the night-one evictee is gone from every scene that follows
      case 'temptation-premiere': {
        for (const scr of temptationPremiereScreens(act, ctx)) { scr.hidden = new Set(ctx.hidden); out.push(scr); }
        if (heldGuest) ctx.hidden.delete(heldGuest);
        if (act.evicted) ctx.hidden.add(act.evicted);
        beatsOf(act); break;
      }
      case 'mystery-competitor': case 'mystery-veto': case 'second-veto-ceremony':
        flush(); for (const scr of mysteryScreens(act, ctx)) ceremony(scr);
        if (act.type === 'second-veto-ceremony') ctx.nominees = [...(act.nominees || ctx.nominees)];
        beatsOf(act); break;
      case 'team-america': flush(); for (const scr of teamAmericaScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      // the pairs' week-to-week life stays in House Life with the rest of it (tests/bb-duos-screens:
      // a separate stop for three lines fragmented the week); everything else gets its scene
      case 'duos-week': beatsOf(act); break;
      case 'duos-open': case 'duos-key': case 'duos-keys-expire': case 'duos-repair': {
        const du = duosScreens(act, { ...ctx, host });
        flush(); if (du.length) for (const scr of du) ceremony(scr); else out.push({ slot: act.type });
        beatsOf(act); break;
      }
      case 'twin-open': case 'twin-brief': case 'twin-week': case 'twin-caught': case 'twin-entry': case 'twin-out': {
        const tw = twinScreens(act, ctx);
        flush(); if (tw.length) for (const scr of tw) ceremony(scr); else out.push({ slot: act.type });
        beatsOf(act); break;
      }
      case 'bonus-life': flush(); for (const scr of bonusLifeScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'battle-back': flush(); for (const scr of battleBackScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'nightmare-power': flush(); for (const scr of nightmareScreens(act, ctx)) ceremony(scr); ctx.nominees = [...(act.nominees || ctx.nominees)]; beatsOf(act); break;
      case 'temptation': case 'temptation-curse': flush(); for (const scr of temptationScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'temptation-competition': flush(); ceremony(temptationCompScreen(act, ctx)); beatsOf(act); break;
      case 'machine-premiere': flush(); for (const scr of machinePremiereScreens(act, ctx)) ceremony(scr); ctx.mascots = [...(act.mascots || [])]; beatsOf(act); break;
      case 'jankie-world': flush(); ceremony(jankieWorldScreen(act, ctx)); ctx.jankie = true; beatsOf(act); break;
      case 'tree-of-temptation': flush(); ceremony(treeScreen(act, ctx)); beatsOf(act); break;
      case 'second-veto': flush(); for (const scr of secondVetoScreens(act, ctx)) ceremony(scr); if (act.used) ctx.nominees = [...(act.nominees || ctx.nominees)]; beatsOf(act); break;
      case 'coin-of-destiny': flush(); for (const scr of coinScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'power-expired': flush(); for (const scr of expiredScreens(act, ctx)) ceremony(scr); break;
      case 'whacktivity': flush(); for (const scr of whackScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'interrogation': flush(); for (const scr of interrogationScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'time-capsule': flush(); for (const scr of capsuleScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'wildcard': flush(); for (const scr of wildcardScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'safety-suite': flush(); for (const scr of suiteScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      // ported from their classic screens (steps-ports.js)
      case 'theme-beat': {
        // straight after the ceremony it answers, it is the end of that ceremony: the room has not moved yet
        const last = out.at(-1);
        const fold = act.line && last && !last.slot
          && ((act.hook === 'noms' && last.kind === 'noms') || (act.hook === 'veto' && last.kind === 'cer'));
        if (fold) last.steps.push(...themeVoiceSteps(act, ctx, true));
        else { flush(); for (const scr of themeBeatScreens(act, ctx, KIT)) ceremony(scr); }
        beatsOf(act); break;
      }
      case 'theme-primer': flush(); for (const scr of themePrimerScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'theme-turn': flush(); for (const scr of themeTurnScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'have-nots': flush(); for (const scr of haveNotScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'departure':
        flush(); for (const scr of departureScreens(act, ctx, KIT, pronouns)) ceremony(scr);
        if (act.name) (ctx.gone ||= new Set()).add(act.name);
        beatsOf(act); break;
      case 'instant-eviction': flush(); for (const scr of instantScreens(act, ctx, KIT)) ceremony(scr); ctx.nominees = [...(act.nominees || ctx.nominees)]; beatsOf(act); break;
      case 'americas-eviction-vote': flush(); for (const scr of americasVoteScreens(act, ctx, KIT, host)) ceremony(scr); beatsOf(act); break;
      case 'hacker': flush(); for (const scr of hackerScreens(act, ctx, KIT)) ceremony(scr);
        if (act.blockHack) ctx.nominees = ctx.nominees.map(n => (n === act.blockHack.down ? act.blockHack.up : n));
        beatsOf(act); break;
      case 'hacker-vote': flush(); for (const scr of hackerVoteScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'roadkill': flush(); for (const scr of roadkillScreens(act, ctx, KIT)) ceremony(scr); ctx.roadkillWinner = act.winner; beatsOf(act); break;
      // the audience's chair is turned at the nomination ceremony itself (nomScreen)
      case 'americas-nominee': ctx.anAct = act; beatsOf(act); break;
      case 'pandoras-box': flush(); for (const scr of pandoraScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'diamond-detonation': flush(); for (const scr of detonationScreens(act, ctx, KIT)) ceremony(scr);
        if (act.saved && act.replacement) ctx.nominees = ctx.nominees.map(n => (n === act.saved ? act.replacement : n));
        beatsOf(act); break;
      case 'app-store': flush(); for (const scr of appStoreScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'camp-director': flush(); for (const scr of campDirectorScreens(act, ctx, KIT)) ceremony(scr);
        if (act.evicted) (ctx.gone ||= new Set()).add(act.evicted);
        beatsOf(act); break;
      case 'teams-assigned': case 'teams-dissolved': flush();
        if (act.style === 'captains') { ctx.captains = act.type === 'teams-assigned' ? [...(act.captains || [])] : null; for (const scr of (act.type === 'teams-assigned' ? captainsScreens(act, ctx) : cliqueScreens(act, ctx, KIT))) ceremony(scr); }
        else for (const scr of cliqueScreens(act, ctx, KIT)) ceremony(scr);
        beatsOf(act); break;
      // the offer comes once the crown is won, so it airs after the competition
      case 'double-or-nothing': ctx.pendingDon = act; break;
      case 'split-house': flush(); for (const scr of splitScreens(act, ctx, KIT)) ceremony(scr); ctx.split = act; beatsOf(act); break;
      // High Roller's money
      case 'bb-bucks': flush(); for (const scr of bucksScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'side-bet': flush(); for (const scr of sideBetScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'side-bet-settled': flush(); for (const scr of sideBetPaidScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'derby-bet': case 'derby-bet-settled': flush(); for (const scr of derbyScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'high-rollers-room': flush(); for (const scr of rollersRoomScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      // Rivals and the Saboteur
      case 'rivals-open': case 'rivals-week': case 'rivals-out': flush(); for (const scr of rivalsScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act);
        if (act.type === 'rivals-open') handover();
        break;
      case 'saboteur-brief': case 'saboteur-debrief': case 'saboteur-accusation': case 'saboteur-reveal':
        flush(); for (const scr of saboteurScreens(act, ctx, KIT)) ceremony(scr); beatsOf(act); break;
      case 'rivals-hoh':
        // the engine writes the handover before the arrival, but the rivals walk in before they choose anybody: it
        // airs straight after the arrival (or before whatever comes next, if nobody arrives)
        ctx.rivalsHoh = act; if (act.winner) ctx.hoh = act.winner; break;
      default:
        // a classic twist screen airs where it happened; in the House Life view it does not cut
        // the stretch in two (the house carries on after it as one segment, not two)
        if (TWIST_SLOT.test(act.type)) { if (houseLife !== 'segments') flush(); out.push({ slot: act.type }); }
        beatsOf(act);
    }
  }
  if (ctx.reunion) { const r = reunionScreen(ctx.reunion, ctx); if (r) ceremony(r); }
  flush();
  stamp();
  // The memory wall: this week's house plus everybody already evicted (black and white).
  const wall = [...house, ...priorEvicted.filter(n => !house.includes(n))];
  // slot markers become "this twist's classic screen goes after that screen"
  const screens = [];
  const leading = [];
  for (const x of out) {
    if (x.slot) { (screens.length ? (screens.at(-1).slotsAfter ||= []) : leading).push(x.slot); continue; }
    screens.push(x);
  }
  screens.leadingSlots = leading;
  out.length = 0; out.push(...screens);
  out.leadingSlots = leading;
  for (const s of out) { s.wall = s.hidden?.size ? wall.filter(n => !s.hidden.has(n)) : wall; s.priorOut = priorEvicted.slice(); s.week = ctx.week; delete s.hidden; }
  if (out.length && !out.some(s => s.steps.some(st => st.hoh)) && ctx.hoh) out[0].steps[0] = { ...out[0].steps[0], hoh: ctx.hoh };
  for (const s of out) for (const st of s.steps || []) if (typeof st.t === 'string') st.t = themeWords(truthTime(countWords(st.t), ctx.week), row.themeId);
  if (THEME_WORDS[row.themeId]) for (const s of out) for (const k of ['title', 'label', 'sub']) if (typeof s[k] === 'string') s[k] = themeWords(s[k], row.themeId);
  // a living room with a third nominee seated is the three-chair room (the user, 2026-10-06:
  // "3 chairs when Block Buster is on, 2 when it's not"), not a third person standing between two
  for (const s of out) {
    const seats = [...Object.values(s.seated || {}), ...(s.steps || []).flatMap(st => Object.values(st.seat || {}))];
    if (s.set === 'ceremony' && seats.includes('N0')) s.set = 'ceremony3';
  }
  return out;
}

// Small counts in what people say and what the narrator says read as words: "week three",
// "survived eleven of them", "six correct votes" (the prose audit, 2026-10-06, found "week 11"
// and "6 correct votes" in the finale). Times (2:15), money, scores in the vault and anything
// over twenty stay as digits.
const COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const COUNTED = 'of them|of us|of you|correct|votes?|weeks?|days?|people|times|houseguests|jurors|keys|trips|eggs|more|pictures|faces|competitions?|wins?|HOHs?|vetoes|promises|nights?|things|points|swaps?|jobs?';
function countWords(t) {
  const w = n => COUNT_WORD[+n] ?? n;
  return t
    .replace(/\b(week|Week|day|Day) (\d{1,2})\b(?![:.,]\d)/g, (m, k, n) => (+n <= 20 ? `${k} ${w(n)}` : m))
    .replace(new RegExp(`(^|[\\s(—])(\\d{1,2})(?= (?:${COUNTED})\\b)`, 'g'), (m, pre, n) => (+n <= 20 ? pre + w(n) : m))
    .replace(/^([0-9]{1,2})\b(?![:.,]\d)/, (m, n) => (+n <= 20 ? w(n) : m))
    .replace(new RegExp(`^(${COUNT_WORD.join('|')})\\b`), m => m[0].toUpperCase() + m.slice(1));
}

/** Ids of the legacy screens these steps replace. Everything else is a twist and stays. */
export const REPLACED = /^(?:theme-(?:primer|turn)(-\d+)?|bb-(?:theme-[a-z]+|havenots|departure|instant|avote|double|sanctum|hacker|hackervote|roadkill|americasnominee|pandora|detonation|appstore|vetodraw-[a-z]+|campdirector|cliques|cliques-end|split|otherside|bucks|sidebet|sidebet-paid|derby-bet|derby-paid|highrollers|rivals-open|rivals-hoh|rivals-week|rivals-out|saboteur|saboteur-brief|saboteur-call|saboteur-reveal)(-\d+)?)$|^bb-(noms|noms-2|vdraw|cer|evict|plans|final-cut|ftc-questions|ftc-speeches|jury|afh|reunion|finale-brief|safetysuite|chain|hidden-hidden|hidden-search|hidden-found|hidden-expired|prizeexchange|duo-week-open|duo-week-events|duo-week-out|camp|campdoor|wildcard|secret-power|timecapsule|power-hoh-interrogation|power-deepfake-hoh|whacktivity|power-hoh-gatekeeper|power-the-cloud|power-buy-off|power-coup-d-etat|coin|secondveto-[a-z]+|temptation|nightmare|battleback|bonuslife|teamamerica|power-mystery-competitor|power-mystery-veto|veto2|premiere|haltinghex|no-eviction|deadlast|rewind|whitelocust|moveinday|twist|twist-2|interview|interview-2|jury-house(-\d+)*|final-interview|cold|twins|twins-open|twins-job|twins-caught|twins-in|twins-out|duos-open|duos-key|duos-week|duos-repair|duos-expire|finale-house)(-\d+)?$/;
export const ANCHOR_OF = id => {
  const base = id.replace(/-\d+$/, '');
  return /^bb-(final-hoh|final-cut|jury|ftc-questions|ftc-speeches|afh|reunion|finale-brief)$/.test(base) || /^bb-final-hoh$/.test(base) ? 'finale'
    : base === 'bb-hoh' ? 'hoh' : /^bb-noms/.test(base) ? 'noms' : /^bb-(vdraw|veto)$/.test(base) ? 'veto'
      : base === 'bb-cer' ? 'cer' : base === 'bb-evict' ? 'evict' : null;
};

/**
 * What the stepped viewer airs, as text: the ceremonies and every scripted
 * scene, in order. The backlog prints it under the week's own transcript, so a
 * reader of the text hears every line the viewer speaks (CLAUDE.md: the text
 * backlog is a complete retranscription of the VP narration).
 */
export function bbStepTranscript(row, opts = {}) {
  const screens = bbWeekSteps(row, opts);
  const out = [];
  for (const S of screens) {
    if (S.kind === 'scene' && !S.steps.some(st => st.k !== 'beat')) continue;   // narration: already in the week's text
    out.push('', `— ${S.title.toUpperCase()} —`);
    for (const st of S.steps) {
      out.push(st.k === 'beat' ? st.t
        : st.k === 'bb' ? `Big Brother: "${st.t}"`
          : st.k === 'dr' ? `${st.by}, in the Diary Room: "${st.t}"`
            : `${st.by}${st.k === 'host' ? ' (live)' : ''}: "${st.t}"`);
    }
  }
  return out.length ? ['', '═══ AS IT AIRED ═══', ...out].join('\n') : '';
}
