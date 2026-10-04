// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-duo.js — Duo Week's board of pairs (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Every pair as two faces joined by a link, across the top of the room; the
// pair a scene is about lights up, the nominated pairs are outlined red, and
// the houseguest with no partner sits apart in green, unnominatable.
export const BBX_DUO_CSS = `
.bbx .stage .duoboard{position:absolute;left:5cqw;right:5cqw;top:7.2cqw;z-index:7;padding:.6cqw 1cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,12,24,.84),rgba(6,12,24,.6));box-shadow:0 0 0 .1cqw rgba(34,225,255,.28);backdrop-filter:blur(.6cqw)}
.bbx .stage .duoboard .dh{display:block;text-align:center;font:700 .78cqw 'Chakra Petch';letter-spacing:.22cqw;color:#22e1ff;margin-bottom:.5cqw}
.bbx .stage .dr2{display:flex;justify-content:center;gap:.8cqw;flex-wrap:wrap}
.bbx .stage .dp{position:relative;display:flex;align-items:center;gap:.2cqw;padding:.45cqw .55cqw 1.1cqw;border-radius:.6cqw;
  background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 .1cqw rgba(255,255,255,.12);transition:filter .3s}
.bbx .stage .dp .dl{width:1.4cqw}
.bbx .stage .df{position:relative;width:4.8cqw;aspect-ratio:1;border-radius:.45cqw;overflow:hidden;background:var(--c)}
.bbx .stage .df img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .df b{position:absolute;left:0;right:0;bottom:0;font:800 .62cqw Archivo;text-transform:uppercase;color:#fff;text-align:center;background:rgba(2,6,12,.82)}
.bbx .stage .dp i{position:absolute;left:0;right:0;bottom:.1cqw;text-align:center;font:700 .62cqw 'Chakra Petch';letter-spacing:.12cqw;font-style:normal;color:#ff8aa0}
.bbx .stage .dp.nom{box-shadow:inset 0 0 0 .14cqw #ff3355;background:rgba(255,51,85,.1)}
.bbx .stage .dp.solo{box-shadow:inset 0 0 0 .14cqw #12b76a;background:rgba(18,183,106,.1)}
.bbx .stage .dp.solo{min-width:10.5cqw;justify-content:center}
.bbx .stage .dp.solo i{color:#7fe3b0}
.bbx .stage .dp.on{box-shadow:inset 0 0 0 .18cqw #22e1ff,0 0 1.6cqw rgba(34,225,255,.55)}
.bbx .stage .duoboard:has(.dp.on) .dp:not(.on){filter:brightness(.55) saturate(.6)}
.bbx .stage .dp.now{animation:bbx-duoin .6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-duoin{from{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.bbx .stage .dp.now{animation:none}}
`;
