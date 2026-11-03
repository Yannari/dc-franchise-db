// More friction (measured 2026-10-19: a partner snapping aired 15 times a season from 5 scenes, the cold shoulder 11 from
// 3, trash talk 15 from 6). Snap: a snaps at b, about something specific that's been building, with what it's really
// about underneath. Cold shoulder: a stops talking to b. Trash talk: a and b start it, c and d give it back.
import { V } from '../places/_kit.js';

export default {
  retire: [],
  pools: {
    'trash-talk.exchange': [
      { id: 'vf.t1', turns: [
        { by: 'a', say: "Nice of you to show up. We've been here for ages." },
        { by: 'c', say: "Ages? You got here two minutes ago. We watched you run in." },
        { by: 'b', ...V("Two minutes is ages when you're winning.", "Two minutes is ages when you're winning.", "Ages, when you're winning.", "Two minutes is AGES when you're WINNING!", "Two minutes feels like ages when you're winning.", "Time moves slowly up here at the top.") },
        { by: 'd', say: "You're not winning. Nobody's winning until the mat." },
        { by: 'a', say: "We're winning right now. Compared to you." },
        { by: 'c', say: "Enjoy right now. It's the closest you'll get." },
      ] },
      { id: 'vf.t2', turns: [
        { by: 'c', say: "Did you two finally learn to read a map?" },
        { by: 'a', say: "Did you two finally learn to be quiet?" },
        { by: 'd', ...V("Ooh. Somebody's sensitive about the map.", "Sensitive about the map.", "Touchy about maps.", "OOH! SOMEBODY'S sensitive about the MAP!", "Ooh, somebody's a little sensitive about the map.", "Ooh. We've found the sore spot. It's map-shaped.") },
        { by: 'b', say: "Somebody's going to be sensitive about coming last." },
        { by: 'c', say: "That'll be you, then." },
        { by: 'a', say: "We'll see." },
      ] },
      { id: 'vf.t3', turns: [
        { by: 'b', say: "You two look like you've been crying." },
        { by: 'd', say: "You two look like you've been lost in a car park." },
        { by: 'a', ...V("Car parks are confusing. They all look the same.", "Car parks all look the same.", "They all look the same.", "Car parks are CONFUSING! They ALL look the SAME!", "Car parks are confusing, though. They all look the same.", "Car parks are mazes with parking.") },
        { by: 'c', say: "And we weren't crying. {d} has something in {d.posAdj} eye." },
        { by: 'b', say: "For twenty minutes?" },
        { by: 'd', say: "It was a big something." },
      ] },
      { id: 'vf.t4', turns: [
        { by: 'a', say: "Hey. We've seen how you two read a map." },
        { by: 'c', say: "We've seen how you two argue. Which is worse?" },
        { by: 'b', ...V("Arguing is healthy. Reading a map is a life skill.", "Arguing's healthy. Maps are a skill.", "Maps are a life skill.", "ARGUING is HEALTHY! Reading a MAP is a LIFE SKILL!", "Arguing is healthy, though. Reading a map is a life skill.", "Arguing is cardio. Maps are a duty.") },
        { by: 'd', say: "You argued in front of a whole market. People filmed it." },
        { by: 'a', say: "And you held the map upside down in front of the same market." },
        { by: 'c', say: "It was a confusing market." },
      ] },
      { id: 'vf.t5', turns: [
        { by: 'c', say: "You know everybody's talking about you two, right?" },
        { by: 'a', say: "Good. They should be. We're the ones to beat." },
        { by: 'd', ...V("They're not saying that. They're saying you're the ones who argue the loudest.", "They're saying you argue the loudest.", "Loudest arguers. That's what they say.", "They're NOT saying that! They're saying you're the ones who ARGUE the LOUDEST!", "That's not what they're saying. They're saying you argue the loudest.", "They're calling you the shouting ones. Affectionately. Mostly.") },
        { by: 'b', say: "We don't argue. We discuss at volume." },
        { by: 'c', say: "Discuss more quietly. Some of us are trying to concentrate." },
        { by: 'a', say: "No." },
      ] },
      { id: 'vf.t6', turns: [
        { by: 'b', say: "We're going to beat you this leg." },
        { by: 'c', say: "You said that last leg." },
        { by: 'a', say: "And this time we mean it." },
        { by: 'd', say: "You meant it last time too." },
        { by: 'b', say: "We meant it less last time." },
        { by: 'c', say: "Okay. Good luck meaning it." },
      ] },
      { id: 'vf.t7', turns: [
        { by: 'a', say: "Love the outfits. Very bold. For a race." },
        { by: 'd', say: "Love yours. Very... practical." },
        { by: 'b', ...V("Practical wins races.", "Practical wins races.", "Practical wins.", "PRACTICAL wins RACES!", "Practical is what wins races, though.", "Practical has never lost a race. Allegedly.") },
        { by: 'c', say: "Practical also looks like it was bought in a petrol station." },
        { by: 'a', say: "It was a very nice petrol station." },
        { by: 'd', say: "I can see that. It still has the tag on." },
      ] },
      { id: 'vf.t8', turns: [
        { by: 'c', say: "Still here, then?" },
        { by: 'a', say: "Still here. Disappointed?" },
        { by: 'd', ...V("A little. We had a bet on who'd go next.", "We had a bet you'd go next.", "We bet on you going.", "A LITTLE! We had a BET on who'd go NEXT!", "A little, yeah. We had a bet on who'd go next.", "Slightly. We had money on you. Not much. Some.") },
        { by: 'b', say: "And you bet on us?" },
        { by: 'c', say: "We both bet on you. So it wasn't much of a bet." },
        { by: 'a', say: "Then you both lost. Pay up." },
      ] },
      { id: 'vf.t9', turns: [
        { by: 'a', say: "Should we slow down so you can keep up?" },
        { by: 'c', say: "Should we speed up so you can stop talking?" },
        { by: 'b', ...V("Ooh. Okay. That was quite good.", "That was quite good.", "Okay. Good one.", "OOH! OKAY! That was QUITE good!", "Ooh, okay. That one was actually quite good.", "Ooh. A burn. A real one. I felt it.") },
        { by: 'a', say: "Don't compliment them!" },
        { by: 'd', say: "Too late. We heard. We're keeping it." },
        { beat: '{c} and {d} jog off, high-fiving.' },
      ] },
      { id: 'vf.t10', turns: [
        { by: 'd', say: "You know what your problem is?" },
        { by: 'a', say: "Go on. Tell us our problem." },
        { by: 'd', ...V("You think you're the main characters. You're not. You're the comic relief.", "You think you're the stars. You're comic relief.", "You're the comic relief.", "You THINK you're the MAIN characters! You're NOT! You're the COMIC RELIEF!", "You think you're the main characters, but you're really the comic relief.", "You think you're the heroes. You're the funny sidekicks.") },
        { by: 'b', say: "Comic relief is everyone's favourite." },
        { by: 'c', say: "Comic relief never wins." },
        { by: 'a', say: "Then we'll be the first." },
      ] },
    ],
  },
};
