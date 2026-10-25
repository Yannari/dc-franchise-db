// pm/talk/more/ladder-volume.js — volume for a couple's turning points and the
// last hot spots (the user, 2026-10-22: "address the repeats by increasing the
// volume of the dialogue ALOT"). The ladder pools held two to four entries a
// movement, and every couple in a season goes through them. Same facts as
// pm/talk/ladder.js: {a} moves, {b} answers, `bFeels` is how much {b} feels;
// the engine decided the answer (a yes, `ask-declined` a no, love said back
// or left hanging).

export const LADDER_VOLUME = {
  'close-off': {
    moves: {
      lead: [
        { stage: "{a} finds {b} on the swing seat and sits down close.", turns: [['a', "Can I say something important? I've been building up to it all day."]] },
        { stage: "{a} takes {b} up to the roof terrace.", turns: [['a', "I brought you up here because I want to say this properly. Just us."]] },
        { stage: "{a} and {b} are lying on the daybeds, and {a} props {a.ref} up on one elbow.", turns: [['a', "I need to tell you where my head's at."]] },
        { stage: "{a} pulls {b} aside before dinner.", turns: [['a', "Before we go and eat, I want to tell you something."]] },
      ],
      say: [
        { turns: [['a', "I'm not looking at anyone else any more. I don't want to. It's you. I'm closing myself off."]] },
        { turns: [['a', "Whoever walks in next, I'm not interested. I want you to know that before they do. I'm closed off."]] },
        { turns: [['a', "I've been asked about my head about ten times this week. My head's here. With you. Nowhere else."]] },
        { turns: [['a', "I'm done with chats. Done with keeping options open. I've found my option. It's you."]] },
        { turns: [['a', "I've never closed myself off for anyone before. Not once. I'm doing it now, for you."]] },
        { turns: [['a', "I don't want to wonder what else is out there. I don't care what else is out there. I'm closed off."]] },
      ],
      answer: [
        { when: { bFeels: 'strong' }, turns: [['b', "Me too. I was going to say it tonight. You got there first."], ['a', "Really?"], ['b', "Really."]] },
        { when: { bFeels: 'strong' }, turns: [['b', "I've been closed off for days. I just didn't say it out loud. Now I am."]] },
        { when: { bFeels: 'some' }, turns: [['b', "That means a lot. I'm getting there too. I'm not quite there, but I'm close."], ['a', "That's okay. I can wait."]] },
        { when: { bFeels: 'some' }, turns: [['b', "Thank you for telling me. I'm not far behind you. Give me a little bit longer."]] },
        { when: { bFeels: 'little' }, turns: [['b', "That's really lovely. I just don't want to say it back until I mean it."], ['a', "Okay. That's fair."]] },
        { when: { bFeels: 'little' }, turns: [['b', "Thank you. I'm not there yet. I'm sorry. I want to be honest with you."]] },
      ],
      close: [
        // The cosy endings are for an answer that wasn't "not yet" (season read
        // 2026-10-25: "I'm not there yet. I'm sorry", then curled up till dinner).
        { when: { bFeels: ['strong', 'some'] }, turns: [], beat: "{b} kisses {a}, and they stay curled up there until someone shouts for dinner." },
        { when: { bFeels: ['strong', 'some'] }, turns: [['a', "So that's that, then."], ['b', "That's that."]] },
        { when: { bFeels: ['strong', 'some'] }, turns: [], beat: "When they go back down, {a} keeps hold of {b}'s hand the whole way." },
        { when: { bFeels: 'little' }, turns: [], beat: "They go back down together, not quite holding hands." },
        { when: { bFeels: 'little' }, turns: [], beat: "{a} nods and smiles. It's a brave smile." },
      ],
    },
  },
  'exclusive-ask': {
    moves: {
      lead: [
        { stage: "{a} has set up two cushions and a candle on the roof terrace.", turns: [['b', "What's all this?"], ['a', "Sit down. I've got something to ask you."]] },
        { stage: "{a} takes {b} by the hand and walks {b.obj} to the swing seat.", turns: [['a', "I'm nervous. I'm never nervous. Sit with me."]] },
        { stage: "{a} waits until the garden is quiet, then turns to {b}.", turns: [['a', "Can I ask you something big?"]] },
      ],
      ask: [
        { turns: [['a', "Will you be exclusive with me? No more chats, no more wondering. Just us."]] },
        { turns: [['a', "I don't want anyone else, and I don't want you to want anyone else. Will you be exclusive with me?"]] },
        { turns: [['a', "I know it's early. I don't care. Will you be exclusive with me?"]] },
        { turns: [['a', "I've been thinking about this for days. I'd like us to be exclusive. What do you think?"]] },
        { when: { reg: 'nervy' }, turns: [['a', "So. Okay. I've practised this. Will you, would you, be exclusive with me? That came out wrong. Yes or no?"]] },
      ],
      yes: [
        { turns: [['b', "Yes. Obviously, yes. I thought you'd never ask."]] },
        { turns: [['b', "Yes. A hundred times yes. Come here."]] },
        { turns: [['b', "I was hoping you'd say that. Yes."]] },
        { turns: [['b', "Yes. I'm so happy you asked. I've been wanting this too."]] },
      ],
      close: [
        { turns: [], beat: "They hug, and {b} doesn't let go for a long time." },
        { turns: [['a', "We're exclusive."], ['b', "We're exclusive. Say it again."]] },
        { turns: [], beat: "They go down to tell the others, and get a very loud cheer." },
      ],
    },
  },
  'official-ask': {
    moves: {
      setup: [
        { stage: "The terrace is lit with candles, and there are petals on the floor. {a} has clearly had help.", turns: [] },
        { stage: "{a} has written something in tea lights on the lawn. Everyone is pretending not to watch from the kitchen.", turns: [] },
      ],
      speech: [
        { turns: [['a', "From the first day, there was something about you. I didn't know what it was. I know now. It's that you're my favourite person."]] },
        { turns: [['a', "I've watched you be kind to everyone in here. I've watched you laugh at my terrible jokes. I want to keep watching you do that for a very long time."]] },
        { turns: [['a', "You've made this villa feel like home. I didn't think that was possible."]] },
      ],
      ask: [
        { turns: [['a', "{b}, will you be my {b.gf}? Officially?"]] },
        { turns: [['a', "So I'm asking. Will you be my {b.gf}?"]] },
      ],
      yes: [
        { turns: [['b', "Yes. Yes, yes, yes."]] },
        { turns: [['b', "Of course I will. Come here."]] },
        { turns: [['b', "Yes. I'm going to cry. I'm already crying. Yes."]] },
      ],
      close: [
        { turns: [], beat: "The villa bursts out of the kitchen cheering, because of course they were all watching." },
        { turns: [], beat: "They hold each other for a long time, and the candles flicker around them." },
      ],
    },
  },
  'ask-declined': {
    moves: {
      ask: [
        { when: { of: 'exclusive-ask' }, turns: [['a', "I want to be exclusive with you. Will you?"]] },
        { when: { of: 'official-ask' }, turns: [['a', "Will you be my {b.gf}? Officially?"]] },
      ],
      no: [
        { when: { bFeels: ['strong', 'some'] }, turns: [['b', "I really like you. You know I do. I just need a little more time. I want to be sure before I say yes."]] },
        { when: { bFeels: ['strong', 'some'] }, turns: [['b', "Not yet. I'm so sorry. It's not a no forever. It's a not yet."]] },
        { when: { bFeels: 'little' }, turns: [['b', "I can't. I'm sorry. I don't feel the same way, and I don't want to pretend."]] },
        { when: { bFeels: 'little' }, turns: [['b', "I don't think I'm there. I don't think I'm going to get there. I'm really sorry."]] },
      ],
      after: [
        { turns: [['a', "Okay. Okay. Thanks for being honest."], ['b', "I'm sorry."]] },
        { turns: [], beat: "{a} nods, and stares at the floor for a long moment." },
        { turns: [['a', "I'm going to go and get some air."], ['b', "We're outside."], ['a', "Different air."]] },
      ],
    },
  },
  'love-said': {
    moves: {
      lead: [
        { stage: "{a} and {b} are lying on the daybeds after dark, whispering.", turns: [] },
        { stage: "{a} and {b} sit on the swing seat, the rest of the villa asleep.", turns: [] },
      ],
      say: [
        { turns: [['a', "I need to tell you something, and I'm terrified. I love you."]] },
        { turns: [['a', "I've known for a while. I just didn't know how to say it. I love you."]] },
        { turns: [['a', "I love you. There. I said it. I've been holding that in for days."]] },
      ],
      back: [
        { turns: [['b', "I love you too. I love you so much."]] },
        { turns: [['b', "I love you too. I've been waiting for you to say it, so I didn't have to say it first."]] },
        { turns: [['b', "Say it again."], ['a', "I love you."], ['b', "I love you too."]] },
      ],
      close: [
        { turns: [], beat: "They lie there, holding on to each other, for a long, long time." },
        { turns: [['a', "I'm never going to forget this."], ['b', "Me neither."]] },
      ],
    },
  },
  'love-hanging': {
    moves: {
      say: [
        { turns: [['a', "I love you. I've wanted to say it for days."]] },
        { turns: [['a', "I think I'm in love with you. I know I am."]] },
      ],
      silence: [
        { turns: [['b', "That's... wow. That's really lovely."], ['a', "That's not what I wanted to hear."]] },
        { turns: [], beat: "{b} squeezes {a}'s hand, and says nothing at all." },
        { turns: [['b', "I really care about you. I do."], ['a', "That's not the same thing."]] },
      ],
      after: [
        { turns: [['a', "It's fine. You don't have to say it back. I'm fine."], ['b', "You're not fine."]] },
        { turns: [], beat: "They lie in the dark, both awake, neither of them saying anything." },
      ],
    },
  },
  'open-back-up': {
    moves: {
      lead: [
        { stage: "{a} sits {b} down on the swing seat, looking anywhere but at {b}.", turns: [] },
        { stage: "{a} asks {b} for a chat on the terrace, and {b} can tell straight away.", turns: [] },
      ],
      say: [
        { turns: [['a', "I told you I was closed off. I was. I'm not sure I am now. I'm sorry."]] },
        { turns: [['a', "I need to be honest with you. My head's been turned. I don't want to lie to you about it."]] },
      ],
      answer: [
        { when: { bFeels: 'strong' }, turns: [['b', "You said it was me. You said it to my face."], ['a', "I know."]] },
        { when: { bFeels: 'little' }, turns: [['b', "Okay. Honestly? I'm not that surprised."]] },
        { turns: [['b', "So what does that mean for us?"], ['a', "I don't know yet."]] },
      ],
      after: [
        { turns: [], beat: "{b} gets up and walks away, and {a} doesn't follow." },
        { turns: [['b', "Thank you for telling me, at least."]], beat: "It doesn't sound like thank you." },
      ],
    },
  },
};

export const GAME_KISS_VOLUME = {
  moves: {
    walk: [
      { when: { of: 'partner' }, stage: "{a} doesn't even pretend to think about it.", turns: [] },
      { when: { of: 'crush' }, stage: "{a} hesitates, looks along the line, and then walks to {b}.", turns: [] },
      { when: { of: 'stir' }, stage: "{a} makes a show of choosing, very slowly, and everyone knows where it's going.", turns: [] },
      { when: { of: 'fun' }, stage: "{a} does a little dance on the way over to {b}.", turns: [] },
    ],
    kiss: [
      { when: { of: 'partner' }, turns: [['a', "Who else was it going to be?"], ['b', "Nobody. Ever."]] },
      { when: { of: 'partner' }, turns: [['b', "You took your time."], ['a', "I was building suspense."]] },
      { when: { of: 'partner' }, turns: [['a', "Sorry, everyone. You knew this was coming."]] },
      { when: { of: 'crush' }, turns: [['b', "Oh. Okay. Hello."], ['a', "Hello."]] },
      { when: { of: 'crush' }, turns: [['a', "I've been wanting an excuse to do that."], ['b', "Well, you've had it now."]] },
      { when: { of: 'crush' }, turns: [['b', "That wasn't a game kiss."], ['a', "It's a game. Everything's a game kiss."]] },
      { when: { of: 'stir', bTaken: true }, turns: [['a', "Sorry, {pb}. Rules are rules."]] },
      { when: { of: 'stir' }, turns: [['a', "What? I'm playing the game. Somebody has to play it properly."]] },
      { when: { of: 'fun' }, turns: [['b', "That was the least romantic kiss of my life."], ['a', "You're welcome."]] },
      { when: { of: 'fun' }, turns: [['a', "Mwah. Done. Next."], ['b', "Charming."]] },
    ],
    faces: [
      { when: { of: 'partner' }, turns: [], beat: "Everyone groans at the safe pick, and {b} looks delighted with it." },
      { when: { of: 'crush' }, turns: [], beat: "Half the villa whoops. The other half looks at the floor." },
      { when: { of: 'stir' }, turns: [], beat: "{a} walks back to the line with a very innocent face." },
      { when: { of: 'fun' }, turns: [], beat: "{b} wipes {b.posAdj} mouth, laughing, and the villa claps." },
    ],
  },
};

export const ARGUMENT_VOLUME_2 = {
  moves: {
    defend: [
      { turns: [['b', "You're not even giving me a chance to explain."], ['a', "Go on, then. Explain."]] },
      { turns: [['b', "I'm not having this conversation if you're going to shout."]] },
      { turns: [['b', "You've got the wrong end of the stick. Completely the wrong end."]] },
      { turns: [['b', "Why are you always looking for something to be angry about?"]] },
      { turns: [['b', "Can we talk about this somewhere private? Please?"], ['a', "Why? So nobody hears what you did?"]] },
    ],
    escalate: [
      { turns: [['a', "I'm not shouting. This is just how loud I get when I'm upset."], ['b', "Then you're very upset."]] },
      { turns: [['b', "Everyone's looking at us."], ['a', "Good. Let them look."]] },
      { turns: [['a', "This is the problem. You never think you've done anything wrong."], ['b', "And you always think I have."]] },
      { turns: [['b', "Calm down."], ['a', "Don't tell me to calm down. Nobody in history has ever calmed down because someone told them to."]] },
      { turns: [['a', "I'm so tired of having the same argument."], ['b', "Then stop starting it."]] },
      { turns: [['b', "You're twisting everything I say."], ['a', "I'm repeating everything you say. There's a difference."]] },
    ],
  },
};

export const GOSSIP_TELL_VOLUME = {
  moves: {
    tell: [
      { when: { sec: 'pull', hasWith: true, casa: false, light: false }, turns: [['a', "{c} spent half the afternoon with {x} by the gym. Just the two of them. And they were sitting really, really close."]] },
      { when: { sec: 'pull', hasWith: true, casa: false, light: false }, turns: [['a', "I saw {c} and {x} on the beanbags earlier. Heads together, whispering. They split up the second they saw me."]] },
      { when: { sec: 'pull', hasWith: true, casa: false, light: false }, turns: [['a', "{c} went off for a chat with {x}. It wasn't a quick one. And when they came back, they wouldn't look at each other."]] },
      { when: { sec: 'kiss', hasWith: true, casa: false, light: false }, turns: [['a', "I saw {c} kiss {x} round the side of the villa. I wasn't looking for it. I just saw it."]] },
      { when: { sec: 'kiss', hasWith: true, casa: false, light: false }, turns: [['a', "{c} and {x} kissed. By the pool. When you were inside. I'm so sorry."]] },
      { when: { sec: 'bed', hasWith: true }, turns: [['a', "{c} and {x} shared a bed. Whispering, giggling, the lot. I was in the next one."]] },
      { when: { sec: 'promise', hasWith: true }, turns: [['a', "{c} was making plans with {x} for when you're all out. Holidays. Dinners. I heard every word."]] },
      { when: { sec: 'said' }, turns: [['a', "{c} told a group of us that being with you is easier than being single. That's all it is, apparently."]] },
      { when: { hasWith: false }, turns: [['a', "{c} has been telling people {c} isn't sure about you. More than one person. I didn't want you finding out at a fire pit."]] },
    ],
  },
};
