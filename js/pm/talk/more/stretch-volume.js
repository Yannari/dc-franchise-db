// pm/talk/more/stretch-volume.js — the story kinds, drawn more since the stretch
// (2026-10-30: with the stretch's stories carrying the episode, graft-eyes,
// watching and where-head were drawn ~20 times a season from movements of 4-8
// entries, and a line came back 5-7 times). Same facts and gates as
// pm/talk/graft-eyes.js, watching.js and where-head.js.

// graft-eyes [a, b, c, d]: {a} wants {c}, who is with {d}; {b} is the friend.
export const GRAFT_EYES_VOLUME = {
  moves: {
    open: [
      { stage: "{a} and {b} are doing lengths of the pool, and {a} stops halfway.", turns: [
        ['a', "Can I tell you something while nobody's in earshot?"],
        ['b', "You've stopped swimming to tell me. It must be big."],
        ['a', "It's not big. It's medium. It might be big."],
      ] },
      { stage: "{b} is plaiting {a}'s hair on the end of a sunbed.", turns: [
        ['b', "You've gone very quiet."],
        ['a', "I'm thinking."],
        ['b', "About?"],
        ['a', "Promise you won't move until I've finished. Then you can't walk off."],
      ] },
      { stage: "{a} sits down next to {b} on the steps by the pool and hands {b.obj} a drink.", turns: [
        ['b', "What's this for?"],
        ['a', "It's a bribe. I need you to listen to something and not judge me."],
        ['b', "That depends how big the drink is."],
      ] },
      { stage: "{a} and {b} are folding towels in the laundry room, the one place nobody else ever goes.", turns: [
        ['a', "Can I trust you with something?"],
        ['b', "We're folding towels in a cupboard. Of course you can."],
      ] },
      { stage: "{a} catches {b} on the way back from the shower and pulls {b.obj} onto the swing seat.", turns: [
        ['b', "I'm dripping wet."],
        ['a', "Sit down. Two minutes. I need to say something before I lose my nerve."],
      ] },
    ],
    want: [
      { turns: [
        ['a', "It's {c}. I know. Don't look at me like that. I've tried not to think about it, and it's made it worse."],
        ['b', "{c}'s with {d}."],
        ['a', "I know who {c}'s with. I sit across from them at dinner every day."],
      ] },
      { turns: [
        ['a', "Every time I'm in a group and {c} is in it, I stop listening to everyone else. I didn't even realise I was doing it until yesterday."],
        ['b', "What happened yesterday?"],
        ['a', "Someone asked me a question three times and I didn't hear it, because {c} was talking."],
      ] },
      { turns: [
        ['a', "I had a chat with {c} by the fire pit the other day. Ten minutes, maybe. And I haven't been able to stop going back over it."],
        ['b', "What did you talk about?"],
        ['a', "Nothing. Home. Families. That's the problem. It was nothing, and it was the best chat I've had in here."],
      ] },
      { when: { theirs: 'yes' }, turns: [
        ['a', "I'm not imagining it. {c} finds reasons to sit next to me. Every time. Even with {d} right there."],
        ['b', "Are you sure that's not just {c} being friendly?"],
        ['a', "Friendly people don't look at you like that. You know they don't."],
      ] },
      { when: { theirs: 'no' }, turns: [
        ['a', "I don't think {c} has looked at me twice. I'm not even sure {c} knows my surname. But I can't shake it."],
        ['b', "So you want to go for someone who hasn't noticed you, who's with someone else."],
        ['a', "When you put it like that it sounds stupid."],
        ['b', "It sounds brave. And a bit stupid."],
      ] },
      { when: { fresh: true }, turns: [
        ['a', "I came in here with a list of who I'd go for. {c} wasn't on it. I didn't know {c} existed. Now {c}'s the only name on it."],
        ['b', "And {d}?"],
        ['a', "{d} was on the list too, as the problem."],
      ] },
      { when: { taken: true }, turns: [
        ['a', "I'm going to say something that makes me sound awful. I'm with {pa}, and I keep wishing I was with {c}."],
        ['b', "That doesn't make you sound awful. It makes you sound like you need to be honest with {pa}."],
        ['a', "That's the bit I'm scared of."],
      ] },
    ],
    reply: [
      { when: { of: 'go-for-it' }, turns: [
        ['b', "You've been in here long enough to know nothing's safe until the final. If you want {c}, ask for a chat. Out loud. With everyone watching."],
        ['a', "With everyone watching is the scary bit."],
        ['b', "With everyone watching is the only way that doesn't come back on you."],
      ] },
      { when: { of: 'go-for-it' }, turns: [
        ['b', "Do it. I'd rather watch you try than listen to you talk about {c} for another week."],
        ['a', "I haven't talked about {c} for a week."],
        ['b', "You've talked about nothing else for three days."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "Just think about {d} for a second. Not because you owe {d} anything. Because if this goes wrong, you've still got to live in the same villa as {d}."],
        ['a', "I have thought about that."],
        ['b', "Think about it again."],
      ] },
      { when: { of: 'careful' }, turns: [
        ['b', "I'm not saying don't. I'm saying be sure. Because once you pull {c}, you can't take it back. Everyone will know, and {d} will know first."],
        ['a', "I know."],
        ['b', "So are you sure?"],
        ['a', "No. But I think I'm sure enough."],
      ] },
      { turns: [
        ['b', "What does {c} actually feel? Not what you hope. What has {c} actually said to you?"],
        ['a', "Nothing, really. It's more how {c} is around me."],
        ['b', "Then you need to find out before you blow anything up."],
      ] },
    ],
    plan: [
      { turns: [
        ['a', "I'm going to wait until {d} goes to the gym, and then I'm going to ask {c} to sit with me. That's all. Ten minutes."],
        ['b', "And if {c} says no?"],
        ['a', "Then I've had my answer, and I'll stop."],
      ] },
      { turns: [
        ['a', "I'm not going to do anything sneaky. I'll ask {c} in front of {d}. If {d} doesn't like it, at least nobody can say I hid it."],
        ['b', "That's either very honest or very stupid."],
        ['a', "Why can't it be both?"],
      ] },
      { turns: [
        ['a', "I'm just going to be around more. Sit near {c}. Make {c} laugh. If there's something there, it'll show."],
        ['b', "That's a long game."],
        ['a', "It's the only game I'm good at."],
      ] },
    ],
    close: [
      { turns: [['b', "Whatever happens, come and find me after."], ['a', "I will. Probably in a state."]] },
      { turns: [['b', "You're actually going to do it, aren't you?"], ['a', "I think I am."]], beat: "{b} squeezes {a}'s arm, and doesn't say anything else." },
      { turns: [['a', "Not a word to {d}."], ['b', "I wasn't going to."], ['a', "I know. I just had to say it."]] },
      { turns: [], beat: "{a} looks over at {c} one more time, and {b} watches {a} do it and shakes {b.posAdj} head." },
      { turns: [['b', "I hope it's worth it."], ['a', "So do I."]] },
      { turns: [['b', "Go on, then. Before you talk yourself out of it."]], beat: "{a} doesn't move. Then {a} does." },
    ],
  },
};

// watching [a, b, c, d]: {a} sees partner {c} go off with {d}; {b} is beside {a}.
// `chaser`: {c} went after {d}, not the other way round.
export const WATCHING_VOLUME = {
  moves: {
    spot: [
      { when: { of: 'sees', chaser: false }, stage: "{a} is halfway through a story when {d} walks past and taps {c} on the shoulder. {c} gets up and goes.", turns: [
        ['b', "Keep going. What happened next?"],
        ['a', "I've forgotten. I've completely forgotten what I was saying."],
      ] },
      { when: { of: 'sees', chaser: false }, stage: "{a} and {b} are in the pool when {d} pulls {c} up from the daybeds and the two of them walk off together.", turns: [
        ['a', "Where are they going?"],
        ['b', "I don't know. The swing seat, by the look of it."],
        ['a', "The swing seat. Of course it's the swing seat."],
      ] },
      { when: { of: 'sees', chaser: true }, stage: "{a} is getting two drinks from the kitchen when {a} sees {c} sit down next to {d} on the terrace.", turns: [
        ['a', "One of these was for {c}."],
        ['b', "Give it here. I'll drink it."],
        ['a', "No. I'm going to stand here and hold it and watch."],
      ] },
      { when: { of: 'sees' }, stage: "{a} and {b} are doing each other's nails on the daybeds. {a} stops halfway through a nail.", turns: [
        ['b', "You've gone over the edge."],
        ['a', "Look behind you. Slowly."],
        ['b', "Oh."],
      ] },
      { when: { of: 'told', chaser: false }, stage: "{b} comes back from the kitchen and sits down very close to {a}.", turns: [
        ['b', "Don't react. But {d} has just asked {c} for a chat, and got a yes."],
        ['a', "Don't react? How am I not supposed to react?"],
      ] },
      { when: { of: 'told', chaser: true }, stage: "{b} catches {a} coming out of the shower.", turns: [
        ['b', "Have you got a minute? Sit down first."],
        ['a', "Why do I need to sit down?"],
        ['b', "Because {c} has gone off with {d}. And {c} was the one who asked."],
      ] },
    ],
    talk: [
      { when: { chaser: false }, turns: [
        ['b', "You know {d}'s been building up to that for days."],
        ['a', "Then why didn't anyone tell me?"],
        ['b', "Because we thought {c} would say no."],
      ] },
      { when: { chaser: true }, turns: [
        ['b', "Did {c} say anything to you before? Anything at all?"],
        ['a', "{c} said something about getting some sun. That was it. Get some sun."],
        ['b', "Well, it is sunny over there."],
        ['a', "Don't."],
      ] },
      { turns: [
        ['b', "What do you want to do?"],
        ['a', "I want to know what they're saying. I want to know if {c} is laughing. That's all I want."],
        ['b', "You can't hear from here."],
        ['a', "I know. That's what's killing me."],
      ] },
      { turns: [
        ['a', "Be honest. If it was the other way round, if I'd gone off with someone, what would {c} be doing right now?"],
        ['b', "Sitting exactly where you're sitting, looking exactly like you look."],
        ['a', "Good. Then I'm allowed to feel like this."],
      ] },
      { when: { chaser: false }, turns: [
        ['b', "For what it's worth, {c} looked back at you. When {c} got up. I saw it."],
        ['a', "Did {c}?"],
        ['b', "For about a second. But {c} did."],
      ] },
    ],
    feel: [
      { turns: [
        ['a', "I'm trying to be the bigger person about it. I keep telling myself it's a chat, it's a game, everyone does it. And then I look over again and none of that helps."],
        ['b', "You don't have to be the bigger person. You can just be upset."],
      ] },
      { when: { chaser: false }, turns: [
        ['a', "What gets me is I trust {c}. I do. It's {d} I don't trust, and there's nothing I can do about that."],
        ['b', "You can trust {c} and still not like this."],
        ['a', "I really don't like this."],
      ] },
      { when: { chaser: true }, turns: [
        ['a', "I'd rather someone had pulled {c}. At least then I'd know {c} didn't choose it. This way, I know {c} did."],
        ['b', "You don't know what {c}'s saying over there."],
        ['a', "I know {c} walked over there on {c.posAdj} own two feet."],
      ] },
      { turns: [
        ['a', "Last night we were talking about what we'd do on the outside. Where we'd go first. And now I'm sitting here watching {c} with {d} like none of that happened."],
        ['b', "It still happened. One chat doesn't cancel it."],
        ['a', "It doesn't feel like it from here."],
      ] },
      { turns: [
        ['a', "I hate this bit. The not knowing. If {c} came back right now and said it's over, at least I'd know."],
        ['b', "Don't wish for that."],
        ['a', "I'm not. I just hate this bit."],
      ] },
    ],
    close: [
      { turns: [['a', "I'm going inside. If {c} asks where I am, tell {c.obj} you don't know."], ['b', "I'll tell {c.obj} you're in the dressing room."], ['a', "That's the opposite of what I said."]] },
      { turns: [['b', "Come on. Let's go and sit somewhere you can't see them."], ['a', "There's nowhere in this villa I can't see them."]], beat: "They move anyway, to the far end of the garden." },
      { turns: [], beat: "{a} picks up a magazine and holds it the right way up, and doesn't turn a single page." },
      { turns: [['a', "When {c} comes back, I'm going to be really normal."], ['b', "You've never been normal in your life."], ['a', "Watch me."]] },
      { turns: [['b', "Whatever happens, I'm here."], ['a', "I know. Thank you."]], beat: "{a} leans on {b}'s shoulder and keeps watching the swing seat." },
      { when: { chaser: false }, turns: [['a', "I'm going to have a word with {d}."], ['b', "Not now, you're not."], ['a', "Fine. Later, then."]] },
    ],
  },
};

// where-head [a, b, (c)]: {a} asks partner {b} what's going on; `story`
// graft (a chat with {c}) or doubt; `of` is {b}'s answer.
export const WHERE_HEAD_VOLUME = {
  moves: {
    open: [
      { stage: "{a} brings two cups of tea up to the roof terrace, where {b} is sitting on {b.posAdj} own.", turns: [
        ['b', "Is one of those for me?"],
        ['a', "Both of them, if you answer my question."],
      ] },
      { stage: "{a} sits down on the end of the bed while {b} is getting changed.", turns: [
        ['b', "You've got a face on."],
        ['a', "I've got a question on."],
      ] },
      { stage: "{a} catches {b} on the stairs and doesn't move out of the way.", turns: [
        ['b', "Are you going to let me past?"],
        ['a', "In a minute. Can we talk first?"],
      ] },
      { stage: "{a} and {b} are lying on a sunbed together, and {a} sits up.", turns: [
        ['b', "What's wrong?"],
        ['a', "I don't know if anything's wrong. That's what I want to find out."],
      ] },
    ],
    ask: [
      { when: { story: 'graft', chaser: false }, turns: [
        ['a', "I'm not going to shout, and I'm not going to cry. I just want to know what {c} said to you, and what you said back."],
        ['b', "That's very calm."],
        ['a', "I've had all afternoon to practise."],
      ] },
      { when: { story: 'graft', chaser: true }, turns: [
        ['a', "Half the villa told me you went and got {c}. I'd like to hear it from you, though. Is it true?"],
        ['b', "Yes."],
        ['a', "Okay. Then why?"],
      ] },
      { when: { story: 'doubt' }, turns: [
        ['a', "Can I ask you something without you getting defensive? Do you still want to be in this? With me?"],
        ['b', "Why are you asking that?"],
        ['a', "Because you used to come and find me. You don't any more. I always come and find you."],
      ] },
      { when: { story: 'doubt' }, turns: [
        ['a', "I lay awake last night trying to work out what I'd done. And I couldn't think of anything. So I'm asking you. What did I do?"],
        ['b', "You didn't do anything."],
        ['a', "Then what's changed?"],
      ] },
    ],
    answer: [
      { when: { story: 'graft', of: 'reassure', kissed: false, chaser: false }, turns: [
        ['b', "{c} said there was something there. I said thank you, and that I'm with you, and I meant it. Then I sat there being polite for twenty minutes because I didn't know how to leave."],
        ['a', "Twenty minutes of polite?"],
        ['b', "It felt like an hour. I kept looking over at you."],
      ] },
      { when: { story: 'doubt', of: 'reassure' }, turns: [
        ['b', "I miss home. I miss my family. Some days it hits me, and I go quiet, and I know it looks like it's about you. It isn't. You're the best thing in here."],
        ['a', "Why didn't you just say that?"],
        ['b', "Because saying it out loud makes it worse."],
      ] },
      { when: { story: 'doubt', of: 'honest', why: ['cooling', 'behind'] }, turns: [
        ['b', "I like you. I do. But I think I like you the way you like a friend you'd do anything for, and not the way you're supposed to like the person you're coupled up with."],
        ['a', "When did you work that out?"],
        ['b', "A few days ago. I've been trying to un-work it out ever since."],
      ] },
      { when: { story: 'graft', of: 'deflect' }, turns: [
        ['b', "Do you want to know what we talked about? The weather. Where we're from. Nothing. And you've walked me up here like I'm in trouble."],
        ['a', "You're not in trouble. I'm asking."],
        ['b', "It doesn't feel like asking."],
      ] },
    ],
    push: [
      { when: { of: 'reassure' }, turns: [
        ['a', "Next time, tell me first. Before I hear it from someone else. That's all I'm asking."],
        ['b', "I will. I promise."],
      ] },
      { when: { of: 'honest' }, turns: [
        ['a', "I don't know what to do with that. I need you to give me a minute."],
        ['b', "Take as long as you want."],
        ['a', "Don't be nice to me right now. It makes it worse."],
      ] },
      { when: { of: 'deflect' }, turns: [
        ['a', "Every time I ask you something, you answer a different question. Have you noticed that?"],
        ['b', "That's not true."],
        ['a', "You've just done it again."],
      ] },
      { when: { of: 'lie' }, turns: [
        ['a', "Okay. I'm going to believe you, because I want to. Please don't make me wrong."],
        ['b', "I won't."],
      ] },
    ],
    close: [
      { when: { of: 'reassure' }, turns: [['a', "Come on, then. Let's go back down before they send a search party."]], beat: "They go down the stairs holding hands, and the villa pretends not to notice." },
      { when: { of: 'reassure' }, turns: [], beat: "{a} lets out a long breath, and {b} laughs at how long it is." },
      { when: { of: 'honest' }, turns: [['b', "Do you want me to go?"], ['a', "No. Stay. I just don't want to talk."]], beat: "They sit there in silence until somebody shouts that dinner's ready." },
      { when: { of: 'deflect' }, turns: [], beat: "{b} goes back downstairs first. {a} waits a whole minute before following, so it doesn't look like they've been together." },
      { when: { of: 'lie' }, turns: [['b', "Are we okay?"], ['a', "We're okay."]], beat: "{b} smiles. When {a} turns away, {b} stops." },
    ],
  },
};

// group-chat [a, b, (c), (d)]: {a} tells the others; {x} is who it's about.
// `pulled` is the stretch's commonest (17 a season): {x} pulled {a}, who is with {pa}.
const THREE = [3, 4];
export const GROUP_CHAT_STRETCH = {
  moves: {
    gather: [
      { when: { subj: 'pulled', taken: true }, stage: "{a} sits down on the daybeds, and the others turn round all at once.", turns: [
        ['b', "Well? We watched you go. We've been sitting here guessing."],
        ['a', "What were you guessing?"],
        ['b', "That's not how this works. You talk first."],
      ] },
      { when: { subj: 'pulled', taken: true }, stage: "{a} walks into the dressing room, and {b} puts the hairdryer down.", turns: [
        ['b', "Shut the door."],
        ['a', "It's shut."],
        ['b', "Right. What did {x} want?"],
      ] },
      { stage: "{a} comes over to the kitchen island, where the others have been waiting.", turns: [
        ['b', "Come on. We've been holding our breath for ten minutes."],
        ['a', "You could have breathed."],
      ] },
      { stage: "{a} climbs into the hammock next to {b}, and the others drag the beanbags over.", turns: [
        ['b', "Right. We're all comfy. Go."],
      ] },
    ],
    react: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Did you say you were happy with {pa}? In those words?"],
        ['a', "I said {pa} and I are good."],
        ['b', "That's not the same thing, and you know it isn't."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "Be honest. If {pa} had been sitting next to you, would you have said anything different?"],
        ['a', "No. Maybe. A bit."],
        ['b', "Then that's what you need to think about."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "I'm just going to say it. You went quite red when {x} asked you."],
        ['a', "It's hot. Everyone's red."],
        ['b', "Not like that."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['b', "What's {x} actually like, one to one? I've never really talked to {x} on my own."],
        ['a', "Nicer than I wanted, honestly. That's the problem."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['b', "At least {x} was straight with you. Some people string it out for a week."],
        ['a', "I'd rather {x} had strung it out. Then I'd have had a week."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['b', "I'm so sorry. I'd want to know, but I'd hate to know. Both at once."],
        ['a', "That's exactly it. Both at once."],
      ] },
    ],
    react2: [
      { when: { subj: 'pulled', cast: THREE }, turns: [
        ['c', "I'd keep an eye on {x}. Not because {x}'s bad. Because {x} doesn't give up."],
        ['a', "How do you know that?"],
        ['c', "Because I've watched {x} at dinner."],
      ] },
      { when: { subj: 'pulled', taken: true, cast: THREE }, turns: [
        ['c', "Can I say the unpopular thing? You've been a bit flat with {pa} this week. Maybe that's why {x} thought there was a gap."],
        ['b', "That's harsh."],
        ['c', "It's not harsh. It's what everyone's been saying."],
      ] },
      { when: { subj: 'pulled', cast: THREE }, turns: [
        ['c', "If it was nothing, why are we all sitting here talking about it?"],
        ['a', "Because you made me sit down."],
        ['c', "You sat down quite quickly."],
      ] },
      { when: { subj: ['knocked-back', 'shut-down'], cast: THREE }, turns: [
        ['c', "Give it a day. It'll hurt less tomorrow, and the day after that it'll be a story."],
        ['a', "I don't want it to be a story."],
      ] },
      { when: { subj: 'found-out', cast: THREE }, turns: [
        ['c', "Do you want us to stop talking to {x}? Because we will."],
        ['a', "No. I don't want everyone falling out over me."],
        ['c', "We wouldn't be falling out over you. We'd be falling out over what {x} did."],
      ] },
    ],
    verdict: [
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "Nothing's changed. I'm with {pa}. I just need a minute to stop thinking about it."],
        ['b', "Take the minute. Then go and find {pa}."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I'm going to tell {pa} it happened. I'm not going to tell {pa} I enjoyed it."],
        ['b', "That's a very careful line."],
        ['a', "It's a very careful situation."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I think I just need to see how I feel around {pa} after this. If it's the same, it's the same."],
        ['b', "And if it isn't?"],
        ['a', "Then I've got a problem, haven't I."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "I'm going to keep my distance from {x} for a bit. Not because anything happened. Because I don't want it to."],
        ['b', "That's actually really sensible."],
        ['a', "Don't sound so shocked."],
      ] },
      { when: { subj: 'pulled', taken: true }, turns: [
        ['a', "Can we agree this stays between us until I've talked to {pa}?"],
        ['b', "It stays here."],
        ['a', "Everyone always says that."],
      ] },
      { when: { subj: 'shut-down' }, turns: [
        ['a', "I'm not going to sulk. I asked, {x} answered. That's fair."],
        ['b', "That's very grown up."],
        ['a', "I'll sulk later, on my own."],
      ] },
      { when: { subj: 'found-out' }, turns: [
        ['a', "I'm not going to do anything with it yet. I want to watch how {x} is with me first."],
        ['b', "You're going to watch {x}?"],
        ['a', "I'm going to watch {x} very closely."],
      ] },
      { when: { subj: 'row' }, turns: [
        ['a', "I said what I needed to say. If {x} wants to talk, I'm not hard to find."],
        ['b', "And if {x} doesn't come?"],
        ['a', "Then I've got my answer."],
      ] },
    ],
    close: [
      { turns: [['b', "Come on. Let's go and get a drink."], ['a', "That's your answer to everything."], ['b', "It's a good answer."]] },
      { turns: [], beat: "{b} squeezes {a}'s hand, and they go back out to the others." },
      { turns: [['a', "Thanks for listening."], ['b', "Always. Even when it's boring."], ['a', "It's never boring."]] },
      { turns: [], beat: "The chat breaks up when somebody shouts from the kitchen, but {b} stays sitting with {a} a minute longer." },
      { when: { subj: 'pulled', taken: true }, turns: [['b', "Go and find {pa}. Now, before you think about it too much."]], beat: "{a} gets up, then sits back down, then gets up again." },
      { when: { subj: 'pulled' }, turns: [], beat: "Across the garden, {x} looks over. Everyone on the daybeds suddenly finds something else to look at." },
      { when: { subj: ['found-out', 'row'] }, turns: [['b', "You're going to be okay."], ['a', "I know. Just not yet."]] },
      { when: { subj: ['celebrate', 'progress'] }, turns: [['b', "I'm so happy for you."], ['a', "Stop it, you'll set me off."]], beat: "Everyone starts talking at once about who's next." },
    ],
  },
};
