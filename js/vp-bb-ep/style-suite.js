// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-suite.js — the Safety Suite's set and objects (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Ported from the approved mockup (mockup/mockup-bb-twist-safety-suite.html),
// scoped under .bbx like style.js: the pass rail, the hallway door, the white
// suite with its clock and columns of light, the stamps, the rules card, the
// price card and the held pass.
export const BBX_SUITE_CSS = `/* ════════ Phase 7 · the Safety Suite ════════ */
.bbx .stage .chipx.safe{background:#12b76a;color:#fff}
.bbx .stage .chipx.plus{background:#f5c542;color:#2a1d00}
.bbx .stage .chipx.spent{border:.1cqw solid #8a96a8;color:#c3cbd6}
/* the pass rail: one keycard per houseguest, the whole season's worth */
.bbx .stage .rail{position:absolute;left:50%;top:7.6cqw;transform:translateX(-50%);display:flex;gap:.7cqw;z-index:7;padding:.7cqw 1cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(6,12,24,.72),rgba(6,12,24,.45));box-shadow:0 0 0 .1cqw rgba(34,225,255,.25);backdrop-filter:blur(.6cqw)}
.bbx .stage .rail .rh{position:absolute;left:1cqw;top:-1.7cqw;font:700 .85cqw 'Chakra Petch';letter-spacing:.22cqw;color:#22e1ff}
.bbx .stage .pass{position:relative;width:5.2cqw;aspect-ratio:1.58;border-radius:.45cqw;overflow:hidden;
  background:linear-gradient(135deg,#0f2a44,#07121f);box-shadow:inset 0 0 0 .1cqw rgba(34,225,255,.55),0 0 1cqw rgba(34,225,255,.25);transition:filter .4s,box-shadow .4s}
.bbx .stage .pass img{position:absolute;right:0;top:0;height:100%;width:52%;object-fit:cover;object-position:50% 12%;-webkit-mask:linear-gradient(90deg,transparent,#000 40%);mask:linear-gradient(90deg,transparent,#000 40%)}
.bbx .stage .pass .pn{position:absolute;left:0;right:0;bottom:0;padding:.15cqw .4cqw;background:linear-gradient(90deg,rgba(2,6,12,.92) 60%,rgba(2,6,12,.4));font:800 .62cqw Archivo;font-stretch:80%;letter-spacing:.06cqw;color:#fff;text-transform:uppercase;z-index:2}
.bbx .stage .pass .pe{position:absolute;left:.35cqw;top:.3cqw;width:1.5cqw;z-index:2}
.bbx .stage .pass .chipline{position:absolute;left:0;right:0;top:46%;height:.18cqw;background:linear-gradient(90deg,#22e1ff,transparent);opacity:.7}
.bbx .stage .pass.spent{filter:grayscale(.7) brightness(.75);box-shadow:inset 0 0 0 .1cqw rgba(245,197,66,.6)}
.bbx .stage .pass.spent::after{content:"SPENT";position:absolute;inset:auto 0 32% 0;text-align:center;font:800 .78cqw 'Chakra Petch';letter-spacing:.2cqw;color:#2a1d00;background:#f5c542;transform:rotate(-8deg)}
.bbx .stage .pass.held{box-shadow:inset 0 0 0 .14cqw #22e1ff,0 0 1.6cqw rgba(34,225,255,.6)}
.bbx .stage .pass.held::after{content:"HELD";position:absolute;right:.3cqw;top:.25cqw;font:800 .6cqw 'Chakra Petch';letter-spacing:.12cqw;color:#001018;background:#22e1ff;padding:0 .3cqw;border-radius:.15cqw}
.bbx .stage .pass.na{opacity:.35;filter:grayscale(1)}
.bbx .stage .pass.na::after{content:"HOH";position:absolute;right:.3cqw;top:.25cqw;font:800 .6cqw 'Chakra Petch';color:#2a1d00;background:#f5c542;padding:0 .3cqw;border-radius:.15cqw}
.bbx .stage .pass.now{animation:bbx-swipe .9s cubic-bezier(.2,.8,.2,1)}
@keyframes bbx-swipe{0%{transform:translateY(0)}35%{transform:translateY(-1.4cqw) rotate(-6deg);box-shadow:0 0 2.6cqw #f5c542}100%{transform:none}}
.bbx .stage .rail.lit .pass:not(.na){animation:bbx-railup .9s ease-out both}
@keyframes bbx-railup{0%{box-shadow:inset 0 0 0 .1cqw rgba(34,225,255,.55),0 0 0 rgba(34,225,255,0)}50%{box-shadow:inset 0 0 0 .14cqw #9ff6ff,0 0 2cqw #22e1ff}}
.bbx .stage .drpass{position:absolute;left:64%;bottom:22cqw;z-index:6;transform:rotate(8deg);text-align:center}
.bbx .stage .drpass .pass{width:11cqw}
.bbx .stage .drpass .pass .pn{font-size:1cqw}
.bbx .stage .drpass b{display:block;margin-top:.8cqw;font:700 .95cqw 'Chakra Petch';letter-spacing:.2cqw;color:#22e1ff}
.bbx .stage .drpass.fresh{animation:bbx-billin .6s ease-out both}
.bbx .stage .rules{position:absolute;left:50%;top:14cqw;transform:translateX(-50%);width:44cqw;z-index:11;padding:1.2cqw 1.4cqw;border-radius:1cqw;
  background:linear-gradient(160deg,rgba(8,16,30,.92),rgba(4,8,16,.86));box-shadow:0 0 0 .12cqw rgba(34,225,255,.45),0 2cqw 4cqw rgba(0,0,0,.5)}
.bbx .stage .rules .rt{font:700 .9cqw 'Chakra Petch';letter-spacing:.24cqw;color:#22e1ff;margin-bottom:.8cqw}
.bbx .stage .rules .rr{display:grid;grid-template-columns:2.6cqw auto;column-gap:.8cqw;align-items:center;padding:.5cqw 0;opacity:.28;transition:opacity .4s}
.bbx .stage .rules .rr.on{opacity:1}
.bbx .stage .rules .rr.now{animation:bbx-billin .5s ease-out both}
.bbx .stage .rules .rk{grid-row:span 2;width:2.6cqw;height:2.6cqw;border-radius:50%;display:grid;place-items:center;font:800 1.1cqw Archivo;color:#2a1d00;background:#f5c542}
.bbx .stage .rules .rr b{font:800 1.6cqw Archivo;font-stretch:90%;letter-spacing:.1cqw;color:#fff}
.bbx .stage .rules .rr span:last-child{font:500 1.25cqw Archivo;color:#b9c4d8}
.bbx .stage.rulesup .bbv{justify-content:flex-end;padding-bottom:4cqw}
.bbx .stage.rulesup .bbv .eye{display:none}
.bbx .stage.rulesup .bbv .tx{font-size:2cqw;max-width:62cqw}
/* the corridor and the door */
.bbx .stage .set-door{--fl1:#1b2230;--fl2:#07090e;background:radial-gradient(30cqw 40cqw at 72% 30%,rgba(255,240,210,.32),transparent 70%),
  linear-gradient(90deg,rgba(255,255,255,.04) 0 .1cqw,transparent .1cqw 9cqw) 0 0/9cqw 100%,linear-gradient(180deg,#1a2130,#0b0f17)}
.bbx .stage .set-door::before{background:linear-gradient(180deg,transparent 6%,rgba(245,197,66,.55) 6.3%,transparent 6.8%)}
.bbx .stage .obj.door{position:absolute;left:66%;bottom:18.6cqw;width:15cqw;z-index:2}
.bbx .stage .obj.door .lamp{transition:fill .3s}
.bbx .stage .obj.door.go .lamp{fill:#12e08a;filter:drop-shadow(0 0 .6cqw #12e08a)}
.bbx .stage .obj.door.shut .lamp{fill:#ff3355}
.bbx .stage .obj.door.ping .scan2{animation:bbx-ping .8s ease-out}
@keyframes bbx-ping{0%{opacity:1;transform:scale(.6)}100%{opacity:0;transform:scale(2.4)}}
/* inside the suite: white light, gold trim, one column of light per entrant, the clock */
.bbx .stage .set-suite{--fl1:#d9dde6;--fl2:#8b93a3;background:radial-gradient(60cqw 30cqw at 50% -4%,rgba(255,255,255,.95),transparent 70%),
  repeating-linear-gradient(90deg,rgba(255,255,255,.0) 0 7.9cqw,rgba(245,197,66,.35) 7.9cqw 8cqw),linear-gradient(180deg,#eef1f6,#c9ced8 70%)}
.bbx .stage .set-suite .floor{background:linear-gradient(180deg,#f3f4f7,#9aa2b1)}
.bbx .stage .set-suite::before{background:linear-gradient(180deg,transparent 8%,rgba(245,197,66,.9) 8.25%,transparent 8.6%)}
.bbx .stage .sclock{position:absolute;left:4cqw;top:9.5cqw;width:13cqw;z-index:2;filter:drop-shadow(0 1cqw 2cqw rgba(20,30,50,.25))}
.bbx .stage .sclock .arc{transition:stroke-dashoffset 1.6s cubic-bezier(.3,.6,.3,1)}
.bbx .stage .cols{position:absolute;inset:0;z-index:1;pointer-events:none}
.bbx .stage .col{position:absolute;bottom:18.6cqw;width:7cqw;height:27cqw;transform:translateX(-50%);border-radius:.6cqw .6cqw 0 0;
  background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,.05));box-shadow:inset 0 0 0 .1cqw rgba(30,40,60,.18)}
.bbx .stage .col .fill{position:absolute;left:0;right:0;bottom:0;height:var(--h,0%);border-radius:.6cqw .6cqw 0 0;
  background:linear-gradient(180deg,#9ff6ff,#22b5ff);box-shadow:0 0 2cqw rgba(34,181,255,.55);transition:height 1.5s cubic-bezier(.3,.6,.3,1)}
.bbx .stage .col.ok .fill{background:linear-gradient(180deg,#fff2b8,#f5c542);box-shadow:0 0 3cqw rgba(245,197,66,.8)}
.bbx .stage .col.slow .fill{background:linear-gradient(180deg,#c9d1de,#5f6b80);box-shadow:0 0 1.6cqw rgba(95,107,128,.5)}
.bbx .stage .stamp.slow{color:#5b6678}
.bbx .stage .col.short .fill{background:linear-gradient(180deg,#ffb3c0,#ff3355);box-shadow:0 0 1.6cqw rgba(255,51,85,.5)}
.bbx .stage .col.grow .fill{animation:bbx-grow 1.5s cubic-bezier(.3,.6,.3,1) both}
@keyframes bbx-grow{from{height:0}}
.bbx .stage .clockline{position:absolute;left:22%;right:12%;bottom:calc(18.6cqw + 27cqw * .8);height:.22cqw;z-index:2;background:repeating-linear-gradient(90deg,#1a2233 0 1cqw,transparent 1cqw 1.6cqw)}
.bbx .stage .clockline b{position:absolute;left:0;top:-1.8cqw;font:700 .9cqw 'Chakra Petch';letter-spacing:.2cqw;color:#1a2233}
.bbx .stage .stamp{position:absolute;left:var(--x);bottom:34.4cqw;transform:translateX(-50%) rotate(-10deg);z-index:6;font:900 1.35cqw Archivo;white-space:nowrap;font-stretch:120%;letter-spacing:.3cqw;
  padding:.3cqw 1.2cqw;border:.3cqw solid currentColor;border-radius:.5cqw;background:rgba(255,255,255,.75)}
.bbx .stage .stamp.ok{color:#b8860b}
.bbx .stage .stamp.short{color:#d4143a}
.bbx .stage .stamp.fresh{animation:bbx-stamp .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes bbx-stamp{from{transform:translateX(-50%) rotate(-10deg) scale(2.4);opacity:0}}
.bbx .stage.lightset .l3 .body{box-shadow:0 1cqw 3cqw rgba(0,0,0,.25)}
.bbx .stage.lightset .bug .wm,.bbx .stage.lightset .clockw,.bbx .stage.lightset .clockw .big{color:#0b1220;text-shadow:none}
.bbx .stage.lightset .bug .wm span{color:#0a6fa0}
.bbx .stage.lightset .camlab{background:rgba(10,18,32,.82);border-color:rgba(10,18,32,.9)}
.bbx .stage.lightset .vign{background:radial-gradient(ellipse at center,transparent 65%,rgba(40,50,70,.25))}
/* the bill: what the Plus One costs, on a card the winner turns over */
.bbx .stage .bill{position:absolute;left:50%;top:22%;transform:translateX(-50%);width:20cqw;aspect-ratio:1.5;z-index:9;perspective:60cqw}
.bbx .stage .bill .in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.3,1.3,.5,1)}
.bbx .stage .bill.flip .in{transform:rotateY(180deg)}
.bbx .stage .bill .face{position:absolute;inset:0;border-radius:1cqw;backface-visibility:hidden;display:grid;place-items:center;text-align:center;
  box-shadow:0 2cqw 5cqw rgba(0,0,0,.5),inset 0 0 0 .2cqw rgba(255,255,255,.4)}
.bbx .stage .bill .front{background:linear-gradient(135deg,#0f2a44,#050c16);color:#22e1ff;font:700 1.2cqw 'Chakra Petch';letter-spacing:.3cqw}
.bbx .stage .bill .back{transform:rotateY(180deg);background:linear-gradient(135deg,#fff7d6,#f5c542);color:#2a1d00}
.bbx .stage .bill .back small{display:block;font:700 .9cqw 'Chakra Petch';letter-spacing:.3cqw;opacity:.7}
.bbx .stage .bill .back b{display:block;font:900 2.4cqw Archivo;font-stretch:110%;letter-spacing:.1cqw;margin-top:.4cqw}
.bbx .stage .bill.fresh{animation:bbx-billin .5s ease-out both}
@keyframes bbx-billin{from{opacity:0;transform:translateX(-50%) translateY(3cqw)}}
.bbx .stage .gt.plus .tile{box-shadow:inset 0 0 0 .2cqw #f5c542,0 0 3cqw rgba(245,197,66,.7)}
.bbx .stage .gt.passed{filter:grayscale(.9) brightness(.55)}
@media (prefers-reduced-motion:reduce){.stage .pass.now,.bbx .stage .col.grow .fill,.bbx .stage .stamp.fresh,.bbx .stage .bill .in,.bbx .stage .rail.lit .pass{animation:none!important;transition:none!important}}
.bbx .stage .bill.fresh .in{animation:bbx-billflip .9s .65s cubic-bezier(.3,1.3,.5,1) both}
@keyframes bbx-billflip{to{transform:rotateY(180deg)}}
@media (prefers-reduced-motion:reduce){.bbx .stage .bill.fresh .in{animation:none;transform:rotateY(180deg)}}

`;
