// ══════════════════════════════════════════════════════════════════════
// vp-dr/finale-screens.js — the finale's own screens, not generic cards
// ══════════════════════════════════════════════════════════════════════
//
// The showcase, the interview, the cut and the lip sync for the crown. Each
// draws a pinned stage from js/vp-dr/finale-stage.js over its cards; the
// crowning has its own, in js/vp-dr/crowning.js.
import { _shell, _portrait } from './style.js';
import { _controls, _state } from './reveal.js';
import { FINALE_STAGE_CSS, crownLipsyncStage, showcaseStage, interviewStage, cutStage, finaleCard, wireStage } from './finale-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

// ══════════════════════════════════════════════════════════════════════
//  THE SHOWCASE — each finalist performs her original number
// ══════════════════════════════════════════════════════════════════════

export function rpBuildShowcase(row) {
  const ep = epOf(row);
  const scenes = (row?.dr?.scenes || []).filter(s =>
    /^finale:finale-showcase/.test(s.kind || '') && s.text);
  if (!scenes.length) return '';
  // Alphabetical: the board must not print an order before anybody performs.
  const finalists = [...(row?.dr?.finale?.placements || row?.dr?.living || [])].sort((a, b) => a.localeCompare(b));

  /* ── THE STAGE ── js/vp-dr/finale-stage.js: curtains, the performer, an
     applause meter that fills to what she did, a board of who has gone. */
  const list = scenes.map(sc => (sc.kind === 'finale:finale-showcase-open'
    ? { t: 'open', text: sc.text }
    : { t: 'perf', who: (sc.data?.players || [])[0] || '', tier: sc.data?.tier || 'strong', perf: Number(sc.data?.perf) || 0, text: sc.text }));
  const stage = showcaseStage(row, list, { ep, finalists, uid: `s${ep.num}` });
  const TAG = { killed: 'The number of her life', strong: 'Strong', shaky: 'Shaky' };
  const cards = list.map((s, i) => finaleCard({
    id: `dr-step-finshowcase-${i}`, ep,
    host: s.t === 'open' ? 'rupaul' : null, who: s.t === 'perf' ? s.who : null,
    tag: s.t === 'open' ? 'The host' : `${s.who} · ${TAG[s.tier] || 'Her number'}`,
    cls: s.tier === 'killed' ? 'big' : s.tier === 'shaky' ? 'red' : '',
    text: s.text,
  })).join('');
  wireStage('finshowcase', stage, ep, _state);

  const rail = `<h4 class="dr-disp">The Showcase</h4>${
    finalists.map(nm => `<div class="dr-slot"><div>${_portrait(nm, ep, { size: 32 })}</div>
        <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${FINALE_STAGE_CSS}</style>${_shell(
    `${stage.html}<div class="fsx-cards">${cards}</div>`, ep, {
      phase: 'stage', title: 'The Showcase',
      subtitle: 'individual show-stopping original numbers',
      sidebar: rail,
    })}${_controls('finshowcase', Math.max(1, list.length), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  THE INTERVIEW — one-on-one with the host
// ══════════════════════════════════════════════════════════════════════

export function rpBuildInterview(row) {
  const ep = epOf(row);
  const KIND = {
    'finale:finale-interview': 'single',
    'finale:finale-interview-ask': 'ask', 'finale:finale-interview-answer': 'answer',
    'finale:finale-interview-follow': 'follow', 'finale:finale-interview-close': 'close',
  };
  const scenes = (row?.dr?.scenes || []).filter(s => KIND[s.kind] && s.text);
  if (!scenes.length) return '';
  // Alphabetical: `placements` is the finishing order, and the rail would print it.
  const finalists = [...(row?.dr?.finale?.placements || row?.dr?.living || [])].sort((x, y) => x.localeCompare(y));

  const list = scenes.map(sc => ({ t: KIND[sc.kind], who: (sc.data?.players || [])[0] || '', text: sc.text }));
  const order = [];
  for (const s of list) if (s.who && !order.includes(s.who)) order.push(s.who);
  /* ── THE STAGE ── two chairs, the question and the answer, and the heat a
     follow-up puts on her. See js/vp-dr/finale-stage.js. */
  const stage = interviewStage(row, list, { ep, finalists: order.length ? order : finalists, uid: `i${ep.num}` });
  const TAG = { ask: 'Michelle asks', answer: 'answers', follow: 'Michelle pushes', close: 'the last word', single: 'one on one' };
  const cards = list.map((s, i) => {
    const hostTalks = s.t === 'ask' || s.t === 'follow';
    return finaleCard({
      id: `dr-step-fininterview-${i}`, ep,
      host: hostTalks ? 'michelle' : null, who: hostTalks ? null : s.who,
      tag: hostTalks ? `${TAG[s.t]} · ${s.who}` : `${s.who} · ${TAG[s.t]}`,
      cls: s.t === 'follow' ? 'red' : '',
      text: s.text,
    });
  }).join('');
  wireStage('fininterview', stage, ep, _state);

  const rail = `<h4 class="dr-disp">One on One</h4>${
    finalists.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${FINALE_STAGE_CSS}</style>${_shell(
    `${stage.html}<div class="fsx-cards">${cards}</div>`, ep, {
      phase: 'werk', title: 'The Interviews',
      subtitle: 'why should it be you',
      sidebar: rail,
    })}${_controls('fininterview', Math.max(1, list.length), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  THE CUT — the field becomes two
// ══════════════════════════════════════════════════════════════════════

export function rpBuildCut(row) {
  const ep = epOf(row);
  const CUT_KINDS = new Set([
    'finale:finale-cut', 'finale:finale-cut-reaction',
    'finale:finale-cut-suspense', 'finale:finale-cut-lastwords',
  ]);
  const allCut = (row?.dr?.scenes || []).filter(s => CUT_KINDS.has(s.kind) && s.text);
  if (!allCut.length) return '';

  const cutScene = allCut.find(s => s.kind === 'finale:finale-cut');
  const suspense = allCut.filter(s => s.kind === 'finale:finale-cut-suspense');
  const reactions = allCut.filter(s => s.kind === 'finale:finale-cut-reaction');
  const lastwords = allCut.filter(s => s.kind === 'finale:finale-cut-lastwords');
  const cutQueens = cutScene?.data?.cut || suspense[0]?.data?.cut || [];
  // Alphabetical: any other order would print the cut before it happens.
  const line = [...(row?.dr?.finale?.placements || row?.dr?.living || [])].sort((a, b) => a.localeCompare(b));

  /* THE STEPS, in the order the night runs them: the host's pause, the
     announcement, then each queen cut and what she says on her way out. */
  const list = [
    ...suspense.map(sc => ({ t: 'suspense', text: sc.text })),
    ...(cutScene ? [{ t: 'cut', text: cutScene.text }] : []),
  ];
  const lastOf = {};
  for (const sc of lastwords) lastOf[(sc.data?.players || [])[0] || ''] = sc.text;
  for (const sc of reactions) {
    const who = (sc.data?.players || [])[0] || '';
    list.push({ t: 'react', who, text: sc.text });
    if (lastOf[who]) list.push({ t: 'last', who, text: lastOf[who] });
  }

  /* ── THE STAGE ── js/vp-dr/finale-stage.js: the line under their lights,
     a spotlight hunting along it, each cut queen going dark, and the two
     left for the crown lit gold. */
  const stage = cutStage(row, list, { ep, line, cut: cutQueens, uid: `k${ep.num}` });
  const cards = list.map((s, i) => finaleCard({
    id: `dr-step-fincut-${i}`, ep,
    host: s.t === 'suspense' || s.t === 'cut' ? 'rupaul' : null,
    who: s.t === 'react' || s.t === 'last' ? s.who : null,
    tag: s.t === 'suspense' ? 'The host' : s.t === 'cut' ? 'The host · the cut' : s.t === 'react' ? `${s.who} · cut` : `${s.who} · her last words`,
    cls: s.t === 'react' ? 'red' : '',
    text: s.text,
  })).join('');
  wireStage('fincut', stage, ep, _state);

  const rail = `<h4 class="dr-disp">The Cut</h4>${
    line.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${FINALE_STAGE_CSS}</style>${_shell(
    `${stage.html}<div class="fsx-cards">${cards}</div>`, ep, {
      phase: 'stage', title: 'The Cut',
      subtitle: 'the field becomes two',
      sidebar: rail,
    })}${_controls('fincut', Math.max(1, list.length), ep.num)}`;
}


// ══════════════════════════════════════════════════════════════════════
//  LIP SYNC FOR THE CROWN — the same fight, in gold
// ══════════════════════════════════════════════════════════════════════

export function rpBuildCrownLipSync(row) {
  const ep = epOf(row);
  /* ── AND WHAT ACTUALLY HAPPENED IN THE LIP SYNC ──
     js/dr/finale.js narrates it off the SONG, one card per queen from the
     tempo pool, then the moment the record is decided at from the hook pool.
     Every one of those lines is a card here (tests/dr-crown-lipsync-prose). */
  const LS_KINDS = new Set([
    'finale:finale-crown-lipsync', 'finale-duel',
    'finale:finale-preduel', 'finale:finale-interview',
    'finale:duel-beat', 'finale:duel-hook',
  ]);
  const scenes = (row?.dr?.scenes || []).filter(s =>
    LS_KINDS.has(s.kind) && (s.text || s.data?.duel));
  if (!scenes.length) return '';
  // Alphabetical: `placements` is the finishing order, and the rail would print it.
  const finalists = [...(row?.dr?.finale?.placements || row?.dr?.living || [])].sort((x, y) => x.localeCompare(y));
  const rounds = scenes.filter(s => s.data?.duel).map(s => s.data.duel);
  if (!rounds.length && row?.dr?.finale?.rounds) rounds.push(...row.dr.finale.rounds);

  /* THE STEP LIST, ONCE. A round's number comes off the scene when it has
     one (`data.round`, 1-based), and otherwise from how many rounds have been
     decided before it. */
  const list = [];
  let decided = 0;
  for (const sc of scenes) {
    const r = Number.isInteger(sc.data?.round) ? sc.data.round - 1 : decided;
    const who = (sc.data?.players || [])[0] || '';
    if (sc.kind === 'finale:finale-crown-lipsync') list.push({ t: 'setup', r: 0, text: sc.text });
    else if (sc.kind === 'finale:finale-preduel' || sc.kind === 'finale:finale-interview') list.push({ t: 'talk', r, who, text: sc.text });
    else if (sc.kind === 'finale:duel-beat') list.push({ t: 'beat', r, who, tier: sc.data?.tier, tempo: sc.data?.tempo, text: sc.text });
    else if (sc.kind === 'finale:duel-hook') list.push({ t: 'hook', r, who, tier: sc.data?.tier, hook: sc.data?.hook, text: sc.text });
    else if (sc.data?.duel) list.push({ t: 'verdict', r: decided++, duel: sc.data.duel });
  }

  const stage = crownLipsyncStage(row, list, rounds, { ep, uid: `c${ep.num}` });
  const n = rounds.length;
  const label = i => (i === n - 1 ? 'The final' : n === 2 ? 'The semi-final' : `Semi-final ${i + 1}`);
  const cards = list.map((s, i) => {
    const id = `dr-step-fincrownls-${i}`;
    if (s.t === 'setup') return finaleCard({ id, ep, host: 'rupaul', tag: 'The host', text: s.text });
    if (s.t === 'talk') return finaleCard({ id, ep, host: 'rupaul', tag: `The host to ${s.who} · ${label(s.r)}`, text: s.text });
    if (s.t === 'beat') return finaleCard({ id, ep, who: s.who, tag: `${s.who} · ${label(s.r)}`, text: s.text });
    if (s.t === 'hook') {
      return finaleCard({ id, ep, who: s.who, cls: s.tier === 'nailed' ? 'big' : 'red',
        tag: `${s.who} ${s.tier === 'nailed' ? 'takes the moment' : 'loses the moment'}`, text: s.text });
    }
    const d = s.duel;
    const sa = Number(d.scores?.[d.a]) || 0;
    const sb = Number(d.scores?.[d.b]) || 0;
    return finaleCard({ id, ep, who: d.winner, cls: 'big', tag: `${label(s.r)} · ${d.song || ''}`,
      text: `${d.a} ${sa.toFixed(1)} · ${d.b} ${sb.toFixed(1)}. ${d.winner} ${s.r === n - 1 ? 'wins the lip sync for the crown' : 'goes through'}.` });
  }).join('');
  wireStage('fincrownls', stage, ep, _state);

  const rail = `<h4 class="dr-disp">For The Crown</h4>${
    finalists.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${FINALE_STAGE_CSS}</style>${_shell(
    `${stage.html}<div class="fsx-cards">${cards}</div>`, ep, {
      phase: 'lipsync', title: 'Lip Sync For The Crown',
      subtitle: 'this is for everything',
      sidebar: rail,
    })}${_controls('fincrownls', Math.max(1, list.length), ep.num)}`;
}
