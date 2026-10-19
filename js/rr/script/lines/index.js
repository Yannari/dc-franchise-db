// The Ridonculous Race's line pools, by family. Each file exports { '<kind>.<ending>': [entries] };
// a key in a later file adds to the pool of that name (never replaces it).
//
// The quality gate runs at load (The Challenge's, ch/script/lines/index.js; the user, 2026-10-16:
// "why does it sound badly translated from another language"). A variant that fails goes, and the
// line as written, which always fits the turns around it, speaks instead:
//   fragments  three sentences or more, two of them three-word shouts ("You and me! Final! Together!")
//   dropped    under 45% of a line of ten words or more: the meaning is gone
//   stock      a line of five words or more pasted onto three different turns: not written for this one
//   nameless   the line says who (somebody other than the speaker) and the variant names nobody
import partners from './partners.js';
import partners1 from './partners-1.js';
import partners2 from './partners-2.js';
import partners3 from './partners-3.js';
import partners4 from './partners-4.js';
import partners5 from './partners-5.js';
import don from './don.js';
import tasks from './tasks.js';
import teams1 from './teams-1.js';
import teams2 from './teams-2.js';
import rooms from './rooms.js';
import romance from './romance.js';
import localsMoney from './locals-money.js';
import infoSabotage from './info-sabotage.js';
import bodyPlace from './body-place.js';
import donTwists from './don-twists.js';
import interviews from './interviews.js';
import more1 from './more-1.js';
import more2 from './more-2.js';
import more3 from './more-3.js';
import more4 from './more-4.js';
import finale from './finale.js';
import montage from './montage.js';
import ride from './ride.js';
import narration from './narration.js';
import mindGame from './rewrite/mind-game.js';
import celebrate from './rewrite/celebrate.js';
import shareInfo from './rewrite/share-info.js';
import trashTalk from './rewrite/trash-talk.js';
import fear from './rewrite/fear.js';
import snapRw from './rewrite/snap.js';
import talkRw from './rewrite/talk.js';
import interviewsRw from './rewrite/interviews.js';
import betweenTeams from './rewrite/between-teams.js';
import partnersRw from './rewrite/partners.js';
import roomsRw from './rewrite/rooms.js';
import donPlaceRw from './rewrite/don-place.js';
import goodbyes from './rewrite/goodbyes.js';
import sabotageRw from './rewrite/sabotage.js';
import schemesRw from './rewrite/schemes.js';
import romanceRw from './rewrite/romance.js';
import localsMoneyRw from './rewrite/locals-money.js';
import partnersChoices from './rewrite/partners-choices.js';
import partnersStrain from './rewrite/partners-strain.js';
import partnersHeart from './rewrite/partners-heart.js';
import partnersRoles from './rewrite/partners-roles.js';
import betweenTeams2 from './rewrite/between-teams-2.js';
import body1 from './rewrite/body-1.js';
import body2 from './rewrite/body-2.js';
import twistsRw from './rewrite/twists.js';
import donRest from './rewrite/don-rest.js';
import intSecret from './rewrite/int-secret.js';
import volDonPlace from './rewrite/vol-don-place.js';
import volQuick from './rewrite/vol-quick.js';
import volTravel from './rewrite/vol-travel.js';
import volTalk1 from './rewrite/vol-talk-1.js';
import volTalk2 from './rewrite/vol-talk-2.js';
import volFriction from './rewrite/vol-friction.js';
import volPartners from './rewrite/vol-partners.js';
import volNerve from './rewrite/vol-nerve.js';
import redSandDesert from './places/red-sand-desert.js';

const FILES = [partners, partners1, partners2, partners3, partners4, partners5, don, tasks, teams1, teams2, rooms, romance,
  localsMoney, infoSabotage, bodyPlace, donTwists, interviews, more1, more2, more3, more4, finale, montage, ride, narration, redSandDesert];

// The rewrite (lines/rewrite/, docs/rr-writers-brief.md "The rewrite standard"): each file brings its pools and
// retires the old lines they replace, a whole pool ('mind-game.rattled') or the old interview lines for one kind
// of moment ({ key: 'int-strategy.proud', cause: 'mind-game' }).
export const REWRITES = [mindGame, celebrate, shareInfo, trashTalk, fear, snapRw, talkRw, interviewsRw, betweenTeams, partnersRw, roomsRw, donPlaceRw, goodbyes, sabotageRw, schemesRw, romanceRw, localsMoneyRw, partnersChoices, partnersStrain, partnersHeart, partnersRoles, betweenTeams2, body1, body2, twistsRw, donRest, intSecret, volDonPlace, volQuick, volTravel, volTalk1, volTalk2, volFriction, volPartners, volNerve];
const ownPlace = e => e.when?.place != null || e.when?.taskId != null;
const retired = (key, e) => !ownPlace(e) && REWRITES.some(rw => rw.retire.some(r => (typeof r === 'string' ? r === key
  : r.key === key && [].concat(e.when?.cause).includes(r.cause))));

export const POOLS = {};
for (const f of FILES) for (const [k, list] of Object.entries(f)) (POOLS[k] ||= []).push(...list.filter(e => !retired(k, e)));
for (const rw of REWRITES) for (const [k, list] of Object.entries(rw.pools)) (POOLS[k] ||= []).push(...list);
// a retired pool with nothing left in it is not a pool
for (const k of Object.keys(POOLS)) if (!POOLS[k].length) delete POOLS[k];

const words = s => String(s).replace(/\{[^}]+\}/g, 'X').split(/\s+/).filter(Boolean).length;
const sentences = s => String(s).split(/(?<=[.!?])\s+/).filter(Boolean);
const namesIn = (s, by) => new Set([...String(s).matchAll(/\{(\w+)(?:\.\w+)?\}/g)].map(m => m[1]).filter(n => n !== by));
export function variantFails(v, base, stock = 0, by = null) {
  const ss = sentences(v);
  const named = namesIn(String(base).replace(/^\{\w+\}[,!]\s*/, '').replace(/,\s*\{\w+\}(?=[.!?])/g, ''), by);
  if (named.size && words(base) >= 9 && !namesIn(v, by).size) return 'nameless';
  if (ss.length >= 3 && ss.filter(x => x.endsWith('!') && words(x) <= 3).length >= 2) return 'fragments';
  if (words(base) >= 10 && words(v) < words(base) * 0.45) return 'dropped';
  if (stock >= 3 && words(v) >= 5) return 'stock';
  return null;
}

const stockUse = {};
for (const list of Object.values(POOLS)) for (const e of list) e.turns.forEach((t, i) => {
  for (const [tag, vs] of Object.entries(t.v || {})) if (!tag.startsWith('rel:')) for (const v of [vs].flat()) (stockUse[v] ||= new Set()).add(`${e.id}:${i}`);
});
export const PRUNED = { fragments: 0, dropped: 0, stock: 0, nameless: 0 };
for (const list of Object.values(POOLS)) for (const e of list) for (const t of e.turns) {
  if (!t.v) continue;
  const base = t.say || t.conf || '';
  const kept = {};
  for (const [tag, vs] of Object.entries(t.v)) {
    const ok = [vs].flat().filter(v => { const why = variantFails(v, base, stockUse[v]?.size || 0, t.by); if (why) PRUNED[why]++; return !why; });
    if (ok.length) kept[tag] = ok.length === 1 ? ok[0] : ok;
  }
  t.v = Object.keys(kept).length ? kept : undefined;
}
