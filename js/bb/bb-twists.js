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
  {
    id: 'triple-eviction', format: 'big-brother', name: 'Triple Eviction', category: 'week-structure',
    desc: 'Three houseguests are evicted during one accelerated episode.', originSeasons: ['celebrity-2', '22'], implemented: false,
  },
  {
    id: 'split-house', format: 'big-brother', name: 'Split House', category: 'week-structure',
    desc: 'The cast divides into two isolated houses that play simultaneous HOH, nomination, veto and eviction cycles.', originSeasons: ['24'], implemented: false,
  },
  {
    id: 'battle-of-the-block', format: 'big-brother', name: 'Battle of the Block', category: 'power-structure',
    desc: 'Two HOHs nominate two pairs; the winning nominee pair earns safety and dethrones the HOH who nominated them.', originSeasons: ['16', '17'], implemented: false,
  },
  {
    id: 'co-hoh', format: 'big-brother', name: 'Co-HOH', category: 'power-structure',
    desc: 'Two houseguests share Head of Household power and must divide or negotiate nomination authority.', originSeasons: ['7', '16'], implemented: false,
  },
  {
    id: 'third-nominee', format: 'big-brother', name: 'Secret Third Nominee', category: 'nominations',
    desc: 'A competition winner or audience choice secretly adds a third nominee alongside the HOH selections.', originSeasons: ['15', '18'], variants: ['MVP', 'BB Roadkill'], implemented: false,
  },
  {
    id: 'hacker', format: 'big-brother', name: 'Hacker Power', category: 'nominations',
    desc: 'An anonymous winner may replace a nominee, alter veto participation and cancel an eviction vote.', originSeasons: ['20'], implemented: false,
  },
  {
    id: 'ai-arena', format: 'big-brother', name: 'AI Arena', category: 'season-mode',
    desc: 'Each active week has three nominees; immediately before eviction they compete for one last safety spot.',
    originSeasons: ['26'], mode: true, defaultStopsAtRemaining: 9, implemented: false,
  },
  {
    id: 'block-buster', format: 'big-brother', name: 'BB Block Buster', category: 'season-mode',
    desc: 'Three nominees face a standing live safety competition before every eviction deep into the season.',
    originSeasons: ['27'], mode: true, defaultStopsAtRemaining: 6, implemented: false,
  },
  {
    id: 'safety-suite', format: 'big-brother', name: 'Safety Suite', category: 'safety',
    desc: 'Houseguests choose when to risk a limited-use competition for safety and protection for one guest.', originSeasons: ['22'], implemented: false,
  },
  {
    id: 'wildcard-safety', format: 'big-brother', name: 'Wildcard Safety', category: 'safety',
    desc: 'One representative from each group competes for immunity that may carry a strategic consequence.', originSeasons: ['23'], implemented: false,
  },
  {
    id: 'golden-key', format: 'big-brother', name: 'Golden Key', category: 'safety',
    desc: 'When one member of a nominated pair leaves, the surviving partner receives temporary safety but cannot compete.', originSeasons: ['13'], implemented: false,
  },
  {
    id: 'festie-besties', format: 'big-brother', name: 'Festie Besties', category: 'pairs',
    desc: 'Houseguests play in linked pairs whose nominations, veto eligibility and safety are tied together.', originSeasons: ['24'], implemented: false,
  },
  {
    id: 'secret-pairs', format: 'big-brother', name: 'Secret Pairs', category: 'casting',
    desc: 'Some houseguests enter with hidden pre-existing partners whose discovery reshapes trust and targeting.', originSeasons: ['6'], implemented: false,
  },
  {
    id: 'twin-switch', format: 'big-brother', name: 'Twin Switch', category: 'casting',
    desc: 'Two characters secretly alternate as one houseguest until they survive long enough to enter separately.', originSeasons: ['5', '17'], implemented: false,
  },
  {
    id: 'teams', format: 'big-brother', name: 'House Teams', category: 'casting',
    desc: 'The house begins in teams that share safety, competition consequences or nomination exposure.', originSeasons: ['11', '14', '18', '23'], implemented: false,
  },
  {
    id: 'camp-comeback', format: 'big-brother', name: 'Camp Comeback', category: 'return',
    desc: 'Early evictees remain inside the house as observers until one wins re-entry.', originSeasons: ['21'], implemented: false,
  },
  {
    id: 'round-trip-ticket', format: 'big-brother', name: 'Round Trip Ticket', category: 'return',
    desc: 'One secret ticket immediately cancels its holder’s eviction and sends them back into the house.', originSeasons: ['18'], implemented: false,
  },
  {
    id: 'zombie-week', format: 'big-brother', name: 'Zombie Week', category: 'return',
    desc: 'Recently evicted houseguests remain in limbo and compete through a suspended week for resurrection.', originSeasons: ['25'], implemented: false,
  },
  {
    id: 'americas-care-package', format: 'big-brother', name: "America's Care Package", category: 'audience-power',
    desc: 'The audience awards a different game power to one eligible houseguest each round.', originSeasons: ['18'], implemented: false,
  },
  {
    id: 'den-of-temptation', format: 'big-brother', name: 'Den of Temptation', category: 'temptation',
    desc: 'An audience-selected houseguest may accept a private power that unleashes a consequence on the house.', originSeasons: ['19'], implemented: false,
  },
  {
    id: 'secret-hoh', format: 'big-brother', name: 'Secret HOH', category: 'power-structure',
    desc: 'The HOH controls nominations anonymously while the house searches for the hidden power holder.', originSeasons: ['23', '25', '26'], variants: ['Invisible HOH', 'Deepfake HOH'], implemented: false,
  },
  {
    id: 'second-veto', format: 'big-brother', name: 'Second Veto', category: 'veto',
    desc: 'A second veto enters play, allowing two saves and forcing the HOH to prepare multiple replacements.', originSeasons: ['14', '26'], implemented: false,
  },
  {
    id: 'diamond-veto-draw', format: 'big-brother', name: 'Veto Player Redraw', category: 'veto',
    desc: 'A secret power discards the original veto draw and selects or redraws the competition field.', originSeasons: ['21'], variants: ['Chaos Power', 'Ring of Replacement'], implemented: false,
  },
  {
    id: 'halting-hex', format: 'big-brother', name: 'Halting Hex', category: 'eviction',
    desc: 'A secret power cancels an eviction ceremony so no houseguest leaves that round.', originSeasons: ['19'], implemented: false,
  },
  {
    id: 'americas-player', format: 'big-brother', name: "America's Player", category: 'audience-power',
    desc: 'One houseguest receives secret audience-directed missions that can conflict with their personal strategy.', originSeasons: ['8', '10', '16'], variants: ["America's Player", 'Team America'], implemented: false,
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
  const composed = Object.fromEntries(names.map(name => [name, (value, context) => {
    audit.push(name);
    const next = baseHooks?.[name]?.(value, { ...context, compressed: true, twist: 'double-eviction' });
    return next === undefined ? value : next;
  }]));
  // Veto decision is not one of the seven structural twist interception points,
  // but callers may use it to deterministically exercise replacementChoice.
  if (baseHooks?.vetoDecision) {
    composed.vetoDecision = (value, context) => {
      const next = baseHooks.vetoDecision(value, { ...context, compressed: true, twist: 'double-eviction' });
      return next === undefined ? value : next;
    };
  }
  return composed;
}

/**
 * Resolve two complete evictions as one broadcast episode.
 *
 * Both weeks remain in gs.bb.weeks because each has its own HOH, nominees,
 * veto, ballots, and boot. gs.episode advances only once. The second week's
 * logical acts are retained for the VP but marked compressed so the UI
 * can present them as live-show beats.
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
  secondWeek.acts.forEach((act, index) => {
    act.compressed = true;
    act.liveShowBeat = index + 1;
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
