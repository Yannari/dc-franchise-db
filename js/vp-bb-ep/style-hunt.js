// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-hunt.js — the Hidden Power's map of the house (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Eight places a power could be hidden, as a board over the living room: each
// search stamps the searcher's face on the spot they tried, "the house
// believes" fills as people are seen looking, and the find lights the real
// spot gold. Where it is stays unknown, to the viewer too, until it is found or
// it expires.
export const BBX_HUNT_CSS = `
.bbx .stage .huntmap{position:absolute;left:10cqw;right:10cqw;top:7.2cqw;z-index:7;padding:.8cqw 1cqw 1cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,12,24,.86),rgba(6,12,24,.66));box-shadow:0 0 0 .1cqw rgba(34,225,255,.28);backdrop-filter:blur(.6cqw)}
.bbx .stage .huntmap .hh{display:flex;justify-content:space-between;align-items:center;font:700 .8cqw 'Chakra Petch';letter-spacing:.22cqw;color:#22e1ff;margin-bottom:.6cqw}
.bbx .stage .huntmap .hb{display:flex;align-items:center;gap:.3cqw;color:#ff8aa0}
.bbx .stage .huntmap .hb span{width:1.6cqw;height:.6cqw;border-radius:.15cqw;background:rgba(255,255,255,.12)}
.bbx .stage .huntmap .hb span.on{background:#ff3355;box-shadow:0 0 .8cqw rgba(255,51,85,.7)}
.bbx .stage .hg{display:grid;grid-template-columns:repeat(4,1fr);gap:.6cqw}
.bbx .stage .hc{position:relative;min-height:5.6cqw;border-radius:.6cqw;padding:.5cqw .6cqw;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 .1cqw rgba(255,255,255,.12)}
.bbx .stage .hc b{display:block;font:800 .95cqw Archivo;font-stretch:85%;letter-spacing:.06cqw;color:#e8eefb;text-transform:uppercase}
.bbx .stage .hc i{position:absolute;right:.5cqw;bottom:.4cqw;font:700 .62cqw 'Chakra Petch';letter-spacing:.14cqw;font-style:normal;color:#8fa0bb}
.bbx .stage .hw{display:flex;gap:.25cqw;margin-top:.4cqw;flex-wrap:wrap}
.bbx .stage .hl,.bbx .stage .hf{position:relative;width:2cqw;aspect-ratio:1;border-radius:.35cqw;overflow:hidden;background:var(--c)}
.bbx .stage .hl img,.bbx .stage .hf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .hl{filter:grayscale(.5) brightness(.8)}
.bbx .stage .hl::after{content:"";position:absolute;inset:0;background:linear-gradient(45deg,transparent 46%,#ff3355 46%,#ff3355 54%,transparent 54%)}
.bbx .stage .hc.secret{box-shadow:inset 0 0 0 .14cqw rgba(245,197,66,.85);background:rgba(245,197,66,.06)}
.bbx .stage .hc.secret i{color:#f5c542}
.bbx .stage .hc.found{background:linear-gradient(160deg,rgba(245,197,66,.42),rgba(245,197,66,.12));box-shadow:inset 0 0 0 .18cqw #f5c542,0 0 2cqw rgba(245,197,66,.5)}
.bbx .stage .hc.found i{color:#ffe08a}
.bbx .stage .hf{width:3cqw;box-shadow:0 0 0 .14cqw #f5c542}
.bbx .stage .hc.now{animation:bbx-hunt .8s ease-out both}
@keyframes bbx-hunt{0%{box-shadow:inset 0 0 0 .2cqw #22e1ff,0 0 2.4cqw rgba(34,225,255,.8)}}
@media (prefers-reduced-motion:reduce){.bbx .stage .hc.now{animation:none}}
`;
