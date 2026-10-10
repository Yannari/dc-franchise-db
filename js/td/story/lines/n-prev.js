// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-prev.js — the host's "Previously on..." (td/story/previously.js)
// ══════════════════════════════════════════════════════════════════════
// h is the host. {show} is the show's name. Names are last episode's people. The tease (fact
// tease: merge / power / trust / any) may hint at the kind of night, never at who goes.
//
// The show's own recaps (the user, 2026-10-10, from Disventure Camp): one quick sentence per moment,
// names in every one, chained like a story ("We meet Tristan, who got busy making a snazzy
// shelter. Diego gives Ivy a tour of the island, while Lynda and Marissa's truce rolled in like a
// hurricane... In the end, Sam's spite against Spencer won out, and Ara was eliminated. 11 are
// left... soon to be 12 again!"). The screen shows each moment as a throwback while the host says it.
// Ids: 'npv.'.

export default {
  'prev.open.any': [
    { id: 'npv.o1', turns: [{ by: 'h', say: "Previously on {show}!" }] },
    { id: 'npv.o2', turns: [{ by: 'h', say: "Last time on {show}..." }] },
    { id: 'npv.o3', turns: [{ by: 'h', say: "Previously on {show}! Let's catch you up, because a lot went down." }] },
    { id: 'npv.o4', turns: [{ by: 'h', say: "Last time on {show}, things got messy. Even messier than usual." }] },
    { id: 'npv.o5', turns: [{ by: 'h', say: "Previously on {show}, our campers found out just how far they'd go for a little bit of safety." }] },
  ],
  // {chal} is last episode's challenge; {win} won it, {lose} lost it; {x} was the winning team's best score, {y} the losers' worst
  'prev.chal.any': [
    { id: 'npv.h1', when: { sank: true, carried: true }, turns: [{ by: 'h', say: "{x} carried {win} through {chal}, while {lose} came apart, mostly thanks to {y}." }] },
    { id: 'npv.h2', when: { sank: true }, turns: [{ by: 'h', say: "{chal} went great for {win} and terribly for {lose}, especially for poor {y}." }] },
    { id: 'npv.h3', when: { carried: true }, turns: [{ by: 'h', say: "{x} single-handedly dragged {win} to victory at {chal}, and {lose} had to watch." }] },
    { id: 'npv.h4', turns: [{ by: 'h', say: "{chal} was brutal, and while {win} somehow made it through, {lose} really did not." }] },
    { id: 'npv.h5', when: { sank: true }, turns: [{ by: 'h', say: "{lose} lost {chal}, and {y} heard about it the whole way back to camp." }] },
  ],
  // {chal}; {x} won immunity
  'prev.chalInd.any': [
    { id: 'npv.i1', turns: [{ by: 'h', say: "{x} won {chal} and a night of safety, so everyone else went straight back to scheming." }] },
    { id: 'npv.i2', turns: [{ by: 'h', say: "At {chal}, {x} took immunity, and the target had to move somewhere else." }] },
    { id: 'npv.i3', turns: [{ by: 'h', say: "{x} grabbed immunity at {chal}, which left a lot of people scrambling for a new name." }] },
  ],
  // after the loss, {x} blamed {y}
  'prev.blame.any': [
    { id: 'npv.m1', turns: [{ by: 'h', say: "Back at camp, {x} made very sure everybody knew the loss was {y}'s fault." }] },
    { id: 'npv.m2', turns: [{ by: 'h', say: "{x} and {y} had a lovely, calm chat about the loss, and by calm I mean screaming." }] },
    { id: 'npv.m3', turns: [{ by: 'h', say: "Afterwards, {x} pointed the finger at {y}, and {y} did not take it well." }] },
  ],
  // {x} and {y} had a romantic moment
  'prev.spark.any': [
    { id: 'npv.s1', turns: [{ by: 'h', say: "Meanwhile, sparks flew between {x} and {y}, which is gross, but honestly great for ratings." }] },
    { id: 'npv.s2', turns: [{ by: 'h', say: "{x} and {y} got a little closer than teammates usually do." }] },
    { id: 'npv.s3', turns: [{ by: 'h', say: "And is something going on between {x} and {y}? Everybody thinks so, except maybe {x} and {y}." }] },
  ],
  // {x} and {y} fought
  'prev.fight.any': [
    { id: 'npv.g1', turns: [{ by: 'h', say: "{x} and {y} went at it, and the whole camp had front-row seats." }] },
    { id: 'npv.g2', turns: [{ by: 'h', say: "Meanwhile, things between {x} and {y} went from bad to a lot worse." }] },
    { id: 'npv.g3', turns: [{ by: 'h', say: "{x} and {y}'s little feud blew up like a hurricane." }] },
  ],
  'prev.flip.any': [
    { id: 'npv.f1', turns: [{ by: 'h', say: "{x} smiled at the group all afternoon, and then quietly decided to go another way." }] },
    { id: 'npv.f2', turns: [{ by: 'h', say: "{x} promised the plan one name while keeping a very different one in mind." }] },
  ],
  'prev.warn.any': [
    { id: 'npv.w1', turns: [{ by: 'h', say: "{x} let {y} in on a little secret: {pitcher} was coming for {y}." }] },
    { id: 'npv.w2', turns: [{ by: 'h', say: "Thanks to {x}, {y} found out exactly what {pitcher} had planned." }] },
  ],
  'prev.ally.any': [
    { id: 'npv.a1', turns: [{ by: 'h', say: "A brand-new alliance was born, and they call themselves {group}. Adorable." }] },
    { id: 'npv.a2', turns: [{ by: 'h', say: "{group} got together and swore to stick it out to the end, so we'll see how long that lasts." }] },
  ],
  'prev.adv.any': [
    { id: 'npv.v1', turns: [{ by: 'h', say: "At the vote, {x} pulled out an advantage nobody saw coming, and turned the whole thing upside down." }] },
    { id: 'npv.v2', turns: [{ by: 'h', say: "{x} had something hidden away, and when it came out, the whole vote went quiet." }] },
  ],
  'prev.runner.any': [
    { id: 'npv.r1', turns: [{ by: 'h', say: "And in the least important news of the week, {x} was at it again." }] },
    { id: 'npv.r2', turns: [{ by: 'h', say: "Meanwhile, {x} kept being {x}, which is either the best or the worst thing about this season." }] },
    { id: 'npv.r3', turns: [{ by: 'h', say: "And {x} did whatever it is {x} does. We still don't fully understand it." }] },
  ],
  'prev.boot.any': [
    { id: 'npv.b1', turns: [{ by: 'h', say: "In the end, the votes landed on {boot}, and {boot} was eliminated." }] },
    { id: 'npv.b2', turns: [{ by: 'h', say: "When the dust settled, it was {boot} heading home." }] },
    { id: 'npv.b3', turns: [{ by: 'h', say: "In the end, {boot}'s luck ran out, and {boot} became the latest to leave the game." }] },
    { id: 'npv.b4', turns: [{ by: 'h', say: "And when the votes were read, it was {boot} who didn't make it." }] },
  ],
  'prev.blindside.any': [
    { id: 'npv.l1', turns: [{ by: 'h', say: "In the end, {boot} walked in sure of a different name and walked straight out of the game. Total blindside!" }] },
    { id: 'npv.l2', turns: [{ by: 'h', say: "Nobody told {boot}, and I mean nobody, so {boot} never saw it coming. Blindside!" }] },
  ],
  'prev.tease.any': [
    { id: 'npv.t1', when: { tease: 'merge' }, turns: [{ by: 'h', say: "This time, the teams are gone, it's every camper for themselves, and nobody is ready." }] },
    { id: 'npv.t2', when: { tease: 'power' }, turns: [{ by: 'h', say: "This time, somebody's been keeping a secret, and it's about to come out." }] },
    { id: 'npv.t3', when: { tease: 'power' }, turns: [{ by: 'h', say: "This time, somebody's pocket is a lot heavier than it looks." }] },
    { id: 'npv.t4', when: { tease: 'trust' }, turns: [{ by: 'h', say: "This time, somebody trusts the wrong person, and it costs them." }] },
    { id: 'npv.t5', when: { tease: 'trust' }, turns: [{ by: 'h', say: "This time, a promise gets made by the fire and broken by midnight." }] },
    { id: 'npv.t6', when: { tease: 'any' }, turns: [{ by: 'h', say: "This time, the pressure's on, and somebody is going to crack." }] },
    { id: 'npv.t7', when: { tease: 'any' }, turns: [{ by: 'h', say: "This time, the alliances get tested, and not everybody passes." }] },
  ],
  // {left}/{Left}: how many are still in the game, as a word
  'prev.left.any': [
    { id: 'npv.n1', turns: [{ by: 'h', say: "{Left} are left! Who will be voted out tonight?" }] },
    { id: 'npv.n2', turns: [{ by: 'h', say: "{Left} are left, and by the end of tonight, there'll be one fewer." }] },
    { id: 'npv.n3', turns: [{ by: 'h', say: "{Left} are still standing. Who's next? Find out right now, on {show}!" }] },
  ],
  'prev.close.any': [
    { id: 'npv.c1', turns: [{ by: 'h', say: "Who's going home next? Find out right now, on {show}!" }] },
    { id: 'npv.c2', turns: [{ by: 'h', say: "Who stays, who goes, and who completely loses it? Right here, right now, on {show}!" }] },
  ],
};
