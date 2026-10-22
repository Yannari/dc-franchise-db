// ══════════════════════════════════════════════════════════════════════
// pm/talk/jealousy.js — what jealousy and guilt turn into (villa-day.js)
// ══════════════════════════════════════════════════════════════════════
//
// reassurance        {a} is jealous; {b}, the partner, reassures. `sincere`:
//                    whether {b} means it (how {b} really feels about {a}).
// jealous-confront   {a} confronts {b}, the partner, about {c}.
// jealous-retaliate  {a} flirts with {b} to get back at {c}, {a.posAdj} partner.
// confession         {a} tells {b}, the partner, what {a} did (`sec`, with {x}).
// no-show            {b} broke down today; {a}, the partner, never came.
// Each one names what set it off: {x}, when the scene it follows is one both
// of them know about (a chat, a date, a kiss in a challenge).
import { build } from './build.js';
import { romance } from '../feelings.js';

const FLIRTED = ['pull', 'date', 'game-kiss'];

export const REASSURANCE = build('reassurance', {
  stages: [
    { stage: "{b} sits down next to {a} on the swing seat." },
    { stage: "{b} finds {a} on {a.posAdj} own on the terrace." },
  ],
  after: FLIRTED,
  facts: (state, ev) => ({ sincere: romance(ev.players[1], ev.players[0]) >= 5 }),
  plans: {
    featured: ['open', 'worry', 'reassure', 'tease?', 'close'],
    short: ['worry', 'reassure'],
  },
  moves: {
    open: [
      { stage: "{b} notices {a} sitting on {a.posAdj} own and goes over.", turns: [
        ['b', "Hey. You've been quiet all afternoon. What's going on in that head?"],
        ['a', "Nothing. I'm fine."],
        ['b', "You're doing the face. Come on. Talk to me."],
      ] },
      { stage: "{b} sits down next to {a} on the swing seat and takes {a.posAdj} hand.", turns: [
        ['b', "Are we okay? You've been funny with me."],
        ['a', "Have I?"],
        ['b', "A bit. What's up?"],
      ] },
      { when: { phase: 'evening' }, stage: "{b} pulls {a} aside before bed.", turns: [
        ['b', "Before we go in, can we talk? I can tell something's bothering you."],
        ['a', "It's stupid."],
        ['b', "Nothing you feel is stupid."],
      ] },
    ],
    worry: [
      { when: { after: 'pull', afterBy: 'b' }, turns: [
        ['a', "It's the chat with {x}. I know it was just a chat. I know you're allowed to talk to people. But I saw you laughing, and I saw how {x} was looking at you, and I've just been sitting here ever since with my stomach in knots."],
        ['b', "Oh, come here."],
      ] },
      { when: { after: 'date', afterBy: 'b' }, turns: [
        ['a', "I hated watching you go on that date with {x}. I know you didn't choose it. I know it's part of the game. But I was sitting by the pool for hours imagining it, and I imagined the worst."],
        ['b', "The worst didn't happen."],
        ['a', "My head doesn't know that."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'b' }, turns: [
        ['a', "That kiss with {x} in the challenge. I know it was a game. I know everyone was doing it. But it didn't look like a game from where I was standing. It looked like you meant it."],
        ['b', "I didn't mean it."],
        ['a', "Then why did it go on so long?"],
      ] },
      { turns: [
        ['a', "I just feel like you've been somewhere else today. Like, physically you're here, but your head's not. And I start wondering if it's me, or if it's someone else, and I can't switch it off."],
        ['b', "It's not someone else. I promise you that."],
      ] },
      { turns: [
        ['a', "I hate being like this. I'm not normally jealous. But in here, everything's so in your face, and I see you talking to people, and I just get this feeling that I'm going to lose you."],
        ['b', "You're not going to lose me."],
        ['a', "You can't promise that."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Can you just tell me we're okay? I know it sounds needy. I know it does. But I need to hear it, because my head's been telling me all day that we're not."],
        ['b', "We're okay."],
        ['a', "Say it again."],
      ] },
    ],
    reassure: [
      { when: { sincere: true }, turns: [
        ['b', "Listen to me. You've got nothing to worry about. Nothing. I've chosen you. I chose you at that fire pit and I'd choose you again tomorrow. Whoever I talk to, whoever I sit next to, I come back to you. Every single time. You know that, deep down."],
        ['a', "I do know that. I just needed to hear it."],
        ['b', "Then I'll keep saying it."],
      ] },
      { when: { sincere: true }, turns: [
        ['b', "Can I tell you something? When I'm talking to anyone else in here, I'm thinking about getting back to you. Honestly. You're the best part of my day. I don't need anyone else. I don't want anyone else."],
        ['a', "Okay."],
        ['b', "Okay? Just okay?"],
        ['a', "Okay, I feel stupid now. In a good way."],
      ] },
      { when: { sincere: true, after: 'pull', afterBy: 'b' }, turns: [
        ['b', "{x} asked how things were with us, and I said really good. That's it. That's the whole chat. If you'd been sitting there, you'd have been bored. I wasn't flirting. I was talking about you."],
        ['a', "You were talking about me?"],
        ['b', "I'm always talking about you. It's embarrassing."],
      ] },
      { when: { sincere: false }, turns: [
        ['b', "You don't need to worry. Honestly. We're fine. Everything's fine."],
        ['a', "Are we, though?"],
        ['b', "Yeah. Of course we are. Come on, don't do this."],
      ] },
      { when: { sincere: false }, turns: [
        ['b', "Look, I'm with you, aren't I? I'm sitting here. I don't know what else you want me to say."],
        ['a', "I want you to say it like you mean it."],
        ['b', "I do mean it."],
      ] },
    ],
    tease: [
      { turns: [
        ['b', "You're cute when you're jealous, you know."],
        ['a', "I'm not jealous."],
        ['b', "You're green. You're a little green person."],
        ['a', "Stop it."],
      ] },
      { turns: [
        ['b', "If it makes you feel better, you can be jealous of me next time. I'll go and talk to someone really ugly."],
        ['a', "That's not how it works."],
      ] },
    ],
    close: [
      { when: { sincere: true }, turns: [], beat: "{b} kisses {a}'s forehead, and {a} finally relaxes." },
      { when: { sincere: true }, turns: [['a', "Thank you."], ['b', "Always."]], beat: "They stay on the swing seat until it gets dark." },
      { when: { sincere: false }, turns: [], beat: "{a} nods and smiles, but the worry doesn't quite go away." },
    ],
  },
  notes: [
    { when: { sincere: true }, stage: "{b} reassures {a} that there's nothing to worry about." },
    { when: { sincere: false }, stage: "{b} tells {a} everything's fine. {a} isn't sure {b} means it." },
  ],
});

export const JEALOUS_CONFRONT = build('jealous-confront', {
  stages: [
    { stage: "{a} sits down opposite {b} on the terrace." },
    { stage: "{a} stops {b} on the way past the pool." },
  ],
  after: FLIRTED,
  plans: {
    featured: ['open', 'accuse', 'answer', 'escalate?', 'end'],
    short: ['accuse', 'answer', 'end'],
  },
  moves: {
    open: [
      { stage: "{a} marches over to {b} on the daybeds.", turns: [
        ['a', "Can I have a word? On our own?"],
        ['b', "What's wrong now?"],
        ['a', "Not here."],
      ] },
      { stage: "{a} waits until {c} has gone inside, then sits down opposite {b}.", turns: [
        ['a', "We need to talk."],
        ['b', "That sounds bad."],
        ['a', "It is a bit bad."],
      ] },
      { stage: "{a} stops {b} on the stairs.", turns: [
        ['b', "What's going on? You've been looking at me funny all day."],
        ['a', "I've been looking at you funny because I've been watching you all day."],
      ] },
    ],
    accuse: [
      { when: { after: 'pull', afterBy: 'b' }, turns: [
        ['a', "What's going on with you and {c}? And don't say nothing, because I saw that chat earlier. I saw how close you were sitting. Everyone saw it."],
        ['b', "It was a chat."],
        ['a', "It didn't look like a chat."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'b' }, turns: [
        ['a', "You didn't have to pick {c} in that challenge. You could have picked anyone. You picked {c}, and you kissed {c} like I wasn't stood right there."],
        ['b', "It was a game."],
        ['a', "Everyone keeps saying that. It didn't look like a game."],
      ] },
      { turns: [
        ['a', "I'm going to ask you once, and I want the truth. Do you {~fancy} {c}?"],
        ['b', "What? Where's this come from?"],
        ['a', "It's come from watching you two for the last two days."],
      ] },
      { turns: [
        ['a', "Every time I look over, you're with {c}. Laughing with {c}, sitting with {c}, making {c} drinks. I don't even know why I'm here, honestly, because it feels like you've already got someone."],
        ['b', "That's not fair."],
        ['a', "Then tell me what's fair."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm not going to play games. I've seen how you are with {c}, and I'm not having it. Either you sort it out, or I will."],
        ['b', "Is that a threat?"],
        ['a', "It's a warning."],
      ] },
    ],
    answer: [
      { turns: [
        ['b', "{c} is a friend. That's it. I'm allowed to have friends in here. If I can't laugh with someone without you thinking something's going on, then we've got a bigger problem than {c}."],
        ['a', "Don't turn this round on me."],
      ] },
      { turns: [
        ['b', "I'm not going to lie to you. I get on with {c}. Really well. But I've done nothing wrong. I've never once done anything behind your back, and I wouldn't."],
        ['a', "Getting on really well is how it starts."],
      ] },
      { turns: [
        ['b', "Do you trust me or not? Because if you don't, there's no point in any of this. I can't spend every day checking who I'm allowed to talk to."],
        ['a', "I want to trust you. You're not making it easy."],
      ] },
      { turns: [
        ['b', "I'm sorry. I didn't realise it looked like that. I'll pull back. I don't want you feeling like this."],
        ['a', "You didn't realise?"],
        ['b', "Honestly, I didn't."],
      ] },
    ],
    escalate: [
      { turns: [
        ['a', "I'm not stupid. I've been in situations before where I ignored all of this, and it ended exactly how I thought it would. I'm not doing that again."],
        ['b', "I'm not them."],
        ['a', "Then prove it."],
      ] },
      { turns: [
        ['b', "You're being paranoid."],
        ['a', "Don't call me paranoid. If you'd seen what I've seen, you'd be paranoid too."],
      ] },
    ],
    end: [
      { turns: [['b', "Come here. I'm not going anywhere. Okay?"], ['a', "Okay."]], beat: "They hug, but {a}'s eyes go straight to {c} across the garden." },
      { turns: [['a', "I just need you to know how it made me feel."], ['b', "I know now. I'm sorry."]] },
      { turns: [], beat: "{a} walks off. {b} looks over at {c}, and then looks away fast." },
      { turns: [['b', "Can we leave it now?"], ['a', "For now."]], beat: "It doesn't feel left." },
    ],
  },
  notes: [
    { stage: "{a} confronts {b} about {c}." },
  ],
});

export const JEALOUS_RETALIATE = build('jealous-retaliate', {
  plans: {
    featured: ['flirt', 'watch'],
    short: ['flirt'],
  },
  moves: {
    flirt: [
      { stage: "{a} sits down next to {b} on the daybeds, right where {c} can see.", turns: [
        ['a', "You look really good today, do you know that?"],
        ['b', "Do I? That's nice of you."],
        ['a', "I'm always nice. Come and sit with me for a bit. I want to hear all about you."],
        ['b', "All about me? That's a lot."],
        ['a', "I've got time."],
      ] },
      { stage: "{a} drapes an arm round {b} at the pool, laughing loudly.", turns: [
        ['a', "Honestly, you're the funniest person in this villa. I don't know why we don't hang out more."],
        ['b', "Are you all right? You're being very friendly."],
        ['a', "Can't I be friendly?"],
      ] },
      { stage: "{a} makes a big show of bringing {b} a drink.", turns: [
        ['a', "Made you one. Just how you like it."],
        ['b', "You don't know how I like it."],
        ['a', "Then you'll have to teach me."],
      ] },
    ],
    watch: [
      { turns: [], beat: "Across the garden, {c} watches every second of it." },
      { turns: [['b', "Why do I feel like I'm part of something here?"], ['a', "You're not part of anything. Drink your drink."]] },
      { turns: [], beat: "{a} glances over to check {c} is looking. {c} is." },
    ],
  },
  notes: [
    { stage: "{a} flirts with {b}, making sure {c} sees every second." },
  ],
});

export const CONFESSION = build('confession', {
  stages: [
    { stage: "{a} sits {b} down on the swing seat." },
    { stage: "{a} takes {b} up to the terrace." },
  ],
  facts: (state, ev) => {
    const s = (state.secrets || []).find(x => x.id === ev.extra?.secret);
    return { hasWith: !!s?.with };
  },
  slots: (state, ev) => {
    const s = (state.secrets || []).find(x => x.id === ev.extra?.secret);
    return s?.with ? { x: s.with } : {};
  },
  plans: {
    featured: ['open', 'admit', 'react', 'after', 'close'],
    short: ['admit', 'react'],
  },
  moves: {
    open: [
      { stage: "{a} sits {b} down on the swing seat, looking sick.", turns: [
        ['b', "You're scaring me. What is it?"],
        ['a', "I need to tell you something, and I need you to let me finish."],
      ] },
      { stage: "{a} can't sleep, and wakes {b} up.", turns: [
        ['b', "What time is it?"],
        ['a', "Late. I can't sleep. I need to tell you something before I lose my nerve."],
      ] },
      { stage: "{a} takes {b} up to the terrace, away from everyone.", turns: [
        ['a', "I've been carrying something around all day, and I can't look at you anymore without telling you."],
        ['b', "Okay. Tell me."],
      ] },
    ],
    admit: [
      { when: { sec: 'kiss', hasWith: true }, turns: [
        ['a', "I kissed {x}. It was stupid, and it meant nothing, and I regretted it the second it happened. But it happened, and I'm not going to let you find out from someone else."],
      ] },
      { when: { sec: 'pull', hasWith: true }, turns: [
        ['a', "I had a chat with {x}. A flirty one. I let it go further than it should have, and I didn't tell you, and I've felt sick about it ever since."],
      ] },
      { when: { sec: 'bed', hasWith: true }, turns: [
        ['a', "When you were in the other villa, I shared a bed with {x}. Nothing happened. Well, nothing much. But I shouldn't have done it, and I'm telling you because I can't keep it in."],
      ] },
      { when: { sec: 'promise', hasWith: true }, turns: [
        ['a', "I told {x} I'd see {x.obj} on the outside. I said it, and I meant it at the time, and I shouldn't have, because I'm with you."],
      ] },
      { when: { sec: 'said' }, turns: [
        ['a', "I said some things about you. To the others. Moaning, really. Saying I was bored, saying I didn't know if it was going anywhere. And I didn't mean it, I was just in a mood, but I said it, and I'm sorry."],
      ] },
      { turns: [
        ['a', "I haven't been fair to you. There's been something going on in my head, and I let it show with someone else, and I should have come to you first. I'm so sorry."],
      ] },
    ],
    react: [
      { when: { bReg: 'sharp' }, turns: [
        ['b', "Are you serious? You're actually serious right now? And you thought telling me would make it better?"],
        ['a', "I thought you deserved the truth."],
        ['b', "I deserved you not doing it in the first place."],
      ] },
      { when: { bReg: 'soft' }, turns: [
        ['b', "I don't... I don't know what to say. I thought we were happy. I thought I was enough."],
        ['a', "You are enough. You're more than enough."],
        ['b', "Then why?"],
      ] },
      { turns: [
        ['b', "How long were you going to keep that from me?"],
        ['a', "I'm not keeping it from you. I'm telling you."],
        ['b', "Because you had to. Because someone would have told me."],
      ] },
      { turns: [
        ['b', "Thank you for telling me. I mean that. But I need some time. I can't look at you right now."],
        ['a', "Okay. I understand."],
      ] },
    ],
    after: [
      { turns: [
        ['a', "I'll do whatever it takes. Honestly. Whatever you need from me. I know I've messed up, but I don't want to lose you over this."],
        ['b', "Then you shouldn't have done it."],
      ] },
      { turns: [
        ['b', "Was it worth it?"],
        ['a', "No. Nothing would be worth this."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} gets up and walks away, and {a} doesn't follow." },
      { turns: [['b', "I'm going to bed. Don't come in yet."]], beat: "{a} sits on the terrace on {a.posAdj} own for a long time." },
    ],
  },
  notes: [
    { stage: "{a} comes clean to {b}." },
  ],
});

export const NO_SHOW = build('no-show', {
  plans: {
    featured: ['ask', 'answer', 'close'],
    short: ['ask', 'answer'],
  },
  moves: {
    ask: [
      { stage: "That evening, {b} finds {a}.", turns: [
        ['b', "Where were you? Earlier. When I was upstairs in bits. Everyone came. Everyone. And you didn't."],
        ['a', "I didn't know. I didn't know how bad it was."],
      ] },
      { stage: "{b} sits down next to {a}, red-eyed.", turns: [
        ['b', "Can I ask you something? Why didn't you come and find me today?"],
        ['a', "I thought you wanted space."],
        ['b', "I wanted you."],
      ] },
    ],
    answer: [
      { turns: [
        ['a', "I'm sorry. I didn't know what to do. I'm not good at that stuff, I never know what to say, and I thought you'd be better with your friends."],
        ['b', "I didn't need you to say anything. I needed you to be there."],
      ] },
      { turns: [
        ['a', "I should have come. I know I should have. I'm sorry."],
        ['b', "Sorry doesn't change that you didn't."],
      ] },
    ],
    close: [
      { turns: [], beat: "{b} goes inside without waiting for an answer." },
      { turns: [['a', "It won't happen again."], ['b', "It'd better not."]] },
    ],
  },
  notes: [
    { stage: "{b} asks {a} why {a} never came to find {b.obj}." },
  ],
});
