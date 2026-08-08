// worker/queries.js
// The SQL, as pure functions.
//
// Split out of worker-studio.js so the tests can run THE SAME STRINGS the worker
// runs. They were inline template strings, which a test can only re-declare —
// and a re-declared copy silently stops matching the code it claims to test.
// This project has been bitten by that three times.
//
// These take no `env` and touch no network: they build SQL and nothing else.

/**
 * The leaderboard.
 *
 * `expr` and `dir` come from the caller's own whitelist, never from a user.
 * `format` restricts which show's appearances are counted; null counts every
 * show, which is the DEFAULT and must stay that way — a Big Brother appearance
 * must never drop a player off a Total Drama board.
 *
 * Binds: [format?] , minSeasons, limit
 */
export function leaderboardQuery({ expr, dir, format = null }) {
  return `
    SELECT p.id, p.name, p.tier,
           ${expr} AS value,
           COUNT(*) AS seasonsPlayed
    FROM appearances a
    JOIN players p ON p.id = a.player_id
    LEFT JOIN td_appearances td
           ON td.player_id = a.player_id AND td.season_number = a.season_number
          AND a.format = 'total-drama'
    ${format ? 'WHERE a.format = ?' : ''}
    GROUP BY p.id, p.name, p.tier
    HAVING COUNT(*) >= ?
    ORDER BY value ${dir}, seasonsPlayed DESC, p.name ASC
    LIMIT ?`;
}

/**
 * Everybody who played a season with this player.
 *
 * "Same season" means same FORMAT and same number — without the format clause,
 * Total Drama 1 and Big Brother 1 would report each other's casts.
 *
 * The shared seasons carry their show: GROUP_CONCAT of the number alone yielded
 * "1,1" for a castmate shared across both shows, which cannot be told apart.
 *
 * Binds: playerId
 */
export function castmatesQuery() {
  return `SELECT p.id, p.name, p.tier,
                 COUNT(*) AS sharedSeasons,
                 GROUP_CONCAT(them.format || '-' || them.season_number) AS seasons
          FROM appearances me
          JOIN appearances them ON them.season_number = me.season_number
                               AND them.format = me.format
                               AND them.player_id <> me.player_id
          JOIN players p ON p.id = them.player_id
          WHERE me.player_id = ?
          GROUP BY p.id, p.name, p.tier
          ORDER BY sharedSeasons DESC, p.name ASC
          LIMIT 100`;
}

/**
 * Bonds, looked at from both sides.
 *
 * Many pairs are recorded from BOTH sides (a->b and b->a), hence DISTINCT or
 * allies show up twice.
 *
 * FORMAT is part of the identity. Without it, a pair bonded in Total Drama 1 AND
 * Big Brother 1 collapsed to a single row — one of the two relationships gone
 * from the response entirely, which is data loss rather than ambiguity.
 *
 * Binds: playerId (as ?1)
 */
export function bondsQuery() {
  return `SELECT DISTINCT
                 CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END AS id,
                 p.name, b.format AS format, b.season_number AS season
          FROM bonds b
          JOIN players p ON p.id = CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END
          WHERE b.player_id = ?1 OR b.ally_id = ?1
          ORDER BY b.format, b.season_number`;
}

// ── the airing season's social feed ──────────────────────────────────────

/**
 * Replace one season's feed.
 *
 * Scoped by (format, season) rather than a bare DELETE: two shows can be airing
 * at once, and clearing the whole table to publish one of them would take the
 * other's feed down with it.
 *
 * Binds: format, seasonNumber
 */
export function socialDeleteSeasonQuery() {
  return 'DELETE FROM social_posts WHERE format = ? AND season_number = ?';
}

/**
 * One post.
 *
 * Column order is the bind order — the fifteen values in socialStatements line
 * up with this list and nothing else checks that they do, which is exactly why
 * the string lives here where a test can run it.
 */
export function socialInsertQuery() {
  return `INSERT INTO social_posts (id,format,season_number,episode,stream,handle,author,
            topic,kind,subject,body,at_ms,reply_to,likes,tomatoes)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
}

/**
 * Read a feed back, in the order it arrived.
 *
 * `ORDER BY episode, at_ms` is load-bearing rather than tidy: the page replays
 * posts in this order, so a reaction to the vote must not sort before the vote.
 * `id` breaks ties so two posts written in the same millisecond keep a stable
 * order across reloads.
 *
 * Binds: format, seasonNumber [, episode]
 */
export function socialSelectQuery({ episode = false } = {}) {
  return 'SELECT * FROM social_posts WHERE format = ? AND season_number = ?'
    + (episode ? ' AND episode = ?' : '')
    + ' ORDER BY episode, at_ms, id';
}
