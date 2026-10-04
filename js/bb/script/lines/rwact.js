// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/rwact.js — the Rewind and the White Locust (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// The Rewind erases the week after the vote, and publishes every ballot: the
// one twist where a vote IS public, so these lines may name it. The White
// Locust is a call-out chain at a resort: survive your task and you call out
// the next person, with less time (written by bb/script/ceremony.js).
//
//   rwact.stop       a plays the Rewind                          scene
//   rwact.erased     a stays; b, the HOH, loses the week         scene
//   rwact.everybody  a hears everybody plays again (DR)          scene
//   rwact.public     a voted to evict b; b now knows             scene
//   rwact.rest       a was named in the count too (DR)           scene
//   rwact.theirs     a's own vote against b is in it (DR)        scene
//   rwact.call       a calls b out                               ally | plain
//   rwact.made       a beats the clock                           scene
//   rwact.failed     a does not                                  scene
//   rwact.out        a does not check out                        scene

export default {
  'rwact.stop.scene': [
    { id: 'rw7.s1', turns: [{ by: 'a', say: "Stop. I'm using the Rewind." }, { beat: 'Nobody in the room breathes.' }] },
    { id: 'rw7.s2', turns: [{ by: 'a', say: "Not so fast. This whole week is getting erased." }] },
  ],
  'rwact.erased.scene': [
    { id: 'rw7.e1', turns: [{ by: 'b', say: "So I'm not Head of Household any more?" }, { by: 'a', say: "And I'm not going anywhere." }] },
    { id: 'rw7.e2', turns: [{ by: 'b', dr: "A whole week of work, and it's like it never happened." }] },
  ],
  'rwact.everybody.scene': [
    { id: 'rw7.y1', turns: [{ by: 'a', dr: "We all play for HOH again tomorrow. It's like starting the week over." }] },
  ],
  'rwact.public.scene': [
    { id: 'rw7.p1', turns: [{ by: 'b', say: "You voted to evict me?" }, { by: 'a', say: "I can explain." }, { by: 'b', say: "Go on, then." }] },
    { id: 'rw7.p2', turns: [{ by: 'b', dr: "{a} voted me out. And now I'm still here, and {a} knows I know." }] },
  ],
  'rwact.rest.scene': [
    { id: 'rw7.r1', turns: [{ by: 'a', dr: "My vote got read out in front of everyone. I've got some explaining to do." }] },
  ],
  'rwact.theirs.scene': [
    { id: 'rw7.t1', turns: [{ by: 'a', dr: "My vote against {b} got read out too. That's the price, I suppose." }] },
  ],
  'rwact.call.ally': [
    { id: 'rw7.c1', turns: [{ by: 'a', say: "Sorry, {b}. It has to be you." }, { by: 'b', say: "Seriously?" }] },
    { id: 'rw7.c2', turns: [{ by: 'a', say: "{b}. I'm sorry." }, { by: 'b', dr: "My own ally just sent me up there. I won't forget it." }] },
  ],
  'rwact.call.plain': [
    { id: 'rw7.p3', turns: [{ by: 'a', say: "{b}, you're up." }] },
    { id: 'rw7.p4', turns: [{ by: 'a', say: "I'm calling out {b}." }, { by: 'b', say: "Fine. Watch me." }] },
    { id: 'rw7.p5', turns: [{ by: 'a', say: "{b}. Let's see what you've got." }] },
  ],
  'rwact.made.scene': [
    { id: 'rw7.m1', turns: [{ by: 'a', say: "Done! Made it!" }] },
    { id: 'rw7.m2', turns: [{ by: 'a', dr: "I beat the clock, and now I get to pick who's next." }] },
    { id: 'rw7.m3', turns: [{ by: 'a', say: "Yes! Who's next?" }] },
  ],
  'rwact.failed.scene': [
    { id: 'rw7.f1', turns: [{ by: 'a', say: "No. No, no, no." }] },
    { id: 'rw7.f2', turns: [{ by: 'a', dr: "I ran out of time. That's it." }] },
  ],
  'rwact.out.scene': [
    { id: 'rw7.o1', turns: [{ by: 'a', say: "I guess I'm not checking out with the rest of you." }] },
    { id: 'rw7.o2', turns: [{ by: 'a', dr: "No vote, no campaign. Just a clock, and I lost to it." }] },
  ],
};
