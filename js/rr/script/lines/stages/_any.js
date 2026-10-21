// A stage of a staged challenge with no lines of its own yet, or whose own lines a team before has already said (each
// place's stage lines win: lines/stages/<place>.js). Since a challenge in stages follows a different set of teams each
// time (2026-10-21: the director's fair share), a third team through a stage is common, so these are many and work
// whether one partner is doing it (a Botch or Watch) or both are. Whole sentences, said the way people talk (the
// user, 2026-10-21: "speak like a human").
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });

export default {
  'task-stage.ok': [
    { id: 'stg.ok1', turns: [
      by('a', "Okay, that's one part done."),
      by('b', "Please tell me that was the hard part."),
      by('a', "I don't think there is an easy part."),
    ] },
    { id: 'stg.ok2', turns: [
      beat('{a} gets through it and takes a second to catch {a.posAdj} breath.'),
      by('b', "You're good, keep going, you're doing great."),
      by('a', "Yeah, yeah, I'm going."),
    ] },
    { id: 'stg.ok3', turns: [
      by('b', "Okay, that part's done."),
      by('a', "Don't get excited yet, there's still more to do."),
      by('b', "I'm not excited, I'm just glad it's over."),
    ] },
    { id: 'stg.ok4', turns: [
      beat('{a} gets it on the first try and looks back at {b}, surprised.'),
      by('a', "Wait, did that actually work?"),
      by('b', "It did, so don't think about it, just keep moving."),
    ] },
    { id: 'stg.ok5', turns: [
      by('a', "How are we doing on time?"),
      by('b', "I have no idea, but that was faster than the last part."),
      by('a', "Okay, I'll take that."),
    ] },
    { id: 'stg.ok6', turns: [
      by('b', "That's one down. Just keep doing what you're doing."),
      by('a', "I'm trying really hard not to think about the next one."),
      by('b', "Then don't think about it, just go."),
    ] },
    { id: 'stg.ok7', turns: [
      by('a', "I honestly can't believe that worked."),
      by('b', "Me neither, but I'm not complaining."),
      by('a', "Let's keep going before our luck runs out."),
    ] },
    { id: 'stg.ok8', turns: [
      by('b', "We're actually doing this."),
      by('a', "Are we doing it well, though?"),
      by('b', "We're doing it, and right now that's good enough."),
    ] },
    { id: 'stg.ok-1', turns: [
      { by: 'a', say: "Okay, that's done. What's next?" },
      { by: 'b', say: "I don't want to know what's next, honestly." },
      { by: 'a', say: "Well, we're about to find out." },
    ] },
    { id: 'stg.ok-2', turns: [
      { beat: '{a} gets through it and lets out a long breath.' },
      { by: 'a', say: "I really didn't think that was going to work." },
      { by: 'b', say: "Neither did I, but it did, so let's keep going." },
    ] },
    { id: 'stg.ok-3', turns: [
      { by: 'b', say: "That was way easier than it looked." },
      { by: 'a', say: "Please don't say that. You'll jinx the next part." },
      { by: 'b', say: "Fine, it was really hard, and the next part will be easy." },
    ] },
    { id: 'stg.ok-4', turns: [
      { by: 'a', say: "Are we doing okay? I can't tell anymore." },
      { by: 'b', say: "We're doing fine. Just keep going like that." },
      { by: 'a', say: "Okay. I can do this. I think I can do this." },
    ] },
    { id: 'stg.ok-5', turns: [
      { beat: '{a} gets it done and turns round to look for {b}.' },
      { by: 'b', say: "Yes! That's it! Keep going!" },
      { by: 'a', say: "I'm going, I'm going, stop shouting!" },
    ] },
    { id: 'stg.ok-6', turns: [
      { by: 'b', say: "Did you see that? We actually got it right." },
      { by: 'a', say: "I saw. I'm just as surprised as you are." },
      { by: 'b', say: "Let's not get used to it. On to the next part." },
    ] },
    { id: 'stg.ok-7', turns: [
      { by: 'a', say: "I'm exhausted, but that's one more part done." },
      { by: 'b', say: "You can tell me how tired you are later." },
      { by: 'a', say: "Oh, I will. For days." },
    ] },
    { id: 'stg.ok-8', turns: [
      { by: 'b', say: "How far behind the others do you think we are?" },
      { by: 'a', say: "I don't know, and I'm not going to look." },
      { by: 'b', say: "Good idea. Let's just keep moving." },
    ] },
  ],
  'task-stage.fail': [
    { id: 'stg.f1', turns: [
      beat('It all goes wrong at once.'),
      by('b', "Okay, we have to go back and do it again."),
      by('a', "I know, you don't have to tell me twice."),
    ] },
    { id: 'stg.f2', turns: [
      by('a', "That was so close."),
      by('b', "Close doesn't count, we have to do it again."),
      beat('{a} goes back to the start of that part and tries it again.'),
    ] },
    { id: 'stg.f3', turns: [
      by('a', "No, no, no, come on!"),
      by('b', "It's okay, it's fine, just try it again."),
      by('a', "It's not fine, but okay, I'll try it again."),
    ] },
    { id: 'stg.f4', turns: [
      beat('{b} watches it go wrong and puts both hands on {b.posAdj} head.'),
      by('b', "We were so close!"),
      by('a', "Then next time we'll get it. Come on."),
    ] },
    { id: 'stg.f5', turns: [
      by('a', "Okay, I'm going to go slower this time."),
      by('b', "Yeah, slower is good, take your time."),
      beat('{a} lets out a long breath and goes back to try it again.'),
    ] },
    { id: 'stg.f6', turns: [
      by('b', "What happened there?"),
      by('a', "I rushed it, I know I rushed it."),
      by('b', "Then stop and pace yourself. We've got time... well, kinda."),
    ] },
    { id: 'stg.f-1', turns: [
      { by: 'a', say: "No! I had it, I really had it!" },
      { by: 'b', say: "I know you did. Just go back and do it again." },
      { beat: '{a} shakes it off and goes back to the start of that part.' },
    ] },
    { id: 'stg.f-2', turns: [
      { beat: 'It goes wrong right at the very end.' },
      { by: 'b', say: "That's so unfair. You were nearly there." },
      { by: 'a', say: "Nearly doesn't count. I'm going again." },
    ] },
    { id: 'stg.f-3', turns: [
      { by: 'b', say: "What happened? It looked fine from here." },
      { by: 'a', say: "It wasn't fine from here, trust me." },
      { by: 'b', say: "Okay, take a breath and try it one more time." },
    ] },
    { id: 'stg.f-4', turns: [
      { by: 'a', say: "I can't believe I messed that up again." },
      { by: 'b', say: "Don't beat yourself up about it. Everyone's messing it up." },
      { by: 'a', say: "That makes me feel a little bit better, actually." },
    ] },
    { id: 'stg.f-5', turns: [
      { beat: '{b} winces as it all goes wrong.' },
      { by: 'b', say: "Okay, that one wasn't great." },
      { by: 'a', say: "Thanks, that's really helpful. I'm going again." },
    ] },
    { id: 'stg.f-6', turns: [
      { by: 'a', say: "Why does it keep doing that?" },
      { by: 'b', say: "I don't know. Try going a bit slower this time." },
      { by: 'a', say: "Okay, I'll go slower. I can do slower." },
    ] },
  ],
};
