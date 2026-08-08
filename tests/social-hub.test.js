// Two intentions that were sitting in the same column looking alike.
//
// Sync catches the feed up on any night that has NO posts. What it never does
// is rewrite a night that already has them — what the audience said about an
// episode somebody watched is not a thing to re-roll on every sync. Both of
// those are right, and neither is obvious from a column of identical buttons,
// so the rewriting controls now live in their own section away from sync.
//
// The whole-season one is destructive in a way nothing else here is: every post
// the season holds, engagement included, thrown away for new text with new
// counts. It asks first.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const HTML = fs.readFileSync('simulator.html', 'utf8');
const RUN = fs.readFileSync('js/run-ui.js', 'utf8');
const LIVE = fs.readFileSync('js/social/live.js', 'utf8');

const fnBody = (src, name, len = 2400) => {
  const at = src.indexOf(`function ${name}(`);
  return at === -1 ? '' : src.slice(at, at + len);
};

describe('sync fills gaps and does not overwrite', () => {
  it('still catches the feed up before publishing', () => {
    // An episode played in a session where the refresh failed must not go out
    // silent, so sync remains the safety net. It just is not the redo button.
    const src = fs.readFileSync('js/stats-export.js', 'utf8');
    // Asserted on the call and its reason together, rather than by slicing a
    // fixed window out of a named function — the first version of this sliced
    // 1800 characters from the wrong offset and read a completely different
    // function, then failed for a reason that had nothing to do with sync.
    expect(src).toMatch(/Catch the feed up before reading it[\s\S]{0,320}refreshSocialFeed\(\);/);
  });

  it('skips any night that already has posts', () => {
    // The line the whole distinction rests on.
    expect(LIVE).toMatch(/if \(!rebuild && hasEpisode\(gs, episode\)\) continue;/);
  });
});

describe('the Social Hub', () => {
  it('is its own labelled section', () => {
    expect(HTML).toMatch(/season-controls-label">Social Hub</);
  });

  it('holds both rewriting controls and nothing else does', () => {
    expect(HTML).toMatch(/onclick="redoEpisodeSocial\(\)"/);
    expect(HTML).toMatch(/onclick="rebuildSeasonSocial\(\)"/);
    // One occurrence each: a rewrite offered from two places is a rewrite
    // somebody presses by accident.
    expect(HTML.match(/rebuildSeasonSocial\(\)/g)).toHaveLength(1);
    expect(HTML.match(/redoEpisodeSocial\(\)/g)).toHaveLength(1);
  });

  it('says which half of the feed it can even touch', () => {
    // The alumni room is derived at render time, so it is already current on
    // every season and no button applies to it. Somebody pressing rebuild to
    // fix the room would be waiting for something that already happened.
    expect(HTML).toMatch(/alumni room is rebuilt every time you open it/i);
  });
});

describe('rebuilding the season', () => {
  const fn = fnBody(RUN, 'rebuildSeasonSocial');

  it('exists and is reachable from the page', () => {
    expect(fn, 'rebuildSeasonSocial was never written').not.toBe('');
    expect(RUN).toMatch(/export async function rebuildSeasonSocial/);
  });

  it('asks before throwing anything away', () => {
    expect(fn, 'no confirmation on a destructive rebuild').toMatch(/confirm\(/);
    expect(fn).toMatch(/no undo/i);
    // And the prompt says how much is at stake, in posts and episodes.
    expect(fn).toMatch(/\$\{had\}/);
    expect(fn).toMatch(/\$\{eps\}/);
  });

  it('does nothing at all when the answer is no', () => {
    expect(fn).toMatch(/if \(!ok\) return;/);
    expect(fn.indexOf('if (!ok) return;'))
      .toBeLessThan(fn.indexOf('rebuild: true'));
  });

  it('rebuilds everything rather than one night', () => {
    // `rebuild` with no `only` is the whole season. Passing `only` here would
    // silently make the widest operation the narrowest one — the same mistake
    // in reverse cost the per-episode hatch its narrowing once already.
    expect(fn).toMatch(/rebuild: true/);
    expect(fn, 'the season rebuild narrowed itself to one episode').not.toMatch(/only:/);
  });

  it('goes through the writer when the writer is on', () => {
    expect(fn).toMatch(/socialWriterOn/);
    expect(fn).toMatch(/refreshSocialFeedWritten/);
    expect(fn).toMatch(/refreshSocialFeed\?\./);
  });

  it('saves, so a rebuild survives the tab closing', () => {
    expect(fn, 'the new feed is only in memory').toMatch(/saveGameState\(\)/);
  });

  it('refuses politely with no season loaded', () => {
    expect(fn).toMatch(/gs\.initialized/);
    expect(fn.indexOf('gs.initialized')).toBeLessThan(fn.indexOf('confirm('));
  });

  it('reports the failure rather than looking like it worked', () => {
    expect(fn).toMatch(/catch \(err\)/);
    expect(fn).toMatch(/could not be rebuilt/);
  });
});

describe('each room shows its own posts', () => {
  const PAGE = fs.readFileSync('js/social-page.js', 'utf8');

  it('keeps the group-chat register off the timeline', () => {
    // `buildEpisodeFeed` samples BOTH streams into one store — about 112
    // timeline posts an episode and 32 chat ones. Birdie rendered the store
    // unfiltered, so a fifth of the timeline was written in the other room's
    // voice: full sentences, insider vocabulary, the exact thing the two-room
    // split exists to prevent.
    const fn = PAGE.slice(PAGE.indexOf('const stream = () =>'),
      PAGE.indexOf('const stream = () =>') + 200);
    expect(fn, 'Birdie is still rendering the chat stream')
      .toMatch(/filter\(p => p\.stream !== 'chat'\)/);
  });

  it('leaves the alumni room reading its own builder', () => {
    // ChatAlumni does not read stored posts at all — it is built from the
    // episode's events every time it is opened, which is why no rebuild button
    // applies to it.
    expect(PAGE).toMatch(/S\.messages = buildChatMessages\(/);
    const fn = PAGE.slice(PAGE.indexOf('const stream = () =>'),
      PAGE.indexOf('const stream = () =>') + 200);
    expect(fn).toMatch(/: S\.messages/);
  });
});

describe('the members of the room are real', () => {
  // platforms.js describes the chat as "alumni host, members reply", and the
  // sampler has been writing those member posts since it existed — in this
  // room's considered register, at 0.45 hostility, about the actual event, from
  // named personas. `chat.js` then built the HOSTS properly and implemented the
  // members as 38 hardcoded strings that do not know who was evicted.
  //
  // Same feature, written twice, and only the worse half was plugged in.
  const CHAT = fs.readFileSync('js/social/chat.js', 'utf8');
  const PAGE = fs.readFileSync('js/social-page.js', 'utf8');

  it("takes the episode's own chat posts", () => {
    expect(CHAT).toMatch(/crowd = \[\],/);
    expect(PAGE, 'the page still never hands them over')
      .toMatch(/crowd: S\.feed\.posts\.filter\(p => p\.stream === 'chat'\)/);
  });

  it('answers the moment it is under', () => {
    // A comment about the eviction, under the post about the eviction. Indexed
    // by kind rather than drawn at random, or the room is a shuffle.
    expect(CHAT).toMatch(/crowdByKind/);
    expect(CHAT).toMatch(/crowdByKind\.get\(m\.kind\)/);
  });

  it("keeps the member's name", () => {
    // `member417` is not a person. The sampler already decided who said it.
    expect(CHAT).toMatch(/author: p\.handle \|\| p\.name/);
  });

  it('still has something to say when there is no crowd', () => {
    // An archive season, or a caller that predates this: the room falls back to
    // the static pool rather than losing its comments entirely.
    expect(CHAT).toMatch(/pickFresh\(COMMENTS, rng, usedComments/);
    expect(CHAT).toMatch(/if \(from\.length\)/);
  });
});
