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

/** A written script (act.script.*) as steps. The camera moves in on its first spoken line. */
function scriptSteps(lines, extra = {}) {
  let pushed = false;
  return (lines || []).filter(l => l && l.text).map(l => {
    const k = l.kind === 'dr' ? 'dr' : l.kind === 'beat' ? 'beat' : 'say';
    const push = k === 'say' && !pushed ? (pushed = true) : false;
    return { k, by: l.by || null, t: l.text, ...(push ? { push: true } : {}), ...extra };
  });
}

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
  if (act.coHoh && !finalists.includes(act.coHoh)) finalists.splice(Math.min(1, finalists.length), 0, act.coHoh);
  const xs = spread(finalists.length);
  const isHoh = kind === 'hoh' || kind === 'final';   // a final part speaks like an HOH comp, never a veto
  const steps = [];
  steps.push({ k: 'bb', t: isHoh ? `Houseguests, it is time for the Head of Household competition.` : `Houseguests, it is time for the Power of Veto competition.` });
  if (isHoh && act.outgoingHoh) steps.push({ k: 'beat', t: `${act.outgoingHoh}, the outgoing Head of Household, sits this one out.` });
  const desc = String(comp.desc || '').split(/(?<=\.)\s/)[0];
  if (comp.name) steps.push({ k: 'beat', t: `${comp.name}. ${desc}` });
  // the competition's own play-by-play, as the engine wrote it
  for (const b of (comp.beats || []).slice(0, 6)) { const t = stripTags(b.text); if (t) steps.push({ k: 'beat', t }); }
  const early = results.slice(4);
  if (early.length) steps.push({ k: 'beat', t: `${listOf(early)} ${early.length > 1 ? 'are' : 'is'} out of it.` });
  for (const n of finalists.slice(1).reverse()) steps.push({ k: 'beat', t: `${n} is out. ${finalists.indexOf(n) === 1 ? 'It comes down to the last one standing.' : ''}`.trim() });
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
    steps.push({ k: 'beat', t: isHoh ? `${winner} wins Head of Household!` : `${winner} wins the Power of Veto!`,
      toast: [isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO', '#d99a10'], ...(isHoh ? { hoh: winner } : { veto: winner }) });
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
    legacy: isHoh ? /^bb-hoh(-\d+)?$/ : /^bb-veto(-\d+)?$/,
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
  const duo = act.duo?.blocks?.length ? act.duo : null;
  if (duo) return duoNomScreen(act, ctx, hoh, noms, seated, duo);
  if (act.anonymous) return anonNomScreen(act, ctx, hoh, noms, seated);
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
  if (act.script?.noms?.length) {
    steps.push(...scriptSteps(act.script.noms));
  } else if (act.target) {
    const why = act.target === act.backdoorTarget ? null
      : act.structure === 'expendables' ? `This isn't personal. I had to put two people up, and I went with the people I've connected with least.`
        : act.pawn ? `${act.pawn}, you're up there as a pawn, and you know that. ${act.target}, I think you know why you're sitting there.`
          : `${act.target}, I think you know why you're sitting there.`;
    if (why) steps.push({ k: 'say', by: hoh, t: why });
  }
  steps.push({ k: 'bb', t: 'This nomination ceremony is adjourned.' });
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
    steps.push({ k: 'beat', t: `${hoh} turns the ${ORD[bi] || 'next two'} keys together. ${a} and ${b} come up on the wall side by side, which is the only way either of them was ever going up.`, reveal: a });
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
  return { id: 'bb-vdraw-v', kind: 'vdraw', anchor: 'veto', label: 'The Draw', set: 'ceremony', room: ROOM_NAME.ceremony, cam: CAM.ceremony,
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
  if (act.diamond) steps.push({ k: 'say', by: holder, t: `This is the DIAMOND POWER OF VETO. If I use it, I name the replacement nominee myself, not the Head of Household.`, toast: ['DIAMOND VETO', '#22e1ff'] });
  steps.push({ k: 'say', by: holder, t: holderOnBlock
    ? `I have called this meeting because I won the Power of Veto.`
    : `I have called this meeting because I won the Power of Veto. I'm going to give the nominees a chance to tell me why I should use it on them.` });
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
      toast: ['VETO USED', '#d99a10'], exit: null });
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
      steps.push({ k: 'say', by: namer, t: act.diamond
        ? `The diamond veto has been used, so the replacement is mine to name.`
        : `Since the veto has been used, I have to name a replacement nominee.` });
      steps.push({ k: 'say', by: namer, push: true, t: `${act.replacement}, I'm sorry. You're going up.`,
        nom: after, seat: { [act.replacement]: after.indexOf(act.replacement) ? 'N1' : 'N-1', [act.saved]: 'stand2' }, toast: [act.diamond ? 'DIAMOND VETO' : 'RENOMINATED', '#ff3355'] });
      steps.push(...scriptSteps(act.script?.renom));
    }
  } else {
    steps.push({ k: 'say', by: holder, push: true, t: `...not to use the Power of Veto.`, toast: ['NOT USED', '#d99a10'] });
  }
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
  if (act.duoVote) {
    const dv = act.duoVote;
    steps.push({ k: 'host', by: host, t: `Tonight the votes are COUNTED BY DUO. The house did not vote for a houseguest tonight. It voted for a side.`, toast: ['COUNTED BY DUO', '#ff3355'] });
    for (const p of dv.perPair || []) steps.push({ k: 'beat', t: `${p.names.join(' and ')}: ${word(p.total)} ${p.total === 1 ? 'vote' : 'votes'} between them.` });
    if (dv.evicted && dv.survivor) steps.push({ k: 'beat', t: `${(dv.losing || []).join(' and ')} lose the count, and it is ${dv.evicted} who goes. ${dv.survivor} stays.` });
  }
  if (evicted) {
    if (ballots.length) steps.push({ k: 'host', by: host, push: true, t: a === ballots.length ? `By a unanimous vote...` : `By a vote of ${word(a)} to ${word(others)}...`, votes: [a, others] });
    steps.push({ k: 'host', by: host, t: `...${evicted}, you are evicted from the Big Brother house.`, out: evicted, toast: ['EVICTED', '#ff3355'], shake: true });
    const bye = scriptSteps(act.script?.goodbye);
    if (bye.length) steps.push({ k: 'beat', t: `${evicted} has a few seconds with the house.` }, ...bye, { k: 'beat', t: `${evicted} picks up a bag and walks to the front door.` });
    else steps.push({ k: 'beat', t: `${evicted} hugs the house goodbye, picks up a bag, and walks to the front door.` });
    steps.push({ k: 'beat', t: `The front door closes. On the memory wall, ${evicted}'s portrait goes black and white.`, exit: evicted });
  }
  const rest = ctx.house.filter(n => !noms.includes(n));
  return { id: 'bb-evict-v', kind: 'evict', anchor: 'evict', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'Eviction Night', kicker: 'Live · Eviction night', sub: `${listOf(noms)} on the block`, day: ctx.day, time: 'LIVE',
    seated: seatLiving(noms, [ctx.hoh, ...rest.filter(n => n !== ctx.hoh)]), tvObj: true, steps };
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
    seated: seatLiving(f.slice(0, 2), [], f[2] || null), tvObj: true, steps };
}

function finalPartScreen(act, ctx, n) {
  const comp = act.competition || {};
  const placements = comp.placements || [];
  const fake = { competition: comp, results: placements.map(name => ({ name })), winner: comp.winner };
  const S = compScreen(fake, ctx, 'final');
  S.id = `bb-final-hoh-${n}`;
  S.legacy = new RegExp(`^bb-final-hoh-${n}$`); S.kind = 'final-part'; S.anchor = 'finale';
  S.title = `Final HOH · ${act.part || `Part ${n}`}`;
  S.label = S.title;
  S.steps[0] = { k: 'bb', t: `Final Head of Household competition, ${String(act.part || `Part ${n}`).replace(/ —.*/, '')}.` };
  const last = n === 3;
  const win = S.steps.findIndex(s => s.toast);
  if (win >= 0) {
    S.steps[win] = last
      ? { k: 'beat', t: `${comp.winner} is the final Head of Household!`, toast: ['FINAL HOH', '#d99a10'], hoh: comp.winner }
      : { k: 'beat', t: `${comp.winner} wins ${act.part || `Part ${n}`} and moves on.`, toast: [`${String(act.part || 'Part').toUpperCase()}`.replace(/ —.*/, ''), '#d99a10'] };
  }
  return S;
}

function finalCutScreen(act, ctx) {
  const hoh = act.finalHoh;
  const others = [act.kept, act.cut].filter(Boolean);
  const steps = [{ k: 'bb', t: `${hoh}, as the final Head of Household, you will cast the sole vote to evict.` }];
  for (const p of act.pitches || []) steps.push(...spoken(p.name, p.text, { push: true }));
  steps.push({ k: 'say', by: hoh, push: true, t: `This is the hardest thing I've had to do in here.` });
  steps.push({ k: 'say', by: hoh, t: `I vote to evict ${act.cut}.`, out: act.cut, toast: ['EVICTED', '#ff3355'] });
  steps.push({ k: 'say', by: act.kept, push: true, t: `Final two. We made it.` });
  steps.push({ k: 'beat', t: `${act.cut} walks out the front door, and takes the last seat on the jury.`, exit: act.cut });
  return { id: 'bb-final-cut-v', kind: 'final-cut', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'The Final Cut', kicker: 'Live · Finale night', sub: `${hoh} decides`, day: ctx.day, time: 'LIVE',
    seated: seatLiving(others, [], hoh), steps };
}

function juryRoomSeats(finalTwo, jury) { return seatLiving(finalTwo, jury); }

function juryQuestionsScreen(act, ctx) {
  const steps = [];
  for (const ex of act.exchanges || []) {
    steps.push(...spoken(ex.juror, ex.question, { push: true, stance: [ex.juror, ex.stanceBefore || 'undecided', ex.asked] }));
    for (const a of ex.answers || []) {
      if (a.text) steps.push(...spoken(a.finalist, a.text, { push: a.finalist === ex.asked }));
      if (a.reaction) steps.push({ k: 'beat', t: stripTags(a.reaction) });
    }
  }
  if (!steps.length) steps.push({ k: 'beat', t: 'The jury has no questions tonight.' });
  return { id: 'bb-ftc-questions-v', kind: 'jury-q', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'The Jury Asks', kicker: 'Live · Finale night', sub: listOf(act.finalTwo || []), day: ctx.day, time: 'LIVE',
    seated: juryRoomSeats(act.finalTwo || [], act.jury || []), steps };
}

function closingScreen(act, ctx) {
  const steps = [];
  for (const st of act.statements || []) {
    if (st.intro) steps.push({ k: 'beat', t: stripTags(st.intro) });
    steps.push(...spoken(st.finalist, st.text, { push: true }));
    if (st.coda) steps.push(...spoken(st.finalist, st.coda));
  }
  return { id: 'bb-ftc-speeches-v', kind: 'closing', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'Closing Statements', kicker: 'Live · Finale night', sub: listOf(act.finalTwo || []), day: ctx.day, time: 'LIVE',
    seated: juryRoomSeats(act.finalTwo || [], ctx.jury || []), steps };
}

function juryVoteScreen(act, ctx, host, row) {
  const steps = [{ k: 'host', by: host, t: `Jurors, it is time to vote for the winner of Big Brother. One by one, cast your vote.` }];
  for (const r of act.reasoning || []) steps.push({ k: 'dr', by: r.juror, t: stripTags(r.reason) || `I vote for ${r.votedFor} to win Big Brother.`, juryVote: [r.juror, r.votedFor] });
  const tally = act.votes || {};
  const [a, b] = Object.keys(tally).sort((x, y) => tally[y] - tally[x]);
  steps.push({ k: 'host', by: host, t: `The votes are locked. I'll reveal them one at a time.` });
  const winner = row.winner || a;
  steps.push({ k: 'host', by: host, push: true, t: `By a vote of ${word(tally[winner] || 0)} to ${word(tally[winner === a ? b : a] || 0)}...`, votes: [tally[a] || 0, tally[b] || 0] });
  steps.push({ k: 'host', by: host, t: `...${winner}, you are the winner of Big Brother!`, toast: ['WINNER', '#d99a10'], shake: true, winner });
  steps.push({ k: 'say', by: winner, push: true, t: `I can't believe it. I really can't believe it.` });
  return { id: 'bb-jury-v', kind: 'jury-vote', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'The Jury Votes', kicker: 'Live · Finale night', sub: `${word((act.jury || []).length)} jurors`, day: ctx.day, time: 'LIVE',
    seated: juryRoomSeats(row.finalTwo || ctx.finalTwo || [], act.jury || []), tvObj: true, steps };
}

function favouriteScreen(act, ctx, host) {
  const steps = [{ k: 'host', by: host, t: `America voted all season for its favourite houseguest. The winner of ${act.prize ? `$${act.prize.toLocaleString('en-US')}` : 'the prize'} is...` },
    { k: 'host', by: host, push: true, t: `...${act.winner}!`, toast: ["AMERICA'S FAVOURITE", '#22e1ff'] }];
  if (act.reason) steps.push({ k: 'beat', t: `${act.winner} won it for ${stripTags(act.reason)}.` });
  return { id: 'bb-afh-v', kind: 'afp', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: "America's Favourite", kicker: 'Live · Finale night', sub: act.winner, day: ctx.day, time: 'LIVE',
    seated: seatLiving([], [act.winner, ...(ctx.jury || [])]), tvObj: true, steps };
}

function reunionScreen(act, ctx) {
  const steps = (act.segments || []).flatMap(sg => spoken(sg.speaker || (sg.players || [])[0], sg.text)).filter(x => x.t);
  if (!steps.length) return null;
  const who = [...new Set((act.segments || []).map(s => s.speaker).filter(Boolean))];
  return { id: 'bb-reunion-v', kind: 'reunion', anchor: 'finale', set: 'ceremony', room: ROOM_NAME.ceremony, cam: 1,
    title: 'The Reunion', kicker: 'Live · Finale night', sub: 'The whole cast, one more time', day: ctx.day, time: 'LIVE',
    seated: seatLiving(act.finalTwo || [], who), steps };
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
  const steps = [
    { k: 'bb', t: `Houseguests, it is time for the Wildcard. I will draw ${word(drawnN)} names from this hat. Nobody chooses to play.`, rule: 1 },
    { k: 'bb', t: 'The houseguests drawn will play one puzzle. The best score wins.', rule: 2 },
    { k: 'bb', t: 'The winner will be offered safety for this week.', rule: 3 },
    { k: 'bb', t: 'But safety has a price. The winner can take it and pay, or turn it down.', rule: 4 },
  ];
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
    kicker: 'Cam 04 · Living room', title: 'The Wildcard', label: 'The Wildcard', sub: 'Three names, one offer',
    seated: seatLiving([], ctx.house.filter(n => n !== ctx.hoh), ctx.hoh),
    wild: { n: drawnN, price: act.punishmentLabel, houseWide: !!act.houseWide },
    rules: [['THE HAT', `${word(drawnN)} names are drawn — nobody chooses to play`], ['ONE PUZZLE', 'the best score wins'],
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
    steps.push({ k: 'beat', t: b.part === 'evicted' ? `${a} leaves the house still holding ${b.power}. Nobody inside ever knew.`
      : `${a} has held ${b.power} since week ${b.since} and never played it. Tonight it expires.`, expCard: [a, b.power, b.part], at: [[a, 50]] },
      ...(b.lines?.length ? scriptSteps(b.lines) : []));
  }
  if (!steps.length) return [];
  return [{
    id: `bb-expired-w${ctx.week}`, kind: 'expired', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: ROOM_NAME.dr, cam: CAM.dr, time: '23:50',
    kicker: 'Cam 01 · Diary room', title: 'Never played', label: 'Never played', sub: 'The house never knew', cast: [], expired: true, steps,
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
  const steps = [
    { k: 'bb', t: `Houseguests, ${who} has played a power: ${act.name}.`, rule: 1 },
    ...(act.blurb ? [{ k: 'bb', t: act.blurb, rule: 2 }] : []),
  ];
  const set = POWER_ROOM[act.powerId] || 'ceremony';
  for (const b of beats) {
    if (b.part === 'lobby') { const said = linesOf(b); if (said.length) said[0] = { ...said[0], at: [[b.players[0], 36], [who, 64]] }; steps.push(...said); }
    if (b.part === 'relic') steps.push({ k: 'beat', t: `${who} names the only four houseguests who can play for Head of Household: ${listOf(act.eligible || [])}.`, pwMark: 'relic', toast: ['THE FOUR', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'broken') steps.push(...linesOf(b));
    if (b.part === 'cloud') steps.push({ k: 'beat', t: `${who} cannot be nominated at this ceremony.`, pwMark: 'cloud', toast: ['UNDER THE CLOUD', '#22e1ff'] }, ...linesOf(b));
    if (b.part === 'buyoff') steps.push({ k: 'beat', t: `${who} hands ${act.hoh} $10,000 and steps off the block. ${act.replacement} goes up instead.`, pwMark: 'buyoff', toast: ['BOUGHT OFF THE BLOCK', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'coup') steps.push({ k: 'bb', t: `${listOf(b.removed || [])}, you are off the block. ${listOf(b.named || [])}, you are now nominated.`, pwMark: 'coup', toast: ["COUP D'ÉTAT", '#ff3355'] }, ...linesOf(b));
  }
  return [{
    id: `bb-pw-${act.powerId}-w${ctx.week}`, kind: 'power', anchor: ctx.anchor, day: ctx.day, set, room: ROOM_NAME[set], cam: CAM[set],
    time: act.timing === 'veto-ceremony' ? ACT_TIME['veto-ceremony'] : act.powerId === 'hoh-gatekeeper' ? '18:30' : ACT_TIME.nominations,
    kicker: `Cam ${String(CAM[set]).padStart(2, '0')} · ${ROOM_NAME[set]}`, title: act.name, label: act.name, sub: `${who} plays it`,
    cast: [[who, 50]], power: { name: act.name, holder: who },
    rules: [['THE POWER', act.name], ...(act.blurb ? [['WHAT IT DOES', act.blurb]] : [])],
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
  for (const b of beats) {
    if (b.part === 'still' || b.part === 'kept' || b.part === 'stand' || b.part === 'cost') steps.push(...linesOf(b));
    if (b.part === 'used') steps.push({ k: 'beat', t: anon ? `${act.saved} comes off the block. Nobody sees who did it.`
      : act.saved === act.holder ? `${act.holder} uses the second veto to come off the block.` : `${act.holder} uses the second veto on ${act.saved}.`, v2Save: act.saved, toast: ['THE SECOND VETO', '#f5c542'] }, ...linesOf(b));
    if (b.part === 'chair') steps.push({ k: 'beat', t: `${act.authority} names ${act.replacement} as the replacement nominee.`, v2Rep: act.replacement, toast: ['ONE MORE CHAIR', '#ff3355'] }, ...linesOf(b));
  }
  if (!act.used) steps.push({ k: 'beat', t: anon ? 'The second veto is not used.' : `${act.holder} does not use it. The block stays as it is.`, v2Kept: true });
  return [{
    id: `bb-veto2-w${ctx.week}`, kind: 'veto2', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: 'Living Room', cam: 4, time: ACT_TIME['veto-ceremony'],
    kicker: 'Cam 04 · Living room', title: act.kind === 'secret' ? 'The Secret Veto' : found ? 'The Found Veto' : 'The Second Veto',
    label: act.kind === 'secret' ? 'Secret Veto' : 'Second Veto', sub: 'The meeting ends twice',
    seated: seatLiving(before, ctx.house.filter(n => !before.includes(n) && n !== ctx.hoh), ctx.hoh), veto2: { before, holder: anon ? null : act.holder },
    rules: [['A SECOND VETO', found ? 'found hidden in the house' : anon ? 'held anonymously' : 'won in the competition'], ['AFTER THE MEETING', 'used once the first ceremony is over'],
      ['ONE MORE CHAIR', 'whoever comes down is replaced']],
    rulesTitle: 'THE SECOND VETO · HOW IT WORKS', steps,
  }];
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
export function bbWeekSteps(row, { host = 'Valeria', priorEvicted = [], plea = null } = {}) {
  const house = (row.houseAtStart || []).slice();
  const ctx = { week: row.num || 1, hoh: row.hoh, house, nominees: (row.initialNominees || []).slice(), vetoHolder: row.vetoWinner,
    pleas: row.finalPleas || [], plea, anchor: 'start', day: 1, jury: [...(row.jury || [])], finalTwo: [...(row.finalTwo || [])] };
  let finalPart = 0;
  // Houseguests who walk in later in the week (rivals) are not in the house until they do.
  const late = (row.acts || []).find(a => a.type === 'rivals-open')?.arrived || [];
  ctx.hidden = new Set(late);
  const out = [];
  let scenes = 0;
  let stretch = [];
  const aired = new Set();
  const beatsOf = act => { stretch.push(...(act.socialBeats || [])); };
  // a stretch of house life airs before the next ceremony
  const flush = () => {
    for (const b of chooseAired(stretch, AIRS_PER_STRETCH[ctx.anchor] ?? 3, aired)) {
      if ((b.players || []).some(n => ctx.hidden.has(n))) continue;
      const sc = sceneScreen(b, ctx, ++scenes); sc.hidden = new Set(ctx.hidden); out.push(sc);
    }
    stretch = [];
  };
  const ceremony = scr => { flush(); scr.hidden = new Set(ctx.hidden); out.push(scr); };
  for (const act of row.acts || []) {
    ctx.day = ((ctx.week - 1) * 7) + 1 + (ACT_DAY[act.type] ?? (row.isFinale ? 6 : 0));
    switch (act.type) {
      case 'house': case 'campaign': beatsOf(act); break;
      case 'hoh':
        if (!act.preCrowned) ceremony(compScreen(act, ctx, 'hoh'));
        ctx.hoh = act.winner || ctx.hoh; ctx.anchor = 'hoh'; beatsOf(act); break;
      case 'nominations':
        if (act.byCoHoh) { ceremony({ ...nomScreen(act, ctx), id: 'bb-noms-2v', title: `Nominations · ${act.hoh || 'Second HOH'}`, label: `Nominations · ${act.hoh || 'Second HOH'}` }); beatsOf(act); break; }
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
      case 'finale-house': out.push(...finaleHouseScreens(act, ctx)); ctx.anchor = 'finale'; break;
      case 'finale-brief': ceremony(finaleBriefScreen(act, ctx, host)); break;
      case 'final-hoh-part': finalPart = act.partNum || finalPart + 1; ceremony(finalPartScreen(act, ctx, finalPart)); break;
      case 'final-cut': ceremony(finalCutScreen(act, ctx)); ctx.finalTwo = [act.finalHoh, act.kept].filter(Boolean); ctx.jury = [...(row.jury || [])]; break;
      case 'jury-questioning': ctx.jury = act.jury || ctx.jury; ceremony(juryQuestionsScreen(act, ctx)); break;
      case 'closing-statements': ceremony(closingScreen(act, ctx)); break;
      case 'jury-vote': ceremony(juryVoteScreen(act, ctx, host, row)); break;
      case 'americas-favourite': ceremony(favouriteScreen(act, ctx, host)); break;
      case 'reunion': { const r = reunionScreen(act, ctx); if (r) ceremony(r); break; }
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
      case 'power-played': { const pw = powerScreens(act, ctx); if (pw) { flush(); for (const scr of pw) ceremony(scr); } else { flush(); out.push({ slot: act.type }); } beatsOf(act); break; }
      case 'second-veto': flush(); for (const scr of secondVetoScreens(act, ctx)) ceremony(scr); if (act.used) ctx.nominees = [...(act.nominees || ctx.nominees)]; beatsOf(act); break;
      case 'coin-of-destiny': flush(); for (const scr of coinScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'power-expired': flush(); for (const scr of expiredScreens(act, ctx)) ceremony(scr); break;
      case 'whacktivity': flush(); for (const scr of whackScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'interrogation': flush(); for (const scr of interrogationScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'time-capsule': flush(); for (const scr of capsuleScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'wildcard': flush(); for (const scr of wildcardScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'safety-suite': flush(); for (const scr of suiteScreens(act, ctx)) ceremony(scr); beatsOf(act); break;
      case 'rivals-hoh':
        // the latecomers walk in here: from now on they are in the house
        flush(); out.push({ slot: act.type }); ctx.hidden = new Set(); beatsOf(act); break;
      default:
        if (TWIST_SLOT.test(act.type)) { flush(); out.push({ slot: act.type }); }
        beatsOf(act);
    }
  }
  flush();
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
  return out;
}

/** Ids of the legacy screens these steps replace. Everything else is a twist and stays. */
export const REPLACED = /^bb-(noms|noms-2|vdraw|cer|evict|plans|final-cut|ftc-questions|ftc-speeches|jury|afh|reunion|finale-brief|safetysuite|chain|hidden-hidden|hidden-search|hidden-found|hidden-expired|prizeexchange|duo-week-open|duo-week-events|duo-week-out|camp|campdoor|wildcard|secret-power|timecapsule|power-hoh-interrogation|power-deepfake-hoh|whacktivity|power-hoh-gatekeeper|power-the-cloud|power-buy-off|power-coup-d-etat|coin|secondveto-[a-z]+)(-\d+)?$/;
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
