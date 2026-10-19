// Prints what js/vp-rr-ep/plates.js needs, for tools/rr-vp-plates.py to copy.
import { PLACE_PLATES, RACE, placeFiles, propFiles, slugFile } from '../js/vp-rr-ep/plates.js';

const places = {};
for (const [id, pl] of Object.entries(PLACE_PLATES)) {
  places[id] = { src: pl.src, files: placeFiles(id).map(f => [f, slugFile(f)]), props: propFiles(id).map(x => [x.key, x.file]) };
}
const race = [...new Set([...['gate', 'cabin', 'galley', 'sky', 'runway'].map(k => RACE[k].f), RACE.map, RACE.confess, RACE.logo, ...RACE.props])];
console.log(JSON.stringify({ places, race }));
