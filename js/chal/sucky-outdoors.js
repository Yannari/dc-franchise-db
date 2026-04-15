// js/chal/sucky-outdoors.js
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, romanticCompat, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateSuckyOutdoors(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _hash = (str, n) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xfffffff; return h % n; };
  const NICE_ARCHS = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  const tribeOf = {};
  tribes.forEach(t => t.members.forEach(m => { tribeOf[m] = t.name; }));

  // ── Navigator selection per tribe ──
  const navigators = {};
  tribes.forEach(t => {
    navigators[t.name] = t.members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.mental * 0.5 + sB.strategic * 0.3 + sB.intuition * 0.2) - (sA.mental * 0.5 + sA.strategic * 0.3 + sA.intuition * 0.2);
    })[0];
  });

  // ── Personal scores per player ──
  const personalScores = {};
  tribes.flatMap(t => t.members).forEach(m => { personalScores[m] = 0; });

  // ── Camp quality per tribe ──
  const campQuality = {};
  tribes.forEach(t => {
    campQuality[t.name] = t.members.reduce((sum, m) => { const s = pStats(m); return sum + s.endurance + s.mental; }, 0) / (t.members.length * 2);
  });

  // ── Food supply per tribe ──
  const tribeFood = {};
  tribes.forEach(t => { tribeFood[t.name] = 0; });

  // ── Injury flag per player (set during Phase 2) ──
  if (!ep._soInjured) ep._soInjured = {};

  // ── Camp quality snapshots per phase (for VP display) ──
  const campQSnaps = {};
  const _snapCamp = (phaseKey) => { campQSnaps[phaseKey] = Object.fromEntries(Object.entries(campQuality).map(([k, v]) => [k, Math.round(v * 10) / 10])); };

  // ── Phase storage ──
  const phases = { announcement: [], setupCamp: [], nightfall: [], theNight: [], morningRace: [] };

  // ── Wanderers tracker (Phase 1 → Phase 4) ──
  const wanderers = new Set();

  // ── Event density scaling: fewer tribes = more events per tribe ──
  // 2 tribes get bonus events per phase so total matches 3-tribe seasons
  function _bonusEvents(phaseKey, t) {
    if (tribes.length > 2) return; // only fire for 2-tribe seasons
    const members = t.members;
    if (members.length < 3) return;

    // Pick 2 random members for a bonus interaction
    const shuffled = members.slice().sort(() => Math.random() - 0.5);
    const a = shuffled[0], b = shuffled[1];
    const bond = getBond(a, b);
    const aS = pStats(a), bS = pStats(b);
    const aPr = pronouns(a), bPr = pronouns(b);

    // Positive or negative based on existing bond
    if (bond >= 0 && Math.random() < 0.5) {
      // Positive: bonding moment
      const _texts = [
        `${a} and ${b} share a quiet moment away from the group. No strategy — just two people who might actually like each other.`,
        `${b} offers ${a} the last of ${bPr.posAdj} water. Small gesture. ${a} won't forget it.`,
        `${a} catches ${b} staring at the stars. They sit together without talking. Sometimes that's enough.`,
        `${a} and ${b} find common ground over something nobody else cares about. An inside joke forms. The tribe notices.`,
        `${b} stumbles on the trail. ${a} catches ${bPr.obj} without thinking. "Thanks." "Don't mention it." They walk closer after that.`,
      ];
      personalScores[a] = (personalScores[a] || 0) + 0.5;
      personalScores[b] = (personalScores[b] || 0) + 0.5;
      addBond(a, b, 0.3);
      phases[phaseKey].push({
        type: 'soBonding', phase: phaseKey, players: [a, b],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [a]: 0.5, [b]: 0.5 }, badge: 'BONDING', badgeClass: 'gold'
      });
    } else if (bond < 0 || Math.random() < 0.4) {
      // Negative: friction
      const _texts = [
        `${a} and ${b} are not getting along. The looks are getting sharper. Everyone can feel it.`,
        `${b} mutters something about ${a} under ${bPr.posAdj} breath. ${a} hears it. The silence that follows is heavy.`,
        `${a} refuses to walk near ${b}. The tribe has to rearrange. Nobody asks why.`,
        `Something ${a} said earlier is still bothering ${b}. It comes out sideways — a snapped comment, a cold shoulder. The tribe tenses up.`,
        `${a} and ${b} disagree on everything. Water, direction, pace, rest stops. It's exhausting for everyone within earshot.`,
      ];
      personalScores[a] = (personalScores[a] || 0) - 0.3;
      personalScores[b] = (personalScores[b] || 0) - 0.3;
      addBond(a, b, -0.2);
      phases[phaseKey].push({
        type: 'soArgument', phase: phaseKey, players: [a, b],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        personalScores: { [a]: -0.3, [b]: -0.3 }, badge: 'TENSION', badgeClass: 'red'
      });
    }

    // Second bonus: a solo moment for a third member
    if (shuffled.length >= 3) {
      const c = shuffled[2];
      const cS = pStats(c);
      const cPr = pronouns(c);
      if (Math.random() < 0.5) {
        const _soloTexts = [
          `${c} sits apart from the group. Not sulking — thinking. ${cPr.Sub} ${cPr.sub === 'they' ? 'are' : 'is'} playing a longer game than anyone realizes.`,
          `${c} volunteers for every task without being asked. Quiet. Consistent. The tribe doesn't notice yet, but they will.`,
          `${c} takes a walk alone to clear ${cPr.posAdj} head. Comes back sharper. More focused. Something shifted.`,
          `${c} watches the tribe dynamics from the edge of camp. Who talks to whom. Who avoids whom. ${cPr.Sub} ${cPr.sub === 'they' ? 'are' : 'is'} cataloguing it.`,
        ];
        personalScores[c] = (personalScores[c] || 0) + 0.5;
        phases[phaseKey].push({
          type: 'soSneakOff', phase: phaseKey, players: [c],
          text: _soloTexts[Math.floor(Math.random() * _soloTexts.length)],
          personalScores: { [c]: 0.5 }, badge: 'SOLO MOMENT', badgeClass: 'gold'
        });
      }
    }
  }

  // ══ PHASE 1: Announcement + Hike (3-4 events per tribe) ══
  tribes.forEach(t => {
    const nav = navigators[t.name];
    const navS = pStats(nav);
    const members = t.members;

    // Event 1: Navigator leads well or gets confused (proportional — always fires)
    const navScore = navS.mental * 0.06 + navS.intuition * 0.04;
    const navSuccess = Math.random() < navScore;
    const pr = pronouns(nav);
    if (navSuccess) {
      const _navGoodTexts = [
        `${nav} scouts the trail head and reads the map with quiet confidence. The tribe moves efficiently into the forest.`,
        `${nav} sets a brisk pace through the trees. "This way — trust me." The tribe follows without question.`,
        `${nav} spots landmarks the others missed. By midday, the tribe is further ahead than any of them expected.`,
        `${nav} reads the terrain like a book. Every fork, every ridge — ${pr.sub} ${pr.sub === 'they' ? 'know' : 'knows'} which way. The tribe doesn't question it.`,
        `${nav} barely checks the map. ${pr.Sub} ${pr.sub === 'they' ? 'navigate' : 'navigates'} by instinct — sun position, moss growth, wind direction. The tribe arrives early.`,
      ];
      const _txt = _navGoodTexts[_hash(nav + 'navgood', _navGoodTexts.length)];
      personalScores[nav] += 2.0;
      members.filter(m => m !== nav).forEach(m => addBond(m, nav, 0.3));
      if (!gs.playerStates) gs.playerStates = {};
      if (!gs.playerStates[nav]) gs.playerStates[nav] = {};
      gs.playerStates[nav].bigMoves = (gs.playerStates[nav].bigMoves || 0) + 1;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[nav] = (gs.popularity[nav] || 0) + 1; // strong navigator = tribe respects you
      phases.announcement.push({
        type: 'soNavigator', phase: 'announcement', players: [nav],
        text: _txt, personalScores: { [nav]: 2.0 }, badge: 'NAVIGATOR', badgeClass: 'gold'
      });
    } else {
      const _navBadTexts = [
        `${nav} leads the tribe in a wide circle for forty minutes before admitting they're lost. The tribe is not amused.`,
        `"I know exactly where we're going," ${nav} says with total confidence. Twenty minutes later: a dead end.`,
        `${nav} argues with the map. The map wins. The tribe backtracks twice before finding the right trail.`,
        `${nav} keeps squinting at the compass like it's personally offending ${pr.obj}. Eventually ${pr.sub} ${pr.sub === 'they' ? 'hand' : 'hands'} it to someone else. Nobody says anything.`,
        `The trail ${nav} picked looked right on the map. It is not right in real life. The tribe spends an extra hour retracing ${pr.posAdj} steps.`,
      ];
      const _txt = _navBadTexts[_hash(nav + 'navbad', _navBadTexts.length)];
      personalScores[nav] -= 2.0;
      members.filter(m => m !== nav).forEach(m => addBond(m, nav, -0.2));
      phases.announcement.push({
        type: 'soNavigator', phase: 'announcement', players: [nav],
        text: _txt, personalScores: { [nav]: -2.0 }, badge: 'NAVIGATOR', badgeClass: 'red'
      });
    }

    // Event 2: Someone lags behind (proportional — low endurance more likely)
    const laggerCandidates = members.filter(m => m !== nav).sort((a, b) => pStats(a).endurance - pStats(b).endurance);
    const lagger = laggerCandidates[0];
    if (lagger && Math.random() < (10 - pStats(lagger).endurance) * 0.04) {
      const pr = pronouns(lagger);
      const annoyed = members.filter(m => m !== lagger)[Math.floor(Math.random() * (members.length - 1))];
      const _lagTexts = [
        `${lagger} falls behind almost immediately. The tribe slows down for ${pr.obj}. Not everyone looks happy about it.`,
        `${lagger} is laboring on the trail. ${pr.Sub} ${pr.sub === 'they' ? 'stop' : 'stops'} to rest three times before the first mile marker.`,
        `The tribe has to keep waiting for ${lagger} to catch up. Someone mutters something under their breath.`,
        `${lagger} is visibly struggling and knows it. ${pr.Sub} ${pr.sub === 'they' ? 'wave' : 'waves'} the tribe on, then immediately regrets it when nobody waits.`,
        `${lagger} drags ${pr.posAdj} feet along the trail, wheezing. At one point ${pr.sub} ${pr.sub === 'they' ? 'sit' : 'sits'} on a rock. The whole tribe has to stop.`,
      ];
      personalScores[lagger] -= 1.0;
      addBond(annoyed, lagger, -0.2);
      phases.announcement.push({
        type: 'soLagger', phase: 'announcement', players: [lagger, annoyed],
        text: _lagTexts[_hash(lagger + 'lag', _lagTexts.length)],
        personalScores: { [lagger]: -1.0 }, badge: 'FELL BEHIND', badgeClass: 'red'
      });
    }

    // Event 3: Food spotted, OR argument about direction, OR bonding on trail (pick 1 by random)
    const midRoll = Math.random();
    if (midRoll < 0.30) {
      // Food spotted
      const spotter = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      const pr = pronouns(spotter);
      const _foodTexts = [
        `${spotter} spots wild berries off the trail and calls the tribe over. A small windfall — and morale gets a much-needed boost.`,
        `${spotter} notices a stream through the trees. Clean water. The tribe is grateful — and a little impressed.`,
        `${spotter} finds edible mushrooms growing near a fallen log. "These are safe, I'm pretty sure." They are.`,
        `${spotter} peels off the trail and comes back with two handfuls of something edible. Nobody asked. Nobody is complaining.`,
        `${spotter} stops and crouches down mid-hike. "Hold on." ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} back up with wild herbs and something that might be a yam. The tribe is impressed despite themselves.`,
      ];
      personalScores[spotter] += 1.5;
      members.filter(m => m !== spotter).forEach(m => addBond(m, spotter, 0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[spotter] = (gs.popularity[spotter] || 0) + 1;
      tribeFood[t.name] += 1; // forager find on the trail
      phases.announcement.push({
        type: 'soProvider', phase: 'announcement', players: [spotter],
        text: _foodTexts[_hash(spotter + 'food', _foodTexts.length)],
        personalScores: { [spotter]: 1.5 }, badge: 'PROVIDER', badgeClass: 'gold'
      });
    } else if (midRoll < 0.55) {
      // Argument about direction — find two bold players with weak bond
      const boldPairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const bond = getBond(members[i], members[j]);
          const score = (pStats(members[i]).boldness + pStats(members[j]).boldness) * 0.03 + (bond <= 0 ? 0.2 : 0);
          boldPairs.push({ a: members[i], b: members[j], bond, score });
        }
      }
      boldPairs.sort((x, y) => y.score - x.score);
      if (boldPairs.length) {
        const { a, b } = boldPairs[0];
        const _argTexts = [
          `${a} insists the trail veers left. ${b} says right. Neither backs down. Fifteen minutes of arguing later, they go left — and have to backtrack.`,
          `"We've passed that rock before," ${b} says. "We have NOT," ${a} snaps. Someone has to step between them before they come to blows.`,
          `The direction argument between ${a} and ${b} is so heated that the rest of the tribe just sits down and waits it out.`,
          `${a} snatches the map from ${b}. ${b} snatches it back. A brief and extremely undignified tug-of-war happens in the middle of the forest.`,
          `${a} and ${b} have been bickering about the route since the start. It boils over at a fork in the trail. Voices are raised. Gestures are made. The tribe takes the third option and goes around both of them.`,
        ];
        personalScores[a] -= 0.5; personalScores[b] -= 0.5;
        addBond(a, b, -0.3);
        phases.announcement.push({
          type: 'soArgument', phase: 'announcement', players: [a, b],
          text: _argTexts[_hash(a + b + 'arg', _argTexts.length)],
          personalScores: { [a]: -0.5, [b]: -0.5 }, badge: 'ARGUMENT', badgeClass: 'red'
        });
      }
    } else if (midRoll < 0.80) {
      // Bonding on the trail — high social pair
      const bondPairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          if (getBond(members[i], members[j]) < 1) continue;
          const score = (pStats(members[i]).social + pStats(members[j]).social) * 0.04 + Math.random() * 0.5;
          bondPairs.push({ a: members[i], b: members[j], score });
        }
      }
      bondPairs.sort((x, y) => y.score - x.score);
      if (bondPairs.length) {
        const { a, b } = bondPairs[0];
        const _bondTexts = [
          `${a} and ${b} fall back from the group and find their own rhythm on the trail. By the time they catch up, something has solidified between them.`,
          `${a} tells ${b} something they haven't told anyone else yet. The hike is long — there's time for that kind of honesty.`,
          `${b} slows down to walk with ${a}. The rest of the tribe gets ahead of them. Neither seems to mind.`,
          `${a} and ${b} spend two miles talking over each other and finishing each other's sentences. By the end of it they're laughing.`,
          `The trail is long enough that ${a} and ${b} run out of small talk and start saying things they actually mean. The tribe barely notices they've fallen behind.`,
        ];
        personalScores[a] += 0.5; personalScores[b] += 0.5;
        addBond(a, b, 0.4);
        phases.announcement.push({
          type: 'soTrailBond', phase: 'announcement', players: [a, b],
          text: _bondTexts[_hash(a + b + 'bond', _bondTexts.length)],
          personalScores: { [a]: 0.5, [b]: 0.5 }, badge: 'TRAIL TALK', badgeClass: 'gold'
        });
      }
    }

    // Event 4: Scary noise OR someone wanders off
    const lateRoll = Math.random();
    if (lateRoll < 0.25) {
      // Someone wanders off — low loyalty + boldness
      const wanderCandidates = members.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return ((10 - sA.loyalty) * 0.03 + sA.boldness * 0.02) - ((10 - sB.loyalty) * 0.03 + sB.boldness * 0.02);
      }).reverse();
      const arch0 = players.find(p => p.name === wanderCandidates[0])?.archetype || '';
      const wanderer = wanderCandidates[0];
      if (wanderer && Math.random() < (10 - pStats(wanderer).loyalty) * 0.03 + pStats(wanderer).boldness * 0.02) {
        wanderers.add(wanderer);
        const pr = pronouns(wanderer);
        const _wanderTexts = [
          `${wanderer} spots something glinting off the trail and drifts away to investigate. By the time anyone notices, ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} nowhere to be seen.`,
          `${wanderer} wasn't paying attention to the group. Now ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} following a different trail entirely. ${pr.Sub} catches up eventually, but everyone noticed.`,
          `"I'm just checking something," ${wanderer} says, veering off into the brush. ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} back looking guilty.`,
          `${wanderer} disappears between two trees and doesn't reappear. The tribe spends several confusing minutes trying to figure out where ${pr.sub} went. ${pr.Sub} ${pr.sub === 'they' ? 'emerge' : 'emerges'} from completely the wrong direction.`,
          `One minute ${wanderer} is right there. The next — gone. The tribe calls ${pr.posAdj} name twice before ${pr.sub} ${pr.sub === 'they' ? 'answer' : 'answers'} from somewhere inexplicably far away.`,
        ];
        personalScores[wanderer] -= 1.5;
        phases.announcement.push({
          type: 'soWanderedOff', phase: 'announcement', players: [wanderer],
          text: _wanderTexts[_hash(wanderer + 'wander', _wanderTexts.length)],
          personalScores: { [wanderer]: -1.5 }, badge: 'WANDERED OFF', badgeClass: 'red'
        });
      }
    } else if (lateRoll < 0.70) {
      // Scary noise — boldest player is brave, least bold panics
      const sorted = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
      const brave = sorted[0], panicker = sorted[sorted.length - 1];
      if (brave && panicker && brave !== panicker) {
        const prPanic = pronouns(panicker);
        const _noiseTexts = [
          `Something large moves in the bushes. ${panicker} grabs ${prPanic.posAdj} tribemate. ${brave} steps forward without hesitation. It's a squirrel.`,
          `A crashing sound from the trees sends ${panicker} scrambling backward into ${brave}, who looks almost amused.`,
          `${panicker} hears it first. "DID YOU HEAR THAT?" ${brave} walks toward the sound. It's a fallen branch. ${panicker}'s pulse takes a while to settle.`,
          `Something in the brush makes a noise that has no good explanation. ${panicker} goes absolutely still. ${brave} picks up a rock and walks toward it, looking unbothered.`,
          `${panicker} grabs ${brave}'s sleeve and ${brave} just pats ${prPanic.posAdj} hand and keeps walking. Whatever it is, ${brave} is going to find it. It turns out to be a bird.`,
        ];
        personalScores[panicker] -= 0.5; personalScores[brave] += 0.5;
        addBond(brave, panicker, 0.3);
        phases.announcement.push({
          type: 'soScaryNoise', phase: 'announcement', players: [panicker, brave],
          text: _noiseTexts[_hash(panicker + brave + 'noise', _noiseTexts.length)],
          personalScores: { [panicker]: -0.5, [brave]: 0.5 }, badge: 'SCARY NOISE', badgeClass: 'gold'
        });
      }
    }

    // Event 5 (NEW): Tribe Morale — high social player boosts spirits on the trail
    const moraleBoosters = members.filter(m => m !== nav).sort((a, b) => pStats(b).social - pStats(a).social);
    const booster = moraleBoosters[0];
    if (booster && Math.random() < pStats(booster).social * 0.04) {
      const _moraleTexts = [
        `${booster} starts a chant on the trail. Silly at first — then everyone joins in. The hike feels shorter.`,
        `${booster} cracks jokes the whole way. By the time they arrive, the tribe is laughing instead of complaining.`,
        `${booster} keeps the energy up. Checks on stragglers. Shares water. The tribe arrives as a unit.`,
        `${booster} turns a brutal uphill stretch into something almost fun — pure force of personality. The grumbling dies down.`,
        `When spirits start to flag, ${booster} is the first one talking. ${pronouns(booster).Sub} ${pronouns(booster).sub === 'they' ? 'don\'t' : 'doesn\'t'} let anyone spiral. By the end of the hike, the tribe feels weirdly bonded.`,
      ];
      personalScores[booster] = (personalScores[booster] || 0) + 1.0;
      members.filter(m => m !== booster).forEach(m => addBond(m, booster, 0.2));
      phases.announcement.push({
        type: 'soMorale', phase: 'announcement', players: [booster],
        text: _moraleTexts[_hash(booster + 'morale', _moraleTexts.length)],
        personalScores: { [booster]: 1.0 }, badge: 'MORALE BOOST', badgeClass: 'gold'
      });
    }
  });

  // Bonus events for 2-tribe seasons (Phase 1)
  tribes.forEach(t => _bonusEvents('announcement', t));
  _snapCamp('setupCamp'); // baseline before camp setup

  // ══ PHASE 2: Setup Camp (3-4 events per tribe) ══
  tribes.forEach(t => {
    const members = t.members;

    // Event 1: Shelter building — top 2 by endurance+mental
    const builders = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.endurance * 0.04 + sB.mental * 0.03) - (sA.endurance * 0.04 + sA.mental * 0.03);
    }).slice(0, 2);
    const _shelterTexts = [
      `${builders[0]} and ${builders[1]} take charge of shelter construction. By sunset, they have something that might actually keep the rain out.`,
      `${builders.join(' and ')} build the shelter frame while the others gather materials. It goes up faster than expected.`,
      `${builders[0]} drives the construction while ${builders[1]} follows ${pronouns(builders[0]).posAdj} lead. The structure holds.`,
      `${builders[0]} and ${builders[1]} spend two hours engineering a shelter that's more ambitious than it had any right to be. The tribe looks genuinely surprised.`,
      `Nobody asks ${builders[0]} and ${builders[1]} to take the lead — they just do it. The shelter is up before the others are done arguing about where to put it.`,
    ];
    builders.forEach(b => {
      personalScores[b] += 2.0;
      members.filter(m => m !== b).forEach(m => addBond(m, b, 0.2));
    });
    campQuality[t.name] += 1.0; // good shelter improves camp
    phases.setupCamp.push({
      type: 'soShelter', phase: 'setupCamp', players: [...builders],
      text: _shelterTexts[_hash(builders.join('') + 'shelter', _shelterTexts.length)],
      personalScores: Object.fromEntries(builders.map(b => [b, 2.0])),
      badge: 'SHELTER BUILT', badgeClass: 'gold'
    });

    // Event 2: Fire starting — highest mental+boldness
    const fireStarter = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.mental * 0.05 + sB.boldness * 0.02) - (sA.mental * 0.05 + sA.boldness * 0.02);
    })[0];
    if (fireStarter) {
      const _fireTexts = [
        `${fireStarter} gets the fire going on the third try. The tribe presses in close, grateful for the warmth.`,
        `${fireStarter} builds a fire with deliberate calm — flint, tinder, patience. The first flame catches to scattered applause.`,
        `Everyone watches ${fireStarter} work the fire bow for fifteen minutes before smoke turns to flame. Someone starts cheering.`,
        `${fireStarter} gets a spark on the first try and nurses it into a proper fire in under five minutes. Nobody comments — but everyone notices.`,
        `The damp wood makes it hard. ${fireStarter} doesn't give up. Twenty-two minutes in, ${pronouns(fireStarter).sub === 'they' ? 'they have' : pronouns(fireStarter).sub + ' has'} a fire. The tribe huddles around it immediately.`,
      ];
      const pr = pronouns(fireStarter);
      personalScores[fireStarter] += 1.5;
      members.filter(m => m !== fireStarter).forEach(m => addBond(m, fireStarter, 0.3));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[fireStarter] = (gs.popularity[fireStarter] || 0) + 1;
      campQuality[t.name] += 0.5; // fire improves camp
      phases.setupCamp.push({
        type: 'soFire', phase: 'setupCamp', players: [fireStarter],
        text: _fireTexts[_hash(fireStarter + 'fire', _fireTexts.length)],
        personalScores: { [fireStarter]: 1.5 }, badge: 'FIRE STARTED', badgeClass: 'gold'
      });
    }

    // Event 3: Refuses to help OR division of labor argument (proportional)
    const slackerCandidates = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return ((10 - sB.loyalty) * 0.04 + (10 - sB.social) * 0.02) - ((10 - sA.loyalty) * 0.04 + (10 - sA.social) * 0.02);
    });
    const slacker = slackerCandidates[0];
    const slackerArch = players.find(p => p.name === slacker)?.archetype || '';
    const slackerChance = (10 - pStats(slacker).loyalty) * 0.04 + (10 - pStats(slacker).social) * 0.02;

    if (Math.random() < slackerChance * 0.4 && !NICE_ARCHS.has(slackerArch)) {
      const pr = pronouns(slacker);
      const _slackerTexts = [
        `${slacker} finds a comfortable log and sits on it while everyone else works. Eventually someone snaps, "Are you going to help or what?" ${pr.Sub} ${pr.sub === 'they' ? 'shrug' : 'shrugs'}.`,
        `${slacker} disappears for two hours and returns when the shelter is already up. "It looks great, you guys." No one says anything.`,
        `While the tribe builds camp, ${slacker} is nowhere to be found. ${pr.Sub} shows up for dinner, though. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} always there for dinner.`,
        `${slacker} makes a very great show of helping for about six minutes, then quietly stops. ${pr.Sub} ${pr.sub === 'they' ? 'hope' : 'hopes'} nobody noticed. Several people noticed.`,
        `${slacker} announces that ${pr.sub} ${pr.sub === 'they' ? 'need' : 'needs'} to "survey the area" and walks off. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} gone for forty minutes. The tribe finishes camp without ${pr.obj}.`,
      ];
      personalScores[slacker] -= 1.5;
      members.filter(m => m !== slacker).forEach(m => addBond(m, slacker, -0.3));
      if (!gs._suckyOutdoorsHeat) gs._suckyOutdoorsHeat = {};
      gs._suckyOutdoorsHeat[slacker] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      phases.setupCamp.push({
        type: 'soSlacker', phase: 'setupCamp', players: [slacker],
        text: _slackerTexts[_hash(slacker + 'slacker', _slackerTexts.length)],
        personalScores: { [slacker]: -1.5 }, badge: 'SLACKER', badgeClass: 'red'
      });
    } else if (Math.random() < 0.30) {
      // Division of labor argument
      const laborPairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const score = ((10 - pStats(members[i]).loyalty) * 0.03 + pStats(members[i]).boldness * 0.03)
                      + ((10 - pStats(members[j]).loyalty) * 0.03 + pStats(members[j]).boldness * 0.03);
          laborPairs.push({ a: members[i], b: members[j], score });
        }
      }
      laborPairs.sort((x, y) => y.score - x.score);
      if (laborPairs.length) {
        const { a, b } = laborPairs[0];
        const _laborTexts = [
          `${a} thinks ${b} should be hauling water. ${b} thinks ${a} should. The argument is circular and loud and ends with both of them hauling water.`,
          `The work distribution is a sore subject. ${a} and ${b} debate whose job is harder for ten minutes before the tribe intervenes.`,
          `"That's not what I said I'd do," ${b} tells ${a}. "That's literally exactly what you said," ${a} says. They don't agree.`,
          `${a} keeps score on who has done what. ${b} keeps a different score. The two numbers do not match and they are both very sure they're right.`,
          `${a} drops what ${pronouns(a).sub === 'they' ? 'they\'re' : pronouns(a).sub + '\'re'} doing and tells ${b} to do it instead. ${b} says ${pronouns(b).sub === 'they' ? 'they have' : pronouns(b).sub + ' has'} their own job. Neither task gets done for a while.`,
        ];
        personalScores[a] -= 0.5; personalScores[b] -= 0.5;
        addBond(a, b, -0.3);
        phases.setupCamp.push({
          type: 'soLaborArg', phase: 'setupCamp', players: [a, b],
          text: _laborTexts[_hash(a + b + 'labor', _laborTexts.length)],
          personalScores: { [a]: -0.5, [b]: -0.5 }, badge: 'ARGUMENT', badgeClass: 'red'
        });
      }
    }

    // Event 4: Shelter collapses — worst builder takes the hit (proportional)
    const worstBuilder = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sA.mental - sB.mental); // lowest mental first
    })[0];
    if (worstBuilder && Math.random() < (10 - pStats(worstBuilder).mental) * 0.03) {
      const pr = pronouns(worstBuilder);
      const _collapseTexts = [
        `The wall ${worstBuilder} reinforced collapses in the middle of the night. The tribe scrambles to fix it. Everyone knows whose work it was.`,
        `${worstBuilder}'s section of the shelter gives way before they even finish eating dinner. "I can fix it," ${pr.sub} says. ${pr.Sub} cannot fix it.`,
        `Something ${worstBuilder} did wrong becomes apparent around 2am when the roof comes down on three people.`,
        `${worstBuilder} tied the knots on ${pr.posAdj} section. They come undone two hours into the night. The shelter lists, then leans, then gives.`,
        `The supporting pole ${worstBuilder} planted is about four inches short of the ground. This becomes everyone's problem at midnight.`,
      ];
      personalScores[worstBuilder] -= 1.0;
      members.filter(m => m !== worstBuilder).forEach(m => addBond(m, worstBuilder, -0.2));
      campQuality[t.name] -= 1.5; // shelter failure significantly hurts camp
      phases.setupCamp.push({
        type: 'soCollapse', phase: 'setupCamp', players: [worstBuilder],
        text: _collapseTexts[_hash(worstBuilder + 'collapse', _collapseTexts.length)],
        personalScores: { [worstBuilder]: -1.0 }, badge: 'SHELTER FAIL', badgeClass: 'red'
      });
    }

    // Event 5: Food hunt (fishing or foraging — proportional, ~50% chance)
    if (Math.random() < 0.50) {
      const fishRoll = Math.random() < 0.5;
      if (fishRoll) {
        const fisher = members.slice().sort((a, b) => {
          const sA = pStats(a), sB = pStats(b);
          return (sB.physical * 0.04 + sB.intuition * 0.03) - (sA.physical * 0.04 + sA.intuition * 0.03);
        })[0];
        if (fisher) {
          const pr = pronouns(fisher);
          const _fishTexts = [
            `${fisher} builds a makeshift fishing trap from supplies in ${pr.posAdj} pack and hauls out enough to feed everyone. The tribe is stunned.`,
            `${fisher} wades into the stream with ${pr.posAdj} bare hands and actually catches something. Multiple times. The tribe roasts fish over the fire.`,
            `${fisher} rigs up a crude rod from a stick and some cordage and spends two hours fishing. ${pr.Sub} comes back with dinner.`,
            `${fisher} disappears to the creek for an hour. ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} back carrying enough fish to make the tribe go quiet with something resembling gratitude.`,
            `"I know how to catch fish," ${fisher} says, and then goes and proves it. Three, cleaned and ready to cook. The tribe eats well.`,
          ];
          personalScores[fisher] += 1.5;
          members.filter(m => m !== fisher).forEach(m => addBond(m, fisher, 0.3));
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[fisher] = (gs.popularity[fisher] || 0) + 2;
          tribeFood[t.name] += 2; // fishing provides more food
          phases.setupCamp.push({
            type: 'soProvider', phase: 'setupCamp', players: [fisher],
            text: _fishTexts[_hash(fisher + 'fish', _fishTexts.length)],
            personalScores: { [fisher]: 1.5 }, badge: 'PROVIDER', badgeClass: 'gold'
          });
        }
      } else {
        const forager = members.slice().sort((a, b) => {
          const sA = pStats(a), sB = pStats(b);
          return (sB.intuition * 0.04 + sB.mental * 0.02) - (sA.intuition * 0.04 + sA.mental * 0.02);
        })[0];
        if (forager) {
          const pr = pronouns(forager);
          const _forageTexts = [
            `${forager} wanders into the tree line and comes back with an armful of edible plants and roots. Not glamorous, but it's dinner.`,
            `${forager} identifies three edible species off the trail. The tribe eats well — better than they expected on night one.`,
            `${forager} pulls out plants from ${pr.posAdj} pack they gathered on the hike. "I was saving these." Smart.`,
            `${forager} spends an hour working the perimeter of camp, picking things that look awful and taste edible. The tribe is fed. Nobody says thank you loudly enough.`,
            `${forager} lays out everything ${pr.sub} ${pr.sub === 'they' ? 'found' : 'found'} like a tiny market stall. It's not much but it fills the gap. The tribe seems impressed.`,
          ];
          personalScores[forager] += 1.0;
          members.filter(m => m !== forager).forEach(m => addBond(m, forager, 0.2));
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[forager] = (gs.popularity[forager] || 0) + 2;
          tribeFood[t.name] += 1; // foraging provides some food
          phases.setupCamp.push({
            type: 'soProvider', phase: 'setupCamp', players: [forager],
            text: _forageTexts[_hash(forager + 'forage', _forageTexts.length)],
            personalScores: { [forager]: 1.0 }, badge: 'PROVIDER', badgeClass: 'gold'
          });
        }
      }
    }

    // Event 6 (NEW): Campsite Argument — who gets the best sleeping spot
    const spotFighters = members.filter(m => pStats(m).boldness * 0.03 + (10 - pStats(m).social) * 0.02 > Math.random() * 0.8);
    if (spotFighters.length >= 2) {
      const f1 = spotFighters[0], f2 = spotFighters[1];
      const _spotTexts = [
        `${f1} and ${f2} argue about who gets the spot closest to the fire. It gets personal fast.`,
        `"I built the shelter, I pick my spot." ${f2} disagrees. Loudly.`,
        `${f1} claims the driest corner. ${f2} was already lying there. Neither moves.`,
        `${f1} marks out a sleeping spot with their pack. ${f2} puts their pack there too. A standoff develops.`,
        `The best spot in the shelter — close to the fire, away from the drafty wall — is claimed by both ${f1} and ${f2} simultaneously. The subsequent negotiation is unpleasant.`,
      ];
      personalScores[f1] = (personalScores[f1] || 0) - 0.5;
      personalScores[f2] = (personalScores[f2] || 0) - 0.5;
      addBond(f1, f2, -0.2);
      phases.setupCamp.push({
        type: 'soArgument', phase: 'setupCamp', players: [f1, f2],
        text: _spotTexts[_hash(f1 + f2 + 'spot', _spotTexts.length)],
        personalScores: { [f1]: -0.5, [f2]: -0.5 }, badge: 'ARGUMENT', badgeClass: 'red'
      });
    }

    // Event (NEW): Extra Foraging — ~40% chance, intuition-weighted
    if (Math.random() < 0.40) {
      const extraForager = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (extraForager) {
        const pr = pronouns(extraForager);
        const _extraForageTexts = [
          `${extraForager} slips away from camp construction and returns with wild roots and something leafy and edible. Nobody asked. The tribe eats better for it.`,
          `While others build, ${extraForager} scouts the camp perimeter. ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} back carrying dinner. The tribe's mood lifts immediately.`,
          `${extraForager} has an eye for what grows where. A twenty-minute sweep of the tree line and ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} enough supplemental food to make the night bearable.`,
          `"I found something," ${extraForager} announces, holding up a tangle of edible plants. Nobody had asked ${pr.obj} to look. ${pr.Sub} ${pr.sub === 'they' ? 'went' : 'went'} anyway. The tribe is quietly grateful.`,
          `${extraForager} doesn't announce ${pr.posAdj} find — just sets it by the fire. The tribe notices. The tribe helps themselves. A small kindness.`,
        ];
        personalScores[extraForager] = (personalScores[extraForager] || 0) + 1.0;
        members.filter(m => m !== extraForager).forEach(m => addBond(m, extraForager, 0.2));
        tribeFood[t.name] += 1;
        phases.setupCamp.push({
          type: 'soForage', phase: 'setupCamp', players: [extraForager],
          text: _extraForageTexts[_hash(extraForager + 'extraforage', _extraForageTexts.length)],
          personalScores: { [extraForager]: 1.0 }, badge: 'FORAGER', badgeClass: 'gold'
        });
      }
    }

    // Event (NEW): Leadership Clash — ~30% chance, needs 4+ members, 2 high-strategic players
    if (members.length >= 4 && Math.random() < 0.30) {
      const clashCandidates = members.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      const cl1 = clashCandidates[0], cl2 = clashCandidates[1];
      if (cl1 && cl2 && pStats(cl1).strategic >= 5 && pStats(cl2).strategic >= 5) {
        const winner2 = pStats(cl1).social >= pStats(cl2).social ? cl1 : cl2;
        const loser2 = winner2 === cl1 ? cl2 : cl1;
        const clBond = getBond(cl1, cl2);
        const bondDmg = clBond >= 2 ? -0.1 : -0.3; // allies hurt less, rivals more
        const areAllies = clBond >= 2;
        const pr1 = pronouns(winner2); const pr2 = pronouns(loser2);
        const _clashAlliesTexts = [
          `${winner2} and ${loser2} are both natural leaders — and they both know it. The argument over camp layout is polite on the surface and absolutely not polite underneath. ${winner2} wins out. ${loser2} steps back, barely.`,
          `${loser2} has a vision for the camp. So does ${winner2}. The difference is ${winner2} is louder about it. The tribe follows ${pr1.obj}. ${loser2} doesn't say a word — but ${pr2.posAdj} jaw is tight.`,
          `"That's not where I'd put the fire," ${loser2} says. "I know," says ${winner2}, already building it somewhere else. The tribe watches. Nobody says anything.`,
        ];
        const _clashRivalsTexts = [
          `${winner2} and ${loser2} haven't agreed on anything since day one. Camp setup is no exception. The argument gets loud. Others drift away. ${winner2} takes control of the layout. ${loser2} sulks.`,
          `${loser2} challenges ${winner2}'s plan in front of everyone. ${winner2} dismantles it point by point, calmly. ${loser2} looks like ${pr2.sub} ${pr2.sub === 'they' ? 'want' : 'wants'} to disappear into the ground.`,
          `The leadership clash between ${winner2} and ${loser2} has been brewing. It breaks open now, over something as small as shelter orientation. ${winner2} wins. The damage is done.`,
        ];
        const _clashTexts = areAllies ? _clashAlliesTexts : _clashRivalsTexts;
        personalScores[winner2] = (personalScores[winner2] || 0) + 1.0;
        personalScores[loser2] = (personalScores[loser2] || 0) - 0.5;
        addBond(cl1, cl2, bondDmg);
        phases.setupCamp.push({
          type: 'soLeaderClash', phase: 'setupCamp', players: [winner2, loser2],
          text: _clashTexts[_hash(winner2 + loser2 + 'clash', _clashTexts.length)],
          personalScores: { [winner2]: 1.0, [loser2]: -0.5 }, badge: 'POWER STRUGGLE', badgeClass: 'red'
        });
      }
    }

    // Event (NEW): Injury — ~20% chance, physical >= 5 candidates
    if (Math.random() < 0.20) {
      const injuryCandidates = members.slice().sort((a, b) => pStats(a).physical - pStats(b).physical);
      // Weight toward lower-physical players (more likely to hurt themselves)
      const injuryRoll = Math.random();
      const injuredIdx = injuryRoll < 0.5 ? 0 : injuryRoll < 0.8 ? 1 : 2;
      const injured = injuryCandidates[Math.min(injuredIdx, injuryCandidates.length - 1)];
      if (injured && Math.random() < (10 - pStats(injured).physical) * 0.04) {
        const pr = pronouns(injured);
        const _injuryTexts = [
          `${injured} slices ${pr.posAdj} hand on a sharp branch while gathering firewood. ${pr.Sub} ${pr.sub === 'they' ? 'wrap' : 'wraps'} it tight and keep${pr.sub === 'they' ? '' : 's'} working. But it's going to be a problem in the morning.`,
          `${injured} twists ${pr.posAdj} ankle jumping down from a rocky ledge at camp. ${pr.Sub} insists ${pr.sub === 'they' ? 'they\'re' : pr.sub + '\'s'} fine. The wince says otherwise.`,
          `${injured} pulls something in ${pr.posAdj} shoulder hauling logs. ${pr.Sub} shakes it off during setup. The race will tell a different story.`,
          `A misstep near the campfire and ${injured} catches ${pr.posAdj} arm on a hot stone. ${pr.Sub} bites down hard. "I'm good." ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not entirely good.`,
        ];
        personalScores[injured] = (personalScores[injured] || 0) - 1.0;
        ep._soInjured[injured] = true;
        phases.setupCamp.push({
          type: 'soInjury', phase: 'setupCamp', players: [injured],
          text: _injuryTexts[_hash(injured + 'injury', _injuryTexts.length)],
          personalScores: { [injured]: -1.0 }, badge: 'INJURED', badgeClass: 'red'
        });
      }
    }
  });

  // Bonus events for 2-tribe seasons (Phase 2)
  tribes.forEach(t => _bonusEvents('setupCamp', t));
  _snapCamp('nightfall'); // after camp built, before nightfall

  // ══ PHASE 3: Nightfall (4-5 events per tribe) ══
  tribes.forEach(t => {
    const members = t.members;
    let nightfallCount = 0;
    const maxNightfall = 4 + (Math.random() < 0.5 ? 1 : 0);

    // Ghost story — highest boldness+social tells it
    if (nightfallCount < maxNightfall) {
      const storyteller = members.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.boldness * 0.04 + sB.social * 0.03) - (sA.boldness * 0.04 + sA.social * 0.03);
      })[0];
      if (storyteller) {
        const pr = pronouns(storyteller);
        const _ghostTexts = [
          `${storyteller} waits until the fire is low and everyone is settled. Then ${pr.sub} ${pr.sub === 'they' ? 'start' : 'starts'}: "There's a story about these woods…" Nobody sleeps well after.`,
          `${storyteller} tells a ghost story with unsettling specificity. ${pr.Sub} ${pr.sub === 'they' ? 'make' : 'makes'} eye contact with different people at the worst moments. Someone shrieks.`,
          `The ghost story ${storyteller} tells is technically about a different forest. But somehow every detail matches exactly where they are. No one says anything.`,
          `${storyteller} starts quietly. The kind of story where you don't realize you're leaning in until you're already too close. By the end, no one moves.`,
          `"I'm only going to tell this once," ${storyteller} says. Good. Once is enough. Two people claim they're not scared. They are.`,
        ];
        personalScores[storyteller] += 1.0;
        members.filter(m => m !== storyteller).forEach(m => addBond(m, storyteller, 0.2));
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[storyteller] = (gs.popularity[storyteller] || 0) + 1;

        // Scared reaction — least bold player
        const scaredPlayer = members.filter(m => m !== storyteller).sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
        if (scaredPlayer) {
          const prSc = pronouns(scaredPlayer);
          const scoreChanges = { [storyteller]: 1.0, [scaredPlayer]: -0.5 };
          personalScores[scaredPlayer] -= 0.5;
          phases.nightfall.push({
            type: 'soGhostStory', phase: 'nightfall', players: [storyteller, scaredPlayer],
            text: _ghostTexts[_hash(storyteller + 'ghost', _ghostTexts.length)] + ` ${scaredPlayer} ${prSc.sub === 'they' ? 'don\'t' : 'doesn\'t'} think it\'s funny.`,
            personalScores: scoreChanges, badge: 'GHOST STORY', badgeClass: 'gold'
          });
        } else {
          phases.nightfall.push({
            type: 'soGhostStory', phase: 'nightfall', players: [storyteller],
            text: _ghostTexts[_hash(storyteller + 'ghost', _ghostTexts.length)],
            personalScores: { [storyteller]: 1.0 }, badge: 'GHOST STORY', badgeClass: 'gold'
          });
        }
        nightfallCount++;
      }
    }

    // Fireside bonding — highest social pair
    if (nightfallCount < maxNightfall) {
      const firesidePairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          firesidePairs.push({ a: members[i], b: members[j], score: (pStats(members[i]).social + pStats(members[j]).social) * 0.05 + Math.random() * 0.5 });
        }
      }
      firesidePairs.sort((x, y) => y.score - x.score);
      if (firesidePairs.length) {
        const { a, b } = firesidePairs[0];
        const _fsTexts = [
          `${a} and ${b} stay up after everyone else turns in. The fire pops. They talk until it goes out.`,
          `${a} sits close to ${b} by the fire. Something about the dark and the warmth makes honesty come easy.`,
          `${b} and ${a} watch the sparks rise and talk about things they haven't told their other tribemates. The night holds everything still.`,
          `Everyone else falls asleep. ${a} and ${b} stay where they are, voices low, fire small. The conversation feels like a different world from the game.`,
          `${a} pokes at the fire. ${b} says something surprising. ${a} says something back. They stay out there for a long time.`,
        ];
        personalScores[a] += 0.5; personalScores[b] += 0.5;
        addBond(a, b, 0.5);
        phases.nightfall.push({
          type: 'soFireside', phase: 'nightfall', players: [a, b],
          text: _fsTexts[_hash(a + b + 'fireside', _fsTexts.length)],
          personalScores: { [a]: 0.5, [b]: 0.5 }, badge: 'FIRESIDE', badgeClass: 'gold'
        });
        // Romance spark check — fireside bonding can turn romantic
        _challengeRomanceSpark(a, b, ep, 'nightfall', phases, personalScores, 'fireside moment');
        nightfallCount++;
      }
    }

    // Showmance moment — existing showmance or romanticCompat pair
    if (nightfallCount < maxNightfall && Math.random() < 0.40) {
      const existingShowmance = (gs.showmances || []).find(sm =>
        sm.phase !== 'broken-up' && sm.phase !== 'faded' &&
        members.includes(sm.players[0]) && members.includes(sm.players[1])
      );
      if (existingShowmance) {
        const [sa, sb] = existingShowmance.players;
        const _showTexts = [
          `${sa} and ${sb} drift away from the group when the fire dies down. They come back looking suspiciously content.`,
          `${sb} leans on ${sa} by the fire. Everyone sees it. Nobody says anything — yet.`,
          `Under a sky full of stars, ${sa} and ${sb} find a quiet corner of camp. It's disgustingly sweet.`,
          `${sa} and ${sb} take the longest possible route to get water and somehow nobody says anything about how long they were gone.`,
          `The whole tribe can see it. ${sa} and ${sb} are not being subtle. Someone sighs. Someone else rolls their eyes. The two of them don't notice.`,
        ];
        personalScores[sa] += 0.5; personalScores[sb] += 0.5;
        addBond(sa, sb, 0.3);
        phases.nightfall.push({
          type: 'soShowmance', phase: 'nightfall', players: [sa, sb],
          text: _showTexts[_hash(sa + sb + 'show', _showTexts.length)],
          personalScores: { [sa]: 0.5, [sb]: 0.5 }, badge: 'MOMENT', badgeClass: 'gold'
        });
        nightfallCount++;
      }
    }

    // Prank — NOT nice archetypes
    if (nightfallCount < maxNightfall && Math.random() < 0.25) {
      const prankCandidates = members.filter(m => {
        const arch = players.find(p => p.name === m)?.archetype || '';
        return !NICE_ARCHS.has(arch);
      }).sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.boldness * 0.04 + (10 - sB.loyalty) * 0.02) - (sA.boldness * 0.04 + (10 - sA.loyalty) * 0.02);
      });
      if (prankCandidates.length) {
        const prankster = prankCandidates[0];
        const target = members.filter(m => m !== prankster)[Math.floor(Math.random() * (members.length - 1))];
        if (target) {
          const prP = pronouns(prankster);
          const _prankTexts = [
            `${prankster} waits until ${target} is asleep and puts something cold on ${pronouns(target).posAdj} face. The scream that follows wakes the entire camp.`,
            `${prankster} rearranges ${target}'s pack while ${pronouns(target).sub} sleeps. ${target} won't find everything for three days.`,
            `${prankster} makes an unsettling noise outside the shelter. The chaos ${prP.sub} ${prP.sub === 'they' ? 'cause' : 'causes'} is considerable. ${prP.Sub} ${prP.sub === 'they' ? 'think' : 'thinks'} it's hilarious. ${target} does not.`,
            `${prankster} moves ${target}'s shoes three feet away while ${pronouns(target).sub} sleeps. ${target} finds this out at 4am in the dark. The language used is not appropriate.`,
            `${prankster} ties a knot in ${target}'s sleeping bag. A masterclass in pettiness. ${prP.Sub} ${prP.sub === 'they' ? 'are' : 'is'} very proud. ${target} is furious.`,
          ];
          personalScores[prankster] -= 1.0;
          addBond(target, prankster, -0.4);
          if (!gs._suckyOutdoorsHeat) gs._suckyOutdoorsHeat = {};
          gs._suckyOutdoorsHeat[prankster] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[prankster] = (gs.popularity[prankster] || 0) - 1;
          phases.nightfall.push({
            type: 'soPrank', phase: 'nightfall', players: [prankster, target],
            text: _prankTexts[_hash(prankster + target + 'prank', _prankTexts.length)],
            personalScores: { [prankster]: -1.0 }, badge: 'PRANK', badgeClass: 'red'
          });
          nightfallCount++;
        }
      }
    }

    // Strategic whispers — NOT nice archetypes
    if (nightfallCount < maxNightfall && Math.random() < 0.35) {
      const schemers = members.filter(m => {
        const arch = players.find(p => p.name === m)?.archetype || '';
        return !NICE_ARCHS.has(arch) && (pStats(m).strategic >= 5 || ['schemer','mastermind','villain','chaos-agent'].includes(arch));
      }).sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      if (schemers.length) {
        const schemer = schemers[0];
        const pr = pronouns(schemer);
        const confideeTo = members.filter(m => m !== schemer).sort((a, b) => getBond(schemer, b) - getBond(schemer, a))[0];

        // Overheard check — highest intuition non-participant
        const eavesdroppers = members.filter(m => m !== schemer && m !== confideeTo);
        const overheard = eavesdroppers.length && Math.random() < pStats(eavesdroppers.sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0]).intuition * 0.04;
        const hearer = overheard ? eavesdroppers[0] : null;

        if (confideeTo) {
          const _schemeTexts = [
            `${schemer} waits until the tribe settles, then leans over to ${confideeTo}. Something is being planned. The fire masks their voices — mostly.`,
            `${schemer} has been watching. Now ${pr.sub} ${pr.sub === 'they' ? 'talk' : 'talks'} to ${confideeTo} in the dark, laying out a quiet strategy.`,
            `${schemer} and ${confideeTo} aren't sleeping. They're planning. Out here, with nothing to do but sit and think, strategy fills the silence.`,
            `${schemer} keeps ${pr.posAdj} voice low and ${pr.posAdj} eyes on the camp. ${confideeTo} nods slowly. Something is being put in motion.`,
            `The fire crackles. Everyone else is asleep. ${schemer} starts talking to ${confideeTo} and doesn't stop for twenty minutes. It's clearly important. And it's clearly not good for someone.`,
          ];
          personalScores[schemer] += 0.5;
          const evtPlayers = hearer ? [schemer, confideeTo, hearer] : [schemer, confideeTo];
          const evtScores = { [schemer]: 0.5 };
          if (hearer) {
            personalScores[hearer] += 0.5;
            personalScores[schemer] -= 0.5;
            evtScores[hearer] = 0.5;
            evtScores[schemer] = -0.5;
            addBond(hearer, schemer, -0.4);
          }
          phases.nightfall.push({
            type: hearer ? 'soOverheard' : 'soScheme', phase: 'nightfall', players: evtPlayers,
            text: _schemeTexts[_hash(schemer + 'scheme', _schemeTexts.length)] + (hearer ? ` ${hearer} catches just enough to understand what's happening.` : ''),
            personalScores: evtScores, badge: hearer ? 'OVERHEARD' : 'SCHEMING', badgeClass: hearer ? 'red' : 'gold'
          });
          nightfallCount++;
        }
      }
    }

    // Stargazing confession — highest social+temperament pair (if slots remain)
    if (nightfallCount < maxNightfall && Math.random() < 0.30) {
      const starPairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const score = (pStats(members[i]).social * 0.03 + pStats(members[i]).temperament * 0.03)
                      + (pStats(members[j]).social * 0.03 + pStats(members[j]).temperament * 0.03)
                      + Math.random() * 0.5;
          starPairs.push({ a: members[i], b: members[j], score });
        }
      }
      starPairs.sort((x, y) => y.score - x.score);
      if (starPairs.length) {
        const { a, b } = starPairs[0];
        const _romanceOn = seasonConfig.romance !== 'disabled';
        const _starTexts = _romanceOn ? [
          `${a} and ${b} lie on their backs looking up. Far from camp, far from the game. ${a} says something real. ${b} responds in kind.`,
          `The stars are out, fully. ${b} points out a constellation. ${a} tells ${pronouns(b).obj} something ${pronouns(a).sub === 'they' ? 'they\'ve' : 'they\'ve'} never told anyone out here.`,
          `${a} and ${b} stay outside the shelter long after everyone else is asleep. The kind of conversation that only happens at 3am under a clear sky.`,
          `It's quiet. ${a} and ${b} are the only ones not asleep yet. The sky is clear. Eventually one of them says, "I trust you." The other one means it when they say it back.`,
          `${a} and ${b} lie in the dark and talk about things that have nothing to do with the game. For a while, the game stops existing.`,
        ] : [
          `${a} and ${b} share a quiet moment under the stars. Talking about home. About life after the game. A friendship that'll last.`,
          `${a} and ${b} are the last ones awake. The sky is clear. They talk about everything except strategy. Sometimes that's what you need.`,
          `${a} points out a constellation. ${b} makes up a name for it. They both laugh. The game feels far away.`,
        ];
        personalScores[a] += 1.0; personalScores[b] += 1.0;
        addBond(a, b, 0.5);
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[a] = (gs.popularity[a] || 0) + 1;
        gs.popularity[b] = (gs.popularity[b] || 0) + 1;
        phases.nightfall.push({
          type: 'soStargazing', phase: 'nightfall', players: [a, b],
          text: _starTexts[_hash(a + b + 'star', _starTexts.length)],
          personalScores: { [a]: 1.0, [b]: 1.0 }, badge: 'STARGAZING', badgeClass: 'gold'
        });
        // Romance spark check — stargazing is a charged moment
        _challengeRomanceSpark(a, b, ep, 'nightfall', phases, personalScores, 'stargazing');
        nightfallCount++;
      }
    }

    // Can't sleep — anxious player (proportional to low temperament)
    if (nightfallCount < maxNightfall && Math.random() < 0.35) {
      const anxious = members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
      if (anxious && Math.random() < (10 - pStats(anxious).temperament) * 0.04) {
        const pr = pronouns(anxious);
        const _anxTexts = [
          `${anxious} cannot sleep. ${pr.Sub} ${pr.sub === 'they' ? 'lie' : 'lies'} awake listening to every crack and rustle in the forest, running through scenarios.`,
          `${anxious} is up before dawn having barely slept. ${pr.Sub} ${pr.sub === 'they' ? 'look' : 'looks'} exhausted already, and the challenge hasn't even started.`,
          `Every sound in the forest jolts ${anxious} awake. By morning ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} slept maybe ninety minutes.`,
          `${anxious} stares at the ceiling of the shelter for hours, running tribal scenarios on a loop. ${pr.Sub} is completely wrecked by morning.`,
          `${anxious} closes ${pr.posAdj} eyes and immediately opens them again. And again. The forest sounds won't let ${pr.obj} rest. Eventually ${pr.sub} ${pr.sub === 'they' ? 'give' : 'gives'} up and just sits there until sunrise.`,
        ];
        personalScores[anxious] -= 0.5;
        phases.nightfall.push({
          type: 'soCantSleep', phase: 'nightfall', players: [anxious],
          text: _anxTexts[_hash(anxious + 'sleep', _anxTexts.length)],
          personalScores: { [anxious]: -0.5 }, badge: 'SLEEPLESS', badgeClass: 'red'
        });
        nightfallCount++;
      }
    }

    // Event (NEW): Confession by the Fire — someone opens up about their game or personal life
    if (nightfallCount < maxNightfall) {
      const confessors = members.filter(m => {
        const ms = pStats(m);
        return Math.random() < ms.social * 0.03 + ms.temperament * 0.02;
      });
      if (confessors.length) {
        const confessor = confessors[0];
        const listener = members.filter(m => m !== confessor).sort((a, b) => getBond(confessor, b) - getBond(confessor, a))[0];
        if (listener) {
          const pr = pronouns(confessor);
          const _confessTexts = [
            `The fire is low. ${confessor} starts talking — not about strategy. About home. About why ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} really here. ${listener} listens without interrupting.`,
            `${confessor} admits something ${pr.sub} ${pr.sub === 'they' ? 'haven\'t' : 'hasn\'t'} told anyone. ${listener} nods. "I get it." The silence that follows is comfortable.`,
            `${confessor} and ${listener} are the last ones awake. The conversation goes somewhere real. Neither of them expected that.`,
            `${confessor} says something ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} clearly been holding in. ${listener} doesn't fill the silence after. Just lets it sit. That's exactly right.`,
            `The fire burns down to embers. ${confessor} starts talking and doesn't stop for twenty minutes. ${listener} doesn't move. By the end, something between them is different.`,
          ];
          personalScores[confessor] = (personalScores[confessor] || 0) + 1.0;
          personalScores[listener] = (personalScores[listener] || 0) + 0.5;
          addBond(confessor, listener, 0.5);
          addBond(listener, confessor, 0.4);
          phases.nightfall.push({
            type: 'soFireConfession', phase: 'nightfall', players: [confessor, listener],
            text: _confessTexts[_hash(confessor + listener + 'confess', _confessTexts.length)],
            personalScores: { [confessor]: 1.0, [listener]: 0.5 }, badge: 'CONFESSION', badgeClass: 'gold'
          });
          nightfallCount++;
        }
      }
    }

    // Event (NEW): Food-Sharing Drama — ~35% chance when tribeFood is 1-2
    if (nightfallCount < maxNightfall && tribeFood[t.name] >= 1 && tribeFood[t.name] <= 2 && Math.random() < 0.35) {
      const byLoyalty = members.slice().sort((a, b) => pStats(a).loyalty - pStats(b).loyalty);
      const lowestLoyalty = byLoyalty[0];
      const highestLoyalty = byLoyalty[byLoyalty.length - 1];
      if (pStats(lowestLoyalty).loyalty <= 5) {
        // Food hoarding
        const pr = pronouns(lowestLoyalty);
        const _hoardTexts = [
          `${lowestLoyalty} quietly takes more than ${pr.posAdj} share of the food. Nobody says anything in the moment. But everyone saw it.`,
          `The food is portioned out — and then ${lowestLoyalty} helps ${pr.ref} to a second serving when ${pr.sub} ${pr.sub === 'they' ? 'think' : 'thinks'} nobody's watching. Multiple people were watching.`,
          `${lowestLoyalty} eats first and eats well. The tribe picks through what's left. The resentment is quiet but real.`,
        ];
        personalScores[lowestLoyalty] = (personalScores[lowestLoyalty] || 0) - 0.5;
        members.filter(m => m !== lowestLoyalty).forEach(m => addBond(m, lowestLoyalty, -0.2));
        phases.nightfall.push({
          type: 'soFoodHoard', phase: 'nightfall', players: [lowestLoyalty],
          text: _hoardTexts[_hash(lowestLoyalty + 'hoard', _hoardTexts.length)],
          personalScores: { [lowestLoyalty]: -0.5 }, badge: 'FOOD HOARD', badgeClass: 'red'
        });
      } else if (highestLoyalty !== lowestLoyalty) {
        // Generous sharing
        const pr = pronouns(highestLoyalty);
        const _shareTexts = [
          `${highestLoyalty} divides the food evenly — giving ${pr.posAdj} own portion last and taking less. Nobody forgets that.`,
          `${highestLoyalty} makes sure everyone eats before ${pr.sub} ${pr.sub === 'they' ? 'do' : 'does'}. A small thing. Not a small thing.`,
          `The food isn't much, but ${highestLoyalty} makes it go around. ${pr.Sub} ${pr.sub === 'they' ? 'turn' : 'turns'} scarcity into something that feels like abundance, briefly. The tribe is grateful.`,
        ];
        personalScores[highestLoyalty] = (personalScores[highestLoyalty] || 0) + 0.5;
        members.filter(m => m !== highestLoyalty).forEach(m => addBond(m, highestLoyalty, 0.2));
        phases.nightfall.push({
          type: 'soFoodShare', phase: 'nightfall', players: [highestLoyalty],
          text: _shareTexts[_hash(highestLoyalty + 'share', _shareTexts.length)],
          personalScores: { [highestLoyalty]: 0.5 }, badge: 'SHARED FOOD', badgeClass: 'gold'
        });
      }
      nightfallCount++;
    }

    // Event (NEW): Alliance Whisper — ~25% chance, needs 2 high-strategic players
    if (nightfallCount < maxNightfall && Math.random() < 0.25) {
      const whisperCandidates = members.slice().sort((a, b) => pStats(b).strategic - pStats(a).strategic);
      const wa = whisperCandidates[0], wb = whisperCandidates[1];
      if (wa && wb && pStats(wa).strategic >= 5 && pStats(wb).strategic >= 5) {
        const existingBond = getBond(wa, wb);
        const isAllies = existingBond >= 1;
        const bondGain = isAllies ? 0.3 : 0.1;
        const prA = pronouns(wa); const prB = pronouns(wb);
        const _whisperAlliesTexts = [
          `After everyone else is asleep, ${wa} slides closer to ${wb}. The game is being played right now, in the dark, in whispers.`,
          `${wa} and ${wb} have been waiting for a moment like this. No fire. No audience. Just the two of them, working out what comes next.`,
          `${wb} catches ${wa}'s eye across the shelter. Later, when the camp is quiet, they talk. Quietly. Carefully. The details matter.`,
        ];
        const _whisperLowTrustTexts = [
          `${wa} isn't sure ${wb} can be trusted. But the opportunity is here, and the night is long. ${prA.Sub} ${prA.sub === 'they' ? 'lean' : 'leans'} over and starts talking anyway.`,
          `${wb} is listening — but ${prB.posAdj} eyes say ${prB.sub} ${prB.sub === 'they' ? 'haven\'t' : 'hasn\'t'} fully committed yet. Still, the conversation is happening. That's something.`,
        ];
        const _whisperTexts = isAllies ? _whisperAlliesTexts : _whisperLowTrustTexts;
        personalScores[wa] = (personalScores[wa] || 0) + 0.5;
        personalScores[wb] = (personalScores[wb] || 0) + 0.5;
        addBond(wa, wb, bondGain);
        phases.nightfall.push({
          type: 'soAllianceWhisper', phase: 'nightfall', players: [wa, wb],
          text: _whisperTexts[_hash(wa + wb + 'whisper', _whisperTexts.length)],
          personalScores: { [wa]: 0.5, [wb]: 0.5 }, badge: 'WHISPERS', badgeClass: 'blue'
        });
        nightfallCount++;
      }
    }

    // Shelter reinforcement before bed — endurance+mental player shores things up
    if (nightfallCount < maxNightfall && Math.random() < 0.25) {
      const fixer = members.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.endurance * 0.04 + sB.mental * 0.03) - (sA.endurance * 0.04 + sA.mental * 0.03);
      })[0];
      if (fixer) {
        const fPr = pronouns(fixer);
        const _reinforceTexts = [
          `While everyone settles in, ${fixer} quietly checks every knot and support beam. ${fPr.Sub} ${fPr.sub==='they'?'retie':'reties'} two and wedge a third pole tighter. The shelter is stronger for it.`,
          `${fixer} spends twenty minutes reinforcing the shelter walls before bed. "Just in case," ${fPr.sub} ${fPr.sub==='they'?'say':'says'}. Nobody argues.`,
          `${fixer} notices the roof sagging and fixes it before the night sets in. Small thing. Big difference if it rains.`,
          `Before lying down, ${fixer} banks the fire, adjusts the wind screen, and double-checks the tarp. The camp is better for it.`,
        ];
        personalScores[fixer] += 0.5;
        campQuality[t.name] += 0.5;
        phases.nightfall.push({
          type: 'soReinforce', phase: 'nightfall', players: [fixer],
          text: _reinforceTexts[_hash(fixer + 'reinforce', _reinforceTexts.length)],
          personalScores: { [fixer]: 0.5 }, badge: 'CAMP REINFORCED', badgeClass: 'gold'
        });
        nightfallCount++;
      }
    }

    // End of Phase 3: Hunger effects based on tribeFood
    const food = tribeFood[t.name];
    if (food === 0) {
      // STARVING — everyone suffers
      const lowestEnd = members.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      members.forEach(m => {
        personalScores[m] = (personalScores[m] || 0) - 0.5;
        if (m === lowestEnd) personalScores[m] -= 0.5; // extra for weakest
      });
      const psStarving = Object.fromEntries(members.map(m => [m, m === lowestEnd ? -1.0 : -0.5]));
      phases.nightfall.push({
        type: 'soHunger', phase: 'nightfall', players: [...members],
        text: `Nobody ate tonight. The hunger is quiet at first and then it isn't. By midnight, the tribe is surviving on willpower. ${lowestEnd} is hit the hardest.`,
        personalScores: psStarving, badge: 'STARVING', badgeClass: 'red'
      });
    } else if (food >= 3) {
      // WELL FED — everyone gets a boost
      members.forEach(m => { personalScores[m] = (personalScores[m] || 0) + 0.3; });
      const psWellFed = Object.fromEntries(members.map(m => [m, 0.3]));
      phases.nightfall.push({
        type: 'soWellFed', phase: 'nightfall', players: [...members],
        text: `The tribe is fed — actually fed. The fire is warm, the food is gone but the memory of it lingers. Spirits are up. Tonight, that matters.`,
        personalScores: psWellFed, badge: 'WELL FED', badgeClass: 'gold'
      });
    }
  });

  // Bonus events for 2-tribe seasons (Phase 3)
  tribes.forEach(t => _bonusEvents('nightfall', t));

  // Showmance challenge moment — teamwork scenario (fireside bonding context)
  _checkShowmanceChalMoment(ep, 'nightfall', phases, personalScores, 'teamwork', tribes);

  _snapCamp('theNight'); // after nightfall reinforcement, before the night

  // ══ PHASE 4: The Night (3-4 events per tribe, severity from camp quality) ══
  const lostPlayers = []; // { name, tribe, lostInPhase, returnDelay }

  tribes.forEach(t => {
    const members = t.members;
    const quality = campQuality[t.name]; // 1-10 scale
    let nightCount = 0;
    const maxNight = 3 + (Math.random() < 0.5 ? 1 : 0);

    // Rainstorm — 3-tier severity based on random intensity vs camp quality
    if (nightCount < maxNight) {
      const stormChance = 0.45; // rain is common in the woods
      if (Math.random() < stormChance) {
        const stormIntensity = 3 + Math.random() * 7; // 3-10 random storm power
        const campHolds = quality >= stormIntensity;
        const campBarelyHolds = !campHolds && quality >= stormIntensity - 2;
        // campFails = neither holds nor barely holds

        let rainText, rainDamage, rainScoreHit, rainBadgeClass;
        if (campHolds) {
          // Camp is strong enough — shelter holds
          const _holdTexts = [
            `Rain comes down in the night. The shelter holds. It's not comfortable, but everyone stays mostly dry.`,
            `A light rain passes through. The fire dies. They relight it in the morning. Nobody panics.`,
            `The shelter creaks in the rain but doesn't fail. A small victory.`,
            `A proper downpour at 2am. The shelter does its job. Everyone pulls their things in from the edges and goes back to sleep. It's fine.`,
            `Rain drums on the shelter roof. Not pleasant. But the structure holds, and by morning the sky is clear. They got lucky.`,
          ];
          rainText = _holdTexts[_hash(t.name + 'rain', _holdTexts.length)];
          rainDamage = 0; rainScoreHit = 0; rainBadgeClass = 'gold';
        } else if (campBarelyHolds) {
          // Camp takes a beating but survives — partial damage
          const _partialTexts = [
            `The rain is harder than expected. The shelter holds — mostly. One wall sags. The fire sputters out. Everyone's damp. Nobody's comfortable.`,
            `A heavy storm rolls through. The shelter leaks in three places. By morning, the tribe is wet, tired, and irritable.`,
            `It pours. The shelter survives, technically. But the roof drips, the wind gets through the gaps, and nobody sleeps well.`,
            `The rain is relentless. The shelter bends but doesn't break. Small consolation when you're lying in a puddle.`,
            `Rain hammers the camp for two hours. The shelter is standing by dawn, but it's not the same shelter. Half the tarp is gone.`,
          ];
          rainText = _partialTexts[_hash(t.name + 'rain', _partialTexts.length)];
          rainDamage = -0.5; rainScoreHit = -0.5; rainBadgeClass = 'red';
        } else {
          // Camp fails — serious damage
          const _failTexts = [
            `Rain hits the camp hard. The shelter — barely adequate to begin with — is not adequate for this. Everyone gets wet. Some more than others.`,
            `The storm rolls in without warning. The shelter fails. The tribe spends the night huddled under a tarp that covers maybe half of them.`,
            `By 1am the rain is relentless. The poorly-built shelter is a puddle. No one is sleeping. Everyone is miserable.`,
            `It rains sideways for three hours. The shelter, optimistically assembled this afternoon, does not pass the test. The tribe presses together for warmth and says very little.`,
            `The rain starts gentle and ends catastrophic. By 3am, the shelter has become a funnel. Wet, cold, furious — and they still have a race to run in the morning.`,
          ];
          rainText = _failTexts[_hash(t.name + 'rain', _failTexts.length)];
          rainDamage = -1.5; rainScoreHit = -1.0; rainBadgeClass = 'red';
        }

        if (rainScoreHit !== 0) members.forEach(m => { personalScores[m] += rainScoreHit; });
        if (rainDamage !== 0) campQuality[t.name] += rainDamage;
        const evtScores = rainScoreHit !== 0 ? Object.fromEntries(members.map(m => [m, rainScoreHit])) : {};
        phases.theNight.push({
          type: 'soRainstorm', phase: 'theNight', players: [...members],
          text: rainText,
          personalScores: evtScores, badge: 'RAINSTORM', badgeClass: rainBadgeClass
        });
        nightCount++;
      }
    }

    // Bear encounter — 4-beat setpiece
    if (nightCount < maxNight && Math.random() < 0.35) {
      const bearSorted = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
      const brave = bearSorted[0], panicker = bearSorted[bearSorted.length - 1];
      const detector = members.slice().sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
      if (brave && panicker && brave !== panicker) {
        const prB = pronouns(brave); const prP = pronouns(panicker);
        const prD = pronouns(detector);

        // Beat 1 — Detection
        const _detectTexts = [
          `${detector} is the first to hear it — a low shuffle, too heavy for a raccoon. ${prD.Sub} ${prD.sub === 'they' ? 'go' : 'goes'} still and whispers: "Something's out there."`,
          `Something moves at the edge of the firelight. ${detector} sees it before anyone else does. ${prD.Sub} ${prD.sub === 'they' ? 'don\'t' : 'doesn\'t'} say anything at first — just watch${prD.sub === 'they' ? '' : 'es'}.`,
          `${detector} wakes up from a half-sleep and knows immediately: the sound outside the shelter is wrong. Too deliberate. Too large.`,
        ];
        const beat1 = _detectTexts[_hash(detector + 'beardet', _detectTexts.length)];

        // Beat 2 — Panic
        const runners = members.filter(m => m !== brave && m !== panicker && pStats(m).boldness <= 4);
        const _panicTexts = [
          `${panicker} sees the shape outside and ${prP.sub === 'they' ? 'freeze' : 'freezes'}. ${runners.length ? `${runners[0]} goes the other direction entirely.` : `The rest of the tribe presses against the far wall.`}`,
          `${panicker} makes a sound that could generously be called a word. ${prP.Sub} ${prP.sub === 'they' ? 'scramble' : 'scrambles'} backward. ${runners.length ? `${runners[0]} is already outside — running.` : `No one else moves.`}`,
          `The panic starts with ${panicker}. It's immediate and loud and it doesn't help. ${runners.length ? `${runners[0]} bolts.` : `The rest of the tribe watches.`}`,
        ];
        const beat2 = _panicTexts[_hash(panicker + 'bearpanicbeat', _panicTexts.length)];

        // Beat 3 — Confrontation
        const braveBoldness = pStats(brave).boldness;
        const bravePhysical = pStats(brave).physical;
        const successChance = braveBoldness * 0.08 + bravePhysical * 0.03;
        const bearSuccess = Math.random() < successChance;
        const _successTexts = [
          `${brave} stands up, picks up a branch, and walks directly toward the bear. Full height. Full voice. The bear considers its options and retreats into the dark.`,
          `${brave} doesn't run. ${prB.Sub} ${prB.sub === 'they' ? 'raise' : 'raises'} ${prB.posAdj} arms, ${prB.sub === 'they' ? 'shout' : 'shouts'} once — loud and low — and holds the position. The bear backs away.`,
          `${brave} gets between the bear and the camp, torch in hand. A standoff. Ten seconds. Then the bear turns. The tribe breathes again.`,
        ];
        const _failTexts = [
          `${brave} steps forward. The bear doesn't move. ${prB.Sub} ${prB.sub === 'they' ? 'shout' : 'shouts'}. The bear tears into the food supply anyway, then leaves on its own terms.`,
          `${brave} faces the bear. The bear faces ${prB.obj} back. Then it walks right past ${prB.obj} and goes through the camp like it owns the place. ${brave} watches, helpless.`,
          `${brave} tries everything — noise, fire, presence. The bear is unimpressed. It finds the food, eats what it wants, and goes. Camp is a wreck.`,
        ];
        const beat3 = bearSuccess
          ? _successTexts[_hash(brave + 'bearsuccess', _successTexts.length)]
          : _failTexts[_hash(brave + 'bearfail', _failTexts.length)];

        // Beat 4 — Aftermath
        const _afterSuccessTexts = [
          `The tribe is silent. Then: noise. Questions, shaky laughs, disbelief. ${brave} sits back down like nothing happened. The tribe will be talking about this for days.`,
          `After the bear is gone, no one can sleep. They sit around the fire until dawn. ${brave} is the only one who looks calm about it.`,
        ];
        const _afterFailTexts = [
          `The camp is a mess. Food gone. Supplies scattered. The tribe picks through it in the dark, not saying much. The morning race just got harder.`,
          `Nobody says it out loud, but the bear won. The tribe salvages what they can and tries not to look at each other.`,
        ];
        const beat4 = bearSuccess
          ? _afterSuccessTexts[_hash(brave + panicker + 'bearafter', _afterSuccessTexts.length)]
          : _afterFailTexts[_hash(brave + panicker + 'bearafterfail', _afterFailTexts.length)];

        // Apply scores
        if (bearSuccess) {
          personalScores[brave] = (personalScores[brave] || 0) + 3.0;
          members.filter(m => m !== brave).forEach(m => addBond(m, brave, 0.5));
        } else {
          personalScores[brave] = (personalScores[brave] || 0) + 1.0;
          members.filter(m => m !== brave).forEach(m => addBond(m, brave, 0.2));
          tribeFood[t.name] = Math.max(0, tribeFood[t.name] - 2);
          campQuality[t.name] = Math.max(1, campQuality[t.name] - 2);
        }
        personalScores[panicker] = (personalScores[panicker] || 0) - 1.5;
        members.filter(m => m !== panicker).forEach(m => addBond(m, panicker, -0.2));

        if (!gs.popularity) gs.popularity = {};
        gs.popularity[brave] = (gs.popularity[brave] || 0) + 2;
        gs.popularity[panicker] = (gs.popularity[panicker] || 0) - 1;
        if (!gs.playerStates) gs.playerStates = {};
        if (!gs.playerStates[brave]) gs.playerStates[brave] = {};
        gs.playerStates[brave].bigMoves = (gs.playerStates[brave].bigMoves || 0) + 1;

        const bearBadge = bearSuccess ? 'BEAR — SURVIVED' : 'BEAR — CAMP WRECKED';
        const bearBadgeClass = bearSuccess ? 'gold' : 'red';
        const bearEventPlayers = [...new Set([detector, brave, panicker, ...runners.slice(0, 1)])];
        const bearScores = { [brave]: bearSuccess ? 3.0 : 1.0, [panicker]: -1.5 };
        if (detector !== brave && detector !== panicker) bearScores[detector] = 1.0;

        phases.theNight.push({
          type: 'soBear', phase: 'theNight', players: bearEventPlayers,
          text: [beat1, beat2, beat3, beat4].join('\n'),
          personalScores: bearScores,
          badge: bearBadge, badgeClass: bearBadgeClass,
          bearSuccess,
        });
        nightCount++;
      }
    }

    // Someone gets LOST — proportional check
    if (nightCount < maxNight) {
      const lostCandidates = members.filter(m => {
        // Max 2 lost per tribe
        const tribeLost = lostPlayers.filter(lp => lp.tribe === t.name).length;
        if (tribeLost >= 2) return false;
        const s = pStats(m);
        const chance = (10 - s.intuition) * 0.02 + (10 - s.mental) * 0.015 + (wanderers.has(m) ? 0.1 : 0);
        return Math.random() < chance;
      });
      if (lostCandidates.length > 0) {
        const lost = lostCandidates[0];
        const lostS = pStats(lost);
        const returnDelay = (10 - lostS.intuition) * 0.5;
        lostPlayers.push({ name: lost, tribe: t.name, lostInPhase: 'theNight', returnDelay });
        personalScores[lost] -= 3.0;
        members.filter(m => m !== lost).forEach(m => addBond(m, lost, -0.5));
        const pr = pronouns(lost);
        const _lostTexts = [
          `${lost} slipped away to use the bathroom and didn't come back. The tribe spent an hour calling ${pr.posAdj} name into the dark before realizing — ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} genuinely gone.`,
          `${lost} got up in the middle of the night and walked in the wrong direction. By the time ${pr.sub} ${pr.sub === 'they' ? 'realize' : 'realizes'} it, the camp is nowhere to be found.`,
          `"I'll be right back," ${lost} says. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} not right back. Search parties go out. Nothing. Production has a tracker, but the tribe doesn't know that.`,
          `${lost} takes a walk to clear ${pr.posAdj} head and loses track of every single landmark. By the time ${pr.sub} ${pr.sub === 'they' ? 'admit' : 'admits'} ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} lost, ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} very lost.`,
          `The tribe wakes up and ${lost} is simply not there. No note. No explanation. The best guess is bathroom. The reality is that ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} been wandering in the forest for two hours.`,
        ];

        // Check for a lost pair (two with bond >= 3)
        const alsoLost = lostCandidates[1];
        if (alsoLost && getBond(lost, alsoLost) >= 3 && lostPlayers.filter(lp => lp.tribe === t.name).length < 2) {
          const returnDelay2 = (10 - pStats(alsoLost).intuition) * 0.5;
          lostPlayers.push({ name: alsoLost, tribe: t.name, lostInPhase: 'theNight', returnDelay: returnDelay2, pairedWith: lost });
          personalScores[alsoLost] -= 3.0;
          members.filter(m => m !== alsoLost).forEach(m => addBond(m, alsoLost, -0.5));
          addBond(lost, alsoLost, 0.3); // survived together
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[lost] = (gs.popularity[lost] || 0) - 1; // got lost = embarrassing
          gs.popularity[alsoLost] = (gs.popularity[alsoLost] || 0) - 1;
          const _lostPairTexts = [
            `${lost} and ${alsoLost} both get turned around in the dark. They eventually find each other — but not the camp. By sunrise, they're together, lost, and significantly behind.`,
            `${alsoLost} goes looking for ${lost} and also gets lost. The tribe has now lost two people and is very, very upset.`,
            `${lost} wanders off. ${alsoLost} follows. Neither one makes a sound decision for the next four hours. Production eventually has to intervene.`,
            `${lost} and ${alsoLost} end up in the same part of the wrong forest by pure coincidence. They bond over how thoroughly they're both lost. The tribe is not moved by this.`,
          ];
          phases.theNight.push({
            type: 'soLost', phase: 'theNight', players: [lost, alsoLost],
            text: _lostPairTexts[_hash(lost + alsoLost + 'lostpair', _lostPairTexts.length)],
            personalScores: { [lost]: -3.0, [alsoLost]: -3.0 }, badge: 'LOST', badgeClass: 'red'
          });
        } else {
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[lost] = (gs.popularity[lost] || 0) - 1; // got lost = embarrassing edit
          phases.theNight.push({
            type: 'soLost', phase: 'theNight', players: [lost],
            text: _lostTexts[_hash(lost + 'lost', _lostTexts.length)],
            personalScores: { [lost]: -3.0 }, badge: 'LOST', badgeClass: 'red'
          });
        }
        nightCount++;
      }
    }

    // Tent/shelter fire — low temperament culprit
    if (nightCount < maxNight && Math.random() < 0.20) {
      const culprit = members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
      if (culprit && Math.random() < (10 - pStats(culprit).temperament) * 0.03) {
        const pr = pronouns(culprit);
        const _fireTexts = [
          `${culprit} knocks a torch into the shelter wall. The resulting chaos is brief but spectacular. Everyone scrambles. No one is hurt, but the shelter needs emergency repairs.`,
          `${culprit} rolls too close to the fire in ${pr.posAdj} sleep and wakes up to the smell of burning. The tribe puts it out, fast. ${pr.Sub} is very sorry.`,
          `A small fire starts near ${culprit}'s sleeping spot. No one knows exactly how. ${culprit} definitely knows how. ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} saying.`,
          `${culprit} insists the torch was well away from the shelter. It was not well away from the shelter. The corner of the shelter is now on fire.`,
          `At 1am, ${culprit} stumbles awake and steps directly into the fire pit. What follows is six minutes of chaos, one bucket of water, and a shelter that now has a hole in it.`,
        ];
        personalScores[culprit] -= 2.0;
        members.filter(m => m !== culprit).forEach(m => addBond(m, culprit, -0.3));
        campQuality[t.name] -= 1.5; // fire damages shelter
        phases.theNight.push({
          type: 'soTentFire', phase: 'theNight', players: [culprit],
          text: _fireTexts[_hash(culprit + 'tentfire', _fireTexts.length)],
          personalScores: { [culprit]: -2.0 }, badge: 'TENT FIRE', badgeClass: 'red'
        });
        nightCount++;
      }
    }

    // Cuddling for warmth — bond >= 2 pair or showmance
    if (nightCount < maxNight && Math.random() < 0.40) {
      const cuddlePairs = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const bond = getBond(members[i], members[j]);
          if (bond >= 2) cuddlePairs.push({ a: members[i], b: members[j], bond });
        }
      }
      cuddlePairs.sort((x, y) => y.bond - x.bond);
      if (cuddlePairs.length) {
        const { a, b } = cuddlePairs[0];
        const _romOn = seasonConfig.romance !== 'disabled';
        const _cuddleTexts = _romOn ? [
          `It's cold. ${a} and ${b} end up back-to-back for warmth. Nobody says anything about it in the morning.`,
          `${a} and ${b} are pressed together for warmth by midnight. Practical. Completely practical.`,
          `${b} shuffles over to ${a} in the night. "I'm freezing." "${a} is also freezing." They're both warmer for it.`,
          `At some point in the night, ${a} and ${b} are sharing one sleeping bag. Nobody asks how that happened. Nobody is cold.`,
          `${a} wakes up with ${b} tucked against ${pronouns(a).posAdj} side. ${pronouns(a).Sub} doesn't move. It's warm. It's fine. Nobody mentions it.`,
        ] : [
          `It's freezing. ${a} and ${b} huddle together for warmth. Survival, nothing more. But the trust is real.`,
          `${a} and ${b} share body heat to get through the night. When the sun comes up, they both pretend they weren't that cold.`,
          `The temperature drops hard. ${a} and ${b} end up back-to-back. Tribemates, keeping each other alive.`,
        ];
        personalScores[a] += 0.5; personalScores[b] += 0.5;
        addBond(a, b, 0.3);
        phases.theNight.push({
          type: 'soCuddling', phase: 'theNight', players: [a, b],
          text: _cuddleTexts[_hash(a + b + 'cuddle', _cuddleTexts.length)],
          personalScores: { [a]: 0.5, [b]: 0.5 }, badge: 'CUDDLING', badgeClass: 'gold'
        });
        // Romance spark check — cuddling for warmth can become something more
        _challengeRomanceSpark(a, b, ep, 'theNight', phases, personalScores, 'night in the woods');
        nightCount++;
      }
    }

    // Nightmare / sleep talking
    if (nightCount < maxNight && Math.random() < 0.25) {
      const dreamer = members.slice().sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
      if (dreamer && Math.random() < (10 - pStats(dreamer).temperament) * 0.03) {
        const pr = pronouns(dreamer);
        const _nightmareTexts = [
          `${dreamer} talks in ${pr.posAdj} sleep. Something about votes. Something about a name. The tribemates who are awake look at each other.`,
          `${dreamer} bolts upright at 3am, gasping. ${pr.Sub} says ${pr.sub === 'they' ? 'they\'re' : pr.sub + '\'s'} fine. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} look fine.`,
          `${dreamer} mutters names in ${pr.posAdj} sleep. No one is sure what they mean. Two people quietly note which names were said.`,
          `${dreamer} starts thrashing in ${pr.posAdj} sleep and wakes up half the shelter. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} remember the dream. Others definitely remember the commotion.`,
          `${dreamer} says "no" in ${pr.posAdj} sleep very clearly three times. Nobody does anything. In the morning it's one of those things that happened but nobody brings up.`,
        ];
        personalScores[dreamer] -= 0.5;
        phases.theNight.push({
          type: 'soNightmare', phase: 'theNight', players: [dreamer],
          text: _nightmareTexts[_hash(dreamer + 'nightmare', _nightmareTexts.length)],
          personalScores: { [dreamer]: -0.5 }, badge: 'NIGHTMARE', badgeClass: 'red'
        });
        nightCount++;
      }
    }

    // Event (NEW): Strange Noise Investigation — brave player investigates, scared player reacts
    if (nightCount < maxNight && Math.random() < 0.35) {
      const investigators = members.filter(m => !lostPlayers.some(lp => lp.name === m));
      if (investigators.length >= 2) {
        const brave2 = investigators.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
        const scared2 = investigators.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
        if (brave2 !== scared2) {
          const pr2 = pronouns(brave2);
          const _noiseInvTexts = [
            `Something crashes in the dark. ${scared2} freezes. ${brave2} grabs a stick and goes to check. Turns out it's a raccoon. ${brave2} comes back grinning. ${scared2} hasn't unclenched yet.`,
            `Footsteps outside the shelter. ${brave2} goes alone. Comes back thirty seconds later. "Just a deer." ${scared2} doesn't sleep for another hour.`,
            `A scream echoes through the woods. ${brave2} stands up immediately. "${pr2.Sub} will be right back." ${scared2} waits in silence, counting the seconds.`,
            `Something knocks over a crate in the dark. ${scared2} grabs ${brave2}'s arm. ${brave2} peels ${scared2}'s hand off, picks up a flashlight, and walks out. Back in sixty seconds: "Nothing. Go to sleep."`,
            `The noise is indescribable — not quite an animal, not quite the wind. ${scared2} doesn't breathe. ${brave2} goes toward it. The camp waits. ${brave2} returns. "No idea what that was." This is not reassuring.`,
          ];
          personalScores[brave2] = (personalScores[brave2] || 0) + 1.0;
          personalScores[scared2] = (personalScores[scared2] || 0) - 0.5;
          addBond(scared2, brave2, 0.3);
          phases.theNight.push({
            type: 'soScaryNoise', phase: 'theNight', players: [brave2, scared2],
            text: _noiseInvTexts[_hash(brave2 + scared2 + 'noiseinv', _noiseInvTexts.length)],
            personalScores: { [brave2]: 1.0, [scared2]: -0.5 }, badge: 'INVESTIGATION', badgeClass: 'gold'
          });
          nightCount++;
        }
      }
    }
  });

  // Bonus events for 2-tribe seasons (Phase 4)
  tribes.forEach(t => _bonusEvents('theNight', t));

  // Showmance challenge moment — danger scenario (bear encounter context)
  _checkShowmanceChalMoment(ep, 'theNight', phases, personalScores, 'danger', tribes);
  _snapCamp('morningRace'); // final camp state going into the race

  // ══ PHASE 5: Morning Race (1-2 events per tribe) ══
  const raceScores = {};
  const tribeRaceTimes = {};

  tribes.forEach(t => {
    const members = t.members;
    const tribeLostNames = lostPlayers.filter(lp => lp.tribe === t.name).map(lp => lp.name);
    const racers = members.filter(m => !tribeLostNames.includes(m));
    const penalty = tribeLostNames.length * 5.0;

    // Fatigue modifiers per player (injury + poor camp quality)
    const fatigueModifiers = {};
    racers.forEach(m => {
      let fatigue = 1.0;
      if (ep._soInjured?.[m]) fatigue -= 0.15;
      fatigue -= Math.max(0, (5 - campQuality[t.name]) * 0.05); // poor camp = poor sleep = sluggish race
      fatigueModifiers[m] = Math.max(0.5, fatigue);
    });

    // Hunger modifier for the whole tribe
    const hungerMod = tribeFood[t.name] === 0 ? 0.7 : tribeFood[t.name] >= 3 ? 1.15 : 1.0;

    // Race score from physical+endurance, adjusted for fatigue and hunger
    const rawRace = racers.reduce((sum, m) => {
      const s = pStats(m);
      return sum + (s.physical * 0.04 + s.endurance * 0.03) * fatigueModifiers[m];
    }, 0) * hungerMod;
    raceScores[t.name] = rawRace - penalty;
    // "Time" inversely proportional to raw score — higher = faster
    tribeRaceTimes[t.name] = 100 / Math.max(0.1, rawRace);

    let raceEventCount = 0;
    const maxRaceEvents = 1 + (Math.random() < 0.5 ? 1 : 0);

    // Sprint back — top scorer gets bonus
    if (racers.length) {
      const topRacer = racers.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.physical * 0.04 + sB.endurance * 0.03) - (sA.physical * 0.04 + sA.endurance * 0.03);
      })[0];
      if (topRacer) {
        const pr = pronouns(topRacer);
        const _sprintTexts = [
          `${topRacer} sets the pace on the way back. The tribe runs hard. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} slow down until they see the finish.`,
          `${topRacer} is running before anyone else is ready. The tribe scrambles to keep up.`,
          `${topRacer} takes the lead on the morning race back. ${pr.Sub} ${pr.sub === 'they' ? 'push' : 'pushes'} the pace and the tribe follows.`,
          `${topRacer} doesn't wait for the signal — ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} already moving. The tribe chases. They are not going to lose this thing.`,
          `${topRacer} runs the morning race like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} something to prove. Maybe ${pr.sub} ${pr.sub === 'they' ? 'do' : 'does'}. The tribe keeps up. Barely.`,
        ];
        personalScores[topRacer] += 2.0;
        phases.morningRace.push({
          type: 'soSprint', phase: 'morningRace', players: [topRacer],
          text: _sprintTexts[_hash(topRacer + 'sprint', _sprintTexts.length)],
          personalScores: { [topRacer]: 2.0 }, badge: 'FRONT RUNNER', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }

    // Lost player delay event
    if (tribeLostNames.length > 0) {
      const _costTexts = tribeLostNames.length === 1
        ? [
          `${tribeLostNames[0]} finally staggers in — long after the other tribes are done. The tribe had to wait, and waited too long.`,
          `${tribeLostNames[0]} returns from the night with leaves in ${pronouns(tribeLostNames[0]).posAdj} hair and panic in ${pronouns(tribeLostNames[0]).posAdj} eyes. The tribe lost because of it.`,
          `Production guides ${tribeLostNames[0]} back to the course. ${pronouns(tribeLostNames[0]).Sub} ${pronouns(tribeLostNames[0]).sub === 'they' ? 'arrive' : 'arrives'} last. Way, way last.`,
          `${tribeLostNames[0]} shows up to the finish line while the other tribes are already sitting down. The tribe can't hide how furious they are.`,
          `By the time ${tribeLostNames[0]} limps in, the race is already decided. ${pronouns(tribeLostNames[0]).Sub} ${pronouns(tribeLostNames[0]).sub === 'they' ? 'look' : 'looks'} like ${pronouns(tribeLostNames[0]).sub} ${pronouns(tribeLostNames[0]).sub === 'they' ? 'have' : 'has'} been through a lot. The tribe has too, waiting.`,
        ]
        : [
          `${tribeLostNames.join(' and ')} come stumbling back together just as the other tribes are finishing. A disaster.`,
          `Two players, one forest, zero sense of direction. ${tribeLostNames.join(' and ')} return long after anyone else.`,
          `${tribeLostNames.join(' and ')} appear from the wrong direction, looking bewildered. The race has been over for ten minutes. The tribe says nothing. Their faces say everything.`,
          `The tribe waits. And waits. ${tribeLostNames.join(' and ')} eventually emerge from the treeline together, covered in mud, already arguing about whose fault it is.`,
        ];
      tribeLostNames.forEach(lostName => {
        personalScores[lostName] -= 5.0; // race penalty applied to score too
        members.filter(m => m !== lostName).forEach(m => addBond(m, lostName, -0.5));
      });
      phases.morningRace.push({
        type: 'soCostTribe', phase: 'morningRace', players: [...tribeLostNames],
        text: _costTexts[_hash(tribeLostNames.join('') + 'cost', _costTexts.length)],
        personalScores: Object.fromEntries(tribeLostNames.map(n => [n, -5.0])),
        badge: 'COST THE TRIBE', badgeClass: 'red'
      });
      raceEventCount++;
    }

    // Shortcut finder — proportional intuition+mental
    if (raceEventCount < maxRaceEvents && Math.random() < 0.25) {
      const shortcutFinder = racers.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.intuition * 0.04 + sB.mental * 0.03) - (sA.intuition * 0.04 + sA.mental * 0.03);
      })[0];
      if (shortcutFinder && Math.random() < pStats(shortcutFinder).intuition * 0.04 + pStats(shortcutFinder).mental * 0.03) {
        const pr = pronouns(shortcutFinder);
        const _scTexts = [
          `${shortcutFinder} spots a gap in the trees and calls the tribe over. The shortcut saves them a quarter mile. Crucial.`,
          `${shortcutFinder} cuts left off the trail and waves the tribe through. ${pr.Sub} ${pr.sub === 'they' ? 'were' : 'was'} right. It's shorter.`,
          `"This way," ${shortcutFinder} says with quiet certainty. ${pr.Sub} ${pr.sub === 'they' ? 'lead' : 'leads'} the tribe around the ridge and down the fast way.`,
          `${shortcutFinder} doesn't explain — just veers off into the trees. The tribe hesitates, then follows. Three minutes later they're on a straighter path. Nobody questions it.`,
          `${shortcutFinder} saw the shortcut on the way in. ${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} been waiting to use it. The tribe emerges half a mile ahead of where they'd have been otherwise.`,
        ];
        personalScores[shortcutFinder] += 2.0;
        racers.filter(m => m !== shortcutFinder).forEach(m => addBond(m, shortcutFinder, 0.3));
        raceScores[t.name] += 2.0; // shortcut bonus
        if (!gs.playerStates) gs.playerStates = {};
        if (!gs.playerStates[shortcutFinder]) gs.playerStates[shortcutFinder] = {};
        gs.playerStates[shortcutFinder].bigMoves = (gs.playerStates[shortcutFinder].bigMoves || 0) + 1;
        phases.morningRace.push({
          type: 'soShortcut', phase: 'morningRace', players: [shortcutFinder],
          text: _scTexts[_hash(shortcutFinder + 'shortcut', _scTexts.length)],
          personalScores: { [shortcutFinder]: 2.0 }, badge: 'SHORTCUT', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }

    // Stumble — ~30% chance, weighted toward low physical (enhanced with injury awareness)
    if (raceEventCount < maxRaceEvents && Math.random() < 0.30) {
      // Priority: injured players first, then low endurance
      const injuredRacers = racers.filter(m => ep._soInjured?.[m]);
      const stumbler = injuredRacers.length
        ? injuredRacers.slice().sort((a, b) => pStats(a).physical - pStats(b).physical)[0]
        : racers.slice().sort((a, b) => pStats(a).physical - pStats(b).physical)[0];
      const stumbleChance = stumbler
        ? (ep._soInjured?.[stumbler] ? 0.6 : (10 - pStats(stumbler).physical) * 0.04)
        : 0;
      if (stumbler && Math.random() < stumbleChance) {
        const pr = pronouns(stumbler);
        const isInjured = ep._soInjured?.[stumbler];
        const _stumbleTexts = isInjured ? [
          `${stumbler}'s earlier injury flares up on the trail. ${pr.Sub} ${pr.sub === 'they' ? 'go' : 'goes'} down hard. The tribe can't wait.`,
          `That hand — that ankle — whatever happened at camp. It matters now. ${stumbler} hits the ground and the tribe watches ${pr.obj} struggle back up.`,
          `${stumbler} was holding it together through the night. The morning race is where the injury finally breaks through. ${pr.Sub} ${pr.sub === 'they' ? 'fall' : 'falls'}. ${pr.Sub} ${pr.sub === 'they' ? 'get' : 'gets'} up. But it costs time.`,
          `The injury from last night wasn't nothing. ${stumbler} trips on a root and goes down. It's bad. The tribe slows. They don't have time to slow.`,
        ] : [
          `${stumbler} trips on a root and goes down hard. ${pr.Sub} ${pr.sub === 'they' ? 'get' : 'gets'} up limping. The tribe slows down.`,
          `${stumbler}'s legs give out on a hill. The night took everything ${pr.sub} had. Someone has to help ${pr.obj} the rest of the way.`,
          `${stumbler} hits the ground face-first on a rocky patch. ${pr.Sub} ${pr.sub === 'they' ? 'get' : 'gets'} up waving everyone off. ${pr.Sub} is clearly not fine.`,
          `The trail is brutal in the morning light and ${stumbler} is running on no sleep. One bad step, and ${pr.sub} ${pr.sub === 'they' ? 'go' : 'goes'} down. The tribe waits. They don't have time to wait.`,
        ];
        personalScores[stumbler] = (personalScores[stumbler] || 0) - 1.5;
        raceScores[t.name] -= 1.5;
        phases.morningRace.push({
          type: 'soStumble', phase: 'morningRace', players: [stumbler],
          text: _stumbleTexts[_hash(stumbler + 'stumble2', _stumbleTexts.length)],
          personalScores: { [stumbler]: -1.5 }, badge: 'STUMBLE', badgeClass: 'red'
        });
        raceEventCount++;
      }
    }

    // Carry — ~25% chance, priority to injured players
    if (raceEventCount < maxRaceEvents && racers.length >= 2 && Math.random() < 0.25) {
      const carrier = racers.slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.loyalty * 0.04 + sB.physical * 0.03) - (sA.loyalty * 0.04 + sA.physical * 0.03);
      })[0];
      // Prefer injured players as the carried; fallback to lowest endurance
      const injuredCarryTarget = racers.filter(m => m !== carrier && ep._soInjured?.[m]);
      const carried = injuredCarryTarget.length
        ? injuredCarryTarget.sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0]
        : racers.filter(m => m !== carrier).sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      if (carrier && carried) {
        const prC = pronouns(carrier); const prR = pronouns(carried);
        const isCarriedInjured = ep._soInjured?.[carried];
        const _carryTexts = isCarriedInjured ? [
          `${carried} is barely moving on that ${ep._soInjured?.[carried] ? 'injured' : 'bad'} leg. ${carrier} drops back without a word and ${prC.sub === 'they' ? 'pull' : 'pulls'} ${prR.obj} forward. They finish together.`,
          `${carrier} sees ${carried} struggling — that injury from last night isn't going away. ${prC.Sub} ${prC.sub === 'they' ? 'grab' : 'grabs'} ${prR.posAdj} pack, takes the weight, keeps them moving.`,
          `The morning race and an injury at the same time. ${carrier} doesn't leave ${carried} behind. That's the kind of thing people remember.`,
        ] : [
          `${carrier} notices ${carried} falling behind and grabs ${prR.posAdj} arm. "Come on. We're going together." They finish together.`,
          `${carried} is slowing down. ${carrier} doesn't leave ${prR.obj} behind — ${prC.sub} ${prC.sub === 'they' ? 'half-carry' : 'half-carries'} ${prR.obj} the last stretch.`,
          `${carrier} drops back and pushes ${carried} from behind for the last quarter mile. ${prC.Sub} ${prC.sub === 'they' ? 'refuse' : 'refuses'} to let anyone fall behind.`,
        ];
        personalScores[carrier] = (personalScores[carrier] || 0) + 1.5;
        addBond(carrier, carried, 0.4);
        racers.filter(m => m !== carrier && m !== carried).forEach(m => addBond(m, carrier, 0.2));
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[carrier] = (gs.popularity[carrier] || 0) + 2;
        phases.morningRace.push({
          type: 'soCarry', phase: 'morningRace', players: [carrier, carried],
          text: _carryTexts[_hash(carrier + carried + 'carry2', _carryTexts.length)],
          personalScores: { [carrier]: 1.5 }, badge: 'CARRIED TEAMMATE', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }

    // Rally — ~35% chance when tribe raceScore is low
    if (raceEventCount < maxRaceEvents && raceScores[t.name] < 0 && Math.random() < 0.35) {
      const socialLeader = racers.slice().sort((a, b) => pStats(b).social - pStats(a).social)[0];
      if (socialLeader) {
        const pr = pronouns(socialLeader);
        const _rallyTexts = [
          `${socialLeader} is running on nothing — but ${pr.sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} show it. ${pr.Sub} ${pr.sub === 'they' ? 'shout' : 'shouts'} at the tribe and somehow it works. They find something left and go.`,
          `"Come ON." ${socialLeader} pushes the tribe from behind, voice carrying over the trees. It shouldn't work this late in the race. It does.`,
          `The tribe is flagging. ${socialLeader} sees it and refuses to let it happen. Loud, relentless, impossible to ignore — the tribe picks up the pace.`,
          `${socialLeader} grabs the tribe's attention at the worst possible moment and turns it around. Whatever ${pr.sub} ${pr.sub === 'they' ? 'say' : 'says'} lands exactly right. They run.`,
        ];
        personalScores[socialLeader] = (personalScores[socialLeader] || 0) + 1.5;
        racers.filter(m => m !== socialLeader).forEach(m => addBond(m, socialLeader, 0.2));
        raceScores[t.name] += 2.0;
        phases.morningRace.push({
          type: 'soRally', phase: 'morningRace', players: [socialLeader],
          text: _rallyTexts[_hash(socialLeader + 'rally', _rallyTexts.length)],
          personalScores: { [socialLeader]: 1.5 }, badge: 'RALLIED THE TRIBE', badgeClass: 'gold'
        });
        raceEventCount++;
      }
    }
  });

  // ══ Determine Winner + Loser ══
  // Total survival score = AVERAGE personal score per member + race score (normalized)
  // Using averages so tribe size doesn't determine the winner
  const survivalScores = {};
  tribes.forEach(t => {
    const tribePersonalTotal = t.members.reduce((sum, m) => sum + (personalScores[m] || 0), 0);
    const avgPersonal = tribePersonalTotal / Math.max(1, t.members.length);
    const avgRace = (raceScores[t.name] || 0) / Math.max(1, t.members.length);
    survivalScores[t.name] = avgPersonal + avgRace;
  });

  // Auto-loss override: tribe whose lost players arrive after ALL other tribes finish
  const autoLoseTribes = new Set();
  tribes.forEach(t => {
    const tribeLost = lostPlayers.filter(lp => lp.tribe === t.name);
    if (!tribeLost.length) return;
    const maxDelay = Math.max(...tribeLost.map(lp => lp.returnDelay));
    // Check if any other tribe with no lost players finishes faster
    const otherTribes = tribes.filter(tr => tr.name !== t.name);
    const fastestOther = Math.min(...otherTribes.map(tr => tribeRaceTimes[tr.name]));
    if (maxDelay > fastestOther) autoLoseTribes.add(t.name);
  });

  // Sort tribes by survival score (auto-loss tribes go to bottom)
  const tribesSorted = [...tribes].sort((a, b) => {
    const aAuto = autoLoseTribes.has(a.name) ? -1000 : 0;
    const bAuto = autoLoseTribes.has(b.name) ? -1000 : 0;
    return (survivalScores[b.name] + bAuto) - (survivalScores[a.name] + aAuto);
  });

  const winner = tribesSorted[0];
  let loser = tribesSorted[tribesSorted.length - 1];

  // Tiebreaker for loser: fewer lost players, then higher camp quality
  const loserCandidates = tribesSorted.filter((t, i) => i > 0 && survivalScores[t.name] === survivalScores[loser.name] && !autoLoseTribes.has(t.name) && !autoLoseTribes.has(loser.name));
  if (loserCandidates.length) {
    const loserGroup = [loser, ...loserCandidates];
    loserGroup.sort((a, b) => {
      const aLost = lostPlayers.filter(lp => lp.tribe === a.name).length;
      const bLost = lostPlayers.filter(lp => lp.tribe === b.name).length;
      if (bLost !== aLost) return bLost - aLost; // more lost = worse
      return campQuality[a.name] - campQuality[b.name]; // lower quality = worse
    });
    loser = loserGroup[0];
  }

  // ══ Set episode fields ══
  ep.challengeType = 'tribe';
  ep.winner = gs.tribes.find(t => t.name === winner.name);
  ep.loser = gs.tribes.find(t => t.name === loser.name);
  ep.safeTribes = tribes.length > 2
    ? tribesSorted.slice(1, -1).map(t => gs.tribes.find(tr => tr.name === t.name)).filter(Boolean)
    : [];
  ep.challengeLabel = 'The Sucky Outdoors';
  ep.challengeCategory = 'endurance';
  ep.challengeDesc = 'Overnight survival. First tribe back in the morning wins.';
  ep.tribalPlayers = [...loser.members];
  ep.challengePlacements = tribesSorted.map(t => ({
    name: t.name, members: [...(gs.tribes.find(tr => tr.name === t.name)?.members || [])],
    memberScores: {},
  }));
  ep.chalMemberScores = { ...personalScores };
  ep.isSuckyOutdoors = true;

  // ══ Camp events: 3-4 per tribe (2 positive, 1-2 negative) ══
  tribes.forEach(t => {
    const key = t.name;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

    const usedPlayers = new Set();
    const sortedDesc = t.members.slice().sort((a, b) => (personalScores[b] || 0) - (personalScores[a] || 0));
    const sortedAsc  = t.members.slice().sort((a, b) => (personalScores[a] || 0) - (personalScores[b] || 0));
    const tribeLostNames = lostPlayers.filter(lp => lp.tribe === t.name).map(lp => lp.name);

    // ── POSITIVE #1: SURVIVOR — top personal scorer ──
    const topPerformer = sortedDesc.find(m => !usedPlayers.has(m));
    if (topPerformer && (personalScores[topPerformer] || 0) > 0) {
      const pr = pronouns(topPerformer);
      t.members.filter(m => m !== topPerformer).forEach(m => addBond(m, topPerformer, 0.2));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[topPerformer] = (gs.popularity[topPerformer] || 0) + 2;
      ep.campEvents[key].post.push({
        type: 'soSurvivor', players: [topPerformer],
        text: `${topPerformer} carried the tribe through the night. Every phase, ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the one people leaned on. The tribe feels it.`,
        consequences: '+0.5 bond with all tribemates, +2 popularity.',
        badgeText: 'SURVIVOR', badgeClass: 'gold'
      });
      usedPlayers.add(topPerformer);
    }

    // ── POSITIVE #2: CAMP BUILDER, BRAVE, or PEACEMAKER (pick one) ──
    const pos2Roll = Math.random();
    if (pos2Roll < 0.40) {
      // CAMP BUILDER — top shelter/fire contributor (endurance+mental)
      const builder = t.members.filter(m => !usedPlayers.has(m)).slice().sort((a, b) => {
        const sA = pStats(a), sB = pStats(b);
        return (sB.endurance * 0.04 + sB.mental * 0.03) - (sA.endurance * 0.04 + sA.mental * 0.03);
      })[0];
      if (builder) {
        const pr = pronouns(builder);
        t.members.filter(m => m !== builder).forEach(m => addBond(m, builder, 0.15));
        ep.campEvents[key].post.push({
          type: 'soCampBuilder', players: [builder],
          text: `${builder} built the shelter that kept everyone alive. Without ${pr.obj}, the night would have been a disaster.`,
          consequences: '+0.3 bond with all tribemates.',
          badgeText: 'CAMP BUILDER', badgeClass: 'gold'
        });
        usedPlayers.add(builder);
      }
    } else if (pos2Roll < 0.70) {
      // BRAVE — highest boldness among non-used players
      const braveEv = t.members.filter(m => !usedPlayers.has(m)).slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      if (braveEv && pStats(braveEv).boldness >= 5) {
        const pr = pronouns(braveEv);
        t.members.filter(m => m !== braveEv).forEach(m => addBond(m, braveEv, 0.15));
        if (!gs.playerStates) gs.playerStates = {};
        if (!gs.playerStates[braveEv]) gs.playerStates[braveEv] = {};
        gs.playerStates[braveEv].bigMoves = (gs.playerStates[braveEv].bigMoves || 0) + 1;
        ep.campEvents[key].post.push({
          type: 'soBrave', players: [braveEv],
          text: `When things went sideways in the night, ${braveEv} stepped up. ${pr.Sub} ${pr.sub === 'they' ? 'didn\'t' : 'didn\'t'} hesitate — and the tribe noticed.`,
          consequences: '+0.3 bond with all tribemates, +1 big move.',
          badgeText: 'BRAVE', badgeClass: 'gold'
        });
        usedPlayers.add(braveEv);
      }
    } else {
      // PEACEMAKER — highest social among non-used players
      const peacemaker = t.members.filter(m => !usedPlayers.has(m)).slice().sort((a, b) => pStats(b).social - pStats(a).social)[0];
      if (peacemaker && pStats(peacemaker).social >= 5) {
        const pr = pronouns(peacemaker);
        t.members.filter(m => m !== peacemaker).forEach(m => addBond(m, peacemaker, 0.15));
        ep.campEvents[key].post.push({
          type: 'soPeacemaker', players: [peacemaker],
          text: `${peacemaker} kept the tribe from falling apart. ${pr.Sub} ${pr.sub === 'they' ? 'smoothed' : 'smoothed'} over the arguments and held everyone together.`,
          consequences: '+0.3 bond with all tribemates.',
          badgeText: 'PEACEMAKER', badgeClass: 'gold'
        });
        usedPlayers.add(peacemaker);
      }
    }

    // ── NEGATIVE #1: COST THE TRIBE — always fires if someone was lost ──
    if (tribeLostNames.length > 0) {
      const lostName = tribeLostNames[0];
      if (!usedPlayers.has(lostName)) {
        const pr = pronouns(lostName);
        ep.campEvents[key].post.push({
          type: 'soCostTribe', players: [lostName],
          text: `${lostName} getting lost in the woods cost the tribe precious time in the morning race. Nobody is letting ${pr.obj} forget it.`,
          consequences: '+2.0 heat for 2 episodes.',
          badgeText: 'COST THE TRIBE', badgeClass: 'red'
        });
        usedPlayers.add(lostName);
      }
    }

    // ── BEAR HERO / BEAR PANIC camp events (if bear encounter happened) ──
    const bearEvt = phases.theNight.find(e => e.type === 'soBear' && e.players.some(p => t.members.includes(p)));
    if (bearEvt) {
      const bearBrave = bearEvt.players.find(p => t.members.includes(p) && pStats(p).boldness === Math.max(...t.members.map(m => pStats(m).boldness)));
      const bearPanicker2 = bearEvt.players.find(p => t.members.includes(p) && p !== bearBrave && pStats(p).boldness === Math.min(...bearEvt.players.filter(x => t.members.includes(x)).map(m => pStats(m).boldness)));
      if (bearBrave && !usedPlayers.has(bearBrave)) {
        const prBH = pronouns(bearBrave);
        t.members.filter(m => m !== bearBrave).forEach(m => addBond(m, bearBrave, 0.2));
        if (!gs.playerStates) gs.playerStates = {};
        if (!gs.playerStates[bearBrave]) gs.playerStates[bearBrave] = {};
        gs.playerStates[bearBrave].bigMoves = (gs.playerStates[bearBrave].bigMoves || 0) + 1;
        ep.campEvents[key].post.push({
          type: 'soBearHero', players: [bearBrave],
          text: `${bearBrave} stepped up when a bear came to camp. ${prBH.Sub} ${prBH.sub === 'they' ? 'didn\'t' : 'didn\'t'} run. The tribe will be talking about that moment for a while.`,
          consequences: '+0.4 bond with all tribemates, +1 big move.',
          badgeText: 'BEAR HERO', badgeClass: 'gold'
        });
        usedPlayers.add(bearBrave);
      }
      if (bearPanicker2 && bearPanicker2 !== bearBrave && !usedPlayers.has(bearPanicker2)) {
        const prBP = pronouns(bearPanicker2);
        t.members.filter(m => m !== bearPanicker2).forEach(m => addBond(m, bearPanicker2, -0.1));
        ep.campEvents[key].post.push({
          type: 'soBearPanic', players: [bearPanicker2],
          text: `${bearPanicker2} panicked when the bear showed up. ${prBP.Sub} ${prBP.sub === 'they' ? 'weren\'t' : 'wasn\'t'} the only one scared — but ${prBP.sub} ${prBP.sub === 'they' ? 'were' : 'was'} the loudest about it. The tribe hasn't forgotten.`,
          consequences: '-0.2 bond with all tribemates.',
          badgeText: 'BEAR PANIC', badgeClass: 'red'
        });
        usedPlayers.add(bearPanicker2);
      }
    }

    // ── NEGATIVE #2: DEAD WEIGHT, TROUBLEMAKER, or QUITTER ──
    const neg2Roll = Math.random();
    const neg2Candidate = sortedAsc.find(m => !usedPlayers.has(m) && (personalScores[m] || 0) < 0);
    if (neg2Candidate) {
      const pr = pronouns(neg2Candidate);
      const negArch = players.find(p => p.name === neg2Candidate)?.archetype || '';
      if (neg2Roll < 0.40) {
        // DEAD WEIGHT — lowest personal scorer
        t.members.filter(m => m !== neg2Candidate).forEach(m => addBond(m, neg2Candidate, -0.15));
        if (!gs._suckyOutdoorsHeat) gs._suckyOutdoorsHeat = {};
        gs._suckyOutdoorsHeat[neg2Candidate] = gs._suckyOutdoorsHeat[neg2Candidate] || { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
        ep.campEvents[key].post.push({
          type: 'soDeadWeight', players: [neg2Candidate],
          text: `${neg2Candidate} was the weak link last night. ${pr.Sub} ${pr.sub === 'they' ? 'scored' : 'scored'} at the bottom in nearly every phase, and the tribe isn't forgetting it.`,
          consequences: '-0.3 bond with all tribemates, +0.5 heat.',
          badgeText: 'DEAD WEIGHT', badgeClass: 'red'
        });
        usedPlayers.add(neg2Candidate);
      } else if (neg2Roll < 0.70 && !NICE_ARCHS.has(negArch)) {
        // TROUBLEMAKER — prank/mischief type
        t.members.filter(m => m !== neg2Candidate).forEach(m => addBond(m, neg2Candidate, -0.15));
        ep.campEvents[key].post.push({
          type: 'soTroublemaker', players: [neg2Candidate],
          text: `${neg2Candidate} made a bad night worse. Whatever ${pr.sub} ${pr.sub === 'they' ? 'did' : 'did'}, the tribe didn't need it — and they're still annoyed about it.`,
          consequences: '-0.3 bond with all tribemates.',
          badgeText: 'TROUBLEMAKER', badgeClass: 'red'
        });
        usedPlayers.add(neg2Candidate);
      } else {
        // QUITTER — slacker/refusal type
        t.members.filter(m => m !== neg2Candidate).forEach(m => addBond(m, neg2Candidate, -0.15));
        ep.campEvents[key].post.push({
          type: 'soQuitter', players: [neg2Candidate],
          text: `${neg2Candidate} gave up before the night even started. ${pr.Sub} ${pr.sub === 'they' ? 'found' : 'found'} reasons not to help at every turn. The tribe worked around ${pr.obj}.`,
          consequences: '-0.3 bond with all tribemates.',
          badgeText: 'QUITTER', badgeClass: 'red'
        });
        usedPlayers.add(neg2Candidate);
      }
    }
  });

  // ══ Heat for lost players ══
  if (!gs._suckyOutdoorsHeat) gs._suckyOutdoorsHeat = {};
  lostPlayers.forEach(lp => {
    gs._suckyOutdoorsHeat[lp.name] = { amount: 2.0, expiresEp: ((gs.episode || 0) + 1) + 2 };
  });

  // ══ Store episode data ══
  ep.suckyOutdoors = {
    phases,
    navigators,
    campQuality,
    campQSnaps,
    tribeFood,
    lostPlayers,
    survivalScores,
    winner: winner.name,
    loser: loser.name,
    autoLoseTribe: autoLoseTribes.size ? [...autoLoseTribes][0] : null,
  };

  updateChalRecord(ep);
}

export function _textSuckyOutdoors(ep, ln, sec) {
  if (!ep.isSuckyOutdoors || !ep.suckyOutdoors) return;
  const so = ep.suckyOutdoors;
  sec('THE SUCKY OUTDOORS');
  ln('Overnight survival challenge — first tribe back in the morning wins.');
  Object.entries(so.navigators || {}).forEach(([tribe, nav]) => ln(`${tribe} navigator: ${nav}`));
  // Food status per tribe
  if (so.tribeFood) {
    ln('Food Status:');
    Object.entries(so.tribeFood).forEach(([tribe, food]) => {
      const label = food === 0 ? 'STARVING' : food >= 3 ? 'WELL FED' : 'HUNGRY';
      ln(`  ${tribe}: ${food} food (${label})`);
    });
    ln('');
  }
  ['announcement', 'setupCamp', 'nightfall', 'theNight', 'morningRace'].forEach(phase => {
    const events = so.phases?.[phase] || [];
    if (!events.length) return;
    const labels = { announcement: 'HIKE', setupCamp: 'CAMP SETUP', nightfall: 'NIGHTFALL', theNight: 'THE NIGHT', morningRace: 'MORNING RACE' };
    ln('');
    ln(`── ${labels[phase] || phase} ──`);
    events.forEach(evt => {
      const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
      ln(`  [${evt.badge || evt.type}] ${evt.text}${scores ? ` (${scores})` : ''}`);
    });
  });
  if (so.lostPlayers?.length) {
    ln('');
    ln('LOST PLAYERS:');
    so.lostPlayers.forEach(lp => ln(`  ${lp.name} (${lp.tribe}) — lost in ${lp.lostInPhase}`));
  }
  // Bear encounter summary
  const bearEvent = Object.values(so.phases).flat().find(e => e.type === 'soBear');
  if (bearEvent) {
    ln('');
    ln(`BEAR ENCOUNTER: ${bearEvent.bearSuccess ? 'Bear scared off' : 'Bear wrecked camp'}`);
    bearEvent.text.split('\n').forEach(line => ln(`  ${line}`));
  }
  Object.entries(so.campQuality || {}).forEach(([tribe, q]) => ln(`${tribe} camp quality: ${q.toFixed(1)}`));
  ln(`Winner: ${so.winner}. ${so.loser} goes to tribal.`);
}

export function rpBuildSuckyOutdoors(ep) {
  const so = ep.suckyOutdoors;
  if (!so?.phases) return null;

  const stateKey = `so_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  // 6 reveals: announcement, hike, camp, nightfall, night, morning
  const PHASES = [
    { key: 'announcement', label: '📢 CHALLENGE ANNOUNCEMENT', bg: 'linear-gradient(180deg,#1a2a1a 0%,#0f1a0f 100%)', accent: '#3fb950', isAnnouncement: true },
    { key: 'hike',         label: '🥾 THE HIKE',               bg: 'linear-gradient(180deg,#1a2a1a 0%,#0f1a0f 100%)', accent: '#3fb950' },
    { key: 'setupCamp',    label: '🏕️ SETUP CAMP',           bg: 'linear-gradient(180deg,#2a1a0a 0%,#1a0f05 100%)', accent: '#f0a500' },
    { key: 'nightfall',    label: '🌙 NIGHTFALL',             bg: 'linear-gradient(180deg,#0a0a2a 0%,#050515 100%)', accent: '#8b5cf6' },
    { key: 'theNight',     label: '🌑 THE NIGHT',             bg: 'linear-gradient(180deg,#0a0508 0%,#050305 100%)', accent: '#f85149' },
    { key: 'morningRace',  label: '🌅 MORNING RACE',          bg: 'linear-gradient(180deg,#2a2a0a 0%,#1a1a05 100%)', accent: '#f0a500' },
  ];
  const totalPhases = PHASES.length;
  const allRevealed = state.idx >= totalPhases - 1;

  const _soReveal = (targetIdx) =>
    `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};` +
    `_tvState['${stateKey}'].idx=${targetIdx};` +
    `const ep=gs.episodeHistory.find(e=>e.num===${ep.num});` +
    `if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Helper: badge color from class string
  const _bc = (cls) => cls === 'gold' ? '#f0a500' : cls === 'red' ? '#f85149' : cls === 'blue' ? '#58a6ff' : cls === 'pink' ? '#db61a2' : '#8b949e';

  // Helper: score delta display
  const _scoreDelta = (scores) => {
    if (!scores || !Object.keys(scores).length) return '';
    return Object.entries(scores).map(([n, d]) => {
      const sign = d >= 0 ? '+' : '';
      const col = d >= 0 ? '#3fb950' : '#f85149';
      return `<span style="font-size:9px;font-weight:700;color:${col};margin-right:4px">${n}: ${sign}${d.toFixed(1)}</span>`;
    }).join('');
  };

  // Determine the ambient background for the page from the most recently revealed phase
  // (or dawn if nothing revealed yet)
  const ambientPhaseIdx = Math.max(0, Math.min(state.idx, totalPhases - 1));
  const ambientBg = PHASES[ambientPhaseIdx].bg;

  let html = `<div class="rp-page" style="background:${ambientBg};transition:background 0.8s ease">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#3fb950;text-shadow:0 0 20px rgba(63,185,80,0.3);margin-bottom:6px">THE SUCKY OUTDOORS</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:4px">Overnight survival in the woods. Five phases of drama.</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px">First tribe back in the morning wins immunity.</div>`;

  // Navigator pills
  if (so.navigators && Object.keys(so.navigators).length) {
    html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;justify-content:center">`;
    Object.entries(so.navigators).forEach(([tribe, nav]) => {
      const tc = tribeColor(tribe);
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;border:1px solid ${tc}55;background:${tc}10">
        ${rpPortrait(nav, 'xs')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${tc}">${tribe.toUpperCase()} NAVIGATOR</span>
      </div>`;
    });
    html += `</div>`;
  }

  // Render each phase
  PHASES.forEach((phase, phaseIdx) => {
    const isVisible = phaseIdx <= state.idx;
    // 'hike' phase reads from 'announcement' data; 'announcement' phase shows navigator selection only
    const events = phase.key === 'hike' ? (so.phases?.announcement || [])
      : phase.key === 'announcement' ? [] // announcement shows navigators, not events
      : (so.phases?.[phase.key] || []);

    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">${phase.label}</div>`;
      return;
    }

    html += `<div style="margin-bottom:20px;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;

    // Phase header
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:10px 14px;border-radius:8px;background:${phase.accent}14;border-left:3px solid ${phase.accent}">
      <span style="font-family:var(--font-display);font-size:14px;letter-spacing:1.5px;color:${phase.accent}">${phase.label}</span>
    </div>`;

    // Announcement phase: show navigator selection per tribe
    if (phase.isAnnouncement && so.navigators) {
      html += `<div style="font-size:12px;color:#cdd9e5;text-align:center;margin-bottom:12px;font-style:italic">Survive one night in the woods. Return to camp in the morning. First tribe back wins immunity.</div>`;
      Object.entries(so.navigators).forEach(([tribe, nav]) => {
        const tc = tribeColor(tribe);
        const pr = pronouns(nav);
        html += `<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:6px;border-radius:8px;border:1px solid ${tc}44;background:${tc}08">
          ${rpPortrait(nav, 'sm')}
          <div>
            <div style="font-size:12px;font-weight:700;color:${tc}">${tribe}</div>
            <div style="font-size:11px;color:#cdd9e5"><strong>${nav}</strong> takes the map and compass. ${pr.Sub} ${pr.sub === 'they' ? 'lead' : 'leads'} the way.</div>
          </div>
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${tc};margin-left:auto;background:${tc}18;padding:2px 8px;border-radius:3px">NAVIGATOR</span>
        </div>`;
      });
    }

    // Camp quality indicator — shows at setupCamp and every phase after
    const _campPhases = ['setupCamp', 'nightfall', 'theNight', 'morningRace'];
    if (_campPhases.includes(phase.key) && so.campQSnaps?.[phase.key]) {
      const snap = so.campQSnaps[phase.key];
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">`;
      Object.entries(snap).forEach(([tribe, q]) => {
        const tc = tribeColor(tribe);
        const qColor = q >= 8 ? '#3fb950' : q >= 6 ? '#f0a500' : q >= 4 ? '#f85149' : '#da3633';
        const qLabel = q >= 8 ? 'SOLID CAMP' : q >= 6 ? 'DECENT CAMP' : q >= 4 ? 'ROUGH CAMP' : 'WRECKED';
        html += `<div style="font-size:9px;padding:2px 8px;border-radius:4px;background:${qColor}18;color:${qColor};border:1px solid ${qColor}44">
          <span style="color:${tc};font-weight:700">${tribe}</span> ${qLabel} (${q.toFixed(1)})
        </div>`;
      });
      html += `</div>`;
    }

    // Events grouped by tribe
    if (events.length === 0 && !phase.isAnnouncement) {
      html += `<div style="font-size:11px;color:#6e7681;text-align:center;padding:10px">No events this phase.</div>`;
    }

    // Group events by tribe (use first player's tribe, or 'general' for cross-tribe)
    const _tribeGroups = {};
    const _tribeOrder = (ep.tribesAtStart || []).map(t => t.name);
    events.forEach(evt => {
      const firstPlayer = evt.players?.[0];
      let evtTribe = 'general';
      if (firstPlayer) {
        for (const t of (ep.tribesAtStart || [])) {
          if (t.members?.includes(firstPlayer)) { evtTribe = t.name; break; }
        }
      }
      if (!_tribeGroups[evtTribe]) _tribeGroups[evtTribe] = [];
      _tribeGroups[evtTribe].push(evt);
    });

    // Render in tribe order, then general
    const _renderOrder = [..._tribeOrder.filter(t => _tribeGroups[t]), ...(_tribeGroups.general ? ['general'] : [])];
    _renderOrder.forEach(tribeName => {
      const tribeEvents = _tribeGroups[tribeName] || [];
      if (!tribeEvents.length) return;
      if (tribeName !== 'general') {
        const tc = tribeColor(tribeName);
        html += `<div style="font-family:var(--font-display);font-size:12px;letter-spacing:1px;color:${tc};margin:10px 0 6px;padding-bottom:4px;border-bottom:1px solid ${tc}22">${tribeName.toUpperCase()}</div>`;
      }

    tribeEvents.forEach(evt => {
      const isLostEvt = evt.type === 'soLost' || evt.type === 'soCostTribe';
      const bc = _bc(evt.badgeClass || (isLostEvt ? 'red' : 'gold'));
      const players = evt.players || [];

      if (isLostEvt) {
        // Dramatic full-width lost card
        html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;border:2px solid rgba(248,81,73,0.4);background:rgba(248,81,73,0.08);animation:scrollDrop 0.3s var(--ease-broadcast) both">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            ${players.map(p => rpPortrait(p, 'sm')).join('')}
            <span style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;background:rgba(248,81,73,0.18);padding:3px 10px;border-radius:3px">${evt.badge || 'LOST'}</span>
          </div>
          <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
          ${_scoreDelta(evt.personalScores) ? `<div style="margin-top:6px">${_scoreDelta(evt.personalScores)}</div>` : ''}
        </div>`;
      } else {
        // Standard event card
        html += `<div style="padding:10px 14px;margin-bottom:6px;border-radius:8px;border:1px solid ${bc}28;background:${bc}07;animation:scrollDrop 0.3s var(--ease-broadcast) both">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            ${players.map(p => rpPortrait(p, 'sm')).join('')}
            <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bc};background:${bc}18;padding:2px 8px;border-radius:3px">${evt.badge || evt.type}</span>
            ${_scoreDelta(evt.personalScores) ? `<div style="margin-left:auto">${_scoreDelta(evt.personalScores)}</div>` : ''}
          </div>
          <div style="font-size:12px;color:#8b949e;line-height:1.5">${evt.text}</div>
        </div>`;
      }
    }); // end tribeEvents.forEach
    }); // end _renderOrder.forEach

    // Morning race: show tribe score bars
    if (phase.key === 'morningRace' && so.survivalScores) {
      const scores = Object.entries(so.survivalScores);
      const maxScore = Math.max(...scores.map(([,v]) => Math.abs(v)), 1);
      html += `<div style="margin-top:12px;padding:12px;border-radius:8px;border:1px solid rgba(240,165,0,0.2);background:rgba(240,165,0,0.04)">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f0a500;margin-bottom:10px">FINAL SURVIVAL SCORES</div>`;
      scores.sort((a,b) => b[1] - a[1]).forEach(([tribe, score]) => {
        const tc = tribeColor(tribe);
        const pct = score > 0 ? Math.round((score / maxScore) * 100) : 0;
        const isWinner = tribe === so.winner;
        html += `<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:11px;font-weight:700;color:${tc}">${tribe}${isWinner ? ' 🏆' : ''}</span>
            <span style="font-size:11px;color:#8b949e">${score.toFixed(1)}</span>
          </div>
          <div style="height:6px;border-radius:3px;background:rgba(255,255,255,0.06)">
            <div style="height:6px;border-radius:3px;background:${tc};width:${pct}%;transition:width 0.6s ease"></div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`; // close phase wrapper
  });

  // Final result (only after all phases revealed)
  if (allRevealed && so.winner) {
    const winnerColor = tribeColor(so.winner);
    const loserColor = tribeColor(so.loser);

    // Cost-the-tribe auto-loss card if relevant
    const costPlayers = so.lostPlayers?.filter(lp => lp.tribe === so.loser) || [];
    if (costPlayers.length > 0) {
      html += `<div style="padding:14px;margin-bottom:10px;border-radius:10px;border:2px solid rgba(248,81,73,0.4);background:rgba(248,81,73,0.08);text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;margin-bottom:6px">COST THE TRIBE</div>
        <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:6px">
          ${costPlayers.map(lp => rpPortrait(lp.name, 'sm')).join('')}
        </div>
        <div style="font-size:12px;color:#8b949e">${costPlayers.map(lp => lp.name).join(' & ')} got lost. ${so.loser} pays the price.</div>
      </div>`;
    }

    html += `<div style="padding:18px;margin-top:4px;border-radius:12px;border:2px solid ${winnerColor}44;background:${winnerColor}0a;text-align:center">
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:#3fb950;margin-bottom:6px">IMMUNITY</div>
      <div style="font-size:18px;font-weight:700;color:${winnerColor};margin-bottom:4px">${so.winner}</div>
      <div style="font-size:11px;color:#8b949e">First tribe back in the morning.</div>
    </div>`;

    if (so.loser) {
      html += `<div style="padding:12px;margin-top:8px;border-radius:8px;border:1px solid rgba(248,81,73,0.2);background:rgba(248,81,73,0.04);text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#f85149;margin-bottom:4px">TRIBAL COUNCIL</div>
        <div style="font-size:14px;font-weight:700;color:${loserColor}">${so.loser}</div>
      </div>`;
    }

    // Navigator shoutout
    if (so.navigators?.[so.winner]) {
      const nav = so.navigators[so.winner];
      html += `<div style="padding:10px;margin-top:8px;border-radius:8px;background:rgba(240,165,0,0.06);border:1px solid rgba(240,165,0,0.2);display:flex;align-items:center;gap:10px">
        ${rpPortrait(nav, 'sm')}
        <div>
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500">★ WINNING NAVIGATOR</div>
          <div style="font-size:12px;color:#e6edf3;margin-top:2px">${nav} led ${so.winner} through the wilderness.</div>
        </div>
      </div>`;
    }
  }

  // Sticky NEXT / REVEAL ALL buttons
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,${PHASES[Math.max(0,state.idx)].bg.split(',')[1]?.split(')')[0] || 'rgba(10,20,10,0.95)'} 30%);z-index:5">
      <button class="rp-btn" style="background:linear-gradient(135deg,#3fb950,#2ea043);color:#000;font-weight:700;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;box-shadow:0 0 12px rgba(63,185,80,0.2)"
        onclick="${_soReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalPhases})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_soReveal(totalPhases - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

