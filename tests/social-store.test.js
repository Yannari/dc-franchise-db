// Where a season's feed lives, and what must never happen to it.
//
// The load-bearing test in this file is the last one: gs.social must stay OUT of
// snapshotGameState's whitelist. A feed is thousands of posts a season, and this
// codebase has already shipped exactly that mistake once with the weeks ledger —
// every episode snapshot carrying every record written before it, history growing
// quadratically, gs reaching 19MB.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  emptyStore, storeOf, addEpisodePosts, postsForEpisode, postsAbout,
  hasEpisode, bumpEngagement, toPublishPayload, clearStore, SOCIAL_VERSION,
} from '../js/social/store.js';

const post = (id, over = {}) => ({
  id, season: 1, episode: 1, format: 'big-brother', stream: 'timeline',
  handle: '@x', name: 'x', topic: 'blindside-reaction', kind: 'blindside',
  subject: 'heather', text: 'a post', at: 1000, replyTo: null,
  likes: 10, tomatoes: 0, ...over,
});

describe('the store', () => {
  it('creates itself on first use rather than needing setup', () => {
    const gs = {};
    expect(storeOf(gs).posts).toEqual([]);
    expect(gs.social.version).toBe(SOCIAL_VERSION);
  });

  it('repairs a store that was saved before a field existed', () => {
    // Save files outlive schemas. A store missing `builtEpisodes` must not throw
    // on load — it must come back usable.
    const gs = { social: { version: 1 } };
    expect(storeOf(gs).builtEpisodes).toEqual([]);
    expect(storeOf(gs).posts).toEqual([]);
  });

  it('does not hand two callers the same empty store', () => {
    const a = emptyStore(); a.posts.push(post('p-1'));
    expect(emptyStore().posts).toEqual([]);
  });
});

describe('adding an episode', () => {
  it('keeps posts in episode then time order', () => {
    const gs = {};
    addEpisodePosts(gs, 2, [post('p-b', { episode: 2, at: 500 })]);
    addEpisodePosts(gs, 1, [post('p-a', { episode: 1, at: 900 })]);
    expect(storeOf(gs).posts.map(p => p.id)).toEqual(['p-a', 'p-b']);
    expect(storeOf(gs).builtEpisodes).toEqual([1, 2]);
  });

  it('REPLACES an episode when it is rebuilt, never appends', () => {
    // Pressing the button twice must not double a night's feed. The duplicates
    // would be invisible — every post is legitimately different text from a
    // different persona, so nothing looks wrong until you count.
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1'), post('p-2')]);
    const after = addEpisodePosts(gs, 1, [post('p-3')]);
    expect(after).toBe(1);
    expect(postsForEpisode(gs, 1).map(p => p.id)).toEqual(['p-3']);
    expect(storeOf(gs).builtEpisodes).toEqual([1]);
  });

  it('leaves other episodes alone when one is rebuilt', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1')]);
    addEpisodePosts(gs, 2, [post('p-2', { episode: 2 })]);
    addEpisodePosts(gs, 1, [post('p-1b')]);
    expect(postsForEpisode(gs, 2).map(p => p.id)).toEqual(['p-2']);
  });

  it('says which episodes have a feed', () => {
    const gs = {};
    expect(hasEpisode(gs, 1)).toBe(false);
    addEpisodePosts(gs, 1, [post('p-1')]);
    expect(hasEpisode(gs, 1)).toBe(true);
    expect(hasEpisode(gs, 2)).toBe(false);
  });
});

describe('reading it back', () => {
  it('finds every post about a player, for their page', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [
      post('p-1', { subject: 'heather' }),
      post('p-2', { subject: 'alejandro' }),
      post('p-3', { subject: 'heather' }),
    ]);
    expect(postsAbout(gs, 'heather').map(p => p.id)).toEqual(['p-1', 'p-3']);
    expect(postsAbout(gs, 'HEATHER').map(p => p.id)).toEqual(['p-1', 'p-3']);
    expect(postsAbout(gs, null)).toEqual([]);
  });
});

describe('engagement arriving late', () => {
  it('adds rather than assigns, so two nudges do not overwrite each other', () => {
    // This is why posts are stored instead of regenerated: a post can be
    // ratioed hours after it was written.
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1', { likes: 10, tomatoes: 0 })]);
    bumpEngagement(gs, 'p-1', { likes: 5 });
    bumpEngagement(gs, 'p-1', { likes: 5, tomatoes: 40 });
    const p = postsForEpisode(gs, 1)[0];
    expect(p.likes).toBe(20);
    expect(p.tomatoes).toBe(40);
  });

  it('never drives a counter negative, and says so when a post is gone', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1', { likes: 3 })]);
    expect(bumpEngagement(gs, 'p-1', { likes: -99 }).likes).toBe(0);
    expect(bumpEngagement(gs, 'nope', { likes: 1 })).toBe(null);
  });
});

describe('publishing', () => {
  it('sends the posts and not the bookkeeping', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1')]);
    const payload = toPublishPayload(gs, { season: 1, format: 'big-brother' });
    expect(payload.posts).toHaveLength(1);
    expect(payload.season).toBe(1);
    expect(payload).not.toHaveProperty('builtEpisodes');
  });

  it('copies rather than handing out the live posts', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1', { likes: 10 })]);
    toPublishPayload(gs).posts[0].likes = 999;
    expect(postsForEpisode(gs, 1)[0].likes).toBe(10);
  });

  it('starts a new season silent', () => {
    const gs = {};
    addEpisodePosts(gs, 1, [post('p-1')]);
    clearStore(gs);
    expect(storeOf(gs).posts).toEqual([]);
    expect(storeOf(gs).builtEpisodes).toEqual([]);
  });
});

describe('the rule that stops history growing quadratically', () => {
  it('is not in snapshotGameState\'s whitelist', () => {
    // A feed is 60-150 posts an episode; a season is thousands. If `social`
    // joined that whitelist, every episode snapshot would carry every post
    // written before it — the exact shape that took gs to 19MB with the weeks
    // ledger, and whose fix is recorded in that function's own comment.
    //
    // The whitelist is opt-in, so this passes today by default. It exists so
    // that adding one line to savestate.js fails HERE, loudly, with the reason,
    // rather than being noticed months later as a save file that will not load.
    const src = readFileSync(join(process.cwd(), 'js/savestate.js'), 'utf8');
    const start = src.indexOf('export function snapshotGameState()');
    expect(start, 'snapshotGameState has moved or been renamed').toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('\n}', start));
    expect(/\bsocial\s*:/.test(body),
      'gs.social was added to the episode snapshot — a season of posts is now copied into every episode')
      .toBe(false);
  });
});
