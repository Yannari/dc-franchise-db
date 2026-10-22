// The tower's one slow elevator (js/rr/lift.js; the user, 2026-10-22: "we dont see them waiting for the elevator and
// fighting for one of the 2 places or trying to get on it faster than everyone else and close the door").
//   lift-door      a: the team inside, c: the team running up. held / shut (in first, may scheme) / full (nothing to do)
//   lift-scramble  a: the team that gets on, c: the one left. pushed-in (past the team in line) / held-line
//   task-stage     the doors (they waited for a car, or walked straight in) and the ride (with another team, or alone)
// What these say is what happened: the facts are the elevator's, as it went (liftWith, liftWaited).
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const at = (taskId, stage, more = {}) => ({ taskId, stage, ...more });

export default {
  'lift-door.held': [
    { id: 'hcl.h1', turns: [
      beat('The doors start to close. {c} and {d} come sprinting down the hallway, and {a} sticks an arm out. The doors bounce back open.'),
      by('c', "Thank you! Thank you so much."),
      by('a', "Don't thank me. Just stand on your side of the car."),
      by('d', "Deal."),
    ] },
    { id: 'hcl.h2', turns: [
      beat('{c} and {d} are still ten steps away when the doors begin to slide shut. {a} jams a thumb on the open button.'),
      by('b', "What are you doing? We could be going up!"),
      by('a', "It takes two teams. It's going up either way. Might as well be nice about it."),
      by('c', "We owe you one."),
      by('b', "Remember that when we're out on the deck."),
    ] },
    { id: 'hcl.h3', turns: [
      beat('The doors are closing. {a} holds them with a foot.'),
      by('a', "Come on, come on, there's room!"),
      by('d', "We're coming!"),
      beat('{c} and {d} squeeze in, and the doors close behind them.'),
      by('c', "Okay. Hi. This is cozy."),
    ] },
  ],
  'lift-door.shut': [
    { id: 'hcl.s1', turns: [
      beat('{c} and {d} round the corner just as the doors start to close. {a} looks right at them and presses the button again.'),
      by('c', "Hold the door! Hold the door!"),
      by('a', "Sorry! It's broken!"),
      beat('The doors meet. The car starts up.'),
      by('b', "It's not broken."),
      by('a', "It is for them."),
    ] },
    { id: 'hcl.s2', turns: [
      beat('{d} gets a hand to the doors a second too late. {a} has already hit the close button three times.'),
      by('d', "Are you serious? There was room for us!"),
      by('a', "There was room. Now there isn't."),
      beat('The doors shut, and the car pulls away without them.'),
      by('b', "That was cold."),
      by('a', "That was ten minutes on them. You're welcome."),
    ] },
    { id: 'hcl.s3', turns: [
      by('b', "They're coming. Should we wait for them?"),
      by('a', "Wait for who? I don't see anybody."),
      beat('{a} keeps a finger on the close button while {c} and {d} run straight at the closing doors.'),
      by('c', "We saw you! We saw you do that!"),
    ] },
  ],
  'lift-door.full': [
    { id: 'hcl.f1', turns: [
      beat('The car is already full when {c} and {d} reach it. The doors close right in front of them.'),
      by('c', "No, no, no. Next one?"),
      by('d', "Next one. It has to go all the way up and come back down first."),
      by('c', "Then we wait. Great."),
    ] },
    { id: 'hcl.f2', turns: [
      beat('The doors slide shut with two teams inside, a step before {c} and {d} can get on.'),
      by('c', "Next one. We'll get the next one."),
      by('d', "The next one is ten minutes away. The stairs would've been ten minutes."),
    ] },
    { id: 'hcl.f3', turns: [
      beat('{c} and {d} get to the doors as they close. Through the gap, {a} gives them a small wave.'),
      by('a', "Sorry! Full!"),
      by('d', "Yeah. We can see that."),
    ] },
  ],
  'lift-scramble.pushed-in': [
    { id: 'hcl.p1', turns: [
      beat('The doors open. {c} and {d} were there first, but {a} and {b} shoulder straight past them into the last space.'),
      by('c', "Excuse me, we were waiting!"),
      by('a', "And now you're still waiting. Bye!"),
      beat('The doors close, and {c} and {d} are left staring at their own reflection in the metal.'),
    ] },
    { id: 'hcl.p2', turns: [
      beat('Three teams, two places. When the doors open, {a} grabs {b} by the wrist and dives in before {c} can move.'),
      by('d', "That was ours! We were next!"),
      by('a', "Was there a line? I didn't see a line."),
      by('b', "There was a line."),
      by('a', "Well, there isn't anymore."),
    ] },
    { id: 'hcl.p3', turns: [
      by('c', "We were here first."),
      by('a', "Were you? It's a race. Nobody said it was a queue."),
      beat('{a} and {b} slip in ahead of them, and the doors shut.'),
      by('d', "I hate them. I just want that on the record."),
    ] },
  ],
  'lift-scramble.held-line': [
    { id: 'hcl.l1', turns: [
      beat('The doors open and {c} edges toward them. {a} steps sideways and blocks the way.'),
      by('a', "Nope. We've been standing here for ages. You're behind us."),
      by('c', "It was worth a try."),
      by('b', "It really wasn't."),
    ] },
    { id: 'hcl.l2', turns: [
      by('d', "It's a big car. You could fit one more team, right?"),
      by('a', "It takes two teams. That's us and them. You're next."),
      by('d', "Fine. We'll just stand here and watch the numbers go up."),
    ] },
    { id: 'hcl.l3', turns: [
      beat('{c} and {d} start drifting toward the doors before the car is even down.'),
      by('b', "We were here first. Everybody saw that."),
      by('c', "We're just standing close. Standing close isn't cheating."),
      by('a', "It is when you're standing in front of us."),
    ] },
  ],
  'task-stage.ok': [
    // ── the doors: a wait for the car, or straight in ──
    { id: 'hcl.d1', when: at('tower', 'lift-doors', { liftWaited: true }), turns: [
      beat('The one elevator is somewhere near the top. {a} presses the call button, then presses it again.'),
      by('b', "Pressing it twice doesn't make it come faster."),
      by('a', "It makes me feel faster."),
      beat('The numbers above the doors count down, very slowly.'),
    ] },
    { id: 'hcl.d2', when: at('tower', 'lift-doors', { liftWaited: true }), turns: [
      by('b', "How long have we been standing here?"),
      by('a', "Four minutes. The stairs teams are probably on floor thirty by now."),
      by('b', "Don't say that. This was your idea."),
      by('a', "It was a good idea four minutes ago."),
    ] },
    { id: 'hcl.d3', when: at('tower', 'lift-doors', { liftWaited: true }), turns: [
      beat('They stand at the doors and watch the little light crawl down, one floor at a time.'),
      by('a', "Come on. Come on."),
      by('b', "Talking to it isn't going to help."),
      by('a', "You don't know that."),
    ] },
    { id: 'hcl.d4', when: at('tower', 'lift-doors', { liftWaited: false }), turns: [
      beat('The doors are open when they get there, and the car is empty.'),
      by('a', "Oh, it's waiting for us."),
      by('b', "Then get in before somebody else does."),
    ] },
    { id: 'hcl.d5', when: at('tower', 'lift-doors', { liftWaited: false }), turns: [
      beat('{a} hits the button, and the doors slide open straight away.'),
      by('b', "That never happens."),
      by('a', "Don't jinx it. Get in."),
    ] },
    // ── the ride: two teams in one small car, or the car to themselves ──
    { id: 'hcl.r1', when: at('tower', 'elevator', { liftWith: true }), turns: [
      beat('Two teams in one small car. Nobody knows where to look.'),
      by('a', "So. Nice weather today."),
      by('b', "Don't talk to them."),
      by('a', "I'm being polite."),
      by('b', "Be polite at the top."),
    ] },
    { id: 'hcl.r2', when: at('tower', 'elevator', { liftWith: true }), turns: [
      beat('The car is packed with both teams. {a} ends up with somebody\'s elbow in {a.posAdj} ribs.'),
      by('a', "Ow."),
      by('b', "Sorry. That wasn't me. That was them."),
    ] },
    { id: 'hcl.r3', when: at('tower', 'elevator', { liftWith: false }), turns: [
      beat('They have the whole car to themselves.'),
      by('b', "Just us. Nobody to fight for space with."),
      by('a', "Good. I can panic about the deck in private."),
    ] },
    { id: 'hcl.r4', when: at('tower', 'elevator', { liftWith: false }), turns: [
      by('a', "Nobody else in here. We got lucky."),
      by('b', "Or everybody else took the stairs because they're smarter than us."),
      by('a', "Let's go with lucky."),
    ] },
  ],
};
