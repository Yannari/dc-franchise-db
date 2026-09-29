// ══════════════════════════════════════════════════════════════════════
// The Traitors castle cutaway — scenery (mockup)
// ══════════════════════════════════════════════════════════════════════
//
// Everything here is vector and built from the real place and the real set:
// Ardross is red-sandstone Scots Baronial (a five-storey entrance tower with
// pepperpot turrets, crow-stepped gables, slate roofs, corniced stacks), and
// the show dresses its rooms in deep green, navy and burgundy walls, walnut
// panelling, tartan, brass and candlelight (production designer Mathieu
// Weekes: Knives Out and Clue). Furniture is drawn dark against lit walls so
// it reads as a silhouette at any zoom; light is gradients, never drawings.
(function () {
  // deterministic noise, so the same room always looks the same
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
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
      // armour
      s += `<g fill="#6a7484" opacity=".85"><circle cx="${w * .15}" cy="${h * .36}" r="7"/><rect x="${w * .15 - 9}" y="${h * .42}" width="18" height="${h * .22}" rx="4"/><rect x="${w * .15 - 8}" y="${h * .64}" width="6" height="${h * .22}"/><rect x="${w * .15 + 2}" y="${h * .64}" width="6" height="${h * .22}"/></g>`
        + `<path d="M${w * .15 + 14} ${h * .2} V${h * .86}" stroke="#8a95a6" stroke-width="2"/>`;
      // antlers
      s += `<path d="M${w * .84} ${h * .3} q-14 -10 -18 -24 M${w * .84} ${h * .3} q14 -10 18 -24 M${w * .84 - 9} ${h * .23} l-8 -4 M${w * .84 + 9} ${h * .23} l8 -4" stroke="#c9b28a" stroke-width="2.4" fill="none"/><rect x="${w * .84 - 6}" y="${h * .3}" width="12" height="14" rx="3" fill="#5a331b"/>`;
      s += floor(w, h * .86, h * .14);
      s += candle(w * .3, h * .5, 8, 40) + candle(w * .7, h * .5, 8, 40);
      return s;
    },
    // THE ROUND TABLE — the set built in the Great Hall: walnut, candles, tartan
    table(w, h) {
      let s = `<rect width="${w}" height="${h}" fill="#1b2a22"/>`;
      s += panelling(w, h * .12, h * .44);
      [.18, .82].forEach(f => { s += portrait(w * f - 18, h * .16, 36, 44, '#2a1a14'); });
      s += `<circle cx="${w / 2}" cy="${h * .6}" r="${h * .8}" fill="url(#candleGlow)" opacity=".9"/>`;
      s += floor(w, h * .82, h * .18, 'tartanRed');
      // the round table, seen from the doorway
      s += `<ellipse cx="${w / 2}" cy="${h * .74}" rx="${w * .3}" ry="${h * .1}" fill="#2a1408"/>`
        + `<ellipse cx="${w / 2}" cy="${h * .72}" rx="${w * .3}" ry="${h * .1}" fill="#4a2410"/>`
        + `<ellipse cx="${w / 2}" cy="${h * .72}" rx="${w * .22}" ry="${h * .065}" fill="#23402e"/>`;
      // high-backed chairs
      for (let i = 0; i < 9; i++) { const x = w * .22 + i * w * .07; s += `<path d="M${x} ${h * .72} v${-h * .22} q6 -8 12 0 v${h * .22}" fill="#1e0e06" opacity=".92"/>`; }
      [.36, .5, .64].forEach(f => { s += candle(w * f, h * .71, 10, 38); });
      return s;
    },
  };

  window.TRScenery = {
    DEFS,
    room(type, w, h, night) {
      const f = ROOMS[type] || ROOMS.landing;
      return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" style="position:absolute;inset:0">${DEFS}`
        + f(w, h, night) + `<rect width="${w}" height="${h}" fill="url(#vignette)"/></svg>`;
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
