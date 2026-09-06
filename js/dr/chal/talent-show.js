// ══════════════════════════════════════════════════════════════════════
// dr/chal/talent-show.js — the act is hers to choose, and that is the test
// ══════════════════════════════════════════════════════════════════════
//
// Nobody assigns anything here. The queen picks her own act, and the pick is
// most of the score: a singer who sings wins the night, and a singer who
// decides tonight is the night she tries aerial does not. That is why the
// talent show is the premiere — it is the fastest way to learn who somebody is.
//
// Risk cuts both ways by design. A risky act pays MORE when it lands and costs
// more when it does not, so reaching past your safest choice is a real
// decision rather than a mistake with extra steps.
//
// Runs on as few as two queens: it is also the performance round of the
// perform-then-lipsync finale.
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { blendScore, noise } from '../perform.js';
import { evt } from '../rules.js';

export const TALENTS = [
  { id: 'live-vocal', name: 'A live vocal', blend: { singing: 0.8, acting: 0.2 }, risk: 0.8 },
  { id: 'comedy-set', name: 'A comedy set', blend: { comedy: 0.8, acting: 0.2 }, risk: 0.6 },
  { id: 'dance-number', name: 'A dance number', blend: { dance: 0.9, lipsync: 0.1 }, risk: 0.4 },
  { id: 'burlesque', name: 'A burlesque routine', blend: { dance: 0.5, runway: 0.5 }, risk: 0.5 },
  { id: 'lip-sync-stunt', name: 'A lip sync with a stunt', blend: { lipsync: 0.7, dance: 0.3 }, risk: 0.9 },
  { id: 'quick-change', name: 'A quick-change reveal', blend: { design: 0.5, runway: 0.5 }, risk: 0.7 },
  { id: 'character-monologue', name: 'A character monologue', blend: { acting: 0.8, comedy: 0.2 }, risk: 0.5 },
  { id: 'aerial', name: 'An aerial routine', blend: { dance: 0.6, runway: 0.4 }, risk: 1.0 },
];

export const talentById = id => TALENTS.find(t => t.id === id) || null;

/** What she is best at — unless she is bold enough to reach past it. */
export function chooseTalent(player, rng = Math.random) {
  const d = dragOf(player);
  const ranked = [...TALENTS]
    .map(t => ({ t, s: blendScore(d, t.blend) }))
    .sort((a, b) => b.s - a.s);
  const bold = (Number(player?.stats?.boldness) || 5) / 10;
  if (ranked.length > 1 && rng() < bold * 0.35) {
    // She reaches: the best act among those riskier than her safest choice.
    // This is the "she went for it" beat, and it is her nerve that buys it.
    const riskier = ranked.slice(1, 4).filter(x => x.t.risk > ranked[0].t.risk);
    if (riskier.length) return riskier[0].t;
  }
  return ranked[0].t;
}

export function assign(ctx) {
  const { living, players, rng } = ctx;
  const picks = {};
  for (const n of living) {
    picks[n] = { name: n, choice: chooseTalent(players[n], rng).id, penalty: 0, lostTo: null };
  }
  return {
    roles: Object.fromEntries(living.map(n => [n, 'standard'])),
    teams: [], order: [...living], picks, events: [],
    scenes: [{ step: 'choice', kind: 'talent-picks', data: { picks } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return {
    prep: w.prep,
    events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'rehearsal', data: { notes: w.notes } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng } = ctx;
  const performances = {};
  const events = [];

  for (const n of living) {
    const d = dragOf(players[n]);
    const talent = talentById(assignment.picks[n]?.choice) || TALENTS[2];
    const craft = blendScore(d, talent.blend);
    // Craft buys down the risk but never to zero: the aerial can always drop.
    const failChance = Math.max(0.02, 0.15 + talent.risk * 0.2 - craft / 40);
    const landed = rng() > failChance;
    const perf = craft * (landed ? 1 + talent.risk * 0.25 : 1 - talent.risk * 0.35)
      + (prep[n] || 0) + noise(rng, 2.0);

    if (landed && talent.risk >= 0.7) {
      events.push(evt('stunt-landed', { players: [n], pop: { [n]: 3 }, data: { talent: talent.id } }));
    } else if (!landed) {
      events.push(evt('stunt-failed', { players: [n], pop: { [n]: -2 }, data: { talent: talent.id } }));
    }
    // Not the same note as failing. This is the queen who chose an act she
    // could never have done, which the panel says out loud every season.
    if (craft < 4) {
      events.push(evt('wrong-talent', {
        players: [n], pop: { [n]: -2 },
        data: { talent: talent.id, craft: Math.round(craft * 10) / 10 },
      }));
    }

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: landed && perf > 10,
      risk: talent.risk,
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0, craft: Math.round(craft * 100) / 100 },
      detail: { talent: talent.name, talentId: talent.id, landed },
    };
  }

  return {
    performances, runwayOverride: null, events,
    scenes: [{ step: 'maxi-main', kind: 'talent-acts', data: {} }],
  };
}
