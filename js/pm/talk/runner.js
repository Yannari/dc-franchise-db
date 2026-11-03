// ══════════════════════════════════════════════════════════════════════
// pm/talk/runner.js — the episode's light story (pm/runner.js), beat by beat
// ══════════════════════════════════════════════════════════════════════
//
// villa-bit  [a, b, c?]   `bit`: bet · prank · show · cook · snore · sunbed · lost · match
//                         `step`: setup (morning) · escalate (the day) · payoff (evening)
//                         `topic`: which bet, which prank, what was lost (chosen at the setup)
//                         `out`: how it ended (the payoff only; pm/runner.js BITS.ends)
//   a leads it; b is with a; c is the other side of it (the prank's target, the
//   one working out, the snorer, the sunbed rival, the opponent).
//
// The laugh is the situation, said plainly (feedback-pm-plain-feelings): what
// they're doing, and what they say about it, one line answering the last. No
// punchline on the end, no clever lines. Nothing here invents a past: the bit is
// the event, and a beat only knows the beats before it.
import { build } from './build.js';

const M = { phase: 'morning' }, D = { phase: 'day' }, E = { phase: 'evening' };
// A prank on a bed is found at bedtime: its payoff plays in the night's own slot (Lights out).
const N = { phase: 'night' };
const at = (bit, step, more = {}) => ({ bit, step, ...more });

const WHOLE = [
  // ── the bet ─────────────────────────────────────────────────────────
  { when: { ...at('bet', 'setup', { topic: 'heat' }), ...M }, stage: "The kitchen. {b} is standing in front of the open fridge with {b.posAdj} eyes shut.", turns: [
    ['b', "I'm melting. I'm actually melting."],
    ['a', "You say that every morning. Every single one."],
    ['b', "Because it's true every single one."],
    ['a', "Right. Bet. First one of us to complain about the heat today loses."],
    ['b', "Loses what?"],
    ['a', "Loser does everybody's washing up after dinner. All of it. Every plate."],
    ['b', "Everybody's? Do you know how many of us there are?"],
    ['a', "That's what makes it a good bet."],
    ['b', "Fine. Deal. I'm not even hot. I feel lovely."],
  ], beat: "{b} shuts the fridge, very slowly, and does not look lovely." },
  { when: { ...at('bet', 'setup', { topic: 'babe' }), ...M }, stage: "The kitchen, first thing. {b} has called three different people 'babe' before the kettle has boiled.", turns: [
    ['a', "That's three. That's three babes, and the kettle isn't even on yet."],
    ['b', "I say it to everyone. It's friendly."],
    ['a', "I bet you can't go a whole day without saying it."],
    ['b', "I bet you can't either."],
    ['a', "Easy. I don't say it."],
    ['b', "Everyone in here says it. You'll crack before lunch."],
    ['a', "Loser does a forfeit at dinner. The winner picks it."],
    ['b', "Shake on it."],
  ], beat: "They shake on it. {b} opens {b.posAdj} mouth to say something to {a}, and shuts it again." },
  { when: { ...at('bet', 'escalate', { topic: 'heat' }), ...D }, stage: "The daybeds, in the full sun. {a} and {b} are lying side by side, perfectly still.", turns: [
    ['a', "Lovely day, isn't it?"],
    ['b', "Gorgeous. Not too warm. Just right."],
    ['a', "You've moved your sunbed into the shade three times."],
    ['b', "I like the shade. That's not complaining. That's a choice."],
    ['a', "Your face is bright red."],
    ['b', "That's just what my face does. I'm having a great time."],
    ['a', "Me too. I could lie here for hours."],
    ['b', "Then do it. Lie there for hours."],
  ], beat: "Neither of them moves. Somebody walks past with a jug of iced water, and they both watch it go." },
  { when: { ...at('bet', 'escalate', { topic: 'babe' }), ...D }, stage: "By the pool. {a} is trying everything to get {b} to say it.", turns: [
    ['a', "Can you pass me that towel, my love?"],
    ['b', "Here you go, darling."],
    ['a', "Darling. Wow. You're really working for it."],
    ['b', "I've got a whole list. Darling, sweetheart, petal, gorgeous. I don't need the other one."],
    ['a', "You do, though. You keep stopping halfway through sentences."],
    ['b', "I'm thinking. People stop to think."],
    ['a', "You've never stopped to think in your life."],
    ['b', "Today I have. Thank you, sweetheart."],
  ], beat: "{b} smiles through gritted teeth, and goes for a swim to stop talking." },
  { when: { ...at('bet', 'payoff', { topic: 'heat', out: 'b-lost' }), ...E }, stage: "Dinner. {b} sits down at the table and fans {b.ref} with a napkin.", turns: [
    ['b', "It is so hot tonight. Oh, no."],
    ['a', "Say that again."],
    ['b', "I didn't say anything."],
    ['a', "You said it's so hot tonight. Out loud. At the table."],
    ['b', "It was a fact. It wasn't a complaint."],
    ['a', "It was a complaint, and you know it was. Plates, please."],
  ], beat: "The table cheers. After dinner {b} is at the sink with a mountain of plates, and {a} stands beside {b.obj} with a tea towel, drying every one." },
  { when: { ...at('bet', 'payoff', { topic: 'heat', out: 'a-lost' }), ...E }, stage: "Dinner. {a} gets up to fetch the drinks and comes back looking wrecked.", turns: [
    ['a', "I can't do this. It's too hot. I'm done. I said it. I'm done."],
    ['b', "Did everybody hear that?"],
    ['a', "I lasted all day. All day, in that sun. That's got to count for something."],
    ['b', "It counts for nothing. You lost. The sink is that way."],
    ['a', "Will you at least keep me company?"],
    ['b', "I'll sit right here and watch."],
  ], beat: "{a} washes up for the whole villa. {b} keeps {b.posAdj} word and sits on the counter the entire time, keeping {a.obj} company." },
  { when: { ...at('bet', 'payoff', { topic: 'babe', out: 'b-lost' }), ...E }, stage: "Dinner. {b} passes the salt down the table without thinking.", turns: [
    ['b', "There you go, babe."],
    ['a', "Oh, there it is."],
    ['b', "No. No, that doesn't count. I was being polite."],
    ['a', "You lasted all day and you lost it on the salt. Forfeit. You're singing. To everyone. Now."],
    ['b', "What am I meant to sing?"],
    ['a', "Anything. Stand on the chair."],
  ], beat: "{b} stands on the chair and sings to the whole table, badly, with {b.posAdj} eyes shut. They make {b.obj} do a second verse." },
  { when: { ...at('bet', 'payoff', { topic: 'babe', out: 'a-lost' }), ...E }, stage: "Dinner. {a} turns to {b} to ask for the water jug.", turns: [
    ['a', "Babe, can you pass the— oh, no."],
    ['b', "Say it again. Slowly."],
    ['a', "I've been so careful. All day. I didn't say it once."],
    ['b', "You said it to me. Of everybody, you said it to me. My forfeit, then. You're doing a dance. On your own. In the middle of the garden."],
    ['a', "With music?"],
    ['b', "No music. You've got to hum."],
  ], beat: "{a} dances on the lawn, humming. Half the villa joins in by the end, which ruins the forfeit and nobody minds." },

  // ── the prank ───────────────────────────────────────────────────────
  { when: { ...at('prank', 'setup', { topic: 'shoes' }), ...M }, stage: "The dressing room. {a} and {b} have their heads together, whispering.", turns: [
    ['a', "Every single pair. {c} has about fifteen pairs of shoes, and we hide every single one."],
    ['b', "Where, though? It's not a big villa."],
    ['a', "That's the fun part. One pair in the fridge. One in the gym. One in the pool, in a bag, so they stay dry."],
    ['b', "{c} is going to go mad."],
    ['a', "{c} is going to go barefoot. That's all. Nobody gets hurt."],
    ['b', "Okay. I'm in. When?"],
    ['a', "When {c} goes to sunbathe. Act normal."],
  ], beat: "{c} walks in. They both stop talking at once, which is the least normal thing they could have done." },
  { when: { ...at('prank', 'setup', { topic: 'bed' }), ...M }, stage: "The bedroom, while everybody else is at breakfast. {a} pulls the covers back on {c}'s bed.", turns: [
    ['b', "What are you doing?"],
    ['a', "Fold the bottom sheet in half. Like this. So when {c} gets in tonight, the legs only go halfway down."],
    ['b', "That's so childish."],
    ['a', "Yes. Do you want to help or not?"],
    ['b', "Obviously I want to help."],
    ['a', "Tuck it in tight, so it looks normal."],
    ['b', "My hands are shaking. Why are my hands shaking? It's a bed."],
  ], beat: "They make the bed so perfectly that it's the neatest bed in the room, which might give it away." },
  { when: { ...at('prank', 'escalate', { topic: 'shoes' }), ...D }, stage: "{c} comes in from the sunbeds and stops in front of an empty shoe rack.", turns: [
    ['c', "Has anybody seen my shoes? Any of my shoes?"],
    ['a', "What do they look like?"],
    ['c', "They look like shoes. There were loads of them. They were right here."],
    ['b', "Maybe you left them by the pool?"],
    ['c', "All of them? I didn't take fifteen pairs of shoes to the pool."],
    ['a', "That would be a lot of shoes for the pool."],
  ], beat: "{c} goes off barefoot to look. {b} has to turn and face the wall to stop {b.ref} laughing." },
  { when: { ...at('prank', 'escalate', { topic: 'bed' }), ...D }, stage: "The bedroom. {c} sits down on the bed to take {c.posAdj} watch off, and {a} and {b} both go very still.", turns: [
    ['c', "Why are you two looking at me like that?"],
    ['a', "Like what?"],
    ['c', "Like that. Like you're waiting for something."],
    ['b', "We're not waiting for anything. We're just sitting here."],
    ['c', "You're sitting on the floor. You never sit on the floor."],
    ['a', "It's comfy. Try it."],
  ], beat: "{c} gets up without lying down. The sheet stays folded. Tonight's still on." },
  { when: { ...at('prank', 'payoff', { topic: 'shoes', out: 'landed-laugh' }), ...E }, stage: "The kitchen, before dinner. {c} opens the fridge for a drink, and there's a pair of shoes on the middle shelf.", turns: [
    ['c', "Why are my shoes in the fridge?"],
    ['a', "Cold shoes. Very good for the feet."],
    ['c', "Where's the rest of them?"],
    ['b', "One pair's in the gym. Two pairs are in the pool, in a bag. The others are around."],
    ['c', "You hid every single pair of shoes I own."],
    ['a', "And you walked round all afternoon in bare feet, asking people if they'd seen them."],
    ['c', "I asked everybody. I asked you!"],
  ], beat: "{c} is laughing too hard to be angry. All three of them spend the rest of the evening fishing shoes out of the villa." },
  { when: { ...at('prank', 'payoff', { topic: 'shoes', out: 'landed-even' }), ...E }, stage: "Dinner. {c} has found every pair of shoes, and is wearing one of {a}'s tops.", turns: [
    ['a', "Is that my top?"],
    ['c', "Is it? I couldn't find my shoes all day, so I thought I'd borrow a few things."],
    ['a', "What do you mean, a few things?"],
    ['c', "Go and have a look in your drawers."],
    ['b', "Oh, no."],
    ['c', "Your drawers are in the pool, {b}. Both of yours."],
  ], beat: "{a} and {b} run for the pool. {c} finishes dinner in peace, in {a}'s top." },
  { when: { ...at('prank', 'payoff', { topic: 'shoes', out: 'caught-laugh' }), ...E }, stage: "The gym, before dinner. {c} walks in on {a} and {b} wedging a pair of shoes behind the weights.", turns: [
    ['c', "Caught you."],
    ['a', "This isn't what it looks like."],
    ['c', "It looks like you're hiding my shoes behind the weights."],
    ['b', "Then it's exactly what it looks like."],
    ['c', "I've been walking around barefoot all day."],
    ['a', "We know. We watched."],
  ], beat: "{c} makes them carry every pair back to the dressing room, one at a time, and inspects each one." },
  { when: { ...at('prank', 'payoff', { topic: 'shoes', out: 'caught-even' }), ...E }, stage: "The dressing room. {c} is waiting when {a} and {b} come in, with a bucket of pool water at {c.posAdj} feet.", turns: [
    ['c', "I found my shoes. All of them. One pair was in the fridge."],
    ['a', "Right. Okay. We can explain."],
    ['c', "You don't need to explain. I just want to know which of you thought of the fridge."],
    ['b', "That was {a}."],
    ['a', "Thanks, {b}."],
    ['c', "Thanks, {b}."],
  ], beat: "{a} gets the bucket. {b} gets the rest of it. {c} goes to dinner happy." },
  { when: { ...at('prank', 'payoff', { topic: 'bed', out: 'landed-laugh' }), ...N }, stage: "Lights out. {c} climbs into bed, and {c.posAdj} feet stop halfway down.", turns: [
    ['c', "What's wrong with my bed?"],
    ['a', "Nothing. Go to sleep."],
    ['c', "I can't get my legs in. My bed's broken."],
    ['b', "Have you tried pushing harder?"],
    ['c', "I'm pushing! It's folded! Somebody's folded my bed!"],
  ], beat: "The whole bedroom is laughing in the dark. {c} has to get out and make the whole bed again by the light from the bathroom." },
  { when: { ...at('prank', 'payoff', { topic: 'bed', out: 'landed-even' }), ...N }, stage: "Lights out. {c} gets into bed, stops, and then gets back out without a word.", turns: [
    ['a', "Everything all right over there?"],
    ['c', "Lovely. I'm just going to sleep in your bed instead."],
    ['a', "What? Where am I going to sleep?"],
    ['c', "In mine. It's all made. It's very neat."],
    ['b', "{c}, that's not fair."],
    ['c', "You can share it with {a}, {b}. It'll fit two. Halfway."],
  ], beat: "{a} and {b} spend the night with their knees up, in {c}'s folded bed, as nobody else in the room stops laughing." },
  { when: { ...at('prank', 'payoff', { topic: 'bed', out: 'caught-laugh' }), ...N }, stage: "The bedroom, before lights out. {c} pulls back the covers and looks at the sheet.", turns: [
    ['c', "Who did this?"],
    ['a', "Did what?"],
    ['c', "Somebody's folded my sheet in half. I've seen this before. I used to do this at sleepovers."],
    ['b', "Then you know it's funny."],
    ['c', "It's very funny. Now help me fix it."],
  ], beat: "{a} and {b} remake the bed under supervision, and {c} tucks the corners in to check." },
  { when: { ...at('prank', 'payoff', { topic: 'bed', out: 'caught-even' }), ...N }, stage: "Lights out. {a} gets into bed, and {a.posAdj} feet stop halfway down.", turns: [
    ['a', "No. No, no, no."],
    ['c', "Is something wrong with your bed, {a}?"],
    ['a', "You found it. You found yours, and you did mine."],
    ['c', "I did yours and {b}'s. While you were at dinner."],
    ['b', "Mine too? Oh, come on."],
  ], beat: "Two islanders climb out of bed in the dark to remake them. {c} is already asleep, or pretending to be." },

  // ── the show ────────────────────────────────────────────────────────
  { when: { ...at('show', 'setup'), ...M }, stage: "The daybeds. {a} and {b} have dragged them round so they face the gym.", turns: [
    ['b', "Why have we moved the daybeds?"],
    ['a', "Because {c} is about to start working out, and this is the best seat in the villa."],
    ['b', "We can't just sit here and watch."],
    ['a', "We're not watching. We're sunbathing in this direction."],
    ['b', "That's watching."],
    ['a', "Do you want to move, then?"],
    ['b', "No. I'm good here."],
  ], beat: "{c} comes out with a skipping rope. {a} and {b} both put their sunglasses on at exactly the same time." },
  { when: { ...at('show', 'escalate'), ...D }, stage: "The gym. {c} is doing press-ups, and keeps glancing at the daybeds.", turns: [
    ['c', "Are you two watching me?"],
    ['a', "No."],
    ['b', "Yes."],
    ['a', "{b}!"],
    ['b', "It's obvious. We've moved the daybeds."],
    ['c', "Do you want me to do it slower, so you can see properly?"],
    ['a', "No. Just do it normally. Pretend we're not here."],
  ], beat: "{c} carries on, a lot more slowly than before, and doesn't stop smiling." },
  { when: { ...at('show', 'payoff', { out: 'shown-up' }), ...E }, stage: "The lawn, before dinner. {c} has set up a workout for three, and is standing over {a} and {b}.", turns: [
    ['c', "You've watched me all day. Your turn. Ten press-ups each."],
    ['a', "Can we not just clap for you instead?"],
    ['c', "Ten. Go."],
    ['b', "I've done two. Does two count?"],
    ['c', "Two is two. Keep going."],
    ['a', "I can't feel my arms."],
    ['c', "You did four. Four's a start."],
  ], beat: "{a} and {b} lie flat on the lawn. {c} does the other twenty-four for them, and the daybeds get moved back." },
  { when: { ...at('show', 'payoff', { out: 'all-in' }), ...E }, stage: "The lawn, before dinner. {c} has talked {a} and {b} into a workout, and half the villa has come to watch.", turns: [
    ['c', "If you're going to watch me, you're going to join in."],
    ['a', "Fine. But you're doing it with us, and you're not allowed to be good at it."],
    ['c', "I'll try to be bad at it."],
    ['b', "You're doing it on purpose. Your jumps are tiny."],
    ['c', "I said I'd try to be bad at it."],
  ], beat: "By the end there are eight of them doing star jumps on the lawn, and nobody can remember whose idea it was." },

  // ── the dinner ──────────────────────────────────────────────────────
  { when: { ...at('cook', 'setup'), ...M }, stage: "The kitchen. {a} is reading the back of every packet in the cupboard.", turns: [
    ['a', "I'm cooking tonight. For everyone."],
    ['b', "For everyone? Have you ever cooked for this many people?"],
    ['a', "I've cooked for me loads of times. It's the same, just more."],
    ['b', "It's not the same. It's a lot more."],
    ['a', "Will you help?"],
    ['b', "I'll chop. I'm not touching the oven."],
    ['a', "Deal. Pasta. Everyone likes pasta."],
  ], beat: "{a} writes a menu on the whiteboard in the kitchen. It just says PASTA, underlined twice." },
  { when: { ...at('cook', 'setup'), ...M }, stage: "Breakfast. {a} announces it to the whole kitchen.", turns: [
    ['a', "Nobody make dinner tonight. I've got it."],
    ['b', "What are you making?"],
    ['a', "A curry. A big one. Rice, everything."],
    ['b', "Do you know how to make a curry?"],
    ['a', "Roughly."],
    ['b', "Roughly. Right. I'm helping, then, so somebody in that kitchen knows what's going on."],
  ], beat: "{b} goes to check how much rice there is. There isn't much." },
  { when: { ...at('cook', 'escalate'), ...D }, stage: "The kitchen. Something on the hob is smoking, and {a} is waving a tea towel at it.", turns: [
    ['b', "Is it meant to be doing that?"],
    ['a', "Yes. That's the flavour."],
    ['b', "The flavour is smoke?"],
    ['a', "Turn it down. Turn it down!"],
    ['b', "I'm not touching the hob. I said I'm chopping."],
    ['a', "Then chop faster, so I can put something on top of it."],
  ], beat: "They save it, mostly. The kitchen smells of it for an hour." },
  { when: { ...at('cook', 'escalate'), ...D }, stage: "The kitchen. {a} and {b} are staring into a pan of something very thick.", turns: [
    ['a', "Why is it so thick?"],
    ['b', "How much did you put in?"],
    ['a', "All of it. The packet said a handful, and I've got big hands."],
    ['b', "Add water."],
    ['a', "How much water?"],
    ['b', "I don't know. A handful."],
  ], beat: "They add water a cup at a time and taste it after every one, until they can't tell any more." },
  { when: { ...at('cook', 'payoff', { out: 'saved' }), ...E }, stage: "Dinner. Everyone's plate is clean, and {a} is trying very hard not to look pleased.", turns: [
    ['b', "Say it. Go on. Everyone's thinking it."],
    ['a', "I'm not going to say it."],
    ['b', "It was good. It was actually good."],
    ['a', "It was good, wasn't it? After all that."],
    ['b', "After the smoke, and the water, and you shouting at the hob."],
    ['a', "I didn't shout at the hob. I spoke firmly to the hob."],
  ], beat: "Somebody at the end of the table asks if there's any more. There is, just about, and {a} serves it like a waiter." },
  { when: { ...at('cook', 'payoff', { out: 'disaster' }), ...E }, stage: "Dinner. Nobody is eating. Everybody is pushing it round the plate.", turns: [
    ['a', "It's bad, isn't it?"],
    ['b', "It's not bad."],
    ['a', "Be honest."],
    ['b', "It's very bad. But we tried."],
    ['a', "Everyone's being so nice about it, and it's making it worse."],
    ['b', "There's cereal. Lots of cereal. I checked."],
  ], beat: "The whole villa has cereal for dinner by the fire pit, and {a} gets a round of applause anyway, for trying." },

  // ── the snoring ─────────────────────────────────────────────────────
  { when: { ...at('snore', 'setup'), ...M }, stage: "The kitchen, first thing. {a} has dark rings under {a.posAdj} eyes and is holding a coffee with both hands.", turns: [
    ['b', "You look terrible."],
    ['a', "I haven't slept. Somebody in that room snores like a motorbike."],
    ['b', "Who?"],
    ['a', "I don't know. It was dark. It came from {c}'s side of the room."],
    ['b', "{c}? {c} never makes a sound."],
    ['a', "Somebody does. Every night. I'm going to find out who."],
  ], beat: "{c} walks in, stretches, and says it was the best night's sleep {c.he} has had in ages." },
  { when: { ...at('snore', 'escalate'), ...D }, stage: "The daybeds. {c} has fallen asleep in the sun, and {a} and {b} are standing over {c.obj}, listening.", turns: [
    ['a', "Wait for it."],
    ['b', "I can't hear anything."],
    ['a', "Wait."],
    ['b', "Oh. Oh, there it is."],
    ['a', "Motorbike. I told you. Motorbike."],
    ['b', "That's louder than a motorbike."],
  ], beat: "{c} snores again, louder. A couple sunbathing nearby pick up their towels and move." },
  { when: { ...at('snore', 'payoff', { out: 'owns-it' }), ...E }, stage: "The fire pit, before bed. {a} tells {c} what {a.he} heard on the daybeds.", turns: [
    ['c', "I snore? Really?"],
    ['a', "Really loud. {b} heard it too."],
    ['b', "I was standing right next to you. It was really, really loud."],
    ['c', "Nobody's ever told me. I'm so sorry. Have I been keeping everyone up?"],
    ['a', "Only me. My bed's next to yours."],
    ['c', "Then swap with me. Tonight. I'll go by the window, and you can sleep."],
  ], beat: "They swap beds. {a} sleeps the whole night through, and so does everyone except the one by the window." },
  { when: { ...at('snore', 'payoff', { out: 'denies' }), ...E }, stage: "The fire pit, before bed. {a} brings it up in front of everyone.", turns: [
    ['a', "{c}, you snore. Really loud."],
    ['c', "I don't snore. I've never snored in my life."],
    ['b', "We stood over you on the daybeds and listened to it."],
    ['c', "That was breathing. That's what breathing sounds like."],
    ['a', "That's not what breathing sounds like. I haven't slept in two nights."],
    ['c', "Then get earplugs. Because I don't snore."],
  ], beat: "That night, the whole bedroom lies awake in the dark, waiting. It starts eleven minutes after lights out, and somebody says 'there it is'." },

  // ── the sunbed ──────────────────────────────────────────────────────
  { when: { ...at('sunbed', 'setup'), ...M }, stage: "The pool, very early. {a} comes out with a towel to put on the best sunbed, and {c}'s towel is already on it.", turns: [
    ['a', "Whose towel is this?"],
    ['c', "Mine. I put it there before anyone was up."],
    ['a', "That's my sunbed. The one in the corner, with the shade at the end."],
    ['c', "It hasn't got your name on it."],
    ['a', "It's got everything except my name on it. Everyone knows that's mine."],
    ['c', "Then get up earlier tomorrow."],
  ], beat: "{a} goes back inside with {a.posAdj} towel and finds {b} to tell. {b} is going to hear about this for hours." },
  { when: { ...at('sunbed', 'escalate'), ...D }, stage: "The kitchen. {a} is explaining a plan to {b} with salt and pepper pots.", turns: [
    ['a', "This is the pool. This is the sunbed. Tomorrow you get up when it's still dark, and you put your towel on it, and then I come out and swap it for mine."],
    ['b', "Why can't you just get up early yourself?"],
    ['a', "Because {c} will be watching for me. {c} won't be watching for you."],
    ['b', "This is a lot of effort for a sunbed."],
    ['a', "It's not about the sunbed now."],
    ['b', "What's it about?"],
    ['a', "I don't know. But it's not about the sunbed."],
  ], beat: "{c}, across the kitchen, has heard every word of it and says nothing." },
  { when: { ...at('sunbed', 'payoff', { out: 'a-won' }), ...E }, stage: "The terrace, before bed. {c} sits down next to {a}.", turns: [
    ['c', "Fine. You can have it tomorrow."],
    ['a', "Really? Why?"],
    ['c', "Because {b} has told me the whole plan, and it's too much work to watch for you both."],
    ['a', "{b} told you?"],
    ['c', "{b} told me at lunch. Have the sunbed. I'm going to have a lie-in."],
  ], beat: "{a} wins the sunbed and loses a bit of faith in {b}. All three of them laugh about it at the fire pit." },
  { when: { ...at('sunbed', 'payoff', { out: 'c-won' }), ...E }, stage: "The terrace, before bed. {a} and {b} are setting two alarms each.", turns: [
    ['b', "Do you know what time this is? This is the middle of the night."],
    ['a', "That's the point. {c} can't beat the middle of the night."],
    ['c', "I can, actually. I'm sleeping on it."],
    ['a', "What?"],
    ['c', "I'm sleeping on the sunbed tonight. With a blanket. Goodnight."],
  ], beat: "{c} sleeps under the stars on the best sunbed in the villa. {a} watches from the terrace and admits, out loud, that it's well played." },
  { when: { ...at('sunbed', 'payoff', { out: 'share' }), ...E }, stage: "The fire pit. {a} and {c} have been arguing about the sunbed for so long that people are taking sides.", turns: [
    ['b', "Can I say something? It's a sunbed. It's big. Share it."],
    ['a', "Share it?"],
    ['c', "Half each? Mornings and afternoons?"],
    ['a', "I want mornings."],
    ['c', "I want mornings."],
    ['b', "Oh, my God."],
  ], beat: "They settle on swapping every other day. It takes forty minutes, and {b} has to write it down." },

  // ── the lost thing ──────────────────────────────────────────────────
  { when: { ...at('lost', 'setup'), ...M }, stage: "The bedroom. {a} is on {a.posAdj} hands and knees, looking under every bed.", turns: [
    ['b', "What have you lost?"],
    ['a', "My bracelet. The plain silver one. I never take it off, and I took it off to swim, and now it's gone."],
    ['b', "When did you last have it?"],
    ['a', "If I knew that, I'd know where it was."],
    ['b', "Okay. Breathe. We'll find it. It's a villa. It can't have gone far."],
    ['a', "It's my lucky one. I don't feel right without it."],
  ], beat: "{b} gets down on the floor and starts looking under the beds too." },
  { when: { ...at('lost', 'escalate'), ...D }, stage: "The garden. It's a full search now. People are checking under cushions and inside plant pots.", turns: [
    ['a', "It's not in the pool. {b} checked the pool."],
    ['b', "I checked the whole pool. With my eyes open. Underwater."],
    ['a', "Thank you. Your eyes are bright red."],
    ['b', "I know. It's for a good cause."],
    ['c', "What does it look like?"],
    ['a', "Silver. Plain. About this big."],
  ], beat: "{c} goes quiet for a second, and looks down at {c.posAdj} own wrist, and then goes back to searching." },
  { when: { ...at('lost', 'payoff', { out: 'c-had-it' }), ...E }, stage: "Dinner. {c} reaches for the water jug, and a plain silver bracelet slides down {c.posAdj} wrist.", turns: [
    ['a', "That's my bracelet."],
    ['c', "What? No, this is— oh. Is this yours?"],
    ['a', "That's my bracelet. You've had it on all day."],
    ['c', "I found it by the pool this morning and I put it on so I wouldn't lose it. And then I forgot it was there."],
    ['b', "I was underwater with my eyes open."],
    ['c', "I'm so sorry. Here."],
  ], beat: "{a} puts it back on and holds onto it for the rest of dinner. {b} still can't see properly." },
  { when: { ...at('lost', 'payoff', { out: 'b-found-it' }), ...E }, stage: "The dressing room, before dinner. {b} comes in holding something up.", turns: [
    ['b', "Found it."],
    ['a', "No way. Where?"],
    ['b', "In the pocket of your shorts. The ones you swam in. Hanging up, in here."],
    ['a', "I checked those shorts."],
    ['b', "You checked one pocket. There are two pockets."],
    ['a', "Come here."],
  ], beat: "{a} hugs {b} for a long time. {c} says the villa should have checked {a}'s pockets first, and everybody agrees." },

  // ── the match ───────────────────────────────────────────────────────
  { when: { ...at('match', 'setup'), ...M }, stage: "The table by the pool. {a} picks up a bat and points it at {c}.", turns: [
    ['a', "You. Me. Table tennis. Tonight, before dinner."],
    ['c', "Why tonight?"],
    ['a', "So you've got the whole day to get nervous."],
    ['c', "I'm not going to get nervous."],
    ['b', "I'm doing the commentary."],
    ['a', "Nobody asked for commentary."],
    ['b', "I'm doing it anyway."],
  ], beat: "{c} picks up the other bat, looks at it, and starts practising against the wall when {c.he} thinks nobody is watching." },
  { when: { ...at('match', 'escalate'), ...D }, stage: "The lawn. {a} is warming up, very seriously, while {b} talks into a hairbrush.", turns: [
    ['b', "And here's the challenger, warming up for the biggest match of the year."],
    ['a', "Stop it."],
    ['b', "The challenger asks me to stop. The challenger is nervous."],
    ['a', "I'm not nervous. I'm stretching."],
    ['c', "Is that what that is?"],
    ['b', "And the other one has arrived. The tension is unbelievable."],
  ], beat: "Three people come over to watch them stretch. That's how bored the villa is, and how much it's looking forward to this." },
  { when: { ...at('match', 'payoff', { out: 'a-won' }), ...E }, stage: "The table by the pool. The whole villa is watching. Last point.", turns: [
    ['b', "Match point. You could hear a pin drop."],
    ['c', "You couldn't, because you won't stop talking."],
    ['b', "And it's in! It's over! {a} has done it!"],
    ['a', "Yes! Yes! I told you! I told you this morning!"],
    ['c', "Best of three."],
    ['a', "It was best of three."],
    ['c', "Best of five, then."],
  ], beat: "{c} shakes {a}'s hand, then refuses to let go of it until {a} agrees to a rematch tomorrow." },
  { when: { ...at('match', 'payoff', { out: 'c-won' }), ...E }, stage: "The table by the pool. The whole villa is watching. Last point.", turns: [
    ['b', "Match point. The challenger needs a miracle."],
    ['a', "I don't need a miracle. I need you to be quiet."],
    ['b', "And it's out! It's over! {c} wins it!"],
    ['a', "I challenged you. I said tonight. I gave you all day to get nervous."],
    ['c', "You did. I used it to practise."],
    ['a', "Against the wall. I saw you, and I didn't think anything of it."],
  ], beat: "{a} takes it well, for about a minute, and then asks for a rematch tomorrow." },
];

export const VILLA_BIT = build('villa-bit', {
  tiered: false,
  plans: { featured: ['whole'], short: ['whole'] },
  moves: {
    whole: WHOLE,
  },
});
