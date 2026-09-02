// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-bespoke-themes.js — the four worlds
// ══════════════════════════════════════════════════════════════════════
//
// One THEME per bespoke mission, each reproducing its approved mockup
// (mockup-tr-<id>.html): palette, fonts, atmosphere, card vocabulary, and the
// one organising primitive that belongs to that world. The mockup CSS is lifted
// and scoped under the theme's `.<prefix>-root` and adapted for the VP frame —
// the standalone page's fixed-viewport atmosphere becomes an absolute layer
// inside the `max-width:1100px` shell, the page's own 46px nav stub is dropped
// (the VP draws one), and the sticky sidebar / fixed controls clear it via the
// shared nav height. Everything structural — the briefing beats, the phase
// cards, the `.on` reveal, the summary, the reduced-motion fallback — matches.
//
// A THEME supplies: prefix, rootVars, css, atmosphere(), title(v), sub(v),
// chips(v), phaseNum(roman, ph), cardClass(c), cardTag(c, ph), icon(c, ph),
// [renderCard], sidebar(v, n, states), sideStates(v, total),
// paintSide(prefix, states, n), and the four control words.
const NAV = '46px';
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');

// how many cards each phase owns, and where its window starts in the stream
function phaseProg(v) {
  let s = 0;
  return v.phases.map(p => { const o = { start: s, count: p.cards.length }; s += p.cards.length; return o; });
}
function relicStepOf(v) {
  let i = 0;
  for (const p of v.phases) { for (const c of p.cards) { if (c.relic) return i; i++; } }
  return -1;
}

// ══════════════════════════════════════════════════════════════════════
// 1. THE DROWNED CAUSEWAY — cold slate, a rising tide, a brass gauge
// ══════════════════════════════════════════════════════════════════════

const CAUSEWAY_TAGS = {
  strong: 'Strong', weak: 'Struggled', steady: 'Steady', cross: 'Crossed',
  freeze: 'Froze', right: 'Correct', wrong: 'Miscount',
};
const CAUSEWAY = {
  id: 'drowned-causeway', prefix: 'dc',
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: v => '<h1 class="dc-title">The Drowned <em>Causeway</em></h1>',
  sub: v => 'A tidal sandbar, a ruined chapel on it, and about seventy minutes before the sea closes the road behind the teams.',
  chips: v => [{ text: 'Three phases' }, { text: v.teams.map(t => t.name).join(' v ') },
    { text: '£2,000 a box' }, { text: 'No shield' }],
  phaseNum: (roman) => '<span class="dc-phase-n">' + roman + '</span>',
  cardClass: c => c.relic ? 'social' : (c.isSocial ? 'social' : c.tone),
  cardTag: (c) => c.isSocial ? _cap(c.behaviour || 'moment') : (CAUSEWAY_TAGS[c.kind] || _cap(c.kind)),
  icon: (c, ph) => {
    let ic = 'ico-crate';
    if (ph.id === 'wade') ic = c.tone === 'bad' ? 'ico-boot' : 'ico-crate';
    else if (ph.id === 'ledge') ic = (c.behaviour === 'suspicious') ? 'ico-lost' : 'ico-ledge';
    else if (ph.id === 'bell') ic = 'ico-bell';
    return '<span class="dc-ico ' + ic + '"><i></i><i></i><i></i></span>';
  },
  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const teams = v.teams.map((t, i) =>
      '<div class="dc-team"' + (i === 0 ? ' style="border-top:none"' : '') + '>'
      + '<div class="nm"><b>' + _esc(t.name) + '</b><i id="dc-t' + i + '-lab">'
      + (s.shown ? s.teams[i].up + ' of ' + s.teams[i].quota + ' up' : '&mdash; on the roof') + '</i></div>'
      + '<div class="dc-crates" id="dc-t' + i + '-crates">' + _crates(s.teams[i]) + '</div>'
      + '<div class="dc-bar"><i id="dc-t' + i + '-bar" style="width:'
      + (s.shown ? Math.round(100 * s.teams[i].up / s.teams[i].quota) : 0) + '%"></i></div></div>').join('');
    return '<div class="dc-panel"><h3>The Tide</h3>'
      + '<div class="dc-gaugewrap"><div>'
      + '<div class="dc-gauge"><div class="dc-water" id="dc-water" style="height:' + s.water + '%"></div>'
      + '<div class="dc-tick major" style="bottom:180px"><span>ROAD</span></div>'
      + '<div class="dc-tick" style="bottom:140px"></div>'
      + '<div class="dc-tick major" style="bottom:100px"><span>LEDGE</span></div>'
      + '<div class="dc-tick" style="bottom:60px"></div>'
      + '<div class="dc-tick major" style="bottom:20px"><span>FLAT</span></div></div>'
      + '<div class="dc-gaugelabel" id="dc-tidelabel">' + _esc(s.label) + '</div></div>'
      + '<div><div class="dc-teams" style="padding:0">' + teams + '</div></div></div>'
      + '<div class="dc-pot">'
      + '<div class="row"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="row"><span>Boxes on the roof</span><b id="dc-pot-boxes">' + (s.shown ? s.boxes : '&mdash;') + '</b></div>'
      + '<div class="row"><span>Earned today</span><b id="dc-pot-earned">' + (s.shown ? _gbp(s.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="dc-pot-after">' + _gbp(s.potAfter) + '</div></div>'
      + '<div class="dc-shieldnote"><b style="color:#9db0b8">Shield.</b> Nothing on this sandbar grants one. '
      + 'The only relic in the season is in the burnt wing.</div></div>';
  },
  sideStates(v, total) {
    const pr = phaseProg(v);
    const QUOTA = Math.max(1, Math.ceil((v.tally.boxesOut || 10) / 2));
    const perTeam = v.tally.perTeam || {};
    const names = v.teams.map(t => t.name);
    const finalUp = names.map(nm => Math.min(QUOTA, Math.max(0, perTeam[nm] || 0)));
    const LAB = ['low', 'low', 'rising', 'rising', 'half', 'half', 'high', 'high', 'over the road', 'closed'];
    const ledgeStart = pr[1] ? pr[1].start : 0;
    const out = [];
    for (let n = 0; n <= total; n++) {
      const f = total ? n / total : 0;
      const water = Math.round(12 + 80 * f);
      const label = LAB[Math.min(LAB.length - 1, Math.floor(f * LAB.length))] || 'low';
      const after = total - ledgeStart;
      const g = after > 0 ? Math.max(0, Math.min(1, (n - ledgeStart) / after)) : (n >= total ? 1 : 0);
      const teams = names.map((nm, i) => ({ name: nm, up: Math.round(finalUp[i] * g), quota: QUOTA }));
      const boxes = teams.reduce((a, t) => a + t.up, 0);
      const earned = Math.round(v.earned * f);
      out.push({ water, label, teams, boxes, earned, potAfter: v.potBefore + earned, shown: n > 0 });
    }
    return out;
  },
  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const $ = id => document.getElementById(id);
    const w = $('dc-water'); if (w) w.style.height = s.water + '%';
    const lab = $('dc-tidelabel'); if (lab) lab.textContent = s.label;
    s.teams.forEach((t, i) => {
      const cr = $('dc-t' + i + '-crates'); if (cr) cr.innerHTML = _crates(t);
      const lb = $('dc-t' + i + '-lab'); if (lb) lb.textContent = s.shown ? (t.up + ' of ' + t.quota + ' up') : '— on the roof';
      const bar = $('dc-t' + i + '-bar'); if (bar) bar.style.width = (s.shown ? Math.round(100 * t.up / t.quota) : 0) + '%';
    });
    const pb = $('dc-pot-boxes'); if (pb) pb.textContent = s.shown ? s.boxes : '—';
    const pe = $('dc-pot-earned'); if (pe) pe.textContent = s.shown ? _gbp(s.earned) : '—';
    const pa = $('dc-pot-after'); if (pa) pa.textContent = _gbp(s.potAfter);
  },
  atmosphere: () => '<div class="dc-sky"></div><div class="dc-swell"></div><div class="dc-drizzle"></div>',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,700;6..96,900&family=Barlow+Condensed:wght@400;500;600;700&display=swap');
.dc-root{--dc-slate:#1b2229;--dc-slate-2:#232c35;--dc-sand:#b39a72;--dc-sand-dim:#8d7857;
  --dc-sea:#2f6f6b;--dc-sea-lit:#49a49c;--dc-foam:#d7e6e2;--dc-brass:#c9a227;--dc-brass-dim:#8d711b;
  --dc-chalk:#e8eef1;--dc-ink:#0e1317;--dc-red:#a8332c;--cv-display:'Bodoni Moda',serif;
  background:var(--dc-slate);color:var(--dc-chalk);font-family:'Barlow Condensed','Oswald','Arial Narrow',sans-serif;
  font-size:17px;line-height:1.5;padding-bottom:120px;position:relative;overflow:hidden}
.dc-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.dc-sky{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% -10%,#34424e 0%,#1b2229 55%,#10161b 100%)}
.dc-sky::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(180deg,rgba(255,255,255,.018) 0 1px,transparent 1px 3px)}
.dc-swell{position:absolute;left:-10%;right:-10%;bottom:0;height:34vh;background:linear-gradient(180deg,rgba(47,111,107,0) 0%,rgba(47,111,107,.30) 40%,rgba(20,50,50,.75) 100%);filter:blur(1px);animation:dc-swell 17s ease-in-out infinite alternate}
@keyframes dc-swell{from{transform:translateY(6%) scaleY(.94)}to{transform:translateY(-2%) scaleY(1.06)}}
.dc-drizzle{position:absolute;inset:0;opacity:.20;background:repeating-linear-gradient(102deg,rgba(215,230,226,.5) 0 1px,transparent 1px 26px);animation:dc-drizzle 1.5s linear infinite}
@keyframes dc-drizzle{from{background-position:0 0}to{background-position:-40px 220px}}
.dc-shell{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:26px 18px 40px}
.dc-body{position:relative;z-index:2}
.dc-hero{border:1px solid rgba(201,162,39,.35);background:rgba(11,15,19,.72);padding:30px 26px 26px;position:relative}
.dc-hero::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,var(--dc-brass),transparent)}
.dc-kicker{font:600 12px/1 'Barlow Condensed',sans-serif;letter-spacing:.34em;text-transform:uppercase;color:var(--dc-sea-lit)}
.dc-title{font-family:'Bodoni Moda','Didot',Georgia,serif;font-weight:900;font-size:clamp(38px,7.4vw,74px);line-height:.94;margin:.18em 0 .1em;letter-spacing:-.01em}
.dc-title em{font-style:italic;color:var(--dc-brass)}
.dc-sub{color:#9db0b8;max-width:62ch;font-size:18px}
.dc-meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.dc-chip{border:1px solid rgba(201,162,39,.4);padding:5px 11px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--dc-brass);background:rgba(201,162,39,.06)}
.dc-grid{display:grid;grid-template-columns:1fr 300px;gap:22px;margin-top:26px;align-items:start}
@media(max-width:900px){.dc-grid{grid-template-columns:1fr}}
.dc-brief{border-left:3px solid var(--dc-brass);background:rgba(9,13,16,.66);padding:22px 22px 18px}
.dc-brief h2{font-family:'Bodoni Moda',serif;font-weight:700;font-size:26px;margin:0 0 4px;letter-spacing:.02em}
.dc-staging{color:#8ba0a8;font-style:italic;font-size:16px;border-bottom:1px dashed rgba(139,160,168,.35);padding-bottom:12px;margin-bottom:14px}
.dc-beat{margin:0 0 13px;padding-left:18px;border-left:2px solid transparent}
.dc-beat.say{border-left-color:rgba(201,162,39,.5)}
.dc-beat.say p{font-family:'Bodoni Moda',serif;font-size:19px;line-height:1.45;margin:0;color:#f2f6f7}
.dc-beat.say p::before{content:'“';color:var(--dc-brass)}
.dc-beat.say p::after{content:'”';color:var(--dc-brass)}
.dc-beat.do{color:#7f939b;font-size:15.5px}
.dc-beat.do p{margin:0}
.dc-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:16px}
.dc-rule{font-size:11.5px;letter-spacing:.16em;text-transform:uppercase;color:#6f8189;border:1px solid rgba(111,129,137,.4);padding:3px 8px}
.dc-rule b{color:var(--dc-sea-lit);font-weight:600}
.dc-phase{margin-top:30px;padding:20px 18px 6px;border:1px solid rgba(255,255,255,.07);position:relative}
.dc-phase[data-phase="wade"]{background:linear-gradient(180deg,rgba(179,154,114,.13),rgba(27,34,41,0) 62%)}
.dc-phase[data-phase="ledge"]{background:linear-gradient(180deg,rgba(47,111,107,.20),rgba(27,34,41,0) 62%)}
.dc-phase[data-phase="bell"]{background:linear-gradient(180deg,rgba(201,162,39,.16),rgba(27,34,41,0) 62%)}
.dc-phase-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.dc-phase-n{font-family:'Bodoni Moda',serif;font-size:44px;line-height:.8;color:var(--dc-brass);opacity:.55}
.dc-phase-name{font-family:'Bodoni Moda',serif;font-size:29px;font-weight:700}
.dc-phase-stats{margin-left:auto;display:flex;gap:6px}
.dc-stat{font-size:11.5px;letter-spacing:.15em;text-transform:uppercase;border:1px solid rgba(73,164,156,.5);color:var(--dc-sea-lit);padding:3px 8px;font-style:normal}
.dc-setting{color:#8ba0a8;font-style:italic;margin:0 0 16px;max-width:70ch}
.dc-card{position:relative;margin:0 0 12px;padding:14px 16px 14px 62px;background:linear-gradient(160deg,#28323b,#1d252c);border:1px solid rgba(255,255,255,.08);border-left:4px solid rgba(255,255,255,.14);opacity:0;transform:translateY(14px);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.8,.3,1)}
.dc-card.on{opacity:1;transform:none}
.dc-phase[data-phase="ledge"] .dc-card{transform:translateX(-26px)}
.dc-phase[data-phase="ledge"] .dc-card.on{transform:none}
.dc-phase[data-phase="bell"] .dc-card{transform:translateY(-16px) scale(.985)}
.dc-phase[data-phase="bell"] .dc-card.on{transform:none}
.dc-card .dc-who{font-weight:700;letter-spacing:.04em;color:#fff}
.dc-card .dc-txt{color:#c4d2d8;margin-top:2px}
.dc-card .dc-tag{position:absolute;right:12px;top:11px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;padding:2px 7px;border:1px solid currentColor}
.dc-card.good{border-left-color:var(--dc-sea-lit)} .dc-card.good .dc-tag{color:var(--dc-sea-lit)}
.dc-card.bad{border-left-color:var(--dc-red)} .dc-card.bad .dc-tag{color:var(--dc-red)}
.dc-card.steady .dc-tag{color:#7f939b}
.dc-card.social{border-style:dashed;background:linear-gradient(160deg,#2b2318,#1e1a14);border-left-color:var(--dc-brass)}
.dc-card.social .dc-tag{color:var(--dc-brass)}
.dc-card .dc-conf{margin-top:10px;padding:10px 12px;background:rgba(0,0,0,.32);border-left:2px solid var(--dc-brass);font-family:'Bodoni Moda',serif;font-size:17px;color:#e9eff1}
.dc-card .dc-conf small{display:block;font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dc-brass-dim);margin-bottom:4px}
.dc-card .dc-fx{margin-top:9px;display:flex;flex-wrap:wrap;gap:6px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#7f939b}
.dc-card .dc-fx span{border:1px dotted rgba(127,147,155,.5);padding:2px 7px}
.dc-ico{position:absolute;left:16px;top:14px;width:32px;height:32px}
.dc-ico i{position:absolute;display:block}
.ico-crate i:nth-child(1){inset:6px 2px 4px 2px;border:2px solid var(--dc-sand)}
.ico-crate i:nth-child(2){left:2px;right:2px;top:15px;height:2px;background:var(--dc-sand-dim)}
.ico-crate i:nth-child(3){left:14px;top:6px;bottom:4px;width:2px;background:var(--dc-sand-dim)}
.ico-boot i:nth-child(1){left:8px;top:3px;width:8px;height:16px;background:var(--dc-chalk)}
.ico-boot i:nth-child(2){left:8px;top:15px;width:17px;height:7px;background:var(--dc-chalk);border-radius:0 3px 3px 0}
.ico-boot i:nth-child(3){left:0;right:0;top:24px;height:2px;background:var(--dc-sea-lit);animation:dc-lap 2.6s ease-in-out infinite}
@keyframes dc-lap{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.ico-ledge i:nth-child(1){left:0;right:0;top:13px;height:4px;background:var(--dc-sand)}
.ico-ledge i:nth-child(2){left:12px;top:2px;width:7px;height:11px;background:var(--dc-chalk)}
.ico-ledge i:nth-child(3){left:0;right:0;bottom:2px;height:8px;background:repeating-linear-gradient(90deg,var(--dc-sea) 0 5px,transparent 5px 10px);animation:dc-run 3s linear infinite}
@keyframes dc-run{from{background-position:0 0}to{background-position:10px 0}}
.ico-bell i:nth-child(1){left:7px;top:5px;width:18px;height:16px;border:2px solid var(--dc-brass);border-radius:9px 9px 2px 2px;border-bottom:none}
.ico-bell i:nth-child(2){left:5px;right:5px;top:21px;height:2px;background:var(--dc-brass)}
.ico-bell i:nth-child(3){left:15px;top:23px;width:3px;height:5px;background:var(--dc-brass);transform-origin:top center;animation:dc-ring 2.2s ease-in-out infinite}
@keyframes dc-ring{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(16deg)}}
.ico-lost i:nth-child(1){left:14px;top:4px;width:5px;height:5px;background:var(--dc-red)}
.ico-lost i:nth-child(2){left:4px;right:4px;top:16px;height:2px;background:var(--dc-red);opacity:.7}
.ico-lost i:nth-child(3){left:9px;right:9px;top:22px;height:2px;background:var(--dc-red);opacity:.45}
.dc-side{position:sticky;top:calc(${NAV} + 14px)}
.dc-panel{border:1px solid rgba(201,162,39,.3);background:rgba(8,12,15,.86);padding:0 0 14px;overflow:hidden}
.dc-panel h3{margin:0;padding:11px 14px;font:600 12px/1 'Barlow Condensed',sans-serif;letter-spacing:.26em;text-transform:uppercase;color:var(--dc-slate);background:var(--dc-brass)}
.dc-gaugewrap{display:grid;grid-template-columns:76px 1fr;gap:12px;padding:14px}
.dc-gauge{position:relative;height:230px;border:2px solid var(--dc-brass-dim);background:#0a1114;overflow:hidden}
.dc-water{position:absolute;left:0;right:0;bottom:0;height:12%;background:linear-gradient(180deg,var(--dc-sea-lit),var(--dc-sea));transition:height .8s cubic-bezier(.3,.9,.3,1)}
.dc-water::before{content:'';position:absolute;left:-50%;right:-50%;top:-6px;height:10px;background:radial-gradient(circle at 20% 100%,var(--dc-foam) 0 3px,transparent 3px) repeat-x;background-size:14px 10px;opacity:.55;animation:dc-wave 3.4s linear infinite}
@keyframes dc-wave{from{transform:translateX(0)}to{transform:translateX(14px)}}
.dc-tick{position:absolute;left:0;width:12px;height:1px;background:var(--dc-brass-dim)}
.dc-tick.major{width:22px;background:var(--dc-brass)}
.dc-tick span{position:absolute;left:25px;top:-7px;font-size:9.5px;letter-spacing:.1em;color:var(--dc-brass-dim);white-space:nowrap}
.dc-gaugelabel{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--dc-brass-dim);text-align:center;margin-top:6px}
.dc-teams{padding:0 14px}
.dc-team{border-top:1px solid rgba(255,255,255,.08);padding:10px 0}
.dc-team .nm{display:flex;justify-content:space-between;align-items:baseline}
.dc-team .nm b{font-family:'Bodoni Moda',serif;font-size:19px;letter-spacing:.02em}
.dc-team .nm i{font-style:normal;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#7f939b}
.dc-crates{display:flex;gap:4px;margin-top:7px;flex-wrap:wrap}
.dc-crates b{width:16px;height:13px;border:1px solid var(--dc-sand-dim);display:block;background:transparent;transition:background .4s ease}
.dc-crates b.up{background:var(--dc-sand)}
.dc-bar{height:5px;background:#101a1d;margin-top:8px;position:relative}
.dc-bar i{position:absolute;inset:0 auto 0 0;background:var(--dc-sea-lit);transition:width .6s ease}
.dc-pot{padding:12px 14px 0;border-top:1px solid rgba(255,255,255,.08);margin-top:6px}
.dc-pot .row{display:flex;justify-content:space-between;font-size:14px;color:#9db0b8;margin-bottom:3px}
.dc-pot .row b{color:var(--dc-chalk);font-variant-numeric:tabular-nums}
.dc-pot .big{font-family:'Bodoni Moda',serif;font-size:31px;color:var(--dc-brass);letter-spacing:.02em;font-variant-numeric:tabular-nums;margin-top:6px}
.dc-shieldnote{margin:12px 14px 0;padding:9px 11px;border:1px dashed rgba(127,147,155,.45);font-size:12.5px;letter-spacing:.06em;color:#7f939b}
.dc-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;background:linear-gradient(180deg,rgba(11,15,19,.2),rgba(8,11,14,.97) 42%);border-top:1px solid rgba(201,162,39,.35);padding:14px 18px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
.dc-btn{font:600 13px/1 'Barlow Condensed',sans-serif;letter-spacing:.2em;text-transform:uppercase;padding:12px 24px;background:transparent;color:var(--dc-brass);border:1px solid var(--dc-brass);cursor:pointer;transition:.2s}
.dc-btn:hover{background:var(--dc-brass);color:var(--dc-ink)}
.dc-btn.ghost{color:#7f939b;border-color:rgba(127,147,155,.5)}
.dc-btn[disabled]{opacity:.34;cursor:default}
.dc-counter{font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#7f939b;font-variant-numeric:tabular-nums;min-width:150px;text-align:center}
.dc-summary{margin-top:34px;padding:24px;border:1px solid rgba(201,162,39,.4);background:rgba(9,13,16,.8);font-family:'Bodoni Moda',serif;font-size:21px;line-height:1.5}
.dc-summary small{display:block;font-family:'Barlow Condensed',sans-serif;font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--dc-brass);margin-bottom:9px}
@media(prefers-reduced-motion:reduce){.dc-root *,.dc-root *::before,.dc-root *::after{animation:none !important;transition:none !important}.dc-card{opacity:1;transform:none}.dc-drizzle,.dc-swell{display:none}}
`,
};
function _crates(t) {
  let h = '';
  for (let k = 0; k < t.quota; k++) h += '<b class="' + (k < t.up ? 'up' : '') + '"></b>';
  return h;
}

// ══════════════════════════════════════════════════════════════════════
// 2. THE NIGHTJAR ORRERY — ink-blue, a turning machine, night-book pages
// ══════════════════════════════════════════════════════════════════════

const ORRERY_TAGS = {
  sharp: 'Sharp', steady: 'Steady', lost: 'Lost', true: 'Set true', out: 'One out', on: 'On the line',
};
const ORRERY = {
  id: 'nightjar-orrery', prefix: 'no',
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: v => '<h1 class="no-title">The Nightjar <span>Orrery</span></h1>',
  sub: v => 'Forty years of one astronomer\'s undated night-book, a brass machine the size of a room, and a strongroom under the floor that only opens on the right night.',
  chips: v => [{ text: 'Three phases' }, { text: v.teams.map(t => t.name).join(' v ') },
    { text: '£3,000 a compartment' }, { text: 'No shield' }],
  phaseNum: (roman) => '<span class="no-phase-n"><b>' + roman + '</b></span>',
  cardClass: c => {
    if (c.isSocial) return 'social';
    if (c.tone === 'good') return 'true';
    if (c.tone === 'bad') return 'out';
    return 'plain';
  },
  cardTag: (c) => c.isSocial ? _cap(c.behaviour || 'moment') : (ORRERY_TAGS[c.kind] || _cap(c.kind)),
  icon: (c, ph) => {
    let ic = 'ico-book';
    if (ph.id === 'gearing') ic = c.tone === 'bad' ? 'ico-slip' : 'ico-ring';
    else if (ph.id === 'transit') ic = 'ico-merid';
    return '<span class="no-ico ' + ic + '"><i></i><i></i><i></i></span>';
  },
  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const rings = Array.from({ length: 6 }, (_, r) =>
      '<div class="no-ring' + (r < s.trueRings ? ' true' : '') + '" data-ring="' + (r + 1) + '"><b></b></div>').join('');
    const rows = v.teams.map((t, i) =>
      '<div class="no-row team"' + (i > 0 ? ' style="margin-top:8px"' : '') + '><span>' + _esc(t.name)
      + '</span><b id="no-t' + i + '-rings">' + (s.rings[i]) + ' rings true</b></div>'
      + '<div class="no-row"><span>Ledger reading</span><b id="no-t' + i + '-led">' + _esc(s.led[i]) + '</b></div>'
      + '<div class="no-row"><span>Transit</span><b id="no-t' + i + '-tr">' + _esc(s.tr[i]) + '</b></div>').join('');
    return '<div class="no-panel"><h3>The Machine</h3>'
      + '<div class="no-orrery" id="no-orrery">' + rings + '<div class="no-core"></div></div>'
      + '<div class="no-floor' + (s.open ? ' open' : '') + '" id="no-floor">' + _esc(s.floor) + '</div>'
      + '<div class="no-rows">' + rows + '</div>'
      + '<div class="no-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Compartments open</span><b id="no-pot-c">' + (s.shown ? s.compartments : '&mdash;') + '</b></div>'
      + '<div class="r"><span>Earned today</span><b id="no-pot-e">' + (s.shown ? _gbp(s.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="no-pot-a">' + _gbp(s.potAfter) + '</div></div>'
      + '<div class="no-shieldnote"><b style="color:#93a1c8">Shield.</b> Nothing in this dome grants one. '
      + 'There is money under the floor and nothing else.</div></div>';
  },
  sideStates(v, total) {
    const pr = phaseProg(v);
    const names = v.teams.map(t => t.name);
    const trueByTeam = v.tally.ringsTrue || {};
    const opened = v.tally.opened || {};
    const finalRings = names.map(nm => Math.max(0, trueByTeam[nm] || 0));
    const totalTrue = finalRings.reduce((a, b) => a + b, 0);
    const ledLabel = i => {
      const sc = (v.phases[0].teams.find(t => t.name === names[i]) || {}).score || 0;
      return sc > 0.58 ? 'strong' : sc > 0.42 ? 'fair' : 'weak';
    };
    const out = [];
    for (let n = 0; n <= total; n++) {
      const gearStart = pr[1] ? pr[1].start : 0, gearEnd = pr[2] ? pr[2].start : total;
      const gg = gearEnd > gearStart ? Math.max(0, Math.min(1, (n - gearStart) / (gearEnd - gearStart))) : (n >= gearEnd ? 1 : 0);
      const trueRings = Math.round(Math.min(6, totalTrue) * gg);
      const rings = names.map((nm, i) => Math.round(finalRings[i] * gg));
      const transitDone = n >= (pr[2] ? pr[2].start : total);
      const led = names.map((nm, i) => n > pr[0].start ? ledLabel(i) : '—');
      const tr = names.map((nm, i) => transitDone ? (opened[nm] ? 'called on' : 'called early') : '—');
      const compartments = transitDone ? names.filter(nm => opened[nm]).length : 0;
      const open = compartments > 0;
      const floor = open ? ('Floor · open (' + names.filter(nm => opened[nm]).join(', ') + ')') : 'Floor · shut';
      const f = total ? n / total : 0;
      const earned = Math.round(v.earned * f);
      out.push({ trueRings, rings, led, tr, compartments, open, floor, earned, potAfter: v.potBefore + earned, shown: n > 0 });
    }
    return out;
  },
  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const $ = id => document.getElementById(id);
    const rings = document.querySelectorAll('#no-orrery .no-ring');
    rings.forEach((el, r) => { el.classList.remove('true', 'out'); if (r < s.trueRings) el.classList.add('true'); });
    s.rings.forEach((rc, i) => {
      const rr = $('no-t' + i + '-rings'); if (rr) rr.textContent = rc + ' rings true';
      const ll = $('no-t' + i + '-led'); if (ll) ll.textContent = s.led[i];
      const tt = $('no-t' + i + '-tr'); if (tt) tt.textContent = s.tr[i];
    });
    const floor = $('no-floor'); if (floor) { floor.classList.toggle('open', !!s.open); floor.textContent = s.floor; }
    const pc = $('no-pot-c'); if (pc) pc.textContent = s.shown ? s.compartments : '—';
    const pe = $('no-pot-e'); if (pe) pe.textContent = s.shown ? _gbp(s.earned) : '—';
    const pa = $('no-pot-a'); if (pa) pa.textContent = _gbp(s.potAfter);
  },
  atmosphere: () => '<div class="no-sky"></div><div class="no-stars"></div><div class="no-lamp"></div>',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@300;400;600&family=Caveat:wght@500&display=swap');
.no-root{--no-void:#080b18;--no-ink:#0e1428;--no-ink2:#161f3c;--no-brass:#d9a441;--no-brass-dim:#8a6a26;--no-brass-lit:#f4cd7c;
  --no-star:#eaf0ff;--no-cold:#4d6fb5;--no-page:#e8e2d2;--no-pageink:#2a2620;--no-red:#b1443c;--cv-display:'Cormorant Garamond',serif;
  background:var(--no-void);color:var(--no-star);font-family:'IBM Plex Mono','SFMono-Regular',Consolas,monospace;
  font-size:15.5px;line-height:1.6;padding-bottom:120px;position:relative;overflow:hidden}
.no-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.no-sky{position:absolute;inset:0;background:radial-gradient(130% 90% at 50% 110%,#1c2a54 0%,#0e1428 45%,#060911 100%)}
.no-stars{position:absolute;inset:0;background-image:radial-gradient(1.2px 1.2px at 12% 22%,var(--no-star),transparent),radial-gradient(1px 1px at 34% 61%,var(--no-star),transparent),radial-gradient(1.4px 1.4px at 58% 14%,var(--no-star),transparent),radial-gradient(1px 1px at 71% 44%,var(--no-star),transparent),radial-gradient(1.3px 1.3px at 86% 76%,var(--no-star),transparent),radial-gradient(1px 1px at 23% 84%,var(--no-star),transparent),radial-gradient(1.1px 1.1px at 46% 33%,var(--no-star),transparent),radial-gradient(1px 1px at 92% 28%,var(--no-star),transparent);opacity:.55;animation:no-twinkle 6s ease-in-out infinite alternate}
@keyframes no-twinkle{from{opacity:.35}to{opacity:.72}}
.no-lamp{position:absolute;left:50%;top:40px;width:900px;height:900px;transform:translateX(-50%);background:radial-gradient(circle,rgba(217,164,65,.10) 0%,transparent 62%);animation:no-flicker 7s ease-in-out infinite}
@keyframes no-flicker{0%,100%{opacity:.9}43%{opacity:.66}61%{opacity:1}}
.no-shell{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:28px 18px 40px}
.no-body{position:relative;z-index:2}
.no-hero{text-align:center;padding:24px 0 30px;position:relative}
.no-hero::after{content:'';display:block;width:220px;height:1px;margin:24px auto 0;background:linear-gradient(90deg,transparent,var(--no-brass),transparent)}
.no-kicker{font-size:11.5px;letter-spacing:.42em;text-transform:uppercase;color:var(--no-cold)}
.no-title{font-family:'Cormorant Garamond',Garamond,serif;font-weight:700;font-size:clamp(40px,8vw,84px);line-height:.98;margin:.14em 0 .12em;letter-spacing:.01em}
.no-title span{color:var(--no-brass);font-style:italic}
.no-sub{color:#9aa8cc;max-width:60ch;margin:0 auto;font-size:16px}
.no-meta{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:20px}
.no-chip{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--no-brass);border:1px solid rgba(217,164,65,.35);border-radius:999px;padding:5px 13px}
.no-roster{justify-content:center}
.no-grid{display:grid;grid-template-columns:1fr 296px;gap:24px;align-items:start}
@media(max-width:900px){.no-grid{grid-template-columns:1fr}}
.no-brief{border:1px solid rgba(217,164,65,.28);padding:26px 24px 20px;background:rgba(8,11,24,.72);position:relative}
.no-brief::before,.no-brief::after{content:'';position:absolute;width:12px;height:12px;border:1px solid var(--no-brass)}
.no-brief::before{left:-1px;top:-1px;border-right:none;border-bottom:none}
.no-brief::after{right:-1px;bottom:-1px;border-left:none;border-top:none}
.no-brief h2{font-family:'Cormorant Garamond',serif;font-size:27px;font-weight:600;margin:0 0 6px;letter-spacing:.06em;text-transform:uppercase}
.no-staging{color:#8494bd;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;border-bottom:1px solid rgba(132,148,189,.25);padding-bottom:13px;margin-bottom:16px}
.no-beat{margin:0 0 14px}
.no-beat.say p{font-family:'Cormorant Garamond',serif;font-size:21px;line-height:1.42;color:#f3f5ff;margin:0;padding-left:20px;border-left:1px solid var(--no-brass)}
.no-beat.do p{margin:0;color:#6d7ca8;font-size:14px;letter-spacing:.02em}
.no-beat.do p::before{content:'— ';color:var(--no-brass-dim)}
.no-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
.no-rule{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#5d6a92;border:1px solid rgba(93,106,146,.4);border-radius:999px;padding:3px 10px}
.no-rule b{color:var(--no-brass);font-weight:600}
.no-phase{margin-top:34px;padding-top:18px;border-top:1px solid rgba(217,164,65,.22)}
.no-phase[data-phase="ledger"]{--acc:#c8b48a}
.no-phase[data-phase="gearing"]{--acc:var(--no-brass)}
.no-phase[data-phase="transit"]{--acc:#7fa8ff;position:relative}
.no-phase[data-phase="transit"]::before{content:'';position:absolute;left:-999px;right:-999px;top:0;bottom:0;z-index:-1;background:linear-gradient(180deg,rgba(127,168,255,.07),transparent 70%)}
.no-phase-head{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.no-phase-n{width:38px;height:38px;flex:none;border:1px solid var(--acc);color:var(--acc);display:grid;place-items:center;font-family:'Cormorant Garamond',serif;font-size:20px;transform:rotate(45deg)}
.no-phase-n b{transform:rotate(-45deg);display:block}
.no-phase-name{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;letter-spacing:.03em}
.no-phase-stats{margin-left:auto;display:flex;gap:6px}
.no-stat{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--acc);border:1px dashed color-mix(in srgb,var(--acc) 55%,transparent);padding:3px 9px;font-style:normal}
.no-setting{color:#8494bd;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;margin:10px 0 18px}
.no-card{position:relative;margin:0 0 14px;padding:16px 18px 16px 66px;background:linear-gradient(180deg,#efe9d9,#e2dac6);color:var(--no-pageink);box-shadow:0 12px 26px rgba(0,0,0,.5);opacity:0;transform:translateY(18px) rotate(-.35deg);transition:opacity .5s ease,transform .5s cubic-bezier(.2,.9,.25,1)}
.no-card::before{content:'';position:absolute;inset:0;pointer-events:none;opacity:.5;background:repeating-linear-gradient(180deg,transparent 0 25px,rgba(42,38,32,.16) 25px 26px)}
.no-card::after{content:'';position:absolute;left:54px;top:0;bottom:0;width:1px;background:rgba(177,68,60,.4)}
.no-card.on{opacity:1;transform:none}
.no-card .no-who{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:13.5px;letter-spacing:.14em;text-transform:uppercase;color:#5a4b33;position:relative}
.no-card .no-txt{font-family:'Cormorant Garamond',serif;font-size:20px;line-height:1.42;margin-top:3px;position:relative}
.no-card .no-tag{position:absolute;right:14px;top:14px;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;padding:2px 8px;border:1px solid currentColor;background:rgba(255,255,255,.4)}
.no-card.true{border-left:5px solid var(--no-brass-dim)} .no-card.true .no-tag{color:#7a5c17}
.no-card.out{border-left:5px solid var(--no-red)} .no-card.out .no-tag{color:var(--no-red)}
.no-card.plain{border-left:5px solid #b4a98e} .no-card.plain .no-tag{color:#7d7460}
.no-card.social{background:linear-gradient(180deg,#e6e9f4,#d8dcec);border-left:5px dashed var(--no-cold)}
.no-card.social .no-tag{color:#3a5590}
.no-card .no-conf{position:relative;margin-top:12px;padding:10px 12px 10px 14px;background:rgba(42,38,32,.06);border-left:2px solid var(--no-red);font-family:'Caveat',cursive;font-size:21px;line-height:1.3;color:#3b332a}
.no-card .no-conf small{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#8a7f68;margin-bottom:2px}
.no-card .no-fx{position:relative;margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#7d7460}
.no-card .no-fx span{border:1px dotted rgba(125,116,96,.6);padding:2px 7px}
.no-ico{position:absolute;left:14px;top:16px;width:32px;height:32px}
.no-ico i{position:absolute;display:block}
.ico-book i:nth-child(1){left:1px;top:8px;width:14px;height:18px;border:2px solid #7a5c17;border-right:none;transform:skewY(6deg)}
.ico-book i:nth-child(2){right:1px;top:8px;width:14px;height:18px;border:2px solid #7a5c17;border-left:none;transform:skewY(-6deg)}
.ico-book i:nth-child(3){left:15px;top:6px;width:2px;height:22px;background:#7a5c17}
.ico-ring i:nth-child(1){inset:2px;border:2px solid #7a5c17;border-radius:50%}
.ico-ring i:nth-child(2){inset:9px;border:1px solid #7a5c17;border-radius:50%}
.ico-ring i:nth-child(3){left:15px;top:0;width:2px;height:6px;background:#7a5c17;transform-origin:1px 16px;animation:no-spin 9s linear infinite}
@keyframes no-spin{to{transform:rotate(360deg)}}
.ico-slip i:nth-child(1){inset:2px;border:2px dashed var(--no-red);border-radius:50%;animation:no-wobble 2.4s ease-in-out infinite}
.ico-slip i:nth-child(2){left:14px;top:14px;width:4px;height:4px;background:var(--no-red);border-radius:50%}
@keyframes no-wobble{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.ico-merid i:nth-child(1){left:15px;top:0;bottom:0;width:2px;background:#3a5590}
.ico-merid i:nth-child(2){left:4px;top:4px;width:24px;height:24px;border:1px solid #3a5590;border-radius:50%}
.ico-merid i:nth-child(3){left:8px;top:14px;width:9px;height:3px;background:#3a5590;transform-origin:right center;animation:no-sweep 5s linear infinite}
@keyframes no-sweep{from{transform:rotate(-38deg)}to{transform:rotate(38deg)}}
.no-side{position:sticky;top:calc(${NAV} + 14px)}
.no-panel{border:1px solid rgba(217,164,65,.3);background:rgba(6,9,17,.9)}
.no-panel h3{margin:0;padding:11px 14px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--no-void);background:var(--no-brass)}
.no-orrery{position:relative;width:100%;aspect-ratio:1;max-width:250px;margin:16px auto 4px}
.no-ring{position:absolute;inset:0;border:1px solid rgba(93,106,146,.5);border-radius:50%;transition:border-color .6s ease,box-shadow .6s ease;animation:no-spin 26s linear infinite}
.no-ring:nth-child(1){inset:0%;animation-duration:38s}
.no-ring:nth-child(2){inset:10%;animation-duration:31s;animation-direction:reverse}
.no-ring:nth-child(3){inset:20%;animation-duration:25s}
.no-ring:nth-child(4){inset:30%;animation-duration:20s;animation-direction:reverse}
.no-ring:nth-child(5){inset:40%;animation-duration:16s}
.no-ring:nth-child(6){inset:50%;animation-duration:12s;animation-direction:reverse}
.no-ring b{position:absolute;left:50%;top:-4px;width:3px;height:8px;margin-left:-1.5px;background:rgba(93,106,146,.8);transition:background .6s ease}
.no-ring.true{border-color:var(--no-brass);box-shadow:0 0 14px rgba(217,164,65,.28) inset;animation-play-state:paused}
.no-ring.true b{background:var(--no-brass-lit)}
.no-ring.out{border-color:var(--no-red);border-style:dashed}
.no-ring.out b{background:var(--no-red)}
.no-core{position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:radial-gradient(circle,var(--no-brass-lit),var(--no-brass-dim));box-shadow:0 0 18px rgba(217,164,65,.6)}
.no-floor{margin:6px 14px 0;padding:9px 11px;text-align:center;border:1px solid rgba(93,106,146,.45);font-size:11.5px;letter-spacing:.26em;text-transform:uppercase;color:#7f8fbb;transition:.5s}
.no-floor.open{border-color:var(--no-brass);color:var(--no-brass-lit);background:rgba(217,164,65,.1)}
.no-rows{padding:12px 14px 4px}
.no-row{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;padding:5px 0;border-bottom:1px dotted rgba(93,106,146,.28);color:#93a1c8}
.no-row b{color:var(--no-star);font-variant-numeric:tabular-nums}
.no-row.team b{font-family:'Cormorant Garamond',serif;font-size:17px;color:var(--no-brass)}
.no-pot{padding:12px 14px 16px;border-top:1px solid rgba(217,164,65,.22);margin-top:6px}
.no-pot .r{display:flex;justify-content:space-between;font-size:13px;color:#93a1c8}
.no-pot .r b{color:var(--no-star);font-variant-numeric:tabular-nums}
.no-pot .big{font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--no-brass);font-variant-numeric:tabular-nums;margin-top:6px;letter-spacing:.02em}
.no-shieldnote{margin:0 14px 14px;padding:9px 11px;border:1px dashed rgba(93,106,146,.4);font-size:11.5px;color:#7f8fbb;letter-spacing:.04em}
.no-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;background:linear-gradient(180deg,rgba(8,11,24,.1),rgba(5,7,15,.97) 45%);border-top:1px solid rgba(217,164,65,.3);padding:14px 18px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
.no-btn{font:400 12px/1 'IBM Plex Mono',monospace;letter-spacing:.24em;text-transform:uppercase;padding:13px 26px;border-radius:999px;background:transparent;color:var(--no-brass);border:1px solid var(--no-brass);cursor:pointer;transition:.22s}
.no-btn:hover{background:var(--no-brass);color:var(--no-void)}
.no-btn.ghost{color:#7f8fbb;border-color:rgba(127,143,187,.5)}
.no-btn[disabled]{opacity:.32;cursor:default}
.no-counter{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#7f8fbb;min-width:160px;text-align:center;font-variant-numeric:tabular-nums}
.no-summary{margin-top:36px;padding:26px;border:1px solid rgba(217,164,65,.35);background:rgba(8,11,24,.8);font-family:'Cormorant Garamond',serif;font-size:22px;line-height:1.45}
.no-summary small{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:var(--no-brass);margin-bottom:9px}
@media(prefers-reduced-motion:reduce){.no-root *,.no-root *::before,.no-root *::after{animation:none !important;transition:none !important}.no-card{opacity:1;transform:none}}
`,
};

// ══════════════════════════════════════════════════════════════════════
// 3. THE LONG ACCOUNT — green baize, daylight, a ruled ledger with wax seals
// ══════════════════════════════════════════════════════════════════════

const ACCOUNT_TAGS = {
  'survey:good': 'Sound', 'survey:bad': 'Weak', 'survey:steady': 'Read',
  'room:good': 'Settled', 'room:bad': 'Struck', 'room:steady': 'Argued',
  'settlement:win': 'Held', 'settlement:lose': 'Not taken', 'settlement:steady': 'Sealed',
};
const SEAL_CLS = { good: 'gold', bad: 'grey', win: 'blue', lose: 'grey', steady: 'blue' };
const ACCOUNT = {
  id: 'long-account', prefix: 'la',
  rootVars: '', sheetBrief: true,
  nextLabel: 'Enter next', allLabel: 'Enter all', revealedWord: 'entered',
  title: v => '<h1 class="la-title">The Long <em>Account</em></h1>',
  sub: v => 'A dead man\'s debts, an agent with a locked box, and one word each to write where nobody can see you write it.',
  chips: v => [{ text: 'Three phases' }, { text: v.teams.map(t => t.name).join(' v ') },
    { text: 'A hold pays four times a take' }, { text: 'No shield' }],
  phaseNum: (roman) => '<span class="la-phase-n">Phase ' + roman + '</span>',
  cardClass: c => (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'struck' : ''),
  cardTag: (c, ph) => c.isSocial
    ? _cap(c.behaviour || 'moment')
    : (ACCOUNT_TAGS[ph.id + ':' + c.kind] || _cap(c.kind)),
  icon: (c) => {
    const cls = c.isSocial ? 'blue' : (SEAL_CLS[c.kind] || (c.tone === 'good' ? 'gold' : c.tone === 'bad' ? 'grey' : 'blue'));
    return '<span class="la-seal ' + cls + '"></span>';
  },
  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const cols = v.teams.map((t, i) =>
      '<div class="la-col"><h4>' + _esc(t.name) + '</h4>'
      + '<div class="kv"><span>claims</span><b id="la-t' + i + '-c">' + _esc(s.claims[i]) + '</b></div>'
      + '<div class="kv"><span>settled</span><b id="la-t' + i + '-s">' + _esc(s.settled[i]) + '</b></div>'
      + '<div class="kv"><span>screens</span><b id="la-t' + i + '-t">' + _esc(s.screens[i]) + '</b></div>'
      + '<div class="la-tally" id="la-t' + i + '-tally">' + _tally(s.tally[i], s.counted[i]) + '</div></div>').join('');
    return '<div class="la-book"><h3>The Account</h3>'
      + '<div class="la-cols">' + cols + '</div>'
      + '<div class="la-nonames">The clerk reads out two numbers and no names. This board cannot tell you who held, '
      + 'because nobody in the castle was told.</div>'
      + '<div class="la-total">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Earned today</span><b id="la-tot-e">' + (s.shown ? _gbp(s.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="la-tot-a">' + _gbp(s.potAfter) + '</div></div>'
      + '<div class="la-shieldnote"><b>Shield.</b> There is no relic in a counting room. Everything here is money.</div></div>';
  },
  sideStates(v, total) {
    const pr = phaseProg(v);
    const names = v.teams.map(t => t.name);
    const claimsT = v.tally.claims || {}, settledT = v.tally.settled || {}, settle = v.tally.settlement || {};
    const finalClaims = names.map(nm => claimsT[nm]);
    const finalSettled = names.map(nm => settledT[nm]);
    const out = [];
    for (let n = 0; n <= total; n++) {
      const surveyDone = n >= (pr[1] ? pr[1].start : total);
      const roomDone = n >= (pr[2] ? pr[2].start : total);
      const settleDone = n >= total;
      const claims = names.map((nm, i) => surveyDone && finalClaims[i] != null ? String(finalClaims[i]) : (n > pr[0].start ? '…' : '—'));
      const settled = names.map((nm, i) => roomDone && finalSettled[i] != null ? String(finalSettled[i]) : (n > (pr[1] ? pr[1].start : 0) ? '…' : '—'));
      const screens = names.map(nm => {
        const st = settle[nm]; return settleDone && st ? (st.holds + ' / ' + st.takes) : '—';
      });
      const tally = names.map(nm => { const st = settle[nm]; return st ? [st.holds || 0, st.takes || 0] : [0, 0]; });
      const counted = names.map(() => settleDone);
      const f = total ? n / total : 0;
      const earned = Math.round(v.earned * f);
      out.push({ claims, settled, screens, tally, counted, earned, potAfter: v.potBefore + earned, shown: n > 0 });
    }
    return out;
  },
  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const $ = id => document.getElementById(id);
    s.claims.forEach((c, i) => {
      const cc = $('la-t' + i + '-c'); if (cc) cc.textContent = c;
      const ss = $('la-t' + i + '-s'); if (ss) ss.textContent = s.settled[i];
      const tt = $('la-t' + i + '-t'); if (tt) tt.textContent = s.screens[i];
      const ta = $('la-t' + i + '-tally'); if (ta) ta.innerHTML = _tally(s.tally[i], s.counted[i]);
    });
    const te = $('la-tot-e'); if (te) te.textContent = s.shown ? _gbp(s.earned) : '—';
    const ta = $('la-tot-a'); if (ta) ta.textContent = _gbp(s.potAfter);
  },
  atmosphere: () => '<div class="la-room"></div><div class="la-dust"></div>',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Special+Elite&family=Inter:wght@400;500;600&display=swap');
.la-root{--la-baize:#1f3a2e;--la-baize-2:#173025;--la-oxblood:#4a1c1c;--la-paper:#f2ead6;--la-paper-2:#e6dcc2;--la-ink:#2b2418;--la-ink-2:#5c503c;
  --la-rule:#c0392b;--la-blue:#2f4b7c;--la-lamp:#e8b563;--la-wax:#8e2b24;--la-gold:#b58a3c;--cv-display:'Libre Baskerville',serif;
  background:var(--la-baize);color:var(--la-ink);font-family:'Inter',system-ui,sans-serif;font-size:16px;line-height:1.55;padding-bottom:120px;position:relative;overflow:hidden}
.la-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.la-room{position:absolute;inset:0;background:radial-gradient(90% 60% at 50% 0%,rgba(232,181,99,.16) 0%,transparent 60%),repeating-linear-gradient(46deg,rgba(0,0,0,.05) 0 3px,transparent 3px 6px),linear-gradient(180deg,var(--la-baize) 0%,var(--la-baize-2) 100%)}
.la-dust{position:absolute;inset:0;opacity:.4;background-image:radial-gradient(1.5px 1.5px at 18% 30%,rgba(232,181,99,.7),transparent),radial-gradient(1.2px 1.2px at 44% 70%,rgba(232,181,99,.6),transparent),radial-gradient(1.6px 1.6px at 66% 22%,rgba(232,181,99,.5),transparent),radial-gradient(1.2px 1.2px at 82% 58%,rgba(232,181,99,.6),transparent);animation:la-drift 24s linear infinite alternate}
@keyframes la-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-26px,-40px,0)}}
.la-shell{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:26px 18px 40px}
.la-body{position:relative;z-index:2}
.la-hero{background:linear-gradient(160deg,#5b2323,#3a1616);color:var(--la-paper);border:1px solid #26100f;padding:32px 28px 28px;position:relative;box-shadow:inset 0 0 0 6px rgba(181,138,60,.28),0 20px 40px rgba(0,0,0,.4)}
.la-kicker{font-size:11.5px;letter-spacing:.38em;text-transform:uppercase;color:var(--la-gold)}
.la-title{font-family:'Libre Baskerville',Georgia,serif;font-weight:700;font-size:clamp(34px,6.4vw,64px);line-height:1.02;margin:.18em 0 .12em}
.la-title em{color:var(--la-lamp)}
.la-sub{color:#e0cfc2;max-width:62ch;font-size:17px}
.la-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.la-chip{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--la-lamp);border:1px solid rgba(232,181,99,.4);padding:5px 12px}
.la-hero .mb-rname,.la-hero .mb-observer{color:var(--la-paper)}
.la-grid{display:grid;grid-template-columns:1fr 300px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:900px){.la-grid{grid-template-columns:1fr}}
.la-sheet{background:linear-gradient(180deg,var(--la-paper),var(--la-paper-2));box-shadow:0 18px 40px rgba(0,0,0,.42);position:relative;padding:26px 26px 20px 74px}
.la-sheet::before{content:'';position:absolute;left:58px;top:0;bottom:0;width:1px;background:var(--la-rule);opacity:.55}
.la-sheet::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.34;background:repeating-linear-gradient(180deg,transparent 0 27px,rgba(43,36,24,.18) 27px 28px)}
.la-brief h2{font-family:'Libre Baskerville',serif;font-size:26px;margin:0 0 4px;position:relative}
.la-staging{font-family:'Libre Baskerville',serif;font-style:italic;color:var(--la-ink-2);position:relative;border-bottom:1px solid rgba(43,36,24,.2);padding-bottom:12px;margin-bottom:16px}
.la-beat{margin:0 0 13px;position:relative}
.la-beat.say p{font-family:'Libre Baskerville',serif;font-size:19px;line-height:1.5;margin:0;color:#1f1a11}
.la-beat.say p::before{content:'“';color:var(--la-wax)}
.la-beat.say p::after{content:'”';color:var(--la-wax)}
.la-beat.do p{margin:0;font-family:'Special Elite',cursive;font-size:14.5px;color:#6f6250;letter-spacing:.01em}
.la-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px;position:relative}
.la-rule{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#6f6250;border:1px solid rgba(111,98,80,.45);padding:3px 9px}
.la-rule b{color:var(--la-wax);font-weight:600}
.la-phase{margin-top:22px;background:linear-gradient(180deg,var(--la-paper),var(--la-paper-2));box-shadow:0 18px 40px rgba(0,0,0,.42);position:relative;padding:26px 26px 20px 74px}
.la-phase::before{content:'';position:absolute;left:58px;top:0;bottom:0;width:1px;background:var(--la-rule);opacity:.55}
.la-phase-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;position:relative;border-bottom:2px solid var(--la-ink);padding-bottom:6px;margin-bottom:4px}
.la-phase-n{font-family:'Special Elite',cursive;font-size:15px;color:var(--la-wax);letter-spacing:.2em}
.la-phase-name{font-family:'Libre Baskerville',serif;font-size:27px;font-weight:700}
.la-phase-stats{margin-left:auto;display:flex;gap:6px}
.la-stat{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--la-blue);border:1px solid rgba(47,75,124,.4);padding:3px 8px;font-style:normal}
.la-setting{font-family:'Libre Baskerville',serif;font-style:italic;color:var(--la-ink-2);position:relative;margin:10px 0 16px}
.la-card{position:relative;padding:12px 0 12px 12px;border-bottom:1px solid rgba(43,36,24,.18);opacity:0;transform:translateX(-22px);transition:opacity .4s ease,transform .45s cubic-bezier(.2,.85,.3,1)}
.la-card.on{opacity:1;transform:none}
.la-card .la-who{font-family:'Special Elite',cursive;font-size:14px;letter-spacing:.06em;color:var(--la-wax)}
.la-card .la-txt{font-family:'Libre Baskerville',serif;font-size:18px;line-height:1.45;margin-top:2px}
.la-card.struck .la-txt{color:#6b6252}
.la-card .la-tag{position:absolute;right:2px;top:12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a7d69}
.la-card.social{background:rgba(47,75,124,.05)}
.la-card .la-conf{margin-top:10px;padding:10px 13px;background:rgba(43,36,24,.06);border-left:3px solid var(--la-wax);font-family:'Libre Baskerville',serif;font-style:italic;font-size:17px}
.la-card .la-conf small{display:block;font-family:'Inter',sans-serif;font-style:normal;font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:#8a7d69;margin-bottom:3px}
.la-card .la-fx{margin-top:9px;display:flex;flex-wrap:wrap;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#7d7160}
.la-card .la-fx span{border:1px dotted rgba(125,113,96,.55);padding:2px 7px}
.la-seal{position:absolute;left:-58px;top:12px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#b4453b,var(--la-wax) 60%,#5f1a15);box-shadow:0 3px 7px rgba(0,0,0,.35)}
.la-seal::after{content:'';position:absolute;inset:5px;border:1px solid rgba(255,225,210,.35);border-radius:50%}
.la-seal.blue{background:radial-gradient(circle at 35% 32%,#4a6ea8,var(--la-blue) 60%,#1d2f4f)}
.la-seal.gold{background:radial-gradient(circle at 35% 32%,#d8b060,var(--la-gold) 60%,#6d5120)}
.la-seal.grey{background:radial-gradient(circle at 35% 32%,#9c9384,#6f6857 60%,#40392c)}
.la-side{position:sticky;top:calc(${NAV} + 14px)}
.la-book{background:linear-gradient(180deg,var(--la-paper),var(--la-paper-2));box-shadow:0 16px 34px rgba(0,0,0,.42);position:relative;padding-bottom:14px}
.la-book h3{margin:0;padding:11px 14px;background:var(--la-oxblood);color:var(--la-lamp);font:600 11px/1 'Inter',sans-serif;letter-spacing:.28em;text-transform:uppercase}
.la-cols{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(43,36,24,.2)}
.la-col{padding:12px 12px 10px}
.la-col + .la-col{border-left:1px solid rgba(43,36,24,.2)}
.la-col h4{margin:0 0 8px;font-family:'Libre Baskerville',serif;font-size:17px;letter-spacing:.02em}
.la-col .kv{display:flex;justify-content:space-between;font-size:12.5px;color:var(--la-ink-2);padding:3px 0}
.la-col .kv b{color:var(--la-ink);font-family:'Special Elite',cursive}
.la-tally{display:flex;gap:3px;margin-top:8px;flex-wrap:wrap}
.la-tally i{width:5px;height:16px;background:#c9bda2;display:block;transition:background .35s ease}
.la-tally i.held{background:var(--la-blue)}
.la-tally i.took{background:var(--la-rule)}
.la-nonames{margin:10px 12px 0;padding:9px 11px;border:1px dashed rgba(43,36,24,.35);font-family:'Special Elite',cursive;font-size:12.5px;color:#6f6250;line-height:1.4}
.la-total{padding:12px 14px 0}
.la-total .r{display:flex;justify-content:space-between;font-size:13px;color:var(--la-ink-2)}
.la-total .r b{color:var(--la-ink);font-family:'Special Elite',cursive}
.la-total .big{font-family:'Libre Baskerville',serif;font-weight:700;font-size:30px;color:var(--la-oxblood);margin-top:8px;border-top:2px double var(--la-ink);padding-top:6px}
.la-shieldnote{margin:12px 12px 0;padding:9px 11px;background:rgba(43,36,24,.06);font-size:12px;color:#6f6250}
.la-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;background:linear-gradient(180deg,rgba(23,48,37,.2),#12241b 45%);border-top:2px solid var(--la-gold);padding:14px 18px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
.la-btn{font:600 12px/1 'Inter',sans-serif;letter-spacing:.2em;text-transform:uppercase;padding:13px 26px;background:var(--la-paper);color:var(--la-oxblood);border:1px solid var(--la-gold);cursor:pointer;transition:.2s}
.la-btn:hover{background:var(--la-lamp)}
.la-btn.ghost{background:transparent;color:var(--la-lamp)}
.la-btn[disabled]{opacity:.35;cursor:default}
.la-counter{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#9db8a8;min-width:160px;text-align:center;font-variant-numeric:tabular-nums}
.la-summary{margin-top:24px;padding:22px 26px 22px 74px;position:relative;background:linear-gradient(180deg,var(--la-paper),var(--la-paper-2));box-shadow:0 18px 40px rgba(0,0,0,.4);font-family:'Libre Baskerville',serif;font-size:20px;line-height:1.5}
.la-summary small{display:block;font-family:'Inter',sans-serif;font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--la-wax);margin-bottom:8px}
@media(prefers-reduced-motion:reduce){.la-root *,.la-root *::before,.la-root *::after{animation:none !important;transition:none !important}.la-card{opacity:1;transform:none}.la-dust{display:none}}
`,
};
function _tally(pair, counted) {
  let h = '';
  if (!counted) { for (let i = 0; i < 9; i++) h += '<i></i>'; return h; }
  for (let x = 0; x < (pair[0] || 0); x++) h += '<i class="held"></i>';
  for (let x = 0; x < (pair[1] || 0); x++) h += '<i class="took"></i>';
  return h;
}

// ══════════════════════════════════════════════════════════════════════
// 4. THE ASH VAULT — charcoal and ember, a burnt wing in section, a flue
// ══════════════════════════════════════════════════════════════════════

const VAULT_TAGS = {
  'shoring:good': 'Seated', 'shoring:bad': 'Short', 'shoring:steady': 'Propped',
  'crawl:good': 'Runs', 'crawl:steady': 'Steady', 'crawl:bad': 'Stopped', 'crawl:dull': 'Steady',
  'sort:good': 'Sharp', 'sort:bad': 'Binned', 'sort:sharp': 'Sharp', 'sort:steady': 'Steady',
  strong: 'Strong', sharp: 'Sharp', stop: 'Stopped', dull: 'Steady',
};
const VAULT = {
  id: 'ash-vault', prefix: 'av',
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: v => '<h1 class="av-title">The Ash <span>Vault</span></h1>',
  sub: v => 'A wing that burned forty years ago, a strongroom under the fallen roof, and one narrow flue somebody is going to leave the relay for.',
  chips: v => [{ text: 'Three phases' }, { text: v.teams.map(t => t.name).join(' v ') },
    { text: '£2,500 a readable deed' }, { text: 'One shield in the flue', shield: true }],
  phaseNum: (roman, ph) => '<span class="av-phase-n">' + String(ph._num).padStart(2, '0') + '</span>',
  cardClass: c => c.relic ? 'relic' : ((c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: (c, ph) => c.relic ? 'The flue'
    : c.isSocial ? _cap(c.behaviour || 'moment')
      : (VAULT_TAGS[ph.id + ':' + c.kind] || VAULT_TAGS[c.kind] || _cap(c.kind)),
  icon: (c, ph) => {
    let ic = 'ico-prop';
    if (c.relic) ic = 'ico-flue';
    else if (ph.id === 'shoring') ic = c.tone === 'bad' ? 'ico-fold' : 'ico-prop';
    else if (ph.id === 'crawl') ic = 'ico-crawl';
    else if (ph.id === 'sort') ic = 'ico-deed';
    return '<span class="av-ico ' + ic + '"><i></i><i></i><i></i></span>';
  },
  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const rows = v.teams.map((t, i) =>
      '<div class="av-row team"' + (i > 0 ? ' style="margin-top:8px"' : '') + '><span>' + _esc(t.name)
      + '</span><b id="av-t' + i + '-bays">' + _esc(s.bays[i]) + '</b></div>'
      + '<div class="av-row"><span>Out of the crawl</span><b id="av-t' + i + '-box">' + _esc(s.box[i]) + '</b></div>'
      + '<div class="av-row"><span>Readable deeds</span><b id="av-t' + i + '-deed">' + _esc(s.deed[i]) + '</b></div>').join('');
    return '<div class="av-panel"><h3>The Wing</h3>'
      + '<div class="av-section"><div class="av-cut"><div class="roof"></div>'
      + '<div class="av-props" id="av-props">' + s.props.map(p => '<b class="' + (p === 1 ? 'up' : p === 2 ? 'down' : '') + '"></b>').join('') + '</div>'
      + '<div class="av-flue' + (s.flueLit ? ' lit' : '') + '" id="av-flue"></div>'
      + '<div class="av-tunnel"><i id="av-worm" style="left:' + s.worm + '%"></i></div></div>'
      + '<div class="av-cutlabel"><span>walkway</span><span>strongroom · 60 ft</span></div></div>'
      + '<div class="av-rows">' + rows + '</div>'
      + '<div class="av-shieldbox' + (s.flueLit ? ' on' : '') + '" id="av-shieldbox">'
      + '<div class="lbl">The Flue</div><div class="val" id="av-shieldval">' + _esc(s.shieldVal) + '</div>'
      + '<div class="cost" id="av-shieldcost">' + _esc(s.shieldCost) + '</div></div>'
      + '<div class="av-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Readable deeds</span><b id="av-pot-d">' + (s.shown ? s.deeds : '&mdash;') + '</b></div>'
      + '<div class="r"><span>Earned today</span><b id="av-pot-e">' + (s.shown ? _gbp(s.earned) : '&mdash;') + '</b></div>'
      + '<div class="big" id="av-pot-a">' + _gbp(s.potAfter) + '</div></div></div>';
  },
  sideStates(v, total) {
    const pr = phaseProg(v);
    const names = v.teams.map(t => t.name);
    const baysT = v.tally.bays || {}, boxT = v.tally.outOfTheCrawl || {}, deedT = v.tally.readable || {};
    const finalBays = names.map(nm => Math.max(0, baysT[nm] || 0));
    const totalBays = Math.min(8, finalBays.reduce((a, b) => a + b, 0));
    const relicStep = relicStepOf(v);
    const sh = v.shield || null;
    const out = [];
    for (let n = 0; n <= total; n++) {
      const shoreStart = pr[0].start, shoreEnd = pr[1] ? pr[1].start : total;
      const sg = shoreEnd > shoreStart ? Math.max(0, Math.min(1, (n - shoreStart) / (shoreEnd - shoreStart))) : (n >= shoreEnd ? 1 : 0);
      const propsUp = Math.round(totalBays * sg);
      const props = Array.from({ length: 8 }, (_, k) => k < propsUp ? 1 : 0);
      const crawlStart = pr[1] ? pr[1].start : total, crawlEnd = pr[2] ? pr[2].start : total;
      const cg = crawlEnd > crawlStart ? Math.max(0, Math.min(1, (n - crawlStart) / (crawlEnd - crawlStart))) : (n >= crawlEnd ? 1 : 0);
      const worm = Math.round(92 * cg);
      const shoreDone = n >= shoreEnd, crawlDone = n >= crawlEnd, sortDone = n >= total;
      const bays = names.map((nm, i) => shoreDone ? (finalBays[i] + ' bays') : (n > shoreStart ? '…' : '— bays'));
      const box = names.map(nm => crawlDone && boxT[nm] != null ? String(boxT[nm]) : (n > crawlStart ? '…' : '—'));
      const deed = names.map(nm => sortDone && deedT[nm] != null ? String(deedT[nm]) : (n > (pr[2] ? pr[2].start : total) ? '…' : '—'));
      const deeds = names.reduce((a, nm) => a + (sortDone ? (deedT[nm] || 0) : 0), 0);
      const flueLit = relicStep >= 0 && n > relicStep;
      const shieldVal = flueLit && sh
        ? (sh.found ? (sh.holder + ' · found the ring') : (sh.searcher + ' · came back empty'))
        : 'nobody has gone up it';
      const shieldCost = flueLit && sh
        ? ('cost the castle ' + _gbp(sh.cost || 0) + ' of carry · seen by ' + (sh.witnesses ? sh.witnesses.length : 0))
        : '';
      const f = total ? n / total : 0;
      const earned = Math.round(v.earned * f);
      out.push({ props, worm, bays, box, deed, deeds, flueLit, shieldVal, shieldCost, earned, potAfter: v.potBefore + earned, shown: n > 0 });
    }
    return out;
  },
  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const $ = id => document.getElementById(id);
    const props = document.querySelectorAll('#av-props b');
    props.forEach((el, k) => { el.classList.remove('up', 'down'); if (s.props[k] === 1) el.classList.add('up'); if (s.props[k] === 2) el.classList.add('down'); });
    const worm = $('av-worm'); if (worm) worm.style.left = s.worm + '%';
    s.bays.forEach((b, i) => {
      const bb = $('av-t' + i + '-bays'); if (bb) bb.textContent = b;
      const xb = $('av-t' + i + '-box'); if (xb) xb.textContent = s.box[i];
      const dd = $('av-t' + i + '-deed'); if (dd) dd.textContent = s.deed[i];
    });
    const flue = $('av-flue'); if (flue) flue.classList.toggle('lit', s.flueLit);
    const sb = $('av-shieldbox'); if (sb) sb.classList.toggle('on', s.flueLit);
    const sv = $('av-shieldval'); if (sv) sv.textContent = s.shieldVal;
    const sc = $('av-shieldcost'); if (sc) sc.textContent = s.shieldCost;
    const pd = $('av-pot-d'); if (pd) pd.textContent = s.shown ? s.deeds : '—';
    const pe = $('av-pot-e'); if (pe) pe.textContent = s.shown ? _gbp(s.earned) : '—';
    const pa = $('av-pot-a'); if (pa) pa.textContent = _gbp(s.potAfter);
  },
  atmosphere: () => '<div class="av-room"></div><div class="av-beams"></div><div class="av-ash"></div>',
  css: `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
.av-root{--av-char:#14100e;--av-char2:#1e1815;--av-soot:#2b2320;--av-smoke:#4a3f39;--av-ember:#e2601c;--av-ember-lo:#8a3a10;
  --av-ash:#cfc6bd;--av-bone:#efe8dd;--av-cold:#5f7b86;--av-shield:#f0c04a;--av-red:#c0392b;--cv-display:'Oswald',sans-serif;
  background:var(--av-char);color:var(--av-ash);font-family:'Oswald','Arial Narrow',sans-serif;font-weight:300;font-size:16.5px;line-height:1.55;padding-bottom:120px;position:relative;overflow:hidden}
.av-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.av-room{position:absolute;inset:0;background:radial-gradient(75% 55% at 50% 108%,rgba(226,96,28,.22) 0%,transparent 62%),radial-gradient(120% 80% at 50% -10%,#2b2320 0%,#14100e 60%,#0b0908 100%)}
.av-beams{position:absolute;inset:0;opacity:.22;background:repeating-linear-gradient(74deg,rgba(0,0,0,.9) 0 10px,transparent 10px 90px),repeating-linear-gradient(-68deg,rgba(0,0,0,.75) 0 7px,transparent 7px 130px)}
.av-ash{position:absolute;inset:0;opacity:.45;background-image:radial-gradient(1.6px 1.6px at 10% 10%,var(--av-ash),transparent),radial-gradient(1.2px 1.2px at 30% 45%,var(--av-ash),transparent),radial-gradient(1.8px 1.8px at 55% 20%,var(--av-ash),transparent),radial-gradient(1.2px 1.2px at 74% 62%,var(--av-ash),transparent),radial-gradient(1.5px 1.5px at 88% 34%,var(--av-ash),transparent),radial-gradient(1.3px 1.3px at 22% 78%,var(--av-ash),transparent);background-size:600px 600px;animation:av-fall 26s linear infinite}
@keyframes av-fall{from{background-position:0 -600px}to{background-position:-90px 600px}}
.av-shell{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:26px 18px 40px}
.av-body{position:relative;z-index:2}
.av-hero{border:1px solid var(--av-soot);background:linear-gradient(160deg,rgba(43,35,32,.9),rgba(15,12,11,.92));padding:30px 26px 26px;position:relative;overflow:hidden}
.av-hero::after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,transparent,var(--av-ember),var(--av-ember-lo),transparent);animation:av-glow 5.5s ease-in-out infinite}
@keyframes av-glow{0%,100%{opacity:.55}50%{opacity:1}}
.av-kicker{font-size:11.5px;letter-spacing:.4em;text-transform:uppercase;color:var(--av-ember)}
.av-title{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;font-size:clamp(38px,7.6vw,78px);line-height:.92;margin:.14em 0 .12em;letter-spacing:-.005em;color:var(--av-bone)}
.av-title span{color:var(--av-ember)}
.av-sub{color:#98897f;max-width:60ch;font-size:17px;font-family:'Courier Prime',monospace}
.av-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.av-chip{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--av-ash);border:1px solid var(--av-smoke);padding:5px 12px;background:rgba(0,0,0,.3)}
.av-chip.shield{border-color:var(--av-shield);color:var(--av-shield)}
.av-grid{display:grid;grid-template-columns:1fr 302px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:900px){.av-grid{grid-template-columns:1fr}}
.av-brief{background:rgba(11,9,8,.8);border:1px solid var(--av-soot);padding:24px 22px 20px}
.av-brief h2{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.1em;font-size:23px;margin:0 0 6px;color:var(--av-bone)}
.av-staging{font-family:'Courier Prime',monospace;font-style:italic;color:#8c7d73;font-size:15px;border-bottom:1px solid var(--av-soot);padding-bottom:12px;margin-bottom:16px}
.av-beat{margin:0 0 14px}
.av-beat.say p{margin:0;font-size:19.5px;line-height:1.45;color:var(--av-bone);font-weight:300;padding-left:16px;border-left:3px solid var(--av-ember-lo)}
.av-beat.do p{margin:0;font-family:'Courier Prime',monospace;font-size:14px;color:#7d6f66}
.av-beat.do p::before{content:'[ ';color:var(--av-ember-lo)}
.av-beat.do p::after{content:' ]';color:var(--av-ember-lo)}
.av-beat.shield p{border-left-color:var(--av-shield);color:#fff2d3}
.av-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:18px}
.av-rule{font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#7d6f66;border:1px solid var(--av-smoke);padding:3px 9px}
.av-rule b{color:var(--av-ember);font-weight:500}
.av-phase{margin-top:30px;padding:18px 16px 4px;border:1px solid var(--av-soot);position:relative}
.av-phase[data-phase="shoring"]{background:linear-gradient(180deg,rgba(74,63,57,.34),transparent 60%)}
.av-phase[data-phase="crawl"]{background:linear-gradient(180deg,rgba(10,8,7,.95),rgba(20,16,14,.4) 70%)}
.av-phase[data-phase="sort"]{background:linear-gradient(180deg,rgba(207,198,189,.14),transparent 60%)}
.av-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:4px}
.av-phase-n{font-family:'Courier Prime',monospace;font-weight:700;font-size:13px;letter-spacing:.2em;color:var(--av-char);background:var(--av-ember);padding:4px 9px}
.av-phase-name{font-family:'Oswald',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:27px;color:var(--av-bone)}
.av-phase-stats{margin-left:auto;display:flex;gap:6px}
.av-stat{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--av-cold);border:1px solid rgba(95,123,134,.5);padding:3px 8px;font-style:normal}
.av-setting{font-family:'Courier Prime',monospace;font-style:italic;color:#8c7d73;margin:8px 0 16px}
.av-card{position:relative;margin:0 0 13px;padding:14px 16px 14px 60px;background:linear-gradient(155deg,#2a2320,#1a1513);border:1px solid #0d0b0a;box-shadow:inset 0 0 26px rgba(0,0,0,.7),0 8px 18px rgba(0,0,0,.5);opacity:0;transform:translateY(-10px) rotate(-.5deg);transition:opacity .5s ease,transform .55s cubic-bezier(.25,.9,.3,1)}
.av-card.on{opacity:1;transform:none}
.av-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,var(--av-smoke),#0d0b0a)}
.av-card .av-who{font-family:'Courier Prime',monospace;font-weight:700;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--av-ember)}
.av-card .av-txt{color:#d6cdc4;margin-top:2px}
.av-card .av-tag{position:absolute;right:12px;top:12px;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;padding:2px 8px;border:1px solid currentColor}
.av-card.good::before{background:linear-gradient(180deg,var(--av-ember),var(--av-ember-lo))}
.av-card.good .av-tag{color:var(--av-ember)}
.av-card.bad::before{background:linear-gradient(180deg,var(--av-red),#5c1d16)}
.av-card.bad .av-tag{color:var(--av-red)}
.av-card.plain .av-tag{color:#7d6f66}
.av-card.social{border-style:dashed;border-color:var(--av-smoke);background:linear-gradient(155deg,#252b2e,#161a1c)}
.av-card.social .av-tag{color:var(--av-cold)}
.av-card.social::before{background:linear-gradient(180deg,var(--av-cold),#2a3a41)}
.av-card.relic{border:1px solid var(--av-shield);background:linear-gradient(155deg,#332a16,#1c1710);box-shadow:inset 0 0 34px rgba(240,192,74,.16),0 8px 22px rgba(0,0,0,.6)}
.av-card.relic .av-tag{color:var(--av-shield)}
.av-card.relic::before{background:linear-gradient(180deg,var(--av-shield),#7a5f16)}
.av-card .av-conf{margin-top:11px;padding:10px 13px;background:rgba(0,0,0,.4);border-left:2px solid var(--av-ember-lo);font-family:'Courier Prime',monospace;font-size:15.5px;line-height:1.45;color:#e4dbd2}
.av-card .av-conf small{display:block;font-family:'Oswald',sans-serif;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:#7d6f66;margin-bottom:4px}
.av-card .av-fx{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#7d6f66}
.av-card .av-fx span{border:1px dotted var(--av-smoke);padding:2px 7px}
.av-ico{position:absolute;left:16px;top:15px;width:30px;height:30px}
.av-ico i{position:absolute;display:block}
.ico-prop i:nth-child(1){left:13px;top:0;width:4px;bottom:4px;background:var(--av-ember)}
.ico-prop i:nth-child(2){left:4px;right:4px;top:0;height:3px;background:var(--av-ember)}
.ico-prop i:nth-child(3){left:6px;right:6px;bottom:0;height:4px;background:var(--av-ember-lo)}
.ico-fold i:nth-child(1){left:13px;top:2px;width:4px;height:16px;background:var(--av-red);transform:rotate(19deg);transform-origin:bottom}
.ico-fold i:nth-child(2){left:4px;right:4px;top:0;height:3px;background:var(--av-red);transform:rotate(-8deg)}
.ico-fold i:nth-child(3){left:5px;right:5px;bottom:0;height:4px;background:#5c1d16}
.ico-crawl i:nth-child(1){left:0;right:0;top:9px;height:12px;border:2px solid var(--av-ash);border-left:none;border-right:none}
.ico-crawl i:nth-child(2){left:2px;top:13px;width:5px;height:4px;background:var(--av-ember);animation:av-crawl 3.4s linear infinite}
@keyframes av-crawl{from{transform:translateX(0)}to{transform:translateX(21px)}}
.ico-flue i:nth-child(1){left:11px;top:0;width:8px;bottom:6px;border:2px solid var(--av-shield);border-bottom:none}
.ico-flue i:nth-child(2){left:4px;right:4px;bottom:0;height:4px;background:var(--av-shield);opacity:.6}
.ico-flue i:nth-child(3){left:13px;top:8px;width:4px;height:4px;border-radius:50%;background:var(--av-shield);animation:av-rise 2.8s ease-in-out infinite}
@keyframes av-rise{0%,100%{transform:translateY(6px);opacity:.4}50%{transform:translateY(-4px);opacity:1}}
.ico-deed i:nth-child(1){left:4px;top:2px;right:4px;bottom:2px;background:var(--av-bone)}
.ico-deed i:nth-child(2){left:8px;right:8px;top:9px;height:2px;background:#8c7d73}
.ico-deed i:nth-child(3){left:8px;right:12px;top:15px;height:2px;background:#8c7d73}
.av-side{position:sticky;top:calc(${NAV} + 14px)}
.av-panel{border:1px solid var(--av-soot);background:rgba(9,7,7,.92)}
.av-panel h3{margin:0;padding:11px 14px;background:var(--av-ember);color:var(--av-char);font:700 11px/1 'Oswald',sans-serif;letter-spacing:.28em;text-transform:uppercase}
.av-section{padding:16px 14px 8px}
.av-cut{position:relative;height:150px;background:#0a0807;border:1px solid var(--av-soot);overflow:hidden}
.av-cut .roof{position:absolute;left:0;right:0;top:0;height:26px;background:repeating-linear-gradient(72deg,#2b2320 0 6px,#0f0c0b 6px 12px)}
.av-props{position:absolute;left:8px;right:8px;top:26px;height:56px;display:flex;justify-content:space-between}
.av-props b{display:block;width:6px;height:100%;background:#3a322d;position:relative;transition:background .45s ease,box-shadow .45s ease}
.av-props b.up{background:var(--av-ember);box-shadow:0 0 10px rgba(226,96,28,.5)}
.av-props b.down{background:var(--av-red);transform:rotate(14deg);transform-origin:bottom}
.av-tunnel{position:absolute;left:8px;right:8px;bottom:22px;height:16px;border:1px solid var(--av-smoke);background:#050404;overflow:hidden}
.av-tunnel i{position:absolute;left:0;top:2px;bottom:2px;width:8%;background:linear-gradient(90deg,transparent,var(--av-ember));transition:left .7s ease}
.av-flue{position:absolute;right:34px;bottom:38px;width:14px;height:44px;border:1px dashed #3a322d;background:#050404;transition:.5s}
.av-flue.lit{border:1px solid var(--av-shield);background:rgba(240,192,74,.12);box-shadow:0 0 16px rgba(240,192,74,.35)}
.av-flue.lit::after{content:'';position:absolute;left:4px;top:8px;width:6px;height:6px;border-radius:50%;background:var(--av-shield);box-shadow:0 0 10px var(--av-shield)}
.av-cutlabel{display:flex;justify-content:space-between;font-family:'Courier Prime',monospace;font-size:10.5px;letter-spacing:.1em;color:#6c6058;margin-top:6px;text-transform:uppercase}
.av-rows{padding:6px 14px 4px}
.av-row{display:flex;justify-content:space-between;align-items:baseline;padding:5px 0;border-bottom:1px dotted var(--av-soot);font-size:13.5px;color:#98897f}
.av-row b{color:var(--av-bone);font-family:'Courier Prime',monospace}
.av-row.team b{color:var(--av-ember);font-family:'Oswald',sans-serif;font-weight:500;font-size:16px}
.av-shieldbox{margin:12px 14px 0;padding:12px;border:1px solid var(--av-soot);background:#050404;text-align:center;transition:.5s}
.av-shieldbox .lbl{font-size:10.5px;letter-spacing:.28em;text-transform:uppercase;color:#6c6058}
.av-shieldbox .val{font-family:'Courier Prime',monospace;font-size:15px;color:#4b423c;margin-top:5px}
.av-shieldbox.on{border-color:var(--av-shield);background:rgba(240,192,74,.08)}
.av-shieldbox.on .lbl{color:var(--av-shield)}
.av-shieldbox.on .val{color:var(--av-bone)}
.av-shieldbox .cost{font-size:11.5px;color:#8c7d73;margin-top:7px;letter-spacing:.06em}
.av-pot{padding:12px 14px 16px;border-top:1px solid var(--av-soot);margin-top:12px}
.av-pot .r{display:flex;justify-content:space-between;font-size:13px;color:#98897f}
.av-pot .r b{color:var(--av-bone);font-family:'Courier Prime',monospace}
.av-pot .big{font-family:'Oswald',sans-serif;font-weight:700;font-size:32px;color:var(--av-ember);margin-top:7px;letter-spacing:.01em}
.av-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;background:linear-gradient(180deg,rgba(20,16,14,.15),#0a0807 45%);border-top:1px solid var(--av-ember-lo);padding:14px 18px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}
.av-btn{font:500 12px/1 'Oswald',sans-serif;letter-spacing:.22em;text-transform:uppercase;padding:13px 26px;background:transparent;color:var(--av-ember);border:1px solid var(--av-ember);cursor:pointer;transition:.2s}
.av-btn:hover{background:var(--av-ember);color:var(--av-char)}
.av-btn.ghost{color:#8c7d73;border-color:var(--av-smoke)}
.av-btn[disabled]{opacity:.32;cursor:default}
.av-counter{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#8c7d73;min-width:160px;text-align:center;font-variant-numeric:tabular-nums}
.av-summary{margin-top:32px;padding:24px;border:1px solid var(--av-soot);background:linear-gradient(155deg,rgba(43,35,32,.85),rgba(11,9,8,.9));font-size:20px;line-height:1.5;color:var(--av-bone)}
.av-summary small{display:block;font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--av-ember);margin-bottom:9px}
@media(prefers-reduced-motion:reduce){.av-root *,.av-root *::before,.av-root *::after{animation:none !important;transition:none !important}.av-card{opacity:1;transform:none}.av-ash{display:none}}
`,
};

export const THEMES = [CAUSEWAY, ORRERY, ACCOUNT, VAULT];
