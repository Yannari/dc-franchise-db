// pm/talk/more/everyday.js — more for the pools a season wears thin (measured
// 2026-10-22 over two seasons: a pool's most uses in one episode against its
// size). Same casts and facts as each kind's own file.

// The pull's landing words (a pool tests facts by value).
const LANDS_OK = ['flirt', 'kissed', 'promised'];

export const CHAT_MORE = {
  moves: {
    feel: [
      { when: { end: 'warm' }, turns: [
        ['b', "Do you know what I love about us? We never run out of things to say. Even when we're saying nothing, it's not awkward."],
        ['a', "That's because you talk enough for both of us."],
        ['b', "Rude. True. But rude."],
      ] },
      { when: { end: 'warm' }, turns: [
        ['a', "I keep catching myself smiling at nothing. Everyone's noticed. Somebody asked me this morning if I was all right."],
        ['b', "And what did you say?"],
        ['a', "I said I'm better than all right, and then I looked at you, and they all groaned."],
      ] },
      { when: { end: 'warm', feels: 'strong' }, turns: [
        ['b', "Can I tell you something? When the text comes for a recoupling now, I don't even panic. I used to feel sick. Now I just know."],
        ['a', "You just know what?"],
        ['b', "That it's you. That it's going to be you."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['a', "Is it weird that I feel like I've known you for ages?"],
        ['b', "No. That's this place. A day in here is like a week out there."],
        ['a', "So we've basically been together for months."],
        ['b', "Practically married."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['b', "I like that we don't have to try too hard. Some couples in here are exhausting to watch."],
        ['a', "We're the low-maintenance couple."],
        ['b', "We're the couple who share a sunbed and don't argue about it."],
      ] },
      { when: { end: 'easy' }, turns: [
        ['a', "Where do you see this going? Honestly, no pressure."],
        ['b', "Honestly? I think it's going somewhere good. I'm not in a rush to label it. I just know I'm happy waking up next to you."],
        ['a', "That'll do for now."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['b', "Can I be honest about something? I feel like we've stopped trying a bit. Both of us."],
        ['a', "I didn't know you felt like that."],
        ['b', "I didn't either until I said it."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['a', "You're on your phone again."],
        ['b', "We haven't got phones."],
        ['a', "You know what I mean. You're somewhere else."],
        ['b', "I'm sorry. I'm just tired."],
      ] },
      { when: { end: 'flat' }, turns: [
        ['b', "We should probably talk about where this is going."],
        ['a', "Should we?"],
        ['b', "That's exactly why we should."],
      ] },
    ],
    close: [
      { when: { end: ['warm', 'easy'] }, turns: [['a', "Come on, let's go and annoy everyone with how happy we are."], ['b', "My favourite hobby."]] },
      { when: { end: ['warm', 'easy'] }, turns: [], beat: "{b} pulls {a} to {b.posAdj} feet, and they wander back to the others with their arms round each other." },
      { when: { end: 'warm' }, turns: [['b', "I'll save you a seat at dinner."], ['a', "You'd better."]] },
      { when: { end: ['warm', 'easy'] }, turns: [], beat: "They stay curled up until someone shouts that the food's ready." },
      { when: { end: 'easy' }, turns: [['a', "Right. I'm going to get changed."], ['b', "Don't take an hour."], ['a', "No promises."]] },
      { when: { end: 'flat' }, turns: [], beat: "{a} gives {b} a quick kiss on the head and goes inside. It feels like a full stop." },
      { when: { end: 'flat' }, turns: [['b', "I'll see you in a bit."], ['a', "Yeah. See you in a bit."]] },
      { when: { end: 'warm', phase: 'evening' }, turns: [['b', "Let's go to bed early tonight. Just us."], ['a', "There's no just us in a bedroom of twenty."], ['b', "Just us under the covers, then."]] },
      { when: { end: ['warm', 'easy'] }, turns: [], beat: "{a} kisses {b} on the cheek and goes to help in the kitchen." },
    ],
  },
  notes: [
    { when: { end: 'warm' }, stage: "{a} and {b} spend the afternoon curled up on a sunbed, talking about the outside." },
    { when: { end: 'warm' }, stage: "{a} and {b} can't stop laughing on the swing seat." },
    { when: { end: 'warm' }, stage: "{a} brings {b} a drink and they sit together by the pool for an hour." },
    { when: { end: 'warm' }, stage: "{a} and {b} share a quiet chat on the terrace, holding hands." },
    { when: { end: 'easy' }, stage: "{a} and {b} have a lazy chat by the pool." },
    { when: { end: 'easy' }, stage: "{a} and {b} sit together at lunch, swapping stories." },
    { when: { end: 'easy' }, stage: "{a} and {b} have a catch-up on the daybeds." },
    { when: { end: 'easy' }, stage: "{a} and {b} talk about what they'll do first when they get home." },
    { when: { end: 'flat' }, stage: "{a} and {b} sit together, both of them somewhere else." },
    { when: { end: 'flat' }, stage: "{a} tries to start a conversation with {b}. It doesn't really get going." },
    { when: { end: 'flat' }, stage: "{a} and {b} share a sunbed in near silence." },
    { stage: "{a} and {b} have a chat in the hot tub." },
    { stage: "{a} and {b} talk about their families on the terrace." },
    { stage: "{a} and {b} make lunch together, side by side." },
  ],
};

export const DEEP_MORE = {
  notes: [
    { when: { end: 'open' }, stage: "{b} tells {a} things {b} has never told anyone in the villa." },
    { when: { end: 'open' }, stage: "{a} and {b} talk late into the night about what they want from life." },
    { when: { end: 'open' }, stage: "{a} and {b} have a long, honest chat about trust." },
    { when: { end: 'open' }, stage: "{a} and {b} talk about their past relationships, properly, for the first time." },
    { when: { end: 'open' }, stage: "{a} asks {b} what {b} is scared of, and {b} answers." },
    { when: { end: 'open' }, stage: "On the terrace, {a} and {b} talk about the future." },
    { when: { end: 'guarded' }, stage: "{a} asks {b} about home. {b} keeps the answer short." },
    { when: { end: 'guarded' }, stage: "{a} tries to get to know the real {b}. {b} isn't ready." },
    { when: { end: 'guarded' }, stage: "{b} laughs off every serious question {a} asks." },
    { when: { end: 'guarded' }, stage: "{a} and {b} talk, but {b} keeps it light." },
    { stage: "{a} and {b} have a heart-to-heart on the daybed." },
    { stage: "{a} and {b} talk for hours by the fire pit." },
  ],
};

export const KISS_MORE = {
  notes: [
    { when: { end: ['warm', 'easy'] }, stage: "{a} and {b} kiss in the pool." },
    { when: { end: ['warm', 'easy'] }, stage: "{a} pulls {b} onto {a.posAdj} lap for a kiss." },
    { when: { end: ['warm', 'easy'] }, stage: "{a} and {b} kiss on the terrace as the sun goes down." },
    { when: { end: ['warm', 'easy'] }, stage: "{a} steals a kiss from {b} in the kitchen." },
    { when: { end: 'warm' }, stage: "{a} and {b} kiss until someone tells them to get a room." },
    { when: { end: 'warm' }, stage: "{a} and {b} have a very long kiss on the swing seat." },
    { when: { end: 'easy' }, stage: "{a} and {b} share a quick kiss by the pool." },
    { when: { end: 'easy' }, stage: "{a} gives {b} a kiss before heading inside." },
    { when: { end: 'off' }, stage: "{a} kisses {b}, and {b} pulls away a little too fast." },
    { when: { end: 'off' }, stage: "{a} and {b} kiss. It's awkward, and they both know it." },
    { when: { end: 'first' }, stage: "{a} and {b} finally kiss, and both of them grin about it all afternoon." },
    { when: { end: 'first' }, stage: "{a} and {b} share their first kiss by the pool." },
  ],
};

export const PULL_MORE = {
  moves: {
    answer: [
      { when: { bTaken: false }, turns: [
        ['a', "What's the most important thing to you, in someone?"],
        ['b', "Kindness, honestly. Not the big gestures. The little things. Remembering how I take my tea. Noticing when I'm quiet. That's what gets me."],
        ['a', "How do you take your tea?"],
        ['b', "You'll have to find out, won't you?"],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "What went wrong last time? With your last relationship?"],
        ['b', "We wanted different things. I wanted to settle down, and they wanted to keep their options open, and neither of us said it until it was too late. I don't want to make that mistake again."],
        ['a', "So you'd say it now?"],
        ['b', "I'd say it on the first date."],
      ] },
      { when: { bTaken: true, end: 'turned-down' }, turns: [
        ['a', "Do you see a future with {pb}? Like, on the outside?"],
        ['b', "I do, actually. I didn't at first. But we've talked about it, properly, and I can see it. I can see us going on holiday, meeting each other's friends. All of it."],
        ['a', "That's... a really good answer."],
      ] },
      { when: { bTaken: true, end: LANDS_OK }, turns: [
        ['a', "What's {pb} like when nobody's watching?"],
        ['b', "Nice. Lovely. A bit quiet. I don't know. Sometimes I feel like I'm the one carrying the conversation, and I'm not sure if that's how it should be."],
        ['a', "It isn't."],
      ] },
      { when: { taken: true }, turns: [
        ['b', "Be honest with me. Are you over here because you like me, or because you're bored with {pa}?"],
        ['a', "Because I like you. And maybe a little bit because I don't know what I'm doing with {pa}. But mostly because I like you."],
        ['b', "At least you're honest."],
      ] },
      { turns: [
        ['a', "Who's been the biggest surprise in here, for you?"],
        ['b', "Honestly? The quiet ones. Everyone writes them off, and then they come out with the funniest thing you've ever heard at dinner. Never judge a quiet one."],
        ['a', "Noted. I'll stop judging."],
      ] },
    ],
    close: [
      { when: { end: 'flirt' }, turns: [['b', "I'm going to go before I say something I'll regret."], ['a', "Like what?"], ['b', "Like yes to another chat."]] },
      { when: { end: 'flirt' }, turns: [], beat: "{b} walks away, then turns round and smiles at {a} over {b.posAdj} shoulder." },
      { when: { end: 'flirt' }, turns: [['a', "Thanks for the chat."], ['b', "Thanks for asking."]], beat: "They both look a little pleased with themselves." },
      { when: { end: 'flirt' }, turns: [['b', "Same time tomorrow?"], ['a', "Is that a date?"], ['b', "It's a chat. Don't get excited."]] },
      { when: { end: 'flirt' }, turns: [], beat: "Back on the daybeds, everyone wants to know what was said. Neither of them is telling." },
      { when: { end: 'flirt', bTaken: true }, turns: [], beat: "{b} goes back to sit with {pb}, and doesn't look at {a} for the rest of the afternoon. Not once. On purpose." },
      { when: { end: 'flirt', taken: true }, turns: [], beat: "{a} goes back to {pa} as if nothing happened. {pa} asks what that was about. {a} says nothing much." },
      { when: { end: 'flirt' }, turns: [['a', "We should do this again."], ['b', "We should. Just don't make it obvious."]] },
      { when: { end: 'kissed' }, turns: [['a', "So, are we going to talk about that?"], ['b', "Not right now. Right now we're going to walk back like normal people."]] },
      { when: { end: 'kissed' }, turns: [], beat: "They go back to the others pretending nothing happened. Neither of them is very good at pretending." },
      { when: { end: 'kissed' }, turns: [['b', "Nobody saw. I'm sure nobody saw."], ['a', "Someone always sees."]] },
      { when: { end: 'kissed', bTaken: true }, turns: [], beat: "{b} wipes {b.posAdj} mouth on the way back to {pb}, and sits down a little too quickly." },
      { when: { end: 'promised' }, turns: [['b', "One drink. You promised."], ['a', "One drink. On the outside."]], beat: "They walk back separately." },
      { when: { end: 'promised', taken: true }, turns: [], beat: "{a} sits back down next to {pa}, and thinks about the outside the whole evening." },
      { when: { end: 'turned-down' }, turns: [['a', "Right. Well. Thanks for being honest."], ['b', "I'm sorry."], ['a', "Don't be. Honestly."]] },
      { when: { end: 'turned-down' }, turns: [], beat: "{a} walks back to the daybeds with {a.posAdj} head held high. It lasts until {a} sits down." },
      { when: { end: 'turned-down' }, turns: [['b', "I hope we can still be friends."], ['a', "We can. Of course we can."]] },
      { when: { end: 'turned-down' }, turns: [], beat: "Somebody asks {a} how it went. {a} just shrugs." },
    ],
  },
  notes: [
    { when: { end: 'flirt' }, stage: "{a} pulls {b} for a chat on the swing seat. It runs long." },
    { when: { end: 'flirt' }, stage: "{a} and {b} have a flirty little chat on the terrace." },
    { when: { end: 'flirt', bTaken: true }, stage: "{a} grabs {b} for a quick chat while {pb} is in the shower." },
    { when: { end: 'turned-down' }, stage: "{a} asks {b} for a chat, and gets a polite no." },
  ],
};

export const LOYALTY_MORE = {
  moves: {
    open: [
      { stage: "{b} sits down next to {a} at the kitchen island.", turns: [
        ['b', "You look nice today."],
        ['a', "Thanks. What do you want?"],
        ['b', "Why do I have to want something?"],
        ['a', "Because you've got that face on."],
      ] },
      { stage: "{b} catches {a} coming out of the dressing room.", turns: [
        ['b', "Have you got a minute? Just us?"],
        ['a', "I've got a minute. Here, though."],
      ] },
      { stage: "{b} finds {a} on {a.posAdj} own by the pool.", turns: [
        ['b', "You're never on your own. I'm taking my chance."],
        ['a', "Your chance for what?"],
        ['b', "A chat. Just a chat."],
      ] },
      { stage: "{b} offers {a} a drink on the terrace.", turns: [
        ['b', "Made you one."],
        ['a', "That's kind. What's the catch?"],
        ['b', "No catch. Sit with me for five minutes."],
        ['a', "Five minutes, here, where everyone can see."],
      ] },
      { when: { phase: 'morning' }, stage: "{b} sits down next to {a} at breakfast.", turns: [
        ['b', "Morning. Sleep well?"],
        ['a', "Fine, thanks. You?"],
        ['b', "Not really. I was thinking about you."],
        ['a', "Right. Okay. It's very early for this."],
      ] },
      { stage: "{b} waits for {a} by the bottom of the stairs.", turns: [
        ['b', "Can I steal you?"],
        ['a', "Steal me where?"],
        ['b', "Anywhere. Somewhere quiet."],
        ['a', "Nowhere's quiet. We can talk here."],
      ] },
    ],
    refuse: [
      { turns: [
        ['a', "Can I stop you there? Before you say anything you can't take back. I know where this is going, and I'm not going there with you. I'm with {pa}, and I'm happy. I'd rather be clear now than let you think there's a chance."],
        ['b', "Right. Okay."],
      ] },
      { when: { reg: 'soft' }, turns: [
        ['a', "I really appreciate you being so honest with me. That takes guts in here. But I'm with {pa}, and I'm not looking anywhere else. I hope you understand. I'd hate for this to make things weird between us."],
        ['b', "It won't. I get it."],
      ] },
      { when: { reg: 'sharp' }, turns: [
        ['a', "Let me save us both some time. No. I'm with {pa}. That's not going to change because you've brought me a drink."],
        ['b', "Harsh."],
        ['a', "Honest."],
      ] },
      { when: { reg: 'dry' }, turns: [
        ['a', "I'm very flattered. Genuinely. I'm going to remember this the next time I'm feeling bad about myself. But I'm with {pa}, and I'm quite attached to {pa}, oddly."],
        ['b', "Oddly?"],
        ['a', "Don't tell {pa} I said oddly."],
      ] },
      { when: { known: true }, turns: [
        ['a', "Look, me and {pa} have been through a lot to get to where we are. I'm not going to throw that away. Not for anyone. I'm sorry."],
      ] },
      { when: { myRung: ['exclusive', 'official'] }, turns: [
        ['a', "We're exclusive. You know that. Everyone knows that. So I'm going to pretend this conversation didn't happen, and I suggest you do the same."],
      ] },
      { turns: [
        ['a', "Honestly, I'm happy where I am. Happier than I've been in a long time. So thank you, but no."],
        ['b', "Fair enough."],
      ] },
      { when: { reg: 'big' }, turns: [
        ['a', "Absolutely not! Not in a million years! I'm with {pa}! I love {pa}! Well, I really like {pa}! The point is, no!"],
        ['b', "Okay, okay. Message received."],
      ] },
    ],
  },
  notes: [
    { stage: "{b} tries to get {a} on {a.posAdj} own. {a} stays where everyone can see." },
    { stage: "{a} shuts down {b}'s flirting in front of the whole villa." },
    { stage: "{b} pulls {a} for a chat. {a} keeps it short, and goes back to {pa}." },
    { stage: "{a} makes it clear to {b} that {a.posAdj} head is with {pa}." },
    { stage: "{b} tries {b.posAdj} luck with {a}, and {a} turns {b.obj} down politely." },
    { stage: "{a} tells {b} straight away there's no point trying." },
  ],
};

export const ICK_MORE = { notes: [
  { when: { end: 'said' }, stage: "{a} admits to {b} that {b} has given {a.obj} the ick. It doesn't go down well." },
  { when: { end: 'said' }, stage: "{a} tells {b} about the ick, and {b} doesn't speak to {a.obj} for an hour." },
  { when: { end: 'kept' }, stage: "{b} does something that gives {a} the ick. {a} says nothing, and stops smiling." },
  { when: { end: 'kept' }, stage: "{a} gets the ick from {b} over lunch, and keeps very quiet about it." },
  { when: { end: 'kept' }, stage: "{a} watches {b} and quietly goes off {b.obj} a bit." },
] };

export const ARGUMENT_MORE = { notes: [
  { when: { end: 'make-up' }, stage: "{a} and {b} have a row by the pool, then make up before dinner." },
  { when: { end: 'make-up' }, stage: "{a} and {b} snap at each other, then laugh about it." },
  { when: { end: 'walk-off' }, stage: "{a} and {b} have words, and {a} storms off." },
  { when: { end: 'walk-off' }, stage: "A row between {a} and {b} ends with a door slamming." },
  { when: { end: 'simmer' }, stage: "{a} and {b} fall out, and it isn't sorted by bedtime." },
  { when: { end: 'simmer' }, stage: "{a} and {b} have a row that the whole villa pretends not to hear." },
  { stage: "{a} and {b} argue in the kitchen, and everyone else finds a reason to leave." },
] };

export const ADVICE_MORE = { notes: [
  { when: { verdict: 'good' }, stage: "{b} asks {a} what {a} thinks of {c}. {a} thinks they're great together." },
  { when: { verdict: 'good' }, stage: "{a} tells {b} to stop overthinking it with {c}." },
  { when: { verdict: 'bad' }, stage: "{a} warns {b} about {c}." },
  { when: { verdict: 'bad' }, stage: "{a} tells {b} {b} deserves better than {c}." },
  { when: { verdict: 'unsure' }, stage: "{a} tells {b} to give it more time with {c}." },
  { when: { verdict: 'unsure' }, stage: "{a} isn't sure about {c}, and says so, gently." },
] };

export const COMFORT_MORE = { notes: [
  { stage: "{a} finds {b} crying and stays until {b} is okay." },
  { stage: "{a} sits on the bathroom floor with {b} until the tears stop." },
  { stage: "{a} brings {b} a tea and a hug." },
  { stage: "{a} makes {b} laugh through the tears." },
  { when: { of: 'partner' }, stage: "{a} holds {b} on the daybed until {b} feels better." },
] };

export const REASSURANCE_MORE = { notes: [
  { when: { sincere: true }, stage: "{b} tells {a} there's nobody else, and means it." },
  { when: { sincere: true }, stage: "{b} spends the evening making sure {a} knows where {b} stands." },
  { when: { sincere: true }, stage: "{a} admits to feeling insecure. {b} tells {a} {a} has nothing to worry about." },
  { when: { sincere: false }, stage: "{b} tells {a} it's all fine, a little too quickly." },
  { when: { sincere: false }, stage: "{a} asks if they're okay. {b} says yes, without looking up." },
] };

export const CONFESSION_MORE = { notes: [
  { stage: "{a} owns up to {b}." },
  { stage: "{a} finally tells {b} the truth, and it doesn't go well." },
  { when: { hasWith: true }, stage: "{a} confesses to {b} about {x}." },
  { stage: "{a} comes clean to {b} before anyone else can tell {b.obj}." },
] };

export const CONFRONT_MORE = { notes: [
  { stage: "{a} has it out with {b} about {c}." },
  { stage: "{a} asks {b} straight out what's going on with {c}." },
  { stage: "{a} tells {b} {a} isn't happy about {c}." },
  { stage: "{a} confronts {b} on the terrace about {c}." },
] };

export const DEBRIEF_MORE = {
  moves: {
    friend: [
      { when: { of: 'robbed' }, turns: [
        ['b', "You deserved so much better than that. Honestly. Anyone who can stand up and do that in front of everyone isn't someone you'd want anyway. I know it doesn't feel like that tonight. It will."],
        ['a', "I hope you're right."],
      ] },
      { when: { of: 'stole' }, turns: [
        ['b', "I'm not going to judge you. Everyone in this villa would do the same if they felt it. Just be ready for tomorrow, because it's going to be awkward."],
        ['a', "I know. I'm ready."],
      ] },
      { when: { of: 'miss' }, turns: [
        ['b', "I'm going to miss {c.obj} too. It already feels different up here. But you've still got me, okay? I'm not going anywhere."],
        ['a', "You'd better not."],
      ] },
      { when: { of: 'next' }, turns: [
        ['b', "Stop it. You're not next. And if you were, you'd go home with your head held high, and everyone would miss you. So stop counting."],
        ['a', "I'll try."],
      ] },
      { when: { of: 'picked' }, turns: [
        ['b', "Look at your face. You're glowing. I'm so happy for you, honestly. Don't let anyone take that away from you."],
        ['a', "I won't."],
      ] },
      { when: { of: 'meh', taken: true }, turns: [
        ['b', "You don't have to be in love tonight. You just have to be honest with yourself. Give {pa} a {~proper} chance tomorrow, and see how you feel."],
        ['a', "A {~proper} chance. Okay."],
      ] },
      { when: { of: ['bomb-fancy', 'eyeing', 'bomb-threat'] }, turns: [
        ['b', "Every time someone new walks in, the whole villa goes mad for about two days. Give it two days. Then see how everyone feels."],
        ['a', "Two days. I can do two days."],
      ] },
    ],
  },
  notes: [
    { stage: "{Where}, {a} talks to {b} about everything that just happened." },
    { stage: "{Where}, {b} listens while {a} gets it all off {a.posAdj} chest." },
    { stage: "{Where}, {a} and {b} go over the night, again and again." },
    { stage: "{Where}, {a} can't stop talking about tonight, and {b} lets {a.obj}." },
    { stage: "{Where}, {b} gives {a} a hug and a pep talk." },
  ],
};

export const RECOUPLE_MORE = {
  moves: {
    react: [
      { when: { stoleFrom: false }, turns: [['b', "Thank you. That was really lovely."]], beat: "{b} sits down next to {a}, beaming." },
      { when: { stoleFrom: false }, turns: [], beat: "{b} jumps up, and the two of them have a long hug in front of the whole fire pit." },
      { when: { stoleFrom: false }, turns: [['b', "Come here, you."]], beat: "The fire pit cheers as they sit down together." },
      { when: { stoleFrom: false }, turns: [], beat: "{b} wipes {b.posAdj} eyes and walks over to {a}." },
      { when: { stoleFrom: false, reason: 'loyalty' }, turns: [['b', "Never doubted it."]], beat: "They sit down, hands already joined." },
      { when: { stoleFrom: false, reason: 'attraction' }, turns: [], beat: "{b} can't stop smiling all the way over to the bench." },
      { when: { stoleFrom: true, reclaim: false }, turns: [], beat: "{c} claps along with everyone else, but it's slow, and it's not real." },
      { when: { stoleFrom: true, reclaim: false }, turns: [['c', "Unbelievable."]], beat: "{b} walks past {c} without looking." },
    ],
  },
};

export const BED_MORE = {
  moves: {
    talk: [
      { turns: [
        ['b', "Can I ask you something? Do you miss {pa}?"],
        ['a', "Yeah. I do. But it's weird. Over here, I feel like a different person. Like I'm allowed to be someone else for a few days."],
        ['b', "Who do you want to be?"],
        ['a', "I don't know yet."],
      ] },
      { turns: [
        ['a', "You've got really cold feet, you know."],
        ['b', "Sorry. Do you want me to move them?"],
        ['a', "No. It's fine. It's actually fine."],
      ] },
      { turns: [
        ['b', "Talk to me. I can't sleep."],
        ['a', "What do you want to talk about?"],
        ['b', "Anything. You. What you're like on the outside."],
        ['a', "Boring, mostly. Nicer in here."],
      ] },
      { turns: [
        ['a', "I shouldn't be enjoying this as much as I am."],
        ['b', "Enjoying what?"],
        ['a', "Talking to you. Lying here. All of it."],
      ] },
    ],
    end: [
      { when: { of: 'bed' }, turns: [['b', "Goodnight, then."], ['a', "Goodnight."]], beat: "Neither of them falls asleep for a long time." },
      { when: { of: 'bed' }, turns: [], beat: "They fall asleep back to back, which is somehow worse." },
      { when: { of: 'bed' }, turns: [], beat: "In the morning, {a} wakes up with {b}'s arm across {a.obj}, and doesn't move it." },
      { when: { of: 'kiss' }, turns: [['a', "We can't tell anyone about this."], ['b', "Tell anyone about what?"]], beat: "They kiss again." },
      { when: { of: 'kiss' }, turns: [], beat: "It starts with a whisper and ends with a kiss, and neither of them knows who started it." },
    ],
  },
};

export const GOODBYE_MORE = {
  moves: {
    hug: [
      { when: { withB: true }, turns: [], beat: "{b} runs over and throws {b.posAdj} arms round {a}." },
      { when: { withB: true }, turns: [], beat: "{b} holds on to {a} like {b} doesn't want to let go." },
      { when: { withB: true }, turns: [], beat: "{b} comes over, tears already rolling." },
      { when: { withB: true }, turns: [], beat: "{a} and {b} hug, rocking from side to side." },
      { when: { withB: true }, turns: [], beat: "{b} squeezes {a} so tight {a} laughs." },
    ],
    words: [
      { when: { withB: true }, turns: [
        ['b', "This isn't goodbye. This is see you in a few weeks."],
        ['a', "A few weeks? You'd better make it to the final, then."],
        ['b', "For you, I'll try."],
      ] },
      { when: { withB: true }, turns: [
        ['a', "Thank you for everything. For looking after me. For listening to me moan."],
        ['b', "You never moaned."],
        ['a', "I moaned all the time."],
        ['b', "Okay, you moaned a bit. I'll miss it."],
      ] },
    ],
  },
};

export const DECL_MORE = {
  moves: {
    stand: [
      { stage: "{a} stands up and wipes {a.posAdj} hands on {a.posAdj} legs.", turns: [['a', "I'm so nervous. Okay."]] },
      { stage: "{a} gets to {a.posAdj} feet and looks at {b} for a long moment.", turns: [] },
      { stage: "{a} stands, takes {b}'s hand, and pulls {b.obj} up too.", turns: [] },
      { stage: "{a} stands up, laughs at {a.posAdj} own nerves, and starts.", turns: [] },
      { stage: "{a} clears {a.posAdj} throat. The whole fire pit leans in.", turns: [] },
      { stage: "{a} stands at the front of the fire pit, facing {b}.", turns: [] },
    ],
    feel: [
      { turns: [
        ['a', "You've seen me at my worst in here. Crying, sulking, being an idiot at three in the morning. And you never once made me feel like I was too much. I don't think you know what that's done for me."],
      ] },
      { turns: [
        ['a', "Every day with you has felt like the best day. Even the bad ones. Even the ones where we didn't speak until lunch. Because at the end of every single one, it was still you and me."],
      ] },
      { turns: [
        ['a', "I don't need a trophy to know I've won. I won the day you walked over and started talking to me."],
      ] },
      { when: { reg: 'nervy' }, turns: [
        ['a', "I'm terrible at saying things. You know I am. I get all tangled up. But I'm going to get this bit right. I love you. That's the bit. That's the important bit."],
      ] },
    ],
    land: [
      { turns: [['b', "Come here."]], beat: "{b} kisses {a}, and the fire pit erupts." },
      { turns: [], beat: "{b} is shaking {b.posAdj} head, smiling, trying not to cry and failing." },
      { turns: [], beat: "When {a} finally sits down, {b} doesn't let go of {a.posAdj} hand." },
      { turns: [], beat: "The other couples clap, and someone along the bench is sobbing." },
      { turns: [['b', "How am I supposed to follow that?"]], beat: "Everyone laughs, and {b} wipes {b.posAdj} eyes." },
    ],
  },
};

export const DATE_MORE = {
  moves: {
    why: [
      { turns: [
        ['a', "When I found out I was coming in, I watched a bit of the villa, and every time you were on screen I'd stop and pay attention. I wanted to know if you were the same in real life."],
        ['b', "And am I?"],
        ['a', "Better, actually. Much better."],
      ] },
      { turns: [
        ['a', "I'll be honest, I nearly picked someone else. And then I thought, no. If I'm going to do this, I'm going to take out the person I actually want to get to know."],
        ['b', "Well, I'm glad you didn't pick someone else."],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "You're coupled up, and I'm not here to wreck anyone's life. But I think it'd be stupid of me not to at least find out if there's something here."],
        ['b', "That's fair, I suppose."],
      ] },
    ],
    close: [
      { turns: [], beat: "On the way back, they keep catching each other's eye and looking away." },
      { turns: [['b', "Thanks for today. I mean it."], ['a', "Thanks for coming."]] },
      { turns: [], beat: "They're quiet in the car. It's a comfortable quiet, mostly." },
    ],
  },
};
