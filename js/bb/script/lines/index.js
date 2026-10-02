// Every Big Brother line pool, by key '<kind>.<ending>'. A converted event's
// pools are added here; tests/bb-script.test.js checks every one of them.
import FRICTION from './friction.js';

export const POOLS = { ...FRICTION };
export const POOL_KEYS = Object.keys(POOLS);
