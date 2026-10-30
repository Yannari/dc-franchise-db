// ══════════════════════════════════════════════════════════════════════
// pm/talk/friendship.js — two friends: {a} and {b}
// ══════════════════════════════════════════════════════════════════════
//
// The villa's most common scene. Two islanders who aren't after each other:
// their couples ({pa}, {pb} behind taken/bTaken), the villa, home, each other.
// Now and then it's a spat instead (`friction`, the engine's): that plan has
// its own movements and never ends on a cheerful closer.
//   open     they end up together
//   topic    one of them, and how it's going
//   other    the other one's turn
//   banter   a laugh
//   close    how they leave it
//   spat / sour   the falling-out, and how it's left
import { build } from './build.js';

const GIRLS = { gender: 'f', bGender: 'f' };
const BOYS = { gender: 'm', bGender: 'm' };

export const FRIENDSHIP = build('friendship', {
  stages: [
    { stage: "{a} and {b} are on the daybeds." },
    { stage: "{a} and {b} are in the kitchen." },
    { stage: "{a} and {b} are lying by the pool." },
    { stage: "{a} and {b} are sitting on the terrace." },
  ],
  after: ['pull', 'date', 'row', 'told', 'recoupling', 'knocked-back', 'game-kiss'],
  plans: {
    featured: [
      { when: { friction: true }, plan: ['open', 'spat', 'sour'] },
      // No banter piece any more (season read 2026-10-30, the user: "less trying
      // to be clever, just talk with their feelings"): a quiz in the middle of a
      // talk about how somebody is doing broke the talk in two.
      { plan: ['open', 'topic', 'other?', 'close'] },
    ],
    short: [
      { when: { friction: true }, plan: ['spat', 'sour'] },
      { plan: ['open', 'topic', 'close'] },
    ],
  },
  moves: {
    open: [
      { stage: "{a} and {b} sunbathe side by side by the pool.", turns: [
        ['a', "I'm going to burn. I can feel it."],
        ['b', "You've been out here for three hours. You're definitely going to burn."],
        ['a', "Why didn't you say anything?"],
        ['b', "I thought you knew!"],
      ] },
      { stage: "{a} and {b} are on washing-up duty in the kitchen.", turns: [
        ['b', "Who uses this many glasses? There are twelve of us, and there are about forty glasses."],
        ['a', "Everyone gets a new one every time. It's a disease."],
      ] },
      { when: GIRLS, stage: "{a} and {b} get ready together in the dressing room.", turns: [
        ['a', "Can you do my back? I can't reach."],
        ['b', "Come here, {~girl}. Hold still."],
      ] },
      { when: BOYS, stage: "{a} and {b} do a workout together on the terrace.", turns: [
        ['a', "Ten more."],
        ['b', "Ten? You said five."],
        ['a', "I lied. Go on, {~bro}."],
      ] },
      { stage: "{a} sits down next to {b} on the daybeds.", turns: [
        ['a', "Budge up."],
        ['b', "There's a whole daybed."],
        ['a', "I want this bit."],
      ] },
      { when: { phase: 'morning' }, stage: "{a} and {b} are the first ones up, drinking tea on the terrace.", turns: [
        ['b', "I love this bit. Before everyone wakes up and it all kicks off."],
        ['a', "It's the only bit of peace you get in here."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} and {b} sit by the fire pit as the villa winds down.", turns: [
        ['a', "What a day."],
        ['b', "What a day. I'm exhausted, and I haven't done anything."],
      ] },
      { stage: "{a} and {b} float on inflatables in the pool.", turns: [
        ['b', "This is the life."],
        ['a', "Don't splash me. I mean it. If you splash me, it's war."],
      ] },
      { stage: "{a} finds {b} on {b.posAdj} own on the swing seat.", turns: [
        ['a', "You all right? You look miles away."],
        ['b', "I'm fine. Just thinking."],
        ['a', "Dangerous in here. Want company?"],
        ['b', "Go on."],
      ] },
      { when: { reg: 'big' }, stage: "{a} cannonballs into the pool right next to {b}.", turns: [
        ['b', "Oh my God, I'm soaked!"],
        ['a', "You were too dry. It was worrying me."],
      ] },
      { stage: "{a} and {b} are making lunch for everyone.", turns: [
        ['a', "How many sandwiches is that?"],
        ['b', "Eleven. We're one short. Someone's going without."],
        ['a', "It's not going to be me."],
      ] },
    ],

    topic: [
      { when: { taken: true }, turns: [
        ['b', "So how's it going with {pa}? You two look good together."],
        ['a', "It's going really well, actually. I wasn't sure at the start, I'll be honest, but the last few days it's just felt easy. Like, we don't even have to try. We just sit there and it's nice."],
        ['b', "That's how it should be."],
        ['a', "I know. I'm trying not to jinx it."],
      ] },
      { when: { taken: true, myRung: ['coupled', 'cracking-on'] }, turns: [
        ['b', "Are you happy with {pa}? Like, honestly?"],
        ['a', "I'm... yeah. I think so. It's fine. I just don't know if there's that spark, you know? Like, we get on, but I'm still waiting for it to click."],
        ['b', "It might take time."],
        ['a', "Or it might not happen. That's what I'm scared of."],
      ] },
      { when: { taken: true, myRung: ['closed-off', 'exclusive', 'official'] }, turns: [
        ['b', "I can't get over how loved-up you and {pa} are. It's actually sickening."],
        ['a', "Stop it."],
        ['b', "I'm serious. I'm happy for you. I'm also a bit jealous, if I'm honest."],
        ['a', "You'll get there. Your person's coming. I can feel it."],
      ] },
      { when: { taken: false }, turns: [
        ['b', "How are you finding being single in here?"],
        ['a', "Honestly? It's hard. Everyone's coupled up and loved-up, and I'm sitting here like a spare part. I keep telling myself the right person's going to walk in, but every time someone walks in, they go for someone else."],
        ['b', "They'll walk in. I know it."],
        ['a', "You don't know it."],
        ['b', "I've got a feeling."],
      ] },
      { when: { after: 'pull', afterBy: 'a' }, turns: [
        ['b', "So what was that chat with {x} about? Everyone saw."],
        ['a', "It was just a chat. {x} wanted to get to know me. I don't think it was anything."],
        ['b', "You don't think?"],
        ['a', "I mean, it was nice. But it was just a chat. Don't make that face."],
      ] },
      { when: { after: 'date', afterBy: 'a' }, turns: [
        ['b', "Right, I need to hear about this date with {x}. Everything."],
        ['a', "It was nice! It was a nice date. There was food, there was a view, {x} was lovely. But I came back and I didn't feel any different. Is that bad?"],
        ['b', "It's not bad. It's honest."],
      ] },
      { when: { after: 'row', afterBy: 'a' }, turns: [
        ['b', "Are you okay after earlier? That got quite heated."],
        ['a', "I'm fine. I'm still a bit annoyed, if I'm honest. I don't like how it was left. But I don't want to go back over there and start it all again."],
        ['b', "Leave it till tomorrow. Everything looks different in the morning."],
      ] },
      { when: { after: 'told', afterBy: 'a' }, turns: [
        ['b', "How are you doing after what you heard earlier? Honestly."],
        ['a', "Honestly? I'm all over the place. One minute I'm angry, the next I'm sad, and then I'm just embarrassed that everyone knew before me."],
        ['b', "You've got nothing to be embarrassed about."],
        ['a', "It doesn't feel like that."],
      ] },
      { when: { after: 'recoupling', afterBy: 'a' }, turns: [
        ['b', "How are you feeling after the recoupling? That was a lot."],
        ['a', "Relieved, mostly. I was so nervous, I genuinely didn't know which way it was going to go. I'm just glad it's done."],
        ['b', "I could see your leg shaking from where I was sitting."],
      ] },
      { when: { after: 'knocked-back', afterBy: 'a' }, turns: [
        ['b', "Did {x} really try and pull you earlier?"],
        ['a', "Yep. Right in front of everyone. I said no, obviously, but it was so awkward."],
        ['b', "Fair play to you for shutting it down."],
        ['a', "What else was I going to do?"],
      ] },
      { turns: [
        ['a', "Can I ask you something? Do you think people in here see me the way I actually am?"],
        ['b', "What do you mean?"],
        ['a', "I just feel like people think I'm one thing, and I'm actually another. Like, I come across really confident, and I'm actually a bag of nerves half the time."],
        ['b', "I know you are. I can tell."],
        ['a', "Can you?"],
        ['b', "You play with your hair when you're nervous. You've been doing it this whole time."],
      ] },
      { turns: [
        ['b', "What do you miss most about home?"],
        ['a', "My friends. My actual friends. Not that you're not my friend, you are, but I miss having people who've known me forever. In here, everyone's only known me a week."],
        ['b', "I know what you mean. You have to explain yourself all the time."],
        ['a', "Exactly. Nobody knows my jokes yet."],
      ] },
      { when: { gender: 'f', bGender: 'f', taken: true }, turns: [
        ['b', "Right, {~girl}, I need an update. You and {pa}. Go."],
        ['a', "Okay. So. Last night, {pa} just turned round in bed and said, I'm really glad it's you. Out of nowhere. And I didn't know what to say, so I just said, me too, and then I couldn't sleep for about an hour."],
        ['b', "Stop it."],
        ['a', "I know!"],
      ] },
      { when: { gender: 'm', bGender: 'm', taken: true }, turns: [
        ['b', "How's it going with {pa}, {~bro}? Honestly."],
        ['a', "Honestly, {~bro}, it's going really well. I didn't think I'd be like this, but I'm properly into it. Like, I'm not even looking anywhere else, and that's not like me."],
        ['b', "Look at you. Growing up."],
        ['a', "Don't tell anyone."],
      ] },
    ],

    other: [
      { when: { bTaken: true }, turns: [
        ['a', "Anyway, enough about me. How are you and {pb}?"],
        ['b', "Good. Really good, actually. {pb} makes me laugh every single day, and I didn't realise how much I needed that. We're taking it slow, but I've got a good feeling."],
        ['a', "Taking it slow. I've heard that before."],
        ['b', "I mean it this time!"],
      ] },
      { when: { bTaken: true }, turns: [
        ['a', "And what about you and {pb}? Be honest."],
        ['b', "It's... it's fine. It's nice. I don't know. I sometimes think I'm more into it than {pb} is, and that's not a nice feeling."],
        ['a', "Have you said that to {pb}?"],
        ['b', "God, no. I'd die."],
        ['a', "You should, though."],
      ] },
      { when: { bTaken: false }, turns: [
        ['a', "And what about you? Anyone caught your eye yet?"],
        ['b', "Not really. I mean, there's people I get on with, but nobody I'd actually go for. I'm waiting for someone to walk in and just, you know, knock me sideways."],
        ['a', "It'll happen."],
        ['b', "It'd better. I'm running out of patience."],
      ] },
      { turns: [
        ['a', "What about you, though? How are you doing? I feel like everyone's always asking me, and nobody ever asks you."],
        ['b', "Honestly? I'm all right. Bit homesick today. But I'm all right."],
        ['a', "You can talk to me, you know. Whenever."],
        ['b', "I know. Thank you."],
      ] },
      { when: { bMood: ['stressed', 'lonely', 'heartbroken'] }, turns: [
        ['a', "You've been a bit quiet today. Are you okay?"],
        ['b', "Not really, if I'm honest. I've just got a lot going on in my head, and there's nowhere to go in here to get away from it."],
        ['a', "Then don't get away from it. Tell me."],
      ] },
    ],

    banter: [
      { turns: [
        ['b', "Who's the worst person in here to share a bathroom with?"],
        ['a', "I can't say that."],
        ['b', "You can say it to me."],
        ['a', "Okay, but if this gets out, I'll know it was you."],
      ] },
      { turns: [
        ['a', "If this villa was a school, what would everyone be?"],
        ['b', "Oh, I'd be the class clown, obviously."],
        ['a', "You'd be the one who gets sent out every lesson."],
        ['b', "That's what I said. Class clown."],
      ] },
      { turns: [
        ['b', "Can I tell you something embarrassing?"],
        ['a', "Always. That's what I'm here for."],
        ['b', "I've been doing sit-ups every night in the bathroom so nobody sees me."],
        ['a', "I knew it! I knew there was a reason you were taking so long!"],
      ] },
      { turns: [
        ['a', "Rate the food in here. Out of ten."],
        ['b', "When you cook it? Three. When anyone else cooks it? Seven."],
        ['a', "Three? I did a roast!"],
        ['b', "You did a roast on a Tuesday, and you burnt it."],
      ] },
      { turns: [
        ['b', "I've decided you're my best friend in here, by the way."],
        ['a', "Have you? I didn't get a say?"],
        ['b', "No. It's decided. You're stuck with me now."],
        ['a', "Fine. But I'm not sharing my crisps."],
      ] },
      { turns: [
        ['a', "Do you think we'd have been friends on the outside?"],
        ['b', "Probably not. I'd have thought you were stuck-up."],
        ['a', "And I'd have thought you were a nightmare."],
        ['b', "I am a nightmare."],
        ['a', "Yeah, but you're my nightmare now."],
      ] },
    ],

    close: [
      { turns: [
        ['b', "Come here."],
      ], beat: "{b} pulls {a} into a hug." },
      { turns: [
        ['a', "Thanks for that. I needed it."],
        ['b', "Any time. You know where I am."],
      ] },
      { turns: [
        ['b', "Right. I'm going in the pool. Are you coming?"],
        ['a', "Only if you don't splash me."],
        ['b', "No promises."],
      ] },
      { turns: [
        ['a', "Love you, you know."],
        ['b', "Love you too. Now go away, I'm sunbathing."],
      ] },
      { when: { phase: 'evening' }, turns: [
        ['b', "Bed?"],
        ['a', "Bed. Night, you."],
      ] },
      { turns: [
        ['a', "Same time tomorrow?"],
        ['b', "Same time tomorrow. Bring snacks."],
      ] },
    ],

    spat: [
      { turns: [
        ['a', "Can I say something? You've been really off with me today."],
        ['b', "Have I? I haven't noticed."],
        ['a', "You have. You've barely said a word to me since breakfast, and then you were laughing with everyone else at lunch."],
        ['b', "I'm allowed to talk to other people."],
        ['a', "I didn't say you weren't. I'm saying it feels like you're avoiding me."],
      ] },
      { turns: [
        ['b', "Why did you say that in front of everyone earlier?"],
        ['a', "Say what?"],
        ['b', "You know what. The joke about me. Everyone laughed, and I just sat there."],
        ['a', "It was a joke. I didn't mean anything by it."],
        ['b', "It didn't feel like a joke."],
      ] },
      { turns: [
        ['a', "Have you been using my stuff?"],
        ['b', "What stuff?"],
        ['a', "My sun cream. It's nearly empty, and I've barely used it."],
        ['b', "I used a bit. Once. Is that a crime now?"],
        ['a', "It's not about the sun cream. It's that you didn't ask."],
      ] },
      { turns: [
        ['b', "I heard you were talking about me."],
        ['a', "Who told you that?"],
        ['b', "Does it matter? Were you?"],
        ['a', "I said I didn't get why you were acting the way you are. That's not talking about you, that's having an opinion."],
        ['b', "It's talking about me."],
      ] },
      { when: { taken: true }, turns: [
        ['b', "Can I be honest? You've changed since you've been with {pa}. You don't have time for anyone else anymore."],
        ['a', "That's not fair."],
        ['b', "It is fair. I used to see you all the time, and now it's just {pa}, {pa}, {pa}."],
        ['a', "I'm in a couple. That's the whole point of being here."],
      ] },
      { turns: [
        ['a', "Why do you always do that?"],
        ['b', "Do what?"],
        ['a', "Turn everything into a joke when I'm trying to talk to you about something serious."],
        ['b', "Because you take everything so seriously."],
        ['a', "Because some things are serious!"],
      ] },
    ],

    sour: [
      { turns: [
        ['b', "Whatever. I'm not doing this right now."],
        ['a', "Fine."],
      ], beat: "{b} walks off. {a} doesn't move, arms folded." },
      { turns: [
        ['a', "Let's just leave it."],
        ['b', "Yeah. Let's."],
      ], beat: "They sit in silence for a minute before {a} gets up and goes inside." },
      { turns: [
        ['b', "I'm going to go and cool off."],
        ['a', "Good idea."],
      ], beat: "Neither of them speaks to the other for the rest of the afternoon." },
      { turns: [
        ['a', "I don't want to fall out with you."],
        ['b', "Then don't start things."],
      ], beat: "{b} goes back to the daybeds. {a} watches {b.obj} go, annoyed." },
    ],
  },

  notes: [
    { stage: "{a} and {b} sunbathe and gossip by the pool." },
    { stage: "{a} and {b} make lunch together, laughing the whole time." },
    { stage: "{a} and {b} have a heart-to-heart on the swing seat." },
    { stage: "{a} and {b} spend the afternoon messing about in the pool." },
    { stage: "{a} and {b} do the washing-up together and put the world to rights." },
    { stage: "{a} and {b} work out together on the terrace." },
    { stage: "{a} cheers {b} up with a long chat on the daybeds." },
    { stage: "{a} and {b} share a sun lounger and a lot of jokes." },
    { when: { taken: true }, stage: "{a} fills {b} in on how it's going with {pa}." },
    { when: { bTaken: true }, stage: "{b} tells {a} all about how things are with {pb}." },
    { when: { phase: 'morning' }, stage: "{a} and {b} are the first ones up, chatting over tea." },
    { when: { phase: 'evening' }, stage: "{a} and {b} sit up talking by the fire pit long after everyone else goes in." },
    { when: GIRLS, stage: "{a} and {b} do each other's hair in the dressing room." },
    { when: BOYS, stage: "{a} and {b} have a catch-up on the terrace." },
    { when: { friction: true }, stage: "{a} and {b} have a small falling-out over nothing much. It lingers." },
    { when: { friction: true }, stage: "A little spat between {a} and {b} leaves things frosty for the afternoon." },
  ],
});
