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
    // (twenty-eight lines for sixty stages a season, 2026-11-03: more of the same plain talk)
    { id: 'stg.ok9', turns: [by('a', "Okay. Okay. That's done."), by('b', "Good job. Seriously, good job."), by('a', "Don't say good job yet. We're not finished.")] },
    { id: 'stg.ok10', turns: [beat('{a} finishes that part and shakes out {a.posAdj} hands.'), by('a', "My hands are shaking."), by('b', "Mine too, and I'm not even doing anything.")] },
    { id: 'stg.ok11', turns: [by('b', "Is that right? Did you do it right?"), by('a', "I think so. Nobody's stopping me."), by('b', "Then keep going before somebody does.")] },
    { id: 'stg.ok12', turns: [by('a', "That was horrible."), by('b', "But you did it."), by('a', "I did it, and it was horrible.")] },
    { id: 'stg.ok13', turns: [by('b', "Yes! Yes! That's it!"), by('a', "Shh, don't celebrate, we're not done."), by('b', "I'm celebrating a little bit.")] },
    { id: 'stg.ok14', turns: [beat('{a} gets through it and looks over at {b} with a huge grin.'), by('b', "Don't look at me, look at what you're doing!"), by('a', "Okay, okay!")] },
    { id: 'stg.ok15', turns: [by('a', "That was easier than I thought it would be."), by('b', "Don't say that out loud."), by('a', "Sorry. It was really hard.")] },
    { id: 'stg.ok16', turns: [by('b', "Good. Good. Now the next bit."), by('a', "What's the next bit?"), by('b', "I don't know, I've been watching you.")] },
    { id: 'stg.ok17', turns: [by('a', "Did anybody else get past that part?"), by('b', "I don't know. Don't look around. Just go."), by('a', "I'm going.")] },
    { id: 'stg.ok18', turns: [beat('{b} claps as {a} gets through it.'), by('b', "There you go! See? I told you!"), by('a', "You told me I'd fall."), by('b', "I said you might fall. You didn't.")] },
    { id: 'stg.ok19', turns: [by('a', "Okay, I think I'm getting the hang of this."), by('b', "Good, because there's a lot more of it."), by('a', "Of course there is.")] },
    { id: 'stg.ok20', turns: [by('b', "How was that?"), by('a', "Honestly? Terrifying. But it's done."), by('b', "Done is all that matters.")] },
    { id: 'stg.ok21', turns: [by('a', "We're doing it. We're actually doing it."), by('b', "Stop talking and keep doing it."), by('a', "Right. Yes. Doing it.")] },
    { id: 'stg.ok22', turns: [beat('{a} stops for a second, hands on {a.posAdj} knees.'), by('b', "You okay?"), by('a', "Yeah. Just give me two seconds."), by('b', "Two seconds. Then we go.")] },
    { id: 'stg.ok23', turns: [by('b', "That looked really hard."), by('a', "It was really hard."), by('b', "Well, you made it look easy."), by('a', "I did not make it look easy.")] },
    { id: 'stg.ok24', turns: [by('a', "Whoo! Okay! Okay!"), by('b', "Yes! Keep that energy!"), by('a', "I'm keeping it!")] },
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
    { id: 'stg.f7', turns: [by('a', "Ugh! Seriously?"), by('b', "It's okay. Shake it off."), by('a', "I'm shaking it off. I'm shaking it off.")] },
    { id: 'stg.f8', turns: [beat('It goes wrong, and {a} just stands there for a second.'), by('b', "Hey. Hey. You're fine. Go again."), by('a', "Okay. Okay, I'm going.")] },
    { id: 'stg.f9', turns: [by('b', "What happened?"), by('a', "I don't know! It just went wrong!"), by('b', "Okay. Do exactly the same thing, just slower.")] },
    { id: 'stg.f10', turns: [by('a', "I'm so sorry. I'm so sorry."), by('b', "Don't say sorry. Just do it again."), by('a', "Okay. Again.")] },
    { id: 'stg.f11', turns: [by('b', "No! Oh, come on!"), by('a', "I know! I know!"), by('b', "You were right there!")] },
    { id: 'stg.f12', turns: [beat('{a} gets it wrong and has to go back to the start of that part.'), by('a', "This is the worst. This is actually the worst."), by('b', "You've got this. You were so close.")] },
    { id: 'stg.f13', turns: [by('a', "Why is this so hard?"), by('b', "Because it's supposed to be. Everybody's struggling."), by('a', "That doesn't help me right now.")] },
    { id: 'stg.f14', turns: [by('b', "Okay, what did you do different that time?"), by('a', "Nothing! I did it the same!"), by('b', "Then do it different!")] },
    { id: 'stg.f15', turns: [by('a', "I'm going to cry. I'm actually going to cry."), by('b', "You can cry after. Right now, try it again."), by('a', "Okay. Crying after.")] },
    { id: 'stg.f16', turns: [beat("{b} turns away so {a} doesn't see {b.posAdj} face."), by('a', "I saw that."), by('b', "Saw what? Nothing. You're doing great. Go again.")] },
    { id: 'stg.f17', turns: [by('a', "Okay. Deep breath. Again."), by('b', "Deep breath. You've got it."), beat('{a} breathes out slowly and goes back to try it again.')] },
    { id: 'stg.f18', turns: [by('b', "It's okay! That happens to everybody!"), by('a', "Has it happened to everybody three times?"), by('b', "...Just go again.")] },
  ],
};
