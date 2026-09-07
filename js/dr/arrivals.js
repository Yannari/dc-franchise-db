// ══════════════════════════════════════════════════════════════════════
// dr/arrivals.js — the premiere, one queen at a time
// ══════════════════════════════════════════════════════════════════════
//
// The first episode's biggest scene and the one this show did not have.
// Each queen comes through the door, says her line, the room answers, she
// tells them who she is — what she does, how long she has been doing drag,
// where she is from — and then the host arrives and the season starts.
//
// ── WHY THE BEATS ARE SEPARATE ────────────────────────────────────────
//
// Five beats, not one paragraph: `walk`, `intro`, `backstory`, `room`,
// and the host's arrival at the end. The viewing party reveals them one at
// a time, which is what an entrance IS — and a single blob would reveal
// twelve queens in twelve clicks instead of the fifty-odd moments the scene
// actually contains.
//
// ── AND WHY AN EMPTY POOL IS NOT A HOLE ───────────────────────────────
//
// Three of the five pools are written and three are not yet (see
// js/dr/data/entrances.js and docs/drag-race-arrivals-brief.md). A beat
// whose pool is empty is SKIPPED, not rendered blank: the screen never
// shows a card waiting for text, and the day a pool is filled the beat
// starts appearing without this file or the screen being touched.
import {
  ENTRANCE_LINES, ENTRANCE_REACTIONS, ARRIVAL_INTROS, ARRIVAL_BACKSTORY, ARRIVAL_HOST,
  ARRIVAL_IMPRESSIONS,
  entranceAttitude, entranceLanding,
} from './data/entrances.js';
import { dragOf, starPower } from './queen.js';

const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

/**
 * Draw without replacement while the pool lasts.
 *
 * Twelve queens sharing three styles will collide on a small pool, and two
 * queens delivering the same entrance line in one episode is the single most
 * visible repetition this screen can produce.
 */
function drawer(rng) {
  const used = new Set();
  return (list, key = '') => {
    if (!Array.isArray(list) || !list.length) return '';
    const fresh = list.filter(x => !used.has(key + x));
    const chosen = pick(rng, fresh.length ? fresh : list);
    used.add(key + chosen);
    return chosen;
  };
}

/**
 * How long she has been doing drag, from her age.
 *
 * PROPORTIONAL, not a lookup: most queens start somewhere between eighteen
 * and their mid-twenties, so the number follows the age she actually has
 * rather than a table. Floored at one year — nobody arrives having started
 * last week, and "0 years" is a sentence about a typo.
 */
export function yearsInDrag(player, rng = Math.random) {
  const age = Math.max(19, Math.min(60, Number(player?.age) || 26));
  const started = 18 + Math.floor(rng() * 7);
  return Math.max(1, age - started);
}

const fill = (text, vars) => String(text || '')
  .replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));

const STYLE_WORDS = {
  pageant: 'a pageant queen', comedy: 'a comedy queen', fashion: 'a fashion queen',
  camp: 'a camp queen', 'club-kid': 'a club kid', spooky: 'a spooky queen',
  broadway: 'a Broadway queen', dancer: 'a dancer', glamour: 'a glamour queen',
  art: 'an art queen',
};

/**
 * The premiere's arrival scenes, in the order the queens came through.
 *
 * Returns scenes in the engine's own shape — `{ step, kind, data, text }` —
 * so the registry files them like any other and the transcript retranscribes
 * them without knowing they are special.
 */
export function arrivalScenes({ cast = [], players = {}, rng = Math.random, star = {} } = {}) {
  if (!cast.length) return [];
  const draw = drawer(rng);
  const out = [{ step: 'arrivals', kind: 'arrivals', data: { cast: [...cast] }, text: '' }];

  cast.forEach((name, i) => {
    const p = players[name] || {};
    const stats = p.stats || {};
    const d = dragOf(p);
    const already = cast.slice(0, i);
    const other = already.length ? pick(rng, already) : '';
    const vars = {
      a: name,
      b: other,
      /* THE PROFILE THE STUDIO ALREADY FILLED IN. `hometown`, `occupation`
         and `backstory` are authored fields on the player record — the
         Casting Studio has boxes for all three and 43 of the roster already
         carry them. Inventing a city here would put a fact on screen that
         contradicts her own article. Where a field is genuinely absent the
         line that needs it is DROPPED rather than filled with a guess: see
         `usable` below. */
      city: p.hometown || '',
      job: p.occupation || '',
      years: yearsInDrag(p, rng),
      style: STYLE_WORDS[d.style] || 'a queen',
    };

    // 1. THE WALK — her line, and the room's answer.
    const attitude = entranceAttitude(stats, rng);
    const pool = (ENTRANCE_LINES[d.style] || ENTRANCE_LINES.camp)[attitude] || [];
    const line = draw(pool, `${d.style}:${attitude}:`);
    if (line) {
      out.push({
        step: 'arrivals', kind: 'arrival:walk',
        data: { players: [name], attitude, style: d.style, order: i + 1, line },
        text: `"${fill(line, vars)}"`,
      });
      const landing = entranceLanding(stats, {
        star: star[name] ?? starPower?.(p) ?? 5, position: i, castSize: cast.length,
      }, rng);
      /* SHE CAN ONLY BE ANSWERED BY QUEENS WHO ARE ALREADY IN THE ROOM.
         `{b}` is drawn from `already` — the ones through the door before her
         — and the FIRST queen has nobody at all, so lines that name somebody
         are filtered out for her rather than substituted. Without this she
         reacted to herself, which is the one arrival nobody wants. */
      const pool2 = (ENTRANCE_REACTIONS[landing] || [])
        .filter(t => (other ? true : !String(t).includes('{b}')));
      const react = draw(pool2, `react:${landing}:`);
      if (react) {
        // A room that roars for her has made her a friend; a room that goes
        // quiet has not cost her one, it has simply given her nothing.
        const worth = { roars: 2, warm: 1, polite: 0, cool: 0 }[landing] || 0;
        out.push({
          step: 'arrivals', kind: 'arrival:room',
          data: { players: other ? [name, other] : [name], landing },
          bond: other && worth ? [[name, other, worth]] : [],
          pop: { [name]: { roars: 1.2, warm: 0.5, polite: 0, cool: -0.4 }[landing] || 0 },
          text: fill(react, vars),
        });
      }
    }

    /* 1b. THE FIRST IMPRESSION, AND WHAT IT COSTS.
       This is the moment the room's relationships are actually made: she
       walks in, somebody already standing there decides something about her,
       and that decision is a bond the whole season is played on top of. A
       premiere whose arrivals cost nothing would be twelve entrances into a
       room with no opinions in it — and "every event must have gameplay
       consequences" is the project's oldest rule.

       Shady or nice is HER read of the room, not the room's read of her: it
       runs on the watching queen's loyalty and temperament against the
       arriving queen's boldness, so a warm room warms and a sharp one does
       not. Proportional throughout; the size of the bond follows how hard
       the entrance landed rather than a fixed step. */
    if (other) {
      const watcher = players[other] || {};
      const ws = watcher.stats || {};
      const n = (o, k) => Math.max(1, Math.min(10, Number(o[k]) || 5));
      const generosity = n(ws, 'loyalty') * 0.5 + n(ws, 'temperament') * 0.4
        + n(ws, 'social') * 0.3 - n(stats, 'boldness') * 0.35;
      const warmth = generosity + (rng() - 0.5) * 3.4;
      const nice = warmth >= 3.4;
      const size = Math.max(1, Math.round(Math.abs(warmth - 3.4) * 0.55 + 0.6));
      out.push({
        step: 'arrivals', kind: 'arrival:impression',
        data: { players: [other, name], nice, size },
        bond: [[other, name, nice ? size : -size]],
        pop: nice ? {} : { [name]: -0.2 },
        // The bond is real whether or not the pool has a sentence for it yet;
        // the screen draws the arrow either way.
        text: fill(draw(ARRIVAL_IMPRESSIONS[nice ? 'nice' : 'shady'] || [],
          `imp:${nice}:`), { ...vars, a: name, b: other }),
      });
    }

    /* 2-3. INTRO and BACKSTORY — pending prose. An empty pool means the
       beat does not happen yet, rather than a card with nothing in it. */
    /* A LINE MAY ONLY ASK FOR A FACT SHE HAS. A queen with no hometown on
       her record gets an intro that does not mention one, rather than "I'm
       from ." or an invented city — the profile is authored data and this
       screen is not allowed to make some up. */
    const usable = list => (list || []).filter(t => Object.entries(vars)
      .every(([k, v]) => v !== '' || !String(t).includes(`{${k}}`)));
    const intro = draw(usable(ARRIVAL_INTROS[attitude]), `intro:${attitude}:`);
    if (intro) {
      out.push({
        step: 'arrivals', kind: 'arrival:intro',
        data: { players: [name], years: vars.years, city: vars.city, job: vars.job },
        text: fill(intro, vars),
      });
    }
    const back = draw(usable(ARRIVAL_BACKSTORY[d.style]), `back:${d.style}:`);
    if (back) {
      out.push({
        step: 'arrivals', kind: 'arrival:backstory',
        data: { players: [name], style: d.style },
        text: fill(back, vars),
      });
    } else if (p.backstory) {
      /* HER OWN, WHERE SHE HAS ONE. A player written in the Studio carries a
         `backstory` paragraph, and it is better than any pool line because it
         is about HER. The pool is the fallback for a roster player nobody has
         written up yet, not the other way round. */
      out.push({
        step: 'arrivals', kind: 'arrival:backstory',
        data: { players: [name], style: d.style, authored: true },
        text: String(p.backstory).trim(),
      });
    }
  });

  // 4. THE HOST, once the room is full.
  const mood = cast.length >= 12 ? 'loud' : cast.length <= 8 ? 'nervous' : 'ready';
  const host = draw(ARRIVAL_HOST[mood] || [], 'host:');
  if (host) {
    out.push({
      step: 'arrivals', kind: 'arrival:host', data: { players: [], mood },
      text: fill(host, { a: 'RuPaul', b: cast[0] || '' }),
    });
  }
  return out;
}
