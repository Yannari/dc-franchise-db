// js/chal/rock-n-rule.js — Rock n' Rule rock-and-roll challenge (post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 0.3) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function portrait(name, size = 42) {
  const sl = slug(name);
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }

// ══════════════════════════════════════════════════════════════
// GUITAR HERO — PHASE 1 TEXT
// ══════════════════════════════════════════════════════════════
const GUITAR_STYLE = {
  safe: {
    success: [
      (n, pr) => `${n} played it safe — steady rhythm, clean notes, no drama. Not exciting, but not a single miss. The crowd nodded politely.`,
      (n, pr) => `${n} kept ${pr.posAdj} head down and focused on the screen. Every note hit. Every chord clean. "Boring but brilliant," ${host()} muttered.`,
      (n, pr) => `No tricks. No flair. Just ${n} and the notes, locked in perfect rhythm. The guitar hummed contentedly. The crowd wanted more, but couldn't argue with the accuracy.`,
      (n, pr) => `${n} played like a session musician — technically perfect, emotionally restrained. The notes flowed in ordered precision. "Professional," ${host()} said. It wasn't entirely a compliment.`,
    ],
    fail: [
      (n, pr) => `${n} played it safe... and STILL missed notes. The guitar buzzed angrily. A small shock traveled through ${pr.posAdj} fingers. "That was the EASY version!"`,
      (n, pr) => `Even the safe route couldn't save ${n}. Missed notes, wrong timing, the guitar sputtering. A mild shock and the crowd winced in sympathy.`,
      (n, pr) => `${n} stuck to the basics but the basics rejected ${pr.obj}. Flat notes, missed chords, and a gentle but humiliating buzz through the guitar. "Music isn't for everyone," ${host()} offered.`,
    ],
  },
  flashy: {
    success: [
      (n, pr) => `${n} went FULL rockstar — behind-the-head solo, teeth picking, stage dive fake-out. The crowd ROARED. Every note hit WHILE showboating. Legendary.`,
      (n, pr) => `${n} didn't just play the guitar — ${pr.sub} PERFORMED. Windmill strums, knee slides, a power chord that shook the speakers. The notes were perfect AND the style was insane.`,
      (n, pr) => `The stage belonged to ${n}. Tricks, spins, a mid-solo wink at the camera. The crowd lost their minds. And somehow — SOMEHOW — every note was dead-on accurate.`,
      (n, pr) => `${n} turned the guitar sideways, played three chords with ${pr.posAdj} teeth, kicked a speaker, and landed back on beat. ${host()}: "I... I can't argue with that."`,
    ],
    fail: [
      (n, pr) => `${n} attempted a behind-the-head solo. The guitar hit ${pr.posAdj} OWN head. Notes scattered everywhere. Not the performance ${pr.sub} envisioned.`,
      (n, pr) => `${n} tried to do a rock star knee slide and slid RIGHT off the stage. The guitar went flying. The crowd gasped.`,
      (n, pr) => `${n} went for the big finish — guitar spin, power slide, windmill chord. Missed every note. The guitar CAUGHT FIRE. ${pr.Sub} threw it. Chef threw water.`,
      (n, pr) => `The tricks were AMAZING. The music was TERRIBLE. ${n} chose style over substance and paid the price. Every note missed. Every chord wrong.`,
      (n, pr) => `${n} started strong — a confident power chord. Then the second note missed. Then the third. By the fifth, ${pr.sub} was just wildly strumming and hoping.`,
      (n, pr) => `${n} swung the guitar like a battle axe instead of playing it. Impressive athletically. Musically? A war crime.`,
      (n, pr) => `${n} tried a behind-the-back strum, tripped over the cable, and face-planted into the amp. The amp survived. ${n}'s dignity did not.`,
    ],
    triedTooHard: [
      (n, pr) => `${n} was incredible. Athletic. Showy. The tricks were Olympic-level. But ${host()} shook his head. "You tried too hard." The crowd booed the judge, not the player. But the score stands.`,
      (n, pr) => `${n} played like ${pr.sub} was auditioning for Cirque du Soleil, not a rock band. Every note hit, every trick landed — but ${host()} wanted a ROCK STAR, not a gymnast. "Too polished. Too rehearsed. Where's the SOUL?"`,
      (n, pr) => `Technically perfect. Artistically soulless. ${n} hit every note while doing a backflip and ${host()} still wasn't satisfied. "Rock and roll is about FEELING, not gymnastics!" The crowd disagreed. ${host()} didn't care.`,
      (n, pr) => `${n} performed a flawless six-minute shred with pyrotechnics, costume changes, and a choreographed light show. ${host()}: "This is a rock challenge, not Broadway." Penalized for excellence. Only in Total Drama.`,
    ],
  },
  electrocution: [
    (n, pr) => `BZZZZZT! ${n}'s guitar lit up like a Christmas tree. ${pr.Sub} convulsed, smoke rose from ${pr.posAdj} fingers, and the crowd went "OOHHH." ${host()}: "That's gonna leave a mark."`,
    (n, pr) => `The shock hit ${n} mid-note. ${pr.posAdj} hair stood straight up. ${pr.posAdj} eyes went wide. The guitar squealed. The crowd screamed. ${host()} took notes.`,
    (n, pr) => `ZAP! ${n} lit up brighter than the stage lights. The guitar sparked, ${pr.posAdj} fingers smoked, and for one beautiful second ${pr.sub} was the most electric thing in the building.`,
    (n, pr) => `${n}'s guitar didn't just shock ${pr.obj} — it EXPLODED. Not a dramatic explosion. More of a sad pop and a puff of smoke. ${pr.Sub} stood there holding the neck. "...Is there a spare?"`,
  ],
  archetypeSpecial: {
    'challenge-beast': (n, pr) => `${n} played the guitar like it personally offended ${pr.obj}. Raw power chords, aggressive strumming, every note hit through sheer force of will. The guitar was scared of ${pr.obj}.`,
    hothead: (n, pr) => `${n} got frustrated after the first missed note and SMASHED the guitar against the stage. Then picked up the pieces and somehow kept playing. On a broken guitar. Out of spite.`,
    goat: (n, pr) => `${n} held the guitar upside down for the first thirty seconds. Nobody corrected ${pr.obj}. When ${pr.sub} finally figured it out, the song was half over.`,
    villain: (n, pr) => `${n} didn't just play — ${pr.sub} played while staring directly at ${pr.posAdj} biggest rival. Every note was a threat. Every chord was a power move. The guitar was a weapon.`,
    'social-butterfly': (n, pr) => `${n} turned the solo into a singalong. Got the crowd clapping, swaying, singing backup. Missed a few notes but the ENERGY was undeniable. ${host()} was torn.`,
    floater: (n, pr) => `${n} played so average that ${host()} forgot ${pr.sub} was on stage twice. Technically adequate. Spiritually invisible. The guitar equivalent of beige wallpaper.`,
  },
};

// ══════════════════════════════════════════════════════════════
// RED CARPET — PHASE 2 TEXT
// ══════════════════════════════════════════════════════════════
const CARPET_HAZARDS = [
  { id: 'flash', name: 'Flash Bulb Barrage', icon: '📸', styleStat: 'social', damageStat: 'temperament' },
  { id: 'fans', name: 'Grabby Fans', icon: '🤩', styleStat: 'social', damageStat: 'physical' },
  { id: 'standees', name: 'Cardboard Standees', icon: '🧍', styleStat: 'boldness', damageStat: 'physical' },
  { id: 'swag', name: 'Swag Table', icon: '🎁', styleStat: 'strategic', damageStat: 'boldness' },
  { id: 'signing', name: 'Autograph Wall', icon: '✍️', styleStat: 'social', damageStat: 'temperament' },
  { id: 'groupies', name: 'Groupie Ambush', icon: '💋', styleStat: 'boldness', damageStat: 'social' },
  { id: 'sandwich', name: 'Sandwich Tray', icon: '🥪', styleStat: 'endurance', damageStat: 'endurance' },
  { id: 'rope', name: 'Velvet Rope Maze', icon: '🔗', styleStat: 'mental', damageStat: 'physical' },
];

const CARPET_TEXT = {
  highStyle: [
    (n, h, pr) => `${n} struck a pose at the ${h.name} and OWNED it. Cameras clicked. Fans screamed. ${pr.Sub} looked like ${pr.sub} was BORN for the red carpet.`,
    (n, h, pr) => `${n} handled the ${h.name} with effortless grace. A smile, a wave, a perfectly timed hair flip. Magazine cover material.`,
    (n, h, pr) => `The ${h.name} was supposed to be an obstacle. ${n} turned it into a photo opportunity. ${host()} was impressed despite himself.`,
  ],
  lowStyle: [
    (n, h, pr) => `${n} panicked at the ${h.name}. Arms flailing, eyes wide, the grace of a startled deer. The cameras caught every embarrassing second.`,
    (n, h, pr) => `${n} stumbled through the ${h.name}. Tripping, bumping into a photographer, nearly wiping out. Not ${pr.posAdj} finest moment.`,
    (n, h, pr) => `${n} tried to navigate the ${h.name} and lost. Decisively. The photos will be used for blackmail at the next tribal council.`,
    (n, h, pr) => `${n} froze at the ${h.name}. Deer in headlights. The cameras clicked anyway. Every angle was worse than the last.`,
  ],
  highDamage: [
    (n, h, pr) => `${n} accidentally broke a ${h.name.toLowerCase()} while trying to look cool. The wreckage was impressive. The photo was not.`,
    (n, h, pr) => `${n} left a trail of destruction at the ${h.name}. Chef had to duct-tape everything back together.`,
  ],
  backstageSkip: [
    (n, pr) => `${n} flashes the Backstage Pass and bypasses the first half of the carpet entirely. "VIP access, baby." The other castmates seethe with jealousy.`,
    (n, pr) => `${n} walks past the first three stations like they don't exist. Backstage Pass privilege. "Must be nice," someone mutters.`,
  ],
};

const CARPET_PHOTO_RESULTS = [
  { label: 'COVER SHOT', color: '#ffd700', desc: 'Tabloid gold. Front page material.' },
  { label: 'GOOD ANGLE', color: '#22c55e', desc: 'Flattering. Publicist-approved.' },
  { label: 'CANDID', color: '#60a5fa', desc: 'Caught off-guard but charming.' },
  { label: 'BLURRY MESS', color: '#f59e0b', desc: 'The camera was kind. The moment was not.' },
  { label: 'DISASTER', color: '#ef4444', desc: 'Delete this. Burn the negative. Sue the photographer.' },
];

// ══════════════════════════════════════════════════════════════
// HOTEL TRASHING — PHASE 3 TEXT
// ══════════════════════════════════════════════════════════════
const HOTEL_ITEMS = [
  { id: 'lamp1', name: 'Lamp', emoji: '💡', points: 1, difficulty: 2 },
  { id: 'lamp2', name: 'Floor Lamp', emoji: '🪔', points: 1, difficulty: 2 },
  { id: 'phone', name: 'Phone', emoji: '📞', points: 1, difficulty: 2 },
  { id: 'vase', name: 'Vase', emoji: '🏺', points: 1, difficulty: 2 },
  { id: 'mirror', name: 'Mirror', emoji: '🪞', points: 2, difficulty: 3 },
  { id: 'paintings', name: 'Paintings', emoji: '🖼️', points: 2, difficulty: 3 },
  { id: 'tv', name: 'TV', emoji: '📺', points: 2, difficulty: 4 },
  { id: 'minibar', name: 'Minibar', emoji: '🍸', points: 2, difficulty: 3 },
  { id: 'bathtub', name: 'Bathtub', emoji: '🛁', points: 2, difficulty: 5 },
  { id: 'couch', name: 'Couch', emoji: '🛋️', points: 3, difficulty: 5 },
  { id: 'bed', name: 'Bed', emoji: '🛏️', points: 3, difficulty: 5 },
  { id: 'piano', name: 'Piano', emoji: '🎹', points: 3, difficulty: 6 },
  { id: 'chandelier', name: 'Chandelier', emoji: '🔮', points: 4, difficulty: 7 },
  { id: 'walls', name: 'Set Walls', emoji: '🧱', points: 5, difficulty: 9 },
];

const TRASH_TEXT = {
  methodical: [
    (n, item) => `${n} carefully dismantled the ${item.name}. Piece by piece. Almost surgical. Points earned through precision.`,
    (n, item) => `${n} picked up the ${item.name}, studied it for a moment, then dropped it from maximum height. Efficient destruction.`,
    (n, item) => `${n} approached the ${item.name} like a professional demolition expert. One well-placed kick. Down it went.`,
    (n, item) => `The ${item.name} didn't stand a chance against ${n}'s methodical approach. Targeted. Controlled. Devastating.`,
  ],
  berserkerSuccess: [
    (n, item) => `${n} went FULL BERSERKER on the ${item.name}! SMASH! CRASH! BANG! Double points! The crowd (and Chef) winced.`,
    (n, item) => `${n} HURLED ${pronouns(n).ref} at the ${item.name} with a primal scream. The explosion of debris was MAGNIFICENT. Chef gave a standing ovation.`,
    (n, item) => `${n} picked up the ${item.name} over ${pronouns(n).posAdj} head and threw it at another piece of furniture. Both exploded. DOUBLE KILL.`,
    (n, item) => `The ${item.name} ceased to exist. ${n} didn't just break it — ${pronouns(n).sub} ERASED it from reality. There was nothing left to sweep up.`,
  ],
  berserkerFail: [
    (n, item) => `${n} charged the ${item.name} and MISSED. Slammed into the wall instead. The ${item.name} remained intact, smugly.`,
    (n, item) => `${n} tried to suplex the ${item.name} and threw out ${pronouns(n).posAdj} back. Half points. Full embarrassment.`,
    (n, item) => `${n} kicked the ${item.name} so hard ${pronouns(n).posAdj} shoe flew off and hit ${host()} in the face. The ${item.name} wobbled but survived.`,
    (n, item) => `BERSERKER MODE BACKFIRE! ${n} swung at the ${item.name}, missed, and put ${pronouns(n).posAdj} fist through the drywall instead. ${host()}: "That's... not on the menu."`,
  ],
  rampage: [
    (n) => `${n} entered RAMPAGE MODE! Eyes wild, furniture flying, walls shaking. Nothing is safe. NOTHING. This is the Courtney Moment.`,
    (n) => `Something snapped inside ${n}. ${pronouns(n).Sub} stopped targeting specific items and just started DESTROYING EVERYTHING IN SIGHT. The room will never recover.`,
    (n) => `${n} has gone full rock star. The lamp hit the TV which hit the bed which hit the wall. Chain reaction of chaos. ${host()} is taking cover behind Chef.`,
  ],
  itemGone: [
    (n, item) => `${n} went to smash the ${item.name}... but it was already destroyed. Nothing left but dust and regret.`,
    (n, item) => `${n} targeted the ${item.name} only to find a pile of rubble where it used to be. Someone got there first.`,
  ],
  vipBonus: [
    (n) => `${n} steps into the wreckage for a VIP bonus round. The room is... not in great shape. But there might be something left to break.`,
    (n) => `"Your turn," ${host()} says to ${n}. ${pronouns(n).Sub} looks at the demolished hotel room. "...What's left?" ${host()} shrugs.`,
  ],
  pennies: [
    (n) => `${n} found pennies under the couch! "3... 4... 5! FIVE pennies!" ${host()}: "That's... not how this challenge works." ${n}: "And a PEANUT!"`,
    (n) => `While everyone else was smashing, ${n} was searching. Behind the couch cushions: loose change, a peanut, and what might be a very old candy bar. "This day keeps getting better!"`,
  ],
};

// ══════════════════════════════════════════════════════════════
// EGO SYSTEM TEXT
// ══════════════════════════════════════════════════════════════
const EGO_EVENTS = {
  divaTantrum: [
    (n, pr) => `${n} throws ${pr.posAdj} water bottle across craft services. "Do you KNOW who I am?! I'm the STAR of this challenge!" Nobody asked. Several bonds were damaged.`,
    (n, pr) => `${n} demands a private dressing room, a personal spotlight, and a fruit basket with no brown M&Ms. ${host()}: "This is a REALITY SHOW." ${n}: "And I'M the reality."`,
    (n, pr) => `${n} interrupts everyone to announce that ${pr.sub} should have won the last round. Again. For the third time. The eye-rolling is universal.`,
  ],
  trashTalk: [
    (n, target, pr) => `${n} corners ${target} backstage. "Face it — I'm better than you at this. At EVERYTHING, actually." ${target} says nothing. The silence is louder.`,
    (n, target, pr) => `${n} mimics ${target}'s performance from the last round, badly, while the others watch. Some laugh. ${target} does not.`,
  ],
  underdogRally: [
    (n, supporter, pr) => `${supporter} finds ${n} sitting alone backstage. "Hey. You're better than you think." ${n}: "I literally got electrocuted." ${supporter}: "Yeah, but stylishly."`,
    (n, supporter, pr) => `${supporter} pulls ${n} aside. "Forget the scores. Next round, just GO for it. What's the worst that happens?" ${n}: "...More electrocution?" ${supporter}: "Exactly. Nothing new."`,
  ],
  rockstarAlliance: [
    (a, b) => `${a} and ${b} bump fists between rounds. Two performers who recognize each other's talent. "We should start a band after this." "We'd be terrible." "We'd be LEGENDARY."`,
    (a, b) => `${a} catches ${b}'s eye across the stage. A nod of mutual respect. In a game full of enemies, finding someone who gets it is rare. A rockstar alliance forms.`,
  ],
  meltdown: [
    (n, pr) => `${n} has completely lost it. Sitting on the stage floor, head in hands. "I can't do this anymore." The guitar sits silent beside ${pr.obj}. This is the low point.`,
    (n, pr) => `${n} kicks ${pr.posAdj} guitar offstage, rips off ${pr.posAdj} backstage pass, and storms toward the exit. Chef blocks the door. "Challenge ain't over." ${n}: "MY dignity is."`,
  ],
};

// ══════════════════════════════════════════════════════════════
// TIE-BREAKER SHOWDOWN TEXT
// ══════════════════════════════════════════════════════════════
const SHOWDOWN_TEXT = [
  (a, b) => `TIE! ${a} and ${b} are dead even. ${host()} grins. "ENCORE ROUND!" Two guitars. One spotlight. Head to head. The crowd goes INSANE.`,
  (a, b) => `The scores are TIED. ${host()} can barely contain himself. "Ladies and gentlemen... SUDDEN DEATH ENCORE." ${a} and ${b} grab their guitars. This ends NOW.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateRockNRule(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    phase1: { performances: [], winner: null, events: [] },
    phase2: { runs: [], winner: null, events: [] },
    phase3: { rounds: [], winner: null, events: [], inventory: [], vipHolder: null },
    ego: {},
    titles: {},
    showdown: null,
    immunityWinner: null,
  };
  active.forEach(n => { result.ego[n] = 0; });

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: GUITAR HERO
  // ══════════════════════════════════════════════════════════════
  const phase1Scores = {};
  for (const name of active) {
    const s = pStats(name);
    const a = arch(name);
    const pr = pronouns(name);

    // Accuracy base
    const accuracy = s.mental * 0.4 + s.intuition * 0.3 + s.physical * 0.3 + noise(2);

    // Style choice — boldness + archetype drive the decision
    const flashyChance = s.boldness * 0.08 + ((['villain', 'hothead', 'challenge-beast', 'chaos-agent', 'wildcard'].includes(a)) ? 0.2 : 0) + noise(0.3);
    const goesFlashy = flashyChance > 0.5;

    let score, text, category, electrocuted = false, triedTooHard = false;
    const noteHits = Math.min(10, Math.max(1, Math.round(accuracy)));
    const noteMisses = 10 - noteHits;

    if (!goesFlashy) {
      // Safe play
      if (accuracy > 4.5) {
        score = 8 + noise(2);
        text = pick(GUITAR_STYLE.safe.success)(name, pr);
        category = 'safe-success';
      } else {
        score = 4 + noise(2);
        text = pick(GUITAR_STYLE.safe.fail)(name, pr);
        category = 'safe-fail';
        electrocuted = accuracy < 3;
      }
    } else {
      // Flashy play
      const flashyExecution = s.boldness * 0.3 + s.physical * 0.2 + accuracy * 0.3 + noise(2);
      const overperformThreshold = 7 + s.strategic * 0.3;

      if (flashyExecution > 6 && flashyExecution < overperformThreshold) {
        // Nailed it — flashy AND accurate (slightly better than safe success)
        score = 11 + noise(2);
        text = pick(GUITAR_STYLE.flashy.success)(name, pr);
        category = 'flashy-success';
        popDelta(name, 2);
      } else if (flashyExecution >= overperformThreshold) {
        // Tried too hard — technically perfect but penalized
        score = 6 + noise(2);
        text = pick(GUITAR_STYLE.flashy.triedTooHard)(name, pr);
        category = 'tried-too-hard';
        triedTooHard = true;
      } else {
        // Spectacular failure
        score = 2 + noise(2);
        text = pick(GUITAR_STYLE.flashy.fail)(name, pr);
        category = 'flashy-fail';
        electrocuted = true;
      }
    }

    // Archetype special text (append to main text)
    const specialFn = GUITAR_STYLE.archetypeSpecial[a];
    const archetypeText = specialFn ? specialFn(name, pr) : '';

    // Electrocution event
    let electrocutionText = '';
    if (electrocuted) {
      electrocutionText = pick(GUITAR_STYLE.electrocution)(name, pr);
      score = Math.max(1, score - 2);
      result.ego[name] -= 1;
      popDelta(name, -1);
    }

    score = Math.max(0, Math.round(score * 10) / 10);
    phase1Scores[name] = score;
    ep.chalMemberScores[name] += score;

    result.phase1.performances.push({
      name, score, text, archetypeText, category, goesFlashy, electrocuted, triedTooHard,
      electrocutionText, noteHits, noteMisses,
    });
  }

  // Phase 1 winner
  const p1Winner = Object.entries(phase1Scores).sort((a, b) => b[1] - a[1])[0][0];
  result.phase1.winner = p1Winner;
  result.titles.bestGuitar = p1Winner;
  result.ego[p1Winner] += 3;
  ep.campEvents[campKey].post.push({
    text: `${p1Winner} won the Guitar Hero phase and earned a Backstage Pass!`,
    players: [p1Winner], badgeText: 'BEST GUITAR', badgeClass: 'purple', tag: 'rock-n-rule',
  });

  // Phase 1 social events
  const electrocutedPlayers = result.phase1.performances.filter(p => p.electrocuted);
  if (electrocutedPlayers.length >= 2) {
    const [a, b] = electrocutedPlayers.slice(0, 2);
    result.phase1.events.push({ type: 'shockBuddies', players: [a.name, b.name],
      text: `${a.name} and ${b.name} both got electrocuted. They share a moment of smoldering solidarity backstage. "Your hair looks worse than mine." "Impossible."`,
    });
    addBond(a.name, b.name, 1);
  }

  // Ego events between Phase 1 and 2
  _fireEgoEvents(active, result, ep, campKey, 'phase1');

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: RED CARPET GAUNTLET
  // ══════════════════════════════════════════════════════════════
  const phase2Scores = {};
  const hazards = [...CARPET_HAZARDS].sort(() => Math.random() - 0.5).slice(0, 6);

  for (const name of active) {
    const s = pStats(name);
    const pr = pronouns(name);
    const isVIP = name === p1Winner;
    const startIdx = isVIP ? 3 : 0;

    let totalStyle = 0, totalDamage = 0;
    const stationResults = [];

    if (isVIP) {
      stationResults.push({ type: 'skip', text: pick(CARPET_TEXT.backstageSkip)(name, pr) });
      // VIP bonus: small style boost for skipped stations (arrived fresh, confident)
      totalStyle += 1 + s.social * 0.1;
    }

    for (let i = startIdx; i < hazards.length; i++) {
      const h = hazards[i];
      const socialBonus = h.styleStat === 'social' ? 0 : s.social * 0.05;
      const styleScore = s[h.styleStat] * 0.15 + socialBonus + noise(0.8);
      const damageScore = (10 - s[h.damageStat]) * 0.15 + noise(0.8);

      totalStyle += Math.max(0, styleScore);
      totalDamage += Math.max(0, damageScore);

      const isGood = styleScore > 1.5;
      const isDestructive = damageScore > 1.2;
      let text;
      if (isGood) {
        text = pick(CARPET_TEXT.highStyle)(name, h, pr);
      } else {
        text = pick(CARPET_TEXT.lowStyle)(name, h, pr);
      }
      if (isDestructive) {
        text += ' ' + pick(CARPET_TEXT.highDamage)(name, h, pr);
      }

      stationResults.push({ hazard: h, styleScore: styleScore.toFixed(1), damageScore: damageScore.toFixed(1), text, isGood, isDestructive });
    }

    // Photo result
    const photoScore = Math.max(0, (totalStyle - totalDamage * 0.7)) * 0.8;
    const photoIdx = photoScore > 7 ? 0 : photoScore > 4 ? 1 : photoScore > 2 ? 2 : photoScore > 0 ? 3 : 4;
    const photoResult = CARPET_PHOTO_RESULTS[photoIdx];

    phase2Scores[name] = Math.max(0, Math.round(photoScore * 10) / 10);
    ep.chalMemberScores[name] += phase2Scores[name];

    result.phase2.runs.push({ name, stations: stationResults, totalStyle: totalStyle.toFixed(1), totalDamage: totalDamage.toFixed(1), photoScore: photoScore.toFixed(1), photoResult, isVIP });
  }

  // Phase 2 winner
  const p2Winner = Object.entries(phase2Scores).sort((a, b) => b[1] - a[1])[0][0];
  result.phase2.winner = p2Winner;
  result.titles.mostPhotogenic = p2Winner;
  result.ego[p2Winner] += 3;
  result.phase3.vipHolder = p2Winner;
  ep.campEvents[campKey].post.push({
    text: `${p2Winner} had the best red carpet photo and earned VIP Access for the hotel trashing!`,
    players: [p2Winner], badgeText: 'MOST PHOTOGENIC', badgeClass: 'pink', tag: 'rock-n-rule',
  });

  // Phase 2 social: jealousy event
  const bestPhoto = result.phase2.runs.sort((a, b) => parseFloat(b.photoScore) - parseFloat(a.photoScore))[0];
  const worstPhoto = result.phase2.runs.sort((a, b) => parseFloat(a.photoScore) - parseFloat(b.photoScore))[0];
  if (bestPhoto.name !== worstPhoto.name) {
    result.phase2.events.push({ type: 'jealousy', players: [worstPhoto.name, bestPhoto.name],
      text: `${worstPhoto.name} sees ${bestPhoto.name}'s photo and seethes. "How does ${pronouns(bestPhoto.name).sub} look THAT good?!" The jealousy is real and it's not going away.`,
    });
    addBond(worstPhoto.name, bestPhoto.name, -1);
    result.ego[worstPhoto.name] -= 1;
  }

  _fireEgoEvents(active, result, ep, campKey, 'phase2');

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: HOTEL ROOM TRASHING
  // ══════════════════════════════════════════════════════════════
  const phase3Scores = {};
  active.forEach(n => { phase3Scores[n] = 0; });
  const inventory = HOTEL_ITEMS.map(item => ({ ...item, destroyed: false, destroyedBy: null }));
  result.phase3.inventory = inventory;

  const numRounds = 3;
  const berserkerStreak = {};
  active.forEach(n => { berserkerStreak[n] = 0; });

  // VIP bonus round goes FIRST — early access to the full room
  const vipHolder = result.phase3.vipHolder;
  if (vipHolder) {
    const vipResults = [];
    vipResults.push({ name: vipHolder, text: `${vipHolder} gets VIP early access to the hotel room. While everyone else waits outside, ${pronouns(vipHolder).sub} has first pick of the pristine room. "Ladies and gentlemen... LET ME AT IT."`, points: 0, action: 'vip-entry' });
    for (let i = 0; i < 1; i++) {
      const available = inventory.filter(it => !it.destroyed);
      const target = available.sort((a, b) => b.points - a.points)[0];
      if (!target) break;
      target.destroyed = true;
      target.destroyedBy = vipHolder;
      const pts = target.points;
      phase3Scores[vipHolder] += pts;
      ep.chalMemberScores[vipHolder] += pts;
      vipResults.push({ name: vipHolder, target: target.name, points: pts, text: pick(TRASH_TEXT.methodical)(vipHolder, target), action: 'vip-smash', emoji: target.emoji });
    }
    vipResults._destroyedIds = inventory.filter(it => it.destroyed).map(it => it.id);
    result.phase3.rounds.push(vipResults);
  }

  for (let round = 0; round < numRounds; round++) {
    const roundResults = [];
    const roundOrder = [...active].sort(() => Math.random() - 0.5);

    for (const name of roundOrder) {
      const s = pStats(name);
      const a = arch(name);
      const pr = pronouns(name);

      // Find available items
      const available = inventory.filter(item => !item.destroyed);
      if (available.length === 0) {
        roundResults.push({ name, text: `${name} looks around the room. There's nothing left to break. Rubble, dust, and the faint smell of destruction.`, points: 0, action: 'nothing' });
        continue;
      }

      // Pick target — prefer high-value items
      const target = available.sort((a, b) => b.points - a.points)[Math.min(Math.floor(Math.random() * 3), available.length - 1)];

      // Choose: methodical or berserker
      const berserkerChance = s.boldness * 0.08 + (10 - s.temperament) * 0.06 + (berserkerStreak[name] > 0 ? 0.15 : 0) + noise(0.3);
      const goesBerserker = berserkerChance > 0.5;

      // Pennies event for goats/underdogs
      if ((a === 'goat' || a === 'underdog') && round === 1 && Math.random() < 0.3) {
        roundResults.push({ name, text: pick(TRASH_TEXT.pennies)(name), points: 1, action: 'pennies' });
        phase3Scores[name] += 1;
        continue;
      }

      let points, text, action;
      if (!goesBerserker) {
        // Methodical — guaranteed destruction
        target.destroyed = true;
        target.destroyedBy = name;
        points = target.points;
        text = pick(TRASH_TEXT.methodical)(name, target);
        action = 'methodical';
        berserkerStreak[name] = 0;
      } else {
        // Berserker — risk/reward
        const berserkerPower = s.physical * 0.3 + s.boldness * 0.4 + (10 - s.temperament) * 0.3 + noise(2);
        berserkerStreak[name]++;

        if (berserkerPower > target.difficulty) {
          // Success — double points
          target.destroyed = true;
          target.destroyedBy = name;
          points = Math.round(target.points * 1.5);
          text = pick(TRASH_TEXT.berserkerSuccess)(name, target);
          action = 'berserker-success';
          popDelta(name, 1);

          // Rampage check — 3+ berserker rounds in a row (harder to trigger)
          if (berserkerStreak[name] >= 3) {
            text += ' ' + pick(TRASH_TEXT.rampage)(name);
            // Collateral damage — 50% chance to destroy one adjacent item
            const collateral = available.filter(i => i.id !== target.id && !i.destroyed);
            if (collateral.length && Math.random() < 0.5) {
              const bonus = pick(collateral);
              bonus.destroyed = true;
              bonus.destroyedBy = name;
              points += bonus.points;
              text += ` COLLATERAL DAMAGE: the ${bonus.name} is gone too!`;
            }
            action = 'rampage';
          }
        } else {
          // Failure — half points, embarrassment
          points = Math.floor(target.points / 2);
          target.destroyed = Math.random() < 0.5;
          if (target.destroyed) target.destroyedBy = name;
          text = pick(TRASH_TEXT.berserkerFail)(name, target);
          action = 'berserker-fail';
          result.ego[name] -= 1;
        }
      }

      phase3Scores[name] += points;
      ep.chalMemberScores[name] += points;
      roundResults.push({ name, target: target.name, points, text, action, emoji: target.emoji });
    }
    // Snapshot destroyed items after this round
    roundResults._destroyedIds = inventory.filter(it => it.destroyed).map(it => it.id);
    result.phase3.rounds.push(roundResults);
  }


  // Phase 3 winner
  const p3Winner = Object.entries(phase3Scores).sort((a, b) => b[1] - a[1])[0][0];
  result.phase3.winner = p3Winner;
  result.titles.mostDestructive = p3Winner;
  result.ego[p3Winner] += 3;
  ep.campEvents[campKey].post.push({
    text: `${p3Winner} was the most destructive force in the hotel trashing!`,
    players: [p3Winner], badgeText: 'MOST DESTRUCTIVE', badgeClass: 'red', tag: 'rock-n-rule',
  });

  // Phase 3 social: destruction buddies
  const destroyers = active.filter(n => phase3Scores[n] > 10);
  if (destroyers.length >= 2) {
    const [a, b] = destroyers.slice(0, 2);
    result.phase3.events.push({ type: 'destructionBuddies', players: [a, b],
      text: `${a} and ${b} survey the wreckage together. "We destroyed EVERYTHING." High five. Destruction creates bonds.`,
    });
    addBond(a, b, 2);
  }

  // Rock God check — won all 3 phases
  if (p1Winner === p2Winner && p2Winner === p3Winner) {
    result.titles.rockGod = p1Winner;
    popDelta(p1Winner, 3);
    ep.campEvents[campKey].post.push({
      text: `${p1Winner} is the ROCK GOD — won ALL THREE phases! Best Guitar, Most Photogenic, AND Most Destructive!`,
      players: [p1Winner], badgeText: 'ROCK GOD', badgeClass: 'gold', tag: 'rock-n-rule',
    });
  }

  // ══════════════════════════════════════════════════════════════
  // IMMUNITY DETERMINATION
  // ══════════════════════════════════════════════════════════════
  const finalScores = {};
  active.forEach(n => { finalScores[n] = ep.chalMemberScores[n]; });
  const sorted = Object.entries(finalScores).sort((a, b) => b[1] - a[1]);

  // Tie-breaker showdown
  if (sorted.length >= 2 && Math.abs(sorted[0][1] - sorted[1][1]) <= 1) {
    const [a, b] = [sorted[0][0], sorted[1][0]];
    const aP = pStats(a).physical * 0.3 + pStats(a).boldness * 0.4 + noise(2);
    const bP = pStats(b).physical * 0.3 + pStats(b).boldness * 0.4 + noise(2);
    const showdownWinner = aP > bP ? a : b;
    result.showdown = {
      players: [a, b],
      winner: showdownWinner,
      text: pick(SHOWDOWN_TEXT)(a, b),
    };
    result.immunityWinner = showdownWinner;
  } else {
    result.immunityWinner = sorted[0][0];
  }

  popDelta(result.immunityWinner, 3);
  ep.campEvents[campKey].post.push({
    text: `${result.immunityWinner} won immunity in Rock n' Rule!${result.showdown ? ' (won in a tie-breaker encore!)' : ''}`,
    players: [result.immunityWinner], badgeText: 'IMMUNITY!', badgeClass: 'green', tag: 'rock-n-rule',
  });


  // ── ROMANCE HOOKS ──
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let _ri = 0; _ri < _romActive.length; _ri++) {
    for (let _rj = _ri + 1; _rj < _romActive.length; _rj++) {
      _challengeRomanceSpark(_romActive[_ri], _romActive[_rj], ep, null, null, ep.chalMemberScores || {}, 'rock concert');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'concert', _romActive);

  // ── FINALIZE ──
  ep.rockNRule = result;
  ep.isRockNRule = true;
  ep.challengeType = 'rock-n-rule';
  ep.challengeLabel = 'Rock n\' Rule';
  ep.challengeCategory = 'mixed';
  ep.immunityWinner = result.immunityWinner;
  ep.chalPlacements = sorted.map(([n]) => n);
  ep.tribalPlayers = active;
  updateChalRecord(ep);

  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'rock-n-rule', label: 'Rock n\' Rule', winner: result.immunityWinner };

  return ep;
}

// ── EGO EVENT SYSTEM ──
function _fireEgoEvents(active, result, ep, campKey, afterPhase) {
  const events = [];

  // Diva tantrum — high ego
  const divas = active.filter(n => result.ego[n] >= 4);
  if (divas.length) {
    const diva = pick(divas);
    const pr = pronouns(diva);
    events.push({ type: 'divaTantrum', player: diva, text: pick(EGO_EVENTS.divaTantrum)(diva, pr) });
    const nearby = pick(active.filter(n => n !== diva));
    if (nearby) addBond(diva, nearby, -1);
    popDelta(diva, -1);
    result.ego[diva] -= 1;
  }

  // Trash talk — high ego vs low ego
  const highEgo = active.filter(n => result.ego[n] >= 2).sort((a, b) => result.ego[b] - result.ego[a]);
  const lowEgo = active.filter(n => result.ego[n] <= -1).sort((a, b) => result.ego[a] - result.ego[b]);
  if (highEgo.length && lowEgo.length && Math.random() < 0.5) {
    const talker = highEgo[0], target = lowEgo[0];
    events.push({ type: 'trashTalk', players: [talker, target], text: pick(EGO_EVENTS.trashTalk)(talker, target, pronouns(talker)) });
    addBond(talker, target, -2);
    result.ego[target] -= 1;
  }

  // Underdog rally — low ego gets support
  if (lowEgo.length) {
    const underdog = lowEgo[0];
    const friends = active.filter(n => n !== underdog && getBond(n, underdog) > 1);
    if (friends.length) {
      const supporter = pick(friends);
      events.push({ type: 'underdogRally', players: [underdog, supporter], text: pick(EGO_EVENTS.underdogRally)(underdog, supporter, pronouns(underdog)) });
      addBond(underdog, supporter, 2);
      result.ego[underdog] += 1;
    }
  }

  // Rockstar alliance — two high performers bond
  const topPerformers = active.filter(n => result.ego[n] >= 2 && !divas.includes?.(n));
  if (topPerformers.length >= 2 && Math.random() < 0.4) {
    const [a, b] = topPerformers.slice(0, 2);
    if (getBond(a, b) >= 0) {
      events.push({ type: 'rockstarAlliance', players: [a, b], text: pick(EGO_EVENTS.rockstarAlliance)(a, b) });
      addBond(a, b, 2);
      ep.campEvents[campKey].post.push({
        text: `${a} and ${b} formed a rockstar alliance during the Rock n' Rule challenge!`,
        players: [a, b], badgeText: 'ROCKSTARS', badgeClass: 'purple', tag: 'rock-n-rule',
      });
    }
  }

  // Meltdown — ego drops too low
  const meltdowns = active.filter(n => result.ego[n] <= -3);
  if (meltdowns.length) {
    const melter = pick(meltdowns);
    events.push({ type: 'meltdown', player: melter, text: pick(EGO_EVENTS.meltdown)(melter, pronouns(melter)) });
    popDelta(melter, -2);
  }

  // Store events
  if (afterPhase === 'phase1') result.phase1.events.push(...events);
  else result.phase2.events.push(...events);
}

// ══════════════════════════════════════════════════════════════
// TEXT BACKLOG
// ══════════════════════════════════════════════════════════════
export function _textRockNRule(ep, ln, sec) {
  const rr = ep.rockNRule;
  if (!rr) return;
  sec('ROCK N\' RULE');

  ln('-- PHASE 1: GUITAR HERO --');
  for (const p of rr.phase1.performances) {
    ln(`  ${p.name} [${p.goesFlashy ? 'FLASHY' : 'SAFE'}] — Score: ${p.score}`);
    ln(`    Notes: ${p.noteHits}/10 hit${p.electrocuted ? ' | ⚡ ELECTROCUTED' : ''}${p.triedTooHard ? ' | TRIED TOO HARD' : ''}`);
    ln(`    ${p.text}`);
    if (p.archetypeText) ln(`    ${p.archetypeText}`);
    if (p.electrocutionText) ln(`    ${p.electrocutionText}`);
  }
  ln(`  >> PHASE 1 WINNER: ${rr.phase1.winner} — earns Backstage Pass`);
  for (const evt of rr.phase1.events) {
    ln(`  [${evt.type}] ${evt.text}`);
  }

  ln('-- PHASE 2: RED CARPET --');
  for (const r of rr.phase2.runs) {
    ln(`  ${r.name}${r.isVIP ? ' [VIP — Backstage Pass]' : ''} — ${r.photoResult.label} (Photo: ${r.photoScore})`);
    ln(`    Style: ${r.totalStyle} | Damage: ${r.totalDamage}`);
    for (const st of r.stations) {
      if (st.type === 'skip') { ln(`    🎫 ${st.text}`); continue; }
      ln(`    ${st.hazard.icon} ${st.hazard.name}: ${st.isGood ? '✨' : '💥'} (style ${st.styleScore}, dmg ${st.damageScore})`);
      ln(`      ${st.text}`);
    }
  }
  ln(`  >> PHASE 2 WINNER: ${rr.phase2.winner} — earns VIP Access`);
  for (const evt of rr.phase2.events) {
    ln(`  [${evt.type}] ${evt.text}`);
  }

  ln('-- PHASE 3: HOTEL TRASHING --');
  for (let i = 0; i < rr.phase3.rounds.length; i++) {
    const isVIP = i === 0 && rr.phase3.vipHolder;
    const rNum = rr.phase3.vipHolder ? i : i + 1;
    ln(`  ${isVIP ? '🎫 VIP EARLY ACCESS' : `Round ${rNum}`}:`);
    for (const r of rr.phase3.rounds[i]) {
      ln(`    ${r.name}: ${r.action}${r.target ? ` → ${r.target}` : ''} (+${r.points}pts)`);
      ln(`      ${r.text}`);
    }
  }
  ln(`  Room status: ${rr.phase3.inventory.filter(i => i.destroyed).length}/${rr.phase3.inventory.length} items destroyed`);
  ln(`  >> PHASE 3 WINNER: ${rr.phase3.winner}`);
  for (const evt of rr.phase3.events) {
    ln(`  [${evt.type}] ${evt.text}`);
  }

  ln('-- RESULTS --');
  if (rr.showdown) {
    ln(`  ⚡ TIE-BREAKER ENCORE: ${rr.showdown.players.join(' vs ')}`);
    ln(`    ${rr.showdown.text}`);
    ln(`    WINNER: ${rr.showdown.winner}`);
  }
  ln(`  🏆 IMMUNITY: ${rr.immunityWinner}`);
  const titles = [];
  if (rr.titles.bestGuitar) titles.push(`Best Guitar: ${rr.titles.bestGuitar}`);
  if (rr.titles.mostPhotogenic) titles.push(`Most Photogenic: ${rr.titles.mostPhotogenic}`);
  if (rr.titles.mostDestructive) titles.push(`Most Destructive: ${rr.titles.mostDestructive}`);
  if (rr.titles.rockGod) titles.push(`🤘 ROCK GOD: ${rr.titles.rockGod}`);
  if (titles.length) ln(`  Titles: ${titles.join(' | ')}`);
}

// ══════════════════════════════════════════════════════════════
// VP — CSS (OVERDRIVE: Punk Rock Concert + Zine Collage)
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rock+Salt&family=JetBrains+Mono:wght@400;700&display=swap');

  .rr-shell{
    --stage-purple:#2d1b69;--neon-cyan:#00e5ff;--hot-magenta:#ff1493;
    --amp-orange:#ff6600;--skull-green:#39ff14;--chrome:#c0c0c0;
    --stage-black:#0a0a0a;--spotlight:#f0f0ff;--gold-record:#ffd700;
    font-family:'JetBrains Mono',monospace;color:#e0e0e0;
    background:var(--stage-black);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:500px;
    overflow:clip;border:3px solid var(--stage-purple);
    box-shadow:0 0 40px rgba(45,27,105,0.5),inset 0 0 80px rgba(0,0,0,0.8);
  }
  .rr-shell *{box-sizing:border-box}

  /* Stage lighting — sweeping spotlights */
  .rr-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;
    background:
      conic-gradient(from 200deg at 20% 10%,transparent 0deg,rgba(0,229,255,0.06) 15deg,transparent 30deg),
      conic-gradient(from 340deg at 80% 15%,transparent 0deg,rgba(255,20,147,0.05) 15deg,transparent 30deg),
      radial-gradient(ellipse at 50% 100%,rgba(45,27,105,0.3) 0%,transparent 60%);
    animation:rr-spotlight-sweep 8s ease-in-out infinite alternate}

  /* EQ Visualizer — full background behind content */
  .rr-eq{position:absolute;bottom:0;left:0;right:220px;height:100%;pointer-events:none;z-index:0;
    display:flex;align-items:flex-end;justify-content:space-between;gap:3px;padding:0 10px;opacity:0.12}
  .rr-eq-bar{flex:1;border-radius:3px 3px 0 0;
    background:linear-gradient(180deg,var(--hot-magenta),var(--stage-purple),var(--neon-cyan));
    animation:rr-eq-bounce var(--eq-dur,1s) ease-in-out infinite alternate;
    box-shadow:0 0 6px currentColor}
  .rr-eq-bar:nth-child(odd){background:linear-gradient(180deg,var(--neon-cyan),var(--stage-purple),var(--hot-magenta))}
  .rr-eq-bar:nth-child(3n){background:linear-gradient(180deg,var(--amp-orange),var(--stage-purple),var(--neon-cyan))}


  /* ═══ TWO-COLUMN LAYOUT ═══ */
  .rr-layout{display:flex;gap:0;position:relative;z-index:1;min-height:480px}
  .rr-main{flex:1;padding:16px 20px;min-width:0}
  .rr-meter-col{width:220px;flex-shrink:0;position:sticky;top:0;align-self:flex-start;
    max-height:100vh;overflow-y:auto;overflow-x:hidden;
    scrollbar-width:thin;scrollbar-color:var(--stage-purple) transparent}

  /* ═══ ROCK METER SIDEBAR — Horizontal Leaderboard ═══ */
  .rr-meter{background:linear-gradient(180deg,#0d0d1a,#1a1a2e,#0d0d1a);
    border-left:3px solid var(--stage-purple);padding:10px 8px;min-height:480px;position:relative}
  .rr-meter-title{font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--neon-cyan);
    letter-spacing:4px;text-align:center;margin-bottom:4px;
    text-shadow:0 0 10px rgba(0,229,255,0.4)}

  /* Player rows */
  .rr-meter-list{display:flex;flex-direction:column;gap:6px;margin:8px 0}
  .rr-meter-player{display:flex;align-items:center;gap:6px;padding:4px 6px;
    background:rgba(45,27,105,0.15);border-radius:4px;border:1px solid rgba(45,27,105,0.25);
    position:relative;transition:all 0.3s}
  .rr-meter-player:first-child{border-color:var(--gold-record);
    background:rgba(255,215,0,0.06);box-shadow:0 0 8px rgba(255,215,0,0.08)}
  .rr-meter-rank{font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--chrome);
    width:14px;text-align:center;flex-shrink:0}
  .rr-meter-player:first-child .rr-meter-rank{color:var(--gold-record)}
  .rr-meter-img{width:26px;height:26px;border-radius:3px;object-fit:contain;flex-shrink:0;
    border:1px solid var(--stage-purple)}
  .rr-meter-info{flex:1;min-width:0}
  .rr-meter-name{font-family:'Bebas Neue',sans-serif;font-size:12px;color:#e0e0e0;
    letter-spacing:0.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rr-meter-bar-wrap{height:6px;background:rgba(255,255,255,0.06);border-radius:3px;margin-top:2px;
    overflow:hidden}
  .rr-meter-fill{height:100%;border-radius:3px;transition:width 0.5s ease;min-width:2px}
  .rr-meter-fill-green{background:linear-gradient(90deg,#16a34a,#22c55e)}
  .rr-meter-fill-yellow{background:linear-gradient(90deg,#ca8a04,#eab308)}
  .rr-meter-fill-red{background:linear-gradient(90deg,#dc2626,#ef4444)}
  .rr-meter-score{font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--neon-cyan);
    flex-shrink:0;width:28px;text-align:right;text-shadow:0 0 6px rgba(0,229,255,0.3)}
  .rr-meter-badges{display:flex;gap:3px;flex-wrap:wrap;margin-top:2px}

  /* Title badges */
  .rr-badge{display:inline-block;font-family:'Bebas Neue',sans-serif;font-size:8px;
    padding:1px 5px;border-radius:2px;letter-spacing:1px}
  .rr-badge-guitar{background:rgba(139,92,246,0.3);color:#a78bfa;border:1px solid rgba(139,92,246,0.4)}
  .rr-badge-photo{background:rgba(255,20,147,0.2);color:var(--hot-magenta);border:1px solid rgba(255,20,147,0.3)}
  .rr-badge-destroy{background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}
  .rr-badge-rockgod{background:linear-gradient(135deg,rgba(255,215,0,0.3),rgba(255,102,0,0.3));
    color:var(--gold-record);border:1px solid rgba(255,215,0,0.5);animation:rr-glow-pulse 2s ease-in-out infinite}

  /* ═══ TYPOGRAPHY ═══ */
  .rr-title{font-family:'Bebas Neue',sans-serif;font-size:36px;text-align:center;
    letter-spacing:6px;text-transform:uppercase;
    background:linear-gradient(180deg,var(--neon-cyan),var(--hot-magenta));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    filter:drop-shadow(0 0 10px rgba(0,229,255,0.3))}
  .rr-subtitle{font-family:'Rock Salt',cursive;font-size:12px;text-align:center;color:var(--amp-orange);
    letter-spacing:2px;margin:4px 0}
  .rr-phase-title{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--neon-cyan);
    text-align:center;letter-spacing:4px;margin:12px 0 4px;
    text-shadow:0 0 15px rgba(0,229,255,0.2)}
  .rr-phase-badge{display:inline-block;font-family:'Rock Salt',cursive;font-size:9px;
    padding:3px 10px;border:1px solid var(--hot-magenta);color:var(--hot-magenta);
    letter-spacing:1px;border-radius:2px;margin:0 auto 8px;
    text-shadow:0 0 8px rgba(255,20,147,0.3)}
  .rr-narration{font-family:'JetBrains Mono',monospace;font-size:13px;color:#ccc;
    line-height:1.7;margin:8px 0;padding:10px 14px;
    background:rgba(45,27,105,0.15);border-left:3px solid var(--stage-purple);
    border-radius:0 4px 4px 0}

  /* ═══ GUITAR HERO NOTE HIGHWAY (3D perspective) ═══ */
  .rr-note-track{display:flex;gap:3px;align-items:flex-end;margin:8px 0;padding:8px 12px 10px;
    background:linear-gradient(180deg,rgba(0,0,0,0.8) 0%,rgba(45,27,105,0.3) 40%,rgba(0,0,0,0.7) 100%);
    border-radius:4px;position:relative;overflow:hidden;
    perspective:400px;transform-style:preserve-3d;
    border-bottom:3px solid rgba(57,255,20,0.2)}
  /* Fret lines on the highway */
  .rr-note-track::before{content:'';position:absolute;inset:0;
    background:
      repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,255,255,0.04) 28px,rgba(255,255,255,0.04) 29px),
      linear-gradient(180deg,transparent 85%,rgba(57,255,20,0.1) 100%);
    pointer-events:none;transform:rotateX(8deg);transform-origin:bottom}
  /* Strikeline glow at bottom */
  .rr-note-track::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;
    background:linear-gradient(90deg,transparent,var(--skull-green),var(--neon-cyan),var(--skull-green),transparent);
    box-shadow:0 0 10px rgba(57,255,20,0.4),0 0 20px rgba(0,229,255,0.2);z-index:2}
  .rr-note{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:10px;font-weight:700;border:2px solid;position:relative;z-index:1;
    transition:transform 0.2s,box-shadow 0.2s}
  .rr-note-hit{border-color:var(--skull-green);color:var(--skull-green);
    box-shadow:0 0 8px rgba(57,255,20,0.5),0 0 16px rgba(57,255,20,0.2);
    animation:rr-note-burst 0.4s ease-out}
  .rr-note-miss{border-color:#ef4444;color:#ef4444;opacity:0.4;
    animation:rr-note-miss-x 0.3s ease-out}
  .rr-note-green{background:radial-gradient(circle,rgba(34,197,94,0.3),rgba(34,197,94,0.05))}
  .rr-note-red{background:radial-gradient(circle,rgba(239,68,68,0.3),rgba(239,68,68,0.05))}
  .rr-note-yellow{background:radial-gradient(circle,rgba(234,179,8,0.3),rgba(234,179,8,0.05))}
  .rr-note-blue{background:radial-gradient(circle,rgba(59,130,246,0.3),rgba(59,130,246,0.05))}
  .rr-note-orange{background:radial-gradient(circle,rgba(255,102,0,0.3),rgba(255,102,0,0.05))}

  /* Streak counter */
  .rr-streak{font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--skull-green);
    margin-left:8px;text-shadow:0 0 8px rgba(57,255,20,0.3)}
  .rr-streak-fire{color:var(--amp-orange);animation:rr-fire-pulse 0.5s ease-in-out infinite;
    font-size:16px;text-shadow:0 0 12px rgba(255,102,0,0.5)}

  /* Rock Meter gauge (half-circle) */
  .rr-rock-meter{width:60px;height:30px;margin-left:auto;position:relative;overflow:hidden;flex-shrink:0}
  .rr-rock-meter-bg{width:60px;height:60px;border-radius:50%;border:3px solid rgba(255,255,255,0.1);
    position:absolute;bottom:0;background:conic-gradient(from 180deg,#ef4444 0deg,#eab308 90deg,#22c55e 180deg,transparent 180deg)}
  .rr-rock-meter-needle{width:2px;height:26px;background:#fff;position:absolute;bottom:2px;left:50%;
    transform-origin:bottom center;transform:rotate(var(--needle,-45deg));
    box-shadow:0 0 4px rgba(255,255,255,0.5);transition:transform 0.5s cubic-bezier(0.16,1,0.3,1)}
  .rr-rock-meter-center{width:6px;height:6px;border-radius:50%;background:#fff;
    position:absolute;bottom:0;left:50%;transform:translateX(-50%);z-index:2}

  /* Combo badges — slam in like stamps */
  .rr-combo{display:inline-block;font-family:'Bebas Neue',sans-serif;font-size:12px;
    padding:2px 8px;border-radius:2px;letter-spacing:2px;margin-left:6px;
    animation:rr-combo-slam 0.4s cubic-bezier(0.16,1,0.3,1)}
  .rr-combo-great{color:#22c55e;border:1px solid #22c55e;text-shadow:0 0 6px rgba(34,197,94,0.4)}
  .rr-combo-excellent{color:var(--neon-cyan);border:1px solid var(--neon-cyan);text-shadow:0 0 8px rgba(0,229,255,0.4)}
  .rr-combo-perfect{color:var(--gold-record);border:1px solid var(--gold-record);text-shadow:0 0 10px rgba(255,215,0,0.4)}
  .rr-combo-legendary{color:var(--hot-magenta);border:2px solid var(--hot-magenta);font-size:14px;
    text-shadow:0 0 12px rgba(255,20,147,0.5);animation:rr-combo-slam 0.4s cubic-bezier(0.16,1,0.3,1),rr-glow-pulse 1.5s ease-in-out infinite}

  /* Floating score text */
  .rr-float-score{position:absolute;right:12px;top:4px;font-family:'Bebas Neue',sans-serif;
    font-size:18px;color:var(--skull-green);letter-spacing:2px;
    animation:rr-float-up 0.8s ease-out forwards;pointer-events:none;z-index:5;
    text-shadow:0 0 8px rgba(57,255,20,0.4)}
  .rr-float-score-big{font-size:24px;color:var(--gold-record);
    text-shadow:0 0 12px rgba(255,215,0,0.5)}
  .rr-float-score-penalty{color:#ef4444;text-shadow:0 0 8px rgba(239,68,68,0.4)}

  /* Phase transition — "ROUND X" banner */
  .rr-round-banner{text-align:center;padding:16px;margin:10px 0;position:relative;
    background:linear-gradient(90deg,transparent,rgba(45,27,105,0.3),transparent);
    animation:rr-banner-wipe 0.6s ease-out}
  .rr-round-banner-text{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:6px;
    color:var(--neon-cyan);text-shadow:0 0 20px rgba(0,229,255,0.4),0 2px 0 rgba(0,0,0,0.3)}
  .rr-round-banner-sub{font-family:'Rock Salt',cursive;font-size:10px;color:var(--amp-orange);margin-top:4px}

  /* Phase winner banner — fighting game style */
  .rr-winner-banner{text-align:center;padding:16px 20px;margin:12px 0;position:relative;
    background:linear-gradient(90deg,transparent,rgba(255,215,0,0.08),transparent);
    border-top:2px solid var(--gold-record);border-bottom:2px solid var(--gold-record);
    animation:rr-winner-slam 0.5s cubic-bezier(0.16,1,0.3,1)}
  .rr-winner-label{font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--chrome);
    letter-spacing:4px;margin-bottom:4px}
  .rr-winner-name{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:3px;
    text-shadow:0 0 15px currentColor}
  .rr-winner-prize{font-family:'Rock Salt',cursive;font-size:10px;color:var(--amp-orange);margin-top:4px}

  /* Hotel item shatter animation */
  .rr-item-shattering{animation:rr-shatter 0.5s ease-out forwards}
  @keyframes rr-shatter{
    0%{transform:scale(1);opacity:1;filter:brightness(1)}
    20%{transform:scale(1.1);filter:brightness(2)}
    40%{transform:scale(0.9) rotate(5deg);filter:brightness(1.5)}
    100%{transform:scale(0.7) rotate(-3deg);opacity:0.3;filter:brightness(0.5) grayscale(1)}
  }

  /* VS splash screen for tie-breaker */
  .rr-vs-splash{text-align:center;padding:20px;margin:12px 0;position:relative;
    background:radial-gradient(circle at 50% 50%,rgba(255,102,0,0.1) 0%,transparent 60%);
    border:2px solid var(--amp-orange);border-radius:4px}
  .rr-vs-players{display:flex;gap:12px;justify-content:center;align-items:center;margin:12px 0}
  .rr-vs-side{text-align:center;flex:1;max-width:140px}
  .rr-vs-text{font-family:'Bebas Neue',sans-serif;font-size:36px;color:var(--amp-orange);
    text-shadow:0 0 20px rgba(255,102,0,0.5),0 3px 0 rgba(0,0,0,0.3);
    flex:0 0 60px;animation:rr-vs-pulse 0.8s ease-in-out infinite alternate}
  .rr-vs-lightning{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
    width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--neon-cyan),var(--amp-orange),var(--neon-cyan),transparent);
    box-shadow:0 0 10px rgba(0,229,255,0.3);animation:rr-lightning-flash 0.3s ease-out 3 alternate}

  /* ═══ PLAYER CARD ═══ */
  .rr-player-card{display:flex;gap:10px;align-items:center;padding:8px 12px;margin:6px 0;
    background:rgba(45,27,105,0.12);border-radius:4px;border:1px solid rgba(45,27,105,0.25);
    position:relative;overflow:hidden;transition:all 0.2s}
  .rr-player-card:hover{background:rgba(45,27,105,0.2)}
  .rr-player-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;
    background:var(--stage-purple)}
  .rr-player-name{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px}
  .rr-player-detail{font-size:12px;color:rgba(224,224,224,0.6)}
  .rr-player-score{font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--neon-cyan);
    margin-left:auto;text-shadow:0 0 8px rgba(0,229,255,0.3)}

  /* Electrocution effect */
  .rr-electrocuted{border-color:var(--neon-cyan) !important;
    animation:rr-shock 0.4s ease-out;position:relative}
  .rr-electrocuted::after{content:'⚡';position:absolute;top:4px;right:8px;font-size:18px;
    animation:rr-zap 0.3s ease-out}
  .rr-tried-too-hard{border-color:var(--amp-orange) !important}

  /* ═══ RED CARPET — TABLOID MAGAZINE STYLE ═══ */
  .rr-carpet{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#1a1a2e 100%);
    border:3px solid;border-radius:6px;padding:0;margin:8px 0;overflow:hidden;position:relative}
  .rr-carpet-header{display:flex;gap:12px;align-items:center;padding:12px 14px;
    background:linear-gradient(90deg,rgba(0,0,0,0.4),transparent)}
  .rr-carpet-photo{width:60px;height:60px;border-radius:4px;object-fit:contain;
    border:2px solid;flex-shrink:0}
  .rr-carpet-headline{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;
    line-height:1.1}
  .rr-carpet-subtitle{font-family:'Rock Salt',cursive;font-size:9px;margin-top:2px}
  .rr-carpet-stations{display:flex;flex-wrap:wrap;gap:4px;padding:8px 14px}
  .rr-carpet-station{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;
    border-radius:12px;font-size:10px;font-family:'JetBrains Mono',monospace}
  .rr-station-good{background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.3);color:#86efac}
  .rr-station-bad{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#fca5a5}
  .rr-station-skip{background:rgba(255,215,0,0.12);border:1px solid rgba(255,215,0,0.3);color:var(--gold-record)}
  .rr-carpet-best{font-size:10px;padding:2px 6px;position:absolute;top:6px;right:6px;
    font-family:'Rock Salt',cursive;transform:rotate(3deg)}
  .rr-carpet-stats{display:flex;justify-content:space-between;padding:6px 14px 10px;
    font-size:11px;font-family:'JetBrains Mono',monospace;
    background:linear-gradient(90deg,transparent,rgba(0,0,0,0.3),transparent)}
  .rr-station-panels{padding:0 14px}
  .rr-station-panel{animation:rr-card-enter 0.3s ease-out;border-left:2px solid var(--stage-purple);
    padding-left:10px;margin:4px 0}
  .rr-carpet-station:hover{filter:brightness(1.3);transform:scale(1.05)}
  .rr-carpet-station.rr-station-active{outline:2px solid var(--neon-cyan);outline-offset:1px}

  /* ═══ HOTEL ROOM ═══ */
  .rr-room{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:8px 0;padding:10px;
    background:rgba(45,27,105,0.1);border-radius:4px;border:1px solid rgba(45,27,105,0.2)}
  .rr-item{text-align:center;padding:6px;border-radius:3px;font-size:10px;
    border:1px solid rgba(255,255,255,0.1);transition:all 0.3s}
  .rr-item-emoji{font-size:20px;margin-bottom:2px}
  .rr-item-name{font-size:8px;color:var(--chrome);text-transform:uppercase;letter-spacing:0.5px}
  .rr-item-intact{background:rgba(34,197,94,0.08);border-color:rgba(34,197,94,0.2)}
  .rr-item-destroyed{background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.2);
    opacity:0.4;text-decoration:line-through}
  .rr-item-destroyed .rr-item-emoji{filter:grayscale(1)}
  .rr-berserker{border-color:var(--amp-orange) !important;
    box-shadow:0 0 10px rgba(255,102,0,0.2)}
  .rr-rampage{border-color:var(--hot-magenta) !important;
    box-shadow:0 0 15px rgba(255,20,147,0.3);animation:rr-shake 0.3s ease-out}

  /* ═══ CONTROLS ═══ */
  .rr-controls{text-align:center;margin:12px 0;padding:8px 0}
  .rr-btn{font-family:'Bebas Neue',sans-serif;background:var(--stage-purple);color:var(--neon-cyan);
    border:2px solid var(--neon-cyan);padding:8px 24px;cursor:pointer;font-size:16px;
    letter-spacing:3px;border-radius:3px;margin:0 4px;transition:all 0.2s;
    text-shadow:0 0 8px rgba(0,229,255,0.3);box-shadow:0 0 10px rgba(0,229,255,0.1)}
  .rr-btn:hover{background:var(--neon-cyan);color:var(--stage-black);transform:translateY(-2px);
    box-shadow:0 0 20px rgba(0,229,255,0.3)}
  .rr-btn-fire{border-color:var(--amp-orange);color:var(--amp-orange);
    text-shadow:0 0 8px rgba(255,102,0,0.3);box-shadow:0 0 10px rgba(255,102,0,0.1)}
  .rr-btn-fire:hover{background:var(--amp-orange);color:var(--stage-black)}

  /* ═══ CINEMATIC REVEALS ═══ */
  .rr-step-hidden{opacity:0;transform:translateY(14px);max-height:0;overflow:hidden;margin:0;padding:0}
  .rr-step-revealing{animation:rr-card-enter 0.5s cubic-bezier(0.16,1,0.3,1) forwards;max-height:2000px}
  .rr-step-visible{opacity:1;transform:none;max-height:none}
  @keyframes rr-card-enter{
    0%{opacity:0;transform:translateY(16px) scale(0.97);filter:blur(2px)}
    60%{opacity:1;filter:blur(0)}
    100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}
  }

  /* ═══ ANIMATIONS ═══ */
  @keyframes rr-spotlight-sweep{0%{background-position:0% 0%}100%{background-position:100% 0%}}
  @keyframes rr-eq-bounce{0%{height:var(--eq-min,8px)}100%{height:var(--eq-max,60px)}}
  @keyframes rr-note-burst{0%{box-shadow:0 0 20px rgba(57,255,20,0.9);transform:scale(1.3)}100%{box-shadow:0 0 8px rgba(57,255,20,0.5);transform:scale(1)}}
  @keyframes rr-note-miss-x{0%{transform:rotate(0) scale(1.2)}100%{transform:rotate(-10deg) scale(1)}}
  @keyframes rr-combo-slam{0%{transform:scale(2.5) rotate(-5deg);opacity:0}50%{transform:scale(0.9) rotate(1deg)}100%{transform:scale(1) rotate(-2deg);opacity:1}}
  @keyframes rr-float-up{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-30px)}}
  @keyframes rr-banner-wipe{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}
  @keyframes rr-winner-slam{0%{transform:scaleY(0);opacity:0}40%{transform:scaleY(1.05)}100%{transform:scaleY(1);opacity:1}}
  @keyframes rr-vs-pulse{0%{transform:scale(1);text-shadow:0 0 20px rgba(255,102,0,0.5)}100%{transform:scale(1.1);text-shadow:0 0 30px rgba(255,102,0,0.8)}}
  @keyframes rr-lightning-flash{0%{opacity:0;height:2px}50%{opacity:1;height:3px}100%{opacity:0;height:1px}}
  @keyframes rr-meter-flash-green{0%{box-shadow:0 0 15px rgba(34,197,94,0.6)}100%{box-shadow:none}}
  @keyframes rr-meter-flash-red{0%{box-shadow:0 0 15px rgba(239,68,68,0.6)}100%{box-shadow:none}}
  @keyframes rr-fire-pulse{0%,100%{text-shadow:0 0 8px rgba(255,102,0,0.3)}50%{text-shadow:0 0 16px rgba(255,102,0,0.6)}}
  @keyframes rr-shock{0%{transform:translateX(-3px)}25%{transform:translateX(3px)}50%{transform:translateX(-2px)}75%{transform:translateX(2px)}100%{transform:translateX(0)}}
  @keyframes rr-zap{0%{opacity:1;transform:scale(1.5)}100%{opacity:0;transform:scale(0.5)}}
  @keyframes rr-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px) rotate(-1deg)}75%{transform:translateX(2px) rotate(1deg)}}
  @keyframes rr-glow-pulse{0%,100%{box-shadow:0 0 4px rgba(255,215,0,0.2)}50%{box-shadow:0 0 12px rgba(255,215,0,0.5)}}
  @keyframes rr-stamp-slam{0%{transform:rotate(-5deg) scale(2.5);opacity:0}50%{transform:rotate(-5deg) scale(0.9)}100%{transform:rotate(-5deg) scale(1);opacity:1}}

  @media(prefers-reduced-motion:reduce){
    .rr-shell,.rr-shell *{animation:none!important;transition:none!important}
    .rr-step-hidden{opacity:1;transform:none;max-height:none}
  }

  /* ═══ COVER ═══ */
  .rr-cover{text-align:center;padding:40px 20px;position:relative;z-index:1}
  .rr-cover-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px}
  .rr-cover-player{position:relative}
  .rr-cover-player img{width:44px;height:44px;object-fit:contain;border-radius:4px;
    border:2px solid var(--stage-purple);filter:contrast(1.1) saturate(1.2)}

  /* ═══ PHASE BACKGROUNDS ═══ */
  .rr-phase-guitar .rr-main{background:radial-gradient(ellipse at 50% 20%,rgba(45,27,105,0.3) 0%,transparent 60%)}
  .rr-phase-carpet .rr-main{background:radial-gradient(ellipse at 50% 80%,rgba(180,0,0,0.1) 0%,transparent 60%)}
  .rr-phase-hotel .rr-main{background:radial-gradient(ellipse at 50% 50%,rgba(255,102,0,0.08) 0%,transparent 60%)}
  </style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _buildEQ() {
  const bars = [];
  for (let i = 0; i < 60; i++) {
    const dur = (0.3 + Math.random() * 0.9).toFixed(2);
    const center = Math.abs(i - 30) / 30;
    const minH = (5 + Math.random() * 10).toFixed(0);
    const maxH = (30 + (1 - center) * 50 + Math.random() * 30).toFixed(0);
    const delay = (Math.random() * -2).toFixed(2);
    bars.push(`<div class="rr-eq-bar" style="--eq-dur:${dur}s;--eq-min:${minH}px;--eq-max:${maxH}px;animation-delay:${delay}s"></div>`);
  }
  return `<div class="rr-eq">${bars.join('')}</div>`;
}

function _rrShell(content, ep, phase = '', meterPhase = 0) {
  const meter = meterPhase > 0 ? _buildMeter(ep, meterPhase) : '';
  const phaseCls = phase ? ` rr-phase-${phase}` : '';
  const eq = _buildEQ();
  if (meterPhase > 0) {
    window._rrMeterEp = { rockNRule: ep.rockNRule };
    window._rrMeterPhase = meterPhase;
  }
  if (meter) {
    return css() + `<div class="rr-shell${phaseCls}">${eq}<div class="rr-layout"><div class="rr-main">${content}</div>${meter}</div></div>`;
  }
  return css() + `<div class="rr-shell${phaseCls}">${eq}<div class="rr-main" style="max-height:none">${content}</div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — ROCK METER SIDEBAR
// ══════════════════════════════════════════════════════════════
function _buildMeter(ep, phase) {
  const rr = ep.rockNRule;
  if (!rr) return '';
  const active = rr.phase1.performances.map(p => p.name);

  // Get current reveal index for the active phase
  const stateKey = phase === 1 ? 'rr-guitar' : phase === 2 ? 'rr-carpet' : 'rr-hotel';
  const revIdx = window._tvState?.[stateKey]?.idx ?? -1;

  // Calculate scores only for revealed steps
  const scores = {};
  active.forEach(n => { scores[n] = 0; });

  if (phase === 1) {
    const revealed = rr.phase1.performances.slice(0, Math.max(0, revIdx));
    revealed.forEach(p => { scores[p.name] += p.score; });
  } else if (phase === 2) {
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    const revealed = rr.phase2.runs.slice(0, Math.max(0, revIdx));
    revealed.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
  } else if (phase === 3) {
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    rr.phase2.runs.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
    const roundsRevealed = Math.max(0, Math.floor((revIdx - 1) / 2));
    for (let i = 0; i < Math.min(roundsRevealed, rr.phase3.rounds.length); i++) {
      for (const r of rr.phase3.rounds[i]) {
        scores[r.name] = (scores[r.name] || 0) + (r.points || 0);
      }
    }
  } else {
    // Phase 4 — final results, all scores included
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    rr.phase2.runs.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
    for (const round of rr.phase3.rounds) {
      for (const r of round) { scores[r.name] = (scores[r.name] || 0) + (r.points || 0); }
    }
  }

  const maxScore = Math.max(1, ...Object.values(scores));

  // Gate badges by reveal progress
  const showGuitar = phase > 1 || (phase === 1 && revIdx >= rr.phase1.performances.length);
  const showPhoto = phase > 2 || (phase === 2 && revIdx >= rr.phase2.runs.length);
  const showDestroy = phase >= 4 || (phase === 3 && revIdx >= (rr.phase3.rounds.length * 2 + 1));

  const bars = active.map(name => {
    const score = scores[name] || 0;
    const pct = maxScore > 0 ? Math.max(5, (score / maxScore) * 100) : 5;
    const color = pct > 60 ? 'green' : pct > 30 ? 'yellow' : 'red';
    let badges = '';
    if (showGuitar && rr.titles.bestGuitar === name) badges += '<div class="rr-badge rr-badge-guitar">🎸 GUITAR</div>';
    if (showPhoto && rr.titles.mostPhotogenic === name) badges += '<div class="rr-badge rr-badge-photo">📸 PHOTO</div>';
    if (showDestroy && rr.titles.mostDestructive === name) badges += '<div class="rr-badge rr-badge-destroy">💥 DESTROY</div>';
    if (showDestroy && rr.titles.rockGod === name) badges += '<div class="rr-badge rr-badge-rockgod">🤘 ROCK GOD</div>';

    return { name, score, pct, color, badges };
  });

  // Sort by score descending for leaderboard
  const sorted = bars.sort((a, b) => b.score - a.score);

  const rows = sorted.map((p, idx) =>
    `<div class="rr-meter-player">
      <div class="rr-meter-rank">${idx + 1}</div>
      <img class="rr-meter-img" src="assets/avatars/${slug(p.name)}.png" alt="${p.name}" onerror="this.style.display='none'">
      <div class="rr-meter-info">
        <div class="rr-meter-name">${p.name}</div>
        <div class="rr-meter-bar-wrap"><div class="rr-meter-fill rr-meter-fill-${p.color}" style="width:${p.pct}%"></div></div>
        ${p.badges ? `<div class="rr-meter-badges">${p.badges}</div>` : ''}
      </div>
      <div class="rr-meter-score">${p.score.toFixed(0)}</div>
    </div>`
  ).join('');

  const phaseLabels = { 1: 'GUITAR HERO', 2: 'RED CARPET', 3: 'HOTEL TRASHING', 4: 'FINAL RESULTS' };

  return `<div class="rr-meter-col"><div class="rr-meter" id="rr-live-meter" data-phase="${phase}">
    <div class="rr-meter-title">🤘 ROCK METER</div>
    <div style="font-family:'Rock Salt',cursive;font-size:8px;color:var(--amp-orange);text-align:center;margin-bottom:4px">${phaseLabels[phase] || ''}</div>
    <div class="rr-meter-list">${rows}</div>
  </div></div>`;
}

// ══════════════════════════════════════════════════════════════
// VP — TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildRockNRuleTitleCard(ep) {
  const rr = ep.rockNRule;
  if (!rr) return '';

  const allPlayers = rr.phase1.performances.map(p => p.name);
  const roster = allPlayers.map(name =>
    `<div class="rr-cover-player">
      <img src="assets/avatars/${slug(name)}.png" alt="${name}" onerror="this.style.display='none'">
    </div>`
  ).join('');

  return _rrShell(`
    <div class="rr-cover">
      <div class="rr-subtitle">TOTAL DRAMA ACTION PRESENTS</div>
      <div style="font-size:48px;margin:8px 0;filter:drop-shadow(0 0 12px rgba(0,229,255,0.4))">🤘</div>
      <div class="rr-title">ROCK N' RULE</div>
      <div class="rr-subtitle" style="color:var(--hot-magenta)">A ${host().toUpperCase()} PRODUCTION</div>
      <div style="margin:16px auto;width:60%;height:1px;background:linear-gradient(90deg,transparent,var(--neon-cyan),var(--hot-magenta),transparent)"></div>
      <div style="font-size:12px;color:rgba(224,224,224,0.5);letter-spacing:3px;font-family:'JetBrains Mono',monospace">
        GUITAR HERO &middot; RED CARPET &middot; HOTEL TRASHING
      </div>
      <div style="margin-top:10px;font-family:'Rock Salt',cursive;font-size:14px;color:rgba(224,224,224,0.7)">
        "Rock and roll is about FEELING, not gymnastics!"
      </div>
      <div class="rr-cover-roster">${roster}</div>
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 1: GUITAR HERO
// ══════════════════════════════════════════════════════════════
export function rpBuildRockNRuleGuitar(ep) {
  const rr = ep.rockNRule;
  if (!rr) return '';
  const stateKey = 'rr-guitar';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  const noteColors = ['rr-note-green', 'rr-note-red', 'rr-note-yellow', 'rr-note-blue', 'rr-note-orange'];

  for (const perf of rr.phase1.performances) {
    // Build note track
    const notes = [];
    for (let i = 0; i < 10; i++) {
      const isHit = i < perf.noteHits;
      const color = noteColors[i % 5];
      notes.push(`<div class="rr-note ${color} ${isHit ? 'rr-note-hit' : 'rr-note-miss'}">${isHit ? '✓' : '✗'}</div>`);
    }
    const streakText = perf.noteHits >= 8 ? `<span class="rr-streak rr-streak-fire">🔥 ${perf.noteHits}x STREAK</span>` :
      perf.noteHits >= 5 ? `<span class="rr-streak">${perf.noteHits}x</span>` : '';

    // Combo badge based on performance
    const comboCls = perf.score >= 14 ? 'rr-combo-legendary' : perf.score >= 10 ? 'rr-combo-perfect' : perf.score >= 7 ? 'rr-combo-excellent' : perf.score >= 5 ? 'rr-combo-great' : '';
    const comboLabel = perf.score >= 14 ? 'LEGENDARY' : perf.score >= 10 ? 'PERFECT' : perf.score >= 7 ? 'EXCELLENT' : perf.score >= 5 ? 'GREAT' : '';
    const comboHtml = comboLabel ? `<span class="rr-combo ${comboCls}">${comboLabel}</span>` : '';

    // Rock meter needle angle: -90 (bad) to +90 (great), mapped from score 0-16
    const needleAngle = Math.round((perf.score / 16) * 180 - 90);

    const cardClass = perf.electrocuted ? 'rr-electrocuted' : perf.triedTooHard ? 'rr-tried-too-hard' : '';
    const styleBadge = perf.goesFlashy ? '<span style="font-size:9px;padding:1px 6px;border:1px solid var(--hot-magenta);color:var(--hot-magenta);border-radius:2px;font-family:\'Rock Salt\',cursive">FLASHY</span>' :
      '<span style="font-size:9px;padding:1px 6px;border:1px solid var(--chrome);color:var(--chrome);border-radius:2px;font-family:\'Rock Salt\',cursive">SAFE</span>';

    // Floating score
    const floatCls = perf.score >= 10 ? 'rr-float-score-big' : perf.electrocuted ? 'rr-float-score-penalty' : '';

    steps.push(`<div class="rr-player-card ${cardClass}">
      <div class="rr-float-score ${floatCls}">+${perf.score}</div>
      ${portrait(perf.name, 36)}
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="rr-player-name">${perf.name}</div>
          ${styleBadge}${comboHtml}
        </div>
        <div class="rr-note-track">${notes.join('')}${streakText}</div>
        <div class="rr-player-detail">${perf.text}</div>
        ${perf.archetypeText && !perf.electrocuted ? `<div class="rr-player-detail" style="color:var(--amp-orange)">${perf.archetypeText}</div>` : ''}
        ${perf.electrocutionText ? `<div class="rr-narration" style="border-color:var(--neon-cyan);color:var(--neon-cyan)">${perf.electrocutionText}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div class="rr-rock-meter">
          <div class="rr-rock-meter-bg"></div>
          <div class="rr-rock-meter-needle" style="--needle:${needleAngle}deg"></div>
          <div class="rr-rock-meter-center"></div>
        </div>
        <div class="rr-player-score">${perf.score}</div>
      </div>
    </div>`);
  }

  // Phase 1 winner — fighting game banner
  steps.push(`<div class="rr-winner-banner" style="border-color:var(--stage-purple)">
    <div class="rr-winner-label">PHASE 1 WINNER</div>
    ${portrait(rr.phase1.winner, 48)}
    <div class="rr-winner-name" style="color:var(--neon-cyan)">${rr.phase1.winner}</div>
    <div class="rr-winner-prize">🎫 Backstage Pass earned!</div>
  </div>`);

  // Social events
  for (const evt of rr.phase1.events) {
    steps.push(`<div class="rr-narration" style="border-color:var(--hot-magenta)">
      <span style="font-size:16px;margin-right:4px">${evt.type === 'shockBuddies' ? '⚡' : evt.type === 'divaTantrum' ? '👑' : evt.type === 'trashTalk' ? '🎤' : evt.type === 'underdogRally' ? '💪' : evt.type === 'rockstarAlliance' ? '🤝' : evt.type === 'meltdown' ? '😭' : '🎵'}</span>
      ${evt.text}
    </div>`);
  }

  const totalSteps = steps.length;
  let html = `<div class="rr-phase-title">🎸 PHASE 1: GUITAR HERO</div><div class="rr-phase-badge">PLAY OR BE PLAYED</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="rr-step-guitar-${i}" class="${i > revIdx ? 'rr-step-hidden' : 'rr-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="rr-controls-guitar" class="rr-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="rr-btn" onclick="rockNRuleRevealNext('rr-guitar',${totalSteps})">🎸 NEXT</button>
    <button class="rr-btn rr-btn-fire" onclick="rockNRuleRevealAll('rr-guitar',${totalSteps})">REVEAL ALL</button>
  </div>`;
  html += `<div id="rr-done-guitar" class="rr-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--neon-cyan);letter-spacing:4px">SET COMPLETE</div>
  </div>`;

  return _rrShell(html, ep, 'guitar', 1);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 2: RED CARPET
// ══════════════════════════════════════════════════════════════
export function rpBuildRockNRuleCarpet(ep) {
  const rr = ep.rockNRule;
  if (!rr) return '';
  const stateKey = 'rr-carpet';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  for (const run of rr.phase2.runs) {
    const photoColor = run.photoResult.color;
    const photoScore = parseFloat(run.photoScore);

    // Station pills — clickable to show narration
    const runId = `rr-carpet-${run.name.replace(/\s+/g, '-').toLowerCase()}`;
    let stationPills = '';
    let stationPanels = '';
    let stIdx = 0;
    for (const st of run.stations) {
      if (st.type === 'skip') {
        stationPills += `<div class="rr-carpet-station rr-station-skip" onclick="rrToggleStation('${runId}','skip')" style="cursor:pointer">🎫 SKIP ×3</div>`;
        stationPanels += `<div class="rr-station-panel" id="${runId}-skip" style="display:none">
          <div style="padding:6px 0;font-size:12px;color:var(--gold-record);line-height:1.5">${st.text}</div></div>`;
        continue;
      }
      const cls = st.isGood ? 'rr-station-good' : 'rr-station-bad';
      const icon = st.isGood ? '✨' : '💥';
      const sid = `s${stIdx}`;
      stationPills += `<div class="rr-carpet-station ${cls}" onclick="rrToggleStation('${runId}','${sid}')" style="cursor:pointer" title="Click to read">${st.hazard.icon} ${icon}</div>`;
      stationPanels += `<div class="rr-station-panel" id="${runId}-${sid}" style="display:none">
        <div style="padding:6px 0;font-size:12px;color:#ccc;line-height:1.5">
          <span style="color:${st.isGood ? 'var(--skull-green)' : '#ef4444'};font-family:'Bebas Neue',sans-serif;letter-spacing:1px">${st.hazard.name}</span>
          — ${st.text}
        </div></div>`;
      stIdx++;
    }

    steps.push(`<div class="rr-carpet" style="border-color:${photoColor}">
      <div class="rr-carpet-header">
        <img class="rr-carpet-photo" src="assets/avatars/${slug(run.name)}.png" alt="${run.name}"
          style="border-color:${photoColor}" onerror="this.style.display='none'">
        <div style="flex:1">
          <div class="rr-carpet-headline" style="color:${photoColor}">${run.photoResult.label}</div>
          <div style="font-family:'Bebas Neue',sans-serif;font-size:15px;letter-spacing:1px;color:#e0e0e0">${run.name} ${run.isVIP ? '<span style="font-size:10px;color:var(--gold-record)">🎫 VIP</span>' : ''}</div>
          <div class="rr-carpet-subtitle" style="color:rgba(224,224,224,0.5)">${run.photoResult.desc}</div>
        </div>
      </div>
      <div class="rr-carpet-stations">${stationPills}</div>
      <div class="rr-station-panels" id="${runId}-panels">${stationPanels}</div>
      <div class="rr-carpet-stats">
        <span>✨ Style: <span style="color:var(--skull-green)">${run.totalStyle}</span></span>
        <span>💥 Damage: <span style="color:#ef4444">${run.totalDamage}</span></span>
        <span>📸 Photo: <span style="color:${photoColor}">${run.photoScore}</span></span>
      </div>
    </div>`);
  }

  // Phase 2 winner — fighting game banner
  steps.push(`<div class="rr-winner-banner" style="border-color:var(--hot-magenta)">
    <div class="rr-winner-label">PHASE 2 WINNER</div>
    ${portrait(rr.phase2.winner, 48)}
    <div class="rr-winner-name" style="color:var(--hot-magenta)">${rr.phase2.winner}</div>
    <div class="rr-winner-prize">🎫 VIP Access earned!</div>
  </div>`);

  // Social events
  for (const evt of rr.phase2.events) {
    steps.push(`<div class="rr-narration" style="border-color:var(--hot-magenta)">
      <span style="font-size:16px;margin-right:4px">${evt.type === 'jealousy' ? '😤' : '🎵'}</span> ${evt.text}
    </div>`);
  }

  const totalSteps = steps.length;
  let html = `<div class="rr-phase-title">📸 PHASE 2: RED CARPET</div><div class="rr-phase-badge">STYLE OVER SPEED</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="rr-step-carpet-${i}" class="${i > revIdx ? 'rr-step-hidden' : 'rr-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="rr-controls-carpet" class="rr-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="rr-btn" onclick="rockNRuleRevealNext('rr-carpet',${totalSteps})">📸 NEXT</button>
    <button class="rr-btn rr-btn-fire" onclick="rockNRuleRevealAll('rr-carpet',${totalSteps})">REVEAL ALL</button>
  </div>`;
  html += `<div id="rr-done-carpet" class="rr-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--hot-magenta);letter-spacing:4px">CARPET CLEARED</div>
  </div>`;

  return _rrShell(html, ep, 'carpet', 2);
}

// ══════════════════════════════════════════════════════════════
// VP — PHASE 3: HOTEL TRASHING
// ══════════════════════════════════════════════════════════════
export function rpBuildRockNRuleHotel(ep) {
  const rr = ep.rockNRule;
  if (!rr) return '';
  const stateKey = 'rr-hotel';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];

  // Room inventory — starts all intact, updates live as rounds are revealed
  const inventoryHtml = rr.phase3.inventory.map(item => {
    return `<div class="rr-item rr-item-intact" data-item-id="${item.id}">
      <div class="rr-item-emoji">${item.emoji}</div>
      <div class="rr-item-name">${item.name}</div>
      <div style="font-size:9px;color:var(--chrome)">${item.points}pts</div>
    </div>`;
  }).join('');
  steps.push(`<div>
    <div style="font-family:'Rock Salt',cursive;font-size:10px;color:var(--amp-orange);margin-bottom:4px;text-align:center">ROOM INVENTORY</div>
    <div class="rr-room" id="rr-room-grid">${inventoryHtml}</div>
  </div>`);

  // Rounds
  for (let i = 0; i < rr.phase3.rounds.length; i++) {
    const round = rr.phase3.rounds[i];
    const isVIP = i === 0 && rr.phase3.vipHolder;
    const roundNum = rr.phase3.vipHolder ? i : i + 1;
    const label = isVIP ? '🎫 VIP EARLY ACCESS' : `ROUND ${roundNum}`;

    const roundHtml = round.map(r => {
      const actionClass = r.action === 'rampage' ? 'rr-rampage' : r.action?.includes('berserker') ? 'rr-berserker' : '';
      const actionIcon = r.action === 'rampage' ? '🔥' : r.action === 'berserker-success' ? '💥' : r.action === 'berserker-fail' ? '😵' : r.action === 'pennies' ? '🪙' : r.action === 'methodical' ? '🔨' : r.action === 'nothing-left' ? '🏜️' : '🎸';
      const floatCls = r.points >= 10 ? 'rr-float-score-big' : r.points === 0 ? 'rr-float-score-penalty' : '';
      return `<div class="rr-player-card ${actionClass}">
        <div class="rr-float-score ${floatCls}">+${r.points}</div>
        ${portrait(r.name, 32)}
        <div style="flex:1">
          <div class="rr-player-name">${actionIcon} ${r.name} ${r.target ? `→ ${r.emoji || ''} ${r.target}` : ''}</div>
          <div class="rr-player-detail">${r.text}</div>
        </div>
        <div class="rr-player-score" style="font-size:16px;color:${r.points > 5 ? 'var(--amp-orange)' : r.points > 0 ? 'var(--neon-cyan)' : '#666'}">+${r.points}</div>
      </div>`;
    }).join('');

    // Round banner with fighting game wipe
    steps.push(`<div class="rr-round-banner">
      <div class="rr-round-banner-text">${label}</div>
      <div class="rr-round-banner-sub">${isVIP ? 'FIRST PICK — PRISTINE ROOM' : roundNum === 1 ? 'READY... SMASH!' : roundNum === 2 ? 'KEEP GOING!' : 'FINAL ROUND!'}</div>
    </div>`);
    steps.push(`<div>${roundHtml}</div>`);
  }

  // Phase 3 winner — fighting game banner
  steps.push(`<div class="rr-winner-banner" style="border-color:#ef4444">
    <div class="rr-winner-label">PHASE 3 WINNER</div>
    ${portrait(rr.phase3.winner, 48)}
    <div class="rr-winner-name" style="color:#ef4444">${rr.phase3.winner}</div>
    <div class="rr-winner-prize">💥 MOST DESTRUCTIVE</div>
  </div>`);

  // Social events
  for (const evt of rr.phase3.events) {
    steps.push(`<div class="rr-narration" style="border-color:var(--amp-orange)">
      <span style="font-size:16px;margin-right:4px">🤝</span> ${evt.text}
    </div>`);
  }

  const totalSteps = steps.length;
  let html = `<div class="rr-phase-title">💥 PHASE 3: HOTEL TRASHING</div><div class="rr-phase-badge">DESTROY EVERYTHING</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="rr-step-hotel-${i}" class="${i > revIdx ? 'rr-step-hidden' : 'rr-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="rr-controls-hotel" class="rr-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="rr-btn" onclick="rockNRuleRevealNext('rr-hotel',${totalSteps})">💥 SMASH</button>
    <button class="rr-btn rr-btn-fire" onclick="rockNRuleRevealAll('rr-hotel',${totalSteps})">DESTROY ALL</button>
  </div>`;
  html += `<div id="rr-done-hotel" class="rr-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--amp-orange);letter-spacing:4px">ROOM DEMOLISHED</div>
  </div>`;

  return _rrShell(html, ep, 'hotel', 3);
}

// ══════════════════════════════════════════════════════════════
// VP — RESULTS / IMMUNITY
// ══════════════════════════════════════════════════════════════
export function rpBuildRockNRuleResults(ep) {
  const rr = ep.rockNRule;
  if (!rr) return '';
  const stateKey = 'rr-results';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  const steps = [];
  const active = rr.phase1.performances.map(p => p.name);

  // Final scoreboard — use raw phase scores, not ep.chalMemberScores (which includes immunity bonus)
  const rawScores = {};
  active.forEach(n => { rawScores[n] = 0; });
  rr.phase1.performances.forEach(p => { rawScores[p.name] += p.score; });
  rr.phase2.runs.forEach(r => { rawScores[r.name] += parseFloat(r.photoScore); });
  for (const round of rr.phase3.rounds) {
    for (const r of round) { rawScores[r.name] = (rawScores[r.name] || 0) + (r.points || 0); }
  }
  const sorted = [...active].sort((a, b) => (rawScores[b] || 0) - (rawScores[a] || 0));
  const scoreHtml = sorted.map((name, idx) => {
    const score = rawScores[name] || 0;
    const titles = [];
    if (rr.titles.bestGuitar === name) titles.push('🎸');
    if (rr.titles.mostPhotogenic === name) titles.push('📸');
    if (rr.titles.mostDestructive === name) titles.push('💥');
    if (rr.titles.rockGod === name) titles.push('🤘');

    return `<div class="rr-player-card" style="${idx === 0 ? 'border-color:var(--gold-record);box-shadow:0 0 12px rgba(255,215,0,0.15)' : ''}">
      ${portrait(name, 36)}
      <div style="flex:1">
        <div class="rr-player-name">${idx + 1}. ${name} ${titles.join(' ')}</div>
      </div>
      <div class="rr-player-score">${score.toFixed(0)}</div>
    </div>`;
  }).join('');
  steps.push(`<div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:14px;color:var(--neon-cyan);letter-spacing:2px;margin-bottom:4px">FINAL SCORES</div>
    ${scoreHtml}
  </div>`);

  // Rock God narration
  if (rr.titles.rockGod) {
    const god = rr.titles.rockGod;
    const gPr = pronouns(god);
    steps.push(`<div class="rr-winner-banner" style="border-color:var(--gold-record);background:linear-gradient(90deg,transparent,rgba(255,215,0,0.08),transparent)">
      <div style="font-size:32px;margin-bottom:4px">🤘</div>
      <div class="rr-winner-name" style="color:var(--gold-record);font-size:28px">ROCK GOD</div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:18px;color:var(--neon-cyan);letter-spacing:2px;margin:4px 0">${god}</div>
      <div class="rr-narration" style="border-color:var(--gold-record);text-align:center;color:var(--gold-record)">
        ${pick([
          `${god} won ALL THREE phases. Best Guitar. Most Photogenic. Most Destructive. ${host()} has never seen anything like it. The crowd is on their feet. The other castmates are speechless. This is what a Rock God looks like.`,
          `Guitar? Dominated. Red carpet? Owned. Hotel room? Annihilated. ${god} swept every single phase. ${host()}: "In all my years of hosting... actually, this has never happened before." ${god} takes a bow. The stage lights explode.`,
          `They called it impossible. Three phases, three winners, one name: ${god}. ${gPr.Sub} played the guitar like a legend, walked the carpet like a star, and destroyed the room like a force of nature. There is no higher honor in rock and roll.`,
        ])}
      </div>
    </div>`);
  }

  // Showdown — VS splash screen with lightning
  if (rr.showdown) {
    steps.push(`<div class="rr-vs-splash">
      <div class="rr-phase-title" style="color:var(--amp-orange);font-size:24px">⚡ TIE-BREAKER ENCORE ⚡</div>
      <div class="rr-narration" style="border-color:var(--amp-orange);text-align:center">${rr.showdown.text}</div>
      <div class="rr-vs-players">
        <div class="rr-vs-side">
          ${portrait(rr.showdown.players[0], 56)}
          <div class="rr-player-name" style="margin-top:6px">${rr.showdown.players[0]}</div>
        </div>
        <div class="rr-vs-text">VS</div>
        <div class="rr-vs-side">
          ${portrait(rr.showdown.players[1], 56)}
          <div class="rr-player-name" style="margin-top:6px">${rr.showdown.players[1]}</div>
        </div>
      </div>
      <div class="rr-vs-lightning"></div>
      <div class="rr-winner-banner" style="border-color:var(--gold-record);margin-top:12px">
        <div class="rr-winner-name" style="color:var(--gold-record)">${rr.showdown.winner} WINS THE ENCORE!</div>
      </div>
    </div>`);
  }

  // Immunity
  steps.push(`<div style="text-align:center;padding:20px;background:linear-gradient(135deg,rgba(45,27,105,0.3),rgba(255,20,147,0.1));border:2px solid var(--gold-record);border-radius:4px;margin:8px 0">
    ${portrait(rr.immunityWinner, 64)}
    <div class="rr-title" style="font-size:28px;margin-top:8px">IMMUNITY</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--gold-record);letter-spacing:2px;margin-top:4px">${rr.immunityWinner}</div>
    <div style="font-family:'Rock Salt',cursive;font-size:11px;color:var(--amp-orange);margin-top:6px">
      ${rr.titles.rockGod ? 'THE ROCK GOD IS UNTOUCHABLE' : rr.showdown ? 'Won in the encore showdown!' : 'The crowd goes wild!'}
    </div>
  </div>`);

  const totalSteps = steps.length;
  let html = `<div class="rr-phase-title">🏆 THE RESULTS</div><div class="rr-phase-badge">WHO ROCKS HARDEST?</div>`;
  for (let i = 0; i < totalSteps; i++) {
    html += `<div id="rr-step-results-${i}" class="${i > revIdx ? 'rr-step-hidden' : 'rr-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">${steps[i]}</div>`;
  }
  html += `<div id="rr-controls-results" class="rr-controls" ${revIdx >= totalSteps - 1 ? 'style="display:none"' : ''}>
    <button class="rr-btn" onclick="rockNRuleRevealNext('rr-results',${totalSteps})">🤘 REVEAL</button>
    <button class="rr-btn rr-btn-fire" onclick="rockNRuleRevealAll('rr-results',${totalSteps})">SHOW ALL</button>
  </div>`;
  html += `<div id="rr-done-results" class="rr-controls" style="${revIdx < totalSteps - 1 ? 'display:none' : ''}">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:var(--gold-record);letter-spacing:4px">SHOW'S OVER</div>
  </div>`;

  return _rrShell(html, ep, '', 4);
}

// ══════════════════════════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
export function rrToggleStation(runId, stationId) {
  const panel = document.getElementById(`${runId}-${stationId}`);
  if (!panel) return;
  const isVisible = panel.style.display !== 'none';
  // Close all panels in this run first
  const container = panel.parentElement;
  if (container) container.querySelectorAll('.rr-station-panel').forEach(p => { p.style.display = 'none'; });
  // Toggle all active highlights off
  const carpet = container?.closest('.rr-carpet');
  if (carpet) carpet.querySelectorAll('.rr-station-active').forEach(s => s.classList.remove('rr-station-active'));
  // Open this one if it was closed
  if (!isVisible) {
    panel.style.display = '';
    // Highlight the clicked pill
    const pills = carpet?.querySelectorAll('.rr-carpet-station');
    if (pills) {
      const idx = stationId === 'skip' ? 0 : parseInt(stationId.replace('s', '')) + (carpet?.querySelector('.rr-station-skip') ? 1 : 0);
      if (pills[idx]) pills[idx].classList.add('rr-station-active');
    }
  }
}

export function rockNRuleRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('rr-', '');
  const el = document.getElementById(`rr-step-${suffix}-${state.idx}`);
  if (el) {
    el.classList.remove('rr-step-hidden');
    el.classList.add('rr-step-revealing');
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.classList.remove('rr-step-revealing'); el.classList.add('rr-step-visible'); }, 550);
  }
  // Live-update the rock meter + room inventory
  _rrUpdateMeter(state.idx);
  _rrUpdateRoom(state.idx);
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`rr-controls-${suffix}`);
    const done = document.getElementById(`rr-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) { done.style.display = ''; done.classList.add('rr-step-revealing'); setTimeout(() => done.classList.remove('rr-step-revealing'), 550); }
  }
}

function _rrUpdateMeter(revIdx) {
  const meterCol = document.querySelector('.rr-meter-col');
  if (!meterCol || !window._rrMeterEp) return;
  const meterEl = document.getElementById('rr-live-meter');
  const phase = meterEl ? parseInt(meterEl.dataset.phase) || 1 : 1;
  const rr = window._rrMeterEp.rockNRule;
  if (!rr) return;
  const active = rr.phase1.performances.map(p => p.name);

  // Calculate scores only for revealed steps
  const scores = {};
  active.forEach(n => { scores[n] = 0; });

  if (phase === 1) {
    // Each step = one player performance, revealed up to revIdx
    const revealed = rr.phase1.performances.slice(0, Math.max(0, revIdx));
    revealed.forEach(p => { scores[p.name] += p.score; });
  } else if (phase === 2) {
    // Phase 1 scores always included
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    const revealed = rr.phase2.runs.slice(0, Math.max(0, revIdx));
    revealed.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
  } else if (phase === 3) {
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    rr.phase2.runs.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
    const roundsRevealed = Math.max(0, Math.floor((revIdx - 1) / 2));
    for (let i = 0; i < Math.min(roundsRevealed, rr.phase3.rounds.length); i++) {
      for (const r of rr.phase3.rounds[i]) {
        scores[r.name] = (scores[r.name] || 0) + (r.points || 0);
      }
    }
  } else {
    // Phase 4 — final results
    rr.phase1.performances.forEach(p => { scores[p.name] += p.score; });
    rr.phase2.runs.forEach(r => { scores[r.name] += parseFloat(r.photoScore); });
    for (const round of rr.phase3.rounds) {
      for (const r of round) { scores[r.name] = (scores[r.name] || 0) + (r.points || 0); }
    }
  }

  const maxScore = Math.max(1, ...Object.values(scores));
  const phaseLabels = { 1: 'GUITAR HERO', 2: 'RED CARPET', 3: 'HOTEL TRASHING', 4: 'FINAL RESULTS' };

  // Determine which titles to show based on phase
  const showGuitar = phase > 1 || (phase === 1 && revIdx >= rr.phase1.performances.length);
  const showPhoto = phase > 2 || (phase === 2 && revIdx >= rr.phase2.runs.length);
  const showDestroy = phase >= 4 || (phase === 3 && revIdx >= (rr.phase3.rounds.length * 2 + 1));

  const playerData = active.map(name => {
    const score = scores[name] || 0;
    const pct = maxScore > 0 ? Math.max(5, (score / maxScore) * 100) : 5;
    const color = pct > 60 ? 'green' : pct > 30 ? 'yellow' : 'red';
    let badges = '';
    if (showGuitar && rr.titles.bestGuitar === name) badges += '<div class="rr-badge rr-badge-guitar">🎸 GUITAR</div>';
    if (showPhoto && rr.titles.mostPhotogenic === name) badges += '<div class="rr-badge rr-badge-photo">📸 PHOTO</div>';
    if (showDestroy && rr.titles.mostDestructive === name) badges += '<div class="rr-badge rr-badge-destroy">💥 DESTROY</div>';
    if (showDestroy && rr.titles.rockGod === name) badges += '<div class="rr-badge rr-badge-rockgod">🤘 ROCK GOD</div>';
    return { name, score, pct, color, badges };
  }).sort((a, b) => b.score - a.score);

  const rows = playerData.map((p, idx) =>
    `<div class="rr-meter-player">
      <div class="rr-meter-rank">${idx + 1}</div>
      <img class="rr-meter-img" src="assets/avatars/${slug(p.name)}.png" alt="${p.name}" onerror="this.style.display='none'">
      <div class="rr-meter-info">
        <div class="rr-meter-name">${p.name}</div>
        <div class="rr-meter-bar-wrap"><div class="rr-meter-fill rr-meter-fill-${p.color}" style="width:${p.pct}%"></div></div>
        ${p.badges ? `<div class="rr-meter-badges">${p.badges}</div>` : ''}
      </div>
      <div class="rr-meter-score">${p.score.toFixed(0)}</div>
    </div>`
  ).join('');

  meterCol.innerHTML = `<div class="rr-meter" id="rr-live-meter" data-phase="${phase}">
    <div class="rr-meter-title">🤘 ROCK METER</div>
    <div style="font-family:'Rock Salt',cursive;font-size:8px;color:var(--amp-orange);text-align:center;margin-bottom:4px">${phaseLabels[phase] || ''}</div>
    <div class="rr-meter-list">${rows}</div>
  </div>`;
}

function _rrUpdateRoom(revIdx) {
  const grid = document.getElementById('rr-room-grid');
  if (!grid || !window._rrMeterEp) return;
  const rr = window._rrMeterEp.rockNRule;
  if (!rr) return;

  // Steps: 0=inventory, then pairs of (banner, round) for each round
  const roundsRevealed = Math.max(0, Math.floor((revIdx - 1) / 2));

  // Use the snapshot from the last revealed round
  let destroyedIds = new Set();
  const lastRevealedRound = Math.min(roundsRevealed, rr.phase3.rounds.length) - 1;
  if (lastRevealedRound >= 0 && rr.phase3.rounds[lastRevealedRound]._destroyedIds) {
    destroyedIds = new Set(rr.phase3.rounds[lastRevealedRound]._destroyedIds);
  }

  grid.querySelectorAll('.rr-item').forEach(el => {
    const itemId = el.dataset.itemId;
    if (destroyedIds.has(itemId)) {
      el.classList.remove('rr-item-intact');
      el.classList.add('rr-item-destroyed');
    } else {
      el.classList.remove('rr-item-destroyed');
      el.classList.add('rr-item-intact');
    }
  });
}

export function rockNRuleRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('rr-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`rr-step-${suffix}-${i}`);
    if (el) { el.classList.remove('rr-step-hidden'); el.classList.add('rr-step-visible'); el.style.display = ''; }
  }
  state.idx = totalSteps - 1;
  _rrUpdateMeter(state.idx);
  _rrUpdateRoom(state.idx);
  const controls = document.getElementById(`rr-controls-${suffix}`);
  const done = document.getElementById(`rr-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
}
