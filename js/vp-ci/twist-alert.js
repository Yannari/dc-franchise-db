// ══════════════════════════════════════════════════════════════════════
// vp-ci/twist-alert.js — every twist gets an ALERT that says what it is
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-20: the alerts are "not explained very well, we should
// have a screen with the explanation of the twist in an alert screen". A twist
// aired as a player reading one line of an alert, so a profile swap, a clone,
// a Ride or Die or a secret-Influencer night arrived with nobody ever saying
// how it works.
//
// Now the screen before a twist's first scene is the Circle's alert for it:
// ALERT! slams in, then the twist's name and how it works, a sentence a click,
// in the Circle's voice. The words are the twist's own card (core.js
// TWIST_CATALOG, the one the Season Timeline books from), minus the notes
// written for the author ("Needs two arrivals on the same day...").
import { TWIST_CATALOG } from '../core.js';
import { CIRCLE_FORMAT } from '../shows.js';

// A twist that has a scene of its own.
const BY_SCENE = {
  swap: 'ci-profile-swap', clone: 'ci-clone', 'second-chance': 'ci-second-chance', 'ride-or-die': 'ci-ride-or-die',
  disrupter: 'ci-disrupter', mission: 'ci-secret-mission', 'no-block': 'ci-no-blocking', antivirus: 'ci-antivirus', egg: 'ci-arrive-egg',
};
const cards = () => TWIST_CATALOG.filter(t => t.format === CIRCLE_FORMAT);
const byId = id => cards().find(t => t.id === id) || null;
const byField = (k, v) => (v ? cards().find(t => t[k] === v) || null : null);

// A card's description is written for whoever books it; these sentences are about booking it, not playing it.
const AUTHOR_ONLY = /\b(needs? (two|a|an|at least)|the timeline|booked|book it|pulls|the season still|it was made for|made for|when it is drawn|this card)\b/i;
/** How the twist works, in the sentences the room should hear (at most five). */
export function sentencesOf(desc = '') {
  return String(desc).split(/(?<=[.!?])\s+(?=[A-Z"'])/).map(x => x.trim()).filter(x => x && !AUTHOR_ONLY.test(x)).slice(0, 5);
}

/** The twist a screen opens, or null: its scene kind, an arrival's way in, a power, or a Ratings night that isn't the usual. */
export function twistOf(row, screen) {
  if (BY_SCENE[screen.kind]) return byId(BY_SCENE[screen.kind]);
  if (screen.kind === 'arrival' && screen.d?.entry && screen.d.entry !== 'snoop') return byField('ciEntry', screen.d.entry);
  if (screen.kind === 'power-reveal') return byField('ciPower', screen.d?.power);
  if (screen.kind === 'ratings') {
    const f = row?.ci?.night?.format;
    return f && f !== 'standard' ? byField('ciFormat', f) : null;
  }
  return null;
}

/** The episode's screens with an alert for each twist's first scene (one per twist a day): before it, or, when the
 *  scene is itself an alert the players read (the Disrupter, a mission), straight after it, never two slams in a row. */
export function withTwistAlerts(row, screens) {
  const out = [], seen = new Set();
  for (const screen of screens) {
    const c = twistOf(row, screen);
    const alert = c && !seen.has(c.id) ? explainScreen(c) : null;
    if (alert) seen.add(c.id);
    if (alert && screen.stage === 'alert') out.push(screen, alert);
    else out.push(...(alert ? [alert] : []), screen);
  }
  return out;
}

function explainScreen(c) {
  return { id: `twist-${c.id}`, kind: 'twist', stage: 'explain', who: [], cast: [], title: `Alert: ${c.name}`,
    d: { name: c.name, card: c.id },
    steps: [{ who: null, host: true, part: 'host', text: `Alert! ${c.name}.`, key: 'twist.alert' },
      ...sentencesOf(c.desc).map(text => ({ who: null, host: true, part: 'host', text, key: 'twist.explain' }))] };
}
