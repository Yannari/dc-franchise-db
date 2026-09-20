// ════════════════════════════════════════════════════════════════
//  EPISODE STAGE — the screenplay reader, played as a scene
// ════════════════════════════════════════════════════════════════
// current-season.html used to render an episode as one column of chat
// bubbles: every scene looked the same whether it was the dock or tribal.
// This draws it instead — the island set the [SCENE:] header names, the
// people on its [Present:] list standing in it as portrait standees, the
// speaker stepping forward with a typewriter dialogue box, confessionals cut
// to a close-up, ballots read at tribal, the challenge's dismissals benched.
// Built from mockup/mockup-episode-stage.html, which stays as the playground.
//
// TOTAL DRAMA ONLY. The sets are island sets and the vocabulary ("the tribe
// has spoken", torches, a camp) is Total Drama's; the page keeps its script
// reader for every other show rather than print one show's words over another.
//
// The transcript contract:
//   [SCENE: Green camp — well — morning. Staging.] [Present: A, B. Coaches: C. Host: Chris.]
//   Name: [cue] line.        [Confessional: Name]        [Stage direction.]
// With a [Present:] list, a name only mentioned in prose is not drawn —
// "the shelter feels bigger without Yul" must not put Yul in the shelter.
//
// Pure pieces (parseEpisode, estimateRuntime, buildChapters) are exported for
// the tests; mountEpisodeStage(host, text, opts) draws into a shadow root so
// the page's .btn/.card/.scene rules and these never touch each other.
//
// MUSIC is the simulator's own: js/audio.js's ambient beds (the mp3s in
// assets/audio/) and its cues, through the same singleton, so the music
// on/off and volume a viewer set in the simulator hold here too.
import { audio } from './audio.js';

import { stageShow, hasStage } from './stage-shows.js';
export { hasStage };

// The show whose episode this is — its sets, words and rules (js/stage-shows.js).
// parse() switches it; the engine reads the same bindings after.
let SH = stageShow();
let SETS, TIMES, timeOf, skySVG, pickSet;
function useShow(id){ SH = stageShow(id); ({ SETS, TIMES, timeOf, skySVG, pickSet } = SH.sets); return SH; }
// the exit and its voting booth are one ceremony: votes cast in one are read in either
const isExitSet = set => set === SH.exitSet || (!!SH.boothSet && set === SH.boothSet);
useShow();

// ════════════════════════════════════════════════════════════════
//  CAST — built from the transcript itself: every speaker plus every
//  name on a [Present:] list. Portrait = assets/avatars/<slug>.png.
// ════════════════════════════════════════════════════════════════
// The page knows which portrait this season drew for each person (window.portraitFor,
// passed as opts.portrait). This module never builds a path from a name itself: a
// slug cannot know which of a returnee's looks this season used, and guessing draws
// the wrong face confidently. With no resolver, a standee shows its initial.
let portraitOf = () => '';
const TRIBE_COLORS = { green:'#4ade80', blue:'#60a5fa', red:'#f87171', yellow:'#facc15', purple:'#c084fc',
                       orange:'#fb923c', pink:'#f472b6', black:'#9ca3af', white:'#e5e7eb', gold:'#fbbf24' };
const TRIBE_RE = new RegExp(`\\b(${Object.keys(TRIBE_COLORS).join('|')})\\b`, 'i');
const PALETTE = ['#7ec8ff','#ff5fa2','#7dff8a','#8fa2ff','#ffb86b','#c58bff','#5ff2d6','#ff7a6b','#ffe066','#9be15d','#ff9ecd','#8bd3dd'];
const hashStr = s => Math.abs([...s].reduce((a,c) => (a*31 + c.charCodeAt(0)) | 0, 7));
// "Green camp", "Kinosa camp" → the team (the show's profile says what a team's
// place looks like). Internally every show's team is `tribe`; the words on
// screen come from the profile. A colour word gets its colour, any other team
// name a steady colour of its own.
function tribeOfPlace(place){
  const m = place.match(SH.groupPlace);
  if (m && !SH.notGroups.test(m[1])) return m[1].toLowerCase();
  return (place.match(TRIBE_RE) || [])[1]?.toLowerCase() || null;
}
// "30" from an authored age, else worked out from a birthdate; nothing rather than a guess.
export function ageOf(p, today = new Date()){
  if (!p) return null;
  if (p.age != null && p.age !== '' && Number.isFinite(Number(p.age))) return Number(p.age);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(p.birthdate || '');
  if (!m) return null;
  let a = today.getFullYear() - +m[1];
  if (today.getMonth() + 1 < +m[2] || (today.getMonth() + 1 === +m[2] && today.getDate() < +m[3])) a--;
  return a;
}
export const tribeColor = t => TRIBE_COLORS[t] || (t ? PALETTE[hashStr(t) % PALETTE.length] : '#8a5a33');
let CAST = {};
function ensureCast(n, role){
  if (!CAST[n]) CAST[n] = { img:portraitOf(n),
    c:SH.hostColors[n] || PALETTE[hashStr(n) % PALETTE.length],
    host:SH.hosts.includes(n), role:SH.hosts.includes(n) ? 'host' : 'player', tribe:null };
  if (role === 'host'){ CAST[n].host = true; CAST[n].role = 'host'; }
  if (role === 'coach' && !CAST[n].host) CAST[n].role = 'coach';
  return CAST[n];
}



// ════════════════════════════════════════════════════════════════
//  PARSER — transcript → scenes + beats
// ════════════════════════════════════════════════════════════════
const SPK = /^([A-Z][a-zA-Z'\-]+(?: [A-Z][a-zA-Z'\-]+)?):\s*(.+)$/;
const NOT_NAMES = /^(present|confessional|scene|title|title card|previously|producer|phase|host|hosts|coach|coaches|note|voting|later|players?)$/i;
const NAME_RE = /^[A-Z][a-zA-Z'\-]+(?: [A-Z][a-zA-Z'\-]+)?$/;
const isName = n => NAME_RE.test(n || '') && n !== n.toUpperCase() && !NOT_NAMES.test(n);
const stripCues = s => s.replace(/\[[^\]]*\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
const TIME_WORDS = /morning|dawn|sunrise|midday|noon|\bday\b|afternoon|dusk|sunset|evening|night|midnight/i;

// "Natalia, Manu. Coaches: James, Julia. Host: Chris, Chef." → [[name, role]]
function parsePresent(body){
  const out = [];
  body.split(/[.;]\s*(?=[A-Z][a-zA-Z]*\s*:)/).forEach(seg => {
    const m = seg.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/);
    let role = 'player', list = seg;
    if (m){ const lab = m[1].toLowerCase(); list = m[2];
      role = /^host/.test(lab) ? 'host' : /^coach/.test(lab) ? 'coach' : /^(background|extras?|crowd)/.test(lab) ? 'bg' : 'player'; }
    const names = list.split(/,|\band\b/).map(s => s.replace(/[.\s]+$/, '').trim()).filter(isName);
    // "Background: all remaining contestants milling around" → an unnamed crowd
    if (role === 'bg' && !names.length) out.background = true;
    names.forEach(n => out.push([n, role]));
  });
  return out;
}

// Long text becomes several click-through pages, never cut mid-sentence or mid-[cue].
function sentences(s){ return s.match(/[^.!?…]+(?:[.!?…]+["'”’)]*\s*|$)/g) || [s]; }
function pages(text, max){
  const toks = [];
  text.split(/(\[[^\]]*\])/).forEach(t => {
    if (!t.trim()) return;
    if (t.startsWith('[')) toks.push(t.trim()); else sentences(t).forEach(x => x.trim() && toks.push(x.trim()));
  });
  const out = []; let cur = [], len = 0;
  toks.forEach(t => {
    const l = t.startsWith('[') ? Math.min(t.length, 30) : t.length;
    if (len && len + l > max){ out.push(cur.join(' ')); cur = []; len = 0; }
    cur.push(t); len += l;
  });
  if (cur.length) out.push(cur.join(' '));
  // a page that is only a stage cue rides along with the words before it
  return out.reduce((acc, pg) => { if (acc.length && !stripCues(pg)) acc[acc.length-1] += ' ' + pg; else acc.push(pg); return acc; }, []);
}

// A stage direction that moves the camera somewhere else inside the same scene:
// "[At the well. …]", "[Later — the dock. …]", "[Late that night. …]".
// (the cues and spot names are the show's: SH.cutLead, SH.locPhrase, SH.cutSpots)
function subView(text, scene, afterCard){
  const head = text.slice(0, afterCard ? 400 : 140);
  // guessing a move only makes sense at home — "a compound built on the beach" is the challenge, not a trip to the beach
  if (!afterCard && (scene.set === SH.compSet || isExitSet(scene.set))) return null;
  const first = sentences(text)[0] || '';
  if (!afterCard && !SH.cutLead.test(text) && !SH.locPhrase.test(first)) return null;
  const allowed = k => !((k === SH.homeSet || k === SH.compSet) && scene.set !== k);   // only return to the scene's own base
  let set = null;
  const named = (head.match(SH.locPhrase) || [])[2];   // "near the tree line" beats keyword order
  if (named) set = SH.cutSpots.find(([k, re]) => re.test('the ' + named) && allowed(k))?.[0] || null;
  if (!set) for (const [k, re] of SH.cutSpots){ if (re.test(head) && allowed(k)){ set = k; break; } }
  const t = head.toLowerCase();
  const time = /\b(night|dark|moonlight|stars)\b/.test(t) ? 'night' : /\b(dusk|sunset|evening)\b/.test(t) ? 'dusk'
             : /\b(morning|dawn|sunrise)\b/.test(t) ? 'morning' : /\bafternoon\b/.test(t) ? 'afternoon' : null;
  if (!set && !time) return null;
  return { set: set || scene.view.set, time: SETS[scene.set].forceTime || time || scene.view.time };
}

// The weather a scene opens in — only when the prose says it is happening now
// ("it rained all night" is yesterday). A stage direction can start or stop it.
function weatherOf(text){
  if (/\b(storm(y|ing)?|thunder\w*|lightning)\b/i.test(text)) return 'storm';
  if (/\b(raining|pouring|downpour|drizzl\w*|rain (falls|pours|hammers|lashes|comes down)|in the rain)\b/i.test(text)) return 'rain';
  return null;
}

const VOTE_ORDINAL = /^(?:the\s+)?(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|next|last|final)\s+vote\b[\s.,:;!…—–-]*/i;

function parse(text, opts = {}){
  useShow(opts.show);
  CAST = {};
  portraitOf = opts.portrait || (() => '');
  let lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
  // "[SCENE: …] [Present: …]" on one line → two lines
  lines = lines.flatMap(l => /^\[/.test(l) && !l.replace(/\[[^\]]*\]/g, '').trim() ? l.match(/\[[^\]]*\]/g) : [l]);
  const speakers = new Set();
  lines.forEach(l => { const m = l.match(SPK); if (m && isName(m[1])) speakers.add(m[1]); });
  // "…[He stares at the camera.] James: The goat…" → the second speech on its own line
  lines = lines.flatMap(l => l.replace(/\]\s+([A-Z][a-zA-Z'\-]+(?: [A-Z][a-zA-Z'\-]+)?):\s/g,
    (all, n) => speakers.has(n) ? `]\n${n}: ` : all).split('\n'));
  lines.forEach(l => { const m = l.match(/^\[present\s*:\s*(.*)\]$/i); if (m) parsePresent(m[1]).forEach(([n, r]) => ensureCast(n, r)); });
  speakers.forEach(n => ensureCast(n));

  const names = Object.keys(CAST);
  const rx = {}; names.forEach(n => rx[n] = new RegExp(`\\b${n}\\b`));
  // names as written in prose (case-sensitive, so "the lake" is not Lake), in text order
  const mentioned = s => names.map(n => [n, s.search(rx[n])]).filter(([,i]) => i >= 0).sort((a,b) => a[1]-b[1]).map(([n]) => n);
  const findName = w => names.find(n => n.toLowerCase() === w.toLowerCase());

  // A vote is read when a host line OPENS with a player's name, optionally after
  // "First vote —" / "Next vote…" / "Last vote:". A line that opens with a count
  // ("Two votes James, one Julia") is a recap, not a vote.
  const readVote = t => {
    const ord = t.match(VOTE_ORDINAL);
    const rest = (ord ? t.slice(ord[0].length) : t).replace(/^[\s“"'.…—–-]+/, '');
    const m = rest.match(/^([A-Z][a-zA-Z'\-]+(?: [A-Z][a-zA-Z'\-]+)?)\b/);
    const n = m && (findName(m[1]) || findName(m[1].split(' ')[0]));
    return n && !CAST[n].host ? { name:n, ordinal:!!ord } : null;
  };
  const out = { show:'', ep:'', title:'', scenes:[], beats:[], profile: SH };
  let scene = null, conf = null, reading = false, afterCard = false, lastNamed = null, lastActor = null, lastSpeaker = null, tally = {};
  let curChallenge = null;   // "[Challenge: …]" — the twist being played, until another is named
  const push = b => (out.beats.push(b), b);
  const addP = n => {
    if (!scene || !CAST[n] || scene.present.includes(n)) return;
    scene.present.push(n);
    if (scene.listed.length && !scene.listed.includes(n)) scene.late[n] = Math.min(out.beats.length, scene.mentionAt[n] ?? Infinity);
  };

  const newScene = inner => {
    inner = inner.replace(/^scene\s*[:\-]?\s*/i, '');
    // "Place — spot — time. Staging." / "Place — spot — Phase 3: Dance Drill." / "Place — time. Staging."
    const dot = inner.search(/\.(\s|$)/);
    const head = dot > 0 ? inner.slice(0, dot) : inner;
    const staging = dot > 0 ? inner.slice(dot + 1).trim() : '';
    const parts = head.split(/\s+[—–]\s+|\s+-\s+/).map(s => s.trim()).filter(Boolean);
    const place = parts[0];
    let sub = '', timeWord = '', phase = null, declared = false;
    parts.slice(1).forEach(pt => {
      const ph = pt.match(/^phase\s*(\d+)\s*:?\s*(.*)$/i);
      if (ph){ phase = { n:ph[1], title:ph[2] }; declared = true; return; }
      if (!timeWord && TIME_WORDS.test(pt)){ timeWord = pt; return; }
      declared = true;   // the header names a spot, even "various": the writer placed this scene
      if (!sub && !/^(post|pre)-|between phases|^various$|^later$/i.test(pt)) sub = pt;
    });
    const fromPlace = pickSet(place), base = fromPlace !== 'island' ? fromPlace : pickSet(inner);
    const subSet = sub && SH.spots.find(([k, re]) => re.test(sub) && !((k === SH.compSet || k === SH.homeSet) && base !== k))?.[0];
    // at the exit, only the booth is a different room; every other spot is the council itself
    let set = base === SH.exitSet ? (SH.boothSet && subSet === SH.boothSet ? SH.boothSet : SH.exitSet) : subSet || base;
    // a competition is played on a kit: the one its spot names ("— mess tent —" is a kitchen), else the
    // tagged challenge's, else the place's own set. A kit that only exists at night waits for night.
    const compScene = base === SH.compSet || !!phase || SH.compPlace.test(place);
    let spotKit = null;
    if (compScene && SH.kits){
      const hour = timeWord ? timeOf(timeWord) : TIME_WORDS.test(head) ? timeOf(head) : null;
      const fits = k => k && SETS[k] && (!SETS[k].forceTime || !hour || SETS[k].forceTime === hour);
      spotKit = sub && SH.kitSpots?.find(([k, re]) => re.test(sub) && fits(k))?.[0];
      if (spotKit) set = spotKit;
      else if (curChallenge?.kit && fits(curChallenge.kit) && (set === SH.compSet || set === base)) set = curChallenge.kit;
    }
    // no time in the header → the last scene at this place carries on (a challenge phase keeps its daylight)
    const prevSame = [...out.scenes].reverse().find(s => s.place === place);
    const time = SETS[set].forceTime || (timeWord ? timeOf(timeWord) : TIME_WORDS.test(head) ? timeOf(head) : prevSame ? prevSame.time : timeOf(inner));
    const tribe = tribeOfPlace(place);
    scene = { i:out.scenes.length, header:inner, place, sub, phase, declared, staging, set, time, view:{ set, time }, background:false,
              tribe, groupColor: tribe ? tribeColor(tribe) : null, weather: weatherOf(inner),
              present:[], listed:[], roles:{}, late:{}, mentionAt:{}, elim:null, stagingDone:false,
              comp: compScene, challenge: compScene ? curChallenge : null, spotKit: !!spotKit };
    out.scenes.push(scene);
    conf = null; reading = false; afterCard = false; lastNamed = null; lastActor = null; lastSpeaker = null; tally = {};
    push({ t:'scene', scene:scene.i });
  };

  // The booth is where a vote is WRITTEN, one player at a time. The moment one is read
  // aloud the ceremony is back at the urn — a host reading the votes in an empty booth is
  // a room nobody is in. Any read, exit or snuff cuts the camera back to the council.
  const backToCouncil = () => {
    if (!SH.boothSet || !scene || scene.view.set !== SH.boothSet) return;
    scene.view = { set: SH.exitSet, time: scene.view.time };
    push({ t:'cut', scene:scene.i, set:SH.exitSet, time:scene.view.time });
  };

  function dir(text){
    const prev = out.beats[out.beats.length - 1];
    const inConf = prev && prev.t === 'line' && (prev.conf || prev.host);
    // a header that names its spot ("Green camp — well") already placed us; only old-style scenes cut mid-scene
    const cut = scene.declared ? null : subView(text, scene, afterCard); afterCard = false;
    if (cut && (cut.set !== scene.view.set || cut.time !== scene.view.time)){
      scene.view = cut; push({ t:'cut', scene:scene.i, set:cut.set, time:cut.time });
    }
    const ms = mentioned(text);
    if (!scene.listed.length) ms.forEach(addP);
    else ms.forEach(n => { if (!scene.listed.includes(n) && scene.mentionAt[n] == null) scene.mentionAt[n] = out.beats.length; });
    const write = text.match(SH.vote.write);
    const found = SH.find && SH.find.re.test(text) && !/\bnothing\b/i.test(text);
    let stay = false;
    if (isExitSet(scene.set) && SH.vote.start.test(text)){ reading = true; backToCouncil(); }   // "[Chris reads the votes.]"
    if (isExitSet(scene.set) && (SH.vote.snuff.test(text) || SH.vote.exit.test(text))) backToCouncil();
    pages(text, 170).forEach(p => {
      // "[Chris unfolds the next parchment: JULIA.]" — a vote read in a stage direction counts too
      if (reading && isExitSet(scene.set) && /\b(vote|parchment|ballot|reads|unfolds|holds up)\b/i.test(p)){
        const named = (p.match(/\b[A-Z]{2,}\b/g) || []).map(findName).find(n => n && !CAST[n].host);
        const reader = scene.present.find(n => CAST[n].host) || SH.hosts.find(h => CAST[h]);
        if (named && reader){
          tally[named] = (tally[named] || 0) + 1;
          push({ t:'vote', scene:scene.i, name:named, speaker:reader, text:p, mood:'tense' });
          return;
        }
      }
      let who = mentioned(p);
      // after a confessional or host shot, "He grins" is the person on camera, not the last name in the prose
      if (!who.length && !inConf && /^(he|she|they|his|her|their)\b/i.test(p) && lastNamed) who = [lastNamed];
      if (who.length) lastNamed = who[0];
      const players = who.filter(n => !CAST[n].host);
      stay = inConf && !who.length && text.length < 80;
      const b = push({ t:'dir', scene:scene.i, text:p, who, stay });
      // "Walks to the bell. Rings it." / "walks to the bench" → out of the challenge
      if (SH.benchAct.test(p)) b.out = players[0] || lastActor;
      // in a competition: somebody named goes out on their own, or finishes in a place
      if (scene.comp && !b.out && players.length && SH.benchFall?.test(p)) b.out = players[0];
      const placed = scene.comp && players.length && SH.place ? p.match(SH.place) : null;
      if (placed){
        const w = (placed[1] || placed[2] || 'first').toLowerCase();
        b.place = { name: players[0], label: ({ first:'1ST', second:'2ND', third:'3RD', fourth:'4TH', fifth:'5TH', last:'LAST' })[w] || '1ST' };
      }
      if (players.length) lastActor = players[0];
      if (write && p.includes(write[0])){
        const target = findName(write[1]);
        if (target) b.write = { voter: mentioned(p.slice(0, p.indexOf(write[0])))[0] || lastNamed, name: target };
      }
      if (found && SH.find.word.test(p)){ b.idol = who[0]; if (who[0]) b.event = { kind:'find', label:SH.find.label, names:[who[0]] }; }
      if (SH.vote.snuff.test(p)) b.snuff = scene.elim || who[0];
      // the weather turns
      if (/\b(starts?|begins?) to (rain|pour)|rain (starts|begins)|the sky opens\b/i.test(p)) b.weather = 'rain';
      else if (/\b(thunder|lightning)\b/i.test(p) && !scene.weather) b.weather = 'storm';
      else if (/\b(rain|storm) (stops|lets up|clears|passes)\b/i.test(p)) b.weather = 'clear';
      // what an audience would clip: a kiss, a blindside
      if (!b.event && /\bkiss(es|ed|ing)?\b/i.test(p) && players.length >= 2)
        b.event = { kind:'kiss', label: /spin the bottle|cheek|peck/i.test(p) ? 'SMOOCH!' : 'SHOWMANCE ALERT', names:players.slice(0, 2) };
      if (!b.event && isExitSet(scene.set) && /\b(not expecting|wasn't expecting|blindside\w*|didn't see (it|this) coming|jaw drops)\b/i.test(p) && players.length)
        b.event = { kind:'blindside', label:'BLINDSIDE!', names:players.slice(0, 1) };
    });
    if (!stay) conf = null;
  }

  function speak(who, body){
    if (conf && who !== conf) conf = null;
    // an unlisted host talks to camera — unless this is a competition or an exit, where they simply walk in
    const onAir = /to camera/i.test(body) || !([SH.compSet, SH.exitSet].includes(scene.set) || SH.compPlace.test(scene.place));
    const host = !conf && scene.listed.length > 0 && !scene.present.includes(who) && !!CAST[who]?.host && onAir;
    if (!conf && !host) addP(who);
    const clean = stripCues(body);
    // Chef: "DISMISSED!" sends off whoever the scene was just about
    const dismiss = CAST[who]?.host && SH.benchLine.test(clean) ? lastActor : null;
    // "Owen, you're out!" / "Izzy and Owen are out of the challenge!" — the host names who goes
    const outMany = scene.comp && CAST[who]?.host && SH.benchHost?.test(clean)
      ? mentioned(clean).filter(n => !CAST[n].host && scene.present.includes(n)) : [];
    // the running score, said out loud: "Bass 2, Gophers 1" (two or more name–number pairs)
    let score = null;
    if (scene.comp && CAST[who]?.host){
      const pairs = [...clean.matchAll(/\b([A-Z][A-Za-z']+(?:\s[A-Z][A-Za-z']+)?)\s+(\d{1,3})\b(?!\s*(?:votes?|points? for|seconds?|minutes?))/g)]
        .filter(m => !/^(Phase|Round|Episode|Season|Level|Part|Day|Vote)\b/i.test(m[1]));
      if (pairs.length >= 2) score = Object.fromEntries(pairs.map(m => [m[1], +m[2]]));
    }
    let event = null;
    // an offer on camera, not a report of one in a confessional
    const deal = !conf && !host && clean.match(/\bfinal[- ](two|three|four|2|3|4)\b/i);
    // (who it was offered to: somebody named in it, else whoever answers — filled in after the loop)
    if (deal && /(you and me|me and you|with me|deal|\?)/i.test(clean))
      event = { kind:'deal', label:`FINAL-${({ '2':'TWO', '3':'THREE', '4':'FOUR' }[deal[1]] || deal[1].toUpperCase())} DEAL`,
                names: [who, mentioned(clean).find(n => n !== who && scene.present.includes(n))].filter(Boolean) };
    // admitting to the camera what they told someone else
    if (conf && /\b(didn'?t say that|never said that|i lied|lying to|fake quote|made (it|that|this) up|there is no \w+ plan|there is no plan|wasn'?t true)\b/i.test(clean))
      event = { kind:'lie', label:'LIE TOLD', names:[who] };
    const finalWords = !!scene.elim && who === scene.elim && isExitSet(scene.set);
    if (!CAST[who]?.host && !conf) lastActor = who;
    if (!conf && !host) lastSpeaker = who;
    // "Natalia: [to camera, quiet] …" is a confessional line even without a [Confessional:] header
    // (the voting confessional at the urn, a quick aside mid-scene)
    const toCam = !conf && !CAST[who]?.host && /\[[^\]]*\bto (the )?camera\b/i.test(body);
    const pushLine = () => pages(body, 190).forEach((p, k) =>
      push({ t:'line', scene:scene.i, speaker:who, text:p, conf:!!conf || toCam, host, mood:mood(stripCues(p), p),
             ...(k === 0 && dismiss ? { dismiss } : {}), ...(k === 0 && event ? { event } : {}), ...(finalWords ? { finalWords:true } : {}),
             ...(k === 0 && outMany.length ? { outMany } : {}), ...(k === 0 && score ? { score } : {}) }));
    if (isExitSet(scene.set) && CAST[who]?.host && !conf && !host){
      if (SH.vote.start.test(clean) || VOTE_ORDINAL.test(clean)) reading = true;
      if (reading || SH.vote.exit.test(clean) || SH.vote.final.test(clean)) backToCouncil();
      const nm = mentioned(clean);
      // the name a vote line opens with: "First vote — James.", "James. That's two votes James…", "“Julia.”"
      const read = reading ? readVote(clean) : null;
      if (SH.vote.exit.test(clean) && !scene.elim){
        // "Fourth vote… James. That's enough. Bring me your torch." — the last vote rides in the exit line
        if (read && read.ordinal){
          tally[read.name] = (tally[read.name] || 0) + 1;
          push({ t:'vote', scene:scene.i, name:read.name, speaker:who, text:body, mood:'tense' });
        } else pushLine();
        // who is out: the name the exit line itself gives ("James — that's enough") beats any count,
        // then the count, then (last resort) the last name in the line
        const said = SH.vote.exitName?.map(re => clean.match(re)?.[1]).map(n => n && findName(n)).find(n => n && !CAST[n].host);
        const top = Object.entries(tally).sort((a,b) => b[1] - a[1])[0]?.[0];
        scene.elim = said || top || nm[nm.length - 1];
        if (scene.elim) push({ t:'elim', scene:scene.i, name:scene.elim, tally:{ ...tally } });
        if (SH.vote.final.test(clean)) push({ t:'spoken', scene:scene.i });
        return;
      }
      if (SH.vote.final.test(clean)){ pushLine(); push({ t:'spoken', scene:scene.i }); return; }
      if (read){
        tally[read.name] = (tally[read.name] || 0) + 1;
        push({ t:'vote', scene:scene.i, name:read.name, speaker:who, text:body, mood:'tense' });
        return;
      }
    }
    pushLine();
  }

  for (const line of lines){
    const br = line.match(/^\[(.*)\]$/);
    if (scene && !scene.stagingDone && !(br && /^present\s*:/i.test(br[1]))){
      scene.stagingDone = true;
      if (!scene.listed.length) mentioned(scene.staging).forEach(addP);
    }
    if (br){
      const inner = br[1].trim(), low = inner.toLowerCase();
      if (/^title( card)?\s*:/.test(low)){ out.title = inner.replace(/^title( card)?\s*:\s*/i, ''); continue; }
      if (/^present\s*:/.test(low)){
        if (!scene) continue;
        const pr = parsePresent(inner.replace(/^present\s*:\s*/i, ''));
        if (pr.background) scene.background = true;
        pr.forEach(([n, r]) => {
          scene.listed.push(n); scene.roles[n] = r; addP(n);
          if (scene.tribe && r !== 'host' && !CAST[n].tribe) CAST[n].tribe = scene.tribe;
        });
        continue;
      }
      if (/^confessional/.test(low)){ conf = inner.replace(/^confessional\s*[:\-—]?\s*/i, '').split(/\s+[—–-]\s+/)[0].trim(); continue; }
      // "[Challenge: Hell's Kitchen]" — which twist this is; it picks the kit and titles the chapter
      if (/^challenge\s*:/.test(low) && SH.resolveChallenge){
        curChallenge = SH.resolveChallenge(inner.replace(/^challenge\s*:\s*/i, ''));
        (out.challenges = out.challenges || []).push(curChallenge);
        if (scene){
          // naming a challenge makes this scene a competition, wherever it is (Hell's Kitchen is in the camp's mess hall)
          scene.comp = true;
          scene.challenge = curChallenge;
          // it moves onto a kit: the one its spot names, else this challenge's — unless its spot already chose one
          const spotKit = scene.sub && SH.kitSpots?.find(([kk, re]) => re.test(scene.sub) && SETS[kk] && (!SETS[kk].forceTime || SETS[kk].forceTime === scene.time))?.[0];
          const k = scene.spotKit ? null : spotKit || curChallenge.kit;
          if (k && SETS[k]){
            scene.set = k; if (SETS[k].forceTime) scene.time = SETS[k].forceTime;
            scene.view = { set: scene.set, time: scene.time };
          }
          push({ t:'card', scene:scene.i, kick: SH.challengeKick || 'THE CHALLENGE', title: curChallenge.name });
        }
        continue;
      }
      if (/^scene\b/.test(low) || /^(tribal council|campfire ceremony)\b/.test(low)){ newScene(inner); continue; }
      if (!scene) continue;
      if (/^phase\s*\d+/.test(low)){
        const m = inner.match(/^phase\s*(\d+)\s*[:.\-—]?\s*(.*?)\.?$/i);
        push({ t:'card', scene:scene.i, kick:`PHASE ${m[1]}`, title:m[2] }); afterCard = true; conf = null; continue;
      }
      if (/^(voting|the vote|the votes)\.?$/.test(low)){ push({ t:'card', scene:scene.i, kick:scene.place.toUpperCase(), title:inner.replace(/\.$/, '') }); continue; }
      if (/^fade (to black|out)/.test(low)){ push({ t:'end', scene:scene.i }); continue; }
      dir(inner);
      continue;
    }
    const m = line.match(SPK);
    if (m && isName(m[1])){ if (scene) speak(m[1], m[2]); continue; }
    if (!scene){
      const e = line.match(/^episode\s+(\d+)\s*[—–:\-]?\s*["“]?(.*?)["”]?\s*$/i);
      if (e){ out.ep = e[1]; out.title = out.title || e[2]; } else if (!out.show) out.show = line;
      continue;
    }
    if (/^end of episode/i.test(line)){ if (out.beats[out.beats.length-1]?.t !== 'end') push({ t:'end', scene:scene.i }); continue; }
    dir(line);
  }
  // a deal offered to nobody by name was offered to whoever answers it
  out.beats.forEach((b, i) => {
    if (b.event?.kind !== 'deal' || b.event.names.length > 1) return;
    const reply = out.beats.slice(i + 1).find(x => x.scene !== b.scene || (x.t === 'line' && !x.conf && !x.host && x.speaker !== b.speaker && !CAST[x.speaker]?.host));
    if (reply && reply.scene === b.scene) b.event.names.push(reply.speaker);
    else delete b.event;   // nobody took it up: not a deal, just talk
  });
  // a competition win names a person or a whole team
  out.beats.forEach(b => {
    const w = b.t === 'line' && stripCues(b.text).match(SH.compWin);
    if (!w) return;
    const word = w[1].toLowerCase(), sc = out.scenes[b.scene];
    const team = Object.values(CAST).some(c => c.tribe === word);
    const person = findName(w[1]);
    if (!team && !person) return;   // "last tribe standing wins immunity" is the rules, not a result
    b.win = team ? { team: word, names: sc.present.filter(n => CAST[n].tribe === word && (sc.roles[n] || CAST[n].role) !== 'coach') }
                 : { names: [person] };
    b.event = b.event || { kind:'win', label:`${w[1].toUpperCase()} WINS ${SH.compPrize}`, names: b.win.names.slice(0, 6), team: b.win.team };
  });
  out.cast = CAST;
  return out;
}
export const parseEpisode = parse;
function mood(text, raw=''){
  const c = (raw.match(/\[[^\]]*\]/g) || []).join(' ').toLowerCase();
  if (/whisper|barely audible|mutter|under (his|her|their) breath/.test(c)) return 'whisper';
  if (/scream|yell|shout/.test(c)) return 'shout';
  if (/laugh|giggl|grin|snort/.test(c)) return 'laugh';
  if (/sniff|cry|tear|sob/.test(c)) return 'sad';
  const caps = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  if (/!/.test(text) && (caps || /!!|!$/.test(text) && text.length < 30)) return 'shout';
  if (caps >= 2) return 'shout';
  if (/^(ugh|wow|rude|seriously)\b/i.test(text)) return 'angry';
  if (/^\[(\.\.\.|…)\]/.test(raw.trim()) || /^\.\.\.|^um\b/i.test(text)) return 'hesitate';
  if (/\?\s*$/.test(text)) return 'question';
  return 'plain';
}


// ════════════════════════════════════════════════════════════════
//  RUN TIME — what one sitting costs the viewer
// ════════════════════════════════════════════════════════════════
// Measured against the engine, not guessed: every click types its text at the
// engine's own rate (narration 20 ms a character, dialogue 25, a shout 16, a
// whisper 36), holds on punctuation the way the typewriter does, and then
// waits about a second for the reader and the click. Scene changes, cards and
// the vote reading cost their animation. The target the user set is 15–20
// minutes an episode — about 3,500 to 4,700 words.
export const RUNTIME_TARGET = { min: 15, max: 20 };
export function beatMs(b){
  if (b.t === 'scene') return 2600;
  if (b.t === 'card' || b.t === 'cut') return 2200;
  if (b.t === 'elim' || b.t === 'spoken') return 2500;
  if (b.t === 'end') return 0;
  const txt = stripCues(b.text || '');
  const rate = b.t === 'dir' ? 20 : b.mood === 'shout' ? 16 : b.mood === 'whisper' ? 36 : 25;
  const holds = (txt.match(/[.!?]/g) || []).length * 170 + (txt.match(/,/g) || []).length * 80 + (txt.match(/…/g) || []).length * 420;
  return txt.length * rate + holds + 1100;
}
export function estimateRuntime(P){
  const perBeat = P.beats.map(beatMs);
  const ms = perBeat.reduce((a, b) => a + b, 0);
  const words = P.beats.reduce((a, b) => a + (b.text ? stripCues(b.text).split(/\s+/).filter(Boolean).length : 0), 0);
  return { clicks: P.beats.length, ms, minutes: ms / 60000, words, perBeat,
           long: ms / 60000 > RUNTIME_TARGET.max, short: ms / 60000 < RUNTIME_TARGET.min * .5 };
}
export const fmtMin = ms => { const m = Math.round(ms / 60000); return m < 1 ? '<1 min' : `${m} min`; };

// ════════════════════════════════════════════════════════════════
//  CHAPTERS — an episode you can stop and come back to
// ════════════════════════════════════════════════════════════════
// Built from the scenes, not authored: a run of camp scenes before the
// challenge is Camp Life, the challenge (and its phases) is The Challenge, the
// camp scenes after it are After the Challenge, then Tribal Council, and
// anything past the vote is the Epilogue. A first scene that carries the
// host's "Previously on…" is the Cold Open. A second challenge or a second
// tribal is numbered rather than folded into the first.
// Every show has the same three kinds of scene; the profile says which set and
// which place names are which. HOME is the camp or the house, COMP a challenge
// or competition, EXIT the vote and the walk out.
export function sceneKind(sc, show = SH){
  if (sc.set === show.exitSet || (show.boothSet && sc.set === show.boothSet) || show.exitPlace.test(sc.place)) return 'exit';
  if (sc.set === show.compSet || sc.comp || sc.phase || show.kits?.includes(sc.set) || show.compPlace.test(sc.place)) return 'comp';
  return 'home';
}
export function buildChapters(P, runtime = estimateRuntime(P)){
  const show = P.profile || SH, names = show.chapters;
  const sceneStart = [];
  P.beats.forEach((b, i) => { if (b.t === 'scene') sceneStart[b.scene] = i; });
  const coldOpen = P.scenes.length > 1 && P.beats.some(b => b.scene === 0 && b.host);
  const chapters = [], used = {};
  let seenComp = false, seenExit = false;
  P.scenes.forEach((sc, i) => {
    const kind = sceneKind(sc, show);
    const base = i === 0 && coldOpen ? names.cold
      : kind === 'exit' ? names.exit
      : kind === 'comp' ? (sc.challenge?.name || names.comp)
      : seenExit ? names.epilogue : seenComp ? names.after : names.home;
    const last = chapters[chapters.length - 1];
    if (last && last.base === base && !(i === 1 && coldOpen)) last.scenes.push(i);
    else {
      used[base] = (used[base] || 0) + 1;
      chapters.push({ base, title: used[base] > 1 ? `${base} ${used[base]}` : base, kind: i === 0 && coldOpen ? 'cold' : kind, scenes: [i] });
    }
    if (kind === 'comp') seenComp = true;
    if (kind === 'exit') seenExit = true;
  });
  chapters.forEach((c, k) => {
    c.n = k + 1;
    c.start = sceneStart[c.scenes[0]];
    c.end = k + 1 < chapters.length ? sceneStart[chapters[k + 1].scenes[0]] - 1 : P.beats.length - 1;
    c.ms = runtime.perBeat.slice(c.start, c.end + 1).reduce((a, b) => a + b, 0);
  });
  return chapters;
}
export const chapterAt = (chapters, i) => chapters.find(c => i >= c.start && i <= c.end) || chapters[0];

// ════════════════════════════════════════════════════════════════
//  WHAT AN EDITOR WOULD PICK — teasers and the end-of-episode screen
// ════════════════════════════════════════════════════════════════
// "Coming up" before an ad break is the loudest, most pointed line of the
// segment ahead: a shout, a line with somebody's name in it, a clip-worthy
// moment. Hosts are the frame, not the tease.
function teaserScore(P, b){
  if (b.t !== 'line' || P.cast[b.speaker]?.host) return -1;
  const t = stripCues(b.text);
  if (t.length < 12 || t.length > 120) return -1;
  return (b.event ? 3 : 0) + (b.mood === 'shout' ? 2 : 0) + (b.mood === 'angry' ? 1.5 : 0) + (b.mood === 'question' ? .5 : 0)
    + (Object.keys(P.cast).some(n => n !== b.speaker && t.includes(n)) ? 1 : 0) + (b.conf ? .5 : 0) + (t.length < 70 ? .5 : 0);
}
export function pickTeaser(P, chapter){
  let best = null, top = 0;
  for (let i = chapter.start; i <= chapter.end; i++){
    const s = teaserScore(P, P.beats[i]);
    if (s > top){ top = s; best = P.beats[i]; }
  }
  return best;
}

// The results screen: who left and how the votes fell, who won the
// competition, who the episode was about (screen time is what they said, in
// characters; confessionals are counted as sessions, not pages), the
// moments, and a line of the night.
export function episodeSummary(P){
  const screen = {}, confs = {};
  P.beats.forEach((b, i) => {
    if (b.t !== 'line' || P.cast[b.speaker]?.host) return;
    screen[b.speaker] = (screen[b.speaker] || 0) + stripCues(b.text).length;
    const prev = P.beats[i - 1];
    if (b.conf && !(prev && prev.conf && prev.speaker === b.speaker)) confs[b.speaker] = (confs[b.speaker] || 0) + 1;
  });
  const lineScore = b => {
    if (b.t !== 'line' || P.cast[b.speaker]?.host) return -1;
    const t = stripCues(b.text);
    if (t.length < 24 || t.length > 150) return -1;
    return (b.conf ? 2 : 0) + (b.finalWords ? 2.5 : 0) + (b.event ? 2 : 0) + (b.mood === 'shout' ? 1 : 0) + (/[.!?]$/.test(t) ? .5 : 0) + Math.min(1, t.length / 120);
  };
  let quote = null;
  P.beats.forEach(b => { if (lineScore(b) > (quote ? lineScore(quote) : 0)) quote = b; });
  return {
    screen: Object.entries(screen).sort((a, b) => b[1] - a[1]),
    confs,
    exits: P.beats.filter(b => b.t === 'elim').map(b => ({ name: b.name, tally: b.tally || {} })),
    wins: P.beats.filter(b => b.win).map(b => b.win),
    moments: P.beats.filter(b => b.event).map(b => b.event),
    finalWords: P.beats.filter(b => b.finalWords).map(b => stripCues(b.text)).join(' '),
    quote: quote ? { speaker: quote.speaker, text: stripCues(quote.text), conf: !!quote.conf } : null,
  };
}

const STYLE = `
:host{
  --bg:#0b0f1a; --ink:#f4f1ea; --dim:#9aa3b5; --panel:#141a2a; --line:#2a3350;
  --accent:#ffcc33; --danger:#ff4d5e;
}
*{box-sizing:border-box}
.es{color:var(--ink);font-family:Nunito,system-ui,sans-serif}

/* ═══════════ STAGE ═══════════ */
.stage{position:relative;width:min(1280px,100%);aspect-ratio:16/9;overflow:hidden;border-radius:14px;
  background:#000;container-type:inline-size;box-shadow:0 30px 80px #000a,0 0 0 1px #ffffff14;user-select:none;cursor:pointer;
  --camx:0; --camy:0; --zoom:1;}
.stage.shake{animation:shake .45s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{translate:-.4cqw 0}20%,80%{translate:.7cqw .2cqw}30%,50%,70%{translate:-1cqw -.3cqw}40%,60%{translate:1cqw .3cqw}}
.stage.hit .world{animation:hit .25s ease-out}
@keyframes hit{0%{filter:brightness(2.2) saturate(0)}100%{filter:none}}

.world{position:absolute;inset:0;transform:scale(var(--zoom)) translate(calc(var(--camx)*1cqw),calc(var(--camy)*1cqw));
  transition:transform 1.1s cubic-bezier(.22,1,.36,1);transform-origin:50% 70%}
.layer{position:absolute;inset:-6% -8%;transition:transform 1.1s cubic-bezier(.22,1,.36,1)}
.layer svg{width:100%;height:100%;display:block}
.l-sky{transform:translateX(calc(var(--camx)*-.6cqw))}
.l-far{transform:translateX(calc(var(--camx)*-.35cqw))}
.l-mid{transform:none}
.l-fg{transform:translateX(calc(var(--camx)*.9cqw)) scale(1.05);pointer-events:none;z-index:6}
.tint{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;transition:background 1.4s;z-index:7}
.glow{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;transition:opacity 1.4s;z-index:7}
canvas.fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8;transform:scale(var(--zoom)) translate(calc(var(--camx)*1cqw),calc(var(--camy)*1cqw));transition:transform 1.1s cubic-bezier(.22,1,.36,1);transform-origin:50% 70%}
.vignette{position:absolute;inset:0;pointer-events:none;z-index:9;
  background:radial-gradient(ellipse at 50% 55%,transparent 55%,#000a 100%)}
.letterbox{position:absolute;left:0;right:0;height:0;background:#000;z-index:30;transition:height .7s cubic-bezier(.22,1,.36,1)}
.letterbox.top{top:0}.letterbox.bot{bottom:0}
.stage.cine .letterbox{height:7.5%}

/* ambient set animation hooks (classes inside SVG) */
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 5s ease-in-out infinite alternate}
.sway.d2{animation-duration:6.5s;animation-delay:-2s}.sway.d3{animation-duration:4.2s;animation-delay:-1s}
@keyframes sway{from{rotate:-2.5deg}to{rotate:2.5deg}}
.wave{animation:wave 4s ease-in-out infinite alternate}.wave.d2{animation-duration:5.5s;animation-delay:-2s}
@keyframes wave{from{transform:translateX(-2%)}to{transform:translateX(2%)}}
.flick{transform-box:fill-box;transform-origin:50% 100%;animation:flick .18s steps(2) infinite alternate}
@keyframes flick{from{transform:scale(1,1)}to{transform:scale(.9,1.12) skewX(3deg)}}
.flick.slow{animation:flick2 .9s ease-in-out infinite alternate}
@keyframes flick2{from{transform:scale(1,1);opacity:.9}to{transform:scale(1.06,1.18);opacity:1}}
.cloud{animation:cloud 60s linear infinite}.cloud.d2{animation-duration:90s;animation-delay:-40s}
@keyframes cloud{from{transform:translateX(-30%)}to{transform:translateX(130%)}}
.bob{animation:bob 3s ease-in-out infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-1.2%)}}
.shimmer{animation:shimmer 2.4s ease-in-out infinite alternate}
@keyframes shimmer{from{opacity:.25}to{opacity:.8}}
.twinkle{animation:twinkle 2s ease-in-out infinite alternate}
@keyframes twinkle{from{opacity:.2}to{opacity:1}}

/* ═══════════ ACTORS (standees) ═══════════ */
.actors{position:absolute;inset:0;z-index:5}
.actor{position:absolute;left:var(--x);bottom:var(--floor,17%);width:var(--w,11cqw);margin-left:calc(var(--w,11cqw)/-2);
  transition:left .7s cubic-bezier(.22,1,.36,1),bottom .7s cubic-bezier(.22,1,.36,1),width .7s cubic-bezier(.22,1,.36,1),margin-left .7s cubic-bezier(.22,1,.36,1),filter .5s,opacity .5s,transform .5s;
  --c:#fc3;filter:brightness(.62) saturate(.7);transform:scale(.92);z-index:1}
.actor.back{transform:scale(.8);z-index:0}
.actor.benched,.actor.benched.lit{filter:grayscale(.85) brightness(.5);opacity:.75;transform:scale(.8) translateY(10%)}
.actor.benched .stand{background:#444}
.extras{position:absolute;left:0;right:0;bottom:41%;height:10cqw;z-index:0;pointer-events:none}
.extras svg{position:absolute;bottom:0;fill:#0b0f1a;opacity:.55;animation:bob 2.4s ease-in-out infinite alternate;animation-delay:var(--d)}
.actor.offstage{opacity:0;transform:translateY(-40%) scale(.5);pointer-events:none}
.actor.lit{filter:none;transform:scale(1.14) translateY(-4%);z-index:5}
.actor.back.lit{transform:scale(.98) translateY(-4%)}
.actor.next{filter:brightness(.85)}
.actor.gone{filter:grayscale(1) brightness(.45);opacity:.55}
.actor.enter{animation:dropIn .8s cubic-bezier(.34,1.56,.64,1) backwards}
@keyframes dropIn{0%{transform:translateY(-120%) scale(.6) rotate(-12deg);opacity:0}60%{opacity:1}}
.actor .shadow{position:absolute;left:10%;right:10%;bottom:-3%;height:9%;border-radius:50%;background:#000;opacity:.45;filter:blur(3px);
  animation:shadowPulse 2.6s ease-in-out infinite alternate;animation-delay:var(--ph)}
@keyframes shadowPulse{to{transform:scaleX(.88);opacity:.32}}
.actor .rig{transform-origin:50% 100%;animation:breathe 2.6s ease-in-out infinite alternate;animation-delay:var(--ph)}
@keyframes breathe{from{transform:translateY(0) scaleY(1)}to{transform:translateY(-3%) scaleY(1.015)}}
.actor .turn{transition:transform .6s cubic-bezier(.22,1,.36,1);transform:perspective(600px) rotateY(var(--ry,0deg));transform-origin:50% 100%}
.actor.talk .rig{animation:talk .32s ease-in-out infinite alternate}
@keyframes talk{from{transform:translateY(0) scale(1,1)}to{transform:translateY(-4%) scale(1.03,.97)}}
.actor.jump .rig{animation:jump .55s cubic-bezier(.3,1.6,.5,1)}
@keyframes jump{0%{transform:scale(1.15,.8)}35%{transform:translateY(-28%) scale(.9,1.12)}70%{transform:translateY(0) scale(1.1,.9)}100%{transform:none}}
.actor.recoil .rig{animation:recoil .5s ease-out}
@keyframes recoil{0%{transform:none}25%{transform:translateX(-9%) rotate(-7deg)}60%{transform:translateX(4%) rotate(3deg)}100%{transform:none}}
.card{position:relative;aspect-ratio:1;border-radius:18%;overflow:hidden;border:.35cqw solid #111;
  box-shadow:0 0 0 .3cqw var(--c),0 .6cqw 0 .3cqw #0006;background:var(--c)}
.card img{width:100%;height:100%;object-fit:cover;display:block}
.actor.lit .card{box-shadow:0 0 0 .35cqw var(--c),0 0 2.4cqw .4cqw var(--c),0 .6cqw 0 .3cqw #0006}
.actor .ring{position:absolute;inset:-14%;border-radius:50%;border:.3cqw dashed var(--c);opacity:0;animation:spin 6s linear infinite}
.actor.lit .ring{opacity:.7}
@keyframes spin{to{rotate:360deg}}
.stand{width:40%;height:1.3cqw;margin:-.2cqw auto 0;background:linear-gradient(var(--t,#8a5a33),#0008),var(--t,#8a5a33);background-blend-mode:multiply;border:.2cqw solid #111;border-radius:0 0 .5cqw .5cqw}
.role{position:absolute;left:50%;bottom:1.2cqw;translate:-50% 0;font-family:Bungee;font-size:.75cqw;letter-spacing:.12em;
  padding:.1cqw .5cqw;border-radius:.3cqw;background:#111;color:var(--t,#fff);border:.1cqw solid var(--t,#fff);z-index:2}
.role.host{color:#ffcc33;border-color:#ffcc33}
.card .initial{display:flex;width:100%;height:100%;align-items:center;justify-content:center;font-family:Bungee;font-size:4cqw;color:#111}
.actor.spot .plate{opacity:1}
.world.whip{animation:whip .32s ease-in-out}
@keyframes whip{0%{filter:none;transform:scale(var(--zoom))}50%{filter:blur(12px) brightness(1.3);transform:scale(var(--zoom)) translateX(-12cqw)}100%{filter:none}}
.plate{position:absolute;left:50%;top:-2.6cqw;translate:-50% 0;font-family:Bungee;font-size:1.1cqw;letter-spacing:.05em;
  padding:.25cqw .8cqw;border-radius:99px;background:#111d;color:var(--c);border:.15cqw solid var(--c);white-space:nowrap;
  opacity:0;transition:opacity .3s,translate .3s}
.actor.lit .plate,.stage.showNames .plate{opacity:1}
.actor.lit .plate{translate:-50% -30%}
.emote{position:absolute;right:-18%;top:-22%;width:4.6cqw;height:4.6cqw;z-index:3;pointer-events:none}
.emote svg{width:100%;height:100%;overflow:visible}
.emote.pop{animation:emotePop .9s cubic-bezier(.34,1.8,.64,1) forwards}
@keyframes emotePop{0%{transform:scale(0) rotate(-40deg)}40%{transform:scale(1.25) rotate(8deg)}60%{transform:scale(.95)}100%{transform:scale(1)}}
.item{position:absolute;opacity:0;transform:scale(0) rotate(-30deg);transition:transform .6s cubic-bezier(.34,1.8,.64,1),opacity .3s;pointer-events:none;z-index:2}
.item svg{width:100%;height:100%;display:block;overflow:visible}
.item.necklace{left:50%;bottom:.4cqw;width:6.2cqw;margin-left:-3.1cqw}
.item.idol{left:-14%;top:30%;width:3.6cqw;filter:drop-shadow(0 0 .8cqw #ffd84d)}
.actor.immune .item.necklace,.actor.hasidol .item.idol{opacity:1;transform:none}
.actor.hasidol .item.idol{animation:idolFloat 2s ease-in-out infinite alternate}
@keyframes idolFloat{to{translate:0 -20%}}
.actor.immune .card{box-shadow:0 0 0 .35cqw #ffd84d,0 0 2.2cqw .5cqw #ffd84d99,0 .6cqw 0 .3cqw #0006}
.tally{position:absolute;left:50%;top:-4.6cqw;translate:-50% 0;display:flex;gap:.3cqw}
.tally i{width:1.3cqw;height:1.7cqw;background:#f3e6c4;border:.12cqw solid #3b2a14;border-radius:.2cqw;animation:tallyIn .5s cubic-bezier(.34,1.8,.64,1) backwards}
@keyframes tallyIn{from{transform:translateY(-200%) rotate(-30deg);opacity:0}}

/* speed lines for shouts */
.speedlines{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;
  background:repeating-conic-gradient(from 0deg at var(--sx,50%) 60%,#fff0 0 3deg,#ffffff26 3deg 4deg);
  mask:radial-gradient(circle at var(--sx,50%) 60%,transparent 12%,#000 60%)}
.speedlines.on{animation:lines .7s ease-out}
@keyframes lines{0%{opacity:0;transform:scale(1.2)}20%{opacity:1}100%{opacity:0;transform:scale(1)}}

/* ═══════════ LOCATION BANNER + TRANSITIONS ═══════════ */
.iris{position:absolute;inset:0;z-index:40;background:#000;pointer-events:none;clip-path:circle(150% at 50% 55%);
  transition:clip-path .55s cubic-bezier(.7,0,.3,1)}
.iris.open{clip-path:circle(0% at 50% 55%)}
.banner{position:absolute;left:0;right:0;top:33%;z-index:35;pointer-events:none;display:flex;flex-direction:column;align-items:center;opacity:0}
.banner.show{animation:banner 2.6s cubic-bezier(.22,1,.36,1) forwards}
@keyframes banner{0%{opacity:0;transform:translateX(-30%) skewX(-12deg)}14%{opacity:1;transform:none}80%{opacity:1;transform:none}100%{opacity:0;transform:translateX(30%) skewX(12deg)}}
.banner .strip{background:linear-gradient(90deg,transparent,#000c 15%,#000c 85%,transparent);padding:1.2cqw 12cqw;text-align:center}
.banner .kicker{font-family:Bungee;font-size:1.3cqw;letter-spacing:.4em;color:var(--accent)}
.banner .place{font-family:Bungee;font-size:5cqw;line-height:1;color:#fff;text-shadow:.3cqw .3cqw 0 #000,0 0 3cqw #ffcc3355}
.banner .time{font-size:1.4cqw;color:#dfe6ff;font-weight:800;letter-spacing:.15em;margin-top:.6cqw;text-transform:uppercase}
.titlecard{position:absolute;inset:0;z-index:45;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:radial-gradient(circle at 50% 45%,#2b1c5c,#07060f 70%);transition:opacity .8s}
.titlecard.hide{opacity:0;pointer-events:none}
.titlecard .ep{font-family:Bungee;color:var(--accent);letter-spacing:.5em;font-size:1.4cqw}
.titlecard .name{font-family:Bungee;font-size:6.5cqw;text-align:center;line-height:1;margin:1cqw 6cqw;
  background:linear-gradient(#fff,#ffd66b 60%,#ff8a3d);-webkit-background-clip:text;color:transparent;
  filter:drop-shadow(.4cqw .4cqw 0 #000);animation:titleIn 1.2s cubic-bezier(.34,1.56,.64,1)}
@keyframes titleIn{from{transform:scale(3) rotate(-8deg);opacity:0;filter:blur(10px)}}
.titlecard .press{margin-top:3cqw;font-family:Bungee;font-size:1.3cqw;letter-spacing:.3em;animation:blink 1.1s steps(2) infinite}
@keyframes blink{50%{opacity:0}}

/* ═══════════ CAPTION (stage direction) ═══════════ */
.caption{position:absolute;left:50%;top:5%;translate:-50% 0;z-index:20;max-width:70%;text-align:center;
  font-size:1.6cqw;font-style:italic;font-weight:800;color:#fff;padding:.8cqw 2cqw;border-radius:.8cqw;
  background:#0009;border:.12cqw solid #ffffff30;backdrop-filter:blur(4px);opacity:0;transform:translateY(-40%);transition:.35s}
.caption.show{opacity:1;transform:none}
.caption::before{content:"";display:inline-block;width:.8cqw;height:.8cqw;background:var(--accent);rotate:45deg;margin-right:.9cqw;vertical-align:middle}

/* ═══════════ DIALOGUE BOX (VN style) ═══════════ */
.dbox{position:absolute;left:3%;right:3%;bottom:3%;z-index:25;height:19%;display:flex;align-items:stretch;
  transform:translateY(130%);transition:transform .45s cubic-bezier(.34,1.4,.64,1)}
.dbox.show{transform:none}
.stage.cine .dbox{bottom:9%}
.conf.show ~ .dbox .face{display:none}
.conf.show ~ .dbox{left:10%;right:10%}
.dbox .face{position:relative;width:11.5cqw;flex:none;margin-right:-1.4cqw;z-index:2;align-self:flex-end}
.dbox .face .fc{aspect-ratio:1;border-radius:1.2cqw;overflow:hidden;border:.4cqw solid #111;background:var(--c);
  box-shadow:0 0 0 .3cqw var(--c),0 1cqw 2cqw #000a;transform:rotate(-3deg);transition:transform .3s}
.dbox .face .fc img{width:100%;height:100%;object-fit:cover;display:block}
.dbox .face.swap .fc{animation:faceIn .45s cubic-bezier(.34,1.56,.64,1)}
@keyframes faceIn{from{transform:translateX(-60%) rotate(-25deg) scale(.6);opacity:0}}
.dbox.talking .face .fc{animation:faceTalk .25s ease-in-out infinite alternate}
@keyframes faceTalk{from{transform:rotate(-3deg) translateY(0)}to{transform:rotate(-2deg) translateY(-3%)}}
.dbox .panel{position:relative;flex:1;background:linear-gradient(#171e33f2,#0c1122f5);border:.25cqw solid var(--c);border-radius:1.2cqw;
  padding:1.9cqw 2.4cqw 1.2cqw 3cqw;box-shadow:0 0 0 .25cqw #000,0 1.2cqw 3cqw #000c,inset 0 0 4cqw #0008}
.dbox .panel::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:repeating-linear-gradient(0deg,#ffffff05 0 2px,transparent 2px 4px)}
.dbox .who{position:absolute;top:-1.5cqw;left:2.4cqw;font-family:Bungee;font-size:1.5cqw;padding:.25cqw 1.4cqw;background:var(--c);color:#111;
  border:.2cqw solid #111;border-radius:.6cqw;transform:skewX(-10deg);box-shadow:.25cqw .25cqw 0 #000}
.dbox .txt{font-size:1.9cqw;line-height:1.35;font-weight:800;min-height:3em}
.dbox .txt.shout{font-size:2.6cqw;font-weight:900;color:#fff4c8;text-transform:none;letter-spacing:.01em}
.dbox .txt.whisper{font-style:italic;color:#c9d2ee;font-weight:600}
.dbox .txt .cue{display:inline-block;font-size:.72em;font-style:italic;font-weight:800;color:#111;background:var(--c);opacity:.85;
  padding:0 .6em;border-radius:99px;margin:0 .3em;vertical-align:.12em}
.dbox .txt .ch{display:inline-block;animation:chIn .18s ease-out backwards;white-space:pre}
.dbox .txt.shout .ch{animation:chShout .25s cubic-bezier(.34,2,.64,1) backwards}
@keyframes chIn{from{opacity:0;transform:translateY(40%)}}
@keyframes chShout{from{opacity:0;transform:scale(2.2) rotate(-12deg)}}
.dbox .txt .act{font-style:italic;font-weight:700;color:#aeb8d6;font-size:.9em}
.dbox .txt.narr{font-weight:700;font-style:italic;color:#dfe5ff;font-size:1.75cqw}
.dbox.narr .face{width:0;margin-right:0;overflow:hidden}
.dbox.narr .who{background:#1d2540;color:#9fb3ff;border-color:#9fb3ff55;font-size:1.1cqw;letter-spacing:.2em}
.dbox.narr .panel{border-style:dashed}
.dbox .more{position:absolute;right:1.6cqw;bottom:1cqw;width:1.4cqw;height:1.4cqw;opacity:0;
  border-left:.7cqw solid transparent;border-right:.7cqw solid transparent;border-top:1cqw solid var(--c);width:0;height:0}
.dbox.done .more{opacity:1;animation:moreBob .6s ease-in-out infinite alternate}
@keyframes moreBob{to{transform:translateY(40%)}}

/* ═══════════ CONFESSIONAL ═══════════ */
.conf{position:absolute;inset:0;z-index:22;opacity:0;pointer-events:none;transition:opacity .15s}
.conf.show{opacity:1}
.conf .bg{position:absolute;inset:-5%;filter:blur(1.2cqw) saturate(1.3) brightness(.8);transform:scale(1.1)}
.conf .bokeh{position:absolute;inset:0}
.conf .bokeh i{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff9 0,#fff0 70%);animation:bokeh 6s ease-in-out infinite alternate}
@keyframes bokeh{to{transform:translate(2cqw,-1.5cqw) scale(1.3);opacity:.4}}
.conf .subject{position:absolute;left:58%;bottom:22%;width:30cqw;translate:-50% 0;animation:confPush 8s ease-out forwards}
@keyframes confPush{from{transform:scale(.94)}to{transform:scale(1.04)}}
.conf .subject .fc{aspect-ratio:1;border-radius:2cqw;overflow:hidden;border:.5cqw solid #111;background:var(--c);box-shadow:0 2cqw 4cqw #000a}
.conf .subject .fc img{width:100%;height:100%;object-fit:cover}
.conf.talking .subject .fc{animation:faceTalk .28s ease-in-out infinite alternate}
.conf .vf{position:absolute;inset:4%;pointer-events:none}
.conf .vf b{position:absolute;width:5cqw;height:5cqw;border:.35cqw solid #fff}
.conf .vf b:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}.conf .vf b:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
.conf .vf b:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}.conf .vf b:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
.conf .rec{position:absolute;left:7%;top:8%;font-family:Bungee;font-size:1.7cqw;color:#fff;display:flex;align-items:center;gap:.8cqw}
.conf .rec::before{content:"";width:1.4cqw;height:1.4cqw;border-radius:50%;background:var(--danger);box-shadow:0 0 1.2cqw var(--danger);animation:blink 1s steps(2) infinite}
.conf .tc{position:absolute;right:7%;top:8%;font-family:Bungee;font-size:1.5cqw;color:#fff;font-variant-numeric:tabular-nums}
.conf .batt{position:absolute;right:7%;top:13%;width:3.4cqw;height:1.5cqw;border:.2cqw solid #fff;border-radius:.2cqw}
.conf .batt::after{content:"";position:absolute;inset:.2cqw;right:1.1cqw;background:#7dff8a}
.conf .lower{position:absolute;left:6%;top:42%;display:flex;flex-direction:column;align-items:flex-start;gap:.3cqw}
.conf .lower .n{font-family:Bungee;font-size:3.2cqw;color:#111;background:var(--c);padding:.2cqw 1.4cqw;transform:skewX(-10deg);
  box-shadow:.4cqw .4cqw 0 #000;animation:slideR .5s cubic-bezier(.22,1,.36,1) backwards}
.conf .lower .t{font-weight:900;font-size:1.3cqw;letter-spacing:.3em;background:#111;color:#fff;padding:.3cqw 1.2cqw;transform:skewX(-10deg);
  animation:slideR .5s .12s cubic-bezier(.22,1,.36,1) backwards}
.conf .lower .d{font-weight:900;font-size:1.6cqw;color:#fff;background:#000d;padding:.25cqw 1.3cqw;transform:skewX(-10deg);
  box-shadow:.3cqw .3cqw 0 #0008;animation:slideR .5s .06s cubic-bezier(.22,1,.36,1) backwards}
.conf .lower .t.tribe{background:var(--t);color:#111;box-shadow:.3cqw .3cqw 0 #000;animation-delay:.14s}
.conf .rec small{font-size:.7em;letter-spacing:.25em;opacity:.85}
.conf.hostcam .rec,.conf.hostcam .tc,.conf.hostcam .batt{display:none}
.chip .team{display:flex;align-items:center;gap:.3cqw}
.chip .team:empty{display:none}
.chip .team i{font-style:normal;font-size:.9cqw;letter-spacing:.08em;padding:.15cqw .65cqw;border-radius:99px;background:var(--t);color:#111;box-shadow:0 0 .8cqw var(--t)}
.chip .team b{width:.9cqw;height:.9cqw;border-radius:50%;background:var(--t);box-shadow:0 0 .6cqw var(--t)}
.chip .team.pop{animation:teamPop .5s cubic-bezier(.34,1.8,.64,1)}
@keyframes teamPop{0%{transform:scale(.4);opacity:0}100%{transform:none;opacity:1}}
@keyframes slideR{from{transform:translateX(-120%) skewX(-10deg)}}
.static{position:absolute;inset:0;z-index:41;pointer-events:none;opacity:0;mix-blend-mode:screen}
.static.on{animation:staticFlash .32s steps(4)}
@keyframes staticFlash{0%,100%{opacity:0}20%,70%{opacity:1}}

/* ═══════════ TRIBAL / VOTES ═══════════ */
.vote{position:absolute;left:50%;top:18%;z-index:24;width:22cqw;aspect-ratio:1.45;translate:-50% 0;perspective:1200px;pointer-events:none}
.vote .paper{position:absolute;inset:0;border-radius:.6cqw;background:
  radial-gradient(circle at 30% 20%,#fff8e6,#efdcb0 70%,#d9bf86);box-shadow:0 1.5cqw 3cqw #000c,inset 0 0 2cqw #a07a3a66;
  display:flex;flex-direction:column;align-items:center;justify-content:center;transform-origin:50% 100%;
  animation:paperIn .9s cubic-bezier(.34,1.3,.64,1) both}
@keyframes paperIn{0%{transform:translateY(160%) rotateX(80deg) scale(.4);opacity:0}55%{transform:translateY(-6%) rotateX(-8deg) scale(1.02);opacity:1}100%{transform:none}}
.vote .paper.secret{background:radial-gradient(circle at 30% 20%,#fdf6e3,#e7d4a8 70%,#cdb07a)}
.vote .paper.secret::after{content:"SECRET";position:absolute;right:6%;top:10%;font-family:Bungee;font-size:1cqw;color:#c0392b;border:.15cqw solid #c0392b;padding:0 .4cqw;rotate:12deg;opacity:.8}
.vote .paper.out{animation:paperOut .5s ease-in forwards}
@keyframes paperOut{to{transform:translateX(60%) translateY(-30%) rotate(18deg);opacity:0}}
.vote .lbl{font-family:Bungee;font-size:1.1cqw;letter-spacing:.3em;color:#7a5a2a}
.vote .nm{font-family:"Permanent Marker";font-size:4.4cqw;color:#1b1b2a;margin-top:.4cqw;clip-path:inset(0 100% 0 0);
  animation:write .7s .4s steps(12) forwards}
@keyframes write{to{clip-path:inset(0 0 0 0)}}
.spoken{position:absolute;inset:0;z-index:26;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0}
.spoken.show{animation:spoken 4s ease forwards}
@keyframes spoken{0%{opacity:0}10%,85%{opacity:1}100%{opacity:0}}
.spoken span{font-family:Bungee;font-size:5.5cqw;color:#ff9a3d;text-shadow:0 0 3cqw #ff4d00,.3cqw .3cqw 0 #000;letter-spacing:.05em;
  animation:spokenIn 1s cubic-bezier(.34,1.56,.64,1)}
@keyframes spokenIn{from{transform:scale(2.5);filter:blur(8px);opacity:0}}

/* ═══════════ HUD ═══════════ */
.hud{position:absolute;inset:0;z-index:28;pointer-events:none;transition:opacity .3s}
.stage.cine .hud{opacity:0}
.chip{position:absolute;top:2.2%;left:2%;display:flex;gap:.8cqw;align-items:center;font-family:Bungee;font-size:1.05cqw;
  background:#000a;border:.12cqw solid #ffffff2a;padding:.45cqw 1cqw;border-radius:99px;backdrop-filter:blur(4px)}
.chip .dot{width:.8cqw;height:.8cqw;border-radius:50%;background:var(--accent);box-shadow:0 0 .8cqw var(--accent)}
.roster{position:absolute;top:2.2%;right:2%;display:flex;gap:.35cqw;background:#000a;padding:.35cqw;border-radius:99px;border:.12cqw solid #ffffff2a}
.roster img{width:2.4cqw;height:2.4cqw;border-radius:50%;object-fit:cover;border:.15cqw solid var(--t,#0000);opacity:.35;transition:.3s}
.roster.many img{width:1.75cqw;height:1.75cqw}
.roster.many{gap:.2cqw}
.roster img.here{opacity:1;border-color:#fff8}
.roster img.lit{border-color:var(--accent);transform:scale(1.2)}
.roster img.gone{filter:grayscale(1);opacity:.2}

/* ═══════════ CONTROLS + TIMELINE ═══════════ */
.controls{width:min(1280px,100%);margin-top:12px;display:flex;flex-direction:column;gap:10px}
.timeline{position:relative;height:18px;border-radius:9px;background:var(--panel);border:1px solid var(--line);cursor:pointer;overflow:hidden}
.timeline .fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#ff8a3d,var(--accent));width:0;transition:width .3s}
.timeline .mark{position:absolute;top:0;bottom:0;width:2px;background:#fff6}
.timeline .mark.conf{background:#ff4d5e}.timeline .mark.tribal{background:#ff9a3d;width:4px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{font-family:Bungee;font-size:13px;letter-spacing:.05em;color:var(--ink);background:var(--panel);border:1px solid var(--line);
  border-radius:10px;padding:9px 14px;cursor:pointer;transition:transform .1s,background .2s}
.btn:hover{background:#1d2540}.btn:active{transform:translateY(2px)}
.btn.on{background:var(--accent);color:#111;border-color:var(--accent)}
.vol{width:90px;accent-color:var(--accent);cursor:pointer}
.hint{color:var(--dim);font-size:13px;margin-left:auto}
.hint kbd{font-family:Bungee;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:5px;padding:2px 6px}
.log{display:none;max-height:260px;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
.log.open{display:block}
.log .ln{padding:4px 0;border-bottom:1px solid #ffffff0a;font-size:14px}
.log .ln b{font-family:Bungee;font-weight:400;font-size:12px;margin-right:8px}
.log .ln.dir{color:var(--dim);font-style:italic}
.log .ln.scene{color:var(--accent);font-family:Bungee;font-size:12px;padding-top:10px}
@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}

:host{display:block}
/* the page's Stage / Script switch hides the host with [hidden]; :host{display} would win over it */
:host([hidden]){display:none}
.es{display:flex;flex-direction:column;align-items:center}
.chapters{display:flex;gap:3px;height:24px}
.chseg{min-width:0;border:1px solid var(--line);background:var(--panel);color:var(--dim);border-radius:6px;font:800 11px Nunito,system-ui,sans-serif;padding:0 7px;cursor:pointer;text-align:left;transition:background .2s,color .2s}
.chseg span{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.chseg:hover{color:var(--ink);background:#1d2540}
.chseg.done{color:#d9c27a;border-color:#6b5a24}
.chseg.cur{background:var(--accent);color:#111;border-color:var(--accent)}
.rt{font-family:Bungee;font-size:12px;letter-spacing:.03em;color:var(--dim);padding:8px 11px;border:1px solid var(--line);border-radius:10px;cursor:help}
.rt.warn{color:#ffb86b;border-color:#ffb86b77}
.chpanel{display:none;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:6px}
.chpanel.open{display:block}
.chrow{display:grid;grid-template-columns:30px 1fr auto 18px;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:8px;background:none;color:var(--ink);font:800 14px Nunito,system-ui,sans-serif;text-align:left;cursor:pointer}
.chrow:hover{background:#1d2540}
.chrow b{font-family:Bungee;font-weight:400;color:var(--dim)}
.chrow .m{color:var(--dim);font-size:12px;font-weight:700}
.chrow.cur{background:#ffcc3322}
.chrow.cur b{color:var(--accent)}
.chrow.done i::before{content:"\\2713";color:#7dff8a}
.chrow.cur i::before{content:"\\25B6";color:var(--accent)}
.chnow{position:absolute;top:calc(2.2% + 3cqw);left:2%;font-family:Bungee;font-size:.85cqw;letter-spacing:.12em;color:#fffc;background:#000a;padding:.25cqw .8cqw;border-radius:99px}
.chnow:empty{display:none}
.chap{position:absolute;inset:0;z-index:42;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#1d1440ee,#05040bf5 70%);opacity:0;pointer-events:none}
.chap.show{animation:chapIn 2.6s ease forwards}
@keyframes chapIn{0%{opacity:0}12%,78%{opacity:1}100%{opacity:0}}
.chap .ck{font-family:Bungee;color:var(--accent);letter-spacing:.5em;font-size:1.3cqw}
.chap .ct{font-family:Bungee;font-size:5.5cqw;line-height:1;color:#fff;margin:1cqw 0;text-shadow:.35cqw .35cqw 0 #000;text-align:center}
.chap.show .ct{animation:titleIn 1s cubic-bezier(.34,1.56,.64,1)}
.chap .cm{font-weight:800;color:#c9d2ee;letter-spacing:.2em;font-size:1.2cqw;text-transform:uppercase}
.titlecard .tmeta{font-weight:800;letter-spacing:.2em;color:#c9d2ee;font-size:1.2cqw;text-transform:uppercase}
.tresume{display:flex;gap:1cqw;margin-top:2cqw}
.tresume:empty{display:none}
.tbtn{font-family:Bungee;font-size:1.2cqw;padding:.8cqw 1.6cqw;border-radius:.8cqw;border:.15cqw solid var(--accent);background:var(--accent);color:#111;cursor:pointer}
.tbtn.ghost{background:transparent;color:var(--accent)}

/* ═══════════ TV LAYER ═══════════ */
/* full-screen sequences: opening titles, ad breaks */
.tv{position:absolute;inset:0;z-index:44;display:none;align-items:center;justify-content:center;flex-direction:column;overflow:hidden;cursor:pointer}
.tv.show{display:flex}
.tv.op{background:radial-gradient(circle at 50% 40%,#2c1a66,#07060f 72%)}
.tv.op::before{content:"";position:absolute;inset:-50%;background:repeating-conic-gradient(from 0deg,#ffcc3314 0 6deg,transparent 6deg 12deg);animation:spin 18s linear infinite}
.op-logo{position:relative;display:flex;flex-direction:column;align-items:center;animation:logoIn 1.2s cubic-bezier(.34,1.56,.64,1)}
.op-logo b{font-family:Bungee;font-size:8cqw;line-height:.95;text-align:center;background:linear-gradient(#fff,#ffd66b 55%,#ff7a1a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(.5cqw .5cqw 0 #000)}
.op-logo span{font-family:Bungee;font-size:2.2cqw;letter-spacing:.35em;color:#fff;margin-top:1cqw;padding:.4cqw 1.6cqw;background:#e8453c;transform:skewX(-12deg);box-shadow:.3cqw .3cqw 0 #000;animation:slideR .6s .5s cubic-bezier(.22,1,.36,1) backwards}
@keyframes logoIn{0%{transform:scale(3) rotate(-10deg);opacity:0;filter:blur(12px)}100%{transform:none}}
.op-grid{position:relative;display:grid;grid-template-columns:repeat(auto-fill,minmax(9.5cqw,1fr));gap:1.1cqw;width:84%;align-content:center}
.op-card{display:flex;flex-direction:column;align-items:center;gap:.4cqw;animation:cardIn .6s var(--d) cubic-bezier(.34,1.56,.64,1) backwards}
.op-card img,.op-card .initial{width:8cqw;height:8cqw;border-radius:1cqw;object-fit:cover;border:.3cqw solid #111;box-shadow:0 0 0 .25cqw var(--t),0 .5cqw 1cqw #000a;background:var(--c)}
.op-card span{font-family:Bungee;font-size:1cqw;color:#fff;text-shadow:.15cqw .15cqw 0 #000}
@keyframes cardIn{0%{transform:translateY(60%) rotate(-12deg) scale(.4);opacity:0}}
.op-hosts{position:relative;margin-top:1.8cqw;font-family:Bungee;font-size:1.5cqw;letter-spacing:.3em;color:var(--accent);animation:slideR .6s .8s backwards}
.op-ep{position:relative;display:flex;flex-direction:column;align-items:center;animation:logoIn 1s cubic-bezier(.34,1.56,.64,1)}
.op-ep small{font-family:Bungee;font-size:1.6cqw;letter-spacing:.5em;color:var(--accent)}
.op-ep b{font-family:Bungee;font-size:6.5cqw;color:#fff;text-shadow:.4cqw .4cqw 0 #000;text-align:center;line-height:1}
.tv.cu-on{background:#05040bea}
.tv.cu-on::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,#ffffff08 0 2px,transparent 2px 4px);animation:vhs .2s steps(2) infinite}
@keyframes vhs{to{transform:translateY(3px)}}
.cu{display:flex;flex-direction:column;align-items:center;gap:1.6cqw;width:78%}
.cu-k{font-family:Bungee;font-size:3.4cqw;color:#fff;background:#e8453c;padding:.3cqw 2cqw;transform:skewX(-12deg);box-shadow:.4cqw .4cqw 0 #000;animation:slideR .5s cubic-bezier(.22,1,.36,1) backwards}
.cu-q{display:flex;align-items:center;gap:2cqw;animation:fadeUp .6s .25s ease backwards}
.cu-f img,.cu-f .initial{width:13cqw;height:13cqw;border-radius:1.2cqw;object-fit:cover;border:.4cqw solid #111;box-shadow:0 0 0 .3cqw var(--c);background:var(--c)}
.cu-q b{font-family:Bungee;font-size:1.6cqw;color:var(--c)}
.cu-q p{font-size:2.6cqw;font-weight:900;font-style:italic;color:#fff;margin:.4cqw 0 0;line-height:1.25}
@keyframes fadeUp{from{opacity:0;transform:translateY(30%)}}
.tv.ad-on{background:#000}
.ad{display:flex;flex-direction:column;align-items:center;gap:1cqw;animation:logoIn .7s ease}
.ad b{font-family:Bungee;font-size:6cqw;color:var(--accent);text-shadow:.35cqw .35cqw 0 #e8453c}
.ad span{font-family:Bungee;font-size:1.6cqw;letter-spacing:.5em;color:#fff}
.tv.wb-on{background:radial-gradient(circle,#ffcc33,#ff7a1a 70%)}
.wb span{display:block;font-family:Bungee;font-size:7cqw;color:#111;text-shadow:.35cqw .35cqw 0 #fff;animation:wbIn .9s cubic-bezier(.34,1.56,.64,1)}
@keyframes wbIn{0%{transform:scale(.2) rotate(-20deg);opacity:0}60%{transform:scale(1.1) rotate(3deg)}100%{transform:none}}

/* reaction shot */
.react{position:absolute;left:2.5%;top:17%;z-index:27;width:15cqw;opacity:0;transform:translateX(-130%) rotate(-8deg);transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .2s;pointer-events:none}
.react.show{opacity:1;transform:rotate(-3deg)}
.react .rf img,.react .rf .initial{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:1cqw;border:.35cqw solid #fff;box-shadow:0 0 0 .3cqw var(--c),0 1cqw 2cqw #000c;background:var(--c)}
.react .rn{position:absolute;left:-6%;bottom:-6%;font-family:Bungee;font-size:1.1cqw;background:var(--c);color:#111;padding:.2cqw .8cqw;border:.15cqw solid #111;transform:skewX(-10deg)}
.react .re{position:absolute;right:-14%;top:-14%;width:5.5cqw;height:5.5cqw;animation:emotePop .8s cubic-bezier(.34,1.8,.64,1) backwards}
.react .re svg{width:100%;height:100%;overflow:visible}
.react.show .rf{animation:zoomPunch .5s ease-out}
@keyframes zoomPunch{0%{transform:scale(1.35)}100%{transform:none}}

/* highlight pop-ups */
.toasts{position:absolute;right:2%;top:11%;z-index:29;display:flex;flex-direction:column;gap:.7cqw;align-items:flex-end;pointer-events:none}
.toast{display:flex;align-items:center;gap:.9cqw;padding:.6cqw 1.2cqw .6cqw .6cqw;min-width:20cqw;border-radius:1cqw;background:linear-gradient(90deg,#1a1236f2,#0b0f1af2);border:.2cqw solid var(--accent);box-shadow:0 .6cqw 1.6cqw #000c,0 0 1.4cqw #ffcc3355;animation:toastIn .55s cubic-bezier(.34,1.56,.64,1) backwards}
.toast.out{animation:toastOut .45s ease-in forwards}
@keyframes toastIn{from{transform:translateX(120%) scale(.8);opacity:0}}
@keyframes toastOut{to{transform:translateX(120%);opacity:0}}
.toast .ti{width:3.6cqw;height:3.6cqw;flex:none;animation:emotePop .8s .15s cubic-bezier(.34,1.8,.64,1) backwards}
.toast .ti svg{width:100%;height:100%;overflow:visible}
.toast b{display:block;font-family:Bungee;font-size:1.25cqw;color:var(--accent);letter-spacing:.04em}
.toast .tn{display:flex;align-items:center;gap:.3cqw;margin-top:.2cqw}
.toast .tp img,.toast .tp .initial{display:block;width:1.9cqw;height:1.9cqw;border-radius:50%;object-fit:cover;border:.12cqw solid var(--c);background:var(--c)}
.toast small{font-weight:800;font-size:.95cqw;color:#dfe6ff;margin-left:.3cqw}
.toast.k-kiss{border-color:#ff5fa2;box-shadow:0 .6cqw 1.6cqw #000c,0 0 1.6cqw #ff5fa266}.toast.k-kiss b{color:#ff8fc0}
.toast.k-blindside{border-color:#ffe14d}.toast.k-lie{border-color:#c084fc}.toast.k-lie b{color:#d8b4fe}
.toast.k-deal{border-color:#7dff8a}.toast.k-deal b{color:#a7ffb0}

/* first-time name caption */
.intro{position:absolute;left:3.5%;bottom:26%;z-index:26;display:flex;flex-direction:column;align-items:flex-start;gap:.25cqw;pointer-events:none;opacity:0}
.intro.show{opacity:1}
.intro b{font-family:Bungee;font-size:2.2cqw;color:#111;background:var(--c);padding:.1cqw 1cqw;transform:skewX(-10deg);box-shadow:.3cqw .3cqw 0 #000;animation:slideR .45s cubic-bezier(.22,1,.36,1) backwards}
.intro .d{font-weight:900;font-size:1.2cqw;color:#fff;background:#000d;padding:.2cqw .9cqw;transform:skewX(-10deg);animation:slideR .45s .06s cubic-bezier(.22,1,.36,1) backwards}
.intro .g{font-weight:900;font-size:1cqw;letter-spacing:.25em;color:#111;background:var(--t);padding:.2cqw .9cqw;transform:skewX(-10deg);animation:slideR .45s .12s cubic-bezier(.22,1,.36,1) backwards}
.stage.cine .intro{opacity:0}

/* the vote board */
.board{position:absolute;right:2%;top:30%;z-index:23;min-width:17cqw;padding:.8cqw 1cqw;border-radius:.8cqw;background:#120c06e6;border:.2cqw solid #c9a227;box-shadow:0 1cqw 2cqw #000c;opacity:0;transform:translateX(120%);transition:.4s cubic-bezier(.34,1.3,.64,1);pointer-events:none}
.board.show{opacity:1;transform:none}
.board .bh{font-family:Bungee;font-size:1cqw;letter-spacing:.35em;color:#c9a227;margin-bottom:.5cqw}
.board .br{display:flex;align-items:center;gap:.6cqw;padding:.3cqw 0;font-size:1.2cqw;color:#fff;transition:.3s}
.board .br.lead b{color:#ffcc33}
.board .br.out{opacity:.45;text-decoration:line-through}
.board .bp img,.board .bp .initial{display:block;width:2cqw;height:2cqw;border-radius:50%;object-fit:cover;border:.12cqw solid var(--c);background:var(--c)}
.board .br b{flex:1;font-weight:900}
.board .br i{display:flex;gap:.2cqw}
.board .br u{display:block;width:.7cqw;height:1.2cqw;background:#f3e6c4;border:.1cqw solid #3b2a14;animation:tallyIn .4s cubic-bezier(.34,1.8,.64,1) backwards}
.board .br em{font-style:normal;font-family:Bungee;font-size:1.1cqw;color:#c9a227;min-width:1.2cqw;text-align:right}

/* the competition's scoreboard, top centre */
.score{position:absolute;left:50%;top:2.2%;translate:-50% 0;z-index:24;display:none;gap:.5cqw;padding:.4cqw;border-radius:.9cqw;background:#0b0f1ae8;border:.18cqw solid #ffffff30;box-shadow:0 .8cqw 2cqw #000a;pointer-events:none}
.score.show{display:flex}
.score.pop{animation:emotePop .6s cubic-bezier(.34,1.8,.64,1)}
.score .sc{display:flex;align-items:center;gap:.6cqw;padding:.25cqw .5cqw .25cqw .9cqw;border-radius:.6cqw;background:#ffffff0c;border-left:.35cqw solid var(--t)}
.score .sc b{font-family:Bungee;font-weight:400;font-size:1cqw;letter-spacing:.06em;color:#fff}
.score .sc i{font-style:normal;font-family:Bungee;font-size:2cqw;line-height:1;min-width:2.4cqw;text-align:center;color:#111;background:var(--t);border-radius:.4cqw;padding:.15cqw .3cqw}
.score .sc.bump i{animation:scoreBump .7s cubic-bezier(.34,1.8,.64,1)}
@keyframes scoreBump{0%{transform:scale(2.2) rotate(-10deg)}100%{transform:none}}
/* finishing order on the standee */
.medal{position:absolute;left:-10%;top:-12%;z-index:3;display:none;font-family:Bungee;font-size:1.1cqw;color:#3a2600;padding:.35cqw .55cqw;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#fff3b0,#ffcc33 55%,#b8860b);border:.18cqw solid #6b4e00;box-shadow:0 .3cqw .8cqw #000a}
.actor.placed .medal{display:block}
.medal.pop{animation:emotePop .8s cubic-bezier(.34,1.8,.64,1)}

/* final words */
.dbox.final .panel{border-color:#ff9a3d;box-shadow:0 0 0 .25cqw #000,0 0 3cqw #ff7a1a88,inset 0 0 4cqw #0008}
.dbox.final .who::after{content:" · FINAL WORDS";color:#7a1f00}

/* weather */
.flash{position:absolute;inset:0;z-index:9;background:#eef4ff;opacity:0;pointer-events:none;mix-blend-mode:screen}
.flash.on{animation:flashAnim .5s steps(3)}
@keyframes flashAnim{0%{opacity:0}20%{opacity:.85}40%{opacity:.1}60%{opacity:.6}100%{opacity:0}}
.stage.rain .world{filter:saturate(.75) brightness(.85)}
.stage.storm .world{filter:saturate(.6) brightness(.7)}
.stage.ff::after{content:"\\25B6\\25B6";position:absolute;right:2.5%;bottom:24%;z-index:30;font-family:Bungee;font-size:2cqw;color:#fff;text-shadow:0 0 1cqw #000;animation:blink .6s steps(2) infinite}

/* results */
.results{position:absolute;inset:0;z-index:46;display:none;flex-direction:column;gap:1.4cqw;padding:3cqw 4cqw;overflow:auto;cursor:default;
  background:radial-gradient(circle at 50% 0%,#2b1c5c,#07060f 75%)}
.results.show{display:flex;animation:fadeUp .6s ease}
.results small{display:block;font-family:Bungee;font-size:1cqw;letter-spacing:.3em;color:var(--dim)}
.rh{text-align:center}
.rh b{display:block;font-family:Bungee;font-size:4.4cqw;color:#fff;text-shadow:.3cqw .3cqw 0 #000;line-height:1.05}
.rh span{display:inline-block;margin-top:.5cqw;font-family:Bungee;font-size:1.2cqw;letter-spacing:.3em;color:#111;background:var(--accent);padding:.2cqw 1cqw;transform:skewX(-10deg)}
.rgrid{display:grid;grid-template-columns:1fr 1fr;gap:1.6cqw}
.rcol{display:flex;flex-direction:column;gap:1.2cqw}
.rx,.rw,.rq,.rbox{background:#141a2ae6;border:.15cqw solid var(--line);border-radius:1cqw;padding:1.2cqw;animation:fadeUp .6s ease backwards}
.rx{display:flex;gap:1.2cqw;border-color:#ff4d5e88}
.rxf img,.rxf .initial{width:9cqw;height:9cqw;border-radius:1cqw;object-fit:cover;border:.3cqw solid #111;box-shadow:0 0 0 .25cqw #ff4d5e;background:var(--c);animation:greyIn 2s ease forwards}
@keyframes greyIn{to{filter:grayscale(1) brightness(.8)}}
.rx b,.rw b{display:block;font-family:Bungee;font-size:2.4cqw;color:#fff}
.rx small{color:#ff8a95}
.rv{display:flex;flex-wrap:wrap;gap:.4cqw .8cqw;margin-top:.4cqw;font-size:1.2cqw;color:#dfe6ff}
.rv b{display:inline;font-size:1.2cqw;color:#ffcc33}
.fw{margin:.6cqw 0 0;font-size:1.2cqw;font-style:italic;color:#ffcfa0}
.rw{border-color:#c9a22788;animation-delay:.1s}
.rw small{color:#e0c060}
.rwp{display:flex;gap:.4cqw;margin-top:.5cqw}
.rwp img,.rwp .initial{display:block;width:3.2cqw;height:3.2cqw;border-radius:50%;object-fit:cover;border:.15cqw solid var(--c);background:var(--c)}
.rq{display:flex;gap:1.2cqw;animation-delay:.2s}
.rqf img,.rqf .initial{width:6cqw;height:6cqw;border-radius:.8cqw;object-fit:cover;border:.25cqw solid var(--c);background:var(--c)}
.rq p{margin:.3cqw 0;font-size:1.5cqw;font-weight:900;font-style:italic;color:#fff;line-height:1.3}
.rq b{font-size:1.1cqw;color:var(--c)}
.rbox{animation-delay:.15s}
.rs{display:grid;grid-template-columns:2.4cqw 7cqw 1fr 4.5cqw;align-items:center;gap:.7cqw;margin-top:.5cqw;font-size:1.2cqw;color:#fff}
.rsp img,.rsp .initial{display:block;width:2.4cqw;height:2.4cqw;border-radius:50%;object-fit:cover;border:.15cqw solid var(--c);background:var(--c)}
.rs b{font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rs i{height:1.1cqw;border-radius:99px;background:#ffffff14;overflow:hidden}
.rs u{display:block;height:100%;width:var(--w);background:var(--c);border-radius:99px;animation:barGrow 1s var(--d) cubic-bezier(.22,1,.36,1) backwards}
@keyframes barGrow{from{width:0}}
.rs em{font-style:normal;font-family:Bungee;font-size:.8cqw;color:var(--dim);text-align:right}
.rms{display:flex;flex-wrap:wrap;gap:.6cqw;margin-top:.6cqw}
.rm{font-family:Bungee;font-size:.95cqw;padding:.35cqw .8cqw;border-radius:99px;background:#ffcc3322;color:var(--accent);border:.12cqw solid #ffcc3366}
.rm.k-kiss{background:#ff5fa222;color:#ff8fc0;border-color:#ff5fa266}.rm.k-lie{background:#c084fc22;color:#d8b4fe;border-color:#c084fc66}
.rm.k-deal{background:#7dff8a22;color:#a7ffb0;border-color:#7dff8a66}.rm.k-blindside{background:#ffe14d22;color:#ffe14d}
.rbtns{display:flex;gap:1cqw;justify-content:center;padding-bottom:1cqw}

/* ═══════════ PHONE WIDTH ═══════════ */
/* cqw sizes the stage like a TV at desktop widths; on a phone that makes text
   unreadable, so the stage turns portrait and the words get pixel floors. */
.es{container-type:inline-size;container-name:es}
@container es (max-width: 700px){
  .stage{aspect-ratio:3/4;border-radius:10px}
  .actor{width:calc(var(--w,11cqw) * 1.5);margin-left:calc(var(--w,11cqw) * -.75)}
  .dbox{height:25%;left:2%;right:2%;bottom:2.5%}
  .dbox .face{width:17cqw}
  .dbox .panel{padding:16px 12px 10px 18px}
  .dbox .txt{font-size:14px;line-height:1.35}
  .dbox .txt.narr{font-size:13px}
  .dbox .txt.shout{font-size:16px}
  .dbox .who{font-size:12px;top:-12px}
  .chip{font-size:9px;gap:4px;padding:3px 8px}
  .chip .team i{font-size:8px}
  .chnow{font-size:8px;top:calc(2.2% + 22px)}
  .roster{display:none}
  .plate{font-size:9px}
  .banner .kicker,.banner .time{font-size:10px}
  .banner .place{font-size:9cqw}
  .conf .lower .n{font-size:20px} .conf .lower .d{font-size:12px} .conf .lower .t{font-size:10px}
  .conf .subject{width:56cqw;left:62%}
  .conf .rec{font-size:11px} .conf .tc{font-size:11px}
  .titlecard .name{font-size:10cqw} .titlecard .ep,.titlecard .tmeta,.titlecard .press{font-size:10px}
  .tbtn{font-size:11px;padding:8px 12px}
  .intro b{font-size:15px} .intro .d,.intro .g{font-size:10px}
  .intro{bottom:30%}
  .toast{min-width:0;max-width:70cqw} .toast b{font-size:11px} .toast small{font-size:9px}
  .toast .ti{width:22px;height:22px} .toast .tp img{width:16px;height:16px}
  .react{width:28cqw}
  .react .rn{font-size:10px}
  .board{min-width:0;top:14%} .board .br{font-size:11px} .board .bh{font-size:9px} .board .bp img{width:16px;height:16px}
  .chap .ck,.chap .cm{font-size:10px} .chap .ct{font-size:9cqw}
  .op-grid{grid-template-columns:repeat(4,1fr)} .op-card img,.op-card .initial{width:15cqw;height:15cqw} .op-card span{font-size:9px}
  .op-logo b{font-size:12cqw} .op-logo span,.op-hosts,.op-ep small,.ad span{font-size:10px}
  .cu{width:90%} .cu-k{font-size:16px} .cu-q p{font-size:14px} .cu-q b{font-size:11px}
  .results{padding:14px}
  .results small{font-size:9px} .rh b{font-size:24px} .rh span{font-size:10px}
  .rgrid{grid-template-columns:1fr}
  .rx b,.rw b{font-size:18px} .rv,.rv b,.fw,.rs{font-size:12px} .rq p{font-size:13px} .rq b{font-size:11px}
  .rs{grid-template-columns:20px 64px 1fr 40px} .rs em,.rm{font-size:9px} .rs i{height:8px}
  .rsp img,.rsp .initial{width:20px;height:20px}
  .hint{display:none}
  .btn{padding:8px 10px;font-size:11px}
  .chseg span{font-size:10px}
  .stage.ff::after{font-size:14px}
}
`;

const MARKUP = `<div class="stage" id="stage">
  <div class="world" id="world">
    <div class="layer l-sky" id="lSky"></div>
    <div class="layer l-far" id="lFar"></div>
    <div class="layer l-mid" id="lMid"></div>
    <div class="actors" id="actors"></div>
    <div class="speedlines" id="speed"></div>
    <div class="layer l-fg" id="lFg"></div>
  </div>
  <div class="tint" id="tint"></div>
  <div class="glow" id="glow"></div>
  <canvas class="fx" id="fx"></canvas>
  <div class="vignette"></div>

  <div class="conf" id="conf">
    <div class="bg" id="confBg"></div>
    <div class="bokeh" id="bokeh"></div>
    <div class="subject" id="confSubject"><div class="fc"><img alt=""></div></div>
    <div class="vf"><b></b><b></b><b></b><b></b></div>
    <div class="rec">REC <small>CONFESSIONAL</small></div>
    <div class="tc" id="tc">00:00:00</div>
    <div class="batt"></div>
    <div class="lower" id="confLower"></div>
  </div>

  <div class="vote" id="vote"></div>
  <div class="spoken" id="spoken"><span id="spokenText"></span></div>
  <div class="caption" id="caption"></div>

  <div class="dbox" id="dbox">
    <div class="face" id="face"><div class="fc"><img alt=""></div></div>
    <div class="panel"><div class="who" id="who"></div><div class="txt" id="txt"></div><div class="more"></div></div>
  </div>

  <div class="hud">
    <div class="chip"><span class="team" id="team"></span><span class="dot"></span><span id="chipScene">—</span></div>
    <div class="roster" id="roster"></div>
    <div class="chnow" id="chNow"></div>
  </div>

  <div class="flash" id="flash"></div>
  <div class="board" id="board"></div>
  <div class="score" id="score"></div>
  <div class="intro" id="intro"></div>
  <div class="react" id="react"></div>
  <div class="toasts" id="toasts"></div>
  <div class="tv" id="tv"></div>
  <div class="results" id="results"></div>
  <div class="banner" id="banner"><div class="strip"><div class="kicker" id="bKick"></div><div class="place" id="bPlace"></div><div class="time" id="bTime"></div></div></div>
  <div class="letterbox top"></div><div class="letterbox bot"></div>
  <canvas class="static" id="static"></canvas>
  <div class="chap" id="chap"><div class="ck" id="cKick"></div><div class="ct" id="cTitle"></div><div class="cm" id="cMeta"></div></div>
  <div class="iris open" id="iris"></div>
  <div class="titlecard" id="titlecard">
    <div class="ep" id="tEp">TOTAL DRAMA</div>
    <div class="name" id="tName"></div>
    <div class="tmeta" id="tMeta"></div>
    <div class="tresume" id="tResume"></div>
    <div class="press" id="tPress">CLICK OR PRESS SPACE</div>
  </div>
</div>

<div class="controls">
  <div class="chapters" id="chapters"></div>
  <div class="timeline" id="timeline"><div class="fill" id="tlFill"></div></div>
  <div class="row">
    <button class="btn" id="bPrev">◀ Back</button>
    <button class="btn" id="bNext">Next ▶</button>
    <button class="btn" id="bAuto">Auto</button>
    <button class="btn" id="bFF" title="Hold to fast-forward (or hold Shift)">&#9193; Hold</button>
    <button class="btn" id="bSkip" title="Skip to the next scene (S)">Skip scene</button>
    <button class="btn" id="bSpeed">Text 1×</button>
    <button class="btn on" id="bSound">Sound</button>
    <button class="btn" id="bMusic">Music</button>
    <input class="vol" id="vol" type="range" min="0" max="100" title="Music volume">
    <button class="btn" id="bNames">Names</button>
    <button class="btn" id="bLog">Log</button>
    <button class="btn" id="bChapters">Chapters</button>
    <span class="rt" id="rt"></span>
    <span class="hint"><kbd>Space</kbd>/<kbd>→</kbd> next · <kbd>←</kbd> back · <kbd>A</kbd> auto · <kbd>L</kbd> log · <kbd>C</kbd> chapters · <kbd>M</kbd> music · hold <kbd>Shift</kbd> fast · <kbd>S</kbd> skip</span>
  </div>
  <div class="log" id="log"></div>
  <div class="chpanel" id="chPanel"><div class="chlist" id="chList"></div></div>
  </div>
`;

// ════════════════════════════════════════════════════════════════
//  MOUNT — one stage per host element, torn down when replaced
// ════════════════════════════════════════════════════════════════
// the audio engine is one per page; whichever stage last asked for a bed owns it
let bedOwner = null;

function ensureFonts(){
  if (document.getElementById('es-fonts')) return;
  const l = document.createElement('link');
  l.id = 'es-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@600;700;800;900&family=Permanent+Marker&display=swap';
  document.head.appendChild(l);
}

/**
 * Draw an episode into `host`. opts.portrait(name) → image URL (the page's
 * portraitFor); opts.showName for the title card when the transcript has none.
 * Returns { destroy, parsed, runtime, chapters, jump, next }. Emptying the
 * host (the page does, on every season/episode change) stops the stage on its
 * next frame.
 */
export function mountEpisodeStage(host, text, opts = {}){
  host.__episodeStage?.destroy();
  ensureFonts();
  const R = host.shadowRoot || host.attachShadow({ mode: 'open' });
  R.innerHTML = `<style>${STYLE}</style><div class="es">${MARKUP}</div>`;
  const listeners = [], timers = [], disposers = [];
  let raf = 0, dead = false, visible = true;
  const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); };
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; syncBed(); }, { threshold: .25 }) : null;
  io?.observe(host);
  function destroy(){
    if (dead) return; dead = true;
    cancelAnimationFrame(raf); timers.forEach(clearInterval);
    clearTimeout(S.timer); clearInterval(S.typing?.iv);
    listeners.forEach(([t, ev, fn, o]) => t.removeEventListener(ev, fn, o));
    io?.disconnect(); disposers.forEach(f => f());
    try { sfx.ctx?.close(); } catch(e){}
    if (bedOwner === api) { audio.ambient(null); bedOwner = null; }   // the page moved on: stop our music
    if (host.__episodeStage === api) delete host.__episodeStage;
  }

  // ── music: the simulator's beds, chosen by what is on screen ──
  // Camp by day or night, the challenge, tribal. The end card gets the
  // aftermath lounge. Only while the stage is on screen and has been started —
  // a stage hidden behind the Script toggle or scrolled away is silent.
  let bed = null;
  function bedFor(i){
    const b = P.beats[i]; if (!b) return null;
    if (b.t === 'end') return SH.beds.end;
    const sc = P.scenes[b.scene], kind = sceneKind(sc);
    if (kind === 'exit') return SH.beds.exit;
    if (kind === 'comp') return SH.beds.comp;
    const t = (S.view && S.view.time) || sc.time;
    return t === 'night' || t === 'dusk' ? SH.beds.night : SH.beds.day;
  }
  function syncBed(){
    if (dead) return;
    const want = visible && S.started ? bed : null;   // music on/off itself is audio.js's, shared with the simulator
    if (want) bedOwner = api;
    if (want || bedOwner === api) audio.ambient(want);
    amb.apply();
  }
  function setBed(name){ bed = name; syncBed(); }
  // one of the simulator's cues, when this stage's sound is on
  const cue = name => { if (S.sound) audio.sfx(name); };

  // ════════════════════════════════════════════════════════════════
  //  ENGINE 1 — scene, standees, camera, particles, sound
  // ════════════════════════════════════════════════════════════════
  const $ = id => R.getElementById(id);
  const stage = $('stage');
  const P = parse(text, { portrait: opts.portrait, show: opts.show });
  const CAST = P.cast;
  // who they are, for the confessional caption: { name: { age, birthdate, occupation } }.
  // The page hands a promise (the roster loads while the title card is up).
  let PROFILES = {};
  Promise.resolve(typeof opts.profiles === 'function' ? opts.profiles() : opts.profiles)
    .then(m => { if (m && typeof m === 'object') PROFILES = m; }).catch(() => {});
  const S = { idx:-1, scene:-1, conf:null, typing:null, auto:false, speed:1, sound:true, busy:false,
              tally:{}, gone:new Set(), immune:new Set(), idols:new Set(), lastSpeaker:null, lastShout:null, started:false, timer:null,
              view:{}, home:{}, cur:{}, xs:{}, crowd:false, benched:new Set(),
              ff:false, inSeq:false, skipSeq:false, openingDone:false, openingAt:0, introduced:new Set(), lastReact:-9, weather:null,
              score:null, places:{} };

  // SVG coords (1600×900, layer inset −8%/−6%) → stage fraction
  const toStage = (x,y) => [ -0.08 + 1.16*(x/1600), -0.06 + 1.12*(y/900) ];
  // where each set's fire burns (the sets file says), for embers and flares
  const FIRE = {};
  Object.entries(SETS).forEach(([k, st]) => { if (st.fire) FIRE[k] = toStage(...st.fire); });

  function renderSet(setKey, time, sc){
    const set = SETS[setKey], T = TIMES[time];
    $('lSky').innerHTML = skySVG(time);
    $('lFar').innerHTML = set.far(time, sc);
    $('lMid').innerHTML = set.mid(time, sc);
    $('lFg').innerHTML  = set.fg(time, sc);
    $('tint').style.background = T.tint;
    $('glow').style.background = set.glow || (time==='night' ? 'radial-gradient(ellipse at 78% 18%,#9fb2ff44,transparent 50%)'
                                           : time==='dusk' ? 'radial-gradient(ellipse at 68% 58%,#ff9a5c55,transparent 55%)' : 'none');
    // a new place starts with clean air: the last set's steam and entrance puffs do not follow the cut
    if (FX.set !== setKey) FX.parts = [];
    // leaving the booth ends its one-voter-at-a-time rule — the tribe is back around the fire
    if (SH.boothSet && FX.set === SH.boothSet && setKey !== SH.boothSet){
      R.querySelectorAll('.actor').forEach(a => a.classList.remove('offstage'));
      S.cur = { ...S.home }; applyPos();
    }
    FX.kind = set.fx; FX.set = setKey; FX.night = time==='night';
    S.view = { set:setKey, time };
    amb.apply();
    const sub = setKey !== sc.set ? ` · ${set.label.toUpperCase()}` : sc.sub ? ` · ${sc.sub.toUpperCase()}` : '';
    $('chipScene').textContent = `${sc.place.toUpperCase()}${sub} · SCENE ${sc.i+1}/${P.scenes.length}`;
  }
  function renderScene(si){
    const sc = P.scenes[si];
    S.benched = new Set();
    renderSet(sc.set, sc.time, sc);
    buildActors(sc);
    buildRoster(sc);
    updateTeam(sc);
    camera(0,0,1);
    S.scene = si; S.tally = {}; S.lastSpeaker = null; S.lastShout = null;
    updateBoard(); setWeather(sc.weather);
    // the scoreboard and medals last as long as the competition does
    if (!sc.comp){ S.score = null; S.places = {}; }
    applyCompState();
    // the voting booth holds one voter at a time: everyone waits outside until it is their turn
    if (SH.boothSet && sc.set === SH.boothSet)
      R.querySelectorAll('.actor').forEach(a => { if (!CAST[a.dataset.n].host) a.classList.add('offstage'); });
  }
  function applyCompState(){
    const el = $('score');
    if (S.score){ updateScore({}, true); } else { el.classList.remove('show'); el.innerHTML = ''; }
    Object.entries(S.places).forEach(([n, l]) => medal(n, l, true));
  }
  // step a voter up to the urn — alone, large, front and centre
  function boothFocus(n){
    const sc = P.scenes[S.scene];
    if (!SH.boothSet || !sc || S.view?.set !== SH.boothSet || !actorEl(n) || CAST[n].host) return;
    const was = !actorEl(n).classList.contains('offstage');
    R.querySelectorAll('.actor').forEach(a => { if (!CAST[a.dataset.n].host) a.classList.toggle('offstage', a.dataset.n !== n); });
    S.cur = { ...S.home, [n]: { x: 36, floor: 27, w: 15, z: 6 } };
    applyPos();
    if (!was){ const a = actorEl(n); a.style.animationDelay = '0s'; retrigger(a, 'enter'); sfx.whoosh(); }
  }

  const roleOf = (sc, n) => CAST[n].host ? 'host' : (sc.roles[n] && sc.roles[n] !== 'player' ? sc.roles[n] : CAST[n].role);
  // Positions: {x (%), floor (% from bottom), w (cqw), z}. Up to ten people stand in one or two rows;
  // past that the scene is a crowd — tribes in bleacher rows, coaches on a bench, hosts at the podium —
  // and whoever is talking steps down into the spotlight.
  function layout(sc){
    const ppl = sc.present, pos = {};
    const hosts = ppl.filter(n => CAST[n].host);
    // named "Background:" people stand small at the back, out of the way
    const bg = ppl.filter(n => !CAST[n].host && roleOf(sc, n) === 'bg');
    bg.forEach((nm, i) => pos[nm] = { x: 10 + 80 * (i + .5) / bg.length, floor: 44, w: 5.5, z: 0, back: true });
    const rest = ppl.filter(n => !CAST[n].host && !bg.includes(n));
    S.crowd = ppl.length - bg.length > 10;
    if (!S.crowd){
      const n = rest.length, left = 13, right = hosts.length ? 72 : 86, two = n > 5;
      rest.forEach((nm, i) => {
        const back = two && i % 2 === 1;
        pos[nm] = { x: n===1 ? 50 : n===2 ? [36,64][i] : left + (right-left)*i/(n-1),
                    floor: back ? 37 : 28, w: two ? 9 : 11, z: back ? 1 : 3, back };
      });
      hosts.forEach((nm, i) => pos[nm] = { x: 84 - i*9, floor: 31, w: two ? 9 : 10, z: 2 });
      return pos;
    }
    const coaches = rest.filter(n => roleOf(sc, n) === 'coach');
    const players = rest.filter(n => roleOf(sc, n) !== 'coach');
    const FLOORS = [46, 38, 30];
    hosts.forEach((nm, i) => pos[nm] = { x: 91 - i*8.5, floor: 30 + i*6, w: 8, z: 4 - i });
    coaches.forEach((nm, i) => pos[nm] = { x: 7.5 + (i % 2) * 7, floor: FLOORS[Math.floor(i/2) % 3] - 2, w: 5.6, z: Math.floor(i/2) });
    // players: one block per tribe, three rows deep
    const tribes = [...new Set(players.map(n => CAST[n].tribe || '~'))];
    const L = coaches.length ? 21 : 8, R = hosts.length ? 80 : 92, span = R - L;
    let col0 = 0; const cols = tribes.map(t => Math.ceil(players.filter(n => (CAST[n].tribe || '~') === t).length / 3));
    const totalCols = cols.reduce((a,b) => a+b, 0) + tribes.length - 1;
    tribes.forEach((t, k) => {
      players.filter(n => (CAST[n].tribe || '~') === t).forEach((nm, i) => {
        const c = col0 + Math.floor(i / 3), r = i % 3;
        pos[nm] = { x: L + span * (c + .5 + (r===1 ? .25 : 0)) / (totalCols + .5), floor: FLOORS[r], w: 6.2, z: r };
      });
      col0 += cols[k] + 1;
    });
    return pos;
  }
  function applyPos(){
    S.xs = {};
    for (const [n, p] of Object.entries(S.cur)){
      S.xs[n] = p.x;
      const a = actorEl(n); if (!a) continue;
      a.style.setProperty('--x', p.x + '%'); a.style.setProperty('--floor', p.floor + '%'); a.style.setProperty('--w', p.w + 'cqw');
      a.style.zIndex = p.z; a.classList.toggle('back', !!p.back); a.classList.toggle('spot', !!p.spot);
    }
  }
  // crowd only: the people this beat is about step forward, everyone else goes back to their seat
  function spotlight(names){
    if (!S.crowd) return;
    const who = names.filter(n => S.home[n] && !CAST[n].host && !S.benched.has(n) && !actorEl(n)?.classList.contains('offstage')).slice(0, 3);
    const slots = [[50], [40, 60], [34, 50, 66]][who.length - 1] || [];
    S.cur = { ...S.home };
    who.forEach((n, i) => S.cur[n] = { x: slots[i], floor: 25, w: 10.5, z: 20, spot: true });
    applyPos();
  }
  function buildActors(sc){
    S.home = layout(sc); S.cur = { ...S.home };
    $('actors').innerHTML = sc.present.map((n, i) => {
      const c = CAST[n], role = roleOf(sc, n), off = sc.late[n] != null && S.idx < sc.late[n];
      const tribe = tribeColor(c.tribe);
      const cls = ['actor','enter', S.gone.has(n) && 'gone', S.benched.has(n) && 'benched', S.immune.has(n) && 'immune', S.idols.has(n) && 'hasidol', off && 'offstage'].filter(Boolean).join(' ');
      return `<div class="${cls}" data-n="${n}" style="--c:${c.c};--t:${tribe};--ph:${-(i*.37)%2.6}s;animation-delay:${.3+Math.min(i,14)*.06}s">
        <div class="shadow"></div>
        <div class="turn"><div class="rig">
          <div class="ring"></div>
          <div class="card">${c.img ? '' : `<b class="initial">${n[0]}</b>`}<img ${c.img ? '' : 'hidden '}src="${c.img}" alt="${n}" onerror="this.replaceWith(Object.assign(document.createElement('b'),{className:'initial',textContent:'${n[0]}'}))"></div>
          ${role==='coach' ? '<div class="role">COACH</div>' : role==='host' ? '<div class="role host">HOST</div>' : ''}
          <div class="item necklace">${NECKLACE}</div>
          <div class="item idol">${IDOL}</div>
        <div class="medal"></div>
          <div class="stand"></div>
        </div></div>
        <div class="plate">${n.toUpperCase()}</div>
        <div class="tally"></div>
        <div class="emote"></div>
      </div>`;
    }).join('');
    // "Background: everyone milling around" → a row of silhouettes behind the named cast
    if (sc.background) $('actors').insertAdjacentHTML('afterbegin', `<div class="extras">${[...Array(11)].map((_, i) =>
      `<svg style="left:${4 + i*8.6 + (i%2)*2}%;--d:${-i*.4}s;height:${7 + (i%3)*1.2}cqw" viewBox="0 0 40 60"><circle cx="20" cy="14" r="10"/><path d="M2 60 Q2 30 20 28 Q38 30 38 60Z"/></svg>`).join('')}</div>`);
    applyPos();
  }
  // WHOSE STORY THIS IS: the tribe whose camp we are in, else the tribes of the
  // people standing here (every tribe at a challenge; one at a two-person scene
  // on the dock). Hidden when nobody here has a tribe on file (a merge, Exile).
  function teamsOf(sc){
    if (sc.tribe) return [sc.tribe];
    return [...new Set(sc.present.filter(n => !CAST[n].host && roleOf(sc, n) !== 'bg').map(n => CAST[n].tribe).filter(Boolean))];
  }
  function updateTeam(sc){
    const ts = teamsOf(sc), el = $('team');
    const html = ts.length > 2 ? `<i style="--t:#fff">ALL ${esc(SH.groups.toUpperCase())}</i>${ts.map(t => `<b style="--t:${tribeColor(t)}"></b>`).join('')}`
      : ts.map(t => `<i style="--t:${tribeColor(t)}">${esc(t.toUpperCase())}</i>`).join('');
    if (el.innerHTML !== html){ el.innerHTML = html; retrigger(el, 'pop'); }
  }
  function buildRoster(sc){
    const all = Object.keys(CAST).filter(n => !CAST[n].host)
      .sort((a,b) => (CAST[a].tribe||'~').localeCompare(CAST[b].tribe||'~'));
    $('roster').classList.toggle('many', all.length > 14);
    $('roster').innerHTML = all.map(n =>
      `<img src="${CAST[n].img}" data-n="${n}" title="${n}" style="--t:${CAST[n].tribe ? tribeColor(CAST[n].tribe) : '#fff8'}" class="${sc.present.includes(n)?'here':''}${S.gone.has(n)?' gone':''}" onerror="this.style.visibility='hidden'">`).join('');
  }
  const actorEl = n => $('actors').querySelector(`.actor[data-n="${n}"]`);
  // one-shot classes clear themselves so the idle/talk loops on the same element come back
  const ONESHOT = { jump:700, recoil:600, enter:2200, shake:500, hit:300, swap:500, whip:320, pop:600 };
  function retrigger(el, cls){ if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    if (ONESHOT[cls]){ clearTimeout(el['_t'+cls]); el['_t'+cls] = setTimeout(()=>el.classList.remove(cls), ONESHOT[cls]); } }
  function camera(x, y, z){
    stage.style.setProperty('--camx', x); stage.style.setProperty('--camy', y); stage.style.setProperty('--zoom', z);
  }
  function focusOn(n, z=1.12){
    const x = S.xs?.[n]; if (x == null) return camera(0,0,1);
    if (S.crowd) return camera(0, .4, 1.03);   // a crowd stays framed; the spotlight does the pointing
    camera((50 - x)*0.08, .8, 1 + (z-1)*.5);
  }

  // ── emotes (SVG, no emoji) ──
  const EMOTES = {
    shout:   `<svg viewBox="-50 -50 100 100"><path d="M0 -46 L12 -16 L44 -22 L20 2 L40 30 L8 20 L0 48 L-10 20 L-42 30 L-20 2 L-44 -22 L-12 -16Z" fill="#ff4d5e" stroke="#111" stroke-width="5"/><text x="0" y="14" text-anchor="middle" font-family="Bungee" font-size="40" fill="#fff">!</text></svg>`,
    surprise:`<svg viewBox="-50 -50 100 100"><circle r="34" fill="#fff" stroke="#111" stroke-width="5"/><text x="0" y="16" text-anchor="middle" font-family="Bungee" font-size="46" fill="#ff4d5e">!</text></svg>`,
    question:`<svg viewBox="-50 -50 100 100"><circle r="34" fill="#fff" stroke="#111" stroke-width="5"/><text x="0" y="16" text-anchor="middle" font-family="Bungee" font-size="44" fill="#3a6bff">?</text></svg>`,
    hesitate:`<svg viewBox="-50 -50 100 100"><path d="M10 -40 C 30 -10 34 10 14 26 C -6 38 -24 22 -16 2 Z" fill="#9fd8ff" stroke="#111" stroke-width="5"/><path d="M8 -18 C 16 -4 16 6 8 14" stroke="#fff" stroke-width="5" fill="none"/></svg>`,
    angry:   `<svg viewBox="-50 -50 100 100"><g stroke="#ff2e3f" stroke-width="10" stroke-linecap="round" fill="none"><path d="M-30 -8 Q -8 -8 -8 -30"/><path d="M30 -8 Q 8 -8 8 -30"/><path d="M-30 8 Q -8 8 -8 30"/><path d="M30 8 Q 8 8 8 30"/></g></svg>`,
    laugh:   `<svg viewBox="-50 -50 100 100"><g font-family="Bungee" fill="#ffcc33" stroke="#111" stroke-width="3" paint-order="stroke"><text x="-40" y="0" font-size="30" transform="rotate(-14)">HA</text><text x="0" y="30" font-size="26" transform="rotate(10)">HA</text></g></svg>`,
    whisper: `<svg viewBox="-50 -50 100 100"><g fill="#c9d2ee" stroke="#111" stroke-width="3"><circle cx="-24" cy="10" r="8"/><circle cx="0" cy="10" r="8"/><circle cx="24" cy="10" r="8"/></g></svg>`,
    sad:     `<svg viewBox="-50 -50 100 100"><path d="M0 -40 C 22 -6 26 12 0 30 C -26 12 -22 -6 0 -40Z" fill="#5fb0ff" stroke="#111" stroke-width="5"/></svg>`,
    star:    `<svg viewBox="-50 -50 100 100"><path d="M0 -44 L13 -14 L44 -12 L20 8 L28 40 L0 22 L-28 40 L-20 8 L-44 -12 L-13 -14Z" fill="#ffd84d" stroke="#111" stroke-width="5"/></svg>`,
    heart:   `<svg viewBox="-50 -50 100 100"><path d="M0 36 C -60 -4 -34 -52 0 -20 C 34 -52 60 -4 0 36Z" fill="#ff4f8b" stroke="#111" stroke-width="5"/></svg>`,
    tense:   `<svg viewBox="-50 -50 100 100"><path d="M-30 -30 L-10 -10 M30 -30 L10 -10 M0 -40 V -14" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>`,
  };
  const NECKLACE = `<svg viewBox="-60 -20 120 70"><path d="M-50 -14 Q 0 40 50 -14" stroke="#c9a227" stroke-width="5" fill="none"/>${[-36,-22,-8,8,22,36].map(x=>`<circle cx="${x}" cy="${-14+54*(1-Math.pow(x/50,2))*.62}" r="5" fill="#ffd84d" stroke="#6b4e00" stroke-width="2"/>`).join('')}<path d="M0 22 L14 34 L0 50 L-14 34Z" fill="#ffd84d" stroke="#6b4e00" stroke-width="3"/><circle cy="35" r="5" fill="#e8453c"/></svg>`;
  const IDOL = `<svg viewBox="-30 -50 60 100"><path d="M-18 -30 Q -18 -48 0 -48 Q 18 -48 18 -30 L 16 -8 L 22 40 L -22 40 L -16 -8Z" fill="#9a6a33" stroke="#2b1a0a" stroke-width="4"/><circle cx="-7" cy="-30" r="4" fill="#ffd84d"/><circle cx="7" cy="-30" r="4" fill="#ffd84d"/><path d="M-8 -16 h16" stroke="#2b1a0a" stroke-width="4"/><path d="M-16 6 h32 M-18 22 h36" stroke="#6b4724" stroke-width="4"/></svg>`;
  function emote(n, kind){
    const el = actorEl(n)?.querySelector('.emote'); if (!el || !EMOTES[kind]) return;
    el.innerHTML = EMOTES[kind]; retrigger(el,'pop');
    clearTimeout(el._t); el._t = setTimeout(()=>{ el.innerHTML=''; el.classList.remove('pop'); }, 2400);
  }

  // ════════════ PARTICLES ════════════
  const FX = { kind:null, parts:[], w:0, h:0, ctx:$('fx').getContext('2d') };
  function sizeFx(){ const r = stage.getBoundingClientRect(), d = devicePixelRatio||1;
    FX.w = r.width; FX.h = r.height; $('fx').width = r.width*d; $('fx').height = r.height*d; FX.ctx.setTransform(d,0,0,d,0,0); }
  on(window, 'resize', sizeFx); sizeFx();
  // mounted behind the Script toggle, the stage has no size until it is shown
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => sizeFx()) : null;
  ro?.observe(stage); disposers.push(() => ro?.disconnect());
  function spawn(p){ FX.parts.push(Object.assign({ life:0, max:2, size:3, vx:0, vy:0, g:0, drag:1, color:'#fff', type:'dot', rot:0, vr:0 }, p)); }
  function ambient(){
    const {w,h} = FX, k = FX.kind, r = Math.random;
    if (k==='embers'){ const f = FIRE[FX.set] || [.5,.8];
      if (r()<.14) spawn({ x:f[0]*w+(r()-.5)*40, y:f[1]*h, vx:(r()-.5)*20, vy:-40-r()*60, max:1.6+r()*1.2, size:1+r()*1.6, color:r()<.5?'#ffb13d':'#ff6a1a', type:'glow' }); }
    if (k==='fireflies' && r()<.12) spawn({ x:r()*w, y:h*(.3+r()*.5), vx:(r()-.5)*14, vy:(r()-.5)*14, max:4+r()*3, size:2.5, color:'#e8ff7a', type:'glow', wander:true });
    if (k==='spray' && r()<.25) spawn({ x:r()*w, y:h*(.55+r()*.15), vx:10+r()*20, vy:-20-r()*30, g:40, max:1.2+r(), size:1.5+r()*1.5, color:'#ffffffcc' });
    if (k==='dust' && r()<.15) spawn({ x:-10, y:h*(.3+r()*.5), vx:20+r()*30, vy:(r()-.5)*8, max:6, size:1.5+r()*2, color:'#fff2c9aa' });
    if (k==='wind' && r()<.3) spawn({ x:-40, y:h*r()*.8, vx:600+r()*400, vy:(r()-.5)*20, max:1.2, size:1, color:'#ffffff66', type:'streak' });
    if (k==='confetti' && r()<.06) spawn({ x:r()*w, y:-10, vx:(r()-.5)*30, vy:40+r()*40, max:6, size:5, color:['#ffcc33','#e8453c','#3aa0ff','#40c060'][r()*4|0], type:'rect', vr:(r()-.5)*8 });
    // snow drifting down; steam rising off the pots
    if (k==='snow' && r()<.5) spawn({ x:r()*w*1.1, y:-8, vx:-10 + r()*20, vy:30 + r()*40, max:9, size:1.5 + r()*2.5, color:'#ffffffdd', type:'glow', wander:true });
    if (k==='steam' && r()<.08){ const f = FIRE[FX.set] || [.5,.6];
      spawn({ x:f[0]*w + (r()-.5)*50, y:f[1]*h, vx:(r()-.5)*10, vy:-22 - r()*18, drag:.995, max:2.5 + r()*1.5, size:4 + r()*6, color:'#ffffffaa', type:'smoke' }); }
    // rain: slanted streaks across the whole frame, heavier in a storm
    if (FX.weather) for (let k = 0; k < (FX.weather === 'storm' ? 7 : 4); k++)
      spawn({ x:r()*w*1.3 - w*.15, y:-12, vx:-160, vy:950 + r()*350, max:.8, size:1.1, color:'#d6e6ffb0', type:'streak' });
    if (FX.night && r()<.03) spawn({ x:r()*w, y:h*(.2+r()*.5), vx:(r()-.5)*10, vy:(r()-.5)*10, max:3, size:2, color:'#cfe0ff', type:'glow', wander:true });
  }
  function burst(fx, fy, kind, n=40){
    const {w,h} = FX, r = Math.random, x = fx*w, y = fy*h;
    for (let i=0;i<n;i++){
      const a = r()*Math.PI*2, sp = 80+r()*260;
      if (kind==='confetti') spawn({ x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-200, g:420, drag:.985, max:2.5+r(), size:5+r()*4, type:'rect', vr:(r()-.5)*14, color:['#ffcc33','#e8453c','#3aa0ff','#40c060','#fff'][r()*5|0] });
      else if (kind==='spark') spawn({ x, y, vx:Math.cos(a)*sp*1.4, vy:Math.sin(a)*sp*1.4, drag:.92, max:.5+r()*.4, size:2+r()*2, type:'streak', color:'#fff3b0' });
      else if (kind==='smoke') spawn({ x:x+(r()-.5)*40, y, vx:(r()-.5)*30, vy:-30-r()*50, drag:.99, max:2.5+r()*1.5, size:14+r()*20, type:'smoke', color:'#6b6b78' });
      else if (kind==='gold') spawn({ x, y, vx:Math.cos(a)*sp*.7, vy:Math.sin(a)*sp*.7-60, g:120, drag:.97, max:1.6+r(), size:2+r()*3, type:'glow', color:r()<.5?'#ffe27a':'#fff' });
      else if (kind==='heart') spawn({ x, y, vx:Math.cos(a)*sp*.5, vy:-60-r()*120, g:-20, drag:.97, max:1.8+r(), size:6+r()*5, type:'heart', color:r()<.5?'#ff4f8b':'#ff9ec4' });
      else if (kind==='ember') spawn({ x:x+(r()-.5)*60, y, vx:(r()-.5)*120, vy:-150-r()*260, g:60, drag:.98, max:1.2+r(), size:2+r()*2, type:'glow', color:'#ff9a3d' });
    }
  }
  let lastT = performance.now();
  function tick(t){
    const dt = Math.min(.05, (t-lastT)/1000); lastT = t;
    if (!document.hidden) ambient();
    const c = FX.ctx; c.clearRect(0,0,FX.w,FX.h);
    FX.parts = FX.parts.filter(p => (p.life += dt) < p.max);
    for (const p of FX.parts){
      if (p.wander){ p.vx += (Math.random()-.5)*40*dt; p.vy += (Math.random()-.5)*40*dt; }
      p.vy += p.g*dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx*dt; p.y += p.vy*dt; p.rot += p.vr*dt;
      const k = p.life/p.max, a = k<.15 ? k/.15 : 1-(k-.15)/.85;
      c.globalAlpha = Math.max(0,a);
      if (p.type==='glow'){ const s = p.size*(p.wander ? 1+.5*Math.sin(p.life*6) : 1);
        c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = s*5; c.beginPath(); c.arc(p.x,p.y,s,0,7); c.fill(); c.shadowBlur = 0; }
      else if (p.type==='streak'){ c.strokeStyle = p.color; c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.x-p.vx*.04,p.y-p.vy*.04); c.stroke(); }
      else if (p.type==='rect'){ c.save(); c.translate(p.x,p.y); c.rotate(p.rot); c.fillStyle = p.color; c.fillRect(-p.size/2,-p.size/4,p.size,p.size/2); c.restore(); }
      else if (p.type==='heart'){ c.fillStyle = p.color; c.font = `${p.size*2.4}px serif`; c.textAlign='center'; c.fillText('♥', p.x, p.y); }
      else if (p.type==='smoke'){ c.globalAlpha = Math.max(0,a)*.45; c.fillStyle = p.color; c.beginPath(); c.arc(p.x,p.y,p.size*(1+k),0,7); c.fill(); }
      else { c.fillStyle = p.color; c.beginPath(); c.arc(p.x,p.y,p.size,0,7); c.fill(); }
    }
    c.globalAlpha = 1;
    if (!host.isConnected) return destroy();   // the page replaced us: stop, don't leak
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // static noise for camera cuts
  function staticFlash(){
    const cv = $('static'), w = cv.width = 320, h = cv.height = 180, c = cv.getContext('2d'), img = c.createImageData(w,h);
    for (let i=0;i<img.data.length;i+=4){ const v = Math.random()*255; img.data[i]=img.data[i+1]=img.data[i+2]=v; img.data[i+3]=255; }
    c.putImageData(img,0,0); retrigger(cv,'on'); sfx.noise(.18,.12);
  }

  // ════════════ SOUND (WebAudio, synthesised) ════════════
  const sfx = {
    ctx:null,
    on(){ if (!this.ctx) try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} },
    tone(f, dur=.05, type='square', vol=.04, slide=0){
      if (!S.sound || !this.ctx) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f,t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
      g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t+dur+.02);
    },
    noise(dur=.3, vol=.08, from=2000, to=200){
      if (!S.sound || !this.ctx) return; const t = this.ctx.currentTime, n = this.ctx.sampleRate*dur, b = this.ctx.createBuffer(1,n,this.ctx.sampleRate), d = b.getChannelData(0);
      for (let i=0;i<n;i++) d[i] = Math.random()*2-1;
      const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = b; f.type='bandpass'; f.frequency.setValueAtTime(from,t); f.frequency.exponentialRampToValueAtTime(to,t+dur);
      g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(f).connect(g).connect(this.ctx.destination); s.start(t);
    },
    whoosh(){ this.noise(.5,.12,300,3000); },
    thump(){ this.tone(70,.35,'sine',.25,-30); },
    chime(){ [660,880,1320].forEach((f,i)=>setTimeout(()=>this.tone(f,.25,'triangle',.06),i*90)); },
    sting(){ [392,311,233,156].forEach((f,i)=>setTimeout(()=>this.tone(f,.4,'sawtooth',.05),i*160)); },
    hit(){ this.tone(140,.2,'square',.08,-90); this.noise(.15,.1,800,100); },
  };
  const voicePitch = n => 180 + ([...n].reduce((a,c)=>a+c.charCodeAt(0),0) % 9) * 38;

  // ════════════════════════════════════════════════════════════════
  //  ENGINE 2 — beats, typewriter, confessional, votes, controls
  // ════════════════════════════════════════════════════════════════
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const PAUSE = /^\[(\.\.\.|…|beat|pause|silence)\]$/i;

  // "[leaning in] Okay. [He stops.] Fine." → leading cues become chips, later ones
  // italic action typed in place, pause cues become an ellipsis with a held beat.
  function segments(text){
    const segs = []; let lead = true;
    text.split(/(\[[^\]]*\])/).forEach(t => {
      if (!t.trim()) return;
      if (t.startsWith('[')){
        if (PAUSE.test(t)) segs.push({ k:'txt', v:'… ' });
        else segs.push({ k: lead ? 'chip' : 'act', v: t.slice(1, -1).trim() });
      } else { segs.push({ k:'txt', v:t }); lead = false; }
    });
    return segs;
  }
  function typeInto(el, text, { speaker, mood, instant, narr }){
    clearInterval(S.typing?.iv);
    el.className = 'txt' + (mood==='shout' ? ' shout' : mood==='whisper' ? ' whisper' : '') + (narr ? ' narr' : '');
    const segs = segments(text);
    const done = () => segs.map(s => s.k==='chip' ? `<span class="cue">${esc(s.v)}</span>` : s.k==='act' ? `<span class="act">${esc(s.v)}</span> ` : esc(s.v)).join('');
    const finish = () => {
      clearInterval(S.typing?.iv); el.innerHTML = done(); S.typing = null;
      $('dbox').classList.add('done'); $('dbox').classList.remove('talking'); $('conf').classList.remove('talking');
      speaker && actorEl(speaker)?.classList.remove('talk'); scheduleAuto(stripCues(text));
    };
    $('dbox').classList.remove('done');
    // fast-forward shows each line whole: a typewriter cannot tick faster than the browser's timer floor
    if (instant || S.ff) return finish();
    el.innerHTML = '';
    const q = [];   // queue of [char|html]
    segs.forEach(s => {
      if (s.k==='chip') q.push({ html:`<span class="cue">${esc(s.v)}</span>` });
      else if (s.k==='act') q.push({ html:`<span class="act">${esc(s.v)}</span> `, hold:260 });
      else [...s.v].forEach(ch => q.push({ ch }));
    });
    let i = 0, hold = 0;
    const base = (narr ? 20 : mood==='shout' ? 16 : mood==='whisper' ? 36 : 25) / (S.speed * (S.ff ? 5 : 1)), pitch = speaker ? voicePitch(speaker) : 300;
    const iv = setInterval(() => {
      if (hold > 0){ hold -= base; return; }
      if (i >= q.length) return finish();
      const t = q[i++];
      if (t.html){ el.insertAdjacentHTML('beforeend', t.html); hold = t.hold || 0; return; }
      const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = t.ch; el.appendChild(sp);
      if (/[.!?]/.test(t.ch)) hold = 170; else if (t.ch===',') hold = 80; else if (t.ch==='…') hold = 420;
      if (!narr && i % 2 && /\w/.test(t.ch)) sfx.tone(pitch*(mood==='shout'?1.25:1)*(.94+Math.random()*.12), .04, mood==='whisper'?'sine':'square', mood==='whisper'?.015:mood==='shout'?.05:.03);
    }, base);
    S.typing = { iv, finish };
  }
  function scheduleAuto(text=''){
    clearTimeout(S.timer);
    if (S.ff) S.timer = setTimeout(() => next(), 320);          // holding fast-forward: a beat every third of a second
    else if (S.auto) S.timer = setTimeout(() => next(), 900 + text.length*28/S.speed);
  }

  function setDbox(speaker){
    const d = $('dbox'), c = CAST[speaker] || { c:'#ccc', img:'' };
    d.classList.remove('narr');
    d.style.setProperty('--c', c.c);
    const face = $('face');
    if (d.dataset.who !== speaker){ face.querySelector('img').src = c.img; retrigger(face,'swap'); d.dataset.who = speaker; }
    $('who').textContent = speaker.toUpperCase();
    d.classList.add('show','talking');
  }
  function setNarr(){
    const d = $('dbox'); d.classList.add('show','narr'); d.classList.remove('talking');
    d.style.setProperty('--c', '#9fb3ff'); d.dataset.who = '';
    const sc = P.scenes[S.scene]; $('who').textContent = sc ? (S.view.set !== sc.set ? SETS[S.view.set].label : sc.place).toUpperCase() : '';
  }
  function hideDbox(){ $('dbox').classList.remove('show','talking'); }

  // ── confessional / host-to-camera cut ──
  function enterConf(who, kind='conf'){
    const key = kind + ':' + who;
    if (S.conf === key) return;
    staticFlash();
    const cf = $('conf'), c = CAST[who];
    cf.style.setProperty('--c', c.c);
    cf.classList.toggle('hostcam', kind==='host');
    $('confBg').innerHTML = $('lSky').innerHTML + $('lMid').innerHTML;
    [...$('confBg').children].forEach(s => s.setAttribute('style','position:absolute;inset:0;width:100%;height:100%'));
    $('bokeh').innerHTML = [...Array(14)].map(() => { const s = 3+Math.random()*9; return `<i style="left:${Math.random()*100}%;top:${Math.random()*80}%;width:${s}cqw;height:${s}cqw;animation-delay:${-Math.random()*6}s"></i>`; }).join('');
    const subj = $('confSubject'); subj.querySelector('img').src = c.img; subj.style.animation = 'none'; void subj.offsetWidth; subj.style.animation = '';
    // Like the real thing: NAME, then "30 · Publicist", then the tribe tag.
    if (kind === 'host') $('confLower').innerHTML = `<div class="n">${esc(who.toUpperCase())}</div><div class="t">YOUR HOST</div>`;
    else {
      const pr = PROFILES[who] || {}, age = ageOf(pr);
      const detail = [age, pr.occupation].filter(v => v != null && v !== '').map(v => esc(String(v))).join(' · ');
      const tribe = c.tribe, coach = roleOf(P.scenes[S.scene] || { roles:{} }, who) === 'coach';
      const tag = tribe ? `${coach ? 'COACH · ' : ''}${esc(tribe.toUpperCase())} ${esc(SH.group.toUpperCase())}` : coach ? 'COACH' : '';
      $('confLower').innerHTML = `<div class="n">${esc(who.toUpperCase())}</div>`
        + (detail ? `<div class="d">${detail}</div>` : '')
        + (tag ? `<div class="t tribe" style="--t:${tribeColor(tribe)}">${tag}</div>` : '');
    }
    cf.classList.add('show'); stage.classList.add('cine');
    S.conf = key; S.tcStart = performance.now();
    amb.apply();   // the confessional room is quiet
  }
  function exitConf(){
    if (!S.conf) return; staticFlash();
    $('conf').classList.remove('show'); stage.classList.remove('cine'); S.conf = null;
    amb.apply();
  }
  timers.push(setInterval(() => { if (!S.conf) return; const s = (performance.now()-S.tcStart)/1000, f = n => String(n|0).padStart(2,'0');
    $('tc').textContent = `${f(s/60)}:${f(s%60)}:${f((s*24)%24)}`; }, 42));

  // ── scene change: iris wipe + location banner ──
  async function sceneTransition(si, animate=true){
    exitConf(); hideDbox(); $('vote').innerHTML = '';
    const sc = P.scenes[si], prev = P.scenes[S.scene];
    // another spot at the same place is a whip-pan, not a full iris wipe
    const near = animate && prev && prev.place === sc.place;
    if (near){ retrigger($('world'),'whip'); sfx.whoosh(); await wait(200); }
    else if (animate){ $('iris').classList.remove('open'); sfx.whoosh(); await wait(560); }
    renderScene(si);
    if (animate){
      if (!near){ await wait(80); $('iris').classList.add('open'); }
      const timeLine = [TIMES[sc.time].label, sc.staging].filter(Boolean).join(' · ').slice(0, 110);
      if (sc.phase){ showBanner(`PHASE ${sc.phase.n}`, (sc.phase.title || sc.sub || sc.place).toUpperCase(), sc.sub || ''); sfx.thump(); setTimeout(() => sfx.chime(), 200); retrigger(stage,'hit'); }
      else showBanner(`${sc.place.toUpperCase()} · SCENE ${si+1}`, (sc.sub || sc.place).toUpperCase(), timeLine);
      camera(4, 0, 1.08); await wait(60); camera(0, 0, 1);
    }
  }
  function showBanner(kick, place, time){
    $('bKick').textContent = kick; $('bPlace').textContent = place; $('bTime').textContent = time || '';
    stage.classList.add('cine'); retrigger($('banner'),'show');
    clearTimeout(S.cineT); S.cineT = setTimeout(() => { if (!S.conf) stage.classList.remove('cine'); }, 2500);
  }
  // a move inside the scene: whip-pan to the new place, same people
  async function stageCut(b, animate){
    const sc = P.scenes[b.scene];
    exitConf(); hideDbox();
    if (animate){ retrigger($('world'),'whip'); sfx.whoosh(); await wait(230); }
    renderSet(b.set, b.time, sc);
    if (animate) showBanner(sc.place.toUpperCase(), SETS[b.set].label.toUpperCase(), TIMES[b.time].label);
    camera(0, 0, 1); spotlight([]);
    scheduleAuto('xxxxxxxxxxxxxxxxxxxx');
  }
  function stageCard(b, animate){
    exitConf(); hideDbox(); camera(0, 0, 1); spotlight([]);
    if (animate){ showBanner(b.kick, b.title.toUpperCase(), ''); sfx.thump(); setTimeout(() => sfx.chime(), 200); retrigger(stage,'hit'); }
    scheduleAuto('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  }
  function stageEnd(){
    exitConf(); hideDbox(); clearProgress(); $('tResume').innerHTML = '';
    S.auto = false; $('bAuto').classList.remove('on'); setFF(false);
    showResults();   // the game's round-end screen, not a blank card
  }


  // ── one line of dialogue ──
  function stageLine(b, instant){
    const sc = P.scenes[b.scene], present = sc.present;
    R.querySelectorAll('.actor').forEach(a => a.classList.remove('lit','next','talk'));
    if (b.host) enterConf(b.speaker, 'host'); else if (b.conf) enterConf(b.speaker, 'conf'); else exitConf();
    setDbox(b.speaker);
    boothFocus(b.speaker);   // at the urn, whoever speaks is the one voting
    $('dbox').classList.toggle('final', !!b.finalWords);
    if (!b.conf && !b.host) introduce(b.speaker, instant);
    if (!b.conf && !b.host){
      const named = present.filter(n => n!==b.speaker && rxName(n).test(b.text) && actorEl(n) && !actorEl(n).classList.contains('offstage'));
      const target = named[0] || (S.lastSpeaker && S.lastSpeaker !== b.speaker ? S.lastSpeaker : null);
      spotlight([b.speaker, target].filter(Boolean));
      const me = actorEl(b.speaker), mx = S.xs[b.speaker];
      R.querySelectorAll('.actor').forEach(a => {
        const n = a.dataset.n, x = S.xs[n];
        a.style.setProperty('--ry', n===b.speaker ? (target && S.xs[target]!=null ? (S.xs[target]>mx?'22deg':'-22deg') : '0deg') : (x<mx?'16deg':'-16deg'));
      });
      if (me){ me.classList.add('lit','talk'); if (!instant) retrigger(me,'jump'); }
      target && actorEl(target)?.classList.add('next');
      focusOn(b.speaker, b.mood==='shout' ? 1.2 : 1.12);
      [...R.querySelectorAll('.roster img')].forEach(i => i.classList.toggle('lit', i.dataset.n===b.speaker));
      if (!instant){
        const em = { shout:'shout', question:'question', hesitate:'hesitate', angry:'angry', laugh:'laugh', whisper:'whisper', sad:'sad', tense:'tense' }[b.mood];
        em && emote(b.speaker, em);
        if (named[0] && b.mood!=='plain') setTimeout(() => emote(named[0],'surprise'), 350);
        // the reaction shot: a pointed line cuts to the face it landed on (not every line — every third at most)
        if (named[0] && S.idx - S.lastReact >= 3 && (b.mood !== 'plain' || /\byou\b/i.test(stripCues(b.text)))){
          S.lastReact = S.idx;
          const rk = { shout:'surprise', angry:'angry', question:'hesitate', laugh:'laugh', whisper:'hesitate', sad:'sad' }[b.mood] || 'surprise';
          setTimeout(() => react(named[0], rk), 700);
        }
        if (b.win) setTimeout(() => b.win.names.forEach((n, k) => setTimeout(() => giveItem(n,'immune', k>0), k*90)), 600);
        if (b.mood==='shout' && S.lastShout !== b.speaker){
          retrigger(stage,'shake'); retrigger(stage,'hit'); sfx.hit();
          $('speed').style.setProperty('--sx', (mx ?? 50)+'%'); retrigger($('speed'),'on');
          burst((mx ?? 50)/100, .5, 'spark', 26);
          R.querySelectorAll('.actor').forEach(a => { if (a.dataset.n!==b.speaker && Math.abs(S.xs[a.dataset.n]-mx) < 20) retrigger(a,'recoil'); });
        }
      }
      S.lastSpeaker = b.speaker;
    } else $('conf').classList.add('talking');
    S.lastShout = b.mood==='shout' ? b.speaker : null;
    if (b.dismiss){ if (instant) bench(b.dismiss, true); else setTimeout(() => bench(b.dismiss), 350); }
    if (b.outMany) b.outMany.forEach((n, k) => instant ? bench(n, true) : setTimeout(() => bench(n), 350 + k * 180));
    if (b.score) updateScore(b.score, instant);
    typeInto($('txt'), b.text, { speaker:b.speaker, mood:b.mood, instant });
  }
  const rxCache = {};
  const rxName = n => rxCache[n] || (rxCache[n] = new RegExp(`\\b${n}\\b`));
  // "BLUE WINS IMMUNITY" → every Blue member standing here; "PRIYA WINS IMMUNITY" → Priya
  function immunityFor(word, sc){
    const w = word.toLowerCase();
    if (Object.values(CAST).some(c => c.tribe === w)) return sc.present.filter(n => CAST[n].tribe === w && roleOf(sc, n) !== 'coach');
    const n = Object.keys(CAST).find(k => k.toLowerCase() === w);
    return n ? [n] : [];
  }

  // ── narration: the stage direction, a page at a time, in the dialogue box ──
  function stageDir(b, instant){
    if (!b.stay) exitConf();
    setNarr();
    if (b.write?.voter) boothFocus(b.write.voter);
    R.querySelectorAll('.actor').forEach(a => a.classList.remove('lit','talk','next'));
    const sc = P.scenes[b.scene], low = b.text.toLowerCase();
    const who = (b.who || []).filter(n => actorEl(n) && !actorEl(n).classList.contains('offstage'));
    spotlight(who);
    who.forEach(n => { const a = actorEl(n); a.classList.add('lit'); if (!instant) retrigger(a,'jump'); });
    if (who.length === 1) focusOn(who[0], 1.08); else camera(0, 0, 1.02);
    if (!instant){
      const x = who.length ? S.xs[who[0]]/100 : .5;
      if (/spark catches|cheers|erupts/.test(low)){ const f = FIRE[S.view.set] || [.5,.75]; burst(f[0], f[1], 'ember', 50); burst(x, .4, 'confetti', 30); sfx.chime(); sc.present.slice(0, 12).forEach((n,i) => setTimeout(() => retrigger(actorEl(n),'jump'), i*60)); }
      if (/crash|wobble|trips|falls|buckles|stumbles/.test(low)){ retrigger(stage,'shake'); sfx.hit(); who[0] && retrigger(actorEl(who[0]),'recoil'); }
      if (/rings? (it|the bell)|pulls it|bell/.test(low)){ sfx.tone(1250,.6,'triangle',.07); setTimeout(() => sfx.tone(1250,.5,'triangle',.05), 180); }
      if (/\bkiss/.test(low) && who.length >= 2){ burst((S.xs[who[0]]+S.xs[who[1]])/200, .45, 'heart', 26); sfx.chime(); who.forEach(n => emote(n,'heart')); }
      if (/laugh|howling|dying|snorts/.test(low)) who.forEach(n => emote(n,'laugh'));
      if (/throws|flicks|clips|dumps|tips/.test(low) && who.length >= 2){ retrigger(actorEl(who[1]),'recoil'); emote(who[1],'angry'); }
      if (/steps out|appears|walks over|comes back|finds/.test(low)) who.forEach(n => emote(n,'surprise'));
      // a face doing something is a reaction shot too
      if (who[0] && S.idx - S.lastReact >= 2 && /\b(eyes (widen|narrow)|jaw (drops|tightens|works)|freezes|stares|gasps|goes (quiet|still|pale|white|scarlet|red)|blinks|face (goes|is doing)|mouth (drops|twitches))\b/.test(low)){
        S.lastReact = S.idx; setTimeout(() => react(who[0], /narrow|tightens|works/.test(low) ? 'angry' : 'surprise'), 400);
      }
    }
    if (b.weather) setWeather(b.weather === 'clear' ? null : b.weather);
    if (b.idol) giveItem(b.idol, 'hasidol', instant);
    if (b.write) showWrite(b.write, instant);
    if (b.snuff) eliminate(b.snuff, instant, true);
    if (b.out) bench(b.out, instant);
    if (b.place) medal(b.place.name, b.place.label, instant);
    typeInto($('txt'), b.text, { narr:true, instant });
  }

  function showWrite(w, instant){
    $('vote').innerHTML = `<div class="paper secret"><div class="lbl">${esc(w.voter ? w.voter.toUpperCase() + ' VOTES' : 'A VOTE')}</div><div class="nm">${esc(w.name)}</div></div>`;
    if (!instant){ sfx.tone(520,.08,'triangle',.04); setTimeout(() => sfx.tone(390,.1,'triangle',.04), 500); }
  }
  function stageVote(b, instant){
    exitConf(); setDbox(b.speaker); camera(0, 0, 1.04); spotlight([b.name]);
    R.querySelectorAll('.actor').forEach(a => a.classList.remove('lit','talk','next'));
    const old = $('vote').querySelector('.paper'); old?.classList.add('out');
    S.tally[b.name] = (S.tally[b.name]||0) + 1;
    const n = Object.values(S.tally).reduce((a,c) => a+c, 0);
    setTimeout(() => {
      $('vote').innerHTML = `<div class="paper"><div class="lbl">VOTE ${n}</div><div class="nm">${esc(b.name)}</div></div>`;
      const a = actorEl(b.name);
      if (a){ a.querySelector('.tally').insertAdjacentHTML('beforeend','<i></i>'); a.classList.add('lit'); if (!instant){ retrigger(a,'recoil'); emote(b.name,'tense'); } }
      updateBoard();
      if (!instant){ cue('vote-tick'); sfx.thump(); setTimeout(() => cue('tension-drum'), 260); }
    }, instant ? 0 : old ? 300 : 0);
    typeInto($('txt'), b.text, { speaker:b.speaker, mood:'tense', instant });
  }
  function eliminate(name, instant, quiet){
    S.gone.add(name);
    const a = actorEl(name); if (!a) return;
    a.classList.add('gone'); a.classList.remove('lit','talk');
    R.querySelector(`.roster img[data-n="${name}"]`)?.classList.add('gone');
    updateBoard();
    if (!instant){ burst(S.xs[name]/100, .5, 'smoke', 30); if (quiet) cue('torch-snuff'); else { retrigger(stage,'shake'); retrigger(stage,'hit'); cue('elimination-gong'); } }
  }
  // out of the challenge (rang the bell, dismissed) — greyed and sat down, not eliminated
  function bench(n, instant){
    if (!n || S.benched.has(n)) return;
    S.benched.add(n);
    const a = actorEl(n); if (!a) return;
    a.classList.add('benched'); a.classList.remove('lit','talk','spot');
    if (S.crowd){ S.cur[n] = S.home[n]; applyPos(); }
    if (!instant){ sfx.tone(1250,.6,'triangle',.07); setTimeout(() => sfx.tone(940,.7,'triangle',.05), 200); burst(S.xs[n]/100, .5, 'smoke', 12); emote(n,'sad'); }
  }
  function stageElim(b, instant){
    $('vote').querySelector('.paper')?.classList.add('out');
    eliminate(b.name, instant); spotlight([b.name]);
    focusOn(b.name, 1.3); scheduleAuto('');
  }
  function stageSpoken(b, instant){
    hideDbox(); camera(0, 0, 1); $('board').classList.remove('show');
    if (!instant){ retrigger($('spoken'),'show'); const f = FIRE[SH.exitSet] || [.5, .8]; burst(f[0], f[1], 'ember', 120); cue('torch-snuff'); stage.classList.add('cine'); }
    scheduleAuto('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  }
  function giveItem(n, cls, quiet){
    (cls==='immune' ? S.immune : S.idols).add(n);
    const a = actorEl(n); if (!a) return;
    a.classList.add(cls);
    if (!quiet){ retrigger(a,'jump'); burst(S.xs[n]/100, .45, 'gold', 60); cue(cls === 'immune' ? 'win-fanfare' : 'idol-sting'); }
  }
  // people not on the [Present:] list walk in at the beat that first names them
  function arrivals(i, animate){
    const sc = P.scenes[P.beats[i].scene];
    for (const [n, at] of Object.entries(sc.late)) if (at <= i){
      const a = actorEl(n); if (!a?.classList.contains('offstage')) continue;
      a.classList.remove('offstage');
      if (animate){ a.style.animationDelay = '0s'; retrigger(a,'enter'); sfx.whoosh(); burst(S.xs[n]/100, .55, 'smoke', 14); }
    }
  }

  async function play(i, animate=true){
    const b = P.beats[i]; if (!b) return;
    S.idx = i; updateTimeline(); logBeat(b);
    if (b.t !== 'end') saveProgress(i);
    if (b.t==='scene'){
      const ch = chapterStarts.get(i);
      // the opening titles run once, after the cold open (or before the first scene);
      // every other chapter boundary is an ad break: "coming up", the break, "welcome back"
      if (animate && !S.openingDone && i === S.openingAt){ S.openingDone = true; await runSequence(openingSteps()); }
      else if (animate && ch && i > 0) await runSequence(bumperSteps(ch));
      if (S.idx !== i || dead) return;   // the viewer jumped away during the sequence
      S.busy = true; await sceneTransition(b.scene, animate); S.busy = false;
      if (animate && i > 0 && ch) chapterCard(ch);   // crossing into a new chapter
      setBed(bedFor(i));
      scheduleAuto('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'); return; }
    if (S.scene !== b.scene) await sceneTransition(b.scene, false);
    arrivals(i, animate);
    if (b.t==='line') stageLine(b, !animate);
    else if (b.t==='dir') stageDir(b, !animate);
    else if (b.t==='vote') stageVote(b, !animate);
    else if (b.t==='elim') stageElim(b, !animate);
    else if (b.t==='spoken') stageSpoken(b, !animate);
    else if (b.t==='cut'){ S.busy = true; await stageCut(b, animate); S.busy = false; }
    else if (b.t==='card') stageCard(b, animate);
    else if (b.t==='end') stageEnd();
    if (animate && b.event) setTimeout(() => toast(b.event), 450);
    setBed(bedFor(i));
  }
  async function next(){
    sfx.on(); audio.unlock();
    if (S.inSeq){ skipSequence(); return; }   // a click skips the titles or the ad break
    if (!S.started){ S.started = true; $('titlecard').classList.add('hide'); sfx.whoosh(); await play(0); return; }
    if (S.busy) return;
    if (S.typing){ S.typing.finish(); return; }
    if (S.idx < P.beats.length-1){ $('titlecard').classList.add('hide'); play(S.idx+1); }
    else { S.auto = false; $('bAuto').classList.remove('on'); }
  }
  // rewind: rebuild the scene as it stood at beat i, with no animation
  async function jump(i){
    audio.unlock(); S.started = true; $('titlecard').classList.add('hide'); $('results').classList.remove('show');
    if (S.inSeq) skipSequence();
    i = Math.max(0, Math.min(P.beats.length-1, i));
    clearTimeout(S.timer); S.typing?.finish?.();
    const si = P.beats[i].scene, before = P.beats.slice(0, i);
    S.gone = new Set(before.filter(b => b.t==='elim' || b.snuff).map(b => b.name || b.snuff));
    S.immune = new Set(); S.idols = new Set();
    before.forEach(b => {
      if (b.win) b.win.names.forEach(n => S.immune.add(n));
      if (b.idol) S.idols.add(b.idol);
    });
    exitConf(); $('vote').innerHTML = ''; S.idx = i; renderScene(si);
    const cut = before.filter(b => b.scene===si && b.t==='cut').pop();
    if (cut) renderSet(cut.set, cut.time, P.scenes[si]);
    R.querySelectorAll('.actor').forEach(a => a.classList.remove('enter'));
    before.forEach(b => { if (b.scene===si && (b.out || b.dismiss)) bench(b.out || b.dismiss, true); });
    before.forEach(b => { if (b.scene===si && b.t==='vote'){ S.tally[b.name] = (S.tally[b.name]||0)+1; actorEl(b.name)?.querySelector('.tally').insertAdjacentHTML('beforeend','<i></i>'); } });
    updateBoard();
    // the competition so far: its running score and who has finished where
    S.score = null; S.places = {};
    before.forEach(b => {
      if (!P.scenes[b.scene].comp){ S.score = null; S.places = {}; return; }
      if (b.score) S.score = { ...(S.score || {}), ...b.score };
      if (b.place) S.places[b.place.name] = b.place.label;
    });
    applyCompState();
    // who has already been introduced, and what the weather has turned to by now
    S.introduced = new Set(before.filter(b => b.t==='line' && !b.conf && !b.host).map(b => b.speaker));
    const wb = before.filter(b => b.scene===si && b.weather).pop();
    setWeather(wb ? (wb.weather === 'clear' ? null : wb.weather) : P.scenes[si].weather);
    S.lastReact = i;
    S.lastSpeaker = before.filter(b => b.t==='line' && !b.conf && !b.host && b.scene===si).pop()?.speaker || null;
    rebuildLog(i);
    await play(i, false);
  }

  // ── timeline + log ──
  function buildTimeline(){
    const tl = $('timeline'), L = P.beats.length;
    tl.querySelectorAll('.mark').forEach(m => m.remove());
    P.beats.forEach((b, i) => {
      if (b.t==='scene') tl.insertAdjacentHTML('beforeend', `<div class="mark${sceneKind(P.scenes[b.scene])==='exit'?' tribal':''}" style="left:${i/L*100}%" title="${esc(P.scenes[b.scene].place)}"></div>`);
      if ((b.conf || b.host) && !(P.beats[i-1]?.conf || P.beats[i-1]?.host)) tl.insertAdjacentHTML('beforeend', `<div class="mark conf" style="left:${i/L*100}%" title="Confessional"></div>`);
    });
    tl.onclick = e => { const r = tl.getBoundingClientRect(); jump(Math.round((e.clientX-r.left)/r.width*(L-1))); };
  }
  function updateTimeline(){ $('tlFill').style.width = (S.idx/Math.max(1, P.beats.length-1)*100)+'%'; updateChapters(); }
  function logHTML(b){
    if (b.t==='scene') return `<div class="ln scene">▸ ${esc(P.scenes[b.scene].header)}</div>`;
    if (b.t==='card') return `<div class="ln scene">▸ ${esc(b.kick)} ${esc(b.title)}</div>`;
    if (b.t==='dir') return `<div class="ln dir">${esc(b.text)}</div>`;
    if (b.t==='line' || b.t==='vote') return `<div class="ln"><b style="color:${CAST[b.speaker]?.c}">${esc(b.speaker)}${b.conf?' (conf)':''}</b>${esc(b.text)}</div>`;
    if (b.t==='elim') return `<div class="ln dir">${esc(b.name)} is out.</div>`;
    return '';
  }
  function logBeat(b){ const l = $('log'); l.insertAdjacentHTML('beforeend', logHTML(b)); l.scrollTop = l.scrollHeight; }
  function rebuildLog(i){ $('log').innerHTML = P.beats.slice(0, i).map(logHTML).join(''); }

  // ── controls ──
  stage.addEventListener('click', next);
  $('bNext').onclick = next;
  $('bPrev').onclick = () => jump(S.idx-1);
  $('bAuto').onclick = () => { S.auto = !S.auto; $('bAuto').classList.toggle('on', S.auto); if (S.auto && !S.typing) next(); };
  $('bSpeed').onclick = () => { S.speed = S.speed===1 ? 2 : S.speed===2 ? .6 : 1; $('bSpeed').textContent = `Text ${S.speed}×`; };
  $('bSound').onclick = () => { S.sound = !S.sound; $('bSound').classList.toggle('on', S.sound); sfx.on(); amb.apply(); };
  // hold to fast-forward (button or Shift); S or the button skips to the next scene
  const ffOn = e => { e.preventDefault(); sfx.on(); audio.unlock(); setFF(true); }, ffOff = () => setFF(false);
  $('bFF').addEventListener('pointerdown', ffOn);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => $('bFF').addEventListener(ev, ffOff));
  $('bSkip').onclick = () => { sfx.on(); audio.unlock(); skipScene(); };
  on(document, 'keyup', e => { if (e.key === 'Shift') setFF(false); });
  on(window, 'blur', () => setFF(false));
  // Music on/off and volume are the simulator's settings (js/audio.js keeps them), not this stage's.
  const syncMusicBtn = () => $('bMusic').classList.toggle('on', audio.isMusicEnabled());
  $('bMusic').onclick = () => { audio.unlock(); audio.setMusicEnabled(!audio.isMusicEnabled()); syncMusicBtn(); syncBed(); };
  $('vol').value = String(Math.round(audio.getVolume() * 100));
  $('vol').oninput = e => audio.setVolume(Number(e.target.value) / 100);
  syncMusicBtn();
  $('bNames').onclick = () => { stage.classList.toggle('showNames'); $('bNames').classList.toggle('on'); };
  $('bLog').onclick = () => { $('log').classList.toggle('open'); $('bLog').classList.toggle('on'); };
  on(document, 'keydown', e => {
    // only while the stage is on screen, and never while the viewer is typing somewhere
    if (!visible || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.composedPath()[0] || e.target).tagName;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target.isContentEditable) return;
    if (e.key===' ' || e.key==='ArrowRight' || e.key==='Enter'){ e.preventDefault(); next(); }
    else if (e.key==='ArrowLeft'){ e.preventDefault(); jump(S.idx-1); }
    else if (e.key.toLowerCase()==='a') $('bAuto').click();
    else if (e.key.toLowerCase()==='l') $('bLog').click();
    else if (e.key.toLowerCase()==='c') $('bChapters').click();
  else if (e.key.toLowerCase()==='m') $('bMusic').click();
    else if (e.key === 'Shift' && !e.repeat && S.started){ sfx.on(); setFF(true); }
    else if (e.key.toLowerCase()==='s') $('bSkip').click();
  });

  // ════════════════════════════════════════════════════════════════
  //  ENGINE 3 — the TV layer: titles, ad breaks, reaction shots, pop-ups,
  //  name captions, the vote board, weather, room sound, fast-forward and
  //  the results screen. Show-blind: every word is the profile's (SH) or
  //  the transcript's.
  // ════════════════════════════════════════════════════════════════
  const showTitle = () => P.show || opts.showName || SH.name;
  const portrait = n => CAST[n]?.img ? `<img src="${CAST[n].img}" alt="">` : `<b class="initial">${esc((n || '?')[0])}</b>`;
  function whoLine(n){
    const c = CAST[n] || {}, pr = PROFILES[n] || {}, age = ageOf(pr);
    if (c.host) return { detail: '', tag: 'HOST', color: '#ffcc33' };
    const coach = roleOf(P.scenes[S.scene] || { roles:{} }, n) === 'coach';
    return {
      detail: [age, pr.occupation].filter(v => v != null && v !== '').join(' · '),
      tag: c.tribe ? `${coach ? 'COACH · ' : ''}${c.tribe.toUpperCase()} ${SH.group.toUpperCase()}` : coach ? 'COACH' : '',
      color: c.tribe ? tribeColor(c.tribe) : '#fff',
    };
  }

  // ── full-screen sequences (titles, ad breaks): each step skippable with a click ──
  let seqDone = null;
  function tvStep(html, ms, cls){
    return new Promise(res => {
      const el = $('tv'); el.className = `tv show ${cls || ''}`; el.innerHTML = html;
      const t = setTimeout(end, S.ff ? Math.min(ms, 300) : ms);
      function end(){ clearTimeout(t); seqDone = null; res(); }
      seqDone = end;
    });
  }
  async function runSequence(steps){
    S.busy = true; S.inSeq = true; S.skipSeq = false;
    for (const st of steps){
      if (S.skipSeq || dead) break;
      st.fx && st.fx();
      await tvStep(st.html, st.ms, st.cls);
    }
    $('tv').className = 'tv'; $('tv').innerHTML = '';
    S.inSeq = false; S.busy = false;
  }
  function skipSequence(){ S.skipSeq = true; seqDone && seqDone(); }

  // The opening titles: the show's name, the cast by team, the episode.
  function openingSteps(){
    const seen = n => P.scenes.some(sc => sc.present.includes(n)) || P.beats.some(b => b.speaker === n);
    // by team, and anyone without a team on file last
    const teamKey = n => CAST[n].tribe ? '0' + CAST[n].tribe : '1';
    const cast = Object.keys(CAST).filter(n => !CAST[n].host && seen(n))
      .sort((a, b) => teamKey(a) < teamKey(b) ? -1 : teamKey(a) > teamKey(b) ? 1 : 0);
    const hosts = Object.keys(CAST).filter(n => CAST[n].host && seen(n));
    const [main, sub] = showTitle().split(/:\s*/);
    const cards = cast.map((n, i) => `<div class="op-card" style="--c:${CAST[n].c};--t:${CAST[n].tribe ? tribeColor(CAST[n].tribe) : '#fff'};--d:${(i * .06).toFixed(2)}s">${portrait(n)}<span>${esc(n.toUpperCase())}</span></div>`).join('');
    return [
      { html: `<div class="op-logo"><b>${esc(main.toUpperCase())}</b>${sub ? `<span>${esc(sub.toUpperCase())}</span>` : ''}</div>`, ms: 2000, cls: 'op',
        fx: () => { setBed(SH.beds.titles); retrigger(stage, 'hit'); sfx.whoosh(); } },
      { html: `<div class="op-grid">${cards}</div>${hosts.length ? `<div class="op-hosts">HOSTED BY ${hosts.map(h => esc(h.toUpperCase())).join(' &amp; ')}</div>` : ''}`,
        ms: Math.min(4400, 1800 + cast.length * 110), cls: 'op' },
      { html: `<div class="op-ep">${P.ep ? `<small>EPISODE ${esc(P.ep)}</small>` : ''}<b>${esc((P.title || '').toUpperCase())}</b></div>`, ms: 1900, cls: 'op',
        fx: () => cue('win-fanfare') },
    ];
  }
  // The ad break between chapters: a line from what's coming, the break, the welcome back.
  function bumperSteps(ch){
    const t = pickTeaser(P, ch), steps = [];
    if (t) steps.push({ html: `<div class="cu"><div class="cu-k">COMING UP</div><div class="cu-q" style="--c:${CAST[t.speaker].c}"><div class="cu-f">${portrait(t.speaker)}</div><div><b>${esc(t.speaker.toUpperCase())}</b><p>“${esc(stripCues(t.text))}”</p></div></div></div>`,
      ms: 3000, cls: 'cu-on', fx: () => sfx.whoosh() });
    steps.push({ html: `<div class="ad"><b>${esc(showTitle().split(/:\s*/)[0].toUpperCase())}</b><span>WE'LL BE RIGHT BACK</span></div>`, ms: 1500, cls: 'ad-on',
      fx: () => { if (bedOwner === api) audio.ambient(null); cue('reveal-whoosh'); } });
    steps.push({ html: `<div class="wb"><span>WELCOME BACK</span></div>`, ms: 1100, cls: 'wb-on', fx: () => sfx.whoosh() });
    return steps;
  }

  // ── reaction shot: cut to the face of whoever a line just landed on ──
  function react(n, kind){
    if (!n || !CAST[n] || S.ff) return;
    const el = $('react');
    el.style.setProperty('--c', CAST[n].c);
    el.innerHTML = `<div class="rf">${portrait(n)}</div><div class="rn">${esc(n.toUpperCase())}</div><div class="re">${EMOTES[kind] || EMOTES.surprise}</div>`;
    retrigger(el, 'show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 1900);
    sfx.tone(880, .05, 'triangle', .03);
  }

  // ── pop-ups for the moments an audience would clip ──
  const TOAST_ICONS = {
    kiss: EMOTES.heart,
    deal: `<svg viewBox="-50 -50 100 100"><circle cx="-13" r="22" fill="#7dff8a" stroke="#111" stroke-width="5"/><circle cx="13" r="22" fill="#ffcc33" stroke="#111" stroke-width="5" fill-opacity=".92"/></svg>`,
    lie: `<svg viewBox="-50 -50 100 100"><path d="M-40 -14 Q 0 -34 40 -14 Q 34 24 0 30 Q -34 24 -40 -14Z" fill="#c084fc" stroke="#111" stroke-width="5"/><ellipse cx="-15" cy="-4" rx="8" ry="5" fill="#111"/><ellipse cx="15" cy="-4" rx="8" ry="5" fill="#111"/></svg>`,
    blindside: `<svg viewBox="-50 -50 100 100"><path d="M8 -46 L-26 6 L-2 6 L-12 46 L28 -10 L4 -10Z" fill="#ffe14d" stroke="#111" stroke-width="5" stroke-linejoin="round"/></svg>`,
    find: EMOTES.star, win: EMOTES.star,
  };
  function toast(ev){
    if (!ev || S.ff) return;
    const el = document.createElement('div'); el.className = `toast k-${ev.kind}`;
    const names = ev.names || [];
    el.innerHTML = `<div class="ti">${TOAST_ICONS[ev.kind] || EMOTES.star}</div><div class="tt"><b>${esc(ev.label)}</b>`
      + `<div class="tn">${names.slice(0, 4).map(n => `<span class="tp" style="--c:${CAST[n]?.c || '#fff'}">${portrait(n)}</span>`).join('')}<small>${esc(ev.team ? '' : names.join(' + '))}</small></div></div>`;
    $('toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 3300);
    if (ev.kind === 'blindside') cue('tension-drum');
    else if (ev.kind === 'lie' || ev.kind === 'deal') cue('reveal-whoosh');
    else if (ev.kind === 'kiss') sfx.chime();
  }

  // ── a name caption the first time somebody speaks this episode ──
  function introduce(n, instant){
    if (!n || S.introduced.has(n)) return;
    S.introduced.add(n);
    if (instant || S.ff) return;
    const w = whoLine(n), el = $('intro');
    el.style.setProperty('--c', CAST[n].c); el.style.setProperty('--t', w.color);
    el.innerHTML = `<b>${esc(n.toUpperCase())}</b>${w.detail ? `<span class="d">${esc(w.detail)}</span>` : ''}${w.tag ? `<span class="g">${esc(w.tag)}</span>` : ''}`;
    retrigger(el, 'show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2700);
  }

  // ── the vote board, while the votes are read ──
  function updateBoard(){
    const rows = Object.entries(S.tally).sort((a, b) => b[1] - a[1]);
    const el = $('board');
    if (!rows.length){ el.classList.remove('show'); return; }
    const top = rows[0][1];
    el.innerHTML = `<div class="bh">THE VOTES</div>` + rows.map(([n, c]) =>
      `<div class="br${c === top ? ' lead' : ''}${S.gone.has(n) ? ' out' : ''}" style="--c:${CAST[n]?.c || '#fff'}"><span class="bp">${portrait(n)}</span><b>${esc(n)}</b><i>${'<u></u>'.repeat(c)}</i><em>${c}</em></div>`).join('');
    el.classList.add('show');
  }

  // ── the competition's scoreboard and finishing order ──
  // A score the host says out loud ("Bass 2, Gophers 1") stays up for the whole
  // competition; a finish ("crosses the finish line first") hangs a medal on the standee.
  function updateScore(score, instant){
    const prev = S.score || {};
    S.score = { ...prev, ...score };
    const el = $('score');
    el.innerHTML = Object.entries(S.score).map(([t, n]) => {
      const c = tribeColor(t.toLowerCase().split(' ').pop()), bump = !instant && prev[t] !== n;
      return `<div class="sc${bump ? ' bump' : ''}" style="--t:${c}"><b>${esc(t.toUpperCase())}</b><i>${n}</i></div>`;
    }).join('');
    el.classList.add('show');
    if (!instant){ sfx.chime(); retrigger(el, 'pop'); }
  }
  function medal(n, label, instant){
    S.places[n] = label;
    const a = actorEl(n); if (!a) return;
    const m = a.querySelector('.medal'); m.textContent = label; a.classList.add('placed');
    if (!instant){ retrigger(m, 'pop'); burst(S.xs[n]/100, .4, 'gold', 40); sfx.chime(); emote(n, label === 'LAST' ? 'sad' : 'star'); }
  }

  // ── weather: rain and storms from the prose, drawn and heard ──
  function setWeather(w){
    S.weather = w || null;
    stage.classList.toggle('rain', !!S.weather);
    stage.classList.toggle('storm', S.weather === 'storm');
    FX.weather = S.weather;
    amb.apply();
  }
  timers.push(setInterval(() => {
    if (S.weather !== 'storm' || !visible || dead || Math.random() > .16) return;
    retrigger($('flash'), 'on');
    if (S.sound && sfx.ctx) setTimeout(() => sfx.noise(1.8, .2, 260, 50), 250 + Math.random() * 900);
  }, 1000));

  // ── room sound: the set's own ambience (waves, fire, birds, wind), crickets at night, rain ──
  function noiseSrc(ctx){
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true; return s;
  }
  function noiseBed(ctx, dest, { type = 'lowpass', f = 800, q = .7, g = .03, lfo = 0, depth = .6 }){
    const s = noiseSrc(ctx), fl = ctx.createBiquadFilter(), gn = ctx.createGain();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q; gn.gain.value = g;
    s.connect(fl).connect(gn).connect(dest); s.start();
    let o = null;
    if (lfo){ o = ctx.createOscillator(); const og = ctx.createGain(); o.frequency.value = lfo; og.gain.value = g * depth; o.connect(og).connect(gn.gain); o.start(); }
    return { stop(){ try { s.stop(); o && o.stop(); } catch(e){} } };
  }
  function ticker(fn, min, max){
    let t, alive = true;
    const loop = () => { if (!alive) return; try { fn(); } catch(e){} t = setTimeout(loop, min + Math.random() * (max - min)); };
    t = setTimeout(loop, min);
    return { stop(){ alive = false; clearTimeout(t); } };
  }
  const AMB = {
    waves: (ctx, d) => noiseBed(ctx, d, { f: 480, g: .035, lfo: .09, depth: .8 }),
    wind:  (ctx, d) => noiseBed(ctx, d, { type: 'bandpass', f: 420, q: .6, g: .03, lfo: .13, depth: .7 }),
    rain:  (ctx, d) => noiseBed(ctx, d, { type: 'highpass', f: 1300, g: .045 }),
    hum:   (ctx, d) => noiseBed(ctx, d, { f: 140, g: .02 }),
    fire:  (ctx, d) => {
      const low = noiseBed(ctx, d, { f: 170, g: .02 });
      const crack = ticker(() => {
        const t = ctx.currentTime, s = noiseSrc(ctx), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'highpass'; f.frequency.value = 2400;
        g.gain.setValueAtTime(.05 * Math.random() + .01, t); g.gain.exponentialRampToValueAtTime(.0001, t + .04);
        s.connect(f).connect(g).connect(d); s.start(t); s.stop(t + .05);
      }, 60, 280);
      return { stop(){ low.stop(); crack.stop(); } };
    },
    crickets: (ctx, d) => ticker(() => {
      const t0 = ctx.currentTime;
      for (let k = 0; k < 3; k++){
        const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + k * .07;
        o.frequency.value = 4300 + Math.random() * 200;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.006, t + .01); g.gain.linearRampToValueAtTime(0, t + .05);
        o.connect(g).connect(d); o.start(t); o.stop(t + .06);
      }
    }, 500, 1300),
    birds: (ctx, d) => ticker(() => {
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f0 = 2200 + Math.random() * 1800;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + .08); o.frequency.exponentialRampToValueAtTime(f0 * .9, t + .16);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.008, t + .02); g.gain.linearRampToValueAtTime(0, t + .18);
      o.connect(g).connect(d); o.start(t); o.stop(t + .2);
    }, 1400, 4200),
  };
  const amb = {
    parts: [], key: '',
    stop(){ this.parts.forEach(p => p.stop()); this.parts = []; this.key = ''; },
    apply(){
      if (dead) return;
      const ctx = sfx.ctx, set = SETS[S.view.set] || {};
      let kinds = S.started && visible && S.sound && !S.conf && !S.inSeq ? [...(set.amb || [])] : [];
      if (kinds.length && FX.night) kinds = kinds.map(k => k === 'birds' ? 'crickets' : k).concat(set.indoor ? [] : ['crickets']);
      if (kinds.length && S.weather && !set.indoor) kinds.push('rain');
      kinds = [...new Set(kinds)];
      const key = kinds.join(',');
      if (key === this.key) return;
      this.stop(); this.key = key;
      if (!ctx || !kinds.length) return;
      const out = ctx.createGain(), t = ctx.currentTime;
      out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(1, t + 1.2); out.connect(ctx.destination);
      this.parts.push({ stop(){ try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + .5); setTimeout(() => out.disconnect(), 600); } catch(e){} } });
      kinds.forEach(k => AMB[k] && this.parts.push(AMB[k](ctx, out)));
    },
  };
  disposers.push(() => amb.stop());

  // ── hold to fast-forward, skip a scene ──
  function setFF(on){
    if (S.ff === on) return;
    S.ff = on; $('bFF').classList.toggle('on', on); stage.classList.toggle('ff', on);
    if (!on) return;
    if (S.inSeq) skipSequence();
    if (S.typing) S.typing.finish(); else if (!S.busy) next();
  }
  async function skipScene(){
    const nx = P.beats.findIndex((b, k) => k > S.idx && b.t === 'scene');
    if (nx < 0) return;
    if (S.inSeq) skipSequence();
    await jump(nx - 1);
    play(nx);
  }

  // ── the results screen: how the episode ended, who it was about ──
  function showResults(){
    const sm = episodeSummary(P);
    const maxS = sm.screen[0]?.[1] || 1;
    const exits = sm.exits.map(x => {
      const votes = Object.entries(x.tally).sort((a, b) => b[1] - a[1]).map(([n, c]) => `<span>${esc(n)} <b>${c}</b></span>`).join('');
      return `<div class="rx" style="--c:${CAST[x.name]?.c || '#fff'}"><div class="rxf">${portrait(x.name)}</div><div><small>${esc(SH.exitWord.toUpperCase())}</small><b>${esc(x.name.toUpperCase())}</b>`
        + (votes ? `<div class="rv">${votes}</div>` : '')
        + (sm.finalWords ? `<p class="fw">“${esc(sm.finalWords.length > 150 ? sm.finalWords.slice(0, 147) + '…' : sm.finalWords)}”</p>` : '') + `</div></div>`;
    }).join('');
    const wins = sm.wins.map(w => `<div class="rw"><small>${esc(SH.compPrize)}</small><b>${esc((w.team ? `${w.team} ${SH.group}` : w.names.join(' & ')).toUpperCase())}</b>`
      + `<div class="rwp">${w.names.slice(0, 9).map(n => `<span style="--c:${CAST[n]?.c}">${portrait(n)}</span>`).join('')}</div></div>`).join('');
    const bars = sm.screen.slice(0, 8).map(([n, v], k) => `<div class="rs" style="--c:${CAST[n].c};--w:${Math.max(4, Math.round(v / maxS * 100))}%;--d:${(k * .07).toFixed(2)}s">`
      + `<span class="rsp">${portrait(n)}</span><b>${esc(n)}</b><i><u></u></i>${sm.confs[n] ? `<em>${sm.confs[n]} CONF</em>` : '<em></em>'}</div>`).join('');
    const moments = sm.moments.map(m => `<span class="rm k-${m.kind}">${esc(m.label)}${m.names?.length && !m.team ? ` · ${esc(m.names.join(' + '))}` : ''}</span>`).join('');
    const quote = sm.quote ? `<div class="rq" style="--c:${CAST[sm.quote.speaker].c}"><div class="rqf">${portrait(sm.quote.speaker)}</div><div><small>LINE OF THE NIGHT</small>`
      + `<p>“${esc(sm.quote.text)}”</p><b>— ${esc(sm.quote.speaker)}${sm.quote.conf ? ', in confessional' : ''}</b></div></div>` : '';
    $('results').innerHTML = `<div class="rh"><small>${esc([showTitle(), P.ep && 'EPISODE ' + P.ep].filter(Boolean).join(' · ').toUpperCase())}</small>`
      + `<b>${esc((P.title || 'Episode').toUpperCase())}</b><span>THAT'S THE EPISODE</span></div>`
      + `<div class="rgrid"><div class="rcol">${exits}${wins}${quote}</div><div class="rcol"><div class="rbox"><small>SCREEN TIME</small>${bars}</div>`
      + (moments ? `<div class="rbox"><small>HIGHLIGHTS</small><div class="rms">${moments}</div></div>` : '') + `</div></div>`
      + `<div class="rbtns"><button class="tbtn" id="bAgain">↺ Watch again</button><button class="tbtn ghost" id="bResCh">Chapters</button></div>`;
    $('results').classList.add('show'); $('results').scrollTop = 0;
    cue('win-fanfare');
    $('bAgain').onclick = e => { e.stopPropagation(); $('results').classList.remove('show'); S.openingDone = false; jump(0); };
    $('bResCh').onclick = e => { e.stopPropagation(); $('bChapters').click(); };
  }

  // ── run time + chapters ──
  const RT = estimateRuntime(P);
  const CH = buildChapters(P, RT);
  const chapterStarts = new Map(CH.map(c => [c.start, c]));
  // where this viewer stopped, per transcript — a convenience, so it lives in this browser only
  const PROGRESS = `episodeStage.progress.${hashStr(text)}.${text.length}`;
  const saveProgress = i => { try { localStorage.setItem(PROGRESS, String(i)); } catch(e){} };
  const loadProgress = () => { try { return +localStorage.getItem(PROGRESS) || 0; } catch(e){ return 0; } };
  const clearProgress = () => { try { localStorage.removeItem(PROGRESS); } catch(e){} };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  function buildChapterStrip(){
    $('chapters').innerHTML = CH.map(c => `<button class="chseg" data-c="${c.n}" style="flex:${c.end - c.start + 1}" title="Chapter ${c.n}: ${esc(c.title)} · ${plural(c.scenes.length, 'scene')} · about ${fmtMin(c.ms)}"><span>${c.n}. ${esc(c.title)}</span></button>`).join('');
    $('chList').innerHTML = CH.map(c => `<button class="chrow" data-c="${c.n}"><b>${c.n}</b><span class="t">${esc(c.title)}</span><span class="m">${plural(c.scenes.length, 'scene')} · ${fmtMin(c.ms)}</span><i></i></button>`).join('');
    R.querySelectorAll('.chseg,.chrow').forEach(b => b.onclick = e => { e.stopPropagation(); goChapter(CH[b.dataset.c - 1]); });
    $('rt').classList.toggle('warn', RT.long);
    $('rt').title = RT.long
      ? `Long episode: about ${fmtMin(RT.ms)} and ${RT.words.toLocaleString()} words. The target is ${RUNTIME_TARGET.min}–${RUNTIME_TARGET.max} minutes, about 3,500–4,700 words.`
      : `About ${RT.words.toLocaleString()} words.`;
  }
  function updateChapters(){
    const cur = chapterAt(CH, Math.max(0, S.idx));
    R.querySelectorAll('.chseg,.chrow').forEach(b => { const c = CH[b.dataset.c - 1]; b.classList.toggle('cur', c === cur); b.classList.toggle('done', S.idx > c.end); });
    const left = RT.perBeat.slice(Math.max(0, S.idx + 1)).reduce((a, b) => a + b, 0);
    $('rt').textContent = `≈ ${fmtMin(RT.ms)} · ${RT.clicks} clicks` + (S.idx > 0 ? ` · ${fmtMin(left)} left` : '') + (RT.long ? ' · long' : '');
    $('chNow').textContent = S.started ? `CHAPTER ${cur.n}/${CH.length} · ${cur.title.toUpperCase()}` : '';
  }
  function chapterCard(c){
    $('cKick').textContent = `CHAPTER ${c.n} OF ${CH.length}`;
    $('cTitle').textContent = c.title.toUpperCase();
    $('cMeta').textContent = `${plural(c.scenes.length, 'scene')} · about ${fmtMin(c.ms)}`;
    retrigger($('chap'), 'show'); sfx.thump(); setTimeout(() => sfx.chime(), 250);
  }
  async function goChapter(c){
    $('chPanel').classList.remove('open'); $('bChapters').classList.remove('on');
    sfx.on(); await jump(c.start); chapterCard(c);
  }
  $('bChapters').onclick = () => { $('chPanel').classList.toggle('open'); $('bChapters').classList.toggle('on'); };

  // ── boot: title card over the first set ──
  $('tEp').textContent = [P.show || opts.showName, P.ep && `EPISODE ${P.ep}`].filter(Boolean).join(' · ').toUpperCase() || 'TOTAL DRAMA';
  $('tName').textContent = P.title || 'Episode';
  if (!P.scenes.length){
    $('tPress').textContent = 'NO [SCENE: …] HEADERS FOUND';
    stage.style.pointerEvents = 'none';
  } else {
    $('tMeta').textContent = `${plural(P.scenes.length, 'scene')} · ${plural(CH.length, 'chapter')} · about ${fmtMin(RT.ms)}`;
    $('spokenText').textContent = SH.exitCard;
    // the titles roll after the cold open when there is one, else before the first scene
    S.openingAt = CH[0]?.kind === 'cold' && CH[1] ? CH[1].start : 0;
    renderScene(0); buildTimeline(); buildChapterStrip(); updateTimeline();
    R.querySelectorAll('.actor').forEach(a => a.classList.remove('enter'));
    const saved = loadProgress();
    if (saved > 0 && saved < P.beats.length - 1){
      const c = chapterAt(CH, saved);
      $('tResume').innerHTML = `<button class="tbtn" id="bResume">▶ Continue · Chapter ${c.n}: ${esc(c.title)}</button><button class="tbtn ghost" id="bRestart">↺ From the start</button>`;
      $('bResume').onclick = e => { e.stopPropagation(); sfx.on(); jump(saved).then(() => chapterCard(c)); };
      $('bRestart').onclick = e => { e.stopPropagation(); clearProgress(); $('tResume').innerHTML = ''; next(); };
    }
  }

  const api = { destroy, parsed: P, runtime: RT, chapters: CH, jump, next, state: S };
  host.__episodeStage = api;
  return api;
}
