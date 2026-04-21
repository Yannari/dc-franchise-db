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

export function simulateBeachBlanketBogus(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    chrisOpener: 'Chris stands on a fake beach set. Behind him: a pool full of sharks, a pile of sand, and a disco ball. "Welcome to Beach Blanket Bogus!"',
    chrisCloser: '"And that\'s a wrap on Beach Blanket Bogus! One tribe is safe. The other... not so much."',
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

  // --- SURF PHASE ---
  _simulateSurf(ep, tribeMembers, result);

  // Winner/loser determination from tribeScores
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

  updateChalRecord(ep);

  if (!gs.popularity) gs.popularity = {};
}

export function _textBeachBlanketBogus(ep, ln, sec) {
  const bbb = ep.beachBlanketBogus;
  if (!bbb) return;
  ln('Chris announces the Beach Blanket Bogus challenge — three beach-themed events on the film lot.');
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
