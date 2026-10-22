// ══════════════════════════════════════════════════════════════════════
// pm/talk/loyalty.js — {b} tries to pull {a}, and {a} says no
// ══════════════════════════════════════════════════════════════════════
//
// The pull turned down before it starts (events.js: a coupled islander who
// cares about their couple). {a} is the one staying loyal, {pa} the partner
// they stay loyal to; {b} is the one who tried ({pb} theirs, behind bTaken).
// `myRung` is how far {a} and {pa} have come: closed off, exclusive, official.
//   open    {b} asks; {a} keeps it where everyone can see
//   pitch   why {b} wanted the chat
//   refuse  {a} says where {a.posAdj} head is — the long turn
//   push    {b} tries once more
//   hold    {a} holds the line
//   close   how they leave it
import { build } from './build.js';

const CLOSED = ['closed-off', 'exclusive', 'official'];

export const LOYALTY = build('loyalty', {
  after: ['pull', 'date', 'game-kiss'],
  plans: {
    featured: ['open', 'pitch', 'refuse', 'push?', 'hold', 'close'],
    short: ['open', 'refuse', 'close'],
  },
  moves: {
    open: [
      { stage: "{b} comes over to {a} on the daybeds.", turns: [
        ['b', "Have you got a minute? I wanted to grab you for a chat."],
        ['a', "Yeah, go on. Here's fine, though. I'm not going anywhere."],
        ['b', "Here? In front of everyone?"],
        ['a', "In front of everyone. I've got nothing to hide."],
      ] },
      { stage: "{b} catches {a} by the kitchen island.", turns: [
        ['b', "Can I pull you for a bit?"],
        ['a', "What for?"],
        ['b', "Just a chat. I feel like we never talk."],
        ['a', "We can talk here. I'm making a tea, I'm not going anywhere."],
      ] },
      { when: { bReg: 'flirty' }, stage: "{b} sits down right next to {a} on the swing seat.", turns: [
        ['b', "Hello, you. I've been meaning to get you on your own all day."],
        ['a', "Have you? That sounds like trouble."],
        ['b', "Only the good kind."],
        ['a', "There's no good kind of trouble in here. Trust me."],
      ] },
      { when: { bReg: 'sharp' }, stage: "{b} walks straight up to {a}.", turns: [
        ['b', "Chat. Now. Come on."],
        ['a', "Bit bossy. What's it about?"],
        ['b', "You'll find out if you come with me."],
        ['a', "Or you could just tell me here."],
      ] },
      { when: { bReg: 'nervy' }, stage: "{b} hovers by {a} for a second.", turns: [
        ['b', "Sorry, can I — would it be all right if I talked to you for a bit? Just us?"],
        ['a', "You can talk to me. What's going on?"],
        ['b', "Nothing's going on. I just wanted to chat."],
        ['a', "Okay. Sit down, then."],
      ] },
      { when: { bReg: 'big' }, stage: "{b} drops down next to {a} with a big grin.", turns: [
        ['b', "Right, I'm stealing you. Don't argue."],
        ['a', "I'm going to argue a little bit."],
        ['b', "You can argue on the way to the terrace."],
        ['a', "Or I can argue right here, where I'm comfy."],
      ] },
      { when: { known: true }, stage: "{b} waits until {pa} is in the shower, then walks over to {a}.", turns: [
        ['b', "You're on your own for once."],
        ['a', "For about five minutes. What's up?"],
        ['b', "I wanted to talk to you while I had the chance."],
        ['a', "Right. Go on, then."],
      ] },
      { when: { phase: 'evening' }, stage: "{b} sits down next to {a} as the villa gets ready for the night.", turns: [
        ['b', "Can I borrow you before everyone goes to bed?"],
        ['a', "Borrow me for what?"],
        ['b', "A chat. Five minutes."],
        ['a', "You can have five minutes here."],
      ] },
      { when: { bTaken: true }, stage: "{b} leaves {pb} by the pool and wanders over to {a}.", turns: [
        ['b', "You got a sec?"],
        ['a', "Does {pb} know you're over here?"],
        ['b', "{pb}'s fine. It's a chat."],
        ['a', "Okay. Here, though."],
      ] },
      { stage: "{b} sits on the edge of {a}'s sun lounger.", turns: [
        ['b', "Do you mind?"],
        ['a', "I suppose not. What's this about?"],
        ['b', "Do I need a reason to sit with you?"],
        ['a', "In here? Yeah. Everyone's got a reason."],
      ] },
      { when: { reg: 'dry' }, stage: "{b} pulls up a chair next to {a}.", turns: [
        ['b', "Can I talk to you?"],
        ['a', "You're already sitting down, so I think we're past asking."],
        ['b', "Fair. I just wanted a chat."],
        ['a', "Then chat."],
      ] },
      { when: { justMet: true }, stage: "{b} introduces {b.ref} to {a} properly by the fire pit.", turns: [
        ['b', "Hi. I don't think I've really said hello yet."],
        ['a', "Hi. No, you haven't. It's all been a bit of a blur."],
        ['b', "Can I take you somewhere quieter and actually get to know you?"],
        ['a', "We can get to know each other here. It's quiet enough."],
      ] },
    ],

    pitch: [
      { turns: [
        ['b', "I'll be honest with you, because I don't see the point in being anything else. I think you're really attractive, and I'd like to get to know you more. Not as friends. Properly."],
        ['a', "Okay. Wow. Straight in."],
        ['b', "I don't see the point in hanging around."],
      ] },
      { when: { bFresh: true }, turns: [
        ['b', "When I walked in, you were the first person I noticed. Everyone was standing there, and I just saw you. I'm not going to pretend I didn't."],
        ['a', "That's really nice of you to say."],
        ['b', "It's not nice, it's true."],
      ] },
      { when: { bTaken: true }, turns: [
        ['b', "I know we're both with people, and I know how this looks. But I think we've got more in common than either of us have with the people we're with, and I didn't want to sit there and never say it."],
        ['a', "That's a big thing to say."],
        ['b', "I know it is."],
      ] },
      { when: { known: true }, turns: [
        ['b', "I've been watching you for a few days now, and I think you're wasted where you are. You're always the one making everyone laugh, and I don't think you get enough back."],
        ['a', "Wasted? That's a bit much."],
        ['b', "Maybe. But I mean it."],
      ] },
      { when: { bReg: 'flirty' }, turns: [
        ['b', "Do you want to know a secret? Every time you walk past, I forget what I'm saying. I've lost about four conversations today because of you."],
        ['a', "Stop it."],
        ['b', "I'm not stopping. I'm just getting started."],
      ] },
      { when: { bReg: 'sharp' }, turns: [
        ['b', "I'm going to be straight with you. I {~fancy} you, and I think you'd be happier with me than where you are. That's it. That's the whole speech."],
        ['a', "That's quite a speech."],
        ['b', "I'm a straight-to-it kind of person."],
      ] },
      { when: { bReg: 'soft' }, turns: [
        ['b', "I just think you're a really lovely person, and I don't think I'd forgive myself if I left here without telling you I'd like to get to know you more. That's all it is."],
        ['a', "That's really sweet."],
        ['b', "I mean every word."],
      ] },
      { when: { bReg: 'nervy' }, turns: [
        ['b', "Okay, this is going to come out wrong, but I really like you. Like, I've liked you for a while, and I've been too scared to say anything, and I've just said it really fast."],
        ['a', "You did say it really fast."],
        ['b', "Sorry. That's how it came out."],
      ] },
      { when: { bReg: 'big' }, turns: [
        ['b', "I'm just going to say it, because I'm rubbish at keeping things in. I think you're gorgeous, I think you're funny, and I think you're with the wrong person. There. Done."],
        ['a', "Oh my God."],
        ['b', "I said it! I feel so much lighter."],
      ] },
      { when: { after: 'pull', afterBy: 'a' }, turns: [
        ['b', "I saw you chatting to {x} earlier, and I thought, if everyone else is having a go, I might as well."],
        ['a', "It was a chat. That's all it was."],
        ['b', "Well, this can be a chat too."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'both' }, turns: [
        ['b', "I can't stop thinking about that kiss in the challenge. I know it was a game, but it didn't feel like a game, and I think you felt it too."],
        ['a', "It was a challenge. Everyone was kissing everyone."],
        ['b', "Not like that, they weren't."],
      ] },
      { turns: [
        ['b', "Everyone says we'd be good together. Like, people keep saying it to me, and I thought, maybe they've got a point, and maybe I should actually say something."],
        ['a', "Who's everyone?"],
        ['b', "Just people. The villa. You know what it's like."],
      ] },
    ],

    refuse: [
      { turns: [
        ['a', "Look, I'm really flattered, I am. But I'm with {pa}, and I'm happy with {pa}, and I'm not going to be one of those people who keeps one eye on the door. I'd hate it if {pa} did it to me, so I'm not doing it."],
        ['b', "Okay."],
        ['a', "I'm not trying to be harsh. I just want to be clear."],
      ] },
      { when: { myRung: CLOSED }, turns: [
        ['a', "I've closed off with {pa}. You know that, everyone knows that. I told {pa} I'm not looking anywhere else, and I meant it, so I'm not going to sit here and have this conversation like it's nothing."],
        ['b', "I didn't know it was that serious."],
        ['a', "It's that serious."],
      ] },
      { when: { myRung: 'official' }, turns: [
        ['a', "{pa} is my {pa.gf}. Officially. I'm not going to throw that away for a chat, and I'm a bit surprised you'd even ask, if I'm honest."],
        ['b', "I just thought..."],
        ['a', "I know what you thought. But no."],
      ] },
      { when: { known: true }, turns: [
        ['a', "I'm going to stop you there, because I don't want you to say something you can't take back. I'm with {pa}. We've been through a lot already, and I'm not walking away from that for a chat on the terrace."],
        ['b', "I wasn't asking you to walk away."],
        ['a', "Weren't you?"],
      ] },
      { when: { early: true }, turns: [
        ['a', "It's early, I know it's early, but I've got a really good feeling about {pa}, and I want to give it a {~proper} go. If I start chatting to other people now, I'll never know what it could have been."],
        ['b', "That's fair, I suppose."],
        ['a', "It is fair. Sorry."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "No. I'm going to be really straight with you. I'm with {pa}, and I'm not interested. Not a little bit, not maybe later. No."],
        ['b', "Wow. Okay."],
        ['a', "I'd rather be blunt than lead you on."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "That's honestly really lovely of you to say, and I'm not going to pretend I'm not flattered. But my heart's with {pa}, and I don't want to do anything that would hurt {pa}. I couldn't live with myself."],
        ['b', "I get it."],
        ['a', "Thank you. I mean that."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "Oh my God, no, no, no. You're lovely, you're gorgeous, you're all of it, but I'm with {pa}, and {pa} would kill me. And then {pa} would kill you. And then I'd have to find a new {pa}."],
        ['b', "That's a lot of killing."],
        ['a', "It's a lot of killing! So no."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "I appreciate the effort, I really do. But I'm with {pa}, and I'm quite happy with that, and I've got a feeling this chat is going to get back to {pa} in about four minutes anyway."],
        ['b', "I wouldn't say anything."],
        ['a', "You wouldn't. The villa would."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Oh. Okay. Oh God. Um. I'm really flattered, honestly, but I'm with {pa}, and I don't — I don't want to mess that up. Sorry. I'm really bad at this."],
        ['b', "You're fine."],
        ['a', "I'm so sorry."],
      ] },
      { when: { reg: 'flirty' }, turns: [
        ['a', "Trust me, if I wasn't with {pa}, we'd be having a very different conversation right now. But I am, and I'm not the type to mess someone around."],
        ['b', "So there's a chance?"],
        ['a', "There's a {pa}. That's what there is."],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "You're with {pb}. I'm with {pa}. I'm not going to sit here and pretend that's not a thing. And honestly, if {pb} knew you were over here saying this, how do you think {pb} would feel?"],
        ['b', "That's not fair."],
        ['a', "It's a fair question."],
      ] },
      { when: { mood: 'secure' }, turns: [
        ['a', "Honestly? I feel really settled with {pa}. For the first time since I walked in, I'm not looking over my shoulder, and I'm not about to start now. I hope you understand that."],
        ['b', "I do."],
        ['a', "Good."],
      ] },
    ],

    push: [
      { turns: [
        ['b', "And you're sure? You're not even a little bit curious?"],
        ['a', "Curiosity's how people end up on the wrong side of a recoupling. So no."],
        ['b', "Fair enough."],
      ] },
      { when: { bReg: 'sharp' }, turns: [
        ['b', "Come on. Just tell me you've never thought about it. Not once."],
        ['a', "I'm not going to tell you what I've thought about. What I've thought about doesn't matter. What I do matters."],
        ['b', "That sounds like a yes."],
        ['a', "It's a no."],
      ] },
      { when: { bReg: 'flirty' }, turns: [
        ['b', "One drink on the outside. That's all I'm asking."],
        ['a', "On the outside, I'll still be with {pa}."],
        ['b', "You don't know that."],
        ['a', "I'd like to think I do."],
      ] },
      { when: { known: true }, turns: [
        ['b', "Can I just say, from the outside, it doesn't always look that happy between you two."],
        ['a', "From the outside you don't see much, do you?"],
        ['b', "I see enough."],
        ['a', "You see what you want to see."],
      ] },
      { turns: [
        ['b', "What if it doesn't work out with {pa}?"],
        ['a', "Then it doesn't work out, and we'll see. But I'm not going to plan for it not working out. That's how you make sure it doesn't."],
        ['b', "That's very wise."],
        ['a', "I have my moments."],
      ] },
      { when: { bReg: 'big' }, turns: [
        ['b', "I'm not giving up, just so you know. I'm going to be charming. I'm going to be so charming you won't know what to do with yourself."],
        ['a', "Please don't."],
        ['b', "Too late. It's already started."],
      ] },
      { when: { bReg: 'nervy' }, turns: [
        ['b', "Sorry. I shouldn't have said anything. I've made it really awkward now, haven't I?"],
        ['a', "It's not awkward. It's fine. I'm glad you said it, honestly, I'd rather know."],
        ['b', "Really?"],
        ['a', "Really."],
      ] },
      { turns: [
        ['b', "Can I at least sit with you at dinner? As a friend?"],
        ['a', "As a friend, yeah. Just don't make it weird."],
        ['b', "I won't make it weird."],
        ['a', "You're already making it a bit weird."],
      ] },
    ],

    hold: [
      { turns: [
        ['a', "I like you, I do. I think you're a good laugh, and I'd love us to be friends. But that's where it ends, and I need you to know that, because I'm not going to change my mind next week."],
        ['b', "Okay. Message received."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm going to say this once, and then I'm done talking about it. I'm not interested. Not now, not tomorrow, not at the recoupling. Okay?"],
        ['b', "Okay. Loud and clear."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "Please don't take it personally. You're lovely, and someone in here is going to be really lucky. It's just not going to be me, because I've already found my person, or I hope I have."],
        ['b', "That's a really nice way of saying no."],
        ['a', "It's still a no, though."],
      ] },
      { when: { myRung: CLOSED }, turns: [
        ['a', "When I closed off with {pa}, I didn't do it for show. I did it because I meant it. So if anyone comes over here, the answer's the same. It's {pa}."],
        ['b', "Fair play to you, honestly."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "Look, I'm sure you'll find someone who appreciates the swing-seat approach. It's a very good approach. It's just not going to work on me."],
        ['b', "The swing-seat approach?"],
        ['a', "Everyone does it. You sit on the swing seat, you say something nice, and then it's a whole thing at the fire pit."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "No! Absolutely not! You are not getting me in trouble with {pa}. I've only just got {pa} to stop being moody with me about the last thing!"],
        ['b', "What last thing?"],
        ['a', "Never you mind what last thing."],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "Go back to {pb}. Honestly. Have the conversation you should be having with {pb} instead of this one."],
        ['b', "Maybe I will."],
        ['a', "I think you should."],
      ] },
      { turns: [
        ['a', "I'm not going to tell {pa} about this, because nothing happened, and I don't want to start drama over nothing. But if it happens again, I will."],
        ['b', "It won't happen again."],
        ['a', "Good."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "I just don't want you to think I was leading you on or anything. I've been really friendly with you, but that's because I'm friendly with everyone. I'm sorry if it came across wrong."],
        ['b', "It didn't. I just read into it."],
        ['a', "Okay. Good. I mean, not good, but okay."],
      ] },
      { when: { mood: 'secure' }, turns: [
        ['a', "Honestly, a week ago I might have been flattered enough to think about it. But now? No. I know what I've got with {pa}, and it's worth more than a chat on the terrace."],
        ['b', "I respect that."],
      ] },
    ],

    close: [
      { turns: [
        ['b', "Right. I'll leave you to it, then."],
        ['a', "No hard feelings?"],
        ['b', "No hard feelings."],
      ], beat: "{b} heads back to the others. {a} goes straight to find {pa}." },
      { turns: [
        ['a', "Are we all right?"],
        ['b', "We're fine. I had to try, didn't I?"],
        ['a', "You did. Points for trying."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "Come here."],
        ['b', "What?"],
        ['a', "Hug. I don't want this to be awkward."],
      ], beat: "They hug, and it's mostly not awkward." },
      { turns: [
        ['b', "Are you going to tell {pa}?"],
        ['a', "I'll tell {pa} you asked for a chat, and I said no. Because that's what happened."],
        ['b', "Fair enough."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['b', "I'm going to go and have a lie down in the sun and think about my choices."],
        ['a', "Wear sun cream while you're at it."],
      ], beat: "{b} goes. {a} watches {b.obj} walk off, then goes back to {a.posAdj} tea." },
      { turns: [
        ['b', "I'm going to go before this gets any more awkward."],
        ['a', "It's not awkward."],
        ['b', "It's a bit awkward."],
      ], beat: "{b} heads back towards the pool. {a} lets out a long breath." },
      { when: { reg: 'big' }, turns: [
        ['a', "Right! Well! That happened! I'm going to go and find {pa} and give {pa.obj} a massive cuddle for no reason!"],
        ['b', "No reason at all."],
      ], beat: "{a} is already halfway across the villa." },
      { when: { bTaken: true }, turns: [
        ['b', "I'll go back to {pb}."],
        ['a', "I think that's for the best."],
      ], beat: "{b} goes back to {pb}. Neither of them looks at {a} for the rest of the afternoon." },
      { turns: [
        ['a', "I'm going to go and find {pa}."],
        ['b', "Of course you are."],
      ], beat: "{a} gets up. {b} stays sitting there for a while." },
      { when: { phase: 'evening' }, turns: [
        ['b', "Night, then."],
        ['a', "Night."],
      ], beat: "{a} goes inside and gets into bed next to {pa} without saying a word about it." },
    ],
  },

  notes: [
    { stage: "{b} tries to pull {a} for a chat. {a} says no and goes back to {pa}." },
    { stage: "{a} turns down a chat with {b}, loudly enough for {pa} to hear." },
    { stage: "{b} tries {b.posAdj} luck with {a}. {a} isn't interested." },
    { when: { myRung: CLOSED }, stage: "{b} asks {a} for a chat. {a}, closed off with {pa}, says no straight away." },
    { stage: "{a} lets {b} down gently by the pool and goes straight back to {pa}." },
  ],
});
