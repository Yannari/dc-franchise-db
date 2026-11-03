// Fire-Mountain Isle, second batch of challenge lines. Same rules as places/fire-mountain-isle.js: lava or falls is
// an Either/Or (its start and try lines gate on the side); a swims the lagoon, b watches.
import { V, mergePools } from '../_kit.js';

const LAVA = { taskId: 'lava-falls', side: 'lava' };
const FALLS = { taskId: 'lava-falls', side: 'falls' };
const LF = { taskId: 'lava-falls' };
const LG = { taskId: 'lagoon' };
const ST = { taskId: 'statue' };

const lavaFalls = {
  'task-start.any': [
    { id: 'fmi2.lv-s1', when: LAVA, turns: [
      { beat: 'A bubble of lava pops beside the first stepping stone and spits a glowing drop onto the bank.' },
      { by: 'b', say: "Did you see that? It jumped out." },
      { by: 'a', say: "Just don't get close to it." },
    ] },
    { id: 'fmi2.lv-s2', when: LAVA, turns: [
      { by: 'a', ...V("Look at the stones, not the lava. Only ever the stones.", "Look at the stones.", "Stones. Not lava.", "Look at the STONES! NOT the LAVA!", "Just look at the stones, never at the lava.", "The lava wants eye contact. Don't give it any.") },
      { by: 'b', say: "The stones are surrounded by lava." },
      { by: 'a', say: "Then look at the middle of them." },
    ] },
    { id: 'fmi2.fl-s1', when: FALLS, turns: [
      { beat: 'The raft spins slowly as the current picks it up. The roar of the waterfall gets louder.' },
      { by: 'b', say: "Should we paddle?" },
      { by: 'a', say: "Should we? We should have started paddling a minute ago!" },
    ] },
    { id: 'fmi2.fl-s2', when: FALLS, turns: [
      { by: 'a', say: "Water's safer than lava. That's why we picked it." },
      { by: 'b', say: "I'm still scared." },
      { by: 'a', say: "You'll be fine. I'm right here." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi2.lv-f1', when: LAVA, turns: [
      { beat: '{a} and {b} hold hands and jump each stone together, landing at exactly the same moment every time.' },
      { by: 'b', say: "Together! Together! Together!" },
      { by: 'a', say: "Last one! TOGETHER!" },
      { beat: 'They land on the far bank, both feet each, not even warm.' },
    ] },
    { id: 'fmi2.lv-f2', when: LAVA, turns: [
      { by: 'b', say: "That was too easy. Was that too easy?" },
      { by: 'a', say: "My shoes are a bit hot." },
      { by: 'b', say: "That's fine. We made it." },
    ] },
    { id: 'fmi2.fl-f1', when: FALLS, turns: [
      { beat: 'The raft shoots down the rapids and spins into the pool. {a} and {b} jump out and run for the path.' },
      { by: 'a', say: "Grab the rail! Up behind the water!" },
      { beat: 'Behind the waterfall, the roar is deafening. They climb, soaked, and come out the top.' },
      { by: 'b', say: "We just walked through a waterfall!" },
    ] },
    { id: 'fmi2.fl-f2', when: FALLS, turns: [
      { by: 'b', say: "Paddle on my count! One, two! One, two!" },
      { beat: 'Paddling on the count, the raft goes straight down the middle of every rapid.' },
      { by: 'a', say: "We're actually good at this!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi2.lv-a1', when: LAVA, turns: [
      { beat: 'Back at the start, {b} watches another team cross and points at each stone they land on.' },
      { by: 'b', say: "Those ones. The flat ones. Skip the round ones." },
      { beat: 'Flat stones only. {a} and {b} make it across.' },
    ] },
    { id: 'fmi2.lv-a2', when: LAVA, turns: [
      { by: 'a', say: "Run it. Don't hop it. Run it." },
      { by: 'b', say: "Run across the lava?" },
      { by: 'a', say: "Across the stones. Fast. Too fast to fall." },
      { beat: 'Running works. They\'re across before either of them can think about it.' },
    ] },
    { id: 'fmi2.fl-a1', when: FALLS, turns: [
      { beat: '{a} and {b} drag the raft back up to the top for another go, both soaked through.' },
      { by: 'a', say: "Sit lower this time. Low in the raft." },
      { by: 'b', say: "Okay. Low." },
      { beat: 'Sitting low, they stay in the raft all the way down.' },
    ] },
    { id: 'fmi2.fl-a2', when: FALLS, turns: [
      { by: 'b', ...V("Slow down on the path. Every time we rush, we slide.", "Slow down on the path.", "Slow. Path.", "SLOW DOWN on the PATH! Every time we RUSH, we SLIDE!", "Let's slow down on the path, every time we rush we slide.", "The path rewards patience. And punishes everyone else.") },
      { by: 'a', say: "Slow. Okay." },
      { beat: 'Slowly, behind the waterfall, they reach the top without slipping.' },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi2.lf-dn1', when: LF, turns: [
      { by: 'a', say: "We picked the right one. Good choice." },
      { by: 'b', say: "It was my choice." },
      { by: 'a', say: "It was both of us." },
    ] },
    { id: 'fmi2.lf-dn2', when: LF, turns: [
      { beat: '{a} and {b} stop to catch their breath at the Don Box. A parrot squawks at them from a tree.' },
      { by: 'b', say: "Is that parrot laughing at us?" },
      { by: 'a', say: "Ignore it. Read the tip." },
    ] },
    { id: 'fmi2.lf-dn3', when: LF, turns: [
      { by: 'b', say: "Is it always this hot here?" },
      { by: 'a', say: "There's a volcano. So, yes." },
      { by: 'b', say: "I need a cold shower so badly." },
    ] },
    { id: 'fmi2.lf-dn4', when: LF, turns: [
      { beat: '{a} wrings out {a.posAdj} shirt and fans {a.ref} with the tip at the same time.' },
      { by: 'a', say: "I'm wet and boiling at the same time." },
      { by: 'b', say: "Come on. The lagoon." },
    ] },
  ],
};

const lagoon = {
  'task-start.any': [
    { id: 'fmi2.lg-s1', when: LG, turns: [
      { beat: 'The old sea mine bobs gently in the middle of the lagoon, covered in spikes and barnacles.' },
      { by: 'a', say: "Is that thing live? Tell me that thing isn't live." },
      { by: 'b', say: "It's very old. It's fine." },
      { by: 'a', say: "You don't know that." },
    ] },
    { id: 'fmi2.lg-s2', when: LG, turns: [
      { by: 'b', say: "Stay calm. Don't splash." },
      { by: 'a', say: "Okay. Calm." },
      { by: 'b', say: "And don't touch the mine." },
    ] },
    { id: 'fmi2.lg-s3', when: LG, turns: [
      { beat: '{a} stretches on the beach like a professional swimmer, swinging both arms in big circles.' },
      { by: 'b', ...V("You're stretching? Everyone else is already in the water!", "Stop stretching!", "Go!", "You're STRETCHING? Everyone's ALREADY in!", "Why are you stretching? Everyone else is already swimming.", "Stretch later. Win now.") },
      { by: 'a', say: "If I cramp halfway, we lose. Two seconds." },
    ] },
    { id: 'fmi2.lg-s4', when: LG, turns: [
      { by: 'a', say: "What's in the water? Is there anything in the water?" },
      { by: 'b', say: "Fish. Just fish." },
      { by: 'a', say: "Just fish?" },
      { by: 'b', say: "Just fish. Go!" },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi2.lg-f1', when: LG, turns: [
      { beat: '{a} swims a wide curve round the mine, never closer than a long arm\'s length, and touches the rocks.' },
      { by: 'b', say: "You went so wide! It was perfect!" },
      { by: 'a', say: "I wasn't going anywhere near it." },
    ] },
    { id: 'fmi2.lg-f2', when: LG, turns: [
      { by: 'b', say: "Faster! Faster! You're doing it!" },
      { beat: '{a} reaches the rocks, climbs up, grabs the tip and holds it over {a.posAdj} head.' },
      { by: 'a', say: "I got it! I got it!" },
    ] },
    { id: 'fmi2.lg-f3', when: LG, turns: [
      { beat: 'A little turtle swims beside {a} for part of the way across.' },
      { by: 'b', say: "There's a turtle with you!" },
      { by: 'a', say: "I know! It's so cute!" },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi2.lg-a1', when: LG, turns: [
      { by: 'b', say: "Swim with your head up. You can't see the mine with your face in the water." },
      { by: 'a', say: "Head up is slower." },
      { by: 'b', say: "Head up means you don't hit the mine." },
      { beat: 'Head up, {a} goes round the mine without coming close, and reaches the rocks.' },
    ] },
    { id: 'fmi2.lg-a2', when: LG, turns: [
      { beat: '{a} sits on the beach, gets {a.posAdj} breath back, and points at a line of rocks under the water.' },
      { by: 'a', say: "Follow the rocks. They go right round the edge." },
      { by: 'b', say: "That's longer." },
      { by: 'a', say: "Longer, but there's no mine on it." },
    ] },
    { id: 'fmi2.lg-a3', when: LG, turns: [
      { by: 'a', say: "I touched it. I can't believe I touched it." },
      { by: 'b', say: "Then don't touch it again. Go wider." },
      { beat: 'Much wider, and {a} gets the tip.' },
    ] },
    { id: 'fmi2.lg-a4', when: LG, turns: [
      { beat: 'Third swim. {b} shouts directions from the beach the whole way: left, left, straight, right.' },
      { by: 'b', say: "Right! Now right! Now just swim!" },
      { by: 'a', say: "I'm swimming! I'm listening and swimming!" },
      { beat: '{a} touches the rocks and grabs the tip.' },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi2.lg-dn1', when: LG, turns: [
      { by: 'a', say: "Salt water. In my nose, in my ears, everywhere." },
      { by: 'b', say: "But you've got the tip." },
      { by: 'a', say: "I've got the tip. That's all I care about." },
    ] },
    { id: 'fmi2.lg-dn2', when: LG, turns: [
      { beat: '{b} wraps a towel round {a}, who is shivering in the hot sun.' },
      { by: 'b', say: "How are you cold? It's boiling." },
      { by: 'a', say: "I don't know. I'm just shaking." },
    ] },
    { id: 'fmi2.lg-dn3', when: LG, turns: [
      { by: 'b', say: "You were incredible. You swam past a mine." },
      { by: 'a', say: "Say it again." },
      { by: 'b', say: "You swam past a mine." },
      { by: 'a', say: "I swam past a mine." },
    ] },
    { id: 'fmi2.lg-dn4', when: LG, turns: [
      { beat: '{a} shakes water out of one ear, then the other, hopping on one leg.' },
      { by: 'a', say: "Logs and pineapples. The tip says logs and pineapples." },
      { by: 'b', say: "Logs and pineapples? For what?" },
      { by: 'a', say: "It's a statue." },
    ] },
    { id: 'fmi2.lg-dn5', when: LG, turns: [
      { by: 'a', say: "I'm never swimming again." },
      { by: 'b', say: "You love swimming." },
      { by: 'a', say: "Not any more." },
    ] },
  ],
};

const statue = {
  'task-start.any': [
    { id: 'fmi2.su-s1', when: ST, turns: [
      { beat: '{b} holds a pineapple up next to {a}\'s head and squints at it.' },
      { by: 'b', say: "Yes. That's your head." },
      { by: 'a', say: "Thanks a lot." },
    ] },
    { id: 'fmi2.su-s2', when: ST, turns: [
      { by: 'a', say: "Big logs at the bottom. Small logs at the top. Like a tower." },
      { by: 'b', say: "And a pineapple on top." },
      { by: 'a', say: "Okay. Pass me a log." },
    ] },
    { id: 'fmi2.su-s3', when: ST, turns: [
      { beat: 'Another team is already tying a pineapple to the top of their statue.' },
      { by: 'b', ...V("They've got a head already. We haven't even got feet.", "They've got a head already.", "Head already.", "They've got a HEAD already! We haven't got FEET!", "They've already got a head on theirs, and we've got no feet.", "Their statue is thinking. Ours isn't born yet.") },
      { by: 'a', say: "Then we build faster. Pass me a log." },
    ] },
    { id: 'fmi2.su-s4', when: ST, turns: [
      { by: 'b', say: "Should it smile? Can a pineapple smile?" },
      { by: 'a', say: "Carve a smile in it. A big one." },
      { by: 'b', say: "Okay. A big smile." },
    ] },
  ],
  'task-try.first-try': [
    { id: 'fmi2.su-f1', when: ST, turns: [
      { beat: '{a} and {b} carry the statue up the path between them, steady and slow, all the way to the rim.' },
      { by: 'b', say: "One, two, three, throw!" },
      { beat: 'The statue sails over the edge and disappears into the smoke.' },
      { by: 'a', say: "Perfect throw!" },
    ] },
    { id: 'fmi2.su-f2', when: ST, turns: [
      { by: 'a', say: "It's strong. It's not even wobbling." },
      { by: 'b', say: "That's because I used so many vines." },
      { beat: 'Every vine holds. The statue reaches the crater in one piece.' },
    ] },
    { id: 'fmi2.su-f3', when: ST, turns: [
      { beat: 'Halfway up, {a} and {b} start singing a marching song to keep in step.' },
      { by: 'a', say: "Left! Right! Left! Right!" },
      { by: 'b', say: "That's not a song." },
      { beat: 'It works anyway. They reach the rim in step.' },
    ] },
  ],
  'task-try.after-fails': [
    { id: 'fmi2.su-a1', when: ST, turns: [
      { by: 'b', say: "We keep tripping because we can't see over it. Carry it lying down." },
      { by: 'a', say: "Like a stretcher?" },
      { by: 'b', say: "Like a stretcher. Yes." },
      { beat: 'Carried lying down, the statue goes up without a hitch.' },
    ] },
    { id: 'fmi2.su-a2', when: ST, turns: [
      { beat: '{a} and {b} rebuild the statue on the beach with half as many logs.' },
      { by: 'a', say: "It's very thin now." },
      { by: 'b', say: "Thin is good. It's lighter." },
      { beat: 'The thin statue is light enough to carry all the way up.' },
    ] },
    { id: 'fmi2.su-a3', when: ST, turns: [
      { by: 'a', ...V("Rest at every bend. Just for a breath. Then go.", "Rest at every bend.", "Rest. Then go.", "REST at every BEND! Just a BREATH! Then GO!", "Let's rest at every bend for a breath, then go.", "Each bend is a tiny holiday.") },
      { by: 'b', say: "We'll be last." },
      { by: 'a', say: "Better last with a statue than not finished at all." },
      { beat: 'Resting at every bend, they make it to the rim.' },
    ] },
    { id: 'fmi2.su-a4', when: ST, turns: [
      { beat: 'The statue\'s pineapple head is gone again. {b} jams a coconut in its place.' },
      { by: 'b', say: "There. It's got a head again." },
      { by: 'a', say: "It doesn't look like me any more." },
      { by: 'b', say: "It doesn't matter. Let's go." },
    ] },
  ],
  'task-done.any': [
    { id: 'fmi2.su-dn1', when: ST, turns: [
      { by: 'a', say: "Should we say something? A few words?" },
      { by: 'b', say: "Bye, statue. Thanks for not falling apart." },
      { by: 'a', say: "Okay. Let's go." },
    ] },
    { id: 'fmi2.su-dn2', when: ST, turns: [
      { beat: 'Smoke rolls up out of the crater. {a} and {b} back away from the edge.' },
      { by: 'b', say: "Is that normal? Is that okay?" },
      { by: 'a', say: "I think so. Let's not stay to find out." },
    ] },
    { id: 'fmi2.su-dn3', when: ST, turns: [
      { by: 'b', say: "My hands are sticky with pineapple." },
      { by: 'a', say: "Mine are covered in bark." },
      { by: 'b', say: "We need to wash so badly." },
    ] },
    { id: 'fmi2.su-dn4', when: ST, turns: [
      { beat: '{a} and {b} sit on a rock near the rim, looking out over the whole island.' },
      { by: 'a', say: "Lava, a lagoon, and a statue. In one day." },
      { by: 'b', say: "And a volcano. Don't forget the volcano." },
    ] },
    { id: 'fmi2.su-dn5', when: ST, turns: [
      { by: 'a', say: "Run. Run before something else happens." },
      { by: 'b', say: "What else could happen?" },
      { by: 'a', say: "I don't know. I don't want to find out." },
    ] },
  ],
};

export default mergePools(lavaFalls, lagoon, statue);
