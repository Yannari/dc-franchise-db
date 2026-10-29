// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-couples.js — a real tie kept hidden, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/couples.js decided for one tie this week: the stolen moment (and who nearly saw it), the jealousy, the
// slip; a family or two friends defending each other too fast, the old joke, the quiet care. A scene of house life:
// ss-episode.js folds it into the days ('duo'). Words only.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(12 + (76 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean)) });
const DR = n => SC('dr', 'confessional-close', 'Confessional', [n], 1);
const BATH = who => SC('bathroom', 'bathroom', 'Bathroom', who, 9);
const BED = who => SC('bedroom', 'bedroom-beds', 'Bedroom', who, 8);
const KIT = who => SC('kitchen', 'kitchen-wide', 'Kitchen', who, 3);
const LIV = who => SC('ceremony', 'living-sofas', 'Living Room', who, 4);
const GARDEN = who => SC('yard', 'patio', 'The Garden', who, 6);

/**
 * @param {any} act an 'ss-duo' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 */
export function ssDuoScreen(act, ctx, H) {
  void H;
  const { a, b } = act;
  if (!a || !b) return null;
  const k = `${ctx.week}|duo|${a}|${act.kind}`;
  /** @type {any[]} */ let steps = [];
  let title = 'A Hidden Tie';
  if (act.kind === 'stolen') {
    title = 'A Stolen Moment';
    const place = /bathroom/.test(act.where) ? BATH([a, b]) : /covers/.test(act.where) ? BED([a, b]) : GARDEN([a, b]);
    steps = [
      { k: 'beat', scene: place, t: `Late at night, in ${act.where}, ${a} and ${b} finally have a minute alone.`, tense: [a, b] },
      { k: 'say', by: b, t: pickBy(['I hate this. I hate pretending I don\'t know you.', 'Two minutes. That\'s all we get.'], `${k}|0`) },
      { k: 'say', by: a, t: pickBy(["I know. Not much longer.", 'Then make them count.'], `${k}|1`) },
      { k: 'beat', t: pickBy([`A kiss, quick, and they step apart.`, `${a} holds ${b}'s hand for ten seconds, then lets go.`], `${k}|2`) }];
    if (act.caughtBy) steps.push({ k: 'beat', t: `The door opens. ${act.caughtBy} stands there with a toothbrush, looks at the two of them, and says nothing.`, shake: true },
      { k: 'dr', by: act.caughtBy, scene: DR(act.caughtBy), t: pickBy([`${a} and ${b}. At night. Alone. Something is going on there, and I am going to find out what.`, `I didn't see anything. That's what I told them. I saw everything.`], `${k}|c`) });
    else steps.push({ k: 'dr', by: b, scene: DR(b), t: pickBy([`Nobody saw. This time.`, `Every one of those minutes is worth the risk. Don't tell the Voice I said that.`], `${k}|d`) });
  } else if (act.kind === 'jealous') {
    title = 'Jealousy';
    steps = [
      { k: 'beat', scene: LIV([act.flirt, act.target, act.jealous]), t: `${act.flirt} sits down very close to ${act.target} and laughs at everything ${act.target} says. Across the room, ${act.jealous} watches.` },
      { k: 'say', by: act.flirt, t: pickBy([`${act.target}, you're actually really funny, you know that?`, `So, ${act.target}, is anybody waiting for you at home?`], `${k}|0`) },
      { k: 'say', by: act.target, t: pickBy(['Nobody. Free as a bird.', "Ha. No. No, nobody."], `${k}|1`) },
      { k: 'dr', by: act.jealous, scene: DR(act.jealous), t: pickBy([`I can't say a word. I have to sit there and watch, and smile.`, `"Free as a bird." Great. Really great.`], `${k}|2`) },
      { k: 'beat', scene: BATH([act.jealous, act.target]), t: `Later, in the bathroom, with the taps on, ${act.jealous} finally says it.`, tense: [act.jealous, act.target] },
      { k: 'say', by: act.jealous, t: 'Did you have to enjoy it that much?' },
      { k: 'say', by: act.target, t: pickBy(["I was playing the game. You know I was.", "What was I supposed to do, tell them?"], `${k}|3`) },
      { k: 'beat', t: 'A long silence. Then a hug, and they leave the bathroom one at a time, two minutes apart.' }];
    if (act.showed) steps.push({ k: 'dr', by: (ctx.house || []).find(n => ![a, b, act.flirt].includes(n)) || act.flirt, scene: undefined,
      t: `Has nobody else noticed how ${act.jealous} looks at ${act.flirt} when ${act.flirt} is around ${act.target}? Because I have.` });
  } else if (act.kind === 'slip') {
    title = 'A Slip';
    steps = [
      { k: 'beat', scene: KIT([a, b, ...(act.heard || [])]), t: `Breakfast. ${b} passes ${a} the coffee.` },
      { k: 'say', by: a, t: `Thanks, ${act.word}.` },
      { k: 'beat', t: `Silence. ${(act.heard || []).join(' and ')} look${(act.heard || []).length === 1 ? 's' : ''} up.`, shake: true },
      { k: 'say', by: a, t: pickBy([`I call everybody that. Ask anybody.`, `What? It's a thing where I'm from. Everybody says it.`], `${k}|0`) }];
    if ((act.heard || [])[0]) steps.push({ k: 'dr', by: act.heard[0], scene: DR(act.heard[0]), t: pickBy([`"${act.word}"? Since when does ${a} call ${b} "${act.word}"?`, `Everybody calls everybody that? No. Nobody calls anybody that.`], `${k}|1`) });
  } else if (act.kind === 'defend') {
    title = 'Too Fast';
    steps = [
      { k: 'beat', scene: KIT([act.attacker, a, b]), t: `${act.attacker} has a go at ${a} about the washing up.` },
      { k: 'say', by: act.attacker, t: pickBy([`${a}, it's your turn. It's always your turn and it never happens.`, `Do you ever clean anything, ${a}?`], `${k}|0`) },
      { k: 'say', by: b, t: pickBy([`Leave ${a} alone. Seriously. Back off.`, `Oh, give it a rest. ${a} did it yesterday.`], `${k}|1`) },
      { k: 'beat', t: `Everybody looks at ${b}. That came out very fast.` },
      { k: 'dr', by: act.attacker, scene: DR(act.attacker), t: `Why does ${b} care so much about ${a}? They "met" two weeks ago.` }];
  } else if (act.kind === 'joke') {
    title = 'An Old Joke';
    steps = [
      { k: 'beat', scene: LIV([a, b, act.heard]), t: `${a} says one word, and ${b} bursts out laughing before anybody else gets it.` },
      { k: 'say', by: act.heard, t: 'What? What was funny about that?' },
      { k: 'say', by: b, t: 'Nothing. Nothing. It just... sounded funny.' },
      { k: 'dr', by: act.heard, scene: DR(act.heard), t: `That was an old joke. That was a joke from years ago. I know what that looks like.` }];
  } else {
    title = 'Looking After';
    steps = [
      { k: 'beat', scene: BED([a, b]), t: `${a} has a bad day and goes to bed early. Ten minutes later, ${b} is there with a cup of tea, and stays.` },
      { k: 'say', by: a, t: 'You shouldn\'t be in here. People will talk.' },
      { k: 'say', by: b, t: 'Let them. Drink your tea.' }];
  }
  const first = steps[0]?.scene || LIV([a, b]);
  return { id: `bb-ss-duo-${act.kind}-${a}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: '22:00', set: first.set, plate: first.plate, room: first.room, cam: first.cam,
    kicker: first.kicker, title, label: title, sub: `${a} and ${b}`, cast: first.cast, steps: steps.map(s => (s.scene === undefined ? (({ scene, ...r }) => (void scene, r))(s) : s)) };
}
