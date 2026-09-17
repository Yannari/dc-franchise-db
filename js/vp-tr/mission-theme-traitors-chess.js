// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-theme-traitors-chess.js — marble and candlelight
// ══════════════════════════════════════════════════════════════════════
//
// The Traitors' Chess THEME for js/vp-tr/mission-bespoke.js, reproducing the
// approved mockup (mockup/mockup-tr-traitors-chess.html): the board seen from
// above with a face on every square, the hooded statue, five pieces, a
// five-question tracker and the Gambit box.
//
// THE SIDEBAR KNOWS ONLY WHAT HAS BEEN SHOWN. A piece lands when the card that
// argues its question is revealed, and falls (gold) or leaves the statue on the
// true square (red) on the card that shows the statue moving.
import { players } from '../core.js';
import { playerAvatarUrl } from '../players.js';

const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const _cap = s => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');
const _gbp = n => '£' + Number(n || 0).toLocaleString('en-GB');
const _url = name => playerAvatarUrl((players || []).find(p => p && p.name === name) || { name });
const _face = name => '<img class="tc-av" src="' + _esc(_url(name)) + '" alt="' + _esc(name) + '" title="'
  + _esc(name) + '" onerror="this.style.visibility=&quot;hidden&quot;">';

const PIECES = {
  wolf: '<path d="M8 32h20l-2-6H10z M10 26c0-6 2-10 4-12l-3-8 6 5 3-6 2 7 5-2-3 7c2 2 3 6 3 9z" fill="#5f8a78" stroke="#efe9dc" stroke-width="1"/><circle cx="16" cy="17" r="1.2" fill="#efe9dc"/>',
  fox: '<path d="M8 32h20l-2-6H10z M11 26c0-5 1-9 3-12L10 5l7 6h2l7-6-4 9c2 3 3 7 3 12z" fill="#b8733c" stroke="#efe9dc" stroke-width="1"/><path d="M15 20l3 3 3-3" stroke="#efe9dc" fill="none"/>',
  owl: '<path d="M8 32h20l-2-6H10z M11 26c-1-8 1-16 7-18 6 2 8 10 7 18z" fill="#7d7a70" stroke="#efe9dc" stroke-width="1"/><circle cx="15" cy="15" r="2.6" fill="#efe9dc"/><circle cx="21" cy="15" r="2.6" fill="#efe9dc"/><circle cx="15" cy="15" r="1" fill="#0b0b0d"/><circle cx="21" cy="15" r="1" fill="#0b0b0d"/>',
  lamb: '<path d="M8 32h20l-2-6H10z M10 26c-2-4 0-8 3-9-1-4 3-7 6-5 3-2 7 1 6 5 3 1 5 5 3 9z" fill="#efe9dc" stroke="#7d7a70" stroke-width="1"/><circle cx="16" cy="18" r="1" fill="#0b0b0d"/><circle cx="20" cy="18" r="1" fill="#0b0b0d"/>',
  crown: '<path d="M8 32h20l-2-6H10z M10 26l-2-14 6 6 4-10 4 10 6-6-2 14z" fill="#d8b25a" stroke="#efe9dc" stroke-width="1"/><circle cx="18" cy="8" r="1.8" fill="#efe9dc"/>',
};
const ICONS = {
  debate: '<path d="M4 8h18v12H12l-6 5v-5H4z" fill="#8a7fb0"/><path d="M14 16h18v12h-2v5l-6-5H14z" fill="#efe9dc" opacity=".85"/>',
  right: '<circle cx="18" cy="18" r="15" fill="none" stroke="#d8b25a" stroke-width="2"/><path d="M10 18l6 6 10-12" fill="none" stroke="#d8b25a" stroke-width="3"/>',
  wrong: '<circle cx="18" cy="18" r="15" fill="none" stroke="#c0443a" stroke-width="2"/><path d="M12 12l12 12M24 12L12 24" stroke="#c0443a" stroke-width="3"/>',
  gambit: '<path d="M18 3l12 4v9c0 8-5 14-12 17C11 30 6 24 6 16V7z" fill="#f0cf62" stroke="#7b6224" stroke-width="1.2"/><path d="M12 22h12l-1-3H13z M14 19c0-4 1-6 2-7l-1-4 3 2 3-2-1 4c1 1 2 3 2 7z" fill="#7b6224"/>',
  eye: '<path d="M2 18c6-9 26-9 32 0-6 9-26 9-32 0z" fill="none" stroke="#8a7fb0" stroke-width="2"/><circle cx="18" cy="18" r="5" fill="#8a7fb0"/>',
};

/** Stream steps: where each question's piece lands and where the statue answers. */
function _steps(v) {
  const qs = v.tally.questions || [];
  const cards = [];
  for (const p of v.phases) for (const c of p.cards) cards.push(c);
  return qs.map(q => {
    let placed = -1, revealed = -1;
    cards.forEach((c, i) => {
      if (placed < 0 && (c.text || '').startsWith('“' + q.ask + '”')) placed = i;
    });
    if (placed >= 0) {
      if (q.gambit) revealed = placed;
      else {
        for (let i = placed + 1; i < cards.length; i++) {
          const t = cards[i].text || '';
          // The statue's card follows its question's card; the reveal line
          // does not always name the piece.
          if (/statue/i.test(t) && !t.startsWith('“')) { revealed = i; break; }
        }
      }
    }
    return { ...q, placed, revealed };
  });
}

export const CHESS = {
  id: 'traitors-chess', prefix: 'tc', ownShield: true,
  shieldBeat: /Once, and only once|Shield is yours/,
  rootVars: '',
  nextLabel: 'Next', allLabel: 'Reveal all', revealedWord: 'revealed', sheetBrief: false,
  title: () => '<h1 class="tc-title">The Traitors\' <span>Chess</span></h1>',
  sub: () => 'Last night the Traitors answered five questions about every one of you. Today you guess what they said, on a board with your names on it.',
  chips: v => [
    { text: 'One room · ' + (v.tally.board || []).length + ' players' },
    { text: 'Five questions' },
    { text: 'Money for every right answer' },
    v.tally.offered === false ? { text: 'No Shield today' } : { text: 'The Gambit · a Shield for one answer alone', shield: true },
  ],
  phaseNum: roman => '<span class="tc-phase-n"><b>' + roman + '</b></span>',
  cardClass: c => (c.relic ? 'relic'
    : c.kind === 'right' ? 'right' : c.kind === 'wrong' ? 'wrongq'
      : (c.isSocial ? 'social ' : '') + (c.tone === 'bad' ? 'bad' : c.tone === 'good' ? 'good' : 'plain')),
  cardTag: c => (c.relic ? 'The Gambit'
    : c.kind === 'right' ? 'Right' : c.kind === 'wrong' ? 'Wrong'
      : c.kind === 'strong' ? 'Made the case' : c.kind === 'weak' ? 'Talked round'
        : c.isSocial ? _cap(c.behaviour || 'moment') : _cap(c.kind)),
  icon: c => {
    const ic = c.relic ? 'gambit' : c.kind === 'right' ? 'right' : c.kind === 'wrong' ? 'wrong'
      : c.behaviour === 'suspicious' ? 'eye' : 'debate';
    return '<span class="tc-ico"><svg viewBox="0 0 36 36" aria-hidden="true">' + ICONS[ic] + '</svg></span>';
  },

  sidebar(v, n, states) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))] || states[0];
    const board = v.tally.board || [];
    const qs = v.tally.questions || [];
    const sh = v.shield || {};
    const squares = board.map((name, i) => {
      const cls = [s.truth.includes(name) ? 'truth' : '', s.gambitSq === name ? 'gambit' : ''].join(' ');
      const pieces = qs.map(q => {
        const st = s.piece[q.piece];
        const on = st && st.on === name;
        return '<svg class="piece' + (on ? ' on' : '') + (on && st.fell ? ' fell' : '') + '" viewBox="0 0 36 36" data-piece="' + q.piece
          + '" data-sq="' + _esc(name) + '">' + PIECES[q.piece] + '</svg>';
      }).join('');
      const shade = ((Math.floor(i / 4) + i) % 2) ? 'dark' : 'light';
      return '<div class="tc-sq ' + shade + ' ' + cls + '" data-name="' + _esc(name) + '">' + _face(name)
        + '<small>' + _esc(name) + '</small>' + pieces + '</div>';
    }).join('');
    const track = qs.map(q => '<div class="tc-slot ' + (s.slot[q.piece] || '') + '" data-slot="' + q.piece + '">'
      + '<svg viewBox="0 0 36 36">' + PIECES[q.piece] + '</svg><small>' + _esc(q.label) + '</small></div>').join('');
    return '<div class="tc-panel"><h3>The Board</h3>'
      + '<svg class="tc-statue" viewBox="0 0 70 74" aria-hidden="true">'
      + '<path d="M35 4c10 0 16 8 16 18v8l8 38H11l8-38v-8C19 12 25 4 35 4z" fill="#2f4a40" stroke="#5f8a78" stroke-width="1.5"/>'
      + '<path d="M35 10c7 0 11 6 11 13v6H24v-6c0-7 4-13 11-13z" fill="#0b0b0d"/>'
      + '<circle cx="31" cy="22" r="1.4" fill="#c0443a"/><circle cx="39" cy="22" r="1.4" fill="#c0443a"/>'
      + '<path d="M11 68h48v4H11z" fill="#7b6224"/></svg>'
      + '<div class="tc-board">' + squares + '</div>'
      + '<div class="tc-track">' + track + '</div>'
      + (v.tally.offered === false ? '' : '<div class="tc-gambit' + (s.won ? ' on' : '') + '">'
        + '<div class="lbl">The Gambit</div>'
        + (sh.holder ? '<div class="holder">' + _face(sh.holder) + '</div>' : '')
        + '<div class="val">' + _esc(s.gambitVal) + '</div></div>')
      + '<div class="tc-pot">'
      + '<div class="r"><span>Fund before</span><b>' + _gbp(v.potBefore) + '</b></div>'
      + '<div class="r"><span>Right answers</span><b class="tc-right">' + s.right + ' of 5</b></div>'
      + '<div class="r"><span>Earned today</span><b>' + (s.done ? _gbp(v.earned) : '&mdash;') + '</b></div>'
      + '<div class="big">' + _gbp(v.potBefore + (s.done ? v.earned : 0)) + '</div></div></div>';
  },

  sideStates(v, total) {
    const steps = _steps(v);
    const sh = v.shield || {};
    const out = [];
    for (let n = 0; n <= total; n++) {
      const piece = {};
      const slot = {};
      const truth = [];
      let right = 0;
      let gambitSq = null;
      for (const q of steps) {
        if (q.placed >= 0 && n > q.placed) {
          piece[q.piece] = { on: q.guess, fell: false };
          if (q.gambit) gambitSq = q.guess;
        }
        if (q.revealed >= 0 && n > q.revealed) {
          if (q.right) { right++; piece[q.piece] = { on: q.guess, fell: true }; slot[q.piece] = 'right'; }
          else { truth.push(q.truth); slot[q.piece] = 'wrong'; }
        }
      }
      const g = steps.find(q => q.gambit);
      const seen = g && g.placed >= 0 && n > g.placed;
      out.push({ piece, slot, truth, right, gambitSq, done: n >= total,
        won: !!(seen && sh.found),
        gambitVal: !g ? 'nobody stepped onto the board'
          : !seen ? 'nobody has stepped onto the board'
            : sh.found ? sh.holder + ' · answered alone, and won' : g.by + ' · answered alone, and lost the money' });
    }
    return out;
  },

  paintSide(prefix, states, n) {
    const s = states[Math.max(0, Math.min(states.length - 1, n))]; if (!s) return;
    const panel = document.querySelector('.tc-panel'); if (!panel) return;
    panel.querySelectorAll('.tc-sq').forEach(sq => {
      const name = sq.getAttribute('data-name');
      sq.classList.toggle('truth', s.truth.includes(name));
      sq.classList.toggle('gambit', s.gambitSq === name);
    });
    panel.querySelectorAll('.piece').forEach(p => {
      const st = s.piece[p.getAttribute('data-piece')];
      const on = !!st && st.on === p.getAttribute('data-sq');
      p.setAttribute('class', 'piece' + (on ? ' on' : '') + (on && st.fell ? ' fell' : ''));
    });
    panel.querySelectorAll('.tc-slot').forEach(sl => { sl.className = 'tc-slot ' + (s.slot[sl.getAttribute('data-slot')] || ''); });
    const g = panel.querySelector('.tc-gambit');
    if (g) { g.classList.toggle('on', s.won); g.querySelector('.val').textContent = s.gambitVal; }
    const r = panel.querySelector('.tc-right'); if (r) r.textContent = s.right + ' of 5';
  },

  atmosphere: () => '<div class="tc-hall"></div><div class="tc-floor"></div><div class="tc-candles"></div>',

  css: `
@import url('https://fonts.googleapis.com/css2?family=Marcellus&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Sometype+Mono:wght@400;600&display=swap');
.tc-root{--tc-ivory:#efe9dc;--tc-bronze:#5f8a78;--tc-gilt:#d8b25a;--tc-gilt-lo:#7b6224;--tc-wrong:#c0443a;--tc-mist:#a7a39a;--tc-shield:#f0cf62;
  --cv-display:'Marcellus',serif;
  background:#0b0b0d;color:var(--tc-mist);font-family:'EB Garamond',Georgia,serif;font-size:19px;line-height:1.5;padding-bottom:120px;position:relative;overflow:hidden}
.tc-scenery{position:fixed;left:0;right:0;top:46px;bottom:0;overflow:hidden;pointer-events:none;z-index:0}
.tc-hall{position:absolute;inset:0;background:radial-gradient(50% 40% at 50% 0%,rgba(216,178,90,.12),transparent 70%),linear-gradient(180deg,#141418,#0b0b0d 60%)}
.tc-floor{position:absolute;left:-20%;right:-20%;bottom:-10%;height:55%;opacity:.14;background:conic-gradient(var(--tc-ivory) 25%,transparent 0 50%,var(--tc-ivory) 0 75%,transparent 0) 0 0/120px 120px;transform:perspective(420px) rotateX(62deg);transform-origin:bottom}
.tc-candles{position:absolute;inset:0;background:radial-gradient(6px 10px at 8% 30%,rgba(255,214,120,.9),transparent),radial-gradient(40px 60px at 8% 30%,rgba(255,190,90,.12),transparent),radial-gradient(6px 10px at 92% 34%,rgba(255,214,120,.9),transparent),radial-gradient(40px 60px at 92% 34%,rgba(255,190,90,.12),transparent);animation:tc-flicker 3s ease-in-out infinite}
@keyframes tc-flicker{0%,100%{opacity:.85}45%{opacity:1}60%{opacity:.7}}
.tc-shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:26px 16px 40px}
.tc-body{position:relative;z-index:2}
.tc-hero{position:relative;padding:32px 26px 24px;text-align:center;overflow:hidden;border:1px solid var(--tc-gilt-lo);
  background:linear-gradient(115deg,transparent 40%,rgba(207,200,184,.08) 42%,transparent 46%),linear-gradient(65deg,transparent 60%,rgba(207,200,184,.06) 61%,transparent 64%),linear-gradient(180deg,#1f1f24,#0f0f12);
  box-shadow:inset 0 0 0 6px #0b0b0d,inset 0 0 0 7px var(--tc-gilt-lo),0 20px 50px rgba(0,0,0,.6)}
.tc-kicker{font:12px/1 'Sometype Mono',monospace;letter-spacing:.32em;text-transform:uppercase;color:var(--tc-bronze)}
.tc-title{font-family:'Marcellus',serif;font-weight:400;color:var(--tc-ivory);font-size:clamp(40px,8vw,86px);line-height:1;margin:.14em 0 .1em;letter-spacing:.02em}
.tc-title span{color:var(--tc-gilt)}
.tc-sub{color:#9c978d;max-width:58ch;margin:0 auto;font-style:italic}
.tc-meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:16px}
.tc-chip{font:11px/1 'Sometype Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--tc-ivory);border:1px solid #3a3a40;padding:6px 11px;background:rgba(0,0,0,.4)}
.tc-chip.shield{border-color:var(--tc-shield);color:var(--tc-shield)}
.tc-hero .mb-roster{justify-content:center;text-align:left}
.tc-hero .mb-rname{font-family:'Sometype Mono',monospace;color:var(--tc-bronze)}
.tc-av{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 20%;background:#1f1f24;border:2px solid #3a3a40;box-shadow:0 2px 8px rgba(0,0,0,.6);display:inline-block;vertical-align:middle}
.tc-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;margin-top:24px;align-items:start}
@media(max-width:940px){.tc-grid{grid-template-columns:minmax(0,1fr)}}
.tc-brief{background:rgba(15,15,18,.92);border:1px solid #26262b;border-top:3px solid var(--tc-gilt);padding:20px 20px 16px}
.tc-brief h2,.tc-phase-name{font-family:'Marcellus',serif;font-weight:400;color:var(--tc-ivory)}
.tc-brief h2{font-size:30px;margin:0}
.tc-staging{font-style:italic;color:#8c887f;border-bottom:1px solid #26262b;padding-bottom:12px;margin:8px 0 14px}
.tc-beat{margin:0 0 11px}
.tc-beat p{margin:0}
.tc-beat.do p{font:14.5px/1.5 'Sometype Mono',monospace;color:#7a766d}
.tc-beat.say p{color:var(--tc-ivory);padding-left:14px;border-left:1px solid var(--tc-gilt-lo)}
.tc-beat.shield p{border-left:2px solid var(--tc-shield);color:#fbe9b6}
.tc-rules{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.tc-rule{font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#8c887f;border:1px solid #2e2e34;padding:5px 8px}
.tc-rule b{color:var(--tc-gilt);font-weight:600;margin-right:4px}
.tc-phase{margin-top:28px}
.tc-phase-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:6px;border-bottom:1px solid #26262b}
.tc-phase-n{width:34px;height:34px;display:grid;place-items:center;font:600 14px/1 'Sometype Mono',monospace;color:#0b0b0d;background:conic-gradient(var(--tc-ivory) 25%,#2a2a30 0 50%,var(--tc-ivory) 0 75%,#2a2a30 0) 0 0/17px 17px;border:1px solid var(--tc-gilt-lo)}
.tc-phase-n b{background:var(--tc-gilt);padding:2px 5px}
.tc-phase-name{font-size:32px;line-height:1}
.tc-phase-stats{margin-left:auto;display:flex;gap:6px}
.tc-stat{font:10.5px/1 'Sometype Mono',monospace;font-style:normal;text-transform:uppercase;letter-spacing:.12em;color:#bdb8ad;background:#1a1a1f;padding:5px 8px}
.tc-setting{font-style:italic;color:#8c887f;margin:8px 0 12px}
.tc-card{position:relative;margin:0 0 12px;padding:14px 16px 13px 66px;background:linear-gradient(120deg,transparent 45%,rgba(207,200,184,.04) 47%,transparent 50%),linear-gradient(180deg,#1b1b20,#121215);border:1px solid #2a2a30;opacity:0;transform:translateY(-14px) scale(1.02);transition:opacity .35s ease,transform .45s cubic-bezier(.3,1.4,.5,1)}
.tc-card.on{opacity:1;transform:none}
.tc-card.good{border-left:3px solid var(--tc-bronze)}
.tc-card.bad{border-left:3px solid var(--tc-wrong)}
.tc-card.social{border-left:3px solid #8a7fb0}
.tc-card.right{border:1px solid var(--tc-gilt);box-shadow:0 0 18px rgba(216,178,90,.12)}
.tc-card.wrongq{border:1px solid var(--tc-wrong)}
.tc-card.relic{border:1px solid var(--tc-shield);box-shadow:0 0 24px rgba(240,207,98,.18)}
.tc-ico{position:absolute;left:14px;top:14px;width:38px;height:38px}
.tc-ico svg{width:100%;height:100%;display:block}
.tc-tag{float:right;font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#8c887f;margin:4px 0 0 10px}
.tc-card.good .tc-tag,.tc-card.right .tc-tag{color:var(--tc-gilt)}.tc-card.bad .tc-tag,.tc-card.wrongq .tc-tag{color:#e0766c}.tc-card.relic .tc-tag{color:var(--tc-shield)}
.tc-who{font-weight:600;color:var(--tc-ivory);letter-spacing:.02em}
.tc-card .mb-avs .cv-av{width:34px;height:34px;border:2px solid #3a3a40}
.tc-card.right .cv-av,.tc-card.relic .cv-av{border-color:var(--tc-gilt)}.tc-card.wrongq .cv-av,.tc-card.bad .cv-av{border-color:var(--tc-wrong)}
.tc-txt{margin-top:4px}
.tc-conf{margin-top:10px;padding:9px 12px;background:rgba(0,0,0,.35);border-left:2px solid #8a7fb0;font-style:italic;color:#ddd8cc}
.tc-conf small{display:block;font:10.5px/1.4 'Sometype Mono',monospace;font-style:normal;letter-spacing:.14em;text-transform:uppercase;color:#a79cd0}
.tc-fx{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.tc-fx span{font:10.5px/1 'Sometype Mono',monospace;color:#bdb8ad;border:1px solid #2e2e34;padding:4px 7px}
.tc-summary{margin-top:24px;padding:18px 20px;border:1px solid var(--tc-gilt-lo);background:rgba(15,15,18,.95);transition:opacity .4s}
.tc-summary small{display:block;font:10.5px/1.4 'Sometype Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--tc-gilt);margin-bottom:4px}
.tc-side{position:sticky;top:60px}
.tc-panel{background:rgba(10,10,12,.96);border:1px solid #26262b;padding:14px}
.tc-panel h3{font:400 26px/1 'Marcellus',serif;color:var(--tc-ivory);margin:0 0 10px;text-align:center;letter-spacing:.06em}
.tc-statue{display:block;width:70px;height:74px;margin:0 auto -6px;position:relative;z-index:2}
.tc-board{display:grid;grid-template-columns:repeat(4,1fr);border:3px solid var(--tc-gilt-lo);box-shadow:0 0 0 1px #000,0 10px 30px rgba(0,0,0,.6)}
.tc-sq{position:relative;aspect-ratio:1;display:grid;place-items:center;transition:box-shadow .5s}
.tc-sq.light{background:linear-gradient(135deg,#efe9dc,#d8d1c1)}
.tc-sq.dark{background:linear-gradient(135deg,#26262c,#131316)}
.tc-sq .tc-av{width:38px;height:38px}
.tc-sq small{position:absolute;bottom:2px;left:0;right:0;text-align:center;font:9px/1 'Sometype Mono',monospace;color:#8c887f;text-shadow:0 1px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tc-sq .piece{position:absolute;top:-8px;right:-8px;width:34px;height:34px;opacity:0;transform:translateY(-18px);transition:all .45s cubic-bezier(.3,1.5,.5,1);filter:drop-shadow(0 3px 3px rgba(0,0,0,.7));pointer-events:none}
.tc-sq .piece.on{opacity:1;transform:none}
.tc-sq .piece.fell{transform:rotate(80deg) translate(4px,-4px);filter:sepia(1) saturate(5) brightness(1.1) drop-shadow(0 0 6px rgba(216,178,90,.9))}
.tc-sq.truth{box-shadow:inset 0 0 0 3px var(--tc-wrong)}
.tc-sq.gambit{box-shadow:inset 0 0 0 3px var(--tc-shield)}
.tc-track{display:flex;justify-content:space-between;gap:6px;margin-top:14px}
.tc-slot{flex:1;text-align:center;padding:6px 2px;border:1px solid #2a2a30;background:rgba(0,0,0,.35);transition:all .4s}
.tc-slot svg{width:24px;height:24px;display:block;margin:0 auto}
.tc-slot small{display:block;font:9.5px/1.2 'Sometype Mono',monospace;color:#6b675f;margin-top:3px;text-transform:uppercase}
.tc-slot.right{border-color:var(--tc-gilt)}.tc-slot.right small{color:var(--tc-gilt)}
.tc-slot.wrong{border-color:var(--tc-wrong)}.tc-slot.wrong small{color:#e0766c}
.tc-gambit{margin-top:12px;padding:11px 12px;border:1px dashed #6b5b2a;text-align:center;transition:all .5s}
.tc-gambit .lbl{font:10.5px/1 'Sometype Mono',monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a7a4a}
.tc-gambit .val{margin-top:6px;font-style:italic;color:#8c887f}
.tc-gambit .holder{display:none;margin:8px auto 0}
.tc-gambit .holder .tc-av{width:44px;height:44px;border-color:var(--tc-shield);box-shadow:0 0 14px rgba(240,207,98,.45)}
.tc-gambit.on{border:1px solid var(--tc-shield)}
.tc-gambit.on .holder{display:block}
.tc-gambit.on .lbl,.tc-gambit.on .val{color:var(--tc-shield);font-style:normal}
.tc-pot{margin-top:12px;border-top:1px solid #26262b;padding-top:10px}
.tc-pot .r{display:flex;justify-content:space-between;font-size:16px;color:#8c887f}
.tc-pot .r b{font:13px/1.7 'Sometype Mono',monospace;color:var(--tc-ivory);font-weight:400}
.tc-pot .big{font:30px/1.1 'Sometype Mono',monospace;color:var(--tc-gilt);text-align:right;margin-top:4px}
.tc-controls{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:linear-gradient(0deg,#060607 60%,rgba(6,6,7,0))}
.tc-btn{font:600 16px/1 'EB Garamond',serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;padding:12px 26px;color:#0b0b0d;background:linear-gradient(180deg,#f2dc98,var(--tc-gilt));border:1px solid var(--tc-gilt-lo)}
.tc-btn[disabled]{opacity:.4;cursor:default}
.tc-btn.ghost{background:transparent;color:var(--tc-ivory);border:1px solid #3a3a40}
.tc-counter{font:12px/1 'Sometype Mono',monospace;color:#7a766d;letter-spacing:.1em}
@media(prefers-reduced-motion:reduce){.tc-root *,.tc-root *::before,.tc-root *::after{animation:none !important;transition:none !important}.tc-card{opacity:1;transform:none}}
`,
};

export default CHESS;
