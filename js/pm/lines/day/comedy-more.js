// comedy-more — more comedy (see comedy.js): [a, b], {a} is being funny, {b}
// answers. A season plays about 120 comedy scenes (the joker's cap is per
// joker, not per scene); with 60 in the pool the same jar was opened six times
// in one season (user: "add text variants too, avoid repetitions always").
// The joke is the situation, said plainly.
export const COMEDY_MORE = [
  { id: 'cm2.01', stage: '{a} is trying to fold a fitted sheet.', turns: [
    ['a', "This is impossible. This is actually impossible."], ['b', "Give me a corner."], ['a', "Which one is a corner? They're all corners."], ['b', "Just hold that bit."]],
    beat: 'They end up with a ball of sheet and both give up.' },
  { id: 'cm2.02', stage: '{a} is doing a workout next to {b}, mostly lying down.', turns: [
    ['b', "Is this the rest between sets?"], ['a', "This is the set."], ['b', "You're lying on the floor."], ['a', "It's a floor exercise."]] },
  { id: 'cm2.03', stage: '{a} has written everyone\'s names on the mugs, spelled wrong.', turns: [
    ['b', "There's no Y in my name."], ['a', "There is now."], ['b', "You've given me two."], ['a', "You're worth two."]] },
  { id: 'cm2.04', stage: '{a} has been trying to get a tan on one leg only.', turns: [
    ['b', "Why is only one leg out?"], ['a', "I'm doing them one at a time."], ['b', "That's not how the sun works."], ['a', "It's how my sun works."]] },
  { id: 'cm2.05', when: { phase: 'morning' }, stage: '{a} is narrating {b} making breakfast like a nature programme.', turns: [
    ['a', "And here we see the islander, reaching for the last of the bread."], ['b', "Stop it."],
    ['a', "Startled, it freezes."], ['b', "I'm going to throw this toast at you."]], beat: 'The whole kitchen is in bits.' },
  { id: 'cm2.06', stage: '{a} tries to catch a grape in {a.posAdj} mouth and misses every time.', turns: [
    ['b', "That's eleven."], ['a', "I'm warming up."], ['b', "They're all on the floor."], ['a', "The floor is also warming up."]] },
  { id: 'cm2.07', when: { phase: 'morning' }, stage: '{a} has fallen asleep sitting up at breakfast.', turns: [
    ['b', "Are you awake?"], ['a', "I'm listening."], ['b', "I haven't said anything."], ['a', "And I've heard all of it."]] },
  { id: 'cm2.08', stage: '{a} has given the villa\'s pool float a name and a personality.', turns: [
    ['a', "Mr Flamingo's had a hard week."], ['b', "It's a pool float."], ['a', "Don't talk about him like that."], ['b', "Sorry, Mr Flamingo."]] },
  { id: 'cm2.09', stage: '{a} is trying to get the last bit of ketchup out of the bottle.', turns: [
    ['a', "Come on. Come on."], ['b', "Hit the bottom."], ['a', "I'm hitting the bottom."]],
    beat: 'The ketchup comes out all at once, onto {b}.' },
  { id: 'cm2.10', stage: '{a} is doing a very serious weather report by the pool.', turns: [
    ['a', "Today: hot. Tomorrow: also hot. The day after: you'll never guess."], ['b', "Hot?"], ['a', "Back to you in the studio."]] },
  { id: 'cm2.11', stage: '{a} has taken the only shady sunbed and refuses to give it up.', turns: [
    ['b', "You've been on that for three hours."], ['a', "I've built a life here."], ['b', "Move up."], ['a', "There's a waiting list."]] },
  { id: 'cm2.12', stage: '{a} tries to make an entrance to the fire pit and trips on the step.', turns: [
    ['b', "Graceful."], ['a', "That was choreographed."], ['b', "Was the noise choreographed?"], ['a', "Everything was choreographed."]] },
  { id: 'cm2.13', stage: '{a} is practising {a.posAdj} recoupling speech on {b}.', turns: [
    ['a', "The person I'd like to couple up with is kind, funny, and has a lovely smile."], ['b', "Is it me?"], ['a', "No."], ['b', "Then why are you practising on me?"]] },
  { id: 'cm2.14', stage: '{a} has put on every piece of jewellery {a} owns at once.', turns: [
    ['b', "Are you going somewhere?"], ['a', "The kitchen."], ['b', "You're jangling."], ['a', "That's how you know I'm coming."]] },
  { id: 'cm2.15', stage: '{a} is teaching {b} a handshake with far too many steps.', turns: [
    ['a', "Then the elbow, then the spin, then the wink."], ['b', "I can't wink."], ['a', "Then it's over. You've failed."]], beat: 'They do it anyway, and get it wrong nine times.' },
  { id: 'cm2.16', stage: '{a} insists the villa has a ghost.', turns: [
    ['a', "Something moved my towel."], ['b', "I moved your towel."], ['a', "Why would you say that? Now I'm scared of you."]] },
  { id: 'cm2.17', stage: '{a} is trying to take off a top that is stuck over {a.posAdj} head.', turns: [
    ['a', "Help. I'm trapped."], ['b', "Put your arms up."], ['a', "They are up. This is as up as they go."], ['b', "I'm getting the others."], ['a', "Don't get the others!"]] },
  { id: 'cm2.18', stage: '{a} has made a very long list of rules for the kitchen.', turns: [
    ['b', "Rule nine: no humming?"], ['a', "You know what you did."], ['b', "I was humming one song."], ['a', "For an hour."]] },
  { id: 'cm2.19', stage: '{a} has tried to make an ice lolly out of juice and a spoon.', turns: [
    ['b', "It's still juice."], ['a', "Give it time."], ['b', "It's been in there ten minutes."], ['a', "Patience is a virtue."]] },
  { id: 'cm2.20', stage: '{a} is reading {b}\'s palm.', turns: [
    ['a', "You're going to meet someone tall."], ['b', "Everyone in here is tall."], ['a', "Then it's working already."]] },
  { id: 'cm2.21', stage: 'The fan in the bedroom stops working, and {a} takes it personally.', turns: [
    ['a', "After everything I've done for you."], ['b', "It's a fan."], ['a', "It was my friend."]] },
  { id: 'cm2.22', stage: '{a} tries to do the splits for a bet.', turns: [
    ['b', "Keep going."], ['a', "I've stopped going."], ['b', "You're nowhere near."], ['a', "I'm going to live down here now."]] },
  { id: 'cm2.23', stage: '{a} is determined to find out who keeps taking the good pillows.', turns: [
    ['a', "Somebody in this villa is a pillow thief."], ['b', "It's not me."], ['a', "Then why are you holding three?"], ['b', "…I'm minding them."]] },
  { id: 'cm2.24', stage: '{a} walks out of the dressing room in {b}\'s clothes.', turns: [
    ['b', "That's my top."], ['a', "It's our top now."], ['b', "It's too long on you."], ['a', "It's a new look."]] },
  { id: 'cm2.25', stage: '{a} has tried to make pancakes and they are all stuck together.', turns: [
    ['b', "That's one pancake."], ['a', "It's a family-sized pancake."], ['b', "How do we share it?"], ['a', "We don't. It's mine."]] },
  { id: 'cm2.26', stage: '{a} is trying to hear what the others are saying on the terrace, very badly hidden behind a plant.', turns: [
    ['b', "What are you doing?"], ['a', "I'm not here."], ['b', "I can see you."], ['a', "Keep your voice down, I'm undercover."]] },
  { id: 'cm2.27', stage: '{a} is sulking because nobody laughed at {a.posAdj} joke.', turns: [
    ['a', "It was a good joke."], ['b', "It was a pun about cheese."], ['a', "It was a great pun about cheese."], ['b', "Okay. It was quite good."]] },
  { id: 'cm2.28', stage: '{a} has decided to learn to juggle with oranges.', turns: [
    ['b', "How many can you do?"], ['a', "One."], ['b', "That's just holding an orange."], ['a', "Very skilfully, though."]] },
  { id: 'cm2.29', stage: '{a} comes out of the shower with a face mask on and scares {b}.', turns: [
    ['b', "Oh my God!"], ['a', "It's me! It's only me!"], ['b', "Why is it green?"], ['a', "It's cucumber. It's good for you."]] },
  { id: 'cm2.30', when: { phase: 'morning' }, stage: '{a} tries to guess the time from the sun.', turns: [
    ['a', "It's about four."], ['b', "It's half nine in the morning."], ['a', "Roughly four, then."]] },
  { id: 'cm2.31', stage: '{a} is dramatically re-enacting the fire pit for {b}.', when: { phase: 'morning' }, turns: [
    ['a', "And then the host said, \"Islanders…\""], ['b', "I was there."], ['a', "Let me have this."]] },
  { id: 'cm2.32', stage: '{a} has taken three plates of food and says it\'s for other people.', turns: [
    ['b', "Who are those for?"], ['a', "Everyone."], ['b', "Then why are you sitting down with them?"], ['a', "I'm keeping them warm."]] },
  { id: 'cm2.33', stage: '{a} gets stung by nothing and screams.', turns: [
    ['a', "Something bit me!"], ['b', "There's nothing there."], ['a', "It was invisible."], ['b', "It was a leaf."]] },
  { id: 'cm2.34', stage: '{a} has made up a villa award and presents it to {b}.', turns: [
    ['a', "And the award for most dramatic sneeze goes to…"], ['b', "Don't."], ['a', "…you."], ['b', "I'm not collecting it."]] },
  { id: 'cm2.35', stage: '{a} is struggling to get onto the giant inflatable in the pool.', turns: [
    ['b', "Just climb on."], ['a', "I am climbing on."], ['b', "You keep sliding off."], ['a', "It keeps moving!"]] },
  { id: 'cm2.36', stage: '{a} has been talking to {b} for ten minutes with food on {a.posAdj} face.', turns: [
    ['b', "You've got something…"], ['a', "Where?"], ['b', "Everywhere."], ['a', "Why didn't you say?"], ['b', "It was too good."]] },
];
