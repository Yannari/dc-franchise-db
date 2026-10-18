// "Previously on The Ridonculous Race": one clause per moment, in Don's voice (dry, short, a little
// mean). Keyed `<kind>.<ending>`, `<kind>.<matPlace>` (don-place), or `<kind>`; the family-8 sabotages
// share `sabotage` / `sabotage.seen`. Slots as in the pools ({team} {teamB} {a} {b} {target}).
export default {
  'don-elim': ["And {team}? Last on the mat, and out of the race.", "{team} came in last, and I sent them home."],
  'don-arrives': ["{team} were so far behind I had to go out and find them. They're done."],
  'don-place.first': ["{team} took the leg.", "{team} got to me first."],
  sabotage: ["{team} played dirty with {teamB}.", "{team} decided {teamB} were in the way."],
  'sabotage.seen': ["{team} got caught messing with {teamB}, and it cost them an hour."],
  'alliance-betrayal': ["{team} turned on their own allies, {teamB}."],
  'alliance-pitch.accepted': ["{team} and {teamB} shook on an alliance."],
  snap: ["{a} finally lost it at {b}."],
  'blame.blow-up': ["{a} and {b} had their worst fight yet."],
  'old-wound.explodes': ["{a} and {b} dug up something old, and it went badly."],
  breakup: ["{a} and {b} broke up. In the middle of my race."],
  'back-together': ["{a} and {b} got back together. I didn't ask."],
  'confession.mutual': ["{a} finally told {b} how {a.sub} felt, and it went well. Gross."],
  'confession.crushed': ["{a} told {b} how {a.sub} felt. It did not go well."],
  'boomerang-decide': ["{team} sent {target} back with a Boomerang."],
  'medevac-choice': ["{team} had to leave the race, and they picked {teamB} to come back."],
  'quit-task': ["{a} quit a task and cost {b} four hours."],
  'help-offer.accepted': ["{team} stopped to help {teamB}, and paid for it."],
};
