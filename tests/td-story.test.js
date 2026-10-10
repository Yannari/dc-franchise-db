// @vitest-environment jsdom
// Total Drama camp life as storylines (docs/superpowers/specs/2026-10-07-td-storylines-design.md):
// the story pools' contract, and a played season read through the director.
import { describe, it, expect, beforeAll } from 'vitest';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { PLACES } from '../js/td/story/places.js';
import { TD_FACT_KEYS } from '../js/td/script/facts.js';
import { campFeed } from '../js/td/story/feed.js';
import { GUARANTEED as ENGINE_G } from '../js/td/script/lines/index.js';
import { VOICE_TAGS, voiced, voiceOf } from '../js/td/story/voice.js';
import { FAMILY } from '../js/td/story/voice-family.js';
import VOICES from '../js/td/story/lines/voices/index.js';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

// what a story entry's `when` may ask (td/script/facts.js plus the story layer's own)
const STORY_FACTS = new Set([...TD_FACT_KEYS, 'madeMove',
  'venue', 'count', 'outcome', 'story', 'step', 'prev', 'prevGap', 'chapter', 'members', 'aOther', 'bOther', 'target', 'group',
  'voted', 'votedB', 'bVoted', 'myVote', 'blindside', 'gotVotes', 'unanimous', 'lost', 'won', 'sank', 'carried', 'sankA', 'carriedA', 'sankB', 'carriedB', 'streak', 'sankT', 'registerC', 'voice', 'voiceB', 'voiceC', 'hist', 'fresh', 'fourth', 'swing', 'why', 'votes', 'other', 'pitcher', 'merged', 'late', 'cast', 'pair', 'returnee', 'returneeB', 'past', 'pastB', 'pastBy', 'pastPartnerHere', 'targetPast', 'targetWronged', 'glue', 'count', 'fifth', 'sixth', 'notVoice', 'notVoiceB', 'home', 'job', 'lot', 'eats', 'thing', 'others', 'markMe', 'markB', 'otherMe', 'otherB', 'shaky', 'cover', 'close', 'aVoted', 'defends', 'cWasted', 'self', 'found', 'sparkSeen', 'told', 'tally', 'alt', 'fromTarget', 'sparkKind', 'wroteIsBoot', 'moment', 'how', 'ago', 'bWrote', 'tease', 'two', 'bLikesA', 'bHatesA', 'physical', 'imm', 'ally', 'markLeader', 'real', 'blame', 'crash', 'revealKind', 'saw', 'call', 'lostAlly', 'flipped', 'won', 'again', 'yes']);
// names a line may say, and the fact that must be asked for unless the pool always has it
const ALWAYS = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'h', 'quarters', 'bed', 'item', 'here', 'place', 'host']);
const NEEDS = { glueA: 'glue', glueB: 'glue', lastBy: 'pastBy', lastPartner: 'pastPartnerHere', lastSeason: 'past', lastPlace: 'past', lastSeasonT: 'targetPast', lastPlaceT: 'targetPast', lastSeasonB: 'pastB', lastPlaceB: 'pastB',myVote: 'myVote',sank: 'sank', carried: 'carried', bootVotes: 'count', betrayer: 'betrayer', more: 'more', rival: 'rival', friend: 'friend',
  threat: 'threat', weak: 'weak', target: 'target', group: 'group', plan: 'plan', wrote: 'wrote', boot: 'boot', fallen: 'fallen', holder: 'holder', other: 'other', pitcher: 'pitcher', home: 'home', job: 'job', lot: 'lot', thing: 'thing', others: 'others', shaky: 'shaky', cover: 'cover', found: 'found', alt: 'alt', teller: 'told', warnedAbout: 'fromTarget', imm: 'imm', lastBoot: 'lastBoot', real: 'real', blame: 'blame', lostAlly: 'lostAlly' };
// a pool's guarantees: names its moment always carries
const GUARANTEED = [
  [/^deep\.liedto/, ['leader', 'cover', 'lastBoot']],
  [/^deep\.swing/, ['pitcher', 'target']],
  [/^deep\.betray/, ['friend']],
  [/^handoff\./, ['c']],
  [/(isolate)$/, ['target', 'keep']],
  [/(pledge)$/, ['target', 'protects']],
  [/^booth2\.misled/, ['target', 'leader']],
  [/^cover\.meet/, ['cover']],
  [/^cover\.tease/, ['told']],
  [/^cover\.doubt/, ['told1']],
  [/^after\.cover/, ['cover', 'told', 'lastBoot']],
  [/^after\.misled/, ['cover', 'lastBoot']],
  [/^thr\.(rescue|wronged|rivals)\./, ['chal']],
  [/^crash\.callout\.part$/, ['real']],
  [/^booth2\.(lead|with)\.coming$/, ['target', 'mark']],
  [/^booth2\.(lead|with)\.pair$/, ['target', 'partner']],
  [/^booth2\.(lead|with)\.group$/, ['target', 'theirs']],
  [/^booth2\.with\./, ['target', 'leader']],
  [/^booth2\.swing\./, ['target', 'pitcher']],
  [/^booth2\./, ['target']],
  [/^story\.morning\./, ['lastBoot', 'target', 'bootVotes']],
  [/^story\.chal\.(lost|regroup)/, ['sank', 'streak', 'tribe']],
  [/^story\.chal\.won/, ['carried', 'tribe']],
  [/^long\.(alliance|recruit)\./, ['group']],
  [/^long\.alliance\.form\.enemy/, ['target']],
  [/^long\.fallout\.flip\.swap/, ['wrote', 'plan']],
  [/^long\.deal\.side/, ['size']],
  [/^booth\./, ['target', 'lastBoot']],
  [/^story\.firstday\.history\.(siblings|family|cousins|couple|friends|knew|estranged|exes|exfriends)$/, ['kinWord']],
  [/^story\.firstday\.history\.(wronged|wronger|oldflame|oldcouple|oldrivals|oldallies)$/, ['where']],
  [/^story\.(firstday|firstpair)/, ['tribe']],
  [/^long\.cross\./, ['mine', 'theirs']],
  [/^long\.crowd\.huddle/, ['group']],
  [/^booth\.plan/, []],
  [/^arrive\./, ['landing']],
  [/^arrive\.wait\./, ['latest']],
  [/^twist\.swap\.split\./, ['mine', 'theirs']],
  [/^arrive\.meet\.history\.(siblings|family|cousins|couple|friends|knew|estranged|exes|exfriends)$/, ['kinWord']],
  [/^arrive\.meet\.history\.(wronged|wronger|oldflame|oldcouple|oldrivals|oldallies)$/, ['where']],
  [/^story\.vote\.(plan|swing)\./, ['target', 'votes']],
  [/^story\.vote\.other\./, ['target']],
  [/^story\.vote\.target\./, ['wrote']],
  [/^story\.vote\.doubt\./, ['target']],
  [/^story\.auction\.(power|immunity)$/, ['target']],
  [/^exile\.back\./, ['other']],
  [/^vp\.(solo\.)?case\.coming$/, ['target', 'mark']],
  [/^vp\.(solo\.)?case\.pair$/, ['target', 'partner']],
  [/^vp\.(solo\.)?case\.group$/, ['target', 'theirs']],
  [/^vp\.(push|answer)\.alt$/, ['target', 'alt']],
  [/^vp\.(push|answer)\.pair$/, ['target', 'partner']],
  [/^vp\.(solo\.)?count\.(close|tight)$/, ['target', 'other', 'them', 'votes']],
  [/^vp\./, ['target', 'votes']],
  [/^chm\./, ['chal']],
  [/^prev\.chal\./, ['show', 'chal', 'win', 'lose', 'x', 'y']],
  [/^prev\.chalInd\./, ['show', 'chal', 'x']],
  [/^prev\.(blame|spark|fight)\./, ['show', 'x', 'y']],
  [/^prev\.(flip|adv|runner)\./, ['show', 'x']],
  [/^prev\.warn\./, ['show', 'x', 'y', 'pitcher']],
  [/^prev\.ally\./, ['show', 'group']],
  [/^prev\.(boot|blindside)\./, ['show', 'boot']],
  [/^prev\.left\./, ['show', 'left', 'Left']],
  [/^prev\./, ['show']],
  [/^vp\.recall\.(revenge|fallout)$/, ['target', 'moment', 'fallen']],
  [/^vp\.recall\./, ['target', 'moment']],
  [/^vp2\.coming$/, ['target', 'votes', 'them', 'mark']],
  [/^vp2\.pair$/, ['target', 'votes', 'partner']],
  [/^vp2\.group$/, ['target', 'votes', 'theirs']],
  [/^vp2\./, ['target', 'votes', 'them']],
  [/^vt2\.scramble$/, ['wrote', 'pitcher']],
  [/^vt2\./, ['wrote']],
  [/^tqa\.scramble\./, ['target']],
  [/^arc\.warn\./, ['pitcher', 'target']],
  [/^arc\.adv\.idol\.warned$/, ['pitcher', 'source']],
  [/^arc\.spark\.pair$/, ['partner']],
  [/^arc\.spark\.group$/, ['theirs']],
  [/^arc\.ally\./, ['group']],
  [/^tqa\.burned\./, ['lastBoot']],
  [/^fi\.(read|twist|welcome)\./, ['tribe', 'theirs']],
  [/^fi\.after\./, ['theirs']],
  [/^auc\.lot\.(food|comfort|letter)$/, ['lot', 'amount']],
  [/^auc\.(lot|bid|sold|saver)\./, ['amount']],
  [/^auc\.bid\.war$/, ['amount', 'top']],
  [/^auc\.win\./, ['lot', 'amount']],
  [/^auc\.switch\./, ['lot', 'thing']],
  [/^fi\.(huddle|booth|after)\./, ['target']],
  [/^(room|after)\.burned$/, ['lastBoot', 'item', 'target']],
  [/^room\./, ['lastBoot', 'item']],
  [/^(reveal|exit|after)\./, ['lastBoot', 'item']],
  [/^long\.(talk\.lie\.about|drama\.paranoia\.quiet|romance\.tri\.(exploit|cut-))/, ['target']],
  // a returnee's moment (camp-events.js franchise-meta block) carries a's last season; the threat and target
  // scenes carry the returnee they are about ({target}, td/past.js pastData suffix T)
  [/^long\.ret\./, ['lastSeason', 'lastPlace']],
  // the mentor arc (director.js) always carries the skill it's about
  [/^arc\.mentor\./, ['skill']],
  // the arcs (td/story/arcs.js) carry what they're about: the friend and the rival, the mark, the challenge
  [/^arc\.avenge\./, ['friend', 'rival']],
  [/^arc\.fake\./, ['mark']],
  [/^arc\.slack\.effort\./, ['chal']],
  // a defence and its setup carry the charge (director.js defendCharge); the setup the record behind it
  [/^(long\.friend\.defend\.|story\.defend\.setup\.)/, ['charge']],
  [/^story\.defend\.setup\.sank/, ['chal']],
  [/^story\.defend\.setup\.kit/, ['thing']],
  [/^long\.ret\.(threat|target)\./, ['target', 'lastSeasonT', 'lastPlaceT']],
];
// a long scene carries what its engine moment always carries (td/script/lines GUARANTEED)
const engineG = key => {
  if (!key.startsWith('long.')) return [];
  const k = key.slice(5), fam = k.split('.').slice(0, 2).join('.');
  return [...(ENGINE_G[k] || []), ...(k.endsWith('.any') ? Object.entries(ENGINE_G).filter(([g]) => g.startsWith(fam + '.')).flatMap(([, v]) => v).filter((v, i, a) => Object.keys(ENGINE_G).filter(g => g.startsWith(fam + '.')).every(g => (ENGINE_G[g] || []).includes(v))) : [])];
};
const guaranteed = key => [...GUARANTEED.filter(([re]) => re.test(key)).flatMap(([, n]) => n), ...engineG(key)];

describe('td story pools', () => {
  const all = Object.entries(STORY_POOLS).flatMap(([k, pool]) => pool.map(e => [k, e]));

  it('has unique ids', () => {
    const ids = all.map(([, e]) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('asks only for facts that exist', () => {
    for (const [k, e] of all) for (const f of Object.keys(e.when || {})) expect(STORY_FACTS.has(f), `${e.id} (${k}) asks for "${f}"`).toBe(true);
    for (const [k, e] of all) for (const t of e.turns) for (const f of Object.keys(t.when || {})) expect(STORY_FACTS.has(f), `${e.id} (${k}) line asks for "${f}"`).toBe(true);
  });

  it('says an optional name only when the entry asks for it', () => {
    for (const [k, e] of all) {
      const g = guaranteed(k);
      for (const t of e.turns) for (const m of [t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ').matchAll(/\{(\w+)(?:\.\w+)?\}/g)) {
        const name = m[1];
        if (ALWAYS.has(name) || g.includes(name)) continue;
        if (name === 'lastBoot') { expect(e.when?.lastBoot === true || g.includes('lastBoot'), `${e.id} says {lastBoot}`).toBe(true); continue; }
        if (name === 'bootVotes') { expect(e.when?.count, `${e.id} says {bootVotes} where nobody hears the count`).toBe(true); continue; }
        const need = NEEDS[name];
        expect(need, `${e.id} says {${name}}, which no story scene carries`).toBeTruthy();
        expect(e.when?.[need] || t.when?.[need], `${e.id} says {${name}} without asking for "${need}"`).toBeTruthy();
      }
    }
  });

  it('keys every voice variant on a tag voice.js gives people', () => {
    for (const [, e] of all) for (const t of e.turns) for (const k of Object.keys(t.v || {})) expect([...VOICE_TAGS, ...Object.values(FAMILY)].includes(k), `${e.id}: variant '${k}'`).toBe(true);
    for (const [, e] of all) for (const f of ['voice', 'voiceB', 'voiceC']) for (const t of [].concat(e.when?.[f] || [])) expect(VOICE_TAGS.includes(t), `${e.id}: ${f} '${t}'`).toBe(true);
  });

  it("never uses {count} (it is the number of players left, not a record)", () => {
    for (const [, e] of all) for (const t of e.turns) expect(/\{count\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ')), e.id).toBe(false);
  });

  it('stages every entry in a kind of place the venues know', () => {
    const kinds = new Set([...Object.values(PLACES).flatMap(v => Object.keys(v)), 'confessional']);
    for (const [, e] of all) if (e.place) expect(kinds.has(e.place), `${e.id} place "${e.place}"`).toBe(true);
  });

  it('never puts a present-tense verb after a pronoun ("they was", "they thinks")', () => {
    const bad = /\{\w+\.(sub|Sub)\}('s\b|\s+(was|is|has|sits|trusts|thinks|runs|wants|does|talks|likes|knows|goes|says|gets|needs|keeps|looks|seems|means|makes|takes|gives|feels|plays)\b)/;
    for (const [, e] of all) for (const t of e.turns) expect(bad.test(t.say || t.conf || t.beat || ''), `${e.id}: ${t.say || t.conf || t.beat}`).toBe(false);
  });

  it('says none of the things the user has struck out (a spoken "...", therapy-speak)', () => {
    const banned = [/^\s*\.\.\.\s*$/, /that means a lot/i, /thank you\. i mean it/i, /i hear you/i, /hold space/i, /it is what it is/i];
    for (const [, e] of all) for (const t of e.turns) for (const re of banned) expect(re.test(t.say || t.conf || ''), `${e.id}: ${t.say || t.conf}`).toBe(false);
  });

  // The user, 2026-10-08: "I'm not supposed to like anyone here. I like {a}. This is bad." reads like a
  // robot; real speech joins its thoughts ("I know... I promised myself I wouldn't fall for anyone here,
  // but I really like {a}"). A line of 3+ sentences averaging under six words is choppy; shock, a host's
  // patter and a stammer can be, so the cap is a share, not a ban.
  it('talks in connected sentences, not strings of short ones', () => {
    const choppy = x => { const t = x.split(/(?<=[.!?])\s+/).filter(Boolean); return t.length >= 3 && x.split(/\s+/).length / t.length < 6; };
    const byFile = {};
    let n = 0, bad = 0;
    for (const [, e] of all) for (const t of e.turns) for (const x of [t.say, t.conf, ...Object.values(t.v || {})].filter(Boolean)) {
      const f = e.id.split('.')[0];
      (byFile[f] ||= [0, 0])[0]++; n++;
      if (choppy(x)) { byFile[f][1]++; bad++; }
    }
    expect(bad / n, `${bad} of ${n} lines are choppy`).toBeLessThan(0.04);
    // the reading (nr: 'What? No. No, that's not right.') is shock and the auction floor (naf: 'Higher.') is shouting, where short bursts are the point
    for (const [f, [m, b]] of Object.entries(byFile)) if (m >= 40 && !['nr', 'naf'].includes(f)) expect(b / m, `${f}: ${b} of ${m} choppy`).toBeLessThan(0.12);
  });

  // The rewrite's voice (docs/td-dialogue-style.md): plain, reactive speech. These are the tics the
  // first pass was full of — aphorisms, epigram ping-pong, the narrator being clever in a beat.
  it('writes the rewritten pools without the old tics', () => {
    const TICS = [/\bout here,/i, /why not both/i, /that'?s the game\b/i, /\bnot an? [a-z]+\. it'?s an? /i, /it is not going well/i,
      /neither of them moves/i, /that'?s an answer too/i, /\bthe thing about\b/i, /\bin this game, you\b/i, /some people .{0,20}, some people/i,
      // written, not spoken (the user, 2026-10-08: "nobody talks like that")
      /\bI'd like to talk\b/i, /\ba (quick )?word about\b/i, /\bworth your while\b/i, /\bfor toast\b/i, /\bpopulation: /i];
    const fresh = all.filter(([, e]) => /^n[a-z]\./.test(e.id));
    expect(fresh.length).toBeGreaterThan(300);
    for (const [, e] of fresh) for (const t of e.turns) for (const text of [t.say, t.conf, t.beat, ...Object.values(t.v || {})].filter(Boolean))
      for (const re of TICS) expect(re.test(text), `${e.id}: ${text}`).toBe(false);
  });

  it('lets a third person into a scene only when there is one', () => {
    for (const [, e] of all) {
      // an optional turn (opt: true) plays only when c is there, so it needs no gate
      const usesC = e.turns.some(t => !t.opt && (t.by === 'c' || /\{c(\.\w+)?\}/.test(t.say || t.conf || t.beat || '')));
      if (usesC && !e.cOptional) expect(e.when?.third, `${e.id} uses c`).toBe(true);
    }
  });
});

describe('the voice overlay', () => {
  // keyed by entry id and turn index: a renamed entry or a reordered scene would drop its variants silently
  it('points at entries and spoken turns that exist, with real voice tags', () => {
    const byId = {};
    for (const es of Object.values(STORY_POOLS)) for (const e of es) byId[e.id] = e;
    const bad = [];
    for (const [id, turns] of Object.entries(VOICES)) for (const [i, tags] of Object.entries(turns)) {
      const t = byId[id]?.turns?.[+i];
      if (!t || !(t.say || t.conf)) bad.push(`${id}#${i}`);
      for (const k of Object.keys(tags)) if (!VOICE_TAGS.includes(k)) bad.push(`${id}#${i}:${k}`);
    }
    expect(bad).toEqual([]);
  });
});

describe('a flirty voice outside a romance', () => {
  // a flirty variant airs between ANY two people (romanticCompat is never asked for a voice line):
  // outside the romance pools it is charm, never attraction ('easy on the eyes' to a straight man)
  it('never says attraction', () => {
    const bad = [];
    for (const [k, es] of Object.entries(STORY_POOLS)) {
      if (/romance|flirt|spark|showmance|kiss|crush/.test(k)) continue;
      for (const e of es) for (const t of e.turns || []) {
        const x = t.v?.flirty;
        if (x && /\b(eyes|cute|gorgeous|hot|handsome|pretty|kiss|date|a thing|crush|like (him|her|them|\{\w\}))\b/i.test(x)) bad.push(`${e.id}: ${x}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('who says an age variant', () => {
  // Fiore is eleven and venomous: the kid line ('That's awesome. You deserve a good night.') is a
  // register a sweet kid talks in, and a hard voice never says it; her stats never make her loud or warm
  it('a hard voice keeps its own words, whatever its age', () => {
    const was = core.players;
    const stats = { physical: 3, endurance: 4, mental: 9, social: 8, strategic: 8, loyalty: 2, boldness: 8, intuition: 7, temperament: 2 };
    core.setPlayers([
      { name: 'Vee', archetype: 'villain', age: 11, voice: 'Venomous and surgical. Never raises her voice; thinks everyone is beneath her.', stats },
      { name: 'Pip', archetype: 'underdog', age: 11, voice: 'Sweet and shy.', stats: { ...stats, temperament: 6, social: 5, boldness: 4, strategic: 4 } },
    ]);
    try {
      const turn = { say: 'Plain.', v: { kid: 'Kid.' } };
      expect(voiced(turn, 'Vee')).toBe('Plain.');
      expect(voiced(turn, 'Pip')).toBe('Kid.');
      expect(voiceOf('Vee')).not.toContain('loud');
      expect(voiceOf('Vee')).not.toContain('warm');
    } finally { core.setPlayers(was); }
  });
});

describe('a season through the director', () => {
  let eps;
  beforeAll(() => {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16), 4242);
    eps = core.gs.episodeHistory.filter(e => !e.isFinale && e.campStory);
  }, 300000);

  it('builds a story for every camp episode', () => {
    expect(eps.length).toBeGreaterThan(8);
  });

  it('lets nobody go a whole episode without a word at camp', () => {
    let slots = 0, silent = 0;
    for (const ep of eps) {
      for (const camp of Object.keys(ep.campStory)) {
        const members = (ep.tribesAtStart || []).find(t => t.name === camp)?.members || (ep.tribesAtStart || []).flatMap(t => t.members);
        const spoke = new Set(['pre', 'post'].flatMap(ph => campFeed(ep, camp, ph)).flatMap(e => (e.lines || []).filter(l => l.kind !== 'beat').map(l => l.by)));
        for (const m of members) { slots++; if (!spoke.has(m)) silent++; }
      }
    }
    expect(silent / slots).toBeLessThan(0.03);
  });

  it('airs a show-sized episode, not forty sketches', () => {
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) {
      const n = campFeed(ep, camp, 'pre').length + campFeed(ep, camp, 'post').length;
      // 18 was the camp-only edit; the vote told across the day (director.js arcBeats) adds its spark,
      // warnings and advantage decisions on top of the free scenes, so a big night runs a little longer
      expect(n, `ep ${ep.num} ${camp}`).toBeLessThanOrEqual(22);
    }
  });

  it('never stages two written scenes on the same spot at the same time', () => {
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post']) {
      const seen = new Set();
      // a meal is the one place the whole camp shares (td/story/write.js): it is exempt
      const eats = new Set(Object.values(PLACES).flatMap(v => v.eat || []));
      for (const it of ep.campStory[camp][ph].filter(x => x.story && x.scene?.spot?.id && x.scene.spot.id !== 'confessional' && !eats.has(x.scene.spot.id))) {
        const k = `${it.scene.spot.window || ''}|${it.scene.spot.id}`;
        // ...and a scene that runs on from the one before it (director.js chainScenes) is that scene, continued
        if (!it.chained) expect(seen.has(k), `ep ${ep.num} ${camp}/${ph} ${k}`).toBe(false);
        seen.add(k);
      }
    }
  });

  // The user, 2026-10-10, of a fishing-spot scene with four faces on stage and two talking: "it's a 4
  // person scene but no one talking but the 2 girls". The viewer stages scene.who, so everyone in it
  // speaks or is spoken of.
  it('stages nobody who is silent and unmentioned', () => {
    const silent = [];
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post'])
      for (const sc of campFeed(ep, camp, ph).filter(x => x.story && x.lines?.length && x.scene?.who))
        for (const n of Object.values(sc.scene.who).filter(Boolean))
          if (!sc.lines.some(l => l.by === n || String(l.text || '').includes(n))) silent.push(`ep ${ep.num} ${sc.kind} ${sc.lineId}: ${n}`);
    expect(silent).toEqual([]);
  });

  // ...and "audit for weirdly short scenes ... we need meat and story": a conversation that airs (somebody
  // speaks to somebody; a confessional on its own is a confessional) has at least four spoken lines.
  // Measured 2026-10-10 over 2131 aired scenes: 11.7% short before, 0.8% after.
  it('airs conversations, not two-line sketches', () => {
    let convo = 0, short = [];
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post'])
      for (const sc of campFeed(ep, camp, ph)) {
        const spoken = (sc.lines || []).filter(l => l.by && l.kind === 'say').length;
        if (!spoken) continue;
        convo++;
        if (spoken < 4) short.push(`ep ${ep.num} ${sc.kind || sc.type} ${sc.lineId || sc.scene?.lineId}`);
      }
    expect(short.length / convo, short.join('\n')).toBeLessThan(0.03);
  });

  it('leaves no slot unfilled', () => {
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post'])
      for (const it of ep.campStory[camp][ph].filter(x => x.story)) for (const l of it.lines) expect(/\{\w+/.test(l.text), `${it.lineId}: ${l.text}`).toBe(false);
  });
});
