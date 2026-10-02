// Every Big Brother line pool, by key '<kind>.<ending>'. A converted event's
// pools are added here; tests/bb-script.test.js checks every one of them.
import FRICTION from './friction.js';
import CEREMONY from './ceremony.js';
import TALK from './talk.js';
import SOCIAL from './social.js';

export const POOLS = { ...FRICTION, ...CEREMONY, ...TALK, ...SOCIAL };
export const POOL_KEYS = Object.keys(POOLS);
