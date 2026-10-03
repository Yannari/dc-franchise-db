// Every Big Brother line pool, by key '<kind>.<ending>'. A converted event's
// pools are added here; tests/bb-script.test.js checks every one of them.
import FRICTION from './friction.js';
import CEREMONY from './ceremony.js';
import TALK from './talk.js';
import SOCIAL from './social.js';
import DEALS from './deals.js';
import ALLIANCE from './alliance.js';
import CAMPAIGN from './campaign.js';
import POWER from './power.js';
import LIFE from './life.js';
import PHASE from './phase.js';
import BLOC from './bloc.js';
import VENUE from './venue.js';
import FALLOUT from './fallout.js';
import BOND from './bond.js';
import REIGN from './reign.js';
import SCHEME from './scheme.js';
import FOLLOWUP from './followup.js';

export const POOLS = { ...FRICTION, ...CEREMONY, ...TALK, ...SOCIAL, ...DEALS, ...ALLIANCE, ...CAMPAIGN, ...POWER, ...LIFE, ...PHASE, ...BLOC, ...VENUE, ...FALLOUT, ...BOND, ...REIGN, ...SCHEME, ...FOLLOWUP };
export const POOL_KEYS = Object.keys(POOLS);
