// pm/talk/whole/long-more.js — more of the long talks (whole/long.js), so the
// episode's own story doesn't hear the same one twice a fortnight. Measured
// 2026-11-03 on seed 7: with three a bucket, one pull played six times a season.
// Same casts, facts and rules as long.js.
const M = { main: true };

export const LONG_PULL_MORE = [
  { when: { ...M, story: 'graft', bTaken: true, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} and {b} end up on their own at the far end of the pool, feet in the water.", turns: [
    ['b', "You've been following me round all afternoon."],
    ['a', "Have I? I thought I was being subtle."],
    ['b', "You weren't."],
    ['a', "Then I might as well just say it. I like you. I know you're with {pb}, and I like you anyway."],
    ['b', "Why are you telling me?"],
    ['a', "Because I'd rather you heard it from me than worked it out."],
    ['b', "I'd already worked it out."],
    ['a', "And?"],
    ['b', "And I don't know. {pb} is lovely. {pb} hasn't done anything wrong."],
    ['a', "I'm not saying {pb} has. I'm saying I'm here, if you ever want to know what it's like with somebody else."],
    ['b', "That's a lot to say to somebody's partner."],
    ['a', "I know. I'll stop. I just wanted it said once."],
    ['b', "It's been said."],
  ], beat: "{b} pulls {b.posAdj} feet out of the water and goes back to {pb}, and keeps glancing back at the pool on the way." },
  { when: { ...M, story: 'graft', bTaken: true, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} brings {b} a drink out on the terrace and sits down without asking.", turns: [
    ['b', "I didn't ask for a drink."],
    ['a', "I know. It was an excuse."],
    ['b', "An excuse for what?"],
    ['a', "To have ten minutes with you where nobody's listening."],
    ['b', "Somebody's always listening in here."],
    ['a', "Then I'll say it quietly. I think about you a lot. More than I should, with you being with {pb}."],
    ['b', "You can't keep doing this."],
    ['a', "Doing what?"],
    ['b', "Saying things like that, and then walking away and leaving me to think about them."],
    ['a', "Do you think about them?"],
    ['b', "That's not the point."],
    ['a', "It's a bit the point."],
    ['b', "Drink your drink."],
  ], beat: "They sit there until the drinks are finished, not saying much, and neither of them is the first to get up." },
  { when: { ...M, story: 'graft', bTaken: true, taken: false, end: 'flirt', kissed: false, promised: false }, stage: "{a} sits down next to {b} on the daybeds, while {pb} is in the shower.", turns: [
    ['a', "Can I ask you something honest?"],
    ['b', "You always do."],
    ['a', "Are you happy with {pb}? Really happy?"],
    ['b', "Why does it matter to you?"],
    ['a', "Because if you are, I'll leave it. I'll stop. And if you're not, I'd like to know."],
    ['b', "That's not a fair thing to ask me."],
    ['a', "I know. I'm asking anyway."],
    ['b', "I'm happy. Mostly. There are days I'm not sure."],
    ['a', "What are those days like?"],
    ['b', "Like today, sitting here with you, when I should be waiting for {pb}."],
    ['a', "Okay."],
    ['b', "Don't look at me like that. I didn't say anything."],
    ['a', "You said a lot."],
  ], beat: "{b} gets up when the shower stops, and goes inside without another word." },
];

export const LONG_GRAFT_EYES_MORE = [
  { when: { ...M, taken: false, fresh: false, theirs: 'yes', of: 'careful' }, stage: "{a} and {b} are on the sunbeds at the far end of the garden.", turns: [
    ['a', "I need your honest opinion on something."],
    ['b', "Go on."],
    ['a', "{c}. Do you think there's something there? With me?"],
    ['b', "Honestly? Yes. {c} lights up when you walk in."],
    ['a', "I thought it was just me hoping."],
    ['b', "It's not just you. But {c} is with {d}, who is not going to take it well."],
    ['a', "I know. That's what stops me."],
    ['b', "Good. It should stop you for a bit."],
    ['a', "For a bit?"],
    ['b', "Until you know it's real. If you go for it and {c} stays with {d}, you've made an enemy for nothing."],
    ['a', "And if {c} doesn't stay?"],
    ['b', "Then you'll have to live with how it happened. So make sure it happens properly."],
  ], beat: "{a} lies back on the sunbed and doesn't say anything for a long time." },
  { when: { ...M, taken: false, fresh: false, theirs: 'no', of: 'careful' }, stage: "{a} and {b} are in the kitchen, making everyone's drinks.", turns: [
    ['a', "Can I tell you something, and you won't laugh?"],
    ['b', "I can't promise that."],
    ['a', "I like {c}."],
    ['b', "I'm not laughing. I'm just thinking about {d}."],
    ['a', "Everyone thinks about {d}. That's the problem."],
    ['b', "Has {c} given you anything back?"],
    ['a', "Not really. A smile. A chat at the pool. That's it."],
    ['b', "Then I'd be careful. A smile isn't much to break up a couple over."],
    ['a', "I'm not trying to break anything up."],
    ['b', "You will be, the minute you say it. That's what it'll look like."],
    ['a', "So I do nothing?"],
    ['b', "You do nothing yet. You get to know {c}. If there's something there, it'll show."],
  ], beat: "{a} carries the tray outside, puts a drink down in front of {c}, and doesn't stay." },
];

export const LONG_WATCHING_MORE = [
  { when: { ...M, of: 'sees', chaser: false, xAgain: false, heat: ['flirty', 'steamy'] }, stage: "{a} and {b} are on the swing seat when {d} sits down next to {c} on the lawn.", turns: [
    ['a', "Don't turn round."],
    ['b', "Why?"],
    ['a', "Because {d} has just sat down next to {c}, and I don't want them to see us looking."],
    ['b', "Are they close?"],
    ['a', "Close enough. {c} is laughing. {c.He} laughs like that with me."],
    ['b', "It might not mean anything."],
    ['a', "It means {d} is trying. And {c} is letting {d.obj}."],
    ['b', "Do you want me to go over and break it up?"],
    ['a', "No. I want to see what {c} does on {c.posAdj} own."],
    ['b', "That's a bit of a test."],
    ['a', "It is a test. I'm allowed one."],
    ['b', "And if {c} fails it?"],
    ['a', "Then I'd rather know now than at the fire pit."],
  ], beat: "The swing seat stops moving. Neither of them pushes it." },
  { when: { ...M, of: 'sees', chaser: false, xAgain: false, heat: ['light', 'cold', 'one-sided'] }, stage: "{a} and {b} are lying by the pool. On the far side, {d} is talking to {c}.", turns: [
    ['a', "There's {d} again."],
    ['b', "{c} doesn't look that bothered."],
    ['a', "No. {c} looks polite. That's what worries me."],
    ['b', "Why does polite worry you?"],
    ['a', "Because polite is what you do when you don't want to say no yet."],
    ['b', "Or when you don't know how to get away."],
    ['a', "Maybe. I just wish {c} would get up and come over here."],
    ['b', "Have you told {c} that?"],
    ['a', "I don't want to be the one who needs it said."],
    ['b', "Everybody needs it said sometimes."],
  ], beat: "{c} looks over, sees {a}, and waves. {a} waves back, a second too late." },
];

export const LONG_WHERE_HEAD_MORE = [
  { when: { ...M, story: 'graft', of: 'reassure', kissed: false, rowedToday: false }, stage: "{a} sits {b} down on the end of the bed in the empty bedroom.", turns: [
    ['a', "I'm not going to get angry. I just want to know."],
    ['b', "Know what?"],
    ['a', "What's happening with {c}. Because everyone's talking about it, and I'm the only one who hasn't asked you."],
    ['b', "Nothing's happening. {c} wants something to happen. That's different."],
    ['a', "And you?"],
    ['b', "I'm with you. I've told {c} that."],
    ['a', "Have you? Properly?"],
    ['b', "Maybe not properly. I've been too nice about it. I didn't want to make a scene."],
    ['a', "I'd rather you made a scene than left the door open."],
    ['b', "Then I'll shut it. Tomorrow, in front of whoever's there."],
    ['a', "You don't have to do it in front of anyone."],
    ['b', "I want to. So you don't have to wonder."],
  ], beat: "{a} reaches out, and {b} takes {a.posAdj} hand and holds on." },
];

export const LONG_VENT_MORE = [
  { when: { ...M, taken: true, why: 'cooling' }, stage: "{a} and {b} are sitting on the edge of the hot tub with their feet in.", turns: [
    ['a', "Can I be really honest about {pa}?"],
    ['b', "Go on."],
    ['a', "I'm not sure I feel it any more. I keep waiting for it to come back, and it doesn't."],
    ['b', "Has {pa} done something?"],
    ['a', "No. {pa} has been lovely. That's what makes me feel so bad."],
    ['b', "Feelings don't always have a reason."],
    ['a', "I know. I just thought I'd be the one who knew what I wanted."],
    ['b', "Are you going to say something?"],
    ['a', "I don't know how. How do you tell somebody nice that you've gone off them for no reason?"],
    ['b', "Gently. And soon. Before {pa} works it out from your face."],
    ['a', "Is it on my face?"],
    ['b', "A bit. Yeah."],
  ], beat: "{a} pulls {a.posAdj} feet out of the water and sits there, dripping, looking at nothing." },
  { when: { ...M, taken: true, why: 'eyes' }, stage: "{a} and {b} are folding towels in the bedroom, the only two inside.", turns: [
    ['a', "If I tell you something, will you promise not to look at {x} differently?"],
    ['b', "That depends what it is."],
    ['a', "I think I like {x}. And I'm with {pa}."],
    ['b', "Oh. Okay. How much do you like {x}?"],
    ['a', "Enough that I keep looking for {x} when I walk outside."],
    ['b', "And {pa}?"],
    ['a', "I still care about {pa}. I do. It's just not the same feeling."],
    ['b', "Has anything happened with {x}?"],
    ['a', "No. Nothing. I wouldn't do that to {pa}."],
    ['b', "Then you've still got time to work out what you want before anybody gets hurt."],
    ['a', "Somebody's going to get hurt either way."],
    ['b', "Then make sure it's done honestly."],
  ], beat: "{b} hands {a} the last towel, and {a} folds it twice without noticing." },
];

export const LONG_FEELS_OFF_MORE = [
  { when: { ...M, of: 'unsure' }, stage: "{a} and {b} are in the kitchen, waiting for the kettle.", turns: [
    ['a', "Can I ask you something? You won't tell anyone?"],
    ['b', "Of course I won't."],
    ['a', "Has {c} said anything to you? About us?"],
    ['b', "No. Nothing. Should {c} have?"],
    ['a', "I don't know. {c} just feels further away. Like I'm talking and {c} is thinking about something else."],
    ['b', "Maybe {c} is just tired."],
    ['a', "That's what {c} says. Tired."],
    ['b', "Do you believe it?"],
    ['a', "I want to. It's just been tired for a few days now."],
    ['b', "Then you have to ask {c}. Not me. I genuinely don't know anything."],
    ['a', "I know you don't. I think I just wanted someone to tell me I'm being silly."],
    ['b', "You're not being silly. You're paying attention."],
  ], beat: "The kettle clicks off, and neither of them moves to pour it." },
];

// The three buckets the first two batches missed (the season's most-heard in seed 7;
// the pull and the told crush serve any story, the third's too, which drew them seven times):
// a pull with both of them coupled, a crush told to a friend by somebody coupled,
// and {c} going over to {d} (chaser) while {a} watches.
export const LONG_PULL_BOTH = [
  { when: { story: 'graft', bTaken: true, taken: true, end: 'flirt', kissed: false, promised: false }, stage: "{a} and {b} are on the swing seat while everybody else is in the pool.", turns: [
    ['b', "We're always the two who end up out of the pool."],
    ['a', "I don't think that's an accident. Not on my side."],
    ['b', "Don't. You're with {pa}."],
    ['a', "I know I'm with {pa}. And you're with {pb}. I'm not pretending either of those isn't true."],
    ['b', "Then what are you saying?"],
    ['a', "That I look forward to this. Five minutes on a swing seat. And I don't think I'm meant to."],
    ['b', "I look forward to it too."],
    ['a', "That doesn't help."],
    ['b', "No. It doesn't."],
    ['a', "What do we do with that?"],
    ['b', "Nothing. Not with both of them in the pool, watching."],
    ['a', "And if they weren't?"],
    ['b', "Then I'd still say nothing. And I'd still be sitting here."],
  ], beat: "{pa} waves from the pool. {a} waves back, and doesn't get up." },
  { when: { story: 'graft', bTaken: true, taken: true, end: 'flirt', kissed: false, promised: false }, stage: "{a} and {b} are the last two in the kitchen after dinner.", turns: [
    ['a', "Can I say something, and you can tell me to shut up?"],
    ['b', "Go on."],
    ['a', "I like you. Not as a friend. I've been trying to make it be as a friend, and it won't."],
    ['b', "We're both in couples."],
    ['a', "I know. I'm not asking you to leave {pb}. I'm not going to leave {pa} tonight. I'm just telling you."],
    ['b', "Why tell me, if you're not going to do anything?"],
    ['a', "Because I think you feel it too, and I didn't want to be the only one pretending."],
    ['b', "You're not the only one."],
    ['a', "Okay."],
    ['b', "But we can't do this. Not like this. Not behind their backs."],
    ['a', "Then we don't. We just know."],
  ], beat: "{b} dries {b.posAdj} hands and goes out to the terrace, where {pb} is waiting." },
];

export const LONG_GRAFT_EYES_TAKEN = [
  { when: { taken: true, fresh: false, of: 'go-for-it' }, stage: "{a} pulls {b} into the dressing room and shuts the door.", turns: [
    ['a', "I need to say something to somebody, or I'm going to burst."],
    ['b', "What's happened?"],
    ['a', "Nothing's happened. I just can't stop thinking about {c}."],
    ['b', "{c}? You're with {pa}."],
    ['a', "I know. And {c} is with {d}. It's a mess."],
    ['b', "How long have you felt like this?"],
    ['a', "A couple of days. Every time {c} talks to me, I forget where I am."],
    ['b', "Then you need to stop being in a couple you don't want to be in."],
    ['a', "That's not fair on {pa}."],
    ['b', "What's not fair is you lying next to {pa} every night, thinking about {c}."],
    ['a', "So you think I should go for it?"],
    ['b', "I think you should be honest with {pa} first. Then do what you like."],
  ], beat: "{a} sits down on the stool, staring at the mirror, as if {a.posAdj} reflection might answer." },
  { when: { taken: true, fresh: false, of: 'careful' }, stage: "{a} and {b} are on the sunbeds, away from the others.", turns: [
    ['a', "Can I tell you something you can't tell anyone?"],
    ['b', "Of course."],
    ['a', "I think I've got feelings for {c}."],
    ['b', "Oh, no. With {pa} right there?"],
    ['a', "I know. I hate it."],
    ['b', "Has anything happened?"],
    ['a', "No. A few long chats. That's all."],
    ['b', "Then keep it to a few long chats. Don't make a decision you can't take back over a feeling you've had for two days."],
    ['a', "What if it doesn't go away?"],
    ['b', "Then you'll know, and you deal with {pa} first. But give it time."],
  ], beat: "{a} nods, and puts {a.posAdj} sunglasses back on, and doesn't look over at {c} for a whole minute." },
];

export const LONG_WATCHING_CHASER = [
  { when: { ...M, of: 'sees', chaser: true, xAgain: false }, stage: "{a} and {b} are on the daybeds. {a} watches {c} walk across the garden to {d} and sit down.", turns: [
    ['a', "Did you see that?"],
    ['b', "I saw."],
    ['a', "{c} went over to {d}. {d} didn't come to {c}. {c} went."],
    ['b', "Maybe there was something {c} needed to say."],
    ['a', "Then {c} could have said it here. In front of me."],
    ['b', "Do you want to go over?"],
    ['a', "No. I want to know why my partner is walking across a garden to somebody else."],
    ['b', "Ask {c} later. Not in front of everyone."],
    ['a', "I will. And I want a better answer than just a chat."],
    ['b', "What if it is just a chat?"],
    ['a', "Then {c} should have had it with me."],
  ], beat: "{a} stares across the garden, and {b} puts a hand on {a.posAdj} arm and leaves it there." },
];
