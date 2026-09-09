// ══════════════════════════════════════════════════════════════════════
// vp-dr/smackdown.js — the bracket, drawn as a bracket
// ══════════════════════════════════════════════════════════════════════
//
// Shared between the reunion Smackdown (eliminated queens, no stakes) and
// the LaLaPaRuZa (active queens, someone goes home). Both are lip sync
// tournaments and both render the same way: a bracket that fills in as
// you reveal it, round by round, with losers greying out.
//
// THE LALAPARUZA IS A LOSERS' BRACKET. Round 1 winners sit safe; losers
// pair up again in Round 2; Round 2 losers face sudden death in Round 3.
// The smackdown is a standard elimination bracket. The visual language is
// the same; the data shape is slightly different.
import { _shell, _portrait } from './style.js';
import { _controls } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ── SHARED CSS ────────────────────────────────────────────────────────
export const SMACKDOWN_CSS = `
.sd-wrap{--sd-gold:#FFC83D;--sd-dead:#4a2a3c;--sd-fire:#FF294B;--sd-safe:#39E88B}
.sd-bracket + .dr-step{margin-top:22px}
.sd-hero{text-align:center;padding:10px 0 18px}
.sd-hero .sd-title{font-size:11px;letter-spacing:.3em;color:var(--sd-gold)}
.sd-hero h2{margin:6px 0 4px;font-size:30px;line-height:1.05}
.sd-hero p{margin:0;color:#C9A6BC;font-size:13px}

/* The bracket: one column per round, matches stacked inside. */
.sd-bracket{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(160px,1fr);
  gap:14px;align-items:center;overflow-x:auto;padding:6px 2px 14px}
.sd-round{display:flex;flex-direction:column;justify-content:space-around;gap:10px;min-height:100%}
.sd-round-label{font-size:9px;letter-spacing:.24em;color:#b892a8;text-align:center;
  padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.09);margin-bottom:6px}
.sd-match{border:1px solid var(--dr-line);background:var(--dr-panel);
  border-radius:3px;overflow:hidden;transition:opacity .25s}
.sd-match:not(.on) .sd-side,.sd-match:not(.on) .sd-song{visibility:hidden}
.sd-match:not(.on){opacity:.5;border-style:dashed}
.sd-song{font-size:9.5px;letter-spacing:.06em;color:#b892a8;padding:5px 8px 3px;
  border-bottom:1px solid rgba(255,255,255,.07);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis}
.sd-side{display:grid;grid-template-columns:26px 1fr auto;gap:7px;align-items:center;
  padding:6px 8px;font-size:12.5px}
.sd-side + .sd-side{border-top:1px solid rgba(255,255,255,.06)}
.sd-side b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sd-side .sd-sc{font-variant-numeric:tabular-nums;color:#C9A6BC;font-size:11px}
.sd-win{background:linear-gradient(90deg,rgba(255,200,61,.14),transparent)}
.sd-win b{color:var(--sd-gold)}
.sd-lose b,.sd-lose .sd-sc{color:var(--sd-dead)}
.sd-lose .dr-por,.sd-lose .dr-initials{filter:grayscale(1) brightness(.5)}

/* Fatigue bar. A thin strip under the score showing how tired she is. */
.sd-fat{height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:2px;
  overflow:hidden;width:40px}
.sd-fat-fill{height:100%;border-radius:2px;transition:width .3s}
.sd-fat-ok{background:var(--sd-safe)}
.sd-fat-mid{background:var(--sd-gold)}
.sd-fat-low{background:var(--sd-fire)}

/* The champion's plinth at the end of the row. */
.sd-champ{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:14px 10px;border:1px solid var(--sd-gold);border-radius:3px;
  background:linear-gradient(180deg,rgba(255,200,61,.14),transparent);
  transition:opacity .3s}
.sd-champ:not(.on) > *{visibility:hidden}
.sd-champ:not(.on){opacity:.5;border-style:dashed}
.sd-champ .sd-name{font-size:17px;color:var(--sd-gold)}
.sd-champ .sd-belt{font-size:9px;letter-spacing:.18em;color:#e3cfdd;text-align:center;
  text-wrap:balance}

/* The eliminated queen, for LaLaPaRuZa. */
.sd-elim{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:14px 10px;border:1px solid var(--sd-fire);border-radius:3px;
  background:linear-gradient(180deg,rgba(255,41,75,.14),transparent);
  transition:opacity .3s}
.sd-elim:not(.on) > *{visibility:hidden}
.sd-elim:not(.on){opacity:.5;border-style:dashed}
.sd-elim .sd-name{font-size:17px;color:var(--sd-fire)}
.sd-elim .sd-label{font-size:9px;letter-spacing:.18em;color:#e3cfdd;text-align:center}

/* Round result badges */
.sd-badge{font-size:8px;letter-spacing:.12em;padding:2px 6px;border-radius:2px;
  text-align:center;margin-top:2px}
.sd-badge-safe{background:rgba(57,232,139,.15);color:var(--sd-safe)}
.sd-badge-low{background:rgba(255,200,61,.15);color:var(--sd-gold)}
.sd-badge-danger{background:rgba(255,41,75,.15);color:var(--sd-fire)}

.dr-scene{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:15px 18px 15px 22px}
.dr-scene:not(:has(.dr-who)){grid-template-columns:1fr}
.dr-who{display:flex;gap:7px}
.dr-scene-body{color:#f4e3ed;font-size:15px;line-height:1.6;max-width:74ch;
  text-wrap:pretty}
@media(prefers-reduced-motion:reduce){.sd-match,.sd-champ,.sd-elim{transition:none}}
`;

// ── HELPERS ──────────────────────────────────────────────────────────

function fatigueBar(factor) {
  const pct = Math.round(factor * 100);
  const cls = pct >= 85 ? 'sd-fat-ok' : pct >= 70 ? 'sd-fat-mid' : 'sd-fat-low';
  return `<div class="sd-fat"><div class="sd-fat-fill ${cls}" style="width:${pct}%"></div></div>`;
}

function side(name, ep, score, won, fatFactor) {
  const hasFatigue = fatFactor != null && fatFactor < 1.0;
  return `<div class="sd-side ${won ? 'sd-win' : 'sd-lose'}">
    ${_portrait(name, ep, { size: 26 })}
    <b>${esc(name)}</b>
    <span class="sd-sc">
      ${Number(score ?? 0).toFixed(1)}
      ${hasFatigue ? fatigueBar(fatFactor) : ''}
    </span>
  </div>`;
}

// ── SMACKDOWN (reunion bracket) ──────────────────────────────────────

/**
 * The smackdown, as a bracket.
 *
 * Reveals per DUEL, which is the unit a tournament is watched in: each click
 * fills one match and greys the queen who lost it. The champion's plinth
 * lights only when the last duel has been read.
 */
export function rpBuildSmackdown(row) {
  const sd = row?.dr?.smackdown;
  if (!sd?.duels?.length) return '';
  const ep = row;
  const scenes = (row.dr.scenes || []).filter(s => s.kind === 'smackdown-duel');
  const open = (row.dr.scenes || []).find(s => s.kind === 'smackdown-open');
  const crown = (row.dr.scenes || []).find(s => s.kind === 'smackdown-crown');

  const rounds = [...new Set(sd.duels.map(d => d.round))].sort((a, b) => a - b);
  const nameOf = n => (n === rounds.length ? 'FINAL'
    : n === rounds.length - 1 ? 'SEMI-FINALS' : `ROUND ${n}`);

  const idxOf = new Map(sd.duels.map((d, i) => [d, i]));

  const bracket = rounds.map(rn => `<div class="sd-round">
      <div class="sd-round-label">${nameOf(rn)}</div>
      ${sd.duels.filter(d => d.round === rn).map(d => `
        <div class="sd-match" id="sd-match-${idxOf.get(d)}">
          <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
          ${side(d.a, ep, d.adjusted?.[d.a] ?? d.scores?.[d.a], d.winner === d.a, d.fatigue?.[d.a])}
          ${side(d.b, ep, d.adjusted?.[d.b] ?? d.scores?.[d.b], d.winner === d.b, d.fatigue?.[d.b])}
        </div>`).join('')}
    </div>`).join('')
    + `<div class="sd-round"><div class="sd-round-label">CHAMPION</div>
        <div class="sd-champ" id="sd-champ">
          ${_portrait(sd.winner, ep, { size: 84, station: true })}
          <div class="sd-name dr-disp">${esc(sd.winner || '—')}</div>
          <div class="sd-belt">${esc(sd.title || '')}</div>
        </div></div>`;

  const lead = `<div class="sd-hero">
      <div class="sd-title dr-disp">The Lip Sync Smackdown</div>
      <h2 class="dr-disp">${sd.field.length} queens, one bracket</h2>
      <p>Everybody here already went home. Nobody goes home again.</p>
    </div>
    <div class="sd-bracket">${bracket}</div>`;

  const cards = [open, ...scenes, crown].filter(s => s?.text).map((sc, i) => {
    const who = (sc.data?.players || []).slice(0, 2);
    return `<div class="dr-step" id="dr-step-smackdown-${i}">
      <div class="dr-panel dr-a-lip dr-scene">
        ${who.length ? `<span class="dr-who">${who.map(n =>
    _portrait(n, ep, { size: 46 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`;
  }).join('');

  const total = [open, ...scenes, crown].filter(s => s?.text).length;

  if (typeof window !== 'undefined') {
    const nDuels = sd.duels.length;
    const off = open?.text ? 1 : 0;
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.smackdown = (idx) => {
      for (let d = 0; d < nDuels; d++) {
        const box = document.getElementById(`sd-match-${d}`);
        if (box) box.classList.toggle('on', idx >= d + off);
      }
      const plinth = document.getElementById('sd-champ');
      if (plinth) plinth.classList.toggle('on', idx >= total - 1);
    };
  }
  return `<style>${SMACKDOWN_CSS}</style>${_shell(lead + cards + _controls('smackdown', total), ep, {
    phase: 'lipsync',
    title: 'The Lip Sync Smackdown',
    subtitle: 'the queens who already went home, settling it',
  })}`;
}

// ── LALAPARUZA TOURNAMENT (maxi challenge) ──────────────────────────

/**
 * The LaLaPaRuZa, as a losers-bracket tournament.
 *
 * Three columns: Round 1 (everybody), Round 2 (Round 1 losers), and
 * Sudden Death (Round 2 losers). The eliminated queen's card goes red
 * at the end instead of the champion plinth going gold.
 *
 * Reveals per DUEL. Each click fills one match, greys the loser, and
 * shows a round-result badge on the winner (SAFE for R1 winners, LOW
 * for R2 winners). The eliminated queen's plinth lights on the last duel.
 */
export function rpBuildTournament(row) {
  const te = row?.dr?.tournament;
  if (!te?.duels?.length) return '';
  const ep = row;
  const duels = te.duels;

  const rounds = [...new Set(duels.map(d => d.round))].sort((a, b) => a - b);
  const roundName = r => {
    if (r === 3) return 'SUDDEN DEATH';
    return duels.find(d => d.round === r)?.roundLabel || `ROUND ${r}`;
  };

  const bracket = rounds.map(rn => `<div class="sd-round">
      <div class="sd-round-label">${roundName(rn)}</div>
      ${duels.filter(d => d.round === rn).map((d, di) => {
    const gIdx = duels.indexOf(d);
    return `
        <div class="sd-match" id="sd-tm-${gIdx}">
          <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
          ${side(d.a, ep, d.adjusted?.[d.a] ?? d.scores?.[d.a],
    d.winner === d.a, d.fatigue?.[d.a])}
          ${side(d.b, ep, d.adjusted?.[d.b] ?? d.scores?.[d.b],
    d.winner === d.b, d.fatigue?.[d.b])}
        </div>`;
  }).join('')}
    </div>`).join('');

  // The eliminated queen's plinth at the end.
  const elimPlinth = te.eliminated ? `<div class="sd-round">
      <div class="sd-round-label">ELIMINATED</div>
      <div class="sd-elim" id="sd-tm-elim">
        ${_portrait(te.eliminated, ep, { size: 84, station: true })}
        <div class="sd-name dr-disp">${esc(te.eliminated)}</div>
        <div class="sd-label">SASHAY AWAY</div>
      </div>
    </div>` : '';

  const castSize = Object.keys(row?.dr?.performances || {}).length;
  const lead = `<div class="sd-hero">
      <div class="sd-title dr-disp">Lip Sync LaLaPaRUza</div>
      <h2 class="dr-disp">${castSize} queens, one survivor</h2>
      <p>Win your round and sit safe. Lose, and you lip sync again.</p>
    </div>
    <div class="sd-bracket">${bracket}${elimPlinth}</div>`;

  // Prose cards from the scenes.
  const textScenes = (row.dr.scenes || []).filter(s =>
    s.text && /^tournament-/.test(s.kind || ''));
  const cards = textScenes.map((sc, i) => {
    const who = (sc.data?.players || []).slice(0, 2);
    return `<div class="dr-step" id="dr-step-tournament-${i}">
      <div class="dr-panel dr-a-lip dr-scene">
        ${who.length ? `<span class="dr-who">${who.map(n =>
    _portrait(n, ep, { size: 46 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`;
  }).join('');

  const total = textScenes.length || duels.length;
  const suffix = 'tournament';

  if (typeof window !== 'undefined') {
    const nDuels = duels.length;
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra[suffix] = (idx) => {
      for (let d = 0; d < nDuels; d++) {
        const box = document.getElementById(`sd-tm-${d}`);
        if (box) box.classList.toggle('on', idx >= d);
      }
      const plinth = document.getElementById('sd-tm-elim');
      if (plinth) plinth.classList.toggle('on', idx >= total - 1);
    };
  }

  return `<style>${SMACKDOWN_CSS}</style>${_shell(lead + cards + _controls(suffix, total), ep, {
    phase: 'stage',
    title: 'Lip Sync LaLaPaRUza',
    subtitle: 'the losers bracket — lose twice and you are done',
  })}`;
}
