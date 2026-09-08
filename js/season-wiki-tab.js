// ══════════════════════════════════════════════════════════════════════
// season-wiki-tab.js — a season as a reference article
// ══════════════════════════════════════════════════════════════════════
//
// This was an 858-line IIFE inside season_ref.html's page script, which meant
// the single function deciding what a season page SAYS about a show could not
// be called by a test, a tool or another page. It has now been wrong about a
// whole show twice — a camp drew a memory wall and four empty sections, and a
// runway drew a Power of Veto column — and both times the defect shipped
// because nothing could ask it for its output.
//
// The move here was mechanical: the body is unchanged except where it asks
// the registry which SHAPE the rounds are instead of which array came back
// non-empty. `s` is the published season document; the return is HTML.
import {
  DEFAULT_FORMAT, showWords, showName, exitVerbs, roundExits, publicBallots,
  roundShape, seasonRounds,
} from './shows.js';
import { buildTrackRecordGrid, RESULT_LABELS } from './dr/grid.js';
import { avatarUrl } from './avatar-registry.js';

export function buildWikiTab(s, { face = null } = {}) {
  const shows = { DEFAULT_FORMAT, showWords, showName, exitVerbs, roundExits, publicBallots,
    roundShape, seasonRounds };
  /* The page's own portrait resolver, which knows about `avatarFile`
     overrides and a by-name index this module has no business rebuilding. It
     is injected rather than imported so the builder stays callable with
     nothing but a document — the default is the same last-resort path the
     page falls back to anyway. */
  /* THE DEFAULT ASKS THE RESOLVER; IT DOES NOT BUILD A PATH.
     The first version of this concatenated the avatars directory with a slug
     tests/no-direct-avatar-paths.test.js exists to forbid — and forbids for a
     real reason: with a portrait now a per-season choice, a slug cannot answer
     "which of this person's looks does this season use?", so a built path
     draws the wrong face confidently. `avatarUrl` is the one place that
     question is allowed to be answered. */
  const srFace = face || ((row, fallbackSlug, name) => avatarUrl({
    playerSlug: fallbackSlug || row?.playerSlug || row?.slug
      || String(row?.name || name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    avatarId: row?.avatarId,
    avatarFile: row?.avatarFile,
    show: s?.format || DEFAULT_FORMAT,
  }));
      /* ── ONE SHAPE FROM TWO SHOWS ──────────────────────────────────
         Big Brother exports `weeks` — a Head of Household, a block, a veto,
         a vote. Total Drama exports `votingHistory` — an episode, a boot,
         and every ballot cast, which it has carried since long before Big
         Brother existed here.
         Built on `weeks` alone, this whole tab drew a memory wall and four
         empty sections for every Total Drama season on the site.
         So both are normalised to ROUNDS, and each section then asks for
         what it needs: the voting grid works from either, the competition
         grid needs a block and a veto and says so when there is not one. */
      /* ── WHOSE SHOW THIS IS ────────────────────────────────────────
         Taken from the document, then the reference, then the bare-integer
         rule — never from `bbWeeks.length`, which is a two-way answer to a
         question that now has three. Every word below comes from here. */
      const fmt = s.format || shows.DEFAULT_FORMAT;
      const W = shows.showWords(fmt);
      const VERBS = shows.exitVerbs(fmt);
      const cap = t => String(t || '').replace(/^./, c => c.toUpperCase());
      const bbWeeks = Array.isArray(s.weeks) ? s.weeks : [];
      const tdRounds = (Array.isArray(s.votingHistory) ? s.votingHistory : []).map(ep => {
        /* THE BALLOTS THE AUDIENCE SAW. A show with a second, secret ballot
           keeps both on `votes[]`, and this page is the public record of the
           season — counting the conclave's names into the room's tally would
           print the show's central secret as an eviction margin. */
        const seen = shows.publicBallots(ep, fmt);
        return {
          week: ep.episode,
          /* `eliminated` is the VOTE and only the vote, which is why a
             Traitors season rendered with half its cast never leaving.
             `exits` is everybody who left this round, each with the verb that
             removed them; `evicted` stays the first of them so every reader
             written for a one-door show keeps working unchanged. */
          exits: shows.roundExits(ep, fmt),
          evicted: shows.roundExits(ep, fmt)[0]?.name || ep.eliminated || '',
          ballots: seen.map(v => ({ voter: v.voter, evict: v.target })),
          votes: seen.reduce((acc, v) => {
            if (v.target) acc[v.target] = (acc[v.target] || 0) + 1;
            return acc;
          }, {}),
          winner: ep.winner || ep.challengeWinner || '',
          immunityWinner: ep.immunityWinner || '',
          initialNominees: [], finalNominees: [],
        };
      });
      /* ── WHICH ARRAY, ASKED OF THE REGISTRY ────────────────────────
         `hasBlock = bbWeeks.length > 0` was a two-way answer to a question
         that has three answers, and this page decided its ENTIRE layout from
         it: a show exporting `weeks` would have been drawn a Power of Veto
         column whatever its comps are called, and a show exporting NEITHER
         array — one whose rounds are placements, because nobody in it votes
         — fell into the camp branch and was drawn a memory wall above four
         empty sections. Which is what a camp used to get, for the same
         reason, before this page learned there were two shows. */
      const shape = shows.roundShape(fmt);
      /* NORMALISED TO THE PAGE'S ROUND SHAPE, the same way `tdRounds` is.
         Everything below keys a round off `w.week`, and a placement episode
         numbers itself `episode` — so leaving it alone gave every queen an
         `outWeek` of undefined, which printed "Episode undefined" seven times
         in the game history and made the memory wall fall back to `p.status`:
         "Sashayed away" under the WINNER's photo. Renaming the field once,
         here, is the whole fix. */
      const drEpisodes = shape === 'placements'
        ? shows.seasonRounds(s, fmt).map((e, i) => ({
          ...e,
          week: Number(e.episode ?? i + 1),
          exits: shows.roundExits(e, fmt),
          // The maxi winner is this show's answer to "who held the power".
          winner: (e.placements || []).find(x => x.result === 'WIN')?.name || '',
          initialNominees: [], finalNominees: [], votes: {}, ballots: [],
        }))
        : [];
      const weeks = shape === 'placements' ? drEpisodes
        : (bbWeeks.length ? bbWeeks : tdRounds);
      // What the round is CALLED — the registry's word, not the house's.
      const roundWord = W.round || 'Episode';
      const hasBlock = shape === 'weeks';
      /* Everybody who left a round, in the one shape. A Big Brother week has
         no `exits[]`, so it is normalised here the same way `roundExits`
         normalises a round: one entry, the show's own verb. */
      const exitsOf = w => (Array.isArray(w?.exits) && w.exits.length
        ? w.exits
        : (w?.evicted ? [{ name: w.evicted, verb: W.exit, channel: 'vote' }] : []));
      const cast = (s.placements || []).slice().sort((a, b) => a.placement - b.placement);
      if (!cast.length) return '<p class="sr-thin">No cast recorded for this season.</p>';

      const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const av = p => `<img src="${esc(srFace(p, p.playerSlug))}" alt=""
        onerror="this.style.visibility='hidden'">`;
      /* "3th" and "2th" were on the wall. A placement is an ordinal and
         `${n}th` is only right two thirds of the time. */
      const ord = n => {
        const v = Number(n);
        if (!Number.isFinite(v)) return '—';
        const t = v % 100;
        if (t >= 11 && t <= 13) return `${v}th`;
        return `${v}${['th', 'st', 'nd', 'rd'][v % 10] || 'th'}`;
      };

      /* ── who left when ──
         The wall greys somebody out from the week they leave, so the grid
         reads as a house emptying rather than a table with gaps in it. */
      /* `winner` is an object on a season document — {name, playerSlug, vote,
         runnerUp, keyStats} — and printing it gave "[object Object]" in the
         facts table. The name is what this section wants; the rest of it is
         the Overview tab's job. */
      const winnerName = typeof s.winner === 'string' ? s.winner : (s.winner?.name || '');
      /* Everybody who finished first, and the best-placed person who did not.
         Read off the placements, which is the only record that holds more
         than one of either. */
      const champions = cast.filter(p => Number(p.placement) === 1);
      const runnerUp = cast.find(p => Number(p.placement) > 1) || null;

      /* A FINALIST IS NEVER EVICTED, whatever the last round says.
         Total Drama's final vote is recorded like any other — a round with an
         "eliminated" on it — so the winner came out of this loop marked as
         gone, and the wall greyed the champion out and blanked his last
         columns in the grid. Anybody who reached the end is held out of it. */
      const finalists = new Set([
        ...(s.finalists || []).map(f => f.name || f).filter(Boolean),
        ...(winnerName ? [winnerName] : []),
        ...cast.filter(p => p.placement === 1).map(p => p.name),
      ]);
      /* A RETURNEE LEAVES TWICE, and the wall only ever showed the second
         one. Jane was evicted in week 7 of Big Brother 1, won her way back in
         through the Battle Back, and went out again in week 15 — a fact the
         record holds in full and the page reduced to "Week 15", which reads as
         somebody who was never touched until the end.

         `outWeek` stays the LAST exit, because that is the one that greys the
         wall and blanks the grid. `exits` keeps all of them, and `awayWeeks`
         is the stretch in between: a week where somebody has already been
         evicted and appears nowhere in the record — no ballot, no chair, no
         vote against them — is a week they were not in the house for, and the
         grid should say so rather than drawing them as quietly safe. */
      /* ── A WEEK NUMBER IS NOT A POSITION ANY MORE ──────────────────────
         A double eviction is ONE night with two evictions, and the engine
         models the compressed second cycle as its own record — so two records
         now share a week number, the way every Big Brother wiki writes a
         double. Anything asking "is this after they left" therefore has to
         compare POSITIONS in the ledger, or the person who went first in the
         double reappears in the second half of their own eviction night.

         `outWeek` stays the number, because that is what a reader is told. */
      const outWeek = {};
      const outAt = {};        // name -> index of their last exit
      const exits = {};        // name -> every week number they left on
      const exitIdx = {};      // name -> every index they left at
      /* EVERY DOOR OUT. This walked `w.evicted`, so on a show with a second
         way out the people who left by it were never recorded as leaving at
         all: they stayed lit on the wall, unfaded in the grid, and their card
         read a placement with no exit under it. */
      const exitVerbOf = {};   // name -> the word for the door THEY left by
      weeks.forEach((w, i) => {
        for (const x of exitsOf(w)) _recordExit(w, i, x);
      });
      function _recordExit(w, i, x) {
        // A finalist is never "evicted" — except at the finale, where third
        // place is cut and that IS their exit. Only the two who sat in the
        // final vote are protected.
        const protectedName = finalists.has(x.name)
          && (cast.find(p => p.name === x.name)?.placement || 99) <= 2;
        if (x.name && !protectedName) {
          exitVerbOf[x.name] = x.verb || W.exit;
          outWeek[x.name] = w.week;
          outAt[x.name] = i;
          (exits[x.name] = exits[x.name] || []).push(w.week);
          (exitIdx[x.name] = exitIdx[x.name] || []).push(i);
        }
      }
      const inWeek = (name, w) => w.hoh === name || w.vetoWinner === name
        || w.safetyWinner === name || exitsOf(w).some(x => x.name === name)
        || (w.ballots || []).some(b => b.voter === name)
        || (w.votes || {})[name] != null
        || (w.initialNominees || []).includes(name)
        || (w.blockBeforeSafety || []).includes(name)
        || (w.finalNominees || []).includes(name);
      const awayAt = {};
      for (const [name, list] of Object.entries(exitIdx)) {
        if (list.length < 2) continue;
        const back = new Set();
        weeks.forEach((w, i) => {
          if (i > list[0] && i <= list[list.length - 1] && !inWeek(name, w)) back.add(i);
        });
        awayAt[name] = back;
      }
      /* THE WEEK WHERE NOBODY GOES HOME. It has a Head of Household and no
         ceremony, so every table below has to be told not to read it as a week
         whose record is simply missing. */
      const cancelled = w => !!w.cancelledEviction;
      const isAway = (name, i) => awayAt[name]?.has(i);
      /* ── A HOUSE HAS NOBODY QUIETLY SITTING OUT A WEEK. Every houseguest
       votes, holds the crown, sits on the block or leaves, so a week where
       somebody appears NOWHERE in the record is a week they were not in the
       house as themselves. Before their first appearance that means they had
       not arrived yet — the second half of a twin, a late addition — and
       drawing it blank says "a quiet week" about somebody who was not there.

       House only. A camp votes one tribe at a time, so a blank round there is
       normal and means nothing of the kind. */
      const firstSeen = {};
      if (hasBlock) {
        for (const p2 of cast) {
          // A week with no ceremony has nobody in its record, so it can
          // never be the week somebody first appears.
          const at = weeks.findIndex(w => !cancelled(w) && inWeek(p2.name, w));
          if (at > 0) firstSeen[p2.name] = at;
        }
      }
      const notYet = (name, i) => !cancelled(weeks[i]) && firstSeen[name] != null
        && i < firstSeen[name];

      /* ── 1. the facts ── */
      const facts = [
        // The registry's word for the people on this show. A two-way ternary
        // here counted a castle in contestants.
        ['Cast', `${s.castSize || cast.length} ${W.players}`],
        ['Episodes', s.episodeCount || weeks.length || '—'],
        /* DISTINCT week numbers, not records. A double eviction is one night
           with two of them, so counting rows said this season ran seventeen
           weeks when it ran sixteen.
           A PLACEMENT SEASON HAS NO SECOND UNIT. Its rounds ARE its episodes,
           so a "Rounds" row beneath "Episodes" would print the same number
           twice under two headings and invite the reader to look for the
           difference. */
        shape === 'placements' ? null
          : [shape === 'weeks' ? 'Weeks' : 'Rounds',
            new Set(weeks.map(w => Number(w.week))).size || '—'],
        s.jurySize ? ['Jury', `${s.jurySize} members`] : null,
        /* HOWEVER MANY WON. `winner{}` is singular and a split season leaves
           it null, so the row that exists to say who won said nothing on the
           one season where that is the interesting fact. And the runner-up
           was `cast[1]` — the SECOND ROW, which on a split is another
           champion: season 8's box named Cameron the runner-up on a page
           whose own wall gives him first place. */
        champions.length ? [champions.length > 1 ? 'Winners' : 'Winner',
          champions.map(p => esc(p.name)).join(', ')] : null,
        runnerUp ? ['Runner-up', esc(runnerUp.name)] : null,
      ].filter(Boolean);

      /* ── 2. twists ──
         DECLARED if the export carried them, derived from the weeks if not.

         The export used to carry no twist list at all, which is why this
         section told a Total Drama season that ran a dozen of them that
         "nothing in this season's record identifies a twist". It carries
         them now — the plan joined to what actually fired — so a season
         exported from today says what it ran, with the episodes it ran on,
         and older seasons keep the derived version below. */
      const declared = (Array.isArray(s.twists) ? s.twists : [])
        .filter(t => t && (t.name || t.id));
      const twists = declared.map(t => {
        const eps = (t.episodes || []).filter(Boolean);
        const when = eps.length
          ? ` ${roundWord}${eps.length === 1 ? '' : 's'} ${eps.join(', ')}.`
          : '';
        return [`${t.emoji ? `${esc(t.emoji)} ` : ''}${esc(t.name)}`,
          `${esc(t.desc || 'No description is recorded for this twist.')}${when}`];
      });
      // Derived only when the export declared nothing — otherwise the same
      // twist would be listed twice, once by name and once by its symptom.
      const derive = !declared.length;
      const arenaWeeks = weeks.filter(w => w.safetyWinner);
      if (derive && arenaWeeks.length) {
        twists.push([`BB Block Buster`, `Three nominees, and a competition on eviction night
          where one of them wins their way off the block. Played in
          ${arenaWeeks.length} week${arenaWeeks.length === 1 ? '' : 's'} —
          ${arenaWeeks.map(w => `${esc(w.safetyWinner)} (wk ${w.week})`).join(', ')}.`]);
      }
      const sanctum = weeks.filter(w => w.publicVote);
      if (derive && sanctum.length) {
        twists.push(['The Sanctum', `No secret ballot: the house voted in front of each other,
          one at a time. Week${sanctum.length === 1 ? '' : 's'} ${sanctum.map(w => w.week).join(', ')}.`]);
      }
      const threeNom = weeks.filter(w => (w.initialNominees || []).length > 2);
      if (derive && threeNom.length && !arenaWeeks.length) {
        twists.push(['Three nominees', `The Head of Household named three in
          ${threeNom.length} week${threeNom.length === 1 ? '' : 's'}.`]);
      }
      const ties = weeks.filter(w => w.tieBreak);
      if (derive && ties.length) {
        twists.push(['Tied votes', `The house split evenly ${ties.length}
          time${ties.length === 1 ? '' : 's'}, and the Head of Household broke it.`]);
      }

      /* ── 3. the memory wall ──
         The thing the house looks at every day: everybody who walked in, in
         the order they walked out. */
      /* ── THE CAST WALL ─────────────────────────────────────────────────
         WINNER FIRST, AND THE TOP THREE ARE NOT A GRID CELL.
         This was seventeen identical squares in finishing order, which is a
         list of people rather than the result of a season: the winner sat in
         the top-left corner at exactly the size of the person who left first,
         and the only thing marking them was a thin border.

         So the podium comes out of the grid. Second, first, third across the
         top the way a podium is actually stood on — the winner raised, larger
         and lit — and everybody else in a dense grid underneath with their
         finish stamped on the portrait. It also fixes the arrangement: taking
         three out of seventeen leaves fourteen, which fills its rows instead
         of stranding two cells on a line of their own.

         RANK ON THE PICTURE, not under it. A number under a name is a caption;
         a number on the corner of a portrait is a placement, and it leaves the
         line below free to say the one thing a reader actually wants — which
         week they went.

         No grey. Everybody is evicted eventually, that is a season; greying
         them costs the wall the one thing it is for. */
      /* ── WHAT EACH ONE ENDED THE SEASON AS ─────────────────────────────
         The banner every reference cast wall carries across the top of a
         portrait: Winner, Runner-Up, Jury — and on a jury card, the name they
         wrote down at the end, which is the single most-read fact on those
         pages and the one a tally can never answer. `juryBallots` is exported
         on the finale record; a season published before that says "Jury" and
         stops there rather than guessing. */
      const juryFor = {};
      for (const b of (weeks.find(w => w.finale)?.juryBallots || [])) {
        if (b.juror && b.votedFor) juryFor[b.juror] = b.votedFor;
      }
      /* "Pre-Jury" contains the word jury, which is how every houseguest who
         left before it was labelled a juror on the first draft of this wall.
         The status is exact or it is not read. */
      const juror = new Set([...(s.jury || []),
        ...cast.filter(p => /^jury$/i.test(String(p.status || '').trim())).map(p => p.name)]);
      const bannerOf = p => {
        if (p.placement === 1) return { text: 'Winner', cls: 'is-winner' };
        if (p.placement === 2) return { text: 'Runner-Up', cls: 'is-runner' };
        if (juror.has(p.name)) {
          return { text: juryFor[p.name] ? `Jury: ${juryFor[p.name]}` : 'Jury', cls: 'is-jury' };
        }
        if (p.placement <= (s.finalists || []).length) return { text: 'Finalist', cls: 'is-runner' };
        /* THE WORD FOR THE DOOR THIS PERSON LEFT BY. A two-way ternary put
           "Voted out" on all fifteen departures of a Traitors season, seven
           of which were murders, and the word "banished" appeared on the page
           zero times. There is no binary here: `exitVerbOf` is what the round
           itself recorded, and the show's default is the fallback. */
        return { text: cap(exitVerbOf[p.name] || W.exit), cls: 'is-gone' };
      };
      const ranked = cast.slice().sort((a, b) => a.placement - b.placement);
      const fateOf = p => {
        const gone = outWeek[p.name];
        if (p.placement === 1) return 'Winner';
        return gone ? `${roundWord} ${gone}` : esc(p.status || ord(p.placement));
      };
      const tipOf = p => {
        const back = (exits[p.name] || []).length > 1;
        const verb = cap(exitVerbOf[p.name] || W.exit);
        return esc(back
          ? `${p.name} — ${ord(p.placement)}. ${verb} ${roundWord.toLowerCase()} ${
            exits[p.name][0]}, came back, out again ${roundWord.toLowerCase()} ${outWeek[p.name]}.`
          : `${p.name} — ${ord(p.placement)}${outWeek[p.name]
            ? `, out in ${roundWord.toLowerCase()} ${outWeek[p.name]}` : ''}`);
      };
      const backMark = p => ((exits[p.name] || []).length > 1
        ? ' <i class="sr-wall-back" title="Came back">\u21A9</i>' : '');

      // Second, first, third — in the order a podium is stood on, so the
      // winner is in the middle and raised rather than first in a queue.
      const podium = ranked.slice(0, 3);
      const order = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;
      const podiumHtml = podium.length === 3 ? `<div class="sr-podium">${order.map(p => `
        <a class="sr-pod is-${p.placement}" href="player.html?player=${esc(p.playerSlug)}&view=wiki"
           title="${tipOf(p)}">
          <div class="sr-pod-banner ${bannerOf(p).cls}">${esc(bannerOf(p).text)}</div>
          <div class="sr-pod-photo">${av(p)}<span class="sr-pod-rank">${ord(p.placement)}</span></div>
          <div class="sr-pod-name">${esc(p.name)}</div>
          <div class="sr-pod-fate">${fateOf(p)}${backMark(p)}</div>
        </a>`).join('')}</div>` : '';

      const rest = podium.length === 3 ? ranked.slice(3) : ranked;
      const wall = `${podiumHtml}<div class="sr-wall">${rest.map(p => `
        <a class="sr-wall-cell${p.placement === 1 ? ' is-win' : ''}"
           href="player.html?player=${esc(p.playerSlug)}&view=wiki" title="${tipOf(p)}">
          <div class="sr-pod-banner ${bannerOf(p).cls}">${esc(bannerOf(p).text)}</div>
          <div class="sr-wall-photo">${av(p)}<span class="sr-wall-rank">${ord(p.placement)}</span></div>
          <div class="sr-wall-name">${esc(p.name)}</div>
          <div class="sr-wall-fate">${fateOf(p)}${backMark(p)}</div>
        </a>`).join('')}</div>`;

      /* ── 3b. the power table ──
         Faces, not names in cells. `byName` resolves a week's plain string
         back to the cast entry that carries the avatar slug — the weeks
         record power as names and only the placement list knows the slug. */
      const byName = Object.fromEntries(cast.map(p => [p.name, p]));
      const chip = (name, kind, badge) => {
        if (!name) return '<span class="sr-pow-none">—</span>';
        const p = byName[name];
        return `<a class="sr-chip is-${kind}" href="player.html?player=${esc(p?.playerSlug || '')}&view=wiki">
          <span class="sr-chip-av">${p ? av(p) : ''}<i class="sr-chip-b">${badge}</i></span>
          <span class="sr-chip-n">${esc(name)}</span></a>`;
      };
      /* Everybody who was ever on the block that week, in the order it happened
         to them: named first, then anybody who arrived as a replacement.

         All three lists are needed and each one alone lies. `initialNominees`
         and `blockBeforeSafety` lose the replacement — week two of BB1 opens
         on Brightly and Zee and votes on Millie and Zee, and Millie is the one
         who goes home, so a table built on the openers never shows the person
         it evicted. `finalNominees` loses the people the veto took down. */
      const nomFaces = w => {
        const opened = [...new Set([...(w.blockBeforeSafety || []), ...(w.initialNominees || [])])];
        const final = w.finalNominees || [];
        const all = [...opened, ...final.filter(n => !opened.includes(n))];
        if (!all.length) return '<span class="sr-pow-none">—</span>';
        const stayed = new Set(final);
        const opener = new Set(opened);
        return `<span class="sr-noms">${all.map(n => {
          const p = byName[n];
          const saved = !stayed.has(n);
          const late = !opener.has(n);
          const why = saved ? ' — came off the block'
            : late ? ' — went up as the replacement' : '';
          return `<a class="sr-nom${saved ? ' is-saved' : ''}${late ? ' is-late' : ''}"
            title="${esc(n)}${why}"
            href="player.html?player=${esc(p?.playerSlug || '')}&view=wiki">${p ? av(p) : ''}</a>`;
        }).join('')}</span>`;
      };
      /* The margin, under the week number. "Week" was written there before,
         directly beneath a column header reading WEEK. */
      const tally = w => {
        const v = Object.values(w.votes || {}).filter(n => Number.isFinite(n));
        // Outside the house there is no margin to quote. A camp resolves a tie
        // with a revote the raw tally does not record, so "3–3" beside a name
        // in the voted-out column would be reporting a result that never
        // happened. The count against the person who left is always true.
        // Nothing to quote where nothing was counted. The round number alone
        // is the honest cell; a bare "EPISODE" under a column headed with the
        // episode number is the caption saying what the header already says.
        if (shape === 'placements') return '';
        if (!hasBlock) {
          const n = (w.votes || {})[w.evicted];
          return `<span>${Number.isFinite(n) && n > 0 ? `${n} vote${n === 1 ? '' : 's'}` : roundWord.toUpperCase()}</span>`;
        }
        if (v.length < 2) return `<span>${roundWord.toUpperCase()}</span>`;
        const [a, b] = [...v].sort((x, y) => y - x);
        // A house that splits evenly does not evict anybody; the Head of
        // Household does, out loud, and that is the week's whole story.
        const tb = a === b ? w.tieBreak : null;
        return `<span class="${tb ? 'is-tied' : ''}" title="${tb
          ? esc(`${a}–${b} tie — ${tb.voter} broke it and evicted ${tb.evict}`)
          : 'eviction margin'}">${a}–${b}${tb ? ' ⚖' : ''}</span>`;
      };
      /* ── WHAT A COLUMN IS CALLED ───────────────────────────────────────
         Two records can share a week number now (a double eviction is one
         night) and the last one is the finale, so a bare number is no longer
         enough to tell a reader which night they are looking at. */
      const colHead = (w, i) => {
        const cls = [cancelled(w) ? 'is-nowk' : '', w.finale ? 'is-finale' : ''].filter(Boolean).join(' ');
        const tip = w.finale ? 'Finale'
          : w.secondEviction ? `${roundWord} ${w.week} — second eviction of the night`
            : cancelled(w) ? 'No eviction this week' : `${roundWord} ${w.week}`;
        return `<th${cls ? ` class="${cls}"` : ''} title="${esc(tip)}">${
          w.finale ? 'F' : w.week}${w.secondEviction ? '<sup>2</sup>' : ''}</th>`;
      };
      const anyArena = weeks.some(w => w.safetyWinner);
      /* A table of who held power needs somebody to have held some. The Total
         Drama season export records only who was eliminated and who voted —
         no immunity winner — so a camp would draw a column of dashes beside a
         column of names, which the voting grid below already says better. The
         test is the data, not the show: the day those exports carry an
         immunity winner, this section appears for them on its own. */
      const hasPower = weeks.some(w => w.hoh || w.immunityWinner || w.winner
        || w.vetoWinner || w.safetyWinner);
      const power = hasPower ? `
        <div class="sr-pow">
          <div class="sr-pow-scroll">
            <table class="sr-pow-t">
              <thead><tr>
                <th>${roundWord}</th>
                <th>${hasBlock ? 'Head of Household'
                  /* THE REGISTRY'S WORD FOR THE THING THAT WAS WON. "Immunity"
                     is what a camp calls it and what a runway does NOT: the
                     maxi winner is safe, but the column is about the challenge
                     she won, and the show has its own name for it. */
                  : shape === 'placements' ? cap(W.comp) : 'Immunity'}</th>
                ${anyArena ? '<th>Block Buster</th>' : ''}
                ${hasBlock ? '<th>Power of Veto</th><th>On the block</th>' : ''}
                <th>${VERBS.map(cap).join(' / ')}</th>
              </tr></thead>
              <tbody>${weeks.map(w => (cancelled(w)
                /* THE WEEK WHERE NOBODY GOES HOME. Drawn as one wide cell
                   rather than a row of dashes, which is what a week with no
                   record looks like — and this week has a record, it just has
                   no ceremony in it. */
                ? `<tr class="sr-pow-none-wk">
                    <td><div class="sr-pow-wk">${w.week}<span>NO EVICTION</span></div></td>
                    <td colspan="${1 + (anyArena ? 1 : 0) + (hasBlock ? 2 : 0) + 1}">
                      <span class="sr-nowk-line">No nominations, no veto and no vote${
                        w.hoh ? ` — ${esc(w.hoh)} held a Head of Household with nothing to spend it on`
                          : ''}. The house was the same size on Thursday as it was on Sunday.</span>
                    </td>
                  </tr>`
                : `<tr${w.finale ? ' class="sr-pow-finale"' : ''}>
                <td><div class="sr-pow-wk">${w.finale ? 'FINALE' : w.week}${
                  w.secondEviction ? '<span class="is-second">SECOND EVICTION</span>'
                    : w.finale ? `<span>${esc(String(w.juryVote || '').replace(/[^0-9]+/g, '–')
                      .replace(/^–|–$/g, '') || 'JURY VOTE')}</span>`
                    : tally(w)}</div></td>
                <td>${chip(w.hoh || w.immunityWinner || w.winner, 'hoh',
                  hasBlock ? 'H' : shape === 'placements' ? cap(W.comp).charAt(0) : 'I')}</td>
                ${anyArena ? `<td>${chip(w.safetyWinner, 'arena', 'B')}</td>` : ''}
                ${hasBlock ? `<td>${chip(w.vetoWinner, 'veto', 'V')}</td><td>${nomFaces(w)}</td>` : ''}
                <td>${exitsOf(w).map(x => chip(x.name, 'out', '✕')).join('') || chip('', 'out', '✕')}</td>
              </tr>`)).join('')}</tbody>
            </table>
          </div>
          <div class="sr-pow-key">
            <span><i style="background:#facc15"></i>${hasBlock ? 'Head of Household'
              : shape === 'placements' ? `Won the ${W.comp}` : 'Won immunity'}</span>
            ${anyArena ? '<span><i style="background:#c084fc"></i>Won the Block Buster</span>' : ''}
            ${hasBlock ? `<span><i style="background:#38bdf8"></i>Power of Veto</span>
            <span><i style="background:rgba(248,113,113,.6)"></i>On the block at the vote</span>
            <span><i style="background:#38bdf8"></i>Came off the block</span>
            <span><i style="background:rgba(251,146,60,.75)"></i>Went up as the replacement</span>
            <span>The number under each week is the eviction margin; ⚖ marks a tie the Head of Household broke.</span>`
            /* A SENTENCE ABOUT A NUMBER THAT IS NOT THERE. This is a key to
               the vote count under each round — true on a show that counts
               votes, and on a runway a claim that the page is showing a tally
               it never drew, in another show's noun for the people in it. */
            : shape === 'placements' ? ''
              : `<span>The number under each ${roundWord.toLowerCase()} is how many votes the eliminated ${W.player} took.</span>`}
          </div>
        </div>` : '';

      /* ── 4. the grid ──
         Cast down the side, weeks across the top, and the cell says the
         strongest thing that happened to that person that week. The same
         rule the character article uses: winning the arena outranks being
         nominated, because being nominated is how you get into it. */
      const cellFor = (name, w) => {
        if (w.hoh === name) return ['HOH', 'is-hoh'];
        if (w.evicted === name) return ['OUT', 'is-out'];
        if (w.safetyWinner === name) return ['BB', 'is-arena'];
        if (w.vetoWinner === name) return ['VETO', 'is-veto'];
        const up = (w.initialNominees || []).includes(name)
          || (w.blockBeforeSafety || []).includes(name);
        const stayed = (w.finalNominees || []).includes(name);
        if (up || stayed) return ['NOM', stayed ? 'is-nom' : 'is-saved'];
        return ['', ''];
      };
      /* ── THE CHART A RUNWAY IS READ THROUGH ────────────────────────
         Not the block grid with different words: there is no block and no
         vote. A track record chart is a row per queen, a column per episode
         and the CALL in the cell, and it is built in js/dr/grid.js so that
         this page, the character article and the viewing party draw one
         chart rather than three that disagree about who had left. */
      const grid = shape === 'placements' ? buildTrackRecordGrid(s, { format: fmt })
        : (hasBlock && weeks.length) ? `
        <div class="wk-scroll">
          <table class="wk-table wk-weeks sr-grid">
            <thead><tr><th>${hasBlock ? 'Houseguest' : 'Contestant'}</th>${weeks.map(colHead).join('')}<th>Votes</th></tr></thead>
            <tbody>${cast.map(p => {
              const gone = outWeek[p.name];
              let against = 0;
              return `<tr>
                <th><a href="player.html?player=${esc(p.playerSlug)}&view=wiki">${
                  av(p)}${esc(p.name)}</a></th>
                ${weeks.map((w, i) => {
                  const left = outAt[p.name] != null && i > outAt[p.name];
                  against += (w.votes || {})[p.name] || 0;
                  if (left) return '<td class="is-gone"></td>';
                  // Out of the house and not yet back: not safe, not there.
                  if (notYet(p.name, i)) {
                    return '<td class="is-away" title="Not in the house yet">·</td>';
                  }
                  if (isAway(p.name, i)) return '<td class="is-away" title="Out of the house">·</td>';
                  if (cancelled(w) && !cellFor(p.name, w)[0]) return '<td class="is-nowk"></td>';
                  const [label, cls] = cellFor(p.name, w);
                  return `<td class="${cls}">${label}</td>`;
                }).join('')}
                <td class="sr-grid-tot">${against || ''}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <p class="sr-thin">
          <span class="sr-key is-hoh">HOH</span> Head of Household ·
          <span class="sr-key is-veto">VETO</span> Power of Veto ·
          ${arenaWeeks.length ? '<span class="sr-key is-arena">BB</span> won the Block Buster · ' : ''}
          <span class="sr-key is-nom">NOM</span> on the block at the vote ·
          <span class="sr-key is-saved">NOM</span> nominated and came off ·
          <span class="sr-key is-out">OUT</span> evicted.
          The last column is votes received across the season.
        </p>` : (cast.some(p => (p.challengeWins || 0) + (p.immunityWins || 0) + (p.rewardWins || 0) + (p.idolsFound || 0))
          ? `<div class="sr-scroll">
              <table class="sr-grid sr-comp">
                <thead><tr><th>Contestant</th><th>Challenge wins</th><th>Immunity</th>
                  <th>Rewards</th><th>Idols</th><th>Advantages</th><th>Votes against</th></tr></thead>
                <tbody>${cast.map(p => `<tr>
                  <th><a href="player.html?player=${esc(p.playerSlug)}&view=wiki">${
                    av(p)}${esc(p.name)}</a></th>
                  <td class="is-count">${p.challengeWins || ''}</td>
                  <td>${p.immunityWins || ''}</td>
                  <td>${p.rewardWins || ''}</td>
                  <td>${p.idolsFound || ''}</td>
                  <td>${(p.advPlayed || 0) + (p.advHeld || 0) || ''}</td>
                  <td class="sr-grid-tot">${p.votesReceived || ''}</td>
                </tr>`).join('')}</tbody>
              </table>
            </div>
            <p class="sr-thin">
              A camp has no block and no veto, so its competition record is per contestant rather
              than per ${roundWord.toLowerCase()}: challenge wins across the season, of which the
              individual immunity wins are the ones that could not be taken away, plus rewards,
              idols found, advantages played or still in hand at the end, and votes cast against
              them. Ordered by finish.
            </p>`
          : (weeks.length
            ? `<p class="sr-thin">Nothing in this season's record counts a competition. A season
               exported before the per-player challenge record existed does not carry it.</p>`
            : '<p class="sr-thin">No round-by-round record was exported for this season.</p>'));

      /* ── 4b. the voting history ──
         The table every Big Brother wiki is built around, and the one thing
         a tally could never produce: WHO EACH HOUSEGUEST VOTED FOR, week by
         week. It needs `ballots`, which the engine has always had and the
         export only started carrying today, so a season exported before
         that says so rather than drawing an empty grid. */
      const hasBallots = weeks.some(w => (w.ballots || []).length);
      const voteCell = (name, w) => {
        if (w.hoh === name) {
          // The Head of Household does not vote — unless the house tied and
          // they broke it, which is the most consequential vote of the week
          // and belongs on the grid rather than in a footnote.
          const tb = w.tieBreakVote;
          return tb && tb.voter === name
            ? [esc(tb.evict), 'is-tiebreak', 'broke the tie', byName[tb.evict]]
            : ['HOH', 'is-hoh', 'did not vote', null];
        }
        const up = (w.finalNominees || []).includes(name)
          || (w.blockBeforeSafety || []).includes(name);
        const ballot = (w.ballots || []).find(b => b.voter === name);
        if (ballot) {
          // WITH THE FACE. Fifteen columns of surnames is a grid you read;
          // fifteen columns of faces is one you scan, which is the only reason
          // the reference wikis put portraits in this table at all.
          return [esc(ballot.evict), ballot.changed ? 'is-changed' : '',
            ballot.stated ? `said ${ballot.stated}` : (ballot.changed ? 'changed their mind' : ''),
            byName[ballot.evict]];
        }
        const mine = exitsOf(w).find(x => x.name === name);
        if (mine) return ['OUT', 'is-out', mine.verb || W.exit, null];
        if (up) return ['NOM', 'is-nom', 'on the block, could not vote', null];
        return ['', '', '', null];
      };
      const votingHistory = hasBallots ? `
        <div class="wk-scroll">
          <table class="wk-table wk-weeks sr-grid sr-votes">
            <thead><tr><th>Voted to ${W.exitAction}</th>${
              weeks.map(colHead).join('')}</tr></thead>
            <tbody>${cast.map(p => {
              const gone = outWeek[p.name];
              return `<tr>
                <th><a href="player.html?player=${esc(p.playerSlug)}&view=wiki">${
                  av(p)}${esc(p.name)}</a></th>
                ${weeks.map((w, i) => {
                  if (outAt[p.name] != null && i > outAt[p.name]) return '<td class="is-gone"></td>';
                  if (notYet(p.name, i)) {
                    return '<td class="is-away" title="Not in the house yet">·</td>';
                  }
                  if (isAway(p.name, i)) return '<td class="is-away" title="Out of the house">·</td>';
                  if (cancelled(w)) return '<td class="is-nowk" title="No eviction this week"></td>';
                  const [label, cls, title, face] = voteCell(p.name, w);
                  return `<td class="${cls}"${title ? ` title="${esc(title)}"` : ''}>${
                    face ? `<span class="sr-vf">${av(face)}<b>${label}</b></span>` : label}</td>`;
                }).join('')}
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>
        <p class="sr-thin">
          Each cell is who that ${esc(W.player)} voted to ${esc(W.exitAction)}.
          ${hasBlock ? `<span class="sr-key is-hoh">HOH</span> held the power and did not vote ·
            <span class="sr-key is-nom">NOM</span> was on the block ·
            <span class="sr-key is-changed">name</span> moved their vote after the plans were laid ·
            <span class="sr-key is-tiebreak">name</span> broke a tie.
            Hover a changed vote to see what they had said they would do.`
            : `A blank cell is somebody who had immunity, was not at the ceremony, or did not
               vote that round.`}
        </p>` : '';

      /* ── 5. week by week ──
         Two versions of the same round, and the good one is optional.

         DERIVED is built here from the record: true, complete, and unable
         to say anything about how the week went, because the export does
         not know. WRITTEN comes from `gameHistory` — the episodes read
         round by round, with the record handed over as the skeleton the
         prose is not allowed to contradict.

         A season nobody has run the fill on still gets the derived line,
         and a round whose episode was never written keeps it too, so this
         degrades a round at a time rather than all at once. */
      const written = new Map((Array.isArray(s.gameHistory) ? s.gameHistory : [])
        .filter(r => r && r.prose).map(r => [Number(r.n), r]));
      const gameHistory = weeks.map(w => {
        const noms = (w.blockBeforeSafety || w.initialNominees || []);
        const bits = [];
        if (w.hoh) {
          bits.push(`<b>${esc(w.hoh)}</b> won ${w.finale ? 'the final ' : ''}Head of Household.`);
        }
        // The show's own word. "won the challenge" over a runway is the same
        // leak as "was evicted" over a camp, one noun quieter.
        if (w.winner) bits.push(`<b>${esc(w.winner)}</b> won the ${esc(W.comp)}.`);
        /* ── WHAT A NIGHT WITH NO BALLOT ACTUALLY CONSISTED OF ──────────
           Without this a placement round's whole account is two sentences —
           who won and who left — on an episode that also had a category, a
           bottom two and a song. The record carries all three and nothing was
           reading them. */
        if (shape === 'placements') {
          if (w.runwayCategory) bits.push(`The runway category was ${esc(w.runwayCategory)}.`);
          /* THE BOTTOM IS THE PAIR WHO LIP SYNCED, NOT THE `BTM` COLUMN.
             The one who goes home is marked `ELIM` in the grid, not `BTM`, so
             reading the column named a bottom TWO of one person on every
             episode — beside the very next sentence naming both of them. The
             lip sync queens are the bottom, by definition, and the two facts
             are one sentence. */
          const pair = (w.lipsync?.queens || []).map(esc);
          if (pair.length && w.lipsync?.song) {
            bits.push(`${pair.join(' and ')} landed in the bottom and lip synced to `
              + `<i>${esc(w.lipsync.song)}</i>${w.lipsync.artist ? ` by ${esc(w.lipsync.artist)}` : ''}.`);
          } else if (pair.length) {
            bits.push(`${pair.join(' and ')} landed in the bottom.`);
          }
          /* ── THE FINALE HAS NO MAXI WINNER AND NO EXIT ──────────────────
             so every clause above it is false of the one night the season is
             about, and it drew a heading with nothing under it. What it has
             is a crowning. */
          if (w.finale || (w.placements || []).some(x => x.result === 'WINNER')) {
            const fin = (w.placements || []).filter(x => x.result === 'WINNER' || x.result === 'FINALIST');
            const champ = fin.find(x => x.result === 'WINNER');
            if (fin.length) {
              bits.push(`${fin.map(x => esc(x.name)).join(', ')} reached the finale${
                champ ? `, and <b>${esc(champ.name)}</b> was crowned` : ''}.`);
            }
          }
        }
        if (w.immunityWinner && w.immunityWinner !== w.winner) {
          bits.push(`<b>${esc(w.immunityWinner)}</b> had immunity.`);
        }
        if (noms.length) bits.push(`${noms.map(esc).join(', ')} went on the block.`);
        if (w.vetoWinner) bits.push(`<b>${esc(w.vetoWinner)}</b> won the veto.`);
        if (w.safetyWinner) bits.push(`<b>${esc(w.safetyWinner)}</b> won the Block Buster and came off.`);
        if (w.finalNominees?.length && w.finalNominees.join() !== noms.join()) {
          bits.push(`${w.finalNominees.map(esc).join(' and ')} faced the vote.`);
        }
        if (w.tieBreak) bits.push('The vote tied.');
        if (w.finale && w.evicted) {
          bits.push(`<b>${esc(w.hoh || 'They')}</b> cast the only vote and evicted
            <b>${esc(w.evicted)}</b>.`);
        } else if (exitsOf(w).length) {
          const tally = Object.entries(w.votes || {}).map(([n, c]) => `${c}`).sort((a, b) => b - a);
          /* ONE SENTENCE PER DOOR. This was `hasBlock ? 'evicted' : 'voted
             out'` — a two-way answer that printed "was voted out" over seven
             murders and named only the banished, because it read `w.evicted`.
             The verb is the ROUND's, and only the ballot's exit quotes a
             margin: nobody voted on the other one. */
          for (const x of exitsOf(w)) {
            const margin = x.channel !== 'murder' && tally.length > 1
              ? `, ${tally[0]}-${tally[1]}` : '';
            bits.push(`<b>${esc(x.name)}</b> was ${esc(x.verb || W.exit)}${margin}.`);
          }
        }
        /* ── WRITTEN PROSE THAT NAMES NOBODY FROM THIS WEEK IS NOT ABOUT
              THIS WEEK. ──
           Big Brother 1 shipped with fifteen `gameHistory` rows describing an
           entirely different cast — Millie, Bowie, Caleb, Priya — because the
           fill was run against the wrong season's episodes and committed here.
           The page printed all of it, above the derived line, as this season's
           own account of itself.

           The test is the record, not a heuristic: every round the fill writes
           names the person who held power and the person who left, and both
           are in the week object. Prose that mentions none of them is prose
           about some other house. */
        // THE LAST LINE OF A SEASON, and it lived only in the winner block —
        // the week-by-week record used to stop one night short of the thing
        // the whole season is for. After the cut, because that is the order it
        // happened in.
        if (w.finale && w.juryVote) bits.push(`The jury voted: <b>${esc(w.juryVote)}</b>.`);
        const w2raw = written.get(Number(w.week));
        const knownNames = [w.hoh, w.winner, w.immunityWinner, w.vetoWinner, w.safetyWinner,
          ...exitsOf(w).map(x => x.name),
          ...(w.initialNominees || []), ...(w.blockBeforeSafety || []),
          ...(w.finalNominees || [])].filter(Boolean);
        const aboutThisWeek = w2raw && (!knownNames.length || knownNames.some(n =>
          new RegExp(`\\b${String(n).replace(/[^A-Za-z0-9 ]/g, c => String.fromCharCode(92) + c)}\\b`)
            .test(String(w2raw.prose))));
        const w2 = aboutThisWeek ? w2raw : null;
        const body = cancelled(w)
          ? `<p class="sr-week-f">No nominations, no veto and no vote this week — nobody went
             home.${w.hoh ? ` <b>${esc(w.hoh)}</b> won Head of Household.` : ''}</p>`
          : w2
          ? `${w2.title ? `<div class="sr-week-t">${esc(w2.title)}</div>` : ''}
             <p class="sr-week-p">${esc(w2.prose)}</p>
             <p class="sr-week-f">${bits.join(' ')}</p>`
          : bits.join(' ');
        return `<div class="sr-week">
          <div class="sr-week-n">${w.finale ? 'Finale'
            : `${roundWord} ${w.week}${w.secondEviction ? ' · second eviction' : ''}`}</div>
          <div class="sr-week-b">${body}</div>
        </div>`;
      }).join('');

      /* ── 6. trivia, measured ──
         Every line here has to be true in the show it is about. The first
         version was written against Big Brother's record and printed
         "reached the end without ever being nominated" over a Total Drama
         season, which has no nominations — the honest equivalent there is
         never having a vote cast against you, which is a different and
         rarer thing. Same for competitions: a house counts HOH and veto, a
         camp counts challenge wins. */
      const trivia = [];
      const most = arr => arr.slice().sort((a, b) => b.n - a.n)[0];
      /* HOW MANY TIMES THIS PAGE'S OWN GRID SHOWS A NAME BEING WRITTEN DOWN.
         Not `p.votesReceived`, which a document can be published without. */
      const drawnAgainst = p => weeks.reduce((n, w) =>
        n + (Number((w.votes || {})[p.name]) || 0), 0);
      /* THE NUMBER STAYS THE SITE'S, THE CLAIM COMES FROM THE PAGE.
         On season 6 the record says Brody took 26 votes and the exported
         voting history holds 19 of them -- revotes and unexported rounds are
         real and the grid cannot show them -- so recomputing the FIGURE off
         the grid would have quietly changed a published Total Drama number
         and disagreed with every other page. The figure keeps the record's;
         the "never" claim below needs BOTH sources to say never, because a
         claim about zero is the one thing the grid can falsify outright. */
      const votesAgainst = p => (Number(p.votesReceived) || drawnAgainst(p));
      const comps = cast.map(p => ({ name: p.name, n: hasBlock
        ? (p.bb?.hohWins || 0) + (p.bb?.vetoWins || 0) + (p.bb?.blockBusterWins || 0)
        : shape === 'placements' ? (p.dr?.wins || 0)
          : (p.challengeWins || 0) + (p.tr?.missionsWon || 0) }));
      const topComp = most(comps);
      if (topComp?.n) {
        // "challenges" over a castle is the same leak as "nominated" over a
        // camp. The word is the registry's; the two shipped shows are
        // unchanged by it ("challenges", "competitions").
        trivia.push(`${esc(topComp.name)} won the most ${esc(W.comp)}s this season (${topComp.n}).`);
      }
      if (hasBlock) {
        const noms = cast.map(p => ({ name: p.name, n: p.bb?.timesNominated || 0 }));
        const topNom = most(noms);
        if (topNom?.n) trivia.push(`${esc(topNom.name)} was nominated more than anybody else (${topNom.n} times).`);
        const arena = cast.map(p => ({ name: p.name, n: p.bb?.blockBusterWins || 0 }));
        const topArena = most(arena);
        if (topArena?.n > 1) {
          trivia.push(`${esc(topArena.name)} won their way off the block ${topArena.n} times.`);
        }
      } else if (shape === 'placements') {
        /* NOT THE VOTE BRANCH. Everything below the `hasBlock` test used to
           be "the camp", and a runway falling into it would have been given
           "had more votes cast against them than anybody else" — about a
           show with no ballot in it, on the page that also draws a chart
           proving there is none. Every sentence here is read off this
           show's own record. */
        const btm = cast.map(p => ({ name: p.name, n: p.dr?.bottoms || 0 }));
        const topBtm = most(btm);
        if (topBtm?.n) {
          trivia.push(`${esc(topBtm.name)} was in the bottom more than anybody else (${topBtm.n} times).`);
        }
        const ls = cast.map(p => ({ name: p.name, n: p.dr?.lipsyncWins || 0 }));
        const topLs = most(ls);
        if (topLs?.n > 1) {
          /* NO PRONOUN. This said "for her life", which is the show's own
             phrase and is wrong here in two ways: the sentence is about a
             roster player whose pronouns this module has no access to, and
             the phrase itself is second person ("lip sync for YOUR life"), so
             the third-person rewrite was never going to read right. Naming
             the act instead sidesteps both. */
          trivia.push(`${esc(topLs.name)} survived the lip sync ${topLs.n} times.`);
        }
        // Somebody who was never in the bottom at all. The equivalent claim
        // to "never nominated", and true only when the record says zero.
        const clean = cast.filter(p => p.placement <= 5 && !(p.dr?.bottoms));
        if (clean.length) {
          trivia.push(`${clean.map(p => esc(p.name)).join(', ')} reached the end
            without ever landing in the bottom.`);
        }
      } else {
        const got = cast.map(p => ({ name: p.name, n: votesAgainst(p) }));
        const topVotes = most(got);
        if (topVotes?.n) {
          trivia.push(`${esc(topVotes.name)} had more votes cast against them than anybody else (${topVotes.n}).`);
        }
      }
      /* Reaching the end untouched. In a house that is never being put on the
         block; in a camp it is never having a name written down against you.

         ── AND IT IS READ OFF THE BALLOTS THIS PAGE IS ALREADY DRAWING ──
         This trusted `p.votesReceived`, a field a season document can simply
         not carry, and an absent number is not a zero. So the page printed
         "reached the end without ever having a vote cast against them" about
         five people while, two sections higher, its own voting grid showed
         one of them taking votes in episode two — the canonical bug sentence
         from CLAUDE.md, contradicted by the same page that printed it. The
         count now comes from the ballots above, so the two cannot disagree. */
      const untouched = hasBlock
        ? cast.filter(p => p.placement <= 5 && !(p.bb?.timesNominated))
        // A runway's version of this sentence is written in the branch above,
        // off `dr.bottoms`. Running it here would print it twice, the second
        // time in the camp's words.
        : shape === 'placements' ? []
          : cast.filter(p => p.placement <= 5 && !votesAgainst(p) && !drawnAgainst(p));
      if (untouched.length) {
        trivia.push(`${untouched.map(p => esc(p.name)).join(', ')} reached the end without ever
          ${hasBlock ? 'being nominated' : 'having a vote cast against them'}.`);
      }
      if (winnerName) {
        const w = cast.find(p => p.name === winnerName);
        if (hasBlock && w?.bb) {
          trivia.push(`${esc(winnerName)} won with ${w.bb.hohWins || 0} HOH
            and ${w.bb.vetoWins || 0} veto wins.`);
        } else if (shape === 'placements' && w) {
          const wins = w.dr?.wins || 0;
          const btm = w.dr?.bottoms || 0;
          // "was in the bottom 0 times" is a number where a word belongs, and
          // never reaching the bottom is the more interesting half of the
          // sentence anyway.
          trivia.push(`${esc(winnerName)} won ${wins} ${esc(W.comp)}${wins === 1 ? '' : 's'} and ${
            btm ? `was in the bottom ${btm} time${btm === 1 ? '' : 's'}` : 'never landed in the bottom'}.`);
        } else if (w) {
          // The show's own word for what they won, and this page's own count
          // of what was written against them.
          const wins = (w.challengeWins || 0) + (w.tr?.missionsWon || 0);
          const vs = votesAgainst(w);
          trivia.push(`${esc(winnerName)} won with ${wins} ${esc(W.comp)}
            win${wins === 1 ? '' : 's'} and ${vs}
            vote${vs === 1 ? '' : 's'} cast against them.`);
        }
      }

      /* A wiki section: an id, a heading with a rule under it, and an entry
         in the contents box. The dashboard's `sr-sh` header — a display font
         with a coloured pill beside it — is the house style of the other
         three tabs and is exactly what made this one read as a dashboard
         wearing a wiki label. */
      const toc = [];
      const sec = (title, body, note) => {
        if (!body) return '';
        const id = 'wk-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        toc.push([id, title]);
        return `<section class="wk-section" id="${id}">
          <h2>${title}${note ? ` <span class="wk-count">${note}</span>` : ''}</h2>
          ${body}</section>`;
      };

      /* WHOSE SHOW THIS IS, in the box whose entire job is to say so. A
         two-way ternary printed "Total Drama" over a Traitors season -- in an
         infobox, under a heading, on the page about that season. `showName`
         was already imported and already used correctly forty lines up. */
      const showLabel = shows.showName(fmt);
      const infobox = `<aside class="wk-infobox">
        <div class="wk-ib-title">${esc(s.title || (roundWord + ' season'))}</div>
        <div class="wk-ib-show">${showLabel}</div>
        <table class="wk-ib-table">
          ${facts.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
        </table>
      </aside>`;

      const body = `
        ${s.subtitle ? `<p class="wk-lead">${esc(s.subtitle)}</p>` : ''}
        ${sec('Twists', twists.length
          ? `<dl class="sr-twists">${twists.map(([t, d]) =>
              `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl>`
          : `<p class="sr-thin">Nothing in this season's record identifies a twist. Seasons
             exported before a twist was tracked do not carry it — the ${
               roundWord.toLowerCase()}s below are still complete.</p>`)}
        ${sec(W.players.replace(/^./, c => c.toUpperCase()), wall,
          `${cast.length} · winner first`)}
        ${sec('The power', power, hasPower ? `who ran each ${roundWord.toLowerCase()}` : '')}
        ${sec('Voting history', votingHistory, hasBallots ? 'who voted for whom' : '')}
        ${sec('Competition history', grid, shape === 'placements'
          ? `every ${roundWord.toLowerCase()}, and how each ${W.player} was called`
          : hasBlock && weeks.length
            ? `${new Set(weeks.map(w => Number(w.week))).size} weeks` : '')}
        ${/* A MISSING BALLOT IS NOT THE SAME AS NO BALLOT. This note offers
              to re-export a season whose ballots were not recorded — true and
              useful on a show that has them. On a show where nobody votes it
              is an apology for a section that should never exist, promising
              a grid that can never be drawn. */
          !hasBallots && weeks.length && shape !== 'placements' ? `<p class="sr-thin">A vote-by-vote history needs the
          ballots, which this season was exported before the record carried. Re-export it and
          the grid of who voted for whom appears here.</p>` : ''}
        ${sec('Game history', gameHistory)}
        ${sec('Trivia', trivia.length
          ? `<ul class="wk-list">${trivia.map(t => `<li>${t}</li>`).join('')}</ul>` : '')}
      `;

      /* Contents first, then the sections it lists — so it has to be built
         after them and spliced in, which is why the body is a variable. */
      const contents = toc.length > 2
        ? `<nav class="wk-contents"><b>Contents</b><ol>${toc.map(([id, t]) =>
            `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ol></nav>`
        : '';

      return `<article class="wk-article">
        ${infobox}
        <div class="wk-main">${contents}${body}</div>
      </article>`;
}
