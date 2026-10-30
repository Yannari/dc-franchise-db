// ══════════════════════════════════════════════════════════════════════
// pm/talk/pull.js — {a} pulls {b} for a chat
// ══════════════════════════════════════════════════════════════════════
//
// The villa's most-aired drama. The engine has decided how it ends (`end`:
// flirt · kissed · promised · turned-down) and how hot it ran (`heat`: cold ·
// light · one-sided · flirty · steamy); the movements only say it.
//
// Every movement is a whole exchange that opens and closes its own subject,
// so any plan's movements follow one another (pm/script.js talkScript):
//   open     the ask and the walk; ends with them sat down, nothing pending
//   why      why {a} wanted this chat
//   answer   one asks where the other's head is; the answer is the long turn
//   probe    {a} pushes on what matters
//   tangent  a tease or a game; length without moving the outcome
//   turn     where it lands — the engine's ending
//   close    the walk back
// {pa}/{pb} are their partners, only behind taken/bTaken; {x} is whoever the
// scene it follows was with, only behind `after`. Every movement but the open
// carries at least one real, long turn: that is how the villa talks
// (docs/pm-dialogue-style.md §1).
import { build } from './build.js';

const LANDS = ['flirt', 'kissed', 'promised'];

export const PULL = build('pull', {
  // What a pull can follow: somebody else's chat or date, or a challenge kiss.
  after: ['pull', 'date', 'game-kiss'],
  plans: {
    // A chat that ends in a no has no games in it.
    featured: [
      { when: { end: 'turned-down' }, plan: ['open', 'why', 'answer', 'probe?', 'turn', 'close'] },
      { plan: ['open', 'why', 'answer', 'probe?', 'tangent?', 'turn', 'close'] },
    ],
    short: ['open', 'turn', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} catches {b} on the way back from the kitchen.", turns: [
        ['a', "Have you got a minute? I wanted to grab you for a chat, if that's all right."],
        ['b', "Yeah, of course. Where are we going?"],
        ['a', "Daybeds? It's quieter down that end, and I can't think with everyone shouting over the music."],
        ['b', "Lead the way, then."],
      ] },
      { when: { bTaken: true }, stage: "{a} walks over to where {b} is sitting with {pb}.", turns: [
        ['a', "Sorry to interrupt. {b}, can I borrow you for a bit?"],
        ['b', "Me? Yeah. Yeah, go on."],
        ['a', "I'll bring you back in one piece, I promise. Ten minutes, tops."],
      ], beat: "{b} gives {pb} a quick look before getting up." },
      { when: { justMet: true }, stage: "{a} finds {b} by the pool.", turns: [
        ['a', "Hiya. I don't think we've really spoken yet, have we?"],
        ['b', "Not really. Just the hello when everyone was meeting everyone, and then it all went a bit mad."],
        ['a', "Well, that's not good enough. Can I steal you?"],
        ['b', "Go on then. Steal away."],
      ] },
      { when: { reg: 'flirty' }, stage: "{a} sits down on the end of {b}'s sun lounger.", turns: [
        ['a', "I've been trying to get you on your own all day, and every time I get close, someone else swoops in."],
        ['b', "Have you now?"],
        ['a', "I have. So have you got a minute, or are you going to make me beg?"],
        ['b', "I might make you beg a little bit. Go on, budge up."],
      ] },
      { when: { reg: 'nervy' }, stage: "{a} hovers next to {b} for a second before speaking.", turns: [
        ['a', "Hey, sorry, are you busy? I just — I was wondering if I could talk to you. Only if you want to, obviously, you don't have to."],
        ['b', "Yeah, of course I want to. Why are you being all nervous?"],
        ['a', "I'm not nervous. Okay, I'm a bit nervous."],
        ['b', "Come and sit down, you weirdo."],
      ] },
      { when: { reg: 'big' }, stage: "{a} stands up in the middle of the daybeds.", turns: [
        ['a', "Right, everyone, I'm taking {b} for a chat. Nobody panic, I'll bring {b.obj} back in one piece, probably."],
        ['b', "Oh my God, can you not announce it to the whole villa?"],
        ['a', "Too late, they all heard. Come on, before I lose my nerve."],
      ], beat: "{b} gets up, laughing, and follows {a} to the swing seats." },
      { when: { reg: 'sharp' }, stage: "{a} walks straight up to {b}.", turns: [
        ['a', "{b}. Chat. Swing seats. Come on."],
        ['b', "Is that a question or an order?"],
        ['a', "It's a strongly worded question."],
        ['b', "Fine. Strongly worded question accepted."],
      ] },
      { when: { reg: 'dry' }, stage: "{a} leans on the kitchen counter next to {b}.", turns: [
        ['a', "If I asked you for a chat, would you say yes, or would I have to stand here looking stupid in front of everyone?"],
        ['b', "You already look a bit stupid, so you might as well ask."],
        ['a', "Fair. Chat?"],
        ['b', "Go on."],
      ] },
      { when: { reg: 'soft' }, stage: "{a} comes over to {b} with a smile.", turns: [
        ['a', "Hey, you. Can I grab you for five minutes? I feel like we never get a {~proper} sit-down, you and me, and I keep meaning to."],
        ['b', "We don't, do we? Yeah, come on."],
      ] },
      { when: { taken: true }, stage: "{a} waits until {pa} heads inside, then goes over to {b}.", turns: [
        ['a', "You got a minute?"],
        ['b', "I've got loads of minutes. Is {pa} not going to wonder where you are?"],
        ['a', "It's a chat. People are allowed chats in here, that's literally what we're here for."],
        ['b', "If you say so."],
      ] },
      { stage: "{a} sits down next to {b} on the terrace.", turns: [
        ['a', "Is this seat taken?"],
        ['b', "It is now."],
        ['a', "Good, because I was hoping I'd get you on your own at some point today, and this is the first time I've seen you without a crowd."],
        ['b', "Well, here I am. On my own."],
      ] },
      { stage: "{a} brings two drinks over to the daybeds and hands one to {b}.", turns: [
        ['a', "Peace offering."],
        ['b', "Peace offering for what? We haven't fallen out."],
        ['a', "Yet. Can I sit?"],
        ['b', "You brought a drink, you can sit."],
      ] },
      { when: { bReg: 'flirty' }, stage: "{a} leans over the back of {b}'s chair.", turns: [
        ['a', "Can I grab you?"],
        ['b', "You can grab me whenever you like."],
        ['a', "Careful. People are listening."],
        ['b', "Let them listen. Come on."],
      ] },
      { when: { heat: 'steamy' }, stage: "{a} has been looking over at {b} for ages, and finally walks over.", turns: [
        ['a', "I'm going to stop pretending I'm not looking at you and just ask. Chat?"],
        ['b', "I was wondering when you'd come over."],
        ['a', "You noticed, then."],
        ['b', "Everyone noticed. You're not subtle."],
      ] },
      { when: { heat: 'one-sided' }, stage: "{a} catches {b}'s arm by the pool.", turns: [
        ['a', "{b}! Have you got a sec?"],
        ['b', "Er, yeah, I suppose. What's up?"],
        ['a', "Nothing's up, I just want to chat to you. Is that allowed?"],
        ['b', "Okay. Sure. Where do you want to go?"],
      ] },
      { when: { heat: 'cold' }, stage: "{a} goes over to {b} on the daybeds.", turns: [
        ['a', "Can I pull you for a chat?"],
        ['b', "What, now?"],
        ['a', "If that's all right. It won't take long."],
        ['b', "Yeah. Okay. Go on."],
      ] },
      { when: { fresh: true }, stage: "{a}, still new to the villa, walks straight over to {b}.", turns: [
        ['a', "So I've been in here about five minutes, and I already know who I want to talk to first."],
        ['b', "Yeah? Who's that?"],
        ['a', "You, obviously. Come on."],
        ['b', "Well, I can't really say no to that, can I?"],
      ] },
      { stage: "{a} finds {b} sitting on the edge of the pool with {b.posAdj} feet in the water.", turns: [
        ['a', "Mind if I join you?"],
        ['b', "As long as you don't push me in."],
        ['a', "I wasn't going to. I am now, obviously, now you've put the idea in my head."],
        ['b', "Don't you dare. Sit."],
      ] },
      { when: { after: 'pull', afterBy: 'b' }, stage: "{a} comes over to {b} by the pool.", turns: [
        ['a', "Have you got a minute, or is everyone wanting a chat with you today?"],
        ['b', "What's that supposed to mean?"],
        ['a', "Nothing. I saw you with {x} earlier. Just thought I'd join the queue."],
        ['b', "There's no queue. Sit down."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'both' }, stage: "{a} finds {b} after the challenge.", turns: [
        ['a', "So. Are we going to talk about that kiss, or are we pretending it didn't happen?"],
        ['b', "I was hoping you'd bring it up first, to be honest."],
        ['a', "Well, I have. Come on, let's go somewhere where everyone isn't staring at us."],
      ] },
      { stage: "{a} taps {b} on the shoulder.", turns: [
        ['a', "You. Me. Five minutes."],
        ['b', "Only five?"],
        ['a', "Let's see how it goes. Could be six."],
      ] },
      { when: { phase: 'morning' }, stage: "{a} hands {b} a cup of tea on the terrace.", turns: [
        ['a', "Made you one. Don't say I never do anything for you."],
        ['b', "Thank you. What do you want?"],
        ['a', "Charming. Just a chat. Sit with me for a bit?"],
        ['b', "Go on then. Seeing as you made me a tea."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} catches {b} as everyone starts heading in.", turns: [
        ['a', "Before everyone goes in, can I grab you quickly?"],
        ['b', "Yeah. What's up?"],
        ['a', "Nothing's up. I just want to sit with you for a bit while it's quiet."],
      ] },
      { when: { bReg: 'dry' }, stage: "{a} sits down next to {b} on the swing seats.", turns: [
        ['a', "Can I chat to you?"],
        ['b', "You already are."],
        ['a', "You know what I mean."],
        ['b', "I do. Go on, then."],
      ] },
      { when: { bReg: 'big' }, stage: "{a} waves {b} over to the daybeds.", turns: [
        ['a', "{b}! Come here, I want you."],
        ['b', "Oh my God, in front of everyone? Okay, I'm coming!"],
        ['a', "For a chat. I want you for a chat."],
        ['b', "That's what I meant. Obviously that's what I meant."],
      ] },
      { when: { bTaken: true, reg: 'flirty' }, stage: "{a} slides in next to {b} on the daybed.", turns: [
        ['a', "Don't tell {pb}, but I've been dying to talk to you all day."],
        ['b', "I'm not telling {pb} anything. Go on, then. Talk."],
      ] },
    ],

    why: [
      { when: { known: true }, turns: [
        ['a', "So I'll be honest with you. I've wanted to get to know you since the first day, and with everything going on in here, the recouplings and the drama and all of it, I just never got the chance."],
        ['b', "Since the first day? You've kept that quiet."],
        ['a', "I didn't want to make it weird. But I'm sitting here now, so."],
        ['b', "So you are."],
      ] },
      { when: { bFresh: true }, turns: [
        ['a', "I'm not going to lie, when you walked in, I was like, okay, I need to know more about that one. Everyone was looking at each other trying to work out who you'd go for, and I was just looking at you."],
        ['b', "That's very forward."],
        ['a', "Is it too much?"],
        ['b', "No. No, I like forward."],
      ] },
      { when: { fresh: true }, turns: [
        ['a', "So obviously I've only just got here, and I'm trying to chat to everyone, because you have to, don't you? But you were the one I clocked first, if I'm honest."],
        ['b', "Was I?"],
        ['a', "You were. Is that all right?"],
        ['b', "Yeah. It's more than all right."],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "Look, I know you're with {pb}, and I'm not trying to step on anyone's toes. But I'd be lying if I said I hadn't been thinking about you, and I'd rather say it than sit there wondering what would have happened if I had."],
        ['b', "Okay. That's... honest."],
        ['a', "I'm always honest. It gets me in a lot of trouble."],
      ] },
      { when: { taken: true }, turns: [
        ['a', "Me and {pa} are fine, before you ask. It's just — it's early, isn't it? And you're meant to keep your options open, and I'd be lying if I said I hadn't noticed you."],
        ['b', "Does {pa} know you're over here noticing people?"],
        ['a', "{pa} knows I'm having a chat. That's all this is."],
        ['b', "Right. A chat."],
      ] },
      { when: { taken: true, bTaken: true }, turns: [
        ['a', "I know we're both coupled up, and this is probably going to look a bit dodgy from over there."],
        ['b', "A bit, yeah."],
        ['a', "But we never talk, and I genuinely think we'd get on. I'm not trying to start anything. I just think it'd be mad to go the whole way through this and never have a conversation with you."],
        ['b', "That's all it is, is it?"],
        ['a', "For now."],
      ] },
      { when: { after: 'pull', afterBy: 'b' }, turns: [
        ['a', "I saw you having a chat with {x} earlier, and I thought, right, if I don't get in there now, I'm never going to, because everyone's going to be after you."],
        ['b', "So this is a competition now?"],
        ['a', "Everything's a competition in here."],
        ['b', "Fair enough."],
      ] },
      { when: { after: 'date', afterBy: 'b' }, turns: [
        ['a', "I'm not going to lie, watching you go off on that date with {x} did something to me. I was sitting by the pool the whole time thinking, why didn't I say anything when I had the chance?"],
        ['b', "Did it now?"],
        ['a', "It did. So I thought I'd better say something before it's too late."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'b' }, turns: [
        ['a', "I saw that kiss with {x} in the challenge, and I'll be honest, I was a bit jealous, which is mad, because we've barely spoken."],
        ['b', "Jealous? We haven't even had a chat yet."],
        ['a', "Exactly. That's why I'm fixing it now."],
      ] },
      { when: { after: 'game-kiss', afterBy: 'both' }, turns: [
        ['a', "I've been thinking about that kiss since it happened. I don't know if it was just the game, but it didn't feel like just a game to me, and I needed to know if it was only me."],
        ['b', "No. It didn't to me either, if I'm honest."],
        ['a', "Good. I thought I'd made it up in my head."],
      ] },
      { turns: [
        ['a', "Everyone keeps telling me we'd get on, and I've only just realised we've barely said two words to each other this whole time."],
        ['b', "Who's everyone?"],
        ['a', "Just people. The villa. You know what it's like in here, everyone's got an opinion on who should be with who."],
        ['b', "They do. It's exhausting."],
      ] },
      { turns: [
        ['a', "I just think you're interesting, and I never get a chance to talk to you on your own. There's always someone around, or you're off with someone, or I am."],
        ['b', "There's always someone around in here. That's the whole place."],
        ['a', "Well, there's no one around now."],
        ['b', "No. There isn't."],
      ] },
      { when: { reg: 'flirty' }, turns: [
        ['a', "Do you want the honest reason or the polite reason?"],
        ['b', "Honest, obviously."],
        ['a', "I think you're {~fit}, and I wanted an excuse to sit next to you, and this was the best I could come up with."],
        ['b', "And the polite reason?"],
        ['a', "I wanted a chat."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I don't really do the hanging around thing. If I like someone, I'd rather just say it and find out where I stand than spend a week dropping hints. So I'm saying it."],
        ['b', "Okay. Straight to it, then."],
        ['a', "Always. Life's too short, and this villa's even shorter."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "I don't really know how to say this without it sounding weird, so I'm just going to say it. I think you're lovely, and I'd like to get to know you, and I'm aware I've just said that really fast."],
        ['b', "You did say that really fast."],
        ['a', "Sorry."],
        ['b', "Don't be sorry. It was cute."],
      ] },
      { when: { reg: 'dry', known: true }, turns: [
        ['a', "I'll be honest, I've been working up to this for about two days, and I've decided I'm overthinking it, so I'm just going to sit here and see what happens."],
        ['b', "Two days?"],
        ['a', "Two days. I'm very slow. It's one of my best qualities."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "So I said to myself, today's the day. I'm getting {b} on {b.posAdj} own, and I'm finding out what {b.posAdj} story is, and I'm not leaving until I know."],
        ['b', "And here we are."],
        ['a', "Here we are! I'm actually really proud of myself."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "I just feel like you're one of the nicest people in here, and I don't think I've ever actually told you that. You're always looking after everyone, and nobody ever looks after you."],
        ['b', "Stop. You're going to make me go red."],
        ['a', "Good. I mean it, though."],
      ] },
      { when: { heat: 'one-sided' }, turns: [
        ['a', "I'm going to be honest. I think there's something there between us, and I wanted to see if you felt it too, because I'd rather know than keep guessing."],
        ['b', "Okay. I mean, I don't know yet. We've not really spoken."],
        ['a', "That's what this is for."],
      ] },
      { when: { heat: 'light' }, turns: [
        ['a', "I don't even know if I'm here to {~crack-on} or just to chat, if I'm honest. I just think you're a laugh, and I've had a really heavy day, and I wanted to be around someone who makes me laugh."],
        ['b', "I'll take that."],
        ['a', "Good. Let's start there."],
      ] },
      { when: { heat: 'steamy' }, turns: [
        ['a', "I've been sitting over there trying to have a normal conversation with everyone else, and I just keep looking over at you. Like, I've lost track of three conversations. So I gave up."],
        ['b', "I noticed."],
        ['a', "You noticed?"],
        ['b', "I was looking back."],
      ] },
      { when: { heat: 'cold' }, turns: [
        ['a', "I just feel like I've not really given you a chance since you've been here, and that's not fair, so I wanted to put that right."],
        ['b', "Okay. That's nice of you."],
        ['a', "I'm a nice person. Sometimes."],
      ] },
      { when: { intent: 'fun' }, turns: [
        ['a', "I'm not going to sit here and pretend I'm looking for someone to marry. I'm here to have fun and see what happens, and you look like the most fun person in this villa."],
        ['b', "I am fun."],
        ['a', "See? I knew it."],
      ] },
      { when: { intent: ['love', 'settle-down', 'first-love'] }, turns: [
        ['a', "I came in here wanting something real. And I don't want to look back at the end and think, I never even spoke to {b}. So here I am, speaking to you."],
        ['b', "That's really sweet, actually."],
        ['a', "I have my moments."],
      ] },
    ],

    answer: [
      { when: { bTaken: true, end: 'turned-down', known: true }, turns: [
        ['a', "So how's it going with {pb}? Honestly."],
        ['b', "Honestly? It's really good. Like, I wasn't sure at the start, I'm not going to lie, but the last couple of days something's just clicked. I wake up and I'm happy {pb}'s there, and I don't really want to mess that up for the sake of a chat, do you know what I mean?"],
        ['a', "No, I get it. That's fair."],
      ] },
      { when: { bTaken: true, end: 'turned-down' }, turns: [
        ['a', "How are you finding it with {pb}?"],
        ['b', "It's early, obviously, but I've got a good feeling. {pb}'s the one I walked in wanting to get to know, and so far I'm not disappointed. So I'm kind of just focused on that, if that makes sense."],
        ['a', "It does. It makes sense."],
      ] },
      { when: { bTaken: true, end: LANDS }, turns: [
        ['a', "How are things with {pb}? You can be honest with me."],
        ['b', "It's good. It's... it's fine. We get on, we have a laugh, but I keep waiting for that spark and it's just not quite there yet, do you know what I mean? And I feel bad even saying that, because {pb}'s lovely."],
        ['a', "Not quite there yet, or not there at all?"],
        ['b', "I don't know. That's the honest answer. I don't know."],
      ] },
      { when: { bTaken: true, end: LANDS }, turns: [
        ['a', "Are you happy with {pb}?"],
        ['b', "I'm... yeah. I'm happy. I think. I mean, you don't come in here and get it right first time, do you? Everyone says that. So I'm happy, but I'm not closed off, if that's what you're asking."],
        ['a', "That's exactly what I'm asking."],
        ['b', "Well, there's your answer."],
      ] },
      { when: { bTaken: true, heat: 'steamy', end: LANDS }, turns: [
        ['a', "Can I ask you something, and you just tell me the truth?"],
        ['b', "Depends what it is."],
        ['a', "Is your head fully with {pb}?"],
        ['b', "Do you want the truth? Then no. Not fully. Not right now. And I don't know what to do about that, because {pb} hasn't done anything wrong."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "So what are you actually looking for in here?"],
        ['b', "Someone I can have a laugh with, honestly. I've had the serious, moody type before and I'm done with it. I want someone who'll make me laugh when I'm having a bad day, someone I can be a bit of an idiot around. And obviously I want to {~fancy} them, I'm not going to lie."],
        ['a', "Obviously."],
        ['b', "That's the easy bit, though. The rest is harder."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "What's your type, then? On paper."],
        ['b', "On paper? Tall, dark hair, a bit {~cheeky}. But then I always end up with the complete opposite, so I don't really trust my type anymore. I think I just want someone who's kind, and who actually texts back."],
        ['a', "Who actually texts back. High standards."],
        ['b', "You'd be surprised how high."],
      ] },
      { when: { bTaken: false, justMet: true }, turns: [
        ['a', "Tell me about you, then. What do I need to know?"],
        ['b', "Oh God, where do I start? I'm a massive softie, even though I don't look it. I'm loyal to a fault. And I'm terrible at being single. Like, I'm not one of those people who loves the single life. I want someone to come home to, you know?"],
        ['a', "A massive softie. Noted."],
        ['b', "Don't tell anyone. I've got a reputation."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "How come you're single, then? Because I don't get it."],
        ['b', "That's a nice way of asking. Honestly, I think I've just picked the wrong people. I've always gone for the ones who are a bit of a project, and then I end up doing all the work. I came in here to stop doing that."],
        ['a', "So no projects."],
        ['b', "No projects. Unless they're really worth it."],
      ] },
      { when: { bTaken: false, bReg: 'dry' }, turns: [
        ['a', "So what's your deal?"],
        ['b', "My deal? I don't have a deal. I came in here because my friends said I'd never do it, so now I'm here out of spite, basically. And then I got here and realised I actually do want to meet someone, which was very annoying."],
        ['a', "Out of spite."],
        ['b', "And for love. Mostly spite. A bit of love."],
      ] },
      { when: { bReg: 'soft' }, turns: [
        ['a', "What are you hoping to get out of all this?"],
        ['b', "Honestly, I just want to meet someone who makes me feel safe. That sounds really soppy, but it's true. I've been with people where I was always on edge, always checking where I stood, and I don't want that again. I want calm."],
        ['a', "That's not soppy. That's nice."],
        ['b', "You'd be the first person to say that."],
      ] },
      { when: { bReg: 'big', bTaken: false }, turns: [
        ['a', "Go on, then, sell yourself. Why should I be pulling you for chats?"],
        ['b', "Oh, where do I start? I'm loud, I'm fun, you'll never be bored, I'll eat your food without asking, and I'm the best dancer in this villa, and I'll fight anyone who says otherwise."],
        ['a', "Eat my food without asking?"],
        ['b', "That's the only downside. I'm upfront about it."],
      ] },
      { when: { bReg: 'sharp' }, turns: [
        ['a', "What do you actually want from someone?"],
        ['b', "Honesty. That's it. Tell me the truth, even if I'm not going to like it. I can handle pretty much anything except being lied to. The second I catch someone lying, I'm done. I don't care how much I like them."],
        ['a', "No second chances at all?"],
        ['b', "None. So don't lie to me."],
      ] },
      { when: { bReg: 'nervy' }, turns: [
        ['a', "How are you finding it in here?"],
        ['b', "Honestly? It's a lot. I keep thinking everyone's talking about me, and I know they're probably not, but my head just goes there. Like, I'll see two people whispering and I'm straight away like, what have I done? So sorry if I'm a bit all over the place."],
        ['a', "You're not all over the place. You're fine."],
        ['b', "Thank you. That actually helps."],
      ] },
      { when: { bReg: 'flirty', bTaken: false }, turns: [
        ['a', "So who's caught your eye in here?"],
        ['b', "Who's caught my eye? Well, I've got a few people I want to get to know. And one of them might be sitting quite close to me right now, but I'm not saying who."],
        ['a', "Might be?"],
        ['b', "Might be. Depends how this chat goes."],
      ] },
      { when: { bTaken: false, end: 'turned-down' }, turns: [
        ['a', "So who are you most interested in, in here?"],
        ['b', "I'm still working it out, to be honest. There are a couple of people I want to get to know a bit better, and I don't want to rush into anything. I've rushed before and it never ends well."],
        ['a', "That's fair."],
      ] },
      { when: { taken: true }, turns: [
        ['b', "Can I ask you something? Why are you over here talking to me when you're with {pa}?"],
        ['a', "Because I don't know where me and {pa} are, honestly. We get on, we're good friends, but I don't know if it's going anywhere, and I'd rather find that out now than in three weeks' time when it's too late."],
        ['b', "That's fair enough, I suppose."],
        ['a', "I'm not trying to be sly about it. I just want to know."],
      ] },
      { when: { taken: true, end: 'turned-down' }, turns: [
        ['b', "Is {pa} all right with you being over here?"],
        ['a', "It's just a chat."],
        ['b', "Is it, though?"],
        ['a', "Mostly. I don't know. I'm just seeing where my head's at, and I thought I'd rather be honest about it than sneak around."],
      ] },
      { when: { bFresh: true }, turns: [
        ['a', "So how are you finding it so far? It must be mad, walking into a villa where everyone already knows each other."],
        ['b', "It's mental. Everyone's being really nice, but you can feel everyone sizing you up, do you know what I mean? Especially the ones who are coupled up. I can see them all holding on a bit tighter."],
        ['a', "Can you blame them?"],
        ['b', "Not really, no."],
      ] },
      { when: { fresh: true }, turns: [
        ['b', "So come on, how does it feel, being the new one?"],
        ['a', "Weird. I thought I'd be really confident, and then I walked down those steps and everyone was just staring at me, and I forgot how to walk. Like, actually forgot how legs work."],
        ['b', "I didn't notice."],
        ['a', "You're a liar, but thank you."],
      ] },
      { when: { bTaken: false, known: true }, turns: [
        ['a', "Can I ask, why haven't you really been grafting on anyone?"],
        ['b', "I have! Sort of. I don't know. I think I've been waiting for someone to come along who actually makes me nervous. Everyone in here's lovely, but nobody's given me that feeling yet, you know, the butterflies."],
        ['a', "Nobody?"],
        ['b', "Nobody yet. I said yet."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "What's the worst thing someone could do, in here, to put you off?"],
        ['b', "Play games. If I see someone telling one person one thing and someone else another, I'm out. I've been with someone like that, and I'm not doing it again. I'd rather be single for the whole summer."],
        ['a', "The whole summer?"],
        ['b', "Well. Most of it."],
      ] },
      { when: { bTaken: true, bReg: 'dry' }, turns: [
        ['a', "How's {pb}?"],
        ['b', "{pb}'s fine. {pb}'s always fine. That's sort of the problem, if I'm honest. Everything's just fine, all the time, and I didn't come in here for fine."],
        ['a', "That doesn't sound great."],
        ['b', "It's not bad. It's just fine."],
      ] },
    ],

    probe: [
      { when: { bTaken: true, end: LANDS }, turns: [
        ['a', "Can I say something, and you don't take it the wrong way?"],
        ['b', "Go on."],
        ['a', "When you talk about {pb}, you don't light up. You just don't. And I've seen you light up in here, so I know what it looks like, and that wasn't it."],
        ['b', "That's quite a lot to say to someone."],
        ['a', "I know. But I'm right, aren't I?"],
        ['b', "Maybe a little bit."],
      ] },
      { when: { bTaken: true, end: 'turned-down' }, turns: [
        ['a', "And you're sure you're not just staying with {pb} because it's easy?"],
        ['b', "Easy? Nothing about this place is easy. No, I'm with {pb} because I want to be. Every time something's happened in here, {pb} has been there. I know that's not what you want to hear."],
        ['a', "It's not. But fair play."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "And is there anyone in here who's actually ticking those boxes?"],
        ['b', "There might be."],
        ['a', "Might be?"],
        ['b', "I'm not giving you a name. You'd only get a big head, and then you'd be unbearable at dinner."],
      ] },
      { when: { heat: 'steamy' }, turns: [
        ['a', "Why are you smiling like that?"],
        ['b', "Like what?"],
        ['a', "Like you know something I don't."],
        ['b', "I'm just enjoying the chat. And the view, if I'm honest. I'm not going to sit here and pretend I haven't been looking at you since you sat down."],
      ] },
      { when: { heat: 'one-sided' }, turns: [
        ['a', "You've gone a bit quiet on me."],
        ['b', "Have I? Sorry, I'm just listening."],
        ['a', "You can tell me if I'm talking too much. I do it when I'm nervous, and I'm a bit nervous."],
        ['b', "You're not. It's fine. Honestly."],
      ] },
      { when: { heat: 'light' }, turns: [
        ['a', "Can I be honest? I'm getting really nice vibes off this. Not crazy, can't-stop-thinking-about-you vibes, but nice ones."],
        ['b', "Same, actually. Is that bad?"],
        ['a', "No. Nice is good. Nice is underrated."],
      ] },
      { when: { taken: true }, turns: [
        ['b', "And what happens when {pa} asks what we were talking about?"],
        ['a', "I'll tell the truth. We were getting to know each other."],
        ['b', "And {pa}'s going to be fine with that? Because if it was me, I wouldn't be fine with it. I'd be sitting over there counting the minutes."],
        ['a', "I don't know. We'll find out."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "I'm just going to ask you straight. Do you {~fancy} me or not?"],
        ['b', "Wow. Okay. Straight in."],
        ['a', "I told you, I don't hang around."],
        ['b', "And I'm telling you, you're going to have to wait for that one. I'm not giving it all away in the first ten minutes."],
      ] },
      { when: { reg: 'flirty', heat: ['flirty', 'steamy'] }, turns: [
        ['a', "You keep looking at my lips, you know."],
        ['b', "I do not."],
        ['a', "You did it again."],
        ['b', "Stop it. You're making it worse. Now I can't stop thinking about where I'm looking."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "Sorry, I feel like I'm talking way too much. Am I talking too much? I always do this, I get nervous and then I just keep going and going."],
        ['b', "You're fine. Breathe."],
        ['a', "I'm breathing. I'm fine. Okay. Carry on."],
        ['b', "You were the one talking."],
      ] },
      { when: { bTaken: true, known: true, end: LANDS }, turns: [
        ['a', "If {pb} turned round tomorrow and said it was over, how would you feel?"],
        ['b', "Honestly? Sad, I think. But maybe not as sad as I should be. And that's scary to say out loud, because I've been telling everyone I'm happy."],
        ['a', "That says a lot."],
        ['b', "I know it does. Don't make me say any more."],
      ] },
      { when: { bReg: 'dry' }, turns: [
        ['a', "Is that you being serious, or is that you being funny? I can never tell with you."],
        ['b', "Neither can I, to be honest. That's the problem. I say everything with the same face and then people think I'm joking when I'm being really honest."],
        ['a', "Well, I like it, whichever it is."],
      ] },
      { when: { bReg: 'big' }, turns: [
        ['a', "Do you ever stop talking?"],
        ['b', "No. Is that a problem? Because I've been told it's a problem, and I've decided it's everyone else's problem."],
        ['a', "No, I like it. I'm just checking for the future."],
        ['b', "The future? Listen to you."],
      ] },
      { when: { bReg: 'nervy' }, turns: [
        ['b', "Can I ask you something? Why me? There are loads of people in here who are way more your type."],
        ['a', "Because you're the one I want to talk to. It's not that deep."],
        ['b', "It is a bit deep for me."],
        ['a', "Then I'll keep saying it until it isn't."],
      ] },
      { turns: [
        ['a', "What would you say if I asked you to sit with me at the fire pit later?"],
        ['b', "I'd say ask me later and find out. I'm not making it that easy for you."],
        ['a', "You're very hard work, do you know that?"],
        ['b', "Worth it, though."],
      ] },
    ],

    tangent: [
      { turns: [
        ['a', "Quick-fire round. Ready?"],
        ['b', "Go on."],
        ['a', "Morning person or night person?"],
        ['b', "Night, obviously."],
        ['a', "Dogs or cats?"],
        ['b', "Dogs. Anyone who says cats is lying."],
        ['a', "Worst habit?"],
        ['b', "Leaving cups everywhere. Like, everywhere. Half-drunk cups of tea all over the place, it drives everyone mad."],
        ['a', "I can live with that."],
      ] },
      { turns: [
        ['b', "What's the worst chat-up line anyone's ever used on you?"],
        ['a', "Someone once asked me if my dad was a baker."],
        ['b', "Because?"],
        ['a', "Because I had nice buns. In a club. At two in the morning. With a straight face."],
        ['b', "Stop. Did it work?"],
        ['a', "I'm not answering that."],
      ] },
      { turns: [
        ['a', "Can I ask you a random one?"],
        ['b', "Go on."],
        ['a', "What do you miss most from home?"],
        ['b', "My own bed, honestly. And being able to go to the shop on my own without fifteen people asking where I'm going and who I'm going with."],
        ['a', "That's a very good answer."],
      ] },
      { turns: [
        ['a', "What's the first thing you're going to do when you get out?"],
        ['b', "Eat a takeaway in bed and not talk to anyone for a whole day. Phone off, curtains shut, the lot."],
        ['a', "Not even me?"],
        ['b', "Maybe you. Depends how good you are between now and then."],
      ] },
      { turns: [
        ['b', "Have you noticed everyone's doing that thing where they pretend they're not listening?"],
        ['a', "Who?"],
        ['b', "Look behind you. Don't look! Okay, now look, but casually."],
        ['a', "Oh my God, they're all staring."],
        ['b', "Every single one of them. They've been doing it since we sat down."],
      ] },
      { when: { known: true }, turns: [
        ['a', "Tell me something nobody in here knows about you."],
        ['b', "I can't swim. Like, at all."],
        ['a', "You've been sitting next to a pool for days."],
        ['b', "I know. I just stand in the shallow end and look confident, and so far nobody's noticed."],
      ] },
      { turns: [
        ['a', "Be honest, what was your first impression of me?"],
        ['b', "Honestly? I thought you'd be really arrogant. You walked in like you owned the place."],
        ['a', "Wow."],
        ['b', "And then you opened your mouth and I realised you're just a bit of a goof."],
        ['a', "I'll take goof over arrogant."],
      ] },
      { turns: [
        ['a', "What would your friends say about you if they were sitting here?"],
        ['b', "That I'm too nice, that I always go for the wrong ones, and that I talk too much. They'd probably also say I'd be first in the pool after a few drinks."],
        ['a', "That talking one's true."],
        ['b', "Oi. Rude."],
      ] },
      { turns: [
        ['b', "Can I say something a bit weird?"],
        ['a', "Always."],
        ['b', "You've got really nice hands."],
        ['a', "My hands?"],
        ['b', "I notice hands. Don't judge me. It's the first thing I look at, and then the smile."],
        ['a', "I'm judging you a little bit."],
      ] },
      { when: { heat: ['flirty', 'steamy'] }, turns: [
        ['a', "If we were on the outside right now, where would I be taking you?"],
        ['b', "Somewhere with good food. I don't care where, as long as the food's good and nobody's watching us eat it."],
        ['a', "Nobody watching. That'd make a change."],
      ] },
      { turns: [
        ['b', "Do you ever forget there are cameras everywhere?"],
        ['a', "All the time. And then I remember, and I think about everything I've said that day, and I want the ground to swallow me up."],
        ['b', "Same. Every single day."],
      ] },
      { when: { heat: ['flirty', 'steamy'] }, turns: [
        ['a', "Are you a good kisser? Be honest."],
        ['b', "I've had no complaints."],
        ['a', "That's not an answer."],
        ['b', "That's the only answer you're getting. You'll have to find out the old-fashioned way."],
      ] },
      { turns: [
        ['a', "Do you think we'd have got on if we'd met on the outside?"],
        ['b', "Probably not, actually. I'd have been too scared to talk to you."],
        ['a', "Scared of me?"],
        ['b', "You look scary. You're not, though. You're a teddy bear."],
      ] },
      { turns: [
        ['a', "Can I tell you a secret?"],
        ['b', "Yes, please."],
        ['a', "I practised what I was going to say to you, like, actually rehearsed it in my head, and I've forgotten all of it."],
        ['b', "That's actually quite cute."],
      ] },
      { when: { heat: ['flirty', 'steamy'], known: true }, turns: [
        ['b', "Is it weird that it already feels like we've known each other for ages?"],
        ['a', "Not weird. Everything's like that in here. A day's like a week."],
        ['b', "So we've basically been together a month."],
        ['a', "Steady on."],
      ] },
      { turns: [
        ['a', "Right, I've got a question, and I need an honest answer, because it could change everything."],
        ['b', "Okay..."],
        ['a', "Pineapple on pizza."],
        ['b', "Yes. Obviously yes."],
        ['a', "I think we're done here."],
        ['b', "Sit back down. Sit down."],
      ] },
      { turns: [
        ['b', "What's the most romantic thing you've ever done for someone?"],
        ['a', "I once drove three hours to bring someone soup when they were ill."],
        ['b', "Soup?"],
        ['a', "Good soup. Homemade. Well, shop-bought, but I put it in a nice bowl, and I stayed and watched rubbish films with them all night."],
        ['b', "That's actually lovely."],
      ] },
      { turns: [
        ['a', "Rate the villa so far. Out of ten."],
        ['b', "The villa? Seven. The people? Depends who. This chat? Maybe an eight."],
        ['a', "Only an eight?"],
        ['b', "You've got room to improve."],
      ] },
    ],

    turn: [
      { when: { end: 'flirt', heat: 'flirty' }, turns: [
        ['a', "Can I be honest with you?"],
        ['b', "You've been honest this whole time."],
        ['a', "I really like talking to you. Like, more than I thought I would. I came over here thinking it'd be a quick chat, and I don't want it to end."],
        ['b', "I'm enjoying it too. I didn't expect to, if I'm honest."],
        ['a', "Thanks."],
        ['b', "You know what I mean! Stop it."],
      ] },
      { when: { end: 'flirt', heat: ['flirty', 'steamy'] }, turns: [
        ['b', "You know what, you're not what I expected."],
        ['a', "Is that a good thing?"],
        ['b', "It's a very good thing. I thought you'd be all chat and nothing behind it, and you're actually really easy to talk to. I'd like to do this again, if that's all right."],
        ['a', "More than all right."],
      ] },
      { when: { end: 'flirt' }, turns: [
        ['a', "I'm not going to ask for anything. I just want you to know I'm interested, and the ball's in your court. Whatever you want to do with that, I'll respect it."],
        ['b', "The ball's in my court?"],
        ['a', "Fully in your court."],
        ['b', "Okay. I'll have a think about what to do with it."],
      ] },
      { when: { end: 'flirt', bTaken: true }, turns: [
        ['b', "I can't promise anything. I'm with {pb}, and I'm not going to do anything behind anyone's back. That's not who I am, and I'd hate myself."],
        ['a', "I'm not asking you to."],
        ['b', "But I'm glad we talked. I'm really glad."],
        ['a', "Me too."],
      ] },
      { when: { end: 'flirt', heat: ['flirty', 'steamy'] }, turns: [
        ['a', "You've got a really nice smile, you know that?"],
        ['b', "Stop it."],
        ['a', "I'm serious. It does something to me. Every time you laugh at the dinner table, I lose my train of thought."],
        ['b', "It does something to you?"],
        ['a', "Don't make me say it twice."],
        ['b', "I'll make you say it a hundred times."],
      ] },
      { when: { end: 'flirt' }, turns: [
        ['b', "So what happens now?"],
        ['a', "Now we go back, and everyone asks us what we talked about, and we say nothing, and they all know anyway."],
        ['b', "And then?"],
        ['a', "And then we see."],
      ] },
      { when: { end: 'flirt', heat: ['flirty', 'steamy'] }, turns: [
        ['a', "I think there's something here. I don't know what yet, but I'd like to find out, and I don't want to waste any more time not finding out."],
        ['b', "Me too. I think."],
        ['a', "You think?"],
        ['b', "I know. I'm just scared of saying it out loud."],
      ] },
      { when: { end: 'flirt', heat: 'steamy' }, turns: [
        ['a', "If there weren't twenty cameras on us right now..."],
        ['b', "Don't."],
        ['a', "What?"],
        ['b', "Don't finish that sentence. Because if you finish it, I'm going to do something stupid, and then I'm going to have to explain it to everyone."],
      ] },
      { when: { end: 'flirt', heat: 'steamy' }, turns: [
        ['b', "I really want to kiss you right now."],
        ['a', "Then why don't you?"],
        ['b', "Because everyone's watching, and I'm not ready for what happens after. The questions, the looks. I want it to be right."],
        ['a', "Fair enough. I'll wait."],
      ] },
      { when: { end: 'flirt', heat: 'one-sided' }, turns: [
        ['a', "So what do you think? Is there something here?"],
        ['b', "I think you're a really nice person."],
        ['a', "Ouch. That's the nice person speech."],
        ['b', "It's not a speech! I just mean I'd like to get to know you more before I say anything. I'm not good at deciding things in ten minutes."],
        ['a', "Okay. I'll take that."],
      ] },
      { when: { end: 'flirt', heat: 'one-sided' }, turns: [
        ['a', "I feel like I've done all the talking."],
        ['b', "You have a bit."],
        ['a', "Am I scaring you off?"],
        ['b', "No. I'm just a slow burner. I don't really open up straight away, so give me a bit of time and you'll see a different side of me."],
        ['a', "I can do time."],
      ] },
      { when: { end: 'flirt', heat: 'one-sided' }, turns: [
        ['a', "I'm going to be really obvious now. I like you. I've liked you for a while."],
        ['b', "I could tell."],
        ['a', "And?"],
        ['b', "And I'm flattered. Honestly, I am. I just don't know yet, and I don't want to say something I don't mean."],
        ['a', "Don't know yet is better than no."],
      ] },
      { when: { end: 'flirt', heat: 'light' }, turns: [
        ['b', "This has been really nice. Honestly, I could chat to you all day. You're one of the easiest people to be around in here."],
        ['a', "Same. You're really easy to talk to."],
        ['b', "I feel like we'd get on really well, whatever happens."],
        ['a', "Whatever happens. Yeah. I like that."],
      ] },
      { when: { end: 'flirt', heat: 'light' }, turns: [
        ['a', "I don't know if there's a massive spark, if I'm honest, but I like you, and I like being around you, and that's more than I can say for most people in here."],
        ['b', "I like you too. Let's not overthink it."],
        ['a', "Deal. No overthinking."],
      ] },
      { when: { end: 'flirt' }, turns: [
        ['a', "Will you sit with me at the fire pit later?"],
        ['b', "Only if you save me a seat. A good one, not the one at the end where you can't hear anything."],
        ['a', "Done. I'll fight people for it."],
      ] },
      { when: { end: 'flirt', reg: 'big' }, turns: [
        ['a', "I'm just going to say it. I think you're the best thing that's happened to this villa, and I'm including the hot tub in that."],
        ['b', "That's a lot."],
        ['a', "I'm a lot. You'll get used to it."],
        ['b', "I might, actually."],
      ] },
      { when: { end: 'flirt', reg: 'dry' }, turns: [
        ['a', "For the record, this has been the best chat I've had in here."],
        ['b', "Out of how many?"],
        ['a', "Including the ones with the kettle? Loads. The kettle's a very good listener, but it doesn't say much back."],
        ['b', "So I beat the kettle."],
        ['a', "Comfortably."],
      ] },
      { when: { end: 'flirt', bReg: 'nervy' }, turns: [
        ['b', "Can I just say, I'm really bad at this. I never know if someone actually likes me or if they're just being nice, and then I spend the whole night replaying it in my head."],
        ['a', "I'm not just being nice. I like you."],
        ['b', "Okay. Okay, good. I like you too."],
      ] },
      { when: { end: 'flirt', taken: true }, turns: [
        ['b', "I like you. I do. But you need to work out what you're doing with {pa} before anything happens here, because I'm not getting stuck in the middle of something."],
        ['a', "I know."],
        ['b', "I mean it. I'm not being anyone's second option."],
        ['a', "You wouldn't be. I promise."],
      ] },
      { when: { end: 'kissed' }, turns: [
        ['b', "Why are you looking at me like that?"],
        ['a', "Like what?"],
        ['b', "Like you want to kiss me."],
        ['a', "Maybe I do. Maybe I've wanted to since I sat down, and I've been trying to work out if you'd want me to."],
        ['b', "Then do it."],
      ], beat: "{a} leans in, and {b} kisses {a.obj} back." },
      { when: { end: 'kissed' }, turns: [
        ['a', "Can I kiss you?"],
        ['b', "You're asking?"],
        ['a', "I'm a gentleman. And I'd rather ask than get it wrong in front of the whole villa."],
        ['b', "Then yes. You can kiss me."],
      ], beat: "They kiss, quickly, and both look round to see who saw." },
      { when: { end: 'kissed', bTaken: true }, turns: [
        ['b', "I shouldn't do this. I really shouldn't. {pb}'s over there, and I've been telling everyone I'm happy, and I am, sort of."],
        ['a', "Then don't."],
        ['b', "I know."],
      ], beat: "{b} kisses {a.obj} anyway." },
      { when: { end: 'kissed', taken: true }, turns: [
        ['a', "I've been wanting to do this since I sat down."],
        ['b', "What about {pa}?"],
        ['a', "I know. I know. I'm going to have to deal with that, but right now I don't want to think about anything except this."],
      ], beat: "{a} kisses {b}, and neither of them pulls away." },
      { when: { end: 'kissed', heat: 'steamy' }, turns: [
        ['b', "Come here."],
        ['a', "What?"],
        ['b', "Just come here. Stop talking for one second."],
      ], beat: "{b} pulls {a} in and kisses {a.obj}." },
      { when: { end: 'kissed' }, turns: [
        ['a', "I'm going to do something, and you can tell me to stop if you want to."],
        ['b', "I'm not going to tell you to stop."],
      ], beat: "They kiss." },
      { when: { end: 'kissed' }, turns: [
        ['b', "You've got something on your face."],
        ['a', "Have I? Where?"],
        ['b', "Just there."],
      ], beat: "{b} leans in and kisses {a.obj} instead. {a} laughs into it." },
      { when: { end: 'kissed', reg: 'nervy' }, turns: [
        ['a', "Is it okay if I kiss you? Sorry. That was a really weird way to ask. I've been building up to it for about ten minutes."],
        ['b', "It wasn't weird. Yes."],
      ], beat: "They kiss, and {a} laughs with relief." },
      { when: { end: 'kissed', reg: 'sharp' }, turns: [
        ['a', "I'm going to kiss you now."],
        ['b', "Are you?"],
        ['a', "Unless you've got a problem with it."],
        ['b', "No problem at all."],
      ], beat: "They kiss." },
      { when: { end: 'kissed' }, turns: [
        ['b', "We're going to get in so much trouble for this. You know that, right? Everyone's going to want to know everything."],
        ['a', "Is that a no?"],
        ['b', "No. It's not a no."],
      ], beat: "{a} kisses {b}, and for a second neither of them cares who's watching." },
      { when: { end: 'promised', taken: true }, turns: [
        ['a', "Can I say something? If we were on the outside right now, I'd be taking you out for dinner tomorrow. No question. I'd have already asked."],
        ['b', "We're not on the outside."],
        ['a', "Not yet."],
        ['b', "You can't say that when you're with {pa}."],
        ['a', "I know I can't. I'm saying it anyway."],
      ] },
      { when: { end: 'promised', taken: true }, turns: [
        ['a', "When we get out of here, I want to see you. Away from all of this, away from the cameras and the recouplings and everyone having an opinion."],
        ['b', "Are you serious?"],
        ['a', "Deadly serious."],
        ['b', "And {pa}?"],
        ['a', "I don't know yet. But I know I want to see you."],
      ] },
      { when: { end: 'promised', taken: true }, turns: [
        ['b', "What are we doing here?"],
        ['a', "I don't know. But I keep thinking about what it'd be like with you on the outside. Weekends away, meeting your friends, all of it. I've pictured it, and I shouldn't have."],
        ['b', "You've thought about it."],
        ['a', "I've thought about it a lot."],
      ] },
      { when: { end: 'promised', taken: true }, turns: [
        ['a', "Promise me something."],
        ['b', "What?"],
        ['a', "Whatever happens in here, when we get out, we go for one drink. Just one. And if it's nothing, it's nothing, but I need to know."],
        ['b', "One drink."],
        ['a', "One drink. And then we'll see."],
        ['b', "Okay. I promise."],
      ] },
      { when: { end: 'promised', taken: true }, turns: [
        ['b', "You're going to get me into trouble."],
        ['a', "I'm not. I'm just saying, when this is all over, I want to take you somewhere nice. Somewhere without cameras, where we can actually talk without someone walking past every two minutes."],
        ['b', "You're with {pa}."],
        ['a', "In here I am."],
      ] },
      { when: { end: 'turned-down', bTaken: true }, turns: [
        ['b', "Look, I think you're lovely, I really do. But I'm happy with {pb}, and I don't want to start something that's going to hurt anyone. I'd never forgive myself."],
        ['a', "No, I get it. Honestly, I do."],
        ['b', "Are you okay?"],
        ['a', "I'm fine. I'd rather know now than find out in a week."],
      ] },
      { when: { end: 'turned-down' }, turns: [
        ['b', "I'm going to be honest with you, because I'd want someone to be honest with me. I don't think I see it going anywhere. Not as more than friends. And I'd rather say that now than let you think something's there."],
        ['a', "Right. Okay. No, that's... thanks for saying it."],
        ['b', "I'm sorry."],
        ['a', "Don't be. It's fine. Really."],
      ] },
      { when: { end: 'turned-down', reg: 'sharp' }, turns: [
        ['b', "I just don't feel it, I'm sorry."],
        ['a', "That's fine. Your loss."],
        ['b', "Wow."],
        ['a', "I'm joking. Kind of. No, it's fine. I'd rather you said it than strung me along for a week."],
      ] },
      { when: { end: 'turned-down', reg: 'big' }, turns: [
        ['b', "I don't think it's a romantic thing for me."],
        ['a', "Brutal. Absolutely brutal. I'm going to go and lie face down in the pool and think about my life."],
        ['b', "Please don't."],
        ['a', "I'm fine! I'm fine. I'm a little bit fine."],
      ] },
      { when: { end: 'turned-down', reg: 'soft' }, turns: [
        ['b', "I'm sorry. I just don't see us that way."],
        ['a', "That's okay. Really. I'd rather we were friends than nothing, and I think we'd be really good friends."],
        ['b', "Friends I can definitely do."],
        ['a', "Good. Come here."],
      ], beat: "They hug." },
      { when: { end: 'turned-down', reg: 'dry' }, turns: [
        ['b', "I don't think there's anything there, if I'm honest."],
        ['a', "No, totally. I was mainly here for the swing seat anyway. It's the best seat in the villa."],
        ['b', "Really?"],
        ['a', "No. But let me have this one."],
      ] },
      { when: { end: 'turned-down', reg: 'nervy' }, turns: [
        ['b', "I don't want to lead you on, so I'm just going to say it. It's not a romantic thing for me."],
        ['a', "No, no, of course. God. Sorry. I've made it weird. I've totally made it weird, haven't I?"],
        ['b', "You haven't made it weird."],
        ['a', "I've made it a bit weird."],
      ] },
      { when: { end: 'turned-down', reg: 'flirty' }, turns: [
        ['b', "You're a charmer, I'll give you that. But it's not going to happen."],
        ['a', "Never say never."],
        ['b', "I'm saying never."],
        ['a', "I heard maybe."],
        ['b', "You heard never. Very clearly, never."],
      ] },
      { when: { end: 'turned-down', bTaken: true, known: true }, turns: [
        ['b', "I've been with {pb} a while now, and I'm not throwing that away for a chat on a swing seat. Sorry. I know that sounds harsh."],
        ['a', "Don't be sorry. I'd think less of you if you did."],
        ['b', "Thanks. I think."],
      ] },
      { when: { end: 'turned-down', justMet: true }, turns: [
        ['b', "It's really early, and I want to talk to everyone before I start getting my head turned. So I'm not saying no forever. I'm just saying no for now."],
        ['a', "No for now. I can work with that."],
        ['b', "Don't work with it too hard."],
      ] },
      { when: { end: 'turned-down', taken: true }, turns: [
        ['b', "Honestly? Sort things out with {pa} first. I'm not getting involved in something that's already messy, and from where I'm sitting, it looks messy."],
        ['a', "That's fair."],
        ['b', "It is fair. And I think deep down you know it is."],
      ] },
      { when: { end: 'turned-down' }, turns: [
        ['b', "Can I be really honest?"],
        ['a', "That doesn't sound good."],
        ['b', "I like you as a person. I really do. But I'm just not attracted to you in that way, and I'd hate for you to waste your time on me when there are people in here who would be."],
        ['a', "Okay. Thank you for being straight with me."],
      ] },
    ],

    close: [
      { when: { end: 'flirt' }, turns: [
        ['a', "We should probably go back before people start talking."],
        ['b', "Too late. They've been talking since we sat down."],
      ], beat: "They walk back to the group, a little too close together." },
      { when: { end: 'flirt', bTaken: true }, turns: [
        ['b', "I'd better get back."],
        ['a', "Go on. Before {pb} sends out a search party."],
      ], beat: "{b} heads back over to {pb}, who has clearly been watching." },
      { when: { end: 'flirt' }, turns: [
        ['a', "Right. I'm going to get a drink before I say something stupid."],
        ['b', "Get me one while you're there."],
        ['a', "Anything for you."],
        ['b', "Now you're just showing off."],
      ] },
      { when: { end: 'flirt' }, turns: [
        ['b', "This was nice."],
        ['a', "It was. Let's do it again."],
        ['b', "Let's."],
      ], beat: "{b} gives {a} a quick hug before they head back." },
      { when: { end: 'flirt', taken: true }, turns: [
        ['a', "I'd better go and find {pa}."],
        ['b', "You'd better."],
      ], beat: "{a} walks back towards the kitchen. {b} watches {a.obj} go." },
      { when: { end: 'flirt' }, turns: [
        ['b', "Everyone's going to ask me how that went."],
        ['a', "What are you going to tell them?"],
        ['b', "That it was fine."],
        ['a', "Just fine?"],
        ['b', "Better than fine. But they don't need to know that."],
      ] },
      { when: { end: 'kissed' }, turns: [
        ['b', "Did anyone see that?"],
        ['a', "I don't think so."],
        ['b', "You don't think so?"],
        ['a', "I'm fairly sure."],
      ], beat: "They head back separately, a minute apart." },
      { when: { end: 'kissed', taken: true }, turns: [
        ['a', "Nobody can know about this. Not yet."],
        ['b', "I'm not going to say anything."],
        ['a', "Okay."],
        ['b', "But you need to sort out what you're doing with {pa}, because I'm not doing this again while you're still coupled up."],
      ] },
      { when: { end: 'kissed', bTaken: true }, turns: [
        ['b', "That can't happen again."],
        ['a', "Okay."],
        ['b', "I mean it."],
        ['a', "I know you do."],
      ], beat: "{b} goes back to {pb} and sits down without a word." },
      { when: { end: 'kissed' }, turns: [
        ['a', "Well. That happened."],
        ['b', "That definitely happened."],
        ['a', "Are you okay?"],
        ['b', "I'm more than okay."],
      ] },
      { when: { end: 'promised', taken: true }, turns: [
        ['a', "This stays between us for now. Yeah?"],
        ['b', "For now."],
      ], beat: "{a} goes back to {pa} as if nothing happened." },
      { when: { end: 'promised' }, turns: [
        ['b', "You'd better mean all that."],
        ['a', "I mean every word."],
      ], beat: "They go back to the others, careful not to look at each other." },
      { when: { end: 'turned-down' }, turns: [
        ['b', "Friends?"],
        ['a', "Friends."],
      ], beat: "They hug, and it's only a little bit awkward." },
      { when: { end: 'turned-down' }, turns: [
        ['a', "Right. I'm going to go and get my dignity back."],
        ['b', "Where's that?"],
        ['a', "Probably in the kitchen somewhere."],
      ] },
      { when: { end: 'turned-down' }, turns: [
        ['b', "Are we okay?"],
        ['a', "We're fine. Honestly. Go on, go back."],
      ], beat: "{a} stays on the swing seat for a bit after {b} has gone." },
      { when: { end: 'turned-down', bTaken: true }, turns: [
        ['b', "I'm going to go back to {pb} now."],
        ['a', "Of course you are. Go on."],
      ], beat: "{pb} asks how it went. {b} just smiles." },
      { when: { end: 'turned-down' }, turns: [
        ['a', "Thanks for being honest, anyway."],
        ['b', "Always."],
      ], beat: "{a} heads back to the daybeds. Nobody asks how it went, and {a} doesn't say." },
    ],
  },

  notes: [
    { when: { end: 'flirt' }, stage: "{a} grabs {b} for a quick chat on the swing seats. They're both smiling when they come back." },
    { when: { end: 'flirt' }, stage: "{a} pulls {b} for a chat by the pool, and they lose track of time." },
    { when: { end: 'flirt', bTaken: true }, stage: "{a} pulls {b} away from {pb} for a chat. {pb} watches the whole thing." },
    { when: { end: 'flirt', taken: true }, stage: "{a} slips away from {pa} for a chat with {b}." },
    { when: { end: 'flirt', justMet: true }, stage: "{a} and {b} get to know each other on the daybeds." },
    { when: { end: 'flirt' }, stage: "{a} and {b} have a flirty chat on the terrace." },
    { when: { end: 'turned-down' }, stage: "{a} pulls {b} for a chat, and gets let down gently." },
    { when: { end: 'turned-down' }, stage: "{a} tries {a.posAdj} luck with {b}. It doesn't go {a.posAdj} way." },
    { when: { end: 'kissed' }, stage: "{a} and {b} sneak off for a chat that ends in a kiss." },
    { when: { end: 'promised' }, stage: "{a} and {b} talk about meeting up on the outside." },
  ],
});
