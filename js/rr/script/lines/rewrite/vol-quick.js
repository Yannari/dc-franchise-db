// More of the quick hits that air most (2 to 6 lines): the hug after getting through, reading the tip, and the yes.
// Written again 2026-11-03 the way people react on the real show (the user: "they dont talk like everyday real
// people"): relief, shouting, a hug, "let's go", and back to running. No punchline after it. A tip line never names
// a place the leg might not have (a market, a lighthouse, a bridge). A turn with an `id` speaks the team's own line
// when its identity has one.
const T = { at: 'task' };

export default {
  retire: [],
  pools: {
    'celebrate.hug': [
      { id: 'vq.h1', turns: [
        { by: 'a', id: 'win', say: "We did it. We actually did it." },
        { by: 'b', say: "Oh my God. Come here." },
        { beat: 'They hug, both of them laughing.' },
      ] },
      { id: 'vq.h2', turns: [
        { beat: '{a} grabs {b} and lifts {b.obj} off the ground.' },
        { by: 'b', say: "Put me down! We have to run!" },
        { by: 'a', say: "Two more seconds." },
      ] },
      { id: 'vq.h3', turns: [
        { by: 'b', say: "Yes! Yes! Come here!" },
        { beat: '{a} and {b} hug, quickly and hard.' },
        { by: 'a', say: "Okay, okay. Grab the tip. Let's go." },
      ] },
      { id: 'vq.h4', turns: [
        { by: 'a', say: "I'm so proud of you." },
        { by: 'b', say: "Me? You did half of it." },
        { by: 'a', say: "Then I'm proud of us. Come here." },
      ] },
      { id: 'vq.h5', turns: [
        { beat: '{a} and {b} jump up and down, hugging.' },
        { by: 'a', say: "That was so hard. That was so hard!" },
        { by: 'b', say: "But we did it! Come on, come on!" },
      ] },
      { id: 'vq.h6', turns: [
        { by: 'b', id: 'win', say: "Yes! Yes! That's how it's done!" },
        { by: 'a', say: "Shh, keep it down, they'll hear us." },
        { by: 'b', say: "I don't care! Let them hear!" },
      ] },
      { id: 'vq.h7', turns: [
        { beat: '{a} and {b} hug so hard they nearly fall over.' },
        { by: 'a', say: "Oh my God. I can't believe we got it." },
        { by: 'b', say: "Believe it later. Run now." },
      ] },
      { id: 'vq.h8', turns: [
        { by: 'a', say: "Come here. Seriously, come here." },
        { beat: '{a} pulls {b} into a hug.' },
        { by: 'b', say: "Thank you for not giving up on me back there." },
        { by: 'a', say: "Never. Come on." },
      ] },
      { id: 'vq.h9', when: T, turns: [
        { by: 'b', say: "We got through it. I honestly didn't think we'd get through it." },
        { by: 'a', say: "Me neither. I was so scared." },
        { by: 'b', say: "You didn't look scared." },
        { by: 'a', say: "I was terrified. Let's go." },
      ] },
      { id: 'vq.h10', when: T, turns: [
        { beat: '{a} and {b} wait for the tip with their arms around each other, still catching their breath.' },
        { by: 'a', say: "Don't let go. My legs are shaking." },
        { by: 'b', say: "I've got you." },
      ] },
      { id: 'vq.h11', when: T, turns: [
        { by: 'a', say: "Did you see me? Did you see what I did?" },
        { by: 'b', say: "I saw! You were amazing!" },
        { by: 'a', say: "I was so scared!" },
        { by: 'b', say: "You didn't look it. Come here." },
      ] },
      { id: 'vq.h12', when: T, turns: [
        { by: 'b', say: "We look terrible right now." },
        { by: 'a', say: "Who cares? We got it!" },
        { beat: 'They high-five, then hug.' },
      ] },
      { id: 'vq.h13', when: T, turns: [
        { beat: 'The tip is handed over, and {a} holds it up in the air.' },
        { by: 'a', say: "Yes! Got it!" },
        { by: 'b', say: "Read it, read it! Don't wave it, read it!" },
      ] },
      { id: 'vq.h14', when: T, turns: [
        { by: 'a', say: "That was the hardest thing I've ever done." },
        { by: 'b', say: "You say that every time." },
        { by: 'a', say: "And every time I mean it." },
      ] },
      { id: 'vq.h15', when: T, turns: [
        { by: 'b', id: 'win', say: "That was ours. That one was all ours." },
        { by: 'a', say: "We actually did it right the first time!" },
        { by: 'b', say: "Don't jinx it. Go!" },
      ] },
      { id: 'vq.h16', when: { relFam: 'family' }, turns: [
        { by: 'a', say: "Wait till we tell everyone at home." },
        { by: 'b', say: "They're going to lose their minds." },
        { by: 'a', say: "Come here. I love you." },
        { by: 'b', say: "Love you too. Now let's go." },
      ] },
      { id: 'vq.h17', when: { relFam: 'family' }, turns: [
        { beat: '{a} pulls {b} in and kisses the top of {b.posAdj} head.' },
        { by: 'b', say: "Okay, okay. People are watching." },
        { by: 'a', say: "Let them watch. I'm proud of you." },
      ] },
      { id: 'vq.h18', when: { relFam: 'romantic' }, turns: [
        { beat: '{a} and {b} kiss, quickly.' },
        { by: 'a', say: "I love you. Okay. Racing." },
        { by: 'b', say: "Racing. Which way?" },
      ] },
      { id: 'vq.h19', when: { relFam: 'friends' }, turns: [
        { by: 'a', say: "Dude! Dude! We did it!" },
        { by: 'b', say: "Bring it in, bring it in!" },
        { beat: 'They hug and slap each other on the back.' },
      ] },
      { id: 'vq.h20', when: { relFam: 'exes' }, turns: [
        { beat: '{a} and {b} go in for a hug, stop halfway, and settle for a high five.' },
        { by: 'b', say: "Good job." },
        { by: 'a', say: "Yeah. You too. Good job." },
      ] },
      { id: 'vq.h21', when: { relFam: 'rivals' }, turns: [
        { by: 'a', say: "Okay, I'm not hugging you." },
        { beat: 'They hug anyway, very briefly.' },
        { by: 'b', say: "That was a nice hug, though." },
        { by: 'a', say: "Don't." },
      ] },
      { id: 'vq.h22', turns: [
        { by: 'a', say: "Oh my God, that was amazing." },
        { by: 'b', say: "You were amazing!" },
        { by: 'a', say: "We were amazing. Let's go!" },
      ] },
    ],
    'tip-read.clear': [
      { id: 'vq.tc1', turns: [
        { by: 'a', say: "Okay. It says where to go and what to look for. That's actually really clear." },
        { by: 'b', say: "Clear is good." },
        { by: 'a', say: "Then let's go before it stops being clear." },
      ] },
      { id: 'vq.tc2', turns: [
        { beat: '{b} reads the tip, folds it and puts it away.' },
        { by: 'b', say: "Got it. Follow me." },
        { by: 'a', say: "Wait, tell me where!" },
        { by: 'b', say: "I'll tell you on the way!" },
      ] },
      { id: 'vq.tc3', turns: [
        { by: 'a', say: "Okay, I know exactly where this is." },
        { by: 'b', say: "Are you sure?" },
        { by: 'a', say: "I'm sure. Come on." },
      ] },
      { id: 'vq.tc4', turns: [
        { by: 'b', say: "The next stop's on the other side of town." },
        { by: 'a', say: "Then we need a ride." },
        { by: 'b', say: "Okay. Let's find one. Come on." },
      ] },
      { id: 'vq.tc5', turns: [
        { by: 'a', say: "Okay. Read it to me one more time so I know I've got it." },
        { beat: '{b} reads it out again.' },
        { by: 'a', say: "Got it. Go." },
      ] },
      { id: 'vq.tc6', turns: [
        { beat: '{a} reads it out loud, slowly.' },
        { by: 'b', say: "Faster! We're in a race!" },
        { by: 'a', say: "Fine. Short version: that way. Run." },
      ] },
      { id: 'vq.tc7', turns: [
        { by: 'a', say: "That's it. That's the whole tip." },
        { by: 'b', say: "It's so short." },
        { by: 'a', say: "Good. Less to get wrong." },
      ] },
      { id: 'vq.tc8', turns: [
        { by: 'b', say: "There's a little map on the back." },
        { by: 'a', say: "Oh, thank God. Okay, which way are we facing?" },
        { by: 'b', say: "That way. Come on." },
      ] },
      { id: 'vq.tc9', turns: [
        { by: 'a', say: "Okay, easy. We know where we're going." },
        { by: 'b', say: "Don't say easy. Every time you say easy, it isn't." },
        { by: 'a', say: "Fine. It's hard. Let's go." },
      ] },
      { id: 'vq.tc10', turns: [
        { by: 'b', say: "Okay, so it's a clue inside a clue." },
        { by: 'a', say: "Can you work it out?" },
        { by: 'b', say: "Give me a second. Okay. Yes. I've got it. This way." },
      ] },
    ],
    'tip-read.misread': [
      { id: 'vq.tm1', turns: [
        { by: 'a', say: "This way. Let's go." },
        { beat: 'They run the wrong way for a good few minutes before {b} reads the tip again.' },
        { by: 'b', say: "Stop! Stop. It says the other way." },
        { by: 'a', say: "Oh, no. Sorry. Sorry!" },
      ] },
      { id: 'vq.tm2', turns: [
        { by: 'b', say: "It says find somebody in a red hat." },
        { by: 'a', say: "Wait. Let me see." },
        { beat: '{a} reads it.' },
        { by: 'a', say: "It says red coat, not red hat." },
        { by: 'b', say: "Okay. Coat. Sorry. Coat." },
      ] },
      { id: 'vq.tm3', turns: [
        { by: 'a', say: "Left, then straight on until we see it. Easy." },
        { beat: 'Twenty minutes later, they are back where they read the tip.' },
        { by: 'b', say: "We've been here. We've already been here." },
        { by: 'a', say: "I know. I think I read it wrong." },
      ] },
      { id: 'vq.tm4', when: { eats: true }, turns: [
        { by: 'b', say: "We both have to eat all of it?" },
        { by: 'a', say: "No, look. It says only one of us." },
        { by: 'b', say: "Oh, thank God. Then that's you." },
        { by: 'a', say: "Why is it me?" },
      ] },
      { id: 'vq.tm5', turns: [
        { beat: '{a} has been staring at the tip for a full minute.' },
        { by: 'b', say: "Well? Where are we going?" },
        { by: 'a', say: "Hang on. I've been reading the wrong part. That's the rules at the bottom." },
        { by: 'b', say: "Oh my God. Give it here." },
      ] },
      { id: 'vq.tm6', when: { at: 'road' }, turns: [
        { by: 'a', say: "It's this way. I'm pretty sure it's this way." },
        { by: 'b', say: "Pretty sure or sure?" },
        { by: 'a', say: "Pretty sure." },
        { by: 'b', say: "Read it again." },
      ] },
    ],
    'tip-read.puzzled': [
      { id: 'vq.tp1', turns: [
        { by: 'a', say: "What does that even mean?" },
        { by: 'b', say: "I have no idea. Read it again." },
        { by: 'a', say: "I've read it three times. It doesn't make sense." },
        { by: 'b', say: "Okay, let's ask somebody." },
      ] },
      { id: 'vq.tp2', turns: [
        { by: 'b', say: "There's a word here I don't know." },
        { by: 'a', say: "Which word?" },
        { by: 'b', say: "This one. Do you know it?" },
        { by: 'a', say: "...No. Let's ask somebody." },
      ] },
      { id: 'vq.tp3', turns: [
        { beat: '{a} and {b} stand there, both reading the tip over and over.' },
        { by: 'a', say: "Should we ask somebody?" },
        { by: 'b', say: "Ask them what? We don't even know what we're looking for." },
        { by: 'a', say: "Then we'll ask them that." },
      ] },
      { id: 'vq.tp4', turns: [
        { by: 'a', say: "It's just a picture. There are no words on it." },
        { by: 'b', say: "Let me see. Okay. So we have to find whatever this is." },
        { by: 'a', say: "And what is it?" },
        { by: 'b', say: "I don't know yet." },
      ] },
      { id: 'vq.tp5', turns: [
        { by: 'b', say: "Read it again." },
        { by: 'a', say: "I've read it four times." },
        { by: 'b', say: "Then read it a fifth time, slower. We're missing something." },
      ] },
    ],
    'judge-yes.approved': [
      { id: 'vq.ja1', turns: [
        { by: 'local', say: "Yes. Good. Here." },
        { by: 'a', say: "Yes? Really? Oh my God, thank you!" },
        { by: 'b', say: "Take it, take it, let's go!" },
      ] },
      { id: 'vq.ja2', turns: [
        { beat: '{local} looks at it, nods once, and hands over the tip.' },
        { by: 'b', say: "Is that a yes? That's a yes!" },
        { by: 'a', say: "That's a yes. Go, go, go." },
      ] },
      { id: 'vq.ja3', turns: [
        { by: 'local', say: "This is very good. The best today." },
        { by: 'a', say: "Did you hear that? The best!" },
        { by: 'b', say: "I heard. Come on, before they change their mind." },
      ] },
      { id: 'vq.ja4', turns: [
        { beat: '{local} studies it for a long time, then smiles.' },
        { by: 'local', say: "Correct." },
        { by: 'a', say: "Yes! Thank you, thank you so much!" },
      ] },
      { id: 'vq.ja5', turns: [
        { by: 'a', say: "Please. Please be right." },
        { by: 'local', say: "It is right." },
        { by: 'a', say: "Oh, thank God. Thank you!" },
      ] },
      { id: 'vq.ja6', turns: [
        { by: 'b', id: 'good', say: "Told you. I told you we'd be good at this." },
        { by: 'a', say: "You said we'd be terrible at this." },
        { by: 'b', say: "Well, I was wrong. Let's go." },
      ] },
      { id: 'vq.ja7', turns: [
        { by: 'local', say: "Okay. You may go." },
        { beat: '{a} and {b} grab the tip and run.' },
        { by: 'a', say: "Thank you!" },
      ] },
      { id: 'vq.ja8', turns: [
        { by: 'a', say: "First try?" },
        { by: 'local', say: "First try." },
        { by: 'b', say: "That never happens to us. Thank you so much!" },
      ] },
      { id: 'vq.ja9', turns: [
        { beat: '{local} gives a small thumbs-up, and {b} punches the air.' },
        { by: 'a', say: "Okay, calm down. Grab the tip." },
        { by: 'b', say: "I'm calm! I'm calm! Let's go!" },
      ] },
    ],
    'judge-yes.grudging': [
      { id: 'vq.jg1', turns: [
        { by: 'local', say: "It is... okay." },
        { by: 'a', say: "Okay means yes? That's a yes?" },
        { by: 'local', say: "Yes. Go." },
      ] },
      { id: 'vq.jg2', turns: [
        { beat: '{local} sighs and hands over the tip.' },
        { by: 'b', say: "Was that a good sigh or a bad sigh?" },
        { by: 'a', say: "Who cares? We've got the tip. Run." },
      ] },
      { id: 'vq.jg3', turns: [
        { by: 'local', say: "This is not very good. But it is correct." },
        { by: 'a', say: "We'll take it. Thank you!" },
        { by: 'b', say: "Not very good, but correct. Fine by me." },
      ] },
      { id: 'vq.jg4', turns: [
        { by: 'local', say: "Hmm. Fine. Take it." },
        { by: 'b', say: "Just fine? We worked really hard on that." },
        { by: 'a', say: "Stop arguing and take it!" },
      ] },
      { id: 'vq.jg5', turns: [
        { beat: '{local} looks at it for a long time, frowns, and hands over the tip anyway.' },
        { by: 'a', say: "Why the frown? Was something wrong with it?" },
        { by: 'b', say: "Doesn't matter. We've got the tip." },
      ] },
    ],
  },
};
