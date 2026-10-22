// ══════════════════════════════════════════════════════════════════════
// pm/talk/comedy.js — {a} is the villa's entertainment; {b} is nearest
// ══════════════════════════════════════════════════════════════════════
//
// A laugh is a whole bit: its setup and its payoff written together, so the
// joke lands on the thing it set up (the user: "jokes you have to decode").
// Nothing here invents an event the villa didn't have; the bit is the event.
//   bit     the whole bit
//   tag     a last line on it, now and then
import { build } from './build.js';

export const COMEDY = build('comedy', {
  plans: {
    featured: ['bit', 'tag?'],
    short: ['bit'],
  },
  moves: {
    bit: [
      { stage: "{a} walks into the garden wearing every single one of {a.posAdj} sunglasses at once.", turns: [
        ['b', "What are you doing?"],
        ['a', "I couldn't decide which pair to wear, so I've gone for all of them. It's called being decisive."],
        ['b', "That's literally the opposite of being decisive."],
        ['a', "I can't hear you. I can't see you either, actually. Where are you?"],
        ['b', "I'm right in front of you."],
        ['a', "Hello, right in front of me."],
      ] },
      { stage: "{a} picks up a wooden spoon and starts narrating the villa like a nature documentary.", turns: [
        ['a', "And here we see the islander in its natural habitat. The sun lounger. It has not moved for three hours. Scientists believe it may be asleep, or it may be thinking about a recoupling. Nobody knows."],
        ['b', "Are you talking about me?"],
        ['a', "The islander has noticed us. We must stay very still."],
        ['b', "I'm going to throw this cushion at you."],
        ['a', "The islander is becoming aggressive. We must retreat."],
      ] },
      { stage: "{a} tries to make a cocktail for everyone and gets it badly wrong.", turns: [
        ['a', "Right, everyone, I've made a signature villa cocktail. It's got juice, it's got more juice, and it's got a bit of everything I could find in the fridge."],
        ['b', "Why is it brown?"],
        ['a', "That's the flavour."],
        ['b', "Brown's not a flavour."],
        ['a', "Try it and tell me it's not a flavour."],
        ['b', "Oh my God. That's horrendous. Why does it taste like Sunday dinner?"],
        ['a', "I put a bit of gravy in it. For depth."],
      ] },
      { stage: "{a} lies down on the lawn and refuses to move.", turns: [
        ['b', "Are you all right?"],
        ['a', "I've decided I live here now. This is my bit of lawn. I'm going to raise a family here."],
        ['b', "You can't live on the lawn."],
        ['a', "Watch me. I've already named it."],
        ['b', "What have you named it?"],
        ['a', "The Lawn. I'm not very creative."],
      ] },
      { stage: "{a} does an impression of the host reading out a text.", turns: [
        ['a', "Islanders! Please gather at the fire pit, because tonight, one of you will be going home... to bed. Because it's late. And you're all tired."],
        ['b', "Do it again. Do the voice."],
        ['a', "Islanders! The kettle has boiled! Please make your way to the kitchen, where one of you will be making the tea!"],
        ['b', "That's actually spot on."],
        ['a', "I've been practising in the shower."],
      ] },
      { stage: "{a} tries to do a cartwheel by the pool.", turns: [
        ['a', "Watch this. I used to be able to do this when I was eight."],
        ['b', "You're not eight anymore."],
        ['a', "My body doesn't know that."],
        ['b', "Oh my God, are you okay?"],
        ['a', "I'm fine. My body knows now. My body is fully aware that I'm not eight."],
      ] },
      { stage: "{a} has written everyone's name on the eggs in the fridge.", turns: [
        ['b', "Why has my egg got my name on it?"],
        ['a', "Because people keep eating my eggs. So now everyone's got their own eggs. It's a system."],
        ['b', "Mine's got a little face drawn on it."],
        ['a', "I did faces for everyone. Yours is smiling because you're nice to me. Some people's are not smiling."],
        ['b', "Whose aren't smiling?"],
        ['a', "Check the fridge. Then you'll know."],
      ] },
      { stage: "{a} challenges {b} to a staring contest on the daybeds.", turns: [
        ['a', "Staring contest. Now. Loser does the washing-up."],
        ['b', "Fine. Go."],
        ['a', "..."],
        ['b', "..."],
        ['a', "Why are you making that face?"],
        ['b', "I'm not making a face, this is just my face."],
        ['a', "I blinked. I blinked because of your face. That doesn't count."],
        ['b', "It counts. Enjoy the washing-up."],
      ] },
      { stage: "{a} gives {b} a dramatic reading of the back of the sun cream bottle.", turns: [
        ['a', "Apply generously. Fifteen minutes before sun exposure. Reapply after swimming, towelling, or sweating."],
        ['b', "Why are you reading it like it's a love letter?"],
        ['a', "Because it's the only thing in here that tells me what to do and actually means it."],
        ['b', "That's quite deep, actually."],
        ['a', "Avoid contact with eyes. Beautiful."],
      ] },
      { stage: "{a} attempts a workout with {b}, mostly by lying down.", turns: [
        ['b', "You said we were doing a workout."],
        ['a', "We are. This is the cool-down."],
        ['b', "We haven't done the workout yet."],
        ['a', "I like to get the cool-down out of the way first. It's very efficient."],
      ] },
      { stage: "{a} holds a villa awards ceremony using a banana as a microphone.", turns: [
        ['a', "And the award for longest time spent in the bathroom goes to... everyone, actually. It's a group award."],
        ['b', "Have I won anything?"],
        ['a', "You've won most likely to laugh at my jokes. Which is the most important award."],
        ['b', "Do I get the banana?"],
        ['a', "Nobody gets the banana. The banana is the microphone."],
      ] },
      { stage: "{a} insists on teaching {b} a dance routine on the lawn.", turns: [
        ['a', "Five, six, seven, eight. Left, right, spin, clap, and the face."],
        ['b', "What's the face?"],
        ['a', "The face is the most important bit. It's like this."],
        ['b', "You look like you've seen a ghost."],
        ['a', "That's the face. You've got it. Again from the top."],
      ] },
      { stage: "{a} tries to make toast and sets off the smoke alarm.", turns: [
        ['b', "How have you burnt toast? It's a toaster. It does it for you."],
        ['a', "I wanted it extra crispy."],
        ['b', "It's black. It's black all the way through."],
        ['a', "It's charcoal toast. It's very good for you. People pay a lot of money for charcoal."],
        ['b', "Not for toast, they don't."],
      ] },
      { stage: "{a} tries to climb onto the biggest inflatable in the pool and keeps falling off.", turns: [
        ['a', "I've nearly got it. I've nearly got it."],
        ['b', "That's the fifth time."],
        ['a', "Fifth time lucky."],
        ['b', "That's not a saying."],
        ['a', "It is now. Oh no. Oh no, here I go again."],
      ] },
      { stage: "{a} announces {a.posAdj} retirement from the villa's washing-up rota.", turns: [
        ['a', "I'd like to make an announcement. After a long and successful career, I'm stepping back from the washing-up."],
        ['b', "You've done it once."],
        ['a', "And it was a career high. I'd like to go out on top."],
        ['b', "You're on the rota for tomorrow."],
        ['a', "Then I'll be coming out of retirement tomorrow. It's been a short retirement."],
      ] },
      { stage: "{a} gives {b} a tour of the villa, like an estate agent.", turns: [
        ['a', "And here we have the kitchen. Lovely open-plan living, plenty of natural light, slight smell of burnt toast."],
        ['b', "That was you."],
        ['a', "Moving on. The bedroom. Sleeps a lot of people. Very sociable. No privacy whatsoever."],
        ['b', "Would you recommend it?"],
        ['a', "Five stars. Would cry here again."],
      ] },
      { when: { phase: 'morning' }, stage: "{a} comes out for breakfast with {a.posAdj} hair sticking up in every direction.", turns: [
        ['b', "What's happened to your hair?"],
        ['a', "I slept on it."],
        ['b', "You slept on it in a wind tunnel?"],
        ['a', "It's a look. It's called morning. It'll catch on."],
      ] },
      { when: { phase: 'evening' }, stage: "{a} tells a ghost story by the fire pit and gets far too into it.", turns: [
        ['a', "And then, in the dead of night, the islander heard a noise coming from the kitchen. A crunching noise."],
        ['b', "Oh no."],
        ['a', "The islander crept downstairs. And there, in the dark, with the fridge door open..."],
        ['b', "What?"],
        ['a', "Was me. Eating the last of the cheese. The end."],
        ['b', "That's not a ghost story, that's a confession."],
      ] },
      { stage: "{a} drapes a towel over {a.posAdj} head and pretends to be a fortune teller.", turns: [
        ['a', "Cross my palm with crisps, and I'll tell you your future."],
        ['b', "I've only got one crisp."],
        ['a', "That'll get you a small future. Give me your hand. I see... a recoupling. I see... someone in tears. I see... you doing the washing-up."],
        ['b', "That's not the future, that's tonight."],
        ['a', "I'm very accurate."],
      ] },
      { stage: "{a} has made {a.ref} a crown out of tinfoil.", turns: [
        ['b', "Why are you wearing a crown?"],
        ['a', "Because I've declared myself ruler of the daybeds. I'm in charge now."],
        ['b', "Who voted for you?"],
        ['a', "Nobody voted. It's not that kind of system. I just put the crown on."],
        ['b', "Can I have a crown?"],
        ['a', "You can be my advisor. You get a smaller crown."],
      ] },
      { stage: "{a} spends ten minutes trying to open a jar.", turns: [
        ['a', "This jar is broken."],
        ['b', "Give it here."],
        ['a', "You won't be able to do it. I've loosened it for you, though. Remember that."],
        ['b', "Done."],
        ['a', "Because I loosened it. That was a team effort."],
      ] },
      { when: { reg: 'big' }, stage: "{a} bursts out of the villa singing at the top of {a.posAdj} voice.", turns: [
        ['b', "What is that song?"],
        ['a', "I made it up. It's about the hot tub. It's called Hot Tub."],
        ['b', "Very creative."],
        ['a', "The second verse is about the pool. It's called Pool."],
        ['b', "Please stop."],
        ['a', "There's a third verse."],
      ] },
      { when: { reg: 'dry' }, stage: "{a} sits down next to {b} with a notepad and a very serious face.", turns: [
        ['a', "I've been keeping score of who says 'my type on paper' the most."],
        ['b', "And?"],
        ['a', "Everyone. Constantly. If we all just showed each other the paper, it'd save so much time."],
        ['b', "What's on your paper?"],
        ['a', "Mostly doodles, if I'm honest."],
      ] },
    ],

    tag: [
      { turns: [['b', "Honestly, I don't know what we'd do in here without you."]], beat: "{a} takes a bow." },
      { turns: [['b', "You're actually unwell, do you know that?"], ['a', "Thank you. I try."]] },
      { turns: [], beat: "Half the villa is crying with laughter, and {a} looks very pleased with {a.ref}." },
      { turns: [['b', "Every single day, it's something with you."], ['a', "You'd be bored without me."], ['b', "I would, actually."]] },
      { turns: [], beat: "{b} is still laughing about it an hour later." },
    ],
  },

  notes: [
    { stage: "{a} has the whole villa in stitches by the pool." },
    { stage: "{a} does impressions of everyone at dinner. {b} laughs the loudest." },
    { stage: "{a} tries to teach {b} a dance routine. It does not go well." },
    { stage: "{a} and {b} mess about in the pool until they're both crying with laughter." },
    { stage: "{a} burns the toast again, and {b} never lets {a.obj} forget it." },
  ],
});
