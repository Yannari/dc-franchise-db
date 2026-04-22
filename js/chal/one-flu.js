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
  diveFail: [
    `"Shocking! Too many jolts — that diver had to bail empty-handed. The body part stays in the tank!"`,
    `"The eels win this round! Too many shocks — no part for that tribe today."`,
    `"And they come up empty! Three shocks is the limit and they hit all three. Back to the bench!"`,
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
}

export function _textOneFlu(ep, ln, sec) {
  const of = ep.oneFlu;
  if (!of) return;
  sec('One Flu Over the Cuckoos');
  ln('The teams face a medical-themed challenge — study, diagnose, and survive a fake disease outbreak.');
}

export function rpBuildOneFluTitleCard(ep) {
  if (!ep.oneFlu) return '';
  return '<div style="padding:40px;text-align:center;color:#60a5fa;font-family:serif;"><h1>🏥 ONE FLU OVER THE CUCKOOS</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function oneFluRevealNext() {}
export function oneFluRevealAll() {}
