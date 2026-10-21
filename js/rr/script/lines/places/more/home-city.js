// Home City, second batch of challenge lines. Same rules as places/home-city.js: it's leg one (nothing has happened
// yet), and the tower is an Either/Or, so its start and try lines gate on the side.
import { V, mergePools } from '../_kit.js';

const STAIRS = { taskId: 'tower', side: 'stairs' };
const DECK = { taskId: 'tower', side: 'skydeck' };
const TW = { taskId: 'tower' };
const ZL = { taskId: 'zipline' };

const tower = {
  'task-start.any': [
    { id: 'hc2.st-s1', when: STAIRS, turns: [
      { beat: 'A sign by the first step says "1". {a} and {b} look up the stairwell. It disappears into the dark.' },
      { by: 'b', say: "One. We've done one." },
      { by: 'a', say: "Only a hundred and forty-three to go." },
      { by: 'b', say: "Why would you tell me that?" },
    ] },
    { id: 'hc2.st-s2', when: STAIRS, turns: [
      { by: 'a', ...V("Elevators are for people who want to lose. We're climbing.", "Elevators are for losers.", "We climb.", "ELEVATORS are for LOSERS! We're CLIMBING!", "I think elevators are for people who want to lose, so we're climbing.", "The stairs are honest. The elevator lies.") },
      { by: 'b', say: "You said that before you saw the stairs." },
      { by: 'a', say: "I'm still saying it. Quieter." },
    ] },
    { id: 'hc2.sd-s1', when: DECK, turns: [
      { beat: 'The glass elevator rises up the side of the tower. The city drops away under their feet.' },
      { by: 'b', say: "It's glass. The floor is glass." },
      { by: 'a', say: "Don't look down. Look at the doors." },
      { by: 'b', say: "The doors are glass too!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc2.sd-s2', when: DECK, turns: [
      { by: 'a', say: "We picked the elevator. The easy one." },
      { by: 'b', say: "Then why is a man strapping me to a rope?" },
      { by: 'a', say: "Because the easy one has a catch." },
    ] },
    { id: 'hc2.st-f1', when: STAIRS, turns: [
      { beat: '{a} and {b} run every flight with the same steady stomp, never stopping, never talking.' },
      { by: 'b', say: "What floor?" },
      { by: 'a', say: "The last one. That's the door to the top." },
      { by: 'b', say: "We did it without dying!" },
    ] },
    { id: 'hc2.st-f2', when: STAIRS, turns: [
      { by: 'a', say: "Two at a time. Count them in twos." },
      { beat: 'Two at a time, all the way up, past three teams sitting on the landings.' },
      { by: 'b', say: "Sorry! Excuse us! Sorry!" },
    ] },
    { id: 'hc2.sd-f1', when: DECK, turns: [
      { beat: 'On the outside of the deck, {a} and {b} walk the rail hand over hand, the wind tugging at their clothes.' },
      { by: 'a', say: "Keep going. Hand, then foot. Hand, then foot." },
      { by: 'b', say: "This is the best view I've ever been terrified of." },
    ] },
    { id: 'hc2.sd-f2', when: DECK, turns: [
      { by: 'b', say: "Lean back. The man said lean back. Trust the rope." },
      { beat: '{a} leans back over the city, arms wide, and the rope holds.' },
      { by: 'a', say: "I'm flying! I'm flying over the whole city!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc2.st-a1', when: STAIRS, turns: [
      { beat: '{a} stops on a landing and leans against the wall, red in the face.' },
      { by: 'a', say: "I hate stairs. I've never hated anything more." },
      { by: 'b', say: "Then let's get away from them. The only way away is up." },
      { beat: 'Up and away, one flight at a time, they reach the top.' },
    ] },
    { id: 'hc2.st-a2', when: STAIRS, turns: [
      { by: 'b', say: "Hold the rail and pull. Let your arms do some of it." },
      { by: 'a', say: "My arms didn't sign up for this." },
      { beat: 'Pulling on the rail, flight by flight, they make it all the way.' },
    ] },
    { id: 'hc2.sd-a1', when: DECK, turns: [
      { beat: 'Back at the start of the rail, {b} breathes slowly and looks only at the next handhold.' },
      { by: 'b', say: "Next one. Just the next one." },
      { by: 'a', say: "I'm right behind you." },
      { beat: 'One handhold at a time, they get all the way round.' },
    ] },
    { id: 'hc2.sd-a2', when: DECK, turns: [
      { by: 'a', ...V("Talk to me the whole way round. Don't stop talking.", "Keep talking to me.", "Talk.", "TALK to me the whole way! DON'T stop!", "Please keep talking to me the whole way round.", "Fill the wind with words.") },
      { by: 'b', say: "About what?" },
      { by: 'a', say: "Anything. Your favourite food. Your worst haircut." },
      { beat: 'By the end of the worst haircut story, they\'re all the way round the deck.' },
    ] },
  ],
  'task-done.any': [
    { id: 'hc2.tw-dn1', when: TW, turns: [
      { by: 'b', say: "First challenge of the whole race, and we're through." },
      { by: 'a', say: "Only the rest of the world to go." },
      { by: 'b', say: "Don't. Let me be happy for a minute." },
    ] },
    { id: 'hc2.tw-dn2', when: TW, turns: [
      { beat: '{a} and {b} look out over the city and the lake from the very top of the tower.' },
      { by: 'a', say: "There's the island. There's the airport. That's where we're going." },
      { by: 'b', say: "How are we getting over the water?" },
      { by: 'a', say: "Read the tip." },
    ] },
    { id: 'hc2.tw-dn3', when: TW, turns: [
      { by: 'a', say: "My legs are shaking." },
      { by: 'b', say: "Mine have been shaking since we got out of the cab." },
      { by: 'a', say: "Then we're shaking together." },
    ] },
    { id: 'hc2.tw-dn4', when: TW, turns: [
      { beat: '{b} reads the tip and turns very slowly towards the window, and the long cable stretching across the lake.' },
      { by: 'b', say: "We're going on that." },
      { by: 'a', say: "On what?" },
      { by: 'b', say: "That." },
    ] },
  ],
};

const zipline = {
  'task-start.any': [
    { id: 'hc2.zl-s1', when: ZL, turns: [
      { beat: 'The zipline cable hums in the wind. The pole with the tip sticks out of the lake halfway across.' },
      { by: 'b', say: "We grab the tip off that pole? While we're flying?" },
      { by: 'a', say: "While we're flying. One hand." },
      { by: 'b', say: "I'm going to need both hands to scream." },
    ] },
    { id: 'hc2.zl-s2', when: ZL, turns: [
      { by: 'a', say: "Feet up when you pass the pole. Arm out. Grab." },
      { by: 'b', say: "Feet up, arm out, grab. Feet up, arm out, grab." },
      { by: 'a', say: "And don't let go of the tip." },
    ] },
    { id: 'hc2.zl-s3', when: ZL, turns: [
      { beat: 'A team ahead of them flies down the line and drops into the lake with a splash.' },
      { by: 'b', ...V("They fell in! They actually fell in!", "They fell in!", "Splash.", "They FELL in! They ACTUALLY fell in!", "Oh no, they actually fell into the lake!", "The lake has claimed its first victims.") },
      { by: 'a', say: "Then we know what not to do." },
    ] },
    { id: 'hc2.zl-s4', when: ZL, turns: [
      { by: 'a', say: "Have you ever done one of these?" },
      { by: 'b', say: "I've seen one on a holiday advert." },
      { by: 'a', say: "Same. Let's go." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'hc2.zl-f1', when: ZL, turns: [
      { beat: '{b} reaches out at exactly the right moment and plucks the tip off the pole like an apple from a tree.' },
      { by: 'b', say: "GOT IT!" },
      { by: 'a', say: "YOU GOT IT! I'M SO PROUD OF YOU!" },
    ] },
    { id: 'hc2.zl-f2', when: ZL, turns: [
      { by: 'a', say: "Arm out! Now!" },
      { beat: '{a} grabs the tip, nearly drops it, catches it in {a.posAdj} teeth and lands on the island holding it.' },
      { by: 'b', say: "Did you catch that with your mouth?" },
      { by: 'a', say: "Mmm-hmm." },
    ] },
    { id: 'hc2.zl-f3', when: ZL, turns: [
      { beat: '{a} and {b} land on the island, spin round, and look back up at the tower they came from.' },
      { by: 'b', say: "We came from up there?" },
      { by: 'a', say: "On a wire. With the tip. First go." },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'hc2.zl-a1', when: ZL, turns: [
      { by: 'b', say: "Stop flapping. You're spinning because you're flapping." },
      { by: 'a', say: "I'm not flapping. I'm reaching." },
      { by: 'b', say: "You're reaching like a bird." },
      { beat: 'This time {a} reaches like a person, and gets the tip.' },
    ] },
    { id: 'hc2.zl-a2', when: ZL, turns: [
      { beat: '{a} climbs out of the lake, dripping, and back up the steps to the platform.' },
      { by: 'a', say: "The water was very cold." },
      { by: 'b', say: "Then don't go back in it." },
      { beat: '{a} doesn\'t go back in it. The tip comes off the pole on the next try.' },
    ] },
    { id: 'hc2.zl-a3', when: ZL, turns: [
      { by: 'a', ...V("Watch the pole, not the water. The water isn't going anywhere.", "Watch the pole.", "Pole. Not water.", "Watch the POLE! NOT the WATER!", "Just watch the pole and not the water, it isn't going anywhere.", "The pole is your future. The water is your past.") },
      { by: 'b', say: "The water keeps waving at me." },
      { by: 'a', say: "Don't wave back. Grab." },
      { beat: 'Eyes on the pole, {b} grabs the tip.' },
    ] },
    { id: 'hc2.zl-a4', when: ZL, turns: [
      { beat: 'Third run. {a} pushes off hard and stretches out as far as the harness will let {a.obj}.' },
      { by: 'b', say: "That's it! That's it! Further!" },
      { beat: 'One fingertip, then the whole hand. {a} has it.' },
    ] },
  ],
  'task-done.any': [
    { id: 'hc2.zl-dn1', when: ZL, turns: [
      { by: 'b', say: "The airport. Our first plane. We're really doing this." },
      { by: 'a', say: "We're really doing this." },
      { by: 'b', say: "Say it like you're excited." },
      { by: 'a', say: "I'm too out of breath to sound excited." },
    ] },
    { id: 'hc2.zl-dn2', when: ZL, turns: [
      { beat: '{a} and {b} unclip from the harnesses and sprint along the jetty towards the island airport.' },
      { by: 'a', say: "Run! Before the plane fills up!" },
      { by: 'b', say: "Don's waiting first! The mat first!" },
    ] },
    { id: 'hc2.zl-dn3', when: ZL, turns: [
      { by: 'a', say: "Do you think everyone at home is watching?" },
      { by: 'b', say: "Not yet. It's not on yet." },
      { by: 'a', say: "Then I can tell them I didn't scream." },
    ] },
    { id: 'hc2.zl-dn4', when: ZL, turns: [
      { beat: '{b} holds the tip up and gives it a kiss.' },
      { by: 'b', say: "Our first tip. I'm keeping it forever." },
      { by: 'a', say: "You need it to get to the next place." },
      { by: 'b', say: "Then I'm keeping it for one more minute." },
    ] },
    { id: 'hc2.zl-dn5', when: ZL, turns: [
      { by: 'a', say: "The tower and the zipline. Both done." },
      { by: 'b', say: "How many more of those are there?" },
      { by: 'a', say: "Don't ask. Just enjoy these two." },
    ] },
  ],
};

export default mergePools(tower, zipline);
