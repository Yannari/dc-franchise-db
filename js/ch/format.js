// ══════════════════════════════════════════════════════════════════════
// ch/format.js — a season's rules, as data
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 "Format as data". The real show reinvents its rules every season
// (Battle for a New Champion's Control / Chaos / Conquest, Total Madness's
// Tribunal, Spies, Lies & Allies' Agency); the engine reads one of these
// objects instead of hard-coding one season. The first build ships one
// format. A Tribunal or Red Skull season is a new entry here plus the code
// for any rule nobody has needed yet, never a rewrite of season.js.
//
// Source for 'vote-callout': Battle for a New Champion's Control phase
// (Wikipedia, read 2026-10-14) — "Players vote for one contestant to go to the
// Arena. The top vote-getter calls out an opponent of the same gender."
export const FORMATS = {
  'vote-callout': {
    id: 'vote-callout',
    name: 'Vote and call-out',
    immune: 'daily-winners',     // the daily's winners cannot be voted in or called out
    vote: 'house-open',          // everybody votes, out loud, in order
    tiebreak: 'daily-winners',   // the winners break a tied vote
    opponent: 'callout',         // the player voted in names their opponent
    volunteers: true,            // a player may volunteer instead of the vote
    arenaDraw: 'after-callout',  // the game is revealed at the Arena
  },
  // Total Madness / War of the Worlds (Wikipedia, read 2026-10-15): the daily's winners are the TRIBUNAL. The
  // rest of the house nominates out loud; the three with the most votes go before the Tribunal and plead their
  // case, and the Tribunal, in private, chooses who goes in. Winning a daily is power, not just safety: the
  // Tribunal is courted, and whoever it sends in remembers who did it.
  tribunal: {
    id: 'tribunal',
    name: 'The Tribunal',
    immune: 'daily-winners',
    vote: 'nominate',            // the house (not the Tribunal) nominates, out loud
    nominees: 3,                 // the top three go before the Tribunal
    tribunal: 3,                 // at most three judges: the daily's winners, or its three best on a team
    tiebreak: 'daily-winners',
    opponent: 'callout',
    volunteers: true,
    arenaDraw: 'after-callout',
  },
};

export const DEFAULT_OPTIONS = {
  format: 'vote-callout',
  gendered: true,     // men's and women's weeks, two champions (spec §2)
  finalists: 8,       // into the final; ~6-8 balanced between divisions (spec §3)
  daysPerEpisode: 3,
  partyNights: true,
  romance: true,
  partnerWeeks: true,
};

export function formatOf(options) {
  return FORMATS[options?.format] || FORMATS['vote-callout'];
}
