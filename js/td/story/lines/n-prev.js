// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-prev.js — the host's "Previously on..." (td/story/previously.js)
// ══════════════════════════════════════════════════════════════════════
// h is the host. {show} is the show's name. Names are last episode's people. The tease (fact
// tease: merge / power / trust / any) may hint at the kind of night, never at who goes.
// Ids: 'npv.'.

export default {
  'prev.open.any': [
    { id: 'npv.o4', turns: [{ by: 'h', say: "Last time on {show}, the campers found out just how far they'd go for a little bit of safety." }] },
    { id: 'npv.o5', turns: [{ by: 'h', say: "Previously on {show}! Let's catch you up, because a lot went down." }] },
    { id: 'npv.o1', turns: [{ by: 'h', say: "Last time on {show}..." }] },
    { id: 'npv.o2', turns: [{ by: 'h', say: "Previously, on {show}!" }] },
    { id: 'npv.o3', turns: [{ by: 'h', say: "Last time on {show}, things got messy. Even messier than usual." }] },
  ],
  // {chal} is last episode's challenge; {win} won it, {lose} lost it; {x} was the winning team's best score, {y} the losers' worst
  'prev.chal.any': [
    { id: 'npv.h1', when: { sank: true, carried: true }, turns: [{ by: 'h', say: "At {chal}, {win} came out on top, thanks mostly to {x}. {lose} wasn't so lucky, and a lot of fingers pointed at {y}." }] },
    { id: 'npv.h2', when: { sank: true }, turns: [{ by: 'h', say: "{chal} went great for {win} and terribly for {lose}, especially for poor {y}." }] },
    { id: 'npv.h3', when: { carried: true }, turns: [{ by: 'h', say: "{x} carried {win} to victory at {chal}, while {lose} fell apart." }] },
    { id: 'npv.h4', turns: [{ by: 'h', say: "{chal} was brutal, and while {win} somehow survived it, {lose} really did not." }] },
    { id: 'npv.h5', when: { sank: true }, turns: [{ by: 'h', say: "{lose} lost {chal}, and {y} spent the whole walk back hearing about it." }] },
  ],
  // {chal}; {x} won immunity
  'prev.chalInd.any': [
    { id: 'npv.i1', turns: [{ by: 'h', say: "{x} won {chal} and a night of safety, and everyone else went straight back to scheming." }] },
    { id: 'npv.i2', turns: [{ by: 'h', say: "At {chal}, {x} took the win, and the target moved somewhere else." }] },
  ],
  // after the loss, {x} blamed {y}
  'prev.blame.any': [
    { id: 'npv.m1', turns: [{ by: 'h', say: "Back at camp, {x} made very sure that everybody knew the loss was {y}'s fault." }] },
    { id: 'npv.m2', turns: [{ by: 'h', say: "{x} and {y} had a lovely, calm conversation about the loss, and by calm I mean screaming." }] },
    { id: 'npv.m3', turns: [{ by: 'h', say: "{x} pointed the finger at {y}, and {y} did not take it well." }] },
  ],
  // {x} and {y} had a romantic moment
  'prev.spark.any': [
    { id: 'npv.s1', turns: [{ by: 'h', say: "Sparks flew between {x} and {y}, which is gross, but honestly great for ratings." }] },
    { id: 'npv.s2', turns: [{ by: 'h', say: "{x} and {y} got a little closer than teammates usually do." }] },
    { id: 'npv.s3', turns: [{ by: 'h', say: "And is something going on with {x} and {y}? Everybody thinks so. Except maybe {x} and {y}." }] },
  ],
  // {x} and {y} fought
  'prev.fight.any': [
    { id: 'npv.g1', turns: [{ by: 'h', say: "{x} and {y} went at it, and the whole camp had front-row seats." }] },
    { id: 'npv.g2', turns: [{ by: 'h', say: "Things between {x} and {y} went from bad to worse. Like, way worse." }] },
    { id: 'npv.g3', turns: [{ by: 'h', say: "{x} and {y} had words, and they were very loud ones." }] },
  ],
  'prev.flip.any': [
    { id: 'npv.f1', turns: [{ by: 'h', say: "{x} smiled at the group all afternoon, and then quietly decided to go their own way." }] },
    { id: 'npv.f2', turns: [{ by: 'h', say: "{x} promised the plan one name and had a different one in mind the whole time." }] },
  ],
  'prev.warn.any': [
    { id: 'npv.w1', turns: [{ by: 'h', say: "{x} let {y} in on a little secret: {pitcher} was coming for {y}." }] },
    { id: 'npv.w2', turns: [{ by: 'h', say: "Word got around, thanks to {x}, and {y} found out exactly what {pitcher} had planned." }] },
  ],
  'prev.ally.any': [
    { id: 'npv.a1', turns: [{ by: 'h', say: "A brand new alliance was born. They call themselves {group}. Adorable." }] },
    { id: 'npv.a2', turns: [{ by: 'h', say: "{group} got together and swore to stick it out to the end. We'll see how long that lasts." }] },
  ],
  'prev.adv.any': [
    { id: 'npv.v1', turns: [{ by: 'h', say: "{x} pulled out an advantage nobody saw coming, and the whole vote turned upside down." }] },
    { id: 'npv.v2', turns: [{ by: 'h', say: "{x} had something hidden away, and when it came out, the whole vote went quiet." }] },
  ],
  'prev.runner.any': [
    { id: 'npv.r3', turns: [{ by: 'h', say: "And in the least important news of the week, {x} was at it again." }] },
    { id: 'npv.r4', turns: [{ by: 'h', say: "Oh, and {x}. Never change, {x}. Actually, maybe change a little." }] },
    { id: 'npv.r1', turns: [{ by: 'h', say: "And {x} did... whatever {x} does. We still don't fully understand it." }] },
    { id: 'npv.r2', turns: [{ by: 'h', say: "Meanwhile, {x} kept being {x}, which is either the best or worst thing about this season." }] },
  ],
  'prev.boot.any': [
    { id: 'npv.b4', turns: [{ by: 'h', say: "And at the campfire, {boot} got the last word nobody wants to hear: goodbye." }] },
    { id: 'npv.b5', turns: [{ by: 'h', say: "In the end, {boot} took the Walk of Shame, and the game got a little smaller." }] },
    { id: 'npv.b3', turns: [{ by: 'h', say: "When the dust settled, {boot} was the one heading home." }] },
    { id: 'npv.b1', turns: [{ by: 'h', say: "In the end, the votes landed on {boot}, and {boot} became the latest camper to leave the game." }] },
    { id: 'npv.b2', turns: [{ by: 'h', say: "And {boot}? {boot}'s time ran out." }] },
  ],
  'prev.blindside.any': [
    { id: 'npv.l1', turns: [{ by: 'h', say: "And {boot} walked in sure of a different name, and walked straight out of the game. Total blindside!" }] },
    { id: 'npv.l2', turns: [{ by: 'h', say: "Nobody told {boot}, and I mean nobody. Blindside!" }] },
  ],
  'prev.tease.any': [
    { id: 'npv.t6', when: { tease: 'trust' }, turns: [{ by: 'h', say: "This time, a promise gets made by the fire, and broken by midnight." }] },
    { id: 'npv.t7', when: { tease: 'trust' }, turns: [{ by: 'h', say: "This time, somebody finds out that a friend isn't really a friend." }] },
    { id: 'npv.t8', when: { tease: 'power' }, turns: [{ by: 'h', say: "This time, somebody's pocket is a lot heavier than it looks." }] },
    { id: 'npv.t9', when: { tease: 'any' }, turns: [{ by: 'h', say: "This time, the camp gets small, the whispers get loud, and somebody gets left out." }] },
    { id: 'npv.t1', when: { tease: 'merge' }, turns: [{ by: 'h', say: "This time, the teams are gone. It's every camper for themselves, and nobody is ready." }] },
    { id: 'npv.t2', when: { tease: 'power' }, turns: [{ by: 'h', say: "This time, somebody's been keeping a secret, and tonight it comes out." }] },
    { id: 'npv.t3', when: { tease: 'trust' }, turns: [{ by: 'h', say: "This time, somebody trusts the wrong person. Big mistake." }] },
    { id: 'npv.t4', when: { tease: 'any' }, turns: [{ by: 'h', say: "This time, the pressure's on, and somebody is going to crack." }] },
    { id: 'npv.t5', when: { tease: 'any' }, turns: [{ by: 'h', say: "Today, the alliances get tested, and not everybody passes." }] },
  ],
  'prev.close.any': [
    { id: 'npv.c3', turns: [{ by: 'h', say: "Who stays, who goes, and who completely loses it? Right here, right now, on {show}!" }] },
    { id: 'npv.c4', turns: [{ by: 'h', say: "It's all coming up, on {show}!" }] },
    { id: 'npv.c1', turns: [{ by: 'h', say: "Who's going home next? Find out right now, on {show}!" }] },
    { id: 'npv.c2', turns: [{ by: 'h', say: "Stay tuned. You're not going to want to miss this one. {show}!" }] },
  ],
};
