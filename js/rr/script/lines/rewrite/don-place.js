// Don checking teams in at the Chill Zone, rewritten to the standard: quick hits (2 to 5 lines), the way the real show
// does it (episode 3: a jab aimed at that team, "settle for silver", "someone's got the cheese sweats"). Gated on where
// they came in (matPlace: first, top, mid, bottom), on what they are to each other (relFam), on their identity, on how
// their leg went (broke, snapped). `plain`; `bored` (Don can't be bothered); `scared-of-them` (a team that has been
// sabotaging people, and Don keeps his distance); `penalty-reveal` (they'd be in, but there's a penalty).
import { V } from '../places/_kit.js';

const P = 'don-place.plain';
const don = say => ({ by: 'don', say });
const jab = (identity, line, reply, button) => ({ id: `dp2.id-${identity}`, when: { identity }, turns: [don(line), reply, don(button)] });

export default {
  retire: ['don-place.plain', 'don-place.bored', 'don-place.scared-of-them', 'don-place.penalty-reveal', 'don-place.any'],
  pools: {
    [P]: [
      // first
      { id: 'dp2.f1', when: { matPlace: 'first' }, turns: [
        don("{team}. You're the first team to arrive."),
        { by: 'a', ...V("First? Actually first? Like, number one?", "First? Actually?", "Actually first?", "FIRST? ACTUALLY first? Like, NUMBER ONE?", "First? We're actually first? Number one?", "First. As in, the first one. The one before the others.") },
        don("That's what first means. Congratulations. Now get off my mat."),
      ] },
      { id: 'dp2.f2', when: { matPlace: 'first' }, turns: [
        { beat: '{a} and {b} sprint the last few steps and land on the mat together.' },
        don("{team}, you're the first team to arrive, and you've won this leg."),
        { by: 'b', ...V("We won a leg. We actually won a leg.", "We won a leg. Actually.", "A leg. We won one.", "We WON a LEG! We ACTUALLY won a LEG!", "We won a leg. We really, actually won a leg.", "We won a leg. Write it on our tombstones.") },
        don("Don't get used to it."),
      ] },
      { id: 'dp2.f3', when: { matPlace: 'first' }, turns: [
        don("Well, well, well. {team}. First place."),
        { by: 'a', say: "Is there a prize? Please say there's a prize." },
        don("The prize is that everybody else hates you a little bit more now. Enjoy it."),
      ] },
      { id: 'dp2.f4', when: { matPlace: 'first', relFam: 'family' }, turns: [
        don("{team}. First team to arrive."),
        { by: 'b', ...V("Mom is going to frame this. She's going to frame a picture of this mat.", "Mom's framing this mat.", "Mom will frame this. The mat.", "MOM is going to FRAME this! She's going to frame a picture of this MAT!", "Mom's going to frame this. She's going to frame a picture of this mat.", "Mom will frame this. And then the frame will get its own frame.") },
        don("Tell your mother the mat is not for sale."),
      ] },
      { id: 'dp2.f5', when: { matPlace: 'first', relFam: 'romantic' }, turns: [
        { beat: '{a} and {b} cross the mat, and kiss before Don has said a word.' },
        don("{team}, you're first. And please don't do that on my mat."),
        { by: 'a', say: "Sorry. We're very happy." },
        don("Be happy over there."),
      ] },
      // near the top
      { id: 'dp2.t1', when: { matPlace: 'top' }, turns: [
        don("{team}. You're the {placing} team to arrive."),
        { by: 'a', ...V("{placing}? We'll take {placing}. {placing} is great.", "We'll take it. It's great.", "We'll take {placing}.", "{placing}? We'll TAKE {placing}! {placing} is GREAT!", "We'll take {placing}, honestly. That's great.", "{placing}. A respectable number. A number you can bring home.") },
        don("{placing} is fine. Fine is the word I'd use."),
      ] },
      { id: 'dp2.t2', when: { matPlace: 'top' }, turns: [
        don("{team}, you're {placing}. Not first. Not last. Pleasantly forgettable."),
        { by: 'b', say: "Forgettable?" },
        don("Pleasantly."),
      ] },
      { id: 'dp2.t3', when: { matPlace: 'top' }, turns: [
        { beat: '{a} and {b} jog onto the mat, barely out of breath.' },
        don("{team}. {placing}. You don't even look tired."),
        { by: 'a', ...V("We paced ourselves. We have a whole system.", "We have a system.", "Paced ourselves. A system.", "We PACED ourselves! We have a WHOLE SYSTEM!", "We paced ourselves. We've got a whole system.", "We paced ourselves. There's a spreadsheet.") },
        don("Nobody likes a team with a system."),
      ] },
      // the middle
      { id: 'dp2.m1', when: { matPlace: 'mid' }, turns: [
        don("{team}, you're the {placing} team. Right in the middle."),
        { by: 'b', ...V("Is the middle good, or is it bad?", "Good or bad, the middle?", "Is that good or bad?", "Is the middle GOOD, or is it BAD?", "Is the middle good or bad, though?", "Is the middle good? Is it bad? Is it a feeling?") },
        don("It's safe! Safe is good. Safe is how you get to the end. Next!"),
      ] },
      { id: 'dp2.m2', when: { matPlace: 'mid' }, turns: [
        don("{team}. {placing}. Water's over there."),
        { by: 'a', say: "That's it?" },
        don("That's it. I've got a lot of teams to get through. Water. Over there."),
      ] },
      { id: 'dp2.m3', when: { matPlace: 'mid' }, turns: [
        { beat: 'Don is halfway through a sandwich when they arrive.' },
        don("Mm. {team}. You're {placing}."),
        { by: 'b', ...V("Where did you get a sandwich? I would kill for a sandwich.", "Where'd you get a sandwich?", "Where's the sandwich from?", "Where did you GET a SANDWICH? I would KILL for a sandwich!", "Where did you even get a sandwich? I'd do anything for a sandwich.", "Where did you get that sandwich? Is there a sandwich place? Is it near?") },
        don("Hosts get sandwiches. Racers get water. That's the deal."),
      ] },
      { id: 'dp2.m4', when: { matPlace: 'mid', snapped: true }, turns: [
        don("{team}, you're {placing}. And I'm told you two had words today."),
        { by: 'a', say: "We're fine." },
        { by: 'b', say: "We're fine." },
        don("You said that at exactly the same time without looking at each other. Very convincing."),
      ] },
      // near the bottom
      { id: 'dp2.b1', when: { matPlace: 'bottom' }, turns: [
        { beat: '{a} and {b} stumble onto the mat, holding each other up.' },
        don("{team}. You're the {placing} team to arrive."),
        { by: 'a', ...V("Are we safe? Just tell me we're safe.", "Are we safe?", "Tell me we're safe.", "Are we SAFE? Just TELL me we're safe!", "Are we safe? Please just tell me we're safe.", "Are we safe? Say yes. Say it slowly.") },
        don("You're safe. Barely. Like, by a whisker."),
      ] },
      { id: 'dp2.b2', when: { matPlace: 'bottom' }, turns: [
        don("{team}, you're {placing}. Still in it. Somehow."),
        { by: 'b', say: "We got lost three times." },
        don("I know. I was watching. We all were. There was popcorn."),
      ] },
      { id: 'dp2.b3', when: { matPlace: 'bottom', broke: true }, turns: [
        don("{team}, you're {placing}, and I hear you don't have a single cent left."),
        { by: 'a', ...V("We have a button. And a receipt.", "A button and a receipt.", "We've got a button.", "We have a BUTTON! And a RECEIPT!", "We have a button, and I think a receipt.", "We have a button, a receipt, and our dignity. Mostly the button.") },
        don("Keep the button. You might need it."),
      ] },
      // anywhere
      { id: 'dp2.a1', turns: [
        don("{team}. You're the {placing} team to arrive."),
        { by: 'a', say: "We'll take it." },
        don("You don't really get a choice, but sure."),
      ] },
      { id: 'dp2.a2', turns: [
        don("Welcome to the Chill Zone, {team}. You're {placing}."),
        { by: 'b', ...V("Can we sit down? Is sitting allowed?", "Can we sit?", "Is sitting allowed?", "Can we SIT down? Is SITTING allowed?", "Can we sit down now? Is that allowed?", "Can we sit? Is there a sitting rule?") },
        don("Sit anywhere that isn't my mat."),
      ] },
      { id: 'dp2.a3', turns: [
        { beat: 'Don checks a card, then checks it again.' },
        don("{team}, you're {placing}, according to this card."),
        { by: 'a', say: "Why did you need the card? We're standing right in front of you." },
        don("I don't keep you in my head. That's what the card's for."),
      ] },
      { id: 'dp2.a4', turns: [
        don("{team}. {placing}. I'd clap, but I'm holding a coffee."),
        { by: 'a', say: "You could put the coffee down." },
        don("I could. I won't. {placing}. Move along."),
      ] },
      { id: 'dp2.a5', turns: [
        { beat: '{a} and {b} jump onto the mat together.' },
        don("{team}, you're the {placing} team to arrive."),
        { by: 'b', ...V("We'll take it. We will absolutely take it.", "We'll take it.", "We'll absolutely take it.", "We'll TAKE it! We will ABSOLUTELY take it!", "We'll take it, we'll absolutely take it.", "We'll take it, wrap it, and bring it home.") },
      ] },
      { id: 'dp2.a6', turns: [
        don("And here come {team}, in {placing} place."),
        { by: 'a', say: "Is that good?" },
        don("It's a number. What you do with it is up to you. Go sit."),
      ] },
      // identity jabs: Don has a line for what they are
      jab('surfers', "{team}. {placing}. Did you catch a wave on the way, or just a nap?", { by: 'a', say: "Little bit of both, dude." }, 'Of course it was.'),
      jab('ice-dancers', "{team}, you're {placing}. Still smiling, I see. Do you ever stop?", { by: 'a', say: "Never. Not even when we sleep." }, "That's the scariest thing I've heard all day."),
      jab('tennis-rivals', "{team}. {placing}. Which one of you is going to blame the other first?", { by: 'b', say: "{a} is. {a} always serves first." }, 'Fifteen, love. Go sit down.'),
      jab('cheerleaders', "{team}, you're {placing}. Please don't do a routine. Please. I'm begging you.", { by: 'a', say: "We were going to do a small one." }, 'Then do it far away from me.'),
      jab('wrestlers', "{team}. {placing}. Try not to body-slam the mat. It's new.", { by: 'b', say: "No promises." }, 'I mean it. Step off gently.'),
      jab('rockers', "{team}. You're {placing}. Hold the applause. And the guitar solo.", { by: 'a', say: "Just a short one?" }, 'No. Go sit down.'),
      jab('actors', "{team}, you're {placing}. And I can tell you're about to make a speech. Don't.", { by: 'a', say: "I'd like to thank..." }, "Thank you. That's enough. Go."),
      jab('magicians', "{team}. {placing}. Can you make yourselves disappear? Just until the next leg?", { by: 'b', say: "That's not how it works." }, 'Then just walk away. Slowly. Like normal people.'),
      jab('goths', "{team}. You're {placing}. You two look thrilled. As usual.", { by: 'a', say: "This is thrilled." }, 'Good. Keep it up.'),
      jab('gamers', "{team}, you're {placing}. No, there's no respawn. I've been asked.", { by: 'b', say: "We were going to ask." }, "There's also no pause button. Off you go."),
      jab('hippies', "{team}. {placing}. Please stop hugging the mat. It's not a tree.", { by: 'a', say: "Everything deserves a hug, man." }, "It's a mat. It doesn't want a hug. Off."),
      jab('cowboys', "{team}, you're {placing}. Take your hat off on my mat, partner.", { by: 'a', say: "Yes, sir. Sorry, sir." }, 'Much better. Now mosey.'),
      jab('police-cadets', "{team}. You're {placing}. I haven't done anything wrong, before you ask.", { by: 'b', say: "We'll decide that." }, "That's what I was afraid of."),
      jab('firefighters', "{team}, you're {placing}. Nothing's on fire, so you can relax.", { by: 'a', say: "We never relax. Something's always about to be on fire." }, "That's a very stressful way to live."),
      jab('nurses', "{team}. {placing}. Please don't check my pulse. Last time somebody did, it was weird.", { by: 'b', say: "It's a habit." }, 'Then wash your hands of it. Over there.'),
      jab('flight-attendants', "{team}, you're {placing}. Please return your seats to the upright position, and get off my mat.", { by: 'a', say: "We'll do a final check of the cabin." }, 'Do it from the seats over there.'),
      jab('influencers', "{team}. {placing}. No, you can't film a video on the mat. Yes, I can see you filming.", { by: 'a', say: "It's for the followers." }, 'Unfollow the mat. Go.'),
      jab('geniuses', "{team}, you're {placing}. I'm sure you've already worked out exactly why.", { by: 'b', say: "We have a theory. Several." }, 'Keep them to yourselves.'),
      jab('lawyers', "{team}. {placing}. And before you object, it's final.", { by: 'a', say: "We weren't going to object. Yet." }, 'Overruled. Go sit down.'),
      jab('chefs', "{team}, you're {placing}. If you're going to complain about the snacks, I made them. So don't.", { by: 'b', say: "We'll complain quietly." }, 'Good. Quietly is my favourite volume.'),
      jab('farmers', "{team}. {placing}. You look like you've been up since four.", { by: 'a', say: "Three. We're always up at three." }, "Then you've earned a sit down. Over there."),
      jab('rich-kids', "{team}, you're {placing}. No, you can't buy a better place. I've been offered money before.", { by: 'a', say: "How much were you offered?" }, 'None of your business. Off.'),
      jab('retirees', "{team}. {placing}. Take your time stepping off the mat. Seriously, take your time.", { by: 'b', say: "We're not that old, young man." }, "Yes, ma'am. Sorry, ma'am. Take your time."),
      jab('party-animals', "{team}, you're {placing}. And no, the Chill Zone is not a party.", { by: 'a', say: "Not yet." }, 'Not ever. Sit.'),
      jab('teachers', "{team}. {placing}. And yes, I'll be giving you a grade.", { by: 'b', say: "Please don't say a C." }, "I'm thinking a B minus. Off you go."),
      jab('college-students', "{team}, you're {placing}. Shouldn't you two be studying?", { by: 'a', say: "This counts as a field trip." }, "It doesn't. Go sit down."),
    ],
    'don-place.bored': [
      { id: 'dp2.z1', turns: [
        { beat: 'Don is looking at his phone when they arrive, and he does not look up.' },
        don("Mm. {team}. {placing}."),
        { by: 'a', say: "That's it? We ran the whole way." },
        don("And now you can stop running. Good for you."),
      ] },
      { id: 'dp2.z2', turns: [
        don("Oh. It's you. {team}, you're {placing}."),
        { by: 'b', ...V("You could sound a little more excited.", "Bit more excited, maybe?", "You could sound more excited.", "You could SOUND a little more EXCITED!", "You could maybe sound a little more excited.", "A little enthusiasm wouldn't kill you.") },
        don("I could. I'm not going to."),
      ] },
    ],
    'don-place.scared-of-them': [
      { id: 'dp2.s1', turns: [
        { beat: '{a} and {b} charge onto the mat. Don takes a large step back.' },
        don("{team}. Hi. You're {placing}. Great job. Really great. Stay over there."),
        { by: 'a', say: "Why are you standing all the way back there?" },
        don("No reason. I like it back here. The view's better."),
      ] },
      { id: 'dp2.s2', turns: [
        don("{team}, you're {placing}. And I'm going to keep both hands where you can see them."),
        { by: 'b', ...V("We're not going to do anything to you.", "We won't do anything to you.", "We're not doing anything.", "We're NOT going to do ANYTHING to you!", "We're not going to do anything to you, you know.", "We would never sabotage the host. Probably.") },
        don("That's what everybody you've done something to thought."),
      ] },
    ],
    'don-place.penalty-reveal': [
      { id: 'dp2.p1', turns: [
        don("{team}. You would be the {placing} team to arrive."),
        { by: 'a', ...V("Would be?", "Would be?", "Would be? Why would be?", "WOULD be?", "Wait, would be?", "Would be? I don't like would be.") },
        don("There's a penalty. Wait it out over there. I'll be over here, not waiting with you."),
      ] },
      { id: 'dp2.p2', turns: [
        don("{team}, before I tell you where you came in, there's a little matter of a penalty."),
        { by: 'b', say: "For what? What did we do?" },
        don("You know what you did. Go stand by the sign. The sad sign."),
      ] },
      { id: 'dp2.p3', turns: [
        { beat: 'Don holds up a hand before they can step onto the mat.' },
        don("Not yet. You've got a penalty to serve first."),
        { by: 'a', say: "We're right here. We're one step away." },
        don("Then it'll be a very frustrating wait, won't it?"),
      ] },
    ],
    // the penalty served, and the check-in in the place it cost them (chill.js; 2026-10-22: a team sat on the stool in
    // second and turned up eighth on the results card with nothing between)
    'don-place.penalty-served': [
      { id: 'dp2.ps1', turns: [
        { beat: 'Don clicks his stopwatch and waves them over to the mat.' },
        don("Time's up, {team}! That's {penalty} served, so step onto the mat, because you're the {placing} team to arrive."),
        { by: 'a', ...V("We got here ages ago.", "We were here first. Well, earlier.", "We've been here the whole time.", "We got here AGES ago!", "We did get here quite a while ago, though.", "We got here so long ago, I've aged.") },
        don("You did, and then you sat on a stool, and that's the order these things happen in."),
      ] },
      { id: 'dp2.ps2', turns: [
        don("{penalty}, served in full, and I watched every minute of it, so come on up, {team}."),
        { by: 'b', say: "We watched team after team walk past us onto that mat." },
        don("I know, and it was honestly the best part of my day. You're the {placing} team to arrive."),
      ] },
      { id: 'dp2.ps3', turns: [
        don("{team}, your penalty's over, and you can finally step on the mat."),
        { by: 'a', ...V("Where does that leave us?", "So where are we?", "Where are we?", "WHERE does that leave us?", "So, where does that leave us, then?", "Where are we now? Emotionally, too.") },
        don("You're the {placing} team to arrive, which isn't where you'd have been, but it's where you are."),
      ] },
      { id: 'dp2.ps4', turns: [
        { beat: 'They have been watching the mat for {penalty}. Don finally waves them on.' },
        don("Off the bench, {team}, because your penalty is done, and you are officially the {placing} team to arrive."),
        { by: 'b', say: "It was a really long {penalty}." },
        don("They're all the same length, I checked, so maybe next time just follow the rules."),
      ] },
    ],
  },
};
