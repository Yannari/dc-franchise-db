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
// nomination ceremony", "By a vote of...". What a houseguest SAYS at them is
// Phase 4 (pools, picked by the shared picker); until then each line is a
// plain, true statement of what the record says happened.
import { arenaFor } from '../bb/comp-arenas.js';

const ROOM_SET = { 'kitchen': 'kitchen', 'living-room': 'ceremony', 'bedroom': 'bedroom', 'hoh-room': 'hoh',
  'backyard': 'yard', 'diary-room': 'dr', 'pantry': 'kitchen', 'washroom': 'bedroom' };
const ROOM_NAME = { kitchen: 'Kitchen', ceremony: 'Living Room', bedroom: 'Bedroom', hoh: 'HOH Room', yard: 'Backyard',
  dr: 'Diary Room', dining: 'Dining Room' };
const CAM = { kitchen: 2, ceremony: 4, bedroom: 9, hoh: 14, yard: 5, dr: 1, dining: 3 };
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

/** Seats a room has, in the order the viewer fills them. */
const LIVING_SEATS = ['L0', 'R0', 'L1', 'R1', 'L2', 'R2', 'L3', 'R3'];
const DINING_SEATS = ['S3', 'S4', 'S2', 'S5', 'S1', 'S6', 'S0', 'S7'];

function seatLiving(nominees, others, standing = null) {
  const seated = {};
  nominees.slice(0, 2).forEach((n, i) => { seated[n] = i ? 'N1' : 'N-1'; });
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
  };
}

// ── a competition, in its arena ────────────────────────────────────────
function compScreen(act, ctx, kind) {
  const comp = act.competition || {};
  const arena = arenaFor(comp.id) || 'arena-course';
  const results = (act.results || []).map(r => r.name).filter(Boolean);
  const winner = act.winner || results[0];
  const finalists = results.slice(0, 4);
  const xs = spread(finalists.length);
  const isHoh = kind === 'hoh';
  const steps = [];
  steps.push({ k: 'bb', t: isHoh ? `Houseguests, it is time for the Head of Household competition.` : `Houseguests, it is time for the Power of Veto competition.` });
  if (isHoh && act.outgoingHoh) steps.push({ k: 'beat', t: `${act.outgoingHoh}, the outgoing Head of Household, sits this one out.` });
  const desc = String(comp.desc || '').split(/(?<=\.)\s/)[0];
  if (comp.name) steps.push({ k: 'beat', t: `${comp.name}. ${desc}` });
  const early = results.slice(4);
  if (early.length) steps.push({ k: 'beat', t: `${listOf(early)} ${early.length > 1 ? 'are' : 'is'} out of it.` });
  for (const n of finalists.slice(1).reverse()) steps.push({ k: 'beat', t: `${n} is out. ${finalists.indexOf(n) === 1 ? 'It comes down to the last one standing.' : ''}`.trim() });
  steps.push({ k: 'beat', t: isHoh ? `${winner} wins Head of Household!` : `${winner} wins the Power of Veto!`,
    toast: [isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO', '#d99a10'], ...(isHoh ? { hoh: winner } : { veto: winner }) });
  steps.push({ k: 'say', by: winner, push: true, t: pickBy(isHoh
    ? ['Yes! Oh my god, yes!', 'I needed that. I really needed that.', 'Head of Household. Say it again.', 'Okay. Okay! Breathe.']
    : ['That veto is mine.', 'Yes! I am not going anywhere this week.', 'Power of Veto, baby!', 'I needed that one.'], `${ctx.week}|${kind}|${winner}`) });
  return {
    id: isHoh ? 'bb-hoh-v' : 'bb-veto-v', kind: isHoh ? 'hoh' : 'veto', anchor: isHoh ? 'hoh' : 'veto',
    set: arena, arena: true, room: comp.name || 'Competition', cam: 7,
    title: isHoh ? 'Head of Household' : 'Power of Veto', kicker: comp.name || 'Competition', sub: comp.name || '',
    day: ctx.day, time: ACT_TIME[kind] || '20:00', cast: finalists.map((p, i) => [p, xs[i]]), steps,
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
  const steps = [
    { k: 'bb', t: 'This is the nomination ceremony.' },
    { k: 'say', by: hoh, t: `It is my responsibility as Head of Household to nominate ${word(noms.length)} houseguests for eviction. I'm going to turn the first key.` },
  ];
  noms.forEach((n, i) => {
    steps.push({ k: 'beat', t: i === 0 ? `${hoh} turns the first key. A face fills the first slot on the screen.` : `${hoh} turns the next key.`, reveal: n,
      ...(i === noms.length - 1 ? { nom: noms.slice(), toast: ['NOMINATED', '#ff3355'] } : {}) });
  });
  const named = noms.map((n, i) => (i === noms.length - 1 && noms.length > 1 ? `and you, ${n}` : `you, ${n}`)).join(noms.length > 2 ? ', ' : ' ');
  steps.push({ k: 'say', by: hoh, push: true, t: `I have nominated ${named}.` });
  if (act.target) {
    const why = act.target === act.backdoorTarget ? null
      : act.structure === 'expendables' ? `This isn't personal. I had to put two people up, and I went with the people I've connected with least.`
        : act.pawn ? `${act.pawn}, you're up there as a pawn, and you know that. ${act.target}, I think you know why you're sitting there.`
          : `${act.target}, I think you know why you're sitting there.`;
    if (why) steps.push({ k: 'say', by: hoh, t: why });
  }
  steps.push({ k: 'bb', t: 'This nomination ceremony is adjourned.' });
  return { id: 'bb-noms-v', kind: 'noms', anchor: 'noms', set: 'dining', room: ROOM_NAME.dining, cam: CAM.dining,
    title: 'Nomination Ceremony', kicker: 'Cam 03 · Dining room', sub: `${hoh} at the head of the table`,
    day: ctx.day, time: ACT_TIME.nominations, seated, steps };
}

// ── the veto player pick ───────────────────────────────────────────────
function drawScreen(act, ctx) {
  const draws = act.draw || [];
  if (!draws.length) return null;
  const hoh = ctx.hoh;
  const block = act.blockAtDraw || ctx.nominees;
  const steps = [
    { k: 'bb', t: `${listOf([hoh, ...block])}, please come to the living room for the veto player pick.` },
    { k: 'say', by: hoh, t: `The nominees and I play in the veto. Each of us draws one chip. If you pull houseguest's choice, you pick anybody you want.`, vetoPlay: [hoh, ...block] },
  ];
  for (const d of draws) {
    if (d.chip === 'choice') {
      steps.push({ k: 'beat', t: `${d.drawer} draws. The chip says HOUSEGUEST'S CHOICE.`, chip: { drawer: d.drawer, chip: 'choice' } });
      if (d.chose) steps.push({ k: 'say', by: d.drawer, push: true, t: `Houseguest's choice. ${d.chose}, you're playing.`, vetoPlay: [d.chose] });
    } else if (d.drew) {
      steps.push({ k: 'beat', t: `${d.drawer} draws ${d.drew}.`, chip: { drawer: d.drawer, chip: d.drew }, vetoPlay: [d.drew] });
    }
  }
  const players = new Set(steps.flatMap(s => s.vetoPlay || []));
  const others = ctx.house.filter(n => !players.has(n) && n !== hoh && !block.includes(n));
  return { id: 'bb-vdraw-v', kind: 'vdraw', anchor: 'veto', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    title: 'Veto Player Pick', kicker: 'Cam 04 · Living room', sub: 'Chips for the veto', day: ctx.day, time: '10:15',
    seated: seatLiving(block, [...players].filter(n => n !== hoh && !block.includes(n)).concat(others), hoh), steps };
}

// ── the veto meeting ───────────────────────────────────────────────────
function vetoMeetingScreen(act, ctx) {
  const holder = act.holder || ctx.vetoHolder;
  const before = ctx.nominees.slice();
  const hoh = act.chairAuthority || ctx.hoh;
  const steps = [{ k: 'bb', t: 'This is the Power of Veto meeting.', veto: holder, medal: 'on' }];
  const holderOnBlock = before.includes(holder);
  steps.push({ k: 'say', by: holder, t: holderOnBlock
    ? `I have called this meeting because I won the Power of Veto.`
    : `I have called this meeting because I won the Power of Veto. I'm going to give the nominees a chance to tell me why I should use it on them.` });
  if (!holderOnBlock) {
    for (const n of before) steps.push({ k: 'say', by: n, push: true, t: pickBy([
      `You know where I stand with you. Use it on me and I won't forget it.`,
      `I'm not going to beg. I'd just like to stay, and I think you know I'd return the favour.`,
      `Whatever you decide, I'll respect it. I just hope it's me.`,
      `I've been straight with you since day one. That's all I've got.`,
    ], `${ctx.week}|plea|${n}`) });
  }
  steps.push({ k: 'say', by: holder, push: true, t: `I've decided...`, medal: 'glint' });
  const after = (act.nominees || before).slice();
  if (act.used && act.saved) {
    steps.push({ k: 'say', by: holder, push: true, t: act.saved === holder ? `...to use the Power of Veto on myself.` : `...to use the Power of Veto on ${act.saved}.`,
      toast: ['VETO USED', '#d99a10'], exit: null });
    if (act.replacement) {
      steps.push({ k: 'say', by: hoh, t: `Since the veto has been used, I have to name a replacement nominee.` });
      steps.push({ k: 'say', by: hoh, push: true, t: `${act.replacement}, I'm sorry. You're going up.`,
        nom: after, seat: { [act.replacement]: after.indexOf(act.replacement) ? 'N1' : 'N-1', [act.saved]: 'stand2' }, toast: ['RENOMINATED', '#ff3355'] });
    }
  } else {
    steps.push({ k: 'say', by: holder, push: true, t: `...not to use the Power of Veto.`, toast: ['NOT USED', '#d99a10'] });
  }
  steps.push({ k: 'say', by: holder, t: 'This veto meeting is adjourned.' });
  const others = ctx.house.filter(n => !before.includes(n) && n !== holder);
  return { id: 'bb-cer-v', kind: 'cer', anchor: 'cer', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
    title: 'Veto Meeting', kicker: 'Cam 04 · Living room', sub: `${holder} holds the Power of Veto`, day: ctx.day, time: ACT_TIME['veto-ceremony'],
    seated: seatLiving(before, others, holder), medalOn: holder, steps };
}

// ── eviction night ─────────────────────────────────────────────────────
const PLEA = {
  default: [`I'm not going to make promises I can't keep. Keep me, and you'll know exactly what you're getting.`,
    `I've loved living with every one of you. I'd love one more week.`,
    `I'm loyal to the people who are loyal to me. Vote with your heart tonight.`],
  'target-warning': [`Before you vote, think about who benefits if I leave. It isn't you.`,
    `There's a plan being finished in this house tonight, and I'm not the end of it.`],
  'loyalty': [`I've kept every promise I made in here. I'm asking you to keep yours.`],
};
function evictionScreen(act, ctx, host) {
  const noms = (act.nominees || ctx.nominees).slice();
  const ballots = (act.ballots || []).filter(b => b && b.voter);
  const evicted = act.evicted;
  const steps = [{ k: 'host', by: host, t: `Good evening, houseguests. In a few moments one of you will be evicted. First, our nominees have one last chance to plead their case. ${noms[0]}, you're first.` }];
  const pleas = ctx.pleas || [];
  const said = new Set();
  for (const n of noms) {
    const p = pleas.find(x => x.speaker === n);
    const pool = [...(PLEA[p?.argumentType] || []), ...PLEA.default].filter(x => !said.has(x));
    const line = pickBy(pool, `${ctx.week}|${n}`);
    said.add(line);
    steps.push({ k: 'say', by: n, push: true, t: line });
  }
  if (ballots.length) {
    steps.push({ k: 'host', by: host, t: `Thank you. It's time for the live vote. One by one, you'll go to the Diary Room and vote to evict. ${ctx.hoh}, as Head of Household, you only vote in the event of a tie.` });
    for (const b of ballots) steps.push({ k: 'dr', by: b.voter, t: `I vote to evict ${b.evict}.`, ballot: [b.voter, b.evict] });
  }
  const tally = {};
  for (const b of ballots) tally[b.evict] = (tally[b.evict] || 0) + 1;
  const a = tally[evicted] || 0, others = ballots.length - a;
  steps.push({ k: 'host', by: host, t: `The votes are in. When I reveal the result, the evicted houseguest will have a few moments to say their goodbyes.` });
  if (act.tieBreak) {
    steps.push({ k: 'host', by: host, t: `We have a tie. ${ctx.hoh}, as Head of Household, you must cast the deciding vote, in front of everyone.` });
    steps.push({ k: 'say', by: ctx.hoh, push: true, t: `I vote to evict ${evicted}.` });
  }
  if (evicted) {
    if (ballots.length) steps.push({ k: 'host', by: host, push: true, t: a === ballots.length ? `By a unanimous vote...` : `By a vote of ${word(a)} to ${word(others)}...`, votes: [a, others] });
    steps.push({ k: 'host', by: host, t: `...${evicted}, you are evicted from the Big Brother house.`, out: evicted, toast: ['EVICTED', '#ff3355'], shake: true });
    steps.push({ k: 'beat', t: `${evicted} hugs the house goodbye, picks up a bag, and walks to the front door.` });
    steps.push({ k: 'beat', t: `The front door closes. On the memory wall, ${evicted}'s portrait goes black and white.`, exit: evicted });
  }
  const rest = ctx.house.filter(n => !noms.includes(n));
  return { id: 'bb-evict-v', kind: 'evict', anchor: 'evict', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'Live Eviction', kicker: 'Live · Eviction night', sub: `${listOf(noms)} on the block`, day: ctx.day, time: 'LIVE',
    seated: seatLiving(noms, [ctx.hoh, ...rest.filter(n => n !== ctx.hoh)]), tvObj: true, steps };
}

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
export function bbWeekSteps(row, { host = 'Valeria', priorEvicted = [] } = {}) {
  const house = (row.houseAtStart || []).slice();
  const ctx = { week: row.num || 1, hoh: row.hoh, house, nominees: (row.initialNominees || []).slice(), vetoHolder: row.vetoWinner,
    pleas: row.finalPleas || [], anchor: 'start', day: 1 };
  const out = [];
  let scenes = 0;
  let stretch = [];
  const aired = new Set();
  const beatsOf = act => { stretch.push(...(act.socialBeats || [])); };
  // a stretch of house life airs before the next ceremony
  const flush = () => {
    for (const b of chooseAired(stretch, AIRS_PER_STRETCH[ctx.anchor] ?? 3, aired)) out.push(sceneScreen(b, ctx, ++scenes));
    stretch = [];
  };
  const ceremony = scr => { flush(); out.push(scr); };
  for (const act of row.acts || []) {
    ctx.day = ((ctx.week - 1) * 7) + 1 + (ACT_DAY[act.type] ?? 0);
    switch (act.type) {
      case 'house': case 'campaign': beatsOf(act); break;
      case 'hoh':
        if (!act.preCrowned) ceremony(compScreen(act, ctx, 'hoh'));
        ctx.hoh = act.winner || ctx.hoh; ctx.anchor = 'hoh'; beatsOf(act); break;
      case 'nominations':
        if (act.byCoHoh) { beatsOf(act); break; }
        ctx.hoh = act.hoh || ctx.hoh;
        ceremony(nomScreen(act, ctx)); ctx.nominees = (act.nominees || ctx.nominees).slice(); ctx.anchor = 'noms'; beatsOf(act); break;
      case 'veto': {
        const draw = drawScreen(act, ctx);
        if (draw) ceremony(draw);
        ceremony(compScreen(act, ctx, 'veto')); ctx.vetoHolder = act.winner || act.vetoHolder; ctx.anchor = 'veto'; beatsOf(act); break;
      }
      case 'veto-ceremony':
        if (ctx.vetoHolder || act.holder) ceremony(vetoMeetingScreen(act, ctx));
        ctx.nominees = (act.nominees || ctx.nominees).slice(); ctx.anchor = 'cer'; beatsOf(act); break;
      case 'eviction':
        ceremony(evictionScreen(act, ctx, host)); ctx.anchor = 'evict'; beatsOf(act); break;
      default: beatsOf(act);
    }
  }
  flush();
  // The memory wall: this week's house plus everybody already evicted (black and white).
  const wall = [...house, ...priorEvicted.filter(n => !house.includes(n))];
  for (const s of out) { s.wall = wall; s.priorOut = priorEvicted.slice(); s.week = ctx.week; }
  if (out.length && !out.some(s => s.steps.some(st => st.hoh)) && ctx.hoh) out[0].steps[0] = { ...out[0].steps[0], hoh: ctx.hoh };
  return out;
}

/** Ids of the legacy screens these steps replace. Everything else is a twist and stays. */
export const REPLACED = /^bb-(hoh|noms|noms-2|vdraw|veto|cer|evict|plans|overview|house-\d+)$/;
export const ANCHOR_OF = id => (/^bb-hoh$/.test(id) ? 'hoh' : /^bb-noms/.test(id) ? 'noms' : /^bb-(vdraw|veto)$/.test(id) ? 'veto'
  : /^bb-cer$/.test(id) ? 'cer' : /^bb-evict$/.test(id) ? 'evict' : null);
