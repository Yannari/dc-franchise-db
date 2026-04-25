// js/chal/million-bucks-bc.js — One Million Bucks, B.C. prehistoric challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── HELPERS ──
function getArchetype(name) { return players.find(p => p.name === name)?.archetype || ''; }
const VILLAIN_ARCHETYPES = ['villain', 'mastermind', 'schemer'];
function isVillainArch(name) { return VILLAIN_ARCHETYPES.includes(getArchetype(name)); }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function noise(range = 0.15) { return (Math.random() - 0.5) * range; }
function host() { return seasonConfig?.hostName || 'Chris'; }

// ── HOST LINES ──
const BC_HOST = {
  intro: [
    (h) => `${h} appeared in a loincloth. "Welcome to the Stone Age, maggots. Today, you go PREHISTORIC."`,
    (h) => `"Today's challenge is a period movie," ${h} grinned. "And the period... is the Palaeolithic."`,
    (h) => `${h} blew a massive bone horn. "FIRE. COLUMNS. TAR PITS. Let's go caveman."`,
  ],
  fireIntro: [
    (h) => `"Phase one: make fire. With rocks. No matches, no lighters, no phones." ${h} tossed two stones at each team.`,
    (h) => `"Cro-Magnon man figured this out 40,000 years ago." ${h} crossed his arms. "You've got five minutes."`,
  ],
  battleIntro: [
    (h) => `"Phase two: BONE BATTLE!" ${h} pointed at the wooden columns rising over a bubbling tar pit.`,
    (h) => `"Climb the column. Grab your bone. Knock the others into the tar." ${h} cracked his knuckles.`,
  ],
  bigBones: [
    (h, tribe) => `"Since ${tribe} won fire-making, they get the BIGGER bones." ${h} held up a comically oversized femur.`,
  ],
  cheatCaught: [
    (h, name) => `"HOLD UP!" ${h} rewound the footage. "We got ${name} on camera with a LIGHTER. Penalty!"`,
    (h, name) => `${h} zoomed into the monitor. "Is that... a Bic lighter? ${name}, you CHEATER!"`,
  ],
  fireNone: [
    (h, tribe) => `${h} stared at ${tribe}'s pile of rocks. "That's not fire. That's not even warm."`,
    (h, tribe) => `"${tribe}... you literally have NOTHING." ${h} shook his head. "Cro-Magnon man is rolling in his grave."`,
    (h, tribe) => `${h} poked ${tribe}'s cold rock pile with a stick. "This is the saddest thing I've ever seen on this show."`,
  ],
  fireTiny: [
    (h, tribe) => `${h} squinted at ${tribe}'s tiny spark. "Is that... is that supposed to be fire?"`,
    (h, tribe) => `"I've seen birthday candles bigger than that." ${h} looked at ${tribe}'s pathetic flame.`,
    (h, tribe) => `${h} cupped his hand around ${tribe}'s flame. "Don't sneeze. You'll put it out."`,
  ],
  fireMedium: [
    (h, tribe) => `${h} nodded at ${tribe}'s fire. "Not bad. Not great. But you won't freeze tonight."`,
    (h, tribe) => `"Decent flame, ${tribe}." ${h} warmed his hands over it. "Decent."`,
  ],
  fireBig: [
    (h, tribe) => `"NOW we're talking!" ${h} jumped back from ${tribe}'s roaring bonfire. "That's REAL fire!"`,
    (h, tribe) => `${h}'s eyes lit up as ${tribe}'s fire exploded. "THAT is how cavemen did it! Beautiful!"`,
    (h, tribe) => `"WHOA!" ${h} shielded his face from the heat. "${tribe} just built a BONFIRE!"`,
  ],
  matchup: [
    (h) => `${h} blew the bone horn. "NEXT FIGHTERS — STEP UP!"`,
    (h) => `"Alright, next round." ${h} checked his clipboard. "This should be good."`,
  ],
  tiebreaker: [
    (h) => `"We've got a TIE! Each team — pick your champion. One column. One fight. WINNER TAKES ALL."`,
  ],
  tarSplash: [
    () => `SPLOOOOSH! Into the tar pit!`,
    () => `Down they go — straight into the bubbling tar!`,
    () => `The tar pit claims another victim!`,
  ],
};

// ── FIRE EVENTS ──
const FIRE_EVENTS = {
  goodContrib: [
    (p, pr) => `${p} found perfectly dry kindling. "This'll catch in seconds."`,
    (p, pr) => `${p} struck the rocks together with precision — sparks flew!`,
    (p, pr) => `${p} blew gently on the ember. The flame grew. "Come on... come ON..."`,
    (p, pr) => `${p} remembered ${pr.posAdj} scout training. Tinder nest, spark, blow. Textbook.`,
    (p, pr) => `${p} stacked the wood in a perfect teepee formation. The fire roared to life.`,
    (p, pr) => `${p} shielded the flame from the wind with ${pr.posAdj} body. It held.`,
  ],
  badContrib: [
    (p, pr) => `${p} gathered soaking wet branches. "This'll work... right?"`,
    (p, pr) => `${p} accidentally stepped on the ember pile. "Oops."`,
    (p, pr) => `${p} struck the rocks together and hit ${pr.posAdj} own thumb. "OW!"`,
    (p, pr) => `${p} blew too hard on the flame and put it out. "...My bad."`,
    (p, pr) => `${p} kept arguing about technique instead of actually doing anything.`,
    (p, pr) => `${p} wandered off looking for wood and came back with a rock. "What? It looked burnable."`,
  ],
  cheatSuccess: [
    (p, pr) => `${p} palmed a lighter when nobody was looking. Click — instant flame.`,
    (p, pr) => `${p} had a lighter tucked in ${pr.posAdj} loincloth. One flick. Fire. Done.`,
  ],
  cheatCaught: [
    (p, pr) => `${p} tried to sneak a lighter but the cameras caught EVERYTHING.`,
    (p, pr) => `${p} pulled out a lighter — and ${host()} immediately spotted it on the monitor.`,
  ],
  accidentalClutch: [
    (p, pr) => `${p} smashed the rocks together randomly — and a MASSIVE fire erupted! "...I did that?"`,
    (p, pr) => `${p} tripped, knocked the rocks together, and somehow started the biggest fire of the day.`,
    (p, pr) => `"Is it supposed to be this big?!" ${p} stared at the bonfire ${pr.sub} accidentally created.`,
  ],
  argue: [
    (a, b) => `${a} and ${b} argued over how to stack the wood. "TEEPEE!" "LOG CABIN!" Time wasted.`,
    (a, b) => `"Give me the rocks!" "No, I'M doing it!" ${a} and ${b} fought over the fire-starting tools.`,
  ],
};

// ── BATTLE EVENTS ──
const BATTLE_EVENTS = {
  mountColumn: [
    (p, pr) => `${p} vaulted onto the column in one leap. No hesitation.`,
    (p, pr) => `${p} climbed up, peered down at the bubbling tar. ${pr.Sub} took a deep breath.`,
    (p, pr) => `${p} stood atop ${pr.posAdj} column, bone raised high. Warrior pose.`,
    (p, pr) => `${p} hauled ${pr.ref} up the column, knuckles white on the wood.`,
    (p, pr) => `${p} reached the top and tested ${pr.posAdj} footing. Solid enough.`,
    (p, pr) => `${p} scrambled up the column, nearly slipping twice. Made it.`,
  ],
  matchupReaction: {
    eager: [
      (p, pr) => `${p} cracked ${pr.posAdj} knuckles. "Let's DO this."`,
      (p, pr) => `${p} bounced on ${pr.posAdj} toes. Ready to rumble.`,
      (p, pr) => `${p} grabbed ${pr.posAdj} bone and gave it a test swing. "Oh yeah."`,
      (p, pr) => `${p} slapped ${pr.posAdj} chest. "COME ON!"`,
    ],
    nervous: [
      (p, pr) => `${p} looked up at the columns. "Those look... high."`,
      (p, pr) => `${p} swallowed hard. "Can I forfeit?"`,
      (p, pr) => `${p} measured the distance to the tar pit. "That's gonna hurt."`,
      (p, pr) => `${p} whispered to ${pr.ref}: "Just don't embarrass yourself."`,
    ],
    cocky: [
      (p, pr) => `${p} flexed for the camera. "Save me the highlight reel."`,
      (p, pr) => `"You're looking at your winner." ${p} pointed at ${pr.ref}.`,
      (p, pr) => `${p} yawned. "Wake me up when someone worth fighting shows up."`,
      (p, pr) => `${p} inspected ${pr.posAdj} bone. "This won't take long."`,
    ],
    rivalry: [
      (p, rival) => `${p} locked eyes with ${rival}. "YOU. You're going DOWN."`,
      (p, rival) => `${p}'s jaw tightened when ${pr.sub} saw ${rival}. This was personal.`,
      (p, rival) => `${p} pointed ${pr.posAdj} bone directly at ${rival}. No words needed.`,
      (p, rival) => `"Finally." ${p} stared at ${rival} with pure intensity.`,
    ],
  },
  openSwing: [
    (p, pr) => `${p} lunged forward with a wild overhead swing — whoosh!`,
    (p, pr) => `${p} feinted left, then jabbed right. Testing the waters.`,
    (p, pr) => `${p} planted ${pr.posAdj} feet and held the bone like a spear. Defensive.`,
    (p, pr) => `${p} spun the bone like a staff and launched a quick strike!`,
    (p, pr) => `${p} circled on the column, bone low, eyes locked on the others.`,
    (p, pr) => `${p} went straight for the legs — a sweeping arc just above the platform!`,
  ],
  beaverAttack: [
    (p, pr) => `WOOLLY BEAVERS gnawed through ${p}'s column base! The whole thing tilted!`,
    (p, pr) => `A pack of woolly beavers swarmed ${p}'s column! Wood chips flying everywhere!`,
    (p, pr) => `CRUNCH CRUNCH CRUNCH — beavers were eating ${p}'s column alive!`,
  ],
  hornBlast: [
    (p, pr) => `${host()} blew the bone horn — BRAAAAP! ${p} flinched and nearly fell!`,
    (p, pr) => `The foghorn blast echoed across the set. ${p} grabbed the column in panic!`,
    (p, pr) => `HOOOOONK! The horn shook the platforms. ${p} lost ${pr.posAdj} footing for a second!`,
  ],
  wildlifeSnatch: [
    (p, pr) => `A giant prehistoric bird swooped down and snatched ${p}'s bone right out of ${pr.posAdj} hands!`,
    (p, pr) => `A pterodactyl dove at ${p}! ${pr.Sub} ducked but the wind nearly knocked ${pr.obj} off!`,
    (p, pr) => `Something HUGE flew overhead and clipped ${p}'s column. Feathers everywhere!`,
  ],
  columnCrack: [
    (p, pr) => `CRACK! ${p}'s column split with a sickening sound. Splinters flying!`,
    (p, pr) => `The wood beneath ${p} groaned like it was about to snap in half.`,
    (p, pr) => `${p}'s column started swaying — the base was giving out!`,
  ],
  showboatSuccess: [
    (p, pr) => `${p} posed on the column like a Greek god. The crowd went WILD.`,
    (p, pr) => `${p} kissed ${pr.posAdj} bicep mid-fight. Confidence at maximum.`,
    (p, pr) => `${p} did a little dance on the column. Cocky — but it worked.`,
  ],
  showboatFail: [
    (p, pr) => `${p} was too busy posing and caught a bone to the ribs! "HEY!"`,
    (p, pr) => `${p} turned to flex for the camera — and got blindsided!`,
    (p, pr) => `${p} blew a kiss to the crowd. An opponent swept ${pr.posAdj} ankle while ${pr.sub} was distracted.`,
  ],
  trashTalkSuccess: [
    (p, target) => `"Nice bone. Compensating for something?" ${p} got in ${target}'s head.`,
    (p, target) => `"Tar pit's got a spot with your name on it." ${p} smirked at ${target}.`,
    (p, target) => `"My grandma swings harder than you, ${target}." ${p} was relentless.`,
    (p, target) => `"You look scared, ${target}. You SHOULD be." ${p} wasn't playing.`,
    (p, target) => `${p} made the "you're going down" gesture at ${target}. Cold.`,
  ],
  trashTalkFail: [
    (p, target) => `${p} tried to trash talk but ${target} just laughed in ${p}'s face.`,
    (p, target) => `"Is that the best you got?" ${target} wasn't impressed by ${p}'s taunting.`,
    (p, target) => `${p} opened ${p === target ? '' : 'their '}mouth to talk smack — and forgot what to say.`,
    (p, target) => `${p} tried a comeback but stumbled over ${p === target ? '' : 'the '}words. Embarrassing.`,
  ],
  gripHold: [
    (p, pr) => `${p}'s arms were shaking but ${pr.sub} REFUSED to let go. Pure grit.`,
    (p, pr) => `Sweat dripped. Muscles burned. ${p} dug ${pr.posAdj} nails into the wood.`,
    (p, pr) => `${p} wrapped ${pr.posAdj} legs around the column. Not falling. Not today.`,
  ],
  gripSlip: [
    (p, pr) => `${p}'s grip slipped! ${pr.Sub} scrambled, barely catching the edge!`,
    (p, pr) => `Fatigue hit ${p} like a wall. ${pr.Sub} swayed dangerously.`,
    (p, pr) => `${p}'s knees buckled on the platform. Running on fumes.`,
  ],
  knockOff: [
    (a, b) => `${a} SMASHED ${b} with a devastating swing! ${b} went FLYING!`,
    (a, b) => `${a} swept ${b}'s legs — ${b} tumbled backward off the column!`,
    (a, b) => `One final overhead SLAM from ${a}. ${b} didn't stand a chance.`,
    (a, b) => `${a} shoulder-checked ${b} right off the platform! GONE!`,
    (a, b) => `${a} faked high, struck low. ${b}'s feet left the column.`,
    (a, b) => `${a} caught ${b} off-balance with a spinning strike. Off the edge!`,
  ],
  selfFall: [
    (p, pr) => `${p} lost ${pr.posAdj} balance completely — arms windmilling — and toppled!`,
    (p, pr) => `${p}'s column finally gave out. Nothing to grab. Nothing to do but fall.`,
    (p, pr) => `${p} stepped backward into thin air. The look on ${pr.posAdj} face said it all.`,
  ],
  lastStanding: [
    (p, pr) => `${p} stood alone, bone raised overhead. VICTORIOUS!`,
    (p, pr) => `${p} ROARED from the top of ${pr.posAdj} column. The undisputed winner!`,
    (p, pr) => `${p} planted ${pr.posAdj} bone in the column like a flag. THIS round belongs to ${pr.obj}.`,
    (p, pr) => `${p} beat ${pr.posAdj} chest with the bone. CAVEMAN CHAMPION!`,
  ],
  tarSplash: [
    (p, pr) => `${p} hit the tar with a massive SPLAT. ${pr.Sub} surfaced, black from head to toe.`,
    (p, pr) => `${p} sank into the bubbling tar. "This is SO gross." ...At least ${pr.posAdj} skin looked great now.`,
    (p, pr) => `SPLOOSH! ${p} disappeared into the black ooze. A hand emerged. Then a face. Not happy.`,
    (p, pr) => `The tar swallowed ${p} whole. A bubble popped. Then ${pr.sub} surfaced, spitting black goo.`,
    (p, pr) => `${p} belly-flopped into the tar pit. The splash hit the front row.`,
  ],
  // Drama breaks
  confessional: [
    (p, pr) => `${p}: "I didn't come here to eat bugs and lose to THAT person."`,
    (p, pr) => `${p}: "The tar is warm, actually. Which is somehow worse."`,
    (p, pr) => `${p}: "If I win this, nobody can call me a floater anymore."`,
    (p, pr) => `${p}: "Cave-person era? I was BORN for this."`,
    (p, pr) => `${p}: "I can still taste the tar. It tastes like regret."`,
    (p, pr) => `${p}: "My strategy? Hit them. With the bone. Hard."`,
    (p, pr) => `${p}: "I didn't train for this but honestly? Adrenaline is a drug."`,
    (p, pr) => `${p}: "${host()} is enjoying this way too much."`,
  ],
  hostBetweenRounds: [
    (h) => `${h} munched on popcorn between rounds. "This is GREAT television."`,
    (h) => `"Can we get a replay on that last fall?" ${h} pointed at the monitor. "Beautiful."`,
    (h) => `${h} poked the tar pit with a stick. "Still warm. Still gross. Still funny."`,
    (h) => `"Remember, the tar pit is REAL." ${h} paused. "Well, real-ish. Chef mixed it."`,
    (h) => `${h} checked his watch. "Alright, let's keep the carnage going."`,
  ],
  showmanceWatch: [
    (a, b) => `${a} watched ${b} fight from below, hands clasped. "Be careful up there!"`,
    (a, b) => `${a} winced every time ${b} took a hit. "That's my person up there..."`,
  ],
  schemeWhisper: [
    (a, b) => `${a} whispered to ${b}: "When you get up there, go for the legs first."`,
    (a, b) => `${a} slipped ${b} advice before the round: "Watch their left side. It's weak."`,
  ],
  crowdReaction: [
    (tribe) => `${tribe}'s bench erupted in cheers! "FINISH THEM!"`,
    (tribe) => `${tribe}'s teammates banged their bones on the ground in unison. War drums.`,
    (tribe) => `${tribe}'s players started a chant. The column fighters could feel the energy.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// MAIN SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateMillionBucksBC(ep, tribes) {
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));
  const result = {
    fireMaking: { tribes: [] },
    boneBattle: { rounds: [], tiebreaker: null },
    fireWinner: null,
    tribeScores: {},
  };

  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });
  ep.millionBucksBC = result;
  ep.challengeType = 'million-bucks-bc';
  ep.challengeLabel = "One Million Bucks, B.C.";

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // ── TWO PHASES + DRAMA BREAK ──
  _simulateFireMaking(ep, tribeMembers, result);
  _simulatePrehistoricBreak(ep, tribeMembers, result);
  _simulateBoneBattle(ep, tribeMembers, result);

  // ── FINAL SCORING ──
  // Tribe immunity = bone battle wins ONLY (fire just gives bigger bones advantage)
  for (const t of tribeMembers) {
    result.tribeScores[t.name] = result.boneBattle.battleScores?.[t.name] || 0;
  }

  // Tiebreaker already handled in _simulateBoneBattle — scores include TB points
  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);
  ep.tribalPlayers = ep.loser ? [...ep.loser.members] : [];
  ep.challengeCategory = 'mixed';

  result.winner = winnerName;
  result.loser = loserName;

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = {
    type: 'million-bucks-bc',
    label: "One Million Bucks, B.C.",
    winner: winnerName,
    loser: loserName,
    tribeScores: { ...result.tribeScores },
  };

  return ep;
}

// ══════════════════════════════════════════════════════════════
// PHASE 1: FIRE MAKING
// ══════════════════════════════════════════════════════════════
function _simulateFireMaking(ep, tribeMembers, result) {
  for (const tribe of tribeMembers) {
    const members = tribe.members;
    const events = [];
    let fireScore = 0;

    for (const name of members) {
      const s = pStats(name);
      const pr = pronouns(name);

      // Cheating attempt — villain/schemer, ~25%
      if (isVillainArch(name) && Math.random() < 0.25) {
        const cheatCheck = s.boldness * 0.04 + s.intuition * 0.03 + noise(0.2);
        if (cheatCheck > 0.30) {
          events.push({ type: 'cheatSuccess', player: name, icon: '🔥',
            text: pick(FIRE_EVENTS.cheatSuccess)(name, pr) });
          fireScore += 3;
          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
        } else {
          events.push({ type: 'cheatCaught', player: name, icon: '📹',
            text: pick(FIRE_EVENTS.cheatCaught)(name, pr) });
          events.push({ type: 'hostCall', player: name, icon: '📢',
            text: pick(BC_HOST.cheatCaught)(host(), name) });
          fireScore -= 2;
          popDelta(name, -2);
        }
        continue;
      }

      // Accidental clutch — low mental, ~10%
      if (s.mental < 5 && Math.random() < 0.1) {
        events.push({ type: 'accidentalClutch', player: name, icon: '🔥',
          text: pick(FIRE_EVENTS.accidentalClutch)(name, pr) });
        fireScore += 2;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
        popDelta(name, 2);
        continue;
      }

      // Normal contribution
      const check = s.physical * 0.02 + s.mental * 0.02 + s.endurance * 0.01 + noise(0.35);
      if (check > 0.28) {
        events.push({ type: 'goodContrib', player: name, icon: '🔥',
          text: pick(FIRE_EVENTS.goodContrib)(name, pr) });
        fireScore += 1;
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 1;
      } else {
        events.push({ type: 'badContrib', player: name, icon: '💨',
          text: pick(FIRE_EVENTS.badContrib)(name, pr) });
        fireScore -= 0.2;
      }
    }

    // Argue event — low bond pair, ~30%
    if (members.length >= 2 && Math.random() < 0.3) {
      const pair = members.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      if (getBond(pair[0], pair[1]) < 3) {
        events.push({ type: 'argue', player: pair[0], player2: pair[1], icon: '🗣️',
          text: pick(FIRE_EVENTS.argue)(pair[0], pair[1]) });
        fireScore -= 0.3;
      }
    }

    result.fireMaking.tribes.push({
      tribe: tribe.name, fireScore: Math.max(0, fireScore), events,
      members: [...members],
    });
  }

  // Determine fire winner
  const sorted = [...result.fireMaking.tribes].sort((a, b) => b.fireScore - a.fireScore);
  result.fireWinner = sorted[0].tribe;
}

// ══════════════════════════════════════════════════════════════
// PREHISTORIC BREAK — camp events between phases
// ══════════════════════════════════════════════════════════════
const BC_DRAMA_EVENTS = [
  {
    id: 'fireRespect',
    check(ep, all) { return ep.millionBucksBC?.fireMaking?.tribes?.some(ft => ft.events.some(e => e.type === 'goodContrib')); },
    apply(ep, all) {
      const goodPlayers = ep.millionBucksBC.fireMaking.tribes.flatMap(ft => ft.events.filter(e => e.type === 'goodContrib').map(e => e.player));
      if (goodPlayers.length < 2) return null;
      const a = pick(goodPlayers);
      const others = goodPlayers.filter(n => n !== a);
      const b = pick(others);
      addBond(a, b, 0.4);
      const texts = [
        `${a} nodded at ${b} across the campfire. "You know your way around rocks." A quiet respect formed.`,
        `${b} caught ${a}'s eye after the fire challenge. "Nice work out there." ${a} grinned. A bond sparked.`,
        `${a} and ${b} sat by the dying embers, trading fire-starting tips. Mutual respect growing.`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'FIRE RESPECT', badgeClass: 'amber' };
    },
  },
  {
    id: 'failBlame',
    check(ep, all) { return ep.millionBucksBC?.fireMaking?.tribes?.some(ft => ft.events.some(e => e.type === 'badContrib')); },
    apply(ep, all) {
      const badByTribe = ep.millionBucksBC.fireMaking.tribes.map(ft => ({
        tribe: ft.tribe,
        fails: ft.events.filter(e => e.type === 'badContrib').map(e => e.player),
        goods: ft.events.filter(e => e.type === 'goodContrib').map(e => e.player),
      })).filter(t => t.fails.length && t.goods.length);
      if (!badByTribe.length) return null;
      const t = pick(badByTribe);
      const blamer = pick(t.goods);
      const blamed = pick(t.fails);
      addBond(blamer, blamed, -0.4);
      const texts = [
        `${blamer} pulled ${blamed} aside. "You almost cost us the fire. Get it together."`,
        `"Wet branches? Really?" ${blamer} couldn't hide the frustration with ${blamed}.`,
        `${blamer} gave ${blamed} a look after the fire challenge. The kind that doesn't need words.`,
      ];
      return { text: pick(texts), players: [blamer, blamed], badgeText: 'BLAME', badgeClass: 'red' };
    },
  },
  {
    id: 'loinclotheComplaint',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const a = pick(all);
      const b = pick(all.filter(n => n !== a));
      addBond(a, b, 0.3);
      const aPr = pronouns(a);
      const texts = [
        `"This loincloth is riding up in places I didn't know existed." ${a} tugged at the fabric. ${b} laughed so hard ${b} snorted.`,
        `${a} and ${b} compared loincloths. "Mine smells like Chef's cooking." "That's an IMPROVEMENT."`,
        `"I feel like a cave-person Tarzan," ${a} complained. ${b} wheezed. "You LOOK like one too."`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'COSTUME DRAMA', badgeClass: 'amber' };
    },
  },
  {
    id: 'caveBonding',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      if (getBond(pair[0], pair[1]) > 5) return null;
      addBond(pair[0], pair[1], 0.5);
      const texts = [
        `${pair[0]} and ${pair[1]} huddled by the fire sharing prehistoric jokes. "What does a caveman use for a phone? A MEGA-phone." Bonding over bad humor.`,
        `${pair[0]} drew a stick figure of ${pair[1]} on the cave wall. ${pair[1]} added muscles. They both laughed.`,
        `${pair[0]} offered ${pair[1]} a share of dried mammoth jerky. "I found it behind the prop truck." Friendship fuel.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'CAVE BONDING', badgeClass: 'green' };
    },
  },
  {
    id: 'caveGrudge',
    check(ep, all) {
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -1) return true;
      return false;
    },
    apply(ep, all) {
      const pairs = [];
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -1) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.3);
      const texts = [
        `${a} "accidentally" kicked dirt into ${b}'s loincloth. "Oops." ${b} wasn't buying it.`,
        `${a} and ${b} sat on opposite sides of the set. The silence between them was deafening.`,
        `${b} caught ${a} glaring at them. "Got a problem, cave-person?" The tension thickened.`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'CAVE GRUDGE', badgeClass: 'red' };
    },
  },
  {
    id: 'cheatFallout',
    check(ep, all) { return ep.millionBucksBC?.fireMaking?.tribes?.some(ft => ft.events.some(e => e.type === 'cheatCaught')); },
    apply(ep, all) {
      const cheaters = ep.millionBucksBC.fireMaking.tribes.flatMap(ft => ft.events.filter(e => e.type === 'cheatCaught').map(e => e.player));
      if (!cheaters.length) return null;
      const cheater = pick(cheaters);
      const teammate = all.find(n => n !== cheater && ep.millionBucksBC.fireMaking.tribes.some(ft => ft.members.includes(n) && ft.members.includes(cheater)));
      if (!teammate) return null;
      addBond(teammate, cheater, -0.5);
      const texts = [
        `"A LIGHTER? Really?" ${teammate} was furious with ${cheater}. "You cost us the bigger bones!"`,
        `${teammate} wouldn't look at ${cheater} after the cheating penalty. Trust broken.`,
        `"Way to go, genius." ${teammate} slow-clapped at ${cheater}. The sarcasm could cut stone.`,
      ];
      return { text: pick(texts), players: [teammate, cheater], badgeText: 'CHEAT FALLOUT', badgeClass: 'red' };
    },
  },
  {
    id: 'strategyTalk',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} pulled ${pair[1]} aside. "When the bone battle starts, target the weakest first. Agreed?" A nod. Alliance formed.`,
        `${pair[0]} and ${pair[1]} discussed strategy behind the columns. "We don't hit each other. Deal?" "Deal."`,
        `"If we're on the same column, I've got your back," ${pair[0]} told ${pair[1]}. A prehistoric pact.`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'STRATEGY', badgeClass: 'teal' };
    },
  },
  {
    id: 'tarPitDare',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const darer = all.find(n => pStats(n).boldness >= 6);
      if (!darer) return null;
      const target = pick(all.filter(n => n !== darer));
      const dPr = pronouns(darer);
      const tPr = pronouns(target);
      const texts = [
        `${darer} dared ${target} to stick ${tPr.posAdj} hand in the tar pit. ${target} did it. "It's... warm?" ${darer} respected that.`,
        `"Bet you won't lick the tar." ${darer} grinned at ${target}. ${target} considered it for way too long.`,
        `${darer} cannonballed into the tar pit between rounds. Just because. ${target} was both horrified and impressed.`,
      ];
      addBond(darer, target, 0.3);
      popDelta(darer, 1);
      return { text: pick(texts), players: [darer, target], badgeText: 'TAR DARE', badgeClass: 'amber' };
    },
  },
  {
    id: 'boneInspection',
    check(ep, all) { return true; },
    apply(ep, all) {
      const fireWinner = ep.millionBucksBC?.fireWinner;
      if (!fireWinner) return null;
      const loserTribes = ep.millionBucksBC.fireMaking.tribes.filter(ft => ft.tribe !== fireWinner);
      if (!loserTribes.length) return null;
      const loserMember = pick(loserTribes.flatMap(ft => ft.members));
      const winnerMember = pick(ep.millionBucksBC.fireMaking.tribes.find(ft => ft.tribe === fireWinner)?.members || []);
      if (!loserMember || !winnerMember) return null;
      addBond(loserMember, winnerMember, -0.2);
      const texts = [
        `${loserMember} picked up one of the small bones and compared it to ${winnerMember}'s massive one. "How is that fair?!" ${winnerMember} shrugged.`,
        `${loserMember} stared at the bigger bones ${winnerMember}'s team got. "Those are basically clubs. We got toothpicks."`,
      ];
      return { text: pick(texts), players: [loserMember, winnerMember], badgeText: 'BONE ENVY', badgeClass: 'amber' };
    },
  },
  {
    id: 'caveWallArt',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const artist = pick(all);
      const subject = pick(all.filter(n => n !== artist));
      addBond(artist, subject, getBond(artist, subject) > 0 ? 0.3 : -0.3);
      const isNice = getBond(artist, subject) >= 0;
      const texts = isNice ? [
        `${artist} drew a flattering cave painting of ${subject} on the set wall. ${subject} was genuinely touched.`,
        `${artist} carved "${artist} + ${subject}" into a fake boulder. Prehistoric friendship goals.`,
      ] : [
        `${artist} drew a very unflattering cave painting of ${subject}. Giant head, tiny body. ${subject} was NOT amused.`,
        `${artist} scratched a stick figure of ${subject} falling into the tar pit. ${subject} saw it. Tension.`,
      ];
      return { text: pick(texts), players: [artist, subject], badgeText: isNice ? 'CAVE ART' : 'CAVE SHADE', badgeClass: isNice ? 'green' : 'red' };
    },
  },
  {
    id: 'hostTaunt',
    check(ep, all) { return all.length >= 1; },
    apply(ep, all) {
      const target = pick(all);
      popDelta(target, -1);
      const h = host();
      const texts = [
        `${h} walked up to ${target} and handed them a tiny bone. "This one's more your speed." The others howled.`,
        `"${target}, you looked like you were trying to start a fire with a wet noodle." ${h} was ruthless.`,
        `${h} showed the replay of ${target}'s worst moment on a monitor. "Let's watch that again. In slow motion."`,
      ];
      return { text: pick(texts), players: [target], badgeText: 'HOST ROAST', badgeClass: 'amber' };
    },
  },
  {
    id: 'nervousBreakdown',
    check(ep, all) { return all.some(n => pStats(n).boldness <= 4); },
    apply(ep, all) {
      const nervous = all.filter(n => pStats(n).boldness <= 4);
      if (!nervous.length) return null;
      const player = pick(nervous);
      const pr = pronouns(player);
      const comforter = all.find(n => n !== player && getBond(n, player) > 0);
      if (comforter) {
        addBond(comforter, player, 0.4);
        const texts = [
          `${player} was shaking before the bone battle. ${comforter} sat next to ${pr.obj}. "You've got this." A small nod.`,
          `"I can't fight on a COLUMN." ${player}'s voice cracked. ${comforter} squeezed ${pr.posAdj} shoulder. "I'll be cheering for you."`,
        ];
        return { text: pick(texts), players: [comforter, player], badgeText: 'PEP TALK', badgeClass: 'green' };
      }
      const texts = [
        `${player} stared at the columns and the tar pit. ${pr.Sub} looked like ${pr.sub} might throw up.`,
        `${player} practiced swinging ${pr.posAdj} bone. It flew out of ${pr.posAdj} hands. Not a great sign.`,
      ];
      return { text: pick(texts), players: [player], badgeText: 'NERVES', badgeClass: 'amber' };
    },
  },
  {
    id: 'rivalryEscalation',
    check(ep, all) {
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -3) return true;
      return false;
    },
    apply(ep, all) {
      const pairs = [];
      for (const a of all) for (const b of all) if (a !== b && getBond(a, b) < -3) pairs.push([a, b]);
      if (!pairs.length) return null;
      const [a, b] = pick(pairs);
      addBond(a, b, -0.5);
      const texts = [
        `${a} and ${b} got in each other's faces during the break. "I'm gonna ENJOY knocking you off that column."`,
        `${a} shoved ${b}'s shoulder walking past. ${b} shoved back. The crew had to step between them.`,
        `"If we're on the same column, you're going in the tar FIRST." ${a}'s eyes were locked on ${b}.`,
      ];
      return { text: pick(texts), players: [a, b], badgeText: 'RIVALRY', badgeClass: 'red' };
    },
  },
  {
    id: 'foodScavenge',
    check(ep, all) { return all.length >= 2; },
    apply(ep, all) {
      const pair = all.slice().sort(() => Math.random() - 0.5).slice(0, 2);
      addBond(pair[0], pair[1], 0.3);
      const texts = [
        `${pair[0]} and ${pair[1]} found prop berries behind the set. "Are these real?" "Only one way to find out." They ate them. They were real.`,
        `${pair[0]} discovered a hidden snack stash in Chef's prop tent. ${pair[1]} stood lookout. Partners in crime.`,
        `${pair[0]} and ${pair[1]} roasted prop marshmallows over the remaining fire. "This is the best thing about the Stone Age."`,
      ];
      return { text: pick(texts), players: [pair[0], pair[1]], badgeText: 'SNACK RUN', badgeClass: 'green' };
    },
  },
];

function _simulatePrehistoricBreak(ep, tribeMembers, result) {
  const campKey = gs.mergeName || gs.tribes[0]?.name || 'merge';
  const allMembers = tribeMembers.flatMap(t => t.members);
  const breakEvents = [];
  const minSize = Math.min(...tribeMembers.map(t => t.members.length));

  // ── BENCH SELECTION ──
  // Tribes with more members than the smallest must bench someone
  const benchDecisions = {};
  for (const t of tribeMembers) {
    const sitOuts = t.members.length - minSize;
    benchDecisions[t.name] = { benched: null, voluntary: false, events: [] };
    if (sitOuts <= 0) continue;

    const members = t.members;
    // Check for voluntary sit-out: someone with low boldness or who wants to avoid fighting
    const volunteers = members.filter(n => {
      const s = pStats(n);
      return s.boldness <= 3 || (s.physical <= 3 && Math.random() < 0.4);
    });
    // Check for weak record players the team might force to bench
    const weakPlayers = members.filter(n => {
      const memberScores = ep.chalMemberScores || {};
      return (memberScores[n] || 0) <= 0;
    });

    let benched, isVoluntary = false;
    if (volunteers.length && Math.random() < 0.5) {
      benched = pick(volunteers);
      isVoluntary = true;
    } else if (weakPlayers.length && Math.random() < 0.4) {
      benched = pick(weakPlayers);
    } else {
      benched = pick(members);
    }
    benchDecisions[t.name].benched = benched;
    benchDecisions[t.name].voluntary = isVoluntary;

    const pr = pronouns(benched);
    if (isVoluntary) {
      // Voluntary — team reacts
      const teammatePr = members.filter(n => n !== benched);
      const reactor = teammatePr.length ? pick(teammatePr) : null;
      const hasGoodRecord = (ep.chalMemberScores?.[benched] || 0) >= 2;
      if (hasGoodRecord && reactor) {
        // Good player volunteers to sit — team resents losing their strength
        addBond(reactor, benched, -0.3);
        const texts = [
          `${benched} volunteered to sit out the bone battle. ${reactor} pulled ${pr.obj} aside: "We NEED you up there. You're one of our best."`,
          `"I'll sit this one out," ${benched} said. ${reactor} stared in disbelief. "Are you serious right now?"`,
        ];
        const evt = { text: pick(texts), players: [benched, reactor], badgeText: 'BENCH — FRUSTRATED', badgeClass: 'red' };
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
        breakEvents.push({ id: 'benchVoluntaryResent', ...evt });
      } else {
        // Weak/timid player volunteers — team is fine with it
        const texts = [
          `${benched} raised ${pr.posAdj} hand. "I'll sit this one out. Heights aren't my thing." Nobody argued.`,
          `"You guys fight. I'll cheer from down here." ${benched} was more than happy to skip the columns.`,
        ];
        const evt = { text: pick(texts), players: [benched], badgeText: 'BENCH — VOLUNTARY', badgeClass: 'amber' };
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
        breakEvents.push({ id: 'benchVoluntary', ...evt });
      }
    } else {
      // Forced bench — team tells someone to sit
      const decider = members.filter(n => n !== benched).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
      const wantedToFight = pStats(benched).boldness >= 5;
      if (wantedToFight) {
        // Player wanted to fight but got benched — resentment
        addBond(benched, decider, -0.4);
        const texts = [
          `${decider} told ${benched} to sit out. ${benched}'s face darkened. "You're benching ME?"`,
          `"We think it's better if you sit this one," ${decider} said carefully. ${benched} wasn't having it. "This isn't over."`,
          `${benched} was told to stay on the ground. ${pr.Sub} threw ${pr.posAdj} bone down in frustration. "FINE."`,
        ];
        const evt = { text: pick(texts), players: [benched, decider], badgeText: 'BENCH — ANGRY', badgeClass: 'red' };
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
        breakEvents.push({ id: 'benchForced', ...evt });
      } else {
        // Player is relieved to not fight
        const texts = [
          `${decider} assigned ${benched} to the bench. ${benched} tried to look disappointed. Failed. "Oh no. Guess I'll just... watch."`,
          `${benched} was told to sit out. ${pr.Sub} shrugged. "Someone's gotta cheer." Secret relief.`,
        ];
        const evt = { text: pick(texts), players: [benched, decider], badgeText: 'BENCH — RELIEVED', badgeClass: 'green' };
        ep.campEvents[campKey].post.push({ ...evt, tag: 'drama' });
        breakEvents.push({ id: 'benchRelieved', ...evt });
      }
    }
  }
  result.benchDecisions = benchDecisions;

  // ── REGULAR DRAMA EVENTS ──
  const eligible = BC_DRAMA_EVENTS.filter(ev => ev.check(ep, allMembers));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const target = 5 + Math.floor(Math.random() * 2); // 5-6 (bench events already added)

  for (const ev of shuffled) {
    if (breakEvents.length >= target + Object.values(benchDecisions).filter(d => d.benched).length) break;
    const applied = ev.apply(ep, allMembers);
    if (applied) {
      ep.campEvents[campKey].post.push({ ...applied, tag: 'drama' });
      breakEvents.push({ id: ev.id, ...applied });
    }
  }

  result.breakEvents = breakEvents;
}

// ══════════════════════════════════════════════════════════════
// PHASE 2: BONE BATTLE
// ══════════════════════════════════════════════════════════════
function _simulateBoneBattle(ep, tribeMembers, result) {
  const fireWinner = result.fireWinner;
  const minSize = Math.min(...tribeMembers.map(t => t.members.length));
  const roundCount = minSize;

  // Use bench decisions from the prehistoric break
  const tribeBenched = {};
  for (const t of tribeMembers) {
    const decision = result.benchDecisions?.[t.name];
    const benched = decision?.benched ? [decision.benched] : [];
    tribeBenched[t.name] = [];
    for (let rd = 0; rd < roundCount; rd++) tribeBenched[t.name].push(benched);
  }

  // Build matchups — prioritize drama
  const rounds = [];
  const battleScores = {};
  tribeMembers.forEach(t => { battleScores[t.name] = 0; });
  const usedFighters = {};
  tribeMembers.forEach(t => { usedFighters[t.name] = new Set(); });

  for (let rd = 0; rd < roundCount; rd++) {
    const available = {};
    for (const t of tribeMembers) {
      const benched = tribeBenched[t.name][rd];
      available[t.name] = t.members.filter(n => !benched.includes(n) && !usedFighters[t.name].has(n));
    }

    // Pick fighters — drama-first matching
    const fighters = [];
    // First tribe picks based on drama potential
    const firstTribe = tribeMembers[0];
    let firstPick = _pickDramaticFighter(available[firstTribe.name], tribeMembers.slice(1).flatMap(t => available[t.name]));
    fighters.push({ tribe: firstTribe.name, fighter: firstPick });
    usedFighters[firstTribe.name].add(firstPick);

    for (let ti = 1; ti < tribeMembers.length; ti++) {
      const t = tribeMembers[ti];
      let pick_f = _pickDramaticOpponent(available[t.name], firstPick, fighters.map(f => f.fighter));
      fighters.push({ tribe: t.name, fighter: pick_f });
      usedFighters[t.name].add(pick_f);
    }

    // Simulate the fight
    const roundResult = _simulateRound(ep, fighters, fireWinner, rd + 1);
    rounds.push(roundResult);

    // Tribe score: round winner gets 1 point for the tribe
    battleScores[roundResult.rankings[0].tribe] += 1;
    // Individual: winner gets +3 (last standing bonus on top of knockoff/dodge points already earned)
    ep.chalMemberScores[roundResult.rankings[0].fighter] = (ep.chalMemberScores[roundResult.rankings[0].fighter] || 0) + 3;
  }

  result.boneBattle.rounds = rounds;
  result.boneBattle.battleScores = battleScores;
  result.boneBattle.benched = tribeBenched;

  // Tiebreaker check
  const sortedScores = Object.entries(battleScores).sort((a, b) => b[1] - a[1]);
  const topScore = sortedScores[0][1];
  const tied = sortedScores.filter(([_, s]) => s === topScore);
  if (tied.length >= 2) {
    const tiedTribes = tied.map(([name]) => name);
    const champions = [];
    for (const tribeName of tiedTribes) {
      const t = tribeMembers.find(tm => tm.name === tribeName);
      const champ = t.members.sort((a, b) =>
        (pStats(b).physical + pStats(b).boldness) - (pStats(a).physical + pStats(a).boldness)
      )[0];
      champions.push({ tribe: tribeName, fighter: champ });
    }

    const tbResult = _simulateRound(ep, champions, fireWinner, 'TB', true);
    result.boneBattle.tiebreaker = tbResult;

    // Adjust scores with tiebreaker
    for (let i = 0; i < tbResult.rankings.length; i++) {
      const pts = i === 0 ? 3 : 0;
      battleScores[tbResult.rankings[i].tribe] += pts;
      ep.chalMemberScores[tbResult.rankings[i].fighter] = (ep.chalMemberScores[tbResult.rankings[i].fighter] || 0) + pts;
    }
  }
}

function _pickDramaticFighter(available, opponents) {
  if (!available.length) return null;
  // Prefer someone with a rival among opponents
  for (const name of available) {
    for (const opp of opponents) {
      if (getBond(name, opp) < -2) return name;
    }
  }
  // Prefer showmance partner among opponents
  for (const name of available) {
    for (const opp of opponents) {
      const sm = gs.showmances?.find(s =>
        (s.a === name && s.b === opp) || (s.a === opp && s.b === name));
      if (sm) return name;
    }
  }
  return pick(available);
}

function _pickDramaticOpponent(available, mainFighter, alreadyPicked) {
  if (!available.length) return null;
  // Rival of main fighter
  for (const name of available) {
    if (getBond(name, mainFighter) < -2) return name;
  }
  // Showmance
  for (const name of available) {
    const sm = gs.showmances?.find(s =>
      (s.a === name && s.b === mainFighter) || (s.a === mainFighter && s.b === name));
    if (sm) return name;
  }
  // Archetype clash (hero vs villain)
  const mainArch = getArchetype(mainFighter);
  if (VILLAIN_ARCHETYPES.includes(mainArch)) {
    const hero = available.find(n => ['hero', 'loyal-soldier', 'underdog'].includes(getArchetype(n)));
    if (hero) return hero;
  }
  if (['hero', 'loyal-soldier', 'underdog'].includes(mainArch)) {
    const villain = available.find(n => VILLAIN_ARCHETYPES.includes(getArchetype(n)));
    if (villain) return villain;
  }
  return pick(available);
}

function _simulateRound(ep, fighters, fireWinner, roundNum, isTiebreaker = false) {
  const events = [];
  const scores = {};
  fighters.forEach(f => { scores[f.fighter] = 0; });

  // Matchup reactions
  for (const f of fighters) {
    const pr = pronouns(f.fighter);
    const s = pStats(f.fighter);
    const rivals = fighters.filter(o => o.fighter !== f.fighter && getBond(f.fighter, o.fighter) < -2);
    let reaction;
    if (rivals.length) {
      reaction = { type: 'rivalry', text: pick(BATTLE_EVENTS.matchupReaction.rivalry)(f.fighter, rivals[0].fighter) };
    } else if (s.boldness >= 7) {
      reaction = { type: 'cocky', text: pick(BATTLE_EVENTS.matchupReaction.cocky)(f.fighter, pr) };
    } else if (s.boldness <= 3) {
      reaction = { type: 'nervous', text: pick(BATTLE_EVENTS.matchupReaction.nervous)(f.fighter, pr) };
    } else {
      reaction = { type: 'eager', text: pick(BATTLE_EVENTS.matchupReaction.eager)(f.fighter, pr) };
    }
    events.push({ phase: 'reaction', player: f.fighter, tribe: f.tribe, icon: reaction.type === 'rivalry' ? '😡' : reaction.type === 'cocky' ? '😎' : reaction.type === 'nervous' ? '😰' : '💪', ...reaction });
  }

  // Mount columns
  for (const f of fighters) {
    const pr = pronouns(f.fighter);
    events.push({ phase: 'mount', player: f.fighter, tribe: f.tribe, icon: '🏛️',
      text: pick(BATTLE_EVENTS.mountColumn)(f.fighter, pr) });
  }

  // Base fight score
  for (const f of fighters) {
    const s = pStats(f.fighter);
    const bigBone = f.tribe === fireWinner ? 0.06 : 0;
    scores[f.fighter] = s.physical * 0.03 + s.boldness * 0.03 + s.endurance * 0.02 + bigBone + noise(0.35);
  }

  // Opening exchange
  for (const f of fighters) {
    const pr = pronouns(f.fighter);
    events.push({ phase: 'opening', player: f.fighter, tribe: f.tribe, icon: '🦴',
      text: pick(BATTLE_EVENTS.openSwing)(f.fighter, pr) });
  }

  // Mid-fight events (skip in tiebreaker — pure skill)
  if (!isTiebreaker) {
    // Random event targets one fighter (~40% chance)
    if (Math.random() < 0.4) {
      const target = pick(fighters);
      const s = pStats(target.fighter);
      const pr = pronouns(target.fighter);
      const eventTypes = ['beaverAttack', 'hornBlast', 'wildlifeSnatch', 'columnCrack'];
      const eventType = pick(eventTypes);

      events.push({ phase: 'midEvent', player: target.fighter, tribe: target.tribe, icon: eventType === 'beaverAttack' ? '🦫' : eventType === 'hornBlast' ? '📯' : eventType === 'wildlifeSnatch' ? '🦅' : '💥',
        text: pick(BATTLE_EVENTS[eventType])(target.fighter, pr) });

      // Dodge check
      const dodgeCheck = s.intuition * 0.04 + s.mental * 0.03 + noise(0.3);
      if (dodgeCheck > 0.25) {
        events.push({ phase: 'midResolve', player: target.fighter, tribe: target.tribe, icon: '✅',
          text: `${target.fighter} recovered! Held on tight!` });
        ep.chalMemberScores[target.fighter] = (ep.chalMemberScores[target.fighter] || 0) + 1;
      } else {
        scores[target.fighter] -= 0.15;
        events.push({ phase: 'midResolve', player: target.fighter, tribe: target.tribe, icon: '❌',
          text: `${target.fighter} couldn't recover — wobbling badly!` });
      }
    }

    // Trash talk (~30% chance)
    if (Math.random() < 0.3) {
      const talker = pick(fighters);
      const target = pick(fighters.filter(f => f.fighter !== talker.fighter));
      if (target) {
        const s = pStats(talker.fighter);
        const trashCheck = s.social * 0.04 + (10 - s.temperament) * 0.03 + noise(0.25);
        if (trashCheck > 0.22) {
          events.push({ phase: 'trashTalk', player: talker.fighter, tribe: talker.tribe, icon: '🗯️',
            text: pick(BATTLE_EVENTS.trashTalkSuccess)(talker.fighter, target.fighter) });
          scores[target.fighter] -= 0.08;
          ep.chalMemberScores[talker.fighter] = (ep.chalMemberScores[talker.fighter] || 0) + 1;
        } else {
          events.push({ phase: 'trashTalk', player: talker.fighter, tribe: talker.tribe, icon: '🗯️',
            text: pick(BATTLE_EVENTS.trashTalkFail)(talker.fighter, target.fighter) });
          scores[talker.fighter] -= 0.06;
        }
      }
    }

    // Showboat (boldness ≥ 7, ~20%)
    const showboater = fighters.find(f => pStats(f.fighter).boldness >= 7 && Math.random() < 0.2);
    if (showboater) {
      const s = pStats(showboater.fighter);
      const pr = pronouns(showboater.fighter);
      const showCheck = s.boldness * 0.03 - s.intuition * 0.02 + noise(0.2);
      if (showCheck > 0.15) {
        events.push({ phase: 'showboat', player: showboater.fighter, tribe: showboater.tribe, icon: '💪',
          text: pick(BATTLE_EVENTS.showboatSuccess)(showboater.fighter, pr) });
        scores[showboater.fighter] += 0.05;
        popDelta(showboater.fighter, 1);
        ep.chalMemberScores[showboater.fighter] = (ep.chalMemberScores[showboater.fighter] || 0) + 1;
      } else {
        events.push({ phase: 'showboat', player: showboater.fighter, tribe: showboater.tribe, icon: '😬',
          text: pick(BATTLE_EVENTS.showboatFail)(showboater.fighter, pr) });
        scores[showboater.fighter] -= 0.12;
      }
    }

    // Grip/endurance check (round 3+, ~35%)
    if (typeof roundNum === 'number' && roundNum >= 3 && Math.random() < 0.35) {
      const target = pick(fighters);
      const s = pStats(target.fighter);
      const pr = pronouns(target.fighter);
      const gripCheck = s.endurance * 0.04 + s.loyalty * 0.02 + noise(0.25);
      if (gripCheck > 0.24) {
        events.push({ phase: 'grip', player: target.fighter, tribe: target.tribe, icon: '💎',
          text: pick(BATTLE_EVENTS.gripHold)(target.fighter, pr) });
        ep.chalMemberScores[target.fighter] = (ep.chalMemberScores[target.fighter] || 0) + 1;
      } else {
        scores[target.fighter] -= 0.10;
        events.push({ phase: 'grip', player: target.fighter, tribe: target.tribe, icon: '😰',
          text: pick(BATTLE_EVENTS.gripSlip)(target.fighter, pr) });
      }
    }

    // Startled check (~25%)
    if (Math.random() < 0.25) {
      const target = pick(fighters);
      const s = pStats(target.fighter);
      const pr = pronouns(target.fighter);
      const startleCheck = s.mental * 0.03 + s.endurance * 0.02 + noise(0.25);
      if (startleCheck <= 0.20) {
        scores[target.fighter] -= 0.10;
        events.push({ phase: 'startled', player: target.fighter, tribe: target.tribe, icon: '😱',
          text: `${target.fighter} got startled by a noise and almost fell!` });
      }
    }
  }

  // Resolve — rank by score, generate climax events
  const ranked = fighters.map(f => ({ ...f, score: scores[f.fighter] }))
    .sort((a, b) => b.score - a.score);

  // Fight climax — staged falls with exchanges between them
  const winner = ranked[0];
  const pr_w = pronouns(winner.fighter);

  if (ranked.length > 2) {
    // 3+ fighters: first to fall, then a second exchange, then second to fall
    const firstOut = ranked[ranked.length - 1];
    const pr_first = pronouns(firstOut.fighter);
    const knocker1 = ranked[Math.floor(Math.random() * (ranked.length - 1))];
    if (Math.random() < 0.6) {
      events.push({ phase: 'fall', player: firstOut.fighter, tribe: firstOut.tribe, icon: '💥',
        text: pick(BATTLE_EVENTS.knockOff)(knocker1.fighter, firstOut.fighter) });
      ep.chalMemberScores[knocker1.fighter] = (ep.chalMemberScores[knocker1.fighter] || 0) + 1;
    } else {
      events.push({ phase: 'fall', player: firstOut.fighter, tribe: firstOut.tribe, icon: '💥',
        text: pick(BATTLE_EVENTS.selfFall)(firstOut.fighter, pr_first) });
    }
    events.push({ phase: 'tar', player: firstOut.fighter, tribe: firstOut.tribe, icon: '🪨',
      text: pick(BATTLE_EVENTS.tarSplash)(firstOut.fighter, pr_first) });

    // Second exchange — the remaining two go at it
    const remaining = ranked.filter(r => r.fighter !== firstOut.fighter);
    const r0 = remaining[0], r1 = remaining[1];
    const pr_r0 = pronouns(r0.fighter), pr_r1 = pronouns(r1.fighter);

    events.push({ phase: 'opening', player: r0.fighter, tribe: r0.tribe, icon: '🦴',
      text: pick(BATTLE_EVENTS.openSwing)(r0.fighter, pr_r0) });
    events.push({ phase: 'opening', player: r1.fighter, tribe: r1.tribe, icon: '🦴',
      text: pick(BATTLE_EVENTS.openSwing)(r1.fighter, pr_r1) });

    // One more exchange event — trash talk, dodge, or raw swing
    if (Math.random() < 0.4) {
      const talker = pick([r0, r1]);
      const tgt = talker === r0 ? r1 : r0;
      events.push({ phase: 'trashTalk', player: talker.fighter, tribe: talker.tribe, icon: '🗯️',
        text: pick(BATTLE_EVENTS.trashTalkSuccess)(talker.fighter, tgt.fighter) });
    }

    // Final fall
    const secondOut = r1; // r0 is winner, r1 is second to fall
    const pr_second = pronouns(secondOut.fighter);
    events.push({ phase: 'fall', player: secondOut.fighter, tribe: secondOut.tribe, icon: '💥',
      text: pick(BATTLE_EVENTS.knockOff)(winner.fighter, secondOut.fighter) });
    ep.chalMemberScores[winner.fighter] = (ep.chalMemberScores[winner.fighter] || 0) + 1;
    events.push({ phase: 'tar', player: secondOut.fighter, tribe: secondOut.tribe, icon: '🪨',
      text: pick(BATTLE_EVENTS.tarSplash)(secondOut.fighter, pr_second) });
  } else {
    // 1v1 (tiebreaker) — just one fall
    const loser = ranked[1];
    const pr_l = pronouns(loser.fighter);
    events.push({ phase: 'fall', player: loser.fighter, tribe: loser.tribe, icon: '💥',
      text: pick(BATTLE_EVENTS.knockOff)(winner.fighter, loser.fighter) });
    ep.chalMemberScores[winner.fighter] = (ep.chalMemberScores[winner.fighter] || 0) + 1;
    events.push({ phase: 'tar', player: loser.fighter, tribe: loser.tribe, icon: '🪨',
      text: pick(BATTLE_EVENTS.tarSplash)(loser.fighter, pr_l) });
  }

  // Winner celebration
  events.push({ phase: 'climax', player: winner.fighter, tribe: winner.tribe, icon: '👑',
    text: pick(BATTLE_EVENTS.lastStanding)(winner.fighter, pr_w) });

  // Drama break between rounds
  if (!isTiebreaker) {
    // Host commentary
    events.push({ phase: 'drama', icon: '📢',
      text: pick(BATTLE_EVENTS.hostBetweenRounds)(host()) });

    // Confessional from the loser or winner
    const confPlayer = Math.random() < 0.5 ? ranked[ranked.length - 1] : ranked[0];
    const confPr = pronouns(confPlayer.fighter);
    events.push({ phase: 'drama', player: confPlayer.fighter, tribe: confPlayer.tribe, icon: '🎬',
      text: pick(BATTLE_EVENTS.confessional)(confPlayer.fighter, confPr) });

    // Crowd reaction (~50%)
    if (Math.random() < 0.5) {
      const cheerTribe = pick(fighters);
      events.push({ phase: 'drama', tribe: cheerTribe.tribe, icon: '📣',
        text: pick(BATTLE_EVENTS.crowdReaction)(cheerTribe.tribe) });
    }

    // Showmance moment — if a showmance partner is watching
    for (const f of fighters) {
      const sm = gs.showmances?.find(s => s.a === f.fighter || s.b === f.fighter);
      if (sm && Math.random() < 0.4) {
        const partner = sm.a === f.fighter ? sm.b : sm.a;
        const isActive = fighters.some(fi => fi.fighter === partner);
        if (!isActive) {
          events.push({ phase: 'drama', player: partner, icon: '❤️',
            text: pick(BATTLE_EVENTS.showmanceWatch)(partner, f.fighter) });
          break;
        }
      }
    }

    // Scheme whisper before next round (~25%)
    if (Math.random() < 0.25) {
      const allPlayers = fighters.flatMap(f => {
        const t = gs.tribes?.find(tr => tr.name === f.tribe);
        return t ? t.members.filter(m => m !== f.fighter) : [];
      });
      if (allPlayers.length) {
        const adviser = pick(allPlayers);
        const nextFighter = pick(fighters);
        events.push({ phase: 'drama', player: adviser, icon: '🤫',
          text: pick(BATTLE_EVENTS.schemeWhisper)(adviser, nextFighter.fighter) });
      }
    }
  }

  return {
    round: roundNum,
    fighters,
    events,
    rankings: ranked,
    isTiebreaker,
  };
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textMillionBucksBC(ep, ln, sec) {
  const bc = ep.millionBucksBC;
  if (!bc) return;
  ln('');
  ln('═══ ONE MILLION BUCKS, B.C. ═══');
  ln('');

  ln('── PHASE 1: FIRE MAKING ──');
  for (const ft of bc.fireMaking.tribes) {
    ln(`${ft.tribe}: Fire Score ${ft.fireScore.toFixed(1)}`);
    for (const e of ft.events) ln(`  ${e.icon} ${e.text}`);
  }
  ln(`Fire Winner: ${bc.fireWinner} (gets bigger bones)`);
  ln('');

  ln('── PHASE 2: BONE BATTLE ──');
  for (const rd of bc.boneBattle.rounds) {
    ln(`  Round ${rd.round}: ${rd.fighters.map(f => `${f.fighter} (${f.tribe})`).join(' vs ')}`);
    for (const e of rd.events) ln(`    ${e.icon} ${e.text}`);
    ln(`    Winner: ${rd.rankings[0].fighter} (${rd.rankings[0].tribe})`);
  }
  if (bc.boneBattle.tiebreaker) {
    ln(`  TIEBREAKER: ${bc.boneBattle.tiebreaker.fighters.map(f => `${f.fighter} (${f.tribe})`).join(' vs ')}`);
    for (const e of bc.boneBattle.tiebreaker.events) ln(`    ${e.icon} ${e.text}`);
    ln(`    Winner: ${bc.boneBattle.tiebreaker.rankings[0].fighter}`);
  }
  ln('');

  ln(`Winner: ${bc.winner}`);
  ln(`Loser: ${bc.loser}`);
}

// ══════════════════════════════════════════════════════════════
// VP STYLES
// ══════════════════════════════════════════════════════════════
function _bcPortrait(name, size = 32) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:2px solid var(--cave-amber);object-fit:cover;flex-shrink:0;box-shadow:0 0 6px rgba(217,119,6,0.2)" onerror="this.style.display='none'">`;
}
function _bcSidePortrait(name, size = 20) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;border:1px solid var(--cave-amber);object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`;
}
function _bcBadge(text, cls) {
  return `<div class="bc-ev-badge ${cls}" style="font-size:10px;padding:3px 10px">${text}</div>`;
}

function _bcShell(content, ep) {
  return `
<link href="https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Share+Tech+Mono&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
.bc-shell{
  --cave-amber:#d97706;--cave-brown:#78350f;--tar-black:#1c1917;
  --bone-white:#fef3c7;--fire-orange:#ea580c;--cave-dark:#292524;
  --cave-green:#22c55e;--cave-red:#ef4444;
  font-family:'Inter',sans-serif;color:#e8e4dc;
  background:linear-gradient(180deg,#1c1410 0%,#292524 30%,#3d2e1f 60%,#292524 85%,#1c1410 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:2px solid rgba(217,119,6,0.15);box-shadow:inset 0 0 60px rgba(0,0,0,0.5),0 0 20px rgba(217,119,6,0.05);
}

/* Cave texture overlay */
.bc-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M30 80 Q50 60 70 80 Q90 100 110 80' stroke='%2378350f' stroke-width='1.5' fill='none' opacity='0.08'/%3E%3Ccircle cx='150' cy='50' r='8' stroke='%2378350f' stroke-width='1' fill='none' opacity='0.06'/%3E%3Cpath d='M140 140 L160 120 L170 140 L150 160Z' stroke='%2378350f' stroke-width='1' fill='none' opacity='0.05'/%3E%3Cpath d='M20 160 Q30 140 50 150 Q60 155 70 145' stroke='%2378350f' stroke-width='1' fill='none' opacity='0.06'/%3E%3C/svg%3E");
  pointer-events:none;z-index:0}

/* Stone grain scanline */
.bc-shell::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(120,53,15,0.02) 3px,rgba(120,53,15,0.02) 4px);
  pointer-events:none;z-index:1}

/* Layout */
.bc-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
.bc-feed{flex:1;padding:14px 18px;min-width:0}
.bc-sidebar{width:260px;flex-shrink:0;padding:12px 14px;background:rgba(0,0,0,0.3);
  border-left:1px solid rgba(217,119,6,0.08);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

/* HUD */
.bc-hud{display:flex;justify-content:center;gap:0;padding:12px 0;position:relative;z-index:5;
  border-bottom:1px solid rgba(217,119,6,0.08);background:rgba(0,0,0,0.2)}
.bc-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:1px solid rgba(217,119,6,0.06)}
.bc-hud-cell:last-child{border-right:none}
.bc-hud-val{font-family:'Share Tech Mono',monospace;font-size:20px;font-weight:700}
.bc-hud-lbl{font-size:9px;letter-spacing:2px;color:rgba(217,119,6,0.4);text-transform:uppercase;margin-top:2px;font-family:'Share Tech Mono',monospace}

/* Event cards */
.bc-ev{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;margin-bottom:6px;
  background:rgba(0,0,0,0.2);border-radius:4px;border-left:3px solid rgba(217,119,6,0.15);
  position:relative;font-size:12px;line-height:1.5}
.bc-ev-badge{display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;
  letter-spacing:2px;text-transform:uppercase;border-radius:2px;margin-bottom:4px}
.bc-ev-badge.amber{border:1px solid var(--cave-amber);color:var(--cave-amber);background:rgba(217,119,6,0.06)}
.bc-ev-badge.fire{border:1px solid var(--fire-orange);color:var(--fire-orange);background:rgba(234,88,12,0.06)}
.bc-ev-badge.bone{border:1px solid var(--bone-white);color:var(--bone-white);background:rgba(254,243,199,0.06)}
.bc-ev-badge.tar{border:1px solid #57534e;color:#a8a29e;background:rgba(87,83,78,0.06)}
.bc-ev-badge.green{border:1px solid var(--cave-green);color:var(--cave-green);background:rgba(34,197,94,0.06)}
.bc-ev-badge.red{border:1px solid var(--cave-red);color:var(--cave-red);background:rgba(239,68,68,0.06)}

/* Controls */
.bc-controls{display:flex;gap:10px;justify-content:center;padding:16px 0;position:relative;z-index:5}
.bc-btn-next{padding:10px 24px;font-family:'Bungee Shade',sans-serif;font-size:13px;letter-spacing:2px;
  background:rgba(217,119,6,0.1);color:var(--cave-amber);border:2px solid var(--cave-amber);
  border-radius:4px;cursor:pointer;text-transform:uppercase;transition:all 0.2s}
.bc-btn-next:hover{background:rgba(217,119,6,0.2);box-shadow:0 0 15px rgba(217,119,6,0.2)}
.bc-btn-all{padding:10px 18px;font-size:11px;background:none;color:rgba(255,255,255,0.3);
  border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-family:'Share Tech Mono',monospace}

/* Sidebar */
.bc-side-sec{font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
  color:var(--cave-amber);text-transform:uppercase;padding:6px 0 4px;
  border-bottom:1px solid rgba(217,119,6,0.1);margin-top:8px}
.bc-side-sec:first-child{margin-top:0}

/* ══ FIRE — CSS gradient embers + warm glow ══ */
.bc-fire-phase{position:relative;overflow:hidden}
.bc-fire-phase::before{content:'';position:absolute;bottom:0;left:15%;width:12px;height:12px;
  border-radius:50%;background:radial-gradient(circle,rgba(251,191,36,0.6),rgba(234,88,12,0.3),transparent);
  pointer-events:none;z-index:1;box-shadow:0 0 8px 3px rgba(234,88,12,0.15);
  animation:bc-ember-rise 2.5s ease-out infinite}
.bc-fire-phase::after{content:'';position:absolute;bottom:0;left:0;right:0;height:40px;
  background:linear-gradient(0deg,rgba(234,88,12,0.12) 0%,rgba(234,88,12,0.04) 40%,transparent 100%);
  pointer-events:none;z-index:1;animation:bc-fire-glow 2s ease-in-out infinite}
@keyframes bc-ember-rise{0%{transform:translateY(0) scale(1);opacity:0.5}
  50%{opacity:0.7}100%{transform:translateY(-90px) scale(0.3);opacity:0}}
@keyframes bc-fire-glow{0%,100%{opacity:0.6;height:30px}50%{opacity:1;height:50px}}

/* Bonfire — pulsing warm glow with sparks */
.bc-bonfire{position:relative}
.bc-bonfire::before{content:'';position:absolute;top:0;left:50%;width:6px;height:6px;
  transform:translateX(-20px);border-radius:50%;
  background:radial-gradient(circle,rgba(251,191,36,0.8),transparent);
  box-shadow:0 0 6px 2px rgba(251,191,36,0.3);
  pointer-events:none;animation:bc-spark-fly 1.5s ease-out infinite}
.bc-bonfire::after{content:'';position:absolute;top:0;right:40%;width:4px;height:4px;
  border-radius:50%;background:radial-gradient(circle,rgba(234,88,12,0.7),transparent);
  box-shadow:0 0 4px 1px rgba(234,88,12,0.2);
  pointer-events:none;animation:bc-spark-fly 2s ease-out infinite;animation-delay:-0.7s}
@keyframes bc-spark-fly{0%{transform:translateY(0);opacity:0.7}100%{transform:translateY(-35px) translateX(12px);opacity:0}}

/* Medium fire — gentle flicker */
.bc-med-fire{animation:bc-flicker 2s ease-in-out infinite}
@keyframes bc-flicker{0%,100%{opacity:1}50%{opacity:0.85}}

/* Fire score bar — animated flame fill */
.bc-fire-bar{height:10px;background:rgba(0,0,0,0.3);border-radius:5px;overflow:hidden;position:relative}
.bc-fire-bar-fill{height:100%;border-radius:5px;position:relative;
  background:linear-gradient(90deg,#b45309,#ea580c,#f59e0b,#ea580c);
  background-size:200% 100%;animation:bc-flame-fill 2s ease-in-out infinite}
@keyframes bc-flame-fill{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}

/* ══ VS SPLASH — Street Fighter energy ══ */
.bc-vs-splash{text-align:center;padding:24px 12px;position:relative;
  background:radial-gradient(ellipse at center,rgba(234,88,12,0.12) 0%,transparent 60%);
  animation:bc-vs-container-shake 0.3s ease-out}
@keyframes bc-vs-container-shake{
  0%{transform:translateX(0)}20%{transform:translateX(-4px)}
  40%{transform:translateX(4px)}60%{transform:translateX(-2px)}
  80%{transform:translateX(2px)}100%{transform:translateX(0)}}

.bc-vs-text{font-family:'Bungee Shade',sans-serif;font-size:48px;color:var(--fire-orange);
  text-shadow:0 0 40px rgba(234,88,12,0.6),0 0 80px rgba(234,88,12,0.3),5px 5px 0 rgba(0,0,0,0.8);
  position:relative;display:inline-block;
  animation:bc-vs-slam 0.6s cubic-bezier(0.22,1,0.36,1)}
/* Stone crack — radial shatter lines */
.bc-vs-text::before{content:'';position:absolute;top:50%;left:50%;width:250%;height:250%;
  transform:translate(-50%,-50%);pointer-events:none;
  background:
    linear-gradient(25deg,transparent 48%,rgba(217,119,6,0.15) 49%,rgba(217,119,6,0.15) 50%,transparent 51%),
    linear-gradient(155deg,transparent 48%,rgba(217,119,6,0.12) 49%,rgba(217,119,6,0.12) 50%,transparent 51%),
    linear-gradient(80deg,transparent 48%,rgba(217,119,6,0.1) 49%,rgba(217,119,6,0.1) 50%,transparent 51%),
    linear-gradient(210deg,transparent 48%,rgba(217,119,6,0.08) 49%,rgba(217,119,6,0.08) 50%,transparent 51%),
    linear-gradient(310deg,transparent 48%,rgba(217,119,6,0.1) 49%,rgba(217,119,6,0.1) 50%,transparent 51%);
  animation:bc-crack-appear 0.8s ease-out forwards}
/* Impact shockwave */
.bc-vs-text::after{content:'';position:absolute;top:50%;left:50%;width:80%;height:80%;
  transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
  border:2px solid rgba(234,88,12,0.3);
  animation:bc-vs-pulse 0.8s ease-out forwards}
@keyframes bc-vs-slam{0%{transform:scale(3) rotate(-8deg);opacity:0;filter:blur(4px)}
  30%{transform:scale(1.2) rotate(4deg);opacity:1;filter:blur(0)}
  50%{transform:scale(0.9) rotate(-2deg)}
  70%{transform:scale(1.05) rotate(1deg)}
  100%{transform:scale(1) rotate(0)}}
@keyframes bc-crack-appear{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}
  100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes bc-vs-pulse{0%{opacity:0.5;transform:translate(-50%,-50%) scale(0.5)}
  100%{opacity:0;transform:translate(-50%,-50%) scale(3)}}

.bc-vs-fighter{display:inline-flex;flex-direction:column;align-items:center;gap:6px;padding:12px 22px;
  background:rgba(0,0,0,0.3);border:2px solid rgba(217,119,6,0.15);border-radius:8px;
  box-shadow:0 4px 20px rgba(0,0,0,0.4),inset 0 1px 0 rgba(254,243,199,0.05);
  animation:bc-fighter-enter 0.5s ease-out backwards}
.bc-vs-fighter:nth-child(1){animation-delay:0.1s}
.bc-vs-fighter:nth-child(3){animation-delay:0.2s}
.bc-vs-fighter:nth-child(5){animation-delay:0.3s}
@keyframes bc-fighter-enter{0%{transform:translateY(20px) scale(0.8);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
.bc-vs-name{font-family:'Share Tech Mono',monospace;font-size:14px;letter-spacing:2px;color:var(--bone-white)}

/* ══ TAR PIT — visceral splat ══ */
.bc-tar-pit{position:relative;overflow:hidden;
  background:linear-gradient(180deg,rgba(28,25,23,0.3),rgba(28,25,23,0.9),rgba(41,37,36,0.95));
  border-radius:6px;padding:10px 12px;margin:2px 0;
  border:1px solid rgba(87,83,78,0.15)}
/* CSS bubble dots */
.bc-tar-pit::before{content:'';position:absolute;bottom:6px;left:20%;width:6px;height:6px;
  border-radius:50%;background:rgba(120,113,108,0.2);
  box-shadow:20px 2px 0 rgba(120,113,108,0.12),45px -3px 0 rgba(120,113,108,0.08);
  animation:bc-bubble 2s ease-in-out infinite}
.bc-tar-pit::after{content:'';position:absolute;bottom:4px;right:25%;width:4px;height:4px;
  border-radius:50%;background:rgba(120,113,108,0.15);
  box-shadow:15px 1px 0 rgba(120,113,108,0.1);
  animation:bc-bubble 3s ease-in-out infinite;animation-delay:-1.2s}
@keyframes bc-bubble{0%,100%{transform:translateY(0) scale(1);opacity:0.15}
  50%{transform:translateY(-16px) scale(1.5);opacity:0.3}}

/* Tar splat — dark ripple on impact */
.bc-tar-splat{position:relative;overflow:hidden}
.bc-tar-splat::before{content:'';position:absolute;top:50%;left:50%;width:0;height:0;
  border-radius:50%;border:3px solid rgba(87,83,78,0.25);
  transform:translate(-50%,-50%);animation:bc-splat-ring 0.8s ease-out forwards;pointer-events:none}
@keyframes bc-splat-ring{0%{width:0;height:0;opacity:0.6;border-width:4px}
  100%{width:200px;height:200px;opacity:0;border-width:1px}}

/* ══ COLUMN WOBBLE — more dramatic ══ */
.bc-column-hit{animation:bc-wobble 0.5s ease-out}
@keyframes bc-wobble{
  0%{transform:rotate(0) translateX(0)}
  15%{transform:rotate(3deg) translateX(3px)}
  30%{transform:rotate(-3deg) translateX(-3px)}
  45%{transform:rotate(2deg) translateX(2px)}
  60%{transform:rotate(-1.5deg) translateX(-1px)}
  75%{transform:rotate(0.5deg)}
  100%{transform:rotate(0) translateX(0)}}

/* ══ WOOLLY BEAVER — CSS brown blob with trail ══ */
.bc-beaver-run{position:relative;overflow:hidden}
.bc-beaver-run::before{content:'';position:absolute;top:45%;width:20px;height:10px;
  background:var(--cave-brown);border-radius:10px 10px 4px 4px;
  box-shadow:6px 0 0 2px rgba(120,53,15,0.3),-3px 0 0 1px rgba(120,53,15,0.2),
    0 2px 4px rgba(0,0,0,0.3);
  pointer-events:none;z-index:2;animation:bc-beaver-dash 3s linear infinite}
.bc-beaver-run::after{content:'';position:absolute;top:48%;width:24px;height:2px;
  background:linear-gradient(90deg,transparent,rgba(120,53,15,0.15),rgba(120,53,15,0.08),transparent);
  pointer-events:none;z-index:1;animation:bc-beaver-dash 3s linear infinite;animation-delay:0.1s}
@keyframes bc-beaver-dash{0%{left:-30px;opacity:0}5%{opacity:0.6}
  50%{opacity:0.7}95%{opacity:0.6}100%{left:calc(100% + 30px);opacity:0}}

/* ══ BONE CRACK — radial burst ══ */
.bc-bone-crack{position:relative}
.bc-bone-crack::after{content:'';position:absolute;right:8px;top:50%;width:16px;height:16px;
  transform:translateY(-50%) scale(0);border-radius:50%;
  background:radial-gradient(circle,rgba(234,88,12,0.8),rgba(251,191,36,0.4),transparent);
  box-shadow:0 0 10px 4px rgba(234,88,12,0.3);
  animation:bc-crack-pop 0.5s ease-out forwards}
@keyframes bc-crack-pop{0%{transform:translateY(-50%) scale(0)}
  50%{transform:translateY(-50%) scale(2)}
  100%{transform:translateY(-50%) scale(1.2);opacity:0}}

/* ══ CAVE PAINTING decorative elements ══ */
.bc-cave-art{position:absolute;pointer-events:none;z-index:0;opacity:0.04}
.bc-cave-art-1{top:20px;right:30px;width:80px;height:60px;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='60'%3E%3Cpath d='M10 50 L20 20 L30 25 L25 50 Z' fill='%23d97706'/%3E%3Ccircle cx='22' cy='15' r='5' fill='%23d97706'/%3E%3Cline x1='30' y1='25' x2='50' y2='20' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M55 15 L65 10 L75 20 L70 35 L60 40 L50 30 Z' fill='%23d97706'/%3E%3Ccircle cx='63' cy='18' r='2' fill='%231c1410'/%3E%3C/svg%3E") no-repeat}
.bc-cave-art-2{bottom:40px;left:20px;width:100px;height:50px;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='50'%3E%3Cpath d='M5 45 L15 15 L25 20 L20 45 Z' fill='%23d97706'/%3E%3Ccircle cx='18' cy='10' r='4' fill='%23d97706'/%3E%3Cline x1='25' y1='18' x2='40' y2='22' stroke='%23d97706' stroke-width='2'/%3E%3Cline x1='40' y1='22' x2='55' y2='15' stroke='%23d97706' stroke-width='2'/%3E%3Cpath d='M60 25 Q70 10 80 20 Q90 30 95 25' stroke='%23d97706' stroke-width='2' fill='none'/%3E%3C/svg%3E") no-repeat}

/* ══ FIGHT EVENT ROWS ══ */
.bc-fight-row{display:flex;align-items:center;gap:8px;padding:5px 8px;margin:3px 0;border-radius:5px;font-size:12px;transition:background 0.15s}
.bc-fight-good{background:rgba(34,197,94,0.06);border-left:3px solid rgba(34,197,94,0.25)}
.bc-fight-bad{background:rgba(239,68,68,0.06);border-left:3px solid rgba(239,68,68,0.25)}
.bc-fight-neutral{background:rgba(217,119,6,0.04);border-left:3px solid rgba(217,119,6,0.12)}
.bc-fight-climax{background:rgba(34,197,94,0.12);border:2px solid rgba(34,197,94,0.2);border-radius:8px;padding:10px;
  box-shadow:0 0 20px rgba(34,197,94,0.08);animation:bc-climax-glow 1s ease-out}
.bc-fight-fall{background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.15);border-radius:8px;padding:8px;
  animation:bc-wobble 0.5s ease-out}
.bc-fight-drama{background:rgba(217,119,6,0.04);border-left:3px dashed rgba(217,119,6,0.2);
  font-style:italic;margin:6px 0;padding:6px 10px}
@keyframes bc-climax-glow{0%{box-shadow:0 0 40px rgba(34,197,94,0.3)}100%{box-shadow:0 0 20px rgba(34,197,94,0.08)}}

@media(prefers-reduced-motion:reduce){
  .bc-fire-phase::before,.bc-fire-phase::after,.bc-fire-bar-fill,
  .bc-bonfire::before,.bc-bonfire::after,.bc-med-fire,
  .bc-tar-pit::before,.bc-tar-pit::after,.bc-tar-splat::before,
  .bc-beaver-run::before,.bc-beaver-run::after,
  .bc-column-hit,.bc-fight-fall,.bc-fight-climax,
  .bc-vs-text,.bc-vs-text::before,.bc-vs-text::after,.bc-vs-splash,
  .bc-vs-fighter,.bc-bone-crack::after{animation:none!important}
}
</style>
<div class="bc-shell"><div class="bc-cave-art bc-cave-art-1"></div><div class="bc-cave-art bc-cave-art-2"></div>${content}</div>`;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildMillionBucksBCTitleCard(ep) {
  const bc = ep.millionBucksBC;
  if (!bc) return '';

  return _bcShell(`
    <div style="text-align:center;padding:50px 20px 60px;position:relative;z-index:6">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:5px;color:rgba(217,119,6,0.4);text-transform:uppercase;margin-bottom:14px">STONE AGE CHALLENGE</div>
      <div style="font-family:'Bungee Shade',sans-serif;font-size:36px;color:var(--cave-amber);text-shadow:0 0 30px rgba(217,119,6,0.3),3px 3px 0 rgba(0,0,0,0.6);letter-spacing:4px;line-height:1.1;margin-bottom:8px">ONE MILLION<br>BUCKS, B.C.</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:13px;font-style:italic;color:rgba(255,255,255,0.5);margin-bottom:24px;letter-spacing:1px">"Fire. Columns. Tar pits. Go caveman."</div>
      <div style="display:flex;gap:20px;justify-content:center;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-size:32px">🔥</div><div style="font-size:9px;color:var(--fire-orange);letter-spacing:2px">FIRE MAKING</div></div>
        <div style="text-align:center"><div style="font-size:32px">🦴</div><div style="font-size:9px;color:var(--bone-white);letter-spacing:2px">BONE BATTLE</div></div>
        <div style="text-align:center"><div style="font-size:32px">🪨</div><div style="font-size:9px;color:#a8a29e;letter-spacing:2px">TAR PIT</div></div>
      </div>
      <div style="margin-top:30px;font-size:12px;color:rgba(255,255,255,0.4)">${pick(BC_HOST.intro)(host())}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 2: FIRE MAKING
// ══════════════════════════════════════════════════════════════
export function rpBuildMillionBucksBCFire(ep) {
  const bc = ep.millionBucksBC;
  if (!bc || !bc.fireMaking) return '';
  const fm = bc.fireMaking;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'bc-fire';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  // Intro
  steps.push({ html: `<div class="bc-ev" style="border-left-color:var(--fire-orange);padding:14px">
    <div style="font-size:28px">🔥</div>
    <div style="flex:1"><div class="bc-ev-badge fire" style="font-size:11px;padding:4px 12px">PHASE I — FIRE MAKING</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:6px">${pick(BC_HOST.fireIntro)(host())}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;font-style:italic">Make fire with rocks. Cheat at your own risk.</div></div>
  </div>` });

  // Per tribe
  for (const ft of fm.tribes) {
    let tHtml = `<div class="bc-ev bc-fire-phase" style="border-left-color:var(--cave-amber);padding:14px;overflow:hidden">
      <div style="flex:1">
      <div class="bc-ev-badge amber" style="font-size:11px;padding:4px 12px">🔥 ${ft.tribe}</div>`;
    for (const evt of ft.events) {
      const isGood = ['goodContrib', 'cheatSuccess', 'accidentalClutch'].includes(evt.type);
      const isBad = ['badContrib', 'cheatCaught', 'argue'].includes(evt.type);
      const color = evt.type === 'hostCall' ? 'var(--fire-orange)' : isGood ? '#22c55e' : isBad ? '#ef4444' : 'rgba(255,255,255,0.6)';
      tHtml += `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:13px;color:${color}">
        ${evt.player ? _bcPortrait(evt.player, 24) : ''} <span>${evt.icon} ${evt.text}</span>
      </div>`;
    }
    // Fire visual + host commentary based on score
    const maxScore = Math.max(0.1, ...fm.tribes.map(t => t.fireScore));
    const pct = ft.fireScore > 0 ? Math.min(100, (ft.fireScore / maxScore) * 100) : 0;
    const fireLevel = ft.fireScore <= 0 ? 'none' : ft.fireScore < 1.5 ? 'tiny' : ft.fireScore < 3 ? 'medium' : 'big';
    const fireVisual = fireLevel === 'none' ? '🪨🪨🪨' : fireLevel === 'tiny' ? '🪨🕯️🪨' : fireLevel === 'medium' ? '🪨🔥🪨' : '🔥🔥🔥';
    const fireSize = fireLevel === 'none' ? '16px' : fireLevel === 'tiny' ? '20px' : fireLevel === 'medium' ? '28px' : '36px';
    const fireCss = fireLevel === 'big' ? 'bc-bonfire' : fireLevel === 'medium' ? 'bc-med-fire' : '';
    const fireCommentary = fireLevel === 'none' ? pick(BC_HOST.fireNone)(host(), ft.tribe)
      : fireLevel === 'tiny' ? pick(BC_HOST.fireTiny)(host(), ft.tribe)
      : fireLevel === 'medium' ? pick(BC_HOST.fireMedium)(host(), ft.tribe)
      : pick(BC_HOST.fireBig)(host(), ft.tribe);
    const fireColor = fireLevel === 'none' ? 'rgba(168,162,158,0.5)' : fireLevel === 'tiny' ? 'var(--cave-amber)' : fireLevel === 'medium' ? 'var(--fire-orange)' : 'var(--cave-red)';

    tHtml += `<div style="text-align:center;padding:10px 0 6px" class="${fireCss}">
      <div style="font-size:${fireSize};line-height:1;margin-bottom:6px">${fireVisual}</div>
      <div style="font-size:11px;color:${fireColor};font-style:italic;max-width:400px;margin:0 auto">${fireCommentary}</div>
    </div>
    <div style="margin-top:6px">
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
        <span style="color:var(--cave-amber);font-family:'Share Tech Mono',monospace">FIRE SCORE</span>
        <span style="color:var(--cave-amber);font-family:'Share Tech Mono',monospace">${ft.fireScore.toFixed(1)}</span>
      </div>
      <div class="bc-fire-bar">
        <div class="bc-fire-bar-fill" style="width:${pct}%"></div>
      </div>
    </div></div></div>`;
    steps.push({ html: tHtml });
  }

  // Winner announcement
  steps.push({ html: `<div class="bc-ev" style="border-left-color:#22c55e;padding:14px;text-align:center">
    <div style="flex:1">
    <div class="bc-ev-badge green" style="font-size:11px;padding:4px 12px">🦴 BIGGER BONES AWARDED</div>
    <div style="font-size:14px;color:#22c55e;margin-top:6px">${pick(BC_HOST.bigBones)(host(), bc.fireWinner)}</div>
    </div>
  </div>` });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="bc-step-fire-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="bc-controls-fire" class="bc-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="bc-btn-next" onclick="millionBucksBCRevealNext('bc-fire',${totalSteps})">SPARK</button>
    <button class="bc-btn-all" onclick="millionBucksBCRevealAll('bc-fire',${totalSteps})">Reveal All</button>
  </div>
  <div id="bc-done-fire" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_bcBadge('FIRE PHASE COMPLETE', 'fire')}
  </div>`;

  const hudCells = `
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--fire-orange)">🔥</div><div class="bc-hud-lbl">FIRE</div></div>
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:#22c55e">${bc.fireWinner?.[0] || '?'}</div><div class="bc-hud-lbl">WINNER</div></div>
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--cave-amber)">I</div><div class="bc-hud-lbl">PHASE</div></div>
  `;

  return _bcShell(`
    <div class="bc-hud">${hudCells}</div>
    <div class="bc-layout">
      <div class="bc-feed">${feed}${controls}</div>
      <div class="bc-sidebar" id="bc-sidebar-fire">${_bcBuildFireSidebar(bc, revIdx + 1)}</div>
    </div>
  `, ep);
}

function _bcBuildFireSidebar(bc, revCount) {
  const fm = bc.fireMaking;
  const offset = 1; // intro
  const tribesRevealed = Math.max(0, Math.min(fm.tribes.length, revCount - offset));
  const winnerRevealed = revCount > offset + fm.tribes.length;

  let sb = `<div class="bc-side-sec">FIRE SCORES</div>`;
  for (let i = 0; i < fm.tribes.length; i++) {
    const ft = fm.tribes[i];
    const shown = i < tribesRevealed;
    const isWinner = winnerRevealed && ft.tribe === bc.fireWinner;
    sb += `<div style="padding:6px;margin-bottom:4px;background:rgba(0,0,0,0.15);border-radius:4px;opacity:${shown ? 1 : 0.4}">
      <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:11px;margin-bottom:3px">
        <span style="color:var(--cave-amber)">${ft.tribe}</span>
        ${shown ? `<span style="color:${isWinner ? '#22c55e' : 'var(--fire-orange)'}">${ft.fireScore.toFixed(1)}${isWinner ? ' 🦴' : ''}</span>` : '<span style="color:rgba(255,255,255,0.15)">???</span>'}
      </div>
      ${shown ? `<div style="height:5px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100, (ft.fireScore / Math.max(1, ...fm.tribes.map(t => t.fireScore))) * 100)}%;background:${isWinner ? '#22c55e' : 'var(--fire-orange)'};border-radius:3px"></div>
      </div>` : ''}
    </div>`;
  }
  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 2.5: PREHISTORIC BREAK
// ══════════════════════════════════════════════════════════════
export function rpBuildMillionBucksBCBreak(ep) {
  const bc = ep.millionBucksBC;
  if (!bc || !bc.breakEvents?.length) return '';
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'bc-break';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  steps.push({ html: `<div class="bc-ev" style="border-left-color:var(--cave-amber);padding:14px">
    <div style="font-size:28px">🏕️</div>
    <div style="flex:1"><div class="bc-ev-badge amber" style="font-size:11px;padding:4px 12px">PREHISTORIC BREAK</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:6px">Between the fire and the fight, tensions rise and bonds form...</div></div>
  </div>` });

  for (const evt of bc.breakEvents) {
    const badgeColor = evt.badgeClass === 'red' ? 'var(--cave-red)' : evt.badgeClass === 'green' ? 'var(--cave-green)' : evt.badgeClass === 'teal' ? '#2dd4bf' : 'var(--cave-amber)';
    const borderColor = evt.badgeClass === 'red' ? 'rgba(239,68,68,0.2)' : evt.badgeClass === 'green' ? 'rgba(34,197,94,0.2)' : 'rgba(217,119,6,0.15)';
    steps.push({ html: `<div class="bc-ev bc-fight-drama" style="border-left-color:${borderColor};padding:12px">
      <div style="flex:1">
      <div style="display:inline-block;padding:2px 8px;font-size:8px;font-family:'Share Tech Mono',monospace;letter-spacing:2px;border-radius:2px;margin-bottom:6px;border:1px solid ${badgeColor};color:${badgeColor};background:rgba(0,0,0,0.2)">${evt.badgeText}</div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="display:flex;gap:3px">${(evt.players || []).map(n => _bcPortrait(n, 28)).join('')}</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.7);font-style:italic;line-height:1.5">${evt.text}</div>
      </div></div>
    </div>` });
  }

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="bc-step-break-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="bc-controls-break" class="bc-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="bc-btn-next" onclick="millionBucksBCRevealNext('bc-break',${totalSteps})">NEXT</button>
    <button class="bc-btn-all" onclick="millionBucksBCRevealAll('bc-break',${totalSteps})">Reveal All</button>
  </div>
  <div id="bc-done-break" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_bcBadge('BACK TO THE CHALLENGE', 'amber')}
  </div>`;

  return _bcShell(`
    <div class="bc-hud">
      <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--cave-amber)">🏕️</div><div class="bc-hud-lbl">BREAK</div></div>
      <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--cave-amber)">${bc.breakEvents.length}</div><div class="bc-hud-lbl">EVENTS</div></div>
    </div>
    <div class="bc-layout">
      <div class="bc-feed">${feed}${controls}</div>
      <div class="bc-sidebar" id="bc-sidebar-break">
        <div class="bc-side-sec">DRAMA LOG</div>
        ${bc.breakEvents.map((e, i) => {
          const shown = i + 1 < revIdx + 1;
          return `<div style="padding:3px;margin-bottom:2px;font-size:9px;color:${shown ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'};font-family:'Share Tech Mono',monospace">${shown ? e.badgeText : '???'}</div>`;
        }).join('')}
      </div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 3: BONE BATTLE
// ══════════════════════════════════════════════════════════════
export function rpBuildMillionBucksBCBattle(ep) {
  const bc = ep.millionBucksBC;
  if (!bc || !bc.boneBattle) return '';
  const bb = bc.boneBattle;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = 'bc-battle';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const revIdx = _tvState[stateKey].idx;

  const steps = [];

  // Intro
  steps.push({ html: `<div class="bc-ev" style="border-left-color:var(--bone-white);padding:14px">
    <div style="font-size:28px">🦴</div>
    <div style="flex:1"><div class="bc-ev-badge bone" style="font-size:11px;padding:4px 12px">PHASE II — BONE BATTLE</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:6px">${pick(BC_HOST.battleIntro)(host())}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:8px;font-style:italic">${bb.rounds.length} rounds. Last one on the column wins. Losers eat tar.</div></div>
  </div>` });

  // Per round
  const allRounds = [...bb.rounds, ...(bb.tiebreaker ? [bb.tiebreaker] : [])];
  for (const rd of allRounds) {
    let rdHtml = '';

    // VS Splash
    rdHtml += `<div class="bc-vs-splash">
      <div style="font-size:10px;color:var(--cave-amber);letter-spacing:3px;margin-bottom:8px">${rd.isTiebreaker ? '⚔️ TIEBREAKER' : `ROUND ${rd.round}`}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">`;
    for (let fi = 0; fi < rd.fighters.length; fi++) {
      const f = rd.fighters[fi];
      const hasBigBone = f.tribe === bc.fireWinner;
      rdHtml += `<div class="bc-vs-fighter">
        ${_bcPortrait(f.fighter, 48)}
        <div class="bc-vs-name" style="color:var(--bone-white)">${f.fighter}</div>
        <div style="font-size:8px;color:var(--cave-amber)">${f.tribe}${hasBigBone ? ' 🦴' : ''}</div>
      </div>`;
      if (fi < rd.fighters.length - 1) {
        rdHtml += `<div class="bc-vs-text">VS</div>`;
      }
    }
    rdHtml += `</div></div>`;

    // Events — grouped by phase with distinct visual treatment
    rdHtml += `<div style="padding:4px 0">`;
    for (const evt of rd.events) {
      const goodPhases = ['climax', 'lastStanding'];
      const badPhases = ['fall', 'startled'];
      const isGood = evt.phase === 'climax' || evt.phase === 'midResolve' && evt.icon === '✅' || evt.phase === 'showboat' && evt.icon === '💪' || evt.phase === 'grip' && evt.icon === '💎';
      const isBad = badPhases.includes(evt.phase) || evt.phase === 'midResolve' && evt.icon === '❌' || evt.phase === 'showboat' && evt.icon === '😬' || evt.phase === 'grip' && evt.icon === '😰';
      const isTar = evt.phase === 'tar';
      const isClimax = evt.phase === 'climax';
      const isFall = evt.phase === 'fall';
      const isDrama = evt.phase === 'drama';

      const rowClass = isDrama ? 'bc-fight-row bc-fight-drama' : isTar ? 'bc-tar-pit bc-tar-splat' : isClimax ? 'bc-fight-row bc-fight-climax' : isFall ? 'bc-fight-row bc-fight-fall bc-column-hit' : isGood ? 'bc-fight-row bc-fight-good' : isBad ? 'bc-fight-row bc-fight-bad' : 'bc-fight-row bc-fight-neutral';

      const phaseColors = {
        reaction: 'rgba(254,243,199,0.6)', mount: 'var(--cave-amber)',
        opening: 'var(--bone-white)', midEvent: 'var(--fire-orange)', midResolve: evt.icon === '✅' ? 'var(--cave-green)' : 'var(--cave-red)',
        trashTalk: '#a78bfa', showboat: evt.icon === '💪' ? 'var(--cave-green)' : 'var(--cave-red)',
        grip: evt.icon === '💎' ? 'var(--cave-green)' : 'var(--cave-red)', startled: 'var(--cave-red)',
        climax: 'var(--cave-green)', fall: 'var(--cave-red)', tar: '#a8a29e', drama: 'var(--cave-amber)',
      };
      const color = phaseColors[evt.phase] || 'rgba(255,255,255,0.6)';

      rdHtml += `<div class="${rowClass}" style="color:${color}">
        ${evt.player ? _bcPortrait(evt.player, isClimax || isFall ? 28 : isTar ? 24 : 22) : '<span style="width:22px;flex-shrink:0"></span>'}
        <span style="font-size:${isClimax || isFall ? '13px' : isTar ? '11px' : '12px'}">${evt.icon} ${evt.text}</span>
      </div>`;
    }
    rdHtml += `</div>`;

    // Round winner bar
    const winner = rd.rankings[0];
    rdHtml += `<div style="text-align:center;padding:10px 0 4px;font-size:12px">
      <span style="color:var(--cave-green);font-family:'Share Tech Mono',monospace;letter-spacing:2px">👑 ${winner.fighter} (${winner.tribe}) WINS ROUND ${rd.isTiebreaker ? 'TB' : rd.round}</span>
    </div>`;

    steps.push({ html: `<div class="bc-ev" style="border-left-color:var(--bone-white);padding:14px;overflow:hidden">
      <div style="flex:1">${rdHtml}</div>
    </div>` });
  }

  // Final scores
  let scoreHtml = `<div class="bc-ev" style="border-left-color:#22c55e;padding:14px;text-align:center">
    <div style="flex:1"><div class="bc-ev-badge green" style="font-size:11px;padding:4px 12px">🦴 BATTLE COMPLETE</div>`;
  const sortedScores = Object.entries(bb.battleScores).sort((a, b) => b[1] - a[1]);
  for (const [tribe, score] of sortedScores) {
    const maxScore = Math.max(1, ...Object.values(bb.battleScores));
    const pct = Math.min(100, (score / maxScore) * 100);
    scoreHtml += `<div style="margin:6px 0">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
        <span style="color:var(--cave-amber);font-family:'Share Tech Mono',monospace">${tribe}</span>
        <span style="color:var(--bone-white)">${score} pts</span>
      </div>
      <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:#22c55e;border-radius:3px"></div>
      </div>
    </div>`;
  }
  scoreHtml += `</div></div>`;
  steps.push({ html: scoreHtml });

  const totalSteps = steps.length;
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    feed += `<div id="bc-step-battle-${i}" style="${i <= revIdx ? '' : 'display:none'}">${steps[i].html}</div>`;
  }

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="bc-controls-battle" class="bc-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="bc-btn-next" onclick="millionBucksBCRevealNext('bc-battle',${totalSteps})">FIGHT!</button>
    <button class="bc-btn-all" onclick="millionBucksBCRevealAll('bc-battle',${totalSteps})">Reveal All</button>
  </div>
  <div id="bc-done-battle" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:14px 0'}">
    ${_bcBadge('BATTLE COMPLETE', 'bone')}
  </div>`;

  const hudCells = `
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--bone-white)">🦴</div><div class="bc-hud-lbl">BATTLE</div></div>
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--cave-amber)">${bb.rounds.length}</div><div class="bc-hud-lbl">ROUNDS</div></div>
    <div class="bc-hud-cell"><div class="bc-hud-val" style="color:var(--cave-amber)">II</div><div class="bc-hud-lbl">PHASE</div></div>
  `;

  return _bcShell(`
    <div class="bc-hud">${hudCells}</div>
    <div class="bc-layout">
      <div class="bc-feed">${feed}${controls}</div>
      <div class="bc-sidebar" id="bc-sidebar-battle">${_bcBuildBattleSidebar(bc, revIdx + 1)}</div>
    </div>
  `, ep);
}

function _bcBuildBattleSidebar(bc, revCount) {
  const bb = bc.boneBattle;
  const roundOffset = 1; // intro
  const allRounds = [...bb.rounds, ...(bb.tiebreaker ? [bb.tiebreaker] : [])];
  const roundsRevealed = Math.max(0, Math.min(allRounds.length, revCount - roundOffset));

  let sb = `<div class="bc-side-sec">BATTLE SCORES</div>`;

  // Running scores based on revealed rounds
  const revScores = {};
  for (const tribe of Object.keys(bb.battleScores)) revScores[tribe] = 0;
  for (let i = 0; i < roundsRevealed; i++) {
    const rd = allRounds[i];
    for (let ri = 0; ri < rd.rankings.length; ri++) {
      const pts = ri === 0 ? (rd.isTiebreaker ? 2 : 1) : 0;
      revScores[rd.rankings[ri].tribe] += pts;
    }
  }

  const maxScore = Math.max(1, ...Object.values(revScores));
  const sorted = Object.entries(revScores).sort((a, b) => b[1] - a[1]);
  for (const [tribe, score] of sorted) {
    const pct = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
    sb += `<div style="padding:4px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:3px">
      <div style="display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:11px;margin-bottom:2px">
        <span style="color:var(--cave-amber)">${tribe}</span>
        <span style="color:var(--bone-white)">${score} pts</span>
      </div>
      <div style="height:4px;background:rgba(0,0,0,0.3);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--cave-amber);border-radius:2px"></div>
      </div>
    </div>`;
  }

  // Fighters by team with round results + benched players
  const currentRoundIdx = roundsRevealed - 1;
  const isComplete = roundsRevealed >= allRounds.length;
  const currentFighters = new Set(currentRoundIdx >= 0 && !isComplete ? allRounds[currentRoundIdx].fighters.map(f => f.fighter) : []);

  const tribeNames = Object.keys(bb.battleScores);
  sb += `<div class="bc-side-sec">FIGHTERS</div>`;
  for (const tribe of tribeNames) {
    sb += `<div style="padding:6px;margin-bottom:5px;background:rgba(0,0,0,0.1);border-radius:4px">
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--cave-amber);margin-bottom:5px;letter-spacing:1px">${tribe}</div>`;

    // Get ALL tribe members from the tribe data
    const tribeObj = gs.tribes?.find(t => t.name === tribe);
    const allTribeMembers = tribeObj?.members || [];
    const benchedName = bc.benchDecisions?.[tribe]?.benched;

    // Active fighters
    const activeFighters = allTribeMembers.filter(n => n !== benchedName);
    sb += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:${benchedName ? '5px' : '0'}">`;
    for (const name of activeFighters) {
      let wins = 0, fought = 0;
      for (let i = 0; i < roundsRevealed; i++) {
        const rd = allRounds[i];
        const f = rd.fighters.find(fi => fi.fighter === name);
        if (!f) continue;
        fought++;
        if (rd.rankings[0].fighter === name) wins++;
      }
      const isActive = currentFighters.has(name);
      const borderColor = isActive ? 'var(--fire-orange)' : fought === 0 ? 'rgba(217,119,6,0.2)' : wins > 0 ? 'var(--cave-green)' : 'var(--cave-red)';
      const glowStyle = isActive ? 'box-shadow:0 0 8px rgba(234,88,12,0.5);' : '';
      sb += `<div style="display:flex;align-items:center;gap:3px;padding:3px 5px;background:rgba(0,0,0,0.15);border-radius:4px;border:1px solid ${borderColor};${glowStyle}" title="${name}: ${wins}W / ${fought} fights">
        ${_bcSidePortrait(name, 20)}
        <div style="display:flex;flex-direction:column;gap:1px">
          <span style="font-size:9px;color:rgba(255,255,255,0.7)">${name.split(' ')[0]}</span>
          ${fought > 0 ? `<span style="font-size:8px;font-family:'Share Tech Mono',monospace;color:${wins > 0 ? 'var(--cave-green)' : 'var(--cave-red)'}">${wins}W/${fought}F</span>` : ''}
        </div>
      </div>`;
    }
    sb += `</div>`;

    // Benched player (greyed out)
    if (benchedName) {
      const benchInfo = bc.benchDecisions[tribe];
      const benchLabel = benchInfo.voluntary ? 'SAT OUT' : 'BENCHED';
      sb += `<div style="display:flex;align-items:center;gap:4px;padding:3px 5px;background:rgba(0,0,0,0.08);border-radius:4px;border:1px dashed rgba(255,255,255,0.08);opacity:0.45">
        ${_bcSidePortrait(benchedName, 18)}
        <span style="font-size:9px;color:rgba(255,255,255,0.4)">${benchedName.split(' ')[0]}</span>
        <span style="font-size:7px;font-family:'Share Tech Mono',monospace;color:rgba(255,255,255,0.2);letter-spacing:1px">${benchLabel}</span>
      </div>`;
    }
    sb += `</div>`;
  }

  sb += `<div style="font-size:8px;color:rgba(255,255,255,0.2);text-align:center;margin-top:6px">${roundsRevealed > 0 ? `${roundsRevealed}/${allRounds.length} rounds` : 'AWAITING BATTLE'}</div>`;
  return sb;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN 4: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildMillionBucksBCResults(ep) {
  const bc = ep.millionBucksBC;
  if (!bc) return '';

  const sorted = Object.entries(bc.tribeScores).sort((a, b) => b[1] - a[1]);
  const scores = ep.chalMemberScores || {};
  const bb = bc.boneBattle;
  const allRounds = [...bb.rounds, ...(bb.tiebreaker ? [bb.tiebreaker] : [])];

  let content = `<div style="text-align:center;padding:30px 20px;position:relative;z-index:6">
    <div style="font-size:10px;letter-spacing:5px;color:rgba(217,119,6,0.4);text-transform:uppercase;margin-bottom:8px">STONE AGE DEBRIEF</div>
    <div style="font-family:'Bungee Shade',sans-serif;font-size:28px;color:var(--cave-amber);text-shadow:0 0 20px rgba(217,119,6,0.3);letter-spacing:4px;margin-bottom:6px">${bc.winner}</div>
    <div style="font-size:14px;color:var(--cave-green);letter-spacing:3px;margin-bottom:20px">SURVIVED THE STONE AGE</div>
  </div>`;

  // Tribe cards with ALL members
  content += `<div style="display:flex;gap:14px;justify-content:center;padding:0 14px 20px;flex-wrap:wrap;position:relative;z-index:6">`;
  for (const [tribe, score] of sorted) {
    const isWinner = tribe === bc.winner;
    const isLoser = tribe === bc.loser;
    const borderColor = isWinner ? 'var(--cave-green)' : isLoser ? 'var(--cave-red)' : 'rgba(217,119,6,0.15)';
    const status = isWinner ? 'IMMUNE' : isLoser ? 'TRIBAL COUNCIL' : 'SAFE';
    const statusColor = isWinner ? 'var(--cave-green)' : isLoser ? 'var(--cave-red)' : 'rgba(255,255,255,0.4)';

    // Get tribe members
    const tribeData = ep.winner?.name === tribe ? ep.winner : ep.loser?.name === tribe ? ep.loser : ep.safeTribes?.find(t => t.name === tribe);
    const members = tribeData?.members || [];

    content += `<div style="flex:1;min-width:220px;max-width:380px;background:rgba(0,0,0,0.3);border:2px solid ${borderColor};border-radius:8px;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <div style="font-family:'Bungee Shade',sans-serif;font-size:16px;color:${isWinner ? 'var(--cave-green)' : isLoser ? 'var(--cave-red)' : 'var(--cave-amber)'};letter-spacing:2px">${tribe}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--cave-amber)">🦴 ${score} wins</div>
      </div>
      <div style="font-size:8px;letter-spacing:2px;color:${statusColor};margin-bottom:10px;font-family:'Share Tech Mono',monospace">${status}</div>`;

    // Fire score
    const fireData = bc.fireMaking.tribes.find(ft => ft.tribe === tribe);
    if (fireData) {
      const isFireWinner = tribe === bc.fireWinner;
      content += `<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:8px;padding:4px 6px;background:rgba(0,0,0,0.15);border-radius:3px">
        <span style="color:var(--fire-orange)">🔥 Fire: ${fireData.fireScore.toFixed(1)}</span>
        ${isFireWinner ? '<span style="color:var(--cave-green)">🦴 BIGGER BONES</span>' : ''}
      </div>`;
    }

    // All members with individual scores and battle record
    for (const name of members.sort((a, b) => (scores[b] || 0) - (scores[a] || 0))) {
      const memberScore = scores[name] || 0;
      // Battle record
      let wins = 0, fought = 0;
      for (const rd of allRounds) {
        const f = rd.fighters.find(fi => fi.fighter === name);
        if (!f) continue;
        fought++;
        if (rd.rankings[0].fighter === name) wins++;
      }
      const recordText = fought > 0 ? `${wins}/${fought}` : 'bench';
      const recordColor = wins > 0 ? 'var(--cave-green)' : fought > 0 ? 'var(--cave-red)' : 'rgba(255,255,255,0.2)';

      content += `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;margin-bottom:3px;background:rgba(0,0,0,0.15);border-radius:4px">
        ${_bcPortrait(name, 26)}
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;color:rgba(255,255,255,0.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
          <div style="display:flex;gap:8px;font-size:9px;font-family:'Share Tech Mono',monospace">
            <span style="color:${recordColor}">🦴 ${recordText}</span>
          </div>
        </div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:var(--cave-amber);font-weight:700">${memberScore}</div>
      </div>`;
    }
    content += `</div>`;
  }
  content += `</div>`;

  return _bcShell(content, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL FUNCTIONS
// ══════════════════════════════════════════════════════════════
function _bcUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('bc-', '');
  const sideEl = document.getElementById(`bc-sidebar-${suffix}`);
  if (!sideEl) return;
  const latestEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  const bc = latestEp?.millionBucksBC;
  if (!bc) return;
  const revCount = revIdx + 1;
  if (suffix === 'fire') {
    sideEl.innerHTML = _bcBuildFireSidebar(bc, revCount);
  } else if (suffix === 'battle') {
    sideEl.innerHTML = _bcBuildBattleSidebar(bc, revCount);
  }
}

export function millionBucksBCRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('bc-', '');
  const el = document.getElementById(`bc-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`bc-controls-${suffix}`);
    const done = document.getElementById(`bc-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _bcUpdateSidebar(screenKey, state.idx);
}

export function millionBucksBCRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('bc-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`bc-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`bc-controls-${suffix}`);
  const done = document.getElementById(`bc-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _bcUpdateSidebar(screenKey, state.idx);
}
