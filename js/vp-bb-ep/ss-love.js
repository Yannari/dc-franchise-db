// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/ss-love.js — love in the House of Secrets, on screen
// ══════════════════════════════════════════════════════════════════════
//
// What js/ss/love.js decided for a couple this week: the night in the Love Room (the room with the heart-shaped bed:
// the 'hoh-suite' plate is the House of Secrets' Love Room), the pillow talk about the secret, the confession, the
// doubt somebody planted, the row and the making up, the future, the third who flirts, the plot to put the couple in
// the airlock. A scene of house life with its own name in the episode list. Words only: the engine did the rest.

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickBy = (arr, key) => arr[hash(key) % arr.length];
const spread = a => a.map((n, i) => [n, a.length === 1 ? 50 : Math.round(14 + (72 * i) / (a.length - 1))]);
const SC = (set, plate, room, who, cam = 4) => ({ set, plate, room, cam, kicker: `Cam ${String(cam).padStart(2, '0')} · ${room}`, cast: spread(who.filter(Boolean)) });
const DR = n => SC('dr', 'confessional-close', 'Confessional', [n], 1);
const LOVE = who => SC('hoh', 'hoh-suite', 'The Love Room', who, 14);
const BED = who => SC('bedroom', 'bedroom-beds', 'Bedroom', who, 8);
const KIT = who => SC('kitchen', 'kitchen-wide', 'Kitchen', who, 3);
const LIV = who => SC('ceremony', 'living-sofas', 'Living Room', who, 4);
const GARDEN = who => SC('yard', 'patio', 'The Garden', who, 6);
const POOL = who => SC('yard', 'pool-loungers', 'The Pool', who, 5);

/**
 * @param {any} act an 'ss-love' act
 * @param {any} ctx the week's context
 * @param {{ ssv: Function }} H
 */
export function ssLoveScreen(act, ctx, H) {
  const { ssv } = H;
  const { a, b, c } = act;
  if (!a || !b) return null;
  const k = `${ctx.week}|love|${a}|${b}|${act.kind}`;
  const R = (pool, s) => pickBy(pool, `${k}|${s}`);
  const house = (ctx.house || []).filter(n => n !== a && n !== b && n !== c);
  const teaser = house.length ? house[hash(`${k}|t`) % house.length] : null;
  /** @type {any[]} */ let steps = [];
  let title = 'Love in the House', label = 'Love Story';
  if (act.kind === 'loveroom') {
    title = 'The Love Room'; label = 'The Love Room';
    steps = [
      ssv('Housemates, please gather in the living room.', { scene: LIV([a, b, ...house.slice(0, 4)]) }),
      ssv(`Tonight, the Voice has a gift for two of you. ${a}, ${b}: the Love Room is open, and it is yours until morning.`, { toast: ['THE LOVE ROOM', '#ff5fa2'] }),
      { k: 'beat', t: R(['The living room screams. Somebody throws a cushion at them.', `${a} hides behind both hands. ${b} cannot stop laughing.`, 'Half the house cheers. The other half exchanges a look.'], 'r0') },
      ...(teaser ? [{ k: 'say', by: teaser, t: R(['Behave yourselves! The cameras are everywhere!', 'Do not come back down before lunch.', "Well, that's the two of you sorted, then."], 'r1') }] : []),
      ...(act.jealous ? [{ k: 'dr', by: act.jealous, t: R([`I'm happy for them. I am. I just didn't need to watch the door close.`, `Of course it's them. Of course it is.`, `I'm fine. I'll be fine by tomorrow.`], 'j0') }] : []),
      { k: 'beat', scene: LOVE([a, b]), t: R(['Up the stairs, and through the red door. Candles everywhere, rose petals on the heart-shaped bed, champagne in a bucket.', 'The red door opens on candlelight: a heart-shaped bed, petals on the sheets, two glasses waiting.'], 'r2') },
      // (each question with its own answer: a reply picked apart from its question did not answer it)
      ...R([['Is this real? This is actually real.', "It's real. Come and sit next to me."], ['Okay. Nobody told me there would be petals.', 'Pour the champagne before I say something stupid.'],
        ["I don't know where to sit.", "Next to me. That's where you sit."]], 'r3').map((t, j) => ({ k: 'say', by: j ? a : b, t })),
      { k: 'beat', t: 'For the first time since they met, there is nobody else in the room. Only the camera in the ceiling.' },
      ...R([['When did you know? About us, I mean.', "The second week. You laughed at one of my jokes that wasn't funny."], ['Do you think about what happens when this is over?', 'Every night. I lie awake thinking about it.'],
        ['Did you plan any of this?', 'No. None of it. I came here to play, and then there was you.']], 'r5').map((t, j) => ({ k: 'say', by: j ? a : b, t })),
      ...R([["I'm scared of what the others will do to us now.", 'Let them try. Tonight is ours.'], ["I don't want this to be just a game thing.", "It isn't. You know it isn't."],
        ['I keep forgetting there are cameras.', 'Good. Forget them. Just for tonight.']], 'r7').map((t, j) => ({ k: 'say', by: j ? a : b, t })),
      { k: 'beat', t: R(['A long kiss, and the candles burn down.', 'They talk until three in the morning, and fall asleep mid-sentence.', 'They laugh until they cry, and the camera finally looks away.'], 'r9') },
      { k: 'dr', by: a, t: R([`That night with ${b} is the best thing that has happened to me in here. Maybe anywhere.`, `I didn't think I could feel like this on TV.`, `Whatever happens now, I had that night.`], 'r10') },
      { k: 'dr', by: b, t: R([`I'm falling for ${a}. There. The whole country can know.`, `I've never felt that safe in this house.`, `It was perfect. Too perfect. That scares me a little.`], 'r11') },
      { k: 'beat', scene: KIT([a, b, ...house.slice(0, 3)]), t: `The next morning, ${a} and ${b} come down the stairs holding hands. The kitchen goes very quiet, then very loud.` },
      ...(teaser ? R([['Good morning, lovebirds! Sleep well?', 'Very well, thank you. Not that it is any of your business.'], ['Look who decided to join us!', 'Coffee. Please. Nobody talk to me.'],
        ['We heard nothing. Nothing at all.', 'Not a word. Not one word from any of you.']], 'r12').map((t, j) => ({ k: 'say', by: j ? b : teaser, t })) : []),
    ];
    for (const w of (act.wary || []).slice(0, 1)) steps.push({ k: 'dr', by: w, t: R([`A night in the Love Room, and now they vote as one. That's a problem for the rest of us.`, `Lovely for them. Terrible for me. That's two votes I'll never get.`], `w|${w}`) });
  } else if (act.kind === 'pillow') {
    title = 'Pillow Talk';
    const h = act.holder, q = act.asker;
    steps = [
      { k: 'beat', scene: BED([a, b]), t: `Lights out. ${a} and ${b} whisper under the covers, away from everybody.`, tense: [a, b] },
      { k: 'say', by: q, t: R([`Can I ask you something? Tell me your secret. Just me.`, `You know I'd never tell anybody. What's your secret?`, `I tell you everything. Why can't you tell me that?`], 'p0') },
      { k: 'say', by: h, t: R(["You know I can't. The Voice would take everything.", "Don't. Please don't ask me that.", 'If I tell you, we both lose.'], 'p1') },
      { k: 'say', by: q, t: R(['Not even a hint?', "I'd never buzz you. You know that.", 'So you don\'t trust me.'], 'p2') },
    ];
    if (act.hinted) steps.push({ k: 'say', by: h, t: R(["Okay. One thing. It's about something that happened before I came here. That's all.", 'Let me put it like this. You would never guess it by looking at me.', "Think about what I never talk about. That's all you get."], 'p3') },
      { k: 'beat', t: `${q} goes quiet, and does not ask again.` },
      { k: 'dr', by: q, t: R([`I know more about ${h}'s secret now than anybody in this house. I'm not going to use it. Probably.`, `${h} gave me a hint. In bed. I love ${h}. I'm also not stupid.`], 'p4') },
      { k: 'dr', by: h, t: R(['Why did I say that? I should never have said that.', `I trust ${q}. I have to. I just told ${q} half of it.`], 'p5') });
    else steps.push({ k: 'say', by: h, t: R(['I trust you. I just love you more than I need to tell you.', "It's not about trust. It's the one thing in here that's mine.", 'Ask me again the day we walk out of here.'], 'p3') },
      { k: 'beat', t: `${q} turns over, facing the wall.` },
      { k: 'dr', by: q, t: R([`It hurt a bit. I told ${h} everything about me.`, `I get it. I do. It still stings.`], 'p4') },
      { k: 'dr', by: h, t: R(['Love or no love, nobody gets my secret.', 'It nearly came out. I bit my tongue. Literally.'], 'p5') });
  } else if (act.kind === 'confession') {
    title = 'The Confession';
    steps = [
      { k: 'beat', scene: POOL([a, b]), t: `By the pool, late, ${a} and ${b} are the last two still up.` },
      { k: 'say', by: a, t: R([`Can I tell you something, ${b}? I like you. Not as a friend.`, `I've been trying not to say this for days. I really like you, ${b}.`, `I think about you all the time, ${b}. There. I said it.`], 'c0') },
      { k: 'beat', t: `${b} does not answer straight away.` },
    ];
    if (act.yes) steps.push({ k: 'say', by: b, t: R(['Took you long enough. Me too.', 'I was hoping you would say that. I was too scared to.', 'Me too. Since the first night.'], 'c1') },
      { k: 'beat', t: R(['A first kiss, quick, and then a long one.', `${b} leans in, and that is the answer.`], 'c2') },
      { k: 'dr', by: a, t: R(['I said it, and they said it back. I am shaking.', 'I came here to keep a secret. Now I have another one.'], 'c3') },
      { k: 'dr', by: b, t: R([`I didn't come here for love. Then ${a} happened.`, 'I am in so much trouble. The good kind.'], 'c4') });
    else steps.push({ k: 'say', by: b, t: R(["I like you too. I just don't know if I can do this in here. Not yet.", "You're amazing. I need a bit of time. Is that okay?", "Not yet. Give me some time. Please don't take it badly."], 'c1') },
      { k: 'say', by: a, t: R(['Okay. Okay. Forget I said anything.', 'Take all the time you need. I meant it, that is all.'], 'c2') },
      { k: 'dr', by: a, t: R(['That was the most embarrassing minute of my life.', '"Not yet." Not no. I can live with not yet.'], 'c3') });
  } else if (act.kind === 'doubt') {
    title = 'A Seed of Doubt';
    steps = [
      { k: 'beat', scene: GARDEN([c, a]), t: `${c} finds ${a} alone in the garden.` },
      { k: 'say', by: c, t: R([`Can I be honest with you? I don't think ${b} is in this for you. I think ${b} is in it for the game.`, `Have you noticed ${b} only gets close to you before the nominations?`, `Everybody's saying it, so I will. ${b} is using you.`], 'd0') },
      { k: 'say', by: a, t: R(['Why would you say that?', "You don't know anything about us.", 'What makes you think that?'], 'd1') },
      { k: 'say', by: c, t: R([`I've watched ${b}. I'm just looking out for you.`, `Watch ${b} at the next nominations. You'll see.`], 'd2') },
    ];
    if (act.shaken) steps.push({ k: 'dr', by: a, t: R([`I hate that ${c} got into my head. But what if it's true?`, `I didn't believe it. Then I started counting the times ${b} disappeared.`], 'd3') },
      { k: 'beat', scene: BED([a, b]), t: `That night, ${a} stays on the far edge of the bed. ${b} notices.` },
      { k: 'say', by: b, t: R(['Are you okay? You have been weird all evening.', 'What did I do?'], 'd4') },
      { k: 'say', by: a, t: R(["Nothing. I'm tired.", 'Nothing. Forget it.'], 'd5') },
      { k: 'dr', by: c, t: R(['A couple is two votes. Make it one doubt, and it is two people again.', "I planted something. Now I wait."], 'd6') });
    else steps.push({ k: 'say', by: a, t: R([`I know who ${b} is. Nice try, ${c}.`, `If you want to split us up, you'll need more than that.`], 'd3') },
      { k: 'dr', by: a, t: R([`${c} wants us split. I'm telling ${b} everything ${c} just said.`, `That was the worst try I've ever seen.`], 'd4') },
      { k: 'dr', by: c, t: R(["That didn't work. Fine. Plan B.", 'They are tighter than I thought. Noted.'], 'd5') });
  } else if (act.kind === 'fight') {
    title = 'A Lovers\' Row';
    const WHY = {
      nominations: [[`You didn't defend me at the nominations. Not one word.`, 'Because I can\'t be seen protecting you! Everybody would come for us.']],
      attention: [[`You spent the whole evening with ${teaser || 'the others'}. I may as well not exist.`, "I'm allowed to talk to people. I'm not yours."]],
      secret: [["You still won't tell me anything about your secret. How am I supposed to trust you?", "That's got nothing to do with us and you know it."]],
      kitty: [["You'd sell me out for the money. I see it in your face every time the kitties come up.", "That's not fair. That's really not fair."]],
    }[act.why] || [['We need to talk.', 'Not now.']];
    const [x, y] = WHY[0];
    steps = [
      { k: 'beat', scene: KIT([a, b]), t: `In the kitchen, ${a} and ${b} are arguing in whispers, then not in whispers.`, tense: [a, b] },
      { k: 'say', by: a, push: true, t: x }, { k: 'say', by: b, push: true, t: y },
      { k: 'say', by: a, t: R(["Then what am I to you? Seriously.", 'Do you even want this?', "I'm not doing this in front of everybody."], 'f0') },
      { k: 'beat', t: R([`${b} walks out to the garden. ${a} does not follow.`, `${a} slams a cupboard and leaves.`], 'f1') },
    ];
    if (act.made) steps.push({ k: 'beat', scene: GARDEN([a, b]), t: `An hour later, ${a} sits down next to ${b} by the pool.` },
      { k: 'say', by: a, t: R(["I'm sorry. This place gets to me.", "I don't want to fight with you. You're the only person I've got in here."], 'f2') },
      { k: 'say', by: b, t: R(["I'm sorry too. Come here.", 'Me neither. Come here, you idiot.'], 'f3') },
      { k: 'dr', by: b, t: R(['We fight like a real couple. I suppose that means we are one.', 'Five minutes of war, and then nothing matters but us.'], 'f4') });
    else steps.push({ k: 'dr', by: a, t: R(["I don't know if we come back from that one.", 'Maybe the others were right about us.'], 'f2') },
      { k: 'dr', by: b, t: R(["We're not talking. In a house this small, that's an achievement.", "I'm not apologising first. Not this time."], 'f3') });
  } else if (act.kind === 'future') {
    title = 'After the House';
    steps = [
      { k: 'beat', scene: GARDEN([a, b]), t: `${a} and ${b} lie on the grass, looking up at the stars over the house.` },
      { k: 'say', by: b, t: R(["What happens when we get out? Honestly.", 'Do you think we work, out there?', 'Where do we go first, when this is over?'], 'u0') },
      { k: 'say', by: a, t: R(["You meet my family. My mum is going to love you. Or interrogate you. Probably both.", 'We go somewhere with no cameras and sleep for a week.', "I don't know. I just know I want you there."], 'u1') },
      { k: 'say', by: b, t: R(["I'm scared it's only real in here.", 'Promise me we try. Properly.', "My friends are going to have so many questions."], 'u2') },
      { k: 'say', by: a, t: R(['It is real. I promise you.', 'We try. I promise.', "Let them ask. I'll answer every single one."], 'u3') },
      { k: 'dr', by: a, t: R([`For the first time in here, I'm not thinking about the game. I'm thinking about after.`, `${b} is the one thing I'm taking home from this house.`], 'u4') },
    ];
  } else if (act.kind === 'third') {
    title = 'The Third';
    steps = [
      { k: 'beat', scene: LIV([c, a]), t: `${c} sits down very close to ${a} on the sofa, and laughs at everything ${a} says.` },
      { k: 'say', by: c, t: R([`You know you're the best-looking person in here, ${a}.`, `If you weren't taken, ${a}... I'm just saying.`, `Come for a swim with me later, ${a}.`], 't0') },
      { k: 'beat', scene: LIV([c, a, b]), t: `${b} walks in and sees it.`, tense: [b, c] },
      { k: 'say', by: b, push: true, t: R([`Comfortable, ${c}?`, `Sorry, am I interrupting something?`, `${c}, can I have my seat back?`], 't1') },
    ];
    if (act.shut) steps.push({ k: 'say', by: a, t: R([`You're not interrupting anything. Sit down, ${b}.`, `${c}, I'm with ${b}. You know that.`], 't2') },
      { k: 'beat', t: `${c} gets up and leaves the room.` },
      { k: 'dr', by: b, t: R([`${a} shut that down in two seconds. That's why I'm with ${a}.`, `I wasn't worried. Okay, I was a bit worried.`], 't3') });
    else steps.push({ k: 'say', by: a, t: R(["Relax. We were just talking.", "It's nothing. Don't make it a thing."], 't2') },
      { k: 'beat', t: `${b} turns around and goes upstairs without a word.` },
      { k: 'dr', by: b, t: R([`"Just talking." I've seen how ${c} looks at ${a}. And how ${a} looks back.`, `I'm not jealous. I'm just never speaking to ${c} again.`], 't3') },
      { k: 'dr', by: c, t: R(["I didn't do anything. If they're that fragile, that's not my fault.", 'A little competition never hurt anybody.'], 't4') });
  } else if (act.kind === 'plot') {
    title = 'The Plot';
    const d = act.d;
    steps = [
      { k: 'beat', scene: SC('bathroom', 'bathroom', 'Bathroom', [c, d], 9), t: `${c} and ${d}, in the bathroom, with the taps running.`, tense: [c, d] },
      { k: 'say', by: c, t: R([`We have to do something about ${a} and ${b}. Two votes, every single week.`, `If ${a} and ${b} reach the final together, we're finished.`, `As long as ${a} and ${b} are together, nobody else has a chance.`], 'x0') },
      { k: 'say', by: d, t: R(["So we split them. We put one of them in the airlock.", 'Then we nominate them. Both, if we can.', "Agreed. But we do it quietly."], 'x1') },
      { k: 'say', by: c, t: R([`${a} first. ${b} falls apart without ${a}.`, `${b}. The public loves ${a}, they'd never vote ${a} out.`, 'Both names. Let the public choose which heart to break.'], 'x2') },
      { k: 'say', by: d, t: R(['And not a word to anybody.', "Deal. Nobody hears this from me."], 'x3') },
      { k: 'dr', by: c, t: R(["It's not personal. A couple is a team, and teams win this game.", "I like them both. I like a hundred thousand dollars more."], 'x4') },
      { k: 'beat', scene: LIV([a, b]), t: `On the sofa, ${a} and ${b} are laughing about something, with no idea.` },
      { k: 'dr', by: a, t: R(['Everybody keeps saying couples get targeted. Let them try.', "We've been careful. I think we've been careful."], 'x5') },
    ];
  }
  if (!steps.length) return null;
  return { id: `bb-ss-love-${act.kind}-${a}-w${ctx.week}`, kind: 'twist', anchor: ctx.anchor, day: ctx.day, time: act.kind === 'loveroom' ? '22:30' : '21:00',
    set: steps[0].scene?.set || 'ceremony', plate: steps[0].scene?.plate, room: steps[0].scene?.room || 'Living Room', cam: steps[0].scene?.cam || 4, kicker: steps[0].scene?.kicker || '',
    title, label, sub: [a, b].join(' and '), cast: steps[0].scene?.cast || spread([a, b]), sceneful: true, steps };
}
