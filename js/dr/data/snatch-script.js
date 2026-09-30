// ══════════════════════════════════════════════════════════════════════
// dr/data/snatch-script.js — the Snatch Game, as it is actually played
// ══════════════════════════════════════════════════════════════════════
//
// THE FORMAT, off the fandom wiki (2026-09-30): a parody of Match Game. The
// host reads a fill-in-the-blank card to one of two celebrity CONTESTANTS;
// the queens, as their celebrities, give their own answers down the panel;
// the contestant then reveals what she wrote, and a queen who wrote the same
// thing scores her a point. The points decide nothing — the judging is the
// impression and the comedy — which is why the obvious answer is the one
// that MATCHES and the funny one never does.
//
// Everything here is a line the engine picks (js/dr/chal/snatch-game.js). The
// screen renders what was picked; it never chooses a joke itself.
//
// ── THE DECK ──────────────────────────────────────────────────────────
//
// Every blank takes a short phrase, so any queen's card fits any question
// grammatically. `obvious` is what an ordinary person writes: it is what the
// contestants put on their cards, and it is what a queen who has nothing
// reaches for — so the dead answer and the match are the same answer.
//
// ── PLACEHOLDERS ──────────────────────────────────────────────────────
//   {a} the queen   {c} her celebrity   {card} what she wrote
//   {catch} her celebrity's catchphrase   {x} the contestant   {b} a target

export const SNATCH_QUESTIONS = [
  { id: 'famous', text: 'The worst thing about being famous is ___.',
    obvious: ['the paparazzi', 'no privacy', 'the tabloids', 'the fans'] },
  { id: 'broke', text: "I'm so broke, I had to sell my ___.",
    obvious: ['car', 'wigs', 'shoes', 'jewellery'] },
  { id: 'date', text: 'My last date was so cheap, he took me to ___.',
    obvious: ['a drive-thru', 'a buffet', 'the movies', 'his mom\'s place'] },
  { id: 'surgeon', text: 'My plastic surgeon is so good, he gave me a brand-new ___.',
    obvious: ['nose', 'face', 'butt', 'chin'] },
  { id: 'fridge', text: "You know you're in a drag queen's apartment when the fridge is full of ___.",
    obvious: ['wigs', 'makeup', 'champagne', 'eyelashes'] },
  { id: 'rugold', text: 'RuPaul is so old, her first drag mother was ___.',
    obvious: ['a dinosaur', 'Cleopatra', 'a caveman', 'Moses'] },
  { id: 'never', text: 'I would never be caught dead wearing ___.',
    obvious: ['socks with sandals', 'a fanny pack', 'a onesie', 'cargo shorts'] },
  { id: 'casserole', text: 'The secret ingredient in my famous casserole is ___.',
    obvious: ['love', 'cheese', 'bacon', 'butter'] },
  { id: 'publicist', text: 'My publicist told me never to be photographed with ___.',
    obvious: ['my ex', 'a drink', 'no makeup', 'a cigarette'] },
  { id: 'man', text: 'The one thing I look for in a man is ___.',
    obvious: ['money', 'a nice smile', 'a sense of humour', 'a big wallet'] },
  { id: 'wig', text: 'I keep ___ in my wig at all times.',
    obvious: ['bobby pins', 'my lipstick', 'cash', 'a spare lash'] },
  { id: 'elevator', text: 'At the Oscars, I got stuck in an elevator with ___.',
    obvious: ['my ex', 'a waiter', 'the host', 'a seat-filler'] },
];

export const questionById = id => SNATCH_QUESTIONS.find(q => q.id === id) || null;

/* ── THE FLAT ANSWER ──
   In the voice, with the obvious answer, and nothing else. This is the queen
   who can DO the celebrity and has no jokes for her: the catchphrase, again,
   is the tell. Stage directions sit in square brackets and are drawn as such. */
export const FLAT_SAYS = [
  '"{Card}." [A beat.] "{catch}"',
  '"Um — {card}? {catch}"',
  '"I\'m gonna say {card}." [She looks at Ru. Ru looks back at her.]',
  '"{Card}, Ru. Obviously." [She waits for the laugh. It is a small one.]',
  '"{catch} …{card}."',
  '[She thinks about it for slightly too long.] "{Card}."',
];

/* ── THE BOMB ──
   The character goes. What is left is a queen in somebody else's wig with no
   idea what that person would say. */
export const BOMB_SAYS = [
  '[The voice slips completely.] "Sorry — {card}. Can I do that one again?"',
  '"{Card}… because… [a long pause] …that\'s what {c} would say."',
  '"Ru, I\'m going to be honest, I didn\'t hear the question." [Her card says {card}.]',
  '[She starts a joke about something else, loses it halfway, and lands on] "…{card}."',
  '"{catch}" [Nothing. She tries it again, louder.] "{catch}" [Still nothing.] "…{card}."',
  '[Her accent disappears halfway through the sentence.] "{Card}. I don\'t know. {Card}."',
];

/* ── RU, ANSWERING HER ──
   The host is the straight man. How he takes it is the laugh-o-meter said
   out loud. */
export const RU_REACTS = {
  kill: [
    '[RuPaul throws his head back and has to hold onto the desk.]',
    '"I can\'t. I cannot. Somebody help me."',
    '[RuPaul is laughing too hard to read the next card.]',
    '"Stop it. STOP it." [He does not want her to stop it.]',
    '[RuPaul wipes his eyes and points at her.] "You are terrible. I love it."',
    '"Oh, that\'s going in the promo."',
  ],
  laugh: [
    '"Okay! Okay!"',
    '[RuPaul snorts.] "You would know."',
    '"I believe every word of that."',
    '[RuPaul nods slowly, grinning.] "Mm-hm."',
    '"That\'s the most honest thing anybody\'s said on this panel."',
    '"Well, alright then!"',
  ],
  flat: [
    '"Okay."',
    '"Alright. Thank you."',
    '[RuPaul writes something on his card. It is not a compliment.]',
    '"Mm. Interesting."',
    '"Great. Moving on."',
    '[RuPaul looks at her for one second longer than is comfortable.]',
  ],
  bomb: [
    '[RuPaul lets the silence sit.] "…Okay. Next."',
    '"I\'m gonna come back to you. Or not."',
    '[RuPaul turns to the other side of the panel without a word.]',
    '"Mm-hm." [He does not mean mm-hm.]',
    '[The only sound is Michelle\'s pen.]',
    '"Wow. Okay. Let\'s go somewhere else."',
  ],
};

/* The host gives a queen more rope — a follow-up question, a setup — and she
   either takes it and runs or hangs from it. */
/* Split by where she started: `push` follows an answer that already got a
   laugh (he wants a second one), `rescue` follows one that died (he is
   throwing her a rope). A line that says she "topped her answer" cannot
   follow an answer that got nothing. */
export const RU_ROPE = {
  worked: {
    push: [
      'RuPaul asks a follow-up — "And how did that make you feel?" — and she gets a second, bigger laugh.',
      'RuPaul plays along and asks one more question, and she tops her own answer.',
    ],
    rescue: [
      'RuPaul throws her an easy follow-up, and this time she gets the laugh.',
      'RuPaul gives her a second chance with a setup, and she finally lands one.',
    ],
    partial: [
      'RuPaul throws her an easy follow-up, and she gets a little more out of it this time. Not a laugh. A smile.',
      'RuPaul gives her a second chance, and the second answer is better than the first. That is not saying much.',
    ],
  },
  failed: {
    push: [
      'RuPaul pushes her for a second joke, and she doesn\'t have one.',
      'RuPaul asks a follow-up, and the second answer is nowhere near as good as the first.',
    ],
    rescue: [
      'RuPaul throws her a follow-up to help. She doesn\'t catch it.',
      'RuPaul asks one more question to rescue her, and it makes things worse.',
    ],
  },
};

/* The desk, opening and closing. {x} and {y} are the two contestants. */
export const SHOW_OPEN = [
  '"Welcome to the Snatch Game! Playing tonight are {x} and {y}, and our celebrity panel is the most glamorous collection of people ever gathered in one place. Let\'s meet them."',
  '"Good evening and welcome to the Snatch Game, the only game show where the stars are fake and the prizes are imaginary. Playing tonight: {x} and {y}. And here is our panel!"',
  '"It\'s time for the Snatch Game! {x}, {y}, you\'re playing for absolutely nothing. Let\'s meet the celebrities who\'ll help you win it."',
];

export const SHOW_CLOSE = [
  '"That\'s all the time we have. Thank you to our players, thank you to our celebrities, and for the rest of you: good luck, and don\'t mess it up."',
  '"And that\'s the Snatch Game! Our celebrities have been lovely, most of them. Goodnight!"',
  '"Thank you, celebrities. Some of you I\'ll be seeing on the main stage. Some of you I\'ll be seeing in my nightmares."',
];

/* The panel is introduced. A queen who has the character gets her
   celebrity's own intro (in the kit); these are for one who is flat, and one
   who is already dying before the first question. */
export const INTRO_FLAT = [
  '"Hi, Ru! I\'m {c}." [A pause.] "{catch}"',
  '"Hello! It\'s me, {c}! {catch}"',
  '"{c} here. I\'m so happy to be here, Ru." [That is the whole introduction.]',
];
export const INTRO_DEAD = [
  '"Hi… I\'m {c}." [That is all she has.]',
  '"Hello, I\'m {c}. I think." [Nobody laughs.]',
  '[She says the name, and then clearly cannot remember what {c} sounds like.]',
];

/* The host reads the card to one contestant. {x} contestant, {q} question. */
export const ASK = [
  '"{x}, fill in the blank: {q}"',
  '"{x}, here\'s your question. {q}"',
  '"Okay, {x}. {q}"',
];

/* The contestant's card, turned over. */
export const REVEAL = {
  match: [
    '"{x}, what did you write?" {x} flips the card: "{card}." It\'s a match with {m}! A point for {x}!',
    '{x} turns the card round: "{card}." It\'s a match — {m} said the same thing!',
  ],
  miss: [
    '"{x}, what did you write?" {x} flips the card: "{card}." Nobody matched. {x} gets nothing, which is the traditional prize.',
    '{x} turns the card round: "{card}." The panel looks at each other. Not one match.',
    '{x} reads out "{card}" and the whole panel groans. Nobody said it. Nobody would.',
  ],
};

/* A queen who has died three times is not asked again. The host says so
   without saying so. */
export const PASSED_OVER = [
  'RuPaul goes down the panel and skips {c} without looking at her.',
  'RuPaul\'s eyes pass over {c} and keep going.',
  '{c} leans forward with an answer ready. RuPaul goes to the next booth.',
];

/* The cross-talk. The heckle itself is the celebrity's own line (in the kit);
   the assist is a nice queen building on somebody else's bit instead. */
/* `build` when the answer she jumps on already got a laugh; `rescue` when
   it died and she is helping a friend out of it. */
export const ASSIST = {
  build: [
    '{c} jumps in behind {t}\'s answer with a second punchline, and the two of them keep the bit going.',
    '{c} picks up what {t} just said and adds to it, and RuPaul lets the two of them run with it.',
  ],
  rescue: [
    '{c} jumps in to help {t} out, and between the two of them they get a laugh out of it.',
    '{c} rescues {t} with a quick joke about the same answer, and {t} laughs along with her.',
  ],
};

/* A kit line is written as she says it, with any stage direction in square
   brackets. Spoken parts get quotation marks; directions stay outside them. */
export function quoteLine(line) {
  return String(line || '').split(/(\[[^\]]*\])/).map(p => p.trim()).filter(Boolean)
    .map(p => (p.startsWith('[') ? p : `"${p}"`)).join(' ');
}

/* Pick, fill. Shared with the engine so every placeholder is filled the same
   way everywhere. */
export function fillSnatch(line, vars = {}) {
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  return String(line || '').replace(/\{(Card|card|catch|a|c|x|y|b|t|m|q)\}/g, (m, k) => {
    if (k === 'Card') return cap(vars.card || '');
    return vars[k] != null ? String(vars[k]) : m;
  });
}
