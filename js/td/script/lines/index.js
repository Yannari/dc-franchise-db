// ══════════════════════════════════════════════════════════════════════
// td/script/lines/index.js — every Total Drama camp pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<kind>.<ending>' (a family's '.any' merges with each ending).
// Each file is one family group; entry ids carry the file's own prefix and
// must be unique across all of them (tests/td-script.test.js).
import deals from './deals.js';
import gossip from './gossip.js';
import plans from './plans.js';
import fallout, { GUARANTEED as falloutG } from './fallout.js';
import caught from './caught.js';
import alliance, { GUARANTEED as allianceG } from './alliance.js';
import pitch, { GUARANTEED as pitchG } from './pitch.js';
import recruit, { GUARANTEED as recruitG } from './recruit.js';
import mind from './mind.js';
import reads from './reads.js';
import ends, { GUARANTEED as endsG } from './ends.js';
import threat from './threat.js';
import camp from './camp.js';
import quit, { GUARANTEED as quitG } from './quit.js';

const FILES = [deals, gossip, plans, fallout, caught, alliance, pitch, recruit, mind, reads, ends, threat, camp, quit];

export const POOLS = Object.assign({}, ...FILES);

/**
 * Names an ending always carries ('fallout.blame.swapped' always has {plan} and
 * {boot}). A line may say a slot its ending guarantees without asking for it;
 * any other optional name needs `when: { slot: true }` (tests/td-script.test.js).
 */
export const GUARANTEED = Object.assign({}, falloutG, allianceG, pitchG, recruitG, endsG, quitG);
