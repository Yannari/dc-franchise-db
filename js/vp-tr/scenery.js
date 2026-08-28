// ══════════════════════════════════════════════════════════════════════
// vp-tr/scenery.js — the turret, drawn once
// ══════════════════════════════════════════════════════════════════════
//
// Three planes, lit and focused differently, exactly as
// `mockup-tr-conclave.html` draws them:
//
//   BACKGROUND  the far wall, blurred, desaturated, low contrast (aerial
//               perspective — the cheapest thing that turns flat layers into
//               distance)
//   MIDGROUND   the arch, the moonlit lancet window, the light shafts, the
//               lantern on its chain, the dust hanging inside its cone, the
//               table
//   FOREGROUND  a near pillar and the table's lip, near-black and sharp
//
// It lives in its own file because Task 2 onwards need the same room from a
// different angle, and a second copy of a 200-line SVG is how two screens
// start disagreeing about where the window is.
//
// NOTHING HERE DRAWS FROM Math.random. The mockup seeded its embers and motes
// at boot; a VP screen is rebuilt on every paint and on every reveal, so a
// random field would swim. They are laid out from a hash of the episode
// instead: the same night has the same dust in it every time it is opened,
// and a different night has different dust.

/** A hash → [0,1) stream, so a night's dust is the same dust every time. */
export function _fieldRng(seed) {
  let h = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822519); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
}

/**
 * feTurbulence rendered ONCE into a data URI and tiled.
 *
 * A live turbulence filter over an 1100x3000px element costs frames on every
 * paint; a tile costs nothing after the first. Film grain, stone and vellum
 * fibre are all this function at different frequencies.
 */
export function _noiseTile(freq, octaves, seed, alpha, size) {
  const s = size || 220;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '">'
    + '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="' + freq
    + '" numOctaves="' + octaves + '" seed="' + seed + '" stitchTiles="stitch"/>'
    + '<feColorMatrix type="saturate" values="0"/>'
    + '<feComponentTransfer><feFuncA type="linear" slope="' + alpha + '"/></feComponentTransfer></filter>'
    + '<rect width="100%" height="100%" filter="url(#n)"/></svg>';
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
}

/**
 * The filter bank. Every surface on this screen is a surface because of it,
 * and no other screen in this repo uses SVG filters — which is what stops the
 * conclave reading as a recolour of anything already built.
 */
export function _filterBank() {
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>'
    + '<filter id="cvDeckle" x="-6%" y="-6%" width="112%" height="112%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.028 0.05" numOctaves="4" seed="17" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '<filter id="cvBloom" x="-120%" y="-120%" width="340%" height="340%">'
    + '<feGaussianBlur stdDeviation="16" result="b"/>'
    + '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>'
    + '</filter>'
    + '<filter id="cvBloomSoft" x="-140%" y="-140%" width="380%" height="380%">'
    + '<feGaussianBlur stdDeviation="34"/></filter>'
    + '<filter id="cvShaft" x="-30%" y="-30%" width="160%" height="160%">'
    + '<feGaussianBlur stdDeviation="13"/></filter>'
    + '<filter id="cvPit" x="0%" y="0%" width="100%" height="100%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="4" seed="3" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter>'
    + '<linearGradient id="cvBrass" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0%" stop-color="#f6d79a"/><stop offset="26%" stop-color="#c08a3c"/>'
    + '<stop offset="52%" stop-color="#8a5c22"/><stop offset="74%" stop-color="#e0a049"/>'
    + '<stop offset="100%" stop-color="#6a4418"/></linearGradient>'
    + '</defs></svg>';
}

/** The far plane: the back wall of the turret, pitted and falling off fast. */
export function _buildFar() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<pattern id="cvCourse" width="196" height="88" patternUnits="userSpaceOnUse">'
    + '<rect width="196" height="88" fill="#131722"/>'
    + '<path d="M0 0h196M0 44h196M0 88h196" stroke="#080a0f" stroke-width="4" opacity=".9"/>'
    + '<path d="M64 0v44M160 44v44" stroke="#080a0f" stroke-width="4" opacity=".9"/>'
    + '<path d="M0 3h196M0 47h196" stroke="#2b323f" stroke-width="1.2" opacity=".4"/>'
    + '<path d="M66 2v40M162 46v40" stroke="#2b323f" stroke-width="1" opacity=".3"/>'
    + '</pattern>'
    + '<radialGradient id="cvFarFall" cx="50%" cy="8%" r="86%">'
    + '<stop offset="0%" stop-color="#2a313d" stop-opacity=".8"/>'
    + '<stop offset="52%" stop-color="#11151d" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#04050a" stop-opacity=".95"/>'
    + '</radialGradient>'
    + '</defs>'
    + '<g filter="url(#cvPit)"><rect width="1100" height="1500" fill="url(#cvCourse)"/></g>'
    + '<rect width="1100" height="1500" fill="url(#cvFarFall)"/>'
    + '<path d="M470 1500V236a80 80 0 0 1 160 0v1264" fill="#05070c" opacity=".72"/>'
    + '</svg>';
}

/** The mid plane: window, lantern, cone, dust, table. */
export function _buildMid(seed) {
  const rng = _fieldRng('mid|' + seed);
  let s = '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs>'
    + '<linearGradient id="cvMoon" x1="0" y1="0" x2="0.4" y2="1">'
    + '<stop offset="0%" stop-color="#cfe0f5" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#8fa6c2" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="cvWarm" x1="0" y1="0" x2="0.2" y2="1">'
    + '<stop offset="0%" stop-color="#ffdb95" stop-opacity=".42"/>'
    + '<stop offset="55%" stop-color="#e0a049" stop-opacity=".12"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/></linearGradient>'
    + '<radialGradient id="cvEmber" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#ffe7b7" stop-opacity=".95"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="cvMote" cx="50%" cy="50%" r="50%">'
    + '<stop offset="0%" stop-color="#fff3d6" stop-opacity=".8"/>'
    + '<stop offset="100%" stop-color="#fff3d6" stop-opacity="0"/></radialGradient>'
    + '</defs>';

  // the moonlit lancet window, high on the left — a second, colder source
  s += '<g opacity=".9">'
    + '<path d="M120 470V196a52 52 0 0 1 104 0v274z" fill="#1d2836"/>'
    + '<path d="M126 464V198a46 46 0 0 1 92 0v266z" fill="#42566f"/>'
    + '<path d="M172 198v266M126 330h92" stroke="#0a0d13" stroke-width="7"/>'
    + '<path d="M120 470V196a52 52 0 0 1 104 0v274z" fill="none" stroke="#0a0d13" stroke-width="6"/>'
    + '</g>'
    + '<g filter="url(#cvShaft)" style="mix-blend-mode:screen">'
    + '<path d="M126 210 218 210 620 1500 -60 1500Z" fill="url(#cvMoon)" opacity=".5"/>'
    + '</g>';

  // the lantern on its chain, swinging very slightly
  s += '<g class="cv-sway" style="transform-origin:560px 0">'
    + '<path d="M560 0v186" stroke="url(#cvBrass)" stroke-width="3"/>'
    + '<g filter="url(#cvBloomSoft)" class="cv-bloom"><circle cx="560" cy="250" r="150" fill="#ffdb95" opacity=".5"/></g>'
    + '<g filter="url(#cvBloom)">'
    + '<path d="M524 190c0-30 72-30 72 0" stroke="url(#cvBrass)" stroke-width="5" fill="none"/>'
    + '<rect x="510" y="188" width="100" height="14" rx="3" fill="url(#cvBrass)"/>'
    + '<path d="M522 202h76v92h-76z" fill="rgba(255,219,149,.14)" stroke="url(#cvBrass)" stroke-width="5"/>'
    + '<path d="M544 202v92M576 202v92" stroke="url(#cvBrass)" stroke-width="3" opacity=".7"/>'
    + '<rect x="510" y="292" width="100" height="14" rx="3" fill="url(#cvBrass)"/>'
    + '<path class="cv-flame" d="M560 222c13 15 20 24 20 34a20 20 0 0 1-40 0c0-10 7-19 20-34z" fill="#ffe7b7"/>'
    + '<path class="cv-flame" d="M560 240c7 8 11 13 11 18a11 11 0 0 1-22 0c0-5 4-10 11-18z" fill="#fff8e6"/>'
    + '</g></g>';

  // the warm cone, the dust inside it, and the embers rising out of it
  let motes = '';
  for (let k = 0; k < 46; k++) {
    const t = rng();
    const spread = 60 + t * 370;
    const mx = 560 + (rng() - 0.5) * spread * 2;
    const my = 300 + t * 1100;
    const mr = 0.6 + rng() * 1.5;
    const md = 16 + rng() * 22, mdel = -rng() * 34;
    motes += '<circle class="cv-mote" cx="' + mx.toFixed(1) + '" cy="' + my.toFixed(1)
      + '" r="' + mr.toFixed(2) + '" fill="url(#cvMote)" style="animation-duration:'
      + md.toFixed(1) + 's;animation-delay:' + mdel.toFixed(1) + 's"/>';
  }
  let embers = '';
  for (let i = 0; i < 30; i++) {
    const x = 180 + rng() * 760, y = 620 + rng() * 880;
    const r = 1.2 + rng() * 2.8, d = 9 + rng() * 14, delay = -rng() * 18;
    embers += '<circle class="cv-ember" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1)
      + '" r="' + r.toFixed(1) + '" fill="url(#cvEmber)" style="animation-duration:'
      + d.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's"/>';
  }
  s += '<g class="cv-draught">'
    + '<g filter="url(#cvShaft)" style="mix-blend-mode:screen">'
    + '<path class="cv-cone" d="M500 250 620 250 940 1500 180 1500Z" fill="url(#cvWarm)"/>'
    + '</g><g>' + motes + '</g></g><g>' + embers + '</g>';

  // the table: an oval slab under the lantern, near edge catching the light
  s += '<g opacity=".9">'
    + '<ellipse cx="560" cy="700" rx="330" ry="86" fill="#0b0e14"/>'
    + '<ellipse cx="560" cy="694" rx="330" ry="86" fill="#1a202b"/>'
    + '<path d="M230 694a330 86 0 0 0 660 0" fill="none" stroke="rgba(255,219,149,.1)" stroke-width="2"/>'
    + '</g>';

  return s + '</svg>';
}

/** The fore plane: a pillar we are standing behind, and the table's lip. */
export function _buildFore() {
  return '<svg viewBox="0 0 1100 1500" preserveAspectRatio="xMidYMin slice">'
    + '<defs><linearGradient id="cvForeEdge" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#0a0d13"/><stop offset="100%" stop-color="#020306"/>'
    + '</linearGradient></defs>'
    + '<path d="M1010 0h90v1500h-90z" fill="url(#cvForeEdge)"/>'
    + '<path d="M1010 0v1500" stroke="rgba(255,219,149,.09)" stroke-width="2"/>'
    + '<path d="M0 1440q550 -110 1100 0v60H0z" fill="#020306"/>'
    + '<path d="M0 1440q550 -110 1100 0" fill="none" stroke="rgba(255,219,149,.13)" stroke-width="2.5"/>'
    + '</svg>';
}

const _CLOAK_PATH = 'M43 6c-15 0-23.5 11.2-23.5 25 0 7.2 2.6 12.6 5 16.2L6 100h74L62.5 47.2c2.4-3.6 5-9 5-16.2C67.5 17.2 58 6 43 6z';

/** One hooded silhouette at one distance. Three of them read as depth. */
function _heroCloak(cx, base, h, dim) {
  const k = h / 104;
  return '<g transform="translate(' + (cx - 43 * k).toFixed(1) + ',' + (base - h).toFixed(1)
    + ') scale(' + k.toFixed(3) + ')" opacity="' + dim + '">'
    + '<path d="' + _CLOAK_PATH + '" fill="#0d1219"/>'
    + '<ellipse cx="43" cy="30" rx="17" ry="19.5" fill="#000103"/>'
    + '<path d="M25 33c1.6-9.6 8-16.4 18-16.4" stroke="rgba(255,219,149,.42)" stroke-width="2.4" fill="none"/>'
    + '<path d="M19.5 33 6.5 99" stroke="rgba(255,219,149,.26)" stroke-width="2" fill="none"/>'
    + '<path d="M43 46 31 100M43 46l12 54M36 52 24 100" stroke="#000103" stroke-width="1.8" opacity=".7"/>'
    + '</g>';
}

/**
 * The hero plate's own scene.
 *
 * `count` is how many of them climbed. Silhouettes only, and deliberately: at
 * this size a face would be a portrait, and this is a chapter card.
 */
export function _buildHeroScene(count) {
  let s = '<svg class="cv-hero-scene" viewBox="0 0 1100 474" preserveAspectRatio="xMidYMid slice">'
    + '<defs>'
    + '<linearGradient id="cvHeroSky" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#131a26"/><stop offset="62%" stop-color="#090c13"/>'
    + '<stop offset="100%" stop-color="#04060a"/></linearGradient>'
    + '<linearGradient id="cvHeroShaft" x1="0" y1="0" x2="0.1" y2="1">'
    + '<stop offset="0%" stop-color="#ffdb95" stop-opacity=".5"/>'
    + '<stop offset="100%" stop-color="#e0a049" stop-opacity="0"/></linearGradient>'
    + '<linearGradient id="cvHeroFade" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="#04060a" stop-opacity="0"/>'
    + '<stop offset="72%" stop-color="#04060a" stop-opacity=".82"/>'
    + '<stop offset="100%" stop-color="#04060a" stop-opacity=".96"/></linearGradient>'
    + '</defs>'
    + '<rect width="1100" height="474" fill="url(#cvHeroSky)"/>';

  s += '<g opacity=".5" stroke="#212836" fill="none" stroke-width="3">'
    + '<path d="M550 12 210 200M550 12 890 200M550 12 340 300M550 12 760 300M550 12 550 320"/>'
    + '<path d="M210 200q340 92 680 0"/></g>';

  s += '<g fill="#070a10" opacity=".92">'
    + '<path d="M120 474V236a132 132 0 0 1 264 0v238z" opacity=".55"/>'
    + '<path d="M716 474V236a132 132 0 0 1 264 0v238z" opacity=".55"/></g>';

  s += '<g>'
    + '<path d="M550 0v96" stroke="url(#cvBrass)" stroke-width="3"/>'
    + '<g filter="url(#cvBloomSoft)" class="cv-bloom"><circle cx="550" cy="140" r="128" fill="#ffdb95" opacity=".55"/></g>'
    + '<g filter="url(#cvBloom)">'
    + '<path d="M526 100c0-20 48-20 48 0" stroke="url(#cvBrass)" stroke-width="4" fill="none"/>'
    + '<rect x="516" y="98" width="68" height="10" rx="2" fill="url(#cvBrass)"/>'
    + '<path d="M524 108h52v62h-52z" fill="rgba(255,219,149,.16)" stroke="url(#cvBrass)" stroke-width="4"/>'
    + '<path d="M541 108v62M559 108v62" stroke="url(#cvBrass)" stroke-width="2" opacity=".7"/>'
    + '<rect x="516" y="168" width="68" height="10" rx="2" fill="url(#cvBrass)"/>'
    + '<path class="cv-flame" d="M550 122c9 11 14 17 14 24a14 14 0 0 1-28 0c0-7 5-13 14-24z" fill="#ffe7b7"/>'
    + '</g></g>';

  s += '<g filter="url(#cvShaft)" style="mix-blend-mode:screen">'
    + '<path class="cv-cone" d="M512 130 588 130 880 474 220 474Z" fill="url(#cvHeroShaft)"/></g>';

  // Whoever actually climbed, at three distances. One Traitor alone gets the
  // near stand and nothing behind it, which is the correct picture of a pact
  // down to one and reads as one at a glance.
  const n = Math.max(1, Math.min(4, count || 1));
  const stands = [[550, 286, '1'], [360, 236, '.9'], [742, 250, '.94'], [452, 214, '.84']];
  const chosen = stands.slice(0, n).sort((a, b) => a[1] - b[1]);
  for (const [cx, h, dim] of chosen) s += _heroCloak(cx, 474, h, dim);

  s += '<path d="M0 452q550 -46 1100 0v22H0z" fill="#020306"/>'
    + '<path d="M0 452q550 -46 1100 0" fill="none" stroke="rgba(255,219,149,.16)" stroke-width="2"/>'
    + '<rect y="230" width="1100" height="244" fill="url(#cvHeroFade)"/>';

  return s + '</svg>';
}

/** The doorway the irony beat is watched through. */
export function _doorway() {
  return '<svg viewBox="0 0 600 400" preserveAspectRatio="none">'
    + '<path d="M0 0h600v400H0z M34 400V116a266 266 0 0 1 532 0v284z" fill="#03050a" fill-rule="evenodd"/>'
    + '<path d="M34 400V116a266 266 0 0 1 532 0v284" fill="none" stroke="rgba(255,214,150,.16)" stroke-width="2"/>'
    + '</svg>';
}
