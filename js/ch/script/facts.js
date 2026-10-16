// ══════════════════════════════════════════════════════════════════════
// ch/script/facts.js — what a line may know about its scene
// ══════════════════════════════════════════════════════════════════════
//
// A pool entry's `when` filters on these facts and nothing else; a test
// refuses any other key (manual §19.2 step 3). Facts come from the scene's own
// record — its parts, its ending, its snapshot of how the two stood with each
// other AT THE SCENE (state.js snapOf) — never live state and never a truth a
// speaker has not seen.
import { players } from '../../core.js';
import { pStats } from '../../players.js';

export const CH_FACT_KEYS = [
  'ending',
  // how far into the season: a line about "weeks in here" needs late, a line
  // about first impressions needs early
  'early', 'late',
  // how a and b stood at the scene: enemies | cold | neutral | friends
  'band', 'alliance', 'couple',
  // how a talks, and how b talks (a line written for the voice wins: pick.js)
  'register', 'registerB',
  // vets and rookies; the same original show
  'rookieA', 'rookieB', 'sameShow',
  'nice', 'villain',
  // where and when: a line that stages the pool airs only by the pool
  'place', 'night',
  // the scene names somebody who is not in it (a target, the one who left)
  'known',
  // a third part is in the scene
  'third',
  // the reason an alliance chose its target (plans.js targetScore: threat,
  // grudge, theyGo, use, final)
  'reason',
  // the division of the week, for lines that say "the guys" / "the girls"
  'division',
  // a is in an alliance at the scene (a line about feeling left out needs false)
  'allied',
  // in a call-out: the one called out voted the caller in (a line may say so only then)
  'votedMe',
  // the caller volunteered rather than being voted in
  'volunteer',
  // how the one who left went into the Arena: voted | calledout | volunteered (fallout.js)
  'how',
];

const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
const archOf = n => players.find(p => p.name === n)?.archetype;

// How somebody talks. Narrative selection only (thresholds allowed here,
// never in gameplay). The same reading Big Brother uses, plus the Challenge's
// own: the competitor and the hype voice.
export function registerOf(name) {
  if (!name) return null;
  const arch = archOf(name);
  const s = pStats(name);
  if (VILLAIN.has(arch)) return 'schemer';
  if (['hothead', 'chaos-agent'].includes(arch) || s.temperament <= 3) return 'fiery';
  if (arch === 'challenge-beast' || (s.physical >= 8 && s.boldness >= 6)) return 'competitor';
  if (['goat', 'underdog', 'floater'].includes(arch) || s.social <= 3) return 'shy';
  if (NICE.has(arch)) return 'sweet';
  if (arch === 'perceptive-player' || (s.strategic >= 7 && s.temperament >= 6)) return 'cool';
  return 'plain';
}

const band = b => (b <= -3 ? 'enemies' : b < 0 ? 'cold' : b < 3 ? 'neutral' : 'friends');

export function factsFor(scene, roles, state) {
  const { a, b, c } = roles.roles;
  const snap = scene.snap || {};
  const house = snap.house ?? state.active.length;
  const share = scene.ep / Math.max(1, state.plannedEpisodes || 14);
  const named = Object.values(roles.slots || {}).filter(Boolean);
  const people = Object.values(roles.roles);
  const f = {
    ending: roles.ending ?? 'any',
    early: scene.ep <= 2,
    late: house <= (state.options?.finalists || 8) + 4 || share > 0.7,
    place: scene.spot || null,
    night: ['party', 'hot-tub', 'pool'].includes(scene.spot) || /night|eve/.test(scene.kind),
    known: named.some(n => typeof n === 'string' && state.cast.includes(n) && !people.includes(n)),
    third: !!c,
    reason: roles.slots?.reason || null,
    division: state.episodes.find(e => e.ep === scene.ep)?.division || null,
    votedMe: !!scene.data?.votedMe,
    volunteer: !!scene.data?.volunteer,
    how: scene.data?.how || null,
  };
  if (a) {
    f.register = registerOf(a);
    f.nice = NICE.has(archOf(a));
    f.villain = VILLAIN.has(archOf(a));
    f.rookieA = !!state.rookie[a];
    f.allied = !!snap.allied;
  }
  if (a && b) {
    // The snapshot is about the scene's first two PEOPLE as recorded; the
    // roles may have swapped them, which does not change a bond.
    f.band = snap.bond != null ? band(snap.bond) : 'neutral';
    f.alliance = !!snap.alliance;
    f.couple = !!snap.couple;
    f.registerB = registerOf(b);
    f.rookieB = !!state.rookie[b];
    f.sameShow = !!state.origin[a] && state.origin[a] === state.origin[b];
  }
  return f;
}
