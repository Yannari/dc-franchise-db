// The checkpoint at every challenge (scenes/checkpoint.js): a team takes its clue and reads it; the envelopes left say
// where it stands; a misread; two teams at the box at once. Never where the clue came from (the Don Box, or the local
// who hands it out: the viewer shows which), never what the challenge is (the tip card on screen says it), no head
// counts. clue-montage: the rest of the field taking theirs, one beat a team, in a quick shot together.
export default {
  'clue.read': [
    { id: 'cp.r1', turns: [{ beat: '{a} tears the envelope open and reads it out loud.' }, { by: 'b', say: "Okay. That doesn't sound too bad." }, { by: 'a', say: "It sounds bad. Come on." }] },
    { id: 'cp.r2', turns: [{ by: 'a', say: "Right, listen. We have to do all of this before we get the next one." }, { by: 'b', say: "All of it?" }, { by: 'a', say: "All of it. Let's go." }] },
    { id: 'cp.r3', turns: [{ beat: '{b} reads the tip over {a.posAdj} shoulder.' }, { by: 'b', say: "Who writes these things?" }, { by: 'a', say: "Don. I hope somebody helps him." }] },
    { id: 'cp.r4', turns: [{ by: 'a', say: "Here's ours. I'll read, you start walking." }, { by: 'b', say: "Walking where?" }, { by: 'a', say: "I'll tell you when I get to that part." }] },
    { id: 'cp.r5', turns: [{ by: 'b', say: "What does it say?" }, { by: 'a', say: "It says we're about to have a very long afternoon." }, { by: 'b', say: "Good thing I didn't have plans." }] },
    { id: 'cp.r6', turns: [{ beat: '{a} reads the tip twice, very slowly, then folds it into {a.posAdj} pocket.' }, { by: 'a', say: "Got it. I think I've got it." }, { by: 'b', say: "You think?" }] },
    { id: 'cp.r7', turns: [{ by: 'a', say: "There's a little picture of Don at the bottom, giving a thumbs up." }, { by: 'b', say: "That's never a good sign." }, { by: 'a', say: "He's winking, too." }] },
    { id: 'cp.r8', turns: [{ by: 'b', say: "Read it properly this time. Every word." }, { by: 'a', say: "Every word. Fine." }, { beat: '{a} reads every word out loud, and it takes a while.' }] },
    { id: 'cp.r9', turns: [{ by: 'a', say: "This is the one I was dreading." }, { by: 'b', say: "You haven't even finished reading it." }, { by: 'a', say: "I can tell from the first line." }] },
    { id: 'cp.r10', turns: [{ beat: '{a} and {b} read the tip together, heads almost touching.' }, { by: 'b', say: "Did you get all that?" }, { by: 'a', say: "Most of it. Enough of it." }] },
    { id: 'cp.r11', turns: [{ by: 'b', say: "Is it the kind where we have to be brave?" }, { by: 'a', say: "It's the kind where we have to be quick, and a little bit brave." }, { by: 'b', say: "I can do quick. I'll work on the brave part." }] },
    { id: 'cp.r12', turns: [{ beat: '{a} reads the tip, then hands it straight to {b} without a word.' }, { by: 'b', say: "That bad?" }, { by: 'a', say: "Just read it." }] },
  ],
  'clue.misread': [
    { id: 'cp.m1', turns: [{ by: 'a', say: "It says the next part is at the other end." }, { beat: '{a} and {b} jog the wrong way for a good ten minutes.' }, { by: 'b', say: "It said this end. I've just read it again." }] },
    { id: 'cp.m2', turns: [{ beat: '{a} reads the tip, nods, and sets off in completely the wrong direction.' }, { by: 'b', say: "Where are we going?" }, { by: 'a', say: "Where it said!" }, { by: 'b', say: "It did not say that." }] },
    { id: 'cp.m3', turns: [{ by: 'b', say: "Did you read the whole thing?" }, { by: 'a', say: "I read enough of it." }, { by: 'b', say: "You read the first line, and the second line changes everything." }] },
    { id: 'cp.m4', turns: [{ beat: '{a} reads the tip out loud with total confidence, and gets one important word wrong.' }, { by: 'b', say: "Let me see that." }, { by: 'a', say: "I know what it says." }, { by: 'b', say: "You knew what you thought it said." }] },
    { id: 'cp.m5', turns: [{ by: 'a', say: "We do it together. Both of us. Says so right here." }, { beat: 'Ten minutes later, somebody points out the part where it says only one of them can.' }, { by: 'b', say: "Right here, you said." }] },
    { id: 'cp.m6', turns: [{ beat: "{b} hands the tip to {a} upside down, and {a} reads it that way for longer than you'd think." }, { by: 'a', say: "Why didn't you say anything?" }, { by: 'b', say: "I thought you were doing it on purpose." }] },
  ],
  'clue.count-ahead': [
    { id: 'cp.a1', turns: [{ beat: '{a} glances into the box. It is still almost full.' }, { by: 'a', say: "We're near the front. Look how many are left." }, { by: 'b', say: "Then let's keep it that way." }] },
    { id: 'cp.a2', turns: [{ by: 'b', say: "How many envelopes are left?" }, { by: 'a', say: "Loads. We're ahead of nearly everybody." }, { by: 'b', say: "Nearly isn't everybody." }] },
    { id: 'cp.a3', turns: [{ by: 'a', say: "The box is still stuffed with them." }, { by: 'b', say: "So hardly anyone's been here yet. Good. Move." }, { by: 'a', say: "I'm moving! Look at me moving." }] },
    { id: 'cp.a4', turns: [{ beat: '{b} counts the envelopes under {b.posAdj} breath and starts to smile.' }, { by: 'b', say: "We're doing well. Don't tell anyone I said that." }, { by: 'a', say: "Too late. I'm telling everyone." }] },
    { id: 'cp.a5', turns: [{ by: 'a', say: "Look at all of those. We beat almost everyone here." }, { by: 'b', say: "We beat them to a box. Let's beat them to the end of it." }, { by: 'a', say: "That's the plan." }] },
  ],
  'clue.count-behind': [
    { id: 'cp.b1', turns: [{ beat: '{a} reaches into the box and finds almost nothing left.' }, { by: 'a', say: "There's hardly any left." }, { by: 'b', say: "So everyone's ahead of us." }, { by: 'a', say: "Not everyone. Probably." }] },
    { id: 'cp.b2', turns: [{ by: 'b', say: "How many are left in there?" }, { by: 'a', say: "Don't ask." }, { by: 'b', say: "I'm asking." }, { by: 'a', say: "Not many. Not many at all." }] },
    { id: 'cp.b3', turns: [{ beat: '{b} stares into the nearly empty box.' }, { by: 'b', say: "We're near the back, aren't we?" }, { by: 'a', say: "We're near the back. So we run." }] },
    { id: 'cp.b4', turns: [{ by: 'a', say: "Look at that. Everybody's been here before us." }, { by: 'b', say: "Then they'd better hope we don't catch up." }, { by: 'a', say: "Somebody always slows down. Let's make it them." }] },
    { id: 'cp.b5', turns: [{ beat: '{a} takes one of the last envelopes, and neither of them says a word about how few are left.' }, { by: 'b', say: "We're fine." }, { by: 'a', say: "We're fine." }] },
  ],
  'box-grab.snatched': [
    { id: 'cp.g1', turns: [{ beat: '{a} and {c} reach the box at the same moment, and {a} gets there first by a finger.' }, { by: 'c', say: "I was there first!" }, { by: 'a', say: "You were there second, and that's a different thing." }] },
    { id: 'cp.g2', turns: [{ beat: '{a} slides in front of {c} and {d} and grabs a tip before either of them can reach it.' }, { by: 'c', say: "Seriously?" }, { by: 'a', say: "It's a race!" }] },
    { id: 'cp.g3', turns: [{ by: 'c', say: "Excuse me, we were here." }, { beat: '{a} takes a tip anyway and keeps walking.' }, { by: 'a', say: "And now you're still here. Good luck!" }] },
    { id: 'cp.g4', turns: [{ beat: '{a} reaches over {c} to grab an envelope.' }, { by: 'd', say: "Manners!" }, { by: 'b', say: "We'll find some at the finish line." }] },
  ],
  'box-grab.after-you': [
    { id: 'cp.y1', turns: [{ beat: '{a} and {c} reach for the box at the same moment.' }, { by: 'a', say: "Go on, you first." }, { by: 'c', say: "Really? Thanks." }, { by: 'b', say: "Why are we being nice?" }, { by: 'a', say: "Because I'd like somebody to be nice to me later." }] },
    { id: 'cp.y2', turns: [{ by: 'c', say: "Oh, sorry, were you first?" }, { by: 'a', say: "Doesn't matter. Take one, there's plenty." }, { beat: '{c} takes one, then hands the next one to {a}.' }] },
    { id: 'cp.y3', turns: [{ by: 'a', say: "After you." }, { by: 'c', say: "No, after you." }, { by: 'b', say: "One of you take one before we all get a penalty for manners." }] },
    { id: 'cp.y4', turns: [{ beat: '{a} holds an envelope out to {c} before taking one.' }, { by: 'c', say: "That's nice of you." }, { by: 'a', say: "Remember it when you're ahead of us." }] },
  ],
  'box-grab.read-over-shoulder': [
    { id: 'cp.o1', turns: [{ beat: 'While {c} reads the tip out loud, {a} stands just behind and listens to every word.' }, { by: 'd', say: "Are you listening to us?" }, { by: 'a', say: "I'm standing near you. It's a free country." }] },
    { id: 'cp.o2', turns: [{ beat: '{a} pretends to tie a shoe right next to {c} and {d} while they read.' }, { by: 'b', say: "Did you get it?" }, { by: 'a', say: "Every word." }] },
    { id: 'cp.o3', turns: [{ by: 'c', say: "Do you mind? This is ours." }, { by: 'a', say: "Ours says exactly the same thing. I'm only checking." }, { by: 'd', say: "Then check your own." }] },
  ],
  'clue-montage.any': [
    { id: 'cm.1', turns: [{ beat: '{a} and {b} grab their tip and read it on the run.' }] },
    { id: 'cm.2', turns: [{ beat: '{a} rips the envelope open while {b} reads over {a.posAdj} shoulder.' }] },
    { id: 'cm.3', turns: [{ beat: '{a} and {b} take their tip, read it, and head straight for the challenge.' }] },
    { id: 'cm.4', turns: [{ beat: '{b} grabs the tip, and {a} reads it out as they go.' }] },
    { id: 'cm.5', turns: [{ beat: '{a} and {b} get their tip and stop for a moment to read it properly.' }] },
    { id: 'cm.6', turns: [{ beat: '{b} reads the tip out loud, and {a} is already moving before the end of it.' }] },
    { id: 'cm.7', turns: [{ beat: '{a} takes the tip, reads one line, and hands it to {b} to read the rest.' }] },
    { id: 'cm.8', turns: [{ beat: '{a} and {b} snatch up their tip and read it together.' }] },
    { id: 'cm.9', turns: [{ beat: '{b} gets to the tip first, and {a} reads it out loud behind {b.obj}.' }] },
    { id: 'cm.10', turns: [{ beat: '{a} and {b} take their tip and read it in silence, which is never a good sign.' }] },
  ],
};
