// ══════════════════════════════════════════════════════════════════════
// vp-dr/snatch-screen.js — the Snatch Game, as a screen
// ══════════════════════════════════════════════════════════════════════
//
// Draws the taping js/dr/chal/snatch-game.js recorded, step by step: the
// host opens, the panel introduces itself, and then each card — the host
// reads it, goes down the panel, maybe throws a queen a follow-up, the
// celebrities talk over each other, and the contestant turns her card over.
//
// Every word on this screen was picked by the engine. Nothing here chooses a
// joke; the old screen drew random answers from a generic pool, which is how
// a queen doing Cher answered a question about her fridge with a line that
// could have come from anybody.
import { _shell, _portrait, _judgePortrait } from './style.js';
import { _controls, _seedRail, _state } from './reveal.js';
import { wireStage } from './finale-stage.js';
import { CHAL_STAGE_CSS } from './chal-stage.js';
import { snatchStage, SNATCH_STAGE_CSS, laughWord, faceOf, contestantFace } from './snatch-stage.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });
const sceneData = (row, kind) => (row?.dr?.scenes || []).find(s => s.kind === kind)?.data || null;
const firstName = s => String(s || '').split(' ')[0];
/** The host's words are a speech bubble on the stage, so they are kept short there. */
const bubbleOf = t => {
  const s = String(t || '').replace(/^\[[^\]]*\]\s*/, '');
  return s.length > 110 ? `${s.slice(0, 107).trimEnd()}…` : s;
};

const badge = v => {
  if (v == null) return '';
  const w = laughWord(v);
  return `<span class="lg" style="background:${w[2]}22;color:${w[2]}">${esc(w[1])}</span>`;
};

/** True when this row carries the taping as the new engine records it. */
export function hasSnatchScript(row) {
  return !!sceneData(row, 'snatch-taping')?.intros;
}

export function rpBuildSnatchScript(row, { extraCss = '' } = {}) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const data = sceneData(row, 'snatch-taping');
  if (!ch || !data?.intros) return '';
  const sfx = 'maxi';
  const contestants = data.contestants || [];
  const seat = data.intros.map(i => ({ name: i.name, character: i.character }));
  const charOf = n => seat.find(s => s.name === n)?.character || n;

  /* THE ROW'S OTHER SCENES FOR THIS CHALLENGE. The engine's events carry
     their own prose (a queen dying on the panel, a double act, the host's
     follow-up) and the confessionals are filed on the row too; each is hung
     on the card of the queen it is about, and anything left over gets a step
     of its own at the end, so nothing written is left unshown. */
  const MAXI_STEPS = new Set(['maxi-pre', 'maxi-main']);
  const extra = (row.dr.scenes || []).filter(s => s.text && MAXI_STEPS.has(s.step)
    && /^(perform:|maxi:|chal:performance|confess:)/.test(s.kind || ''));
  const usedExtra = new Set();
  const extraFor = (name, pred = () => true) => {
    const out = [];
    for (const s of extra) {
      if (usedExtra.has(s)) continue;
      const who = s.data?.about || (s.data?.players || [])[0];
      if (who !== name || !pred(s)) continue;
      usedExtra.add(s);
      out.push(s);
    }
    return out;
  };
  const extraHtml = list => list.map(s => `<p class="${/^confess:/.test(s.kind) ? 'cf' : ''}">${
    /^confess:/.test(s.kind) ? '<b>Confessional:</b> ' : ''}${esc(s.text)}</p>`).join('');

  const steps = [];   // { state, card }
  const totals = {};
  const dead = new Set();
  const points = [0, 0];
  const add = (state, card) => steps.push({ state: { ...state, points: [...points], dead: [...dead], tot: { ...totals } }, card });
  const hostCard = (tag, text, cls = '') => `<div class="sgc host ${cls}">${_judgePortrait('rupaul', { stage: true, size: 42 })}
    <div><span class="sgc-tag">${esc(tag)}</span><p>${esc(text)}</p></div></div>`;
  const queenCard = (name, tag, body, cls = '') => `<div class="sgc ${cls}">${_portrait(name, ep, { size: 48, station: true })}
    <div><span class="sgc-tag">${esc(tag)}</span>${body}</div></div>`;
  const close = (name, title, sub, text, card = '') => ({ face: faceOf(name, ep, 64), title, sub, text, card });
  // The host and the players get the push-in too, so the strip is never empty.
  const ruClose = (sub, text) => ({ face: `<span class="fsx-face">${_judgePortrait('rupaul', { stage: true, size: 64 })}</span>`, title: 'RuPaul', sub, text });
  const playerClose = (x, sub, text, card = '') => ({ face: `<span class="fsx-face">${contestantFace(x, ep, 64)}</span>`, title: x.name, sub, text, card });

  // ── THE OPEN ──
  add({ pill: 'The panel', headline: 'Welcome to the Snatch Game.', bubble: 'Welcome to the Snatch Game!', close: ruClose('opens the game', data.open) },
    hostCard('RuPaul opens the game', data.open));

  // ── THE PANEL, INTRODUCED ──
  for (const i of data.intros) {
    totals[i.name] = totals[i.name] || 0;
    add({ pill: 'Meet the panel', headline: `Introducing ${i.character || i.name}`, on: [i.name], laugh: i.laugh,
      close: close(i.name, i.character || i.name, `${i.name} · introducing herself`, i.text) },
    queenCard(i.name, `${i.character || '???'} · ${i.name}`, `<p>${esc(i.text)}${badge(i.laugh)}</p>`, i.tier));
  }

  // ── THE CARDS ──
  for (const r of data.rounds || []) {
    const x = contestants[r.asker] || contestants[0] || { name: 'the contestant' };
    const flags = {};
    for (const p of r.passed || []) dead.add(p.name);
    const base = { pill: `Card ${r.round} of ${(data.rounds || []).length}`, qfor: `${firstName(x.name)} · fill in the blank`, question: r.question, asker: r.asker };
    add({ ...base, blank: '', newCard: true, bubble: bubbleOf(r.ask), close: ruClose(`to ${x.name}`, r.ask) },
      hostCard(`Card ${r.round} · to ${x.name}`, [r.ask, ...(r.passed || []).map(p => p.text)].join(' ')));

    for (const a of r.answers || []) {
      if (a.tier === 'kill') flags[a.name] = 'kill';
      if (a.tier === 'bomb') flags[a.name] = 'bomb';
      totals[a.name] = (totals[a.name] || 0) + a.laugh;
      const more = extraFor(a.name, s => /^confess:/.test(s.kind) && (a.tier === 'kill' || a.tier === 'bomb'));
      add({ ...base, blank: a.card, type: true, on: [a.name], laugh: a.laugh, flags: { ...flags }, bubble: bubbleOf(a.ru),
        close: close(a.name, a.character || a.name, a.name, a.say, a.card) },
      queenCard(a.name, `${a.character || '???'} · ${a.name}`,
        `<p><span class="card">${esc(a.card)}</span>${badge(a.laugh)}</p><p>${esc(a.say)}</p>
         <p class="ru"><b>RuPaul:</b> ${esc(a.ru)}</p>${extraHtml(more)}`, a.tier));
      if (a.rope) {
        // The follow-up replaces her number for this card: it is what the room took away.
        totals[a.name] += a.rope.laugh - a.laugh;
        const moreRope = extraFor(a.name, s => /(host-played-along|left-to-hang)/.test(s.kind));
        add({ ...base, blank: a.card, on: [a.name], laugh: a.rope.laugh, flags: { ...flags },
          bubble: a.rope.worked ? 'One more question for you…' : 'Anything else?',
          close: close(a.name, a.character || a.name, `${a.name} · the follow-up`, a.rope.text) },
        queenCard(a.name, `The follow-up · ${a.character || a.name}`, `<p>${esc(a.rope.text)}${badge(a.rope.laugh)}</p>${extraHtml(moreRope)}`,
          a.rope.worked ? 'laugh' : 'bomb'));
      }
    }

    if (r.cross) {
      const c = r.cross;
      add({ ...base, blank: (r.answers || []).slice(-1)[0]?.card || '', on: [c.from, c.to], laugh: c.laugh, flags: { ...flags },
        bubble: c.kind === 'heckle' ? 'Ladies, ladies…' : 'Look at you two!',
        close: close(c.from, charOf(c.from), c.kind === 'heckle' ? `to ${charOf(c.to)}` : `with ${charOf(c.to)}`, c.text) },
      queenCard(c.from, c.kind === 'heckle' ? `${charOf(c.from)} on ${charOf(c.to)}` : `${charOf(c.from)} and ${charOf(c.to)}`,
        `<p>${esc(c.text)}${badge(c.laugh)}</p>`, c.kind === 'heckle' ? '' : 'laugh'));
    }

    const rv = r.reveal || {};
    if ((rv.matches || []).length) points[r.asker] = (points[r.asker] || 0) + 1;
    const mflags = { ...flags };
    for (const m of rv.matches || []) mflags[m] = 'match';
    add({ ...base, blank: rv.card, on: rv.matches || [], flags: mflags, match: (rv.matches || []).length > 0,
      bubble: `${firstName(x.name)}, what did you write?`, close: playerClose(x, 'turns her card over', rv.text, rv.card) },
    `<div class="sgc host">${contestantFace(x, ep, 42)}<div><span class="sgc-tag">The reveal · ${esc(x.name)}</span>
      <p><span class="card">${esc(rv.card)}</span></p><p>${esc(rv.text)}</p></div></div>`);
  }

  // ── WHAT IS LEFT, AND THE CLOSE ──
  for (const s of extra) {
    if (usedExtra.has(s)) continue;
    usedExtra.add(s);
    const who = s.data?.about || (s.data?.players || [])[0];
    add({ pill: "That's the game", headline: 'After the taping', on: (s.data?.players || []).filter(Boolean) },
      who ? queenCard(who, /^confess:/.test(s.kind) ? `Confessional · ${who}` : 'The taping', `<p>${esc(s.text)}</p>`)
        : `<div class="sgc"><div><p>${esc(s.text)}</p></div></div>`);
  }
  const ranked = seat.map(s => ({ ...s, t: Math.round((totals[s.name] || 0) * 10) / 10 })).sort((a, b) => b.t - a.t);
  add({ pill: "That's the game", headline: "That's the Snatch Game!", bubble: bubbleOf(data.close), on: ranked.slice(0, 1).map(r => r.name),
    close: ruClose('closes the game', data.close) },
    `${hostCard('RuPaul closes the game', data.close)}
     <div class="sgc"><div style="width:100%"><span class="sgc-tag">Laughs on the night</span>${ranked.map(r =>
    `<p style="display:grid;grid-template-columns:minmax(0,1fr) 60px;gap:8px;margin:2px 0"><span>${esc(r.character || '???')} <small style="color:#b8a6c0">${esc(r.name)}</small></span><b style="text-align:right">${r.t.toFixed(1)}</b></p>`).join('')}</div></div>`);

  // ── THE STAGE AND THE RAIL ──
  const stage = snatchStage({ ep, seat, contestants, states: steps.map(s => s.state), uid: `sg${ep.num}` });
  wireStage(sfx, stage, ep, _state);
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const most = Math.max(1, ...Object.values(totals));
    window._drSidebar[sfx] = steps.map(s => {
      // The laughs as the viewer has heard them so far — nothing ahead of the reveal.
      const st = s.state;
      const order = [...seat].sort((a, b) => (st.tot[b.name] || 0) - (st.tot[a.name] || 0));
      return `<h4 class="dr-disp">Laughs so far</h4>${order.map(q => `<div class="dr-slot">${_portrait(q.name, ep, { size: 28 })}
        <div style="flex:1;min-width:0"><div class="dr-nm">${esc(q.name)}</div><div style="font-size:10px;color:#ffd166">${esc(q.character || '')}</div>
        <div style="height:5px;border-radius:9px;background:rgba(255,255,255,.08);margin-top:3px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(((st.tot[q.name] || 0) / most) * 100)}%;background:linear-gradient(90deg,#ffb238,#ff3d8b)"></i></div></div>
        ${(st.dead || []).includes(q.name) ? '<span class="dr-chip dr-c-low">passed over</span>' : ''}</div>`).join('')}`;
    });
  }

  const cards = steps.map((s, i) => `<div class="dr-step" id="dr-step-${sfx}-${i}">${s.card}</div>`).join('');
  return `<style>${extraCss}${CHAL_STAGE_CSS}${SNATCH_STAGE_CSS}
    .sgx-cards{display:flex;flex-direction:column;gap:8px}.sgc p.cf{color:#c9bfd8;font-style:italic}</style>${_shell(
    `${stage.html}<div class="dr-fam dr-chal dr-chal-snatch-game sgx-cards">${cards}</div>`, ep, {
      phase: 'stage', title: 'Snatch Game', subtitle: 'the celebrities are fake and the prizes are imaginary',
      sidebar: _seedRail(sfx, '<h4 class="dr-disp">The panel</h4>'),
    })}${_controls(sfx, steps.length, ep.num)}`;
}
