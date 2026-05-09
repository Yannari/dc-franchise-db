/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect */
const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ═══════════════════════════════════════════════════════════
//  CAST — fictional operatives (original characters)
// ═══════════════════════════════════════════════════════════
const CAST = [
  // ── Team RAVEN (Blue / Stealth-focused)
  { id: 'kiri', name: 'Kiri Vasque',  team: 'A', role: 'Recon Lead',     color: '#3aa0ff', initial: 'KV', hp: 100 },
  { id: 'darr', name: 'Darrow Ng',    team: 'A', role: 'Comms Tech',     color: '#3aa0ff', initial: 'DN', hp: 100 },
  { id: 'imo',  name: 'Imo Bekele',   team: 'A', role: 'Demo Specialist',color: '#3aa0ff', initial: 'IB', hp: 100 },
  { id: 'salo', name: 'Salo Kazinski',team: 'A', role: 'Field Medic',    color: '#3aa0ff', initial: 'SK', hp: 100 },
  // ── Team CRIMSON (Red / Aggressive)
  { id: 'ren',  name: 'Renz Halverson',team:'B', role: 'Strike Lead',    color: '#ff5e3a', initial: 'RH', hp: 100 },
  { id: 'tama', name: 'Tama Okoye',    team:'B', role: 'Heavy Weapons',  color: '#ff5e3a', initial: 'TO', hp: 100 },
  { id: 'velm', name: 'Velma Strauss', team:'B', role: 'Cryptographer',  color: '#ff5e3a', initial: 'VS', hp: 100 },
  { id: 'ozzy', name: 'Ozimar "Ozzy" Pell',team:'B', role: 'Wheelman',   color: '#ff5e3a', initial: 'OP', hp: 100 },
];

// Quick lookup
const C = Object.fromEntries(CAST.map(c => [c.id, c]));

// ═══════════════════════════════════════════════════════════
//  MAP — zones, with x/y % coords on the 1000x380 map svg
// ═══════════════════════════════════════════════════════════
const ZONES = {
  start_a:  { x: 4,  y: 84, label: 'INSERT POINT α',   side: 'A' },
  start_b:  { x: 4,  y: 38, label: 'INSERT POINT β',   side: 'B' },
  fence:    { x: 24, y: 60, label: 'PERIMETER FENCE' },
  flats:    { x: 36, y: 70, label: 'DRY LAKE FLATS' },
  motor:    { x: 36, y: 25, label: 'MOTOR POOL' },
  lasers:   { x: 52, y: 50, label: 'LASER GRID' },
  silo:     { x: 62, y: 78, label: 'MISSILE SILO 7' },
  comms:    { x: 62, y: 18, label: 'COMMS ARRAY' },
  vault:    { x: 78, y: 50, label: 'HANGAR BLACK' },
  exfil:    { x: 94, y: 50, label: 'EXFIL ROOF' },
};

// ═══════════════════════════════════════════════════════════
//  TIMELINE — 26 sequential events
// ═══════════════════════════════════════════════════════════
const TIMELINE = [
  // 0 ── Briefing
  { kind: 'briefing', icon: '⌬', who: 'MISSION CONTROL', tag: 'BRIEFING 04:12 UTC',
    body: <>Two squads are inserting at <em>Groom Lake perimeter</em>. Objective: locate <b>Hangar Black</b>, recover one (1) verified artifact, exfil before <b>05:30 sunrise</b>. First squad to extract a <em>confirmed</em> artifact wins. Decoys count for nothing. Aliens are real. Try not to embarrass us.</>,
    chips: [['warn','SUNRISE 04:12 → 05:30'], ['ok','OBJ: 1 ARTIFACT'], ['bad','NO BACKUP']],
    moves: [
      { id:'kiri', to:'start_a' },{ id:'darr', to:'start_a' },{ id:'imo', to:'start_a' },{ id:'salo', to:'start_a' },
      { id:'ren', to:'start_b' },{ id:'tama', to:'start_b' },{ id:'velm', to:'start_b' },{ id:'ozzy', to:'start_b' },
    ],
    artifacts: [
      { id:'rotor', name:'Magnetic Rotor', meta:'BAY 3 / unknown', status:'UNVERIFIED', state:'unknown' },
      { id:'crate', name:'Crate K-9',      meta:'COLD STORAGE',   status:'UNVERIFIED', state:'unknown' },
      { id:'glyph', name:'Stone Glyph',    meta:'BAY 1 / pedestal', status:'UNVERIFIED', state:'unknown' },
    ],
    tension: 18, phase: 'PHASE 1 · INSERT',
  },

  // 1 ── Movement
  { kind: 'movement', icon: '↗', who: 'TEAM RAVEN', tag: 'MOVEMENT', team: 'A',
    body: <><b>Kiri</b> takes point under the powerline corridor. Hand signals only — comms blackout for the first 200m. <b>Darrow</b> is stringing a passive relay back to the truck so they can phone home if it all goes wrong.</>,
    chips: [['team-a','RAVEN +180m'], ['ok','SILENT MOVE']],
    moves: [{ id:'kiri', to:'fence' },{ id:'darr', to:'fence' },{ id:'imo', to:'fence' },{ id:'salo', to:'fence' }],
    tension: 22,
  },

  // 2 ── Movement
  { kind: 'movement', icon: '↗', who: 'TEAM CRIMSON', tag: 'MOVEMENT', team: 'B',
    body: <><b>Renz</b> goes loud immediately — pushes north toward the <em>motor pool</em> hoping to lift a gate truck. <b>Ozzy</b> approves of this plan because Ozzy approves of any plan involving a vehicle.</>,
    chips: [['team-b','CRIMSON +220m'], ['warn','LOUD APPROACH']],
    moves: [{ id:'ren', to:'motor' },{ id:'tama', to:'motor' },{ id:'velm', to:'motor' },{ id:'ozzy', to:'motor' }],
    tension: 28,
  },

  // 3 ── Hazard interrupt
  { kind: 'hazard', icon: '⚡', who: 'PERIMETER FENCE', tag: 'HAZARD',
    body: <>The fence is <b>not</b> the original Cold-War chainlink. It's the new one — capacitive sensing. <em>Imo</em> catches it because she sees a hummingbird circle the wire and refuse to land. Demo charge swap. Everyone backs up six feet.</>,
    chips: [['warn','HAZARD: CAPACITIVE FENCE'], ['ok','DETECTED IN TIME']],
    causeEffect: { cause:'Imo logged ambient EMF at 1.4kHz', effect:'Swap thermite for ceramic shears (silent breach)'},
    hazardOn: 'fence',
    tension: 36,
  },

  // 4 ── Movement (recovers)
  { kind: 'movement', icon: '↗', who: 'TEAM RAVEN', tag: 'BREACH', team: 'A',
    body: <>Ceramic shears go through like butter. <b>Kiri</b> slips through first, then waves the rest in. They cross the dry lake flats hugging a culvert seam — visible from above for ~9 seconds. They make it.</>,
    chips: [['team-a','PERIMETER CLEAR'], ['ok','+1 STEALTH']],
    moves: [{ id:'kiri', to:'flats' },{ id:'darr', to:'flats' },{ id:'imo', to:'flats' },{ id:'salo', to:'flats' }],
    tension: 32,
  },

  // 5 ── Confessional
  { kind: 'confessional', icon: '◉', who: 'KIRI VASQUE — confessional', tag: 'PRIVATE FEED',
    body: <>I told them no live mics. Renz is running this like a fireworks show. Fine. Let them eat the search lights. We'll already be inside.</>,
    tension: 32,
  },

  // 6 ── Hazard for Crimson
  { kind: 'hazard', icon: '☢', who: 'MOTOR POOL', tag: 'CONTACT',
    body: <>Two MPs on smoke break. <b>Tama</b> sees them first and freezes the squad mid-stride. <em>Velma</em> spoofs the radio with a fake dispatch ("vehicle inspection bay 4, 30 mike") and the MPs ambling off — but a service drone overhead clocks the radio mismatch.</>,
    chips: [['bad','DRONE AWARE'], ['warn','TIMER STARTED'], ['team-b','CRIMSON UNHARMED']],
    causeEffect: { cause:'Velma\'s spoof used yesterday\'s callsign', effect:'Drone flags anomaly → 4-min response window'},
    hazardOn: 'motor',
    tension: 48,
  },

  // 7 ── Movement crimson
  { kind: 'movement', icon: '↗', who: 'TEAM CRIMSON', tag: 'HOTWIRE', team: 'B',
    body: <><b>Ozzy</b> hotwires a flatbed in 41 seconds — a personal record he announces over comms even though comms are supposed to be silent. They take it east toward the laser grid, lights off.</>,
    chips: [['team-b','VEHICLE: FLATBED'], ['warn','LIGHTS OFF']],
    moves: [{ id:'ren', to:'lasers' },{ id:'tama', to:'lasers' },{ id:'velm', to:'lasers' },{ id:'ozzy', to:'lasers' }],
    tension: 50,
  },

  // 8 ── Hazard / interrupt for crimson
  { kind: 'hazard', icon: '✦', who: 'LASER GRID', tag: 'INTERRUPT',
    body: <>The grid is invisible until <b>Renz</b> flicks a fistful of dust into the air. Lattice of red lines lights up like a harp. Truck cannot pass. <b>Velma</b> proposes climbing under it ("the sensors face up"). Tama proposes shooting them out. Renz picks Velma.</>,
    chips: [['bad','HAZARD: LASER LATTICE'], ['warn','VEHICLE LOST'], ['team-b','-90s DELAY']],
    causeEffect: { cause:'Truck would trip 14 beams', effect:'Abandon vehicle → crawl traverse'},
    hazardOn: 'lasers',
    tension: 58,
  },

  // 9 ── Discovery for raven
  { kind: 'discovery', icon: '⊕', who: 'TEAM RAVEN', tag: 'INTEL',
    body: <><em>Darrow</em> intercepts a maintenance ping: <b>"Bay 3 climate offline 04:38–04:52, rotor maintenance window."</b> That's a 14-minute door. <b>Imo</b> puts the rotor on the priority list. The glyph and the crate drop in confidence.</>,
    chips: [['ok','INTEL: ROTOR WINDOW'], ['team-a','+CONFIDENCE']],
    artifactUpdates: [
      { id:'rotor', meta:'BAY 3 / 04:38–04:52', status:'TARGETED', state:'targeted' },
    ],
    tension: 52,
  },

  // 10 ── Confessional Renz
  { kind: 'confessional', icon: '◉', who: 'RENZ HALVERSON — confessional', tag: 'PRIVATE FEED',
    body: <>Crawling. We're crawling. On our bellies. Past lasers. Like bad cinema. If anyone tells the regiment about this I will personally—</>,
    tension: 56,
  },

  // 11 ── Movement raven
  { kind: 'movement', icon: '↗', who: 'TEAM RAVEN', tag: 'INFIL', team: 'A',
    body: <>Raven cuts north along the silo service road. <b>Salo</b> stays back at a maintenance shed as a fallback medic point. The other three press toward the comms array.</>,
    chips: [['team-a','RAVEN +400m'], ['ok','MEDIC STATIONED']],
    moves: [{ id:'kiri', to:'comms' },{ id:'darr', to:'comms' },{ id:'imo', to:'comms' },{ id:'salo', to:'silo' }],
    tension: 60,
  },

  // 12 ── Hazard for raven (mine)
  { kind: 'hazard', icon: '◈', who: 'SILO ROAD', tag: 'INTERRUPT',
    body: <><b>Salo</b> takes the silo road and hits a <em>seismic disc</em> — not a mine, a sensor. A floodlight 80m away clicks on and tracks her. She freezes. The light holds for 22 seconds. Then sweeps off. She's lucky.</>,
    chips: [['warn','HAZARD: SEISMIC DISC'], ['ok','UNDETECTED'], ['team-a','SALO: SHAKEN']],
    causeEffect: { cause:'Salo stepped on disc 7-East', effect:'Floodlight scan triggered → freeze, no alert'},
    hazardOn: 'silo',
    statusUpdates: [{ id:'salo', status:'WARN' }],
    tension: 64,
  },

  // 13 ── Movement crimson
  { kind: 'movement', icon: '↗', who: 'TEAM CRIMSON', tag: 'PROGRESS', team: 'B',
    body: <>Crimson clears the laser lattice — caked in dust and vinegar from Renz's hidden flask. They cross to the missile silo perimeter and start scaling the siding. <b>Tama</b> goes up first because Tama is the only one who can take Renz's weight on belay.</>,
    chips: [['team-b','CRIMSON +280m']],
    moves: [{ id:'ren', to:'silo' },{ id:'tama', to:'silo' },{ id:'velm', to:'silo' },{ id:'ozzy', to:'silo' }],
    tension: 66,
  },

  // 14 ── Alien event
  { kind: 'alien', icon: '◉', who: 'COMMS ARRAY', tag: 'ANOMALY',
    body: <><em>Kiri</em> sees something move across the dish. Not a person. <b>Three meters tall.</b> No reflection in the dish glass. It pauses, tilts its head 84 degrees off-axis, and walks on. Kiri does not breathe for sixteen seconds. <b>The artifacts are alive.</b></>,
    chips: [['alien','SUBJECT: UNKNOWN'], ['warn','RAVEN: HOLD POSITION']],
    artifactUpdates: [
      { id:'glyph', status:'ACTIVE', state:'alive', meta:'BAY 1 / AMBULATORY' },
    ],
    tension: 80,
  },

  // 15 ── Confessional darrow
  { kind: 'confessional', icon: '◉', who: 'DARROW NG — confessional', tag: 'PRIVATE FEED',
    body: <>I'm a comms tech. I trained for radios. They did not cover this in radio school. They did not cover this in any school.</>,
    tension: 78,
  },

  // 16 ── Discovery for crimson
  { kind: 'discovery', icon: '⊕', who: 'TEAM CRIMSON', tag: 'INTEL',
    body: <><b>Velma</b> cracks a maintenance crate at silo 7. Inside: a clipboard with a hand-drawn map of the hangar interior — <em>and a circle around "K-9"</em>. Someone inside is helping. Or wants them to think someone is.</>,
    chips: [['ok','INTEL: INSIDE MAP'], ['warn','UNVERIFIED SOURCE']],
    artifactUpdates: [{ id:'crate', meta:'COLD STORAGE / circled', status:'TARGETED', state:'targeted' }],
    tension: 76,
  },

  // 17 ── Hazard
  { kind: 'hazard', icon: '✦', who: 'HANGAR BLACK', tag: 'CONTACT',
    body: <>Both teams arrive at the hangar within 90 seconds of each other. Doors are already open. Inside: <b>fog</b>. The fog is room temperature. The fog is moving against the ventilation.</>,
    chips: [['alien','ATMOSPHERIC ANOMALY'], ['warn','BOTH TEAMS PRESENT']],
    moves: [{ id:'kiri', to:'vault' },{ id:'darr', to:'vault' },{ id:'imo', to:'vault' },
            { id:'ren', to:'vault' },{ id:'tama', to:'vault' },{ id:'velm', to:'vault' },{ id:'ozzy', to:'vault' }],
    hazardOn: 'vault',
    tension: 86,
  },

  // 18 ── Confrontation
  { kind: 'interrupt', icon: '⚠', who: 'INSIDE THE HANGAR', tag: 'STANDOFF',
    body: <>Squads see each other across the fog. Renz raises a fist. Kiri raises an open palm. <em>Nobody fires.</em> Both teams know the second they make noise the <b>real</b> hosts of this room are going to notice them. They split: Raven left toward Bay 3, Crimson right toward Cold Storage.</>,
    chips: [['warn','TRUCE: SILENT'], ['ok','NO CASUALTIES']],
    tension: 88,
  },

  // 19 ── Hazard (raven loss)
  { kind: 'hazard', icon: '☢', who: 'BAY 3', tag: 'CASUALTY',
    body: <>The rotor is not on a pedestal. It is <b>floating</b>, eight inches above the floor. <em>Imo</em> reaches for it. The pulse blast sends her back ten feet into a tool rack. She's breathing. She is not standing up.</>,
    chips: [['hot','IMO: DOWN'], ['team-a','-1 OPERATOR'], ['warn','ARTIFACT HOSTILE']],
    causeEffect: { cause:'Imo broke field plane', effect:'Magnetic rotor discharge → Imo concussed'},
    statusUpdates: [{ id:'imo', status:'HOT', injured:true, hp:35 }],
    artifactUpdates: [{ id:'rotor', state:'alive', status:'HOSTILE', meta:'BAY 3 / FIELD ACTIVE' }],
    tension: 94,
  },

  // 20 ── Discovery / decision
  { kind: 'discovery', icon: '⊕', who: 'TEAM CRIMSON', tag: 'RECOVERY',
    body: <><b>Ozzy</b> opens Crate K-9 with the diagram from the clipboard. Inside: a <em>stone tablet</em>, palm-sized, perfectly cool, with one symbol carved into it — the same symbol Kiri saw on the comms-array creature. <b>Velma calls it.</b> "This is the real one. Move."</>,
    chips: [['ok','ARTIFACT: VERIFIED'], ['team-b','+CRATE K-9']],
    artifactUpdates: [{ id:'crate', state:'confirmed', status:'CONFIRMED', meta:'CRIMSON / IN HAND' }],
    tension: 92,
  },

  // 21 ── Movement raven recovery
  { kind: 'movement', icon: '↗', who: 'TEAM RAVEN', tag: 'EVAC ASSIST', team: 'A',
    body: <><b>Salo</b> arrives, stabilizes Imo, and shoves a stim into her thigh. <em>Kiri</em> abandons the rotor — too hot, can't carry it, can't kill it — and pivots to the glyph in Bay 1 instead. The clock is now the enemy.</>,
    chips: [['team-a','MEDIC IN PLAY'], ['warn','PIVOT: GLYPH']],
    moves: [{ id:'salo', to:'vault' },{ id:'kiri', to:'vault' },{ id:'darr', to:'vault' },{ id:'imo', to:'vault' }],
    statusUpdates: [{ id:'imo', status:'WARN', injured:true, hp:55 }],
    artifactUpdates: [{ id:'rotor', state:'unknown', status:'ABANDONED', meta:'BAY 3 / TOO HOT' }],
    tension: 90,
  },

  // 22 ── Hazard / interrupt
  { kind: 'interrupt', icon: '⚠', who: 'BAY 1 PEDESTAL', tag: 'INTERRUPT',
    body: <>The glyph is not on the pedestal anymore. It is <b>across the room</b>, eight feet up the wall, watching them with a face it did not have ninety seconds ago. <em>Kiri</em> very slowly puts down her sidearm. "We are leaving without it."</>,
    chips: [['alien','ARTIFACT: AMBULATORY'], ['team-a','GLYPH ABANDONED']],
    artifactUpdates: [{ id:'glyph', status:'AMBULATORY', state:'alive', meta:'BAY 1 / WALL' }],
    tension: 92,
  },

  // 23 ── Confessional Velma
  { kind: 'confessional', icon: '◉', who: 'VELMA STRAUSS — confessional', tag: 'PRIVATE FEED',
    body: <>Renz wanted to take three. Three artifacts. I told him: one. The rules say one. The hangar wants us to take three. Take one and run.</>,
    tension: 92,
  },

  // 24 ── Movement / race
  { kind: 'movement', icon: '↗', who: 'BOTH SQUADS', tag: 'EXFIL',
    body: <>Crimson moves first — <b>Ozzy</b> with the tablet, four operators sprinting roof-ward. Raven follows ninety seconds back, half-carrying Imo. The hangar lights begin to <em>pulse</em> behind them. Something is waking up.</>,
    chips: [['team-b','CRIMSON LEAD'], ['team-a','RAVEN +90s'], ['hot','HANGAR REACTIVE']],
    moves: [
      { id:'ren', to:'exfil' },{ id:'tama', to:'exfil' },{ id:'velm', to:'exfil' },{ id:'ozzy', to:'exfil' },
      { id:'kiri', to:'exfil' },{ id:'darr', to:'exfil' },{ id:'imo', to:'exfil' },{ id:'salo', to:'exfil' },
    ],
    tension: 96,
  },

  // 25 ── Victory
  { kind: 'victory', icon: '★', who: 'TEAM CRIMSON — EXFIL CONFIRMED', tag: 'WINNER',
    body: <>Helo wheels up at <b>05:24 — six minutes to spare</b>. Crimson on board with one verified artifact, no casualties. Raven extracted ninety seconds later, all four operators alive, Imo concussed but cracking jokes. The rotor and the glyph remain in the hangar. The hangar remains the hangar.</>,
    chips: [['team-b','CRIMSON: WIN'], ['team-a','RAVEN: SURVIVED'], ['ok','1 ARTIFACT RECOVERED']],
    tension: 70,
  },
];

// ═══════════════════════════════════════════════════════════
//  ICON COMPONENTS — pure SVG
// ═══════════════════════════════════════════════════════════
const Glyph = ({ d, size=16, color='currentColor', stroke=2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

// ═══════════════════════════════════════════════════════════
//  MAP — hand-drawn SVG of the base
// ═══════════════════════════════════════════════════════════
function MapSVG({ tokens, hazards, latestHazardZone }) {
  return (
    <svg viewBox="0 0 1000 380" preserveAspectRatio="none" style={{position:'absolute', inset:0}}>
      {/* terrain shading */}
      <defs>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="2" cy="2" r="0.6" fill="#2a3a44"/>
        </pattern>
        <linearGradient id="runway" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2128"/>
          <stop offset="1" stopColor="#0c1218"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="380" fill="url(#dots)"/>

      {/* Compass */}
      <g transform="translate(940, 30)">
        <circle r="18" fill="none" stroke="#3d5260" strokeWidth="1"/>
        <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill="none" stroke="#92ffb3" strokeWidth="1"/>
        <text y="-22" textAnchor="middle" fontFamily="Share Tech Mono" fontSize="9" fill="#92ffb3">N</text>
      </g>

      {/* Dry lake area (bottom band) */}
      <rect x="240" y="240" width="500" height="120" fill="#1a1410" stroke="#3d5260" strokeWidth="1" strokeDasharray="2 4" opacity="0.4"/>
      <text x="490" y="350" textAnchor="middle" className="map-text" letterSpacing="3">— DRY LAKE BED —</text>

      {/* Runway */}
      <rect x="320" y="160" width="320" height="40" fill="url(#runway)" stroke="#3d5260" strokeWidth="1"/>
      <line x1="340" y1="180" x2="620" y2="180" stroke="#3d5260" strokeWidth="1" strokeDasharray="20 10"/>
      <text x="480" y="186" textAnchor="middle" className="map-text" letterSpacing="3">RUNWAY 14L</text>

      {/* Perimeter fence */}
      <path className="map-fence" d="M 30 30 L 30 350 L 970 350 L 970 30 Z"/>
      <path className="map-fence-hot" d="M 220 220 L 260 220" />

      {/* Buildings */}
      {/* Motor pool - cluster of small buildings */}
      <g transform="translate(310, 70)">
        <rect className="map-bldg" x="0" y="0" width="60" height="30"/>
        <rect className="map-bldg-2" x="65" y="5" width="35" height="20"/>
        <rect className="map-bldg" x="10" y="35" width="40" height="20"/>
      </g>

      {/* Comms array - dish */}
      <g transform="translate(620, 70)">
        <circle r="22" fill="#1a232c" stroke="#3d5260" strokeWidth="1.5"/>
        <circle r="14" fill="none" stroke="#3d5260" strokeWidth="1"/>
        <circle r="6" fill="#92ffb3" opacity="0.3"/>
        <line x1="-22" y1="0" x2="-30" y2="0" stroke="#3d5260" strokeWidth="2"/>
        <line x1="22" y1="0" x2="30" y2="0" stroke="#3d5260" strokeWidth="2"/>
        <line x1="0" y1="-22" x2="0" y2="-30" stroke="#3d5260" strokeWidth="2"/>
      </g>

      {/* Silo 7 */}
      <g transform="translate(620, 290)">
        <circle r="18" fill="#0c1218" stroke="#3d5260" strokeWidth="2"/>
        <circle r="10" fill="none" stroke="#3d5260" strokeWidth="1"/>
        <line x1="-18" y1="0" x2="18" y2="0" stroke="#3d5260" strokeWidth="0.8"/>
        <line x1="0" y1="-18" x2="0" y2="18" stroke="#3d5260" strokeWidth="0.8"/>
      </g>

      {/* Hangar Black - large shape */}
      <g transform="translate(720, 150)">
        <rect className="map-bldg" x="0" y="0" width="120" height="80" fill="#0c1218" stroke="#92ffb3" strokeWidth="1.5"/>
        <line x1="0" y1="20" x2="120" y2="20" stroke="#3d5260" strokeWidth="0.6"/>
        <line x1="0" y1="60" x2="120" y2="60" stroke="#3d5260" strokeWidth="0.6"/>
        <text x="60" y="46" textAnchor="middle" className="map-text" fill="#92ffb3" fontSize="10" letterSpacing="3">HGR-B</text>
      </g>

      {/* Exfil roof — helipad */}
      <g transform="translate(920, 170)">
        <rect x="0" y="0" width="50" height="50" fill="none" stroke="#92ffb3" strokeWidth="1.5"/>
        <text x="25" y="30" textAnchor="middle" fontFamily="Black Ops One" fontSize="20" fill="#92ffb3">H</text>
      </g>

      {/* Laser grid lines */}
      <g opacity="0.5">
        {[0,1,2,3,4,5,6,7].map(i => (
          <line key={i}
            className="map-laser"
            x1={490 + i*5} y1="155"
            x2={550 - i*5} y2="240" />
        ))}
      </g>

      {/* Mines */}
      <g>
        <circle className="map-mine" cx="380" cy="280" r="2" opacity="0.8"/>
        <circle className="map-mine" cx="420" cy="300" r="2" opacity="0.8"/>
        <circle className="map-mine" cx="600" cy="300" r="2" opacity="0.8"/>
        <circle className="map-mine" cx="640" cy="320" r="2" opacity="0.8"/>
      </g>

      {/* Suggested paths */}
      <path className="map-path" d="M 40 320 Q 200 280 360 270 Q 500 260 720 200" />
      <path className="map-path" d="M 40 145 Q 200 130 340 90 Q 500 130 720 200" stroke="#ff5e3a" opacity="0.4"/>

      {/* Active hazard glow */}
      {latestHazardZone && (
        <circle
          cx={ZONES[latestHazardZone].x * 10}
          cy={ZONES[latestHazardZone].y * 3.8}
          r="40"
          fill="none"
          stroke="#ff3a3a"
          strokeWidth="2"
          opacity="0.5"
        >
          <animate attributeName="r" from="20" to="60" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
//  CARD
// ═══════════════════════════════════════════════════════════
function Card({ ev, idx }) {
  return (
    <div className={`hb-card ${ev.kind}`} data-team={ev.team}>
      <div className="hb-card-head">
        <div className="hb-card-icon">{ev.icon}</div>
        <div className="hb-card-who">{ev.who}</div>
        <div className="hb-card-tag">{ev.tag}</div>
      </div>
      <div className="hb-card-body">{ev.body}</div>
      {ev.causeEffect && (
        <div className="hb-cause-effect">
          <div className="hb-ce-side">
            <span className="lbl">CAUSE</span>{ev.causeEffect.cause}
          </div>
          <div className="hb-ce-arrow">→</div>
          <div className="hb-ce-side">
            <span className="lbl">EFFECT</span>{ev.causeEffect.effect}
          </div>
        </div>
      )}
      {ev.chips && (
        <div className="hb-card-foot">
          {ev.chips.map(([cls, label], i) => (
            <span key={i} className={`hb-chip ${cls}`}>{label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  ROSTER ROW
// ═══════════════════════════════════════════════════════════
function RosterRow({ op }) {
  const cls = op.eliminated ? 'eliminated' : (op.injured ? 'injured' : '');
  const statusCls =
    op.status === 'HOT' ? 'hb-status-hot' :
    op.status === 'WARN' ? 'hb-status-warn' :
    op.status === 'ALIEN' ? 'hb-status-alien' : 'hb-status-ok';
  const hpCls = op.hp < 40 ? 'hot' : op.hp < 70 ? 'warn' : '';
  return (
    <div className={`hb-roster-row ${cls}`} data-team={op.team}>
      <div className="hb-roster-pic" style={{ borderColor: op.color, color: op.color }}>{op.initial}</div>
      <div className="hb-roster-info">
        <div className="hb-roster-name">{op.name}</div>
        <div className="hb-roster-role">{op.role}</div>
        <div className="hb-hp"><div className={`hb-hp-fill ${hpCls}`} style={{ width: op.hp + '%' }}></div></div>
      </div>
      <div className={`hb-roster-status ${statusCls}`}>{op.status || 'OK'}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  APP
// ═══════════════════════════════════════════════════════════
function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "autoplay": false,
    "speed": 2200,
    "showConfessionals": true,
    "intensity": "standard",
    "ambientFog": true
  }/*EDITMODE-END*/);

  const [revealed, setRevealed] = useState(1);
  const [autoTick, setAutoTick] = useState(0);

  // Filter timeline based on tweaks
  const timeline = useMemo(() => {
    return TIMELINE.filter(ev => {
      if (!tweaks.showConfessionals && ev.kind === 'confessional') return false;
      return true;
    });
  }, [tweaks.showConfessionals]);

  // Aggregate state from revealed events
  const state = useMemo(() => {
    // Token positions
    const positions = {};
    CAST.forEach(c => { positions[c.id] = c.team === 'A' ? 'start_a' : 'start_b'; });

    // Operator status
    const ops = Object.fromEntries(CAST.map(c => [c.id, { ...c, status: 'OK', injured: false, eliminated: false }]));

    // Artifacts
    const artifacts = {};

    // Tension + phase
    let tension = 12;
    let phase = 'PHASE 0 · STAGING';

    // Hazards
    const hazardLog = { fence: 0, motor: 0, lasers: 0, silo: 0, vault: 0 };
    let latestHazardZone = null;

    for (let i = 0; i < revealed && i < timeline.length; i++) {
      const ev = timeline[i];
      if (ev.moves) ev.moves.forEach(m => { positions[m.id] = m.to; });
      if (ev.statusUpdates) ev.statusUpdates.forEach(u => {
        if (ops[u.id]) {
          if (u.status) ops[u.id].status = u.status;
          if (u.injured !== undefined) ops[u.id].injured = u.injured;
          if (u.eliminated) ops[u.id].eliminated = true;
          if (u.hp !== undefined) ops[u.id].hp = u.hp;
        }
      });
      if (ev.artifacts) ev.artifacts.forEach(a => { artifacts[a.id] = a; });
      if (ev.artifactUpdates) ev.artifactUpdates.forEach(u => {
        artifacts[u.id] = { ...artifacts[u.id], ...u };
      });
      if (ev.tension !== undefined) tension = ev.tension;
      if (ev.phase) phase = ev.phase;
      if (ev.hazardOn) {
        hazardLog[ev.hazardOn] = (hazardLog[ev.hazardOn] || 0) + 1;
        latestHazardZone = ev.hazardOn;
      }
    }

    // Compute team progress along zone chain
    const zoneOrder = ['start_a', 'start_b', 'fence', 'flats', 'motor', 'lasers', 'silo', 'comms', 'vault', 'exfil'];
    const teamProgress = (team) => {
      const teamOps = CAST.filter(c => c.team === team).map(c => positions[c.id]);
      // pick most-advanced zone
      const idxs = teamOps.map(z => zoneOrder.indexOf(z));
      const maxIdx = Math.max(...idxs);
      return Math.round((maxIdx / (zoneOrder.length - 1)) * 100);
    };

    return {
      positions,
      ops: Object.values(ops),
      artifacts: Object.values(artifacts),
      tension,
      phase,
      hazardLog,
      latestHazardZone,
      progressA: teamProgress('A'),
      progressB: teamProgress('B'),
    };
  }, [revealed, timeline]);

  // Autoplay
  useEffect(() => {
    if (!tweaks.autoplay) return;
    if (revealed >= timeline.length) return;
    const t = setTimeout(() => setRevealed(r => Math.min(r + 1, timeline.length)), tweaks.speed);
    return () => clearTimeout(t);
  }, [tweaks.autoplay, tweaks.speed, revealed, timeline.length, autoTick]);

  // Tense body class
  useEffect(() => {
    document.body.classList.toggle('tense', state.tension > 75);
  }, [state.tension]);

  const events = timeline.slice(0, revealed);

  // Group events into phases visually
  const phaseSections = [
    { title: 'INSERT', range: [0, 6], meta: '04:12 — 04:30' },
    { title: 'INFILTRATE', range: [6, 14], meta: '04:30 — 04:55' },
    { title: 'CONTACT', range: [14, 20], meta: '04:55 — 05:10' },
    { title: 'EXFIL', range: [20, 99], meta: '05:10 — 05:30' },
  ];

  // Live clock
  const startMin = 4 * 60 + 12;
  const elapsed = Math.min(revealed * 3, 78);
  const liveTimeMin = startMin + elapsed;
  const hh = Math.floor(liveTimeMin / 60).toString().padStart(2, '0');
  const mm = (liveTimeMin % 60).toString().padStart(2, '0');

  return (
    <>
      {/* ══ BROADCAST BAR ══ */}
      <div className="hb-broadcast">
        <span className="hb-rec"><span className="hb-rec-dot"></span>LIVE</span>
        <span className="hb-channel">CH-77 · OP HANGAR BLACK</span>
        <div className="hb-ticker">
          <div className="hb-ticker-inner">
            FEED: real-time intelligence. <span>○</span> Two squads inserting at Groom Lake. <span>○</span> Objective: recover 1 (one) verified artifact. <span>○</span> Sunrise hard-stop 05:30 UTC. <span>○</span> Aliens are real. <span>○</span> Aliens are not optional. <span>○</span>
          </div>
        </div>
        <span className="hb-clock">{hh}:{mm}:14 UTC</span>
        <span className="hb-feed-id">FEED ID 0x{(0xA51 + revealed).toString(16).toUpperCase()}</span>
      </div>

      {/* ══ TITLE PLATE ══ */}
      <div className="hb-title-plate">
        <div className="hb-title-meta">
          <b>OP CODE</b>HANGAR BLACK / 04-12<br/>
          <b>BRIEFER</b>CMDR. T. ASHFORD<br/>
          <b>SECURITY</b>EYES ONLY · DELTA-7
        </div>
        <div className="hb-title-main">
          <div className="hb-title-eyebrow">REALITY ISLAND · EPISODE 7</div>
          <div className="hb-title-name">HANGAR BLACK</div>
          <div className="hb-title-sub">— A GROOM LAKE INFILTRATION TRIAL —</div>
        </div>
        <div className="hb-title-stats">
          <div className="hb-stat"><span className="hb-stat-v">{revealed}/{timeline.length}</span><span className="hb-stat-l">EVENTS</span></div>
          <div className="hb-stat"><span className="hb-stat-v">{state.tension}</span><span className="hb-stat-l">TENSION</span></div>
        </div>
      </div>

      {/* ══ MAIN SHELL ══ */}
      <div className="hb-shell">
        <main className="hb-main">

          {/* Map */}
          <div className="hb-map-wrap">
            <div className="hb-map-header">
              <span className="hb-map-title">▮ TACTICAL OVERLAY · GROOM LAKE</span>
              <span className="hb-map-coords">37.2431°N · 115.7930°W</span>
              <span className="hb-map-phase">{state.phase}</span>
            </div>
            <div className="hb-map" id="map">
              <MapSVG latestHazardZone={state.latestHazardZone}/>

              {/* Zone labels */}
              {Object.entries(ZONES).map(([id, z]) => {
                const isHazard = state.latestHazardZone === id;
                return (
                  <div key={id} className={`hb-zone-label ${isHazard ? 'danger' : ''}`}
                       style={{ left: z.x + '%', top: z.y + '%', transform: 'translate(-50%, -120%)' }}>
                    {z.label}
                    {isHazard && <span className="stat">⚠ ACTIVE</span>}
                  </div>
                );
              })}

              {/* Tokens */}
              {CAST.map((c, i) => {
                const z = ZONES[state.positions[c.id]];
                if (!z) return null;
                // Stack tokens within a zone with offset
                const teamMates = CAST.filter(o => state.positions[o.id] === state.positions[c.id]);
                const ix = teamMates.findIndex(o => o.id === c.id);
                const ox = ((ix % 3) - 1) * 14;
                const oy = Math.floor(ix / 3) * 14;
                return (
                  <div key={c.id} className={`hb-tok ${c.team}`}
                       style={{
                         left: `calc(${z.x}% + ${ox}px)`,
                         top: `calc(${z.y}% + ${oy}px)`,
                         transform: 'translate(-50%, -50%)',
                       }}
                       title={c.name}>
                    {c.initial.charAt(0)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feed */}
          <div className="hb-feed">
            {phaseSections.map((sec, si) => {
              const evs = events.slice(sec.range[0], sec.range[1]);
              if (evs.length === 0) return null;
              return (
                <React.Fragment key={si}>
                  <div className="hb-section-bar">
                    <span className="hb-section-tag">PHASE {si + 1}</span>
                    <span className="hb-section-title">{sec.title}</span>
                    <span className="hb-section-meta">{sec.meta} · {evs.length} EVENTS</span>
                  </div>
                  {evs.map((ev, ei) => (
                    <Card key={sec.range[0] + ei} ev={ev} idx={sec.range[0] + ei}/>
                  ))}
                </React.Fragment>
              );
            })}

            {revealed === 0 && (
              <div className="hb-empty">
                <div className="blip">▌AWAITING SIGNAL</div>
                <div style={{ marginTop: 12, opacity: 0.6 }}>Press REVEAL NEXT to begin the operation.</div>
              </div>
            )}

            {revealed >= timeline.length && (
              <div className="hb-empty" style={{ borderTop: '1px solid var(--line)' }}>
                <div style={{ color: 'var(--hud)' }}>▌END OF FEED · MISSION COMPLETE</div>
                <div style={{ marginTop: 8, opacity: 0.5 }}>Tap RESET to rewind.</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="hb-controls">
            <button className="hb-btn primary"
                    disabled={revealed >= timeline.length}
                    onClick={() => setRevealed(r => Math.min(r + 1, timeline.length))}>
              <span className="arrow">▶</span> REVEAL NEXT
            </button>
            <button className="hb-btn"
                    disabled={revealed >= timeline.length}
                    onClick={() => setRevealed(timeline.length)}>
              REVEAL ALL <span className="arrow">▶▶</span>
            </button>
            <button className="hb-btn danger" onClick={() => setRevealed(1)}>
              <span className="arrow">↺</span> RESET
            </button>
            <div className="hb-progress">
              <div className="hb-progress-fill" style={{ width: ((revealed / timeline.length) * 100) + '%' }}></div>
            </div>
          </div>
        </main>

        {/* ══ SIDEBAR ══ */}
        <aside className="hb-side">
          {/* Race */}
          <div className="hb-panel">
            <div className="hb-panel-head">
              <span>▮ RACE TO HANGAR</span>
              <span className="pill">LIVE</span>
            </div>
            <div className="hb-panel-body">
              <div className="hb-race">
                <div className="hb-race-row">
                  <div className="label"><span className="lname" style={{color:'var(--teamA)'}}>TEAM RAVEN</span><span className="lpct">{state.progressA}%</span></div>
                  <div className="hb-race-track"><div className="hb-race-fill A" style={{ width: state.progressA + '%' }}></div></div>
                </div>
                <div className="hb-race-row">
                  <div className="label"><span className="lname" style={{color:'var(--teamB)'}}>TEAM CRIMSON</span><span className="lpct">{state.progressB}%</span></div>
                  <div className="hb-race-track"><div className="hb-race-fill B" style={{ width: state.progressB + '%' }}></div></div>
                </div>
              </div>
              <div className="hb-tension" style={{ marginTop: 14 }}>
                <span style={{fontFamily:'Share Tech Mono', fontSize:9, letterSpacing:2, color:'var(--paper-dim)'}}>TENSION</span>
                <div className="hb-tension-track"><div className="hb-tension-fill" style={{ width: state.tension + '%' }}></div></div>
                <span className="hb-tension-val">{state.tension}</span>
              </div>
            </div>
          </div>

          {/* Roster */}
          <div className="hb-panel">
            <div className="hb-panel-head">
              <span>▮ OPERATOR ROSTER</span>
              <span style={{color: 'var(--paper-dim)', fontSize: 9}}>{state.ops.filter(o => !o.eliminated).length}/8 ACTIVE</span>
            </div>
            <div className="hb-panel-body">
              <div className="hb-roster">
                {state.ops.map(op => <RosterRow key={op.id} op={op}/>)}
              </div>
            </div>
          </div>

          {/* Artifacts */}
          <div className="hb-panel">
            <div className="hb-panel-head">
              <span>▮ ARTIFACT STATUS</span>
              <span style={{color: 'var(--hud)', fontSize: 9}}>{state.artifacts.filter(a => a.state === 'confirmed').length} CONFIRMED</span>
            </div>
            <div className="hb-panel-body">
              <div className="hb-art-grid">
                {state.artifacts.length === 0 && (
                  <div style={{textAlign:'center', padding:'8px', color:'var(--paper-dim)', fontSize:10, fontFamily:'Share Tech Mono', letterSpacing:'0.2em'}}>
                    AWAITING INTEL...
                  </div>
                )}
                {state.artifacts.map(a => (
                  <div key={a.id} className={`hb-art ${a.state || 'unknown'}`}>
                    <div className="hb-art-icon">
                      {a.id === 'rotor' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.state==='alive'?'#ff5e3a':'#92ffb3'} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9" strokeDasharray="2 3"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/></svg>}
                      {a.id === 'crate' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.state==='confirmed'?'#92ffb3':'#a39d88'} strokeWidth="1.5"><rect x="4" y="6" width="16" height="14"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="12" y1="6" x2="12" y2="20"/></svg>}
                      {a.id === 'glyph' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a.state==='alive'?'#b76dff':'#a39d88'} strokeWidth="1.5"><path d="M5 4 L19 4 L19 18 L12 22 L5 18 Z"/><circle cx="12" cy="12" r="2"/></svg>}
                    </div>
                    <div>
                      <div className="hb-art-name">{a.name}</div>
                      <div className="hb-art-meta">{a.meta}</div>
                    </div>
                    <div className="hb-art-status" style={{
                      color: a.state === 'confirmed' ? 'var(--hud)' :
                             a.state === 'alive' ? 'var(--alien)' :
                             a.state === 'targeted' ? 'var(--warn)' :
                             'var(--paper-dim)'
                    }}>{a.status || 'UNKNOWN'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hazards */}
          <div className="hb-panel">
            <div className="hb-panel-head">
              <span>▮ HAZARD LOG</span>
              <span style={{color: 'var(--hot)', fontSize: 9}}>{Object.values(state.hazardLog).reduce((a,b)=>a+b,0)} TRIGGERED</span>
            </div>
            <div className="hb-panel-body">
              <div className="hb-haz-list">
                <div className="hb-haz-item"><div className="hb-haz-dot hb-haz-fence"></div><div className="hb-haz-label">CAPACITIVE FENCE</div><div className="hb-haz-count">×{state.hazardLog.fence}</div></div>
                <div className="hb-haz-item"><div className="hb-haz-dot hb-haz-laser"></div><div className="hb-haz-label">LASER LATTICE</div><div className="hb-haz-count">×{state.hazardLog.lasers}</div></div>
                <div className="hb-haz-item"><div className="hb-haz-dot hb-haz-mine"></div><div className="hb-haz-label">SEISMIC DISCS</div><div className="hb-haz-count">×{state.hazardLog.silo}</div></div>
                <div className="hb-haz-item"><div className="hb-haz-dot hb-haz-fence"></div><div className="hb-haz-label">DRONE PATROL</div><div className="hb-haz-count">×{state.hazardLog.motor}</div></div>
                <div className="hb-haz-item"><div className="hb-haz-dot hb-haz-alien"></div><div className="hb-haz-label">HANGAR ANOMALY</div><div className="hb-haz-count">×{state.hazardLog.vault}</div></div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ══ TWEAKS ══ */}
      <TweaksPanel title="TWEAKS · OP HANGAR BLACK">
        <TweakSection title="PLAYBACK">
          <TweakToggle label="Autoplay" value={tweaks.autoplay} onChange={v => setTweak('autoplay', v)}/>
          <TweakSlider label="Reveal Speed" value={tweaks.speed} onChange={v => setTweak('speed', v)}
                       min={800} max={5000} step={100} suffix="ms"/>
        </TweakSection>
        <TweakSection title="FEED">
          <TweakToggle label="Show Confessionals" value={tweaks.showConfessionals}
                       onChange={v => setTweak('showConfessionals', v)}/>
          <TweakRadio label="Intensity" value={tweaks.intensity}
                      options={['gentle', 'standard', 'hot']}
                      onChange={v => setTweak('intensity', v)}/>
        </TweakSection>
        <TweakSection title="ATMOSPHERE">
          <TweakToggle label="Ambient Fog & Glitch" value={tweaks.ambientFog}
                       onChange={v => setTweak('ambientFog', v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
