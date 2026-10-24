// ChatAlumni's hosts say what happened, in their own voices, and answer each other (the user,
// 2026-10-24: "chatalumni is still so vague it's like they're not even human talking... why are they
// all talking like yoda and not in their voice/archetype"). Read on the published Big Brother season
// before the fix: ten twists in a night, each met with a maxim ("The interesting part is who was
// standing close enough to notice and said nothing"), and no host ever answering another.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { factOf, deliveryOf, roleOf, REACT, REPLY } from '../js/social/green-room.js';
import { episodeFeed } from '../js/social/archive.js';
import { eligibleHosts, seasonPanel, episodeSpeakers } from '../js/social/hosts.js';
import { buildChatMessages } from '../js/social/chat.js';

const J = f => JSON.parse(readFileSync(f, 'utf8'));

describe('the moment, in words', () => {
  const w = { onDanger: 'on the block', challenge: 'competition' };
  it('says a fragment about its player as a sentence, with the verb a passive needs', () => {
    expect(factOf({ kind: 'twist', subject: 'joel', moment: "Won veto and removed himself from Ireland's block." }, w)).toBe("Joel won veto and removed himself from Ireland's block.");
    expect(factOf({ kind: 'twist', subject: 'stella', moment: 'Evicted 10-3 after believing the vote was closer.' }, w)).toBe('Stella was evicted 10-3 after believing the vote was closer.');
  });
  it('says a moment that is already a sentence as it is', () => {
    expect(factOf({ kind: 'twist', subject: 'harriett', moment: 'The twin reveal brought Jane into the house.' }, w)).toBe('The twin reveal brought Jane into the house.');
  });
  it('builds who-did-what when there is no moment, and nothing when there is nothing to say', () => {
    expect(factOf({ kind: 'nomination', subject: 'stella', actor: 'ireland' }, w)).toBe('Ireland put Stella on the block.');
    expect(factOf({ kind: 'comp-win', subject: 'joel' }, w)).toBe('Joel won the competition.');
    expect(factOf({ kind: 'episode-aired' }, w)).toBeNull();
  });
});

describe('how a host talks', () => {
  it('reads the delivery a description names first', () => {
    expect(deliveryOf({ name: 'A', voice: 'Sheltered genius. Nervous, over-analytical, book-smart.' })).toBe('nervous');
    expect(deliveryOf({ name: 'B', voice: "Brash, loud cop. Barks orders, hyper-competitive about everything." })).toBe('blunt');
    expect(deliveryOf({ name: 'C', voice: 'Sweet-poison manipulator. Disarms you with a smile and then cuts.' })).toBe('manipulative');
  });
  it('falls back to the hashtags, then to the lens', () => {
    expect(deliveryOf({ name: 'D', voice: 'Plays the long game. #dry' })).toBe('deadpan');
    expect(deliveryOf({ name: 'E', voice: '' }, 'challenge-beast')).toBe('blunt');
  });
  it('has a full set of lines for every delivery', () => {
    for (const [v, r] of Object.entries(REACT)) {
      for (const k of ['any', 'hit', 'win']) expect(r[k].length, `${v}.${k}`).toBeGreaterThanOrEqual(3);
      for (const st of ['agree', 'disagree']) expect(REPLY[v][st].any.length, `${v} ${st}`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('a night in the green room (the published Big Brother season)', () => {
  const doc = J('data/seasons/bb-1-data.json');
  const players = J('players_database.json');
  const hosts = eligibleHosts({ players, seasons: J('seasons_database.json'), rankings: J('rankings_database.json'),
    voices: J('voice-profiles.json').profiles || {}, format: 'big-brother',
    airingCast: (doc.placements || []).map(p => p.playerSlug || p.name).filter(Boolean) });
  const panel = seasonPanel(hosts, { format: 'big-brother' });
  const nights = [2, 3, 4].map(episode => {
    const feed = episodeFeed({ doc, stored: [], format: 'big-brother', season: 1, episode });
    return { feed, msgs: buildChatMessages(feed.events, episodeSpeakers(panel, feed.events, { players, episode }), { format: 'big-brother', season: 1, episode, seed: 977 + episode }) };
  });

  it('says the moments it covers in so many words', () => {
    // by player and kind: a busy night covers some of a player's moments, not all of them
    let said = 0, of = 0;
    for (const { feed, msgs } of nights) {
      const groups = new Map();
      for (const ev of feed.events.filter(e => e.moment && e.subject)) {
        const k = `${ev.kind}|${ev.subject}`;
        (groups.get(k) || groups.set(k, []).get(k)).push(factOf(ev, { onDanger: 'on the block', challenge: 'competition' }));
      }
      for (const [k, facts] of groups) {
        const about = msgs.filter(m => `${m.kind}|${m.subject}` === k && !m.replyTo);
        if (!about.length) continue;
        of++;
        if (about.some(m => facts.some(f => m.text.includes(f)))) said++;
      }
    }
    expect(of).toBeGreaterThan(5);
    expect(said).toBe(of);
  });

  it('answers a host who spoke before, by name, right under that conversation', () => {
    let replies = 0;
    for (const { msgs } of nights) msgs.forEach((m, i) => {
      if (!m.replyTo) return;
      replies++;
      const to = msgs.find(x => x.id === m.replyTo);
      expect(to, m.text).toBeTruthy();
      expect(m.text.startsWith(`@${to.author} `)).toBe(true);
      expect(msgs.indexOf(to)).toBeLessThan(i);
      expect(to.at).toBeLessThan(m.at);
    });
    expect(replies).toBeGreaterThan(5);
  });

  it('never pities a winner or congratulates the one it happened to', () => {
    for (const { msgs } of nights) for (const m of msgs) {
      expect(m.text).not.toMatch(/undefined|\{|\}/);
      if (roleOf(m) === 'win') expect(m.text, m.text).not.toMatch(/Poor |deserved better|impossible spot/);
    }
  });
});
