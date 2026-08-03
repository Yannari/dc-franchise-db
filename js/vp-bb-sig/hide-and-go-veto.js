/**
 * Hide and Go Veto — "The Ransacked House"
 * ════════════════════════════════════════════════════════════════════════
 *
 * The generic competition screen draws a scoreboard. This competition does not
 * have a scoreboard in any sense a viewer can feel: nobody is faster than
 * anybody, nothing is timed against a clock everyone shares. What happens is
 * that a house full of people take it apart, room by room, until one card is
 * still where its owner left it.
 *
 * So the set piece is the house itself — a floor plan that starts warm and
 * tidy and ends looking like a search warrant was executed on it, because that
 * is the sentence the simulation actually writes. Every card that comes off
 * the board lights its room, adds stuffing and feathers and a pulled drawer to
 * the map, and turns one face-down card face-up with the spot printed on it.
 * The bed-flip lands as wreckage. The last card is gold.
 *
 * This file imports nothing and touches no globals. Everything it needs comes
 * in through `u` (the host module's escape/avatar/reveal helpers) and off the
 * episode. Interactivity is the standard inline-onclick reveal string and
 * nothing else, so every piece of content is gated on `state.idx`.
 */

// Fallback reveal state, used only if the host forgets to pass its own. Keeping
// it module-local means the screen still works standalone instead of throwing.
const _localTv = {};

// ── deterministic helpers ─────────────────────────────────────────────
//
// No Math.random anywhere in this file. Everything that looks scattered — the
// debris on the floor, the connective flavour under a card — is a pure
// function of the episode number and the step index, so the same week always
// draws the same wreckage.

const _hash = s => {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Stable 0..1 from an integer seed. */
const _unit = seed => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const _pick = (arr, seed) => arr[_hash(String(seed)) % arr.length];

// ── the house ─────────────────────────────────────────────────────────
//
// A stylised plan, not a real one. Seven rooms because the hiding places the
// competition generates fall into seven places, and a room that never appears
// in any spot text would just be dead ink on the map.

const ROOMS = [
  { id: 'living',  label: 'LIVING ROOM',   x: 24,  y: 24,  w: 236, h: 158 },
  { id: 'kitchen', label: 'KITCHEN',       x: 268, y: 24,  w: 176, h: 158 },
  { id: 'bedroom', label: 'BEDROOM',       x: 452, y: 24,  w: 164, h: 158 },
  { id: 'yard',    label: 'BACKYARD',      x: 24,  y: 190, w: 236, h: 154 },
  { id: 'havenot', label: 'HAVE-NOT ROOM', x: 268, y: 190, w: 176, h: 96 },
  { id: 'bath',    label: 'BATH / LAUNDRY',x: 268, y: 294, w: 176, h: 50 },
  { id: 'diary',   label: 'DIARY HALL',    x: 452, y: 190, w: 164, h: 154 },
];

// Order matters: "a pillow in the have-not room" has to hit the have-not room
// and not the bedroom on the word "pillow".
const ROOM_KEYS = [
  [/have[-\s]?not/, 'havenot'],
  [/lounge|beanbag|bean bag|memory wall|sofa|couch|living|armchair/, 'living'],
  [/kitchen|pantry|island|freezer|fridge|counter|cupboard|oven|dishwash/, 'kitchen'],
  [/laundry|hamper|towel|shower|bathroom|sink|mirror|toilet/, 'bath'],
  [/diary|fake plant|plant|hallway|corridor/, 'diary'],
  [/backyard|yard|garden|pool|astro|hammock|outside|grass|patio/, 'yard'],
  [/pillow|bed|mattress|jacket|boot|shoe|drawer|wardrobe|closet|bunk|nightstand/, 'bedroom'],
];

const _roomOf = where => {
  const w = String(where || '').toLowerCase();
  for (const [re, id] of ROOM_KEYS) if (re.test(w)) return id;
  return ROOMS[_hash(w) % ROOMS.length].id;
};

const _roomLabel = id => (ROOMS.find(r => r.id === id) || ROOMS[0]).label;

// ── connective flavour ────────────────────────────────────────────────
//
// The competition writes the events. These write the silence between them —
// the sound the other houseguests are listening to from the backyard, which is
// the only thing they have to go on and is the whole texture of the format.

const YARD_CHATTER = [
  'Outside, somebody says that was a cupboard. Somebody else says it was the pantry. Both of them are wrong.',
  'From the backyard it is just a sequence of doors. Everyone is counting them and nobody agrees on the total.',
  'The lawn goes quiet every time the noise stops, and then starts arguing again the second it resumes.',
  'Two people are drawing the floor plan in the dirt with a lolly stick. It is not to scale and it does not help.',
  'Nobody outside can hear the room, only the floor. Which is enough to know somebody just knelt down.',
];

const HOUSE_NOISE = [
  'A drawer goes over somewhere upstairs and nobody bothers to pick it up.',
  'The house has stopped sounding like a house. It sounds like a room being moved.',
  'Somewhere a cushion loses its argument with a zip.',
  'The floor is now more stuff than floor, and there are turns left.',
  'Cupboard, cupboard, cupboard, silence. The silence is the part that means something.',
  'Something glass survives. Barely. It is put back on the wrong shelf.',
];

const MISS_ASIDE = [
  'A wasted turn in this comp is not neutral. It is a turn somebody else now gets.',
  'Nothing on the board, and the clock does not care whose fault that is.',
  'The room gets no easier. It only gets messier for whoever is next.',
  'Zero for the turn, and a lot of new mess for the house to inherit.',
];

// Phase one shows how somebody hid, never where. These are the approaches, and
// they are assigned deterministically so a houseguest hides the same way twice
// if the same week is replayed.
const APPROACH = [
  'Walked the whole house first. Did not touch the card until the last ninety seconds.',
  'Went to one spot immediately and never reconsidered it. Confidence, or laziness dressed as it.',
  'Hid it, moved it, hid it again, and ended up roughly where it started.',
  'Built a decoy first. Spent more time on the lie than on the card.',
  'Picked somewhere so boring it reads as an insult to whoever searches there.',
  'Chose a spot that requires somebody to be looking down. Nobody in this house looks down.',
  'Used a place that only works if the searcher trusts them. Which several of them do.',
  'Hid it in the one room everybody says they hate being in.',
];

// ── debris ────────────────────────────────────────────────────────────

const _debrisShape = kind => {
  if (kind === 'feather') return '<path d="M0,0 C5,-7 13,-9 17,-5 C13,1 5,4 0,4 Z"/><path d="M0,2 L17,-4" stroke-width="0.6"/>';
  if (kind === 'stuffing') return '<circle cx="0" cy="0" r="4"/><circle cx="5" cy="-3" r="3"/><circle cx="4" cy="3" r="2.4"/><circle cx="-4" cy="2" r="2"/>';
  if (kind === 'drawer') return '<rect x="-8" y="-4" width="16" height="8" rx="1"/><rect x="-8" y="-4" width="16" height="2.4"/>';
  if (kind === 'cushion') return '<rect x="-7" y="-5" width="14" height="10" rx="4"/>';
  if (kind === 'sock') return '<path d="M-5,-5 L1,-5 L1,2 L6,2 L6,6 L-5,6 Z"/>';
  return '<path d="M-5,4 L0,-5 L5,4 Z"/>';
};

const DEBRIS_KINDS = ['feather', 'stuffing', 'drawer', 'cushion', 'sock', 'shard'];

// ── the screen ────────────────────────────────────────────────────────

/**
 * @param {object} ep       episode record (needs .num, .acts)
 * @param {string} actType  'veto' | 'hoh'
 * @param {object} u        { tvState, reveal, avatar, esc, cat, ordinal }
 */
export function rpBuildSigHideAndGoVeto(ep, actType, u = {}) {
  const esc = u.esc || (v => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  const avatar = u.avatar || ((n, px = 26) =>
    `<span class="sgh-avf" style="width:${px}px;height:${px}px">${esc(String(n || '?')[0])}</span>`);
  const ordinal = u.ordinal || (n => String(n));
  const catOf = u.cat || (() => ({ label: 'MENTAL', accent: '#f0a500' }));
  const tvState = u.tvState || _localTv;
  const reveal = u.reveal || null;

  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  // A sealed result cannot be told as a room-by-room hunt with a gold card at
  // the end — the gold card IS the result. Fall back to the generic screen.
  if (!act || !comp || act.secret) return '';

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || {};
  const results = act.results || [];
  const roster = ((act.participants && act.participants.length)
    ? act.participants
    : results.map(r => r.name)).filter(Boolean);
  if (!roster.length) return '';

  const winner = act.winner || results[0]?.name || null;
  const cat = catOf(comp.category);
  const accent = cat.accent || '#f0a500';

  const stateKey = `bb_sig_hide_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];

  // ── steps, straight off the beats, in order ─────────────────────────
  //
  // Nothing is invented and nothing is dropped: every beat the competition
  // wrote becomes exactly one step, classified by the badge it already carries.
  const kindOf = b => {
    const t = String(b.badgeText || '').toUpperCase();
    if (t === 'HIDE PHASE') return 'intro';
    if (t === 'HIDDEN') return 'hide';
    if (t === 'CARD ON THE BOARD') return 'found';
    if (t === 'HOUSE WRECKED') return 'wreck';
    if (t === 'NOTHING') return 'miss';
    if (t === 'VETO' || t === 'HOH') return 'veto';
    return 'flavor';
  };

  const spotOf = name => breakdown[name]?.hidingPlace || null;

  const steps = beats.map((b, i) => {
    const kind = kindOf(b);
    const ps = (b.players || []).filter(Boolean);
    const s = { i, kind, beat: b, players: ps };

    if (kind === 'hide') {
      s.owner = ps[0] || null;
    } else if (kind === 'miss') {
      s.searcher = ps[0] || null;
    } else if (kind === 'found') {
      // Two-player found beats read [searcher, owner]. The stalled-clock beat
      // has only the owner and no finder at all. The breakdown is the
      // authority on which is which, so it wins any disagreement.
      let victim = ps.length >= 2 ? ps[1] : ps[0] || null;
      let finder = ps.length >= 2 ? ps[0] : null;
      if (ps.length >= 2 && breakdown[ps[0]]?.foundOnTurn != null && breakdown[ps[1]]?.foundOnTurn == null) {
        victim = ps[0]; finder = ps[1];
      }
      const bd = breakdown[victim] || {};
      if (bd.foundBy) finder = bd.foundBy;
      else if (bd.foundBy === null && ps.length < 2) finder = null;
      s.victim = victim;
      s.finder = finder;
      s.spot = spotOf(victim);
      s.room = _roomOf(s.spot || b.text);
      s.turn = bd.foundOnTurn ?? null;
      s.quality = bd.hideQuality ?? null;
    } else if (kind === 'wreck') {
      s.wrecker = ps[0] || null;
      s.wronged = ps[1] || null;
    } else if (kind === 'veto') {
      s.owner = ps[0] || winner;
      s.spot = spotOf(s.owner) || (String(b.text).match(/hid it (.+?)(?:,| and )/i) || [])[1] || null;
      s.room = _roomOf(s.spot || b.text);
    }
    return s;
  });

  const total = steps.length;
  const revealed = Math.max(0, state.idx + 1);
  const done = state.idx >= total - 1;

  // ── running state at the current reveal point ───────────────────────
  const shown = steps.slice(0, revealed);
  const foundSteps = shown.filter(s => s.kind === 'found');
  const foundNames = new Set(foundSteps.map(s => s.victim).filter(Boolean));
  const litRooms = new Set(foundSteps.map(s => s.room).filter(Boolean));
  const wreckStep = shown.find(s => s.kind === 'wreck') || null;
  const vetoStep = shown.find(s => s.kind === 'veto') || null;
  if (vetoStep?.room) litRooms.add(vetoStep.room);

  const started = state.idx >= 0;
  const stillHidden = roster.length - foundNames.size;
  // Wreckage level drives the debris count and the grime on the plan. It is
  // capped so a sixteen-person comp does not bury the floor plan entirely.
  const wreck = Math.min(6, foundSteps.length + (wreckStep ? 2 : 0));

  // Which step number turned each card face-up, so the rack can gate itself.
  const flipAt = {};
  steps.forEach(s => { if (s.kind === 'found' && s.victim) flipAt[s.victim] = s.i; });

  // ── floor plan ──────────────────────────────────────────────────────
  const roomSvg = ROOMS.map(r => {
    const lit = litRooms.has(r.id);
    const gold = vetoStep && vetoStep.room === r.id;
    const hits = foundSteps.filter(s => s.room === r.id).length;
    return `<g class="sgh-room ${lit ? 'is-lit' : ''} ${gold ? 'is-gold' : ''}" data-room="${r.id}">
      <rect class="sgh-rfill" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="6"/>
      <rect class="sgh-rglow" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="6"/>
      <rect class="sgh-rline" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="6"/>
      <text class="sgh-rlabel" x="${r.x + 10}" y="${r.y + 18}">${r.label}</text>
      ${hits ? `<text class="sgh-rhits" x="${r.x + r.w - 10}" y="${r.y + 18}">${hits} PULLED</text>` : ''}
    </g>`;
  }).join('');

  // Debris only exists for wreck levels already reached, so the mess literally
  // accumulates one reveal at a time instead of being drawn and hidden.
  const debris = [];
  for (let w = 1; w <= wreck; w++) {
    const pool = litRooms.size ? ROOMS.filter(r => litRooms.has(r.id)) : ROOMS;
    for (let k = 0; k < 4; k++) {
      const seed = (ep.num || 1) * 977 + w * 71 + k * 13;
      const r = pool[Math.floor(_unit(seed) * pool.length) % pool.length];
      const x = Math.round(r.x + 18 + _unit(seed + 1) * (r.w - 36));
      const y = Math.round(r.y + 30 + _unit(seed + 2) * (r.h - 44));
      const rot = Math.round(_unit(seed + 3) * 360);
      const kind = DEBRIS_KINDS[Math.floor(_unit(seed + 4) * DEBRIS_KINDS.length) % DEBRIS_KINDS.length];
      debris.push(`<g class="sgh-debris sgh-d-${kind}" data-w="${w}" transform="translate(${x} ${y}) rotate(${rot})">${_debrisShape(kind)}</g>`);
    }
  }

  const map = `<div class="sgh-mapwrap">
    <div class="sgh-map wr-${wreck}">
      <svg viewBox="0 0 640 368" preserveAspectRatio="xMidYMid meet" role="img"
           aria-label="Floor plan of the house, ${litRooms.size} rooms searched">
        <defs>
          <linearGradient id="sghFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#3a2a1e"/><stop offset="1" stop-color="#2a1d14"/>
          </linearGradient>
          <linearGradient id="sghSweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ffcf8a" stop-opacity="0"/>
            <stop offset="0.5" stop-color="#ffcf8a" stop-opacity="0.22"/>
            <stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect class="sgh-shell" x="10" y="10" width="620" height="348" rx="10"/>
        ${roomSvg}
        <g class="sgh-debris-layer">${debris.join('')}</g>
        <rect class="sgh-grime" x="10" y="10" width="620" height="348" rx="10"/>
        <rect class="sgh-sweep" x="-220" y="10" width="220" height="348" fill="url(#sghSweep)"/>
      </svg>
    </div>
    <div class="sgh-maplegend">
      <span><i class="sgh-key sgh-key-dark"></i>untouched</span>
      <span><i class="sgh-key sgh-key-lit"></i>searched</span>
      <span><i class="sgh-key sgh-key-gold"></i>never found</span>
    </div>
  </div>`;

  // ── the counter strip ───────────────────────────────────────────────
  const strip = `<div class="sgh-strip">
    <div class="sgh-stat is-big">
      <b>${started ? stillHidden : '&mdash;'}</b><span>cards still hidden</span>
    </div>
    <div class="sgh-stat"><b>${started ? foundNames.size : '&mdash;'}</b><span>on the board</span></div>
    <div class="sgh-stat"><b>${started ? litRooms.size : '&mdash;'}</b><span>rooms turned over</span></div>
    <div class="sgh-stat"><b>${started ? roster.length : '&mdash;'}</b><span>cards hidden at the start</span></div>
  </div>`;

  // ── the card rack ───────────────────────────────────────────────────
  //
  // One card per houseguest, all face-down the moment the hide phase is
  // revealed. Face-down means the approach shows and the spot does not — the
  // spot only prints when the search finds it, or at the very end, in gold.
  const rack = `<div class="sgh-rack">
    ${roster.map((name, ri) => {
      if (!started) {
        return `<div class="sgh-card is-void"><span class="sgh-back-mark">?</span></div>`;
      }
      const flip = flipAt[name];
      const isFlipped = flip != null && state.idx >= flip;
      const isWinner = vetoStep && name === vetoStep.owner;
      const spot = spotOf(name);
      const bd = breakdown[name] || {};
      const approach = _pick(APPROACH, `${ep.num}|${name}|${ri}`);
      if (isWinner) {
        return `<article class="sgh-card is-gold">
          <header><span class="sgh-tag">NEVER FOUND</span></header>
          <div class="sgh-cbody">${avatar(name, 30)}<b>${esc(name)}</b></div>
          <p class="sgh-spot">${esc(spot || 'somewhere the house never thought to look')}</p>
        </article>`;
      }
      if (isFlipped) {
        return `<article class="sgh-card is-up">
          <header><span class="sgh-tag">ON THE BOARD</span>${
            bd.foundBy ? `<span class="sgh-by">by ${esc(bd.foundBy)}</span>` : '<span class="sgh-by">by the clock</span>'}</header>
          <div class="sgh-cbody">${avatar(name, 30)}<b>${esc(name)}</b></div>
          <p class="sgh-spot">${esc(spot || 'a spot nobody wrote down')}</p>
          <p class="sgh-where">${esc(_roomLabel(_roomOf(spot)))}</p>
        </article>`;
      }
      return `<article class="sgh-card is-down">
        <header><span class="sgh-tag">HIDDEN</span></header>
        <div class="sgh-cbody">${avatar(name, 30)}<b>${esc(name)}</b></div>
        <p class="sgh-approach">${esc(approach)}</p>
        <div class="sgh-hatch" aria-hidden="true"></div>
      </article>`;
    }).join('')}
  </div>`;

  // ── the feed ────────────────────────────────────────────────────────
  const feed = steps.map(s => {
    if (s.i > state.idx) {
      return `<div class="sgh-ev is-void"><span>?</span></div>`;
    }
    const text = esc(s.beat.text);
    const faces = who => who.filter(Boolean).map(n => avatar(n, 30)).join('');

    if (s.kind === 'intro') {
      return `<article class="sgh-ev is-intro">
        <header><span class="sgh-evtag">HIDE PHASE</span><span class="sgh-evsub">ten minutes each, alone</span></header>
        <div class="sgh-evfaces">${faces(s.players)}</div>
        <p>${text}</p>
        <p class="sgh-flavor">${esc(_pick(YARD_CHATTER, `${ep.num}|intro|${s.i}`))}</p>
      </article>`;
    }
    if (s.kind === 'hide') {
      return `<article class="sgh-ev is-hide">
        <header><span class="sgh-evtag">HIDDEN</span><span class="sgh-evsub">spot withheld</span></header>
        <div class="sgh-evfaces">${faces([s.owner])}</div>
        <p>${text}</p>
        <p class="sgh-flavor">${esc(_pick(YARD_CHATTER, `${ep.num}|hide|${s.i}`))}</p>
      </article>`;
    }
    if (s.kind === 'miss') {
      return `<article class="sgh-ev is-miss">
        <header><span class="sgh-evtag">NOTHING</span></header>
        <div class="sgh-evfaces">${faces([s.searcher])}</div>
        <p>${text}</p>
        <p class="sgh-flavor">${esc(_pick(MISS_ASIDE, `${ep.num}|miss|${s.i}`))}</p>
      </article>`;
    }
    if (s.kind === 'found') {
      const left = roster.length - steps.slice(0, s.i + 1).filter(x => x.kind === 'found').length;
      return `<article class="sgh-ev is-found">
        <header>
          <span class="sgh-evtag">CARD ON THE BOARD</span>
          <span class="sgh-evroom">${esc(_roomLabel(s.room))}</span>
          ${s.turn != null ? `<span class="sgh-evsub">${esc(ordinal(s.turn))} sweep</span>` : ''}
        </header>
        <div class="sgh-duo">
          <div class="sgh-side"><span class="sgh-role">FINDER</span>${
            s.finder ? `${avatar(s.finder, 34)}<b>${esc(s.finder)}</b>` : '<span class="sgh-noone">the clock</span>'}</div>
          <div class="sgh-arrow" aria-hidden="true"></div>
          <div class="sgh-side is-victim"><span class="sgh-role">CARD</span>${
            s.victim ? `${avatar(s.victim, 34)}<b>${esc(s.victim)}</b>` : ''}</div>
        </div>
        <p>${text}</p>
        ${s.spot ? `<p class="sgh-evspot"><i class="sgh-pin" aria-hidden="true"></i>${esc(s.spot)}</p>` : ''}
        <p class="sgh-flavor">${esc(_pick(HOUSE_NOISE, `${ep.num}|noise|${s.i}`))} <b>${left} still hidden.</b></p>
      </article>`;
    }
    if (s.kind === 'wreck') {
      return `<article class="sgh-ev is-wreck">
        <header><span class="sgh-evtag">HOUSE WRECKED</span><span class="sgh-evsub">two in the morning</span></header>
        <div class="sgh-duo">
          <div class="sgh-side"><span class="sgh-role">DID MOST OF IT</span>${
            s.wrecker ? `${avatar(s.wrecker, 34)}<b>${esc(s.wrecker)}</b>` : ''}</div>
          <div class="sgh-arrow is-bad" aria-hidden="true"></div>
          <div class="sgh-side is-victim"><span class="sgh-role">BED FLIPPED</span>${
            s.wronged ? `${avatar(s.wronged, 34)}<b>${esc(s.wronged)}</b>` : ''}</div>
        </div>
        <p>${text}</p>
        ${s.wrecker && s.wronged ? `<div class="sgh-grudge">
          <span>GRUDGE FILED</span>
          <em>${esc(s.wronged)} will remember this longer than the comp. ${esc(s.wrecker)} takes the house's opinion with it.</em>
        </div>` : ''}
        <div class="sgh-scratch" aria-hidden="true"></div>
      </article>`;
    }
    if (s.kind === 'veto') {
      return `<article class="sgh-ev is-veto">
        <header><span class="sgh-evtag">${esc(String(s.beat.badgeText || 'VETO'))}</span><span class="sgh-evroom">${esc(_roomLabel(s.room))}</span></header>
        <div class="sgh-evfaces">${faces([s.owner])}</div>
        <p>${text}</p>
        ${s.spot ? `<div class="sgh-goldspot">
          <span>THE ONE CARD THE HOUSE NEVER FOUND</span>
          <em>${esc(s.spot)}</em>
        </div>` : ''}
      </article>`;
    }
    return `<article class="sgh-ev">
      <header><span class="sgh-evtag">${esc(String(s.beat.badgeText || 'HOUSE'))}</span></header>
      <div class="sgh-evfaces">${faces(s.players)}</div>
      <p>${text}</p>
    </article>`;
  }).join('');

  // ── what the comp was ───────────────────────────────────────────────
  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const satOut = (comp.excluded || []).filter(Boolean);
  const explainer = `<div class="sgh-what">
    <div class="sgh-what-h">
      <span class="sgh-cat" style="color:${accent};border-color:${accent}55">${esc(cat.label || 'COMPETITION')}</span>
      <b>${esc(comp.name || 'Hide and Go Veto')}</b>
    </div>
    ${comp.desc ? `<p class="sgh-what-d">${esc(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="sgh-what-w">${weights.map(([k, w]) => `<span class="sgh-w">
      <i>${esc(k)}</i><span class="sgh-wbar"><b style="width:${Math.round(w * 100)}%;background:${accent}"></b></span>
      <u>${Math.round(w * 100)}%</u></span>`).join('')}</div>` : ''}
    <div class="sgh-what-f">
      <span>${roster.length} cards in the house</span>
      ${satOut.length ? `<span>Sat out: ${satOut.map(esc).join(', ')}${
        actType === 'hoh' && act.outgoingHoh ? ` · ${esc(act.outgoingHoh)} cannot defend the room` : ''}</span>` : ''}
    </div>
  </div>`;

  const controls = reveal ? `<div class="sgh-controls">
    ${done ? '<span class="sgh-done">Every room has been turned over.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
        state.idx < 0 ? 'Start the search' : 'Next room'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="sgh-count">${Math.min(total, revealed)} / ${total}</span>
  </div>` : '';

  const verdict = done && winner
    ? `<div class="sgh-verdict">${esc(winner)} never had to search. ${esc(winner)} only had to hide.</div>` : '';

  return `<div class="rp-page bb-room ${actType === 'hoh' ? 'bb-power' : 'bb-block'} sighide">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&family=Karla:wght@400;600;700&display=swap');
      .sighide{--sgh-wood:#2a1d14;--sgh-warm:#f0c07a;--sgh-lit:#ffcf8a;--sgh-gold:#f0a500;--sgh-red:#e5484d;--sgh-ink:#f3e7d6;--sgh-dim:#a08a72;
        max-width:1100px;margin:0 auto;font-family:'Karla',system-ui,sans-serif;color:var(--sgh-ink)}
      .sighide *{box-sizing:border-box}
      .sgh-head{text-align:center;margin-bottom:4px}
      .sgh-title{font-family:'Archivo Black',sans-serif;font-size:30px;letter-spacing:2px;line-height:1.05;
        color:var(--sgh-warm);text-shadow:0 2px 0 #00000055,0 0 26px #f0c07a26}
      .sgh-sub{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:2px;color:var(--sgh-dim);margin-top:6px;text-transform:uppercase}

      .sgh-what{border:1px solid #6b4b2e55;background:linear-gradient(180deg,#2a1d1499,#1c130d99);border-radius:10px;padding:12px 14px;margin:14px 0}
      .sgh-what-h{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .sgh-what-h b{font-family:'Archivo Black',sans-serif;font-size:15px;letter-spacing:1px}
      .sgh-cat{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:2px;border:1px solid;border-radius:3px;padding:2px 6px}
      .sgh-what-d{font-size:12.5px;line-height:1.6;color:#d9c6ad;margin:8px 0 0}
      .sgh-what-w{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
      .sgh-w{display:flex;align-items:center;gap:6px;font-size:10px;font-family:'Space Mono',monospace;color:var(--sgh-dim)}
      .sgh-w i{font-style:normal;text-transform:uppercase;letter-spacing:1px}
      .sgh-wbar{display:inline-block;width:54px;height:4px;background:#ffffff14;border-radius:2px;overflow:hidden}
      .sgh-wbar b{display:block;height:100%}
      .sgh-what-f{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:10.5px;color:var(--sgh-dim);font-family:'Space Mono',monospace}

      .sgh-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin:12px 0}
      .sgh-stat{border:1px solid #6b4b2e44;border-radius:8px;padding:10px;text-align:center;background:#2a1d1466}
      .sgh-stat b{display:block;font-family:'Archivo Black',sans-serif;font-size:22px;color:var(--sgh-warm)}
      .sgh-stat.is-big b{font-size:30px;color:var(--sgh-lit)}
      .sgh-stat span{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:var(--sgh-dim)}

      .sgh-mapwrap{margin:12px 0 16px}
      .sgh-map{border:1px solid #6b4b2e66;border-radius:12px;overflow:hidden;background:radial-gradient(120% 100% at 50% 0%,#3a2a1e,#160f0a)}
      .sgh-map svg{display:block;width:100%;height:auto}
      .sgh-shell{fill:url(#sghFloor);stroke:#7a5a38;stroke-width:2}
      .sgh-rfill{fill:#241811;transition:fill .5s ease}
      .sgh-rline{fill:none;stroke:#6b4b2e;stroke-width:1.5}
      .sgh-rglow{fill:#ffcf8a;opacity:0;transition:opacity .6s ease}
      .sgh-rlabel{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.4px;fill:#8d7359}
      .sgh-rhits{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1px;fill:#e5484d;text-anchor:end}
      .sgh-room.is-lit .sgh-rfill{fill:#3d2a19}
      .sgh-room.is-lit .sgh-rglow{opacity:.13;animation:sghBreathe 4.5s ease-in-out infinite}
      .sgh-room.is-lit .sgh-rlabel{fill:var(--sgh-lit)}
      .sgh-room.is-lit .sgh-rline{stroke:#b98a4e}
      .sgh-room.is-gold .sgh-rglow{fill:#f0a500;opacity:.22;animation:sghBreathe 2.6s ease-in-out infinite}
      .sgh-room.is-gold .sgh-rline{stroke:var(--sgh-gold);stroke-width:2.5}
      .sgh-room.is-gold .sgh-rlabel{fill:var(--sgh-gold)}
      .sgh-debris{fill:#c9b08e;opacity:.75;stroke:#00000033}
      .sgh-d-feather{fill:#efe3d2}
      .sgh-d-stuffing{fill:#f6efe4}
      .sgh-d-drawer{fill:#7a5a38}
      .sgh-d-cushion{fill:#a8654a}
      .sgh-d-sock{fill:#9aa7b5}
      .sgh-d-shard{fill:#cfd8e2}
      .sgh-grime{fill:#1a0d05;opacity:0;pointer-events:none;transition:opacity .6s ease}
      .sgh-map.wr-2 .sgh-grime{opacity:.06}
      .sgh-map.wr-3 .sgh-grime{opacity:.10}
      .sgh-map.wr-4 .sgh-grime{opacity:.15}
      .sgh-map.wr-5 .sgh-grime{opacity:.20}
      .sgh-map.wr-6 .sgh-grime{opacity:.26}
      .sgh-sweep{animation:sghSweep 9s linear infinite;opacity:.8}
      .sgh-maplegend{display:flex;gap:16px;justify-content:center;margin-top:8px;font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:1.2px;color:var(--sgh-dim);text-transform:uppercase}
      .sgh-maplegend span{display:inline-flex;align-items:center;gap:6px}
      .sgh-key{width:10px;height:10px;border-radius:2px;display:inline-block;border:1px solid #6b4b2e}
      .sgh-key-dark{background:#241811}
      .sgh-key-lit{background:#3d2a19;border-color:#b98a4e}
      .sgh-key-gold{background:#f0a50044;border-color:var(--sgh-gold)}

      .sgh-secl{display:flex;align-items:center;gap:10px;margin:18px 0 8px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:2.4px;color:var(--sgh-dim);text-transform:uppercase}
      .sgh-secl:after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#6b4b2e88,transparent)}

      .sgh-rack{display:grid;grid-template-columns:repeat(auto-fill,minmax(184px,1fr));gap:10px}
      .sgh-card{position:relative;border-radius:10px;padding:10px;border:1px solid #6b4b2e66;background:#221710;overflow:hidden;min-height:112px}
      .sgh-card.is-void{display:flex;align-items:center;justify-content:center;opacity:.2;color:var(--sgh-dim);font-family:'Archivo Black',sans-serif}
      .sgh-card header{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:8px}
      .sgh-tag{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:1.6px;color:var(--sgh-dim);border:1px solid #6b4b2e88;border-radius:3px;padding:1px 5px}
      .sgh-by{font-family:'Space Mono',monospace;font-size:8.5px;color:var(--sgh-red)}
      .sgh-cbody{display:flex;align-items:center;gap:8px}
      .sgh-cbody b{font-size:13px;font-weight:700}
      .sgh-approach{font-size:11px;line-height:1.5;color:#c6b096;margin:8px 0 0;position:relative;z-index:1}
      .sgh-spot{font-family:'Space Mono',monospace;font-size:10.5px;line-height:1.5;color:#ffd9a8;margin:8px 0 0}
      .sgh-where{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:1.4px;color:var(--sgh-dim);margin:4px 0 0;text-transform:uppercase}
      .sgh-hatch{position:absolute;inset:0;pointer-events:none;opacity:.14;
        background:repeating-linear-gradient(135deg,#f0c07a 0 2px,transparent 2px 7px)}
      .sgh-back-mark{font-size:20px}
      .sgh-card.is-up{border-color:#e5484d77;background:linear-gradient(180deg,#2b1512,#20120e)}
      .sgh-card.is-up .sgh-tag{color:var(--sgh-red);border-color:#e5484d66}
      .sgh-card.is-gold{border-color:var(--sgh-gold);background:linear-gradient(180deg,#3a2a0d,#241a08);box-shadow:0 0 26px #f0a50026}
      .sgh-card.is-gold .sgh-tag{color:var(--sgh-gold);border-color:#f0a50077}
      .sgh-card.is-gold:before{content:'';position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent,#f0a5001f,transparent 40%);animation:sghSpin 12s linear infinite}
      .sgh-card.is-gold>*{position:relative;z-index:1}

      .sgh-ev{border-radius:10px;padding:12px 14px;margin-bottom:9px;border:1px solid #6b4b2e55;border-left:3px solid #6b4b2e;background:#22170f99;position:relative;overflow:hidden}
      .sgh-ev.is-void{display:flex;align-items:center;justify-content:center;opacity:.12;min-height:34px;padding:8px;border-style:dashed;color:var(--sgh-dim)}
      .sgh-ev header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
      .sgh-evtag{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.6px;padding:2px 6px;border-radius:3px;background:#ffffff10;color:var(--sgh-dim)}
      .sgh-evsub,.sgh-evroom{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:1.3px;color:var(--sgh-dim);text-transform:uppercase}
      .sgh-evroom{color:var(--sgh-lit)}
      .sgh-ev p{font-size:12.5px;line-height:1.65;margin:0}
      .sgh-ev p.sgh-flavor{font-size:11px;color:#9c8570;margin-top:8px;font-style:italic}
      .sgh-flavor b{font-style:normal;color:var(--sgh-warm);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px}
      .sgh-evfaces{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
      .sgh-ev.is-intro{border-left-color:var(--sgh-warm);background:linear-gradient(180deg,#33230f99,#22170f99)}
      .sgh-ev.is-intro .sgh-evtag{color:var(--sgh-warm);background:#f0c07a1a}
      .sgh-ev.is-hide{border-left-color:#6b4b2e}
      .sgh-ev.is-miss{border-left-color:#4a3c30;opacity:.9}
      .sgh-ev.is-found{border-left-color:var(--sgh-red);background:linear-gradient(180deg,#2c1512aa,#20120e99)}
      .sgh-ev.is-found .sgh-evtag{color:var(--sgh-red);background:#e5484d1a}
      .sgh-ev p.sgh-evspot{font-family:'Space Mono',monospace;font-size:11px;color:#ffd9a8;margin-top:8px;display:flex;gap:8px;align-items:flex-start}
      .sgh-pin{flex:0 0 auto;width:10px;height:10px;margin-top:3px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--sgh-red);box-shadow:0 0 8px #e5484d88}
      .sgh-duo{display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
      .sgh-side{display:flex;align-items:center;gap:8px}
      .sgh-side b{font-size:13px}
      .sgh-role{font-family:'Space Mono',monospace;font-size:8px;letter-spacing:1.4px;color:var(--sgh-dim);display:block}
      .sgh-noone{font-family:'Space Mono',monospace;font-size:11px;color:var(--sgh-dim)}
      .sgh-arrow{width:34px;height:2px;background:linear-gradient(90deg,#6b4b2e,#e5484d);position:relative}
      .sgh-arrow:after{content:'';position:absolute;right:-1px;top:-4px;border-left:8px solid #e5484d;border-top:5px solid transparent;border-bottom:5px solid transparent}
      .sgh-arrow.is-bad{background:linear-gradient(90deg,#6b4b2e,#f85149)}
      .sgh-ev.is-wreck{border-left-color:#f85149;border-color:#f8514955;
        background:linear-gradient(180deg,#31100f,#1d0c0a)}
      .sgh-ev.is-wreck .sgh-evtag{color:#f85149;background:#f851491f}
      .sgh-scratch{position:absolute;inset:0;pointer-events:none;opacity:.12;
        background:repeating-linear-gradient(-52deg,#f85149 0 1px,transparent 1px 14px)}
      .sgh-grudge{margin-top:10px;border:1px dashed #f8514977;border-radius:8px;padding:8px 10px;background:#f851490d;position:relative;z-index:1}
      .sgh-grudge span{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:2px;color:#f85149;display:block;margin-bottom:4px}
      .sgh-grudge em{font-style:normal;font-size:11.5px;line-height:1.55;color:#f0d2cf}
      .sgh-ev.is-veto{border-left-color:var(--sgh-gold);border-color:#f0a50055;
        background:linear-gradient(180deg,#3a2a0d,#221806)}
      .sgh-ev.is-veto .sgh-evtag{color:var(--sgh-gold);background:#f0a5001f}
      .sgh-goldspot{margin-top:10px;border:1px solid #f0a50088;border-radius:8px;padding:10px 12px;background:#f0a5000f;text-align:center}
      .sgh-goldspot span{display:block;font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:2.2px;color:var(--sgh-gold);margin-bottom:6px}
      .sgh-goldspot em{font-style:normal;font-family:'Archivo Black',sans-serif;font-size:14px;line-height:1.4;color:#ffe3a8}

      .sgh-verdict{margin:14px 0 4px;text-align:center;font-family:'Space Mono',monospace;font-size:11.5px;letter-spacing:1px;color:var(--sgh-warm)}
      .sgh-controls{position:sticky;bottom:0;z-index:5;display:flex;gap:8px;justify-content:center;align-items:center;
        margin-top:14px;padding:10px;border-top:1px solid #6b4b2e55;
        background:linear-gradient(180deg,#160f0acc,#160f0af5);backdrop-filter:blur(4px)}
      .sgh-count{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.4px;color:var(--sgh-dim)}
      .sgh-done{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:1.4px;color:var(--sgh-warm)}
      .sgh-avf{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#6b4b2e;color:#fff;font-weight:700;font-size:12px}

      @keyframes sghBreathe{0%,100%{opacity:.09}50%{opacity:.2}}
      @keyframes sghSweep{0%{transform:translateX(0)}100%{transform:translateX(880px)}}
      @keyframes sghSpin{to{transform:rotate(360deg)}}
      @media(prefers-reduced-motion:reduce){
        .sgh-sweep{display:none}
        .sgh-room.is-lit .sgh-rglow,.sgh-room.is-gold .sgh-rglow{animation:none;opacity:.16}
        .sgh-card.is-gold:before{animation:none}
        .sgh-rfill,.sgh-rglow,.sgh-grime{transition:none}
      }
      @media(max-width:720px){
        .sgh-title{font-size:22px}
        .sgh-rack{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
      }
    </style>

    <div class="rp-eyebrow">Week ${esc(String(ep.num ?? ''))}</div>
    <div class="sgh-head">
      <div class="sgh-title">HIDE AND GO VETO</div>
      <div class="sgh-sub">${roster.length} cards &middot; one house &middot; the last one never found wins</div>
    </div>
    ${explainer}
    ${strip}
    ${map}
    <div class="sgh-secl">The cards</div>
    ${rack}
    <div class="sgh-secl">The search</div>
    ${feed}
    ${verdict}
    ${controls}
  </div>`;
}
