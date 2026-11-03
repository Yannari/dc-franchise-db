// Fjord Peaks, second batch: more of each challenge moment, so a challenge eighteen teams go through doesn't
// play the same four scenes. Same rules as places/fjord-peaks.js: Jump Down is a bungee off the bridge, a jumps and
// grabs a fish out of the river with bare hands at the bottom while b waits on the bridge; Jump Around is both partners
// learning the islanders' challenge dance (the stamps, the chants, the faces) and performing it for the elders.
import { V, mergePools } from '../_kit.js';

const JD = { taskId: 'jump-dance' };
const JUMP = { taskId: 'jump-dance', side: 'jump' };
const DANCE = { taskId: 'jump-dance', side: 'dance' };

const jumpDance = {
  'task-start.any': [
    { id: 'fjp2.jd-s1', when: JUMP, turns: [
      { beat: 'The crew member wraps the towel round {a}\'s ankles, then the straps, then the cord, and gives it a hard tug.' },
      { by: 'a', say: "Why did you tug it?" },
      { by: 'b', say: "To check it. It's fine." },
    ] },
    { id: 'fjp2.jd-s2', when: JUMP, turns: [
      { by: 'b', say: "The fish swim upstream. So you face upstream when you go in." },
      { by: 'a', say: "How do I know which way that is upside down?" },
      { by: 'b', say: "Face the same way as the water's coming from." },
    ] },
    { id: 'fjp2.jd-s3', when: DANCE, turns: [
      { beat: 'The dance teacher sticks her tongue out as far as it will go and widens her eyes. {a} and {b} copy her.' },
      { by: 'a', say: "Is my tongue out far enough?" },
      { by: 'b', say: "That's far enough." },
    ] },
    { id: 'fjp2.jd-s4', when: DANCE, turns: [
      { by: 'a', say: "Slap the thighs, slap the chest, stamp. Thighs, chest, stamp." },
      { by: 'b', ...V("My thighs are going to be purple by the end of this.", "My thighs will be purple.", "Purple thighs.", "My THIGHS are going to be PURPLE by the END of this!", "I think my thighs are going to be purple after this.", "My thighs did not sign up for percussion.") },
      { by: 'a', say: "Keep going." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fjp2.jd-f1', when: JUMP, turns: [
      { beat: '{a} drops, plunges both arms into the river right up to the shoulders, and comes up hugging a fish to {a.posAdj} chest.' },
      { by: 'b', say: "You got it!" },
      { by: 'a', say: "I'm holding on to it!" },
    ] },
    { id: 'fjp2.jd-f2', when: JUMP, turns: [
      { by: 'a', say: "I opened my eyes and it was just there." },
      { by: 'b', say: "And you grabbed it?" },
      { by: 'a', say: "Yeah. I just grabbed it." },
    ] },
    { id: 'fjp2.jd-f3', when: DANCE, turns: [
      { beat: '{a} and {b} finish the dance with the last stamp at exactly the same moment. The whole bridge seems to shake.' },
      { beat: 'The elders look at each other, then the eldest nods once.' },
      { by: 'b', say: "We did it! They nodded!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fjp2.jd-a1', when: JUMP, turns: [
      { by: 'b', say: "You're grabbing at the fish. Don't grab. Scoop up from underneath." },
      { beat: 'On the next jump, {a} scoops from underneath. A fat silver fish comes up out of the water, flapping in {a.posAdj} hands.' },
      { by: 'a', say: "Scooping worked!" },
    ] },
    { id: 'fjp2.jd-a2', when: DANCE, turns: [
      { by: 'a', say: "They don't want us to copy her face. They want us to mean it." },
      { by: 'b', say: "Okay. Think about something that makes you angry." },
      { beat: 'They do the dance like they mean it. The elders nod, and the tip is theirs.' },
    ] },
    { id: 'fjp2.jd-a3', when: DANCE, turns: [
      { beat: 'Fourth time through. {a} chants the words, and for the first time, gets every one of them.' },
      { by: 'b', say: "You got the words! All the words!" },
      { beat: 'The eldest of the elders unfolds his arms and hands over the tip.' },
    ] },
  ],
  'task-try.struggling': [
    { id: 'fjp2.jd-t1', when: JUMP, turns: [
      { beat: '{a} is standing on the very edge of the bridge platform, toes over the drop, arms out, not jumping.' },
      { by: 'a', say: "I'm going on five." },
      { by: 'b', say: "You've counted to five twice." },
    ] },
    { id: 'fjp2.jd-t2', when: DANCE, turns: [
      { by: 'b', say: "You're turning left. Everybody else turns right." },
      { by: 'a', say: "Oh no. Am I?" },
      { by: 'b', say: "Yes! Turn right!" },
    ] },
    { id: 'fjp2.jd-t3', when: JD, turns: [
      { by: 'a', say: "We could switch. Dancing's safer than falling." },
      { by: 'b', say: "Falling's faster than dancing." },
      { by: 'a', say: "Okay. We keep going." },
    ] },
  ],
  'attempt-fail.any': [
    { id: 'fjp2.jd-x1', when: JUMP, turns: [
      { beat: '{a} drops, touches the river with {a.posAdj} fingertips, and the cord yanks {a.obj} back up with a handful of nothing.' },
      { by: 'a', say: "I barely touched the water!" },
      { by: 'b', say: "They'll fix it! Up you come, and again!" },
    ] },
    { id: 'fjp2.jd-x2', when: JUMP, turns: [
      { beat: '{a} comes back up holding something. It\'s an old boot.' },
      { by: 'b', say: "That's not a fish." },
      { by: 'a', say: "It was the closest thing! Next jump!" },
    ] },
    { id: 'fjp2.jd-x3', when: DANCE, turns: [
      { beat: 'Halfway through, {b} stamps so hard {b.posAdj} shoe flies off and lands at the elders\' feet.' },
      { by: 'b', say: "Sorry. Sorry." },
      { by: 'a', say: "They're shaking their heads. From the top." },
    ] },
  ],
  'task-done.any': [
    { id: 'fjp2.jd-dn1', when: JUMP, turns: [
      { by: 'a', say: "Can I let it go now? Back in the river?" },
      { by: 'b', say: "After they give us the tip." },
      { beat: 'They get the tip. {a} lets the fish go, and it swims away.' },
    ] },
    { id: 'fjp2.jd-dn2', when: DANCE, turns: [
      { by: 'b', say: "My throat hurts from the chant. My face hurts from the face." },
      { by: 'a', say: "I'm going to do that dance at every wedding I go to." },
      { by: 'b', say: "That would be amazing." },
    ] },
    { id: 'fjp2.jd-dn3', when: JD, turns: [
      { beat: '{a} and {b} run along the lakeside path, the mountains reflected perfectly in the water.' },
      { by: 'a', say: "It's so beautiful." },
      { by: 'b', say: "Look at it later. Run." },
    ] },
  ],
};

export default mergePools(jumpDance);
