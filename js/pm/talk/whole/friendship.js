// pm/talk/whole/friendship.js — two friends, {a} and {b}, one talk start to
// finish (pm/script.js talkScript `whole`). Season read 2026-10-30, the user:
// "why are they just switching subject like that — what's the correlation
// between him and Jess and whistling? The conversation makes no sense at all."
// Each talk is about one thing, and every line answers the one before it.
//   after/afterBy  what one of them did earlier, with {x}
//   taken / myRung {a}'s own couple ({pa}), and how far along it is
//   bTaken         {b}'s ({pb})
//   mood           how {a} is
//   friction       the two of them have fallen out (pm/events.js)
import { say } from './voice.js';

// (A fall-out sets `friction`; a talk not written for it never plays then: script.js WHOLE_MUST.)
const CALM = {};
const EARLY = ['coupled', 'cracking-on', 'open'];
const SERIOUS = ['closed-off', 'exclusive', 'official'];
const LOW = ['stressed', 'lonely', 'heartbroken'];

export const FRIENDSHIP_WHOLE = { moves: { whole: [
  // ── after a chat with somebody ──
  { when: { ...CALM, after: 'pull', afterBy: 'a' }, turns: [
    ['b', "So what was that chat with {x} about? Everyone saw you two."],
    say('a', "I don't really know yet. It was nice. {x.He} asked me loads of questions, and I actually enjoyed it.", {
      lad: "Honestly, {~bro}? It was good. Really good. {x.He}'s a lot more fun than I thought.",
      bestie: "Okay, I'll tell you everything. It was so nice. I didn't expect it to be that easy.",
      dry: "It was a chat. A good one. I'm not getting carried away.",
    }),
    ['b', "Nice as in a friend, or nice as in something else?"],
    say('a', "I don't know. That's the honest answer. Ask me tomorrow.", {
      nervy: "I don't know, and that's what's scaring me a bit.",
      flirty: "Something else. Maybe. I'll let you know.",
    }),
    ['b', "Just be careful with yourself. That's all I'm saying."],
  ] },
  { when: { ...CALM, after: 'pull', afterBy: 'a' }, stage: "{b} is waiting on the daybeds when {a} comes back.", turns: [
    ['b', "Well? How did it go with {x}?"],
    say('a', "It was fine. Just a chat. I don't think there's anything there.", {
      soft: "It was sweet. I just didn't feel anything, and I felt bad about that.",
      sharp: "It was fine. Nothing there. I'm not going to pretend there was.",
    }),
    ['b', "You don't look disappointed."],
    ['a', "I'm not. I'd rather know now than waste a week on it."],
    ['b', "Fair enough. At least you know."],
  ] },
  { when: { ...CALM, after: 'pull', afterBy: 'b' }, turns: [
    ['a', "I saw you go off with {x}. How was it?"],
    say('b', "Better than I expected, if I'm honest. I didn't think we'd have anything in common.", {
      lad: "Better than I thought, {~bro}. We had a laugh. I wasn't expecting that.",
      bestie: "Honestly? Really nice. I'm a bit annoyed about how nice it was.",
    }),
    ['a', "And do you like {x}?"],
    ['b', "I think I could. I'm not going to rush it."],
    ['a', "Good. You deserve someone who makes an effort."],
  ] },

  // ── after a date ──
  { when: { ...CALM, after: 'date', afterBy: 'a' }, turns: [
    ['b', "Right, tell me about the date with {x}. Everything."],
    say('a', "It was nice. Really nice. But I came back and I didn't feel any different. Is that bad?", {
      romantic: "It was lovely. And I kept waiting to feel something, and it never came. I hate that.",
      lad: "It was a good date, {~bro}. Good food, good chat. But I didn't feel it. You know when you don't feel it?",
    }),
    ['b', "It's not bad. It's honest."],
    ['a', "I just thought I'd come back sure, one way or the other."],
    ['b', "Sometimes not being sure is the answer."],
  ] },
  { when: { ...CALM, after: 'date', afterBy: 'a' }, stage: "{a} has barely sat down before {b} is next to {a.obj}.", turns: [
    ['b', "You're smiling. Why are you smiling?"],
    say('a', "Because it was a really good date. {x} made me laugh the whole time.", {
      big: "Because it was amazing! {x} made me laugh so much, I nearly choked on my food.",
      quiet: "It was a good date. {x} was easy to be around.",
      lad: "Because I've just had the best date of my life, {~bro}. I'm not even joking.",
    }),
    ['b', "So are you going to see where it goes?"],
    ['a', "I think so. I want to."],
    ['b', "Then I'm happy for you. Really."],
  ] },

  // ── after turning somebody down ──
  { when: { ...CALM, after: 'knocked-back', afterBy: 'a' }, turns: [
    ['b', "Did {x} really try and pull you earlier?"],
    say('a', "Yeah. Right in front of everyone. I said no, but it was so awkward.", {
      sharp: "Yeah. In front of everyone. I said no straight away.",
      soft: "Yeah. I said no, but I felt awful. I didn't want to embarrass {x.obj}.",
    }),
    ['b', "You did the right thing."],
    ['a', "I know I did. I still feel bad, though."],
    ['b', "That's because you're nice. {x.He}'ll be fine."],
  ] },
  { when: { ...CALM, after: 'knocked-back', afterBy: 'a', taken: true }, turns: [
    ['b', "How's {pa} taking it? The thing with {x}?"],
    ['a', "Better than I thought. I told {pa} straight away. I didn't want {pa.obj} hearing it from anyone else."],
    ['b', "That was the right thing to do."],
    say('a', "I just want {pa} to know I'm not going anywhere.", {
      romantic: "I want {pa} to know there's nobody else. There isn't.",
      lad: "I'm not going anywhere, {~bro}. {pa} is the one. Simple as that.",
    }),
  ] },

  // ── after hearing something ──
  { when: { ...CALM, after: 'told', afterBy: 'a' }, turns: [
    ['b', "How are you doing after what you heard earlier? Honestly."],
    say('a', "I'm all over the place. One minute I'm angry, the next I'm sad, and then I'm embarrassed that everyone knew before me.", {
      sharp: "Angry. Mostly angry. Everyone knew, and nobody said a word to me.",
      nervy: "Not great. I keep going over it in my head, and I can't make it stop.",
    }),
    ['b', "You've got nothing to be embarrassed about."],
    ['a', "It doesn't feel like that."],
    ['b', "I know. But I'm here, whatever you decide to do."],
  ] },

  // ── after a challenge kiss ──
  { when: { ...CALM, after: 'game-kiss', afterBy: 'a' }, turns: [
    ['b', "So. That kiss with {x} in the challenge."],
    say('a', "Don't. It was a game. It didn't mean anything.", {
      flirty: "What about it? It was a good kiss. That's all I'm saying.",
      nervy: "Please don't. I've been worrying about it ever since.",
    }),
    ['b', "Are you sure? Because you went a bit red."],
    ['a', "I went red because everyone was watching."],
    ['b', "Okay. If you say so."],
  ] },

  // ── {a}'s own couple, early days ──
  { when: { ...CALM, taken: true, myRung: EARLY }, turns: [
    ['b', "How's it going with {pa}? Honestly."],
    say('a', "Really well. I didn't expect to feel like this so soon. I'm not even looking at anyone else.", {
      lad: "Honestly, {~bro}? Really well. I'm not even looking anywhere else, and that's not like me.",
      bestie: "Honestly? So good. I think I really like {pa}. Like, really.",
      dry: "Good. Better than I expected. I'm trying not to say that too loudly.",
    }),
    ['b', "I can tell. You've been different this week."],
    ['a', "Different how?"],
    ['b', "Calmer. Happier."],
    ['a', "Yeah. I am."],
  ], beat: "{a} smiles, and {b} leaves it there." },
  { when: { ...CALM, taken: true, myRung: EARLY }, turns: [
    ['b', "Can I ask you something? Are you happy with {pa}?"],
    say('a', "I think so. I like {pa}. I just don't know if {pa.he} feels the same.", {
      nervy: "I think so. I just don't know if I'm more into it than {pa} is, and that scares me.",
      sharp: "Yes. I think. I don't know. Ask me something easier.",
    }),
    ['b', "Have you asked {pa}?"],
    ['a', "No. I'd be so embarrassed if the answer was wrong."],
    ['b', "You'd rather know, though, wouldn't you?"],
    ['a', "Yeah. I would."],
  ] },
  { when: { ...CALM, taken: true, myRung: EARLY }, stage: "{a} and {b} are lying on the sunbeds.", turns: [
    ['a', "Can I tell you something? I'm worried about me and {pa}."],
    ['b', "Why? What's happened?"],
    say('a', "Nothing's happened. That's the problem. It feels like we're just friends who share a bed.", {
      lad: "Nothing, {~bro}. That's the problem. We're more like friends than anything else.",
      romantic: "Nothing. And I want something to happen so badly. I want to feel it.",
    }),
    ['b', "Have you told {pa} that?"],
    ['a', "Not yet. I don't want to make it a big thing."],
    ['b', "It is a big thing, though. It's your couple."],
  ] },

  // ── {a}'s own couple, getting serious ──
  { when: { ...CALM, taken: true, myRung: SERIOUS }, turns: [
    ['b', "You and {pa} seem really solid at the moment."],
    say('a', "We are. I didn't think I'd find this in here. I really didn't.", {
      romantic: "We are. I think I'm falling in love with {pa}. I've never said that out loud before.",
      lad: "We are, {~bro}. I'm not going to lie. I'm really happy.",
      quiet: "We are. I don't talk about it much, but I'm really happy.",
    }),
    ['b', "I'm so happy for you. You deserve it."],
    ['a', "Thank you. That means a lot, coming from you."],
  ] },
  { when: { phase: 'evening', ...CALM, taken: true, myRung: SERIOUS }, stage: "{a} and {b} are sitting on the terrace as the sun goes down.", turns: [
    ['a', "Can I tell you something? I think I could see myself with {pa} on the outside."],
    ['b', "Really? That's big."],
    say('a', "I know. It's scary. But when I think about leaving here, I think about {pa} being there.", {
      nervy: "I know. I'm scared to say it in case it jinxes it.",
      dry: "I know. I don't say things like that. So I must mean it.",
    }),
    ['b', "Have you told {pa}?"],
    ['a', "Not yet. I want to get the moment right."],
  ] },

  // ── single ──
  { when: { ...CALM, taken: false }, turns: [
    ['b', "How are you finding being single in here?"],
    say('a', "Some days it's fine. Other days I watch everyone go off to bed together and I feel really lonely.", {
      lad: "Some days it's sound, {~bro}. Other days I'm lying there thinking, where's mine?",
      bestie: "Honestly? Some days I love it. And some nights I'd give anything for someone to cuddle.",
      quiet: "Lonely, sometimes. Mostly at night.",
    }),
    ['b', "Is there anyone you like?"],
    ['a', "Not really. Not yet. I'm waiting for someone to walk in and change everything."],
    ['b', "They will. You've just got to be here when they do."],
  ] },
  { when: { ...CALM, taken: false }, stage: "{a} and {b} are lying by the pool.", turns: [
    ['a', "Do you think it's me? That I'm still on my own?"],
    ['b', "No. Why would you think that?"],
    say('a', "Because everyone else has found someone. And I keep thinking, what's wrong with me?", {
      nervy: "Because everyone else has someone, and I can't stop wondering why it isn't me.",
      sharp: "Because everyone else has someone. It's hard not to take it personally.",
    }),
    ['b', "Nothing's wrong with you. The right person just isn't in here yet."],
    ['a', "I hope you're right."],
  ] },

  // ── {b}'s couple ──
  { when: { ...CALM, bTaken: true, taken: false }, turns: [
    ['a', "How are you and {pb}? Still good?"],
    say('b', "Still good. Really good, actually. {pb} makes me feel calm. I didn't know I needed that.", {
      lad: "Still good, {~bro}. {pb} gets me. That's all I wanted.",
      bestie: "So good. I'm obsessed. Don't tell {pb} I said that.",
    }),
    ['a', "I can see it. You both look really happy."],
    ['b', "We are. And it'll happen for you. I know it will."],
  ] },
  { when: { ...CALM, bTaken: true }, turns: [
    ['a', "Can I ask you something? Is {pb} treating you right?"],
    say('b', "Yeah. Why? Have you heard something?", { nervy: "Yeah. Why are you asking? Has somebody said something?" }),
    ['a', "No. I just want to make sure you're happy. You don't talk about it much."],
    ['b', "I'm happy. I'm just not used to it yet."],
  ] },

  // ── a hard day ──
  { when: { ...CALM, mood: LOW }, turns: [
    ['b', "You've been quiet. Are you okay?"],
    say('a', "Not really. I've just got a lot going on in my head, and there's nowhere in here to get away from it.", {
      lad: "Not really, {~bro}. My head's all over the place.",
      bestie: "No. And I didn't want to bring everyone down, so I've been pretending.",
      sharp: "No. But I don't really want to make a thing of it.",
    }),
    ['b', "Then don't get away from it. Talk to me."],
    ['a', "I just miss being able to go for a walk on my own. Or ring my {~mum}."],
    ['b', "I know. I'm not your {~mum}, but I'm here."],
  ], beat: "{a} laughs, a little, and leans into {b}." },
  { when: { ...CALM, mood: LOW }, stage: "{b} finds {a} sitting on the edge of a bed in the dressing room.", turns: [
    ['b', "There you are. I've been looking for you."],
    ['a', "I needed five minutes away from everyone."],
    ['b', "Do you want me to go?"],
    say('a', "No. Stay. I just don't want to have to smile at anyone for a bit.", {
      soft: "No. Please stay. I just needed somewhere quiet.",
    }),
    ['b', "You don't have to smile at me."],
  ], beat: "{b} sits down next to {a}, and they stay there until somebody calls them for dinner." },

  // ── home, and each other ──
  { when: { ...CALM }, turns: [
    ['b', "What do you miss most about home?"],
    say('a', "My friends. The ones who've known me forever. In here, everyone's only known me a few weeks.", {
      romantic: "My family. Sunday dinners. Everyone talking over each other.",
      lad: "My boys. Just sitting about, talking rubbish. I miss that.",
      quiet: "My own room. Quiet. Nobody watching.",
    }),
    ['b', "I know what you mean. You have to explain yourself all the time."],
    ['a', "Exactly. With you, I don't, though."],
    ['b', "Good. That's how it should be."],
  ] },
  { when: { ...CALM }, turns: [
    ['a', "Can I ask you something? Do you think people in here see the real me?"],
    ['b', "What do you mean?"],
    say('a', "I come across really confident, and I'm actually nervous half the time.", {
      big: "Everyone thinks I'm just the loud one. And I'm not, not really.",
      sharp: "People think I'm hard. I'm not. I just don't show it.",
    }),
    ['b', "I know you are. I can tell."],
    ['a', "Can you?"],
    ['b', "You play with your hair when you're nervous. You've been doing it this whole time."],
  ] },
  { when: { ...CALM }, stage: "{a} and {b} are sitting on the kitchen counter, sharing a bowl of cereal.", turns: [
    ['a', "I'm really glad I met you in here, you know."],
    say('b', "Where did that come from?", { soft: "Oh, stop. You'll make me cry." }),
    ['a', "I don't know. I was just thinking, if I go home tomorrow, I want you to know that."],
    ['b', "You're not going home tomorrow. But I'm glad I met you too."],
  ] },
  { when: { ...CALM, weeks: true }, turns: [
    ['b', "Can you believe how long we've been in here?"],
    say('a', "No. It feels like we've been here forever and like we only got here yesterday.", {
      lad: "No, {~bro}. Feels like a year and a week at the same time.",
    }),
    ['b', "Do you think you've changed?"],
    ['a', "Yeah. I think I'm more honest. I didn't used to say how I feel."],
    ['b', "You do now. I've noticed."],
  ] },

  // ── fallen out ──
  { when: { friction: true }, turns: [
    ['b', "You told everyone what I said to you last night. That was private."],
    ['a', "I didn't think it was a secret."],
    ['b', "It was to me."],
    say('a', "I'm sorry. I didn't think.", { sharp: "I didn't mean anything by it. You're making it a bigger thing than it is." }),
    ['b', "Just think next time."],
  ], beat: "{b} goes back inside, and {a} doesn't follow." },
  { when: { friction: true }, turns: [
    ['a', "You didn't stick up for me earlier."],
    ['b', "I didn't know you needed me to."],
    say('a', "Everyone was having a go at me, and you just sat there.", {
      soft: "It really hurt. I thought you'd at least say something.",
      sharp: "You just sat there. I'd have done it for you.",
    }),
    ['b', "I'm sorry. I didn't want to make it worse."],
    ['a', "You did make it worse."],
  ], beat: "Neither of them says anything else, and {a} goes to find someone else to sit with." },
  { when: { friction: true }, turns: [
    ['b', "Why did you laugh when they said that about me?"],
    ['a', "I wasn't laughing at you."],
    ['b', "It looked like you were."],
    say('a', "I'm sorry. I didn't realise it upset you.", { sharp: "I laughed because it was funny. It wasn't about you." }),
    ['b', "Well, it did."],
  ], beat: "{b} walks off, and {a} doesn't follow." },
  { when: { friction: true }, turns: [
    ['a', "Have I done something? You've been off with me since this morning."],
    say('b', "I'm fine.", { sharp: "You know what you did." }),
    ['a', "You're clearly not fine."],
    ['b', "I heard what you said about me last night. I'm not ready to talk about it yet."],
  ], beat: "{a} opens {a.posAdj} mouth to say something, then doesn't." },
] } };
