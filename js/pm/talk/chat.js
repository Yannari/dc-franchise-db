// ══════════════════════════════════════════════════════════════════════
// pm/talk/chat.js — a couple catching up: {a} and {b}, partners
// ══════════════════════════════════════════════════════════════════════
//
// How it ends is the engine's (`end`: warm · easy · flat, from how much they
// like each other). `rung` is where {a} has them on the ladder (coupled ·
// cracking-on · open · closed-off · exclusive · official); `feels` how much {a}
// feels (strong · some · little). `after` is what happened today or yesterday
// that both of them know: a chat or date one of them had with {x}, a kiss in
// a challenge, their row (`rowedToday`), the recoupling that put them here.
//   open    they settle somewhere together
//   catch   how's your day — and the thing that happened, if anything did
//   topic   one subject a couple talks about: the outside, the villa, them
//   tangent a tease or a story
//   feel    where they are with each other — the engine's ending
//   close   how they leave it
import { build } from './build.js';

const SETTLED = ['closed-off', 'exclusive', 'official'];

export const CHAT = build('chat', {
  after: ['pull', 'date', 'game-kiss', 'recoupling', 'knocked-back', 'row', 'told'],
  // A couple who rowed today make up first (tests/pm-script.test.js).
  leads: ['rowedToday'],
  plans: {
    featured: ['open', 'catch', 'topic', 'tangent?', 'feel', 'close'],
    short: ['open', 'feel', 'close'],
  },
  moves: {
    open: [
      { stage: "{a} and {b} curl up together on the daybeds.", turns: [
        ['a', "Come here. I've barely seen you today."],
        ['b', "I know. Everyone keeps stealing you."],
        ['a', "Well, I'm here now. You've got me."],
      ] },
      { stage: "{a} brings {b} a drink and sits down next to {b.obj} by the pool.", turns: [
        ['a', "There you go."],
        ['b', "Oh, you're an angel. What have I done to deserve this?"],
        ['a', "Nothing yet. It's an advance."],
      ] },
      { when: { phase: 'morning' }, stage: "{a} and {b} sit out on the terrace with their teas.", turns: [
        ['a', "Did you sleep all right?"],
        ['b', "Not really. You kept stealing the covers."],
        ['a', "I did not."],
        ['b', "You did. I woke up freezing at about four, and you were wrapped up like a burrito."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} and {b} sit on the swing seats as it gets dark.", turns: [
        ['a', "This is my favourite bit of the day. When it goes all quiet."],
        ['b', "It's never quiet in here."],
        ['a', "Quieter, then. Come here."],
      ] },
      { stage: "{b} lies with {b.posAdj} head in {a}'s lap on the daybed.", turns: [
        ['b', "Can we just stay here forever?"],
        ['a', "We'd get sunburnt."],
        ['b', "Worth it."],
      ] },
      { stage: "{a} finds {b} in the kitchen and wraps {a.posAdj} arms round {b.obj} from behind.", turns: [
        ['b', "Oh, hello, you."],
        ['a', "Hello. Come and sit with me for a bit."],
        ['b', "I'm making a sandwich."],
        ['a', "Bring the sandwich."],
      ] },
      { when: { reg: 'big' }, stage: "{a} jumps onto the daybed next to {b}.", turns: [
        ['a', "Right, I need my {b} time. I've been talking to everyone else all day, and I'm bored of them."],
        ['b', "That's a lovely thing to say about your friends."],
        ['a', "They're fine. You're better."],
      ] },
      { when: { reg: 'soft' }, stage: "{a} sits down beside {b} and takes {b.posAdj} hand.", turns: [
        ['a', "Hey. You all right? You've been a bit quiet."],
        ['b', "I'm fine. I'm just tired, I think."],
        ['a', "Come here, then. Lean on me."],
      ] },
      { when: { rowedToday: true }, stage: "{a} sits down next to {b}, a careful distance away.", turns: [
        ['a', "Can we talk?"],
        ['b', "Yeah. Go on."],
        ['a', "I don't like it when we're like this."],
        ['b', "Neither do I."],
      ] },
      { when: { justMet: true }, stage: "{a} and {b} find a quiet spot together on their first day as a couple.", turns: [
        ['a', "So. Here we are."],
        ['b', "Here we are. Partners."],
        ['a', "It's mad, isn't it? I didn't know you existed this time yesterday."],
      ] },
      { stage: "{a} and {b} sit on the edge of the pool with their feet in the water.", turns: [
        ['b', "I needed this. It's been a long day."],
        ['a', "Every day's a long day in here."],
        ['b', "Today was longer."],
      ] },
      { when: { reg: 'dry' }, stage: "{a} sits down next to {b} and steals one of {b.posAdj} crisps.", turns: [
        ['b', "Excuse me."],
        ['a', "What? We're a couple. What's yours is mine."],
        ['b', "That's not how it works."],
        ['a', "It is now."],
      ] },
    ],

    catch: [
      { turns: [
        ['a', "So how's your day been? I feel like I've been on the other side of the villa from you all day."],
        ['b', "It's been all right, actually. I had a really good chat with the others earlier, and then I fell asleep on a sun lounger and woke up with half a tan. So that's been my day. What about you?"],
        ['a', "Not much, honestly. Mostly missing you."],
        ['b', "Shut up."],
      ] },
      { when: { after: 'pull', afterBy: 'b' }, turns: [
        ['a', "So how was your chat with {x}?"],
        ['b', "It was fine. Honestly, it was nothing. {x} just wanted to get to know me, and I was polite, and that was it."],
        ['a', "Just polite?"],
        ['b', "Just polite. You don't need to worry. I'm sitting here with you, aren't I?"],
      ] },
      { when: { after: 'pull', afterBy: 'a' }, turns: [
        ['b', "Are you going to tell me what that chat with {x} was about, or do I have to guess?"],
        ['a', "It was nothing. {x} pulled me, I went, I came back. I'm not going to lie to you, but there's nothing to tell."],
        ['b', "Nothing at all?"],
        ['a', "Nothing at all. I promise."],
      ] },
      { when: { after: 'date', afterBy: 'b' }, turns: [
        ['a', "Go on, then. How was the date with {x}?"],
        ['b', "It was nice. The food was nice. But I spent the whole time thinking about getting back here, if I'm honest. It's not the same when it's not you."],
        ['a', "You're just saying that."],
        ['b', "I'm not. I swear."],
      ] },
      { when: { after: 'date', afterBy: 'a' }, turns: [
        ['b', "So, the date. With {x}. Tell me everything."],
        ['a', "There's not a lot to tell. It was a nice day out, we had a laugh, but there was no spark. Not like this."],
        ['b', "Not like this?"],
        ['a', "Not like this."],
      ] },
      { when: { after: 'game-kiss' }, turns: [
        ['b', "Can we talk about that challenge?"],
        ['a', "The kiss? It was a game. Everyone was kissing everyone."],
        ['b', "I know it was a game. It still wasn't nice to watch, that's all I'm saying."],
        ['a', "I know. I'm sorry. If it helps, I was thinking about you the whole time."],
        ['b', "That doesn't help, actually. That makes it weirder."],
      ] },
      { when: { after: 'recoupling', afterBy: 'both' }, turns: [
        ['a', "Can I just say, I was so nervous at that recoupling. I thought you might pick someone else."],
        ['b', "Did you? Why?"],
        ['a', "I don't know. I just get in my head. And then you stood up and said my name, and I nearly cried."],
        ['b', "You did a bit."],
        ['a', "I did a bit."],
      ] },
      { when: { after: 'knocked-back', afterBy: 'a' }, turns: [
        ['b', "I heard {x} tried to pull you earlier."],
        ['a', "{x} did. And I said no, straight away, in front of everyone. I want you to know that."],
        ['b', "I know. People told me. I just wanted to hear it from you."],
      ] },
      { when: { after: 'knocked-back', afterBy: 'b' }, turns: [
        ['a', "So {x} came over to you, then."],
        ['b', "{x} did. And I said no. I wasn't even tempted, honestly. I just wanted to come back and sit with you."],
        ['a', "That's what I like to hear."],
      ] },
      { when: { after: 'told', afterBy: 'a' }, turns: [
        ['b', "Are you all right after earlier? That was a lot."],
        ['a', "I'm still taking it in, if I'm honest. My head's all over the place. But I'm glad I'm sitting here with you."],
        ['b', "I'm not going anywhere."],
      ] },
      { when: { rowedToday: true }, turns: [
        ['a', "I'm sorry about earlier. I shouldn't have snapped at you like that. I was tired, and I took it out on you, and that's not fair."],
        ['b', "I'm sorry too. I didn't help."],
        ['a', "Can we just forget it?"],
        ['b', "Already forgotten."],
      ] },
      { turns: [
        ['b', "What have you been doing all day? Every time I looked for you, you'd vanished."],
        ['a', "I was helping in the kitchen, and then I got trapped in a really long chat about nothing, and then I had a nap. Very exciting stuff."],
        ['b', "Sounds it."],
      ] },
      { when: { comfortedYesterday: true }, turns: [
        ['a', "Thank you for yesterday, by the way. For being there when I was struggling."],
        ['b', "You don't need to thank me. That's what I'm here for."],
        ['a', "I know. But I wanted to say it anyway."],
      ] },
      { when: { mood: 'stressed' }, turns: [
        ['b', "You seem stressed. What's going on?"],
        ['a', "I don't know. Everything, nothing. It's just this place. Sometimes it gets on top of me, and I can't explain why. I'm fine. I'm just a bit all over the place today."],
        ['b', "You don't have to be fine with me."],
      ] },
      { when: { bMood: 'jealous' }, turns: [
        ['a', "You've been funny with me all day. What's wrong?"],
        ['b', "Nothing's wrong."],
        ['a', "Something's wrong. Talk to me."],
        ['b', "I just don't like seeing you laughing with everyone else when I'm sitting on my own. I know that's stupid."],
        ['a', "It's not stupid. I'm sorry."],
      ] },
    ],

    topic: [
      { when: { known: true }, turns: [
        ['a', "Do you ever think about what it'll be like on the outside? Like, actually being together without all of this?"],
        ['b', "All the time. Like, what do we even do on a Tuesday night? We've never had a normal Tuesday."],
        ['a', "We'd get a takeaway and watch something rubbish."],
        ['b', "That sounds perfect, honestly. I can't wait for a boring Tuesday with you."],
      ] },
      { turns: [
        ['b', "Can I ask you something? What did your friends say about me, do you think? If they've been watching."],
        ['a', "They'll love you. They'll probably say you're too good for me, and they'll be right."],
        ['b', "Stop it."],
        ['a', "They'll take your side in every argument, I already know it."],
      ] },
      { when: { rung: SETTLED }, turns: [
        ['a', "I keep thinking about how it was at the start, and how it is now. It's mad how different it feels. At the start I didn't know if you even liked me, and now I can't imagine being in here without you."],
        ['b', "You were so shy at the start."],
        ['a', "I was not."],
        ['b', "You were! You couldn't look me in the eye."],
      ] },
      { turns: [
        ['a', "Have you noticed how everyone's started getting really competitive about the challenges?"],
        ['b', "I know! It's a game with whipped cream in it, and people are acting like it's a world final."],
        ['a', "We're definitely winning the next one, though."],
        ['b', "Oh, definitely."],
      ] },
      { when: { feels: 'strong' }, turns: [
        ['a', "Can I tell you something a bit soppy?"],
        ['b', "Always."],
        ['a', "When I wake up and you're there, I'm genuinely happy. Like, before I even open my eyes, I know you're there, and it makes me happy. I've never had that with anyone."],
        ['b', "That's not soppy. That's the nicest thing anyone's ever said to me."],
      ] },
      { turns: [
        ['b', "What's the thing you miss most about home?"],
        ['a', "Honestly? Being able to just go for a walk on my own. Or a drive. Just having five minutes where nobody's watching. What about you?"],
        ['b', "My bed. And {~proper} food. And not having to look nice every single day."],
        ['a', "You don't have to look nice for me."],
        ['b', "I'm not doing it for you, I'm doing it for the nation."],
      ] },
      { when: { justMet: true }, turns: [
        ['b', "So go on, then. What do I need to know about you, now that we're a couple?"],
        ['a', "I snore. Not loudly. Medium. I'm a nightmare in the mornings until I've had a coffee. And I will try to make you laugh at completely the wrong moments."],
        ['b', "The wrong moments?"],
        ['a', "You'll see."],
      ] },
      { when: { rung: ['coupled', 'cracking-on'] }, turns: [
        ['a', "How do you feel about us? Honestly. I won't be offended."],
        ['b', "Honestly? I think it's going well. It's early, and I don't want to rush it, but every day I like you a bit more. That's the honest answer."],
        ['a', "A bit more every day. I'll take that."],
      ] },
      { turns: [
        ['a', "Can I ask you a weird one? What's your favourite thing about me so far?"],
        ['b', "That's not weird, that's just fishing."],
        ['a', "I'm fishing. Answer the question."],
        ['b', "The way you look after everyone. You do it without even noticing. You're always the first one to check if someone's okay."],
        ['a', "Oh. That's actually really nice."],
      ] },
      { when: { weeks: true }, turns: [
        ['b', "I can't believe how long we've been in here. It feels like forever and about five minutes at the same time."],
        ['a', "I know. When I think back to the first week, it's like a different person."],
        ['b', "You're definitely a different person."],
        ['a', "Better or worse?"],
        ['b', "Much better. You're nicer now."],
      ] },
      { turns: [
        ['b', "Who do you think's going to be the next couple to have a massive row?"],
        ['a', "I'm not getting into that. I'm not getting involved."],
        ['b', "Go on. You know you want to."],
        ['a', "Fine. I've got a feeling, but I'm not saying it out loud, because the second I do, they'll all hear it."],
      ] },
      { when: { mood: 'secure' }, turns: [
        ['a', "Do you know what? I feel really settled. Like, for the first time since I walked in, I'm not looking over my shoulder."],
        ['b', "Me too. It's nice, isn't it?"],
        ['a', "It's really nice. I didn't know it could be this calm in here."],
      ] },
      { when: { mood: ['jealous', 'stressed'] }, turns: [
        ['a', "Can I be honest about something? I get really in my head in here. Like, I'll see you talking to someone and I'll spiral, even though I know it's nothing."],
        ['b', "Why didn't you tell me?"],
        ['a', "Because it sounds mad when I say it out loud."],
        ['b', "It doesn't sound mad. Tell me next time, and I'll just come and sit with you."],
      ] },
    ],

    tangent: [
      { turns: [
        ['b', "Do you think we'd win the couple quiz? Like, how well do you actually know me?"],
        ['a', "Test me."],
        ['b', "Favourite food."],
        ['a', "Anything you don't have to cook yourself."],
        ['b', "Okay, that's annoyingly right."],
      ] },
      { turns: [
        ['a', "If you could have one thing delivered into the villa right now, what would it be?"],
        ['b', "A massive pizza. No, a takeaway curry. No — pizza. Final answer."],
        ['a', "You took so long to decide."],
        ['b', "It's an important decision!"],
      ] },
      { turns: [
        ['b', "You've got sun cream on your nose, you know."],
        ['a', "Have I? Where?"],
        ['b', "Just there. No, the other side. Come here."],
        ['a', "Have you got it?"],
        ['b', "I've made it worse, actually. You look ridiculous. I love it."],
      ] },
      { turns: [
        ['a', "Rate my cooking. Honestly."],
        ['b', "Honestly? Four out of ten."],
        ['a', "Four?"],
        ['b', "The toast was burnt, the eggs were cold, and you used every pan in the kitchen. But it was sweet that you tried. So, four."],
        ['a', "I'll take four."],
      ] },
      { turns: [
        ['b', "Who's the messiest person in the villa? And you can't say yourself."],
        ['a', "I wasn't going to say myself!"],
        ['b', "You were. I could see it on your face."],
        ['a', "Okay, I was a bit."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "I've decided we need a couple name."],
        ['b', "Oh no."],
        ['a', "Oh yes. I've been working on it all day. I've got about fifteen options and they're all terrible."],
        ['b', "Go on, then. Hit me with the worst one."],
      ] },
      { turns: [
        ['a', "What's the most annoying thing I do? You can be honest."],
        ['b', "You hum. All the time. You don't even know you're doing it."],
        ['a', "I don't hum."],
        ['b', "You're humming right now."],
      ] },
      { when: { known: true }, turns: [
        ['b', "Do you remember the first thing you ever said to me?"],
        ['a', "Something smooth, I imagine."],
        ['b', "It was not smooth. You said hello and then you just stood there smiling."],
        ['a', "That was very smooth, actually. That was a tactic."],
      ] },
    ],

    feel: [
      { when: { end: 'warm' }, turns: [
        ['a', "Can I just say something? I'm really happy. Like, really happy. With you, with us, with how it's going."],
        ['b', "Me too. I keep waiting for something to go wrong, because that's what always happens to me, but it just keeps getting better."],
        ['a', "Nothing's going to go wrong."],
        ['b', "You can't promise that."],
        ['a', "I can promise I'll try."],
      ] },
      { when: { end: 'warm', feels: 'strong' }, turns: [
        ['b', "I don't want to say anything too big, because it's early and we're in here and everything's mad. But I really like you. More than I thought I would."],
        ['a', "I really like you too. Honestly, I'm a bit scared of how much."],
        ['b', "Scared?"],
        ['a', "In a good way. Exciting scared."],
      ] },
      { when: { end: 'warm' }, turns: [
        ['a', "You know you're my favourite person in here, right?"],
        ['b', "Am I?"],
        ['a', "By a mile. I don't think you realise how much I look forward to just sitting with you at the end of the day. Everything else is just noise."],
        ['b', "That's really sweet. You're mine too."],
      ] },
      { when: { end: 'warm', rung: SETTLED }, turns: [
        ['b', "I'm so glad I picked you. I think about that a lot, you know. What if I'd gone another way?"],
        ['a', "You'd be miserable."],
        ['b', "I'd be so miserable. I'd be sitting on my own at the fire pit, looking at you, crying."],
        ['a', "Good. I mean, not good. But good."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['a', "This is nice, isn't it? Just this."],
        ['b', "It is. I like that we can just sit here and not have to say anything."],
        ['a', "Me too. It's easy with you. I didn't know how much I needed easy."],
        ['b', "Easy's good."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['b', "Where do you think we are? Like, honestly."],
        ['a', "I think we're getting there. I'm not going to pretend I'm head over heels yet, but I like where it's going, and I'm not looking anywhere else."],
        ['b', "That's fair. I feel the same."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['a', "I feel like we're good friends, as well as everything else. Is that weird?"],
        ['b', "It's not weird. It's how it should be, I think. If you can't be friends, what's the point?"],
        ['a', "Exactly. Friends first."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['a', "Can I ask you something, and you just be honest?"],
        ['b', "Go on."],
        ['a', "Do you feel like this is going anywhere? Because some days I'm not sure."],
        ['b', "I don't know. I like you. I just don't know if it's more than that yet, and I don't want to say something I don't mean."],
        ['a', "Okay. Thanks for being honest."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['b', "You've gone quiet."],
        ['a', "Sorry. I'm just tired."],
        ['b', "Is it just tired, or is it us?"],
        ['a', "I don't know. Maybe a bit of both. Let's not do this now."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['a', "Do you ever feel like we're just... coasting?"],
        ['b', "Coasting?"],
        ['a', "Like we're fine, but we're not, you know, anything more than fine. I don't want to just be fine."],
        ['b', "I don't want that either. I didn't know you felt like that."],
        ['a', "I didn't really know either until I said it."],
      ] },
      { when: { end: 'flat', reg: 'dry' }, turns: [
        ['b', "Are you happy? Like, with us?"],
        ['a', "I'm not unhappy."],
        ['b', "That's not the same thing."],
        ['a', "No. It's not, is it?"],
      ] },
      { when: { end: 'warm', reg: 'big' }, turns: [
        ['a', "I'm going to say it, and you can't stop me. I'm obsessed with you. Completely obsessed. I'm going to tell everyone at dinner."],
        ['b', "Please don't tell everyone at dinner."],
        ['a', "Too late. It's going in the toast."],
      ] },
      { when: { end: 'easy', reg: 'soft' }, turns: [
        ['a', "Whatever happens in here, I'm really glad I met you. I want you to know that."],
        ['b', "Why does that sound like a goodbye?"],
        ['a', "It's not a goodbye! It's a, I'm glad you're here."],
        ['b', "Okay. I'm glad you're here too."],
      ] },
    ],

    close: [
      { when: { end: ['warm', 'easy'] }, turns: [
        ['b', "Come on. Everyone's going to wonder where we've gone."],
        ['a', "Let them wonder."],
      ], beat: "{b} pulls {a} up, and they head back to the others hand in hand." },
      { when: { end: 'warm' }, turns: [
        ['a', "Kiss before we go back?"],
        ['b', "Go on, then."],
      ], beat: "They kiss, and someone on the daybeds wolf-whistles." },
      { when: { end: ['warm', 'easy'] }, turns: [
        ['b', "I'm going to get a drink. Do you want one?"],
        ['a', "Please. You're the best."],
        ['b', "I know."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['b', "I'm going to go and find the others."],
        ['a', "Okay."],
      ], beat: "{b} goes. {a} stays where {a.posAdj} drink is, looking at the pool." },
      { when: { end: 'flat' }, turns: [
        ['a', "Let's talk about it properly later. Yeah?"],
        ['b', "Yeah. Later."],
      ], beat: "Neither of them brings it up again that day." },
      { when: { end: ['warm', 'easy'] }, turns: [
        ['a', "Same time tomorrow?"],
        ['b', "Same time every day."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['b', "Right, I'm starving. Are you coming in?"],
        ['a', "Go on, I'll be there in a minute."],
      ], beat: "{a} watches {b} go, smiling to {a.ref}." },
      { when: { end: 'warm', phase: 'evening' }, turns: [
        ['a', "Bed?"],
        ['b', "Bed. I'm shattered."],
      ], beat: "They head inside together, {b} leaning on {a}'s shoulder." },
      { when: { end: 'flat', reg: 'nervy' }, turns: [
        ['a', "Are we okay?"],
        ['b', "We're fine. Don't worry."],
      ], beat: "{a} worries anyway." },
    ],
  },

  notes: [
    { when: { rowedToday: true }, stage: "{a} and {b} sit down together after their row, and slowly make up." },
    { when: { end: 'warm' }, stage: "{a} and {b} spend a quiet hour together on the daybeds, wrapped up in each other." },
    { when: { end: 'warm' }, stage: "{a} and {b} catch up by the pool, laughing about nothing." },
    { when: { end: 'easy' }, stage: "{a} and {b} sit together on the terrace, chatting about home." },
    { when: { end: 'easy' }, stage: "{a} and {b} share a sun lounger and a long, lazy chat." },
    { when: { end: 'flat' }, stage: "{a} and {b} sit together, but the chat doesn't really go anywhere." },
    { when: { end: 'flat' }, stage: "{a} and {b} try to catch up. It's polite, and not much more." },
    { stage: "{a} and {b} cuddle up on the swing seat for a catch-up." },
  ],
});
