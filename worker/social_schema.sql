-- The airing season's social feed.
-- Apply with:  npx wrangler d1 execute dc-franchise --remote --file social_schema.sql
-- Safe to re-run.
--
-- Companion to live_season: that table says where everyone stands, this one says
-- what the audience thinks about it. Both belong to the season CURRENTLY AIRING
-- and both are cleared when it finishes — a feed is a live artefact, not part of
-- a season's permanent record.
--
-- Rows are written whole and replaced whole (delete-then-insert per season), so
-- there is no update path and no partial state. `id` is the post id the
-- simulator generated, which stays stable across rebuilds, so a published feed
-- can be diffed against the one in memory.

CREATE TABLE IF NOT EXISTS social_posts (
  id            TEXT PRIMARY KEY,     -- 'p-<season>-<episode>-<n>'
  format        TEXT NOT NULL,        -- 'total-drama' | 'big-brother'
  season_number INTEGER NOT NULL,
  episode       INTEGER NOT NULL,
  stream        TEXT NOT NULL,        -- 'timeline' (public) | 'chat' (alumni)
  handle        TEXT,
  author        TEXT,
  topic         TEXT,
  kind          TEXT,                 -- the moment being reacted to
  subject       TEXT,                 -- player slug, when the post is about one
  body          TEXT NOT NULL,
  at_ms         INTEGER NOT NULL,     -- ms into the episode; the feed replays in this order
  reply_to      TEXT,                 -- another post's id, for a ratio
  likes         INTEGER DEFAULT 0,
  tomatoes      INTEGER DEFAULT 0
);

-- The feed page reads one episode at a time, in timestamp order.
CREATE INDEX IF NOT EXISTS idx_social_episode
  ON social_posts (format, season_number, episode, at_ms);

-- A player page reads everything said about that player.
CREATE INDEX IF NOT EXISTS idx_social_subject ON social_posts (subject);
