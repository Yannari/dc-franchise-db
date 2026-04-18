// js/chal/basic-straining.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateBasicStraining(ep) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const host = seasonConfig.host || 'Chris';
  const chef = 'Chef';
  const epNum = (gs.episode || 0) + 1;
  const isMerged = gs.isMerged;

  if (!ep.campEvents) ep.campEvents = {};
  if (!gs._basicStrainingHeat) gs._basicStrainingHeat = {};

  // ── PHASE DEFINITIONS ──
  const PHASES = [
    { id: 'canoe-hold', name: 'Canoe Hold', primary: 'endurance', secondary: 'temperament', fatigueCost: 0.03,
      desc: 'Hold a canoe over your heads. Chef sits on it. Nobody eats until someone quits.' },
    { id: 'mess-hall', name: 'Mess Hall', primary: 'boldness', secondary: 'mental', fatigueCost: 0.04,
      desc: 'Eat Chef\'s leftover garbage, then write a 300-word essay on why you love him. Fall asleep = eliminated.' },
    { id: 'dance-drill', name: 'Dance Drill', primary: 'physical', secondary: 'temperament', fatigueCost: 0.04,
      desc: 'Follow Chef\'s choreography. Mistakes mean pushups. Pride means nothing here.' },
    { id: 'obstacle-course', name: 'Obstacle Course', primary: 'physical', secondary: 'endurance', fatigueCost: 0.05,
      desc: 'Mud crawl, walls, ropes. The grind. Injuries possible.' },
    { id: 'night-march', name: 'Night March', primary: 'endurance', secondary: 'mental', fatigueCost: 0.05,
      desc: 'Sleep deprivation march through camp. Chef tells war stories. Minds break here.' },
    { id: 'tree-hang', name: 'Tree Hang', primary: 'endurance', secondary: 'mental', fatigueCost: 0.05,
      desc: 'Hang upside down from a branch. Last one up wins.' },
  ];

  // ── PARTICIPANTS ──
  const allCompetitors = isMerged
    ? [...gs.activePlayers]
    : gs.tribes.flatMap(t => t.members.filter(m => gs.activePlayers.includes(m)));
  const tribeOf = {};
  if (!isMerged) gs.tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));
  const campKey = isMerged ? (gs.mergeName || 'merge') : null;

  // Per-player state
  const fatigue = {};
  const status = {}; // 'standing' | 'eliminated' | 'quit' | 'boathouse'
  const dropPhase = {}; // which phase they dropped in
  const dropMethod = {}; // 'chef' | 'quit'
  allCompetitors.forEach(p => { fatigue[p] = 0; status[p] = 'standing'; });

  const phases = []; // collected phase results
  const allEvents = [];
  const socialEvents = [];
  const prankLog = [];
  const resentment = {}; // victim -> { bully, count }

  // ── DEFIANT PLAYER SELECTION ──
  let defiantPlayer = null;
  let defianceCount = 0;
  const defiancePerPlayer = {}; // track per-player defiance acts
  let boathouseTriggered = false;
  let boathouseVisitor = null;
  let foodRaidResult = null;

  // Defiant player is determined dynamically — whoever defies the most becomes "the defiant"
  // No pre-selection. Anyone with the right archetype (villain/chaos-agent/hothead/schemer) can defy.

  // ── SURVIVAL ROLL ──
  function survivalRoll(player, phase, phaseIdx) {
    const s = pStats(player);
    const primary = s[phase.primary] * 0.04;
    const secondary = s[phase.secondary] * 0.025;
    const fatigueHit = fatigue[player];
    const emotional = hasEmotionalDebuff(player) ? 0.05 : 0;
    // "Day factor" — good and bad days happen. Two random rolls averaged for less extreme variance
    const dayRoll = (Math.random() + Math.random()) * 0.15;
    // Clutch/choke — small chance of wildly over/under-performing
    const clutch = Math.random() < 0.1 ? 0.12 : Math.random() < 0.1 ? -0.08 : 0;
    // Defiant stubbornness bonus — too stubborn to fail early, fades in later phases
    const defiantBonus = (player === defiantPlayer) ? Math.max(0, 0.08 - phaseIdx * 0.015) : 0;
    return primary + secondary + dayRoll + clutch + defiantBonus - fatigueHit - emotional;
  }

  function hasEmotionalDebuff(name) {
    const prevEp = gs.episodeHistory?.length ? gs.episodeHistory[gs.episodeHistory.length - 1] : null;
    if (prevEp?.eliminated && getBond(name, prevEp.eliminated) >= 3) return true;
    if (gs.showmances?.some(s => s.broken && s.players.includes(name))) return true;
    return false;
  }

  // ── QUIT CHECK ──
  function quitCheck(player) {
    const s = pStats(player);
    // Fatigue is the main driver — stats just shift the breaking point.
    // Early phases: almost nobody quits. Mid phases: weak players crack. Late: anyone can break.
    const chance = (10 - s.mental) * 0.02 + (10 - s.endurance) * 0.015
                 + (10 - s.boldness) * 0.01 + fatigue[player] * 2.0 + Math.random() * 0.08;
    return chance > 0.58;
  }

  // ── DEFIANCE CHECK ──
  function defianceCheck(player, phaseIdx) {
    // Anyone with the right archetype can defy — proportional to boldness/temperament
    // ~25-45% chance for a bold hothead, ~10-20% for a mild schemer
    const s = pStats(player);
    return Math.random() < s.boldness * 0.035 + (10 - s.temperament) * 0.025 + phaseIdx * 0.01;
  }

  // ── Helper: count remaining per tribe ──
  function tribeRemaining(tribeName) {
    return allCompetitors.filter(p => tribeOf[p] === tribeName && status[p] === 'standing').length;
  }
  function allRemaining() {
    return allCompetitors.filter(p => status[p] === 'standing');
  }

  // ── Pre-merge: check if a tribe is wiped ──
  function checkTeamWipeout() {
    if (isMerged) return null;
    for (const t of gs.tribes) {
      if (tribeRemaining(t.name) === 0) return t;
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════════════
  // MAIN PHASE LOOP
  // ══════════════════════════════════════════════════════════════════
  let challengeOver = false;
  const _crackedBefore = new Set(); // prevent same person cracking every phase
  const _prankedBefore = new Set(); // prevent same victim getting pranked every phase
  let winnerTribe = null;
  let loserTribe = null;
  let immunityWinner = null;

  for (let phaseIdx = 0; phaseIdx < PHASES.length && !challengeOver; phaseIdx++) {
    const phase = PHASES[phaseIdx];
    const standing = allRemaining();
    if (standing.length <= 1) { challengeOver = true; break; }

    const phaseResult = {
      name: phase.name, id: phase.id, phaseIdx, desc: phase.desc,
      primaryStat: phase.primary, secondaryStat: phase.secondary,
      survivors: [], eliminated: [], quit: [],
      events: [], defianceEvents: [],
    };

    // (Boathouse visit/food raid now fires immediately in the defiance block when boathouse triggers)

    // ── PHASE-SPECIFIC MECHANICS + SURVIVAL ROLLS ──
    const phaseStanding = allCompetitors.filter(p => status[p] === 'standing');

    // Phase-specific pre-events (flavor + score modifiers)
    if (phase.id === 'canoe-hold') {
      // Chef taunts players — low temperament players lose composure
      phaseStanding.forEach(player => {
        const s = pStats(player);
        // Patience bonus: high temperament reduces fatigue gain for this phase
        const patienceBonus = s.temperament * 0.003;
        fatigue[player] = Math.max(0, fatigue[player] - patienceBonus);
      });
      // Chef taunts the most impatient player
      const mostImpatient = phaseStanding.reduce((worst, p) => pStats(p).temperament < pStats(worst).temperament ? p : worst, phaseStanding[0]);
      if (pStats(mostImpatient).temperament <= 5) {
        const txt = _rp([
          `Three hours in. ${chef} leans on ${mostImpatient}'s canoe. "Getting heavy, ${mostImpatient}? Want me to call your mommy?"`,
          `${chef} starts telling a story about the war. Directly at ${mostImpatient}. ${pronouns(mostImpatient).Sub} ${pronouns(mostImpatient).sub === 'they' ? 'are' : 'is'} visibly shaking with the effort not to snap.`,
          `"${mostImpatient}! Your arms are WOBBLING. Are you even TRYING?" ${chef} gets inches from ${pronouns(mostImpatient).posAdj} face.`,
        ]);
        phaseResult.events.push({ type: 'bs-chef-taunt', text: txt, players: [mostImpatient], badgeText: 'TAUNTED', badgeClass: 'orange' });
        allEvents.push({ type: 'bs-chef-taunt', text: txt, players: [mostImpatient], phase: phase.id });
        fatigue[mostImpatient] += (10 - pStats(mostImpatient).temperament) * 0.003; // impatient = extra fatigued
      }
    }

    if (phase.id === 'mess-hall') {
      // Two sub-challenges: eat garbage + write essay
      phaseStanding.forEach(player => {
        const s = pStats(player);
        const pr = pronouns(player);
        const isDefPlayer = player === defiantPlayer;
        // Eating garbage: boldness check
        const ateGarbage = Math.random() < s.boldness * 0.08 + 0.15;
        // Essay: mental check (fall asleep = fail)
        // Defiant player always stays awake — too stubborn/rebellious to sleep, writes a sarcastic essay
        const stayedAwake = isDefPlayer ? true : Math.random() < s.mental * 0.07 + s.endurance * 0.03 + 0.1;

        if (ateGarbage && stayedAwake) {
          const txt = _rp([
            `${player} eats the garbage without complaint and writes a 300-word essay about loving ${chef}. "${chef} is the greatest." Repeated 60 times. ${chef}: "...That counts."`,
            `${player} forces the food down, then writes the essay. Every word drips with false sincerity. But it's 300 words.`,
          ]);
          phaseResult.events.push({ type: 'bs-mess-pass', text: txt, players: [player], badgeText: 'ATE & WROTE', badgeClass: 'green' });
          fatigue[player] -= 0.02; // nourished
        } else if (!ateGarbage && stayedAwake) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[player] = (gs.popularity[player] || 0) + 1; // refused garbage food = principled edit
          const txt = _rp([
            `${player} refuses to eat the garbage. "I have standards." The essay is immaculate though. ${chef}: "Empty stomach, full marks."`,
            `"I'm not eating that." ${player} pushes the plate away. But ${pr.posAdj} essay is a masterpiece of strategic flattery.`,
          ]);
          phaseResult.events.push({ type: 'bs-mess-refused', text: txt, players: [player], badgeText: 'REFUSED FOOD', badgeClass: 'orange' });
          fatigue[player] += 0.02; // hungry
        } else if (ateGarbage && !stayedAwake) {
          const txt = _rp([
            `${player} ate everything — then fell asleep face-first in the essay. ${chef}: "DISMISSED."`,
            `The garbage knocked ${player} out. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} snoring on the table. ${chef}: "WAKE UP AND GET OUT."`,
          ]);
          phaseResult.events.push({ type: 'bs-mess-asleep', text: txt, players: [player], badgeText: 'FELL ASLEEP', badgeClass: 'red' });
          // Directly eliminated — fell asleep means OUT
          status[player] = 'eliminated';
          dropPhase[player] = phaseIdx;
          dropMethod[player] = 'chef';
          phaseResult.eliminated.push({ player, method: 'chef', text: txt });
        } else {
          const txt = `${player} won't eat and can barely keep ${pr.posAdj} eyes open. ${chef}: "If you can't eat AND you can't write, what CAN you do? OUT."`;
          phaseResult.events.push({ type: 'bs-mess-double-fail', text: txt, players: [player], badgeText: 'DOUBLE FAIL', badgeClass: 'red' });
          // Directly eliminated — can't eat AND can't write means OUT
          status[player] = 'eliminated';
          dropPhase[player] = phaseIdx;
          dropMethod[player] = 'chef';
          phaseResult.eliminated.push({ player, method: 'chef', text: txt });
        }
        allEvents.push({ type: 'bs-mess', players: [player], phase: phase.id });
      });
    }

    if (phase.id === 'dance-drill') {
      // Chef's choreography — physical coordination + humiliation tolerance
      const txt = _rp([
        `${chef} turns on the music. "FOLLOW MY MOVES. And I don't mean EVENTUALLY." The drill is relentless.`,
        `Dance drill. ${chef}'s choreography makes no sense. "LEFT! RIGHT! SPIN! PUSH-UPS! LEFT AGAIN!" Nobody can keep up.`,
      ]);
      phaseResult.events.push({ type: 'bs-drill-start', text: txt, players: [], badgeText: 'DRILL', badgeClass: 'gold' });
      allEvents.push({ type: 'bs-drill-start', text: txt, players: [], phase: phase.id });
    }

    if (phase.id === 'obstacle-course') {
      // Mud crawl intro
      const txt = _rp([
        `The obstacle course stretches across the camp. Mud pits. Walls. Rope climbs. ${chef}: "Under a minute or you're OUT."`,
        `${chef} points at the course. "This is what separates the soldiers from the civilians. MOVE."`,
      ]);
      phaseResult.events.push({ type: 'bs-obstacle-intro', text: txt, players: [], badgeText: 'OBSTACLE COURSE', badgeClass: 'gold' });
      allEvents.push({ type: 'bs-obstacle-intro', text: txt, players: [], phase: phase.id });
    }

    if (phase.id === 'night-march') {
      // Sleep deprivation intro
      const txt = _rp([
        `Midnight. ${chef} wakes everyone up. "NIGHT MARCH. Nobody sleeps until I say so." The groaning is universal.`,
        `"On your feet. We're marching." The moon is up. The camp is dark. ${chef} doesn't care.`,
      ]);
      phaseResult.events.push({ type: 'bs-night-intro', text: txt, players: [], badgeText: 'NIGHT MARCH', badgeClass: 'gold' });
      allEvents.push({ type: 'bs-night-intro', text: txt, players: [], phase: phase.id });
    }

    if (phase.id === 'tree-hang') {
      // Tree hang intro + fart/distraction mechanic
      const txt = `"Last challenge. Hang upside down from that branch. Last one up wins." ${chef} points at the tree. "Simple. Brutal. Beautiful."`;
      phaseResult.events.push({ type: 'bs-tree-intro', text: txt, players: [], badgeText: 'FINAL STAND', badgeClass: 'gold' });
      allEvents.push({ type: 'bs-tree-intro', text: txt, players: [], phase: phase.id });

      // Distraction events during tree hang
      if (phaseStanding.length >= 3) {
        // Someone farts / someone laughs / someone drops from distraction
        const gassyPlayer = phaseStanding.reduce((worst, p) => pStats(p).temperament < pStats(worst).temperament ? p : worst, phaseStanding[0]);
        if (Math.random() < 0.4) {
          const nearby = phaseStanding.filter(p => p !== gassyPlayer);
          const victim = nearby.length ? nearby[Math.floor(Math.random() * nearby.length)] : null;
          if (victim) {
            const dTxt = _rp([
              `${gassyPlayer} farts. Loudly. ${victim}: "ARE YOU SERIOUS?!" The branch shakes from the laughter. ${victim} almost drops.`,
              `Something... happens near ${gassyPlayer}. The smell hits ${victim} like a wall. ${pronouns(victim).Sub} ${pronouns(victim).sub === 'they' ? 'gag' : 'gags'} and nearly lets go.`,
            ]);
            fatigue[victim] += 0.02; // distraction penalty
            phaseResult.events.push({ type: 'bs-tree-fart', text: dTxt, players: [gassyPlayer, victim], badgeText: 'DISTRACTION', badgeClass: 'orange' });
            allEvents.push({ type: 'bs-tree-fart', text: dTxt, players: [gassyPlayer, victim], phase: phase.id });
          }
        }
      }
    }

    // (Boathouse is now elimination — no return)

    // ── SURVIVAL ROLLS (all phases use the same base formula + phase-specific fatigue from above) ──
    // Re-filter standing since mess-hall events may have added fatigue
    const phaseStanding2 = allCompetitors.filter(p => status[p] === 'standing');
    phaseStanding2.forEach(player => {
      const score = survivalRoll(player, phase, phaseIdx);
      const pr = pronouns(player);

      if (score < 0.30) {
        // Eliminated by Chef
        status[player] = 'eliminated';
        dropPhase[player] = phaseIdx;
        dropMethod[player] = 'chef';
        fatigue[player] += phase.fatigueCost;

        let elimTxt;
        if (phase.id === 'canoe-hold') {
          elimTxt = _rp([
            `${player}'s arms give out. The canoe crashes down. ${chef}: "DISMISSED."`,
            `${player} drops the canoe. Can't hold it anymore. ${chef} doesn't even look surprised.`,
          ]);
        } else if (phase.id === 'obstacle-course') {
          elimTxt = _rp([
            `${player} face-plants in the mud pit. Can't get up. ${chef}: "Medic! ...Actually, just leave ${pr.obj} there."`,
            `${player} gets stuck on the wall. Slides down. Twice. Three times. ${chef}: "OUT."`,
          ]);
          if (Math.random() < 0.25) {
            gs.lingeringInjuries[player] = { ep: epNum, duration: 1, type: 'obstacle-course', penalty: 0.3 + Math.random() * 0.3 };
          }
        } else if (phase.id === 'night-march') {
          elimTxt = _rp([
            `${player} falls asleep mid-march. Just... stops walking and lies down. ${chef}: "WAKE UP. ...Too late. DISMISSED."`,
            `${player}'s eyes close. ${pr.Sub} walk${pr.sub === 'they' ? '' : 's'} into a tree. ${chef}: "That's it for you, soldier."`,
          ]);
        } else if (phase.id === 'tree-hang') {
          elimTxt = _rp([
            `${player} drops from the tree. Lands hard. ${chef}: "And then there were fewer."`,
            `${player}'s grip slips. Falls. The ground wins. ${chef} makes a note on ${pr.posAdj} clipboard.`,
          ]);
        } else if (phase.id === 'dance-drill') {
          elimTxt = _rp([
            `${player} trips over ${pr.posAdj} own feet for the fourth time. ${chef}: "You call that DANCING?! OUT."`,
            `${player} can't keep up. ${chef}'s choreography broke ${pr.obj}. "DISMISSED, two left feet."`,
          ]);
        } else {
          elimTxt = _rp([
            `${chef}: "${player}, you're done. Hit the showers." ${player} drops. No argument left.`,
            `${player} collapses. ${chef} blows the whistle. "DISMISSED, soldier."`,
          ]);
        }
        phaseResult.eliminated.push({ player, method: 'chef', text: elimTxt });
        phaseResult.events.push({ type: 'bs-eliminated', text: elimTxt, players: [player], badgeText: 'DISMISSED', badgeClass: 'red' });
        allEvents.push({ type: 'bs-eliminated', text: elimTxt, players: [player], phase: phase.id });
      } else {
        // Survived
        fatigue[player] += phase.fatigueCost * (score < 0.5 ? 1.2 : 0.8);
        phaseResult.survivors.push(player);

        // Phase-specific survival narrative
        let survTxt, survBadge, survClass;
        if (score > 0.7) {
          survBadge = 'DOMINATED'; survClass = 'green';
          if (phase.id === 'canoe-hold') {
            survTxt = _rp([
              `${player} holds the canoe like it weighs nothing. ${chef} sits on it. Still nothing. Impressive.`,
              `Hours in. ${player}'s arms don't shake. ${chef}: "Are you even human?"`,
            ]);
          } else if (phase.id === 'obstacle-course') {
            survTxt = _rp([
              `${player} FLIES through the obstacle course. Under the wire, over the wall, through the mud — in 47 seconds. ${chef} checks the stopwatch twice.`,
              `${player} clears every obstacle like ${pronouns(player).sub} ${pronouns(player).sub === 'they' ? 'train' : 'trains'} for this. ${chef}: "...Not bad, soldier."`,
            ]);
          } else if (phase.id === 'tree-hang') {
            survTxt = _rp([
              `${player} hangs from the tree like ${pronouns(player).sub} could do this all day. Blood rushing to ${pronouns(player).posAdj} head. Doesn't care.`,
              `Upside down. Smiling. ${player} isn't going anywhere. The tree might give out before ${pronouns(player).sub} ${pronouns(player).sub === 'they' ? 'do' : 'does'}.`,
            ]);
          } else {
            survTxt = _rp([
              `${player} crushes ${phase.name}. Doesn't even look tired. ${chef} nods — almost impressed.`,
              `${player} makes it look easy. The others are suffering. ${pronouns(player).Sub} ${pronouns(player).sub === 'they' ? 'aren\'t' : 'isn\'t'}.`,
            ]);
          }
        } else if (score > 0.5) {
          survBadge = 'CLEARED'; survClass = 'green';
          if (phase.id === 'canoe-hold') {
            survTxt = _rp([
              `${player} holds steady. Arms aching but locked. The canoe isn't going anywhere.`,
              `${player} keeps the canoe up. Not comfortable, but not struggling. ${chef}: "Acceptable."`,
            ]);
          } else if (phase.id === 'tree-hang') {
            survTxt = _rp([
              `${player} hangs on. Face getting red, blood rushing. But ${pronouns(player).posAdj} grip is solid.`,
              `${player} is still up there. Not smiling, not panicking. Just hanging. ${chef} notes it.`,
            ]);
          } else if (phase.id === 'night-march') {
            survTxt = _rp([
              `${player} marches on. Tired but awake. Putting one foot in front of the other.`,
              `${player} keeps pace with the group. Not leading, not falling behind. Survival mode.`,
            ]);
          } else if (phase.id === 'dance-drill') {
            survTxt = _rp([
              `${player} follows the choreography. A few stumbles but nothing ${chef} can call out.`,
              `${player} keeps up with the drill. Not graceful, but functional. ${chef}: "Acceptable."`,
            ]);
          } else {
            survTxt = _rp([
              `${player} gets through ${phase.name}. Solid. ${chef}: "Acceptable."`,
              `${player} survives ${phase.name}. Not the best, not the worst. Still standing.`,
            ]);
          }
        } else {
          survBadge = 'STRUGGLING'; survClass = 'orange';
          if (phase.id === 'canoe-hold') {
            survTxt = _rp([
              `${player}'s arms are trembling. The canoe dips. Recovers. Dips again. "I'm fine," ${pronouns(player).sub} ${pronouns(player).sub === 'they' ? 'gasp' : 'gasps'}. ${pronouns(player).Sub} ${pronouns(player).sub === 'they' ? 'are' : 'is'} not fine.`,
              `${player} is barely holding on. Every second is agony. But ${pronouns(player).sub} won't quit.`,
            ]);
          } else if (phase.id === 'tree-hang') {
            survTxt = _rp([
              `${player} is slipping. Fingers going white. Blood pounding in ${pronouns(player).posAdj} head. Every second is a fight against gravity.`,
              `${player}'s grip keeps sliding. ${pronouns(player).Sub} readjust${pronouns(player).sub === 'they' ? '' : 's'}, cling${pronouns(player).sub === 'they' ? '' : 's'} tighter. "Just... a little... longer."`,
              `${player} is upside down and fading. The branch creaks. ${chef}: "You look a little green, soldier."`,
            ]);
          } else if (phase.id === 'night-march') {
            survTxt = _rp([
              `${player} is sleepwalking. Literally. Eyes half-closed, feet dragging. But still moving. Barely.`,
              `${player}'s body is there. ${pronouns(player).PosAdj} mind left three hours ago. But ${pronouns(player).sub} keep${pronouns(player).sub === 'they' ? '' : 's'} walking.`,
            ]);
          } else if (phase.id === 'dance-drill') {
            survTxt = _rp([
              `${player} is a beat behind on every move. Tripping, stumbling, but somehow still in formation.`,
              `${player} can barely keep up. ${chef}: "THAT'S what you call dancing?!" But ${pronouns(player).sub} ${pronouns(player).sub === 'they' ? 'don\'t' : 'doesn\'t'} stop.`,
            ]);
          } else if (phase.id === 'obstacle-course') {
            survTxt = _rp([
              `${player} crawls through the mud. Gets stuck on the wall. Makes it over on the third try. Barely under the time limit.`,
              `${player} is covered in mud, scraped up, gasping. But ${pronouns(player).sub} crossed the finish line. That's all that matters.`,
            ]);
          } else {
            survTxt = _rp([
              `${player} barely makes it through ${phase.name}. Arms shaking. Eyes glazed. But still standing.`,
              `${player} survives — just. ${chef} watches ${pronouns(player).obj} wobble. "Don't pass out on MY course."`,
            ]);
          }
        }
        phaseResult.events.push({ type: score > 0.5 ? 'bs-strong' : 'bs-struggling', text: survTxt, players: [player], badgeText: survBadge, badgeClass: survClass });
        allEvents.push({ type: score > 0.5 ? 'bs-strong' : 'bs-struggling', text: survTxt, players: [player], phase: phase.id });
      }
    });

    // ── TREE HANG SUDDEN DEATH — if 2+ survive the tree hang, keep going until 1 remains ──
    if (phase.id === 'tree-hang') {
      let treeRemaining = allCompetitors.filter(p => status[p] === 'standing');
      let suddenDeathRound = 0;
      while (treeRemaining.length > 1 && suddenDeathRound < 10) {
        suddenDeathRound++;
        // Each round, every remaining player gets a harder survival check
        const sdFatigue = 0.04 + suddenDeathRound * 0.02; // gets brutally hard fast
        const sdIntro = suddenDeathRound === 1
          ? `Nobody's dropping. ${chef}: "We'll be here ALL DAY if we have to." The hang continues.`
          : `Sudden death round ${suddenDeathRound}. The branch creaks. Someone has to fall.`;
        phaseResult.events.push({ type: 'bs-sudden-death', text: sdIntro, players: [], badgeText: `OVERTIME ${suddenDeathRound}`, badgeClass: 'gold' });
        allEvents.push({ type: 'bs-sudden-death', text: sdIntro, players: [], phase: phase.id });

        // Each player rolls — lowest score drops
        const sdScores = treeRemaining.map(p => {
          const s = pStats(p);
          return {
            player: p,
            score: s.endurance * 0.04 + s.mental * 0.025 + (Math.random() + Math.random()) * 0.15 - fatigue[p] - sdFatigue
          };
        }).sort((a, b) => a.score - b.score);

        // Lowest score drops
        const dropper = sdScores[0];
        status[dropper.player] = 'eliminated';
        dropPhase[dropper.player] = phaseIdx;
        dropMethod[dropper.player] = 'chef';
        fatigue[dropper.player] += sdFatigue;

        const pr = pronouns(dropper.player);
        const dropTxt = _rp([
          `${dropper.player}'s grip finally gives. ${pr.Sub} drop${pr.sub === 'they' ? '' : 's'} from the tree. It's over for ${pr.obj}.`,
          `${dropper.player} can't hold on. The fingers slip. The fall feels like it takes forever. ${chef}: "And then there ${treeRemaining.length - 1 === 1 ? 'was one' : 'were ' + (treeRemaining.length - 1)}.."`,
          `${dropper.player} falls. Not dramatic — just... done. The body gave out. ${chef} makes a note.`,
        ]);
        phaseResult.eliminated.push({ player: dropper.player, method: 'chef', text: dropTxt });
        phaseResult.events.push({ type: 'bs-tree-drop', text: dropTxt, players: [dropper.player], badgeText: 'DROPPED', badgeClass: 'red' });
        allEvents.push({ type: 'bs-tree-drop', text: dropTxt, players: [dropper.player], phase: phase.id });

        // Remaining players get fatigue
        treeRemaining = allCompetitors.filter(p => status[p] === 'standing');
        treeRemaining.forEach(p => { fatigue[p] += sdFatigue * 0.5; });

        // If 1 remains, they won
        if (treeRemaining.length === 1) {
          const winner = treeRemaining[0];
          const winTxt = _rp([
            `${winner} is the last one hanging. ${chef} blows the whistle. "WE HAVE A WINNER." ${winner} drops from the tree — victorious.`,
            `It's over. ${winner} hangs alone. The last recruit standing. ${chef} salutes from below. The boot camp is done.`,
            `${winner} can barely see straight. Blood rushing to ${pronouns(winner).posAdj} head. But ${pronouns(winner).sub} ${pronouns(winner).sub === 'they' ? 'are' : 'is'} the last one up. That's all that matters.`,
          ]);
          phaseResult.events.push({ type: 'bs-tree-winner', text: winTxt, players: [winner], badgeText: 'LAST ONE STANDING', badgeClass: 'gold' });
          allEvents.push({ type: 'bs-tree-winner', text: winTxt, players: [winner], phase: phase.id });
          if (isMerged) {
            immunityWinner = winner;
            challengeOver = true;
          }
        }
      }
    }

    // ── DEFIANCE — any bold player can defy, max 1 per phase ──
    if (!boathouseTriggered) {
      const DEFIANCE_ARCHETYPES = ['villain','chaos-agent','hothead','schemer'];
      // First pass: all eligible rebels
      const allEligible = allCompetitors.filter(p => {
        if (status[p] !== 'standing') return false;
        const arch = players.find(pl => pl.name === p)?.archetype || '';
        return DEFIANCE_ARCHETYPES.includes(arch) && defianceCheck(p, phaseIdx);
      });
      // Apply cooldown: skip players who defied last phase, unless they're the only option
      const defianceCandidates = allEligible.length > 1
        ? allEligible.filter(p => defiancePerPlayer[p]?.lastPhase !== phaseIdx - 1)
        : allEligible;

      if (defianceCandidates.length) {
        // Weighted random pick — boldness matters but doesn't guarantee selection
        const rebel = defianceCandidates.length === 1 ? defianceCandidates[0]
          : defianceCandidates[Math.floor(Math.random() * defianceCandidates.length)];

        if (!defiancePerPlayer[rebel]) defiancePerPlayer[rebel] = { count: 0, lastPhase: -1 };
        defiancePerPlayer[rebel].count++;
        defiancePerPlayer[rebel].lastPhase = phaseIdx;
        const pCount = defiancePerPlayer[rebel].count;
        fatigue[rebel] += 0.02;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[rebel] = (gs.popularity[rebel] || 0) + 1; // defying chef = entertaining rebel edit
        // Track the most defiant player overall for the defiant label
        if (!defiantPlayer || (defiancePerPlayer[rebel]?.count || 0) > (defiancePerPlayer[defiantPlayer]?.count || 0)) {
          defiantPlayer = rebel;
        }
        defianceCount = Math.max(defianceCount, pCount);

        const pr = pronouns(rebel);
        let defianceTxt;
        if (pCount === 1) {
          defianceTxt = _rp([
            `${rebel} mutters something under ${pr.posAdj} breath. ${chef}: "WHAT WAS THAT?! Twenty pushups. NOW."`,
            `"This is stupid." ${rebel} says it loud enough for everyone to hear. ${chef}: "PUSHUPS. TWENTY. GO."`,
            `${rebel} rolls ${pr.posAdj} eyes at ${chef}'s orders. ${chef} catches it. "Something FUNNY?! DROP AND GIVE ME TWENTY."`,
            `"Yes, MASTER CHIEF." ${rebel}'s tone drips with sarcasm. ${chef} glares. "WATCH IT, soldier."`,
          ]);
        } else if (pCount === 2) {
          defianceTxt = _rp([
            `${rebel} turns off the music mid-drill. Dead silence. ${chef}: "You just earned yourself FIFTY LAPS."`,
            `${rebel} sits down in the middle of the course. "Make me." ${chef} is turning red.`,
            `"Yes, MASTER CHIEF." ${rebel}'s sarcasm could melt steel. ${chef}: "LAPS. FIFTY. NOW."`,
            `${rebel} does the pushups in slow motion, staring ${chef} dead in the eyes. ${chef}: "FASTER." ${rebel}: "No."`,
          ]);
          fatigue[rebel] += 0.02;
        } else {
          // 3rd act → boathouse = ELIMINATED
          defianceTxt = _rp([
            `${rebel} gets in ${chef}'s face. "What are you gonna do about it?" ${chef}: "BOATHOUSE. NOW." ${rebel} is escorted off the field. Done.`,
            `${rebel} kisses ${chef} on the nose after finishing pushups. ${chef}'s eye twitches. "You're DONE. Boathouse. NOW."`,
            `"I'm done listening to you." ${rebel} drops the equipment. ${chef} goes dead quiet. "Boathouse. Go." ${rebel} is out.`,
          ]);
          boathouseTriggered = true;
          status[rebel] = 'eliminated';
          dropPhase[rebel] = phaseIdx;
          dropMethod[rebel] = 'boathouse';
          phaseResult.eliminated.push({ player: rebel, method: 'boathouse', text: defianceTxt });
        }

        phaseResult.defianceEvents.push({ type: 'bs-defiance', text: defianceTxt, players: [rebel], badgeText: 'INSUBORDINATION', badgeClass: 'gold' });
        allEvents.push({ type: 'bs-defiance', text: defianceTxt, players: [rebel], phase: phase.id, count: pCount });

        // Tribe reaction
        allCompetitors.filter(p => p !== rebel && status[p] === 'standing').forEach(m => {
          const mArch = players.find(pl => pl.name === m)?.archetype || '';
          if (['villain','chaos-agent','hothead'].includes(mArch)) addBond(m, rebel, 0.15);
          else if (['loyal-soldier','strategist'].includes(mArch)) addBond(m, rebel, -0.15);
        });
      }
    }

    // ── BELL QUIT CHECK (between phases, not after last phase) ──
    if (phaseIdx < PHASES.length - 1) {
      const standingAfterPhase = allCompetitors.filter(p => status[p] === 'standing');
      standingAfterPhase.forEach(player => {
        if (quitCheck(player)) {
          status[player] = 'quit';
          dropPhase[player] = phaseIdx;
          dropMethod[player] = 'quit';

          // Social cost
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[player] = (gs.popularity[player] || 0) - 2; // quit boot camp = quitter edit
          allCompetitors.filter(p => p !== player && status[p] === 'standing' && (!isMerged ? tribeOf[p] === tribeOf[player] : true)).forEach(tm => {
            addBond(tm, player, -0.3);
          });

          const pr = pronouns(player);
          const txt = _rp([
            `${player} walks to the dock. Rings the bell. Doesn't look back. ${chef}: "There's always one."`,
            `"I can't feel my arms." ${player} drops everything and walks to the bell. RING. It's over for ${pr.obj}.`,
            `${player} is done. The walk to the bell feels longer than any obstacle course. RING. "I'm out."`,
          ]);
          phaseResult.quit.push({ player, text: txt });
          phaseResult.events.push({ type: 'bs-quit', text: txt, players: [player], badgeText: 'RANG THE BELL', badgeClass: 'red' });
          allEvents.push({ type: 'bs-quit', text: txt, players: [player], phase: phase.id });

          // Camp event for quitting
          const ck = isMerged ? campKey : tribeOf[player];
          if (!ep.campEvents[ck]) ep.campEvents[ck] = { pre: [], post: [] };
          ep.campEvents[ck].post.push({
            type: 'bsQuit', players: [player],
            text: `${player} rang the bell. The tribe remembers quitters.`,
            consequences: 'Popularity -2. Bond -0.3 with remaining teammates.', badgeText: 'QUITTER', badgeClass: 'red'
          });
        }
      });
    }

    // ── INTER-PHASE SOCIAL EVENTS ──
    if (phaseIdx < PHASES.length - 1) {
      const standingNow = allCompetitors.filter(p => status[p] === 'standing');
      let socialFired = 0;
      let _raidInstigator = null, _raidAccomplice = null;

      // Pranking — only villains, chaos agents, hotheads, schemers prank
      const PRANK_ARCHETYPES = ['villain','chaos-agent','hothead','schemer'];
      if (socialFired < 8) {
        const bullies = standingNow.filter(p => {
          const arch = players.find(pl => pl.name === p)?.archetype || '';
          if (!PRANK_ARCHETYPES.includes(arch)) return false;
          const s = pStats(p);
          return s.boldness * 0.06 + (10 - s.temperament) * 0.04 > 0.4 + Math.random() * 0.2;
        });
        if (bullies.length) {
          const bully = bullies[Math.floor(Math.random() * bullies.length)];
          const victims = standingNow.filter(p => p !== bully && getBond(bully, p) < 1 && !_prankedBefore.has(p));
          if (victims.length) {
            const victim = victims[Math.floor(Math.random() * victims.length)];
            _prankedBefore.add(victim);
            addBond(victim, bully, -0.5);
            if (!resentment[victim]) resentment[victim] = { bully, count: 0 };
            if (resentment[victim].bully === bully) resentment[victim].count++;
            else resentment[victim] = { bully, count: 1 };
            prankLog.push({ bully, victim, phase: phase.id });

            // Tribe reactions
            standingNow.filter(p => p !== bully && p !== victim).forEach(m => {
              const mArch = players.find(pl => pl.name === m)?.archetype || '';
              if (['villain','schemer'].includes(mArch)) addBond(m, bully, 0.1);
              else if (['hero','loyal-soldier'].includes(mArch)) addBond(m, bully, -0.2);
            });

            const txt = _rp([
              `${bully} fills ${victim}'s canteen with kitchen grease. ${victim} drinks it. The look on ${pronouns(victim).posAdj} face says everything.`,
              `${bully} hides ${victim}'s shoes before the next phase. ${victim} has to run barefoot. Not laughing.`,
              `Someone put peanut butter in ${victim}'s bunk in the shape of a smiley face. Everyone knows who.`,
              `${bully} makes s'mores out of ${victim}'s underwear. ${victim} storms out demanding to know who did it. ${bully} doesn't even try to hide the grin.`,
              `${victim} finds ${pronouns(victim).posAdj} sleeping bag tied in knots. ${bully} is whistling nearby. Coincidence? No.`,
              `${bully} puts hot sauce in ${victim}'s water bottle. ${victim} takes a sip mid-phase. The scream echoes across camp.`,
              `${bully} trips ${victim} on the way back from the break. "Oops." ${victim} doesn't think it's funny.`,
            ]);
            const evt = { type: 'bs-prank', text: txt, players: [bully, victim], badgeText: 'PRANK', badgeClass: 'orange' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            socialFired++;
          }
        }
      }

      // Cracking under pressure (max once per person across the whole challenge)
      if (socialFired < 8) {
        const cracking = standingNow.filter(p => {
          const s = pStats(p);
          return !_crackedBefore.has(p) && fatigue[p] > 0.03 && Math.random() < (10 - s.mental) * 0.05 + fatigue[p] * 0.5;
        });
        if (cracking.length) {
          const cracker = cracking[Math.floor(Math.random() * cracking.length)];
          _crackedBefore.add(cracker);
          const comforters = standingNow.filter(p => p !== cracker);
          const comforter = comforters.length ? comforters.reduce((best, p) => pStats(p).loyalty > pStats(best).loyalty ? p : best, comforters[0]) : null;
          if (comforter) {
            addBond(cracker, comforter, 0.3);
            if (!gs.popularity) gs.popularity = {};
            gs.popularity[comforter] = (gs.popularity[comforter] || 0) + 1; // comforting a cracking recruit = empathy hero
            const txt = `${cracker} breaks down between phases. Tears. Frustration. ${comforter} sits next to ${pronouns(cracker).obj}. "We're almost through this."`;
            const evt = { type: 'bs-cracking', text: txt, players: [cracker, comforter], badgeText: 'CRACKING', badgeClass: 'blue' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            // Romance spark — comforting someone vulnerable is intimate
            if (seasonConfig.romance === 'enabled') {
              _challengeRomanceSpark(comforter, cracker, ep, null, null, null, 'comforting during breakdown');
            }
            socialFired++;
          }
        }
      }

      // Unexpected respect between rivals
      if (socialFired < 8 && phaseResult.survivors.length >= 2) {
        const rivalPairs = [];
        for (let i = 0; i < phaseResult.survivors.length; i++) {
          for (let j = i + 1; j < phaseResult.survivors.length; j++) {
            const b = getBond(phaseResult.survivors[i], phaseResult.survivors[j]);
            if (b < 0) rivalPairs.push([phaseResult.survivors[i], phaseResult.survivors[j], b]);
          }
        }
        if (rivalPairs.length && Math.random() < 0.25) {
          const pair = rivalPairs[Math.floor(Math.random() * rivalPairs.length)];
          addBond(pair[0], pair[1], 0.2);
          const txt = `${pair[0]} and ${pair[1]} both survived ${phase.name}. A nod across the field. Not friendship — but something.`;
          const evt = { type: 'bs-respect', text: txt, players: [pair[0], pair[1]], badgeText: 'RESPECT', badgeClass: 'green' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });
          // Romance spark — rivals finding respect under pressure
          if (seasonConfig.romance === 'enabled') {
            _challengeRomanceSpark(pair[0], pair[1], ep, null, null, null, 'rivals earning mutual respect under fire');
          }
          socialFired++;
        }
      }

      // Chef's spotlight
      if (socialFired < 8 && Math.random() < 0.35) {
        const target = standingNow[Math.floor(Math.random() * standingNow.length)];
        const s = pStats(target);
        const praised = s[phase.primary] * 0.08 + Math.random() * 0.2 > 0.5;
        if (praised) {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[target] = (gs.popularity[target] || 0) + 1; // chef praised = standout recruit
          const txt = `${chef} stops in front of ${target}. Stares. "Not bad, soldier. Not bad at all." High praise from the Master Chief.`;
          const evt = { type: 'bs-chef-praise', text: txt, players: [target], badgeText: 'COMMENDED', badgeClass: 'gold' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });
        } else {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[target] = (gs.popularity[target] || 0) - 1; // chef roasted = embarrassing edit
          const txt = _rp([
            `${chef} singles out ${target}. "THAT'S what you call effort?! My GRANDMOTHER moves faster. And she's DEAD."`,
            `"${target}! You call that a pushup?! I've seen JELLYFISH with more backbone!"`,
          ]);
          const evt = { type: 'bs-chef-mockery', text: txt, players: [target], badgeText: 'ROASTED', badgeClass: 'orange' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });
        }
        socialFired++;
      }

      // Bonding over misery
      if (socialFired < 8 && Math.random() < 0.3) {
        const exhausted = standingNow.filter(p => fatigue[p] > 0.02);
        if (exhausted.length >= 2) {
          const sameTribe = !isMerged ? exhausted.filter(p => tribeOf[p] === tribeOf[exhausted[0]]) : exhausted;
          if (sameTribe.length >= 2) {
            const a = sameTribe[0], b = sameTribe[1];
            addBond(a, b, 0.3);
            const txt = _rp([
              `${a} and ${b} sit together in the dirt. Everything hurts. "We're going to die here." "At least we're dying together."`,
              `${a} shares ${pronouns(a).posAdj} last sip of water with ${b}. No words. Just survival.`,
            ]);
            const evt = { type: 'bs-misery-bond', text: txt, players: [a, b], badgeText: 'BROTHERS IN ARMS', badgeClass: 'teal' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            // Romance spark — suffering together is intimate
            if (seasonConfig.romance === 'enabled') {
              _challengeRomanceSpark(a, b, ep, null, null, null, 'bonding through shared suffering');
            }
            socialFired++;
          }
        }
      }

      // Strategic whisper — can create real alliances or side deals
      if (socialFired < 8 && Math.random() < 0.35) {
        // Include eliminated/quit players too — they're still at camp, still scheming
        const allPresent = allCompetitors.filter(p => status[p] === 'standing' || status[p] === 'eliminated' || status[p] === 'quit');
        const strategists = allPresent.filter(p => pStats(p).strategic * 0.07 + Math.random() * 0.1 > 0.4);
        if (strategists.length) {
          const strategist = strategists[Math.floor(Math.random() * strategists.length)];
          const sameTribe = allPresent.filter(p => p !== strategist && (!isMerged ? tribeOf[p] === tribeOf[strategist] : true));
          if (sameTribe.length >= 2) {
            const ally = sameTribe.reduce((best, p) => getBond(strategist, p) > getBond(strategist, best) ? p : best, sameTribe[0]);
            const target = sameTribe.filter(p => p !== ally).reduce((worst, p) => getBond(strategist, p) < getBond(strategist, worst) ? p : worst, sameTribe.filter(p => p !== ally)[0]);

            if (ally && target) {
              // Check if they should form a real alliance
              const allianceChance = getBond(strategist, ally) * 0.05 + pStats(strategist).strategic * 0.04 + pStats(ally).strategic * 0.02 + Math.random() * 0.15;
              const existingAlliance = gs.namedAlliances?.find(a => a.active && a.members.includes(strategist) && a.members.includes(ally));

              if (allianceChance > 0.5 && !existingAlliance && typeof formAlliances === 'function' && status[strategist] === 'standing' && status[ally] === 'standing') {
                // Form a real alliance
                addBond(strategist, ally, 0.4);
                const allianceName = typeof nameNewAlliance === 'function' ? nameNewAlliance(2) : 'The Pact';
                if (!gs.namedAlliances) gs.namedAlliances = [];
                gs.namedAlliances.push({
                  name: allianceName, members: [strategist, ally], formedEp: epNum,
                  active: true, betrayals: [], quits: 0, trust: 1.0
                });
                const txt = _rp([
                  `${strategist} and ${ally} find each other during the break. What starts as strategy becomes something more. "We ride together from here." An alliance is born: ${allianceName}.`,
                  `Between phases, ${strategist} makes ${pronouns(strategist).posAdj} move. "You and me. Final four. We take out ${target} first." ${ally} extends a hand. ${allianceName} is formed.`,
                  `The boot camp breaks people — but it also bonds them. ${strategist} and ${ally} shake on it during the chaos. ${allianceName}. It starts now.`,
                  `"Nobody else is thinking about the game right now. We should be." ${strategist} pulls ${ally} aside. By the time they're done talking, ${allianceName} exists.`,
                ]);
                const evt = { type: 'bs-alliance-formed', text: txt, players: [strategist, ally], badgeText: 'ALLIANCE FORMED', badgeClass: 'green' };
                socialEvents.push({ phase: phaseIdx, ...evt });
                allEvents.push({ ...evt, phase: phase.id });

                const ck2 = isMerged ? campKey : tribeOf[strategist];
                if (!ep.campEvents[ck2]) ep.campEvents[ck2] = { pre: [], post: [] };
                ep.campEvents[ck2].post.push({
                  type: 'bsAllianceFormed', players: [strategist, ally],
                  text: `${allianceName} was born during boot camp. ${strategist} and ${ally} bonded under pressure and made it official.`,
                  consequences: `Alliance formed. Bond +0.4. Target: ${target}.`, badgeText: 'NEW ALLIANCE', badgeClass: 'green'
                });
              } else {
                // Regular whisper / side deal
                addBond(strategist, ally, 0.2);
                const txt = _rp([
                  `Between phases, ${strategist} pulls ${ally} aside. "If we lose — ${target} goes. You in?" ${ally} nods slowly.`,
                  `${strategist} whispers to ${ally} during the break. "We need to talk about ${target}." The game never stops.`,
                  `While everyone rests, ${strategist} is working. ${pronouns(strategist).Sub} corner${pronouns(strategist).sub === 'they' ? '' : 's'} ${ally}. "After this is over, we vote together. Deal?"`,
                  `${strategist} catches ${ally}'s eye during the break. A nod toward the trees. They slip away from the group. When they come back, something has been decided.`,
                  `"${target} is the weakest link." ${strategist} says it casually, but ${ally} knows it's a pitch. "...Yeah. Okay. ${target}."`,
                ]);
                const evt = { type: 'bs-whisper', text: txt, players: [strategist, ally], badgeText: 'STRATEGY', badgeClass: 'blue' };
                socialEvents.push({ phase: phaseIdx, ...evt });
                allEvents.push({ ...evt, phase: phase.id });

                const ck2 = isMerged ? campKey : tribeOf[strategist];
                if (!ep.campEvents[ck2]) ep.campEvents[ck2] = { pre: [], post: [] };
                ep.campEvents[ck2].post.push({
                  type: 'bsWhisper', players: [strategist, ally],
                  text: `${strategist} made a deal with ${ally} during boot camp. The game was played even while ${chef} was watching.`,
                  consequences: 'Bond +0.2. Pre-tribal alignment.', badgeText: 'DEAL', badgeClass: 'blue'
                });
              }
              socialFired++;
            }
          }
        }
      }

      // Rivalry intensifies — two players with low bond snap at each other during a break
      if (socialFired < 8 && Math.random() < 0.25) {
        const rivalPairs2 = [];
        for (let i = 0; i < standingNow.length; i++) {
          for (let j = i + 1; j < standingNow.length; j++) {
            const b = getBond(standingNow[i], standingNow[j]);
            if (b < -1) rivalPairs2.push([standingNow[i], standingNow[j], b]);
          }
        }
        if (rivalPairs2.length) {
          const pair = rivalPairs2[Math.floor(Math.random() * rivalPairs2.length)];
          addBond(pair[0], pair[1], -0.3);
          const txt = _rp([
            `${pair[0]} blames ${pair[1]} for slowing the team down. ${pair[1]}: "At least I'm still STANDING." It nearly becomes physical.`,
            `"Stay out of my way next phase." ${pair[0]} gets in ${pair[1]}'s face during the break. ${pair[1]} doesn't back down. Teammates have to separate them.`,
            `${pair[0]} and ${pair[1]} are at each other's throats. The exhaustion has burned away whatever filter they had left.`,
          ]);
          const evt = { type: 'bs-rivalry', text: txt, players: [pair[0], pair[1]], badgeText: 'TENSION', badgeClass: 'red' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });

          const ck3 = isMerged ? campKey : tribeOf[pair[0]];
          if (!ep.campEvents[ck3]) ep.campEvents[ck3] = { pre: [], post: [] };
          ep.campEvents[ck3].post.push({
            type: 'bsRivalry', players: [pair[0], pair[1]],
            text: `${pair[0]} and ${pair[1]} nearly fought during boot camp. The rivalry is public now.`,
            consequences: 'Bond -0.3. Tribal ammunition.', badgeText: 'FIGHT', badgeClass: 'red'
          });
          socialFired++;
        }
      }

      // Motivational speech — high loyalty player rallies the troops
      if (socialFired < 8 && Math.random() < 0.2) {
        const leaders = standingNow.filter(p => pStats(p).loyalty * 0.06 + pStats(p).temperament * 0.04 > 0.55 + Math.random() * 0.2);
        if (leaders.length) {
          const leader = leaders[Math.floor(Math.random() * leaders.length)];
          const tribe = standingNow.filter(p => p !== leader && (!isMerged ? tribeOf[p] === tribeOf[leader] : true));
          tribe.forEach(p => { addBond(p, leader, 0.15); fatigue[p] -= 0.01; });
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[leader] = (gs.popularity[leader] || 0) + 1; // rallied recruits = natural leader edit
          const txt = _rp([
            `${leader} stands up during the break. "We're not quitting. None of us. We're finishing this TOGETHER." The tribe rallies.`,
            `"Look at us. We're still here. ${chef} threw everything at us and we're STILL HERE." ${leader}'s speech hits different when everyone is broken.`,
            `${leader} gathers the team. "One more phase. That's it. We can do one more." Somehow, they believe ${pronouns(leader).obj}.`,
          ]);
          const evt = { type: 'bs-rally', text: txt, players: [leader, ...tribe.slice(0, 3)], badgeText: 'RALLY', badgeClass: 'green' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });
          socialFired++;
        }
      }

      // Confessional moment — player reveals true feelings about the challenge
      if (socialFired < 8 && Math.random() < 0.3) {
        const confPlayer = standingNow[Math.floor(Math.random() * standingNow.length)];
        const s = pStats(confPlayer);
        const pr = pronouns(confPlayer);
        const arch = players.find(p => p.name === confPlayer)?.archetype || '';
        let confTxt;
        if (fatigue[confPlayer] > 0.1) {
          confTxt = _rp([
            `[Confessional] ${confPlayer}: "I've never been this tired in my life. My body is screaming at me to quit. But I'm not giving ${chef} the satisfaction."`,
            `[Confessional] ${confPlayer}: "Every muscle hurts. I can't feel my legs. But if I ring that bell... I'm the one who gave up. I can't live with that."`,
          ]);
        } else if (['villain','schemer'].includes(arch)) {
          confTxt = _rp([
            `[Confessional] ${confPlayer}: "Everyone's falling apart and I'm just... watching. Taking notes. Who cracks, who quits, who's useful. This boot camp is a goldmine."`,
            `[Confessional] ${confPlayer}: "While they're all crying about how hard this is, I'm planning who goes home next. ${chef} is doing my job for me."`,
          ]);
        } else if (['hero','loyal-soldier'].includes(arch)) {
          confTxt = _rp([
            `[Confessional] ${confPlayer}: "I'm not doing this for immunity. I'm doing it because my team needs me. That's it. That's the whole reason."`,
            `[Confessional] ${confPlayer}: "Quitting isn't in my vocabulary. Never was. Never will be. ${chef} can throw whatever ${pr.sub} want${pr.sub === 'they' ? '' : 's'} at me."`,
          ]);
        } else {
          confTxt = _rp([
            `[Confessional] ${confPlayer}: "(Sigh) I don't even know why I'm still doing this. Oh wait — because the alternative is getting voted out. Right."`,
            `[Confessional] ${confPlayer}: "Is it weird that I'm kind of... enjoying this? Like, it's terrible. But I feel alive? ...Don't tell anyone I said that."`,
          ]);
        }
        const evt = { type: 'bs-confessional', text: confTxt, players: [confPlayer], badgeText: 'CONFESSIONAL', badgeClass: 'blue' };
        socialEvents.push({ phase: phaseIdx, ...evt });
        allEvents.push({ ...evt, phase: phase.id });
        socialFired++;
      }

      // Alliance crack — teammates question each other's commitment
      if (socialFired < 8 && Math.random() < 0.2) {
        const allianceMembers = standingNow.filter(p => {
          const alliances = gs.namedAlliances?.filter(a => a.active && a.members.includes(p)) || [];
          return alliances.length > 0;
        });
        if (allianceMembers.length >= 2) {
          const a = allianceMembers[0];
          const aAlliance = gs.namedAlliances?.find(al => al.active && al.members.includes(a));
          if (aAlliance) {
            const b = allianceMembers.find(p => p !== a && aAlliance.members.includes(p));
            if (b && fatigue[a] > 0.02 && fatigue[b] > 0.02) {
              const txt = _rp([
                `${a} watches ${b} struggle. "If you quit, that's on ME at tribal." ${b}: "I'm NOT quitting." ${a}: "You better not." The alliance is fraying under pressure.`,
                `"Are you even trying?" ${a} hisses at ${b} during the break. They're in the same alliance but the stress is cracking everything.`,
                `${a}: "I'm carrying this alliance right now." ${b}: "You're carrying?! I'm the one who—" They stop when they realize others are listening.`,
                `The alliance that looked rock-solid at camp is wobbling. ${a} and ${b} can barely look at each other. Fatigue reveals the cracks.`,
              ]);
              addBond(a, b, -0.2);
              const evt = { type: 'bs-alliance-strain', text: txt, players: [a, b], badgeText: 'STRAIN', badgeClass: 'orange' };
              socialEvents.push({ phase: phaseIdx, ...evt });
              allEvents.push({ ...evt, phase: phase.id });
              socialFired++;
            }
          }
        }
      }

      // Eliminated/quit players can still participate in social events that aren't challenge-related
      const allPresent = allCompetitors.filter(p => status[p] !== 'boathouse'); // everyone at camp, even eliminated

      // Sideline commentary — eliminated player watches and reacts
      if (socialFired < 8 && Math.random() < 0.3) {
        const eliminated = allPresent.filter(p => status[p] === 'eliminated' || status[p] === 'quit');
        if (eliminated.length) {
          const commenter = eliminated[Math.floor(Math.random() * eliminated.length)];
          const standing = allPresent.filter(p => status[p] === 'standing');
          if (standing.length) {
            const target = standing[Math.floor(Math.random() * standing.length)];
            const b = getBond(commenter, target);
            const pr = pronouns(commenter);
            let txt;
            if (b >= 3) {
              txt = _rp([
                `From the sideline, ${commenter} cheers for ${target}. "Come on! You've GOT this!" The support is genuine.`,
                `${commenter} is out of the challenge but not out of the fight. ${pr.Sub} ${pr.sub === 'they' ? 'shout' : 'shouts'} encouragement at ${target} every chance ${pr.sub} get${pr.sub === 'they' ? '' : 's'}.`,
              ]);
              addBond(target, commenter, 0.1);
            } else if (b <= -1) {
              txt = _rp([
                `${commenter} watches ${target} struggle from the sideline. "This is the best entertainment I've had all day." No sympathy.`,
                `"DROP! QUIT! RING THE BELL!" ${commenter} is heckling ${target} from the sideline. ${chef}: "I didn't say you could talk, soldier." ${commenter}: "I'm already OUT."`,
              ]);
              addBond(target, commenter, -0.1);
            } else {
              txt = _rp([
                `${commenter} sits on the sideline, watching. Taking mental notes on who's strong, who's weak, who's about to break.`,
                `${commenter} is eliminated but ${pr.posAdj} eyes are active. Watching ${target}. Watching everyone. The game doesn't stop at the bell.`,
              ]);
            }
            const evt = { type: 'bs-sideline', text: txt, players: [commenter, target], badgeText: 'SIDELINE', badgeClass: 'blue' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            socialFired++;
          }
        }
      }

      // Sharing supplies — a player shares water/food with someone struggling
      if (socialFired < 8 && Math.random() < 0.25) {
        const givers = allPresent.filter(p => (status[p] === 'standing' || status[p] === 'eliminated') && pStats(p).loyalty * 0.06 + Math.random() * 0.1 > 0.4);
        const receivers = allPresent.filter(p => status[p] === 'standing' && fatigue[p] > 0.03);
        if (givers.length && receivers.length) {
          const giver = givers[Math.floor(Math.random() * givers.length)];
          const receiver = receivers.filter(p => p !== giver)[0];
          if (receiver) {
            addBond(receiver, giver, 0.3);
            fatigue[receiver] -= 0.01;
            const txt = _rp([
              `${giver} slips ${receiver} an extra water bottle. "Don't tell ${chef}." The small kindness means everything right now.`,
              `${giver} saves half ${pronouns(giver).posAdj} ration and gives it to ${receiver}. "${pronouns(receiver).Sub} need${pronouns(receiver).sub === 'they' ? '' : 's'} it more than me."`,
              `${giver} notices ${receiver} is fading. Without a word, ${pronouns(giver).sub} pass${pronouns(giver).sub === 'they' ? '' : 'es'} over ${pronouns(giver).posAdj} canteen. ${receiver} drinks. Nods. That's enough.`,
            ]);
            const evt = { type: 'bs-sharing', text: txt, players: [giver, receiver], badgeText: 'KINDNESS', badgeClass: 'green' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            if (seasonConfig.romance === 'enabled') {
              _challengeRomanceSpark(giver, receiver, ep, null, null, null, 'small kindness under pressure');
            }
            socialFired++;
          }
        }
      }

      // Food raid — a bold player convinces someone to raid Chef's supplies (phases 3+)
      const _raidRoll = Math.random();
      const _raidGate = socialFired < 8 && !foodRaidResult && phaseIdx >= 2;
      if (_raidGate && _raidRoll < 0.3) {
        const RAID_ARCHETYPES = ['villain','chaos-agent','hothead','schemer'];
        const raiders = allPresent.filter(p => {
          const arch = players.find(pl => pl.name === p)?.archetype || '';
          return status[p] === 'standing' && RAID_ARCHETYPES.includes(arch);
        });
        if (raiders.length) {
          const instigator = raiders[Math.floor(Math.random() * raiders.length)];
          _raidInstigator = instigator;
          const accomplices = allPresent.filter(p => p !== instigator && status[p] === 'standing' && (!isMerged ? tribeOf[p] === tribeOf[instigator] : true));
          if (accomplices.length) {
            const accomplice = accomplices.reduce((best, p) => getBond(instigator, p) > getBond(instigator, best) ? p : best, accomplices[0]);
            _raidAccomplice = accomplice;
            // Individual escape rolls — each raider rolls separately
            const sIns = pStats(instigator), sAcc = pStats(accomplice);
            const insScore = sIns.intuition * 0.03 + sIns.mental * 0.02 + sIns.boldness * 0.015 + sIns.strategic * 0.015 + Math.random() * 0.2;
            const accScore = sAcc.intuition * 0.03 + sAcc.mental * 0.02 + sAcc.boldness * 0.015 + sAcc.strategic * 0.015 + Math.random() * 0.2;
            const insCaught = insScore < 0.35;
            const accCaught = accScore < 0.35;

            if (!insCaught && !accCaught) {
              // Both escape — clean raid
              foodRaidResult = { success: true, caught: false };
              addBond(instigator, accomplice, 0.4);
              const tribe = allPresent.filter(p => (!isMerged ? tribeOf[p] === tribeOf[instigator] : true) && status[p] === 'standing');
              tribe.forEach(p => { addBond(p, instigator, 0.2); addBond(p, accomplice, 0.2); });
              const raidTxt = _rp([
                `Between phases, ${instigator} pulls ${accomplice} aside. "What if we raided ${chef}'s kitchen?" They sneak in. They load up. They get away clean.`,
                `${instigator} convinces ${accomplice} to break the rules. They raid ${chef}'s food supply while ${chef} tells war stories. The tribe feasts in secret.`,
                `"I'm starving. You?" ${instigator} grins at ${accomplice}. Twenty minutes later, they're back with armfuls of stolen food. The tribe eats well tonight.`,
              ]);
              const raidEvt = { type: 'food-raid-success', text: raidTxt, players: [instigator, accomplice], badgeText: 'CONTRABAND', badgeClass: 'green' };
              socialEvents.push({ phase: phaseIdx, ...raidEvt });
              allEvents.push({ ...raidEvt, phase: phase.id });

              // FEAST — always follows a successful raid
              const feastMembers = tribe.filter(p => p !== instigator && p !== accomplice);
              const sickPlayers = [];
              const feastLines = feastMembers.map(p => {
                const pr = pronouns(p);
                const eatRoll = pStats(p).boldness * 0.06 + Math.random() * 0.2;
                if (eatRoll > 0.6) {
                  // Overeater — might get sick
                  if (Math.random() < 0.35) {
                    sickPlayers.push(p);
                    return `${p} eats until ${pr.sub} can't move. Runs outside to throw up. Comes back pale. "...Worth it."`;
                  }
                  return `${p} loads up a plate. Then another. Then a third. No regrets.`;
                }
                if (eatRoll < 0.25) {
                  return `${p} eats carefully. Watches the door. "${chef} is going to find out." Nobody listens.`;
                }
                return `${p} eats gratefully. First real food in days.`;
              });
              if (feastLines.length) {
                const feastTxt = `The tribe feasts on stolen food. ${feastLines.join(' ')}`;
                const feastEvt = { type: 'bs-feast', text: feastTxt, players: [...tribe], badgeText: 'FEAST', badgeClass: 'green' };
                socialEvents.push({ phase: phaseIdx, ...feastEvt });
                allEvents.push({ ...feastEvt, phase: phase.id });
              }
              // Fatigue reduction — raiders get the most, feasters get less, sick players get penalty
              tribe.forEach(p => {
                if (sickPlayers.includes(p)) {
                  fatigue[p] += 0.03; // overate and threw up — worse off than before
                } else if (p === instigator || p === accomplice) {
                  fatigue[p] = Math.max(0, fatigue[p] - 0.07); // raiders risked everything
                } else {
                  fatigue[p] = Math.max(0, fatigue[p] - 0.03); // feasters just ate
                }
              });

              const ck = isMerged ? campKey : tribeOf[instigator];
              if (!ep.campEvents[ck]) ep.campEvents[ck] = { pre: [], post: [] };
              ep.campEvents[ck].post.push({
                type: 'bsFoodRaid', players: [instigator, accomplice],
                text: `${instigator} and ${accomplice} raided ${chef}'s kitchen. Partners in crime.`,
                consequences: 'Bond +0.4. Fatigue -0.07 tribe-wide. Worth the risk.', badgeText: 'CONTRABAND', badgeClass: 'green'
              });
              socialFired++;
            } else {
              // Someone got caught — who?
              foodRaidResult = { success: false, caught: true };
              const caughtPlayers = [];
              const escapedPlayers = [];
              if (insCaught) caughtPlayers.push(instigator); else escapedPlayers.push(instigator);
              if (accCaught) caughtPlayers.push(accomplice); else escapedPlayers.push(accomplice);

              // Caught players → boathouse (eliminated)
              caughtPlayers.forEach(cp => {
                status[cp] = 'eliminated';
                dropPhase[cp] = phaseIdx;
                dropMethod[cp] = 'boathouse';
              });
              // Escaped players get fatigue from running
              escapedPlayers.forEach(ep2 => { fatigue[ep2] += 0.03; });

              let caughtTxt;
              if (caughtPlayers.length === 2) {
                caughtTxt = _rp([
                  `${chef} catches BOTH of them in the kitchen. "You two think this is FUNNY?! BOATHOUSE. BOTH OF YOU." Neither makes it back.`,
                  `The raid is a disaster. ${chef} is waiting for them. "Did you think I wouldn't notice?" ${instigator} and ${accomplice} are escorted to the boathouse. Done.`,
                ]);
              } else if (insCaught) {
                caughtTxt = _rp([
                  `${chef} catches ${instigator} red-handed. ${accomplice} hears the yelling and bolts. ${chef}: "BOATHOUSE. NOW." ${instigator} is done. ${accomplice} got away — barely.`,
                  `${instigator} knocks over a pot. ${chef} turns around. ${accomplice} dives behind a counter and crawls out the back. ${instigator} isn't so lucky. "Boathouse."`,
                ]);
              } else {
                caughtTxt = _rp([
                  `${instigator} grabs the food and runs. ${accomplice} trips. ${chef}: "Where do you think YOU'RE going?" ${accomplice} is dragged to the boathouse. ${instigator} escapes with the goods — but at what cost?`,
                  `${accomplice} freezes when ${chef} walks in. ${instigator} slips out the window. ${chef}: "BOATHOUSE." ${accomplice} pays the price alone.`,
                ]);
              }

              caughtPlayers.forEach(cp => {
                phaseResult.eliminated.push({ player: cp, method: 'boathouse', text: caughtTxt });
              });
              if (caughtPlayers.length && escapedPlayers.length) addBond(caughtPlayers[0], escapedPlayers[0], -0.3);

              const caughtEvt = { type: 'food-raid-caught', text: caughtTxt, players: [instigator, accomplice], badgeText: 'BUSTED', badgeClass: 'red' };
              socialEvents.push({ phase: phaseIdx, ...caughtEvt });
              allEvents.push({ ...caughtEvt, phase: phase.id });

              const ck2 = isMerged ? campKey : tribeOf[instigator];
              if (!ep.campEvents[ck2]) ep.campEvents[ck2] = { pre: [], post: [] };
              ep.campEvents[ck2].post.push({
                type: 'bsFoodRaidCaught', players: [...caughtPlayers],
                text: `${caughtPlayers.join(' and ')} got caught raiding ${chef}'s kitchen. Boathouse.${escapedPlayers.length ? ` ${escapedPlayers[0]} escaped.` : ''}`,
                consequences: `${caughtPlayers.join(', ')} eliminated.`, badgeText: 'BUSTED', badgeClass: 'red'
              });
              socialFired++;
            }
          }
        }
      }

      // Stolen kiss — two players with a spark or showmance share a moment
      const _kissRoll = Math.random();
      const _kissGate = socialFired < 8 && seasonConfig.romance === 'enabled';
      if (_kissGate && _kissRoll < 0.3) {
        // Check for existing sparks or showmances among standing players
        const sparkPairs = [];
        const _allStandElim = allPresent.filter(p => status[p] === 'standing' || status[p] === 'eliminated');
        if (gs.romanticSparks?.length) {
          gs.romanticSparks.forEach(sp => {
            if (sp.players.every(p => _allStandElim.includes(p)) && sp.intensity >= 0.3) {
              sparkPairs.push({ players: sp.players, intensity: sp.intensity, type: 'spark' });
            }
          });
        }
        if (gs.showmances?.length) {
          gs.showmances.filter(s => s.phase !== 'broken-up').forEach(sh => {
            if (sh.players.every(p => _allStandElim.includes(p))) {
              sparkPairs.push({ players: sh.players, intensity: 1.0, type: 'showmance' });
            }
          });
        }
        if (sparkPairs.length) {
          // Pick the highest intensity pair
          const best = sparkPairs.sort((a, b) => b.intensity - a.intensity)[0];
          const [kA, kB] = best.players;
          addBond(kA, kB, 0.4);
          // After a food raid = partners in crime energy. Otherwise = stolen moment.
          // Only use "after raid" text if BOTH kissing players were actually in the raid
          const afterRaid = foodRaidResult?.success && _raidInstigator && _raidAccomplice
            && [_raidInstigator, _raidAccomplice].includes(kA) && [_raidInstigator, _raidAccomplice].includes(kB);
          const kissTxt = afterRaid
            ? _rp([
              `The adrenaline from the food raid hasn't faded. ${kA} and ${kB} are still buzzing. "That was fun." "Too fun." Something shifts between them.`,
              `After the raid, ${kA} and ${kB} sit outside. The stars. The risk. The high. "Kissing me might be bad for your game," ${kA} says. ${kB}: "You're not my type." They kiss anyway.`,
              `Partners in crime. ${kA} and ${kB} can't stop grinning from the raid. Then the grin becomes something else. A stolen kiss in the dark.`,
            ])
            : best.type === 'showmance'
            ? _rp([
              // Established couple — comfortable, affectionate
              `Between phases, ${kA} and ${kB} steal a moment together. A forehead kiss. "We've got this." No hesitation. No fear. Just them.`,
              `${kA} pulls ${kB} close during the break. A quick kiss. "For luck." ${kB}: "We don't need luck." But ${pronouns(kB).sub} ${pronouns(kB).sub === 'they' ? 'are' : 'is'} smiling.`,
              `${kA} and ${kB} sit shoulder to shoulder. ${kA} leans over. A kiss on the cheek. The tribe pretends not to notice. Everyone notices.`,
            ])
            : _rp([
              // New spark — nervous, uncertain, first kiss energy
              `${kA} and ${kB} end up alone during the break. The silence stretches. Then ${kB} leans in — and pulls back. "Sorry, I—" ${kA} kisses ${pronouns(kB).obj} first.`,
              `"If we don't make it through the next phase—" ${kA} starts. ${kB} kisses ${pronouns(kA).obj} before ${pronouns(kA).sub} can finish. Both look stunned. Neither regrets it.`,
              `${kA} catches ${kB} staring. "What?" "Nothing." Beat. "...This is probably a bad idea." "Probably." They kiss anyway. Hearts pounding.`,
              `Exhaustion strips away the game. ${kA} and ${kB} are just two people in the dark. A look. A breath. The smallest, most terrified kiss. Then ${kB} pulls away. "Did that just happen?" "Yeah." "...Okay."`,
            ]);
          const kissEvt = { type: 'bs-kiss', text: kissTxt, players: [kA, kB], badgeText: 'KISS', badgeClass: 'pink' };
          socialEvents.push({ phase: phaseIdx, ...kissEvt });
          allEvents.push({ ...kissEvt, phase: phase.id });
          if (best.type === 'spark') {
            // Boost spark intensity
            const spark = gs.romanticSparks.find(s => s.players.includes(kA) && s.players.includes(kB));
            if (spark) spark.intensity = Math.min(2.0, spark.intensity + 0.3);
          }
          socialFired++;
        }
      }

      // Trash talk between tribes — pre-merge only
      if (socialFired < 8 && !isMerged && Math.random() < 0.25) {
        const tribes = gs.tribes;
        if (tribes.length >= 2) {
          const t1Standing = standingNow.filter(p => tribeOf[p] === tribes[0].name);
          const t2Standing = standingNow.filter(p => tribeOf[p] === tribes[1].name);
          if (t1Standing.length && t2Standing.length) {
            const talker = _rp([...t1Standing, ...t2Standing]);
            const otherTribe = tribeOf[talker] === tribes[0].name ? tribes[1].name : tribes[0].name;
            const txt = _rp([
              `${talker} yells across at the ${otherTribe} team: "How many of you are LEFT?! We're barely getting started over here!"`,
              `"Your team is DROPPING LIKE FLIES." ${talker} can't resist trash-talking ${otherTribe} during the break. It fires up both sides.`,
              `${talker} counts the remaining ${otherTribe} members. Loudly. On ${pronouns(talker).posAdj} fingers. The disrespect is deliberate.`,
            ]);
            const evt = { type: 'bs-trash-talk', text: txt, players: [talker], badgeText: 'TRASH TALK', badgeClass: 'orange' };
            socialEvents.push({ phase: phaseIdx, ...evt });
            allEvents.push({ ...evt, phase: phase.id });
            socialFired++;
          }
        }
      }

      // Injury check-in — someone is hurt but pushing through
      if (socialFired < 8 && Math.random() < 0.2) {
        const injured = standingNow.filter(p => gs.lingeringInjuries?.[p]);
        const hurting = injured.length ? injured : standingNow.filter(p => fatigue[p] > 0.06);
        if (hurting.length) {
          const p = hurting[Math.floor(Math.random() * hurting.length)];
          const pr = pronouns(p);
          const txt = _rp([
            `${p} is limping. ${pr.Sub} won't say it but something is wrong. ${chef} notices. "You good, soldier?" "I'm good." ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not good.`,
            `${p} is holding ${pr.posAdj} side. It's been getting worse since the obstacle course. But quitting isn't an option.`,
            `The medic pulls ${p} aside. "I can pull you." ${p}: "Don't you dare." Back in line. Gritting teeth.`,
          ]);
          const evt = { type: 'bs-injury-grit', text: txt, players: [p], badgeText: 'PUSHING THROUGH', badgeClass: 'orange' };
          socialEvents.push({ phase: phaseIdx, ...evt });
          allEvents.push({ ...evt, phase: phase.id });
          socialFired++;
        }
      }

      // Chef's war story — Chef tells a story during a break, players react differently
      if (socialFired < 8 && Math.random() < 0.25) {
        const txt = _rp([
          `${chef} starts talking about "the time 25 of us went into the woods and only 5 came out." Nobody knows if it's true. Nobody asks.`,
          `"Back in my day," ${chef} begins. Everyone groans. But the story — about surviving a week with nothing but a toothpick and rage — actually holds their attention.`,
          `${chef} tells a story about the war. It's probably made up. It's definitely terrifying. The recruits listen in exhausted silence.`,
          `"You think THIS is hard?" ${chef} laughs. "Let me tell you about HARD." The story involves a bear, a canoe, and a vow of silence. Nobody sleeps well tonight.`,
        ]);
        const evt = { type: 'bs-war-story', text: txt, players: [], badgeText: 'WAR STORY', badgeClass: 'gold' };
        socialEvents.push({ phase: phaseIdx, ...evt });
        allEvents.push({ ...evt, phase: phase.id });
        socialFired++;
      }
    }

    // ── MILESTONE: After mess hall — food opinions ──
    if (phase.id === 'mess-hall') {
      const standing2 = allCompetitors.filter(p => status[p] === 'standing');
      const eaters = standing2.filter(p => pStats(p).boldness * 0.08 + Math.random() * 0.15 > 0.4);
      const refusers = standing2.filter(p => !eaters.includes(p));
      if (eaters.length && refusers.length) {
        eaters.forEach(p => { fatigue[p] -= 0.02; }); // nourished
        refusers.forEach(p => { fatigue[p] += 0.02; if (!gs.popularity) gs.popularity = {}; gs.popularity[p] = (gs.popularity[p] || 0) + 1; }); // refused garbage food = principled/dignified edit
        const txt = `${eaters.length} ate the garbage. ${refusers.length} refused. The eaters have energy. The refusers have dignity.`;
        phaseResult.events.push({ type: 'bs-food-split', text: txt, players: [...eaters, ...refusers], badgeText: 'MESS HALL', badgeClass: 'orange' });
        allEvents.push({ type: 'bs-food-split', text: txt, players: [...eaters, ...refusers] });
      }
    }

    // ── MILESTONE: After obstacle course — fallen soldier moment ──
    if (phase.id === 'obstacle-course' && phaseResult.eliminated.length > 0) {
      const fallen = phaseResult.eliminated[0].player;
      if (defiantPlayer && status[defiantPlayer] === 'standing') {
        const txt = `${defiantPlayer} salutes ${fallen} as ${pronouns(fallen).sub} ${pronouns(fallen).sub === 'they' ? 'leave' : 'leaves'} the course. "Fallen soldier. I salute you!" ${chef}: "TWENTY MORE PUSHUPS."`;
        fatigue[defiantPlayer] += 0.02;
        phaseResult.events.push({ type: 'bs-fallen-salute', text: txt, players: [defiantPlayer, fallen], badgeText: 'SALUTE', badgeClass: 'gold' });
        allEvents.push({ type: 'bs-fallen-salute', text: txt, players: [defiantPlayer, fallen] });
      }
    }

    // ── PHASE SUMMARY CARD — who dropped this phase ──
    const phaseDropped = [...phaseResult.eliminated.map(e => ({ ...e, method: 'chef' })), ...phaseResult.quit.map(q => ({ player: q.player, method: 'quit', text: q.text }))];
    if (phaseDropped.length) {
      const remaining = allCompetitors.filter(p => status[p] === 'standing').length;
      const boathouseCount = allCompetitors.filter(p => status[p] === 'boathouse').length;
      const total = remaining + boathouseCount;
      const dropNames = phaseDropped.map(d => `${d.player} (${d.method === 'quit' ? 'QUIT' : 'DISMISSED'})`).join(', ');
      const summaryTxt = `End of ${phase.name}: ${dropNames}. ${total} recruit${total !== 1 ? 's' : ''} remain${total === 1 ? 's' : ''}.`;
      phaseResult.events.push({ type: 'bs-phase-summary', text: summaryTxt, players: phaseDropped.map(d => d.player), badgeText: 'PHASE END', badgeClass: 'red' });
      allEvents.push({ type: 'bs-phase-summary', text: summaryTxt, players: phaseDropped.map(d => d.player), phase: phase.id });
    } else {
      const remaining = allCompetitors.filter(p => status[p] === 'standing').length;
      const summaryTxt = `End of ${phase.name}: Nobody dropped. ${remaining} recruits still standing. ${chef} is not impressed.`;
      phaseResult.events.push({ type: 'bs-phase-summary', text: summaryTxt, players: [], badgeText: 'ALL CLEAR', badgeClass: 'green' });
      allEvents.push({ type: 'bs-phase-summary', text: summaryTxt, players: [], phase: phase.id });
    }

    phases.push(phaseResult);

    // ── CHECK TEAM WIPEOUT (pre-merge) ──
    if (!isMerged) {
      const wiped = checkTeamWipeout();
      if (wiped) {
        challengeOver = true;
        loserTribe = wiped;
        // Winner is the other tribe(s) — the one(s) with players remaining
        const winnerTribes = gs.tribes.filter(t => t !== wiped && tribeRemaining(t.name) > 0);
        winnerTribe = winnerTribes.length ? winnerTribes[0] : gs.tribes.find(t => t !== wiped);
      }
    }

    // ── CHECK LAST STANDING (post-merge) ──
    if (isMerged) {
      const remaining = allRemaining();
      if (remaining.length <= 1) {
        challengeOver = true;
        if (remaining.length === 1) immunityWinner = remaining[0];
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FINALIZE RESULTS
  // ══════════════════════════════════════════════════════════════════

  // (Boathouse is now elimination — no auto-return needed)

  // If challenge ended naturally (all 6 phases done, multiple still standing)
  if (!challengeOver) {
    const remaining = allRemaining();
    if (isMerged) {
      // Post-merge: player who survived with lowest fatigue wins
      immunityWinner = remaining.reduce((best, p) => fatigue[p] < fatigue[best] ? p : best, remaining[0]);
    } else {
      // Pre-merge: tribe with more remaining wins
      const tribeCounts = {};
      gs.tribes.forEach(t => { tribeCounts[t.name] = tribeRemaining(t.name); });
      const sorted = Object.entries(tribeCounts).sort((a, b) => b[1] - a[1]);
      winnerTribe = gs.tribes.find(t => t.name === sorted[0][0]);
      loserTribe = gs.tribes.find(t => t.name === sorted[sorted.length - 1][0]);
    }
  }

  // ── Bullying resentment → heat ──
  Object.entries(resentment).forEach(([victim, data]) => {
    if (data.count >= 2) {
      // Find bully's closest ally
      const bullyAllies = allCompetitors.filter(p => p !== data.bully && p !== victim && getBond(data.bully, p) > 2);
      if (bullyAllies.length) {
        const target = bullyAllies.reduce((best, p) => getBond(data.bully, p) > getBond(data.bully, best) ? p : best, bullyAllies[0]);
        gs._basicStrainingHeat[victim] = { target, amount: 1.5, expiresEp: epNum + 2 };
      }
    }
  });

  // ── Showmance challenge moments — boot camp is danger/partner-interaction context ──
  if (seasonConfig.romance === 'enabled') {
    const _bsShowmancePhases = { bootcamp: [] };
    _checkShowmanceChalMoment(ep, 'bootcamp', _bsShowmancePhases, {}, 'danger', isMerged ? [{ name: gs.mergeName || 'merge', members: allCompetitors }] : gs.tribes);
    // Add any showmance moments to allEvents
    _bsShowmancePhases.bootcamp.forEach(evt => { allEvents.push(evt); });
  }

  // ── Chef's salute to the last standing ──
  const chefSalute = isMerged ? immunityWinner : (winnerTribe ? allCompetitors.filter(p => tribeOf[p] === winnerTribe.name && status[p] === 'standing').sort((a, b) => fatigue[a] - fatigue[b])[0] : null);
  let saluteQuote = null;
  if (chefSalute) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[chefSalute] = (gs.popularity[chefSalute] || 0) + 2; // chef's salute = boot camp champion
    const saluteArch = players.find(p => p.name === chefSalute)?.archetype || '';
    const saluteQuote = ['villain','schemer','chaos-agent'].includes(saluteArch)
      ? _rp([`"You're trouble. But you're MY kind of trouble."`, `"I don't like you. But I respect you. That's rarer."`, `"You broke every rule and still won. ...Impressive."`])
      : ['hero','loyal-soldier'].includes(saluteArch)
      ? _rp([`"I'd go into battle with you anytime. And I mean that."`, `"Heart of a soldier. You earned this."`, `"That's what a REAL competitor looks like. Take notes, maggots."`])
      : ['hothead'].includes(saluteArch)
      ? _rp([`"You've got fire. Uncontrollable, dangerous fire. ...I like that."`, `"Most people with your temper burn out by phase 2. Not you."`, `"You ran on pure rage. And it WORKED."`])
      : ['strategist','mastermind'].includes(saluteArch)
      ? _rp([`"You didn't just survive — you CALCULATED your survival. Smart."`, `"Brains beat brawn today. Don't let it go to your head."`, `"I've trained soldiers for twenty years. You're the first to outsmart the course."`])
      : _rp([`"I'd go into battle with you anytime."`, `"You outlasted them all. That takes something special."`, `"Not bad, soldier. Not bad at all."`]);
    const txt = `${chef} faces ${chefSalute}. Stands at attention. Salutes. ${saluteQuote} The highest honor.`;
    allEvents.push({ type: 'bs-chef-salute', text: txt, players: [chefSalute] });

    const ck = isMerged ? campKey : tribeOf[chefSalute];
    if (!ep.campEvents[ck]) ep.campEvents[ck] = { pre: [], post: [] };
    ep.campEvents[ck].post.push({
      type: 'bsChefSalute', players: [chefSalute],
      text: `${chef} saluted ${chefSalute}. That's never happened before. Respect earned.`,
      consequences: 'Popularity +2. Chef respects this one.', badgeText: 'SALUTE', badgeClass: 'gold'
    });
  }

  // ── Build placements ──
  // Order: standing players (best), then dropped in reverse order (last dropped = better)
  const standing = allCompetitors.filter(p => status[p] === 'standing');
  const dropped = allCompetitors.filter(p => status[p] !== 'standing').sort((a, b) => (dropPhase[b] || 0) - (dropPhase[a] || 0));
  const placements = [...standing.sort((a, b) => fatigue[a] - fatigue[b]), ...dropped];

  // ── Set episode properties ──
  ep.isBasicStraining = true;
  ep.basicStraining = {
    phases, allEvents, socialEvents, prankLog, resentment,
    defiant: { player: defiantPlayer, defianceCount, boathouse: boathouseTriggered, visitor: boathouseVisitor, foodRaid: foodRaidResult },
    placements, chefSalute, chefSaluteQuote: chefSalute ? saluteQuote : null,
    status, dropPhase, dropMethod, fatigue,
    tribeOf: { ...tribeOf }, // store tribe mapping for VP
  };

  if (isMerged) {
    ep.challengeType = 'individual';
    ep.immunityWinner = immunityWinner;
    ep.tribalPlayers = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  } else {
    ep.challengeType = 'tribe';
    ep.winner = winnerTribe;
    ep.loser = loserTribe;
    ep.safeTribes = gs.tribes.filter(t => t !== winnerTribe && t !== loserTribe);
    ep.immunePlayers = winnerTribe ? winnerTribe.members.slice() : [];
    ep.tribalPlayers = loserTribe ? loserTribe.members.filter(m => gs.activePlayers.includes(m)) : [];
  }
  ep.challengeLabel = 'Basic Straining';
  ep.challengeCategory = 'endurance';
  ep.challengeDesc = "Chef's boot camp. 6 phases. Last team standing wins.";

  // ── Challenge member scores (phases survived: 0-6) ──
  ep.chalMemberScores = {};
  allCompetitors.forEach(p => {
    const phasesCompleted = dropPhase[p] !== undefined ? dropPhase[p] : PHASES.length;
    ep.chalMemberScores[p] = phasesCompleted;
  });
  updateChalRecord(ep);
}

export function _textBasicStraining(ep, ln, sec) {
  const bs = ep.basicStraining;
  if (!bs) return;
  sec('BASIC STRAINING');
  ln(`Chef's Boot Camp. ${bs.placements.length} competitors. ${bs.phases.length} phases completed.`);
  if (bs.defiant.player) ln(`Most Defiant: ${bs.defiant.player} (${bs.defiant.defianceCount} acts of insubordination${bs.defiant.boathouse ? ' → BOATHOUSE' : ''})`);
  ln('');

  // Per-phase breakdown
  bs.phases.forEach((phase, i) => {
    ln(`Phase ${i + 1}: ${phase.name}`);
    if (phase.defianceEvents?.length) phase.defianceEvents.forEach(d => {
      const dtype = d.type || '';
      if (dtype.includes('defiance')) ln(`  INSUBORDINATION: ${d.players?.[0] || '?'}`);
      else if (dtype.includes('boathouse')) ln(`  BOATHOUSE: ${d.players?.join(', ') || '?'}`);
      else if (dtype.includes('food-raid')) ln(`  ${dtype.includes('caught') ? 'BUSTED' : 'CONTRABAND'}: ${d.players?.join(' + ') || '?'}`);
      else if (dtype.includes('feast')) ln(`  FEAST: tribe eats`);
      else if (dtype.includes('kiss')) ln(`  KISS: ${d.players?.join(' & ') || '?'}`);
    });
    if (phase.eliminated.length) phase.eliminated.forEach(e => {
      const method = e.method === 'boathouse' ? 'BOATHOUSE' : e.method === 'quit' ? 'QUIT' : 'DISMISSED';
      ln(`  ${method}: ${e.player}`);
    });
    if (phase.quit?.length) phase.quit.forEach(q => ln(`  QUIT: ${q.player} (rang the bell)`));
    ln(`  Survivors: ${phase.survivors.length}`);
  });

  // Social events summary
  ln('');
  const socialTypes = {};
  (bs.socialEvents || []).forEach(se => {
    const t = se.type || 'unknown';
    const label = t.includes('prank') ? 'PRANK' : t.includes('cracking') ? 'CRACKING' : t.includes('respect') ? 'RESPECT'
      : t.includes('whisper') || t.includes('strategy') ? 'STRATEGY' : t.includes('alliance') ? 'ALLIANCE'
      : t.includes('rivalry') || t.includes('tension') ? 'RIVALRY' : t.includes('rally') ? 'RALLY'
      : t.includes('confessional') ? 'CONFESSIONAL' : t.includes('sideline') ? 'SIDELINE'
      : t.includes('sharing') || t.includes('kindness') ? 'KINDNESS' : t.includes('trash') ? 'TRASH TALK'
      : t.includes('war-story') ? 'WAR STORY' : t.includes('strain') ? 'ALLIANCE STRAIN'
      : t.includes('misery') || t.includes('brothers') ? 'BONDING' : t.includes('commended') ? 'COMMENDED'
      : t.includes('roasted') ? 'ROASTED' : t.includes('injury') || t.includes('pushing') ? 'GRIT'
      : t.includes('food-raid') ? 'FOOD RAID' : t.includes('feast') ? 'FEAST' : t.includes('kiss') ? 'KISS' : t;
    if (!socialTypes[label]) socialTypes[label] = 0;
    socialTypes[label]++;
  });
  if (Object.keys(socialTypes).length) {
    ln('SOCIAL EVENTS:');
    Object.entries(socialTypes).forEach(([label, count]) => ln(`  ${label}: ${count}`));
  }

  // Pranks
  if (bs.prankLog?.length) {
    ln('');
    ln('PRANKS:');
    bs.prankLog.forEach(p => ln(`  ${p.bully} → ${p.victim} (${p.phase})`));
  }

  // Food raid
  if (bs.defiant.foodRaid) {
    ln('');
    ln(`FOOD RAID: ${bs.defiant.foodRaid.success ? 'SUCCESS — tribe feasted' : 'CAUGHT — instigator boathoused'}`);
  }

  // Placements
  ln('');
  ln('PLACEMENTS:');
  bs.placements.forEach((name, i) => {
    const method = bs.dropMethod[name];
    const methodLabel = !method ? 'standing' : method === 'quit' ? 'quit' : method === 'boathouse' ? 'boathouse' : 'dismissed';
    const phaseNum = bs.dropPhase[name] !== undefined ? `phase ${bs.dropPhase[name] + 1}` : 'all 6';
    ln(`  ${i + 1}. ${name} — survived ${phaseNum} (${methodLabel})`);
  });
  if (bs.chefSalute) ln(`\nChef's Salute: ${bs.chefSalute}`);
}

export function rpBuildBasicStraining(ep) {
  const bs = ep.basicStraining;
  if (!bs) return null;

  const stateKey = 'bs_reveal_' + ep.num;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const _bsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  const isMerged = !!ep.immunityWinner;
  const OLIVE = '#6b7a3d';
  const GOLD = '#c4a43c';
  const DARK_OLIVE = '#1a1f16';
  const PARCHMENT = '#d4c5a0';
  const MIL_RED = '#b91c1c';

  // ── Build steps ──
  const steps = [];

  // Announcement
  steps.push({ stepType: 'announcement' });

  // Per-phase blocks
  bs.phases.forEach((phase, i) => {
    steps.push({ stepType: 'phase-header', phase, phaseIdx: i });
    // Phase events (survival, defiance, milestones)
    // Defiance events go FIRST (they happen during the phase, before survival results)
    if (phase.defianceEvents?.length) {
      phase.defianceEvents.forEach(evt => { steps.push({ stepType: 'event', data: evt }); });
    }
    phase.events.forEach(evt => { steps.push({ stepType: 'event', data: evt }); });
    // Social events after this phase
    const socials = bs.socialEvents.filter(se => se.phase === i);
    if (socials.length) {
      steps.push({ stepType: 'social-break', phaseIdx: i });
      socials.forEach(se => { steps.push({ stepType: 'event', data: se }); });
    }
    // Running count
    steps.push({ stepType: 'status-board', phaseIdx: i });
  });

  // Final result
  steps.push({ stepType: 'final' });

  const totalSteps = steps.length;
  const _nonRevealable = new Set(['phase-header', 'social-break']);
  const allRevealed = state.idx >= totalSteps - 1;
  let _nextIdx = state.idx + 1;
  while (_nextIdx < totalSteps && _nonRevealable.has(steps[_nextIdx]?.stepType)) _nextIdx++;

  // ── Badge color map ──
  const badgeColor = (bc) => {
    if (bc === 'red') return MIL_RED;
    if (bc === 'green') return '#3fb950';
    if (bc === 'gold') return GOLD;
    if (bc === 'orange') return '#d97706';
    if (bc === 'blue') return '#3b82f6';
    if (bc === 'teal') return '#14b8a6';
    if (bc === 'pink') return '#ec4899';
    return OLIVE;
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  const AMBER = '#d97706';
  const CANDLE = '#92400e';
  const tribeNames = isMerged ? [] : (gs.tribes || ep.tribesAtStart || []).map(t => t.name || t);

  // ── Helper: get player status at a given phase ──
  const playerStatusAt = (name, phaseIdx) => {
    const dp = bs.dropPhase[name];
    if (dp === undefined) return 'standing';
    if (dp > phaseIdx) return 'standing';
    if (dp === phaseIdx) return bs.dropMethod[name] || 'eliminated';
    return bs.dropMethod[name] || 'eliminated';
  };

  // ── Helper: tribe of player ──
  const playerTribe = (name) => {
    if (isMerged) return null;
    // Use stored tribe mapping from engine (most reliable)
    if (bs.tribeOf?.[name]) return bs.tribeOf[name];
    const t = (ep.tribesAtStart || gs.tribes || []).find(tr => (tr.members || []).includes(name));
    return t ? (t.name || null) : null;
  };

  // ── Helper: count per tribe at phase ──
  const tribeCountAt = (tribeName, phaseIdx) => {
    return bs.placements.filter(p => {
      const dp = bs.dropPhase[p];
      return playerTribe(p) === tribeName && (dp === undefined || dp > phaseIdx);
    }).length;
  };

  const totalRecruits = bs.placements.length;
  const isDefiant = (name) => name === bs.defiant.player;

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,${DARK_OLIVE} 0%,#0d1117 30%,#0d1117 100%);padding-bottom:60px">`;

  // ── HEADER — Military stencil ──
  html += `<div class="rp-eyebrow" style="color:${GOLD}">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:26px;letter-spacing:4px;text-align:center;color:${GOLD};text-transform:uppercase;text-shadow:0 0 20px ${GOLD}33;margin-bottom:2px">
      BASIC STRAINING
    </div>
    <div style="text-align:center;font-size:11px;color:${PARCHMENT};letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">
      Master Chief's Boot Camp
    </div>
    <div style="text-align:center;font-size:10px;color:#6b7a3d;margin-bottom:12px">
      6 phases. ${totalRecruits} recruits. ${isMerged ? 'Last one standing wins immunity.' : 'First tribe to zero goes to tribal.'}
    </div>`;

  // ── PLAYER ROSTER BOARD — dog tags showing all players ──
  // This is always visible and updates as phases are revealed
  const lastRevealedPhase = (() => {
    let lp = -1;
    steps.forEach((s, i) => { if (i <= state.idx && s.stepType === 'status-board') lp = s.phaseIdx; });
    return lp;
  })();

  html += `<div style="padding:10px;border:1px solid ${OLIVE}33;border-radius:6px;background:${OLIVE}08;margin-bottom:16px">
    <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:${OLIVE};text-transform:uppercase;text-align:center;margin-bottom:8px">RECRUIT ROSTER</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">`;

  bs.placements.forEach(name => {
    const pStatus = lastRevealedPhase >= 0 ? playerStatusAt(name, lastRevealedPhase) : 'standing';
    const isDef = isDefiant(name);
    const tc = !isMerged && playerTribe(name) ? (typeof tribeColor === 'function' ? tribeColor(playerTribe(name)) : OLIVE) : OLIVE;
    let bgColor, borderColor, opacity, icon;
    if (pStatus === 'standing') {
      bgColor = `${tc}15`; borderColor = `${tc}55`; opacity = '1'; icon = '';
    } else if (pStatus === 'quit') {
      bgColor = '#21262d'; borderColor = '#6b768144'; opacity = '0.5'; icon = '<span style="font-size:8px">🔔</span> ';
    } else {
      bgColor = '#21262d'; borderColor = `${MIL_RED}44`; opacity = '0.4'; icon = '<span style="font-size:8px;color:' + MIL_RED + '">✕</span> ';
    }

    html += `<div style="padding:3px 6px;border-radius:3px;border:1px solid ${borderColor};background:${bgColor};opacity:${opacity};display:flex;align-items:center;gap:3px;${isDef ? `box-shadow:0 0 4px ${GOLD}44;` : ''}">
      ${icon}${rpPortrait(name, 'pb-xs')}
      <span style="font-size:8px;color:${pStatus === 'standing' ? PARCHMENT : '#6b7681'};font-weight:${isDef ? '700' : '400'};${isDef ? `color:${GOLD};` : ''}">${name.split(' ')[0]}</span>
    </div>`;
  });
  html += `</div>`;

  // ── TRIBE SURVIVAL BARS (pre-merge only) ──
  if (!isMerged && tribeNames.length >= 2 && lastRevealedPhase >= 0) {
    html += `<div style="display:flex;gap:8px;margin-top:8px;justify-content:center">`;
    tribeNames.forEach(tn => {
      const tc = typeof tribeColor === 'function' ? tribeColor(tn) : OLIVE;
      const tribeTotal = bs.placements.filter(p => playerTribe(p) === tn).length;
      const remaining = tribeCountAt(tn, lastRevealedPhase);
      const pct = tribeTotal > 0 ? (remaining / tribeTotal * 100) : 0;
      const barColor = pct === 0 ? MIL_RED : pct <= 30 ? AMBER : tc;
      html += `<div style="flex:1;max-width:160px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="font-size:9px;font-weight:700;color:${tc};text-transform:uppercase">${tn}</span>
          <span style="font-size:10px;font-weight:700;color:${barColor}">${remaining}/${tribeTotal}</span>
        </div>
        <div style="height:8px;border-radius:4px;background:#21262d;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;transition:width 0.5s ease"></div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`; // close roster

  // ── BARBED WIRE DIVIDER ──
  const barbedWire = `<div style="text-align:center;padding:6px 0;margin:12px 0;color:${OLIVE}44;font-size:10px;letter-spacing:3px;user-select:none">
    ─ ╳ ── ╳ ── ╳ ── ╳ ── ╳ ── ╳ ─
  </div>`;

  // ── CLICK-TO-REVEAL ──
  html += `<div style="margin-bottom:16px">`;

  steps.forEach((step, i) => {
    const isVisible = i <= state.idx;

    // ── PHASE HEADER — always visible, with difficulty indicator ──
    if (step.stepType === 'phase-header') {
      const ph = step.phase;
      const phNum = step.phaseIdx + 1;
      // Difficulty color gradient: phase 1 = olive, phase 6 = red-tinged
      const diffColors = ['#6b7a3d', '#7a8a3d', '#8a7a3d', '#9a6a3d', '#aa5a3d', '#b94a3d'];
      const diffColor = diffColors[Math.min(phNum - 1, 5)];
      const diffBars = Array.from({length: 6}, (_, j) => `<span style="display:inline-block;width:8px;height:${6 + j}px;background:${j < phNum ? diffColor : '#21262d'};border-radius:1px;margin:0 1px;vertical-align:bottom"></span>`).join('');
      // Stat icons
      const statEmoji = { endurance: '🏋️', temperament: '🧘', boldness: '💪', mental: '🧠', physical: '🏃' };
      const primaryIcon = statEmoji[ph.primaryStat] || '⚡';
      const secondaryIcon = statEmoji[ph.secondaryStat] || '⚡';

      html += barbedWire;
      html += `<div style="text-align:center;padding:12px 0 8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:3px;color:${OLIVE};text-transform:uppercase;margin-bottom:4px">PHASE ${phNum} OF 6</div>
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:${GOLD};text-transform:uppercase">${ph.name}</div>
        <div style="font-size:10px;color:${PARCHMENT}88;margin-top:4px;font-style:italic">${ph.desc || ''}</div>
        <div style="margin-top:6px;display:flex;align-items:center;justify-content:center;gap:12px">
          <span style="font-size:9px;color:${OLIVE}">${primaryIcon} ${(ph.primaryStat || '').toUpperCase()}</span>
          <span style="font-size:8px;color:${OLIVE}66">+</span>
          <span style="font-size:9px;color:${OLIVE}88">${secondaryIcon} ${(ph.secondaryStat || '').toUpperCase()}</span>
          <span style="display:flex;align-items:flex-end;gap:0;margin-left:8px">${diffBars}</span>
        </div>
      </div>`;
      return;
    }

    // ── SOCIAL BREAK — always visible ──
    if (step.stepType === 'social-break') {
      html += `<div style="text-align:center;padding:6px 0;margin:8px 0">
        <span style="font-size:8px;font-weight:700;letter-spacing:2px;color:${OLIVE};text-transform:uppercase">Between Phases</span>
      </div>`;
      return;
    }

    // Hidden placeholder
    if (!isVisible) {
      html += `<div style="padding:10px;margin-bottom:4px;border:1px solid ${OLIVE}22;border-radius:4px;opacity:0.08;text-align:center;cursor:pointer"
        onclick="${_bsReveal(i)}">
        <span style="font-size:11px;color:${OLIVE}">▶</span>
      </div>`;
      return;
    }

    // ── EVENT CARD — military dog-tag style with special treatments ──
    if (step.stepType === 'event') {
      const evt = step.data;
      const bc = badgeColor(evt.badgeClass);
      const pList = evt.players || [];
      const evtType = evt.type || '';

      // Special card styles
      const isQuitEvent = evtType.includes('bs-quit');
      const isBoathouseEvent = evtType.includes('boathouse');
      const isDefianceEvent = evtType.includes('defiance') || evtType.includes('INSUBORDINATION');
      const hasDefiantPlayer = pList.includes(bs.defiant.player);

      // Card background
      let cardBg = 'rgba(107,122,61,0.06)';
      let cardBorder = `3px solid ${bc}`;
      let cardExtra = '';
      if (isBoathouseEvent) {
        cardBg = `linear-gradient(135deg, ${CANDLE}15, #0d111788)`;
        cardBorder = `3px solid ${AMBER}`;
        cardExtra = `box-shadow:0 0 12px ${AMBER}15;`;
      } else if (isQuitEvent) {
        cardBg = 'rgba(107,35,35,0.1)';
        cardExtra = `box-shadow:inset 0 0 20px ${MIL_RED}08;`;
      } else if (isDefianceEvent || (hasDefiantPlayer && evtType.includes('defiance'))) {
        cardBg = `rgba(196,164,60,0.08)`;
        cardBorder = `3px solid ${GOLD}`;
        cardExtra = `box-shadow:0 0 8px ${GOLD}15;`;
      } else if (hasDefiantPlayer && !evtType.includes('bs-strong') && !evtType.includes('bs-struggling') && !evtType.includes('bs-cleared')) {
        cardExtra = `border-right:2px solid ${GOLD}22;`;
      }

      html += `<div style="padding:10px 12px;border-radius:4px;border-left:${cardBorder};background:${cardBg};margin-bottom:6px;animation:scrollDrop 0.3s var(--ease-broadcast) both;${cardExtra}">`;

      // Badge row
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap">`;
      if (evt.badgeText) {
        // Bell icon for quit events
        const badgeIcon = isQuitEvent ? '🔔 ' : isBoathouseEvent ? '🏚️ ' : isDefianceEvent ? '✊ ' : '';
        html += `<span style="font-size:7px;font-weight:800;letter-spacing:1px;color:${bc};background:${bc}18;padding:2px 6px;border-radius:2px;text-transform:uppercase${isQuitEvent ? ';animation:bellPulse 1s ease-in-out' : ''}">${badgeIcon}${evt.badgeText}</span>`;
      }
      // Defiant marker
      if (hasDefiantPlayer && !isDefianceEvent) {
        html += `<span style="font-size:7px;font-weight:700;color:${GOLD};background:${GOLD}15;padding:1px 4px;border-radius:2px">THE DEFIANT</span>`;
      }
      html += `</div>`;

      // Portraits
      if (pList.length && pList.length <= 6) {
        html += `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:5px">`;
        pList.forEach(p => {
          const isDef = isDefiant(p);
          html += `<div style="${isDef ? `box-shadow:0 0 6px ${GOLD}44;border-radius:50%;` : ''}">${rpPortrait(p, 'pb-sm')}</div>`;
        });
        html += `</div>`;
      }

      // Text — boathouse gets amber-tinted text
      const textColor = isBoathouseEvent ? '#e0c088' : PARCHMENT;
      html += `<div style="font-size:11px;color:${textColor};line-height:1.6">${evt.text || ''}</div>`;

      // Quit stamp overlay
      if (isQuitEvent) {
        html += `<div style="text-align:right;margin-top:4px">
          <span style="font-size:14px;font-weight:900;color:${MIL_RED}44;letter-spacing:3px;text-transform:uppercase;transform:rotate(-3deg);display:inline-block">RANG THE BELL</span>
        </div>`;
      }

      html += `</div>`;
      return;
    }

    // ── ANNOUNCEMENT ──
    if (step.stepType === 'announcement') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid ${OLIVE}22;border-radius:4px;opacity:0.08;text-align:center;cursor:pointer" onclick="${_bsReveal(i)}"><span style="font-size:11px;color:${OLIVE}">▶</span></div>`;
        return;
      }
      html += `<div style="padding:14px;border-radius:6px;border:2px solid ${GOLD}33;background:linear-gradient(135deg,${GOLD}08,transparent);margin-bottom:12px;text-align:center;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:${GOLD};text-transform:uppercase;margin-bottom:6px">ATTENTION, MAGGOTS</div>
        <div style="font-size:12px;color:${PARCHMENT};line-height:1.6">
          Chef takes the PA. "All campers report to the Dock of Shame at 0900 hours. Today, I am your commanding officer. You will address me as MASTER CHIEF. And you WILL obey."
        </div>
        <div style="font-size:10px;color:${OLIVE};margin-top:8px;font-style:italic">
          ${bs.defiant.player ? `The Defiant: <span style="color:${GOLD};font-weight:700">${bs.defiant.player}</span>` : ''}
        </div>
      </div>`;
      return;
    }

    // ── STATUS BOARD — tribe survival bars (pre-merge) or recruit count (post-merge) ──
    if (step.stepType === 'status-board') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid ${OLIVE}22;border-radius:4px;opacity:0.08;text-align:center;cursor:pointer" onclick="${_bsReveal(i)}"><span style="font-size:11px;color:${OLIVE}">▶</span></div>`;
        return;
      }
      const phaseIdx = step.phaseIdx;
      const standingCount = bs.placements.filter(p => {
        const dp = bs.dropPhase[p];
        return dp === undefined || dp > phaseIdx;
      }).length;

      if (!isMerged && tribeNames.length >= 2) {
        // Pre-merge: tribe survival bars
        html += `<div style="padding:8px 12px;border:1px solid ${OLIVE}22;border-radius:4px;background:${OLIVE}06;margin:8px 0 12px">
          <div style="display:flex;gap:12px;justify-content:center">`;
        tribeNames.forEach(tn => {
          const tc = typeof tribeColor === 'function' ? tribeColor(tn) : OLIVE;
          const tribeTotal = bs.placements.filter(p => playerTribe(p) === tn).length;
          const remaining = tribeCountAt(tn, phaseIdx);
          const pct = tribeTotal > 0 ? (remaining / tribeTotal * 100) : 0;
          const barColor = remaining === 0 ? MIL_RED : pct <= 30 ? AMBER : tc;
          const isWiped = remaining === 0;
          html += `<div style="flex:1;max-width:160px;${isWiped ? 'opacity:0.5;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:9px;font-weight:700;color:${tc};text-transform:uppercase">${tn}</span>
              <span style="font-size:11px;font-weight:800;color:${barColor}">${remaining}<span style="font-size:8px;color:${OLIVE}66">/${tribeTotal}</span></span>
            </div>
            <div style="height:10px;border-radius:5px;background:#21262d;overflow:hidden;border:1px solid ${OLIVE}22">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${barColor},${barColor}cc);border-radius:5px;transition:width 0.5s ease"></div>
            </div>
            ${isWiped ? `<div style="text-align:center;font-size:8px;font-weight:700;color:${MIL_RED};margin-top:2px;letter-spacing:1px">WIPED OUT</div>` : ''}
            <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:4px;justify-content:center">
              ${bs.placements.filter(p => playerTribe(p) === tn).map(p => {
                const alive = playerStatusAt(p, phaseIdx) === 'standing';
                return `<div style="opacity:${alive ? '1' : '0.25'}${!alive ? ';filter:grayscale(1)' : ''}">${rpPortrait(p, 'pb-xs')}</div>`;
              }).join('')}
            </div>
          </div>`;
        });
        html += `</div></div>`;
      } else {
        // Post-merge: recruit count with visual dots
        html += `<div style="text-align:center;padding:8px 0;margin:8px 0">
          <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:${OLIVE};text-transform:uppercase;margin-bottom:4px">RECRUITS REMAINING</div>
          <div style="display:flex;gap:3px;justify-content:center;flex-wrap:wrap">`;
        bs.placements.forEach(p => {
          const alive = playerStatusAt(p, phaseIdx) === 'standing';
          html += `<div style="width:8px;height:8px;border-radius:50%;background:${alive ? '#3fb950' : '#21262d'};border:1px solid ${alive ? '#3fb95044' : '#21262d'}"></div>`;
        });
        html += `</div>
          <div style="font-size:12px;font-weight:800;color:${standingCount <= 3 ? AMBER : OLIVE};margin-top:4px">${standingCount} / ${totalRecruits}</div>
        </div>`;
      }
      return;
    }

    // ── FINAL RESULT ──
    if (step.stepType === 'final') {
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid ${OLIVE}22;border-radius:4px;opacity:0.08;text-align:center;cursor:pointer" onclick="${_bsReveal(i)}"><span style="font-size:11px;color:${OLIVE}">▶</span></div>`;
        return;
      }

      html += barbedWire;
      html += `<div style="padding:16px;border-radius:8px;border:2px solid ${GOLD}44;background:linear-gradient(135deg,${GOLD}10,transparent);margin-bottom:12px;text-align:center">
        <div style="font-size:10px;font-weight:700;letter-spacing:3px;color:${OLIVE};text-transform:uppercase;margin-bottom:6px">BOOT CAMP COMPLETE</div>`;

      if (ep.immunityWinner) {
        html += `<div style="font-size:20px;font-weight:700;color:${GOLD};margin-bottom:8px">🎖️ ${ep.immunityWinner}</div>
          <div style="font-size:11px;color:${PARCHMENT}">Last one standing. Immunity secured.</div>`;
      } else if (ep.winner) {
        const winColor = typeof tribeColor === 'function' ? tribeColor(ep.winner.name) : GOLD;
        html += `<div style="font-size:20px;font-weight:700;color:${winColor};margin-bottom:8px">🎖️ ${ep.winner.name} WINS</div>
          <div style="font-size:11px;color:${PARCHMENT}">${ep.loser?.name || 'The other tribe'} → Tribal Council</div>`;
      }

      // Chef's salute
      if (bs.chefSalute) {
        html += `<div style="margin-top:12px;padding:10px;border:1px solid ${GOLD}33;border-radius:6px;background:${GOLD}08">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:${GOLD};text-transform:uppercase;margin-bottom:4px">Chef's Salute</div>
          <div style="display:flex;align-items:center;justify-content:center;gap:8px">
            ${rpPortrait(bs.chefSalute, 'pb-sm')}
            <div style="font-size:12px;color:${PARCHMENT}"><span style="font-weight:700;color:${GOLD}">${bs.chefSalute}</span> — ${bs.chefSaluteQuote || '"I\'d go into battle with you anytime."'}</div>
          </div>
        </div>`;
      }

      // Placements table
      html += `<div style="margin-top:14px;text-align:left">
        <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:${OLIVE};text-transform:uppercase;margin-bottom:6px;text-align:center">PLACEMENTS</div>`;
      bs.placements.forEach((name, i) => {
        const method = bs.dropMethod[name];
        const phaseNum = bs.dropPhase[name] !== undefined ? bs.dropPhase[name] + 1 : 6;
        const statusColor = !method ? '#3fb950' : method === 'quit' ? '#6b7681' : MIL_RED;
        const statusLabel = !method ? 'STANDING' : method === 'quit' ? 'QUIT' : method === 'boathouse' ? 'BOATHOUSE' : 'DISMISSED';
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid ${OLIVE}11">
          <span style="font-size:10px;font-weight:700;color:${OLIVE};width:20px">${i + 1}.</span>
          ${rpPortrait(name, 'pb-xs')}
          <span style="font-size:11px;color:${PARCHMENT};flex:1">${name}</span>
          <span style="font-size:8px;font-weight:700;color:${statusColor};letter-spacing:0.5px">${statusLabel}</span>
          <span style="font-size:9px;color:${OLIVE}">P${phaseNum}</span>
        </div>`;
      });
      html += `</div></div>`;
      return;
    }
  });

  html += `</div>`; // close reveal container

  // ── NEXT button ──
  if (!allRevealed && _nextIdx < totalSteps) {
    html += `<div style="position:sticky;bottom:12px;z-index:10;display:flex;gap:8px;justify-content:center;margin-top:16px;padding:8px 0">
      <button onclick="${_bsReveal(_nextIdx)}" style="background:${GOLD};color:${DARK_OLIVE};border:none;padding:10px 28px;border-radius:4px;font-weight:800;font-size:12px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        NEXT ORDER
      </button>
      <button onclick="${_bsReveal(totalSteps - 1)}" style="background:${OLIVE};color:${PARCHMENT};border:none;padding:10px 16px;border-radius:4px;font-weight:700;font-size:10px;letter-spacing:1px;cursor:pointer;text-transform:uppercase;box-shadow:0 2px 8px rgba(0,0,0,0.4)">
        REVEAL ALL
      </button>
    </div>`;
  }

  html += `</div>`; // close page
  return html;
}

