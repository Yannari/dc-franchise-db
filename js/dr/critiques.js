// ══════════════════════════════════════════════════════════════════════
// dr/critiques.js — what each judge says, and what it costs her
// ══════════════════════════════════════════════════════════════════════
//
// Three things live here, and they were the last part of the week with no
// mechanics at all.
//
// ── 1. A CRITIQUE COMES FROM THAT JUDGE'S OWN VIEW ────────────────────
//
// The tone was being read off the CALL, which meant every judge said the same
// thing about the same queen and the panel might as well have been one person.
// It comes from `judgeViews` now — the same numbers that produced the ranking
// — so a judge who ranked her third is warm about her even on a night the host
// put her in the bottom, and the disagreement is visible rather than asserted.
//
// AND A JUDGE NEVER CITES A TERM SHE DOES NOT CARE ABOUT. If runway is 0.1 of
// her taste she does not lead with the look, because a panel where everybody
// mentions everything is a panel with no personalities in it.
//
// ── 2. A REACTION COSTS SOMETHING ─────────────────────────────────────
//
// `reactionFor` already decided whether a queen crashes out or takes it flat,
// and nothing happened as a result. That is the cosmetic-event bug this
// project refuses everywhere else, sitting in the middle of the main stage.
//
// ── 3. THE TWO TWISTS ─────────────────────────────────────────────────
//
// Naming somebody to go home, and rating the room. Both are things the show
// does to make queens say out loud what they would rather not, and both cost
// the person who speaks.
import { evt } from './rules.js';

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

/** A judge will not talk about something she weights below this. */
const CARES = 0.1;

/** What each term is called when a judge cites it. */
const TERM_NAMES = {
  challenge: 'challenge', runway: 'runway', risk: 'risk', polish: 'polish',
};

/**
 * One line per judge per queen on the stage.
 *
 * `tone` is that judge's view of her against the judge's OWN median, so a
 * split panel produces genuinely opposed critiques of the same performance.
 * `reasons` are the terms that actually moved her view, filtered to the ones
 * this judge cares about.
 */
export function critiqueLines({ panel, views, call, entries, rng = Math.random }) {
  /* ── THE ORDER THEY ARE CRITIQUED IN IS NOT THE ORDER THEY PLACED ──
     This was `[...win, ...high, ...low, ...atRisk, ...bottom]`, which is the
     result itself: the winner spoke first and the bottom spoke last, every
     week. The critiques screen lists them in the order they are called, so
     the FIRST queen on that screen was the queen who wins the week 100% of
     the time -- measured 240 of 240 -- and the last one was going home.
     The whole night was legible before the host said a word, and no amount
     of hiding the rail's numbers could fix it, because the leak was the
     sequence and not the labels.
     Shuffled off the week's own rng, so it is stable across a replay and
     tells you nothing. The panel still knows what it thinks; the room simply
     is not called in rank order, which is also how the real show does it. */
  const onStage = [...(call.win || []), ...(call.high || []),
    ...(call.low || []), ...(call.atRisk || []), ...(call.bottom || [])];
  for (let i = onStage.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [onStage[i], onStage[j]] = [onStage[j], onStage[i]];
  }
  const byName = Object.fromEntries((entries || []).map(e => [e.name, e]));
  const out = [];

  for (const j of panel) {
    const rows = views[j.id] || [];
    if (!rows.length) continue;
    const sorted = [...rows].map(r => r.view).sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    for (const name of onStage) {
      const row = rows.find(r => r.name === name);
      const e = byName[name];
      if (!row || !e) continue;

      const gap = row.view - median;
      const tone = gap > 1.2 ? 'praise' : gap < -1.2 ? 'pan' : 'mixed';

      // Which terms actually moved this judge on this queen, weighted by how
      // much she cares. Only the ones she cares about are eligible at all.
      const contrib = [
        ['challenge', (j.taste.challenge || 0) * (e.perf ?? 5)],
        ['runway', (j.taste.runway || 0) * (e.runway ?? 5)],
        ['risk', (j.taste.risk || 0) * ((e.risk ?? 0.5) * 10)],
        ['polish', (j.taste.polish || 0) * (e.polish ?? 5)],
      ].filter(([k]) => (j.taste[k] || 0) >= CARES);

      contrib.sort((a, b) => (tone === 'pan' ? a[1] - b[1] : b[1] - a[1]));
      const reasons = contrib.slice(0, 2).map(([k]) => TERM_NAMES[k]);

      /* ── WHY, AND IN WHOSE WORDS ──────────────────────────────────
         The critique used to be three generic paragraphs keyed on nothing
         but `tone`, so a judge said the same sentence about a collapsed
         Snatch Game and a hemline, and `reasons` — computed right here —
         reached the screen as two tags above prose that never mentioned
         them. The judges' authored `petPeeve` and `softSpot` were read by
         no critique at all.

         So this records WHAT SHE ACTUALLY DID, measured, and WHO IS
         LOOKING:

           dimension  the term that moved this judge most on this queen,
                      which is her taste times the queen's real number — so
                      Law arrives at the runway and Ross at the challenge
                      because that is what each of them is weighing.
           direction  praise or fault, from the sign of that term against
                      the field rather than from the call.
           standing   where she actually placed on that dimension tonight,
                      out of the queens on stage. "Best look of the night"
                      and "third best" are different critiques.
           styleLean  this judge's authored bias for or against her kind of
                      drag, when it is strong enough to be the reason.
           peeve/soft the judge's own words for what she is looking for.

         Nothing here decides anything — the verdict was settled upstairs.
         This is the explanation, and it is the first time the explanation
         has been made of facts. */
      const dim = (contrib[0] || [])[0] || 'challenge';
      const dimValue = { challenge: e.perf, runway: e.runway,
        risk: (e.risk ?? 0.5) * 10, polish: e.polish }[dim] ?? 5;
      const field = onStage
        .map(nm => byName[nm])
        .filter(Boolean)
        .map(x => ({ challenge: x.perf, runway: x.runway,
          risk: (x.risk ?? 0.5) * 10, polish: x.polish }[dim] ?? 5))
        .sort((x, y) => y - x);
      const place = field.indexOf(dimValue);
      const styleLean = Number((j.styleBias || {})[e.style] || 0);

      out.push({
        judge: j.id,
        judgeName: j.name || j.id,
        queen: name,
        tone,
        reasons,
        rank: row.rank,
        gap: Math.round(gap * 100) / 100,
        reason: {
          dimension: dim,
          direction: tone === 'pan' ? 'fault' : tone === 'praise' ? 'praise' : (gap >= 0 ? 'praise' : 'fault'),
          // 1-indexed, and out of the queens standing there rather than the
          // whole cast: the middle went home before anybody spoke.
          standing: place >= 0 ? place + 1 : null,
          ofN: field.length,
          styleLean: Math.round(styleLean * 100) / 100,
          style: e.style || null,
          // How hard this judge says things, authored on the panel and
          // derived from her social stat for a guest. The delivery clause
          // only speaks at the ends, so most weeks this changes nothing.
          warmth: Number.isFinite(Number(j.warmth)) ? Number(j.warmth) : null,
          peeve: j.petPeeve || null,
          softSpot: j.softSpot || null,
        },
      });
    }
  }
  void rng;
  return out;
}

/**
 * How each queen takes it, and what that does to her.
 *
 * The reactions themselves were already decided elsewhere; this is the half
 * that was missing. A blow-up also costs her with the PANEL — every judge
 * remembers it next week — which is the only reaction that reaches beyond
 * tonight, and the reason it is the expensive one.
 */
export function runReactions({ reactions = {}, state = {}, rng = Math.random }) {
  const events = [];
  const scenes = [];

  const COST = {
    joy: { pop: 2 },
    relief: { pop: 1 },
    tears: { pop: 1 },
    sadness: { pop: 0 },
    idgaf: { pop: -1 },
    'crash-out': { pop: -2, flag: 'crashedOut' },
    'blow-up': { pop: -1, flag: 'blewUpAtPanel', memory: -0.3 },
  };

  for (const [name, reaction] of Object.entries(reactions)) {
    const spec = COST[reaction];
    if (!spec) continue;

    // A reaction worth nothing is not recorded as an event: sadness moves no
    // number, and inventing one so it can be an "event" would be the same
    // cosmetic problem in reverse.
    if (spec.pop || spec.flag) {
      events.push(evt(`reaction:${reaction}`, {
        players: [name],
        pop: spec.pop ? { [name]: spec.pop } : {},
        state: spec.flag ? { [`${spec.flag}:${name}`]: true } : {},
        data: { reaction },
      }));
    }

    // Blowing up at the panel is the only one they carry into next week.
    if (spec.memory) {
      state.memory ||= {};
      for (const jid of Object.keys(state.memory)) {
        state.memory[jid] ||= {};
        state.memory[jid][name] = (state.memory[jid][name] || 0) + spec.memory;
      }
    }

    scenes.push({
      step: 'critiques', kind: `reaction:${reaction}`,
      data: { players: [name], reaction }, text: '',
    });
  }

  void rng;
  return { events, scenes };
}

/**
 * "Who should go home tonight, and why?"
 *
 * Every queen has to name somebody with that queen standing next to her, and
 * the naming is the event — it costs a bond whoever she picks, and it costs
 * her popularity if she names somebody she is close to, because the room can
 * tell.
 */
/**
 * "Who should go home tonight, and why?"
 *
 * ── MEASURED, NOT INVENTED ────────────────────────────────────────────
 *
 * The fandom keeps a Contestant / Choice / Reason table for every time this
 * has been asked on the US show. 129 real answers, read with
 * tools/dr-real-who-should-go.py. The reasons queens actually give:
 *
 *   Her performance in the challenge        11     the single commonest
 *   Her runway look                          8
 *   Her performance throughout the season    6     (+ "her track record" 3)
 *   The critiques given by the judges        5
 *   Her role as team leader                  3     team weeks only
 *   She was her biggest competition          3     (~21% of all answers are
 *                                                   threat-shaped once the
 *                                                   phrasings are grouped)
 *   She had immunity that episode            2     the protest vote
 *   Named herself                            4     3% of all answers
 *
 * The first version of this had exactly two reasons — a schemer named the
 * biggest threat, everybody else named the lowest bond — so the frontrunner
 * was named constantly and nobody ever said why. Reported as "two chose the
 * clear frontrunner, and where are the reasonings".
 *
 * Naming the frontrunner is real and it is about a fifth of answers. Being
 * the ONLY answer was the bug. And a queen naming herself is rare -- 3%, not
 * whenever she is loyal and in trouble.
 *
 * The reason is drawn first and the NAME FOLLOWS FROM IT, which is the way
 * round a person actually thinks: you decide what you are judging on and then
 * you look at who is worst at it.
 */
export function whoShouldGoHome({
  living, players, bond, state = {}, rng = Math.random,
  // Tonight, so an answer can be about tonight: how each queen scored in the
  // challenge, how her runway went, and where the panel put her.
  perf = {}, runway = {}, ranking = [], teams = null, captains = {},
  immune = [],
}) {
  const votes = {};
  const events = [];
  const record = n => state.record?.[n] || [];
  const wins = n => record(n).filter(r => r === 'WIN' || r === 'HIGH').length;
  const bads = n => record(n).filter(r => r === 'BTM2' || r === 'LOW' || r === 'BTM').length;
  const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

  /* Shares taken from the counts above. `leader` is only reachable on a team
     week and `immunity` only when somebody actually has it, so both fall
     through to the rest of the table when they cannot apply. */
  const REASON_TABLE = [
    ['challenge', 28], ['threat', 20], ['runway', 18],
    ['season', 16], ['critiques', 12], ['leader', 4], ['immunity', 2],
  ];

  // Worst first, by whatever the reason is judging on.
  const worstBy = (pool, score) => pool.slice()
    .sort((a, b) => score(a) - score(b))[0] || null;

  for (const n of living) {
    const others = living.filter(o => o !== n);
    if (!others.length) continue;

    /* ── SHE NAMES HERSELF ──
       Four times in 129. It is the most sympathetic thing anybody does on
       that stage and it is not a strategy -- and it is RARE, which is what
       makes it land. */
    const inTrouble = ['BTM2', 'BTM', 'LOW'].includes(record(n)[record(n).length - 1] || '');
    if (stat(players[n], 'loyalty') >= 8 && inTrouble && rng() < 0.25) {
      votes[n] = { target: n, reason: 'herself' };
      events.push(evt('named-herself', { players: [n], pop: { [n]: 3 }, data: {} }));
      continue;
    }

    // What she is judging on tonight.
    const usable = REASON_TABLE.filter(([r]) => {
      if (r === 'leader') return !!teams && Object.keys(captains).length > 0;
      if (r === 'immunity') return others.some(o => immune.includes(o));
      return true;
    });
    const total = usable.reduce((t, [, w]) => t + w, 0);
    let roll = rng() * total;
    const reason = (usable.find(([, w]) => (roll -= w) <= 0) || usable[0])[0];

    /* ── AND THE NAME FOLLOWS FROM THE REASON ──
       Not the other way round. Each of these looks at the room through one
       lens and names whoever is worst through it, so the answer and the
       reason are the same thought rather than a label stuck on afterwards. */
    const rank = new Map(ranking.map((r, i) => [r.name ?? r, i]));
    const pick = {
      challenge: () => worstBy(others, o => num(perf[o]?.perf ?? perf[o])),
      runway: () => worstBy(others, o => num(runway[o]?.score ?? runway[o])),
      season: () => worstBy(others, o => wins(o) - bads(o)),
      critiques: () => worstBy(others, o => -(rank.get(o) ?? 0)),
      // The one that is about her own game rather than the other queen's work.
      threat: () => others.slice().sort((a, b) => wins(b) - wins(a))[0],
      leader: () => others.find(o => captains[o]) || null,
      immunity: () => others.find(o => immune.includes(o)) || null,
    }[reason];

    // A lens that cannot see anybody tonight falls back to the season, which
    // every queen always has.
    const target = (pick && pick()) || worstBy(others, o => wins(o) - bads(o));
    if (!target) continue;

    votes[n] = { target, reason };
    const closeness = bond(n, target);
    events.push(evt('named-her', {
      players: [n, target],
      bond: [[n, target, -1.5]],
      // Naming a friend is the one that costs the namer.
      pop: closeness >= 3 ? { [n]: -1 } : { [target]: -1 },
      data: { reason, strategic: reason === 'threat', closeness },
    }));
  }

  const tally = {};
  for (const v of Object.values(votes)) tally[v.target] = (tally[v.target] || 0) + 1;

  return {
    votes,
    tally,
    events,
    scenes: [{ step: 'critiques', kind: 'who-should-go', data: { votes, tally }, text: '' }],
  };
}

/**
 * Rate-a-queen: everybody scores everybody, and the aggregate is read out.
 *
 * A queen rates from what she feels about somebody and what that somebody has
 * actually done, in that order — which is the point of the twist. The room's
 * opinion and the judges' are allowed to disagree, and usually do.
 */
export function rateAQueen({ living, players, bond, state = {}, rng = Math.random }) {
  const grid = {};
  const events = [];
  const record = n => state.record?.[n] || [];

  for (const n of living) {
    grid[n] = {};
    for (const o of living) {
      if (o === n) continue;
      const feeling = bond(n, o) / 2;
      const done = record(o).filter(r => r === 'WIN').length * 1.2
        + record(o).filter(r => r === 'HIGH').length * 0.6
        - record(o).filter(r => r === 'BTM').length * 0.8;
      const score = Math.max(1, Math.min(10,
        Math.round((5.5 + feeling + done + (rng() - 0.5) * 1.5) * 10) / 10));
      grid[n][o] = score;
    }
  }

  const mean = {};
  for (const n of living) {
    const given = living.filter(o => o !== n).map(o => grid[o][n]).filter(v => v !== undefined);
    mean[n] = given.length
      ? Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 100) / 100 : 5;
  }

  const ranked = Object.entries(mean).sort((a, b) => b[1] - a[1]);
  if (ranked.length >= 2) {
    const [top] = ranked[0];
    const [bottom] = ranked[ranked.length - 1];
    events.push(evt('rated-highest', { players: [top], pop: { [top]: 2 }, data: { score: mean[top] } }));
    events.push(evt('rated-lowest', { players: [bottom], pop: { [bottom]: -2 }, data: { score: mean[bottom] } }));
  }

  return {
    grid,
    mean,
    events,
    scenes: [{ step: 'critiques', kind: 'rate-a-queen', data: { mean, ranked }, text: '' }],
  };
}
