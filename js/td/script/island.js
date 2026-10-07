// ══════════════════════════════════════════════════════════════════════
// td/script/island.js — an island moment, decided by js/rescue-island.js, becomes a scene
// ══════════════════════════════════════════════════════════════════════
//
// The island engine decides everything (who trains, who breaks, who fights, the bonds, the
// pacts) and still picks its own sentence: that draw stays, so converting moved no season.
// This reads the decision and writes the scene from lines/isle.js through the camp's picker
// (same ledger, same repetition rules: a line is held back across the season and per speaker).
//
// A pair moment on an island with three or more people may pull a third resident in
// ('isle.trio.*'): somebody always overhears out here. Who, and whether, comes from a stream
// keyed on the moment itself, never the engine's dice.
import { gs, players } from '../../core.js';
import { stableRng } from '../../script/rng.js';
import { makeScene } from './scene.js';
import { scriptEvent, numberWord } from './write.js';

// What training looks like, by the stat it builds (the engine decides the stat).
const DRILL = {
  physical: ['running sprints up and down the sand', 'carrying rocks from one end of the beach to the other', 'climbing the same palm tree over and over'],
  endurance: ['hanging from a branch until the shaking starts', 'holding a squat in the sun', 'treading water far past the point of comfort'],
  mental: ['solving puzzles made out of driftwood', 'memorising patterns of shells', 'stacking stones into towers that keep falling down'],
  strategic: ['scratching old vote counts into the sand', 'going through every vote of the season, out loud', 'mapping out who is with who in the game'],
  boldness: ['jumping off the rocks into the deep water', 'standing at the edge of the cliff and looking down', 'grabbing crabs bare-handed'],
  intuition: ['watching how the others move and guessing what they want', 'practising reading faces', 'listening to the others and spotting the lies'],
  social: ['rehearsing a speech to an imaginary jury', 'practising small talk on a coconut', 'going over what to say to people back in the game'],
  temperament: ['sitting completely still by the water', 'breathing slowly while the flies bite', 'counting to a hundred every time something gets annoying'],
  loyalty: ['keeping a promise to train every morning', 'running the beach next to whoever will come along', 'helping with every single chore without being asked'],
};
const PAIR_DRILL = {
  physical: 'racing each other up and down the beach', endurance: 'seeing who can hang from a branch longest', mental: 'racing each other through driftwood puzzles',
  strategic: 'quizzing each other on who voted for who', boldness: 'daring each other off higher and higher rocks', intuition: "trying to read each other's bluffs",
  social: 'practising their pitches on each other', temperament: 'trying to make each other crack first', loyalty: 'doing trust falls off a log',
};

// The scene kind each engine moment is. Text tests read the engine's own fixed sentences
// (rescue-island.js); tests/td-island-script.test.js fails if a moment maps to nothing.
const PAIR = {
  history: 'pair.history', 'enemy-arrives': 'pair.grudge', 'grudge-confrontation': 'pair.grudge', rivalry: 'pair.grudge', 'cold-war': 'pair.cold',
  'explosive-fight': 'pair.blowup', 'ally-arrives': 'pair.close', 'bonding-meal': 'pair.close', 'emotional-talk': 'pair.close', bittersweet: 'pair.dread',
  'heartbreak-preview': 'pair.dread', comedy: 'pair.comedy', 'midnight-talk': 'pair.late', 'resource-conflict': 'pair.petty', 'alliance-plot': 'plot.pact',
  intimidation: 'pair.fear', 'trash-talk': 'pair.trash', comfort: 'pair.lean', 'mutual-respect': 'pair.respect', 'revenge-talk': 'plot.revenge',
  'sizing-up': 'pair.size', 'game-talk': 'plot.notes', 'shared-training': 'pair.spar', 'shared-training-life': 'pair.spar',
};
const SOLO = {
  training: 'train.solo', 'edge-train': 'train.solo', 'training-injury': 'train.hurt', 'edge-injury': 'train.hurt', 'edge-rest': 'rest.any',
  'mental-breakdown': 'mind.broken', 'mental-breakdown-life': 'mind.broken', 'mental-hardened': 'mind.hard', 'mental-hardened-life': 'mind.hard',
  reflection: 'alone.steady', motivation: 'alone.grind', thriving: 'body.thriving', struggling: 'body.struggling', quit: 'quit.any',
};
// pair kinds a third resident may walk into
const TRIO = new Set(['pair.grudge', 'pair.blowup', 'pair.comedy', 'pair.late', 'pair.close', 'pair.petty', 'plot.pact', 'plot.notes', 'pair.newfriends', 'pair.size']);

/** The kind of scene an island moment is, from what the engine decided. null: leave it as written. */
export function islandKind(evt) {
  const t = evt.type, text = String(evt.text || '');
  if (/^(winner|loser)-/.test(t)) return null;           // the duel's aftermath stays with the duel screen
  if (t.startsWith('group-')) return `group.${t.slice(6)}`;
  if (t === 'mental-obsessed' || t === 'mental-obsessed-life') return evt.revengeTarget ? 'fixate.target' : 'fixate.return';
  if (t === 'processing') {
    if (/breaks down/.test(text)) return 'mind.broken';
    if (/stopped replaying|rough moment|pulls through/.test(text)) return 'alone.steady';
    if (/wakes up before/.test(text)) return 'alone.grind';
    return 'alone.vote';
  }
  if (t === 'edge-social') {
    if (!evt.player2) return /tally/.test(text) ? 'alone.grind' : 'alone.steady';
    return /leans on/.test(text) ? 'pair.lean' : /talks it out/.test(text) ? 'pair.close' : 'pair.late';
  }
  if (t === 'bonding') {
    if (!evt.player2) return /fish/.test(text) ? 'help.fish' : 'help.shelter';
    if (/voted out by/.test(text)) return 'plot.enemy';
    if (/pact/.test(text)) return 'plot.pact';
    if (/never spoke/.test(text)) return 'pair.newfriends';
    return 'pair.close';
  }
  return PAIR[t] || SOLO[t] || null;
}

const statOf = (evt, text) => evt.stat || evt.sharedStat || Object.keys(DRILL).find(k => new RegExp(`\\b${k}\\b`).test(text)) || 'physical';
const authored = (n, k) => { const v = players.find(p => p.name === n)?.[k]; return typeof v === 'string' && v.trim() && v.length < 40 ? v.trim() : null; };

/**
 * Write an island moment as a scene, in place: the event gains scene, lines and a `text`
 * that is now the transcript. ctx: { ep, residents, arrivals, rescue }.
 */
export function scriptIsland(evt, ctx) {
  const base = islandKind(evt);
  if (!base || evt.lines) return evt;
  let base2 = base;
  const text = String(evt.text || '');
  const rng = stableRng('td-isle', String(ctx.ep), evt.type, evt.player || '', evt.player2 || '', String((ctx.n = (ctx.n || 0) + 1)));
  let a = evt.player, b = evt.player2 || null, c = evt.player3 || null;
  const data = { isle: ctx.rescue ? 'Rescue Island' : 'Redemption Island', intent: ctx.rescue ? 'return' : 'duel' };
  // comfort: the engine names the one who comforts first; the pool's {a} is the one who needs it
  if (evt.type === 'comfort') [a, b] = [b, a];
  // sizing up: {a} was already here, {b} just arrived
  if (base === 'pair.size' && (ctx.arrivals || []).includes(a) && !(ctx.arrivals || []).includes(b)) [a, b] = [b, a];
  // training is written per stat (lines/isle-train.js); an injury by whether it was the body or the head
  const stat = statOf(evt, text);
  if (base === 'train.solo') base2 = `train.${DRILL[stat] ? stat : 'physical'}`;
  if (base === 'train.hurt') base2 = `injury.${['physical', 'endurance', 'boldness', 'loyalty'].includes(stat) ? 'body' : 'head'}`;
  if (base === 'pair.spar') data.drill = PAIR_DRILL[statOf(evt, text)] || PAIR_DRILL.physical;
  if (base === 'mind.hard') data.streak = numberWord(gs.riWinStreak?.[a] || Number((/(\d+) duel/.exec(text) || [])[1]) || 2);
  if (base === 'pair.fear') data.streak = numberWord(gs.riWinStreak?.[a] || Number((/(\d+)/.exec(text) || [])[1]) || 3);
  // {Streak}: the same number, at the start of a sentence
  if (data.streak) data.Streak = data.streak[0].toUpperCase() + data.streak.slice(1);
  // {wrote}: {b} voted {a} out (or tried to), on the record. A line that blames {b} for the vote asks for it.
  if (b && (gs.episodeHistory || []).some(h => (h.votingLog || []).some(v => v.voter === b && v.voted === a))) data.wrote = b;
  if (base === 'fixate.target') data.target = evt.revengeTarget;
  if (base === 'plot.enemy') data.enemy = (/voted out by ([^.]+)\./.exec(text) || [])[1] || null;
  if (base === 'plot.enemy' && !data.enemy) return evt;
  // what a line may say about who {a} is at home: the authored hometown (its first part) and
  // job (its first role, with its article). Absent when nobody wrote one.
  const home = authored(a, 'hometown')?.split(',')[0].trim();
  const role = (players.find(p => p.name === a)?.occupation || '').split(/,|;|\/|&| and /)[0].trim().toLowerCase();
  if (home && /^[A-Z]/.test(home) && home.length > 2 && !/^swiss$/i.test(home)) data.home = home;
  if (role && !/^(unemployed|none|n\/a)$/.test(role) && role.length < 30) data.job = `${/^[aeiou]/.test(role) ? 'an' : 'a'} ${role}`;
  // a third resident walks in on a pair (and always on a group moment)
  let kind = `isle.${base2}`;
  if (!c && TRIO.has(base) && b) {
    const others = (ctx.residents || []).filter(n => n !== a && n !== b);
    if (others.length && rng() < 0.45) { c = others[Math.floor(rng() * others.length)]; kind = `isle.trio.${base.split('.')[1]}`; }
  }
  if (base.startsWith('group.')) kind = `isle.${base}`;
  const who = { a }; if (b) who.b = b; if (c) who.c = c;
  const [family, k, ending] = kind.split('.');
  scriptEvent(evt, makeScene(`${family}.${k}`, who, { ending, ...data }, [...(ctx.residents || [])], null), { ep: ctx.ep, phase: 'post' });
  if (c && !evt.player3) evt.player3 = c;
  return evt;
}
