// ══════════════════════════════════════════════════════════════════════
// rr/clock.js — one clock for every team in a leg
// ══════════════════════════════════════════════════════════════════════
//
// Spec §6. A leg is a route of stretches. Every team moves through them in the
// order its clock reaches its next stretch (ties: the order the teams were given,
// i.e. last leg's placements), so the world is always consistent: two teams at the
// same stretch at the same minute can meet, and a team that left a place before
// another arrived never sees it.
//
// The clock knows nothing about tasks or money. `resolve(team, stretch, t, api)`
// says what a stretch costs ({ end }, { hold }, { end, skip }, { end, back }, { out, end }); the clock keeps the log, the queue, the stations
// (`slot`), the vehicles that wait to fill (`vehicle`) and pushes (`delay`).

export function runLeg({ teams, stretches, resolve }) {
  const runners = teams.map((x, order) => ({ id: x.id, t: x.t, i: 0, order, arrived: null, done: false }));
  const byId = Object.fromEntries(runners.map(r => [r.id, r]));
  const log = [];
  const finish = {};
  const out = [];
  const free = {};      // stretchId -> station free times
  const groups = {};    // stretchId -> [{ first, members, departs }]
  const waiting = {};   // stretchId -> { id: since }
  const idxOf = id => stretches.findIndex(s => s.id === id);
  let current = null;

  const alive = () => runners.filter(r => !r.done);

  const api = {
    get now() { return current ? current.t : 0; },
    here(stretchId, t) {
      const me = current?.id;
      const seen = new Map();
      for (const l of log) {
        if (l.stretch === stretchId && l.id !== me && l.from <= t && t < l.to) seen.set(l.id, { id: l.id, from: l.from, to: l.to });
      }
      for (const [id, since] of Object.entries(waiting[stretchId] || {})) {
        if (id !== me && since <= t && !seen.has(id)) seen.set(id, { id, from: since, to: Infinity });
      }
      return [...seen.values()];
    },
    // push a team's running stretch back (or, negative, bring it forward, never before now)
    delay(id, minutes) {
      const r = byId[id];
      if (!r || r.done || !minutes) return;
      const last = [...log].reverse().find(l => l.id === id);
      if (minutes > 0) {
        if (last && last.to > api.now) last.to += minutes;
        r.t += minutes;
        return;
      }
      if (!last || last.to <= api.now) return;
      const to = Math.max(api.now, last.to + minutes);
      r.t -= last.to - to;
      last.to = to;
    },
    slot(stretchId, capacity, t, dur) {
      const f = (free[stretchId] ||= Array(Math.max(1, capacity)).fill(-Infinity));
      let k = 0;
      for (let j = 1; j < f.length; j++) if (f[j] < f[k]) k = j;
      const start = Math.max(t, f[k]);
      f[k] = start + dur;
      return start;
    },
    remaining(stretchId) {
      const at = idxOf(stretchId);
      return alive().filter(r => r.id !== current?.id && r.i <= at).length;
    },
    vehicle(stretchId, { waitFor = 1, maxWait = 60 } = {}, id, t) {
      const list = (groups[stretchId] ||= []);
      let g = list.find(x => x.members.includes(id));
      if (!g) {
        g = list.find(x => x.departs == null);
        if (!g) { g = { first: t, members: [], departs: null }; list.push(g); }
        g.members.push(id);
      }
      if (g.departs == null) {
        const at = idxOf(stretchId);
        const others = alive().filter(r => !g.members.includes(r.id) && r.i <= at).length;
        if (g.members.length >= waitFor || others === 0 || t >= g.first + maxWait) {
          g.departs = t;
          // everybody already aboard leaves now
          for (const m of g.members) if (m !== id && byId[m] && !byId[m].done) byId[m].t = Math.min(byId[m].t, t);
        }
      }
      return { departs: g.departs, group: g };
    },
  };

  for (;;) {
    const live = alive();
    if (!live.length) break;
    current = live.reduce((a, b) => (b.t < a.t || (b.t === a.t && b.order < a.order) ? b : a));
    const r = current;
    if (r.i >= stretches.length) { finish[r.id] = r.t; r.done = true; continue; }
    const s = stretches[r.i];
    if (r.arrived == null) r.arrived = r.t;
    const res = resolve({ id: r.id }, s, r.t, api) || { end: r.t };
    if (res.hold != null) {
      (waiting[s.id] ||= {})[r.id] ??= r.arrived;
      r.t = Math.max(r.t, res.hold);
      continue;
    }
    if (waiting[s.id]) delete waiting[s.id][r.id];
    const end = Math.max(r.t, res.end ?? r.t);
    log.push({ id: r.id, stretch: s.id, from: r.arrived, to: end });
    r.arrived = null;
    r.t = end;
    if (res.out) { out.push(r.id); r.done = true; continue; }
    // `back: n`: a Boomerang sends a team back to the stretch n before this one, to run it again
    r.i = res.back ? Math.max(0, r.i - res.back) : r.i + 1 + (res.skip || 0);
  }
  current = null;
  return { log, finish, out };
}
