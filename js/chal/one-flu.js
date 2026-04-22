// js/chal/one-flu.js — One Flu Over the Cuckoos medical challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ─── Text Pools ───────────────────────────────────────────────────────────────

const FLU_HOST = {
  studyIntro: [
    `"Alright, listen up! Tonight one tribe studies for the toughest medical exam of your lives — the others crash early. Choose wisely!"`,
    `"Before the challenge begins, your tribes have a choice: hit the books or hit the hay. Decisions, decisions!"`,
    `"Here's the deal — half of you study, half of you sleep. Tomorrow we find out which half made the right call!"`,
  ],
  quizIntro: [
    `"Welcome to the Wawanakwa Medical Quiz! Get it right, send a diver into the eel tank. Get it wrong — watch someone else win!"`,
    `"Five rounds, five chances to prove your tribe knows its medical facts. The eel tank awaits the brave and the brilliant!"`,
    `"Books open? Too bad — they're closed now. Let's see what actually stuck. The eel tank doesn't care about excuses!"`,
  ],
  quizQuestion: [
    `"Question time! Here's your medical scenario — first tribe to buzz with the right answer sends a diver!"`,
    `"Alright, tribes — here comes a curveball. Think fast, answer faster. Your diver is waiting!"`,
    `"Medical mystery incoming! Does your tribe have what it takes, or did someone sleep through anatomy class?"`,
  ],
  correctAnswer: [
    `"That is CORRECT! Your tribe's diver hits the eel tank — let's see if they come back with the goods!"`,
    `"Right answer! Now comes the fun part — who's brave enough to go swimming with the eels?"`,
    `"Nailed it! The eel tank door opens — go get that body part!"`,
  ],
  wrongAnswer: [
    `"WRONG! That's embarrassing. You really should have studied harder."`,
    `"Incorrect! Your tribe stands down while the competition scoops up another body part."`,
    `"Not even close! Maybe try staying awake next time instead of snoring through study hour."`,
  ],
  eelWarning: [
    `"Heads up, diver! Three shocks and you're out — those eels are not playing around!"`,
    `"Into the tank! Remember — every jolt counts. Three strikes and that body part stays where it is!"`,
    `"The eels are hungry and they've been fed nothing but attitude. Get in there and good luck!"`,
  ],
  diveSuccess: [
    `"They've got it! A body part successfully retrieved from the eel tank — someone's getting a new appendix!"`,
    `"Part secured! That diver just earned their tribe a massive advantage at the assembly table!"`,
    `"Victory from the tank! That's guts — literally — and a point for the tribe!"`,
  ],
  diveFailShock: [
    `"Shocking! Too many jolts — that diver had to bail empty-handed!"`,
    `"The eels win this round! Three shocks — no part for that tribe today."`,
    `"Three strikes from the eels! That diver's done. The body part stays in the tank!"`,
  ],
  diveFailMiss: [
    `"So close! The part slipped right through their fingers. Better luck next dive!"`,
    `"They got past the eels but couldn't grab the part. Sometimes the tank just wins."`,
    `"In and out, but empty-handed. The grab just wasn't there this time."`,
  ],
  assemblyStart: [
    `"With all the parts collected, it's time for the medical assembly! First tribe to build their patient correctly wins immunity!"`,
    `"Body parts: check. Assembly table: check. A fake plastic patient in desperate need: absolutely check. Let's go!"`,
    `"The trivia and the diving are done. Now it's pure surgery time — put that patient back together and WIN!"`,
  ],
};

const FLU_ASSEMBLY = {
  teamwork: [
    (name, pr) => `${name} takes charge at the assembly table — ${pr.sub} calls out placement order and the tribe snaps into sync.`,
    (name, pr) => `${name} spots the misaligned elbow joint and quietly corrects it. ${pr.Sub}'s the reason this patient isn't a disaster.`,
    (name, pr) => `"Left arm goes THERE," ${name} barks. ${pr.Sub} grabs a piece mid-air and locks it in. The tribe finds its rhythm.`,
  ],
  partFail: [
    (name, pr) => `${name} confidently snaps the ribcage on backwards. ${pr.Sub} stares at it for a full three seconds before admitting the error.`,
    (name, pr) => `${name} holds up two identical-looking limbs. ${pr.Sub} picks the wrong one. The patient now has two left hands.`,
    (name, pr) => `The pelvic bone slips from ${name}'s grip and clatters onto the table. ${pr.Sub} looks at the host. The host shrugs.`,
  ],
  pantsPull: [
    (a, b, aPr, bPr) => `${a} ducks under the assembly table and yanks ${b}'s shorts as ${bPr.sub} reaches for a part. ${b} shrieks. The body part goes flying.`,
    (a, b, aPr, bPr) => `${a} and ${b} have been glaring at each other all challenge. ${a} finally snaps — ${aPr.sub} grabs ${b}'s waistband mid-reach and pulls. Chaos.`,
    (a, b, aPr, bPr) => `Nobody expects ${a} to pants ${b} during a medical challenge. Least of all ${b}. The tribe erupts. The host takes notes.`,
  ],
  hoistStruggle: [
    (name, pr) => `${name} grabs the patient's torso and heaves — barely. ${pr.Sub} wobbles under the weight and nearly drops the whole thing.`,
    (name, pr) => `The completed torso is heavier than it looks. ${name} braces ${pr.posAdj} legs, strains, and hauls it up by sheer will.`,
    (name, pr) => `"Lift WITH your legs!" someone yells at ${name}. ${pr.Sub} does not lift with ${pr.posAdj} legs. ${pr.Sub} lifts with ${pr.posAdj} face.`,
  ],
  lightning: [
    (name, pr) => `${name} moves at lightning speed — snap, snap, snap — three parts locked in before anyone else gets one.`,
    (name, pr) => `${name} has clearly done a puzzle before. ${pr.Sub} slots the spine into place before the host finishes talking.`,
    (name, pr) => `"How did you—" someone starts. ${name} has already finished ${pr.posAdj} third piece. ${pr.Sub} winks.`,
  ],
};

const FLU_SYMPTOMS = {
  // Easy (threshold 0.3)
  itchyLips: 'Their lips are an itching, twitching catastrophe — they cannot stop poking at them.',
  runnyNose: 'Their nose is a faucet with no off switch. A full roll of paper towels has been sacrificed.',
  hiccups: 'Each hiccup jolts their whole body. They are vibrating at a frequency nobody asked for.',
  sneezingFits: 'They sneeze in clusters of seven — always seven — and emerge looking personally offended each time.',
  wateryEyes: 'Their eyes are producing tears at industrial scale. They are not sad; they are simply leaking.',
  // Medium (threshold 0.5)
  hotFlashes: 'Their face switches between lobster-red and ghost-pale every ninety seconds.',
  dizzySpells: 'They spin in a slow circle for no reason, then act like nothing happened.',
  stomachCramps: 'They are doubled over and using aggressive breathing to defeat their own intestines.',
  phantomPain: 'They keep grabbing a limb that is completely fine and insisting it is broken.',
  excessiveSweating: 'They have soaked through two shirts. There is a small puddle forming.',
  // Hard (threshold 0.65)
  explosiveDiarrhea: 'They are speed-walking to the tree line every six minutes with alarming urgency.',
  speakingGibberish: 'Perfectly coherent thoughts are leaving their brain as pure word salad. They seem unaware.',
  temporaryBlindness: 'They are walking into things. All of the things. Every single one.',
  fullBodyRash: 'Every inch of exposed skin is a horrifying shade of crimson. They have stopped looking at themselves.',
  uncontrollableLaughter: 'Everything is funny to them now. The challenge, the pain, existence. They cannot stop.',
  // Critical (threshold 0.8)
  paralysisPanic: 'Their left side has checked out entirely. They are operating at 50% with 100% fear.',
  amnesiaEpisode: 'They have forgotten their own tribe name twice. They are currently unsure if they like pizza.',
  faintingLoop: 'They faint, get helped up, and faint again. A predictable and terrible loop.',
  hallucinations: 'They are having a full conversation with someone who is not there. It seems to be going well.',
  bubbleBoy: 'They have inflated to alarming proportions and are rolling around like a human beach ball.',
};

const FLU_DISEASE_EVENTS = {
  cureSuccess: [
    (doctor, patient, symptom) => `${doctor} checks the charts and slaps the right treatment on ${patient}'s ${symptom}. It clears instantly.`,
    (doctor, patient, symptom) => `${doctor} figures it out — confident, quick, no wasted motion. ${patient}'s ${symptom} is handled.`,
    (doctor, patient, symptom) => `"Got it!" ${doctor} announces. ${patient} blinks. The ${symptom} is gone. Miracle of medicine.`,
  ],
  cureFail: [
    (doctor, patient, symptom) => `${doctor} tries three treatments on ${patient}'s ${symptom}. None work. ${patient} hiccups at ${doctor} apologetically.`,
    (doctor, patient, symptom) => `The cure attempt misses — ${doctor} misread the chart. ${patient}'s ${symptom} rages on.`,
    (doctor, patient, symptom) => `${doctor} second-guesses at the last second. Wrong call. ${patient}'s ${symptom} laughs at the attempt.`,
  ],
  chaosEvent: [
    (name, pr) => `${name} rolls across the medical bay like a bowling ball, scattering equipment and concentration alike.`,
    (name, pr) => `${name} collapses dramatically mid-treatment. Everyone freezes. ${pr.Sub} opens one eye to check if anyone's watching.`,
    (name, pr) => `${name} announces loudly that ${pr.sub}'s writing ${pr.posAdj} will. ${pr.Sub} begins dictating. Nobody asked.`,
  ],
  comfortEvent: [
    (helper, patient, hPr, pPr) => `${helper} puts a hand on ${patient}'s shoulder. "You're going to be okay." ${patient} nods, marginally less panicked.`,
    (helper, patient, hPr, pPr) => `${patient} grabs ${helper}'s arm in terror. ${helper} doesn't pull away. The contact helps — somehow.`,
    (helper, patient, hPr, pPr) => `${helper} talks ${patient} through the symptoms in a calm voice. ${patient}'s breathing slows. Small miracle.`,
  ],
};

const FLU_DRAMA_EVENTS = [
  {
    id: 'alliancePitch',
    check(ep, all) {
      const schemers = all.filter(n => {
        const arch = players.find(p => p.name === n)?.archetype || 'floater';
        return ['villain','mastermind','schemer'].includes(arch);
      });
      return schemers.length > 0 && all.length > 2;
    },
    apply(ep, all) {
      const schemers = all.filter(n => {
        const arch = players.find(p => p.name === n)?.archetype || 'floater';
        return ['villain','mastermind','schemer'].includes(arch);
      });
      const schemer = schemers[Math.floor(Math.random() * schemers.length)];
      const others = all.filter(n => n !== schemer);
      const target = others[Math.floor(Math.random() * others.length)];
      const sPr = pronouns(schemer);
      const texts = [
        `While waiting for the next phase, ${schemer} pulls ${target} aside and whispers something about jury votes. ${target} nods slowly.`,
        `${schemer} uses the downtime between assembly and outbreak to plant seeds. ${sPr.Sub} finds ${target} and drops a name.`,
        `"Between you and me," ${schemer} starts. ${target} leans in. They talk for three minutes. Nobody misses it.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      addBond(schemer, target, 0.3);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[schemer] = (gs.popularity[schemer] || 0) - 1;
      return { text: txt, players: [schemer, target], badgeText: 'ALLIANCE PITCH', badgeClass: 'purple' };
    },
  },
  {
    id: 'studyRegret',
    check(ep, all) {
      const ss = ep.oneFlu?.studySleep?.tribes || {};
      return Object.values(ss).some(t => t.sleepers?.length > 0);
    },
    apply(ep, all) {
      const ss = ep.oneFlu?.studySleep?.tribes || {};
      const sleepers = Object.values(ss).flatMap(t => t.sleepers || []).filter(n => all.includes(n));
      if (!sleepers.length) return null;
      const name = sleepers[Math.floor(Math.random() * sleepers.length)];
      const pr = pronouns(name);
      const texts = [
        `${name} watches the other tribe ace the quiz and mutters, "Maybe I should have studied." ${pr.Sub} says this to no one.`,
        `${name} stares at the quiz results. ${pr.Sub} slept. ${pr.Sub} knew this would happen. ${pr.Sub} did it anyway.`,
        `"In hindsight," ${name} tells a tribemate, "the sleep was a mistake." They nod. They do not disagree.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[name] = (gs.popularity[name] || 0) - 1;
      return { text: txt, players: [name], badgeText: 'STUDY REGRET', badgeClass: 'gray' };
    },
  },
  {
    id: 'pizzaSuspicion',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const a = all[Math.floor(Math.random() * all.length)];
      const others = all.filter(n => n !== a);
      const b = others[Math.floor(Math.random() * others.length)];
      const aPr = pronouns(a);
      const texts = [
        `${a} sniffs the leftover pizza from the previous night. ${aPr.Sub} looks at ${b}. ${b} looks away. "Did you do this?" The silence is loud.`,
        `${a} finds a half-eaten slice of pizza near the medical supplies. ${aPr.Sub} holds it up like evidence. Accusatory stares follow.`,
        `"The pizza was sabotaged," ${a} announces. Nobody can confirm or deny. ${b} sweats slightly.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      addBond(a, b, -0.3);
      return { text: txt, players: [a, b], badgeText: 'PIZZA SUSPICION', badgeClass: 'orange' };
    },
  },
  {
    id: 'rivalryPrank',
    check(ep, all) {
      for (const a of all) {
        for (const b of all) {
          if (a !== b && getBond(a, b) <= -2) return true;
        }
      }
      return false;
    },
    apply(ep, all) {
      let prankPairs = [];
      for (const a of all) {
        for (const b of all) {
          if (a !== b && getBond(a, b) <= -2) prankPairs.push([a, b]);
        }
      }
      const [pranker, victim] = prankPairs[Math.floor(Math.random() * prankPairs.length)];
      const pPr = pronouns(pranker);
      const texts = [
        `${pranker} swaps ${victim}'s medical reference chart with a children's coloring book. ${victim} doesn't notice until it's too late.`,
        `${pranker} hides half of ${victim}'s assembled parts under the table. The look on ${victim}'s face is priceless.`,
        `${victim} reaches for the cure kit — it's been glued shut. Across the room, ${pranker} is very carefully not laughing.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      addBond(pranker, victim, -0.4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[pranker] = (gs.popularity[pranker] || 0) - 1;
      if (!gs._fluHeat) gs._fluHeat = {};
      gs._fluHeat[victim] = { target: pranker, amount: 1.2, expiresEp: (gs.episode || 0) + 3 };
      return { text: txt, players: [pranker, victim], badgeText: 'RIVALRY PRANK', badgeClass: 'red' };
    },
  },
  {
    id: 'exhaustionDrama',
    check(ep, all) {
      return all.some(n => pStats(n).endurance < 5);
    },
    apply(ep, all) {
      const exhausted = all.filter(n => pStats(n).endurance < 5);
      const name = exhausted[Math.floor(Math.random() * exhausted.length)];
      const pr = pronouns(name);
      const texts = [
        `${name} sits down between phases and doesn't get back up for a while. ${pr.Sub}'s running on empty and everyone can see it.`,
        `${name} leans against the assembly table with ${pr.posAdj} eyes half-closed. Someone nudges ${pr.obj}. ${pr.Sub} startles awake.`,
        `"I'm fine," ${name} insists, clearly not fine. ${pr.Sub} has been standing in the same spot for four minutes.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[name] = (gs.popularity[name] || 0) - 1;
      return { text: txt, players: [name], badgeText: 'EXHAUSTION', badgeClass: 'gray' };
    },
  },
  {
    id: 'secretDeal',
    check(ep, all) { return all.length >= 3; },
    apply(ep, all) {
      const a = all[Math.floor(Math.random() * all.length)];
      const others = all.filter(n => n !== a);
      const b = others[Math.floor(Math.random() * others.length)];
      const aPr = pronouns(a);
      const texts = [
        `${a} catches ${b} alone during the phase break. They shake hands on something. Nobody knows what. Nobody asks.`,
        `${a} and ${b} disappear behind the medical tent for two minutes. They come back acting normal. Too normal.`,
        `${a} writes something on a paper scrap and passes it to ${b}. ${b} reads it, nods once, pockets it.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      addBond(a, b, 0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 1;
      return { text: txt, players: [a, b], badgeText: 'SECRET DEAL', badgeClass: 'teal' };
    },
  },
  {
    id: 'sleepGuilt',
    check(ep, all) {
      const ss = ep.oneFlu?.studySleep?.tribes || {};
      const sleepers = Object.values(ss).flatMap(t => t.sleepers || []);
      return sleepers.some(n => all.includes(n));
    },
    apply(ep, all) {
      const ss = ep.oneFlu?.studySleep?.tribes || {};
      const sleepers = Object.values(ss).flatMap(t => t.sleepers || []).filter(n => all.includes(n));
      const studiers = Object.values(ss).flatMap(t => t.studiers || []).filter(n => all.includes(n));
      if (!sleepers.length || !studiers.length) return null;
      const sleeper = sleepers[Math.floor(Math.random() * sleepers.length)];
      const studier = studiers[Math.floor(Math.random() * studiers.length)];
      const sPr = pronouns(sleeper);
      const texts = [
        `${sleeper} approaches ${studier} with an awkward shrug. "You really pulled your weight in the quiz. I, uh… slept." They laugh it off. Mostly.`,
        `${sleeper} can't meet ${studier}'s eyes after the quiz phase. ${sPr.Sub} mumbles something that sounds like an apology. ${studier} waves it off.`,
        `"Next time I'll study," ${sleeper} tells ${studier}. ${studier} raises an eyebrow. "Will you?" A pause. "No," ${sleeper} admits.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      addBond(sleeper, studier, 0.2);
      return { text: txt, players: [sleeper, studier], badgeText: 'SLEEP GUILT', badgeClass: 'blue' };
    },
  },
  {
    id: 'medicalHumor',
    check(ep, all) { return all.length >= 1; },
    apply(ep, all) {
      const name = all[Math.floor(Math.random() * all.length)];
      const pr = pronouns(name);
      const texts = [
        `${name} holds up the plastic small intestine and squints at it. "This is definitely a shoe," ${pr.sub} announces. The tribe loses it.`,
        `${name} accidentally sneezes onto the assembled patient and sends three parts flying. The host watches. He's not amused. Everyone else is.`,
        `${name} reads the fake symptom card aloud — 'excessive toe flexibility' — and can't finish the sentence without laughing.`,
      ];
      const txt = texts[Math.floor(Math.random() * texts.length)];
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[name] = (gs.popularity[name] || 0) + 2;
      return { text: txt, players: [name], badgeText: 'MEDICAL HUMOR', badgeClass: 'gold' };
    },
  },
];

const FLU_STUDY = {
  studied: [
    (name, pr) => `${name} pores over the medical charts late into the night, muttering symptoms to ${pr.posAdj} self.`,
    (name, pr) => `${name} doesn't waste a second — ${pr.sub} grabs the reference books and starts drilling terminology.`,
    (name, pr) => `"I am NOT losing a quiz to eels," ${name} announces, cracking open every binder ${pr.sub} can find.`,
    (name, pr) => `${name} quizzes ${pr.posAdj} tribemates until they beg for mercy, then quizzes ${pr.ref} some more.`,
  ],
  slept: [
    (name, pr) => `${name} takes one look at the medical binders, shrugs, and is snoring within three minutes.`,
    (name, pr) => `"My body is my temple and my temple needs rest," ${name} declares, flopping face-first into ${pr.posAdj} sleeping bag.`,
    (name, pr) => `${name} reasons that confidence beats memorization — then falls asleep mid-argument.`,
    (name, pr) => `${name} waves off the study materials. "Natural instinct," ${pr.sub} says. ${pr.Sub} is asleep before dark.`,
  ],
};

const FLU_QUIZ_EVENTS = {
  eelDodge: [
    (diver, pr) => `${diver} twists at the last second — an eel lunges and misses. ${pr.Sub} snatches the part and scrambles for the surface!`,
    (diver, pr) => `The eel strikes — but ${diver} saw it coming. ${pr.Sub} ducks sideways, grabs the body part, and rockets upward.`,
    (diver, pr) => `${diver}'s intuition fires: dodge left, grab right, surface fast. The eel is left biting nothing but water.`,
  ],
  wrongAnswer: [
    (player, pr) => `${player} buzzes in with total confidence — and total wrongness. ${pr.Sub} stares at the host in disbelief.`,
    (player, pr) => `"Is it… scurvy?" ${player} guesses. The host's silence says everything. ${pr.Sub} sinks into ${pr.posAdj} seat.`,
    (player, pr) => `${player} freezes mid-answer, changes direction, and gets it completely wrong. The tribe groans in unison.`,
  ],
  ropeSnap: [
    (diver, pr) => `The safety rope jerks taut — then snaps. ${diver} tumbles deeper into the tank and takes a shock before surfacing.`,
    (diver, pr) => `${diver} reaches for the body part but the rope catches on the tank wall. An eel finds ${pr.obj} in the confusion — zap.`,
    (diver, pr) => `Equipment failure: ${diver}'s rope frays on the metal grate and ${pr.sub} drifts too close to the eel nest. Shocked.`,
  ],
  partTheft: [
    (villain, victim, vPr, viPr) => `While ${victim}'s tribe celebrates their dive, ${villain} walks off with the body part they left on the table. Nobody sees it happen.`,
    (villain, victim, vPr, viPr) => `${villain} sidles over to ${victim}'s side during the commotion and pockets their hard-won body part. ${vPr.Sub} grins.`,
    (villain, victim, vPr, viPr) => `${villain} spots ${viPr.posAdj} chance — ${victim} is distracted celebrating. One body part goes missing. ${vPr.Sub} whistles innocently.`,
  ],
  studyFlex: [
    (player, pr) => `${player} nails the answer instantly — those late-night study sessions paid off. ${pr.Sub} doesn't even hesitate.`,
    (player, pr) => `The question barely finishes before ${player} buzzes in. ${pr.Sub} studied this exact scenario last night.`,
    (player, pr) => `${player} recites the answer word-for-word from the medical binder. Studying: zero regrets.`,
  ],
  sleepFumble: [
    (player, pr) => `${player} fumbles the question — ${pr.sub} clearly didn't study. By pure luck, ${pr.sub} blurts the right answer anyway. The host looks annoyed.`,
    (player, pr) => `${player} had no idea what the question was about, guessed anyway, and somehow got it wrong. Sleep was a bad call.`,
    (player, pr) => `${player} stares at the host blankly. "I, uh… bones?" Wrong. ${pr.Sub} was absolutely not prepared for this.`,
  ],
};

// ─── Study / Sleep Decision ───────────────────────────────────────────────────

function _simulateStudySleep(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const campKey = gs.tribes[0]?.name || 'merge';

  const archStudyMod = {
    mastermind: 0.15, 'perceptive-player': 0.15, schemer: 0.15,
    'loyal-soldier': 0.05, 'social-butterfly': 0.05, showmancer: 0.05,
    underdog: 0, goat: 0, floater: 0,
    'challenge-beast': -0.08, hothead: -0.08, villain: -0.08,
    'chaos-agent': -0.15, wildcard: -0.15,
  };

  const studySleepTribes = {};

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const scores = members.map(name => {
      const st = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || 'floater';
      const raw = st.mental * 0.05 + st.intuition * 0.03 + st.strategic * 0.02
        + st.loyalty * 0.02 - st.boldness * 0.03 - st.endurance * 0.02
        + (Math.random() - 0.5) * 0.4 + (archStudyMod[arch] || 0);
      return { name, chance: Math.min(0.9, Math.max(0.1, raw)) };
    });

    // Initial assignment
    let studiers = scores.filter(s => Math.random() < s.chance).map(s => s.name);
    let sleepers = members.filter(n => !studiers.includes(n));

    const n = members.length;
    const maxSleep = n <= 3 ? 1 : 2;

    // Enforce: at least 1 studier
    if (studiers.length === 0) {
      const topMental = [...scores].sort((a, b) => {
        return pStats(b.name).mental - pStats(a.name).mental;
      })[0].name;
      studiers = [topMental];
      sleepers = members.filter(n => n !== topMental);
    }

    // Force lowest-mental to sleep if all studied
    if (sleepers.length === 0) {
      const lowestMental = [...members].sort((a, b) => pStats(a).mental - pStats(b).mental)[0];
      sleepers = [lowestMental];
      studiers = studiers.filter(n => n !== lowestMental);
    }

    // Trim sleepers if too many
    while (sleepers.length > maxSleep || sleepers.length >= studiers.length) {
      // Move highest-mental sleeper back to studiers
      const best = sleepers.sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
      sleepers = sleepers.filter(n => n !== best);
      studiers.push(best);
    }

    studySleepTribes[tribe.name] = { studiers, sleepers };
  }

  result.studySleep = { tribes: studySleepTribes };

  // Camp events
  for (const [tName, { studiers, sleepers }] of Object.entries(studySleepTribes)) {
    const allMembers = [...studiers, ...sleepers];
    // Study events
    for (const name of studiers) {
      const pr = pronouns(name);
      const txt = FLU_STUDY.studied[Math.floor(Math.random() * FLU_STUDY.studied.length)](name, pr);
      ep.campEvents[campKey].post.push({
        text: txt,
        players: [name],
        badgeText: 'STUDYING', badgeClass: 'blue',
        tag: 'study',
      });
    }
    // Sleep events
    for (const name of sleepers) {
      const pr = pronouns(name);
      const txt = FLU_STUDY.slept[Math.floor(Math.random() * FLU_STUDY.slept.length)](name, pr);
      ep.campEvents[campKey].post.push({
        text: txt,
        players: [name],
        badgeText: 'SLEEPING', badgeClass: 'gray',
        tag: 'sleep',
      });
    }
  }

  result.phases.push('studySleep');
}

// ─── Medical Quiz + Eel Tank ──────────────────────────────────────────────────

function _simulateMedicalQuiz(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const campKey = gs.tribes[0]?.name || 'merge';
  const ss = result.studySleep?.tribes || {};

  const partsByTribe = {};
  tribeMembers.forEach(t => { partsByTribe[t.name] = 0; });

  const rounds = [];
  const events = [];

  // Track last answerer and last diver per tribe to avoid back-to-back
  const lastAnswerer = {};
  const lastDiver = {};

  if (!ep.chalMemberScores) ep.chalMemberScores = {};

  function isStudied(name) {
    for (const d of Object.values(ss)) {
      if (d.studiers?.includes(name)) return true;
    }
    return false;
  }

  function pick(arr, exclude) {
    const pool = arr.filter(n => n !== exclude);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : arr[Math.floor(Math.random() * arr.length)];
  }

  function addScore(name, delta) {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + delta;
    result.tribeScores[tribeMembers.find(t => t.members.includes(name))?.name] =
      (result.tribeScores[tribeMembers.find(t => t.members.includes(name))?.name] || 0) + delta;
  }

  for (let r = 0; r < 5; r++) {
    const round = { number: r + 1, answers: {}, winnerTribe: null, diver: null, partRetrieved: false, events: [] };

    // Each tribe picks an answerer
    const answerers = {};
    for (const tribe of tribeMembers) {
      answerers[tribe.name] = pick(tribe.members, lastAnswerer[tribe.name]);
      lastAnswerer[tribe.name] = answerers[tribe.name];
    }
    round.answerers = { ...answerers };

    // Roll answers
    const rolls = {};
    for (const [tName, name] of Object.entries(answerers)) {
      const st = pStats(name);
      const studied = isStudied(name);
      rolls[tName] = st.mental * 0.06 + (studied ? 0.2 : -0.2) + (Math.random() - 0.5) * 0.3;
    }

    // Events for this round — build candidate list
    const candidates = [];

    for (const [tName, name] of Object.entries(answerers)) {
      const pr = pronouns(name);
      const studied = isStudied(name);
      const st = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || 'floater';

      // studyFlex
      if (studied && Math.random() < 0.35) {
        candidates.push({ type: 'studyFlex', weight: 0.35, name, pr, tName });
      }
      // sleepFumble
      if (!studied && Math.random() < 0.3) {
        candidates.push({ type: 'sleepFumble', weight: 0.3, name, pr, tName });
      }
      // wrongAnswer (any)
      if (Math.random() < 0.3) {
        candidates.push({ type: 'wrongAnswer', weight: 0.3, name, pr, tName });
      }
    }

    // partTheft — needs a villain in any tribe
    for (const tribe of tribeMembers) {
      for (const name of tribe.members) {
        const arch = players.find(p => p.name === name)?.archetype || 'floater';
        if ((arch === 'villain' || arch === 'schemer' || arch === 'mastermind') && Math.random() < 0.25) {
          // find a victim tribe with parts
          const victimTribes = tribeMembers.filter(t => t.name !== tribe.name && partsByTribe[t.name] > 0);
          if (victimTribes.length) {
            const victimTribe = victimTribes[Math.floor(Math.random() * victimTribes.length)];
            const victim = victimTribe.members[Math.floor(Math.random() * victimTribe.members.length)];
            candidates.push({ type: 'partTheft', weight: 0.25, villain: name, victim, vPr: pronouns(name), viPr: pronouns(victim), villainTribe: tribe.name, victimTribeName: victimTribe.name });
          }
        }
      }
    }

    // Pick 1-2 events, normalized weights, deduplicate types
    const numEvents = Math.random() < 0.5 ? 1 : 2;
    const chosenTypes = new Set();
    const roundEvents = [];
    const sorted = [...candidates].sort(() => Math.random() - 0.5);
    for (const c of sorted) {
      if (roundEvents.length >= numEvents) break;
      if (chosenTypes.has(c.type)) continue;
      chosenTypes.add(c.type);
      roundEvents.push(c);
    }

    // Apply roll modifiers from events before resolving winner
    const rollMods = {};
    for (const ev of roundEvents) {
      if (ev.type === 'studyFlex') {
        const pool = FLU_QUIZ_EVENTS.studyFlex;
        const txt = pool[Math.floor(Math.random() * pool.length)](ev.name, ev.pr);
        round.events.push({ type: 'studyFlex', text: txt, player: ev.name });
        events.push({ round: r + 1, type: 'studyFlex', text: txt });
        rollMods[ev.tName] = (rollMods[ev.tName] || 0) + 0.1;
        addScore(ev.name, 1);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[ev.name] = (gs.popularity[ev.name] || 0) + 1;
      } else if (ev.type === 'sleepFumble') {
        const lucky = Math.random() < 0.2;
        if (!lucky) {
          const pool = FLU_QUIZ_EVENTS.sleepFumble;
          const txt = pool[Math.floor(Math.random() * pool.length)](ev.name, ev.pr);
          round.events.push({ type: 'sleepFumble', text: txt, player: ev.name });
          events.push({ round: r + 1, type: 'sleepFumble', text: txt });
          rollMods[ev.tName] = (rollMods[ev.tName] || 0) - 0.1;
        }
        // lucky = correct anyway, no penalty
      } else if (ev.type === 'wrongAnswer') {
        const pool = FLU_QUIZ_EVENTS.wrongAnswer;
        const txt = pool[Math.floor(Math.random() * pool.length)](ev.name, ev.pr);
        round.events.push({ type: 'wrongAnswer', text: txt, player: ev.name });
        events.push({ round: r + 1, type: 'wrongAnswer', text: txt });
        rollMods[ev.tName] = (rollMods[ev.tName] || 0) - 0.2;
      }
    }

    // Apply mods
    for (const [tName, mod] of Object.entries(rollMods)) {
      rolls[tName] = (rolls[tName] || 0) + mod;
    }

    // Determine round winner (highest roll) — wrongAnswer tribe can't win
    const wrongAnswerTribes = new Set(roundEvents.filter(e => e.type === 'wrongAnswer').map(e => e.tName));
    const eligible = Object.entries(rolls).filter(([t]) => !wrongAnswerTribes.has(t));
    if (eligible.length === 0) {
      // All wrong — no dive this round
      round.winnerTribe = null;
      rounds.push(round);
      continue;
    }

    const winnerEntry = eligible.sort((a, b) => b[1] - a[1])[0];
    const winnerTribeName = winnerEntry[0];
    round.winnerTribe = winnerTribeName;
    round.answererCorrect = answerers[winnerTribeName];
    addScore(answerers[winnerTribeName], 3);

    // Eel tank dive
    const winnerTribe = tribeMembers.find(t => t.name === winnerTribeName);
    const diver = pick(winnerTribe.members, lastDiver[winnerTribeName]);
    lastDiver[winnerTribeName] = diver;
    round.diver = diver;
    const diverPr = pronouns(diver);
    const diverSt = pStats(diver);

    // Shock system
    const shockChance = Math.max(0.05, 0.3 - diverSt.endurance * 0.02);
    let shocks = 0;
    let partRetrieved = false;

    // Check for eelDodge event
    const eelDodgeCandidate = intuitionCheck(diver, diverSt);
    if (eelDodgeCandidate) {
      const pool = FLU_QUIZ_EVENTS.eelDodge;
      const txt = pool[Math.floor(Math.random() * pool.length)](diver, diverPr);
      round.events.push({ type: 'eelDodge', text: txt, player: diver });
      events.push({ round: r + 1, type: 'eelDodge', text: txt });
      addScore(diver, 2);
      // One shock avoided
      shocks -= 1;
    }

    // Check for ropeSnap event
    if (Math.random() < 0.3) {
      const pool = FLU_QUIZ_EVENTS.ropeSnap;
      const txt = pool[Math.floor(Math.random() * pool.length)](diver, diverPr);
      round.events.push({ type: 'ropeSnap', text: txt, player: diver });
      events.push({ round: r + 1, type: 'ropeSnap', text: txt });
      shocks += 1;
    }

    // Normal shock accumulation
    for (let i = 0; i < 3; i++) {
      if (Math.random() < shockChance) shocks++;
    }
    shocks = Math.max(0, shocks);

    if (shocks < 3) {
      const diveRoll = diverSt.physical * 0.05 + diverSt.boldness * 0.04 + (Math.random() - 0.5) * 0.2;
      if (diveRoll > 0.4) {
        partRetrieved = true;
        partsByTribe[winnerTribeName]++;
        addScore(diver, 5);
      }
    }

    round.shocks = shocks;
    round.partRetrieved = partRetrieved;

    // Apply partTheft events now that we know dives happened
    for (const ev of roundEvents) {
      if (ev.type === 'partTheft' && partsByTribe[ev.victimTribeName] > 0) {
        partsByTribe[ev.victimTribeName]--;
        partsByTribe[ev.villainTribe]++;
        const pool = FLU_QUIZ_EVENTS.partTheft;
        const txt = pool[Math.floor(Math.random() * pool.length)](ev.villain, ev.victim, ev.vPr, ev.viPr);
        round.events.push({ type: 'partTheft', text: txt, villain: ev.villain, victim: ev.victim });
        events.push({ round: r + 1, type: 'partTheft', text: txt });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[ev.villain] = (gs.popularity[ev.villain] || 0) - 1;
      }
    }

    rounds.push(round);
  }

  result.medicalQuiz = { rounds, partsByTribe, events };

  // Update tribe scores from parts
  for (const [tName, parts] of Object.entries(partsByTribe)) {
    result.tribeScores[tName] = (result.tribeScores[tName] || 0) + parts;
  }

  // Summary camp event
  const partSummary = Object.entries(partsByTribe).map(([t, c]) => `${t}: ${c}`).join(', ');
  ep.campEvents[campKey].post.push({
    text: `Medical Quiz complete. Parts retrieved — ${partSummary}.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'EEL TANK', badgeClass: 'teal',
    tag: 'challenge',
  });

  result.phases.push('medicalQuiz');
}

function intuitionCheck(name, st) {
  return st.intuition * 0.08 > 0.3 + Math.random() * 0.3;
}

// ─── Phase 2: FrankenChris Assembly ──────────────────────────────────────────

function _simulateAssembly(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  const partsByTribe = result.medicalQuiz?.partsByTribe || {};

  const assemblyTribes = [];

  function addScore(name, delta) {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + delta;
    const tribe = tribeMembers.find(t => t.members.includes(name));
    if (tribe) result.tribeScores[tribe.name] = (result.tribeScores[tribe.name] || 0) + delta;
  }

  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const parts = partsByTribe[tribe.name] || 0;
    const avgMental = members.reduce((s, n) => s + pStats(n).mental, 0) / members.length;
    const avgStrategic = members.reduce((s, n) => s + pStats(n).strategic, 0) / members.length;
    const avgPhysical = members.reduce((s, n) => s + pStats(n).physical, 0) / members.length;

    let assemblyScore = (parts / 5) * (avgMental * 0.04 + avgStrategic * 0.03) + (Math.random() - 0.5) * 0.15;
    let hoistScore = avgPhysical * 0.06 + (Math.random() - 0.5) * 0.15;

    const tribeEvents = [];

    // teamworkSurge
    const socialStars = members.filter(n => pStats(n).social * 0.08 > 0.4 + Math.random() * 0.3);
    if (socialStars.length && Math.random() < 0.45) {
      const name = socialStars[Math.floor(Math.random() * socialStars.length)];
      const pr = pronouns(name);
      const txt = FLU_ASSEMBLY.teamwork[Math.floor(Math.random() * FLU_ASSEMBLY.teamwork.length)](name, pr);
      assemblyScore *= 1.15;
      tribeEvents.push({ type: 'teamworkSurge', text: txt, player: name });
      addScore(name, 4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[name] = (gs.popularity[name] || 0) + 1;
      ep.campEvents[campKey].post.push({ text: txt, players: [name], badgeText: 'TEAMWORK', badgeClass: 'green', tag: 'challenge' });
    }

    // partDoesntFit
    if (Math.random() < 0.35) {
      const name = members[Math.floor(Math.random() * members.length)];
      const pr = pronouns(name);
      const txt = FLU_ASSEMBLY.partFail[Math.floor(Math.random() * FLU_ASSEMBLY.partFail.length)](name, pr);
      assemblyScore *= 0.9;
      tribeEvents.push({ type: 'partDoesntFit', text: txt, player: name });
      ep.campEvents[campKey].post.push({ text: txt, players: [name], badgeText: 'PART FAIL', badgeClass: 'red', tag: 'challenge' });
    }

    // pantsPull — cross-tribe rivalry
    for (const other of tribeMembers) {
      if (other.name === tribe.name) continue;
      for (const a of members) {
        for (const b of other.members) {
          if (getBond(a, b) <= -2 && Math.random() < 0.2) {
            const aPr = pronouns(a);
            const bPr = pronouns(b);
            const txt = FLU_ASSEMBLY.pantsPull[Math.floor(Math.random() * FLU_ASSEMBLY.pantsPull.length)](a, b, aPr, bPr);
            addBond(a, b, -0.3);
            tribeEvents.push({ type: 'pantsPull', text: txt, players: [a, b] });
            ep.campEvents[campKey].post.push({ text: txt, players: [a, b], badgeText: 'RIVALRY PRANK', badgeClass: 'red', tag: 'challenge' });
          }
        }
      }
    }

    // hoistStruggle
    if (avgPhysical < 5 && Math.random() < 0.5) {
      const weakest = members.reduce((a, b) => pStats(a).physical < pStats(b).physical ? a : b);
      const pr = pronouns(weakest);
      const txt = FLU_ASSEMBLY.hoistStruggle[Math.floor(Math.random() * FLU_ASSEMBLY.hoistStruggle.length)](weakest, pr);
      hoistScore *= 0.9;
      tribeEvents.push({ type: 'hoistStruggle', text: txt, player: weakest });
      ep.campEvents[campKey].post.push({ text: txt, players: [weakest], badgeText: 'HOIST STRUGGLE', badgeClass: 'orange', tag: 'challenge' });
    }

    // lightning builder
    if (Math.random() < 0.3) {
      const fastest = members.reduce((a, b) => (pStats(a).mental + pStats(a).physical) > (pStats(b).mental + pStats(b).physical) ? a : b);
      const pr = pronouns(fastest);
      const txt = FLU_ASSEMBLY.lightning[Math.floor(Math.random() * FLU_ASSEMBLY.lightning.length)](fastest, pr);
      assemblyScore *= 1.08;
      tribeEvents.push({ type: 'lightning', text: txt, player: fastest });
      addScore(fastest, 3);
      ep.campEvents[campKey].post.push({ text: txt, players: [fastest], badgeText: 'LIGHTNING BUILD', badgeClass: 'gold', tag: 'challenge' });
    }

    // Add chalMemberScores contribution per member
    for (const name of members) {
      const st = pStats(name);
      addScore(name, (st.mental * 0.04 + st.physical * 0.03) * 8);
    }

    const total = assemblyScore + hoistScore;
    assemblyTribes.push({ tribe: tribe.name, assemblyScore, hoistScore, total, events: tribeEvents });
    result.tribeScores[tribe.name] = (result.tribeScores[tribe.name] || 0) + total;
  }

  const winner = assemblyTribes.sort((a, b) => b.total - a.total)[0];
  result.assembly = { tribes: assemblyTribes, winner: winner.tribe };
  result.phases.push('assembly');
}

// ─── Drama Break ──────────────────────────────────────────────────────────────

function _simulateFluDramaBreak(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  const allMembers = tribeMembers.flatMap(t => t.members);
  const breakEvents = [];

  const eligible = FLU_DRAMA_EVENTS.filter(ev => ev.check(ep, allMembers));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);

  const target = 4 + Math.floor(Math.random() * 3); // 4-6

  // Pass 1
  for (const ev of shuffled) {
    if (breakEvents.length >= target) break;
    const applied = ev.apply(ep, allMembers);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      breakEvents.push({ id: ev.id, ...applied });
    }
  }

  // Pass 2: top up to 4 if needed
  if (breakEvents.length < 4) {
    for (const ev of shuffled) {
      if (breakEvents.length >= 4) break;
      if (breakEvents.find(e => e.id === ev.id)) continue;
      const applied = ev.apply(ep, allMembers);
      if (applied) {
        ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
        breakEvents.push({ id: ev.id, ...applied });
      }
    }
  }

  result.breakEvents = breakEvents;
}

// ─── Phase 3: Disease Outbreak Cure Race ─────────────────────────────────────

function _simulateDiseaseOutbreak(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  const ss = result.studySleep?.tribes || {};

  const SYMPTOM_TIERS = {
    easy: { ids: ['itchyLips','runnyNose','hiccups','sneezingFits','wateryEyes'], threshold: 0.3 },
    medium: { ids: ['hotFlashes','dizzySpells','stomachCramps','phantomPain','excessiveSweating'], threshold: 0.5 },
    hard: { ids: ['explosiveDiarrhea','speakingGibberish','temporaryBlindness','fullBodyRash','uncontrollableLaughter'], threshold: 0.65 },
    critical: { ids: ['paralysisPanic','amnesiaEpisode','faintingLoop','hallucinations','bubbleBoy'], threshold: 0.8 },
  };

  function pickSymptom(tier) {
    const ids = SYMPTOM_TIERS[tier].ids;
    return { id: ids[Math.floor(Math.random() * ids.length)], tier, threshold: SYMPTOM_TIERS[tier].threshold };
  }

  // Gather studiers (infected) and sleepers (doctors)
  const infected = {};
  const sleepers = [];
  const allStudiers = [];

  for (const [tName, { studiers: st, sleepers: sl }] of Object.entries(ss)) {
    for (const name of (st || [])) {
      allStudiers.push({ name, tribe: tName });
      // Assign 2 symptoms
      const sym1 = pickSymptom('easy');
      const medhard = Math.random() < 0.5 ? 'medium' : 'hard';
      let sym2 = pickSymptom(medhard);
      if (Math.random() < 0.1) sym2 = pickSymptom('critical');
      infected[name] = [
        { ...sym1, cured: false, curedBy: null },
        { ...sym2, cured: false, curedBy: null },
      ];
    }
    for (const name of (sl || [])) {
      sleepers.push({ name, tribe: tName });
    }
  }

  // If no sleepers at all, pick one per tribe
  if (sleepers.length === 0) {
    for (const tribe of tribeMembers) {
      const pick = tribe.members[Math.floor(Math.random() * tribe.members.length)];
      sleepers.push({ name: pick, tribe: tribe.name });
    }
  }

  const soloSleeper = sleepers.length === 1;
  const cureScores = {};
  tribeMembers.forEach(t => { cureScores[t.name] = 0; });
  const doctorCures = {};
  sleepers.forEach(s => { doctorCures[s.name] = 0; });

  const CHAOS_POOL = [
    {
      id: 'bubblePanic',
      apply(ep, roundData) {
        const bubbles = Object.keys(infected).filter(n => infected[n].some(s => s.id === 'bubbleBoy' && !s.cured));
        const name = bubbles.length ? bubbles[0] : Object.keys(infected)[Math.floor(Math.random() * Object.keys(infected).length)];
        const pr = pronouns(name);
        const txt = FLU_DISEASE_EVENTS.chaosEvent[0](name, pr);
        roundData.rollMod -= 0.03;
        return { id: 'bubblePanic', text: txt, players: [name], badgeText: 'BUBBLE PANIC', badgeClass: 'orange' };
      },
    },
    {
      id: 'writingWill',
      apply(ep, roundData) {
        const names = Object.keys(infected);
        const name = names[Math.floor(Math.random() * names.length)];
        const pr = pronouns(name);
        const others = tribeMembers.flatMap(t => t.members).filter(n => n !== name);
        if (others.length >= 2) {
          const [a, b] = others.sort(() => Math.random() - 0.5).slice(0, 2);
          const delta = (Math.random() - 0.5) * 0.6;
          addBond(a, b, delta);
        }
        const txt = `${name} dramatically begins reciting ${pr.posAdj} will to anyone who'll listen. ${pr.Sub} has seventeen items. The first is a fish.`;
        return { id: 'writingWill', text: txt, players: [name], badgeText: 'WRITING WILL', badgeClass: 'gray' };
      },
    },
    {
      id: 'bathroomRush',
      apply(ep, roundData) {
        const names = Object.keys(infected).filter(n => infected[n].some(s => s.id === 'explosiveDiarrhea' && !s.cured));
        if (!names.length) return null;
        const name = names[Math.floor(Math.random() * names.length)];
        const pr = pronouns(name);
        roundData.incapacitated.add(name);
        const txt = `${name} makes urgent eye contact with no one in particular and power-walks off the field. ${pr.Sub} will not be available for treatment this round.`;
        return { id: 'bathroomRush', text: txt, players: [name], badgeText: 'BATHROOM RUSH', badgeClass: 'red' };
      },
    },
    {
      id: 'panicAttack',
      apply(ep, roundData) {
        const patients = Object.keys(infected);
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const helperCandidates = sleepers.filter(s => !roundData.incapacitated.has(s.name));
        if (!helperCandidates.length) return null;
        const helper = helperCandidates[Math.floor(Math.random() * helperCandidates.length)];
        const pPr = pronouns(patient);
        const hPr = pronouns(helper.name);
        const txt = FLU_DISEASE_EVENTS.comfortEvent[Math.floor(Math.random() * FLU_DISEASE_EVENTS.comfortEvent.length)](helper.name, patient, hPr, pPr);
        addBond(helper.name, patient, 0.4);
        roundData.comfortUsed.add(helper.name);
        return { id: 'panicAttack', text: txt, players: [helper.name, patient], badgeText: 'COMFORT MOMENT', badgeClass: 'blue' };
      },
    },
    {
      id: 'fakeCollapse',
      apply(ep, roundData) {
        const names = Object.keys(infected);
        const name = names[Math.floor(Math.random() * names.length)];
        const pr = pronouns(name);
        roundData.rollMod -= 0.05;
        const txt = `${name} goes completely limp and slides to the floor. Everyone panics. ${pr.Sub} opens one eye. ${pr.Sub} is fine. The chaos costs everyone focus.`;
        return { id: 'fakeCollapse', text: txt, players: [name], badgeText: 'FAKE COLLAPSE', badgeClass: 'orange' };
      },
    },
    {
      id: 'pizzaDiscovery',
      apply(ep, roundData) {
        const name = tribeMembers.flatMap(t => t.members)[Math.floor(Math.random() * tribeMembers.flatMap(t => t.members).length)];
        const pr = pronouns(name);
        roundData.nextRoundBonus = (roundData.nextRoundBonus || 0) + 0.1;
        const txt = `${name} digs through the equipment crate and pulls out a half-eaten slice of pizza — labeled 'PATIENT ZERO EVIDENCE'. Suddenly the cure protocol makes sense. Next round gets a boost.`;
        return { id: 'pizzaDiscovery', text: txt, players: [name], badgeText: 'PIZZA DISCOVERY', badgeClass: 'gold' };
      },
    },
  ];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const addScore = (name, delta) => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + delta;
    const tribe = tribeMembers.find(t => t.members.includes(name));
    if (tribe) cureScores[tribe.name] = (cureScores[tribe.name] || 0) + delta;
  };

  const rounds = [];
  let carryBonus = 0;

  for (let r = 0; r < 4; r++) {
    const roundData = { rollMod: carryBonus, incapacitated: new Set(), comfortUsed: new Set(), nextRoundBonus: 0 };
    carryBonus = 0;

    // 1-2 chaos events
    const numChaos = Math.random() < 0.5 ? 1 : 2;
    const chaosPool = [...CHAOS_POOL].sort(() => Math.random() - 0.5);
    const chaosEvents = [];
    for (const ce of chaosPool) {
      if (chaosEvents.length >= numChaos) break;
      const applied = ce.apply(ep, roundData);
      if (applied) {
        chaosEvents.push(applied);
        ep.campEvents[campKey].post.push({ ...applied, tag: 'disease' });
      }
    }
    carryBonus = roundData.nextRoundBonus;

    const cureAttempts = [];
    const uncuredSymptoms = [];
    for (const [patient, symptoms] of Object.entries(infected)) {
      if (roundData.incapacitated.has(patient)) continue;
      symptoms.forEach((sym, idx) => {
        if (!sym.cured) uncuredSymptoms.push({ patient, idx, sym });
      });
    }

    for (const doc of sleepers) {
      if (roundData.comfortUsed.has(doc.name)) continue;
      const solBonus = soloSleeper ? 0.1 : 0;
      const st = pStats(doc.name);

      for (let attempt = 0; attempt < 2; attempt++) {
        if (!uncuredSymptoms.length) break;
        const targetIdx = Math.floor(Math.random() * uncuredSymptoms.length);
        const { patient, idx: symIdx, sym } = uncuredSymptoms[targetIdx];

        const roll = st.mental * 0.05 + st.intuition * 0.05 + st.social * 0.03
          + solBonus + roundData.rollMod + (Math.random() - 0.5) * 0.2;
        const success = roll > sym.threshold;

        if (success) {
          infected[patient][symIdx].cured = true;
          infected[patient][symIdx].curedBy = doc.name;
          uncuredSymptoms.splice(targetIdx, 1);
          doctorCures[doc.name] = (doctorCures[doc.name] || 0) + 1;
          addScore(doc.name, 4);
          addScore(patient, 2);

          const crossTribe = tribeMembers.find(t => t.members.includes(doc.name))?.name
            !== tribeMembers.find(t => t.members.includes(patient))?.name;
          if (crossTribe) {
            addBond(doc.name, patient, 0.4);
            if (!gs.popularity) gs.popularity = {};
            gs.popularity[doc.name] = (gs.popularity[doc.name] || 0) + 1;
          }

          const txt = FLU_DISEASE_EVENTS.cureSuccess[Math.floor(Math.random() * FLU_DISEASE_EVENTS.cureSuccess.length)](doc.name, patient, sym.id);
          cureAttempts.push({ doctor: doc.name, patient, symptom: sym.id, success: true, text: txt });
          ep.campEvents[campKey].post.push({ text: txt, players: [doc.name, patient], badgeText: 'CURE SUCCESS', badgeClass: 'green', tag: 'disease' });
        } else {
          const txt = FLU_DISEASE_EVENTS.cureFail[Math.floor(Math.random() * FLU_DISEASE_EVENTS.cureFail.length)](doc.name, patient, sym.id);
          cureAttempts.push({ doctor: doc.name, patient, symptom: sym.id, success: false, text: txt });
        }
      }
    }

    const roundCurePoints = {};
    tribeMembers.forEach(t => { roundCurePoints[t.name] = 0; });
    for (const att of cureAttempts) {
      if (att.success) {
        const tribe = tribeMembers.find(t => t.members.includes(att.doctor))?.name;
        if (tribe) roundCurePoints[tribe] = (roundCurePoints[tribe] || 0) + 1;
      }
    }

    rounds.push({ num: r + 1, cureAttempts, chaosEvents, curePoints: roundCurePoints });
  }

  // Best doctor
  const bestDoctor = Object.entries(doctorCures).sort((a, b) => b[1] - a[1])[0]?.[0] || sleepers[0]?.name;
  if (bestDoctor) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[bestDoctor] = (gs.popularity[bestDoctor] || 0) + 3;
    result.rewardWinner = bestDoctor;
  }

  // Winner tribe
  const winnerEntry = Object.entries(cureScores).sort((a, b) => b[1] - a[1])[0];
  if (winnerEntry) {
    result.tribeScores[winnerEntry[0]] = (result.tribeScores[winnerEntry[0]] || 0) + 1;
  }

  result.diseaseOutbreak = {
    infected,
    rounds,
    cureScores,
    bestDoctor,
    rewardWinner: bestDoctor,
  };
  result.phases.push('diseaseOutbreak');
}

export function simulateOneFlu(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    studySleep: null,
    medicalQuiz: null,
    assembly: null,
    diseaseOutbreak: null,
    breakEvents: null,
    rewardWinner: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.oneFlu = result;
  ep.challengeType = 'one-flu';
  ep.challengeLabel = 'One Flu Over the Cuckoos';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulateStudySleep(ep, tribeMembers, result);
  _simulateMedicalQuiz(ep, tribeMembers, result);
  _simulateAssembly(ep, tribeMembers, result);
  _simulateFluDramaBreak(ep, tribeMembers, result);
  _simulateDiseaseOutbreak(ep, tribeMembers, result);

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `One Flu Over the Cuckoos: ${winnerName} wins the medical challenge. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'ONE FLU', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugOneFlu = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
    assembly: result.assembly ? {
      winner: result.assembly.winner,
      tribes: result.assembly.tribes.map(t => ({ tribe: t.tribe, total: t.total.toFixed(3), events: t.events.length })),
    } : null,
    diseaseOutbreak: result.diseaseOutbreak ? {
      bestDoctor: result.diseaseOutbreak.bestDoctor,
      cureScores: result.diseaseOutbreak.cureScores,
      rounds: result.diseaseOutbreak.rounds.map(r => ({ num: r.num, cures: r.cureAttempts.filter(a => a.success).length, chaos: r.chaosEvents.length })),
    } : null,
    dramaBreak: result.breakEvents ? result.breakEvents.map(e => e.id) : [],
  };

  // ── Showmance moment (cross-tribe, 40% chance) ──────────────────────────
  if (seasonConfig.romance !== false && Math.random() < 0.40) {
    const allPlayers = tribeMembers.flatMap(t => t.members);
    let found = false;
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    outer: for (let i = 0; i < shuffled.length && !found; i++) {
      for (let j = i + 1; j < shuffled.length && !found; j++) {
        const a = shuffled[i];
        const b = shuffled[j];
        const tA = tribeMembers.find(t => t.members.includes(a))?.name;
        const tB = tribeMembers.find(t => t.members.includes(b))?.name;
        if (tA === tB) continue; // cross-tribe only
        if (romanticCompat(a, b) <= 0) continue;
        const aPr = pronouns(a);
        const bPr = pronouns(b);
        const moments = [
          `Between challenge phases, ${a} and ${b} drift toward each other near the medical supply crates. They're supposedly reviewing cure charts — but nobody's looking at charts.`,
          `The eel tank chaos gives ${a} an excuse to grab ${b}'s arm. ${aPr.Sub} doesn't let go as quickly as ${aPr.sub} should. ${b} notices.`,
          `${a} tends to ${b}'s minor shock wound from the eel tank with more care than strictly necessary. ${bPr.Sub} lets ${bPr.obj} help a little longer than needed.`,
          `During the assembly break, ${a} catches ${b} struggling with a mannequin limb and steps in. Their hands meet on the plastic elbow. A beat passes.`,
          `${a} writes ${b}'s symptom card for them during the outbreak phase — just because. ${b} reads ${aPr.posAdj} handwriting and smiles.`,
        ];
        const txt = moments[Math.floor(Math.random() * moments.length)];
        addBond(a, b, 0.5);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[a] = (gs.popularity[a] || 0) + 1;
        gs.popularity[b] = (gs.popularity[b] || 0) + 1;
        ep.campEvents[campKey].post.push({
          text: txt,
          players: [a, b],
          badgeText: 'HOSPITAL ROMANCE',
          badgeClass: 'purple',
          tag: 'romance',
        });
        result.showmanceMoment = { a, b, text: txt };
        found = true;
      }
    }
  }

  // ── Cold open: pick most dramatic moment ──────────────────────────────────
  const coldOpenCandidates = [];

  // Priority 1: everyone got sick (all studiers have 2 uncured symptoms)
  const db = result.diseaseOutbreak;
  if (db) {
    const infectedNames = Object.keys(db.infected || {});
    const allSick = infectedNames.length >= 3 &&
      infectedNames.every(n => (db.infected[n] || []).some(s => !s.cured));
    if (allSick) {
      const name = infectedNames[Math.floor(Math.random() * infectedNames.length)];
      const pr = pronouns(name);
      coldOpenCandidates.push({
        priority: 1,
        text: `${name} staggers into frame, ${pr.posAdj} ${Object.keys(FLU_SYMPTOMS)[Math.floor(Math.random() * 3)].replace(/([A-Z])/g, ' $1').toLowerCase().trim()} in full effect. ${pr.Sub}'s not alone — everyone's infected. Wawanakwa has never smelled like this.`,
      });
    }

    // Priority 2: critical symptom cured
    const criticalCure = db.rounds?.flatMap(r => r.cureAttempts || []).find(a => {
      if (!a.success) return false;
      const sym = Object.keys(db.infected || {}).flatMap(n => (db.infected[n] || [])).find(s => s.id === a.symptom);
      return sym && ['paralysisPanic','amnesiaEpisode','faintingLoop','hallucinations','bubbleBoy'].includes(sym.id);
    });
    if (criticalCure) {
      const pr = pronouns(criticalCure.doctor);
      coldOpenCandidates.push({
        priority: 2,
        text: `${criticalCure.doctor} pulls off the impossible — ${pr.sub} cures ${criticalCure.patient}'s ${criticalCure.symptom.replace(/([A-Z])/g, ' $1').toLowerCase().trim()} with a single confident move. Chris looks almost impressed.`,
      });
    }
  }

  // Priority 3: eel triple-shock (3 shocks in one round)
  const tripleShock = result.medicalQuiz?.rounds?.find(r => r.shocks >= 3 && r.diver);
  if (tripleShock) {
    const pr = pronouns(tripleShock.diver);
    coldOpenCandidates.push({
      priority: 3,
      text: `${tripleShock.diver} plunges into the eel tank and comes out three shocks later with nothing but regret. ${pr.Sub}'s still twitching when ${pr.sub} sits back down.`,
    });
  }

  // Priority 4: part theft
  const theft = result.medicalQuiz?.rounds?.flatMap(r => r.events || []).find(e => e.type === 'partTheft');
  if (theft) {
    const pr = pronouns(theft.villain);
    coldOpenCandidates.push({
      priority: 4,
      text: `${theft.villain} makes the boldest move of the whole challenge before it even really starts — ${pr.sub} just walks off with ${theft.victim}'s hard-won body part. Chris says nothing. He's taking notes.`,
    });
  }

  // Priority 5: best doctor tie
  if (db) {
    const cures = Object.entries(db.cureScores || {});
    if (cures.length >= 2 && cures[0]?.[1] === cures[1]?.[1] && cures[0]?.[1] > 0) {
      coldOpenCandidates.push({
        priority: 5,
        text: `Two tribes, equal cures, zero mercy. The medical bay comes down to a single uncured symptom. Someone's going home because of a plastic rash.`,
      });
    }
  }

  // Fallback
  if (coldOpenCandidates.length === 0) {
    const host = seasonConfig.host || 'Chris';
    coldOpenCandidates.push({
      priority: 99,
      text: `${host} strides into camp at midnight holding a clipboard and a biohazard sign. Nobody asks why. They've been here long enough to know it's never good.`,
    });
  }

  coldOpenCandidates.sort((a, b) => a.priority - b.priority);
  result.coldOpen = { text: coldOpenCandidates[0].text, priority: coldOpenCandidates[0].priority };
}

export function _textOneFlu(ep, ln, sec) {
  const of = ep.oneFlu;
  if (!of) return;
  const host = seasonConfig.host || 'Chris';

  // ── Challenge intro ────────────────────────────────────────────────────────
  sec('One Flu Over the Cuckoos');
  const introLines = [
    `${host} appears at camp just after midnight with a clipboard, a biohazard bag, and an expression that suggests he's been planning this for months. "Tonight," he announces, "you're playing doctor."`,
    `A klaxon blares at 11 PM. ${host} strides in wearing a lab coat over his usual outfit, holding a stethoscope he clearly has no idea how to use. "Wawanakwa's first — and only — medical school is now in session."`,
    `The tribes haven't slept when ${host} crashes camp with a rolling cart of medical binders. "One Flu Over the Cuckoos," he announces. "Study, quiz, build a body, cure a plague. Standard stuff."`,
  ];
  ln(introLines[Math.floor(Math.random() * introLines.length)]);

  // ── Study Night ────────────────────────────────────────────────────────────
  sec('Study Night');
  const ss = of.studySleep?.tribes || {};
  for (const [tribeName, { studiers, sleepers }] of Object.entries(ss)) {
    if (studiers?.length) {
      for (const name of studiers) {
        const pr = pronouns(name);
        const pool = FLU_STUDY.studied;
        ln(pool[Math.floor(Math.random() * pool.length)](name, pr));
      }
    }
    if (sleepers?.length) {
      for (const name of sleepers) {
        const pr = pronouns(name);
        const pool = FLU_STUDY.slept;
        ln(pool[Math.floor(Math.random() * pool.length)](name, pr));
      }
    }
  }
  const allStudiers = Object.values(ss).flatMap(t => t.studiers || []);
  const allSleepers = Object.values(ss).flatMap(t => t.sleepers || []);
  if (allStudiers.length > 0 && allSleepers.length > 0) {
    const exhaustLines = [
      `By morning, the studiers look like they've survived a war. The sleepers look annoyingly rested. The quiz hasn't even started yet.`,
      `Flashlights go dark around 3 AM. The ones who studied are pale and jittery. The ones who slept are stretching and smiling. The gap is visible from orbit.`,
      `${host} returns at dawn. The studiers have dark circles and full notebooks. The sleepers have absolutely nothing to show for the night. "Interesting choices," he says.`,
    ];
    ln(exhaustLines[Math.floor(Math.random() * exhaustLines.length)]);
  }

  // ── Medical Quiz ───────────────────────────────────────────────────────────
  sec('Medical Quiz');
  const mq = of.medicalQuiz;
  if (mq) {
    const quizIntroPool = FLU_HOST.quizIntro;
    ln(quizIntroPool[Math.floor(Math.random() * quizIntroPool.length)]);

    const partsByTribe = mq.partsByTribe || {};

    for (const round of (mq.rounds || [])) {
      ln(`Round ${round.number}: ${host} reads the medical scenario.`);

      // Round events
      for (const ev of (round.events || [])) {
        if (ev.text) ln(ev.text);
      }

      if (round.winnerTribe) {
        const hostPool = FLU_HOST.correctAnswer;
        ln(hostPool[Math.floor(Math.random() * hostPool.length)]);
        if (round.diver) {
          const diverPr = pronouns(round.diver);
          if (round.shocks >= 3) {
            const failPool = rd.shocks >= 3 ? FLU_HOST.diveFailShock : FLU_HOST.diveFailMiss;
            ln(failPool[Math.floor(Math.random() * failPool.length)]);
            const shockLine = [
              `${round.diver} surfaces gasping — ${diverPr.sub} took all three jolts and came up empty.`,
              `Three shocks. ${round.diver} shakes ${diverPr.posAdj} hand like it'll help. The part stays in the tank.`,
              `${round.diver} tried. The eels disagreed. ${diverPr.Sub}'s back on the bench.`,
            ];
            ln(shockLine[Math.floor(Math.random() * shockLine.length)]);
          } else if (round.partRetrieved) {
            const successPool = FLU_HOST.diveSuccess;
            ln(successPool[Math.floor(Math.random() * successPool.length)]);
            const retrieveLine = [
              `${round.diver} surfaces with a body part held high. ${round.winnerTribe} erupts.`,
              `${round.diver} dodges the last eel and shoots for the surface. Part in hand. Tribe goes wild.`,
              `${round.diver} makes it look effortless — ${diverPr.sub} shouldn't, but ${diverPr.sub} does.`,
            ];
            ln(retrieveLine[Math.floor(Math.random() * retrieveLine.length)]);
          } else {
            const noPartLine = [
              `${round.diver} dives but comes up without the part — close call, but no score.`,
              `The eels weren't the problem — the part just wasn't in the right spot. ${round.diver} surfaces frustrated.`,
            ];
            ln(noPartLine[Math.floor(Math.random() * noPartLine.length)]);
          }
        }
      } else {
        const wrongPool = FLU_HOST.wrongAnswer;
        ln(wrongPool[Math.floor(Math.random() * wrongPool.length)]);
      }
    }

    // Part tally
    const tally = Object.entries(partsByTribe).map(([t, c]) => `${t} (${c} part${c !== 1 ? 's' : ''})`).join(', ');
    ln(`After five rounds: ${tally}. The assembly table awaits.`);
  }

  // ── FrankenChris Assembly ──────────────────────────────────────────────────
  sec('FrankenChris Assembly');
  const asm = of.assembly;
  if (asm) {
    const asmIntroPool = FLU_HOST.assemblyStart;
    ln(asmIntroPool[Math.floor(Math.random() * asmIntroPool.length)]);

    for (const tribe of (asm.tribes || [])) {
      ln(`${tribe.tribe} sets to work.`);
      for (const ev of (tribe.events || [])) {
        if (ev.text) ln(ev.text);
      }
    }

    if (asm.winner) {
      const winLines = [
        `${asm.winner} slams the final piece into place and raises both hands. Their FrankenChris stands complete.`,
        `The last hoist. The final click. ${asm.winner} steps back from the table — their patient is whole.`,
        `${host} walks the line. He stops at ${asm.winner}'s assembly. He pokes it. It doesn't fall over. "That's a winner."`,
      ];
      ln(winLines[Math.floor(Math.random() * winLines.length)]);
    }
  }

  // ── Between Phases (Drama Break) ──────────────────────────────────────────
  const breakEvs = of.breakEvents;
  if (breakEvs?.length) {
    sec('Between Phases');
    for (const ev of breakEvs) {
      if (ev.text) ln(ev.text);
    }
  }

  // ── Disease Outbreak ───────────────────────────────────────────────────────
  sec('Disease Outbreak');
  const dbo = of.diseaseOutbreak;
  if (dbo) {
    // Symptom assignments
    const infectedEntries = Object.entries(dbo.infected || {});
    if (infectedEntries.length) {
      const announceLines = [
        `${host} opens a sealed crate and pulls out symptom cards. "Congratulations — you studied, so now you're sick."`,
        `The studiers all get cards. Symptom cards. Distributed with visible glee by ${host}.`,
        `"The price of knowledge," ${host} says, handing out symptom cards to the all-nighters, "is suffering."`,
      ];
      ln(announceLines[Math.floor(Math.random() * announceLines.length)]);

      for (const [name, symptoms] of infectedEntries) {
        const pr = pronouns(name);
        for (const sym of symptoms) {
          const desc = FLU_SYMPTOMS[sym.id];
          if (desc) {
            ln(`${name}: ${desc}`);
          }
        }
      }
    }

    // Round-by-round cure attempts
    for (const round of (dbo.rounds || [])) {
      ln(`Cure Round ${round.num}:`);
      for (const ev of (round.chaosEvents || [])) {
        if (ev.text) ln(ev.text);
      }
      for (const att of (round.cureAttempts || [])) {
        if (att.text) ln(att.text);
      }
    }

    // Best doctor
    if (dbo.bestDoctor) {
      const drPr = pronouns(dbo.bestDoctor);
      const drLines = [
        `${dbo.bestDoctor} emerges from the outbreak as the clear MVP — ${drPr.sub} treated more patients than anyone else and barely broke a sweat.`,
        `When the smoke clears, ${dbo.bestDoctor} has the most cures. ${drPr.Sub} looks quietly, infuriatingly satisfied.`,
        `"Best Doctor goes to…" ${host} pauses for drama. "…${dbo.bestDoctor}." ${drPr.Sub} gives a small nod. The tribe groans.`,
      ];
      ln(drLines[Math.floor(Math.random() * drLines.length)]);
    }

    // Reward winner
    if (dbo.rewardWinner && dbo.rewardWinner !== dbo.bestDoctor) {
      const rwPr = pronouns(dbo.rewardWinner);
      ln(`${dbo.rewardWinner} earns the reward for ${rwPr.posAdj} tribe's cure performance. ${host} hands over the prize with his usual lack of warmth.`);
    } else if (dbo.rewardWinner) {
      ln(`${dbo.rewardWinner} earns the reward — both top doctor and the tribe's best performer in the outbreak.`);
    }
  }

  // ── Showmance moment ───────────────────────────────────────────────────────
  if (of.showmanceMoment) {
    const { a, b, text } = of.showmanceMoment;
    ln(text);
  }

  // ── The Verdict ────────────────────────────────────────────────────────────
  sec('The Verdict');
  const scores = Object.entries(of.tribeScores || {}).sort((a, b) => b[1] - a[1]);
  for (const [tribe, score] of scores) {
    ln(`${tribe}: ${Math.round(score)} points`);
  }
  const winner = ep.winner?.name;
  const loser = ep.loser?.name;
  if (winner && loser) {
    const verdictLines = [
      `${winner} takes immunity. ${loser} heads to tribal council.`,
      `Final verdict: ${winner} survives. ${loser} faces the vote.`,
      `${host} hangs the immunity token around ${winner}'s neck. ${loser} doesn't look at anyone on the walk back.`,
    ];
    ln(verdictLines[Math.floor(Math.random() * verdictLines.length)]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Shell, Helpers, Screens
// ═══════════════════════════════════════════════════════════════════════════

function _ofShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@400;600;700;900&display=swap');

/* ── Theme tokens (clean ER) ── */
.of-shell{
  --of-white:#f0f4f8;--of-blue:#3b82f6;--of-teal:#14b8a6;
  --of-red:#ef4444;--of-steel:#475569;--of-bg:#0f172a;
  --of-toxic:#84cc16;--of-biohazard:#eab308;--of-quarantine:#dc2626;
  --of-sick-green:#22c55e;--of-contaminated:rgba(132,204,22,0.1);
  font-family:'Inter',sans-serif;color:#e2e8f0;
  background:linear-gradient(180deg,#1e293b 0%,#0f172a 30%,#020617 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:3px solid #1e293b;box-shadow:inset 0 0 60px rgba(0,0,0,0.6),0 0 30px rgba(0,0,0,0.5);
}

/* ── Heart monitor top border (SVG) ── */
.of-heartline{position:absolute;top:0;left:0;right:0;height:6px;z-index:8;pointer-events:none;overflow:hidden}
.of-heartline svg{width:200%;height:6px;animation:of-ekg 3s linear infinite}
.of-heartline svg path{fill:none;stroke:var(--of-teal);stroke-width:2;
  filter:drop-shadow(0 0 4px rgba(20,184,166,0.6))}

/* ── Fluorescent lighting ── */
.of-fluoro{position:absolute;top:0;left:8%;right:8%;height:3px;z-index:7;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(240,244,248,0.35),rgba(240,244,248,0.55),rgba(240,244,248,0.35),transparent);
  box-shadow:0 0 20px rgba(240,244,248,0.12),0 0 60px rgba(240,244,248,0.06);
  animation:of-flicker 5s linear infinite}

/* ── Noise texture ── */
.of-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;clip-path:inset(0);
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
  opacity:.03;pointer-events:none;z-index:5;mix-blend-mode:overlay}

/* ── Header ── */
.of-header{background:linear-gradient(180deg,#1e293b 0%,#0f172a 100%);
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:2px solid var(--of-blue);position:relative;z-index:6;
  box-shadow:inset 0 -2px 8px rgba(0,0,0,0.5),0 2px 10px rgba(0,0,0,0.4)}
.of-title{font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-teal);
  text-shadow:0 0 8px rgba(20,184,166,0.4);letter-spacing:3px}
.of-subtitle{font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:4px;text-transform:uppercase;margin-top:2px}

/* ── Layout ── */
.of-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.of-feed{flex:1;min-width:0}
.of-sidebar{width:260px;flex-shrink:0;position:sticky;top:0;max-height:100vh;overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(59,130,246,0.25) transparent;
  background:linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  border:1px solid rgba(59,130,246,0.15);border-radius:4px;padding:12px;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.4)}

/* ── HUD ── */
.of-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.of-hud-cell{flex:1;background:rgba(0,0,0,0.5);border:1px solid rgba(59,130,246,0.12);
  padding:8px 4px;text-align:center}
.of-hud-cell:first-child{border-radius:4px 0 0 4px}.of-hud-cell:last-child{border-radius:0 4px 4px 0}
.of-hud-val{font-family:'Orbitron',sans-serif;font-size:16px;font-weight:700;color:var(--of-teal);
  text-shadow:0 0 8px rgba(20,184,166,0.3)}
.of-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:2px;text-transform:uppercase}

/* ── Event cards (clean ER phase) ── */
.of-ev{background:linear-gradient(135deg,rgba(59,130,246,0.08),rgba(71,85,105,0.06));
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(59,130,246,0.12);border-left:3px solid var(--of-blue);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;
  border-radius:3px;animation:of-fade-up 0.4s ease-out;position:relative}
.of-ev.negative{border-left-color:var(--of-red)}
.of-ev.positive{border-left-color:var(--of-teal)}
.of-ev.round-header{border-left-color:var(--of-blue);
  background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(71,85,105,0.1));
  font-family:'Orbitron',sans-serif}
/* Quarantine phase cards */
.of-ev.quarantine{border-left-color:var(--of-toxic);
  background:linear-gradient(135deg,rgba(132,204,22,0.08),rgba(34,197,94,0.04))}
.of-ev.chaos{border-left-color:var(--of-biohazard);
  background:linear-gradient(135deg,rgba(234,179,8,0.08),rgba(132,204,22,0.04))}
.of-ev.cure-success{border-left-color:var(--of-sick-green)}
.of-ev.cure-fail{border-left-color:var(--of-red)}

/* ── Badges ── */
.of-ev-badge{display:inline-block;font-family:'Orbitron',sans-serif;font-size:7px;letter-spacing:2px;
  padding:2px 8px;border-radius:2px;margin-bottom:4px;text-transform:uppercase;
  background:rgba(59,130,246,0.15);color:#93c5fd;border:1px solid rgba(59,130,246,0.2)}
.of-ev-badge.gold{background:rgba(234,179,8,0.2);color:#fbbf24;border-color:rgba(234,179,8,0.3)}
.of-ev-badge.red{background:rgba(239,68,68,0.2);color:#fca5a5;border-color:rgba(239,68,68,0.3)}
.of-ev-badge.green{background:rgba(34,197,94,0.15);color:#86efac;border-color:rgba(34,197,94,0.25)}
.of-ev-badge.blue{background:rgba(59,130,246,0.15);color:#93c5fd;border-color:rgba(59,130,246,0.25)}
.of-ev-badge.teal{background:rgba(20,184,166,0.15);color:#5eead4;border-color:rgba(20,184,166,0.25)}
.of-ev-badge.orange{background:rgba(234,179,8,0.15);color:#fde68a;border-color:rgba(234,179,8,0.25)}
.of-ev-badge.purple{background:rgba(139,92,246,0.15);color:#c4b5fd;border-color:rgba(139,92,246,0.25)}
.of-ev-badge.gray{background:rgba(107,114,128,0.12);color:rgba(255,255,255,0.45);border-color:rgba(107,114,128,0.2)}
.of-ev-badge.toxic{background:rgba(132,204,22,0.15);color:#a3e635;border-color:rgba(132,204,22,0.25)}
.of-ev-text{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)}

/* ═══ WRISTBAND PORTRAITS ═══ */
.of-wristband{display:inline-block;text-align:center;position:relative;
  background:linear-gradient(180deg,rgba(240,244,248,0.95),rgba(226,232,240,0.9));
  border:2px solid #cbd5e1;border-radius:4px;padding:6px 6px 4px;
  box-shadow:2px 2px 8px rgba(0,0,0,0.4),inset 0 0 8px rgba(0,0,0,0.05)}
.of-wristband img{display:block;margin:0 auto 3px;border-radius:2px;
  border:2px solid #94a3b8;position:relative;z-index:1;
  box-shadow:inset 0 0 6px rgba(0,0,0,0.15)}
.of-wristband-name{font-family:'Orbitron',sans-serif;font-size:6px;letter-spacing:1px;color:#334155;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.of-wristband-id{font-family:'Orbitron',sans-serif;font-size:5px;letter-spacing:2px;color:#94a3b8;margin-top:1px}
.of-wristband-status{font-family:'Orbitron',sans-serif;font-size:5px;letter-spacing:1px;
  padding:1px 4px;border-radius:2px;margin-top:2px;display:inline-block}
.of-wristband-status.studying{background:#dbeafe;color:#2563eb}
.of-wristband-status.sleeping{background:#e2e8f0;color:#64748b}
.of-wristband-status.infected{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5}
.of-wristband-status.clean{background:#f0fdf4;color:#16a34a}
.of-wristband-status.cured{background:#ecfdf5;color:#059669;border:1px solid #6ee7b7}

/* Compact sidebar variant */
.of-wristband.sm{padding:3px 2px 2px;border-width:1px}
.of-wristband.sm .of-wristband-name{font-size:5px;letter-spacing:0.5px}
.of-wristband.sm .of-wristband-id{display:none}

/* Infected overlay */
.of-wristband.infected{border-color:#fca5a5;background:linear-gradient(180deg,rgba(254,226,226,0.95),rgba(254,202,202,0.9))}
.of-wristband.infected::after{content:'INFECTED';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-12deg);font-family:'Orbitron',sans-serif;font-size:10px;
  letter-spacing:2px;color:rgba(220,38,38,0.8);text-shadow:0 0 4px rgba(220,38,38,0.3);
  animation:of-stamp-inline 0.4s ease-out both;pointer-events:none;z-index:3;
  border:2px solid rgba(220,38,38,0.5);padding:1px 4px;border-radius:2px}
.of-wristband.cured::after{content:'CURED';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-8deg);font-family:'Orbitron',sans-serif;font-size:10px;
  letter-spacing:2px;color:rgba(5,150,105,0.8);text-shadow:0 0 4px rgba(5,150,105,0.3);
  animation:of-stamp-inline 0.4s ease-out both;pointer-events:none;z-index:3;
  border:2px solid rgba(5,150,105,0.5);padding:1px 4px;border-radius:2px}

/* ═══ STAMPS ═══ */
.of-stamp{display:inline-block;font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:3px;
  text-transform:uppercase;padding:4px 14px;border-radius:3px;position:relative;
  border:2px solid currentColor;
  animation:of-stamp-inline 0.4s ease-out both}
.of-stamp.red{color:#ef4444;background:rgba(239,68,68,0.1);
  text-shadow:0 0 8px rgba(239,68,68,0.3);box-shadow:0 0 12px rgba(239,68,68,0.15)}
.of-stamp.green{color:#22c55e;background:rgba(34,197,94,0.1);
  text-shadow:0 0 8px rgba(34,197,94,0.3);box-shadow:0 0 12px rgba(34,197,94,0.15)}
.of-stamp.gold{color:#eab308;background:rgba(234,179,8,0.1);
  text-shadow:0 0 8px rgba(234,179,8,0.3);box-shadow:0 0 12px rgba(234,179,8,0.15)}
.of-stamp.teal{color:#14b8a6;background:rgba(20,184,166,0.1);
  text-shadow:0 0 8px rgba(20,184,166,0.3);box-shadow:0 0 12px rgba(20,184,166,0.15)}
.of-stamp.blue{color:#3b82f6;background:rgba(59,130,246,0.1);
  text-shadow:0 0 8px rgba(59,130,246,0.3);box-shadow:0 0 12px rgba(59,130,246,0.15)}
.of-stamp.toxic{color:#84cc16;background:rgba(132,204,22,0.1);
  text-shadow:0 0 8px rgba(132,204,22,0.3);box-shadow:0 0 12px rgba(132,204,22,0.15)}

/* ── EKG scoring bar ── */
.of-ekg-bar{height:6px;border-radius:3px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:3px;
  border:1px solid rgba(20,184,166,0.15)}
.of-ekg-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--of-teal),var(--of-blue));
  transition:width 0.3s ease;box-shadow:0 0 6px rgba(20,184,166,0.3)}

/* ── Controls ── */
.of-btn-next{padding:10px 28px;
  background:linear-gradient(135deg,#1e293b,#0f172a);
  color:var(--of-teal);border:2px solid rgba(20,184,166,0.3);border-radius:4px;cursor:pointer;
  font-family:'Orbitron',sans-serif;font-size:10px;letter-spacing:3px;
  box-shadow:0 4px 15px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05),0 0 12px rgba(20,184,166,0.1);
  transition:transform 0.15s,box-shadow 0.15s;text-transform:uppercase;position:relative}
.of-btn-next:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.6),0 0 20px rgba(20,184,166,0.2)}
.of-btn-all{padding:8px 18px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);
  border:1px solid rgba(255,255,255,0.08);border-radius:4px;cursor:pointer;font-size:11px;
  transition:background 0.15s}
.of-btn-all:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6)}
.of-controls{display:flex;gap:8px;justify-content:center;padding:16px 0;position:relative;z-index:6}

/* ── Sidebar sections ── */
.of-side-sec{font-family:'Orbitron',sans-serif;font-size:7px;letter-spacing:3px;
  color:rgba(59,130,246,0.5);border-bottom:1px solid rgba(59,130,246,0.12);
  padding-bottom:3px;margin:12px 0 6px;text-transform:uppercase}

/* ── Medical cross accent ── */
.of-cross{display:inline-block;color:var(--of-red);font-size:14px;margin-right:6px;
  text-shadow:0 0 6px rgba(239,68,68,0.3)}

/* ═══ KEYFRAMES ═══ */
@keyframes of-ekg{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes of-flicker{
  0%{opacity:0.6}5%{opacity:0.35}10%{opacity:0.65}15%{opacity:0.5}20%{opacity:0.7}
  50%{opacity:0.6}55%{opacity:0.4}60%{opacity:0.65}80%{opacity:0.55}100%{opacity:0.6}}
@keyframes of-stamp-inline{
  0%{transform:scale(1.5);opacity:0}
  70%{transform:scale(0.97);opacity:1}
  100%{transform:scale(1);opacity:1}}
@keyframes of-fade-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}

/* ═══ prefers-reduced-motion ═══ */
@media (prefers-reduced-motion:reduce){
  .of-shell::before,.of-fluoro,.of-heartline svg{animation:none !important}
  .of-ev,.of-stamp,.of-wristband.infected::after,.of-wristband.cured::after{animation:none !important;transition:none !important}
}
</style>
<div class="of-shell">
  <div class="of-heartline">
    <svg viewBox="0 0 600 20" preserveAspectRatio="none">
      <path d="M0,10 L40,10 L50,10 L55,2 L60,18 L65,4 L70,10 L110,10 L150,10 L160,10 L165,2 L170,18 L175,4 L180,10 L220,10 L260,10 L270,10 L275,2 L280,18 L285,4 L290,10 L330,10 L370,10 L380,10 L385,2 L390,18 L395,4 L400,10 L440,10 L480,10 L490,10 L495,2 L500,18 L505,4 L510,10 L550,10 L600,10"/>
    </svg>
  </div>
  <div class="of-fluoro"></div>
  <div class="of-header">
    <div>
      <div class="of-title"><span class="of-cross">+</span>ONE FLU OVER THE CUCKOOS</div>
      <div class="of-subtitle">Study &middot; Quiz &middot; Cure</div>
    </div>
    <div style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:2px;font-family:'Orbitron',sans-serif">EP ${ep?.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

// ── VP helpers ─────────────────────────────────────────────────────────────

function _ofWristband(name, size = 64, statusClass = '', statusText = '') {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  const outerWidth = size + 16;
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % 99 + 1;
  return `<div class="of-wristband ${statusClass}" style="width:${outerWidth}px">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;border-radius:2px" onerror="this.style.display='none'">
    <div class="of-wristband-name" style="max-width:${size}px">${name}</div>
    <div class="of-wristband-id">PATIENT #${String(idx).padStart(2, '0')}</div>
    ${statusText ? `<div class="of-wristband-status ${statusClass}">${statusText}</div>` : ''}
  </div>`;
}

function _ofSideWristband(name, size = 32, statusClass = '', statusText = '') {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div class="of-wristband sm ${statusClass}" style="width:${size + 8}px;flex-shrink:0">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;border-radius:2px" onerror="this.style.display='none'">
    <div class="of-wristband-name">${name}</div>
    ${statusText ? `<div class="of-wristband-status ${statusClass}">${statusText}</div>` : ''}
  </div>`;
}

function _ofSmallPortrait(name, size = 44) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div style="width:${size}px;height:${size}px;flex-shrink:0;border-radius:2px;overflow:hidden;border:2px solid #334155;box-shadow:0 2px 6px rgba(0,0,0,0.5)">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;object-fit:cover" onerror="this.style.display='none'">
  </div>`;
}

function _ofStamp(text, color = 'teal') {
  return `<span class="of-stamp ${color}">${text}</span>`;
}

function _ofEkgBar(pct, color) {
  const bg = color || 'linear-gradient(90deg,var(--of-teal),var(--of-blue))';
  return `<div class="of-ekg-bar"><div class="of-ekg-fill" style="width:${Math.min(100, Math.max(0, pct))}%;${color ? 'background:' + color : ''}"></div></div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Title Card
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluTitleCard(ep) {
  const of = ep.oneFlu;
  if (!of) return '';
  const tribeNames = Object.keys(of.tribeScores || {});
  const host = seasonConfig.host || 'Chris';

  const quotes = [
    `"Tonight's challenge is medical. Study hard, dive deep, and pray you don't catch what's going around."`,
    `"Four phases. Study or sleep. Quiz or fail. Build or fumble. And then — the outbreak hits."`,
    `"Welcome to One Flu Over the Cuckoos. You'll wish you'd paid attention in biology class."`,
  ];
  const quote = quotes[(ep.num || 0) % quotes.length];

  return _ofShell(`
    <div style="text-align:center;padding:50px 20px 80px;position:relative;z-index:6;">
      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:12px;">${host} Presents</div>

      <div style="font-family:'Orbitron',sans-serif;font-size:34px;color:var(--of-teal);text-shadow:0 0 20px rgba(20,184,166,0.4),2px 2px 0 rgba(0,0,0,0.6);letter-spacing:4px;line-height:1.15;margin-bottom:6px;">
        <span class="of-cross" style="font-size:28px">+</span> ONE FLU OVER<br>THE CUCKOOS</div>

      <div style="font-family:'Orbitron',sans-serif;font-size:12px;letter-spacing:6px;color:var(--of-blue);text-shadow:0 0 8px rgba(59,130,246,0.3);margin-bottom:20px;">STUDY &middot; QUIZ &middot; CURE</div>

      <div style="display:inline-block;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(59,130,246,0.15);border-radius:8px;padding:14px 24px;margin-bottom:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:8px;">Medical Briefing</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;font-style:italic;max-width:500px">${host}: ${quote}</div>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;flex-wrap:wrap">
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(59,130,246,0.1);border-radius:6px;padding:10px 14px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-blue)">PHASE 1</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">Study/Sleep</div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(59,130,246,0.1);border-radius:6px;padding:10px 14px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-blue)">PHASE 2</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">Quiz + Eel Tank</div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(59,130,246,0.1);border-radius:6px;padding:10px 14px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-blue)">PHASE 3</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">FrankenChris</div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(132,204,22,0.15);border-radius:6px;padding:10px 14px;text-align:center">
          <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-toxic)">PHASE 4</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px">Disease Outbreak</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(255,255,255,0.4);flex-wrap:wrap;">
        ${tribeNames.map(t => `<span>+ ${t}</span>`).join('')}
        <span>4 Phases</span>
      </div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Study / Sleep
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluStudySleep(ep) {
  const of = ep.oneFlu;
  if (!of?.studySleep) return '';
  const ss = of.studySleep.tribes || {};
  const tribeNames = Object.keys(of.tribeScores || {});
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  const hostQuote = _rp(FLU_HOST.studyIntro);

  // Rules box
  let feed = `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(59,130,246,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">The night before the challenge, ${host} hands out medical textbooks. Study all night for a quiz bonus &mdash; or sleep and be rested for what comes later. Your choice determines your role in the outbreak.</div>
    <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:140px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.15);border-radius:4px;padding:8px 10px">
        <div style="font-size:11px;color:#93c5fd;margin-bottom:3px">&#128218; STUDY</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);line-height:1.5">+20% quiz accuracy tomorrow<br>&#129298; Will get &lsquo;sick&rsquo; during the outbreak</div>
      </div>
      <div style="flex:1;min-width:140px;background:rgba(107,114,128,0.08);border:1px solid rgba(107,114,128,0.15);border-radius:4px;padding:8px 10px">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px">&#128564; SLEEP</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);line-height:1.5">-20% quiz accuracy tomorrow<br>&#129657; Becomes a doctor during outbreak</div>
      </div>
    </div>
  </div>`;

  // Host intro
  feed += `<div class="of-ev" style="border-left-color:var(--of-teal)">
    <div style="flex:1;min-width:0">
      <div class="of-ev-badge teal">HOST</div>
      <div class="of-ev-text" style="font-style:italic">${host}: ${hostQuote}</div>
    </div>
  </div>`;

  for (const tName of tribeNames) {
    const data = ss[tName];
    if (!data) continue;
    feed += `<div class="of-ev round-header"><div style="flex:1;text-align:center">
      <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-blue);letter-spacing:3px">${tName}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${data.studiers.length} studied &middot; ${data.sleepers.length} slept</div>
    </div></div>`;

    // Studiers — individual narrative cards
    for (const name of (data.studiers || [])) {
      const pr = pronouns(name);
      const narrative = _rp(FLU_STUDY.studied)(name, pr);
      feed += `<div class="of-ev positive">
        ${_ofSmallPortrait(name, 44)}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge blue">STUDYING</div>
          <div class="of-ev-text">${narrative}</div>
          <div style="font-size:10px;color:rgba(147,197,253,0.6);margin-top:4px">&#128218; +20% quiz accuracy &middot; &#129298; Will get sick later</div>
        </div>
      </div>`;
    }

    // Sleepers — individual narrative cards
    for (const name of (data.sleepers || [])) {
      const pr = pronouns(name);
      const narrative = _rp(FLU_STUDY.slept)(name, pr);
      feed += `<div class="of-ev">
        ${_ofSmallPortrait(name, 44)}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge gray">SLEEPING</div>
          <div class="of-ev-text">${narrative}</div>
          <div style="font-size:10px;color:rgba(148,163,184,0.6);margin-top:4px">&#128564; -20% quiz accuracy &middot; &#129657; Can be a doctor later</div>
        </div>
      </div>`;
    }
  }

  return _ofShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--of-blue);letter-spacing:4px">STUDY OR SLEEP</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">The night before the challenge</div>
      </div>
      ${feed}
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Medical Quiz + Eel Tank (click-to-reveal per round)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluQuiz(ep) {
  const of = ep.oneFlu;
  if (!of?.medicalQuiz) return '';
  const mq = of.medicalQuiz;
  const rounds = mq.rounds || [];
  const tribeNames = Object.keys(of.tribeScores || {});
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['of-quiz']) window._tvState['of-quiz'] = { idx: -1 };
  const revIdx = window._tvState['of-quiz'].idx;

  // Comedy medical questions for flavor text per round
  const quizQuestions = [
    `"A patient presents with a rash shaped like the host's face. What is the diagnosis?"`,
    `"If a contestant eats fourteen marshmallows in one sitting, which organ fails first?"`,
    `"Name the bone most commonly broken during a reality TV challenge. Hint: it's not the funny bone."`,
    `"A camper claims their left arm fell off. It didn't. What psychosomatic condition is this?"`,
    `"Describe the correct treatment for 'spontaneous eel phobia.' You have ten seconds."`,
    `"What is the medical term for screaming when you see Chef Hatchet's cooking?"`,
    `"A patient insists they can hear colors. Is this a symptom or a superpower?"`,
    `"If someone's entire body turns green after eating camp food, is it the food or the fear?"`,
  ];

  // Rules box
  let feed = `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(59,130,246,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">Answer medical questions to earn body parts for your FrankenChris. Winner of each round dives into the eel tank to retrieve a part. 3 eel shocks = failed dive. More parts = better assembly score.</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.15)">5 ROUNDS</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(20,184,166,0.1);color:#5eead4;border:1px solid rgba(20,184,166,0.15)">EEL TANK DIVES</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(239,68,68,0.1);color:#fca5a5;border:1px solid rgba(239,68,68,0.15)">3 SHOCKS = FAIL</span>
    </div>
  </div>`;

  // Host intro
  feed += `<div class="of-ev" style="border-left-color:var(--of-teal)">
    <div style="flex:1;min-width:0">
      <div class="of-ev-badge teal">HOST</div>
      <div class="of-ev-text" style="font-style:italic">${host}: ${_rp(FLU_HOST.quizIntro)}</div>
    </div>
  </div>`;

  let stepIdx = 0;

  for (let i = 0; i < rounds.length; i++) {
    const rd = rounds[i];
    const question = quizQuestions[(i + (ep.num || 0)) % quizQuestions.length];

    // Round header with question
    let roundHtml = `<div class="of-ev round-header"><div style="flex:1;text-align:center">
      <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-blue);letter-spacing:3px">ROUND ${rd.number}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:6px;font-style:italic;line-height:1.5">${host}: ${question}</div>
    </div></div>`;

    // Host question commentary
    roundHtml += `<div class="of-ev" style="border-left-color:var(--of-teal)">
      <div style="flex:1;min-width:0">
        <div class="of-ev-badge teal">HOST</div>
        <div class="of-ev-text" style="font-style:italic">${_rp(FLU_HOST.quizQuestion)}</div>
      </div>
    </div>`;

    // Split events: quiz events (studyFlex, sleepFumble, wrongAnswer, partTheft) show before answer
    // Dive events (eelDodge, ropeSnap) show after dive starts
    const quizEvents = (rd.events || []).filter(e => ['studyFlex','sleepFumble','wrongAnswer','partTheft'].includes(e.type));
    const diveEvents = (rd.events || []).filter(e => ['eelDodge','ropeSnap'].includes(e.type));

    for (const evt of quizEvents) {
      const evtClass = evt.type === 'studyFlex' ? 'positive' : evt.type === 'partTheft' ? 'negative' : '';
      const badgeColor = evt.type === 'studyFlex' ? 'green' : evt.type === 'wrongAnswer' ? 'red' : evt.type === 'sleepFumble' ? 'orange' : evt.type === 'partTheft' ? 'purple' : 'gray';
      const badgeLabel = evt.type === 'studyFlex' ? 'STUDY FLEX' : evt.type === 'wrongAnswer' ? 'WRONG ANSWER' : evt.type === 'sleepFumble' ? 'SLEEP FUMBLE' : evt.type === 'partTheft' ? 'PART THEFT' : evt.type.toUpperCase();
      const portrait = evt.player ? _ofSmallPortrait(evt.player, 36) : evt.villain ? _ofSmallPortrait(evt.villain, 36) : '';
      roundHtml += `<div class="of-ev ${evtClass}">
        ${portrait}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge ${badgeColor}">${badgeLabel}</div>
          <div class="of-ev-text">${evt.text || ''}</div>
        </div>
      </div>`;
    }

    // Answerer result with host commentary
    if (rd.winnerTribe) {
      const answerer = rd.answererCorrect || '?';
      const hostCorrect = _rp(FLU_HOST.correctAnswer);
      roundHtml += `<div class="of-ev positive">
        ${_ofSmallPortrait(answerer, 36)}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge green">${rd.winnerTribe} CORRECT</div>
          <div class="of-ev-text"><strong>${answerer}</strong> answers correctly for ${rd.winnerTribe}!</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:4px">${host}: ${hostCorrect}</div>
        </div>
      </div>`;

      // Eel warning before dive
      if (rd.diver) {
        const eelWarning = _rp(FLU_HOST.eelWarning);
        roundHtml += `<div class="of-ev" style="border-left-color:var(--of-teal)">
          <div style="flex:1;min-width:0">
            <div class="of-ev-badge teal">EEL TANK</div>
            <div class="of-ev-text" style="font-style:italic">${host}: ${eelWarning}</div>
          </div>
        </div>`;

        // Dive events (eel dodge, rope snap) — happen during the dive
        for (const evt of diveEvents) {
          const badgeColor = evt.type === 'eelDodge' ? 'teal' : 'red';
          const badgeLabel = evt.type === 'eelDodge' ? 'EEL DODGE' : 'ROPE SNAP';
          const icon = evt.type === 'eelDodge' ? '⚡' : '🪢';
          const portrait = evt.player ? _ofSmallPortrait(evt.player, 32) : '';
          roundHtml += `<div style="background:${evt.type === 'eelDodge' ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)'};border:1px solid ${evt.type === 'eelDodge' ? 'rgba(20,184,166,0.2)' : 'rgba(239,68,68,0.2)'};border-left:4px solid ${evt.type === 'eelDodge' ? 'var(--of-teal)' : 'var(--of-red)'};border-radius:4px;padding:8px 12px;margin:4px 0;display:flex;align-items:flex-start;gap:8px">
            <span style="font-size:16px">${icon}</span>
            ${portrait}
            <div style="flex:1;min-width:0">
              <div class="of-ev-badge ${badgeColor}">${badgeLabel}</div>
              <div class="of-ev-text" style="font-size:12px">${evt.text || ''}</div>
            </div>
          </div>`;
        }

        // Dive result with host reaction
        const shockIcons = rd.shocks > 0 ? ' ' + Array(Math.min(rd.shocks, 3)).fill('&#9889;').join('') : '';
        const diveClass = rd.partRetrieved ? 'positive' : 'negative';
        const hostDive = rd.partRetrieved ? _rp(FLU_HOST.diveSuccess) : _rp(rd.shocks >= 3 ? FLU_HOST.diveFailShock : FLU_HOST.diveFailMiss);
        roundHtml += `<div class="of-ev ${diveClass}">
          ${_ofSmallPortrait(rd.diver, 36)}
          <div style="flex:1;min-width:0">
            <div class="of-ev-badge ${rd.partRetrieved ? 'teal' : 'red'}">${rd.partRetrieved ? 'DIVE SUCCESS' : rd.shocks >= 3 ? 'SHOCKED OUT' : 'MISSED GRAB'}${shockIcons}</div>
            <div class="of-ev-text"><strong>${rd.diver}</strong> ${rd.partRetrieved
              ? 'retrieves a body part from the eel tank!'
              : rd.shocks >= 3 ? `takes ${rd.shocks} shocks — too many jolts, forced out empty-handed!`
              : 'dives in but can\'t get a grip on the part — comes up empty.'} (${rd.shocks} shock${rd.shocks !== 1 ? 's' : ''})</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:4px">${host}: ${hostDive}</div>
          </div>
        </div>`;
      }
    } else {
      const hostWrong = _rp(FLU_HOST.wrongAnswer);
      roundHtml += `<div class="of-ev negative">
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge red">NO WINNER</div>
          <div class="of-ev-text">All tribes answer incorrectly. No dive this round.</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:4px">${host}: ${hostWrong}</div>
        </div>
      </div>`;
    }

    feed += `<div id="of-step-quiz-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${roundHtml}</div>`;
    stepIdx++;
  }

  // Summary step
  const partSummary = Object.entries(mq.partsByTribe || {}).map(([t, c]) => `<strong>${t}</strong>: ${c}`).join(' &middot; ');
  const hostAssembly = _rp(FLU_HOST.assemblyStart);
  feed += `<div id="of-step-quiz-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">
    <div class="of-ev positive" style="border-left-color:var(--of-teal);padding:16px;text-align:center">
      <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-teal);letter-spacing:3px;margin-bottom:6px">QUIZ COMPLETE</div>
      <div class="of-ev-text">Parts retrieved: ${partSummary}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:8px">${host}: ${hostAssembly}</div>
    </div>
  </div>`;
  stepIdx++;

  const totalSteps = stepIdx;

  // Sidebar
  const sidebar = _ofBuildQuizSidebar(mq, revIdx, tribeNames, of);

  // HUD
  const hudCells = tribeNames.map(t => {
    const parts = revIdx >= totalSteps - 1 ? (mq.partsByTribe?.[t] || 0) : '?';
    return `<div class="of-hud-cell">
      <div class="of-hud-val">${parts}</div>
      <div class="of-hud-lbl">${t}</div>
    </div>`;
  }).join('');

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="of-controls-quiz" class="of-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="of-btn-next" onclick="oneFluRevealNext('of-quiz',${totalSteps})">NEXT</button>
    <button class="of-btn-all" onclick="oneFluRevealAll('of-quiz',${totalSteps})">Reveal All</button>
  </div>`;

  const doneBox = `<div id="of-done-quiz" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:24px 20px;margin:12px 14px;background:rgba(0,0,0,0.3);border:2px solid rgba(20,184,166,0.3);border-radius:8px;position:relative;z-index:6;overflow:visible'}">
    ${_ofStamp('EEL TANK COMPLETE', 'teal')}
    <div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.5)">Body parts secured. Assembly phase next.</div>
  </div>`;

  return _ofShell(`
    <div class="of-hud">${hudCells}</div>
    <div class="of-layout">
      <div class="of-feed">${feed}${controls}</div>
      <div class="of-sidebar" id="of-sidebar-quiz">${sidebar}</div>
    </div>
    ${doneBox}
  `, ep);
}

function _ofBuildQuizSidebar(mq, revIdx, tribeNames, of) {
  const ss = of?.studySleep?.tribes || {};
  let sidebar = '';

  // Parts per tribe
  sidebar += `<div class="of-side-sec">BODY PARTS</div>`;
  for (const t of tribeNames) {
    const parts = revIdx >= 0 ? (mq.partsByTribe?.[t] || 0) : '?';
    const maxParts = 5;
    const pct = typeof parts === 'number' ? (parts / maxParts) * 100 : 0;
    sidebar += `<div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.6)">
        <span>${t}</span><span style="font-family:'Orbitron',sans-serif;color:var(--of-teal)">${parts}</span>
      </div>
      ${_ofEkgBar(pct)}
    </div>`;
  }

  // Player roster with study/sleep status
  sidebar += `<div class="of-side-sec">ROSTER</div>`;
  for (const t of tribeNames) {
    const tribeData = ss[t];
    if (!tribeData) continue;
    sidebar += `<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;letter-spacing:1px">${t}</div>`;
    sidebar += `<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px">`;
    for (const n of (tribeData.studiers || [])) {
      sidebar += _ofSideWristband(n, 28, 'studying', 'STD');
    }
    for (const n of (tribeData.sleepers || [])) {
      sidebar += _ofSideWristband(n, 28, 'sleeping', 'SLP');
    }
    sidebar += `</div>`;
  }

  return sidebar;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — FrankenChris Assembly (show all)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluAssembly(ep) {
  const of = ep.oneFlu;
  if (!of?.assembly) return '';
  const asm = of.assembly;
  const tribeNames = Object.keys(of.tribeScores || {});
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const mq = of.medicalQuiz;

  // Rules box
  let feed = `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(59,130,246,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">Assemble your FrankenChris from the parts you collected, then hoist it to the roof for lightning. More parts = faster assembly. First tribe to reanimate wins Phase 2.</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      ${tribeNames.map(t => {
        const parts = mq?.partsByTribe?.[t] || 0;
        return `<span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(20,184,166,0.1);color:#5eead4;border:1px solid rgba(20,184,166,0.15)">${t}: ${parts} PARTS</span>`;
      }).join('')}
    </div>
  </div>`;

  // Host intro
  feed += `<div class="of-ev" style="border-left-color:var(--of-teal)">
    <div style="flex:1;min-width:0">
      <div class="of-ev-badge teal">HOST</div>
      <div class="of-ev-text" style="font-style:italic">${host}: ${_rp(FLU_HOST.assemblyStart)}</div>
    </div>
  </div>`;

  for (const td of (asm.tribes || [])) {
    const isWinner = td.tribe === asm.winner;
    const tribeParts = mq?.partsByTribe?.[td.tribe] || 0;
    feed += `<div class="of-ev round-header"><div style="flex:1;text-align:center">
      <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:${isWinner ? 'var(--of-teal)' : 'var(--of-blue)'};letter-spacing:3px">${td.tribe} ${isWinner ? '&#10003;' : ''}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${tribeParts} body parts &middot; Assembly: ${td.assemblyScore?.toFixed(2) || '?'} &middot; Hoist: ${td.hoistScore?.toFixed(2) || '?'}</div>
    </div></div>`;

    if (!(td.events || []).length) {
      feed += `<div class="of-ev">
        <div style="flex:1;min-width:0">
          <div class="of-ev-text" style="color:rgba(255,255,255,0.5)">The tribe works steadily &mdash; no drama, no heroics. Just efficient medical assembly.</div>
        </div>
      </div>`;
    }

    for (const evt of (td.events || [])) {
      const evtClass = evt.type === 'teamworkSurge' || evt.type === 'lightning' ? 'positive' : evt.type === 'partDoesntFit' || evt.type === 'hoistStruggle' || evt.type === 'pantsPull' ? 'negative' : '';
      const badgeColor = evt.type === 'teamworkSurge' ? 'green' : evt.type === 'lightning' ? 'gold' : evt.type === 'partDoesntFit' ? 'red' : evt.type === 'hoistStruggle' ? 'orange' : evt.type === 'pantsPull' ? 'red' : 'gray';
      const badgeLabel = evt.type === 'teamworkSurge' ? 'TEAMWORK' : evt.type === 'lightning' ? 'LIGHTNING BUILD' : evt.type === 'partDoesntFit' ? 'PART FAIL' : evt.type === 'hoistStruggle' ? 'HOIST STRUGGLE' : evt.type === 'pantsPull' ? 'PANTS PULL' : evt.type.toUpperCase();
      const portrait = evt.player ? _ofSmallPortrait(evt.player, 36) : (evt.players?.[0] ? _ofSmallPortrait(evt.players[0], 36) : '');
      feed += `<div class="of-ev ${evtClass}">
        ${portrait}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge ${badgeColor}">${badgeLabel}</div>
          <div class="of-ev-text">${evt.text || ''}</div>
        </div>
      </div>`;
    }
  }

  // Winner with host commentary
  const winCommentary = [
    `${host} walks the line, inspects each patient, and points at ${asm.winner}'s assembly. "That's a winner."`,
    `${host} pokes ${asm.winner}'s FrankenChris. It doesn't fall over. He nods. "Congratulations. You've created life. Sort of."`,
    `"And ${asm.winner} has done it!" ${host} announces. "Their FrankenChris is standing, assembled, and only slightly terrifying."`,
  ];
  feed += `<div style="text-align:center;padding:16px;margin-top:8px">
    ${_ofStamp(asm.winner + ' WINS ASSEMBLY', 'teal')}
    <div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:10px;max-width:500px;margin-left:auto;margin-right:auto">${_rp(winCommentary)}</div>
  </div>`;

  return _ofShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--of-blue);letter-spacing:4px">FRANKENCHRIS ASSEMBLY</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">Build the patient. Hoist the body. Win the phase.</div>
      </div>
      ${feed}
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Drama Break (show all)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluDramaBreak(ep) {
  const of = ep.oneFlu;
  if (!of) return '';
  const events = of.breakEvents;
  if (!events?.length) return '';

  const impactMap = {
    alliancePitch:    { icon: '+', impact: 'Bond formed, popularity dip', color: '#c4b5fd' },
    studyRegret:      { icon: '+', impact: 'Popularity dip', color: '#94a3b8' },
    pizzaSuspicion:   { icon: '+', impact: 'Bond damaged', color: '#fdba74' },
    rivalryPrank:     { icon: '+', impact: 'Bond damaged, heat generated', color: '#fca5a5' },
    exhaustionDrama:  { icon: '+', impact: 'Popularity dip', color: '#94a3b8' },
    secretDeal:       { icon: '+', impact: 'Bond + popularity boost', color: '#5eead4' },
    sleepGuilt:       { icon: '+', impact: 'Bond formed', color: '#93c5fd' },
    medicalHumor:     { icon: '+', impact: 'Popularity boost', color: '#fbbf24' },
  };

  let feed = '';
  for (const evt of events) {
    const firstPlayer = (evt.players || [])[0];
    const imp = impactMap[evt.id] || { icon: '+', impact: '', color: '#6b7280' };
    feed += `<div class="of-ev" style="border-left-color:${imp.color}">
      ${firstPlayer ? _ofSmallPortrait(firstPlayer, 44) : ''}
      <div style="flex:1;min-width:0">
        <div class="of-ev-badge ${evt.badgeClass || 'gray'}">${evt.badgeText || 'PHASE BREAK'}</div>
        <div class="of-ev-text">${evt.text || ''}</div>
        ${imp.impact ? `<div style="display:flex;align-items:center;gap:4px;margin-top:6px;font-size:10px;color:${imp.color}"><span class="of-cross" style="font-size:10px;margin:0">${imp.icon}</span> ${imp.impact}</div>` : ''}
        ${(evt.players || []).length > 1 ? `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${evt.players.slice(1).map(n => {
          const s = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
          return `<img src="assets/avatars/${s}.png" width="24" height="24" style="border-radius:2px;border:1px solid #334155" title="${n}" onerror="this.style.display='none'">`;
        }).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  const host = seasonConfig.host || 'Chris';

  // Intro context
  const breakIntro = `<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(59,130,246,0.5);margin-bottom:6px">BETWEEN PHASES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">While ${host} resets the challenge area for the outbreak phase, the contestants have downtime. Alliances shift. Regrets surface. Someone always does something stupid.</div>
  </div>`;

  return _ofShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;font-family:'Orbitron',sans-serif;font-size:13px;color:var(--of-blue);letter-spacing:4px;margin-bottom:12px">PHASE BREAK</div>
      ${breakIntro}
      ${feed}
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Disease Outbreak (click-to-reveal per round) — QUARANTINE SHIFT
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluDisease(ep) {
  const of = ep.oneFlu;
  if (!of?.diseaseOutbreak) return '';
  const dis = of.diseaseOutbreak;
  const rounds = dis.rounds || [];
  const tribeNames = Object.keys(of.tribeScores || {});
  const ss = of.studySleep?.tribes || {};

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['of-disease']) window._tvState['of-disease'] = { idx: -1 };
  const revIdx = window._tvState['of-disease'].idx;

  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Rules box (always visible)
  let feed = `<div style="background:rgba(132,204,22,0.05);border:1px solid rgba(132,204,22,0.2);border-radius:6px;padding:12px 16px;margin-bottom:12px">
    <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:rgba(132,204,22,0.5);margin-bottom:6px">PHASE RULES</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7">OUTBREAK! Everyone who studied last night is now &lsquo;infected&rsquo; with psychosomatic symptoms from the fake textbooks. Only the sleepers &mdash; the ones who DIDN&rsquo;T study &mdash; can cure them. Each round, doctors attempt to cure symptoms. Cure ANY player (even from another tribe) = +1 point for your team. Most cures = Best Doctor award.</div>
    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(239,68,68,0.1);color:#fca5a5;border:1px solid rgba(239,68,68,0.15)">STUDIERS = INFECTED</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(34,197,94,0.1);color:#86efac;border:1px solid rgba(34,197,94,0.15)">SLEEPERS = DOCTORS</span>
      <span style="font-size:9px;padding:2px 8px;border-radius:3px;background:rgba(234,179,8,0.1);color:#fde68a;border:1px solid rgba(234,179,8,0.15)">4 CURE ROUNDS</span>
    </div>
  </div>`;

  let stepIdx = 0;

  // Patient status intro with symptom details
  const infectedNames = Object.keys(dis.infected || {});
  const doctorsList = Object.values(ss).flatMap(t => t.sleepers || []);

  let introHtml = `<div class="of-ev quarantine" style="border-left-color:var(--of-quarantine)"><div style="flex:1;min-width:0">
    <div class="of-ev-badge toxic">QUARANTINE ACTIVATED</div>
    <div class="of-ev-text" style="font-style:italic">${host}: "Congratulations &mdash; you studied, so now you're sick. The sleepers are your only hope. Try not to die."</div>
  </div></div>`;

  // Individual patient cards with symptom descriptions
  for (const name of infectedNames) {
    const symptoms = dis.infected[name] || [];
    const symptomCards = symptoms.map(sym => {
      const label = sym.id?.replace(/([A-Z])/g, ' $1').trim() || sym.id;
      const desc = FLU_SYMPTOMS[sym.id] || '';
      const tierColor = sym.tier === 'critical' ? '#ef4444' : sym.tier === 'hard' ? '#f97316' : sym.tier === 'medium' ? '#eab308' : '#22c55e';
      return `<div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:4px;padding:6px 10px;margin-top:4px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:10px;color:#fca5a5;font-family:'Orbitron',sans-serif;letter-spacing:1px">${label.toUpperCase()}</span>
          <span style="font-size:8px;padding:1px 6px;border-radius:2px;background:rgba(0,0,0,0.3);color:${tierColor};border:1px solid ${tierColor}40">${sym.tier.toUpperCase()}</span>
        </div>
        ${desc ? `<div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:3px;line-height:1.5">${desc}</div>` : ''}
      </div>`;
    }).join('');

    introHtml += `<div class="of-ev quarantine">
      ${_ofSmallPortrait(name, 44)}
      <div style="flex:1;min-width:0">
        <div class="of-ev-badge red">PATIENT: ${name.toUpperCase()}</div>
        ${symptomCards}
      </div>
    </div>`;
  }

  // Doctor roster
  if (doctorsList.length) {
    introHtml += `<div class="of-ev quarantine" style="border-left-color:var(--of-sick-green)"><div style="flex:1;min-width:0">
      <div class="of-ev-badge green">DOCTORS ON DUTY</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        ${doctorsList.map(n => _ofWristband(n, 48, 'clean', 'DOCTOR')).join('')}
      </div>
      <div class="of-ev-text" style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.5)">These players slept last night. They're rested, healthy, and the only ones who can cure the infected.</div>
    </div></div>`;
  }

  feed += `<div id="of-step-disease-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${introHtml}</div>`;
  stepIdx++;

  // Rounds
  for (let i = 0; i < rounds.length; i++) {
    const rd = rounds[i];
    let roundHtml = `<div class="of-ev round-header quarantine"><div style="flex:1;text-align:center">
      <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-toxic);letter-spacing:3px">OUTBREAK ROUND ${rd.num}</div>
    </div></div>`;

    // Chaos events first
    for (const ce of (rd.chaosEvents || [])) {
      roundHtml += `<div class="of-ev chaos">
        ${(ce.players?.[0]) ? _ofSmallPortrait(ce.players[0], 36) : ''}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge ${ce.badgeClass || 'orange'}">${ce.badgeText || ce.id?.toUpperCase() || 'CHAOS'}</div>
          <div class="of-ev-text">${ce.text || ''}</div>
        </div>
      </div>`;
    }

    // Cure attempts
    for (const att of (rd.cureAttempts || [])) {
      const evClass = att.success ? 'cure-success' : 'cure-fail';
      const symptomLabel = att.symptom?.replace(/([A-Z])/g, ' $1').trim() || att.symptom;
      const symptomDesc = FLU_SYMPTOMS[att.symptom] || '';
      roundHtml += `<div class="of-ev ${evClass} quarantine">
        ${_ofSmallPortrait(att.doctor, 32)}
        <div style="flex:1;min-width:0">
          <div class="of-ev-badge ${att.success ? 'green' : 'red'}">${att.success ? 'CURE SUCCESS' : 'CURE FAILED'}</div>
          <div class="of-ev-text">${att.text || ''}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:10px;color:rgba(255,255,255,0.4)">
            <span style="color:${att.success ? '#86efac' : '#fca5a5'}">${att.success ? '&#10003;' : '&#10007;'}</span>
            <span>${symptomLabel}</span>
            <span>&middot;</span>
            <span>Patient: ${att.patient}</span>
          </div>
          ${symptomDesc && !att.success ? `<div style="font-size:10px;color:rgba(255,255,255,0.35);font-style:italic;margin-top:2px">${symptomDesc}</div>` : ''}
        </div>
      </div>`;
    }

    // Round cure summary
    const roundCures = rd.cureAttempts?.filter(a => a.success).length || 0;
    roundHtml += `<div style="text-align:right;font-size:10px;color:var(--of-toxic);padding:4px 8px;font-family:'Orbitron',sans-serif;letter-spacing:1px">ROUND ${rd.num} CURES: ${roundCures}</div>`;

    feed += `<div id="of-step-disease-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${roundHtml}</div>`;
    stepIdx++;
  }

  // Best doctor step — full narrative
  const totalCures = rounds.reduce((sum, r) => sum + (r.cureAttempts?.filter(a => a.success).length || 0), 0);
  const totalAttempts = rounds.reduce((sum, r) => sum + (r.cureAttempts?.length || 0), 0);
  const bestDoctorCommentary = dis.bestDoctor ? [
    `"Best Doctor goes to..." ${host} pauses for drama. "...${dis.bestDoctor}." The tribe groans. The doctor nods.`,
    `${host} pins a plastic stethoscope on ${dis.bestDoctor}. "You've earned this. Try not to let it go to your head."`,
    `When the quarantine lifts, ${dis.bestDoctor} stands with the most cures. ${host} claps slowly. It might be sarcastic.`,
  ] : [];
  let doctorHtml = `<div class="of-ev quarantine" style="border-left-color:var(--of-sick-green);padding:16px;text-align:center">
    ${dis.bestDoctor ? _ofWristband(dis.bestDoctor, 64, 'cured', 'BEST DOCTOR') : ''}
    <div style="font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-sick-green);letter-spacing:3px;margin-top:8px">BEST DOCTOR: ${dis.bestDoctor || '???'}</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px">${totalCures} of ${totalAttempts} cure attempts successful across ${rounds.length} rounds.</div>
    ${dis.bestDoctor && bestDoctorCommentary.length ? `<div style="font-size:11px;color:rgba(255,255,255,0.5);font-style:italic;margin-top:8px;max-width:500px;margin-left:auto;margin-right:auto">${_rp(bestDoctorCommentary)}</div>` : ''}
  </div>`;
  feed += `<div id="of-step-disease-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${doctorHtml}</div>`;
  stepIdx++;

  const totalSteps = stepIdx;

  // Sidebar
  const sidebar = _ofBuildDiseaseSidebar(dis, revIdx, tribeNames, of);

  // HUD — quarantine themed
  const hudCells = tribeNames.map(t => {
    const cures = revIdx >= totalSteps - 1 ? (dis.cureScores?.[t] || 0) : '?';
    return `<div class="of-hud-cell" style="border-color:rgba(132,204,22,0.15)">
      <div class="of-hud-val" style="color:var(--of-toxic)">${typeof cures === 'number' ? Math.round(cures) : cures}</div>
      <div class="of-hud-lbl">${t}</div>
    </div>`;
  }).join('');

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="of-controls-disease" class="of-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="of-btn-next" style="border-color:rgba(132,204,22,0.3);color:var(--of-toxic);box-shadow:0 4px 15px rgba(0,0,0,0.5),0 0 12px rgba(132,204,22,0.1)" onclick="oneFluRevealNext('of-disease',${totalSteps})">NEXT</button>
    <button class="of-btn-all" onclick="oneFluRevealAll('of-disease',${totalSteps})">Reveal All</button>
  </div>`;

  const doneBox = `<div id="of-done-disease" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:24px 20px;margin:12px 14px;background:rgba(0,0,0,0.3);border:2px solid rgba(132,204,22,0.3);border-radius:8px;position:relative;z-index:6;overflow:visible'}">
    ${_ofStamp('QUARANTINE LIFTED', 'toxic')}
    <div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.5)">All patients treated. Final verdict incoming.</div>
  </div>`;

  return _ofShell(`
    <div class="of-hud">${hudCells}</div>
    <div class="of-layout">
      <div class="of-feed">${feed}${controls}</div>
      <div class="of-sidebar" id="of-sidebar-disease">${sidebar}</div>
    </div>
    ${doneBox}
  `, ep);
}

function _ofBuildDiseaseSidebar(dis, revIdx, tribeNames, of) {
  const ss = of?.studySleep?.tribes || {};
  let sidebar = '';

  // Patient tracker
  sidebar += `<div class="of-side-sec" style="color:rgba(132,204,22,0.5);border-color:rgba(132,204,22,0.12)">PATIENT TRACKER</div>`;
  for (const [patient, symptoms] of Object.entries(dis.infected || {})) {
    const allCured = symptoms.every(s => s.cured);
    const statusClass = allCured ? 'cured' : 'infected';
    sidebar += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
      ${_ofSideWristband(patient, 24, statusClass, allCured ? 'OK' : 'ILL')}
      <div style="flex:1;min-width:0">`;
    for (const sym of symptoms) {
      const label = sym.id?.replace(/([A-Z])/g, ' $1').trim() || sym.id;
      const color = sym.cured ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)';
      const icon = sym.cured ? '&#10003;' : '&#10007;';
      // Only show cured status if revealed
      const showStatus = revIdx >= 0;
      sidebar += `<div style="font-size:9px;color:${showStatus ? color : 'rgba(255,255,255,0.3)'};display:flex;align-items:center;gap:3px">
        <span>${showStatus ? icon : '?'}</span> ${label} <span style="color:rgba(255,255,255,0.2);font-size:7px">${sym.tier}</span>
      </div>`;
    }
    sidebar += `</div></div>`;
  }

  // Doctors
  sidebar += `<div class="of-side-sec" style="color:rgba(132,204,22,0.5);border-color:rgba(132,204,22,0.12)">DOCTORS</div>`;
  for (const [tName, data] of Object.entries(ss)) {
    for (const doc of (data.sleepers || [])) {
      sidebar += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
        ${_ofSideWristband(doc, 24, 'clean', 'DOC')}
        <div style="font-size:9px;color:rgba(255,255,255,0.5)">${tName}</div>
      </div>`;
    }
  }

  // Cure scores per tribe
  if (revIdx >= 0) {
    sidebar += `<div class="of-side-sec" style="color:rgba(132,204,22,0.5);border-color:rgba(132,204,22,0.12)">CURE SCORES</div>`;
    for (const t of tribeNames) {
      const score = dis.cureScores?.[t] || 0;
      sidebar += `<div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:4px">
        <span>${t}</span><span style="font-family:'Orbitron',sans-serif;color:var(--of-toxic)">${Math.round(score)}</span>
      </div>`;
    }
  }

  return sidebar;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Results (Final Verdict)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildOneFluResults(ep) {
  const of = ep.oneFlu;
  if (!of) return '';

  const tribeScores = of.tribeScores || {};
  const sorted = Object.entries(tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0] || '???';
  const tribeNames = Object.keys(tribeScores);

  // Phase scoreboard
  const phaseLabels = ['STUDY/SLEEP', 'MEDICAL QUIZ', 'ASSEMBLY', 'DISEASE OUTBREAK'];

  const headerCells = tribeNames.map(t =>
    `<th style="padding:6px 12px;text-align:center;font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-teal)">${t}</th>`
  ).join('');

  let phaseRows = '';
  // Quiz parts
  const mq = of.medicalQuiz;
  if (mq) {
    const cells = tribeNames.map(t =>
      `<td style="padding:6px 12px;text-align:center;font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-blue)">${mq.partsByTribe?.[t] || 0}</td>`
    ).join('');
    phaseRows += `<tr><td style="padding:6px 12px;text-align:left;font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-blue)">QUIZ PARTS</td>${cells}</tr>`;
  }
  // Assembly
  if (of.assembly) {
    const cells = tribeNames.map(t => {
      const td = of.assembly.tribes?.find(x => x.tribe === t);
      const isWin = of.assembly.winner === t;
      return `<td style="padding:6px 12px;text-align:center;font-family:'Orbitron',sans-serif;font-size:14px;color:${isWin ? 'var(--of-teal)' : 'var(--of-steel)'}">${td ? td.total.toFixed(1) : '?'}</td>`;
    }).join('');
    phaseRows += `<tr><td style="padding:6px 12px;text-align:left;font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-blue)">ASSEMBLY</td>${cells}</tr>`;
  }
  // Disease cures
  if (of.diseaseOutbreak) {
    const cells = tribeNames.map(t =>
      `<td style="padding:6px 12px;text-align:center;font-family:'Orbitron',sans-serif;font-size:14px;color:var(--of-toxic)">${Math.round(of.diseaseOutbreak.cureScores?.[t] || 0)}</td>`
    ).join('');
    phaseRows += `<tr><td style="padding:6px 12px;text-align:left;font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-toxic)">CURE SCORE</td>${cells}</tr>`;
  }

  // Total row
  const totalCells = tribeNames.map(t =>
    `<td style="padding:8px 12px;text-align:center;border-top:2px solid rgba(20,184,166,0.3);font-family:'Orbitron',sans-serif;font-size:18px;color:${t === winnerTribe ? 'var(--of-teal)' : 'var(--of-steel)'}">${Math.round(tribeScores[t] || 0)}</td>`
  ).join('');

  const scoreboard = `<div style="background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.8));border:2px solid #1e293b;border-radius:4px;padding:12px;margin:12px 14px;box-shadow:inset 0 0 20px rgba(0,0,0,0.4)">
    <table style="width:100%;border-collapse:collapse;color:var(--of-teal)">
      <thead><tr><th style="padding:6px 12px;text-align:left"></th>${headerCells}</tr></thead>
      <tbody>${phaseRows}
        <tr><td style="padding:8px 12px;text-align:left;border-top:2px solid rgba(20,184,166,0.3);font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:2px;color:var(--of-teal)">TOTAL</td>${totalCells}</tr>
      </tbody>
    </table>
  </div>`;

  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Winner tribe portraits
  const winnerMembers = ep.winner?.members || [];
  const loserTribe = sorted[sorted.length - 1]?.[0] || '???';
  const loserMembers = ep.loser?.members || [];
  const safeTribes = (ep.safeTribes || []);

  const verdictCommentary = [
    `${host} hangs the immunity idol around ${winnerTribe}'s tribal banner. "${winnerTribe} &mdash; you're safe. ${loserTribe} &mdash; I'll see you tonight."`,
    `"${winnerTribe} wins immunity!" ${host} declares. He turns to ${loserTribe}. "Tribal council. Tonight. Someone's going home."`,
    `The medical challenge is over. ${winnerTribe} celebrated with their FrankenChris. ${loserTribe} starts whispering about votes before they even leave the field.`,
  ];

  // Winner spotlight with portraits
  const winnerSpotlight = `<div style="text-align:center;padding:20px 14px;position:relative;z-index:6">
    ${_ofStamp(winnerTribe + ' WINS', 'teal')}
    <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;max-width:500px;margin-left:auto;margin-right:auto">${_rp(verdictCommentary)}</div>
    ${winnerMembers.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:12px">
      ${winnerMembers.map(n => _ofWristband(n, 48, 'cured', 'IMMUNE')).join('')}
    </div>` : ''}
  </div>`;

  // Safe tribes (if 3+ tribes)
  let safeSec = '';
  if (safeTribes.length) {
    safeSec = `<div style="text-align:center;padding:12px 14px;margin:0 14px 12px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.15);border-radius:8px">
      <div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:3px;color:var(--of-blue);margin-bottom:8px">ALSO SAFE</div>
      ${safeTribes.map(t => `<div style="margin-bottom:8px">
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:4px">${t.name}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">
          ${(t.members || []).map(n => _ofWristband(n, 40, 'clean', 'SAFE')).join('')}
        </div>
      </div>`).join('')}
    </div>`;
  }

  // Tribal council team
  let tribalSec = '';
  if (loserMembers.length) {
    tribalSec = `<div style="text-align:center;padding:12px 14px;margin:0 14px 12px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:8px">
      <div style="font-family:'Orbitron',sans-serif;font-size:9px;letter-spacing:3px;color:#fca5a5;margin-bottom:8px">TRIBAL COUNCIL</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:6px">${loserTribe}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        ${loserMembers.map(n => _ofWristband(n, 48, 'infected', 'VOTING')).join('')}
      </div>
    </div>`;
  }

  // Best doctor spotlight
  let doctorSpot = '';
  if (of.diseaseOutbreak?.bestDoctor) {
    const doc = of.diseaseOutbreak.bestDoctor;
    const drPr = pronouns(doc);
    const doctorCommentary = [
      `${doc} treated more patients than anyone else and barely broke a sweat. ${drPr.Sub} looks quietly, infuriatingly satisfied.`,
      `When the smoke cleared, ${doc} had the most cures. ${host} pins a plastic stethoscope to ${drPr.posAdj} shirt.`,
      `${doc} emerges from the outbreak as the clear MVP. ${host} almost sounds impressed. Almost.`,
    ];
    doctorSpot = `<div style="text-align:center;padding:16px 14px;margin:0 14px;background:rgba(132,204,22,0.05);border:1px solid rgba(132,204,22,0.15);border-radius:8px">
      ${_ofWristband(doc, 56, 'cured', 'BEST DOCTOR')}
      <div style="font-family:'Orbitron',sans-serif;font-size:11px;color:var(--of-sick-green);letter-spacing:3px;margin-top:8px">BEST DOCTOR AWARD</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;font-style:italic">${_rp(doctorCommentary)}</div>
    </div>`;
  }

  // Player leaderboard
  const memberScores = ep.chalMemberScores || {};
  const sortedPlayers = Object.entries(memberScores).sort((a, b) => b[1] - a[1]);
  let leaderboard = '';
  if (sortedPlayers.length) {
    leaderboard = `<div style="margin:12px 14px">
      <div style="font-family:'Orbitron',sans-serif;font-size:8px;letter-spacing:3px;color:var(--of-blue);margin-bottom:8px;text-align:center">PLAYER STANDINGS</div>
      ${sortedPlayers.slice(0, 8).map(([name, score], i) => {
        const medal = i === 0 ? 'gold' : i === 1 ? 'teal' : i === 2 ? 'blue' : '';
        return `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;margin-bottom:3px;background:rgba(0,0,0,${i < 3 ? '0.3' : '0.15'});border-radius:3px;border-left:3px solid ${i === 0 ? 'var(--of-teal)' : i < 3 ? 'var(--of-blue)' : 'transparent'}">
          <span style="font-family:'Orbitron',sans-serif;font-size:10px;color:rgba(255,255,255,0.3);width:18px">${i + 1}</span>
          ${_ofSmallPortrait(name, 28)}
          <span style="flex:1;font-size:12px;color:rgba(255,255,255,0.8)">${name}</span>
          <span style="font-family:'Orbitron',sans-serif;font-size:12px;color:var(--of-teal)">${Math.round(score)}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  return _ofShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-family:'Orbitron',sans-serif;font-size:13px;color:var(--of-teal);letter-spacing:4px">FINAL VERDICT</div>
      </div>
      ${scoreboard}
      ${winnerSpotlight}
      ${safeSec}
      ${tribalSec}
      ${doctorSpot}
      ${leaderboard}
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// Reveal Functions + Sidebar Updates
// ═══════════════════════════════════════════════════════════════════════════

export function oneFluRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('of-', '');
  const el = document.getElementById(`of-step-${suffix}-${state.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`of-controls-${suffix}`);
    const done = document.getElementById(`of-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _ofUpdateSidebar(screenKey, state.idx);
}

export function oneFluRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('of-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`of-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`of-controls-${suffix}`);
  const done = document.getElementById(`of-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  const last = document.getElementById(`of-step-${suffix}-${totalSteps - 1}`);
  if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _ofUpdateSidebar(screenKey, totalSteps - 1);
}

function _ofUpdateSidebar(screenKey, revIdx) {
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep?.oneFlu) return;
  const of = ep.oneFlu;
  const tribeNames = Object.keys(of.tribeScores || {});

  if (screenKey === 'of-quiz' && of.medicalQuiz) {
    const sideEl = document.getElementById('of-sidebar-quiz');
    if (sideEl) sideEl.innerHTML = _ofBuildQuizSidebar(of.medicalQuiz, revIdx, tribeNames, of);
  }
  if (screenKey === 'of-disease' && of.diseaseOutbreak) {
    const sideEl = document.getElementById('of-sidebar-disease');
    if (sideEl) sideEl.innerHTML = _ofBuildDiseaseSidebar(of.diseaseOutbreak, revIdx, tribeNames, of);
  }
}
