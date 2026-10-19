// More of the quick hits that air most (2 to 6 lines): the hug after getting through, reading the tip, and the yes.
// Measured 2026-10-19: celebrate.hug aired 32 times a season from 16 lines (most gated), tip-read 23 from 6, judge-yes
// 15 from 4. Short and about the moment; a turn with an `id` speaks the team's own line when its identity has one.
import { V } from '../places/_kit.js';

const T = { at: 'task' };

export default {
  retire: [],
  pools: {
    'celebrate.hug': [
      { id: 'vq.h1', turns: [
        { by: 'a', id: 'win', say: "We did it. We actually did it." },
        { by: 'b', say: "Don't cry. If you cry, I'll cry." },
        { beat: 'They both cry a little.' },
      ] },
      { id: 'vq.h2', turns: [
        { beat: '{a} grabs {b} and lifts {b.obj} clean off the ground.' },
        { by: 'b', ...V("Put me down! We have to run!", "Down. We have to run.", "Down. Run.", "PUT me DOWN! We have to RUN!", "Put me down, we have to run!", "Unhand me! There's racing to be done!") },
        { by: 'a', say: "Two more seconds." },
      ] },
      { id: 'vq.h3', turns: [
        { by: 'b', say: "High five?" },
        { by: 'a', say: "High five is for strangers. Get in here." },
        { beat: 'It turns into a hug that lasts long enough for another team to overtake them.' },
      ] },
      { id: 'vq.h4', turns: [
        { by: 'a', say: "I'm so proud of you." },
        { by: 'b', ...V("You're proud of me? You did half of it.", "You did half of it.", "You did half.", "You're proud of ME? YOU did HALF of it!", "You're proud of me? You did half of it.", "Proud of me? You were the other half of me.") },
        { by: 'a', say: "Then I'm proud of us. Hug." },
      ] },
      { id: 'vq.h5', turns: [
        { beat: '{a} and {b} do their secret handshake. It has eleven steps. They get to step six before they mess it up.' },
        { by: 'a', say: "We'll finish it at the mat." },
        { by: 'b', say: "Step six is always where it goes wrong." },
      ] },
      { id: 'vq.h6', turns: [
        { by: 'b', id: 'win', say: "Yes! Yes! That's how it's done!" },
        { by: 'a', say: "Keep your voice down, they'll hear us." },
        { by: 'b', say: "I want them to hear us." },
      ] },
      { id: 'vq.h7', turns: [
        { beat: '{a} and {b} hug so hard they both fall over.' },
        { by: 'a', say: "Ow. Worth it." },
        { by: 'b', say: "Worth it. Help me up." },
      ] },
      { id: 'vq.h8', turns: [
        { by: 'a', say: "Hug me before I change my mind about you." },
        { by: 'b', say: "That's the nicest thing you've said all week." },
        { by: 'a', say: "Don't get used to it." },
      ] },
      { id: 'vq.h9', when: T, turns: [
        { by: 'b', say: "We got through it. I genuinely didn't think we'd get through it." },
        { by: 'a', say: "Me neither. I'd already started planning what to tell everyone back home." },
        { by: 'b', say: "Tell them I was brilliant." },
      ] },
      { id: 'vq.h10', when: T, turns: [
        { beat: '{a} and {b} wait for the tip with their arms around each other, swaying slightly.' },
        { by: 'a', say: "Don't let go. If you let go, I'll fall over." },
        { by: 'b', say: "I've got you. Mostly." },
      ] },
      { id: 'vq.h11', when: T, turns: [
        { by: 'a', ...V("Did you see me? Did you see what I did?", "Did you see what I did?", "Did you see?", "Did you SEE me? Did you see what I DID?", "Did you see me? Did you see what I did?", "Did you witness that? Was it as amazing as it felt?") },
        { by: 'b', say: "I saw. I saw everything. I'm going to tell everybody." },
        { by: 'a', say: "Tell them slowly. Tell them I was graceful." },
      ] },
      { id: 'vq.h12', when: T, turns: [
        { by: 'b', say: "I want a photo. Somebody take a photo of us." },
        { by: 'a', say: "We look terrible." },
        { by: 'b', say: "We look like winners. Terrible winners." },
      ] },
      { id: 'vq.h13', when: T, turns: [
        { beat: 'The tip is handed over, and {a} kisses it.' },
        { by: 'b', say: "You don't know where that's been." },
        { by: 'a', say: "It's been in my heart." },
      ] },
      { id: 'vq.h14', when: T, turns: [
        { by: 'a', say: "Remember this feeling. Bottle it. We're going to need it later." },
        { by: 'b', say: "Later's going to be bad, isn't it?" },
        { by: 'a', say: "Later's always bad." },
      ] },
      { id: 'vq.h15', when: T, turns: [
        { by: 'b', id: 'win', say: "That was ours. That one was all ours." },
        { by: 'a', say: "Group hug. Two-person group hug." },
        { by: 'b', say: "That's just a hug." },
      ] },
      { id: 'vq.h16', when: { relFam: 'family' }, turns: [
        { by: 'a', say: "Wait till we tell everyone at home." },
        { by: 'b', say: "They'll never believe it. Nobody in this family has ever finished anything." },
        { by: 'a', say: "Speak for yourself. I finished a jigsaw once." },
      ] },
      { id: 'vq.h17', when: { relFam: 'family' }, turns: [
        { beat: '{a} ruffles {b}\'s hair, which {b} hates, and {b} lets {a.obj} anyway, just this once.' },
        { by: 'b', say: "Just this once." },
        { by: 'a', say: "Noted." },
      ] },
      { id: 'vq.h18', when: { relFam: 'romantic' }, turns: [
        { beat: '{a} and {b} kiss, quickly, and then very much not quickly.' },
        { by: 'a', say: "Okay. Okay. Racing. We're racing." },
        { by: 'b', say: "Racing. Right. Which way is the racing?" },
      ] },
      { id: 'vq.h19', when: { relFam: 'friends' }, turns: [
        { by: 'a', say: "Best friends?" },
        { by: 'b', say: "Best friends. Forever. Or at least until the next one goes wrong." },
        { by: 'a', say: "Then let's not let the next one go wrong." },
      ] },
      { id: 'vq.h20', when: { relFam: 'exes' }, turns: [
        { beat: '{a} and {b} go in for a hug, remember they\'re exes, and settle for an awkward pat on the arm.' },
        { by: 'b', say: "Good job." },
        { by: 'a', say: "You too. Good job." },
      ] },
      { id: 'vq.h21', when: { relFam: 'rivals' }, turns: [
        { by: 'a', say: "Don't make it weird. I'm not hugging you." },
        { beat: 'They hug anyway, briefly, both pretending it isn\'t happening.' },
        { by: 'a', say: "That didn't happen." },
      ] },
      { id: 'vq.h22', turns: [
        { by: 'a', say: "On a scale of one to ten, how good was that?" },
        { by: 'b', say: "Eleven. Easily eleven." },
        { by: 'a', say: "Eleven. Write it down." },
      ] },
    ],
    'tip-read.clear': [
      { id: 'vq.tc1', turns: [
        { by: 'a', say: "Okay. Find the market, find the stall with the blue awning, get the tip." },
        { by: 'b', say: "That's very clear. I don't trust it." },
        { by: 'a', say: "Then don't trust it. Just run." },
      ] },
      { id: 'vq.tc2', turns: [
        { beat: '{b} reads the tip, folds it and puts it away in one move.' },
        { by: 'b', say: "Got it. Follow me." },
        { by: 'a', say: "You didn't even tell me where." },
      ] },
      { id: 'vq.tc3', turns: [
        { by: 'a', ...V("It says drive yourselves. We get to drive ourselves.", "We drive ourselves.", "We drive.", "It says DRIVE yourselves! We get to DRIVE!", "It says we get to drive ourselves this time.", "We drive! The wheel is ours!") },
        { by: 'b', say: "I'm driving." },
        { by: 'a', say: "You failed your test four times." },
      ] },
      { id: 'vq.tc4', turns: [
        { by: 'b', say: "Next stop's on the other side of town. Cab or bus?" },
        { by: 'a', say: "Cab. Always cab. I'm too tired to be poor." },
        { by: 'b', say: "We're not poor yet. Give it a day." },
      ] },
      { id: 'vq.tc5', turns: [
        { by: 'a', say: "It's a boat. The next part is a boat." },
        { by: 'b', say: "I get seasick on boats." },
        { by: 'a', say: "You get seasick in the bath." },
      ] },
      { id: 'vq.tc6', turns: [
        { beat: '{a} reads it out loud, slowly, the way a teacher would.' },
        { by: 'b', say: "Faster. Read it like we're in a race." },
        { by: 'a', say: "Fine. The short version is: that way. Run." },
      ] },
      { id: 'vq.tc7', turns: [
        { by: 'a', say: "Head to the old lighthouse. That's it. That's the whole tip." },
        { by: 'b', say: "Where's the old lighthouse?" },
        { by: 'a', say: "By the sea, I'm guessing." },
      ] },
      { id: 'vq.tc8', turns: [
        { by: 'b', say: "There's a map on the back. They actually gave us a map." },
        { by: 'a', say: "Don't get used to it." },
        { by: 'b', say: "I'm getting used to it. I love it here." },
      ] },
      { id: 'vq.tc9', turns: [
        { by: 'a', ...V("Walk. It says we have to walk there.", "We have to walk.", "Walk. On foot.", "WALK! It says we have to WALK there!", "It says we have to walk there.", "On foot, it says. Our feet must do it.") },
        { by: 'b', say: "My feet have already quit. They just haven't told the rest of me." },
        { by: 'a', say: "Tell them to wait till the mat." },
      ] },
      { id: 'vq.tc10', turns: [
        { by: 'b', say: "It's a pun. It's another pun." },
        { by: 'a', say: "Skip the pun. Where do we go?" },
        { by: 'b', say: "The pun is where we go. That's the clue." },
      ] },
    ],
    'tip-read.misread': [
      { id: 'vq.tm1', turns: [
        { by: 'a', say: "North gate. Let's go." },
        { beat: 'They run all the way to the north gate. The tip said south.' },
        { by: 'b', say: "Read me the tip again. Slowly." },
      ] },
      { id: 'vq.tm2', turns: [
        { by: 'b', say: "It says find the man in the red hat." },
        { by: 'a', say: "Every man here is in a red hat." },
        { by: 'b', say: "...It says red coat. Sorry. Coat." },
      ] },
      { id: 'vq.tm3', turns: [
        { by: 'a', ...V("Three blocks left, then right at the church.", "Three left, right at the church.", "Left three, right at church.", "Three blocks LEFT, then RIGHT at the CHURCH!", "Three blocks left, then right at the church.", "Three lefts and a church. Easy.") },
        { beat: 'Twenty minutes later, they are looking at a school.' },
        { by: 'b', say: "This is a school." },
        { by: 'a', say: "It's a very religious-looking school." },
      ] },
      { id: 'vq.tm4', turns: [
        { by: 'b', say: "We have to eat all of it? All of it?" },
        { by: 'a', say: "It says one of you. One of us eats it." },
        { by: 'b', say: "Oh. Then that's you." },
      ] },
      { id: 'vq.tm5', turns: [
        { beat: '{a} has been holding the tip upside down for a full minute.' },
        { by: 'b', say: "Why are we looking for a dog?" },
        { by: 'a', say: "...It says god. Upside down, it says dog." },
      ] },
      { id: 'vq.tm6', turns: [
        { by: 'a', say: "It says the bridge. The big one." },
        { by: 'b', say: "There are two big ones." },
        { by: 'a', say: "Then the bigger one. Probably." },
      ] },
    ],
    'tip-read.puzzled': [
      { id: 'vq.tp1', turns: [
        { by: 'a', say: "'Where the sun sleeps and the stones keep watch.' What does that mean?" },
        { by: 'b', say: "It means somebody at this show wanted to be a poet." },
        { by: 'a', say: "A bad poet. Come on, we'll ask somebody." },
      ] },
      { id: 'vq.tp2', turns: [
        { by: 'b', say: "There's a word here I don't know." },
        { by: 'a', say: "Which word?" },
        { by: 'b', say: "All of them, after the first three." },
      ] },
      { id: 'vq.tp3', turns: [
        { beat: '{a} and {b} turn the tip round and round, as if it might make more sense sideways.' },
        { by: 'a', say: "Ask somebody." },
        { by: 'b', say: "Ask them what? 'Excuse me, what does this riddle mean'?" },
        { by: 'a', say: "Yes. Exactly that." },
      ] },
      { id: 'vq.tp4', turns: [
        { by: 'a', ...V("It's just a picture. There are no words. It's a picture of a fish.", "No words. Just a fish.", "A fish. That's the tip.", "It's just a PICTURE! There are NO WORDS! It's a picture of a FISH!", "There aren't any words, it's just a picture of a fish.", "Our tip is a fish. A drawn fish.") },
        { by: 'b', say: "Then we find a fish." },
        { by: 'a', say: "We're by the sea. Everything here is a fish." },
      ] },
      { id: 'vq.tp5', turns: [
        { by: 'b', say: "Read it again." },
        { by: 'a', say: "I've read it four times." },
        { by: 'b', say: "Then read it a fifth time, and do a different voice. Maybe that'll help." },
      ] },
    ],
    'judge-yes.approved': [
      { id: 'vq.ja1', turns: [
        { by: 'local', say: "Yes. Good. Here." },
        { by: 'a', say: "Yes? Just yes? After all that, just yes?" },
        { by: 'b', say: "Take the yes. Take the yes and run." },
      ] },
      { id: 'vq.ja2', turns: [
        { beat: '{local} looks at it, nods once, and hands over the tip.' },
        { by: 'b', ...V("That's it? That's a yes?", "That's a yes?", "Yes?", "That's IT? That's a YES?", "That's it? That's a yes?", "A nod? Is a nod a yes here?") },
        { by: 'a', say: "That's a yes. Go, go, go." },
      ] },
      { id: 'vq.ja3', turns: [
        { by: 'local', say: "This is very good. The best today." },
        { by: 'a', say: "The best? Did you hear that? The best!" },
        { by: 'b', say: "They probably say that to everybody." },
      ] },
      { id: 'vq.ja4', turns: [
        { beat: '{local} studies it from three different angles, then smiles for the first time all day.' },
        { by: 'local', say: "Correct." },
        { by: 'a', say: "A smile. Did you see that? We got a smile." },
      ] },
      { id: 'vq.ja5', turns: [
        { by: 'a', say: "Please. Please be right." },
        { by: 'local', say: "It is right." },
        { by: 'a', say: "I could kiss you." },
        { by: 'local', say: "Please don't." },
      ] },
      { id: 'vq.ja6', turns: [
        { by: 'b', id: 'good', say: "Told you. I told you we'd be good at this." },
        { by: 'a', say: "You said we'd be terrible." },
        { by: 'b', say: "I was being modest." },
      ] },
      { id: 'vq.ja7', turns: [
        { by: 'local', say: "Okay. You may go." },
        { beat: '{a} and {b} are gone before {local} has finished the sentence.' },
        { by: 'local', say: "...Next team, please." },
      ] },
      { id: 'vq.ja8', turns: [
        { by: 'a', say: "First try?" },
        { by: 'local', say: "First try." },
        { by: 'b', say: "That's never happened to us. Not once. Not ever." },
      ] },
      { id: 'vq.ja9', turns: [
        { beat: '{local} gives a small thumbs-up, and {b} punches the air so hard {b.sub} nearly falls over.' },
        { by: 'a', say: "Calm down. Grab the tip." },
        { by: 'b', say: "I'm calm. I'm so calm. Look how calm I am." },
      ] },
    ],
    'judge-yes.grudging': [
      { id: 'vq.jg1', turns: [
        { by: 'local', say: "It is... acceptable." },
        { by: 'a', say: "Acceptable is a yes, right? Acceptable means yes?" },
        { by: 'local', say: "Go, before I change my mind." },
      ] },
      { id: 'vq.jg2', turns: [
        { beat: '{local} sighs, very deeply, and hands over the tip.' },
        { by: 'b', say: "Was that a happy sigh?" },
        { by: 'a', say: "Don't ask about the sigh. Run." },
      ] },
      { id: 'vq.jg3', turns: [
        { by: 'local', say: "This is the worst one I have seen today. But it is correct." },
        { by: 'a', ...V("We'll take it. Worst but correct. We'll take it.", "Worst but correct. We'll take it.", "We'll take it.", "We'll TAKE it! WORST but CORRECT!", "Worst but correct? We'll take that.", "Worst but correct. Put it on our gravestone.") },
        { by: 'b', say: "Worst but correct. That's going on a t-shirt." },
      ] },
      { id: 'vq.jg4', turns: [
        { by: 'local', say: "Hmm. Fine. Take it." },
        { by: 'b', say: "Fine? We worked really hard on that." },
        { by: 'a', say: "Stop arguing with the yes!" },
      ] },
      { id: 'vq.jg5', turns: [
        { beat: '{local} looks at it for a long time, shakes their head, and hands over the tip anyway.' },
        { by: 'a', say: "Why the head shake? What was the head shake?" },
        { by: 'b', say: "Doesn't matter. We have the tip." },
      ] },
    ],
  },
};
