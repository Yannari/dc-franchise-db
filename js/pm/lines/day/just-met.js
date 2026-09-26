// just-met — the day they arrived. Every scene here is between two islanders
// who have known each other for hours (`justMet`: one of them walked in this
// episode — night one for everybody, a bombshell's first day for them).
// They ask the questions strangers ask, they are a little shy or a little too
// bold, and nobody says "I miss you" (user, reading night one: "what are
// their bonds for them to say this to each other after the first
// conversation?"). script.js leads with these whenever `justMet` is true.
//
// Never invent a backstory fact (a job, a sibling, a hometown): the cast
// setup owns those. Plain talk, and a beat that says what they do next.
const J = { justMet: true };

export const JUST_MET = {
  chat: [
    { id: 'jm.chat.01', when: J, turns: [['a', "So what made you want to do this?"], ['b', "Honestly? My friends dared me to apply. And then I got a phone call."], ['a', "Same. Well, sort of."]] },
    { id: 'jm.chat.02', when: J, turns: [['a', "Is it weird that I already feel like I've been here a week?"], ['b', "No. It's been about four hours, and I've told you things my friends don't know."]] },
    { id: 'jm.chat.03', when: J, turns: [['a', "I'm still trying to learn everyone's names."], ['b', "You've got mine, though."], ['a', "I've definitely got yours."]], beat: '{b} smiles and looks at the pool.' },
    { id: 'jm.chat.04', when: J, turns: [['a', "What do you normally do on a Saturday?"], ['b', "Sleep until twelve, then panic about what to do with the rest of it."], ['a', "That's the perfect Saturday."]] },
    { id: 'jm.chat.05', when: J, turns: [['a', "Can I ask you something? What did you think when you first saw me?"], ['b', "That you looked more nervous than me. Which was a relief."]], beat: '{a} laughs.' },
    { id: 'jm.chat.06', when: J, turns: [['a', "Are you a morning person?"], ['b', "Not even slightly. Are you?"], ['a', "I'm up at six."], ['b', "Oh no. This might not work."]] },
    { id: 'jm.chat.07', when: J, turns: [['a', "I didn't think I'd be this nervous."], ['b', "You don't look nervous."], ['a', "I'm very good at hiding it."]] },
    { id: 'jm.chat.08', when: J, turns: [['a', "So, what's your type? Honestly."], ['b', "I'm working that out. Ask me again in a couple of days."]], beat: '{b} holds {a.posAdj} gaze.' },
    { id: 'jm.chat.09', when: J, turns: [['a', "Do you want the good sunbed or the one in the shade?"], ['b', "Whichever one you're on."], ['a', "Smooth."], ['b', "I've been practising that one all day."]] },
    { id: 'jm.chat.10', when: J, turns: [['a', "What are you like when you're in a relationship?"], ['b', "Loyal. Maybe a bit too much. What about you?"], ['a', "I'll tell you when I know you better."]] },
    { id: 'jm.chat.11', when: J, turns: [['a', "This is so strange. A few hours ago we'd never met."], ['b', "And now we're a couple."], ['a', "On paper."], ['b', "On paper. For now."]] },
    { id: 'jm.chat.12', when: J, turns: [['a', "Tell me three things about you."], ['b', "I can't cook, I talk in my sleep, and I'm scared of the dark."], ['a', "That's a lot of honesty for day one."]] },
    { id: 'jm.chat.13', when: J, turns: [['a', "Is there anyone in here you already get on with?"], ['b', "You, so far."], ['a', "So far."]], beat: '{a} nudges {b} with a shoulder.' },
    { id: 'jm.chat.nospark.01', when: { ...J, feels: 'little' }, turns: [['a', "So… do you like the villa?"], ['b', "Yeah. It's nice."], ['a', "Yeah."]], beat: "There's an awkward silence." },
    { id: 'jm.chat.nospark.02', when: { ...J, feels: 'little' }, turns: [['a', "What do you do for fun?"], ['b', "Gym, mainly."], ['a', "Right. I don't really do the gym."]], beat: 'They both look over at the others for something to say.' },
    { id: 'jm.chat.nospark.03', when: { ...J, feels: 'little' }, turns: [['a', "I think we've been put together because we were the last two."], ['b', "Probably."], ['a', "No offence."], ['b', "None taken."]] },
    { id: 'jm.chat.nospark.04', when: { ...J, feels: 'little' }, turns: [['a', "Are you having a good day?"], ['b', "It's been a long one."]], beat: '{a} nods and looks at the pool.' },
    { id: 'jm.chat.nospark.05', when: { ...J, feels: 'little' }, turns: [['a', "We should probably get to know each other."], ['b', "We should."]], beat: 'Neither of them starts.' },
    { id: 'jm.chat.nospark.06', when: { ...J, feels: 'little' }, turns: [['a', "You keep looking over there."], ['b', "Do I? Sorry. What were you saying?"]] },
    { id: 'jm.chat.14', when: J, turns: [['a', "What did your friends say when you told them you were coming here?"], ['b', "They laughed. For quite a long time."]] },
  ],
  'deep-chat': [
    { id: 'jm.deep.01', when: J, turns: [['a', "Can I ask why you're single? You seem like you'd be snapped up."], ['b', "Bad timing, mostly. And maybe I've been picking the wrong people."]] },
    { id: 'jm.deep.02', when: J, turns: [['a', "What's the most important thing to you in someone?"], ['b', "That they're honest. Even when it's awkward."], ['a', "Okay. I can do honest."]] },
    { id: 'jm.deep.03', when: J, turns: [['a', "Have you ever been in love?"], ['b', "I think so, once. But how would you ever know for sure?"], ['a', "I think you'd know."]] },
    { id: 'jm.deep.04', when: J, turns: [['a', "I don't usually open up this fast."], ['b', "Me neither. It's something about this place."], ['a', "Or something about you."]] },
    { id: 'jm.deep.05', when: J, turns: [['a', "What went wrong with your last relationship? You don't have to tell me."], ['b', "We wanted different things. It took us too long to say it."]], beat: "{a} nods and doesn't push." },
    { id: 'jm.deep.06', when: J, turns: [['a', "What are you most scared of in here?"], ['b', "Being the one nobody picks."], ['a', "I picked you."], ['b', "Today, you did."]] },
    { id: 'jm.deep.07', when: J, turns: [['a', "Is it silly to say I already feel comfortable with you?"], ['b', "It's not silly. It's a good start."]] },
    { id: 'jm.deep.08', when: J, turns: [['a', "What do you want out of all this, really?"], ['b', "Someone I'd still want to talk to when the cameras are off."]] },
    { id: 'jm.deep.09', when: J, turns: [['a', "Do you think you can meet someone properly in a place like this?"], ['b', "I don't know yet. I came to find out."]] },
    { id: 'jm.deep.awk.01', when: { ...J, feels: 'little' }, turns: [['a', "What are you looking for, really?"], ['b', "Someone fun. I don't want anything serious."], ['a', "Oh. I kind of do."]] },
    { id: 'jm.deep.awk.02', when: { ...J, feels: 'little' }, turns: [['a', "Do you want kids one day?"], ['b', "Wow. It's the first day."], ['a', "Sorry. Too much?"]] },
    { id: 'jm.deep.awk.03', when: { ...J, feels: 'little' }, turns: [['a', "I feel like I'm doing all the talking."], ['b', "I'm listening."], ['a', "Are you, though?"]] },
    { id: 'jm.deep.10', when: J, turns: [['a', "I was really worried nobody would talk to me today."], ['b', "I was worried about the same thing. And then you did."]], beat: "They sit quietly for a while, and it isn't awkward." },
  ],
  kiss: [
    { id: 'jm.kiss.01', when: J, turns: [['a', "Is it too soon for this?"], ['b', "Probably."]], beat: 'They kiss anyway, and then both laugh.' },
    { id: 'jm.kiss.02', when: J, turns: [['a', "I've been wanting to do that since the fire pit."], ['b', "What took you so long?"]] },
    { id: 'jm.kiss.03', when: J, stage: 'Their first kiss is by the pool, as the sun goes down.', turns: [['b', "Well. That was a good first one."], ['a', "Just good?"], ['b', "Let's see how the second one goes."]] },
    { id: 'jm.kiss.04', when: J, turns: [['a', "Sorry. I don't normally kiss someone I met this morning."], ['b', "Don't apologise. I'm not."]] },
    { id: 'jm.kiss.05', when: J, stage: '{a} kisses {b} on the cheek, and {b} turns it into a real one.', turns: [['a', "Oh. Okay then."]] },
    { id: 'jm.kiss.06', when: J, turns: [['a', "Everyone's watching us."], ['b', "Let them watch."]], beat: 'Somebody on the terrace whistles.' },
    { id: 'jm.kiss.07', when: J, stage: 'A quick first kiss on the daybed, before anyone can see.', turns: [['b', "That's our secret."], ['a', "There are about forty cameras."], ['b', "Our secret and theirs."]] },
    { id: 'jm.kiss.08', when: J, turns: [['a', "Can I kiss you?"], ['b', "I was starting to think you'd never ask."]] },
    { id: 'jm.kiss.09', when: J, stage: 'After a long chat on the swing seat, {a} leans in.', turns: [['b', "First day and you've already got me on the swing."], ['a', "It's a very romantic swing."]] },
    { id: 'jm.kiss.awk.01', when: { ...J, feels: 'little' }, turns: [['a', "That was… nice."], ['b', "Yeah. Nice."]], beat: 'They both look away at the same time.' },
    { id: 'jm.kiss.awk.02', when: { ...J, feels: 'little' }, stage: 'A first kiss that neither of them seems sure about.', turns: [['b', "Should we try that again?"], ['a', "Maybe later."]] },
    { id: 'jm.kiss.awk.03', when: { ...J, feels: 'little' }, stage: '{a} goes in for a kiss, and {b} turns so it lands on {b.posAdj} cheek.', turns: [['a', "Oh. Okay."], ['b', "Sorry. It's just a bit soon."]] },
    { id: 'jm.kiss.10', when: J, turns: [['a', "I'm terrible at first kisses."], ['b', "You're really not."]] },
  ],
  pull: [
    { id: 'jm.pull.01', when: J, turns: [['a', "Can I borrow you? I feel like we never got a chance to talk."], ['b', "We only arrived a few hours ago."], ['a', "Exactly. So we're behind."]] },
    { id: 'jm.pull.02', when: J, turns: [['a', "I know you're coupled up. I just wanted to get to know you."], ['b', "It's day one. Everyone's getting to know everyone."]] },
    { id: 'jm.pull.03', when: J, turns: [['a', "I would have stepped forward for you, you know."], ['b', "Would you?"], ['a', "I'm just saying. In case it matters later."]] },
    { id: 'jm.pull.04', when: J, turns: [['a', "So how's it going with your couple?"], ['b', "Early days. We've had one conversation."], ['a', "Good. I mean, good for you."]] },
    { id: 'jm.pull.05', when: J, turns: [['a', "Can we have a chat? Nothing serious. I just wanted to say hi properly."], ['b', "Hi, properly."]], beat: '{a} laughs and sits down next to {b}.' },
    { id: 'jm.pull.06', when: J, turns: [['a', "Where are you from, then?"], ['b', "Is this a chat or an interview?"], ['a', "A bit of both."]] },
    { id: 'jm.pull.07', when: J, turns: [['a', "I noticed you when we all walked in."], ['b', "I noticed you noticing."]] },
    { id: 'jm.pull.08', when: J, turns: [['a', "I've been trying to talk to you all afternoon."], ['b', "Well, you've got me now."]] },
    { id: 'jm.pull.09', when: J, turns: [['a', "I think we'd get on. That's all I wanted to say."], ['b', "You might be right."]], beat: 'Neither of them says anything else, and neither of them leaves.' },
    { id: 'jm.pull.10', when: J, turns: [['a', "Are you happy with who you're coupled with?"], ['b', "Ask me in a few days."], ['a', "I will."]] },
  ],
  friendship: [
    { id: 'jm.friend.01', when: J, turns: [['a', "I'm so glad you're here. I was worried I wouldn't get on with anyone."], ['b', "Same. Stick with me."]] },
    { id: 'jm.friend.02', when: J, turns: [['a', "You're going to be my person in here, I can tell."], ['b', "Already? It's been a day."], ['a', "I know these things."]] },
    { id: 'jm.friend.03', when: { ...J, phase: 'evening' }, turns: [['a', "Can you help me with my hair before the fire pit?"], ['b', "Only if you tell me what you really think of everyone."]] },
    { id: 'jm.friend.04', when: J, turns: [['a', "First impressions of the villa. Go."], ['b', "Beautiful. Terrifying. Mostly terrifying."]] },
    { id: 'jm.friend.05', when: J, turns: [['a', "Who do you think is going to be trouble?"], ['b', "Honestly? Probably me."]], beat: 'They both laugh.' },
    { id: 'jm.friend.06', when: J, turns: [['a', "I didn't think I'd make a friend on the first day."], ['b', "You haven't. You've made a best friend."]] },
    { id: 'jm.friend.07', when: J, turns: [['a', "Do you want to share a mirror in the morning?"], ['b', "Deal. I'm very slow, though."], ['a', "I'll bring snacks."]] },
    { id: 'jm.friend.08', when: J, turns: [['a', "I've got a good feeling about you."], ['b', "Good. I've got a good feeling about you too."]] },
    { id: 'jm.friend.09', when: J, turns: [['a', "Can I be honest? I'm a bit overwhelmed."], ['b', "Everyone is. We'll get through the first night together."]] },
    { id: 'jm.friend.10', when: J, turns: [['a', "You were the first person to talk to me today."], ['b', "You looked like you needed it."]] },
  ],
  comedy: [
    { id: 'jm.comedy.01', when: J, stage: '{a} tries to work the outdoor shower and gets completely soaked.', turns: [['a', "Nobody saw that. Nobody saw that."]] },
    { id: 'jm.comedy.02', when: J, stage: '{a} gets lost looking for the bathroom.', turns: [['a', "How is this villa so big? I've been round it three times."]] },
    { id: 'jm.comedy.03', when: J, stage: "{a} unpacks, and it's mostly shoes.", turns: [['a', "I thought it would be cold at night. It's not cold at night."]] },
    { id: 'jm.comedy.04', when: J, stage: '{a} jumps into the pool, forgetting the microphone.', turns: [['a', "Oh no. Is this waterproof? Please say this is waterproof."]] },
    { id: 'jm.comedy.05', when: J, stage: "{a} introduces {a.ref} to someone for the third time today.", turns: [['a', "I know. I know we've met. I'm just very bad with names."]] },
    { id: 'jm.comedy.06', when: J, stage: "{a} sits down on a daybed that's already wet.", turns: [['a', "Great. Brilliant. First impressions."]] },
    { id: 'jm.comedy.07', when: J, stage: '{a} spends ten minutes trying to open the fridge.', turns: [['a', "It's a push one. Of course it's a push one."]] },
    { id: 'jm.comedy.08', when: J, stage: '{a} practises a chat-up line in the mirror, out loud.', turns: [['a', "No. Too much. Again."]] },
  ],
  loyalty: [
    { id: 'jm.loyal.01', when: J, turns: [['b', "Can I get to know you a bit?"], ['a', "I'm coupled up, and I want to see where it goes. Sorry."]] },
    { id: 'jm.loyal.02', when: J, turns: [['b', "Want a chat by the pool?"], ['a', "Maybe another day. I'm giving this one a real chance first."]] },
    { id: 'jm.loyal.03', when: J, turns: [['b', "You seem really nice."], ['a', "So do you. But I've only just coupled up, and I want to be fair."]] },
    { id: 'jm.loyal.04', when: J, turns: [['b', "I'd have stepped forward for you."], ['a', "That's sweet. I'm happy where I am, though. For now."]] },
    { id: 'jm.loyal.05', when: J, turns: [['b', "Just one chat?"], ['a', "Not tonight. Ask me in a week."]] },
    { id: 'jm.loyal.06', when: J, turns: [['b', "Are you sure you're happy in your couple?"], ['a', "It's day one. I'm sure enough to give it a chance."]] },
  ],
  // ── day one's friction: no spark, the ick, a bad first impression ──
  ick: [
    { id: 'jm.ick.01', when: J, turns: [['b', "So I clicked my fingers at the waiter, and he came straight over."], ['a', "You clicked your fingers? At a waiter?"]], beat: '{a} goes very quiet.' },
    { id: 'jm.ick.02', when: J, stage: '{b} tells {a} the same joke for the second time in an hour.', turns: [['a', "…Yeah. You said."]] },
    { id: 'jm.ick.03', when: J, stage: '{b} checks {b.posAdj} reflection in the pool while {a} is talking.', turns: [['a', "Am I keeping you?"], ['b', "Sorry, what?"]] },
    { id: 'jm.ick.04', when: J, turns: [['b', "I'm not really into feelings and all that."], ['a', "Right. On a dating show."]] },
    { id: 'jm.ick.05', when: J, stage: '{b} chews with {b.posAdj} mouth open all the way through lunch.', turns: [['a', "I'm going to go and get some more water."]] },
    { id: 'jm.ick.06', when: J, turns: [['b', "I've been told I'm a bit of a catch."], ['a', "By who?"], ['b', "Everyone, really."]], beat: '{a} smiles politely and stops listening.' },
    { id: 'jm.ick.07', when: J, stage: '{b} calls {a} by the wrong name. Twice.', turns: [['a', "It's {a}."], ['b', "That's what I said."]] },
    { id: 'jm.ick.08', when: J, turns: [['b', "Honestly, I'm only really here for the experience."], ['a', "Oh. Okay. Good to know."]] },
  ],
  gossip: [
    { id: 'jm.gossip.01', when: { ...J, knows: true }, turns: [['a', "Can I tell you something? I saw {c} flirting with someone else already."], ['b', "It's the first day!"], ['a', "That's what I said."]] },
    { id: 'jm.gossip.02', when: { ...J, knows: true }, turns: [['a', "I don't want to cause trouble on day one, but you should keep an eye on {c}."], ['b', "What did you see?"]] },
    { id: 'jm.gossip.03', when: { ...J, knows: true }, turns: [['a', "{c} is not as into you as you think. I'm just saying."], ['b', "We've been a couple for about five hours."]] },
    { id: 'jm.gossip.04', when: { ...J, knows: true }, turns: [['a', "I thought you'd want to know. {c} was all over someone else by the pool."], ['b', "Right."]], beat: "{b} doesn't say another word for a while." },
    { id: 'jm.gossip.05', when: { ...J, knows: true }, turns: [['a', "Day one and {c} already has a wandering eye."], ['b', "Are you sure?"], ['a', "I know what I saw."]] },
    { id: 'jm.gossip.06', when: { ...J, knows: true }, turns: [['a', "I don't know if I should say this."], ['b', "If it's about {c}, say it."]] },
  ],
  'challenge-kiss': [
    { id: 'jm.ckiss.01', when: J, turns: [['a', "I don't even know your surname and I've just kissed you."], ['b', "It's a challenge. It doesn't count."], ['a', "It counted a bit."]] },
    { id: 'jm.ckiss.02', when: J, turns: [['a', "Sorry! It's the rules."], ['b', "I love the rules."]] },
    { id: 'jm.ckiss.03', when: J, turns: [['a', "That's one way to say hello."], ['b', "Nice to meet you properly."]] },
    { id: 'jm.ckiss.04', when: J, turns: [['a', "Did everyone see that?"], ['b', "Everyone saw that."]], beat: 'The rest of the villa cheers.' },
    { id: 'jm.ckiss.05', when: J, turns: [['a', "We've known each other for a day."], ['b', "Then that was a very good day."]] },
    { id: 'jm.ckiss.06', when: J, turns: [['a', "I've never kissed anyone I met that morning."], ['b', "There's a first time for everything."]] },
  ],
  'challenge-win': [
    { id: 'jm.cwin.01', when: J, turns: [['a', "We won! Our first day as a couple and we won!"], ['b', "We make a good team already."]] },
    { id: 'jm.cwin.02', when: J, turns: [['a', "I think that's a good sign."], ['b', "A very good sign."]], beat: 'They high-five, then hug.' },
    { id: 'jm.cwin.03', when: J, turns: [['a', "I didn't know you were that competitive."], ['b', "You don't know a lot about me yet."], ['a', "I'm learning."]] },
    { id: 'jm.cwin.04', when: J, turns: [['a', "We've only been a couple for a few hours."], ['b', "And we're already the best one in here."]] },
    { id: 'jm.cwin.05', when: J, turns: [['a', "Not bad for two strangers."], ['b', "We're not strangers any more."]] },
    { id: 'jm.cwin.06', when: J, turns: [['a', "Do you always win things?"], ['b', "Only when I've got the right partner."]] },
  ],
};

// The beach hut on the day they arrived.
const H = (kind, more = {}) => ({ kind, justMet: true, ...more });
export const JUST_MET_HUT = {
  honest: [
    { id: 'hut.jm.h01', when: H(['chat', 'deep-chat']), turns: [['a', "I've known {b} for about six hours, and I already like talking to {b} more than most people I know."]] },
    { id: 'hut.jm.h02', when: H(['chat', 'deep-chat']), turns: [['a', "It's early days. Very early. But {b} is easy to talk to, and that's a good start."]] },
    { id: 'hut.jm.h03', when: H('kiss'), turns: [['a', "First kiss on the first day. My {~mum} is going to be watching this."]] },
    { id: 'hut.jm.h04', when: H('kiss'), turns: [['a', "I didn't plan on kissing anyone today. {b} changed that plan."]] },
    { id: 'hut.jm.h05', when: H('pull', { role: 0 }), turns: [['a', "I know {b} is coupled up. It's day one, though. Nothing's decided."]] },
    { id: 'hut.jm.h06', when: H('pull', { role: 1 }), turns: [['a', "Someone pulled me for a chat on day one. I'm flattered, and I'm staying where I am. For now."]] },
    { id: 'hut.jm.h07', when: H('friendship'), turns: [['a', "I've made a friend already. {b} is going to get me through this."]] },
    { id: 'hut.jm.h08', when: H('argument'), turns: [['a', "One day in and I've already had a disagreement. That has to be a record."]] },
    { id: 'hut.jm.h09', when: H('comedy'), turns: [['a', "I've been here one day and I've already embarrassed myself three times."]] },
    { id: 'hut.jm.h10', when: H(['challenge-kiss', 'challenge-win']), turns: [['a', "Day one and I'm already doing challenges with someone I just met. This place is mad."]] },
  ],
  'two-faced': [
    { id: 'hut.jm.t01', when: H(['chat', 'deep-chat']), turns: [['a', "{b} is lovely. I'm just not sure {b} is the one. It's day one, I'm keeping my options open."]] },
    { id: 'hut.jm.t02', when: H('kiss'), turns: [['a', "The kiss was nice. I'm still looking around, though."]] },
    { id: 'hut.jm.t03', when: H('pull', { role: 0 }), turns: [['a', "I'm coupled up, but I'd be lying if I said I wasn't curious about {b}."]] },
    { id: 'hut.jm.t04', when: H(['chat', 'deep-chat', 'kiss']), turns: [['a', "I'm going along with it. I haven't made my mind up about anyone yet."]] },
  ],
};
