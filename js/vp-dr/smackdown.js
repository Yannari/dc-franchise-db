// ══════════════════════════════════════════════════════════════════════
// vp-dr/smackdown.js — the bracket, drawn as a bracket
// ══════════════════════════════════════════════════════════════════════
//
// The episode carried a full eight-queen tournament — three rounds, a song per
// duel, scores, a champion — and had no screen at all: none of its scene kinds
// matched a section, so every one of them fell into the cold-open fallback and
// the night arrived blank.
//
// A smackdown is not a main stage. There is no runway, no panel, no critique
// and nobody goes home, because everybody here already went home once. So it
// gets the one shape a tournament actually has: a bracket that fills in as you
// reveal it, round by round, with the losers greying out and the champion left
// standing at the end.
import { _shell, _portrait } from './style.js';
import { _controls } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const SMACKDOWN_CSS = `
.sd-wrap{--sd-gold:#FFC83D;--sd-dead:#4a2a3c}
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
  border-radius:3px;overflow:hidden;opacity:.28;transition:opacity .25s}
.sd-match.on{opacity:1}
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

/* The champion's plinth at the end of the row. */
.sd-champ{display:flex;flex-direction:column;align-items:center;gap:8px;
  padding:14px 10px;border:1px solid var(--sd-gold);border-radius:3px;
  background:linear-gradient(180deg,rgba(255,200,61,.14),transparent);opacity:.28;
  transition:opacity .3s}
.sd-champ.on{opacity:1}
.sd-champ .sd-name{font-size:17px;color:var(--sd-gold)}
.sd-champ .sd-belt{font-size:9px;letter-spacing:.18em;color:#e3cfdd;text-align:center;
  text-wrap:balance}
@media(prefers-reduced-motion:reduce){.sd-match,.sd-champ{transition:none}}
`;

/** One side of a duel row. */
function side(name, ep, score, won) {
  return `<div class="sd-side ${won ? 'sd-win' : 'sd-lose'}">
    ${_portrait(name, ep, { size: 26 })}
    <b>${esc(name)}</b>
    <span class="sd-sc">${Number(score ?? 0).toFixed(1)}</span>
  </div>`;
}

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

  // Index every duel so a reveal can address its own match box.
  const idxOf = new Map(sd.duels.map((d, i) => [d, i]));

  const bracket = rounds.map(rn => `<div class="sd-round">
      <div class="sd-round-label">${nameOf(rn)}</div>
      ${sd.duels.filter(d => d.round === rn).map(d => `
        <div class="sd-match" id="sd-match-${idxOf.get(d)}">
          <div class="sd-song">&ldquo;${esc(d.song)}&rdquo;</div>
          ${side(d.a, ep, d.scores?.[d.a], d.winner === d.a)}
          ${side(d.b, ep, d.scores?.[d.b], d.winner === d.b)}
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

  /* THE PROSE, one card per duel, in the order they were danced. The bracket
     above is the shape of the night; these are the night itself. */
  const cards = [open, ...scenes, crown].filter(s => s?.text).map((sc, i) => {
    const who = (sc.data?.players || []).slice(0, 2);
    return `<div class="dr-step" id="dr-step-smackdown-${i}">
      <div class="dr-panel dr-a-lip dr-scene">
        ${who.length ? `<span class="dr-who">${who.map(n =>
    _portrait(n, ep, { size: 46 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${sc.data?.tier
    ? `<span class="dr-tier">${esc(sc.data.tier)}</span>` : ''}${esc(sc.text)}</div>
      </div></div>`;
  }).join('');

  const total = [open, ...scenes, crown].filter(s => s?.text).length;
  return `<style>${SMACKDOWN_CSS}</style>${_shell(lead + cards + _controls('smackdown', total), ep, {
    phase: 'lipsync',
    title: 'The Lip Sync Smackdown',
    subtitle: 'the queens who already went home, settling it',
  })}`;
}
