// The scene catalogue, read from its document (docs/ridonculous-race-scenes.md), and a
// fixture to play any kind in: four teams mid-leg at one stretch.
import { readFileSync } from 'node:fs';
import { raceState } from './rr-cast.js';
import { setPlayers, players } from '../../js/core.js';
import { setGs } from '../../js/core.js';

let _rows = null;
function rows() {
  if (_rows) return _rows;
  const text = readFileSync('docs/ridonculous-race-scenes.md', 'utf8');
  const out = [];
  let fam = 0;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^## (\d+)\./);
    if (h) { fam = Number(h[1]); continue; }
    if (/^## /.test(line)) { fam = 0; continue; }
    const r = line.match(/^\| `([a-z0-9-]+)`/);
    if (r && fam) out.push({ kind: r[1], family: fam });
  }
  return (_rows = out);
}

export function catalogueKinds(family = null) {
  return rows().filter(r => family == null || r.family === family).map(r => r.kind);
}

// A state with four teams at one stretch, everybody present, stress up, a failure on
// the clock. `doerArchetype` sets the first person's archetype (the doer of a scheme).
export function fixtureCtx(kindId, { doerArchetype = null, seed = 5 } = {}) {
  setGs({ bonds: {}, popularity: {} });
  const st = raceState(4, seed);
  st.leg = 3;
  if (doerArchetype) {
    const name = st.teams[st.order[0]].a;
    setPlayers(players.map(p => (p.name === name ? { ...p, archetype: doerArchetype } : p)));
  }
  for (const n of st.people) st.mind[n].stress = 60;
  for (const id of st.order) st.money[id] = 100;
  const [t1, t2] = st.order;
  const stretch = { id: 'fixture', kind: 'botch', types: ['water'], base: 20, pass: 0.5, loopCost: 5, teaser: 'Who?' };
  st.attempts = { [t1]: { fixture: { attempts: 3, fails: 2 } }, [t2]: { fixture: { attempts: 3, fails: 2 } } };
  const delays = [];
  const api = { here: () => st.order.filter(x => x !== t1).map(id => ({ id })), delay: (id, m) => delays.push([id, m]), slot: (i, c, t) => t, now: 100 };
  return { state: st, team: { id: t1 }, other: { id: t2 }, present: [...st.order], stretch, t: 100, api, delays,
    moment: null, event: { fails: 2 } };
}
