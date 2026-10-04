// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-capsule.js — the Time Capsule's meter (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// One numbered pip per stage (gold clean, blue slow, red missed) over a bar
// that fills toward the target line. Beaten, the board goes gold; out of
// time, it goes red.
export const BBX_CAPSULE_CSS = `
.bbx .stage .capboard{position:absolute;left:50%;transform:translateX(-50%);top:7.2cqw;z-index:7;width:34cqw;padding:.6cqw 1.2cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,16,24,.88),rgba(6,16,24,.64));box-shadow:0 0 0 .1cqw rgba(34,225,255,.4);backdrop-filter:blur(.6cqw)}
.bbx .stage .capboard .cph{display:block;text-align:center;font:700 .7cqw 'Chakra Petch';letter-spacing:.2cqw;color:#22e1ff;margin-bottom:.55cqw}
.bbx .stage .csr{display:flex;justify-content:center;gap:.6cqw;margin-bottom:.6cqw}
.bbx .stage .cs{width:2.4cqw;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 .8cqw Archivo;color:rgba(255,255,255,.45);
  box-shadow:inset 0 0 0 .12cqw rgba(255,255,255,.2)}
.bbx .stage .cs.good{background:#f5c542;color:#1a1200;box-shadow:0 0 1cqw rgba(245,197,66,.5)}
.bbx .stage .cs.near{background:#3a8dff;color:#fff}
.bbx .stage .cs.bad{background:#ff3355;color:#fff}
.bbx .stage .cs.now{animation:bbx-capin .5s cubic-bezier(.2,1.4,.4,1) both}
.bbx .stage .cbar{position:relative;height:.9cqw;border-radius:.45cqw;background:rgba(255,255,255,.08);overflow:hidden}
.bbx .stage .cbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22e1ff,#7cf3ff);transition:width .5s}
.bbx .stage .cbar em{position:absolute;right:0;top:-.2cqw;bottom:-.2cqw;width:.18cqw;background:#fff}
.bbx .stage .cpf{display:block;text-align:right;margin-top:.3cqw;font:700 .55cqw 'Chakra Petch';letter-spacing:.16cqw;color:rgba(255,255,255,.6)}
.bbx .stage .capboard.won{box-shadow:0 0 0 .14cqw #f5c542,0 0 2cqw rgba(245,197,66,.45)}
.bbx .stage .capboard.won .cbar i{background:linear-gradient(90deg,#f5c542,#ffe08a)}
.bbx .stage .capboard.won .cpf{color:#f5c542}
.bbx .stage .capboard.lost{box-shadow:0 0 0 .14cqw #ff3355}
.bbx .stage .capboard.lost .cbar i{background:linear-gradient(90deg,#ff3355,#ff8aa0)}
.bbx .stage .capboard.lost .cpf{color:#ff8aa0}
@keyframes bbx-capin{from{transform:scale(.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.bbx .stage .cs.now{animation:none}}
`;
