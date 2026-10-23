// ══════════════════════════════════════════════════════════════════════
// pm/talk/ceremony.js — getting ready for a dumping or a recoupling, and
// the plea at the fire pit (pm/moments.js)
// ══════════════════════════════════════════════════════════════════════
//
// Rewritten 2026-10-22 (the user: "redo the 11%"). The texts that announce a
// night stay where they are (pm/lines/firepit.js): each says exactly how
// that night's format works. These are the islanders, waiting for it.
//   dump-nerves      [a, b]  a couple getting ready. `why`: rocky (they rowed) ·
//                            uneven (one feels more) · solid · unsure. `channel`: who votes.
//   recouple-nerves  [a, b]  a, with friend b, before a recoupling. {pa} is a's partner (taken).
//                            `why`: stolen (a's partner was taken) · new (a just arrived) ·
//                            single · eyes-elsewhere (pa's eyes are) · unsure · solid
//   dump-plea        [a, (b)] the at-risk make their case. `of`: couple (a and b) · one (a alone)
// Nothing here says who is at risk before the host does.
import { build } from './build.js';

const T = { taken: true };

export const DUMP_NERVES = build('dump-nerves', {
  plans: { featured: ['ready', 'talk', 'more?', 'land?'], short: ['ready', 'talk'] },
  moves: {
    ready: [
      { stage: "The dressing room. {a} is doing {a.posAdj} hair very slowly, as if that will slow the night down.", turns: [['b', "Are you scared?"], ['a', "Terrified. You?"], ['b', "I can't even think about it. I've put the same earring in three times."]] },
      { stage: "{a} and {b} sit on the edge of the bed, dressed and ready, and neither of them gets up.", turns: [['a', "We should go down."], ['b', "In a minute. One more minute."]] },
      { stage: "On the terrace, {a} holds {b}'s hand a little too tight.", turns: [['b', "Breathe."], ['a', "I am breathing. I'm just breathing very fast."]] },
      { when: { why: 'rocky' }, stage: "{a} and {b} get ready on opposite sides of the room.", turns: [['a', "Are we going to talk about earlier before we go down?"], ['b', "Not now."]] },
      { when: { why: 'solid' }, stage: "{a} and {b} sit on the swing seat, holding hands, already dressed.", turns: [['b', "You're quiet."], ['a', "I'm just not ready for this to stop."]] },
      { when: { why: 'uneven' }, stage: "{a} straightens {b}'s collar, and takes longer about it than it needs.", turns: [['a', "There. Perfect. You look perfect."], ['b', "Thanks."]] },
    ],
    talk: [
      { when: { channel: ['public', 'villa', 'top-couple', 'save'] }, turns: [['a', "Do you think the public like us? Honestly?"], ['b', "I think they like you."], ['a', "That's not an answer. That's half an answer."], ['b', "It's the half I'm sure about."]] },
      { when: { why: 'rocky' }, turns: [['a', "If we go home tonight, I don't want that row to be the last thing we said to each other in here."], ['b', "Then we'll talk after. If there is an after."], ['a', "Don't say that."]] },
      { when: { why: 'rocky' }, turns: [['b', "We shouldn't have argued today. Of all days."], ['a', "Everyone argues."], ['b', "Not everyone argues right before a vote."]] },
      { when: { why: 'uneven' }, turns: [['a', "If we go tonight, would you be upset?"], ['b', "Of course."], ['a', "About going, or about me?"], ['b', "Both. Can we not do this now?"]] },
      { when: { why: 'uneven' }, turns: [['a', "Whatever happens down there, I'm glad I'm standing next to you."], ['b', "Yeah. Me too."]] },
      { when: { why: 'solid' }, turns: [['a', "If they send us home, we go home together. That's all that matters."], ['b', "And carry on outside."], ['a', "And carry on outside. Same as in here, but with a kettle that works."]] },
      { when: { why: 'solid' }, turns: [['b', "It won't stop. Not for us. Even if it's tonight, it doesn't stop."], ['a', "Promise?"], ['b', "Promise."]] },
      { when: { why: 'unsure' }, turns: [['a', "Do you think we look like a real couple to them?"], ['b', "What's a real couple?"], ['a', "That's exactly what I mean. We don't know either."]] },
      { when: { why: 'unsure' }, turns: [['b', "We never really talk about what happens if we go."], ['a', "Do you want to?"], ['b', "Not really. I just noticed that we don't."]] },
      { turns: [['a', "I've got a bad feeling about tonight."], ['b', "You always have a bad feeling."], ['a', "And I'm always right. That's the problem."]] },
      { turns: [['a', "Whatever happens down there, I'm glad it was you."], ['b', "Don't talk like we're going. We're not going. We're not."]] },
    ],
    more: [
      { turns: [['b', "Right. Shoes on. Smile on. Let's go and find out."]] },
      { turns: [['a', "If it's us, I'm not crying at the fire pit. I'm crying in the car, like a normal person."], ['b', "You'll cry at the fire pit."], ['a', "I'll cry at the fire pit."]] },
      { turns: [['b', "Hold my hand the whole way down. Don't let go. Even if they say our names."]] },
    ],
    land: [
      { turns: [], beat: "Neither of them says anything else on the way down." },
      { when: { why: 'uneven' }, turns: [], beat: "{a} waits for more. It doesn't come." },
      { turns: [], beat: "They walk down to the fire pit with their fingers locked together." },
    ],
  },
});

export const RECOUPLE_NERVES = build('recouple-nerves', {
  plans: { featured: ['ready', 'talk', 'push?', 'land?'], short: ['talk'] },
  stages: [{ stage: "The dressing room, an hour before the recoupling. Nobody is actually getting ready.", turns: [] }],
  moves: {
    ready: [
      { when: { taken: false }, stage: "The dressing room. {a} has changed outfits three times.", turns: [['b', "You look amazing."], ['a', "I look single. That's what I look like. Single, in a nice top."]] },
      { when: T, stage: "{a} is sitting on the edge of the daybed, dressed and ready, and not moving.", turns: [['b', "Talk to me. What's going on?"]] },
      { when: { why: 'stolen' }, stage: "{a} is sitting on the end of the bed, not getting ready at all.", turns: [['b', "You need to get dressed."], ['a', "What for? I had someone. Now I'm the spare."]] },
      { when: { why: 'new' }, stage: "{a} keeps checking the mirror, and then checking it again.", turns: [['a', "I came in to meet people. What if nobody wants to keep me?"]] },
      { when: { why: 'eyes-elsewhere', ...T }, stage: "{a} is watching {pa} across the terrace and not even pretending otherwise.", turns: [['b', "Stop staring."], ['a', "I'm not staring. I'm checking."]] },
    ],
    talk: [
      { when: { taken: false }, turns: [['a', "What if nobody picks me? Actually, really, what if nobody picks me?"], ['b', "Somebody will."], ['a', "You don't know that."], ['b', "No. But I'd pick you, if it was me choosing."]] },
      { when: { why: 'stolen' }, turns: [['b', "You're not the spare. You're single. That's different."], ['a', "Is it?"], ['b', "It is if you walk down there like you want to be picked. Not like you're waiting to be put back on a shelf."]] },
      { when: { why: 'stolen' }, turns: [['a', "One minute I'm coupled up, the next everyone's being really nice to me."], ['b', "People like you."], ['a', "People feel sorry for me. It's not the same thing."], ['b', "Then give them a reason to pick you, not pity you."]] },
      { when: { why: 'new' }, turns: [['a', "They've all got history in here. I've got a couple of chats."], ['b', "Good chats, though."], ['a', "Is that enough?"], ['b', "It is if one of them was with the right person."]] },
      { when: { why: 'single' }, turns: [['a', "Be honest. Am I going home tonight?"], ['b', "I don't know. But I think you've got a better chance than you think."], ['a', "Why?"], ['b', "Because you've been yourself the whole time. People notice that."]] },
      { when: { why: 'single' }, turns: [['a', "I don't even get to choose tonight. I just stand there and wait to be picked, like it's school."], ['b', "Then stand there like you want it."], ['a', "I do want it."], ['b', "Then that's all you need to show them."]] },
      { when: { why: 'eyes-elsewhere', ...T }, turns: [['a', "Have you seen where {pa} keeps looking? Because I have. All day."], ['b', "Maybe you're reading into it."], ['a', "I'm not. I just don't know if I'm the one {pa} picks tonight."]] },
      { when: { why: 'unsure', ...T }, turns: [['a', "Everything's been fine with {pa}. Fine. But fine's not the same as sure, is it?"], ['b', "Has {pa} said anything?"], ['a', "Nothing bad. Nothing much at all. That's the bit that worries me."]] },
      { when: { why: 'unsure', ...T }, turns: [['a', "If {pa} doesn't pick me, I'm just going to smile. That's the plan."], ['b', "And then?"], ['a', "And then I'm going to cry in the bathroom."], ['b', "I'll come with you."]] },
      { when: { why: 'solid', ...T }, turns: [['b', "You're not nervous, are you?"], ['a', "About {pa}? No. About everyone else, a bit. Someone always gets hurt at these. I hate watching it."]] },
      { when: { why: 'solid', ...T }, turns: [['a', "I know {pa} will pick me. I know it. I'm still nervous."], ['b', "Good. It means it matters."], ['a', "It does matter. It matters a lot."]] },
      { when: T, turns: [['a', "I don't know if {pa} is going to pick me tonight."], ['b', "Have you asked?"], ['a', "You can't ask. That's the whole point. You just stand there and find out with everyone else."]] },
      { when: { nth: 'first', taken: false }, turns: [['a', "How does this even work? They pick, and then what?"], ['b', "Then whoever's left single finds out what happens to them."], ['a', "Don't say it like that."], ['b', "Sorry. You'll be fine."]] },
    ],
    push: [
      { when: { why: 'eyes-elsewhere', ...T }, turns: [['b', "Then ask."], ['a', "And hear the answer before the fire pit? No. I'd rather find out with everyone watching. At least then I have to keep it together."]] },
      { when: { why: 'stolen' }, turns: [['a', "Everyone's being careful round me. Like I'm already gone."], ['b', "Well, you're not. So go down there and make them see it."]] },
      { turns: [['b', "Whatever happens, you come and find me after. Straight after. Promise."], ['a', "Promise."]] },
      { turns: [['a', "Do I look alright? Honestly?"], ['b', "You look like someone who should be picked first."]] },
    ],
    land: [
      { turns: [], beat: "Somebody shouts up the stairs that it's time, and the whole room goes quiet." },
      { turns: [], beat: "{b} squeezes {a}'s hand on the way out of the door." },
    ],
  },
});

export const DUMP_PLEA = build('dump-plea', {
  tiered: false,
  plans: { featured: ['plea', 'more?'], short: ['plea'] },
  moves: {
    plea: [
      { when: { of: 'couple' }, stage: "{a} and {b} stand at the front, holding hands.", turns: [['a', "We've come such a long way. Everyone here has watched us do it. Please, give us the chance to keep going."]] },
      { when: { of: 'couple' }, turns: [['b', "I know we're not the loudest couple in here. We don't cause drama. But what we've got is real."], ['a', "It really is."]] },
      { when: { of: 'couple' }, turns: [['b', "I came in here to find someone, and I found them. I found them on day one, and I've not looked anywhere else since. Please don't send us home yet."]] },
      { when: { of: 'one', taken: false }, turns: [['a', "I haven't found my person yet. I know that. I just need a bit more time, and I think they might be closer than everyone thinks."]] },
      { when: { of: 'one', taken: false }, turns: [['a', "I know I'm single, and I know how that looks. But I haven't stopped trying, not for one day."]] },
      { when: { of: 'one', ...T }, turns: [['a', "{pa} and I are only just getting started. Please don't make that the end of it."]] },
      { when: { of: 'one', ...T }, stage: "{a} looks straight at {pa} on the bench.", turns: [['a', "I've got something real with {pa}. I want the chance to see where it goes. That's all I'm asking for."]] },
      { when: { of: 'one' }, stage: "{a} stands at the front, alone.", turns: [['a', "I've given this villa everything. Every day. I'd really, really love to stay."]] },
    ],
    more: [
      { when: { of: 'couple' }, turns: [['a', "Whatever you decide, I want to say I love every one of you."], ['b', "Mostly."]] },
      { turns: [['a', "Whatever you decide, thank you. I mean it. You've all been amazing."]] },
    ],
  },
});
