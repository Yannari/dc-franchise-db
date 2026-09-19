// The episode stage reads the transcript the writer produces and draws it.
//
// Every rule here came from playing a real episode ("Basic Straining") and
// watching the stage get it wrong: a name mentioned in prose drawn into the
// room, the host walking into Green camp to say "previously on", a
// "[Present:]" line rendered as a scene of its own, a dismissal pinned on the
// wrong player. The fixture is that episode, trimmed.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEpisode, estimateRuntime, buildChapters, RUNTIME_TARGET, ageOf, episodeSummary, pickTeaser, hasStage } from '../js/episode-stage.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EP = fs.readFileSync(path.join(ROOT, 'tests/fixtures/episode-stage-basic-straining.txt'), 'utf8');
const P = parseEpisode(EP);
const scene = place => P.scenes.find(s => `${s.place} — ${s.sub}` === place || s.place === place);
const beatsOf = s => P.beats.filter(b => b.scene === s.i);

describe('episode stage: reading the transcript', () => {
  it('reads the title block and one [SCENE] per spot', () => {
    expect(P.show).toBe('TOTAL DRAMA: COACHES VS NEW BLOOD');
    expect(P.ep).toBe('6');
    expect(P.title).toBe('Basic Straining');
    expect(P.scenes.length).toBe(18);
    // a [Present:] on the same line as its [SCENE:] is a cast list, never a scene
    expect(P.scenes.some(s => /present/i.test(s.place))).toBe(false);
  });

  it('draws only the [Present:] list and the speakers, never a name the prose merely mentions', () => {
    const first = P.scenes[0];
    expect(first.present).toEqual(['Natalia', 'Manu', 'Nura', 'Grett', 'James', 'Julia']);
    expect(first.present).not.toContain('Yul');     // "the shelter feels bigger without Yul"
    expect(first.present).not.toContain('Chris');   // "Previously on…" is a host shot, not a visit
  });

  it('picks the set from the spot in the header, and keeps the place\'s time when a phase names none', () => {
    expect(scene('Green camp — well').set).toBe('well');
    expect(scene('Blue camp — tree line').set).toBe('jungle');
    expect(scene('Red camp — dock').set).toBe('dock');
    expect(scene("Blue camp — water's edge").set).toBe('beach');
    const canoe = scene('Challenge compound — canoe hold');
    expect(canoe.phase).toEqual({ n: '1', title: '' });
    expect(canoe.time).toBe('day');                 // inherited from "Challenge compound — day"
    const march = scene('Challenge compound — forest trail');
    expect(march.set).toBe('nightwoods');           // a forest trail in a competition at night is the night-woods kit
    expect(march.time).toBe('night');               // "Phase 5: Night March"
    expect(P.beats.filter(b => b.t === 'cut')).toEqual([]);   // a named spot is never re-guessed mid-scene
  });

  it('reads labelled cast lists: coaches, hosts and an unnamed background crowd', () => {
    const arena = scene('Challenge compound');
    expect(arena.present.length).toBe(23);
    expect(P.cast.James.role).toBe('coach');
    expect(P.cast.Chef.host).toBe(true);
    expect(P.cast.Spencer.tribe).toBe('blue');
    const water = scene('Challenge compound — water station');
    expect(water.background).toBe(true);
    expect(water.present).toEqual(['Natalia', 'Gabby', 'Sami']);
    expect(Object.keys(P.cast).some(n => /contestants|milling/.test(n))).toBe(false);
  });

  it('shoots the host to camera outside the challenge, and walks him in at it', () => {
    const cold = beatsOf(P.scenes[0]).filter(b => b.speaker === 'Chris');
    expect(cold.length).toBeGreaterThan(0);
    expect(cold.every(b => b.host)).toBe(true);
    const march = scene('Challenge compound — forest trail');
    expect(beatsOf(march).some(b => b.speaker === 'Chris' && b.host)).toBe(false);
    expect(march.late.Chris).toBeGreaterThan(0);
    const end = scene('Redemption Island');
    expect(beatsOf(end).filter(b => b.speaker === 'Chris').every(b => b.host)).toBe(true);
    // "[He grins.]" after a to-camera line stays on the host shot, not on Finn
    const grin = beatsOf(end).find(b => b.text === 'He grins.');
    expect(grin.stay).toBe(true);
    expect(grin.who).toEqual([]);
  });

  it('benches whoever the challenge just put out, from "DISMISSED!" and from the bell', () => {
    const out = P.beats.filter(b => b.out || b.dismiss).map(b => b.out || b.dismiss);
    expect([...new Set(out)]).toEqual(['Nura', 'Ren', 'Oliwia', 'Natalia', 'Manu', 'Grett']);
  });

  it('reads tribal: secret ballots, the vote reading, the torch', () => {
    const writes = P.beats.filter(b => b.write).map(b => `${b.write.voter}>${b.write.name}`);
    expect(writes).toEqual(['Natalia>James', 'Manu>Julia', 'Nura>Natalia', 'Grett>James']);
    expect(P.beats.filter(b => b.t === 'vote').map(b => b.name)).toEqual(['James', 'Julia', 'Natalia', 'James']);
    expect(P.beats.filter(b => b.t === 'elim').map(b => b.name)).toEqual(['James']);
    expect(P.beats.filter(b => b.t === 'spoken').length).toBe(1);
    expect(P.beats.find(b => b.snuff).snuff).toBe('James');
  });

  it('gives tribe immunity to the tribe, not to a person called Blue', () => {
    const win = P.beats.find(b => b.t === 'line' && /BLUE WINS IMMUNITY/.test(b.text));
    expect(win).toBeTruthy();
    expect(P.cast.Blue).toBeUndefined();
  });

  it('never cuts a page mid-cue, and never leaves a cue alone on a page', () => {
    const lines = P.beats.filter(b => b.t === 'line');
    lines.forEach(b => expect((b.text.match(/\[/g) || []).length).toBe((b.text.match(/\]/g) || []).length));
    lines.forEach(b => expect(b.text.replace(/\[[^\]]*\]/g, '').trim()).not.toBe(''));
  });
});

describe('episode stage: whose story, and who is talking', () => {
  it('reads the tribe from any "<Name> camp", not only colour words', () => {
    const Q = parseEpisode([
      '[SCENE: Kinosa camp — morning.] [Present: Owen, Gwen.]', 'Owen: Hi.',
      '[SCENE: Tribe camp — night.] [Present: Owen.]', 'Owen: Bye.',
      '[SCENE: Challenge arena — day.] [Present: Owen, Gwen. Host: Chris.]', 'Chris: KINOSA WINS IMMUNITY!',
    ].join('\n'));
    expect(Q.scenes.map(s => s.tribe)).toEqual(['kinosa', null, null]);
    expect(Q.cast.Owen.tribe).toBe('kinosa');
    expect(Q.cast.Kinosa).toBeUndefined();
  });

  it('gives the confessional an age from the roster: the authored age, else the birthdate, else nothing', () => {
    const today = new Date('2026-09-19');
    expect(ageOf({ age: 30, birthdate: '1990-01-01' }, today)).toBe(30);
    expect(ageOf({ birthdate: '2000-05-12' }, today)).toBe(26);
    expect(ageOf({ birthdate: '2000-12-01' }, today)).toBe(25);
    expect(ageOf({ occupation: 'Actor' }, today)).toBe(null);
    expect(ageOf(null, today)).toBe(null);
  });
});

describe('episode stage: the TV layer reads the story', () => {
  const E = parseEpisode([
    '[SCENE: Red camp — fire pit — night. The rain is pouring down.] [Present: Aubrey, Ren, Bruno, Gabby.]',
    'Aubrey: Final two. You and me?',
    'Ren: ...Why me?',
    '[Bruno leans over and kisses Gabby. The camp erupts.]',
    '[Confessional: Bruno]',
    'Bruno: Thom didn\'t say that. Obviously. I made it up.',
    '[SCENE: Tribal council — night.] [Present: Aubrey, Ren, Bruno. Host: Chris.]',
    'Chris: I\'ll read the votes.',
    'Chris: First vote... Bruno.',
    '[Bruno blinks. He was not expecting to see his own name.]',
    'Chris: Bruno.',
    'Chris: Bruno — that\'s enough. Bring me your torch.',
    'Bruno: I guess the coaching worked.',
    'Chris: Bruno. The tribe has spoken.',
  ].join('\n'));
  const events = E.beats.filter(b => b.event).map(b => `${b.event.kind}:${b.event.names.join('+')}`);

  it('clips the moments an audience would: a deal offered on camera, a kiss, a lie told to the camera, a blindside', () => {
    expect(events).toEqual(['deal:Aubrey+Ren', 'kiss:Bruno+Gabby', 'lie:Bruno', 'blindside:Bruno']);
    expect(E.beats.find(b => b.event?.kind === 'deal').event.label).toBe('FINAL-TWO DEAL');
  });

  it('knows rain that is falling now, and the final words after the torch is asked for', () => {
    expect(E.scenes[0].weather).toBe('rain');
    expect(P.scenes[0].weather).toBe(null);   // "It rained all night" style prose is not falling now
    expect(E.beats.filter(b => b.finalWords).map(b => b.speaker)).toEqual(['Bruno']);
  });

  it('sums the episode up for the results screen', () => {
    const sm = episodeSummary(P);
    expect(sm.exits).toEqual([{ name: 'James', tally: { James: 2, Julia: 1, Natalia: 1 } }]);
    expect(sm.wins[0].team).toBe('blue');
    expect(sm.wins).toHaveLength(1);                       // "last tribe standing wins immunity" is the rules, not a win
    expect(sm.wins[0].names).toEqual(['Lake', 'Spencer', 'Sami']);   // Blue players on the trail; coach Bowie excluded
    expect(sm.screen[0][1]).toBeGreaterThanOrEqual(sm.screen[sm.screen.length - 1][1]);
    expect(sm.screen.some(([n]) => P.cast[n].host)).toBe(false);
    expect(sm.quote && sm.quote.text.length).toBeGreaterThan(20);
    expect(episodeSummary(E).finalWords).toBe('I guess the coaching worked.');
  });

  it('teases each ad break with a line from the chapter ahead, never the host', () => {
    buildChapters(P).forEach(c => {
      const t = pickTeaser(P, c);
      if (!t) return;
      const i = P.beats.indexOf(t);
      expect(i).toBeGreaterThanOrEqual(c.start);
      expect(i).toBeLessThanOrEqual(c.end);
      expect(P.cast[t.speaker].host).toBe(false);
    });
  });

  it('only turns the stage on for shows that have a stage profile', () => {
    expect(hasStage('total-drama')).toBe(true);
    expect(hasStage('big-brother')).toBe(false);
    expect(P.profile.exitCard).toBe('THE TRIBE HAS SPOKEN');
  });
});

describe('episode stage: every vote read is counted', () => {
  const tribal = reads => parseEpisode([
    '[SCENE: Tribal council — night.] [Present: James, Julia, Natalia, Grett. Host: Chris.]',
    'Chris: Time to vote.',
    ...reads,
  ].join('\n'));
  const votes = Q => Q.beats.filter(b => b.t === 'vote').map(b => b.name);
  const out = Q => Q.beats.filter(b => b.t === 'elim').map(b => b.name);

  it('counts a vote however the host words it, and never a recap', () => {
    const Q = tribal([
      "Chris: I'll read the votes.",
      'Chris: First vote... James.',
      'Chris: Julia. One vote James, one vote Julia.',
      'Chris: [unfolds it slowly] Natalia.',
      'Chris: James. That is two votes James, one Julia, one Natalia.',   // long, still a vote
      'Chris: Two votes James. One vote Julia. One vote Natalia.',         // a recap: not a vote
      'Chris: Fifth vote... James. That\'s enough. James, bring me your torch.',   // the last vote rides in the exit line
      'Chris: James. The tribe has spoken.',
    ]);
    expect(votes(Q)).toEqual(['James', 'Julia', 'Natalia', 'James', 'James']);
    expect(out(Q)).toEqual(['James']);
    expect(Q.beats.find(b => b.t === 'elim').tally).toEqual({ James: 3, Julia: 1, Natalia: 1 });
  });

  it('counts a vote read in a stage direction', () => {
    const Q = tribal([
      '[Chris reads the votes.]',
      '[Chris unfolds the first parchment: JAMES.]',
      'Chris: Julia.',
      '[He holds up the last vote: JAMES.]',
      "Chris: That's enough. James, bring me your torch.",
    ]);
    expect(votes(Q)).toEqual(['James', 'Julia', 'James']);
    expect(out(Q)).toEqual(['James']);
  });
});

describe('episode stage: the voting booth', () => {
  const Q = parseEpisode([
    '[SCENE: Tribal council — night.] [Present: Natalia, Manu, Nura, Grett. Coaches: James, Julia. Host: Chris.]',
    'Chris: Time to vote.',
    '[SCENE: Tribal council — voting booth — night.]',
    '[Natalia walks to the urn. Writes JAMES.]',
    "Natalia: [to camera, quiet] He's got his hands on too much of this tribe. So yeah.",
    '[Manu walks to the urn. Writes JULIA. Folds it. Drops it in.]',
    '[Nura walks to the urn. Writes NATALIA.]',
    "Nura: [to camera] Her knee's hurt. She rang the bell.",
    '[Grett walks to the urn. Writes JAMES. Quick. Drops it.]',
    '[SCENE: Tribal council — night.] [Present: Natalia, Manu, Nura, Grett. Coaches: James, Julia. Host: Chris.]',
    'Chris: The tribe has voted.',
    'Chris: Two votes James. One vote Julia. One vote Natalia. James — that\'s enough. Bring me your torch.',
  ].join('\n'));

  it('draws the booth as its own room, part of the tribal council', () => {
    expect(Q.scenes[1].set).toBe('booth');
    expect(Q.scenes.map(s => buildChapters(Q).find(c => c.scenes.includes(s.i)).title)).toEqual(['Tribal Council', 'Tribal Council', 'Tribal Council']);
    expect(Q.beats.filter(b => b.write).map(b => `${b.write.voter}>${b.write.name}`)).toEqual(['Natalia>James', 'Manu>Julia', 'Nura>Natalia', 'Grett>James']);
  });

  it('plays a [to camera] line at the urn as a voting confessional', () => {
    expect(Q.beats.filter(b => b.t === 'line' && b.conf).map(b => b.speaker)).toEqual(['Natalia', 'Nura']);
  });

  it('sends home the person the exit line names, even with no vote read aloud', () => {
    // no "read the votes", so nothing is counted — the answer is in "James — that's enough", not the last name said
    expect(Q.beats.filter(b => b.t === 'vote')).toEqual([]);
    expect(Q.beats.filter(b => b.t === 'elim').map(b => b.name)).toEqual(['James']);
  });
});

describe('episode stage: challenges', () => {
  const C = parseEpisode([
    '[SCENE: Camp Wawanakwa — mess hall — day.] [Present: Owen, Gwen, Heather, Duncan, Izzy. Host: Chris, Chef.]',
    "[Challenge: Hell's Kitchen]",
    "Chris: Welcome to Hell's Kitchen!",
    'Chris: Owen, you\'re out!',
    '[SCENE: Challenge arena — dodgeball court — afternoon.] [Present: Owen, Gwen, Heather, Duncan, Izzy. Host: Chris.]',
    '[Challenge: Dodgebrawl]',
    'Chris: That\'s a point for the Bass! Bass 2, Gophers 1.',
    '[Izzy falls off the bleachers.]',
    '[SCENE: Challenge arena — day.] [Present: Owen, Gwen. Host: Chris.]',
    '[Challenge: Tug of War]',
    '[Gwen crosses the finish line first.]',
    '[Owen finishes last.]',
  ].join('\n'));

  it('plays each named challenge on its kit and titles its chapter', () => {
    expect(C.scenes.map(s => s.set)).toEqual(['kitchen', 'arena', 'course']);
    expect(C.beats.filter(b => b.t === 'card').map(b => b.title)).toEqual(["Hell's Kitchen", 'Dodgebrawl', 'Tug of War']);
    expect(buildChapters(C).map(c => c.title)).toEqual(["Hell's Kitchen", 'Dodgebrawl', 'Tug of War']);
  });

  it('knows the whole twist catalogue', async () => {
    const { CHALLENGE_KITS, resolveChallenge } = await import('../js/stage-challenges.js');
    expect(Object.keys(CHALLENGE_KITS).length).toBe(84);
    expect(resolveChallenge("Hell's Kitchen — immunity").kit).toBe('kitchen');
    expect(resolveChallenge('paintball-hunt').name).toBe('Paintball Deer Hunter');
    expect(resolveChallenge('Giant Snowball Fight').kit).toBe('snow');
  });

  it('reads the competition itself: who the host calls out, the score, who falls, the finish order', () => {
    expect(C.beats.find(b => b.outMany)?.outMany).toEqual(['Owen']);
    expect(C.beats.find(b => b.score)?.score).toEqual({ Bass: 2, Gophers: 1 });
    expect(C.beats.find(b => b.out)?.out).toBe('Izzy');
    expect(C.beats.filter(b => b.place).map(b => `${b.place.name}:${b.place.label}`)).toEqual(['Gwen:1ST', 'Owen:LAST']);
  });
});

describe('episode stage: run time and chapters', () => {
  const RT = estimateRuntime(P);

  it('prices the fixture in minutes and clicks', () => {
    expect(RT.clicks).toBe(P.beats.length);
    expect(RT.minutes).toBeGreaterThan(2);
    expect(RT.minutes).toBeLessThan(15);
    expect(RT.long).toBe(false);
  });

  it('puts a 3,500–4,700 word episode inside the 15–20 minute target', () => {
    // A plain dialogue episode at the target length, the way the writer makes them.
    const line = 'Natalia: I said maybe the coaching could be better, and honestly, that is feedback.';
    const words = line.split(/\s+/).length - 1;
    const make = n => ['[SCENE: Green camp — fire pit — night.] [Present: Natalia, James.]',
      ...Array.from({ length: Math.ceil(n / words) }, () => line)].join('\n');
    const at = n => estimateRuntime(parseEpisode(make(n))).minutes;
    expect(at(3500)).toBeGreaterThan(RUNTIME_TARGET.min * .8);
    expect(at(4700)).toBeLessThan(RUNTIME_TARGET.max * 1.25);
    expect(estimateRuntime(parseEpisode(make(9500))).long).toBe(true);
  });

  it('builds chapters out of the scenes', () => {
    const CH = buildChapters(P, RT);
    expect(CH.map(c => c.title)).toEqual(['Cold Open', 'Camp Life', 'The Challenge', 'After the Challenge', 'Tribal Council', 'Epilogue']);
    // contiguous, covering every beat once
    expect(CH[0].start).toBe(0);
    CH.slice(1).forEach((c, k) => expect(c.start).toBe(CH[k].end + 1));
    expect(CH[CH.length - 1].end).toBe(P.beats.length - 1);
    expect(Math.round(CH.reduce((a, c) => a + c.ms, 0))).toBe(Math.round(RT.ms));
  });

  it('numbers a second challenge instead of folding it into the first', () => {
    const two = parseEpisode([
      '[SCENE: Challenge arena — morning.] [Present: Owen, Gwen. Host: Chris.]', 'Chris: Reward challenge!',
      '[SCENE: Tribe camp — afternoon.] [Present: Owen, Gwen.]', 'Owen: Food!',
      '[SCENE: Challenge arena — dusk.] [Present: Owen, Gwen. Host: Chris.]', 'Chris: Immunity challenge!',
    ].join('\n'));
    expect(buildChapters(two).map(c => c.title)).toEqual(['The Challenge', 'After the Challenge', 'The Challenge 2']);
  });
});

describe('current-season.html plays a show with a stage profile on the stage', () => {
  const html = fs.readFileSync(path.join(ROOT, 'current-season.html'), 'utf8');
  it('imports the stage and mounts it for Total Drama only, keeping the script view', () => {
    expect(html).toMatch(/import \{ mountEpisodeStage, hasStage \} from '\.\/js\/episode-stage\.js'/);
    const fn = html.slice(html.indexOf('function renderEpisode()'), html.indexOf('function parseTranscript('));
    // gated on the show having a stage profile, not on one show's name
    expect(fn).toMatch(/window\.__hasStage\(fmt\)/);
    expect(fn).toContain('show: fmt');
    expect(fn).toContain('portrait: window.portraitFor');
    expect(fn).toContain('profiles: _csRosterProfiles()');
    expect(fn).toContain('data-view="script"');
  });
});
