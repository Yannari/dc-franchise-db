// ════════════════════════════════════════════════════════════════
//  ISLAND SETS — Total Drama's locations for the episode stage
// ════════════════════════════════════════════════════════════════
// One sets file per show. The engine (js/episode-stage.js) asks the show's
// profile (js/stage-shows.js) for its sets and never names a location itself.
// A set is { label, match, fx, far(time, scene), mid(time, scene), fg(time, scene) }
// plus optional forceTime, glow and fire; scene.groupColor tints a camp's flag.
//
// ════════════════════════════════════════════════════════════════
//  SETS — island locations, drawn in SVG (viewBox 1600×900).
//  Ground line sits near y=640 so standees (floor 30%) stand on it.
// ════════════════════════════════════════════════════════════════
const VB = 'viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"';
const svg = (inner, defs='') => `<svg ${VB} xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;

const TIMES = {
  morning:  { sky:['#7cc8ff','#ffe9c2'], sea:'#2f8fc4', sun:{x:300,y:260,r:70,c:'#fff3c4'}, tint:'#fff6e8', glow:0,   label:'Morning' },
  day:      { sky:['#4fb2ff','#bfe6ff'], sea:'#1f7fbf', sun:{x:1200,y:150,r:60,c:'#fffbe0'}, tint:'#ffffff', glow:0,   label:'Midday' },
  afternoon:{ sky:['#62a9e8','#ffd9a0'], sea:'#2a78b0', sun:{x:1250,y:300,r:70,c:'#ffe7a8'}, tint:'#fff0dc', glow:0,   label:'Afternoon' },
  dusk:     { sky:['#3d2c73','#ff8f5a'], sea:'#6b4a8a', sun:{x:1100,y:520,r:110,c:'#ffb36b'}, tint:'#ffc9a8', glow:.35, label:'Dusk' },
  night:    { sky:['#050818','#1b2553'], sea:'#0e1a3d', moon:{x:1250,y:170,r:55}, tint:'#8a98d8', glow:.6, label:'Night' },
};
function timeOf(text){
  const t = (text||'').toLowerCase();
  if (/night|midnight|tribal/.test(t)) return 'night';
  if (/dusk|sunset|evening/.test(t)) return 'dusk';
  if (/afternoon/.test(t)) return 'afternoon';
  if (/midday|noon|\bday\b|hot/.test(t)) return 'day';
  return 'morning';
}

// ── primitives ──
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
function palm(x, y, h, flip=1, cls='sway', dark='#1f5a2c'){
  const lean = 40*flip;
  const leaves = [-150,-110,-70,-30,10,50].map((a,i)=>{
    const r=a*Math.PI/180, L=h*.55, ex=Math.cos(r)*L, ey=Math.sin(r)*L*.55;
    return `<path d="M0 0 Q ${ex*.5} ${ey-60} ${ex} ${ey+40} Q ${ex*.45} ${ey-20} 0 12Z" fill="${i%2?dark:'#2e7d3c'}"/>`;
  }).join('');
  return `<g class="${cls}" style="transform-origin:${x}px ${y}px">
    <path d="M${x} ${y} Q ${x+lean*.4} ${y-h*.5} ${x+lean} ${y-h}" stroke="#6b4a2b" stroke-width="${h*.06}" fill="none" stroke-linecap="round"/>
    <path d="M${x} ${y} Q ${x+lean*.4} ${y-h*.5} ${x+lean} ${y-h}" stroke="#8a6238" stroke-width="${h*.06}" stroke-dasharray="6 14" fill="none"/>
    <g transform="translate(${x+lean} ${y-h})">${leaves}<circle cx="-8" cy="8" r="10" fill="#5a3b1c"/><circle cx="9" cy="10" r="9" fill="#6b4726"/></g></g>`;
}
function bush(x,y,s,c='#2a6b35'){ return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="70" ry="40" fill="${c}"/><ellipse cx="-45" cy="10" rx="45" ry="30" fill="${c}" opacity=".85"/><ellipse cx="50" cy="8" rx="50" ry="32" fill="#1f5228"/></g>`; }
function rock(x,y,s,c='#5b5f6b'){ return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-80 0 L-60 -55 L-10 -80 L45 -60 L80 0Z" fill="${c}"/><path d="M-10 -80 L45 -60 L80 0 L20 0Z" fill="#000" opacity=".2"/></g>`; }
function flame(x,y,s){ return `<g transform="translate(${x} ${y}) scale(${s})">
  <path class="flick" d="M0 0 C -40 -20 -30 -70 0 -120 C 30 -70 40 -20 0 0Z" fill="#ff7a1a"/>
  <path class="flick slow" d="M0 0 C -24 -14 -18 -50 0 -82 C 18 -50 24 -14 0 0Z" fill="#ffc53d"/>
  <path class="flick" d="M0 0 C -10 -8 -8 -26 0 -44 C 8 -26 10 -8 0 0Z" fill="#fff6c9"/></g>`; }
function torch(x,y,h){ return `<g><rect x="${x-6}" y="${y-h}" width="12" height="${h}" fill="#5a3a1f"/><path d="M${x-18} ${y-h} L${x+18} ${y-h} L${x+12} ${y-h+30} L${x-12} ${y-h+30}Z" fill="#3b2a18"/>${flame(x,y-h+2,.55)}</g>`; }
function ocean(y, c){ return `<rect x="0" y="${y}" width="1600" height="${900-y}" fill="${c}"/>
  <g class="wave"><path d="M-100 ${y+30} q 50 -14 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0 t 100 0" stroke="#ffffff55" stroke-width="4" fill="none"/></g>
  <g class="wave d2"><path d="M-100 ${y+80} q 60 -16 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0 t 120 0" stroke="#ffffff33" stroke-width="5" fill="none"/></g>`; }

// ── sky (shared) ──
function skySVG(time){
  const T = TIMES[time];
  let body = `<rect width="1600" height="900" fill="url(#sk)"/>`;
  if (T.moon){
    for (let i=0;i<90;i++){ const x=rnd()*1600, y=rnd()*520, r=rnd()*2+.6;
      body += `<circle class="twinkle" style="animation-delay:${-rnd()*2}s" cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`; }
    body += `<circle cx="${T.moon.x}" cy="${T.moon.y}" r="${T.moon.r*2.4}" fill="#cfd8ff" opacity=".12"/>
      <circle cx="${T.moon.x}" cy="${T.moon.y}" r="${T.moon.r}" fill="#eef1ff"/><circle cx="${T.moon.x+18}" cy="${T.moon.y-10}" r="${T.moon.r}" fill="#1b2553" opacity=".25"/>`;
  } else {
    const s=T.sun;
    body += `<circle class="shimmer" cx="${s.x}" cy="${s.y}" r="${s.r*2.6}" fill="${s.c}" opacity=".35"/><circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.c}"/>`;
    body += `<g class="cloud" opacity=".85"><ellipse cx="0" cy="170" rx="120" ry="34" fill="#fff"/><ellipse cx="60" cy="150" rx="80" ry="38" fill="#fff"/></g>
             <g class="cloud d2" opacity=".6"><ellipse cx="0" cy="300" rx="160" ry="30" fill="#fff"/><ellipse cx="-70" cy="285" rx="80" ry="30" fill="#fff"/></g>`;
  }
  return svg(body, `<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset=".75" stop-color="${T.sky[1]}"/></linearGradient>`);
}

// ── set library: each returns far / mid / fg SVG + particle kind ──
const SETS = {
  camp: {
    label:'Tribe Camp', match:/camp|shelter|fire pit|firepit|\bfire\b/,
    fx:'embers',
    far:t=>svg(`${ocean(470,TIMES[t].sea)}<path d="M1050 470 q 120 -90 260 -20 q 60 -30 110 20Z" fill="#1d4a2e" opacity=".8"/>`),
    mid:(t,sc)=>svg(`
      <path d="M0 520 Q 400 480 800 510 T 1600 500 V900 H0Z" fill="#e6c98f"/>
      <path d="M0 600 Q 500 570 1000 600 T 1600 590 V900 H0Z" fill="#d9b574"/>
      ${palm(120,560,380,1,'sway')}${palm(1500,560,420,-1,'sway d2')}${bush(1330,560,1.3)}${bush(250,570,1)}
      <g transform="translate(1120 590)">
        <path d="M-230 0 L-150 -250 L150 -250 L230 0" fill="none" stroke="#7a5230" stroke-width="18"/>
        <path d="M-250 -230 L0 -330 L250 -230 L180 -200 L0 -280 L-180 -200Z" fill="#7aa33a"/>
        <path d="M-250 -230 L0 -330 L250 -230" stroke="#4d6d1f" stroke-width="10" fill="none"/>
        ${[...Array(9)].map((_,i)=>`<path class="sway d${i%3+1}" style="transform-origin:${-200+i*50}px -225px" d="M${-200+i*50} -225 l -8 60 l 16 0Z" fill="#5f8a2b"/>`).join('')}
        <rect x="-170" y="-70" width="340" height="18" fill="#8a5a33"/><rect x="-160" y="-52" width="12" height="52" fill="#6b4726"/><rect x="148" y="-52" width="12" height="52" fill="#6b4726"/>
      </g>
      <g transform="translate(560 640)">
        <ellipse cx="0" cy="0" rx="120" ry="30" fill="#6b5a45"/>
        ${[...Array(10)].map((_,i)=>{const a=i/10*Math.PI*2;return `<ellipse cx="${Math.cos(a)*110}" cy="${Math.sin(a)*26}" rx="24" ry="14" fill="#7d7d86"/>`}).join('')}
        <path d="M-60 0 L60 -20 M-60 -20 L60 0" stroke="#4a2e17" stroke-width="16"/>
        ${flame(0,-4,1.1)}
      </g>
      <rect x="300" y="700" width="200" height="34" rx="16" fill="#7a4f2a"/><rect x="700" y="710" width="220" height="34" rx="16" fill="#6b4524"/>
      <g transform="translate(900 470)"><rect x="-4" y="0" width="8" height="160" fill="#5a3a1f"/><path class="sway" style="transform-origin:0 10px" d="M4 8 L110 30 L4 60Z" fill="${sc?.groupColor || '#e8453c'}"/></g>`),
    fg:t=>svg(`<g class="sway d3" style="transform-origin:0 0"><path d="M-40 -40 Q 200 60 330 -30 Q 190 110 -40 90Z" fill="#1c4f27"/></g>
      <g class="sway d2" style="transform-origin:1600px 0"><path d="M1640 -40 Q 1400 80 1250 -20 Q 1420 130 1640 110Z" fill="#17451f"/></g>`),
  },
  beach: {
    label:'The Beach', match:/beach|shore|sand|coast|boat|arriv|exile|redemption|lake/,
    fx:'spray',
    far:t=>svg(`${ocean(430,TIMES[t].sea)}<g class="bob"><path d="M1180 470 l 90 0 l -15 22 l -60 0Z" fill="#8a4b2a"/><path d="M1225 468 L1225 380 L1275 460Z" fill="#f2efe6"/></g>`),
    mid:t=>svg(`
      <path d="M0 560 Q 500 520 1000 555 T 1600 540 V900 H0Z" fill="#f0d9a3"/>
      <path class="shimmer" d="M0 565 Q 500 525 1000 560 T 1600 545" stroke="#fff" stroke-width="10" fill="none"/>
      <path d="M0 650 Q 600 620 1600 650 V900 H0Z" fill="#e9cc8c"/>
      ${palm(90,640,480,1,'sway')}${palm(260,650,340,1,'sway d3')}
      <path d="M1180 700 q 80 -30 180 -8 l 10 18 q -100 -10 -190 12Z" fill="#9b7a55"/>
      <g transform="translate(700 760)"><ellipse rx="22" ry="14" fill="#e0513a"/><path d="M-20 -6 l -16 -12 M20 -6 l 16 -12" stroke="#e0513a" stroke-width="6"/></g>
      ${[...Array(14)].map(()=>`<circle cx="${rnd()*1600}" cy="${660+rnd()*220}" r="${2+rnd()*3}" fill="#c9a86a"/>`).join('')}`),
    fg:t=>svg(`<g class="sway d2" style="transform-origin:1600px 0"><path d="M1640 -40 Q 1380 60 1270 -20 Q 1400 120 1640 100Z" fill="#1c4f27"/></g>`),
  },
  jungle: {
    label:'The Jungle', match:/jungle|trees|treeline|vine|forest|idol|path|banyan/,
    fx:'fireflies',
    far:t=>svg(`<rect width="1600" height="900" fill="#0f2d1b" opacity=".6"/>
      ${[...Array(12)].map((_,i)=>`<rect x="${i*140+rnd()*40}" y="0" width="${40+rnd()*30}" height="900" fill="#173b24"/>`).join('')}
      <path d="M0 420 Q 200 330 400 400 T 800 380 T 1200 400 T 1600 370 V900 H0Z" fill="#1b4a2b"/>`),
    mid:t=>svg(`
      <path d="M0 560 Q 400 530 800 560 T 1600 550 V900 H0Z" fill="#3a5a2a"/>
      <path d="M0 640 Q 600 610 1600 650 V900 H0Z" fill="#2f4b22"/>
      <g transform="translate(1150 600)">
        <path d="M-90 0 Q -80 -300 -40 -520 L 60 -520 Q 90 -300 110 0Z" fill="#5a4330"/>
        <path d="M-90 0 Q -160 -60 -260 20 M-60 0 Q -110 -30 -170 40 M100 0 Q 170 -50 280 20 M80 0 Q 130 -30 190 40" stroke="#5a4330" stroke-width="24" fill="none" stroke-linecap="round"/>
        <ellipse cx="5" cy="-210" rx="26" ry="40" fill="#1e140c"/>
        <ellipse cx="0" cy="-560" rx="330" ry="150" fill="#1f5a2c"/><ellipse cx="-160" cy="-520" rx="180" ry="100" fill="#26683a"/>
      </g>
      ${[...Array(9)].map((_,i)=>{const x=80+i*180; return `<path class="sway d${i%3+1}" style="transform-origin:${x}px 0px" d="M${x} -10 Q ${x+20} 200 ${x-10} ${260+rnd()*200}" stroke="#2d6b33" stroke-width="7" fill="none"/>`}).join('')}
      ${bush(250,640,1.4,'#28602f')}${bush(700,660,1.1,'#2c6a33')}`),
    fg:t=>svg(`<g class="sway" style="transform-origin:0 900px"><path d="M-60 900 Q 60 560 260 520 Q 180 700 140 900Z" fill="#0f3a1a"/><path d="M-60 900 Q 180 700 420 700 Q 260 800 200 900Z" fill="#134a21"/></g>
      <g class="sway d2" style="transform-origin:1600px 900px"><path d="M1660 900 Q 1520 600 1300 560 Q 1420 740 1460 900Z" fill="#0f3a1a"/></g>
      <g class="sway d3" style="transform-origin:800px 0"><path d="M500 -40 Q 800 120 1100 -40Z" fill="#0d3517"/></g>`),
  },
  well: {
    label:'The Well', match:/well|water run|bucket/,
    fx:'dust',
    far:t=>svg(`<path d="M0 470 Q 300 380 650 450 T 1300 420 T 1600 440 V900 H0Z" fill="#3f7a3a"/>${palm(1300,480,300,-1,'sway d2')}${palm(300,470,260,1,'sway d3')}`),
    mid:t=>svg(`
      <path d="M0 540 Q 500 510 1000 545 T 1600 530 V900 H0Z" fill="#b8a06a"/>
      <path d="M0 640 Q 700 610 1600 650 V900 H0Z" fill="#a88f5a"/>
      <g transform="translate(800 620)">
        <ellipse cx="0" cy="0" rx="190" ry="44" fill="#4b4b55"/>
        <path d="M-190 0 V -120 A190 44 0 0 1 190 -120 V 0 A190 44 0 0 1 -190 0Z" fill="#8a8a96"/>
        ${[...Array(4)].map((_,r)=>[...Array(6)].map((_,c)=>`<rect x="${-180+c*60+(r%2)*30}" y="${-112+r*28}" width="56" height="24" rx="5" fill="#9c9ca8" stroke="#5f5f6b" stroke-width="3"/>`).join('')).join('')}
        <ellipse cx="0" cy="-120" rx="190" ry="44" fill="#6d6d78"/><ellipse cx="0" cy="-120" rx="150" ry="30" fill="#141420"/>
        <rect x="-170" y="-330" width="20" height="210" fill="#6b4726"/><rect x="150" y="-330" width="20" height="210" fill="#6b4726"/>
        <path d="M-200 -330 L0 -420 L200 -330Z" fill="#8a3b2a"/><rect x="-160" y="-290" width="320" height="16" rx="8" fill="#7a5230"/>
        <g class="sway" style="transform-origin:40px -282px"><path d="M40 -282 V -190" stroke="#c9b27a" stroke-width="5"/><path d="M15 -190 h50 l -8 44 h-34Z" fill="#7a5230"/></g>
      </g>
      ${rock(250,690,.9,'#7d7a70')}${rock(1350,700,1.1,'#6f6c62')}`),
    fg:t=>svg(`<g class="sway d3" style="transform-origin:0 900px"><path d="M0 900 L40 760 L70 900 L110 780 L130 900Z" fill="#6f8a3a"/></g>
      <g class="sway d2" style="transform-origin:1600px 900px"><path d="M1600 900 L1560 740 L1530 900 L1490 790 L1470 900Z" fill="#6f8a3a"/></g>`),
  },
  fishing: {
    label:'The Fishing Rocks', match:/fish|rocks|tide|lagoon|reef/,
    fx:'spray',
    far:t=>svg(`${ocean(380,TIMES[t].sea)}${rock(1300,470,1.4,'#3b3f4a')}${rock(1450,460,.8,'#343844')}`),
    mid:t=>svg(`
      <rect x="0" y="560" width="1600" height="340" fill="${TIMES[t].sea}"/>
      <g class="wave"><path d="M-100 600 q 80 -20 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0" stroke="#ffffff66" stroke-width="6" fill="none"/></g>
      <path d="M-40 640 L200 520 L520 540 L760 600 L1000 560 L1300 590 L1640 540 V900 H-40Z" fill="#4a4e5a"/>
      <path d="M-40 700 L400 640 L900 680 L1640 640 V900 H-40Z" fill="#3c404b"/>
      <path d="M200 520 L520 540 L460 600 L240 590Z" fill="#5a5f6c"/>
      <ellipse class="shimmer" cx="1000" cy="760" rx="160" ry="30" fill="#6fb8e0"/>
      <path d="M560 560 Q 700 380 900 330" stroke="#8a6238" stroke-width="8" fill="none"/>
      <path class="sway" style="transform-origin:900px 330px" d="M900 330 Q 960 480 950 620" stroke="#ddd" stroke-width="2" fill="none"/>
      <circle class="bob" cx="950" cy="622" r="8" fill="#e8453c"/>`),
    fg:t=>svg(`${rock(80,900,2.4,'#2b2e36')}${rock(1560,900,2,'#2b2e36')}`),
  },
  cliff: {
    label:'The Cliff', match:/cliff|peak|ledge|summit|mountain|slope|lookout/,
    fx:'wind',
    far:t=>svg(`${ocean(620,TIMES[t].sea)}<path d="M0 620 L300 520 L520 620Z" fill="#355a3a" opacity=".6"/>`),
    mid:t=>svg(`
      <path d="M-40 900 L-40 560 L300 520 L700 540 L1000 520 L1250 560 L1320 900Z" fill="#6d6155"/>
      <path d="M-40 620 L300 580 L700 600 L1000 580 L1250 610 L1320 900 L-40 900Z" fill="#5c5147"/>
      <path d="M1250 560 L1320 900 L1290 900 L1230 600Z" fill="#3d352e"/>
      ${bush(200,560,.8,'#4d7a3a')}${palm(1150,560,260,-1,'sway')}`),
    fg:t=>svg(`<g class="cloud" opacity=".35"><ellipse cx="0" cy="760" rx="260" ry="50" fill="#fff"/></g>`),
  },
  challenge: {
    label:'Challenge Arena', match:/challenge|arena|course|crate|immunity|reward/,
    fx:'confetti',
    far:t=>svg(`${ocean(480,TIMES[t].sea)}`),
    mid:t=>svg(`
      <path d="M0 540 Q 800 500 1600 540 V900 H0Z" fill="#edd39a"/>
      ${[...Array(7)].map((_,i)=>`<g transform="translate(${130+i*220} 430)"><rect x="-4" y="0" width="8" height="140" fill="#555"/><path class="sway d${i%3+1}" style="transform-origin:4px 4px" d="M4 4 L90 22 L4 44Z" fill="${['#e8453c','#ffcc33','#3aa0ff','#40c060'][i%4]}"/></g>`).join('')}
      ${[0,1,2].map(k=>{const x=380+k*420; return [...Array(4-k%2)].map((_,j)=>`<g transform="translate(${x+(j%2)*14-60} ${600-j*72})"><rect width="120" height="72" fill="#b7843f" stroke="#6b4524" stroke-width="6"/><path d="M0 0 L120 72 M120 0 L0 72" stroke="#6b4524" stroke-width="5"/></g>`).join('')}).join('')}
      <g transform="translate(800 250)"><rect x="-6" y="0" width="12" height="130" fill="#444"/><path d="M-40 0 Q 0 -60 40 0Z" fill="#ffcc33" stroke="#8a6a00" stroke-width="5"/></g>
      <g transform="translate(1440 650)"><path d="M-80 0 L-60 -140 L60 -140 L80 0Z" fill="#7a2230"/><rect x="-95" y="-165" width="190" height="30" rx="6" fill="#a8323f"/><circle cx="0" cy="-80" r="34" fill="#ffcc33"/><path d="M-14 -80 l 10 12 l 20 -26" stroke="#7a2230" stroke-width="8" fill="none"/></g>`),
    fg:t=>svg(`<path d="M0 820 L1600 820 V900 H0Z" fill="#000" opacity=".15"/>`),
  },
  tribal: {
    label:'Tribal Council', match:/tribal|council|elimination|ceremony|vote/,
    fx:'embers', forceTime:'night',
    far:t=>svg(`<rect width="1600" height="900" fill="#0b1224"/>${[...Array(10)].map((_,i)=>`<rect x="${i*170}" y="200" width="60" height="700" fill="#0f1a30"/>`).join('')}`),
    mid:t=>svg(`
      <path d="M0 520 L1600 520 V900 H0Z" fill="#2a1f18"/>
      <ellipse cx="800" cy="700" rx="760" ry="170" fill="#3a2a1e"/>
      ${[...Array(9)].map((_,i)=>torch(120+i*170, 520, 230+(i%2)*40)).join('')}
      <g transform="translate(800 520)"><path d="M-260 -380 L-230 0 M260 -380 L230 0" stroke="#4a3320" stroke-width="30"/><path d="M-300 -390 Q 0 -460 300 -390 L 290 -350 Q 0 -410 -290 -350Z" fill="#5a3d24"/>
        ${[...Array(5)].map((_,i)=>`<path d="M${-220+i*110} -370 l 0 60" stroke="#c9b27a" stroke-width="4"/><circle cx="${-220+i*110}" cy="-300" r="14" fill="#d8cdb0"/>`).join('')}</g>
      <g transform="translate(800 700)"><ellipse rx="140" ry="36" fill="#1a120c"/>${[...Array(12)].map((_,i)=>{const a=i/12*Math.PI*2;return `<ellipse cx="${Math.cos(a)*130}" cy="${Math.sin(a)*30}" rx="26" ry="14" fill="#6d6d78"/>`}).join('')}${flame(0,-6,1.6)}</g>
      <g transform="translate(1320 640)"><rect x="-40" y="0" width="80" height="80" fill="#4a3320"/><path d="M-60 0 Q 0 -110 60 0Z" fill="#8a5a33" stroke="#3b2a18" stroke-width="6"/></g>`),
    fg:t=>svg(`<path d="M-20 900 L60 400 L90 400 L120 900Z" fill="#1a110a"/><path d="M1620 900 L1540 400 L1510 400 L1480 900Z" fill="#1a110a"/>`),
    glow:'radial-gradient(ellipse at 50% 78%,#ff7a1a66,transparent 60%)',
  },
};
SETS.dock = {
  label:'The Dock', match:/dock|pier/, fx:'spray',
  far:t=>svg(`${ocean(420,TIMES[t].sea)}<path d="M1100 425 q 140 -80 300 -10Z" fill="#1d4a2e" opacity=".7"/>`),
  mid:t=>svg(`
    <rect x="0" y="520" width="1600" height="380" fill="${TIMES[t].sea}"/>
    <g class="wave"><path d="M-100 560 q 80 -18 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0 t 160 0" stroke="#ffffff55" stroke-width="5" fill="none"/></g>
    <path d="M-60 640 L1450 585 L1480 610 L-60 690Z" fill="#9a6b3c"/>
    ${[...Array(16)].map((_,i)=>{const x=-40+i*95, y=640-i*3.4; return `<path d="M${x} ${y-2} L${x+4} ${y+50}" stroke="#6b4724" stroke-width="4"/><rect x="${x-8}" y="${y+40}" width="16" height="200" fill="#5a3a1f"/>`}).join('')}
    <path d="M-60 690 L1480 610 L1480 625 L-60 710Z" fill="#6b4724"/>
    <circle class="bob" cx="1300" cy="640" r="16" fill="#fff" stroke="#e8453c" stroke-width="7"/>
    ${palm(1540,590,380,-1,'sway d2')}`),
  fg:t=>svg(`<g class="sway d3" style="transform-origin:0 0"><path d="M-40 -40 Q 200 60 330 -30 Q 190 110 -40 90Z" fill="#1c4f27"/></g>`),
};
// The voting booth: a dark bamboo hut off the council, one torch, the urn on a stump table,
// a parchment and a marker. One voter at a time stands here.
SETS.booth = {
  label:'The Voting Booth', match:/voting booth|\bbooth\b/, fx:'embers', forceTime:'night', indoor:true,
  glow:'radial-gradient(ellipse at 30% 45%,#ff8a2a55,transparent 55%),radial-gradient(ellipse at 62% 70%,#ffb45a33,transparent 45%)',
  far:t=>svg(`<rect width="1600" height="900" fill="#1a0f08"/>
    ${[...Array(24)].map((_,i)=>`<rect x="${i*68}" y="0" width="60" height="900" fill="${i%2?'#2c1a0e':'#24150b'}"/><path d="M${i*68+30} 0 V900" stroke="#3a2412" stroke-width="3" opacity=".6"/>`).join('')}
    ${[160,330,500].map(y=>`<rect x="0" y="${y}" width="1600" height="14" fill="#3b2412" opacity=".8"/>`).join('')}`),
  mid:t=>svg(`
    <path d="M0 610 L1600 610 V900 H0Z" fill="#2a1c12"/>
    <path d="M0 610 L1600 610" stroke="#4a3220" stroke-width="6"/>
    ${[...Array(9)].map((_,i)=>`<ellipse cx="${90+i*180}" cy="${700+(i%2)*60}" rx="70" ry="16" fill="#241810"/>`).join('')}
    <g transform="translate(440 300)"><rect x="-10" y="0" width="20" height="130" fill="#4a3220"/><path d="M-26 0 L26 0 L18 34 L-18 34Z" fill="#3b2a18"/>${flame(0,2,.8)}</g>
    <g transform="translate(1000 610)">
      <path d="M-170 0 L-150 -170 L150 -170 L170 0Z" fill="#5a3a20"/>
      <ellipse cx="0" cy="-170" rx="160" ry="30" fill="#7a5230"/>
      ${[...Array(6)].map((_,i)=>`<ellipse cx="0" cy="-170" rx="${140-i*22}" ry="${26-i*4}" fill="none" stroke="#5a3a20" stroke-width="3"/>`).join('')}
      <g transform="translate(60 -178)">
        <path d="M-58 0 C -78 -40 -64 -110 -36 -130 L36 -130 C 64 -110 78 -40 58 0Z" fill="#9a5a2e" stroke="#2b1a0a" stroke-width="5"/>
        <ellipse cx="0" cy="-130" rx="38" ry="10" fill="#1a0f08" stroke="#2b1a0a" stroke-width="4"/>
        <path d="M-60 -70 Q 0 -54 60 -70" stroke="#c9a227" stroke-width="5" fill="none"/>
        <path d="M-52 -40 Q 0 -26 52 -40" stroke="#6b3a1a" stroke-width="4" fill="none"/>
      </g>
      <g transform="translate(-80 -186) rotate(-8)"><rect x="-44" y="-16" width="88" height="54" rx="4" fill="#efdcb0" stroke="#a08050" stroke-width="3"/>
        <path d="M-30 -2 h52 M-30 10 h40" stroke="#b09060" stroke-width="3"/></g>
      <g transform="translate(-10 -196) rotate(28)"><rect x="-4" y="-40" width="8" height="70" rx="3" fill="#222"/><path d="M-4 30 L0 42 L4 30Z" fill="#111"/></g>
    </g>`),
  fg:t=>svg(`<rect x="0" y="0" width="70" height="900" fill="#120a05"/><rect x="1530" y="0" width="70" height="900" fill="#120a05"/>
    <path d="M0 0 H1600 V60 H0Z" fill="#120a05"/>`),
};
SETS.booth.fire = [440, 300];
SETS.booth.amb = ['fire'];
SETS.island = { ...SETS.beach, label:'The Island', match:/$^/ };
// where the fire burns on a set (SVG coordinates) — embers rise from here
SETS.camp.fire = [560, 600];
SETS.tribal.fire = [800, 650];
// room sound (the engine's kinds: waves, wind, fire, birds, hum). Night swaps
// birds for crickets and adds crickets outdoors; rain is added by the weather.
// A set with `indoor: true` gets neither.
SETS.camp.amb = ['waves', 'fire'];
SETS.beach.amb = ['waves', 'birds'];
SETS.island.amb = ['waves', 'birds'];
SETS.jungle.amb = ['birds'];
SETS.well.amb = ['wind', 'birds'];
SETS.fishing.amb = ['waves'];
SETS.cliff.amb = ['wind'];
SETS.challenge.amb = ['waves', 'wind'];
SETS.tribal.amb = ['fire'];
SETS.dock.amb = ['waves'];
function pickSet(header){
  const h = (header||'').toLowerCase();
  for (const k of ['booth','tribal','challenge','dock','jungle','well','fishing','cliff','camp','beach']) if (SETS[k].match.test(h)) return k;
  return 'island';
}

export { SETS, TIMES, timeOf, skySVG, pickSet };
// drawing helpers, for the other sets files (js/stage-sets-kits.js)
export { svg, flame, palm, bush, rock, ocean, torch };
