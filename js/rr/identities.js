// ══════════════════════════════════════════════════════════════════════
// rr/identities.js — what a team is together (the 54 built-in identities)
// ══════════════════════════════════════════════════════════════════════
//
// docs/ridonculous-race-identities.md. An identity nudges its task types (×1.12
// good, ×0.88 bad, skill.js identityFactor) and seeds first-leg friction and
// friendship between teams. The voices live with the dialogue (sub-project 2), per
// archetype (the user, 2026-10-18). "Each other" and "nobody" in the doc are left out.
const I = (name, group, good, bad, friction = [], friends = [], extra = {}) =>
  ({ name, group, good, bad, friction, friends, ...extra });

export const IDENTITIES = {
  // Athletes
  surfers: I('Surfers', 'athletes', ['water', 'nerve'], ['brains', 'travel'], ['rich-kids', 'lawyers'], ['lifeguards', 'hippies']),
  'ice-dancers': I('Ice Dancers', 'athletes', ['hands', 'perform'], ['strength', 'stomach'], ['cheerleaders', 'tennis-rivals'], ['dancers']),
  'tennis-rivals': I('Tennis Rivals', 'athletes', ['hands', 'strength'], ['people', 'patience'], ['ice-dancers'], []),
  cheerleaders: I('Cheerleaders', 'athletes', ['perform', 'heights'], ['brains', 'stomach'], ['goths', 'punks'], ['beauty-queens']),
  wrestlers: I('Wrestlers', 'athletes', ['strength', 'stomach'], ['hands', 'patience'], ['geniuses', 'fashion-bloggers'], ['lumberjacks']),
  skateboarders: I('Skateboarders', 'athletes', ['nerve', 'travel'], ['patience', 'brains'], ['police-cadets', 'retirees'], ['punks']),
  // Performers
  rockers: I('Rockers', 'performers', ['perform', 'stomach'], ['patience', 'hands'], ['church-choir', 'retirees'], ['punks', 'party-animals']),
  rappers: I('Rappers', 'performers', ['perform', 'brains'], ['water', 'heights'], ['debate-team'], ['vloggers']),
  actors: I('Actors', 'performers', ['perform', 'people'], ['strength', 'water'], ['reality-tv-pros', 'lawyers'], ['magicians']),
  dancers: I('Dancers', 'performers', ['perform', 'hands'], ['stomach', 'brains'], ['wrestlers'], ['ice-dancers', 'cheerleaders']),
  magicians: I('Magicians', 'performers', ['hands', 'search'], ['strength', 'water'], ['scientists'], ['actors']),
  'beauty-queens': I('Beauty Queens', 'performers', ['people', 'perform'], ['strength', 'stomach'], ['survivalists', 'wrestlers'], ['cheerleaders', 'cowboys']),
  // Subcultures
  goths: I('Goths', 'subcultures', ['nerve', 'patience'], ['perform', 'people'], ['cheerleaders', 'influencers'], ['librarians']),
  gamers: I('Gamers', 'subcultures', ['brains', 'search'], ['strength', 'water'], ['lumberjacks'], ['streamers', 'geniuses']),
  cosplayers: I('Cosplayers', 'subcultures', ['hands', 'perform'], ['strength', 'travel'], ['fashion-bloggers'], ['gamers', 'actors']),
  punks: I('Punks', 'subcultures', ['nerve', 'stomach'], ['people', 'patience'], ['police-cadets', 'beauty-queens'], ['rockers', 'skateboarders']),
  hippies: I('Hippies', 'subcultures', ['patience', 'people'], ['travel', 'strength'], ['rich-kids', 'soldiers'], ['surfers', 'vegans']),
  cowboys: I('Cowboys', 'subcultures', ['strength', 'nerve'], ['travel', 'perform'], ['vegans', 'influencers'], ['farmers', 'beauty-queens']),
  // Uniforms
  'police-cadets': I('Police Cadets', 'uniforms', ['search', 'strength'], ['perform', 'nerve'], ['punks', 'skateboarders'], ['soldiers', 'firefighters']),
  soldiers: I('Soldiers', 'uniforms', ['travel', 'strength'], ['perform', 'people'], ['hippies'], ['police-cadets']),
  firefighters: I('Firefighters', 'uniforms', ['heights', 'strength'], ['brains', 'hands'], [], ['police-cadets', 'nurses']),
  lifeguards: I('Lifeguards', 'uniforms', ['water', 'nerve'], ['brains', 'perform'], ['party-animals'], ['surfers']),
  nurses: I('Nurses', 'uniforms', ['stomach', 'patience'], ['heights', 'nerve'], ['party-animals'], ['firefighters', 'retirees']),
  'flight-attendants': I('Flight Attendants', 'uniforms', ['travel', 'people'], ['strength', 'nerve'], ['rich-kids'], ['retirees']),
  // Online
  influencers: I('Influencers', 'online', ['people', 'perform'], ['stomach', 'patience'], ['goths', 'survivalists'], ['vloggers']),
  'fashion-bloggers': I('Fashion Bloggers', 'online', ['hands', 'people'], ['water', 'stomach'], ['cosplayers', 'wrestlers'], ['beauty-queens']),
  vloggers: I('Vloggers', 'online', ['perform', 'search'], ['patience', 'brains'], ['podcasters'], ['influencers', 'rappers']),
  podcasters: I('Podcasters', 'online', ['people', 'brains'], ['strength', 'nerve'], ['vloggers'], ['debate-team', 'lawyers']),
  streamers: I('Streamers', 'online', ['brains', 'hands'], ['strength', 'people'], ['retirees'], ['gamers']),
  'reality-tv-pros': I('Reality-TV Pros', 'online', ['people', 'perform'], ['hands', 'patience'], ['actors'], []),
  // Brains
  geniuses: I('Geniuses', 'brains', ['brains', 'travel'], ['strength', 'nerve'], ['wrestlers'], ['gamers', 'librarians']),
  'debate-team': I('Debate Team', 'brains', ['people', 'brains'], ['strength', 'water'], ['rappers'], ['podcasters', 'lawyers']),
  scientists: I('Scientists', 'brains', ['brains', 'hands'], ['perform', 'stomach'], ['magicians', 'hippies'], ['geniuses']),
  lawyers: I('Lawyers', 'brains', ['people', 'brains'], ['stomach', 'nerve'], ['surfers', 'actors'], ['debate-team']),
  'chess-players': I('Chess Players', 'brains', ['brains', 'patience'], ['strength', 'perform'], ['party-animals'], ['geniuses', 'retirees']),
  librarians: I('Librarians', 'brains', ['search', 'brains'], ['nerve', 'perform'], ['party-animals'], ['goths', 'retirees']),
  // Hands-on
  lumberjacks: I('Lumberjacks', 'hands-on', ['strength', 'hands'], ['travel', 'perform'], ['gamers'], ['wrestlers', 'farmers']),
  farmers: I('Farmers', 'hands-on', ['strength', 'stomach'], ['travel', 'perform'], ['rich-kids'], ['cowboys', 'lumberjacks']),
  survivalists: I('Survivalists', 'hands-on', ['nerve', 'search'], ['people', 'travel'], ['influencers'], ['fishers']),
  chefs: I('Chefs', 'hands-on', ['hands', 'stomach'], ['patience', 'water'], ['vegans'], ['farmers', 'fishers']),
  mechanics: I('Mechanics', 'hands-on', ['hands', 'travel'], ['perform', 'people'], ['rich-kids'], ['farmers']),
  fishers: I('Fishers', 'hands-on', ['water', 'patience'], ['travel', 'perform'], ['party-animals'], ['survivalists', 'chefs']),
  // Lifestyle
  vegans: I('Vegans', 'lifestyle', ['patience', 'water'], ['stomach', 'strength'], ['chefs', 'cowboys'], ['hippies']),
  'rich-kids': I('Rich Kids', 'lifestyle', ['travel', 'perform'], ['strength', 'stomach'], ['farmers', 'mechanics', 'surfers'], []),
  retirees: I('Retirees', 'lifestyle', ['patience', 'people'], ['strength', 'heights'], ['skateboarders'], ['nurses', 'librarians', 'flight-attendants']),
  'adversity-twins': I('Adversity Twins', 'lifestyle', ['nerve', 'patience'], ['hands', 'heights'], [], ['firefighters', 'nurses'], { mishap: 1.5 }),
  'party-animals': I('Party Animals', 'lifestyle', ['stomach', 'people'], ['patience', 'travel'], ['librarians', 'nurses', 'chess-players'], ['rockers']),
  'church-choir': I('Church Choir', 'lifestyle', ['perform', 'patience'], ['nerve', 'stomach'], ['rockers'], ['retirees']),
  // Everyday Jobs
  teachers: I('Teachers', 'everyday', ['people', 'patience'], ['nerve', 'stomach'], ['party-animals'], ['librarians', 'retirees']),
  'office-workers': I('Office Workers', 'everyday', ['brains', 'patience'], ['strength', 'nerve'], ['survivalists'], ['flight-attendants']),
  'construction-workers': I('Construction Workers', 'everyday', ['strength', 'heights'], ['brains', 'perform'], ['fashion-bloggers'], ['lumberjacks', 'mechanics']),
  servers: I('Servers', 'everyday', ['hands', 'people'], ['water', 'brains'], ['rich-kids'], ['chefs']),
  truckers: I('Truckers', 'everyday', ['travel', 'patience'], ['perform', 'brains'], ['influencers'], ['mechanics', 'farmers']),
  'college-students': I('College Students', 'everyday', ['brains', 'stomach'], ['travel', 'patience'], ['retirees'], ['party-animals', 'gamers']),
};

// The identity a team plays as: a built-in one, or the user's own (the user, 2026-10-19: "custom identities could
// borrow from different identities so our possibilities become endless, or build a specific one"). A custom identity
// `{ name, mix, good, bad, voice }` blends up to three built-in ones: their most shared strengths and weaknesses, two
// of each (a built-in has two of each, so a blend is no stronger than one), their frictions and friendships, and
// talks like `voice` (identity.js). Strengths or weaknesses picked by hand (`good`, `bad`) replace the blend's. An
// old custom with only `strength` plays as that one identity.
const BLENDS = new WeakMap();
const ranked = list => { const n = {}; for (const t of list) n[t] = (n[t] || 0) + 1; return Object.keys(n).sort((x, y) => n[y] - n[x]); };
export function identityOf(team) {
  if (team?.identity && IDENTITIES[team.identity]) return IDENTITIES[team.identity];
  const c = team?.custom;
  if (!c) return null;
  const mix = (c.mix?.length ? c.mix : c.strength ? [c.strength] : []).filter(id => IDENTITIES[id]);
  if (!mix.length && !c.good?.length && !c.bad?.length) return null;
  if (BLENDS.has(c)) return BLENDS.get(c);
  const of = mix.map(id => IDENTITIES[id]);
  const good = (c.good?.length ? c.good : ranked(of.flatMap(x => x.good))).slice(0, 2);
  const bad = (c.bad?.length ? c.bad : ranked(of.flatMap(x => x.bad))).filter(t => !good.includes(t)).slice(0, 2);
  const out = { name: c.name || of[0]?.name || 'Custom', group: of[0]?.group || 'everyday', good, bad,
    friction: [...new Set(of.flatMap(x => x.friction || []))], friends: [...new Set(of.flatMap(x => x.friends || []))],
    ...(of.some(x => x.mishap) ? { mishap: of.reduce((a, x) => a + (x.mishap || 1), 0) / of.length } : {}), custom: true };
  BLENDS.set(c, out);
  return out;
}
