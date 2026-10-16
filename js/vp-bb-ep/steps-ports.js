// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/steps-ports.js — the twists, themes and modes the stepped viewer
// still showed as classic screens, ported to steps
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-16: "go for 11". A tests/zz-bb-coverage probe listed sixty
// classic screens airing in the middle of a stepped week: the six themes'
// antagonist, primer and turn; double and triple evictions, America's Vote,
// Instant Eviction, the Have-Nots and the walkouts; and the secret-competition
// twists. Each one here says what its classic screen said (docs/ADDING-A-SHOW.md
// §18.3: inventory the classic screen first, and give every fact a place: the
// stage, the script or the side panel), with the same step vocabulary as
// steps.js. steps.js hands in its helpers (`kit`), so this file imports nothing
// back from it.

const strip = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** An act's own beats (the ones the classic screen drew as cards), as steps. */
export function beatSteps(act, kit) {
  const out = [];
  for (const b of act?.beats || []) {
    if (b?.lines?.length) out.push(...kit.scriptSteps(b.lines));
    else if (b?.text) out.push({ k: 'beat', t: strip(b.text) });
  }
  return out;
}

// ── The themes' antagonist ─────────────────────────────────────────────
// The voice speaks from the house itself: the living room, the house listening.
// Each theme has its own way of cutting in, and its own colour (the theme's
// palette accent; red once the season has turned).
// Three ways in each, taken in turn through the week, so four lines a week do not cut in the same way four times.
const THEME_VOICE = {
  'summer-of-temptation': { color: '#e0a848', cuts: ["A red light comes on over the Den's door, and the speakers click on.",
    'The lights in the room drop to red. The Den is talking.', "Somewhere behind the walls a door unlocks, and the Den's voice fills the room."] },
  'machine-summer': { color: '#3ad6c4', cuts: ['The panel in the living room wall lights up. CORA is talking.',
    'Every screen in the house flickers at once, and CORA comes on.', 'A soft chime from the walls. CORA would like everybody\'s attention.'] },
  'summer-of-mystery': { color: '#4fbf8b', cuts: ['The lights dip, and a calm voice comes through the speakers.',
    "A front-desk bell rings somewhere in the house, and the Mastermind's voice follows it.", 'The lights flicker and steady. The Mastermind has a word for the guests.'] },
  'high-rollers': { color: '#c9a227', cuts: ['A bell rings out on the casino floor, and the Pit Boss comes over the speakers.',
    'Chips rattle over the speakers, and the Pit Boss clears his throat.', 'The lights dim to the green of a card table. The Pit Boss has a word.'] },
  'summer-camp': { color: '#fcd34d', cuts: ['The camp loudspeaker crackles, and a whistle blows.',
    'A bugle call comes over the speakers, badly played. The Head Counsellor has an announcement.', 'Three sharp whistle blasts. Camp announcement!'] },
  'summer-school': { color: '#7dd3fc', cuts: ['The school bell rings, and the intercom clicks on.',
    'The intercom squeals with feedback, and the Yearbook starts reading.', "A bell, a click, and the Yearbook's voice from the speaker over the door."] },
};
const HOOK_ORDER = ['open', 'noms', 'veto', 'vote', 'finale', 'crown'];
const HOOK_LEAD = {
  open: 'A new week in the house.',
  noms: 'The nominees are still at the table.',
  veto: 'The veto meeting has only just broken up.',
  vote: 'The front door has barely closed.',
  finale: 'The last night in the house.',
  crown: 'The confetti is still coming down.',
};
export const voiceOf = (themeId, mood) => {
  const v = THEME_VOICE[themeId] || { color: '#f0c040', cuts: ['The speakers in the living room click on.'] };
  return { ...v, color: mood === 'hostile' ? '#ff3b30' : v.color };
};

/** The antagonist cutting in: how it comes on, then the line. Folded onto the end of the ceremony it answers when it
 *  follows straight on from one (steps.js), or a screen of its own. */
export function themeVoiceSteps(act, ctx, folded = false) {
  const v = voiceOf(act.themeId, act.mood);
  const hook = act.hook || 'beat';
  const cut = v.cuts[((ctx.week || 1) + Math.max(0, HOOK_ORDER.indexOf(hook))) % v.cuts.length];
  return [
    { k: 'beat', t: folded ? cut : `${HOOK_LEAD[hook] || ''} ${cut}`.trim() },
    { k: 'voice', by: act.speaker || 'The Voice', t: strip(act.line), vc: v.color, ...(act.mood === 'hostile' ? { toast: [String(act.speaker || 'THE VOICE').toUpperCase(), v.color] } : {}) },
  ];
}

export function themeBeatScreens(act, ctx, kit) {
  if (!act?.line) return [];
  const hook = act.hook || 'beat';
  const steps = themeVoiceSteps(act, ctx);
  const here = kit.houseNow(ctx);
  return [{
    id: `bb-theme-${hook}-v`, kind: 'voice', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4,
    time: hook === 'vote' ? 'LIVE' : hook === 'noms' ? kit.ACT_TIME.nominations : hook === 'veto' ? kit.ACT_TIME['veto-ceremony'] : '09:30',
    kicker: 'Cam 04 · Living room', title: act.speaker || 'The Voice', label: act.speaker || 'The Voice', sub: 'The house is listening',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps,
  }];
}

/** Night one: the season explains itself to the person watching it. */
export function themePrimerScreens(act, ctx, kit) {
  const p = act?.primer || {};
  const v = voiceOf(act.themeId, 'neutral');
  const rules = (p.rules || []).map((r, i) => [['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'][i] || String(i + 1), strip(r)]);
  const steps = [
    { k: 'beat', t: `${act.name || 'This season'}. ${act.tagline || ''}`.trim(), big: ['This season', act.name || ''] },
  ];
  if (p.what) steps.push({ k: 'beat', t: strip(p.what) });
  if (p.who) steps.push({ k: 'beat', t: strip(p.who) });
  rules.forEach(([, r], i) => steps.push({ k: 'beat', t: r, rule: i + 1, quiet: true }));
  if (p.register?.neutral) steps.push({ k: 'beat', t: `How it starts: ${strip(p.register.neutral)}` });
  if (p.watch) steps.push({ k: 'beat', t: `What to watch for: ${strip(p.watch)}` });
  return [{
    id: 'theme-primer-v', kind: 'primer', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '08:00',
    kicker: 'This season', title: act.name || 'This Season', label: 'This Season', sub: act.tagline || '', cast: [],
    rules, rulesTitle: `${String(act.name || 'THIS SEASON').toUpperCase()} · WHAT IS DIFFERENT`, voiceColor: v.color, steps,
  }];
}

/** The week the antagonist's register changes. */
export function themeTurnScreens(act, ctx, kit) {
  const v = voiceOf(act.themeId, act.to);
  const from = strip(act.registers?.from || act.from), to = strip(act.registers?.to || act.to);
  const steps = [
    { k: 'beat', t: strip(act.body) || `${act.speaker} is not who it was on Sunday.`, big: ['The turn', String(act.headline || 'THE TURN')], shake: true },
    { k: 'beat', t: `Until now: ${from}`, rule: 1, quiet: true },
    { k: 'beat', t: `From here: ${to}`, rule: 2, quiet: true, toast: [String(act.speaker || 'THE VOICE').toUpperCase(), v.color] },
  ];
  const here = kit.houseNow(ctx);
  return [{
    id: 'theme-turn-v', kind: 'turn', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '23:40',
    kicker: 'Cam 04 · Living room', title: act.headline ? kit.titleCase(act.headline) : 'The Turn', label: 'The Turn', sub: `${act.speaker || 'The voice'} is not who it was on Sunday`,
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), nv: act.to === 'hostile',
    rules: [['UNTIL NOW', from], ['FROM HERE', to]], rulesTitle: `${String(act.speaker || 'THE VOICE').toUpperCase()} · THE REGISTER CHANGES`, steps,
  }];
}

// ── The Have-Nots ──────────────────────────────────────────────────────
// Nobody picks them: the bottom of the HOH competition's scoreboard does.
export function haveNotScreens(act, ctx, kit) {
  const names = act.names || [];
  if (!names.length) return [];
  const why = n => (act.reasons || []).find(r => r.name === n);
  const rows = [];
  const steps = [
    { k: 'bb', t: 'Houseguests, it is time to reveal this week\'s Have-Nots.', rule: 1 },
    { k: 'bb', t: `Nobody chooses them. The bottom ${kit.word(names.length)} of the Head of Household competition are Have-Nots.`, rule: 2 },
    { k: 'bb', t: 'Have-Nots eat only slop, take cold showers and sleep in the Have-Not room until the next Head of Household is crowned.', rule: 3 },
  ];
  if (act.hoh) steps.push({ k: 'beat', t: `${act.hoh} won it, so ${act.hoh} eats this week.` });
  for (const n of names) {
    const r = why(n);
    rows.push({ n, text: r ? r.why : 'have-not' });
    steps.push({ k: 'bb', t: `${n}, you are a Have-Not.`, board: { title: 'THE HAVE-NOTS', rows: rows.slice() } });
  }
  if ((act.exempt || []).length) steps.push({ k: 'beat', t: `${kit.listOf(act.exempt)} sat the competition out, and cannot come last in a competition they were not in.` });
  steps.push({ k: 'beat', t: `${kit.listOf(names)} pick up their bowls of slop.`, why: ['Slop costs a Have-Not between a point and a half and three points in every competition this week, the veto included.'] });
  steps.push(...beatSteps(act, kit));
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-havenots-v', kind: 'havenots', anchor: ctx.anchor, day: ctx.day, set: 'kitchen', room: kit.ROOM_NAME.kitchen, cam: kit.CAM.kitchen, time: '10:15',
    kicker: 'Cam 02 · Kitchen', title: 'Have-Nots', label: 'Have-Nots', sub: 'The bottom of the scoreboard goes on slop',
    cast: here.slice(0, 10).map((n, i, a) => [n, Math.round(14 + (72 * i) / Math.max(1, a.length - 1))]),
    rules: [['THE SCOREBOARD', 'the bottom of the HOH competition'], ['NOBODY CHOOSES', `${names.length} Have-Nots this week`], ['A WEEK OF IT', 'slop, cold showers, the Have-Not room']],
    rulesTitle: 'HAVE-NOTS · HOW IT WORKS', steps,
  }];
}

// ── A houseguest leaves without the house deciding ──────────────────────
export function departureScreens(act, ctx, kit, pron) {
  const a = act.name;
  if (!a) return [];
  const p = pron(a);
  const expelled = act.kind === 'expulsion';
  const steps = expelled ? [
    { k: 'beat', t: `It stops being an argument. ${a} puts hands on ${act.other || 'another houseguest'}, and the house goes very quiet very quickly.`, toast: ['ALTERCATION', '#ff3355'], shake: true, tense: [a, act.other].filter(Boolean) },
    { k: 'bb', t: `${a}, please come to the Diary Room.` },
    { k: 'beat', t: `${a} is taken out through the door ${p.sub} came in by, and does not come back.`, out: a, cut: { plate: 'foyer', who: a, phase: 'open' } },
    { k: 'bb', t: `Houseguests, ${a} has been removed from the Big Brother house. There will be no eviction this week.`, toast: ['EXPELLED', '#ff3355'] },
  ] : [
    { k: 'beat', t: `${a} has been counting days for a while, and today the number stops meaning anything.` },
    { k: 'beat', t: `${a} asks Big Brother to leave. It is not a threat and it is not a move. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} finished, and the house realises it is not a bluff.`, toast: ['WALKS OUT', '#ff3355'] },
    { k: 'beat', t: `${a} picks up a bag and walks to the front door. Nobody tries to stop ${p.obj}.`, out: a, door: true, cut: { plate: 'foyer', who: a, phase: 'open' } },
    { k: 'bb', t: `Houseguests, ${a} has left the Big Brother house. There will be no eviction this week.`, toast: ['NO VOTE', '#9aa4b2'] },
  ];
  steps.push({ k: 'beat', t: expelled ? 'The house is already down one, and everybody in it saw why.' : 'Somebody who was going to be voted out just got another week.' });
  steps.push(...beatSteps(act, kit));
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-departure-v', kind: 'departure', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '16:20',
    kicker: 'Cam 04 · Living room', title: expelled ? 'Expulsion' : 'A Houseguest Walks', label: expelled ? 'Expulsion' : 'Walkout',
    sub: expelled ? 'Removed from the house' : 'Nobody voted. Nobody had to.',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps,
  }];
}

// ── Instant Eviction: the HOH nominates behind a locked door ────────────
export function instantScreens(act, ctx, kit) {
  const noms = act.nominees || [];
  const seq = act.sequestered || null;
  const steps = [
    { k: 'bb', t: 'Houseguests, this is an Instant Eviction. Nominations, the veto and the vote all happen tonight.', rule: 1, toast: ['INSTANT EVICTION', '#ff3355'] },
    { k: 'bb', t: 'There is no Power of Veto this week. The block the Head of Household makes is the block the house votes on.', rule: 2 },
  ];
  if (seq) {
    steps.push({ k: 'beat', t: `${act.hoh} is put in ${strip(seq.where)}. ${strip(seq.how)}`, toast: ['SEQUESTERED', '#ff8b84'] });
    steps.push({ k: 'beat', t: `No conversations, no pitches, nobody coming up to explain why it should be somebody else. ${act.hoh} nominates on what ${act.hoh} knew when the competition ended.` });
  }
  if (act.overheard) {
    steps.push({ k: 'beat', t: strip(act.overheard.text), toast: ['THE SCREEN IS STILL ON', '#ff3355'] });
    if (act.overheard.reaction) steps.push({ k: 'beat', t: strip(act.overheard.reaction) });
  }
  steps.push({ k: 'bb', t: `${kit.listOf(noms)}, you are on the block. Nothing is coming off it.`, nom: noms, big: [kit.listOf(noms), 'The block is final'] });
  if (act.regret) {
    steps.push({ k: 'beat', t: strip(act.regret.text), toast: ['TOO LATE', '#9aa4b2'] });
    if (act.regret.cost) steps.push({ k: 'beat', t: strip(act.regret.cost) });
  }
  steps.push({ k: 'beat', t: 'The house votes tonight. Whatever plan either of them had needed a week, and they have an evening.' });
  steps.push(...beatSteps(act, kit));
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-instant-v', kind: 'instant', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 1, time: 'LIVE', tvObj: true,
    kicker: 'Live · Instant eviction', title: 'Instant Eviction', label: 'Instant Eviction', sub: seq ? 'Nominated alone, behind a locked door' : 'No veto. The block is final.',
    seated: kit.seatLiving(noms, here.filter(n => !noms.includes(n) && n !== act.hoh), act.hoh),
    rules: [['TONIGHT', 'nominations, the veto and the vote'], ['NO VETO', 'the block is final']], rulesTitle: 'INSTANT EVICTION · HOW IT WORKS', steps,
  }];
}

// ── A second (or third) eviction, starting now ──────────────────────────
export function doubleBreakScreen(ctx, kit, { nth = 2, host }) {
  const third = nth >= 3;
  const steps = [
    { k: 'host', by: host, t: third ? 'Nobody sit down. There is a third eviction tonight, and it starts right now.'
      : 'Houseguests, please take your seats. There is a second eviction tonight, and it starts right now.', toast: [third ? 'TRIPLE EVICTION' : 'DOUBLE EVICTION', '#ff3355'], shake: true },
    { k: 'beat', t: third ? 'Another whole week, from the Head of Household to the vote, run by a house that has just watched two people walk out of it.'
      : 'A whole week, from the Head of Household to the vote, in the time it usually takes to argue about one nomination.' },
    { k: 'host', by: host, t: 'Everybody except the outgoing Head of Household, head out to the backyard. The next competition is waiting.' },
  ];
  const here = kit.houseNow(ctx);
  return {
    id: `bb-double-${nth}-v`, kind: 'double', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 1, time: 'LIVE', tvObj: true,
    kicker: 'Live · The night is not over', title: third ? 'Still Not Done' : 'And We Are Not Done', label: third ? 'Eviction 3' : 'Double Eviction',
    sub: 'The front door has not finished closing', seated: kit.seatLiving([], here), steps,
  };
}

// ── America's Vote: seven days of the public, read out live ─────────────
export function americasVoteScreens(act, ctx, kit, host) {
  const reveal = act.reveal || [...(act.tally || [])].sort((a, b) => a.share - b.share);
  const noms = act.nominees || ctx.nominees || [];
  const rowsUpTo = k => reveal.slice(0, k).map(r => ({ n: r.name, v: (r.share || 0) / 100, text: `${r.share}%` }));
  const steps = [
    { k: 'host', by: host, t: strip(act.closing) || 'The lines are now closed.', toast: ['LINES CLOSED', '#ff3355'] },
    { k: 'host', by: host, t: strip(act.address) || 'For seven days the public have been voting.' },
    { k: 'beat', t: 'Nobody in the house could campaign for a single one of these votes. They find out at the same moment you do.' },
    { k: 'host', by: host, t: strip(act.tease) || 'I am going to read it out.' },
  ];
  // a two-way vote is read on the name: the first number would give the second away
  if (reveal.length > 2) reveal.slice(0, -1).forEach((r, i) => steps.push({ k: 'host', by: host, t: `${r.name}: ${r.share}%.`, board: { title: "AMERICA'S VOTE", rows: rowsUpTo(i + 1) } }));
  const top = reveal.find(r => r.name === act.target);
  steps.push({ k: 'host', by: host, push: true, t: strip(act.resultLine) || `${act.target}: ${top ? top.share : 0}%.`, board: { title: "AMERICA'S VOTE", rows: rowsUpTo(reveal.length) },
    big: [act.target, "America's vote", 'out'], tense: noms });
  steps.push({ k: 'beat', t: `${act.target}'s name goes in with the house's ballots${act.weight > 1 ? `, ${kit.word(act.weight)} times over` : ''}. Not one person in that house had a say in it.`,
    why: [`America's vote counts as ${act.weight > 1 ? `${act.weight} ballots` : 'one ballot'} in tonight's tally.`] });
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-avote-v', kind: 'avote', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 1, time: 'LIVE', tvObj: true,
    kicker: "Live · America's vote", title: 'America Has Voted', label: "America's Vote", sub: 'Seven days of voting, read out in one sentence',
    seated: kit.seatLiving(noms, here.filter(n => !noms.includes(n) && n !== ctx.hoh), ctx.hoh), steps,
  }];
}
