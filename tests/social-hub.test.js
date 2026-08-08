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

describe('the publish button says what it sends', () => {
  it('does not call a whole-season publish an episode', () => {
    // `socialPublishPayload` sends `store.posts` — every night the season has —
    // while the label said "Sync episode to site". The word "episode" is true
    // of the STANDINGS riding along with it and false of the feed, and the gap
    // is why somebody has to ask whether their rebuild actually went out.
    // Scoped to the button, not the file: the comment above it QUOTES the old
    // label to explain why it changed, and a whole-file search matched the
    // explanation and failed on the fix.
    const btn = HTML.slice(HTML.indexOf('id="live-sync-btn"'),
      HTML.indexOf('id="live-sync-btn"') + 400);
    expect(btn).toMatch(/🔴 Publish to site/);
    expect(btn, 'the label still promises one episode')
      .not.toMatch(/Sync episode to site<\/button>/);
    expect(HTML).toMatch(/every post the season has/i);
  });

  it('counts what it published', () => {
    const src = fs.readFileSync('js/stats-export.js', 'utf8');
    expect(src).toMatch(/Publishing episode \$\{snap\.episode\}/);
    expect(src, 'the status line still hides the feed').toMatch(/_postCount/);
  });

  it('still sends the whole store, which is the point', () => {
    const src = fs.readFileSync('js/social/session.js', 'utf8');
    expect(src).toMatch(/toPublishPayload\(gs, \{/);
    const store = fs.readFileSync('js/social/store.js', 'utf8');
    expect(store).toMatch(/posts: store\.posts\.map/);
  });
});

describe('the writer switch explains itself in the right show', () => {
  // ── read what is SHOWN, not the source around it ──
  //
  // Twice now a guard on user-facing copy has failed because the comment
  // explaining the change quotes the wording it replaced, and a slice of raw
  // source cannot tell an explanation from the thing it explains. Comments
  // stripped, and the window is taken from the markup boundaries rather than a
  // guessed character count — the first version stopped 1400 characters in,
  // half a sentence before the text it was asserting on.
  const strip = t => t.replace(/<!--[\s\S]*?-->/g, '');
  const at = HTML.indexOf('id="cfg-social-writer"');
  const opt = strip(HTML.slice(HTML.lastIndexOf('<div class="form-group">', at),
    HTML.indexOf('</div>', HTML.indexOf('</label>', at))));

  it('does not describe a Total Drama season in Big Brother words', () => {
    // The same fault the alumni room had, on a settings screen that runs both
    // shows: "Anything naming a houseguest or a week that did not happen".
    expect(opt, 'the switch still says houseguest').not.toMatch(/houseguest/i);
    expect(opt, 'the switch still counts in weeks').not.toMatch(/which week/i);
  });

  it('names the worker that actually serves it', () => {
    // It said "your Season Builder worker". The social endpoint is
    // dc-analytics, so anybody reading this to find out why nothing happened
    // was being sent to look at the wrong deployment.
    expect(opt).toMatch(/dc-analytics/);
    expect(opt).not.toMatch(/Season Builder worker/);
  });

  it('says what it costs and what happens when it fails', () => {
    expect(opt).toMatch(/six/i);
    expect(opt, 'no mention of what a failure costs').toMatch(/nothing at all/);
  });

  it('is a checkbox somebody can actually tick', () => {
    expect(opt).toMatch(/<input type="checkbox" id="cfg-social-writer"/);
    // Wrapped in the label, so the sentence is the hit area rather than 14px.
    expect(opt).toMatch(/<label[^>]*>\s*<input type="checkbox" id="cfg-social-writer"/);
  });
});

describe('the writer says which of three things happened', () => {
  const fn = RUN.slice(RUN.indexOf('function _writerNote'),
    RUN.indexOf('function _writerNote') + 1200);

  it('exists at all', () => {
    expect(fn, '_writerNote was never written').not.toBe('');
  });

  it('tells "switch was off" from "returned nothing"', () => {
    // These printed the identical line — just a post count — so a run with the
    // switch off and a run where the worker refused every post were
    // indistinguishable. There was nothing to do with that message except ask
    // somebody, which is what happened.
    expect(fn).toMatch(/the AI writer is off/);
    expect(fn).toMatch(/returned nothing usable/);
    expect(fn, 'a failed run does not say where to look').toMatch(/worker is reachable/);
  });

  it('counts rejections as a list, not as a number', () => {
    // `rejected` is the array of what was thrown out. Reading it with Number()
    // gives NaN, which falls to 0, which silently never mentions any of them —
    // and the rejections are the interesting half.
    expect(fn).toMatch(/Array\.isArray\(res\?\.rejected\)/);
    expect(fn).toMatch(/res\.rejected\.length/);
  });

  it('is used by both buttons', () => {
    const uses = RUN.match(/_writerNote\(written, res\)/g) || [];
    expect(uses.length, 'one of the two buttons still reports the old way')
      .toBe(2);
  });

  it('reads the switch as a real boolean', () => {
    // `window.socialWriterOn?.()` is undefined when the module is not exposed,
    // which is falsy and would have reported "the writer is off" for a wiring
    // fault. Comparing to true keeps the three states honest.
    const calls = RUN.match(/window\.socialWriterOn\?\.\(\) === true/g) || [];
    expect(calls.length).toBe(2);
  });
});
