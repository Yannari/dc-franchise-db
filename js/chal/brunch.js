// js/chal/brunch.js
import { BRUNCH_EATOFF_DISH, BRUNCH_FOOD_CATEGORIES, BRUNCH_FOOD_POOL, BRUNCH_REACTIONS, gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { wRandom } from '../alliances.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

export function simulateBrunchOfDisgustingness(ep) {
  const teams = ep.brunchTeams;
  if (!teams) return;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // ══════════════════════════════════════════════════════════════════
  // PHASE 1: CABIN DYNAMICS
  // ══════════════════════════════════════════════════════════════════

  const crossoverNames = new Set((teams.crossovers || []).map(c => c.name));
  const crossoverMap = {}; // name → { from, to }
  (teams.crossovers || []).forEach(c => { crossoverMap[c.name] = c; });

  // ── Initial cohesion: average pairwise bond, scaled 0–1 ──
  function _calcCohesion(members) {
    if (members.length < 2) return 0.5;
    let sum = 0, count = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        sum += getBond(members[i], members[j]);
        count++;
      }
    }
    // Bond range -10 to +10 → cohesion 0 to 1
    return Math.max(0, Math.min(1, (sum / count + 10) / 20));
  }

  let boysCohesion = _calcCohesion(teams.boys);
  let girlsCohesion = _calcCohesion(teams.girls);

  const boysEvents = [];
  const girlsEvents = [];

  // ── Helper: pick N players sorted by stat combo (highest first) ──
  function _topBy(members, statFn, n) {
    return members.slice().sort((a, b) => statFn(pStats(b)) - statFn(pStats(a))).slice(0, n);
  }

  // ── Helper: pick worst-bonded outsider (lowest avg bond to rest of group) ──
  function _outsider(members) {
    return members.reduce((worst, name) => {
      const avg = members.filter(n => n !== name).reduce((s, n) => s + getBond(name, n), 0) / Math.max(1, members.length - 1);
      return avg < worst.avg ? { name, avg } : worst;
    }, { name: members[0], avg: Infinity }).name;
  }

  // ── Helper: pick two players with bond closest to a target value ──
  function _pairByBond(members, targetBond) {
    let bestPair = [members[0], members[1] || members[0]], bestDist = Infinity;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const dist = Math.abs(getBond(members[i], members[j]) - targetBond);
        if (dist < bestDist) { bestDist = dist; bestPair = [members[i], members[j]]; }
      }
    }
    return bestPair;
  }

  // ── Event generators — each returns an event object or null ──

  function _evPhysicalContest(members, cohesion) {
    if (members.length < 2) return null;
    const [champ] = _topBy(members, s => s.boldness * 0.5 + s.physical * 0.5, 1);
    const pr = pronouns(champ);
    const arch = players.find(p => p.name === champ)?.archetype || '';
    const delta = 0.2;
    members.forEach(m => { if (m !== champ) addBond(champ, m, delta); });
    const texts = [
      `Someone suggests a push-up contest to kill time. ${champ} barely breaks a sweat — ${pr.sub} ${pr.sub === 'they' ? 'win' : 'wins'} going away. The team ${pr.sub === 'they' ? 'groan' : 'groans'} and laugh in equal measure.`,
      `${champ} challenges the cabin to an arm-wrestling bracket and ${pr.sub === 'they' ? 'go' : 'goes'} undefeated. "Okay, okay, we get it," someone says. ${pr.Sub} just smiles.`,
      `Push-up contest. ${champ} drops fifty without stopping. The rest of the team stares. "Show-off," someone mutters — but they're grinning when they say it.`,
    ];
    if (arch === 'jock' || arch === 'hero') texts.push(`${champ} turns the physical contest into a full workout circuit. The team groans. ${pr.Sub} doesn't understand why they're not joining in.`);
    if (arch === 'villain' || arch === 'mastermind') texts.push(`${champ} suggests the contest like it's a casual idea. ${pr.Sub} wins easily and says nothing. The team is unnerved in a way they can't quite name.`);
    return {
      type: 'brunchCabin', subtype: 'bonding',
      players: members,
      text: _rp(texts),
      badgeText: 'PHYSICAL CONTEST', badgeClass: 'gold',
    };
  }

  function _evGroupTrashTalk(members, cohesion, teamLabel, otherLabel) {
    const hasCrossoverQuiet = members.some(m => crossoverNames.has(m));
    const quietOnes = members.filter(m => crossoverNames.has(m));
    const loudOnes = members.filter(m => !crossoverNames.has(m));
    const speaker = loudOnes.length ? _rp(loudOnes) : _rp(members);
    const pr = pronouns(speaker);
    const cohDelta = 0.1;
    // Only add to non-crossover bonds
    for (let i = 0; i < loudOnes.length; i++) for (let j = i + 1; j < loudOnes.length; j++) addBond(loudOnes[i], loudOnes[j], 0.08);
    const texts = [
      `${speaker} kicks things off by doing a dead-on impression of the ${otherLabel} team's strategy. The cabin erupts. ${hasCrossoverQuiet ? `${quietOnes[0]} goes very quiet.` : ''}`,
      `"Do you think they're nervous?" ${speaker} asks about the ${otherLabel}. "They should be," someone shoots back. Laughter.${hasCrossoverQuiet ? ` ${quietOnes[0]} stares at the ceiling.` : ''}`,
      `The cabin gets going on the ${otherLabel} team — exaggerated impressions, worst-case predictions. ${speaker} ${pr.sub === 'they' ? 'lead' : 'leads'} the charge.${hasCrossoverQuiet ? ` ${quietOnes[0]} forces a smile.` : ''}`,
    ];
    return {
      type: 'brunchCabin', subtype: 'bonding',
      players: loudOnes.length ? loudOnes : members,
      text: _rp(texts),
      badgeText: 'TRASH TALK', badgeClass: 'gold',
    };
  }

  function _evCardGame(members, cohesion) {
    if (members.length < 2) return null;
    const strategists = _topBy(members, s => s.strategic * 0.6 + s.mental * 0.4, 2);
    const [a, b] = strategists;
    const pr = pronouns(a);
    addBond(a, b, 0.1);
    const arch = players.find(p => p.name === a)?.archetype || '';
    const texts = [
      `Someone finds a deck of cards. ${a} ${pr.sub === 'they' ? 'clean' : 'cleans'} up — reading tells, counting cards, bluffing confidently. ${b} is the only one who gives ${pr.obj} a real fight.`,
      `Card game in the cabin. ${a} and ${b} go back and forth for an hour while the others drift off. Something between them clicks.`,
      `${a} wins three hands in a row. ${b} accuses ${pr.obj} of cheating with a grin. "I'm just better," ${a} says.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'bonding',
      players: [a, b],
      text: _rp(texts),
      badgeText: 'CARD GAME', badgeClass: 'gold',
    };
  }

  function _evHostImpressions(members, cohesion) {
    const host = seasonConfig.host || 'Chris';
    const performer = _rp(_topBy(members, s => s.boldness * 0.7 + s.social * 0.3, 2));
    const pr = pronouns(performer);
    const boldScore = pStats(performer).boldness * 0.08 + Math.random() * 0.3;
    const success = boldScore >= 0.55;
    if (success) {
      const arch = players.find(p => p.name === performer)?.archetype || '';
      members.forEach(m => { if (m !== performer) addBond(performer, m, 0.08); });
      const texts = [
        `${performer} does a ${host} impression so accurate that half the cabin are crying with laughter. Even the quiet ones crack.`,
        `"Campers! I have a DRAMATIC announcement!" ${performer} bellows in a perfect ${host} voice. The cabin loses it.`,
        `${performer} adopts ${host}'s cadence, the raised eyebrow, the dramatic pause — nails it completely. The team needs a minute to breathe.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'bonding',
        players: [performer],
        text: _rp(texts),
        badgeText: 'HOST IMPRESSION', badgeClass: 'gold',
      };
    } else {
      const texts = [
        `${performer} attempts a ${host} impression. It lands somewhere between sad and alarming. ${pr.Sub} laugh${pr.sub === 'they' ? '' : 's'} it off.`,
        `${performer}'s impression of ${host} is... a choice. The cabin offers polite applause.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: [performer],
        text: _rp(texts),
        badgeText: 'HOST IMPRESSION', badgeClass: 'info',
      };
    }
  }

  function _evLateNightTalk(members, cohesion) {
    // Two players with mid-range bond (neither friends nor enemies)
    const [a, b] = _pairByBond(members, 1);
    const pr = pronouns(a);
    const prB = pronouns(b);
    addBond(a, b, 0.3);
    const texts = [
      `Lights-out, but ${a} and ${b} are still talking — quiet enough not to wake the others. By the time they stop, something has shifted.`,
      `${a} admits something ${pr.sub === 'they' ? "they haven't" : pr.sub + " hasn't"} said out loud before. ${b} listens. Really listens. They don't talk strategy for the rest of the night.`,
      `${a} and ${b} end up in the same corner of the cabin after everyone else falls asleep. Real talk — not game talk. The kind that changes things.`,
      `"I didn't think I'd actually like you," ${b} tells ${a} at some point after midnight. ${a} doesn't have a response. ${pr.Sub} just laugh${pr.sub === 'they' ? '' : 's'}.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'bonding',
      players: [a, b],
      text: _rp(texts),
      badgeText: 'LATE NIGHT TALK', badgeClass: 'gold',
    };
  }

  function _evUnderdogMoment(members, cohesion) {
    // Lowest combined stats (endurance + physical) does something impressive
    const underdog = members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sA.endurance * 0.4 + sA.boldness * 0.3 + sA.physical * 0.3) - (sB.endurance * 0.4 + sB.boldness * 0.3 + sB.physical * 0.3);
    })[0];
    const pr = pronouns(underdog);
    members.forEach(m => { if (m !== underdog) addBond(underdog, m, 0.15); });
    const arch = players.find(p => p.name === underdog)?.archetype || '';
    const texts = [
      `Nobody expected ${underdog} to have that in ${pr.obj}. ${pr.Sub} ${pr.sub === 'they' ? 'share' : 'shares'} something that earns real respect — quiet, offhand, undeniable. The team is recalibrating.`,
      `${underdog} says something in passing that stops the whole cabin cold. It's smarter, funnier, or bolder than anyone expected. The team looks at ${pr.obj} differently after.`,
      `${underdog} takes on a task the others didn't think ${pr.sub} could handle. Not only does ${pr.sub} handle it — ${pr.sub} ${pr.sub === 'they' ? 'make' : 'makes'} it look easy. Quiet respect from the cabin.`,
    ];
    if (arch === 'underdog') texts.push(`${underdog} shrugs off the surprise like ${pr.sub === 'they' ? 'they\'ve' : 'they\'ve'} been waiting for someone to notice. "I keep saying," ${pr.sub} says. Nobody has a comeback.`);
    return {
      type: 'brunchCabin', subtype: 'bonding',
      players: [underdog],
      text: _rp(texts),
      badgeText: 'UNDERDOG MOMENT', badgeClass: 'gold',
    };
  }

  // ── POWER DYNAMICS events ──

  function _evDominancePlay(members, cohesion) {
    const [power] = _topBy(members, s => s.strategic, 1);
    const pr = pronouns(power);
    const arch = players.find(p => p.name === power)?.archetype || '';
    const lowBondPairs = members.filter(m => m !== power && getBond(power, m) < 0);
    lowBondPairs.forEach(m => addBond(power, m, -0.2));
    const resenter = lowBondPairs.length ? lowBondPairs[0] : null;
    const rPr = resenter ? pronouns(resenter) : null;
    const texts = [
      `${power} takes charge of the cabin without being asked — assigns spots, sets expectations. Most go along with it. ${resenter ? `${resenter} does not. ${rPr.Sub} ${rPr.sub === 'they' ? 'say' : 'says'} nothing out loud, but ${rPr.sub === 'they' ? 'file' : 'files'} it away.` : 'No one pushes back. That might be the problem.'}`,
      `${power} starts reorganizing how the cabin operates. ${pr.Sub} ${pr.sub === 'they' ? 'frame' : 'frames'} it as being helpful. It's not quite that. ${resenter ? `${resenter} can tell the difference.` : `The team clocks it.`}`,
      `${power} runs the cabin like ${pr.sub === 'they' ? 'they run' : pr.sub + ' runs'} everything — with quiet authority. ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} wrong. But no one asked. ${resenter ? `${resenter} watches ${pr.obj} with flat eyes.` : ''}`,
    ];
    if (arch === 'mastermind' || arch === 'villain') texts.push(`${power} doesn't grandstand. ${pr.Sub} ${pr.sub === 'they' ? 'just rearrange' : 'just rearranges'} the pieces. By the time anyone notices, it's already done. ${resenter ? `${resenter} noticed.` : ''}`);
    return {
      type: 'brunchCabin', subtype: 'power',
      players: resenter ? [power, resenter] : [power],
      text: _rp(texts),
      badgeText: 'DOMINANCE PLAY', badgeClass: 'red',
    };
  }

  function _evOutsiderRecruit(members, cohesion) {
    const [power] = _topBy(members, s => s.strategic, 1);
    const outsider = _outsider(members.filter(m => m !== power));
    const pr = pronouns(power);
    const prO = pronouns(outsider);
    const strategicScore = pStats(power).strategic * 0.07 + Math.random() * 0.3;
    const seeThrough = members.filter(m => m !== power && m !== outsider && pStats(m).intuition * 0.07 + Math.random() * 0.3 >= 0.55);
    const success = strategicScore >= 0.55;
    if (success) addBond(power, outsider, 0.25);
    else addBond(power, outsider, 0.05);
    const texts = success ? [
      `${power} pulls ${outsider} aside — quiet, deliberate. ${prO.Sub} ${prO.sub === 'they' ? 'weren\'t' : 'wasn\'t'} expecting it. By the time they rejoin the group, something has changed between them. ${seeThrough.length ? `${seeThrough[0]} saw the whole thing.` : ''}`,
      `${power} notices ${outsider} drifting and moves in — not aggressively, just... present. ${prO.Sub} ${prO.sub === 'they' ? 'seem' : 'seems'} grateful. ${seeThrough.length ? `${seeThrough[0]} makes a mental note.` : ''}`,
    ] : [
      `${power} tries to bring ${outsider} into the fold. ${prO.Sub} ${prO.sub === 'they' ? 'smile' : 'smiles'} and nod but ${prO.sub === 'they' ? 'don\'t' : 'doesn\'t'} really engage. The gap doesn't close.`,
      `${power} reaches out to ${outsider}, but the timing is off. ${prO.Sub} can tell it's a play. ${prO.Sub} ${prO.sub === 'they' ? 'don\'t' : 'doesn\'t'} say so.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'power',
      players: [power, outsider],
      text: _rp(texts),
      badgeText: 'OUTSIDER RECRUIT', badgeClass: seeThrough.length ? 'red' : 'info',
    };
  }

  function _evAllianceReunion(members, cohesion) {
    // Look for two players with high bond (former allies feel like a bloc)
    const [a, b] = _pairByBond(members, 7);
    const bond = getBond(a, b);
    if (bond < 3) return null; // not allies — skip
    const others = members.filter(m => m !== a && m !== b);
    const noticeOne = others.length ? _rp(others) : null;
    const prN = noticeOne ? pronouns(noticeOne) : null;
    others.forEach(m => addBond(a, m, -0.1));
    others.forEach(m => addBond(b, m, -0.1));
    const texts = [
      `${a} and ${b} gravitate toward each other immediately — quiet signals, private glances. They don't need to say anything. They already have a plan. ${noticeOne ? `${noticeOne} ${prN.sub === 'they' ? 'watch' : 'watches'} them. ${prN.Sub} ${prN.sub === 'they' ? 'don\'t' : 'doesn\'t'} like it.` : ''}`,
      `Before anyone else settles in, ${a} and ${b} are already in the corner talking. Fast, low. Alliance mode. ${noticeOne ? `${noticeOne} clocks it immediately.` : 'Nobody says anything. Yet.'}`,
      `${a} and ${b} have history. The cabin reminds them both of it. They fall back into old patterns — and the others notice the shape of what they're looking at.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'power',
      players: noticeOne ? [a, b, noticeOne] : [a, b],
      text: _rp(texts),
      badgeText: 'POWER BLOC', badgeClass: 'red',
    };
  }

  function _evCallOutPowerPlayer(members, cohesion) {
    const [power] = _topBy(members, s => s.strategic, 1);
    const callerCandidates = members.filter(m => m !== power);
    if (!callerCandidates.length) return null;
    const caller = _rp(_topBy(callerCandidates, s => s.boldness, 2));
    const pr = pronouns(caller);
    const prP = pronouns(power);
    const boldScore = pStats(caller).boldness * 0.07 + Math.random() * 0.35;
    const success = boldScore >= 0.55;
    if (success) {
      addBond(caller, power, -0.4);
      const splits = members.filter(m => m !== caller && m !== power);
      splits.forEach(m => { if (Math.random() < 0.5) addBond(caller, m, 0.15); });
      const texts = [
        `"You're doing it again," ${caller} says to ${power} — not mean, just honest. The cabin goes very still. ${prP.Sub} ${prP.sub === 'they' ? 'don\'t' : 'doesn\'t'} argue. That's almost worse.`,
        `${caller} stops the conversation: "Let's be real about what's happening here." ${power} looks at ${pr.obj}. Something shifts in the room.`,
        `${caller} says out loud what the rest of the team was thinking. ${power} plays it cool. But everyone saw ${prP.posAdj} expression before ${prP.sub === 'they' ? 'they' : prP.sub} did.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'confrontation',
        players: [caller, power],
        text: _rp(texts),
        badgeText: 'CALLED OUT', badgeClass: 'red',
      };
    } else {
      addBond(caller, power, -0.1);
      const texts = [
        `${caller} tries to call out ${power}'s angle but ${pr.sub === 'they' ? 'fumble' : 'fumbles'} the delivery. It lands weird. Now ${pr.sub === 'they' ? 'they look' : pr.sub + ' looks'} like the problem.`,
        `${caller} takes a shot at ${power} and ${prP.sub === 'they' ? 'they deflect' : prP.sub + ' deflects'} effortlessly. The cabin sides with ${prP.obj}. ${caller} goes quiet.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'confrontation',
        players: [caller, power],
        text: _rp(texts),
        badgeText: 'FAILED CALLOUT', badgeClass: 'info',
      };
    }
  }

  function _evLineDrawn(members, cohesion) {
    if (members.length < 4) return null;
    // Build two factions by bond clustering
    const sorted = members.slice().sort((a, b) => {
      const avgA = members.filter(n => n !== a).reduce((s, n) => s + getBond(a, n), 0) / Math.max(1, members.length - 1);
      const avgB = members.filter(n => n !== b).reduce((s, n) => s + getBond(b, n), 0) / Math.max(1, members.length - 1);
      return avgB - avgA;
    });
    const factionA = sorted.slice(0, Math.floor(members.length / 2));
    const factionB = sorted.slice(Math.floor(members.length / 2));
    const outsiderPick = factionB[0]; // lowest avg bond must choose
    const prO = pronouns(outsiderPick);
    factionA.forEach((a, i) => factionA.slice(i + 1).forEach(b => addBond(a, b, 0.1)));
    factionB.forEach((a, i) => factionB.slice(i + 1).forEach(b => addBond(a, b, 0.1)));
    const texts = [
      `The cabin splits into two orbits — not hostile, just... separate. ${outsiderPick} is caught in the middle, choosing where to sit without making it obvious it's a choice.`,
      `Two groups form naturally over the course of the evening. ${outsiderPick} floats between them. Both groups notice. Neither says anything. Yet.`,
      `Lines are drawn in the cabin — not by argument, just by where people end up. ${outsiderPick} ${prO.sub === 'they' ? 'are' : 'is'} the swing vote in a game no one's officially started yet.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'power',
      players: members,
      text: _rp(texts),
      badgeText: 'FACTIONS FORM', badgeClass: 'red',
    };
  }

  // ── SOCIAL events ──

  function _evPeacemakerAttempt(members, cohesion) {
    const peace = _rp(_topBy(members, s => s.social * 0.6 + s.loyalty * 0.4, 2));
    const pr = pronouns(peace);
    const socialScore = pStats(peace).social * 0.07 + Math.random() * 0.3;
    const success = socialScore >= 0.5;
    if (success) {
      members.forEach((m, i) => members.slice(i + 1).forEach(n => addBond(m, n, 0.08)));
      const texts = [
        `${peace} works the cabin — a joke here, a genuine check-in there. By lights out, the tension has softened. ${pr.Sub} ${pr.sub === 'they' ? 'make' : 'makes'} it look effortless.`,
        `${peace} reads the room and adjusts. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} lecture anyone; ${pr.sub === 'they' ? 'they just' : pr.sub + ' just'} smooths the edges. The cabin breathes easier.`,
        `${peace} pulls the cabin back from the brink of a real argument — not with confrontation, just with timing and tone. The team doesn't fully clock what ${pr.sub} did. ${pr.Sub} doesn't need them to.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: [peace],
        text: _rp(texts),
        badgeText: 'PEACEMAKER', badgeClass: 'gold',
      };
    } else {
      members.forEach(m => { if (m !== peace) addBond(peace, m, -0.05); });
      const texts = [
        `${peace} tries to lighten the mood and reads it completely wrong. The cabin goes awkward. ${pr.Sub} ${pr.sub === 'they' ? 'go' : 'goes'} quiet after that.`,
        `${peace} steps in to defuse something and accidentally makes it worse. The team is polite about it. That almost makes it worse.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: [peace],
        text: _rp(texts),
        badgeText: 'MISFIRED PEACE', badgeClass: 'info',
      };
    }
  }

  function _evBreakdown(members, cohesion) {
    const vulnerable = _rp(_topBy(members, s => (10 - s.endurance) * 0.5 + (10 - s.boldness) * 0.5, 2));
    const helpers = _topBy(members.filter(m => m !== vulnerable), s => s.social * 0.7 + s.loyalty * 0.3, 2);
    const prV = pronouns(vulnerable);
    helpers.forEach(h => addBond(vulnerable, h, 0.3));
    const texts = [
      `${vulnerable} hits a wall — not dramatically, just quietly. ${helpers[0]} notices and sits with ${prV.obj}. The rest of the cabin gives them space.`,
      `Something in the cabin tips ${vulnerable} over — exhaustion, nerves, who knows. ${prV.Sub} ${prV.sub === 'they' ? 'don\'t' : 'doesn\'t'} ask for help. ${helpers[0]} offers it anyway.`,
      `${vulnerable} goes quiet in a way that's different from just quiet. ${helpers[0]} ${helpers.length > 1 ? `and ${helpers[1]} ` : ''}check on ${prV.obj}. It doesn't fix anything but it means something.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'social',
      players: [vulnerable, ...helpers.slice(0, 1)],
      text: _rp(texts),
      badgeText: 'COMFORT MOMENT', badgeClass: 'gold',
    };
  }

  function _evSharedExperience(members, cohesion) {
    const [a, b] = _pairByBond(members, 2);
    const prA = pronouns(a);
    addBond(a, b, 0.4);
    const texts = [
      `${a} and ${b} discover they're from the same place — or went through the same thing — or somehow ended up at the exact same crossroads once. The conversation runs three hours.`,
      `${a} brings up something from ${prA.posAdj} past and ${b} says "wait, me too." It stops both of them cold. The kind of coincidence that feels like more than that.`,
      `${a} and ${b} bond over something specific — a band, a job, a stupid thing that happened to both of them at separate points in their lives. The rest of the cabin doesn't quite get it. That's fine.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'social',
      players: [a, b],
      text: _rp(texts),
      badgeText: 'SHARED EXPERIENCE', badgeClass: 'gold',
    };
  }

  function _evIsolation(members, cohesion) {
    const isolated = _outsider(members);
    const prI = pronouns(isolated);
    const checkOns = _topBy(members.filter(m => m !== isolated), s => s.social * 0.6 + s.loyalty * 0.4, 2);
    const checker = checkOns.length ? checkOns[0] : null;
    const bothCheck = checkOns.length >= 2;
    const socialScore = checker ? pStats(checker).social * 0.07 + Math.random() * 0.3 : 0;
    const noticed = socialScore >= 0.45;
    if (noticed && checker) {
      addBond(isolated, checker, 0.2);
      const texts = [
        `${isolated} goes quiet in the corner. Most of the team doesn't notice — or pretends not to. ${checker} does. ${prI.Sub} ${prI.sub === 'they' ? 'get' : 'gets'} a check-in. A short one. But real.`,
        `${isolated} separates from the group — not dramatically, just drifts. ${checker} crosses the cabin and sits near ${prI.obj}. No big conversation. Just company.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: [isolated, checker],
        text: _rp(texts),
        badgeText: 'SOMEONE REACHES OUT', badgeClass: 'info',
      };
    } else {
      const texts = [
        `${isolated} sits apart from the group most of the night. Nobody comes over. ${prI.Sub} ${prI.sub === 'they' ? 'notice' : 'notices'} that too.`,
        `${isolated} goes through the motions — laughs at the right moments, says the right things — but ${prI.sub === 'they' ? 'they\'re' : prI.sub + '\'s'} not really there. Nobody picks up on it.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: [isolated],
        text: _rp(texts),
        badgeText: 'ISOLATION', badgeClass: 'info',
      };
    }
  }

  // ── CONFRONTATION events ──

  function _evWorstBondArgument(members, cohesion) {
    // Find the worst-bonded pair
    let worstPair = [members[0], members[1] || members[0]], worstBond = Infinity;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const b = getBond(members[i], members[j]);
        if (b < worstBond) { worstBond = b; worstPair = [members[i], members[j]]; }
      }
    }
    const [a, b] = worstPair;
    const prA = pronouns(a), prB = pronouns(b);
    addBond(a, b, -0.5);
    const witnesses = members.filter(m => m !== a && m !== b);
    witnesses.forEach(w => {
      const wBondA = getBond(w, a), wBondB = getBond(w, b);
      if (wBondA > wBondB) addBond(w, b, -0.1);
      else addBond(w, a, -0.1);
    });
    const arch = players.find(p => p.name === a)?.archetype || '';
    const texts = [
      `${a} and ${b} keep it civil for the first hour. Then something tips over — a word said wrong, an old grievance resurfacing. By the end it's personal. The cabin goes quiet.`,
      `It starts petty. ${a} says something ${b} doesn't like. ${b} says something back. Forty minutes later it's not petty anymore. The witnesses look anywhere but at each other.`,
      `The argument between ${a} and ${b} was inevitable. The cabin knew it was coming. Knowing doesn't make it easier to watch.`,
    ];
    if (arch === 'hothead') texts.push(`${a} doesn't ease into it — ${prA.sub === 'they' ? 'they go' : prA.sub + ' goes'} straight for the throat. ${b} didn't expect that. The cabin really didn't.`);
    return {
      type: 'brunchCabin', subtype: 'confrontation',
      players: [a, b],
      text: _rp(texts),
      badgeText: 'ARGUMENT', badgeClass: 'red',
    };
  }

  function _evCoattailsAccusation(members, cohesion) {
    // Accuser = high boldness+strategic, target = high social but lower strategic
    const accuser = _rp(_topBy(members, s => s.boldness * 0.5 + s.strategic * 0.5, 2));
    const targets = members.filter(m => m !== accuser).sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.social - sB.strategic) - (sA.social - sA.strategic);
    });
    if (!targets.length) return null;
    const target = targets[0];
    const prT = pronouns(target);
    const archT = players.find(p => p.name === target)?.archetype || '';
    const boldScore = pStats(accuser).boldness * 0.06 + pStats(accuser).strategic * 0.05 + Math.random() * 0.35;
    const success = boldScore >= 0.55;
    addBond(accuser, target, success ? -0.3 : -0.1);
    const texts = success ? [
      `${accuser} doesn't mince it: ${prT.sub === 'they' ? `"${target} are riding coattails and everyone here knows it."` : `"${target} is riding coattails and everyone here knows it."`} The cabin doesn't disagree. ${target} goes very still.`,
      `"Be honest — when's the last time you did anything to actually move us forward?" ${accuser} asks ${target} directly. The silence that follows has a shape.`,
    ] : [
      `${accuser} makes a crack about ${target} being along for the ride. ${target} laughs it off. The laugh lands. ${accuser} doesn't have a follow-up.`,
      `${accuser} tries to pin the coattails label on ${target}. ${prT.Sub} ${prT.sub === 'they' ? 'push' : 'pushes'} back clean. ${accuser} backs down. The cabin reads that.`,
    ];
    const archTexts = {
      'villain': [`${target} lets the accusation hang, then says something quiet and precise that reframes the whole conversation. ${accuser} is wrong-footed. Badly.`],
      'chaos-agent': [`${target} leans into it: "Yeah, maybe. And?" The cabin doesn't know what to do with that. Neither does ${accuser}.`],
      'hero': [`${target} stands ${prT.posAdj} ground: "I've been pulling my weight every step of the way." ${prT.Sub} ${prT.sub === 'they' ? 'mean' : 'means'} it. The cabin can tell.`],
    };
    const finalTexts = (archTexts[archT] || []).concat(texts);
    return {
      type: 'brunchCabin', subtype: 'confrontation',
      players: [accuser, target],
      text: _rp(finalTexts),
      badgeText: 'COATTAILS CALL', badgeClass: 'red',
    };
  }

  function _evManipulationAttempt(members, cohesion) {
    const [manipulator] = _topBy(members, s => s.strategic * 0.6 + s.boldness * 0.4, 1);
    const target = _outsider(members.filter(m => m !== manipulator));
    const prM = pronouns(manipulator);
    const archM = players.find(p => p.name === manipulator)?.archetype || '';
    const manipScore = pStats(manipulator).strategic * 0.07 + pStats(manipulator).social * 0.04 + Math.random() * 0.3;
    const backfires = manipScore < 0.55 && (members.filter(m => m !== manipulator && m !== target && pStats(m).intuition * 0.07 + Math.random() * 0.3 >= 0.5).length > 0);
    if (backfires) {
      addBond(manipulator, target, -0.3);
      members.filter(m => m !== manipulator && m !== target).forEach(m => addBond(manipulator, m, -0.15));
      const texts = [
        `${manipulator} tries to plant a seed — angle ${target} against someone else. It reads obvious to half the cabin. Silence hangs. ${prM.Sub} ${prM.sub === 'they' ? 'recover' : 'recovers'}, but the damage is in.`,
        `${manipulator} overplays ${prM.posAdj} hand with ${target}. It lands wrong. A few people exchange looks. Not good looks.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'confrontation',
        players: [manipulator, target],
        text: _rp(texts),
        badgeText: 'BACKFIRED PLAY', badgeClass: 'red',
      };
    } else {
      addBond(manipulator, target, 0.15);
      const texts = [
        `${manipulator} works on ${target} — careful, unhurried. ${target} doesn't notice the shape of it. By end of night, ${prM.sub === 'they' ? 'they\'ve' : prM.sub + '\'s'} moved a piece without touching the board.`,
        `${manipulator} talks to ${target} about the challenge, about strategy, about everything — but always steering. ${target} leaves the conversation feeling like ${prM.sub === 'they' ? 'they were' : prM.sub + ' was'} just being friendly.`,
      ];
      if (archM === 'mastermind' || archM === 'villain') texts.push(`${manipulator} lays the groundwork so carefully it barely looks like groundwork. ${target} is positioned. ${prM.Sub} just ${prM.sub === 'they' ? 'don\'t' : 'doesn\'t'} know it yet.`);
      return {
        type: 'brunchCabin', subtype: 'power',
        players: [manipulator, target],
        text: _rp(texts),
        badgeText: 'SUBTLE PLAY', badgeClass: 'info',
      };
    }
  }

  function _evFormerEnemies(members, cohesion) {
    // Find highest-tension pair
    let tPair = [members[0], members[1] || members[0]], tBond = Infinity;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const b = getBond(members[i], members[j]);
        if (b < tBond) { tBond = b; tPair = [members[i], members[j]]; }
      }
    }
    const [a, b] = tPair;
    const prA = pronouns(a);
    // Check for mediator
    const mediators = members.filter(m => m !== a && m !== b && pStats(m).social * 0.06 + pStats(m).loyalty * 0.04 >= 0.7);
    const mediator = mediators.length ? mediators[0] : null;
    const truce = (tBond >= -2) || (mediator && Math.random() < 0.5);
    if (truce) {
      addBond(a, b, 0.2);
      const texts = [
        `${a} and ${b} end up next to each other and can't really avoid it. They manage. More than manage — by the end they're talking. Actually talking. It surprises both of them.`,
        `${mediator ? `${mediator} puts ${a} and ${b} together without making it obvious. ` : ''}Forced proximity does what years of tension couldn't. ${a} and ${b} find some ground.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'social',
        players: mediator ? [a, b, mediator] : [a, b],
        text: _rp(texts),
        badgeText: 'UNEASY TRUCE', badgeClass: 'info',
      };
    } else {
      addBond(a, b, -0.2);
      const texts = [
        `${a} and ${b} being stuck in the same cabin was always going to be a problem. It is.`,
        `Whatever was between ${a} and ${b} before — it didn't go anywhere. The cabin feels smaller because of it.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'confrontation',
        players: [a, b],
        text: _rp(texts),
        badgeText: 'OLD TENSION', badgeClass: 'red',
      };
    }
  }

  // ── CROSSOVER events ──

  function _evCrossoverSkeptic(members, teamLabel, xover) {
    const skeptics = members.filter(m => m !== xover && getBond(xover, m) < 1);
    const skeptic = skeptics.length ? _rp(skeptics) : _rp(members.filter(m => m !== xover));
    if (!skeptic) return null;
    const prX = pronouns(xover);
    const prS = pronouns(skeptic);
    const trustScore = pStats(xover).social * 0.06 + Math.random() * 0.35;
    const earned = trustScore >= 0.5;
    if (earned) {
      addBond(xover, skeptic, 0.2);
      const texts = [
        `${skeptic} watches ${xover} from across the cabin — the ${teamLabel}-team outsider, the wildcard. ${prX.Sub} catches the look and ${prX.sub === 'they' ? 'don\'t' : 'doesn\'t'} flinch. Slowly, ${prS.sub} lets ${prS.posAdj} guard down.`,
        `${xover} doesn't try to prove anything. ${prX.Sub} just ${prX.sub === 'they' ? 'show' : 'shows'} up — present, easy, unbothered. The skepticism in the cabin softens.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'crossover',
        players: [xover, skeptic],
        text: _rp(texts),
        badgeText: 'EARNS TRUST', badgeClass: 'gold',
      };
    } else {
      addBond(xover, skeptic, -0.1);
      const texts = [
        `${skeptic} doesn't warm to ${xover}. ${prS.Sub} ${prS.sub === 'they' ? 'don\'t' : 'doesn\'t'} say it, but the team reads it. The crossover situation is complicated.`,
        `The team is polite to ${xover} but not fully open. ${xover} can feel the difference.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'crossover',
        players: [xover, skeptic],
        text: _rp(texts),
        badgeText: 'CROSSOVER TENSION', badgeClass: 'red',
      };
    }
  }

  function _evCrossoverTryHard(members, xover) {
    const prX = pronouns(xover);
    const awkward = pStats(xover).social * 0.05 + Math.random() * 0.4 < 0.5;
    const others = members.filter(m => m !== xover);
    if (awkward) {
      others.forEach(m => addBond(xover, m, -0.05));
      const texts = [
        `${xover} tries too hard — laughs too loud, agrees too fast, volunteers for everything twice. ${prX.Sub} ${prX.sub === 'they' ? 'want' : 'wants'} to fit in. It shows.`,
        `${xover} overcorrects. Every overture lands slightly off. The team is kind about it. That might be the worst part.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'crossover',
        players: [xover],
        text: _rp(texts),
        badgeText: 'TRIES TOO HARD', badgeClass: 'info',
      };
    } else {
      others.slice(0, 2).forEach(m => addBond(xover, m, 0.15));
      const texts = [
        `${xover} comes in warm and genuine and it actually works. ${prX.Sub} ${prX.sub === 'they' ? 'don\'t' : 'doesn\'t'} pretend to be someone ${prX.sub} ${prX.sub === 'they' ? 'aren\'t' : 'isn\'t'}. The team responds to that.`,
        `The crossover concern evaporates fast once ${xover} opens up. ${prX.Sub} ${prX.sub === 'they' ? 'fit' : 'fits'} in a way nobody expected.`,
      ];
      return {
        type: 'brunchCabin', subtype: 'crossover',
        players: [xover],
        text: _rp(texts),
        badgeText: 'GOOD FIT', badgeClass: 'gold',
      };
    }
  }

  function _evCrossoverVibes(members, teamLabel, xover) {
    const prX = pronouns(xover);
    const bond = members.filter(m => m !== xover).reduce((s, m) => s + getBond(xover, m), 0) / Math.max(1, members.length - 1);
    if (bond < -1) return null; // not vibing — skip this variant
    members.filter(m => m !== xover).forEach(m => addBond(xover, m, 0.1));
    const texts = [
      `${xover} wasn't supposed to mesh with the ${teamLabel} team. Turns out ${prX.sub === 'they' ? 'they' : prX.sub} ${prX.sub === 'they' ? 'do' : 'does'}. The cabin is legitimately surprised.`,
      `By the second hour, nobody is treating ${xover} like the outsider anymore. ${prX.Sub} ${prX.sub === 'they' ? 'slip' : 'slips'} right in.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'crossover',
      players: [xover],
      text: _rp(texts),
      badgeText: 'SURPRISE FIT', badgeClass: 'gold',
    };
  }

  // ── SHOWMANCE integration ──

  function _evShowmanceSplit(ep, crossoverEntry) {
    // Crossover separated from partner
    if (!seasonConfig.romance || seasonConfig.romance !== 'enabled') return null;
    if (!gs.showmances?.length) return null;
    const xName = crossoverEntry.name;
    const prX = pronouns(xName);
    const partner = gs.showmances.find(s => s.players.includes(xName) && !s.broken)?.players.find(p => p !== xName);
    if (!partner) return null;
    const texts = [
      `${xName} is on the wrong team for the night, separated from ${partner}. ${prX.Sub} ${prX.sub === 'they' ? 'keep' : 'keeps'} it together, but keeps glancing at the door.`,
      `The boys/girls split puts distance between ${xName} and ${partner}. ${prX.Sub} ${prX.sub === 'they' ? 'don\'t' : 'doesn\'t'} say anything about it, but the team can tell.`,
    ];
    return {
      type: 'brunchCabin', subtype: 'crossover',
      players: [xName],
      text: _rp(texts),
      badgeText: 'SEPARATED', badgeClass: 'info',
    };
  }

  // ── Build event pool for a team ──
  function _buildEventPool(members, cohesion, teamLabel, otherLabel, xoversOnTeam) {
    const pool = [];

    // Always-eligible events (will be filtered below)
    pool.push({ type: 'bonding', weight: (cohesion + 0.3) * 2,    gen: () => _evLateNightTalk(members, cohesion) });
    pool.push({ type: 'bonding', weight: (cohesion + 0.2) * 1.5,  gen: () => _evPhysicalContest(members, cohesion) });
    pool.push({ type: 'bonding', weight: (cohesion + 0.2) * 1.5,  gen: () => _evCardGame(members, cohesion) });
    pool.push({ type: 'bonding', weight: (cohesion + 0.2) * 1.2,  gen: () => _evGroupTrashTalk(members, cohesion, teamLabel, otherLabel) });
    pool.push({ type: 'bonding', weight: (cohesion + 0.1) * 1.2,  gen: () => _evHostImpressions(members, cohesion) });
    pool.push({ type: 'bonding', weight: 1.0,                      gen: () => _evUnderdogMoment(members, cohesion) });
    pool.push({ type: 'power',   weight: 1.8,                      gen: () => _evDominancePlay(members, cohesion) });
    pool.push({ type: 'power',   weight: 1.4,                      gen: () => _evOutsiderRecruit(members, cohesion) });
    pool.push({ type: 'power',   weight: members.length >= 3 ? 1.2 : 0,  gen: () => _evAllianceReunion(members, cohesion) });
    pool.push({ type: 'power',   weight: 1.3,                      gen: () => _evCallOutPowerPlayer(members, cohesion) });
    pool.push({ type: 'power',   weight: members.length >= 4 ? 1.1 : 0,  gen: () => _evLineDrawn(members, cohesion) });
    pool.push({ type: 'social',  weight: 1.2,                      gen: () => _evPeacemakerAttempt(members, cohesion) });
    pool.push({ type: 'social',  weight: 1.0,                      gen: () => _evBreakdown(members, cohesion) });
    pool.push({ type: 'social',  weight: 1.3,                      gen: () => _evSharedExperience(members, cohesion) });
    pool.push({ type: 'social',  weight: 0.9,                      gen: () => _evIsolation(members, cohesion) });
    pool.push({ type: 'confrontation', weight: (1.1 - cohesion) * 2.5, gen: () => _evWorstBondArgument(members, cohesion) });
    pool.push({ type: 'confrontation', weight: (1 - cohesion) * 2.0,   gen: () => _evCoattailsAccusation(members, cohesion) });
    pool.push({ type: 'confrontation', weight: (1 - cohesion) * 1.6,   gen: () => _evManipulationAttempt(members, cohesion) });
    pool.push({ type: 'confrontation', weight: (1.1 - cohesion) * 1.4, gen: () => _evFormerEnemies(members, cohesion) });
    // Crossover events for each crossover player on this team
    xoversOnTeam.forEach(xName => {
      pool.push({ type: 'crossover', weight: 1.5, gen: () => _evCrossoverSkeptic(members, teamLabel, xName) });
      pool.push({ type: 'crossover', weight: 1.2, gen: () => _evCrossoverTryHard(members, xName) });
      pool.push({ type: 'crossover', weight: 1.0, gen: () => _evCrossoverVibes(members, teamLabel, xName) });
    });

    return pool;
  }

  // ── Pick 7-8 events per team ──
  function _pickEvents(members, cohesion, teamLabel, otherLabel) {
    if (members.length === 0) return [];
    const events = [];
    const xoversOnTeam = members.filter(m => crossoverNames.has(m));
    const pool = _buildEventPool(members, cohesion, teamLabel, otherLabel, xoversOnTeam);
    const eventTarget = 7 + (Math.random() < 0.5 ? 1 : 0); // 7 or 8
    let hasPowerEvent = false;
    const usedTypes = new Set();

    // Guarantee 1 power event first
    const powerPool = pool.filter(e => e.type === 'power' && e.weight > 0);
    if (powerPool.length) {
      const picked = wRandom(powerPool, e => e.weight);
      if (picked) {
        const ev = picked.gen();
        if (ev) { events.push(ev); hasPowerEvent = true; usedTypes.add(picked.type + '_' + picked.gen.toString().slice(0,30)); }
      }
    }

    // Crossover separation events for showmances
    if (seasonConfig.romance === 'enabled') {
      (teams.crossovers || []).filter(c => members.includes(c.name)).forEach(c => {
        const sepEv = _evShowmanceSplit(ep, c);
        if (sepEv && events.length < eventTarget) events.push(sepEv);
      });
    }

    // Fill remaining events from weighted pool
    let attempts = 0;
    while (events.length < eventTarget && attempts < 60) {
      attempts++;
      const remaining = pool.filter(e => {
        if (e.weight <= 0) return false;
        // Avoid picking power dominance twice in a row
        if (events.length && events[events.length - 1].subtype === 'power' && e.type === 'power') return false;
        return true;
      });
      if (!remaining.length) break;
      const picked = wRandom(remaining, e => e.weight);
      if (!picked) break;
      const ev = picked.gen();
      if (ev) events.push(ev);
    }

    return events;
  }

  const boysXovers = teams.boys.filter(m => crossoverNames.has(m));
  const girlsXovers = teams.girls.filter(m => crossoverNames.has(m));

  const pickedBoysEvents = _pickEvents(teams.boys, boysCohesion, 'boys', 'girls');
  const pickedGirlsEvents = _pickEvents(teams.girls, girlsCohesion, 'girls', 'boys');

  // Update cohesion based on events
  pickedBoysEvents.forEach(e => {
    if (e.subtype === 'bonding') boysCohesion = Math.min(1, boysCohesion + 0.05);
    else if (e.subtype === 'confrontation') boysCohesion = Math.max(0, boysCohesion - 0.05);
  });
  pickedGirlsEvents.forEach(e => {
    if (e.subtype === 'bonding') girlsCohesion = Math.min(1, girlsCohesion + 0.05);
    else if (e.subtype === 'confrontation') girlsCohesion = Math.max(0, girlsCohesion - 0.05);
  });

  // ── Showmance moments (comfort = same team, separation already handled above) ──
  const personalScores = {};
  gs.activePlayers.forEach(n => { personalScores[n] = 0; });
  const phases = { cabin: [...pickedBoysEvents, ...pickedGirlsEvents] };
  if (seasonConfig.romance === 'enabled') {
    _checkShowmanceChalMoment(ep, 'cabin', phases, personalScores, 'partner_present', teams.boys);
    _checkShowmanceChalMoment(ep, 'cabin', phases, personalScores, 'partner_present', teams.girls);
  }

  // ── Store cabin results ──
  ep.brunch = {
    cabinEvents: { boys: pickedBoysEvents, girls: pickedGirlsEvents },
    teamCohesion: { boys: boysCohesion, girls: girlsCohesion },
    courses: [],
    crossTeamBreaks: [],
    eatOff: null,
    score: { boys: 0, girls: 0 },
    winningTeam: null,
    losingTeam: null,
    mvpEater: null,
    worstEater: null,
    postCabinEvents: { boys: [], girls: [] },
    playerEatScores: {},
  };

  // ── Inject cabin events as camp events ──
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  pickedBoysEvents.concat(pickedGirlsEvents).forEach(e => {
    ep.campEvents[campKey].pre.push(e);
  });

  // ══════════════════════════════════════════════════════════════════
  // PHASE 2: 9-COURSE EATING CHALLENGE
  // ══════════════════════════════════════════════════════════════════

  // Initialise per-player eat scores
  const playerEatScores = ep.brunch.playerEatScores;
  [...teams.boys, ...teams.girls].forEach(n => { playerEatScores[n] = 0; });

  // Track chain-vomit penalty carry from previous course
  const chainVomitPenalty = {}; // name → bool (true = affected last course)
  [...teams.boys, ...teams.girls].forEach(n => { chainVomitPenalty[n] = false; });

  // Dish selection state
  const usedDishNames = new Set();
  let lastCategory = null;

  function _pickDish() {
    // No same category twice in a row; pick from remaining categories first
    const availableCategories = BRUNCH_FOOD_CATEGORIES.filter(c => c !== lastCategory);
    // Shuffle and pick a category
    const catPool = availableCategories.slice().sort(() => Math.random() - 0.5);
    for (const cat of catPool) {
      const catDishes = BRUNCH_FOOD_POOL[cat].filter(d => !usedDishNames.has(d.name));
      if (catDishes.length) {
        const dish = _rp(catDishes);
        usedDishNames.add(dish.name);
        lastCategory = cat;
        return dish;
      }
    }
    // Fallback: any unused dish
    for (const cat of BRUNCH_FOOD_CATEGORIES) {
      const catDishes = BRUNCH_FOOD_POOL[cat].filter(d => !usedDishNames.has(d.name));
      if (catDishes.length) {
        const dish = _rp(catDishes);
        usedDishNames.add(dish.name);
        lastCategory = cat;
        return dish;
      }
    }
    // Absolute fallback: reuse
    const allDishes = BRUNCH_FOOD_CATEGORIES.flatMap(c => BRUNCH_FOOD_POOL[c]);
    return _rp(allDishes);
  }

  function _refusalChance(name, dish, teamCohesion) {
    const s = pStats(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    const cat = dish.category;
    let chance = (10 - s.boldness) * 0.02;
    // Category-specific archetype modifiers
    if ((cat === 'morally-questionable' || cat === 'meat-gross') && (arch === 'hero' || arch === 'loyal-soldier')) chance += 0.10;
    if (cat === 'bug-gross' && s.boldness < 5 && s.social > 6) chance += 0.10;
    if (cat === 'texture-gross' && s.endurance < 5) chance += 0.10;
    if (cat === 'mystery-gross' && s.boldness < 5) chance += 0.10;
    // Cohesion modifier
    if (teamCohesion < 0.3) chance += 0.05;
    // Wildcard
    chance += 0.08;
    // Chain vomit carry
    if (chainVomitPenalty[name]) chance += 0.05;
    return Math.min(0.85, chance);
  }

  function _eatRoll(name, teamCohesion, convincePenalty, courseNum) {
    const s = pStats(name);
    // Escalating difficulty: courses get harder as the brunch goes on
    const courseFatigue = (courseNum - 1) * 0.015; // course 1: 0, course 5: 0.06, course 9: 0.12
    let roll = s.boldness * 0.03 + s.endurance * 0.02 + s.strategic * 0.01 + Math.random() * 0.20 - courseFatigue;
    if (teamCohesion > 0.6) roll += 0.02;
    if (chainVomitPenalty[name]) roll -= 0.06;
    if (convincePenalty) roll -= 0.04;
    return roll;
  }

  function _eatResult(roll) {
    if (roll >= 0.48) return 'dominant';
    if (roll >= 0.38) return 'pass';
    if (roll >= 0.25) return 'struggle';
    return 'fail';
  }

  function _reactionText(name, result, dish) {
    const pr = pronouns(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    if (result === 'dominant') {
      const pool = (BRUNCH_REACTIONS.eatArchetype[arch] || []).concat(BRUNCH_REACTIONS.eatDominant);
      return _rp(pool)(name, pr, dish.name);
    }
    if (result === 'pass') {
      const pool = (BRUNCH_REACTIONS.eatArchetype[arch] || []).concat(BRUNCH_REACTIONS.eatSuccess);
      return _rp(pool)(name, pr, dish.name);
    }
    if (result === 'struggle') {
      return _rp(BRUNCH_REACTIONS.eatStruggle)(name, pr, dish.name);
    }
    // fail
    return _rp(BRUNCH_REACTIONS.eatFail)(name, pr, dish.name);
  }

  function _refusalText(name, dish) {
    const pr = pronouns(name);
    const cat = dish.category;
    if (cat === 'morally-questionable') return _rp(BRUNCH_REACTIONS.refuseMoral)(name, pr, dish.name);
    if (cat === 'mystery-gross') return _rp(BRUNCH_REACTIONS.refuseDisgust)(name, pr, dish.name);
    const allRefuse = BRUNCH_REACTIONS.refuseMoral.concat(BRUNCH_REACTIONS.refuseDisgust).concat(BRUNCH_REACTIONS.refuseProtest);
    return _rp(allRefuse)(name, pr, dish.name);
  }

  // ── Cross-team break generator ──
  function _generateCrossTeamBreak(courseNum) {
    const events = [];
    const allPlayers = [...teams.boys, ...teams.girls];

    // 1. Showmance encouragement
    if (seasonConfig.romance === 'enabled' && gs.showmances?.length) {
      const sm = gs.showmances.find(s => !s.broken && teams.boys.includes(s.players[0]) !== teams.boys.includes(s.players[1]));
      if (sm) {
        const [a, b] = sm.players;
        const prA = pronouns(a);
        addBond(a, b, 0.1);
        events.push({
          type: 'brunchBreak', subtype: 'showmance',
          players: [a, b],
          text: _rp(BRUNCH_REACTIONS.convincedCrossTeam)(a, prA, b),
          badgeText: 'SHOWMANCE BOOST', badgeClass: 'gold',
        });
      }
    }

    // 2. Strong bond encouragement (bond ≥ 4, cross-team)
    for (let i = 0; i < teams.boys.length && events.length < 2; i++) {
      for (let j = 0; j < teams.girls.length; j++) {
        if (getBond(teams.boys[i], teams.girls[j]) >= 4) {
          const a = teams.boys[i], b = teams.girls[j];
          const prA = pronouns(a);
          addBond(a, b, 0.05);
          events.push({
            type: 'brunchBreak', subtype: 'bonding',
            players: [a, b],
            text: `${a} and ${b} share a look across the tables. A nod. Something silent passes between them.`,
            badgeText: 'ALLY CHECK-IN', badgeClass: 'info',
          });
          break;
        }
      }
    }

    // 3. Trash talk
    const boysTrash = _rp(teams.boys);
    const girlsTrash = _rp(teams.girls.filter(n => n !== boysTrash) || teams.girls);
    const prBT = pronouns(boysTrash);
    events.push({
      type: 'brunchBreak', subtype: 'rivalry',
      players: [boysTrash, girlsTrash],
      text: _rp([
        `${boysTrash} stares at the girls' table and announces, "We're up. Just saying." ${girlsTrash} doesn't blink.`,
        `"How's your stomach doing over there?" ${boysTrash} calls across the room. ${girlsTrash} waves back with a smile that isn't friendly.`,
        `${girlsTrash} looks at ${boysTrash}. "I've seen you wince twice." ${prBT.Sub} ${prBT.sub === 'they' ? 'have' : 'has'} no response.`,
      ]),
      badgeText: 'TRASH TALK', badgeClass: 'red',
    });

    // 4. Strategic whisper (cross-team intel)
    const whisperer = _rp(allPlayers);
    const listener = _rp(allPlayers.filter(n => n !== whisperer));
    addBond(whisperer, listener, 0.08);
    events.push({
      type: 'brunchBreak', subtype: 'strategic',
      players: [whisperer, listener],
      text: `During the break, ${whisperer} sidles close to ${listener}. Something passes between them — low, quick. Both look away.`,
      badgeText: 'STRATEGIC WHISPER', badgeClass: 'info',
    });

    // 5. Accusation of throwing or defection temptation
    const accusePool = allPlayers.filter(n => playerEatScores[n] < 0);
    if (accusePool.length) {
      const suspected = _rp(accusePool);
      const accuser = _rp(allPlayers.filter(n => n !== suspected));
      addBond(accuser, suspected, -0.15);
      const prSus = pronouns(suspected);
      events.push({
        type: 'brunchBreak', subtype: 'confrontation',
        players: [accuser, suspected],
        text: _rp([
          `${accuser} watches ${suspected} and says nothing. Just watches. ${suspected} knows exactly what ${prSus.sub} ${prSus.sub === 'they' ? 'are' : 'is'} being accused of.`,
          `"You're throwing this." ${accuser} says it flat. ${suspected} opens ${prSus.posAdj} mouth. Closes it.`,
        ]),
        badgeText: 'THROWING ACCUSATION', badgeClass: 'red',
      });
    }

    return events;
  }

  // ── Main 9-course loop ──
  for (let courseNum = 1; courseNum <= 9; courseNum++) {
    const dish = _pickDish();
    const boysTeamCoh = ep.brunch.teamCohesion.boys;
    const girlsTeamCoh = ep.brunch.teamCohesion.girls;

    const boysResults = [];
    const girlsResults = [];

    // Reset chain vomit tracking for this course
    let chainVomitTriggered = false;
    let chainVomitTriggerName = null;
    const chainVomitAffected = [];
    const chainVomitReactions = [];

    // Helper to process one team's eating
    const _processTeam = (members, teamCoh) => {
      const results = [];
      for (const name of members) {
        const refChance = _refusalChance(name, dish, teamCoh);
        let refused = Math.random() < refChance;
        let convincedBy = null;
        let convincePenalty = false;

        if (refused) {
          // Pressure to eat — find best convincer on team
          const convincerCandidates = members.filter(m => m !== name);
          if (convincerCandidates.length) {
            const convincer = convincerCandidates.reduce((best, c) =>
              pStats(c).social * 0.04 + pStats(c).loyalty * 0.03 >
              pStats(best).social * 0.04 + pStats(best).loyalty * 0.03 ? c : best
            );
            const convincerScore = pStats(convincer).social * 0.04 + pStats(convincer).loyalty * 0.03;
            const resistance = (10 - pStats(name).boldness) * 0.03 + (10 - pStats(name).temperament) * 0.04;
            if (convincerScore > resistance + Math.random() * 0.1) {
              refused = false;
              convincedBy = convincer;
              convincePenalty = true;
              addBond(name, convincer, 0.1);
            }
          }

          // Cross-team partner pressure (showmance or bond ≥ 4)
          if (refused && seasonConfig.romance === 'enabled') {
            const otherTeam = members === teams.boys ? teams.girls : teams.boys;
            const crossPartner = otherTeam.find(p =>
              (gs.showmances?.find(s => !s.broken && s.players.includes(name) && s.players.includes(p))) ||
              getBond(name, p) >= 4
            );
            if (crossPartner) {
              const cScore = pStats(crossPartner).social * 0.04 + pStats(crossPartner).loyalty * 0.03;
              const resistance = (10 - pStats(name).boldness) * 0.03 + (10 - pStats(name).temperament) * 0.04;
              if (cScore > resistance + Math.random() * 0.1) {
                refused = false;
                convincedBy = crossPartner;
                convincePenalty = true;
                // Teammates notice and resent the outside influence
                members.filter(m => m !== name).forEach(m => addBond(crossPartner, m, -0.3));
              }
            }
          }
        }

        if (refused) {
          const refText = _refusalText(name, dish);
          playerEatScores[name] -= 2;
          results.push({ player: name, roll: 0, result: 'refused', reaction: refText });
          continue;
        }

        const roll = _eatRoll(name, teamCoh, convincePenalty, courseNum);
        const result = _eatResult(roll);
        const reaction = convincedBy
          ? _rp(BRUNCH_REACTIONS.convinced)(name, pronouns(name), convincedBy)
          : _reactionText(name, result, dish);

        // Scoring
        if (result === 'dominant') { playerEatScores[name] += 1.5; }
        else if (result === 'pass') { playerEatScores[name] += 1; }
        else if (result === 'struggle') { playerEatScores[name] += 0.5; }
        // fail = 0 addition

        // Chain vomit trigger: roll < 0.20 means bad fail
        if ((result === 'fail' || result === 'struggle') && roll < 0.20 && !chainVomitTriggered) {
          chainVomitTriggered = true;
          chainVomitTriggerName = name;
          playerEatScores[name] -= 1;
          chainVomitReactions.push(_rp(BRUNCH_REACTIONS.chainVomitTrigger)(name, pronouns(name)));
        }

        results.push({ player: name, roll, result, reaction, ...(convincedBy ? { convincedBy } : {}) });
      }
      return results;
    }

    const processedBoysResults = _processTeam(teams.boys, boysTeamCoh);
    const processedGirlsResults = _processTeam(teams.girls, girlsTeamCoh);

    // Chain vomit spread — affects BOTH teams
    if (chainVomitTriggered) {
      const allEaters = [...teams.boys, ...teams.girls].filter(n => n !== chainVomitTriggerName);
      for (const name of allEaters) {
        const resist = pStats(name).endurance * 0.05 + Math.random() * 0.1;
        if (resist < 0.30) {
          chainVomitAffected.push(name);
          chainVomitPenalty[name] = true;
          playerEatScores[name] -= 1;
          chainVomitReactions.push(_rp(BRUNCH_REACTIONS.chainVomitAffected)(name, pronouns(name)));
        } else {
          chainVomitPenalty[name] = false;
          chainVomitReactions.push(_rp(BRUNCH_REACTIONS.chainVomitResisted)(name, pronouns(name)));
        }
      }
    } else {
      // Clear penalties from prior course for anyone not re-affected
      [...teams.boys, ...teams.girls].forEach(n => { chainVomitPenalty[n] = false; });
    }

    // Team wins course only if ALL members passed or dominated (not fail/refused)
    const boysWon = processedBoysResults.every(r => r.result === 'dominant' || r.result === 'pass' || r.result === 'struggle');
    const girlsWon = processedGirlsResults.every(r => r.result === 'dominant' || r.result === 'pass' || r.result === 'struggle');

    if (boysWon && !girlsWon) ep.brunch.score.boys++;
    else if (girlsWon && !boysWon) ep.brunch.score.girls++;
    // Both fail = neither scores. Both succeed = neither scores (cancels out).

    ep.brunch.courses.push({
      courseNum,
      dish,
      boysResults: processedBoysResults,
      girlsResults: processedGirlsResults,
      chainVomit: { trigger: chainVomitTriggerName, affected: chainVomitAffected, reactions: chainVomitReactions },
      boysWon,
      girlsWon,
    });

    // ── Cross-team breaks at courses 3 and 6 ──
    if (courseNum === 3 || courseNum === 6) {
      const breakEvents = _generateCrossTeamBreak(courseNum);
      ep.brunch.crossTeamBreaks.push({ afterCourse: courseNum, events: breakEvents });
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 3: EAT-OFF TIEBREAKER
  // ══════════════════════════════════════════════════════════════════

  if (ep.brunch.score.boys === ep.brunch.score.girls) {
    // Best eater per team (highest playerEatScores)
    const boysBest = teams.boys.reduce((a, b) => playerEatScores[a] >= playerEatScores[b] ? a : b);
    const girlsBest = teams.girls.reduce((a, b) => playerEatScores[a] >= playerEatScores[b] ? a : b);
    const eatOffDish = BRUNCH_EATOFF_DISH;
    const eatOffShots = [];
    let eatOffWinner = null;
    let eatOffLoser = null;
    let boysFailed = false;
    let girlsFailed = false;
    let suddenDeath = false;

    for (let shot = 1; shot <= 15; shot++) {
      // Steep escalation: shot 1 = 0.25, shot 5 = 0.45, shot 10 = 0.70, shot 15 = 0.95
      const threshold = 0.20 + (shot - 1) * 0.05;
      // Roll degrades per shot (stomach filling up): -0.02 per shot
      const shotFatigue = (shot - 1) * 0.02;
      const boyRoll = pStats(boysBest).endurance * 0.04 + pStats(boysBest).boldness * 0.02 + Math.random() * 0.15 - shotFatigue;
      const girlRoll = pStats(girlsBest).endurance * 0.04 + pStats(girlsBest).boldness * 0.02 + Math.random() * 0.15 - shotFatigue;
      boysFailed = boyRoll < threshold;
      girlsFailed = girlRoll < threshold;

      eatOffShots.push({
        shot, threshold,
        boys: { player: boysBest, roll: boyRoll, failed: boysFailed },
        girls: { player: girlsBest, roll: girlRoll, failed: girlsFailed },
      });

      if (boysFailed && girlsFailed) {
        // Both fail same shot → sudden death one more
        suddenDeath = true;
        const sdBoyRoll = pStats(boysBest).endurance * 0.05 + pStats(boysBest).boldness * 0.03 + Math.random() * 0.1;
        const sdGirlRoll = pStats(girlsBest).endurance * 0.05 + pStats(girlsBest).boldness * 0.03 + Math.random() * 0.1;
        if (sdBoyRoll >= sdGirlRoll) { eatOffWinner = 'boys'; eatOffLoser = 'girls'; }
        else if (sdGirlRoll > sdBoyRoll) { eatOffWinner = 'girls'; eatOffLoser = 'boys'; }
        else { eatOffWinner = Math.random() < 0.5 ? 'boys' : 'girls'; eatOffLoser = eatOffWinner === 'boys' ? 'girls' : 'boys'; }
        break;
      } else if (boysFailed) {
        eatOffWinner = 'girls'; eatOffLoser = 'boys'; break;
      } else if (girlsFailed) {
        eatOffWinner = 'boys'; eatOffLoser = 'girls'; break;
      }
    }

    // If nobody failed in 15 shots, coin flip
    if (!eatOffWinner) {
      eatOffWinner = Math.random() < 0.5 ? 'boys' : 'girls';
      eatOffLoser = eatOffWinner === 'boys' ? 'girls' : 'boys';
    }

    // Eat-off score bonuses
    const eatOffWinnerPlayer = eatOffWinner === 'boys' ? boysBest : girlsBest;
    const eatOffLoserPlayer = eatOffWinner === 'boys' ? girlsBest : boysBest;
    playerEatScores[eatOffWinnerPlayer] += 3;
    playerEatScores[eatOffLoserPlayer] += 1;

    ep.brunch.eatOff = {
      dish: eatOffDish,
      contestants: { boys: boysBest, girls: girlsBest },
      shots: eatOffShots,
      suddenDeath,
      winner: eatOffWinner,
      loser: eatOffLoser,
    };

    ep.brunch.score[eatOffWinner]++;
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 4: SCORING + IMMUNITY + REWARD
  // ══════════════════════════════════════════════════════════════════

  const finalWinner = ep.brunch.score.boys > ep.brunch.score.girls ? 'boys' : ep.brunch.score.girls > ep.brunch.score.boys ? 'girls' : (Math.random() < 0.5 ? 'boys' : 'girls');
  const finalLoser = finalWinner === 'boys' ? 'girls' : 'boys';
  ep.brunch.winningTeam = finalWinner;
  ep.brunch.losingTeam = finalLoser;

  // MVP eater (highest score overall)
  const allEaters = [...teams.boys, ...teams.girls];
  ep.brunch.mvpEater = allEaters.reduce((a, b) => playerEatScores[a] >= playerEatScores[b] ? a : b);
  ep.brunch.worstEater = allEaters.reduce((a, b) => playerEatScores[a] <= playerEatScores[b] ? a : b);

  // Popularity: eating champion, refusers, chain vomit trigger
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[ep.brunch.mvpEater] = (gs.popularity[ep.brunch.mvpEater] || 0) + 1; // ate most = iron stomach hero
  // Refusers lose a little (disgusting food is the point — refusing looks weak)
  const _brRefused = ep.brunch.courses.flatMap(c =>
    c.boysResults.concat(c.girlsResults).filter(r => r.result === 'refused')
  );
  const _brRefuserSet = new Set(_brRefused.map(r => r.player));
  _brRefuserSet.forEach(p => { gs.popularity[p] = (gs.popularity[p] || 0) - 1; }); // refused = weakest stomach edit
  // Chain vomit trigger is embarrassing TV
  const _brChainTriggers = ep.brunch.courses.filter(c => c.chainVomit.trigger).map(c => c.chainVomit.trigger);
  const _brTriggerSet = new Set(_brChainTriggers);
  _brTriggerSet.forEach(p => { gs.popularity[p] = (gs.popularity[p] || 0) - 1; }); // triggered chain vomit = comedy disaster

  // Bond adjustments
  const winTeamMembers = teams[finalWinner];
  const loseTeamMembers = teams[finalLoser];
  for (let i = 0; i < winTeamMembers.length; i++) {
    for (let j = i + 1; j < winTeamMembers.length; j++) addBond(winTeamMembers[i], winTeamMembers[j], 0.5);
  }
  for (let i = 0; i < loseTeamMembers.length; i++) {
    for (let j = i + 1; j < loseTeamMembers.length; j++) addBond(loseTeamMembers[i], loseTeamMembers[j], -0.2);
  }

  // Immunity
  ep.extraImmune = [...new Set([...(ep.extraImmune || []), ...winTeamMembers])];

  // Reward
  if (seasonConfig.survivalEnabled || seasonConfig.foodWater) {
    if (!gs.campResources) gs.campResources = {};
    gs.campResources.food = Math.min(10, (gs.campResources.food || 5) + 2);
    gs.campResources.water = Math.min(10, (gs.campResources.water || 5) + 1);
  } else {
    // MVP gets a small advantage note (flagged for advantage system to pick up)
    ep.brunchMvpAdvantageEligible = ep.brunch.mvpEater;
  }

  // ══════════════════════════════════════════════════════════════════
  // PHASE 5: POST-CHALLENGE CABIN EVENTS
  // ══════════════════════════════════════════════════════════════════

  const mvp = ep.brunch.mvpEater;
  // Worst eater on the LOSING team (not overall — avoid cross-team references in cabin events)
  const worst = loseTeamMembers.reduce((a, b) => playerEatScores[a] <= playerEatScores[b] ? a : b);
  const mvpPr = pronouns(mvp);
  const worstPr = pronouns(worst);

  // Winners' post events
  const winnersPostEvents = [];
  {
    const wm = winTeamMembers;
    const host = seasonConfig.host || 'Chris';

    // 1. Victory celebration
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'celebration',
      players: wm,
      text: _rp([
        `The ${finalWinner === 'boys' ? 'boys\'' : 'girls\''} team erupts. Hugs, shouts, someone does a lap. The win was earned.`,
        `When the result is called, the ${finalWinner} team look at each other and lose it. Pure relief.`,
        `The ${finalWinner} team celebrate like they've won the whole game. Maybe they have.`,
      ]),
      badgeText: 'VICTORY', badgeClass: 'gold',
    });

    // 2. MVP praised
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'praise',
      players: [mvp],
      text: _rp([
        `${mvp} carried the team through the worst of it. ${mvpPr.Sub} ${mvpPr.sub === 'they' ? 'are' : 'is'} getting congratulations from every direction.`,
        `The whole winning team points at ${mvp}. That was ${mvpPr.posAdj} game. The others know it.`,
        `"${mvp} is a machine." Someone says it and everyone nods.`,
      ]),
      badgeText: 'MVP PRAISED', badgeClass: 'gold',
    });

    // 3. Relief bonding
    const [reliefA, reliefB] = wm.length >= 2 ? _pairByBond(wm, 2) : [wm[0], wm[0]];
    if (reliefA !== reliefB) addBond(reliefA, reliefB, 0.2);
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'bonding',
      players: reliefA !== reliefB ? [reliefA, reliefB] : [reliefA],
      text: `${reliefA} and ${reliefB} collapse next to each other after. Nobody says anything for a moment. They don't have to.`,
      badgeText: 'RELIEF BONDING', badgeClass: 'gold',
    });

    // 4. Admit almost quit
    const wobbler = wm.find(n => ep.brunch.courses.some(c =>
      c.boysResults.concat(c.girlsResults).find(r => r.player === n && (r.result === 'struggle' || r.result === 'fail'))
    )) || _rp(wm);
    const wobblerPr = pronouns(wobbler);
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'confession',
      players: [wobbler],
      text: _rp([
        `${wobbler} admits to the team: "I almost didn't finish course ${3 + Math.floor(Math.random() * 4)}." Nobody judges ${wobblerPr.obj}. They've all been there.`,
        `"I was so close to walking," ${wobbler} says. ${wobblerPr.Sub} ${wobblerPr.sub === 'they' ? 'laugh' : 'laughs'} about it now. Then ${wobblerPr.sub === 'they' ? 'go' : 'goes'} quiet.`,
      ]),
      badgeText: 'ALMOST QUIT', badgeClass: 'info',
    });

    // 5. Mock losers
    const mocker = _rp(wm);
    const mockPr = pronouns(mocker);
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'rivalry',
      players: [mocker],
      text: _rp([
        `${mocker} can't help ${mockPr.posAdj}self: "Did you see their faces when they had to eat course 5?" The team cracks up.`,
        `"The other team is going to tribal. Worth it." ${mocker} grins at no one in particular.`,
        `${mocker} reenacts ${mockPr.posAdj} favourite failure moment from the other team. The impression is unfair and accurate.`,
      ]),
      badgeText: 'MOCK LOSERS', badgeClass: 'gold',
    });

    // 6. Plan future
    const planners = _topBy(wm, s => s.strategic, 2);
    if (planners.length >= 2) addBond(planners[0], planners[1], 0.1);
    winnersPostEvents.push({
      type: 'brunchPost', subtype: 'strategic',
      players: planners.slice(0, 2),
      text: `The ${finalWinner} team use the downtime to think ahead. ${planners[0]} and ${planners.length > 1 ? planners[1] : 'the others'} start talking long game quietly.`,
      badgeText: 'PLAN AHEAD', badgeClass: 'info',
    });

    // 7. Crossover accepted (if any)
    const xovWinners = wm.filter(n => crossoverNames.has(n));
    if (xovWinners.length) {
      const xov = _rp(xovWinners);
      const xovPr = pronouns(xov);
      wm.filter(n => n !== xov).forEach(m => addBond(xov, m, 0.15));
      winnersPostEvents.push({
        type: 'brunchPost', subtype: 'crossover',
        players: [xov],
        text: `The win seals it — ${xov} ${xovPr.sub === 'they' ? 'are' : 'is'} one of them now. Fully, finally. The team acts like it was never a question.`,
        badgeText: 'CROSSOVER ACCEPTED', badgeClass: 'gold',
      });
    }

    // 8. Sneak to check on showmance partner
    if (seasonConfig.romance === 'enabled' && gs.showmances?.length) {
      const smWinner = wm.find(n => {
        const sm = gs.showmances.find(s => !s.broken && s.players.includes(n));
        if (!sm) return false;
        const partner = sm.players.find(p => p !== n);
        return loseTeamMembers.includes(partner);
      });
      if (smWinner) {
        const smPartner = gs.showmances.find(s => !s.broken && s.players.includes(smWinner))?.players.find(p => p !== smWinner);
        addBond(smWinner, smPartner, 0.1);
        winnersPostEvents.push({
          type: 'brunchPost', subtype: 'showmance',
          players: [smWinner, smPartner],
          text: `${smWinner} slips away from the celebration to check on ${smPartner}. "You okay?" ${smPartner} forces a smile. It's not really a celebration for ${pronouns(smPartner).obj}.`,
          badgeText: 'SHOWMANCE CHECK', badgeClass: 'gold',
        });
      }
    }
  }

  // Losers' post events
  const losersPostEvents = [];
  {
    const lm = loseTeamMembers;
    const worstPrL = pronouns(worst);

    // 1. Blame game — worst eater targeted
    const blamer = lm.find(n => n !== worst) || lm[0];
    if (blamer && blamer !== worst) addBond(blamer, worst, -0.3);
    losersPostEvents.push({
      type: 'brunchPost', subtype: 'blame',
      players: blamer ? [blamer, worst] : [worst],
      text: _rp([
        `The ${finalLoser === 'boys' ? 'boys\'' : 'girls\''} team doesn't need to say it out loud. They're all thinking it. ${worst} knows.`,
        `${blamer && blamer !== worst ? blamer + ' looks at ' + worst + '. ' : ''}The team is quiet in the way that means something is being silently agreed to.`,
        `"We ate everything. Everything." ${blamer || lm[0]} stops there. ${worst} stares at the table.`,
      ]),
      badgeText: 'BLAME GAME', badgeClass: 'red',
    });

    // 2. Someone defends the worst eater (not the blamer)
    const defender = _rp(lm.filter(n => n !== worst && n !== blamer));
    if (defender) {
      addBond(defender, worst, 0.2);
      const defPr = pronouns(defender);
      losersPostEvents.push({
        type: 'brunchPost', subtype: 'defense',
        players: [defender, worst],
        text: _rp([
          `${defender} steps in: "It was hard for everyone. We're not doing this." The cabin doesn't fully agree, but goes quiet.`,
          `"Leave ${worst} alone." ${defPr.Sub} ${defPr.sub === 'they' ? 'say' : 'says'} it simply and clearly. It doesn't fix the result but it costs something to say.`,
        ]),
        badgeText: 'DEFENDED', badgeClass: 'info',
      });
    }

    // 3. Pre-tribal scramble
    const scramblers = _topBy(lm, s => s.strategic, 2);
    if (scramblers.length >= 2) addBond(scramblers[0], scramblers[1], 0.1);
    losersPostEvents.push({
      type: 'brunchPost', subtype: 'strategic',
      players: scramblers.slice(0, 2),
      text: `With tribal coming, ${scramblers[0]}${scramblers.length > 1 ? ' and ' + scramblers[1] : ''} start working the numbers quietly. There's no time to waste.`,
      badgeText: 'TRIBAL SCRAMBLE', badgeClass: 'red',
    });

    // 4. Regret
    const regretter = _rp(lm);
    const regPr = pronouns(regretter);
    losersPostEvents.push({
      type: 'brunchPost', subtype: 'regret',
      players: [regretter],
      text: _rp([
        `${regretter} sits apart from the group. ${regPr.Sub} ${regPr.sub === 'they' ? 'replay' : 'replays'} that one dish over and over.`,
        `"I should have pushed through it." ${regretter} says it to nobody. ${regPr.Sub} means it.`,
        `${regretter} stares at the table. Not sulking. Calculating. Figuring out the damage.`,
      ]),
      badgeText: 'REGRET', badgeClass: 'info',
    });

    // 5. Moral refuser stands ground (if anyone refused)
    const refuserEntry = ep.brunch.courses.flatMap(c =>
      c.girlsResults.concat(c.boysResults)
    ).find(r => r.result === 'refused' && lm.includes(r.player));
    if (refuserEntry) {
      const refuser = refuserEntry.player;
      const refPr = pronouns(refuser);
      losersPostEvents.push({
        type: 'brunchPost', subtype: 'moral',
        players: [refuser],
        text: _rp([
          `${refuser} hears the team's silence and doesn't flinch. "I made my call. I'd make it again."`,
          `Someone starts to say something to ${refuser}. ${refPr.Sub} ${refPr.sub === 'they' ? 'meet' : 'meets'} their eyes. Nobody finishes the sentence.`,
        ]),
        badgeText: 'STANDS GROUND', badgeClass: 'info',
      });
    }

    // 6. Crossover scapegoated (if any)
    const xovLosers = lm.filter(n => crossoverNames.has(n));
    if (xovLosers.length) {
      const xov = _rp(xovLosers);
      const xovPr = pronouns(xov);
      lm.filter(n => n !== xov).forEach(m => addBond(xov, m, -0.2));
      losersPostEvents.push({
        type: 'brunchPost', subtype: 'crossover',
        players: [xov],
        text: `The losing team doesn't say it out loud but ${xov} can feel ${xovPr.posAdj} outsider status sharpening. The looks are talking.`,
        badgeText: 'CROSSOVER SCAPEGOATED', badgeClass: 'red',
      });
    }

    // 7. Factions harden
    if (lm.length >= 4) {
      const [fA, fB] = _pairByBond(lm, -2);
      addBond(fA, fB, -0.15);
      losersPostEvents.push({
        type: 'brunchPost', subtype: 'factions',
        players: [fA, fB],
        text: `The loss makes the fault lines clearer. ${fA} and ${fB} aren't openly fighting — they're not talking either. The team reads the silence.`,
        badgeText: 'FACTIONS HARDEN', badgeClass: 'red',
      });
    }

    // 8. Someone cries + revenge promise
    const crier = lm.reduce((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return ((10 - sA.endurance) * 0.5 + (10 - sA.boldness) * 0.5) > ((10 - sB.endurance) * 0.5 + (10 - sB.boldness) * 0.5) ? a : b;
    });
    const crierPr = pronouns(crier);
    losersPostEvents.push({
      type: 'brunchPost', subtype: 'emotion',
      players: [crier],
      text: _rp([
        `${crier} doesn't try to hold it back. ${crierPr.Sub} ${crierPr.sub === 'they' ? 'cry' : 'cries'}. Then ${crierPr.sub === 'they' ? 'look' : 'looks'} up. "Next time."`,
        `${crier} is quiet for a long time. Then: "I'm not going home because of a plate of bugs." A statement. A promise.`,
        `The tears on ${crier}'s face dry fast. "We'll remember this." The team knows ${crierPr.sub === 'they' ? 'they' : crierPr.sub} ${crierPr.sub === 'they' ? 'mean' : 'means'} it.`,
      ]),
      badgeText: 'REVENGE PROMISED', badgeClass: 'red',
    });
  }

  ep.brunch.postCabinEvents.boys = finalWinner === 'boys' ? winnersPostEvents : losersPostEvents;
  ep.brunch.postCabinEvents.girls = finalWinner === 'girls' ? winnersPostEvents : losersPostEvents;

  // ── Push post-challenge events to camp ──
  [...winnersPostEvents, ...losersPostEvents].forEach(e => {
    ep.campEvents[campKey].post.push(e);
  });

  // ── Camp event badges ──
  ep.campEvents[campKey].post.push({
    type: 'brunchBadge', subtype: 'mvp',
    players: [ep.brunch.mvpEater],
    text: `${ep.brunch.mvpEater} led all players with ${playerEatScores[ep.brunch.mvpEater].toFixed(1)} eat points.`,
    badgeText: 'MVP EATER', badgeClass: 'gold',
  });
  ep.campEvents[campKey].post.push({
    type: 'brunchBadge', subtype: 'worst',
    players: [ep.brunch.worstEater],
    text: `${ep.brunch.worstEater} struggled hardest at the table — ${playerEatScores[ep.brunch.worstEater].toFixed(1)} eat points.`,
    badgeText: 'WEAKEST STOMACH', badgeClass: 'red',
  });

  const chainTriggers = ep.brunch.courses.filter(c => c.chainVomit.trigger);
  if (chainTriggers.length) {
    const ct = chainTriggers[0];
    ep.campEvents[campKey].post.push({
      type: 'brunchBadge', subtype: 'chain',
      players: [ct.chainVomit.trigger, ...ct.chainVomit.affected].filter(Boolean),
      text: `${ct.chainVomit.trigger} triggered a chain reaction on course ${ct.courseNum} that swept through both tables.`,
      badgeText: 'CHAIN REACTION', badgeClass: 'red',
    });
  }

  // Iron stomach: anyone with score ≥ 5 and no failures
  const ironStomachs = allEaters.filter(n => playerEatScores[n] >= 5 && !ep.brunch.courses.some(c =>
    c.boysResults.concat(c.girlsResults).find(r => r.player === n && (r.result === 'fail' || r.result === 'refused'))
  ));
  if (ironStomachs.length) {
    ep.campEvents[campKey].post.push({
      type: 'brunchBadge', subtype: 'iron',
      players: ironStomachs,
      text: `${ironStomachs.join(' and ')} ${ironStomachs.length === 1 ? 'ate' : 'ate'} everything without failure or refusal.`,
      badgeText: 'IRON STOMACH', badgeClass: 'gold',
    });
  }

  // Convinced badge
  const convincedPlayers = ep.brunch.courses.flatMap(c =>
    c.boysResults.concat(c.girlsResults).filter(r => r.convincedBy)
  );
  if (convincedPlayers.length) {
    ep.campEvents[campKey].post.push({
      type: 'brunchBadge', subtype: 'convinced',
      players: [...new Set(convincedPlayers.map(r => r.player))],
      text: `${convincedPlayers[0].player} needed a push from ${convincedPlayers[0].convincedBy} to make it through the table.`,
      badgeText: 'CONVINCED', badgeClass: 'info',
    });
  }

  // Refused badge
  const refusedPlayers = ep.brunch.courses.flatMap(c =>
    c.boysResults.concat(c.girlsResults).filter(r => r.result === 'refused')
  );
  if (refusedPlayers.length) {
    ep.campEvents[campKey].post.push({
      type: 'brunchBadge', subtype: 'refused',
      players: [...new Set(refusedPlayers.map(r => r.player))],
      text: `${refusedPlayers[0].player} refused to eat and cost the team a course.`,
      badgeText: 'REFUSED', badgeClass: 'red',
    });
  }

  // Romance spark from challenge
  if (seasonConfig.romance === 'enabled') {
    _challengeRomanceSpark(ep, 'eating', [...teams.boys, ...teams.girls]);
    _checkShowmanceChalMoment(ep, 'eating', ep.brunch, playerEatScores, 'danger', teams.boys);
    _checkShowmanceChalMoment(ep, 'eating', ep.brunch, playerEatScores, 'danger', teams.girls);
  }

  // ── Finalise ──
  ep.immunityWinner = null;
  ep.challengeType = 'team';
  ep.challengeLabel = 'Brunch of Disgustingness';
  ep.challengeCategory = 'eating';
  ep.challengeDesc = 'Boys vs girls eating challenge — 9 courses of disgusting food.';
  ep.chalPlacements = [...teams[ep.brunch.winningTeam], ...teams[ep.brunch.losingTeam]];
  ep.chalMemberScores = ep.brunch.playerEatScores;
  updateChalRecord(ep);
}

export function _textBrunchOfDisgustingness(ep, ln, sec) {
  const br = ep.brunch;
  if (!br) return;
  sec('BRUNCH OF DISGUSTINGNESS');
  ln(`Boys: ${ep.brunchTeams.boys.join(', ')}`);
  ln(`Girls: ${ep.brunchTeams.girls.join(', ')}`);
  if (ep.brunchTeams.crossovers?.length) {
    ep.brunchTeams.crossovers.forEach(c => ln(`  Crossover: ${c.name} (${c.from} → ${c.to})`));
  }
  ln('');
  ['boys', 'girls'].forEach(team => {
    ln(`=== ${team.toUpperCase()} CABIN ===`);
    (br.cabinEvents[team] || []).forEach(e => ln(`  ${e.text}`));
    ln(`  Team Cohesion: ${(br.teamCohesion[team] * 100).toFixed(0)}%`);
    ln('');
  });
  sec('THE BRUNCH');
  (br.courses || []).forEach(c => {
    ln(`Course ${c.courseNum}: [${c.dish.category.toUpperCase()}] ${c.dish.name}`);
    ln(`  ${c.dish.desc}`);
    ['boysResults', 'girlsResults'].forEach(key => {
      const teamLabel = key === 'boysResults' ? 'Boys' : 'Girls';
      (c[key] || []).forEach(r => {
        const status = r.result.toUpperCase() + (r.convincedBy ? ` (convinced by ${r.convincedBy})` : '');
        ln(`  ${teamLabel}: ${r.player} — ${status}`);
        if (r.reaction) ln(`    ${r.reaction}`);
      });
    });
    if (c.chainVomit?.trigger) {
      ln(`  CHAIN VOMIT triggered by ${c.chainVomit.trigger}`);
      (c.chainVomit.affected || []).forEach(a => ln(`    → ${a}`));
    }
    const bWin = c.boysWon ? 'WIN' : 'LOSE';
    const gWin = c.girlsWon ? 'WIN' : 'LOSE';
    ln(`  Result: Boys ${bWin}, Girls ${gWin} | Score: ${br.score.boys}-${br.score.girls}`);
    ln('');
  });
  if (br.crossTeamBreaks?.length) {
    br.crossTeamBreaks.forEach(b => {
      ln(`--- Cross-Team Break (after course ${b.afterCourse}) ---`);
      (b.events || []).forEach(e => ln(`  ${e.text}`));
      ln('');
    });
  }
  if (br.eatOff) {
    sec('EAT-OFF TIEBREAKER');
    const _eoBoys2 = br.eatOff.contestants?.boys || '?';
    const _eoGirls2 = br.eatOff.contestants?.girls || '?';
    ln(`${_eoBoys2} vs ${_eoGirls2} — Cockroach Smoothie Shots`);
    (br.eatOff.shots || []).forEach(s => {
      ln(`  Shot ${s.shot}: ${_eoBoys2} ${!s.boys?.failed ? 'DRANK' : 'FAILED'} | ${_eoGirls2} ${!s.girls?.failed ? 'DRANK' : 'FAILED'}`);
    });
    const _eoBC = (br.eatOff.shots||[]).filter(s => !s.boys?.failed).length;
    const _eoGC = (br.eatOff.shots||[]).filter(s => !s.girls?.failed).length;
    ln(`  Winner: ${br.eatOff.winner} (${_eoBC}-${_eoGC})`);
    ln('');
  }
  sec('RESULTS');
  ln(`Final Score: Boys ${br.score.boys} - Girls ${br.score.girls}`);
  ln(`Winner: ${(br.winningTeam || '?').toUpperCase()}`);
  ln(`MVP Eater: ${br.mvpEater || '?'}`);
  ln(`Worst Eater: ${br.worstEater || '?'}`);
  ln('');
  ['boys', 'girls'].forEach(team => {
    ln(`=== ${team.toUpperCase()} POST-CHALLENGE ===`);
    (br.postCabinEvents?.[team] || []).forEach(e => ln(`  ${e.text}`));
    ln('');
  });
}

export function rpBuildBrunchSplit(ep) {
  const br = ep.brunch;
  const teams = ep.brunchTeams;
  if (!br || !teams) return '';

  const crossoverNames = new Set((teams.crossovers || []).map(c => c.name));

  const buildTeamCol = (teamKey, label, accentColor, teamEmoji) => {
    const members = teams[teamKey] || [];
    return `<div style="flex:1;min-width:180px;background:rgba(26,33,24,0.85);border:2px solid ${accentColor}45;border-top:3px solid ${accentColor};border-radius:10px;overflow:hidden;box-shadow:0 0 18px ${accentColor}18,inset 0 0 20px rgba(0,0,0,0.3)">
      <div style="padding:10px 14px 10px;background:${accentColor}18;border-bottom:1px solid ${accentColor}30;text-align:center">
        <div style="font-size:16px;margin-bottom:3px">${teamEmoji}</div>
        <div style="font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:3px;color:${accentColor};text-shadow:0 0 10px ${accentColor}80">${label}</div>
        <div style="font-size:8px;letter-spacing:1.5px;color:${accentColor}90;margin-top:2px">${members.length} PLAYERS</div>
      </div>
      <div style="padding:12px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center">
        ${members.map(n => {
          const isCross = crossoverNames.has(n);
          return `<div style="position:relative;display:inline-block">
            ${rpPortrait(n, 'sm')}
            ${isCross ? `<div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);font-size:7px;font-weight:700;color:#facc15;background:rgba(20,24,16,0.95);border:1px solid rgba(250,204,21,0.55);border-radius:3px;padding:1px 4px;white-space:nowrap;letter-spacing:0.5px">\u2194 CROSS</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  };

  // Rules card styled as a gross cafeteria sign — green border, messy
  const rulesCard = `<div style="transform:rotate(-0.6deg);background:rgba(26,33,24,0.92);border:2px solid rgba(74,222,128,0.35);border-top:3px solid #4ade80;border-radius:8px;padding:14px 16px;max-width:420px;margin:0 auto;box-shadow:0 0 20px rgba(74,222,128,0.12),2px 4px 12px rgba(0,0,0,0.5)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="font-size:14px">\uD83D\uDCCB</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:3px;color:#4ade80;text-transform:uppercase">MESS HALL — OFFICIAL RULES</div>
    </div>
    <div style="font-size:11px;color:#d4d4c8;line-height:1.85">
      <div style="margin-bottom:4px">\uD83C\uDF7D\uFE0F <span style="color:#d4d4c8;font-weight:700">${br.courses?.length || 9} courses</span> of increasingly revolting food</div>
      <div style="margin-bottom:4px">\uD83D\uDEAB <span style="color:#f85149;font-weight:700">ONE refusal</span> = your team LOSES the course</div>
      <div style="margin-bottom:4px">\uD83E\uDD22 <span style="color:#84cc16;font-weight:700">Chain vomit</span> spreads — take everyone down with you</div>
      <div style="margin-bottom:4px">\uD83C\uDFC6 <span style="color:#facc15;font-weight:700">Tied?</span> Eat-off tiebreaker — cockroach smoothie shots</div>
      <div>\u2705 <span style="color:#2dd4bf;font-weight:700">Winners</span> get immunity + reward. Losers face tribal council.</div>
    </div>
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(74,222,128,0.2);font-size:10px;color:#4ade80;font-style:italic;text-shadow:0 0 6px rgba(74,222,128,0.4)">"You signed up for this. Now eat it." — Chef Hatchet</div>
  </div>`;

  let html = `<div class="rp-page br-canteen">
    <div style="text-align:center;margin-bottom:20px;animation:scrollDrop 0.5s var(--ease-broadcast) both">
      <div style="font-size:9px;font-weight:700;letter-spacing:4px;color:#4ade80;margin-bottom:8px;text-transform:uppercase;opacity:0.7">Total Drama Island presents</div>
      <div class="br-splat" style="display:inline-block">
        <div style="font-family:var(--font-display);font-size:26px;letter-spacing:5px;color:#4ade80;animation:brTitleGlow 2.5s ease-in-out infinite;line-height:1.15">BRUNCH OF</div>
        <div style="font-family:var(--font-display);font-size:26px;letter-spacing:5px;color:#4ade80;animation:brTitleGlow 2.5s ease-in-out infinite 0.3s;line-height:1.15">DISGUSTINGNESS</div>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:10px">
        <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#58a6ff;text-shadow:0 0 8px rgba(88,166,255,0.5)">BOYS</div>
        <div style="font-family:var(--font-display);font-size:16px;color:#4ade80;animation:brVsGlow 2s ease-in-out infinite;letter-spacing:2px">VS</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#f472b6;text-shadow:0 0 8px rgba(244,114,182,0.5)">GIRLS</div>
      </div>
      <div style="margin-top:6px;font-size:9px;color:rgba(74,222,128,0.5);letter-spacing:2px">${br.courses?.length || 9} COURSES OF PURE SUFFERING</div>
    </div>

    <div style="display:flex;align-items:stretch;gap:14px;justify-content:center;flex-wrap:wrap;margin:0 0 22px;max-width:580px;margin-left:auto;margin-right:auto">
      ${buildTeamCol('boys', 'BOYS', '#58a6ff', '\uD83D\uDC66')}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;flex-shrink:0;padding:0 4px">
        <div style="width:1px;flex:1;background:linear-gradient(to bottom,transparent,rgba(74,222,128,0.3),transparent)"></div>
        <div style="font-family:var(--font-display);font-size:20px;color:#4ade80;animation:brVsGlow 2s ease-in-out infinite;letter-spacing:1px">\u2694</div>
        <div style="width:1px;flex:1;background:linear-gradient(to bottom,transparent,rgba(74,222,128,0.3),transparent)"></div>
      </div>
      ${buildTeamCol('girls', 'GIRLS', '#f472b6', '\uD83D\uDC67')}
    </div>

    ${crossoverNames.size > 0 ? `<div style="text-align:center;margin-bottom:16px">
      <div style="display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:700;color:#facc15;letter-spacing:1px;padding:5px 12px;background:rgba(250,204,21,0.10);border:1px solid rgba(250,204,21,0.30);border-radius:4px;box-shadow:0 0 10px rgba(250,204,21,0.1)">
        \u2194 CROSSOVER ALERT: these players switched teams before the challenge
      </div>
    </div>` : ''}

    ${rulesCard}
  </div>`;
  return html;
}

export function rpBuildBrunchCabins(ep) {
  const br = ep.brunch;
  const teams = ep.brunchTeams;
  if (!br || !teams) return '';
  const uid = 'br-cabin-' + ep.num;
  const revealItems = [];

  ['boys', 'girls'].forEach(team => {
    const teamLabel = team === 'boys' ? 'BOYS\u2019 CABIN' : 'GIRLS\u2019 CABIN';
    const accentColor = team === 'boys' ? '#58a6ff' : '#f472b6';
    const members = teams[team] || [];
    const cohesion = br.teamCohesion?.[team] ?? 0.5;
    const cohPct = Math.round(cohesion * 100);
    const cohColor = cohesion > 0.6 ? '#4ade80' : cohesion > 0.3 ? '#facc15' : '#f85149';
    const lowCohesion = cohesion < 0.3;
    const cohLabel = lowCohesion ? 'FRACTURED' : cohesion > 0.6 ? 'SOLID' : 'UNSTABLE';

    // Cohesion bar with crack effect if low
    const cohesionCrackOverlay = lowCohesion
      ? `<div style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;background:repeating-linear-gradient(47deg,transparent,transparent 9px,rgba(248,81,73,0.05) 9px,rgba(248,81,73,0.05) 10px);border-radius:10px"></div>`
      : '';

    const headerHtml = `<div style="position:relative;background:linear-gradient(135deg,${accentColor}10,rgba(26,33,24,0.9));border:1px solid ${accentColor}40;border-top:3px solid ${accentColor};border-radius:10px;padding:14px;margin-bottom:10px;overflow:hidden;box-shadow:0 0 20px ${accentColor}12">
      ${cohesionCrackOverlay}
      <div style="position:relative;z-index:1">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-family:var(--font-display);font-size:14px;letter-spacing:3px;color:${accentColor};text-shadow:0 0 8px ${accentColor}60">${teamLabel}</div>
          <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:rgba(74,222,128,0.5);background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);padding:2px 8px;border-radius:3px">PRE-BRUNCH</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px">${members.map(n => rpPortrait(n, 'xs')).join('')}</div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:rgba(212,212,200,0.5);text-transform:uppercase">Team Cohesion</div>
            <div style="font-size:9px;font-weight:700;color:${cohColor};text-shadow:0 0 6px ${cohColor}80">${cohPct}% — ${cohLabel}</div>
          </div>
          <div style="height:7px;background:rgba(0,0,0,0.35);border-radius:4px;overflow:hidden;position:relative;border:1px solid rgba(74,222,128,0.08)">
            <div style="height:100%;width:${cohPct}%;background:linear-gradient(90deg,${cohColor}cc,${cohColor});border-radius:4px;box-shadow:0 0 8px ${cohColor}60"></div>
            ${lowCohesion ? `<div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(248,81,73,0.25) 14px,rgba(248,81,73,0.25) 15px)"></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
    revealItems.push({ type: 'team-header', html: headerHtml });

    const events = br.cabinEvents?.[team] || [];
    events.forEach((evt, ei) => {
      if (lowCohesion && ei === Math.floor(events.length / 2) && events.length > 1) {
        revealItems.push({ type: 'tape-line', html: `<div class="br-tape-line" style="animation:brTapeFlicker 3s ease-in-out infinite"></div>` });
      }

      const mainPlayer = evt.players?.[0];
      const extraPlayers = evt.players?.slice(1, 3) || [];

      // Border color by badge type — left accent for event type
      const leftBorderColor = evt.badgeClass === 'red' ? '#f85149' :
                              evt.badgeClass === 'gold' ? '#facc15' :
                              evt.badgeClass === 'info' ? '#58a6ff' : '#4ade80';
      const bgTint = evt.badgeClass === 'red' ? 'rgba(248,81,73,0.06)' :
                     evt.badgeClass === 'gold' ? 'rgba(250,204,21,0.05)' :
                     evt.badgeClass === 'info' ? 'rgba(88,166,255,0.05)' : 'rgba(74,222,128,0.04)';

      let evtHtml = `<div class="br-card-slam" style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;margin-bottom:10px;border-radius:10px;background:rgba(26,33,24,0.88);border:1px solid rgba(74,222,128,0.12);border-left:3px solid ${leftBorderColor};box-shadow:inset 0 0 12px ${bgTint}">`;
      if (mainPlayer) {
        evtHtml += `<div style="flex-shrink:0">${rpPortrait(mainPlayer, 'sm')}</div>`;
      }
      evtHtml += `<div style="flex:1;min-width:0">`;
      if (extraPlayers.length) {
        evtHtml += `<div style="display:flex;gap:3px;margin-bottom:6px">${extraPlayers.map(n => rpPortrait(n, 'xs')).join('')}</div>`;
      }
      evtHtml += `<div style="font-size:11px;color:#d4d4c8;line-height:1.6">${evt.text}</div>`;
      if (evt.badgeText) {
        const bgCol = evt.badgeClass === 'red' ? 'rgba(248,81,73,0.18)' : evt.badgeClass === 'info' ? 'rgba(88,166,255,0.15)' : evt.badgeClass === 'gold' ? 'rgba(250,204,21,0.15)' : 'rgba(74,222,128,0.15)';
        const fgCol = evt.badgeClass === 'red' ? '#f85149' : evt.badgeClass === 'info' ? '#58a6ff' : evt.badgeClass === 'gold' ? '#facc15' : '#4ade80';
        evtHtml += `<div style="margin-top:7px"><span class="br-result-badge" style="background:${bgCol};color:${fgCol};box-shadow:0 0 6px ${fgCol}30">${evt.badgeText}</span></div>`;
      }
      evtHtml += `</div></div>`;
      revealItems.push({ type: 'cabin-event', html: evtHtml });
    });

    revealItems.push({ type: 'spacer', html: `<div style="height:10px"></div>` });
  });

  let html = `<div class="rp-page br-canteen" id="${uid}-page" data-su-revealed="0" data-su-total="${revealItems.length}">
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:#4ade80;text-shadow:0 0 12px rgba(74,222,128,0.5)">CABIN DYNAMICS</div>
      <div style="font-size:9px;font-weight:700;letter-spacing:3px;color:rgba(74,222,128,0.5);margin-top:4px;text-transform:uppercase">Before The Brunch</div>
    </div>`;
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });
  html += `<div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5;background:rgba(22,28,20,0.95);padding:8px 16px;border-radius:8px;border:1px solid rgba(74,222,128,0.2);box-shadow:0 0 12px rgba(74,222,128,0.1)">
    <button class="rp-camp-toggle-btn" style="border-color:#4ade80;color:#4ade80;padding:6px 16px;font-size:11px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
    <span id="${uid}-counter" style="font-size:11px;font-family:var(--font-mono);color:#4ade80;min-width:40px;text-align:center;opacity:0.7">0/${revealItems.length}</span>
    <button class="rp-camp-toggle-btn" style="border-color:rgba(74,222,128,0.3);color:rgba(74,222,128,0.5);padding:6px 12px;font-size:10px" onclick="suRevealAll('${uid}')">ALL</button>
  </div></div>`;
  return html;
}

export function rpBuildBrunchCourses(ep) {
  const br = ep.brunch;
  if (!br?.courses?.length) return '';
  const uid = 'br-courses-' + ep.num;
  const _catColor  = { 'meat-gross':'#f85149', 'bug-gross':'#84cc16', 'texture-gross':'#a855f7', 'mystery-gross':'#facc15', 'morally-questionable':'#f97316' };
  const _catEmoji  = { 'meat-gross':'\uD83E\uDD69', 'bug-gross':'\uD83E\uDD97', 'texture-gross':'\uD83E\uDEB1', 'mystery-gross':'\u2753', 'morally-questionable':'\uD83D\uDE22' };
  const revealItems = [];
  let runningBoys = 0, runningGirls = 0;

  // Helper: build a single player row inside a tray side compartment
  const buildPlayerRow = (r) => {
    const isDominated = r.result === 'dominant';
    const isPassed    = r.result === 'pass';
    const isStruggle  = r.result === 'struggle';
    const isRefused   = r.result === 'refused';
    const isFailed    = r.result === 'fail';

    const badgeBg    = isDominated ? 'rgba(45,212,191,0.2)' : isPassed ? 'rgba(74,222,128,0.18)' : isStruggle ? 'rgba(250,204,21,0.18)' : 'rgba(248,81,73,0.2)';
    const badgeFg    = isDominated ? '#2dd4bf' : isPassed ? '#4ade80' : isStruggle ? '#facc15' : '#f85149';
    const badgeIcon  = isDominated ? '\u2605' : isPassed ? '\u2713' : isStruggle ? '\u26A0' : '\u2715';
    const badgeLabel = isDominated ? 'DOMINATED' : isPassed ? 'PASSED' : isStruggle ? 'STRUGGLED' : isRefused ? 'REFUSED' : 'FAILED';
    const rowGlow    = isDominated ? 'box-shadow:0 0 8px rgba(45,212,191,0.2);border-radius:4px;' : isFailed ? 'box-shadow:0 0 6px rgba(248,81,73,0.15);border-radius:4px;' : '';

    return `<div class="br-player-result${isFailed ? ' br-gag-shake' : ''}" style="${rowGlow}">
      <div style="flex-shrink:0;position:relative">
        ${rpPortrait(r.player, 'xs')}
        ${isRefused ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(248,81,73,0.65);border-radius:4px;animation:brRefuseStamp 0.35s cubic-bezier(0.34,1.56,0.64,1) both"><span style="font-size:8px;font-weight:900;color:#fff;letter-spacing:0.5px;text-shadow:0 1px 3px rgba(0,0,0,0.5)">NO</span></div>` : ''}
        ${isDominated ? `<div style="position:absolute;inset:0;border-radius:4px;pointer-events:none;animation:brDominantPulse 2s ease-in-out infinite"></div>` : ''}
      </div>
      <div style="flex:1;min-width:0">
        <div style="margin-bottom:3px">
          <span class="br-result-badge" style="background:${badgeBg};color:${badgeFg};box-shadow:0 0 6px ${badgeFg}30">${badgeIcon} ${badgeLabel}</span>
        </div>
        ${r.convincedBy ? `<div style="font-size:8px;color:#facc15;margin-bottom:2px">\u2190 convinced by ${r.convincedBy}</div>` : ''}
        ${r.reaction ? `<div style="font-size:10px;color:#a8a89e;line-height:1.45">${r.reaction}</div>` : ''}
      </div>
    </div>`;
  };

  br.courses.forEach((c, ci) => {
    const catColor = _catColor[c.dish?.category] || '#8b949e';
    const catEmoji = _catEmoji[c.dish?.category] || '\uD83C\uDFB2';
    const catName  = (c.dish?.category || 'food').toUpperCase().replace(/-/g,' ');

    // Persistent scoreboard at top of each course — big, glowing, game show energy
    const scoreboard = `<div style="display:flex;align-items:center;justify-content:center;gap:14px;padding:8px 14px;background:rgba(0,0,0,0.4);border-bottom:2px solid rgba(74,222,128,0.18)">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#58a6ff">BOYS</div>
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;animation:brScoreFlip 0.5s cubic-bezier(0.22,1,0.36,1) both">
        <span style="color:#58a6ff;text-shadow:0 0 12px rgba(88,166,255,0.7)">${runningBoys}</span>
        <span style="color:rgba(74,222,128,0.4);margin:0 8px;font-size:16px">\u2014</span>
        <span style="color:#f472b6;text-shadow:0 0 12px rgba(244,114,182,0.7)">${runningGirls}</span>
      </div>
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f472b6">GIRLS</div>
    </div>`;

    // Tray header — COURSE N + category badge
    const trayHeader = `<div class="br-tray-header">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:rgba(74,222,128,0.8)">COURSE ${c.courseNum}</div>
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:${catColor};background:${catColor}18;border:1px solid ${catColor}35;padding:2px 7px;border-radius:3px">${catEmoji} ${catName}</div>
      </div>
      <div style="font-size:8px;color:rgba(212,212,200,0.35);font-family:var(--font-mono)">${br.courses.length} courses total</div>
    </div>`;

    // Center dish compartment — big dish name with green splat burst
    const dishBlock = `<div class="br-tray-center">
      <div class="br-splat" style="display:inline-block;margin-bottom:6px">
        <div style="font-size:14px;font-weight:800;color:#d4d4c8;line-height:1.25;letter-spacing:0.5px;text-align:center">${c.dish?.name || 'Unknown Dish'}</div>
      </div>
      ${c.dish?.desc ? `<div style="font-size:10px;color:rgba(212,212,200,0.55);line-height:1.55;text-align:center;margin-top:2px">${c.dish.desc}</div>` : ''}
    </div>`;

    // Side compartments — win/lose dim effect
    const buildSide = (results, won, teamColor) => {
      const sideOpacity = won ? '1' : '0.75';
      const sideTint = won ? `background:${teamColor}08;` : 'background:rgba(0,0,0,0.1);filter:brightness(0.85);';
      const winLoseTag = won
        ? `<div style="font-size:9px;font-weight:700;color:${teamColor};margin-bottom:7px;letter-spacing:1px;text-shadow:0 0 8px ${teamColor}60">\u2713 WIN</div>`
        : `<div style="font-size:9px;font-weight:700;color:#f85149;margin-bottom:7px;letter-spacing:1px">\u2715 LOSE</div>`;
      const rows = (results || []).map(r => buildPlayerRow(r)).join('');
      return `<div class="br-tray-side" style="${sideTint}opacity:${sideOpacity}">${winLoseTag}${rows}</div>`;
    };

    // Chain vomit — full-width green ripple with affected player list
    let chainVomitSection = '';
    if (c.chainVomit?.trigger) {
      const affectedList = c.chainVomit.affected?.length
        ? `<div style="font-size:9px;color:rgba(74,222,128,0.5);margin-top:3px">Spread to: ${c.chainVomit.affected.join(', ')}</div>`
        : '';
      chainVomitSection = `<div class="br-tray-footer br-vomit-ripple" style="border-top:1px solid rgba(74,222,128,0.2);background:rgba(74,222,128,0.06)">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
          ${rpPortrait(c.chainVomit.trigger, 'xs')}
          <div>
            <div style="font-size:10px;font-weight:700;color:#84cc16;letter-spacing:1px">\uD83E\uDD22 CHAIN VOMIT \u2014 ${c.chainVomit.trigger}</div>
            ${affectedList}
          </div>
        </div>
      </div>`;
    }

    // Course result footer — winning side flashes team color
    const courseResult  = c.boysWon && c.girlsWon ? 'BOTH WIN' : c.boysWon ? 'BOYS WIN' : c.girlsWon ? 'GIRLS WIN' : 'BOTH FAIL';
    const resultFg      = courseResult === 'BOTH FAIL' ? 'rgba(212,212,200,0.35)' : courseResult === 'BOYS WIN' ? '#58a6ff' : courseResult === 'GIRLS WIN' ? '#f472b6' : '#4ade80';
    const resultBg      = courseResult === 'BOYS WIN' ? 'rgba(88,166,255,0.08)' : courseResult === 'GIRLS WIN' ? 'rgba(244,114,182,0.08)' : 'rgba(74,222,128,0.04)';
    const resultFooter  = `<div class="br-tray-footer" style="background:${resultBg}">
      <div style="font-size:12px;font-weight:800;letter-spacing:3px;color:${resultFg};text-shadow:0 0 10px ${resultFg}80">${courseResult}</div>
    </div>`;

    const trayHtml = `<div class="br-tray br-tray-slide">
      ${scoreboard}
      ${trayHeader}
      <div class="br-tray-body">
        ${buildSide(c.boysResults, c.boysWon, '#58a6ff')}
        ${dishBlock}
        ${buildSide(c.girlsResults, c.girlsWon, '#f472b6')}
      </div>
      ${chainVomitSection}
      ${resultFooter}
    </div>`;
    revealItems.push({ type: 'course', html: trayHtml });

    // Update running score AFTER the course card (so next course shows updated score)
    if (c.boysWon) runningBoys++;
    if (c.girlsWon) runningGirls++;

    // Cross-team break — yellow whistle card
    const ctb = br.crossTeamBreaks?.find(b => b.afterCourse === c.courseNum);
    if (ctb?.events?.length) {
      let ctbHtml = `<div style="background:rgba(250,204,21,0.06);border:2px solid rgba(250,204,21,0.25);border-left:4px solid #facc15;border-radius:8px;padding:14px;margin-bottom:10px;box-shadow:0 0 12px rgba(250,204,21,0.08)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:16px">\uD83D\uDEA8</span>
          <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#facc15;text-shadow:0 0 8px rgba(250,204,21,0.4)">CROSS-TEAM BREAK</div>
        </div>`;
      ctb.events.forEach(e => {
        ctbHtml += `<div style="font-size:11px;color:#d4d4c8;line-height:1.6;margin-bottom:6px;padding:7px 10px;background:rgba(250,204,21,0.05);border-left:2px solid rgba(250,204,21,0.3);border-radius:0 5px 5px 0">${e.text}</div>`;
      });
      ctbHtml += `</div>`;
      revealItems.push({ type: 'break', html: ctbHtml });
    }
  });

  // Eat-off tiebreaker
  if (br.eatOff) {
    const _eoBoys = br.eatOff.contestants?.boys || '';
    const _eoGirls = br.eatOff.contestants?.girls || '';
    const _eoShots = br.eatOff.shots || [];
    const _eoBoysCount = _eoShots.filter(s => !s.boys?.failed).length;
    const _eoGirlsCount = _eoShots.filter(s => !s.girls?.failed).length;
    const _eoWinnerTeam = br.eatOff.winner || 'boys';
    const _eoWinnerPlayer = _eoWinnerTeam === 'boys' ? _eoBoys : _eoGirls;
    const eoWinColor = _eoWinnerTeam === 'boys' ? '#58a6ff' : '#f472b6';

    revealItems.push({ type: 'eatoff-header', html: `<div style="background:rgba(22,28,20,0.9);border:2px solid rgba(74,222,128,0.3);border-top:3px solid #4ade80;border-radius:10px;padding:16px;margin-bottom:8px;box-shadow:0 0 20px rgba(74,222,128,0.12)">
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-family:var(--font-display);font-size:16px;letter-spacing:4px;color:#4ade80;text-shadow:0 0 12px rgba(74,222,128,0.6);margin-bottom:4px">EAT-OFF TIEBREAKER</div>
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(74,222,128,0.5)">COCKROACH SMOOTHIE SHOTS \uD83E\uDD22</div>
      </div>
      <div style="display:flex;justify-content:center;align-items:center;gap:24px">
        <div style="text-align:center">
          ${rpPortrait(_eoBoys, 'sm')}
          <div style="font-size:9px;color:#58a6ff;margin-top:5px;font-weight:700;letter-spacing:1px;text-shadow:0 0 6px rgba(88,166,255,0.5)">BOYS</div>
          <div style="font-size:10px;color:#d4d4c8;margin-top:2px">${_eoBoys}</div>
        </div>
        <div style="font-family:var(--font-display);font-size:20px;color:#4ade80;animation:brVsGlow 2s ease-in-out infinite">VS</div>
        <div style="text-align:center">
          ${rpPortrait(_eoGirls, 'sm')}
          <div style="font-size:9px;color:#f472b6;margin-top:5px;font-weight:700;letter-spacing:1px;text-shadow:0 0 6px rgba(244,114,182,0.5)">GIRLS</div>
          <div style="font-size:10px;color:#d4d4c8;margin-top:2px">${_eoGirls}</div>
        </div>
      </div>
    </div>` });

    // Shot-by-shot reveal — shot glass shapes that fill green (drank) or red (failed)
    for (let si = 0; si < _eoShots.length; si++) {
      const s = _eoShots[si];
      const bPass = !s.boys?.failed;
      const gPass = !s.girls?.failed;
      const bColor = bPass ? '#4ade80' : '#f85149';
      const gColor = gPass ? '#4ade80' : '#f85149';

      // Shot glass shape: rounded-bottom rectangle that fills with color
      const buildGlass = (pass, label) => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:8px;font-weight:700;color:${pass ? '#4ade80' : '#f85149'};letter-spacing:1px">${pass ? 'DRANK' : 'FAILED'}</div>
        <div style="width:28px;height:40px;border-radius:3px 3px 6px 6px;border:2px solid ${pass ? 'rgba(74,222,128,0.5)' : 'rgba(248,81,73,0.5)'};overflow:hidden;position:relative;background:rgba(0,0,0,0.4)">
          <div style="position:absolute;bottom:0;left:0;right:0;height:${pass ? '85' : '30'}%;background:linear-gradient(to top,${pass ? '#4ade80' : '#f85149'}cc,${pass ? '#84cc16' : '#f97316'}80);animation:brShotFill 0.4s ease-out both"></div>
        </div>
        <div style="font-size:8px;color:rgba(212,212,200,0.45)">${label}</div>
      </div>`;

      let shotHtml = `<div style="display:flex;justify-content:center;align-items:center;gap:20px;padding:10px 0">
        ${buildGlass(bPass, _eoBoys)}
        <div style="font-size:10px;font-family:var(--font-mono);color:rgba(74,222,128,0.4);text-align:center">
          <div style="font-size:7px;letter-spacing:2px;margin-bottom:2px">SHOT</div>
          <div style="font-size:18px;font-family:var(--font-display);color:rgba(74,222,128,0.6)">${s.shot}</div>
        </div>
        ${buildGlass(gPass, _eoGirls)}
      </div>`;

      if (s.boys?.failed || s.girls?.failed) {
        shotHtml += `<div style="text-align:center;padding:10px 0 4px;border-top:1px solid rgba(74,222,128,0.15);margin-top:6px">
          <div style="font-size:8px;font-weight:700;letter-spacing:3px;color:rgba(74,222,128,0.5);margin-bottom:6px">WINNER</div>
          <div style="font-family:var(--font-display);font-size:16px;letter-spacing:2px;color:${eoWinColor};text-shadow:0 0 12px ${eoWinColor}80">${_eoWinnerPlayer} (${_eoWinnerTeam.toUpperCase()})</div>
          <div style="font-size:10px;color:rgba(212,212,200,0.4);margin-top:3px">${_eoBoysCount} \u2014 ${_eoGirlsCount} shots</div>
        </div>`;
      }
      revealItems.push({ type: 'eatoff-shot', html: `<div style="background:rgba(22,28,20,0.88);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:4px 14px;margin-bottom:5px">${shotHtml}</div>` });
      if (s.boys?.failed || s.girls?.failed) break;
    }
  }

  let html = `<div class="rp-page br-canteen" id="${uid}-page" data-su-revealed="0" data-su-total="${revealItems.length}">
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:#4ade80;text-shadow:0 0 12px rgba(74,222,128,0.5);margin-bottom:6px">THE BRUNCH</div>
      <div style="font-size:9px;color:rgba(74,222,128,0.5);margin-top:4px;letter-spacing:2px">${br.courses.length} courses \u2014 click NEXT to reveal</div>
    </div>`;
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });
  html += `<div style="display:flex;gap:10px;align-items:center;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5;background:rgba(20,24,16,0.96);padding:8px 16px;border-radius:8px;border:1px solid rgba(74,222,128,0.22);box-shadow:0 0 14px rgba(74,222,128,0.1)">
    <button class="rp-camp-toggle-btn" style="border-color:#4ade80;color:#4ade80;padding:6px 16px;font-size:11px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
    <span id="${uid}-counter" style="font-size:11px;font-family:var(--font-mono);color:#4ade80;min-width:40px;text-align:center;opacity:0.7">0/${revealItems.length}</span>
    <button class="rp-camp-toggle-btn" style="border-color:rgba(74,222,128,0.3);color:rgba(74,222,128,0.5);padding:6px 12px;font-size:10px" onclick="suRevealAll('${uid}')">ALL</button>
  </div></div>`;
  return html;
}

export function rpBuildBrunchResults(ep) {
  const br = ep.brunch;
  if (!br) return '';
  const teams = ep.brunchTeams;
  const winLabel = (br.winningTeam || 'boys').toUpperCase();
  const loseLabel = (br.losingTeam || 'girls').toUpperCase();
  const winMembers = teams?.[br.winningTeam] || [];
  const loseMembers = teams?.[br.losingTeam] || [];

  let html = `<div class="rp-page br-canteen" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:20px;letter-spacing:3px;color:#4ade80;margin-bottom:20px;animation:scrollDrop 0.5s var(--ease-broadcast) both">RESULTS</div>

    <div style="font-size:48px;font-weight:700;font-family:var(--font-display);color:#4ade80;text-shadow:0 0 20px rgba(74,222,128,0.3);margin-bottom:4px">${br.score.boys} \u2014 ${br.score.girls}</div>
    <div style="font-size:12px;color:#8b949e;margin-bottom:24px">Boys vs Girls</div>

    <div style="font-size:14px;font-weight:700;letter-spacing:2px;color:#4ade80;margin-bottom:12px">${winLabel} WIN</div>
    <div class="rp-portrait-row" style="justify-content:center;margin-bottom:8px">${winMembers.map(n => rpPortrait(n, 'sm')).join('')}</div>
    <div style="font-size:11px;color:#4ade80;margin-bottom:20px">Immunity + Reward</div>

    <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#f85149;margin-bottom:8px;opacity:0.7">${loseLabel} LOSE</div>
    <div class="rp-portrait-row" style="justify-content:center;margin-bottom:8px;opacity:0.5">${loseMembers.map(n => rpPortrait(n, 'sm', 'elim')).join('')}</div>
    <div style="font-size:11px;color:#f85149;margin-bottom:20px;opacity:0.7">Tribal Council</div>

    <div style="width:60px;height:1px;background:rgba(74,222,128,0.2);margin:16px auto"></div>`;

  // MVP + Worst
  if (br.mvpEater) {
    html += `<div style="margin-bottom:16px">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#2dd4bf;margin-bottom:8px">MVP EATER</div>
      ${rpPortrait(br.mvpEater, 'md')}
      <div style="font-size:13px;font-weight:700;color:#d4d4c8;margin-top:6px">${br.mvpEater}</div>
    </div>`;
  }
  if (br.worstEater) {
    html += `<div style="margin-bottom:16px;opacity:0.7">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:8px">WEAKEST STOMACH</div>
      ${rpPortrait(br.worstEater, 'sm', 'elim')}
      <div style="font-size:11px;color:#8b949e;margin-top:4px">${br.worstEater}</div>
    </div>`;
  }

  // Post-challenge events
  const uid = 'br-post-' + ep.num;
  const postItems = [];
  ['boys', 'girls'].forEach(team => {
    const evts = br.postCabinEvents?.[team] || [];
    if (!evts.length) return;
    postItems.push({ html: `<div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#4ade80;margin-bottom:8px;text-align:center">${team.toUpperCase()} \u2014 ${team === br.winningTeam ? 'WINNERS' : 'LOSERS'}</div>` });
    evts.forEach(evt => {
      let evtHtml = '';
      if (evt.players?.length) evtHtml += `<div style="display:flex;gap:4px;margin-bottom:4px">${evt.players.slice(0, 3).map(n => rpPortrait(n, 'xs')).join('')}</div>`;
      evtHtml += `<div style="font-size:11px;color:#d4d4c8;line-height:1.4">${evt.text}</div>`;
      if (evt.badgeText) {
        const bgCol = evt.badgeClass === 'red' ? 'rgba(248,81,73,0.15)' : 'rgba(74,222,128,0.15)';
        const fgCol = evt.badgeClass === 'red' ? '#f85149' : '#4ade80';
        evtHtml += `<div style="margin-top:4px"><span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;background:${bgCol};color:${fgCol}">${evt.badgeText}</span></div>`;
      }
      postItems.push({ html: `<div style="background:rgba(26,33,24,0.6);border:1px solid rgba(139,148,158,0.08);border-radius:8px;padding:10px;margin-bottom:6px;text-align:left">${evtHtml}</div>` });
    });
  });

  if (postItems.length) {
    html += `<div style="width:60px;height:1px;background:rgba(74,222,128,0.2);margin:16px auto"></div>
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:12px">POST-CHALLENGE</div>`;
    html += `<div id="${uid}-page" data-su-revealed="0" data-su-total="${postItems.length}" style="text-align:left">`;
    postItems.forEach((item, i) => {
      html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
    });
    html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:10px">
      <button class="rp-camp-toggle-btn" style="border-color:#4ade80;color:#4ade80;padding:6px 16px;font-size:11px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
      <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:6px 12px;font-size:10px" onclick="suRevealAll('${uid}')">REVEAL ALL</button>
    </div></div>`;
  }

  html += `</div>`;
  return html;
}

