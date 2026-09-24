// just-met-more — a second day-one pool (the rules of just-met.js apply:
// strangers of a few hours, no invented backstory, plain talk).
//
// User: "fix the night one friendship repeats". Night one plays 12-18
// friendships, up to 13 challenge kisses, 11 arguments and 17 pulls, and the
// day-one pools held 10, 6, 8 and 10 — once a pool was spent, the same line
// came back with a different pair (seeds 1-11, measured). Each pool here is
// sized past the most that kind plays on night one.
const J = { justMet: true };

export const JUST_MET_MORE = {
  friendship: [
    { id: 'jm.friend.11', when: J, turns: [['a', "Which bed did you get?"], ['b', "The one by the window. You?"], ['a', "Next to yours, I think."], ['b', "Good. I need someone to talk to at three in the morning."]] },
    { id: 'jm.friend.12', when: J, turns: [['a', "Is it just me, or is everyone really good-looking?"], ['b', "It's not just you. I've been trying not to stare all day."]] },
    { id: 'jm.friend.13', when: J, turns: [['a', "How are you finding it so far?"], ['b', "Loud. Everyone's so loud."], ['a', "I know. I've whispered all day and nobody's noticed."]] },
    { id: 'jm.friend.14', when: J, turns: [['a', "Can I sit with you? I don't know anyone."], ['b', "Nobody knows anyone. Sit down."]] },
    { id: 'jm.friend.15', when: J, turns: [['a', "Did you pack enough clothes?"], ['b', "I packed four suitcases."], ['a', "Four?"], ['b', "I panicked."]] },
    { id: 'jm.friend.16', when: J, turns: [['a', "I've forgotten half the names already."], ['b', "Just say 'babe' to everyone. It works."], ['a', "Does it?"], ['b', "It's worked all day."]] },
    { id: 'jm.friend.17', when: J, turns: [['a', "What are you looking for in here? Honestly."], ['b', "Someone who makes me laugh. You?"], ['a', "Same. And someone who doesn't take ages in the bathroom."]] },
    { id: 'jm.friend.18', when: J, stage: 'The dressing room, everyone getting ready at once.', turns: [['a', "Can I borrow your straighteners?"], ['b', "Only if I can borrow your perfume."], ['a', "Deal."]] },
    { id: 'jm.friend.19', when: J, turns: [['a', "Are you nervous about tonight?"], ['b', "Terrified. Are you?"], ['a', "Yes. But now I know you are too, I feel better."]] },
    { id: 'jm.friend.20', when: J, turns: [['a', "You seem really calm about all this."], ['b', "I'm not. I'm just good at looking calm."], ['a', "Teach me."]] },
    { id: 'jm.friend.21', when: J, turns: [['a', "Who's caught your eye so far?"], ['b', "I'm not saying yet. It's too early."], ['a', "Give me a clue."], ['b', "No."]], beat: 'They both laugh.' },
    { id: 'jm.friend.22', when: J, turns: [['a', "I think we're going to get on."], ['b', "I think so too. You laughed at my joke earlier. Nobody else did."]] },
    { id: 'jm.friend.23', when: J, turns: [['a', "Do you want a drink? I'm going to the kitchen."], ['b', "Please. Anything cold."], ['a', "I'll bring two."]] },
    { id: 'jm.friend.24', when: J, stage: 'On the sunbeds, both of them squinting.', turns: [['a', "I forgot sun cream."], ['b', "You can have some of mine."], ['a', "You're a lifesaver."], ['b', "I know."]] },
    { id: 'jm.friend.25', when: J, turns: [['a', "What was the car ride like for you?"], ['b', "I didn't speak the whole way. I just kept checking my teeth."], ['a', "Same. The whole way."]] },
    { id: 'jm.friend.26', when: J, turns: [['a', "If we both end up single, we're sticking together."], ['b', "Deal. But we won't end up single."], ['a', "No. Obviously not."]] },
    { id: 'jm.friend.27', when: J, turns: [['a', "I like your laugh. I could hear it from the pool."], ['b', "Everyone can hear it from the pool. It's a problem."]] },
    { id: 'jm.friend.28', when: J, turns: [['a', "Is it bad I miss my phone already?"], ['b', "I keep reaching for my pocket. There's nothing there."]] },
    { id: 'jm.friend.29', when: J, stage: 'In the kitchen, both waiting for the kettle.', turns: [['a', "Tea?"], ['b', "Please. Milk, no sugar."], ['a', "Same. We're going to be fine."]] },
    { id: 'jm.friend.30', when: J, turns: [['a', "I didn't expect to like everyone this much."], ['b', "Give it a week."], ['a', "Don't say that."]] },
    { id: 'jm.friend.31', when: J, turns: [['a', "Can I ask your advice about something?"], ['b', "I've known you for five hours."], ['a', "That's longer than I've known anyone else."], ['b', "Fair. Go on."]] },
    { id: 'jm.friend.32', when: J, turns: [['a', "Save me a seat at the fire pit?"], ['b', "Always. Well. Tonight, anyway."]] },
    { id: 'jm.friend.33', when: J, turns: [['a', "You were really kind to me when I walked in."], ['b', "You looked like you were going to faint."], ['a', "I was going to faint."]] },
    { id: 'jm.friend.34', when: J, turns: [['a', "What's the first thing you're going to eat when we get out?"], ['b', "We've been here one day."], ['a', "I'm planning ahead."]] },
  ],

  'challenge-kiss': [
    { id: 'jm.ckiss.07', when: J, turns: [['a', "I didn't think I'd be kissing anyone on the first day."], ['b', "The villa had other plans."]] },
    { id: 'jm.ckiss.08', when: J, turns: [['a', "Was that okay?"], ['b', "That was more than okay."]], beat: 'Somebody behind them whistles.' },
    { id: 'jm.ckiss.09', when: J, turns: [['a', "I'm so sorry, I had no idea where to put my hands."], ['b', "You found somewhere."]] },
    { id: 'jm.ckiss.10', when: J, turns: [['a', "Hi. I'm the one who just kissed you."], ['b', "I noticed."]] },
    { id: 'jm.ckiss.11', when: J, turns: [['a', "That's not how I usually say hello."], ['b', "It should be."]] },
    { id: 'jm.ckiss.12', when: J, turns: [['a', "Are you allowed to be that good at that?"], ['b', "Apparently."]], beat: 'The whole bench screams.' },
    { id: 'jm.ckiss.13', when: J, turns: [['a', "I'm going red. Am I going red?"], ['b', "Very."]] },
    { id: 'jm.ckiss.14', when: J, turns: [['a', "That was awkward."], ['b', "Very awkward."], ['a', "Do it again?"], ['b', "Not in front of everyone."]] },
    { id: 'jm.ckiss.15', when: { ...J, bTaken: true }, turns: [['a', "Your partner's watching."], ['b', "It's a challenge. It's allowed."]], beat: 'Nobody on the bench looks convinced.' },
    { id: 'jm.ckiss.16', when: J, turns: [['a', "I've got lip gloss all over you."], ['b', "I'll wear it with pride."]] },
    { id: 'jm.ckiss.17', when: J, turns: [['a', "Don't read into it."], ['b', "I'm already reading into it."]] },
    { id: 'jm.ckiss.18', when: J, turns: [['a', "We haven't even had a real conversation yet."], ['b', "We can do that later."]], beat: 'They both go back to their places grinning.' },
    { id: 'jm.ckiss.19', when: J, turns: [['a', "That was a lot."], ['b', "In a good way?"], ['a', "In a good way."]] },
    { id: 'jm.ckiss.20', when: J, turns: [['a', "Sorry! Sorry. The rules."], ['b', "Stop apologising."]] },
  ],

  pull: [
    { id: 'jm.pull.11', when: J, turns: [['a', "Have you got five minutes?"], ['b', "For you? Maybe three."], ['a', "I'll talk fast."]] },
    { id: 'jm.pull.12', when: J, turns: [['a', "I wanted to talk to you before tonight."], ['b', "Why before tonight?"], ['a', "Just in case."]] },
    { id: 'jm.pull.13', when: J, turns: [['a', "Can I steal you for a minute?"], ['b', "Steal is a strong word on day one."], ['a', "Borrow, then."]] },
    { id: 'jm.pull.14', when: J, stage: '{a} waits until {b} is on {b.posAdj} own by the pool.', turns: [['a', "Is this seat taken?"], ['b', "It's a sunbed. There's loads of room."], ['a', "Then I'll take it."]] },
    { id: 'jm.pull.15', when: J, turns: [['a', "I feel like we haven't really spoken yet."], ['b', "We said hello."], ['a', "That's not speaking. That's hello."]] },
    { id: 'jm.pull.16', when: J, turns: [['a', "What's your type? Honestly."], ['b', "Why do you want to know?"], ['a', "Research."]] },
    { id: 'jm.pull.17', when: J, turns: [['a', "You walked in and I thought, I need to talk to them."], ['b', "And now you are."], ['a', "And now I am. I've forgotten what I was going to say."]] },
    { id: 'jm.pull.18', when: J, turns: [['a', "Do you want to get a drink with me? Just us."], ['b', "It's a villa. It's always going to be nearly just us."], ['a', "Nearly just us, then."]] },
  ],

  comedy: [
    { id: 'jm.comedy.09', when: J, stage: '{a} tries to do a dramatic entrance to the pool and misses the step.', turns: [['a', "I meant to do that."]] },
    { id: 'jm.comedy.10', when: J, stage: '{a} puts sun cream on everywhere except the middle of {a.posAdj} back.', turns: [['a', "Can someone… no? Okay. I'll just be patchy."]] },
    { id: 'jm.comedy.11', when: J, stage: '{a} opens the wrong wardrobe and starts putting clothes in it.', turns: [['a', "Whose shoes are these? Oh. These are my shoes. This is my wardrobe."]] },
    { id: 'jm.comedy.12', when: J, stage: '{a} tries to make everyone a cocktail and gets the blender lid wrong.', turns: [['a', "It's fine! It's fine. Who wants a smoothie on their face?"]] },
    { id: 'jm.comedy.13', when: J, stage: '{a} practises {a.posAdj} walk for the fire pit up and down the lawn.', turns: [['a', "Too much? Not enough? Everyone's staring. Too much."]] },
    { id: 'jm.comedy.14', when: J, stage: '{a} spends a long time trying to work out which tap is hot.', turns: [['a', "Neither of them is hot. Why is neither of them hot?"]] },
  ],
};
