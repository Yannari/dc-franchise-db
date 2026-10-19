// The Either/Ors at Fire-Mountain Isle (lava or falls) and Tomb Sands (over or under), a third batch. Measured
// 2026-10-19 over eight seasons: lava-falls aired general lines 29% of the time, the pyramid 22%. Each side had one or
// two lines for a struggle and for a failed attempt, so those moments fell through. The rules, as the challenges
// describe them: on the lava stones a slip sends you back to the bank; the falls is a raft, then a slippery path behind
// the waterfall; over the pyramid a slip sends you back to the bottom; under it, three doorways, and the wrong one is a
// dead end, a trap or a room of scarab beetles.
import { mergePools } from '../_kit.js';

const LAVA = { taskId: 'lava-falls', side: 'lava' };
const FALLS = { taskId: 'lava-falls', side: 'falls' };
const LF = { taskId: 'lava-falls' };
const OVER = { taskId: 'pyramid', side: 'over' };
const UNDER = { taskId: 'pyramid', side: 'under' };
const PY = { taskId: 'pyramid' };
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

const lavaFalls = {
  'task-start.any': [
    { id: 'eo.lv-s1', when: LAVA, turns: [
      beat('{a} and {b} stand at the edge of the lava river. The first stone is closer than it looks, and hotter.'),
      by('b', "You first. You've got the bigger shoes."),
      by('a', "That's not how shoes work."),
    ] },
    { id: 'eo.lv-s2', when: LAVA, turns: [
      by('a', "Small jumps. Stone to stone. Don't stop on any of them."),
      by('b', "What happens if I stop?"),
      by('a', "Your shoes find out what lava is."),
    ] },
    { id: 'eo.fl-s1', when: FALLS, turns: [
      beat('{a} and {b} push the raft off the bank. It spins round twice before it goes anywhere.'),
      by('b', "We're going backwards."),
      by('a', "We're going in a circle. Paddle on your side."),
      by('b', "I am paddling on my side!"),
    ] },
    { id: 'eo.fl-s2', when: FALLS, turns: [
      by('a', "Raft, then the path behind the waterfall. Slower, but nobody melts."),
      by('b', "I like nobody melting."),
      by('a', "Me too. Get in."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'eo.lv-t1', when: LAVA, turns: [
      beat('{b} is frozen on a stone in the middle of the river, arms out, wobbling.'),
      by('b', "I can't do the next one. It's too far."),
      by('a', "It's the same distance as the last one."),
      by('b', "The last one wasn't over lava!"),
      by('a', "They're all over lava!"),
    ] },
    { id: 'eo.lv-t2', when: LAVA, turns: [
      by('a', "My feet are hot. Are your feet hot?"),
      by('b', "Everything is hot. The air is hot."),
      by('a', "Then let's get to the other side before we're cooked."),
    ] },
    { id: 'eo.fl-t1', when: FALLS, turns: [
      beat('Behind the waterfall, {a} grips the wet rock with both hands, soaked through.'),
      by('a', "It's so slippery. Everything's slippery."),
      by('b', "One hand, then the next. Don't let go of both."),
    ] },
    { id: 'eo.fl-t2', when: FALLS, turns: [
      by('b', "We've been on this raft for twenty minutes."),
      by('a', "The lava teams are already across, aren't they?"),
      by('b', "Don't think about the lava teams. Paddle."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'eo.lv-x1', when: LAVA, turns: [
      beat('{a} lands on a stone that tips. {a} hops straight back to the bank with a yelp.'),
      by('a', "That one moves! Nobody said they move!"),
      by('b', "Then don't stand on that one. Start again."),
    ] },
    { id: 'eo.lv-x2', when: LAVA, turns: [
      beat('{b} slips, windmills both arms, and is sent back to the start of the stones.'),
      by('b', "I was nearly there!"),
      by('a', "Nearly there is still back here. Come on."),
    ] },
    { id: 'eo.fl-x1', when: FALLS, turns: [
      beat("{a}'s foot slides off the wet path, and {a} drops into the pool under the falls with a splash."),
      by('a', "I'm fine! I'm wet, but I'm fine!"),
      by('b', "You were already wet. Climb back up."),
    ] },
    { id: 'eo.fl-x2', when: FALLS, turns: [
      beat('The raft hits a rock and spins them both into the shallows.'),
      by('b', "Where's the paddle? Where did the paddle go?"),
      by('a', "Downstream. With our dignity."),
    ] },
  ],
  'task-done.any': [
    { id: 'eo.lf-dn1', when: LF, turns: [
      beat('{a} and {b} stagger into the clearing on the far side, steaming slightly.'),
      by('a', "We're across. Is there a Don Box?"),
      by('b', "There's a Don Box. There is a beautiful, beautiful Don Box."),
    ] },
    { id: 'eo.lf-dn2', when: LF, turns: [
      by('b', "I never want to see a river again. Of anything."),
      by('a', "Agreed. No more rivers."),
      by('b', "Watch, the next tip says 'swim'."),
    ] },
    { id: 'eo.lf-dn3', when: LF, turns: [
      by('a', "Did we pick the right side?"),
      by('b', "We're on the other side, so yes. Every side is the right side if you get across."),
      by('a', "That's very wise."),
      by('b', "It's the heat. I'm delirious."),
    ] },
  ],
};

const pyramid = {
  'task-start.any': [
    { id: 'eo.ov-s1', when: OVER, turns: [
      beat('{a} looks up at the first giant stone step. It comes up to {a.posAdj} chest.'),
      by('a', "That's one step?"),
      by('b', "That's one step. There are about three hundred more."),
    ] },
    { id: 'eo.ov-s2', when: OVER, turns: [
      by('b', "Over the top and down the other side. How hard can it be?"),
      by('a', "It's a pyramid. It's the original hard thing."),
      by('b', "Then let's be the original fast people."),
    ] },
    { id: 'eo.un-s1', when: UNDER, turns: [
      beat('{a} and {b} step into the tomb. Their torch lights up three doorways, each with a different symbol.'),
      by('b', "A bird, an eye and a snake."),
      by('a', "Not the snake. Whatever we do, not the snake."),
    ] },
    { id: 'eo.un-s2', when: UNDER, turns: [
      by('a', "Underneath is quicker, as long as we pick the right door."),
      by('b', "And if we pick the wrong door?"),
      by('a', "Then it's slower, and there are beetles."),
    ] },
  ],
  'task-try.struggling': [
    { id: 'eo.ov-t1', when: OVER, turns: [
      beat('Halfway up, {b} sits on a step and refuses to look anywhere but straight ahead.'),
      by('b', "Is the top getting closer? It doesn't feel like it's getting closer."),
      by('a', "It's getting closer. I promise. Pyramids work like that."),
    ] },
    { id: 'eo.ov-t2', when: OVER, turns: [
      by('a', "My legs have stopped. They've just stopped working."),
      by('b', "Then use your arms. Pull yourself up."),
      by('a', "My arms have opinions about that, too."),
    ] },
    { id: 'eo.un-t1', when: UNDER, turns: [
      beat("In the dark, {a}'s torch flickers and nearly goes out."),
      by('a', "Don't you dare. Don't you dare go out."),
      by('b', "Shake it. Shake it, it'll come back."),
      beat('{a} shakes it. It comes back, weaker.'),
    ] },
    { id: 'eo.un-t2', when: UNDER, turns: [
      by('b', "We've been past this statue before."),
      by('a', "We have not."),
      by('b', "It's got the same chip in its nose. We're going round in circles."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'eo.ov-x1', when: OVER, turns: [
      beat("A loose stone shifts under {a}'s hand, and {a} slides all the way back down to the sand."),
      by('a', "I'm at the bottom. Again."),
      by('b', "Then come back up. Slowly. And pick better stones."),
    ] },
    { id: 'eo.ov-x2', when: OVER, turns: [
      beat('{b} misses a step on the way down the far side and bumps down three more on {b.posAdj} backside.'),
      by('b', "Ow. Ow. That's not how I wanted to go down."),
      by('a', "Back up to where you slipped. That's the rule."),
    ] },
    { id: 'eo.un-x1', when: UNDER, turns: [
      beat('The doorway ends in a blank stone wall. A dead end.'),
      by('b', "It's a wall. We picked the wall."),
      by('a', "Back. Back to the three doors. Not the snake, not the wall."),
    ] },
    { id: 'eo.un-x2', when: UNDER, turns: [
      beat('A slab grinds shut behind them, and they have to squeeze back out the way they came.'),
      by('a', "That was a trap. That was an actual trap."),
      by('b', "Then the other door. Quickly, before the next trap."),
    ] },
  ],
  'task-done.any': [
    { id: 'eo.py-dn1', when: PY, turns: [
      beat('{a} and {b} come out on the far side of the pyramid, covered in sand and dust.'),
      by('a', "We're out. We did the pyramid."),
      by('b', "We did a pyramid. Tell everybody. Tell my mother."),
    ] },
    { id: 'eo.py-dn2', when: PY, turns: [
      by('b', "That was four thousand years of history, and I mostly saw the back of your shoes."),
      by('a', "They're very historical shoes now."),
      by('b', "Grab the tip. Let's go."),
    ] },
    { id: 'eo.py-dn3', when: PY, turns: [
      beat('{a} hugs the last stone on the way out, very briefly.'),
      by('a', "Thank you, pyramid."),
      by('b', "Did you just thank the pyramid?"),
      by('a', "It let us go. That deserves a thank you."),
    ] },
  ],
};

export default mergePools(lavaFalls, pyramid);
