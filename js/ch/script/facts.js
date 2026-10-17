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
  // a Pairs season (pairs.js, share-keep.js): how the moment went
  'hesitate', 'champions', 'walks', 'rivals', 'keepWhy', 'pairs',
  // a Teams season (teams.js): the teams standing, two on one team, the winners sending one of their own, owning it
  'teams', 'sameTeam', 'own', 'owns',
  // how far into the season: a line about "weeks in here" needs late, a line
  // about first impressions needs early
  'early', 'late',
  // how a and b stood at the scene: enemies | cold | neutral | friends
  'band', 'alliance', 'couple',
  // a's alliance holds a third of the house or more: only then may a drunk say it "decides everything"
  'strong',
  // a or b is spoken for: a partner at home, not in the cast (state.atHome; {home} is the partner's name)
  'attachedA', 'attachedB',
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
  // the goodbye at the Arena (goodbye.js): a parting shot was taken; they leave on good terms with the winner
  'shot', 'gracious',
  // what a fight is about (cause.js GROUP): vote | talk | clash | dislike. A line may claim only what is true.
  'cause',
  // the mood an Arena winner walks back in with (house.js returnMood): sad | house | alliance | revenge | mock |
  // strategy | comedy | happy
  'mood',
  // how a champion won (final.js pathOf), and the second champion's: showmance | survival | challenge | strategy |
  // drama | friendship | social | grind
  'path', 'pathB',
  // the daily a scene comes out of was a physical one (dailies.js physicality): "the end of the course" needs it
  'physical',
  // somebody besides the scene's own people is in it (state.js crowdOf: x is there). A line said to the room
  // ("in front of everybody", "you all") needs it, and a crowd version of a scene wins when there is a crowd.
  'crowd',
  // the name at a vote, as it stood then (vote.js houseVote on): two or more wins (dailies and Arenas); never been
  // in the Arena; the biggest bank in the house. A ballot's reason may claim only what is true.
  'proven', 'neverIn', 'richest',
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
    shot: !!scene.data?.shot,
    gracious: !!scene.data?.gracious,
    cause: scene.data?.causeType || null,
    mood: scene.data?.mood || null,
    path: scene.data?.path || null,
    pathB: scene.data?.pathB || null,
    physical: scene.data?.physical ?? null,
    crowd: !!roles.roles.x,
    proven: scene.data?.on ? !!scene.data.on.proven : null,
    neverIn: scene.data?.on ? !!scene.data.on.neverIn : null,
    richest: scene.data?.on ? !!scene.data.on.richest : null,
    strong: scene.data?.strong ?? null,
    // a Pairs season's scenes (pairs.js, share-keep.js): how the moment went, for the entries written for one way of it
    hesitate: !!scene.data?.hesitate,
    champions: !!scene.data?.champions,
    walks: !!scene.data?.walks,
    rivals: !!scene.data?.rivals,
    keepWhy: scene.data?.why && ['share-keep'].includes(scene.kind) ? scene.data.why : null,
    pairs: !!state.options?.pairs,
    // a Teams season while the teams stand; a and b on the same team
    teams: !!scene.snap?.teams,
    sameTeam: !!(scene.snap?.teams && a && b && scene.snap.teams[a] && scene.snap.teams[a] === scene.snap.teams[b]),
    own: !!scene.data?.own,
    owns: !!scene.data?.owns,
  };
  if (a) {
    f.register = registerOf(a);
    f.nice = NICE.has(archOf(a));
    f.villain = VILLAIN.has(archOf(a));
    f.rookieA = !!state.rookie[a];
    f.allied = !!snap.allied;
    f.attachedA = !!state.atHome?.[a];
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
    f.attachedB = !!state.atHome?.[b];
  }
  return f;
}
