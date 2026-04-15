// js/twists.js - Twist application, journey, dock arrivals, first impressions, twist scenes
import { gs, seasonConfig, players, TWIST_CATALOG } from './core.js';
import { pStats, pronouns, getPlayerState } from './players.js';
import { getBond, addBond } from './bonds.js';
import { wRandom, computeHeat, formAlliances, nameNewAlliance } from './alliances.js';

export const JOURNEY_CHALLENGES = [
  { label:'Coconut Weight',  stat:'physical', desc:'Each player held a platform on one outstretched arm while opponents loaded it with coconuts. The last person still holding wins.' },
  { label:'Endurance Perch', stat:'physical', desc:'Players stood on small wooden perches above the water. No moving, no adjusting. The last person left standing wins.' },
  { label:'Coconut Toss',    stat:'physical', desc:'Players lobbed coconuts into each other\'s bags while trying to keep their own empty. The last person still upright and unburdened wins.' },
  { label:'Water Tower',     stat:'physical', desc:'Using a leaky bucket, players raced to fill a tube enough to release a key and raise their flag. First to raise their flag wins.' },
  { label:'Puzzle Stack',    stat:'mental',   desc:'Players raced to assemble a multi-level wooden puzzle tower from memory. First to build the correct structure wins.' },
  { label:'Balance Maze',    stat:'mental',   desc:'Players navigated a tilting table maze, guiding a ball to the center without dropping it. First to land the ball wins.' },
  { label:'Flag Race',       stat:'physical', desc:'Players sprinted an obstacle course, collecting pieces along the way, and raced to stack their tower first. First to finish wins.' },
  { label:'Memory Grid',     stat:'mental',   desc:'Players were shown a grid of colored symbols, then had to recreate it from memory with the board covered. Fastest correct arrangement wins.' },
  { label:'Boulder Push',    stat:'physical', desc:'Players pushed a heavy boulder down a winding course to a finish platform. First to land their boulder wins.' },
  { label:'Rope Hang',       stat:'physical', desc:'Players hung from a horizontal rope over the water, moving hand over hand. First to drop loses. Last person holding wins.' },
];

// ── Informal nomination drama ─────────────────────────────────────────
// Picks a nominee from pool using weightFn and sometimes generates a camp
// event capturing the discussion that played out before they left.
// Returns { nominee, dramaEvent | null }.

export function simulateJourney(ep) {
  ep.journey = null;
  if ((!seasonConfig.journey && !gs.journeyForcedThisEp) || gs.phase === 'finale' || gs.activePlayers.length < 4) return;
  gs.journeyForcedThisEp = false;

  const travelers = [];
  const nominationDrama = [];
  const pool = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const weightFn = n => { const s = pStats(n); return s.social + s.intuition; };

  if (!gs.isMerged && gs.tribes.length >= 2) {
    // Pre-merge: one traveler per tribe
    gs.tribes.forEach(tribe => {
      const tribePool = tribe.members.filter(p => pool.includes(p));
      if (!tribePool.length) return;
      const { nominee, dramaEvent } = pickNomineeWithDrama(tribePool, weightFn);
      if (!nominee) return;
      travelers.push(nominee);
      if (dramaEvent) nominationDrama.push({ player: nominee, tribe: tribe.name, event: dramaEvent });
    });
  } else {
    // Post-merge: 1-2 travelers from the merged tribe
    const numTravelers = pool.length <= 6 ? 1 : 2;
    for (let i = 0; i < numTravelers; i++) {
      const subPool = pool.filter(p => !travelers.includes(p));
      const { nominee, dramaEvent } = pickNomineeWithDrama(subPool, weightFn);
      if (!nominee) continue;
      travelers.push(nominee);
      if (dramaEvent) nominationDrama.push({ player: nominee, tribe: 'merge', event: dramaEvent });
    }
  }

  if (!travelers.length) return; // no travelers picked — skip journey

  const cfg = seasonConfig;
  const advPool = [];
  const _canSpawn = (type) => {
    const tc = cfg.advantages?.[type];
    if (!tc?.enabled) return false;
    const max = tc.count || 1;
    if (gs.advantages.filter(a => a.type === type).length >= max) return false;
    if (tc.oncePer === 'season' && (gs.advantagesFoundThisSeason?.[type] || 0) >= max) return false;
    if (tc.oncePer === 'phase' && (gs.advantagesFoundThisPhase?.[type] || 0) >= max) return false;
    return true;
  };
  ['extraVote', 'voteSteal', 'voteBlock', 'safetyNoPower', 'soleVote'].forEach(t => {
    const _src = cfg.advantages?.[t]?.sources || ADVANTAGES.find(a => a.key === t)?.defaultSources || [];
    if (_src.includes('journey') && _canSpawn(t)) advPool.push(t);
  });

  const jChal = JOURNEY_CHALLENGES[Math.floor(Math.random() * JOURNEY_CHALLENGES.length)];

  // ── Outcome determination ──
  let results;
  if (travelers.length >= 2 && Math.random() < 0.20) {
    // Mutual deal — both return safe, bond forms between travelers
    for (let _i = 0; _i < travelers.length - 1; _i++)
      for (let _j = _i + 1; _j < travelers.length; _j++)
        addBond(travelers[_i], travelers[_j], 1.2);
    results = travelers.map(name => ({ name, result: 'safe', dealMade: true }));
  } else if (travelers.length >= 2) {
    // Competition — winner determined by stat roll, loser loses vote
    const _statKey = jChal.stat || 'physical';
    const _scored = travelers.map(n => ({
      name: n, score: pStats(n)[_statKey] + (Math.random() * 4 - 2)
    })).sort((a, b) => b.score - a.score);
    results = _scored.map((_entry, _i) => {
      const name = _entry.name;
      if (_i === 0) {
        if (advPool.length) {
          const type = advPool[Math.floor(Math.random() * advPool.length)];
          gs.advantages.push({ holder: name, type, foundEp: ep.num });
          const _jOncePer = cfg.advantages?.[type]?.oncePer;
          if (_jOncePer) {
            const _jck = _jOncePer === 'phase' ? 'advantagesFoundThisPhase' : 'advantagesFoundThisSeason';
            if (!gs[_jck]) gs[_jck] = {};
            gs[_jck][type] = (gs[_jck][type] || 0) + 1;
          }
          return { name, result: 'advantage', type };
        }
        return { name, result: 'safe' };
      } else {
        gs.lostVotes.push(name);
        if (!gs.journeyLostVotes) gs.journeyLostVotes = [];
        if (!gs.journeyLostVotes.includes(name)) gs.journeyLostVotes.push(name);
        return { name, result: 'lostVote' };
      }
    });
  } else {
    // Single traveler — independent risk/reward roll
    results = travelers.map(name => {
      const s = pStats(name);
      const gambles = Math.random() < 0.55 + (s.strategic - 5) * 0.03;
      if (gambles && advPool.length) {
        const type = advPool[Math.floor(Math.random() * advPool.length)];
        gs.advantages.push({ holder: name, type, foundEp: ep.num });
        const _j2OncePer = cfg.advantages?.[type]?.oncePer;
        if (_j2OncePer) {
          const _j2ck = _j2OncePer === 'phase' ? 'advantagesFoundThisPhase' : 'advantagesFoundThisSeason';
          if (!gs[_j2ck]) gs[_j2ck] = {};
          gs[_j2ck][type] = (gs[_j2ck][type] || 0) + 1;
        }
        return { name, result: 'advantage', type };
      } else if (gambles) {
        return { name, result: 'safe' };
      } else {
        gs.lostVotes.push(name);
        if (!gs.journeyLostVotes) gs.journeyLostVotes = [];
        if (!gs.journeyLostVotes.includes(name)) gs.journeyLostVotes.push(name);
        return { name, result: 'lostVote' };
      }
    });
  }

  const winner = results.find(r => r.result === 'advantage')?.name
              || results.find(r => r.result === 'safe')?.name
              || results[0]?.name;
  ep.journey = { travelers, results, challengeLabel: jChal.label, challengeDesc: jChal.desc, challengeStat: jChal.stat, winner, nominationDrama: nominationDrama.length ? nominationDrama : undefined };
  gs.journeyHistory.push({ ep: ep.num, travelers, results });
}

// ══════════════════════════════════════════════════════════════════════
// DOCK ARRIVAL — DIALOGUE POOLS
// ══════════════════════════════════════════════════════════════════════

export const DOCK_ARRIVAL_TIERS = {
  chill: ['floater','loyal-soldier','social-butterfly','showmancer','underdog'],
  intense: ['hero','challenge-beast','perceptive-player','mastermind'],
  volatile: ['villain','hothead','chaos-agent','schemer','wildcard','goat'],
};

export const DOCK_HOST_LINES = {
  villain: [
    (n,pr,h) => `"Watch your backs, everyone. ${n} just arrived."`,
    (n,pr,h) => `"Oh, this should be interesting. Everyone, meet ${n}."`,
    (n,pr,h) => `"${n} is here. And no, ${pr.sub} ${pr.sub==='they'?"don't":"doesn't"} play nice."`,
    (n,pr,h) => `"Ladies and gentlemen... trouble just docked."`,
    (n,pr,h) => `"I'd say play nice, ${n}, but we both know that's not happening."`,
  ],
  hero: [
    (n,pr,h) => `"Give it up for ${n}!"`,
    (n,pr,h) => `"${n} is here. Finally, someone the audience can root for."`,
    (n,pr,h) => `"The golden child has arrived. Welcome, ${n}."`,
    (n,pr,h) => `"${n}! The one everyone wants on their team."`,
  ],
  schemer: [
    (n,pr,h) => `"${n}, welcome. Try not to scheme too hard on day one."`,
    (n,pr,h) => `"${n} is here. ${pr.Sub} already ${pr.sub==='they'?'look':'looks'} like ${pr.sub}'${pr.sub==='they'?"re":"s"} planning something."`,
    (n,pr,h) => `"Everyone smile at ${n}. ${pr.Sub}'${pr.sub==='they'?"re":"s"} definitely smiling at you."`,
    (n,pr,h) => `"Welcome, ${n}. I'm sure your intentions are pure."`,
  ],
  mastermind: [
    (n,pr,h) => `"${n} just arrived. ${pr.Sub}'${pr.sub==='they'?"re":"s"} already three moves ahead."`,
    (n,pr,h) => `"Welcome, ${n}. Try to enjoy the game, not just win it."`,
    (n,pr,h) => `"${n} is here. I can practically hear the gears turning."`,
    (n,pr,h) => `"Everyone, this is ${n}. The smartest person here just got competition."`,
  ],
  hothead: [
    (n,pr,h) => `"${n} is here, and ${pr.sub} already ${pr.sub==='they'?'look':'looks'} annoyed."`,
    (n,pr,h) => `"Welcome, ${n}. Deep breaths, we just started."`,
    (n,pr,h) => `"${n}! Try not to break anything on day one."`,
    (n,pr,h) => `"Aaaaand the temperature on the dock just went up. ${n}, everyone."`,
  ],
  'chaos-agent': [
    (n,pr,h) => `"Brace yourselves. ${n} just arrived."`,
    (n,pr,h) => `"${n} is here. Lock up the supplies."`,
    (n,pr,h) => `"Welcome, ${n}. I'm already nervous."`,
    (n,pr,h) => `"Everyone, meet ${n}. No, I can't predict what happens next either."`,
  ],
  'loyal-soldier': [
    (n,pr,h) => `"${n}! Good to have you here."`,
    (n,pr,h) => `"Welcome, ${n}. Solid, dependable — exactly what a team needs."`,
    (n,pr,h) => `"${n} is here. Someone you want in your corner."`,
    (n,pr,h) => `"Give it up for ${n}. The kind of player who keeps their word."`,
  ],
  'social-butterfly': [
    (n,pr,h) => `"${n} is here, and ${pr.sub}'${pr.sub==='they'?"re":"s"} already making friends."`,
    (n,pr,h) => `"Everyone's new best friend just arrived. Welcome, ${n}."`,
    (n,pr,h) => `"${n}! I give it five minutes before ${pr.sub} ${pr.sub==='they'?'know':'knows'} everyone's name."`,
    (n,pr,h) => `"Welcome, ${n}. The social game starts now."`,
  ],
  showmancer: [
    (n,pr,h) => `"${n} is here. Try to focus, people."`,
    (n,pr,h) => `"Welcome, ${n}. I see some heads turning already."`,
    (n,pr,h) => `"${n} just arrived. This should complicate things."`,
    (n,pr,h) => `"Ladies and gentlemen, ${n}. Hearts will be broken."`,
  ],
  'challenge-beast': [
    (n,pr,h) => `"${n} is here. The challenges just got a lot more interesting."`,
    (n,pr,h) => `"Welcome, ${n}. You look like you could win every single one of these."`,
    (n,pr,h) => `"${n}! Built for this. Literally."`,
    (n,pr,h) => `"Everyone, meet your biggest challenge threat. ${n}, welcome."`,
  ],
  floater: [
    (n,pr,h) => `"${n}, welcome to the island."`,
    (n,pr,h) => `"And here's ${n}. Flying under the radar already."`,
    (n,pr,h) => `"${n} is here. Quiet entrance — noted."`,
    (n,pr,h) => `"Welcome, ${n}. Sometimes the quiet ones go the furthest."`,
  ],
  wildcard: [
    (n,pr,h) => `"${n} just docked. Your guess is as good as mine."`,
    (n,pr,h) => `"Welcome, ${n}. I genuinely don't know what to expect from you."`,
    (n,pr,h) => `"${n} is here. Even the producers aren't sure what's going to happen."`,
    (n,pr,h) => `"Everyone, this is ${n}. Expect the unexpected."`,
  ],
  'perceptive-player': [
    (n,pr,h) => `"${n} is here. ${pr.Sub}'${pr.sub==='they'?"re":"s"} already reading everyone."`,
    (n,pr,h) => `"Welcome, ${n}. Nothing gets past this one."`,
    (n,pr,h) => `"${n} just arrived. ${pr.Sub} probably already ${pr.sub==='they'?'know':'knows'} who's lying."`,
    (n,pr,h) => `"Everyone, meet ${n}. The human lie detector."`,
  ],
  underdog: [
    (n,pr,h) => `"${n} is here. Don't count ${pr.obj} out."`,
    (n,pr,h) => `"Welcome, ${n}. The underdog story starts now."`,
    (n,pr,h) => `"${n}! Small in stature, big in heart."`,
    (n,pr,h) => `"Everyone, this is ${n}. ${pr.Sub}'ll surprise you."`,
  ],
  goat: [
    (n,pr,h) => `"${n}, welcome!"`,
    (n,pr,h) => `"And here's ${n}. Welcome to the island."`,
    (n,pr,h) => `"${n} is here. Let's see what ${pr.sub} ${pr.sub==='they'?'bring':'brings'} to the table."`,
    (n,pr,h) => `"Welcome, ${n}. Make yourself at home."`,
  ],
};

export const DOCK_STAT_FLAVOR = [
  { stat: 'physical', min: 8, fn: (n,pr) => `"${n} just stepped off the boat looking like ${pr.sub} could flip it over."` },
  { stat: 'strategic', min: 8, fn: (n,pr) => `"${n} is here. I give it ten minutes before ${pr.sub} ${pr.sub==='they'?'have':'has'} a plan."` },
  { stat: 'social', min: 8, fn: (n,pr) => `"${n} just arrived, and somehow half the dock already likes ${pr.obj}."` },
  { stat: 'endurance', min: 8, fn: (n,pr) => `"${n} is here. Good luck outlasting this one."` },
  { stat: 'mental', min: 8, fn: (n,pr) => `"${n} just docked. The smartest person on this island might have just arrived."` },
  { stat: 'boldness', min: 8, fn: (n,pr) => `"${n} is here. ${pr.Sub} ${pr.sub==='they'?"don't":"doesn't"} do subtle."` },
  { stat: 'intuition', min: 8, fn: (n,pr) => `"${n} is here. ${pr.Sub} can read a room before ${pr.sub} even ${pr.sub==='they'?'walk':'walks'} into it."` },
  { stat: 'temperament', min: -1, max: 3, fn: (n,pr) => `"${n} just arrived. Let's hope nobody makes ${pr.obj} angry."` },
];

export const DOCK_PLAYER_LINES = {
  villain: [
    `"Cute camp. I give it a week before I run this place."`,
    `"So this is the competition? This'll be easier than I thought."`,
    `"Already see a few people I can work with. And a few I'll enjoy watching leave."`,
    `"Don't worry, everyone. I'll be nice. For now."`,
    `"Everyone here is a pawn. They just don't know it yet."`,
  ],
  hero: [
    `"Hey everyone! This is going to be amazing."`,
    `"Camp looks rough, but that's half the fun, right?"`,
    `"I'm here to compete, make friends, and do this the right way."`,
    `"Whatever this place throws at us, we handle it together."`,
    `"Let's go! I've been waiting for this."`,
  ],
  schemer: [
    `"Nice to meet everyone. I mean that. Mostly."`,
    `"This camp has potential. Just needs the right person pulling the strings."`,
    `"I'm already thinking three steps ahead. Can't help it."`,
    `"Everyone looks so trusting. That's... useful."`,
    `"The alliances start now. In my head, at least."`,
  ],
  mastermind: [
    `"Interesting. I've already identified four potential alliance structures."`,
    `"The game started the moment I stepped off that boat."`,
    `"Camp's fine. The people are what matter. And I'm watching."`,
    `"Let's not pretend this isn't a chess match. I'm ready."`,
    `"Everyone's playing checkers. I brought a chess set."`,
  ],
  hothead: [
    `"This place better have food because I'm already in a mood."`,
    `"If anyone tries anything, they'll hear about it. Loudly."`,
    `"I'm not here to make friends. I'm here to win."`,
    `"Someone already looked at me wrong. We're gonna have problems."`,
    `"Alright. Let's get this over with."`,
  ],
  'chaos-agent': [
    `"This place is a dump. I LOVE it."`,
    `"So when do things start getting weird? Because I'm ready."`,
    `"Everyone looks so serious. That's gonna change."`,
    `"I brought fireworks. Not metaphorical ones."`,
    `"Rules? Sure, I'll learn them. Then break them."`,
  ],
  'loyal-soldier': [
    `"Hey, good to be here. Let's do this."`,
    `"Camp looks solid. I've seen worse."`,
    `"Just point me to my team and I'm ready to work."`,
    `"I'm here to compete hard and keep my word. Simple as that."`,
    `"Tell me what needs doing and I'll do it."`,
  ],
  'social-butterfly': [
    `"Oh my gosh, hi everyone! This is SO exciting!"`,
    `"I already love this place. And all of you. Seriously."`,
    `"I've been looking forward to this for months. Let's be friends!"`,
    `"This camp is giving me summer camp vibes and I am HERE for it."`,
    `"I want to know everyone's name by dinner."`,
  ],
  showmancer: [
    `"Well, hello everyone."`,
    `"I see some interesting people here. Very interesting."`,
    `"I'm here for the experience. Whatever happens... happens."`,
    `"Nice camp. Better company, though."`,
    `"This could be a very memorable summer."`,
  ],
  'challenge-beast': [
    `"Where's the gym? Kidding. Sort of."`,
    `"This place looks tough. Good. I like tough."`,
    `"I've been training for this. Bring on the challenges."`,
    `"If there's a physical challenge on day one, I'm winning it."`,
    `"Point me at a challenge. Any challenge."`,
  ],
  floater: [
    `"Hey. Cool. So... where do I put my stuff?"`,
    `"This seems fine."`,
    `"Not bad. I can work with this."`,
    `"I'm just gonna hang back and see how this plays out."`,
    `"Yeah, I'm here. Don't mind me."`,
  ],
  wildcard: [
    `"Is that a raccoon? I love raccoons."`,
    `"I don't really have a plan. Plans are boring."`,
    `"Whatever everyone else is doing, I'm probably doing the opposite."`,
    `"This camp smells weird. I'm into it."`,
    `"I have no idea what I'm doing and I've never felt more alive."`,
  ],
  'perceptive-player': [
    `"Interesting group. I can already tell who's faking it."`,
    `"I've been watching everyone from the boat. Already have notes."`,
    `"Camp's fine. The real game is the people. And they're fascinating."`,
    `"Three people here are already lying. It's been five minutes."`,
    `"I see everything. I just don't say everything."`,
  ],
  underdog: [
    `"I know I don't look like much. That's the point."`,
    `"Everyone always underestimates me. That's fine. Keep doing it."`,
    `"This place is rough. Perfect. I'm used to rough."`,
    `"Hi everyone. Remember my face — you're going to see a lot of it."`,
    `"Nobody expects me to win. Good."`,
  ],
  goat: [
    `"Wow, this is a real camp! With trees and everything!"`,
    `"Hi! Is this where we sleep? It's so... outdoorsy."`,
    `"I just want to have fun and not get voted out first. Is that too much to ask?"`,
    `"Everyone seems really intense. Am I supposed to be intense too?"`,
    `"So excited to be here! Where's the bathroom?"`,
  ],
};

export const DOCK_RETURNEE_LINES = {
  villain: [
    `"Miss me? No? Good. That means I did my job last time."`,
    `"I'm back. And I remember every name that wrote mine down."`,
    `"Round two. This time they know what I am — and they still can't stop me."`,
    `"The villain returns. Try to act surprised."`,
  ],
  hero: [
    `"Unfinished business. That's why I'm here."`,
    `"Last time I played with honor. This time I play smarter AND with honor."`,
    `"I'm back, and I'm not leaving until I finish what I started."`,
    `"Being back feels right. This time I know what I'm up against."`,
  ],
  schemer: [
    `"They really invited me back? Their mistake."`,
    `"Last time was practice. This is the real game."`,
    `"I learned a lot last time. Mostly what NOT to get caught doing."`,
    `"Back for round two. New plans, same brain."`,
  ],
  mastermind: [
    `"I've replayed every move from last time. I know exactly what went wrong."`,
    `"Back with a better playbook. Let's see if anyone can keep up."`,
    `"Experience is the ultimate advantage. And I've got plenty."`,
    `"I've had time to think. That should scare everyone."`,
  ],
  hothead: [
    `"Yeah, I'm back. And I'm still angry about how last time went."`,
    `"Same camp, same game. Different me. Maybe. We'll see."`,
    `"They told me to stay calm this time. I'll try. No promises."`,
    `"Last time I let my temper get me. This time... okay, it might still get me."`,
  ],
  'chaos-agent': [
    `"You thought last time was chaotic? Buckle up."`,
    `"I'm baaack! Did you miss the chaos? I missed the chaos."`,
    `"Round two of me is going to be so much worse for everyone. I can't wait."`,
    `"They invited me back KNOWING what I did last time. I respect that."`,
  ],
  'loyal-soldier': [
    `"Back again. Same player, same values. Let's go."`,
    `"I kept my word last time and I'll keep it this time too."`,
    `"Being back feels like coming home. Weird, smelly home. But home."`,
    `"I know this game now. Loyalty still wins. I'll prove it."`,
  ],
  'social-butterfly': [
    `"Oh my gosh, I'm BACK! I missed this place!"`,
    `"New people to meet! Well, not new, but we get to start over, right?"`,
    `"Last time was amazing. This time is going to be BETTER."`,
    `"I already know everyone and I already love everyone. Let's GO."`,
  ],
  showmancer: [
    `"Back for more. And yes, I'm single. In case anyone's wondering."`,
    `"Last time the romance distracted me. This time... well, we'll see."`,
    `"I'm here to play, not to fall in love again. Probably."`,
    `"Same dock, same butterflies. Some things don't change."`,
  ],
  'challenge-beast': [
    `"I've been training since the day I left. Nobody's beating me this time."`,
    `"Back and stronger. The challenges don't scare me. The people might."`,
    `"Last time I relied on winning. This time I've got a social game too. Sort of."`,
    `"Round two. Let's see if anyone can keep up."`,
  ],
  floater: [
    `"Yep, I'm back. Surprised? Most people are."`,
    `"Last time I flew under the radar. This time... probably the same thing."`,
    `"Nobody expected me to come back. That's kind of my whole thing."`,
    `"Back again. Still here. Still quiet. Still dangerous."`,
  ],
  wildcard: [
    `"They let me come back! That's either brave or stupid."`,
    `"Round two! I have no idea what I'm doing and that's the plan!"`,
    `"Last time was a wild ride. This time I brought snacks."`,
    `"Back and even more unpredictable. You're welcome."`,
  ],
  'perceptive-player': [
    `"I know everyone's game this time. That's a problem — for them."`,
    `"Back with better reads. Last time I saw everything. This time I'll use it."`,
    `"Everyone's tells are exactly the same. This should be fun."`,
    `"I've been watching from home. I know who's fake. All of them."`,
  ],
  underdog: [
    `"I wasn't supposed to make it last time. I wasn't supposed to come back. Yet here I am."`,
    `"They counted me out once. They'll do it again. And I'll prove them wrong again."`,
    `"Back with something to prove. Same as always."`,
    `"The underdog returns. Honestly, this is my favorite role."`,
  ],
  goat: [
    `"I'm back! I actually got invited back! Can you believe it?"`,
    `"Last time I didn't really know what was going on. Now I kind of do!"`,
    `"Everyone told me I'd never come back. WELL HERE I AM."`,
    `"I'm so excited. Is it weird that I'm excited? I don't care, I'm excited."`,
  ],
};

export const DOCK_CHEMISTRY_PAIRS = [
  { newArch: ['villain'], reactArch: ['hero'], chemType: 'tension', lines: [
    (name,pr,reactor,rPr) => `${reactor} crosses ${rPr.posAdj} arms and says nothing. The look says everything.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} step off the boat. ${rPr.Sub} already ${rPr.sub==='they'?"don't":"doesn't"} trust ${pr.obj}.`,
    (name,pr,reactor,rPr) => `"Great," ${reactor} mutters. "This should be fun."`,
  ]},
  { newArch: ['hero'], reactArch: ['villain'], chemType: 'sizing-up', lines: [
    (name,pr,reactor,rPr) => `${reactor} smirks. "Oh, we've got a ${pr.sub==='she'?'Girl':'Boy'} Scout."`,
    (name,pr,reactor,rPr) => `${reactor} looks ${name} up and down. Competition.`,
    (name,pr,reactor,rPr) => `Something flickers behind ${reactor}'s eyes. This one could be a problem.`,
  ]},
  { newArch: ['hothead'], reactArch: ['floater','social-butterfly','loyal-soldier','goat','underdog'], chemType: 'intimidation', lines: [
    (name,pr,reactor,rPr) => `${reactor} takes a small step back. Just instinct.`,
    (name,pr,reactor,rPr) => `The dock gets quieter when ${name} arrives. ${reactor} notices.`,
    (name,pr,reactor,rPr) => `${reactor} glances at ${name} and decides to stand somewhere else.`,
  ]},
  { newArch: ['showmancer'], reactArch: ['social-butterfly','showmancer','hero'], chemType: 'attraction', lines: [
    (name,pr,reactor,rPr) => `${reactor} does a double take. Tries to play it cool. Fails.`,
    (name,pr,reactor,rPr) => `${reactor} suddenly becomes very interested in fixing ${rPr.posAdj} hair.`,
    (name,pr,reactor,rPr) => `Something about ${name} catches ${reactor}'s attention. ${rPr.Sub} ${rPr.sub==='they'?"don't":"doesn't"} look away fast enough.`,
  ]},
  { newArch: ['chaos-agent'], reactArch: ['loyal-soldier','perceptive-player'], chemType: 'dread', lines: [
    (name,pr,reactor,rPr) => `${reactor} watches ${name} arrive and gets a bad feeling about this.`,
    (name,pr,reactor,rPr) => `"Oh no," ${reactor} says quietly. ${rPr.Sub} can already tell.`,
    (name,pr,reactor,rPr) => `${reactor} and ${name} make eye contact. It's instantly clear they're going to have problems.`,
  ]},
  { newArch: ['challenge-beast'], reactArch: ['challenge-beast','hero'], chemType: 'rivalry', lines: [
    (name,pr,reactor,rPr) => `${reactor} sizes up ${name}. Finally, some real competition.`,
    (name,pr,reactor,rPr) => `${reactor} stands a little taller when ${name} steps onto the dock.`,
    (name,pr,reactor,rPr) => `Two athletes. One dock. ${reactor} and ${name} exchange a nod. Game on.`,
  ]},
  { newArch: ['goat'], reactArch: ['villain','schemer'], chemType: 'predatory', lines: [
    (name,pr,reactor,rPr) => `${reactor}'s eyes light up. Not in a nice way.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} fumble off the boat and smiles. Perfect.`,
    (name,pr,reactor,rPr) => `${reactor} just found ${rPr.posAdj} new best friend. ${name} has no idea.`,
  ]},
  { newArch: ['underdog'], reactArch: ['hero','loyal-soldier'], chemType: 'encouragement', lines: [
    (name,pr,reactor,rPr) => `${reactor} gives ${name} a genuine smile. "Welcome."`,
    (name,pr,reactor,rPr) => `${reactor} nods at ${name}. Sees something the others don't.`,
    (name,pr,reactor,rPr) => `"Hey, glad you're here," ${reactor} says to ${name}. And means it.`,
  ]},
  { newArch: ['mastermind'], reactArch: ['mastermind','perceptive-player'], chemType: 'recognition', lines: [
    (name,pr,reactor,rPr) => `${reactor} and ${name} lock eyes. They both know what the other is.`,
    (name,pr,reactor,rPr) => `${reactor} nods once at ${name}. Respect. And concern.`,
    (name,pr,reactor,rPr) => `Two people in this game just realized they can't fool each other.`,
  ]},
  { newArch: ['wildcard'], reactArch: ['perceptive-player','mastermind'], chemType: 'curiosity', lines: [
    (name,pr,reactor,rPr) => `${reactor} can't quite figure ${name} out. That almost never happens.`,
    (name,pr,reactor,rPr) => `${reactor} tilts ${rPr.posAdj} head. ${name} is... different.`,
    (name,pr,reactor,rPr) => `${reactor} watches ${name} carefully. No read yet. Interesting.`,
  ]},
];

export function generateDockArrivals(ep) {
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  // Pick without repeating lines already used this season
  const _pickUnique = (arr, usedSet) => {
    const unused = arr.filter(x => !usedSet.has(typeof x === 'function' ? x.toString() : x));
    const choice = unused.length ? _pick(unused) : _pick(arr);
    usedSet.add(typeof choice === 'function' ? choice.toString() : choice);
    return choice;
  };
  const host = seasonConfig.host || 'Chris';
  const allPlayers = [...players];
  if (!allPlayers.length) return;

  // ── Step 1: Group players by energy tier ──
  const tierGroups = { chill: [], intense: [], volatile: [] };
  allPlayers.forEach(p => {
    const arch = p.archetype || 'floater';
    const tier = Object.entries(DOCK_ARRIVAL_TIERS).find(([,archs]) => archs.includes(arch));
    tierGroups[tier ? tier[0] : 'chill'].push(p);
  });
  Object.values(tierGroups).forEach(arr => arr.sort(() => Math.random() - 0.5));

  // ── Step 2: Pull first (chill) and last (volatile) ──
  const first = tierGroups.chill.length ? tierGroups.chill.shift() : tierGroups.intense.shift() || tierGroups.volatile.shift();
  const last = tierGroups.volatile.length ? tierGroups.volatile.pop() : tierGroups.intense.pop() || tierGroups.chill.pop();

  // ── Step 3: Alternate tiers for the middle ──
  const tierOrder = ['chill', 'volatile', 'intense'];
  const middle = [];
  let tIdx = 0;
  const total = tierGroups.chill.length + tierGroups.intense.length + tierGroups.volatile.length;
  for (let i = 0; i < total; i++) {
    for (let tries = 0; tries < 3; tries++) {
      const tier = tierOrder[(tIdx + tries) % 3];
      if (tierGroups[tier].length) {
        middle.push(tierGroups[tier].shift());
        tIdx = (tIdx + tries + 1) % 3;
        break;
      }
    }
  }

  const ordered = [first, ...middle, last].filter(Boolean);

  // ── Step 4: Generate dialogue for each arrival ──
  const arrivals = [];
  const onDock = [];
  const usedHostLines = new Set();     // dedup host lines across season
  const usedPlayerLines = new Set();   // dedup player lines across season
  const usedStatFlavors = new Set();   // max 2 stat flavor overrides per stat type
  const reactedPlayers = new Set();    // each player reacts at most once

  ordered.forEach((p, i) => {
    const arch = p.archetype || 'floater';
    const pr = pronouns(p.name);
    const s = pStats(p.name);

    // Host line: 25% chance of stat flavor override (capped: max 2 per stat type)
    let hostLine, statFlavor = null;
    const topStat = DOCK_STAT_FLAVOR.find(sf => {
      if (sf.stat === 'temperament') return s.temperament <= (sf.max || 3);
      return s[sf.stat] >= sf.min;
    });
    if (topStat && Math.random() < 0.25 && (usedStatFlavors.has(topStat.stat) ? [...usedStatFlavors].filter(x => x === topStat.stat).length < 2 : true)) {
      hostLine = topStat.fn(p.name, pr);
      statFlavor = topStat.stat;
      usedStatFlavors.add(topStat.stat);
    } else {
      const pool = DOCK_HOST_LINES[arch] || DOCK_HOST_LINES.floater;
      const chosen = _pickUnique(pool, usedHostLines);
      hostLine = chosen(p.name, pr, host);
    }

    // Player reaction line — dedup across season
    const isReturnee = p.isReturnee || false;
    const playerPool = isReturnee
      ? (DOCK_RETURNEE_LINES[arch] || DOCK_RETURNEE_LINES.floater)
      : (DOCK_PLAYER_LINES[arch] || DOCK_PLAYER_LINES.floater);
    const playerLine = _pickUnique(playerPool, usedPlayerLines);

    // Dock reaction: each reactor can only react once
    let dockReaction = null;
    if (onDock.length >= 1) {
      const matchingPairs = DOCK_CHEMISTRY_PAIRS.filter(cp => cp.newArch.includes(arch));
      if (matchingPairs.length) {
        // Shuffle pairs so it's not always the first match
        const shuffledPairs = [...matchingPairs].sort(() => Math.random() - 0.5);
        for (const pair of shuffledPairs) {
          // Find a reactor who hasn't reacted yet
          const reactor = onDock.find(d =>
            pair.reactArch.includes(d.archetype || 'floater') && !reactedPlayers.has(d.name)
          );
          if (reactor && Math.random() < 0.50) {
            const rPr = pronouns(reactor.name);
            const reactionText = _pick(pair.lines)(p.name, pr, reactor.name, rPr);
            dockReaction = { reactor: reactor.name, text: reactionText, chemType: pair.chemType };
            reactedPlayers.add(reactor.name);
            break;
          }
        }
      }
    }

    arrivals.push({
      name: p.name, order: i, archetype: arch, isReturnee,
      hostLine, playerLine, dockReaction, statFlavor,
    });

    onDock.push(p);
  });

  ep.dockArrivals = arrivals;
}

// ── FIRST IMPRESSIONS: mock vote → round-robin tribe swap ──
export function executeFirstImpressions(ep, twistObj) {
  if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const results = []; // { tribe, votedOut, votes, voters, nonVoters, sentTo }

  // Step 1: each tribe runs a gut-feeling vote (no alliances, no strategy — pure first impressions)
  gs.tribes.forEach(tribe => {
    const members = [...tribe.members];

    // Score each player as a target based on first impressions
    // Higher score = more likely to be targeted
    const targetScores = {};
    members.forEach(p => {
      const ps = pStats(p);
      const pArch = players.find(x => x.name === p)?.archetype || '';
      let score = 0;
      // Perceived threat: strong/smart players attract attention
      score += threatScore(p) * 0.3;
      // Outsider energy: low social = doesn't connect quickly
      score += (10 - ps.social) * 0.15;
      // Intimidation: bold/aggressive players make others uncomfortable
      score += ps.boldness * 0.1;
      // Archetype snap judgments
      if (pArch === 'villain' || pArch === 'schemer') score += 1.5;
      if (pArch === 'hothead' || pArch === 'chaos-agent') score += 1.0;
      if (pArch === 'challenge-beast') score += 0.8;
      if (pArch === 'floater') score -= 0.5; // invisible
      if (pArch === 'social-butterfly') score -= 0.8; // likeable
      if (pArch === 'hero') score -= 0.3;
      // Random variance (gut feeling isn't precise)
      score += Math.random() * 2.5;
      targetScores[p] = score;
    });

    // Each player votes for their highest-scored target (can't vote self)
    const log = [];
    const voteCounts = {};
    members.forEach(voter => {
      const voterS = pStats(voter);
      // Score targets from this voter's perspective, adding personal bond factor
      const candidates = members.filter(m => m !== voter);
      const scored = candidates.map(t => {
        let s = targetScores[t];
        const bond = getBond(voter, t);
        s -= bond * 0.4; // positive bond = less likely to target
        // Personal gut: intuitive voters read threat better
        if (voterS.intuition >= 7) s += threatScore(t) * 0.15;
        // Strategic voters target threats even on day 1
        if (voterS.strategic >= 7) s += threatScore(t) * 0.1;
        s += Math.random() * 1.0;
        return { name: t, score: s };
      }).sort((a, b) => b.score - a.score);

      const target = scored[0].name;
      voteCounts[target] = (voteCounts[target] || 0) + 1;

      // Generate gut-feeling reason (no alliances, no idols, no split votes)
      const targetS = pStats(target);
      const bond = getBond(voter, target);
      let reason;
      if (bond <= -2) {
        reason = _pick([
          `bad energy from the start — something about ${target} doesn't sit right`,
          `first instinct said ${target} was trouble, and ${pronouns(voter).sub} ${pronouns(voter).sub==='they'?'trust':'trusts'} ${pronouns(voter).posAdj} gut`,
          `${target} rubbed ${pronouns(voter).obj} the wrong way within minutes of meeting`,
        ]);
      } else if (targetS.archetype === 'villain' || targetS.archetype === 'schemer') {
        reason = _pick([
          `something about ${target} feels calculated — not here to make friends`,
          `${target} was reading the room too carefully for someone who just got here`,
          `the way ${target} carries ${pronouns(target).ref} — it's a red flag on day one`,
        ]);
      } else if (targetS.archetype === 'challenge-beast' || threatScore(target) >= 7) {
        reason = _pick([
          `${target} looks like the biggest physical threat here — better to act early`,
          `you can see it in how ${target} carries ${pronouns(target).ref} — too dangerous to let settle in`,
          `strategic and likeable is the worst combination to be sitting next to`,
        ]);
      } else if (targetS.social <= 4) {
        reason = _pick([
          `${target} hasn't connected with anyone — easy first target`,
          `nobody's spoken up for ${target} — that says enough`,
          `${target} is on the outside looking in and everyone can feel it`,
        ]);
      } else if (voterS.intuition >= 7) {
        reason = _pick([
          `gut read — ${target} is not what ${pronouns(target).sub}'${pronouns(target).sub==='they'?'re':'s'} presenting`,
          `something is off about ${target} — can't explain it, but the instinct is strong`,
          `first impressions matter, and ${target}'s first impression was wrong`,
        ]);
      } else if (targetS.boldness >= 7) {
        reason = _pick([
          `${target} came in too hot — drawing attention on day one is never smart`,
          `${target} is loud and confident — which makes ${pronouns(target).obj} an easy consensus name`,
          `the boldest person in the room is usually the first one targeted`,
        ]);
      } else {
        reason = _pick([
          `no strong feelings either way — ${target} was just the name that came up`,
          `had to write someone's name down — ${target} felt like the safest choice`,
          `pure gut — no strategy, no alliances, just a feeling`,
          `${target} was the name floating around — went with the room`,
          `didn't have enough time to build trust — ${target} was the path of least resistance`,
        ]);
      }

      log.push({ voter, voted: target, reason });
    });

    const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
    const votedOut = sorted[0]?.[0];
    if (!votedOut) return;
    const voters = log.filter(l => l.voted === votedOut).map(l => l.voter);
    const nonVoters = members.filter(m => m !== votedOut && !voters.includes(m));
    results.push({ tribe: tribe.name, votedOut, votes: voteCounts, voters, nonVoters, log });
  });

  if (!results.length) return;

  // Step 2: round-robin swap assignment
  for (let i = 0; i < results.length; i++) {
    const nextIdx = (i + 1) % results.length;
    results[i].sentTo = gs.tribes[nextIdx].name;
  }

  // Step 3: apply bond consequences BEFORE moving players
  results.forEach(r => {
    const pr = pronouns(r.votedOut);
    // Bond damage with voters (-2.0)
    r.voters.forEach(v => addBond(r.votedOut, v, -2.0));
    // Bond boost with non-voters (+0.5) — "you didn't vote me out, I remember that"
    r.nonVoters.forEach(nv => addBond(r.votedOut, nv, 0.5));
    // Bond boost with new tribe members (+1.0)
    const newTribe = gs.tribes.find(t => t.name === r.sentTo);
    if (newTribe) {
      newTribe.members.forEach(m => addBond(r.votedOut, m, 1.0));
    }
    // Emotional state: uneasy
    if (!gs.playerStates) gs.playerStates = {};
    if (!gs.playerStates[r.votedOut]) gs.playerStates[r.votedOut] = { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    gs.playerStates[r.votedOut].emotional = 'uneasy';
  });

  // Step 4: move players — remove from old tribes, add to new tribes
  results.forEach(r => {
    const oldTribe = gs.tribes.find(t => t.name === r.tribe);
    const newTribe = gs.tribes.find(t => t.name === r.sentTo);
    if (oldTribe) oldTribe.members = oldTribe.members.filter(m => m !== r.votedOut);
    if (newTribe && !newTribe.members.includes(r.votedOut)) newTribe.members.push(r.votedOut);
  });

  // Step 5: inject camp events for swapped players
  results.forEach(r => {
    const pr = pronouns(r.votedOut);
    const campKey = r.sentTo;
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    const pre = ep.campEvents[campKey].pre;
    pre.push({ type: 'firstImpressionsSwap', players: [r.votedOut], text: _pick([
      `${r.votedOut} walks into ${r.sentTo} camp carrying nothing but a grudge. ${pr.Sub} know${pr.sub==='they'?'':'s'} exactly who put ${pr.obj} here.`,
      `${r.votedOut} arrives at ${r.sentTo}. New faces. Fresh start. But ${pr.sub} ${pr.sub==='they'?'haven\'t':'hasn\'t'} forgotten what ${r.tribe} did.`,
      `The tribe watches ${r.votedOut} walk in. Nobody expected a new face this early. ${r.votedOut} doesn't explain — ${pr.sub} just start${pr.sub==='they'?'':'s'} building shelter.`,
      `${r.votedOut} drops ${pr.pos} bag at ${r.sentTo} and looks around. These people didn't vote ${pr.obj} out. That's a start.`,
      `${r.votedOut} doesn't say much when ${pr.sub} arrive${pr.sub==='they'?'':'s'} at ${r.sentTo}. The look on ${pr.pos} face says enough. ${pr.Sub} ${pr.sub==='they'?'were':'was'} voted out by ${pr.pos} own tribe on day one.`,
    ]), badgeText: 'SWAPPED', badgeClass: 'gold' });
  });

  // Step 6: store results for VP
  twistObj.firstImpressions = results.map(r => ({
    tribe: r.tribe, votedOut: r.votedOut, votes: r.votes, voters: r.voters,
    nonVoters: r.nonVoters, sentTo: r.sentTo, log: r.log
  }));
  twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
  gs.sitOutHistory = {}; // reset sit-out tracking after roster change
}

export function applyTwist(ep, twist, isPrimary = true) {
  // Resolve engineType from TWIST_CATALOG so catalog aliases work
  const catalogEntry = TWIST_CATALOG.find(t => t.id === twist.type);
  const engineType   = catalogEntry?.engineType || twist.type;
  const twistObj = { type: engineType, catalogId: twist.type, name: catalogEntry?.name || twist.type };
  ep.twists.push(twistObj);
  if (isPrimary) ep.twist = twistObj; // backward compat for engine checks
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── TEAM DYNAMICS ──────────────────────────────────────────────────
  if (engineType === 'tribe-swap') {
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    const allActive = [...gs.activePlayers];
    for (let i = allActive.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allActive[i], allActive[j]] = [allActive[j], allActive[i]];
    }
    const tribeNames = gs.tribes.map(t => t.name);
    const perTribe   = Math.floor(allActive.length / tribeNames.length);
    gs.tribes = tribeNames.map((name, i) => ({
      name,
      members: allActive.slice(i * perTribe, i === tribeNames.length - 1 ? allActive.length : (i+1)*perTribe),
    }));
    if (seasonConfig.advantages?.idol?.enabled) tribeNames.forEach(n => { gs.idolSlots[n] = seasonConfig.idolsPerTribe || 1; });
    gs.sitOutHistory = {}; // back-to-back rule resets after a tribe swap
    twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));

  } else if (engineType === 'tribe-dissolve') {
    // Reduce tribe count by one — reshuffle all players into N-1 tribes
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 3) return; // need 3+ to dissolve
    const allActive = [...gs.activePlayers];
    for (let i = allActive.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allActive[i], allActive[j]] = [allActive[j], allActive[i]];
    }
    const numTribes = gs.tribes.length - 1;
    // Keep the first N-1 tribe names, drop the last one
    const keptNames = gs.tribes.slice(0, numTribes).map(t => t.name);
    const dissolvedName = gs.tribes[gs.tribes.length - 1].name;
    const perTribe = Math.floor(allActive.length / numTribes);
    gs.tribes = keptNames.map((name, i) => ({
      name,
      members: allActive.slice(i * perTribe, i === numTribes - 1 ? allActive.length : (i+1) * perTribe),
    }));
    if (seasonConfig.advantages?.idol?.enabled) keptNames.forEach(n => { gs.idolSlots[n] = seasonConfig.idolsPerTribe || 1; });
    gs.sitOutHistory = {};
    twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    twistObj.dissolvedTribe = dissolvedName;

  } else if (engineType === 'tribe-expansion') {
    // Add one new tribe — take ~2 players from each existing tribe to form it
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2 || gs.activePlayers.length < gs.tribes.length + 3) return;
    const allActive = [...gs.activePlayers];
    for (let i = allActive.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allActive[i], allActive[j]] = [allActive[j], allActive[i]];
    }
    const numTribes  = gs.tribes.length + 1;
    const perTribe   = Math.floor(allActive.length / numTribes);
    const newName    = 'New Tribe';
    const oldNames   = gs.tribes.map(t => t.name);
    const allNames   = [...oldNames, newName];
    gs.tribes = allNames.map((name, i) => ({
      name,
      members: allActive.slice(i * perTribe, i === numTribes - 1 ? allActive.length : (i+1) * perTribe),
    }));
    if (seasonConfig.advantages?.idol?.enabled) gs.tribes.forEach(t => { gs.idolSlots[t.name] = seasonConfig.idolsPerTribe || 1; });
    twistObj.newTribes  = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    twistObj.expansion  = true;
    twistObj.newTribeName = newName;

  } else if (engineType === 'kidnapping') {
    // Challenge winner tribe kidnaps a player from the losing tribe for one episode.
    // The kidnapped player skips tribal (safe) and spends the episode with the winner tribe.
    // They return to their original tribe next episode.
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    // This fires BEFORE the challenge — mark it pending. The actual kidnap happens post-challenge.
    twistObj.kidnappingPending = true;
    gs.kidnappingPending = true;

  } else if (engineType === 'first-impressions') {
    // Generate dock arrival data for Episode 1 VP
    if ((gs.episode || 0) === 0) generateDockArrivals(ep);
    executeFirstImpressions(ep, twistObj);

  } else if (engineType === 'schoolyard-pick') {
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const allActive = [...gs.activePlayers];
    const tribeNames = gs.tribes.map(t => t.name);

    // ── Select captains: top 2 individual challenge performers, fallback random ──
    let captains, captainSource;
    const _prevEp = gs.episodeHistory[gs.episodeHistory.length - 1];
    const _chalScores = _prevEp?.chalMemberScores;
    if (_chalScores && Object.keys(_chalScores).length >= 2) {
      const _ranked = Object.entries(_chalScores).filter(([n]) => allActive.includes(n)).sort((a, b) => b[1] - a[1]);
      // Pick best from each tribe if possible
      const _t1 = gs.tribes[0]?.name, _t2 = gs.tribes[1]?.name;
      const _best1 = _ranked.find(([n]) => gs.tribes.find(t => t.name === _t1)?.members.includes(n));
      const _best2 = _ranked.find(([n]) => gs.tribes.find(t => t.name === _t2)?.members.includes(n));
      captains = [_best1?.[0] || _ranked[0][0], _best2?.[0] || _ranked[1]?.[0] || _ranked[0][0]];
      if (captains[0] === captains[1]) captains[1] = _ranked.find(([n]) => n !== captains[0])?.[0] || allActive.find(n => n !== captains[0]);
      captainSource = 'challenge';
    } else {
      const _shuffled = [...allActive].sort(() => Math.random() - 0.5);
      captains = [_shuffled[0], _shuffled[1]];
      captainSource = 'random';
    }

    // ── Draft: alternating picks, mix-based on captain personality ──
    const pool = allActive.filter(n => !captains.includes(n));
    const teams = [[], []];
    teams[0].push(captains[0]);
    teams[1].push(captains[1]);
    const picks = [];
    let pickNum = 1;

    while (pool.length > 1) { // leave 1 for potential exile (odd)
      const capIdx = (pickNum - 1) % 2;
      const cap = captains[capIdx];
      const capS = pStats(cap);
      // Score each available player based on captain's personality
      const scored = pool.map(p => {
        let sc = 0;
        const cw = -(pStats(p).physical * 0.3 + pStats(p).endurance * 0.2 + pStats(p).mental * 0.15); // negative = stronger
        const bond = getBond(cap, p);
        if (capS.strategic >= 7) sc = cw * 0.6 + bond * 0.4;
        else if (capS.social >= 7) sc = bond * 0.6 + cw * 0.4;
        else if (capS.boldness >= 7) sc = Math.max(0, -bond) * 0.5 + threatScore(p) * 0.5;
        else sc = cw * 0.5 + bond * 0.5;
        return { name: p, score: sc + Math.random() * 0.5 };
      }).sort((a, b) => b.score - a.score);

      const picked = scored[0].name;
      pool.splice(pool.indexOf(picked), 1);
      teams[capIdx].push(picked);
      picks.push({ captain: cap, picked, pickNumber: pickNum });
      pickNum++;

      // If only 1 left and odd total, stop (that's the exile)
      if (pool.length === 1 && allActive.length % 2 !== 0) break;
      // If even, keep going until pool is empty
      if (pool.length === 1 && allActive.length % 2 === 0) {
        const lastCapIdx = pickNum % 2 === 1 ? 0 : 1;
        const lastPicked = pool[0];
        pool.splice(0, 1);
        teams[lastCapIdx].push(lastPicked);
        picks.push({ captain: captains[lastCapIdx], picked: lastPicked, pickNumber: pickNum });
        break;
      }
    }

    // ── Handle last picked / exile ──
    const isOdd = allActive.length % 2 !== 0;
    const exiled = isOdd && pool.length === 1 ? pool[0] : null;
    const lastPicked = picks[picks.length - 1]?.picked;

    // Emotional reaction (proportional + archetype)
    const _emotionTarget = exiled || lastPicked;
    let _emotionScores = { anger: 0, shame: 0, fire: 0 };
    if (_emotionTarget) {
      const eS = pStats(_emotionTarget);
      const eArch = eS.archetype || '';
      _emotionScores.anger = (10 - eS.temperament) * 0.1;
      _emotionScores.shame = eS.temperament * 0.08;
      _emotionScores.fire = eS.boldness * 0.1;
      // Archetype modifiers
      if (eArch === 'villain' || eArch === 'schemer') _emotionScores.anger += 0.3;
      if (eArch === 'hero') _emotionScores.shame += 0.2;
      if (eArch === 'hothead' || eArch === 'chaos-agent') _emotionScores.anger += 0.4;
      if (eArch === 'challenge-beast') _emotionScores.fire += 0.4;
      if (eArch === 'underdog') _emotionScores.fire += 0.3;
      if (eArch === 'floater') _emotionScores.shame += 0.3;
      if (eArch === 'social-butterfly') { _emotionScores.shame += 0.2; _emotionScores.anger += 0.1; }
    }
    const _dominantEmotion = _emotionScores.anger >= _emotionScores.shame && _emotionScores.anger >= _emotionScores.fire ? 'anger'
      : _emotionScores.fire >= _emotionScores.shame ? 'fire' : 'shame';

    // Bond consequences
    picks.forEach((p, i) => {
      const totalPicks = picks.length;
      if (i <= 1) addBond(p.captain, p.picked, 0.4); // first picks
      else if (i <= 3) addBond(p.captain, p.picked, 0.2);
      else if (i >= totalPicks - 2) { addBond(p.captain, p.picked, -0.2); addBond(captains.find(c => c !== p.captain), p.picked, -0.2); }
      else addBond(p.captain, p.picked, 0.1);
    });
    if (lastPicked) addBond(picks[picks.length - 1].captain, lastPicked, -0.5);

    // Assign tribes
    gs.tribes = tribeNames.map((name, i) => ({ name, members: [...teams[i]] }));

    // Handle exile — wire into exile island system for advantage search + VP screen
    if (exiled) {
      gs.activePlayers = gs.activePlayers.filter(p => p !== exiled);
      gs._schoolyardExiled = exiled;
      gs._schoolyardExiledEmotion = _dominantEmotion;
      gs._schoolyardExiledScores = _emotionScores;
      // Set exiledThisEp so the exile island advantage search fires
      gs.exiledThisEp = exiled;
      // Inject an exile-island twist object so the VP screen renders
      const _exileTwObj = { type: 'exile-island', catalogId: 'exile-island', name: 'Exile Island',
        exiled, exileChooser: null, exileChooserTribe: null, exileChooserMembers: null,
        schoolyardExile: true };
      ep.twists.push(_exileTwObj);
    }

    // Store data
    twistObj.schoolyardPick = true;
    twistObj.captains = [...captains];
    twistObj.captainSource = captainSource;
    twistObj.picks = picks;
    twistObj.lastPicked = lastPicked;
    twistObj.exiled = exiled;
    twistObj.dominantEmotion = _dominantEmotion;
    twistObj.emotionScores = _emotionScores;
    twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    ep.schoolyardPick = { captains: [...captains], captainSource, picks, lastPicked, exiled, dominantEmotion: _dominantEmotion, emotionScores: _emotionScores, newTribes: twistObj.newTribes };

  } else if (engineType === 'mutiny') {
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    const mutineers = [];
    gs.tribes.forEach(tribe => {
      tribe.members.forEach(name => {
        const others = gs.tribes.filter(t => t.name !== tribe.name);
        if (!others.length) return;
        const s = pStats(name);
        const emo = getPlayerState(name).emotional;

        // Reason 1: on the bottom — low bonds with own tribe, no alliance protection
        const ownBonds = tribe.members.filter(m=>m!==name).map(m => getBond(name, m));
        const ownAvg = ownBonds.length ? ownBonds.reduce((a,b)=>a+b,0) / ownBonds.length : 0;
        const inAlliance = (gs.namedAlliances||[]).some(a => a.active && a.members.includes(name)
          && a.members.some(m => m !== name && tribe.members.includes(m)));
        const onTheBottom = ownAvg <= 0 && !inAlliance;

        // Reason 2: has a specific close bond on another tribe (swap history, pre-game, journey)
        let pullTribe = null, pullPerson = null;
        others.forEach(t => {
          t.members.forEach(m => {
            const bond = getBond(name, m);
            if (bond >= 1.5 && (!pullPerson || bond > getBond(name, pullPerson))) {
              pullTribe = t; pullPerson = m;
            }
          });
        });

        // Reason 3: desperate/paranoid emotional state
        const isDesperate = emo === 'desperate' || emo === 'paranoid';

        // Decision: need at least one reason + boldness roll
        const reasons = (onTheBottom ? 1 : 0) + (pullPerson ? 1 : 0) + (isDesperate ? 1 : 0);
        if (reasons === 0) return;
        const chance = 0.10 + reasons * 0.10 + s.boldness * 0.02 + (s.loyalty <= 3 ? 0.10 : 0);
        if (Math.random() >= chance) return;

        // Pick destination: tribe with the pull person, or tribe with least hostility (randomize ties)
        let dest = pullTribe;
        if (!dest) {
          const _scored = others.map(t => ({
            tribe: t,
            avg: t.members.reduce((s2,m) => s2+getBond(name,m), 0) / Math.max(1, t.members.length) + Math.random() * 0.1,
          }));
          _scored.sort((a,b) => b.avg - a.avg);
          dest = _scored[0].tribe;
        }

        mutineers.push({ name, from: tribe.name, to: dest.name });
      });
    });
    // Bond consequences + narrative (before tribe mutation so we still have original composition)
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    mutineers.forEach(m => {
      const fromMembers = gs.tribes.find(t => t.name === m.from)?.members.filter(p => p !== m.name && gs.activePlayers.includes(p)) || [];
      const toMembers   = gs.tribes.find(t => t.name === m.to  )?.members.filter(p =>                  gs.activePlayers.includes(p)) || [];
      // Old tribe: -2 bond with defector (betrayal, even if involuntary)
      fromMembers.forEach(tm => addBond(m.name, tm, -2));
      // New tribe: boldest ally gets +1 (respects the gamble); others are suspicious
      const boldest = toMembers.slice().sort((a,b) => pStats(b).boldness - pStats(a).boldness)[0];
      if (boldest) addBond(m.name, boldest, 1);
      // Inject per-tribe narrative
      ep.twistNarrativeEvents[m.from] = { type: 'dispute', text: _pick([
        `The mat was still in sight when the weight of it settled in. ${m.name} had walked away. Nobody said anything for a long time.`,
        `Camp was quiet when they got back. ${m.name}'s spot was empty and everyone pretended not to notice.`,
        `${m.name} was gone. The tribe had seen it coming — it still stung.`,
      ]) };
      ep.twistNarrativeEvents[m.to] = { type: 'rumor', text: _pick([
        `${m.name} showed up at camp still wearing their old buff. The tribe welcomed them. The questions came later.`,
        `${m.name} walked in smiling. That smile didn't answer the obvious question: why them, why now, and who are they actually loyal to?`,
        `The tribe gained a player today. Whether they gained an ally was something nobody could answer yet.`,
      ]) };
    });
    mutineers.forEach(m => {
      gs.tribes = gs.tribes.map(t => ({
        ...t,
        members: t.name === m.from ? t.members.filter(p => p !== m.name)
                : t.name === m.to  ? [...t.members, m.name] : t.members,
      }));
    });
    twistObj.mutineers = mutineers;

  } else if (engineType === 'abduction') {
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    const stolen = [];
    const _alreadyTaken = new Set(); // prevent double-stealing
    gs.tribes.forEach(tribe => {
      const others = gs.tribes.filter(t => t.name !== tribe.name);
      if (!others.length) return;
      // Pick from the tribe with the most members (weaken the strongest)
      const source = [...others].sort((a,b) => b.members.length - a.members.length)[0];
      if (source.members.length < 2) return;
      const pool = source.members.filter(p => !_alreadyTaken.has(p));
      if (!pool.length) return;
      // Strategic pick: prefer strong players (weaken opponent) or players with existing bonds (easier to integrate)
      const pick = wRandom(pool, p => {
        const ts = threatScore(p);
        const bondWithTribe = tribe.members.reduce((s,m) => s + Math.max(0, getBond(p,m)), 0);
        return ts * 0.6 + bondWithTribe * 0.3 + Math.random() * 2;
      });
      _alreadyTaken.add(pick);
      stolen.push({ name: pick, from: source.name, to: tribe.name });
    });
    // Bond consequences, reasoning, and narrative (before tribe mutation so composition is still accurate)
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    stolen.forEach(s => {
      const p = pronouns(s.name);
      const ps = pStats(s.name);
      const fromMembers = gs.tribes.find(t => t.name === s.from)?.members.filter(m => m !== s.name && gs.activePlayers.includes(m)) || [];
      const toMembers   = gs.tribes.find(t => t.name === s.to  )?.members.filter(m =>                  gs.activePlayers.includes(m)) || [];
      const oldAvgBond = fromMembers.length ? fromMembers.reduce((sum,m) => sum + getBond(s.name, m), 0) / fromMembers.length : 0;
      const ts = threatScore(s.name);
      const bondWithNew = toMembers.reduce((sum,m) => sum + Math.max(0, getBond(s.name,m)), 0);

      // Reasoning: why did the tribe pick this player?
      s.reason = ts >= 7 ? `${s.name} is a high-value target — taking ${p.obj} weakens ${s.from} and adds firepower to ${s.to}.`
               : bondWithNew > 2 ? `${s.name} already has connections with members of ${s.to}. An easy integration.`
               : ps.physical >= 8 ? `${s.name} is a physical asset. ${s.to} needed the challenge strength.`
               : ps.strategic >= 8 ? `${s.name} is a strategic mind. ${s.to} wanted that brain on their side.`
               : ps.social >= 8 ? `${s.name} gets along with everyone. ${s.to} saw someone who'd fit right in.`
               : `${s.to} needed numbers. ${s.name} was available.`;

      // Old tribe: bond loss (losing a member hurts)
      fromMembers.forEach(tm => addBond(s.name, tm, -1));

      // Abducted player's reaction: depends on how they felt about old tribe
      const likedOldTribe = oldAvgBond >= 1.5;
      const hatedOldTribe = oldAvgBond <= -1;
      const isLoyal = ps.loyalty >= 7;
      const isAdaptable = ps.social >= 7 || ps.boldness >= 7;

      if (likedOldTribe && isLoyal) {
        // Angry about being taken — resists new tribe
        toMembers.forEach(tm => addBond(s.name, tm, -0.8));
        s.reaction = 'resists';
        ep.twistNarrativeEvents[s.to + '_abductee'] = { type: 'dispute', players: [s.name], text: _pick([
          `${s.name} doesn't hide it — ${p.sub} didn't want to be here. The loyalty to ${s.from} is written on ${p.pos} face. ${s.to} watches and takes note.`,
          `${s.name} sits apart from the group. ${p.Sub} had a tribe, had a plan, and someone else's decision just burned it down. The resentment is visible.`,
          `${s.name} barely speaks to anyone at ${s.to} camp. ${p.Pos} silence says everything — ${p.sub} ${p.sub==='they'?'were':'was'} taken from people ${p.sub} trusted and dropped with strangers.`,
        ]) };
      } else if (hatedOldTribe || (!likedOldTribe && isAdaptable)) {
        // Happy to leave — embraces new tribe
        toMembers.forEach(tm => addBond(s.name, tm, 0.8));
        s.reaction = 'embraces';
        ep.twistNarrativeEvents[s.to + '_abductee'] = { type: 'bond', players: [s.name], text: _pick([
          `${s.name} won't say it out loud, but being pulled from ${s.from} might be the best thing that's happened to ${p.obj} in this game. ${p.Sub} ${p.sub==='they'?'are':'is'} already making connections.`,
          `${s.name} settles in fast. Too fast, some might say. But the truth is — ${p.sub} needed a fresh start, and ${s.to} might be exactly that.`,
          `Within hours, ${s.name} looks more comfortable at ${s.to} camp than ${p.sub} ever did at ${s.from}. A change of scenery can change a game.`,
        ]) };
      } else {
        // Cautious — uncertain, trying to read the room
        toMembers.forEach(tm => { if (Math.random() < 0.4) addBond(s.name, tm, -0.5); });
        s.reaction = 'cautious';
        ep.twistNarrativeEvents[s.to + '_abductee'] = { type: 'doubt', players: [s.name], text: _pick([
          `${s.name} is polite but guarded. ${p.Sub} ${p.sub==='they'?'don\'t':'doesn\'t'} know these people, and they don't know ${p.obj}. Trust takes time — and time is a luxury.`,
          `${s.name} keeps ${p.pos} head down and watches. Not hostile, not warm. Just calculating. The new tribe reads it as either caution or threat.`,
          `${s.name} arrived with nothing — no allies, no information, no safety. ${p.Sub} ${p.sub==='they'?'are':'is'} starting from scratch, and the tribe can feel it.`,
        ]) };
      }

      // Old tribe narrative (the loss)
      ep.twistNarrativeEvents[s.from] = { type: 'doubt', text: _pick([
        `${s.name} was gone before they could say anything. The tribe was down a number and everyone felt it.`,
        `The other tribe just reached in and took ${s.name}. No vote, no warning. The camp felt different after that.`,
        `They couldn't stop it. ${s.name} left with ${s.to} and the tribe had to figure out how to move forward without them.`,
      ]) };
      // New tribe narrative (the arrival — general)
      ep.twistNarrativeEvents[s.to] = { type: 'rumor', text: _pick([
        `${s.name} arrived at camp. The tribe had chosen ${p.obj} — but ${p.sub} hadn't chosen them.`,
        `${s.name} showed up without warning. Everyone was polite. Everyone was watching.`,
        `There was a shift in energy when ${s.name} walked in. A new number. A new variable. The game just changed.`,
      ]) };
    });
    const _preAbductionTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    stolen.forEach(s => {
      gs.tribes = gs.tribes.map(t => ({
        ...t,
        members: t.name === s.from ? t.members.filter(p => p !== s.name)
                : t.name === s.to  ? [...t.members, s.name] : t.members,
      }));
    });
    twistObj.stolen = stolen;
    twistObj.newTribes = gs.tribes.map(t => ({ name: t.name, members: [...t.members] }));
    twistObj.oldTribes = _preAbductionTribes;

  // ── IMMUNITY / NO BOOT ─────────────────────────────────────────────
  } else if (engineType === 'double-safety') {
    twistObj.doubleSafety = true;

  } else if (engineType === 'shared-immunity') {
    twistObj.sharedImmunity = true;

  } else if (engineType === 'guardian-angel') {
    // Mark pending — resolve after challenge so immunity winner is excluded
    twistObj.guardianAngelPending = true;
    gs.guardianAngelPending = true;

  } else if (engineType === 'hero-duel') {
    // Participants determined post-challenge — mark pending
    twistObj.heroDuelPending = true;
    gs.heroDuelPending = true;

  // ── ELIMINATION ────────────────────────────────────────────────────
  } else if (engineType === 'double-elim') {
    ep.isDoubleElim = true;
    if (twist.type === 'double-elim') ep.announcedDoubleElim = true;

  } else if (engineType === 'double-tribal') {
    // Losing tribes merge into one council — requires 3+ tribes pre-merge
    if (gs.phase === 'pre-merge' && gs.tribes.length >= 3) ep.isDoubleTribal = true;

  } else if (engineType === 'multi-tribal') {
    // Each losing tribe votes independently — requires 3+ tribes pre-merge
    if (gs.phase === 'pre-merge' && gs.tribes.length >= 3) ep.isMultiTribal = true;

  } else if (engineType === 'fire-making') {
    ep.isFireMaking = true;

  } else if (engineType === 'penalty-vote') {
    if (gs.activePlayers.length < 2) return;
    // Target is assigned after the challenge resolves (last-place finisher)
    ep.penaltyVoteTwistPending = true; // flag — filled in post-challenge

  } else if (engineType === 'rock-draw') {
    // Force a rock draw this episode — ties skip re-vote and go straight to random elimination
    ep.forceRockDraw = true;

  } else if (engineType === 'open-vote') {
    // Votes are public — loyalty pressure increases, bold outliers still deviate
    ep.openVote = true;

  } else if (engineType === 'sudden-death') {
    // Sudden Death: last place in the challenge is auto-eliminated. No tribal.
    twistObj.suddenDeath = true;
    ep.isSuddenDeath = true;
    ep.noTribal = true; // skip tribal council

  } else if (engineType === 'slasher-night') {
    // Post-merge only; need at least 3 players for a meaningful slasher night
    if (!gs.isMerged || gs.activePlayers.length < 3) return;
    ep.isSlasherNight = true;

  } else if (engineType === 'triple-dog-dare') {
    // Post-merge only; need at least 3 players (original TDI episode had 3)
    if (!gs.isMerged || gs.activePlayers.length < 3) return;
    ep.isTripleDogDare = true;

  } else if (engineType === 'say-uncle') {
    // Guard: post-merge only (or merge episode — twists fire before merge check)
    const _suMerging = !gs.isMerged && gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
    if (!gs.isMerged && !_suMerging) return;
    if (gs.activePlayers.length < 3) return;
    ep.isSayUncle = true;

  } else if (engineType === 'lucky-hunt') {
    // Post-merge only (or merge episode); need at least 6 players for interesting hunt
    const _lhMerging = !gs.isMerged && gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
    if (!gs.isMerged && !_lhMerging) return;
    if (gs.activePlayers.length < 6) return;
    ep.isLuckyHunt = true;

  } else if (engineType === 'brunch-of-disgustingness') {
    if (!gs.isMerged && gs.activePlayers.length > (seasonConfig.mergeAt || 12)) return;
    if (gs.activePlayers.length < 4) return;
    ep.isBrunchOfDisgustingness = true;

    // Split into boys/girls teams based on pronouns
    const _brBoys = [], _brGirls = [];
    gs.activePlayers.forEach(name => {
      const pr = pronouns(name);
      if (pr.sub === 'he') _brBoys.push(name);
      else if (pr.sub === 'she') _brGirls.push(name);
      else (_brBoys.length <= _brGirls.length ? _brBoys : _brGirls).push(name);
    });

    // Balance teams — move 1-2 from larger to smaller if needed
    const _brCrossovers = [];
    while (Math.abs(_brBoys.length - _brGirls.length) > 1) {
      const larger = _brBoys.length > _brGirls.length ? _brBoys : _brGirls;
      const smaller = _brBoys.length > _brGirls.length ? _brGirls : _brBoys;
      const fromLabel = _brBoys.length > _brGirls.length ? 'boys' : 'girls';
      const toLabel = _brBoys.length > _brGirls.length ? 'girls' : 'boys';
      const candidate = larger.reduce((worst, name) => {
        const avgBond = larger.filter(n => n !== name).reduce((sum, n) => sum + getBond(name, n), 0) / Math.max(1, larger.length - 1);
        return avgBond < worst.avgBond ? { name, avgBond } : worst;
      }, { name: larger[0], avgBond: Infinity });
      larger.splice(larger.indexOf(candidate.name), 1);
      smaller.push(candidate.name);
      _brCrossovers.push({ name: candidate.name, from: fromLabel, to: toLabel });
    }

    ep.brunchTeams = { boys: [..._brBoys], girls: [..._brGirls], crossovers: _brCrossovers };

  } else if (engineType === 'phobia-factor') {
    // Pre-merge only, not episode 1, need 2+ tribes
    if (gs.isMerged || gs.tribes.length < 2) return;
    const epNum = (gs.episode || 0) + 1;
    if (epNum < 2) return;
    ep.isPhobiaFactor = true;

  } else if (engineType === 'cliff-dive') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isCliffDive = true;

  } else if (engineType === 'awake-a-thon') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isAwakeAThon = true;

  } else if (engineType === 'dodgebrawl') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isDodgebrawl = true;

  } else if (engineType === 'talent-show') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isTalentShow = true;

  } else if (engineType === 'sucky-outdoors') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isSuckyOutdoors = true;

  } else if (engineType === 'up-the-creek') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isUpTheCreek = true;

  } else if (engineType === 'paintball-hunt') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isPaintballHunt = true;

  } else if (engineType === 'hells-kitchen') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isHellsKitchen = true;

  } else if (engineType === 'trust-challenge') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    ep.isTrustChallenge = true;

  } else if (engineType === 'basic-straining') {
    // Both phases: pre-merge = team race, post-merge = individual immunity
    if (!gs.isMerged && gs.tribes.length < 2) return;
    if (gs.activePlayers.length < 4) return;
    ep.isBasicStraining = true;

  } else if (engineType === 'x-treme-torture') {
    if (gs.isMerged || gs.tribes.length < 2) return;
    if ((gs.episode || 0) + 1 < 2) return;
    ep.isXtremeTorture = true;

  } else if (engineType === 'cultural-reset') {
    const activePlayers = gs.activePlayers;
    twistObj.revealedAlliances = (gs.namedAlliances||[]).filter(a => a.active).map(a => a.name);
    twistObj.allianceOutcomes = {};
    twistObj.crackDecisions = [];

    // ── ALLIANCE SURVIVAL CHECK ──────────────────────────────────────
    (gs.namedAlliances||[]).filter(a => a.active).forEach(alliance => {
      const activeMembers = alliance.members.filter(m => activePlayers.includes(m));
      if (activeMembers.length <= 1) {
        alliance.active = false;
        twistObj.allianceOutcomes[alliance.name] = 'dissolved';
        return;
      }
      // Calculate avg bond between active members
      let bondSum = 0, bondCount = 0;
      for (let i = 0; i < activeMembers.length; i++) {
        for (let j = i + 1; j < activeMembers.length; j++) {
          bondSum += getBond(activeMembers[i], activeMembers[j]);
          bondCount++;
        }
      }
      const avgBond = bondCount > 0 ? bondSum / bondCount : 0;
      const recentBetrayals = (alliance.betrayals||[]).filter(b => b.ep >= ep.num - 3).length;

      if (avgBond >= 3 && recentBetrayals === 0) {
        // SURVIVES — public but intact
        twistObj.allianceOutcomes[alliance.name] = 'survived';
      } else if (avgBond < 1 || recentBetrayals >= 2) {
        // DISSOLVES
        alliance.active = false;
        twistObj.allianceOutcomes[alliance.name] = 'dissolved';
      } else {
        // CRACKS — members choose based on loyalty
        twistObj.allianceOutcomes[alliance.name] = 'cracked';
        const leavers = [];
        activeMembers.forEach(member => {
          const loyalty = pStats(member).loyalty || 5;
          let stays;
          if (loyalty >= 7) stays = true;
          else if (loyalty <= 4) stays = false;
          else stays = Math.random() < 0.5;
          twistObj.crackDecisions.push({ player: member, alliance: alliance.name, stayed: stays });
          if (!stays) leavers.push(member);
        });
        // Remove leavers from alliance
        leavers.forEach(leaver => {
          alliance.members = alliance.members.filter(m => m !== leaver);
          if (!alliance.quits) alliance.quits = [];
          alliance.quits.push(leaver);
          ep.allianceQuits = ep.allianceQuits || [];
          ep.allianceQuits.push({ player: leaver, alliance: alliance.name, reason: 'cultural-reset' });
        });
        // If 0-1 active members remain after cracking, dissolve
        const remaining = alliance.members.filter(m => activePlayers.includes(m));
        if (remaining.length <= 1) {
          alliance.active = false;
          twistObj.allianceOutcomes[alliance.name] = 'dissolved';
        }
      }
    });

    // ── DOUBLE-DIPPING EXPOSURE ──────────────────────────────────────
    twistObj.exposedPlayers = [];
    const stillActiveAlliances = (gs.namedAlliances||[]).filter(a => a.active);
    activePlayers.forEach(player => {
      const playerAlliances = stillActiveAlliances.filter(a => a.members.includes(player));
      if (playerAlliances.length < 2) return;
      // Conflict detection: do any of these alliances target each other's members?
      let conflicting = false;
      for (let i = 0; i < playerAlliances.length && !conflicting; i++) {
        for (let j = i + 1; j < playerAlliances.length && !conflicting; j++) {
          const aMembers = playerAlliances[i].members.filter(m => m !== player);
          const bMembers = playerAlliances[j].members.filter(m => m !== player);
          // Check if alliance A betrayed any member of alliance B or vice versa
          const aBetrayedB = (playerAlliances[i].betrayals||[]).some(b => bMembers.includes(b.target || b.player));
          const bBetrayedA = (playerAlliances[j].betrayals||[]).some(b => aMembers.includes(b.target || b.player));
          if (aBetrayedB || bBetrayedA) conflicting = true;
        }
      }
      const bondHit = conflicting ? -2.5 : -1.0;
      // Apply bond hit with all members of all alliances this player is in
      const allAffected = new Set();
      playerAlliances.forEach(a => a.members.filter(m => m !== player && activePlayers.includes(m)).forEach(m => allAffected.add(m)));
      allAffected.forEach(other => addBond(player, other, bondHit));
      twistObj.exposedPlayers.push({
        name: player,
        alliances: playerAlliances.map(a => a.name),
        conflicting
      });
    });

    // ── FREE AGENTS ──────────────────────────────────────────────────
    twistObj.freeAgents = activePlayers.filter(n =>
      !(gs.namedAlliances||[]).some(a => a.active && a.members.includes(n))
    );

    // ── PER-PLAYER PERSONALITY REACTIONS ─────────────────────────────
    twistObj.personalityReactions = [];
    activePlayers.forEach(name => {
      const s = pStats(name);
      const state = getPlayerState(name);
      const inAlliance = (gs.namedAlliances||[]).some(a => a.active && a.members.includes(name));
      const isExposed = twistObj.exposedPlayers.some(e => e.name === name);
      const wasInExposedAlliance = twistObj.revealedAlliances.some(aName => {
        const al = (gs.namedAlliances||[]).find(a => a.name === aName);
        return al && (al.members.includes(name) || (al.quits||[]).includes(name));
      });
      const _pr = pronouns(name);

      // Pick ONE primary reaction per player — priority order prevents contradictions
      let _reacted = false;

      // 1. Temperament <= 3 AND was in exposed alliance: EXPLODES (highest drama, takes priority)
      if (!_reacted && (s.temperament || 0) <= 3 && wasInExposedAlliance) {
        const enemies = activePlayers.filter(o => o !== name);
        if (enemies.length) {
          const target = enemies.sort((a, b) => getBond(name, a) - getBond(name, b))[0]; // confront worst enemy
          addBond(name, target, -1.0);
          twistObj.personalityReactions.push({ name, type: 'explodes', text: `${name} walked straight up to ${target}. "You knew? You knew and you said nothing?" The camp went quiet.` });
          _reacted = true;
        }
      }

      // 2. Bold 7+ AND isExposed: OWNS IT
      if (!_reacted && (s.boldness || 0) >= 7 && isExposed) {
        if (Math.random() < 0.5) {
          activePlayers.filter(o => o !== name).forEach(o => addBond(name, o, 0.5));
          twistObj.personalityReactions.push({ name, type: 'owns-it', text: `${name} stood up at camp and said it out loud: "Yeah, I was in both. And I'd do it again." The tribe respected the honesty.` });
        } else {
          if (!gs.blowupHeatNextEp) gs.blowupHeatNextEp = new Set();
          gs.blowupHeatNextEp.add(name);
          twistObj.personalityReactions.push({ name, type: 'owns-it', text: `${name} stood up at camp and said it out loud: "Yeah, I was in both. And I'd do it again." The tribe didn't forget that.` });
        }
        _reacted = true;
      }

      // 3. Loyal 7+ AND was in exposed alliance: DEVASTATED
      if (!_reacted && (s.loyalty || 0) >= 7 && wasInExposedAlliance) {
        state.emotional = 'paranoid';
        activePlayers.filter(o => o !== name).forEach(o => addBond(name, o, -0.3));
        twistObj.personalityReactions.push({ name, type: 'devastated', text: `${name} sat by the fire for an hour after the reset. Didn't talk to anyone.` });
        _reacted = true;
      }

      // 4. Strategic 7+: PIVOTS (approaches someone new)
      if (!_reacted && (s.strategic || 0) >= 7) {
        const nonAllied = activePlayers.filter(o => o !== name && !stillActiveAlliances.some(a => a.members.includes(name) && a.members.includes(o)));
        if (nonAllied.length) {
          const closest = nonAllied.reduce((best, o) => getBond(name, o) > getBond(name, best) ? o : best, nonAllied[0]);
          addBond(name, closest, 0.5);
          twistObj.personalityReactions.push({ name, type: 'pivot', text: `${name} pulled ${closest} aside within ten minutes of the reset. The new game starts now.` });
          _reacted = true;
        }
      }

      // 5. Not in any alliance: VINDICATED
      if (!_reacted && !inAlliance) {
        activePlayers.filter(o => o !== name).forEach(o => addBond(name, o, 0.5));
        twistObj.personalityReactions.push({ name, type: 'vindicated', text: `Nobody was looking at ${name} before the reset. Now everyone is. And for once, that's a good thing.` });
        _reacted = true;
      }

      // 6. Social <= 4: WITHDRAWS
      if (!_reacted && (s.social || 0) <= 4) {
        activePlayers.filter(o => o !== name).forEach(o => addBond(name, o, -0.5));
        state.emotional = 'uneasy';
        twistObj.personalityReactions.push({ name, type: 'withdrawn', text: `${name} disappeared after the reset. Found by the water. Alone.` });
        _reacted = true;
      }

      // 7. Temperament 7+: COMPOSED (fallback for calm players)
      if (!_reacted && (s.temperament || 0) >= 7) {
        twistObj.personalityReactions.push({ name, type: 'composed', text: `While the camp burned around ${_pr.obj}, ${name} sat still. Watching. Thinking. That composure is either admirable or terrifying.` });
        _reacted = true;
      }
    });

    // ── CAMP EVENT INJECTION ─────────────────────────────────────────
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const resetKey = gs.isMerged ? 'merge' : (gs.tribes.length ? gs.tribes[0].name : 'merge');
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[resetKey]) ep.campEvents[resetKey] = { pre: [], post: [] };
    const _crBlock = ep.campEvents[resetKey].pre;

    // Alliance outcome events
    Object.entries(twistObj.allianceOutcomes).forEach(([aName, outcome]) => {
      const al = (gs.namedAlliances||[]).find(a => a.name === aName);
      const alMembers = al ? al.members.filter(m => activePlayers.includes(m)) : [];
      if (outcome === 'survived') {
        _crBlock.push({ type: 'culturalResetSurvived', players: alMembers, text: `${aName} is still standing — and now the whole tribe knows it. That's either strength or a target.` });
      } else if (outcome === 'cracked') {
        const stayed = twistObj.crackDecisions.filter(d => d.alliance === aName && d.stayed).map(d => d.player);
        const left = twistObj.crackDecisions.filter(d => d.alliance === aName && !d.stayed).map(d => d.player);
        const leftText = left.length ? left.join(' and ') + ' walked away' : 'cracks formed';
        const stayText = stayed.length ? stayed.join(' and ') + ' stayed' : 'nobody recommitted';
        _crBlock.push({ type: 'culturalResetCracked', players: [...stayed, ...left], text: `${aName} cracked under the pressure. ${leftText}. ${stayText}. The alliance is half of what it was.` });
      } else {
        _crBlock.push({ type: 'culturalResetDissolved', players: alMembers, text: `${aName} is done. The bonds weren't strong enough to survive the light.` });
      }
    });

    // Exposed player events
    twistObj.exposedPlayers.forEach(exp => {
      const _pr = pronouns(exp.name);
      _crBlock.push({ type: 'culturalResetExposure', players: [exp.name], text: `${exp.name} was in ${exp.alliances.join(' and ')}. The tribe connected the dots in seconds.${exp.conflicting ? ` Voting ${_pr.obj}r allies out with one hand, shaking their hands with the other.` : ` Playing multiple angles — strategy, not betrayal. But trust took a hit anyway.`}` });
    });

    // Free agent / vindicated events
    twistObj.freeAgents.forEach(name => {
      const _pr = pronouns(name);
      _crBlock.push({ type: 'culturalResetVindicated', players: [name], text: `${name} wasn't in any alliance. After the reset, that's the safest position in the game.` });
    });

    // Personality reaction events
    twistObj.personalityReactions.forEach(r => {
      const evtType = r.type === 'pivot' ? 'culturalResetPivot'
                    : r.type === 'explodes' ? 'culturalResetBlowup'
                    : r.type === 'vindicated' ? 'culturalResetVindicated'
                    : r.type === 'owns-it' ? 'culturalResetExposure'
                    : r.type === 'devastated' ? 'culturalResetDissolved'
                    : r.type === 'withdrawn' ? 'culturalResetDissolved'
                    : 'culturalResetPivot';
      // Skip vindicated — already injected above via free agents
      if (r.type === 'vindicated') return;
      _crBlock.push({ type: evtType, players: [r.name], text: r.text });
    });

    // Narrative summary event
    ep.twistNarrativeEvents[resetKey] = { type: 'culturalResetExposure', text: _pick([
      `Every active alliance was exposed at once. The cultural reset put every secret on the table and forced every player to pick a side — or stand alone.`,
      `The reset forced a kind of brutal honesty the game hadn't seen yet. Alliances that had been whispered about were suddenly public. Camp felt different after that.`,
      `No secrets survived the cultural reset. The tribe was reset to zero — same people, new rules. The scramble was immediate.`,
    ]) };

  // ── RETURNS ────────────────────────────────────────────────────────
  } else if (engineType === 'returning-player') {
    // ── RETURNING-PLAYER WEIGHT FUNCTIONS ──
    const _rpWeightFns = {
      'random': (name) => Math.max(0.1, pStats(name).strategic * 0.3 + Math.random() * 3),
      'unfinished-business': (name) => {
        let w = 0.1;
        const bondStrengths = gs.activePlayers.map(p => Math.abs(getBond(name, p)));
        w += (Math.max(...bondStrengths, 0)) * 1.5;
        const elimEp = gs.episodeHistory.find(h => h.eliminated === name || (h.eliminatedPlayers||[]).includes(name));
        if (elimEp) {
          const theirVote = (elimEp.votingLog || []).find(v => v.voter === name);
          if (theirVote && theirVote.voted !== name) w += 2;
        }
        return Math.max(0.1, w + Math.random() * 0.5);
      },
      'entertainment': (name) => {
        let w = 0.1;
        const s = pStats(name);
        w += s.social * 0.4;
        if ((gs.showmances || []).some(sh => sh.pair?.includes(name))) w += 3;
        if ((gs.romanticSparks || []).some(sp => sp.pair?.includes(name) || sp.a === name || sp.b === name)) w += 1.5;
        w += s.boldness * 0.2;
        return Math.max(0.1, w + Math.random() * 0.5);
      },
      'strategic-threat': (name) => {
        let w = 0.1;
        const s = pStats(name);
        w += s.strategic * 0.5;
        const activeAlliances = (gs.namedAlliances || []).filter(a =>
          a.members.includes(name) && a.members.some(m => m !== name && gs.activePlayers.includes(m))
        );
        w += activeAlliances.length * 1.5;
        const enemies = gs.activePlayers.filter(p => getBond(name, p) <= -3);
        w += enemies.length * 0.5;
        return Math.max(0.1, w + Math.random() * 0.5);
      },
      'underdog': (name) => {
        let w = 0.1;
        const elimEp = gs.episodeHistory.find(h => h.eliminated === name || (h.eliminatedPlayers||[]).includes(name));
        if (elimEp) {
          const elimEpNum = elimEp.num || 1;
          const totalEps = gs.episodeHistory.length || 1;
          w += (1 - elimEpNum / totalEps) * 5; // earlier elimination = higher underdog score
        }
        const s = pStats(name);
        w += (10 - s.strategic) * 0.2;
        w += (10 - s.physical) * 0.1;
        return Math.max(0.1, w + Math.random() * 0.5);
      },
    };
    const returnCount = twist.returnCount || 1;
    const returnReasons = twist.returnReasons || ['random'];
    let eligible = gs.eliminated.filter(p => !gs.riPlayers.includes(p) && !(gs.jury||[]).includes(p));
    if (!eligible.length) { twistObj.noReturn = true; return; }

    const returnees = [];
    for (let i = 0; i < returnCount; i++) {
      if (!eligible.length) break;
      const reason = returnReasons[i] || 'random';
      const weightFn = _rpWeightFns[reason] || _rpWeightFns['random'];
      const picked = wRandom(eligible, weightFn);
      returnees.push({ name: picked, reason });
      eligible = eligible.filter(p => p !== picked);
    }

    if (!returnees.length) { twistObj.noReturn = true; return; }
    twistObj.returnees = returnees;
    twistObj.returnee = returnees[0].name; // backward compat alias

    // Update game state for each returnee
    returnees.forEach(({ name: returnee }) => {
      gs.eliminated = gs.eliminated.filter(p => p !== returnee);
      gs.activePlayers.push(returnee);

      // Pre-merge: join smallest tribe (recalculated each time for distribution)
      if (gs.phase === 'pre-merge' && gs.tribes.length) {
        const smallest = [...gs.tribes].sort((a,b) => a.members.length - b.members.length)[0];
        smallest.members.push(returnee);
      }

      // Bond adjustments
      Object.keys(gs.bonds).forEach(k => {
        if (k.includes(returnee) && gs.bonds[k] < -1) gs.bonds[k] = -1;
      });
      gs.activePlayers.filter(p => p !== returnee).forEach(p => {
        const b = getBond(returnee, p);
        if (b >= 4) addBond(returnee, p, 1);
        else if (b <= -3) addBond(returnee, p, -0.5);
      });
    });

    // Narrative events — one per returnee, keyed by their tribe
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'the drama they bring', 'strategic-threat':'the threat they pose', 'underdog':'a second shot', 'random':'sheer will' };
    returnees.forEach(({ name: returnee, reason }, _ri) => {
      const returnTribeKey = gs.phase === 'pre-merge' && gs.tribes.length
        ? ([...gs.tribes].find(t => t.members.includes(returnee))?.name || 'merge')
        : (gs.mergeName || 'merge');
      const reasonText = _rpReasonLabel[reason] || 'sheer will';
      // Use plain tribe key for first returnee (matches camp event lookup), suffix for extras
      const narrativeKey = _ri === 0 ? returnTribeKey : returnTribeKey + ':return-' + _ri;
      ep.twistNarrativeEvents[narrativeKey] = { type: 'rumor', text: _pick([
        `${returnee} walked back into camp — driven by ${reasonText}. Some faces lit up. Others went very still.`,
        `${returnee} was back, and everyone knew why: ${reasonText}. The game had moved on without them — and now it had to make room again.`,
        `The tribe had voted ${returnee} out. Now they were standing right there, fueled by ${reasonText}. The conversations that followed were careful.`,
      ]) };
    });

  } else if (engineType === 'spirit-island') {
    const jury = gs.jury || [];
    if (!jury.length) { twistObj.noReturn = true; return; }

    // ── VISITOR SELECTION: weighted by story potential ──
    const _siScores = jury.map(j => {
      let score = 0;
      // Strongest bond (positive OR negative) with an active player
      const _siBonds = gs.activePlayers.map(p => Math.abs(getBond(j, p)));
      score += (Math.max(..._siBonds, 0)) * 2;
      // Unfinished business: was blindsided by someone still in the game
      const _siElimEp = gs.episodeHistory.find(h => h.eliminated === j);
      if (_siElimEp) {
        const _siVoters = (_siElimEp.votingLog || []).filter(v => v.voted === j).map(v => v.voter);
        const _siBetrayer = _siVoters.find(v => gs.activePlayers.includes(v) && getBond(j, v) <= -3);
        if (_siBetrayer) score += 3;
      }
      // Time on jury — more episodes watching = more intel to share
      const _siJuryEps = gs.episodeHistory.filter(h => h.gsSnapshot?.jury?.includes(j)).length;
      score += _siJuryEps * 0.5;
      score += Math.random() * 2;
      return { name: j, score };
    }).sort((a, b) => b.score - a.score);
    const spirit = _siScores[0].name;
    const _siPr = pronouns(spirit);
    const _siS = pStats(spirit);
    twistObj.spiritVisitor = spirit;

    // ── FIND KEY RELATIONSHIPS ──
    const _siClosest = gs.activePlayers.slice().sort((a, b) => getBond(spirit, b) - getBond(spirit, a))[0];
    const _siClosestBond = _siClosest ? getBond(spirit, _siClosest) : 0;
    twistObj.spiritClosest = _siClosest || null;
    // Find betrayer: active player who voted them out AND bond <= -3
    const _siElimEp = gs.episodeHistory.find(h => h.eliminated === spirit);
    const _siVoters = _siElimEp ? (_siElimEp.votingLog || []).filter(v => v.voted === spirit).map(v => v.voter) : [];
    const _siBetrayer = _siVoters.find(v => gs.activePlayers.includes(v) && getBond(spirit, v) <= -3) || null;
    twistObj.spiritBetrayer = _siBetrayer;

    // ── BOND CONSEQUENCES ──
    // Closest ally: +1.0 reunion
    if (_siClosest && _siClosestBond >= 2) addBond(spirit, _siClosest, 1.0);
    // Other allies: +0.3 warm feelings
    gs.activePlayers.forEach(p => {
      if (p === _siClosest) return;
      if (getBond(spirit, p) >= 1) addBond(spirit, p, 0.3);
    });
    // Strategic players suspicious of whoever the visitor spent time with
    if (_siClosest) {
      gs.activePlayers.forEach(p => {
        if (p === _siClosest) return;
        if (pStats(p).strategic >= 7 && Math.random() < 0.3) addBond(p, _siClosest, -0.3);
      });
    }

    // ── CONFRONTATION (personality-driven) ──
    let _siConfrontation = null;
    if (_siBetrayer) {
      const _siBetBond = getBond(spirit, _siBetrayer);
      const _siBetPr = pronouns(_siBetrayer);
      // Proportional: explosive chance = boldness + inverse temperament
      const _explosiveChance = _siS.boldness * 0.08 + (10 - _siS.temperament) * 0.06;
      if (Math.random() < _explosiveChance) {
        // Public confrontation — explosive
        _siConfrontation = { type: 'explosive', betrayer: _siBetrayer };
        addBond(spirit, _siBetrayer, -1.5);
        gs.activePlayers.forEach(p => {
          if (p === _siBetrayer) return;
          if (getBond(p, spirit) >= 1) addBond(p, _siBetrayer, -0.5);
        });
      } else if (Math.random() < _siS.strategic * 0.08) {
        // Quiet tension — channels anger into extra intel for ally
        _siConfrontation = { type: 'quiet', betrayer: _siBetrayer };
        // No public bond damage, but visitor tells ally about the betrayer
      } else {
        // Avoidance — awkward silence
        _siConfrontation = { type: 'avoidance', betrayer: _siBetrayer };
        addBond(spirit, _siBetrayer, -0.3);
      }
      twistObj.spiritConfrontation = _siConfrontation;
    }

    // ── INTEL DROP (to whoever the visitor gravitates toward — always fires if there's a closest) ──
    let _siIntel = null;
    if (_siClosest) {
      // Scan jury sentiment: who do they respect, who do they resent?
      const _siJuryScores = gs.activePlayers.map(p => {
        const avgJuryBond = jury.reduce((s, j) => s + getBond(j, p), 0) / Math.max(jury.length, 1);
        return { name: p, avgBond: avgJuryBond };
      }).sort((a, b) => b.avgBond - a.avgBond);
      const _siRespected = _siJuryScores[0];
      const _siResented = _siJuryScores[_siJuryScores.length - 1];
      const _siGap = _siRespected.avgBond - _siResented.avgBond;
      const _siIntelExpiry = (gs.episode || 0) + 1 + 3; // intel lasts 3 episodes then fades
      if (_siGap >= 2) {
        // Clear jury favorite and goat — share the more useful one
        if (_siRespected.name !== _siClosest) {
          _siIntel = { type: 'jury-respects', target: _siRespected.name, avgBond: _siRespected.avgBond, expires: _siIntelExpiry };
        } else {
          _siIntel = { type: 'jury-resents', target: _siResented.name, avgBond: _siResented.avgBond, expires: _siIntelExpiry };
        }
      } else {
        _siIntel = { type: 'jury-split', expires: _siIntelExpiry };
      }
      // If confrontation was 'quiet' (strategic visitor), they also drop betrayer intel
      if (_siConfrontation?.type === 'quiet') {
        _siIntel = _siIntel || {};
        _siIntel.betrayerWarning = _siBetrayer;
      }
      twistObj.spiritIntel = _siIntel;
      // Flag the ally so they can use this intel in future targeting
      if (!gs.spiritIntel) gs.spiritIntel = {};
      gs.spiritIntel[_siClosest] = _siIntel;
    }

    // ── CAMP EVENTS ──
    ep.spiritIslandEvents = [];
    // 1. Arrival
    ep.spiritIslandEvents.push({ type: 'spirit-arrival', players: [spirit], text: _pick([
      `${spirit} walks back into camp. The game stopped, just for a second. Then the calculations began.`,
      `A figure appears on the path. ${spirit}. The jury member is here for one day. The tribe freezes.`,
      `Nobody expected to see ${spirit} again. Yet here ${_siPr.sub} ${_siPr.sub==='they'?'are':'is'}, walking into camp like ${_siPr.sub} never left. The tribe doesn't know whether to hug ${_siPr.obj} or hide.`,
    ]), badgeText: 'Spirit Island', badgeClass: 'gold' });

    // 2. Reunion, Tension, or Observation (with closest bond — always fires)
    if (_siClosest) {
      const _siClPr = pronouns(_siClosest);
      if (_siClosestBond >= 2) {
        ep.spiritIslandEvents.push({ type: 'spirit-reunion', players: [spirit, _siClosest], text: _pick([
          `${spirit} and ${_siClosest} find each other almost immediately. The conversation is quiet, private, and longer than anyone expected. The tribe watches from a distance.`,
          `${_siClosest} sees ${spirit} and the relief is visible. They sit together at the fire. Whatever is said, nobody else hears. But the bond is obvious.`,
          `${spirit} pulls ${_siClosest} aside. "I need to tell you something." ${_siClosest} listens. When they come back, ${_siClPr.sub} ${_siClPr.sub==='they'?'look':'looks'} different.`,
        ]), badgeText: 'Reunion', badgeClass: 'green' });
      } else if (_siClosestBond <= -2) {
        ep.spiritIslandEvents.push({ type: 'spirit-tension', players: [spirit, _siClosest], text: _pick([
          `${spirit} and ${_siClosest} exist in the same camp all day without speaking. The silence is deafening. Everyone notices.`,
          `${spirit} looks at ${_siClosest} exactly once. That look says everything. ${_siClosest} pretends not to see it.`,
        ]), badgeText: 'Tension', badgeClass: 'red' });
      } else {
        // Neutral/weak bond — the visitor still gravitates toward someone and observes the game
        ep.spiritIslandEvents.push({ type: 'spirit-reunion', players: [spirit, _siClosest], text: _pick([
          `${spirit} gravitates toward ${_siClosest} — not out of loyalty, but familiarity. They talk about the game like it's already a story being told about someone else.`,
          `${spirit} sits with ${_siClosest} at the fire. The conversation is careful, measured. Both are feeling each other out. The tribe watches.`,
          `${spirit} and ${_siClosest} end up on the same work duty. By the end of the afternoon, something has shifted — not a bond exactly, but an understanding.`,
        ]), badgeText: 'Reconnection', badgeClass: '' });
      }
    }

    // 3a. Game observation — the visitor watches the dynamics (always fires)
    const _siPowerPlayer = gs.activePlayers.slice().sort((a, b) => threatScore(b) - threatScore(a))[0];
    if (_siPowerPlayer && _siPowerPlayer !== _siClosest) {
      ep.spiritIslandEvents.push({ type: 'spirit-observation', players: [spirit, _siPowerPlayer], text: _pick([
        `${spirit} watches the tribe all day. ${_siPr.Sub} see${_siPr.sub==='they'?'':'s'} things differently from the outside. ${_siPowerPlayer} is running this game — and ${spirit} is the only one not pretending otherwise.`,
        `From the jury bench, the picture is clearer. ${spirit} watches ${_siPowerPlayer} work the camp and ${_siPr.sub} ${_siPr.sub==='they'?'see':'sees'} exactly what everyone on the inside is too close to notice.`,
        `${spirit} spends the day observing. ${_siPr.Sub} notice${_siPr.sub==='they'?'':'s'} who defers to whom, who avoids eye contact, who controls the conversation. ${_siPowerPlayer}'s name keeps coming up — in whispers, in strategy, in fear.`,
      ]), badgeText: 'Observation', badgeClass: '' });
    } else {
      ep.spiritIslandEvents.push({ type: 'spirit-observation', players: [spirit], text: _pick([
        `${spirit} sits at the edge of camp and watches. The game looks different from the outside. Smaller. More fragile. Every alliance has a crack ${_siPr.sub} can see from here.`,
        `One day back and ${spirit} can already see the fault lines. The jury has been talking. They all have opinions. And now ${spirit} has seen whether those opinions match reality.`,
      ]), badgeText: 'Observation', badgeClass: '' });
    }

    // 3b. Confrontation (if personality triggered it)
    if (_siConfrontation) {
      const _siBetPr = pronouns(_siBetrayer);
      if (_siConfrontation.type === 'explosive') {
        ep.spiritIslandEvents.push({ type: 'spirit-confrontation', players: [spirit, _siBetrayer], text: _pick([
          `${spirit} walks up to ${_siBetrayer} in front of everyone. "You know what you did." ${_siBetrayer} opens ${_siBetPr.pos} mouth. ${spirit} doesn't let ${_siBetPr.obj} finish. The tribe watches in silence.`,
          `${spirit} has been waiting for this. ${_siPr.Sub} corner${_siPr.sub==='they'?'':'s'} ${_siBetrayer} at the fire and the whole camp hears it. Every word. ${_siBetrayer} has nowhere to go.`,
          `"You wrote my name." ${spirit} says it to ${_siBetrayer}'s face, in front of the entire tribe. ${_siBetrayer} doesn't deny it. The damage is done — not to ${spirit}, who's already gone. To ${_siBetrayer}'s reputation.`,
        ]), badgeText: 'Confrontation', badgeClass: 'red' });
      } else if (_siConfrontation.type === 'quiet') {
        ep.spiritIslandEvents.push({ type: 'spirit-confrontation', players: [spirit, _siBetrayer], text: _pick([
          `${spirit} sees ${_siBetrayer} across camp. ${_siPr.Sub} say${_siPr.sub==='they'?'':'s'} nothing. But later, in private with ${_siClosest}: "Watch ${_siBetrayer}. I'm telling you."`,
          `${spirit} doesn't give ${_siBetrayer} the satisfaction of a scene. Instead, ${_siPr.sub} sit${_siPr.sub==='they'?'':'s'} with ${_siClosest} and quietly dismantles ${_siBetrayer}'s game — every move, every lie, laid out in detail.`,
        ]), badgeText: 'Quiet Warning', badgeClass: 'gold' });
      } else {
        ep.spiritIslandEvents.push({ type: 'spirit-confrontation', players: [spirit, _siBetrayer], text: _pick([
          `${spirit} and ${_siBetrayer} pass each other twice without speaking. The tribe reads the body language and draws conclusions.`,
          `${spirit} avoids ${_siBetrayer} all day. It's noticeable. The tribe files it away.`,
        ]), badgeText: 'Unfinished Business', badgeClass: '' });
      }
    }

    // 4. Intel moment (if ally received intel)
    if (_siIntel && _siClosest) {
      const _intelPr = pronouns(_siClosest);
      if (_siIntel.type === 'jury-respects') {
        ep.spiritIslandEvents.push({ type: 'spirit-intel', players: [spirit, _siClosest], text:
          `Before leaving, ${spirit} whispers to ${_siClosest}: "The jury respects ${_siIntel.target}. If ${_siIntel.target} makes it to the end, nobody else has a shot." ${_siClosest} nods slowly.`,
        badgeText: 'Jury Intel', badgeClass: 'gold' });
      } else if (_siIntel.type === 'jury-resents') {
        ep.spiritIslandEvents.push({ type: 'spirit-intel', players: [spirit, _siClosest], text:
          `${spirit} pulls ${_siClosest} close. "The jury can't stand ${_siIntel.target}. If you're sitting next to ${_siIntel.target} at the end, you win." ${_siClosest} files it away.`,
        badgeText: 'Jury Intel', badgeClass: 'gold' });
      } else if (_siIntel.type === 'jury-split') {
        ep.spiritIslandEvents.push({ type: 'spirit-intel', players: [spirit, _siClosest], text:
          `"It's wide open," ${spirit} tells ${_siClosest}. "The jury doesn't have a favorite. Whoever makes the last big move wins this thing."`,
        badgeText: 'Jury Intel', badgeClass: 'gold' });
      }
    }

    // 5. Departure
    ep.spiritIslandEvents.push({ type: 'spirit-departure', players: [spirit], text: _pick([
      `${spirit} leaves at sunset. ${_siPr.Sub} wave${_siPr.sub==='they'?'':'s'} once. The tribe watches ${_siPr.obj} go. The information stays.`,
      `${spirit} walks back down the path. One day. That's all the game gave ${_siPr.obj}. But the ripples from that day will last the rest of the season.`,
      `"Good luck." ${spirit} says it to the group. But ${_siPr.sub} ${_siPr.sub==='they'?'are':'is'} looking at ${_siClosest || 'nobody in particular'} when ${_siPr.sub} say${_siPr.sub==='they'?'':'s'} it.`,
    ]), badgeText: 'Departure', badgeClass: '' });

  } else if (engineType === 'second-chance') {
    // Incompatible with RI/Rescue Island and requires popularity
    if (seasonConfig.ri) { twistObj.blocked = true; twistObj.blockedReason = 'RI active'; return; }
    if (!seasonConfig.popularityEnabled) { twistObj.blocked = true; twistObj.blockedReason = 'popularity disabled'; return; }
    const _scElim = gs.eliminated.filter(p => !gs.riPlayers?.includes(p)); // jury members CAN return via second-chance
    if (!_scElim.length) { twistObj.noReturn = true; return; }
    // Fan vote: popularity is THE primary driver — this is a fan vote, fans vote for who they like
    const _scScores = _scElim.map(name => {
      let score = 0;
      // Popularity is the dominant factor — fans vote for their favorite
      const pop = gs.popularity?.[name] || 0;
      score += pop * 1.0; // raw popularity score IS the fan vote
      // Small tiebreakers when popularity is close
      score += Math.random() * 1.5; // vote variance (real fan votes aren't perfectly ordered)
      return { name, score, popularity: pop };
    }).sort((a, b) => b.score - a.score);
    const returnee = _scScores[0].name;
    twistObj.returnee = returnee;
    // Convert scores to vote percentages for display
    const _scTotalScore = _scScores.reduce((s, r) => s + Math.max(0, r.score), 0) || 1;
    twistObj.fanVoteResults = _scScores.map(s => ({ name: s.name, pct: Math.round(s.score / _scTotalScore * 100), popularity: s.popularity }));
    // Return the player to the game
    gs.eliminated = gs.eliminated.filter(p => p !== returnee);
    gs.jury = (gs.jury || []).filter(p => p !== returnee); // remove from jury if they were on it
    gs.activePlayers.push(returnee);
    if (gs.phase === 'pre-merge' && gs.tribes.length) {
      const smallest = [...gs.tribes].sort((a,b) => a.members.length - b.members.length)[0];
      smallest.members.push(returnee);
    }
    // Soften extreme negative bonds (time away shifts perspective)
    Object.keys(gs.bonds).forEach(k => {
      if (k.includes(returnee) && gs.bonds[k] < -1) gs.bonds[k] = -1;
    });
    // Ally reunion + enemy wariness
    gs.activePlayers.filter(p => p !== returnee).forEach(p => {
      const b = getBond(returnee, p);
      if (b >= 4) addBond(returnee, p, 1.0);
      else if (b <= -3) addBond(returnee, p, -0.5);
    });
    if (gs.playerStates?.[returnee]) gs.playerStates[returnee].emotional = 'confident';

  } else if (engineType === 'ri-duel') {
    twistObj.forcedRIDuel = true;

  // ── ADVANTAGES ─────────────────────────────────────────────────────
  } else if (engineType === 'exile-island') {
    if (gs.activePlayers.length < 3) return;
    // Skip if schoolyard pick already exiled someone this episode
    if (ep.schoolyardPick?.exiled) return;
    // Selection happens post-challenge: winner picks (pre-merge) or immunity winner picks (post-merge)
    ep.exileIslandPending = true;

  } else if (engineType === 'journey') {
    // Force a journey this episode regardless of cfg.journey setting
    gs.journeyForcedThisEp = true;

  // legacy-awakens removed — Legacy auto-activates in checkIdolPlays

  // amulet-activate removed — Amulet power scales automatically via handleAdvantageInheritance

  } else if (engineType === 'idol-wager') {
    // All idol holders are offered the wager — each decides independently
    const idols = (gs.advantages||[]).filter(a => a.type === 'idol' && gs.activePlayers.includes(a.holder));
    twistObj.idolWagerResults = [];
    idols.forEach(adv => {
      const holder = adv.holder;
      const s = pStats(holder);
      const _arch = players.find(p => p.name === holder)?.archetype || '';
      const emotional = getPlayerState(holder)?.emotional || 'content';
      // Decision: proportional with boldness, inversely with strategic
      const _archBonus = _arch === 'hero' ? 0.15 : _arch === 'villain' ? 0.10 : 0;
      const _emotBonus = emotional === 'desperate' ? 0.20 : emotional === 'confident' ? 0.10 : 0;
      const _wagerChance = s.boldness * 0.08 + (10 - s.strategic) * 0.03 + _archBonus + _emotBonus;
      const _willWager = Math.random() < Math.min(0.85, _wagerChance);

      if (!_willWager) {
        twistObj.idolWagerResults.push({ holder, decision: 'declined' });
        return;
      }

      // Challenge: tests WEAKEST stat (physical/endurance/mental)
      const _chalStats = [
        { key: 'physical', val: s.physical },
        { key: 'endurance', val: s.endurance },
        { key: 'mental', val: s.mental },
      ].sort((a, b) => a.val - b.val);
      const _weakest = _chalStats[0]; // lowest stat
      const _secondWeak = _chalStats[1];
      const _chalNames = { physical: 'Obstacle Sprint', endurance: 'Endurance Hold', mental: 'Speed Puzzle' };
      const _chalDescs = { physical: 'Raw physicality under pressure.', endurance: 'Hold on longer than the idol is worth.', mental: 'Solve it before time runs out.' };
      const _score = _weakest.val * 0.6 + _secondWeak.val * 0.3 + Math.random() * 3;
      const _won = _score >= 5.0;

      if (_won) {
        adv.superIdol = true;
        twistObj.idolWagerResults.push({ holder, decision: 'wagered', won: true,
          challenge: _chalNames[_weakest.key], challengeStat: _weakest.key, score: Math.round(_score * 10) / 10 });
        twistObj.idolWagerWinner = holder; // backward compat
      } else {
        gs.advantages = gs.advantages.filter(a => a !== adv);
        twistObj.idolWagerResults.push({ holder, decision: 'wagered', won: false,
          challenge: _chalNames[_weakest.key], challengeStat: _weakest.key, score: Math.round(_score * 10) / 10 });
        twistObj.idolWagerLoser = holder; // backward compat
      }
    });
    if (!idols.length) twistObj.idolWagerResults.push({ decision: 'no-idols' });

  // ── THREE GIFTS ──────────────────────────────────────────────────
  } else if (engineType === 'three-gifts') {
    if (gs.phase !== 'pre-merge' || gs.tribes.length < 2) return;
    // Nominate one player per tribe (socially prominent players are typically chosen)
    const nominees = [];
    const summitNomDrama = [];
    gs.tribes.forEach(tribe => {
      const pool = tribe.members.filter(p => gs.activePlayers.includes(p));
      if (!pool.length) return;
      const weightFn = n => { const s = pStats(n); return s.social * 0.5 + s.boldness * 0.3 + s.strategic * 0.2 + 1; };
      const { nominee, dramaEvent } = pickNomineeWithDrama(pool, weightFn);
      if (!nominee) return;
      nominees.push({ player: nominee, tribe: tribe.name });
      if (dramaEvent) summitNomDrama.push({ player: nominee, tribe: tribe.name, event: dramaEvent });
    });
    if (nominees.length < 2) return;

    // Each nominee independently chooses a gift
    const giftResults = nominees.map(({ player, tribe }) => {
      const s = pStats(player);
      // Gift 1 (tribal survival kit): loyal, social players favour tribe
      const w1 = s.loyalty * 1.5 + s.social * 1.0;
      // Gift 2 (idol clue): strategic, intuitive players want the edge
      const w2 = s.intuition * 1.5 + s.strategic * 1.0;
      // Gift 3 (Immunity Totem): bold, disloyal players go for themselves
      const w3 = s.boldness * 1.5 + (10 - s.loyalty) * 0.7;
      const total = w1 + w2 + w3;
      const r = Math.random() * total;
      const gift = r < w1 ? 1 : r < w1 + w2 ? 2 : 3;
      return { player, tribe, gift };
    });

    // Apply gift effects
    ep.giftTribeBoosts     = ep.giftTribeBoosts || {};
    ep.giftNarrativeEvents = ep.giftNarrativeEvents || {};
    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

    giftResults.forEach((result) => {
      const { player, tribe, gift } = result;
      const tribemates = gs.tribes.find(t => t.name === tribe)?.members.filter(p => gs.activePlayers.includes(p) && p !== player) || [];
      if (gift === 1) {
        // Survival kit — camp event boosts + direct bond boost
        const gtb = ep.giftTribeBoosts[tribe] = ep.giftTribeBoosts[tribe] || {};
        gtb.comfort = (gtb.comfort || 0) + 30; gtb.hardWork = (gtb.hardWork || 0) + 25;
        gtb.tdBond  = (gtb.tdBond  || 0) + 20; gtb.fight   = (gtb.fight   || 0) - 20;
        gtb.dispute = (gtb.dispute || 0) - 15; gtb.foodConflict = (gtb.foodConflict || 0) - 20;
        tribemates.forEach(tm => addBond(player, tm, 2));
        ep.giftNarrativeEvents[tribe] = { type: 'hardWork', text: _pick([
          `${player} came back from the summit carrying a survival kit — pot, machete, and flint. The tribe's mood shifted the moment they saw it. It was the right call, and everyone knew it.`,
          `${player} returned with a pot, a machete, and a flint tucked under one arm. The tribe gathered around without needing to be asked. Whatever happened out there, ${player} had come back for the tribe.`,
          `The survival kit ${player} brought back landed in the middle of camp like a peace offering. A pot. A machete. Flint. Nobody said it out loud, but ${player} had made the right choice — and that counted for something.`,
        ]) };
      } else if (gift === 2) {
        // Idol clue — 65% chance they find the idol (requires slot + under global cap)
        const hasSlot = gs.idolSlots?.[tribe];
        const _g2IdolCount = gs.advantages.filter(a => a.type === 'idol').length;
        const _g2IdolMax = seasonConfig.advantages?.idol?.count || 2;
        const foundIdol = hasSlot && _g2IdolCount < _g2IdolMax && Math.random() < 0.65;
        if (foundIdol) {
          gs.advantages.push({ holder: player, type: 'idol', foundEp: ep.num });
          gs.idolSlots[tribe] = Math.max(0, (gs.idolSlots[tribe] || 1) - 1);
          ep.idolFinds.push({ finder: player, type: 'idol', tribe, fromGift2: true });
        }
        // Suspicion: each tribemate has 25% chance of noticing the searching (-1 bond)
        const spotted = tribemates.filter(() => Math.random() < 0.25);
        spotted.forEach(tm => addBond(player, tm, -1));
        // Witnesses who saw a confirmed find know about the idol — treat same as betrayal for targeting
        if (foundIdol && spotted.length) {
          if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
          gs.knownIdolHoldersThisEp.add(player);
          // Store witnesses on the find record so explainBoot can reference them
          const findEntry = ep.idolFinds.find(f => f.finder === player && f.fromGift2);
          if (findEntry) findEntry.witnesses = spotted;
        }
        if (foundIdol) {
          result.searchOutcome = 'found';
          ep.giftNarrativeEvents[tribe] = { type: 'idolFound', players: [player, ...spotted].filter(Boolean), text: _pick([
            `${player} was quiet coming back from the summit. Within the hour, ${player} had slipped away from the group — moving through camp like someone who knew exactly what they were looking for. ${player} found it.`,
            `Nobody thought much of it when ${player} wandered off after returning. But ${player} had a clue, and a clue was enough. By the time the tribe noticed the absence, the idol was already in ${player}'s pocket.`,
            `${player} returned with nothing visible. No supplies, no answers. But ${player} wasted no time — clue in hand, they searched ${tribe}'s camp and came up with a Hidden Immunity Idol.`,
          ]) + (spotted.length ? ` ${spotted.join(' and ')} noticed ${player} digging around and filed it away.` : '') };
        } else if (!hasSlot) {
          result.searchOutcome = 'slotTaken';
          // Slot taken — someone from this tribe already holds the idol
          ep.giftNarrativeEvents[tribe] = { type: 'idolSearch', text: _pick([
            `${player} came back from the summit quiet. ${player} had a clue — but the idol slot at ${tribe}'s camp was already gone. The search came up empty.`,
            `${player} slipped away from camp to search. The clue pointed to a spot that had already been cleared. ${player} came back with nothing and said nothing.`,
          ]) + (spotted.length ? ` ${spotted.join(' and ')} saw ${player} looking around and noticed the behaviour.` : '') };
        } else {
          result.searchOutcome = 'failed';
          // Slot available but search roll failed — idol is still out there
          ep.giftNarrativeEvents[tribe] = { type: 'idolSearch', text: _pick([
            `${player} had a clue — but after an hour of searching, nothing turned up. The idol is still out there somewhere.`,
            `${player} searched every spot the clue pointed to. Came back empty-handed. Close — but not close enough.`,
            `${player} slipped away to search with the clue in hand. The location was right. The timing wasn't. ${player} came back without it.`,
          ]) + (spotted.length ? ` ${spotted.join(' and ')} saw ${player} looking around and noticed the behaviour.` : '') };
        }
      } else if (gift === 3) {
        // Immunity Totem — immediate idol, bypasses idol cap (it's a summit gift choice, not a camp find)
        gs.advantages.push({ holder: player, type: 'idol', foundEp: ep.num, fromTotem: true });
        ep.idolFinds.push({ finder: player, type: 'idol-totem', tribe });
        tribemates.forEach(tm => addBond(player, tm, -1));
        ep.giftNarrativeEvents[tribe] = { type: 'dispute', text: _pick([
          `${player} came back from the summit with nothing in their hands. No explanation that quite held up. The tribe didn't push — but camp felt a little colder after that.`,
          `${player} returned quiet. Whatever happened at the summit, ${player} didn't bring back supplies, and the tribe had been hungry. Nobody said anything directly. The silence did the work.`,
          `The tribe asked how it went. ${player} gave an answer. It wasn't a lie, exactly — but it wasn't the whole truth either. By the time the fire went down, something small had shifted.`,
          `${player} came back empty-handed and said the choices were limited. The tribe nodded. They also quietly made a note of it.`,
        ]) };
      }
    });

    // ── Drama: bold/disloyal Gift 3 pickers may reveal or boast, damaging tribe trust ──
    const giftDrama = [];
    giftResults.forEach(({ player, tribe, gift }) => {
      if (gift !== 3) return;
      const s = pStats(player);
      // Chance to slip: driven by boldness (can't help bragging) and disloyalty (doesn't care)
      const dramaChance = Math.max(0, (s.boldness - 5) * 0.07 + (6 - s.loyalty) * 0.06 - 0.05);
      if (Math.random() > dramaChance) return;
      // Drama fires — determine how it surfaces
      const tribeMembers = gs.tribes.find(t => t.name === tribe)?.members.filter(p => gs.activePlayers.includes(p) && p !== player) || [];
      const reason = s.boldness >= 8
        ? `bragged about taking the Totem, framing it as the obviously correct move`
        : s.loyalty <= 3
        ? `made it clear they weren't losing sleep over leaving their tribe empty-handed`
        : `let it slip under pressure when a tribemate asked directly`;
      // Additional bond penalty on top of the baseline -1.5 already applied above
      tribeMembers.forEach(tm => { addBond(player, tm, -(1 + Math.floor(Math.random() * 2))); });
      // Override the silent-resentment camp event with a drama-reveal event
      const dramaText = s.boldness >= 8
        ? `${player} didn't even try to hide it — bragged about grabbing the Immunity Totem and framed it as the obvious move. ${tribeMembers.join(', ')} ${tribeMembers.length === 1 ? 'heard every word' : 'all heard it'}. The trust took a hit.`
        : s.loyalty <= 3
        ? `${player} made it clear they weren't losing sleep over coming back empty-handed. The tribe already suspected. Now they knew. Nobody looked happy about it.`
        : `Someone asked ${player} directly what happened at the summit. ${player} hesitated — and then the Immunity Totem came out. ${tribeMembers.join(', ')} ${tribeMembers.length === 1 ? 'went quiet' : 'went quiet'}. The conversation moved on, but the damage was done.`;
      ep.giftNarrativeEvents[tribe] = { type: 'fight', text: dramaText };
      giftDrama.push({ player, tribe, reason, affected: [...tribeMembers] });
    });
    if (giftDrama.length) twistObj.giftDrama = giftDrama;

    twistObj.nominees = nominees;
    twistObj.giftResults = giftResults;
    if (summitNomDrama.length) twistObj.nominationDrama = summitNomDrama;

  // ── TIEBREAKER CHALLENGE ─────────────────────────────────────────
  } else if (engineType === 'tiebreaker-challenge') {
    ep.tiebreakerChallenge = true;

  // ── AUCTION ──────────────────────────────────────────────────────
  } else if (engineType === 'auction') {
    if (!gs.isMerged) return; // merge-only twist
    // Item pool: always include one food, one blind advantage, one blind immunity
    const AUCTION_POOL = [
      { id:'meal',        label:'Full Meal',              type:'food',      blind:false, baseCost:60,  interest: s => s.endurance * 0.8 + 3 },
      { id:'snacks',      label:'Assorted Snacks',        type:'food',      blind:false, baseCost:40,  interest: s => s.endurance * 0.6 + 2 },
      { id:'comfort-kit', label:'Comfort Kit',            type:'comfort',   blind:false, baseCost:80,  interest: s => s.social * 0.5 + 2 },
      { id:'letter',      label:'Letter from Home',       type:'comfort',   blind:false, baseCost:50,  interest: s => s.loyalty * 0.7 + 2 },
      { id:'advantage',   label:'Game Advantage',         type:'advantage', blind:true,  baseCost:100, interest: s => s.strategic * 0.9 + s.intuition * 0.5 },
      { id:'idol-clue',   label:'Idol Clue',              type:'advantage', blind:true,  baseCost:80,  interest: s => s.intuition * 1.0 + s.strategic * 0.6 },
      { id:'immunity',    label:'Individual Immunity',    type:'immunity',  blind:true,  baseCost:200, interest: s => s.strategic * 0.8 + s.boldness * 0.4 + 2 },
      { id:'info',        label:'Game Intel',             type:'advantage', blind:true,  baseCost:70,  interest: s => s.intuition * 1.1 },
      { id:'sl-amulet',   label:'Second Life Amulet',     type:'advantage', blind:true,  baseCost:150, interest: s => s.boldness * 0.7 + s.strategic * 0.5 + 2 },
    ];
    // Always auction: 1 food, 1 comfort, 1 blind advantage, 1 blind immunity + 1-2 extras
    const required = ['meal','comfort-kit','advantage','immunity'];
    let extras = ['snacks','letter','idol-clue','info'].sort(() => Math.random()-0.5).slice(0,1+Math.floor(Math.random()*2));
    // Rare chance to include SL Amulet as an extra item (~20% if enabled and none in play)
    if (seasonConfig.advantages?.secondLife?.enabled && !gs.advantages.some(a => a.type === 'secondLife') && Math.random() < 0.20) {
      extras.push('sl-amulet');
    }
    const auctionItems = [...required, ...extras].map(id => AUCTION_POOL.find(it => it.id === id)).filter(Boolean);

    const budgets = {};
    gs.activePlayers.forEach(p => { budgets[p] = 500; });
    const results = [];

    auctionItems.forEach(item => {
      // Pooling: strongest bond pair in the group may pool for blind items
      let poolPair = null;
      if (item.blind && gs.activePlayers.length >= 3) {
        let bestBond = 0, bestA = null, bestB = null;
        for (let i = 0; i < gs.activePlayers.length; i++) {
          for (let j = i+1; j < gs.activePlayers.length; j++) {
            const b = getBond(gs.activePlayers[i], gs.activePlayers[j]);
            if (b > bestBond && budgets[gs.activePlayers[i]] >= 50 && budgets[gs.activePlayers[j]] >= 50) {
              bestBond = b; bestA = gs.activePlayers[i]; bestB = gs.activePlayers[j];
            }
          }
        }
        if (bestA && bestBond >= 2 && Math.random() < 0.25) poolPair = [bestA, bestB];
      }

      // Each active player bids up to their remaining budget
      const bids = gs.activePlayers.map(p => {
        if (poolPair && poolPair.includes(p)) return 0; // handled as pool bid
        const s = pStats(p);
        const interest = item.interest(s);
        const maxBid = Math.min(budgets[p], Math.round(interest * 30 + Math.random() * 60));
        return { player: p, bid: maxBid };
      });
      if (poolPair) {
        const [pA, pB] = poolPair;
        const sA = pStats(pA), sB = pStats(pB);
        const poolInterest = (item.interest(sA) + item.interest(sB)) / 2;
        const poolBid = Math.min(budgets[pA] + budgets[pB], Math.round(poolInterest * 50 + Math.random() * 100));
        bids.push({ player: `${pA}+${pB}`, bid: poolBid, isPool: true, players: [pA, pB] });
      }

      const topBid = bids.sort((a,b) => b.bid - a.bid)[0];
      if (!topBid || topBid.bid <= 0) return;

      const winnerName = topBid.isPool ? topBid.players[0] : topBid.player;
      // Deduct budget
      if (topBid.isPool) {
        const share = Math.ceil(topBid.bid / 2);
        topBid.players.forEach(p => { budgets[p] = Math.max(0, budgets[p] - share); });
      } else {
        budgets[topBid.player] = Math.max(0, budgets[topBid.player] - topBid.bid);
      }

      // Apply effect
      let effect = item.type; let effectLabel = item.label;
      if (item.blind) {
        // Revealed when opened
        if (item.id === 'advantage') {
          const advTypes = ['extraVote','voteSteal','voteBlock','safetyNoPower','soleVote'].filter(t => {
            const _src = seasonConfig.advantages?.[t]?.sources || ADVANTAGES.find(a => a.key === t)?.defaultSources || [];
            if (!_src.includes('auction')) return false;
            const tc = seasonConfig.advantages?.[t];
            if (!tc?.enabled) return false;
            const max = tc.count || 1;
            if (gs.advantages.filter(a => a.type === t).length >= max) return false;
            if (tc.oncePer === 'season' && (gs.advantagesFoundThisSeason?.[t] || 0) >= max) return false;
            if (tc.oncePer === 'phase' && (gs.advantagesFoundThisPhase?.[t] || 0) >= max) return false;
            return true;
          });
          if (!advTypes.length) advTypes.push('extraVote','voteSteal');
          const pick = advTypes[Math.floor(Math.random() * advTypes.length)];
          const advMax = seasonConfig.advantages?.[pick]?.count || 1;
          if (gs.advantages.filter(a => a.type === pick).length < advMax) {
            gs.advantages.push({ holder: winnerName, type: pick, foundEp: ep.num, fromAuction: true });
            const _oncePer = seasonConfig.advantages?.[pick]?.oncePer;
            if (_oncePer) {
              const _ck = _oncePer === 'phase' ? 'advantagesFoundThisPhase' : 'advantagesFoundThisSeason';
              if (!gs[_ck]) gs[_ck] = {};
              gs[_ck][pick] = (gs[_ck][pick] || 0) + 1;
            }
            effect = pick; effectLabel = pick === 'extraVote' ? 'Extra Vote' : pick === 'voteSteal' ? 'Vote Steal' : 'Vote Block';
          } else {
            effect = 'food'; effectLabel = '(advantage not available — consolation snack)';
          }
        } else if (item.id === 'idol-clue') {
          const tribeName = gs.tribes.find(t => t.members.includes(winnerName))?.name;
          if (tribeName && gs.idolSlots?.[tribeName] && Math.random() < 0.80) {
            gs.advantages.push({ holder: winnerName, type: 'idol', foundEp: ep.num, fromAuction: true });
            gs.idolSlots[tribeName] = Math.max(0, (gs.idolSlots[tribeName] || 1) - 1);
            ep.idolFinds.push({ finder: winnerName, type: 'idol', tribe: tribeName, fromAuction: true });
            effect = 'idol'; effectLabel = 'Idol Clue (found the idol!)';
          } else {
            effect = 'idolClue'; effectLabel = 'Idol Clue (didn\'t find it this episode)';
          }
        } else if (item.id === 'immunity') {
          gs.guaranteedImmuneThisEp = winnerName;
          effect = 'immunity'; effectLabel = 'Individual Immunity';
        } else if (item.id === 'info') {
          effect = 'info'; effectLabel = 'Game Intel (knows a strategic secret)';
        } else if (item.id === 'sl-amulet') {
          if (!gs.advantages.some(a => a.type === 'secondLife')) {
            gs.advantages.push({ holder: winnerName, type: 'secondLife', foundEp: ep.num, fromAuction: true });
            ep.idolFinds.push({ finder: winnerName, type: 'secondLife', tribe: 'auction' });
            effect = 'secondLife'; effectLabel = 'Second Life Amulet';
          } else {
            effect = 'food'; effectLabel = '(Second Life Amulet already in play — consolation snack)';
          }
        }
      }

      results.push({
        item: item.id, label: item.blind ? `Blind Bid (revealed: ${effectLabel})` : item.label,
        winner: topBid.isPool ? `${topBid.players.join(' + ')} (pooled)` : topBid.player,
        winnerName, bid: topBid.bid, isBlind: item.blind, effect, isPool: !!topBid.isPool
      });
    });

    twistObj.auctionResults = results;
    twistObj.budgetsRemaining = budgets;
    // Inject camp narrative based on what happened at the auction
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const letterWinner = results.find(r => r.item === 'letter')?.winnerName;
    const advantageBuyer = results.find(r => r.effect === 'extraVote' || r.effect === 'voteSteal' || r.effect === 'idol' || r.effect === 'idolClue')?.winnerName;
    const immunityBuyer = results.find(r => r.effect === 'immunity')?.winnerName;
    if (letterWinner) {
      ep.twistNarrativeEvents['merge'] = { type: 'homesick', text: _pick([
        `${letterWinner} read the letter from home alone and came back to camp with red eyes. Nobody asked. Everyone noticed. Some things don't need explaining.`,
        `${letterWinner} spent $50 on a letter from home. That moment — the silence after they finished reading it — said everything about what this game costs.`,
        `When ${letterWinner} opened the letter, the auction stopped. Some people looked away. The rest of the game still had to happen, but it felt smaller for a few minutes.`,
      ]) };
    } else if (advantageBuyer) {
      // 40% chance others noticed the blind bid was strategic
      if (Math.random() < 0.40) {
        gs.activePlayers.filter(p => p !== advantageBuyer).forEach(p => {
          if (pStats(p).intuition >= 6) addBond(advantageBuyer, p, -0.5); // perceptive players noted the move
        });
        ep.twistNarrativeEvents['merge'] = { type: 'rumor', text: _pick([
          `${advantageBuyer} went hard on the blind bid. Everyone at the auction table saw it. Strategic players file away that kind of thing.`,
          `${advantageBuyer} didn't hesitate on the advantage. The bid told the whole group exactly how they were thinking — and it wasn't about food.`,
          `${advantageBuyer} spent big on the unknown item. A few players exchanged glances. That bid will come up again before the season is over.`,
        ]) };
      } else {
        ep.twistNarrativeEvents['merge'] = { type: 'confessional', text: `${advantageBuyer} left the auction with something nobody else knows about. That kind of information gap is exactly how games get won.` };
      }
    } else if (immunityBuyer) {
      ep.twistNarrativeEvents['merge'] = { type: 'confessional', text: _pick([
        `${immunityBuyer} bought immunity outright. Practical. Strategic. Also the kind of thing that tells everyone you were scared of tonight.`,
        `${immunityBuyer} didn't even pause before bidding on immunity. It's not the flashiest move — but it works.`,
      ]) };
    } else {
      ep.twistNarrativeEvents['merge'] = { type: 'tdBond', text: `The auction gave everyone something to eat and not much else. Camp was relaxed tonight — which, at this point in the game, might be the most dangerous thing of all.` };
    }

  // ── ELIMINATION SWAP ─────────────────────────────────────────────
  } else if (engineType === 'elimination-swap') {
    ep.eliminationSwap = true;

  // ── EXILE DUEL — incompatible with RI/Rescue Island (both are return mechanics) ──
  } else if (engineType === 'exile-duel') {
    if (seasonConfig.ri) return; // RI is active — exile duel doesn't fire
    ep.exileDuelActive = true;

  // ── SOCIAL ─────────────────────────────────────────────────────────
  } else if (engineType === 'the-feast' || engineType === 'merge-reward') {
    const all = gs.activePlayers;
    const isMergeFeast = engineType === 'merge-reward';
    const _feastLabel = isMergeFeast ? 'merge feast' : 'feast';
    const tribeOf = n => gs.tribes.find(t => t.members.includes(n))?.name || 'merge';
    const _baseBondBoost = isMergeFeast ? 0.5 : 0.3;

    // Base bond boost — proportional with social
    for (let i = 0; i < all.length; i++) {
      for (let j = i+1; j < all.length; j++) {
        if (getBond(all[i], all[j]) > -2) {
          const _highSocial = Math.max(pStats(all[i]).social, pStats(all[j]).social);
          addBond(all[i], all[j], _baseBondBoost + _highSocial * 0.04);
        }
      }
    }

    // Generate personality-driven events
    const _numEvents = Math.floor(all.length / 3) + 2;
    ep.feastEvents = [];
    const _usedPairs = new Set();
    const _pairKey = (a, b) => [a, b].sort().join('|');

    for (let _ei = 0; _ei < _numEvents; _ei++) {
      // Build weighted event pool
      const _pool = [];

      // Candidate pairs
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          if (_usedPairs.has(_pairKey(all[i], all[j]))) continue;
          const a = all[i], b = all[j];
          const sA = pStats(a), sB = pStats(b);
          const bond = getBond(a, b);
          const crossTribe = !isMergeFeast && tribeOf(a) !== tribeOf(b);

          // 1. Strategic deal — BOTH players need strategic ability to make moves at a feast
          const _stratMin = Math.min(sA.strategic, sB.strategic);
          if (_stratMin >= 3) _pool.push({ type: 'strategic-deal', a, b,
            weight: _stratMin * 0.04 * (crossTribe ? 1.5 : 1) }); // need both to be strategic

          // 2. Emotional positive — driven by social stats, not existing bond (cross-tribe has no bond history)
          const _socialAvg = (sA.social + sB.social) / 2;
          _pool.push({ type: 'emotional-positive', a, b,
            weight: _socialAvg * 0.04 // high social pair = warm moment. low social pair = unlikely
              + (sA.social * sB.social * 0.002) }); // BOTH being social compounds

          // 3. Emotional negative — driven by low temperament, not existing bond
          const _worstTemp = Math.min(sA.temperament, sB.temperament);
          const _hothead = (10 - _worstTemp);
          _pool.push({ type: 'emotional-negative', a, b,
            weight: _hothead * 0.025 // low temperament = friction. high temperament = unlikely
              + (bond < -1 ? 0.15 : 0) // existing tension amplifies chance
              + (sA.boldness + sB.boldness) * 0.005 }); // bold players provoke

          // 4. Intel leak — leaker needs to be loose (low temperament or high boldness), listener needs intuition
          const _leakerScore = Math.max((10 - Math.min(sA.temperament, sB.temperament)) * 0.03, Math.max(sA.boldness, sB.boldness) * 0.02);
          const _listenerScore = Math.max(sA.intuition, sB.intuition) * 0.03;
          _pool.push({ type: 'intel-leak', a, b, weight: _leakerScore * _listenerScore * 5 }); // needs BOTH a leaker AND listener

          // 5. Cross-tribe sizing up (pre-merge only) — targets the highest-threat cross-tribe players
          if (crossTribe) {
            const _threatAvg = (threatScore(a) + threatScore(b)) / 2;
            _pool.push({ type: 'sizing-up', a, b,
              weight: Math.max(sA.strategic, sB.strategic) * 0.02 * (_threatAvg * 0.15) }); // strategic observers + high-threat targets
          }

          // 6. Power revealed — centers on the actual power players
          if (isMergeFeast) {
            const _powerScore = Math.max(threatScore(a), threatScore(b));
            _pool.push({ type: 'power-revealed', a, b,
              weight: _powerScore * 0.03 * Math.max(sA.strategic + sA.intuition, sB.strategic + sB.intuition) * 0.02 }); // power + someone perceptive enough to notice
          }
        }
      }

      if (!_pool.length) break;

      // Weighted random selection
      const _totalW = _pool.reduce((s, e) => s + e.weight, 0);
      let _roll = Math.random() * _totalW;
      let _chosen = _pool[0];
      for (const e of _pool) { _roll -= e.weight; if (_roll <= 0) { _chosen = e; break; } }

      const { type, a, b } = _chosen;
      _usedPairs.add(_pairKey(a, b));
      const _prA = pronouns(a), _prB = pronouns(b);
      const sA = pStats(a), sB = pStats(b);

      if (type === 'strategic-deal') {
        addBond(a, b, 0.8);
        ep.feastEvents.push({ type, players: [a, b], text: _pick([
          `${a} and ${b} end up at the same end of the table. What starts as small talk turns into a full strategy session. By the time the plates are cleared, they have a plan.`,
          `${a} leans across the table to ${b}. "After tonight, we should talk." ${b} nods. The deal isn't made yet — but the door is open.`,
          `The ${_feastLabel} gave ${a} and ${b} something they didn't have before: time. They used every minute of it.`,
        ]), badgeText: 'Strategic Deal', badgeClass: 'gold' });
      } else if (type === 'emotional-positive') {
        const _bondGain = 0.5 + Math.max(sA.social, sB.social) * 0.05;
        addBond(a, b, _bondGain);
        ep.feastEvents.push({ type, players: [a, b], text: _pick([
          `${a} and ${b} start talking — not about the game. About home, about why they're here, about things that don't usually come up at camp. Something shifts.`,
          `The food loosens things up. ${a} tells a story that makes ${b} laugh until ${_prB.sub} can't breathe. For five minutes, nobody is playing Survivor.`,
          `${a} and ${b} discover they have more in common than either expected. The game will test whether that matters.`,
        ]), badgeText: 'Connection', badgeClass: 'green' });
      } else if (type === 'emotional-negative') {
        const _bondLoss = -(0.5 + Math.max(10 - sA.temperament, 10 - sB.temperament) * 0.05);
        addBond(a, b, _bondLoss);
        ep.feastEvents.push({ type, players: [a, b], text: _pick([
          `${a} says something to ${b} that lands wrong. The table goes quiet. Nobody knows whether to laugh or leave.`,
          `The ${_feastLabel} was supposed to be a truce. ${a} and ${b} didn't get that memo. The tension is visible across the table.`,
          `${a} brings up something from a past tribal. ${b}'s face changes. The conversation is over, but the damage is done.`,
          `Somewhere between the second course and dessert, ${a} and ${b} stop pretending to get along. The rest of the table feels it.`,
        ]), badgeText: 'Tension', badgeClass: 'red' });
      } else if (type === 'intel-leak') {
        // Determine leaker (lower temperament) and listener (higher intuition)
        const _leaker = sA.temperament <= sB.temperament ? a : b;
        const _listener = _leaker === a ? b : a;
        const _listenerS = _leaker === a ? sB : sA;
        // Check if leaker has an advantage to leak about
        const _leakerAdv = gs.advantages.find(adv => adv.holder === _leaker && ['idol', 'legacy', 'amulet', 'secondLife', 'teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower', 'soleVote'].includes(adv.type));
        if (_leakerAdv) {
          if (['teamSwap'].includes(_leakerAdv.type)) {
            if (!gs.knownTeamSwapHolders) gs.knownTeamSwapHolders = new Set();
            gs.knownTeamSwapHolders.add(_leaker);
          } else if (['voteBlock'].includes(_leakerAdv.type)) {
            if (!gs.knownVoteBlockHolders) gs.knownVoteBlockHolders = new Set();
            gs.knownVoteBlockHolders.add(_leaker);
          } else if (['voteSteal'].includes(_leakerAdv.type)) {
            if (!gs.knownVoteStealHolders) gs.knownVoteStealHolders = new Set();
            gs.knownVoteStealHolders.add(_leaker);
          } else if (['safetyNoPower'].includes(_leakerAdv.type)) {
            if (!gs.knownSafetyNoPowerHolders) gs.knownSafetyNoPowerHolders = new Set();
            gs.knownSafetyNoPowerHolders.add(_leaker);
          } else if (['soleVote'].includes(_leakerAdv.type)) {
            if (!gs.knownSoleVoteHolders) gs.knownSoleVoteHolders = new Set();
            gs.knownSoleVoteHolders.add(_leaker);
          } else {
            if (!gs.knownIdolHoldersThisEp) gs.knownIdolHoldersThisEp = new Set();
            gs.knownIdolHoldersThisEp.add(_leaker);
            if (!gs.knownIdolHoldersPersistent) gs.knownIdolHoldersPersistent = new Set();
            gs.knownIdolHoldersPersistent.add(_leaker);
          }
          const _advLabel = _leakerAdv.type === 'idol' ? 'Hidden Immunity Idol' : _leakerAdv.type === 'legacy' ? 'Legacy Advantage' : _leakerAdv.type === 'amulet' ? 'Amulet' : _leakerAdv.type === 'secondLife' ? 'Second Life Amulet' : _leakerAdv.type === 'teamSwap' ? 'Team Swap' : _leakerAdv.type === 'voteBlock' ? 'Vote Block' : _leakerAdv.type === 'voteSteal' ? 'Vote Steal' : _leakerAdv.type === 'safetyNoPower' ? 'Safety Without Power' : _leakerAdv.type === 'soleVote' ? 'Sole Vote' : 'advantage';
          const _lkPr = pronouns(_leaker);
          ep.feastEvents.push({ type, players: [_leaker, _listener], text: _pick([
            `${_leaker} got too comfortable at the ${_feastLabel}. ${_listener} noticed the way ${_lkPr.sub} touched ${_lkPr.posAdj} bag. By the end of the meal, ${_listener} is certain: ${_leaker} has a ${_advLabel}. That secret is out.`,
            `${_leaker} let something slip about ${_lkPr.posAdj} ${_advLabel} at the ${_feastLabel}. ${_listener} didn't react — but ${pronouns(_listener).sub} heard every word. ${_leaker}'s ${_advLabel} is no longer a secret.`,
            `${_listener} watched ${_leaker} all through the ${_feastLabel}. The confidence, the posture, the way ${_lkPr.sub} relaxed when idol talk came up. ${_listener} knows ${_leaker} has a ${_advLabel}. The question is what ${pronouns(_listener).sub} ${pronouns(_listener).sub==='they'?'do':'does'} with that information.`,
          ]), badgeText: `${_advLabel} Exposed`, badgeClass: 'red' });
        } else {
          // No advantage to leak — general vote intel / strategic read
          if (gs.playerStates?.[_listener]) gs.playerStates[_listener].eavesdropBoostThisEp = true;
          const _lkPr = pronouns(_leaker);
          const _liPr = pronouns(_listener);
          ep.feastEvents.push({ type, players: [_leaker, _listener], text: _pick([
            `${_listener} overhears ${_leaker} mapping out vote targets at the ${_feastLabel}. ${_liPr.Sub} now ${_liPr.sub==='they'?'know':'knows'} where ${_leaker}'s head is at going into tribal.`,
            `${_leaker} talks too freely about who ${_lkPr.sub} ${_lkPr.sub==='they'?'want':'wants'} out next. ${_listener} sits quietly and absorbs every word. That information will be used tonight.`,
            `Between courses, ${_listener} pieces together ${_leaker}'s entire strategy just from watching who ${_lkPr.sub} ${_lkPr.sub==='they'?'talk':'talks'} to and who ${_lkPr.sub} ${_lkPr.sub==='they'?'avoid':'avoids'}. ${_listener} has a read now — and it's a good one.`,
          ]), badgeText: 'Vote Intel', badgeClass: 'gold' });
        }
      } else if (type === 'sizing-up') {
        const _tA = threatScore(a), _tB = threatScore(b);
        const _threat = _tA > _tB ? a : b;
        const _observer = _threat === a ? b : a;
        ep.feastEvents.push({ type, players: [_observer, _threat], text: _pick([
          `${_observer} gets a good look at ${_threat} for the first time. The challenge record, the way people defer to ${pronouns(_threat).obj} — it all registers.`,
          `${_observer} watches ${_threat} work the table and takes mental notes. If they merge, that's someone to worry about.`,
        ]), badgeText: 'Sizing Up', badgeClass: '' });
      } else if (type === 'power-revealed') {
        const _powerPlayer = all.slice().sort((x, y) => threatScore(y) - threatScore(x))[0];
        if (_powerPlayer === a || _powerPlayer === b) {
          const _observer = _powerPlayer === a ? b : a;
          ep.feastEvents.push({ type, players: [_observer, _powerPlayer], text: _pick([
            `At the ${_feastLabel}, ${_observer} watches who defers to whom. ${_powerPlayer} is at the center of every conversation. That's information.`,
            `The power dynamics are visible at the table. ${_powerPlayer} doesn't even have to try — people orbit ${pronouns(_powerPlayer).obj}. ${_observer} sees it clearly.`,
          ]), badgeText: 'Power Dynamics', badgeClass: 'gold' });
        }
      }
    }

    twistObj.feastBonusApplied = true;
    twistObj.feastEvents = ep.feastEvents;

  } else if (engineType === 'loved-ones') {
    const all = gs.activePlayers;
    for (let i = 0; i < all.length; i++) {
      for (let j = i+1; j < all.length; j++) {
        addBond(all[i], all[j], (Math.random() - 0.2) * 1.5);
      }
    }
    // Pick the player most visibly affected (highest loyalty/homesick tendency)
    const emotionalPlayer = all.slice().sort((a,b) => (pStats(b).loyalty + (10-pStats(b).boldness)) - (pStats(a).loyalty + (10-pStats(a).boldness)))[0];
    // Their closest ally gets a small extra bond — shared vulnerability
    if (emotionalPlayer) {
      const closestAlly = all.filter(p => p !== emotionalPlayer).sort((a,b) => getBond(emotionalPlayer,b) - getBond(emotionalPlayer,a))[0];
      if (closestAlly) addBond(emotionalPlayer, closestAlly, 0.5);
      twistObj.lovedOnesStandout = emotionalPlayer;
    }
    twistObj.lovedOnes = true;
    // Inject narrative
    ep.twistNarrativeEvents = ep.twistNarrativeEvents || {};
    const lovedKey = gs.phase === 'pre-merge' && gs.tribes.length ? gs.tribes[0].name : 'merge';
    const lovedName = emotionalPlayer || all[0];
    ep.twistNarrativeEvents[lovedKey] = { type: 'homesick', text: _pick([
      `The loved ones visit cracked something open. ${lovedName} held it together through challenges and strategy sessions — not today. Seeing a familiar face from home was too much. That kind of vulnerability doesn't disappear once the visit ends.`,
      `Everyone was affected. ${lovedName} more than most. The tears came fast and didn't stop for a while. The game felt very far away, and very close, at the same time.`,
      `${lovedName} had been holding it together for weeks. One hug from home and the walls came down. Back at camp that night, something had shifted — softer, more honest, more dangerous.`,
    ]) };

  } else if (engineType?.startsWith('force-challenge-')) {
    // Force the immunity challenge to be a specific category
    const _forceCat = engineType.replace('force-challenge-', '');
    gs.forcedChallengeCategory = _forceCat;
    twistObj.forcedCategory = _forceCat;

  } else if (engineType === 'ambassadors') {
    // Requires 2+ tribes with 2+ members each
    const _ambTribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
    if (_ambTribes.length < 2 || gs.isMerged) { twistObj.blocked = true; twistObj.blockedReason = 'need 2+ tribes'; return; }

    // ── 1. AMBASSADOR SELECTION ──
    // Exclude returnees from this episode — they just came back, tribe wouldn't send them
    const _thisEpReturneesSet = new Set((ep.twists || []).flatMap(t => t.returnees ? t.returnees.map(r => r.name) : t.returnee ? [t.returnee] : []));
    const _ambSelections = _ambTribes.map(tribe => {
      const members = tribe.members.filter(m => gs.activePlayers.includes(m) && !_thisEpReturneesSet.has(m));
      // If all members are returnees (shouldn't happen), fall back to full list
      const _fallbackMembers = members.length ? members : tribe.members.filter(m => gs.activePlayers.includes(m));
      const scored = _fallbackMembers.map(name => {
        const s = pStats(name);
        const avgBond = members.filter(m => m !== name).reduce((sum, m) => sum + getBond(name, m), 0) / Math.max(1, members.length - 1);
        return { name, score: s.social * 0.3 + s.strategic * 0.3 + avgBond * 0.4 + Math.random() * 1.0 };
      }).sort((a, b) => b.score - a.score);
      return { tribe: tribe.name, ambassador: scored[0].name, runnerUp: scored[1]?.name || null, score: scored[0].score, members };
    });
    twistObj.ambassadorSelections = _ambSelections;

    // ── 2. DETERMINE NEGOTIATION ARCHETYPES ──
    const _ambGetType = (name) => {
      const s = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || '';
      if ((arch === 'schemer' || arch === 'mastermind') && s.strategic >= 7) return 'manipulator';
      if (s.strategic >= 8 && s.loyalty <= 4) return 'manipulator';
      if (arch === 'villain' || (s.boldness >= 8 && s.loyalty <= 3)) return 'villain';
      if (s.strategic >= 6 && s.social >= 5) return 'dealmaker';
      if (s.loyalty >= 7 && s.social >= 5) return 'loyal-shield';
      return 'emotional';
    };
    const _ambassadors = _ambSelections.map(sel => ({
      name: sel.ambassador, tribe: sel.tribe, type: _ambGetType(sel.ambassador),
      stats: pStats(sel.ambassador), pr: pronouns(sel.ambassador),
    }));
    twistObj.ambassadorTypes = _ambassadors.map(a => ({ name: a.name, type: a.type }));

    // ── 3. NEGOTIATION ──
    const _ambPick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
    // Exclude returnees from this episode — they just came back, can't be immediately eliminated by ambassadors
    const _thisEpReturnees = new Set((ep.twists || []).flatMap(t => t.returnees ? t.returnees.map(r => r.name) : t.returnee ? [t.returnee] : []));
    const _allNonAmb = gs.activePlayers.filter(p => !_ambassadors.some(a => a.name === p) && !_thisEpReturnees.has(p));

    if (_ambassadors.length === 2) {
      // ════ 2-TRIBE NEGOTIATION ════
      const [amb1, amb2] = _ambassadors;
      const ambBond = getBond(amb1.name, amb2.name);
      let agreed = false, target = null, targetReason = '', rockDrawLoser = null;
      const narrative = [];

      // Agreement formula — proportional, archetype-influenced
      let agreeBase = 0.3 + ambBond * 0.06;
      const types = [amb1.type, amb2.type].sort();
      const typeKey = types.join('-');
      if (typeKey === 'dealmaker-dealmaker') agreeBase += 0.4;
      else if (typeKey === 'emotional-emotional') agreeBase += 0.25 + ambBond * 0.06;
      else if (typeKey === 'dealmaker-emotional') agreeBase += 0.15;
      else if (typeKey === 'dealmaker-manipulator') agreeBase += 0.2;
      else if (typeKey === 'manipulator-manipulator') agreeBase += 0.25;
      else if (typeKey === 'emotional-loyal-shield') agreeBase += 0.05;
      else if (typeKey === 'dealmaker-loyal-shield') agreeBase -= 0.05;
      else if (typeKey === 'loyal-shield-loyal-shield') agreeBase -= 0.15;
      else if (typeKey === 'loyal-shield-villain') agreeBase -= 0.2;
      else if (typeKey === 'villain-villain') agreeBase -= 0.25;
      else if (typeKey === 'emotional-manipulator') agreeBase += 0.1;
      else if (typeKey === 'loyal-shield-manipulator') agreeBase -= 0.1;
      else if (typeKey === 'emotional-villain') agreeBase -= 0.1;
      else if (typeKey === 'dealmaker-villain') agreeBase += 0.0;
      // Shared enemy bonus
      const _sharedEnemy = _allNonAmb.find(p => getBond(amb1.name, p) <= -1 && getBond(amb2.name, p) <= -1);
      if (_sharedEnemy) agreeBase += 0.2;

      // Resistance check for domination pairings
      let dominatorIdx = -1, defenderIdx = -1, resistFired = false;
      if (amb1.type === 'manipulator' && amb2.type !== 'manipulator') { dominatorIdx = 0; defenderIdx = 1; }
      else if (amb2.type === 'manipulator' && amb1.type !== 'manipulator') { dominatorIdx = 1; defenderIdx = 0; }
      else if (amb1.type === 'villain' && amb2.type !== 'villain') { dominatorIdx = 0; defenderIdx = 1; }
      else if (amb2.type === 'villain' && amb1.type !== 'villain') { dominatorIdx = 1; defenderIdx = 0; }
      if (dominatorIdx >= 0) {
        const def = _ambassadors[defenderIdx];
        const resistChance = def.stats.boldness * 0.06 + def.stats.temperament * 0.04 + (10 - _ambassadors[dominatorIdx].stats.social) * 0.02;
        resistFired = Math.random() < resistChance;
        if (resistFired) {
          agreeBase -= 0.15;
          narrative.push(`${def.name} pushed back. The dynamic shifted — what looked like a one-sided conversation became a standoff.`);
        }
      }

      agreed = Math.random() < Math.max(0.05, Math.min(0.95, agreeBase));

      if (agreed) {
        // Target selection
        if (_sharedEnemy) {
          target = _sharedEnemy;
          targetReason = 'shared enemy — both ambassadors wanted this person gone';
        } else {
          const _candidates = _allNonAmb
            .filter(p => getBond(amb1.name, p) < 3 && getBond(amb2.name, p) < 3)
            .sort((a, b) => threatScore(b) - threatScore(a));
          target = _candidates[0] || _allNonAmb[0];
          targetReason = `highest threat — ${target} was too dangerous to bring into the merge`;
        }
        // Manipulator override (if not resisted)
        if (!resistFired && dominatorIdx >= 0 && _ambassadors[dominatorIdx].type === 'manipulator') {
          const manip = _ambassadors[dominatorIdx];
          const _manipTarget = _allNonAmb.sort((a, b) => getBond(manip.name, a) - getBond(manip.name, b))[0];
          if (_manipTarget) { target = _manipTarget; targetReason = `${manip.name}'s choice — steered the conversation to serve ${manip.pr.pos} agenda`; }
        }
        // Villain override (if not resisted)
        if (!resistFired && dominatorIdx >= 0 && _ambassadors[dominatorIdx].type === 'villain') {
          const vill = _ambassadors[dominatorIdx];
          const _villTarget = _allNonAmb.sort((a, b) => getBond(vill.name, a) - getBond(vill.name, b))[0];
          if (_villTarget && getBond(vill.name, _villTarget) < 0) { target = _villTarget; targetReason = `${vill.name}'s grudge — personal score settled through the meeting`; }
        }
      }

      if (!agreed) {
        rockDrawLoser = Math.random() < 0.5 ? amb1.name : amb2.name;
        target = null;
      }

      // ── NARRATIVE — multi-beat negotiation dialogue ──
      // Build a list of "discussed names" — the proposals and counter-proposals
      const _discussedNames = [];
      // Each ambassador's initial proposal (what they'd want)
      const _amb1Target = _allNonAmb.filter(p => !_ambSelections.find(s => s.tribe === amb1.tribe)?.members.includes(p))
        .sort((a, b) => threatScore(b) - threatScore(a))[0]; // amb1 proposes someone from amb2's tribe
      const _amb2Target = _allNonAmb.filter(p => !_ambSelections.find(s => s.tribe === amb2.tribe)?.members.includes(p))
        .sort((a, b) => threatScore(b) - threatScore(a))[0]; // amb2 proposes someone from amb1's tribe
      if (_amb1Target) _discussedNames.push({ proposer: amb1.name, proposed: _amb1Target, fromTribe: _ambSelections.find(s => s.members.includes(_amb1Target))?.tribe });
      if (_amb2Target) _discussedNames.push({ proposer: amb2.name, proposed: _amb2Target, fromTribe: _ambSelections.find(s => s.members.includes(_amb2Target))?.tribe });
      if (target && !_discussedNames.some(d => d.proposed === target)) _discussedNames.push({ proposer: 'both', proposed: target });

      // Beat 1: THE ARRIVAL (5 variants)
      narrative.unshift(_ambPick([
        `${amb1.name} and ${amb2.name} meet at the neutral ground. Two torches. Two chairs. One conversation that ends someone's game. The host steps back. This is between them now.`,
        `The clearing is quiet. ${amb1.name} arrives first, sits down, ${amb1.pr.sub==='they'?'stare':'stares'} at the fire. ${amb2.name} appears a minute later. They size each other up. Neither speaks. The weight of what's about to happen fills the space between them.`,
        `Two ambassadors. Two tribes. One of them walks out of here having ended someone's game. ${amb1.name} and ${amb2.name} sit across from each other. The fire crackles. The jungle waits.`,
        `A small clearing. Two torches burning. ${amb1.name} walks in from the left, ${amb2.name} from the right. They've never been alone together before. Everything that happens next decides who merges and who doesn't.`,
        `The host meets them at the clearing. "You each represent your tribe. You must agree on one person to eliminate. If you can't agree — one of you goes home." ${amb1.name} and ${amb2.name} lock eyes. The host leaves. The negotiation begins.`,
      ], amb1.name + amb2.name + 'arrival'));

      // Beat 2: THE OPENING — archetype-driven first move (3+ variants per type)
      const _dominator = dominatorIdx >= 0 ? _ambassadors[dominatorIdx] : null;
      const _defender = defenderIdx >= 0 ? _ambassadors[defenderIdx] : null;
      if (_dominator?.type === 'manipulator' && !resistFired) {
        narrative.push(_ambPick([
          `${_dominator.name} starts soft. "I've been thinking about this all day. There's a name I keep coming back to." ${_dominator.pr.Sub} ${_dominator.pr.sub==='they'?'lean':'leans'} forward. "What if we talked about ${_discussedNames[0]?.proposed || 'someone'}?" The framing is careful — making it sound like a shared idea, not a demand.`,
          `${_dominator.name} doesn't lead with a name. ${_dominator.pr.Sub} ${_dominator.pr.sub==='they'?'lead':'leads'} with a feeling. "I know this is hard. I know neither of us wants to be here. But if we think about what's best for BOTH tribes going into the merge..." The trap is already set.`,
          `"Let me ask you something," ${_dominator.name} says. "Who on your tribe do YOU think is holding you back?" It's a beautiful move — getting the other ambassador to name their own people first. ${_defender?.name || amb2.name} hesitates. That hesitation is all ${_dominator.name} needs.`,
        ], _dominator.name + 'manipOpen'));
      } else if (_dominator?.type === 'villain') {
        narrative.push(_ambPick([
          `${_dominator.name} doesn't waste time. "${_discussedNames[0]?.proposed || 'Someone'} goes. That's what I came here to say." ${_defender?.name || amb2.name} blinks. The conversation just started and it already has a direction.`,
          `${_dominator.name} sits down and says one word. A name. "${_discussedNames[0]?.proposed || 'Someone'}." No explanation. No justification. Just the name. The other ambassador stares. "That's... that's your opening?"`,
          `"I didn't come here to talk," ${_dominator.name} says. "I came here to handle business. ${_discussedNames[0]?.proposed || 'Someone'} is dangerous and we both know it. Write the name or we draw rocks. Your choice." The bluntness is staggering.`,
        ], _dominator.name + 'villOpen'));
      } else if (amb1.type === 'dealmaker' || amb2.type === 'dealmaker') {
        const dm = amb1.type === 'dealmaker' ? amb1 : amb2;
        const other = dm === amb1 ? amb2 : amb1;
        narrative.push(_ambPick([
          `${dm.name} gets right to it. "Let's not play games. We both know why we're here. I'll tell you who I think is the biggest threat if you tell me yours." ${other.name} considers this. A straight deal — no tricks. ${other.type === 'loyal-shield' ? `But ${other.name} already knows ${other.pr.sub} won't give up one of ${other.pr.pos} own.` : 'Maybe.'}`,
          `${dm.name} pulls out an imaginary scorecard. "Let me lay it out. Here's who I think survives the merge and here's who doesn't. If we're smart about this, we can both walk out of here with our tribes intact — minus one person who was going to cause problems anyway."`,
          `"I want to make a deal," ${dm.name} says. "A clean one. No tricks, no manipulation, no emotion. We look at the numbers, we pick the right person, and we both live to merge. Can you do that?" ${other.name} thinks. ${other.type === 'emotional' ? `"I can try," ${other.name} says. But trying and doing are different things.` : `"Yeah. Let's talk."`}`,
        ], dm.name + 'dealOpen'));
      } else if (amb1.type === 'loyal-shield' && amb2.type === 'loyal-shield') {
        narrative.push(_ambPick([
          `Neither speaks for a long time. Both know what's at stake — and both know they came here to protect their people, not sacrifice them. ${amb1.name} finally breaks the silence: "I'm not writing anyone from my tribe's name." ${amb2.name}: "Neither am I." The standoff begins.`,
          `${amb1.name} looks at ${amb2.name}. "My tribe sent me here to protect them. That's what I'm going to do." ${amb2.name} nods slowly. "So did mine." The silence that follows is the loudest thing in the clearing.`,
          `"Before we start," ${amb1.name} says, "I need you to know something. I'm not giving up anyone from my tribe. Not today. Not ever." ${amb2.name}: "Then we have a problem. Because neither am I." They both know where this is heading. Rocks.`,
        ], amb1.name + amb2.name + 'loyalOpen'));
      } else if (amb1.type === 'emotional' || amb2.type === 'emotional') {
        const em = amb1.type === 'emotional' ? amb1 : amb2;
        const other = em === amb1 ? amb2 : amb1;
        narrative.push(_ambPick([
          `${em.name} speaks first. "This is hard." ${other.name} nods. "Yeah." A pause. Then: "We have to agree on someone." The fire pops. Neither wants to say a name first.`,
          `${em.name} takes a breath. "I've been dreading this conversation all day. I don't want to do this to anyone." ${other.name} watches ${em.pr.obj} carefully. "Neither do I. But one of us has to say a name."`,
          `"Can I be honest with you?" ${em.name} says. "I don't think I can do this. Writing someone's name — ending their game — without them even getting to defend themselves..." ${em.pr.Sub} ${em.pr.sub==='they'?'trail':'trails'} off. ${other.name} waits. The fire crackles.`,
          `${em.name} sits down and immediately ${em.pr.pos} eyes get wet. "Sorry. I just — the weight of this is real." ${other.name}: "I know." And for a moment, two people from different tribes share something honest.`,
        ], em.name + 'emotOpen'));
      } else {
        narrative.push(_ambPick([
          `${amb1.name} speaks first. "So... where do we start?" ${amb2.name}: "I don't know. I've never done this before." A pause. "Neither have I." The fire between them feels very small.`,
          `They sit in silence for almost a minute. ${amb1.name} stares at the fire. ${amb2.name} stares at ${amb1.name}. Finally: "Someone has to say a name." "I know." More silence. "You first." "No. You."`,
          `${amb1.name}: "This is the worst part of this game." ${amb2.name}: "Agreed." They both laugh — nervous, short. Then the laughter stops. "Okay. Let's do this."`,
        ], amb1.name + amb2.name + 'genericOpen'));
      }

      // Beat 3: THE NEGOTIATION — proposals and counter-proposals (expanded)
      if (_discussedNames.length >= 2 && _discussedNames[0].proposed !== _discussedNames[1].proposed) {
        const p1 = _discussedNames[0], p2 = _discussedNames[1];
        narrative.push(_ambPick([
          `${p1.proposer} puts a name forward: "${p1.proposed}." ${p2.proposer === amb2.name ? amb2.name : amb1.name} shakes ${(p2.proposer === amb2.name ? amb2.pr : amb1.pr).pos} head slowly. "That's one of ${p1.fromTribe ? 'your' : 'my'} people asking me to sacrifice one of mine." A counter: "${p2.proposed}." Now it's ${p1.proposer}'s turn to hesitate.`,
          `"I think we should talk about ${p1.proposed}," ${p1.proposer} says carefully. The other ambassador's jaw tightens. "Absolutely not. ${p1.proposed} is one of the reasons we're still in this game." A beat. "Then what about ${p2.proposed}?" The negotiation is real now.`,
          `${p1.proposer}: "${p1.proposed}." ${p2.proposer === amb2.name ? amb2.name : amb1.name}: "No." "${p1.proposed} is a threat to both of us—" "I said no. What about ${p2.proposed}?" The room gets colder. Neither is giving ground easily.`,
        ], p1.proposer + p2.proposed + 'counter'));
        if (agreed && target !== p1.proposed && target !== p2.proposed) {
          narrative.push(_ambPick([
            `Neither name sticks. They go back and forth — ${p1.proposed}, ${p2.proposed}, the arguments for each. Then ${amb1.name} says a third name: "${target}." The room shifts. ${amb2.name} looks at the fire. "${target}..." A long pause. Then a nod. That's the one.`,
            `The first two names are dead ends. Both ambassadors know it. Then ${amb2.name} says something neither expected: "What about ${target}?" ${amb1.name} stops. Thinks. "${target}." The logic clicks for both of them simultaneously. "Yeah. ${target}."`,
            `After twenty minutes of going nowhere, ${amb1.name} leans back. "We're stuck." ${amb2.name}: "We're stuck." Silence. Then ${amb1.name}: "What about someone neither of us is close to?" They both think the same name at the same time. "${target}." It's almost eerie how fast the agreement comes after that.`,
          ], amb1.name + amb2.name + target + 'thirdName'));
        } else if (agreed) {
          narrative.push(_ambPick([
            `The debate circles back to ${target}. ${amb1.name}: "If we're being honest, ${target} is the one neither of us can afford to let into the merge." ${amb2.name} doesn't argue. The logic is clean — even if the cost isn't. "${target}." Agreement.`,
            `They keep coming back to the same name. ${target}. "Every time we try another name, we end up here," ${amb2.name} says. ${amb1.name}: "Because this is the right call. We both see it." A heavy exhale. "Fine. ${target}."`,
            `"${target}," ${amb1.name} says for the third time. ${amb2.name} rubs ${amb2.pr.pos} face. "I know. I just needed to hear myself not say no." ${amb1.name} waits. ${amb2.name}: "Okay. ${target}. Let's go tell them."`,
          ], amb1.name + amb2.name + target + 'circleBack'));
        }
      } else if (_discussedNames.length && agreed) {
        narrative.push(_ambPick([
          `The name comes faster than expected. ${target}. Both of them see it. "${target} is too dangerous," ${amb1.name} says. ${amb2.name} doesn't disagree. "Yeah. ${target}."`,
          `"What about ${target}?" The other ambassador doesn't even hesitate. "I was going to say the same name." For a second, they both feel relieved. Then the weight of it lands.`,
          `They both reach the same conclusion independently. ${target}. The biggest threat, the most logical pick, the name that makes sense for both sides. "So we agree?" "We agree." Neither feels good about it.`,
          `It's quick. Almost too quick. "${target}," ${amb1.name} says. ${amb2.name}: "${target}." That's it. No argument, no debate. Just two people who saw the same thing and acted on it. The simplicity is the most unsettling part.`,
        ], target + 'quickagree'));
      }

      // Beat 4: RESISTANCE (if it fired) — expanded
      if (resistFired && _defender) {
        narrative.push(_ambPick([
          `The room changed after ${_defender.name} pushed back. What ${_dominator?.name || 'the other ambassador'} thought would be easy became a real conversation. ${_defender.name}: "I didn't come here to be told what to do. I came here to negotiate." ${_dominator?.name || 'The other ambassador'} recalibrates. This isn't going to be one-sided.`,
          `${_defender.name} stops ${_dominator?.name || 'the other ambassador'} mid-sentence. "Hold on. I heard you. Now hear me." The shift is visible — what was a lecture just became a conversation. ${_dominator?.name || 'The other ambassador'} wasn't expecting resistance. Now ${_dominator?.pr?.sub || 'they'} ${_dominator?.pr?.sub==='they'?'have':'has'} to actually think.`,
          `"No." ${_defender.name} says it plainly. "I'm not doing that. You came in here thinking this would be easy — it's not. I have people counting on me too. So let's start over and have a real conversation." The power dynamic just flipped.`,
        ], _defender.name + 'resist'));
      }

      // Beat 5: THE DECISION — agreement or deadlock (expanded)
      if (agreed) {
        narrative.push(_ambPick([
          `It's settled. ${target}. ${amb1.name} and ${amb2.name} stand up. Neither offers a handshake — this isn't a friendship. It's a transaction. And someone pays the price without ever knowing why.`,
          `The deal is done. ${target} goes home. ${amb1.name} looks at ${amb2.name} one last time. "For what it's worth — I didn't enjoy this." ${amb2.name}: "Nobody asked you to."`,
          `"${target}." The name hangs in the air. ${amb1.name} and ${amb2.name} hold eye contact for a long moment. Then ${amb1.name} nods. ${amb2.name} nods. Someone's game just ended in a clearing they've never seen.`,
          `${amb1.name} extends a hand. ${amb2.name} looks at it. Takes it. The handshake is brief and means nothing — but the agreement behind it means everything. ${target} is out. They head back to their tribes to deliver the news.`,
          `"We're done here." ${amb1.name} stands. ${amb2.name} stays seated a moment longer, staring at the fire where the name ${target} was spoken into existence. Then ${amb2.pr.sub} ${amb2.pr.sub==='they'?'get':'gets'} up too. Two ambassadors. One decision. No going back.`,
        ], amb1.name + amb2.name + target + 'final'));
      } else {
        const _rlPr = pronouns(rockDrawLoser);
        const _rsSurvivor = rockDrawLoser === amb1.name ? amb2.name : amb1.name;
        narrative.push(_ambPick([
          `Silence. ${amb1.name} won't budge. ${amb2.name} won't budge. The host steps forward. "Since you can't agree — the rocks will decide." Two rocks in a bag. One black, one white. The ambassador who draws black goes home.`,
          `"I will go to rocks before I give up one of mine," ${amb1.type === 'loyal-shield' ? amb1.name : amb2.name} says. The other ambassador stares. "Then we go to rocks." The bag comes out. This just got real.`,
          `The negotiation is over. Neither ambassador moved. Neither compromised. The host produces a bag with two rocks — one black, one white. "You know the rules. Whoever draws the black rock is eliminated. Right here. Right now." The clearing goes very quiet.`,
          `"This is your last chance," the host says. "Agree on a name — or draw." Neither ambassador speaks. The host opens the bag. "Very well." Two rocks. Two fates. One of these ambassadors came to protect their tribe and is about to become the sacrifice instead.`,
        ], amb1.name + amb2.name + 'deadlock'));
        narrative.push(_ambPick([
          `${amb1.name} draws first. ${amb1.name === rockDrawLoser ? `${_rlPr.Sub} ${_rlPr.sub==='they'?'open':'opens'} ${_rlPr.pos} hand. Black. The wrong color.` : `White. Safe. ${_rlPr.Sub} exhales.`} ${amb2.name} doesn't need to look. ${amb2.name === rockDrawLoser ? `The rock in ${_rlPr.pos} hand confirms it. ${_rlPr.Sub} ${_rlPr.sub==='they'?'close':'closes'} ${_rlPr.pos} eyes.` : `${pronouns(amb2.name).Sub} ${pronouns(amb2.name).sub==='they'?'are':'is'} still in the game.`} ${rockDrawLoser}'s torch is snuffed in the clearing. ${_rsSurvivor} walks back alone.`,
          `The host holds the bag between them. ${rockDrawLoser} reaches in. Pulls out a rock. Looks down. Black. The wrong color. For a moment nobody moves. Then ${_rsSurvivor} exhales — relief mixed with something that looks a lot like guilt. ${rockDrawLoser} sets the rock on the ground, stands up, and walks toward the torch. No words. No drama. Just the sound of a torch being snuffed and footsteps fading into the jungle.`,
        ], amb1.name + amb2.name + rockDrawLoser + 'rockdraw'));
      }

      // Store discussed names for VP display
      twistObj.discussedNames = _discussedNames;

      // ── ELIMINATION ──
      const eliminated = agreed ? target : rockDrawLoser;
      const eliminatedByRocks = !agreed;

      // Bond consequences
      if (agreed) {
        const _elimTribe = _ambSelections.find(s => s.members.includes(eliminated));
        const _elimAmb = _elimTribe ? _ambassadors.find(a => a.tribe === _elimTribe.tribe) : null;
        if (_elimAmb) {
          _elimTribe.members.filter(m => m !== eliminated && m !== _elimAmb.name).forEach(m => {
            addBond(m, _elimAmb.name, getBond(m, eliminated) >= 2 ? -1.0 : -0.3);
          });
        }
        const _safeAmb = _ambassadors.find(a => a.tribe !== _elimTribe?.tribe);
        if (_safeAmb) {
          const _safeSel = _ambSelections.find(s => s.tribe === _safeAmb.tribe);
          if (_safeSel) _safeSel.members.filter(m => m !== _safeAmb.name).forEach(m => addBond(m, _safeAmb.name, 0.3));
        }
      }
      if (eliminatedByRocks) {
        const _elimSel = _ambSelections.find(s => s.ambassador === eliminated);
        if (_elimSel) _elimSel.members.filter(m => m !== eliminated).forEach(m1 => {
          _elimSel.members.filter(m2 => m2 !== eliminated && m2 !== m1).forEach(m2 => addBond(m1, m2, 0.5));
        });
        const _survivor = _ambassadors.find(a => a.name !== eliminated);
        if (_survivor) addBond(_survivor.name, eliminated, -1.0);
      }

      handleAdvantageInheritance(eliminated, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== eliminated);
      gs.eliminated.push(eliminated);
      gs.tribes.forEach(t => { t.members = t.members.filter(m => m !== eliminated); });

      // ── RETURN EVENTS — multi-beat per tribe, expanded variants ──
      const _returnEvents = [];
      _ambSelections.forEach(sel => {
        const amb = _ambassadors.find(a => a.tribe === sel.tribe);
        if (!amb) return;
        const tribemates = sel.members.filter(m => m !== amb.name && m !== eliminated && gs.activePlayers.includes(m));
        const closestToElim = eliminated ? tribemates.sort((a, b) => getBond(b, eliminated) - getBond(a, eliminated))[0] : null;

        if (eliminatedByRocks && eliminated === amb.name) {
          // ═══ AMBASSADOR LOST TO ROCKS ═══
          const beats = [];
          beats.push(_ambPick([
            `${amb.name} doesn't come back. The surviving ambassador delivers the news. ${sel.tribe} goes silent.`,
            `The tribe is waiting. They see movement on the path — but it's not ${amb.name}. It's the host. The look on the host's face tells them everything before a word is spoken.`,
            `Minutes pass. Then more minutes. When the other tribe's ambassador appears alone at the edge of camp, ${sel.tribe} knows. ${amb.name} is gone.`,
          ], amb.name + sel.tribe + 'rockReturn1'));
          beats.push(_ambPick([
            `"${amb.pr.Sub} volunteered to protect us," someone says. "And now ${amb.pr.sub}'s gone." The tribe gathers around ${amb.pr.pos} empty spot in the shelter. Nobody moves for a long time.`,
            `The tribe processes it in waves. Shock first. Then anger — not at ${amb.name}, but at the game. "A rock? ${amb.pr.Sub} went home because of a ROCK?" Then sadness. The shelter feels bigger tonight.`,
            `${amb.name}'s torch sits unlit at the edge of camp. ${amb.pr.Sub} ${amb.pr.sub==='they'?'were':'was'} supposed to come back with good news. Instead, ${amb.pr.pos} bag is packed by someone else. The tribe does it silently — folding ${amb.pr.pos} clothes, clearing ${amb.pr.pos} spot. It feels like a funeral.`,
          ], amb.name + sel.tribe + 'rockReturn2'));
          if (tribemates.length) {
            const reactor = closestToElim || tribemates[0];
            const rPr = pronouns(reactor);
            beats.push(_ambPick([
              `${reactor} walks to the water alone. ${rPr.Sub} ${rPr.sub==='they'?'don\'t':'doesn\'t'} cry in front of the tribe — but ${rPr.sub} ${rPr.sub==='they'?'cry':'cries'} at the water.`,
              `${reactor} says what everyone's thinking: "That should have been a deal, not a coin flip. ${amb.name} deserved better than a rock."`,
              `${reactor} to confessional: "${amb.name} went in there to protect us and paid the price. I'm going to honor that. Whatever it takes — I'm playing for both of us now."`,
              `${reactor} sits by the fire long after everyone else has gone to sleep. ${rPr.Sub} ${rPr.sub==='they'?'keep':'keeps'} looking at the path, like ${amb.name} might still walk back.`,
            ], reactor + amb.name + 'mourn'));
          }
          _returnEvents.push({ tribe: sel.tribe, type: 'ambassador-eliminated', text: beats.join(' '), beats });

        } else if (agreed && sel.members.includes(eliminated)) {
          // ═══ TRIBEMATE ELIMINATED — ambassador gave them up ═══
          const _tPr = pronouns(eliminated);
          const _tS = pStats(eliminated);
          const beats = [];

          // Beat 1: Ambassador returns with the news (3 variants)
          beats.push(_ambPick([
            `${amb.name} walks back into ${sel.tribe} camp. The tribe looks up. ${amb.pr.Sub} can't make eye contact. "I need to tell you something."`,
            `${amb.name} appears at the edge of camp. ${amb.pr.Sub} ${amb.pr.sub==='they'?'don\'t':'doesn\'t'} sit down. ${amb.pr.Sub} ${amb.pr.sub==='they'?'stand':'stands'} there, looking at the ground. The tribe stops what they're doing. They know bad news when they see it.`,
            `The tribe sees ${amb.name} coming back and starts to cheer — then stops. Something is wrong. ${amb.pr.Sub} ${amb.pr.sub==='they'?'are':'is'}n't celebrating. ${amb.pr.Sub} ${amb.pr.sub==='they'?'are':'is'}n't smiling. "I need everyone to sit down," ${amb.pr.sub} ${amb.pr.sub==='they'?'say':'says'}.`,
          ], amb.name + eliminated + 'reveal1'));

          // Beat 2: The reveal (3 variants)
          beats.push(_ambPick([
            `"They're sending ${eliminated} home." The words land like a punch. ${eliminated} was right there — listening. ${_tPr.Sub} heard ${_tPr.pos} own name.`,
            `${amb.name} looks at ${eliminated}. "I'm sorry. I tried. But the deal..." ${amb.pr.Sub} ${amb.pr.sub==='they'?'trail':'trails'} off. ${eliminated} already understands. The color drains from ${_tPr.pos} face.`,
            `"${eliminated}." ${amb.name} says the name and everything stops. The birds. The wind. ${eliminated}'s breath. "What?" "I couldn't — the other ambassador wouldn't—" "What are you saying?" "${eliminated}. It's you. I'm sorry."`,
          ], amb.name + eliminated + 'reveal2'));

          // Beat 3: Target's reaction — personality-driven (2-3 variants per type)
          if (_tS.temperament <= 4 || _tS.boldness >= 7) {
            beats.push(_ambPick([
              `${eliminated} stands up. "${amb.name}. Look at me." ${amb.name} looks. "You had ONE job. Protect this tribe. And you gave ME up?" ${_tPr.Sub} ${_tPr.sub==='they'?'don\'t':'doesn\'t'} wait for an answer. "I fought for you every single day. And THIS is what I get?" Dead silence.`,
              `${eliminated} laughs. Not a real laugh — the kind that comes right before the explosion. "You're joking. Tell me you're joking." ${amb.name}: "I'm not." The laugh stops. What replaces it is worse. "You GAVE me to them. You looked at the other ambassador and said MY name. Say it. SAY you said my name." ${amb.name} can't speak.`,
              `${eliminated} doesn't sit down. ${_tPr.Sub} ${_tPr.sub==='they'?'pace':'paces'}. Back and forth. The tribe watches. "Of all the people — of EVERYONE on this tribe — you chose ME?" ${_tPr.Sub} ${_tPr.sub==='they'?'kick':'kicks'} a coconut shell across camp. "I hope it was worth it. I hope that deal keeps you warm at night."`,
            ], eliminated + 'hotheadReact'));
          } else if (_tS.loyalty >= 7) {
            beats.push(_ambPick([
              `${eliminated} doesn't yell. That's what makes it worse. ${_tPr.Sub} just ${_tPr.sub==='they'?'look':'looks'} at ${amb.name}: "I trusted you. I told everyone you were the right person to send. I vouched for you." ${amb.name} opens ${amb.pr.pos} mouth. Nothing comes out.`,
              `${eliminated} is quiet for a long time. Then: "I stuck up for you, ${amb.name}. When people said you shouldn't go, I said you were the right choice. I believed in you." ${_tPr.Sub} ${_tPr.sub==='they'?'wipe':'wipes'} ${_tPr.pos} eyes. "That's the part that hurts."`,
              `"I need you to tell me one thing," ${eliminated} says. "Did you fight for me? Even a little? Or was I the first name out of your mouth?" ${amb.name} hesitates a fraction too long. ${eliminated} nods. "That's my answer." ${_tPr.Sub} ${_tPr.sub==='they'?'walk':'walks'} to ${_tPr.pos} bag and ${_tPr.sub==='they'?'start':'starts'} packing.`,
            ], eliminated + 'loyalReact'));
          } else if (_tS.strategic >= 7) {
            beats.push(_ambPick([
              `${eliminated} nods. Slowly. "Smart move. Strategically, I get it." ${_tPr.Sub} ${_tPr.sub==='they'?'pause':'pauses'}. "But I wouldn't have done it to you. I would have fought harder." ${amb.name} has no response.`,
              `${eliminated} takes a breath. "I respect the game. I respect that you made a call. But let me tell you what I would have done differently — I would have gone to rocks before I gave up one of my own. Think about that." ${eliminated} walks away.`,
              `"You know what? I saw this coming," ${eliminated} says. "Not this specifically — but I knew sending you in there was a gamble. I just thought the gamble was on the other tribe, not on me." ${_tPr.Sub} almost ${_tPr.sub==='they'?'smile':'smiles'}. Almost. "Good game."`,
            ], eliminated + 'stratReact'));
          } else {
            beats.push(_ambPick([
              `${eliminated}'s face crumbles. ${_tPr.Sub} ${_tPr.sub==='they'?'don\'t':'doesn\'t'} understand. ${_tPr.Sub} did everything right. "I never even got to argue my case," ${_tPr.sub} ${_tPr.sub==='they'?'whisper':'whispers'}.`,
              `${eliminated} sits down hard. ${_tPr.Sub} ${_tPr.sub==='they'?'stare':'stares'} at ${_tPr.pos} hands. "I didn't even get a vote. I didn't get a tribal. I got a conversation I wasn't part of." The tears come. ${_tPr.Sub} ${_tPr.sub==='they'?'don\'t':'doesn\'t'} try to stop them.`,
              `"Why me?" ${eliminated} asks. It's not angry — it's genuine confusion. "What did I do wrong?" ${amb.name}: "Nothing. You did nothing wrong." "Then WHY?" The question hangs in the air. There's no answer that fixes this.`,
            ], eliminated + 'emotReact'));
          }

          // Beat 4: Tribe's reaction (expanded)
          if (closestToElim) {
            const cPr = pronouns(closestToElim);
            const cBond = getBond(closestToElim, eliminated);
            if (cBond >= 3) {
              beats.push(_ambPick([
                `${closestToElim} turns to ${amb.name}. "Why ${eliminated}? Why not someone from THEIR tribe?" ${cPr.Sub} ${cPr.sub==='they'?'don\'t':'doesn\'t'} wait for an answer. ${cPr.Sub} ${cPr.sub==='they'?'go':'goes'} to ${eliminated} instead. "I'm sorry. I'm so sorry."`,
                `${closestToElim} hasn't said a word. ${cPr.Sub} ${cPr.sub==='they'?'walk':'walks'} over to ${eliminated} and ${cPr.sub==='they'?'sit':'sits'} down next to ${_tPr.obj}. No words. Just presence. Then quietly: "This isn't right. And I'm going to make sure everyone at the merge knows it."`,
                `${closestToElim} to confessional: "They took ${eliminated}. The one person on this tribe who didn't deserve it. ${amb.name} is going to answer for this — maybe not today, but soon."`,
              ], closestToElim + eliminated + 'allyReact'));
            } else {
              beats.push(_ambPick([
                `${closestToElim} watches from across camp. ${cPr.Sub} ${cPr.sub==='they'?'don\'t':'doesn\'t'} say anything to ${amb.name}. But the look says enough.`,
                `${closestToElim} exchanges a glance with ${tribemates[1] || tribemates[0] || amb.name}. The unspoken question: "Can we trust ${amb.name} after this?" The answer isn't obvious.`,
              ], closestToElim + 'distantReact'));
            }
          }

          const _bDmg = _tS.temperament <= 4 ? -3.0 : _tS.loyalty >= 7 ? -2.5 : _tS.strategic >= 7 ? -1.5 : -2.0;
          addBond(eliminated, amb.name, _bDmg);
          _returnEvents.push({ tribe: sel.tribe, type: 'tribemate-eliminated', eliminated, ambassador: amb.name, text: beats.join(' '), beats, betrayalDamage: _bDmg });

        } else {
          // ═══ TRIBE IS SAFE — ambassador protected them ═══
          const beats = [];

          // Beat 1: The return (3 variants)
          beats.push(_ambPick([
            `${amb.name} walks back into camp. The tribe reads ${amb.pr.pos} face — and the relief is instant. "We're safe," ${amb.pr.sub} ${amb.pr.sub==='they'?'say':'says'}. The tribe exhales.`,
            `${amb.name} appears on the path. The tribe holds its breath. Then ${amb.pr.sub} ${amb.pr.sub==='they'?'smile':'smiles'}. Just barely — but enough. "We're all going to the merge." The cheering starts before ${amb.pr.sub} even ${amb.pr.sub==='they'?'sit':'sits'} down.`,
            `Before ${amb.name} even speaks, the tribe sees it in ${amb.pr.pos} posture. Shoulders back. Head up. "Nobody from ${sel.tribe} is going home tonight." The relief is physical — people sag, laugh, wipe their eyes.`,
          ], amb.name + sel.tribe + 'safeReturn'));

          // Beat 2: What happened (archetype-driven, 2 variants each)
          if (amb.type === 'manipulator') {
            beats.push(_ambPick([
              `"I got what we needed," ${amb.name} says. ${amb.pr.Sub} doesn't explain the details. ${amb.pr.Sub} doesn't need to. The result speaks. But something about the way ${amb.pr.sub} ${amb.pr.sub==='they'?'avoid':'avoids'} eye contact tells the tribe there's a story ${amb.pr.sub}'s not sharing.`,
              `${amb.name} gives the tribe a version of what happened. It's smooth, it's clean, and it might not be entirely true. But the tribe got what they needed: safety. Nobody asks too many questions.`,
            ], amb.name + 'manipSafe'));
          } else if (amb.type === 'dealmaker') {
            beats.push(_ambPick([
              `${amb.name} lays it out: who was discussed, what the deal was, why it worked. Clear, strategic, no emotion. "It was business. And we came out on top." The tribe respects it.`,
              `"Clean deal," ${amb.name} says. "We looked at the threats, agreed on a name, shook hands. No tricks." The tribe nods. That's the ambassador they sent — and that's the ambassador who came back.`,
            ], amb.name + 'dealSafe'));
          } else if (amb.type === 'loyal-shield') {
            beats.push(_ambPick([
              `"I wasn't going to let anyone from this tribe go home," ${amb.name} says. The tribe believes ${amb.pr.obj}. They should — ${amb.pr.sub} meant it. "I was ready to go to rocks if I had to."`,
              `"They tried to get me to give up one of us," ${amb.name} says. "I said no. I said I'd rather draw a rock myself than sacrifice someone from my family." The tribe looks at ${amb.pr.obj} differently now. That's loyalty that goes beyond the game.`,
            ], amb.name + 'loyalSafe'));
          } else if (amb.type === 'villain') {
            beats.push(_ambPick([
              `${amb.name} sits down with a look that says "don't ask." The tribe doesn't ask. Whatever ${amb.pr.sub} did in that clearing, it worked. That's all that matters. For now.`,
              `"The other ambassador folded," ${amb.name} says flatly. "They gave up one of theirs. It's done." No empathy. No guilt. Just results. The tribe exchanges looks but says nothing.`,
            ], amb.name + 'villSafe'));
          } else {
            beats.push(_ambPick([
              `${amb.name} sits down at the fire. The tribe gathers around. "It was hard," ${amb.pr.sub} ${amb.pr.sub==='they'?'say':'says'}. "But we made it." Someone puts a hand on ${amb.pr.pos} shoulder. That's enough.`,
              `${amb.name} tells the tribe what happened — the back and forth, the proposals, the tension. ${amb.pr.Sub} ${amb.pr.sub==='they'?'leave':'leaves'} out the worst parts. The tribe doesn't need to know how close it was.`,
            ], amb.name + 'emotSafe'));
          }

          // Beat 3: Grateful tribemate (3 variants)
          if (tribemates.length) {
            const grateful = tribemates[Math.floor(tribemates.length * 0.5)]; // middle of the group
            beats.push(_ambPick([
              `${grateful} to confessional: "${amb.name} came through for us. I won't forget that. Going into the merge — that's someone I want on my side."`,
              `${grateful} pulls ${amb.name} aside later. "Thank you. I mean it. Whatever you had to do in there — thank you." ${amb.name} nods. The weight of what happened hasn't fully lifted yet.`,
              `${grateful}: "I owe ${amb.name}. We all do. ${amb.pr.Sub} went into that room alone and came back with all of us. That's not nothing."`,
            ], grateful + amb.name + 'grateful'));
          }

          _returnEvents.push({ tribe: sel.tribe, type: 'safe', text: beats.join(' '), beats });
        }
      });

      twistObj.ambassadorMeeting = {
        ambassadors: _ambassadors.map(a => a.name), types: _ambassadors.map(a => ({ name: a.name, type: a.type })),
        agreed, target, targetReason, rockDrawLoser, narrative, eliminatedByRocks, eliminated, resistFired,
        returnEvents: _returnEvents,
      };
      twistObj.ambassadorEliminated = eliminated;
      ep.ambassadorData = twistObj;

    } else {
      // ════ 3+ TRIBE NEGOTIATION — coalition mechanics ════
      const _ambNames = _ambassadors.map(a => a.name);
      const _coalitionScores = [];
      for (let i = 0; i < _ambassadors.length; i++) {
        for (let j = i + 1; j < _ambassadors.length; j++) {
          const a = _ambassadors[i], b = _ambassadors[j];
          const bond = getBond(a.name, b.name);
          const sharedEnemy = _allNonAmb.find(p => getBond(a.name, p) <= -1 && getBond(b.name, p) <= -1);
          const score = bond * 0.3 + (sharedEnemy ? 0.3 : 0) + (a.stats.strategic + b.stats.strategic) * 0.02 + Math.random() * 0.2;
          _coalitionScores.push({ pair: [a.name, b.name], score, sharedEnemy });
        }
      }
      _coalitionScores.sort((a, b) => b.score - a.score);
      const _coalition = _coalitionScores[0].pair;
      const _oddOneOut = _ambNames.find(n => !_coalition.includes(n));
      const _oddS = pStats(_oddOneOut);
      const _counterChance = _oddS.social * 0.06 + _oddS.strategic * 0.04;
      const _counterSucceeds = Math.random() < _counterChance;

      let agreed = false, target = null, targetReason = '', rockDrawLoser = null;
      const narrative = [];
      narrative.push(`Three ambassadors. ${_coalition.join(' and ')} find common ground quickly. ${_oddOneOut} is on the outside.`);

      if (_counterSucceeds) {
        const _newPartner = _coalition[Math.random() < 0.5 ? 0 : 1];
        const _newOdd = _coalition.find(n => n !== _newPartner);
        narrative.push(`${_oddOneOut} pulls ${_newPartner} aside and pitches a new deal. The coalition shatters. ${_newOdd} is suddenly the odd one out.`);
        const _oddTribe = _ambSelections.find(s => s.ambassador === _newOdd);
        const _cands = (_oddTribe?.members || []).filter(m => m !== _newOdd && getBond(_oddOneOut, m) < 3 && getBond(_newPartner, m) < 3);
        target = _cands.sort((a, b) => threatScore(b) - threatScore(a))[0] || _oddTribe?.members.find(m => m !== _newOdd);
        agreed = !!target;
        targetReason = `${_oddOneOut}'s counter-offer succeeded — new coalition targeted ${_newOdd}'s tribe`;
      } else {
        narrative.push(`${_oddOneOut} tries to counter but ${_coalition.join(' and ')} aren't budging.`);
        const _oddTribe = _ambSelections.find(s => s.ambassador === _oddOneOut);
        const _cands = (_oddTribe?.members || []).filter(m => m !== _oddOneOut && getBond(_coalition[0], m) < 3);
        target = _cands.sort((a, b) => threatScore(b) - threatScore(a))[0] || _oddTribe?.members.find(m => m !== _oddOneOut);
        const _acceptChance = 0.3 + _oddS.strategic * 0.04 + getBond(_oddOneOut, _coalition[0]) * 0.05;
        if (target && Math.random() < _acceptChance) {
          agreed = true; targetReason = `coalition decision — ${_oddOneOut} accepted the majority`;
          narrative.push(`${_oddOneOut} accepts. ${target} never merges.`);
        } else {
          agreed = false;
          narrative.push(`${_oddOneOut} refuses. The rocks come out.`);
          rockDrawLoser = _ambNames[Math.floor(Math.random() * _ambNames.length)];
          narrative.push(`Three rocks. One wrong color. ${rockDrawLoser} draws it. Gone.`);
        }
      }

      const eliminated = agreed ? target : rockDrawLoser;
      const eliminatedByRocks = !agreed;

      if (eliminatedByRocks) {
        const _elimSel = _ambSelections.find(s => s.ambassador === eliminated);
        if (_elimSel) _elimSel.members.filter(m => m !== eliminated).forEach(m1 => {
          _elimSel.members.filter(m2 => m2 !== eliminated && m2 !== m1).forEach(m2 => addBond(m1, m2, 0.5));
        });
      } else {
        const _elimTribe = _ambSelections.find(s => s.members.includes(eliminated));
        const _elimAmb = _elimTribe ? _ambassadors.find(a => a.tribe === _elimTribe.tribe) : null;
        if (_elimAmb) _elimTribe.members.filter(m => m !== eliminated && m !== _elimAmb.name).forEach(m => {
          addBond(m, _elimAmb.name, getBond(m, eliminated) >= 2 ? -1.0 : -0.3);
        });
      }

      handleAdvantageInheritance(eliminated, ep);
      gs.activePlayers = gs.activePlayers.filter(p => p !== eliminated);
      gs.eliminated.push(eliminated);
      gs.tribes.forEach(t => { t.members = t.members.filter(m => m !== eliminated); });

      const _returnEvents = _ambSelections.map(sel => {
        const amb = _ambassadors.find(a => a.tribe === sel.tribe);
        if (eliminatedByRocks && eliminated === amb?.name) return { tribe: sel.tribe, type: 'ambassador-eliminated', text: `${amb.name} drew the wrong rock. ${sel.tribe} lost their ambassador.` };
        if (sel.members.includes(eliminated)) return { tribe: sel.tribe, type: 'tribemate-eliminated', eliminated, ambassador: amb?.name, text: `${amb?.name || 'The ambassador'} returns with bad news. ${eliminated} was the price.` };
        return { tribe: sel.tribe, type: 'safe', text: `${amb?.name || 'The ambassador'} returns. ${sel.tribe} is safe.` };
      });

      twistObj.ambassadorMeeting = {
        ambassadors: _ambNames, types: _ambassadors.map(a => ({ name: a.name, type: a.type })),
        agreed, target, targetReason, rockDrawLoser, narrative, eliminatedByRocks, eliminated,
        coalition: _coalition, oddOneOut: _oddOneOut, counterSucceeded: _counterSucceeds,
        returnEvents: _returnEvents,
      };
      twistObj.ambassadorEliminated = eliminated;
      ep.ambassadorData = twistObj;
    }

  } else if (engineType === 'emissary-vote') {
    // ── EMISSARY VOTE: set flag only — actual selection runs post-challenge in simulateEpisode ──
    // (applyTwist fires BEFORE the challenge, so ep.winner/ep.loser don't exist yet)
    if (gs.isMerged) { twistObj.blocked = true; twistObj.blockedReason = 'pre-merge only'; return; }
    ep.isEmissaryVote = true;

  } else if (engineType === 'reward-challenge') {
    const rchal = pickChallenge();
    twistObj.rewardChallenge = true;
    twistObj.rewardChalLabel    = rchal.name;
    twistObj.rewardChalCategory = rchal.category;
    twistObj.rewardChalDesc     = rchal.desc;
    // If merge is about to happen this episode, run individual reward (not tribe)
    const _rwWillMerge = !gs.isMerged && gs.activePlayers.length <= (seasonConfig.mergeAt || 12);
    if (gs.phase === 'pre-merge' && gs.tribes.length > 1 && !_rwWillMerge) {
      // Tribe-based reward
      const rTribes = gs.tribes
        .filter(t => t.members?.some(m => gs.activePlayers.includes(m)))
        .map(tribe => {
          const members = tribe.members.filter(m => gs.activePlayers.includes(m));
          const ms = members.map(m => {
            let _molePen = 0;
            // The Mole: sabotage reward challenges too (pre-merge, target sabotage only — self-throw wastes food not immunity)
            if (gs.moles?.length) {
              const _mObj = gs.moles.find(ml => ml.player === m && !ml.exposed && !ml.layingLow);
              if (_mObj && Math.random() < 0.25) {
                // Defer target sabotage to after scores
                if (!gs._moleChalTargetSabotage) gs._moleChalTargetSabotage = [];
                gs._moleChalTargetSabotage.push({ mole: m, tribe: tribe.name, isReward: true });
              }
            }
            return { name: m, score: rchal.stat(pStats(m)) + (Math.random()*4-2) };
          });
          // Mole target sabotage for reward — same Owen-mode easy-target logic
          if (gs._moleChalTargetSabotage?.length) {
            const _tribeSabs = gs._moleChalTargetSabotage.filter(s => s.tribe === tribe.name && s.isReward);
            _tribeSabs.forEach(sab => {
              const _mObj = gs.moles?.find(ml => ml.player === sab.mole);
              if (!_mObj) return;
              const _coordMole = (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2)
                ? gs.moles.find(ml => ml.player !== sab.mole)?.player : null;
              const _sabPool = ms.filter(x => x.name !== sab.mole && (_coordMole ? x.name !== _coordMole : true));
              if (!_sabPool.length) return;
              const _avgScore = ms.reduce((s2, m2) => s2 + m2.score, 0) / ms.length;
              const _tgt = _sabPool.reduce((best, x) => {
                const xS = pStats(x.name);
                let sc = (10 - xS.physical) * 0.5 + (10 - xS.endurance) * 0.3 + Math.max(0, _avgScore - x.score) * 0.4 + Math.random() * 0.8;
                return sc > best.sc ? { name: x.name, sc, entry: x } : best;
              }, { name: _sabPool[0].name, sc: -99, entry: _sabPool[0] });
              const _penalty = 1.5 + Math.random() * 2;
              _tgt.entry.score -= _penalty;
              _mObj.sabotageCount++;
              _mObj.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'challengeSabotage', tribe: tribe.name, target: _tgt.name, reward: true });
              _mObj.resistance = Math.max(0.15, 0.5 - _mObj.sabotageCount * 0.03);
              if (!gs._moleChalThrows) gs._moleChalThrows = [];
              gs._moleChalThrows.push({ player: sab.mole, tribe: tribe.name, penalty: _penalty, mode: 'target', target: _tgt.name });
            });
            gs._moleChalTargetSabotage = gs._moleChalTargetSabotage.filter(s => !(s.tribe === tribe.name && s.isReward));
          }
          const msObj = {};
          ms.forEach(x => { msObj[x.name] = x.score; });
          const avg = ms.reduce((s,x) => s + x.score, 0) / (ms.length || 1);
          return { name: tribe.name, members, memberScores: msObj, score: avg + (Math.random()*2-1) };
        })
        .sort((a,b) => b.score - a.score);
      twistObj.rewardWinner     = rTribes[0].name;
      twistObj.rewardWinnerType = 'tribe';
      twistObj.rewardChalPlacements = rTribes;
    } else {
      // Individual reward (post-merge)
      const rScored = gs.activePlayers
        .map(name => ({ name, score: rchal.stat(pStats(name)) + (Math.random()*4-2) }));
      // The Mole: target sabotage on individual reward (deny food/comfort to threats)
      if (gs.moles?.length) {
        gs.moles.forEach(mole => {
          if (mole.exposed || mole.layingLow || !gs.activePlayers.includes(mole.player)) return;
          if (Math.random() >= 0.20) return; // 20% for reward (lower stakes than immunity)
          const _coordMole = (seasonConfig.moleCoordination === 'coordinated' && gs.moles.length === 2)
            ? gs.moles.find(ml => ml.player !== mole.player)?.player : null;
          const _sabPool = rScored.filter(x => x.name !== mole.player && (_coordMole ? x.name !== _coordMole : true));
          if (!_sabPool.length) return;
          const _tgt = _sabPool.reduce((best, x) => {
            let sc = threatScore(x.name) * 0.3 + x.score * 0.2 + Math.max(0, -getBond(mole.player, x.name)) * 0.3;
            const _moleAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.includes(mole.player));
            if (!_moleAlliances.some(a => a.members.includes(x.name))) sc += 1.0;
            sc += Math.random() * 0.5;
            return sc > best.sc ? { name: x.name, sc, entry: x } : best;
          }, { name: _sabPool[0].name, sc: -99, entry: _sabPool[0] });
          const _penalty = 1.5 + Math.random() * 2;
          _tgt.entry.score -= _penalty;
          mole.sabotageCount++;
          mole.sabotageLog.push({ ep: (gs.episode || 0) + 1, type: 'challengeSabotage', target: _tgt.name, reward: true });
          mole.resistance = Math.max(0.15, 0.5 - mole.sabotageCount * 0.03);
          if (!gs._moleChalThrows) gs._moleChalThrows = [];
          gs._moleChalThrows.push({ player: mole.player, tribe: gs.mergeName || 'merge', penalty: _penalty, mode: 'target', target: _tgt.name });
        });
      }
      rScored.sort((a,b) => b.score - a.score);
      const rIndScores = {};
      rScored.forEach(s => { rIndScores[s.name] = s.score; });
      twistObj.rewardWinner          = rScored[0].name;
      twistObj.rewardWinnerType      = 'individual';
      twistObj.rewardChalPlacements  = rScored.map(s => s.name);
      twistObj.rewardMemberScores    = rIndScores;
    }

    // ── Track reward challenge performance in chalRecord (half weight — reward is lower stakes than immunity) ──
    if (!gs.chalRecord) gs.chalRecord = {};
    if (twistObj.rewardWinnerType === 'individual' && twistObj.rewardMemberScores) {
      // Individual reward: track podiums/bombs at half weight
      const _rwPlayers = Object.keys(twistObj.rewardMemberScores);
      _rwPlayers.forEach(p => { if (!gs.chalRecord[p]) gs.chalRecord[p] = { wins: 0, podiums: 0, bombs: 0 }; });
      const _rwRanked = [..._rwPlayers].sort((a, b) => twistObj.rewardMemberScores[b] - twistObj.rewardMemberScores[a]);
      if (_rwRanked.length >= 2) {
        _rwRanked.slice(0, 2).forEach(p => { gs.chalRecord[p].podiums += 0.5; });
        _rwRanked.slice(Math.max(0, _rwRanked.length - 2)).forEach(p => { gs.chalRecord[p].bombs += 0.5; });
      }
    } else if (twistObj.rewardWinnerType === 'tribe' && twistObj.rewardChalPlacements?.length) {
      // Tribe reward: track podiums/bombs at half weight per tribe
      twistObj.rewardChalPlacements.forEach(tribe => {
        const ms = tribe.memberScores || {};
        const _rwMembers = Object.keys(ms);
        _rwMembers.forEach(p => { if (!gs.chalRecord[p]) gs.chalRecord[p] = { wins: 0, podiums: 0, bombs: 0 }; });
        const _rwRanked = [..._rwMembers].sort((a, b) => ms[b] - ms[a]);
        if (_rwRanked.length >= 2) {
          _rwRanked.slice(0, 2).forEach(p => { gs.chalRecord[p].podiums += 0.5; });
          _rwRanked.slice(Math.max(0, _rwRanked.length - 2)).forEach(p => { gs.chalRecord[p].bombs += 0.5; });
        }
      });
    }

    // ── Pick reward from pool (phase-aware) and apply effects ──
    const _reward = pickReward();
    twistObj.rewardItemId    = _reward.id;
    twistObj.rewardItemLabel = _reward.label;
    twistObj.rewardItemDesc  = _reward.desc;

    // ── Companion selection (post-merge individual: winner picks companions to share) ──
    if (twistObj.rewardWinnerType === 'individual') {
      const _w = twistObj.rewardWinner;
      const _ws = pStats(_w);
      const _wArch = players.find(p => p.name === _w)?.archetype || '';
      const _others = gs.activePlayers.filter(p => p !== _w);
      const _wPr = pronouns(_w);
      // F7+: pick 2 companions. F6 and below: pick 1 (fewer people, more intimate)
      const _maxCompanions = gs.activePlayers.length >= 7 ? 2 : 1;

      // ── Decision model: heart vs brain ──
      // Heart = pick closest bonds (loyalty-driven). Brain = pick strategically useful people.
      // Blend is proportional: higher strategic/boldness → more brain. Higher loyalty/social → more heart.
      const _brainWeight = _ws.strategic * 0.08 + _ws.boldness * 0.03
        + (['schemer','mastermind'].includes(_wArch) ? 0.25 : _wArch === 'villain' ? 0.15 : 0);
      const _heartWeight = _ws.loyalty * 0.06 + _ws.social * 0.04;
      const _useStrategy = Math.random() < _brainWeight / (_brainWeight + _heartWeight + 0.01);

      // Score each candidate
      const _scored = _others.map(p => {
        const bond = getBond(_w, p);
        const ps = pStats(p);
        // Heart score: bond strength (pick people you like)
        const heartScore = bond * 1.0;
        // Brain score: strategic value (pick people you need to work with)
        const _sharedAlliance = (gs.namedAlliances || []).find(a =>
          a.active !== false && a.members.includes(_w) && a.members.includes(p));
        const _notAllied = !_sharedAlliance && bond < 2; // someone you NEED to court
        const brainScore = (_notAllied ? 2.0 : 0) + ps.strategic * 0.1 + (bond <= 0 ? 1.0 : 0); // court enemies/neutrals
        const score = _useStrategy
          ? brainScore * 0.7 + heartScore * 0.3 + Math.random() * 0.5
          : heartScore * 0.8 + brainScore * 0.2 + Math.random() * 0.5;
        const reason = _useStrategy
          ? (_notAllied ? 'strategic-court' : _sharedAlliance ? 'strategic-strengthen' : 'strategic-read')
          : (bond >= 5 ? 'heart-closest' : bond >= 2 ? 'heart-ally' : 'heart-connection');
        return { name: p, score, bond, reason };
      }).sort((a, b) => b.score - a.score);

      const _companions = [];
      const _pickReasons = [];
      // First companion: best scoring candidate
      if (_scored.length) {
        _companions.push(_scored[0].name);
        _pickReasons.push({ name: _scored[0].name, reason: _scored[0].reason, bond: _scored[0].bond });
      }
      // Second companion: factor in compatibility with first pick
      // Strategic pickers consider whether the pair can work together (for alliance pitch)
      if (_maxCompanions >= 2 && _scored.length >= 2) {
        const _c1 = _companions[0];
        const _bondFloorPick = 0.5 - _ws.strategic * 0.15;
        const _c2Scored = _scored.slice(1).map(c => {
          const _pairBond = getBond(_c1, c.name);
          // Compatibility bonus: if c1 and c2 get along, the reward group works better
          // Strategic pickers weight this more — they're thinking about the alliance pitch
          const _compatBonus = _useStrategy ? _pairBond * 0.3 : _pairBond * 0.1;
          // Penalty if pair bond is below floor — strategic pickers avoid this (pitch will fail)
          const _compatPenalty = (_useStrategy && _pairBond < _bondFloorPick) ? -2.0 : 0;
          return { ...c, adjustedScore: c.score + _compatBonus + _compatPenalty, pairBond: _pairBond };
        }).sort((a, b) => b.adjustedScore - a.adjustedScore);
        if (_c2Scored.length) {
          const _pick2 = _c2Scored[0];
          _companions.push(_pick2.name);
          _pickReasons.push({ name: _pick2.name, reason: _pick2.reason, bond: _pick2.bond, pairBond: Math.round(_pick2.pairBond * 10) / 10 });
        }
      }

      // Bond boost: reward time together strengthens relationships
      _companions.forEach(c => addBond(_w, c, 0.5));
      // Companions also bond with each other (they're sharing the experience)
      if (_companions.length >= 2) addBond(_companions[0], _companions[1], 0.3);

      // Strategic talk during reward — proportional chance to strengthen alliance or pitch new one
      const _rewardGroup = [_w, ..._companions];
      const _existingAlliance = (gs.namedAlliances || []).find(a =>
        a.active !== false && _rewardGroup.every(m => a.members.includes(m)));
      // Strategic talk chance — proportional to stats + emotional state
      // Desperate/paranoid players are MORE likely to use reward time for strategy (they need it)
      const _emotionalBoost = ['desperate','paranoid','calculating'].includes(getPlayerState(_w).emotional) ? 0.15 : 0;
      const _stratTalkChance = _ws.strategic * 0.08 + _ws.social * 0.04 + _emotionalBoost + 0.10;
      // base 10% + stat 5+5 = 60%, stat 8+8 = 86%, stat 3+3 = 46%, + desperate = +15%
      if (_existingAlliance && Math.random() < _stratTalkChance) {
        const _strengthenBoost = _ws.strategic * 0.025; // stat 5 = 0.125, stat 10 = 0.25
        _rewardGroup.forEach(m1 => _rewardGroup.filter(m2 => m2 !== m1).forEach(m2 => addBond(m1, m2, _strengthenBoost)));
        twistObj.rewardAllianceStrengthened = _existingAlliance.name;
      } else if (!_existingAlliance && Math.random() < _stratTalkChance) {
        // Pitch fires — check if bonds support actual alliance formation
        // Avg bond between all reward group members determines success
        let _totalBond = 0, _bondPairs = 0;
        for (let _ri = 0; _ri < _rewardGroup.length; _ri++) {
          for (let _rj = _ri + 1; _rj < _rewardGroup.length; _rj++) {
            _totalBond += getBond(_rewardGroup[_ri], _rewardGroup[_rj]);
            _bondPairs++;
          }
        }
        const _avgGroupBond = _bondPairs > 0 ? _totalBond / _bondPairs : 0;
        // Strategic players can bridge lower bonds (same bondFloor pattern as formAlliances)
        const _bondFloor = 0.5 - _ws.strategic * 0.15;
        // All pairs must tolerate each other to form an alliance
        const _allAboveFloor = (() => {
          for (let _ri = 0; _ri < _rewardGroup.length; _ri++)
            for (let _rj = _ri + 1; _rj < _rewardGroup.length; _rj++)
              if (getBond(_rewardGroup[_ri], _rewardGroup[_rj]) < _bondFloor) return false;
          return true;
        })();
        // Check they're not already all in an alliance together
        const _alreadyAllied = (gs.namedAlliances || []).some(a =>
          a.active !== false && _rewardGroup.every(m => a.members.includes(m)));
        // Check global alliance cap
        const _activeAlliances = (gs.namedAlliances || []).filter(a => a.active !== false).length;
        const _globalCap = Math.max(2, Math.floor(gs.activePlayers.length * 0.4));

        if (_allAboveFloor && !_alreadyAllied && _activeAlliances < _globalCap) {
          // Alliance forms! Away from camp, private setting — perfect conditions
          const _rwAllianceName = nameNewAlliance(_rewardGroup.length);
          gs.namedAlliances.push({
            id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            name: _rwAllianceName, members: [..._rewardGroup],
            formed: (gs.episode || 0) + 1, betrayals: [], active: true,
          });
          // Bonus bond from forming away from camp (private, intimate setting)
          for (let _ri = 0; _ri < _rewardGroup.length; _ri++)
            for (let _rj = _ri + 1; _rj < _rewardGroup.length; _rj++)
              addBond(_rewardGroup[_ri], _rewardGroup[_rj], 0.5);
          twistObj.rewardAlliancePitched = true;
          twistObj.rewardAllianceFormed = _rwAllianceName;
          twistObj.rewardAllianceMembers = [..._rewardGroup];
        } else if (!_allAboveFloor) {
          // Pitch failed — bonds too weak
          twistObj.rewardAlliancePitched = true;
          twistObj.rewardAllianceFailed = true;

          // Bond damage scales with how far below the floor each pair is
          const _failedPairs = [];
          for (let _ri = 0; _ri < _rewardGroup.length; _ri++) {
            for (let _rj = _ri + 1; _rj < _rewardGroup.length; _rj++) {
              const _pairBond = getBond(_rewardGroup[_ri], _rewardGroup[_rj]);
              if (_pairBond < _bondFloor) {
                const _gap = _bondFloor - _pairBond;
                const _damage = -(0.1 + _gap * 0.15);
                addBond(_rewardGroup[_ri], _rewardGroup[_rj], _damage);
                _failedPairs.push({ a: _rewardGroup[_ri], b: _rewardGroup[_rj], bond: Math.round(_pairBond * 10) / 10, damage: Math.round(_damage * 10) / 10 });
              }
            }
          }

          // Chance the rejected person leaks the pitch back at camp
          // Low loyalty = more likely to tell. High loyalty = keeps it quiet.
          const _rejecters = _rewardGroup.filter(p => p !== _w && _failedPairs.some(fp => fp.a === p || fp.b === p));
          _rejecters.forEach(rejecter => {
            const _rjS = pStats(rejecter);
            const _leakChance = (10 - _rjS.loyalty) * 0.06 + _rjS.social * 0.03;
            // loyalty 3, social 7 = 42+21 = 63%. loyalty 8, social 4 = 12+12 = 24%.
            if (Math.random() < _leakChance) {
              // Pick who they tell — closest bond outside the reward group
              const _tellTarget = gs.activePlayers
                .filter(p => !_rewardGroup.includes(p))
                .sort((a, b) => getBond(rejecter, b) - getBond(rejecter, a))[0];
              if (_tellTarget) {
                // The person told now knows the winner is scheming
                addBond(_tellTarget, _w, -0.3); // suspicion toward the pitcher
                if (!twistObj.rewardPitchLeaks) twistObj.rewardPitchLeaks = [];
                twistObj.rewardPitchLeaks.push({ leaker: rejecter, toldTo: _tellTarget });
              }
            }
          });
          twistObj.rewardFailedPairs = _failedPairs;
        }
      }

      twistObj.rewardCompanions = _companions;
      twistObj.rewardPickReasons = _pickReasons;
      twistObj.rewardPickStrategy = _useStrategy ? 'brain' : 'heart';
      twistObj.rewardMaxCompanions = _maxCompanions;

      // ── Snub/alienation: not being picked hurts proportional to bond + temperament ──
      _others.filter(p => !_companions.includes(p)).forEach(p => {
        const _snubBond = getBond(_w, p);
        if (_snubBond <= 0) return; // didn't expect to be picked — no damage
        const _pTemp = pStats(p).temperament;
        // Damage scales with bond (stronger bond = bigger betrayal) AND temperament (hotheads take it harder)
        // Bond 2 = mild, bond 5 = significant, bond 8+ = devastating
        // Low temperament amplifies: temp 2 = 1.4x, temp 5 = 1.0x, temp 10 = 0.75x
        const _tempMult = 1.0 + (5 - _pTemp) * 0.08;
        const _snubDamage = -(_snubBond * 0.08 * _tempMult); // bond 2, temp 5 = -0.16. bond 6, temp 2 = -0.67. bond 8, temp 2 = -0.90
        if (Math.abs(_snubDamage) > 0.1) {
          addBond(p, _w, _snubDamage);
          // Track significant snubs for camp events
          if (_snubBond >= 3) {
            if (!twistObj.rewardSnubs) twistObj.rewardSnubs = [];
            twistObj.rewardSnubs.push({ player: p, bond: _snubBond, damage: Math.round(_snubDamage * 10) / 10 });
          }
        }
      });
      // ── Reward Trip Bonding Backfire: left-behind players organize against reward group ──
      const _snubbedPlayers = (twistObj.rewardSnubs || []).map(s => s.player);
      if (_snubbedPlayers.length >= 1) {
        const _leftBehind = _others.filter(p => !_companions.includes(p));
        let _hasCohesion = false;
        for (let _bi = 0; _bi < _leftBehind.length && !_hasCohesion; _bi++) {
          for (let _bj = _bi + 1; _bj < _leftBehind.length && !_hasCohesion; _bj++) {
            if (getBond(_leftBehind[_bi], _leftBehind[_bj]) >= 1.5) _hasCohesion = true;
          }
        }
        if (_hasCohesion && Math.random() < 0.15) {
          let _lbTotalBond = 0, _lbPairs = 0;
          for (let _bi = 0; _bi < _leftBehind.length; _bi++) {
            for (let _bj = _bi + 1; _bj < _leftBehind.length; _bj++) {
              _lbTotalBond += getBond(_leftBehind[_bi], _leftBehind[_bj]);
              _lbPairs++;
            }
          }
          const _lbAvgBond = _lbPairs > 0 ? _lbTotalBond / _lbPairs : 0;
          const _curEp = (gs.episode || 0) + 1;
          const _campKey = gs.mergeName || 'merge';

          if (_lbAvgBond >= 2.0) {
            // ── Path A: Counter-Alliance ──
            const _maxMembers = Math.floor(gs.activePlayers.length / 2) - 1;
            const _allianceMembers = _leftBehind.filter(p =>
              _snubbedPlayers.some(sp => getBond(p, sp) >= 1.0) || _snubbedPlayers.includes(p)
            ).slice(0, Math.max(2, _maxMembers));

            if (_allianceMembers.length >= 2) {
              for (let _ai = 0; _ai < _allianceMembers.length; _ai++) {
                for (let _aj = _ai + 1; _aj < _allianceMembers.length; _aj++) {
                  addBond(_allianceMembers[_ai], _allianceMembers[_aj], 0.4);
                }
              }
              const _bfAllianceName = nameNewAlliance(_allianceMembers.length);
              gs.namedAlliances.push({
                id: `alliance_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                name: _bfAllianceName, members: [..._allianceMembers],
                formed: _curEp, betrayals: [], active: true,
              });
              gs._rewardBackfireHeat = {
                targets: { [_w]: 1.5 },
                expiresEp: _curEp + 1
              };
              _companions.forEach(c => { gs._rewardBackfireHeat.targets[c] = 0.8; });

              const _bfMemberList = _allianceMembers.length <= 3
                ? _allianceMembers.join(' and ')
                : _allianceMembers.slice(0, -1).join(', ') + ', and ' + _allianceMembers[_allianceMembers.length - 1];
              if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
              if (!ep.campEvents[_campKey].post) ep.campEvents[_campKey].post = [];
              ep.campEvents[_campKey].post.push({
                type: 'rewardBackfireAlliance',
                players: [..._allianceMembers],
                text: `While ${_w} was off enjoying the ${twistObj.rewardItemLabel || 'reward'}, the ones left behind started talking. Really talking. By sundown, ${_bfMemberList} had something — not just anger, but a plan.`,
                consequences: `Alliance "${_bfAllianceName}" formed. Heat on ${_w} +1.5.`,
                badgeText: 'BACKFIRE', badgeClass: 'red-orange'
              });

              twistObj.rewardBackfire = {
                fired: true, path: 'alliance',
                snubbedPlayers: [..._snubbedPlayers],
                leftBehindGroup: [..._leftBehind],
                allianceName: _bfAllianceName,
                allianceMembers: [..._allianceMembers],
                blocPair: null,
                heatTarget: _w,
                heatCompanions: [..._companions],
              };
            }
          } else {
            // ── Path B: Voting Bloc ──
            for (let _si = 0; _si < _snubbedPlayers.length; _si++) {
              for (let _sj = _si + 1; _sj < _snubbedPlayers.length; _sj++) {
                addBond(_snubbedPlayers[_si], _snubbedPlayers[_sj], 0.3);
              }
            }
            gs._rewardBackfireHeat = {
              targets: { [_w]: 1.0 },
              expiresEp: _curEp + 1
            };
            let _blocPair = null;
            if (_snubbedPlayers.length >= 2) {
              let _bestPair = null, _bestBond = -Infinity;
              for (let _si = 0; _si < _snubbedPlayers.length; _si++) {
                for (let _sj = _si + 1; _sj < _snubbedPlayers.length; _sj++) {
                  const _pBond = getBond(_snubbedPlayers[_si], _snubbedPlayers[_sj]);
                  if (_pBond > _bestBond) { _bestBond = _pBond; _bestPair = [_snubbedPlayers[_si], _snubbedPlayers[_sj]]; }
                }
              }
              if (_bestPair) {
                const _initiator = _bestPair[0];
                const _partner = _bestPair[1];
                const _initS = pStats(_initiator);
                const _genuineChance = _initS.loyalty * 0.09 + getBond(_initiator, _partner) * 0.06
                  - (10 - _initS.loyalty) * 0.02
                  - ((gs.sideDeals || []).filter(d => d.active && d.players.includes(_initiator)).length) * 0.2;
                const _genuine = Math.random() < Math.max(0.15, Math.min(0.95, _genuineChance));
                if (!gs.sideDeals) gs.sideDeals = [];
                gs.sideDeals.push({
                  players: [_initiator, _partner], initiator: _initiator, madeEp: _curEp,
                  type: 'f2', active: true, genuine: _genuine
                });
                addBond(_initiator, _partner, 1.0);
                _blocPair = [..._bestPair];
              }
            }
            const _bfP1 = _snubbedPlayers[0];
            const _bfP2 = _snubbedPlayers.length >= 2 ? _snubbedPlayers[1] : null;
            const _bfCompName = _companions[0] || 'someone';
            if (!ep.campEvents[_campKey]) ep.campEvents[_campKey] = { pre: [], post: [] };
            if (!ep.campEvents[_campKey].post) ep.campEvents[_campKey].post = [];
            ep.campEvents[_campKey].post.push({
              type: 'rewardBackfireBloc',
              players: _bfP2 ? [_bfP1, _bfP2] : [_bfP1],
              text: _bfP2
                ? `${_bfP1} and ${_bfP2} sat by the fire, watching the empty shelter. "Funny how ${_w} picks ${_bfCompName} over us." The conversation didn't end there.`
                : `${_bfP1} sat alone by the fire while ${_w} was off on the reward. The sting of not being picked turned into something else — a plan.`,
              consequences: `Bonds strengthened. Heat on ${_w} +1.0.${_blocPair ? ` F2 deal between ${_blocPair[0]} and ${_blocPair[1]}.` : ''}`,
              badgeText: 'LEFT BEHIND', badgeClass: 'red'
            });

            twistObj.rewardBackfire = {
              fired: true, path: 'bloc',
              snubbedPlayers: [..._snubbedPlayers],
              leftBehindGroup: [..._leftBehind],
              allianceName: null,
              allianceMembers: null,
              blocPair: _blocPair,
              heatTarget: _w,
              heatCompanions: [..._companions],
            };
          }
        }
      }
    } else {
      // Tribe: winners bond with each other
      const _winMembers = twistObj.rewardChalPlacements[0]?.members || [];
      for (let _i = 0; _i < _winMembers.length; _i++) {
        for (let _j = _i + 1; _j < _winMembers.length; _j++) {
          addBond(_winMembers[_i], _winMembers[_j], 0.5);
        }
      }
    }

    // ── Pre-merge reward sharing: winning tribe invites one person from losing tribe ──
    if (twistObj.rewardWinnerType === 'tribe' && seasonConfig.rewardSharing && !gs.isMerged) {
      const _winTribeObj = twistObj.rewardChalPlacements[0];
      const _losingTribes = twistObj.rewardChalPlacements.slice(1);
      const _winMembers = _winTribeObj?.members || [];
      if (_winMembers.length >= 2 && _losingTribes.length >= 1) {
        // Roll: tribe decides together — weighted by avg social + strategic of winning tribe
        const _avgSocial = _winMembers.reduce((s, m) => s + pStats(m).social, 0) / _winMembers.length;
        const _avgStrategic = _winMembers.reduce((s, m) => s + pStats(m).strategic, 0) / _winMembers.length;
        const _shareChance = _avgSocial * 0.05 + _avgStrategic * 0.03 + 0.05;
        if (Math.random() < _shareChance) {
          // Tribe decides who to invite — consensus based on bonds across tribal lines
          const _losingPlayers = _losingTribes.flatMap(t => t.members || []);
          if (_losingPlayers.length) {
            // Score each losing player: avg bond with ALL winning tribe members (tribe decision)
            const _inviteScored = _losingPlayers.map(p => {
              const avgBondWithWinners = _winMembers.reduce((s, w) => s + getBond(w, p), 0) / _winMembers.length;
              const isStrategicPick = pStats(p).strategic >= 6 || pStats(p).social >= 6;
              return {
                name: p,
                score: avgBondWithWinners * 0.6 + (isStrategicPick ? 1.0 : 0) + Math.random() * 0.5,
                avgBond: avgBondWithWinners,
                reason: avgBondWithWinners >= 1.5 ? 'cross-tribal-bond' : isStrategicPick ? 'strategic-invite' : 'goodwill',
              };
            }).sort((a, b) => b.score - a.score);
            const _invited = _inviteScored[0];

            // Effects
            // Bond boost: invited + each winning tribe member (shared experience)
            _winMembers.forEach(w => addBond(w, _invited.name, 0.4));
            // Losing tribemates: mild resentment toward the invited (why YOU?)
            const _invTribe = _losingTribes.find(t => (t.members || []).includes(_invited.name));
            (_invTribe?.members || []).filter(m => m !== _invited.name).forEach(m => {
              if (Math.random() < 0.3) addBond(m, _invited.name, -0.15);
            });
            // Survival boost for invited (they ate)
            if (seasonConfig.foodWater === 'enabled' && gs.survival) {
              gs.survival[_invited.name] = Math.min(100, (gs.survival[_invited.name] || 80) + 8);
            }

            const _reasonText = _invited.reason === 'cross-tribal-bond'
              ? `The tribe had connections with ${_invited.name} from swaps and shared challenges. This was personal.`
              : _invited.reason === 'strategic-invite'
              ? `${_invited.name} is someone the tribe wants to work with after the merge. This was strategic.`
              : `A goodwill gesture. ${_invited.name} looked like ${pronouns(_invited.name).sub} needed it.`;

            twistObj.rewardShareInvite = {
              invited: _invited.name, invitedBy: _winTribeObj.name,
              reason: _invited.reason, reasonText: _reasonText,
              avgBond: Math.round(_invited.avgBond * 10) / 10,
            };
            // Also save directly on ep for patchEpisodeHistory (some push paths don't build rewardChalData)
            ep.rewardShareInvite = twistObj.rewardShareInvite;
          }
        }
      }
    }

    // ── Survival food restoration from reward ──
    if (seasonConfig.foodWater === 'enabled') {
      const _foodBonus = { feast: 25, overnight: 20, comfort: 10, supplies: 15, spa: 10, letters: 0, clue: 0 };
      const _survBonus = { feast: 15, overnight: 12, comfort: 8, supplies: 8, spa: 8, letters: 0, clue: 0 };
      const _tribeBoost = _foodBonus[_reward.id] || 0;
      const _playerBoost = _survBonus[_reward.id] || 0;
      if (twistObj.rewardWinnerType === 'tribe') {
        const _winTribe = twistObj.rewardChalPlacements[0]?.name || '';
        if (_winTribe && _tribeBoost > 0) gs.tribeFood[_winTribe] = Math.min(100, (gs.tribeFood[_winTribe] || 60) + _tribeBoost);
        if (_playerBoost > 0) (twistObj.rewardChalPlacements[0]?.members || []).forEach(p => {
          gs.survival[p] = Math.min(100, (gs.survival[p] || 80) + _playerBoost);
        });
      } else {
        // Individual: winner + companions get the food. Merged tribe food gets a smaller boost.
        const _mergeName = gs.mergeName || 'merge';
        if (_tribeBoost > 0) gs.tribeFood[_mergeName] = Math.min(100, (gs.tribeFood[_mergeName] || 60) + Math.round(_tribeBoost * 0.5)); // half for tribe (only some people ate)
        const _fedPlayers = [twistObj.rewardWinner, ...(twistObj.rewardCompanions || [])].filter(Boolean);
        if (_playerBoost > 0) _fedPlayers.forEach(p => {
          gs.survival[p] = Math.min(100, (gs.survival[p] || 80) + _playerBoost);
        });
      }
    }

    // ── Reward-specific effects ──
    if (_reward.id === 'clue') {
      const _winMembers = twistObj.rewardWinnerType === 'tribe'
        ? (twistObj.rewardChalPlacements[0]?.members || [])
        : [twistObj.rewardWinner];
      const _cluedPlayer = _winMembers[Math.floor(Math.random() * _winMembers.length)];
      twistObj.rewardCluedPlayer = _cluedPlayer;
    }

  } else if (engineType === 'fan-vote-boot') {
    if (!seasonConfig.popularityEnabled) { twistObj.blocked = true; return; }
    const _pop = gs.popularity || {};
    const _sorted = [...gs.activePlayers].sort((a, b) => {
      const diff = (_pop[b] || 0) - (_pop[a] || 0);
      if (diff !== 0) return diff;
      const iA = players.findIndex(p => p.name === a);
      const iB = players.findIndex(p => p.name === b);
      return iA - iB;
    });
    const saved = _sorted[0] || gs.activePlayers[0];
    twistObj.fanVoteSaved = saved;
    twistObj.fanVoteScore = _pop[saved] || 0;
    twistObj.fanVoteIsPreMerge = gs.phase === 'pre-merge';
    twistObj.fanVote = true;
    // Full ranking for VP reveal
    const _totalPop = _sorted.reduce((s, n) => s + Math.max(0, _pop[n] || 0), 0) || 1;
    twistObj.fanVoteResults = _sorted.map(n => ({ name: n, pct: Math.round((_pop[n] || 0) / _totalPop * 100), popularity: _pop[n] || 0 }));
    // Reward
    if (gs.phase === 'pre-merge') {
      gs.guaranteedImmuneThisEp = saved;
    } else {
      gs.advantages.push({ holder: saved, type: 'extraVote', foundEp: ep.num, fromFanVote: true });
    }
    // Winner emotional boost
    if (gs.playerStates?.[saved]) gs.playerStates[saved].emotional = 'confident';
    // Consequence events — carry forward for next camp events
    gs.fanVoteWinner = saved;
    gs.fanVoteEp = (gs.episode || 0) + 1;

  } else if (engineType === 'jury-elimination') {
    // Every eliminated player is on the "jury" — they vote to boot one active player
    // Immunity winner will be excluded at resolution time (not known yet at twist setup)
    twistObj.juryElimination = true;

  } else if (engineType === 'tied-destinies') {
    // Post-merge only, even player count required
    if (gs.phase === 'pre-merge' || gs.activePlayers.length % 2 !== 0) return;
    // Generate random pairs
    const _tdPool = [...gs.activePlayers].sort(() => Math.random() - 0.5);
    const _tdPairs = [];
    for (let i = 0; i < _tdPool.length; i += 2) {
      _tdPairs.push({ a: _tdPool[i], b: _tdPool[i + 1] });
    }
    // Emotional reactions based on bond
    const _tdReactions = {};
    _tdPairs.forEach(pair => {
      const bond = getBond(pair.a, pair.b);
      const react = bond >= 3 ? 'relieved' : bond >= 0 ? 'cautious' : bond >= -5 ? 'dread' : 'fury';
      _tdReactions[pair.a] = react;
      _tdReactions[pair.b] = react;
    });
    twistObj.tiedDestinies = true;
    twistObj.pairs = _tdPairs;
    twistObj.reactions = _tdReactions;
    // Store on ep for access by other systems
    ep.tiedDestinies = { pairs: _tdPairs, reactions: _tdReactions };
    gs._tiedDestiniesActive = _tdPairs; // for computeHeat pair-awareness
    // Inject pair camp events
    const campKey = gs.mergeName || 'merge';
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    const _tdEvts = ep.campEvents[campKey].pre || [];
    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
    _tdPairs.forEach(pair => {
      const bond = getBond(pair.a, pair.b);
      const pA = pronouns(pair.a), pB = pronouns(pair.b);
      if (bond < 0) {
        // Partner tension
        addBond(pair.a, pair.b, -0.3);
        _tdEvts.push({ type: 'tiedDestinyTension', players: [pair.a, pair.b], badgeText: 'TIED DESTINIES', text: _pick([
          `${pair.a} and ${pair.b} are tied together. Neither is happy about it. The silence between them says everything.`,
          `"Of all the people..." ${pair.a} stares at ${pair.b}. ${pair.b} stares back. This is going to be a long day.`,
          `${pair.a} and ${pair.b} are paired. The bond between them is hostile at best. If one goes, they both go — and right now, neither is sure that's the worst outcome.`,
        ]) });
      } else if (bond < 1) {
        // Partner reluctance
        addBond(pair.a, pair.b, 0.2);
        _tdEvts.push({ type: 'tiedDestinyReluctance', players: [pair.a, pair.b], badgeText: 'TIED DESTINIES', text: _pick([
          `${pair.a} and ${pair.b} look at each other. Not enemies. Not allies. Just... stuck. They'll have to figure it out before tribal.`,
          `"Guess we're in this together." ${pair.a} extends a hand. ${pair.b} takes it without enthusiasm. The alliance of necessity begins.`,
          `${pair.a} and ${pair.b} barely know each other's game. Now their fates are linked. The awkward strategy session that follows is painful to watch.`,
        ]) });
      } else {
        // Partner strategy
        addBond(pair.a, pair.b, 0.4);
        _tdEvts.push({ type: 'tiedDestinyStrategy', players: [pair.a, pair.b], badgeText: 'TIED DESTINIES', text: _pick([
          `${pair.a} and ${pair.b} are paired — and they're both relieved. They immediately start strategizing. "We need to make sure nobody comes for us."`,
          `Of all the pairings, ${pair.a} and ${pair.b} got lucky. They trust each other. Now they just need the rest of the tribe to leave them alone.`,
          `${pair.a} pulls ${pair.b} aside. "We're safe if we play this right. Nobody wants a double elimination of two strong players." The plan forms fast.`,
        ]) });
      }
    });
    // Tribe debate events
    const _debateCount = Math.min(3, _tdPairs.length);
    for (let d = 0; d < _debateCount; d++) {
      const _debatePair = _tdPairs[d];
      const _paThreat = threatScore(_debatePair.a), _pbThreat = threatScore(_debatePair.b);
      const _combinedThreat = _paThreat + _pbThreat;
      _tdEvts.push({ type: 'tiedDestinyDebate', players: [_debatePair.a, _debatePair.b], badgeText: 'TIED DESTINIES', text: _pick([
        `The tribe debates: vote out ${_debatePair.a} and lose ${_debatePair.b} too. Is it worth it? The math is ugly either way.`,
        `"If we go after ${_debatePair.a}, we lose ${_debatePair.b}." The tribe weighs the cost. Two eliminations for one vote — someone's getting a raw deal.`,
        `Strategy sessions explode across camp. Every conversation circles back to the same question: which pair do we sacrifice?`,
      ]) });
    }

  } else if (engineType === 'aftermath') {
    twistObj.aftermath = true; // generateAftermathShow handles everything in patchEpisodeHistory
  } else if (engineType === 'shot-in-dark') {
    gs.shotInDarkEnabledThisEp = true;
  }
  // 'no-tribal' — flag the episode so simulateEpisode skips tribal
  if (engineType === 'no-tribal') {
    ep.noTribal = true;
  }
}

export function generateTwistScenes(ep) {
  const twistList = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);
  const result = [];
  const active = gs.activePlayers.slice();

  twistList.forEach(tw => {
    const sc = [];
    switch (tw.type) {

      case 'ambassadors':
        if (tw.ambassadorMeeting) {
          const am = tw.ambassadorMeeting;
          sc.push({ text: 'Each tribe must name one ambassador. The ambassadors will meet — and one person\'s game ends tonight.', players: am.ambassadors || [] });
          am.types?.forEach(t => sc.push({ text: `${t.name} represents ${tw.ambassadorSelections?.find(s => s.ambassador === t.name)?.tribe || 'their tribe'}.`, players: [t.name], badge: t.type === 'manipulator' ? 'Manipulator' : t.type === 'villain' ? 'Villain' : t.type === 'dealmaker' ? 'Dealmaker' : t.type === 'loyal-shield' ? 'Loyal Shield' : 'Emotional', badgeClass: t.type === 'villain' ? 'red' : 'gold' }));
          if (am.agreed) sc.push({ text: `The ambassadors agreed. ${am.target} is eliminated — without a vote, without a chance to fight.`, players: [am.target], badge: 'ELIMINATED', badgeClass: 'red' });
          else sc.push({ text: `No agreement. ${am.rockDrawLoser} drew the wrong rock. Gone.`, players: [am.rockDrawLoser], badge: 'ROCK DRAW', badgeClass: 'red' });
        }
        result.push({ label:'Ambassadors', type:tw.type, scenes:sc }); break;

      case 'tribe-swap':
        sc.push({ text: 'Drop your buffs.', players: (tw.newTribes||[]).flatMap(t=>t.members) });
        sc.push({ text: 'The game has been reshuffled. Every alliance, every bond, every strategic position — subject to review.', players: [] });
        (tw.newTribes||[]).forEach(t => sc.push({ text: t.name, players: t.members, tribeLabel: t.name }));
        sc.push({ text: 'New Hidden Immunity Idols have been hidden at each tribe\'s camp.', players: [] });
        result.push({ label:'Tribe Swap', type:tw.type, scenes:sc }); break;

      case 'tribe-dissolve':
        sc.push({ text: 'Drop your buffs.', players: (tw.newTribes||[]).flatMap(t=>t.members) });
        sc.push({ text: `${tw.dissolvedTribe||'One tribe'} has been dissolved. ${(tw.newTribes||[]).length} tribes remain.`, players: [] });
        (tw.newTribes||[]).forEach(t => sc.push({ text: t.name, players: t.members, tribeLabel: t.name }));
        sc.push({ text: 'New Hidden Immunity Idols have been hidden at each tribe\'s camp.', players: [] });
        result.push({ label:'Tribe Dissolve', type:tw.type, scenes:sc }); break;

      case 'tribe-expansion':
        sc.push({ text: `Drop your buffs. A new tribe has been formed: ${tw.newTribeName||'New Tribe'}.`, players: (tw.newTribes||[]).flatMap(t=>t.members) });
        sc.push({ text: 'The game just got more complicated.', players: [] });
        (tw.newTribes||[]).forEach(t => sc.push({ text: t.name, players: t.members, tribeLabel: t.name }));
        sc.push({ text: 'New Hidden Immunity Idols have been hidden at each tribe\'s camp.', players: [] });
        result.push({ label:'Tribe Expansion', type:tw.type, scenes:sc }); break;

      case 'mutiny': {
        const mut = tw.mutineers||[];
        const _numTribes = (ep.tribesAtStart || gs.tribes).length;
        const _tribesWord = _numTribes === 2 ? 'Both tribes were' : `All ${_numTribes} tribes were`;
        const _joinWord = _numTribes === 2 ? 'join the other' : 'join another tribe';
        sc.push({ text: `${_tribesWord} brought to a neutral location. The offer was simple — and impossible to ignore.`, players: active });
        sc.push({ text: `Any player may voluntarily leave their tribe and ${_joinWord}. Step forward now — or stay where you are.`, players: active });
        if (mut.length) {
          mut.forEach(m => {
            sc.push({ text: `${m.name} stepped off the mat.`, players: [m.name] });
            sc.push({ text: `${m.name} left ${m.from} and joined ${m.to}. No going back.`, players: [m.name] });
          });
        } else {
          sc.push({ text: 'Nobody moved. The tribes remained exactly as they were.', players: [] });
        }
        result.push({ label:'Mutiny', type:tw.type, scenes:sc }); break;
      }

      case 'exile-island':
        break; // shown post-challenge in buildVPScreens — not here

      case 'first-impressions':
        break; // dedicated VP screen — rpBuildFirstImpressions

      case 'journey':
        break; // journey scenes generated separately from ep.journey data below

      case 'fire-making':
        sc.push({ text: 'Tonight, the person voted out gets a Second Life.', players: [] });
        sc.push({ text: 'They pick any non-immune player to challenge in a head-to-head duel. The type of duel is random. The loser is permanently eliminated.', players: [] });
        result.push({ label:'Second Life', type:tw.type, scenes:sc }); break;

      case 'hero-duel':
        // Pre-challenge: just the announcement (participants not known yet)
        sc.push({ text: 'After the challenge, two players will face off in a Hero Duel for safety.', players: [] });
        sc.push({ text: 'The winner earns immunity. The loser is vulnerable at tonight\'s Tribal Council.', players: [] });
        result.push({ label:'Hero Duel', type:tw.type, scenes:sc }); break;

      case 'shared-immunity':
        sc.push({ text: 'Tonight, the immunity winner will have the power to share the necklace with one other player.', players: [] });
        sc.push({ text: 'If they choose to share, both players are completely safe at Tribal Council.', players: [] });
        result.push({ label:'Shared Immunity', type:tw.type, scenes:sc }); break;

      case 'double-safety':
        sc.push({ text: 'Tonight, two players will earn immunity — the challenge winner and the runner-up.', players: [] });
        sc.push({ text: 'Second place has never mattered more.', players: [] });
        result.push({ label:'Double Safety', type:tw.type, scenes:sc }); break;

      case 'guardian-angel': {
        // Pre-challenge: announcement only
        sc.push({ text: 'After the challenge, one player will earn automatic immunity — not through winning, but through the strength of their relationships.', players: [] });
        sc.push({ text: 'The jury and the camp have been watching. The most connected player earns a Guardian Angel.', players: [] });
        result.push({ label:'Guardian Angel', type:tw.type, scenes:sc }); break;
      }

      case 'sudden-death': {
        // Show ALL players — don't spoil who goes home. The result is on the Sudden Death screen.
        const _sdAllPlayers = [...(ep.gsSnapshot?.activePlayers || gs.activePlayers), ep.suddenDeathEliminated].filter(Boolean);
        const _sdUnique = [...new Set(_sdAllPlayers)];
        sc.push({ text: 'The host gathers the tribe. "Today is different. There is no tribal council tonight."', players: _sdUnique });
        sc.push({ text: '"Instead — the person who finishes LAST in today\'s challenge will be immediately eliminated. No vote. No discussion. No second chance."', players: [] });
        sc.push({ text: 'The tribe absorbs the news. Every challenge before this was about winning safety. This one is about avoiding the end.', players: [] });
        result.push({ label:'Sudden Death', type:tw.type, scenes:sc }); break;
      }

      case 'slasher-night': {
        // Use round 1 remaining (all players before any elimination) to avoid spoilers
        const _slAll = ep.slasherNight?.rounds?.[0]?.remaining
          || (ep.tribesAtStart || []).flatMap(t => t.members);
        sc.push({ text: 'Night falls. A slasher is loose at camp. Survive — or don\'t.', players: _slAll.length ? _slAll : active });
        sc.push({ text: 'Players will be hunted round by round. Last one standing wins immunity. The player who handles the fear worst is eliminated on the spot. No tribal council tonight.', players: [] });
        result.push({ label:'Slasher Night', type:tw.type, scenes:sc }); break;
      }

      case 'cultural-reset': {
        sc.push({ text: 'Every secret in the game was laid bare at once.', players: active });
        if (tw.revealedAlliances?.length) {
          sc.push({ text: `The following alliances are now public knowledge: ${tw.revealedAlliances.join(', ')}.`, players: active });
        }
        // Alliance outcomes
        if (tw.allianceOutcomes) {
          Object.entries(tw.allianceOutcomes).forEach(([aName, outcome]) => {
            const al = (gs.namedAlliances||[]).find(a => a.name === aName);
            const members = al ? al.members.filter(m => active.includes(m)) : [];
            if (outcome === 'survived') {
              sc.push({ text: `${aName} survives the reset — but being public makes them a target.`, players: members, badge: 'SURVIVED', badgeClass: 'green' });
            } else if (outcome === 'cracked') {
              const stayed = (tw.crackDecisions||[]).filter(d => d.alliance === aName && d.stayed).map(d => d.player);
              const left = (tw.crackDecisions||[]).filter(d => d.alliance === aName && !d.stayed).map(d => d.player);
              sc.push({ text: `${aName} cracked. ${left.length ? left.join(', ') + ' walked away.' : 'Fractures appeared.'} ${stayed.length ? stayed.join(', ') + ' chose to stay.' : ''}`, players: [...stayed, ...left], badge: 'CRACKED', badgeClass: 'gold' });
            } else {
              sc.push({ text: `${aName} couldn't survive the light. The alliance is dissolved.`, players: members, badge: 'DISSOLVED', badgeClass: 'bad' });
            }
          });
        }
        // Exposed double-dippers
        if (tw.exposedPlayers?.length) {
          tw.exposedPlayers.forEach(exp => {
            const badge = exp.conflicting ? 'CONFLICTING' : 'OVERLAPPING';
            const bClass = exp.conflicting ? 'bad' : 'gold';
            sc.push({ text: `${exp.name} was caught in ${exp.alliances.join(' and ')}.${exp.conflicting ? ' Playing both sides against each other.' : ' Multiple angles, same direction.'}`, players: [exp.name], badge, badgeClass: bClass });
          });
        }
        // Free agents
        if (tw.freeAgents?.length) {
          sc.push({ text: `Free agents after the reset: ${tw.freeAgents.join(', ')}. No alliance, no baggage — and suddenly, that's valuable.`, players: tw.freeAgents, badge: 'FREE AGENT', badgeClass: 'green' });
        }
        // Personality reactions
        if (tw.personalityReactions?.length) {
          const reactionBadges = { pivot:'PIVOTING', devastated:'DEVASTATED', 'owns-it':'OWNS IT', withdrawn:'WITHDRAWN', vindicated:'VINDICATED', composed:'COMPOSED', explodes:'EXPLODES' };
          const reactionClass = { pivot:'gold', devastated:'bad', 'owns-it':'gold', withdrawn:'bad', vindicated:'green', composed:'green', explodes:'bad' };
          tw.personalityReactions.forEach(r => {
            sc.push({ text: r.text, players: [r.name], badge: reactionBadges[r.type] || r.type.toUpperCase(), badgeClass: reactionClass[r.type] || 'gold' });
          });
        }
        sc.push({ text: 'The social game resets. Same people. New rules. The scramble starts now.', players: active });
        result.push({ label:'Cultural Reset', type:tw.type, scenes:sc }); break;
      }

      case 'spirit-island': {
        // Teaser only — don't spoil who returns. Dedicated VP screen has the full reveal.
        sc.push({ text: 'A figure appears on the path. Someone the tribe thought they\'d seen the last of.', players: [] });
        sc.push({ text: 'A jury member is returning to camp for one day. They\'ve been watching. They have opinions.', players: [] });
        result.push({ label:'Spirit Island', type:tw.type, scenes:sc }); break;
      }

      case 'loved-ones': {
        // Include the eliminated player — they were part of the loved ones visit before tribal
        const _lovedActive = [...new Set([...active, ...[ep.eliminated, ep.firstEliminated].filter(Boolean)])];
        sc.push({ text: 'They hadn\'t seen a familiar face in weeks.', players: _lovedActive });
        sc.push({ text: 'Players\' loved ones arrived at camp — family, partners, closest friends. Some broke down immediately. Others held it together, already calculating what this means for the game.', players: _lovedActive });
        sc.push({ text: 'Tribal Council still runs tonight. The loved ones will watch.', players: [] });
        result.push({ label:'Loved Ones Visit', type:tw.type, scenes:sc }); break;
      }

      case 'reward-challenge':
        // Reward challenge has its own dedicated VP screen — skip here.
        break;

      case 'second-chance': {
        // Dedicated VP screen handles the full reveal — teaser only here
        if (tw.blocked) {
          sc.push({ text: 'A Second Chance Vote was planned — but Redemption Island is active. The twist is cancelled.', players: [] });
        } else if (tw.returnee) {
          sc.push({ text: 'The fans have spoken.', players: [] });
          sc.push({ text: 'One eliminated player is getting a second chance. The votes are in.', players: [] });
        } else {
          sc.push({ text: 'A Second Chance Vote was planned — but no eligible players could return.', players: [] });
        }
        result.push({ label:'Second Chance Vote', type:tw.type, scenes:sc }); break;
      }

      case 'returning-player':
        if (tw.returnees?.length) {
          const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'the drama they bring', 'strategic-threat':'the threat they pose', 'underdog':'a second shot', 'random':'sheer will' };
          if (tw.returnees.length === 1) {
            sc.push({ text: 'A door that was supposed to be closed just opened.', players: [tw.returnees[0].name] });
            sc.push({ text: `${tw.returnees[0].name} fought their way back — driven by ${_rpReasonLabel[tw.returnees[0].reason] || 'sheer will'}.`, players: [tw.returnees[0].name], badge:'Returns', badgeClass:'win' });
          } else {
            sc.push({ text: `${tw.returnees.length} doors that were supposed to be closed just opened.`, players: tw.returnees.map(r => r.name) });
            tw.returnees.forEach(r => {
              sc.push({ text: `${r.name} is back — driven by ${_rpReasonLabel[r.reason] || 'sheer will'}.`, players: [r.name], badge:'Returns', badgeClass:'win' });
            });
          }
        } else if (tw.returnee) {
          sc.push({ text: 'A door that was supposed to be closed just opened.', players: [tw.returnee] });
          sc.push({ text: `${tw.returnee} fought their way back into the game.`, players: [tw.returnee], badge:'Returns', badgeClass:'win' });
        } else {
          sc.push({ text: 'A returning player slot was on the line — no eligible players could make it back this episode.', players: [] });
        }
        result.push({ label:'Returning Player', type:tw.type, scenes:sc }); break;

      case 'abduction':
        if (tw.stolen?.length) {
          sc.push({ text: 'Each tribe had the power to take one player from a rival tribe. No warning. No negotiation.', players: active });
          // Show tribes BEFORE abduction
          if (tw.oldTribes?.length) {
            sc.push({ text: 'Before:', players: [] });
            tw.oldTribes.forEach(t => sc.push({ text: t.name, players: t.members, tribeLabel: t.name }));
          }
          tw.stolen.forEach(s => {
            sc.push({ text: `${s.to} chose to take ${s.name} from ${s.from}.`, players: [s.name] });
            if (s.reason) sc.push({ text: s.reason, players: [s.name] });
            sc.push({ text: `${s.name} left their tribe and joined ${s.to}. They had no say in the matter.`, players: [s.name] });
            if (s.reaction === 'resists') sc.push({ text: `${s.name} is not happy about it. The loyalty to ${s.from} is clear.`, players: [s.name], badge: 'RESISTS', badgeClass: 'bad' });
            else if (s.reaction === 'embraces') sc.push({ text: `${s.name} takes it in stride — maybe even welcomes the change.`, players: [s.name], badge: 'FRESH START', badgeClass: 'green' });
            else sc.push({ text: `${s.name} says nothing. The tribe watches, waiting to see which way this goes.`, players: [s.name], badge: 'CAUTIOUS', badgeClass: 'gold' });
          });
          // Show tribes AFTER abduction
          sc.push({ text: 'After:', players: [] });
          (tw.newTribes || ep.tribesAtStart || []).forEach(t => {
            sc.push({ text: t.name, players: t.members, tribeLabel: t.name });
          });
        } else {
          sc.push({ text: 'Abduction was offered but the tribes were too depleted for it to fire.', players: [] });
        }
        result.push({ label:'Abduction', type:tw.type, scenes:sc }); break;

      case 'auction': {
        // Use tribesAtStart (pre-elimination) for auction — it happens before the vote
        const _auctionPlayers = (ep.tribesAtStart || []).flatMap(t => t.members);
        const _auctionActive = _auctionPlayers.length ? _auctionPlayers : active;
        sc.push({ text: 'Each player received $500 to spend at the Survivor Auction — food, comfort, and possibly an advantage hidden among the items.', players: _auctionActive });
        (tw.auctionResults||[]).forEach(r => {
          const isAdv = /vote|idol|advantage|steal|immunity|amulet|second life/i.test(r.label||'') || r.effect === 'immunity' || r.effect === 'secondLife';
          sc.push({ text: `${r.winner} wins: ${r.label}${r.isPool?' (pooled bid)':''} — $${r.bid}.`, players: [r.winnerName || r.winner], badge: isAdv?'Advantage':undefined, badgeClass: isAdv?'win':undefined });
        });
        // Players who won nothing — show them so they're not silently omitted
        { const _auctionWinners = new Set((tw.auctionResults||[]).map(r => r.winnerName || r.winner));
          const _wonNothing = _auctionActive.filter(n => !_auctionWinners.has(n));
          _wonNothing.forEach(n => {
            sc.push({ text: `${n} was outbid on everything. Walked away empty-handed.`, players: [n] });
          });
        }
        result.push({ label:'Survivor Auction', type:tw.type, scenes:sc }); break;
      }

      case 'three-gifts': {
        if (tw.giftResults) {
          // Nomination drama — before anyone left camp
          if (tw.nominationDrama?.length) {
            tw.nominationDrama.forEach(({ player, tribe, event }) => {
              sc.push({ text: event.text, players: event.mentioned || [player] });
            });
          }

          const nominees = tw.giftResults.map(r=>r.player);
          sc.push({ text: 'One player from each tribe was chosen to leave camp and travel to a private location.', players: nominees });
          sc.push({ text: 'Each nominee was presented with three sealed gifts. They had to choose one — without consulting their tribe.', players: nominees });
          sc.push({ text: 'Gift 1: Tribal Survival Kit — a pot, machete, and flint. Everything the tribe needs at camp. Gift 2: Hidden Immunity Idol Clue — pointing directly to an idol buried at their tribe\'s camp. Gift 3: Immunity Totem — a live Hidden Immunity Idol. No clue, no search. Theirs to keep.', players: [] });
          const gBadges = {1:'Survival Kit', 2:'Idol Clue', 3:'Immunity Totem'};
          const gClass  = {1:'', 2:'win', 3:'win'};
          tw.giftResults.forEach(({player, tribe, gift, searchOutcome}) => {
            const motives = {
              1: `chose to give back to ${tribe} — pot, machete, and flint will be waiting at camp`,
              2: `chose the idol clue — ${player} will search ${tribe}'s camp for the Hidden Immunity Idol`,
              3: `chose the Immunity Totem for themselves — ${tribe} gets nothing, and everyone knows it`,
            };
            sc.push({ text: `${player} ${motives[gift]||'made a choice'}.`, players: [player], badge: gBadges[gift], badgeClass: gClass[gift] });
            if (gift === 2) {
              if (searchOutcome === 'found') {
                sc.push({ text: `${player} searches ${tribe}'s camp and finds the Hidden Immunity Idol.`, players: [player], badge:'Hidden Immunity Idol', badgeClass:'win' });
              } else if (searchOutcome === 'slotTaken') {
                sc.push({ text: `${player} searches ${tribe}'s camp — but the idol has already been found by someone else. The clue leads nowhere.`, players: [player], badge:'Search Failed', badgeClass:'bad' });
              } else {
                // 'failed' or legacy saves without searchOutcome
                sc.push({ text: `${player} searches ${tribe}'s camp — close, but the idol stays hidden. It's still out there.`, players: [player], badge:'Search Failed', badgeClass:'bad' });
              }
            }
          });
          if (tw.giftDrama?.length) {
            tw.giftDrama.forEach(({player, reason, affected}) => {
              sc.push({ text: `Back at camp, ${player} ${reason}.`, players: [player] });
              if (affected?.length) sc.push({ text: `${affected.join(', ')} ${affected.length===1?'now knows':'now know'} about the Immunity Totem. The trust between them is damaged.`, players: [player, ...affected], badge:'Trust Damaged', badgeClass:'bad' });
            });
          }
        }
        result.push({ label:'The Summit', type:tw.type, scenes:sc }); break;
      }

      case 'penalty-vote':
        if (tw.penaltyTarget) sc.push({ text: `${tw.penaltyTarget} enters Tribal Council with one pre-cast vote against them.`, players: [tw.penaltyTarget], badge:'+1 Vote', badgeClass:'bad' });
        result.push({ label:'Penalty Vote', type:tw.type, scenes:sc }); break;

      case 'fan-vote-boot':
        if (tw.fanVoteSaved) {
          const _fvReward = tw.fanVoteIsPreMerge ? 'tribal immunity' : 'an Extra Vote';
          sc.push({ text: `The fans have voted. ${tw.fanVoteSaved} is the most popular player in the game.`, players: [tw.fanVoteSaved], badge: `Score: ${tw.fanVoteScore || 0}`, badgeClass: 'win' });
          sc.push({ text: `Fans have spoken — ${tw.fanVoteSaved} receives ${_fvReward}.`, players: [tw.fanVoteSaved], badge: 'FAN VOTE SAVE', badgeClass: 'win' });
        }
        result.push({ label:'Fan Vote', type:tw.type, scenes:sc }); break;

      case 'tiebreaker-challenge':
        sc.push({ text: 'If the vote results in a tie tonight, there will be no revote and no rock draw.', players: [] });
        sc.push({ text: 'Tied players will immediately compete in a head-to-head challenge. The loser is eliminated on the spot.', players: [] });
        result.push({ label:'Tiebreaker', type:tw.type, scenes:sc }); break;

      case 'jury-elimination':
        sc.push({ text: 'The jury has been given power.', players: [] });
        sc.push({ text: 'All eliminated players have collectively voted to remove one active player from the game. That result will be revealed after tonight\'s vote.', players: [] });
        result.push({ label:'Jury Elimination', type:tw.type, scenes:sc }); break;

      case 'rock-draw':
        sc.push({ text: 'If the vote ties tonight, there is no second chance.', players: [] });
        sc.push({ text: 'Non-immune players must draw rocks immediately. The player who draws the wrong rock goes home.', players: [] });
        result.push({ label:'Rock Draw', type:tw.type, scenes:sc }); break;

      case 'open-vote':
        sc.push({ text: 'Tonight, the vote will be open.', players: active });
        sc.push({ text: 'Every player announces their vote out loud — name called in front of the tribe. No urn. No paper. No cover.', players: [] });
        sc.push({ text: 'In a game built on secrecy, a public vote cuts differently. Whoever you name, they hear it. So does everyone else.', players: [] });
        sc.push({ text: 'Alliances hold — or they fracture right here, in front of everyone.', players: [] });
        result.push({ label:'Open Vote', type:tw.type, scenes:sc }); break;

      case 'legacy-awakens':
        if (tw.legacyActivated) {
          sc.push({ text: 'The Legacy Advantage has awakened.', players: [tw.legacyActivated] });
          sc.push({ text: `${tw.legacyActivated}'s Legacy Advantage fires — they are immune at tonight's Tribal Council.`, players: [tw.legacyActivated], badge:'Immune', badgeClass:'win' });
        }
        result.push({ label:'Legacy Advantage', type:tw.type, scenes:sc }); break;

      case 'amulet-activate':
        if (tw.amuletActivated) {
          sc.push({ text: `${tw.amuletActivated}'s Amulet activates.`, players: [tw.amuletActivated] });
          sc.push({ text: `${tw.amuletActivated} is immune at tonight's Tribal Council.`, players: [tw.amuletActivated], badge:'Immune', badgeClass:'win' });
        }
        result.push({ label:'Amulet Activates', type:tw.type, scenes:sc }); break;

      case 'idol-wager': {
        const _wResults = tw.idolWagerResults || [];
        if (!_wResults.length || _wResults[0]?.decision === 'no-idols') {
          sc.push({ text: 'The Idol Wager was offered — but no one holds an idol to risk.', players: [] });
        } else {
          sc.push({ text: 'The Idol Wager. Every idol holder must decide: risk it all for a Super Idol, or play it safe.', players: [] });
          _wResults.forEach(r => {
            if (r.decision === 'declined') {
              sc.push({ text: `${r.holder} holds the idol in ${pronouns(r.holder).posAdj} hands... and puts it back. Too much to lose.`, players: [r.holder], badge: 'Declined', badgeClass: '' });
            } else if (r.won) {
              sc.push({ text: `${r.holder} accepts the wager. The challenge: ${r.challenge} — testing ${pronouns(r.holder).posAdj} weakest area.`, players: [r.holder] });
              sc.push({ text: `${r.holder} wins. The idol transforms. It's now a Super Idol — playable for anyone, even after votes are read.`, players: [r.holder], badge: 'Super Idol', badgeClass: 'win' });
            } else {
              sc.push({ text: `${r.holder} accepts the wager. The challenge: ${r.challenge} — testing ${pronouns(r.holder).posAdj} weakest area.`, players: [r.holder] });
              sc.push({ text: `${r.holder} fails. The idol shatters. Gone. The wager cost everything.`, players: [r.holder], badge: 'Idol Destroyed', badgeClass: 'bad' });
            }
          });
        }
        result.push({ label:'Idol Wager', type:tw.type, scenes:sc }); break;
      }
        result.push({ label:'Idol Wager', type:tw.type, scenes:sc }); break;

      case 'kidnapping':
        if (tw.kidnapped) {
          sc.push({ text: `${tw.toTribe} won the challenge — and with it, the power to kidnap one player from ${tw.fromTribe}.`, players: [] });
          sc.push({ text: `${tw.toTribe} chose ${tw.kidnapped}.`, players: [tw.kidnapped] });
          if (tw.reason) sc.push({ text: tw.reason, players: [tw.kidnapped] });
          sc.push({ text: `${tw.kidnapped} will spend the episode at ${tw.toTribe} camp and skip tribal council. ${tw.kidnapped} returns to ${tw.fromTribe} next episode.`, players: [tw.kidnapped] });
          const _rBadge = tw.reaction === 'grateful' ? { t: 'RELIEVED', c: 'green' }
                        : tw.reaction === 'frustrated' ? { t: 'FRUSTRATED', c: 'bad' }
                        : { t: 'OPEN TO IT', c: 'gold' };
          const _rText = tw.reaction === 'grateful' ? `${tw.kidnapped} can barely hide the relief. This kidnapping might have just saved their game.`
                       : tw.reaction === 'frustrated' ? `${tw.kidnapped} wanted to stay. Their allies are at ${tw.fromTribe} — and now they can't protect them.`
                       : `${tw.kidnapped} takes it in stride. A night away from the game might be exactly what they needed.`;
          sc.push({ text: _rText, players: [tw.kidnapped], badge: _rBadge.t, badgeClass: _rBadge.c });
        } else {
          sc.push({ text: 'Kidnapping was offered but conditions prevented it from firing.', players: [] });
        }
        result.push({ label:'Kidnapping', type:tw.type, scenes:sc }); break;

      case 'double-elim':
        sc.push({ text: 'Two players will be voted out tonight.', players: active });
        sc.push({ text: 'Two separate votes. Two torches snuffed.', players: [] });
        result.push({ label:'Double Elimination', type:tw.type, scenes:sc }); break;

      case 'multi-tribal': {
        const _mtWinner = ep.winner?.name || '?';
        const _mtLosers = (ep.multiTribalLosingTribes || []).map(t => t.name);
        const _mtAll = (ep.tribesAtStart || []).flatMap(t => t.members);
        sc.push({ text: `Multi-Tribal. One tribe wins immunity. The rest go to tribal council.`, players: _mtAll.length ? _mtAll : active });
        sc.push({ text: `The losing tribes each hold their own Tribal Council tonight. One player from each goes home.`, players: [] });
        result.push({ label:'Multi-Tribal', type:tw.type, scenes:sc }); break;
      }

      case 'double-tribal': {
        const _dtWinner = ep.winner?.name || '?';
        const _dtLosers = (ep.doubleTribalLosingTribes || []).map(t => t.name);
        const _dtAll = (ep.tribesAtStart || []).flatMap(t => t.members);
        sc.push({ text: `Double Tribal. One tribe wins immunity. The losing tribes merge into one council — one person goes home.`, players: _dtAll.length ? _dtAll : active });
        sc.push({ text: `Players from different tribes will sit together at the same Tribal Council tonight. Old loyalties meet new enemies.`, players: [] });
        result.push({ label:'Double Tribal', type:tw.type, scenes:sc }); break;
      }

      case 'no-tribal':
        sc.push({ text: 'No Tribal Council this episode. No one is voted out tonight.', players: [] });
        result.push({ label:'No Tribal Council', type:tw.type, scenes:sc }); break;

      case 'the-feast': case 'merge-reward': {
        // Teaser only — dedicated VP screen handles the full feast events
        const fl = tw.type === 'the-feast' ? 'The Feast' : 'Merge Feast';
        sc.push({ text: tw.type === 'merge-reward' ? 'The merge. One tribe. One table. Everything changes tonight.' : 'The tribes gather for a shared meal. What happens at the table doesn\'t stay at the table.', players: [] });
        result.push({ label:fl, type:tw.type, scenes:sc }); break;
      }

      case 'banishment':
        if (tw.banished) sc.push({ text: `${tw.banished} has been banished from camp.`, players: [tw.banished] });
        result.push({ label:'Banishment', type:tw.type, scenes:sc }); break;

      case 'ri-duel':
        sc.push({ text: 'A duel has been called on 2nd Chance Isle.', players: [] });
        sc.push({ text: 'One player will be permanently eliminated. The survivor stays, waiting for a chance to re-enter the game.', players: [] });
        result.push({ label:'2nd Chance Duel', type:tw.type, scenes:sc }); break;

      case 'shot-in-dark':
        sc.push({ text: 'The Shot in the Dark is available at tonight\'s Tribal Council.', players: [] });
        sc.push({ text: 'Any player may sacrifice their vote for a 1-in-6 chance of immunity. Once played, the vote is gone — safe or not.', players: [] });
        result.push({ label:'Shot in the Dark', type:tw.type, scenes:sc }); break;

      case 'elimination-swap':
      case 'exile-duel':
        // Post-elimination twists — rendered in rpBuildPostTwist after the votes screen, not here.
        break;

      default: {
        const lb = tw.type.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
        sc.push({ text: lb, players: [] });
        result.push({ label:lb, type:tw.type, scenes:sc });
      }
    }
  });

  // Journey (stored on ep.journey, not in ep.twists)
  if (ep.journey) {
    const { travelers, results, challengeLabel, challengeDesc, winner } = ep.journey;
    const advLabel = { extraVote:'Extra Vote', voteSteal:'Vote Steal' };
    const jsc = [];

    // Nomination drama — happened before anyone left
    if (ep.journey.nominationDrama?.length) {
      ep.journey.nominationDrama.forEach(({ player, tribe, event }) => {
        jsc.push({ text: event.text, players: event.mentioned || [player] });
      });
    }

    // Act 1 — departure
    jsc.push({ text: 'Each tribe was instructed to choose one member to get on a boat and go on a journey.', players: travelers });
    jsc.push({ text: `${travelers.join(', ')} met at a private summit, away from camp.`, players: travelers });

    // Act 2 — the competition
    if (challengeLabel && challengeDesc) {
      jsc.push({ text: `${challengeLabel.toUpperCase()} — ${challengeDesc} The last person standing wins an advantage.`, players: travelers });
    }

    // Inter-traveler tension if any negative relationship exists
    for (let i = 0; i < travelers.length; i++) {
      for (let j = i + 1; j < travelers.length; j++) {
        const rel = relationships.find(r => [r.a,r.b].sort().join('|') === [travelers[i],travelers[j]].sort().join('|'));
        if (rel && rel.score < -10) {
          jsc.push({ text: `${travelers[i]} and ${travelers[j]} have a history. The tension between them is visible from the start.`, players: [travelers[i], travelers[j]] });
          break;
        }
      }
    }

    // Act 3 — results per person
    const winners = results.filter(r => r.result === 'advantage');
    const losers  = results.filter(r => r.result === 'lostVote');
    const safe    = results.filter(r => r.result === 'safe');

    if (winners.length) {
      winners.forEach(r => {
        const aLabel = advLabel[r.type] || r.type;
        jsc.push({ text: `${r.name} wins!`, players: [r.name] });
        jsc.push({
          text: travelers.length > 1
            ? `${r.name} must choose what to do with the advantage. ${r.name} takes the ${aLabel}.`
            : `${r.name} takes the ${aLabel}.`,
          players: [r.name], badge: aLabel, badgeClass:'win'
        });
      });
    }

    losers.forEach(r => {
      jsc.push({
        text: `${r.name} could not hold on${winners.length ? ` — ${r.name} loses to ${winner}` : ''}. ${r.name} cannot vote at the next Tribal Council.`,
        players: [r.name], badge:'No Vote', badgeClass:'bad'
      });
    });

    safe.forEach(r => {
      if (!winners.length && !losers.length) {
        jsc.push({ text: `No competition — ${r.name} returned to camp with their vote safe.`, players: [r.name] });
      } else {
        jsc.push({ text: `${r.name} returned to camp with their vote intact.`, players: [r.name] });
      }
    });

    if (jsc.length) result.push({ label:'Journey', type:'journey', scenes:jsc });
  }

  return result;
}
