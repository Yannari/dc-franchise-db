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
