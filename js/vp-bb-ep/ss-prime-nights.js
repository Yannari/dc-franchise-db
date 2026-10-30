// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-prime-nights.js — the sixteen more themed primes, on screen
// ══════════════════════════════════════════════════════════════════════
//
// js/ss/prime-nights.js plays the nights; this draws each segment as a live screen. steps.js spreads them through
// the prime (after the opening, the live chat, the airlock, the kitties), opens the night with NIGHT_INTRO, and
// comes back to it between segments with NIGHT_NOTES. Plates the user has still to make fall back to the nearest
// room (ss-groups.js SPACE_FALLBACK; the plate jobs are Downloads/SecretStory-plates/to-edit-family6).

import { NIGHT_THEMES } from '../ss/prime-nights.js';

/** @typedef {{ ssv: Function, pickBy: Function, listOf: Function, euros: Function, pronouns: Function }} NightHelpers */

const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const spread = who => [...new Set(who.filter(Boolean))].slice(0, 9).map((n, i, w) => [n, w.length === 1 ? 50 : Math.round(14 + 72 * i / (w.length - 1))]);
const at = (set, plate, room, who, extra = {}) => ({ set, plate, room, cam: 1, kicker: `Live · ${room}`, cast: spread(who), ...extra });

// where each night happens
const PLACE = {
  'lie-detector': who => at('ceremony', 'ss-lie-detector', 'The Lie Detector', who),
  thermal: who => at('ceremony', 'ss-truths', 'The Thermal Camera', who, { thermal: true }),
  library: who => at('ceremony', 'library-wide', 'The Library of Secrets', who),
  'black-phone': who => at('ceremony', 'living-sofas', 'Living Room', who),
  families: who => at('door', 'foyer', 'The Airlock', who),
  masks: who => at('ceremony', 'living-sofas', 'Living Room', who),
  fire: who => at('ceremony', 'living-sofas', 'Living Room', who),
  'back-in-time': who => at('ceremony', 'living-screens', 'Living Room', who),
  returns: who => at('ceremony', 'living-sofas', 'Living Room', who),
  temptations: who => at('ceremony', 'ss-dilemma', 'The Dilemma Room', who),
  'gender-war': who => at('ceremony', 'ss-arena', 'The Arena', who),
  shields: who => at('ceremony', 'ss-shields', 'The Hall of Shields', who),
  safe: who => at('ceremony', 'ss-vault', 'The Safe', who),
  'crystal-ball': who => at('ceremony', 'ss-crystal-ball', 'The Crystal Ball', who),
  jungle: who => at('yard', 'ss-jungle', 'The Jungle of Decisions', who),
  hearts: who => at('ceremony', 'hoh-suite', 'The Love Room', who),
};
const SHORT = { 'lie-detector': 'Lie Detector', thermal: 'Thermal Camera', library: 'The Library', 'black-phone': 'Black Phone', families: 'The Families',
  masks: 'The Masks', fire: 'Playing With Fire', 'back-in-time': 'Back in Time', returns: 'The Returns', temptations: 'Temptation',
  'gender-war': 'The Gender War', shields: 'The Shields', safe: 'The Safe', 'crystal-ball': 'The Crystal Ball', jungle: 'The Jungle', hearts: 'Hearts' };

/** The night's opening line, said by the host as the prime opens. */
export const NIGHT_INTRO = {
  'lie-detector': 'Tonight, the lie detector is in the Room of Truths, and three of you are going to sit in that chair.',
  thermal: 'Tonight, a thermal camera. Your faces can lie to us. Your temperature cannot.',
  library: 'Tonight, the Library of Secrets is open. Four books are hidden in it, and every one of them holds a power.',
  'black-phone': 'Tonight, the black phone is back. It only ever brings bad news.',
  families: 'Tonight, the families are here, in the airlock. Not everybody will get to see theirs.',
  masks: 'Tonight, the masks come off. Face to face, you will say who you trust the least, and why.',
  fire: 'Tonight, we are playing with fire. Some of you can double your kitty. Or lose half of it.',
  'back-in-time': 'Tonight, we go back in time. Your nominations are secret in this house. Not tonight.',
  returns: 'Tonight, some faces you thought were gone are coming back into the house. For one night only.',
  temptations: 'Tonight, the Voice is offering money. A lot of money. And every offer has a price.',
  'gender-war': 'Tonight: girls against boys. And the losing side will pay for it at next week\'s nominations.',
  shields: 'Tonight, five shields are hidden in the house. Two of them are real.',
  safe: 'Tonight, every kitty in the house has paid into a safe. Somebody is going to open it.',
  'crystal-ball': 'Tonight, you, the public, are sending one housemate up to the crystal ball.',
  jungle: 'Tonight, the Jungle of Decisions. Every fork in the path is a choice, and every choice has a price.',
  hearts: 'Tonight is the Night of Hearts. The couples of this house are going to be tested.',
};
/** What the host says about the night between the live moments. */
export const NIGHT_NOTES = {
  'lie-detector': ['The lie detector is still waiting in the Room of Truths.', 'Nobody in that house will look at the polygraph chair tonight.', 'One more of you in the chair before the night is over.'],
  thermal: ['The thermal camera has seen things tonight that nobody said out loud.', 'Red means hot. And we have seen a lot of red tonight.', 'Some of them stayed blue. Some of them did not.'],
  library: ['Two books found. Two still on the shelves.', 'The Library of Secrets has had its say.', 'Somebody in that house is holding a book they did not want.'],
  'black-phone': ['The black phone can ring again at any moment.', 'Nobody wants to be the one who answers the black phone.', 'The black phone has done its damage tonight.'],
  families: ['More families are waiting in the airlock.', 'Not every housemate is going to see their family tonight.', 'Some of them gave their minutes away tonight.'],
  masks: ['The masks are off, and they are not going back on.', 'Things have been said tonight that cannot be unsaid.', 'Every friendship in that house has heard the word "trust" tonight.'],
  fire: ['Some kitties have doubled tonight. Some have halved.', 'The fire is still burning in the living room.', 'Who else is going to play with fire?'],
  'back-in-time': ['Every old vote is a question tonight.', 'Some friendships in that house are not what they look like.', 'The past is not finished with that house yet.'],
  returns: ['The returns are not finished yet.', 'Some old friends, and some old enemies, are back tonight.', 'They came back, and they did not come back empty-handed.'],
  temptations: ['More money is waiting to be offered.', 'Some of them said yes. Some of them said no.', 'Every offer tonight had a price.'],
  'gender-war': ['The girls against the boys, and next week one side pays for it.', 'The gender war is still on in the house.', 'Next week, only one side can be nominated.'],
  shields: ['Five shields, two real. We will find out which very soon.', 'Somebody is holding a fake shield and thinks it is real.', 'The shields will be revealed before the end of the night.'],
  safe: ['The safe is still closed.', 'Three digits, three housemates, one safe.', 'Who keeps the money, and who shares it?'],
  'crystal-ball': ['The crystal ball is shining on the roof.', 'What did they see up there?', 'The public sent them up. Now we see what they do with it.'],
  jungle: ['More of them still have to walk the jungle.', 'Left or right. Every choice tonight cost something.', 'The Jungle of Decisions has not finished with them.'],
  hearts: ['The couples of this house are being tested tonight.', 'Love or money. Tonight they had to choose.', 'Some hearts are fuller tonight. Some are broken.'],
};

/**
 * One segment of a night, as a live screen.
 * @param {any} seg  { theme, part, of, ... } from js/ss/prime-nights.js
 * @param {any} ctx
 * @param {string} host
 * @param {NightHelpers} H
 */
export function ssNightScreen(seg, ctx, host, H) {
  const { ssv, pickBy, listOf, euros } = H;
  const P = n => { try { return /** @type {any} */ (H.pronouns(n)) || {}; } catch { return {}; } };
  const th = seg.theme;
  const k = `${ctx.week}|night|${th}|${seg.part}`;
  const R = (pool, n) => pickBy(pool, `${k}|${n}`);
  const place = PLACE[th] || (who => at('ceremony', 'living-sofas', 'Living Room', who));
  const house = (ctx.house || []).filter(Boolean);
  const first = seg.part === 0;
  const last = seg.part === (seg.of || 1) - 1;
  const id = `${k}|ask`;
  /** @type {any[]} */ let steps = [];
  let who = [];
  let sub = '';

  if (th === 'lie-detector') {
    const s = seg.who;
    who = [s];
    sub = `${s} in the chair`;
    steps.push({ k: 'beat', scene: place([s]), t: `${s} sits down in the chair. The cuffs go round ${P(s).posAdj || 'their'} arm, the clips onto ${P(s).posAdj || 'their'} fingers.` },
      ssv(`${s}, answer with yes or no. The machine will do the rest.`));
    seg.qs.forEach((q, i) => {
      steps.push(ssv(q.q), { k: 'say', by: s, t: `${q.said}.` });
      if (i === 0) steps[steps.length - 1].ask = { id, q: `Is ${s} telling the truth?`, opts: ['Truth', 'Lie'] };
      steps.push(q.caught ? { k: 'beat', toast: ['LIE', '#ff3355'], shake: true, t: R(['The needle jumps off the paper. The screen flashes red.', 'The needle swings hard, three times. The screen goes red.'], `c${i}`), ...(i === 0 ? { settle: { id, answer: 'Lie', n: 2 } } : {}) }
        : { k: 'beat', toast: ['TRUTH', '#19d3c5'], t: R(['The needle barely moves. The screen stays green.', 'A flat, steady line. Green.'], `t${i}`), ...(i === 0 ? { settle: { id, answer: q.lie ? 'Lie' : 'Truth', n: 2 } } : {}) });
      if (q.caught && q.about && house.includes(q.about)) steps.push({ k: 'say', by: q.about, scene: at('ceremony', 'living-sofas', 'Living Room', [q.about, s]), t: R([`${s}? Seriously?`, 'Well. Now we know.', `I'd like a word with you later, ${s}.`], `r${i}`), tense: [q.about, s] }, { k: 'beat', scene: place([s]), t: `Back in the chair, ${s} stares at the floor.` });
    });
    steps.push({ k: 'say', by: s, t: seg.qs.some(q => q.caught) ? R(['That machine is broken. It is broken.', 'I was nervous! Nervous is not lying!'], 'end') : R(['See? Nothing to hide.', 'I told you. Every word.'], 'end') });
  } else if (th === 'thermal') {
    const s = seg.who;
    who = [s];
    sub = s;
    steps.push({ k: 'beat', scene: place([s]), t: `${s} sits in front of the screen. On the thermal camera, ${P(s).posAdj || 'their'} face is all blue and green.` });
    seg.clips.forEach((c, i) => {
      if (c.meaning === 'nerves') steps.push(ssv(`${s}, the next clip is about the secrets in this house. One of them is yours.`), { k: 'beat', toast: ['HOT', '#ff6a3d'], t: `${s}'s face goes from green to orange to bright red in three seconds.` },
        { k: 'host', by: host, t: 'Interesting. The moment we talked about secrets, your temperature went straight up.' }, { k: 'say', by: s, t: R(["It's warm in here. That's all.", "Everybody's nervous about secrets."], `n${i}`) });
      else if (c.meaning === 'crush') steps.push({ k: 'beat', t: R([`On the screen: ${c.about}, laughing in the kitchen.`, `On the screen: ${c.about}, asleep on the sofa.`, `On the screen: ${c.about}, dancing at the last party.`, `On the screen: ${c.about}, singing in the shower, badly.`], `cl${i}`) }, { k: 'beat', toast: ['HOT', '#ff6a3d'], t: `${s}'s cheeks go orange, then red.` },
        { k: 'host', by: host, t: `${s}, that is a lot of red for ${c.about}. Anything you want to tell us?` }, { k: 'say', by: s, t: R(['No! Nothing. It is just hot in here.', '...Next clip, please.'], `c${i}`) });
      else if (c.meaning === 'anger') steps.push({ k: 'beat', t: R([`On the screen: ${c.about}, talking about ${s} in the garden.`, `On the screen: ${c.about}, rolling ${P(c.about).posAdj || 'their'} eyes as ${s} walks past.`, `On the screen: ${c.about}, laughing at something ${s} said, and not in a nice way.`], `al${i}`) }, { k: 'beat', toast: ['HOT', '#ff3355'], t: `${s}'s jaw goes tight. The whole screen turns red.` },
        { k: 'say', by: s, t: R([`I'm calm. I'm completely calm.`, `I'll deal with ${c.about} later.`], `a${i}`) });
      else steps.push({ k: 'beat', t: R([`On the screen: ${c.about || 'the house'}, doing the washing up. ${s} stays blue from start to finish.`, `On the screen: ${c.about || 'the house'}, reading in the library. Not a flicker. Blue all the way.`], `nl${i}`) });
    });
  } else if (th === 'library') {
    who = (seg.books || []).map(b => b.to);
    sub = listOf(who);
    if (first) steps.push(ssv('Housemates, four books are hidden in the Library of Secrets. Whoever finds one keeps its power.', { scene: place(house.slice(0, 6)) }), { k: 'beat', t: 'Books come off the shelves by the armful. Somebody climbs the ladder.' });
    for (const b of seg.books || []) {
      const NAME = { wishes: 'the Book of Wishes', ruin: 'the Book of Ruin', investigator: 'the Investigator', immunity: 'the Book of Immunity' }[b.book];
      steps.push({ k: 'beat', scene: place([b.to]), toast: [String(NAME).toUpperCase(), '#e0b84a'], t: `${b.to} pulls a thick book off the top shelf: ${NAME}.` });
      if (b.book === 'wishes') steps.push(ssv(`${b.to}, your wish is granted: ${euros(b.amount)} for your kitty.`), { k: 'say', by: b.to, t: R(['Best book I have ever read.', 'Thank you. Thank you!'], 'w') });
      else if (b.book === 'ruin' && b.on) steps.push(ssv(`${b.to}, the Book of Ruin. Name one housemate: half of their kitty is gone.`), { k: 'say', by: b.to, t: `${b.on}.` },
        ssv(`${b.on}, you lose ${euros(b.lost || 0)}.`), { k: 'say', by: b.on, scene: place([b.on, b.to]), t: R([`Me? Of course it's me.`, `You'll regret that, ${b.to}.`], 'r'), tense: [b.on, b.to] });
      else if (b.book === 'ruin') steps.push(ssv(`${b.to}, the Book of Ruin. Name one housemate, and half of their kitty is gone.`), { k: 'beat', t: `${b.to} tears the pages out, one by one, and drops them in the fireplace.` },
        { k: 'say', by: b.to, t: R(["I'm not winning like that.", 'Nobody in here deserves that. Not even the ones I do not like.'], 'rb') });
      else if (b.book === 'investigator') steps.push(ssv(`${b.to}, the Investigator. Inside, one true thing about ${b.on ? "one housemate's" : 'a'} secret.`), { k: 'beat', t: `${b.to} reads the page twice, then closes the book very quietly.` });
      else steps.push(ssv(`${b.to}, the Book of Immunity. Next week, you cannot be nominated.`), { k: 'say', by: b.to, t: R(['Safe. Next week, I am safe.', 'I am sleeping very well tonight.'], 'i') });
    }
  } else if (th === 'black-phone') {
    who = [seg.ans];
    sub = `${seg.ans} answers`;
    const PUN = { nominated: 'somebody in this house will be nominated directly next week', kitty: `somebody in this house loses ${euros(2000)} from their kitty`, chores: "somebody does the whole house's chores for a week" };
    steps.push({ k: 'beat', scene: place(house.slice(0, 7)), toast: ['THE BLACK PHONE', '#30303a'], shake: true, t: R(['In the middle of the living room, the black phone rings.', 'The black phone rings. Nobody moves.'], 0) },
      { k: 'beat', t: `${seg.ans} picks it up.` },
      ssv(`${seg.ans}, the black phone only brings bad news. Tonight, ${PUN[seg.pun]}. You choose who.`, { ask: { id, q: `Who will ${seg.ans} choose?`, people: true, opts: [seg.ans, ...house.filter(n => n !== seg.ans && n !== seg.target).slice(0, 2), ...(seg.target !== seg.ans ? [seg.target] : [])].slice(0, 4) } }),
      { k: 'say', by: seg.ans, t: seg.self ? R(['Me. I will take it myself.', "Me. I'm not doing that to anybody."], 1) : `${seg.target}.`, settle: { id, answer: seg.target, n: 4 } });
    if (seg.self) steps.push({ k: 'beat', t: R(['The house goes quiet, then claps.', 'Somebody whistles. The house claps.'], 2) });
    else steps.push({ k: 'say', by: seg.target, t: R([`Thanks a lot, ${seg.ans}.`, `Of course it's me.`, `I won't forget that, ${seg.ans}.`], 3), tense: [seg.target, seg.ans] });
  } else if (th === 'families') {
    who = [seg.who, seg.friend];
    sub = seg.who;
    steps.push({ k: 'beat', scene: place([seg.who]), t: `The airlock doors open. On the other side of the glass: ${seg.who}'s family.` },
      { k: 'beat', t: `${seg.who} has both hands over ${P(seg.who).posAdj || 'their'} mouth.` },
      ssv(`${seg.who}, five minutes with them. Or give your five minutes to ${seg.friend}, whose family has not been here.`, { ask: { id, q: `What will ${seg.who} do?`, opts: ['Keep the minutes', 'Give them away'] } }));
    if (seg.gave) steps.push({ k: 'say', by: seg.who, t: R([`Give them to ${seg.friend}.`, `${seg.friend}. ${cap(P(seg.friend).sub || 'they')} needs it more than me.`], 0), settle: { id, answer: 'Give them away', n: 2 } },
      { k: 'beat', scene: place([seg.friend]), t: `${seg.friend}'s family comes into the airlock instead. ${seg.friend} runs to the glass, crying.` },
      { k: 'say', by: seg.friend, t: R([`${seg.who}, I will never forget this.`, `Thank you. Thank you. I don't know what to say.`], 1) });
    else steps.push({ k: 'say', by: seg.who, t: R(["I'm sorry. I need this.", 'I want to see them. I need to.'], 0), settle: { id, answer: 'Keep the minutes', n: 2 } },
      { k: 'beat', t: `${seg.who} runs into the airlock and straight into their arms.` });
  } else if (th === 'masks') {
    who = (seg.calls || []).flatMap(c => [c.a, c.b]);
    sub = `round ${seg.part + 1}`;
    const WHY = {
      'buzzed-me': [n => `${n} buzzed me. You don't forget that.`, n => `${n} pressed the buzzer on me. That told me everything.`],
      'cannot-stand': [n => `Because I cannot stand ${P(n).obj || 'them'}, and everybody knows it.`, n => `We have not had one good conversation since the first week, ${n} and me.`, n => `Every time I walk into a room, ${n} walks out of it.`],
      'playing-everybody': [n => `${n} is playing every single person in this house.`, n => `${n} has a different story for everybody. I've heard three of them.`],
      'two-faced': [n => `${n} smiles at me in the kitchen and talks about me in the garden.`, n => `${n} is lovely to my face. I know what gets said behind my back.`, n => `${n} tells me one thing and tells the others the opposite.`],
    };
    const QUIET = [b => `${b} nods slowly, and says nothing.`, b => `${b} looks at the floor.`, b => `${b} laughs, once, without smiling.`, b => `${b} just stares back.`];
    if (first) steps.push(ssv('Housemates, the masks come off tonight. When I say your name, you will tell the house who you trust the least, and why. To their face.', { scene: place(house.slice(0, 8)) }));
    for (const c of seg.calls || []) {
      steps.push({ k: 'host', by: host, t: `${c.a}, who do you trust the least in this house?` }, { k: 'say', by: c.a, scene: place([c.a, c.b]), t: `${c.b}.` }, { k: 'host', by: host, t: 'Why?' },
        { k: 'say', by: c.a, t: R(WHY[c.why] || WHY['two-faced'], `w|${c.a}`)(c.b) });
      steps.push(c.back ? { k: 'say', by: c.b, t: R(['Say that again. Go on, say it again.', `Look who's talking, ${c.a}.`, "That's rich, coming from you."], `b|${c.a}`), tense: [c.a, c.b], shake: true }
        : { k: 'beat', t: R(QUIET, `q|${c.a}`)(c.b) });
    }
  } else if (th === 'fire') {
    who = [seg.who];
    sub = seg.who;
    steps.push({ k: 'beat', scene: place([seg.who]), t: 'In the living room, the Voice has lit a brazier. Next to it, a single card, face down.' },
      ssv(`${seg.who}, half of your kitty, ${euros(seg.stake)}, on one card. Red, and it is doubled. Black, and it is gone.`, { ask: { id, q: `Will ${seg.who} play?`, opts: ['Plays', 'Refuses'] } }),
      { k: 'say', by: seg.who, t: seg.plays ? R(["Let's do it.", 'Turn it over.'], 0) : R(["No. I'm not playing with fire.", 'I worked too hard for that money.'], 0), settle: { id, answer: seg.plays ? 'Plays' : 'Refuses', n: 2 } });
    if (seg.plays) steps.push({ k: 'beat', t: 'The card turns over, very slowly.' },
      seg.won ? ssv(`Red. ${seg.who}, you double it: ${euros(seg.stake)} more for your kitty.`, { toast: ['RED', '#ff3ea5'], confetti: true }) : ssv(`Black. ${seg.who}, ${euros(seg.stake)} is gone.`, { toast: ['BLACK', '#202028'], shake: true }),
      { k: 'say', by: seg.who, t: seg.won ? R(['YES! YES!', 'I knew it. I knew it was red.'], 1) : R(['No. No, no, no.', 'I knew I should have said no.'], 1) });
  } else if (th === 'back-in-time') {
    who = [seg.voter, seg.target];
    sub = `${seg.voter} and ${seg.target}`;
    if (first) steps.push({ k: 'host', by: host, t: 'In this house, the nominations are secret. Tonight, the house is going to see some of them.', scene: place(house.slice(0, 8)) });
    steps.push({ k: 'beat', scene: place(house.slice(0, 8)), toast: [`WEEK ${seg.week}`, '#19d3c5'], t: `On the big screen: week ${seg.week}, the confessional. ${seg.voter} sits down.` },
      { k: 'beat', t: `${seg.voter}, on the screen: "I nominate ${seg.target}."` },
      { k: 'say', by: seg.target, scene: place([seg.target, seg.voter]), t: R([`You nominated me? In week ${seg.week}?`, `Week ${seg.week}. You were sitting next to me that night.`], 0), tense: [seg.target, seg.voter] },
      { k: 'say', by: seg.voter, t: R(['That was a long time ago. Things changed.', "I didn't know you then. I swear.", 'I can explain. Not here.'], 1) });
  } else if (th === 'returns') {
    who = [seg.who, seg.target];
    sub = seg.who;
    steps.push({ k: 'beat', scene: place([seg.who, ...house.slice(0, 5)]), toast: ['THE RETURN', '#ff3ea5'], t: `The front door opens, and ${seg.who} walks back into the House of Secrets.` },
      { k: 'beat', t: R(['The house screams. Half of them run to the door.', 'For a second nobody moves. Then everybody does.'], 0) },
      ssv(`${seg.who}, before you leave again, one power: protect one housemate from next week's nominations, or nominate one directly.`, { ask: { id, q: `Who will ${seg.who} choose?`, people: true, opts: [seg.target, ...house.filter(n => n !== seg.target).slice(0, 3)] } }),
      { k: 'say', by: seg.who, t: seg.power === 'protect' ? `${seg.target}. You're safe next week.` : `${seg.target}. I haven't forgotten.`, settle: { id, answer: seg.target, n: 4 } },
      { k: 'say', by: seg.target, t: seg.power === 'protect' ? R([`${seg.who}! Thank you!`, 'I love you. I really do.'], 1) : R(['Of course. Of course you did.', `Goodbye, ${seg.who}.`], 1), ...(seg.power === 'punish' ? { tense: [seg.target, seg.who] } : {}) });
  } else if (th === 'temptations') {
    who = [seg.who];
    sub = seg.who;
    const OFFER = { nominated: `${euros(seg.amount)} for your kitty. The price: you are nominated directly next week.`, clue: `${euros(seg.amount)} for your kitty. The price: a clue about your own secret goes on the table tonight.`,
      friend: `${euros(seg.amount)} for your kitty. It comes straight out of ${seg.friend}'s.` };
    steps.push({ k: 'beat', scene: place([seg.who]), t: `${seg.who} is called into the dilemma room. On the table, a stack of money.` },
      ssv(`${seg.who}. ${OFFER[seg.offer]}`, { ask: { id, q: `Will ${seg.who} take it?`, opts: ['Takes it', 'Refuses'] } }),
      { k: 'say', by: seg.who, t: seg.takes ? R(["I'll take it.", 'Give it to me.'], 0) : R(['No. Not like that.', 'No. Put it away.'], 0), settle: { id, answer: seg.takes ? 'Takes it' : 'Refuses', n: 2 } });
    if (seg.takes && seg.offer === 'clue' && seg.clue) steps.push(ssv(`The clue goes on the table: ${seg.clue}.`, { toast: ['A CLUE', '#e0b84a'] }));
    if (seg.takes && seg.offer === 'friend') steps.push({ k: 'say', by: seg.friend, scene: place([seg.friend, seg.who]), t: R([`My money? You took MY money?`, `${seg.who}. Really?`], 1), tense: [seg.friend, seg.who] });
  } else if (th === 'gender-war') {
    const both = [...(seg.women || []), ...(seg.men || [])];
    who = both;
    if (seg.stage === 'game') {
      sub = 'the game';
      steps.push(ssv('Housemates, to the arena. Girls on the left, boys on the right.', { scene: place(both) }),
        { k: 'beat', t: 'Round one: the rope. Round two: the puzzle wall. Round three: the relay.' },
        { k: 'beat', t: R(['It is close all the way through. Nobody is laughing any more.', 'Every round goes down to the last second.'], 0) },
        { k: 'beat', t: `${seg.mvp} carries the last round almost alone.` });
    } else {
      const lose = seg.loser === 'm' ? 'boys' : 'girls', win = seg.loser === 'm' ? 'girls' : 'boys';
      sub = `the ${win} win`;
      steps.push(ssv(`The ${win} win. ${euros(1000)} each for the ${win}. And next week, only the ${lose} can be nominated.`, { scene: place(both), toast: [`THE ${win.toUpperCase()} WIN`, '#ff3ea5'], confetti: true }),
        { k: 'say', by: seg.mvp, t: R(['We did it! We did it!', 'Never doubt us. Never.'], 1) });
    }
  } else if (th === 'shields') {
    who = (seg.shields || []).map(s => s.to);
    if (seg.stage === 'found') {
      sub = 'five shields';
      steps.push(ssv('Housemates, five shields are hidden in the house. Two will protect you from next week\'s nominations. Three are fakes.', { scene: place(house.slice(0, 6)) }));
      const HID = ['behind the sofa', 'under a bed in the girls\' bedroom', 'in the bathroom cupboard', 'at the bottom of the pool', 'inside the oven', 'on top of the wardrobe'];
      (seg.shields || []).forEach((s, i) => steps.push({ k: 'beat', scene: place([s.to]), t: `${s.to} finds a shield ${HID[(i + (ctx.week || 0)) % HID.length]}.` }));
    } else {
      sub = 'the reveal';
      steps.push(ssv('The shields. Hold them up.', { scene: place(who) }));
      for (const s of seg.shields || []) steps.push(ssv(`${s.to}, your shield is ${s.real ? 'real. You are safe next week.' : 'a fake.'}`, s.real ? { toast: ['REAL', '#e0b84a'] } : {}),
        { k: 'say', by: s.to, t: s.real ? R(['YES!', 'Real! It is real!'], `y|${s.to}`) : R(['Of course it is.', 'I knew it. It was too light.'], `n|${s.to}`) });
    }
  } else if (th === 'safe') {
    who = seg.finders || [];
    if (seg.stage === 'digits') {
      sub = euros(seg.pot);
      steps.push(ssv(`Housemates, every kitty in this house has paid into the safe: ${euros(seg.pot)}. The code has three digits, hidden in the house.`, { scene: place(house.slice(0, 6)) }));
      const SPOT = ['written under a kitchen drawer', 'taped behind the bathroom mirror', 'scratched into the back of the clue room door'];
      (seg.finders || []).forEach((n, i) => steps.push({ k: 'beat', t: `${n} finds the ${['first', 'second', 'third'][i]} digit, ${SPOT[i]}.` }));
    } else {
      sub = seg.shares ? 'shared' : `${seg.opener} keeps it`;
      steps.push({ k: 'beat', scene: place(seg.finders || []), t: `${seg.opener} puts in the three digits. The safe clicks open.` },
        { k: 'say', by: seg.opener, t: seg.shares ? R(['We split it. Three ways. We all found it.', 'It is ours. All three of us.'], 0) : R(['Mine.', "I opened it. It's mine."], 0) });
      if (!seg.shares) { const o = (seg.finders || []).find(n => n !== seg.opener); if (o) steps.push({ k: 'say', by: o, t: R(['I gave you my digit!', 'Without my digit you had nothing!'], 1), tense: [o, seg.opener] }); }
    }
  } else if (th === 'crystal-ball') {
    who = [seg.who, seg.friend];
    if (seg.stage === 'up') {
      sub = seg.who;
      steps.push({ k: 'host', by: host, scene: place([seg.who]), t: `The public has voted. Going up to the crystal ball tonight is... ${seg.who}!` },
        { k: 'beat', t: `${seg.who} climbs the white stairs to the roof, and the glass door closes.` },
        { k: 'beat', t: 'Inside the crystal ball, the light goes pink, then blue. The house can only see a silhouette.' });
    } else {
      sub = seg.friend ? `${seg.friend} protected` : seg.who;
      steps.push({ k: 'beat', scene: place([seg.who]), t: `${seg.who} comes back down the stairs, very quiet.` },
        ssv(`${seg.who}, in the crystal ball you saw something${seg.seen ? " about one housemate's secret" : ''}. And you chose who is immune next week.`),
        ...(seg.friend ? [{ k: 'say', by: seg.who, t: `${seg.friend}.` }, { k: 'say', by: seg.friend, t: R(['Me? Thank you!', 'I owe you, really.'], 0) }] : []));
    }
  } else if (th === 'jungle') {
    who = [seg.who];
    sub = seg.who;
    const OUT = { money: () => ssv(`${euros(2000)} for your kitty.`), immunity: () => ssv('Immunity. Next week, nobody can nominate you.', { toast: ['IMMUNE', '#e0b84a'] }),
      nominated: () => ssv('You are nominated directly next week.', { toast: ['NOMINATED', '#ff3355'] }), clue: c => ssv(`A clue about your own secret goes on the table: ${c}.`, { toast: ['A CLUE', '#e0b84a'] }),
      nothing: () => ssv('Nothing. Just more jungle.') };
    steps.push({ k: 'beat', scene: place([seg.who]), t: `${seg.who} walks into the jungle, alone.` });
    (seg.path || []).forEach((p, i) => steps.push({ k: 'beat', t: `At the ${i ? 'second' : 'first'} fork, ${seg.who} stops, then goes ${p.way}.` }, (OUT[p.out] || OUT.nothing)(p.clue)));
    const end = (seg.path || []).at(-1)?.out;
    steps.push({ k: 'say', by: seg.who, t: end === 'immunity' || end === 'money' ? R(['Best walk of my life.', `I am going ${(seg.path || []).at(-1)?.way || 'left'} forever now.`], 0) : end === 'nominated' || end === 'clue' ? R(['I hate this jungle.', 'Should have gone the other way.'], 0) : R(['That was a lot of jungle for nothing.', 'Okay. Okay.'], 0) });
  } else if (th === 'hearts') {
    who = [seg.a, seg.b];
    if (seg.date) {
      sub = `${seg.a} and ${seg.b}`;
      steps.push({ k: 'beat', scene: at('yard', 'patio', 'The Garden', [seg.a, seg.b]), toast: ['A BLIND DATE', '#ff8fb1'], t: `The Voice sends ${seg.a} and ${seg.b} on a blind date in the garden, by candlelight.` },
        { k: 'beat', t: seg.sparks ? 'They talk for an hour. When they come back in, they are holding hands.' : 'It is the longest hour of their lives. Neither of them finishes the dessert.' },
        { k: 'say', by: seg.a, t: seg.sparks ? R(['I did not expect that. At all.', 'Can we do that again?'], 'd') : R(['Well. We tried.', 'Never again. With respect.'], 'd') });
    } else {
      sub = `${seg.a} and ${seg.b}`;
      steps.push({ k: 'beat', scene: at('ceremony', 'living-sofas', 'Living Room', [seg.a, seg.b, ...house.slice(0, 4)]), t: `${seg.a} and ${seg.b} are called to the sofa in front of the screen.` },
        ssv(`${seg.a}, ${euros(5000)} for your kitty, if you spend the week apart from ${seg.b}: separate rooms, no time alone. Or refuse, and the Love Room is yours tonight.`, { ask: { id, q: `What will ${seg.a} choose?`, opts: ['The money', `${seg.b}`] } }),
        { k: 'say', by: seg.a, t: seg.takes ? R(["I'll take the money. It's only a week.", 'The money. I am sorry.'], 0) : R([`${seg.b}. Obviously.`, 'Keep the money.'], 0), settle: { id, answer: seg.takes ? 'The money' : `${seg.b}`, n: 2 } });
      if (seg.takes) steps.push({ k: 'say', by: seg.b, t: R(['A week. For money.', `Wow. Okay, ${seg.a}.`], 1), tense: [seg.a, seg.b] });
      else steps.push({ k: 'beat', scene: place([seg.a, seg.b]), kiss: [seg.a, seg.b], bed: 'ss-love', t: `The red door opens on candlelight. ${seg.a} and ${seg.b} have the Love Room for the night.` });
    }
  }
  // the night opens with its rules, and closes with the host
  // (the prime's opening has already said what the night is: steps.js ssPrimeOpenScreen)
  if (first) steps.unshift({ k: 'host', by: host, t: R([`${NIGHT_THEMES[th]}. Let's begin.`, `Time for ${NIGHT_THEMES[th]}.`], 'go'), toast: [String(NIGHT_THEMES[th] || '').toUpperCase(), '#ff3ea5'] });
  else if (!first) steps.unshift({ k: 'host', by: host, t: R(NIGHT_NOTES[th] || ['Back to the night.'], 'n') });
  if (last) steps.push({ k: 'host', by: host, scene: { set: 'studio-wide', plate: 'ss-studio-crowd', room: 'The Prime Studio', cam: 1, kicker: 'Live · The Prime Studio', cast: [] }, t: R(['What a night in that house.', 'And that is how the house will remember tonight.', 'The house will be talking about that until the next prime.'], 'end') });
  const s0 = steps.find(s => s.scene)?.scene || place(who);
  return { id: `bb-ss-prime-night-${th}-${seg.part}-w${ctx.week}`, ...s0, sceneful: true, title: NIGHT_THEMES[th] || 'Tonight', label: SHORT[th] || 'Tonight', sub, steps };
}
