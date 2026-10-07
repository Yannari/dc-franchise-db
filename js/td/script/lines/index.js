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
import adv, { GUARANTEED as advG } from './adv.js';
import tail, { GUARANTEED as tailG } from './tail.js';
import tests from './tests.js';
import last, { GUARANTEED as lastG } from './last.js';
import isle, { GUARANTEED as isleG } from './isle.js';
import isleGroup from './isle-group.js';
import isleTrain from './isle-train.js';
import isleMore from './isle-more.js';
import drama from './drama.js';
import drama2, { GUARANTEED as drama2G } from './drama2.js';
import dramaMore from './drama-more.js';
import romance from './romance.js';
import romance2, { GUARANTEED as romance2G } from './romance2.js';
import friend from './friend.js';
import life from './life.js';
import lifeMore from './life-more.js';
import twist from './twist.js';
import plot, { GUARANTEED as plotG } from './plot.js';
import morning from './morning.js';
import blind from './blind.js';
import broker, { GUARANTEED as brokerG } from './broker.js';
import credit from './credit.js';
import goat, { GUARANTEED as goatG } from './goat.js';
import idol, { GUARANTEED as idolG } from './idol.js';
import villain from './villain.js';
import save, { GUARANTEED as saveG } from './save.js';
import slips, { GUARANTEED as slipsG } from './slips.js';
import aside from './aside.js';
import crowd, { GUARANTEED as crowdG } from './crowd.js';
import cross, { GUARANTEED as crossG } from './cross.js';

const FILES = [deals, gossip, plans, fallout, caught, alliance, pitch, recruit, mind, reads, ends, threat, camp, quit, adv, tail, tests, last, isle, isleGroup, isleTrain, isleMore, drama, drama2, dramaMore, romance, romance2, friend, life, lifeMore, twist, plot, morning, blind, broker, credit, goat, idol, villain, save, slips, aside, crowd, cross];

// A key may be written in more than one file (the island pools grow by file): its entries add up.
export const POOLS = {};
for (const f of FILES) for (const [k, v] of Object.entries(f)) POOLS[k] = POOLS[k] ? [...POOLS[k], ...v] : [...v];

/**
 * Names an ending always carries ('fallout.blame.swapped' always has {plan} and
 * {boot}). A line may say a slot its ending guarantees without asking for it;
 * any other optional name needs `when: { slot: true }` (tests/td-script.test.js).
 */
export const GUARANTEED = Object.assign({}, falloutG, allianceG, pitchG, recruitG, endsG, quitG, advG, tailG, lastG, isleG, drama2G, romance2G, plotG, brokerG, goatG, idolG, saveG, slipsG, crowdG, crossG);
