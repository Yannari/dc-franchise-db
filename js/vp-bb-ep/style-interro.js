// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-interro.js — the Interrogation's tally of names (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// A panel at the side of the HOH room: every name the house has given so far,
// with a bar for how often. The name the deposed HOH says is ringed; caught,
// it goes red.
export const BBX_INTERRO_CSS = `
.bbx .stage .intboard{position:absolute;right:3cqw;top:7.2cqw;z-index:7;width:19cqw;padding:.7cqw 1cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(26,6,10,.88),rgba(26,6,10,.66));box-shadow:0 0 0 .1cqw rgba(255,51,85,.42);backdrop-filter:blur(.6cqw)}
.bbx .stage .intboard .ih{display:block;font:700 .7cqw 'Chakra Petch';letter-spacing:.2cqw;color:#ff8aa0;margin-bottom:.5cqw}
.bbx .stage .ir{display:grid;grid-template-columns:2.4cqw 5.4cqw 1fr 1.2cqw;align-items:center;gap:.5cqw;padding:.25cqw .3cqw;border-radius:.4cqw;margin-bottom:.25cqw}
.bbx .stage .irf{position:relative;width:2.4cqw;aspect-ratio:1;border-radius:.35cqw;overflow:hidden;background:var(--c)}
.bbx .stage .irf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .ir b{font:800 .66cqw Archivo;text-transform:uppercase;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbx .stage .irb{height:.55cqw;border-radius:.3cqw;background:rgba(255,255,255,.08);overflow:hidden}
.bbx .stage .irb i{display:block;height:100%;background:linear-gradient(90deg,#ff3355,#ff8aa0);transition:width .4s}
.bbx .stage .ir em{font:800 .75cqw Archivo;font-style:normal;color:#fff;text-align:right}
.bbx .stage .ir.named{box-shadow:inset 0 0 0 .14cqw #f5c542;background:rgba(245,197,66,.1)}
.bbx .stage .ir.caught{box-shadow:inset 0 0 0 .16cqw #ff3355,0 0 1.4cqw rgba(255,51,85,.5);background:rgba(255,51,85,.16)}
.bbx .stage .ir.now{animation:bbx-irin .5s ease-out both}
.bbx .stage .ie{font:600 .62cqw Archivo;color:rgba(255,255,255,.45);padding:.4cqw 0}
.bbx .stage .ift{display:block;margin-top:.45cqw;font:700 .58cqw 'Chakra Petch';letter-spacing:.16cqw;color:rgba(255,255,255,.6);text-align:right}
.bbx .stage .ift.caught{color:#ff3355}
.bbx .stage .ift.wrong{color:#f5c542}
@keyframes bbx-irin{from{background:rgba(255,255,255,.25)}}
@media (prefers-reduced-motion:reduce){.bbx .stage .ir.now{animation:none}}
`;
