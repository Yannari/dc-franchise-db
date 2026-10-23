// pm/talk/more/storyline-volume.js — volume for the storyline scenes (the
// user, 2026-10-22: "address the repeats by increasing the volume of the
// dialogue ALOT"). Each held two or three entries a movement and plays
// several times a season, so a camp's confrontation was heard word for word
// eight times. Same facts and gates as pm/talk/storylines.js and the kinds'
// own files: `of` says hot or calm, for or against, peace or still angry.
const R = (...turns) => ({ turns });
const W = (when, ...turns) => ({ when, turns });
const S = (stage, ...turns) => ({ stage, turns });
const SW = (when, stage, ...turns) => ({ when, stage, turns });
const BEAT = beat => ({ turns: [], beat });
const BW = (when, beat) => ({ when, turns: [], beat });
const HOT = { of: 'hot' }, CALM = { of: 'calm' };
const AGAINST = { of: 'against' }, FOR = { of: 'for' };
const PEACE = { of: 'peace' }, ANGRY = { of: 'still-angry' };

export const STORYLINE_VOLUME = {
  'camp-confront': {
    moves: {
      open: [
        { when: HOT, stage: "{a} gets up from the daybeds and goes straight for {b}.", turns: [] },
        { when: HOT, stage: "{a} doesn't even wait for {b} to finish {b.posAdj} sentence.", turns: [] },
        { when: HOT, stage: "{a} slams a cup down on the kitchen counter and turns to {b}.", turns: [] },
        { when: CALM, stage: "{a} asks {b} for a word by the swing seats.", turns: [] },
        { when: CALM, stage: "{a} waits until {b} is on {b.posAdj} own, then sits down next to {b.obj}.", turns: [] },
        { when: CALM, stage: "{a} brings {b} a drink and asks for five minutes.", turns: [] },
      ],
      go: [
        W(HOT, ['a', "What is your problem with {c}? Because everybody can see you've got one."], ['b', "I haven't got a problem."], ['a', "You've had a problem since day one."]),
        W(HOT, ['a', "Every time {c} walks into a room, you've got something to say. It stops today."], ['b', "Or what?"], ['a', "Or you'll be saying it to me."]),
        W(HOT, ['a', "I've watched you make {c} feel small all week. I'm done watching."], ['b', "{c} can fight {c.posAdj} own battles."], ['a', "{c} shouldn't have to."]),
        W(HOT, ['a', "You think nobody notices the little comments? Everyone notices. I'm just the one saying it."]),
        W(CALM, ['a', "I'm not here to have a go. I just think you and {c} have got the wrong idea about each other."], ['b', "Have we?"]),
        W(CALM, ['a', "The atmosphere's horrible, and I think you know why. Can you just talk to {c}?"], ['b', "Why is it on me?"], ['a', "Because I think you're the bigger person."]),
        W(CALM, ['a', "{c} is upset. Really upset. I don't think you meant it to go this far."]),
        W(CALM, ['a', "I like you both. That's why I'm asking. Please sort it out before it gets worse."]),
      ],
      answer: [
        W(HOT, ['b', "Who made you the villa police?"], ['a', "Nobody. I volunteered."]),
        W(HOT, ['b', "You've only heard {c}'s side."], ['a', "I've seen your side. All week. That's enough."]),
        W(HOT, ['b', "Fine. Whatever. I'll stay away from {c}."], ['a', "That's all anyone's asking."]),
        W(CALM, ['b', "Maybe I have been a bit much."], ['a', "A bit."], ['b', "Fine. A lot. I'll talk to {c}."]),
        W(CALM, ['b', "I didn't realise it had got to {c} like that."], ['a', "It has. Talk to {c}."]),
        W(CALM, ['b', "I'll try. I can't promise it'll go well."], ['a', "Trying's all I'm asking for."]),
      ],
      land: [
        BW(HOT, "{b} walks off, and the whole garden starts whispering at once."),
        BW(HOT, "{c}, across the pool, pretends very hard not to have heard any of it."),
        BW(HOT, "{a} sits back down, shaking a little, and somebody hands {a.obj} a drink."),
        BW(CALM, "Later, {b} and {c} are seen talking by the pool. Not smiling, but talking."),
        BW(CALM, "{b} nods slowly, and {a} gives {b.obj} a pat on the arm on the way past."),
      ],
    },
  },
  'camp-rally': {
    moves: {
      find: [
        S("{b} finds {a} sitting on the stairs, on {a.posAdj} own.", ['b', "Move up. I'm sitting with you."]),
        S("{b} brings {a} a cup of tea and sits on the end of {a.posAdj} sunbed.", ['b', "I saw what happened with {c}. Are you alright?"]),
        S("{b} finds {a} in the dressing room, staring at the mirror.", ['b', "Don't let {c} get to you. Come here."]),
        S("{b} sits down next to {a} in the shallow end.", ['b', "I've been looking for you. You okay?"]),
      ],
      rally: [
        R(['a', "I just don't understand what I did."], ['b', "You didn't do anything. That's the point. {c} needs someone to pick on, and it's you this week."]),
        R(['b', "You know what everyone says about you when you're not around? That you're the nicest person here."], ['a', "Really?"], ['b', "Really. Nobody's saying that about {c}."]),
        R(['a', "Maybe I should just say something back."], ['b', "You could. Or you could carry on being lovely, and let {c} look worse every day."]),
        R(['b', "I've got your back. So have half the villa. You just haven't noticed."], ['a', "Half?"], ['b', "Okay, a third. A good third."]),
        R(['a', "I'm so tired of it."], ['b', "I know. It won't last. {c} will move on to someone else soon. They always do."]),
      ],
      land: [
        BEAT("{a} wipes {a.posAdj} eyes, laughs at {a.ref}, and leans on {b}."),
        R(['a', "What would I do without you?"], ['b', "Something much less fun."]),
        BEAT("They go back out together, and {a} walks a little taller."),
        BEAT("{b} keeps an eye on {c} for the rest of the night, just in case."),
      ],
    },
  },
  'camp-clash': {
    moves: {
      clash: [
        S("By the pool, {a} and {b} go from talking to shouting in about four seconds.", ['a', "You're only defending {c} because you're scared of {c}."], ['b', "And you're only defending {d} because {d} tells you what to think."]),
        S("In the kitchen, it starts over nothing and turns into {c} and {d} again.", ['b', "Why does every conversation come back to {d}?"], ['a', "Because {c} keeps making it about {d}!"]),
        S("On the daybeds, {a} and {b} are suddenly nose to nose.", ['a', "Pick a side, then. Everyone else has."], ['b', "I'm not picking a side in somebody else's fight."], ['a', "You already have. It's {c}'s."]),
        S("The firepit benches, before anyone's even sat down.", ['b', "{d} has been stirring it all week, and you know it."], ['a', "And {c} hasn't? Open your eyes."]),
      ],
      land: [
        BEAT("Nobody's talking about {c} and {d} any more. Everyone's talking about {a} and {b}."),
        BEAT("{a} and {b} sit at opposite ends of the garden for the rest of the evening."),
        BEAT("{c} and {d} catch each other's eye across the pool, and both look away first."),
      ],
    },
  },
  'camp-lobby': {
    moves: {
      open: [
        { stage: "{a} and {b} are lying on the sunbeds, and {a} rolls over to face {b}.", turns: [] },
        { stage: "{a} catches {b} on the way back from the shower.", turns: [] },
        { stage: "{a} hands {b} a drink and sits down very close.", turns: [] },
      ],
      lobby: [
        W(AGAINST, ['a', "I just think you should know that {c} says one thing to you and another thing to everyone else."]),
        W(AGAINST, ['a', "I'm not one to stir. But I'd watch {c}. That's all I'm saying. Watch {c}."]),
        W(AGAINST, ['a', "Have you noticed {c} is always nice to you when people are watching? Just something to think about."]),
        W(FOR, ['a', "Can I put in a good word for {c}? Because {c} won't do it {c.ref}."]),
        W(FOR, ['a', "I know {c} can come across a bit strong. Underneath that, {c} is a sweetheart. Honestly."]),
        W(FOR, ['a', "{c} talks about you all the time. Nice things. I thought you should know."]),
      ],
      answer: [
        W(AGAINST, ['b', "I'll keep my eyes open."], ['a', "That's all I'm asking."]),
        W(AGAINST, ['b', "Have you got a reason for saying that, or is this just a feeling?"], ['a', "A feeling. A strong one."]),
        W(FOR, ['b', "Really? I thought {c} didn't even like me."], ['a', "Trust me. {c} does."]),
        W(FOR, ['b', "Maybe I've been a bit harsh on {c}."], ['a', "Maybe a bit."]),
      ],
      land: [
        BW(AGAINST, "When {c} walks past a minute later, {b} doesn't look up."),
        BW(AGAINST, "{b} goes quiet, and {a} changes the subject very smoothly."),
        BW(FOR, "That evening, {b} saves {c} a seat, and {c} looks surprised and pleased."),
        BW(FOR, "{b} smiles over at {c}, and {c} smiles back, a bit confused."),
      ],
    },
  },
  'triangle-case': {
    moves: {
      open: [
        S("{a} catches {b} on the stairs.", ['a', "I know you've had about ten of these chats today. Can I have one more?"]),
        S("{a} sits down next to {b} on the swing seat.", ['a', "I'm not going to keep you long. I just need to say something."]),
        S("{a} finds {b} on the lawn and lies down next to {b.obj}.", ['a', "Can I make my case? Then I'll stop. Promise."]),
      ],
      case: [
        R(['a', "I'm not going to tell you what to do. I'm just going to tell you how I feel, and you can do what you like with it."]),
        R(['a', "{c} is lovely. I'm not saying {c} isn't. I'm saying I'm better for you. And I think you know that."]),
        R(['a', "Every morning, the first thing I do is look for you. I don't know if {c} does that. I do."]),
        R(['a', "I'm not good at big speeches. I just know that when I'm with you, I'm happy. That's my case."]),
        R(['a', "Think about the last time you really laughed in here. Who was it with? That's all I'm asking."]),
      ],
      answer: [
        R(['b', "This isn't easy."], ['a', "I know. I'm not trying to make it easy. I'm trying to make it honest."]),
        R(['b', "Thank you for saying all that. It means a lot."], ['a', "But?"], ['b', "No but. Just give me time."]),
        R(['b', "Why does everything in here have to be a choice?"], ['a', "Because that's the place we're in."]),
      ],
      land: [
        BEAT("{a} squeezes {b}'s hand and leaves {b.obj} to it."),
        BEAT("{c}, across the garden, has seen the whole thing."),
        BEAT("{b} stays where {a} left {b.obj}, chewing {b.posAdj} lip."),
      ],
    },
  },
  'triangle-torn': {
    moves: {
      say: [
        S("{a} sits on the kitchen floor with {b}, both of them holding a cup of tea.", ['a', "I feel like I'm hurting someone whatever I do. And I hate it. I'm not a person who hurts people."]),
        S("{a} pulls {b} into the dressing room and shuts the door.", ['a', "I need help. I like two people, and they both like me, and I feel like the worst person in the world."]),
        S("{a} lies on the daybed with {b}, staring at the sky.", ['a', "One of them is safe. One of them is exciting. I don't know which one I want."]),
      ],
      friend: [
        R(['b', "Stop thinking about who you'll hurt. Think about who you'll be happy with."], ['a', "That's so much harder."]),
        R(['b', "You're not a bad person. You're a person in a weird situation."], ['a', "A very weird situation."]),
        R(['b', "Which one do you miss when they're not around?"], ['a', "Oh. That's a good question."], ['b', "I know. I'm very wise."]),
        R(['b', "Toss a coin. Whatever it lands on, notice if you're disappointed."], ['a', "That's mad."], ['b', "It works."]),
      ],
      land: [
        BEAT("{a} buries {a.posAdj} face in a pillow and groans."),
        BEAT("{b} gives {a} a long hug, and neither of them says anything for a while."),
        BEAT("{a} looks out of the window, at the two people who are waiting for an answer."),
      ],
    },
  },
  hideaway: {
    moves: {
      arrive: [
        S("The Hideaway. Candles everywhere, and a bottle on ice.", ['a', "Is this all for us?"], ['b', "I think so. I'm scared to touch anything."]),
        S("The Hideaway door clicks shut behind them.", ['b', "Did you hear that?"], ['a', "What?"], ['b', "Nothing. Absolutely nothing. It's wonderful."]),
        S("The Hideaway. A bed the size of a small country.", ['a', "I want this side."], ['b', "It's the same on both sides."], ['a', "This side's better."]),
        S("The Hideaway. There's a note on the pillow, wishing them a lovely night.", ['b', "That's sweet."], ['a', "That's terrifying. Who's been in here?"]),
      ],
      talk: [
        R(['b', "I can't believe they picked us."], ['a', "I can. Look at us. We're very pickable."]),
        R(['a', "What's the first thing you want to do?"], ['b', "Sleep without someone snoring three beds away."], ['a', "Romantic."]),
        R(['b', "Can we stay here forever?"], ['a', "We'd have to pay rent."], ['b', "Worth it."]),
        R(['a', "Promise me something. No talking about the villa tonight."], ['b', "Deal. Just us."]),
        W({ rung: ['exclusive', 'official'] }, ['b', "It feels real in here. More real than out there."], ['a', "It is real. It's been real for a while."]),
        R(['a', "I've been waiting for this all week."], ['b', "Only all week?"], ['a', "All week, all day, all of it."]),
      ],
      land: [
        BEAT("The candles burn down, and so does the conversation."),
        BEAT("One of them laughs, and the camera decides that's enough for tonight."),
        BEAT("The lights go out. The rest is between them."),
      ],
    },
  },
  'bombshell-guess': {
    moves: {
      worry: [
        SW({ coupled: true, cast: 2 }, "{a} keeps glancing at the top of the steps.", ['b', "Stop looking."], ['a', "I'm not looking."], ['b', "You're looking right now."]),
        W({ coupled: true, cast: 2 }, ['a', "If they come in and they're gorgeous, I'm going to need you to tell me I'm gorgeous too."], ['b', "You're gorgeous."], ['a', "Louder, when they walk in."]),
        W({ coupled: true, cast: 2 }, ['b', "What happens if they want to chat to you?"], ['a', "I chat. Politely. For about four seconds."]),
        SW({ coupled: false, cast: 2 }, "{a} is bouncing on {a.posAdj} toes.", ['a', "I've got a feeling. A good feeling."], ['b', "You had a good feeling last time."]),
        W({ coupled: false, cast: 2 }, ['a', "I don't need them to be perfect. I just need them to look at me first."], ['b', "That's very specific."]),
        W({ another: true, coupled: false, cast: 2 }, ['a', "Second time lucky. Please. Second time lucky."], ['b', "Fingers crossed."]),
      ],
      answer: [
        W({ coupled: true, cast: 2 }, ['b', "Whoever it is, I'll still be here."], ['a', "Good. Stay exactly where you are."]),
        W({ coupled: true, cast: 2 }, ['a', "If they're your type, look at the floor."], ['b', "And if they're your type?"], ['a', "I'll look at the floor as well."]),
        W({ coupled: false, cast: 2 }, ['b', "Whoever walks in, you're going to be fine."], ['a', "I'm going to be better than fine. Hopefully."]),
        W({ coupled: false, cast: 2 }, ['a', "Do I look alright?"], ['b', "You look great. Stop touching your hair."]),
      ],
      land: [
        BEAT("Somebody on the lawn says, here we go, and everyone goes quiet."),
        BEAT("{a} takes a breath and holds it."),
        BEAT("The music changes, and every islander turns towards the steps at once."),
      ],
    },
  },
  'clear-the-air': {
    moves: {
      ask: [
        S("{a} sits down at the end of {b}'s sunbed, not too close.", ['a', "I don't want to fight. I want to talk. Can we do that?"], ['b', "We can try."]),
        S("{a} finds {b} in the kitchen and leans against the counter.", ['a', "I think we both owe each other a chat."], ['b', "I think you owe me one more."]),
        S("{a} and {b} end up alone in the garden, and {a} decides it's now or never.", ['a', "Shall we sort this out?"], ['b', "I'd like that. I think."]),
      ],
      say: [
        W(PEACE, ['a', "I don't want to be enemies with you. I don't think I ever did."]),
        W(PEACE, ['a', "I took it out on you. It wasn't all you. I'm sorry for that bit."]),
        W(ANGRY, ['a', "I'm here because the villa needs it, not because I've changed my mind."]),
        W(ANGRY, ['a', "I still think you were out of order. I'm just tired of being angry about it."]),
        R(['a', "This has gone on long enough. Everyone's walking on eggshells around us."]),
        R(['a', "I don't even remember how it started. I just know it's been miserable."]),
      ],
      answer: [
        W(PEACE, ['b', "I've missed talking to you, you know. Even when I was annoyed with you."], ['a', "Me too."]),
        W(PEACE, ['b', "Friends?"], ['a', "Friends. Don't make me regret it."]),
        W(ANGRY, ['b', "So nothing's changed."], ['a', "Nothing's changed. But I'll stop making it everyone's problem."]),
        W(ANGRY, ['b', "Fine. We don't have to like each other. We just have to share a pool."]),
      ],
      land: [
        BW(PEACE, "They sit there for a while afterwards, talking about nothing, which is new."),
        BW(PEACE, "{a} and {b} walk back in together, and the room relaxes at once."),
        BW(ANGRY, "They go back to opposite ends of the garden. Quieter, at least."),
        BW(ANGRY, "Nobody claps. It wasn't that kind of chat."),
      ],
    },
  },
};
