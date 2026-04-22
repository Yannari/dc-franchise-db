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
