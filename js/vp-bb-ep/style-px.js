// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-px.js — Prizes and Punishments' table of boxes (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A row of numbered gift boxes over the room. A wrapped box is unopened; an
// opened one shows what was in it and the face of whoever holds it now — the
// veto in gold, prizes in blue, punishments in red — and a swap moves the faces.
export const BBX_PX_CSS = `
.bbx .stage .pxtable{position:absolute;left:5cqw;right:5cqw;top:7.2cqw;z-index:7;padding:.6cqw 1cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,12,24,.86),rgba(6,12,24,.62));box-shadow:0 0 0 .1cqw rgba(245,197,66,.3);backdrop-filter:blur(.6cqw)}
.bbx .stage .pxtable .pt{display:block;text-align:center;font:700 .78cqw 'Chakra Petch';letter-spacing:.22cqw;color:#f5c542;margin-bottom:.5cqw}
.bbx .stage .pxr{display:flex;justify-content:center;gap:.6cqw;flex-wrap:wrap}
.bbx .stage .pxb{position:relative;width:7.4cqw;height:8.4cqw;border-radius:.6cqw;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 .1cqw rgba(255,255,255,.14)}
.bbx .stage .pxb svg{width:4.6cqw}
.bbx .stage .pxb .pn{position:absolute;left:.4cqw;top:.3cqw;font:800 .75cqw 'Chakra Petch';color:#8fa0bb}
.bbx .stage .pxb .pi{font:800 .78cqw Archivo;font-stretch:85%;text-align:center;text-transform:uppercase;line-height:1.1;padding:0 .4cqw;color:#e8eefb}
.bbx .stage .pxb .ph{position:relative;width:2.8cqw;aspect-ratio:1;border-radius:.4cqw;overflow:hidden;background:var(--c);margin-top:.4cqw}
.bbx .stage .pxb .ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .pxb b{font:800 .62cqw Archivo;text-transform:uppercase;color:#fff;margin-top:.2cqw}
.bbx .stage .pxb.prize{background:rgba(34,181,255,.12);box-shadow:inset 0 0 0 .12cqw rgba(34,181,255,.55)}
.bbx .stage .pxb.punishment{background:rgba(255,51,85,.13);box-shadow:inset 0 0 0 .12cqw rgba(255,51,85,.6)}
.bbx .stage .pxb.punishment .pi{color:#ffb3c0}
.bbx .stage .pxb.veto{background:linear-gradient(160deg,rgba(245,197,66,.45),rgba(245,197,66,.14));box-shadow:inset 0 0 0 .16cqw #f5c542,0 0 2cqw rgba(245,197,66,.55)}
.bbx .stage .pxb.veto .pi{color:#fff2b8}
.bbx .stage .pxb.now{animation:bbx-pxopen .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-pxopen{from{transform:scale(.8) rotate(-4deg);opacity:.3}}
@media (prefers-reduced-motion:reduce){.bbx .stage .pxb.now{animation:none}}
`;
