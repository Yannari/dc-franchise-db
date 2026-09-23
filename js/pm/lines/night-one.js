// pm/lines/night-one.js — the first night's conversations and the bombshell's
// entrance (user: "the arrivals meeting be a little longer … this is where
// first impressions are made"; "the debrief is really important"; "a bombshell
// arriving is a whole scene with a narrator, suspense and animation").
// Data only. Casts:
//   arrival-chat    [a, b, (c)]  a has just walked in; b (and c) were already here.
//                   `of`: nerves · looking · compliment · type · same-type · clash
//   first-toast     [a, b, c]    one side is all in; a raises the glass.
//   debrief         [a, b, (c)]  a tells friend b about the partner they just got
//                   ({pa}). `of`: happy · unsure · rather ({c} is who a would
//                   rather have) · rather-yours ({pb}: b's own partner).
//   bombshell-text  [a, (b)]     a reads the text out; the first line IS the text.
//   bombshell-guess [a, (b)]     who is it? coupled a worries to partner b;
//                   single a hopes.
//   entrance        [a]          `of: 'bombshell'` — the walk down the steps.
//   bombshell-react [a, b, (c)]  `of`: stunned (a can't look away from bombshell
//                   b; c is a's partner, watching) · worried (a watches partner
//                   b stare at bombshell c) · unbothered (a shrugs at b).
export const NIGHT_ONE = {
  'arrival-chat': [
    // nerves
    { id: 'ac.n.01', when: { of: 'nerves' }, turns: [['b', "Are you as nervous as I am?"], ['a', "More. My hands are shaking."], ['b', "Mine too. Look."], ['a', "Okay, that actually makes me feel better."]] },
    { id: 'ac.n.02', when: { of: 'nerves' }, turns: [['a', "I nearly didn't get out of the car."], ['b', "Honestly, same. The steps felt like a mile."], ['a', "And now we're here."], ['b', "Now we're here."]], beat: 'They clink glasses.' },
    { id: 'ac.n.03', when: { of: 'nerves' }, turns: [['b', "How are you feeling?"], ['a', "Like I'm going to be sick, but in a good way."], ['b', "That's exactly it. That's exactly the feeling."]] },
    { id: 'ac.n.04', when: { of: 'nerves' }, turns: [['a', "Is it bad that I've forgotten everything I planned to say?"], ['b', "I planned a whole speech. It's gone."], ['a', "Good. We can just talk, then."]] },
    { id: 'ac.n.05', when: { of: 'nerves' }, stage: '{a} sits down next to {b} and lets out a very long breath.', turns: [['b', "First one's always the hardest."], ['a', "First what?"], ['b', "I don't know. First anything."]], beat: 'They both laugh, and it helps.' },
    { id: 'ac.n.06', when: { of: 'nerves', cast: 3 }, turns: [['a', "Please tell me you two are nervous as well."], ['b', "Terrified."], ['c', "I've been to the bathroom three times already."], ['a', "Oh, thank God."]] },
    // what they're looking for
    { id: 'ac.l.01', when: { of: 'looking' }, turns: [['b', "So what are you actually here for?"], ['a', "Honestly? I want to meet someone I'd still like in a year."], ['b', "That's a good answer."], ['a', "What's yours?"], ['b', "Same. Mostly. With a bit of fun on the way."]] },
    { id: 'ac.l.02', when: { of: 'looking', intent: ['fun', 'fame'] }, turns: [['b', "Are you here for love?"], ['a', "I'm here for a good time. If love turns up, it can join in."], ['b', "I respect that."]] },
    { id: 'ac.l.03', when: { of: 'looking', intent: 'love' }, turns: [['a', "I'm going to be really honest. I want to leave here in love."], ['b', "Wow. Straight in."], ['a', "No point pretending."], ['b', "No. You're right. Me too, I think."]] },
    { id: 'ac.l.04', when: { of: 'looking' }, turns: [['b', "Have you been single long?"], ['a', "Long enough to know what I don't want."], ['b', "That's half the battle."], ['a', "Now I just need the other half."]] },
    { id: 'ac.l.05', when: { of: 'looking' }, turns: [['a', "What's the one thing you need in someone?"], ['b', "Kindness. Everything else I can work with."], ['a', "That's a really good answer."]] },
    { id: 'ac.l.06', when: { of: 'looking', cast: 3 }, turns: [['c', "Right, go round. What's everyone here for?"], ['b', "Love. Obviously."], ['a', "A summer I'll never forget."], ['c', "Both. I want both."]], beat: 'Everyone agrees that both is the answer.' },
    // compliments
    { id: 'ac.c.01', when: { of: 'compliment' }, turns: [['b', "Your outfit is unreal."], ['a', "Stop. I changed my outfit so many times."], ['b', "It was worth it."]] },
    { id: 'ac.c.02', when: { of: 'compliment' }, turns: [['a', "You were the first person I saw, and I thought, you're going to be nice."], ['b', "And?"], ['a', "And I was right."]] },
    { id: 'ac.c.03', when: { of: 'compliment' }, turns: [['b', "Your laugh. I heard it from the top of the steps."], ['a', "Is that a good thing?"], ['b', "It's a great thing. It made me less nervous."]] },
    { id: 'ac.c.04', when: { of: 'compliment' }, turns: [['a', "You look so calm."], ['b', "I'm not calm at all. I'm just good at hiding it."], ['a', "Teach me."]] },
    { id: 'ac.c.05', when: { of: 'compliment', cast: 3 }, turns: [['c', "Is it just me, or is everyone in here gorgeous?"], ['b', "It's not just you."], ['a', "The competition is going to be ridiculous."]], beat: 'They all laugh, a bit nervously.' },
    // type
    { id: 'ac.t.01', when: { of: 'type' }, turns: [['b', "What's your type, then?"], ['a', "I always say I don't have one, and then I go for the same person every time."], ['b', "That's everyone."]] },
    { id: 'ac.t.02', when: { of: 'type' }, turns: [['a', "Do you go for looks or personality?"], ['b', "Personality. And looks. Mostly looks, at first."], ['a', "Thank you for being honest."]] },
    { id: 'ac.t.03', when: { of: 'type' }, turns: [['b', "Tell me your type so I know who not to go for."], ['a', "Tall. Funny. Bit of a mess."], ['b', "Great. Mine's short and sensible. We're fine."]] },
    { id: 'ac.t.04', when: { of: 'type' }, turns: [['a', "I'm hoping someone walks in and I just know."], ['b', "Does that ever actually happen?"], ['a', "It happened to me once. It didn't work out, but I'm still hoping."]] },
    { id: 'ac.t.05', when: { of: 'type', cast: 3 }, turns: [['b', "Okay, what's everyone's type?"], ['c', "Someone who makes me laugh."], ['a', "Someone who'll bring me a coffee in the morning."], ['b', "That's so specific."], ['a', "It's very important."]] },
    // the same type: they clock it
    { id: 'ac.s.01', when: { of: 'same-type' }, turns: [['b', "Wait. That's my type too."], ['a', "No."], ['b', "Yes."], ['a', "Well. May the best one win, I suppose."]], beat: 'They both laugh, and both of them mean it a little.' },
    { id: 'ac.s.02', when: { of: 'same-type' }, turns: [['a', "So what's your type?"], ['b', "You first."], ['a', "…Okay, we've just described the same person."], ['b', "This could be a problem."]] },
    { id: 'ac.s.03', when: { of: 'same-type' }, turns: [['b', "I hope we don't end up going for the same one."], ['a', "We won't."], ['b', "We definitely will."]], beat: '{a} laughs, and then goes quiet for a second.' },
    { id: 'ac.s.04', when: { of: 'same-type' }, turns: [['a', "I've got a feeling we're going to want the same person."], ['b', "Then we talk about it. No drama."], ['a', "No drama. Deal."]], beat: 'They shake on it. It is not clear either of them believes it.' },
    { id: 'ac.s.05', when: { of: 'same-type', cast: 3 }, turns: [['c', "Hang on. You two have literally the same type."], ['a', "We do not."], ['b', "We sort of do."], ['c', "This is going to be fun to watch."]] },
    // two short fuses
    { id: 'ac.x.01', when: { of: 'clash' }, turns: [['a', "Is that your bag on that sunbed?"], ['b', "I was here first."], ['a', "It's a sunbed, not a flag."]], beat: 'Nobody says much for a minute after that.' },
    { id: 'ac.x.02', when: { of: 'clash' }, turns: [['b', "You're very loud, aren't you?"], ['a', "I'm excited."], ['b', "You're loud."], ['a', "And you've known me for two minutes."]] },
    { id: 'ac.x.03', when: { of: 'clash' }, turns: [['a', "I don't think we're going to be best friends."], ['b', "You don't know that."], ['a', "I've got a feeling."], ['b', "So have I, to be fair."]] },
    { id: 'ac.x.04', when: { of: 'clash' }, turns: [['b', "Are you always this full-on?"], ['a', "Are you always this quiet?"], ['b', "Only around people I'm not sure about."]], beat: 'It is a slightly frosty first five minutes.' },
    { id: 'ac.x.05', when: { of: 'clash', cast: 3 }, turns: [['a', "Sorry, were you talking?"], ['b', "I was, yes."], ['c', "Okay. Let's all just have a drink."]], beat: 'Everyone has a drink.' },
  ],
  'first-toast': [
    { id: 'ft.01', turns: [['a', "Right, everyone, glasses up."], ['b', "To the summer of our lives!"], ['c', "To the summer!"]], beat: 'Everyone clinks glasses, a bit too hard.' },
    { id: 'ft.02', turns: [['a', "Can I just say, I'm so glad it's you lot."], ['b', "We haven't done anything yet."], ['a', "I know. I just have a good feeling."], ['c', "Cheers to that."]] },
    { id: 'ft.03', turns: [['c', "Toast! Somebody do a toast."], ['a', "To whoever walks in next, and to us, whatever happens."], ['b', "Whatever happens!"]] },
    { id: 'ft.04', turns: [['a', "Let's promise we won't fall out over anyone."], ['b', "Promise."], ['c', "…Mostly promise."]], beat: 'Everybody laughs, because everybody knows.' },
    { id: 'ft.05', turns: [['b', "Glasses up. To being brave."], ['a', "To being brave."], ['c', "And to looking this good while doing it."]] },
    { id: 'ft.06', turns: [['a', "One toast, and then I'm going to have a little cry."], ['b', "Already?"], ['a', "It's a happy cry."], ['c', "To happy cries!"]] },
  ],
  debrief: [
    // happy
    { id: 'db.h.01', when: { of: 'happy', taken: true, gender: 'f' }, stage: 'In the dressing room, {b} is waiting with a grin.', turns: [['b', "Well?"], ['a', "I'm so happy with {pa}. I can't stop smiling."], ['b', "We can all see that."]] },
    { id: 'db.h.02', when: { of: 'happy', taken: true, gender: 'm' }, stage: 'Up on the terrace, away from the others.', turns: [['b', "Go on, then. {pa}?"], ['a', "Honestly? I got exactly who I wanted."], ['b', "Nice one. You looked so happy."]] },
    { id: 'db.h.03', when: { of: 'happy', taken: true }, turns: [['b', "How are you feeling about {pa}?"], ['a', "Really good. We've got loads to talk about already."], ['b', "That's the main thing."]] },
    { id: 'db.h.04', when: { of: 'happy', taken: true }, turns: [['a', "Can I say something? I think I've landed on my feet."], ['b', "With {pa}?"], ['a', "With {pa}."], ['b', "I'm so pleased for you."]] },
    { id: 'db.h.05', when: { of: 'happy', taken: true }, turns: [['b', "Scale of one to ten. {pa}."], ['a', "Nine. I'm keeping one back in case."], ['b', "In case of what?"], ['a', "In case it goes up."]] },
    { id: 'db.h.06', when: { of: 'happy', taken: true }, turns: [['a', "I didn't think I'd feel anything on the first night."], ['b', "And?"], ['a', "And I feel something. With {pa}."]], beat: '{b} squeezes {a.posAdj} arm.' },
    { id: 'db.h.07', when: { of: 'happy', taken: true, gender: 'f' }, stage: 'The dressing room. Everyone is taking their make-up off and talking at once.', turns: [['b', "Tell me everything."], ['a', "{pa} is lovely. Really lovely. I'm not jinxing it."]] },
    { id: 'db.h.08', when: { of: 'happy', taken: true, gender: 'm' }, stage: 'The terrace, late, the whole villa lit up below.', turns: [['a', "I'm so happy, to be honest."], ['b', "With {pa}?"], ['a', "Yeah. It's early, but yeah."]] },
    // not sure
    { id: 'db.u.01', when: { of: 'unsure', taken: true }, turns: [['b', "How do you feel about {pa}?"], ['a', "{pa} is really nice. I'm just not sure there's a spark yet."], ['b', "It's the first night. Give it a few days."]] },
    { id: 'db.u.02', when: { of: 'unsure', taken: true }, turns: [['a', "Can I be honest? I'm not feeling it with {pa}."], ['b', "Already?"], ['a', "Nothing's wrong. It's just not there."], ['b', "Then keep your options open."]] },
    { id: 'db.u.03', when: { of: 'unsure', taken: true, gender: 'f' }, stage: 'In the dressing room, {a} is quieter than the others.', turns: [['b', "You've gone quiet."], ['a', "I'm fine. {pa} is fine. It's all fine."], ['b', "That's a lot of fines."]] },
    { id: 'db.u.04', when: { of: 'unsure', taken: true, gender: 'm' }, stage: 'On the terrace, {a} is staring at the pool.', turns: [['b', "You alright?"], ['a', "Yeah. {pa}'s great. I just didn't feel much, if I'm honest."], ['b', "It's day one. Nobody feels much yet."]] },
    { id: 'db.u.05', when: { of: 'unsure', taken: true }, turns: [['b', "Are you happy with how it went?"], ['a', "Happy enough. It's not a no. It's a maybe."], ['b', "Maybes can turn into yeses."]] },
    { id: 'db.u.06', when: { of: 'unsure', taken: true }, turns: [['a', "I think {pa} is more into me than I am into {pa}."], ['b', "That's a tricky one."], ['a', "I don't want to hurt anyone on the first night."]], beat: '{b} does not have an answer for that.' },
    { id: 'db.u.07', when: { of: 'unsure', taken: true }, turns: [['b', "Scale of one to ten?"], ['a', "Six. Maybe a six."], ['b', "Six is a start."], ['a', "Six is a start."]] },
    // rather: somebody else
    { id: 'db.r.01', when: { of: 'rather', taken: true, cast: 3 }, turns: [['a', "Can I tell you something and you won't say anything?"], ['b', "Of course."], ['a', "I'd have gone for {c}."], ['b', "{c}? Already?"], ['a', "I know. I can't help it."]] },
    { id: 'db.r.02', when: { of: 'rather', taken: true, cast: 3 }, turns: [['b', "Be honest. Is {pa} who you wanted?"], ['a', "…No. I wanted {c}."], ['b', "Oh, this is going to be interesting."]] },
    { id: 'db.r.03', when: { of: 'rather', taken: true, cast: 3 }, turns: [['a', "{pa} is lovely. But when {c} walked in, I forgot how to breathe."], ['b', "You need to be careful with that."], ['a', "I know. I'm going to be."]], beat: '{b} does not look convinced.' },
    { id: 'db.r.04', when: { of: 'rather', taken: true, cast: 3 }, turns: [['b', "Who's caught your eye, then? Apart from {pa}."], ['a', "{c}. Obviously {c}."], ['b', "Obviously."]] },
    { id: 'db.r.05', when: { of: 'rather', taken: true, cast: 3 }, turns: [['a', "I'm going to have a chat with {c} tomorrow."], ['b', "You've been coupled up for an hour."], ['a', "A chat. Just a chat."], ['b', "It's never just a chat."]] },
    { id: 'db.r.06', when: { of: 'rather', taken: true, cast: 3 }, turns: [['b', "You keep looking over there."], ['a', "Do I?"], ['b', "At {c}. Every two minutes."], ['a', "…Is it that obvious?"]] },
    // rather-yours: said to that partner's face
    { id: 'db.y.01', when: { of: 'rather-yours', bTaken: true }, turns: [['a', "Don't take this the wrong way, but {pb} is exactly my type."], ['b', "{pb} is MY partner."], ['a', "I know. I'm just saying."], ['b', "Well, don't."]], beat: 'The whole room goes quiet.' },
    { id: 'db.y.02', when: { of: 'rather-yours', bTaken: true }, turns: [['b', "Who would you have picked, if you could?"], ['a', "Honestly? {pb}."], ['b', "Wow. Okay. Thanks for telling me, I suppose."]], beat: '{b} goes to find {pb}, and does not come back to the conversation.' },
    { id: 'db.y.03', when: { of: 'rather-yours', bTaken: true }, turns: [['a', "Can I be honest? I really liked {pb} when {pb} walked in."], ['b', "{pb} chose me."], ['a', "I know. It's just the first night."], ['b', "Exactly. It's just the first night."]] },
    { id: 'db.y.04', when: { of: 'rather-yours', bTaken: true }, turns: [['b', "You've been staring at {pb} since the fire pit."], ['a', "I haven't."], ['b', "You have. And I'm right here."]], beat: 'It is the first frosty moment of the series.' },
    { id: 'db.y.05', when: { of: 'rather-yours', bTaken: true }, turns: [['a', "I don't want to make things weird, but I think {pb} is gorgeous."], ['b', "Things are weird now."], ['a', "Sorry."]], beat: '{b} does not say another word to {a} tonight.' },
  ],
  'bombshell-text': [
    { id: 'bt.01', turns: [['a', "Islanders, get ready. Someone new is on their way to the villa. #HeadsWillTurn"], ['b', "No. No, no, no."]], beat: 'The whole villa runs to the lawn.' },
    { id: 'bt.02', stage: "{a}'s phone buzzes, and everyone goes silent.", turns: [['a', "Islanders, a new arrival is coming in tonight, and they're ready to shake things up. #EyesOnTheSteps"], ['b', "Tonight? As in now?"]] },
    { id: 'bt.03', stage: '{a} shouts it across the garden.', turns: [['a', "I got a text!"], ['a', "Islanders, prepare yourselves. A bombshell is about to walk in. #WhoIsIt"], ['b', "I'm not ready for this."]] },
    { id: 'bt.04', turns: [['a', "Islanders, someone new has arrived, and they've already got their eye on someone. #WatchThisSpace"], ['b', "Already? Who?"], ['a', "It doesn't say!"]] },
    { id: 'bt.05', stage: 'Everybody crowds round {a} and the phone.', turns: [['a', "Islanders, it's time to welcome a new face. #FreshStart"], ['b', "Somebody's couple is about to get tested."]], beat: 'Two couples look at each other.' },
    { id: 'bt.06', turns: [['a', "I've got a text. Everyone shush."], ['a', "Islanders, a new islander will be joining you shortly. #BrokenHearts"], ['b', "Why is it always broken hearts?"]] },
    { id: 'bt.07', stage: 'The phone buzzes on the kitchen counter, and {a} gets to it first.', turns: [['a', "Islanders, the villa is about to get one more resident. #NoOneIsSafe"], ['b', "No one is safe. Great. Brilliant."]] },
    { id: 'bt.08', when: { cast: 1 }, turns: [['a', "Islanders, a new arrival is on the way. #GetReady"]], beat: 'Somebody screams. Somebody drops a glass.' },
  ],
  'bombshell-guess': [
    { id: 'bg.c.01', when: { coupled: true }, turns: [['a', "Whoever it is, I'm not worried."], ['b', "You're holding my hand really tight."], ['a', "I'm not worried."]] },
    { id: 'bg.c.02', when: { coupled: true }, turns: [['b', "Are you nervous?"], ['a', "Me? No. Are you?"], ['b', "A bit."], ['a', "…Okay, so am I."]] },
    { id: 'bg.c.03', when: { coupled: true }, turns: [['a', "Promise me you won't get your head turned."], ['b', "I promise. We don't even know who it is yet."], ['a', "That's what worries me."]] },
    { id: 'bg.c.04', when: { coupled: true }, turns: [['b', "It's probably nothing."], ['a', "It's never nothing. It's a bombshell."]], beat: '{a} moves a little closer to {b}.' },
    { id: 'bg.c.05', when: { coupled: true }, turns: [['a', "If it's your type, I'm going to cry."], ['b', "You're my type."], ['a', "Good answer. Keep saying that."]] },
    { id: 'bg.s.01', when: { coupled: false, gender: 'f' }, turns: [['a', "Please be a boy. Please be a boy."], ['b', "You're shaking."], ['a', "I'm excited!"]] },
    { id: 'bg.s.02', when: { coupled: false, gender: 'm' }, turns: [['a', "It has to be a girl. It has to be."], ['b', "And if it's another boy?"], ['a', "Then I'll be very polite about it."]] },
    { id: 'bg.s.03', when: { coupled: false }, turns: [['a', "This could be it for me. This could be my person."], ['b', "Or it could be somebody you can't stand."], ['a', "Let me have this."]] },
    { id: 'bg.s.04', when: { coupled: false }, turns: [['b', "Who do you think it is?"], ['a', "I don't know, but I've been waiting for this all week."], ['b', "It's been three days."], ['a', "Longest three days of my life."]] },
    { id: 'bg.s.05', when: { coupled: false }, turns: [['a', "I'm not saying I've got my hopes up."], ['b', "You've put lipstick on in the last thirty seconds."], ['a', "…That's not the same thing."]] },
    { id: 'bg.s.06', when: { coupled: false, cast: 1 }, turns: [['a', "Okay. Deep breaths. Whoever it is, be nice. Be normal. Be cool."]], beat: '{a} is not being cool.' },
  ],
  entrance: [
    { id: 'eb.01', when: { of: 'bombshell' }, stage: 'Everybody is lined up on the lawn, staring at the top of the steps.', turns: [['narrator', "Here we go. Every couple in the villa, holding their breath at once."], ['a', "Hi, everyone! I'm {a}."]], beat: 'Nobody says anything for a second. Then everybody says hello at once.' },
    { id: 'eb.02', when: { of: 'bombshell' }, stage: 'A shadow at the top of the steps. Then {a} walks down, slowly, taking it all in.', turns: [['narrator', "And just like that, the villa has a new problem. A very good-looking one."], ['a', "Hello! Don't all look so worried."]] },
    { id: 'eb.03', when: { of: 'bombshell' }, stage: '{a} stops halfway down the steps and gives a little wave.', turns: [['narrator', "Somebody's couple is about to get tested. We just don't know whose yet."], ['a', "So. Who's going to give me the tour?"]], beat: 'Three hands go up. One of them is quickly pulled back down by a partner.' },
    { id: 'eb.04', when: { of: 'bombshell' }, stage: 'The music stops. {a} walks in like the villa belongs to {a.obj}.', turns: [['narrator', "Nobody move. Nobody breathe. Nobody look at your partner."], ['a', "Hi, guys. I've been watching, so I already know who I want to talk to."]], beat: 'Two couples shuffle a little closer together.' },
    { id: 'eb.05', when: { of: 'bombshell' }, stage: 'Heads turn one at a time as {a} walks across the lawn.', turns: [['narrator', "There's a word for this feeling in the villa. It's panic."], ['a', "I'm {a}. I'm very happy to be here. Some of you might be less happy."]] },
    { id: 'eb.06', when: { of: 'bombshell' }, stage: '{a} comes down the steps holding the rail, a little nervous.', turns: [['narrator', "A new arrival, and the villa is pretending to be calm about it."], ['a', "Hi! Sorry. I'm so nervous. Hi."]], beat: 'Everyone rushes over to say hello, which helps.' },
    { id: 'eb.07', when: { of: 'bombshell' }, stage: 'For a moment there is only the sound of a suitcase on the steps.', turns: [['narrator', "Every islander in this villa is thinking the same thing. Please don't be my partner's type."], ['a', "Evening, everyone. I'm {a}."]] },
    { id: 'eb.08', when: { of: 'bombshell' }, stage: '{a} walks straight down the middle of the lawn and stops by the fire pit.', turns: [['narrator', "Ten minutes ago this villa was settled. Enjoy that memory."], ['a', "Right. Nice to meet you all. Let's see what happens."]] },
    { id: 'eb.09', when: { of: 'bombshell', persona: 'fuckboy' }, stage: '{a} takes the steps two at a time, grinning.', turns: [['narrator', "Well. Here comes trouble, and it knows it."], ['a', "Don't worry. I'm only here to steal one or two of you."]] },
    { id: 'eb.10', when: { of: 'bombshell', persona: 'wallflower' }, stage: '{a} appears at the top of the steps and freezes for a second.', turns: [['narrator', "The quiet ones, the villa always says. Watch the quiet ones."], ['a', "Hi. I'm {a}. That's… that's it. That's my speech."]], beat: 'It gets a laugh, and a warm one.' },
  ],
  'bombshell-react': [
    { id: 'br.s.01', when: { of: 'stunned', cast: 2 }, turns: [['a', "Oh my God."]], beat: '{a} cannot stop looking at {b}.' },
    { id: 'br.s.02', when: { of: 'stunned', cast: 2 }, turns: [['a', "Okay. Okay. I need a minute."]], beat: '{a} fixes {a.posAdj} hair without realising.' },
    { id: 'br.s.03', when: { of: 'stunned', cast: 2 }, turns: [['a', "That is exactly my type. That is my type walking down the stairs."]] },
    { id: 'br.s.04', when: { of: 'stunned', cast: 2 }, turns: [['a', "I've just forgotten my own name."]], beat: '{a} goes over to say hello first.' },
    { id: 'br.s.05', when: { of: 'stunned', cast: 2 }, turns: [['a', "Well. Tonight just got interesting."]] },
    { id: 'br.p.01', when: { of: 'stunned', cast: 3 }, turns: [['a', "Wow."], ['c', "Wow what?"], ['a', "Nothing. It's just a nice evening."]], beat: '{c} is not buying it.' },
    { id: 'br.p.02', when: { of: 'stunned', cast: 3 }, turns: [['c', "You can close your mouth now."], ['a', "I wasn't— I'm not—"], ['c', "You were."]] },
    { id: 'br.p.03', when: { of: 'stunned', cast: 3 }, stage: "{a}'s eyes follow {b} across the whole lawn.", turns: [['c', "Hello? I'm right here."], ['a', "I know. Sorry. I know you are."]] },
    { id: 'br.p.04', when: { of: 'stunned', cast: 3 }, turns: [['a', "{b} seems nice."], ['c', "{b} has said one word."], ['a', "It was a nice word."]] },
    { id: 'br.p.05', when: { of: 'stunned', cast: 3 }, stage: '{a} lets go of {c.posAdj} hand to wave at {b}.', turns: [['c', "Really?"]], beat: '{a} takes the hand back, a second too late.' },
    { id: 'br.w.01', when: { of: 'worried' }, turns: [['a', "Why is {b} staring at {c} like that?"]], beat: '{a} crosses {a.posAdj} arms and does not uncross them.' },
    { id: 'br.w.02', when: { of: 'worried' }, turns: [['a', "{b} hasn't looked at me once since {c} walked in."]], beat: 'Somebody nearby pretends not to have heard.' },
    { id: 'br.w.03', when: { of: 'worried' }, turns: [['a', "I saw that. I saw that look."]], beat: '{a} goes to get a drink and takes a long time about it.' },
    { id: 'br.w.04', when: { of: 'worried' }, turns: [['a', "Great. Of course it's {b}'s type. Of course."]] },
    { id: 'br.w.05', when: { of: 'worried' }, turns: [['a', "I'm fine. I'm totally fine. {b} can look at whoever {b} wants."]], beat: '{a} is not fine.' },
    { id: 'br.u.01', when: { of: 'unbothered' }, turns: [['a', "Nice. Anyway, who wants a drink?"]], beat: '{a} is the only one not staring at {b}.' },
    { id: 'br.u.02', when: { of: 'unbothered' }, turns: [['a', "Yeah, not for me. Seems nice, though."]] },
    { id: 'br.u.03', when: { of: 'unbothered' }, turns: [['a', "Everyone calm down. It's one person."]], beat: 'Nobody calms down.' },
    { id: 'br.u.04', when: { of: 'unbothered' }, turns: [['a', "Honestly? I'm more interested in my dinner."]] },
  ],
};

// The beach hut on these scenes: first impressions, straight to camera.
const K = (kind, more = {}) => ({ kind, ...more });
export const NIGHT_ONE_HUT = {
  honest: [
    { id: 'hut.ac.h1', when: K('arrival-chat', { withB: true }), turns: [['a', "{b} is going to be my person in here. I can tell already."]] },
    { id: 'hut.ac.h2', when: K('arrival-chat', { withB: true }), turns: [['a', "First impressions of {b}? Warm. Funny. I think we'll be fine."]] },
    { id: 'hut.ac.h3', when: K('arrival-chat', { withB: true, of: 'same-type' }), turns: [['a', "{b} and I want the same thing. That's either a friendship or a problem."]] },
    { id: 'hut.ac.h4', when: K('arrival-chat', { withB: true, of: 'clash' }), turns: [['a', "{b} and I got off on the wrong foot. I'm going to try. I'm not promising."]] },
    { id: 'hut.ac.h5', when: K('arrival-chat', { withB: true, of: 'nerves' }), turns: [['a', "I was so nervous, and {b} just made it normal. I needed that."]] },
    { id: 'hut.ac.h6', when: K('arrival-chat', { withB: true }), turns: [['a', "Honestly, I didn't expect to like everyone this much on day one."]] },
    { id: 'hut.ft.h1', when: K('first-toast'), turns: [['a', "That toast. That's the moment it felt real. We're actually doing this."]] },
    { id: 'hut.db.h1', when: K('debrief', { of: 'happy' }), turns: [['a', "I got who I wanted. I'm trying not to look too pleased with myself."]] },
    { id: 'hut.db.h2', when: K('debrief', { of: 'unsure' }), turns: [['a', "It's not that I don't like them. I just need more than a first night."]] },
    { id: 'hut.db.h3', when: K('debrief', { of: 'rather' }), turns: [['a', "I shouldn't have said that out loud. It's true, though."]] },
    { id: 'hut.db.h4', when: K('debrief', { of: 'rather-yours', role: 1 }), turns: [['a', "One hour in and someone's already told me they like my partner. Great start."]] },
    { id: 'hut.db.h5', when: K('debrief', { of: 'rather-yours', role: 0 }), turns: [['a', "Maybe I should have kept that to myself. Too late now."]] },
    { id: 'hut.bg.h1', when: K('bombshell-guess'), turns: [['a', "Every time that phone goes off, my heart stops."]] },
    { id: 'hut.bt.h1', when: K('bombshell-text'), turns: [['a', "The second I read that text, I looked straight at every couple in here."]] },
    { id: 'hut.br.h1', when: K('bombshell-react', { of: 'stunned', role: 0 }), turns: [['a', "When {b} walked in, I actually forgot what I was saying."]] },
    { id: 'hut.br.h2', when: K('bombshell-react', { of: 'worried', role: 0 }), turns: [['a', "I saw the way my partner looked at the new one. I'm not stupid."]] },
    { id: 'hut.br.h3', when: K('bombshell-react', { of: 'unbothered', role: 0 }), turns: [['a', "Everyone lost their minds. Not me. I'm happy where I am."]] },
    { id: 'hut.eb.h1', when: K('entrance', { of: 'bombshell' }), turns: [['a', "I walked in and I felt every single couple tense up. I loved it."]] },
  ],
  'two-faced': [
    { id: 'hut.ac.t1', when: K('arrival-chat', { withB: true }), turns: [['a', "{b} is lovely. {b} is also exactly who I'd be worried about. Both things."]] },
    { id: 'hut.ac.t2', when: K('arrival-chat', { withB: true, of: 'same-type' }), turns: [['a', "We said no drama. I said no drama. I didn't say I'd step aside."]] },
    { id: 'hut.db.t1', when: K('debrief', { of: 'happy' }), turns: [['a', "I told everyone I'm happy. I am. Mostly. For now."]] },
    { id: 'hut.db.t2', when: K('debrief', { of: 'rather' }), turns: [['a', "I've got a partner. I've also got a plan."]] },
    { id: 'hut.br.t1', when: K('bombshell-react', { of: 'stunned', role: 0 }), turns: [['a', "My partner's right there. I know. I still looked."]] },
  ],
};
