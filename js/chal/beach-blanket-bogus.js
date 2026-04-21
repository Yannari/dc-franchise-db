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
        const a = sm.pair[0], b = sm.pair[1];
        if (!activeSurfers.includes(a) || !activeSurfers.includes(b)) continue;
        const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
        if (!sameTribe) return { surfer: a, partner: b };
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
    apply(victim) {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 1;
      const pr = pronouns(victim);
      return { victim, pr };
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

  for (let ri = 0; ri < HAZARD_ROUNDS.length; ri++) {
    const hazard = HAZARD_ROUNDS[ri];
    const activeSurfers = allSurfers.filter(n => balances[n] > 0);
    const roundLog = { id: hazard.id, name: hazard.name, threat: hazard.threat, desc: hazard.desc, results: [], events: [] };

    // --- Hazard drain ---
    for (const name of activeSurfers) {
      const s = pStats(name);
      const check = Math.min(1, hazard.statCheck(s));
      const drain = (1 - check) * (25 + Math.random() * 15);
      balances[name] = Math.max(0, balances[name] - drain);

      const pr = pronouns(name);
      if (balances[name] <= 0) {
        balances[name] = 0;
        wipeoutOrder.push(name);
        surfScores[name] = (ri + 1) * 10;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[name] = (gs.popularity[name] || 0) - 1;
        roundLog.results.push({ name, status: 'wipeout', text: hazard.wipeout(name, pr), balance: 0 });
      } else if (balances[name] < 40) {
        roundLog.results.push({ name, status: 'struggle', text: hazard.struggle(name, pr), balance: balances[name] });
      } else {
        roundLog.results.push({ name, status: 'survive', text: hazard.survive(name, pr), balance: balances[name] });
      }
    }

    // --- Mid-surf events (1-2 per round) ---
    const shuffled = [...SURF_EVENTS].sort(() => Math.random() - 0.5);
    let eventsFired = 0;
    const maxEvents = Math.random() < 0.5 ? 1 : 2;
    const activeAfterHazard = allSurfers.filter(n => balances[n] > 0);

    for (const evt of shuffled) {
      if (eventsFired >= maxEvents) break;
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
  for (const name of allSurfers) {
    if (balances[name] > 0) {
      surfScores[name] = HAZARD_ROUNDS.length * 10 + balances[name];
    }
  }

  // --- Tribe scoring: AVERAGE per member ---
  const tribeAvgs = {};
  for (const t of tribeMembers) {
    const total = t.members.reduce((sum, m) => sum + surfScores[m], 0);
    tribeAvgs[t.name] = total / t.members.length;
  }

  // Winner = higher average
  const sorted = Object.entries(tribeAvgs).sort((a, b) => b[1] - a[1]);
  const winner = sorted[0][0];
  result.tribeScores[winner] = (result.tribeScores[winner] || 0) + 1;

  // Store surf data
  result.surfData = { rounds, balances: { ...balances }, surfScores: { ...surfScores }, wipeoutOrder: [...wipeoutOrder], tribeAvgs, winner };

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
      const data = evt.apply(match);
      data.eventId = evt.id;
      data.badge = evt.badge;
      data.badgeClass = evt.badgeClass;
      data.tribe = t.name;
      if (data.scoreMod) score *= (1 + data.scoreMod);
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
      if (Math.random() > 0.30) return null;
      const all = tribeMembers.flatMap(t => t.members);
      for (const a of all) {
        for (const b of all) {
          if (a === b) continue;
          const sameTribe = tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
          if (!sameTribe && getBond(a, b) <= -2) return { fighter1: a, fighter2: b };
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
      if (Math.random() > 0.25) return null;
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
      if (Math.random() > 0.40) return null;
      const all = tribeMembers.flatMap(t => t.members);
      // Check active showmances first
      if (gs.showmances) {
        for (const sm of gs.showmances) {
          if (all.includes(sm.pair[0]) && all.includes(sm.pair[1]) && romanticCompat(sm.pair[0], sm.pair[1])) {
            return { lover1: sm.pair[0], lover2: sm.pair[1], existing: true };
          }
        }
      }
      // Check sparks
      if (gs.romanticSparks) {
        for (const sp of gs.romanticSparks) {
          if (all.includes(sp.pair[0]) && all.includes(sp.pair[1]) && romanticCompat(sp.pair[0], sp.pair[1])) {
            return { lover1: sp.pair[0], lover2: sp.pair[1], existing: false };
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
      if (Math.random() > 0.30) return null;
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
      if (Math.random() > 0.25) return null;
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
      if (Math.random() > 0.30) return null;
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
];

function _simulateHalftime(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  const events = [];
  const shuffled = [...HALFTIME_EVENTS].sort(() => Math.random() - 0.5);
  const count = 2 + (Math.random() < 0.4 ? 1 : 0);
  let fired = 0;

  for (const evt of shuffled) {
    if (fired >= count) break;
    const match = evt.check(tribeMembers, result);
    if (!match) continue;
    const data = evt.apply(match, tribeMembers);
    if (!data) continue;
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
    id: 'crowd-erupts',
    check(score, range) { return score >= range[0] + (range[1] - range[0]) * 0.75; },
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
        scoreMod: 0,
        text: `${dancer} NAILS it — the crowd goes absolutely FERAL. Even the rival tribe is applauding. ${pr.Sub} moonwalks back to ${pr.posAdj} spot. Mic. Drop.`,
      };
    },
  },
  {
    id: 'choke',
    check(score, range) { return score <= range[0] + (range[1] - range[0]) * 0.25; },
    apply(dancer, tribeMembers, tribeNames) {
      for (const m of tribeNames) {
        if (m !== dancer) addBond(m, dancer, -0.3);
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[dancer] = (gs.popularity[dancer] || 0) - 1;
      return {
        scoreMod: 0,
        text: `${dancer} freezes up. The music plays but nothing happens. "...Dance? DANCE!" Chris yells. ${dancer} does a half-hearted shimmy. The tribe buries their faces in their hands.`,
      };
    },
  },
  {
    id: 'showmance-audience',
    check(score, range, dancer) {
      if (!gs.showmances) return false;
      return gs.showmances.some(sm => sm.pair.includes(dancer));
    },
    apply(dancer, tribeMembers) {
      const sm = gs.showmances.find(s => s.pair.includes(dancer));
      if (!sm) return null;
      const partner = sm.pair[0] === dancer ? sm.pair[1] : sm.pair[0];
      addBond(partner, dancer, 0.4);
      return {
        scoreMod: 0, partner,
        text: `${partner} watches from the sideline, hands clasped. Every move ${dancer} makes — ${partner}'s eyes follow. "GO BABY!" The crowd awws. Chris pretends to wipe a tear.`,
      };
    },
  },
  {
    id: 'rival-heckle',
    check(score, range, dancer, tribeMembers) {
      if (Math.random() > 0.25) return false;
      const rivalTribe = tribeMembers.find(t => !t.members.includes(dancer));
      if (!rivalTribe) return false;
      return rivalTribe.members.some(m => getBond(m, dancer) <= -3);
    },
    apply(dancer, tribeMembers) {
      const rivalTribe = tribeMembers.find(t => !t.members.includes(dancer));
      const heckler = rivalTribe?.members.find(m => getBond(m, dancer) <= -3);
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
      if (Math.random() > 0.30) return false;
      return pStats(dancer).boldness * 0.1 + Math.random() * 0.1 >= 0.8;
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
      if (Math.random() > 0.20) return false;
      return pStats(dancer).temperament * 0.1 + Math.random() * 0.1 <= 0.4;
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
          scoreMod: 0, recovers,
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

    // --- Fire 2-3 dance beats ---
    const beatCount = 2 + (Math.random() < 0.4 ? 1 : 0);
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

  // --- SANDCASTLE PHASE ---
  _simulateSandcastle(ep, tribeMembers, result);
  result.phases.push('sandcastle');

  // --- Check for tie (1-1) → halftime + dance-off ---
  const scoreVals = Object.values(result.tribeScores);
  const allEqual = scoreVals.every(v => v === scoreVals[0]);
  if (allEqual) {
    _simulateHalftime(ep, tribeMembers, result);
    result.phases.push('halftime');

    _simulateDanceOff(ep, tribeMembers, result);
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
      const a = sm.pair[0], b = sm.pair[1];
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
}

export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;

  // --- Chris opener ---
  ln(bbb.chrisOpener);
  sec();

  // --- SURF PHASE ---
  if (bbb.surfData) {
    ln('"First up: EXTREME SURFING! Last one standing on their board wins the point for their tribe!"');
    sec();
    for (const round of bbb.surfData.rounds) {
      ln(`Chris grins as the next hazard drops: ${round.name}. ${round.desc}`);
      const wipeouts = round.results.filter(r => r.status === 'wipeout');
      const struggles = round.results.filter(r => r.status === 'struggle');
      const survivors = round.results.filter(r => r.status === 'survive');
      if (survivors.length > 0) {
        ln(`${survivors.map(r => r.name).join(', ')} ${survivors.length === 1 ? 'powers' : 'power'} through without breaking a sweat.`);
      }
      if (struggles.length > 0) {
        for (const s of struggles) ln(s.text);
      }
      if (wipeouts.length > 0) {
        for (const w of wipeouts) ln(w.text);
      }
      // Round events
      for (const evt of round.events) {
        ln(evt.text);
      }
      sec();
    }
    // Surf results
    const surfWinner = bbb.surfData.winner;
    const allSurf = Object.entries(bbb.surfData.surfScores).sort((a, b) => b[1] - a[1]);
    const lastStanding = allSurf.filter(([n]) => bbb.surfData.balances[n] > 0);
    if (lastStanding.length > 0) {
      ln(`When the dust settles, ${lastStanding.map(([n]) => n).join(' and ')} ${lastStanding.length === 1 ? 'is' : 'are'} still standing on ${lastStanding.length === 1 ? 'their board' : 'their boards'}!`);
    }
    ln(`${surfWinner} takes the surf phase! The score is 1-0.`);
    sec();
  }

  // --- SANDCASTLE PHASE ---
  if (bbb.sandcastleData) {
    ln('"Phase two: SANDCASTLE SHOWDOWN! Scavenge materials, build a castle, and pray Chris likes it!"');
    sec();

    // Scavenge encounters
    if (bbb.sandcastleData.scavengeEncounters.length > 0) {
      ln('The tribes scatter across the beach, hunting for materials.');
      for (const enc of bbb.sandcastleData.scavengeEncounters) {
        ln(enc.text);
      }
      sec();
    }

    // Build phase
    ln('Build time! The tribes race to construct their masterpieces.');
    for (const evt of bbb.sandcastleData.buildEvents) {
      ln(evt.text);
    }
    const castleWinner = bbb.sandcastleData.winner;
    const captains = bbb.sandcastleData.captains;
    if (captains) {
      const capEntries = Object.entries(captains);
      for (const [tribe, cap] of capEntries) {
        ln(`${cap} takes charge as ${tribe}'s build captain, directing the design.`);
      }
    }
    ln(`Chris inspects both castles... "${castleWinner}'s castle is CLEARLY superior! Point to ${castleWinner}!"`);
    sec();
  }

  // --- HALFTIME DRAMA ---
  if (bbb.halftimeEvents && bbb.halftimeEvents.length > 0) {
    ln('"We\'re tied up! Take a breather, people. Halftime!"');
    sec();
    for (const evt of bbb.halftimeEvents) {
      ln(evt.text);
    }
    sec();
  }

  // --- DANCE-OFF ---
  if (bbb.danceOff) {
    ln('"It\'s TIED! You know what that means — DANCE-OFF! Each tribe picks a champion!"');
    sec();

    // Selection narratives
    for (const tribe of Object.keys(bbb.danceOff.selections)) {
      const sel = bbb.danceOff.selections[tribe];
      const dancer = bbb.danceOff.dancers[tribe];
      ln(`${tribe}: ${sel.text}`);
    }
    sec();

    // Dance beats per tribe
    for (const tribe of Object.keys(bbb.danceOff.dancers)) {
      const dancer = bbb.danceOff.dancers[tribe];
      ln(`${dancer} steps onto the dance floor for ${tribe}. The music drops.`);
      const tribeBeats = bbb.danceOff.beats[tribe] || [];
      for (const beat of tribeBeats) {
        ln(beat.text);
      }
      const score = bbb.danceOff.scores[tribe];
      ln(`Final dance score for ${tribe}: ${score.toFixed(2)}!`);
      sec();
    }

    // Winner
    const danceWinner = bbb.danceOff.winner;
    const winDancer = bbb.danceOff.dancers[danceWinner];
    ln(`${winDancer} TAKES IT! ${danceWinner} wins the tiebreaker dance-off!`);
    sec();
  }

  // --- Chris closer ---
  if (bbb.chrisCloser) {
    ln(bbb.chrisCloser);
  }

  // Final score summary
  const scores = bbb.tribeScores;
  const scoreStr = Object.entries(scores).map(([t, s]) => `${t}: ${s}`).join(' | ');
  ln(`Final score — ${scoreStr}.`);
  sec();
}

export function rpBuildBeachBlanketBogusTitleCard(ep) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return '';
  return _bbbShell(`
    <div style="text-align:center;padding:40px 20px;">
      <div style="font-size:32px;font-weight:900;letter-spacing:3px;color:#fff;text-shadow:3px 3px 0 #c4421a;">BEACH BLANKET BOGUS</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px;">${bbb.chrisOpener}</div>
    </div>
  `, ep);
}

function _bbbShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Inter:wght@400;600;700;900&display=swap');
.bbb-shell{font-family:'Inter',sans-serif;color:#1b2838;background:linear-gradient(180deg,#ff6b35 0%,#f7931e 15%,#ffd700 30%,#87CEEB 50%,#0d6986 75%,#0a3d5c 100%);padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px}
.bbb-header{background:rgba(0,0,0,0.3);backdrop-filter:blur(8px);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid rgba(255,255,255,0.15)}
.bbb-title{font-family:'Bowlby One SC',sans-serif;font-size:18px;color:#fff;text-shadow:2px 2px 0 #c4421a;letter-spacing:2px}
.bbb-subtitle{font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:3px;text-transform:uppercase}
</style>
<div class="bbb-shell">
  <div class="bbb-header">
    <div>
      <div class="bbb-title">BEACH BLANKET BOGUS</div>
      <div class="bbb-subtitle">Surf · Build · Dance</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:2px;">EPISODE ${ep.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

export function beachBogusRevealNext(stateKey, totalSteps) {}
export function beachBogusRevealAll(stateKey, totalSteps) {}
