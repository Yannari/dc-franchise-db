// ══════════════════════════════════════════════════════════════════════
// ch/teams.js — the Teams season: the teams, the losing team's vote, the winners' pick, switching sides
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-17-ch-teams-season-design.md. Battle of the Seasons (teams by original show),
// Invasion of the Champions (champions vs underdogs, dismantled for the final), War of the Worlds 2 (two big teams,
// the losing team nominates one of its own out loud, the winners pick the second player from either team, an Arena
// winner may switch teams, a team final). Wikipedia, read 2026-10-17.
//
//   state.teams     [{ id, name, members, captain, how, show? }]   the teams still standing
//   state.teamOf    { name: teamId }
//   state.teamHistory   every move: { name, from, to, ep, how }
//   state.teamsBroken   the teams are over (the break-up): the season is every player for themselves
import { getBond, addBond, getPerceivedBond } from '../bonds.js';
import { SHOWS } from '../shows.js';
import { S, addScene, noise, logistic, inDivision, mayScheme } from './state.js';
import { nudge } from './mind.js';
import { remember, trustOf } from './rel.js';
import { threatRead, giveRespect } from './respect.js';
import { deliberate, houseVote, voteFallout } from './vote.js';
import { chooseOpponent } from './callout.js';
import { afterVote, allianceOf, activeAlliances, allianceName, pull } from './alliances.js';
import { noteAlliance } from './knowledge.js';

export const TEAMINGS = ['shows', 'champions', 'vets', 'draft'];
export const teamsOn = state => !!state?.options?.teams && !state.teamsBroken;
export const teamingOf = state => state.options.teams?.teaming || 'shows';
export const teamOfName = (state, n) => (state.teams || []).find(t => t.id === state.teamOf?.[n]) || null;
export const teammates = (state, n) => (teamOfName(state, n)?.members || []).filter(x => x !== n && state.active.includes(x));
const live = (state, t) => t.members.filter(n => state.active.includes(n));
const showName = slug => (slug && SHOWS[slug]?.name) || null;

// ── making the teams ─────────────────────────────────────────────────
// Two big teams, or teams of about four (Battle of the Seasons). Each made the season's way, then its captain: the
// most respected, else the strongest-looking and boldest.
function captainOf(state, members) {
  return [...members].sort((a, b) => ((state.rec[b]?.respect || 0) - (state.rec[a]?.respect || 0)) || (threatRead(state, b) + S(b, 'boldness') * 0.2) - (threatRead(state, a) + S(a, 'boldness') * 0.2) || a.localeCompare(b))[0];
}
// Spread people over k teams in turn, strongest first, keeping the divisions even (a snake draft by the house's read).
function snake(state, people, k) {
  const out = Array.from({ length: k }, () => []);
  const byDiv = {};
  for (const n of people) (byDiv[state.division[n]] ||= []).push(n);
  let turn = 0;
  for (const d of Object.keys(byDiv)) {
    const order = [...byDiv[d]].sort((a, b) => threatRead(state, b) - threatRead(state, a) || a.localeCompare(b));
    for (const n of order) { const i = turn % (2 * k); out[i < k ? i : 2 * k - 1 - i].push(n); turn++; }
  }
  return out;
}
const teamCount = state => (state.options.teams?.count === 'small' ? Math.max(2, Math.round(state.active.length / 4)) : 2);

function byShows(state, people) {
  const groups = {};
  for (const n of people) (groups[state.origin[n] || 'none'] ||= []).push(n);
  const shows = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const k = teamCount(state);
  if (state.options.teams?.count === 'small') {
    // a team per show; a show with fewer than three people joins the smallest team
    const teams = shows.filter(([, m]) => m.length >= 3).map(([show, m]) => ({ name: showName(show) ? `Team ${showName(show)}` : 'The Wildcards', members: [...m], show }));
    if (teams.length < 2) return byDraft(state, people);
    for (const [, m] of shows.filter(([, mm]) => mm.length < 3)) for (const n of m) teams.sort((a, b) => a.members.length - b.members.length)[0].members.push(n);
    return teams.map(t => ({ ...t, how: 'shows' }));
  }
  // two teams: the shows packed into two, the biggest first, onto the smaller side
  const two = [{ shows: [], members: [] }, { shows: [], members: [] }];
  for (const [show, m] of shows) { const t = two[0].members.length <= two[1].members.length ? two[0] : two[1]; t.shows.push(show); t.members.push(...m); }
  if (!two[1].members.length) return byDraft(state, people);
  return two.map(t => ({ name: t.shows.map(showName).filter(Boolean).slice(0, 2).join(' & ') || 'The Wildcards', members: t.members, shows: t.shows, how: 'shows' }));
}
function byChampions(state, people, background = {}) {
  // past champions (the run layer's background), else the strongest third
  let champs = people.filter(n => background[n]?.champion);
  if (champs.length < Math.max(2, Math.floor(people.length / 4))) champs = [...people].sort((a, b) => threatRead(state, b) - threatRead(state, a)).slice(0, Math.floor(people.length / 3));
  const rest = people.filter(n => !champs.includes(n));
  return [{ name: 'The Champions', members: champs, how: 'champions' }, { name: 'The Underdogs', members: rest, how: 'champions' }];
}
function byVets(state, people) {
  let vets = people.filter(n => !state.rookie[n]), rookies = people.filter(n => state.rookie[n]);
  // topped up to even: the least proven vets play with the rookies
  const sorted = [...vets].sort((a, b) => threatRead(state, a) - threatRead(state, b));
  while (vets.length - rookies.length > 2) { const n = sorted.shift(); vets = vets.filter(x => x !== n); rookies.push(n); }
  if (!rookies.length) return byDraft(state, people);
  return [{ name: 'The Vets', members: vets, how: 'vets' }, { name: 'The Rookies', members: rookies, how: 'vets' }];
}
// Captains pick in turn, in front of everybody: the bond they read and the strength they see (a strategic captain
// picks strength), divisions kept even. Picked last is noticed.
function byDraft(state, people, rng = Math.random) {
  const k = teamCount(state);
  const captains = [...people].sort((a, b) => (threatRead(state, b) + S(b, 'boldness') * 0.3) - (threatRead(state, a) + S(a, 'boldness') * 0.3) || a.localeCompare(b)).slice(0, k);
  const teams = captains.map(c => ({ name: `Team ${c}`, members: [c], captain: c, how: 'draft' }));
  const left = people.filter(n => !captains.includes(n));
  let i = 0;
  while (left.length) {
    const t = teams[i % k], c = t.captain;
    const want = x => getPerceivedBond(c, x) * 0.5 + threatRead(state, x) * 0.4 * S(c, 'strategic') / 10 + noise(rng) * 0.3
      // keep the team's divisions even
      - (t.members.filter(m => state.division[m] === state.division[x]).length - t.members.length / 2) * 0.6;
    const pick = [...left].sort((x, y) => want(y) - want(x))[0];
    left.splice(left.indexOf(pick), 1);
    t.members.push(pick);
    addBond(c, pick, 0.4);
    if (!left.length) {
      nudge(state, pick, 'morale', -0.8);
      addScene(state, 'picked-last', [pick], { by: c, teams: true }, state.active, 'airstrip');
    }
    i++;
  }
  return teams;
}

/** Make the season's teams after the arrivals. `background` carries past champions (ch-run.js). */
export function makeSeasonTeams(state, rng, { background = {} } = {}) {
  const people = [...state.active];
  const how = teamingOf(state);
  const made = how === 'champions' ? byChampions(state, people, background) : how === 'vets' ? byVets(state, people)
    : how === 'draft' ? byDraft(state, people, rng) : byShows(state, people);
  state.teams = made.map((t, i) => ({ id: `t${i + 1}`, name: t.name, members: [...t.members], captain: t.captain || captainOf(state, t.members), how: t.how || how, show: t.show || null }));
  state.teamNames = Object.fromEntries(state.teams.map(t => [t.id, t.name]));   // a folded team keeps its name on the record
  state.teamOf = {};
  state.teamHistory = [];
  for (const t of state.teams) for (const n of t.members) { state.teamOf[n] = t.id; state.teamHistory.push({ name: n, from: null, to: t.id, ep: state.ep || 1, how: 'start' }); }
  // walking in as a team: teammates warm a little, and the old show's pride is in the room
  for (const t of state.teams) for (const a of t.members) for (const b of t.members) if (a < b) addBond(a, b, 0.4);
  addScene(state, 'teams-revealed', state.active, { teams: state.teams.map(t => ({ name: t.name, members: [...t.members], captain: t.captain })), how }, state.active, 'airstrip');
  for (const t of state.teams) {
    const [cap, ...rest] = [t.captain, ...t.members.filter(n => n !== t.captain)];
    // the whole team walks over together (the user, 2026-10-17: "only showed 4 players in each team"); the captain and
    // the next three speak, everybody else is on screen
    addScene(state, 'team-reveal', [cap, ...rest], { team: t.name, how: t.how, size: t.members.length, members: [cap, ...rest] }, state.active, 'airstrip');
  }
  return state.teams;
}

// ── the vote: the losing team, out loud, for one of its own ─────────
/**
 * Day 2 of a Teams season. The last team in the daily votes for one of its own (the week's division); the one voted
 * in calls out an opponent from outside the winning team, as in a season played alone: decided tonight, said at the
 * Arena. (The design had the winners pick; every deal, threat and meeting the house already says is about a call-out,
 * so the call-out stays: the user approved the shape, this is my call, 2026-10-17.) Returns { matches, delib }.
 */
export function teamVoteNight(state, { R, epRec, division, daily, immune, elims }) {
  const matches = [];
  let delib = null;
  const used = new Set();
  const winTeam = teamOfName(state, (daily.winners || [])[0]);
  const avg = t => { const m = live(state, t); return m.reduce((s, n) => s + (daily.scores?.[n] || 0), 0) / Math.max(1, m.length); };
  // a team final needs teams to reach it: a team down to its last two is safe, neither voting nor picked (my call;
  // seed 6, a draft season with a team final, ground the weaker team down to nothing and the final was solo)
  const safeTeam = t => state.options.teams?.end === 'team-final' && live(state, t).length <= 2;
  const shielded = new Set((state.teams || []).filter(safeTeam).flatMap(t => live(state, t)));
  const ranked = (state.teams || []).filter(t => t !== winTeam && !safeTeam(t)).sort((a, b) => avg(a) - avg(b));
  // a team made by show can have nobody of the week's division: the week goes to the other division, or there would
  // be no elimination at all (seed 11, by show: four weeks with no Arena)
  if (division !== 'all') {
    const can = d => ranked.some(t => live(state, t).length >= 2 && live(state, t).some(n => state.division[n] === d && !immune.includes(n)));
    const other = division === 'm' ? 'f' : 'm';
    if (!can(division) && can(other)) { division = other; epRec.division = other; epRec.divisionMoved = true; }
  }
  for (let k = 0; k < elims; k++) {
    const eligibleOf = t => live(state, t).filter(n => (division === 'all' || state.division[n] === division) && !immune.includes(n) && !used.has(n));
    // the last team votes; a team with nobody of the division hands it to the next team up. Nobody else at all (a team
    // final, the other team down to its protected two): the winning team votes one of its own in, never the captain
    const ownOf = t => live(state, t).filter(n => (division === 'all' || state.division[n] === division) && n !== t.captain && !used.has(n));
    let team = ranked.find(t => eligibleOf(t).length >= 1 && live(state, t).length >= 2);
    let ownVote = false;
    if (!team && winTeam && !safeTeam(winTeam) && ownOf(winTeam).length >= 1 && live(state, winTeam).length >= 3) { team = winTeam; ownVote = true; }
    let votedIn = null, vote = null;
    if (team) {
      const eligible = ownVote ? ownOf(team) : eligibleOf(team);
      const voters = live(state, team);
      if (!delib) { state.promises = {}; delib = deliberate(state, R('delib'), { division, eligible, immune, noVolunteer: true }); epRec.delib = { targets: delib.targets, meetings: delib.meetings, pitches: delib.pitches, campaigns: delib.campaigns, threats: delib.threats, volunteer: null, intents: delib.intents, hunted: delib.hunted }; }
      // the captain rallies the team before it turns on itself
      if (k === 0) teamHuddle(state, team, eligible);
      if (eligible.length === 1) {
        votedIn = eligible[0];
        addScene(state, 'team-only-one', [votedIn, team.captain].filter((x, i, a) => a.indexOf(x) === i), { team: team.name }, state.active, 'deliberation');
      } else {
        vote = houseVote(state, R(`vote${k}`), { eligible, delib, winners: [team.captain].filter(c => state.active.includes(c)), voters });
        vote.team = team.name;
        if (ownVote) vote.winners = true;
        votedIn = vote.votedIn;
        state.receiptsFresh = {};
        for (const b of vote.ballots) (state.receiptsFresh[b.target] ||= []).push(b.voter);
        epRec.votes.push(vote);
        for (const n of eligible) if (n !== votedIn) { state.rec[n].survivedVotes++; giveRespect(state, n, 'survivedVote'); }
        // voted in by your own team: it cuts deeper than a house vote
        for (const b of vote.ballots.filter(x => x.target === votedIn)) { addBond(votedIn, b.voter, -0.4); remember(votedIn, b.voter, 'own-team-voted-me', 1); }
      }
    } else {
      // no team can: the house votes, as in a season played alone
      const eligible = inDivision(state, division).filter(n => !immune.includes(n) && !used.has(n) && !shielded.has(n));
      if (eligible.length < 2) break;
      if (!delib) { state.promises = {}; delib = deliberate(state, R('delib'), { division, eligible, immune, noVolunteer: true }); }
      vote = houseVote(state, R(`vote${k}`), { eligible, delib, winners: immune });
      votedIn = vote.votedIn;
      epRec.votes.push(vote);
    }
    if (!votedIn) break;
    used.add(votedIn);
    state.rec[votedIn].votedIn++;
    nudge(state, votedIn, 'confidence', -1.2); nudge(state, votedIn, 'morale', -1.3);
    epRec.votedIn.push(votedIn);
    addScene(state, 'team-voted-in', [votedIn, ...(team ? [team.captain] : [])].filter((x, i, a) => a.indexOf(x) === i), { team: team?.name || null, count: vote?.tally?.[votedIn] || 0 }, state.active, 'public');
    if (vote) voteFallout(state, vote, delib);
    // after the team vote: the one going in, a teammate who did not say the name, and one who did (teams.js)
    if (team && vote) {
      const said = new Set(vote.ballots.filter(b => b.target === votedIn).map(b => b.voter));
      const mates = live(state, team).filter(n => n !== votedIn);
      const friend = mates.filter(n => !said.has(n)).sort((x, y) => getBond(votedIn, y) - getBond(votedIn, x))[0];
      const stung = mates.filter(n => said.has(n)).sort((x, y) => getBond(votedIn, y) - getBond(votedIn, x))[0] || null;
      if (friend) addScene(state, 'team-after-vote', [votedIn, friend, ...(stung ? [stung] : [])], { team: team.name, stung }, [votedIn, friend, ...(stung ? [stung] : [])], 'villa');
    }
    // the call-out: everybody of the division outside the winning team, but the one voted in
    let pool = inDivision(state, division).filter(n => n !== votedIn && !used.has(n) && !(winTeam && winTeam.members.includes(n)) && !immune.includes(n) && !shielded.has(n));
    // nobody of the division outside the winning team (two teams, one of them holding every other man): the call-out
    // reaches into the winning team, never its captain (seed 11, by show: four weeks went by with no Arena)
    let own = false;
    // A team-final season's last two of a team stay shielded here too: reaching in emptied a team of two and ended the
    // teams the episode before the team final (run tab, seed 717: Team Alejandro folded, no team podium)
    if (!pool.length && winTeam) { pool = live(state, winTeam).filter(n => (division === 'all' || state.division[n] === division) && n !== winTeam.captain && n !== votedIn && !used.has(n) && !shielded.has(n)); own = true; }
    if (!pool.length) break;
    const voters = (vote?.ballots || []).filter(x => x.target === votedIn).map(x => x.voter);
    const co = chooseOpponent(state, R(`callout${k}`), votedIn, pool, { voters });
    co.own = own;
    used.add(co.opponent);
    afterVote(state, R(`after${k}`), { ballots: vote?.ballots || [], votedIn, calledOut: null, by: votedIn });
    matches.push({ a: votedIn, b: co.opponent, volunteer: false, vote, co, k, pool, game: null, team: true, voters,
      callout: { by: votedIn, opponent: co.opponent, reason: co.reason } });
  }
  return { matches, delib };
}

// ── after a team daily (the user, 2026-10-17: "reactions to the dailies, defeat, victory, strategy, who to blame,
// vote, alliance, per team, like in Total Drama") ─────────────────────────
/**
 * Called by dailies.js after a daily played as teams. The winning team back at the villa, the losing team taking it in,
 * the losing team's small groups settling on a name (that is who they vote: the bonds move), and now and then a bloc
 * forming inside a team (a real alliance, kept to one team).
 */
export function teamDailyReactions(state, rng, { winners, last, scores }) {
  if (!teamsOn(state) || !winners?.length || !last?.length) return;
  const winT = teamOfName(state, winners[0]), lossT = teamOfName(state, last[0]);
  if (!winT || !lossT || winT === lossT) return;
  const W = live(state, winT), L = live(state, lossT);
  const score = n => scores?.[n] ?? 0;
  // streaks: what each team has done lately (teamHistory of dailies kept here)
  state.teamDailyLog ||= [];
  state.teamDailyLog.push({ ep: state.ep, won: winT.name, lost: lossT.name });
  const lastTwo = state.teamDailyLog.slice(-2);
  const winStreak = lastTwo.length === 2 && lastTwo.every(x => x.won === winT.name);
  const lossStreak = lastTwo.length === 2 && lastTwo.every(x => x.lost === lossT.name);

  // the winners: who carried it, the captain, the celebration
  const mvp = [...W].sort((x, y) => score(y) - score(x))[0];
  const wCap = W.includes(winT.captain) ? winT.captain : W[0];
  const wWho = [mvp, ...[wCap, ...W.filter(n => n !== mvp && n !== wCap).sort((x, y) => S(y, 'boldness') - S(x, 'boldness'))].filter(n => n !== mvp)].slice(0, 5);
  for (const a of W) for (const b of W) if (a < b) addBond(a, b, 0.2);
  for (const n of W) nudge(state, n, 'morale', 0.4);
  giveRespect(state, mvp, 'dailyWin');
  addScene(state, 'team-daily-win', wWho, { team: winT.name, oppTeam: lossT.name, mvp, captain: wCap, streak: winStreak }, W, 'villa');

  // the losers: the mood, and who says what about it
  const lCap = L.includes(lossT.captain) ? lossT.captain : L[0];
  const worst = [...L].sort((x, y) => score(x) - score(y))[0];
  const angry = [...L].filter(n => n !== lCap).sort((x, y) => (10 - S(y, 'temperament')) - (10 - S(x, 'temperament')))[0];
  const lWho = [lCap, ...[angry, worst, ...L.filter(n => n !== lCap && n !== angry && n !== worst)].filter((n, i, a) => n && n !== lCap && a.indexOf(n) === i)].slice(0, 5);
  for (const n of L) nudge(state, n, 'morale', lossStreak ? -0.6 : -0.3);
  if (angry && worst && angry !== worst) { addBond(angry, worst, -0.3); remember(worst, angry, 'looked-at-me-after-the-loss', 0.5); }
  addScene(state, 'team-daily-loss', lWho, { team: lossT.name, oppTeam: winT.name, captain: lCap, worst, streak: lossStreak }, L, 'villa');

  // the losing team talks it out in small groups: two or three who trust each other, and the name they settle on
  const used = new Set();
  // one group most nights; a second, now and then, when the team is big enough for two conversations
  const groups = Math.min(rng() < 0.35 ? 2 : 1, Math.floor(L.length / 3));
  for (let g = 0; g < groups; g++) {
    const free = L.filter(n => !used.has(n));
    const lead = free.sort((x, y) => (S(y, 'strategic') + S(y, 'social')) - (S(x, 'strategic') + S(x, 'social')))[g === 0 ? 0 : Math.min(1, free.length - 1)];
    if (!lead) break;
    const mates = free.filter(n => n !== lead).sort((x, y) => getBond(lead, y) - getBond(lead, x)).slice(0, rng() < 0.5 ? 1 : 2);
    if (!mates.length) break;
    const group = [lead, ...mates];
    // the name: the teammate this group likes least and trusts least to win them a daily
    const target = L.filter(n => !group.includes(n)).map(n => ({ n, v: group.reduce((s, m) => s + getBond(m, n), 0) / group.length - score(n) * 0.3 }))
      .sort((x, y) => x.v - y.v)[0]?.n;
    if (!target) break;
    const doubter = mates.find(m => getBond(m, target) >= 1.5) || null;
    for (const x of group) for (const y of group) if (x < y) addBond(x, y, 0.4);
    for (const x of group) if (x !== doubter) addBond(x, target, -0.35);
    if (doubter) addBond(lead, doubter, -0.2);
    for (const x of group) used.add(x);
    // a line may say the name was the slowest out there only when it was (seed 7 read: the captain called "the slowest")
    addScene(state, 'team-vote-talk', [...group, target], { team: lossT.name, target, doubter, group, slowest: target === worst }, group, 'private');
  }

  // a bloc inside a team: three or four teammates with no alliance of their own make one, kept to the team
  if (activeAlliances(state).length < 5 && rng() < 0.45) {
    for (const t of [lossT, winT]) {
      const free = live(state, t).filter(n => !allianceOf(state, n));
      if (free.length < 3) continue;
      const leader = [...free].sort((x, y) => (S(y, 'strategic') + S(y, 'social')) - (S(x, 'strategic') + S(x, 'social')))[0];
      const members = [leader, ...free.filter(n => n !== leader).map(n => ({ n, p: pull(state, leader, n) + pull(state, n, leader) * 0.5 }))
        .filter(x => x.p > 0.5).sort((x, y) => y.p - x.p).slice(0, rng() < 0.5 ? 2 : 3).map(x => x.n)];
      if (members.length < 3) continue;
      const al = { id: state.alliances.length + 1, name: allianceName(state, rng, members), leader, members, formedEp: state.ep, formedDay: state.day, ended: false, origin: null, team: t.name, teamId: t.id };
      state.alliances.push(al);
      for (const a of members) for (const b of members) if (a < b) addBond(a, b, 0.7);
      noteAlliance(state, al);
      addScene(state, 'team-bloc', members, { alliance: al.id, name: al.name, leader, team: t.name, lost: t === lossT }, members, 'private');
      break;
    }
  }
}

// ── after the Arena: switching sides, a team down to one ─────────────
/** The winner of an Arena their own team sent them to may switch to another team (War of the Worlds 2). */
export function afterTeamDuel(state, rng, m, duel) {
  const out = {};
  const w = duel.winner;
  const own = teamOfName(state, w);
  if (own && w === m.a && m.vote?.team === own.name && state.active.includes(w)) {
    const voted = (m.vote.ballots || []).filter(b => b.target === w).length;
    const share = voted / Math.max(1, live(state, own).length);
    const others = state.teams.filter(t => t !== own && live(state, t).length);
    const warmth = t => live(state, t).reduce((s, n) => s + getBond(w, n), 0) / Math.max(1, live(state, t).length);
    // somebody courted them (events.js team-poach): that team first, and the pull is stronger
    const courted = others.find(t => t.id === state.poached?.[w]);
    const target = courted || others.sort((a, b) => warmth(b) - warmth(a))[0];
    const ownWarmth = warmth(own);
    const motive = share * 2 + (5 - S(w, 'loyalty')) * 0.15 + (S(w, 'boldness') - 5) * 0.08 + (target ? warmth(target) - ownWarmth : 0) * 0.15 + (courted ? 0.6 : 0) - 1.4;
    if (target && live(state, own).length > 2 && rng() < logistic(motive) * 0.7) {
      moveTeam(state, w, own, target, 'switch');
      for (const n of live(state, own)) { addBond(n, w, -0.8); remember(n, w, 'switched-on-us', 1.2); }
      for (const n of live(state, target)) addBond(n, w, 0.3);
      giveRespect(state, w, 'arenaWin');
      out.switch = { name: w, from: own.name, to: target.name };
      addScene(state, 'team-switch', [w, target.captain, own.captain].filter((x, i, a) => x && a.indexOf(x) === i && state.active.includes(x)), { from: own.name, to: target.name, voted,
        // the captains by part (a captain already sent home leaves the part empty, rather than another taking it: seed 6)
        joinCaptain: state.active.includes(target.captain) && target.captain !== w ? target.captain : null,
        leaveCaptain: state.active.includes(own.captain) && own.captain !== w ? own.captain : null,
        // somebody from the old team who said the name, and somebody from the new one, for the reactions
        stung: (m.vote.ballots || []).find(b => b.target === w && b.voter !== own.captain && state.active.includes(b.voter))?.voter || null,
        welcomer: live(state, target).filter(n => n !== target.captain && n !== w).sort((x, y) => getBond(w, y) - getBond(w, x))[0] || null }, state.active, 'arena');
    } else if (target) {
      // the stay (the user, 2026-10-17: "more reactions to a switch or a stay"): back to the team that voted them in. The
      // ones who said the name have to look at them; the team is relieved, or wary; the other side was turned down.
      const voters = (m.vote.ballots || []).filter(b => b.target === w).map(b => b.voter).filter(n => state.active.includes(n));
      for (const n of live(state, own)) if (n !== w) addBond(n, w, voters.includes(n) ? 0.2 : 0.5);
      for (const n of voters) remember(w, n, 'voted-me-in-and-i-stayed', 0.6);
      nudge(state, w, 'morale', 0.3);
      addScene(state, 'team-stay', [w, ...[own.captain, target.captain].filter(x => x && x !== w && state.active.includes(x))], {
        from: own.name, to: target.name, voted,
        ownCaptain: state.active.includes(own.captain) && own.captain !== w ? own.captain : null,
        otherCaptain: state.active.includes(target.captain) ? target.captain : null,
        stung: voters.find(v => v !== own.captain) || null,
        friend: live(state, own).filter(n => n !== w && !voters.includes(n) && n !== own.captain).sort((x, y) => getBond(w, y) - getBond(w, x))[0] || null,
        // the stay reads the room: a winner who was barely voted in stays easily; most of the team voted for them, and
        // staying is a statement
        statement: share >= 0.5 }, state.active, 'arena');
    }
  }
  out.folded = foldTeams(state);
  return out;
}
function moveTeam(state, n, from, to, how) {
  from.members = from.members.filter(x => x !== n);
  to.members.push(n);
  state.teamOf[n] = to.id;
  state.teamHistory.push({ name: n, from: from.id, to: to.id, ep: state.ep, how });
  if (from.captain === n) from.captain = captainOf(state, live(state, from));
}
/** A team down to one: its last player folds into the smallest other team. Two teams becoming one ends the teams. */
export function foldTeams(state) {
  const out = [];
  for (const t of [...state.teams]) {
    const m = live(state, t);
    if (m.length >= 2) continue;
    state.teams = state.teams.filter(x => x !== t);
    if (m[0] && state.teams.length) {
      const to = [...state.teams].sort((a, b) => live(state, a).length - live(state, b).length)[0];
      moveTeam(state, m[0], t, to, 'fold');
      addScene(state, 'team-fold', [m[0], to.captain].filter(x => state.active.includes(x)), { from: t.name, to: to.name }, state.active, 'villa');
      out.push({ name: m[0], from: t.name, to: to.name });
    }
  }
  if (state.teams.length < 2 && !state.teamsBroken) breakUpTeams(state, 'one-team');
  return out;
}
/** The teams are over: every player for themselves from here (Invasion: "both teams are dismantled"). */
export function breakUpTeams(state, why = 'breakup') {
  if (state.teamsBroken) return;
  state.teamsBroken = { ep: state.ep, why };
  for (const n of state.active) {
    // the old team's loyalty fades, and the people across the line are just people now
    for (const o of state.active) if (n < o && state.teamOf[n] && state.teamOf[n] !== state.teamOf[o]) addBond(n, o, 0.2);
  }
  addScene(state, 'teams-break', state.active, { why, teams: (state.teams || []).map(t => ({ name: t.name, members: live(state, t) })) }, state.active, 'villa');
}

// ── the team's own moments ───────────────────────────────────────────
// The captain gathers the losing team before the vote: a rally, or a captain who already knows the name.
function teamHuddle(state, team, eligible) {
  const cap = team.captain;
  if (!state.active.includes(cap)) return;
  const who = [cap, ...live(state, team).filter(n => n !== cap).slice(0, 3)];
  const hard = mayScheme(cap) && S(cap, 'strategic') >= 6;
  for (const n of who) nudge(state, n, 'morale', hard ? -0.2 : 0.3);
  addScene(state, 'team-huddle', who, { team: team.name, hard, size: live(state, team).length, eligible: eligible.length }, live(state, team), 'villa');
}

/**
 * The night before, for the one their own team voted in: a teammate who did NOT say their name sits up with them, or
 * nobody comes. Nobody knows the opponent yet (the winners say it at the Arena), so there is no confrontation.
 */
export function teamEve(state, rng, m) {
  const a = m.a;
  if (!state.active.includes(a)) return;
  const said = new Set(m.voters || []);
  const friend = teammates(state, a).filter(n => !said.has(n)).sort((x, y) => trustOf(y, a) - trustOf(x, a))[0]
    || state.active.filter(n => n !== a && !said.has(n)).sort((x, y) => trustOf(y, a) - trustOf(x, a))[0];
  if (friend && trustOf(friend, a) > 1) {
    addBond(friend, a, 0.6); remember(a, friend, 'was-there', 1);
    nudge(state, a, 'confidence', 0.5); nudge(state, a, 'morale', 0.4);
    addScene(state, 'arena-eve-pep', [friend, a], { team: true }, [friend, a], 'beach');
  } else {
    nudge(state, a, 'morale', -0.6);
    addScene(state, 'arena-eve-alone', [a], { team: true }, [a], 'confessional');
  }
}

/** A late arrival walks into a Teams season: the smallest team takes them. */
export function placeLate(state, names) {
  if (!teamsOn(state)) return;
  for (const n of names) {
    if (state.teamOf[n]) continue;
    const to = [...state.teams].sort((a, b) => live(state, a).length - live(state, b).length)[0];
    if (!to) return;
    to.members.push(n); state.teamOf[n] = to.id;
    state.teamHistory.push({ name: n, from: null, to: to.id, ep: state.ep, how: 'late' });
  }
}

/** The team final: each team placed on its members' average; the best team's members are the champions. */
export function teamFinalPlaces(state, total) {
  const teams = (state.teams || []).map(t => ({ t, m: live(state, t) })).filter(x => x.m.length);
  const avg = x => x.m.reduce((s, n) => s + (total[n] || 0), 0) / x.m.length;
  return teams.sort((a, b) => avg(b) - avg(a)).map(x => ({ name: x.t.name, members: x.m, avg: +avg(x).toFixed(2) }));
}

