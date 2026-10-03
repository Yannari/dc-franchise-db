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
import TEXTURE from './texture.js';
import EDITORIAL from './editorial.js';
import ARC from './arc.js';
import COUPLE from './couple.js';
import JURY from './jury.js';
import PLAN from './plan.js';
import KNOWN from './known.js';
import CER from './cer.js';
import ROMANCE from './romance.js';
import UPKEEP from './upkeep.js';
import ENGINE from './engine.js';
import DRINKS from './drinks.js';
import MEETING from './meeting.js';
import SLOP from './slop.js';

export const POOLS = { ...FRICTION, ...CEREMONY, ...TALK, ...SOCIAL, ...DEALS, ...ALLIANCE, ...CAMPAIGN, ...POWER, ...LIFE, ...PHASE, ...BLOC, ...VENUE, ...FALLOUT, ...BOND, ...REIGN, ...SCHEME, ...FOLLOWUP, ...TEXTURE, ...EDITORIAL, ...ARC, ...COUPLE, ...JURY, ...PLAN, ...KNOWN, ...CER, ...ROMANCE, ...UPKEEP, ...ENGINE, ...DRINKS, ...MEETING, ...SLOP };
export const POOL_KEYS = Object.keys(POOLS);
