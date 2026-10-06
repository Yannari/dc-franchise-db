// ══════════════════════════════════════════════════════════════════════
// td/script/lines/index.js — every Total Drama camp pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<kind>.<ending>' (a family's '.any' merges with each ending).
// Each file is one family group; entry ids carry the file's own prefix and
// must be unique across all of them (tests/td-script.test.js).
import deals from './deals.js';
import gossip from './gossip.js';

const FILES = [deals, gossip];

export const POOLS = Object.assign({}, ...FILES);
