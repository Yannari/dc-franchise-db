// @vitest-environment jsdom
// Total Drama camp life as storylines (docs/superpowers/specs/2026-10-07-td-storylines-design.md):
// the story pools' contract, and a played season read through the director.
import { describe, it, expect, beforeAll } from 'vitest';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { PLACES } from '../js/td/story/places.js';
import { TD_FACT_KEYS } from '../js/td/script/facts.js';
import { campFeed } from '../js/td/story/feed.js';
import { GUARANTEED as ENGINE_G } from '../js/td/script/lines/index.js';
import { VOICE_TAGS } from '../js/td/story/voice.js';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

// what a story entry's `when` may ask (td/script/facts.js plus the story layer's own)
const STORY_FACTS = new Set([...TD_FACT_KEYS,
  'venue', 'count', 'outcome', 'story', 'step', 'prev', 'prevGap', 'chapter', 'members', 'aOther', 'bOther', 'target', 'group',
  'voted', 'votedB', 'bVoted', 'myVote', 'blindside', 'gotVotes', 'unanimous', 'lost', 'won', 'sank', 'carried', 'sankA', 'carriedA', 'sankB', 'carriedB', 'streak', 'sankT', 'registerC', 'voice', 'voiceB', 'voiceC', 'hist', 'fresh', 'fourth', 'swing', 'why', 'votes', 'other', 'pitcher', 'merged', 'late', 'cast', 'pair', 'returnee', 'returneeB', 'fifth', 'sixth', 'notVoice', 'notVoiceB', 'home', 'job']);
// names a line may say, and the fact that must be asked for unless the pool always has it
const ALWAYS = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'h', 'quarters', 'bed', 'item', 'here', 'place', 'host']);
const NEEDS = { myVote: 'myVote', sank: 'sank', carried: 'carried', bootVotes: 'count', betrayer: 'betrayer', more: 'more', rival: 'rival', friend: 'friend',
  threat: 'threat', weak: 'weak', target: 'target', group: 'group', plan: 'plan', wrote: 'wrote', boot: 'boot', fallen: 'fallen', holder: 'holder', other: 'other', pitcher: 'pitcher', home: 'home', job: 'job' };
// a pool's guarantees: names its moment always carries
const GUARANTEED = [
  [/^story\.morning\./, ['lastBoot', 'target', 'bootVotes']],
  [/^story\.chal\.lost/, ['sank', 'streak', 'tribe']],
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
  [/^(room|after)\.burned$/, ['lastBoot', 'item', 'target']],
  [/^room\./, ['lastBoot', 'item']],
  [/^(reveal|exit|after)\./, ['lastBoot', 'item']],
  [/^long\.(talk\.lie\.about|drama\.paranoia\.quiet|romance\.tri\.(exploit|cut-))/, ['target']],
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
        expect(e.when?.[need], `${e.id} says {${name}} without asking for "${need}"`).toBeTruthy();
      }
    }
  });

  it('keys every voice variant on a tag voice.js gives people', () => {
    for (const [, e] of all) for (const t of e.turns) for (const k of Object.keys(t.v || {})) expect(VOICE_TAGS.includes(k), `${e.id}: variant '${k}'`).toBe(true);
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
    // the reading (nr: 'What? No. No, that's not right.') is shock, where short bursts are the point
    for (const [f, [m, b]] of Object.entries(byFile)) if (m >= 40 && f !== 'nr') expect(b / m, `${f}: ${b} of ${m} choppy`).toBeLessThan(0.12);
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
      expect(n, `ep ${ep.num} ${camp}`).toBeLessThanOrEqual(18);
    }
  });

  it('never stages two written scenes on the same spot at the same time', () => {
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post']) {
      const seen = new Set();
      // a meal is the one place the whole camp shares (td/story/write.js): it is exempt
      const eats = new Set(Object.values(PLACES).flatMap(v => v.eat || []));
      for (const it of ep.campStory[camp][ph].filter(x => x.story && x.scene?.spot?.id && x.scene.spot.id !== 'confessional' && !eats.has(x.scene.spot.id))) {
        const k = `${it.scene.spot.window || ''}|${it.scene.spot.id}`;
        expect(seen.has(k), `ep ${ep.num} ${camp}/${ph} ${k}`).toBe(false);
        seen.add(k);
      }
    }
  });

  it('leaves no slot unfilled', () => {
    for (const ep of eps) for (const camp of Object.keys(ep.campStory)) for (const ph of ['pre', 'post'])
      for (const it of ep.campStory[camp][ph].filter(x => x.story)) for (const l of it.lines) expect(/\{\w+/.test(l.text), `${it.lineId}: ${l.text}`).toBe(false);
  });
});
