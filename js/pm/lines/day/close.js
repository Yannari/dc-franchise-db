// pm/lines/day/close.js — how a conversation ENDS. Data only.
//
// User (2026-09-23, reading a season): "a lot of discussions don't really
// finish … I need real discussion that makes sense". A day scene was one
// entry of two or three lines, and plenty stopped on a question nobody
// answered ("What did you see?"). Now a talking scene that opens short gets
// its ending from here, picked by what the engine already decided the scene
// did (`of`, set in pm/events.js), so the words follow the result:
//
//   chat-close        [a, b]     a couple. `of`: warm · easy · flat
//   deep-chat-close   [a, b]     a couple. `of`: open · guarded
//   friendship-close  [a, b]     two friends
//   pull-close        [a, b]     a pulled b. `of`: flirt · turned-down · kissed · promised
//   loyalty-close     [a, b]     a turned b's pull down
//   argument-close    [a, b]     `of`: make-up · walk-off · simmer
//   gossip-close      [a, b, c]  a told b about b's partner c. `of`: thanks · angry · quiet
//
// Every entry is written to follow ANY opener of its kind: it answers, it
// settles, it ends. No names, no invented details — what a close says
// happened is only what the engine recorded.
export const CLOSE = {
  'chat-close': [
    // warm: they like each other, and it shows
    { id: 'cc.w.01', when: { of: 'warm' }, turns: [['b', "I like this. Just us."], ['a', "Me too. It's my favourite part of the day."]], beat: '{b} leans into {a}, and they stay like that for a while.' },
    { id: 'cc.w.02', when: { of: 'warm' }, turns: [['a', "Can I say something?"], ['b', "Go on."], ['a', "I'm really glad it's you I'm sitting here with."], ['b', "Yeah. Me too."]] },
    { id: 'cc.w.03', when: { of: 'warm' }, turns: [['b', "Do you want a drink?"], ['a', "Only if you come straight back."], ['b', "Where else would I go?"]], beat: '{b} comes straight back.' },
    { id: 'cc.w.04', when: { of: 'warm' }, turns: [['a', "You've got that look again."], ['b', "What look?"], ['a', "The one where you're happy."], ['b', "I am happy."]] },
    { id: 'cc.w.05', when: { of: 'warm' }, turns: [['b', "We should get ready soon."], ['a', "Five more minutes."], ['b', "Five more minutes."]], beat: 'It is closer to half an hour.' },
    { id: 'cc.w.06', when: { of: 'warm' }, turns: [['a', "I didn't expect to feel like this in here."], ['b', "Like what?"], ['a', "Calm. With you, I'm calm."]] },
    { id: 'cc.w.07', when: { of: 'warm' }, turns: [['b', "Thanks for this."], ['a', "For what?"], ['b', "Just talking. Nobody else really talks to me like you do."]] },
    { id: 'cc.w.08', when: { of: 'warm' }, turns: [['a', "Come here."]], beat: '{a} pulls {b} into a hug, and neither of them is in a hurry to let go.' },
    // easy: fine, friendly, nothing more yet
    { id: 'cc.e.01', when: { of: 'easy' }, turns: [['a', "Anyway. I'm going to get in the pool. Coming?"], ['b', "Give me five minutes."], ['a', "I'll hold you to that."]] },
    { id: 'cc.e.02', when: { of: 'easy' }, turns: [['b', "We should do this more."], ['a', "Do what?"], ['b', "Just talk. Properly. Without everyone else."], ['a', "Yeah. We should."]] },
    { id: 'cc.e.03', when: { of: 'easy' }, turns: [['a', "I'm getting to know you, slowly."], ['b', "Is that a good thing?"], ['a', "So far, yeah."]] },
    { id: 'cc.e.04', when: { of: 'easy' }, turns: [['b', "Right, I'm starving. Are you coming in?"], ['a', "Go on, I'll follow you."]], beat: 'They walk back to the kitchen together.' },
    { id: 'cc.e.05', when: { of: 'easy' }, turns: [['a', "This is nice."], ['b', "It is. I didn't know what we'd talk about, and then we talked for ages."]] },
    { id: 'cc.e.06', when: { of: 'easy' }, turns: [['b', "Same time tomorrow?"], ['a', "Same daybed, same time."]], beat: '{b} laughs and gets up to go and shower.' },
    { id: 'cc.e.07', when: { of: 'easy' }, turns: [['a', "You're easy to talk to, you know."], ['b', "Is that a compliment?"], ['a', "In here? It's the best one."]] },
    // flat: it isn't clicking, and they both feel it
    { id: 'cc.f.01', when: { of: 'flat', feels: 'little' }, turns: [['a', "…Right."], ['b', "Right."]], beat: '{b} finds a reason to go inside.' },
    { id: 'cc.f.02', when: { of: 'flat', feels: 'little' }, turns: [['b', "Shall we see what everyone else is doing?"], ['a', "Yeah. Good idea."]], beat: 'Neither of them looks back.' },
    { id: 'cc.f.03', when: { of: 'flat', feels: 'little' }, turns: [['a', "Is it me, or is this hard work today?"], ['b', "It's not just you."], ['a', "Okay. Good. I mean, not good. But okay."]] },
    { id: 'cc.f.04', when: { of: 'flat' }, turns: [['b', "I'm going to go and get changed."], ['a', "Sure. See you in a bit."]] },
    { id: 'cc.f.07', when: { of: 'flat' }, turns: [['a', "Right. I'm going to get ready."], ['b', "See you out there."]] },
    { id: 'cc.f.08', when: { of: 'flat' }, turns: [['b', "Anyway. I'll let you get on."], ['a', "Okay. Later, yeah?"], ['b', "Later."]] },
    { id: 'cc.f.09', when: { of: 'flat' }, turns: [['a', "We'll get there. It's early."], ['b', "Yeah. It's early."]] },
    { id: 'cc.f.05', when: { of: 'flat', feels: 'little' }, turns: [['a', "I feel like we keep running out of things to say."], ['b', "Maybe we just need more time."], ['a', "Maybe."]] },
    { id: 'cc.f.06', when: { of: 'flat', feels: 'little' }, turns: [['b', "You're quiet."], ['a', "So are you."], ['b', "Yeah."]], beat: 'That is the end of it.' },
  ],

  'deep-chat-close': [
    { id: 'dc.o.01', when: { of: 'open' }, turns: [['b', "I've never said that to anyone in here."], ['a', "I'm glad you said it to me."], ['b', "So am I, actually."]] },
    { id: 'dc.o.02', when: { of: 'open' }, turns: [['a', "Thank you for being honest with me."], ['b', "It's easy with you. That's what scares me a bit."], ['a', "Don't be scared. I'm not going anywhere."]] },
    { id: 'dc.o.03', when: { of: 'open' }, turns: [['b', "Your turn. What about you?"], ['a', "Honestly? The same. I just didn't want to be the first one to say it."], ['b', "Well, now we've both said it."]] },
    { id: 'dc.o.04', when: { of: 'open' }, turns: [['a', "I feel like I know you a lot better than I did this morning."], ['b', "You do. More than most people."]], beat: 'They sit there, not saying anything, and it is not awkward at all.' },
    { id: 'dc.o.05', when: { of: 'open' }, turns: [['b', "Can we keep this between us?"], ['a', "Of course. It's ours."]], beat: '{b} squeezes {a.posAdj} hand.' },
    { id: 'dc.o.06', when: { of: 'open' }, turns: [['a', "Where do you see this going? Us, I mean."], ['b', "I don't want to jinx it."], ['a', "Just roughly."], ['b', "Somewhere good."]] },
    { id: 'dc.o.07', when: { of: 'open' }, turns: [['b', "I didn't think I'd have a conversation like this in here."], ['a', "Me neither. I'm glad it was with you."]] },
    { id: 'dc.g.01', when: { of: 'guarded' }, turns: [['a', "What about you?"], ['b', "Me? I'm fine. I don't really do all this."], ['a', "All what?"], ['b', "Talking about feelings on a daybed."]], beat: '{a} laughs, but it is clear {b} meant it.' },
    { id: 'dc.g.02', when: { of: 'guarded' }, turns: [['a', "You can tell me things, you know."], ['b', "I know. I just need a bit more time."], ['a', "Okay. I'll wait."]] },
    { id: 'dc.g.03', when: { of: 'guarded' }, turns: [['b', "Can we talk about something else?"], ['a', "Sure. Sorry. I didn't mean to push."], ['b', "You didn't. It's me."]] },
    { id: 'dc.g.04', when: { of: 'guarded' }, turns: [['a', "I feel like I've just told you my whole life story."], ['b', "You have. It was nice."], ['a', "And you've told me nothing."], ['b', "One day."]] },
    { id: 'dc.g.05', when: { of: 'guarded' }, turns: [['a', "Do you ever let anyone in?"], ['b', "Eventually."]], beat: '{a} waits for more. There is no more, not tonight.' },
  ],

  'friendship-close': [
    { id: 'fc.01', turns: [['b', "Thanks for this. I needed it."], ['a', "Any time. I mean that."]] },
    { id: 'fc.02', turns: [['a', "Right, come on. The others are waiting."], ['b', "Two minutes. I'm comfortable."]], beat: '{a} drags {b} up off the daybed anyway.' },
    { id: 'fc.03', turns: [['b', "You're one of my favourite people in here, you know that?"], ['a', "Only one of?"], ['b', "Don't push it."]] },
    { id: 'fc.04', turns: [['a', "Whatever happens at the next recoupling, we're fine. Yeah?"], ['b', "We're more than fine."]] },
    { id: 'fc.05', turns: [['b', "I'm glad you're in here."], ['a', "Me too. It'd be a lot worse without you."]], beat: 'They hug it out, and go back to the others.' },
    { id: 'fc.06', turns: [['a', "Same again tomorrow?"], ['b', "Same again every day."]] },
    { id: 'fc.08', turns: [['a', "If you need me, you know where I am."], ['b', "On that sunbed, all day."], ['a', "Exactly."]] },
    { id: 'fc.09', turns: [['b', "Promise me we'll still do this on the outside."], ['a', "Obviously. You're stuck with me now."]] },
    { id: 'fc.10', turns: [['a', "This was nice. We should do this every day."], ['b', "We will. You're not getting rid of me."]] },
  ],

  'pull-close': [
    // a flirtation: nothing more, and they both know where it sits
    { id: 'pc.f.01', when: { of: 'flirt' }, turns: [['b', "We should probably get back."], ['a', "Yeah. We should."]], beat: 'Neither of them moves for another minute.' },
    { id: 'pc.f.02', when: { of: 'flirt' }, turns: [['a', "Can we do this again?"], ['b', "Maybe. Ask me tomorrow."], ['a', "I will."]] },
    { id: 'pc.f.03', when: { of: 'flirt' }, turns: [['b', "I'm glad you pulled me."], ['a', "I'm glad you said yes."]], beat: 'They walk back separately, a few minutes apart.' },
    { id: 'pc.f.04', when: { of: 'flirt' }, turns: [['a', "I just wanted you to know I'm interested. That's all."], ['b', "Noted."], ['a', "Noted? That's it?"], ['b', "For now."]] },
    { id: 'pc.f.05', when: { of: 'flirt', taken: true }, turns: [['b', "What about your partner?"], ['a', "It's just a chat."], ['b', "Is it?"]], beat: '{a} does not answer that.' },
    { id: 'pc.f.06', when: { of: 'flirt', bTaken: true }, turns: [['a', "Look, I get it. You're with someone."], ['b', "I am."], ['a', "I'm just saying, if that ever changes."], ['b', "I heard you."]] },
    { id: 'pc.f.07', when: { of: 'flirt' }, turns: [['b', "This was nice."], ['a', "It was. Let's not make it a big thing yet."], ['b', "Agreed."]] },
    // turned down: said kindly, or not
    { id: 'pc.t.01', when: { of: 'turned-down' }, turns: [['a', "Okay. Fair enough."], ['b', "I'm sorry. I just don't see it."], ['a', "No, it's fine. At least I asked."]] },
    { id: 'pc.t.02', when: { of: 'turned-down' }, turns: [['b', "I don't want to lead you on."], ['a', "You're not. I get it."]], beat: '{a} goes back to the others and laughs a bit too loudly at something.' },
    { id: 'pc.t.03', when: { of: 'turned-down' }, turns: [['a', "So that's a no, then."], ['b', "It's a no. But I'm glad you asked."], ['a', "Are you?"], ['b', "I am. It was brave."]] },
    { id: 'pc.t.04', when: { of: 'turned-down' }, turns: [['a', "Can we still be friends?"], ['b', "Of course we can."]], beat: '{a} nods, and does not quite look at {b} for the rest of the day.' },
    { id: 'pc.t.05', when: { of: 'turned-down' }, turns: [['b', "It's not you."], ['a', "Please don't say it's you."], ['b', "It's a bit me."]], beat: 'They both laugh, which helps.' },
    // it went further (the engine recorded a kiss)
    { id: 'pc.k.01', when: { of: 'kissed' }, turns: [['b', "We shouldn't have done that."], ['a', "Probably not."], ['b', "Nobody can know."], ['a', "Nobody will."]] },
    { id: 'pc.k.02', when: { of: 'kissed' }, turns: [['a', "I'm not sorry."], ['b', "Neither am I. That's the problem."]], beat: 'They go back in by different doors.' },
    { id: 'pc.k.03', when: { of: 'kissed' }, turns: [['b', "What happens now?"], ['a', "Now we go back and act normal."], ['b', "I don't know if I can."]] },
    // plans for the outside (the engine recorded a promise)
    { id: 'pc.p.01', when: { of: 'promised' }, turns: [['b', "Did we just make plans for the outside?"], ['a', "I think we did."], ['b', "We can't tell anyone."], ['a', "We won't."]] },
    { id: 'pc.p.02', when: { of: 'promised' }, turns: [['a', "So. When we're out."], ['b', "When we're out."]], beat: 'They shake on it, and it lasts a second too long.' },
  ],

  'loyalty-close': [
    { id: 'lc.01', turns: [['b', "Fair enough. I had to try."], ['a', "I know. No hard feelings."]] },
    { id: 'lc.02', turns: [['b', "They're lucky, whoever you're with."], ['a', "I tell them that every day."]], beat: '{b} laughs, and lets it go.' },
    { id: 'lc.03', turns: [['b', "Right. Well. I'll leave you to it."], ['a', "Thanks for understanding."]], beat: '{a} goes straight back to {a.posAdj} partner.' },
    { id: 'lc.04', turns: [['b', "You're very loyal, aren't you?"], ['a', "When it's someone I care about? Yeah."], ['b', "That's annoying. And nice."]] },
    { id: 'lc.05', turns: [['b', "If anything changes—"], ['a', "It won't. But thank you."]] },
    { id: 'lc.06', turns: [['b', "Can we at least be friends?"], ['a', "Of course we can. Just friends."], ['b', "Just friends."]] },
  ],

  'argument-close': [
    // make-up: somebody takes it back
    { id: 'acl.m.01', when: { of: 'make-up' }, turns: [['a', "Look. I'm sorry. I didn't mean to have a go at you."], ['b', "I know. I'm sorry too."], ['a', "Are we okay?"], ['b', "We're okay."]] },
    { id: 'acl.m.02', when: { of: 'make-up' }, turns: [['b', "This is stupid. We're going round in circles."], ['a', "…Yeah. We are."], ['b', "Truce?"], ['a', "Truce."]] },
    { id: 'acl.m.03', when: { of: 'make-up' }, turns: [['a', "I'm tired and I took it out on you. That's not fair."], ['b', "Thank you for saying that."]], beat: 'They hug, a bit stiffly at first.' },
    { id: 'acl.m.04', when: { of: 'make-up' }, turns: [['b', "Can we start this conversation again?"], ['a', "Please."]], beat: 'They sit down, and the second go is a lot calmer.' },
    { id: 'acl.m.05', when: { of: 'make-up', coupled: true }, turns: [['a', "I hate fighting with you."], ['b', "Then let's stop."], ['a', "Come here."]] },
    { id: 'acl.m.06', when: { of: 'make-up' }, turns: [['b', "I overreacted."], ['a', "We both did."], ['b', "Okay. Let's leave it there."]] },
    // walk-off: it ends with somebody leaving
    { id: 'acl.w.01', when: { of: 'walk-off' }, turns: [['b', "I'm not doing this right now."], ['a', "Fine. Walk off. That's what you do."]], beat: '{b} walks off.' },
    { id: 'acl.w.02', when: { of: 'walk-off' }, turns: [['a', "You know what? Forget it."], ['b', "Forget what?"], ['a', "All of it. I'm done."]], beat: '{a} goes inside and the door bangs behind {a.obj}.' },
    { id: 'acl.w.03', when: { of: 'walk-off' }, turns: [['b', "I'm going to go before I say something I'll regret."], ['a', "You already have."]], beat: '{b} leaves the terrace without another word.' },
    { id: 'acl.w.04', when: { of: 'walk-off' }, turns: [['a', "Don't talk to me for a bit."], ['b', "Happily."]], beat: 'They go to opposite ends of the garden and stay there.' },
    { id: 'acl.w.05', when: { of: 'walk-off' }, turns: [['b', "We're not going to agree, are we?"], ['a', "No."], ['b', "Then I'm going to bed."]] },
    // simmer: nobody leaves and nothing is fixed
    { id: 'acl.s.01', when: { of: 'simmer' }, turns: [['a', "Let's just leave it."], ['b', "Fine."], ['a', "Fine."]], beat: 'It is not fine, and everyone nearby can tell.' },
    { id: 'acl.s.02', when: { of: 'simmer' }, turns: [['b', "We'll talk about it later."], ['a', "Will we?"], ['b', "Later."]] },
    { id: 'acl.s.03', when: { of: 'simmer' }, turns: [['a', "I'm not going to say sorry for something I didn't do."], ['b', "Nobody asked you to."], ['a', "Good."]], beat: 'They sit in silence until somebody else changes the subject.' },
    { id: 'acl.s.04', when: { of: 'simmer' }, turns: [['b', "Can we not do this in front of everyone?"], ['a', "You started it."], ['b', "And I'm ending it. For now."]] },
    { id: 'acl.s.05', when: { of: 'simmer' }, turns: [['a', "Whatever."]], beat: '{b} opens {b.posAdj} mouth to answer, and then does not bother.' },
  ],

  'gossip-close': [
    // thanks: b takes it in and is grateful to a
    { id: 'gc.t.01', when: { of: 'thanks' }, turns: [['b', "Why are you telling me?"], ['a', "Because if it was me, I'd want to know."], ['b', "…Thank you. I mean it."]] },
    { id: 'gc.t.02', when: { of: 'thanks' }, turns: [['b', "I'm glad it was you who told me."], ['a', "I'm sorry it had to be anyone."]], beat: '{a} gives {b} a hug and does not let go straight away.' },
    { id: 'gc.t.03', when: { of: 'thanks' }, turns: [['b', "Okay. I need to think."], ['a', "Take as long as you need. I'm here."], ['b', "Thank you for being straight with me."]] },
    { id: 'gc.t.04', when: { of: 'thanks' }, turns: [['b', "Does everyone know?"], ['a', "Not everyone. I wanted you to hear it first."], ['b', "Thank you. Really."]] },
    { id: 'gc.t.05', when: { of: 'thanks' }, turns: [['b', "You didn't have to tell me."], ['a', "Yes, I did."]], beat: '{b} nods slowly and wipes {b.posAdj} eyes.' },
    // angry: b is going to deal with it
    { id: 'gc.a.01', when: { of: 'angry' }, turns: [['b', "I'm so angry I can't even think."], ['a', "Don't do anything tonight. Sleep on it."], ['b', "I'm not going to sleep."]], beat: '{b} stares across the garden at {c} and does not look away.' },
    { id: 'gc.a.02', when: { of: 'angry' }, turns: [['b', "I can't believe it. I actually can't believe it."], ['a', "I'm sorry."], ['b', "Don't be sorry. {c} should be sorry."]] },
    { id: 'gc.a.03', when: { of: 'angry' }, turns: [['b', "And {c} thought I'd never find out?"], ['a', "I don't think {c} thought about it at all."], ['b', "Clearly."]], beat: '{b} stares across the garden at {c}.' },
    { id: 'gc.a.04', when: { of: 'angry' }, turns: [['b', "I've defended {c.obj}. To everyone. Every day."], ['a', "I know you have."], ['b', "Never again."]] },
    { id: 'gc.a.05', when: { of: 'angry' }, turns: [['b', "Thank you. I need a minute before I see {c}."], ['a', "Do you want me to stay?"], ['b', "No. I need to do this on my own."]] },
    // quiet: b goes inward
    { id: 'gc.q.01', when: { of: 'quiet' }, turns: [['b', "Okay."], ['a', "Okay? Is that it?"], ['b', "I don't know what else to say yet."]], beat: '{a} stays with {b} until {b} is ready to go back.' },
    { id: 'gc.q.02', when: { of: 'quiet' }, turns: [['b', "I think I knew. I just didn't want to."], ['a', "That's the worst bit, isn't it?"], ['b', "Yeah."]] },
    { id: 'gc.q.03', when: { of: 'quiet' }, turns: [['b', "Can you not tell anyone else? Just for now."], ['a', "I won't say a word."]], beat: '{b} goes to bed early and faces the wall.' },
    { id: 'gc.q.04', when: { of: 'quiet' }, turns: [['b', "I need a minute on my own."], ['a', "Of course. Shout if you need me."]] },
    { id: 'gc.q.05', when: { of: 'quiet' }, turns: [['b', "I really thought {c} was different."], ['a', "I know you did."]], beat: '{b} does not cry. Not yet.' },
  ],
};

// An opener that ends on a question gets it answered before the ending.
// `lastBy`: who asked it, so the answer comes from the other one.
//   answer-close  [a, b]     a short, honest answer for any talking kind
//   gossip-what   [a, b, c]  what a actually saw (or heard): `of` is the secret's
//                            kind (pull · kiss · bed · said · promise) — the
//                            engine's record, never more than it holds
export const ANSWER = {
  'answer-close': [
    { id: 'an.a.01', when: { lastBy: 'a' }, turns: [['b', "Honestly? I don't know yet."]] },
    { id: 'an.a.02', when: { lastBy: 'a' }, turns: [['b', "…Can I think about that one?"], ['a', "Take your time."]] },
    { id: 'an.a.03', when: { lastBy: 'a' }, turns: [['b', "I'll tell you. Just not today."]] },
    { id: 'an.b.01', when: { lastBy: 'b' }, turns: [['a', "Honestly? I don't know yet."]] },
    { id: 'an.b.02', when: { lastBy: 'b' }, turns: [['a', "…Can I think about that one?"], ['b', "Take your time."]] },
    { id: 'an.b.03', when: { lastBy: 'b' }, turns: [['a', "I'll tell you. Just not today."]] },
  ],
  'gossip-what': [
    { id: 'gw.p.01', when: { of: 'pull' }, turns: [['a', "{c} pulled someone else for a chat. It went on a lot longer than a normal chat."]] },
    { id: 'gw.p.02', when: { of: 'pull' }, turns: [['a', "{c} took someone off for a chat, away from everyone. It didn't look like nothing."]] },
    { id: 'gw.k.01', when: { of: 'kiss' }, turns: [['a', "I saw {c} kiss someone else."], ['b', "Kiss? Actually kiss?"], ['a', "Actually kiss."]] },
    { id: 'gw.k.02', when: { of: 'kiss' }, turns: [['a', "{c} kissed someone. I was right there."]] },
    { id: 'gw.b.01', when: { of: 'bed' }, turns: [['a', "{c} shared a bed with someone else. And it didn't look innocent."]] },
    { id: 'gw.b.02', when: { of: 'bed' }, turns: [['a', "It was in bed. {c} and someone who isn't you."]] },
    { id: 'gw.s.01', when: { of: 'said' }, turns: [['a', "It's what {c} said about you. When you weren't there. It wasn't kind."]] },
    { id: 'gw.s.02', when: { of: 'said' }, turns: [['a', "I heard {c} talking about you, and it wasn't how you talk about someone you like."]] },
    { id: 'gw.pr.01', when: { of: 'promise' }, turns: [['a', "{c} was making plans with someone else. For when you're all out of here."]] },
    { id: 'gw.pr.02', when: { of: 'promise' }, turns: [['a', "I heard {c} promise someone a date on the outside. Someone who isn't you."]] },
  ],
};
