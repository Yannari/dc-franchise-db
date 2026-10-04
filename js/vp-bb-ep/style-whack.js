// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-whack.js — the Whacktivity's corridor of doors (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Three tall doors, each naming its power, with the faces of whoever picked
// it underneath. The one that opens glows orange; the others go dark and say
// so. The winner's face turns gold.
export const BBX_WHACK_CSS = `
.bbx .stage .whboard{position:absolute;left:50%;transform:translateX(-50%);top:7.2cqw;z-index:7;padding:.6cqw 1.2cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(26,12,4,.88),rgba(26,12,4,.64));box-shadow:0 0 0 .1cqw rgba(255,138,61,.42);backdrop-filter:blur(.6cqw)}
.bbx .stage .whboard .whh{display:block;text-align:center;font:700 .74cqw 'Chakra Petch';letter-spacing:.22cqw;color:#ff8a3d;margin-bottom:.5cqw}
.bbx .stage .wdr{display:flex;justify-content:center;gap:.9cqw}
.bbx .stage .wd{width:11.5cqw;min-height:8cqw;display:flex;flex-direction:column;align-items:center;gap:.3cqw;padding:.5cqw .5cqw .55cqw;border-radius:.9cqw .9cqw .3cqw .3cqw;
  background:linear-gradient(180deg,#2c1708,#1a0d04);box-shadow:inset 0 0 0 .14cqw rgba(255,138,61,.45);transition:filter .3s}
.bbx .stage .wd .wdn{font:700 .55cqw 'Chakra Petch';letter-spacing:.16cqw;color:rgba(255,179,122,.7)}
.bbx .stage .wd b{font:800 .72cqw Archivo;color:#fff;text-align:center;line-height:1.15;min-height:1.7cqw}
.bbx .stage .whr{display:flex;flex-wrap:wrap;justify-content:center;gap:.2cqw;min-height:2.3cqw}
.bbx .stage .whr em{font:700 .55cqw 'Chakra Petch';letter-spacing:.12cqw;font-style:normal;color:rgba(255,255,255,.4);align-self:center}
.bbx .stage .whf{position:relative;width:2.1cqw;aspect-ratio:1;border-radius:.3cqw;overflow:hidden;background:var(--c)}
.bbx .stage .whf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .whf.win{box-shadow:0 0 0 .14cqw #f5c542,0 0 1cqw rgba(245,197,66,.7)}
.bbx .stage .whf.miss{filter:grayscale(1)}
.bbx .stage .wd i{font:700 .55cqw 'Chakra Petch';letter-spacing:.12cqw;font-style:normal;color:#ffb37a;min-height:.8cqw}
.bbx .stage .wd.open{box-shadow:inset 0 0 0 .18cqw #ff8a3d,0 0 2cqw rgba(255,138,61,.55);background:linear-gradient(180deg,#5a2d0c,#2c1708)}
.bbx .stage .wd.shut{filter:brightness(.5) saturate(.5)}
.bbx .stage .wd.now{animation:bbx-whin .55s cubic-bezier(.2,1.4,.4,1) both}
.bbx .stage .expcard{position:absolute;right:4cqw;top:8cqw;z-index:7;width:15cqw;padding:.8cqw 1cqw;border-radius:.8cqw;transform:rotate(-2deg);
  background:linear-gradient(160deg,rgba(40,40,48,.92),rgba(20,20,26,.86));box-shadow:0 0 0 .12cqw rgba(255,255,255,.25),0 1cqw 2cqw rgba(0,0,0,.4)}
.bbx .stage .expcard .eh{display:block;font:800 .62cqw 'Chakra Petch';letter-spacing:.2cqw;color:#9aa4b2;margin-bottom:.3cqw}
.bbx .stage .expcard b{display:block;font:800 1.15cqw Archivo;color:#e7ebf0;line-height:1.15;text-decoration:line-through;text-decoration-color:rgba(255,51,85,.8)}
.bbx .stage .expcard i{display:block;margin-top:.35cqw;font:600 .62cqw Archivo;font-style:normal;color:rgba(255,255,255,.55)}
.bbx .stage .expcard.live{transform:rotate(0);box-shadow:0 0 0 .12cqw rgba(245,197,66,.45),0 1cqw 2cqw rgba(0,0,0,.4)}
.bbx .stage .expcard.live .eh{color:#f5c542}
.bbx .stage .expcard.live b{text-decoration:none}
.bbx .stage .expcard.live.played{box-shadow:0 0 0 .16cqw #f5c542,0 0 2cqw rgba(245,197,66,.5)}
.bbx .stage .expcard.now{animation:bbx-whin .55s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-whin{from{transform:translateY(-.6cqw);opacity:.3}}
@media (prefers-reduced-motion:reduce){.bbx .stage .wd.now{animation:none}}
`;
