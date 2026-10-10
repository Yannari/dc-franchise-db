// td/story/kits/index.js — every character kit (td/story/kits.js), by name; kits-deep.js adds the
// parts the pair scenes use (defend, deep)
import kits1 from './kits1.js';
import kits2 from './kits2.js';
import kits3 from './kits3.js';
import deep from './kits-deep.js';

const KITS = Object.assign({}, kits1, kits2, kits3);
for (const [n, k] of Object.entries(deep)) if (KITS[n]) Object.assign(KITS[n], k);
export default KITS;
