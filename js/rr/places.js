// ══════════════════════════════════════════════════════════════════════
// rr/places.js — the place library: the format, the registry, the check
// ══════════════════════════════════════════════════════════════════════
//
// Spec §5.1. A place is a leg's world: where teams arrive, the local transport,
// and its STRETCHES in route order (travel, tasks, boards, the mat). Every plate of
// a place becomes a stretch (the user: "use it if it can help make the challenge more
// interesting and long"). Places are invented: no real country or city name may
// appear (the World Tour rule, CLAUDE.md). The full library (41 places) is
// sub-project 3; these four play a season until then.
import { TASK_TYPES } from './types.js';
import homeCity from './places/home-city.js';
import redSandDesert from './places/red-sand-desert.js';
import fireMountainIsle from './places/fire-mountain-isle.js';
import skylineFinale from './places/skyline-finale.js';
import ironTowerCity from './places/iron-tower-city.js';
import greatWallHills from './places/great-wall-hills.js';
import rockNorth from './places/rock-north.js';
import savannaFalls from './places/savanna-falls.js';
import treasureIsles from './places/treasure-isles.js';
import tombSands from './places/tomb-sands.js';
import torchStatueHarbour from './places/torch-statue-harbour.js';
import redOutback from './places/red-outback.js';
import coastPalace from './places/coast-palace.js';
import geyserIsland from './places/geyser-island.js';
import carnivalRainforest from './places/carnival-rainforest.js';
import hauntedCastle from './places/haunted-castle.js';

export const PLACES = Object.fromEntries([homeCity, redSandDesert, fireMountainIsle, skylineFinale, ironTowerCity, greatWallHills, rockNorth, savannaFalls, treasureIsles, tombSands, torchStatueHarbour, redOutback,
  coastPalace, geyserIsland, carnivalRainforest, hauntedCastle].map(p => [p.id, p]));

export const getPlace = id => PLACES[id] || null;

// Region order for flight lengths (travel.js: 240 minutes + 120 per hop).
export const REGIONS = ['north', 'desert', 'old-coast', 'ocean', 'far-east'];

const TASK_KINDS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
// Real countries and cities that a description must not name (a sample, kept to the
// likely ones; the place library's own guard grows it).
export const REAL = /\b(japan|france|paris|china|beijing|india|egypt|morocco|brazil|mexico|canada|toronto|new york|london|england|australia|iceland|russia|hawaii|dubai|italy|spain|germany|africa|america|europe|asia|zimbabwe|argentina|bahamas|vietnam|indonesia|finland|romania|transylvania|scotland|singapore|philippines|malta|denmark|sweden|turkey|peru|chile|kenya|tanzania|thailand)\b/i;

function checkTask(s, where, out) {
  if (!Array.isArray(s.types) || !s.types.length) out.push(`${where}: no types`);
  for (const t of s.types || []) if (!TASK_TYPES[t]) out.push(`${where}: unknown type ${t}`);
  if (!(s.base > 0)) out.push(`${where}: no base`);
  if (!(s.pass > 0 && s.pass <= 1)) out.push(`${where}: no pass`);
  if (!(s.loopCost >= 0)) out.push(`${where}: no loopCost`);
}

export function validatePlace(place) {
  const out = [];
  const st = place?.stretches || [];
  if (!st.length) return ['no stretches'];
  for (const s of st) {
    const where = `${place.id}/${s.id}`;
    if (TASK_KINDS.has(s.kind)) {
      if (s.kind === 'either') {
        if (!Array.isArray(s.sides) || s.sides.length !== 2) out.push(`${where}: an Either/Or needs two sides`);
        for (const side of s.sides || []) checkTask(side, `${where}/${side.id}`, out);
      } else checkTask(s, where, out);
      if (!s.desc || s.desc.length < 200) out.push(`${where}: desc under 200 characters (set-up, mechanic, what goes wrong, how to win)`);
      if (s.kind === 'botch' && !s.teaser) out.push(`${where}: a Botch needs a teaser`);
    }
    if (s.kind === 'travel' && !(s.base > 0)) out.push(`${where}: travel without base`);
    const text = [s.desc, s.label, s.teaser, ...(s.sides || []).map(x => `${x.label} ${x.desc || ''}`)].join(' ');
    if (REAL.test(text)) out.push(`${where}: names a real place`);
  }
  if (st.at(-1).kind !== 'mat') out.push(`${place.id}: the last stretch must be the mat`);
  if (place.finale && !st.some(s => s.kind === 'midmat')) out.push(`${place.id}: a finale needs a midpoint mat`);
  return out;
}
