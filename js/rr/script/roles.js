// ══════════════════════════════════════════════════════════════════════
// rr/script/roles.js — who plays which part in a scene, and how it ended
// ══════════════════════════════════════════════════════════════════════
//
// The engine records a scene as { kind, who, data } (rr/scenes.js). A pool line is written
// for parts and an ENDING the engine already decided (manual §19.2: the engine decides,
// the words describe). This turns one into the other, by the kind's cast:
//   team    a = the one the moment is about (the leader for the moments a leader drives:
//           the tip, the route, the side, the pep talk), b = the partner
//   teams   a, b = the team at the centre (a acted), c, d = the other team
//           romance: a, b = the two lovers, c, d = their partners
//   group   a…f = the people seated, in seat order
//   local   a, b = the team; `local` speaks, named by its role ("the driver")
//   don     `don` speaks; a, b = the team he speaks to, when there is one
//   solo    a alone (an interview about a secret)
// Slots a line may name besides the parts: {team} {teamB} {identity} {identityB} {place}
// {task} {side} {partner} {crush} {target} {reward} {penalty} {amount} {local}. A slot is
// filled only from the scene's own record; an entry whose slot is empty is never picked.
import { SCENES } from '../scenes.js';
import { PLACES } from '../places.js';
import { IDENTITIES } from '../identities.js';

export const DON = 'Don';

// partner moments one of them drives: the leader speaks first
const LEAD_KINDS = new Set(['tip-read', 'decide-side', 'which-way', 'transport-pick', 'plan-the-leg', 'pep-talk',
  'manage-partner', 'money-worry', 'celebrate', 'driver', 'ask-directions', 'agent', 'vendor', 'local-rule', 'local-help',
  'spending-fight', 'sell', 'beg', 'weather', 'souvenir']);
// what a local is called in the scene
const LOCAL = { driver: 'the driver', 'ask-directions': 'a local', agent: 'the ticket agent', 'judge-no': 'the judge',
  'judge-yes': 'the judge', 'local-rule': 'a local', 'local-help': 'a local', vendor: 'the vendor', 'crowd-performance': 'the crowd' };
const REWARD = { cash: 'two hundred dollars', 'first-class': 'first-class seats on the next flight', 'call-home': 'a phone call home',
  express: 'an Express Pass', save: 'a Save' };
const PENALTY = { 'surrender-money': 'hand over all your money', 'surrender-all': 'hand over all your money and your bags',
  'speed-bump': 'an extra task next leg', marked: 'thirty minutes on the clock next leg unless you win it',
  departure: 'leaving an hour after everyone else' };

// "the Goths" for a team named by its identity, "Alec and Spud" for the rest: the team talked about
export function teamRef(state, id) {
  const t = state.teams[id];
  if (!t) return null;
  if (t.identity && IDENTITIES[t.identity]?.name === t.name) return `the ${t.name}`;
  return t.name.replace(/ & /g, ' and ');
}
// the team spoken to, by the two of them ("Alec and Spud, you're team number two!")
const teamVoc = (st, id) => (st.teams[id] ? `${st.teams[id].a} and ${st.teams[id].b}` : null);
const identityName = (st, id) => {
  const t = st.teams[id];
  if (!t) return null;
  if (t.custom?.name) return t.custom.name;
  return t.identity && IDENTITIES[t.identity] ? IDENTITIES[t.identity].name : null;
};
const partnerOf = (st, n) => { const t = Object.values(st.teams).find(x => x.a === n || x.b === n); return t ? (t.a === n ? t.b : t.a) : null; };
const stretchOf = (st, sc) => {
  const id = sc.data?.stretch;
  if (!id) return null;
  if (id === 'airport') return { id, label: 'the airport' };
  if (id === 'board') return { id, label: 'the Don Box' };
  if (id === 'mat') return { id, label: 'the Chill Zone' };
  const place = PLACES[sc.data?.snap?.place];
  return place?.stretches.find(s => s.id === id) || { id, label: null };
};

export function rolesOf(scene, state) {
  const kind = SCENES[scene.kind];
  const d = scene.data || {};
  const tid = d.team, oid = d.other;
  const t = tid ? state.teams[tid] : null;
  // a plane full of teams is a room (travel.js same-flight)
  // the director's own kinds have no catalogue entry: a big cast's quick check-in is Don's
  const cast = scene.kind === 'same-flight' ? 'group' : ['mat-montage', 'don-narrate'].includes(scene.kind) ? 'don' : kind?.cast || 'team';
  const roles = {};
  const who = scene.who || [];

  if (kind?.family === 4) {
    const [x, y] = d.facts?.lovers?.length === 2 ? d.facts.lovers : [who[0], who[1]];
    Object.assign(roles, { a: x, b: y });
    const px = partnerOf(state, x), py = partnerOf(state, y);
    if (px && scene.seenBy.includes(px)) roles.c = px;
    if (py && scene.seenBy.includes(py)) roles.d = py;
  } else if (cast === 'teams') {
    const o = oid ? state.teams[oid] : null;
    const first = who[0] && t && [t.a, t.b].includes(who[0]) ? who[0] : t?.a;
    Object.assign(roles, { a: first, b: first === t?.a ? t?.b : t?.a });
    if (o) { const c = who.find(n => n === o.a || n === o.b) || o.a; Object.assign(roles, { c, d: c === o.a ? o.b : o.a }); }
  } else if (cast === 'group') {
    'abcdef'.split('').forEach((k, i) => { if (who[i]) roles[k] = who[i]; });
  } else if (cast === 'solo') {
    roles.a = who[0];
  } else {
    // team, local, don: the team's two, the doer first
    const lead = d.snap?.lead;
    const pair = t ? [t.a, t.b] : who.slice(0, 2);
    const botcher = d.snap?.botcher && pair.includes(d.snap.botcher) ? d.snap.botcher : null;
    const watcher = botcher ? pair.find(n => n !== botcher) : null;
    // the Botch: a is the one in the water, unless the partner pushed them in (pushed) or is the one watching
    const a = scene.kind === 'whose-botch' && botcher ? (d.ending === 'pushed' ? watcher : botcher)
      : scene.kind === 'watching-botch' && watcher ? watcher
      : LEAD_KINDS.has(scene.kind) && lead && pair.includes(lead) ? lead : who.find(n => pair.includes(n)) || pair[0];
    if (a) roles.a = a;
    const b = pair.find(n => n !== a);
    if (b) roles.b = b;
    if (cast === 'don') roles.don = DON;
    if (cast === 'local') roles.local = LOCAL[scene.kind] || 'a local';
  }
  for (const k of Object.keys(roles)) if (!roles[k]) delete roles[k];
  if (!Object.keys(roles).length && cast !== 'don') return null;

  const s = stretchOf(state, scene);
  const sideLabel = s?.sides?.find(x => x.id === d.snap?.side)?.label || null;
  const slots = {
    team: teamRef(state, tid), teamB: teamRef(state, oid),
    teamVoc: teamVoc(state, tid), teamBVoc: teamVoc(state, oid),
    identity: identityName(state, tid), identityB: identityName(state, oid),
    place: PLACES[d.snap?.place]?.name || null,
    task: s?.label || null,
    side: sideLabel,
    partner: roles.a ? partnerOf(state, roles.a) : null,
    crush: kind?.family === 4 ? roles.b : null,
    target: d.target ? teamRef(state, d.target) : null,
    targetVoc: d.target ? teamVoc(state, d.target) : null,
    reward: d.reward ? REWARD[d.reward] || null : null,
    penalty: d.penalty ? PENALTY[d.penalty] || null : null,
    amount: d.amount ?? d.raised ?? null,
    local: roles.local || null,
    // the hint on a Botch or Watch board ("Who's ready to get wet?")
    teaser: s?.teaser || null,
    // a task montage: the teams that got through it together ("Goths, Lawyers and Nurses")
    teams: d.teamsList?.length ? listNames(d.teamsList.map(id => teamRef(state, id))) : null,
    // Don's narration carries its own (director.js): {winners} {count} {gap} {flight} {task} {prevTask} {team}
    ...(scene.kind === 'don-narrate' ? { teamVoc: null, teamBVoc: null, targetVoc: null, ...d.slots } : {}),
  };
  for (const k of Object.keys(slots)) if (slots[k] == null) delete slots[k];
  return { roles, ending: d.ending ?? 'any', slots };
}

// "A", "A and B", "A, B and C"; "the Goths, Alec and Spud, and the Nurses" when a name has its own "and"
function listNames(names) {
  if (names.length <= 1) return names[0] || null;
  const serial = names.length > 2 && names.some(n => n.includes(' and ')) ? ',' : '';
  return `${names.slice(0, -1).join(', ')}${serial} and ${names.at(-1)}`;
}
