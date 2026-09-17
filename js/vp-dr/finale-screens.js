// ══════════════════════════════════════════════════════════════════════
// vp-dr/finale-screens.js — the finale's own screens, not generic cards
// ══════════════════════════════════════════════════════════════════════
//
// The showcase, the interview, the cut, and the winner moment — four
// screens that were rendered as the same grey text card as a werk room
// chat. A finale deserves better.
import { _shell, _portrait, _judgePortrait } from './style.js';
import { _controls, _state } from './reveal.js';
import { FINALE_STAGE_CSS, crownLipsyncStage, showcaseStage, interviewStage, finaleCard, wireStage } from './finale-stage.js';

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

export const CUT_CSS = `
.ct-wrap{position:relative}

/* ── THE LINEUP ── sticky, lights go out ── */
.ct-stage{position:sticky;top:0;z-index:6;padding:18px 20px 16px;margin-bottom:20px;
  background:radial-gradient(120% 90% at 50% 0%,rgba(255,41,75,.14),transparent 55%),
    linear-gradient(180deg,#1D0710,#12030A 70%,rgba(10,2,5,.97));
  border-bottom:1px solid rgba(255,41,75,.35);
  box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}
.ct-line{display:flex;justify-content:center;align-items:flex-end;gap:18px;flex-wrap:wrap}

.ct-plate{position:relative;width:130px;padding:14px 10px 10px;text-align:center;
  border:1px solid rgba(255,255,255,.18);border-radius:2px;
  background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.4));
  transition:opacity .6s,filter .6s,transform .6s cubic-bezier(.2,1.1,.4,1),
    border-color .6s,box-shadow .6s}
.ct-plate::before{content:"";position:absolute;left:50%;bottom:100%;
  width:100px;height:150px;transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,41,75,.25),transparent 75%);
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);transition:opacity .6s}
.ct-plate .dr-por{margin:0 auto;border:2px solid rgba(255,200,200,.4);
  box-shadow:0 0 22px rgba(255,41,75,.4);transition:filter .6s,border-color .6s,box-shadow .6s}
.ct-plate b{display:block;margin-top:8px;font-size:16px;color:#fff6fb}

/* CUT: light goes out */
.ct-plate.ct-out{opacity:.35;transform:translateY(8px) scale(.88);
  border-color:rgba(255,255,255,.06)}
.ct-plate.ct-out .dr-por{filter:grayscale(1) brightness(.45);
  border-color:rgba(255,255,255,.1);box-shadow:none}
.ct-plate.ct-out::before{opacity:0}

/* SURVIVING: brighter */
.ct-plate.ct-safe{border-color:rgba(255,200,61,.5);transform:translateY(-4px);
  box-shadow:0 0 40px -8px rgba(255,200,61,.4)}
.ct-plate.ct-safe .dr-por{border-color:rgba(255,200,61,.6);
  box-shadow:0 0 36px rgba(255,200,61,.6)}
.ct-plate.ct-safe::before{background:linear-gradient(180deg,rgba(255,233,168,.4),transparent 78%)}

/* ── THE BEATS ── host speaks, queen reacts ── */
.ct-said{padding:24px 26px;text-align:center;
  border-top:1px solid rgba(255,41,75,.3);border-bottom:1px solid rgba(255,41,75,.3);
  background:linear-gradient(180deg,rgba(255,41,75,.06),transparent)}
.ct-said q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:20px;
  line-height:1.55;color:#fff6fb;quotes:none;text-wrap:pretty;max-width:60ch;margin:0 auto}
.ct-react{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:16px 20px;border-left:3px solid rgba(255,41,75,.4);
  background:rgba(0,0,0,.3)}
.ct-react p{margin:0;color:#f4e3ed;line-height:1.65;text-wrap:pretty}
.ct-react .dr-por{border:2px solid rgba(255,200,200,.3)}

.dr-step.dr-vis .ct-said{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}
.dr-step.dr-vis .ct-react{animation:crTell .45s ease-out both}
@keyframes crTell{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}

/* ── SUSPENSE — the host deliberates ── */
.ct-suspense{border-color:rgba(255,233,168,.3);
  background:linear-gradient(180deg,rgba(255,233,168,.06),transparent)}
.ct-suspense q{color:rgba(255,233,168,.85);font-size:18px}

/* ── LAST WORDS — the cut queen speaks ── */
.ct-lastwords{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:16px 20px;margin-top:-4px;
  border-left:3px solid rgba(127,68,96,.5);
  background:linear-gradient(90deg,rgba(127,68,96,.12),transparent 40%),rgba(0,0,0,.3)}
.ct-lastwords .dr-por{border:2px solid rgba(127,68,96,.5);
  filter:brightness(.75) saturate(.7);box-shadow:0 0 18px rgba(127,68,96,.3)}
.ct-lw-label{display:block;font-size:9px;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(127,68,96,.8);margin-bottom:4px}
.ct-lw-body p{margin:0;color:#c9a6bc;line-height:1.6;font-style:italic;text-wrap:pretty}
.dr-step.dr-vis .ct-lastwords{animation:crTell .45s ease-out both}

@media(max-width:760px){.ct-stage{position:static}.ct-plate{width:100px}}
@media(prefers-reduced-motion:reduce){
  .ct-plate,.ct-plate::before,.ct-plate .dr-por{transition:none}
  .dr-step.dr-vis .ct-said,.dr-step.dr-vis .ct-react,.dr-step.dr-vis .ct-lastwords{animation:none}
}
`;

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

  // Alphabetical: `placements` is the finishing order, and the rail would print it.
  const finalists = [...(row?.dr?.finale?.placements || row?.dr?.living || [])].sort((x, y) => x.localeCompare(y));
  const cutQueens = cutScene?.data?.cut || [];
  const safe = finalists.filter(n => !cutQueens.includes(n));

  const line = [...finalists].sort((a, b) => a.localeCompare(b));
  const stage = `<div class="ct-stage" id="ct-stage">
    <div class="ct-line">${line.map(n =>
      `<div class="ct-plate" id="ct-plate-${esc(n)}" data-queen="${esc(n)}">
        ${_portrait(n, ep, { size: 80, station: true })}
        <b class="dr-disp">${esc(n)}</b>
      </div>`).join('')}</div></div>`;

  let n = 0;
  const steps = [];

  for (const sc of suspense) {
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="" data-safe="">
      <div class="ct-said ct-suspense">
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${_judgePortrait('rupaul', { stage: true, size: 48 })}
        </div>
        <q>${esc(sc.text)}</q>
      </div></div>`);
  }

  if (cutScene) {
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="" data-safe="">
      <div class="ct-said">
        <div style="display:flex;justify-content:center;margin-bottom:12px">
          ${_judgePortrait('rupaul', { stage: true, size: 48 })}
        </div>
        <q>${esc(cutScene.text)}</q>
      </div></div>`);
  }

  const cutSoFar = [];
  const lastwordsMap = {};
  for (const sc of lastwords) {
    const who = (sc.data?.players || [])[0] || '';
    if (who) lastwordsMap[who] = sc.text;
  }

  for (const sc of reactions) {
    const who = (sc.data?.players || [])[0] || '';
    cutSoFar.push(who);
    const isFinal = cutSoFar.length >= cutQueens.length;
    steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
      data-cut="${esc(cutSoFar.join(','))}" data-safe="${esc(isFinal ? safe.join(',') : '')}">
      <div class="ct-react">
        ${_portrait(who, ep, { size: 56, station: true })}
        <p>${esc(sc.text)}</p>
      </div></div>`);
    if (lastwordsMap[who]) {
      steps.push(`<div class="dr-step" id="dr-step-fincut-${n++}"
        data-cut="${esc(cutSoFar.join(','))}" data-safe="${esc(isFinal ? safe.join(',') : '')}">
        <div class="ct-lastwords">
          ${_portrait(who, ep, { size: 48, station: true })}
          <div class="ct-lw-body">
            <span class="ct-lw-label dr-disp">Last Words</span>
            <p>${esc(lastwordsMap[who])}</p>
          </div>
        </div></div>`);
    }
  }

  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fincut = (idx) => {
      const step = document.getElementById(`dr-step-fincut-${idx}`);
      const gone = (step?.dataset.cut || '').split(',').filter(Boolean);
      const survivors = (step?.dataset.safe || '').split(',').filter(Boolean);
      for (const el of document.querySelectorAll('.ct-plate')) {
        const q = el.dataset.queen;
        el.classList.toggle('ct-out', gone.includes(q));
        el.classList.toggle('ct-safe', survivors.includes(q));
      }
    };
  }

  const rail = `<h4 class="dr-disp">The Cut</h4>${
    line.map(nm => `<div class="dr-slot">
      ${_portrait(nm, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(nm)}</div></div></div>`).join('')}`;

  return `<style>${CUT_CSS}</style>${_shell(
    `<div class="ct-wrap">${stage}${steps.join('')}</div>`, ep, {
      phase: 'stage', title: 'The Cut',
      subtitle: 'the field becomes two',
      sidebar: rail,
    })}${_controls('fincut', Math.max(1, n), ep.num)}`;
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
