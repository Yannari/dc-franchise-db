// js/chal/masters-of-disasters.js — Masters of Disasters disaster challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ─── Text pools ───────────────────────────────────────────────────────────────

const DISASTER_HOST = {
  earthquakeIntro: [
    h => `"Welcome to Masters of Disasters! Today's first phase: an earthquake marathon! The ground WILL move — the question is whether YOU will!" ${h} grins maniacally.`,
    h => `${h} strides to the starting line as the whole set vibrates. "Phase One! Earthquake! Run, stumble, crawl — just don't stop!"`,
    h => `"Interns spent THREE WEEKS rigging this thing!" ${h} beams. "Phase One — Earthquake of Inevitable Pain. Your goal: reach the finish line. Good luck not dying!"`,
  ],
  roundStart: [
    (h, r, haz) => `Round ${r} — ${haz.name}! ${haz.desc}`,
    (h, r, haz) => `${h} cranks a lever. "Round ${r}! ${haz.name}!" ${haz.desc}`,
    (h, r, haz) => `"Round ${r}, people!" ${h} announces over the chaos. ${haz.name}: ${haz.desc}`,
  ],
  playerAdvances: [
    (h, p) => `${p} pushes through and gains ground!`,
    (h, p) => `${p} finds a rhythm and surges forward!`,
    (h, p) => `"Nice moves, ${p}!" ${h} calls out as ${p} advances.`,
  ],
  playerStuck: [
    (h, p) => `${p} struggles but can't gain ground this round.`,
    (h, p) => `${p} slips and loses momentum, stuck in place.`,
    (h, p) => `${h} winces. "That's rough, ${p} — not your best round."`,
  ],
  playerStopped: [
    (h, p) => `${p} collapses to the ground — they're done for this phase!`,
    (h, p) => `${p} can't go on. The exhaustion is too much. They're out of Phase 1.`,
    (h, p) => `"${p} is DOWN!" ${h} shouts. "Medical, check on ${p}!"`,
  ],
  earthquakeEnd: [
    (h, winner) => `The shaking stops. ${winner} conquers Phase 1 and earns the escape code advantage heading into Phase 2!`,
    (h, winner) => `${h} blows his air horn. "Phase One — DONE! ${winner}, you survive the earthquake! That escape code is yours!"`,
    (h, winner) => `"Earthquake of Inevitable Pain — COMPLETE!" ${h} declares. "${winner} runs Phase 2 with a head start!"`,
  ],
};

const DISASTER_HAZARDS = [
  { id: 'tremors',  name: 'Minor Tremors',   desc: 'The ground shakes beneath their feet — small but relentless jolts that throw off every step.' },
  { id: 'lava',     name: 'Lava Eruption',   desc: 'Hot soup spews from above through industrial nozzles — scalding, sticky, and absolutely everywhere.' },
  { id: 'hailstorm',name: 'Hailstorm',       desc: 'Golf balls rain from ceiling-mounted cannons — rattling helmets and bruising shoulders.' },
  { id: 'debris',   name: 'Falling Debris',  desc: 'The ceiling is coming down — foam boulders and rigged planks crash in unpredictable waves.' },
  { id: 'collapse', name: 'Total Collapse',  desc: 'Everything at once — tremors, debris, lava-soup, wind machines. Pure catastrophic mayhem.' },
];

const DISASTER_EVENTS = {
  dodgeLava: [
    (p, pr) => `${p} spots the nozzle arc and ducks perfectly — not a drop lands on ${pr.obj}!`,
    (p, pr) => `"Eat hot soup!" — ${p} rolls sideways and the lava stream misses entirely.`,
    (p, pr) => `${p} reads the spray pattern and weaves through. ${pr.Sub} emerges spotless and pumped.`,
  ],
  lavaBurn: [
    (p, pr) => `A burst of lava-soup catches ${p} square in the back. ${pr.Sub} yelps and slows down.`,
    (p, pr) => `${p} takes a hot soup cannonball to the shoulder. ${pr.Sub} grimaces but keeps moving.`,
    (p, pr) => `The lava stream catches ${p} by surprise — sticky, scalding, and demoralizing.`,
  ],
  rockTrip: [
    (p, pr) => `${p} catches a foot on a loose chunk of rubble and goes sprawling. ${pr.Sub} scrambles back up, winded.`,
    (p, pr) => `A debris shard clips ${p}'s ankle — ${pr.sub} stumbles and loses precious ground.`,
    (p, pr) => `The ground shifts under ${p} at exactly the wrong moment. ${pr.Sub} trips hard.`,
  ],
  debrisDodge: [
    (p, pr) => `${p} sees the chunk falling and sidesteps cleanly — the crowd roars!`,
    (p, pr) => `${p}'s instincts kick in. ${pr.Sub} pivots, the boulder misses, ${pr.sub} keeps moving.`,
    (p, pr) => `"Nice!" — ${p} reads the debris arc and ducks under it with a grin.`,
  ],
  golfBallHit: [
    (p, pr) => `A golf ball rattles off ${p}'s helmet. ${pr.Sub} staggers, seeing stars.`,
    (p, pr) => `The hailstorm catches ${p} in the open — three direct hits slow ${pr.obj} down.`,
    (p, pr) => `${p} takes a golf ball to the knee. ${pr.Sub} winces and limps onward.`,
  ],
  shieldTeammate: [
    (p, tm, pp, tp) => `${p} throws ${pp.posAdj} body in front of ${tm}, absorbing a debris hit meant for ${tp.obj}.`,
    (p, tm, pp, tp) => `"I've got you!" — ${p} shoves ${tm} out of the lava stream's path, catching the spray ${pp.ref}.`,
    (p, tm, pp, tp) => `${p} spots ${tm} frozen in the hailstorm and pulls ${tp.obj} forward, taking the worst of it.`,
  ],
  adrenalineSurge: [
    (p, pr) => `Something clicks for ${p} — ${pr.sub} finds a second gear and the fatigue melts away.`,
    (p, pr) => `${p} hits a wall and breaks through it. Pure adrenaline carries ${pr.obj} forward.`,
    (p, pr) => `${pr.Sub} was dragging — then ${p} surges, eyes wide, moving like ${pr.sub}'s just getting started.`,
  ],
  stumbleRecover: [
    (p, pr) => `${p} trips, catches ${pr.ref} on a railing, and keeps moving — barely.`,
    (p, pr) => `${p} wobbles, arms flailing, but somehow stays upright.`,
    (p, pr) => `A stumble from ${p} — but ${pr.sub} recovers before losing any ground.`,
  ],
  surfShockwave: [
    (p, pr) => `${p} bends the knees just right and RIDES the shockwave — gaining ground like a surfer!`,
    (p, pr) => `The tremor rolls under ${p} and ${pr.sub} surfs it forward with a whoop.`,
    (p, pr) => `"Did you SEE that?!" — ${p} catches the shockwave perfectly and glides ahead.`,
  ],
  chefTargets: [
    (p, pr) => `Chef Hatchet spots ${p} and grins. ${pr.Sub} gets an extra-special soup-lava blast fired directly at ${pr.obj}.`,
    (p, pr) => `"You think this is a GAME?!" Chef hurls a manifesto at ${p} along with a soup-lava barrage.`,
    (p, pr) => `Chef singles out ${p} for a personal grudge attack — double soup, maximum velocity.`,
  ],
  draftBehind: [
    (p, tm, pp, tp) => `${p} tucks in behind ${tm} and lets ${tp.obj} break the wind — ${pp.sub} gains ground with minimal effort.`,
    (p, tm, pp, tp) => `Smart move from ${p}: follow ${tm}'s lead and draft through the chaos.`,
    (p, tm, pp, tp) => `${p} reads the course and slides in behind ${tm}, conserving energy perfectly.`,
  ],
  panicFreeze: [
    (p, pr) => `${p} locks up — eyes wide, feet planted — the disaster zone is just too much right now.`,
    (p, pr) => `${p} freezes mid-stride as another shockwave hits. ${pr.Sub} can't make ${pr.ref} move.`,
    (p, pr) => `The chaos overwhelms ${p}. ${pr.Sub} stands there, stuck, while the round ticks by.`,
  ],
  heroicSprint: [
    (p, pr) => `${p} digs deep and SPRINTS — burning everything in the tank to push ahead!`,
    (p, pr) => `"I am NOT stopping here!" — ${p} explodes forward, face red, arms pumping.`,
    (p, pr) => `${p} finds something extra and launches into a heroic sprint through the carnage.`,
  ],
  carryInjured: [
    (p, tm, pp, tp) => `${p} hauls ${tm} over ${pp.posAdj} shoulder and carries ${tp.obj} forward. Both advance — barely.`,
    (p, tm, pp, tp) => `"Leave no one behind!" — ${p} grabs ${tm} and drags ${tp.obj} through the round.`,
    (p, tm, pp, tp) => `${p} refuses to abandon ${tm}. ${pp.Sub} lifts ${tp.obj} bodily and pushes on.`,
  ],
  findShortcut: [
    (p, pr) => `${p} spots a gap in the debris field no one else noticed — and slips through for a massive shortcut!`,
    (p, pr) => `Sharp eyes from ${p}: ${pr.sub} reads the course and finds a route that cuts two stages worth of distance.`,
    (p, pr) => `${p} ducks under a collapsed beam and emerges ahead of everyone. Pure instinct.`,
  ],
  ceilingCollapse: [
    (p, pr) => `A massive ceiling section gives way — the shockwave ripples through the whole course, throwing everyone off balance.`,
    (p, pr) => `"EVERYONE DOWN!" — the ceiling collapses and the entire tribe staggers.`,
    (p, pr) => `The biggest collapse yet rocks the field. Nobody makes progress for a moment.`,
  ],
};

// ─── Phase 1: Earthquake ──────────────────────────────────────────────────────

function _simulateEarthquake(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const rp = [];
  const noise = (range) => (Math.random() - 0.5) * range;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Player state map: name -> { tribe, stage, fatigue, stopped, injured, events }
  const stateMap = {};
  tribeMembers.forEach(t => {
    t.members.forEach(name => {
      stateMap[name] = { tribe: t.name, stage: 0, fatigue: 0, stopped: false, injured: false, passStreak: 0 };
    });
  });

  if (!gs.lingeringInjuries) gs.lingeringInjuries = {};
  if (!gs.popularity) gs.popularity = {};

  const rounds = [];
  let phaseWinner = null;

  // Intro
  rp.push({ type: 'host', text: pick(DISASTER_HOST.earthquakeIntro)(host) });

  for (let r = 1; r <= 5; r++) {
    const hazard = DISASTER_HAZARDS[r - 1];
    rp.push({ type: 'roundStart', text: pick(DISASTER_HOST.roundStart)(host, r, hazard) });

    // Escalating threshold
    const thresholds = [0.35, 0.38, 0.42, 0.48, 0.52];
    const threshold = thresholds[r - 1];

    const roundData = { num: r, hazard: hazard.id, playerStates: [] };

    // Collect all active players in a random order for event interactions
    const allActive = Object.entries(stateMap).filter(([, s]) => !s.stopped).map(([n]) => n);

    for (const name of allActive) {
      const s = stateMap[name];
      const pr = pronouns(name);
      const st = pStats(name);
      const tribe = s.tribe;
      const tribemates = tribeMembers.find(t => t.name === tribe)?.members.filter(m => m !== name) || [];

      // Base fatigue
      s.fatigue += 1.0;

      // Events selection
      const eventsThisRound = [];
      let movementBonus = 0;
      let stuck = false;

      // Build candidate event list
      const candidates = [];

      // Lava-specific
      if (hazard.id === 'lava') {
        if (st.boldness * 0.08 > Math.random() * 0.5) candidates.push({ type: 'dodgeLava', w: 2 });
        else candidates.push({ type: 'lavaBurn', w: 1.5 });
      }
      // Tremors/collapse
      if (hazard.id === 'tremors' || hazard.id === 'collapse') {
        candidates.push({ type: 'rockTrip', w: 1 });
        if (st.boldness * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'surfShockwave', w: 1.5 });
      }
      // Debris/hail
      if (hazard.id === 'debris' || hazard.id === 'hailstorm' || hazard.id === 'collapse') {
        if (st.intuition * 0.08 > Math.random() * 0.4) candidates.push({ type: 'debrisDodge', w: 2 });
        if (hazard.id === 'hailstorm' || hazard.id === 'collapse') candidates.push({ type: 'golfBallHit', w: 1.5 });
      }
      // r4+ ceilingCollapse
      if (r >= 4 && Math.random() < 0.2) candidates.push({ type: 'ceilingCollapse', w: 1 });

      // Universal candidates
      if (st.endurance * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'adrenalineSurge', w: 1.5 });
      candidates.push({ type: 'stumbleRecover', w: 0.8 });
      if (st.physical * 0.08 > 0.4 + Math.random() * 0.3) candidates.push({ type: 'heroicSprint', w: 1.5 });
      if (st.temperament * 0.08 < 0.3) candidates.push({ type: 'panicFreeze', w: 1 });
      if (Math.random() < 0.1) candidates.push({ type: 'chefTargets', w: 1 });

      // Social/team candidates
      if (st.social * 0.08 > 0.3 + Math.random() * 0.3 && tribemates.length > 0) candidates.push({ type: 'draftBehind', w: 1 });
      if (st.loyalty * 0.08 > 0.4 + Math.random() * 0.3 && tribemates.length > 0) candidates.push({ type: 'shieldTeammate', w: 1.5 });
      // carryInjured — needs a stopped teammate
      const stoppedTm = tribemates.find(tm => stateMap[tm]?.stopped);
      if (stoppedTm && st.loyalty * 0.08 > 0.5) candidates.push({ type: 'carryInjured', w: 1, teammate: stoppedTm });
      // findShortcut
      if (st.intuition * 0.08 > 0.5 + Math.random() * 0.3 && Math.random() < 0.25) candidates.push({ type: 'findShortcut', w: 1 });

      // Pick 1-2 events (deduplicate type)
      const seen = new Set();
      const deduped = candidates.filter(c => { if (seen.has(c.type)) return false; seen.add(c.type); return true; });
      const totalW = deduped.reduce((a, c) => a + c.w, 0);
      const numPick = Math.random() < 0.5 ? 1 : 2;

      for (let pick_i = 0; pick_i < numPick && deduped.length > 0; pick_i++) {
        let rw = Math.random() * totalW;
        for (const cand of deduped) {
          rw -= cand.w;
          if (rw <= 0) {
            eventsThisRound.push(cand);
            break;
          }
        }
      }

      // Apply events
      for (const ev of eventsThisRound) {
        const pool = DISASTER_EVENTS[ev.type];
        let text = '';
        const tm = ev.teammate || (tribemates.length > 0 ? tribemates[Math.floor(Math.random() * tribemates.length)] : null);
        const tmPr = tm ? pronouns(tm) : null;

        if (['shieldTeammate', 'draftBehind', 'carryInjured'].includes(ev.type) && tm && tmPr) {
          text = pick(pool)(name, tm, pr, tmPr);
        } else {
          text = pick(pool)(name, pr);
        }

        rp.push({ type: 'event', eventType: ev.type, player: name, tribe, text });

        switch (ev.type) {
          case 'dodgeLava':
            movementBonus += 0.1;
            s.fatigue -= 0.5;
            break;
          case 'lavaBurn':
            s.fatigue += 1.0;
            movementBonus -= 0.1;
            break;
          case 'rockTrip':
            s.fatigue += 1.0;
            stuck = true;
            break;
          case 'debrisDodge':
            movementBonus += 0.05;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'golfBallHit':
            s.fatigue += 1.5;
            movementBonus -= 0.15;
            break;
          case 'shieldTeammate':
            s.fatigue += 1.0;
            if (tm) addBond(name, tm, 0.4);
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'adrenalineSurge':
            s.fatigue = Math.max(0, s.fatigue - 1.0);
            movementBonus += 0.1;
            break;
          case 'stumbleRecover':
            s.fatigue += 0.5;
            break;
          case 'surfShockwave':
            movementBonus += 0.15;
            break;
          case 'chefTargets':
            s.fatigue += 2.0;
            break;
          case 'draftBehind':
            movementBonus += 0.1;
            break;
          case 'panicFreeze':
            stuck = true;
            s.fatigue += 0.5;
            break;
          case 'heroicSprint':
            movementBonus += 0.2;
            s.fatigue += 1.0;
            gs.popularity[name] = (gs.popularity[name] || 0) + 1;
            break;
          case 'carryInjured':
            s.fatigue += 1.5;
            if (tm && stateMap[tm]) {
              stateMap[tm].stage = Math.min(5, stateMap[tm].stage + 1);
              stateMap[tm].stopped = false; // briefly helped forward
            }
            break;
          case 'findShortcut':
            movementBonus += 1.0; // will add extra stage below
            break;
          case 'ceilingCollapse':
            // applied tribe-wide below
            break;
        }
      }

      // Tribe-wide ceilingCollapse penalty
      if (eventsThisRound.some(e => e.type === 'ceilingCollapse')) {
        tribeMembers.find(t => t.name === tribe)?.members.forEach(m => {
          if (!stateMap[m].stopped) stateMap[m].fatigue += 0.2;
        });
      }

      // Stat check
      let roll = 0;
      if (r === 1) roll = st.physical * 0.05 + st.endurance * 0.03 + noise(0.25);
      else if (r === 2) roll = st.boldness * 0.05 + st.endurance * 0.04 + noise(0.25);
      else if (r === 3) roll = st.intuition * 0.05 + st.physical * 0.04 + noise(0.25);
      else if (r === 4) roll = st.mental * 0.04 + st.physical * 0.05 + noise(0.25);
      else roll = (st.physical + st.endurance + st.boldness + st.mental) * 0.02 + noise(0.2);

      roll += movementBonus;

      let advanced = false;
      const passed = !stuck && roll > threshold;

      if (passed) {
        s.passStreak = (s.passStreak || 0) + 1;
        // injured players need 2 passes to advance
        if (s.injured) {
          if (s.passStreak >= 2) { s.stage = Math.min(5, s.stage + 1); advanced = true; s.passStreak = 0; }
        } else {
          s.stage = Math.min(5, s.stage + 1);
          advanced = true;
          s.passStreak = 0;
        }
        // findShortcut bonus stage
        if (eventsThisRound.some(e => e.type === 'findShortcut')) {
          s.stage = Math.min(5, s.stage + 1);
        }
        rp.push({ type: 'advance', player: name, tribe, text: pick(DISASTER_HOST.playerAdvances)(host, name) });
      } else if (!stuck) {
        s.fatigue += 0.5;
        s.passStreak = 0;
        rp.push({ type: 'stuck', player: name, tribe, text: pick(DISASTER_HOST.playerStuck)(host, name) });
      }

      // Stopped check
      const endStat = st.endurance;
      if (s.fatigue >= endStat && !s.stopped) {
        s.stopped = true;
        s.injured = true;
        gs.lingeringInjuries[name] = { ep: (gs.episode || 0) + 1, duration: 2, penalty: 0.15 };
        rp.push({ type: 'stopped', player: name, tribe, text: pick(DISASTER_HOST.playerStopped)(host, name) });
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0); // no bonus for stopping
      }

      // chalMemberScores
      if (advanced) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 3;
      if (s.stage >= 5) ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 5;
      const heroicEvents = ['heroicSprint', 'shieldTeammate', 'carryInjured'];
      if (eventsThisRound.some(e => heroicEvents.includes(e.type))) {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
      }

      roundData.playerStates.push({
        name, tribe,
        stage: s.stage,
        fatigue: +s.fatigue.toFixed(2),
        stopped: s.stopped,
        events: eventsThisRound.map(e => e.type),
        advanced,
      });
    }

    rounds.push(roundData);

    // Win check: tribe with ALL members at stage 5
    for (const t of tribeMembers) {
      if (t.members.every(m => stateMap[m].stage >= 5)) {
        phaseWinner = t.name;
        break;
      }
    }
    if (phaseWinner) break;
  }

  // Fallback: tribe with most total stages
  if (!phaseWinner) {
    const tribeStages = {};
    tribeMembers.forEach(t => {
      tribeStages[t.name] = t.members.reduce((sum, m) => sum + (stateMap[m]?.stage || 0), 0);
    });
    const sorted = Object.entries(tribeStages).sort((a, b) => b[1] - a[1]);
    phaseWinner = sorted[0][0];
  }

  rp.push({ type: 'end', text: pick(DISASTER_HOST.earthquakeEnd)(host, phaseWinner) });

  // Phase 2 bonus flag
  result.earthquakeWinner = phaseWinner;
  result.earthquakeBonus = 0.15;

  // tribeScores contribution
  result.tribeScores[phaseWinner] = (result.tribeScores[phaseWinner] || 0) + 1;

  result.earthquake = {
    rounds,
    tribeFinishOrder: null,
    winner: phaseWinner,
    rp,
  };
  result.phases.push('earthquake');

  // Camp event
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  ep.campEvents[campKey].post.push({
    text: `Earthquake Phase — ${phaseWinner} survives the disaster marathon first! Lingering injuries will slow some players next episode.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'EARTHQUAKE PHASE', badgeClass: 'orange',
    tag: 'challenge',
  });

  ep._debugEarthquake = {
    winner: phaseWinner,
    playerFinal: Object.fromEntries(Object.entries(stateMap).map(([n, s]) => [n, { stage: s.stage, fatigue: +s.fatigue.toFixed(2), stopped: s.stopped }])),
  };
}

// ─── Main simulate ────────────────────────────────────────────────────────────

export function simulateMastersOfDisasters(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    earthquake: null,
    submarine: null,
    breakEvents: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.mastersOfDisasters = result;
  ep.challengeType = 'masters-of-disasters';
  ep.challengeLabel = 'Masters of Disasters';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  // Phase 1 — Earthquake
  _simulateEarthquake(ep, tribeMembers, result);

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `Masters of Disasters: ${winnerName} survives the disasters. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'MASTERS OF DISASTERS', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugMastersOfDisasters = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
  };
}

export function _textMastersOfDisasters(ep, ln, sec) {
  const md = ep.mastersOfDisasters;
  if (!md) return;
  const eq = md.earthquake;
  sec('Masters of Disasters');
  if (eq) {
    ln(`Phase 1 — Earthquake of Inevitable Pain. The ground shook, the lava-soup flew, and ${eq.winner} survived first.`);
    const stopped = Object.values(ep._debugEarthquake?.playerFinal || {}).filter(s => s.stopped).length;
    if (stopped > 0) ln(`${stopped} player${stopped > 1 ? 's' : ''} collapsed from exhaustion and will carry lingering injuries.`);
  } else {
    ln('The teams face disaster-themed challenges — survive an earthquake marathon, then escape a sinking submarine.');
  }
}

export function rpBuildMastersOfDisastersTitleCard(ep) {
  if (!ep.mastersOfDisasters) return '';
  const md = ep.mastersOfDisasters;
  const eq = md.earthquake;
  if (!eq) return '<div style="padding:40px;text-align:center;color:#f97316;font-family:serif;"><h1>🌋 MASTERS OF DISASTERS</h1><p>Title Card — Full VP coming soon</p></div>';

  const rp = eq.rp || [];
  const rows = rp.map(r => {
    const cls = r.type === 'host' ? 'color:#f59e0b' : r.type === 'roundStart' ? 'color:#fb923c;font-weight:bold' : r.type === 'stopped' ? 'color:#ef4444' : r.type === 'advance' ? 'color:#4ade80' : 'color:#e2e8f0';
    return `<p style="margin:4px 0;font-size:13px;${cls}">${r.text}</p>`;
  }).join('');

  const winner = eq.winner || '';
  return `
<div style="background:#1a0a00;padding:32px;font-family:serif;min-height:100%">
  <div style="text-align:center;margin-bottom:24px">
    <div style="font-size:11px;letter-spacing:3px;color:#f59e0b;text-transform:uppercase">Masters of Disasters</div>
    <h1 style="color:#f97316;font-size:28px;margin:8px 0">🌋 Earthquake of Inevitable Pain</h1>
    <div style="color:#fb923c;font-size:14px">Phase 1 Complete — Winner: ${winner}</div>
  </div>
  <div style="background:#2a1200;border-radius:8px;padding:16px;max-height:600px;overflow-y:auto">
    ${rows}
  </div>
</div>`;
}

export function mastersOfDisastersRevealNext() {}
export function mastersOfDisastersRevealAll() {}
