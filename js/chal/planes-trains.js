// js/chal/planes-trains.js — Planes, Trains & Hot Air Mobiles (post-merge)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function ordinal(n) { const s = ['th','st','nd','rd']; const v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function portrait(name, size = 42) {
  const s = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${s}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function _evPlayers(player, target) {
  const pBadge = arch(player).replace(/-/g, ' ');
  let html = `<div class="pt-ev-players">${portrait(player, 36)}<div class="pt-ev-pinfo"><span class="pt-ev-pname">${player}</span><span class="pt-ev-badge">${pBadge}</span></div>`;
  if (target) {
    const tBadge = arch(target).replace(/-/g, ' ');
    html += `<span class="pt-ev-vs">VS</span>${portrait(target, 36)}<div class="pt-ev-pinfo"><span class="pt-ev-pname">${target}</span><span class="pt-ev-badge">${tBadge}</span></div>`;
  }
  html += `</div>`;
  return html;
}
function _buildClashVisual(ev, cd, useSea = false) {
  if (!ev.player || !ev.target) return '';
  let lIcon, rIcon;
  if (useSea) {
    const lId = cd.seaVessels?.[ev.player]?.id;
    const rId = cd.seaVessels?.[ev.target]?.id;
    if (!lId && !rId) return '';
    lIcon = lId ? `<div class="pt-veh-clash-left">${_seaVesselIcon(lId, 48)}</div>` : '';
    rIcon = rId ? `<div class="pt-veh-clash-right">${_seaVesselIcon(rId, 48)}</div>` : '';
  } else {
    const lVeh = cd.assignments?.[ev.player]?.vehicleId;
    const rVeh = cd.assignments?.[ev.target]?.vehicleId;
    if (!lVeh && !rVeh) return '';
    lIcon = lVeh ? `<div class="pt-veh-clash-left">${_vehicleIcon(lVeh, 48)}</div>` : '';
    rIcon = rVeh ? `<div class="pt-veh-clash-right">${_vehicleIcon(rVeh, 48)}</div>` : '';
  }
  const impactTypes = new Set(['sabotage', 'sabotage-fail', 'sabotage-dodged', 'animals', 'ram', 'destroy']);
  const faceoffTypes = new Set(['rivalry', 'duel']);
  const tauntTypes = new Set(['trash-talk']);
  let mode = 'impact';
  if (faceoffTypes.has(ev.type)) mode = 'faceoff';
  else if (tauntTypes.has(ev.type)) mode = 'taunt';
  else if (!impactTypes.has(ev.type)) return '';
  const wrapCls = mode === 'faceoff' ? ' pt-veh-faceoff' : mode === 'taunt' ? ' pt-veh-taunt' : '';
  const sparkSvg = mode === 'impact'
    ? `<svg width="26" height="26" viewBox="0 0 26 26"><polygon points="13,0 15.5,9 26,9 18,15 20,26 13,20 6,26 8,15 0,9 10.5,9" fill="var(--pt-mustard)" stroke="var(--pt-rust)" stroke-width="1.2"/></svg>`
    : mode === 'faceoff'
    ? `<svg width="20" height="26" viewBox="0 0 20 26"><path d="M10,2 L14,8 L10,6 L14,14 L10,11 L14,20 L10,16 L12,26 L8,16 L6,20 L10,11 L6,14 L10,6 L6,8 Z" fill="var(--pt-mustard)" opacity="0.8"/></svg>`
    : `<svg width="22" height="22" viewBox="0 0 22 22"><text x="11" y="16" text-anchor="middle" font-size="16" fill="var(--pt-crimson)">💢</text></svg>`;
  let hpHtml = '';
  if (mode === 'impact' && (ev.damage || ev.attackerHp !== undefined)) {
    const buildPips = (current, max, name) => {
      let pips = '';
      for (let h = 0; h < max; h++) {
        pips += `<div class="pt-clash-hp-pip ${h < current ? 'full' : 'empty'}"></div>`;
      }
      return `<div class="pt-clash-dmg"><span class="pt-clash-name">${name}</span><div class="pt-clash-hp">${pips}</div>${ev.damage ? `<span class="pt-clash-dmg-num red">-${ev.damage} HP</span>` : ''}</div>`;
    };
    const isBackfire = ev.type === 'sabotage-fail';
    if (isBackfire && ev.attackerHp !== undefined) {
      hpHtml = buildPips(ev.attackerHp, ev.attackerMaxHp, ev.player);
    } else if (ev.targetHp !== undefined) {
      hpHtml = buildPips(ev.targetHp, ev.targetMaxHp, ev.target);
    }
  }
  return `<div class="pt-veh-clash${wrapCls}">${lIcon}${hpHtml ? hpHtml : ''}<div class="pt-veh-clash-center">${sparkSvg}</div>${rIcon}</div>`;
}
function _renderStandingsCard(ev) {
  const phaseLabel = ev.phase === 'land' ? 'LAND RACE COMPLETE' : ev.phase === 'sea' ? 'SEA CROSSING COMPLETE' : 'FINAL RESULTS';
  const isFinal = ev.phase === 'final';
  let rows = '';
  for (const s of ev.standings) {
    const hpBars = [];
    for (let h = 0; h < s.maxHp; h++) {
      hpBars.push(`<div class="pt-st-hp ${h < s.hp ? (s.hp <= 1 ? 'low' : 'ok') : 'empty'}"></div>`);
    }
    const deltaStr = s.skipped ? '<span class="pt-st-delta skip">SKIPPED</span>'
      : s.delta > 0 ? `<span class="pt-st-delta up">&#9650;${s.delta}</span>`
      : s.delta < 0 ? `<span class="pt-st-delta down">&#9660;${Math.abs(s.delta)}</span>`
      : '<span class="pt-st-delta flat">&mdash;</span>';
    const winCls = s.winner ? ' winner' : '';
    const posCls = s.pos === 1 ? ' first' : s.pos === ev.standings.length ? ' last' : '';
    rows += `<div class="pt-st-row${winCls}${posCls}">
      <span class="pt-st-pos">${s.pos}</span>
      ${portrait(s.name, 32)}
      <div class="pt-st-info">
        <span class="pt-st-name">${s.name}</span>
        <span class="pt-st-veh">${s.vehicle}</span>
      </div>
      <div class="pt-st-hp-wrap">${hpBars.join('')}</div>
      <span class="pt-st-time">${s.skipped ? '—' : s.time + 's'}</span>
      ${deltaStr}
    </div>`;
  }
  return `<div class="pt-standings-card${isFinal ? ' final' : ''}">
    <div class="pt-st-header">${phaseLabel}</div>
    ${rows}
    ${isFinal ? `<div class="pt-st-winner">${ev.standings[0]?.name} WINS IMMUNITY</div>` : ''}
  </div>`;
}
const _usedTexts = new Set();
function pickUnique(arr) {
  const available = arr.filter(t => !_usedTexts.has(t));
  const choice = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : arr[Math.floor(Math.random() * arr.length)];
  _usedTexts.add(choice);
  if (_usedTexts.size > 200) _usedTexts.clear();
  return choice;
}
function canSabotage(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ══════════════════════���═══════════════════════════════════════
// VEHICLE DEFINITIONS
// ═════════════════════════════════════════════════��════════════
const VEHICLES = {
  balloon:     { id: 'balloon',     label: 'Hot Air Balloon',     speed: 8, hp: 2, size: 'light',  stats: ['mental', 'intuition'], special: 'terrain-immune' },
  train:       { id: 'train',       label: 'Freight Train',       speed: 4, hp: 6, size: 'heavy',  stats: ['physical', 'endurance'], special: 'rear-immune' },
  truck:       { id: 'truck',       label: 'Animal Truck',        speed: 5, hp: 5, size: 'heavy',  stats: ['strategic', 'boldness'], special: 'animal-weapon' },
  horse:       { id: 'horse',       label: 'Horse',               speed: 7, hp: 3, size: 'medium', stats: ['physical', 'temperament'], special: 'terrain-adaptive' },
  motorcycle:  { id: 'motorcycle',  label: 'Motorcycle',          speed: 9, hp: 1, size: 'light',  stats: ['boldness', 'physical'], special: 'dodge' },
  raft:        { id: 'raft',        label: 'Makeshift Raft-Car',  speed: 4, hp: 4, size: 'medium', stats: ['mental', 'endurance'], special: 'sea-transition' },
  wheelchair:  { id: 'wheelchair',  label: 'Rocket Wheelchair',   speed: 8, hp: 1, size: 'light',  stats: ['boldness', 'intuition'], special: 'boost' },
  helicopter:  { id: 'helicopter',  label: 'Stolen Helicopter',   speed: 9, hp: 3, size: 'heavy',  stats: ['strategic', 'social'], special: 'skip-land' },
  gokart:      { id: 'gokart',      label: 'Go-Kart',            speed: 7, hp: 3, size: 'medium', stats: ['endurance', 'physical'], special: 'drafting' },
  zipline:     { id: 'zipline',     label: 'Zipline Rig',        speed: 8, hp: 2, size: 'light',  stats: ['intuition', 'boldness'], special: 'downhill' },
};

const VEHICLE_IDS = Object.keys(VEHICLES).filter(v => v !== 'helicopter');
const ALL_VEHICLE_IDS = Object.keys(VEHICLES);

// Sea form: each land vehicle converts to a specific boat type
// seaHp and seaSpeed are BASE values; actual values scale with remaining land HP
// convertEase: how easy the vehicle is to repurpose (affects transition time + quality bump chance)
//   'easy' = simple to strip/rebuild (light frames, modular parts) — time discount, quality bump more likely
//   'medium' = standard conversion
//   'hard' = heavy/complex machinery, hard to repurpose — time penalty, quality bump less likely
const SEA_FORMS = {
  balloon:     { id: 'balloon',     seaLabel: 'Hot Air Balloon',   tier: 'air',    baseSeaHp: 2, baseSpeed: 7, convertEase: 'easy' },
  train:       { id: 'ferry',       seaLabel: 'Armored Ferry',     tier: 'heavy',  baseSeaHp: 5, baseSpeed: 5, convertEase: 'hard' },
  truck:       { id: 'barge',       seaLabel: 'Cargo Barge',       tier: 'heavy',  baseSeaHp: 4, baseSpeed: 5, convertEase: 'hard' },
  horse:       { id: 'swimmer',     seaLabel: 'Bareback Swimmer',  tier: 'animal', baseSeaHp: 2, baseSpeed: 6, convertEase: 'easy' },
  motorcycle:  { id: 'jetski',      seaLabel: 'Scrap Jetski',      tier: 'light',  baseSeaHp: 1, baseSpeed: 8, convertEase: 'easy' },
  raft:        { id: 'sailboat',    seaLabel: 'Sailboat',          tier: 'built',  baseSeaHp: 3, baseSpeed: 7, convertEase: 'easy' },
  wheelchair:  { id: 'hovercraft',  seaLabel: 'Hovercraft',        tier: 'light',  baseSeaHp: 1, baseSpeed: 8, convertEase: 'medium' },
  helicopter:  { id: 'scrapraft',   seaLabel: 'Scrap Raft',        tier: 'scrap',  baseSeaHp: 2, baseSpeed: 4, convertEase: 'hard' },
  gokart:      { id: 'paddleboat',  seaLabel: 'Paddleboat',        tier: 'medium', baseSeaHp: 2, baseSpeed: 6, convertEase: 'easy' },
  zipline:     { id: 'parasail',    seaLabel: 'Parasail Skimmer',  tier: 'light',  baseSeaHp: 1, baseSpeed: 7, convertEase: 'medium' },
};

// Wrecked vehicles build from driftwood — everyone gets this
const DRIFTWOOD_FORM = { id: 'driftwood', seaLabel: 'Driftwood Raft', tier: 'scrap', baseSeaHp: 1, baseSpeed: 4 };

function _buildSeaVessel(assignments, name) {
  const v = assignments[name];
  const landVeh = VEHICLES[v.id];
  if (!landVeh) return { ...DRIFTWOOD_FORM, seaHp: 1, seaSpeed: 4, quality: 'wrecked', buildSkill: 0, convertTime: 6 };

  const st = pStats(name);
  // Build skill: mental (engineering) + endurance (physical labor) — how well you repurpose wreckage
  const buildSkill = (st.mental * 0.6 + st.endurance * 0.4) + noise(2.5);

  // Special cases
  if (v.special === 'terrain-immune') {
    return { ...SEA_FORMS.balloon, seaHp: 2, seaSpeed: 7, quality: 'pristine', buildSkill, convertTime: 0 };
  }
  if (v.special === 'sea-transition') {
    const hpBonus = Math.max(0, v.currentHp);
    const skillBonus = buildSkill > 7 ? 0.5 : 0;
    return { ...SEA_FORMS.raft, seaHp: 2 + Math.ceil((hpBonus + skillBonus) * 0.5), seaSpeed: 7 + hpBonus * 0.3 + skillBonus, quality: v.currentHp >= 3 ? 'pristine' : 'solid', buildSkill, convertTime: 0.5 };
  }
  if (v.heliSkipped) {
    const heliTime = buildSkill > 6 ? 5 + noise(1) : 8 + noise(2);
    return { ...SEA_FORMS.helicopter, seaHp: buildSkill > 7 ? 3 : 2, seaSpeed: 4 + (buildSkill > 7 ? 1 : 0), quality: 'scrap', buildSkill, convertTime: heliTime };
  }

  const form = SEA_FORMS[v.id] || DRIFTWOOD_FORM;
  const ease = form.convertEase || 'medium';

  // Wrecked vehicle = driftwood, but smart builders salvage more
  if (v.currentHp <= 0) {
    const sizeBonus = landVeh.size === 'heavy' ? 1.5 : landVeh.size === 'medium' ? 0.8 : 0;
    const skillSalvage = buildSkill > 7 ? 1.0 : buildSkill > 5 ? 0.5 : 0;
    const wreckedTime = ease === 'easy' ? 4 : ease === 'hard' ? 7 : 5.5;
    return {
      ...DRIFTWOOD_FORM,
      seaLabel: landVeh.size === 'heavy' ? 'Salvage Raft' : 'Driftwood Raft',
      seaHp: 1,
      seaSpeed: 4 + sizeBonus + skillSalvage + noise(0.5),
      quality: 'wrecked',
      buildSkill,
      convertTime: wreckedTime - (buildSkill > 6 ? 1 : 0),
    };
  }

  // HP ratio determines base quality
  const hpRatio = v.currentHp / landVeh.hp;
  const qualTiers = ['battered', 'patched', 'solid', 'pristine'];
  let qualIdx;
  if (hpRatio >= 0.8) qualIdx = 3;
  else if (hpRatio >= 0.5) qualIdx = 2;
  else if (hpRatio >= 0.25) qualIdx = 1;
  else qualIdx = 0;

  // Build skill can shift quality one tier up or down
  // Easy-convert vehicles are more forgiving (lower threshold to bump up)
  const bumpThreshold = ease === 'easy' ? 5.5 : ease === 'hard' ? 8 : 6.5;
  const dropThreshold = ease === 'easy' ? 2 : ease === 'hard' ? 4.5 : 3;
  if (buildSkill >= bumpThreshold && qualIdx < 3) qualIdx++;
  else if (buildSkill < dropThreshold && qualIdx > 0) qualIdx--;

  const quality = qualTiers[qualIdx];

  // Sea HP: base scaled by HP ratio + skill bonus for high builders
  const skillHpBonus = buildSkill > 7 ? 1 : 0;
  const seaHp = Math.max(1, Math.round(form.baseSeaHp * (0.4 + 0.6 * hpRatio)) + skillHpBonus);

  // Sea speed: base × HP ratio + build skill micro-bonus
  const skillSpeedBonus = (buildSkill - 5) * 0.1; // ±0.5 range around average
  const seaSpeed = form.baseSpeed * (0.6 + 0.4 * hpRatio) + skillSpeedBonus + noise(0.5);

  // Convert time: easy vehicles are quick, hard vehicles take longer, skill reduces time
  const baseTime = ease === 'easy' ? 1.0 : ease === 'hard' ? 3.0 : 2.0;
  const qualTimeMod = quality === 'pristine' ? 0 : quality === 'solid' ? 0.5 : quality === 'patched' ? 1.0 : 1.5;
  const skillTimeMod = buildSkill > 7 ? -0.5 : buildSkill < 4 ? 0.5 : 0;
  const convertTime = Math.max(0.5, baseTime + qualTimeMod + skillTimeMod);

  return { ...form, seaHp, seaSpeed, quality, buildSkill, convertTime };
}

// Archetype preference mapping for priority draft
// Each entry: [vehicleId, weight] — higher weight = more likely to pick
// 4 options per archetype so the same player doesn't always grab the same vehicle
const ARCHETYPE_PREF = {
  'challenge-beast': [['motorcycle', 5], ['horse', 4], ['zipline', 2], ['gokart', 2]],
  mastermind: [['truck', 5], ['train', 4], ['balloon', 2], ['raft', 2]],
  schemer: [['truck', 4], ['motorcycle', 4], ['zipline', 3], ['gokart', 2]],
  hero: [['train', 5], ['horse', 4], ['gokart', 3], ['raft', 1]],
  'loyal-soldier': [['train', 5], ['horse', 3], ['truck', 3], ['gokart', 2]],
  'social-butterfly': [['gokart', 5], ['raft', 4], ['balloon', 3], ['horse', 1]],
  showmancer: [['gokart', 4], ['raft', 4], ['horse', 3], ['balloon', 2]],
  wildcard: [['wheelchair', 5], ['zipline', 4], ['motorcycle', 3], ['balloon', 1]],
  'chaos-agent': [['wheelchair', 4], ['zipline', 4], ['motorcycle', 3], ['truck', 2]],
  underdog: [['balloon', 4], ['raft', 4], ['gokart', 3], ['horse', 2]],
  villain: [['truck', 5], ['motorcycle', 4], ['train', 2], ['wheelchair', 2]],
  hothead: [['motorcycle', 5], ['gokart', 4], ['horse', 3], ['wheelchair', 1]],
  floater: [['balloon', 4], ['gokart', 4], ['raft', 3], ['zipline', 2]],
  goat: [['raft', 4], ['balloon', 4], ['gokart', 3], ['horse', 2]],
  'perceptive-player': [['balloon', 5], ['zipline', 4], ['raft', 2], ['truck', 2]],
};
// Helicopter is NEVER a preference pick — it's a rare hidden find during the scramble

function _weightedPrefPick(prefs, taken) {
  const available = prefs.filter(([id]) => !taken.has(id));
  if (!available.length) return null;
  const totalW = available.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * totalW;
  for (const [id, w] of available) {
    roll -= w;
    if (roll <= 0) return id;
  }
  return available[available.length - 1][0];
}

// ════════════���═════════════════════════════════════════════════
// NARRATION TEXT BANKS
// ══════════════════════════════════════════════════════════════
const SCAVENGE_TEXT = {
  excellent: [
    (n, v) => `${n} tore through the wreckage with laser focus, emerging with the ${v} clutched triumphantly. "This baby's MINE."`,
    (n, v) => `While others fumbled through debris, ${n} zeroed in on the ${v} like it was destiny. "I saw it from across the junkyard."`,
    (n, v) => `${n} dove into a pile of twisted metal and emerged with the ${v}. Scratched, bruised, grinning. "Worth every cut."`,
    (n, v) => `The ${v} was buried under three layers of wreckage. ${n} found it in seconds. "Call it intuition. Call it desperation. Call it mine."`,
    (n, v) => `${n} scrambled over a collapsed wall, slid under a rusted beam, and snatched the ${v} from its hiding spot. "I've been eyeing this since the starting horn."`,
  ],
  good: [
    (n, v) => `${n} pulled the ${v} from the rubble. Not the first pick, but a solid find. "I can work with this."`,
    (n, v) => `After a brief scramble, ${n} secured the ${v}. A quick inspection — functional. "Let's ride."`,
    (n, v) => `${n} found the ${v} wedged between two overturned carts. A solid pull freed it. "Not bad. Not bad at all."`,
    (n, v) => `The ${v} wasn't ${n}'s first choice, but the second ${pronouns(n).sub} touched it, something clicked. "Actually... this might be perfect."`,
  ],
  late: [
    (n, v) => `${n} grabbed the ${v} — one of the last vehicles remaining. "Beggars can't be choosers." But ${pronouns(n).posAdj} eyes said otherwise.`,
    (n, v) => `The pickings were slim by the time ${n} reached the wreckage. The ${v} stared back at ${pronouns(n).obj}. "...We're going to make this work."`,
    (n, v) => `${n} was left with the ${v}. Not ideal. Not great. But ${pronouns(n).sub} patted it like an old friend. "You and me against the world, buddy."`,
    (n, v) => `Last to the junkyard, ${n} got stuck with the ${v}. ${pronouns(n).Sub} kicked the tire. It held. "Fine. FINE. Let's do this."`,
  ],
};

const TERRAIN_TEXT = [
  (n, v) => `A canyon crossing rattled ${n}'s ${v} to its bones. Metal groaned. Something cracked.`,
  (n, v) => `Rough ground sent ${n} bouncing wildly. The ${v} took a beating on every rock and rut.`,
  (n, v) => `A steep incline pushed ${n}'s ${v} to the limit. Gears ground. The frame shuddered.`,
  (n, v) => `Loose gravel sent ${n} sliding sideways. The ${v} scraped against a boulder — HARD.`,
  (n, v) => `A hidden ditch caught ${n}'s wheel. The ${v} lurched, something snapped underneath. Not good.`,
  (n, v) => `A fallen tree blocked the path. ${n} clipped it at speed — the ${v} spun 180 degrees before ${pronouns(n).sub} regained control.`,
  (n, v) => `The road surface crumbled under ${n}'s ${v}. One wheel dropped into a sinkhole. The whole rig tilted sickeningly.`,
  (n, v) => `A wall of dust hit ${n} blind. When it cleared, the ${v} was wedged against a rock face. Precious seconds lost.`,
  (n, v) => `${n}'s ${v} hit a washboard section that vibrated every bolt loose. Something important clattered to the ground behind ${pronouns(n).obj}.`,
];

const TERRAIN_IMMUNE_TEXT = [
  (n, v) => `${n} floated above the hazard in ${pronouns(n).posAdj} ${v}, watching others struggle below. "Advantage: altitude."`,
  (n, v) => `The terrain was brutal — for everyone else. ${n}'s ${v} sailed over it without a scratch.`,
  (n, v) => `Canyon? What canyon? ${n} drifted overhead in the ${v}, waving at the poor souls below.`,
  (n, v) => `While the ground crumbled, ${n}'s ${v} simply went higher. "I love flying."`,
  (n, v) => `${n} adjusted course slightly, the ${v} gliding past the hazard like it didn't exist. Below, the ground racers cursed.`,
  (n, v) => `The ${v}'s design laughed at the terrain. ${n} watched a racer below bounce off a rock wall and winced. "Glad that's not me."`,
  (n, v) => `Rocks, ditches, fallen trees — none of it mattered from ${n}'s altitude. The ${v} hummed along unbothered.`,
];

const TERRAIN_DODGE_TEXT = [
  (n, v) => `The ${v} was nimble enough to swerve around the hazard. ${n} threaded the gap with inches to spare.`,
  (n, v) => `${n} saw the obstacle coming and yanked the ${v} sideways. CLOSE. But no contact.`,
  (n, v) => `Reflexes! ${n} dodged the terrain hazard at the last second. The ${v}'s small size was an advantage for once.`,
  (n, v) => `Where a heavier vehicle would've plowed right in, ${n}'s lightweight ${v} danced around the obstacle.`,
  (n, v) => `${n} spotted the danger and hit the brakes — then slalomed through. The ${v} was built for exactly this.`,
  (n, v) => `"TOO SLOW!" ${n} taunted the canyon itself as ${pronouns(n).posAdj} ${v} slipped through untouched.`,
];

const SABOTAGE_TEXT = {
  success: [
    (att, def) => `${att} pulled alongside ${def} and slammed into ${pronouns(def).posAdj} vehicle. CRUNCH. "Nothing personal!" It was extremely personal.`,
    (att, def) => `${att} hurled a piece of debris at ${def}'s ride. Direct hit. Sparks flew. ${att} grinned. "Oops."`,
    (att, def) => `${att} veered hard into ${def}'s path, forcing a collision. Metal screamed against metal. ${att} emerged unscathed. ${def}... less so.`,
    (att, def) => `"Coming through!" ${att} rammed ${def} off the road. The impact was spectacular — and entirely intentional.`,
  ],
  fail: [
    (att, def) => `${att} swerved to ram ${def} — and missed completely. Oversteered into a ditch. "That was... the plan."`,
    (att, def) => `${att} tried to sabotage ${def}'s vehicle, but ${def} spotted it coming and dodged. "Nice try, jerk."`,
    (att, def) => `${att} lunged at ${def}'s ride — and hit a rock instead. ${att}'s OWN vehicle took the damage. Karma.`,
    (att, def) => `${att} reached for ${def}'s engine — and got a face full of exhaust instead. Backfire. Literally.`,
  ],
  dodged: [
    (att, def) => `${att} lunged at ${def}'s motorcycle — but ${def} ducked and weaved. "Too fast for you!"`,
    (att, def) => `${def} saw ${att} coming a mile away. A quick swerve, a burst of speed, and the sabotage sailed past harmlessly.`,
    (att, def) => `${att} threw a wrench at ${def}. The motorcycle dodged. ${def} flipped ${att} a salute. "Gotta be quicker!"`,
    (att, def) => `${att}'s attack whiffed as ${def}'s motorcycle leaned hard left. "Can't hit what you can't catch."`,
  ],
  animals: [
    (att, def) => `${att} popped the Animal Truck's crate open. A herd of animals STAMPEDED toward ${def}. "RELEASE THE BEASTS!"`,
    (att, def) => `${att} flipped a switch and the truck's cargo doors flew open. Animals poured out — straight at ${def}'s vehicle. Chaos.`,
    (att, def) => `"Sorry, friends," ${att} muttered, opening the truck's gate. The animals didn't need to be told twice. They charged ${def} like a furry tidal wave.`,
    (att, def) => `${att} yanked the release cord. The Animal Truck emptied in seconds — a stampede aimed directly at ${def}. "I call this move 'natural selection.'"`,
  ],
};

const DRAFT_ALLIANCE_TEXT = [
  (a, b) => `${a} pulled alongside ${b}. "Ride together? Watch each other's backs?" ${b} nodded. A road alliance was born.`,
  (a, b) => `${a} and ${b} locked eyes across the dusty road. An unspoken agreement formed. Side by side, faster together.`,
  (a, b) => `"You cover left, I cover right," ${a} called to ${b}. The drafting formation clicked into place. Teamwork.`,
  (a, b) => `${a} waved ${b} into formation. The slipstream benefit was immediate — both vehicles picked up speed.`,
];

const UNDERDOG_GAMBIT_TEXT = {
  success: [
    (n) => `${n} took a MASSIVE risk — cutting through uncharted terrain. Somehow it worked. ${pronouns(n).Sub} shot ahead by a huge margin. "I'M STILL IN THIS!"`,
    (n) => `${n} hit the nitrous on pure faith. The shortcut was insane. The payoff was HUGE. Underdog magic.`,
    (n) => `Against all odds, ${n}'s desperate gamble paid off. A hidden shortcut cut ${pronouns(n).posAdj} time dramatically.`,
    (n) => `${n} drove off a cliff — and somehow landed on a lower road that was FASTER. "I MEANT TO DO THAT!"`,
  ],
  fail: [
    (n) => `${n} went for the risky shortcut... and hit a dead end. ${pronouns(n).Sub} had to backtrack. Disaster.`,
    (n) => `${n}'s gambit failed spectacularly. The "shortcut" was actually longer. Much longer.`,
    (n) => `${n} took the leap of faith — and landed in a ditch. The underdog's curse struck again.`,
    (n) => `${n} tried something crazy. It was crazy. It didn't work. Now ${pronouns(n).sub} was even further behind.`,
  ],
};

const SEA_TRANSITION_TEXT = {
  pristine: [
    (n, landV, seaV) => `${n}'s ${landV} was barely scratched. The conversion to a ${seaV} was quick and clean — solid hull, working rudder, ready to sail.`,
    (n, landV, seaV) => `With ${pronouns(n).posAdj} ${landV} still in great shape, ${n} had PLENTY of material. The ${seaV} looked almost professional. "She'll hold."`,
    (n, landV, seaV) => `${n} stripped the ${landV} down methodically. Every panel, every bolt repurposed. The resulting ${seaV} was a thing of beauty.`,
    (n, landV, seaV) => `"More material than I need!" ${n} grinned, building a sturdy ${seaV} from the well-preserved ${landV}. Extra planking for reinforcement.`,
  ],
  solid: [
    (n, landV, seaV) => `${n}'s ${landV} had taken some hits, but there was enough good material for a decent ${seaV}. Not pretty, but functional.`,
    (n, landV, seaV) => `The ${landV} was dented but usable. ${n} hammered it into a ${seaV} shape, patching the worst holes. "It'll float. Probably."`,
    (n, landV, seaV) => `${n} worked fast, salvaging what ${pronouns(n).sub} could from the damaged ${landV}. The ${seaV} wasn't winning any beauty contests, but it was seaworthy.`,
    (n, landV, seaV) => `Half the ${landV} was still intact. ${n} turned it into a respectable ${seaV}, reinforcing the weak spots with spare metal.`,
  ],
  patched: [
    (n, landV, seaV) => `${n}'s ${landV} was in rough shape. The ${seaV} ${pronouns(n).sub} cobbled together had visible gaps. "Don't look at it. Just... don't."`,
    (n, landV, seaV) => `Not much left of the ${landV}. ${n} stretched what remained into a rickety ${seaV}. Every wave would be a test.`,
    (n, landV, seaV) => `${n} stared at the wreckage of ${pronouns(n).posAdj} ${landV}. "I can work with this." ${pronouns(n).Sub} couldn't, really, but the ${seaV} floated. Barely.`,
    (n, landV, seaV) => `The ${seaV} looked like it was held together by hope and duct tape. Because it was. ${n} eyed the ocean nervously.`,
  ],
  battered: [
    (n, landV, seaV) => `${n}'s ${landV} was barely recognizable. The ${seaV} was more prayer than boat — thin walls, no rudder, one good wave from sinking.`,
    (n, landV, seaV) => `"This is... a boat?" ${n} looked at the ${seaV} ${pronouns(n).sub}'d built from ${landV} scraps. It looked like modern art. Floating modern art. For now.`,
    (n, landV, seaV) => `Almost nothing survived the land race. ${n} lashed the remaining ${landV} pieces into a ${seaV} that defied physics by floating at all.`,
    (n, landV, seaV) => `${n} had almost no material to work with. The ${seaV} was embarrassingly small, embarrassingly fragile, and embarrassingly... leaking.`,
  ],
  wrecked: [
    (n, landV, seaV) => `${n}'s vehicle was GONE. ${pronouns(n).Sub} gathered driftwood from the beach, lashed it together, and prayed. The ${seaV} was barely a raft.`,
    (n, landV, seaV) => `No vehicle, no material. ${n} scavenged debris from the shoreline and built a ${seaV} from scraps. It was pathetic. But it floated.`,
    (n, landV, seaV) => `With nothing but wreckage and willpower, ${n} constructed the saddest ${seaV} in racing history. "I've ridden worse." ${pronouns(n).Sub} hadn't.`,
    (n, landV, seaV) => `Everyone else had vehicle parts. ${n} had splinters and desperation. The ${seaV} was a disgrace on water — but it was THERE.`,
  ],
  seamless: [
    (n) => `${n}'s Raft-Car hit the water without missing a beat. "This is what I was BUILT for." The pontoons caught perfectly.`,
    (n) => `Seamless transition. ${n}'s Raft-Car deployed its sail the instant it touched water. Zero downtime.`,
    (n) => `While others struggled at the shore, ${n} sailed right past them. The Raft-Car's dual-mode design was genius.`,
    (n) => `${n} didn't even slow down at the waterline. The Raft-Car simply... became a raft. "Thank you, engineering."`,
  ],
  balloon: [
    (n) => `Land. Sea. It was all the same from up here. ${n}'s Hot Air Balloon didn't care what was below.`,
    (n) => `"Ocean? What ocean?" ${n} floated overhead, the balloon's altitude making the phase transition irrelevant.`,
    (n) => `The balloon crossed from land to sea without a bump. ${n} waved at the swimmers below.`,
    (n) => `${n} adjusted altitude slightly and continued as if nothing had changed. Perks of flying.`,
  ],
};

const BUILD_SKILL_TEXT = {
  genius: [
    (n) => `${pronouns(n).Sub} worked with an engineer's precision — every joint tight, every seam sealed.`,
    (n) => `${n}'s hands moved like they'd built boats before. The conversion was surgical.`,
    (n) => `"${n} is a natural shipwright," the camera crew muttered, watching ${pronouns(n).obj} work.`,
    (n) => `${pronouns(n).Sub} finished first, wiped ${pronouns(n).posAdj} hands, and helped shore up the hull with leftover material.`,
  ],
  handy: [
    (n) => `${n} handled the tools with quiet confidence — not flashy, but effective.`,
    (n) => `Steady hands. ${n} knew which pieces to keep and which to toss.`,
    (n) => `${pronouns(n).Sub} wasn't the fastest builder, but every piece ${pronouns(n).sub} placed was solid.`,
    (n) => `${n} hummed while working, clearly in ${pronouns(n).posAdj} element with the hands-on challenge.`,
  ],
  clumsy: [
    (n) => `${n} fumbled with the tools, dropping bolts into the sand. This was going to take a while.`,
    (n) => `"Righty-tighty... or lefty?" ${n} stared at a wrench like it was an alien artifact.`,
    (n) => `${pronouns(n).Sub} hammered ${pronouns(n).posAdj} own thumb twice before getting a single plank secured.`,
    (n) => `${n}'s build technique was... creative. The hull panel was upside down and nobody had the heart to tell ${pronouns(n).obj}.`,
  ],
  hopeless: [
    (n) => `${n} sat in a pile of scrap looking completely lost. "I don't... how does wood work?"`,
    (n) => `Every piece ${n} attached fell off immediately. ${pronouns(n).Sub} might have been building it backwards.`,
    (n) => `${n} tried to nail two pieces together and somehow broke both. The ocean awaited with zero sympathy.`,
    (n) => `"I have NEVER built anything in my LIFE," ${n} wailed, holding a saw the wrong way.`,
  ],
};

const MINE_TEXT = [
  (n) => `BOOM! A mine detonated beneath ${n}'s boat. Wood splintered. Water rushed in. "PATCH IT! PATCH IT!"`,
  (n) => `${n} hit a sea mine. The explosion rocked everything within fifty meters. ${pronouns(n).Sub} was taking on water fast.`,
  (n) => `A concealed mine caught ${n}'s hull. The blast punched a hole clean through. "This is NOT good!"`,
  (n) => `${n} sailed straight into a mine. The ocean erupted. When the spray cleared, ${pronouns(n).posAdj} boat was listing badly.`,
];

const STORM_TEXT = [
  (n) => `The storm hit ${n} like a wall. Waves crashed over the bow. ${pronouns(n).Sub} fought the current with everything.`,
  (n) => `Lightning cracked overhead as ${n} battled through the squall. Visibility dropped to nothing.`,
  (n) => `${n} gripped the helm as the storm tried to tear ${pronouns(n).obj} from the vessel. Salt spray stung ${pronouns(n).posAdj} eyes.`,
  (n) => `The waves rose. ${n}'s boat crested one — and nearly didn't make it over the next.`,
];

const SWORDFISH_TEXT = [
  (a, b) => `${a} and ${b} clashed on the open water! Their boats slammed together, riders grappling for advantage.`,
  (a, b) => `A naval confrontation erupted between ${a} and ${b}. Oars swung like swords. Water sprayed like blood.`,
  (a, b) => `${a} rammed ${b}'s boat sideways. "This ocean ain't big enough for both of us!" A sea duel commenced.`,
  (a, b) => `Side by side on the waves, ${a} and ${b} traded blows. The sea became their arena.`,
];

const BEACH_SPRINT_TEXT = {
  fast: [
    (n) => `${n} EXPLODED out of the water and tore across the sand. Arms pumping. Legs burning. The finish line was RIGHT THERE.`,
    (n) => `${n} hit the beach at full sprint. The sand was nothing — pure adrenaline carried ${pronouns(n).obj} to the finish.`,
    (n) => `The moment ${n}'s feet touched sand, it was over. ${pronouns(n).Sub} ran like ${pronouns(n).posAdj} life depended on it.`,
    (n) => `${n} charged up the beach with a primal scream. Nothing was stopping ${pronouns(n).obj}. Nothing.`,
  ],
  mid: [
    (n) => `${n} sprinted up the beach, legs burning from the sea crossing. Not first, not last. Every second counted.`,
    (n) => `${n} pushed through the sand, fighting exhaustion. The finish line shimmered ahead like a mirage.`,
    (n) => `The beach sprint took everything ${n} had left. ${pronouns(n).Sub} stumbled once, recovered, kept running.`,
    (n) => `${n} ran with grim determination. The soft sand pulled at ${pronouns(n).posAdj} feet like the ocean didn't want to let go.`,
  ],
  slow: [
    (n) => `${n} crawled up the beach. Literally crawled. The race had taken everything. But ${pronouns(n).sub} was still moving.`,
    (n) => `${n} staggered across the sand, each step an act of will. The finish line felt impossibly far.`,
    (n) => `Exhaustion hit ${n} like a wall on the beach. ${pronouns(n).Sub} weaved drunkenly toward the finish.`,
    (n) => `${n} collapsed twice on the sprint to the finish. Got up both times. Barely.`,
  ],
};

const PHOTO_FINISH_TEXT = [
  (a, b) => `${a} and ${b} hit the beach at the SAME time! A dead sprint — neck and neck — sand flying — lungs screaming — and at the VERY last second...`,
  (a, b) => `PHOTO FINISH! ${a} and ${b} dove for the finish line simultaneously. The cameras would need to decide this one.`,
  (a, b) => `It came down to CENTIMETERS. ${a} and ${b} crossed the finish line in what looked like a tie. The replay would tell the truth.`,
  (a, b) => `The crowd erupted as ${a} and ${b} sprinted side by side for the final meters. Neither would yield. Neither would quit.`,
];

const BOOST_TEXT = [
  (n) => `${n} hit the boost button on the Rocket Wheelchair. WHOOOOSH! A trail of fire and an explosion of speed!`,
  (n) => `"ROCKET POWER!" ${n} slammed the boost. The wheelchair rocketed forward, leaving scorch marks and stunned opponents.`,
  (n) => `${n} saved the boost for this exact moment. The Rocket Wheelchair SCREAMED forward. Pure adrenaline.`,
  (n) => `The Rocket Wheelchair's thrusters ignited. ${n} shot forward like a cannonball. "LATER, LOSERS!"`,
];

const HELICOPTER_SKIP_TEXT = [
  (n) => `${n} fired up the Stolen Helicopter and soared over the land race. Fast? Yes. Free? No — fuel costs, turbulence, and a rough landing ate real time.`,
  (n) => `The helicopter's blades chopped through the air as ${n} bypassed the ground chaos below. But flying isn't instant — headwinds, fuel searching, and a sketchy landing zone took their toll.`,
  (n) => `${n} flew overhead while the ground racers dueled below. Faster than driving, but not by as much as ${pronouns(n).sub} hoped — the helicopter burned fuel fast and the landing was ROUGH.`,
  (n) => `While others battled through dirt and canyons, ${n} took to the sky. The helicopter saved time on the land phase, but the sea crossing would be a different story entirely.`,
];

const HELI_DISCOVERY_TEXT = [
  (n) => `"No. Way." ${n} yanked a tarp off something massive at the back of the wreckage. Rotor blades. A cockpit. A HELICOPTER. "I can't believe nobody else found this."`,
  (n) => `${n} was picking through the worst corner of the junkyard when ${pronouns(n).posAdj} hand hit something metallic and smooth. Not rusty. Not broken. A helicopter, buried under debris. "${pronouns(n).Sub} who digs deepest finds the gold."`,
  (n) => `Everyone else had already claimed their rides. ${n} was about to settle for scraps when the glint of rotor blades caught ${pronouns(n).posAdj} eye. Hidden. Intact. A stolen helicopter. "Oh, this changes EVERYTHING."`,
  (n) => `The others laughed at ${n} for searching the far end of the wreckage. They weren't laughing when ${pronouns(n).sub} rolled out a HELICOPTER. "Who's the bottom pick NOW?"`,
];

const VEHICLE_DESTROY_TEXT = [
  (n, v) => `${n}'s ${v} finally gave out. A shower of sparks, a death rattle, and silence. On foot from here.`,
  (n, v) => `CRASH! ${n}'s ${v} disintegrated mid-race. Parts flew everywhere. ${n} emerged from the wreckage, shaken but running.`,
  (n, v) => `The ${v} couldn't take any more. It collapsed beneath ${n} in a heap of twisted metal. "Guess I'm WALKING."`,
  (n, v) => `${n}'s ${v} exploded in a cloud of smoke and regret. ${pronouns(n).Sub} stumbled out coughing. "I'm fine. I'M FINE."`,
  (n, v) => `A sickening CRUNCH and ${n}'s ${v} folded in half. ${pronouns(n).Sub} climbed free, dusted ${pronouns(n).ref} off, and started running. What else was there to do?`,
  (n, v) => `The ${v}'s axle snapped clean through. ${n} watched it roll away in two pieces. "Well. That's that." ${pronouns(n).Sub} kicked off ${pronouns(n).posAdj} shoes and ran.`,
  (n, v) => `${n}'s ${v} died with a sad metallic wheeze. A single wheel rolled past ${pronouns(n).obj} like a farewell. Running it was.`,
  (n, v) => `One final impact — that was all it took. ${n}'s ${v} split apart at the seams. ${pronouns(n).Sub} stood in the debris field, stunned, then sprinted.`,
];

const SHOWMANCE_RACE_TEXT = [
  (a, b) => `${a} and ${b} found each other on the road. A stolen glance. A smile through the dust. Even in competition, the spark was undeniable.`,
  (a, b) => `${a} slowed down — just for a second — to ride alongside ${b}. "You okay?" "Better now." They rode together for a moment before the race pulled them apart.`,
  (a, b) => `${b} was in trouble. ${a} noticed immediately. Without thinking, ${a} swerved to shield ${b} from an oncoming hazard. "GO! I've got you!"`,
  (a, b) => `Their vehicles pulled alongside each other. ${a} reached out. ${b} took ${pronouns(a).posAdj} hand — just for a second. Then they let go. The race demanded it.`,
];

const SCRAMBLE_TEXT = {
  sprint: [
    (n) => `${n} exploded off the starting line, vaulting over debris like it was an obstacle course. First to the wreckage.`,
    (n) => `Nobody could keep up with ${n}. ${pronouns(n).Sub} tore through the junkyard at full speed, eyes locked on ${pronouns(n).posAdj} prize.`,
    (n) => `${n} sprinted so fast ${pronouns(n).sub} left skid marks in the dirt. The wreckage didn't stand a chance.`,
    (n) => `Like a heat-seeking missile, ${n} blasted into the debris field. First come, first served.`,
  ],
  stumble: [
    (n) => `${n} caught a foot on twisted metal and went DOWN. Face-first into the dirt. The scramble moved on without mercy.`,
    (n) => `A hidden cable snagged ${n}'s ankle. ${pronouns(n).Sub} tumbled hard, losing precious seconds.`,
    (n) => `${n} slipped on an oil slick and crashed into a pile of fuselage panels. "I'm fine! I'm FINE!" ${pronouns(n).Sub} was not fine.`,
    (n) => `The wreckage fought back — ${n} took a rusty edge to the shin and stumbled. Others surged past.`,
  ],
  hangBack: [
    (n) => `${n} didn't run. ${pronouns(n).Sub} stood at the edge of the wreckage, watching everyone else scramble, calculating. "Let them fight. I'll take what's left."`,
    (n) => `While everyone else sprinted, ${n} walked. Slowly. Deliberately. ${pronouns(n).Sub} was reading the field, not running it.`,
    (n) => `${n} leaned against a wing fragment and crossed ${pronouns(n).posAdj} arms. "I'll wait." Smart? Or suicidal?`,
    (n) => `${n} hung back, eyes scanning the chaos. ${pronouns(n).Sub} didn't need to be first — ${pronouns(n).sub} needed to be RIGHT.`,
  ],
};

const CONFLICT_TEXT = {
  fight: [
    (a, b, v) => `${a} and ${b} BOTH lunged for the ${v}! A tug-of-war erupted — shoving, pulling, cursing. The wreckage trembled.`,
    (a, b, v) => `${a}'s hand closed on the ${v} at the exact same moment as ${b}'s. Their eyes met. Neither was letting go.`,
    (a, b, v) => `"THAT'S MINE!" ${a} and ${b} screamed simultaneously, both gripping the ${v}. A fight was inevitable.`,
    (a, b, v) => `The ${v} sat between ${a} and ${b}. Both wanted it. Both reached for it. Something had to give.`,
  ],
  fightWin: [
    (w, l, v) => `${w} wrenched the ${v} free with a final HEAVE. ${l} stumbled back, empty-handed. "Find your own ride."`,
    (w, l, v) => `A shoulder check from ${w} sent ${l} sprawling. The ${v} was claimed. "Nothing personal." It was personal.`,
    (w, l, v) => `${w} held on tighter. ${l}'s grip slipped. The ${v} was decided. ${l} glared daggers.`,
    (w, l, v) => `${w} planted ${pronouns(w).posAdj} feet and PULLED. ${l} went flying. The ${v} belonged to ${w} now.`,
  ],
  steal: [
    (a, b, v) => `${a} slid in from the shadows and SNATCHED the ${v} right as ${b} reached for it. "Yoink."`,
    (a, b, v) => `${b} was inches from the ${v} when ${a}'s hand shot out and grabbed it first. "Too slow."`,
    (a, b, v) => `${a} shouldered ${b} aside and claimed the ${v} with a smirk. "Thanks for finding it for me."`,
    (a, b, v) => `The ${v} vanished from under ${b}'s fingertips — ${a} had stolen it clean. Calculated. Ruthless.`,
  ],
  yield: [
    (a, b, v) => `${a} saw ${b} eyeing the ${v} and stepped aside. "Take it. You need it more than me." A rare act of kindness.`,
    (a, b, v) => `${a} pulled ${pronouns(a).posAdj} hand back from the ${v} and nodded at ${b}. "Go ahead." Loyalty over strategy.`,
    (a, b, v) => `"It's yours," ${a} said softly, yielding the ${v} to ${b}. Some bonds are worth more than a good ride.`,
    (a, b, v) => `${a} could have taken the ${v}. Instead, ${pronouns(a).sub} pushed it toward ${b}. "Win this thing."`,
  ],
  injury: [
    (n) => `${n} sliced ${pronouns(n).posAdj} palm on a jagged edge pulling ${pronouns(n).posAdj} vehicle free. Blood dripped onto metal. "Just a scratch."`,
    (n) => `A falling panel clipped ${n}'s shoulder. ${pronouns(n).Sub} winced, kept digging. The vehicle was almost free.`,
    (n) => `${n} burned ${pronouns(n).posAdj} hand on a still-hot engine block. ${pronouns(n).Sub} hissed but didn't let go.`,
    (n) => `Rust and broken glass — ${n} emerged cut up but clutching ${pronouns(n).posAdj} ride. "Beauty is pain."`,
  ],
  reluctantBond: [
    (a, b) => `${a} and ${b} surveyed the pathetic remains. "We got shafted," ${a} muttered. ${b} nodded. "Together, then?" A bond forged in junk.`,
    (a, b) => `"Look at us," ${a} said to ${b}, gesturing at their sorry vehicles. They both laughed. Sometimes misery really does love company.`,
    (a, b) => `${a} kicked ${pronouns(a).posAdj} vehicle. ${b} kicked ${pronouns(b).pos}. They looked at each other and burst out laughing. Allies by default.`,
    (a, b) => `"Could be worse," ${a} told ${b}. "How?" "We could be doing this alone." A grudging smile. A reluctant partnership.`,
  ],
  hiddenGem: [
    (n, v) => `Wait — what's that? ${n} spotted something buried deep under the wreckage nobody else noticed. The ${v}! A hidden gem!`,
    (n, v) => `${n} was about to give up when ${pronouns(n).posAdj} foot hit something solid. Digging revealed the ${v} — overlooked by everyone. "JACKPOT."`,
    (n, v) => `While others fought over the obvious picks, ${n} was doing recon. And it paid off: the ${v}, buried but intact.`,
    (n, v) => `"No way..." ${n} pulled a tarp aside to reveal the ${v}. Hidden in plain sight. Sometimes the last one looking finds the best prize.`,
  ],
};

const WRECKAGE_FLAVOR = [
  'Smoke poured from the fuselage. The clock was ticking.',
  'The horn echoed off the wreckage. Bodies flew in every direction.',
  'Metal groaned and shifted. Nothing in this junkyard was stable.',
  'Sparks popped from a severed cable. The smell of jet fuel hung heavy.',
  'The sun beat down on twisted aluminum. Heat shimmer made the wreckage dance.',
  'A wing panel crashed to the ground. Nobody flinched. Everyone was too focused.',
  `${host()} watched from a safe distance, sipping lemonade. "Don't die on me! Paperwork's a nightmare."`,
  'Somewhere in the wreckage, something hissed. Nobody wanted to know what.',
  'The junkyard stretched endlessly — fuselage, engine parts, luggage, memories of a plane that used to fly.',
  'A suitcase burst open mid-scramble. Clothes scattered like confetti. Nobody stopped.',
];

const FLAVOR_TEXT = {
  land: [
    'Dust clouds rose from the convoy like smoke signals of chaos.',
    'The desert sun beat down on the racers without mercy.',
    'Somewhere in the distance, a coyote watched the parade of madness pass by.',
    'The road ahead shimmered with heat mirages — or was that another racer?',
    `${host()} watched from a monitoring helicopter, cackling. "This is GREAT television!"`,
    'Engine oil mixed with sweat. Nobody smelled good. Nobody cared.',
    'The horizon stretched endlessly — a cruel reminder of how far they had to go.',
    'Debris from earlier crashes littered the road like a warning.',
    'A vulture circled overhead. Optimistic bird.',
    'The checkered flag was a rumor. The pain was very real.',
    'Exhaust fumes hung in the air like a toxic ghost. The air tasted like regret and gasoline.',
    'The road narrowed to a single lane. Somebody was going to have to yield. Nobody wanted to be that somebody.',
    'Tire marks crisscrossed the dirt in every direction. A map of desperation.',
    `A camera drone swooped low. ${host()} wanted close-ups of the suffering.`,
    'Metal shrieked against rock somewhere behind. Nobody looked back. Looking back was for losers.',
  ],
  sea: [
    'Salt spray stung like a thousand tiny needles.',
    'The ocean didn\'t care about alliances or strategies. It only cared about drowning you.',
    'Somewhere below, fish watched the spectacle with bewildered fish-faces.',
    `${host()} radioed from shore: "Looking a little green out there! Don't throw up on camera!"`,
    'The waves had a rhythm. The racers didn\'t.',
    'A seagull landed on someone\'s mast. Stole a cracker. Left. Best part of its day.',
    'The finish line was invisible from here. Only faith and stubbornness kept them going.',
    'Jellyfish drifted past like transparent land mines with opinions.',
    'The wind shifted. Half the fleet groaned. The other half cheered. Sailing was a fickle mistress.',
    'A whale surfaced nearby, blew once, and dove. Even the ocean had better things to do.',
    'Barnacles. Everywhere barnacles. The sea was slow-motion sabotage.',
    'The coastline appeared as a thin dark line on the horizon. Hope was restored. Temporarily.',
  ],
  beach: [
    'The sand was soft and treacherous — every step sank ankle-deep.',
    'Palm trees swayed overhead, indifferent to the human drama below.',
    'The finish line was so close they could TASTE it. It tasted like salt and exhaustion.',
    `${host()} stood at the finish with a stopwatch, milking every second of drama.`,
    'Crabs scattered from the stampede of desperate finishers.',
    'Seaweed tangled around ankles. The ocean wasn\'t done with them yet.',
    'The crowd of eliminated players watched from the sidelines, some cheering, some definitely not.',
    'Sand flew like shrapnel from desperate footfalls. The beach was a warzone.',
  ],
};

// ══════════════════════════════════════════════════════════════
// POSITION & MOMENTUM TEXT BANKS
// ══════════════════════════════════════════════════════════════
const OVERTAKE_TEXT = [
  (a, b) => `${a} BLEW past ${b}! "Eat my dust!" The gap widened instantly.`,
  (a, b) => `${a} found a burst of speed and overtook ${b}. ${b} couldn't believe it.`,
  (a, b) => `In a flash, ${a} surged ahead of ${b}. The positions swapped. ${b} gritted ${pronouns(b).posAdj} teeth.`,
  (a, b) => `${a} pulled alongside ${b}... then kept going. ${b} watched helplessly as ${a} disappeared ahead.`,
  (a, b) => `"Excuse me!" ${a} shot past ${b} like ${pronouns(b).sub} was standing still. The leaderboard reshuffled.`,
  (a, b) => `A masterful maneuver from ${a} left ${b} in the rearview. ${b}'s face said it all — fury.`,
];

const LEAD_CHANGE_TEXT = [
  (n) => `${n} took the LEAD! The front-runner position belonged to ${pronouns(n).obj} now. Everyone else was chasing.`,
  (n) => `NEW LEADER: ${n}! The race dynamics shifted instantly. All eyes were on ${pronouns(n).obj}.`,
  (n) => `${n} surged to FIRST PLACE. The target on ${pronouns(n).posAdj} back just got bigger.`,
  (n) => `"I'M WINNING THIS!" ${n} screamed, taking the lead for the first time. The others scrambled to respond.`,
];

const FALLING_BEHIND_TEXT = [
  (n) => `${n} was falling behind. The gap grew wider with every second. Desperation crept in.`,
  (n) => `${n} dropped to the back of the pack. ${pronouns(n).Sub} was losing ground fast.`,
  (n) => `Things were NOT looking good for ${n}. Every other racer was pulling away.`,
  (n) => `${n} hit a wall. Fatigue, bad luck, broken vehicle — it didn't matter WHY. ${pronouns(n).Sub} was last.`,
  (n) => `The gap between ${n} and the pack was becoming embarrassing. ${pronouns(n).Sub} could barely see them anymore.`,
  (n) => `${n}'s confidence crumbled with every passing second. The others were dots on the horizon now.`,
  (n) => `"No... no no no..." ${n} watched helplessly as the competition disappeared into the distance.`,
  (n) => `${n} was in trouble. Real trouble. The kind where you start wondering if immunity even matters anymore.`,
];

const DESPERATION_TEXT = [
  (n) => `${n} threw caution to the wind. "I've got NOTHING to lose!" Pure reckless energy took over.`,
  (n) => `${n}'s eyes went wild. Last place? Not acceptable. ${pronouns(n).Sub} drove like a maniac — risking everything.`,
  (n) => `Something snapped inside ${n}. The fear of losing overwhelmed the fear of crashing. FULL THROTTLE.`,
  (n) => `"THIS ISN'T OVER!" ${n} screamed, pushing ${pronouns(n).posAdj} vehicle past its limits. The engine SCREAMED back.`,
  (n) => `${n} started laughing. The kind of laugh that meant either genius or breakdown. ${pronouns(n).Sub} yanked the steering wheel HARD.`,
  (n) => `Desperation turned to fury. ${n} SLAMMED the accelerator, eyes locked forward. "I'm NOT going home like this."`,
  (n) => `${n} abandoned all strategy. No more thinking — just raw, primal speed. The vehicle groaned in protest.`,
  (n) => `"MOVE!" ${n} screamed at no one, at everyone, at the universe. ${pronouns(n).Sub} found a gear nobody knew existed.`,
];

const MOMENTUM_TEXT = [
  (n) => `${n} was on a TEAR. Every segment, ${pronouns(n).sub} gained ground. Unstoppable momentum building.`,
  (n) => `Nobody could catch ${n} right now. ${pronouns(n).Sub} was in the zone — perfect line, perfect speed, perfect focus.`,
  (n) => `${n} hadn't slowed down since the race started. The others were watching a masterclass in racing.`,
  (n) => `The gap between ${n} and everyone else was GROWING. This was domination, pure and simple.`,
];

const PACK_CLUSTER_TEXT = [
  (a, b, c) => `Three racers — ${a}, ${b}, and ${c} — were neck and neck! A single mistake would decide everything.`,
  (a, b, c) => `${a}, ${b}, and ${c} formed a tight cluster. Elbows out. Nobody giving an inch.`,
  (a, b) => `${a} and ${b} were dead even! Side by side, neither willing to blink first.`,
  (a, b) => `Bumper to bumper — ${a} and ${b} traded paint as they jockeyed for position. This was PERSONAL.`,
];

const OVERTAKE_ONFOOT_TEXT = [
  (a, b) => `On foot and furious, ${a} sprinted past ${b}! Pure willpower. No engine required.`,
  (a, b) => `${a} — running barefoot — somehow caught and passed ${b}. ${b} couldn't believe a RUNNER was beating ${pronouns(b).obj}.`,
  (a, b) => `"I don't NEED a vehicle!" ${a} screamed, legs pumping, overtaking ${b} on raw adrenaline alone.`,
  (a, b) => `${a} found a shortcut on foot that no vehicle could take. ${pronouns(a).Sub} emerged ahead of ${b}, grinning through the pain.`,
];

const FALLING_BEHIND_ONFOOT_TEXT = [
  (n) => `Without a vehicle, ${n} was fading fast. Running couldn't keep up with engines.`,
  (n) => `${n} stumbled, lungs burning. On foot against machines — the math was brutal.`,
  (n) => `Every step cost ${n} more ground. The vehicles ahead were pulling away and there was nothing ${pronouns(n).sub} could do about it.`,
  (n) => `${n}'s legs were screaming. No vehicle, no hope of catching anyone. Just survival now.`,
];

const ONFOOT_SEGMENT_TEXT = [
  (n) => `${n} ran barefoot over gravel. Every step was agony but stopping wasn't an option.`,
  (n) => `Sweat poured down ${n}'s face. No engine, no wheels — just raw human endurance against the course.`,
  (n) => `${n} spotted wreckage from someone else's vehicle. ${pronouns(n).Sub} grabbed a hubcap as a makeshift shield and kept running.`,
  (n) => `"I trained for this," ${n} gasped between breaths. ${pronouns(n).Sub} hadn't. But lying helped.`,
  (n) => `${n}'s feet were bleeding but ${pronouns(n).sub} wouldn't stop. The cameras were watching. EVERYONE was watching.`,
  (n) => `A camera drone buzzed overhead. ${n} waved it away. "Get that out of my FACE!" ${pronouns(n).Sub} had bigger problems than TV ratings.`,
  (n) => `${n} found a rhythm. Left, right, left, right. Don't think about the pain. Don't think about the distance. Just RUN.`,
  (n) => `The other racers zoomed past in their vehicles. ${n} watched them go, jaw set. "I'm still in this."`,
  (n) => `${n} cut through brush that no vehicle could navigate. A small advantage — but on foot, every second counted.`,
  (n) => `"This is SO unfair!" ${n} shouted at nobody. ${pronouns(n).Sub} kicked a rock, hurt ${pronouns(n).posAdj} toe, and kept going.`,
  (n) => `${n} hitched ${pronouns(n).posAdj} shorts up and SPRINTED. For about twelve seconds. Then the wheezing started.`,
  (n) => `Somewhere behind ${n}, the wreckage of ${pronouns(n).posAdj} vehicle still smoldered. Ahead: nothing but road and regret.`,
];

const ONFOOT_DETERMINATION_TEXT = [
  (n) => `${n} refused to quit. Barefoot, bruised, and dead last — but still RACING. The crowd back home would be proud.`,
  (n) => `Something shifted in ${n}'s eyes. The pain was still there, but the despair was gone. Pure determination now.`,
  (n) => `${n} dug deep. Deeper than any engine could reach. This wasn't about winning anymore — it was about FINISHING.`,
  (n) => `"You think losing my vehicle means I'm done?" ${n} growled. ${pronouns(n).Sub} picked up the pace. Somehow.`,
];

const VEHICLE_FLAVOR_TEXT = {
  balloon: [
    (n) => `${n}'s Hot Air Balloon caught a thermal updraft. "Higher! HIGHER!" The altitude advantage was real.`,
    (n) => `A gust of wind pushed ${n}'s balloon sideways. ${pronouns(n).Sub} wrestled with the burner controls. "Come ON!"`,
    (n) => `${n} watched the chaos below from the balloon basket, navigating by landmarks. "Left... no, RIGHT!"`,
    (n) => `The balloon's envelope billowed as ${n} hit the burner. Higher meant faster — if the wind cooperated.`,
  ],
  train: [
    (n) => `${n}'s Freight Train hit a straightaway and the throttle went to max. The rails SANG. Nothing could stop this.`,
    (n) => `A track switch ahead! ${n} yanked the lever — the train took the shortcut route. "Come ON come ON!"`,
    (n) => `${n}'s train was a BEAST on flat ground. The sheer mass of it created momentum nothing else could match.`,
    (n) => `The Freight Train's horn BLARED as ${n} rounded a curve. Other racers scattered from the tracks.`,
  ],
  truck: [
    (n) => `The animals in ${n}'s truck were getting restless. Something banged against the walls. ${n} gulped.`,
    (n) => `${n} heard growling from the cargo hold. "Easy, guys... EASY..." The Animal Truck had a mind of its own.`,
    (n) => `A chicken escaped from ${n}'s truck and got stuck in ${pronouns(n).posAdj} face. "GAH! I CAN'T SEE!"`,
    (n) => `${n} sweet-talked the animals. "Good beasts. Nice beasts." The truck settled down. Crisis averted. For now.`,
  ],
  horse: [
    (n) => `${n}'s horse found its stride — a beautiful gallop that ate up the terrain. Animal and rider moved as one.`,
    (n) => `The horse spooked at a shadow. ${n} held on tight, whispering calm words until the animal settled.`,
    (n) => `${n}'s horse leaped over a fallen log with grace. "YEAH! That's my girl!" Natural agility.`,
    (n) => `${n} patted the horse's neck. "Almost there. One more push." The animal responded, surging forward.`,
  ],
  motorcycle: [
    (n) => `${n} leaned into the curve, knee nearly scraping the ground. The motorcycle screamed through the apex. PERFECTION.`,
    (n) => `"FASTER!" ${n} twisted the throttle. The motorcycle responded instantly — a rocket on two wheels.`,
    (n) => `The motorcycle's agility was unmatched. ${n} threaded through gaps the bigger vehicles couldn't touch.`,
    (n) => `A wheelie from ${n}! Showing off? Or just riding the acceleration? Either way, the crowd would LOVE it.`,
  ],
  raft: [
    (n) => `${n}'s Raft-Car bounced over rough terrain. Not elegant, not fast — but surprisingly tough.`,
    (n) => `"This thing is hideous but it WORKS!" ${n} laughed, wrestling the Raft-Car around another obstacle.`,
    (n) => `The Raft-Car's pontoons dragged on the road. ${n} didn't care — ${pronouns(n).sub} was saving energy for the sea.`,
    (n) => `${n} patched a leak in the Raft-Car with duct tape and hope. "It'll hold. Probably."`,
  ],
  wheelchair: [
    (n) => `${n} fired a short burst from the Rocket Wheelchair's thrusters. Just enough to keep up. Saving the BIG one.`,
    (n) => `The Rocket Wheelchair rattled over every bump. ${n}'s teeth chattered. But the speed was THERE.`,
    (n) => `"Don't blow up. Don't blow up. Don't blow up." ${n} nursed the volatile wheelchair around a curve.`,
    (n) => `Sparks trailed from the Rocket Wheelchair. ${n} was either going very fast or about to explode. Maybe both.`,
  ],
  helicopter: [
    (n) => `${n} banked the helicopter hard, scanning the ground below for the next checkpoint. Up here, the race was a bird's-eye view.`,
    (n) => `The helicopter's fuel gauge flickered. ${n}'s eyes widened. "That's... fine. That's fine. We're FINE."`,
    (n) => `${n} swooped low, blowing sand and debris at the ground-bound racers. "Sorry not sorry!"`,
    (n) => `"You know what they can't do down there? FLY." ${n} reclined smugly in the cockpit.`,
  ],
  gokart: [
    (n) => `${n}'s Go-Kart hugged the inside line perfectly. Small, nimble, and deceptively quick in the corners.`,
    (n) => `The Go-Kart's engine whined at max RPM. ${n} was wringing every ounce of speed from the tiny vehicle.`,
    (n) => `${n} drafted behind a larger vehicle, sling-shotting past when the opening came. "GO-KART POWER!"`,
    (n) => `The Go-Kart hit a bump and went briefly airborne. ${n} landed it perfectly. "That counts as flying!"`,
  ],
  zipline: [
    (n) => `${n}'s Zipline Rig caught a cable and SOARED. The downhill advantage was massive — pure gravity-powered speed.`,
    (n) => `The rig's wheels hit a rail section and ${n} rode it like a rollercoaster. Arms up and SCREAMING.`,
    (n) => `${n} launched from one cable to the next with gymnast precision. The Zipline Rig was a circus act — a FAST one.`,
    (n) => `No cable in sight. ${n}'s Zipline Rig rolled on the ground at half speed. "Come on, where's the next line..."`,
  ],
};

const TERRAIN_SETPIECE_TEXT = {
  canyon: [
    (n) => `The CANYON GAP loomed ahead! ${n} didn't slow down — ${pronouns(n).posAdj} vehicle launched across the void!`,
    (n) => `${n} hit the canyon jump at full speed. For one terrifying second, there was nothing but air beneath ${pronouns(n).obj}.`,
    (n) => `The canyon gap yawned open. ${n} gunned it. The landing was rough — but ${pronouns(n).sub} MADE it.`,
    (n) => `"JUMP!" ${n}'s vehicle sailed over the canyon. Time slowed. Gravity waited. Then the wheels hit dirt on the other side.`,
  ],
  downhill: [
    (n) => `The DOWNHILL RUSH hit and ${n} let gravity take the wheel. Pure speed, pure terror, pure adrenaline.`,
    (n) => `${n} rocketed down the slope, barely in control. The world blurred at the edges. "THIS IS INSANE!"`,
    (n) => `Downhill. Full speed. ${n} stopped thinking and just REACTED. Turn. Dodge. Breathe. Survive.`,
    (n) => `The descent was brutal. ${n} white-knuckled the controls as ${pronouns(n).posAdj} vehicle gained terrifying speed.`,
  ],
  switchback: [
    (n) => `The FOREST SWITCHBACKS slowed ${n} to a crawl. Tight turns, low branches, no visibility. Patience over speed.`,
    (n) => `Tree branches whipped at ${n}'s face as ${pronouns(n).sub} navigated the switchbacks. "I hate forests. I HATE FORESTS."`,
    (n) => `The switchback route favored precision over power. ${n}'s handling was tested to the absolute limit.`,
    (n) => `${n} clipped a tree. Then another. The narrow switchback was punishing anything bigger than a bicycle.`,
  ],
  finalPush: [
    (n) => `The COAST was in sight! ${n} saw the ocean glinting ahead and found reserves of energy ${pronouns(n).sub} didn't know existed.`,
    (n) => `"I CAN SEE THE WATER!" ${n} screamed, pushing for every last drop of speed. The end was RIGHT THERE.`,
    (n) => `The final stretch opened up — flat road, clear skies, and the COAST ahead. ${n} went absolutely ALL OUT.`,
    (n) => `${n}'s engine rattled, ${pronouns(n).posAdj} body ached, but the ocean was VISIBLE. One final push. Everything left.`,
  ],
};

const TRASH_TALK_TEXT = [
  (a, b) => `"You're gonna LOSE, ${b.split(' ')[0]}!" ${a} screamed across the gap. ${b} responded with a rude gesture.`,
  (a, b) => `${a} locked eyes with ${b} and drew a finger across ${pronouns(a).posAdj} throat. The message was clear.`,
  (a, b) => `"Enjoy the view of my BACK, ${b.split(' ')[0]}!" ${a} taunted, pulling ahead.`,
  (a, b) => `${a} blew a kiss at ${b}. "See you at the finish line! Oh wait — you won't MAKE it that far."`,
  (a, b) => `"Remember this moment, ${b.split(' ')[0]}!" ${a} grinned maniacally. "This is where I left you in the DUST!"`,
];

const RIVALRY_ESCALATION_TEXT = [
  (a, b) => `The tension between ${a} and ${b} was reaching a breaking point. Every time they got close, sparks flew.`,
  (a, b) => `${a} swerved toward ${b}. Not quite an attack — more of a threat. "Back OFF." ${b} didn't back off.`,
  (a, b) => `${a} and ${b} were racing each other more than they were racing the field. This was PERSONAL. Forget immunity.`,
  (a, b) => `Every overtake between ${a} and ${b} came with a shove, a snarl, a promise of payback. War on wheels.`,
];

// SEA-SPECIFIC TEXT BANKS
const SEA_CREATURE_TEXT = [
  (n) => `Something HUGE brushed against ${n}'s hull. ${pronouns(n).Sub} froze. A shadow passed underneath... and moved on. THIS time.`,
  (n) => `Dolphins leaped alongside ${n}'s vessel! Beautiful — and a sign of good current. ${pronouns(n).Sub} followed their path.`,
  (n) => `A jellyfish bloom forced ${n} to alter course. The detour cost precious seconds.`,
  (n) => `${n} spotted a whale breach in the distance. Majestic. Also terrifying when you're in a tiny boat.`,
];

const SEA_NAV_GOOD_TEXT = [
  (n) => `${n} read the currents perfectly — slotting into a fast-moving channel. Nautical instinct.`,
  (n) => `${n} caught a favorable wind shift and adjusted the sail. Speed increased noticeably. "YES!"`,
  (n) => `${n} followed the birds toward shore. An old sailor's trick. It was working.`,
  (n) => `${n} spotted a sandbar ahead and corrected course before anyone else noticed. Smooth sailing from there.`,
];
const SEA_NAV_BAD_TEXT = [
  (n) => `A navigation error cost ${n} dearly. Wrong heading for thirty seconds — then panic, then correction.`,
  (n) => `${n} drifted off course, fighting a cross-current that shouldn't have been there. Minutes wasted.`,
  (n) => `"This way — no, THAT way!" ${n} second-guessed ${pronouns(n).ref} and sailed in a circle. Embarrassing.`,
  (n) => `${n} misread the coastline and aimed for a rocky outcrop instead of the beach. Hard correction, harder time loss.`,
];

const BOAT_RAM_TEXT = [
  (a, b) => `${a} RAMMED ${b}'s boat broadside! Wood splintered! "THAT'S for segment one!" ${b} scrambled to stay afloat.`,
  (a, b) => `${a} swung an oar at ${b}'s vessel. CRACK! A chunk of hull flew off. "HOW DO YOU LIKE THAT?!"`,
  (a, b) => `${a} and ${b} collided at full speed! Both boats shuddered. Water rushed in everywhere. Neither backed down.`,
  (a, b) => `${a} pulled alongside and KICKED ${b}'s boat. The audacity! ${b} stared in disbelief. Then kicked BACK.`,
];

const SEA_RESCUE_TEXT = [
  (a, b) => `${b} was going under. ${a} reached out and hauled ${pronouns(b).obj} aboard. "You owe me." ${b} nodded, gasping.`,
  (a, b) => `${a} circled back for ${b}. "Grab the rope!" Against all competitive logic, ${a} saved a rival. The bond formed in salt water.`,
  (a, b) => `"HELP!" ${b} screamed. ${a} was the only one close enough. A split-second decision — save them or win. ${a} chose humanity.`,
];

const CURRENT_RIDE_TEXT = [
  (n) => `${n} found a rip current moving the RIGHT direction! "JACKPOT!" The ocean CARRIED ${pronouns(n).obj} toward shore.`,
  (n) => `A powerful current grabbed ${n}'s vessel and accelerated it. "I'M NOT EVEN ROWING!" Pure luck.`,
  (n) => `${n} spotted floating debris moving fast toward shore. ${pronouns(n).Sub} followed the same current. Genius move.`,
];

const BECALMED_TEXT = [
  (n) => `${n}'s sail went limp. No wind. No waves. Just... sitting there. "COME ON!" ${pronouns(n).Sub} grabbed the oars.`,
  (n) => `Dead calm. ${n} was becalmed in the worst possible spot. Others drifted past while ${pronouns(n).sub} paddled furiously.`,
  (n) => `The wind died. ${n}'s vessel lost all momentum. "No no no no NO!" Manual paddling. Pure agony.`,
];

// BEACH-SPECIFIC TEXT BANKS
const BEACH_TACKLE_TEXT = [
  (a, b) => `${a} TACKLED ${b} into the sand! They rolled, wrestling for position, then scrambled back to their feet!`,
  (a, b) => `${a} dove at ${b}'s legs! They both went down HARD in the sand. A desperate scramble to get up first!`,
  (a, b) => `"NOT TODAY!" ${a} grabbed ${b}'s ankle. ${b} went face-first into the sand. ${a} sprinted past.`,
  (a, b) => `${a} hip-checked ${b} into the surf. ${b} came up sputtering. "YOU'RE DEAD TO ME!"`,
];

const BEACH_COLLAPSE_TEXT = [
  (n) => `${n}'s legs gave out. Face in the sand. For a horrible moment, it was over. Then... one hand. One knee. UP. Keep going.`,
  (n) => `${n} collapsed. The race had taken EVERYTHING. ${pronouns(n).Sub} crawled. Then walked. Then ran again. Somehow.`,
  (n) => `"I can't..." ${n} dropped to all fours. Lungs burning. Vision swimming. Then ${pronouns(n).sub} saw the finish. UP. NOW.`,
  (n) => `${n} staggered, fell, got up, staggered again. Each step was a war. But ${pronouns(n).sub} was still MOVING.`,
];

const BEACH_SURGE_TEXT = [
  (n) => `OUT OF NOWHERE, ${n} found another gear! A final surge that shocked everyone! Where was this energy HIDING?!`,
  (n) => `${n} EXPLODED forward! "I REFUSE TO LOSE!" The burst of speed came from pure spite and willpower.`,
  (n) => `${n}'s eyes locked on the finish line and something primal kicked in. A surge of adrenaline. SPRINT.`,
  (n) => `${n} went from middle-of-the-pack to top-three in the final seconds. An UNBELIEVABLE burst of speed!`,
];

const BEACH_CROWD_TEXT = [
  (n) => `The spectators started SCREAMING for ${n}! "GO! GO! GO!" The energy was electric!`,
  (n) => `${n} heard ${pronouns(n).posAdj} name being chanted from the sidelines. It gave ${pronouns(n).obj} WINGS.`,
  (n) => `"COME ON ${n.split(' ')[0].toUpperCase()}!" The peanut gallery was losing their minds. ${n} found strength ${pronouns(n).sub} didn't know ${pronouns(n).sub} had.`,
  (n) => `A roar went up from the crowd — they wanted ${n} to pull this off. ${pronouns(n).Sub} could FEEL the momentum shift.`,
  (n) => `${n}'s name echoed across the course. The cheering was deafening. ${pronouns(n).Sub} gritted ${pronouns(n).posAdj} teeth and PUSHED.`,
  (n) => `"${n.split(' ')[0].toUpperCase()}! ${n.split(' ')[0].toUpperCase()}! ${n.split(' ')[0].toUpperCase()}!" The chant was rhythmic, primal. ${n} ran to its beat.`,
];

const BEACH_DIVE_TEXT = [
  (a, b) => `${a} and ${b} DOVE for the finish line! Bodies horizontal! Sand flying! Who touched it first?!`,
  (a, b) => `A double DIVE at the finish! ${a} and ${b} launched themselves like human missiles at the line!`,
  (a, b) => `${a} dove. ${b} dove. They landed in a heap ON the finish line. The cameras would decide this.`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION ENGINE
// ══════════════════════════════════════════════════════════════
export function simulatePlanesTrains(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  // ── Phase 1: Scavenge & Draft (3-beat scramble) ──
  const scavengeEvents = [];

  // Beat 1: The Scramble — arrival order
  const arrivalScores = {};
  const hangBackPlayers = new Set();
  active.forEach(n => {
    const s = pStats(n);
    // Strategic >= 7 can hang back (~30% chance) — last arrival but guaranteed pref
    if (s.strategic >= 7 && Math.random() < 0.3) {
      arrivalScores[n] = -999; // will be moved to end
      hangBackPlayers.add(n);
      scavengeEvents.push({ beat: 1, eventType: 'hangBack', player: n, text: pick(SCRAMBLE_TEXT.hangBack)(n) });
    } else {
      arrivalScores[n] = s.physical * 0.3 + s.boldness * 0.35 + s.intuition * 0.2 + noise(2.5);
    }
  });

  // Stumble events (~20% chance per player)
  active.forEach(n => {
    if (hangBackPlayers.has(n)) return;
    if (Math.random() < 0.2) {
      arrivalScores[n] -= 2; // drop position
      scavengeEvents.push({ beat: 1, eventType: 'stumble', player: n, text: pick(SCRAMBLE_TEXT.stumble)(n) });
    }
  });

  // Sort by arrival score (high = first), hangBack players at the end
  const arrivalOrder = [...active].sort((a, b) => {
    if (hangBackPlayers.has(a) && !hangBackPlayers.has(b)) return 1;
    if (!hangBackPlayers.has(a) && hangBackPlayers.has(b)) return -1;
    return arrivalScores[b] - arrivalScores[a];
  });

  // Sprint events for top 30%
  const sprintThreshold = Math.ceil(active.length * 0.3);
  arrivalOrder.forEach((n, idx) => {
    if (idx < sprintThreshold && !hangBackPlayers.has(n)) {
      scavengeEvents.push({ beat: 1, eventType: 'sprint', player: n, text: pick(SCRAMBLE_TEXT.sprint)(n) });
    }
  });

  // Beat 2: The Grabs (with conflicts)
  const assignments = {}; // name -> vehicle object
  const taken = new Set();
  const draftOrder = [...arrivalOrder]; // final draft order

  for (let dIdx = 0; dIdx < draftOrder.length; dIdx++) {
    const name = draftOrder[dIdx];
    const a = arch(name);
    const prefs = ARCHETYPE_PREF[a] || [];
    let assigned = null;
    let preferredVehicleId = null;

    // ~20% chance player goes off-archetype ("mood pick") — picks by stats + high noise
    const goesWild = prefs.length > 0 && Math.random() < 0.2;
    if (goesWild) {
      const s = pStats(name);
      let bestId = null, bestScore = -Infinity;
      for (const vid of VEHICLE_IDS.filter(v => !taken.has(v))) {
        const v = VEHICLES[vid];
        const score = s[v.stats[0]] * 0.4 + s[v.stats[1]] * 0.4 + noise(3);
        if (score > bestScore) { bestScore = score; bestId = vid; }
      }
      preferredVehicleId = bestId;
    } else {
      preferredVehicleId = _weightedPrefPick(prefs, taken);
    }

    // Hang-back players get guaranteed archetype preference
    if (hangBackPlayers.has(name) && preferredVehicleId) {
      assigned = preferredVehicleId;
    } else if (preferredVehicleId) {
      // Check if a later player also wants this vehicle (conflict potential)
      let conflictPlayer = null;
      for (let j = dIdx + 1; j < draftOrder.length && j <= dIdx + 3; j++) {
        const other = draftOrder[j];
        if (!other) continue;
        const otherPrefs = ARCHETYPE_PREF[arch(other)] || [];
        if (otherPrefs.some(([id]) => id === preferredVehicleId) && !hangBackPlayers.has(other)) {
          conflictPlayer = other;
          break;
        }
      }

      if (conflictPlayer && Math.random() < 0.5) {
        const vLabel = VEHICLES[preferredVehicleId].label;

        // Check for villain steal
        if (canSabotage(conflictPlayer) && Math.random() < 0.4) {
          // Villain steal attempt: strategic vs intuition
          const stealScore = pStats(conflictPlayer).strategic * 0.5 + noise(2);
          const defendScore = pStats(name).intuition * 0.5 + noise(2);
          if (stealScore > defendScore) {
            scavengeEvents.push({ beat: 2, eventType: 'steal', player: conflictPlayer, target: name, vehicle: vLabel, text: pick(CONFLICT_TEXT.steal)(conflictPlayer, name, vLabel) });
            addBond(name, conflictPlayer, -3);
            popDelta(conflictPlayer, -2);
            popDelta(name, 1);
            ep.campEvents[campKey].post.push({ text: `${conflictPlayer} stole ${name}'s vehicle right from under ${pronouns(name).obj} during the wreckage scramble!`, players: [conflictPlayer, name], badgeText: 'STOLEN', badgeClass: 'red', tag: 'planes-trains' });
            // Conflict player gets the vehicle, current player falls through to next best
            assigned = null; // will be assigned below via fallback
            // Assign the stolen vehicle to the conflictPlayer early
            taken.add(preferredVehicleId);
            assignments[conflictPlayer] = { ...VEHICLES[preferredVehicleId], currentHp: VEHICLES[preferredVehicleId].hp, animalUsed: false, boostUsed: false, heliSkipped: false };
            // Move conflictPlayer before current player's spot so they don't get assigned twice
            draftOrder.splice(draftOrder.indexOf(conflictPlayer), 1);
            draftOrder.splice(dIdx, 0, conflictPlayer);
            dIdx++; // skip the just-inserted player
          } else {
            // Steal failed, current player keeps it
            scavengeEvents.push({ beat: 2, eventType: 'fight', player: name, target: conflictPlayer, vehicle: vLabel, text: pick(CONFLICT_TEXT.fight)(name, conflictPlayer, vLabel) });
            scavengeEvents.push({ beat: 2, eventType: 'fightWin', player: name, target: conflictPlayer, vehicle: vLabel, text: pick(CONFLICT_TEXT.fightWin)(name, conflictPlayer, vLabel) });
            addBond(name, conflictPlayer, -2);
            assigned = preferredVehicleId;
          }
        }
        // Generous yield (hero/loyal-soldier/social-butterfly with bond >= 3)
        else if (['hero', 'loyal-soldier', 'social-butterfly'].includes(a) && getBond(name, conflictPlayer) >= 3 && Math.random() < 0.25) {
          scavengeEvents.push({ beat: 2, eventType: 'yield', player: name, target: conflictPlayer, vehicle: vLabel, text: pick(CONFLICT_TEXT.yield)(name, conflictPlayer, vLabel) });
          addBond(name, conflictPlayer, 2);
          popDelta(name, 1);
          // Yield: current player gives up the vehicle, conflictPlayer gets it
          taken.add(preferredVehicleId);
          assignments[conflictPlayer] = { ...VEHICLES[preferredVehicleId], currentHp: VEHICLES[preferredVehicleId].hp, animalUsed: false, boostUsed: false, heliSkipped: false };
          draftOrder.splice(draftOrder.indexOf(conflictPlayer), 1);
          draftOrder.splice(dIdx, 0, conflictPlayer);
          dIdx++;
          assigned = null; // current player falls through
        }
        // Vehicle fight: physical + boldness contest
        else {
          scavengeEvents.push({ beat: 2, eventType: 'fight', player: name, target: conflictPlayer, vehicle: vLabel, text: pick(CONFLICT_TEXT.fight)(name, conflictPlayer, vLabel) });
          const scoreA = pStats(name).physical * 0.5 + pStats(name).boldness * 0.4 + noise(2.5);
          const scoreB = pStats(conflictPlayer).physical * 0.5 + pStats(conflictPlayer).boldness * 0.4 + noise(2.5);
          if (scoreA >= scoreB) {
            scavengeEvents.push({ beat: 2, eventType: 'fightWin', player: name, target: conflictPlayer, vehicle: vLabel, text: pick(CONFLICT_TEXT.fightWin)(name, conflictPlayer, vLabel) });
            addBond(name, conflictPlayer, -2);
            ep.campEvents[campKey].post.push({ text: `${name} and ${conflictPlayer} fought over a vehicle in the wreckage scramble!`, players: [name, conflictPlayer], badgeText: 'FIGHT', badgeClass: 'red', tag: 'planes-trains' });
            assigned = preferredVehicleId;
          } else {
            scavengeEvents.push({ beat: 2, eventType: 'fightWin', player: conflictPlayer, target: name, vehicle: vLabel, text: pick(CONFLICT_TEXT.fightWin)(conflictPlayer, name, vLabel) });
            addBond(name, conflictPlayer, -2);
            ep.campEvents[campKey].post.push({ text: `${conflictPlayer} and ${name} fought over a vehicle in the wreckage scramble!`, players: [conflictPlayer, name], badgeText: 'FIGHT', badgeClass: 'red', tag: 'planes-trains' });
            // Loser drops to next available
            taken.add(preferredVehicleId);
            assignments[conflictPlayer] = { ...VEHICLES[preferredVehicleId], currentHp: VEHICLES[preferredVehicleId].hp, animalUsed: false, boostUsed: false, heliSkipped: false };
            draftOrder.splice(draftOrder.indexOf(conflictPlayer), 1);
            draftOrder.splice(dIdx, 0, conflictPlayer);
            dIdx++;
            assigned = null;
          }
        }
      } else {
        assigned = preferredVehicleId;
      }
    }

    // Skip if already assigned (e.g. conflict player inserted early)
    if (assignments[name]) continue;

    // Fallback: best stat match from remaining
    if (!assigned) {
      const s = pStats(name);
      let bestId = null, bestScore = -Infinity;
      const pool = VEHICLE_IDS.filter(v => !taken.has(v));
      const searchPool = pool.length > 0 ? pool : VEHICLE_IDS;
      for (const vid of searchPool) {
        const v = VEHICLES[vid];
        const score = s[v.stats[0]] * 0.5 + s[v.stats[1]] * 0.5 + noise(2.5);
        if (score > bestScore) { bestScore = score; bestId = vid; }
      }
      assigned = bestId || VEHICLE_IDS[0];
    }
    if (taken.size < VEHICLE_IDS.length) taken.add(assigned);
    assignments[name] = { ...VEHICLES[assigned], currentHp: VEHICLES[assigned].hp, animalUsed: false, boostUsed: false, heliSkipped: false };
  }

  // Generate draft pick events in draftOrder
  const finalDraftOrder = draftOrder.filter(n => assignments[n]); // only assigned players
  const draftPickEvents = [];
  finalDraftOrder.forEach((name, idx) => {
    const v = assignments[name];
    const tier = idx < Math.ceil(active.length * 0.3) ? 'excellent' : idx < Math.ceil(active.length * 0.7) ? 'good' : 'late';
    const text = pick(SCAVENGE_TEXT[tier])(name, v.label);
    draftPickEvents.push({ beat: 2, eventType: 'draftPick', player: name, vehicle: v.label, vehicleId: v.id, draftPos: idx + 1, tier, text });
    ep.chalMemberScores[name] += (active.length - idx);
  });

  // Beat 3: Slim Pickings — last 2-3 players
  const bottomCount = Math.min(3, Math.max(2, Math.floor(active.length * 0.25)));
  const bottomPlayers = finalDraftOrder.slice(-bottomCount);

  // Hidden gem event (~25% chance for a bottom player)
  let foundHiddenGem = false;
  for (const name of bottomPlayers) {
    if (Math.random() < 0.25) {
      const s = pStats(name);
      const intCheck = s.intuition * 0.4 + noise(2);
      if (intCheck > 3) {
        const currentVeh = assignments[name];
        const betterPool = VEHICLE_IDS.filter(vid => VEHICLES[vid].speed > currentVeh.speed && !taken.has(vid));
        if (betterPool.length > 0) {
          const newVid = pick(betterPool);
          const newV = VEHICLES[newVid];
          scavengeEvents.push({ beat: 3, eventType: 'hiddenGem', player: name, vehicle: newV.label, vehicleId: newVid, text: pick(CONFLICT_TEXT.hiddenGem)(name, newV.label) });
          taken.delete(currentVeh.id);
          taken.add(newVid);
          assignments[name] = { ...newV, currentHp: newV.hp, animalUsed: false, boostUsed: false, heliSkipped: false };
          const pickEv = draftPickEvents.find(e => e.player === name);
          if (pickEv) { pickEv.vehicle = newV.label; pickEv.vehicleId = newVid; pickEv.text = pick(SCAVENGE_TEXT[pickEv.tier])(name, newV.label); }
          foundHiddenGem = true;
        }
      }
      break;
    }
  }

  // Helicopter: rare hidden find (~12% chance, only if no other hidden gem, requires boldness+strategic)
  if (!foundHiddenGem && !taken.has('helicopter') && Math.random() < 0.12) {
    const heliCandidates = bottomPlayers.filter(n => {
      const s = pStats(n);
      return (s.strategic + s.boldness) * 0.5 + noise(2) > 5;
    });
    if (heliCandidates.length > 0) {
      const finder = pick(heliCandidates);
      const currentVeh = assignments[finder];
      const heliV = VEHICLES.helicopter;
      scavengeEvents.push({ beat: 3, eventType: 'hiddenGem', player: finder, vehicle: heliV.label, vehicleId: 'helicopter',
        text: pick(HELI_DISCOVERY_TEXT)(finder) });
      taken.delete(currentVeh.id);
      taken.add('helicopter');
      assignments[finder] = { ...heliV, currentHp: heliV.hp, animalUsed: false, boostUsed: false, heliSkipped: false };
      const pickEv = draftPickEvents.find(e => e.player === finder);
      if (pickEv) { pickEv.vehicle = heliV.label; pickEv.vehicleId = 'helicopter'; pickEv.text = pick(SCAVENGE_TEXT[pickEv.tier])(finder, heliV.label); }
      ep.campEvents[campKey].post.push({ text: `${finder} found a Stolen Helicopter buried in the wreckage — a massive discovery that could change the entire race.`, players: [finder], badgeText: 'HELICOPTER!', badgeClass: 'red', tag: 'planes-trains' });
    }
  }

  // Injury event (~30% chance for late pickers)
  for (const name of bottomPlayers) {
    if (Math.random() < 0.3) {
      scavengeEvents.push({ beat: 3, eventType: 'injury', player: name, text: pick(CONFLICT_TEXT.injury)(name) });
      break; // max one injury
    }
  }

  // Reluctant bond (~40% chance if 2+ bottom players)
  if (bottomPlayers.length >= 2 && Math.random() < 0.4) {
    const bondA = bottomPlayers[0], bondB = bottomPlayers[1];
    scavengeEvents.push({ beat: 3, eventType: 'reluctantBond', player: bondA, target: bondB, text: pick(CONFLICT_TEXT.reluctantBond)(bondA, bondB) });
    addBond(bondA, bondB, 1);
    ep.campEvents[campKey].post.push({ text: `${bondA} and ${bondB} bonded over their terrible vehicle picks in the wreckage scramble.`, players: [bondA, bondB], badgeText: 'JUNK BOND', badgeClass: 'blue', tag: 'planes-trains' });
  }

  // Merge all events into scavengeEvents in final order: beat 1 scramble, then draft picks interleaved with beat 2 conflict events, then beat 3 slim pickings
  // Beat 1 events are already in scavengeEvents from above
  // Separate beat 2 conflict events (already in scavengeEvents with beat:2)
  const beat1Events = scavengeEvents.filter(e => e.beat === 1);
  const beat2Conflicts = scavengeEvents.filter(e => e.beat === 2);
  const beat3Events = scavengeEvents.filter(e => e.beat === 3);

  // Rebuild scavengeEvents in final order: beat1 -> draft picks (with conflicts interleaved) -> beat3
  scavengeEvents.length = 0;
  scavengeEvents.push(...beat1Events);

  // Interleave draft picks with their conflict events
  let conflictIdx = 0;
  for (const pickEv of draftPickEvents) {
    // Insert any conflict events for this player before their pick
    while (conflictIdx < beat2Conflicts.length && (beat2Conflicts[conflictIdx].player === pickEv.player || beat2Conflicts[conflictIdx].target === pickEv.player)) {
      scavengeEvents.push(beat2Conflicts[conflictIdx]);
      conflictIdx++;
    }
    scavengeEvents.push(pickEv);
  }
  // Push any remaining conflicts
  while (conflictIdx < beat2Conflicts.length) {
    scavengeEvents.push(beat2Conflicts[conflictIdx]);
    conflictIdx++;
  }

  scavengeEvents.push(...beat3Events);

  // ── Phase 2: Land Race (4 segments) ──
  const LAND_SEGMENTS = 4;
  const landTimes = {};
  active.forEach(n => { landTimes[n] = 0; });
  const landEvents = [];
  const hpTracker = {};
  active.forEach(n => { hpTracker[n] = assignments[n].currentHp; });
  const prevPositions = {}; // track position changes
  const momentum = {}; // track consecutive gains/losses
  active.forEach(n => { prevPositions[n] = 0; momentum[n] = 0; });

  // Helicopter skip — flies over land but still takes real time (fuel, takeoff, navigation)
  const heliPlayer = active.find(n => assignments[n].special === 'skip-land');
  if (heliPlayer) {
    assignments[heliPlayer].heliSkipped = true;
    // heliPlayer land time set AFTER ground racers finish (needs average for calibration)
    landEvents.push({ segment: 0, type: 'helicopter-skip', player: heliPlayer, text: pick(HELICOPTER_SKIP_TEXT)(heliPlayer) });
  }

  const landRacers = active.filter(n => !assignments[n].heliSkipped);
  const terrainTypes = ['canyon', 'downhill', 'switchback', 'finalPush'];
  const vehFlavorUsed = new Set();
  const landTimeSnapshots = []; // per-segment cumulative times for live map

  for (let seg = 0; seg < LAND_SEGMENTS; seg++) {
    const segEvents = [];
    const isDownhill = seg === 1 || seg === 3;
    const isRough = seg === 0 || seg === 2;
    const terrainType = terrainTypes[seg];

    // Terrain set-piece announcement (always emits)
    if (seg > 0) {
      const setpieceName = landRacers[Math.floor(Math.random() * landRacers.length)];
      segEvents.push({ segment: seg, type: 'setpiece', player: setpieceName,
        text: pickUnique(TERRAIN_SETPIECE_TEXT[terrainType])(setpieceName) });
    }

    // Save pre-segment positions
    const preSorted = [...landRacers].sort((a, b) => (landTimes[a] || 0) - (landTimes[b] || 0));
    const prePos = {};
    preSorted.forEach((n, i) => { prePos[n] = i; });

    for (const name of landRacers) {
      const v = assignments[name];
      const s = pStats(name);
      const onFoot = v.currentHp <= 0;

      // Base segment time
      let time;
      if (onFoot) {
        time = 12 - s.physical * 0.12 - s.endurance * 0.1 + noise(2);
        // On-foot narrative card — always emit one per segment
        if (seg >= 1 && prePos[name] >= landRacers.length - 1 && Math.random() < 0.4) {
          segEvents.push({ segment: seg, type: 'on-foot', player: name,
            text: pickUnique(ONFOOT_DETERMINATION_TEXT)(name) });
          popDelta(name, 1);
        } else {
          segEvents.push({ segment: seg, type: 'on-foot', player: name,
            text: pickUnique(ONFOOT_SEGMENT_TEXT)(name) });
        }
      } else if (v.special === 'rear-immune') {
        time = 8 - v.speed * 0.15 - s.endurance * 0.08 + noise(1.5);
      } else {
        time = 10 - v.speed * 0.3 - (s.physical * 0.15 + s.endurance * 0.1) + noise(2.5);
      }

      // Zipline downhill bonus
      if (v.special === 'downhill' && isDownhill && !onFoot) {
        time -= 3;
        segEvents.push({ segment: seg, type: 'zipline-boost', player: name,
          text: pick(VEHICLE_FLAVOR_TEXT.zipline)(name) });
      }

      // Vehicle-specific flavor events (max 1 per player across entire land race)
      if (!onFoot && Math.random() < 0.4 && !vehFlavorUsed.has(name)) {
        const vehTexts = VEHICLE_FLAVOR_TEXT[v.id];
        if (vehTexts) {
          vehFlavorUsed.add(name);
          segEvents.push({ segment: seg, type: 'vehicle-flavor', player: name,
            text: pickUnique(vehTexts)(name) });
        }
      }

      // Terrain hazard (higher chance now)
      if (isRough && !onFoot && Math.random() < 0.45) {
        if (v.special === 'terrain-immune' || v.special === 'terrain-adaptive') {
          segEvents.push({ segment: seg, type: 'terrain-immune', player: name,
            text: pick(TERRAIN_IMMUNE_TEXT)(name, v.label) });
        } else {
          // Light/agile vehicles can dodge terrain hazards
          const dodgeChance = v.special === 'dodge' ? 0.55 : v.size === 'light' ? 0.35 : 0;
          if (dodgeChance > 0 && Math.random() < dodgeChance) {
            segEvents.push({ segment: seg, type: 'terrain-dodge', player: name,
              text: pick(TERRAIN_DODGE_TEXT)(name, v.label) });
          } else {
            v.currentHp--;
            hpTracker[name] = v.currentHp;
            time += 1.5;
            segEvents.push({ segment: seg, type: 'terrain', player: name, damage: 1,
              hpSnapshot: { [name]: v.currentHp },
              text: pick(TERRAIN_TEXT)(name, v.label) });
            if (v.currentHp <= 0) {
              segEvents.push({ segment: seg, type: 'destroy', player: name,
                text: pick(VEHICLE_DESTROY_TEXT)(name, v.label) });
              popDelta(name, -1);
            }
          }
        }
      }

      // Drafting bonus (Go-Kart)
      if (v.special === 'drafting' && !onFoot) {
        const nearby = landRacers.filter(n2 => n2 !== name && Math.abs((landTimes[n2] || 0) - (landTimes[name] || 0)) < 3);
        if (nearby.length > 0) {
          time -= 1.2;
          if (Math.random() < 0.4 && !vehFlavorUsed.has(name)) {
            vehFlavorUsed.add(name);
            segEvents.push({ segment: seg, type: 'vehicle-flavor', player: name,
              text: pickUnique(VEHICLE_FLAVOR_TEXT.gokart)(name) });
          }
        }
      }

      // Desperation play (last place, segment 2+)
      if (seg >= 2 && prePos[name] >= landRacers.length - 2 && !onFoot && Math.random() < 0.6) {
        if (Math.random() < 0.45) {
          time -= 3.5;
          segEvents.push({ segment: seg, type: 'desperation-success', player: name,
            text: pickUnique(DESPERATION_TEXT)(name) });
          popDelta(name, 1);
        } else {
          time += 2;
          const despFailTexts = [
            `${name} tried something reckless — and it backfired SPECTACULARLY. Even further behind now.`,
            `${name}'s gambit went wrong. Horribly wrong. The shortcut led to a dead end and ${pronouns(name).sub} lost even MORE time.`,
            `${name} went for broke... and BROKE. The vehicle protested violently. Ground lost, hope fading.`,
            `"I can still—" ${name} started. The universe disagreed. The risky move cost ${pronouns(name).obj} dearly.`,
          ];
          segEvents.push({ segment: seg, type: 'desperation-fail', player: name,
            text: pickUnique(despFailTexts) });
        }
      }

      landTimes[name] = (landTimes[name] || 0) + Math.max(1, time);
    }

    // Post-movement: detect position changes
    const postSorted = [...landRacers].sort((a, b) => landTimes[a] - landTimes[b]);
    const postPos = {};
    postSorted.forEach((n, i) => { postPos[n] = i; });

    // Lead change event
    if (seg > 0 && postSorted[0] !== preSorted[0]) {
      segEvents.push({ segment: seg, type: 'lead-change', player: postSorted[0],
        text: pick(LEAD_CHANGE_TEXT)(postSorted[0]) });
      popDelta(postSorted[0], 1);
    }

    // Overtake events (emit for significant position jumps)
    for (const name of landRacers) {
      const jumped = prePos[name] - postPos[name];
      const isOnFoot = assignments[name].currentHp <= 0;
      if (jumped >= 2 && postPos[name] > 0) {
        const passed = preSorted[postPos[name]];
        const texts = isOnFoot ? OVERTAKE_ONFOOT_TEXT : OVERTAKE_TEXT;
        segEvents.push({ segment: seg, type: 'overtake', player: name, target: passed,
          text: pickUnique(texts)(name, passed) });
        momentum[name] = (momentum[name] || 0) + 1;
      } else if (jumped <= -2) {
        const texts = isOnFoot ? FALLING_BEHIND_ONFOOT_TEXT : FALLING_BEHIND_TEXT;
        segEvents.push({ segment: seg, type: 'falling-behind', player: name,
          text: pickUnique(texts)(name) });
        momentum[name] = (momentum[name] || 0) - 1;
      }
    }

    // Momentum narration (sustained gains)
    for (const name of landRacers) {
      if (momentum[name] >= 2 && Math.random() < 0.7) {
        segEvents.push({ segment: seg, type: 'momentum', player: name,
          text: pickUnique(MOMENTUM_TEXT)(name) });
      }
    }

    // Pack cluster detection (2+ VEHICLED racers within 2s of each other)
    const vehicledSorted = postSorted.filter(n => assignments[n].currentHp > 0);
    const clusters = [];
    if (vehicledSorted.length >= 2) {
      let clust = [vehicledSorted[0]];
      for (let i = 1; i < vehicledSorted.length; i++) {
        if (landTimes[vehicledSorted[i]] - landTimes[vehicledSorted[i - 1]] < 2.5) {
          clust.push(vehicledSorted[i]);
        } else {
          if (clust.length >= 2) clusters.push([...clust]);
          clust = [vehicledSorted[i]];
        }
      }
      if (clust.length >= 2) clusters.push(clust);
    }

    // Emit pack event (once per segment if exists)
    if (clusters.length > 0 && Math.random() < 0.6) {
      const pack = clusters[Math.floor(Math.random() * clusters.length)];
      if (pack.length >= 3) {
        segEvents.push({ segment: seg, type: 'pack-cluster', player: pack[0], target: pack[1],
          text: pick(PACK_CLUSTER_TEXT.slice(0, 2))(pack[0], pack[1], pack[2]) });
      } else {
        segEvents.push({ segment: seg, type: 'pack-cluster', player: pack[0], target: pack[1],
          text: pick(PACK_CLUSTER_TEXT.slice(2))(pack[0], pack[1]) });
      }
    }

    // Proximity-based confrontations (NO CAP — all eligible pairs can generate)
    const bands = [];
    let currentBand = [postSorted[0]];
    for (let i = 1; i < postSorted.length; i++) {
      if (landTimes[postSorted[i]] - landTimes[postSorted[i - 1]] < 3.5) {
        currentBand.push(postSorted[i]);
      } else {
        bands.push([...currentBand]);
        currentBand = [postSorted[i]];
      }
    }
    bands.push(currentBand);

    for (const band of bands) {
      if (band.length < 2) continue;
      const shuffled = [...band].sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffled.length - 1; i += 2) {
        const attacker = shuffled[i];
        const target = shuffled[i + 1];
        if (!attacker || !target) continue;

        const aArch = arch(attacker);
        const aVeh = assignments[attacker];
        const tVeh = assignments[target];

        // Trash talk (enemies or rivals)
        if (getBond(attacker, target) <= -3 && Math.random() < 0.55) {
          segEvents.push({ segment: seg, type: 'trash-talk', player: attacker, target,
            text: pick(TRASH_TALK_TEXT)(attacker, target) });
          addBond(attacker, target, -1);
          continue;
        }

        // Rivalry escalation (history of conflict this race)
        const priorConflicts = landEvents.filter(e => (e.player === attacker && e.target === target) || (e.player === target && e.target === attacker));
        if (priorConflicts.length >= 2 && Math.random() < 0.5) {
          segEvents.push({ segment: seg, type: 'rivalry', player: attacker, target,
            text: pick(RIVALRY_ESCALATION_TEXT)(attacker, target) });
          addBond(attacker, target, -1);
          continue;
        }

        // Sabotage attempt — size matters: heavy crushes light, light bounces off heavy
        if (canSabotage(attacker) && tVeh.currentHp > 0 && Math.random() < 0.6) {
          const s = pStats(attacker);
          const tS = pStats(target);
          const sizeOrder = { light: 0, medium: 1, heavy: 2 };
          const aSz = sizeOrder[aVeh.size] || 1;
          const tSz = sizeOrder[tVeh.size] || 1;
          const sizeDiff = aSz - tSz; // positive = attacker bigger
          const hitChance = s.strategic * 0.08 + s.boldness * 0.05 + sizeDiff * 0.15 + noise(0.3);
          const dodgeChance = tVeh.special === 'dodge' ? 0.4 + (tSz === 0 ? 0.15 : 0) : 0;

          if (Math.random() < dodgeChance) {
            segEvents.push({ segment: seg, type: 'sabotage-dodged', player: attacker, target,
              text: pick(SABOTAGE_TEXT.dodged)(attacker, target) });
            addBond(target, attacker, -1);
            popDelta(attacker, -1);
          } else if (hitChance > tS.intuition * 0.06) {
            if (aVeh.special === 'animal-weapon' && !aVeh.animalUsed) {
              aVeh.animalUsed = true;
              tVeh.currentHp -= 2;
              hpTracker[target] = tVeh.currentHp;
              landTimes[target] += 3;
              segEvents.push({ segment: seg, type: 'animals', player: attacker, target, damage: 2,
                attackerHp: aVeh.currentHp, attackerMaxHp: VEHICLES[aVeh.id].hp,
                targetHp: tVeh.currentHp, targetMaxHp: VEHICLES[tVeh.id].hp,
                hpSnapshot: { [attacker]: aVeh.currentHp, [target]: tVeh.currentHp },
                text: pick(SABOTAGE_TEXT.animals)(attacker, target) });
              addBond(target, attacker, -3);
              popDelta(attacker, -2);
              popDelta(target, 1);
              ep.campEvents[campKey].post.push({
                text: `${attacker} unleashed a stampede on ${target} during the race!`,
                players: [attacker, target], badgeText: 'STAMPEDE', badgeClass: 'red', tag: 'planes-trains'
              });
            } else {
              const dmg = sizeDiff >= 1 ? 2 : 1; // heavy vs light = 2 damage
              const timePenalty = 1.5 + (sizeDiff >= 1 ? 1.5 : 0); // heavy hits harder
              tVeh.currentHp -= dmg;
              hpTracker[target] = tVeh.currentHp;
              landTimes[target] += timePenalty;
              segEvents.push({ segment: seg, type: 'sabotage', player: attacker, target, damage: dmg,
                attackerHp: aVeh.currentHp, attackerMaxHp: VEHICLES[aVeh.id].hp,
                targetHp: tVeh.currentHp, targetMaxHp: VEHICLES[tVeh.id].hp,
                hpSnapshot: { [target]: tVeh.currentHp },
                text: pick(SABOTAGE_TEXT.success)(attacker, target) });
              addBond(target, attacker, -2);
              popDelta(attacker, -1);
            }
            if (tVeh.currentHp <= 0) {
              segEvents.push({ segment: seg, type: 'destroy', player: target,
                text: pick(VEHICLE_DESTROY_TEXT)(target, tVeh.label) });
            }
          } else {
            // Backfire — worse for light attackers hitting heavy targets
            const backfireDmg = sizeDiff <= -1 ? 2 : 1;
            const backfireTime = 1 + (sizeDiff <= -1 ? 1 : 0);
            aVeh.currentHp -= backfireDmg;
            hpTracker[attacker] = aVeh.currentHp;
            landTimes[attacker] += backfireTime;
            segEvents.push({ segment: seg, type: 'sabotage-fail', player: attacker, target, damage: backfireDmg,
              attackerHp: aVeh.currentHp, attackerMaxHp: VEHICLES[aVeh.id].hp,
              targetHp: tVeh.currentHp, targetMaxHp: VEHICLES[tVeh.id].hp,
              hpSnapshot: { [attacker]: aVeh.currentHp },
              text: pick(SABOTAGE_TEXT.fail)(attacker, target) });
            addBond(target, attacker, -1);
            if (aVeh.currentHp <= 0) {
              segEvents.push({ segment: seg, type: 'destroy', player: attacker,
                text: pick(VEHICLE_DESTROY_TEXT)(attacker, aVeh.label) });
            }
          }
        }
        // Draft alliance (social types)
        else if (['social-butterfly', 'showmancer', 'floater'].includes(aArch) && getBond(attacker, target) >= 0 && Math.random() < 0.6) {
          landTimes[attacker] -= 1;
          landTimes[target] -= 1;
          segEvents.push({ segment: seg, type: 'alliance', player: attacker, target,
            text: pick(DRAFT_ALLIANCE_TEXT)(attacker, target) });
          addBond(attacker, target, 1);
        }
        // Underdog gambit
        else if (aArch === 'underdog' && landTimes[attacker] > landTimes[target] && Math.random() < 0.55) {
          if (Math.random() < 0.5) {
            landTimes[attacker] -= 4;
            segEvents.push({ segment: seg, type: 'gambit-success', player: attacker,
              text: pick(UNDERDOG_GAMBIT_TEXT.success)(attacker) });
            popDelta(attacker, 2);
          } else {
            landTimes[attacker] += 3;
            segEvents.push({ segment: seg, type: 'gambit-fail', player: attacker,
              text: pick(UNDERDOG_GAMBIT_TEXT.fail)(attacker) });
          }
        }
      }
    }

    // Showmance moment (once per land race, seg 1 or 2)
    if ((seg === 1 || seg === 2) && gs.showmances?.length) {
      for (const sm of gs.showmances.filter(s => !s.broken)) {
        if (landRacers.includes(sm.a) && landRacers.includes(sm.b)) {
          segEvents.push({ segment: seg, type: 'showmance', player: sm.a, target: sm.b,
            text: pick(SHOWMANCE_RACE_TEXT)(sm.a, sm.b) });
          _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'race', active);
          break;
        }
      }
    }

    // Helicopter commentary (heli player watches from above, comments on the action)
    if (heliPlayer && seg > 0) {
      const heliLeader = [...landRacers].sort((a, b) => landTimes[a] - landTimes[b])[0];
      const heliLast = [...landRacers].sort((a, b) => landTimes[a] - landTimes[b]).slice(-1)[0];
      const heliTexts = [
        () => `${heliPlayer} radioed from above: "Oh WOW, ${heliLeader} is pulling AHEAD down there! Good luck catching that from up here."`,
        () => `From the helicopter, ${heliPlayer} spotted trouble. "${heliLast} is falling behind — BAD. I almost feel guilty watching." Almost.`,
        () => `${heliPlayer} banked the helicopter low, buzzing the ground racers. "ENJOYING THE DIRT?!" ${pronouns(heliPlayer).Sub} cackled and pulled back up.`,
        () => `${heliPlayer} monitored the race from the cockpit, already planning ${pronouns(heliPlayer).posAdj} sea strategy. "Let them burn energy. I'll be fresh."`,
        () => `"This is beautiful," ${heliPlayer} murmured, watching the carnage below. "${pronouns(heliPlayer).Sub} made the right choice." The helicopter hummed agreement.`,
        () => `${heliPlayer} swooped low over the pack. "How's the DUST taste?!" A chorus of furious screaming followed ${pronouns(heliPlayer).obj} back into the sky.`,
        () => `${heliPlayer} saw ${heliLeader} and ${heliLast} from above — a gap widening between them. "This race is OVER for someone."`,
        () => `The helicopter's shadow passed over the ground racers like a taunt. ${heliPlayer} waved. Nobody waved back.`,
      ];
      segEvents.push({ segment: seg, type: 'heli-commentary', player: heliPlayer, target: Math.random() < 0.5 ? heliLeader : heliLast,
        text: pickUnique(heliTexts)() });
    }

    // Score segment positions
    const segRanked = [...landRacers].sort((a, b) => landTimes[a] - landTimes[b]);
    segRanked.forEach((name, idx) => {
      ep.chalMemberScores[name] += (landRacers.length - idx);
      prevPositions[name] = idx;
    });

    landTimeSnapshots.push({ ...landTimes });
    // Stamp time snapshot on last event of each segment for progressive sidebar
    if (segEvents.length > 0) {
      segEvents[segEvents.length - 1].timeSnapshot = { ...landTimes };
    }
    // Tag on-foot status for narrative context
    const wreckedSet = new Set(landRacers.filter(n => assignments[n].currentHp <= 0));
    if (wreckedSet.size > 0) {
      for (const ev of segEvents) { ev.wrecked = [...wreckedSet]; }
    }
    landEvents.push(...segEvents);
  }

  // Calibrate helicopter land time: fast but not free (~65% of average ground racer)
  if (heliPlayer) {
    const groundAvg = landRacers.reduce((sum, n) => sum + landTimes[n], 0) / landRacers.length;
    landTimes[heliPlayer] = groundAvg * (0.60 + Math.random() * 0.10) + noise(1.5);
    landTimeSnapshots.forEach(snap => { snap[heliPlayer] = landTimes[heliPlayer]; });
  }

  // ── FINISH LINE: Racers arrive at the coast ──
  const landRanked = [...landRacers].sort((a, b) => landTimes[a] - landTimes[b]);
  const FINISH_FIRST = [
    (n, t) => `${n} ROARED across the shoreline — FIRST TO THE COAST! Time: ${t}s. The sand sprayed as ${pronouns(n).posAdj} vehicle skidded to a halt at the water's edge.`,
    (n, t) => `"I CAN SEE THE WATER!" ${n} screamed, punching the throttle one final time. ${pronouns(n).Sub} hit the beach at ${t}s — nobody else was even CLOSE.`,
    (n, t) => `The coastline appeared and ${n} didn't slow down until the waves touched ${pronouns(n).posAdj} wheels. ${t}s. FIRST. The land race belonged to ${pronouns(n).obj}.`,
    (n, t) => `${n} exploded onto the beach at ${t}s, engine screaming, sand flying. FIRST ARRIVAL. ${pronouns(n).Sub} killed the engine and stood on the seat, arms raised.`,
  ];
  const FINISH_CLOSE = [
    (n, t, gap) => `${n} skidded onto the shore just ${gap}s behind! ${t}s total. The gap was razor-thin — ${pronouns(n).sub} could TASTE the leader's exhaust.`,
    (n, t, gap) => `Only ${gap}s back! ${n} hit the beach at ${t}s, practically kissing the bumper of the racer ahead. So close. SO close.`,
    (n, t, gap) => `${n} thundered onto the coast at ${t}s — ${gap}s off the lead. ${pronouns(n).Sub} slammed the brakes and glared at the finish. "Next time."`,
    (n, t, gap) => `The sand barely settled before ${n} arrived — ${t}s, a ${gap}s deficit. ${pronouns(n).Sub} parked hard and kicked ${pronouns(n).posAdj} door open. Frustrated but still racing.`,
  ];
  const FINISH_MID = [
    (n, t, pos) => `${n} rolled onto the beach at ${t}s. ${pos} place. Not first, not last — but the gap to the front was growing.`,
    (n, t, pos) => `${n} reached the shore at ${t}s. Solid ${pos} place. ${pronouns(n).Sub} surveyed the coastline, already eyeing the boats.`,
    (n, t, pos) => `${t}s for ${n} — settling into ${pos} position. ${pronouns(n).Sub} hopped out and started prepping for the sea transition.`,
    (n, t, pos) => `${n} coasted onto the sand at ${t}s. Middle of the pack at ${pos} place. The real race was just beginning.`,
  ];
  const FINISH_LATE = [
    (n, t) => `${n} limped onto the beach at ${t}s. The leaders were already prepping for the water. ${pronouns(n).Sub} had work to do.`,
    (n, t) => `Finally — ${n} reached the coast at ${t}s. The gap to the front was brutal. The sea wouldn't be any kinder.`,
    (n, t) => `${n} dragged ${pronouns(n).posAdj} battered vehicle onto the sand at ${t}s. ${pronouns(n).Sub} looked at the ocean ahead and swallowed hard.`,
    (n, t) => `${t}s. ${n} staggered to the waterline, exhausted, bruised, and behind. But still in the race. Barely.`,
    (n, t) => `${n} pulled onto the shore at ${t}s, engine wheezing. Everyone else was already here. The sea was going to be a long ride.`,
    (n, t) => `The beach was almost empty by the time ${n} arrived at ${t}s. ${pronouns(n).Sub} parked what was left of ${pronouns(n).posAdj} ride and started running toward the boats.`,
  ];
  const FINISH_ONFOOT = [
    (n, t) => `${n} arrived on FOOT at ${t}s — no vehicle, no dignity, just pure willpower dragging ${pronouns(n).obj} to the shore.`,
    (n, t) => `Without a vehicle, ${n} ran. And ran. And ran. ${t}s later, ${pronouns(n).sub} collapsed at the waterline, gasping.`,
    (n, t) => `${n} stumbled onto the beach at ${t}s, covered in dust, vehicle destroyed miles back. The ocean had never looked so far away.`,
    (n, t) => `Barefoot and broken, ${n} reached the coast at ${t}s. ${pronouns(n).Sub} looked back at the trail of destruction ${pronouns(n).sub}'d survived. "I'm still here."`,
  ];
  const FINISH_HELI = [
    (n) => `${n}'s helicopter was already parked on the beach, rotors winding down. ${pronouns(n).Sub} watched the others arrive one by one, sunglasses on, legs crossed. "What took you?"`,
    (n) => `The helicopter sat at the coastline like a taunt. ${n} waved at each arriving racer from the cockpit. "Welcome to MY beach."`,
    (n) => `${n} had been at the coast for a while now. Long enough to set up a beach chair. ${pronouns(n).Sub} raised a water bottle in salute as the others straggled in.`,
    (n) => `The helicopter's engine was cold by the time the first ground racer arrived. ${n} stretched. "Land race? Never heard of it."`,
  ];

  // Helicopter arrives first (was already there)
  if (heliPlayer) {
    landEvents.push({ segment: LAND_SEGMENTS, type: 'finish', player: heliPlayer,
      text: pick(FINISH_HELI)(heliPlayer), finishPos: 0 });
  }

  // Each racer arrives in order
  landRanked.forEach((name, idx) => {
    const t = landTimes[name]?.toFixed(1);
    const onFoot = assignments[name].currentHp <= 0;
    const gap = idx > 0 ? (landTimes[name] - landTimes[landRanked[0]]).toFixed(1) : '0';
    const pos = ordinal(idx + 1 + (heliPlayer ? 1 : 0));
    let text;
    if (onFoot) text = pick(FINISH_ONFOOT)(name, t);
    else if (idx === 0) text = pick(FINISH_FIRST)(name, t);
    else if (parseFloat(gap) < 3) text = pick(FINISH_CLOSE)(name, t, gap);
    else if (idx >= landRanked.length - 2) text = pick(FINISH_LATE)(name, t);
    else text = pick(FINISH_MID)(name, t, pos);
    landEvents.push({ segment: LAND_SEGMENTS, type: 'finish', player: name,
      text, finishPos: idx + 1 + (heliPlayer ? 1 : 0) });
  });

  // Host wrap-up
  const leader = landRanked[0];
  const last = landRanked[landRanked.length - 1];
  const FINISH_HOST = [
    () => `${host()} grabbed the bullhorn. "THE COAST IS REACHED! ${leader} leads the pack onto the water — but ${last} better hope the sea is kinder than the road!"`,
    () => `"LAND RACE — COMPLETE!" ${host()} bellowed. "What a leg! ${leader} dominated, ${last} survived, and the ocean awaits ALL of you!"`,
    () => `${host()} slow-clapped from the monitoring station. "Beautiful carnage. Just beautiful. Now — who can swim?"`,
    () => `"That's a WRAP on the land!" ${host()} announced. "Your vehicles are toast. Your bodies are bruised. And the sea crossing starts... NOW."`,
  ];
  landEvents.push({ segment: LAND_SEGMENTS, type: 'host-transition', player: leader,
    text: pick(FINISH_HOST)() });

  if (heliPlayer) landRanked.push(heliPlayer); // heli at end for standings
  landEvents.push({ segment: LAND_SEGMENTS, type: 'standings', phase: 'land',
    standings: landRanked.map((n, i) => {
      const draftPos = finalDraftOrder.indexOf(n);
      return {
        name: n, pos: i + 1, time: landTimes[n]?.toFixed(1),
        hp: assignments[n].currentHp, maxHp: VEHICLES[assignments[n].id]?.hp || 3,
        vehicle: assignments[n].label, vehicleId: assignments[n].id,
        skipped: !!assignments[n].heliSkipped,
        delta: draftPos >= 0 ? draftPos - i : 0,
      };
    }),
    text: '' });

  // ── Phase 3: Sea Crossing (3 segments) ──
  const seaTimes = {};
  active.forEach(n => { seaTimes[n] = 0; });
  const seaEvents = [];

  // Build sea vessels from land vehicle remains
  const seaVessels = {};
  const boatSpeed = {};
  for (const name of active) {
    const v = assignments[name];
    const vessel = _buildSeaVessel(assignments, name);
    seaVessels[name] = vessel;
    boatSpeed[name] = vessel.seaSpeed;

    // Store sea form on assignment for sidebar display
    v.seaForm = vessel;

    // Transition narration based on quality
    if (v.special === 'terrain-immune') {
      seaEvents.push({ segment: 0, type: 'balloon-sea', player: name,
        text: pick(SEA_TRANSITION_TEXT.balloon)(name) });
    } else if (v.special === 'sea-transition') {
      seaEvents.push({ segment: 0, type: 'seamless', player: name,
        text: pick(SEA_TRANSITION_TEXT.seamless)(name) });
    } else if (v.heliSkipped) {
      seaTimes[name] += vessel.convertTime;
      const heliSkillNote = vessel.buildSkill > 6
        ? ` But ${pronouns(name).sub} worked fast — stripping rotors, repurposing the fuselage.`
        : ` And ${pronouns(name).sub} wasn't exactly handy with tools, either.`;
      seaEvents.push({ segment: 0, type: 'heli-penalty', player: name,
        text: `${name} landed the helicopter at the coast, but now what? No boat parts, no raft materials — just helicopter scrap. While everyone else converted their vehicles, ${pronouns(name).sub} was building from scratch.${heliSkillNote} The resulting ${vessel.seaLabel} was ${vessel.buildSkill > 7 ? 'surprisingly decent' : 'barely seaworthy'}.` });
    } else {
      seaTimes[name] += vessel.convertTime;
      const textPool = SEA_TRANSITION_TEXT[vessel.quality] || SEA_TRANSITION_TEXT.battered;
      let transText = pick(textPool)(name, v.label, vessel.seaLabel);
      if (vessel.buildSkill >= 8) {
        transText += ' ' + pick(BUILD_SKILL_TEXT.genius)(name);
      } else if (vessel.buildSkill >= 6.5) {
        transText += ' ' + pick(BUILD_SKILL_TEXT.handy)(name);
      } else if (vessel.buildSkill < 3) {
        transText += ' ' + pick(BUILD_SKILL_TEXT.hopeless)(name);
      } else if (vessel.buildSkill < 4.5) {
        transText += ' ' + pick(BUILD_SKILL_TEXT.clumsy)(name);
      }
      seaEvents.push({ segment: 0, type: 'transition', player: name,
        seaVessel: vessel,
        text: transText });
    }
  }

  // Store vessels on challengeData for VP access
  ep.seaVessels = seaVessels;

  const SEA_SEGMENTS = 3;
  const seaPrePos = {};

  for (let seg = 0; seg < SEA_SEGMENTS; seg++) {
    const segEvents = [];

    // Save pre-segment positions
    const seaPreSorted = [...active].sort((a, b) => seaTimes[a] - seaTimes[b]);
    seaPreSorted.forEach((n, i) => { seaPrePos[n] = i; });

    for (const name of active) {
      const s = pStats(name);
      let time = 10 - boatSpeed[name] * 0.3 - s.endurance * 0.12 + noise(2.5);

      // Boost (Rocket Wheelchair)
      if (assignments[name].special === 'boost' && !assignments[name].boostUsed && seg === 0) {
        assignments[name].boostUsed = true;
        time -= 4;
        segEvents.push({ segment: seg, type: 'boost', player: name,
          text: pick(BOOST_TEXT)(name) });
        popDelta(name, 1);
      }

      // Navigation skill check
      if (Math.random() < 0.3) {
        if (s.mental * 0.3 + s.intuition * 0.3 + noise(2) > 4) {
          time -= 1.5;
          segEvents.push({ segment: seg, type: 'navigation', player: name,
            text: pickUnique(SEA_NAV_GOOD_TEXT)(name) });
        } else {
          time += 1.5;
          segEvents.push({ segment: seg, type: 'nav-error', player: name,
            text: pickUnique(SEA_NAV_BAD_TEXT)(name) });
        }
      }

      // Current riding (lucky chance)
      if (Math.random() < 0.15) {
        time -= 3;
        segEvents.push({ segment: seg, type: 'current', player: name,
          text: pick(CURRENT_RIDE_TEXT)(name) });
      }

      // Becalmed (bad luck)
      if (Math.random() < 0.12 && seg > 0) {
        time += 3;
        segEvents.push({ segment: seg, type: 'becalmed', player: name,
          text: pick(BECALMED_TEXT)(name) });
      }

      seaTimes[name] += Math.max(1, time);
    }

    // Sea creatures (1-2 per segment)
    const creatureVictims = [...active].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.5 ? 2 : 1);
    for (const name of creatureVictims) {
      if (Math.random() < 0.4) {
        segEvents.push({ segment: seg, type: 'creature', player: name,
          text: pick(SEA_CREATURE_TEXT)(name) });
      }
    }

    // Mine hazards (more targets, higher chance)
    const seaRanked = [...active].sort((a, b) => seaTimes[a] - seaTimes[b]);
    for (let i = 0; i < Math.min(5, active.length); i++) {
      const name = seaRanked[i];
      if (Math.random() < 0.3) {
        seaTimes[name] += 2.5;
        segEvents.push({ segment: seg, type: 'mine', player: name,
          text: pick(MINE_TEXT)(name) });
      }
    }

    // Boat ramming — sea vessel tier determines size on water
    const seaSorted = [...active].sort((a, b) => seaTimes[a] - seaTimes[b]);
    const tierSize = { heavy: 2, built: 1, medium: 1, light: 0, air: 0, animal: 0, scrap: 0 };
    for (let i = 0; i < seaSorted.length - 1; i++) {
      if (Math.abs(seaTimes[seaSorted[i]] - seaTimes[seaSorted[i + 1]]) < 2.5) {
        const a = seaSorted[i], b = seaSorted[i + 1];
        const aVessel = seaVessels[a], bVessel = seaVessels[b];
        const aSz = tierSize[aVessel?.tier] ?? 1, bSz = tierSize[bVessel?.tier] ?? 1;
        if (canSabotage(a) && Math.random() < 0.5) {
          const ramDmg = aSz >= bSz ? 1 : 0;
          const timePen = 2 + (aSz > bSz ? 1.5 : 0);
          if (ramDmg && aVessel.seaHp > 0 && bVessel.seaHp > 0) { bVessel.seaHp--; }
          seaTimes[b] += timePen;
          segEvents.push({ segment: seg, type: 'ram', player: a, target: b, damage: ramDmg,
            attackerHp: aVessel.seaHp, attackerMaxHp: aVessel.baseSeaHp || 3,
            targetHp: bVessel.seaHp, targetMaxHp: bVessel.baseSeaHp || 3,
            hpSnapshot: { [a]: aVessel.seaHp, [b]: bVessel.seaHp },
            text: pick(BOAT_RAM_TEXT)(a, b) });
          addBond(b, a, -2);
          popDelta(a, -1);
        } else if (canSabotage(b) && Math.random() < 0.5) {
          const ramDmg = bSz >= aSz ? 1 : 0;
          const timePen = 2 + (bSz > aSz ? 1.5 : 0);
          if (ramDmg && bVessel.seaHp > 0 && aVessel.seaHp > 0) { aVessel.seaHp--; }
          seaTimes[a] += timePen;
          segEvents.push({ segment: seg, type: 'ram', player: b, target: a, damage: ramDmg,
            attackerHp: bVessel.seaHp, attackerMaxHp: bVessel.baseSeaHp || 3,
            targetHp: aVessel.seaHp, targetMaxHp: aVessel.baseSeaHp || 3,
            hpSnapshot: { [a]: aVessel.seaHp, [b]: bVessel.seaHp },
            text: pick(BOAT_RAM_TEXT)(b, a) });
          addBond(a, b, -2);
          popDelta(b, -1);
        }
        break;
      }
    }

    // Rescue event (nice archetype saves a struggling player)
    if (seg >= 1) {
      const lastPlace = seaSorted[seaSorted.length - 1];
      const niceRacers = active.filter(n => n !== lastPlace && ['hero', 'loyal-soldier', 'social-butterfly'].includes(arch(n)));
      if (niceRacers.length > 0 && Math.random() < 0.3) {
        const rescuer = pick(niceRacers);
        seaTimes[rescuer] += 1.5;
        seaTimes[lastPlace] -= 1;
        segEvents.push({ segment: seg, type: 'rescue', player: rescuer, target: lastPlace,
          text: pick(SEA_RESCUE_TEXT)(rescuer, lastPlace) });
        addBond(rescuer, lastPlace, 2);
        popDelta(rescuer, 2);
      }
    }

    // Storm (hits harder, emits for more players)
    if (seg === 1 && Math.random() < 0.7) {
      const stormIntensity = 2 + Math.random() * 2;
      for (const name of active) {
        const s = pStats(name);
        const penalty = Math.max(0.5, stormIntensity - s.endurance * 0.25 + noise(1));
        seaTimes[name] += penalty;
        if (Math.random() < 0.55) {
          segEvents.push({ segment: seg, type: 'storm', player: name,
            text: pickUnique(STORM_TEXT)(name) });
        }
      }
    }

    // Swordfish duel (can happen in seg 1 or 2, up to 2 duels)
    if (seg >= 1) {
      let duelsThisSeg = 0;
      for (let i = 0; i < seaSorted.length - 1 && duelsThisSeg < 2; i++) {
        if (Math.abs(seaTimes[seaSorted[i]] - seaTimes[seaSorted[i + 1]]) < 2.5) {
          const a = seaSorted[i], b = seaSorted[i + 1];
          if (getBond(a, b) > 2) continue; // friends don't fight
          const sA = pStats(a), sB = pStats(b);
          const scoreA = sA.physical * 0.5 + sA.boldness * 0.4 + noise(2.5);
          const scoreB = sB.physical * 0.5 + sB.boldness * 0.4 + noise(2.5);
          const winner = scoreA > scoreB ? a : b;
          const loser = winner === a ? b : a;
          seaTimes[loser] += 2;
          segEvents.push({ segment: seg, type: 'duel', player: winner, target: loser,
            text: pick(SWORDFISH_TEXT)(winner, loser) + ` ${winner} came out on top.` });
          addBond(winner, loser, -1);
          popDelta(winner, 1);
          duelsThisSeg++;
        }
      }
    }

    // Position change narration
    const seaPostSorted = [...active].sort((a, b) => seaTimes[a] - seaTimes[b]);
    if (seg > 0 && seaPostSorted[0] !== seaPreSorted[0]) {
      segEvents.push({ segment: seg, type: 'lead-change', player: seaPostSorted[0],
        text: pick(LEAD_CHANGE_TEXT)(seaPostSorted[0]) });
    }
    for (const name of active) {
      const preIdx = seaPrePos[name] || 0;
      const postIdx = seaPostSorted.indexOf(name);
      const isOnFoot = assignments[name].currentHp <= 0;
      if (preIdx - postIdx >= 3) {
        const texts = isOnFoot ? OVERTAKE_ONFOOT_TEXT : OVERTAKE_TEXT;
        segEvents.push({ segment: seg, type: 'overtake', player: name,
          text: pickUnique(texts)(name, seaPreSorted[postIdx]) });
      } else if (postIdx - preIdx >= 3) {
        const texts = isOnFoot ? FALLING_BEHIND_ONFOOT_TEXT : FALLING_BEHIND_TEXT;
        segEvents.push({ segment: seg, type: 'falling-behind', player: name,
          text: pickUnique(texts)(name) });
      }
    }

    // Showmance moment on the water
    if (seg === 1 && gs.showmances?.length) {
      for (const sm of gs.showmances.filter(s => !s.broken)) {
        if (active.includes(sm.a) && active.includes(sm.b)) {
          const SEA_SHOWMANCE_TEXT = [
            (a, b) => `${a} and ${b} drifted close on the waves. For just a moment, the race didn't matter. Then it did again.`,
            (a, b) => `${a}'s boat bumped into ${b}'s. Their eyes met. Salt spray. Sunlight. A moment that lasted too long.`,
            (a, b) => `${b} reached across the gap between boats, steadying ${a}'s vessel. Their hands lingered. The ocean didn't care about the race.`,
            (a, b) => `"Stay close!" ${a} called to ${b}. It wasn't strategy. They both knew it. The waves pushed them together anyway.`,
          ];
          segEvents.push({ segment: seg, type: 'showmance', player: sm.a, target: sm.b,
            text: pick(SEA_SHOWMANCE_TEXT)(sm.a, sm.b) });
          _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'race', active);
          break;
        }
      }
    }

    // Score positions
    seaPostSorted.forEach((name, idx) => {
      ep.chalMemberScores[name] += (active.length - idx);
    });

    // Stamp time snapshot on last event for progressive sidebar
    if (segEvents.length > 0) {
      segEvents[segEvents.length - 1].timeSnapshot = { ...seaTimes };
    }
    const seaWrecked = new Set(active.filter(n => assignments[n].currentHp <= 0));
    if (seaWrecked.size > 0) {
      for (const ev of segEvents) { ev.wrecked = [...seaWrecked]; }
    }
    seaEvents.push(...segEvents);
  }

  // ── SEA FINISH: Racers reach the beach ──
  const seaRankedFinal = [...active].sort((a, b) => seaTimes[a] - seaTimes[b]);
  const SEA_FINISH_FIRST = [
    (n, t) => `${n} hit the beach FIRST! ${t}s across the open water. ${pronouns(n).Sub} dragged ${pronouns(n).posAdj} vessel ashore and scrambled to ${pronouns(n).posAdj} feet — the sprint awaited.`,
    (n, t) => `Sand! ${n} felt sand beneath ${pronouns(n).obj} at ${t}s. FIRST to shore. The ocean was behind ${pronouns(n).obj} — now it was all legs.`,
    (n, t) => `"LAND! LAND!" ${n} crashed through the surf at ${t}s, first to make it. Salt-soaked and grinning.`,
  ];
  const SEA_FINISH_MID = [
    (n, t, pos) => `${n} waded ashore at ${t}s — ${pos} place overall through the water. The beach beckoned.`,
    (n, t, pos) => `${n} reached the shallows at ${t}s. ${pos} out of the ocean. ${pronouns(n).Sub} staggered onto dry sand.`,
    (n, t, pos) => `Soaking wet, ${n} emerged from the surf at ${t}s in ${pos} position. The final sprint was all that remained.`,
    (n, t, pos) => `${n} planted ${pronouns(n).posAdj} feet on solid ground at ${t}s. ${pos} place. ${pronouns(n).Sub} wrung the seawater from ${pronouns(n).posAdj} shirt and started moving.`,
    (n, t, pos) => `The waves released ${n} at ${t}s — ${pos} to make landfall. ${pronouns(n).Sub} shook off the salt and scanned the beach ahead.`,
    (n, t, pos) => `${n} dragged ${pronouns(n).ref} through the breakers at ${t}s. ${pos} out. Sand never felt so good.`,
  ];
  const SEA_FINISH_LAST = [
    (n, t) => `${n} barely made it to shore at ${t}s. Lungs burning, legs like jelly. The beach sprint would be agony.`,
    (n, t) => `${n} crawled from the waves at ${t}s. The ocean had nearly won. But ${pronouns(n).sub} wasn't done yet.`,
    (n, t) => `The beach was a blur through ${n}'s salt-stung eyes. ${t}s. So far behind. Everything hurt.`,
    (n, t) => `${n} staggered from the surf at ${t}s, waterlogged and gasping. The others were already running. ${pronouns(n).Sub} forced ${pronouns(n).posAdj} legs to move.`,
    (n, t) => `A wave deposited ${n} on the sand at ${t}s like driftwood. ${pronouns(n).Sub} lay there for one second. Then two. Then got up and ran.`,
  ];

  seaRankedFinal.forEach((name, idx) => {
    const t = seaTimes[name]?.toFixed(1);
    const pos = ordinal(idx + 1);
    let text;
    if (idx === 0) text = pick(SEA_FINISH_FIRST)(name, t);
    else if (idx >= seaRankedFinal.length - 2) text = pick(SEA_FINISH_LAST)(name, t);
    else text = pick(SEA_FINISH_MID)(name, t, pos);
    seaEvents.push({ segment: SEA_SEGMENTS, type: 'finish', player: name, text, finishPos: idx + 1 });
  });

  const seaLeader = seaRankedFinal[0];
  seaEvents.push({ segment: SEA_SEGMENTS, type: 'host-transition', player: seaLeader,
    text: `${host()} watched through binoculars. "THE SEA CROSSING IS DONE! Now for the final sprint — one last push across the beach to the finish line!"` });

  seaEvents.push({ segment: SEA_SEGMENTS, type: 'standings', phase: 'sea',
    standings: seaRankedFinal.map((n, i) => {
      const landPos = landRanked.indexOf(n);
      return {
        name: n, pos: i + 1, time: (landTimes[n] + seaTimes[n]).toFixed(1),
        seaTime: seaTimes[n]?.toFixed(1),
        hp: seaVessels[n]?.seaHp ?? 0, maxHp: seaVessels[n]?.baseSeaHp || 3,
        vehicle: seaVessels[n]?.seaLabel || assignments[n].label, vehicleId: seaVessels[n]?.id || assignments[n].id,
        delta: landPos >= 0 ? landPos - i : 0,
      };
    }),
    text: '' });

  // ── Phase 4: Beach Sprint (3 segments — Shallows, Sand, Final Push) ──
  const totalTime = {};
  active.forEach(n => {
    totalTime[n] = landTimes[n] + seaTimes[n];
  });

  const beachEvents = [];
  const BEACH_SEGMENTS = 3;
  const beachPhaseNames = ['SHALLOWS', 'SAND SPRINT', 'FINAL PUSH'];

  for (let seg = 0; seg < BEACH_SEGMENTS; seg++) {
    const segEvents = [];
    const beachPreSorted = [...active].sort((a, b) => totalTime[a] - totalTime[b]);

    for (const name of active) {
      const s = pStats(name);
      let time = 4 - s.physical * 0.18 - s.boldness * 0.12 + noise(2.2);

      // Rocket Wheelchair boost on beach
      if (assignments[name].special === 'boost' && !assignments[name].boostUsed && seg === 0) {
        assignments[name].boostUsed = true;
        time -= 3;
        segEvents.push({ segment: seg, type: 'boost', player: name,
          text: pick(BOOST_TEXT)(name) });
      }

      // Zipline downhill bonus on beach slope
      if (assignments[name].special === 'downhill' && seg === 0) {
        time -= 1.5;
      }

      // Shallow mines (seg 0)
      if (seg === 0 && Math.random() < 0.25) {
        time += 2.5;
        segEvents.push({ segment: seg, type: 'mine', player: name,
          text: `${name} hit a mine in the shallows! The blast knocked ${pronouns(name).obj} sideways. Precious seconds lost.` });
      }

      // Collapse (exhaustion — more likely for players whose sea vessel was in bad shape)
      const qualVal = { pristine: 1, solid: 0.75, patched: 0.5, battered: 0.25, wrecked: 0, scrap: 0.15 };
      const vesselCondition = qualVal[seaVessels[name]?.quality] ?? 0.5;
      if (seg >= 1 && Math.random() < 0.2 * (1 - vesselCondition) + 0.08) {
        time += 2;
        segEvents.push({ segment: seg, type: 'collapse', player: name,
          text: pickUnique(BEACH_COLLAPSE_TEXT)(name) });
      }

      // Adrenaline surge (seg 2, random burst)
      if (seg === 2 && Math.random() < 0.25) {
        time -= 2.5;
        segEvents.push({ segment: seg, type: 'surge', player: name,
          text: pickUnique(BEACH_SURGE_TEXT)(name) });
        popDelta(name, 1);
      }

      totalTime[name] += Math.max(0.5, time);
    }

    // Tackles (close rivals, villains or hotheads)
    const beachSorted = [...active].sort((a, b) => totalTime[a] - totalTime[b]);
    for (let i = 0; i < beachSorted.length - 1; i++) {
      if (Math.abs(totalTime[beachSorted[i]] - totalTime[beachSorted[i + 1]]) < 1.5) {
        const a = beachSorted[i], b = beachSorted[i + 1];
        const aA = arch(a), bA = arch(b);
        if (['villain', 'hothead', 'chaos-agent'].includes(aA) && Math.random() < 0.5) {
          totalTime[b] += 1.5;
          segEvents.push({ segment: seg, type: 'tackle', player: a, target: b,
            text: pick(BEACH_TACKLE_TEXT)(a, b) });
          addBond(b, a, -2);
          popDelta(a, -1);
        } else if (['villain', 'hothead', 'chaos-agent'].includes(bA) && Math.random() < 0.5) {
          totalTime[a] += 1.5;
          segEvents.push({ segment: seg, type: 'tackle', player: b, target: a,
            text: pick(BEACH_TACKLE_TEXT)(b, a) });
          addBond(a, b, -2);
          popDelta(b, -1);
        }
        break;
      }
    }

    // Crowd reaction (seg 1-2, cheer for someone in the pack)
    if (seg >= 1) {
      const midPack = beachSorted.slice(Math.floor(beachSorted.length * 0.25), Math.ceil(beachSorted.length * 0.8));
      const crowdTarget = midPack.length > 0 ? pick(midPack) : beachSorted[Math.floor(beachSorted.length / 2)];
      if (crowdTarget && Math.random() < 0.5) {
        totalTime[crowdTarget] -= 0.8;
        segEvents.push({ segment: seg, type: 'crowd', player: crowdTarget,
          text: pick(BEACH_CROWD_TEXT)(crowdTarget) });
      }
    }

    // Position change narration
    const beachPostSorted = [...active].sort((a, b) => totalTime[a] - totalTime[b]);
    if (beachPostSorted[0] !== beachPreSorted[0]) {
      segEvents.push({ segment: seg, type: 'lead-change', player: beachPostSorted[0],
        text: pick(LEAD_CHANGE_TEXT)(beachPostSorted[0]) });
    }

    // Overtakes
    for (const name of active) {
      const preIdx = beachPreSorted.indexOf(name);
      const postIdx = beachPostSorted.indexOf(name);
      if (preIdx - postIdx >= 2 && postIdx > 0) {
        segEvents.push({ segment: seg, type: 'overtake', player: name, target: beachPreSorted[postIdx],
          text: pickUnique(OVERTAKE_TEXT)(name, beachPreSorted[postIdx]) });
      }
    }

    if (segEvents.length > 0) {
      segEvents[segEvents.length - 1].timeSnapshot = { ...totalTime };
    }
    const beachWrecked = new Set(active.filter(n => assignments[n].currentHp <= 0));
    if (beachWrecked.size > 0) {
      for (const ev of segEvents) { ev.wrecked = [...beachWrecked]; }
    }
    beachEvents.push(...segEvents);
  }

  // Final sprint narration (per-player finish)
  const beachRanked = [...active].sort((a, b) => totalTime[a] - totalTime[b]);
  beachRanked.forEach((name, idx) => {
    const tier = idx === 0 ? 'fast' : idx < Math.ceil(active.length * 0.4) ? 'mid' : 'slow';
    beachEvents.push({ segment: 3, type: 'sprint', player: name, tier,
      text: pick(BEACH_SPRINT_TEXT[tier])(name) });
  });

  // Photo finish / dive check
  if (beachRanked.length >= 2 && Math.abs(totalTime[beachRanked[0]] - totalTime[beachRanked[1]]) < 0.8) {
    beachEvents.push({ segment: 3, type: 'photo-finish', player: beachRanked[0], target: beachRanked[1],
      text: pick(PHOTO_FINISH_TEXT)(beachRanked[0], beachRanked[1]) });
    beachEvents.push({ segment: 3, type: 'dive', player: beachRanked[0], target: beachRanked[1],
      text: pick(BEACH_DIVE_TEXT)(beachRanked[0], beachRanked[1]) });
  }

  // Score final positions
  beachRanked.forEach((name, idx) => {
    ep.chalMemberScores[name] += (active.length - idx) * 2;
  });

  // Final standings
  beachEvents.push({ segment: BEACH_SEGMENTS + 1, type: 'standings', phase: 'final',
    standings: beachRanked.map((n, i) => {
      const seaPos = seaRankedFinal.indexOf(n);
      return {
        name: n, pos: i + 1, time: totalTime[n].toFixed(1),
        hp: assignments[n].currentHp, maxHp: VEHICLES[assignments[n].id]?.hp || 3,
        vehicle: assignments[n].label, vehicleId: assignments[n].id,
        delta: seaPos >= 0 ? seaPos - i : 0,
        winner: i === 0,
      };
    }),
    text: '' });

  // ── Finalize ──
  const winner = beachRanked[0];
  const maxOther = Math.max(...beachRanked.slice(1).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[winner] = maxOther + active.length + 5;

  // Romance spark opportunity
  for (let _ri = 0; _ri < active.length; _ri++) {
    for (let _rj = _ri + 1; _rj < active.length; _rj++) {
      _challengeRomanceSpark(active[_ri], active[_rj], ep, null, null, ep.chalMemberScores || {}, 'no-rules race');
    }
  }
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'race', active);

  // Camp events for winner
  ep.campEvents[campKey].post.push({
    text: `${winner} crossed the finish line first and won individual immunity in the great race!`,
    players: [winner], badgeText: 'IMMUNITY', badgeClass: 'green', tag: 'planes-trains'
  });

  // Set episode data
  ep.challengeData = {
    assignments: Object.fromEntries(active.map(n => [n, {
      vehicleId: assignments[n].id, vehicleLabel: assignments[n].label,
      finalHp: assignments[n].currentHp, maxHp: VEHICLES[assignments[n].id].hp,
      seaForm: assignments[n].seaForm || null,
    }])),
    seaVessels: Object.fromEntries(active.map(n => [n, seaVessels[n] || null])),
    draftOrder: finalDraftOrder,
    scavengeEvents,
    landEvents,
    seaEvents,
    beachEvents,
    landTimes: { ...landTimes },
    landTimeSnapshots,
    seaTimes: { ...seaTimes },
    totalTime: { ...totalTime },
    finalRanking: beachRanked,
    winner,
    hpTracker: { ...hpTracker },
  };
  ep.isPlanesTrains = true;
  ep.challengeType = 'planes-trains';
  ep.challengeLabel = 'Planes, Trains & Hot Air Mobiles';
  ep.challengeCategory = 'challenge';
  ep.chalPlacements = beachRanked;
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  updateChalRecord(ep);
}

// ════════════════════════════��════════════════════════════��════
// VP — CSS
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;700&family=Playfair+Display:ital,wght@0,400;1,700&family=Special+Elite&display=swap');
.pt-dossier{
  --pt-paper:#f3ead4;--pt-paper-deep:#e6d8b3;--pt-paper-shadow:#c9b888;
  --pt-ink:#1b2436;--pt-ink-soft:#3a4358;--pt-rust:#c44a23;--pt-rust-deep:#8b2f15;
  --pt-mustard:#d4a017;--pt-mustard-deep:#a37a0a;--pt-sand:#c9a373;
  --pt-teal:#2a6f7c;--pt-teal-deep:#19505a;--pt-sage:#7a8a5c;--pt-crimson:#a8281c;
  --pt-font-display:'Anton','Oswald',sans-serif;
  --pt-font-script:'Playfair Display',Georgia,serif;
  --pt-font-type:'Special Elite','Courier New',monospace;
  --pt-font-body:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  --pt-font-mono:'Courier New','Courier',monospace;
  max-width:1100px;margin:0 auto;position:relative;
  background:var(--pt-paper);
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E"),radial-gradient(ellipse 380px 220px at 8% 12%,rgba(139,78,40,0.07),transparent 60%),radial-gradient(ellipse 280px 180px at 92% 35%,rgba(139,78,40,0.06),transparent 60%);
  box-shadow:0 0 60px rgba(0,0,0,0.6);font-family:var(--pt-font-body);color:var(--pt-ink);line-height:1.5;
}
.pt-dossier *{box-sizing:border-box;}
.pt-dossier::before,.pt-dossier::after{content:'';position:absolute;left:0;right:0;height:14px;pointer-events:none;z-index:50;background:radial-gradient(circle at 6px 0,var(--pt-paper) 5px,transparent 6px) 0 0/12px 14px;}
.pt-dossier::before{top:-1px;transform:rotate(180deg);}
.pt-dossier::after{bottom:-1px;}

/* Telegram header */
.pt-telegram{display:flex;align-items:stretch;border-bottom:2px solid var(--pt-ink);background:var(--pt-paper-deep);font-family:var(--pt-font-type);position:relative;flex-wrap:wrap;}
.pt-telegram::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:4px;background:repeating-linear-gradient(90deg,var(--pt-ink) 0 6px,transparent 6px 12px);opacity:0.5;}
.pt-tg-cell{padding:10px 18px;border-right:1px dashed rgba(27,36,54,0.35);display:flex;flex-direction:column;gap:2px;min-width:0;}
.pt-tg-cell:last-child{border-right:none;}
.pt-tg-label{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--pt-ink-soft);}
.pt-tg-value{font-size:13px;color:var(--pt-ink);font-weight:700;letter-spacing:0.5px;}
.pt-tg-stamp{margin-left:auto;display:flex;align-items:center;padding:6px 14px;gap:10px;}
.pt-stamp-circle{width:52px;height:52px;border:2px solid var(--pt-rust);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-12deg);color:var(--pt-rust);font-family:var(--pt-font-display);position:relative;opacity:0.85;}
.pt-stamp-circle::before{content:'';position:absolute;inset:4px;border:1px solid var(--pt-rust);border-radius:50%;}

/* Hero/title */
.pt-hero{position:relative;min-height:580px;overflow:hidden;background:radial-gradient(ellipse 800px 400px at 50% 90%,rgba(196,74,35,0.08),transparent 70%),linear-gradient(180deg,var(--pt-paper) 0%,var(--pt-paper) 55%,var(--pt-paper-deep) 100%);isolation:isolate;}
.pt-hero-strata{position:absolute;left:0;right:0;bottom:0;height:50%;pointer-events:none;z-index:1;}
.pt-hero-strata::before{content:'';position:absolute;left:0;right:0;bottom:0;height:100%;background:linear-gradient(180deg,transparent 0%,transparent 40%,rgba(201,163,115,0.18) 55%,rgba(196,74,35,0.12) 70%,rgba(139,47,21,0.15) 100%);}
.pt-title-block{position:relative;z-index:8;text-align:center;padding:70px 40px 40px;}
.pt-eyebrow{display:inline-flex;align-items:center;gap:14px;font-family:var(--pt-font-type);font-size:12px;letter-spacing:4px;color:var(--pt-ink-soft);margin-bottom:18px;}
.pt-title-main{font-family:var(--pt-font-display);font-weight:400;font-size:clamp(48px,8vw,110px);line-height:0.88;letter-spacing:-1px;color:var(--pt-ink);text-transform:uppercase;margin:0;position:relative;}
.pt-title-main .pt-amp{font-family:var(--pt-font-script);font-style:italic;font-weight:700;color:var(--pt-rust);font-size:0.85em;display:inline-block;transform:translateY(0.06em) rotate(-6deg);margin:0 0.12em;}
.pt-title-tagline{margin-top:30px;font-family:var(--pt-font-script);font-style:italic;font-weight:700;font-size:20px;color:var(--pt-ink-soft);}
.pt-title-tagline em{color:var(--pt-rust);font-style:normal;}

/* Roster */
.pt-roster{margin-top:32px;position:relative;z-index:8;}
.pt-roster-label{font-family:var(--pt-font-type);font-size:9px;letter-spacing:3px;color:var(--pt-ink-soft);text-transform:uppercase;margin-bottom:12px;}
.pt-roster-grid{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;}
.pt-roster-card{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:56px;}
.pt-roster-card img{border:2px solid var(--pt-ink);box-shadow:2px 2px 0 rgba(27,36,54,0.15);}
.pt-roster-name{font-family:var(--pt-font-display);font-size:10px;letter-spacing:0.5px;color:var(--pt-ink);text-transform:uppercase;text-align:center;line-height:1.1;}

/* Meta ribbon */
.pt-meta-ribbon{background:var(--pt-ink);color:var(--pt-paper);padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:30px;font-family:var(--pt-font-type);font-size:12px;letter-spacing:3px;text-transform:uppercase;flex-wrap:wrap;}
.pt-meta-ribbon .pt-mr-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:8px;}

/* Sections */
.pt-section{padding:50px 44px;position:relative;}
.pt-section-header{display:flex;align-items:baseline;gap:18px;margin-bottom:30px;border-bottom:2px solid var(--pt-ink);padding-bottom:14px;}
.pt-section-num{font-family:var(--pt-font-display);font-size:52px;line-height:0.9;color:var(--pt-rust);}
.pt-section-h{font-family:var(--pt-font-display);font-size:34px;line-height:1;text-transform:uppercase;letter-spacing:1px;color:var(--pt-ink);}
.pt-section-sub{font-family:var(--pt-font-type);font-size:11px;letter-spacing:3px;color:var(--pt-ink-soft);text-transform:uppercase;margin-left:auto;}

/* Racer grid */
.pt-racers{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;}
.pt-racer{position:relative;background:var(--pt-paper-deep);border:1.5px solid var(--pt-ink);padding:18px 16px 16px;display:flex;flex-direction:column;gap:10px;box-shadow:4px 4px 0 rgba(27,36,54,0.12);}
.pt-racer::before{content:'';position:absolute;top:0;bottom:0;left:30%;width:1px;background:repeating-linear-gradient(180deg,rgba(27,36,54,0.5) 0 4px,transparent 4px 9px);pointer-events:none;}
.pt-racer-head{display:flex;align-items:center;gap:10px;}
.pt-racer-name{font-family:var(--pt-font-display);font-size:20px;line-height:1;text-transform:uppercase;letter-spacing:0.5px;color:var(--pt-ink);}
.pt-racer-tag{font-family:var(--pt-font-type);font-size:10px;letter-spacing:2px;color:var(--pt-ink-soft);text-transform:uppercase;margin-top:3px;}
.pt-racer-stage{height:100px;background:var(--pt-paper);border:1px solid rgba(27,36,54,0.4);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;}
.pt-racer-stage::before{content:'';position:absolute;left:0;right:0;bottom:14px;height:2px;background:repeating-linear-gradient(90deg,var(--pt-ink) 0 4px,transparent 4px 9px);opacity:0.5;}
.pt-racer-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-family:var(--pt-font-type);font-size:10px;letter-spacing:1.5px;color:var(--pt-ink-soft);text-transform:uppercase;}
.pt-racer-stats b{font-family:var(--pt-font-display);font-size:16px;color:var(--pt-ink);letter-spacing:1px;line-height:1;font-weight:400;display:block;}
.pt-racer-stats b.rust{color:var(--pt-rust);}
.pt-racer-stats b.teal{color:var(--pt-teal-deep);}
.pt-racer-postage{position:absolute;top:-10px;right:-10px;width:44px;height:52px;background:var(--pt-rust);color:var(--pt-paper);font-family:var(--pt-font-display);font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(8deg);z-index:2;box-shadow:1px 2px 0 rgba(0,0,0,0.2);}
.pt-racer-postage::after{content:'';position:absolute;inset:3px;border:1px dashed rgba(243,234,212,0.6);}
.pt-racer-postage .pt-pp-1{font-size:8px;letter-spacing:1.5px;font-family:var(--pt-font-type);}
.pt-racer-postage .pt-pp-2{font-size:18px;line-height:1;}
.pt-racer-postage.gold{background:var(--pt-mustard);}
.pt-racer-postage.teal{background:var(--pt-teal);}

/* Event cards */
.pt-event-card{background:var(--pt-paper-deep);border:1px solid var(--pt-ink);padding:12px 14px;font-family:var(--pt-font-body);font-size:13px;letter-spacing:0.2px;color:var(--pt-ink);line-height:1.6;position:relative;margin-bottom:10px;}
.pt-event-card .pt-ev-label{font-family:var(--pt-font-type);font-size:9px;letter-spacing:2.5px;color:var(--pt-teal);display:block;margin-bottom:6px;}
.pt-event-card .pt-ev-label.damage{color:var(--pt-crimson);}
.pt-event-card .pt-ev-label.social{color:var(--pt-sage);}
.pt-event-card .pt-ev-label.sabotage{color:var(--pt-rust);}
.pt-ev-players{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;}
.pt-ev-players img{border:1.5px solid var(--pt-ink);box-shadow:1px 1px 0 rgba(27,36,54,0.2);}
.pt-ev-pinfo{display:flex;flex-direction:column;gap:1px;}
.pt-ev-pname{font-family:var(--pt-font-display);font-size:13px;color:var(--pt-ink);letter-spacing:0.5px;display:block;line-height:1.2;}
.pt-ev-badge{font-size:8px;letter-spacing:2px;text-transform:uppercase;color:var(--pt-ink-soft);font-family:var(--pt-font-mono);display:block;line-height:1;}
.pt-ev-vs{font-family:var(--pt-font-display);font-size:10px;color:var(--pt-rust);letter-spacing:2px;margin:0 4px;}
.pt-event-card strong{font-family:var(--pt-font-display);font-size:13px;color:var(--pt-ink);letter-spacing:0.5px;display:block;margin-bottom:3px;}
.pt-ev-veh{float:right;margin:-2px -2px 6px 12px;opacity:0.9;filter:drop-shadow(1px 2px 0 rgba(27,36,54,0.2));background:rgba(243,234,212,0.5);border:1px dashed rgba(27,36,54,0.2);border-radius:4px;padding:4px;}
.pt-veh-clash{display:flex;align-items:center;justify-content:center;gap:0;margin:8px 0 6px;padding:6px 0;position:relative;}
.pt-veh-clash-left{animation:pt-clash-left 0.8s ease-in-out infinite alternate;}
.pt-veh-clash-right{transform:scaleX(-1);animation:pt-clash-right 0.8s ease-in-out infinite alternate;}
.pt-veh-clash-center{margin:0 -4px;animation:pt-spark-pop 0.6s ease-in-out infinite alternate;filter:drop-shadow(0 0 6px rgba(212,160,23,0.6));}
.pt-clash-dmg{display:flex;flex-direction:column;align-items:center;gap:2px;margin:0 8px;font-family:var(--pt-font-display);text-align:center;}
.pt-clash-dmg-num{font-size:16px;font-weight:700;letter-spacing:1px;text-shadow:0 0 6px currentColor;}
.pt-clash-dmg-num.red{color:var(--pt-crimson);}
.pt-clash-dmg-num.teal{color:var(--pt-teal);}
.pt-clash-hp{display:flex;gap:2px;margin-top:2px;}
.pt-clash-hp-pip{width:7px;height:10px;border:1px solid var(--pt-ink);border-radius:1px;}
.pt-clash-hp-pip.full{background:var(--pt-sage);}
.pt-clash-hp-pip.lost{background:var(--pt-crimson);opacity:0.6;}
.pt-clash-hp-pip.empty{background:transparent;opacity:0.3;}
.pt-clash-name{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--pt-ink-soft);font-family:var(--pt-font-mono);}
.pt-veh-faceoff .pt-veh-clash-left{animation:pt-faceoff-left 2s ease-in-out infinite alternate;}
.pt-veh-faceoff .pt-veh-clash-right{animation:pt-faceoff-right 2s ease-in-out infinite alternate;}
.pt-veh-taunt .pt-veh-clash-left{animation:pt-taunt-bounce 1.2s ease-in-out infinite;}
.pt-veh-taunt .pt-veh-clash-right{animation:none;opacity:0.5;transform:scaleX(-1);}
@keyframes pt-clash-left{0%{transform:translateX(0)}100%{transform:translateX(8px)}}
@keyframes pt-clash-right{0%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(-8px) scaleX(-1)}}
@keyframes pt-spark-pop{0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(1.2);opacity:1}}
@keyframes pt-faceoff-left{0%{transform:translateX(0)}50%{transform:translateX(3px)}100%{transform:translateX(0)}}
@keyframes pt-faceoff-right{0%{transform:translateX(0) scaleX(-1)}50%{transform:translateX(-3px) scaleX(-1)}100%{transform:translateX(0) scaleX(-1)}}
@keyframes pt-taunt-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@media(prefers-reduced-motion:reduce){.pt-veh-clash-left,.pt-veh-clash-right,.pt-veh-clash-center,.pt-veh-taunt .pt-veh-clash-left{animation:none;}}
.pt-event-card.border-rust{border-left:3px solid var(--pt-rust);}
.pt-event-card.border-teal{border-left:3px solid var(--pt-teal);}
.pt-event-card.border-mustard{border-left:3px solid var(--pt-mustard);}
.pt-event-card.border-crimson{border-left:3px solid var(--pt-crimson);}
.pt-event-card.border-sage{border-left:3px solid var(--pt-sage);}
.pt-event-card.border-gold{border-left:3px solid var(--pt-mustard);background:rgba(212,160,23,0.04);}
.pt-ev-label.gold{color:var(--pt-mustard);font-weight:700;text-shadow:0 0 8px rgba(212,160,23,0.3);}

/* Telegram card */
.pt-telegram-card{background:var(--pt-paper-deep);border:1px solid var(--pt-ink);padding:12px 14px;font-family:var(--pt-font-type);font-size:11px;letter-spacing:1px;color:var(--pt-ink);line-height:1.55;position:relative;margin-bottom:10px;}
.pt-telegram-card::before{content:'RACE DISPATCH';display:block;font-size:9px;letter-spacing:2.5px;color:var(--pt-rust);margin-bottom:6px;border-bottom:1px dashed rgba(27,36,54,0.3);padding-bottom:5px;}
.pt-telegram-card .pt-from{font-family:var(--pt-font-display);font-size:14px;color:var(--pt-ink);letter-spacing:0.5px;display:block;margin-bottom:4px;}

/* Sticky live map */
.pt-land-sticky-map{position:sticky;top:46px;z-index:15;background:var(--pt-paper);border-bottom:2px solid var(--pt-ink);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
.pt-map-header{display:flex;align-items:baseline;gap:14px;padding:10px 20px 6px;border-bottom:1px dashed rgba(27,36,54,0.25);}
.pt-map-track{position:relative;height:160px;background:linear-gradient(180deg,rgba(201,163,115,0.12) 0%,rgba(201,163,115,0.25) 100%);overflow:hidden;padding:8px 0;}
.pt-map-racer{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px;transform:translateX(-50%);transition:left 0.6s ease-out,bottom 0.3s ease-out,opacity 0.3s;z-index:10;}
.pt-map-racer-label{font-family:var(--pt-font-display);font-size:9px;letter-spacing:0.5px;color:var(--pt-paper);background:var(--pt-ink);padding:1px 5px;border-radius:2px;white-space:nowrap;line-height:1.2;text-transform:uppercase;}
.pt-map-seg-marker{position:absolute;top:6px;transform:translateX(-50%);font-family:var(--pt-font-type);font-size:7px;letter-spacing:1.5px;color:var(--pt-ink-soft);text-transform:uppercase;opacity:0.4;}
.pt-map-track::before{content:'';position:absolute;left:4%;right:4%;bottom:15%;height:2px;background:repeating-linear-gradient(90deg,var(--pt-ink) 0 6px,transparent 6px 14px);opacity:0.3;z-index:1;}
.pt-map-track::after{content:'';position:absolute;left:4%;right:4%;bottom:14%;height:16px;background:linear-gradient(90deg,rgba(201,163,115,0.3) 0%,rgba(139,47,21,0.15) 25%,rgba(201,163,115,0.2) 50%,rgba(42,111,124,0.1) 75%,rgba(42,111,124,0.2) 100%);z-index:0;}
.pt-map-seg-pips{display:flex;gap:0;border-top:1px solid rgba(27,36,54,0.2);}
.pt-seg-pip{flex:1;padding:5px 8px;font-family:var(--pt-font-type);font-size:8px;letter-spacing:1.5px;color:var(--pt-ink-soft);text-transform:uppercase;text-align:center;display:flex;align-items:center;justify-content:center;gap:5px;border-right:1px solid rgba(27,36,54,0.15);transition:background 0.3s,color 0.3s;}
.pt-seg-pip:last-child{border-right:none;}
.pt-seg-pip-dot{width:6px;height:6px;border-radius:50%;border:1.5px solid var(--pt-ink-soft);flex-shrink:0;transition:background 0.3s,border-color 0.3s;}
.pt-seg-pip.active{background:rgba(196,74,35,0.1);color:var(--pt-rust);}
.pt-seg-pip.active .pt-seg-pip-dot{background:var(--pt-rust);border-color:var(--pt-rust);}
.pt-seg-pip.done{color:var(--pt-sage);}
.pt-seg-pip.done .pt-seg-pip-dot{background:var(--pt-sage);border-color:var(--pt-sage);}

/* Map section (legacy) */
.pt-map-section{background:radial-gradient(ellipse 600px 200px at 50% 50%,rgba(201,163,115,0.18),transparent 70%),var(--pt-paper);padding:50px 44px 60px;position:relative;border-top:2px solid var(--pt-ink);border-bottom:2px solid var(--pt-ink);}
.pt-map-wrap{position:relative;height:340px;margin-top:16px;background:var(--pt-paper-deep);border:1.5px dashed var(--pt-ink);overflow:hidden;}
.pt-map-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(27,36,54,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(27,36,54,0.06) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;}
.pt-map-dot{position:absolute;width:22px;height:22px;border-radius:50%;background:var(--pt-paper);border:2px solid var(--pt-ink);display:flex;align-items:center;justify-content:center;font-family:var(--pt-font-display);font-size:11px;color:var(--pt-ink);transform:translate(-50%,-50%);z-index:5;box-shadow:0 2px 0 rgba(0,0,0,0.15);}
.pt-map-place{position:absolute;font-family:var(--pt-font-type);font-size:11px;letter-spacing:2px;color:var(--pt-ink);text-transform:uppercase;display:flex;align-items:center;gap:6px;z-index:4;transform:translate(-50%,-50%);}
.pt-map-place .pt-pin{width:10px;height:10px;border-radius:50%;background:var(--pt-rust);border:2px solid var(--pt-ink);}
.pt-map-place .pt-lbl{background:var(--pt-paper);padding:3px 7px;border:1px solid var(--pt-ink);white-space:nowrap;font-weight:700;}
.pt-route-path{fill:none;stroke:var(--pt-rust);stroke-width:2.5;stroke-dasharray:6 6;stroke-linecap:round;}

/* Sea sticky map */
.pt-sea-sticky-map{position:sticky;top:46px;z-index:15;background:var(--pt-paper);border-bottom:2px solid var(--pt-ink);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
.pt-sea-track{position:relative;height:180px;background:linear-gradient(180deg,rgba(42,111,124,0.08) 0%,rgba(42,111,124,0.2) 40%,rgba(25,80,90,0.3) 100%);overflow:hidden;padding:8px 0;}
.pt-sea-track::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(42,111,124,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(42,111,124,0.06) 1px,transparent 1px);background-size:48px 48px;pointer-events:none;}
.pt-sea-route{fill:none;stroke-width:2;stroke-dasharray:8 4;stroke-linecap:round;opacity:0.5;}
.pt-sea-legend{display:flex;flex-wrap:wrap;gap:6px 14px;padding:6px 20px;font-family:var(--pt-font-type);font-size:8px;letter-spacing:1px;color:var(--pt-ink-soft);text-transform:uppercase;border-top:1px dashed rgba(27,36,54,0.2);}
.pt-sea-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:3px;vertical-align:middle;}
.pt-sea-legend .mine-key{border:1.5px solid var(--pt-crimson);background:rgba(168,40,28,0.2);}

/* Sea phase (legacy decorative) */
.pt-sea-wrap{position:relative;height:300px;margin-top:16px;background:linear-gradient(180deg,rgba(42,111,124,0.15) 0%,rgba(42,111,124,0.25) 40%,rgba(25,80,90,0.35) 100%);border:1.5px dashed var(--pt-ink);overflow:hidden;}
.pt-wave{position:absolute;left:0;right:0;height:18px;background:repeating-linear-gradient(90deg,transparent 0 16px,rgba(255,255,255,0.25) 16px 28px,transparent 28px 60px);animation:pt-wave-roll 6s linear infinite;}
.pt-wave.w1{bottom:60px;opacity:0.6;}
.pt-wave.w2{bottom:42px;opacity:0.5;animation-duration:8s;animation-direction:reverse;}
.pt-wave.w3{bottom:25px;opacity:0.7;animation-duration:5s;}
@keyframes pt-wave-roll{from{background-position-x:0;}to{background-position-x:120px;}}
.pt-mine{position:absolute;width:16px;height:16px;border-radius:50%;border:2px solid var(--pt-crimson);background:rgba(168,40,28,0.15);animation:pt-mine-pulse 2s ease-in-out infinite;z-index:3;}
@keyframes pt-mine-pulse{0%,100%{box-shadow:0 0 0 2px rgba(168,40,28,0.2);transform:scale(1);}50%{box-shadow:0 0 0 6px rgba(168,40,28,0.05);transform:scale(1.1);}}

/* Beach */
.pt-beach-wrap{position:relative;height:200px;margin-top:16px;background:linear-gradient(180deg,rgba(42,111,124,0.25) 0%,rgba(86,165,179,0.35) 35%,rgba(212,160,23,0.35) 65%,rgba(201,163,115,0.5) 100%);border:1.5px solid var(--pt-ink);overflow:hidden;}

/* Results */
.pt-finish{padding:50px 44px 70px;background:linear-gradient(180deg,var(--pt-paper) 0%,rgba(42,111,124,0.08) 50%,rgba(212,160,23,0.12) 100%);position:relative;border-top:2px solid var(--pt-ink);}
.pt-podium{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:18px;align-items:end;margin-bottom:36px;}
.pt-podium-card{background:var(--pt-paper-deep);border:1.5px solid var(--pt-ink);padding:22px 16px 18px;text-align:center;position:relative;box-shadow:4px 4px 0 rgba(27,36,54,0.15);}
.pt-podium-card.first{background:linear-gradient(180deg,#f7e6a8,var(--pt-paper-deep));border-color:var(--pt-mustard-deep);border-width:2.5px;padding-top:30px;padding-bottom:26px;}
.pt-podium-card.first::before{content:'';position:absolute;top:-22px;left:50%;transform:translateX(-50%);width:60px;height:32px;background:var(--pt-mustard);clip-path:polygon(0 0,100% 0,80% 100%,50% 80%,20% 100%);filter:drop-shadow(0 2px 0 rgba(0,0,0,0.2));}
.pt-podium-rank{font-family:var(--pt-font-display);font-size:64px;line-height:0.9;color:var(--pt-ink-soft);display:block;}
.pt-podium-card.first .pt-podium-rank{color:var(--pt-mustard-deep);}
.pt-podium-name{font-family:var(--pt-font-display);font-size:24px;line-height:1;text-transform:uppercase;margin-top:8px;color:var(--pt-ink);}
.pt-podium-card.first .pt-podium-name{color:var(--pt-mustard-deep);}
.pt-podium-vehicle{font-family:var(--pt-font-type);font-size:10px;letter-spacing:2px;color:var(--pt-ink-soft);margin-top:6px;text-transform:uppercase;}
.pt-podium-tag{font-family:var(--pt-font-type);font-size:10px;letter-spacing:2px;color:var(--pt-ink-soft);text-transform:uppercase;margin-top:2px;}

/* Rankings table */
.pt-rankings{margin-top:24px;border:1.5px solid var(--pt-ink);font-family:var(--pt-font-type);font-size:11px;letter-spacing:1px;}
.pt-rankings-head{display:grid;grid-template-columns:40px 1fr 1.5fr 80px;gap:0;background:var(--pt-ink);color:var(--pt-paper);padding:8px 14px;font-size:9px;letter-spacing:2px;text-transform:uppercase;}
.pt-rankings-row{display:grid;grid-template-columns:40px 1fr 1.5fr 80px;gap:0;padding:10px 14px;border-bottom:1px dashed rgba(27,36,54,0.3);align-items:center;}
.pt-rankings-row:last-child{border-bottom:none;}
.pt-rankings-row:nth-child(even){background:rgba(230,216,179,0.4);}
.pt-rank-num{font-family:var(--pt-font-display);font-size:20px;color:var(--pt-rust);}
.pt-rank-name{font-family:var(--pt-font-display);font-size:15px;text-transform:uppercase;letter-spacing:0.5px;}
.pt-rank-vehicle{font-size:10px;color:var(--pt-ink-soft);letter-spacing:1.5px;}
.pt-rank-time{font-family:var(--pt-font-display);font-size:15px;color:var(--pt-teal-deep);}

/* Sidebar */
.pt-sidebar{width:260px;background:var(--pt-paper-deep);border:1.5px solid var(--pt-ink);font-family:var(--pt-font-type);font-size:11px;box-shadow:4px 4px 0 rgba(27,36,54,0.15);flex-shrink:0;position:sticky;top:30px;max-height:calc(100vh - 30px);overflow-y:auto;align-self:flex-start;}
.pt-sb-header{background:var(--pt-ink);color:var(--pt-paper);padding:12px 14px;font-family:var(--pt-font-display);font-size:16px;letter-spacing:2px;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center;}
.pt-sb-phase{font-family:var(--pt-font-type);font-size:9px;letter-spacing:2px;color:var(--pt-mustard);}
.pt-sb-section{padding:10px 12px;border-bottom:1px dashed rgba(27,36,54,0.3);}
.pt-sb-section-title{font-size:9px;letter-spacing:2.5px;color:var(--pt-rust);text-transform:uppercase;margin-bottom:6px;border-bottom:1px dashed rgba(27,36,54,0.3);padding-bottom:4px;}
.pt-sb-row{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px dotted rgba(27,36,54,0.15);}
.pt-sb-row:last-child{border-bottom:none;}
.pt-sb-pos{font-family:var(--pt-font-display);font-size:14px;color:var(--pt-rust);width:18px;text-align:center;}
.pt-sb-name{font-family:var(--pt-font-display);font-size:12px;text-transform:uppercase;flex:1;}
.pt-sb-hp-wrap{display:flex;flex-direction:column;align-items:center;gap:1px;flex-shrink:0;min-width:42px;}
.pt-sb-hp-label{font-size:8px;font-family:var(--pt-font-mono);letter-spacing:1px;font-weight:700;}
.pt-sb-hp{display:flex;gap:2px;align-items:center;flex-shrink:0;}
.pt-sb-hp-bar{width:8px;height:12px;background:var(--pt-sage);border:1px solid var(--pt-ink);border-radius:1px;transition:background 0.3s;}
.pt-sb-hp-bar.empty{background:transparent;border-color:rgba(27,36,54,0.25);}
.pt-sb-hp-bar.low{background:var(--pt-crimson);animation:pt-hp-pulse 1.5s ease-in-out infinite;}
@keyframes pt-hp-pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.pt-sb-event{padding:6px 8px;margin-top:4px;background:var(--pt-paper);border:1px solid rgba(27,36,54,0.3);font-size:10px;letter-spacing:1px;color:var(--pt-ink-soft);line-height:1.4;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.pt-sb-event img{border:1px solid var(--pt-ink);flex-shrink:0;border-radius:2px;}
.pt-sb-event strong{color:var(--pt-ink);}
.pt-sb-event .pt-ev-type{font-size:8px;letter-spacing:2px;color:var(--pt-rust);display:block;margin-bottom:2px;}
.pt-sb-progress{display:flex;gap:3px;margin-top:6px;}
.pt-sb-pip{flex:1;height:5px;background:var(--pt-paper);border:1px solid var(--pt-ink);}
.pt-sb-pip.active{background:var(--pt-rust);}
.pt-sb-pip.done{background:var(--pt-sage);}

/* Layout with sidebar */
.pt-layout{display:flex;gap:20px;align-items:flex-start;margin-top:20px;}
.pt-feed{flex:1;min-width:0;}

/* Reveal system */
.pt-step-hidden{display:none;}
.pt-step-visible{display:block;}
.pt-controls{position:sticky;bottom:12px;z-index:20;display:flex;gap:10px;justify-content:center;padding:12px;background:var(--pt-paper-deep);border:1.5px solid var(--pt-ink);margin-top:16px;}
.pt-btn{font-family:var(--pt-font-type);font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:8px 18px;background:var(--pt-ink);color:var(--pt-paper);border:none;cursor:pointer;}
.pt-btn:hover{background:var(--pt-rust);}
.pt-btn-gold{background:var(--pt-mustard);color:var(--pt-ink);}
.pt-btn-gold:hover{background:var(--pt-mustard-deep);color:var(--pt-paper);}
.pt-counter{font-family:var(--pt-font-type);font-size:11px;letter-spacing:2px;color:var(--pt-ink-soft);text-align:center;margin-top:6px;}
.pt-flavor{font-family:var(--pt-font-script);font-style:italic;font-size:13px;color:var(--pt-ink-soft);padding:10px 18px;border-left:2px solid var(--pt-sand);margin:14px 0;opacity:0.85;}

/* Host intro */
.pt-host-intro{background:rgba(42,111,124,0.08);border:2px dashed var(--pt-teal);border-radius:8px;padding:18px 22px;margin-bottom:20px;position:relative;}
.pt-host-badge{display:inline-block;background:var(--pt-teal);color:#fff;font-family:var(--pt-font-mono);font-size:10px;font-weight:700;letter-spacing:2px;padding:3px 10px;border-radius:3px;margin-bottom:12px;text-transform:uppercase;}
.pt-host-text{font-family:var(--pt-font-script);font-size:14px;line-height:1.6;color:var(--pt-ink);margin-bottom:8px;}
.pt-host-text b{color:var(--pt-teal);font-weight:700;}
.pt-host-sig{font-family:var(--pt-font-mono);font-size:11px;color:var(--pt-rust);text-align:right;margin-top:8px;letter-spacing:1px;}

/* Vehicle animations */
.pt-v-balloon{animation:pt-balloon-bob 3.5s ease-in-out infinite;}
@keyframes pt-balloon-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
.pt-v-train{animation:pt-slide-bounce 4s ease-in-out infinite;}
@keyframes pt-slide-bounce{0%,100%{transform:translateX(-4px);}50%{transform:translateX(4px) translateY(-2px);}}
.pt-v-horse{animation:pt-gallop 0.5s steps(2,end) infinite;}
@keyframes pt-gallop{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
.pt-v-motorcycle{animation:pt-moto-lean 2s ease-in-out infinite;}
@keyframes pt-moto-lean{0%,100%{transform:rotate(-2deg);}50%{transform:rotate(2deg) translateX(3px);}}
.pt-v-raft{animation:pt-raft-wobble 3s ease-in-out infinite;}
@keyframes pt-raft-wobble{0%,100%{transform:rotate(-3deg);}50%{transform:rotate(3deg) translateY(-3px);}}
.pt-v-wheelchair{animation:pt-rocket-hover 1.5s ease-in-out infinite;}
@keyframes pt-rocket-hover{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
.pt-v-helicopter{animation:pt-heli-sway 4s ease-in-out infinite;}
@keyframes pt-heli-sway{0%,100%{transform:translateX(-3px);}25%{transform:translateX(3px) translateY(-2px);}50%{transform:translateY(-4px);}75%{transform:translateX(-2px) translateY(-1px);}}
.pt-v-gokart{animation:pt-kart-bump 0.6s ease-in-out infinite;}
@keyframes pt-kart-bump{0%,100%{transform:translateY(0);}50%{transform:translateY(-2px);}}
.pt-v-zipline{animation:pt-zip-swing 2.5s ease-in-out infinite;}
@keyframes pt-zip-swing{0%,100%{transform:rotate(-5deg);}50%{transform:rotate(5deg);}}
.pt-v-truck{animation:pt-truck-rumble 0.3s ease-in-out infinite;}
@keyframes pt-truck-rumble{0%,100%{transform:translateY(0);}25%{transform:translateY(-1px) translateX(0.5px);}75%{transform:translateY(0.5px) translateX(-0.5px);}}
.pt-rotor-spin{transform-origin:center;animation:pt-rotor 0.2s linear infinite;}
@keyframes pt-rotor{to{transform:rotate(360deg);}}
.pt-wheel-spin{transform-origin:center;animation:pt-wheel 0.4s linear infinite;}
@keyframes pt-wheel{to{transform:rotate(360deg);}}
.pt-flame-flicker{transform-origin:center bottom;animation:pt-flame 0.35s ease-in-out infinite alternate;}
@keyframes pt-flame{from{transform:scaleY(0.85) scaleX(1.05);opacity:0.85;}to{transform:scaleY(1.1) scaleX(0.95);opacity:1;}}

/* Scene animations */
.pt-scene{position:absolute;inset:0;pointer-events:none;z-index:4;}
.pt-scene-plane{position:absolute;top:22%;left:-80px;width:70px;height:50px;animation:pt-plane-fly 14s linear infinite;}
@keyframes pt-plane-fly{0%{left:-80px;top:22%;transform:rotate(-4deg);}50%{top:24%;transform:rotate(-3deg);}100%{left:calc(100% + 80px);top:20%;transform:rotate(-2deg);}}
.pt-scene-balloon{position:absolute;bottom:180px;width:70px;height:110px;animation:pt-balloon-drift 22s linear infinite,pt-balloon-bob 3.5s ease-in-out infinite;left:-90px;}
@keyframes pt-balloon-drift{0%{left:-90px;}100%{left:calc(100% + 90px);}}
.pt-scene-tracks{position:absolute;left:0;right:0;bottom:44px;height:14px;z-index:3;pointer-events:none;}
.pt-scene-tracks::before{content:'';position:absolute;left:0;right:0;top:5px;height:2px;background:var(--pt-ink);opacity:0.7;}
.pt-scene-tracks::after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;background:repeating-linear-gradient(90deg,var(--pt-ink) 0 4px,transparent 4px 14px);opacity:0.65;}
.pt-scene-train{position:absolute;left:-220px;bottom:50px;width:200px;height:50px;z-index:4;animation:pt-train-run 18s linear infinite;}
@keyframes pt-train-run{0%{left:-220px;}100%{left:calc(100% + 30px);}}

/* Compass */
.pt-compass{position:absolute;top:20px;right:20px;width:60px;height:60px;z-index:6;opacity:0.5;animation:pt-compass-spin 60s linear infinite;}
@keyframes pt-compass-spin{to{transform:rotate(360deg);}}

/* Wreckage backdrop */
.pt-wreckage-bg{position:relative;min-height:200px;background:linear-gradient(180deg,rgba(27,36,54,0.08) 0%,rgba(196,74,35,0.06) 50%,rgba(139,47,21,0.1) 100%);overflow:hidden;padding:20px 44px;margin-bottom:0;}
.pt-crash-plane{position:absolute;bottom:0;left:0;width:100%;height:auto;opacity:0.12;pointer-events:none;}
.pt-smoke{position:absolute;width:40px;height:80px;background:radial-gradient(ellipse,rgba(100,100,100,0.3),transparent 70%);border-radius:50%;pointer-events:none;filter:blur(8px);}
.pt-smoke-1{bottom:40%;left:30%;animation:pt-smoke-rise 4s ease-out infinite;}
.pt-smoke-2{bottom:35%;left:55%;animation:pt-smoke-rise 5s ease-out infinite 1s;}
.pt-smoke-3{bottom:38%;left:75%;animation:pt-smoke-rise 6s ease-out infinite 2.5s;}
@keyframes pt-smoke-rise{0%{transform:translateY(0) scale(1);opacity:0.4;}100%{transform:translateY(-60px) scale(1.8);opacity:0;}}
.pt-spark{position:absolute;width:3px;height:3px;background:var(--pt-mustard);border-radius:50%;pointer-events:none;}
.pt-spark-1{bottom:45%;left:35%;animation:pt-spark-pop 1.5s ease-out infinite;}
.pt-spark-2{bottom:42%;left:50%;animation:pt-spark-pop 2s ease-out infinite 0.5s;}
.pt-spark-3{bottom:48%;left:68%;animation:pt-spark-pop 1.8s ease-out infinite 1.2s;}
@keyframes pt-spark-pop{0%{transform:translate(0,0);opacity:1;}50%{transform:translate(-12px,-20px);opacity:0.8;}100%{transform:translate(15px,-40px);opacity:0;}}

/* Draft pick cards */
.pt-draft-card{position:relative;background:var(--pt-paper-deep);border:1.5px solid var(--pt-ink);padding:20px;margin-bottom:14px;box-shadow:4px 4px 0 rgba(27,36,54,0.12);display:flex;flex-direction:column;gap:12px;}
.pt-draft-card.border-gold{border-left:4px solid var(--pt-mustard);}
.pt-draft-card.border-teal{border-left:4px solid var(--pt-teal);}
.pt-draft-card.border-rust{border-left:4px solid var(--pt-rust);}
.pt-draft-head{display:flex;align-items:center;gap:12px;}
.pt-draft-name{font-family:var(--pt-font-display);font-size:22px;line-height:1;text-transform:uppercase;letter-spacing:0.5px;color:var(--pt-ink);}
.pt-draft-archetype{font-family:var(--pt-font-type);font-size:9px;letter-spacing:2px;color:var(--pt-ink-soft);text-transform:uppercase;margin-top:3px;}
.pt-draft-vehicle{display:flex;align-items:center;gap:18px;padding:12px;background:var(--pt-paper);border:1px solid rgba(27,36,54,0.3);}
.pt-draft-icon{flex-shrink:0;}
.pt-draft-vname{font-family:var(--pt-font-display);font-size:18px;text-transform:uppercase;color:var(--pt-ink);letter-spacing:1px;}
.pt-draft-stats{display:flex;gap:14px;font-family:var(--pt-font-type);font-size:10px;letter-spacing:1.5px;color:var(--pt-ink-soft);text-transform:uppercase;margin-top:4px;}
.pt-draft-stats b{font-family:var(--pt-font-display);font-size:16px;color:var(--pt-ink);display:inline-block;margin-left:3px;}
.pt-draft-stats b.rust{color:var(--pt-rust);}
.pt-draft-stats b.teal{color:var(--pt-teal-deep);}
.pt-draft-narration{font-family:var(--pt-font-body);font-size:13px;letter-spacing:0.2px;color:var(--pt-ink);line-height:1.6;padding:8px 12px;border-left:2px solid var(--pt-sand);background:rgba(201,163,115,0.08);}
.pt-draft-postage{position:absolute;top:-10px;right:-10px;width:48px;height:56px;background:var(--pt-rust);color:var(--pt-paper);font-family:var(--pt-font-display);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(8deg);z-index:2;box-shadow:1px 2px 0 rgba(0,0,0,0.2);}
.pt-draft-postage::after{content:'';position:absolute;inset:3px;border:1px dashed rgba(243,234,212,0.6);}
.pt-draft-postage .pt-pp-1{font-size:8px;letter-spacing:1.5px;font-family:var(--pt-font-type);}
.pt-draft-postage .pt-pp-2{font-size:20px;line-height:1;}
.pt-draft-postage.gold{background:var(--pt-mustard);}
.pt-draft-postage.teal{background:var(--pt-teal);}

/* Scramble/conflict event cards */
.pt-scramble-card{background:var(--pt-paper);border:1.5px dashed var(--pt-ink);padding:14px 16px;margin-bottom:10px;font-family:var(--pt-font-body);font-size:13px;letter-spacing:0.2px;line-height:1.6;color:var(--pt-ink);}
.pt-scramble-card.border-crimson{border-color:var(--pt-crimson);border-left:3px solid var(--pt-crimson);}
.pt-scramble-card.border-sage{border-color:var(--pt-sage);border-left:3px solid var(--pt-sage);}
.pt-scramble-card.border-rust{border-color:var(--pt-rust);border-left:3px solid var(--pt-rust);}
.pt-scramble-card.border-mustard{border-color:var(--pt-mustard);border-left:3px solid var(--pt-mustard);}
.pt-scramble-players{display:flex;gap:8px;align-items:center;margin:6px 0;}
.pt-scramble-text{margin-top:4px;}
.pt-ev-label{font-family:var(--pt-font-type);font-size:9px;letter-spacing:2.5px;display:block;margin-bottom:4px;text-transform:uppercase;}
.pt-ev-label.type-sprint{color:var(--pt-sage);}
.pt-ev-label.type-stumble{color:var(--pt-rust);}
.pt-ev-label.type-hangback{color:var(--pt-teal);}
.pt-ev-label.type-fight{color:var(--pt-crimson);}
.pt-ev-label.type-steal{color:var(--pt-crimson);}
.pt-ev-label.type-yield{color:var(--pt-sage);}
.pt-ev-label.type-injury{color:var(--pt-rust);}
.pt-ev-label.type-bond{color:var(--pt-teal);}
.pt-ev-label.type-gem{color:var(--pt-mustard);}

/* Sidebar: vehicles remaining */
.pt-sb-veh{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px dotted rgba(27,36,54,0.15);font-size:10px;letter-spacing:1px;}
.pt-sb-veh:last-child{border-bottom:none;}
.pt-sb-veh.claimed{opacity:0.45;text-decoration:line-through;}
.pt-sb-veh-name{flex:1;font-family:var(--pt-font-display);font-size:11px;text-transform:uppercase;}
.pt-sb-veh-claimer{font-family:var(--pt-font-type);font-size:9px;color:var(--pt-rust);letter-spacing:1px;}

/* Standings card */
.pt-standings-card{background:var(--pt-paper-deep);border:2px solid var(--pt-ink);margin:14px 0;box-shadow:6px 6px 0 rgba(27,36,54,0.18);position:relative;overflow:hidden;}
.pt-standings-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--pt-rust),var(--pt-mustard),var(--pt-teal));}
.pt-standings-card.final{border-color:var(--pt-mustard-deep);border-width:2.5px;}
.pt-standings-card.final::before{height:4px;background:linear-gradient(90deg,var(--pt-mustard),var(--pt-rust),var(--pt-mustard));}
.pt-st-header{background:var(--pt-ink);color:var(--pt-paper);padding:14px 18px;font-family:var(--pt-font-display);font-size:22px;letter-spacing:3px;text-transform:uppercase;text-align:center;}
.pt-standings-card.final .pt-st-header{background:linear-gradient(135deg,var(--pt-ink) 0%,#2a2a3a 100%);}
.pt-st-row{display:grid;grid-template-columns:32px 36px 1fr auto 70px 50px;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px dashed rgba(27,36,54,0.25);transition:background 0.2s;}
.pt-st-row:last-child{border-bottom:none;}
.pt-st-row:nth-child(even){background:rgba(230,216,179,0.35);}
.pt-st-row.first{background:rgba(212,160,23,0.12);}
.pt-st-row.last{background:rgba(196,74,35,0.06);}
.pt-st-row.winner{background:linear-gradient(90deg,rgba(212,160,23,0.15),rgba(212,160,23,0.05));border-left:3px solid var(--pt-mustard);}
.pt-st-row img{border:1.5px solid var(--pt-ink);box-shadow:1px 1px 0 rgba(27,36,54,0.2);}
.pt-st-pos{font-family:var(--pt-font-display);font-size:22px;color:var(--pt-rust);text-align:center;line-height:1;}
.pt-st-row.first .pt-st-pos{color:var(--pt-mustard-deep);}
.pt-st-info{display:flex;flex-direction:column;gap:1px;min-width:0;}
.pt-st-name{font-family:var(--pt-font-display);font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:var(--pt-ink);line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.pt-st-veh{font-family:var(--pt-font-type);font-size:8px;letter-spacing:1.5px;color:var(--pt-ink-soft);text-transform:uppercase;line-height:1;}
.pt-st-hp-wrap{display:flex;gap:3px;align-items:center;}
.pt-st-hp{width:8px;height:12px;border:1px solid var(--pt-ink);background:var(--pt-sage);}
.pt-st-hp.ok{background:var(--pt-sage);}
.pt-st-hp.low{background:var(--pt-crimson);animation:pt-mine-pulse 2s ease-in-out infinite;}
.pt-st-hp.empty{background:transparent;}
.pt-st-time{font-family:var(--pt-font-display);font-size:14px;color:var(--pt-teal-deep);text-align:right;letter-spacing:0.5px;}
.pt-st-delta{font-family:var(--pt-font-display);font-size:13px;text-align:center;min-width:36px;}
.pt-st-delta.up{color:var(--pt-sage);}
.pt-st-delta.down{color:var(--pt-crimson);}
.pt-st-delta.flat{color:var(--pt-ink-soft);opacity:0.5;}
.pt-st-delta.skip{font-family:var(--pt-font-type);font-size:8px;letter-spacing:1px;color:var(--pt-ink-soft);}
.pt-st-winner{background:linear-gradient(135deg,var(--pt-mustard) 0%,var(--pt-mustard-deep) 100%);color:var(--pt-paper);padding:14px 18px;font-family:var(--pt-font-display);font-size:20px;letter-spacing:4px;text-align:center;text-transform:uppercase;}

/* Sidebar enhancements */
.pt-sb-row{display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px dotted rgba(27,36,54,0.15);}
.pt-sb-row:last-child{border-bottom:none;}
.pt-sb-row img{border:1px solid var(--pt-ink);flex-shrink:0;}
.pt-sb-detail{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;}
.pt-sb-veh-label{font-family:var(--pt-font-type);font-size:7px;letter-spacing:1px;color:var(--pt-ink-soft);text-transform:uppercase;line-height:1;}
.pt-sb-quality{font-family:var(--pt-font-type);font-size:6px;letter-spacing:0.5px;font-weight:700;margin-left:4px;padding:1px 3px;border-radius:2px;background:rgba(0,0,0,0.06);}
.pt-sb-time{font-family:var(--pt-font-display);font-size:11px;color:var(--pt-teal-deep);white-space:nowrap;}
.pt-sb-arrow{font-size:10px;min-width:22px;text-align:center;}
.pt-sb-arrow.up{color:var(--pt-sage);}
.pt-sb-arrow.down{color:var(--pt-crimson);}
.pt-sb-arrow.flat{color:var(--pt-ink-soft);opacity:0.4;}
.pt-sb-stat-row{display:flex;justify-content:space-between;padding:4px 0;font-size:10px;letter-spacing:1px;color:var(--pt-ink-soft);}
.pt-sb-stat-val{font-family:var(--pt-font-display);font-size:13px;color:var(--pt-ink);}

/* Responsive */
@media(max-width:880px){.pt-racers{grid-template-columns:1fr 1fr;}.pt-podium{grid-template-columns:1fr;}.pt-layout{flex-direction:column;}.pt-sidebar{width:100%;}}
@media(prefers-reduced-motion:reduce){.pt-dossier *{animation:none !important;}}
</style>`;
}

// ══════════════════════════════════════════════════════════════
// VP — SVG VEHICLE ICONS
// ══════════════════════════════════════════════════════════════
function _vehicleIcon(vehicleId, size = 80) {
  const s = size;
  const ink = '#1b2436';
  const rust = '#c44a23';
  const teal = '#2a6f7c';
  const mustard = '#d4a017';

  switch (vehicleId) {
    case 'balloon': return `<svg class="pt-v-balloon" width="${s}" height="${s * 1.4}" viewBox="0 0 60 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="28" rx="18" ry="24" fill="${rust}" stroke="${ink}" stroke-width="2"/>
      <path d="M18 28 C18 28, 22 28, 22 4 M26 28 C26 28, 28 28, 30 4 M34 28 C34 28, 36 28, 38 4 M42 28 C42 28, 38 28, 38 4" stroke="${mustard}" stroke-width="1" opacity="0.6"/>
      <line x1="24" y1="50" x2="22" y2="64" stroke="${ink}" stroke-width="1.5"/>
      <line x1="36" y1="50" x2="38" y2="64" stroke="${ink}" stroke-width="1.5"/>
      <rect x="20" y="64" width="20" height="12" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="26" cy="70" r="3" fill="${teal}"/>
      <circle cx="34" cy="70" r="3" fill="${teal}"/>
      <ellipse class="pt-flame-flicker" cx="30" cy="54" rx="4" ry="6" fill="${mustard}" opacity="0.9"/>
    </svg>`;

    case 'train': return `<svg class="pt-v-train" width="${s * 1.6}" height="${s * 0.6}" viewBox="0 0 120 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="50" height="28" rx="3" fill="${ink}" stroke="${ink}" stroke-width="2"/>
      <rect x="8" y="12" width="14" height="12" rx="1" fill="${teal}" opacity="0.6"/>
      <rect x="40" y="4" width="16" height="12" rx="1" fill="${rust}"/>
      <circle class="pt-wheel-spin" cx="14" cy="38" r="5" fill="none" stroke="${ink}" stroke-width="2"/><line x1="14" y1="33" x2="14" y2="38" stroke="${ink}" stroke-width="1.5"/>
      <circle class="pt-wheel-spin" cx="30" cy="38" r="5" fill="none" stroke="${ink}" stroke-width="2"/><line x1="30" y1="33" x2="30" y2="38" stroke="${ink}" stroke-width="1.5"/>
      <circle class="pt-wheel-spin" cx="46" cy="38" r="5" fill="none" stroke="${ink}" stroke-width="2"/><line x1="46" y1="33" x2="46" y2="38" stroke="${ink}" stroke-width="1.5"/>
      <rect x="58" y="14" width="40" height="22" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5" opacity="0.7"/>
      <circle class="pt-wheel-spin" cx="68" cy="38" r="4" fill="none" stroke="${ink}" stroke-width="1.5"/>
      <circle class="pt-wheel-spin" cx="88" cy="38" r="4" fill="none" stroke="${ink}" stroke-width="1.5"/>
      <rect x="60" y="16" width="12" height="8" rx="1" fill="${mustard}" opacity="0.4"/>
    </svg>`;

    case 'truck': return `<svg class="pt-v-truck" width="${s}" height="${s * 0.7}" viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="44" height="30" rx="2" fill="${ink}" stroke="${ink}" stroke-width="2"/>
      <rect x="8" y="14" width="36" height="22" fill="none" stroke="${mustard}" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="12" cy="22" r="2" fill="white"/>
      <circle cx="12" cy="28" r="2" fill="white"/>
      <rect x="48" y="16" width="18" height="24" rx="2" fill="${rust}" stroke="${ink}" stroke-width="1.5"/>
      <rect x="52" y="20" width="10" height="8" rx="1" fill="${teal}" opacity="0.5"/>
      <circle cx="16" cy="42" r="4" fill="none" stroke="${ink}" stroke-width="2"/>
      <circle cx="36" cy="42" r="4" fill="none" stroke="${ink}" stroke-width="2"/>
      <circle cx="58" cy="42" r="4" fill="none" stroke="${ink}" stroke-width="2"/>
    </svg>`;

    case 'horse': return `<svg class="pt-v-horse" width="${s}" height="${s * 0.8}" viewBox="0 0 70 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="35" cy="30" rx="18" ry="12" fill="${ink}" stroke="${ink}" stroke-width="2"/>
      <path d="M50 22 Q56 14, 54 8 Q52 4, 48 6 Q46 10, 48 18" fill="${ink}" stroke="${ink}" stroke-width="1.5"/>
      <line x1="22" y1="40" x2="20" y2="52" stroke="${ink}" stroke-width="2.5"/>
      <line x1="28" y1="40" x2="26" y2="52" stroke="${ink}" stroke-width="2.5"/>
      <line x1="42" y1="40" x2="44" y2="52" stroke="${ink}" stroke-width="2.5"/>
      <line x1="48" y1="40" x2="50" y2="52" stroke="${ink}" stroke-width="2.5"/>
      <path d="M17 28 Q12 26, 10 30 Q8 34, 12 34" fill="${ink}"/>
      <circle cx="52" cy="10" r="1.5" fill="white"/>
      <path d="M54 6 Q58 2, 56 6 Q54 10, 52 8" fill="${rust}" opacity="0.7"/>
    </svg>`;

    case 'motorcycle': return `<svg class="pt-v-motorcycle" width="${s}" height="${s * 0.6}" viewBox="0 0 70 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="30" r="9" fill="none" stroke="${ink}" stroke-width="2.5"/>
      <circle cx="56" cy="30" r="9" fill="none" stroke="${ink}" stroke-width="2.5"/>
      <path d="M14 30 L28 20 L44 18 L56 30" stroke="${ink}" stroke-width="2" fill="none"/>
      <path d="M28 20 L34 10 L44 10 L48 18" fill="${rust}" stroke="${ink}" stroke-width="1.5"/>
      <rect x="44" y="12" width="8" height="4" rx="1" fill="${ink}"/>
      <line x1="56" y1="20" x2="62" y2="16" stroke="${ink}" stroke-width="2"/>
      <path d="M60 28 Q68 26, 66 22" stroke="${rust}" stroke-width="1.5" stroke-dasharray="2 2" opacity="0.6"/>
    </svg>`;

    case 'raft': return `<svg class="pt-v-raft" width="${s}" height="${s * 0.7}" viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="38" rx="8" ry="5" fill="${teal}" stroke="${ink}" stroke-width="1.5" opacity="0.7"/>
      <ellipse cx="50" cy="38" rx="8" ry="5" fill="${teal}" stroke="${ink}" stroke-width="1.5" opacity="0.7"/>
      <rect x="12" y="28" width="46" height="8" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/>
      <line x1="35" y1="28" x2="35" y2="8" stroke="${ink}" stroke-width="2"/>
      <path d="M35 8 L50 18 L35 22 Z" fill="${mustard}" stroke="${ink}" stroke-width="1"/>
      <circle cx="22" cy="32" r="2" fill="${rust}" opacity="0.6"/>
      <circle cx="48" cy="32" r="2" fill="${rust}" opacity="0.6"/>
    </svg>`;

    case 'wheelchair': return `<svg class="pt-v-wheelchair" width="${s}" height="${s * 0.8}" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="36" r="8" fill="none" stroke="${ink}" stroke-width="2"/>
      <circle cx="44" cy="38" r="5" fill="none" stroke="${ink}" stroke-width="2"/>
      <rect x="14" y="20" width="22" height="14" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/>
      <line x1="16" y1="20" x2="16" y2="12" stroke="${ink}" stroke-width="2"/>
      <rect x="38" y="26" width="16" height="8" rx="2" fill="${rust}" stroke="${ink}" stroke-width="1.5"/>
      <ellipse cx="56" cy="30" rx="3" ry="4" fill="${mustard}" opacity="0.8"/>
      <ellipse cx="56" cy="30" rx="2" ry="3" fill="${rust}" opacity="0.6"/>
      <circle cx="22" cy="24" r="3" fill="${teal}" opacity="0.5"/>
    </svg>`;

    case 'helicopter': return `<svg class="pt-v-helicopter" width="${s}" height="${s * 0.7}" viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="30" rx="18" ry="10" fill="${ink}" stroke="${ink}" stroke-width="2"/>
      <rect x="10" y="28" width="8" height="3" rx="1" fill="${teal}" opacity="0.6"/>
      <rect x="42" y="26" width="20" height="4" rx="1" fill="${ink}" stroke="${ink}" stroke-width="1"/>
      <path d="M60 24 L66 18 L68 22 L62 28 Z" fill="${rust}" stroke="${ink}" stroke-width="1"/>
      <line class="pt-rotor-spin" x1="10" y1="18" x2="50" y2="18" stroke="${ink}" stroke-width="2.5"/>
      <line x1="30" y1="20" x2="30" y2="18" stroke="${ink}" stroke-width="2"/>
      <rect x="22" y="24" width="12" height="8" rx="1" fill="${teal}" opacity="0.4"/>
      <line x1="22" y1="40" x2="18" y2="46" stroke="${ink}" stroke-width="1.5"/>
      <line x1="38" y1="40" x2="42" y2="46" stroke="${ink}" stroke-width="1.5"/>
      <line x1="16" y1="46" x2="44" y2="46" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;

    case 'gokart': return `<svg class="pt-v-gokart" width="${s}" height="${s * 0.5}" viewBox="0 0 70 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="10" width="46" height="14" rx="3" fill="${ink}" stroke="${ink}" stroke-width="2"/>
      <rect x="18" y="6" width="20" height="8" rx="2" fill="${rust}" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="16" cy="26" r="5" fill="none" stroke="${ink}" stroke-width="2.5"/>
      <circle cx="54" cy="26" r="5" fill="none" stroke="${ink}" stroke-width="2.5"/>
      <rect x="54" y="8" width="6" height="4" rx="1" fill="${mustard}"/>
      <line x1="28" y1="12" x2="28" y2="6" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="28" cy="5" r="2" fill="${teal}" opacity="0.6"/>
    </svg>`;

    case 'zipline': return `<svg class="pt-v-zipline" width="${s}" height="${s * 0.8}" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="8" x2="60" y2="8" stroke="${ink}" stroke-width="3"/>
      <rect x="22" y="10" width="16" height="8" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="26" cy="10" r="3" fill="${rust}"/>
      <circle cx="34" cy="10" r="3" fill="${rust}"/>
      <line x1="26" y1="18" x2="24" y2="28" stroke="${ink}" stroke-width="2"/>
      <line x1="34" y1="18" x2="36" y2="28" stroke="${ink}" stroke-width="2"/>
      <rect x="20" y="28" width="20" height="10" rx="2" fill="${teal}" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="26" cy="33" r="2" fill="${mustard}"/>
      <circle cx="34" cy="33" r="2" fill="${mustard}"/>
      <line x1="24" y1="38" x2="22" y2="44" stroke="${ink}" stroke-width="1.5"/>
      <line x1="36" y1="38" x2="38" y2="44" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;

    default: return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="none" stroke="${ink}" stroke-width="2"/><text x="20" y="25" text-anchor="middle" font-size="14" fill="${ink}">?</text></svg>`;
  }
}

// ═══════════════════════════════════════════════════════���══════
// VP — HELPER SVGs
// ════════════════════════════════════════════��═════════════════

function _seaVesselIcon(vesselId, size = 80) {
  const s = size;
  const ink = '#1b2436';
  const teal = '#2a6f7c';
  const rust = '#c44a23';
  const mustard = '#d4a017';
  const wave = '#4a9bb5';

  switch (vesselId) {
    case 'ferry': return `<svg width="${s * 1.5}" height="${s * 0.7}" viewBox="0 0 90 42" fill="none"><path d="M8 28 L14 12 L76 12 L82 28 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><rect x="20" y="4" width="50" height="10" rx="2" fill="${teal}" stroke="${ink}" stroke-width="1.5"/><rect x="26" y="6" width="8" height="6" rx="1" fill="white" opacity="0.3"/><rect x="38" y="6" width="8" height="6" rx="1" fill="white" opacity="0.3"/><rect x="50" y="6" width="8" height="6" rx="1" fill="white" opacity="0.3"/><rect x="32" y="14" width="26" height="8" rx="1" fill="${rust}" opacity="0.5"/><path d="M4 32 Q20 24, 45 30 Q70 36, 86 28" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/><circle cx="16" cy="20" r="3" fill="${mustard}" opacity="0.6"/><circle cx="74" cy="20" r="3" fill="${mustard}" opacity="0.6"/></svg>`;
    case 'barge': return `<svg width="${s * 1.4}" height="${s * 0.7}" viewBox="0 0 84 42" fill="none"><rect x="8" y="14" width="68" height="18" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><rect x="14" y="8" width="20" height="8" rx="1" fill="${teal}" stroke="${ink}" stroke-width="1"/><rect x="18" y="10" width="6" height="4" rx="1" fill="white" opacity="0.3"/><rect x="38" y="16" width="12" height="14" fill="none" stroke="${mustard}" stroke-width="1.5" stroke-dasharray="3 2"/><rect x="54" y="16" width="12" height="14" fill="none" stroke="${mustard}" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="18" cy="22" r="2" fill="${rust}" opacity="0.5"/><path d="M4 36 Q22 28, 42 34 Q62 40, 80 32" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'swimmer': return `<svg width="${s}" height="${s * 0.7}" viewBox="0 0 60 42" fill="none"><ellipse cx="30" cy="22" rx="16" ry="8" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><path d="M44 16 Q50 10, 48 6 Q46 2, 42 4 Q40 8, 42 14" fill="${ink}"/><circle cx="46" cy="6" r="1.5" fill="white"/><line x1="16" y1="28" x2="14" y2="36" stroke="${ink}" stroke-width="2"/><line x1="22" y1="28" x2="20" y2="36" stroke="${ink}" stroke-width="2"/><line x1="38" y1="28" x2="40" y2="36" stroke="${ink}" stroke-width="2"/><line x1="44" y1="28" x2="46" y2="36" stroke="${ink}" stroke-width="2"/><path d="M2 30 Q14 24, 30 28 Q46 32, 58 26" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'jetski': return `<svg width="${s * 1.2}" height="${s * 0.6}" viewBox="0 0 72 36" fill="none"><path d="M12 22 Q8 18, 14 14 L52 10 Q60 8, 62 14 L60 22 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><rect x="26" y="6" width="18" height="8" rx="2" fill="${rust}" stroke="${ink}" stroke-width="1"/><line x1="58" y1="16" x2="66" y2="12" stroke="${ink}" stroke-width="2"/><path d="M6 28 Q18 20, 36 24 Q54 28, 68 22" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/><path d="M60 22 Q66 20, 70 26" stroke="white" stroke-width="1.5" opacity="0.4"/></svg>`;
    case 'sailboat': return `<svg width="${s}" height="${s * 1.2}" viewBox="0 0 60 72" fill="none"><path d="M10 48 L16 32 L44 32 L50 48 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><line x1="30" y1="48" x2="30" y2="8" stroke="${ink}" stroke-width="2"/><path d="M30 8 L48 30 L30 32 Z" fill="${mustard}" stroke="${ink}" stroke-width="1"/><path d="M30 12 L18 30 L30 32 Z" fill="${rust}" stroke="${ink}" stroke-width="1" opacity="0.7"/><rect x="22" y="36" width="16" height="8" rx="1" fill="${teal}" opacity="0.4"/><path d="M6 56 Q18 48, 30 52 Q42 56, 54 50" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'hovercraft': return `<svg width="${s * 1.2}" height="${s * 0.7}" viewBox="0 0 72 42" fill="none"><ellipse cx="36" cy="24" rx="28" ry="10" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><rect x="20" y="12" width="32" height="10" rx="3" fill="${teal}" stroke="${ink}" stroke-width="1.5"/><rect x="26" y="14" width="8" height="6" rx="1" fill="white" opacity="0.3"/><rect x="38" y="14" width="8" height="6" rx="1" fill="white" opacity="0.3"/><ellipse cx="36" cy="34" rx="20" ry="4" fill="${wave}" opacity="0.3"/><path d="M16 34 Q26 30, 36 34 Q46 38, 56 34" stroke="white" stroke-width="1" opacity="0.4"/><ellipse cx="56" cy="18" rx="4" ry="5" fill="${mustard}" opacity="0.6"/></svg>`;
    case 'scrapraft': return `<svg width="${s * 1.2}" height="${s * 0.7}" viewBox="0 0 72 42" fill="none"><rect x="10" y="20" width="52" height="10" rx="1" fill="${ink}" stroke="${ink}" stroke-width="1.5" transform="rotate(-2 36 25)"/><line x1="16" y1="20" x2="16" y2="30" stroke="${mustard}" stroke-width="1.5"/><line x1="28" y1="20" x2="28" y2="30" stroke="${mustard}" stroke-width="1.5"/><line x1="44" y1="20" x2="44" y2="30" stroke="${mustard}" stroke-width="1.5"/><line x1="56" y1="20" x2="56" y2="30" stroke="${mustard}" stroke-width="1.5"/><rect x="30" y="12" width="12" height="10" rx="1" fill="${rust}" opacity="0.5" stroke="${ink}" stroke-width="1"/><path d="M6 36 Q18 28, 36 32 Q54 36, 66 30" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'paddleboat': return `<svg width="${s * 1.2}" height="${s * 0.7}" viewBox="0 0 72 42" fill="none"><path d="M14 26 Q10 22, 16 18 L56 18 Q62 22, 58 26 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><rect x="24" y="10" width="24" height="10" rx="2" fill="${teal}" stroke="${ink}" stroke-width="1"/><circle cx="18" cy="28" r="6" fill="none" stroke="${ink}" stroke-width="1.5"/><line x1="18" y1="22" x2="18" y2="28" stroke="${ink}" stroke-width="1"/><circle cx="54" cy="28" r="6" fill="none" stroke="${ink}" stroke-width="1.5"/><line x1="54" y1="22" x2="54" y2="28" stroke="${ink}" stroke-width="1"/><path d="M8 36 Q20 30, 36 34 Q52 38, 64 32" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'parasail': return `<svg width="${s}" height="${s * 1.3}" viewBox="0 0 60 78" fill="none"><path d="M10 20 Q30 2, 50 20" fill="${rust}" stroke="${ink}" stroke-width="1.5"/><line x1="12" y1="20" x2="26" y2="50" stroke="${ink}" stroke-width="1.5"/><line x1="48" y1="20" x2="34" y2="50" stroke="${ink}" stroke-width="1.5"/><path d="M22 54 L38 54 L36 62 L24 62 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><path d="M18 66 Q30 60, 42 66" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'driftwood': return `<svg width="${s * 1.2}" height="${s * 0.6}" viewBox="0 0 72 36" fill="none"><path d="M8 18 Q12 14, 20 16 L52 14 Q60 12, 64 18 L62 24 Q58 28, 50 26 L22 28 Q14 30, 10 24 Z" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><line x1="18" y1="16" x2="18" y2="26" stroke="${mustard}" stroke-width="1.5" opacity="0.6"/><line x1="36" y1="14" x2="36" y2="28" stroke="${mustard}" stroke-width="1.5" opacity="0.6"/><line x1="52" y1="16" x2="52" y2="24" stroke="${mustard}" stroke-width="1.5" opacity="0.6"/><path d="M4 30 Q18 24, 36 28 Q54 32, 68 26" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
    case 'balloon': return `<svg width="${s}" height="${s * 1.4}" viewBox="0 0 60 84" fill="none"><ellipse cx="30" cy="28" rx="18" ry="24" fill="${rust}" stroke="${ink}" stroke-width="2"/><line x1="24" y1="50" x2="22" y2="64" stroke="${ink}" stroke-width="1.5"/><line x1="36" y1="50" x2="38" y2="64" stroke="${ink}" stroke-width="1.5"/><rect x="20" y="64" width="20" height="12" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><circle cx="26" cy="70" r="3" fill="${teal}"/><circle cx="34" cy="70" r="3" fill="${teal}"/><path d="M6 78 Q18 72, 30 76 Q42 80, 54 74" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/><ellipse cx="30" cy="54" rx="4" ry="6" fill="${mustard}" opacity="0.9"/></svg>`;
    default: return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><rect x="4" y="16" width="32" height="12" rx="2" fill="${ink}" stroke="${ink}" stroke-width="1.5"/><path d="M4 32 Q12 26, 20 30 Q28 34, 36 28" stroke="${wave}" stroke-width="2" fill="none" opacity="0.5"/></svg>`;
  }
}

function _compassSvg() {
  return `<svg class="pt-compass" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" stroke="#1b2436" stroke-width="1.5" opacity="0.6"/>
    <polygon points="30,4 33,28 30,32 27,28" fill="#c44a23" opacity="0.8"/>
    <polygon points="30,56 27,32 30,28 33,32" fill="#1b2436" opacity="0.6"/>
    <circle cx="30" cy="30" r="3" fill="#1b2436"/>
  </svg>`;
}

function _mesaSvg() {
  return `<svg style="position:absolute;bottom:0;left:0;width:100%;height:100px;z-index:2;pointer-events:none;opacity:0.8" viewBox="0 0 1100 100" preserveAspectRatio="none" fill="none">
    <path d="M0 100 L0 70 Q50 65, 100 68 L150 60 Q200 55, 250 58 L300 50 Q320 45, 340 48 L380 52 Q420 46, 450 50 L500 54 Q550 48, 600 52 L700 46 Q750 40, 800 44 L850 48 Q900 42, 950 46 L1000 50 Q1050 46, 1100 48 L1100 100 Z" fill="#1b2436" opacity="0.15"/>
    <path d="M0 100 L0 80 Q100 74, 200 78 L300 72 Q400 66, 500 70 L600 74 Q700 68, 800 72 L900 76 Q1000 70, 1100 74 L1100 100 Z" fill="#1b2436" opacity="0.1"/>
  </svg>`;
}

// ═══════════════════════════════════════════════════════��══════
// VP — SIDEBAR BUILDER
// ══════════════════════════════════════════════════════════════
function _buildSidebarContent(screenKey, ep) {
  if (!window._tvState) return '';
  const cd = ep?.challengeData;
  if (!cd) return '';

  const state = window._tvState[screenKey];
  const idx = state?.idx ?? -1;
  const phase = screenKey.replace('pt-', '');

  // Determine current phase for progress dots
  const phases = ['scavenge', 'land', 'sea', 'beach', 'results'];
  const currentPhaseIdx = phases.indexOf(phase);

  const phaseName = phase === 'scavenge' ? 'WRECKAGE DRAFT' : phase === 'land' ? 'LAND RACE' : phase === 'sea' ? 'SEA CROSSING' : phase === 'beach' ? 'BEACH SPRINT' : 'RESULTS';

  let html = `<div class="pt-sb-header"><span>RACE STATUS</span><span class="pt-sb-phase">${phaseName}</span></div>`;

  // Scavenge phase: vehicles remaining + draft board
  if (phase === 'scavenge') {
    // Determine which draft picks have been revealed so far
    const revealedPicks = cd.scavengeEvents
      .slice(0, Math.max(0, idx + 1))
      .filter(e => e.eventType === 'draftPick');

    const claimedVehicles = {};
    for (const p of revealedPicks) {
      claimedVehicles[p.vehicleId] = p.player;
    }

    // Vehicles remaining
    html += `<div class="pt-sb-section"><div class="pt-sb-section-title">VEHICLES REMAINING</div>`;
    for (const vid of VEHICLE_IDS) {
      const v = VEHICLES[vid];
      const claimed = claimedVehicles[vid];
      html += `<div class="pt-sb-veh ${claimed ? 'claimed' : ''}">
        <span class="pt-sb-veh-name">${v.label}</span>
        ${claimed ? `<span class="pt-sb-veh-claimer">${claimed.split(' ')[0]}</span>` : ''}
      </div>`;
    }
    html += `</div>`;

    // Draft board
    if (revealedPicks.length > 0) {
      html += `<div class="pt-sb-section"><div class="pt-sb-section-title">DRAFT BOARD</div>`;
      for (const p of revealedPicks) {
        html += `<div class="pt-sb-row">
          <span class="pt-sb-pos">${p.draftPos}</span>
          ${portrait(p.player, 20)}
          <span class="pt-sb-name">${p.player.split(' ')[0]}</span>
        </div>`;
      }
      html += `</div>`;
    }
  } else {
    // Non-scavenge phases: leaderboard with portraits, vehicles, HP, times, deltas
    let leaderboard = [];
    const ranking = cd.finalRanking || [];
    const assigns = cd.assignments || {};
    const seaVessels = cd.seaVessels || {};
    const isSea = phase === 'sea' || phase === 'beach' || phase === 'results';

    // Build live HP from hpSnapshot on revealed events
    const liveHp = {};
    if (isSea) {
      for (const n of ranking) { liveHp[n] = seaVessels[n]?.seaHp ?? 1; }
    } else {
      for (const n of ranking) { liveHp[n] = assigns[n]?.maxHp ?? 3; }
    }
    let revealedEvents = [];
    if (phase === 'land' && cd.landEvents) revealedEvents = cd.landEvents.slice(0, Math.max(0, idx + 1));
    else if (phase === 'sea' && cd.seaEvents) revealedEvents = cd.seaEvents.slice(0, Math.max(0, idx + 1));
    else if (phase === 'beach' && cd.beachEvents) revealedEvents = cd.beachEvents.slice(0, Math.max(0, idx + 1));
    for (const ev of revealedEvents) {
      if (ev.hpSnapshot) { for (const [n, hp] of Object.entries(ev.hpSnapshot)) { liveHp[n] = hp; } }
    }
    // For completed phases, carry forward damage
    if (phase === 'land') {
      // no prior phases
    } else if (phase === 'sea') {
      // Sea phase: HP is fresh from sea vessel, updated by sea events only
    } else if (phase === 'beach' || phase === 'results') {
      for (const ev of (cd.seaEvents || [])) { if (ev.hpSnapshot) { for (const [n, hp] of Object.entries(ev.hpSnapshot)) { liveHp[n] = Math.min(liveHp[n] ?? 99, hp); } } }
    }

    const getHp = (n) => phase === 'results' ? (assigns[n]?.finalHp ?? 0) : (liveHp[n] ?? (isSea ? (seaVessels[n]?.seaHp ?? 1) : (assigns[n]?.maxHp ?? 3)));
    const getMaxHp = (n) => isSea ? (seaVessels[n]?.seaHp ?? 1) : (assigns[n]?.maxHp ?? 3);
    const getVehLabel = (n) => isSea ? (seaVessels[n]?.seaLabel || 'Driftwood Raft') : (VEHICLES[assigns[n]?.vehicleId]?.label || assigns[n]?.vehicleLabel || '?');
    const getQuality = (n) => isSea ? (seaVessels[n]?.quality || '') : '';

    // Build live times from timeSnapshot on revealed events (progressive, not final)
    let liveTimes = null;
    for (let i = revealedEvents.length - 1; i >= 0; i--) {
      if (revealedEvents[i].timeSnapshot) { liveTimes = revealedEvents[i].timeSnapshot; break; }
    }
    // For completed prior phases, accumulate their final times as baseline
    let priorBaseline = {};
    if (phase === 'sea' || phase === 'beach' || phase === 'results') {
      for (const n of ranking) priorBaseline[n] = cd.landTimes?.[n] || 0;
    }
    if (phase === 'beach' || phase === 'results') {
      for (const n of ranking) priorBaseline[n] = (priorBaseline[n] || 0) + (cd.seaTimes?.[n] || 0);
    }

    const getTime = (n) => {
      if (phase === 'results') return cd.totalTime?.[n]?.toFixed(1);
      if (!liveTimes) return null; // no reveals yet — hide times
      if (phase === 'beach') return liveTimes[n]?.toFixed(1); // beach totalTime is cumulative already
      if (phase === 'sea') return ((priorBaseline[n] || 0) + (liveTimes[n] || 0)).toFixed(1);
      return liveTimes[n]?.toFixed(1); // land
    };

    if (phase === 'results') {
      leaderboard = ranking.map((n, i) => ({ name: n, time: getTime(n), pos: i + 1, hp: getHp(n), maxHp: getMaxHp(n), veh: getVehLabel(n), quality: getQuality(n) }));
    } else if (liveTimes) {
      let sortTimes = {};
      for (const n of ranking) {
        if (phase === 'sea') sortTimes[n] = (priorBaseline[n] || 0) + (liveTimes[n] || 0);
        else if (phase === 'beach') sortTimes[n] = liveTimes[n] || 0;
        else sortTimes[n] = liveTimes[n] || 0;
      }
      const sorted = [...ranking].sort((a, b) => sortTimes[a] - sortTimes[b]);
      leaderboard = sorted.map((n, i) => ({ name: n, time: getTime(n), pos: i + 1, hp: getHp(n), maxHp: getMaxHp(n), veh: getVehLabel(n), quality: getQuality(n) }));
    } else {
      leaderboard = (cd.draftOrder || []).map((n, i) => ({ name: n, time: null, pos: i + 1, hp: getHp(n), maxHp: getMaxHp(n), veh: getVehLabel(n), quality: getQuality(n) }));
    }

    // Compute position deltas (compare to draft order)
    const draftPositions = {};
    (cd.draftOrder || []).forEach((n, i) => { draftPositions[n] = i + 1; });

    html += `<div class="pt-sb-section"><div class="pt-sb-section-title">STANDINGS</div>`;
    for (const entry of leaderboard) {
      const hpBars = [];
      for (let h = 0; h < entry.maxHp; h++) {
        const cls = h < entry.hp ? (entry.hp <= 1 ? 'low' : '') : 'empty';
        hpBars.push(`<div class="pt-sb-hp-bar ${cls}"></div>`);
      }
      const draftPos = draftPositions[entry.name] || entry.pos;
      const delta = draftPos - entry.pos;
      const arrowHtml = delta > 0 ? `<span class="pt-sb-arrow up">&#9650;${delta}</span>`
        : delta < 0 ? `<span class="pt-sb-arrow down">&#9660;${Math.abs(delta)}</span>`
        : `<span class="pt-sb-arrow flat">&mdash;</span>`;
      const hpColor = entry.hp <= 0 ? 'var(--pt-crimson)' : entry.hp <= 1 ? 'var(--pt-rust)' : 'var(--pt-sage)';
      const hpText = entry.hp <= 0 ? 'WRECKED' : `${entry.hp}/${entry.maxHp}`;
      const qualColors = { pristine: 'var(--pt-sage)', solid: 'var(--pt-teal)', patched: 'var(--pt-mustard)', battered: 'var(--pt-rust)', wrecked: 'var(--pt-crimson)', scrap: 'var(--pt-rust)' };
      const qualBadge = entry.quality ? `<span class="pt-sb-quality" style="color:${qualColors[entry.quality] || 'var(--pt-ink)'}">${entry.quality.toUpperCase()}</span>` : '';
      html += `<div class="pt-sb-row">
        <span class="pt-sb-pos">${entry.pos}</span>
        ${portrait(entry.name, 22)}
        <div class="pt-sb-detail">
          <span class="pt-sb-name">${entry.name.split(' ')[0]}</span>
          <span class="pt-sb-veh-label">${entry.veh}</span>${qualBadge}
        </div>
        <div class="pt-sb-hp-wrap">
          <span class="pt-sb-hp">${hpBars.join('')}</span>
          <span class="pt-sb-hp-label" style="color:${hpColor}">${hpText}</span>
        </div>
        ${entry.time ? `<span class="pt-sb-time">${entry.time}s</span>` : ''}
        ${arrowHtml}
      </div>`;
    }
    html += `</div>`;

    // Race stats
    let events = [];
    if (phase === 'land' && cd.landEvents) events = cd.landEvents.slice(0, Math.max(0, idx + 1));
    else if (phase === 'sea' && cd.seaEvents) events = cd.seaEvents.slice(0, Math.max(0, idx + 1));
    else if (phase === 'beach' && cd.beachEvents) events = cd.beachEvents.slice(0, Math.max(0, idx + 1));

    if (events.length > 0) {
      const overtakes = events.filter(e => e.type === 'overtake' || e.type === 'lead-change').length;
      const sabotages = events.filter(e => e.type === 'sabotage' || e.type === 'ram' || e.type === 'tackle' || e.type === 'trash-talk').length;
      const hazards = events.filter(e => e.type === 'terrain' || e.type === 'storm' || e.type === 'mine' || e.type === 'collapse').length;
      const destroyed = events.filter(e => e.type === 'destroy').length;

      html += `<div class="pt-sb-section"><div class="pt-sb-section-title">RACE STATS</div>`;
      html += `<div class="pt-sb-stat-row"><span>OVERTAKES</span><span class="pt-sb-stat-val">${overtakes}</span></div>`;
      html += `<div class="pt-sb-stat-row"><span>ATTACKS</span><span class="pt-sb-stat-val">${sabotages}</span></div>`;
      html += `<div class="pt-sb-stat-row"><span>HAZARDS</span><span class="pt-sb-stat-val">${hazards}</span></div>`;
      if (destroyed > 0) html += `<div class="pt-sb-stat-row"><span>DESTROYED</span><span class="pt-sb-stat-val" style="color:var(--pt-crimson)">${destroyed}</span></div>`;
      html += `</div>`;
    }

    // Recent events (last 3)
    let recentEvents = [];
    if (phase === 'land' && cd.landEvents) {
      recentEvents = cd.landEvents.slice(0, Math.min(idx + 1, cd.landEvents.length)).filter(e => e.type !== 'standings').slice(-3);
    } else if (phase === 'sea' && cd.seaEvents) {
      recentEvents = cd.seaEvents.slice(0, Math.min(idx + 1, cd.seaEvents.length)).filter(e => e.type !== 'standings').slice(-3);
    } else if (phase === 'beach' && cd.beachEvents) {
      recentEvents = cd.beachEvents.slice(0, Math.min(idx + 1, cd.beachEvents.length)).filter(e => e.type !== 'standings').slice(-3);
    }

    if (recentEvents.length) {
      html += `<div class="pt-sb-section"><div class="pt-sb-section-title">RECENT</div>`;
      for (const ev of recentEvents) {
        const typeLabel = ev.type === 'sabotage' || ev.type === 'ram' ? 'SABOTAGE' : ev.type === 'terrain' || ev.type === 'storm' ? 'HAZARD' : ev.type === 'alliance' || ev.type === 'rescue' ? 'ALLIANCE' : ev.type === 'destroy' ? 'DESTROYED' : ev.type === 'boost' || ev.type === 'current' ? 'BOOST' : ev.type === 'mine' ? 'MINE' : ev.type === 'duel' ? 'DUEL' : ev.type === 'lead-change' ? 'LEAD' : ev.type === 'overtake' ? 'OVERTAKE' : ev.type === 'tackle' ? 'TACKLE' : ev.type === 'surge' ? 'SURGE' : ev.type === 'heli-commentary' ? 'AERIAL' : 'EVENT';
        html += `<div class="pt-sb-event"><span class="pt-ev-type">${typeLabel}</span>${portrait(ev.player, 16)}<strong>${ev.player || ''}</strong></div>`;
      }
      html += `</div>`;
    }
  }

  // Progress dots
  html += `<div class="pt-sb-section"><div class="pt-sb-section-title">PROGRESS</div><div class="pt-sb-progress">`;
  phases.forEach((p, i) => {
    const cls = i < currentPhaseIdx ? 'done' : i === currentPhaseIdx ? 'active' : '';
    html += `<div class="pt-sb-pip ${cls}"></div>`;
  });
  html += `</div></div>`;

  return html;
}

// ═════════════════════��════════════════════════════════════════
// VP — REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
const _tvState = {};

function _initState(key, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1, total };
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`pt-step-${suffix}-${i}`);
    if (el) { el.classList.add('pt-step-visible'); el.classList.remove('pt-step-hidden'); el.style.display = ''; }
  }
  const counter = document.getElementById(`pt-counter-${suffix}`);
  if (counter) counter.textContent = `${upToIdx + 1} / ${total}`;
  if (upToIdx >= total - 1) {
    const btn = document.getElementById(`pt-controls-${suffix}`);
    if (btn) btn.style.opacity = '0.4';
  }
}

function _updateSidebar(screenKey) {
  const sideEl = document.getElementById('pt-sidebar-inner');
  if (!sideEl) return;
  const epNum = window.vpEpNum;
  let ep = gs.episodeHistory[epNum - 1];
  if (!ep) return;
  if (ep.planesTrains && !ep.challengeData) ep = Object.assign({}, ep, { challengeData: ep.planesTrains });
  sideEl.innerHTML = _buildSidebarContent(screenKey, ep);
}

function _updateLandMap(screenKey) {
  const mapEl = document.getElementById('pt-land-map');
  if (!mapEl) return;
  const epNum = window.vpEpNum;
  let ep = gs.episodeHistory[epNum - 1];
  if (!ep) return;
  if (ep.planesTrains && !ep.challengeData) ep = Object.assign({}, ep, { challengeData: ep.planesTrains });
  const cd = ep.challengeData;
  if (!cd) return;

  const state = window._tvState?.[screenKey];
  const idx = state?.idx ?? -1;
  const events = cd.landEvents || [];
  const snapshots = cd.landTimeSnapshots || [];
  const racers = cd.finalRanking || [];

  // Determine which segment the last revealed event belongs to
  let maxSegRevealed = -1;
  let segEventCount = {};
  for (let i = 0; i <= Math.min(idx, events.length - 1); i++) {
    const seg = events[i].segment || 0;
    if (seg <= 3) {
      maxSegRevealed = Math.max(maxSegRevealed, seg);
      segEventCount[seg] = (segEventCount[seg] || 0) + 1;
    }
  }

  // Estimate fractional progress within the segment
  const totalEventsInSeg = events.filter(e => (e.segment || 0) === maxSegRevealed && e.type !== 'standings').length;
  const revealedInSeg = segEventCount[maxSegRevealed] || 0;
  const segFrac = totalEventsInSeg > 0 ? revealedInSeg / totalEventsInSeg : 0;

  // Use snapshot data for accurate positioning
  // Position = completed segments + fraction of current segment
  const TOTAL_SEGS = 4;
  const routeStartX = 5;
  const routeEndX = 92;

  // Sort racers by current time for rank-based vertical stagger
  const snapIdx = Math.min(maxSegRevealed, snapshots.length - 1);
  const snap = snapIdx >= 0 ? snapshots[snapIdx] : null;
  const racerTimes = racers.map(name => {
    const t = snap ? (snap[name] || 0) : 0;
    return { name, time: t };
  }).sort((a, b) => a.time - b.time);
  const rankMap = {};
  racerTimes.forEach((r, i) => { rankMap[r.name] = i; });

  let heliIdx = 0;
  for (const name of racers) {
    const marker = document.getElementById(`pt-map-racer-${name.replace(/\s+/g, '-')}`);
    if (!marker) continue;

    const assign = cd.assignments?.[name];
    if (assign?.vehicleId === 'helicopter') {
      marker.style.left = `${routeEndX}%`;
      marker.style.bottom = `${75 - heliIdx * 15}%`;
      marker.style.opacity = idx >= 0 ? '1' : '0.3';
      heliIdx++;
      continue;
    }

    // Stagger vertically by rank so close racers don't overlap
    const rank = rankMap[name] || 0;
    marker.style.bottom = `${15 + (rank % 7) * 10}%`;

    if (idx < 0) {
      marker.style.left = `${routeStartX}%`;
      marker.style.opacity = '0.3';
      continue;
    }

    marker.style.opacity = '1';

    if (snap) {
      const times = Object.values(snap).filter(t => t > 0);
      if (times.length === 0) { marker.style.left = `${routeStartX}%`; continue; }
      const bestTime = Math.min(...times);
      const worstTime = Math.max(...times);
      const playerTime = snap[name] || 0;

      const range = worstTime - bestTime;
      const norm = range > 0 ? (playerTime - bestTime) / range : 0.5;

      // Leader position based on segment progress
      const baseProgress = (maxSegRevealed + segFrac) / TOTAL_SEGS;
      // Spread grows as race progresses: 20% early → 45% late
      const spread = 0.20 + baseProgress * 0.25;
      // Leader at front edge, slowest trails behind
      const leaderPos = Math.min(baseProgress + spread * 0.15, 0.98);
      const progress = Math.max(0.02, leaderPos - spread * norm);

      const xPos = routeStartX + progress * (routeEndX - routeStartX);
      marker.style.left = `${xPos}%`;
    } else {
      marker.style.left = `${routeStartX}%`;
    }
  }

  // Update segment indicator pips
  for (let s = 0; s < TOTAL_SEGS; s++) {
    const pip = document.getElementById(`pt-map-seg-${s}`);
    if (pip) {
      pip.classList.toggle('active', s === maxSegRevealed);
      pip.classList.toggle('done', s < maxSegRevealed);
    }
  }
}

function _updateSeaMap(screenKey) {
  const mapEl = document.getElementById('pt-sea-map');
  if (!mapEl) return;
  const epNum = window.vpEpNum;
  let ep = gs.episodeHistory[epNum - 1];
  if (!ep) return;
  if (ep.planesTrains && !ep.challengeData) ep = Object.assign({}, ep, { challengeData: ep.planesTrains });
  const cd = ep.challengeData;
  if (!cd) return;

  const state = window._tvState?.[screenKey];
  const idx = state?.idx ?? -1;
  const events = cd.seaEvents || [];
  const racers = cd.finalRanking || [];
  const TOTAL_SEGS = 3;
  const routeStartX = 6;
  const routeEndX = 92;

  let maxSegRevealed = -1;
  let segEventCount = {};
  for (let i = 0; i <= Math.min(idx, events.length - 1); i++) {
    const seg = events[i].segment || 0;
    if (seg < TOTAL_SEGS) {
      maxSegRevealed = Math.max(maxSegRevealed, seg);
      segEventCount[seg] = (segEventCount[seg] || 0) + 1;
    }
  }

  const totalEventsInSeg = events.filter(e => (e.segment || 0) === maxSegRevealed && e.type !== 'standings' && e.type !== 'finish' && e.type !== 'host-transition').length;
  const revealedInSeg = segEventCount[maxSegRevealed] || 0;
  const segFrac = totalEventsInSeg > 0 ? revealedInSeg / totalEventsInSeg : 0;

  // Get latest timeSnapshot from revealed events
  let latestSnap = null;
  for (let i = Math.min(idx, events.length - 1); i >= 0; i--) {
    if (events[i].timeSnapshot) { latestSnap = events[i].timeSnapshot; break; }
  }

  const racerTimes = racers.map(name => ({ name, time: latestSnap ? (latestSnap[name] || 0) : 0 })).sort((a, b) => a.time - b.time);
  const rankMap = {};
  racerTimes.forEach((r, i) => { rankMap[r.name] = i; });

  for (const name of racers) {
    const marker = document.getElementById(`pt-sea-racer-${name.replace(/\s+/g, '-')}`);
    if (!marker) continue;

    const rank = rankMap[name] || 0;
    const yBase = 18 + (rank % (racers.length)) * Math.min(10, 60 / racers.length);
    marker.style.bottom = `${yBase}%`;

    if (idx < 0) {
      marker.style.left = `${routeStartX}%`;
      marker.style.opacity = '0.3';
      continue;
    }

    marker.style.opacity = '1';

    if (latestSnap) {
      const times = Object.values(latestSnap).filter(t => t > 0);
      if (times.length === 0) { marker.style.left = `${routeStartX}%`; continue; }
      const bestTime = Math.min(...times);
      const worstTime = Math.max(...times);
      const range = worstTime - bestTime;
      const norm = range > 0 ? ((latestSnap[name] || 0) - bestTime) / range : 0.5;

      const baseProgress = (maxSegRevealed + segFrac) / TOTAL_SEGS;
      const spread = 0.18 + baseProgress * 0.30;
      const leaderPos = Math.min(baseProgress + spread * 0.15, 0.96);
      const progress = Math.max(0.02, leaderPos - spread * norm);

      const xPos = routeStartX + progress * (routeEndX - routeStartX);
      marker.style.left = `${xPos}%`;
    } else {
      const baseProg = (maxSegRevealed + segFrac) / TOTAL_SEGS;
      const xPos = routeStartX + Math.max(0.05, baseProg * 0.4) * (routeEndX - routeStartX);
      marker.style.left = `${xPos}%`;
    }
  }

  // Update segment pips
  for (let s = 0; s < TOTAL_SEGS; s++) {
    const pip = document.getElementById(`pt-sea-seg-${s}`);
    if (pip) {
      pip.classList.toggle('active', s === maxSegRevealed);
      pip.classList.toggle('done', s < maxSegRevealed);
    }
  }

  // Check if any finish events are revealed — update beach marker
  const finishRevealed = events.slice(0, Math.max(0, idx + 1)).some(e => e.type === 'finish');
  const beachPin = document.getElementById('pt-sea-beach-pin');
  if (beachPin) beachPin.style.animation = finishRevealed ? 'pt-mine-pulse 1s ease-in-out infinite' : 'pt-mine-pulse 2s ease-in-out infinite';
}

export function ptRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1, total: totalSteps };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('pt-', '');
  _reapplyVisibility(suffix, state.idx, totalSteps);
  const el = document.getElementById(`pt-step-${suffix}-${state.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _updateSidebar(screenKey);
  if (screenKey === 'pt-land') _updateLandMap(screenKey);
  if (screenKey === 'pt-sea') _updateSeaMap(screenKey);
}

export function ptRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1, total: totalSteps };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('pt-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`pt-step-${suffix}-${i}`);
    if (el) { el.classList.add('pt-step-visible'); el.classList.remove('pt-step-hidden'); el.style.display = ''; }
  }
  state.idx = totalSteps - 1;
  _reapplyVisibility(suffix, state.idx, totalSteps);
  _updateSidebar(screenKey);
  if (screenKey === 'pt-land') _updateLandMap(screenKey);
  if (screenKey === 'pt-sea') _updateSeaMap(screenKey);
}

// ══════════════════════════════════════════════════════════════
// VP — SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _shell(content, ep, phaseCls = '') {
  return `<div class="pt-dossier ${phaseCls}">
    ${_css()}
    ${content}
  </div>`;
}

// ═══════════════════════��══════════════════════════════════════
// VP — SCREEN 1: TITLE CARD
// ════════════════════════════════════════════════���═════════════
export function rpBuildPTTitleCard(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const epNum = window.vpEpNum || (gs.episodeHistory?.length || 1);

  return _shell(`
    <div class="pt-telegram">
      <div class="pt-tg-cell"><span class="pt-tg-label">Dossier No.</span><span class="pt-tg-value">PT-${epNum}</span></div>
      <div class="pt-tg-cell"><span class="pt-tg-label">Classification</span><span class="pt-tg-value">INDIVIDUAL IMMUNITY</span></div>
      <div class="pt-tg-cell"><span class="pt-tg-label">Racers</span><span class="pt-tg-value">${cd.finalRanking.length} ACTIVE</span></div>
      <div class="pt-tg-stamp"><div class="pt-stamp-circle"><span style="font-size:9px;letter-spacing:1px">POST</span><span style="font-size:14px;line-height:1">MERGE</span><span style="font-size:7px;letter-spacing:1.5px;margin-top:1px">RACE</span></div></div>
    </div>
    <div class="pt-hero">
      <div class="pt-hero-strata"></div>
      ${_mesaSvg()}
      ${_compassSvg()}
      <div class="pt-scene">
        <div class="pt-scene-plane"><svg viewBox="0 0 70 50" fill="none"><path d="M5 30 L30 25 L50 20 L65 25 L50 28 L30 30 Z" fill="#1b2436" stroke="#1b2436" stroke-width="1.5"/><path d="M25 25 L30 10 L35 25" fill="#c44a23" opacity="0.7"/></svg></div>
        <div class="pt-scene-balloon"><svg viewBox="0 0 60 90" fill="none"><ellipse cx="30" cy="30" rx="16" ry="22" fill="#c44a23" stroke="#1b2436" stroke-width="1.5"/><line x1="20" y1="50" x2="18" y2="64" stroke="#1b2436" stroke-width="1"/><line x1="40" y1="50" x2="42" y2="64" stroke="#1b2436" stroke-width="1"/><rect x="16" y="64" width="28" height="10" rx="2" fill="#1b2436"/><ellipse class="pt-flame-flicker" cx="30" cy="56" rx="4" ry="5" fill="#d4a017" opacity="0.9"/></svg></div>
        <div class="pt-scene-tracks"></div>
        <div class="pt-scene-train"><svg viewBox="0 0 180 44" fill="none"><rect x="4" y="8" width="46" height="26" rx="3" fill="#1b2436"/><rect x="38" y="4" width="14" height="10" rx="1" fill="#c44a23"/><rect x="54" y="12" width="36" height="20" rx="2" fill="#1b2436" opacity="0.7"/><circle class="pt-wheel-spin" cx="14" cy="36" r="4" fill="none" stroke="#1b2436" stroke-width="2"/><circle class="pt-wheel-spin" cx="30" cy="36" r="4" fill="none" stroke="#1b2436" stroke-width="2"/><circle class="pt-wheel-spin" cx="46" cy="36" r="4" fill="none" stroke="#1b2436" stroke-width="2"/><circle class="pt-wheel-spin" cx="64" cy="36" r="3.5" fill="none" stroke="#1b2436" stroke-width="1.5"/><circle class="pt-wheel-spin" cx="80" cy="36" r="3.5" fill="none" stroke="#1b2436" stroke-width="1.5"/></svg></div>
      </div>
      <div class="pt-title-block">
        <div class="pt-eyebrow"><span style="width:32px;height:1px;background:var(--pt-ink-soft);display:inline-block"></span>IMMUNITY CHALLENGE<span style="width:32px;height:1px;background:var(--pt-ink-soft);display:inline-block"></span></div>
        <h1 class="pt-title-main">PLANES, TRAINS <span class="pt-amp">&</span> HOT AIR MOBILES</h1>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px">
          <span style="flex:0 1 180px;height:2px;background:var(--pt-ink);position:relative"></span>
          <span style="font-family:var(--pt-font-display);color:var(--pt-rust);font-size:18px">&#9670;</span>
          <span style="flex:0 1 180px;height:2px;background:var(--pt-ink)"></span>
        </div>
        <div class="pt-title-tagline">"<em>Scavenge.</em> Race. Survive. <em>Win.</em>"</div>
        <div class="pt-roster">
          <div class="pt-roster-label">COMPETITORS</div>
          <div class="pt-roster-grid">
            ${cd.finalRanking.map(name => `<div class="pt-roster-card">
              ${portrait(name, 48)}
              <span class="pt-roster-name">${name.split(' ')[0]}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
    <div class="pt-meta-ribbon">
      <span><span class="pt-mr-dot" style="background:var(--pt-rust)"></span>PHASE 1: SCAVENGE</span>
      <span><span class="pt-mr-dot" style="background:var(--pt-mustard)"></span>PHASE 2: LAND RACE</span>
      <span><span class="pt-mr-dot" style="background:var(--pt-teal)"></span>PHASE 3: SEA CROSSING</span>
      <span><span class="pt-mr-dot" style="background:var(--pt-sage)"></span>PHASE 4: BEACH SPRINT</span>
    </div>
  `, ep, 'pt-phase-title');
}

// ══════════════════════════════════════════════════════���═══════
// VP — SCREEN 2: RACER FIELD
// ══════════════════════════════════════════════════════════════
export function rpBuildPTField(ep) {
  // Legacy stub — redirects to rpBuildPTScavenge for backward compat
  return rpBuildPTScavenge(ep);
}

// ══════════════════════════════════════════════════════════════
// VP — SCREEN 3: SCAVENGE PHASE
// ══════════════════════════════════════��═══════════════════════
export function rpBuildPTScavenge(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const screenKey = 'pt-scavenge';
  _initState(screenKey, cd.scavengeEvents.length);
  const revIdx = (window._tvState && window._tvState[screenKey]) ? window._tvState[screenKey].idx : -1;

  // Crashed plane SVG silhouette
  const crashedPlaneSvg = `<svg class="pt-crash-plane" viewBox="0 0 1100 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 220 Q120 180, 200 170 L400 160 Q420 158, 440 162 L450 165" stroke="#1b2436" stroke-width="4" fill="#1b2436" opacity="0.9"/>
    <path d="M480 175 Q500 170, 560 172 L700 180 Q740 185, 780 195 L820 210" stroke="#1b2436" stroke-width="4" fill="#1b2436" opacity="0.9"/>
    <path d="M450 165 Q460 168, 465 172 L470 178 Q475 175, 480 175" stroke="#1b2436" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
    <path d="M250 165 L80 110 Q60 100, 50 120 L70 140 Q80 155, 120 160 L250 170" fill="#1b2436" opacity="0.7"/>
    <path d="M600 175 L900 120 Q920 115, 930 130 L910 145 Q900 155, 860 160 L700 178" fill="#1b2436" opacity="0.6" transform="rotate(8 750 150)"/>
    <path d="M820 210 Q840 215, 860 200 L880 160 Q890 140, 870 130 L850 135 Q830 145, 820 170 L820 210" fill="#1b2436" opacity="0.8" transform="rotate(15 850 180)"/>
    <rect x="130" y="175" width="12" height="8" rx="2" fill="#2a6f7c" opacity="0.4"/>
    <rect x="150" y="173" width="12" height="8" rx="2" fill="#2a6f7c" opacity="0.3"/>
    <ellipse cx="180" cy="150" rx="15" ry="10" fill="#1b2436" opacity="0.6"/>
    <ellipse cx="660" cy="162" rx="15" ry="10" fill="#1b2436" opacity="0.5"/>
    <rect x="460" y="230" width="18" height="6" rx="1" fill="#1b2436" opacity="0.3" transform="rotate(25 469 233)"/>
    <rect x="500" y="240" width="12" height="4" rx="1" fill="#1b2436" opacity="0.25" transform="rotate(-15 506 242)"/>
    <rect x="380" y="245" width="14" height="5" rx="1" fill="#1b2436" opacity="0.2" transform="rotate(40 387 248)"/>
    <circle cx="520" cy="250" r="4" fill="#1b2436" opacity="0.2"/>
    <circle cx="430" cy="255" r="3" fill="#1b2436" opacity="0.15"/>
  </svg>`;

  // Build step cards for each scavenge event
  let flavorIdx = 0;
  const steps = cd.scavengeEvents.map((ev, i) => {
    const vis = i > revIdx ? 'pt-step-hidden' : 'pt-step-visible';
    const disp = i > revIdx ? 'display:none' : '';

    // Wreckage flavor text every 3 cards
    let flavorHtml = '';
    if (i > 0 && i % 3 === 0) {
      flavorHtml = `<div class="pt-flavor">${WRECKAGE_FLAVOR[flavorIdx % WRECKAGE_FLAVOR.length]}</div>`;
      flavorIdx++;
    }

    if (ev.eventType === 'draftPick') {
      const vDef = VEHICLES[ev.vehicleId];
      const s = pStats(ev.player);
      const tierBorderClass = ev.tier === 'excellent' ? 'border-gold' : ev.tier === 'good' ? 'border-teal' : 'border-rust';
      const postageClass = ev.tier === 'excellent' ? 'gold' : ev.tier === 'good' ? 'teal' : '';
      return `<div id="pt-step-scavenge-${i}" class="${vis}" style="${disp}">
        ${flavorHtml}
        <div class="pt-draft-card ${tierBorderClass}">
          <div class="pt-draft-postage ${postageClass}">
            <span class="pt-pp-1">PICK</span>
            <span class="pt-pp-2">${ev.draftPos}</span>
          </div>
          <div class="pt-draft-head">
            ${portrait(ev.player, 48)}
            <div>
              <div class="pt-draft-name">${ev.player}</div>
              <div class="pt-draft-archetype">${arch(ev.player).replace(/-/g, ' ')}</div>
            </div>
          </div>
          <div class="pt-draft-vehicle">
            <div class="pt-draft-icon">${_vehicleIcon(ev.vehicleId, 80)}</div>
            <div>
              <div class="pt-draft-vname">${ev.vehicle}</div>
              <div class="pt-draft-stats">
                <span>SPD <b class="rust">${vDef.speed}</b></span>
                <span>HP <b class="teal">${vDef.hp}</b></span>
                <span>${vDef.stats[0].slice(0, 3).toUpperCase()} <b>${s[vDef.stats[0]]}</b></span>
                <span>${vDef.stats[1].slice(0, 3).toUpperCase()} <b>${s[vDef.stats[1]]}</b></span>
              </div>
            </div>
          </div>
          <div class="pt-draft-narration">${ev.text}</div>
        </div>
      </div>`;
    } else {
      // Scramble/conflict event card
      let borderCls = 'border-rust';
      let typeLabel = 'EVENT';
      let typeCls = 'type-fight';
      if (ev.eventType === 'sprint') { borderCls = 'border-sage'; typeCls = 'type-sprint'; typeLabel = 'SPRINT'; }
      else if (ev.eventType === 'stumble') { borderCls = 'border-rust'; typeCls = 'type-stumble'; typeLabel = 'STUMBLE'; }
      else if (ev.eventType === 'hangBack') { borderCls = 'border-mustard'; typeCls = 'type-hangback'; typeLabel = 'HANG BACK'; }
      else if (ev.eventType === 'fight') { borderCls = 'border-crimson'; typeCls = 'type-fight'; typeLabel = 'VEHICLE FIGHT'; }
      else if (ev.eventType === 'fightWin') { borderCls = 'border-crimson'; typeCls = 'type-fight'; typeLabel = 'FIGHT RESULT'; }
      else if (ev.eventType === 'steal') { borderCls = 'border-crimson'; typeCls = 'type-steal'; typeLabel = 'VILLAIN STEAL'; }
      else if (ev.eventType === 'yield') { borderCls = 'border-sage'; typeCls = 'type-yield'; typeLabel = 'GENEROUS YIELD'; }
      else if (ev.eventType === 'injury') { borderCls = 'border-rust'; typeCls = 'type-injury'; typeLabel = 'INJURY'; }
      else if (ev.eventType === 'reluctantBond') { borderCls = 'border-mustard'; typeCls = 'type-bond'; typeLabel = 'RELUCTANT BOND'; }
      else if (ev.eventType === 'hiddenGem') { borderCls = 'border-mustard'; typeCls = 'type-gem'; typeLabel = 'HIDDEN GEM'; }

      return `<div id="pt-step-scavenge-${i}" class="${vis}" style="${disp}">
        ${flavorHtml}
        <div class="pt-scramble-card ${borderCls}">
          <span class="pt-ev-label ${typeCls}">${typeLabel}</span>
          <div class="pt-scramble-players">
            ${portrait(ev.player, 32)}
            ${ev.target ? portrait(ev.target, 32) : ''}
          </div>
          <div class="pt-scramble-text">${ev.text}</div>
        </div>
      </div>`;
    }
  }).join('');

  const total = cd.scavengeEvents.length;
  return _shell(`
    <div class="pt-wreckage-bg">
      ${crashedPlaneSvg}
      <div class="pt-smoke pt-smoke-1"></div>
      <div class="pt-smoke pt-smoke-2"></div>
      <div class="pt-smoke pt-smoke-3"></div>
      <div class="pt-spark pt-spark-1"></div>
      <div class="pt-spark pt-spark-2"></div>
      <div class="pt-spark pt-spark-3"></div>
    </div>
    <div class="pt-section">
      <div class="pt-section-header">
        <span class="pt-section-num">01</span>
        <span class="pt-section-h">WRECKAGE DRAFT</span>
        <span class="pt-section-sub">${cd.finalRanking.length} COMPETITORS &middot; ${Object.keys(VEHICLES).length} VEHICLES</span>
      </div>
      <div class="pt-layout">
        <div class="pt-feed">
          <div class="pt-host-intro">
            <div class="pt-host-badge">HOST BRIEFING</div>
            <div class="pt-host-text">"Welcome to the <b>Wreckage Draft</b>! Behind me, you'll see what's left of our luxury charter plane. Scattered across this crash site are <b>${Object.keys(VEHICLES).length} vehicles</b> — each one your ticket to the finish line. You'll scramble through the wreckage and <b>claim your ride</b>. First come, first served — but watch your back. Some of you won't play nice."</div>
            <div class="pt-host-text">"Once everyone's got a vehicle, the <b>three-stage race</b> begins: Land, Sea, and Beach Sprint. Last one standing wins immunity. Now GO!"</div>
            <div class="pt-host-sig">— ${host()}</div>
          </div>
          ${steps}
          <div class="pt-controls" id="pt-controls-scavenge">
            <button class="pt-btn" onclick="ptRevealNext('pt-scavenge',${total})">Next &gt;</button>
            <button class="pt-btn pt-btn-gold" onclick="ptRevealAll('pt-scavenge',${total})">Reveal All</button>
          </div>
          <div class="pt-counter" id="pt-counter-scavenge">${Math.max(0, revIdx + 1)} / ${total}</div>
        </div>
        <div class="pt-sidebar" id="pt-sidebar-inner">${_buildSidebarContent(screenKey, ep)}</div>
      </div>
    </div>
  `, ep, 'pt-phase-scavenge');
}

// ══════════════════════════════��═══════════════════════════════
// VP — SCREEN 4: LAND RACE
// ══════════════════════════════════════════════════════════════
export function rpBuildPTLandRace(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const screenKey = 'pt-land';
  const events = cd.landEvents || [];
  _initState(screenKey, events.length);
  const revIdx = (window._tvState && window._tvState[screenKey]) ? window._tvState[screenKey].idx : -1;

  // Map with route
  // Build racer markers for the live map — compute initial positions based on current reveal state
  const allRacers = cd.finalRanking || [];
  const snapshots = cd.landTimeSnapshots || [];

  // Compute positions based on current reveal state
  let maxSegRevealed = -1;
  for (let i = 0; i <= Math.min(revIdx, events.length - 1); i++) {
    const seg = events[i].segment || 0;
    if (seg <= 3) maxSegRevealed = Math.max(maxSegRevealed, seg);
  }
  const snapIdx = Math.min(maxSegRevealed, snapshots.length - 1);
  const snap = snapIdx >= 0 ? snapshots[snapIdx] : null;

  let buildHeliIdx = 0;
  const racerMarkers = allRacers.map((name, i) => {
    const assign = cd.assignments?.[name];
    const isHeli = assign?.vehicleId === 'helicopter';
    const yOffset = 20 + (i % 6) * 11;
    const s = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');

    // Compute left position from snapshot
    let leftPct = 5;
    let opa = '0.3';
    let heliBottom = 75;
    if (isHeli) {
      leftPct = revIdx >= 0 ? 92 : 5;
      opa = revIdx >= 0 ? '1' : '0.3';
      heliBottom = 75 - buildHeliIdx * 15;
      buildHeliIdx++;
    } else if (snap && revIdx >= 0) {
      const times = Object.values(snap).filter(t => t > 0);
      const best = Math.min(...times);
      const worst = Math.max(...times);
      const range = worst - best;
      const norm = range > 0 ? ((snap[name] || 0) - best) / range : 0.5;
      const baseProg = (maxSegRevealed + 0.5) / 4;
      const spread = 0.20 + baseProg * 0.25;
      const leaderPos = Math.min(baseProg + spread * 0.15, 0.98);
      const progress = Math.max(0.02, leaderPos - spread * norm);
      leftPct = 5 + progress * 87;
      opa = '1';
    }

    return `<div class="pt-map-racer" id="pt-map-racer-${name.replace(/\s+/g, '-')}" style="left:${leftPct}%;bottom:${isHeli ? heliBottom : yOffset}%;opacity:${opa}">
      <img src="assets/avatars/${s}.png" alt="${name}" style="width:28px;height:28px;border-radius:50%;object-fit:contain;border:2px solid var(--pt-ink);box-shadow:0 2px 4px rgba(0,0,0,0.3)" onerror="this.style.display='none'">
      <span class="pt-map-racer-label">${name.split(' ')[0]}</span>
    </div>`;
  }).join('');

  const steps = events.map((ev, i) => {
    let borderCls = 'border-teal';
    let label = 'EVENT';
    let labelCls = '';
    if (ev.type === 'sabotage' || ev.type === 'animals') { borderCls = 'border-crimson'; label = 'SABOTAGE'; labelCls = 'sabotage'; }
    else if (ev.type === 'sabotage-fail' || ev.type === 'sabotage-dodged') { borderCls = 'border-rust'; label = 'BACKFIRE'; labelCls = 'damage'; }
    else if (ev.type === 'terrain' || ev.type === 'destroy') { borderCls = 'border-rust'; label = 'HAZARD'; labelCls = 'damage'; }
    else if (ev.type === 'alliance') { borderCls = 'border-sage'; label = 'ALLIANCE'; labelCls = 'social'; }
    else if (ev.type === 'gambit-success' || ev.type === 'gambit-fail') { borderCls = 'border-mustard'; label = 'GAMBIT'; }
    else if (ev.type === 'showmance') { borderCls = 'border-sage'; label = 'MOMENT'; labelCls = 'social'; }
    else if (ev.type === 'helicopter-skip') { borderCls = 'border-teal'; label = 'HELICOPTER'; }
    else if (ev.type === 'terrain-immune') { borderCls = 'border-teal'; label = 'FLIGHT'; }
    else if (ev.type === 'zipline-boost') { borderCls = 'border-mustard'; label = 'DOWNHILL'; }
    else if (ev.type === 'lead-change') { borderCls = 'border-gold'; label = 'LEAD CHANGE'; }
    else if (ev.type === 'overtake') { borderCls = 'border-teal'; label = 'OVERTAKE'; }
    else if (ev.type === 'falling-behind') { borderCls = 'border-rust'; label = 'FALLING BEHIND'; }
    else if (ev.type === 'momentum') { borderCls = 'border-gold'; label = 'MOMENTUM'; }
    else if (ev.type === 'pack-cluster') { borderCls = 'border-mustard'; label = 'PACK RACING'; }
    else if (ev.type === 'trash-talk') { borderCls = 'border-crimson'; label = 'TRASH TALK'; labelCls = 'sabotage'; }
    else if (ev.type === 'rivalry') { borderCls = 'border-crimson'; label = 'RIVALRY'; labelCls = 'sabotage'; }
    else if (ev.type === 'vehicle-flavor') { borderCls = 'border-teal'; label = 'VEHICLE'; }
    else if (ev.type === 'on-foot') { borderCls = 'border-rust'; label = 'ON FOOT'; }
    else if (ev.type === 'terrain-dodge') { borderCls = 'border-sage'; label = 'DODGE'; }
    else if (ev.type === 'setpiece') { borderCls = 'border-mustard'; label = 'TERRAIN'; }
    else if (ev.type === 'desperation-success' || ev.type === 'desperation-fail') { borderCls = 'border-crimson'; label = 'DESPERATION'; }
    else if (ev.type === 'heli-commentary') { borderCls = 'border-teal'; label = 'HELICOPTER'; }
    else if (ev.type === 'finish') { borderCls = 'border-gold'; label = ev.finishPos === 1 ? '🏁 1ST ARRIVAL' : `🏁 ${ordinal(ev.finishPos || 0)} ARRIVAL`; labelCls = ev.finishPos <= 2 ? 'gold' : ''; }
    else if (ev.type === 'host-transition') { borderCls = 'border-mustard'; label = '📢 PHASE COMPLETE'; labelCls = 'gold'; }

    if (ev.type === 'standings') {
      return `<div id="pt-step-land-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
        ${_renderStandingsCard(ev)}
      </div>`;
    }

    const segLabel = ev.type === 'finish' || ev.type === 'host-transition' ? '' : ` &middot; SEG ${(ev.segment || 0) + 1}`;
    const clashHtml = _buildClashVisual(ev, cd);
    const noVehTypes = new Set(['showmance', 'alliance', 'host-transition', 'standings', 'pack-cluster']);
    const pVehId = !clashHtml && !noVehTypes.has(ev.type) && ev.player && !ev.target && cd.assignments?.[ev.player]?.vehicleId;
    const vehSvg = pVehId ? `<div class="pt-ev-veh">${_vehicleIcon(pVehId, 52)}</div>` : '';
    return `<div id="pt-step-land-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
      ${i > 0 && i % 5 === 0 && ev.type !== 'finish' && ev.type !== 'host-transition' && ev.type !== 'standings' ? `<div class="pt-flavor">${pick(FLAVOR_TEXT.land)}</div>` : ''}
      <div class="pt-event-card ${borderCls}">
        ${vehSvg}
        <span class="pt-ev-label ${labelCls}">${label}${segLabel}</span>
        ${_evPlayers(ev.player, ev.target)}
        ${clashHtml}
        ${ev.text}
      </div>
    </div>`;
  }).join('');

  const total = events.length;

  // Segment markers for the route
  const segMarkers = ['CANYON', 'DOWNHILL', 'SWITCHBACK', 'FINAL PUSH'].map((label, i) => {
    const x = 5 + ((i + 1) / 5) * 87;
    return `<div class="pt-map-seg-marker" style="left:${x}%">${label}</div>`;
  }).join('');

  return _shell(`
    <div class="pt-section">
      <div class="pt-layout">
        <div class="pt-feed">
          <div class="pt-land-sticky-map" id="pt-land-map">
            <div class="pt-map-header">
              <span class="pt-section-num" style="font-size:28px">02</span>
              <span class="pt-section-h" style="font-size:20px">LAND RACE</span>
              <span class="pt-section-sub">LIVE TRACKER</span>
            </div>
            <div class="pt-map-track">
              <div class="pt-map-grid"></div>
              <svg class="pt-map-svg" viewBox="0 0 1000 200" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
                <path class="pt-route-path" d="M 50 100 C 200 110, 350 90, 500 100 C 650 110, 800 90, 950 100"/>
              </svg>
              <div class="pt-map-place" style="left:4%;top:50%;transform:translate(-50%,-50%)"><span class="pt-pin" style="background:var(--pt-ink)"></span><span class="pt-lbl">START</span></div>
              <div class="pt-map-place" style="left:94%;top:50%;transform:translate(-50%,-50%)"><span class="pt-pin" style="background:var(--pt-teal);animation:pt-mine-pulse 2s ease-in-out infinite"></span><span class="pt-lbl">COAST</span></div>
              ${segMarkers}
              ${racerMarkers}
            </div>
            <div class="pt-map-seg-pips">
              ${['CANYON','DOWNHILL','SWITCHBACK','FINAL PUSH'].map((l, i) => {
                const cls = i < maxSegRevealed ? 'done' : i === maxSegRevealed ? 'active' : '';
                return `<div class="pt-seg-pip ${cls}" id="pt-map-seg-${i}"><span class="pt-seg-pip-dot"></span>${l}</div>`;
              }).join('')}
            </div>
          </div>
          ${steps}
          <div class="pt-controls" id="pt-controls-land">
            <button class="pt-btn" onclick="ptRevealNext('pt-land',${total})">Next &gt;</button>
            <button class="pt-btn pt-btn-gold" onclick="ptRevealAll('pt-land',${total})">Reveal All</button>
          </div>
          <div class="pt-counter" id="pt-counter-land">${Math.max(0, revIdx + 1)} / ${total}</div>
        </div>
        <div class="pt-sidebar" id="pt-sidebar-inner">${_buildSidebarContent(screenKey, ep)}</div>
      </div>
    </div>
  `, ep, 'pt-phase-land');
}

// ══════════════════════════════════════════════════════════════
// VP — SCREEN 5: SEA CROSSING
// ══════════════════════════════════════════════════════════════
export function rpBuildPTSeaCrossing(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const screenKey = 'pt-sea';
  const events = cd.seaEvents || [];
  _initState(screenKey, events.length);
  const revIdx = (window._tvState && window._tvState[screenKey]) ? window._tvState[screenKey].idx : -1;

  // Mine positions (random decorative)
  const mines = Array.from({ length: 5 }, () =>
    `<div class="pt-mine" style="left:${15 + Math.random() * 70}%;top:${20 + Math.random() * 50}%"></div>`
  ).join('');

  const steps = events.map((ev, i) => {
    let borderCls = 'border-teal';
    let label = 'SAILING';
    let labelCls = '';
    if (ev.type === 'mine') { borderCls = 'border-crimson'; label = 'MINE'; labelCls = 'damage'; }
    else if (ev.type === 'storm') { borderCls = 'border-rust'; label = 'STORM'; labelCls = 'damage'; }
    else if (ev.type === 'duel') { borderCls = 'border-mustard'; label = 'SEA DUEL'; labelCls = 'sabotage'; }
    else if (ev.type === 'boost') { borderCls = 'border-mustard'; label = 'BOOST'; }
    else if (ev.type === 'seamless' || ev.type === 'balloon-sea') { borderCls = 'border-sage'; label = 'SMOOTH'; }
    else if (ev.type === 'transition' || ev.type === 'heli-penalty') { borderCls = 'border-rust'; label = 'TRANSITION'; }
    else if (ev.type === 'ram') { borderCls = 'border-crimson'; label = 'RAMMING'; labelCls = 'sabotage'; }
    else if (ev.type === 'rescue') { borderCls = 'border-sage'; label = 'RESCUE'; labelCls = 'social'; }
    else if (ev.type === 'creature') { borderCls = 'border-teal'; label = 'CREATURE'; }
    else if (ev.type === 'navigation' || ev.type === 'nav-error') { borderCls = 'border-teal'; label = 'NAVIGATION'; }
    else if (ev.type === 'current') { borderCls = 'border-sage'; label = 'CURRENT'; }
    else if (ev.type === 'becalmed') { borderCls = 'border-rust'; label = 'BECALMED'; }
    else if (ev.type === 'lead-change') { borderCls = 'border-gold'; label = 'LEAD CHANGE'; }
    else if (ev.type === 'overtake') { borderCls = 'border-teal'; label = 'OVERTAKE'; }
    else if (ev.type === 'falling-behind') { borderCls = 'border-rust'; label = 'FALLING BEHIND'; }
    else if (ev.type === 'showmance') { borderCls = 'border-sage'; label = 'MOMENT'; labelCls = 'social'; }
    else if (ev.type === 'finish') { borderCls = 'border-gold'; label = ev.finishPos === 1 ? '🏖️ 1ST ASHORE' : `🏖️ ${ordinal(ev.finishPos || 0)} ASHORE`; labelCls = ev.finishPos <= 2 ? 'gold' : ''; }
    else if (ev.type === 'host-transition') { borderCls = 'border-mustard'; label = '📢 PHASE COMPLETE'; labelCls = 'gold'; }

    if (ev.type === 'standings') {
      return `<div id="pt-step-sea-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
        ${_renderStandingsCard(ev)}
      </div>`;
    }

    const seaSegLabel = ev.type === 'finish' || ev.type === 'host-transition' ? '' : ` &middot; SEG ${(ev.segment || 0) + 1}`;
    const seaClashHtml = _buildClashVisual(ev, cd, true);
    const seaNoVehTypes = new Set(['showmance', 'alliance', 'host-transition', 'standings', 'pack-cluster']);
    const seaVesselId = !seaClashHtml && !seaNoVehTypes.has(ev.type) && ev.player && !ev.target && cd.seaVessels?.[ev.player]?.id;
    const seaVehSvg = seaVesselId ? `<div class="pt-ev-veh">${_seaVesselIcon(seaVesselId, 52)}</div>` : '';
    return `<div id="pt-step-sea-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
      ${i > 0 && i % 5 === 0 && ev.type !== 'finish' && ev.type !== 'host-transition' && ev.type !== 'standings' ? `<div class="pt-flavor">${pick(FLAVOR_TEXT.sea)}</div>` : ''}
      <div class="pt-event-card ${borderCls}">
        ${seaVehSvg}
        <span class="pt-ev-label ${labelCls}">${label}${seaSegLabel}</span>
        ${_evPlayers(ev.player, ev.target)}
        ${seaClashHtml}
        ${ev.text}
      </div>
    </div>`;
  }).join('');

  const total = events.length;
  const racers = cd.finalRanking || [];
  const assigns = cd.assignments || {};

  // Build racer markers for the sea map
  const seaRacerMarkers = racers.map((name, i) => {
    const s = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    const yOffset = 18 + (i % racers.length) * Math.min(10, 60 / racers.length);
    return `<div class="pt-map-racer" id="pt-sea-racer-${name.replace(/\s+/g, '-')}" style="left:6%;bottom:${yOffset}%;opacity:0.3">
      <img src="assets/avatars/${s}.png" alt="${name}" style="width:24px;height:24px;border-radius:50%;object-fit:contain;border:2px solid var(--pt-teal);box-shadow:0 2px 6px rgba(42,111,124,0.4)" onerror="this.style.display='none'">
      <span class="pt-map-racer-label" style="background:var(--pt-teal)">${name.split(' ')[0]}</span>
    </div>`;
  }).join('');

  // Mine hazards (seeded positions for consistency on re-render)
  const minePositions = [[22, 30], [38, 58], [52, 25], [67, 52], [78, 38]];
  const mapMines = minePositions.map(([x, y]) =>
    `<div class="pt-mine" style="left:${x}%;top:${y}%"></div>`
  ).join('');

  // SVG wave route paths (3 paths at different depths for visual variety)
  const routeSvg = `<svg class="pt-map-svg" viewBox="0 0 1000 200" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
    <path class="pt-sea-route" d="M 60 60 C 200 50, 350 70, 500 55 C 650 45, 800 65, 940 50" stroke="var(--pt-teal)" opacity="0.35"/>
    <path class="pt-sea-route" d="M 60 100 C 220 110, 400 90, 580 105 C 720 115, 860 95, 940 100" stroke="var(--pt-ink)" opacity="0.25"/>
    <path class="pt-sea-route" d="M 60 145 C 180 155, 380 135, 540 150 C 700 160, 850 140, 940 148" stroke="var(--pt-sage)" opacity="0.3"/>
  </svg>`;

  // Build legend from actual racers' sea vessels
  const seaVessels = cd.seaVessels || {};
  const vesselSet = new Set(racers.map(n => seaVessels[n]?.id).filter(Boolean));
  const tierColors = { heavy: 'var(--pt-ink)', light: 'var(--pt-teal)', built: 'var(--pt-mustard)', animal: 'var(--pt-sage)', scrap: 'var(--pt-rust)', medium: 'var(--pt-teal)', air: 'var(--pt-rust)' };
  const vesselLabels = {};
  for (const n of racers) { if (seaVessels[n]) vesselLabels[seaVessels[n].id] = { label: seaVessels[n].seaLabel, tier: seaVessels[n].tier }; }
  const legendItems = [...vesselSet].map(vid => {
    const info = vesselLabels[vid] || {};
    const color = tierColors[info.tier] || 'var(--pt-teal)';
    return `<div><i style="background:${color}"></i> ${info.label || vid}</div>`;
  }).join('');

  // Segment pip labels for sea
  const seaSegLabels = ['OPEN WATER', 'DEEP SEA', 'APPROACH'];
  const maxSegRevealed = (() => {
    let m = -1;
    for (let i = 0; i <= Math.min(revIdx, events.length - 1); i++) {
      const seg = events[i].segment || 0;
      if (seg < 3) m = Math.max(m, seg);
    }
    return m;
  })();

  return _shell(`
    <div class="pt-section">
      <div class="pt-layout">
        <div class="pt-feed">
          <div class="pt-sea-sticky-map" id="pt-sea-map">
            <div class="pt-map-header">
              <span class="pt-section-num" style="font-size:28px">03</span>
              <span class="pt-section-h" style="font-size:20px">SEA CROSSING</span>
              <span class="pt-section-sub">LIVE TRACKER</span>
            </div>
            <div class="pt-sea-track">
              ${routeSvg}
              <div class="pt-wave w1"></div>
              <div class="pt-wave w2"></div>
              <div class="pt-wave w3"></div>
              ${mapMines}
              <div class="pt-map-place" style="left:4%;top:50%;transform:translate(-50%,-50%)"><span class="pt-pin" style="background:var(--pt-ink)"></span><span class="pt-lbl">DOCK</span></div>
              <div class="pt-map-place" style="left:94%;top:50%;transform:translate(-50%,-50%)"><span class="pt-pin" id="pt-sea-beach-pin" style="background:var(--pt-teal);animation:pt-mine-pulse 2s ease-in-out infinite"></span><span class="pt-lbl">BEACH</span></div>
              ${seaRacerMarkers}
            </div>
            <div class="pt-map-seg-pips">
              ${seaSegLabels.map((l, i) => {
                const cls = i < maxSegRevealed ? 'done' : i === maxSegRevealed ? 'active' : '';
                return `<div class="pt-seg-pip ${cls}" id="pt-sea-seg-${i}"><span class="pt-seg-pip-dot"></span>${l}</div>`;
              }).join('')}
            </div>
            <div class="pt-sea-legend">
              ${legendItems}
              <div><i class="mine-key"></i> SEA MINES</div>
            </div>
          </div>
          ${steps}
          <div class="pt-controls" id="pt-controls-sea">
            <button class="pt-btn" onclick="ptRevealNext('pt-sea',${total})">Next &gt;</button>
            <button class="pt-btn pt-btn-gold" onclick="ptRevealAll('pt-sea',${total})">Reveal All</button>
          </div>
          <div class="pt-counter" id="pt-counter-sea">${Math.max(0, revIdx + 1)} / ${total}</div>
        </div>
        <div class="pt-sidebar" id="pt-sidebar-inner">${_buildSidebarContent(screenKey, ep)}</div>
      </div>
    </div>
  `, ep, 'pt-phase-sea');
}

// ══════════════════════════════════════════════════════════════
// VP — SCREEN 6: BEACH SPRINT
// ══════════════════════════════════════════════════════════════
export function rpBuildPTBeachSprint(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const screenKey = 'pt-beach';
  const events = cd.beachEvents || [];
  _initState(screenKey, events.length);
  const revIdx = (window._tvState && window._tvState[screenKey]) ? window._tvState[screenKey].idx : -1;

  const steps = events.map((ev, i) => {
    let borderCls = 'border-teal';
    let label = 'SPRINT';
    let labelCls = '';
    if (ev.type === 'mine') { borderCls = 'border-crimson'; label = 'MINE'; labelCls = 'damage'; }
    else if (ev.type === 'boost') { borderCls = 'border-mustard'; label = 'BOOST'; }
    else if (ev.type === 'photo-finish') { borderCls = 'border-gold'; label = 'PHOTO FINISH'; }
    else if (ev.type === 'dive') { borderCls = 'border-gold'; label = 'FINISH DIVE'; }
    else if (ev.type === 'tackle') { borderCls = 'border-crimson'; label = 'TACKLE'; labelCls = 'sabotage'; }
    else if (ev.type === 'collapse') { borderCls = 'border-rust'; label = 'COLLAPSE'; }
    else if (ev.type === 'surge') { borderCls = 'border-sage'; label = 'SURGE'; }
    else if (ev.type === 'crowd') { borderCls = 'border-sage'; label = 'CROWD'; labelCls = 'social'; }
    else if (ev.type === 'lead-change') { borderCls = 'border-gold'; label = 'LEAD CHANGE'; }
    else if (ev.type === 'overtake') { borderCls = 'border-teal'; label = 'OVERTAKE'; }
    else if (ev.tier === 'fast') { borderCls = 'border-sage'; label = 'SPRINT'; }
    else if (ev.tier === 'slow') { borderCls = 'border-rust'; label = 'EXHAUSTION'; }

    if (ev.type === 'standings') {
      return `<div id="pt-step-beach-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
        ${_renderStandingsCard(ev)}
      </div>`;
    }

    return `<div id="pt-step-beach-${i}" class="${i > revIdx ? 'pt-step-hidden' : 'pt-step-visible'}" style="${i > revIdx ? 'display:none' : ''}">
      ${i > 0 && i % 5 === 0 ? `<div class="pt-flavor">${pick(FLAVOR_TEXT.beach)}</div>` : ''}
      <div class="pt-event-card ${borderCls}">
        <span class="pt-ev-label ${labelCls}">${label}</span>
        ${_evPlayers(ev.player, ev.target)}
        ${ev.text}
      </div>
    </div>`;
  }).join('');

  const total = events.length;
  return _shell(`
    <div class="pt-section">
      <div class="pt-section-header">
        <span class="pt-section-num">04</span>
        <span class="pt-section-h">BEACH SPRINT</span>
        <span class="pt-section-sub">3 SEGMENTS &middot; SHALLOWS / SAND / FINAL PUSH</span>
      </div>
      <div class="pt-beach-wrap">
        <div class="pt-wave w1"></div>
        <div class="pt-wave w2"></div>
        <div class="pt-wave w3"></div>
        <div style="position:absolute;right:10%;top:30%;font-family:var(--pt-font-display);font-size:13px;color:var(--pt-paper);background:var(--pt-rust);padding:5px 12px;letter-spacing:2px;border:1.5px solid var(--pt-rust-deep);z-index:5">FINISH</div>
        ${cd.winner ? `<div style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);font-family:var(--pt-font-display);font-size:14px;color:var(--pt-paper);background:var(--pt-mustard-deep);padding:6px 16px;letter-spacing:3px;border:2px solid var(--pt-mustard);z-index:6">${cd.winner} WINS!</div>` : ''}
      </div>
    </div>
    <div class="pt-section">
      <div class="pt-layout">
        <div class="pt-feed">
          ${steps}
          <div class="pt-controls" id="pt-controls-beach">
            <button class="pt-btn" onclick="ptRevealNext('pt-beach',${total})">Next &gt;</button>
            <button class="pt-btn pt-btn-gold" onclick="ptRevealAll('pt-beach',${total})">Reveal All</button>
          </div>
          <div class="pt-counter" id="pt-counter-beach">${Math.max(0, revIdx + 1)} / ${total}</div>
        </div>
        <div class="pt-sidebar" id="pt-sidebar-inner">${_buildSidebarContent(screenKey, ep)}</div>
      </div>
    </div>
  `, ep, 'pt-phase-beach');
}

// ════════════════════════════���═════════════════════════════════
// VP — SCREEN 7: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildPTResults(ep) {
  const cd = ep.challengeData;
  if (!cd) return '';
  const ranking = cd.finalRanking;
  const winner = ranking[0];
  const second = ranking[1];
  const third = ranking[2];

  // Podium
  const podiumCards = [];
  if (second) {
    podiumCards.push(`<div class="pt-podium-card">
      <span class="pt-podium-rank">2</span>
      ${portrait(second, 48)}
      <div class="pt-podium-name">${second}</div>
      <div class="pt-podium-vehicle">${cd.assignments[second]?.vehicleLabel || ''}</div>
      <div class="pt-podium-tag">${cd.totalTime[second]?.toFixed(1)}s</div>
    </div>`);
  }
  podiumCards.push(`<div class="pt-podium-card first">
    <span class="pt-podium-rank">1</span>
    ${portrait(winner, 56)}
    <div class="pt-podium-name">${winner}</div>
    <div class="pt-podium-vehicle">${cd.assignments[winner]?.vehicleLabel || ''}</div>
    <div class="pt-podium-tag">IMMUNITY &middot; ${cd.totalTime[winner]?.toFixed(1)}s</div>
  </div>`);
  if (third) {
    podiumCards.push(`<div class="pt-podium-card">
      <span class="pt-podium-rank">3</span>
      ${portrait(third, 48)}
      <div class="pt-podium-name">${third}</div>
      <div class="pt-podium-vehicle">${cd.assignments[third]?.vehicleLabel || ''}</div>
      <div class="pt-podium-tag">${cd.totalTime[third]?.toFixed(1)}s</div>
    </div>`);
  }

  // Full ranking table
  const rows = ranking.map((name, idx) => `
    <div class="pt-rankings-row">
      <span class="pt-rank-num">${idx + 1}</span>
      <span class="pt-rank-name">${name}</span>
      <span class="pt-rank-vehicle">${cd.assignments[name]?.vehicleLabel || ''}</span>
      <span class="pt-rank-time">${cd.totalTime[name]?.toFixed(1)}s</span>
    </div>
  `).join('');

  // Hawaii beach scene
  const hawaii = `<div style="position:relative;height:180px;background:linear-gradient(180deg,rgba(42,111,124,0.25) 0%,rgba(86,165,179,0.4) 40%,rgba(212,160,23,0.4) 70%,rgba(201,163,115,0.6) 100%);border:1.5px solid var(--pt-ink);margin-top:28px;overflow:hidden">
    <div class="pt-wave w1"></div>
    <div class="pt-wave w2"></div>
    <div class="pt-wave w3"></div>
    <svg style="position:absolute;left:15%;bottom:20px;width:60px;height:80px" viewBox="0 0 40 60" fill="none">
      <path d="M20 58 L20 30" stroke="#2a6f7c" stroke-width="3"/>
      <path d="M20 30 Q8 20, 4 10 Q2 4, 10 8 Q14 12, 20 20" fill="#7a8a5c"/>
      <path d="M20 30 Q32 22, 38 12 Q40 6, 32 10 Q28 14, 20 22" fill="#7a8a5c"/>
    </svg>
    <svg style="position:absolute;right:20%;bottom:20px;width:50px;height:70px" viewBox="0 0 40 60" fill="none">
      <path d="M20 58 L20 32" stroke="#2a6f7c" stroke-width="2.5"/>
      <path d="M20 32 Q10 24, 6 14 Q4 8, 12 12 Q16 16, 20 24" fill="#7a8a5c"/>
      <path d="M20 32 Q30 26, 36 16 Q38 10, 30 14 Q26 18, 20 26" fill="#7a8a5c"/>
    </svg>
    <div style="position:absolute;left:50%;bottom:80px;transform:translateX(-50%);font-family:var(--pt-font-display);font-size:14px;color:var(--pt-paper);background:var(--pt-ink);padding:5px 14px;letter-spacing:2px;border:1.5px solid var(--pt-mustard)">${winner} ARRIVES FIRST!</div>
  </div>`;

  return _shell(`
    <div class="pt-finish">
      <div class="pt-section-header">
        <span class="pt-section-num">05</span>
        <span class="pt-section-h">FINAL STANDINGS</span>
        <span class="pt-section-sub">RACE COMPLETE</span>
      </div>
      <div class="pt-podium">${podiumCards.join('')}</div>
      <div class="pt-rankings">
        <div class="pt-rankings-head"><span>#</span><span>RACER</span><span>VEHICLE</span><span>TIME</span></div>
        ${rows}
      </div>
      ${hawaii}
    </div>
    <div style="text-align:center;padding:36px 30px 50px;background:var(--pt-ink);color:var(--pt-paper);font-family:var(--pt-font-type);letter-spacing:3px;font-size:11px;text-transform:uppercase">
      <span style="font-family:var(--pt-font-display);font-size:28px;letter-spacing:6px;display:block;margin-bottom:8px;color:var(--pt-mustard)">END TRANSMISSION</span>
      Race complete. <span style="font-family:var(--pt-font-script);font-style:italic;font-weight:700;color:var(--pt-rust);text-transform:none;letter-spacing:0;font-size:14px">Immunity secured.</span>
    </div>
  `, ep, 'pt-phase-results');
}
