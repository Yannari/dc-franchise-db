// Every Big Brother line pool, by key '<kind>.<ending>'. A converted event's
// pools are added here; tests/bb-script.test.js checks every one of them.
import FRICTION from './friction.js';
import CEREMONY from './ceremony.js';
import TALK from './talk.js';
import SOCIAL from './social.js';
import DEALS from './deals.js';
import ALLIANCE from './alliance.js';
import CAMPAIGN from './campaign.js';

export const POOLS = { ...FRICTION, ...CEREMONY, ...TALK, ...SOCIAL, ...DEALS, ...ALLIANCE, ...CAMPAIGN };
export const POOL_KEYS = Object.keys(POOLS);
