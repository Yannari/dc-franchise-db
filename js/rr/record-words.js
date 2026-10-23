// ══════════════════════════════════════════════════════════════════════
// rr/record-words.js — the race's record, said in words: what the wiki and the awards print
// ══════════════════════════════════════════════════════════════════════
//
// The leg record (rr/leg-record.js) keeps machine ids: a penalty's reason is "refuse:holds", a fear ends
// "talked-down", a twist is "boomerang-blind". The season's article (rr/wiki.js) and its awards (rr/awards.js)
// both say them, so both take the words from here. PURE.

/** Every leg of a season document, the final last, each with its leg number. */
export function legsOf(doc) {
  const legs = (doc?.votingHistory || []).map((h, i) => ({ ...h, leg: h.leg ?? i + 1 }));
  if (doc?.final) legs.push({ ...doc.final, leg: doc.final.leg ?? legs.length + 1, isFinal: true });
  return legs;
}

/** A team as a sentence says it: "the Cowboys", but "Noah & Topher". */
export const teamName = (t, start = false) => {
  if (!t) return '';
  const s = /&| and /.test(t) || /^the /i.test(t) ? t : `the ${t}`;
  return start ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};

export const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const ordinal = n => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const t = v % 100;
  if (t >= 11 && t <= 13) return `${v}th`;
  return `${v}${['th', 'st', 'nd', 'rd'][v % 10] || 'th'}`;
};

const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const count = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));

/** 70 → "an hour and 10 minutes"; 0 → "less than a minute". */
export function minutesWords(m) {
  const v = Math.round(Math.abs(Number(m) || 0));
  if (v === 0) return 'less than a minute';
  if (v < 60) return `${v} minute${v === 1 ? '' : 's'}`;
  const h = Math.floor(v / 60), r = v % 60;
  const hours = h === 1 ? 'an hour' : `${h} hours`;
  return r ? `${hours} and ${r} minute${r === 1 ? '' : 's'}` : hours;
}

/** "a 30-minute penalty", "a one-hour penalty", "a penalty of an hour and 10 minutes". */
export function penaltyPhrase(m) {
  const v = Math.round(Number(m) || 0);
  if (v > 0 && v < 60) return `a ${v}-minute penalty`;
  if (v > 0 && v % 60 === 0) return `a ${count(v / 60)}-hour penalty`;
  return `a penalty of ${minutesWords(v)}`;
}

/** "Lacey and Anita", "Lacey, Anita and Will". */
export const andList = xs => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

// why a team served time at the mat (rr/leg-record.js penaltyReasons)
const PENALTY = {
  'refuse:holds': 'refusing a challenge',
  'watching-botch:coach-illegal': 'coaching a partner at Botch or Watch',
  'helped-botch': 'helping a partner at Botch or Watch',
  'quit-task': 'quitting a challenge',
  'quit-talk:quits-task': 'quitting a challenge',
  'allin-alone': 'doing an All-In alone',
  'comeuppance:penalty': 'their earlier sabotage catching up with them',
  'carried from a non-elimination leg': 'coming last on the non-elimination leg before',
  'marked for a penalty': 'a penalty marked on the leg before',
};
export function penaltyLabel(reason) {
  if (PENALTY[reason]) return PENALTY[reason];
  if (/:seen$/.test(reason || '')) return 'being caught sabotaging another team';
  return 'a penalty';
}

export const TWISTS = {
  boomerang: 'Boomerang', 'boomerang-vote': 'Boomerang vote', 'boomerang-blind': 'Blind Boomerang',
  yield: 'Yield', 'zip-it': 'Zip It', 'head-to-head': 'Head-to-Head', intersection: 'Intersection',
};
export const twistName = t => TWISTS[t] || cap(String(t || '').replace(/-/g, ' '));

export const KIND = { either: 'Either/Or', botch: 'Botch or Watch', allin: 'All-In', route: 'Challenge', superteam: 'Super-team' };

const REL = {
  'parent-child': 'parent and child', 'grandparent-grandchild': 'grandparent and grandchild', 'newly-dating': 'newly dating',
  'on-off': 'on and off', 'once-engaged': 'once engaged', bffs: 'best friends', 'reality-vets': 'reality-show veterans',
};
export const relWords = r => (r ? REL[r] || r.replace(/-/g, ' ') : '');

// what the last team of a non-elimination leg paid (rr/format.js NON_ELIM_PENALTIES)
const NON_ELIM = {
  'surrender-money': 'had to hand over all their money',
  'surrender-all': 'had to hand over their money and their bags',
  'speed-bump': 'got a Speed Bump on the next leg',
  marked: 'were marked for a penalty at the next Chill Zone',
  departure: 'set off half an hour late on the next leg',
};
export const nonElimWords = p => NON_ELIM[p] || 'took a penalty';

// what the first team won (rr/format.js REWARDS)
const REWARD = { cash: 'a cash prize', 'first-class': 'first-class tickets', 'call-home': 'a call home',
  express: 'the Express Pass', save: 'the Save' };
export const rewardWords = k => REWARD[k] || 'a prize';

// how a fear ended, as a verb phrase after the racer's name
const FEAR = {
  'phobia:overcomes': 'beat a fear', 'phobia:freezes': 'froze with fear', 'phobia:panic-break': 'panicked and pushed through',
  'phobia:talked-down': 'was talked through a fear',
  'fear-through:talked-down': 'was talked through a fear', 'fear-through:freezes': 'froze with fear',
  'fear-through:swap': 'handed a fear to their partner',
  'refuse:relents': 'refused a challenge, then gave in', 'refuse:holds': 'refused a challenge outright',
  'refuse:adapts': 'refused, then found another way through',
};
export const fearWords = (kind, ending) => FEAR[`${kind}:${ending}`] || (kind === 'refuse' ? 'refused a challenge' : 'faced a fear');
export const FEAR_BEATEN = new Set(['overcomes', 'talked-down', 'panic-break', 'relents']);

const HURT = {
  'injury:serious': 'was badly hurt', 'injury:minor': 'got hurt', 'illness:pushes-through': 'raced sick',
  'exhaustion:collapse': 'collapsed from exhaustion',
};
export const hurtWords = (kind, ending) => HURT[`${kind}:${ending}`]
  || (kind === 'illness' ? 'got sick' : kind === 'exhaustion' ? 'collapsed from exhaustion' : 'got hurt');

/** A challenge or stretch's name as a sentence says it ("the airport" stays lower case). */
export const stretchName = (legs, leg, id) => {
  const h = legs.find(x => x.leg === leg);
  return h?.challenges?.find(c => c.id === id)?.name || h?.route?.find(r => r.id === id)?.name || null;
};
