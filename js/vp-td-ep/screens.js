// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/screens.js — a Total Drama episode on the stepped stage (spec 2026-10-06 §6)
// ══════════════════════════════════════════════════════════════════════
//
// tdStepScreens(ep, classic, o): the classic screen list in, the same list out with the camp
// screens (camp-pre-*, camp-post-*) and the Tribal (tribal + votes, and the Voting Plans the
// Intel drawer now carries) replaced by stepped screens IN THEIR SLOTS, under the classic ids,
// so everything that finds a screen by id still finds it. Anything the stepped stage does not
// cover yet keeps its classic screen. A Classic switch on every stepped screen lands on the same
// screen in the classic viewer (localStorage 'td-vp' = 'classic' to stay there).
import { tdCampScreen, tdTribalScreen, tdTribalStepped, cleanText } from './steps.js';
import { tdRiChoiceScreen, tdIslandLifeScreen, tdExileScreen, exileOf } from './twists.js';
import { tdTwistBlocksScreen, tdMergeScreen } from './twist-screens.js';
import { ledgerAt, worldKey, worldHtml, worldSound, castAt, tokHtml, hudHtml, dialogue, intelHtml, esc, avatar, shotOf } from './stage.js';
import { TDX_CSS, TDX_FONTS } from './style.js';
import { ambience, stopAmbience, sfx } from './sound.js';

const reg = () => (typeof window !== 'undefined' ? (window._tdx ||= {}) : (globalThis._tdx ||= {}));
export const tdSteppedOn = () => { try { return globalThis.localStorage?.getItem('td-vp') !== 'classic'; } catch { return true; } };

/** Each camp's members as the episode started (the record, never live gs). */
function membersOf(ep, camp) {
  return ep.campAccess?.groups?.[camp]?.members
    || (ep.tribesAtStart || []).find(t => t.name === camp)?.members
    || (ep.gsSnapshot?.tribes || []).find(t => t.name === camp)?.members
    || [];
}

export function tdStepScreens(ep, classic = [], o = {}) {
  const out = [];
  let tribalDone = false;
  const tribal = tdTribalStepped(ep) ? tdTribalScreen(ep, o) : null;
  for (const S of classic) {
    const m = /^camp-(pre|post)-(.+)$/.exec(S?.id || '');
    if (m) {
      const scr = tdCampScreen(ep, m[2], m[1], membersOf(ep, m[2]), o);
      if (scr) { out.push(shell(scr, S, ep, o)); continue; }
    }
    if (tribal && (S.id === 'voting-plans' || S.id === 'votes')) continue;
    if (tribal && S.id === 'tribal' && !tribalDone) { tribalDone = true; out.push(shell(tribal, S, ep, o)); continue; }
    const isl = islandScreen(ep, S, o);
    if (isl) { out.push(shell(isl, S, ep, o)); continue; }
    out.push(S);
  }
  return out;
}

// The island twists (twists.js), in the classic screens' slots. 'rescue-life' is also the id some
// episode paths give the Redemption Island life screen, so the record says which island it is.
function islandScreen(ep, S, o) {
  const id = S?.id || '';
  if (id === 'ri-choice') return tdRiChoiceScreen(ep, o);
  if (id === 'ri-life') return tdIslandLifeScreen(ep, false, o);
  if (id === 'rescue-life') return tdIslandLifeScreen(ep, !!(ep.rescueIslandEvents || []).length, o);
  if (id === 'exile-island') return tdExileScreen(ep, exileOf(ep, false), o);
  if (id === 'exile-format') return tdExileScreen(ep, exileOf(ep, true), o);
  if (id === 'twist' && o.twistBlocks?.length) return tdTwistBlocksScreen(ep, o.twistBlocks, o);
  // the post-vote screen also carries an elimination card for a duel or a second life: classic there
  if (id === 'post-twist' && o.postBlocks?.length && !ep.exileDuelResult && !ep.fireMaking) return tdTwistBlocksScreen(ep, o.postBlocks, o, { post: true });
  if (id === 'merge' && o.merge) return tdMergeScreen(ep, o.merge, o);
  return null;
}

// ── the shell around a stepped screen ─────────────────────────────────
function scriptHtml(scr) {
  return scr.steps.map((s, i) => {
    let t = '';
    if (s.k === 'scene') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.place)}${s.time ? ' · ' + esc(s.time) : ''}</div>`;
    else if (s.k === 'say') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(s.by)}:</b> ${esc(s.text)}</div>`;
    else if (s.k === 'conf') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(s.by)} (confessional):</b> ${esc(s.text)}</div>`;
    else if (s.k === 'beat') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.text)})</div>`;
    else if (s.k === 'title') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.kicker)}: ${esc(s.name)}</div>`;
    else if (s.k === 'ballots') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.text)})</div>`;
    else if (s.k === 'idol') t = `<div class="tdx-ln d" data-s="${i}">(${esc(s.by)} plays a Hidden Immunity Idol${s.for !== s.by ? ` for ${esc(s.for)}` : ''}.)</div>`;
    else if (s.k === 'safe') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(scr.host || 'Chris')}:</b> ${esc(s.who)}${s.immune ? ', you won immunity' : ''}.</div>`;
    else if (s.k === 'read') t = `<div class="tdx-ln" data-s="${i}"><b>${esc(scr.host || 'Chris')}:</b> ${esc(s.vote)}.${s.dead ? ' Does not count.' : ''}</div>`;
    else if (s.k === 'out') t = `<div class="tdx-ln sc" data-s="${i}">${esc(s.who)} is ${s.island ? 'voted out' : 'eliminated'}</div>`;
    else if (s.k === 'found') t = `<div class="tdx-ln sc" data-s="${i}">${s.text ? esc(s.text) : `${esc(s.who)} finds the ${esc(s.label)}`}</div>`;
    return t.replace('class="tdx-ln', `onclick="tdxJump(this,${i})" class="tdx-ln`);
  }).join('');
}

function shell(scr, classicScreen, ep, o) {
  const uid = `tdx${esc(ep.num)}-${scr.id.replace(/[^\w-]/g, '')}`;
  reg()[uid] = { scr, idx: -1, auto: false, timer: null, typing: null, tab: null, o: { teamColor: scr.team && o.colorOf ? o.colorOf(scr.team) : '#4fb84a' } };
  const first = scr.steps.findIndex(s => s.k === 'scene');
  const peek = first >= 0 ? ledgerAt(scr, first) : null;
  const chap = scr.steps.filter(s => s.k === 'scene').length;
  // camp and the islands play the place's own sound, not the music bed (vp-ui.js reads data-ambient)
  const quiet = scr.kind === 'camp' || /^(ri-|rescue|exile)/.test(scr.id) ? ' data-ambient="none"' : '';
  const html = `<div class="tdx" data-uid="${uid}"${quiet}>
<style>${TDX_FONTS}${TDX_CSS}</style>
<div class="tdx-stage" id="tdx-st-${uid}" onclick="tdxNext('${uid}')" title="Click for the next line">
  <div class="tdx-world">${peek ? worldHtml(scr, peek) : ''}<div class="tdx-cast"></div><div class="tdx-fx"></div></div>
  <div class="tdx-hud"><div class="tdx-title fresh"><div class="band"></div><div class="inner"><div class="kicker">Episode ${esc(ep.num)}</div><div class="big">${esc(scr.label)}</div></div></div></div>
  <div class="tdx-dlg hidden"><div class="panel"></div><div class="tdx-cut"></div><div class="name"></div><div class="say"></div><div class="nx"></div></div>
  <button type="button" class="tdx-ibtn" onclick="event.stopPropagation();tdxIntel('${uid}')"><i></i>Intel</button>
  <div class="tdx-intel" onclick="event.stopPropagation();tdxTab('${uid}',event)"></div>
  <div class="tdx-static"></div>
</div>
<div class="tdx-ctrl">
  <button type="button" class="tdx-btn" onclick="tdxReset('${uid}')">Restart</button>
  <button type="button" class="tdx-btn" onclick="tdxBack('${uid}')">◀ Back <kbd>←</kbd></button>
  <button type="button" class="tdx-btn go" onclick="tdxNext('${uid}')">Next ▶ <kbd>Space</kbd></button>
  <button type="button" class="tdx-btn" id="tdx-auto-${uid}" onclick="tdxAuto('${uid}')">Auto</button>
  <button type="button" class="tdx-btn" onclick="tdxAll('${uid}')">Skip ⏭</button>
  <div class="tdx-chap" id="tdx-chap-${uid}">${'<i><b></b></i>'.repeat(Math.max(chap, 1))}</div>
  <span class="tdx-count" id="tdx-count-${uid}">0 / ${scr.steps.length}</span>
  <button type="button" class="tdx-btn" onclick="tdxTv()">TV mode</button>
  <button type="button" class="tdx-btn" onclick="tdxSwitchViewer('classic')" title="Back to the classic screens">Classic</button>
</div>
<details class="tdx-script"><summary>Script</summary><div class="tdx-lines" id="tdx-lines-${uid}">${scriptHtml(scr)}</div></details>
</div>`;
  return { ...classicScreen, id: classicScreen.id, label: classicScreen.label, html, stepped: true };
}

// ══════════════════════════════════════════════════════════════════════
// PAINT — keyed updates: the set rebuilds only when the scene changes, people never blink out
// ══════════════════════════════════════════════════════════════════════
const blip = { n: 0 };
function sync(uid) {
  const R = reg()[uid];
  const root = typeof document !== 'undefined' ? document.querySelector(`.tdx[data-uid="${uid}"]`) : null;
  if (R && root && root.dataset.idx == null) { R.idx = -1; stopAuto(R); R.wk = null; R.sceneAt = null; }
  return R;
}
function paint(uid, fresh) {
  const R = reg()[uid];
  if (!R || typeof document === 'undefined') return;
  const root = document.querySelector(`.tdx[data-uid="${uid}"]`);
  const st = document.getElementById(`tdx-st-${uid}`);
  if (!root || !st) return;
  root.dataset.idx = String(R.idx);
  const scr = R.scr, L = ledgerAt(scr, R.idx), s = L.step || {};
  clearInterval(R.typing);
  const world = st.querySelector('.tdx-world'), cast = st.querySelector('.tdx-cast'), fx = st.querySelector('.tdx-fx');
  // the set: rebuilt only on a new place (or into and out of the confessional)
  const wk = worldKey(scr, L) + (L.conf ? '' : '#' + scr.steps.indexOf(L.scene));
  const newWorld = R.wk !== wk;
  if (newWorld) {
    const wasConf = R.wk && R.wk.includes('/confessional');
    R.wk = wk;
    world.innerHTML = `${worldHtml(scr, L)}<div class="tdx-cast"></div><div class="tdx-fx"></div>`;
    if (fresh && (L.conf || wasConf)) { const bz = st.querySelector('.tdx-static'); bz.classList.remove('burst'); void bz.offsetWidth; bz.classList.add('burst'); sfx('static'); }
    else if (fresh && L.scene?.cut) sfx('whoosh');
  }
  const castEl = world.querySelector('.tdx-cast'), fxEl = world.querySelector('.tdx-fx');
  // the people: keyed by name, updated in place
  const toks = castAt(scr, L);
  const have = new Map([...castEl.children].map(el => [el.dataset.n, el]));
  for (const t of toks) {
    const tmp = document.createElement('div'); tmp.innerHTML = tokHtml(t, fresh); const el = tmp.firstElementChild;
    const old = have.get(t.n);
    if (old) { old.className = el.className; old.setAttribute('style', el.getAttribute('style')); old.querySelector('.body').innerHTML = el.querySelector('.body').innerHTML; have.delete(t.n); }
    else castEl.appendChild(el);
  }
  for (const el of have.values()) el.remove();
  // the camera: in on the conversation, leaning toward whoever talks; wide for the set itself
  const shot = shotOf(scr, L, toks);
  if (shot.k > 1) {
    st.classList.add('push');
    world.style.transform = `translate(${(shot.x * 100).toFixed(2)}%, ${(shot.y * 100).toFixed(2)}%) scale(${shot.k})`;
    for (const el of castEl.children) el.classList.toggle('offshot', !shot.who.includes(el.dataset.n));
  } else {
    st.classList.remove('push'); world.style.transform = '';
    for (const el of castEl.children) el.classList.remove('offshot');
  }
  st.classList.toggle('tense', L.tense);
  // the HUD
  st.querySelector('.tdx-hud').innerHTML = hudHtml(scr, L, fresh, R.o);
  // the line
  const d = dialogue(scr, L);
  const dlg = st.querySelector('.tdx-dlg');
  dlg.className = `tdx-dlg${/hidden/.test(d.cls) || !d.text ? ' hidden' : ''}${L.conf ? ' conf' : ''}`;
  if (R.o.teamColor) dlg.style.setProperty('--tc', R.o.teamColor);
  const cut = dlg.querySelector('.tdx-cut');
  const cutWho = d.cut || d.hostCut || (s.k === 'conf' ? null : null);
  dlg.style.setProperty('--cut', cutWho ? '15%' : '0%');
  if (cutWho) { const src = avatar(cutWho, !!d.hostCut); if (cut.dataset.who !== cutWho) { cut.innerHTML = `<img src="${esc(src)}" alt="">`; cut.dataset.who = cutWho; if (fresh) { cut.classList.remove('fresh'); void cut.offsetWidth; cut.classList.add('fresh'); } } cut.style.display = ''; }
  else { cut.style.display = 'none'; cut.dataset.who = ''; }
  const nm = dlg.querySelector('.name'); nm.className = `name ${d.cls.replace('hidden', '')}`; nm.textContent = d.name || '';
  const say = dlg.querySelector('.say'); say.className = `say${d.cls.includes('dir') ? ' dir' : ''}${d.quote ? ' quote' : ''}`;
  const names = Object.keys(L.scene?.places || {});
  const lit = text => esc(text).replace(names.length ? new RegExp(`\\b(${names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'g') : /^\b$/, '<span class="hn">$1</span>')
    .replace(/\b(alliance|vote|votes|idol|immunity|marshmallow|elimination|tonight|blindside|final two)\b/gi, '<span class="hg">$1</span>');
  const badge = d.badge ? `<span class="badge">${esc(d.badge.text)}</span>` : '';
  if (!fresh || !d.text || d.text.length < 44) { say.innerHTML = badge + lit(d.text || ''); if (fresh) { say.classList.remove('punch'); void say.offsetWidth; say.classList.add('punch'); } }
  else {
    let n = 0, wait = 0; const full = d.text;
    R.typing = setInterval(() => {
      if (wait > 0) { wait--; return; }
      n += full.length > 160 ? 3 : 2;
      say.innerHTML = badge + esc(full.slice(0, n)) + '<span class="caret"></span>';
      if ((blip.n++ % 2) === 0 && !d.cls.includes('dir')) sfx('blip');
      const ch = full[Math.min(n, full.length) - 1];
      if (/[.!?…]/.test(ch) && n < full.length) wait = 9; else if (/[,;:—]/.test(ch) && n < full.length) wait = 4;
      if (n >= full.length) { clearInterval(R.typing); say.innerHTML = badge + lit(full); }
    }, 16);
  }
  if (fresh && s.loud) { dlg.classList.remove('loud'); void dlg.offsetWidth; dlg.classList.add('loud'); }
  // what happens, animated
  if (fresh) act(st, castEl, fxEl, scr, L, s, toks);
  // Intel
  const intel = st.querySelector('.tdx-intel');
  intel.innerHTML = intelHtml(scr, L, R.tab, fresh);
  st.querySelector('.tdx-ibtn').classList.toggle('new', fresh && L.side.some(x => x.at === R.idx) && !st.classList.contains('intel-open'));
  // the script, the counter, the chapters
  document.getElementById(`tdx-lines-${uid}`)?.querySelectorAll('[data-s]').forEach(ln => { const i = +ln.dataset.s; ln.classList.toggle('vis', i <= R.idx); ln.classList.toggle('now', i === R.idx); });
  const cnt = document.getElementById(`tdx-count-${uid}`); if (cnt) cnt.textContent = `${Math.max(0, R.idx + 1)} / ${scr.steps.length}`;
  const starts = scr.steps.map((x, i) => (x.k === 'scene' ? i : -1)).filter(i => i >= 0); starts.push(scr.steps.length);
  document.getElementById(`tdx-chap-${uid}`)?.querySelectorAll('i b').forEach((b, k) => { const a = starts[k], z = starts[k + 1]; b.style.width = (R.idx >= z ? 100 : R.idx < a ? 0 : ((R.idx - a + 1) / (z - a)) * 100) + '%'; });
  // the place's sound
  ambience(worldSound(scr, L));
}

const tokAt = (castEl, n) => [...castEl.children].find(el => el.dataset.n === n);
const centre = (st, el) => { const f = st.querySelector('.tdx-world').getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - f.left) / f.width * 100, y: (r.top - f.top) / f.height * 100, h: r.height / f.height * 100 }; };
function fxAt(fxEl, cls, x, y, html = '', life = 2400) { const d = document.createElement('div'); d.className = cls; d.style.left = x + '%'; d.style.top = y + '%'; d.innerHTML = html; fxEl.appendChild(d); setTimeout(() => d.remove(), life); return d; }

function act(st, castEl, fxEl, scr, L, s, toks) {
  const speaker = s.k === 'say' ? s.by : null;
  if (speaker) tokAt(castEl, speaker)?.classList.add('pop');
  if (s.loud && speaker) { const el = tokAt(castEl, speaker); if (el) { const c = centre(st, el); for (let k = 0; k < 3; k++) setTimeout(() => fxAt(fxEl, 'tdx-ring', c.x, c.y + c.h / 2), k * 140); sfx('boing'); } }
  const a = s.act;
  if (s.gain) { const el = tokAt(castEl, s.gain.who); if (el) { const c = centre(st, el); setTimeout(() => fxAt(fxEl, `tdx-gain${s.gain.up ? '' : ' down'}`, c.x, Math.max(c.y - 2, 8), `${esc(s.gain.stat)} ${s.gain.up ? '▲' : '▼'}`, 2200), 500); setTimeout(() => sfx(s.gain.up ? 'pop' : 'slap'), 500); } }
  if (a) {
    const who = (a.who || []).filter(n => tokAt(castEl, n));
    if (a.kind === 'laugh') who.forEach(n => tokAt(castEl, n).classList.add('laugh'));
    if (a.kind === 'shake') { who.forEach(n => tokAt(castEl, n).classList.add('shake')); const el = tokAt(castEl, who[who.length - 1] || ''); if (el) { const c = centre(st, el); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'WHAM!'); } sfx('slap'); }
    if (a.kind === 'storm' && who[0]) { tokAt(castEl, who[0]).classList.add('storm'); sfx('slam'); const c = centre(st, tokAt(castEl, who[0])); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'SLAM!'); }
    if (a.kind === 'shout' && who[0]) { const c = centre(st, tokAt(castEl, who[0])); for (let k = 0; k < 3; k++) setTimeout(() => fxAt(fxEl, 'tdx-ring', c.x, c.y + c.h / 2), k * 140); sfx('boing'); }
    if (a.kind === 'arrive') who.forEach(n => { const el = tokAt(castEl, n); el.classList.remove('arrive'); void el.offsetWidth; el.classList.add('arrive'); sfx('whoosh'); });
    if (a.kind === 'train') who.forEach(n => tokAt(castEl, n).classList.add('train'));
    if (a.kind === 'gust') { who.forEach(n => tokAt(castEl, n).classList.add('shake')); sfx('thunder'); const fl = fxAt(fxEl, 'tdx-bolt', 50, 0, '', 900); fl.style.left = '0'; }
    if (a.kind === 'hurt' && who[0]) { tokAt(castEl, who[0]).classList.add('shake'); const c = centre(st, tokAt(castEl, who[0])); fxAt(fxEl, 'tdx-pop', c.x, Math.max(c.y - 4, 10), 'OW!'); sfx('slap'); }
    if (a.kind === 'cry') who.forEach(n => { const el = tokAt(castEl, n); el.classList.add('sad'); const c = centre(st, el); for (let k = 0; k < 4; k++) setTimeout(() => fxAt(fxEl, 'tdx-tear', c.x + (k % 2 ? 1.2 : -1.2), c.y + c.h * .25, '', 1400), k * 260); });
    if (a.kind === 'fire') who.forEach(n => { const el = tokAt(castEl, n); el.classList.add('fired'); const c = centre(st, el); fxAt(fxEl, 'tdx-aura', c.x, c.y + c.h / 2, '', 2400); sfx('title'); });
    if (a.kind === 'rest') who.forEach(n => tokAt(castEl, n).classList.add('act-nap'));
    if (a.kind === 'search' && who[0]) { const el = tokAt(castEl, who[0]); el.classList.add('search'); for (let k = 0; k < 5; k++) setTimeout(() => { const c = centre(st, el); fxAt(fxEl, 'tdx-dust', c.x, c.y + c.h * .95, '', 900); sfx('slip'); }, 300 + k * 520); }
    if (a.kind === 'path' && who[0]) { const el = tokAt(castEl, who[0]); setTimeout(() => el.classList.add(a.dir === 'L' ? 'pathL' : 'pathR'), 250); sfx(a.lit ? 'torch' : 'snuff'); }
    if ((a.kind === 'lean' || a.kind === 'hug' || a.kind === 'kiss') && who.length >= 1) {
      const pair = who.length >= 2 ? who.slice(0, 2) : [who[0], toks.find(t => t.n !== who[0] && !t.bg && !t.host)?.n].filter(Boolean);
      if (pair.length === 2) {
        const [l, r] = pair.map(n => ({ n, el: tokAt(castEl, n) })).filter(x => x.el).sort((x, y) => centre(st, x.el).x - centre(st, y.el).x);
        if (l && r) { l.el.classList.add('leanR'); r.el.classList.add('leanL');
          if (a.kind === 'kiss' || a.kind === 'hug') { const c1 = centre(st, l.el), c2 = centre(st, r.el); fxAt(fxEl, 'tdx-heart', (c1.x + c2.x) / 2, Math.min(c1.y, c2.y), '<svg viewBox="0 0 24 22"><path d="M12 21s-9-6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12z" fill="#ff5a7a" stroke="#1a0e14" stroke-width="1.5"/></svg>'); sfx('heart'); } }
      }
    }
  }
  if (s.k === 'title') sfx('title');
  if (s.k === 'ballots') sfx('slip');
  if (s.k === 'idol') sfx('idol');
  if (s.k === 'out') sfx('out');
  if (s.k === 'found') sfx(s.item ? 'idol' : 'empty');
  if (s.k === 'title' && s.vs) sfx('thunder');
  if (s.k === 'read') { fxAt(fxEl, `tdx-voteslip${s.dead ? ' dead' : ''}`, 50, 30, esc(s.vote), 1800); sfx('slip'); }
  if (s.k === 'safe') {
    const host = toks.find(t => t.host); const to = tokAt(castEl, s.who);
    if (to) {
      const from = host ? { x: host.u * 100, y: host.v * 100 - host.h * .6 } : { x: 64, y: 46 };
      const c = centre(st, to);
      const d = document.createElement('div'); d.className = 'tdx-toss'; fxEl.appendChild(d);
      sfx('whoosh');
      const anim = d.animate([{ left: from.x + '%', top: from.y + '%', transform: 'rotate(0)' }, { left: (from.x + c.x) / 2 + '%', top: Math.min(from.y, c.y) - 22 + '%', transform: 'rotate(260deg)', offset: .5 }, { left: c.x + '%', top: c.y + '%', transform: 'rotate(520deg)' }], { duration: s.last ? 1100 : 700, easing: 'cubic-bezier(.3,.6,.4,1)' });
      anim.onfinish = () => { d.remove(); sfx(s.last ? 'safe' : 'pop'); if (s.last) fxAt(fxEl, 'tdx-pop', c.x, c.y - 4, 'SAFE!'); };
    }
  }
  if (s.k === 'beat' && s.walk) { const el = tokAt(castEl, s.walk); if (el) setTimeout(() => el.classList.add('walk'), 300); }
}

// ══════════════════════════════════════════════════════════════════════
// CONTROLS
// ══════════════════════════════════════════════════════════════════════
export function tdxNext(uid) {
  const R = sync(uid); if (!R) return;
  if (R.idx >= R.scr.steps.length - 1) {
    const wasAuto = R.auto; stopAuto(R);
    if (typeof window !== 'undefined' && typeof window.vpNext === 'function') {
      window.vpNext();
      if (wasAuto) setTimeout(() => { const nx = document.querySelector('.tdx[data-uid]'); if (nx && nx.dataset.uid !== uid) tdxAuto(nx.dataset.uid); }, 700);
    }
    return;
  }
  R.idx++; paint(uid, true);
}
export function tdxBack(uid) {
  const R = sync(uid); if (!R) return; stopAuto(R);
  if (R.idx <= 0) { if (typeof window !== 'undefined' && typeof window.vpPrev === 'function') window.vpPrev(); return; }
  R.idx--; paint(uid, false);
}
export function tdxAll(uid) { const R = sync(uid); if (!R) return; stopAuto(R); R.idx = R.scr.steps.length - 1; paint(uid, false); }
export function tdxReset(uid) { const R = sync(uid); if (!R) return; stopAuto(R); R.idx = 0; R.wk = null; paint(uid, true); }
export function tdxJump(el, i) { const root = el.closest('.tdx[data-uid]'); if (!root) return; const R = sync(root.dataset.uid); if (!R) return; stopAuto(R); R.idx = i; paint(root.dataset.uid, false); }
export function tdxIntel(uid) { const st = document.getElementById(`tdx-st-${uid}`); if (!st) return; st.classList.toggle('intel-open'); st.querySelector('.tdx-ibtn')?.classList.remove('new'); }
export function tdxTab(uid, e) { const b = e.target.closest('[data-tab]'); if (!b) return; const R = reg()[uid]; if (!R) return; R.tab = b.dataset.tab; const st = document.getElementById(`tdx-st-${uid}`); st.querySelector('.tdx-intel').innerHTML = intelHtml(R.scr, ledgerAt(R.scr, R.idx), R.tab, false); }
const holdFor = s => Math.min(9000, 1700 + String(s?.text || '').length * 40) + (['title', 'idol', 'out', 'found'].includes(s?.k) ? 2400 : 0) + (s?.tense ? 1200 : 0) + (s?.k === 'scene' ? 900 : 0) + (s?.k === 'safe' && s.last ? 1800 : 0);
function stopAuto(R) { R.auto = false; clearTimeout(R.timer); }
export function tdxAuto(uid) {
  const R = sync(uid); if (!R) return;
  R.auto = !R.auto;
  document.getElementById(`tdx-auto-${uid}`)?.classList.toggle('on', R.auto);
  const tick = () => { if (!R.auto) return; tdxNext(uid); if (R.auto) R.timer = setTimeout(tick, holdFor(R.scr.steps[R.idx])); };
  if (R.auto) R.timer = setTimeout(tick, 400); else clearTimeout(R.timer);
}
export function tdxTv() {
  const p = typeof document !== 'undefined' ? document.getElementById('visual-player') : null;
  if (!p) return;
  const on = p.classList.toggle('tdx-tv');
  try { if (on && p.requestFullscreen && !document.fullscreenElement) p.requestFullscreen().catch(() => {}); if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch { /* fullscreen refused */ }
}
/** Switch between the stepped viewer and the classic screens, staying on the same screen. */
export function tdxSwitchViewer(which) {
  try { localStorage.setItem('td-vp', which === 'stepped' ? 'stepped' : 'classic'); } catch { /* per-viewer convenience */ }
  try {
    const before = window.vpScreens || [], at = window.vpCurrentScreen || 0, cur = before[at] || {};
    const frac = before.length > 1 ? at / (before.length - 1) : 0;
    const ep = window.vpEpNum ?? window._vpEpNum;
    const rec = (window.gs?.episodeHistory || []).find(e => e.num === ep);
    if (!rec || typeof window.buildVPScreens !== 'function') { location.reload(); return; }
    window.buildVPScreens(rec);
    const now = window.vpScreens || [];
    let i = now.findIndex(s => s.id && s.id === cur.id);
    if (i < 0 && cur.id === 'votes') i = now.findIndex(s => s.id === 'tribal');
    if (i < 0) i = Math.round(frac * Math.max(0, now.length - 1));
    if (typeof window.vpGoTo === 'function') window.vpGoTo(Math.max(0, i)); else { window.vpCurrentScreen = Math.max(0, i); window.renderVPScreen?.(); }
  } catch { location.reload(); }
}
/** The classic screens' way back to the stepped viewer. */
export const TDX_SWITCH = `<div style="display:flex;justify-content:flex-end;margin:0 0 8px"><button type="button" onclick="tdxSwitchViewer('stepped')" style="border:1px solid #ff8a1f;background:#171a24;color:#ff8a1f;border-radius:8px;padding:7px 12px;font:800 11px Nunito,system-ui,sans-serif;letter-spacing:1px;cursor:pointer">▶ STEPPED VIEWER</button></div>`;

if (typeof window !== 'undefined') Object.assign(window, { tdxNext, tdxBack, tdxAll, tdxReset, tdxJump, tdxIntel, tdxTab, tdxAuto, tdxTv, tdxSwitchViewer });
if (typeof document !== 'undefined') {
  // a stepped screen opens on its first scene; leaving it stops its sound and its Auto
  document.addEventListener('vp:screen', () => {
    setTimeout(() => {
      const root = document.querySelector('.tdx[data-uid]');
      for (const [uid, R] of Object.entries(reg())) if (R && (!root || root.dataset.uid !== uid)) { stopAuto(R); clearInterval(R.typing); }
      if (!root) { stopAmbience(); return; }
      const R = sync(root.dataset.uid);
      if (R && R.idx < 0) { R.idx = 0; paint(root.dataset.uid, true); }
    }, 0);
  });
  document.addEventListener('vp:close', () => { for (const R of Object.values(reg())) if (R) { stopAuto(R); clearInterval(R.typing); } stopAmbience(); });
  document.addEventListener('keydown', e => {
    const root = document.querySelector('.tdx[data-uid]');
    if (!root || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); tdxNext(root.dataset.uid); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); tdxBack(root.dataset.uid); }
    else if (e.key === 'i') tdxIntel(root.dataset.uid);
  }, true);
}
