// Every plate the Ridonculous Race viewer uses and what it is used for (the audit and the size check read this):
//   node tools/rr-vp-plate-roles.mjs > roles.json
// [{ place, f, slug, url, uses: ['tower/skydeck talk', 'tower/skydeck act (walk)', ...], g, x, water, closed }]
import { PLACE_PLATES, RACE, plateUrl, raceUrl, slugFile } from '../js/vp-rr-ep/plates.js';

const out = new Map();
const add = (place, p, use) => {
  if (!p?.f) return;
  const url = place === 'race' ? raceUrl(p.f) : plateUrl(place, p.f);
  const row = out.get(url) || { place, f: p.f, slug: slugFile(p.f), url, uses: [], g: p.g, x: p.x, water: !!p.water, closed: !!p.closed };
  row.uses.push(use);
  out.set(url, row);
};
for (const [id, pl] of Object.entries(PLACE_PLATES)) {
  add(id, { f: pl.title }, 'title');
  add(id, pl.opener, 'opener');
  (pl.arrive || []).forEach(p => add(id, p, 'arrive'));
  for (const [sid, s] of Object.entries(pl.st)) {
    (s.talk || []).forEach(p => add(id, p, `${sid} talk`));
    if (s.act) add(id, s.act, `${sid} act (${s.act.mode})`);
    for (const [side, sd] of Object.entries(s.sides || {})) {
      (sd.talk || []).forEach(p => add(id, p, `${sid}/${side} talk`));
      if (sd.act) add(id, sd.act, `${sid}/${side} act (${sd.act.mode})`);
    }
  }
}
for (const k of ['gate', 'cabin', 'galley', 'runway']) add('race', RACE[k], k);
add('race', { f: RACE.confess }, 'confessional');
console.log(JSON.stringify([...out.values()], null, 1));
