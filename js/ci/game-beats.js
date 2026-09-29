// ══════════════════════════════════════════════════════════════════════
// ci/game-beats.js — a played game, as the segment the audience sees
// ══════════════════════════════════════════════════════════════════════
//
// The runners in games.js decide everything (answers, votes, likes, right and
// wrong). This file turns that record into BEATS — the moments a real episode
// cuts to — so a game airs like 1×01's Ice Breaker: the alert and the rules
// read aloud; every round, with answers said aloud, @-messages and replies,
// reactions in other apartments; conclusions drawn out loud; the reveal item
// by item; the verdict; the prize as its own scene.
//
// A beat is { phase, kind, by, about, c, round, q, x, n, ...facts } — every
// value read from the game record, never rolled for the page's sake except
// WHICH of the decided moments to show (its own dice, never a result). It
// also writes state.gameMemory: what each player did to whom, for later days.
import { GAMES } from './games-data.js';
import { rel, S } from './state.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const shuffled = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const by = (list, score) => [...list].sort((x, y) => score(y) - score(x));

/** What a game did between two players, kept for later chats and ballots. */
export function remember(state, sc, kind, byH, about, detail = null) {
  (state.gameMemory ||= []).push({ day: state.day, scene: sc.id, gameId: sc.data.gameId, kind, by: byH, about, detail });
}

const FAMILY = {
  statement(state, rng, game, sc, all, push) {
    const loneCount = {};
    sc.data.rounds.forEach((r, i) => {
      const p = game.prompts.find(x => x.id === r.promptId);
      push({ phase: 'round', round: i, kind: 'prompt', by: all[(sc.id + i + 1) % all.length], promptId: p.id });
      // Three answers said aloud: the lone one if there is one, and the most
      // certain of the rest (the further a stat sits from average).
      const strength = h => Math.abs(S(state, h, p.stat) - 5);
      const shown = [...new Set([r.lone, ...by(all.filter(h => h !== r.lone), strength)].filter(Boolean))].slice(0, 3);
      // Somebody reacts to each answer: preferably someone who said the opposite.
      for (const h of shown) {
        const reactor = all.find(o => o !== h && r.answers[o] !== r.answers[h]) || pick(all.filter(o => o !== h), rng);
        push({ phase: 'round', round: i, kind: 'answer', by: h, about: reactor, answer: r.answers[h], strong: strength(h) >= 3, promptId: p.id });
      }
      const agree = all.filter(h => r.answers[h] === 'agree').length;
      const split = agree === 0 || agree === all.length ? 'all' : r.lone ? 'lone' : 'split';
      push({ phase: 'round', round: i, kind: 'results', by: pick(all.filter(h => !shown.includes(h)).concat(shown), rng),
        n: agree, split, promptId: p.id });
      if (r.lone) {
        loneCount[r.lone] = (loneCount[r.lone] || 0) + 1;
        const noticer = by(all.filter(h => h !== r.lone), h => S(state, h, 'intuition'))[0];
        push({ phase: 'round', round: i, kind: 'lone', by: noticer, about: r.lone, promptId: p.id });
        const atter = by(all.filter(h => h !== r.lone && h !== noticer), h => S(state, h, 'boldness'))[0] || noticer;
        push({ phase: 'round', round: i, kind: 'at', by: atter, about: r.lone, promptId: p.id, answer: r.answers[r.lone] });
        remember(state, sc, 'lone', r.lone, null, p.id);
      } else {
        // A friend who answered the other way surprises someone.
        const pairs = [];
        for (const a of all) for (const b of all) if (a !== b && r.answers[a] !== r.answers[b]) pairs.push([a, b, rel(a, b, 'affection')]);
        const top = pairs.sort((x, y) => y[2] - x[2])[0];
        if (top) push({ phase: 'round', round: i, kind: 'surprise', by: top[0], about: top[1], promptId: p.id, answer: r.answers[top[1]] });
      }
    });
    const standout = Object.keys(loneCount).sort((a, b) => loneCount[b] - loneCount[a])[0];
    const aboutWho = standout || pick(all, rng);
    for (const obs of by(all.filter(h => h !== aboutWho), h => S(state, h, 'intuition')).slice(0, 2)) {
      push({ phase: 'aftermath', kind: 'conclusion', by: obs, about: aboutWho, odd: !!standout });
    }
  },

  name(state, rng, game, sc, all, push) {
    const tally = {};
    sc.data.rounds.forEach((r, i) => {
      const p = game.prompts.find(x => x.id === r.promptId);
      push({ phase: 'round', round: i, kind: 'prompt', by: all[(sc.id + i + 1) % all.length], promptId: p.id, tone: p.tone });
      const counts = {};
      for (const n of Object.values(r.answers)) counts[n] = (counts[n] || 0) + 1;
      const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      const namers = Object.keys(r.answers).filter(v => r.answers[v] === top);
      const others = Object.keys(r.answers).filter(v => r.answers[v] !== top);
      for (const v of [namers[0], others[0], namers[1] || others[1]].filter(Boolean)) {
        push({ phase: 'round', round: i, kind: 'namer', by: v, about: r.answers[v], tone: p.tone, promptId: p.id });
      }
      push({ phase: 'round', round: i, kind: 'tally', by: namers[0], about: top, n: counts[top], tone: p.tone, promptId: p.id,
        everyone: counts[top] === all.length - 1 });
      push({ phase: 'round', round: i, kind: 'reply', by: top, tone: p.tone, promptId: p.id, n: counts[top] });
      (tally[top] ||= { good: 0, bad: 0, funny: 0 })[p.tone] += counts[top];
      for (const v of namers) remember(state, sc, `named-${p.tone}`, v, top, p.id);
    });
    const hurt = Object.keys(tally).sort((a, b) => tally[b].bad - tally[a].bad)[0];
    const proud = Object.keys(tally).sort((a, b) => tally[b].good - tally[a].good)[0];
    const hurtShown = !!(hurt && tally[hurt].bad);
    if (hurtShown) push({ phase: 'aftermath', kind: 'hurt', by: hurt, n: tally[hurt].bad });
    if (proud && tally[proud].good && (proud !== hurt || !hurtShown)) push({ phase: 'aftermath', kind: 'proud', by: proud, n: tally[proud].good });
    else if (!hurtShown) push({ phase: 'aftermath', kind: 'proud', by: pick(all, rng), n: 1 });
  },

  ask(state, rng, game, sc, all, push) {
    const qs = sc.data.rounds[0]?.questions || [];
    const anon = !!game.anonymous;
    for (const q of shuffled(qs, rng).slice(0, 2)) push({ phase: 'prep', kind: 'choose', by: q.asker, about: q.target, qkind: q.kind, anon });
    qs.forEach((q, i) => {
      push({ phase: 'round', round: i, kind: 'question', by: q.asker, about: q.target, qkind: q.kind, result: q.result, anon });
      const watcher = pick(all.filter(h => h !== q.asker && h !== q.target), rng);
      if (watcher) push({ phase: 'round', round: i, kind: 'react', by: watcher, about: q.target, qkind: q.kind, result: q.result, anon });
      if (anon && q.guessed) push({ phase: 'round', round: i, kind: 'guess', by: q.target, about: q.asker, qkind: q.kind, anon });
      remember(state, sc, q.kind === 'catfish' ? 'asked-catfish' : `asked-${q.kind}`, q.asker, q.target, q.result);
    });
    const failed = qs.find(q => q.kind === 'catfish' && q.result === 'fail');
    const barbed = qs.find(q => q.kind === 'barbed');
    const topic = failed?.target || barbed?.target || qs[0]?.target;
    const obs = all.filter(h => h !== topic);
    if (topic) push({ phase: 'aftermath', kind: 'conclusion', by: pick(obs, rng), about: topic, failed: !!failed, barbed: !failed && !!barbed });
  },

  guess(state, rng, game, sc, all, push) {
    const slipped = new Set((sc.data.slips || []).filter(s => !s.misread).map(s => s.by));
    for (const h of shuffled(all, rng).slice(0, 2)) {
      const r = sc.data.rounds[0];
      push({ phase: 'prep', kind: 'submit', by: h, promptId: r.promptId, factId: r.answers[h] });
    }
    sc.data.rounds.forEach((r, i) => {
      const p = game.prompts.find(x => x.id === r.promptId);
      push({ phase: 'round', round: i, kind: 'prompt', by: all[(sc.id + i + 1) % all.length], promptId: p.id });
      // The facts worth airing: the hardest to place, and any that slipped.
      const order = by(all, h => (slipped.has(h) ? 10 : 0) + (all.length - 1 - (r.placedBy[h]?.length || 0)));
      for (const owner of order.slice(0, 3)) {
        const x = r.answers[owner];
        push({ phase: 'round', round: i, kind: 'fact', by: pick(all.filter(h => h !== owner), rng), about: owner, promptId: p.id, factId: x });
        const right = r.placedBy[owner] || [];
        const wrong = all.filter(h => h !== owner && !right.includes(h));
        for (const g of [right[0], wrong[0]].filter(Boolean)) {
          push({ phase: 'round', round: i, kind: 'guessed', by: g, about: owner, right: right.includes(g), promptId: p.id, factId: x });
        }
        push({ phase: 'round', round: i, kind: 'owner', by: owner, promptId: p.id, factId: x, off: slipped.has(owner), n: right.length });
      }
    });
    const topic = [...slipped][0] || by(all, h => -(sc.data.rounds.reduce((n, r) => n + (r.placedBy[h]?.length || 0), 0)))[0];
    push({ phase: 'aftermath', kind: 'conclusion', by: pick(all.filter(h => h !== topic), rng), about: topic, slipped: slipped.has(topic) });
    if (slipped.size) remember(state, sc, 'fact-off', [...slipped][0], null, game.id);
  },

  make(state, rng, game, sc, all, push) {
    const r = sc.data.rounds[0];
    const R = sc.data.results;
    const q = R.quality;
    const tier = h => (q[h] < 5 ? 'disaster' : q[h] > 7.5 ? 'proud' : 'ok');
    push({ phase: 'prep', kind: 'props', by: pick(all, rng) });
    const makers = shuffled(all, rng).slice(0, Math.min(6, all.length));
    // Each maker says what they're going for, then we watch them try.
    for (const h of makers) push({ phase: 'prep', kind: 'plan', by: h, about: r.answers[h] !== 'made' ? r.answers[h] : undefined });
    for (const h of makers) push({ phase: 'prep', kind: `build.${tier(h)}`, by: h, about: r.answers[h] !== 'made' ? r.answers[h] : undefined });
    push({ phase: 'prep', kind: 'timeup', by: pick(all, rng) });
    push({ phase: 'reveal', kind: 'upload', by: pick(all, rng) });
    const order = by(all, h => -R.likes[h]).slice(-Math.min(8, all.length));   // least-liked first, the winner last
    for (const maker of order) {
      const subject = r.answers[maker] !== 'made' ? r.answers[maker] : null;
      const portrayal = r.portrayals?.[maker];
      push({ phase: 'reveal', kind: subject ? `portrait.${portrayal}` : 'item', by: maker, about: subject || pick(all.filter(h => h !== maker), rng),
        n: R.likes[maker], tier: tier(maker) });
      // Somebody else has something to say about it (and the likes it got).
      const commenter = pick(all.filter(h => h !== maker && h !== subject), rng);
      if (commenter) push({ phase: 'reveal', kind: 'comment', by: commenter, about: maker, n: R.likes[maker],
        many: R.likes[maker] >= 3, warm: rel(commenter, maker, 'affection') >= 0, tier: tier(maker) });
      if (subject) remember(state, sc, portrayal === 'jab' ? 'jab' : 'portrait-kind', maker, subject, game.id);
    }
    const loser = by(all, h => -R.likes[h] - q[h] / 100)[0];
    if (loser !== R.winner) push({ phase: 'verdict', kind: 'last', by: loser, n: R.likes[loser], tier: tier(loser) });
    push({ phase: 'verdict', kind: 'tally', by: pick(all.filter(h => h !== R.winner), rng), about: R.winner, n: R.likes[R.winner] });
    push({ phase: 'verdict', kind: 'winner', by: R.winner, about: pick(all.filter(h => h !== R.winner), rng) });
    remember(state, sc, 'won', R.winner, null, game.id);
  },

  photo(state, rng, game, sc, all, push) {
    const R = sc.data.results;
    for (const h of shuffled(all, rng).slice(0, 2)) push({ phase: 'prep', kind: 'choose', by: h });
    const posters = shuffled(all, rng).slice(0, Math.min(5, all.length));
    posters.forEach((h, i) => {
      const viewer = by(all.filter(v => v !== h), v => rel(v, h, 'attraction') + rel(v, h, 'affection') + rng())[0];
      push({ phase: 'round', round: i, kind: 'post', by: h, about: viewer, n: R.likes[h] });
      const tagger = pick(all.filter(v => v !== h && v !== viewer), rng) || viewer;
      push({ phase: 'round', round: i, kind: 'tag', by: tagger, about: h, warm: rel(tagger, h, 'affection') > 0 });
    });
    push({ phase: 'verdict', kind: 'winner', by: R.winner, about: pick(all.filter(h => h !== R.winner), rng), n: R.likes[R.winner] });
  },

  team(state, rng, game, sc, all, push) {
    const R = sc.data.results;
    const [c0, c1] = R.captains;
    push({ phase: 'prep', kind: 'captains', by: c0, about: c1, fresh: state.joinedDay?.[c0] === state.day });
    for (const cap of R.captains) {
      const ti = R.teams.findIndex(t => t[0] === cap);
      const scouted = shuffled(all.filter(h => !R.captains.includes(h)), rng).slice(0, 4);
      for (const t of scouted) push({ phase: 'prep', kind: R.teams[ti].includes(t) ? 'scout.want' : 'scout.pass', by: cap, about: t });
    }
    // Every pick, in order (the first pick of each captain has its own lines).
    const picks = [];
    const n = Math.max(R.teams[0].length, R.teams[1].length);
    for (let i = 1; i < n; i++) for (const t of [0, 1]) if (R.teams[t][i]) picks.push([R.teams[t][0], R.teams[t][i]]);
    picks.forEach(([cap, h], i) => {
      if (h === R.lastPick) return;
      push({ phase: 'prep', kind: i < 2 ? 'pick.first' : 'pick', by: cap, about: h, n: i + 1 });
    });
    if (R.lastPick) {
      const cap = R.teams.find(t => t.includes(R.lastPick))[0];
      push({ phase: 'prep', kind: 'last', by: R.lastPick, about: cap });
      remember(state, sc, 'picked-last', cap, R.lastPick, game.id);
    }
    push({ phase: 'round', round: -1, kind: 'trash', by: c0, about: c1 });
    const qs = sc.data.rounds[0].questions || [];
    qs.forEach((qq, i) => {
      const cap = R.teams[qq.team][0];
      push({ phase: 'round', round: i, kind: qq.right ? 'question.right' : 'question.wrong', by: qq.by, about: cap,
        qid: qq.qid, right: qq.right, n: `${qq.score[0]} to ${qq.score[1]}` });
      // The other team has an opinion about it.
      const other = pick(R.teams[1 - qq.team], rng);
      if (other) push({ phase: 'round', round: i, kind: 'banter', by: other, about: qq.by, right: qq.right });
    });
    const w = R.winner;
    push({ phase: 'verdict', kind: 'result', by: R.teams[w][0], about: R.teams[1 - w][0],
      n: `${Math.floor(R.scores[w])} to ${Math.floor(R.scores[1 - w])}` });
  },

  gift(state, rng, game, sc, all, push) {
    const ans = sc.data.rounds[0].answers;
    for (const g of shuffled(Object.keys(ans), rng).slice(0, 4)) push({ phase: 'prep', kind: 'choose', by: g, about: ans[g] });
    for (const g of Object.keys(ans)) {
      push({ phase: 'reveal', kind: 'gift', by: g, about: ans[g] });
      remember(state, sc, 'gift', g, ans[g], game.id);
    }
    const thanked = [...new Set(Object.values(ans))].slice(0, 4);
    for (const rcv of thanked) {
      const giver = Object.keys(ans).find(g => ans[g] === rcv);
      push({ phase: 'reveal', kind: 'thanks', by: rcv, about: giver });
    }
    const none = all.filter(h => !Object.values(ans).includes(h));
    for (const h of none.slice(0, 2)) push({ phase: 'aftermath', kind: 'none', by: h });
    const pairs = Object.keys(ans).filter(g => ans[ans[g]] === g);
    if (pairs.length) {
      const [a] = pairs;
      const obs = pick(all.filter(h => h !== a && h !== ans[a]), rng);
      if (obs) push({ phase: 'aftermath', kind: 'noticed', by: obs, about: a, c: ans[a] });
    } else if (!none.length) push({ phase: 'aftermath', kind: 'noticed', by: pick(all, rng), about: Object.keys(ans)[0], c: ans[Object.keys(ans)[0]] });
  },

  rival(state, rng, game, sc, all, push) {
    const ans = sc.data.rounds[0].answers;
    const namers = Object.keys(ans);
    namers.forEach((v, i) => {
      push({ phase: 'round', round: i, kind: 'statement', by: v, about: ans[v], mutual: ans[ans[v]] === v });
      push({ phase: 'round', round: i, kind: 'reply', by: ans[v], about: v, mutual: ans[ans[v]] === v });
      remember(state, sc, 'rival', v, ans[v], game.id);
    });
    const counts = {};
    for (const r of Object.values(ans)) counts[r] = (counts[r] || 0) + 1;
    const most = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    push({ phase: 'aftermath', kind: 'react', by: most, n: counts[most] });
    const obs = pick(all.filter(h => h !== most), rng);
    push({ phase: 'aftermath', kind: 'observe', by: obs, about: most, n: counts[most] });
  },

  flirt(state, rng, game, sc, all, push) {
    const ans = sc.data.rounds[0].answers;
    for (const h of Object.keys(ans)) push({ phase: 'prep', kind: 'practice', by: h, about: ans[h] });
    const seen = new Set();
    let i = 0;
    for (const [a, b] of Object.entries(ans)) {
      if (seen.has(a)) continue;
      seen.add(a); seen.add(b);
      push({ phase: 'round', round: i, kind: 'line', by: a, about: b });
      push({ phase: 'round', round: i, kind: 'answer', by: b, about: a });
      const second = pick(all.filter(h => h !== a && h !== b), rng);
      if (second) push({ phase: 'round', round: i, kind: 'react', by: second, about: b, c: a });
      const watcher = pick(all.filter(h => h !== a && h !== b), rng);
      if (watcher) push({ phase: 'round', round: i, kind: 'react', by: watcher, about: a, c: b });
      remember(state, sc, 'flirted', a, b, game.id);
      i++;
    }
    const w = sc.data.results?.winner;
    if (w) {
      const voters = shuffled(all.filter(h => !w.includes(h)), rng).slice(0, 5);
      for (const v of voters.length ? voters : [w[1]]) push({ phase: 'verdict', kind: 'vote', by: v, about: w[0] });
      push({ phase: 'verdict', kind: 'date', by: w[0], about: w[1] });
      for (const h of shuffled(all.filter(x => !w.includes(x)), rng).slice(0, 2)) push({ phase: 'verdict', kind: 'react', by: h, about: w[0], c: w[1] });
    }
  },
};


/** Build the beats of a played game, and remember what it did. */
export function beatsFor(state, rng, game, sc) {
  const all = sc.seenBy;
  const beats = [];
  const push = b => beats.push(b);
  const reader = all[sc.id % all.length];
  push({ phase: 'announce', kind: 'open', by: reader });
  for (const h of shuffled(all.filter(x => x !== reader), rng).slice(0, 2)) push({ phase: 'announce', kind: 'first', by: h });
  FAMILY[game.family]?.(state, rng, game, sc, all, push);
  for (const sl of (sc.data.slips || []).slice(0, 2)) {
    push({ phase: 'aftermath', kind: 'slip', by: sl.by, about: sl.noticedBy[0] || all.find(h => h !== sl.by), misread: !!sl.misread });
  }
  if (sc.data.prize) {
    const [a, b] = sc.data.prize.to;
    push({ phase: 'prize', kind: `prize.${sc.data.prize.kind}`, by: a, about: b });
  }
  sc.data.beats = beats;
  return beats;
}

export { GAMES };
