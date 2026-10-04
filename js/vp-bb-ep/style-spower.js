// ══════════════════════════════════════════════════════════════════════
// vp-bb-ep/style-spower.js — the Secret Power Competition's doors (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// Numbered doors across the top of the yard. A door turns over to show its
// power; a won one shows its winner in violet (the viewer's secret, never the
// house's), an unclaimed one goes dark.
export const BBX_SPOWER_CSS = `
.bbx .stage .spboard{position:absolute;left:50%;transform:translateX(-50%);top:7.2cqw;z-index:7;padding:.6cqw 1.2cqw .8cqw;border-radius:1cqw;
  background:linear-gradient(180deg,rgba(14,6,26,.88),rgba(14,6,26,.64));box-shadow:0 0 0 .1cqw rgba(176,124,255,.42);backdrop-filter:blur(.6cqw)}
.bbx .stage .spboard .sph{display:block;text-align:center;font:700 .7cqw 'Chakra Petch';letter-spacing:.2cqw;color:#b07cff;margin-bottom:.5cqw}
.bbx .stage .spr{display:flex;justify-content:center;gap:.9cqw}
.bbx .stage .spd{position:relative;width:8.6cqw;display:flex;flex-direction:column;align-items:center;gap:.25cqw;padding:.5cqw .4cqw .55cqw;border-radius:.6cqw .6cqw .3cqw .3cqw;
  background:rgba(176,124,255,.08);box-shadow:inset 0 0 0 .12cqw rgba(176,124,255,.45)}
.bbx .stage .spd.shut{background:linear-gradient(180deg,#2a1748,#170c2a);box-shadow:inset 0 0 0 .14cqw rgba(176,124,255,.6)}
.bbx .stage .spd .spn{width:4.8cqw;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font:800 2.4cqw Archivo;color:rgba(176,124,255,.75)}
.bbx .stage .spf{position:relative;width:4.8cqw;aspect-ratio:1;border-radius:.45cqw;overflow:hidden;background:var(--c,rgba(255,255,255,.05))}
.bbx .stage .spf.none{display:flex;align-items:center;justify-content:center;font:800 1.8cqw Archivo;color:rgba(255,255,255,.3)}
.bbx .stage .spf img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.bbx .stage .spd b{font:800 .62cqw Archivo;text-transform:uppercase;color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bbx .stage .spd i{font:700 .55cqw 'Chakra Petch';letter-spacing:.08cqw;font-style:normal;color:#d7c2ff;text-align:center;line-height:1.2}
.bbx .stage .spd.won{box-shadow:inset 0 0 0 .18cqw #b07cff,0 0 1.8cqw rgba(176,124,255,.55);background:rgba(176,124,255,.16)}
.bbx .stage .spd.none{filter:brightness(.55) saturate(.4)}
.bbx .stage .spd.now{animation:bbx-spin .6s cubic-bezier(.2,1.4,.4,1) both}
@keyframes bbx-spin{from{transform:rotateY(80deg);opacity:.2}}
@media (prefers-reduced-motion:reduce){.bbx .stage .spd.now{animation:none}}
`;
