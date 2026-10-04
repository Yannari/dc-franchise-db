// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-camp.js — Camp Comeback's board of bunks (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Four bunks across the top of the room, in camp orange. Each eviction fills
// one; on the night of the door, the losers grey out as GONE and the winner
// turns gold, BACK IN.
export const BBX_CAMP_CSS = `
.bbx .stage .campboard{position:absolute;left:50%;transform:translateX(-50%);top:7.2cqw;z-index:7;padding:.6cqw 1.2cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(24,12,4,.86),rgba(24,12,4,.62));box-shadow:0 0 0 .1cqw rgba(255,138,61,.4);backdrop-filter:blur(.6cqw)}
.bbx .stage .campboard .ch{display:block;text-align:center;font:700 .78cqw 'Chakra Petch';letter-spacing:.22cqw;color:#ff8a3d;margin-bottom:.5cqw}
.bbx .stage .campboard .cr{display:flex;justify-content:center;gap:.8cqw}
.bbx .stage .cb{position:relative;width:6.4cqw;display:flex;flex-direction:column;align-items:center;gap:.25cqw;padding:.45cqw .4cqw .5cqw;border-radius:.6cqw;
  background:rgba(255,138,61,.08);box-shadow:inset 0 0 0 .12cqw rgba(255,138,61,.45);transition:filter .3s}
.bbx .stage .cbf{position:relative;width:4.8cqw;aspect-ratio:1;border-radius:.45cqw;overflow:hidden;background:var(--c,rgba(255,255,255,.06))}
.bbx .stage .cbf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .cb b{font:800 .62cqw Archivo;text-transform:uppercase;color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbx .stage .cb i{font:700 .55cqw 'Chakra Petch';letter-spacing:.12cqw;font-style:normal;color:#ffb37a}
.bbx .stage .cb.empty{box-shadow:inset 0 0 0 .12cqw rgba(255,255,255,.14);background:rgba(255,255,255,.03)}
.bbx .stage .cb.empty .cbf{border:.1cqw dashed rgba(255,255,255,.22);background:transparent}
.bbx .stage .cb.empty i{color:rgba(255,255,255,.4)}
.bbx .stage .cb.gone{filter:grayscale(1) brightness(.55)}
.bbx .stage .cb.gone i{color:#ff8aa0}
.bbx .stage .cb.back{box-shadow:inset 0 0 0 .18cqw #f5c542,0 0 1.8cqw rgba(245,197,66,.6);background:rgba(245,197,66,.14)}
.bbx .stage .cb.back i{color:#f5c542}
.bbx .stage .cb.now{animation:bbx-campin .6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-campin{from{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.bbx .stage .cb.now{animation:none}}
`;
