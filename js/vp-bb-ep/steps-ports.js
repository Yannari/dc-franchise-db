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

// two houseguests noticing the turn, in each theme's own terms
const TURN_TALK = {
  'machine-summer': [['a', 'Did CORA just stop saying please?'], ['b', 'She stopped saying please on Tuesday. You only just noticed.'], ['a', "That's worse."]],
  'summer-of-temptation': [['a', 'The Den said the price out loud tonight.'], ['b', "It's never said the price before."], ['a', "Then it's done pretending."]],
  'summer-of-mystery': [['a', "There's somebody at the front desk now."], ['b', 'Who?'], ['a', "That's what I'm asking."]],
  'high-rollers': [['a', 'They stopped bringing the drinks round.'], ['b', 'Nobody said the drinks were free forever.'], ['a', "Nobody said they weren't."]],
  'summer-camp': [['a', 'No whistle this morning.'], ['b', 'Maybe the Head Counsellor slept in.'], ['a', "The Head Counsellor doesn't sleep."]],
  'summer-school': [['a', 'The cliques are gone.'], ['b', "So who's covering me now?"], ['a', "Nobody. That's the point."]],
};

/** The week the antagonist's register changes. */
export function themeTurnScreens(act, ctx, kit) {
  const v = voiceOf(act.themeId, act.to);
  const from = strip(act.registers?.from || act.from), to = strip(act.registers?.to || act.to);
  // A theme that knows how its show announced the turn plays that, in the show's own voices
  // (A Summer of Mystery: the host announced the Month of Mayhem live, and then the Mastermind spoke).
  const live = (act.live || []).map(([who, t], i) => (who === 'host'
    ? { k: 'host', by: ctx.host, t, ...(i === 0 ? { big: ['The turn', String(act.headline || 'THE TURN')] } : {}) }
    : { k: 'voice', own: true, by: act.speaker, vc: v.color, t, ...(i === 0 ? { big: ['The turn', String(act.headline || 'THE TURN')] } : {}) }));
  const steps = live.length ? [...live,
    { k: 'beat', t: `Until now: ${from}`, rule: 1, quiet: true },
    { k: 'beat', t: `From here: ${to}`, rule: 2, quiet: true, toast: [String(act.speaker || 'THE VOICE').toUpperCase(), v.color] },
  ] : [
    { k: 'beat', t: strip(act.body) || `${act.speaker} is not who it was on Sunday.`, big: ['The turn', String(act.headline || 'THE TURN')], shake: true },
    { k: 'beat', t: `Until now: ${from}`, rule: 1, quiet: true },
    { k: 'beat', t: `From here: ${to}`, rule: 2, quiet: true, toast: [String(act.speaker || 'THE VOICE').toUpperCase(), v.color] },
  ];
  const here = kit.houseNow(ctx);
  // and the house notices, out loud (the user, 2026-10-15: the turn was a card nobody in the house reacted to)
  const talk = TURN_TALK[act.themeId];
  const pair = here.filter(n => n !== ctx.hoh);
  if (talk && pair.length >= 2) {
    const a = pair[(ctx.week || 0) % pair.length], b = pair[((ctx.week || 0) + 3) % pair.length] === a ? pair[((ctx.week || 0) + 1) % pair.length] : pair[((ctx.week || 0) + 3) % pair.length];
    steps.push(...talk.map(([w, t]) => ({ k: 'say', by: w === 'a' ? a : b, t })));
  }
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
  // BB27: the Mastermind called the double himself, the moment the final Block Buster's evictee was out
  // of the door, and said the night was "all about him".
  if (!third && ctx.row?.themeId === 'summer-of-mystery') {
    const vc = voiceOf('summer-of-mystery', 'hostile').color;
    const here = kit.houseNow(ctx);
    return {
      id: `bb-double-${nth}-v`, kind: 'double', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 1, time: 'LIVE', tvObj: true,
      kicker: 'Live · The night is not over', title: 'And We Are Not Done', label: 'Double Eviction',
      sub: 'The Mastermind has the screen', seated: kit.seatLiving([], here), steps: [
        { k: 'beat', t: 'The front door has barely closed when the living room screen cuts away from the host.', shake: true },
        { k: 'voice', own: true, by: 'The Mastermind', vc, t: 'That was the last Block Buster of the summer. You may sit down. You will not be resting.', toast: ['DOUBLE EVICTION', '#ff3355'] },
        { k: 'voice', own: true, by: 'The Mastermind', vc, t: 'It is double eviction night, and tonight is all about me. Every competition from here to the vote is mine.' },
        { k: 'beat', t: 'A whole week, from the Head of Household to the vote, in the time it usually takes to argue about one nomination.' },
        { k: 'host', by: host, t: 'Everybody except the outgoing Head of Household, head out to the backyard.' },
      ],
    };
  }
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

// ── The secret competitions: the Hacker, Roadkill, the cancelled vote ──────
// Played alone and sealed: the house is never told who won, so the viewer is told in the side panel ("only you
// know"), never on the stage. What the house DOES see (a chair that changes, a ballot that disappears) happens on it.
const fieldOf = act => (act.results || []).map(r => r.name).filter(Boolean).concat((act.competition?.participants || [])).filter((n, i, a) => n && a.indexOf(n) === i);

export function hackerScreens(act, ctx, kit) {
  if (!act?.winner) return [];
  const before = (ctx.nominees || []).slice();
  const hack = act.blockHack || null;
  const after = hack ? before.map(n => (n === hack.down ? hack.up : n)) : before;
  const field = fieldOf(act);
  const comp = act.competition || {};
  const guesses = (ctx.row?.hackerGuesses || []).filter(g => g && g.who && g.guess);
  const steps = [
    { k: 'bb', t: 'Houseguests, this week one of you can become the Hacker.', rule: 1 },
    { k: 'bb', t: 'You will each play the Hacker competition alone, with nobody watching. Nobody will be told how anybody did.', rule: 2 },
    { k: 'bb', t: 'The winner is told in private, and may take one nominee off the block and put somebody else up. Nobody will ever be told who did it.', rule: 3 },
    { k: 'beat', t: `${comp.name ? `Tonight it is ${comp.name}. ` : ''}${kit.titleCase(kit.word(field.length || 0))} houseguests go into the room one at a time, and every one of them comes back out to the same silence.` },
    { k: 'beat', t: 'Later, one of them is called to the Diary Room alone and given a different message.', toast: ['ACCESS GRANTED', '#22e1ff'],
      why: [`Only you know: ${act.winner} won the Hacker competition.`] },
  ];
  if (hack) {
    steps.push({ k: 'bb', t: 'Houseguests, the Hacker has struck.', toast: ['HACKED', '#ff3355'], shake: true });
    steps.push({ k: 'bb', t: `${hack.down}, you are no longer nominated. ${hack.up}, you are now nominated.`, nom: after, big: [hack.up, 'Hacked onto the block', 'out'],
      why: [hack.why, `${hack.down} is not safe: still eligible as the replacement at the veto ceremony.`].filter(Boolean) });
    steps.push({ k: 'beat', t: `${hack.up} stares at the screen. Nobody in the room will look at anybody else.`, tense: [hack.up, ctx.hoh].filter(Boolean) });
  } else {
    steps.push({ k: 'beat', t: `The block stays exactly as ${ctx.hoh || 'the Head of Household'} built it. The house spends the week waiting for a hack that never comes.`,
      why: [`${act.winner} chose to leave the block alone.`] });
  }
  if (guesses.length) steps.push({ k: 'beat', t: 'By nightfall, everybody in the house has a theory about who the Hacker is.',
    why: ['Who the house blames:', ...guesses.map(g => `${g.who} blames ${g.guess}${g.correct ? ' (right)' : ' (wrong)'}`)] });
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-hacker-v', kind: 'hacker', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '21:10',
    kicker: 'Cam 04 · Living room', title: 'The Hacker', label: 'The Hacker', sub: 'Played alone, result sealed',
    seated: kit.seatLiving(before, here.filter(n => !before.includes(n) && n !== ctx.hoh), ctx.hoh),
    rules: [['ALONE', 'one at a time, nobody watching'], ['SEALED', 'the winner is told in private'], ['THE BLOCK', 'one nominee down, another up, no name on it']],
    rulesTitle: 'THE HACKER · HOW IT WORKS', steps,
  }];
}

export function hackerVoteScreens(act, ctx, kit) {
  const v = act?.voter;
  if (!v) return [];
  const pick = (l, s) => l[[...`${ctx.week}|${v}|${s}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % l.length];
  const steps = [
    { k: 'beat', t: `Before the live vote, ${v} is called to the Diary Room.` },
    { k: 'bb', t: `${v}, the Hacker has cancelled your vote. Tonight your ballot will not be counted, and you may not tell anybody.`, toast: ['VOTE CANCELLED', '#ff3355'] },
    { k: 'dr', by: v, t: pick([`I was voting ${act.wouldHaveVoted} out. Now I sit there and watch, and I can't tell a soul.`,
      `Somebody in this house just took my vote away, and I have to smile through the whole live show.`,
      `I had my vote ready. ${act.wouldHaveVoted}. Now it doesn't exist.`], 'dr') },
    { k: 'beat', t: 'Tonight the house will hear a count one short of the number of people who think they voted.', why: [act.why].filter(Boolean) },
  ];
  return [{
    id: 'bb-hackervote-v', kind: 'hackervote', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: kit.ROOM_NAME.dr, cam: kit.CAM.dr, time: '19:30',
    kicker: 'Cam 01 · Diary Room', title: 'The Cancelled Vote', label: 'The Cancelled Vote', sub: `${v}'s ballot will not count`, cast: [[v, 50]], steps,
  }];
}

export function roadkillScreens(act, ctx, kit) {
  if (!act?.winner) return [];
  const field = fieldOf(act);
  const comp = act.competition || {};
  const steps = [
    { k: 'bb', t: 'Houseguests, this week there is a Roadkill competition.', rule: 1 },
    { k: 'bb', t: 'Everybody except the Head of Household plays it alone, with nobody watching.', rule: 2 },
    { k: 'bb', t: 'The winner is told in private, and will name a third nominee at the nomination ceremony. Nobody will ever be told who.', rule: 3 },
    { k: 'beat', t: `${comp.name ? `Tonight it is ${comp.name}. ` : ''}${kit.titleCase(kit.word(field.length || 0))} houseguests take their turn behind a closed door.` },
    { k: 'beat', t: 'One of them comes back out of the Diary Room a little too calm.', why: [`Only you know: ${act.winner} won Roadkill.`, act.why].filter(Boolean) },
  ];
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-roadkill-v', kind: 'roadkill', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '11:40',
    kicker: 'Cam 04 · Living room', title: 'BB Roadkill', label: 'BB Roadkill', sub: 'Played alone, result sealed',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh),
    rules: [['ALONE', 'everybody but the HOH, one at a time'], ['SEALED', 'the winner is told in private'], ['THE THIRD CHAIR', 'named at the ceremony, with no name on it']],
    rulesTitle: 'BB ROADKILL · HOW IT WORKS', steps,
  }];
}

// ── Pandora's Box ──────────────────────────────────────────────────────
export function pandoraScreens(act, ctx, kit) {
  const h = act?.hoh;
  if (!h) return [];
  const pick = (l, s) => l[[...`${ctx.week}|${h}|${s}`].reduce((x, c) => (x * 31 + c.charCodeAt(0)) >>> 0, 0) % l.length];
  const steps = [
    { k: 'beat', t: `${h} comes up to the Head of Household room. There is a second door that was not there this morning, edged in gold, with a question mark where the handle should be.` },
    { k: 'beat', t: 'A card on the door says: something good for you, something bad for them. Or nothing at all.', toast: ["PANDORA'S BOX", '#e3b341'] },
    { k: 'dr', by: h, t: act.opened ? pick(["I know it's a trap. Every one of these is a trap. I'm opening it anyway.", "Something good for me? I'm the Head of Household. I'll deal with the bad part later."], 'dr')
      : pick(["Something good for me, something bad for them. I've watched this show. I'm not touching it.", "I'm not opening that. Whatever is in there, the house would never forgive me for it."], 'dr') },
  ];
  if (act.opened) {
    steps.push({ k: 'beat', t: `${h} opens it. Four minutes later the door closes again, and the house is only ever told what it cost.`, toast: ['OPENED', '#ff3355'],
      ...(act.prize ? { why: [`Only you know: the box held ${act.prize}.`] } : {}) });
    if (act.consequenceName) steps.push({ k: 'beat', t: `The price: ${h} spends the week in ${act.consequenceName}${act.publicClaim ? `, and tells the house the box held ${act.publicClaim}` : ''}.` });
  } else steps.push({ k: 'beat', t: `${h} reads the card twice and walks away. The door closes behind the refusal without a sound.`, toast: ['LEFT CLOSED', '#9aa4b2'] });
  return [{
    id: 'bb-pandora-v', kind: 'pandora', anchor: ctx.anchor, day: ctx.day, set: 'hoh', room: kit.ROOM_NAME.hoh, cam: kit.CAM.hoh, time: '12:15',
    kicker: `Cam ${kit.CAM.hoh} · HOH room`, title: "Pandora's Box", label: "Pandora's Box", sub: 'Something good for you. Something bad for them.', cast: [[h, 50]], steps,
  }];
}

// ── the Diamond Power of Veto, played on eviction night ─────────────────
export function detonationScreens(act, ctx, kit) {
  const { holder, saved, replacement } = act || {};
  if (!holder || !saved) return [];
  const before = (ctx.nominees || []).slice();
  const after = before.map(n => (n === saved ? replacement : n)).filter(Boolean);
  const steps = [
    { k: 'beat', t: 'The pleas are done. Before the first vote can be cast, somebody stands up who is not supposed to be standing.', tense: [holder] },
    { k: 'say', by: holder, push: true, t: 'Before anybody votes, I have something. This is the Diamond Power of Veto.', toast: ['DIAMOND VETO', '#7ee7ff'], shake: true },
    { k: 'say', by: holder, t: 'It lets me take a nominee off the block, and name the replacement myself.' },
    { k: 'say', by: holder, push: true, t: act.selfSave ? 'I use it on myself.' : `I use it on ${saved}.` },
    { k: 'beat', t: act.selfSave ? `${holder} steps off the block, minutes before the vote.` : `${saved} doesn't move for a full second. Then ${saved} gets up out of the chair.`, seat: { [saved]: 'stand2' } },
  ];
  if (replacement) {
    steps.push({ k: 'say', by: holder, push: true, t: `And my replacement nominee is ${replacement}.`, nom: after, big: [replacement, 'The replacement', 'out'], why: [act.replacementWhy].filter(Boolean),
      seat: { [replacement]: before.indexOf(saved) === 0 ? 'N-1' : 'N1' } });
    steps.push({ k: 'beat', t: 'No campaign. No plea. The house votes on a block it did not know existed two minutes ago.', tense: after });
  }
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-detonation-v', kind: 'detonation', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 1, time: 'LIVE', tvObj: true,
    kicker: 'Live · Eviction night', title: 'The Detonation', label: 'The Detonation', sub: 'A power nobody knew existed',
    seated: kit.seatLiving(before, here.filter(n => !before.includes(n) && n !== ctx.hoh), ctx.hoh), steps,
  }];
}

// ── The App Store ──────────────────────────────────────────────────────
export function appStoreScreens(act, ctx, kit) {
  const won = (act?.winners || []).filter(w => w && w.power);
  const shelf = act?.shelf || [];
  const steps = [
    { k: 'bb', t: 'Houseguests, the App Store is open.', rule: 1 },
    { k: 'bb', t: `America has been voting on a shelf of ${kit.word(shelf.length || won.length)} powers. Nobody in this house can compete for one.`, rule: 2 },
    { k: 'bb', t: 'Every power America chose goes to one of you, in private. You will not be told who.', rule: 3 },
  ];
  if (won.length <= 4) for (const w of won) steps.push({ k: 'beat', t: `${w.power} leaves the shelf. Somebody in this house is being told, right now, that they are holding it.` });
  else steps.push({ k: 'beat', t: `${kit.titleCase(kit.word(won.length))} powers leave the shelf: ${kit.listOf(won.map(w => w.power))}. Somebody is being told about every one of them, in private.` });
  steps.push({ k: 'beat', t: 'The house is told only that the vote happened. You will find out who holds what on the night it goes off.', toast: ['DOWNLOADED', '#a5b4fc'] });
  const here = kit.houseNow(ctx);
  return [{
    id: 'bb-appstore-v', kind: 'appstore', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '12:00',
    kicker: 'Cam 04 · Living room', title: 'The App Store', label: 'The App Store', sub: 'Nobody in this house can win one of these',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh),
    rules: [['THE SHELF', 'powers America votes on'], ['NO COMPETITION', 'nobody in the house can win one'], ['PRIVATE', 'each goes to somebody, unnamed']],
    rulesTitle: 'THE APP STORE · HOW IT WORKS', steps,
  }];
}

/** The Veto Redraw or Replacement, at the draw: steps for steps.js drawScreen. */
export function drawTwistSteps(dt, kit) {
  if (!dt?.kind) return [];
  const name = dt.kind === 'redraw' ? 'Veto Redraw' : 'Veto Replacement';
  const steps = [{ k: 'bb', t: `Houseguests, somebody in this house holds the ${name}, and has just used it.`, toast: [name.toUpperCase(), '#ff3355'], shake: true }];
  const who = dt.anonymous ? [`Only you know: ${dt.holder} used it.`] : [];
  if (!dt.changed) {
    steps.push({ k: 'beat', t: 'The bag goes round again and returns the same names. Nothing changes.', ...(who.length ? { why: who } : {}) });
    return steps;
  }
  for (const b of dt.beats || []) {
    if (b.badgeText === 'SIX PLAY FOR IT') continue;
    const t = String(b.text || '').replace(/<[^>]+>/g, '').trim();
    if (!t) continue;
    if (b.badgeText === 'TAKEN OUT') steps.push({ k: 'beat', t, vetoOut: dt.lost || [] });
    else if (b.badgeText === 'PUT IN') steps.push({ k: 'beat', t, vetoPlay: dt.gained || [], why: [...who, dt.selfSeat ? `${dt.holder} put ${dt.holder} into the competition.` : null].filter(Boolean) });
    else steps.push({ k: 'beat', t });
  }
  if (!steps.some(s => s.vetoOut)) steps.push({ k: 'beat', t: `Out: ${kit.listOf(dt.lost || [])}. In: ${kit.listOf(dt.gained || [])}.`, vetoOut: dt.lost || [], vetoPlay: dt.gained || [], why: who });
  return steps;
}

// ── Summer Camp's night one: the Camp Director, and Hit The Road ─────────
// Two places, so two screens: the vote and the banishment in the living room, then the scramble in the backyard
// with its times on the board and the slowest out of the house before a Head of Household exists.
export function campDirectorScreens(act, ctx, kit) {
  if (!act?.director) return [];
  const beats = act.beats || [];
  const banished = act.banished || [];
  const here = kit.houseNow(ctx);
  const room = [
    { k: 'bb', t: 'Houseguests, before anything else, you will elect a Camp Director. Nobody competes for it.', rule: 1 },
    { k: 'bb', t: 'The Camp Director will banish four of you to Hit The Road.', rule: 2 },
    { k: 'bb', t: 'The slowest of the four is evicted, tonight.', rule: 3 },
  ];
  const yard = [{ k: 'bb', t: `${kit.listOf(banished)}: it's time to Hit The Road. The slowest of you is going home.` }];
  const times = [];
  let banishedSeen = 0;
  for (const b of beats) {
    const t = strip(b.text);
    if (!t) continue;
    const tag = b.badgeText || '';
    if (tag === 'CAMP DIRECTOR') room.push({ k: 'beat', t, toast: ['CAMP DIRECTOR', '#fcd34d'], big: [act.director, 'Camp Director', 'safe'] });
    else if (tag === 'HIT THE ROAD') { banishedSeen++; room.push({ k: 'beat', t, ...(banishedSeen === banished.length ? { nom: banished.slice(), toast: ['HIT THE ROAD', '#ff3355'] } : {}) }); }
    else if (tag === 'RAN IT') {
      const who = (b.players || [])[0];
      const sc = (act.times || []).find(x => x.name === who);
      if (who) times.push({ n: who, text: sc ? String(sc.score) : '' });
      yard.push({ k: 'beat', t, board: { title: 'HIT THE ROAD · TIMES', rows: times.slice() } });
    } else if (/^EVICTED/.test(tag)) yard.push({ k: 'beat', t, out: act.evicted, shake: true, big: [act.evicted, 'Evicted on night one', 'out'] });
    else if (tag === 'BOUND BY IT') yard.push({ k: 'beat', t });
    else room.push({ k: 'beat', t });
  }
  if (act.evicted && !yard.some(s => s.out)) yard.push({ k: 'bb', t: `${act.evicted}, you were the slowest. You have been evicted from the Big Brother house.`, out: act.evicted, big: [act.evicted, 'Evicted on night one', 'out'] });
  return [{
    id: 'bb-campdirector-v', kind: 'campdirector', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '21:30',
    kicker: 'Cam 04 · Living room', title: 'Camp Director', label: 'Camp Director', sub: 'Elected on night one', seated: kit.seatLiving([], here),
    rules: [['THE VOTE', 'the house elects a Camp Director'], ['BANISHED', 'four sent to Hit The Road'], ['THE SLOWEST', 'evicted tonight']],
    rulesTitle: 'CAMP DIRECTOR · HOW IT WORKS', steps: room,
  }, {
    id: 'bb-hittheroad-v', kind: 'hittheroad', anchor: ctx.anchor, day: ctx.day, set: 'yard', room: kit.ROOM_NAME.yard, cam: kit.CAM.yard, time: '23:10',
    kicker: `Cam 0${kit.CAM.yard} · Backyard`, title: 'Hit The Road', label: 'Hit The Road', sub: 'The slowest goes home',
    cast: banished.map((n, i, a) => [n, Math.round(18 + (64 * i) / Math.max(1, a.length - 1))]), steps: yard,
  }];
}

// ── Summer School's cliques ────────────────────────────────────────────
export function cliqueScreens(act, ctx, kit) {
  const teams = (act?.teams || []).filter(t => t && (t.members || []).length);
  if (!teams.length) return [];
  const over = act.type === 'teams-dissolved';
  const say = act.secret ? 'beat' : 'bb';
  const steps = over ? [
    { k: 'bb', t: 'Houseguests, the cliques are over. From now on, no group is safe because one of its own is in charge.', toast: ['THE CLIQUES ARE OVER', '#ff3355'], shake: true },
    ...beatSteps(act, kit),
  ] : [
    { k: say, t: act.secret ? 'The house is sorted into cliques, and nobody in it is told.' : 'Houseguests, this summer you have been sorted into cliques.', rule: 1 },
    { k: say, t: 'While somebody from your clique is Head of Household, nobody in your clique can be nominated.', rule: 2 },
    ...teams.flatMap(t => [
      { k: say, t: `${t.name}: ${kit.listOf(t.members)}.`, board: { title: String(t.name).toUpperCase(), rows: t.members.map(n => ({ n })) } },
      ...(t.blurb ? [{ k: 'beat', t: strip(t.blurb) }] : []),
    ]),
  ];
  const here = kit.houseNow(ctx);
  return [{
    id: over ? 'bb-cliques-end-v' : 'bb-cliques-v', kind: 'cliques', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '10:00',
    kicker: 'Cam 04 · Living room', title: over ? 'Cliques Over' : 'The Cliques', label: over ? 'Cliques Over' : 'The Cliques', sub: over ? 'Every houseguest for themselves' : 'Sorted, not chosen',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh),
    ...(over ? {} : { rules: [['SORTED', 'four cliques, not chosen'], ['COVERED', 'a clique is safe while one of its own is HOH']], rulesTitle: 'THE CLIQUES · HOW IT WORKS' }), steps,
  }];
}

// ── The Split House ────────────────────────────────────────────────────
export function splitScreens(act, ctx, kit) {
  const [a, b] = act?.hohs || [];
  if (!a || !b) return [];
  const picks = act.picks || [];
  const sides = { [a]: [a], [b]: [b] };
  const steps = [
    { k: 'bb', t: 'Houseguests, this week there are two Heads of Household.', rule: 1 },
    { k: 'bb', t: `A wall is about to go up through the middle of this house. ${a} and ${b} will pick their sides, one houseguest at a time.`, rule: 2 },
    { k: 'bb', t: 'Each side plays its own week: its own nominations, its own veto, its own vote. Nobody will see or hear the other side.', rule: 3 },
  ];
  for (const p of picks) {
    if (!p?.by || !p.picked) continue;
    (sides[p.by] ||= [p.by]).push(p.picked);
    steps.push({ k: 'say', by: p.by, t: p.reason === 'nobody-left' ? `${p.picked}, I guess.` : `${p.picked}.`, ...(p.why ? { why: [`${p.by}: ${strip(p.why)}.`] } : {}),
      board: { title: 'THE SIDES', rows: [...sides[a].map(n => ({ n, text: `${a}'s side` })), ...sides[b].map(n => ({ n, text: `${b}'s side` }))] } });
  }
  steps.push({ k: 'beat', t: `The wall goes up. ${a}'s side and ${b}'s side will not see each other again until the week is over.`, toast: ['THE HOUSE SPLITS', '#ff3355'], shake: true });
  steps.push(...beatSteps(act, kit));
  const here = kit.houseNow(ctx).filter(n => n !== a && n !== b);
  const seated = kit.seatLiving([], here, a);
  seated[b] = 'stand2';
  return [{
    id: 'bb-split-v', kind: 'split', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '22:00',
    kicker: 'Cam 04 · Living room', title: 'The House Splits', label: 'The House Splits', sub: `${a}'s side and ${b}'s side`, seated,
    rules: [['TWO CROWNS', `${a} and ${b}`], ['THE WALL', 'each picks a side, one at a time'], ['TWO WEEKS', 'each side its own block, veto and vote']],
    rulesTitle: 'THE SPLIT HOUSE · HOW IT WORKS', steps,
  }];
}

/** The second half of a Split House week: the same days, on the other side of the wall. */
export function otherSideScreen(ctx, kit, { was, now }) {
  const here = kit.houseNow(ctx);
  return {
    id: 'bb-otherside-v', kind: 'otherside', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '09:00',
    kicker: 'Cam 04 · Living room', title: 'The Other Side', label: 'The Other Side', sub: `${now}'s side of the wall`,
    seated: kit.seatLiving([], here.filter(n => n !== now), now),
    steps: [
      { k: 'beat', t: 'Meanwhile, on the other side of the wall.', toast: ['THE OTHER SIDE', '#8d97ac'] },
      { k: 'beat', t: `Everything you have just watched happened on ${was}'s side. None of it was seen or heard over here, where ${now}'s side spent the same days playing a week of their own.` },
    ],
  };
}

// ── High Roller's: the money ───────────────────────────────────────────
// The house sees who walks to the rail and who walks into the room; the viewer also sees the slips and the
// balances (the side panel), as the classic screens said: "the room saw them bet and never saw the name".
const money = (ctx, kit, base, steps) => {
  const here = kit.houseNow(ctx);
  return [{ anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '12:30', kicker: 'Cam 04 · Living room',
    seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), ...base, steps }];
};

export function bucksScreens(act, ctx, kit) {
  const pay = act?.payouts || [];
  if (!pay.length) return [];
  const tiers = ['top', 'middle', 'floor'].map(t => ({ t, names: pay.filter(p => p.tier === t) })).filter(x => x.names.length);
  const rows = [];
  const steps = [{ k: 'bb', t: 'Houseguests, the audience has paid you for this week. The top three are paid the most, the next three a little less, and everybody else the floor rate.', rule: 1 }];
  for (const { t, names } of tiers) {
    // the floor is everybody else: said, not listed (fourteen rows do not fit the board)
    if (t !== 'floor') rows.push(...names.map(p => ({ n: p.name, text: `$${p.amount}` })));
    const amt = names[0].amount;
    steps.push({ k: 'bb', t: t === 'top' ? `Paid at the top, $${amt} each: ${kit.listOf(names.map(p => p.name))}.` : t === 'middle' ? `$${amt} each: ${kit.listOf(names.map(p => p.name))}.`
      : `Everybody else is paid the floor rate, $${amt}.`, board: { title: 'THE AUDIENCE PAYS', rows: rows.slice() }, ...(t === 'top' ? { toast: ['PAID AT THE TOP', '#c9a227'] } : {}) });
  }
  steps.push(...beatSteps(act, kit));
  steps.push({ k: 'beat', t: 'What anybody has saved stays private. The house only ever hears what was paid.' });
  return money(ctx, kit, { id: 'bb-bucks-v', kind: 'bucks', title: 'The Audience Pays', label: 'The Audience Pays', sub: 'Paid in public, kept in private',
    rules: [['THE TOP THREE', 'paid the most'], ['THE NEXT THREE', 'a little less'], ['EVERYBODY ELSE', 'the floor rate']], rulesTitle: 'THE AUDIENCE PAYS · HOW IT WORKS' }, steps);
}

export function sideBetScreens(act, ctx, kit) {
  const bets = act?.bets || [];
  if (!bets.length) return [];
  const back = Math.floor((act.stake || 10) * (act.payout || 1));
  const steps = [
    { k: 'bb', t: `Houseguests, the rail is open. ${act.stake} on who goes home this week. A right slip pays ${back} back. A wrong one pays nothing.`, rule: 1 },
    ...beatSteps(act, kit),
  ];
  const rest = bets.filter(b => !(act.beats || []).some(x => (x.players || [])[0] === b.name)).map(b => b.name);
  if (rest.length) steps.push({ k: 'beat', t: `${kit.listOf(rest)} ${rest.length === 1 ? 'bets' : 'bet'} too.` });
  steps[steps.length - 1] = { ...steps[steps.length - 1], why: ['The slips (the house never sees them):', ...bets.map(b => `${b.name} → ${b.on}`)] };
  return money(ctx, kit, { id: 'bb-sidebet-v', kind: 'sidebet', title: 'The Side Bet', label: 'The Side Bet', sub: 'The room saw them bet, and never saw the name' }, steps);
}

export function sideBetPaidScreens(act, ctx, kit) {
  const res = act?.results || [];
  if (!res.length) return [];
  const back = Math.floor((act.stake || 10) * (act.payout || 1));
  const won = res.filter(r => r.won);
  const steps = [{ k: 'bb', t: won.length === res.length ? `Every slip had ${act.evicted}'s name on it. The floor pays all ${kit.word(res.length)} of them.`
    : won.length ? `${kit.listOf(won.map(r => r.name))} called it, and ${won.length === 1 ? 'takes' : 'take'} ${back} back. Every other slip stays with the floor.` : 'Nobody called it. The floor keeps every slip.',
    board: { title: 'THE FLOOR SETTLES', rows: res.map(r => ({ n: r.name, text: r.won ? `+${back - (act.stake || 10)}` : `−${act.stake || 10}`, out: !r.won })) },
    toast: ['THE FLOOR SETTLES', '#c9a227'] }, ...beatSteps(act, kit)];
  return money(ctx, kit, { id: 'bb-sidebet-paid-v', kind: 'sidebet', title: 'The Floor Settles', label: 'The Floor Settles', sub: `${act.evicted} is the name on the winning slips`, time: '23:30' }, steps);
}

export function derbyScreens(act, ctx, kit) {
  const settled = act?.type === 'derby-bet-settled';
  const steps = settled ? [
    { k: 'bb', t: (act.holders || []).length ? `${act.vetoWinner} won the veto. ${kit.listOf(act.holders)} backed ${act.vetoWinner}, so there is a second veto in this house tonight, and the one nobody competed for goes first.`
      : `${act.vetoWinner} won the veto. Nobody backed ${act.vetoWinner}. Every slip on the board is worth exactly what the paper cost.`,
      board: { title: 'THE SLIPS TURN OVER', rows: (act.results || []).map(r => ({ n: r.name, text: r.won ? 'holds a veto' : `had ${r.on}`, out: !r.won })) },
      toast: [(act.holders || []).length ? 'A SECOND VETO' : 'ALL DEAD', '#c9a227'] },
    ...beatSteps(act, kit),
  ] : [
    { k: 'bb', t: `Houseguests who bought a slot in the Veto Derby: there are six names on the board now, ${kit.listOf(act.players || [])}. Back the one who wins the veto, and you hold a veto of your own.`, rule: 1 },
    ...beatSteps(act, kit),
  ];
  if (!settled && steps.length) steps[steps.length - 1] = { ...steps[steps.length - 1], why: ['The slips:', ...(act.bets || []).map(b => `${b.name} → ${b.on}`)] };
  return money(ctx, kit, { id: settled ? 'bb-derby-paid-v' : 'bb-derby-bet-v', kind: 'derby', title: settled ? 'The Slips Turn Over' : 'The Derby Slips',
    label: settled ? 'The Slips Turn Over' : 'The Derby Slips', sub: settled ? `${act.vetoWinner} won the veto` : 'Six names to back' }, steps);
}

export function rollersRoomScreens(act, ctx, kit) {
  if (!act?.gameName) return [];
  const steps = [
    { k: 'bb', t: `Houseguests, the High Roller's Room is open tonight. One game: ${act.gameName}, at ${act.price}. You pay on the way in, win or lose.`, rule: 1, toast: ["HIGH ROLLER'S ROOM", '#c9a227'] },
    ...beatSteps(act, kit),
  ];
  if (!(act.entries || []).length) steps.push({ k: 'beat', t: 'Nobody walks in. The door stays open all evening, and the floor keeps its game.' });
  return money(ctx, kit, { id: 'bb-highrollers-v', kind: 'rollers', title: "High Roller's Room", label: "High Roller's Room", sub: `${act.gameName} · ${act.price}`, time: '21:00' }, steps);
}

// ── Rivals: the people who walk in already knowing somebody ────────────
const spreadAt = names => names.map((n, i, a) => [n, Math.round(8 + (84 * i) / Math.max(1, a.length - 1))]);

export function rivalsScreens(act, ctx, kit) {
  const t = act?.type;
  const here = kit.houseNow(ctx);
  const base = { anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, kicker: 'Cam 04 · Living room' };
  if (t === 'rivals-open') {
    // the people the latecomers are here for stay in the shot as the room fills up
    const partners = (act.pairs || []).map(p => p.partner);
    const before0 = (act.before || here).filter(Boolean);
    const before = [...partners.filter(n => before0.includes(n)), ...before0.filter(n => !partners.includes(n))];
    const arrived = [];
    const steps = [{ k: 'bb', t: `Houseguests, tonight ${kit.word((act.arrived || []).length)} more people are moving in, and every one of them is here for somebody who is already inside.`, toast: ['RIVALS', '#b3382f'], at: spreadAt(before.slice(0, 10)) }];
    for (const s of beatSteps(act, kit)) {
      // a latecomer walks in on the line that first names them
      const who = (act.arrived || []).find(n => !arrived.includes(n) && String(s.t).includes(n));
      if (who) arrived.push(who);
      steps.push(who ? { ...s, at: spreadAt([...before.slice(0, 10 - arrived.length), ...arrived]) } : s);
      // and introduces themself the way everybody did on move-in day, with the house's first read of them
      if (who) {
        let said = [];
        try { said = ctx.intro ? kit.proseSteps(ctx.intro(who), [who]) : []; } catch { said = []; }
        let read = [];
        try { read = ctx.firstRead ? ctx.firstRead(who) || [] : []; } catch { read = []; }
        if (said.length && read.length) said[said.length - 1] = { ...said[said.length - 1], why: [`First read on ${who}: ${read.join(', ')}.`] };
        else if (read.length) said.push({ k: 'beat', t: `${who} is here for ${(act.pairs || []).find(p => p.rival === who)?.partner || 'somebody inside'}.`, why: [`First read on ${who}: ${read.join(', ')}.`] });
        steps.push(...said);
      }
    }
    const pairs = (act.pairs || []).map(p => `${p.rival} is here for ${p.partner}${p.label && p.label !== 'No connection' ? ` (${p.label})` : ''}: ${p.grudge || 'they have history'}.`);
    if (pairs.length) steps[steps.length - 1] = { ...steps[steps.length - 1], why: [...(act.guessed ? ['Some of these were read from who gets on worst, not declared.'] : []), ...pairs] };
    return [{ ...base, id: 'bb-rivals-open-v', kind: 'rivals', time: '21:00', title: 'Rivals: Arrival', label: 'Rivals: Arrival', sub: 'They already know somebody', cast: spreadAt(before.slice(0, 10)), steps }];
  }
  if (t === 'rivals-hoh') {
    // Big Brother sets it up, the engine's first beat is the room deciding, then the ballots, the name, and what it
    // costs (the rest of the engine's beats)
    const tally = {};
    const told = beatSteps(act, kit);
    const steps = [
      { k: 'bb', t: `${kit.listOf(act.finalists || [])}, the competition stops here. The ${kit.word((act.rivals || []).length)} houseguests who walked in tonight will decide which of you is Head of Household.`, rule: 1 },
      ...told.slice(1, 2),
    ];
    for (const b of act.ballots || []) {
      tally[b.choice] = (tally[b.choice] || 0) + 1;
      steps.push({ k: 'beat', t: `${b.rival} writes ${b.choice}.${b.protecting ? ` Not ${b.protecting}.` : ''}`, rule: 2, board: { title: 'THE RIVALS DECIDE', rows: (act.finalists || []).map(n => ({ n, text: `${tally[n] || 0}` })) } });
    }
    steps.push({ k: 'bb', t: `${act.winner}, you are the new Head of Household.`, hoh: act.winner, big: [act.winner, 'Handed the house', 'safe'], toast: ['NOT WON, GIVEN', '#c9a227'] });
    steps.push(...told.slice(2));
    return [{ ...base, id: 'bb-rivals-hoh-v', kind: 'rivals', time: '23:30', title: 'Rivals: The Handover', label: 'Rivals: The Handover', sub: 'Power given, not won',
      seated: kit.seatLiving([], here.filter(n => !(act.finalists || []).includes(n)).slice(0, 8)), rules: [['NOT WON', 'the competition stops at two'], ['GIVEN', 'the rivals vote the house to one of them']],
      rulesTitle: 'RIVALS · THE HANDOVER', steps }];
  }
  if (t === 'rivals-week') {
    const steps = beatSteps(act, kit);
    if (!steps.length) return [];
    steps[steps.length - 1] = { ...steps[steps.length - 1], why: ['Where the grudges stand:', ...(act.pairs || []).map(p => `${p.rival} and ${p.partner}: ${p.bond > 0 ? '+' : ''}${Math.round((p.bond || 0) * 10) / 10}`)] };
    return [{ ...base, id: 'bb-rivals-week-v', kind: 'rivals', time: '16:00', title: 'Rivals: The Grudge', label: 'Rivals: The Grudge', sub: 'Still in the same house',
      seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps }];
  }
  if (t === 'rivals-out') {
    const steps = beatSteps(act, kit);
    if (steps.length) steps[0] = { ...steps[0], big: [act.stays, `Outlasted ${act.gone}`, 'safe'] };
    return [{ ...base, id: 'bb-rivals-out-v', kind: 'rivals', time: 'LIVE', title: 'Rivals: Outlasted', label: 'Rivals: Outlasted', sub: `${act.stays} stays, ${act.gone} goes`,
      seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps }];
  }
  return [];
}

// ── The Saboteur: a job the house is never told about ──────────────────
export function saboteurScreens(act, ctx, kit) {
  const t = act?.type;
  const sab = act.saboteur || act.reallyIs || null;
  const here = kit.houseNow(ctx);
  const steps = beatSteps(act, kit);
  if (t === 'saboteur-brief') {
    if (act.mission) steps.push({ k: 'beat', t: `This week's job: ${strip(act.mission.name)}. ${strip(act.mission.brief)}`, why: [`Only you know: ${sab} is the Saboteur.`, `The job pays ${act.mission.pay}${act.prize ? `, toward ${act.prize}` : ''}.`] });
    return [{ id: 'bb-saboteur-brief-v', kind: 'saboteur', anchor: ctx.anchor, day: ctx.day, set: 'dr', room: kit.ROOM_NAME.dr, cam: kit.CAM.dr, time: '01:30',
      kicker: 'Cam 01 · Diary Room', title: 'The Saboteur: Mission', label: 'The Saboteur: Mission', sub: 'Told to one person, at night', cast: sab ? [[sab, 50]] : [], steps }];
  }
  if (t === 'saboteur-debrief') {
    // the engine's beats already tell it (what the saboteur did, what the house said): each line once, with what
    // the house SAW put in after the deed when the beats leave it out, and the side panel's "only you know" on the deed
    const r = act.result || {};
    const out = steps.slice();
    const at = t0 => out.findIndex(s => s.t === strip(t0));
    if (r.text) {
      let i = at(r.text);
      if (i < 0) { out.unshift({ k: 'beat', t: strip(r.text) }); i = 0; }
      out[i] = { ...out[i], why: [`Only you know: ${sab} did this.`] };
      if (act.worked && r.houseSees && at(r.houseSees) < 0) out.splice(i + 1, 0, { k: 'beat', t: strip(r.houseSees), toast: [String(r.seesBadge || 'SOMETHING HAPPENED').toUpperCase(), '#ff3355'] });
    }
    if (!act.worked && r.botched) { const i = at(r.botched); if (i >= 0) out[i] = { ...out[i], toast: ['IT GOES WRONG', '#9aa4b2'] }; else out.push({ k: 'beat', t: strip(r.botched), toast: ['IT GOES WRONG', '#9aa4b2'] }); }
    if (act.paid != null) out.push({ k: 'beat', t: act.worked ? 'The job is done, and the money is banked where nobody in the house can see it.' : 'The job fails. Nothing is banked this week.',
      why: [`Paid this week: ${act.paid || 0}.`] });
    return [{ id: 'bb-saboteur-v', kind: 'saboteur', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '22:40',
      kicker: 'Cam 04 · Living room', title: 'The Saboteur: Results', label: 'The Saboteur: Results', sub: act.worked ? 'It worked' : 'It did not work',
      seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps: out }];
  }
  if (t === 'saboteur-accusation') {
    if (steps.length) steps[0] = { ...steps[0], toast: [act.correct ? 'CAUGHT' : 'THE WRONG NAME', act.correct ? '#c9a227' : '#ff3355'] };
    if (!act.correct && act.reallyIs) steps.push({ k: 'beat', t: `${act.named} is not the Saboteur.`, why: [`Only you know: it is ${act.reallyIs}.`] });
    return [{ id: 'bb-saboteur-call-v', kind: 'saboteur', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: '20:00',
      kicker: 'Cam 04 · Living room', title: act.correct ? 'The Saboteur: Caught' : 'The Saboteur: Wrong Name', label: act.correct ? 'The Saboteur: Caught' : 'The Saboteur: Wrong Name',
      sub: `${act.accuser} names ${act.named}`, seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps }];
  }
  if (t === 'saboteur-reveal') {
    if (sab) steps.unshift({ k: 'bb', t: `Houseguests, there has been a Saboteur in this house all season. It was ${sab}.`, big: [sab, 'The Saboteur', 'out'], shake: true });
    return [{ id: 'bb-saboteur-reveal-v', kind: 'saboteur', anchor: ctx.anchor, day: ctx.day, set: 'ceremony', room: kit.ROOM_NAME.ceremony, cam: 4, time: 'LIVE',
      kicker: 'Cam 04 · Living room', title: 'The Saboteur: Reveal', label: 'The Saboteur: Reveal', sub: sab ? `It was ${sab}` : 'The reveal',
      seated: kit.seatLiving([], here.filter(n => n !== ctx.hoh), ctx.hoh), steps }];
  }
  return [];
}
