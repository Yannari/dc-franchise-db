// js/chal/beach-blanket-bogus.js
import { gs, players } from '../core.js';
import { pStats, pronouns, romanticCompat, updateChalRecord } from '../players.js';
import { getBond, addBond } from '../bonds.js';

/* ═══════════════════════════════════════════════════════
   SURF PHASE — 5 escalating hazard rounds + balance mechanic
   ═══════════════════════════════════════════════════════ */

const HAZARD_ROUNDS = [
  {
    id: 'cold-water', name: 'Cold Water', threat: 'LOW',
    statCheck: s => s.temperament * 0.08 + s.physical * 0.04,
    desc: '"The water is FREEZING! I may have forgotten to heat the pool. Oops."',
    survive: (p, pr) => `${p} grits ${pr.posAdj} teeth and powers through the cold, barely flinching.`,
    struggle: (p, pr) => `${p} shivers violently but keeps ${pr.posAdj} grip on the board, knuckles turning white.`,
    wipeout: (p, pr) => `${p} locks up from the cold and topples off ${pr.posAdj} board like a frozen plank. Brutal.`,
  },
  {
    id: 'sharks-circle', name: 'Sharks Circle', threat: 'MEDIUM',
    statCheck: s => s.boldness * 0.08 + s.mental * 0.04,
    desc: '"Release the sharks! Well, they\'re mechanical. Mostly."',
    survive: (p, pr) => `A fin bumps ${pr.posAdj} board and ${p} doesn't even blink — stone cold.`,
    struggle: (p, pr) => `${p} wobbles as a shark brushes past, ${pr.posAdj} eyes wide, but stays standing through sheer willpower.`,
    wipeout: (p, pr) => `${p} sees two fins converging and panics, flailing off the board in a spectacular bellyflop.`,
  },
  {
    id: 'seagull-swarm', name: 'Seagull Swarm', threat: 'HIGH',
    statCheck: s => s.mental * 0.07 + s.temperament * 0.05,
    desc: '"The seagulls are back and they are ANGRY. Probably because someone stole their lunch."',
    survive: (p, pr) => `${p} ducks and weaves through the bird barrage with laser focus — not a feather out of place.`,
    struggle: (p, pr) => `${p} swats desperately at the gulls, taking a beak to the ear but somehow staying upright.`,
    wipeout: (p, pr) => `A gull nests on ${p}'s head. ${pr.Sub} tries to shake it off and cartwheels into the water.`,
  },
  {
    id: 'equipment-thrown', name: 'Equipment Thrown', threat: 'HIGH',
    statCheck: s => s.mental * 0.08 + s.physical * 0.04,
    desc: '"Chef! Start throwing stuff! ...Is that a FRIDGE?!"',
    survive: (p, pr) => `${p} dodges a flying lawn chair and a toaster, surfing right through the chaos.`,
    struggle: (p, pr) => `A rubber duck hits ${p} square in the face. ${pr.Sub} stumbles but catches ${pr.posAdj} balance at the last second.`,
    wipeout: (p, pr) => `A beach umbrella opens mid-air and clotheslines ${p} clean off the board. ${pr.Sub} never saw it coming.`,
  },
  {
    id: 'everything', name: 'Everything At Once', threat: 'EXTREME',
    statCheck: s => (s.physical + s.mental + s.boldness + s.temperament) * 0.025,
    desc: '"Sharks, seagulls, Chef with a cannon, AND a grease slick! FINAL ROUND, BABY!"',
    survive: (p, pr) => `${p} surfs through absolute bedlam — sharks, birds, projectiles — and comes out standing. Legendary.`,
    struggle: (p, pr) => `${p} is battered from every direction but clings to the board with raw desperation, barely surviving.`,
    wipeout: (p, pr) => `${p} gets hit by a shark, a seagull, AND a flying toilet seat simultaneously. ${pr.Sub} doesn't stand a chance.`,
  },
];

const SURF_EVENTS = [
  {
    id: 'trash-talk',
    type: 'negative',
    badge: 'Trash Talk', badgeClass: 'red',
    check(activeSurfers, tribeMembers, balances, wipedOut) {
      for (const a of activeSurfers) {
        for (const b of activeSurfers) {
          if (a === b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (sameTribe) continue;
          if (getBond(a, b) <= -2) return { actor: a, target: b };
        }
      }
      return null;
    },
    apply(actor, target) {
      addBond(actor, target, -0.3);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      const pr = pronouns(actor);
      return { actor, target, pr };
    },
    text(data) {
      const pr = data.pr;
      return `${data.actor} hurls insults at ${data.target} from across the pool. "${pr.Sub} can't even SURF!" The crowd winces.`;
    },
  },
  {
    id: 'showmance-distraction',
    type: 'negative',
    badge: 'Distracted', badgeClass: 'red',
    check(activeSurfers, tribeMembers) {
      if (!gs.showmances) return null;
      for (const sm of gs.showmances) {
        if (!activeSurfers.includes(sm.a) || !activeSurfers.includes(sm.b)) continue;
        const sameTribe = tribeMembers.some(t => t.members.includes(sm.a) && t.members.includes(sm.b));
        if (!sameTribe) return { surfer: sm.a, partner: sm.b };
      }
      return null;
    },
    apply(surfer, partner) {
      addBond(surfer, partner, 0.2);
      if (!gs.popularity) gs.popularity = {};
      const pr = pronouns(surfer);
      return { surfer, partner, pr };
    },
    text(data) {
      return `${data.surfer} keeps glancing at ${data.partner} on the other board — ${data.pr.posAdj} balance is all over the place. "Eyes on the WAVE, not the babe!"`;
    },
  },
  {
    id: 'clutch-save',
    type: 'positive',
    badge: 'Clutch Save', badgeClass: 'gold',
    check(activeSurfers, tribeMembers, balances) {
      for (const s of activeSurfers) {
        if (balances[s] < 30 && pStats(s).boldness * 0.1 + Math.random() * 0.3 > 0.5) {
          return { hero: s };
        }
      }
      return null;
    },
    apply(hero) {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[hero] = (gs.popularity[hero] || 0) + 2;
      const pr = pronouns(hero);
      return { hero, pr, balanceBoost: 0 };
    },
    text(data) {
      return `${data.hero} is about to eat it — one foot off the board — but somehow twists back upright in a move that defies physics! The crowd ERUPTS.`;
    },
  },
  {
    id: 'catastrophe',
    type: 'neutral',
    badge: 'Spectacular Wipeout', badgeClass: 'red',
    check(activeSurfers, tribeMembers, balances) {
      for (const s of activeSurfers) {
        const st = pStats(s);
        if (st.physical * 0.12 + Math.random() * 0.15 > 0.55 && st.mental * 0.08 + Math.random() * 0.1 < 0.45 && balances[s] > 20) {
          return { victim: s };
        }
      }
      return null;
    },
    apply(victim, _, match, balances) {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 1;
      const pr = pronouns(victim);
      return { victim, pr, balanceLoss: 999 };
    },
    text(data) {
      return `${data.victim} goes for a HUGE power move on the board, gets way too much air, and belly-smacks the water so hard it echoes. Painful to watch. Amazing TV.`;
    },
  },
  {
    id: 'encouraging-shout',
    type: 'positive',
    badge: 'Encouragement', badgeClass: 'gold',
    check(activeSurfers, tribeMembers, balances, wipedOut) {
      const allSurfers = [...activeSurfers, ...wipedOut];
      for (const shouter of allSurfers) {
        if (pStats(shouter).social * 0.1 + Math.random() * 0.2 < 0.7) continue;
        for (const surfer of activeSurfers) {
          if (shouter === surfer) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(shouter) && t.members.includes(surfer));
          if (sameTribe && getBond(shouter, surfer) >= 3) return { shouter, surfer };
        }
      }
      return null;
    },
    apply(shouter, surfer) {
      addBond(surfer, shouter, 0.3);
      const pr = pronouns(shouter);
      return { shouter, surfer, pr, balanceBoost: 5 };
    },
    text(data) {
      return `${data.shouter} cups ${data.pr.posAdj} hands and screams "YOU GOT THIS, ${data.surfer.toUpperCase()}!" from the sideline. It actually works — ${data.surfer} steadies up.`;
    },
  },
  {
    id: 'taunt-after-wipeout',
    type: 'negative',
    badge: 'Cruel Taunt', badgeClass: 'red',
    check(activeSurfers, tribeMembers, balances, wipedOut) {
      if (wipedOut.length === 0) return null;
      for (const s of activeSurfers) {
        const arch = players.find(p => p.name === s)?.archetype || '';
        if (['villain', 'mastermind', 'schemer'].includes(arch)) {
          return { taunter: s, victim: wipedOut[wipedOut.length - 1] };
        }
      }
      return null;
    },
    apply(taunter, victim) {
      addBond(taunter, victim, -0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[taunter] = (gs.popularity[taunter] || 0) - 2;
      const pr = pronouns(taunter);
      return { taunter, victim, pr };
    },
    text(data) {
      return `${data.taunter} points at ${data.victim} floundering in the water and LAUGHS. "Nice swim, loser!" ${data.pr.Sub} flexes on the board. Classless.`;
    },
  },
  {
    id: 'shield-move',
    type: 'positive',
    badge: 'Shield Move', badgeClass: 'gold',
    check(activeSurfers, tribeMembers, balances) {
      for (const savior of activeSurfers) {
        if (balances[savior] <= 30) continue;
        for (const saved of activeSurfers) {
          if (savior === saved) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(savior) && t.members.includes(saved));
          if (sameTribe && balances[saved] < 40) return { savior, saved };
        }
      }
      return null;
    },
    apply(savior, saved) {
      addBond(saved, savior, 0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[savior] = (gs.popularity[savior] || 0) + 2;
      const pr = pronouns(savior);
      return { savior, saved, pr, balanceCost: 10, balanceBoost: 0 };
    },
    text(data) {
      return `${data.savior} sees ${data.saved} about to get nailed by a wave and body-blocks it, taking the hit ${data.pr.ref}! Heroic — but costly.`;
    },
  },
  {
    id: 'sabotage-splash',
    type: 'negative',
    badge: 'Sabotage Splash', badgeClass: 'red',
    check(activeSurfers, tribeMembers, balances) {
      for (const splasher of activeSurfers) {
        const arch = players.find(p => p.name === splasher)?.archetype || '';
        if (!['villain', 'mastermind', 'schemer'].includes(arch)) continue;
        for (const target of activeSurfers) {
          if (splasher === target) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(splasher) && t.members.includes(target));
          if (!sameTribe && pStats(splasher).strategic * 0.1 + Math.random() * 0.3 > 0.5) {
            return { splasher, target };
          }
        }
      }
      return null;
    },
    apply(splasher, target) {
      addBond(splasher, target, -0.3);
      // detection by high-intuition witnesses
      const allPlayers = players.filter(p => gs.tribes?.some(t => t.members.includes(p.name)));
      for (const w of allPlayers) {
        if (w.name === splasher || w.name === target) continue;
        if (pStats(w.name).intuition * 0.12 + Math.random() * 0.2 > 0.6) {
          addBond(w.name, splasher, -0.4);
        }
      }
      if (!gs.popularity) gs.popularity = {};
      const pr = pronouns(splasher);
      return { splasher, target, pr, balanceDrain: 10 };
    },
    text(data) {
      return `${data.splasher} "accidentally" kicks a massive wave at ${data.target}'s board. ${data.pr.Sub} smirks. "${data.pr.Sub === 'He' ? 'Whoops, bro' : 'Oh no, so sorry'}."`;
    },
  },
];

function _simulateSurf(ep, tribeMembers, result) {
  const allSurfers = tribeMembers.flatMap(t => t.members);
  const balances = {};
  const surfScores = {};
  const wipeoutOrder = [];
  const rounds = [];

  allSurfers.forEach(name => { balances[name] = 100; surfScores[name] = 0; });

  // Run rounds until 0-1 surfers remain (or max 8 rounds). Cycles through hazard types.
  const maxRounds = 8;
  for (let ri = 0; ri < maxRounds; ri++) {
    const activeSurfers = allSurfers.filter(n => balances[n] > 0);
    if (activeSurfers.length <= 1) break;

    const hazard = HAZARD_ROUNDS[ri % HAZARD_ROUNDS.length];
    const roundLabel = ri < HAZARD_ROUNDS.length ? hazard.name : `${hazard.name} (Overtime ${ri - HAZARD_ROUNDS.length + 1})`;
    const roundLog = { id: hazard.id, name: roundLabel, threat: ri >= 4 ? 'EXTREME' : hazard.threat, desc: hazard.desc, results: [], events: [] };

    // --- Hazard drain — per-player random spread ensures staggered wipeouts ---
    for (const name of activeSurfers) {
      const s = pStats(name);
      const check = Math.min(0.85, hazard.statCheck(s));
      // Each player gets a personal luck roll (wide spread: 0.3 to 1.7)
      const luck = 0.3 + Math.random() * 1.4;
      // Base drain escalates: R0=10, R1=16, R2=22, R3=28, R4=34, R5+=40+
      const baseDrain = 10 + ri * 6;
      const drain = baseDrain * (1 - check * 0.4) * luck;
      balances[name] = Math.max(0, balances[name] - drain);

      const pr = pronouns(name);
      if (balances[name] <= 0) {
        balances[name] = 0;
        wipeoutOrder.push(name);
        surfScores[name] = (ri + 1) * 10;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[name] = (gs.popularity[name] || 0) - 1;
        roundLog.results.push({ name, status: 'wipeout', text: hazard.wipeout(name, pr), balance: 0 });
      } else if (balances[name] < 60) {
        roundLog.results.push({ name, status: 'struggle', text: hazard.struggle(name, pr), balance: balances[name] });
      } else {
        roundLog.results.push({ name, status: 'survive', text: hazard.survive(name, pr), balance: balances[name] });
      }
    }

    // --- Mid-surf events (1-2 per round) ---
    const shuffled = [...SURF_EVENTS].sort(() => Math.random() - 0.5);
    let eventsFired = 0;
    const maxEvents = Math.random() < 0.5 ? 1 : 2;

    for (const evt of shuffled) {
      if (eventsFired >= maxEvents) break;
      const activeAfterHazard = allSurfers.filter(n => balances[n] > 0).sort(() => Math.random() - 0.5);
      const match = evt.check(activeAfterHazard, tribeMembers, balances, wipeoutOrder);
      if (!match) continue;

      const keys = Object.values(match);
      const data = evt.apply(keys[0], keys[1], match);
      data.eventId = evt.id;
      data.badge = evt.badge;
      data.badgeClass = evt.badgeClass;
      data.text = evt.text(data);

      // Apply balance effects
      if (data.balanceBoost && data.surfer) {
        balances[data.surfer] = Math.min(100, balances[data.surfer] + data.balanceBoost);
      }
      if (data.balanceCost && data.savior) {
        balances[data.savior] = Math.max(0, balances[data.savior] - data.balanceCost);
      }
      if (data.balanceDrain && data.target) {
        balances[data.target] = Math.max(0, balances[data.target] - data.balanceDrain);
      }
      if (data.balanceLoss && data.victim) {
        balances[data.victim] = Math.max(0, balances[data.victim] - data.balanceLoss);
        if (balances[data.victim] <= 0 && !wipeoutOrder.includes(data.victim)) {
          wipeoutOrder.push(data.victim);
          surfScores[data.victim] = (ri + 1) * 10;
        }
      }

      // Witness bond effects for trash-talk
      if (evt.id === 'trash-talk') {
        const witnesses = activeAfterHazard.filter(n => n !== data.actor && n !== data.target);
        for (const w of witnesses) addBond(w, data.actor, -0.2);
      }
      // Tribemate bond effects for showmance-distraction
      if (evt.id === 'showmance-distraction') {
        const tribe = tribeMembers.find(t => t.members.includes(data.surfer));
        if (tribe) {
          for (const m of tribe.members) {
            if (m !== data.surfer) addBond(m, data.surfer, -0.3);
          }
        }
      }
      // Tribe bond effects for clutch-save
      if (evt.id === 'clutch-save') {
        const tribe = tribeMembers.find(t => t.members.includes(data.hero));
        if (tribe) {
          for (const m of tribe.members) {
            if (m !== data.hero) addBond(m, data.hero, 0.4);
          }
        }
        // Rivals also respect
        const rivalSurfers = activeAfterHazard.filter(n => {
          return !tribeMembers.find(t => t.members.includes(data.hero))?.members.includes(n);
        });
        for (const r of rivalSurfers) addBond(r, data.hero, 0.1);
      }
      // Tribemate bond effects for catastrophe
      if (evt.id === 'catastrophe') {
        const tribe = tribeMembers.find(t => t.members.includes(data.victim));
        if (tribe) {
          for (const m of tribe.members) {
            if (m !== data.victim) addBond(m, data.victim, -0.2);
          }
        }
        const rivalSurfers = activeAfterHazard.filter(n => {
          return !tribeMembers.find(t => t.members.includes(data.victim))?.members.includes(n);
        });
        for (const r of rivalSurfers) addBond(r, data.victim, 0.2);
      }
      // Shield-move tribe bond
      if (evt.id === 'shield-move') {
        const tribe = tribeMembers.find(t => t.members.includes(data.savior));
        if (tribe) {
          for (const m of tribe.members) {
            if (m !== data.savior && m !== data.saved) addBond(m, data.savior, 0.2);
          }
        }
      }
      // Taunt witnesses
      if (evt.id === 'taunt-after-wipeout') {
        const witnesses = activeAfterHazard.filter(n => n !== data.taunter && n !== data.victim);
        for (const w of witnesses) addBond(w, data.taunter, -0.2);
      }

      roundLog.events.push(data);
      eventsFired++;
    }

    rounds.push(roundLog);
  }

  // --- Final scoring: survivors get round bonus + remaining balance ---
  const totalRounds = rounds.length;
  for (const name of allSurfers) {
    if (balances[name] > 0) {
      surfScores[name] = (totalRounds + 1) * 10 + balances[name];
    }
  }

  // --- Tribe scoring: last member standing wins (best individual score per tribe) ---
  const tribeBest = {};
  for (const t of tribeMembers) {
    tribeBest[t.name] = Math.max(...t.members.map(m => surfScores[m]));
  }

  // Winner = tribe whose last surfer survived longest
  const sorted = Object.entries(tribeBest).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  result.tribeScores[winner] = (result.tribeScores[winner] || 0) + 1;

  // Store surf data
  result.surfData = { rounds, balances: { ...balances }, surfScores: { ...surfScores }, wipeoutOrder: [...wipeoutOrder], tribeBest, winner };

  // Update chalMemberScores
  for (const name of allSurfers) {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + surfScores[name];
  }
}

/* ═══════════════════════════════════════════════════════
   SANDCASTLE PHASE — scavenge materials + build competition
   ═══════════════════════════════════════════════════════ */

const MATERIALS = [
  { id: 'shells',    label: 'Shells',    statCheck: s => s.intuition * 0.08 + s.mental * 0.04,    flavor: 'decorative' },
  { id: 'driftwood', label: 'Driftwood', statCheck: s => s.physical * 0.08 + s.intuition * 0.04,  flavor: 'structural' },
  { id: 'rocks',     label: 'Rocks',     statCheck: s => s.physical * 0.06 + s.temperament * 0.06, flavor: 'foundation' },
];

const SCAVENGE_ENCOUNTERS = [
  {
    id: 'race-for-material',
    badge: 'Material Race', badgeClass: 'orange',
    check(allNames, tribeMembers) {
      if (Math.random() > 0.35) return null;
      for (const a of allNames) {
        for (const b of allNames) {
          if (a === b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe) return { racer1: a, racer2: b };
        }
      }
      return null;
    },
    apply({ racer1, racer2 }, materials) {
      const s1 = pStats(racer1), s2 = pStats(racer2);
      const r1 = s1.physical * 0.07 + s1.boldness * 0.05 + Math.random() * 0.3;
      const r2 = s2.physical * 0.07 + s2.boldness * 0.05 + Math.random() * 0.3;
      const winner = r1 >= r2 ? racer1 : racer2;
      const loser = winner === racer1 ? racer2 : racer1;
      addBond(loser, winner, -0.3);
      const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      materials[winner][mat] = (materials[winner][mat] || 0) + 1;
      const pr = pronouns(winner);
      return {
        winner, loser, mat, pr,
        text: `${racer1} and ${racer2} both spot the same ${mat === 'shells' ? 'pile of pristine shells' : mat === 'driftwood' ? 'chunk of driftwood' : 'perfect flat rock'} — and SPRINT for it. ${winner} gets there first, snatching it right under ${pronouns(loser).posAdj} nose. "${pronouns(loser).Sub === 'He' ? 'Dude' : 'Girl'}, that was MINE!" ${loser} fumes.`,
      };
    },
  },
  {
    id: 'help-rival',
    badge: 'Helped a Rival', badgeClass: 'gold',
    check(allNames, tribeMembers) {
      if (Math.random() > 0.15) return null;
      for (const a of allNames) {
        for (const b of allNames) {
          if (a === b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe && getBond(a, b) >= 2) return { helper: a, rival: b };
        }
      }
      return null;
    },
    apply({ helper, rival }, materials, tribeMembers) {
      addBond(helper, rival, 0.5);
      const helperTribe = tribeMembers.find(t => t.members.includes(helper));
      if (helperTribe) {
        for (const m of helperTribe.members) {
          if (m !== helper) addBond(m, helper, -0.3);
        }
      }
      const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      materials[rival][mat] = (materials[rival][mat] || 0) + 1;
      const pr = pronouns(helper);
      return {
        helper, rival, pr,
        text: `${helper} spots ${rival} struggling to pry loose some ${mat} and — wait — actually HELPS ${pronouns(rival).obj}? "We're on different tribes!" ${pr.posAdj} teammates hiss. ${helper} shrugs. "Good sportsmanship, people."`,
      };
    },
  },
  {
    id: 'steal-material',
    badge: 'Material Theft', badgeClass: 'red',
    check(allNames, tribeMembers) {
      for (const a of allNames) {
        const arch = players.find(p => p.name === a)?.archetype || '';
        if (!['villain', 'mastermind', 'schemer'].includes(arch)) continue;
        const st = pStats(a);
        if (st.strategic * 0.1 + Math.random() * 0.3 > 0.5) {
          for (const b of allNames) {
            if (a === b) continue;
            const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
            if (!sameTribe) return { thief: a, victim: b };
          }
        }
      }
      return null;
    },
    apply({ thief, victim }, materials, tribeMembers) {
      const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      const stolen = Math.min(materials[victim][mat] || 0, 1);
      materials[victim][mat] = (materials[victim][mat] || 0) - stolen;
      materials[thief][mat] = (materials[thief][mat] || 0) + stolen;

      const prT = pronouns(thief);
      let detected = false;
      // Detection by high-intuition witnesses
      const allActive = tribeMembers.flatMap(t => t.members);
      for (const w of allActive) {
        if (w === thief || w === victim) continue;
        if (pStats(w).intuition * 0.1 + Math.random() * 0.15 > 0.55) {
          addBond(w, thief, -0.5);
          detected = true;
        }
      }
      if (detected) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[thief] = (gs.popularity[thief] || 0) - 1;
      }

      const caughtText = detected
        ? ` But eagle-eyed witnesses clock the whole thing. "YOU STOLE THAT!" The heat is ON.`
        : ` Nobody notices. ${prT.Sub} smirks and walks away clean.`;
      return {
        thief, victim, mat, stolen, detected, prT,
        text: `${thief} sidles up to ${victim}'s material stash and pockets ${stolen ? `a ${mat === 'shells' ? 'handful of shells' : mat === 'driftwood' ? 'piece of driftwood' : 'rock'}` : 'nothing — the pile is empty!'}.${caughtText}`,
      };
    },
  },
  {
    id: 'hidden-cache',
    badge: 'Hidden Cache', badgeClass: 'gold',
    check(allNames) {
      for (const a of allNames) {
        const s = pStats(a);
        if (s.intuition * 0.02 + Math.random() * 0.01 > 0.12) return { finder: a };
      }
      return null;
    },
    apply({ finder }, materials, tribeMembers) {
      const mat = MATERIALS[Math.floor(Math.random() * MATERIALS.length)].id;
      materials[finder][mat] = (materials[finder][mat] || 0) + 2;
      const finderTribe = tribeMembers.find(t => t.members.includes(finder));
      if (finderTribe) {
        for (const m of finderTribe.members) {
          if (m !== finder) addBond(m, finder, 0.3);
        }
      }
      const pr = pronouns(finder);
      return {
        finder, mat, pr,
        text: `${finder} kicks over a sand dune and — JACKPOT! A stash of premium ${mat}! ${pr.Sub} hauls it back to the tribe like a conquering hero. "I TOLD you I had a sixth sense!"`,
      };
    },
  },
  {
    id: 'territorial-standoff',
    badge: 'Standoff', badgeClass: 'orange',
    check(allNames, tribeMembers) {
      if (Math.random() > 0.20) return null;
      if (tribeMembers.length < 2) return null;
      const t1 = tribeMembers[0], t2 = tribeMembers[1];
      const a = t1.members[Math.floor(Math.random() * t1.members.length)];
      const b = t2.members[Math.floor(Math.random() * t2.members.length)];
      return { challenger: a, defender: b };
    },
    apply({ challenger, defender }, materials, tribeMembers) {
      const sC = pStats(challenger), sD = pStats(defender);
      const cRoll = sC.boldness * 0.08 + sC.physical * 0.04 + Math.random() * 0.3;
      const dRoll = sD.boldness * 0.08 + sD.physical * 0.04 + Math.random() * 0.3;
      const winner = cRoll >= dRoll ? challenger : defender;
      const loser = winner === challenger ? defender : challenger;
      const loserTribe = tribeMembers.find(t => t.members.includes(loser));
      if (loserTribe) {
        for (const m of loserTribe.members) {
          if (m !== loser) addBond(m, loser, -0.2);
        }
      }
      const prW = pronouns(winner);
      return {
        winner, loser, prW,
        text: `${challenger} and ${defender} both claim the same stretch of beach. It's a stare-down. ${winner} puffs up ${prW.posAdj} chest and holds ground — ${loser} backs off, muttering. ${pronouns(loser).posAdj} tribe is NOT impressed.`,
      };
    },
  },
];

const BUILD_EVENTS = [
  {
    id: 'creative-disagreement',
    badge: 'Creative Clash', badgeClass: 'orange',
    check(tribeNames) {
      const smart = tribeNames.filter(n => pStats(n).mental * 0.1 + Math.random() * 0.1 > 0.55);
      if (smart.length >= 2) return { debater1: smart[0], debater2: smart[1] };
      return null;
    },
    apply({ debater1, debater2 }) {
      const avg = (pStats(debater1).social + pStats(debater2).social) / 2;
      const resolved = avg * 0.08 + Math.random() * 0.3 > 0.45;
      if (resolved) {
        addBond(debater1, debater2, 0.2);
        addBond(debater2, debater1, 0.2);
      } else {
        addBond(debater1, debater2, -0.3);
        addBond(debater2, debater1, -0.3);
      }
      const scoreMod = resolved ? 0.03 : -0.02;
      return {
        debater1, debater2, resolved, scoreMod,
        text: resolved
          ? `${debater1} and ${debater2} nearly come to blows over the turret placement — "It needs to lean LEFT!" "RIGHT!" — but eventually merge ideas into something even better. Teamwork, people!`
          : `${debater1} wants gothic spires. ${debater2} wants a moat. They argue for five minutes straight and accomplish NOTHING. The castle pays the price.`,
      };
    },
  },
  {
    id: 'sabotage-kick',
    badge: 'Castle Sabotage', badgeClass: 'red',
    check(tribeNames, allTribeMembers) {
      for (const name of allTribeMembers.flatMap(t => t.members)) {
        const arch = players.find(p => p.name === name)?.archetype || '';
        if (!['villain', 'mastermind', 'schemer'].includes(arch)) continue;
        if (!tribeNames.includes(name)) {
          const st = pStats(name);
          if (st.strategic * 0.1 + Math.random() * 0.3 > 0.5) return { saboteur: name, targetTribe: tribeNames };
        }
      }
      return null;
    },
    apply({ saboteur, targetTribe }) {
      let detected = false;
      for (const m of targetTribe) {
        if (pStats(m).intuition * 0.1 + Math.random() * 0.2 > 0.55) {
          addBond(m, saboteur, -0.4);
          detected = true;
        }
      }
      if (detected) {
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[saboteur] = (gs.popularity[saboteur] || 0) - 1;
      }
      const pr = pronouns(saboteur);
      const scoreMod = -0.02;
      return {
        saboteur, detected, pr, scoreMod,
        text: detected
          ? `${saboteur} "trips" and kicks a hole in the rival castle's wall. ${pr.Sub} plays innocent — "Oops, my bad!" — but ${targetTribe[0]} saw EVERYTHING. "You did that on PURPOSE!"`
          : `${saboteur} strolls past the rival castle and gives it a subtle kick. A whole section crumbles. ${pr.Sub} whistles and walks away. Devious.`,
      };
    },
  },
  {
    id: 'teamwork-moment',
    badge: 'Teamwork', badgeClass: 'gold',
    check(tribeNames) {
      for (let i = 0; i < tribeNames.length; i++) {
        for (let j = i + 1; j < tribeNames.length; j++) {
          if (getBond(tribeNames[i], tribeNames[j]) >= 3) return { builder1: tribeNames[i], builder2: tribeNames[j] };
        }
      }
      return null;
    },
    apply({ builder1, builder2 }) {
      addBond(builder1, builder2, 0.3);
      addBond(builder2, builder1, 0.3);
      const scoreMod = 0.02;
      return {
        builder1, builder2, scoreMod,
        text: `${builder1} and ${builder2} move in perfect sync — one packs the sand, the other sculpts. It's like watching a buddy-cop castle-building montage. Beautiful.`,
      };
    },
  },
  {
    id: 'collapse-setback',
    badge: 'Castle Collapse', badgeClass: 'red',
    check(tribeNames) {
      // Proportional: lowest temperament triggers it more often
      let lowest = null, lowestVal = Infinity;
      for (const n of tribeNames) {
        const t = pStats(n).temperament;
        if (t < lowestVal) { lowestVal = t; lowest = n; }
      }
      if (lowest && (1 - lowestVal * 0.1) * Math.random() > 0.4) return { klutz: lowest, tribe: tribeNames };
      return null;
    },
    apply({ klutz, tribe }) {
      // Check for helper
      let helper = null;
      for (const m of tribe) {
        if (m === klutz) continue;
        if (pStats(m).social * 0.1 + Math.random() * 0.2 > 0.5) { helper = m; break; }
      }
      let scoreMod;
      if (helper) {
        addBond(klutz, helper, 0.4);
        scoreMod = -0.01;
        const pr = pronouns(helper);
        return {
          klutz, helper, scoreMod,
          text: `${klutz} leans on the main tower and — WHOMP — the whole thing pancakes. ${helper} dives in and starts rebuilding before the dust even settles. "It's fine, it's FINE!" ${pr.Sub} salvages most of it.`,
        };
      } else {
        for (const m of tribe) {
          if (m !== klutz) addBond(m, klutz, -0.2);
        }
        scoreMod = -0.03;
        return {
          klutz, helper: null, scoreMod,
          text: `${klutz} bumps the castle and the ENTIRE east wing collapses into a sad sand pile. ${pronouns(klutz).posAdj} tribe stares in disbelief. "...Oops?"`,
        };
      }
    },
  },
  {
    id: 'copycat-accusation',
    badge: 'Copycat!', badgeClass: 'orange',
    check(tribeNames, allTribeMembers) {
      if (Math.random() > 0.15) return null;
      if (allTribeMembers.length < 2) return null;
      const accuser = tribeNames[Math.floor(Math.random() * tribeNames.length)];
      const otherTribe = allTribeMembers.find(t => !t.members.includes(accuser));
      if (!otherTribe) return null;
      const accused = otherTribe.members[Math.floor(Math.random() * otherTribe.members.length)];
      return { accuser, accused };
    },
    apply({ accuser, accused }) {
      addBond(accuser, accused, -0.3);
      addBond(accused, accuser, -0.3);
      const pr = pronouns(accuser);
      return {
        accuser, accused, pr, scoreMod: 0,
        text: `${accuser} storms over to the other tribe's castle. "You STOLE our design! That turret is IDENTICAL!" ${accused} fires back: "It's a SANDCASTLE. They ALL have turrets!" Chris munches popcorn.`,
      };
    },
  },
  {
    id: 'paper-mache-trick',
    badge: 'Genius Trick', badgeClass: 'gold',
    check(tribeNames) {
      for (const n of tribeNames) {
        if (pStats(n).mental * 0.1 + Math.random() * 0.1 > 0.65) return { inventor: n, tribe: tribeNames };
      }
      return null;
    },
    apply({ inventor, tribe }) {
      for (const m of tribe) {
        if (m !== inventor) addBond(m, inventor, 0.3);
      }
      const pr = pronouns(inventor);
      const scoreMod = 0.05;
      return {
        inventor, pr, scoreMod,
        text: `${inventor} mixes wet sand with seaweed and — is that PAPIER-MÂCHÉ? ${pr.Sub} reinforces the castle walls with the goop. It hardens like concrete. "That's not in the rules!" "There ARE no rules, Chris said so!" Genius.`,
      };
    },
  },
];

function _simulateSandcastle(ep, tribeMembers, result) {
  const allNames = tribeMembers.flatMap(t => t.members);

  // Per-player material inventories
  const materials = {};
  allNames.forEach(n => { materials[n] = { shells: 0, driftwood: 0, rocks: 0 }; });

  const scavengeEncounters = [];
  const buildEvents = [];
  const usedSaboteurs = new Set();
  const captains = {};

  /* ── Sub-phase A: Scavenge ── */
  for (const name of allNames) {
    const s = pStats(name);
    for (const mat of MATERIALS) {
      const roll = mat.statCheck(s) + Math.random() * 0.3;
      if (roll >= 0.7) materials[name][mat.id] += 2;
      else if (roll >= 0.45) materials[name][mat.id] += 1;
    }
  }

  // Fire 1-2 scavenge encounters
  const shuffledScav = [...SCAVENGE_ENCOUNTERS].sort(() => Math.random() - 0.5);
  const scavCount = Math.random() < 0.5 ? 1 : 2;
  let scavFired = 0;
  for (const enc of shuffledScav) {
    if (scavFired >= scavCount) break;
    const match = enc.check(allNames, tribeMembers);
    if (!match) continue;
    const data = enc.apply(match, materials, tribeMembers);
    data.eventId = enc.id;
    data.badge = enc.badge;
    data.badgeClass = enc.badgeClass;
    scavengeEncounters.push(data);
    scavFired++;
  }

  /* ── Sub-phase B: Build ── */
  // Aggregate materials per tribe
  const tribeMats = {};
  for (const t of tribeMembers) {
    tribeMats[t.name] = { shells: 0, driftwood: 0, rocks: 0 };
    for (const m of t.members) {
      tribeMats[t.name].shells += materials[m].shells;
      tribeMats[t.name].driftwood += materials[m].driftwood;
      tribeMats[t.name].rocks += materials[m].rocks;
    }
  }

  const buildScores = {};
  for (const t of tribeMembers) {
    // Base score: average across members
    let memberTotal = 0;
    for (const m of t.members) {
      const s = pStats(m);
      memberTotal += (s.mental * 0.06 + s.social * 0.05 + s.temperament * 0.04) * (0.8 + Math.random() * 0.4);
    }
    let score = memberTotal / t.members.length;

    // Material bonuses
    const tm = tribeMats[t.name];
    if (tm.shells >= 3) score *= 1.08;
    if (tm.driftwood >= 3) score *= 1.08;
    if (tm.rocks >= 3) score *= 1.08;
    if (tm.shells > 0 && tm.driftwood > 0 && tm.rocks > 0) score *= 1.05;

    // Build captain = highest mental
    let captain = t.members[0], captainMental = 0;
    for (const m of t.members) {
      const mental = pStats(m).mental;
      if (mental > captainMental) { captainMental = mental; captain = m; }
    }
    captains[t.name] = captain;
    score += pStats(captain).strategic * 0.03;

    // Fire 1-3 build events
    const evtCount = 1 + Math.floor(Math.random() * 3);
    const shuffledBuild = [...BUILD_EVENTS].sort(() => Math.random() - 0.5);
    let evtFired = 0;
    for (const evt of shuffledBuild) {
      if (evtFired >= evtCount) break;
      const match = evt.check(t.members, tribeMembers);
      if (!match) continue;
      // Prevent same saboteur hitting multiple tribes
      if (evt.id === 'sabotage-kick' && match.saboteur && usedSaboteurs.has(match.saboteur)) continue;
      const data = evt.apply(match);
      data.eventId = evt.id;
      data.type = evt.id;
      data.badge = typeof evt.badge === 'function' ? evt.badge(data) : evt.badge;
      data.badgeClass = typeof evt.badgeClass === 'function' ? evt.badgeClass(data) : evt.badgeClass;
      data.tribe = t.name;
      data.players = Object.values(match).filter(v => typeof v === 'string' && gs.activePlayers?.includes(v));
      if (data.scoreMod) score *= (1 + data.scoreMod);
      if (evt.id === 'sabotage-kick' && match.saboteur) usedSaboteurs.add(match.saboteur);
      buildEvents.push(data);
      evtFired++;
    }

    buildScores[t.name] = score;
  }

  // Winner = higher build score
  const sorted = Object.entries(buildScores).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  result.tribeScores[winner] = (result.tribeScores[winner] || 0) + 1;

  // Store sandcastle data
  result.sandcastleData = {
    materials: JSON.parse(JSON.stringify(materials)),
    tribeMats,
    buildScores,
    scavengeEncounters,
    buildEvents,
    captains,
    winner,
  };

  // Update chalMemberScores with build contributions
  for (const t of tribeMembers) {
    for (const m of t.members) {
      const s = pStats(m);
      const contribution = (s.mental * 0.06 + s.social * 0.05 + s.temperament * 0.04);
      ep.chalMemberScores[m] = (ep.chalMemberScores[m] || 0) + contribution * 10;
    }
  }
}

/* ═══════════════════════════════════════════════════════
   HALFTIME DRAMA — fires between sandcastle and dance-off
   ═══════════════════════════════════════════════════════ */

const HALFTIME_EVENTS = [
  {
    id: 'rivalry-confrontation',
    badge: 'Confrontation', badgeClass: 'red',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const a of all) {
        for (const b of all) {
          if (a === b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe && getBond(a, b) <= -1 && Math.random() < 0.5) return { fighter1: a, fighter2: b };
        }
      }
      return null;
    },
    apply({ fighter1, fighter2 }, tribeMembers) {
      addBond(fighter1, fighter2, -0.4);
      addBond(fighter2, fighter1, -0.4);
      // witnesses pick sides
      const all = tribeMembers.flatMap(t => t.members).filter(n => n !== fighter1 && n !== fighter2);
      const witnesses = [];
      for (const w of all) {
        const side = getBond(w, fighter1) >= getBond(w, fighter2) ? fighter1 : fighter2;
        const other = side === fighter1 ? fighter2 : fighter1;
        addBond(w, side, 0.2);
        addBond(w, other, -0.2);
        witnesses.push({ name: w, sided: side });
      }
      const pr1 = pronouns(fighter1), pr2 = pronouns(fighter2);
      return {
        fighter1, fighter2, witnesses, pr1, pr2,
        players: [fighter1, fighter2, ...witnesses.map(w => w.name)],
        text: `${fighter1} and ${fighter2} get in each other's faces at the drink station. "You were HOLDING ME BACK out there!" ${pr1.Sub} shoves a towel. ${fighter2} shoves it right back. "In your dreams!" The whole cast picks sides.`,
      };
    },
  },
  {
    id: 'alliance-pitch',
    badge: 'Alliance Pitch', badgeClass: 'orange',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const pitcher of all) {
        const s = pStats(pitcher);
        const arch = players.find(p => p.name === pitcher)?.archetype || '';
        if (s.social * 0.1 + Math.random() * 0.1 >= 0.7 || ['mastermind', 'schemer', 'villain'].includes(arch)) {
          for (const target of all) {
            if (pitcher === target) continue;
            const sameTribe = tribeMembers.some(t => t.members.includes(pitcher) && t.members.includes(target));
            if (!sameTribe) return { pitcher, target };
          }
        }
      }
      return null;
    },
    apply({ pitcher, target }) {
      const sPitcher = pStats(pitcher), sTarget = pStats(target);
      const persuasion = sPitcher.social * 0.08 + sPitcher.strategic * 0.04 + Math.random() * 0.3;
      const resistance = sTarget.mental * 0.06 + sTarget.loyalty * 0.06 + Math.random() * 0.2;
      const accepted = persuasion > resistance;
      if (accepted) {
        addBond(pitcher, target, 0.3);
        addBond(target, pitcher, 0.3);
      } else {
        addBond(pitcher, target, -0.2);
      }
      const pr = pronouns(pitcher);
      return {
        pitcher, target, accepted, pr,
        players: [pitcher, target],
        text: accepted
          ? `${pitcher} sidles up to ${target} during the break. "Look, the merge is coming. You and me? Unstoppable." ${target} hesitates... then nods. "I'm listening."`
          : `${pitcher} tries to pitch a cross-tribe deal to ${target}. ${target} stares ${pr.obj} down. "Nice try. I know a snake when I see one." Rejected.`,
      };
    },
  },
  {
    id: 'showmance-moment',
    badge: 'Showmance Spark', badgeClass: 'gold',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      // Check active showmances first
      if (gs.showmances) {
        for (const sm of gs.showmances) {
          if (all.includes(sm.players[0]) && all.includes(sm.players[1]) && romanticCompat(sm.players[0], sm.players[1])) {
            return { lover1: sm.players[0], lover2: sm.players[1], existing: true };
          }
        }
      }
      // Check sparks
      if (gs.romanticSparks) {
        for (const sp of gs.romanticSparks) {
          if (all.includes(sp.players[0]) && all.includes(sp.players[1]) && romanticCompat(sp.players[0], sp.players[1])) {
            return { lover1: sp.players[0], lover2: sp.players[1], existing: false };
          }
        }
      }
      return null;
    },
    apply({ lover1, lover2, existing }, tribeMembers) {
      addBond(lover1, lover2, 0.3);
      addBond(lover2, lover1, 0.3);
      // nearby reactions
      const all = tribeMembers.flatMap(t => t.members).filter(n => n !== lover1 && n !== lover2);
      for (const w of all) {
        addBond(w, lover1, Math.random() < 0.5 ? 0.1 : -0.1);
      }
      const pr1 = pronouns(lover1);
      return {
        lover1, lover2, existing, pr1,
        players: [lover1, lover2],
        text: existing
          ? `${lover1} and ${lover2} share a towel during halftime. ${pr1.Sub} "accidentally" brushes ${pronouns(lover2).posAdj} hand. The whole cast groans. "Get a ROOM!"`
          : `${lover1} catches ${lover2}'s eye across the beach. They both look away. Then look back. Chris zooms in. "Ohhh, do I smell a SHOWMANCE brewing?!"`,
      };
    },
  },
  {
    id: 'injury-check',
    badge: 'Injury Check', badgeClass: 'orange',
    check(tribeMembers, result) {
      if (!result.surfData?.wipeoutOrder?.length) return null;
      const injured = result.surfData.wipeoutOrder[result.surfData.wipeoutOrder.length - 1];
      return { injured };
    },
    apply({ injured }, tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members).filter(n => n !== injured);
      let healer = null;
      for (const h of all) {
        const s = pStats(h);
        if (s.social * 0.1 + Math.random() * 0.15 >= 0.6) {
          healer = h;
          break;
        }
      }
      if (healer) {
        addBond(injured, healer, 0.4);
        const pr = pronouns(healer);
        return {
          injured, healer, pr, sandcastlePenalty: false,
          players: [injured, healer],
          text: `${injured} is still rubbing ${pronouns(injured).posAdj} shoulder from that wipeout. ${healer} jogs over with ice. "Here, let me look at that." ${pr.Sub} patches ${pronouns(injured).obj} up. Respect earned.`,
        };
      } else {
        return {
          injured, healer: null, sandcastlePenalty: true,
          players: [injured],
          text: `${injured} winces and stretches ${pronouns(injured).posAdj} wipeout-bruised arm. Nobody checks on ${pronouns(injured).obj}. The injury's going to slow ${pronouns(injured).obj} down in the sandcastle phase. Tough break.`,
        };
      }
    },
  },
  {
    id: 'strategy-huddle',
    badge: 'Strategy Huddle', badgeClass: 'orange',
    check(tribeMembers) {
      let bestStrat = null, bestVal = 0;
      const all = tribeMembers.flatMap(t => t.members);
      for (const n of all) {
        const s = pStats(n).strategic;
        if (s > bestVal) { bestVal = s; bestStrat = n; }
      }
      if (bestStrat) return { strategist: bestStrat };
      return null;
    },
    apply({ strategist }, tribeMembers) {
      const tribe = tribeMembers.find(t => t.members.includes(strategist));
      if (!tribe) return null;
      const s = pStats(strategist);
      const success = s.social * 0.08 + Math.random() * 0.3 > 0.5;
      if (success) {
        for (const m of tribe.members) {
          for (const m2 of tribe.members) {
            if (m !== m2) addBond(m, m2, 0.2);
          }
        }
      } else {
        for (const m of tribe.members) {
          if (m !== strategist) addBond(m, strategist, -0.1);
        }
      }
      const pr = pronouns(strategist);
      return {
        strategist, tribe: tribe.name, success, pr,
        players: [...tribe.members],
        text: success
          ? `${strategist} pulls ${pr.posAdj} tribe into a huddle. "Listen. Here's the plan for sandcastles..." ${pr.Sub} draws a diagram in the sand. The tribe nods. Unity achieved.`
          : `${strategist} tries to rally the troops with a halftime speech. ${pr.Sub} pulls out a sand-diagram. ${pr.posAdj} tribe stares blankly. "You lost us at 'strategic paradigm.'" Swing and a miss.`,
      };
    },
  },
  {
    id: 'cross-tribe-taunt',
    badge: 'Beach Taunt', badgeClass: 'red',
    check(tribeMembers, result) {
      if (!result.surfData?.winner) return null;
      const winTribe = tribeMembers.find(t => t.name === result.surfData.winner);
      if (!winTribe) return null;
      for (const name of winTribe.members) {
        const arch = players.find(p => p.name === name)?.archetype || '';
        if (['villain', 'mastermind', 'schemer'].includes(arch)) return { taunter: name, winTribe: winTribe.name };
      }
      return null;
    },
    apply({ taunter, winTribe }, tribeMembers) {
      const loseTribe = tribeMembers.find(t => t.name !== winTribe);
      if (loseTribe) {
        for (const m of loseTribe.members) addBond(m, taunter, -0.3);
      }
      // Own tribe mixed reaction
      const ownTribe = tribeMembers.find(t => t.name === winTribe);
      if (ownTribe) {
        for (const m of ownTribe.members) {
          if (m !== taunter) addBond(m, taunter, Math.random() < 0.5 ? 0.1 : -0.1);
        }
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[taunter] = (gs.popularity[taunter] || 0) - 1;
      const pr = pronouns(taunter);
      return {
        taunter, winTribe, pr,
        players: [taunter],
        text: `${taunter} struts past the losing tribe, flexing. "Better luck next time, LOSERS! Oh wait — there IS no next time for this phase!" ${pr.Sub} blows a kiss. Even ${pr.posAdj} own tribe cringes.`,
      };
    },
  },
  {
    id: 'beach-bonding',
    badge: 'Beach Bond', badgeClass: 'gold',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const a of all) {
        for (const b of all) {
          if (a >= b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (sameTribe && getBond(a, b) >= 1) return { player1: a, player2: b };
        }
      }
      return null;
    },
    apply({ player1, player2 }) {
      addBond(player1, player2, 0.3);
      addBond(player2, player1, 0.3);
      const texts = [
        `${player1} and ${player2} skip rocks across the pool. ${player1} gets five skips. ${player2} gets seven. A rivalry is born — the friendly kind.`,
        `${player1} and ${player2} sit at the water's edge, feet dangling. The conversation isn't about strategy for once. It's about home.`,
        `${player1} teaches ${player2} a card trick with soggy cards. It takes four tries. They're both laughing by the end.`,
      ];
      return { player1, player2, players: [player1, player2], text: texts[Math.floor(Math.random() * texts.length)] };
    },
  },
  {
    id: 'paranoia-spiral',
    badge: 'Paranoia', badgeClass: 'red',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const name of all) {
        const s = pStats(name);
        if (s.intuition * 0.1 + Math.random() * 0.2 > 0.6 && s.temperament <= 6) return { paranoid: name };
      }
      return null;
    },
    apply({ paranoid }, tribeMembers) {
      const tribe = tribeMembers.find(t => t.members.includes(paranoid));
      const tribemates = tribe ? tribe.members.filter(m => m !== paranoid) : [];
      tribemates.forEach(m => addBond(m, paranoid, -0.15));
      const pr = pronouns(paranoid);
      const target = tribemates[Math.floor(Math.random() * tribemates.length)] || 'someone';
      return { paranoid, target, pr, players: [paranoid, ...(typeof target === 'string' && tribemates.includes(target) ? [target] : [])],
        text: `${paranoid} catches ${target} whispering during the break. Were they talking about ${pr.obj}? ${pr.Sub} can't tell. But now ${pr.sub} can't stop watching. The paranoia is setting in.` };
    },
  },
  {
    id: 'food-steal',
    badge: 'Snack Theft', badgeClass: 'red',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const name of all) {
        const s = pStats(name);
        if (s.boldness * 0.08 + Math.random() * 0.2 > 0.5) return { thief: name };
      }
      return null;
    },
    apply({ thief }, tribeMembers) {
      const tribe = tribeMembers.find(t => t.members.includes(thief));
      const witness = tribe ? tribe.members.find(m => m !== thief && pStats(m).intuition >= 5) : null;
      if (witness) addBond(witness, thief, -0.3);
      const pr = pronouns(thief);
      return { thief, witness, pr, players: [thief, ...(witness ? [witness] : [])],
        text: witness
          ? `${thief} sneaks an extra sandwich from the craft table. ${witness} watches the whole thing. "I saw that." ${thief}: "Saw what?" The tension is palpable.`
          : `${thief} pockets three sandwiches during the break. ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} sorry. "It's a survival game. I'm surviving."` };
    },
  },
  {
    id: 'pep-talk',
    badge: 'Pep Talk', badgeClass: 'gold',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const name of all) {
        const s = pStats(name);
        if (s.social * 0.1 + Math.random() * 0.15 > 0.6) {
          const tribe = tribeMembers.find(t => t.members.includes(name));
          const target = tribe?.members.find(m => m !== name && pStats(m).temperament <= 5);
          if (target) return { talker: name, target };
        }
      }
      return null;
    },
    apply({ talker, target }) {
      addBond(target, talker, 0.4);
      const pr = pronouns(talker);
      return { talker, target, pr, players: [talker, target],
        text: `${talker} finds ${target} sitting alone, staring at the water. "Hey. You were solid out there. Don't let anyone tell you different." ${target} doesn't say anything. But ${pronouns(target).sub} sits up a little straighter.` };
    },
  },
  {
    id: 'challenge-replay',
    badge: 'Replay Drama', badgeClass: 'orange',
    check(tribeMembers, result) {
      if (!result.surfData?.wipeoutOrder?.length) return null;
      const all = tribeMembers.flatMap(t => t.members);
      const blamer = all.find(n => pStats(n).temperament <= 5 || pStats(n).strategic >= 7);
      const victim = result.surfData.wipeoutOrder[0];
      if (blamer && victim && blamer !== victim) return { blamer, victim };
      return null;
    },
    apply({ blamer, victim }) {
      addBond(blamer, victim, -0.3);
      addBond(victim, blamer, -0.3);
      const pr = pronouns(blamer);
      return { blamer, victim, pr, players: [blamer, victim],
        text: `${blamer} replays the surf phase out loud. "You KNOW who cost us that round, right?" ${pr.Sub} looks directly at ${victim}. ${victim} looks at the ground. The tribe pretends not to hear.` };
    },
  },
  {
    id: 'confessional-moment',
    badge: 'Confessional', badgeClass: 'orange',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const candidate = all[Math.floor(Math.random() * all.length)];
      return { player: candidate };
    },
    apply({ player }) {
      const s = pStats(player);
      const arch = players.find(p => p.name === player)?.archetype || '';
      const pr = pronouns(player);
      const confessionals = [
        `${player} in confessional: "Everyone thinks I'm just here to have fun. I'm not. I'm here to win. And if that means getting sand in my eyes for three hours? So be it."`,
        `${player} in confessional: "I'm watching everyone during this break. Who talks to who. Who avoids who. This is when the REAL game happens."`,
        `${player} in confessional: "That surfing round almost killed me. But I'm still here. And now they all know I don't quit easy."`,
        `${player} in confessional: "${pr.Sub} ${pr.sub === 'they' ? 'think' : 'thinks'} ${pr.sub === 'they' ? 'they\'re' : 'I\'m'} safe right now? Nobody is safe. I've got a plan and it involves exactly zero of these people."`,
        `${player} in confessional: "The beach is nice. The water is warm. The people are terrible. Standard day in paradise."`,
      ];
      return { player, pr, players: [player], text: confessionals[Math.floor(Math.random() * confessionals.length)] };
    },
  },
];

function _simulateHalftime(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  const events = [];
  const count = 5 + Math.floor(Math.random() * 4);
  let fired = 0;
  const usedPlayers = new Set();

  // Multiple passes through the event pool until we hit the target count
  for (let pass = 0; pass < 4 && fired < count; pass++) {
    const shuffled = [...HALFTIME_EVENTS].sort(() => Math.random() - 0.5);
    for (const evt of shuffled) {
      if (fired >= count) break;
      const match = evt.check(tribeMembers, result);
      if (!match) continue;
      // Avoid same player starring in consecutive events
      const matchPlayers = Object.values(match).filter(v => typeof v === 'string' && gs.activePlayers?.includes(v));
      if (matchPlayers.length && matchPlayers.every(p => usedPlayers.has(p))) continue;
      const data = evt.apply(match, tribeMembers);
      if (!data) continue;
      matchPlayers.forEach(p => usedPlayers.add(p));
    data.eventId = evt.id;
    data.badge = evt.badge;
    data.badgeClass = evt.badgeClass;

    // Apply sandcastle penalty for unhealed injury
    if (evt.id === 'injury-check' && data.sandcastlePenalty && result.sandcastleData) {
      const injured = data.injured;
      const tribe = tribeMembers.find(t => t.members.includes(injured));
      if (tribe && result.sandcastleData.buildScores[tribe.name]) {
        result.sandcastleData.buildScores[tribe.name] *= 0.85;
      }
    }

    events.push(data);

    // Register as camp event
    ep.campEvents[campKey].post.push({
      type: `beach-bogus-halftime-${evt.id}`,
      text: data.text,
      players: data.players || [],
      badgeText: evt.badge,
      badgeClass: evt.badgeClass,
    });

    fired++;
    }
  }

  result.halftimeEvents = events;
}

/* ═══════════════════════════════════════════════════════
   DANCE-OFF — tiebreaker when tribes are locked 1-1
   ═══════════════════════════════════════════════════════ */

const DANCE_SELECTION = [
  {
    id: 'volunteer',
    check(tribeNames) {
      if (Math.random() > 0.40) return null;
      let best = null, bestVal = 0;
      for (const n of tribeNames) {
        const val = pStats(n).boldness * 0.1 + Math.random() * 0.15;
        if (val >= 0.7 && val > bestVal) { bestVal = val; best = n; }
      }
      return best;
    },
    applyBonds(dancer, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, 0.2);
      }
    },
    text(dancer) {
      const pr = pronouns(dancer);
      return `${dancer} steps forward before anyone else can blink. "I GOT this." ${pr.Sub} cracks ${pr.posAdj} knuckles. Confidence radiating.`;
    },
  },
  {
    id: 'nominated',
    check(tribeNames) {
      if (Math.random() > 0.50) return null;
      let best = null, bestVal = 0;
      for (const n of tribeNames) {
        const s = pStats(n);
        const val = (s.social + s.physical) * 0.05 + Math.random() * 0.1;
        if (val > bestVal) { bestVal = val; best = n; }
      }
      return best;
    },
    applyBonds(dancer, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, 0.1);
      }
    },
    text(dancer) {
      return `The tribe points at ${dancer} in unison. "YOU. You're our best shot." ${dancer} blinks. "...Me?" "YES, YOU. GO."`;
    },
  },
  {
    id: 'power-grab',
    check(tribeNames) {
      if (Math.random() > 0.20) return null;
      for (const n of tribeNames) {
        const arch = players.find(p => p.name === n)?.archetype || '';
        if (['schemer', 'mastermind'].includes(arch)) return n;
      }
      return null;
    },
    applyBonds(dancer, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, -0.2);
      }
    },
    text(dancer) {
      const pr = pronouns(dancer);
      return `${dancer} shoves to the front. "Nobody else has the range. I'M doing this." ${pr.posAdj} tribe exchanges uneasy looks but nobody argues.`;
    },
  },
  {
    id: 'guilt-trip',
    check(tribeNames) {
      if (Math.random() > 0.15) return null;
      let pressurer = null, victim = null;
      for (const n of tribeNames) {
        if (pStats(n).social * 0.1 + Math.random() * 0.1 >= 0.7) { pressurer = n; break; }
      }
      if (!pressurer) return null;
      for (const n of tribeNames) {
        if (n === pressurer) continue;
        if (pStats(n).loyalty * 0.1 + Math.random() * 0.1 >= 0.6) { victim = n; break; }
      }
      if (!victim) return null;
      return { dancer: victim, pressurer };
    },
    applyBonds(dancer, tribeNames, extra) {
      if (extra?.pressurer) {
        addBond(extra.pressurer, dancer, -0.3);
        addBond(dancer, extra.pressurer, -0.2);
      }
    },
    text(dancer, extra) {
      return `${extra.pressurer} corners ${dancer}. "You OWE us after that sandcastle disaster. Get out there." ${dancer} swallows hard. "...Fine." Guilt: weaponized.`;
    },
  },
];

const DANCE_BEATS = [
  {
    id: 'opening-move',
    check() { return true; },
    apply(dancer) {
      const pr = pronouns(dancer);
      const texts = [
        `${dancer} steps into the light. Cracks ${pr.posAdj} neck. The music hasn't started yet but the whole beach is already watching.`,
        `${dancer} rolls ${pr.posAdj} shoulders, sizes up the dance floor. Exhales. "Let's do this." The beat drops.`,
        `The spotlight hits ${dancer}. ${pr.Sub} doesn't move for three whole seconds. Then — BOOM. First move hits HARD.`,
        `${dancer} starts slow. Too slow? No. Building. Every step is deliberate. The crowd leans in.`,
      ];
      return { scoreMod: 0.03, text: texts[Math.floor(Math.random() * texts.length)] };
    },
  },
  {
    id: 'crowd-erupts',
    check(score, range) { return score >= range[0] + (range[1] - range[0]) * 0.5; },
    apply(dancer, tribeMembers, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, 0.5);
      }
      // Rivals give grudging respect
      const rivalTribe = tribeMembers.find(t => !t.members.includes(dancer));
      if (rivalTribe) {
        for (const m of rivalTribe.members) addBond(m, dancer, 0.1);
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) + 2;
      const pr = pronouns(dancer);
      return {
        scoreMod: 0.08,
        text: `${dancer} NAILS it — the crowd goes absolutely FERAL. Even the rival tribe is applauding. ${pr.Sub} moonwalks back to ${pr.posAdj} spot. Mic. Drop.`,
      };
    },
  },
  {
    id: 'choke',
    check(score, range) { return score <= range[0] + (range[1] - range[0]) * 0.4; },
    apply(dancer, tribeMembers, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, -0.3);
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) - 1;
      return {
        scoreMod: -0.08,
        text: `${dancer} freezes up. The music plays but nothing happens. "...Dance? DANCE!" Chris yells. ${dancer} does a half-hearted shimmy. The tribe buries their faces in their hands.`,
      };
    },
  },
  {
    id: 'showmance-audience',
    check(score, range, dancer) {
      if (!gs.showmances) return false;
      return gs.showmances.some(sm => sm.players.includes(dancer));
    },
    apply(dancer, tribeMembers) {
      const sm = gs.showmances.find(s => s.players.includes(dancer));
      if (!sm) return null;
      const partner = sm.players[0] === dancer ? sm.players[1] : sm.players[0];
      addBond(partner, dancer, 0.4);
      return {
        scoreMod: 0.04, partner,
        text: `${partner} watches from the sideline, hands clasped. Every move ${dancer} makes — ${partner}'s eyes follow. "GO BABY!" The crowd awws. Chris pretends to wipe a tear.`,
      };
    },
  },
  {
    id: 'rival-heckle',
    check(score, range, dancer, tribeMembers) {
      if (Math.random() > 0.4) return false;
      const rivalTribe = tribeMembers.find(t => !t.members.includes(dancer));
      if (!rivalTribe) return false;
      return rivalTribe.members.some(m => getBond(m, dancer) <= -1);
    },
    apply(dancer, tribeMembers) {
      const rivalTribe = tribeMembers.find(t => !t.members.includes(dancer));
      const heckler = rivalTribe?.members.find(m => getBond(m, dancer) <= -1);
      if (!heckler) return null;
      addBond(heckler, dancer, -0.2);
      const dancerTribe = tribeMembers.find(t => t.members.includes(dancer));
      if (dancerTribe) {
        for (const m of dancerTribe.members) addBond(m, heckler, -0.3);
      }
      return {
        scoreMod: -0.03, heckler,
        text: `${heckler} cups ${pronouns(heckler).posAdj} hands: "TWO LEFT FEET! TWO LEFT FEET!" ${dancer} stumbles mid-spin. The heckling WORKS — ${pronouns(dancer).posAdj} rhythm is thrown off. Dirty play.`,
      };
    },
  },
  {
    id: 'signature-move',
    check(score, range, dancer) {
      if (Math.random() > 0.5) return false;
      return pStats(dancer).boldness * 0.1 + Math.random() * 0.2 >= 0.6;
    },
    apply(dancer, tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (const m of all) {
        if (m !== dancer) addBond(m, dancer, 0.2);
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) + 2;
      const pr = pronouns(dancer);
      return {
        scoreMod: 0.05,
        text: `${dancer} pulls out a SIGNATURE MOVE — nobody's ever seen anything like it. ${pr.Sub} spins, drops, pops back up. The beach SHAKES. "THAT'S going viral!" Chris screams.`,
      };
    },
  },
  {
    id: 'trip-stumble',
    check(score, range, dancer) {
      if (Math.random() > 0.4) return false;
      return pStats(dancer).temperament * 0.1 + Math.random() * 0.15 <= 0.55;
    },
    apply(dancer, tribeMembers, tribeNames) {
      const s = pStats(dancer);
      const recovers = s.boldness * 0.1 + Math.random() * 0.15 >= 0.6;
      if (recovers) {
        for (const m of tribeNames) {
          if (m !== dancer) addBond(m, dancer, 0.3);
        }
        const pr = pronouns(dancer);
        return {
          scoreMod: 0.04, recovers,
          text: `${dancer} TRIPS mid-routine — face-plants into the sand — and somehow turns it into a BREAKDANCE MOVE?! ${pr.Sub} spins on ${pr.posAdj} back and pops up grinning. "MEANT to do that!" The tribe ROARS.`,
        };
      } else {
        for (const m of tribeNames) {
          if (m !== dancer) addBond(m, dancer, -0.2);
        }
        return {
          scoreMod: -0.08, recovers,
          text: `${dancer} catches a foot on a seashell and goes DOWN. Hard. The music keeps playing over the carnage. ${pronouns(dancer).Sub} doesn't get back up for a solid five seconds. Devastating.`,
        };
      }
    },
  },
  {
    id: 'finishing-flourish',
    check() { return true; },
    apply(dancer) {
      const pr = pronouns(dancer);
      const texts = [
        `${dancer} hits the final pose — arms out, head back, breathing hard. The beach ERUPTS. Whatever happens now, that was a PERFORMANCE.`,
        `The music fades. ${dancer} stands there, chest heaving, drenched in sweat. ${pr.Sub} gave everything. The tribe chants ${pr.posAdj} name.`,
        `${dancer} finishes with a spin and drops to one knee. Silence — then the loudest cheer of the night. Chris actually stands up.`,
        `Last move. ${dancer} locks eyes with the rival dancer and SMIRKS. Walks off the floor without looking back. Stone. Cold.`,
      ];
      return { scoreMod: 0.02, text: texts[Math.floor(Math.random() * texts.length)] };
    },
  },
];

function _simulateDanceOff(ep, tribeMembers, result) {
  const dancers = {};
  const selections = {};
  const scores = {};
  const ranges = {};
  const beats = {};

  // --- Champion selection per tribe ---
  for (const tribe of tribeMembers) {
    let chosen = null;
    let selectionData = null;
    for (const sel of DANCE_SELECTION) {
      if (chosen) break;
      const match = sel.check(tribe.members);
      if (!match) continue;
      if (typeof match === 'object') {
        chosen = match.dancer;
        sel.applyBonds(match.dancer, tribe.members, match);
        selectionData = { id: sel.id, text: sel.text(match.dancer, match) };
      } else {
        chosen = match;
        sel.applyBonds(match, tribe.members);
        selectionData = { id: sel.id, text: sel.text(match) };
      }
    }
    // Fallback: random pick
    if (!chosen) {
      chosen = tribe.members[Math.floor(Math.random() * tribe.members.length)];
      selectionData = { id: 'random', text: `Nobody volunteers so Chris picks ${chosen} at random. "Eeny meeny... YOU. Get out there."` };
    }
    dancers[tribe.name] = chosen;
    selections[tribe.name] = selectionData;
  }

  // --- Dance scores ---
  for (const tribe of tribeMembers) {
    const dancer = dancers[tribe.name];
    const s = pStats(dancer);
    const base = s.social * 0.06 + s.physical * 0.05 + s.boldness * 0.04 + s.temperament * 0.03;
    const temp = s.temperament;
    const lo = base * (1 - (10 - temp) * 0.04);
    const hi = base * (1 + temp * 0.02);
    let score = lo + Math.random() * (hi - lo);

    ranges[tribe.name] = [lo, hi];

    // --- Fire 3-5 dance beats per dancer ---
    const beatCount = 3 + Math.floor(Math.random() * 3);
    const shuffled = [...DANCE_BEATS].sort(() => Math.random() - 0.5);
    const firedBeats = [];
    let firedCount = 0;

    for (const beat of shuffled) {
      if (firedCount >= beatCount) break;
      if (!beat.check(score, ranges[tribe.name], dancer, tribeMembers)) continue;
      const data = beat.apply(dancer, tribeMembers, tribe.members);
      if (!data) continue;
      data.beatId = beat.id;
      data.dancer = dancer;
      data.tribe = tribe.name;
      if (data.scoreMod) score *= (1 + data.scoreMod);
      firedBeats.push(data);
      firedCount++;
    }

    scores[tribe.name] = score;
    beats[tribe.name] = firedBeats;

    // Update chalMemberScores for dancer
    ep.chalMemberScores[dancer] = (ep.chalMemberScores[dancer] || 0) + score * 10;
  }

  // --- Winner ---
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  result.tribeScores[winner] = (result.tribeScores[winner] || 0) + 1;

  result.danceOff = { dancers, selections, scores, ranges, beats, winner };
}

/* ═══════════════════════════════════════════════════════
   MAIN ORCHESTRATOR
   ═══════════════════════════════════════════════════════ */

export function simulateBeachBlanketBogus(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    chrisOpener: 'Chris stands on a fake beach set. Behind him: a pool full of sharks, a pile of sand, and a disco ball. "Welcome to Beach Blanket Bogus!"',
    chrisCloser: '',
    phases: [],
    tribeScores: {},
    surfData: null,
    sandcastleData: null,
    halftimeEvents: null,
    danceOff: null,
  };

  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.beachBlanketBogus = result;
  ep.challengeType = 'beach-blanket-bogus';

  // Initialize chalMemberScores for all players
  const chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(name => { chalMemberScores[name] = 0; });
  ep.chalMemberScores = chalMemberScores;

  // Initialize camp events
  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  // --- SURF PHASE ---
  _simulateSurf(ep, tribeMembers, result);
  result.phases.push('surf');

  // --- BEACH BREAK (always fires between surf and sandcastle, 6-8 events) ---
  _simulateHalftime(ep, tribeMembers, result);
  result.beachBreakEvents = result.halftimeEvents;
  result.halftimeEvents = null;
  result.phases.push('beachBreak');

  // --- SANDCASTLE PHASE ---
  _simulateSandcastle(ep, tribeMembers, result);
  result.phases.push('sandcastle');

  // --- Check for tie at top → pre-danceoff drama + dance-off between tied leaders ---
  const sortedScores = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const topScore = sortedScores[0][1];
  const tiedAtTop = sortedScores.filter(([_, s]) => s === topScore);
  if (tiedAtTop.length >= 2) {
    const tiedTribeMembers = tribeMembers.filter(t => tiedAtTop.some(([name]) => name === t.name));
    _simulateHalftime(ep, tiedTribeMembers, result);
    result.phases.push('halftime');

    _simulateDanceOff(ep, tiedTribeMembers, result);
    result.phases.push('danceOff');
  }

  // --- FINAL RESOLUTION ---
  const sortedTribes = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.challengePlacements = sortedTribes.map(([name]) => {
    const t = tribes.find(tr => tr.name === name);
    return { name, members: [...(t?.members || [])] };
  });
  ep.tribalPlayers = [...(ep.loser?.members || [])];

  // Chris closer based on outcome
  if (result.danceOff) {
    result.chrisCloser = `"A DANCE-OFF to break the tie! ${winnerName} takes it! ${loserName}... I'll see you at tribal tonight."`;
  } else {
    result.chrisCloser = `"${winnerName} DOMINATES Beach Blanket Bogus! ${loserName}... pack your arguments for tribal. You'll need 'em."`;
  }

  updateChalRecord(ep);

  // --- Popularity: surf last standing ---
  if (!gs.popularity) gs.popularity = {};
  if (result.surfData) {
    const allSurfers = tribeMembers.flatMap(t => t.members);
    const survivors = allSurfers.filter(n => result.surfData.balances[n] > 0);
    for (const s of survivors) {
      gs.popularity[s] = (gs.popularity[s] || 0) + 2;
    }
  }

  // --- Heat: track detected saboteurs from all phases ---
  if (!gs._beachBogusHeat) gs._beachBogusHeat = [];
  const expiresEp = (gs.episode || 1) + 2;

  // Surf sabotage
  if (result.surfData) {
    for (const round of result.surfData.rounds) {
      for (const evt of round.events) {
        if (evt.eventId === 'sabotage-splash' && evt.splasher) {
          gs._beachBogusHeat.push({ target: evt.splasher, amount: 1.0, expiresEp });
        }
      }
    }
  }
  // Sandcastle sabotage
  if (result.sandcastleData) {
    for (const evt of result.sandcastleData.scavengeEncounters) {
      if (evt.eventId === 'steal-material' && evt.detected && evt.thief) {
        gs._beachBogusHeat.push({ target: evt.thief, amount: 0.8, expiresEp });
      }
    }
    for (const evt of result.sandcastleData.buildEvents) {
      if (evt.eventId === 'sabotage-kick' && evt.detected && evt.saboteur) {
        gs._beachBogusHeat.push({ target: evt.saboteur, amount: 1.0, expiresEp });
      }
    }
  }

  // --- Camp events: challenge highlights ---
  // Surf winner badge
  if (result.surfData?.winner) {
    ep.campEvents[campKey].post.push({
      type: 'beach-bogus-surf-winner',
      text: `${result.surfData.winner} wins the surf phase with the highest average balance!`,
      players: tribeMembers.find(t => t.name === result.surfData.winner)?.members || [],
      badgeText: 'Surf Champions',
      badgeClass: 'gold',
    });
  }
  // Sandcastle winner badge
  if (result.sandcastleData?.winner) {
    ep.campEvents[campKey].post.push({
      type: 'beach-bogus-sandcastle-winner',
      text: `${result.sandcastleData.winner} takes the sandcastle phase with a stunning build!`,
      players: tribeMembers.find(t => t.name === result.sandcastleData.winner)?.members || [],
      badgeText: 'Master Builders',
      badgeClass: 'gold',
    });
  }
  // Dance-off winner badge
  if (result.danceOff) {
    const dancerName = result.danceOff.dancers[result.danceOff.winner];
    ep.campEvents[campKey].post.push({
      type: 'beach-bogus-danceoff-winner',
      text: `${dancerName} wins the tiebreaker dance-off for ${result.danceOff.winner}!`,
      players: [dancerName],
      badgeText: 'Dance Champion',
      badgeClass: 'gold',
    });
  }

  // --- Showmance challenge moments: cross-tribe showmances ---
  if (gs.showmances && Math.random() < 0.30) {
    const allNames = tribeMembers.flatMap(t => t.members);
    for (const sm of gs.showmances) {
      const a = sm.players[0], b = sm.players[1];
      if (!allNames.includes(a) || !allNames.includes(b)) continue;
      if (!romanticCompat(a, b)) continue;
      const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
      if (!sameTribe) {
        addBond(a, b, 0.2);
        addBond(b, a, 0.2);
        ep.campEvents[campKey].post.push({
          type: 'beach-bogus-showmance',
          text: `${a} and ${b} steal a moment after the challenge — a quick hug before retreating to their separate tribes.`,
          players: [a, b],
          badgeText: 'Beach Romance',
          badgeClass: 'gold',
        });
        break; // one showmance moment max
      }
    }
  }

  // --- Timeline tag: main challenge event ---
  ep.campEvents[campKey].post.push({
    text: `Beach Blanket Bogus: ${winnerName} ${result.danceOff ? 'wins in a tiebreaker dance-off' : 'sweeps 2-0'}. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'BEACH BLANKET BOGUS', badgeClass: 'gold',
    tag: 'challenge',
  });

  // --- Debug data ---
  ep._debugBeachBogus = {
    surfWinner: result.surfData?.winner,
    sandWinner: result.sandcastleData?.winner,
    danceOffFired: !!result.danceOff,
    danceWinner: result.danceOff?.winner || null,
    finalScores: result.tribeScores,
    surfBest: result.surfData?.tribeBest,
    buildScores: result.sandcastleData?.buildScores,
    materials: result.sandcastleData?.materials,
    wipeoutOrder: result.surfData?.wipeoutOrder,
    heatGenerated: (gs._beachBogusHeat || []).length,
  };
}

export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;

  // --- Chris opener ---
  sec('BEACH BLANKET BOGUS');
  ln(bbb.chrisOpener);

  // --- SURF PHASE ---
  if (bbb.surfData) {
    sec('PHASE 1 — SURF\'S UP');
    ln('"First up: EXTREME SURFING! Last one standing on their board wins the point for their tribe!"');
    for (const round of bbb.surfData.rounds) {
      ln(`Chris grins as the next hazard drops: ${round.name}. ${round.desc}`);
      const wipeouts = round.results.filter(r => r.status === 'wipeout');
      const struggles = round.results.filter(r => r.status === 'struggle');
      const survivors = round.results.filter(r => r.status === 'survive');
      if (survivors.length > 0) {
        ln(`${survivors.map(r => r.name).join(', ')} ${survivors.length === 1 ? 'powers' : 'power'} through without breaking a sweat.`);
      }
      for (const s of struggles) ln(s.text);
      for (const w of wipeouts) ln(w.text);
      for (const evt of round.events) ln(evt.text);
    }
    const surfWinner = bbb.surfData.winner;
    const allSurf = Object.entries(bbb.surfData.surfScores).sort((a, b) => b[1] - a[1]);
    const lastStanding = allSurf.filter(([n]) => bbb.surfData.balances[n] > 0);
    if (lastStanding.length > 0) {
      ln(`When the dust settles, ${lastStanding.map(([n]) => n).join(' and ')} ${lastStanding.length === 1 ? 'is' : 'are'} still standing on ${lastStanding.length === 1 ? 'their board' : 'their boards'}!`);
    }
    ln(`${surfWinner} takes the surf phase!`);
  }

  // --- BEACH BREAK (always fires between surf and sandcastle) ---
  if (bbb.beachBreakEvents && bbb.beachBreakEvents.length > 0) {
    sec('BEACH BREAK');
    ln('"Take five, people! Chris heads to the snack table while the tribes regroup."');
    for (const evt of bbb.beachBreakEvents) ln(evt.text);
  }

  // --- SANDCASTLE PHASE ---
  if (bbb.sandcastleData) {
    sec('PHASE 2 — CASTLE CONSTRUCTION');
    ln('"Phase two: SANDCASTLE SHOWDOWN! Scavenge materials, build a castle, and pray Chris likes it!"');

    if (bbb.sandcastleData.scavengeEncounters.length > 0) {
      ln('The tribes scatter across the beach, hunting for materials.');
      for (const enc of bbb.sandcastleData.scavengeEncounters) ln(enc.text);
    }

    ln('Build time! The tribes race to construct their masterpieces.');
    for (const evt of bbb.sandcastleData.buildEvents) ln(evt.text);
    const captains = bbb.sandcastleData.captains;
    if (captains) {
      for (const [tribe, cap] of Object.entries(captains)) {
        ln(`${cap} takes charge as ${tribe}'s build captain, directing the design.`);
      }
    }
    const castleWinner = bbb.sandcastleData.winner;
    ln(`Chris inspects the castles... "${castleWinner}'s castle is CLEARLY superior! Point to ${castleWinner}!"`);
  }

  // --- PRE-DANCEOFF DRAMA (only fires on tie) ---
  if (bbb.halftimeEvents && bbb.halftimeEvents.length > 0) {
    sec('HALFTIME — TIEBREAKER TENSION');
    ln('"We\'re tied up! The tension is THICK. One more challenge to settle this!"');
    for (const evt of bbb.halftimeEvents) ln(evt.text);
  }

  // --- DANCE-OFF ---
  if (bbb.danceOff) {
    sec('TIEBREAKER — DANCE-OFF');
    ln('"It\'s TIED! You know what that means — DANCE-OFF! Each tribe picks a champion!"');

    for (const tribe of Object.keys(bbb.danceOff.selections)) {
      const sel = bbb.danceOff.selections[tribe];
      ln(`${tribe}: ${sel.text}`);
    }

    for (const tribe of Object.keys(bbb.danceOff.dancers)) {
      const dancer = bbb.danceOff.dancers[tribe];
      ln(`${dancer} steps onto the dance floor for ${tribe}. The music drops.`);
      const tribeBeats = bbb.danceOff.beats[tribe] || [];
      for (const beat of tribeBeats) ln(beat.text);
      ln(`Final dance score for ${tribe}: ${bbb.danceOff.scores[tribe].toFixed(2)}!`);
    }

    const danceWinner = bbb.danceOff.winner;
    ln(`${bbb.danceOff.dancers[danceWinner]} TAKES IT! ${danceWinner} wins the tiebreaker dance-off!`);
  }

  // --- Closer + score ---
  sec('BEACH BLANKET BOGUS — RESULTS');
  if (bbb.chrisCloser) ln(bbb.chrisCloser);
  const scores = bbb.tribeScores;
  const scoreStr = Object.entries(scores).map(([t, s]) => `${t}: ${s}`).join(' | ');
  ln(`Final score — ${scoreStr}.`);
}

/* ═══════════════════════════════════════════════════════
   VP — Portrait helper
   ═══════════════════════════════════════════════════════ */

function _bbbPortrait(name, size = 40) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.2);" onerror="this.style.display='none'">`;
}

/* ═══════════════════════════════════════════════════════
   VP — Shell (comprehensive CSS for all BBB screens)
   ═══════════════════════════════════════════════════════ */

function _bbbShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Inter:wght@400;600;700;900&display=swap');

/* ── Theme tokens ── */
.bbb-shell{
  --bbb-ivory:#faf3e0;--bbb-sand:#e8d5b7;--bbb-coral:#e85d3a;
  --bbb-burnt:#c4421a;--bbb-teal:#1a7a7a;--bbb-deep-teal:#0d4f4f;
  --bbb-navy:#1b2838;--bbb-gold:#d4a020;--bbb-cream:#fff8e7;
  font-family:'Inter',sans-serif;color:var(--bbb-navy);
  background:linear-gradient(180deg,#ff6b35 0%,#f7931e 12%,#ffd700 26%,#87CEEB 48%,#0d6986 72%,#0a3d5c 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
}

/* ── Film grain overlay ── */
.bbb-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity:.04;pointer-events:none;z-index:5;animation:bbb-grain 0.5s steps(6) infinite;mix-blend-mode:overlay}

/* ── Header ── */
.bbb-header{background:rgba(0,0,0,0.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  padding:16px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:2px solid rgba(255,255,255,0.15);position:relative;z-index:6}
.bbb-title{font-family:'Bowlby One SC',sans-serif;font-size:18px;color:#fff;text-shadow:2px 2px 0 var(--bbb-burnt);letter-spacing:2px}
.bbb-subtitle{font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:3px;text-transform:uppercase}

/* ── Layout: feed + sidebar ── */
.bbb-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.bbb-feed{flex:1;min-width:0}
.bbb-sidebar{width:260px;flex-shrink:0;position:sticky;top:60px;max-height:calc(100vh - 80px);overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;
  background:rgba(0,0,0,0.25);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:12px}

/* ── HUD bar ── */
.bbb-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.bbb-hud-cell{flex:1;background:rgba(0,0,0,0.3);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  border:1px solid rgba(255,255,255,0.08);padding:8px 4px;text-align:center}
.bbb-hud-cell:first-child{border-radius:4px 0 0 4px}.bbb-hud-cell:last-child{border-radius:0 4px 4px 0}
.bbb-hud-val{font-family:'Bowlby One SC',sans-serif;font-size:18px;font-weight:700;color:#fff;text-shadow:0 0 8px currentColor}
.bbb-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-top:2px;text-transform:uppercase}

/* ── Event card ── */
.bbb-ev{background:rgba(0,0,0,0.2);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.08);border-left:3px solid var(--bbb-teal);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;border-radius:3px;
  animation:bbb-fade-up 0.4s ease-out}
.bbb-ev.wipeout{border-left-color:var(--bbb-coral)}
.bbb-ev.positive{border-left-color:var(--bbb-gold)}
.bbb-ev.negative{border-left-color:#e53935}
.bbb-ev.round-header{border-left-color:var(--bbb-deep-teal);background:rgba(13,79,79,0.25)}
.bbb-ev-badge{display:inline-block;font-family:'Bowlby One SC',sans-serif;font-size:7px;letter-spacing:2px;
  padding:2px 8px;border-radius:2px;margin-bottom:4px;text-transform:uppercase;
  background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8)}
.bbb-ev-badge.gold{background:rgba(212,160,32,0.2);color:var(--bbb-gold)}
.bbb-ev-badge.red{background:rgba(232,93,58,0.2);color:var(--bbb-coral)}
.bbb-ev-badge.orange{background:rgba(247,147,30,0.2);color:#f7931e}
.bbb-ev-badge.teal{background:rgba(26,122,122,0.2);color:var(--bbb-teal)}
.bbb-ev-badge.threat-low{background:rgba(26,122,122,0.2);color:#4dd0e1}
.bbb-ev-badge.threat-medium{background:rgba(212,160,32,0.2);color:var(--bbb-gold)}
.bbb-ev-badge.threat-high{background:rgba(232,93,58,0.2);color:var(--bbb-coral)}
.bbb-ev-badge.threat-extreme{background:rgba(183,28,28,0.3);color:#ff5252;animation:bbb-pulse 1.2s ease-in-out infinite}
.bbb-ev-text{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)}
.bbb-ev-port{width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;
  align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.15)}
.bbb-ev-port img{width:44px;height:44px;border-radius:50%;object-fit:cover}

/* ── Surfer card (sidebar) ── */
.bbb-surfer{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:3px;
  border-radius:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);transition:opacity 0.3s}
.bbb-surfer.eliminated{opacity:0.35;filter:grayscale(0.8)}
.bbb-surfer-name{font-size:11px;color:rgba(255,255,255,0.85);font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── Balance bar ── */
.bbb-balance-bar{width:100%;height:6px;background:rgba(0,0,0,0.3);border-radius:3px;overflow:hidden;margin-top:3px}
.bbb-balance-fill{height:100%;border-radius:3px;transition:width 0.4s ease-out;
  box-shadow:0 0 6px currentColor}
.bbb-balance-fill.high{background:var(--bbb-teal);color:var(--bbb-teal)}
.bbb-balance-fill.mid{background:var(--bbb-gold);color:var(--bbb-gold)}
.bbb-balance-fill.low{background:var(--bbb-coral);color:var(--bbb-coral)}

/* ── Wipeout splash card ── */
.bbb-wipeout{background:rgba(232,93,58,0.15);border:1px solid rgba(232,93,58,0.3);border-left:4px solid var(--bbb-coral);
  padding:14px;margin-bottom:6px;border-radius:4px;position:relative;overflow:hidden;animation:bbb-fade-up 0.4s ease-out}
.bbb-wipeout::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;
  background:radial-gradient(circle,rgba(232,93,58,0.15) 0%,transparent 60%);
  animation:bbb-splash 0.8s ease-out;pointer-events:none}
.bbb-wipeout-name{font-family:'Bowlby One SC',sans-serif;font-size:14px;color:var(--bbb-coral);
  letter-spacing:2px;text-shadow:0 0 10px rgba(232,93,58,0.3)}

/* ── Round header ── */
.bbb-round{background:rgba(13,79,79,0.3);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(26,122,122,0.25);padding:10px 14px;display:flex;align-items:center;
  justify-content:space-between;margin-bottom:6px;border-radius:4px;animation:bbb-fade-up 0.4s ease-out}
.bbb-round-name{font-family:'Bowlby One SC',sans-serif;font-size:13px;color:rgba(255,255,255,0.9);letter-spacing:1px}
.bbb-threat{font-family:'Bowlby One SC',sans-serif;font-size:9px;letter-spacing:2px;
  padding:3px 10px;border-radius:12px;text-transform:uppercase}
.bbb-threat.low{background:rgba(77,208,225,0.15);color:#4dd0e1}
.bbb-threat.medium{background:rgba(212,160,32,0.15);color:var(--bbb-gold)}
.bbb-threat.high{background:rgba(232,93,58,0.15);color:var(--bbb-coral);animation:bbb-pulse 2s ease-in-out infinite}
.bbb-threat.extreme{background:rgba(183,28,28,0.25);color:#ff5252;animation:bbb-pulse 0.8s ease-in-out infinite}

/* ── Controls ── */
.bbb-controls{display:flex;gap:8px;justify-content:center;padding:16px 0;position:relative;z-index:6}
.bbb-btn-next{padding:10px 28px;background:linear-gradient(135deg,var(--bbb-teal),var(--bbb-deep-teal));
  color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:'Bowlby One SC',sans-serif;
  font-size:12px;letter-spacing:2px;box-shadow:0 4px 15px rgba(13,79,79,0.4);transition:transform 0.15s,box-shadow 0.15s}
.bbb-btn-next:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(13,79,79,0.5)}
.bbb-btn-all{padding:8px 18px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);
  border:1px solid rgba(255,255,255,0.15);border-radius:6px;cursor:pointer;font-size:11px;
  transition:background 0.15s}
.bbb-btn-all:hover{background:rgba(255,255,255,0.18);color:rgba(255,255,255,0.85)}

/* ── Portrait (circular) ── */
.bbb-portrait{border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.2)}

/* ── Sidebar sections ── */
.bbb-side-sec{font-family:'Bowlby One SC',sans-serif;font-size:8px;letter-spacing:3px;
  color:rgba(255,255,255,0.35);border-bottom:1px solid rgba(255,255,255,0.08);
  padding-bottom:3px;margin:12px 0 6px;text-transform:uppercase}
.bbb-side-tribe{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:2px;
  color:rgba(255,255,255,0.6);margin:8px 0 4px;padding:4px 8px;
  background:rgba(255,255,255,0.05);border-radius:3px}
.bbb-side-score{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;
  margin-bottom:4px;border-radius:4px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06)}
.bbb-side-score-name{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600}
.bbb-side-score-val{font-family:'Bowlby One SC',sans-serif;font-size:14px;color:var(--bbb-gold)}

/* ── Wave layers ── */
.bbb-waves{position:absolute;bottom:0;left:0;right:0;height:80px;overflow:hidden;z-index:2;pointer-events:none}
.bbb-wave{position:absolute;bottom:0;width:200%;height:40px;
  background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.05) 40px,rgba(255,255,255,0.05) 80px);
  border-radius:50% 50% 0 0;opacity:0.6}
.bbb-wave-1{animation:bbb-wave 8s linear infinite;bottom:0;height:35px;background:rgba(13,105,134,0.4)}
.bbb-wave-2{animation:bbb-wave 6s linear infinite reverse;bottom:10px;height:28px;background:rgba(10,61,92,0.35)}
.bbb-wave-3{animation:bbb-wave 10s linear infinite;bottom:18px;height:22px;background:rgba(26,122,122,0.2)}

/* ── Shark fin animation ── */
.bbb-shark{position:absolute;z-index:3;pointer-events:none;font-size:24px;bottom:20px;animation:bbb-shark 12s linear infinite}
.bbb-shark-2{animation-delay:-5s;animation-duration:15s;bottom:35px;font-size:18px}

/* ── Seagull animation ── */
.bbb-seagull{position:absolute;z-index:4;pointer-events:none;font-size:16px;animation:bbb-seagull 9s linear infinite}
.bbb-seagull-2{animation-delay:-3s;animation-duration:11s;font-size:12px}
.bbb-seagull-3{animation-delay:-7s;animation-duration:14s;font-size:14px;top:15%}

/* ── Keyframe animations ── */
@keyframes bbb-wave{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes bbb-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes bbb-fade-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes bbb-shark{0%{left:-60px;opacity:0}8%{opacity:1}85%{opacity:1}100%{left:calc(100% + 60px);opacity:0}}
@keyframes bbb-seagull{0%{right:-40px;top:10%;opacity:0}10%{opacity:1}50%{top:6%}90%{opacity:1}100%{right:calc(100% + 40px);top:12%;opacity:0}}
@keyframes bbb-wobble{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes bbb-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.05)}}
@keyframes bbb-grain{0%{transform:translate(0,0)}20%{transform:translate(-2px,1px)}40%{transform:translate(1px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(2px,-1px)}100%{transform:translate(0,0)}}
@keyframes bbb-splash{0%{transform:scale(0);opacity:0.8}100%{transform:scale(1);opacity:0}}

/* ═══ Sandcastle Screen ═══ */
.bbb-castle-arena{display:flex;gap:24px;justify-content:center;padding:20px 10px;position:relative;z-index:6;flex-wrap:wrap;background:linear-gradient(180deg,#87CEEB 0%,#b0d4e6 30%,#e8d5b7 60%,#d4b896 100%);border-radius:8px;margin:8px 0}
.bbb-castle-col{flex:1;min-width:220px;max-width:360px;text-align:center}
.bbb-castle-tribe-hdr{font-family:'Bowlby One SC',sans-serif;font-size:13px;letter-spacing:2px;
  color:rgba(255,255,255,0.85);margin-bottom:4px}
.bbb-castle-captain{font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:1px;margin-bottom:10px}

/* Material pips */
.bbb-mat-row{display:flex;align-items:center;gap:6px;margin:3px 0;justify-content:center}
.bbb-mat-label{font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase;width:64px;text-align:right}
.bbb-mat-pips{display:flex;gap:3px;align-items:center}
.bbb-mat-pip{width:10px;height:10px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.15)}
.bbb-mat-pip.shell{background:linear-gradient(135deg,#f5e6ca,#e8cfa0);border-color:rgba(232,207,160,0.4)}
.bbb-mat-pip.driftwood{background:linear-gradient(135deg,#a08060,#7a5c3c);border-color:rgba(122,92,60,0.5);border-radius:3px}
.bbb-mat-pip.rock{background:linear-gradient(135deg,#8a8a8a,#5c5c5c);border-color:rgba(140,140,140,0.5);border-radius:2px}
.bbb-mat-pip.empty{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.06)}

/* Castle SVG wrapper */
.bbb-castle-svg-wrap{position:relative;width:100%;height:240px;margin:8px auto}
.bbb-castle-svg-wrap svg{width:100%;height:100%}
.bbb-castle-layer{opacity:1;animation:bbb-fade-up 0.8s ease-out both}
.bbb-castle-layer[data-layer="1"]{animation-delay:0.1s}
.bbb-castle-layer[data-layer="2"]{animation-delay:0.4s}
.bbb-castle-layer[data-layer="3"]{animation-delay:0.7s}
.bbb-castle-layer[data-layer="4"]{animation-delay:1.0s}
.bbb-castle-layer[data-layer="5"]{animation-delay:1.3s}

/* Crumble particles */
.bbb-crumble{position:absolute;width:4px;height:4px;background:var(--bbb-sand);border-radius:50%;opacity:0;
  animation:bbb-crumble 2.5s ease-in infinite}
@keyframes bbb-crumble{0%{opacity:0.7;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--cx,8px),var(--cy,20px))}}

/* Flag flutter */
.bbb-flag{transform-origin:bottom left;animation:bbb-flutter 1.8s ease-in-out infinite alternate}
@keyframes bbb-flutter{0%{transform:skewX(0deg)}50%{transform:skewX(-6deg)}100%{transform:skewX(4deg)}}

/* Castle glow for high quality */
.bbb-castle-glow{filter:drop-shadow(0 0 12px rgba(212,160,32,0.35))}

/* Judge bar */
.bbb-judge-section{position:relative;z-index:6;padding:16px 20px}
.bbb-judge-bar-row{display:flex;align-items:center;gap:10px;margin:6px 0}
.bbb-judge-bar-label{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:1px;
  color:rgba(255,255,255,0.7);width:100px;text-align:right;flex-shrink:0}
.bbb-judge-bar-track{flex:1;height:20px;background:rgba(0,0,0,0.25);border-radius:3px;overflow:hidden;position:relative}
.bbb-judge-bar-fill{height:100%;border-radius:3px;transition:width 0.8s ease-out;display:flex;
  align-items:center;justify-content:flex-end;padding-right:6px;font-family:'Bowlby One SC',sans-serif;
  font-size:9px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.4)}
.bbb-judge-bar-fill.winner{background:linear-gradient(90deg,var(--bbb-gold),#e6b422)}
.bbb-judge-bar-fill.loser{background:linear-gradient(90deg,rgba(255,255,255,0.15),rgba(255,255,255,0.25))}
.bbb-winner-banner{font-family:'Bowlby One SC',sans-serif;font-size:18px;letter-spacing:3px;
  color:var(--bbb-gold);text-shadow:0 0 15px rgba(212,160,32,0.4);text-align:center;margin-top:12px}

/* Sand bg for sandcastle screen */
.bbb-sand-bg{background:linear-gradient(180deg,#87CEEB 0%,#b0e0f0 18%,#f5deb3 45%,#deb887 65%,#c4a265 100%)}
.bbb-sand-bg .bbb-shell{background:transparent}

/* Build stage header */
.bbb-build-stage{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:3px;
  color:rgba(255,255,255,0.4);text-transform:uppercase;text-align:center;margin:14px 0 6px;
  border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:4px}

/* ═══ Halftime Screen ═══ */
.bbb-halftime-bg{background:linear-gradient(180deg,#ff6b35 0%,#e85d3a 15%,#d4a020 35%,#c77dba 60%,#6a4c93 80%,#2d1b4e 100%)}
.bbb-halftime-hdr{font-family:'Bowlby One SC',sans-serif;font-size:28px;color:#fff;
  text-shadow:2px 2px 0 rgba(0,0,0,0.3),0 0 20px rgba(255,165,0,0.4);
  letter-spacing:4px;text-align:center;padding:24px 0 12px;position:relative;z-index:6}
.bbb-halftime-sub{font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:4px;text-transform:uppercase;
  text-align:center;margin-bottom:16px}
.bbb-half-ev{background:rgba(0,0,0,0.25);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.1);border-left:3px solid var(--bbb-gold);
  padding:14px 16px;margin-bottom:6px;display:flex;align-items:flex-start;gap:12px;border-radius:4px;
  animation:bbb-fade-up 0.4s ease-out}
.bbb-half-ev.confrontation{border-left-color:#e53935}
.bbb-half-ev.alliance{border-left-color:var(--bbb-gold)}
.bbb-half-ev.showmance{border-left-color:#e91e9c}
.bbb-half-ev.injury{border-left-color:#ff9800}
.bbb-half-ev.strategy{border-left-color:var(--bbb-teal)}
.bbb-half-ev.taunt{border-left-color:#e53935}
.bbb-half-impact{font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;margin-top:6px;font-style:italic}

/* ═══ Dance-Off Night Scene ═══ */
.bbb-night-bg{background:linear-gradient(180deg,#0a0a2e 0%,#141452 20%,#1b1b6b 40%,#1a1a4a 70%,#0d0d2a 100%)}
.bbb-stars{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;pointer-events:none;
  background-image:radial-gradient(1px 1px at 10% 15%,rgba(255,255,255,0.7),transparent),
    radial-gradient(1px 1px at 25% 8%,rgba(255,255,255,0.5),transparent),
    radial-gradient(1.5px 1.5px at 40% 22%,rgba(255,255,255,0.8),transparent),
    radial-gradient(1px 1px at 55% 5%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1px 1px at 70% 18%,rgba(255,255,255,0.6),transparent),
    radial-gradient(1.5px 1.5px at 85% 12%,rgba(255,255,255,0.7),transparent),
    radial-gradient(1px 1px at 15% 30%,rgba(255,255,255,0.3),transparent),
    radial-gradient(1px 1px at 60% 28%,rgba(255,255,255,0.5),transparent),
    radial-gradient(1.5px 1.5px at 90% 25%,rgba(255,255,255,0.6),transparent),
    radial-gradient(1px 1px at 35% 35%,rgba(255,255,255,0.4),transparent),
    radial-gradient(1px 1px at 78% 32%,rgba(255,255,255,0.5),transparent),
    radial-gradient(1px 1px at 5% 20%,rgba(255,255,255,0.3),transparent);
  animation:bbb-twinkle 4s ease-in-out infinite alternate}
@keyframes bbb-twinkle{0%{opacity:0.7}50%{opacity:1}100%{opacity:0.8}}

/* Tiki torches */
.bbb-tiki-wrap{position:absolute;z-index:3;pointer-events:none}
.bbb-tiki-wrap.left{left:12px;top:80px}
.bbb-tiki-wrap.right{right:12px;top:80px}
.bbb-tiki{width:8px;height:120px;background:linear-gradient(180deg,#5c3a1a,#3a2210);border-radius:2px;margin:0 auto}
.bbb-tiki-flame{width:22px;height:32px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
  background:radial-gradient(ellipse at 50% 80%,#fff7a0 0%,#ffb833 30%,#ff6b00 60%,#cc3300 85%,transparent 100%);
  margin:-8px auto 0;filter:blur(0.5px);animation:bbb-tiki-flicker 1.5s ease-in-out infinite;
  box-shadow:0 0 12px 4px rgba(255,150,0,0.5),0 0 30px 8px rgba(255,100,0,0.25)}
@keyframes bbb-tiki-flicker{
  0%{transform:scaleY(1) scaleX(1);opacity:1;filter:blur(0.5px)}
  25%{transform:scaleY(1.15) scaleX(0.9);opacity:0.9;filter:blur(0.8px)}
  50%{transform:scaleY(0.85) scaleX(1.1);opacity:1;filter:blur(0.5px)}
  75%{transform:scaleY(1.1) scaleX(0.85);opacity:0.85;filter:blur(1px)}
  100%{transform:scaleY(1) scaleX(1);opacity:1;filter:blur(0.5px)}}
.bbb-tiki-flame-sm{width:16px;height:22px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
  background:radial-gradient(ellipse at 50% 80%,#fff7a0 0%,#ffb833 35%,#ff6b00 70%,transparent 100%);
  margin:-4px auto 0;animation:bbb-tiki-flicker 1.8s ease-in-out infinite 0.3s;
  box-shadow:0 0 8px 3px rgba(255,150,0,0.35)}

/* Spotlight sweep */
.bbb-spotlight{position:absolute;z-index:2;pointer-events:none;width:200px;height:600px;
  background:linear-gradient(180deg,rgba(255,220,100,0.08) 0%,transparent 100%);
  transform-origin:top center;animation:bbb-spotlight-sweep 6s ease-in-out infinite;top:-20px}
.bbb-spotlight.left{left:30%}
.bbb-spotlight.right{right:30%;animation-delay:-3s;animation-direction:reverse}
@keyframes bbb-spotlight-sweep{
  0%{transform:rotate(-15deg)}50%{transform:rotate(15deg)}100%{transform:rotate(-15deg)}}

/* Dance-off title */
.bbb-danceoff-title{font-family:'Bowlby One SC',sans-serif;font-size:36px;color:#fff;
  text-shadow:0 0 20px rgba(255,100,0,0.6),2px 2px 0 rgba(0,0,0,0.5);
  letter-spacing:6px;text-align:center;padding:28px 0 8px;position:relative;z-index:6;
  animation:bbb-dance-entrance 0.8s ease-out}
@keyframes bbb-dance-entrance{0%{opacity:0;transform:scale(0.5) translateY(-30px)}
  60%{transform:scale(1.1) translateY(0)}100%{opacity:1;transform:scale(1) translateY(0)}}

/* VS layout */
.bbb-vs-layout{display:flex;align-items:center;justify-content:center;gap:20px;
  padding:16px 20px;position:relative;z-index:6;flex-wrap:wrap}
.bbb-dancer{background:rgba(0,0,0,0.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  border:2px solid rgba(255,255,255,0.12);border-radius:8px;padding:16px 20px;text-align:center;
  min-width:180px;flex:1;max-width:280px;transition:border-color 0.6s,box-shadow 0.6s}
.bbb-dancer.active{border-color:rgba(255,180,50,0.4);box-shadow:0 0 20px rgba(255,150,0,0.2);
  animation:bbb-dancer-pulse 1.2s ease-in-out infinite}
.bbb-dancer.winner{border-color:var(--bbb-gold);box-shadow:0 0 25px rgba(212,160,32,0.4)}
@keyframes bbb-dancer-pulse{0%,100%{box-shadow:0 0 20px rgba(255,150,0,0.2)}
  50%{box-shadow:0 0 30px rgba(255,150,0,0.4)}}
.bbb-dancer-portrait{width:72px;height:72px;border-radius:50%;object-fit:cover;
  border:3px solid rgba(255,255,255,0.2);margin:0 auto 8px}
.bbb-dancer-name{font-family:'Bowlby One SC',sans-serif;font-size:14px;color:#fff;letter-spacing:2px}
.bbb-dancer-tribe{font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;margin-top:2px}
.bbb-dancer-stats{font-size:10px;color:rgba(255,255,255,0.5);margin-top:6px}
.bbb-vs{font-family:'Bowlby One SC',sans-serif;font-size:28px;color:var(--bbb-coral);
  text-shadow:0 0 15px rgba(232,93,58,0.5);letter-spacing:3px;flex-shrink:0}
.bbb-winner-crown{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:2px;
  color:var(--bbb-gold);margin-top:8px;text-shadow:0 0 8px rgba(212,160,32,0.4)}

/* Score tracker */
.bbb-score-tracker{position:relative;z-index:6;padding:12px 20px}
.bbb-score-tracker-label{font-family:'Bowlby One SC',sans-serif;font-size:8px;letter-spacing:3px;
  color:rgba(255,255,255,0.35);text-transform:uppercase;text-align:center;margin-bottom:8px}
.bbb-score-row{display:flex;align-items:center;gap:10px;margin:5px 0}
.bbb-score-name{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:1px;
  color:rgba(255,255,255,0.7);width:90px;text-align:right;flex-shrink:0}
.bbb-score-bar-track{flex:1;height:22px;background:rgba(0,0,0,0.3);border-radius:4px;overflow:hidden;position:relative}
.bbb-score-bar{height:100%;border-radius:4px;transition:width 0.8s ease-out;display:flex;
  align-items:center;justify-content:flex-end;padding-right:8px;font-family:'Bowlby One SC',sans-serif;
  font-size:10px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.5);min-width:0}
.bbb-score-bar.coral{background:linear-gradient(90deg,#e85d3a,#ff7b4f);box-shadow:0 0 8px rgba(232,93,58,0.3)}
.bbb-score-bar.teal{background:linear-gradient(90deg,#1a7a7a,#2aa5a5);box-shadow:0 0 8px rgba(26,122,122,0.3)}
.bbb-score-val{font-family:'Bowlby One SC',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);
  width:50px;text-align:left;flex-shrink:0}

/* Dance beat card */
.bbb-dance-beat{background:rgba(0,0,0,0.25);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.1);border-left:3px solid rgba(255,180,50,0.4);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;border-radius:4px;
  animation:bbb-fade-up 0.4s ease-out;position:relative;z-index:6}
.bbb-dance-beat.good{border-left-color:var(--bbb-gold)}
.bbb-dance-beat.bad{border-left-color:#e53935}
.bbb-dance-beat.neutral{border-left-color:rgba(255,255,255,0.2)}

/* ═══ Results Screen ═══ */
.bbb-results-bg{background:linear-gradient(180deg,#ff6b35 0%,#f7931e 15%,#ffd700 30%,#87CEEB 55%,#0d6986 80%,#0a3d5c 100%)}
.bbb-results-hdr{font-family:'Bowlby One SC',sans-serif;font-size:24px;color:#fff;
  text-shadow:2px 2px 0 rgba(0,0,0,0.3);letter-spacing:4px;text-align:center;
  padding:20px 0 8px;position:relative;z-index:6}
.bbb-phase-row{display:flex;align-items:center;gap:12px;padding:8px 14px;
  background:rgba(0,0,0,0.2);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.08);border-radius:4px;margin-bottom:4px;position:relative;z-index:6}
.bbb-phase-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:16px;flex-shrink:0;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1)}
.bbb-phase-name{font-family:'Bowlby One SC',sans-serif;font-size:11px;letter-spacing:2px;
  color:rgba(255,255,255,0.8);flex:1}
.bbb-phase-winner{font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:1px;padding:3px 10px;
  border-radius:12px;flex-shrink:0}
.bbb-phase-winner.won{background:rgba(212,160,32,0.2);color:var(--bbb-gold)}
.bbb-phase-winner.lost{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.3)}

/* Celebration banner */
.bbb-celebration{text-align:center;padding:20px;position:relative;z-index:6}
.bbb-celebration-tribe{font-family:'Bowlby One SC',sans-serif;font-size:26px;color:var(--bbb-gold);
  text-shadow:0 0 20px rgba(212,160,32,0.4),2px 2px 0 rgba(0,0,0,0.3);letter-spacing:4px;
  animation:bbb-bob 2s ease-in-out infinite}
.bbb-celebration-sub{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;
  text-transform:uppercase;margin-top:6px}
.bbb-losers-text{font-size:12px;color:rgba(255,255,255,0.5);text-align:center;
  padding:10px 20px;position:relative;z-index:6;font-style:italic}

/* Standout callouts */
.bbb-standout{display:flex;align-items:center;gap:10px;padding:10px 14px;
  background:rgba(0,0,0,0.2);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(255,255,255,0.08);border-left:3px solid var(--bbb-gold);
  border-radius:4px;margin-bottom:4px;position:relative;z-index:6;animation:bbb-fade-up 0.4s ease-out}
.bbb-standout-label{font-family:'Bowlby One SC',sans-serif;font-size:8px;letter-spacing:2px;
  color:var(--bbb-gold);text-transform:uppercase}
.bbb-standout-name{font-size:12px;color:rgba(255,255,255,0.9);font-weight:700}
.bbb-standout-desc{font-size:10px;color:rgba(255,255,255,0.5)}

/* Leaderboard */
.bbb-leaderboard{position:relative;z-index:6;padding:0 14px 16px}
.bbb-lb-row{display:flex;align-items:center;gap:8px;padding:6px 10px;
  background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.05);border-radius:3px;margin-bottom:2px}
.bbb-lb-row.top-3{background:rgba(212,160,32,0.1);border-color:rgba(212,160,32,0.15)}
.bbb-lb-rank{font-family:'Bowlby One SC',sans-serif;font-size:12px;color:rgba(255,255,255,0.5);width:24px;text-align:center}
.bbb-lb-row.top-3 .bbb-lb-rank{color:var(--bbb-gold)}
.bbb-lb-name{font-size:11px;color:rgba(255,255,255,0.85);font-weight:600;flex:1;min-width:0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbb-lb-score{font-family:'Bowlby One SC',sans-serif;font-size:11px;color:rgba(255,255,255,0.5)}
.bbb-lb-row.top-3 .bbb-lb-score{color:var(--bbb-gold)}
</style>
<div class="bbb-shell">
  <div class="bbb-header">
    <div>
      <div class="bbb-title">BEACH BLANKET BOGUS</div>
      <div class="bbb-subtitle">Surf &middot; Build &middot; Dance</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;">EPISODE ${ep.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

/* ═══════════════════════════════════════════════════════
   VP — Title Card (animated beach movie poster)
   ═══════════════════════════════════════════════════════ */

export function rpBuildBeachBlanketBogusTitleCard(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return '';

  const tribeNames = Object.keys(bbb.tribeScores || {});
  const allPlayers = gs.tribes ? gs.tribes.flatMap(t => t.members) : [];
  const phaseList = (bbb.phases || []).map(p => {
    if (p === 'surf') return 'Surf';
    if (p === 'sandcastle') return 'Sandcastle';
    if (p === 'halftime') return 'Halftime';
    if (p === 'danceOff') return 'Dance-Off';
    return p;
  }).join(' / ');

  return _bbbShell(`
    <!-- Animated wave layers -->
    <div class="bbb-waves">
      <div class="bbb-wave bbb-wave-3"></div>
      <div class="bbb-wave bbb-wave-2"></div>
      <div class="bbb-wave bbb-wave-1"></div>
    </div>
    <!-- Shark fins -->
    <div class="bbb-shark">&#x1F9C8;</div>
    <div class="bbb-shark bbb-shark-2">&#x1F9C8;</div>
    <!-- Seagulls -->
    <div class="bbb-seagull" style="top:8%">&#x1F426;</div>
    <div class="bbb-seagull bbb-seagull-2" style="top:12%">&#x1F426;</div>

    <div style="text-align:center;padding:50px 20px 80px;position:relative;z-index:6;">
      <!-- Presenter line -->
      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-bottom:12px;">Chris McLean Presents</div>

      <!-- Main title -->
      <div style="font-family:'Bowlby One SC',sans-serif;font-size:42px;color:#fff;text-shadow:3px 3px 0 var(--bbb-burnt),6px 6px 0 rgba(0,0,0,0.15);letter-spacing:4px;line-height:1.1;margin-bottom:6px;animation:bbb-bob 3s ease-in-out infinite;">BEACH BLANKET<br>BOGUS</div>

      <!-- Tagline -->
      <div style="font-family:'Bowlby One SC',sans-serif;font-size:14px;letter-spacing:6px;color:var(--bbb-gold);text-shadow:1px 1px 0 rgba(0,0,0,0.3);margin-bottom:20px;">SURF &middot; BUILD &middot; DANCE</div>

      <!-- Phase breakdown -->
      <div style="display:inline-block;background:rgba(0,0,0,0.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:14px 24px;margin-bottom:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:8px;">Today's Phases</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.9);font-weight:700;">${phaseList || 'Surf / Sandcastle'}</div>
      </div>

      <!-- Chris opener -->
      <div style="font-size:13px;color:rgba(255,255,255,0.75);line-height:1.8;max-width:560px;margin:0 auto 24px;font-style:italic;">${bbb.chrisOpener}</div>

      <!-- Footer stats -->
      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(255,255,255,0.5);flex-wrap:wrap;">
        <span>&#x1F3C4; ${allPlayers.length} Surfers</span>
        <span>&#x1F9C8; 5 Hazard Rounds</span>
        ${tribeNames.map(t => `<span>&#x1F6A9; ${t}</span>`).join('')}
      </div>

      <!-- Sound toggle -->
      <div style="margin-top:20px;">
        <button onclick="window._bbbMuted=!window._bbbMuted;this.textContent=window._bbbMuted?'&#x1F50A; Turn Sound On':'&#x1F507; Turn Sound Off';if(window._bbbMuted){if(window._bbbAmbientStop)window._bbbAmbientStop();}else{if(window._bbbAmbientStart)window._bbbAmbientStart('waves');}" style="padding:6px 16px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:4px;cursor:pointer;font-size:11px;">&#x1F507; Turn Sound Off</button>
      </div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   VP — Surf Phase (click-to-reveal)
   ═══════════════════════════════════════════════════════ */

export function rpBuildBeachBlanketBogusSurf(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb || !bbb.surfData) return '';
  const surf = bbb.surfData;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_bbbSurf';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };

  const tribeMembers = gs.tribes ? gs.tribes.map(t => ({ name: t.name, members: [...t.members] })) : [];
  const allSurfers = tribeMembers.flatMap(t => t.members);

  const steps = [];

  // Live state tracking for sidebar snapshots
  const liveState = {
    balances: {},
    activeSurfers: [...allSurfers],
    wipedOut: [],
    tribeScores: {},
    roundNum: 0,
    currentHazard: '',
    threatLevel: '',
  };
  allSurfers.forEach(n => { liveState.balances[n] = 100; });
  tribeMembers.forEach(t => { liveState.tribeScores[t.name] = 0; });

  function snap() {
    return JSON.stringify({
      balances: { ...liveState.balances },
      activeSurfers: [...liveState.activeSurfers],
      wipedOut: [...liveState.wipedOut],
      tribeScores: { ...liveState.tribeScores },
      roundNum: liveState.roundNum,
      currentHazard: liveState.currentHazard,
      threatLevel: liveState.threatLevel,
    });
  }

  function pushStep(obj) {
    steps.push({ ...obj, stateJson: snap() });
  }

  // Opening step
  pushStep({ html: `<div class="bbb-ev round-header">
    <div class="bbb-ev-port" style="font-size:22px;border-color:rgba(26,122,122,0.3);">&#x1F3AC;</div>
    <div style="flex:1"><div class="bbb-ev-badge teal">SURF PHASE</div>
    <div class="bbb-ev-text">"First up: EXTREME SURFING! Last one standing wins the point!"</div></div>
  </div>` });

  // Process each round
  for (let ri = 0; ri < surf.rounds.length; ri++) {
    const round = surf.rounds[ri];
    liveState.roundNum = ri + 1;
    liveState.currentHazard = round.name;
    liveState.threatLevel = round.threat;

    const threatCls = round.threat === 'LOW' ? 'low' : round.threat === 'MEDIUM' ? 'medium' :
      round.threat === 'HIGH' ? 'high' : 'extreme';

    // Round header step
    pushStep({ sfx: round.id === 'seagull-swarm' ? 'seagull' : null, html: `<div class="bbb-round">
      <div>
        <div class="bbb-round-name">Round ${ri + 1}: ${round.name}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:4px;max-width:500px;">${round.desc}</div>
      </div>
      <div class="bbb-threat ${threatCls}">${round.threat}</div>
    </div>` });

    // Per-surfer results
    const wipeouts = round.results.filter(r => r.status === 'wipeout');
    const struggles = round.results.filter(r => r.status === 'struggle');
    const survivors = round.results.filter(r => r.status === 'survive');

    // Update live state balances from round results
    for (const r of round.results) {
      liveState.balances[r.name] = r.balance;
      if (r.status === 'wipeout') {
        liveState.activeSurfers = liveState.activeSurfers.filter(n => n !== r.name);
        liveState.wipedOut.push(r.name);
      }
    }

    // Per-tribe surfer results — grouped by tribe, each surfer gets individual narrative
    for (const tribe of tribeMembers) {
      const tribeResults = round.results.filter(r => tribe.members.includes(r.name));
      if (!tribeResults.length) continue;
      const tribeCards = tribeResults.map(r => {
        const balPct = Math.round(r.balance);
        const balCls = balPct > 50 ? 'high' : balPct > 25 ? 'mid' : 'low';
        const statusBadge = r.status === 'wipeout' ? `<span style="color:#e85d3a;font-weight:700;font-size:9px;letter-spacing:1px;">WIPEOUT</span>`
          : r.status === 'struggle' ? `<span style="color:#d4a020;font-weight:700;font-size:9px;letter-spacing:1px;">STRUGGLING</span>`
          : `<span style="color:#4ade80;font-weight:700;font-size:9px;letter-spacing:1px;">STEADY</span>`;
        return `<div style="display:flex;align-items:flex-start;gap:8px;margin:6px 0;${r.status === 'wipeout' ? 'opacity:0.5;' : ''}">
          ${_bbbPortrait(r.name, 32)}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span style="font-size:12px;color:rgba(255,255,255,0.9);font-weight:600;">${r.name}</span>
              ${statusBadge}
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.55);line-height:1.4;margin-bottom:4px;">${r.text}</div>
            ${r.status !== 'wipeout' ? `<div style="display:flex;align-items:center;gap:6px;">
              <div class="bbb-balance-bar" style="flex:1"><div class="bbb-balance-fill ${balCls}" style="width:${balPct}%"></div></div>
              <span style="font-size:9px;color:rgba(255,255,255,0.4);">${balPct}%</span>
            </div>` : ''}
          </div>
        </div>`;
      }).join('');
      const tribeWipeouts = tribeResults.filter(r => r.status === 'wipeout');
      const sfx = tribeWipeouts.length > 0 ? 'splash' : undefined;
      pushStep({ sfx, html: `<div class="bbb-ev" style="border-left-color:${tribe === tribeMembers[0] ? 'var(--bbb-coral)' : tribe === tribeMembers[1] ? 'var(--bbb-teal)' : 'var(--bbb-gold)'};">
        <div style="flex:1">
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;">${tribe.name}</div>
          ${tribeCards}
        </div>
      </div>` });
    }

    // Mid-surf events
    for (const evt of round.events) {
      const evtType = evt.eventId === 'clutch-save' || evt.eventId === 'encouraging-shout' || evt.eventId === 'shield-move' ? 'positive' :
        evt.eventId === 'trash-talk' || evt.eventId === 'sabotage-splash' || evt.eventId === 'taunt-after-wipeout' ? 'negative' : '';
      const badgeCls = evt.badgeClass || '';

      // Apply balance effects to live state
      if (evt.balanceBoost && evt.surfer && liveState.balances[evt.surfer] !== undefined) {
        liveState.balances[evt.surfer] = Math.min(100, liveState.balances[evt.surfer] + evt.balanceBoost);
      }
      if (evt.balanceCost && evt.savior && liveState.balances[evt.savior] !== undefined) {
        liveState.balances[evt.savior] = Math.max(0, liveState.balances[evt.savior] - evt.balanceCost);
      }
      if (evt.balanceDrain && evt.target && liveState.balances[evt.target] !== undefined) {
        liveState.balances[evt.target] = Math.max(0, liveState.balances[evt.target] - evt.balanceDrain);
      }
      if (evt.balanceLoss && evt.victim && liveState.balances[evt.victim] !== undefined) {
        liveState.balances[evt.victim] = Math.max(0, liveState.balances[evt.victim] - evt.balanceLoss);
      }
      // If any player's balance hit 0 from an event, move them to wipedOut
      for (const pName of [...liveState.activeSurfers]) {
        if (liveState.balances[pName] <= 0 && !liveState.wipedOut.includes(pName)) {
          liveState.activeSurfers = liveState.activeSurfers.filter(n => n !== pName);
          liveState.wipedOut.push(pName);
        }
      }

      const mainPlayer = evt.actor || evt.hero || evt.surfer || evt.taunter || evt.splasher || evt.savior || evt.victim || '';
      pushStep({ html: `<div class="bbb-ev ${evtType}">
        ${mainPlayer ? `<div class="bbb-ev-port">${_bbbPortrait(mainPlayer, 44)}</div>` : ''}
        <div style="flex:1"><div class="bbb-ev-badge ${badgeCls}">${evt.badge || evt.eventId}</div>
        <div class="bbb-ev-text">${evt.text}</div></div>
      </div>` });
    }
  }

  // Calculate final tribe averages for display
  const finalTribeAvgs = {};
  for (const t of tribeMembers) {
    const total = t.members.reduce((sum, m) => sum + (surf.surfScores[m] || 0), 0);
    finalTribeAvgs[t.name] = (total / t.members.length).toFixed(1);
  }
  liveState.tribeScores = { ...finalTribeAvgs };

  // Final result step
  const tribeScoreCards = tribeMembers.map(t => {
    const avg = finalTribeAvgs[t.name];
    const isWinner = t.name === surf.winner;
    const color = isWinner ? 'var(--bbb-gold)' : 'rgba(255,255,255,0.5)';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:4px;border:1px solid ${isWinner ? 'rgba(212,160,32,0.3)' : 'rgba(255,255,255,0.06)'};">
      <span style="font-family:'Bowlby One SC',sans-serif;font-size:12px;color:${color};letter-spacing:1px;">${t.name.toUpperCase()}</span>
      <span style="font-family:'Bowlby One SC',sans-serif;font-size:16px;color:${color};">${avg}</span>
    </div>`;
  }).join('');

  pushStep({ html: `<div class="bbb-ev round-header">
    <div style="flex:1;text-align:center;">
      <div class="bbb-ev-badge gold">SURF RESULTS</div>
      <div style="font-family:'Bowlby One SC',sans-serif;font-size:16px;color:var(--bbb-gold);margin:8px 0;">${surf.winner} WINS THE SURF PHASE!</div>
      <div style="display:flex;gap:8px;margin-top:8px;">${tribeScoreCards}</div>
    </div>
  </div>` });

  // Store step states on bbb for the reveal function
  bbb._surfStepStates = steps.map(s => s.stateJson);
  if (!window._bbbCache) window._bbbCache = {};
  window._bbbCache[stateKey] = { stepStates: bbb._surfStepStates, tribeMembers };

  const state = _tvState[stateKey];

  // Build initial sidebar state
  const initialState = {
    balances: {},
    activeSurfers: [...allSurfers],
    wipedOut: [],
    tribeScores: {},
    roundNum: 0,
    currentHazard: 'Waiting...',
    threatLevel: '',
  };
  allSurfers.forEach(n => { initialState.balances[n] = 100; });
  tribeMembers.forEach(t => { initialState.tribeScores[t.name] = '0.0'; });

  const currentState = state.idx >= 0 && bbb._surfStepStates[state.idx]
    ? JSON.parse(bbb._surfStepStates[state.idx]) : initialState;
  const sidebarHtml = _bbbSurfSidebarFromState(currentState, tribeMembers);

  // HUD values
  const hudRound = currentState.roundNum || 0;
  const hudActive = currentState.activeSurfers.length;
  const hudThreat = currentState.threatLevel || '--';
  const hudThreatCls = hudThreat === 'LOW' ? 'color:#4dd0e1' : hudThreat === 'MEDIUM' ? 'color:var(--bbb-gold)' :
    hudThreat === 'HIGH' ? 'color:var(--bbb-coral)' : hudThreat === 'EXTREME' ? 'color:#ff5252' : 'color:rgba(255,255,255,0.4)';

  // Build feed
  let feedHtml = `<div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);">SURF FEED</div>`;
  feedHtml += `<div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:8px;">CLICK TO ADVANCE</div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    feedHtml += `<div id="bbb-step-${stateKey}-${i}" data-state-idx="${i}"${step.sfx ? ` data-sfx="${step.sfx}"` : ''} style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  feedHtml += `<div id="bbb-controls-${stateKey}" class="bbb-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="bbb-btn-${stateKey}" class="bbb-btn-next" onclick="window.beachBogusRevealNext('${stateKey}', ${steps.length})">NEXT &#x25B6; (${state.idx + 2}/${steps.length})</button>
    <button class="bbb-btn-all" onclick="window.beachBogusRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  // Environmental animations per hazard
  const hazardAnims = (currentState.currentHazard || '').toLowerCase().includes('shark')
    ? `<div class="bbb-shark">&#x1F9C8;</div><div class="bbb-shark bbb-shark-2">&#x1F9C8;</div>`
    : (currentState.currentHazard || '').toLowerCase().includes('seagull')
    ? `<div class="bbb-seagull" style="top:8%">&#x1F426;</div><div class="bbb-seagull bbb-seagull-2" style="top:14%">&#x1F426;</div><div class="bbb-seagull bbb-seagull-3">&#x1F426;</div>`
    : '';

  return _bbbShell(`
    ${hazardAnims}
    <div class="bbb-waves">
      <div class="bbb-wave bbb-wave-3"></div>
      <div class="bbb-wave bbb-wave-2"></div>
      <div class="bbb-wave bbb-wave-1"></div>
    </div>
    <div class="bbb-hud">
      <div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:var(--bbb-teal)" id="bbb-hud-round-${stateKey}">R${hudRound}</div><div class="bbb-hud-lbl">ROUND</div></div>
      <div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:#fff" id="bbb-hud-active-${stateKey}">${hudActive}</div><div class="bbb-hud-lbl">SURFERS</div></div>
      <div class="bbb-hud-cell"><div class="bbb-hud-val" style="${hudThreatCls}" id="bbb-hud-threat-${stateKey}">${hudThreat || '--'}</div><div class="bbb-hud-lbl">HAZARD</div></div>
      ${tribeMembers.map(t => {
        const score = currentState.tribeScores[t.name] || '0.0';
        return `<div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:var(--bbb-gold)" id="bbb-hud-tribe-${stateKey}-${t.name}">${score}</div><div class="bbb-hud-lbl">${t.name.toUpperCase()}</div></div>`;
      }).join('')}
    </div>
    <div class="bbb-layout">
      <div class="bbb-feed">${feedHtml}</div>
      <div class="bbb-sidebar" id="bbb-sidebar-${stateKey}">${sidebarHtml}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   VP — Surf sidebar builder (from state snapshot)
   ═══════════════════════════════════════════════════════ */

function _bbbSurfSidebarFromState(state, tribeMembers) {
  let html = '';

  // Active surfers by tribe
  html += `<div class="bbb-side-sec">ACTIVE SURFERS</div>`;
  for (const t of tribeMembers) {
    const tribeActive = t.members.filter(n => state.activeSurfers.includes(n));
    if (tribeActive.length === 0 && !t.members.some(n => state.wipedOut.includes(n))) continue;
    html += `<div class="bbb-side-tribe">${t.name.toUpperCase()}</div>`;
    for (const name of t.members) {
      const isActive = state.activeSurfers.includes(name);
      const bal = Math.round(state.balances[name] || 0);
      const balCls = bal > 50 ? 'high' : bal > 25 ? 'mid' : 'low';
      html += `<div class="bbb-surfer${isActive ? '' : ' eliminated'}">
        ${_bbbPortrait(name, 24)}
        <div style="flex:1;min-width:0;">
          <div class="bbb-surfer-name">${name}</div>
          ${isActive ? `<div class="bbb-balance-bar"><div class="bbb-balance-fill ${balCls}" style="width:${bal}%"></div></div>` : `<div style="font-size:8px;color:rgba(232,93,58,0.7);letter-spacing:1px;">WIPED OUT</div>`}
        </div>
        ${isActive ? `<div style="font-size:9px;color:rgba(255,255,255,0.4);">${bal}%</div>` : ''}
      </div>`;
    }
  }

  // Wiped out list
  if (state.wipedOut.length > 0) {
    html += `<div class="bbb-side-sec" style="color:rgba(232,93,58,0.4);">WIPED OUT (${state.wipedOut.length})</div>`;
    for (const name of state.wipedOut) {
      html += `<div class="bbb-surfer eliminated">
        ${_bbbPortrait(name, 20)}
        <div class="bbb-surfer-name">${name}</div>
      </div>`;
    }
  }

  // Tribe scores
  html += `<div class="bbb-side-sec">TRIBE AVERAGES</div>`;
  for (const t of tribeMembers) {
    const score = state.tribeScores[t.name] || '0.0';
    html += `<div class="bbb-side-score">
      <div class="bbb-side-score-name">${t.name}</div>
      <div class="bbb-side-score-val">${score}</div>
    </div>`;
  }

  // Current hazard
  if (state.currentHazard) {
    html += `<div class="bbb-side-sec">CURRENT HAZARD</div>`;
    const threatCls = state.threatLevel === 'LOW' ? 'low' : state.threatLevel === 'MEDIUM' ? 'medium' :
      state.threatLevel === 'HIGH' ? 'high' : state.threatLevel === 'EXTREME' ? 'extreme' : '';
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;">
      <span style="font-size:13px;color:rgba(255,255,255,0.8);">${state.currentHazard}</span>
      ${threatCls ? `<span class="bbb-threat ${threatCls}">${state.threatLevel}</span>` : ''}
    </div>`;
  }

  return html;
}

/* ═══════════════════════════════════════════════════════
   VP — Update sidebar + HUD from step state
   ═══════════════════════════════════════════════════════ */

function _bbbUpdateSidebar(stateKey, stepIdx) {
  // Try window cache first (set during rpBuild), then fall back to episodeHistory
  const cache = window._bbbCache?.[stateKey];
  let stepStates = cache?.stepStates;
  let tribeMembers = cache?.tribeMembers;

  if (!stepStates) {
    const epHistory = gs.episodeHistory || [];
    for (const ep of epHistory) {
      if (ep.beachBlanketBogus && String(ep.num || 0) + '_bbbSurf' === stateKey) {
        stepStates = ep.beachBlanketBogus._surfStepStates;
        break;
      }
    }
  }
  if (!stepStates || !stepStates[stepIdx]) return;
  if (!tribeMembers) tribeMembers = gs.tribes ? gs.tribes.map(t => ({ name: t.name, members: [...t.members] })) : [];

  const state = JSON.parse(stepStates[stepIdx]);

  // Update sidebar
  const sidebar = document.getElementById(`bbb-sidebar-${stateKey}`);
  if (sidebar) sidebar.innerHTML = _bbbSurfSidebarFromState(state, tribeMembers);

  // Update HUD
  const hudRound = document.getElementById(`bbb-hud-round-${stateKey}`);
  const hudActive = document.getElementById(`bbb-hud-active-${stateKey}`);
  const hudThreat = document.getElementById(`bbb-hud-threat-${stateKey}`);
  if (hudRound) hudRound.textContent = `R${state.roundNum || 0}`;
  if (hudActive) hudActive.textContent = state.activeSurfers.length;
  if (hudThreat) {
    hudThreat.textContent = state.threatLevel || '--';
    const tCls = state.threatLevel === 'LOW' ? '#4dd0e1' : state.threatLevel === 'MEDIUM' ? 'var(--bbb-gold)' :
      state.threatLevel === 'HIGH' ? 'var(--bbb-coral)' : state.threatLevel === 'EXTREME' ? '#ff5252' : 'rgba(255,255,255,0.4)';
    hudThreat.style.color = tCls;
  }

  // Update tribe score HUD cells
  for (const t of tribeMembers) {
    const hudTribe = document.getElementById(`bbb-hud-tribe-${stateKey}-${t.name}`);
    if (hudTribe) hudTribe.textContent = state.tribeScores[t.name] || '0.0';
  }
}

function _bbbUpdateDanceSidebar(stateKey, stepIdx) {
  const cache = window._bbbCache?.[stateKey];
  if (!cache?.danceStepScores) return;
  const scores = cache.danceStepScores[stepIdx];
  if (!scores) return;
  const isFinal = !!scores._winner;
  for (const tName of cache.tribeNames) {
    const el = document.getElementById(`bbb-dance-score-${stateKey}-${tName}`);
    if (el) {
      const sc = scores[tName];
      if (sc !== undefined) {
        el.textContent = sc.toFixed(2);
        el.style.color = isFinal && tName === scores._winner ? 'var(--bbb-gold)' : 'rgba(255,255,255,0.85)';
      }
    }
  }
  const resultEl = document.getElementById(`bbb-dance-result-${stateKey}`);
  if (resultEl && isFinal) {
    const winDancer = cache.dancers[scores._winner];
    resultEl.innerHTML = `<span style="color:var(--bbb-gold);font-weight:700;">${winDancer} wins!</span> ${scores._winner} takes the point!`;
  }
}

/* ═══════════════════════════════════════════════════════
   VP — Reveal handlers
   ═══════════════════════════════════════════════════════ */

export function beachBogusRevealNext(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const el = document.getElementById(`bbb-step-${stateKey}-${state.idx}`);
  if (el) {
    el.style.display = '';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Play sound based on data-sfx attribute
    if (!window._bbbMuted) {
      const sfx = el.dataset.sfx;
      if (sfx === 'splash') _bbbPlaySplash();
      else if (sfx === 'seagull') _bbbPlaySeagull();
      else if (sfx === 'sand') _bbbPlaySandCrumble();
      else if (sfx === 'beat') _bbbPlayBeatDrop();
    }
  }
  // Update button text
  const btn = document.getElementById(`bbb-btn-${stateKey}`);
  if (btn) btn.textContent = `NEXT \u25B6 (${state.idx + 2}/${totalSteps})`;
  if (state.idx >= totalSteps - 1) {
    const ctrl = document.getElementById(`bbb-controls-${stateKey}`);
    if (ctrl) ctrl.style.display = 'none';
  }
  // Update sidebar + HUD
  if (stateKey.includes('Dance')) {
    _bbbUpdateDanceSidebar(stateKey, state.idx);
  } else {
    _bbbUpdateSidebar(stateKey, state.idx);
  }
}

export function beachBogusRevealAll(stateKey, totalSteps) {
  const _tvState = window._tvState || (window._tvState = {});
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  _tvState[stateKey].idx = totalSteps - 1;
  for (let i = 0; i < totalSteps; i++) {
    const el = document.getElementById(`bbb-step-${stateKey}-${i}`);
    if (el) el.style.display = '';
  }
  const ctrl = document.getElementById(`bbb-controls-${stateKey}`);
  if (ctrl) ctrl.style.display = 'none';
  if (stateKey.includes('Dance')) {
    _bbbUpdateDanceSidebar(stateKey, totalSteps - 1);
  } else {
    _bbbUpdateSidebar(stateKey, totalSteps - 1);
  }
}

/* ═══════════════════════════════════════════════════════
   VP — Sandcastle Phase (click-to-reveal)
   ═══════════════════════════════════════════════════════ */

function _castleSVG(tribeName, score, allScores, quality) {
  // quality: 'low' | 'mid' | 'high'
  const W = 280, H = 220;

  // Color palettes per quality tier
  const palettes = {
    low:  { base: '#a09080', wall: '#8a7a6a', tower: '#7a6a5a', accent: '#6a5a4a', door: '#5a4a3a', window: '#4a3a2a', crack: '#3a2a1a', flag: '#665544' },
    mid:  { base: '#d4b896', wall: '#c4a87a', tower: '#b89870', accent: '#a88860', door: '#6a4e3a', window: '#5a3e2a', crack: 'none', flag: '#e85d3a' },
    high: { base: '#e8d0a0', wall: '#dcc088', tower: '#d4b878', accent: '#c8a860', door: '#5a3a2a', window: '#4a2a1a', crack: 'none', flag: '#e85d3a' },
  };
  const p = palettes[quality];

  // Glow class for high quality
  const wrapClass = quality === 'high' ? 'bbb-castle-glow' : '';

  let svg = `<div class="${wrapClass}"><svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">`;

  // Defs: gradient for golden sand, shadow filter
  svg += `<defs>`;
  if (quality === 'high') {
    svg += `<linearGradient id="gld-${tribeName}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f0d890"/><stop offset="100%" stop-color="#c8a050"/>
    </linearGradient>`;
    svg += `<filter id="glw-${tribeName}"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }
  svg += `</defs>`;

  // ── Layer 1: Foundation ──
  const foundY = 180, foundH = 30;
  svg += `<g class="bbb-castle-layer" data-layer="1">`;
  svg += `<rect x="30" y="${foundY}" width="220" height="${foundH}" rx="4" fill="${p.base}" stroke="${p.wall}" stroke-width="1"/>`;
  // Sand texture lines
  for (let i = 0; i < 5; i++) {
    const lx = 45 + i * 42;
    svg += `<line x1="${lx}" y1="${foundY + 8}" x2="${lx + 20}" y2="${foundY + 8}" stroke="${p.accent}" stroke-width="0.5" opacity="0.5"/>`;
  }
  svg += `</g>`;

  // ── Layer 2: Walls ──
  const wallY = quality === 'low' ? 140 : 120, wallH = foundY - wallY;
  svg += `<g class="bbb-castle-layer" data-layer="2">`;
  svg += `<rect x="60" y="${wallY}" width="160" height="${wallH}" rx="3" fill="${p.wall}" stroke="${p.accent}" stroke-width="0.8"/>`;
  // Battlements on top of wall
  const bCount = 7;
  for (let i = 0; i < bCount; i++) {
    const bx = 64 + i * 22;
    svg += `<rect x="${bx}" y="${wallY - 8}" width="14" height="10" rx="1" fill="${p.wall}" stroke="${p.accent}" stroke-width="0.5"/>`;
  }
  // Cracks for low quality
  if (quality === 'low') {
    svg += `<line x1="100" y1="${wallY + 10}" x2="120" y2="${wallY + 40}" stroke="${p.crack}" stroke-width="1.2" opacity="0.6"/>`;
    svg += `<line x1="118" y1="${wallY + 30}" x2="130" y2="${wallY + 25}" stroke="${p.crack}" stroke-width="0.8" opacity="0.5"/>`;
    svg += `<line x1="170" y1="${wallY + 5}" x2="160" y2="${wallY + 35}" stroke="${p.crack}" stroke-width="1" opacity="0.55"/>`;
    svg += `<line x1="162" y1="${wallY + 28}" x2="175" y2="${wallY + 32}" stroke="${p.crack}" stroke-width="0.7" opacity="0.45"/>`;
  }
  svg += `</g>`;

  // ── Layer 3: Towers ──
  svg += `<g class="bbb-castle-layer" data-layer="3">`;
  const towers = quality === 'high' ? [
    { x: 40, w: 40, h: 90, pointed: true },
    { x: 120, w: 36, h: 105, pointed: true },  // central tall
    { x: 200, w: 40, h: 90, pointed: true },
  ] : quality === 'mid' ? [
    { x: 48, w: 36, h: 70, pointed: false },
    { x: 196, w: 36, h: 70, pointed: false },
  ] : [
    { x: 48, w: 34, h: 50, pointed: false, tilt: -5 },
    { x: 198, w: 34, h: 40, pointed: false, tilt: 8 }, // collapsed shorter + tilted
  ];

  for (const t of towers) {
    const ty = foundY - t.h;
    const tiltAttr = t.tilt ? ` transform="rotate(${t.tilt} ${t.x + t.w / 2} ${foundY})"` : '';
    svg += `<g${tiltAttr}>`;
    // Tower body — rounded rectangle (cylindrical look)
    svg += `<rect x="${t.x}" y="${ty}" width="${t.w}" height="${t.h}" rx="${t.w * 0.15}" fill="${p.tower}" stroke="${p.accent}" stroke-width="0.8"/>`;
    // Tower top
    if (t.pointed && quality === 'high') {
      // Pointed conical roof
      const cx = t.x + t.w / 2;
      svg += `<polygon points="${t.x - 2},${ty} ${cx},${ty - 22} ${t.x + t.w + 2},${ty}" fill="${p.accent}" stroke="${p.door}" stroke-width="0.5"/>`;
    } else {
      // Flat battlements on tower
      const bw = t.w / 3;
      for (let b = 0; b < 3; b++) {
        svg += `<rect x="${t.x + b * bw + 1}" y="${ty - 6}" width="${bw - 2}" height="7" rx="1" fill="${p.tower}" stroke="${p.accent}" stroke-width="0.4"/>`;
      }
    }
    // Tower window (slit)
    if (quality !== 'low' || !t.tilt) {
      const wx = t.x + t.w / 2 - 3;
      const wy = ty + t.h * 0.35;
      svg += `<rect x="${wx}" y="${wy}" width="6" height="14" rx="3" fill="${p.window}" opacity="0.7"/>`;
    }
    svg += `</g>`;
  }
  svg += `</g>`;

  // ── Layer 4: Details — arch doorway, windows ──
  if (quality !== 'low') {
    svg += `<g class="bbb-castle-layer" data-layer="4">`;
    // Arched doorway (center of wall)
    const doorCx = 140, doorW = 22, doorH = 32;
    const doorY = foundY - doorH;
    svg += `<path d="M${doorCx - doorW / 2},${foundY} L${doorCx - doorW / 2},${doorY + 10} Q${doorCx - doorW / 2},${doorY} ${doorCx},${doorY} Q${doorCx + doorW / 2},${doorY} ${doorCx + doorW / 2},${doorY + 10} L${doorCx + doorW / 2},${foundY}" fill="${p.door}" stroke="${p.accent}" stroke-width="0.6"/>`;
    // Wall windows (rectangular with arched top)
    const windowPositions = quality === 'high' ? [95, 115, 165, 185] : [100, 180];
    for (const wx of windowPositions) {
      const wy = wallY + 20;
      svg += `<rect x="${wx - 4}" y="${wy}" width="8" height="12" rx="4" fill="${p.window}" opacity="0.65"/>`;
    }
    svg += `</g>`;
  }

  // ── Layer 5: Decorations — flags, shell patterns, glow ──
  if (quality === 'mid' || quality === 'high') {
    svg += `<g class="bbb-castle-layer" data-layer="5">`;
    // Flags on towers
    const flagTowers = quality === 'high' ? towers : [towers[0]];
    for (const t of flagTowers) {
      const fx = t.x + t.w / 2;
      const fy = t.pointed ? (foundY - t.h - 22) : (foundY - t.h - 6);
      const poleTop = fy - 18;
      svg += `<line x1="${fx}" y1="${fy}" x2="${fx}" y2="${poleTop}" stroke="${p.accent}" stroke-width="1.2"/>`;
      svg += `<g class="bbb-flag"><polygon points="${fx},${poleTop} ${fx + 14},${poleTop + 5} ${fx},${poleTop + 10}" fill="${p.flag}" opacity="0.9"/></g>`;
    }
    // Shell decorations on walls (high only)
    if (quality === 'high') {
      const shellPositions = [80, 108, 140, 172, 200];
      for (const sx of shellPositions) {
        const sy = wallY + (foundY - wallY) * 0.6;
        svg += `<circle cx="${sx}" cy="${sy}" r="3.5" fill="${p.base}" stroke="rgba(255,255,255,0.3)" stroke-width="0.6" opacity="0.8"/>`;
        svg += `<path d="M${sx - 2.5},${sy} Q${sx},${sy - 3} ${sx + 2.5},${sy}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>`;
      }
      // Golden glow overlay
      svg += `<rect x="55" y="${wallY - 10}" width="170" height="${foundY - wallY + 40}" rx="6" fill="url(#gld-${tribeName})" opacity="0.08" filter="url(#glw-${tribeName})"/>`;
    }
    svg += `</g>`;
  }

  // Crumble particles for low quality
  if (quality === 'low') {
    svg += `<g class="bbb-castle-layer" data-layer="2">`;
    for (let i = 0; i < 6; i++) {
      const px = 70 + Math.random() * 140;
      const py = wallY + Math.random() * 20;
      svg += `<circle cx="${px}" cy="${py}" r="1.5" fill="${p.base}" opacity="0.5">
        <animate attributeName="cy" values="${py};${py + 25}" dur="${1.5 + Math.random() * 2}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0" dur="${1.5 + Math.random() * 2}s" repeatCount="indefinite"/>
      </circle>`;
    }
    svg += `</g>`;
  }

  // Sandy beach base
  svg += `<ellipse cx="${W / 2}" cy="${foundY + foundH}" rx="130" ry="8" fill="${p.base}" opacity="0.3"/>`;

  svg += `</svg></div>`;
  return svg;
}

export function rpBuildBeachBlanketBogusSandcastle(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb || !bbb.sandcastleData) return '';
  const sand = bbb.sandcastleData;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_bbbSand';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };

  const tribeMembers = gs.tribes ? gs.tribes.map(t => ({ name: t.name, members: [...t.members] })) : [];
  const tribeNames = tribeMembers.map(t => t.name);

  const steps = [];
  function pushStep(html, sfx) { steps.push({ html, sfx: sfx || null }); }

  // ─── Determine quality tiers ───
  const scores = Object.entries(sand.buildScores);
  const scoreVals = scores.map(s => s[1]);
  const minScore = Math.min(...scoreVals);
  const maxScore = Math.max(...scoreVals);
  const range = maxScore - minScore || 0.01;

  function qualityTier(score) {
    // Absolute baseline: if score is objectively low, show crumbling castle
    // If range is tiny (close scores), use absolute thresholds
    if (range < 0.02) {
      // Scores nearly identical — both mid
      return score >= 0.5 ? 'high' : score >= 0.3 ? 'mid' : 'low';
    }
    const pct = (score - minScore) / range;
    if (pct >= 0.6) return 'high';
    if (pct >= 0.3) return 'mid';
    return 'low';
  }

  // ─── Section A: Opening ───
  pushStep(`<div class="bbb-ev round-header">
    <div class="bbb-ev-port" style="font-size:22px;border-color:rgba(212,160,32,0.3);">&#x1F3F0;</div>
    <div style="flex:1"><div class="bbb-ev-badge gold">SANDCASTLE PHASE</div>
    <div class="bbb-ev-text">"Time to build! Grab your materials and construct the most EPIC sandcastle this beach has ever seen!"</div></div>
  </div>`);

  // ─── Section A: Per-tribe material inventory ───
  for (const tName of tribeNames) {
    const mats = sand.tribeMats[tName] || { shells: 0, driftwood: 0, rocks: 0 };
    const captain = sand.captains[tName] || '?';
    const maxPips = 8;

    function pipRow(label, count, cls) {
      let pips = '';
      const filled = Math.min(count, maxPips);
      for (let i = 0; i < filled; i++) pips += `<div class="bbb-mat-pip ${cls}"></div>`;
      for (let i = filled; i < maxPips; i++) pips += `<div class="bbb-mat-pip empty"></div>`;
      return `<div class="bbb-mat-row">
        <span class="bbb-mat-label">${label}</span>
        <div class="bbb-mat-pips">${pips}</div>
        <span style="font-size:10px;color:rgba(255,255,255,0.5);width:20px;text-align:left;">${count}</span>
      </div>`;
    }

    const tribe = tribeMembers.find(t => t.name === tName);
    const memberPortraits = tribe ? tribe.members.map(m =>
      `<div style="display:inline-flex;align-items:center;gap:3px;margin:2px 4px 2px 0;">
        ${_bbbPortrait(m, 22)}
        <span style="font-size:10px;color:rgba(255,255,255,0.7);">${m}</span>
      </div>`
    ).join('') : '';

    pushStep(`<div class="bbb-ev">
      <div style="flex:1">
        <div class="bbb-ev-badge teal">MATERIALS — ${tName.toUpperCase()}</div>
        <div style="display:flex;flex-wrap:wrap;margin:4px 0 8px;">${memberPortraits}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.5);margin:2px 0 8px;">Build Captain: <strong style="color:rgba(255,255,255,0.85);">${captain}</strong></div>
        ${pipRow('Shells', mats.shells, 'shell')}
        ${pipRow('Driftwood', mats.driftwood, 'driftwood')}
        ${pipRow('Rocks', mats.rocks, 'rock')}
      </div>
    </div>`);
  }

  // ─── Section A: Scavenge encounters ───
  for (const enc of sand.scavengeEncounters) {
    const badgeCls = enc.badgeClass || '';
    const mainPlayer = (enc.players && enc.players[0]) || '';
    pushStep(`<div class="bbb-ev ${badgeCls === 'red' ? 'negative' : badgeCls === 'gold' ? 'positive' : ''}">
      ${mainPlayer ? `<div class="bbb-ev-port">${_bbbPortrait(mainPlayer, 44)}</div>` : ''}
      <div style="flex:1"><div class="bbb-ev-badge ${badgeCls}">${enc.badge || enc.type || 'SCAVENGE'}</div>
      <div class="bbb-ev-text">${enc.text}</div></div>
    </div>`);
  }

  // ─── Section B: Castle Construction header ───
  pushStep(`<div class="bbb-build-stage">CONSTRUCTION BEGINS</div>
    <div class="bbb-castle-arena">
    ${tribeNames.map(tName => {
      const q = qualityTier(sand.buildScores[tName]);
      return `<div class="bbb-castle-col">
        <div class="bbb-castle-tribe-hdr">${tName.toUpperCase()}</div>
        <div class="bbb-castle-captain">Captain: ${sand.captains[tName] || '?'}</div>
        <div class="bbb-castle-svg-wrap" id="bbb-castle-${stateKey}-${tName}">
          ${_castleSVG(tName, sand.buildScores[tName], sand.buildScores, q)}
        </div>
        <div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.4);margin-top:4px;">
          ${q === 'high' ? 'MASTERPIECE' : q === 'mid' ? 'SOLID BUILD' : 'CRUMBLING MESS'}
        </div>
      </div>`;
    }).join('')}
  </div>`);

  // ─── Section B: Build events ───
  for (const evt of sand.buildEvents) {
    const badgeCls = evt.badgeClass || '';
    // Extract main player from the event's players array or data
    const mainPlayer = (evt.players && evt.players[0]) || '';
    const evtType = badgeCls === 'red' ? 'negative' : badgeCls === 'gold' ? 'positive' : '';
    const sandSfx = (evt.type === 'sabotage-kick' || evt.type === 'collapse-setback') ? 'sand' : null;
    // Show score impact if available
    const scoreMod = evt.data?.scoreMod;
    const impactText = scoreMod ? `<div style="font-size:9px;margin-top:4px;color:${scoreMod > 0 ? '#4ade80' : '#e85d3a'};">${scoreMod > 0 ? '+' : ''}${scoreMod}% build score</div>` : '';
    pushStep(`<div class="bbb-ev ${evtType}">
      ${mainPlayer ? `<div class="bbb-ev-port">${_bbbPortrait(mainPlayer, 44)}</div>` : ''}
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="bbb-ev-badge ${badgeCls}">${evt.badge || evt.type || 'BUILD'}</div>
          ${evt.tribe ? `<span style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:1px;">${evt.tribe.toUpperCase()}</span>` : ''}
        </div>
        <div class="bbb-ev-text">${evt.text}</div>
        ${impactText}
      </div>
    </div>`, sandSfx);
  }

  // ─── Section C: Judging ───
  pushStep(`<div class="bbb-ev round-header">
    <div class="bbb-ev-port" style="font-size:22px;border-color:rgba(212,160,32,0.3);">&#x1F3AC;</div>
    <div style="flex:1"><div class="bbb-ev-badge gold">JUDGING</div>
    <div class="bbb-ev-text">Chris strolls between the castles, chin in hand. He kicks one wall. Pokes a tower. Sniffs a seashell. "Hmm. Hmmmmmm. HMMMMMM."</div></div>
  </div>`);

  // Score comparison bars
  const maxScoreVal = Math.max(...scoreVals, 0.01);
  const barCards = tribeNames.map(tName => {
    const sc = sand.buildScores[tName] || 0;
    const pct = Math.round((sc / maxScoreVal) * 100);
    const isWinner = tName === sand.winner;
    return `<div class="bbb-judge-bar-row">
      <div class="bbb-judge-bar-label">${tName.toUpperCase()}</div>
      <div class="bbb-judge-bar-track">
        <div class="bbb-judge-bar-fill ${isWinner ? 'winner' : 'loser'}" style="width:${pct}%">${sc.toFixed(2)}</div>
      </div>
      ${isWinner ? `<span style="font-family:'Bowlby One SC',sans-serif;font-size:9px;color:var(--bbb-gold);letter-spacing:2px;">WINNER</span>` : '<span style="width:50px"></span>'}
    </div>`;
  }).join('');

  pushStep(`<div class="bbb-judge-section">
    <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;text-align:center;margin-bottom:10px;">CHRIS'S SCORES</div>
    ${barCards}
    <div class="bbb-winner-banner">${sand.winner.toUpperCase()} WINS THE SANDCASTLE PHASE!</div>
  </div>`);

  // ── Build the screen ──
  const state = _tvState[stateKey];

  let feedHtml = `<div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);">SANDCASTLE FEED</div>`;
  feedHtml += `<div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:8px;">CLICK TO ADVANCE</div>`;

  steps.forEach((step, i) => {
    const visible = i <= state.idx;
    feedHtml += `<div id="bbb-step-${stateKey}-${i}" data-state-idx="${i}"${step.sfx ? ` data-sfx="${step.sfx}"` : ''} style="${visible ? '' : 'display:none'}">${step.html}</div>`;
  });

  feedHtml += `<div id="bbb-controls-${stateKey}" class="bbb-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="bbb-btn-${stateKey}" class="bbb-btn-next" onclick="window.beachBogusRevealNext('${stateKey}', ${steps.length})">NEXT &#x25B6; (${state.idx + 2}/${steps.length})</button>
    <button class="bbb-btn-all" onclick="window.beachBogusRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  // Sidebar: materials summary + scores
  let sideHtml = '';
  sideHtml += `<div class="bbb-side-sec">MATERIALS</div>`;
  for (const tName of tribeNames) {
    const mats = sand.tribeMats[tName] || { shells: 0, driftwood: 0, rocks: 0 };
    const total = mats.shells + mats.driftwood + mats.rocks;
    sideHtml += `<div class="bbb-side-tribe">${tName.toUpperCase()}</div>`;
    sideHtml += `<div style="padding:4px 8px;font-size:11px;color:rgba(255,255,255,0.7);">
      <span style="margin-right:8px;"><span class="bbb-mat-pip shell" style="display:inline-block;vertical-align:middle;margin-right:2px;"></span>${mats.shells}</span>
      <span style="margin-right:8px;"><span class="bbb-mat-pip driftwood" style="display:inline-block;vertical-align:middle;margin-right:2px;"></span>${mats.driftwood}</span>
      <span><span class="bbb-mat-pip rock" style="display:inline-block;vertical-align:middle;margin-right:2px;"></span>${mats.rocks}</span>
      <span style="float:right;font-size:9px;color:rgba(255,255,255,0.4);">${total} total</span>
    </div>`;
  }
  sideHtml += `<div class="bbb-side-sec">BUILD CAPTAINS</div>`;
  for (const tName of tribeNames) {
    const captain = sand.captains[tName];
    if (captain) {
      sideHtml += `<div class="bbb-surfer">
        ${_bbbPortrait(captain, 24)}
        <div style="flex:1;min-width:0;">
          <div class="bbb-surfer-name">${captain}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:1px;">${tName.toUpperCase()}</div>
        </div>
      </div>`;
    }
  }
  sideHtml += `<div class="bbb-side-sec">BUILD SCORES</div>`;
  for (const tName of tribeNames) {
    const sc = (sand.buildScores[tName] || 0).toFixed(2);
    const isWinner = tName === sand.winner;
    sideHtml += `<div class="bbb-side-score" style="${isWinner ? 'border-color:rgba(212,160,32,0.3);' : ''}">
      <div class="bbb-side-score-name">${tName}</div>
      <div class="bbb-side-score-val" style="${isWinner ? 'color:var(--bbb-gold);' : ''}">${sc}</div>
    </div>`;
  }
  if (sand.winner) {
    sideHtml += `<div style="text-align:center;margin-top:8px;font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:2px;color:var(--bbb-gold);">WINNER: ${sand.winner.toUpperCase()}</div>`;
  }

  return _bbbShell(`
    <div class="bbb-hud">
      <div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:var(--bbb-gold)">&#x1F3F0;</div><div class="bbb-hud-lbl">SANDCASTLE</div></div>
      ${tribeNames.map(tName => {
        const q = qualityTier(sand.buildScores[tName]);
        const qLabel = q === 'high' ? 'MASTERPIECE' : q === 'mid' ? 'SOLID' : 'CRUMBLING';
        const qColor = q === 'high' ? 'var(--bbb-gold)' : q === 'mid' ? '#4dd0e1' : 'var(--bbb-coral)';
        return `<div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:${qColor}">${(sand.buildScores[tName] || 0).toFixed(1)}</div><div class="bbb-hud-lbl">${tName.toUpperCase()}</div></div>`;
      }).join('')}
      <div class="bbb-hud-cell"><div class="bbb-hud-val" style="color:var(--bbb-gold)">${sand.winner ? sand.winner.toUpperCase().slice(0, 8) : '?'}</div><div class="bbb-hud-lbl">WINNER</div></div>
    </div>
    <div class="bbb-layout">
      <div class="bbb-feed">${feedHtml}</div>
      <div class="bbb-sidebar">${sideHtml}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   VP — Halftime Drama (golden hour sunset)
   ═══════════════════════════════════════════════════════ */

export function rpBuildBeachBlanketBogusHalftime(ep, mode = 'halftime') {
  const bbb = ep.beachBlanketBogus;
  const events = mode === 'beachBreak' ? bbb?.beachBreakEvents : bbb?.halftimeEvents;
  if (!events?.length) return '';
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_bbb' + (mode === 'beachBreak' ? 'Break' : 'Half');
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const isBreak = mode === 'beachBreak';
  const title = isBreak ? 'BEACH BREAK' : 'TIEBREAKER TENSION';
  const subtitle = isBreak
    ? '"Take five, campers! Hydrate, strategize, scheme... you know the drill."'
    : '"We\'re TIED! Things are about to get heated. One more challenge decides it ALL!"';

  const steps = [];

  // Opening card
  steps.push(`<div class="bbb-half-ev strategy" style="text-align:center;justify-content:center;">
    <div style="flex:1"><div class="bbb-ev-badge gold">${title}</div>
    <div class="bbb-ev-text">${subtitle}</div></div>
  </div>`);

  // Each halftime event
  for (const evt of events) {
    const evtId = evt.eventId || '';
    const cardClass = evtId === 'cross-tribe-taunt' ? 'taunt'
      : evtId === 'alliance-pitch' ? 'alliance'
      : evtId === 'showmance-moment' ? 'showmance'
      : evtId === 'injury-check' ? 'injury'
      : evtId === 'strategy-huddle' ? 'strategy'
      : evtId === 'rivalry-confrontation' ? 'confrontation'
      : evtId === 'beach-bonding' || evtId === 'pep-talk' ? 'alliance'
      : evtId === 'paranoia-spiral' || evtId === 'food-steal' || evtId === 'challenge-replay' ? 'confrontation'
      : evtId === 'confessional-moment' ? 'strategy'
      : '';

    // Extract portraits from players array (universal) or known keys
    const evtPlayers = evt.players || [];
    const mainPlayer = evtPlayers[0] || evt.pitcher || evt.taunter || evt.strategist || evt.lover1 || evt.injured || evt.player || evt.player1 || evt.paranoid || evt.thief || evt.talker || evt.blamer || evt.fighter1 || '';
    const secondPlayer = evtPlayers[1] || evt.target || evt.lover2 || evt.healer || evt.player2 || evt.victim || evt.fighter2 || '';
    const portraits = [];
    if (mainPlayer) portraits.push(_bbbPortrait(mainPlayer, 44));
    if (secondPlayer && secondPlayer !== mainPlayer) portraits.push(_bbbPortrait(secondPlayer, 36));

    // Bond impact text
    let impactText = '';
    if (evtId === 'alliance-pitch') {
      impactText = evt.accepted ? 'New cross-tribe bond formed' : 'Deal rejected — trust damaged';
    } else if (evtId === 'showmance-moment') {
      impactText = evt.existing ? 'Showmance bond deepened' : 'Romantic tension rising';
    } else if (evtId === 'injury-check') {
      impactText = evt.healer ? `${evt.healer} earned loyalty through care` : 'Injury will slow sandcastle performance';
    } else if (evtId === 'strategy-huddle') {
      impactText = evt.success ? 'Tribe cohesion strengthened' : 'Failed rally — morale dipped';
    } else if (evtId === 'cross-tribe-taunt') {
      impactText = 'Cross-tribe hostility increased';
    } else if (evtId === 'rivalry-confrontation') {
      impactText = 'Both sides entrenched — witnesses picked sides';
    } else if (evtId === 'beach-bonding') {
      impactText = 'Bond strengthened between tribemates';
    } else if (evtId === 'paranoia-spiral') {
      impactText = 'Trust eroding — paranoia spreading';
    } else if (evtId === 'food-steal') {
      impactText = evt.witness ? `${evt.witness} caught the theft` : 'Got away with it';
    } else if (evtId === 'pep-talk') {
      impactText = `${mainPlayer} earned loyalty through encouragement`;
    } else if (evtId === 'challenge-replay') {
      impactText = 'Blame assigned — tension rising';
    } else if (evtId === 'confessional-moment') {
      impactText = 'Inner game revealed';
    }

    steps.push(`<div class="bbb-half-ev ${cardClass}">
      ${portraits.length > 0 ? `<div style="display:flex;gap:4px;flex-shrink:0;">${portraits.map(p => `<div class="bbb-ev-port">${p}</div>`).join('')}</div>` : ''}
      <div style="flex:1">
        <div class="bbb-ev-badge ${evt.badgeClass || ''}">${evt.badge || 'HALFTIME'}</div>
        <div class="bbb-ev-text">${evt.text}</div>
        ${impactText ? `<div class="bbb-half-impact">${impactText}</div>` : ''}
      </div>
    </div>`);
  }

  // Build feed with reveal
  let feedHtml = `<div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);">HALFTIME EVENTS</div>`;
  feedHtml += `<div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:8px;">CLICK TO ADVANCE</div>`;

  steps.forEach((html, i) => {
    const visible = i <= state.idx;
    feedHtml += `<div id="bbb-step-${stateKey}-${i}" style="${visible ? '' : 'display:none'}">${html}</div>`;
  });

  feedHtml += `<div id="bbb-controls-${stateKey}" class="bbb-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="bbb-btn-${stateKey}" class="bbb-btn-next" onclick="window.beachBogusRevealNext('${stateKey}', ${steps.length})">NEXT &#x25B6; (${state.idx + 2}/${steps.length})</button>
    <button class="bbb-btn-all" onclick="window.beachBogusRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  // Sidebar: surf result recap + tribe scores
  const tribeNames = Object.keys(bbb.tribeScores || {});
  let sideHtml = `<div class="bbb-side-sec">SERIES SCORE</div>`;
  for (const tName of tribeNames) {
    const surfWin = bbb.surfData?.winner === tName;
    sideHtml += `<div class="bbb-side-score">
      <div class="bbb-side-score-name">${tName}</div>
      <div class="bbb-side-score-val">${surfWin ? '1' : '0'}</div>
    </div>`;
  }
  sideHtml += `<div class="bbb-side-sec">SURF WINNER</div>`;
  sideHtml += `<div style="padding:4px 8px;font-size:11px;color:var(--bbb-gold);font-weight:600;">${bbb.surfData?.winner || '?'}</div>`;
  sideHtml += `<div class="bbb-side-sec">UP NEXT</div>`;
  sideHtml += `<div style="padding:4px 8px;font-size:11px;color:rgba(255,255,255,0.6);">Sandcastle Phase</div>`;

  return _bbbShell(`
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      background:linear-gradient(180deg,#ff6b35 0%,#e85d3a 15%,#d4a020 35%,#c77dba 60%,#6a4c93 80%,#2d1b4e 100%);
      z-index:0;pointer-events:none;"></div>
    <div class="bbb-halftime-hdr">BEACH BREAK</div>
    <div class="bbb-halftime-sub">The sun dips low. Alliances shift in the golden light.</div>
    <div class="bbb-layout">
      <div class="bbb-feed">${feedHtml}</div>
      <div class="bbb-sidebar">${sideHtml}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   VP — Dance-Off (tiki torch night scene)
   ═══════════════════════════════════════════════════════ */

export function rpBuildBeachBlanketBogusDanceOff(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb || !bbb.danceOff) return '';
  const dance = bbb.danceOff;
  const _tvState = window._tvState || (window._tvState = {});
  const stateKey = String(ep.num || 0) + '_bbbDance';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const tribeNames = Object.keys(dance.dancers);

  // Compute max possible score for bar scaling
  const allScoreVals = Object.values(dance.scores);
  const maxScore = Math.max(...allScoreVals, 0.01);

  // Build steps for reveal sequence
  const steps = [];

  // Running score state per step (for live tracker)
  const runningScores = {};
  tribeNames.forEach(t => { runningScores[t] = dance.scores[t]; }); // start at base

  // We need cumulative scores through the beats
  // Actually, beats modify the score via scoreMod applied during simulation
  // The final score is already computed. We'll simulate the progression.
  // Start with a base score (before beats), then apply beat mods cumulatively.

  // Estimate base scores by reversing beat mods
  const baseScores = {};
  for (const tName of tribeNames) {
    let score = dance.scores[tName];
    const beats = dance.beats[tName] || [];
    // Reverse mods (applied as score *= (1 + mod))
    for (let i = beats.length - 1; i >= 0; i--) {
      if (beats[i].scoreMod) score /= (1 + beats[i].scoreMod);
    }
    baseScores[tName] = score;
  }

  // Track cumulative scores through beats for the live bar
  function scoreAtBeat(tName, beatIdx) {
    let score = baseScores[tName];
    const beats = dance.beats[tName] || [];
    for (let i = 0; i <= beatIdx; i++) {
      if (beats[i]?.scoreMod) score *= (1 + beats[i].scoreMod);
    }
    return score;
  }

  function scoreBarHtml(scores, highlight) {
    return `<div class="bbb-score-tracker">
      <div class="bbb-score-tracker-label">LIVE SCORE</div>
      ${tribeNames.map((tName, ti) => {
        const sc = scores[tName] || 0;
        const pct = Math.min(100, Math.round((sc / maxScore) * 85) + 5);
        const barCls = ti === 0 ? 'coral' : 'teal';
        const isHighlight = highlight === tName;
        return `<div class="bbb-score-row">
          <div class="bbb-score-name">${tName.toUpperCase()}</div>
          <div class="bbb-score-bar-track">
            <div class="bbb-score-bar ${barCls}" style="width:${pct}%;${isHighlight ? 'box-shadow:0 0 15px rgba(255,180,50,0.5);' : ''}">${sc.toFixed(2)}</div>
          </div>
          <div class="bbb-score-val">${sc.toFixed(2)}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Step 1: "DANCE-OFF" title entrance
  steps.push(`<div style="text-align:center;padding:10px 0;position:relative;z-index:6;">
    <div class="bbb-danceoff-title">DANCE-OFF!</div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:4px;text-transform:uppercase;margin-top:4px;">
      IT'S ALL TIED UP &mdash; ONE DANCE TO DECIDE IT ALL</div>
  </div>`);

  // Step 2: Champion selections
  let selHtml = `<div style="position:relative;z-index:6;padding:8px 14px;">
    <div class="bbb-ev-badge gold" style="display:block;text-align:center;margin-bottom:10px;">CHAMPION SELECTION</div>`;
  for (const tName of tribeNames) {
    const sel = dance.selections[tName];
    selHtml += `<div class="bbb-half-ev strategy" style="margin-bottom:6px;">
      <div style="flex:1">
        <div style="font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:4px;">${tName.toUpperCase()}</div>
        <div class="bbb-ev-text">${sel?.text || 'A champion is selected.'}</div>
      </div>
    </div>`;
  }
  selHtml += `</div>`;
  steps.push(selHtml);

  // Step 3: VS layout — two dancer cards
  const dancerStats = {};
  for (const tName of tribeNames) {
    const d = dance.dancers[tName];
    const s = pStats(d);
    dancerStats[tName] = { social: s.social, physical: s.physical, boldness: s.boldness };
  }

  let vsHtml = `<div class="bbb-vs-layout">`;
  tribeNames.forEach((tName, ti) => {
    const d = dance.dancers[tName];
    const ds = dancerStats[tName];
    if (ti > 0) vsHtml += `<div class="bbb-vs">VS</div>`;
    vsHtml += `<div class="bbb-dancer" id="bbb-dancer-${stateKey}-${tName}">
      <div class="bbb-dancer-portrait">${_bbbPortrait(d, 72)}</div>
      <div class="bbb-dancer-name">${d}</div>
      <div class="bbb-dancer-tribe">${tName}</div>
      <div class="bbb-dancer-stats">SOC ${ds.social} / PHY ${ds.physical} / BLD ${ds.boldness}</div>
    </div>`;
  });
  vsHtml += `</div>`;
  // Show hidden score bars (no numbers until beats reveal)
  const hiddenScores = {};
  tribeNames.forEach(t => { hiddenScores[t] = 0; });
  vsHtml += `<div class="bbb-score-tracker">
    <div class="bbb-score-tracker-label">LIVE SCORE</div>
    ${tribeNames.map((tName, ti) => {
      const barCls = ti === 0 ? 'coral' : 'teal';
      return `<div class="bbb-score-row">
        <div class="bbb-score-name">${tName.toUpperCase()}</div>
        <div class="bbb-score-bar-track">
          <div class="bbb-score-bar ${barCls}" style="width:5%;">???</div>
        </div>
        <div class="bbb-score-val">???</div>
      </div>`;
    }).join('')}
  </div>`;
  steps.push(vsHtml);

  // Steps 4+: Dance beats — interleave tribes
  // Flatten all beats with tribe info, interleaved
  const maxBeats = Math.max(...tribeNames.map(t => (dance.beats[t] || []).length));
  for (let bi = 0; bi < maxBeats; bi++) {
    for (const tName of tribeNames) {
      const beats = dance.beats[tName] || [];
      if (bi >= beats.length) continue;
      const beat = beats[bi];
      const dancer = dance.dancers[tName];
      const beatCls = beat.scoreMod > 0 ? 'good' : beat.scoreMod < 0 ? 'bad' : 'neutral';
      const beatBadge = beat.beatId === 'crowd-erupts' ? 'CROWD ERUPTS'
        : beat.beatId === 'choke' ? 'CHOKE'
        : beat.beatId === 'showmance-audience' ? 'SHOWMANCE MOMENT'
        : beat.beatId === 'rival-heckle' ? 'HECKLED'
        : beat.beatId === 'signature-move' ? 'SIGNATURE MOVE'
        : beat.beatId === 'trip-stumble' ? (beat.recovers ? 'RECOVERY' : 'STUMBLE')
        : beat.beatId?.toUpperCase() || 'BEAT';
      const beatBadgeCls = beat.scoreMod > 0 ? 'gold' : beat.scoreMod < 0 ? 'red' : '';

      // Calculate scores at this beat
      const currentScores = {};
      for (const t of tribeNames) {
        currentScores[t] = scoreAtBeat(t, t === tName ? bi : Math.min(bi, (dance.beats[t] || []).length - 1));
      }

      let beatHtml = `<div class="bbb-dance-beat ${beatCls}">
        <div class="bbb-ev-port">${_bbbPortrait(dancer, 44)}</div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="bbb-ev-badge ${beatBadgeCls}">${beatBadge}</div>
            <span style="font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:1px;">${tName.toUpperCase()}</span>
          </div>
          <div class="bbb-ev-text">${beat.text}</div>
          ${beat.scoreMod ? `<div style="font-size:10px;color:${beat.scoreMod > 0 ? 'var(--bbb-gold)' : 'var(--bbb-coral)'};margin-top:4px;">${beat.scoreMod > 0 ? '+' : ''}${(beat.scoreMod * 100).toFixed(0)}% score modifier</div>` : ''}
        </div>
      </div>`;
      beatHtml += scoreBarHtml(currentScores, tName);
      steps.push(beatHtml);
    }
  }

  // Final step: score reveal + winner announcement
  const finalScores = {};
  tribeNames.forEach(t => { finalScores[t] = dance.scores[t]; });

  let finalHtml = `<div style="position:relative;z-index:6;padding:16px;">`;
  finalHtml += `<div class="bbb-ev-badge gold" style="display:block;text-align:center;margin-bottom:12px;">FINAL SCORES</div>`;
  finalHtml += scoreBarHtml(finalScores, dance.winner);
  finalHtml += `<div style="text-align:center;margin-top:16px;">`;
  finalHtml += `<div style="font-family:'Bowlby One SC',sans-serif;font-size:22px;color:var(--bbb-gold);text-shadow:0 0 15px rgba(212,160,32,0.4);letter-spacing:3px;">
    ${dance.dancers[dance.winner]} WINS THE DANCE-OFF!</div>`;
  finalHtml += `<div class="bbb-winner-crown">CHAMPION DANCER</div>`;
  finalHtml += `<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;">${dance.winner} takes the final point!</div>`;
  finalHtml += `</div></div>`;
  steps.push(finalHtml);

  // Store per-step score snapshots for sidebar updates
  // Steps: 0=title, 1=selection, 2=VS, then beat steps, then final
  const danceStepScores = [];
  let stepIdx = 0;
  // Title, selection, VS — no scores yet
  danceStepScores.push(null); // title
  danceStepScores.push(null); // selection
  danceStepScores.push(null); // VS
  stepIdx = 3;
  // Beat steps
  for (let bi = 0; bi < maxBeats; bi++) {
    for (const tName of tribeNames) {
      if (bi >= (dance.beats[tName] || []).length) continue;
      const sc = {};
      for (const t of tribeNames) sc[t] = scoreAtBeat(t, Math.min(bi, (dance.beats[t] || []).length - 1));
      danceStepScores.push(sc);
      stepIdx++;
    }
  }
  // Final step — show final scores + winner
  danceStepScores.push({ ...dance.scores, _winner: dance.winner });

  if (!window._bbbCache) window._bbbCache = {};
  window._bbbCache[stateKey] = { danceStepScores, tribeNames, winner: dance.winner, dancers: dance.dancers };

  // Build feed
  let feedHtml = `<div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);">DANCE-OFF FEED</div>`;
  feedHtml += `<div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.3);margin-bottom:8px;">CLICK TO ADVANCE</div>`;

  steps.forEach((html, i) => {
    const visible = i <= state.idx;
    const sfx = html.includes('bbb-dance-beat') ? 'beat' : null;
    feedHtml += `<div id="bbb-step-${stateKey}-${i}"${sfx ? ` data-sfx="${sfx}"` : ''} style="${visible ? '' : 'display:none'}">${html}</div>`;
  });

  feedHtml += `<div id="bbb-controls-${stateKey}" class="bbb-controls"${state.idx >= steps.length - 1 ? ' style="display:none"' : ''}>
    <button id="bbb-btn-${stateKey}" class="bbb-btn-next" onclick="window.beachBogusRevealNext('${stateKey}', ${steps.length})">NEXT &#x25B6; (${state.idx + 2}/${steps.length})</button>
    <button class="bbb-btn-all" onclick="window.beachBogusRevealAll('${stateKey}', ${steps.length})">Reveal All</button>
  </div>`;

  // Sidebar
  let sideHtml = `<div class="bbb-side-sec">DANCERS</div>`;
  for (const tName of tribeNames) {
    const d = dance.dancers[tName];
    sideHtml += `<div class="bbb-surfer">
      ${_bbbPortrait(d, 28)}
      <div style="flex:1;min-width:0;">
        <div class="bbb-surfer-name">${d}</div>
        <div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:1px;">${tName.toUpperCase()}</div>
      </div>
    </div>`;
  }
  sideHtml += `<div class="bbb-side-sec">SCORES</div>`;
  for (const tName of tribeNames) {
    sideHtml += `<div class="bbb-side-score">
      <div class="bbb-side-score-name">${tName}</div>
      <div class="bbb-side-score-val" id="bbb-dance-score-${stateKey}-${tName}" style="color:rgba(255,255,255,0.3);">???</div>
    </div>`;
  }
  sideHtml += `<div class="bbb-side-sec">RESULT</div>`;
  sideHtml += `<div id="bbb-dance-result-${stateKey}" style="font-size:11px;color:rgba(255,255,255,0.5);padding:4px 8px;">Tiebreaker in progress...</div>`;

  return _bbbShell(`
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      background:linear-gradient(180deg,#0a0a2e 0%,#141452 20%,#1b1b6b 40%,#1a1a4a 70%,#0d0d2a 100%);
      z-index:0;pointer-events:none;"></div>
    <div class="bbb-stars"></div>
    <!-- Spotlights -->
    <div class="bbb-spotlight left"></div>
    <div class="bbb-spotlight right"></div>
    <!-- Tiki torches left -->
    <div class="bbb-tiki-wrap left">
      <div class="bbb-tiki-flame"></div>
      <div class="bbb-tiki"></div>
    </div>
    <div class="bbb-tiki-wrap left" style="top:220px;">
      <div class="bbb-tiki-flame-sm"></div>
      <div class="bbb-tiki" style="height:80px;"></div>
    </div>
    <!-- Tiki torches right -->
    <div class="bbb-tiki-wrap right">
      <div class="bbb-tiki-flame"></div>
      <div class="bbb-tiki"></div>
    </div>
    <div class="bbb-tiki-wrap right" style="top:220px;">
      <div class="bbb-tiki-flame-sm"></div>
      <div class="bbb-tiki" style="height:80px;"></div>
    </div>
    <div class="bbb-layout">
      <div class="bbb-feed">${feedHtml}</div>
      <div class="bbb-sidebar">${sideHtml}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   VP — Results Screen (final scores + standouts + leaderboard)
   ═══════════════════════════════════════════════════════ */

export function rpBuildBeachBlanketBogusResults(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return '';

  const tribeNames = Object.keys(bbb.tribeScores || {});
  const tribeMembers = gs.tribes ? gs.tribes.map(t => ({ name: t.name, members: [...t.members] })) : [];

  // Determine overall winner
  const sorted = Object.entries(bbb.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0] || '?';
  const loserTribe = sorted[1]?.[0] || '?';
  const finalScore = `${sorted[0]?.[1] || 0}-${sorted[1]?.[1] || 0}`;

  // Phase results
  const phases = [];
  if (bbb.surfData) {
    phases.push({ icon: '&#x1F3C4;', name: 'Surf Phase', winner: bbb.surfData.winner });
  }
  if (bbb.sandcastleData) {
    phases.push({ icon: '&#x1F3F0;', name: 'Sandcastle Phase', winner: bbb.sandcastleData.winner });
  }
  if (bbb.danceOff) {
    phases.push({ icon: '&#x1F57A;', name: 'Dance-Off', winner: bbb.danceOff.winner });
  }

  let phasesHtml = `<div style="position:relative;z-index:6;padding:0 14px;">
    <div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);text-align:center;">PHASE BREAKDOWN</div>`;
  for (const phase of phases) {
    const phaseCards = tribeNames.map(tName => {
      const isWinner = tName === phase.winner;
      return `<span class="bbb-phase-winner ${isWinner ? 'won' : 'lost'}">${tName.toUpperCase()}${isWinner ? ' &#x2713;' : ''}</span>`;
    }).join('');
    phasesHtml += `<div class="bbb-phase-row">
      <div class="bbb-phase-icon">${phase.icon}</div>
      <div class="bbb-phase-name">${phase.name}</div>
      ${phaseCards}
    </div>`;
  }
  phasesHtml += `</div>`;

  // Celebration
  let celebHtml = `<div class="bbb-celebration">
    <div class="bbb-celebration-tribe">${winnerTribe.toUpperCase()} WINS!</div>
    <div class="bbb-celebration-sub">Final Score: ${finalScore}</div>
  </div>`;
  celebHtml += `<div class="bbb-losers-text">${loserTribe} heads to tribal council tonight.</div>`;

  // Individual standouts
  let standoutsHtml = `<div style="position:relative;z-index:6;padding:0 14px;">
    <div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);text-align:center;">STANDOUT PERFORMERS</div>`;

  // Surf: last surfer standing (most rounds survived)
  if (bbb.surfData?.rounds) {
    const surfRounds = bbb.surfData.rounds;
    const allSurfers = tribeMembers.flatMap(t => t.members);
    const roundsSurvived = {};
    allSurfers.forEach(n => { roundsSurvived[n] = 0; });
    for (const round of surfRounds) {
      for (const r of round.results) {
        if (r.status !== 'wipeout') roundsSurvived[r.name] = (roundsSurvived[r.name] || 0) + 1;
      }
    }
    const bestSurfer = Object.entries(roundsSurvived).sort((a, b) => b[1] - a[1])[0];
    if (bestSurfer) {
      standoutsHtml += `<div class="bbb-standout">
        <div class="bbb-ev-port">${_bbbPortrait(bestSurfer[0], 40)}</div>
        <div style="flex:1">
          <div class="bbb-standout-label">SURF LEGEND</div>
          <div class="bbb-standout-name">${bestSurfer[0]}</div>
          <div class="bbb-standout-desc">Survived ${bestSurfer[1]} of ${surfRounds.length} rounds</div>
        </div>
      </div>`;
    }
  }

  // Sandcastle: best builder
  if (bbb.sandcastleData?.buildScores) {
    // Find per-player contribution from chalMemberScores (sandcastle contributes there)
    const sand = bbb.sandcastleData;
    const captains = Object.values(sand.captains || {});
    if (captains.length > 0) {
      // Use the captain from the winning tribe as standout
      const winCaptain = sand.captains[sand.winner];
      if (winCaptain) {
        standoutsHtml += `<div class="bbb-standout">
          <div class="bbb-ev-port">${_bbbPortrait(winCaptain, 40)}</div>
          <div style="flex:1">
            <div class="bbb-standout-label">MASTER BUILDER</div>
            <div class="bbb-standout-name">${winCaptain}</div>
            <div class="bbb-standout-desc">Led ${sand.winner}'s winning sandcastle</div>
          </div>
        </div>`;
      }
    }
  }

  // Dance-off hero
  if (bbb.danceOff) {
    const winDancer = bbb.danceOff.dancers[bbb.danceOff.winner];
    if (winDancer) {
      standoutsHtml += `<div class="bbb-standout" style="border-left-color:#e91e9c;">
        <div class="bbb-ev-port">${_bbbPortrait(winDancer, 40)}</div>
        <div style="flex:1">
          <div class="bbb-standout-label" style="color:#e91e9c;">DANCE-OFF HERO</div>
          <div class="bbb-standout-name">${winDancer}</div>
          <div class="bbb-standout-desc">Won the tiebreaker for ${bbb.danceOff.winner}</div>
        </div>
      </div>`;
    }
  }
  standoutsHtml += `</div>`;

  // Leaderboard: all players ranked by chalMemberScores
  const allPlayers = tribeMembers.flatMap(t => t.members);
  const scored = allPlayers.map(name => ({
    name,
    score: ep.chalMemberScores?.[name] || 0,
  })).sort((a, b) => b.score - a.score);

  let lbHtml = `<div class="bbb-leaderboard">
    <div class="bbb-side-sec" style="color:rgba(255,255,255,0.35);text-align:center;">LEADERBOARD</div>`;
  scored.forEach((entry, i) => {
    const rank = i + 1;
    const isTop = rank <= 3;
    lbHtml += `<div class="bbb-lb-row${isTop ? ' top-3' : ''}">
      <div class="bbb-lb-rank">${rank <= 3 ? ['&#x1F947;', '&#x1F948;', '&#x1F949;'][rank - 1] : rank}</div>
      ${_bbbPortrait(entry.name, 22)}
      <div class="bbb-lb-name">${entry.name}</div>
      <div class="bbb-lb-score">${entry.score.toFixed(1)}</div>
    </div>`;
  });
  lbHtml += `</div>`;

  // Sidebar: final tribe scores
  let sideHtml = `<div class="bbb-side-sec">FINAL SCORE</div>`;
  for (const tName of tribeNames) {
    const isWinner = tName === winnerTribe;
    sideHtml += `<div class="bbb-side-score" style="${isWinner ? 'border-color:rgba(212,160,32,0.3);' : ''}">
      <div class="bbb-side-score-name">${tName}</div>
      <div class="bbb-side-score-val" style="${isWinner ? 'color:var(--bbb-gold);' : ''}">${bbb.tribeScores[tName] || 0}</div>
    </div>`;
  }
  if (winnerTribe !== '?') {
    sideHtml += `<div style="text-align:center;margin-top:10px;font-family:'Bowlby One SC',sans-serif;font-size:10px;letter-spacing:2px;color:var(--bbb-gold);">WINNER: ${winnerTribe.toUpperCase()}</div>`;
  }
  sideHtml += `<div class="bbb-side-sec">PHASES WON</div>`;
  for (const tName of tribeNames) {
    const phasesWon = phases.filter(p => p.winner === tName).length;
    sideHtml += `<div style="padding:4px 8px;font-size:11px;color:rgba(255,255,255,0.6);">${tName}: ${phasesWon}/${phases.length}</div>`;
  }

  return _bbbShell(`
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      background:linear-gradient(180deg,#ff6b35 0%,#f7931e 15%,#ffd700 30%,#87CEEB 55%,#0d6986 80%,#0a3d5c 100%);
      z-index:0;pointer-events:none;"></div>
    <div class="bbb-waves">
      <div class="bbb-wave bbb-wave-3"></div>
      <div class="bbb-wave bbb-wave-2"></div>
      <div class="bbb-wave bbb-wave-1"></div>
    </div>
    <div class="bbb-results-hdr">BEACH BLANKET BOGUS &mdash; RESULTS</div>
    ${phasesHtml}
    ${celebHtml}
    ${standoutsHtml}
    ${lbHtml}
    <div class="bbb-layout" style="padding-top:0;">
      <div class="bbb-feed" style="display:none;"></div>
      <div class="bbb-sidebar" style="position:relative;width:100%;max-width:300px;margin:0 auto;">${sideHtml}</div>
    </div>
  `, ep);
}

/* ═══════════════════════════════════════════════════════
   AUDIO — procedural beach SFX via Web Audio API
   ═══════════════════════════════════════════════════════ */

function _bbbPlaySplash() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    // White noise burst through lowpass filter — exponential decay
    const len = ctx.sampleRate * 0.3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.15));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    src.start(t);
    src.onended = () => ctx.close();
  } catch (e) { /* Web Audio not available */ }
}

function _bbbPlaySeagull() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    // Sawtooth oscillator with frequency sweep 2000→3000→1500
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.linearRampToValueAtTime(3000, t + 0.1);
    osc.frequency.linearRampToValueAtTime(1500, t + 0.25);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.25);
    osc.onended = () => ctx.close();
  } catch (e) { /* Web Audio not available */ }
}

function _bbbPlaySandCrumble() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    // White noise through bandpass filter — slow decay
    const len = ctx.sampleRate * 0.4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    src.start(t);
    src.onended = () => ctx.close();
  } catch (e) { /* Web Audio not available */ }
}

function _bbbPlayBeatDrop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.15);
    osc.onended = () => ctx.close();
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════
   AMBIENT AUDIO — persistent background per phase
   Waves (surf), Hawaii ukulele (sandcastle), Hawaii + bass (dance-off)
   ═══════════════════════════════════════════════════════ */

let _bbbAmbientCtx = null;
let _bbbAmbientNodes = {};
let _bbbAmbientMode = null;
let _bbbUkeInterval = null;

export function _bbbAmbientStart(mode) {
  if (window._bbbMuted) return;
  if (_bbbAmbientMode === mode && _bbbAmbientCtx) return;
  _bbbAmbientStop();
  _bbbAmbientMode = mode;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    _bbbAmbientCtx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 1);
    master.connect(ctx.destination);

    if (mode === 'waves') {
      // Ocean waves: layered filtered noise with LFO volume modulation
      const len = ctx.sampleRate * 4;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buf; noise.loop = true;
      // Low rumble layer
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 300;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.06;
      noise.connect(lpf); lpf.connect(rumbleGain); rumbleGain.connect(master);
      // Wash/foam layer (higher, rhythmic)
      const noise2 = ctx.createBufferSource();
      noise2.buffer = buf; noise2.loop = true;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 800; bpf.Q.value = 0.3;
      const washGain = ctx.createGain();
      washGain.gain.value = 0.03;
      // LFO for wave rhythm (0.1Hz = every 10 seconds)
      const lfo = ctx.createOscillator();
      lfo.type = 'sine'; lfo.frequency.value = 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain); lfoGain.connect(washGain.gain);
      noise2.connect(bpf); bpf.connect(washGain); washGain.connect(master);
      noise.start(); noise2.start(); lfo.start();
      _bbbAmbientNodes = { master, noise, noise2, lfo, lpf };

    } else if (mode === 'hawaii' || mode === 'hawaii-bass') {
      // Ukulele-ish plucked string simulation using Karplus-Strong-lite
      // Pentatonic scale in C major: C4, D4, E4, G4, A4
      const notes = [261.6, 293.7, 329.6, 392.0, 440.0];
      const ukeGain = ctx.createGain();
      ukeGain.gain.value = 0.07;
      ukeGain.connect(master);

      // Light noise bed (beach ambience)
      const ambLen = ctx.sampleRate * 3;
      const ambBuf = ctx.createBuffer(1, ambLen, ctx.sampleRate);
      const ambData = ambBuf.getChannelData(0);
      for (let i = 0; i < ambLen; i++) ambData[i] = Math.random() * 2 - 1;
      const ambNoise = ctx.createBufferSource();
      ambNoise.buffer = ambBuf; ambNoise.loop = true;
      const ambLpf = ctx.createBiquadFilter();
      ambLpf.type = 'lowpass'; ambLpf.frequency.value = 200;
      const ambGain = ctx.createGain();
      ambGain.gain.value = 0.02;
      ambNoise.connect(ambLpf); ambLpf.connect(ambGain); ambGain.connect(master);
      ambNoise.start();

      // Pluck a note every ~0.4s in pentatonic pattern
      let noteIdx = 0;
      function pluck() {
        if (!_bbbAmbientCtx) return;
        const freq = notes[noteIdx % notes.length];
        // Alternate between root and a higher octave for melody feel
        const octave = (noteIdx % 8 < 5) ? 1 : 2;
        const actualFreq = freq * octave;
        noteIdx++;
        try {
          const t = ctx.currentTime;
          // Plucked string: short noise burst → comb filter (delay feedback)
          const pluckLen = ctx.sampleRate * 0.02;
          const pluckBuf = ctx.createBuffer(1, pluckLen, ctx.sampleRate);
          const pd = pluckBuf.getChannelData(0);
          for (let i = 0; i < pluckLen; i++) pd[i] = Math.random() * 2 - 1;
          const pluckSrc = ctx.createBufferSource();
          pluckSrc.buffer = pluckBuf;
          // Simple tone using oscillator (more reliable than Karplus-Strong)
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = actualFreq;
          const env = ctx.createGain();
          env.gain.setValueAtTime(0.12, t);
          env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
          osc.connect(env); env.connect(ukeGain);
          osc.start(t); osc.stop(t + 0.4);
        } catch (e) {}
      }
      // Start playing with slight randomness in timing
      _bbbUkeInterval = setInterval(() => {
        pluck();
        // Occasionally double-strum (two quick notes)
        if (Math.random() < 0.3) setTimeout(pluck, 80);
      }, 350 + Math.random() * 100);
      pluck();

      // Bass layer for dance-off mode
      if (mode === 'hawaii-bass') {
        const bassOsc = ctx.createOscillator();
        bassOsc.type = 'sine'; bassOsc.frequency.value = 55;
        const bassGain = ctx.createGain();
        bassGain.gain.value = 0.08;
        // Pulsing bass (4-on-the-floor feel)
        const bassLfo = ctx.createOscillator();
        bassLfo.type = 'square'; bassLfo.frequency.value = 2;
        const bassLfoGain = ctx.createGain();
        bassLfoGain.gain.value = 0.06;
        bassLfo.connect(bassLfoGain); bassLfoGain.connect(bassGain.gain);
        bassOsc.connect(bassGain); bassGain.connect(master);
        bassOsc.start(); bassLfo.start();
        // Kick drum pulse
        const kickOsc = ctx.createOscillator();
        kickOsc.type = 'sine'; kickOsc.frequency.value = 80;
        const kickGain = ctx.createGain();
        kickGain.gain.value = 0;
        kickOsc.connect(kickGain); kickGain.connect(master);
        kickOsc.start();
        // Trigger kick every 0.5s
        let kickInterval = setInterval(() => {
          if (!_bbbAmbientCtx) { clearInterval(kickInterval); return; }
          const kt = ctx.currentTime;
          kickGain.gain.setValueAtTime(0.12, kt);
          kickGain.gain.exponentialRampToValueAtTime(0.001, kt + 0.1);
          kickOsc.frequency.setValueAtTime(80, kt);
          kickOsc.frequency.exponentialRampToValueAtTime(40, kt + 0.08);
        }, 500);
        _bbbAmbientNodes = { master, ukeGain, ambNoise, bassOsc, bassLfo, kickOsc, kickInterval };
      } else {
        _bbbAmbientNodes = { master, ukeGain, ambNoise };
      }
    }
  } catch (e) {}
}

export function _bbbAmbientStop() {
  if (_bbbUkeInterval) { clearInterval(_bbbUkeInterval); _bbbUkeInterval = null; }
  if (_bbbAmbientNodes.kickInterval) { clearInterval(_bbbAmbientNodes.kickInterval); _bbbAmbientNodes.kickInterval = null; }
  if (!_bbbAmbientCtx) return;
  try {
    if (_bbbAmbientNodes.noise) _bbbAmbientNodes.noise.stop();
    if (_bbbAmbientNodes.noise2) _bbbAmbientNodes.noise2.stop();
    if (_bbbAmbientNodes.lfo) _bbbAmbientNodes.lfo.stop();
    if (_bbbAmbientNodes.ambNoise) _bbbAmbientNodes.ambNoise.stop();
    if (_bbbAmbientNodes.bassOsc) _bbbAmbientNodes.bassOsc.stop();
    if (_bbbAmbientNodes.bassLfo) _bbbAmbientNodes.bassLfo.stop();
    if (_bbbAmbientNodes.kickOsc) _bbbAmbientNodes.kickOsc.stop();
    _bbbAmbientCtx.close();
  } catch (e) {}
  _bbbAmbientCtx = null;
  _bbbAmbientNodes = {};
  _bbbAmbientMode = null;
}
