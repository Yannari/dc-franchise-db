// Ice River's own lines (js/rr/places/ice-river.js), in our own words:
//   the bush plane  onto the snow: its skis stuck.
//   the ice floes   All-In: jump floe to floe across a river of melting ice; a floe that tips, cracks or sinks and it's
//                   the freezing water and the swim back.
//   the sled        All-In: one pulls, one rides, swap when the puller gives out; tip it, lose the flags or run from the
//                   polar bear and it's back to the last flag.
// Gated on place / taskId / mishap.
import { mergePools } from './_kit.js';

const P = { place: 'ice-river' };
const IF = { taskId: 'ice-floes' };
const SL = { taskId: 'sled' };
const don = say => ({ by: 'don', say });
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

// ── the place ──
const place = {
  'don-opener.annoyed': [
    { id: 'icr.op1', when: P, turns: [
      beat("Don stands on a snowbank beside a wide river full of floating ice, in three coats, a hat with ear flaps, and mittens on a string."),
      don("Welcome to Ice River! The coldest leg of the race. I've lost feeling in parts of myself I didn't know had feeling."),
      don("Today, teams cross this river without a boat, and then one of you pulls the other across the snow. Like a husky. A very slow husky."),
      beat('A chunk of ice the size of a car drifts past behind him, turns slowly, and cracks in two.'),
    ] },
    { id: 'icr.op2', when: P, turns: [
      don("Ice River. The river freezes in winter, melts in spring, and today it's doing both at once. That's the problem."),
      don("Racers, a bush plane will drop you at the river. Wear everything you own. Then put on something else."),
      beat('A small plane on skis taxis across the snow behind him, spraying him with powder. He does not react. He is too cold to react.'),
    ] },
  ],
  'don-opener.bored': [
    { id: 'icr.op3', when: P, turns: [
      beat("Don is inside a log cabin, feet up by a roaring fire, mug of cocoa in hand, the window frosted over."),
      don("Ice River. It's warm in here. It is not warm out there. The plane's on the snow."),
      don("Off you go. I'll be watching. Through the frost."),
    ] },
  ],
  'arrival-awe.wonder': [
    { id: 'icr.ar1', when: P, turns: [
      beat("The bush plane banks over a white wilderness, and below them the river winds through the snow, glittering with floating ice."),
      by('a', "It's like a river made of broken glass."),
      by('b', "It's beautiful. I've never seen anything this white."),
      by('a', "Or this cold. Look at the trees, they're frozen solid."),
    ] },
    { id: 'icr.ar2', when: P, turns: [
      beat("Far off across the snow, a huge white shape lifts its head, sniffs the air, and lies back down."),
      by('b', "Is that a polar bear? Was that a real polar bear?"),
      by('a', "It looked at us. It definitely looked at us."),
    ] },
  ],
  'arrival-awe.dread': [
    { id: 'icr.ad1', when: P, turns: [
      by('a', "The tip says 'cross the river'. There's no bridge."),
      by('b', "There's ice. Floating ice."),
      by('a', "That's not a bridge. That's a suggestion."),
    ] },
    { id: 'icr.ad2', when: P, turns: [
      by('b', "My eyelashes have frozen. Every single one."),
      by('a', "My nose has frozen."),
      by('b', "Your whole face has frozen. You just haven't noticed."),
    ] },
  ],
};

// ── the bush plane (mishap) ──
const roads = {
  'travel-mishap.any': [
    { id: 'icr.tm1', when: { taskId: 'river-hop', mishap: 'skis-stuck-in-snow' }, turns: [
      beat("The bush plane lands, slides, and stops with a lurch. Its skis have sunk deep into a snowdrift."),
      by('a', "Are we stuck? Is the plane stuck?"),
      by('b', "The pilot's getting out a shovel. So, yes."),
      beat('Twenty minutes of digging later, they climb out and head for the river.'),
    ] },
  ],
};

// ── the ice floes (All-In) ──
const floes = {
  'don-demo.gag': [
    { id: 'icr.if-d1', when: IF, turns: [
      don("In this All-In, cross the river by jumping from ice floe to ice floe. Pick the big ones. They float. The small ones, less so."),
      beat('He steps onto a small floe at the edge to demonstrate. It tips, and he steps straight back onto the bank, one boot soaked.'),
      don("That was a small one. Learn from me. Don't do what I just did."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'icr.if-d2', when: IF, turns: [
      don("If a floe tips, cracks, or sinks under you, you're in the river, and you swim back to the start and dry off before you try again."),
      don("Both of you standing on the far bank gets you the next tip. The water is just above freezing. Just."),
      beat('A floe in the middle of the river cracks in half with a loud snap.'),
    ] },
  ],
  'task-start.any': [
    { id: 'icr.if-s1', when: IF, turns: [
      beat("{a} and {b} stand at the edge of the river, watching the ice floes drift slowly past."),
      by('a', "Which one first?"),
      by('b', "The big flat one. When it comes close. Wait for it."),
    ] },
    { id: 'icr.if-s2', when: IF, turns: [
      by('b', "Jump together, or one at a time?"),
      by('a', "One at a time. If we both jump on the same one, it'll tip."),
      by('b', "Then you first."),
    ] },
    { id: 'icr.if-s3', when: IF, turns: [
      beat("{a} jumps onto the first floe. It rocks, wobbles, and holds."),
      by('a', "It's holding! Come on!"),
      by('b', "Is it slippery?"),
      by('a', "It's ice! Of course it's slippery!"),
    ] },
    { id: 'icr.if-s4', when: IF, turns: [
      by('a', "Look for the white ones. The white ones are thicker."),
      by('b', "They're all white."),
      by('a', "Look for the whitest white ones."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'icr.if-f1', when: IF, turns: [
      beat("{a} and {b} hop from floe to floe, perfectly in rhythm, and land on the far bank without even getting their boots wet."),
      by('b', "Dry! We're both dry!"),
      by('a', "First try! Across a river of ice! Dry!"),
    ] },
    { id: 'icr.if-f2', when: IF, turns: [
      by('a', "That one! Now! Jump!"),
      beat("{b} jumps. The floe holds. One more jump, and both of them are on the far bank."),
      by('b', "We did it! You picked every floe perfectly!"),
    ] },
    { id: 'icr.if-f3', when: IF, turns: [
      beat("A huge floe drifts right across the river like a bridge. {a} and {b} run across it before it moves."),
      by('a', "A bridge! The river made us a bridge!"),
      by('b', "Don't stop running till we're on the bank!"),
    ] },
    { id: 'icr.if-f4', when: IF, turns: [
      by('b', "First go. Not even a splash."),
      by('a', "I've never been so proud of my feet."),
      by('b', "Your feet were amazing."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'icr.if-a1', when: IF, turns: [
      by('b', "We keep picking floes that are too small. This time, only the biggest ones. Even if we have to wait."),
      beat("They wait for the biggest floes, and cross without tipping once."),
      by('a', "Waiting works! Waiting always works!"),
    ] },
    { id: 'icr.if-a2', when: IF, turns: [
      beat("Wrapped in a blanket and still shivering from the last swim, {a} jumps again, and this time every floe holds."),
      by('a', "Across! Finally across!"),
      by('b', "And not wet this time! Mostly not wet!"),
    ] },
    { id: 'icr.if-a3', when: IF, turns: [
      by('a', "Land in the middle of each floe. Not on the edge. The edge tips."),
      beat("{a} lands dead in the middle of every floe, and {b} follows exactly. They reach the far bank."),
      by('b', "The middle! Always the middle!"),
    ] },
    { id: 'icr.if-a4', when: IF, turns: [
      beat("Third try, both of them soaked, but {a} and {b} finally reach the far bank on top of the ice."),
      by('a', "We did it! I can't feel my legs, but we did it!"),
      by('b', "Get to a fire! Any fire!"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'icr.if-t1', when: IF, turns: [
      beat("{a} is standing on a floe in the middle of the river, drifting slowly downstream, away from the next one."),
      by('a', "I'm going the wrong way! The river's taking me!"),
      by('b', "Jump to the next one! Quick, before it's too far!"),
    ] },
    { id: 'icr.if-t2', when: IF, turns: [
      by('b', "I can't jump. I'm too scared. That gap's too big."),
      by('a', "It's not too big! I'll catch you!"),
      by('b', "You can't even catch a ball!"),
    ] },
    { id: 'icr.if-t3', when: IF, turns: [
      beat("{a} and {b} are standing on the same floe, which is slowly tipping to one side."),
      by('a', "Don't move! Don't move at all!"),
      by('b', "I'm not moving! It's moving!"),
    ] },
  ],
  'task-done.any': [
    { id: 'icr.if-dn1', when: IF, turns: [
      by('a', "I'm never complaining about a puddle again."),
      by('b', "You were complaining about the cold the whole way."),
      by('a', "I'm still complaining about the cold. Not puddles."),
    ] },
    { id: 'icr.if-dn2', when: IF, turns: [
      beat("{a} and {b} run up the far bank towards the sled, stamping their feet to get warm."),
      by('b', "A sled. We pull a sled now."),
      by('a', "At least pulling a sled is warm work."),
    ] },
    { id: 'icr.if-dn3', when: IF, turns: [
      by('b', "We crossed a river. Without a boat."),
      by('a', "Without a bridge."),
      by('b', "With nothing but ice and courage."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'icr.if-x1', when: IF, turns: [
      beat("{a} jumps onto a floe. It tips straight over, and {a} slides into the freezing river with a splash and a scream."),
      by('a', "Cold! Cold! So, so cold!"),
      by('b', "Swim back! Swim back to the bank!"),
    ] },
    { id: 'icr.if-x2', when: IF, turns: [
      beat("The floe under {b} cracks down the middle, and one half sinks."),
      by('b', "It broke! It broke under me!"),
      by('a', "Back to the start! Get out of the water!"),
    ] },
    { id: 'icr.if-x3', when: IF, turns: [
      beat("{a} jumps for a floe, misses by a hand's width, and lands in the river."),
      by('a', "So close! It was so close!"),
      by('b', "Close is still wet! Back!"),
    ] },
  ],
};

// ── the sled (All-In) ──
const sled = {
  'don-demo.gag': [
    { id: 'icr.sl-d1', when: SL, turns: [
      don("In this All-In, one of you rides the sled, the other pulls it across the snow to the ice cliff. Swap when the puller gives out."),
      beat('He sits on a sled, points forward, and waits for somebody to pull him. Nobody does. He waits a little longer.'),
      don("This is how it works when you have a team. I don't have a team. I have an intern, and he's on a break."),
    ] },
  ],
  'don-demo.dry': [
    { id: 'icr.sl-d2', when: SL, turns: [
      don("Follow the flags. If the sled tips, if you lose the flags, or if you have to run from the polar bear, you go back to the last flag and carry on."),
      don("The polar bear is real. He's far away. Mostly. Get to the ice cliff with your sled, and you're at the Chill Zone."),
      beat('Far off across the snow, a white shape stands up, stretches, and starts walking in no particular direction.'),
    ] },
  ],
  'task-start.any': [
    { id: 'icr.sl-s1', when: SL, turns: [
      beat("{b} climbs onto the sled, and {a} grabs the harness and pulls. Nothing happens. {a} pulls harder. The sled moves an inch."),
      by('a', "Why are you so heavy?"),
      by('b', "I'm wearing four coats!"),
    ] },
    { id: 'icr.sl-s2', when: SL, turns: [
      by('b', "Short steps. Lean forward. Like pulling a car."),
      by('a', "Have you ever pulled a car?"),
      by('b', "No, but I've seen it on television."),
    ] },
    { id: 'icr.sl-s3', when: SL, turns: [
      beat("{a} gets the sled moving, and once it's moving, it slides along the snow almost by itself."),
      by('a', "It's easier once it's going! Keep it going!"),
      by('b', "I'll keep sitting! You keep pulling!"),
    ] },
    { id: 'icr.sl-s4', when: SL, turns: [
      by('a', "Where's the next flag?"),
      by('b', "Over there. Near the bear."),
      by('a', "Of course it's near the bear."),
    ] },
  ],
  'task-try.first-try': [
    { id: 'icr.sl-f1', when: SL, turns: [
      beat("{a} pulls the sled flag to flag across the white plain in one steady march, and drags it up to the foot of the ice cliff."),
      by('b', "We're here! We made it! You pulled me the whole way!"),
      by('a', "Don't talk to me. I need to lie down in the snow."),
    ] },
    { id: 'icr.sl-f2', when: SL, turns: [
      by('b', "Swap! My turn to pull!"),
      beat("They swap at every flag, pulling in turns, and the sled flies across the snow to the ice cliff."),
      by('a', "Taking turns! The best idea we've ever had!"),
    ] },
    { id: 'icr.sl-f3', when: SL, turns: [
      beat("The sled reaches a downhill slope. {a} jumps on behind {b}, and they slide all the way down to the cliff."),
      by('b', "Wheeee! Downhill! Thank you, downhill!"),
      by('a', "Best part of the whole race!"),
    ] },
    { id: 'icr.sl-f4', when: SL, turns: [
      by('a', "First try. Every flag. No bear."),
      by('b', "The bear didn't even look at us."),
      by('a', "The bear has taste."),
    ] },
  ],
  'task-try.after-fails': [
    { id: 'icr.sl-a1', when: SL, turns: [
      by('b', "We keep tipping on the bumps. So I lean the other way every time we hit one."),
      beat("{b} leans against every bump, and the sled stays upright all the way to the ice cliff."),
      by('a', "Leaning! You're a natural leaner!"),
    ] },
    { id: 'icr.sl-a2', when: SL, turns: [
      beat("Back at the last flag for the second time, {a} pulls with everything left, and the sled reaches the ice cliff."),
      by('a', "That's it! That's the cliff! We're there!"),
      by('b', "You did it! You pulled me all the way!"),
    ] },
    { id: 'icr.sl-a3', when: SL, turns: [
      by('a', "We lost the flags last time. So you watch for flags. Only for flags."),
      beat("{b} watches for flags and nothing else, calling every turn. They reach the ice cliff."),
      by('b', "Flag spotter! I'm the official flag spotter!"),
    ] },
    { id: 'icr.sl-a4', when: SL, turns: [
      beat("After running from the bear once and tipping twice, {a} and {b} finally drag the sled to the foot of the ice cliff."),
      by('a', "We're here. We're actually here."),
      by('b', "Is the bear behind us?"),
    ] },
  ],
  'task-try.struggling': [
    { id: 'icr.sl-t1', when: SL, turns: [
      beat("{a} has stopped pulling and is lying face down in the snow, the harness still round {a.posAdj} shoulders."),
      by('a', "I can't. My legs have stopped."),
      by('b', "Swap! Swap with me! Get on the sled!"),
    ] },
    { id: 'icr.sl-t2', when: SL, turns: [
      by('b', "Which way is the flag? I can't see any flags."),
      by('a', "Everything's white. The snow, the sky, everything."),
      by('b', "We're lost in white."),
    ] },
    { id: 'icr.sl-t3', when: SL, turns: [
      beat("The polar bear stands up in the distance, looks right at them, and starts walking their way."),
      by('a', "Is it coming? Is it coming at us?"),
      by('b', "Pull! Pull faster! Pull like a bear is coming!"),
    ] },
  ],
  'task-done.any': [
    { id: 'icr.sl-dn1', when: SL, turns: [
      by('a', "I'll never take a car for granted again."),
      by('b', "Or a sled dog."),
      by('a', "Especially not a sled dog. They're heroes."),
    ] },
    { id: 'icr.sl-dn2', when: SL, turns: [
      beat("{a} and {b} climb the last bit to the ice cliff, holding each other up, the sled left at the bottom."),
      by('b', "Is that the Chill Zone? Up there?"),
      by('a', "Up there. Last climb. Come on."),
    ] },
    { id: 'icr.sl-dn3', when: SL, turns: [
      by('b', "You pulled me across a whole frozen plain."),
      by('a', "You pulled me across half."),
      by('b', "Then we're even."),
    ] },
  ],
  'attempt-fail.any': [
    { id: 'icr.sl-x1', when: SL, turns: [
      beat("The sled hits a hidden bump, tips over, and {b} rolls off into a snowdrift."),
      by('b', "I'm in the snow! I'm in a lot of snow!"),
      by('a', "Back to the last flag! Get back on!"),
    ] },
    { id: 'icr.sl-x2', when: SL, turns: [
      beat("{a} looks round. No flags anywhere. Just white, in every direction."),
      by('a', "Where did the flags go?"),
      by('b', "We lost them. Back to the last one."),
    ] },
    { id: 'icr.sl-x3', when: SL, turns: [
      beat("The polar bear wanders onto the trail ahead. {a} and {b} drag the sled the other way as fast as they can."),
      by('a', "Wrong way! We're going the wrong way!"),
      by('b', "Wrong way is the right way when there's a bear!"),
    ] },
  ],
};

export default mergePools(place, roads, floes, sled);
