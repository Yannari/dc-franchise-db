// ══════════════════════════════════════════════════════════════════════
// pm/talk/kin.js — islanders who knew each other before (pm/kin.js)
// ══════════════════════════════════════════════════════════════════════
//
//   kin-heart    {a} and {b}, a moment that is only theirs. `of`: family · friends
//   kin-vet      {a} sizes up {b}, the partner of {c} ({a}'s relative or friend).
//                `of`: approve · doubt
//   kin-protect  {a} confronts {b}, {c}'s partner, seen with {about} today.
//                `of`: family · friends
//   ex-awkward   {a} and {b}, exes, in the same villa. `of`: spark · cold · together
//   ex-jealous   {a} watches {b}, {a.posAdj} ex, coupled with {c}
// Never a word for the relation the cast didn't give, and never a gendered
// one: "family", "my best friend", never "my sister".
import { build } from './build.js';

export const KIN_HEART = build('kin-heart', {
  plans: { featured: ['moment', 'deeper?', 'close?'], short: ['moment'] },
  moves: {
    moment: [
      { when: { of: 'family' }, stage: "{a} and {b} sit on the edge of the pool, feet in the water.", turns: [
        ['b', "Are you actually happy in here? Not for the cameras. Actually happy."],
        ['a', "I'm happier knowing you're here. I don't think I'd have lasted a week without you, honestly. Every time it gets too much, I look over and you're pulling a face at me, and it's fine again."],
        ['b', "I'm always pulling a face at you."],
        ['a', "I know. It's very reassuring."],
      ] },
      { when: { of: 'family' }, stage: "{a} brings {b} a cup of tea without being asked.", turns: [
        ['b', "How did you know I wanted one?"],
        ['a', "I've been making your tea my whole life. One sugar, too much milk, and you'll leave half of it."],
        ['b', "I don't leave half of it."],
        ['a', "You've never once finished a cup of tea."],
      ] },
      { when: { of: 'family' }, turns: [
        ['a', "Whatever happens in here, we go home together at the end of it. Promise me."],
        ['b', "Even if one of us gets dumped?"],
        ['a', "Then the other one walks out too."],
        ['b', "You'd walk out for me?"],
        ['a', "I'd think about it for a minute first. Then yes."],
      ] },
      { when: { of: 'family' }, stage: "{a} and {b} share a sunbed and one pair of sunglasses.", turns: [
        ['b', "Give them back."],
        ['a', "You've had them all morning."],
        ['b', "I had them for ten minutes, and then you nicked them, like you nick everything."],
        ['a', "Family property. It's shared."],
      ] },
      { when: { of: 'friends' }, stage: "{a} and {b} are the last two awake on the daybeds.", turns: [
        ['b', "Do you ever just look round and think, how did we end up here? Us two. In a villa. On {~telly}."],
        ['a', "Every single day. If you'd told us this a year ago, we'd have laughed you out of the room."],
        ['b', "We'd have laughed you out of the pub."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['a', "I'm so glad you're in here with me. Honestly. I don't know how people do this on their own."],
        ['b', "They make friends."],
        ['a', "I've made friends. But they're not you. Nobody in here knows the real me except you."],
        ['b', "That's because the real you is a nightmare."],
      ] },
      { when: { of: 'friends' }, stage: "{a} and {b} do their handshake, and it takes about a minute.", turns: [
        ['b', "Everyone thinks we're mad."],
        ['a', "Everyone's right. We'll still be doing this when we're eighty."],
        ['b', "With our new hips."],
      ] },
    ],
    deeper: [
      { turns: [
        ['b', "Can I say something soppy? I'm proud of you. The way you've been in here. You've been so much braver than you are at home."],
        ['a', "Stop it. You'll set me off."],
        ['b', "I mean it."],
      ] },
      { turns: [
        ['a', "Are you okay, though? Really? I know you put a brave face on, but I know your brave face, and that's not it."],
        ['b', "You always know."],
        ['a', "Of course I know. Talk to me."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} rests {b.posAdj} head on {a}'s shoulder, and neither of them says anything for a while." },
      { turns: [['a', "Love you, you know."], ['b', "Yeah, yeah. Love you too."]] },
    ],
  },
  notes: [
    { stage: "{a} and {b} have a quiet catch-up, just the two of them." },
  ],
});

export const KIN_VET = build('kin-vet', {
  plans: { featured: ['open', 'quiz', 'verdict'], short: ['quiz', 'verdict'] },
  moves: {
    open: [
      { stage: "{a} sits down next to {b} with two drinks.", turns: [
        ['a', "I think it's time you and I had a little chat about {c}."],
        ['b', "Am I in trouble?"],
        ['a', "That depends on the next ten minutes."],
      ] },
      { stage: "{a} pulls {b} aside on the terrace.", turns: [
        ['b', "This feels like meeting the parents."],
        ['a', "It's worse. I've known {c} longer than anyone in here, and I'm not letting just anyone near {c}."],
      ] },
    ],
    quiz: [
      { turns: [
        ['a', "So what are your intentions? With {c}. Be honest, because I'll know if you're not."],
        ['b', "Honestly? I really like {c}. I didn't expect to, I'll be honest, I came in here thinking I'd play it cool. And then {c} made me laugh on the first night and I haven't stopped thinking about it since."],
        ['a', "Hmm."],
      ] },
      { turns: [
        ['a', "What's {c}'s favourite thing to do on a Sunday?"],
        ['b', "I don't know. We're in a villa. Every day's a Sunday."],
        ['a', "Wrong answer. You've got a lot to learn."],
      ] },
      { turns: [
        ['a', "If {c} is having a bad day, what do you do?"],
        ['b', "Sit with {c}. Not try and fix it. Just be there. Bring snacks, if there are snacks."],
        ['a', "That's... actually the right answer."],
      ] },
    ],
    verdict: [
      { when: { of: 'approve' }, turns: [
        ['a', "Right. I've made my decision. You're all right. You're good for {c}, I can see it. But if you hurt {c}, you deal with me."],
        ['b', "Understood. Completely understood."],
      ], beat: "{b} looks genuinely relieved." },
      { when: { of: 'approve' }, turns: [
        ['a', "I'll be honest, I wasn't sure about you at first. But I've watched how you are with {c}, and I like it. Look after {c}."],
        ['b', "I will. I promise."],
      ] },
      { when: { of: 'doubt' }, turns: [
        ['a', "I'm going to be straight with you, because that's what {c} would want. I'm not convinced. I see you looking around. I see you chatting to people. And {c} deserves someone who doesn't."],
        ['b', "That's not fair."],
        ['a', "Prove me wrong, then."],
      ] },
      { when: { of: 'doubt' }, turns: [
        ['a', "I know {c}. I know when {c} is happy and I know when {c} is pretending. And right now, {c} is pretending. So I'd have a think about why that is."],
        ['b', "Has {c} said something?"],
        ['a', "{c} doesn't need to."],
      ] },
    ],
  },
  notes: [
    { when: { of: 'approve' }, stage: "{a} gives {b} the seal of approval over {c}." },
    { when: { of: 'doubt' }, stage: "{a} grills {b} about {c}, and isn't impressed." },
  ],
});

export const KIN_PROTECT = build('kin-protect', {
  plans: { featured: ['confront', 'answer', 'warning'], short: ['confront', 'warning'] },
  moves: {
    confront: [
      { stage: "{a} walks straight up to {b} by the pool.", turns: [
        ['a', "What were you doing with {about} earlier?"],
        ['b', "What? Nothing. It was a chat."],
        ['a', "It didn't look like a chat. And you're with {c}. Who I've known my whole life. So I'm going to ask you again."],
      ] },
      { stage: "{a} sits down next to {b}, not smiling.", turns: [
        ['a', "I saw you with {about}. Everyone saw you with {about}. And {c} is sitting over there pretending not to have noticed, because {c} is too nice to say anything. I'm not."],
        ['b', "I wasn't doing anything wrong."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "I'm allowed to talk to people. {c} knows I'm with {c}. I'm not going anywhere."],
        ['a', "Then act like it."],
      ] },
      { turns: [
        ['b', "Look, I get it. You're protective. But this is between me and {c}."],
        ['a', "Anything to do with {c} is to do with me. That's how it works."],
      ] },
    ],
    warning: [
      { when: { of: 'family' }, turns: [
        ['a', "I'm only going to say this once. That's my family. If you mess {c} around, you'll have me to deal with, and I don't care how it looks on {~telly}."],
        ['b', "Noted."],
      ] },
      { when: { of: 'friends' }, turns: [
        ['a', "That's my best friend. I've seen {c} get hurt before, and I'm not standing by while it happens again. So sort it out."],
        ['b', "Okay. Okay, I hear you."],
      ] },
    ],
  },
  notes: [
    { stage: "{a} has words with {b} about {about}, on {c}'s behalf." },
  ],
});

export const EX_AWKWARD = build('ex-awkward', {
  plans: { featured: ['moment', 'talk?', 'close?'], short: ['moment'] },
  moves: {
    moment: [
      { when: { of: 'cold' }, stage: "{a} and {b} end up next to each other in the kitchen. Nobody speaks.", turns: [
        ['b', "You're in my way."],
        ['a', "There's a whole kitchen."],
        ['b', "And you're in the middle of it. Like always."],
      ] },
      { when: { of: 'cold' }, stage: "{a} and {b} are left alone on the daybeds when everyone else gets up.", turns: [
        ['a', "Well, this is nice."],
        ['b', "Don't."],
        ['a', "I'm just saying. Of all the villas in all the world."],
      ] },
      { when: { of: 'spark' }, stage: "{a} catches {b} looking over by the pool.", turns: [
        ['a', "You're staring."],
        ['b', "I'm not staring. I'm remembering."],
        ['a', "Remembering what?"],
        ['b', "Why I liked you in the first place."],
      ] },
      { when: { of: 'spark' }, stage: "{a} and {b} end up laughing at the same joke, and then both stop.", turns: [
        ['b', "That was weird."],
        ['a', "What was?"],
        ['b', "That was exactly how it used to be."],
      ] },
      { when: { of: 'together' }, stage: "{a} and {b} sit together, the villa's most unexpected couple.", turns: [
        ['a', "Did you ever think we'd end up back here?"],
        ['b', "In a villa? Never. Back together? Maybe once or twice. At three in the morning."],
        ['a', "Only at three in the morning?"],
        ['b', "That's when I think about all my mistakes."],
      ] },
    ],
    talk: [
      { when: { of: 'cold' }, turns: [
        ['a', "Can we at least be civil? We've got to live with each other in here."],
        ['b', "I'm being civil. This is me being civil."],
        ['a', "This is you being civil?"],
      ] },
      { when: { of: 'spark' }, turns: [
        ['b', "Do you ever think about it? Us?"],
        ['a', "More than I'd like to admit."],
        ['b', "That's not a good thing, is it?"],
        ['a', "I don't know what it is."],
      ] },
      { when: { of: 'together' }, turns: [
        ['b', "We're different now, though. Aren't we? It's not like before."],
        ['a', "It's nothing like before. We've grown up. A bit."],
        ['b', "A bit."],
      ] },
    ],
    close: [
      { when: { of: 'cold' }, turns: [], beat: "They go back to opposite ends of the villa." },
      { when: { of: 'spark' }, turns: [], beat: "Across the garden, both their partners have noticed." },
      { when: { of: 'together' }, turns: [], beat: "{b} takes {a}'s hand, like it's the most normal thing in the world." },
    ],
  },
  notes: [
    { when: { of: 'cold' }, stage: "{a} and {b}, exes, keep a careful distance." },
    { when: { of: 'spark' }, stage: "{a} and {b} share a look that says it isn't over." },
    { when: { of: 'together' }, stage: "{a} and {b}, back together, look happier than ever." },
  ],
});

export const EX_JEALOUS = build('ex-jealous', {
  // What {a} feels about it is the beach hut's to say: in the scene, {a} only watches.
  plans: { featured: ['watch'], short: ['watch'] },
  moves: {
    watch: [
      { stage: "{a} watches {b} and {c} kissing on the swing seat.", turns: [], beat: "{a} looks away, then looks back, then looks away again." },
      { stage: "{a} sees {b} laughing with {c} by the pool.", turns: [], beat: "{a}'s smile goes very fixed." },
    ],
  },
  notes: [
    { stage: "{a} watches {b}, {a.posAdj} ex, with {c}, and it stings more than {a} expected." },
  ],
});
