// ══════════════════════════════════════════════════════════════════════
// rr/format.js — the season's rules as data
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3 (the season), §4 (money), §7.6 (penalties, the Amazing Race's fixed table
// read out by Don). Every number here is either the real show's or a call recorded
// in the spec's "My calls".
export const RR_FORMAT = 'ridonculous-race';

export const NON_ELIM_PENALTIES = ['surrender-money', 'surrender-all', 'speed-bump', 'marked', 'departure'];
export const REWARDS = ['cash', 'first-class', 'call-home', 'express', 'save'];

export const DEFAULT_OPTIONS = {
  teams: 12,
  nonElimShare: 1 / 3,
  nonElimPenalty: 'draw',
  money: { min: 50, max: 300, zeroLegs: 1 },
  rewardShare: 1 / 3,
  restMinutes: 720,
  medevacReturn: true,
  boomerangVote: false,
  surprises: true,
  twists: {},
  route: null,
};

// Minutes, served beside the mat.
export const PENALTIES = {
  minor: 15, standard: 30, transport: 30, botchHelp: 30, allInSkip: 30,
  sabotage: 60, botchQuit: 240, eitherSkip: 360, aboveEconomy: 1440,
};
export const MARKED_MINUTES = 30;
export const DEPARTURE_PENALTY = 30;
// what carries from one leg into the next (leg.js): half the check-in gap, ninety minutes at most
export const DEPART_CARRY = 0.5, DEPART_CARRY_MAX = 90;
// a team's form on the day (its tasks and its legs on foot take this many times as long) and its driver's (a taxi, a car)
export const FORM = [0.84, 1.18], DRIVER = [0.75, 1.35];
// A team this far behind the second-last is eliminated where it stands (spec §3).
export const DON_GOES_AFTER = 180;
