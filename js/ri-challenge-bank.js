// js/ri-challenge-bank.js — RI duel challenge narration bank (challenges 1-9)
// Each variant is a function: (w, l, prW, prL) => narration string

export function getChallengeNarration(challengeId, phaseTag, outcome, w, l, prW, prL) {
  const bank = CHALLENGE_BANK[challengeId];
  if (!bank) return `${w} takes the round from ${l}.`;
  const phase = bank.narration[phaseTag];
  if (!phase) return `${w} takes the round from ${l}.`;
  const pool = phase[outcome];
  if (!pool || !pool.length) return `${w} takes the round from ${l}.`;
  return pool[Math.floor(Math.random() * pool.length)](w, l, prW, prL);
}

export function getRandomChallenge() {
  const ids = Object.keys(CHALLENGE_BANK);
  return CHALLENGE_BANK[ids[Math.floor(Math.random() * ids.length)]];
}

export const CHALLENGE_BANK = {

// ═══════════════════════════════════════════════════════════════
// 1. FIRE-MAKING — endurance + physical
// ═══════════════════════════════════════════════════════════════
'fire-making': {
  id: 'fire-making', name: 'Fire-Making', desc: 'Build a fire high enough to burn through the rope.',
  primary: 'endurance', secondary: 'physical',
  phases: [
    { name: 'The Spark', tag: 'opening' },
    { name: 'Building the Flame', tag: 'pivot' },
    { name: 'Burn the Rope', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} strikes flint with authority — sparks fly on the second try. A wisp of smoke curls from the kindling.\n\n${l} scrapes frantically but nothing catches. ${prL.Sub} can't even get a spark while ${w}'s tinder is already glowing.`,
        (w, l, prW, prL) => `Confident hands. ${w} builds a nest of coconut husk and strikes clean. The ember takes immediately.\n\n${l} fumbles with the flint. Drops it. Picks it up. Strikes air. ${w} is already nurturing flame.`,
        (w, l, prW, prL) => `${w} is methodical — tinder arranged, kindling ready, strike angle perfect. First spark catches.\n\n${l} hasn't even organized ${prL.pos} materials. Scattered, unfocused. This is already a mismatch.`,
        (w, l, prW, prL) => `The flint sings in ${w}'s hands. Spark, ember, smoke — a textbook opening.\n\n${l} watches from ${prL.pos} station, still arranging coconut husk. The gap is immediate and growing.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both strike at the same time. ${w}'s spark catches a half-second before ${l}'s. The tiniest head start.\n\n${l} has smoke too — this is going to be close. But ${w} got there first and that matters.`,
        (w, l, prW, prL) => `${w} and ${l} both struggle with the flint. Strike after strike. Finally ${w}'s kindling catches — barely.\n\n${l} is right there. Almost simultaneous. But almost doesn't count on Redemption Island.`,
        (w, l, prW, prL) => `Neither gets a clean strike at first. Both recalibrate. ${w} adjusts the angle and — there. A tiny flame.\n\n${l}'s hands are just as steady. ${prL.Sub} get${prL.sub==='they'?'':'s'} a spark a moment later. Neck and neck.`,
        (w, l, prW, prL) => `Scrape. Scrape. Nothing. Both stations silent. Then ${w}'s flint bites and a spark jumps into the nest.\n\n${l} sees it and pushes harder. Gets one too. But ${w} was first by a breath.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} strikes clean and true — good technique, good form. The spark dances but doesn't catch.\n\n${w}'s does. Same strike, same skill, but ${w}'s tinder was drier. Sometimes that's all it takes.`,
        (w, l, prW, prL) => `${l} is doing everything right. Steady hands, controlled strikes. The ember glows — then dies.\n\n${w}'s ember holds. ${l} resets and tries again. No quit, but the frustration is starting to show.`,
        (w, l, prW, prL) => `${l} builds a beautiful tinder nest. Strikes well. The spark lands perfectly — and fizzles in the humidity.\n\n${w} has the same conditions but ${prW.pos} ember fights through. ${l} can only watch and try again.`,
        (w, l, prW, prL) => `Good form from ${l}. ${prL.Sub} know${prL.sub==='they'?'':'s'} what ${prL.sub}'${prL.sub==='they'?'re':'s'} doing. But the flint won't cooperate.\n\n${w} makes it look easy by comparison. Same tools, different results.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s hands are shaking before the first strike. The flint slips. Drops into the sand.\n\n${w} is already blowing embers to life while ${l} digs for ${prL.pos} flint. This is bad.`,
        (w, l, prW, prL) => `${l} can't grip the flint. Sweat, nerves, something. ${prL.Sub} strike${prL.sub==='they'?'':'s'} nothing but air.\n\n${w} doesn't even look over. Doesn't need to. The sound of crackling tinder says everything.`,
        (w, l, prW, prL) => `The island has taken too much from ${l}. ${prL.PosAdj} arms are weak, ${prL.pos} focus shot. The flint feels foreign.\n\n${w} works in silence. Efficient. Calm. Everything ${l} isn't right now.`,
        (w, l, prW, prL) => `${l} looks at the flint like ${prL.sub}'${prL.sub==='they'?'ve':'s'} never seen one before. Lost. Overwhelmed.\n\n${w}'s fire is already crackling. ${l} hasn't produced a single spark.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `${w}'s flame grows strong — steady feeding, perfect airflow. The fire climbs.\n\n${l}'s barely a candle. ${prL.Sub} blow${prL.sub==='they'?'':'s'} too hard and it gutters. Too soft and it starves. ${w} is pulling away.`,
        (w, l, prW, prL) => `Kindling stacked perfectly. ${w} feeds the flame with precision — each stick placed where it'll catch fastest.\n\n${l} is rebuilding from scratch after a collapse. The gap is enormous and growing.`,
        (w, l, prW, prL) => `${w}'s fire roars. Knee-high already. The technique is flawless.\n\n${l}'s flame flickers and dies for the second time. ${prL.Sub} slam${prL.sub==='they'?'':'s'} the ground. The frustration is boiling over.`,
        (w, l, prW, prL) => `The heat from ${w}'s station is visible — shimmer in the air. A real fire now.\n\n${l} has smoke but no flame. ${prL.Sub} keep${prL.sub==='they'?'':'s'} blowing, coaxing, begging. Nothing.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both fires are alive. Both growing. ${w} feeds a crucial piece of kindling that catches — the flame jumps.\n\n${l}'s fire grows too, but a notch behind. Every second matters now.`,
        (w, l, prW, prL) => `${w} and ${l} are building at almost the same pace. Then ${w}'s fire finds a pocket of dry bark and surges.\n\n${l} sees the surge. Pushes harder. ${prL.PosAdj} fire responds — but not quite enough.`,
        (w, l, prW, prL) => `Neck and neck. Both flames dancing. ${w} makes one smart decision — layering bark before sticks — and it pays off.\n\n${l}'s structure is good but burns slower. The tiniest tactical edge for ${w}.`,
        (w, l, prW, prL) => `A gust of wind hits both stations. ${w}'s fire bends but holds. ${l}'s flickers dangerously.\n\n${w} shields ${prW.pos} flame and feeds it through. ${l} recovers — but lost a few precious seconds.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s fire is beautiful — well-built, well-fed. But ${w}'s is just a touch higher.\n\n${l} adjusts ${prL.pos} structure, trying to coax more height. The effort is there. The result isn't.`,
        (w, l, prW, prL) => `${l} builds smart. Good architecture. The flame responds. But ${w}'s responded faster.\n\n${l} is doing everything right. ${w} is just doing it a fraction better.`,
        (w, l, prW, prL) => `${l}'s fire crackles strong. Real heat. Real flame. On any other day, this wins.\n\nBut ${w}'s fire crackles stronger. ${l} can hear the difference and it stings.`,
        (w, l, prW, prL) => `The gap was closable. ${l} made a run — good fuel, good airflow, fire climbing.\n\nBut ${w} matched every move and added one more. ${l} can't find the extra gear.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s fire collapses. The whole structure caves in. Embers scatter.\n\n${l} stares at the wreckage. ${w}'s fire roars in the background like a taunt.`,
        (w, l, prW, prL) => `Something breaks in ${l}. ${prL.Sub} stop${prL.sub==='they'?'':'s'} feeding the fire. Just sits. Stares.\n\n${w} keeps building. Doesn't look over. The silence from ${l}'s station says everything.`,
        (w, l, prW, prL) => `${l} overfeeds the fire — too much, too fast. It smothers. Smoke everywhere, no flame.\n\n${w}'s fire burns clean and tall. ${l} coughs through the smoke, trying to recover what's already gone.`,
        (w, l, prW, prL) => `${l}'s hands won't stop shaking. Every stick ${prL.sub} place${prL.sub==='they'?'':'s'} falls wrong. The fire dies again.\n\n${w} is calm. Methodical. ${prW.PosAdj} fire grows while ${l}'s goes cold.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${w}'s fire is a bonfire now. The rope above is already blackening, fibers curling in the heat.\n\n${l} is still fighting for flame. It doesn't matter. ${w}'s rope snaps — the flag drops.\n\n${w} stands. Says nothing. Just watches the flag hit the ground.`,
        (w, l, prW, prL) => `The flame reaches. Licks the rope. One strand pops. Then another.\n\n${l} looks up from ${prL.pos} station and sees ${w}'s rope unraveling. It's over before ${l}'s fire even reaches waist height.\n\nThe flag drops. ${w} exhales for the first time in minutes.`,
        (w, l, prW, prL) => `${w}'s fire roars — chest high, then higher. The heat is blistering. The rope doesn't stand a chance.\n\n${l} has nothing. A flicker. A prayer. ${prL.Sub} watch${prL.sub==='they'?'':'es'} ${w}'s rope snap and the flag fall.\n\nDomination. Pure and simple.`,
        (w, l, prW, prL) => `The rope catches fire from ${w}'s blaze. Not slowly — all at once. The whole length lights up.\n\n${l}'s fire gutters out for the final time. ${prL.Sub} look${prL.sub==='they'?'':'s'} up as ${w}'s flag falls.\n\nTotal control from start to finish.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both fires reaching for the rope. ${w}'s flame licks the fibers first — barely. The rope darkens.\n\n${l}'s fire surges — the rope above ${prL.obj} starts to smoke. But ${w}'s strand snaps first.\n\nThe flag drops. ${l} screams. ${prL.Sub} ${prL.sub==='they'?'were':'was'} RIGHT THERE.`,
        (w, l, prW, prL) => `The ropes are both smoking. Both charring. This is seconds apart.\n\n${w}'s rope gives way — one strand, two, three. The flag falls.\n\n${l}'s rope snaps two seconds later. Two seconds. An eternity and a blink.`,
        (w, l, prW, prL) => `${w} feeds one last piece of bark into the blaze. The fire surges. The rope catches.\n\n${l} does the same — same move, same bark. But ${w}'s fire had the angle. The rope burns through.\n\nA photo finish. But there's only one flag on the ground.`,
        (w, l, prW, prL) => `Both fires roar. Both ropes smoking. The arena holds its breath.\n\n${w}'s rope snaps with a crack. The flag drops into the sand.\n\n${l}'s rope is charred. Almost through. Almost. ${prL.Sub} sink${prL.sub==='they'?'':'s'} to ${prL.pos} knees.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s fire is real — tall, strong, licking at the rope. ${prL.Sub} gave everything to get here.\n\nBut ${w}'s rope snaps first. ${l}'s rope was seconds behind.\n\n${l} stares at ${prL.pos} fire. Still burning. Still beautiful. Still not enough.`,
        (w, l, prW, prL) => `${l} built something impressive. A fire that could burn through anything. And it almost did.\n\nBut ${w}'s burned through faster. ${l} hears the snap, sees the flag, and stands there.\n\nNo tears. Just the quiet understanding that ${prL.sub} did everything right and it wasn't enough.`,
        (w, l, prW, prL) => `${l} coaxed flame from nothing. Sheer willpower. The rope was charring. Victory was close enough to taste.\n\nThen ${w}'s rope snaps. The flag falls on ${w}'s side.\n\n${l} closes ${prL.pos} eyes. ${prL.Sub} know${prL.sub==='they'?'':'s'} ${prL.sub} left nothing out there.`,
        (w, l, prW, prL) => `A warrior's effort from ${l}. ${prL.PosAdj} fire raged. ${prL.PosAdj} rope was nearly through.\n\n${w}'s rope broke first. That's all that matters.\n\n${l} nods once. Respect for the game. Respect for the opponent.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} doesn't even have fire when ${w}'s rope snaps. Just smoke. Just ash.\n\nThe flag drops and ${l} is still blowing on embers. ${prL.Sub} stop${prL.sub==='they'?'':'s'}. Let${prL.sub==='they'?'':'s'} the embers die.\n\nIt was over long before the rope broke.`,
        (w, l, prW, prL) => `${l} gave up building ten seconds ago. Just stood. Watched ${w}'s fire climb toward the rope.\n\nThe snap comes. The flag falls. ${l} was already walking toward ${prL.pos} torch.\n\nSome battles are lost before they end.`,
        (w, l, prW, prL) => `${w}'s rope burns through. The flag drops with finality.\n\n${l}'s station is cold. Dead coals. ${prL.Sub} ran out of fight two rounds ago.\n\nThe island won. Not ${w}. The island.`,
        (w, l, prW, prL) => `The crack of ${w}'s rope breaking echoes across the arena. Flag down.\n\n${l} sits beside a dead fire, head in ${prL.pos} hands. ${prL.Sub} didn't just lose this challenge.\n\n${prL.Sub} lost to ${prL.ref}.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 2. ROPE CHOP — physical + temperament
// ═══════════════════════════════════════════════════════════════
'rope-chop': {
  id: 'rope-chop', name: 'Rope Chop', desc: 'Chop through thick rope with a machete.',
  primary: 'physical', secondary: 'temperament',
  phases: [
    { name: 'First Swings', tag: 'opening' },
    { name: 'Grinding Through', tag: 'pivot' },
    { name: 'Final Strands', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} swings with terrifying power. The machete bites deep into the rope on the first strike.\n\n${l}'s swing glances off. Bad angle. ${prL.Sub} readjust${prL.sub==='they'?'':'s'} but ${w} already has three clean cuts in.`,
        (w, l, prW, prL) => `THWACK. ${w}'s first swing is perfect — dead center, full force. Fibers spray.\n\n${l} swings wide. Misses the rope entirely. ${prL.Sub} stagger${prL.sub==='they'?'':'s'} from the follow-through.`,
        (w, l, prW, prL) => `Rhythmic. Powerful. ${w} finds a groove immediately — each swing deeper than the last.\n\n${l} hacks wildly. No rhythm. No power. The rope barely dents.`,
        (w, l, prW, prL) => `${w} treats the rope like it insulted ${prW.obj}. Massive swings. Deep cuts. Absolute violence.\n\n${l} chips at the surface. Cautious. Tentative. The difference is staggering.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both swing hard. Both connect. ${w}'s cut goes maybe a centimeter deeper.\n\n${l}'s form is good — controlled, powerful. But ${w} has a fraction more bite per swing.`,
        (w, l, prW, prL) => `${w} and ${l} match each other swing for swing. The machetes ring in sync.\n\n${w} finds a slightly better angle on the third cut. A tiny advantage.`,
        (w, l, prW, prL) => `The opening exchanges are dead even. Same power, same tempo.\n\n${w} adjusts grip — two-handed to one — and gains reach. ${l} notices. Adapts. But the edge is ${w}'s.`,
        (w, l, prW, prL) => `Both ropes fraying at the same rate. Identical cuts, identical fury.\n\nThen ${w} hits a soft spot in the braid. The machete sinks an extra inch. Tiny advantage. Big difference.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} swings clean and hard. Good technique. The rope yields.\n\nBut ${w}'s yields more. Same effort, slightly better results. ${l} can feel the gap opening.`,
        (w, l, prW, prL) => `${l}'s form is textbook. Every swing lands true. The rope is giving way.\n\n${w}'s is giving way faster. Not by much. But by enough.`,
        (w, l, prW, prL) => `${l} puts everything into each swing. The sound of steel on rope echoes.\n\n${w}'s echoes louder. Deeper. ${l} is doing well — just not well enough.`,
        (w, l, prW, prL) => `Nothing wrong with ${l}'s approach. Strong swings, good contact.\n\n${w} is just stronger right now. Simple as that.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} can barely lift the machete. The weight of it, the weight of everything — too much.\n\n${w} swings like a machine while ${l} gasps between half-hearted chops.`,
        (w, l, prW, prL) => `${l}'s first swing misses. Second swing glances. Third barely scratches the surface.\n\n${w} has carved halfway through before ${l} finds a rhythm.`,
        (w, l, prW, prL) => `The machete shakes in ${l}'s hands. No strength. No conviction.\n\n${w} doesn't notice. Too busy demolishing ${prW.pos} rope.`,
        (w, l, prW, prL) => `${l} drops the machete after three swings. Picks it up. Drops it again.\n\n${w} is a metronome of destruction. Every swing counts. Every swing lands.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `${w}'s rope is more than half gone. Fibers hanging loose. Each swing sends more flying.\n\n${l} is maybe a quarter through. Swinging hard but gaining nothing. The rope seems to mock ${prL.obj}.`,
        (w, l, prW, prL) => `The rhythm intensifies. ${w} hits harder, faster. The rope is shredding.\n\n${l} tries to match the pace and loses form. Wild swings. Wasted energy.`,
        (w, l, prW, prL) => `${w}'s machete is a blur. The rope frays and splits with each impact.\n\n${l} pauses to breathe. When ${prL.sub} start${prL.sub==='they'?'':'s'} again, the gap has doubled.`,
        (w, l, prW, prL) => `Halfway through and ${w} hasn't slowed. If anything, faster. Smelling blood.\n\n${l}'s arms are heavy. Each swing shorter. Weaker. The rope knows.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both ropes fraying. Fibers peeling away. This is a war of inches.\n\n${w} finds a burst — three fast swings. ${l} matches with two. The gap is razor-thin.`,
        (w, l, prW, prL) => `${l} surges — huge swings, rope splitting. ${prL.Sub} clos${prL.sub==='they'?'e':'es'} the gap.\n\n${w} responds. Harder. Faster. Refuses to be caught. Both gasping.`,
        (w, l, prW, prL) => `The ropes are almost identically cut. Same depth. Same fraying.\n\n${w} adjusts angle — striking upward now. The rope unravels slightly faster. Barely.`,
        (w, l, prW, prL) => `Swing for swing, they're matched. The sound of two machetes in near-unison.\n\n${w} grunts. Finds something extra. One more clean cut that ${l} can't answer.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} is hitting hard. Real power. The rope is giving way.\n\n${w}'s is giving way a fraction faster. ${l} looks over. Sees the gap. Swings harder. Still not enough.`,
        (w, l, prW, prL) => `${l}'s technique hasn't faltered. Consistent. Strong. Well-placed cuts.\n\nBut ${w} has an animal intensity that can't be taught. ${l} fights skill. ${w} fights fury.`,
        (w, l, prW, prL) => `Every swing from ${l} is a good one. ${prL.Sub} deserve${prL.sub==='they'?'':'s'} to be winning.\n\n${w} just won't let that happen. More power. More want.`,
        (w, l, prW, prL) => `${l} pours it on. Everything in the tank. The rope splits and frays.\n\n${w}'s rope splits and frays just a touch more. The cruelest kind of losing.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s swings have no power left. Tapping the rope. Not cutting it.\n\n${w} is a machine. Relentless. ${l} might as well be swinging a pool noodle.`,
        (w, l, prW, prL) => `${l} stops. Hands on knees. Panting. The rope hangs there, barely touched.\n\n${w} doesn't stop. Doesn't even look over. The grinding continues.`,
        (w, l, prW, prL) => `The machete is too heavy now. ${l}'s arms gave out somewhere in the last minute.\n\n${w} keeps chopping. ${l} keeps trying. The sound is different now — ${w}'s sharp, ${l}'s dull.`,
        (w, l, prW, prL) => `${l} switches to one hand. Then the other. Neither has any power left.\n\n${w} has both hands locked and loaded. Full force. Every. Single. Swing.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${w} winds up for the final blow. The machete comes down like judgment.\n\nThe rope snaps. Two pieces fall to the sand. ${w} plants the machete and raises ${prW.pos} arms.\n\n${l}'s rope swings intact. Not even close.`,
        (w, l, prW, prL) => `Three more swings. That's all ${w} needs. One — fibers spray. Two — the rope screams. Three — it breaks.\n\n${l} is still hacking at a half-intact rope when it's over.\n\n${w} drops the machete. Doesn't need it anymore.`,
        (w, l, prW, prL) => `The last strands give way under ${w}'s assault. The rope separates with a satisfying snap.\n\n${l} looks up from ${prL.pos} station. Half-cut rope. Full devastation.\n\nNot a contest. A demonstration.`,
        (w, l, prW, prL) => `${w}'s final swing goes clean through. The rope falls. Done.\n\n${l} stops swinging. Lowers the machete. Breathes.\n\nThe arena is quiet except for ${w}'s breathing and the echo of finality.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both ropes hanging by threads. ${w} swings — misses clean. Swings again — SNAP.\n\n${l}'s rope quivers. One more swing would have done it. One more.\n\n${w} drops to ${prW.pos} knees. ${l} drops the machete. So close it hurts.`,
        (w, l, prW, prL) => `The final strands. ${w} chops. ${l} chops. Almost simultaneous.\n\n${w}'s rope gives first. By a swing. Maybe less.\n\n${l} hears ${w}'s rope snap and stops mid-swing. The machete hangs in the air. ${prL.Sub} ${prL.sub==='they'?'were':'was'} right there.`,
        (w, l, prW, prL) => `${w} swings like ${prW.pos} life depends on it. Because it does. The rope stretches. Holds. ${w} swings again — CRACK.\n\n${l}'s rope cracks a second later. Both cut. But only one was first.\n\nThe cruelest margin in Redemption Island history.`,
        (w, l, prW, prL) => `Exhaustion. Both gasping. Both swinging on fumes.\n\n${w}'s rope breaks on a swing that barely had any force behind it. Just enough.\n\n${l}'s rope holds. Barely. ${prL.Sub} look${prL.sub==='they'?'':'s'} at it in disbelief. One more swing. Just one more.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} swings with everything left. The rope frays. Shreds. Almost there.\n\n${w}'s rope snaps first. ${l}'s hand falls. The machete drops.\n\n${l} gave a warrior's effort. The rope just didn't break in time.`,
        (w, l, prW, prL) => `${l}'s final swings are powerful. True. Each one takes more rope with it.\n\nBut ${w}'s final swing takes the last of it. ${l} hears the snap and knows.\n\n${prL.Sub} nod${prL.sub==='they'?'':'s'} to ${w}. Respect between warriors.`,
        (w, l, prW, prL) => `${l} fought like a champion. Every swing mattered. Every cut counted.\n\n${w}'s cuts counted just a little more. The rope breaks on ${w}'s side.\n\n${l} drops the machete gently. ${prL.Sub} left nothing in the tank.`,
        (w, l, prW, prL) => `${l}'s rope was three swings from done. Maybe two. Maybe one.\n\nBut ${w}'s was zero swings from done. And that's the only number that matters.\n\n${l} walks away with ${prL.pos} head high. ${prL.Sub} should.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${w}'s rope breaks. ${l} is sitting on the ground, machete beside ${prL.obj}.\n\n${prL.Sub} stopped swinging a minute ago. Maybe longer.\n\nThe fight was already over. The rope breaking was just the formality.`,
        (w, l, prW, prL) => `${l} watches ${w}'s rope fall. Doesn't react. Nothing left to react with.\n\nThe machete lies at ${prL.pos} feet. ${prL.PosAdj} rope barely touched.\n\n${prL.Sub} knew. ${prL.Sub} knew from the first swing.`,
        (w, l, prW, prL) => `The snap of ${w}'s rope sounds distant to ${l}. Everything sounds distant now.\n\n${l}'s rope hangs thick and whole. A monument to what didn't happen.\n\n${prL.Sub} pick${prL.sub==='they'?'':'s'} up ${prL.pos} torch without being asked.`,
        (w, l, prW, prL) => `It's over. ${w}'s rope is in two pieces. ${l}'s is barely scarred.\n\n${l} doesn't look at anyone. Just turns and walks toward the exit.\n\nSome losses you see coming. This was one of them.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 3. LOG ROLL — physical + endurance
// ═══════════════════════════════════════════════════════════════
'log-roll': {
  id: 'log-roll', name: 'Log Roll', desc: 'Balance on a spinning log over water. Last one standing.',
  primary: 'physical', secondary: 'endurance',
  phases: [
    { name: 'Finding Balance', tag: 'opening' },
    { name: 'The Log Spins Faster', tag: 'pivot' },
    { name: 'One Must Fall', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} plants ${prW.pos} feet and finds center immediately. Rock solid.\n\n${l} wobbles from the first rotation. Arms flailing. Already fighting for balance while ${w} looks like ${prW.sub}'s standing on flat ground.`,
        (w, l, prW, prL) => `Natural balance. ${w} adjusts to the spin like ${prW.sub}'s done this a thousand times.\n\n${l} nearly slips on the first revolution. Catches ${prL.ref}. Barely. This is going to be painful to watch.`,
        (w, l, prW, prL) => `${w}'s feet move with the log. Fluid. Easy. Low center of gravity.\n\n${l} fights the rotation. Rigid. Stiff. Every spin is a near-disaster.`,
        (w, l, prW, prL) => `Calm confidence from ${w}. Feet dancing with the spin. Not against it.\n\n${l} is white-knuckling ${prL.pos} position. Arms out wide for balance. Every second is a struggle.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both find balance quickly. Both reading the spin well. Good form from each.\n\n${w} has a slightly lower stance — more stable. ${l}'s is good but a touch higher. Small differences that might matter later.`,
        (w, l, prW, prL) => `The log spins and both adjust in sync. Almost choreographed.\n\n${w} has the tiniest edge in body control. ${l} compensates well. This is going to be decided by who blinks first.`,
        (w, l, prW, prL) => `${w} and ${l} both wobble on the second rotation. Both recover. Even.\n\n${w}'s recovery is a half-beat faster. ${l}'s arms swing wider. Marginal stuff. But margins win duels.`,
        (w, l, prW, prL) => `Identical balance. Identical focus. The log can't tell them apart.\n\n${w} shifts weight slightly forward. A micro-adjustment that creates stability. ${l} doesn't notice the difference. Yet.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s balance is solid. Good stance, good reflexes. Reading the spin well.\n\n${w}'s is just a touch better. ${l} has to make one more adjustment per rotation. It adds up.`,
        (w, l, prW, prL) => `${l} looks comfortable. Balanced. Ready for this.\n\n${w} looks like ${prW.sub} ${prW.sub==='they'?'were':'was'} born on a spinning log. ${l}'s good. ${w}'s better.`,
        (w, l, prW, prL) => `${l} finds ${prL.pos} rhythm. Not perfect but functional. ${prL.Sub} can work with this.\n\n${w} found ${prW.pos} rhythm faster. That early advantage is small but real.`,
        (w, l, prW, prL) => `Good instincts from ${l}. Quick feet. Smart adjustments.\n\n${w}'s instincts are fractionally faster. In a balance challenge, fractions are everything.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} nearly falls on the FIRST spin. Arms windmilling. Knees buckling.\n\n${w} watches it happen from a position of total control. This isn't a contest.`,
        (w, l, prW, prL) => `The log starts spinning and ${l} panics. Feet too close together. Body rigid.\n\n${w} settles in comfortably while ${l} fights for ${prL.pos} life from second one.`,
        (w, l, prW, prL) => `${l}'s legs are shaking before the log even gets going. Fatigue? Nerves? Both?\n\n${w} is stone. Stable. Untroubled. ${l} is a disaster in progress.`,
        (w, l, prW, prL) => `${l} grabs at air, at nothing, as the log takes ${prL.pos} feet. Recovery. Barely.\n\n${w} hasn't moved ${prW.pos} arms once. The contrast is brutal.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `The log speeds up. ${w} adjusts effortlessly. ${l} does not.\n\n${l}'s arms are spinning. Feet sliding. Each rotation a mini-crisis. ${w} looks bored.`,
        (w, l, prW, prL) => `Faster now. ${w} drops lower, absorbs the speed. Perfect.\n\n${l} can't keep up. ${prL.PosAdj} balance breaks on every other spin. It's only a matter of when.`,
        (w, l, prW, prL) => `${w} is in a zone. The faster spin doesn't faze ${prW.obj} at all.\n\n${l} is barely hanging on. Each rotation takes something. Soon there'll be nothing left.`,
        (w, l, prW, prL) => `The speed increase is supposed to test both. It tests ${l}. ${w} barely notices.\n\n${l} slips. Recovers. Slips again. Recovers worse. The pattern is clear.`,
      ],
      winClose: [
        (w, l, prW, prL) => `The faster spin tests both. ${w} wobbles — a real wobble. ${l} wobbles too.\n\nBoth recover. But ${w}'s recovery plants firmer. ${l}'s leaves a slight drift.`,
        (w, l, prW, prL) => `${l} actually looks more comfortable at the faster speed. ${prL.Sub} found${prL.sub==='they'?'':'s'} a new rhythm.\n\n${w} adjusts too. Both still standing. Both breathing harder. This comes down to endurance.`,
        (w, l, prW, prL) => `The speed separates pretenders from contenders. Both are contenders.\n\n${w} has a marginally better stance — feet wider, weight lower. ${l}'s technique is sound but slightly higher.`,
        (w, l, prW, prL) => `Back and forth. ${w} wobbles, ${l} steady. ${l} wobbles, ${w} steady. Trading moments of control.\n\n${w} has one fewer wobble overall. In a contest this tight, that's everything.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} matches the new speed well. Good adjustment. Smart footwork.\n\n${w} matched it better. ${l} is close — agonizingly close — but close doesn't keep you on the log.`,
        (w, l, prW, prL) => `${l} is fighting beautifully. Every near-fall turned into a recovery. Grit on display.\n\n${w} hasn't had a near-fall. And that's the difference.`,
        (w, l, prW, prL) => `${l}'s legs burn but hold. ${prL.PosAdj} core engages. ${prL.Sub} survive${prL.sub==='they'?'':'s'} the speed increase.\n\n${w} doesn't just survive it. ${w} thrives in it. ${l} sees it and knows the math isn't good.`,
        (w, l, prW, prL) => `Both still standing. Both suffering. The log doesn't care about effort.\n\n${l} is giving more effort. ${w} needs less. That's the whole story.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `The speed increase breaks ${l}. Feet sliding, arms spinning, body tilting.\n\n${w} stands still. ${l} is a human tornado of failing balance. Any second now.`,
        (w, l, prW, prL) => `${l} can't. ${prL.Sub} just can't. The speed is too much. The body is too tired.\n\n${w} watches ${l} fight a losing battle. There's no joy in it. Just inevitability.`,
        (w, l, prW, prL) => `${l}'s knees buckle on the first fast spin. Recovery. Second spin — worse wobble. Third — nearly gone.\n\n${w} is steady as a statue. This is mercy-rule territory.`,
        (w, l, prW, prL) => `The faster speed turns ${l}'s station into a comedy of errors. Slipping, grabbing, flailing.\n\n${w} adjusts once. That's it. Once. ${l} adjusts constantly and it's never enough.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${l} slips. Catches ${prL.ref}. Slips again. The third time, ${prL.pos} feet go out.\n\nSPLASH. ${l} hits the water. ${w} stands on the log, arms folded.\n\n${w} never wavered. Not once.`,
        (w, l, prW, prL) => `It's not dramatic. ${l} simply runs out of balance. One foot slides, the other follows.\n\n${l} falls into the water with a quiet splash. ${w} steps off the log voluntarily.\n\nThat's how outmatched this was. ${w} chose when to stop.`,
        (w, l, prW, prL) => `${l}'s left foot goes. ${prL.Sub} grab${prL.sub==='they'?'':'s'} at the log with ${prL.pos} hands — undignified but desperate.\n\n${prL.PosAdj} grip slips. Into the water. ${w} watches from above.\n\nDominance. Pure physical dominance.`,
        (w, l, prW, prL) => `The log spins and ${l} is gone. One second standing, the next — water.\n\n${w} barely reacted. Didn't even flinch. ${prW.Sub} knew it was coming.\n\nEveryone knew it was coming.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both wobbling. Both fighting. The log doesn't care about drama but it's getting it anyway.\n\n${l} catches an edge wrong. ${prL.PosAdj} ankle rolls. ${prL.Sub} grab${prL.sub==='they'?'':'s'} air and — splash.\n\n${w} was one wobble from joining ${prL.obj}. But one wobble is the difference between staying and going.`,
        (w, l, prW, prL) => `They're both on the edge. Literally. ${w}'s foot hangs over the side. ${l}'s does too.\n\n${l} leans — too far. Arms spinning. Tips past the point of no return.\n\n${w} pulls back. Just barely. ${l} doesn't. The water swallows the difference.`,
        (w, l, prW, prL) => `${w} slips. Heart stops. Recovery — barely. ${l} sees it and pushes the log harder.\n\nBut the push throws ${l}'s own balance. ${prL.Sub} teeter${prL.sub==='they'?'':'s'}... and fall${prL.sub==='they'?'':'s'}.\n\n${w} exhales. That was CLOSE.`,
        (w, l, prW, prL) => `A gust of wind. Both sway. ${w} crouches low and grips with ${prW.pos} toes.\n\n${l} stays upright — wrong move. The wind takes ${prL.obj}. Splash.\n\n${w} crouches on the log, shaking. An inch from following ${l} in.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} fights the fall. Arms out, body leaning, somehow still on the log. Incredible balance.\n\nBut physics wins. ${l}'s foot slides and ${prL.sub} drop${prL.sub==='they'?'':'s'}. Splash.\n\n${w} survived. ${l} made ${prW.obj} earn it.`,
        (w, l, prW, prL) => `${l} deserved to win this. Better form, better instincts, better fight.\n\nBut the log had other plans. One bad rotation and ${l}'s foot finds the edge.\n\nSplash. ${l} hits the water and pounds it with ${prL.pos} fist.`,
        (w, l, prW, prL) => `${l} balanced longer than anyone expected. Outlasted the odds. Almost outlasted ${w}.\n\nAlmost. ${prL.PosAdj} legs finally betrayed ${prL.obj}. Into the water.\n\n${w} stands. Barely. ${prW.Sub} know${prW.sub==='they'?'':'s'} how close that was.`,
        (w, l, prW, prL) => `A heroic effort ends with a splash. ${l} falls — clean, no flailing — and surfaces with a nod.\n\n${w} nods back. Both know the truth: that could have gone either way.\n\nBut it went ${w}'s way. And on RI, that's all that counts.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} doesn't fall. ${l} slides off like melting ice. Slow. Inevitable.\n\nSplash. ${w} stands alone on a log that never threatened ${prW.obj}.\n\n${l} treads water for a moment before swimming to shore. Done.`,
        (w, l, prW, prL) => `${l} sits down on the log. Actually sits. ${prL.Sub} can't stand anymore.\n\nThe sitting doesn't last. ${l} rolls off sideways. Into the water. Into elimination.\n\n${w} barely registers it. ${prW.Sub} ${prW.sub==='they'?'were':'was'} already looking at the horizon.`,
        (w, l, prW, prL) => `${l}'s body gives out. No dramatic fall — just a quiet surrender to gravity.\n\nThe splash is small. ${l} surfaces looking relieved more than defeated.\n\n${w} steps off the log and offers ${l} a hand out of the water. Respect.`,
        (w, l, prW, prL) => `The final rotation takes ${l} without resistance. ${prL.Sub} go${prL.sub==='they'?'':'es'} limp and drops.\n\n${w} watches the splash. The ripples. The silence that follows.\n\nThe arena has its answer.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 4. CLIMBING WALL — physical + boldness
// ═══════════════════════════════════════════════════════════════
'climbing-wall': {
  id: 'climbing-wall', name: 'Climbing Wall', desc: 'Scale a wall and ring the bell at the top.',
  primary: 'physical', secondary: 'boldness',
  phases: [
    { name: 'The First Holds', tag: 'opening' },
    { name: 'The Overhang', tag: 'pivot' },
    { name: 'Race to the Bell', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} attacks the wall. First hold, second, third — no hesitation. Spider-like.\n\n${l} reaches for the first hold and misses. Drops back. Tries again. ${w} is already six feet up.`,
        (w, l, prW, prL) => `Explosive off the ground. ${w} grabs the first hold and launches upward with pure power.\n\n${l} climbs cautiously. Hand, foot, hand, foot. Methodical. Slow. ${w} is already a body length ahead.`,
        (w, l, prW, prL) => `${w} reads the wall instantly — finds the fastest route and commits. No wasted moves.\n\n${l} picks the wrong line. Dead end. Has to traverse sideways. ${w} climbs past without a glance.`,
        (w, l, prW, prL) => `Fearless. ${w} doesn't look down, doesn't pause, doesn't think. Just climbs.\n\n${l} looks down after the first hold. Freezes for a second. That second costs everything.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both launch at the same time. Identical pace, identical aggression.\n\n${w} finds a slightly better hold — one that lets ${prW.obj} skip a step. ${l} takes the extra move.`,
        (w, l, prW, prL) => `${w} and ${l} climb in sync. The wall can't separate them.\n\n${w} reaches a touch higher with each grab. Longer arms? Better reach? Whatever it is, it adds up.`,
        (w, l, prW, prL) => `Side by side up the wall. ${w} makes a risky move — skipping a hold. It works.\n\n${l} plays it safe. Takes every hold. Smart climbing. But slightly slower climbing.`,
        (w, l, prW, prL) => `${l} actually starts faster. Gets a half-body lead. Then ${w} finds a rhythm.\n\n${w} climbs through ${l}'s lead and inches ahead. Barely. The wall is honest — it rewards the faster climber.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} climbs well. Strong holds, good reads, confident movement.\n\n${w} climbs great. Same strength, same reads, slightly more explosive. ${l} is close but trailing.`,
        (w, l, prW, prL) => `${l}'s technique is clean. Textbook climbing. Good body position, smart choices.\n\n${w}'s technique is raw but effective. More power, less finesse. The power is winning.`,
        (w, l, prW, prL) => `${l} moves up the wall with genuine skill. This is a good climber.\n\n${w} is a better climber today. Not by much. But enough to be ahead.`,
        (w, l, prW, prL) => `Nothing wrong with ${l}'s opening. Strong, steady, well-paced.\n\n${w}'s opening is just stronger. The gap is small but it's there.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} grabs the first hold and freezes. Can't move. The height — or the pressure — has ${prL.obj} locked.\n\n${w} scales past like ${l} isn't there.`,
        (w, l, prW, prL) => `${l} slips off the wall entirely. Falls to the mat. Resets.\n\n${w} is already halfway up before ${l} even touches the wall again.`,
        (w, l, prW, prL) => `${l}'s arms can't support ${prL.pos} weight. ${prL.Sub} hang${prL.sub==='they'?'':'s'} off the first hold and drops back.\n\n${w} is climbing like gravity is optional. ${l} is learning gravity is cruel.`,
        (w, l, prW, prL) => `Fear. ${l}'s eyes go wide at the wall. ${prL.Sub} climb${prL.sub==='they'?'':'s'} one hold, looks down, and stalls.\n\n${w} doesn't have time for fear. ${prW.Sub} ${prW.sub==='they'?'are':'is'} already above the halfway mark.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `The overhang. ${w} grabs the lip, swings ${prW.pos} legs, and pulls through. Incredible upper body strength.\n\n${l} hits the overhang and hangs. Just hangs. Can't pull up. ${w} keeps climbing above.`,
        (w, l, prW, prL) => `${w} powers through the overhang like it's a ladder. Pulls, climbs, conquers.\n\n${l} attempts the overhang three times. Falls back twice. ${prL.PosAdj} arms are done.`,
        (w, l, prW, prL) => `The overhang is supposed to be the equalizer. It equalizes nothing. ${w} blasts through.\n\n${l} can barely hold on. The angle is too much. The wall is winning.`,
        (w, l, prW, prL) => `${w} swings past the overhang with a move that looks rehearsed. Smooth. Efficient.\n\n${l} claws at the lip of the overhang. Fingers sliding. Desperate.`,
      ],
      winClose: [
        (w, l, prW, prL) => `The overhang tests both. ${w} struggles — really struggles — but gets through.\n\n${l} struggles the same amount. Both gasping above the lip. But ${w} got there a second earlier.`,
        (w, l, prW, prL) => `${w} takes the overhang on the second attempt. ${l} takes it on the third.\n\nAbove the lip, both panting. ${w} has a hold lead. Maybe two. Razor thin.`,
        (w, l, prW, prL) => `The overhang nearly gets ${w}. ${prW.Sub} hang${prW.sub==='they'?'':'s'} by fingertips for a terrifying second. Then pulls through.\n\n${l} watches and takes a different angle. Smarter. But slower. ${w}'s gamble paid off.`,
        (w, l, prW, prL) => `Both at the overhang simultaneously. ${w} goes left. ${l} goes right.\n\n${w}'s path is shorter. ${l}'s is safer. Short wins today.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} tackles the overhang with real courage. Grabs the lip, swings, pulls.\n\n${w} did the same thing faster. ${l} is through — but trailing. The overhang gave ${w} the break.`,
        (w, l, prW, prL) => `${l}'s overhang technique is actually better — smoother, more controlled.\n\nBut ${w}'s brute force approach was faster. Sometimes finesse loses to power.`,
        (w, l, prW, prL) => `${l} gets through the overhang. Impressively. The crowd would cheer if there was a crowd.\n\n${w} is already three holds above. The overhang didn't close the gap. It widened it.`,
        (w, l, prW, prL) => `${l} powers through the overhang on pure grit. Amazing effort.\n\n${w} powered through on less effort. That energy difference shows in the holds above.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} hits the overhang and stops. Completely. Arms shaking, feet slipping.\n\n${w} is above, climbing toward the bell, while ${l} dangles uselessly from the lip.`,
        (w, l, prW, prL) => `${l} attempts the overhang and falls. The mat catches ${prL.obj}.\n\n${w} doesn't notice. ${prW.Sub}'s through the overhang and climbing. ${l} sits on the mat, looking up.`,
        (w, l, prW, prL) => `The overhang is ${l}'s undoing. ${prL.Sub} can't get past it. Every attempt ends in sliding back.\n\n${w} is somewhere above, already nearing the top. ${l} is stuck in the middle.`,
        (w, l, prW, prL) => `${l}'s fingers give out at the overhang. ${prL.Sub} peel${prL.sub==='they'?'':'s'} off the wall in slow motion.\n\n${w} rings the overhang like it's a door and keeps moving. ${l} is done.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${w} reaches. The bell is right there. One more pull — DING.\n\nThe sound echoes across the arena. ${w} hangs from the top, victorious.\n\n${l} is still on the wall. Halfway up. Looking at a bell ${prL.sub}'ll never ring.`,
        (w, l, prW, prL) => `${w} slaps the bell with authority. DING. Done.\n\n${l} hears it from below. Stops climbing. Lets go. Falls to the mat.\n\nThe wall belonged to ${w} today. Every inch of it.`,
        (w, l, prW, prL) => `The final holds fly by. ${w} grabs the bell and rings it like a victory chime.\n\n${l} looks up from the overhang. The bell might as well be on the moon.\n\nComplete domination of the wall.`,
        (w, l, prW, prL) => `DING. ${w} rings the bell and lets out a roar that bounces off the arena walls.\n\n${l} is clinging to the wall somewhere below. ${prL.Sub} didn't have it today.\n\n${w} knew it from the first hold.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both reaching for the bell. ${w}'s fingertips brush it first. DING.\n\n${l} was reaching too. ${prL.PosAdj} hand closes on air where the bell just was.\n\nInches. The cruelest unit of measurement.`,
        (w, l, prW, prL) => `${w} lunges for the bell — a desperate, one-armed reach. Contact. DING.\n\n${l} lunges a half-second later. ${prL.PosAdj} hand hits ${w}'s. Not the bell.\n\n${w} hangs there panting. ${l} hangs there shattered.`,
        (w, l, prW, prL) => `The last hold. Both reaching. ${w}'s arm is longer — or ${prW.pos} route was better — and the bell rings.\n\n${l} pulls up to see ${w} already touching the bell. One hold short. One heartbreak more.\n\nSo close the bell could taste it.`,
        (w, l, prW, prL) => `${w} pulls up. Reaches. The bell swings — DING.\n\n${l} reaches the same spot two seconds later. Touches the bell softly. It dings for nobody.\n\nTwo seconds. A lifetime on a climbing wall.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} climbs magnificently. Every hold precise. Closing the gap with the bell in sight.\n\nDING. ${w} rings it. ${l} is three holds short.\n\n${l} presses ${prL.pos} forehead against the wall. ${prL.Sub} gave everything the wall asked for. It asked for more.`,
        (w, l, prW, prL) => `${l}'s arms burn but ${prL.sub} keep${prL.sub==='they'?'':'s'} climbing. The bell is close. So close.\n\nDING. Not ${l}'s bell. ${w}'s bell.\n\n${l} stops. Lets out a breath. Climbs down slowly. Head high.`,
        (w, l, prW, prL) => `${l} fought the wall and nearly won. A legitimate contender to the finish.\n\nBut ${w} was just faster. DING goes the bell under ${w}'s palm.\n\n${l} descends with dignity. ${prL.Sub} earned every inch of that wall.`,
        (w, l, prW, prL) => `So close for ${l}. The bell was visible. Reachable. Almost.\n\n${w} reached it first. DING. The sound that ends everything.\n\n${l} slides down the wall. No shame. Just the wrong side of almost.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `DING. ${w}'s bell.\n\n${l} is on the mat below the wall. Gave up. Or fell. Does it matter?\n\nThe wall won before ${w} did. ${l} never had a chance.`,
        (w, l, prW, prL) => `${w} rings the bell triumphantly. Climbs down with energy to spare.\n\n${l} is sitting at the base of the wall. Never made it past the overhang.\n\nSome walls are too high. Some days are too hard.`,
        (w, l, prW, prL) => `The bell rings. DING. ${w} did it.\n\n${l} didn't. Wasn't close. Wasn't going to be close.\n\n${prL.Sub} pick${prL.sub==='they'?'':'s'} up ${prL.pos} torch and walks. The wall stands behind ${prL.obj}, unconquered.`,
        (w, l, prW, prL) => `${w} slaps the bell. Victory.\n\n${l} peels ${prL.ref} off the wall for the last time. The ground catches ${prL.obj} like an old friend.\n\nIt's over. It was always over.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 5. ENDURANCE HOLD — endurance + temperament
// ═══════════════════════════════════════════════════════════════
'endurance-hold': {
  id: 'endurance-hold', name: 'Endurance Hold', desc: 'Hold position on a narrow perch. Last one standing wins.',
  primary: 'endurance', secondary: 'temperament',
  phases: [
    { name: 'Settling In', tag: 'opening' },
    { name: 'The Shaking Starts', tag: 'pivot' },
    { name: 'Who Breaks First', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} steps onto the perch and goes completely still. Breath controlled. Body centered.\n\n${l} shifts immediately. Weight wrong. Foot placement off. Already uncomfortable while ${w} looks like a statue.`,
        (w, l, prW, prL) => `Meditation. ${w}'s eyes close. ${prW.Sub} find${prW.sub==='they'?'':'s'} ${prW.pos} center and locks in.\n\n${l} fidgets. Adjusts. Readjusts. Can't find a position that works. ${w} found it instantly.`,
        (w, l, prW, prL) => `${w} was built for this. Low center of gravity, calm mind, patient soul.\n\n${l} was not. ${prL.Sub} shift${prL.sub==='they'?'':'s'} every few seconds. Arms tense. Face tight. This is going to be long and painful.`,
        (w, l, prW, prL) => `The perch is narrow. ${w} doesn't seem to notice. Plants and holds. Stone.\n\n${l} notices. ${prL.Sub} wobble${prL.sub==='they'?'':'s'} on contact. Grabs for balance. ${w} hasn't moved a muscle.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both settle in quietly. Both find position. Good form from each.\n\n${w}'s breathing is a touch slower. More controlled. ${l}'s is fine but faster. Early signs.`,
        (w, l, prW, prL) => `${w} and ${l} could be mirror images. Same stance, same calm, same focus.\n\n${w} blinks less. It's the smallest tell — but in endurance, the small tells are the real ones.`,
        (w, l, prW, prL) => `Both comfortable. Both ready. The perch can't tell them apart.\n\n${w} has a fractional weight advantage in position. ${l}'s stance is equally good. This will take a while.`,
        (w, l, prW, prL) => `Identical composure. Identical stillness. The arena waits.\n\n${w} settles an ounce deeper into ${prW.pos} stance. ${l}'s stance is perfect too. Endurance challenges are decided in ounces.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} finds a solid stance. Good balance. Controlled breathing. Ready.\n\n${w}'s stance is a shade more stable. ${l} won't notice the difference now. ${prL.Sub}'ll feel it later.`,
        (w, l, prW, prL) => `${l} looks comfortable. Genuinely comfortable. This is ${prL.pos} kind of challenge.\n\n${w} looks the same. The difference isn't visible. It's somewhere deeper — in the reserves they'll need later.`,
        (w, l, prW, prL) => `${l} plants and holds. Good. Very good.\n\n${w} plants and holds better. Not visibly. But the perch knows.`,
        (w, l, prW, prL) => `${l}'s opening position is strong. No complaints. Solid foundation.\n\n${w}'s is equally solid with a touch more natural ease. Born for this vs. trained for this.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} shifts three times in the first minute. Can't get comfortable. The perch feels hostile.\n\n${w} hasn't shifted once. The contrast is stark and immediate.`,
        (w, l, prW, prL) => `${l}'s legs are already shaking. First minute. The perch is too narrow for ${prL.pos} stance.\n\n${w} stands like ${prW.sub}'s waiting for a bus. Casual. Easy. Unfair.`,
        (w, l, prW, prL) => `${l} grips the post for balance. Shouldn't need to this early.\n\n${w} stands freeform. Balanced. Calm. ${l} is fighting the perch already.`,
        (w, l, prW, prL) => `Something is off with ${l}. The positioning, the breathing, the energy — all wrong.\n\n${w} is textbook. The opening tells you everything about how this ends.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `Time passes. ${w} hasn't moved. ${l} has shifted six times and is sweating.\n\n${l}'s calves are cramping visibly. ${prL.Sub} grimace${prL.sub==='they'?'':'s'}. ${w} breathes.`,
        (w, l, prW, prL) => `${w} is in a trance. Time means nothing. Pain means nothing.\n\n${l} is in hell. Every second is eternity. ${prL.PosAdj} legs are screaming and ${prL.pos} face shows it.`,
        (w, l, prW, prL) => `The shaking starts for ${l}. Not subtle — visible tremors from ankle to knee.\n\n${w} is steady. Rock steady. ${prW.Sub} could hold this all day.`,
        (w, l, prW, prL) => `${l} has shifted to one leg, giving the other a rest. Desperate measure.\n\n${w} stands on both feet. Even weight. Even breathing. ${l} is managing pain. ${w} isn't in any.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both shaking now. ${w}'s legs tremble. ${l}'s legs tremble.\n\n${w}'s tremors are finer — muscle fatigue, not failure. ${l}'s are bigger. The distinction matters.`,
        (w, l, prW, prL) => `The pain arrives for both. Calves burning. Feet aching. Neither shows it.\n\n${w} closes ${prW.pos} eyes. ${l} stares straight ahead. Two different coping mechanisms. Same suffering.`,
        (w, l, prW, prL) => `${l} adjusts — a slight weight shift that relieves pressure. Smart.\n\n${w} adjusts too. Same idea. Both adapting. Both surviving. Neither giving an inch.`,
        (w, l, prW, prL) => `Sweat rolls down both faces. Both grimacing. Both refusing to fall.\n\n${w}'s grimace is a shade less desperate. The tiniest margin of remaining composure.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} fights the shake with everything. Willpower vs. physics. Impressive.\n\n${w}'s shake started later and stays smaller. ${l} is fighting harder for worse results.`,
        (w, l, prW, prL) => `${l} should have dropped by now. ${prL.Sub} ${prL.sub==='they'?'haven\'t':'hasn\'t'}. Pure stubbornness.\n\n${w} hasn't dropped either. And ${prW.pos} stubbornness comes with less shake.`,
        (w, l, prW, prL) => `${l} is in agony. Visibly. But ${prL.sub} won't quit. Not yet.\n\n${w} is in pain too. Less visibly. The poker face is worth points here.`,
        (w, l, prW, prL) => `Both suffering. But ${l}'s suffering is louder — sharper breaths, bigger shifts.\n\n${w} suffers quietly. The perch rewards quiet suffering.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s legs give out. ${prL.Sub} catch${prL.sub==='they'?'':'es'} ${prL.ref} on the post. Not standing — hanging.\n\n${w} hasn't moved. The comparison is merciless.`,
        (w, l, prW, prL) => `${l} starts crying. Not from sadness — from pain. The legs are on fire and the mind can't override the body anymore.\n\n${w} watches. No joy in it. Just endurance doing its ugly work.`,
        (w, l, prW, prL) => `The shaking isn't shaking anymore. ${l}'s entire body is convulsing.\n\n${w} is still. The contrast could be a before-and-after photo of defeat.`,
        (w, l, prW, prL) => `${l} is done. ${prL.Sub} know${prL.sub==='they'?'':'s'} it. Everyone knows it. Only the formality of falling remains.\n\n${w} waits. Patient as the perch itself.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${l}'s left foot slides off the perch. Then the right. ${prL.Sub} step${prL.sub==='they'?'':'s'} down.\n\n${w} opens ${prW.pos} eyes. "Done?" ${w} asks. ${l} nods.\n\n${w} steps off the perch voluntarily. ${prW.Sub} could have stayed for hours.`,
        (w, l, prW, prL) => `A quiet fall. ${l}'s knees buckle and ${prL.sub} step${prL.sub==='they'?'':'s'} off like exiting a bus.\n\n${w} watches. Stretches ${prW.pos} calves casually. Steps down.\n\nNot close. Never close.`,
        (w, l, prW, prL) => `${l} says "I'm done" so quietly only ${w} can hear it. ${prL.Sub} step${prL.sub==='they'?'':'s'} off.\n\nThe perch belongs to ${w}. It was never in question.\n\n${w} stands on it a moment longer. Making a point.`,
        (w, l, prW, prL) => `${l}'s body finally vetoes ${prL.pos} will. ${prL.Sub} fall${prL.sub==='they'?'':'s'} off the perch.\n\n${w} stands alone. The arena is silent except for ${w}'s steady breathing.\n\nDomination through patience.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both shaking. Both dying. The perch is a torture device now.\n\n${l}'s foot slips — a millimeter. ${prL.Sub} catch${prL.sub==='they'?'':'es'} it — no. ${prL.Sub} can't. ${prL.Sub} step${prL.sub==='they'?'':'s'} off.\n\n${w} follows ten seconds later. But ten seconds is all that matters.`,
        (w, l, prW, prL) => `${w} is about to fall. Visibly. Teetering. Then ${l} falls first.\n\n${w} steps off immediately. Both collapse. Both cry out from the leg pain.\n\nThe closest endurance finish the arena has ever seen.`,
        (w, l, prW, prL) => `${l} makes a sound — a gasp, a groan — and steps off the perch.\n\n${w} was making the same sound. Just hadn't stepped off yet. Seconds more. Maybe less.\n\n"I almost had it," ${l} says. ${w} nods. ${prW.Sub} know${prW.sub==='they'?'':'s'}.`,
        (w, l, prW, prL) => `Both at their limit. Both past their limit. This is wills fighting bodies.\n\n${l}'s will breaks first. By a whisper. ${prL.Sub} step${prL.sub==='they'?'':'s'} down.\n\n${w}'s will breaks second. Immediate. Right behind ${l}. But second, not first.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} held on beyond what seemed possible. Legs shaking violently. Face contorted.\n\nBut the body has limits. ${l} steps off. ${w} stays.\n\n${l} sat on the ground and stared at ${prL.pos} legs. ${prL.Sub} asked for more than they had.`,
        (w, l, prW, prL) => `A magnificent effort. ${l} lasted longer than ${prL.pos} body should have allowed.\n\n${w} lasted longer still. The perch doesn't award moral victories.\n\n${l} walks away with a limp and ${prL.pos} head held high.`,
        (w, l, prW, prL) => `${l} steps off with dignity. Calm. Accepting.\n\n${w} watches ${l} go and mouths "respect." Means it.\n\nThe perch tested them both. ${w} passed by a margin ${l} can be proud of.`,
        (w, l, prW, prL) => `${l}'s legs finally refuse. Not a dramatic fall — a controlled descent.\n\n${w} stays. Not easily. Not comfortably. But stays.\n\n${l} sits and waits. ${prL.Sub} know${prL.sub==='they'?'':'s'} ${prL.sub} gave every second ${prL.sub} had.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} falls. Not steps off — falls. The legs simply stop working.\n\n${w} watches from the perch. Still standing. Still breathing.\n\n${l} lies on the ground for a long moment before moving. The island took everything.`,
        (w, l, prW, prL) => `${l} quits. Says "I'm out" and steps down like escaping a burning building.\n\n${w} stays on the perch, eyes closed. ${prW.Sub} might be asleep for all the emotion ${prW.sub} show${prW.sub==='they'?'':'s'}.\n\n${l} sits in the sand. Broken.`,
        (w, l, prW, prL) => `It's a mercy when ${l} steps off. ${prL.Sub} was${prL.sub==='they'?'':'n\'t'} going to last another second.\n\n${w} outlasted ${l} by an ocean. Steps down at ${prW.pos} leisure.\n\nSome duels are close. This wasn't one of them.`,
        (w, l, prW, prL) => `${l}'s body ends the debate. Cramps, tremors, and finally — a step off the perch.\n\n${w} stretches on ${prW.pos} perch. Actually stretches. The disrespect is unintentional but devastating.\n\n${l} is already walking away.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 6. WATER CARRY — endurance + physical
// ═══════════════════════════════════════════════════════════════
'water-carry': {
  id: 'water-carry', name: 'Water Carry', desc: 'Fill a bucket by carrying water in leaky containers.',
  primary: 'endurance', secondary: 'physical',
  phases: [
    { name: 'First Trips', tag: 'opening' },
    { name: 'The Grind', tag: 'pivot' },
    { name: 'Final Buckets', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} sprints to the water and back. Barely any spills. Efficient, fast, relentless.\n\n${l} jogs. Sloshes. Half the water never reaches the bucket. ${w} is already two trips ahead.`,
        (w, l, prW, prL) => `${w} discovered the trick — plug the holes with ${prW.pos} fingers, carry close to the body, run smooth.\n\n${l} carries high and loose. Water cascading from every hole. By the time ${prL.sub} reach${prL.sub==='they'?'':'es'} the bucket, almost nothing pours out.`,
        (w, l, prW, prL) => `Trip one: ${w} dumps a full container. Trip two: another. ${w}'s bucket is filling visibly.\n\n${l}'s bucket has a puddle. Maybe. ${prL.Sub}'s losing more to the sand than the bucket.`,
        (w, l, prW, prL) => `${w} moves with purpose. Long strides, minimal sloshing, quick dumps.\n\n${l} looks confused by the leaking container. Tries different grips. Nothing works. ${w} is already on trip three.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both figure out the leaky containers quickly. Similar technique, similar speed.\n\n${w} loses a touch less water per trip. Slightly better grip. Slightly faster pour.`,
        (w, l, prW, prL) => `${w} and ${l} run side by side. Same pace. Same splashing. Same determination.\n\n${w}'s bucket reads slightly higher after the first few trips. Barely visible difference.`,
        (w, l, prW, prL) => `Neck and neck. Both running, both spilling, both dumping. The buckets fill at nearly identical rates.\n\n${w} has maybe a half-inch lead. In a water carry, that's nothing and everything.`,
        (w, l, prW, prL) => `The first trips are chaos for both. Water everywhere. But organized chaos.\n\n${w}'s chaos is slightly more organized. A fraction more water retained per trip.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} runs hard. Good pace, good technique. The bucket fills steadily.\n\n${w}'s fills a bit faster. Not through any brilliance — just slightly better water retention. ${l} is doing everything right.`,
        (w, l, prW, prL) => `${l} is efficient. Quick trips, smart carrying. The water level rises.\n\n${w} is just a tick more efficient. The same effort, marginally better results. ${l} can see the gap.`,
        (w, l, prW, prL) => `${l} has a good system. Cover holes, run straight, pour fast.\n\n${w} has the same system but with bigger hands. Or faster legs. Something. The bucket shows the difference.`,
        (w, l, prW, prL) => `Nothing wrong with ${l}'s approach. Solid. Workmanlike.\n\n${w}'s approach is the same with one more trip's worth of water after the same time.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} drops the container on the first trip. Water everywhere. Picks it up — empty.\n\n${w} has already dumped three loads while ${l} runs back for more.`,
        (w, l, prW, prL) => `${l} can't figure out the container. Tries upside down. Tries cradling it. Water just pours through.\n\n${w} has a system. ${l} has chaos. The buckets tell the story.`,
        (w, l, prW, prL) => `${l} is walking. Not running — walking. The energy isn't there.\n\n${w} sprints past ${l} twice in the time ${l} makes one trip. The gap is absurd.`,
        (w, l, prW, prL) => `${l} dumps ${prL.pos} container and barely anything comes out. ${prL.Sub} lost it all on the walk.\n\n${w}'s bucket is a quarter full. ${l}'s has enough water to drown an ant. Maybe.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `${w}'s bucket is past the halfway mark. Relentless trips, minimal waste.\n\n${l}'s bucket is maybe a quarter full. The pace has slowed. The legs are heavy. The gap is insurmountable.`,
        (w, l, prW, prL) => `${w} keeps running. Same pace as the start. Machine-like endurance.\n\n${l} has slowed to a jog, then a walk. Each trip brings less water. The body is quitting.`,
        (w, l, prW, prL) => `The grind favors ${w}. ${prW.Sub} ${prW.sub==='they'?'thrive':'thrives'} on repetition. Trip after trip. Water rising.\n\n${l} is grinding gears. Slower. Heavier. The container feels like it weighs fifty pounds.`,
        (w, l, prW, prL) => `${w}'s conditioning shows. Breathing hard but running strong.\n\n${l}'s conditioning shows too — in the opposite direction. Gasping. Stumbling. The water splashes out with each stagger.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both flagging now. The grind is real. But both still running.\n\n${w} digs out an extra half-trip somehow. The bucket edge grows by an inch.`,
        (w, l, prW, prL) => `${l} surges — finds a burst. Two fast trips that close the gap.\n\n${w} responds. Matches the burst. Then adds one more trip. The lead holds.`,
        (w, l, prW, prL) => `The buckets are nearly level. Both panting. Both dying. Both running.\n\n${w} retains a touch more water on the last few trips. Fatigue affects grip. ${w}'s grip is holding better.`,
        (w, l, prW, prL) => `Grind against grind. Neither giving up. Both suffering equally.\n\n${w}'s suffering produces slightly more water. That's the entire difference.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} won't slow down. Runs when ${prL.pos} body begs to walk. Dumps every drop ${prL.sub} can save.\n\n${w} runs the same way. But ${w}'s bucket is ahead. ${l}'s heroics can't close the gap.`,
        (w, l, prW, prL) => `${l} is giving an incredible effort. Every trip is agony and ${prL.sub} run${prL.sub==='they'?'':'s'} anyway.\n\n${w} matches the effort. The gap doesn't close. It's stable. Small. But permanent.`,
        (w, l, prW, prL) => `${l} switches strategy — shorter, faster trips. It works. The bucket rises.\n\n${w} sticks with long trips. Both strategies valid. ${w}'s bucket is still ahead. Sometimes head starts matter more than tactics.`,
        (w, l, prW, prL) => `${l} is running on pure heart. The body is done but the spirit keeps the legs moving.\n\n${w}'s spirit AND body are still going. That combination is hard to beat.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} stops running. Walks to the water. Walks back. Dumps almost nothing.\n\n${w} laps ${l} again. The bucket difference is comical now.`,
        (w, l, prW, prL) => `${l} sits down between trips. Just for a second. Then a longer second.\n\n${w} doesn't sit. Doesn't stop. Doesn't slow. ${l}'s rests are ${l}'s death.`,
        (w, l, prW, prL) => `The grind has broken ${l}. ${prL.Sub} ${prL.sub==='they'?'are':'is'} going through the motions. Water dribbles into a bucket that's barely filled.\n\n${w}'s bucket rises steadily. The outcome is decided. Only the formality remains.`,
        (w, l, prW, prL) => `${l} trips and spills everything. Gets up. Refills. Trips again.\n\n${w} passes ${l} without acknowledgment. Both know it's over.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${w} dumps the final load. The bucket overflows. Done.\n\n${l}'s bucket is half full. Maybe. ${l} stops and watches ${w} celebrate.\n\nA grinding victory. Earned one trip at a time.`,
        (w, l, prW, prL) => `The water rises. ${w} dumps one last container and the bucket crests.\n\n${l} is still running. Still trying. But the math was never going to work.\n\n${w} collapses next to ${prW.pos} full bucket. Exhausted. Victorious.`,
        (w, l, prW, prL) => `Full. ${w}'s bucket overflows with the final pour. Victory.\n\n${l} looks at ${prL.pos} half-empty bucket. Looks at ${w}'s full one. Puts down the container.\n\nThe grind never grinds both equally. Today it favored ${w}.`,
        (w, l, prW, prL) => `${w}'s last trip is a victory lap. Jogging. Smiling. The bucket was already full.\n\n${l} dumps what's left. It barely registers. ${prL.PosAdj} bucket tells a different story than ${prL.sub} wanted.\n\nOutworked. Outrun. Outlasted.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both buckets nearly full. Both players running on fumes. One last trip each.\n\n${w}'s bucket overflows first. By a single pour.\n\n${l}'s overflows seconds later. Seconds. The cruelest kind of loss.`,
        (w, l, prW, prL) => `${w} dumps and it's enough. The bucket crests. Water spills over the sides.\n\n${l} dumps right after. ${prL.PosAdj} bucket is a pour short. ONE POUR.\n\n${l} screams into the sky. ${w} can't even celebrate — too tired.`,
        (w, l, prW, prL) => `Racing for the bucket. Both carrying final loads. ${w} gets there first. Dumps. Full.\n\n${l} dumps too. Almost full. Not full. Not enough.\n\nBoth collapse. Both gasping. Only one with a full bucket.`,
        (w, l, prW, prL) => `The final trips. Side by side. Water sloshing, legs burning.\n\n${w}'s bucket fills to the brim. ${l}'s sits a half-inch below the line.\n\nA half-inch. That's what separates staying from going.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} runs until ${prL.pos} legs can't carry ${prL.obj}. The bucket fills. Rises. But not fast enough.\n\n${w}'s overflows. Done. ${l} has a trip or two left when it ends.\n\n${l} drops the container. Water splashes ${prL.pos} feet. So close to full.`,
        (w, l, prW, prL) => `${l} gave an incredible effort. The bucket reflects it — nearly full.\n\nNearly. ${w}'s bucket IS full. The line was the same for both. ${w} crossed it first.\n\n${l} deserved better. The bucket disagreed.`,
        (w, l, prW, prL) => `${l}'s bucket was going to overflow on the next trip. The NEXT trip.\n\n${w}'s overflowed on this one. Game over.\n\n${l} stands there holding a container of water with nowhere to pour it.`,
        (w, l, prW, prL) => `Every drop ${l} carried mattered. Every trip counted. It just wasn't enough trips.\n\n${w}'s bucket is full. ${l}'s is close. Close is a word for losers.\n\n${l} empties ${prL.pos} last container onto the ground. Done.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${w}'s bucket overflows. ${l}'s bucket is... barely a third.\n\n${l} didn't have it today. Didn't have the legs, the lungs, or the luck.\n\n${l} sits next to ${prL.pos} bucket. The water inside is still. Like ${l}'s chances.`,
        (w, l, prW, prL) => `It's over. ${w}'s bucket is full. ${l} stopped running five minutes ago.\n\n${l} watches from the ground. Container beside ${prL.obj}. Given up or given out — does it matter?\n\n${w} collapses too, but next to a full bucket. That's the only difference that counts.`,
        (w, l, prW, prL) => `${w} pours the final load. Full bucket. Fist in the air.\n\n${l} is sitting by the water source. Never made the last trip.\n\nThe grind won. ${l} lost.`,
        (w, l, prW, prL) => `${w}'s bucket overflows and the victory is anticlimactic. ${l} was never in this.\n\n${l} accepts it quietly. Picks up ${prL.pos} torch.\n\nSome challenges expose you. This one exposed ${l}.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 7. HAND ON IDOL — endurance + loyalty
// ═══════════════════════════════════════════════════════════════
'hand-on-idol': {
  id: 'hand-on-idol', name: 'Hand on Idol', desc: 'Keep your hand on the immunity idol. Last to let go wins.',
  primary: 'endurance', secondary: 'loyalty',
  phases: [
    { name: 'Hands On', tag: 'opening' },
    { name: 'The Temptation', tag: 'pivot' },
    { name: 'The Final Hour', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} places ${prW.pos} hand on the idol and goes still. Total focus. This could last days.\n\n${l} grips too tight. Knuckles white. Already burning energy ${prL.sub} can't afford.`,
        (w, l, prW, prL) => `Light touch. ${w} barely presses the idol. Smart — conserving grip strength.\n\n${l} squeezes like it might escape. ${prL.PosAdj} forearm is already tense. Bad strategy for a long game.`,
        (w, l, prW, prL) => `${w}'s hand finds the idol and relaxes. Patient. ${prW.Sub} could stand here forever.\n\n${l}'s hand trembles on contact. Nerves or fatigue — either way, it's early for that.`,
        (w, l, prW, prL) => `Calm radiates from ${w}. Hand on idol. Mind somewhere else. Zen.\n\n${l} is already anxious. Shifting weight. Adjusting grip. The idol challenge hasn't started and ${prL.sub}'s already fighting it.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both hands find the idol. Both competitors settle in. Equal composure.\n\n${w}'s touch is a fraction lighter. ${l}'s a fraction firmer. In a long hold, light touch wins.`,
        (w, l, prW, prL) => `Mirror images. Both calm. Both ready. Both committed to not letting go.\n\n${w} finds a slightly more comfortable stance. ${l}'s stance is fine. The difference is invisible.`,
        (w, l, prW, prL) => `${w} and ${l} lock in simultaneously. Eyes forward. Hands steady.\n\n${w} breathes through the nose. ${l} through the mouth. Both work. ${w}'s conserves a touch more energy.`,
        (w, l, prW, prL) => `The idol feels cold under both hands. Neither speaks. Neither moves.\n\n${w} has a marginally better grip position — more of the palm, less finger pressure. Subtleties that add up over hours.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s opening is strong. Good grip. Good stance. Measured breathing.\n\n${w}'s is the same — with a trace more natural patience. ${l} is disciplined. ${w} is designed for this.`,
        (w, l, prW, prL) => `${l} settles into a warrior's stance. Hand firm, mind focused.\n\n${w} settles into something calmer. Not tense — just present. ${l}'s approach is admirable. ${w}'s is slightly more sustainable.`,
        (w, l, prW, prL) => `${l} looks ready for war. Determined. Fierce.\n\n${w} looks ready for a nap. That's the advantage — ${w} isn't spending energy on looking ready.`,
        (w, l, prW, prL) => `Both locked on. ${l}'s grip is perfect.\n\n${w}'s grip is perfect too. But ${w}'s shoulders are lower. Less tension. More longevity.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s hand shakes the moment it touches the idol. Already.\n\n${w}'s hand is a stone on a pillar. The contrast is everything.`,
        (w, l, prW, prL) => `${l} grips too hard, too fast. ${prL.PosAdj} forearm cramps within the first minute.\n\n${w} barely touches the idol. Loose. Easy. While ${l} fights ${prL.pos} own grip.`,
        (w, l, prW, prL) => `${l} can't find a comfortable position. Hand on, hand off, readjust. On again.\n\n${w} placed ${prW.pos} hand once and hasn't moved it. ${l}'s fidgeting is a red flag.`,
        (w, l, prW, prL) => `Something is wrong with ${l}'s energy. Depleted before this even started.\n\n${w} is full. Fresh. Ready. ${l} is running on empty at the starting line.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `Time stretches. ${w} is in a zone — mind wandering, body holding. Effortless.\n\n${l} is fighting every second. Grip loosening. Must re-tighten. Again. And again.`,
        (w, l, prW, prL) => `${w} hasn't shifted once. ${l} has shifted eleven times. Both counting.\n\n${l}'s arm is cramping. The elbow locked too long. ${w}'s arm swings free — light grip, no cramp.`,
        (w, l, prW, prL) => `The idol test reveals character. ${w}'s character: patience incarnate.\n\n${l}'s character: desperate and fading. The gap in composure is a canyon.`,
        (w, l, prW, prL) => `${w} could be meditating. Breathing slow. Pulse visible and steady.\n\n${l}'s breathing is ragged. ${prL.Sub} keep${prL.sub==='they'?'':'s'} checking ${prW.pos} hand. Still there. But for how much longer?`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both suffering now. Hands numb. Legs aching from standing. Neither gives.\n\n${w} closes ${prW.pos} eyes and finds another gear. ${l} watches ${w} and tries to match the calm.`,
        (w, l, prW, prL) => `The temptation to let go is real for both. Just let go. Just be done.\n\n${w} pushes through the impulse. ${l} pushes through too. But ${w}'s push is a shade stronger.`,
        (w, l, prW, prL) => `${l} adjusts grip — switches from palm to fingertips. Creative. Buys time.\n\n${w} makes the same switch a minute later. Same idea. Both adapting. Both surviving.`,
        (w, l, prW, prL) => `Rain starts. Both hands slip. Both grab tighter. Neither lets go.\n\n${w} recovers the grip a half-second faster. In an idol challenge, half-seconds compound.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} is fighting beautifully. Switching grips, flexing fingers, managing the pain.\n\n${w} isn't fighting at all. Just... holding. ${l}'s effort is admirable. ${w}'s effortlessness is devastating.`,
        (w, l, prW, prL) => `${l}'s arm burns but ${prL.sub} won't switch. Won't adjust. Raw stubbornness.\n\n${w} made a smart switch ten minutes ago and is more comfortable for it. ${l}'s stubbornness is honorable but costly.`,
        (w, l, prW, prL) => `${l} is giving everything to stay on the idol. It shows in every clenched muscle.\n\n${w} is giving less and getting the same result. Efficiency wins endurance challenges.`,
        (w, l, prW, prL) => `${l} talks to ${prL.ref}. "Stay on. Stay on." Mantras and willpower.\n\n${w} doesn't need mantras. ${prW.Sub} just stay${prW.sub==='they'?'':'s'} on. The simplicity is the weapon.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s hand is barely touching the idol now. Fingertips grazing the surface.\n\n${w}'s palm is flat against it. Full contact. ${l} is hanging on by a thread.`,
        (w, l, prW, prL) => `${l} pulls ${prL.pos} hand away — stretches it — puts it back. Almost let go.\n\n${w} never moved. ${l}'s mini-breaks are desperation dressed as strategy.`,
        (w, l, prW, prL) => `The idol is too much for ${l}. The standing. The holding. The waiting.\n\n${w} was built for waiting. ${l} was built for everything except this.`,
        (w, l, prW, prL) => `${l} starts crying with ${prL.pos} hand on the idol. The frustration of a body that won't cooperate.\n\n${w} watches. Stays. ${prW.PosAdj} hand doesn't waver.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `${l}'s hand slides off. ${prL.Sub} grab${prL.sub==='they'?'':'s'} at the idol — too late. Gone.\n\n${w} stands with ${prW.pos} hand on the idol, unmoved. Steps away when the result is called.\n\nThe idol was never going to be ${l}'s today.`,
        (w, l, prW, prL) => `"I can't." ${l} says it quietly. ${prL.PosAdj} hand falls to ${prL.pos} side.\n\n${w} lifts ${prW.pos} hand off the idol slowly. Deliberately. Victory by patience.\n\n${l} sits down. ${prL.Sub} tried. The idol knew.`,
        (w, l, prW, prL) => `${l}'s fingers unpeel one by one. Pinky. Ring. Middle. Index. Thumb.\n\n${w} watches each finger go. Then removes ${prW.pos} own hand. Winner.\n\nThe slowest defeat in arena history.`,
        (w, l, prW, prL) => `${l} lets go. Not a slip — a conscious decision. The body has spoken.\n\n${w} takes ${prW.pos} hand off the idol and shakes it out. Still strong.\n\n${l} was never close. The idol always belonged to ${w}.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both hands trembling on the idol. Both about to let go. Any second now.\n\n${l}'s hand lifts. A millimeter. Then fully. Gone.\n\n${w}'s hand lifts right after. Half a second. But that half-second is the whole game.`,
        (w, l, prW, prL) => `${l} looks at ${w}. ${w} looks at ${l}. Both know the other is dying.\n\n${l} blinks. ${prL.PosAdj} hand comes off. ${w} almost follows but catches ${prW.ref}.\n\n"Oh god," ${w} breathes. "I was about to let go too."`,
        (w, l, prW, prL) => `The final moments. Both hands shaking like leaves. The idol vibrates.\n\n${l}'s grip fails. Fingers can't hold. The hand falls away.\n\n${w}'s grip fails too — ten seconds later. But ten seconds is eternity here.`,
        (w, l, prW, prL) => `It ends in a whisper. ${l}'s hand leaves the idol. Barely a movement. A giving-up of contact.\n\n${w} stays for a moment. Then lets go with a gasp.\n\nSo close that the idol couldn't tell the difference. But the rules could.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} held on for hours. HOURS. An extraordinary display of willpower.\n\nBut ${w} held on longer. ${l}'s hand finally let go and ${prL.sub} looked like ${prL.sub} ${prL.sub==='they'?'were':'was'} watching ${prL.pos} dream walk away.\n\n${w} held the idol a moment longer. Felt the weight of what it meant.`,
        (w, l, prW, prL) => `${l}'s hand comes off and ${prL.sub} immediately pound${prL.sub==='they'?'':'s'} the ground. So close. SO close.\n\n${w} removes ${prW.pos} hand gently. Both know how close it was.\n\n${l} lasted longer than anyone expected. Just not longer than ${w}.`,
        (w, l, prW, prL) => `${l} showed why ${prL.sub} belong${prL.sub==='they'?'':'s'} on Redemption Island. That was a champion's effort.\n\n${w} showed why ${prW.sub} ${prW.sub==='they'?'are':'is'} the champion still standing. Barely.\n\nBoth pushed past limits. ${w} found one more.`,
        (w, l, prW, prL) => `A beautiful battle of wills. ${l}'s will broke first, but only just.\n\n${w}'s will held. By a thread. By a prayer. But it held.\n\n${l} shakes ${w}'s hand. Real respect. The idol tested them both.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l}'s hand slides off and ${prL.sub} doesn't try to catch it. Done. Finished.\n\n${w} stands alone at the idol. ${prW.Sub} won because ${l} couldn't last. Not because ${w} was challenged.\n\nThe idol waits for a real contest. This wasn't one.`,
        (w, l, prW, prL) => `${l} drops. Hand off, knees bending, body folding.\n\n${w} removes ${prW.pos} hand and helps ${l} up. "Come on." Not cruelty. Mercy.\n\n${l} takes the hand. Stands. Walks away.`,
        (w, l, prW, prL) => `The idol releases ${l}. Or ${l} releases the idol. Either way, it's over.\n\n${w} steps back from the idol untouched by doubt.\n\n${l} sits in the sand. The idol gleams above ${prL.obj}. Unreachable now.`,
        (w, l, prW, prL) => `${l} quits. Clear and simple. Hand off, eyes down.\n\n${w} watches ${l} walk away, hand still on the idol.\n\n${prW.Sub} won. ${l} lost. The idol doesn't care about either of them.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 8. SLIDE PUZZLE — mental + strategic
// ═══════════════════════════════════════════════════════════════
'slide-puzzle': {
  id: 'slide-puzzle', name: 'Slide Puzzle', desc: 'Complete a slide puzzle under pressure.',
  primary: 'mental', secondary: 'strategic',
  phases: [
    { name: 'Reading the Board', tag: 'opening' },
    { name: 'The Middle Game', tag: 'pivot' },
    { name: 'Solving the Sequence', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `${w} studies the board. Three seconds. Then starts sliding tiles with purpose.\n\n${l} stares at the puzzle like it's written in a foreign language. Slides a tile. Wrong. Slides it back.`,
        (w, l, prW, prL) => `Click. Click. Click. ${w}'s tiles move in a clear sequence. ${prW.Sub} see${prW.sub==='they'?'':'s'} the solution already.\n\n${l} moves a tile and creates a worse mess. Panic creeps into ${prL.pos} eyes.`,
        (w, l, prW, prL) => `${w} reads the board and finds the pattern. Systematic. Confident.\n\n${l} pushes tiles at random. No strategy. No vision. Just desperate movement.`,
        (w, l, prW, prL) => `Three tiles into position already. ${w} is solving this like ${prW.sub}'s done it a hundred times.\n\n${l} hasn't solved a single placement. The board is chaos and ${prL.sub} can't see through it.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both reading the board. Both finding moves. Similar pace.\n\n${w} makes one smarter sequence — three tiles in two moves. ${l} takes three moves for the same result.`,
        (w, l, prW, prL) => `${w} and ${l} both start strong. Tiles clicking. Boards reorganizing.\n\n${w} has a slight edge in sequencing — seeing two moves ahead instead of one.`,
        (w, l, prW, prL) => `The opening moves are identical. Same tiles. Same direction. Same speed.\n\n${w} diverges at the fourth move. A more efficient path. ${l}'s path works too — just takes one more step.`,
        (w, l, prW, prL) => `Both puzzlers look sharp. Quick reads. Quick slides.\n\n${w}'s first section clicks into place a beat before ${l}'s. The tiniest edge.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} reads the board well. Smart opening. Good tile progression.\n\n${w} reads it a touch better. One less wasted move. ${l} is close but trailing.`,
        (w, l, prW, prL) => `${l}'s approach is sound. Logical. Methodical.\n\n${w}'s approach is the same with a dash more intuition. ${l} calculates. ${w} sees.`,
        (w, l, prW, prL) => `${l} solves the first section clean. No wasted moves. Impressive.\n\n${w} solved it one move faster. Not better technique — better vision.`,
        (w, l, prW, prL) => `${l} is a good puzzler. Organized, patient, systematic.\n\n${w} is a great puzzler today. The gap is small but real.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} freezes. The puzzle is overwhelming. Too many tiles, too many options.\n\n${w} is already four tiles in. ${l} hasn't moved one.`,
        (w, l, prW, prL) => `${l} slides a tile, then slides it back. Then forward. Then back. Stuck in a loop.\n\n${w} flows through the opening section. ${l} is paralyzed by choice.`,
        (w, l, prW, prL) => `${l}'s hands hover over the puzzle. Can't decide. Can't commit.\n\n${w} commits immediately. Right or wrong, ${prW.sub} move${prW.sub==='they'?'':'s'}. ${l} waits and waits and waits.`,
        (w, l, prW, prL) => `The puzzle has beaten ${l} mentally. ${prL.Sub} push${prL.sub==='they'?'':'es'} tiles at random now. No plan.\n\n${w} has a plan and it's working. Each tile finds its home.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `${w}'s board is taking shape. The image forming. Tiles clicking into place.\n\n${l}'s board is a mess. Worse than the start. ${prL.Sub} tried something and it backfired.`,
        (w, l, prW, prL) => `The middle section is where great puzzlers separate from good ones. ${w} navigates it clean.\n\n${l} hits a wall. Can't figure out how to move the center tile without destroying the edges.`,
        (w, l, prW, prL) => `${w} is on autopilot now. The pattern is clear. Just execution.\n\n${l} is stuck in a loop — three tiles that keep ending up in the wrong order. Over and over.`,
        (w, l, prW, prL) => `More than half solved. ${w} slides tiles with growing confidence.\n\n${l} is maybe a quarter done and losing ground. Every move seems to create a new problem.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both boards taking shape. Both puzzlers deep in concentration.\n\n${w} solves a tricky center section with an elegant sequence. ${l} solves it with brute force. Both work. ${w}'s was faster.`,
        (w, l, prW, prL) => `${l} finds a brilliant move — three tiles into position at once. Closes the gap.\n\n${w} responds with a sequence of ${prW.pos} own. The lead holds. Barely.`,
        (w, l, prW, prL) => `The middle game is tight. Both boards at similar stages. Both minds racing.\n\n${w} avoids one trap that ${l} falls into. One wasted move for ${l}. That's the margin.`,
        (w, l, prW, prL) => `${l} is actually faster in the middle section. Catches up.\n\n${w}'s lead from the opening still holds — but it's thinner. This is going to come down to the final section.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} grinds through the middle. Not pretty but effective. Tiles finding homes.\n\n${w}'s middle was prettier and faster. ${l} can see ${w}'s board from here. Knows what's coming.`,
        (w, l, prW, prL) => `${l}'s puzzle instincts are sharp. ${prL.Sub} find${prL.sub==='they'?'':'s'} moves ${prL.sub} didn't see before. The gap closes.\n\nBut ${w}'s instincts found them first. Always one step ahead.`,
        (w, l, prW, prL) => `${l} is doing well. Genuinely well. This is a strong middle-game performance.\n\n${w}'s is stronger. Not by much. But by exactly enough.`,
        (w, l, prW, prL) => `${l} refuses to fall behind. Pushes harder. Thinks faster. The puzzle responds.\n\n${w} pushes back. Every gain ${l} makes, ${w} matches. The lead persists.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${l} has destroyed ${prL.pos} progress. A wrong sequence undid everything. Back to square one.\n\n${w} is nearly done. The gap is the entire puzzle now.`,
        (w, l, prW, prL) => `${l} stares at the board. Not seeing. Not thinking. Just staring.\n\n${w}'s tiles click into place behind ${l}. Each click a reminder of what losing sounds like.`,
        (w, l, prW, prL) => `The puzzle has won. ${l} moves tiles with no purpose. Defeated before the finish.\n\n${w} arranges the final section calmly. ${l} has given up inside.`,
        (w, l, prW, prL) => `${l} sits back from the puzzle. Hands in ${prL.pos} lap. Done trying.\n\n${w} keeps going. Doesn't notice ${l}'s surrender. Too focused on winning.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `The last tile clicks. ${w}'s puzzle is complete. Perfect image.\n\n${l}'s puzzle is a shattered mirror of wrong tiles. ${prL.Sub} look${prL.sub==='they'?'':'s'} at ${w}'s board. Then ${prL.pos} own.\n\nThe difference between seeing the solution and searching for one.`,
        (w, l, prW, prL) => `Click. Done. ${w} steps back from a completed puzzle.\n\n${l} is still moving tiles when the call comes. ${prL.PosAdj} hands freeze mid-slide.\n\n${w} solved it. ${l} was still trying to understand it.`,
        (w, l, prW, prL) => `${w} places the final tile with a satisfied tap. Complete.\n\n${l} has a puzzle that's maybe half-right. The other half is chaos.\n\nA mental mismatch from start to finish.`,
        (w, l, prW, prL) => `The puzzle submits to ${w}. Every tile in place. Every section aligned.\n\n${l} steps back from a puzzle that looks nothing like the target.\n\n${w} saw what ${l} couldn't. That's the whole story.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both boards nearly complete. Both down to the final tiles. This is a race now.\n\n${w} slides the last tile. Click. Done.\n\n${l} slides ${prL.pos} last tile one second later. One second. ${prL.Sub} scream${prL.sub==='they'?'':'s'}.`,
        (w, l, prW, prL) => `${w} sees it — the final sequence. Three moves. Click. Click. Click. Done.\n\n${l} sees it too. Same sequence. But ${w} got there one move earlier.\n\nA puzzle decided by a single tile's journey.`,
        (w, l, prW, prL) => `The final section. Both hands moving. Both brains firing.\n\n${w}'s last tile slides home. The puzzle lights up. Done.\n\n${l}'s last tile was in ${prL.pos} hand. One move from completion. ${prL.Sub} set${prL.sub==='they'?'':'s'} it down.`,
        (w, l, prW, prL) => `It comes down to the last two tiles. Both competitors see the end.\n\n${w}'s fingers are faster. Click. Solved.\n\n${l}'s board sits one swap from perfection. So close the puzzle mocks ${prL.obj}.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s puzzle is close. Really close. A few tiles from completion.\n\nBut ${w}'s is done. ${l} stops. Looks at ${prL.pos} nearly-finished board.\n\n${prL.Sub} was${prL.sub==='they'?'':'n\'t'} outmatched. Just outsped.`,
        (w, l, prW, prL) => `${l} solves ${prL.pos} puzzle beautifully — thirty seconds after ${w}.\n\nThirty seconds. ${l}'s solution was elegant. ${w}'s was faster.\n\n${l} completed the puzzle to prove something. To ${prL.ref}.`,
        (w, l, prW, prL) => `${l}'s puzzle was going to be solved. The path was clear, the moves mapped out.\n\n${w}'s path was clearer. ${prW.PosAdj} moves faster. The puzzle ended before ${l} could finish.\n\n${l} stares at ${prL.pos} almost-complete board. This close.`,
        (w, l, prW, prL) => `${l} fought the puzzle honestly. Good reads, good moves, good effort.\n\n${w} fought it better. The final tile difference is small. The result is not.\n\n${l} nods to ${w}. One puzzler respecting another.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${w}'s puzzle clicks complete. ${l}'s looks like a toddler's art project.\n\n${l} sits back. Nothing more to try. Nothing more to give.\n\nThe puzzle won. ${l} lost. ${w} was just the instrument.`,
        (w, l, prW, prL) => `Click. ${w}'s done.\n\n${l} looks down at a puzzle that never had a chance. Not because it was hard. Because ${l} couldn't focus.\n\nThe island takes your body first. Then your mind. ${l} learned that today.`,
        (w, l, prW, prL) => `${w} completes the puzzle and exhales.\n\n${l} is already walking away from ${prL.pos}. Left it mid-solve. Or mid-destruction.\n\nSome puzzles solve people. This one solved ${l}.`,
        (w, l, prW, prL) => `Done. ${w}'s tiles are perfect.\n\n${l}'s tiles are scattered like ${prL.pos} chances. Random. Wrong. Finished.\n\n${prL.Sub} pick${prL.sub==='they'?'':'s'} up ${prL.pos} torch. The puzzle stays behind, unsolved.`,
      ],
    },
  },
},

// ═══════════════════════════════════════════════════════════════
// 9. MEMORY SEQUENCE — mental + intuition
// ═══════════════════════════════════════════════════════════════
'memory-sequence': {
  id: 'memory-sequence', name: 'Memory Sequence', desc: 'Memorize a sequence of symbols and recreate it.',
  primary: 'mental', secondary: 'intuition',
  phases: [
    { name: 'The First Pattern', tag: 'opening' },
    { name: 'Longer Sequences', tag: 'pivot' },
    { name: 'The Final Memory', tag: 'climax' },
  ],
  narration: {
    opening: {
      winDom: [
        (w, l, prW, prL) => `The symbols flash. ${w}'s eyes lock on. When it's time to recreate, ${prW.pos} hands move without hesitation. Perfect.\n\n${l} stares at the blank board. "${prL.Sub} saw the first three but... the fourth? Was it the wave or the star?" Wrong answer.`,
        (w, l, prW, prL) => `${w} nails the first sequence instantly. Not a pause. Not a doubt.\n\n${l} gets it wrong. Tries again. Wrong again. The simplest pattern and ${prL.sub} can't hold it.`,
        (w, l, prW, prL) => `Photographic. ${w} sees the sequence once and reproduces it perfectly.\n\n${l} sees it three times and still gets the last symbol wrong. The memory isn't there.`,
        (w, l, prW, prL) => `${w}'s brain is a camera. Click — stored. Click — reproduced. Perfect recall.\n\n${l}'s brain is fog. The sequence enters and dissolves. Nothing sticks.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Both nail the first sequence. Quick. Clean. No errors.\n\n${w} finishes a half-beat faster — ${prW.pos} recall just slightly sharper. ${l}'s is nearly as fast.`,
        (w, l, prW, prL) => `The first pattern is short. Both get it right. Both confident.\n\n${w} commits it to memory on the first flash. ${l} needs the second look. Tiny difference.`,
        (w, l, prW, prL) => `Both reproduce the opening sequence correctly. Strong starts.\n\n${w}'s was placed with more certainty — no hesitation at symbol three. ${l} paused briefly. Right answer, less confidence.`,
        (w, l, prW, prL) => `Mirror accuracy. Both boards match the target. Perfect from both.\n\n${w}'s approach was calmer. ${l}'s had a moment of doubt at the end. Both right. ${w} was more right.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} gets the first sequence right. Good memory. Clear recall.\n\n${w} gets it right faster. ${l}'s recall is strong — ${w}'s is just slightly stronger.`,
        (w, l, prW, prL) => `${l} reproduces the pattern with confidence. Well done.\n\n${w} reproduces it with the same confidence and a heartbeat less time.`,
        (w, l, prW, prL) => `${l}'s memory is sharp. The symbols stay clear. Good recall.\n\n${w}'s memory is a blade. Same symbols, sharper edges, faster access.`,
        (w, l, prW, prL) => `${l} nails it. Nothing to criticize.\n\n${w} nails it too. Just a touch quicker. The opening round goes to ${w} by the slimmest margin.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `The first pattern flashes and ${l}'s mind goes blank. Complete reset.\n\n${w} places symbols while ${l} stares at an empty board. The gap is immediate and shocking.`,
        (w, l, prW, prL) => `${l} can't hold four symbols. ${prL.Sub} get${prL.sub==='they'?'':'s'} two right and two wrong.\n\n${w} gets all four. The memory challenge is supposed to start easy. For ${l}, nothing is easy.`,
        (w, l, prW, prL) => `${l} places symbols in the wrong order. Swaps them. Still wrong.\n\n${w} is done before ${l} has committed to a single placement. A mental mismatch.`,
        (w, l, prW, prL) => `The sequence flashes and ${l}'s brain refuses to cooperate. Stress. Fatigue. The island.\n\n${w}'s brain is cooperating perfectly. Each symbol filed and retrieved on demand.`,
      ],
    },
    pivot: {
      winDom: [
        (w, l, prW, prL) => `The sequences get longer. Seven symbols now. ${w} reproduces them cold. No errors.\n\n${l} can barely remember four. The longer patterns are impossible. ${prL.Sub} guess${prL.sub==='they'?'':'es'} at the last three.`,
        (w, l, prW, prL) => `${w}'s system is working — grouping symbols, finding patterns within patterns. Brilliant.\n\n${l} has no system. Brute-force memorization. And it's failing as the sequences grow.`,
        (w, l, prW, prL) => `Eight symbols. ${w} smiles. Likes the challenge. Places them all correctly.\n\n${l} gets the first five. The last three are guesses. Wrong guesses.`,
        (w, l, prW, prL) => `The longer sequences should be the equalizer. They're not. ${w} absorbs them all.\n\n${l} can't hold this much information. Each new symbol pushes an old one out. A leaking memory.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Seven symbols. Both pause. Both think. ${w} places them — correct.\n\n${l} places them — one wrong. The sixth symbol. Close. But wrong is wrong.`,
        (w, l, prW, prL) => `The sequences grow and both memories strain. This is the true test.\n\n${w} gets the pivot sequence right after a long pause. ${l} gets it right too — after a longer pause.`,
        (w, l, prW, prL) => `Both struggling now. The patterns are complex. Eight symbols in a specific order.\n\n${w} finds the right answer through a mnemonic. ${l} finds it through trial and error. Both arrive. ${w} arrives first.`,
        (w, l, prW, prL) => `${l} nearly catches up here. Gets a tricky sequence that ${w} paused on.\n\nBut ${w} got it right. ${l} made one swap. So close to tying it up.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l}'s memory is holding. Not perfect but functional. One error in a seven-symbol sequence.\n\n${w} had zero errors. ${l}'s one mistake is the margin. One symbol.`,
        (w, l, prW, prL) => `${l} fights through the longer sequences with real determination. Gets most right.\n\nMost isn't all. ${w} gets all. The distinction is cruel but real.`,
        (w, l, prW, prL) => `${l} develops a grouping strategy — pairs of symbols. Smart. It helps.\n\n${w} was grouping from the start. ${l}'s adaptation is too late to close the gap.`,
        (w, l, prW, prL) => `${l}'s memory holds under pressure. A genuine mental athlete.\n\n${w}'s holds better. The pivot round goes to ${w} by a whisker.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `The longer sequences break ${l}. Seven symbols might as well be seventy.\n\n${w} absorbs them effortlessly while ${l} stares at blank spaces where memories should be.`,
        (w, l, prW, prL) => `${l} can't remember what was shown five seconds ago. The mind is gone.\n\n${w} places symbols with mechanical precision. ${l} places prayers.`,
        (w, l, prW, prL) => `${l} puts symbols down at random. ${prL.Sub} know${prL.sub==='they'?'':'s'} they're wrong. ${prL.Sub} put${prL.sub==='they'?'':'s'} them down anyway.\n\n${w} doesn't notice. Too busy being right.`,
        (w, l, prW, prL) => `The memory challenge has revealed a gap that willpower can't bridge.\n\n${w}'s mind is sharp. ${l}'s mind is exhausted. The symbols know the difference.`,
      ],
    },
    climax: {
      winDom: [
        (w, l, prW, prL) => `The final sequence. Ten symbols. ${w} closes ${prW.pos} eyes. Opens them. Places each one. Perfect.\n\n${l} gets three right out of ten. ${prL.Sub} know${prL.sub==='they'?'':'s'} before the check.\n\n${w}'s board is a perfect mirror. ${l}'s is abstract art.`,
        (w, l, prW, prL) => `${w} places the final symbol with a quiet confidence. Checks the board. All correct.\n\n${l}'s board is wrong. So wrong. The symbols mock ${prL.obj} from their incorrect positions.\n\nA mental mismatch from first pattern to last.`,
        (w, l, prW, prL) => `Ten symbols. ${w} doesn't hesitate on any of them. Ten for ten. Victory.\n\n${l} stares at ${prL.pos} board. Half right, half wrong. The half that's right isn't enough.\n\n${w} proved something today. ${l} learned something today.`,
        (w, l, prW, prL) => `The final sequence was supposed to be the hardest. For ${w}, it was just ten more symbols to remember.\n\n${l} couldn't remember ten. Or eight. Or six.\n\nThe memory doesn't lie. It just fails. And ${l}'s failed.`,
      ],
      winClose: [
        (w, l, prW, prL) => `Ten symbols. Both competitors close their eyes. Both replay the sequence.\n\n${w} opens ${prW.pos} eyes and places them. Checks. All correct.\n\n${l} places them. Checks. Nine correct. One wrong. The eighth symbol. ${prL.Sub} pound${prL.sub==='they'?'':'s'} the table.`,
        (w, l, prW, prL) => `The final memory. ${w} places symbols slowly, carefully. Each one deliberate.\n\n${l} places ${prL.pos} just as carefully. Same pace. Same intensity.\n\n${w}: correct. ${l}: one swap. Two symbols reversed. That swap is the game.`,
        (w, l, prW, prL) => `Both boards look right. Both competitors think they've won.\n\nThe check comes. ${w}: perfect. ${l}: one error. Position seven.\n\n${l}'s face falls. ${prL.Sub} ${prL.sub==='they'?'were':'was'} so sure. The memory betrayed ${prL.obj} at the end.`,
        (w, l, prW, prL) => `${w} places the last symbol and steps back. Done.\n\n${l} places ${prL.pos} last symbol and steps back. Done.\n\n${w}: ten for ten. ${l}: nine for ten. The cruelest number in Redemption Island math.`,
      ],
      loseHard: [
        (w, l, prW, prL) => `${l} recalled nine out of ten. An amazing performance. On any other day, that wins.\n\n${w} recalled ten. Today is not any other day.\n\n${l} stares at the single wrong symbol. The one that cost everything.`,
        (w, l, prW, prL) => `${l}'s memory was sharp. Genuinely sharp. The recall was impressive.\n\n${w}'s recall was perfect. Sharp vs. perfect. No contest.\n\n${l} can hold ${prL.pos} head high. ${prL.Sub} proved ${prL.pos} mind.`,
        (w, l, prW, prL) => `${l} fought the memory challenge with everything ${prL.sub} had. Got close. So close.\n\n${w} got closer. All the way. Ten for ten vs. ${l}'s near-miss.\n\nA brilliant effort from ${l}. Just not brilliant enough.`,
        (w, l, prW, prL) => `${l} deserved a better outcome. The recall was strong, the effort total.\n\nBut this isn't about deserving. ${w} remembered more. That's all that counts.\n\n${l} walks away knowing ${prL.sub} gave a champion's effort. It's cold comfort.`,
      ],
      loseCollapse: [
        (w, l, prW, prL) => `${w}'s board is perfect. Ten symbols, ten correct.\n\n${l}'s board is empty. ${prL.Sub} didn't even try to place the final sequence. The mind gave up.\n\nA total mental surrender.`,
        (w, l, prW, prL) => `${l} places symbols at random for the final round. Any symbol, any spot. Who cares.\n\n${w} places them correctly. All of them. The contrast is everything.\n\n${l}'s mind left Redemption Island days ago. ${prL.PosAdj} body finally followed.`,
        (w, l, prW, prL) => `The final pattern was ten symbols long. ${l} remembered two. Maybe one.\n\n${w} remembered all ten. Placed them like a machine.\n\n${l} sits beside ${prL.pos} wrong board. The symbols stare up at ${prL.obj}, misplaced and final.`,
        (w, l, prW, prL) => `${w} wins the memory challenge with clinical precision.\n\n${l} lost it somewhere around pattern five. Everything after was guessing.\n\nThe mind is the last thing to go on Redemption Island. For ${l}, it went first.`,
      ],
    },
  },
},

};

export const CHALLENGE_IDS = Object.keys(CHALLENGE_BANK);
