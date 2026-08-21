// The voices of Kristal-talKs.
//
// Design: docs/superpowers/specs/2026-08-21-kristal-talks-v2-design.md
//
// v1 had twelve generic answer lines shared across sixty episodes — no names,
// no numbers, no memory — and read as a template by the third card. This file
// is the fix: one VOICE STYLE per guest, derived from archetype and stats, and
// every bank written with FACT SLOTS so the answers touch the record the way
// Kristal's questions always did.
//
// ── STATS PICK TEXT, NEVER OUTCOMES ──
//
// Thresholds on stats are used here exactly as the house rules permit: to
// select narration. Nothing in this file touches a listener count, a tier or
// a follower — the parity test in tests/kristal.test.js holds that door shut.
//
// ── NO SLOT PRINTS EMPTY ──
//
// A variant is only eligible when every {slot} it names has a value. A bank
// where nothing is eligible falls back to the style's plain lines, which use
// no slots at all. "undefined, Kristal. undefined votes." can never print.

// Deterministic pick — the same episode reads the same way forever.
function hash(key) {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
const pickFrom = (list, key) => list && list.length ? list[hash(key) % list.length] : null;

const SLOT_RE = /\{(\w+)\}/g;
const slotsOf = t => [...String(t).matchAll(SLOT_RE)].map(m => m[1]);
const fill = (t, facts) => String(t).replace(SLOT_RE, (_, k) => facts[k] ?? '');

/** Pick a variant whose every slot is fillable; fall back to slotless lines. */
function pickFilled(bank, key, facts) {
  const ok = (bank || []).filter(t => slotsOf(t).every(k => facts[k] !== undefined
    && facts[k] !== null && facts[k] !== ''));
  const line = pickFrom(ok.length ? ok : (bank || []).filter(t => !slotsOf(t).length), key);
  return line ? fill(line, facts) : '';
}

// ── the styles ──────────────────────────────────────────────────────────
//
// Priority order matters: a villain with temperament 1 is a hothead first,
// and anyone with mental 2 rambles whatever the archetype says.

export const STYLES = ['rambler', 'hothead', 'bomb', 'chaos', 'analyst',
  'charmer', 'earnest', 'deadpan'];

export function styleOf({ archetype = '', stats = {} } = {}) {
  const s = stats || {};
  if ((s.mental ?? 5) <= 2) return 'rambler';
  if (archetype === 'hothead' || (s.temperament ?? 5) <= 2) return 'hothead';
  if (archetype === 'villain' || archetype === 'schemer') return 'bomb';
  if (archetype === 'chaos-agent' || archetype === 'wildcard') return 'chaos';
  if (archetype === 'mastermind' || (s.strategic ?? 5) >= 8) return 'analyst';
  if (archetype === 'social-butterfly' || archetype === 'showmancer'
    || (s.social ?? 5) >= 8) return 'charmer';
  if (archetype === 'hero' || archetype === 'loyal-soldier'
    || (s.loyalty ?? 5) >= 8) return 'earnest';
  if (archetype === 'floater' || archetype === 'goat' || (s.social ?? 5) <= 3) return 'deadpan';
  return (s.strategic ?? 5) >= 6 ? 'analyst' : (s.social ?? 5) >= 6 ? 'charmer' : 'deadpan';
}

// ── the answer banks ────────────────────────────────────────────────────
//
// Topic groups: win, out (a loss or a boot — {placement} carries which),
// conflict ({rival}), romance ({partner}), bts, life, response ({quotedName}).
// Two to four variants per style per group; slots ground them in the record.

const A = {
  bomb: {
    win: [
      'I won {season} and half that cast still acts like it was an accident. {votes} votes against me all season, and I outlived every single person who cast one.',
      'You don’t win by being liked, you win by being right about people. I was right about all of them. Ask {rival}.',
      'The confetti fell on ME, babe. Everything else is fan fiction.',
    ],
    out: [
      '{placement} place, and I’d do it all again louder. The ones who took me out needed three of them and a lie to do it.',
      'They needed {votes} votes to get me out of {season}. Count how many it took for everyone else. I’ll wait.',
      'I went out {placement}. The people who did it went out apologising to a jury I built.',
    ],
    conflict: [
      '{rival}? {rival} should be paying me rent for the space they take up in my story.',
      'Everyone wants me to say {rival} and I are fine now. We’re not. Next question.',
      'I said things about {rival} that were unfair. They were also accurate, which is why we’re still here talking about it.',
    ],
    romance: [
      '{partner} knew exactly what I was and stayed anyway. Read into that whatever you like — they did.',
      'People say I used {partner}. {partner} made the jury. You’re welcome.',
    ],
    bts: [
      'Production knows what they cut, and they know why. There’s a whole fight that never aired and I WON it.',
      'The thing they cut? Somebody cried in the confessional every single night, and it was never me. Names? Buy me dinner first.',
    ],
    life: [
      'You want the version I didn’t post? It was worse and better than the internet decided, in that order.',
      'Everyone had a take on my year. None of them were in the room for any of it, and I’m done being polite about that.',
    ],
    response: [
      '{quotedName} said that? On this show? In the chair I’m currently warming? Bold. Wrong, but bold.',
      'Play the clip again. Listen to {quotedName}’s voice shake. That’s the whole answer.',
    ],
  },
  analyst: {
    win: [
      'People call it luck. {season} had a math and I did the math. {jury} jury votes isn’t charm, it’s positioning.',
      'The win was decided three weeks before the finale — I just didn’t tell anyone the decision had been made.',
      'Every move I made had a second use. That’s the difference. Nothing I did was only one thing.',
    ],
    out: [
      'The read was correct, the timing was wrong. That’s the whole autopsy of my {placement} place.',
      'I lost the game on one variable I couldn’t control: {rival} woke up that morning and chose chaos.',
      '{votes} votes. I know whose they were, in order, and two of them still don’t know I know.',
    ],
    conflict: [
      '{rival} played emotionally and I played structurally, and structure loses exactly one kind of fight: the loud kind.',
      'My mistake with {rival} wasn’t strategic. I modelled them as a rational actor. That was generous.',
    ],
    romance: [
      'The {partner} situation was the one part of my game I didn’t plan, which everyone finds hilarious and I find professionally embarrassing.',
      'Was it real? It was real AND it was useful. People keep insisting those exclude each other.',
    ],
    bts: [
      'What they cut is the boring truth: forty hours of me being right quietly, so the edit kept the two minutes of me being right smugly.',
      'There’s a whiteboard that never made air. When it comes out, three reputations change.',
    ],
    life: [
      'The year went to plan, which makes terrible television, which is why nobody covered it accurately.',
      'It happened, I processed it, I moved. People think that’s cold. It’s just fast.',
    ],
    response: [
      '{quotedName}’s account is internally consistent and factually wrong, which is the most {quotedName} thing imaginable.',
      'I heard the episode. Two claims, one error each. Do you want them in order?',
    ],
  },
  hothead: {
    win: [
      'YES I won and YES I’m still mad. Both things. At once. That’s allowed.',
      'They pushed me the whole season of {season} and then acted SHOCKED when I pushed back all the way to the end.',
    ],
    out: [
      'Don’t— okay. Okay. I’m calm. {votes} votes. {votes}! I helped half those people!',
      'You know what, {placement} place is fine. It’s FINE. Can we— it’s not fine, who am I kidding. Roll the clip, let’s be mad together.',
    ],
    conflict: [
      'Do NOT get me started on {rival}. Too late, I’m started. Who does that?? WHO DOES THAT?',
      '{rival} knows what they did. And if they’re listening — and they are, they absolutely are — HI. Still waiting on that apology.',
    ],
    romance: [
      'Me and {partner} were the only honest thing in that whole season and everyone treated it like a strategy. It wasn’t a strategy! I don’t HAVE strategies!',
    ],
    bts: [
      'The thing they cut is ME BEING RIGHT. Three separate times! Where’s THAT episode, Kristal?',
      'They aired every time I yelled and cut every reason I had to. Fifty-fifty would’ve been nice.',
    ],
    life: [
      'The year was A LOT and I handled it GREAT and if anyone says otherwise they can say it to my face.',
      'I’m in a better place now. The better place has a punching bag. It helps.',
    ],
    response: [
      '{quotedName} said WHAT. Play it again. PLAY IT AGAIN. Oh, we’re done being civil.',
    ],
  },
  charmer: {
    win: [
      'Winning {season} was lovely, but honestly? The real prize was watching {rival} clap at the finale. Frame that.',
      'Everyone says the social game isn’t a real game until it beats them. Then suddenly it’s all anyone wants to talk about.',
    ],
    out: [
      'They kept me around {placement} deep because I’m delightful, and they cut me the second they remembered I’m also smart. Fair, honestly.',
      'You can’t vote out a good time, Kristal. Well. Apparently you can. {votes} people managed.',
    ],
    conflict: [
      '{rival} and I had chemistry, it was just the explosive kind. I’d do the feud again, it was the best content either of us ever made.',
      'I don’t hate {rival}. Hate takes effort and I save my effort for my skincare.',
    ],
    romance: [
      'What can I say — the cameras found the best angle of me falling for {partner} and I let them.',
      '{partner}? Ancient history. Gorgeous, well-lit ancient history.',
    ],
    bts: [
      'The stuff they cut is the stuff I’d charge for. There was a whole karaoke night. Careers ended.',
      'Off camera everyone’s nicer and messier at the same time. I hold both truths and several secrets.',
    ],
    life: [
      'The year? Busy, beautiful, occasionally on fire. I read everything people wrote and kept only the compliments.',
      'Life’s good. The people who mattered showed up and the people who didn’t made great cautionary tales.',
    ],
    response: [
      'Aww, {quotedName} talked about me? In MY favourite chair? Flattered. Wrong, but flattered.',
    ],
  },
  earnest: {
    win: [
      'I still feel a bit guilty about winning {season}, honestly. A lot of good people had to lose for that to happen and I sat with that.',
      'I didn’t outplay anyone. I just kept my word the whole way, and it turned out keeping your word IS a strategy.',
    ],
    out: [
      'Going out {placement} hurt, I won’t pretend otherwise. But the people who did it played the game, and I hugged every one of them.',
      'I knew the vote was coming. I could have fought dirtier. I decided who I wanted to be instead, and I’d decide it again.',
    ],
    conflict: [
      'Me and {rival}… look, I don’t think {rival} is a bad person. I think the game makes good people do loud things.',
      'I’ve forgiven {rival}. I know that’s a boring answer. It took real work, which is the un-boring part.',
    ],
    romance: [
      'What {partner} and I had was real. Whatever happened after, nobody gets to take the real part away.',
    ],
    bts: [
      'What they cut? The kindness. Every night somebody sat with somebody who was struggling and none of it aired. That was the real show.',
    ],
    life: [
      'It’s been a lot, honestly. Some of it wonderful, some of it I’m still carrying. I’m okay — genuinely, not press-release okay.',
      'The people who mattered showed up. That’s the whole story, and it’s better than the drama.',
    ],
    response: [
      'I heard what {quotedName} said, and I’m not going to return fire. I’ll just say: I remember it differently, and I sleep well.',
    ],
  },
  deadpan: {
    win: [
      'I won. People keep asking how it felt. It felt like winning.',
      'Everyone had a strategy. Mine was fewer words. Worked.',
    ],
    out: [
      '{placement}. Could’ve been worse. Was, for {votes} other people.',
      'They voted me out. I went. Not much of a story, which is why nobody tells it right.',
    ],
    conflict: [
      '{rival} yelled. I didn’t. Somehow that made ME the villain of the week.',
      'The feud with {rival} was mostly them. I was just standing there. Repeatedly. Near things they wanted.',
    ],
    romance: [
      'People shipped me and {partner}. We mostly shared a blanket. It was a cold season.',
    ],
    bts: [
      'The wildest thing that got cut? Tuesday. All of Tuesday. Gone. Probably for the best.',
    ],
    life: [
      'It happened, it’s handled, and I’m sleeping fine. Next question.',
      'Life’s quieter than the show. That took some getting used to. Then it took some being grateful for.',
    ],
    response: [
      '{quotedName} said a lot of words. Some were about me. Anyway.',
    ],
  },
  chaos: {
    win: [
      'I won {season} on VIBES and I will not be elaborating, mostly because I can’t.',
      'The trick to winning is nobody can predict you if YOU can’t predict you. Foolproof. Was I the fool? Also yes.',
    ],
    out: [
      'I went out {placement} doing exactly what I came to do: whatever occurred to me at the moment it occurred.',
      'They voted me out for being “too unpredictable”, which, thank you? Best review I’ve ever had.',
    ],
    conflict: [
      'The {rival} thing wasn’t a feud, it was performance art, and {rival} never learned their lines.',
      'People say I started it. I start EVERYTHING, that’s not evidence.',
    ],
    romance: [
      'Me and {partner} made no sense, which is exactly why it made sense. Keep up.',
    ],
    bts: [
      'What got cut? I traded a contestant three votes for a sandwich. The sandwich made the jury. Look it up. You can’t.',
    ],
    life: [
      'My year? I bought a boat. There’s no water where I live. Next question — no wait, ask about the boat.',
    ],
    response: [
      '{quotedName} came on here and said MY name for free? Incredible. I live in their head and I’ve redecorated.',
    ],
  },
  rambler: {
    win: [
      'So the win — okay, backing up, because to understand the finale you need to understand the thing with the eggs in week two, which nobody ever asks about—',
      'People say “you won”, and yes, technically, the money and everything, but the REAL story is so much longer and has a raccoon in it.',
    ],
    out: [
      'The vote was — wait, which vote? The one that got me? See, I thought that vote was about somebody else entirely, which, in my defence, so did two other people—',
      'I wasn’t even supposed to be at that ceremony. Long story. Well, medium story. Okay so it starts at breakfast—',
    ],
    conflict: [
      '{rival} and me, right, everyone thinks it started at the challenge but it actually started over a TOWEL, and the towel wasn’t even mine, it was—',
    ],
    romance: [
      'Me and {partner}, that whole thing, okay, so people forget we didn’t even LIKE each other at first, or — no wait, that was someone else. We liked each other immediately. That was the problem.',
    ],
    bts: [
      'Ohh the stuff that got cut. There was a bird? For like a week? Ask literally anyone about the bird, actually no, don’t ask {rival}, they’re still upset about the bird.',
    ],
    life: [
      'This year, wow, okay. Where do I even. So January — actually scratch January, nothing happened in January. FEBRUARY.',
    ],
    response: [
      'Wait, {quotedName} was HERE? In this chair? Did they mention the towel? They never tell the towel part.',
    ],
  },
};

// ── Kristal ─────────────────────────────────────────────────────────────
//
// She presses differently depending on who is in the chair — a charmer gets
// out-charmed, an analyst gets audited — which is the sass made mechanical.

const PRESS = {
  bomb: [
    'See, you say it like a headline, but you didn’t answer it. Again, slower.',
    'That’s the tour version, babe. I asked for the kitchen version.',
  ],
  analyst: [
    'That’s the version with the math taken out. Put the math back in.',
    'You just gave me a conclusion. I asked for the working.',
  ],
  hothead: [
    'Breathe. Now say the part you swallowed.',
    'You got loud, which is what you do instead of answering. Answer.',
  ],
  charmer: [
    'You can flirt at me all you want, I have time and a second page of notes.',
    'Adorable. Not an answer. Go again.',
  ],
  earnest: [
    'That was very healed of you. Now tell me what you’d have said a year ago.',
    'I believe you’ve forgiven them. I’m asking what they DID.',
  ],
  deadpan: [
    'Give me one more sentence. Splurge.',
    'That was six words. The listeners paid for at least eleven.',
  ],
  chaos: [
    'No. Come back. The question is still here and so am I.',
    'I’m going to ask again and you’re going to pretend to be a person who answers questions.',
  ],
  rambler: [
    'Okay — stopping you there, loving the journey, needing the destination.',
    'The towel is fascinating. The QUESTION, though.',
  ],
};

// The crack: the second answer, after the press, where the fact lands.
const CRACK = {
  bomb: [
    'Fine. {rival} flipped, I knew it was coming, and I let it happen because the alternative was owing them. I don’t owe people.',
    'The truth? {votes} of those votes were personal and I earned every one. There. Clip it.',
  ],
  analyst: [
    'The working: I had the numbers until {rival} moved, I knew the night they moved, and I chose the jury over the fight. That’s it. That’s the game.',
    'Fine — the real number is this: I made one read on loyalty instead of incentive. Once. In {season}. And it’s the only one anyone remembers.',
  ],
  hothead: [
    'WHAT I SWALLOWED is that it was {rival}. The whole time. And I defended them. THAT’S what makes me mad — not the vote, the defending.',
  ],
  charmer: [
    'Okay, cards down: it wasn’t all charm. I knew exactly what {rival} was doing and I smiled through it because smiling was the only weapon they couldn’t confiscate.',
    'The un-cute version? {partner} and I were over before the finale and we performed it anyway, because the audience deserved the ending. You’re welcome.',
  ],
  earnest: [
    'A year ago I’d have said {rival} looked me in the eye and lied, and that I counted them as family. There. That’s the version that keeps me up.',
  ],
  deadpan: [
    'One more sentence: {rival} did it, everyone knew, nobody said it, I’m saying it. That’s four sentences. Refund.',
  ],
  chaos: [
    'The destination: I did it on purpose. All of it. Even the parts that looked like accidents. ESPECIALLY those.',
  ],
  rambler: [
    'The destination, right, sorry — it was {rival}. It was always {rival}. Even the towel, when you really think about it, was {rival}.',
  ],
};

// A press on THE YEAR cannot crack about the season — the first live read
// had a catch-up guest confessing about vote counts nobody had asked about.
const CRACK_LIFE = {
  bomb: ['Fine — the truth about this year is that I lit the match. Everyone keeps asking who lit the match. It was me. It’s always been me.'],
  analyst: ['The honest version: I saw it coming four months out, planned for it, and it still flattened me. Plans don’t feel, apparently.'],
  hothead: ['THE PART I SWALLOWED is that I wasn’t okay! For MONTHS. There. Is that a clip? Clip it.'],
  charmer: ['Cards down? The smiling was load-bearing this year. Some weeks it was the only structural element.'],
  earnest: ['A year ago I’d have told you I was fine. I wasn’t fine. I’m fine NOW, which is different, and it cost more than I let on.'],
  deadpan: ['One more sentence: it was bad, then it wasn’t. That’s two sentences. Keep the change.'],
  chaos: ['The destination is: the boat was a cry for help AND a great boat. Both things.'],
  rambler: ['The destination — right. It hurt. All of it, even the funny parts. ESPECIALLY the funny parts. …So anyway, the raccoon.'],
};

const COLD_OPEN = {
  debrief: [
    'Kristal here. Tonight’s guest survived {season}, sort of, and has agreed to discuss it, sort of. {guest}, welcome. Lie to me less than usual.',
    'You watched {season}. I watched the FEEDS of {season}, which is a different show entirely, and tonight {guest} is going to account for the difference.',
    'My producer said “be nice to this one.” {guest}, I fired my producer. Welcome to the show.',
  ],
  life: [
    'No season talk tonight — well, some season talk, I’m only human. {guest} has had a YEAR, and my listeners have been feral about it since it happened.',
    'Kristal here. {guest} went quiet, the internet got loud, and tonight we fix the ratio. Welcome back to the real world, babe.',
  ],
  returning: [
    'Back in the chair: {guest}, appearance number {visit}. The chair remembers you. So do my lawyers.',
    '{guest} again! Last time you sat there you made three headlines and one enemy. Let’s beat it.',
  ],
};

// ── rapid fire ──────────────────────────────────────────────────────────
//
// EVERY ANSWER IS WRITTEN FOR ITS QUESTION. The first version kept one answer
// pool per style and drew from it blind, so "Best liar you ever shared a room
// with?" could be answered "In a heartbeat." — twice, in one episode, with no
// name in sight. Now each question carries its own answers (fact-slotted, so
// the liar question actually names {rival} when the record has one) plus
// optional per-style overrides where the register earns a signature line.

const RAPID = [
  { q: 'Best liar you ever shared a room with?',
    a: ['{rival}. Not even close.', 'Myself, honestly. And I was fantastic.', '{winner} — and it worked, didn’t it?'],
    s: { deadpan: ['{rival}.', 'Me.'], earnest: ['I hate saying it… {rival}.'],
      bomb: ['{rival}, and second place isn’t close enough to see them.'] } },
  { q: 'Most overrated move in your season?',
    a: ['The one everyone clips. Watch it again with the sound off.', 'Whatever {winner} did at the end. There, I said it.', 'Mine, if you believe the jury.'],
    s: { analyst: ['The “big move” of the season was a coin flip wearing a suit.'] } },
  { q: 'One word for the jury.',
    a: ['Bitter.', 'Generous.', 'Confused.'],
    s: { earnest: ['Fair.'], bomb: ['Cowards.'], chaos: ['Delicious.'] } },
  { q: 'Who cried the most off camera?',
    a: ['Everyone. It’s a lot out there.', 'Me. Zero shame.', 'Not saying. …{rival}.'],
    s: { hothead: ['Not me. Those were RAGE tears, different thing.'] } },
  { q: 'Would you return tomorrow?',
    a: ['In a heartbeat.', 'Only as the villain this time.', 'My family says no. So probably.'],
    s: { deadpan: ['No. …When do we leave?'], chaos: ['I never left. Check the vents.'] } },
  { q: 'Rate your own edit out of ten.',
    a: ['Four. My game was a nine.', 'Ten. They aired the truth, unfortunately.', 'A {placement}-shaped six.'],
    s: { chaos: ['Out of ten? Purple.'], charmer: ['An eleven, and modest with it.'] } },
  { q: 'Who do you still talk to?',
    a: ['{partner}. Daily.', 'Half the cast. The correct half.', 'The group chat is three people and one of them is muted.'],
    s: { deadpan: ['Nobody. It’s great.'] } },
  { q: 'One rule you’d add to the game?',
    a: ['No whispering after midnight.', 'Everything {rival} did? Banned.', 'Immunity for whoever cooks.'],
    s: { analyst: ['Public vote counts. Watch the cowardice evaporate.'] } },
  { q: 'Delete one twist from history.',
    a: ['The one that sent me home.', 'All of them. Let people play.', 'Whichever one production loved most.'],
    s: { chaos: ['Delete? I’d add six.'] } },
  { q: 'Unfinished business?',
    a: ['{rival} knows.', 'A trophy.', 'None. …One.'],
    s: { earnest: ['Just a proper goodbye I never got to say.'] } },
];

const SUBJECT_COMMENTS = [
  'I was not in the room to answer any of this. Noted.',
  'Interesting episode. Interesting choices. Interesting that my name carried the whole hour.',
  'Enjoy the listens. My lawyer enjoyed them too.',
  'Half of that is not how it happened and the half that is sounds worse out of context.',
];

const LISTENER_COMMENTS = {
  close: ['knew every word of this already and it STILL got me', 'the chair never stood a chance 🤍', 'called them right after this dropped. we talked for two hours'],
  friend: ['ok this was actually a great listen', 'the rapid fire took me OUT', 'they sound exactly like this in real life, for the record'],
  rival: ['a very generous retelling', 'fascinating what got left out', 'the press was the only honest minute of the hour'],
};

// ── the composers ───────────────────────────────────────────────────────

const bank = (style, group) => (A[style] && A[style][group]) || A.deadpan[group] || [];

/**
 * Write the whole transcript for one episode.
 *
 * `ep` carries id/kind/topics/facts/style/tier; `prior` is the earlier episode
 * this one answers (continuity), if any; `visit` is which appearance this is.
 * Pure text — nothing here reads or writes a number the follower model uses.
 */
export function composeEpisode(ep, { words = {}, prior = null, visit = 1 } = {}) {
  const style = ep.style || 'deadpan';
  const facts = ep.facts || {};
  const groupOf = t => t.id === 'the-win' ? 'win'
    : (t.id === 'the-loss' || t.id === 'the-boot' || t.id === 'the-target') ? 'out'
      : t.id === 'the-rivalry' ? 'conflict'
        : (t.id === 'the-showmance' || t.id === 'the-breakup') ? 'romance'
          : t.id === 'the-life' ? 'life' : 'bts';

  // Cold open: returning guests get recognised before anything else.
  const coBank = visit > 1 ? COLD_OPEN.returning : COLD_OPEN[ep.kind] || COLD_OPEN.debrief;
  const coldOpen = fill(pickFrom(coBank, ep.id + '|cold') || '', {
    ...facts, guest: ep.guestName, visit: String(visit),
  });

  // Continuity: the response exchange leads, because that is how Kristal
  // would open — with the clip.
  const topics = [...ep.topics];
  if (prior) topics.unshift({ id: 'the-response', about: prior.guest, quoted: prior });

  const pressBudget = ep.tier === 'viral' ? 2 : 1;
  let pressed = 0;
  // Juiciest first for the press decision, original order for reading.
  const juice = { 'the-response': 5, 'the-breakup': 4, 'the-rivalry': 3, 'the-target': 2 };
  const pressOn = new Set(topics
    .filter(t => (juice[t.id] || 0) > 0)
    .sort((a, b) => (juice[b.id] || 0) - (juice[a.id] || 0))
    .slice(0, pressBudget).map(t => t.id));
  if (!pressOn.size && topics.length) pressOn.add(topics[0].id);

  const exchanges = topics.slice(0, 4).map((t, i) => {
    const group = t.id === 'the-response' ? 'response' : groupOf(t);
    const f = { ...facts,
      about: t.about ? (facts.rivalName || t.about) : facts.rival,
      quotedName: t.quoted ? t.quoted.guestName : undefined };
    const q = t.id === 'the-response'
      ? fill(pickFrom([
        'Before we start: {quotedName} sat in that chair this week and said — and I quote — “{quote}”. You’ve had days to think about it. Go.',
        'I play clips now. Here’s {quotedName}, this exact chair: “{quote}”. React.',
      ], ep.id + '|rq'), { ...f, quote: t.quoted._lastCrack || t.quoted._lastAnswer || '' })
      : fill(pickFrom(QUESTIONS[t.id] || QUESTIONS['behind-the-scenes'], `${ep.id}|q|${i}`) || '', {
        ...f, players: words.players || 'players', player: words.player || 'player',
        exit: words.exit || 'voted out', season: facts.season,
      });
    const x = { topic: t.id, q, a: pickFilled(bank(style, group), `${ep.id}|a|${i}`, f) };
    if (pressOn.has(t.id)) {
      const crackBank = t.id === 'the-life' ? CRACK_LIFE[style] : CRACK[style];
      x.press = pickFrom(PRESS[style], `${ep.id}|p|${i}`);
      x.crack = pickFilled(crackBank || [], `${ep.id}|c|${i}`, f);
      if (x.crack) pressed++;
      else { delete x.press; delete x.crack; }
    }
    return x;
  }).filter(x => x.q && x.a);

  // Rapid fire: four questions, seeded so an episode never repeats one, each
  // answered from ITS OWN bank — style override first, then the question's
  // general answers, with fact eligibility so {rival} lines need a rival.
  const start = hash(ep.id + '|rf') % RAPID.length;
  const rapid = Array.from({ length: 4 }, (_, i) => {
    const item = RAPID[(start + i * 3) % RAPID.length];
    const styled = pickFilled(item.s?.[style] || [], `${ep.id}|rfs|${i}`, facts);
    return { q: item.q,
      a: styled || pickFilled(item.a, `${ep.id}|rfa|${i}`, facts) || item.a[0] };
  });

  // What the clip everyone shares actually says — the last crack, or the
  // loudest answer. Continuity quotes read from here.
  const crackX = exchanges.filter(x => x.crack).pop();
  ep._lastCrack = crackX ? crackX.crack : null;
  ep._lastAnswer = exchanges.length ? exchanges[exchanges.length - 1].a : null;

  return { coldOpen, exchanges, rapid, pressed };
}

// Kristal's questions, kept from v1 and extended — hers were never the
// shallow half.
const QUESTIONS = {
  'the-win': [
    'Everyone says the winner played the perfect game. I watched the tapes, babe — perfect is not the word I’d use. Walk me through it.',
    'You won. Congratulations. Now tell me the part of the resume you don’t put on the resume.',
    '{season} ended with your name. Whose name SHOULD it have been, if you hadn’t done the thing you did — and say the thing.',
  ],
  'the-loss': [
    'Second place. I need you to say, out loud, the exact moment you lost it — because I know the moment, and I want to see if you do.',
    'The jury picked somebody else. Years from now, what’s the vote you’d take back?',
  ],
  'the-boot': [
    'Let’s talk about the night you got {exit}, because the edit was VERY kind to some of the {players} in that room.',
    'You didn’t lose that game, somebody took it from you. Name them.',
  ],
  'the-rivalry': [
    'You and {about}. I’m not moving on until we’ve done this properly.',
    'Every season has a feud the cameras undersold. Yours was {about}. Correct the record.',
    'I have a theory that you and {about} secretly respected each other. Destroy my theory or confirm it, no middle.',
  ],
  'the-showmance': [
    'You found a whole relationship on a game show. Defend yourself.',
    'The audience shipped it. The other {players} weaponised it. Which of them was right about you and {about}?',
  ],
  'the-breakup': [
    'You and {about} left that season together and did not stay that way. I have theories. Go.',
    'I’m going to say a name — {about} — and you’re going to tell me the truth this time.',
  ],
  'the-target': [
    'The other {players} wrote your name down A LOT. At what point did you notice, and why didn’t it work?',
  ],
  'the-life': [
    'Something happened this year, and my listeners have been feral about it. Tell them yourself.',
    'You’ve had a YEAR. Start wherever it hurts.',
  ],
  'behind-the-scenes': [
    'Give me the thing production cut. You know exactly which one I mean.',
    'Last one before rapid fire. Tell me something that never made air, and make it good.',
  ],
};

/** Listener comments: the graph decides who shows up; the subject always does
 *  on a viral episode — they were not in the room. */
export function episodeComments(ep, { ties = [], names = {} } = {}) {
  const out = [];
  if (ep.tier === 'viral' && ep.mentioned) {
    out.push({ slug: ep.mentioned, name: ep.mentionedName || names[ep.mentioned] || ep.mentioned,
      relation: 'subject', text: pickFrom(SUBJECT_COMMENTS, ep.id + '|subj') });
  }
  const ranked = ties.slice().sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  for (const t of ranked) {
    if (out.length >= 3) break;
    if (t.slug === ep.mentioned || t.slug === ep.guest) continue;
    const relation = t.weight >= 3 ? 'close' : t.weight > 0 ? 'friend' : 'rival';
    if (relation === 'rival' && hash(`${ep.id}|${t.slug}|skip`) % 2) continue;
    out.push({ slug: t.slug, name: names[t.slug] || t.slug, relation,
      text: pickFrom(LISTENER_COMMENTS[relation], `${ep.id}|lc|${t.slug}`) });
  }
  return out;
}
