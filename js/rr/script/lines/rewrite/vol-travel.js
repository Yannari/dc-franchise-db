// More of the travelling (measured 2026-10-19: the shared flight aired 19 times a season from 2 scenes, the ride 21
// from 4 plain ones). The shared flight is cast by team: a and b, c and d, e and f (e and f only when a third team is
// aboard). The ride is the leg's own ride (a place with lines of its own plays those first): kept general here.
import { V } from '../places/_kit.js';

const A = { at: 'airport' };

export default {
  retire: [],
  pools: {
    'same-flight.any': [
      { id: 'vt.sf1', when: A, turns: [
        { beat: '{a} and {b} find their row. {c} and {d} are already in the two seats across the aisle.' },
        { by: 'c', say: "Of course. Of course it's you." },
        { by: 'a', ...V("We didn't pick the seats. The airline picked the seats.", "The airline picked the seats.", "Blame the airline.", "We didn't PICK the seats! The AIRLINE picked the seats!", "We didn't pick these seats, the airline did.", "Take it up with the airline. We're innocent passengers.") },
        { by: 'd', say: "Eleven hours." },
        { by: 'b', say: "Eleven hours. Want a mint?" },
        { by: 'd', say: "...Yeah. Thanks." },
      ] },
      { id: 'vt.sf2', when: A, turns: [
        { by: 'a', say: "Does anyone know what time we land? Local time?" },
        { by: 'c', say: "Six in the morning. Their six. Our... I don't know. Yesterday?" },
        { by: 'e', opt: true, say: "I stopped knowing what day it was in the second country." },
        { by: 'b', say: "It's Tuesday." },
        { by: 'd', ...V("It's Thursday.", "Thursday.", "It's Thursday.", "It's THURSDAY!", "I'm pretty sure it's Thursday.", "It's Thursday. Possibly Friday in spirit.") },
        { beat: 'Nobody on the plane agrees on the day. Nobody checks.' },
      ] },
      { id: 'vt.sf3', when: A, turns: [
        { beat: 'The plane hits turbulence, and every racer on board grabs whoever is next to them, friend or not.' },
        { by: 'c', say: "Sorry. Sorry. That was your arm." },
        { by: 'a', say: "It's fine. You can keep holding it. I'm not proud." },
        { by: 'd', say: "Is this normal? Is the plane supposed to do that?" },
        { by: 'b', say: "Planes do that. Planes love doing that." },
        { beat: 'When it stops, nobody lets go straight away.' },
      ] },
      { id: 'vt.sf4', when: A, turns: [
        { by: 'b', say: "Whoever gets off this plane first gets the first cab." },
        { by: 'd', ...V("Then we're getting off first. We're in row nine.", "We're getting off first. Row nine.", "Row nine. We're first.", "Then WE'RE getting off FIRST! We're in ROW NINE!", "Then we'll be getting off first, we're in row nine.", "Then victory is ours. Row nine. Front of the plane.") },
        { by: 'a', say: "We're in row eight." },
        { by: 'c', say: "We'll see who's faster with the overhead lockers." },
        { beat: 'Four racers spend the last half hour of the flight staring at the overhead lockers.' },
        { by: 'b', say: "My hand's on the seatbelt. I'm ready." },
      ] },
      { id: 'vt.sf5', when: A, turns: [
        { by: 'c', say: "Can I ask you something? Honestly?" },
        { by: 'a', say: "Sure." },
        { by: 'c', say: "Do you two ever fight? You always look so together." },
        { by: 'b', ...V("We fought for an hour this morning about a sandwich.", "An hour this morning. About a sandwich.", "This morning. Sandwich. An hour.", "We fought for an HOUR this morning about a SANDWICH!", "We had an hour-long fight this morning, about a sandwich.", "We fought over a sandwich this morning. The sandwich won.") },
        { by: 'a', say: "And I was right about the sandwich." },
        { by: 'd', say: "Oh, thank goodness. We thought it was just us." },
      ] },
      { id: 'vt.sf6', when: A, turns: [
        { beat: 'The food trolley arrives. There is chicken or pasta. There is no more chicken.' },
        { by: 'a', say: "They're out of chicken. They gave the last chicken to {c}." },
        { by: 'c', say: "I didn't know it was the last one!" },
        { by: 'b', say: "That's the second thing you've taken from us this race." },
        { by: 'd', say: "What was the first thing?" },
        { by: 'b', say: "First place on the last leg." },
      ] },
      { id: 'vt.sf7', when: A, turns: [
        { by: 'd', say: "Truce? Just for the flight?" },
        { by: 'a', ...V("Just for the flight. The second the wheels touch down, the truce is over.", "Truce. Until the wheels touch down.", "Truce. Till we land.", "JUST for the flight! The SECOND the wheels touch DOWN, the truce is OVER!", "Just for the flight. As soon as the wheels touch down, it's over.", "A flight truce. Valid at cruising altitude only.") },
        { by: 'c', say: "Deal. Can we split the headphones? Mine broke." },
        { by: 'b', say: "That's a lot to ask in a truce." },
        { beat: 'They split the headphones. They watch the same film, one ear each, and both of them cry at the end.' },
        { by: 'a', say: "This never happened." },
      ] },
      { id: 'vt.sf8', when: A, turns: [
        { by: 'a', say: "Is that {c}? Snoring?" },
        { by: 'd', say: "{c.Sub} can sleep anywhere. On a camel. Standing up. Here." },
        { by: 'b', say: "I haven't slept in two days." },
        { by: 'd', ...V("{c.Sub} has slept in every country we've been to. It's a gift.", "{c.Sub} sleeps in every country. A gift.", "Every country. Asleep. A gift.", "{c.Sub} has SLEPT in EVERY country we've been to! It's a GIFT!", "{c.Sub} has managed to sleep in every country so far. It's a gift.", "{c.Sub} has napped on three continents. It's practically a sport.") },
        { beat: '{c} snores louder, as if on cue.' },
        { by: 'a', say: "I hate {c.obj}. I hate {c.obj} so much." },
      ] },
      { id: 'vt.sf9', when: A, turns: [
        { by: 'c', say: "Where did you lot finish last time?" },
        { by: 'b', say: "Don't ask. Where did you?" },
        { by: 'd', say: "Don't ask." },
        { by: 'e', opt: true, say: "We came fourth." },
        { by: 'a', say: "Nobody asked you." },
        { by: 'f', opt: true, say: "Everybody was thinking it, though." },
      ] },
      { id: 'vt.sf10', when: A, turns: [
        { beat: 'The pilot announces a forty-minute delay. Every racer on board groans at the same time.' },
        { by: 'a', say: "Forty minutes. We're going to lose our lead." },
        { by: 'c', ...V("Everybody's on this plane. Nobody has a lead.", "Nobody has a lead. We're all here.", "We're all here. No lead.", "EVERYBODY'S on this plane! NOBODY has a lead!", "Everybody's on this plane, so nobody has a lead.", "We're all trapped in the same tin. There is no lead.") },
        { by: 'b', say: "That's actually comforting." },
        { by: 'd', say: "It is, until we land." },
        { beat: 'For forty minutes, sitting perfectly still, the race is a dead heat.' },
      ] },
      { id: 'vt.sf11', when: A, turns: [
        { by: 'b', say: "Window or aisle?" },
        { by: 'a', say: "Window. I want to see where we're going." },
        { by: 'c', say: "It's night. You're going to see black." },
        { by: 'a', say: "Then I'll see black, and I'll be the first one to see the lights." },
        { by: 'd', say: "That's honestly a beautiful way to look at it." },
        { by: 'c', say: "It's a window seat. Calm down." },
      ] },
      { id: 'vt.sf12', when: A, turns: [
        { by: 'a', say: "Hey. Before we land. Good luck. Honestly." },
        { by: 'c', ...V("Honestly? You mean that?", "Honestly? You mean it?", "You mean that?", "HONESTLY? You MEAN that?", "Honestly? Do you actually mean that?", "Honestly? With your heart?") },
        { by: 'a', say: "I mean it until the doors open. Then I want to destroy you." },
        { by: 'd', say: "That's fair." },
        { by: 'b', say: "That's the most sportsmanlike thing you've said all race." },
        { beat: 'They shake hands across the aisle. The seatbelt sign goes off, and the handshake ends very quickly.' },
      ] },
      { id: 'vt.sf13', when: A, turns: [
        { beat: 'A baby two rows back starts crying. It does not stop for six hours.' },
        { by: 'b', say: "That baby is more tired than I am." },
        { by: 'c', say: "Nobody is more tired than I am." },
        { by: 'a', say: "Should we sing to it?" },
        { by: 'd', ...V("Please don't. Everyone on this plane has heard you sing.", "Please don't. We've heard you sing.", "No. We've heard you.", "Please DON'T! EVERYONE on this plane has HEARD you sing!", "Please don't. Everyone on this plane has heard you sing.", "No. The baby has suffered enough.") },
        { beat: 'They sing to it anyway, very softly. It falls asleep. Nobody can quite believe it.' },
      ] },
      { id: 'vt.sf14', when: A, turns: [
        { by: 'c', say: "What are you going to do with the money? If you win." },
        { by: 'a', say: "Pay off my car. Then buy a better car. Then pay that one off." },
        { by: 'd', say: "That's very sensible." },
        { by: 'b', say: "I'm going to buy a boat." },
        { by: 'a', say: "You can't swim." },
        { by: 'b', say: "That's why it's a boat." },
      ] },
      { id: 'vt.sf15', when: A, turns: [
        { by: 'd', say: "Does anybody have a pen? I need to fill in this landing form." },
        { by: 'a', say: "We've got one. It doesn't work." },
        { by: 'e', opt: true, say: "We've got one that works, but you have to give it back." },
        { by: 'c', ...V("Why would we not give it back?", "Why wouldn't we give it back?", "We'd give it back.", "Why would we NOT give it BACK?", "Why wouldn't we give it back?", "We are honourable pen borrowers.") },
        { by: 'f', opt: true, say: "Because the last team didn't." },
        { beat: 'The pen goes round the whole plane. It does not come back.' },
      ] },
      { id: 'vt.sf16', when: A, turns: [
        { by: 'a', say: "They're watching us. Every time I look up, they're watching us." },
        { by: 'b', say: "That's because you keep looking up at them." },
        { by: 'c', say: "Why do you keep looking at us?" },
        { by: 'a', ...V("We're not looking at you. We're looking at the screen behind you.", "We're looking at the screen behind you.", "The screen. Behind you.", "We're NOT looking at you! We're looking at the SCREEN behind you!", "We're not looking at you, we're looking at the screen behind you.", "We're looking past you. Into the middle distance.") },
        { by: 'd', say: "There's no screen behind us. It's a toilet." },
        { beat: 'Nobody looks at anybody for the rest of the flight.' },
      ] },
    ],
    'ride.any': [
      { id: 'vt.r1', turns: [
        { by: 'a', say: "Are we going faster than walking? I can't tell if we're going faster than walking." },
        { by: 'b', say: "A man just walked past us." },
        { by: 'a', say: "So that's a no." },
      ] },
      { id: 'vt.r2', turns: [
        { beat: 'Every bump goes straight up {a}\'s spine.' },
        { by: 'a', ...V("I can feel every single bump in my teeth.", "Every bump. In my teeth.", "My teeth feel every bump.", "I can feel EVERY single bump in my TEETH!", "I can feel every single bump right in my teeth.", "My teeth are keeping count of the bumps. We're at four hundred.") },
        { by: 'b', say: "Then stop clenching your jaw." },
      ] },
      { id: 'vt.r3', turns: [
        { by: 'b', say: "I could get used to this. Sitting. Not running." },
        { by: 'a', say: "Don't get used to it. It's about to end." },
        { by: 'b', say: "Let me have this." },
      ] },
      { id: 'vt.r4', turns: [
        { by: 'a', say: "Can you see anyone behind us?" },
        { beat: '{b} turns round very carefully, so as not to fall off.' },
        { by: 'b', say: "Nobody. Oh, wait. Everybody." },
      ] },
      { id: 'vt.r5', turns: [
        { beat: '{a} and {b} ride in silence for a while, just looking at it all.' },
        { by: 'a', say: "It's beautiful here." },
        { by: 'b', say: "It is. Don't tell anyone I said that. I'm supposed to be focused." },
      ] },
      { id: 'vt.r6', turns: [
        { by: 'b', say: "Lean left. No, your left. No, the other left." },
        { by: 'a', ...V("I am leaning left! This thing is leaning right!", "I'm leaning left! It's leaning right!", "I'm left. It's right.", "I AM leaning LEFT! This thing is leaning RIGHT!", "I'm leaning left, this thing just keeps leaning right!", "I'm leaning left with all my heart! It disagrees!") },
        { by: 'b', say: "Then lean more." },
      ] },
      { id: 'vt.r7', turns: [
        { by: 'a', say: "My legs have gone numb." },
        { by: 'b', say: "Both of them?" },
        { by: 'a', say: "One completely. The other one's thinking about it." },
      ] },
      { id: 'vt.r8', turns: [
        { by: 'b', say: "Wave. There's a camera. Wave." },
        { beat: '{a} waves, loses {a.posAdj} balance, and grabs {b} to stay on.' },
        { by: 'a', say: "Never ask me to wave again." },
      ] },
      { id: 'vt.r9', turns: [
        { by: 'a', say: "How long is this part?" },
        { by: 'b', say: "The tip didn't say." },
        { by: 'a', say: "Then it's forever. Assume forever." },
      ] },
      { id: 'vt.r10', turns: [
        { by: 'b', ...V("If we fall off now, we have to start the whole thing again.", "If we fall off, we start again.", "Fall off, start again.", "If we FALL OFF now, we have to start the WHOLE thing AGAIN!", "If we fall off now, we'd have to start the whole thing again.", "One fall, and we're back to the beginning. No pressure.") },
        { by: 'a', say: "Why would you say that? Why would you put that in my head?" },
        { by: 'b', say: "So you'd hold on tighter." },
      ] },
      { id: 'vt.r11', turns: [
        { beat: '{a} has started humming. {b} has started humming along. Neither knows the song.' },
        { by: 'b', say: "What is this song?" },
        { by: 'a', say: "No idea. Keep going, it's helping." },
      ] },
      { id: 'vt.r12', turns: [
        { by: 'a', say: "I'm going to be so sore tomorrow." },
        { by: 'b', say: "You're sore today." },
        { by: 'a', say: "Tomorrow I'm going to be sore about today." },
      ] },
    ],
  },
};
