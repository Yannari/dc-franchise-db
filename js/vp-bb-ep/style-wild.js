// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-wild.js — the Wildcard's hat board (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A row of face-down cards for the names still in the hat; each one turns as
// a name is drawn, shows its score when the puzzle ends, and the winner's goes
// gold. After the offer, the price sits at the end of the row and is stamped
// ACCEPTED or TURNED DOWN.
export const BBX_WILD_CSS = `
.bbx .stage .wildboard{position:absolute;left:50%;transform:translateX(-50%);top:7.2cqw;z-index:7;padding:.6cqw 1.2cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(16,8,28,.86),rgba(16,8,28,.62));box-shadow:0 0 0 .1cqw rgba(176,124,255,.42);backdrop-filter:blur(.6cqw)}
.bbx .stage .wildboard .wh{display:block;text-align:center;font:700 .78cqw 'Chakra Petch';letter-spacing:.22cqw;color:#b07cff;margin-bottom:.5cqw}
.bbx .stage .wildboard .wr{display:flex;justify-content:center;align-items:stretch;gap:.8cqw}
.bbx .stage .wc{position:relative;width:6.4cqw;display:flex;flex-direction:column;align-items:center;gap:.25cqw;padding:.45cqw .4cqw .5cqw;border-radius:.6cqw;
  background:rgba(176,124,255,.08);box-shadow:inset 0 0 0 .12cqw rgba(176,124,255,.45);transition:filter .3s}
.bbx .stage .wcf{position:relative;width:4.8cqw;aspect-ratio:1;border-radius:.45cqw;overflow:hidden;background:var(--c,rgba(255,255,255,.05));
  display:flex;align-items:center;justify-content:center;font:800 2cqw Archivo;color:rgba(176,124,255,.6)}
.bbx .stage .wcf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .wc b{font:800 .62cqw Archivo;text-transform:uppercase;color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbx .stage .wc i{font:700 .7cqw 'Chakra Petch';letter-spacing:.1cqw;font-style:normal;color:#d7c2ff}
.bbx .stage .wc.hid{background:repeating-linear-gradient(135deg,rgba(176,124,255,.1) 0 .5cqw,rgba(176,124,255,.03) .5cqw 1cqw)}
.bbx .stage .wc.hid i{color:rgba(255,255,255,.4);font-size:.55cqw}
.bbx .stage .wc.win{box-shadow:inset 0 0 0 .18cqw #f5c542,0 0 1.8cqw rgba(245,197,66,.6);background:rgba(245,197,66,.14)}
.bbx .stage .wc.win i{color:#f5c542}
.bbx .stage .wc.lost{filter:brightness(.6) saturate(.6)}
.bbx .stage .wcp{position:relative;width:11cqw;display:flex;flex-direction:column;justify-content:center;gap:.3cqw;padding:.6cqw .8cqw;border-radius:.6cqw;
  background:rgba(255,51,85,.1);box-shadow:inset 0 0 0 .14cqw #ff3355;animation:bbx-wcin .6s cubic-bezier(.2,1.4,.4,1) both}
.bbx .stage .wcp span{font:700 .55cqw 'Chakra Petch';letter-spacing:.14cqw;color:#ff8aa0}
.bbx .stage .wcp b{font:800 .95cqw Archivo;color:#fff;line-height:1.15}
.bbx .stage .wcp em{font:800 .62cqw 'Chakra Petch';letter-spacing:.16cqw;font-style:normal;color:#f5c542}
.bbx .stage .wcp.no{box-shadow:inset 0 0 0 .14cqw #9aa4b2;background:rgba(154,164,178,.08)}
.bbx .stage .wcp.no em{color:#c8cfd8}
.bbx .stage .wc.now{animation:bbx-wcin .6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-wcin{from{transform:scale(.6);opacity:0}}
@media (prefers-reduced-motion:reduce){.bbx .stage .wc.now,.bbx .stage .wcp{animation:none}}
`;
