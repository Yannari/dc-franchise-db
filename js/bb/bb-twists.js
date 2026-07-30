// Big Brother twists are format-scoped and operate through week-engine hooks.
// Keep executable functions outside the catalog so catalog entries serialize.
import { gs } from '../core.js';
import { simulateBBWeek } from './week.js';

export const BB_TWIST_CATALOG = Object.freeze([
  {
    id: 'double-eviction',
    format: 'big-brother',
    name: 'Double Eviction',
    category: 'week-structure',
    desc: 'After the first eviction, a complete second week plays at live-show speed inside the same episode.',
    implemented: true,
  },
  {
    id: 'diamond-veto',
    format: 'big-brother',
    name: 'Diamond Power of Veto',
    category: 'veto',
    desc: 'The veto holder, rather than the HOH, names the replacement nominee.',
    implemented: false,
  },
  {
    id: 'coup-detat',
    format: 'big-brother',
    name: "Coup d'état",
    category: 'nominations',
    desc: 'A power holder overrides the nominations after the ceremony.',
    implemented: false,
  },
  {
    id: 'battle-back',
    format: 'big-brother',
    name: 'Battle Back',
    category: 'return',
    desc: 'An evicted houseguest wins a competition to return to the game.',
    implemented: false,
  },
  {
    id: 'pandoras-box',
    format: 'big-brother',
    name: "Pandora's Box",
    category: 'hoh-choice',
    desc: 'The HOH accepts a private reward paired with a house-wide consequence.',
    implemented: false,
  },
]);

export function getBBTwist(id) {
  return BB_TWIST_CATALOG.find(twist => twist.id === id) || null;
}

function composeHooks(baseHooks, audit) {
  const names = [
    'hohResult', 'nominationResult', 'vetoParticipants', 'vetoOutcome',
    'replacementChoice', 'voteEligibility', 'evictionResult',
  ];
  return Object.fromEntries(names.map(name => [name, (value, context) => {
    audit.push(name);
    const next = baseHooks?.[name]?.(value, { ...context, compressed: true, twist: 'double-eviction' });
    return next === undefined ? value : next;
  }]));
}

/**
 * Resolve two complete evictions as one broadcast episode.
 *
 * Both weeks remain in gs.bb.weeks because each has its own HOH, nominees,
 * veto, ballots, and boot. gs.episode advances only once. The second week's
 * seven logical days are retained for the VP but marked compressed so the UI
 * can present them as live-show beats rather than literal calendar days.
 */
export function simulateDoubleEviction(options = {}) {
  if ((options.house || gs.activePlayers || []).length < 5) {
    throw new Error('Double Eviction requires at least five houseguests so two standard evictions can resolve.');
  }
  const episodeBefore = gs.episode || 0;
  const firstWeek = simulateBBWeek(options);
  const hookAudit = [];
  const secondOptions = {
    ...options,
    house: undefined,
    hooks: composeHooks(options.hooks, hookAudit),
  };
  const secondWeek = simulateBBWeek(secondOptions);
  secondWeek.compressed = true;
  secondWeek.twist = 'double-eviction';
  secondWeek.days.forEach(day => {
    day.compressed = true;
    day.liveShowBeat = day.day;
  });

  // simulateBBWeek correctly advances once per boot. A Double Eviction has two
  // boots in one episode, so normalize only the episode counter afterward.
  gs.episode = episodeBefore + 1;
  const result = {
    format: 'big-brother',
    twist: 'double-eviction',
    episode: gs.episode,
    houseAtStart: [...firstWeek.houseAtStart],
    weeks: [firstWeek, secondWeek],
    evicted: [firstWeek.evicted, secondWeek.evicted],
    hookAudit,
  };
  gs.bb.doubleEvictions ||= [];
  gs.bb.doubleEvictions.push({
    episode: result.episode,
    weekNums: result.weeks.map(week => week.num),
    evicted: [...result.evicted],
  });
  return result;
}
