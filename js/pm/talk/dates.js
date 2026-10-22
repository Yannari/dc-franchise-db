// ══════════════════════════════════════════════════════════════════════
// pm/talk/dates.js — a new arrival's dates (pm/arrivals.js bombshellDates)
// ══════════════════════════════════════════════════════════════════════
//
// date-picked  [a, b, c]  {b}'s name is read out for a date with {c}, the new
//                         arrival; {a} is {b}'s partner, hearing it.
// date         [a, b]     {a}, the new arrival, takes {b} out. {pb} is {b}'s
//                         partner (bTaken). `spark`: {b} {~fancies} {a} more than
//                         {pb} (the steady half of what decides `keen` after).
//                         `exes`: they used to be together.
// date-back    [a, b, c]  {b} is back from the date with {c}; {a}, the partner,
//                         asks. `of`: keen (it went somewhere) · loyal.
// All always shown whole: the arrival day is the episode.
import { build } from './build.js';
import { attr } from '../chemistry.js';
import { romance } from '../feelings.js';

const partnerOf = (state, n) => { const c = state.couples.find(x => x.includes(n)); return c ? (c[0] === n ? c[1] : c[0]) : null; };

export const DATE_PICKED = build('date-picked', {
  tiered: false,
  plans: { featured: ['hear', 'talk'], short: ['hear', 'talk'] },
  moves: {
    hear: [
      { turns: [], beat: "{a} goes very still when {b}'s name is read out." },
      { turns: [], beat: "Everyone turns to look at {a} as soon as {b}'s name is read out." },
      { turns: [['a', "Of course it's you."]], beat: "{a} laughs, but it isn't a real laugh." },
    ],
    talk: [
      { turns: [
        ['b', "It's one date. It doesn't mean anything. I didn't ask to be picked."],
        ['a', "I know you didn't. I just don't like it. {c} has been in here five minutes and is already taking you out."],
        ['b', "And I'll be back in a couple of hours, and I'll tell you everything."],
      ] },
      { turns: [
        ['b', "Are you okay?"],
        ['a', "I'm fine. Go and have fun."],
        ['b', "Don't say it like that."],
        ['a', "Like what? I said go and have fun. Have fun. Just remember who you're coming back to."],
      ] },
      { turns: [
        ['a', "Why wouldn't {c} pick you? Look at you."],
        ['b', "Stop it. I'm not going anywhere. You know I'm not."],
        ['a', "I know. I trust you. It's {c} I don't trust."],
      ] },
      { turns: [
        ['b', "Do you want me to say no?"],
        ['a', "You can't say no. That's not how it works."],
        ['b', "Then I'll go, and I'll be polite, and I'll come straight back to you."],
        ['a', "Straight back."],
        ['b', "Straight back."],
      ] },
    ],
  },
  notes: [],
});

export const DATE = build('date', {
  tiered: false,
  facts: (state, ev) => {
    const [a, b] = ev.players;
    const pb = partnerOf(state, b);
    return { spark: (attr(state, b, a) ?? 0) > Math.max(pb ? romance(b, pb) : 0, pb ? attr(state, b, pb) ?? 0 : 0) };
  },
  plans: {
    featured: [
      { when: { exes: true }, plan: ['setting', 'exes', 'end', 'close'] },
      { plan: ['setting', 'open', 'why', 'talk', 'test?', 'end', 'close'] },
    ],
    short: [
      { when: { exes: true }, plan: ['exes', 'end'] },
      { plan: ['open', 'why', 'end'] },
    ],
  },
  moves: {
    setting: [
      { stage: "The date is at a little table by the sea, with the sun going down behind them.", turns: [] },
      { stage: "The date is on a boat, and neither of them has ever been on one before.", turns: [] },
      { stage: "The date is a picnic on a hill above the villa.", turns: [] },
      { stage: "The date is at a beach bar, all fairy lights and cocktails.", turns: [] },
      { stage: "The date is a cooking class, and neither of them can cook.", turns: [] },
      { stage: "The date is on a rooftop terrace with the whole town below them.", turns: [] },
    ],
    open: [
      { turns: [
        ['a', "So, how does it feel to be the first one I picked?"],
        ['b', "Honestly? A bit weird. Everyone was looking at me when they read my name out."],
        ['a', "Good weird or bad weird?"],
        ['b', "I'll let you know at the end."],
      ] },
      { turns: [
        ['b', "I have to say, I didn't expect it to be me."],
        ['a', "Really? Why not?"],
        ['b', "Because there are about twenty other people in that villa, and half of them have been doing sit-ups since they heard you were coming."],
      ] },
      { turns: [
        ['a', "Cheers. To getting out of the villa for an afternoon."],
        ['b', "Cheers to that. I've been staring at the same pool for days."],
        ['a', "Well, now you get to stare at me instead."],
        ['b', "Confident."],
      ] },
      { turns: [
        ['b', "This is nice. I didn't realise how much I needed to get out of there."],
        ['a', "It must be intense, being in there all day."],
        ['b', "You have no idea. You'll find out, though."],
      ] },
    ],
    why: [
      { turns: [
        ['a', "I'll be honest with you. When I was watching, before I came in, you were the one I wanted to meet. I liked how you are with people. You're kind to everyone, and you're funny, and you don't seem to take yourself too seriously."],
        ['b', "You were watching me?"],
        ['a', "Everyone was watching you. You're a lot of people's favourite."],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "I know you're coupled up with {pb}. I'm not going to pretend I don't know that. But I wanted to get to know you, and I don't think I'm the only one who's wondered if it's really working in there."],
        ['b', "That's a bit forward."],
        ['a', "I've only got a few days to make an impression. I can't really afford to be shy."],
      ] },
      { turns: [
        ['a', "I picked you because I liked you straight away. Before I'd even said hello. You've got a really nice energy, and I wanted to see if it's the same up close."],
        ['b', "And is it?"],
        ['a', "So far, yeah. Even better."],
      ] },
      { when: { reg: 'flirty' }, turns: [
        ['a', "Do you want the honest reason? I took one look at you and thought, that's the one I'm taking out first. And I usually trust my first look."],
        ['b', "Your first look's ever been wrong?"],
        ['a', "Once or twice. I'm hoping not today."],
      ] },
    ],
    talk: [
      { turns: [
        ['a', "Tell me about you, then. Not the villa you. The real you."],
        ['b', "The real me is a lot more boring than the villa me, honestly. I like being at home. I like long walks and early nights and a good film. In here, everyone thinks I'm the life and soul, and I am, sometimes. But mostly I just want someone to sit on the sofa with."],
        ['a', "That doesn't sound boring at all."],
      ] },
      { turns: [
        ['b', "What made you want to come in, then? It's a big thing, walking into a villa where everyone already knows each other."],
        ['a', "Honestly? I've been single for a while, and I was fed up of meeting people who weren't serious. I thought, if I'm going to meet someone, I want to meet them properly, with nothing to hide behind. And this is about as nothing-to-hide-behind as it gets."],
        ['b', "You can say that again. There are cameras in the bathroom."],
        ['a', "Not in the bathroom, surely."],
        ['b', "Feels like it."],
      ] },
      { turns: [
        ['a', "What's your type? On paper, I mean."],
        ['b', "On paper? Someone who makes me laugh. Someone who's kind to their friends. Someone who doesn't play games, because I've had enough of that to last me a lifetime. And then, you know, the looks, but that comes second."],
        ['a', "Second? Really?"],
        ['b', "A close second."],
      ] },
      { turns: [
        ['b', "Can I ask you something? What are you actually looking for? Because some people come in here for the right reasons, and some people come in here to cause trouble."],
        ['a', "I'm looking for something real. I know everyone says that, but I mean it. I'm not interested in causing drama for the sake of it. If I go for someone, it's because I like them."],
        ['b', "Good answer."],
      ] },
    ],
    test: [
      { when: { bTaken: true }, turns: [
        ['a', "Can I ask you about {pb}? You don't have to answer."],
        ['b', "Go on."],
        ['a', "Are you happy? Honestly?"],
        ['b', "I'm... yeah. I think I am. It's early days. We get on really well. I'm just not sure yet if it's more than that."],
      ] },
      { when: { bTaken: true, spark: false }, turns: [
        ['a', "So how are things with {pb}?"],
        ['b', "Really good, actually. I'm not going to lie to you and say they're not. {pb} has been amazing to me, and I'm not looking anywhere else."],
        ['a', "Fair enough. At least you're honest."],
      ] },
      { when: { bTaken: true, spark: true }, turns: [
        ['a', "Can I ask you something, and you just tell me straight? If {pb} wasn't in the picture, would you be sitting here a bit differently?"],
        ['b', "That's not fair."],
        ['a', "It's not a fair question, I know. But you didn't say no."],
        ['b', "I didn't say no."],
      ] },
    ],
    exes: [
      { stage: "The date is at a beach bar, and neither of them knows where to start.", turns: [
        ['b', "So this is happening."],
        ['a', "I picked you. I wanted to talk to you, properly, away from everyone. We've never really had that conversation, have we? About how it ended."],
        ['b', "We've never been very good at talking properly."],
        ['a', "Maybe we can start now."],
      ] },
      { stage: "The date is on a boat, which leaves nowhere to storm off to.", turns: [
        ['b', "Why me? Out of everyone in there, why would you pick me?"],
        ['a', "Because I needed to know if there's still something there. I've spent a long time telling myself there isn't, and then I saw you on {~telly}, and I wasn't sure anymore."],
        ['b', "And?"],
        ['a', "You tell me."],
      ] },
      { turns: [
        ['a', "This is the first time we've sat across a table from each other since we broke up. Do you realise that?"],
        ['b', "Don't make it a thing."],
        ['a', "It's already a thing. It's a massive thing. I'm sitting here trying to act normal, and I've forgotten what normal is with you."],
      ] },
    ],
    end: [
      { when: { spark: true }, turns: [
        ['b', "This has been really nice, actually. I wasn't expecting it to be."],
        ['a', "Nice enough to do it again?"],
        ['b', "Maybe. Don't push your luck."],
      ], beat: "{b} smiles all the way back to the car." },
      { when: { spark: true }, turns: [
        ['a', "Can I say something? I really like you. I know I've only just met you, and I know it's complicated. But I'd be lying if I said I didn't."],
        ['b', "I like you too. That's the problem."],
      ] },
      { when: { spark: false }, turns: [
        ['b', "I've had a really nice time, honestly. You're lovely. I just don't want you to get the wrong idea."],
        ['a', "No, that's fair. I appreciate you being straight with me."],
      ] },
      { when: { spark: false }, turns: [
        ['a', "I don't think I'm going to steal you away today, am I?"],
        ['b', "Probably not, no. But I think we'll be good friends."],
        ['a', "Friends. I'll take friends. For now."],
      ] },
      { when: { exes: true }, turns: [
        ['b', "I don't know what this is."],
        ['a', "Neither do I. But I'm glad we did it."],
        ['b', "Me too. I think."],
      ] },
    ],
    close: [
      { turns: [], beat: "The car arrives to take them back to the villa, and neither of them says much on the way." },
      { turns: [['a', "Back to reality, then."], ['b', "Back to reality."]] },
      { turns: [], beat: "They walk back into the villa, and every head on the lawn turns to look." },
    ],
  },
  notes: [],
});

export const DATE_BACK = build('date-back', {
  tiered: false,
  plans: {
    featured: ['return', 'ask', 'answer', 'probe?', 'settle'],
    short: ['ask', 'answer', 'settle'],
  },
  moves: {
    return: [
      { when: { of: 'loyal' }, stage: "{b} walks back into the villa and comes straight over to {a}.", turns: [] },
      { when: { of: 'keen' }, stage: "{b} gets back from the date, and doesn't come and find {a} straight away.", turns: [] },
      { stage: "{a} has been waiting on the daybed since {b} left.", turns: [] },
    ],
    ask: [
      { turns: [
        ['a', "So? How was it?"],
      ] },
      { turns: [
        ['a', "Go on, then. Tell me everything. And don't leave anything out, because I'll find out anyway."],
      ] },
      { turns: [
        ['a', "You were gone ages. How was the date with {c}?"],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "How was it? Actually, no, don't tell me. Yes, tell me. Tell me."],
      ] },
    ],
    answer: [
      { when: { of: 'loyal' }, turns: [
        ['b', "It was nice. Honestly, it was a nice afternoon. {c} is lovely, the food was good. But the whole time I was sitting there, I just kept thinking about getting back here. It made me realise I'm happy where I am."],
        ['a', "Really?"],
        ['b', "Really."],
      ] },
      { when: { of: 'loyal' }, turns: [
        ['b', "Before you ask, nothing happened, and nothing's going to. {c} asked about us, and I said it's going really well. That was basically the whole date."],
        ['a', "I wasn't going to ask."],
        ['b', "You were absolutely going to ask."],
      ] },
      { when: { of: 'loyal' }, turns: [
        ['b', "I missed you, if that helps. I know that sounds stupid after two hours. But I did."],
        ['a', "It does help, actually."],
      ] },
      { when: { of: 'keen' }, turns: [
        ['b', "It was fine."],
        ['a', "Just fine? You've been smiling since you walked through the door."],
        ['b', "Have I? I haven't noticed."],
        ['a', "I've noticed."],
      ] },
      { when: { of: 'keen' }, turns: [
        ['b', "It was... it was nice. We had a good chat. {c} is really easy to talk to, actually. We talked about loads of things, life outside, what we want. It was just nice to talk to someone new."],
        ['a', "Right. Someone new."],
        ['b', "That's not what I meant."],
      ] },
      { when: { of: 'keen', exes: true }, turns: [
        ['b', "It was a lot. There was a lot of old stuff that came up, stuff I thought I'd dealt with. I need a bit of time to process it, if I'm honest."],
        ['a', "Process what, exactly?"],
      ] },
      { when: { of: 'loyal', exes: true }, turns: [
        ['b', "It was good to clear the air with {c}. That's all it was. We said the things we never got to say, and now it's done. It's been over for a long time."],
        ['a', "Promise?"],
        ['b', "I promise."],
      ] },
    ],
    probe: [
      { when: { of: 'keen' }, turns: [
        ['a', "What did you and {c} actually talk about? Because you were gone for two hours."],
        ['b', "Nothing much. Just getting to know each other."],
        ['a', "For two hours?"],
        ['b', "Time goes quickly when you're not in the villa."],
      ] },
      { when: { of: 'keen' }, turns: [
        ['a', "Are we okay? Be honest with me."],
        ['b', "Of course we are. Why wouldn't we be?"],
        ['a', "Because you've barely looked at me since you got back."],
      ] },
      { when: { of: 'loyal' }, turns: [
        ['a', "And {c} didn't try anything?"],
        ['b', "{c} tried a bit. I didn't let it go anywhere. You've got nothing to worry about."],
      ] },
    ],
    settle: [
      { when: { of: 'loyal' }, turns: [['a', "Come here, then."]], beat: "{b} curls up next to {a}, and {a} finally relaxes." },
      { when: { of: 'loyal' }, turns: [], beat: "{a} kisses {b}, and from across the lawn, {c} sees it." },
      { when: { of: 'keen' }, turns: [], beat: "{a} doesn't look convinced, and {b} doesn't try very hard to convince {a.obj}." },
      { when: { of: 'keen' }, turns: [['a', "Okay."], ['b', "Okay?"], ['a', "I said okay."]], beat: "It doesn't sound okay." },
    ],
  },
  notes: [],
});
