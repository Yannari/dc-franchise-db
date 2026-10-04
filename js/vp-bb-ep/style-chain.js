// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-chain.js — the Chain of Safety's line of links (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Built on the Safety Suite's pass rail (style-suite.js): the people made safe,
// in the order they were named, joined by gold links across the top of the
// frame; under them the "still waiting" row that shrinks with every name, and
// at the end the people nobody chose, lit red.
export const BBX_CHAIN_CSS = `
.bbx .stage .chainbar{position:absolute;left:6cqw;right:6cqw;top:7.2cqw;z-index:7;padding:.6cqw 1cqw;display:flex;flex-direction:column;align-items:center;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,12,24,.8),rgba(6,12,24,.55));box-shadow:0 0 0 .1cqw rgba(245,197,66,.3);backdrop-filter:blur(.6cqw)}
.bbx .stage .chainbar .ch,.bbx .stage .chainbar .ch2{display:block;font:700 .75cqw 'Chakra Petch';letter-spacing:.22cqw;color:#f5c542;margin-bottom:.35cqw}
.bbx .stage .chainbar .ch2{color:#8fa0bb}
.bbx .stage .cls{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.15cqw;row-gap:.3cqw}
.bbx .stage .cl{position:relative;width:3.5cqw;aspect-ratio:1;border-radius:.5cqw;overflow:hidden;background:var(--c);box-shadow:inset 0 0 0 .12cqw rgba(245,197,66,.8)}
.bbx .stage .cl img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .cl b{position:absolute;left:0;right:0;bottom:0;font:800 .55cqw Archivo;font-stretch:80%;text-transform:uppercase;color:#fff;text-align:center;background:rgba(2,6,12,.82);padding:.1cqw 0}
.bbx .stage .cl .cn{position:absolute;left:.2cqw;top:.2cqw;font:800 .6cqw 'Chakra Petch';color:#2a1d00;background:#f5c542;border-radius:.2cqw;padding:0 .25cqw}
.bbx .stage .cl.hold{box-shadow:inset 0 0 0 .18cqw #fff2b8,0 0 1.6cqw rgba(245,197,66,.85)}
.bbx .stage .cl.now{animation:bbx-linkin .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-linkin{from{transform:scale(.4) translateY(1cqw);opacity:0}}
.bbx .stage .chainbar .lk{width:1.2cqw;flex:none}
.bbx .stage .cwr{display:flex;flex-wrap:wrap;gap:.3cqw;align-items:center;justify-content:center;margin-top:.4cqw}
.bbx .stage .cwr .ch2{margin:0 .6cqw 0 0}
.bbx .stage .cw{position:relative;width:2.2cqw;aspect-ratio:1;border-radius:.4cqw;overflow:hidden;background:var(--c);filter:grayscale(.6) brightness(.7);box-shadow:inset 0 0 0 .1cqw rgba(255,255,255,.2)}
.bbx .stage .cw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .cw b{display:none}
.bbx .stage .cw.left{filter:none;box-shadow:inset 0 0 0 .16cqw #ff3355,0 0 1.4cqw rgba(255,51,85,.7)}
@media (prefers-reduced-motion:reduce){.bbx .stage .cl.now{animation:none}}
`;
