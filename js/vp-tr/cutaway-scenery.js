// ══════════════════════════════════════════════════════════════════════
// vp-tr/cutaway-scenery.js — the castle, its rooms, the Round Table chamber
// ══════════════════════════════════════════════════════════════════════
//
// The stage (castle-stage.js) draws the day inside this castle. Everything
// here is vector and built from the real place and the real set: Ardross is
// red-sandstone Scots Baronial (a five-storey entrance tower with pepperpot
// turrets, crow-stepped gables, slate roofs, corniced stacks), and the show
// dresses its rooms in deep green, navy and burgundy walls, walnut panelling,
// tartan, brass and candlelight (production designer Mathieu Weekes: Knives
// Out and Clue). The Round Table chamber is drawn from the US set. Furniture is
// drawn dark against lit walls so it reads as a silhouette at any zoom; light
// is gradients, never drawings. Pure strings: no DOM, no state.
export const TRScenery = (function () {
  // deterministic noise, so the same room always looks the same
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      let h = s;
      h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }
  const R = (a, b, r) => a + (b - a) * r();

  // ── shared defs: tartan, stone, slate, gilt, glows ──────────────────
  const DEFS = `
  <defs>
    <pattern id="tartanRed" width="36" height="36" patternUnits="userSpaceOnUse">
      <rect width="36" height="36" fill="#5a1220"/>
      <rect x="0" y="12" width="36" height="8" fill="#1c3a2c" opacity=".75"/>
      <rect x="12" y="0" width="8" height="36" fill="#1c3a2c" opacity=".6"/>
      <rect x="0" y="27" width="36" height="2" fill="#d8b36a" opacity=".45"/>
      <rect x="27" y="0" width="2" height="36" fill="#d8b36a" opacity=".35"/>
      <rect x="0" y="4" width="36" height="1.5" fill="#0d1a2a" opacity=".6"/>
    </pattern>
    <pattern id="tartanGreen" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="#1b3527"/>
      <rect x="0" y="10" width="32" height="8" fill="#12203a" opacity=".7"/>
      <rect x="10" y="0" width="8" height="32" fill="#12203a" opacity=".55"/>
      <rect x="0" y="24" width="32" height="1.5" fill="#b3263a" opacity=".6"/>
      <rect x="24" y="0" width="1.5" height="32" fill="#b3263a" opacity=".5"/>
    </pattern>
    <pattern id="ashlar" width="22" height="10" patternUnits="userSpaceOnUse" patternTransform="scale(.62)">
      <rect width="22" height="10" fill="#7a3a2c"/>
      <rect x="0" y="0" width="22" height=".6" fill="#3a1812" opacity=".6"/>
      <rect x="0" y="5" width="22" height=".6" fill="#3a1812" opacity=".6"/>
      <rect x="10.5" y="0" width=".6" height="5" fill="#3a1812" opacity=".5"/>
      <rect x="0" y="5" width=".6" height="5" fill="#3a1812" opacity=".5"/>
      <rect x="2" y="1" width="7" height="3" fill="#8e4634" opacity=".3"/>
      <rect x="13" y="6" width="6" height="3" fill="#6a3024" opacity=".3"/>
    </pattern>
    <pattern id="ashlarIn" width="18" height="8" patternUnits="userSpaceOnUse" patternTransform="scale(.4)">
      <rect width="18" height="8" fill="#2a1a16"/>
      <path d="M0 0H18M0 4H18M9 0V4M0 4V8" stroke="#140b09" stroke-width=".7"/>
    </pattern>
    <pattern id="slate" width="16" height="10" patternUnits="userSpaceOnUse">
      <rect width="16" height="10" fill="#262b36"/>
      <rect x="0" y="9" width="16" height="1" fill="#15181f"/>
      <rect x="7.5" y="0" width="1" height="9" fill="#15181f" opacity=".7"/>
    </pattern>
    <pattern id="flags" width="60" height="30" patternUnits="userSpaceOnUse">
      <rect width="60" height="30" fill="#2a2622"/>
      <path d="M0 0H60M0 15H60M30 0V15M0 15V30" stroke="#17140f" stroke-width="1.4"/>
    </pattern>
    <linearGradient id="walnut" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#5a331b"/><stop offset="1" stop-color="#2e190c"/>
    </linearGradient>
    <linearGradient id="gilt" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f3d38a"/><stop offset=".5" stop-color="#a8792f"/><stop offset="1" stop-color="#e7c071"/>
    </linearGradient>
    <radialGradient id="flame"><stop offset="0" stop-color="#fff7d6"/><stop offset=".35" stop-color="#ffc463"/><stop offset="1" stop-color="#ff8a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="candleGlow"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
    <radialGradient id="fireGlow"><stop offset="0" stop-color="#ff9a3a" stop-opacity=".75"/><stop offset=".5" stop-color="#d4501a" stop-opacity=".3"/><stop offset="1" stop-color="#d4501a" stop-opacity="0"/></radialGradient>
    <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".8"/><stop offset=".4" stop-color="#ffc56b" stop-opacity=".25"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></radialGradient>
    <radialGradient id="moonGlow"><stop offset="0" stop-color="#c9d8ee" stop-opacity=".55"/><stop offset="1" stop-color="#8fa6c2" stop-opacity="0"/></radialGradient>
    <radialGradient id="vignette" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
    <linearGradient id="dayWin" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#dfe9f5"/><stop offset="1" stop-color="#9fb4cc"/></linearGradient>
    <linearGradient id="shaft" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e4eefa" stop-opacity=".22"/><stop offset="1" stop-color="#e4eefa" stop-opacity="0"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="softer"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`;

  // ── small parts ─────────────────────────────────────────────────────
  const candle = (x, y, h = 10, glow = 34) =>
    `<circle cx="${x}" cy="${y - h - 3}" r="${glow}" fill="url(#candleGlow)" class="flick"/>`
    + `<rect x="${x - 1.6}" y="${y - h}" width="3.2" height="${h}" rx="1" fill="#efe4c8"/>`
    + `<ellipse cx="${x}" cy="${y - h - 3.5}" rx="2.2" ry="4" fill="url(#flame)" class="flick"/>`;
  const candelabra = (x, y, s = 1) =>
    `<path d="M${x} ${y} v${-16 * s} M${x - 12 * s} ${y - 16 * s} q${12 * s} ${10 * s} ${24 * s} 0" stroke="url(#gilt)" stroke-width="${1.6 * s}" fill="none"/>`
    + `<rect x="${x - 6 * s}" y="${y - 2}" width="${12 * s}" height="3" fill="#8a6428"/>`
    + candle(x - 12 * s, y - 16 * s, 8 * s, 26 * s) + candle(x, y - 18 * s, 9 * s, 30 * s) + candle(x + 12 * s, y - 16 * s, 8 * s, 26 * s);
  const portrait = (x, y, w, h, tint) =>
    `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" fill="url(#gilt)"/>`
    + `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tint}"/>`
    + `<ellipse cx="${x + w / 2}" cy="${y + h * .42}" rx="${w * .22}" ry="${h * .2}" fill="#000" opacity=".28"/>`
    + `<path d="M${x + w * .2} ${y + h} q${w * .3} ${-h * .42} ${w * .6} 0Z" fill="#000" opacity=".3"/>`;
  const panelling = (w, top, h) => {
    let s = `<rect x="0" y="${top}" width="${w}" height="${h}" fill="url(#walnut)"/>`
      + `<rect x="0" y="${top}" width="${w}" height="4" fill="#7a4a26"/>`;
    const n = Math.max(3, Math.round(w / 46)), pw = w / n;
    for (let i = 0; i < n; i++) s += `<rect x="${i * pw + 5}" y="${top + 10}" width="${pw - 10}" height="${h - 18}" rx="2" fill="none" stroke="#1e1007" stroke-width="1.6" opacity=".8"/>`
      + `<rect x="${i * pw + 6}" y="${top + 11}" width="${pw - 12}" height="2" fill="#8a5a2e" opacity=".35"/>`;
    return s;
  };
  const floor = (w, top, h, rug) => `<rect x="0" y="${top}" width="${w}" height="${h}" fill="#1a130d"/>`
    + (rug ? `<rect x="${w * .12}" y="${top + 3}" width="${w * .76}" height="${h - 5}" fill="url(#${rug})" opacity=".9"/>` : '');
  const archWindow = (x, y, w, h, night) => {
    const mull = `<path d="M${x + w / 2} ${y} V${y + h} M${x} ${y + h * .42} H${x + w}" stroke="#15120e" stroke-width="3"/>`;
    return `<path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h}Z" fill="${night ? '#1a2638' : 'url(#dayWin)'}"/>`
      + mull + `<path d="M${x} ${y + h} V${y + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y + h}Z" fill="none" stroke="#3a2a1a" stroke-width="4"/>`;
  };
  const wall = (w, h, c1, c2) => `<rect width="${w}" height="${h}" fill="${c1}"/>`
    + `<rect width="${w}" height="${h}" fill="url(#wallShade${c2 ? '' : ''})" opacity="0"/>`;

  // ── the rooms ───────────────────────────────────────────────────────
  const ROOMS = {
    // THE GREAT HALL — burgundy, tall mullioned windows, portraits, long table
    hall(w, h, n) {
      const r = rng(11); let s = `<rect width="${w}" height="${h}" fill="#4a1420"/>`;
      s += `<rect width="${w}" height="${h * .12}" fill="#2a0a12"/>`;
      const wins = [.2, .5, .8];
      wins.forEach(f => { s += archWindow(w * f - 22, h * .1, 44, h * .5, n); });
      if (!n) wins.forEach(f => { s += `<path d="M${w * f - 22} ${h * .6} L${w * f + 22} ${h * .6} L${w * f + 70} ${h} L${w * f - 10} ${h}Z" fill="url(#shaft)"/>`; });
      [.35, .65].forEach(f => { s += portrait(w * f - 16, h * .16, 32, 40, '#3a2a22'); });
      s += panelling(w, h * .62, h * .24) + floor(w, h * .86, h * .14, 'tartanRed');
      // chandelier
      s += `<circle cx="${w / 2}" cy="${h * .08}" r="${h * .35}" fill="url(#lampGlow)" opacity=".6"/>`
        + `<path d="M${w / 2} 0 V${h * .07}" stroke="#8a6428" stroke-width="1.4"/>`
        + `<ellipse cx="${w / 2}" cy="${h * .09}" rx="26" ry="5" fill="none" stroke="url(#gilt)" stroke-width="2"/>`;
      // the long table
      s += `<rect x="${w * .18}" y="${h * .72}" width="${w * .64}" height="${h * .06}" fill="#241208"/>`
        + `<rect x="${w * .2}" y="${h * .78}" width="4" height="${h * .1}" fill="#1a0d06"/><rect x="${w * .8 - 4}" y="${h * .78}" width="4" height="${h * .1}" fill="#1a0d06"/>`;
      s += candelabra(w * .35, h * .72, .9) + candelabra(w * .65, h * .72, .9);
      return s;
    },
    // THE LIBRARY — forest green, full shelves, ladder, reading lamp, armchair
    library(w, h, n) {
      const r = rng(23); let s = `<rect width="${w}" height="${h}" fill="#17301f"/>`;
      const shelfTop = h * .08, shelfH = h * .7, rows = 4, rowH = shelfH / rows;
      s += `<rect x="${w * .04}" y="${shelfTop}" width="${w * .92}" height="${shelfH}" fill="#2a170b"/>`;
      const cols = ['#6b1a22', '#1f3a4a', '#2f4a2a', '#7a5a2a', '#4a2a4a', '#8a6a3a', '#3a1a12', '#1a2a3a', '#5a3a1a'];
      for (let row = 0; row < rows; row++) {
        let x = w * .05; const y = shelfTop + row * rowH;
        while (x < w * .95) {
          const bw = R(3, 7, r), bh = rowH * R(.62, .9, r);
          if (r() < .06) { x += R(6, 14, r); continue; }
          s += `<rect x="${x}" y="${y + rowH - bh - 3}" width="${bw}" height="${bh}" fill="${cols[Math.floor(r() * cols.length)]}"/>`
            + (r() < .5 ? `<rect x="${x}" y="${y + rowH - bh * .7}" width="${bw}" height="1.2" fill="#d8b36a" opacity=".5"/>` : '');
          x += bw + .6;
        }
        s += `<rect x="${w * .04}" y="${y + rowH - 3}" width="${w * .92}" height="4" fill="#3a2010"/>`;
      }
      // ladder
      s += `<path d="M${w * .7} ${shelfTop} L${w * .64} ${h * .86} M${w * .73} ${shelfTop} L${w * .67} ${h * .86}" stroke="#1a0d06" stroke-width="3"/>`;
      for (let k = 1; k < 8; k++) { const t = k / 8; s += `<path d="M${w * .7 - w * .06 * t} ${shelfTop + (h * .78) * t} h${w * .03}" stroke="#1a0d06" stroke-width="2.4"/>`; }
      s += floor(w, h * .86, h * .14, 'tartanGreen');
      // reading lamp + armchair (right) — the pool of light
      s += `<circle cx="${w * .86}" cy="${h * .5}" r="${h * .55}" fill="url(#lampGlow)"/>`
        + `<path d="M${w * .86} ${h * .52} V${h * .86}" stroke="#8a6428" stroke-width="2"/>`
        + `<path d="M${w * .84} ${h * .5} h${w * .04} l6 -12 h${-w * .04 - 12}Z" fill="#d9a35a"/>`
        + `<path d="M${w * .74} ${h * .86} v-${h * .2} q0 -${h * .1} ${w * .05} -${h * .1} q${w * .05} 0 ${w * .05} ${h * .1} v${h * .2}Z" fill="#3a1410"/>`;
      return s;
    },
    // THE KITCHEN — stone, the range and its fire, copper pans, the table
    kitchen(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="url(#flags)"/><rect width="${w}" height="${h}" fill="#3a2a1e" opacity=".55"/>`;
      // range / hearth arch with fire
      const hx = w * .12, hw = w * .3;
      s += `<circle cx="${hx + hw / 2}" cy="${h * .75}" r="${h * .7}" fill="url(#fireGlow)"/>`
        + `<path d="M${hx} ${h * .86} V${h * .35} a${hw / 2} ${h * .12} 0 0 1 ${hw} 0 V${h * .86}Z" fill="#120b07"/>`
        + `<path d="M${hx} ${h * .86} V${h * .35} a${hw / 2} ${h * .12} 0 0 1 ${hw} 0 V${h * .86}" fill="none" stroke="#6a4a32" stroke-width="6"/>`
        + `<ellipse cx="${hx + hw / 2}" cy="${h * .8}" rx="${hw * .3}" ry="${h * .08}" fill="url(#flame)" class="flick"/>`;
      // copper pans on a rail
      s += `<path d="M${w * .5} ${h * .18} H${w * .92}" stroke="#2a1a10" stroke-width="3"/>`;
      [.54, .62, .7, .79, .87].forEach((f, i) => {
        const r0 = 9 + (i % 3) * 3;
        s += `<path d="M${w * f} ${h * .18} v${8}" stroke="#2a1a10" stroke-width="1.5"/><circle cx="${w * f}" cy="${h * .18 + 8 + r0}" r="${r0}" fill="#b36a36"/><circle cx="${w * f - r0 * .3}" cy="${h * .18 + 8 + r0 * .7}" r="${r0 * .35}" fill="#e8a868" opacity=".6"/>`;
      });
      // the long kitchen table
      s += `<rect x="${w * .48}" y="${h * .66}" width="${w * .46}" height="${h * .05}" fill="#3a2414"/><rect x="${w * .5}" y="${h * .71}" width="4" height="${h * .15}" fill="#241408"/><rect x="${w * .92 - 4}" y="${h * .71}" width="4" height="${h * .15}" fill="#241408"/>`;
      s += floor(w, h * .86, h * .14);
      return s;
    },
    // A BEDROOM — navy, a four-poster, tartan blanket, moonlit window
    bed(w, h, n) {
      let s = `<rect width="${w}" height="${h}" fill="#141d33"/>`;
      s += archWindow(w * .1, h * .14, 34, h * .44, true)
        + `<circle cx="${w * .1 + 17}" cy="${h * .36}" r="${h * .55}" fill="url(#moonGlow)"/>`;
      // four-poster
      const bx = w * .45, bw = w * .42;
      s += `<rect x="${bx}" y="${h * .12}" width="4" height="${h * .74}" fill="#2a170b"/><rect x="${bx + bw - 4}" y="${h * .12}" width="4" height="${h * .74}" fill="#2a170b"/>`
        + `<rect x="${bx - 4}" y="${h * .1}" width="${bw + 8}" height="${h * .08}" fill="#3a1410"/>`
        + `<path d="M${bx} ${h * .18} q${bw * .1} ${h * .3} 0 ${h * .45}" fill="#4a1420" opacity=".85"/><path d="M${bx + bw} ${h * .18} q${-bw * .1} ${h * .3} 0 ${h * .45}" fill="#4a1420" opacity=".85"/>`
        + `<rect x="${bx}" y="${h * .58}" width="${bw}" height="${h * .2}" fill="url(#tartanRed)"/>`
        + `<rect x="${bx + 6}" y="${h * .52}" width="${bw * .25}" height="${h * .08}" rx="4" fill="#d9d2c0"/>`;
      s += candle(w * .92, h * .74, 9, 30);
      s += floor(w, h * .86, h * .14);
      return s;
    },
    // THE TURRET — the Traitors' room: round stone, slit windows, brazier, cloak
    turret(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="url(#ashlarIn)"/>`
        + `<rect width="${w}" height="${h}" fill="#1a0a0c" opacity=".35"/>`;
      // the round wall: dark at both edges, lit in the middle
      s += `<rect width="${w}" height="${h}" fill="url(#vignette)" opacity=".9"/>`;
      // arrow-slit windows with moonlight
      [.3, .7].forEach(f => { s += `<rect x="${w * f - 3}" y="${h * .18}" width="6" height="${h * .3}" rx="3" fill="#2a3a55"/><circle cx="${w * f}" cy="${h * .3}" r="${h * .25}" fill="url(#moonGlow)" opacity=".5"/>`; });
      // the brazier, low and to the left, where the figures don't cover it
      const bx = w * .1;
      s += `<circle cx="${bx}" cy="${h * .7}" r="${h * .75}" fill="url(#fireGlow)"/>`
        + `<path d="M${bx - 12} ${h * .64} h24 l-5 10 h-14Z" fill="#3a2414"/><path d="M${bx - 6} ${h * .74} l-4 ${h * .12} M${bx + 6} ${h * .74} l4 ${h * .12}" stroke="#3a2414" stroke-width="2.4"/>`
        + `<ellipse cx="${bx}" cy="${h * .6}" rx="10" ry="9" fill="url(#flame)" class="flick"/>`;
      // cloaks on hooks, right-hand wall
      [.86, .93].forEach((f, i) => { s += `<path d="M${w * f} ${h * .14} q-9 ${h * .3} -4 ${h * .66} h16 q2 ${-h * .38} -5 ${-h * .66}Z" fill="${i ? '#1f3a2e' : '#3a0a14'}"/>`; });
      // the table they meet at, candles on it
      s += `<ellipse cx="${w / 2}" cy="${h * .8}" rx="${w * .3}" ry="${h * .05}" fill="#2a160a"/>`;
      [.4, .5, .6].forEach(f => { s += candle(w * f, h * .79, 8, 30); });
      s += floor(w, h * .86, h * .14);
      return s;
    },
    // THE ALCOVE — confessional: burgundy velvet, wingback chair, lamp
    alcove(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="#2a0810"/>`;
      for (let i = 0; i < 12; i++) s += `<rect x="${i * w / 12}" y="0" width="${w / 24}" height="${h}" fill="#1a0409" opacity=".45"/>`;
      s += `<circle cx="${w / 2}" cy="${h * .45}" r="${h * .75}" fill="url(#lampGlow)" opacity=".75"/>`
        + `<path d="M${w / 2 - 30} ${h * .86} v${-h * .34} q0 ${-h * .28} 30 ${-h * .28} q30 0 30 ${h * .28} v${h * .34}Z" fill="#3a1a10"/>`
        + `<path d="M${w / 2 - 38} ${h * .86} v${-h * .2} h10 v${h * .2}Z M${w / 2 + 28} ${h * .86} v${-h * .2} h10 v${h * .2}Z" fill="#2a120a"/>`
        + `<path d="M${w * .84} ${h * .86} V${h * .3}" stroke="#8a6428" stroke-width="2"/><path d="M${w * .84 - 12} ${h * .3} h24 l-5 -12 h-14Z" fill="#d9a35a"/>`;
      s += floor(w, h * .86, h * .14, 'tartanRed');
      return s;
    },
    // THE LANDING — green, a staircase balustrade and a stained-glass window
    landing(w, h, n) {
      let s = `<rect width="${w}" height="${h}" fill="#1a2f22"/>`;
      const gx = w * .38, gw = w * .24;
      s += `<path d="M${gx} ${h * .6} V${h * .18} a${gw / 2} ${gw / 2} 0 0 1 ${gw} 0 V${h * .6}Z" fill="#1a1414"/>`;
      const panes = ['#b3263a', '#1f5a8a', '#d8b36a', '#2f6a3a', '#7a2a6a'];
      for (let i = 0; i < 12; i++) {
        const cx = gx + 6 + (i % 4) * (gw - 12) / 3.2, cy = h * .22 + Math.floor(i / 4) * h * .12;
        s += `<rect x="${cx}" y="${cy}" width="${(gw - 18) / 4}" height="${h * .1}" fill="${panes[i % panes.length]}" opacity="${n ? .35 : .75}"/>`;
      }
      s += `<path d="M${gx} ${h * .6} V${h * .18} a${gw / 2} ${gw / 2} 0 0 1 ${gw} 0 V${h * .6}Z" fill="none" stroke="#2a1a10" stroke-width="4"/>`;
      // staircase and banister
      s += `<path d="M0 ${h * .86} L${w * .7} ${h * .32} L${w} ${h * .32} V${h} H0Z" fill="#241408" opacity=".9"/>`
        + `<path d="M0 ${h * .7} L${w * .72} ${h * .18}" stroke="#5a331b" stroke-width="4"/>`;
      for (let k = 0; k < 10; k++) { const t = k / 10; s += `<path d="M${w * .72 * t} ${h * .7 - h * .52 * t} v${h * .16}" stroke="#3a2010" stroke-width="2"/>`; }
      return s;
    },
    // THE FRONT HALL — flagstones, the great door, a suit of armour, antlers
    front(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="#141a2a"/>`;
      s += `<path d="M${w * .38} ${h * .86} V${h * .3} a${w * .12} ${w * .12} 0 0 1 ${w * .24} 0 V${h * .86}Z" fill="#2a170b"/>`
        + `<path d="M${w / 2} ${h * .2} V${h * .86}" stroke="#1a0d06" stroke-width="2"/>`
        + `<circle cx="${w * .47}" cy="${h * .6}" r="2.5" fill="url(#gilt)"/><circle cx="${w * .53}" cy="${h * .6}" r="2.5" fill="url(#gilt)"/>`;
      // a clan banner on a pole, tartan with a fringe
      s += `<path d="M${w * .09} ${h * .18} H${w * .23}" stroke="url(#gilt)" stroke-width="3"/>`
        + `<rect x="${w * .1}" y="${h * .19}" width="${w * .12}" height="${h * .42}" fill="url(#tartanGreen)"/>`
        + `<path d="M${w * .1} ${h * .61} l${w * .03} ${h * .06} l${w * .03} ${-h * .06} l${w * .03} ${h * .06} l${w * .03} ${-h * .06}" fill="url(#tartanGreen)"/>`
        + `<circle cx="${w * .16}" cy="${h * .36}" r="${w * .03}" fill="#d8b15e" opacity=".85"/>`;
      // antlers
      s += `<path d="M${w * .84} ${h * .3} q-14 -10 -18 -24 M${w * .84} ${h * .3} q14 -10 18 -24 M${w * .84 - 9} ${h * .23} l-8 -4 M${w * .84 + 9} ${h * .23} l8 -4" stroke="#c9b28a" stroke-width="2.4" fill="none"/><rect x="${w * .84 - 6}" y="${h * .3}" width="12" height="14" rx="3" fill="#5a331b"/>`;
      s += floor(w, h * .86, h * .14);
      s += candle(w * .3, h * .5, 8, 40) + candle(w * .7, h * .5, 8, 40);
      return s;
    },
    // THE DRAWING ROOM — deep teal, a fireplace with a mirror over it, a sofa
    drawing(w, h, n) {
      let s = `<rect width="${w}" height="${h}" fill="#123236"/>`;
      s += `<rect width="${w}" height="${h * .1}" fill="#0b2023"/>`;
      s += archWindow(w * .08, h * .16, 30, h * .42, n);
      // the fireplace, centre, with its glow and the mirror over it
      const fx = w * .5;
      s += `<circle cx="${fx}" cy="${h * .76}" r="${h * .6}" fill="url(#fireGlow)" opacity=".8"/>`
        + `<rect x="${fx - 26}" y="${h * .14}" width="52" height="${h * .26}" fill="url(#gilt)"/><rect x="${fx - 22}" y="${h * .16}" width="44" height="${h * .22}" fill="#2a4448"/>`
        + `<rect x="${fx - 34}" y="${h * .5}" width="68" height="6" fill="#d9cfbf"/>`
        + `<path d="M${fx - 30} ${h * .86} V${h * .53} H${fx + 30} V${h * .86}Z" fill="#cfc4b0"/><path d="M${fx - 18} ${h * .86} V${h * .63} H${fx + 18} V${h * .86}Z" fill="#140a06"/>`
        + `<ellipse cx="${fx}" cy="${h * .8}" rx="12" ry="${h * .05}" fill="url(#flame)" class="flick"/>`;
      // a sofa to the right, a standard lamp beyond it
      s += `<path d="M${w * .66} ${h * .86} v${-h * .16} q0 -${h * .1} ${w * .03} -${h * .1} h${w * .16} q${w * .03} 0 ${w * .03} ${h * .1} v${h * .16}Z" fill="#4a1420"/>`
        + `<circle cx="${w * .93}" cy="${h * .44}" r="${h * .45}" fill="url(#lampGlow)" opacity=".7"/>`
        + `<path d="M${w * .93} ${h * .46} V${h * .86}" stroke="#8a6428" stroke-width="2"/><path d="M${w * .91} ${h * .46} h${w * .04} l5 -10 h${-w * .04 - 10}Z" fill="#d9a35a"/>`;
      [.28, .72].forEach(f => { s += portrait(w * f - 12, h * .2, 24, 30, '#1e3438'); });
      s += floor(w, h * .86, h * .14, 'tartanGreen');
      return s;
    },
    // THE BILLIARD ROOM — oxblood, the green table under its low lamp, a cue rack
    billiard(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="#3a0f14"/>`;
      s += panelling(w, h * .5, h * .36);
      // cue rack on the wall
      s += `<rect x="${w * .08}" y="${h * .14}" width="${w * .12}" height="4" fill="#2a170b"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${w * .09 + i * w * .025} ${h * .16} V${h * .62}" stroke="#c9a46a" stroke-width="1.6"/>`;
      s += portrait(w * .78, h * .16, 28, 34, '#2a1414');
      // the low lamp and its hard pool of light
      s += `<path d="M${w / 2} 0 V${h * .22}" stroke="#2a1a10" stroke-width="2"/>`
        + `<path d="M${w * .36} ${h * .3} L${w * .4} ${h * .22} H${w * .6} L${w * .64} ${h * .3}Z" fill="#1f3a2e"/>`
        + `<path d="M${w * .36} ${h * .3} L${w * .2} ${h * .74} H${w * .8} L${w * .64} ${h * .3}Z" fill="#fff2c8" opacity=".12"/>`;
      // the table: baize, cushions, legs, balls
      s += `<rect x="${w * .2}" y="${h * .66}" width="${w * .6}" height="${h * .08}" rx="3" fill="#1c5a36"/>`
        + `<rect x="${w * .2}" y="${h * .66}" width="${w * .6}" height="${h * .02}" fill="#3a1c0c"/>`
        + `<rect x="${w * .2}" y="${h * .74}" width="${w * .6}" height="${h * .04}" fill="#2a1408"/>`
        + `<rect x="${w * .23}" y="${h * .78}" width="6" height="${h * .08}" fill="#1a0c05"/><rect x="${w * .77 - 6}" y="${h * .78}" width="6" height="${h * .08}" fill="#1a0c05"/>`;
      [[.4, '#b3263a'], [.46, '#e8ddc1'], [.58, '#d8b15e'], [.63, '#b3263a']].forEach(([f, c]) => { s += `<circle cx="${w * f}" cy="${h * .69}" r="3" fill="${c}"/>`; });
      s += floor(w, h * .86, h * .14);
      return s;
    },
    // THE ROUND TABLE — its own dark chamber: walnut, amber lattice, the star table
    table(w, h) {
      let s = `<defs><pattern id="rmLattice" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#2a1406"/><path d="M5 0 L10 5 L5 10 L0 5Z" fill="#f0a848" opacity=".6"/></pattern></defs>`;
      s += `<rect width="${w}" height="${h}" fill="#0b0604"/>`;
      // lattice bays along the back wall, lit from behind
      for (let i = 0; i < 6; i++) {
        if (i === 2 || i === 3) continue;
        const x = w * (.06 + i * .15);
        s += `<rect x="${x}" y="${h * .14}" width="${w * .11}" height="${h * .42}" fill="url(#rmLattice)" stroke="#5a3010" stroke-width="2"/>`
          + `<rect x="${x}" y="${h * .14}" width="${w * .11}" height="${h * .42}" fill="#ffb35a" opacity=".12"/>`;
      }
      // the doorway at the head
      s += `<rect x="${w * .43}" y="${h * .1}" width="${w * .14}" height="${h * .48}" fill="#1a0c05" stroke="#5a3010" stroke-width="2"/>`;
      [.38, .62].forEach(f => { s += `<rect x="${w * f - 1}" y="${h * .12}" width="2" height="${h * .44}" fill="#ffb660" opacity=".7"/>`; });
      // the table: black rim, ring of white light, mahogany, the star
      const cx = w / 2, cy = h * .74, rx = w * .34, ry = h * .13;
      s += `<ellipse cx="${cx}" cy="${cy + 4}" rx="${rx}" ry="${ry}" fill="#1a0a03"/>`
        + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0d0907" stroke="#c9a04e" stroke-width="1.5"/>`
        + `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .85}" ry="${ry * .85}" fill="#7a3416" stroke="#fffaf0" stroke-width="1.5"/>`;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 - Math.PI / 2, L = i % 2 === 0 ? .78 : .52;
        const t = [cx + Math.cos(a) * rx * L, cy + Math.sin(a) * ry * L];
        const l = [cx + Math.cos(a - .22) * rx * .25, cy + Math.sin(a - .22) * ry * .25];
        const r = [cx + Math.cos(a + .22) * rx * .25, cy + Math.sin(a + .22) * ry * .25];
        s += `<polygon points="${cx},${cy} ${l} ${t}" fill="#efe3c4"/><polygon points="${cx},${cy} ${t} ${r}" fill="#141010"/>`;
      }
      s += `<ellipse cx="${cx}" cy="${cy - 3}" rx="${rx * .2}" ry="${ry * .2}" fill="#9a4a24" stroke="#d8b15e" stroke-width="1"/>`;
      // white light bars in the floor
      for (let i = 0; i < 9; i++) { const x = w * (.1 + i * .1); s += `<rect x="${x}" y="${h * .95}" width="${w * .03}" height="2" fill="#fffaf0" opacity=".8"/>`; }
      return s;
    },
  };

  // ── THE ROUND TABLE SET — drawn from the US show's chamber, not a banquet hall.
  // The table is a set built in its own room: a dark octagon of walnut panels,
  // each bay a brass lattice lit amber from behind, thin white light bars set in
  // the floor round the table, and a doorway at the head where the host stands in
  // a ring of light. No hearth, no windows, no tablecloth.
  function roundTableSet(w, h) {
    const hor = h * .5;
    let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="position:absolute;inset:0">${DEFS}
      <defs>
        <pattern id="rtLattice" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#2a1406"/>
          <path d="M9 0 L18 9 L9 18 L0 9Z" fill="#e39a3c" opacity=".55"/>
          <path d="M9 3 L15 9 L9 15 L3 9Z" fill="#ffcf7a" opacity=".5"/>
        </pattern>
        <linearGradient id="rtWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0604"/><stop offset=".6" stop-color="#2a1509"/><stop offset="1" stop-color="#140a05"/></linearGradient>
        <radialGradient id="rtBay" cx=".5" cy=".6" r=".7"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
        <radialGradient id="rtPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffdca0" stop-opacity=".22"/><stop offset=".7" stop-color="#ffdca0" stop-opacity=".06"/><stop offset="1" stop-color="#ffdca0" stop-opacity="0"/></radialGradient>
      </defs>`;
    s += `<rect width="${w}" height="${h}" fill="#070403"/>`;
    // the octagon's walls: a flat back face and two raked faces each side
    const faces = [
      [[0, 0], [w * .16, h * .1], [w * .16, hor + h * .08], [0, h * .8]],
      [[w * .16, h * .1], [w * .34, h * .04], [w * .34, hor - h * .02], [w * .16, hor + h * .08]],
      [[w * .34, h * .04], [w * .66, h * .04], [w * .66, hor - h * .02], [w * .34, hor - h * .02]],
      [[w * .66, h * .04], [w * .84, h * .1], [w * .84, hor + h * .08], [w * .66, hor - h * .02]],
      [[w * .84, h * .1], [w, 0], [w, h * .8], [w * .84, hor + h * .08]],
    ];
    const pt = p => p.map(q => q.join(',')).join(' ');
    faces.forEach((f, i) => {
      s += `<polygon points="${pt(f)}" fill="url(#rtWall)" stroke="#3d1f0c" stroke-width="3"/>`;
      if (i === 2) return;                       // the back face holds the doorway
      // two lattice bays per face, inset, lit from behind
      [.12, .56].forEach(t0 => {
        const t1 = t0 + .32, lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const top0 = lerp(f[0], f[1], t0), top1 = lerp(f[0], f[1], t1);
        const bot0 = lerp(f[3], f[2], t0), bot1 = lerp(f[3], f[2], t1);
        const m = (a, b, t) => lerp(a, b, t);
        const q = [m(top0, bot0, .22), m(top1, bot1, .22), m(top1, bot1, .82), m(top0, bot0, .82)];
        s += `<polygon points="${pt(q)}" fill="url(#rtLattice)" stroke="#6a3a14" stroke-width="3"/>`
          + `<polygon points="${pt(q)}" fill="url(#rtBay)"/>`;
      });
    });
    // the doorway at the head, and the host's ring of light on the floor
    const dx = w / 2, dw = w * .13;
    s += `<rect x="${dx - dw / 2}" y="${h * .1}" width="${dw}" height="${hor - h * .12}" fill="#1a0c05" stroke="#5a3010" stroke-width="4"/>`
      + `<path d="M${dx - dw / 2} ${h * .1} L${dx} ${h * .03} L${dx + dw / 2} ${h * .1}" fill="#1a0c05" stroke="#5a3010" stroke-width="4"/>`
      + `<rect x="${dx - dw * .38}" y="${h * .14}" width="${dw * .76}" height="${hor - h * .17}" fill="url(#rtLattice)" opacity=".35"/>`
      + `<ellipse cx="${dx}" cy="${hor - h * .03}" rx="${w * .06}" ry="${h * .022}" fill="none" stroke="#fff4dc" stroke-width="2" opacity=".8" filter="drop-shadow(0 0 6px #fff4dc)"/>`;
    // uprights between the faces, each with a warm strip of light up it
    [w * .16, w * .34, w * .66, w * .84].forEach((x, i) => {
      const top = i === 0 || i === 3 ? h * .1 : h * .04, bot = i === 0 || i === 3 ? hor + h * .08 : hor - h * .02;
      s += `<rect x="${x - 7}" y="${top}" width="14" height="${bot - top}" fill="#1d0e05"/>`
        + `<rect x="${x - 1.5}" y="${top + 10}" width="3" height="${bot - top - 20}" fill="#ffb660" opacity=".75" filter="drop-shadow(0 0 5px #ff9c3a)"/>`;
    });
    // the floor: near-black, with short white light bars set in it round the table
    s += `<path d="M0 ${h * .8} L${w * .16} ${hor + h * .08} L${w * .34} ${hor - h * .02} L${w * .66} ${hor - h * .02} L${w * .84} ${hor + h * .08} L${w} ${h * .8} V${h} H0Z" fill="#0b0604"/>`;
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * .95 + i * (Math.PI * 1.9 / 25) - Math.PI / 2;
      const r1 = 1.02, cx = w / 2, cy = h * .47, rx = w * .47, ry = h * .4;
      const x = cx + Math.cos(a) * rx * r1, y = cy + Math.sin(a) * ry * r1;
      const x2 = cx + Math.cos(a) * rx * (r1 + .05), y2 = cy + Math.sin(a) * ry * (r1 + .05);
      if (y < hor - h * .02) continue;
      s += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="#fffaf0" stroke-width="3" stroke-linecap="round" opacity=".85" filter="drop-shadow(0 0 4px #fff)"/>`;
    }
    s += `<ellipse cx="${w / 2}" cy="${h * .47}" rx="${w * .5}" ry="${h * .45}" fill="url(#rtPool)"/>`;
    s += `<rect width="${w}" height="${h}" fill="url(#vignette)"/></svg>`;
    return s;
  }
  // THE TABLE ITSELF, in perspective, on its own layer so threads draw over it.
  // Mahogany inlaid with a great eight-point star in cream and black, gold rays
  // under it; a black rim with gold stars and moon-phase discs, a thin ring of
  // white light on its inner edge; a raised drum in the middle with a crescent
  // moon set in it. `seats` puts a water glass at each place.
  function roundTable(cx, cy, rx, ry, seats) {
    const k = ry / rx;                                     // the perspective squash
    const P = (a, r) => [cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry];
    const pts = arr => arr.map(p => p.join(',')).join(' ');
    let s = `<defs>
        <radialGradient id="rtWood" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#a4502a"/><stop offset=".6" stop-color="#7a3416"/><stop offset="1" stop-color="#4e1d0a"/></radialGradient>
        <linearGradient id="rtDrumSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a1506"/><stop offset=".5" stop-color="#6e2e12"/><stop offset="1" stop-color="#3a1506"/></linearGradient>
        <radialGradient id="rtDrumTop" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#b35c30"/><stop offset="1" stop-color="#6a2c10"/></radialGradient>
      </defs>`;
    // shadow and the table's thickness
    s += `<ellipse cx="${cx}" cy="${cy + ry * .12}" rx="${rx * 1.01}" ry="${ry * 1.01}" fill="#000" opacity=".7"/>`
      + `<ellipse cx="${cx}" cy="${cy + ry * .07}" rx="${rx}" ry="${ry}" fill="#1a0a03"/>`;
    // the black rim, gold-edged
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0d0907" stroke="#c9a04e" stroke-width="2"/>`;
    // gold stars and circles round the rim
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, [x, y] = P(a, .93), r = rx * .014;
      s += i % 2
        ? `<circle cx="${x}" cy="${y}" r="${r * 1.3}" fill="none" stroke="#b8903f" stroke-width="1" opacity=".7"/>`
        : `<path d="M${x} ${y - r * 2 * k}L${x + r * .5} ${y - r * .5 * k}L${x + r * 2} ${y}L${x + r * .5} ${y + r * .5 * k}L${x} ${y + r * 2 * k}L${x - r * .5} ${y + r * .5 * k}L${x - r * 2} ${y}L${x - r * .5} ${y - r * .5 * k}Z" fill="#d8b15e" opacity=".85"/>`;
    }
    // the wood field, and the ring of white light round its edge
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .85}" ry="${ry * .85}" fill="url(#rtWood)"/>`
      + `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .855}" ry="${ry * .855}" fill="none" stroke="#fffaf0" stroke-width="2.5" filter="drop-shadow(0 0 5px #fff)"/>`;
    // fine gold rays under the star
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, [x1, y1] = P(a, .6), [x2, y2] = P(a, .8);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e0b870" stroke-width=".8" opacity="${i % 4 ? .18 : .4}"/>`;
    }
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .6}" ry="${ry * .6}" fill="none" stroke="#d8b15e" stroke-width="1.5" opacity=".7"/>`
      + `<ellipse cx="${cx}" cy="${cy}" rx="${rx * .8}" ry="${ry * .8}" fill="none" stroke="#d8b15e" stroke-width="1" opacity=".5"/>`;
    // the eight-point star: long cardinal points, short diagonals, each split light/dark
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 - Math.PI / 2, long = i % 2 === 0;
      const tip = P(a, long ? .8 : .56), l = P(a - (long ? .2 : .26), .27), r = P(a + (long ? .2 : .26), .27), c = [cx, cy];
      s += `<polygon points="${pts([c, l, tip])}" fill="#efe3c4"/>`
        + `<polygon points="${pts([c, tip, r])}" fill="#141010"/>`;
    }
    // moon-phase discs set in the rim, eight of them
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8, [x, y] = P(a, .93), r = rx * .038;
      const ph = i / 8, off = (ph * 2 - 1) * r * 2;
      s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * k * 1.15}" fill="#0a0808" stroke="#d8b15e" stroke-width="1.5"/>`
        + `<clipPath id="rtM${i}"><ellipse cx="${x}" cy="${y}" rx="${r * .8}" ry="${r * .8 * k * 1.15}"/></clipPath>`
        + `<g clip-path="url(#rtM${i})"><rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" fill="#f4ecd6"/>`
        + `<ellipse cx="${x + off}" cy="${y}" rx="${r * .95}" ry="${r * k * 1.15}" fill="#0a0808"/></g>`;
    }
    // the raised drum in the middle, with its crescent moon
    const dr = rx * .21, dh = ry * .16;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${dr}" ry="${dr * k}" fill="#1a0a03"/>`
      + `<path d="M${cx - dr} ${cy - dh} V${cy} A${dr} ${dr * k} 0 0 0 ${cx + dr} ${cy} V${cy - dh}Z" fill="url(#rtDrumSide)"/>`
      + `<ellipse cx="${cx}" cy="${cy - dh}" rx="${dr}" ry="${dr * k}" fill="url(#rtDrumTop)" stroke="#d8b15e" stroke-width="1.5"/>`
      + `<ellipse cx="${cx}" cy="${cy - dh}" rx="${dr * .82}" ry="${dr * k * .82}" fill="none" stroke="#d8b15e" stroke-width="1" opacity=".6"/>`
      + `<ellipse cx="${cx}" cy="${cy - dh}" rx="${dr * .5}" ry="${dr * k * .5}" fill="none" stroke="#d8b15e" stroke-width="1" opacity=".5"/>`;
    const mr = dr * .34, my = cy - dh;
    s += `<path d="M${cx + mr * .2} ${my - mr * k} A${mr} ${mr * k} 0 1 0 ${cx + mr * .2} ${my + mr * k} A${mr * .75} ${mr * k * .8} 0 1 1 ${cx + mr * .2} ${my - mr * k}Z" fill="#f0dca2" opacity=".9"/>`;
    // a water glass at every place
    if (seats) for (let i = 0; i < seats; i++) {
      const a = (-90 + i * 360 / seats) * Math.PI / 180;
      if (i === 0) continue;                             // the host stands; no glass
      const [x, y] = P(a + .09, .9);
      s += `<ellipse cx="${x}" cy="${y}" rx="${rx * .012}" ry="${rx * .012 * k}" fill="#fff" opacity=".35" stroke="#fff" stroke-width="1"/>`
        + `<rect x="${x - rx * .01}" y="${y - rx * .03}" width="${rx * .02}" height="${rx * .03}" fill="rgba(220,235,255,.25)" stroke="rgba(255,255,255,.6)" stroke-width="1"/>`;
    }
    return `<svg style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">${s}</svg>`;
  }

  return {
    DEFS, roundTableSet, roundTable,
    room(type, w, h, night) {
      const f = ROOMS[type] || ROOMS.landing;
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" style="position:absolute;inset:0">${DEFS}`
        + f(w, h, night) + `<rect width="${w}" height="${h}" fill="url(#vignette)"/></svg>`;
    },
    // ── AWAY FROM THE CASTLE: the road to the mission and back ─────────────
    // Full-frame sets (w × h screen pixels), because the road is not a room
    // the camera can fly into. `kind` is 'lane' (the single-track road, the
    // hill, the gates) or 'minibus' (inside it, the glens going past).
    // `light` is 'day', 'evening' or 'night'.
    backdrop(kind, w, h, light) {
      const night = light === 'night', eve = light === 'evening';
      let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" style="position:absolute;inset:0">${DEFS}
        <defs>
          <linearGradient id="bdSky" x1="0" y1="0" x2="0" y2="1">${night
            ? '<stop offset="0" stop-color="#05070d"/><stop offset="1" stop-color="#141a2a"/>'
            : eve ? '<stop offset="0" stop-color="#2a2a4a"/><stop offset=".55" stop-color="#b8687a"/><stop offset="1" stop-color="#f0a870"/>'
              : '<stop offset="0" stop-color="#8fa9c8"/><stop offset=".6" stop-color="#c9d4de"/><stop offset="1" stop-color="#e6dccb"/>'}</linearGradient>
          <linearGradient id="bdMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="${night ? .04 : .22}"/></linearGradient>
        </defs>`;
      const hills = (col1, col2, col3) =>
        `<path d="M0 ${h * .5} C${w * .15} ${h * .3} ${w * .3} ${h * .42} ${w * .45} ${h * .32} C${w * .6} ${h * .22} ${w * .78} ${h * .4} ${w} ${h * .3} V${h} H0Z" fill="${col1}"/>`
        + `<path d="M0 ${h * .6} C${w * .2} ${h * .48} ${w * .42} ${h * .6} ${w * .6} ${h * .5} C${w * .78} ${h * .42} ${w * .9} ${h * .56} ${w} ${h * .5} V${h} H0Z" fill="${col2}"/>`
        + `<rect y="${h * .5}" width="${w}" height="${h * .2}" fill="url(#bdMist)"/>`
        + `<path d="M0 ${h * .72} C${w * .3} ${h * .64} ${w * .6} ${h * .74} ${w} ${h * .66} V${h} H0Z" fill="${col3}"/>`;
      const c = night ? ['#0f1522', '#0b101a', '#080b10'] : eve ? ['#5a4a6a', '#3e3548', '#2a2a2a'] : ['#6e7a8e', '#4f5e4a', '#3a4a30'];
      if (kind === 'grounds' || kind === 'woodpile') {
        // the front of the castle from the gravel: red sandstone, the lit door,
        // the terrace balustrade, clipped hedges — and the log store, for the woodpile
        s += `<rect width="${w}" height="${h}" fill="url(#bdSky)"/>`;
        s += `<rect x="0" y="0" width="${w}" height="${h * .72}" fill="url(#ashlar)"/>`
          + `<rect x="0" y="0" width="${w}" height="${h * .72}" fill="${night ? '#05070d' : '#000'}" opacity="${night ? .55 : eve ? .25 : .12}"/>`;
        // tall windows either side, lit at night and in the evening
        [.12, .3, .7, .88].forEach(f => {
          s += `<rect x="${w * f - w * .035}" y="${h * .1}" width="${w * .07}" height="${h * .3}" fill="${night || eve ? '#ffcf7a' : '#2a3448'}" opacity="${night || eve ? .75 : .9}"/>`
            + `<path d="M${w * f} ${h * .1} V${h * .4} M${w * f - w * .035} ${h * .25} H${w * f + w * .035}" stroke="#3a1812" stroke-width="4"/>`
            + `<rect x="${w * f - w * .04}" y="${h * .4}" width="${w * .08}" height="${h * .02}" fill="#8e4634"/>`;
        });
        // the great door under its arch, and the lamps
        s += `<path d="M${w * .42} ${h * .72} V${h * .32} a${w * .08} ${h * .1} 0 0 1 ${w * .16} 0 V${h * .72}Z" fill="#8e4634"/>`
          + `<path d="M${w * .44} ${h * .72} V${h * .36} a${w * .06} ${h * .08} 0 0 1 ${w * .12} 0 V${h * .72}Z" fill="#2a170b"/>`
          + `<path d="M${w * .5} ${h * .3} V${h * .72}" stroke="#1a0d06" stroke-width="3"/>`
          + `<circle cx="${w * .5}" cy="${h * .5}" r="${h * .4}" fill="url(#lampGlow)" opacity="${night ? .9 : .4}"/>`
          + `<rect x="${w * .405}" y="${h * .42}" width="${w * .012}" height="${h * .05}" fill="#ffcf7a"/><rect x="${w * .583}" y="${h * .42}" width="${w * .012}" height="${h * .05}" fill="#ffcf7a"/>`;
        // the terrace: balustrade, then gravel, then the lawn's edge
        s += `<rect x="0" y="${h * .66}" width="${w}" height="${h * .06}" fill="#6e3226"/><rect x="0" y="${h * .64}" width="${w}" height="${h * .02}" fill="#9a5040"/>`;
        for (let x = 6; x < w; x += w * .018) { if (x > w * .41 && x < w * .59) continue; s += `<path d="M${x} ${h * .72} v${-h * .05} q${w * .006} ${-h * .012} 0 ${-h * .024}" stroke="#5a2a20" stroke-width="${w * .006}" fill="none"/>`; }
        s += `<rect x="0" y="${h * .72}" width="${w}" height="${h * .28}" fill="${night ? '#1a1a1e' : eve ? '#5a4e44' : '#7a6e5e'}"/>`;
        for (let i = 0; i < 90; i++) { const x = (i * 97) % w, y = h * .74 + ((i * 53) % (h * .24)); s += `<circle cx="${x}" cy="${y}" r="${1 + (i % 3)}" fill="#000" opacity=".12"/>`; }
        [.04, .2, .8, .96].forEach(f => { s += `<ellipse cx="${w * f}" cy="${h * .74}" rx="${w * .07}" ry="${h * .05}" fill="${night ? '#08100a' : '#1c2a18'}"/>`; });
        if (kind === 'woodpile') {
          // the log store against the wall on the left, under a slate lean-to
          const x0 = w * .03, x1 = w * .3, y0 = h * .44, y1 = h * .72;
          s += `<path d="M${x0 - 10} ${y0} L${x1 + 10} ${y0 - h * .05} V${y0 + 4} L${x0 - 10} ${y0 + h * .05}Z" fill="url(#slate)"/>`
            + `<rect x="${x0}" y="${y0 + h * .03}" width="${x1 - x0}" height="${y1 - y0 - h * .03}" fill="#2a170b"/>`;
          for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) {
            const cx = x0 + (c + .5 + (r % 2) * .5) * (x1 - x0) / 9.5, cy = y1 - (r + .5) * (y1 - y0 - h * .04) / 5;
            s += `<circle cx="${cx}" cy="${cy}" r="${(x1 - x0) / 21}" fill="#a0764a"/><circle cx="${cx}" cy="${cy}" r="${(x1 - x0) / 45}" fill="none" stroke="#6a4a2a" stroke-width="1.2"/>`;
          }
          s += `<path d="M${x1 + w * .03} ${h * .9} l${w * .02} ${-h * .12} M${x1 + w * .01} ${h * .9} h${w * .06}" stroke="#3a2414" stroke-width="5" stroke-linecap="round"/>`;
        }
      } else if (kind === 'minibus') {
        // the glens going past the windows, then the inside of the bus over them
        s += `<rect width="${w}" height="${h}" fill="url(#bdSky)"/>`;
        s += `<g class="trs-pass">${hills(c[0], c[1], c[2])}<g transform="translate(${w},0)">${hills(c[0], c[1], c[2])}</g></g>`;
        s += `<path d="M0 0 H${w} V${h * .12} H0Z M0 ${h * .56} H${w} V${h} H0Z" fill="#15171c"/>`;
        for (let i = 0; i < 4; i++) {
          const x = w * (.02 + i * .25);
          s += `<rect x="${x}" y="${h * .12}" width="${w * .025}" height="${h * .44}" fill="#15171c"/>`;
        }
        s += `<rect y="${h * .12}" width="${w}" height="${h * .44}" fill="none" stroke="#2a2d34" stroke-width="10"/>`
          + `<path d="M0 ${h * .1} H${w}" stroke="#8a95a6" stroke-width="4" opacity=".5"/>`;
        // seat backs, rows receding
        for (let i = 0; i < 5; i++) {
          const x = w * (.04 + i * .2), y = h * .62;
          s += `<path d="M${x} ${h} V${y + h * .08} q0 -${h * .08} ${w * .03} -${h * .08} h${w * .1} q${w * .03} 0 ${w * .03} ${h * .08} V${h}Z" fill="#1f2a44"/>`
            + `<rect x="${x + w * .02}" y="${y + h * .02}" width="${w * .12}" height="${h * .05}" rx="6" fill="#2a3656"/>`;
        }
        s += `<rect width="${w}" height="${h}" fill="${night ? '#000' : '#1a1206'}" opacity="${night ? .45 : .12}"/>`;
      } else {
        s += `<rect width="${w}" height="${h}" fill="url(#bdSky)"/>`;
        if (!night) s += `<circle cx="${w * (eve ? .78 : .22)}" cy="${h * (eve ? .44 : .2)}" r="${h * .5}" fill="url(#candleGlow)" opacity="${eve ? .8 : .35}"/>`;
        else s += `<circle cx="${w * .8}" cy="${h * .16}" r="22" fill="#e8ecf4"/><circle cx="${w * .8}" cy="${h * .16}" r="${h * .3}" fill="url(#moonGlow)"/>`;
        s += hills(c[0], c[1], c[2]);
        // the single-track lane, running away to the gates on the rise
        s += `<path d="M${w * .3} ${h} C${w * .42} ${h * .84} ${w * .5} ${h * .76} ${w * .52} ${h * .68} L${w * .54} ${h * .68} C${w * .58} ${h * .76} ${w * .66} ${h * .86} ${w * .78} ${h}Z" fill="${night ? '#1a1a1e' : '#7a6e5e'}"/>`
          + `<path d="M${w * .53} ${h * .7} C${w * .52} ${h * .8} ${w * .52} ${h * .9} ${w * .54} ${h}" stroke="${night ? '#2a2a30' : '#5e5446'}" stroke-width="3" fill="none" stroke-dasharray="4 10"/>`;
        // the drystone wall along it
        s += `<path d="M0 ${h * .8} C${w * .15} ${h * .78} ${w * .3} ${h * .74} ${w * .48} ${h * .69}" stroke="${night ? '#2a2d34' : '#8a8578'}" stroke-width="10" fill="none" stroke-linecap="round"/>`
          + `<path d="M0 ${h * .8} C${w * .15} ${h * .78} ${w * .3} ${h * .74} ${w * .48} ${h * .69}" stroke="${night ? '#1a1c22' : '#6a655a'}" stroke-width="10" fill="none" stroke-dasharray="3 7"/>`;
        // the gate posts on the rise, and the castle's lights beyond them
        s += `<rect x="${w * .505}" y="${h * .6}" width="5" height="${h * .09}" fill="#2a2d34"/><rect x="${w * .555}" y="${h * .6}" width="5" height="${h * .09}" fill="#2a2d34"/>`
          + `<path d="M${w * .51} ${h * .62} H${w * .555} M${w * .51} ${h * .65} H${w * .555}" stroke="#3a3d44" stroke-width="2"/>`;
        // heather and pines, foreground
        const pine = (x, y, hh) => `<path d="M${x} ${y - hh} L${x - hh * .28} ${y - hh * .45} L${x - hh * .14} ${y - hh * .45} L${x - hh * .36} ${y} L${x + hh * .36} ${y} L${x + hh * .14} ${y - hh * .45} L${x + hh * .28} ${y - hh * .45}Z" fill="${night ? '#05080c' : '#18221a'}"/>`;
        [[.06, .9, 170], [.12, .95, 220], [.9, .9, 190], [.96, .96, 240], [.84, .92, 140]].forEach(([x, y, hh]) => { s += pine(w * x, h * y, hh * h / 700); });
        const heather = night ? '#1a1020' : '#6a3a5a';
        for (let i = 0; i < 14; i++) s += `<ellipse cx="${w * (i / 13)}" cy="${h * (.96 + (i % 3) * .02)}" rx="${w * .05}" ry="${h * .04}" fill="${heather}" opacity=".85"/>`;
      }
      s += `<rect width="${w}" height="${h}" fill="url(#vignette)"/></svg>`;
      return s;
    },
    // ── the exterior: red sandstone Baronial, slate, and the light on it ──
    castle(night) {
      const rim = night ? 'rgba(143,166,194,.35)' : 'rgba(255,170,90,.55)';
      const crow = (x0, x1, y, peak) => {
        const steps = 6, dx = (x1 - x0) / 2 / steps, dy = (y - peak) / steps; let d = `M${x0} ${y}`;
        for (let i = 0; i < steps; i++) d += ` L${x0 + i * dx} ${y - (i + 1) * dy} L${x0 + (i + 1) * dx} ${y - (i + 1) * dy}`;
        for (let i = steps; i > 0; i--) d += ` L${x1 - (i - 1) * dx - dx} ${y - i * dy} L${x1 - (i - 1) * dx - dx} ${y - (i - 1) * dy}`;
        return d + ` L${x1} ${y} Z`;
      };
      let s = DEFS + `<defs>
        <linearGradient id="sunWash" x1="0" x2="1"><stop offset="0" stop-color="${night ? '#1a2638' : '#ff9a4a'}" stop-opacity="${night ? .35 : .28}"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
        <linearGradient id="shadeDown" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      </defs>`;
      const body = (d) => `<path d="${d}" fill="url(#ashlar)"/><path d="${d}" fill="url(#sunWash)"/><path d="${d}" fill="url(#shadeDown)"/>`;
      // wings
      s += body('M186 320 H704 V795 H186Z') + body('M916 320 H1424 V795 H916Z');
      s += `<path d="M186 322 L300 210 L604 210 L704 322Z" fill="url(#slate)"/><path d="M916 322 L1016 210 L1310 210 L1424 322Z" fill="url(#slate)"/>`;
      s += body(crow(186, 330, 322, 190)) + body(crow(1280, 1424, 322, 190));
      // dormers with lit windows
      [360, 470, 580, 1040, 1150, 1260].forEach((x, i) => {
        s += body(`M${x} 300 L${x} 262 L${x + 30} 240 L${x + 60} 262 L${x + 60} 300Z`)
          + `<rect x="${x + 18}" y="266" width="24" height="26" fill="${(night ? i % 2 : i % 3) ? '#ffcf7a' : '#1c2433'}" opacity="${night ? .85 : .7}"/><path d="M${x + 30} 266 V292" stroke="#3a1812" stroke-width="2"/>`;
      });
      // corniced stacks
      [[250, 170], [640, 180], [980, 180], [1360, 170]].forEach(([x, y]) => { s += body(`M${x} ${y} h34 v${230 - y} h-34Z`) + `<rect x="${x - 4}" y="${y - 6}" width="42" height="8" fill="#5a2a1e"/><rect x="${x + 6}" y="${y - 14}" width="8" height="10" fill="#8a4a2a"/><rect x="${x + 20}" y="${y - 12}" width="8" height="8" fill="#8a4a2a"/>`; });
      // the five-storey entrance tower, cap-house, pepperpots
      s += body('M690 150 H930 V795 H690Z') + body(crow(760, 860, 152, 92));
      const pepper = (cx, y) => body(`M${cx - 18} ${y} h36 v70 q-18 22 -36 0Z`) + `<path d="M${cx - 24} ${y} L${cx} ${y - 58} L${cx + 24} ${y}Z" fill="url(#slate)"/><circle cx="${cx}" cy="${y - 60}" r="3" fill="#c98a3a"/>`
        + `<rect x="${cx - 4}" y="${y + 20}" width="8" height="18" rx="4" fill="${night ? '#ffcf7a' : '#1c2433'}" opacity=".8"/>`;
      s += pepper(684, 118) + pepper(936, 118);
      // the porte-cochère arch at the foot of the tower
      s += `<path d="M740 795 V745 a70 50 0 0 1 140 0 V795" fill="#1a0c08" opacity=".0"/>`;
      // rim light along the roofs and tower edges
      s += `<path d="M186 322 L300 210 L604 210 L704 322 M916 322 L1016 210 L1310 210 L1424 322" fill="none" stroke="${rim}" stroke-width="2"/>`
        + `<path d="M690 150 V795" stroke="${rim}" stroke-width="3"/><path d="M186 320 V795" stroke="${rim}" stroke-width="3"/>`;
      // the grounds: a terrace with a balustrade, the gravel sweep, the lawn
      const lawn = night ? '#0c1410' : '#2e3a24', lawn2 = night ? '#09100c' : '#243020';
      const gravel = night ? '#1a1a1e' : '#6a5e50';
      s += `<rect x="0" y="802" width="1600" height="98" fill="${lawn}"/>`
        + `<path d="M0 860 C300 840 500 870 800 850 C1100 830 1300 866 1600 846 V900 H0Z" fill="${lawn2}"/>`
        + `<path d="M640 802 C600 840 520 870 380 900 H1240 C1100 870 1020 840 980 802Z" fill="${gravel}" opacity=".85"/>`
        + `<path d="M640 802 C600 840 520 870 380 900" stroke="#00000033" stroke-width="2" fill="none"/><path d="M980 802 C1020 840 1100 870 1240 900" stroke="#00000033" stroke-width="2" fill="none"/>`;
      // terrace wall and balustrade either side of the entrance
      [[150, 690], [930, 1460]].forEach(([x0, x1]) => {
        s += `<rect x="${x0}" y="792" width="${x1 - x0}" height="14" fill="url(#ashlar)"/><rect x="${x0}" y="778" width="${x1 - x0}" height="4" fill="#8e4634"/>`;
        for (let x = x0 + 6; x < x1 - 4; x += 12) s += `<path d="M${x} 792 v-10 q3 -3 0 -6 q-3 3 0 6" stroke="#6a3024" stroke-width="3" fill="none"/>`;
      });
      // the porte-cochère at the foot of the tower, lamp-lit
      s += `<path d="M734 802 V735 a76 56 0 0 1 152 0 V802Z" fill="url(#ashlar)"/><path d="M758 802 V742 a52 40 0 0 1 104 0 V802Z" fill="#140a07"/>`
        + `<circle cx="810" cy="770" r="60" fill="url(#lampGlow)" opacity="${night ? .9 : .45}"/>`
        + `<rect x="744" y="752" width="6" height="12" fill="#ffcf7a"/><rect x="870" y="752" width="6" height="12" fill="#ffcf7a"/>`;
      // clipped hedges along the terrace
      for (let x = 160; x < 1460; x += 58) { if (x > 700 && x < 930) continue; s += `<ellipse cx="${x}" cy="812" rx="16" ry="9" fill="${night ? '#08100a' : '#1c2a18'}"/>`; }
      return s;
    },
    // ── the landscape: sky, cloud, hills, pines, a loch ──────────────────
    land(night) {
      const r = rng(7);
      let s = '';
      const hill = (pts, fill, op = 1) => `<path d="M0 360 ${pts} L1600 360Z" fill="${fill}" opacity="${op}"/>`;
      s += hill('L0 150 C200 90 330 140 480 100 C640 60 760 120 900 90 C1080 55 1240 120 1420 80 L1600 110', night ? '#141b2b' : '#5a5570', .9);
      s += hill('L0 210 C180 170 380 215 560 180 C760 140 960 210 1160 175 C1340 145 1480 200 1600 180', night ? '#0f1522' : '#3a3548', 1);
      // pines, flanking the castle
      const pine = (x, y, h) => `<path d="M${x} ${y - h} L${x - h * .28} ${y - h * .45} L${x - h * .14} ${y - h * .45} L${x - h * .36} ${y} L${x + h * .36} ${y} L${x + h * .14} ${y - h * .45} L${x + h * .28} ${y - h * .45}Z" fill="${night ? '#070a10' : '#141a16'}"/>`;
      for (let i = 0; i < 26; i++) { const x = i < 13 ? R(0, 330, r) : R(1270, 1600, r); s += pine(x, R(300, 345, r), R(60, 120, r)); }
      // the loch
      s += `<rect x="0" y="330" width="1600" height="30" fill="${night ? '#0d1626' : '#7a6a7a'}" opacity=".55"/>`;
      return s;
    },
  };
})();
