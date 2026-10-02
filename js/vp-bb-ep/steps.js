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
  } else if (isHoh && act.coHoh) {
    steps.push({ k: 'beat', t: `${winner} and ${act.coHoh} both win. TWO HEADS OF HOUSEHOLD this week, and each of them names a block.`, toast: ['TWO HOHS', '#d99a10'], hoh: winner });
  } else {
    steps.push({ k: 'beat', t: isHoh ? `${winner} wins Head of Household!` : `${winner} wins the Power of Veto!`,
      toast: [isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO', '#d99a10'], ...(isHoh ? { hoh: winner } : { veto: winner }) });
  }
  if (!(isHoh && act.secret)) steps.push({ k: 'say', by: winner, push: true, t: pickBy(isHoh
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
    steps.push({ k: 'beat', t: `${evicted} hugs the house goodbye, picks up a bag, and walks to the front door.` });
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
export function bbWeekSteps(row, { host = 'Valeria', priorEvicted = [] } = {}) {
  const house = (row.houseAtStart || []).slice();
  const ctx = { week: row.num || 1, hoh: row.hoh, house, nominees: (row.initialNominees || []).slice(), vetoHolder: row.vetoWinner,
    pleas: row.finalPleas || [], anchor: 'start', day: 1, jury: [...(row.jury || [])], finalTwo: [...(row.finalTwo || [])] };
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
export const REPLACED = /^bb-(noms|noms-2|vdraw|cer|evict|plans|final-cut|ftc-questions|ftc-speeches|jury|afh|reunion|finale-brief)(-\d+)?$/;
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
