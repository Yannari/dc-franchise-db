// The couples of the race (the user, 2026-10-19: "couples on the race"). Measured that day: about fourteen lines
// in the whole library were written for a team who are together (dating, married, on and off) and seven for exes,
// across every kind of moment. Here: the proposal on the mat (chill.js proposalCheck: a is the one asking, b the one
// asked), and the moments a couple has that two friends don't, gated on what they are to each other.
const by = (b, say) => ({ by: b, say });
const beat = s => ({ beat: s });
const ROM = { relFam: 'romantic' };
const EX = { relFam: 'exes' };
const iv = (id, when, ...lines) => ({ id, when, turns: lines.map(([b, conf]) => ({ by: b, conf })) });

export default {
  retire: [],
  pools: {
    'proposal.yes': [
      { id: 'cp.py1', turns: [
        beat('Still on the mat, {a} drops to one knee. {b} stops mid-sentence.'),
        by('b', "What are you doing? Get up, people are watching."),
        by('a', "That's sort of the point. I've been carrying this ring around the world in a sock."),
        by('b', "A sock?"),
        by('a', "A clean sock. Mostly. Will you marry me?"),
        by('b', "Yes! Yes, obviously, get up, you're kneeling on the mat!"),
        beat('Don, for once in his life, says nothing at all.'),
      ] },
      { id: 'cp.py2', turns: [
        by('a', "Can I say something, before we get swept off for interviews?"),
        by('b', "Now? I can barely breathe."),
        by('a', "I kept thinking, on every plane and every bus, I don't want to do anything without you. Ever. So."),
        beat('{a} takes out a small box, hands shaking.'),
        by('b', "Oh my goodness."),
        by('b', "Yes. Yes. Of course, yes."),
      ] },
      { id: 'cp.py3', turns: [
        beat('{a} gets down on one knee in front of every camera on the mat.'),
        by('b', "Is your knee okay? Did you fall?"),
        by('a', "I'm proposing."),
        by('b', "You're... oh. Oh!"),
        by('a', "I'm going to need an answer before my knee gives out."),
        by('b', "Yes! Get up! Yes!"),
      ] },
      { id: 'cp.py4', turns: [
        by('a', "We've done every challenge on this race together. I want to do the rest of it together too. The life part."),
        by('b', "Are you... is this..."),
        beat('{a} nods, and holds out a ring that is very clearly from a gift shop.'),
        by('a', "It's temporary. The ring. Not the question."),
        by('b', "I love it. I love you. Yes."),
        beat('They hug so hard they both fall over, which the crew applauds.'),
      ] },
    ],
    'proposal.not-yet': [
      { id: 'cp.pn1', turns: [
        beat('{a} kneels on the mat and holds out a ring. {b} goes very still.'),
        by('b', "Oh. Oh, wow. Can you... can you get up?"),
        by('a', "Is that a no?"),
        by('b', "It's a not on a mat, in front of everybody, in the middle of a race. Ask me when we're home."),
        by('a', "Right. Okay. Home. Yeah."),
        beat('{a} puts the ring away, and doesn\'t say much for the rest of the night.'),
      ] },
      { id: 'cp.pn2', turns: [
        by('a', "Marry me."),
        by('b', "What?"),
        by('a', "Right now. When we get back. Marry me."),
        by('b', "I love you. I do. But I'm not answering that with Don watching."),
        by('a', "That's fair. That's... fair."),
        beat('Neither of them knows where to look.'),
      ] },
      { id: 'cp.pn3', turns: [
        beat('{a} pulls out a ring halfway through hugging {b}.'),
        by('b', "No, don't, not here."),
        by('a', "I thought you'd want..."),
        by('b', "I want it to be just us. Not this. Please put it away."),
        beat('{a} puts it away. {b} takes {a.posAdj} hand anyway.'),
        by('b', "Ask me again. Somewhere quiet. I promise I'll say something better."),
      ] },
      { id: 'cp.pn4', turns: [
        by('a', "I was going to wait until the end, but I can't. Will you marry me?"),
        by('b', "We've only been together a few months."),
        by('a', "Is that a no?"),
        by('b', "It's a 'can we finish the race first'. Please."),
        by('a', "Yeah. Of course. Sorry. Bad timing."),
        beat('{a} laughs, a bit too loudly, and the moment passes.'),
      ] },
    ],

    // a couple, in the confessional after the moment the proposal was
    'int-feeling.glad': [
      iv('cp.iv1', { cause: 'proposal' },
        ['b', "I said yes. On a mat. In front of Don. I'll be telling that story for the rest of my life."],
        ['a', "Our grandkids are going to love it."],
        ['b', "Our grandkids are going to think we made it up."]),
      iv('cp.iv2', { cause: 'proposal' },
        ['a', "My hands were shaking so much I nearly dropped the ring in the dirt."],
        ['b', "You did drop it."],
        ['a', "I caught it. That counts."]),
    ],
    'int-feeling.hurt': [
      iv('cp.iv3', { cause: 'proposal' },
        ['a', "So that didn't go how I wanted."],
        ['b', "I didn't say no."],
        ['a', "You didn't say yes, either. On camera. Which is a lot."]),
      iv('cp.iv4', { cause: 'proposal' },
        ['b', "I love {a}. I just wanted it to be ours, not the show's."],
        ['a', "I get it. I do. It just stings a bit right now."],
        ['b', "I know. Ask me again when we're home. I mean it."]),
    ],
    'int-feeling.angry': [
      iv('cp.iv5', { cause: 'proposal' },
        ['a', "I asked the biggest question of my life, and got told to put it away."],
        ['b', "Somewhere quiet. I said somewhere quiet."],
        ['a', "Nowhere's quiet on this race."]),
      iv('cp.iv6', { cause: 'proposal' },
        ['b', "You don't propose in front of a camera crew without asking me how I feel about camera crews."],
        ['a', "How do you feel about camera crews?"],
        ['b', "Not like that."]),
    ],

    // a couple fighting, and the couple making up
    'snap.snap': [
      { id: 'cp.sn1', when: ROM, turns: [
        by('a', "You always do this. You always decide for both of us."),
        by('b', "Because if I don't, we'd still be standing at the first Don Box."),
        by('a', "That's not fair."),
        by('b', "No, what's not fair is me doing all the thinking and you doing all the sulking."),
        beat("{a} walks a few steps ahead, and doesn't wait."),
        by('b', "Great. Perfect. Very mature."),
      ] },
      { id: 'cp.sn2', when: ROM, turns: [
        by('b', "Can you just hold my hand for one second?"),
        by('a', "We're running. I need my hands."),
        by('b', "You never need them when it's me."),
        by('a', "Where is this coming from?"),
        by('b', "Everywhere. All week. It's coming from everywhere."),
        beat('They run on, a little apart, and both of them notice it.'),
      ] },
      { id: 'cp.sn3', when: EX, turns: [
        by('a', "This is exactly why we broke up."),
        by('b', "Here we go."),
        by('a', "You never listen. Not once. Not then and not now."),
        by('b', "I listened. I just didn't agree. That's different."),
        by('a', "It isn't, actually."),
        beat("Neither of them says anything else until the next Don Box."),
      ] },
    ],
    'makeup.apology': [
      { id: 'cp.mk1', when: ROM, turns: [
        by('a', "I'm sorry. I was horrible back there."),
        by('b', "You were a bit horrible."),
        by('a', "I was tired, and scared, and I took it out on the one person who's on my side."),
        by('b', "I'm still on your side. Even when you're horrible."),
        beat('{b} bumps {a.posAdj} shoulder with {b.posAdj} own, and they walk on together.'),
        by('a', "Especially when I'm horrible?"),
      ] },
      { id: 'cp.mk2', when: EX, turns: [
        by('b', "Look. We're not together. But we're a team, and I don't want to fight all the way round the world."),
        by('a', "Me neither."),
        by('b', "So, truce?"),
        by('a', "Truce. Until the finish line."),
        by('b', "And then?"),
        by('a', "And then we'll see."),
      ] },
    ],
    'bond-moment.gratitude': [
      { id: 'cp.bm1', when: ROM, turns: [
        beat('In the queue, {b} rests {b.posAdj} head on {a.posAdj} shoulder, just for a second.'),
        by('a', "Are you asleep?"),
        by('b', "No. I'm just glad it's you I'm doing this with."),
        by('a', "Even after the bus?"),
        by('b', "Especially after the bus."),
        beat('{a} stays very still, so as not to move {b}.'),
      ] },
    ],
    'bond-moment.memory': [
      { id: 'cp.bm2', when: EX, turns: [
        by('a', "Remember when we used to do this? Plan trips, I mean."),
        by('b', "We never actually went on any of them."),
        by('a', "We're going on one now."),
        by('b', "With cameras. And no money. And a lot of shouting."),
        by('a', "It's still the best trip we've had."),
        by('b', "Don't make it weird."),
      ] },
    ],
  },
};
