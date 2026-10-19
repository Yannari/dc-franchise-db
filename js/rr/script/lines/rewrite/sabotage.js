// Sabotage, rewritten to the standard (scenes of 6 to 12 lines). a and b do it, c and d are the victims. Every kind is a
// different act, written as itself: an elbow past them (push), a cab into a cab (ram), taking something they need at
// a task (steal), taking their lucky thing (kidnap-pet), moving a marker (course-sabotage), a shortcut that isn't one
// (fake-shortcut), getting them worse seats or a later flight (admin-sabotage). `works`: nobody sees. `seen`: a
// witness or the crew does, and an hour's penalty and Don's ruling follow. `backfires`: it costs a and b instead.
import { V } from '../places/_kit.js';

const keys = (kind, endings) => [...endings.map(e => `${kind}.${e}`), `${kind}.any`];
const SAB = ['works', 'seen', 'backfires'];

export default {
  retire: [...['push', 'ram', 'steal', 'kidnap-pet', 'course-sabotage', 'fake-shortcut'].flatMap(k => keys(k, SAB)),
    ...keys('admin-sabotage', ['worse-seats', 'later-flight-attempt'])],
  pools: {
    'push.works': [
      { id: 'sb.pw1', turns: [
        { beat: 'Two teams race for the same narrow gap at the same moment.' },
        { by: 'a', ...V("Stay behind me. When I say go, you go.", "Behind me. Go when I say.", "Stay behind me. Go on my word.", "Stay BEHIND me! When I say GO, you GO!", "Stay behind me, okay? When I say go, you go.", "Stay behind me. I am the plan. Go when the plan says.") },
        { beat: 'As they pass {c}, {a} sticks out an elbow. {c} spins sideways and lands in the dirt.' },
        { by: 'a', say: "Go. Now." },
        { by: 'b', ...V("Did you just do that? Is {c.sub} okay?", "Did you just do that? Is {c.sub} okay?", "Did you do that? Is {c.sub} okay?", "Did you JUST do that? Is {c.sub} OKAY?", "Did you really just do that? Is {c.sub} okay?", "Was that an elbow? Was that your elbow? Is {c.sub} okay?") },
        { by: 'c', say: "{d}, help me up. I think I caught my foot on something." },
        { by: 'a', say: "{c.Sub}'s fine. {c.Sub}'s getting up. Run." },
      ] },
      { id: 'sb.pw2', turns: [
        { by: 'a', ...V("Excuse me! Coming through! So sorry!", "Coming through. Sorry.", "Excuse me. Coming through.", "EXCUSE me! Coming THROUGH! SO sorry!", "Excuse me, sorry, coming through!", "Pardon us! Coming through! Mind the elbows!") },
        { beat: '{a} goes through {c} and {d} like they aren\'t there. {d} ends up in a hedge.' },
        { by: 'd', say: "Did that just happen? Did someone just put me in a hedge?" },
        { by: 'b', ...V("We didn't stop. Why didn't we stop?", "Why didn't we stop?", "We didn't stop.", "We didn't STOP! WHY didn't we stop?", "Why didn't we stop? We should've stopped.", "We didn't stop. We're hedge people now. Bad hedge people.") },
        { by: 'a', say: "Because we're in a race. And they're behind us now." },
        { by: 'c', say: "Who was that? Did you see who that was?" },
      ] },
    ],
    'push.seen': [
      { id: 'sb.ps1', turns: [
        { beat: '{a} shoulders past {c}, hard. A crew member standing right there writes something down.' },
        { by: 'c', ...V("Hey! Did everybody see that?", "Did everyone see that?", "Hey. You saw that.", "HEY! Did EVERYBODY see that?", "Hey! Did everybody just see that?", "Hey! Witnesses! Did the witnesses witness?") },
        { by: 'd', say: "The crew saw it. Look, they're writing." },
        { by: 'b', ...V("They're writing. Why are they writing? Is that bad?", "They're writing. That's bad.", "Writing is bad, isn't it?", "They're WRITING! WHY are they writing? Is that BAD?", "They're writing something down. Is that bad?", "They're writing. Nobody writes good things down.") },
        { by: 'a', say: "It was an accident." },
        { by: 'c', say: "Tell that to the clipboard." },
      ] },
      { id: 'sb.ps2', turns: [
        { by: 'a', say: "Out of the way!" },
        { beat: '{a} pushes {d} aside, and turns round to find three other teams staring.' },
        { by: 'd', ...V("Everybody saw that. Every single person saw that.", "Everybody saw that.", "Every person saw that.", "EVERYBODY saw that! Every SINGLE person saw that!", "Every single person here just saw you do that.", "Everybody saw that. There will be songs.") },
        { by: 'b', say: "Oh no. Oh no, no, no." },
        { by: 'c', say: "Don's going to hear about this." },
        { by: 'a', say: "Don doesn't care about a little push." },
      ] },
    ],
    'push.backfires': [
      { id: 'sb.pb1', turns: [
        { beat: '{a} lines up an elbow for {c}, then {c} steps aside at the last second.' },
        { by: 'a', say: "Whoa, whoa, whoa..." },
        { beat: '{a} keeps going, straight into a stack of crates, and they all come down.' },
        { by: 'b', ...V("Are you okay? What were you doing?", "Are you okay? What was that?", "You okay? What were you doing?", "Are you OKAY? What were you DOING?", "Are you okay? What on earth were you doing?", "Are you alive? Why were you attacking the crates?") },
        { by: 'c', say: "Have a nice fall!" },
        { by: 'a', say: "I'm fine. I'm fine. I'm in a lot of crates, but I'm fine." },
      ] },
      { id: 'sb.pb2', turns: [
        { by: 'a', say: "Watch this. I'm going to cut them off." },
        { beat: '{a} swerves in front of {c} and {d}, trips over {a.posAdj} own foot, and goes down hard.' },
        { by: 'd', ...V("Are you all right? Do you need a hand?", "You okay? Need a hand?", "Need a hand?", "Are you ALL RIGHT? Do you need a HAND?", "Are you all right? Do you need a hand up?", "Are you all right? You went down like a tree.") },
        { by: 'a', say: "No! No hand. I'm resting." },
        { by: 'b', say: "{a.Sub} was trying to trip you, and tripped instead." },
        { by: 'c', say: "Oh. Then have a lovely rest." },
      ] },
    ],

    'ram.works': [
      { id: 'sb.rw1', turns: [
        { beat: 'Two cabs race for the same lane. {a} leans forward to the driver.' },
        { by: 'a', ...V("Get in front of them. I don't care how. Get in front.", "Get in front of them. However.", "In front of them. Any way.", "Get IN FRONT of them! I don't CARE how! Get IN FRONT!", "Get in front of them. I don't care how you do it.", "Get in front of them. Use the whole car if you have to.") },
        { beat: 'The cab nudges the other cab, just hard enough. The other cab spins onto the verge.' },
        { by: 'b', say: "Did we just hit them? Did we hit a cab?" },
        { by: 'a', say: "We touched them. Gently. With a cab." },
        { by: 'c', ...V("Did that cab just hit us? On purpose?", "That cab hit us. On purpose?", "Did they hit us on purpose?", "Did that cab just HIT us? On PURPOSE?", "Did that cab just hit us on purpose?", "Did a cab just attack us? Is that allowed?") },
      ] },
      { id: 'sb.rw2', turns: [
        { by: 'b', say: "They're right next to us. They're going to pass." },
        { by: 'a', say: "Not if we're in their lane." },
        { beat: 'The cab swings left. The other cab swerves to miss it and ends up facing the wrong way.' },
        { by: 'd', ...V("They nearly drove us off the road!", "They nearly ran us off the road.", "Nearly off the road.", "They NEARLY drove us off the ROAD!", "They nearly drove us right off the road!", "They nearly put us in a field! A whole field!") },
        { by: 'b', say: "I can't look. I'm not looking." },
        { by: 'a', say: "Then don't look. Just enjoy being ahead." },
      ] },
    ],
    'ram.seen': [
      { id: 'sb.rs1', turns: [
        { beat: 'The cab bumps another cab off the road, right in front of a crew van.' },
        { by: 'b', ...V("There's a crew van. There's a crew van right there.", "There's a crew van right there.", "Crew van. Right there.", "There's a CREW VAN! There's a crew van RIGHT THERE!", "There's a crew van right there, behind us.", "There is a crew van. It has seen everything. It knows.") },
        { by: 'a', say: "Maybe they were looking the other way." },
        { beat: 'The crew van flashes its lights twice.' },
        { by: 'b', say: "They were not looking the other way." },
        { by: 'c', say: "Don is going to hear about this." },
      ] },
      { id: 'sb.rs2', turns: [
        { by: 'a', say: "Hit them. Just a little." },
        { beat: 'The cab nudges the next cab. A camera on the dashboard catches the whole thing.' },
        { by: 'd', ...V("They rammed us! Did you get that? Tell me you got that!", "They rammed us. Did you get it?", "Rammed us. Got that?", "They RAMMED us! Did you GET that? TELL me you got that!", "They rammed us! Please tell me you got that on camera!", "They rammed us! I want that footage framed!") },
        { by: 'c', say: "They got it. The camera's right there." },
        { by: 'b', say: "We're going to get a penalty, aren't we?" },
        { by: 'a', say: "It was a small ram." },
      ] },
    ],
    'ram.backfires': [
      { id: 'sb.rb1', turns: [
        { by: 'a', say: "Swerve into them. Now!" },
        { beat: 'The cab swerves, misses the other cab completely, and bounces into a ditch.' },
        { by: 'b', ...V("We're in a ditch. We're in a ditch, and they're gone.", "We're in a ditch. They're gone.", "Ditch. And they're gone.", "We're in a DITCH! We're in a DITCH, and they're GONE!", "We're in a ditch, and they've gone.", "We are in a ditch. They are in the distance. Great plan.") },
        { by: 'a', say: "That wasn't the plan." },
        { by: 'b', say: "What was the plan?" },
        { by: 'a', say: "The plan was the opposite of this." },
      ] },
      { id: 'sb.rb2', turns: [
        { beat: 'The driver refuses, point blank, to ram anybody, and pulls over to argue about it.' },
        { by: 'a', ...V("I'll pay extra! I'll pay double!", "I'll pay extra.", "Double. I'll pay double.", "I'll pay EXTRA! I'll pay DOUBLE!", "I'll pay extra! I'll pay double, honestly!", "I'll pay double! Triple! I'll give you my shoes!") },
        { by: 'b', say: "He's not going to ram anybody. He has a family." },
        { beat: 'The other cab drives past while they argue. {c} waves out of the window.' },
        { by: 'c', say: "Bye!" },
        { by: 'a', say: "This driver has cost us everything." },
      ] },
    ],

    'steal.works': [
      { id: 'sb.tw1', turns: [
        { beat: 'While {c} and {d} are busy, {a} slips their oar out of the boat and walks off with it.' },
        { by: 'b', ...V("Is that their oar? Why do you have their oar?", "That's their oar.", "Why do you have their oar?", "Is that THEIR oar? WHY do you have their OAR?", "Is that their oar? Why have you got their oar?", "That oar. That isn't our oar. Where did our new oar come from?") },
        { by: 'a', say: "Because now they don't." },
        { by: 'c', say: "Where's our oar? We had an oar. {d}, where's our oar?" },
        { by: 'd', ...V("We had it a second ago. It was right here.", "It was right here.", "It was here a second ago.", "We HAD it a second ago! It was RIGHT HERE!", "We had it a second ago, I swear it was right here.", "It was right here. Oars don't just leave.") },
        { by: 'b', say: "I feel sick." },
      ] },
      { id: 'sb.tw2', turns: [
        { beat: '{a} quietly picks up the map {c} left on a rock, folds it, and puts it in {a.posAdj} pocket.' },
        { by: 'b', say: "Was that their map?" },
        { by: 'a', ...V("It was a map. Lying on a rock. Anyone could've picked it up.", "A map, on a rock. Anyone could've.", "It was on a rock. Fair game.", "It was a MAP! Lying on a ROCK! ANYONE could've picked it UP!", "It was just a map lying on a rock. Anyone could've picked it up.", "It was a map on a rock. Finders, keepers. Losers, lost.") },
        { by: 'c', say: "{d}, have you got the map?" },
        { by: 'd', say: "You had the map." },
        { by: 'c', say: "I put it on the rock. Right here. On this rock." },
      ] },
    ],
    'steal.seen': [
      { id: 'sb.ts1', turns: [
        { beat: '{a} reaches for the bag of supplies {c} and {d} left behind, and looks up straight into a crew member\'s camera.' },
        { by: 'a', say: "This isn't what it looks like." },
        { by: 'c', ...V("It looks like you're stealing our stuff.", "Looks like you're stealing our stuff.", "You're stealing our stuff.", "It LOOKS like you're STEALING our STUFF!", "It looks exactly like you're stealing our stuff.", "It looks like theft. It looks very much like theft.") },
        { by: 'a', say: "Then it's exactly what it looks like." },
        { by: 'b', say: "Put it down. Put it down, we're on camera." },
        { by: 'd', say: "Don's going to love this." },
      ] },
      { id: 'sb.ts2', turns: [
        { by: 'd', ...V("Hey! That's ours! Give that back!", "Hey! That's ours.", "That's ours. Give it back.", "HEY! That's OURS! Give that BACK!", "Hey! That's ours, give it back!", "Hey! That belongs to us! Unhand our things!") },
        { by: 'a', say: "It was lying here." },
        { by: 'c', say: "It was lying here because we put it down for two seconds." },
        { beat: 'Two other teams have stopped what they\'re doing to watch.' },
        { by: 'b', say: "Everybody saw. Just give it back." },
        { by: 'a', say: "Fine. Fine! Here." },
      ] },
    ],
    'steal.backfires': [
      { id: 'sb.tb1', turns: [
        { beat: '{a} grabs the bag {c} and {d} left behind and runs.' },
        { by: 'b', say: "What's in it?" },
        { by: 'a', ...V("Their stuff. Whatever they need. Let's look.", "Their stuff. Let's look.", "Let's see what they need.", "Their STUFF! Whatever they NEED! Let's LOOK!", "Their stuff, whatever they need. Let's look.", "Their worldly goods. Let's see what we've stolen.") },
        { beat: '{a} opens it. Inside is a single sock and a lot of sand.' },
        { by: 'b', say: "We stole a sock." },
        { by: 'a', say: "And now we have to take it back before anybody notices." },
      ] },
      { id: 'sb.tb2', turns: [
        { by: 'a', say: "I took their rope. Now they can't finish." },
        { by: 'b', ...V("That's not their rope. That's our rope.", "That's our rope.", "That's ours. Our rope.", "That's NOT their rope! That's OUR rope!", "That's not their rope, though. That's ours.", "That's our rope. You've stolen from us. You've robbed yourself.") },
        { beat: '{a} looks at the rope. {a} looks at their own empty station.' },
        { by: 'a', say: "Then where's their rope?" },
        { by: 'c', say: "Right here. Thanks for asking!" },
        { by: 'b', say: "We have to start again. We have to start completely again." },
      ] },
    ],

    'kidnap-pet.works': [
      { id: 'sb.kw1', turns: [
        { beat: '{d} has carried a lucky stuffed bear the whole race. When {d} puts it down, {a} picks it up.' },
        { by: 'b', ...V("Why do you have their bear?", "Why do you have their bear?", "That's their bear.", "WHY do you have their BEAR?", "Why have you got their bear?", "Why are you holding their bear? What has the bear done?") },
        { by: 'a', say: "Insurance." },
        { by: 'd', ...V("Where's Mr Snuggles? Where is he? He was right here!", "Where's Mr Snuggles?", "Mr Snuggles is gone.", "WHERE'S Mr Snuggles? WHERE is he? He was RIGHT HERE!", "Where's Mr Snuggles? He was right here, I put him right here!", "Mr Snuggles is missing. Mr Snuggles never goes missing.") },
        { by: 'c', say: "We'll find him. We'll find him, I promise. Look under the bench." },
        { beat: 'They search for an hour. Mr Snuggles is in {a}\'s backpack the whole time.' },
      ] },
      { id: 'sb.kw2', turns: [
        { beat: '{c} wears a lucky cap every leg. Right now it is on a bench, and then it is in {a}\'s hand.' },
        { by: 'a', say: "Let's see how lucky they are without it." },
        { by: 'b', say: "That's a hat. You've stolen a hat." },
        { by: 'c', ...V("My cap. My lucky cap. It's gone. It was right on the bench.", "My lucky cap's gone.", "My cap. It's gone.", "My CAP! My LUCKY cap! It's GONE!", "My lucky cap is gone. It was right there on the bench.", "My cap has vanished. My luck has vanished with it.") },
        { by: 'd', say: "It's just a cap. We don't need it." },
        { by: 'c', say: "We do. We absolutely do. Help me look." },
      ] },
    ],
    'kidnap-pet.seen': [
      { id: 'sb.ks1', turns: [
        { beat: '{a} slips {c}\'s lucky charm into {a.posAdj} pocket, and a crew member clears their throat.' },
        { by: 'a', say: "Hi. This isn't mine." },
        { by: 'c', ...V("That's mine! Why is my charm in your pocket?", "That's mine. Why's it in your pocket?", "Why's my charm in your pocket?", "That's MINE! WHY is my charm in YOUR pocket?", "That's mine! Why is my lucky charm in your pocket?", "That's mine! Why is my luck in your pocket?") },
        { by: 'b', say: "It fell in. Things fall into pockets." },
        { by: 'd', say: "Nothing falls into a pocket." },
        { by: 'a', say: "Here. Have it back. It's not even that lucky." },
      ] },
      { id: 'sb.ks2', turns: [
        { beat: '{a} has {d}\'s lucky scarf halfway into a bin when {d} turns round.' },
        { by: 'd', ...V("That's my scarf! That's my grandmother's scarf!", "That's my scarf.", "My grandmother's scarf!", "That's MY scarf! That's my GRANDMOTHER'S scarf!", "That's my scarf! That's my grandmother's scarf!", "That's my scarf. That scarf has been to three weddings.") },
        { by: 'a', say: "Is it? It was on the ground. I thought it was rubbish." },
        { by: 'c', say: "You were putting it in a bin, on purpose, while looking around." },
        { by: 'b', say: "Give it back. Everybody's looking." },
        { beat: '{a} hands it back. Half the people nearby are still staring.' },
      ] },
    ],
    'kidnap-pet.backfires': [
      { id: 'sb.kb1', turns: [
        { by: 'a', say: "I've got their lucky charm. Now we'll see who's lucky." },
        { beat: 'Ten minutes later, {a} trips, drops the map in a puddle, and gets a parking ticket on a bench.' },
        { by: 'b', ...V("It's cursed. You've stolen a cursed charm.", "It's cursed.", "That charm's cursed.", "It's CURSED! You've stolen a CURSED charm!", "I think it's cursed. You stole a cursed charm.", "It's cursed. It only brings luck to its owner. It's loyal.") },
        { by: 'a', say: "That's not how luck works." },
        { by: 'b', say: "Then why are you sitting in a puddle?" },
        { beat: '{a} and {b} spend twenty minutes finding {c} and {d} to give it back.' },
      ] },
      { id: 'sb.kb2', turns: [
        { beat: '{a} hides {c}\'s lucky toy behind a bin and runs.' },
        { by: 'b', say: "Where did you put it?" },
        { by: 'a', ...V("Behind a bin. Or a different bin. There were a lot of bins.", "Behind a bin. One of the bins.", "A bin. Some bin.", "Behind a BIN! Or a DIFFERENT bin! There were a LOT of bins!", "Behind a bin, or maybe a different bin. There were loads.", "Behind a bin. Which bin? A bin. Bins all look alike.") },
        { beat: '{c} finds the toy in about a minute. {a} spends twenty minutes looking for the map {a.sub} put down to hide it.' },
        { by: 'b', say: "Where did you put our map?" },
        { by: 'a', say: "Behind a bin." },
      ] },
    ],

    'course-sabotage.works': [
      { id: 'sb.cw1', turns: [
        { beat: 'When nobody\'s looking, {a} turns one of the route markers to point the wrong way.' },
        { by: 'b', ...V("What did you just do to that sign?", "What did you do to the sign?", "What did you do?", "What did you JUST do to that SIGN?", "What did you just do to that sign?", "What have you done to that sign? It looks confused.") },
        { by: 'a', say: "Turned it a little. For the teams behind us." },
        { by: 'b', say: "That's evil." },
        { by: 'a', ...V("That's strategy. Evil is what we'd call it if they did it to us.", "It's strategy. Evil is when it's done to us.", "Strategy. Evil's when they do it.", "That's STRATEGY! EVIL is what we'd call it if they did it to US!", "It's strategy. It'd be evil if they did it to us.", "It's strategy. Evil is just strategy that happens to you.") },
        { beat: 'Twenty minutes later, {c} and {d} come round the corner and follow the sign the wrong way.' },
      ] },
      { id: 'sb.cw2', turns: [
        { by: 'a', say: "Help me move this flag. Just to the other side of the path." },
        { by: 'b', say: "Why?" },
        { by: 'a', ...V("Because the next team will follow it, and it'll take them the long way round.", "The next team follows it the long way.", "The next team goes the long way.", "Because the NEXT team will follow it the LONG way ROUND!", "Because the next team will follow it, and it'll send them the long way.", "Because flags are trusted. And trust is a weakness.") },
        { beat: 'They move it. Later, {c} and {d} follow the flag the long way round, and lose half an hour.' },
        { by: 'd', say: "This doesn't feel right. Does this feel right?" },
        { by: 'c', say: "The flag says this way. Flags don't lie." },
      ] },
    ],
    'course-sabotage.seen': [
      { id: 'sb.cs1', turns: [
        { beat: '{a} is halfway through moving a marker when {c} comes round the corner and stops dead.' },
        { by: 'c', ...V("Are you moving that? Are you moving the marker?", "You're moving the marker?", "Moving the marker?", "Are you MOVING that? Are you moving the MARKER?", "Wait, are you moving that marker?", "Are you rearranging the course? Is that a hobby?") },
        { by: 'a', say: "It fell over. I'm putting it back." },
        { by: 'd', say: "You're putting it back pointing the wrong way." },
        { by: 'b', say: "We're so caught. We're completely caught." },
        { by: 'c', say: "Don's going to hear about this. Today." },
      ] },
      { id: 'sb.cs2', turns: [
        { by: 'a', say: "Quick. Turn the sign before the next team gets here." },
        { beat: 'The sign turns. A camera on a pole turns with it.' },
        { by: 'b', ...V("There's a camera. On that pole. Pointing at us.", "Camera on that pole. Pointing at us.", "There's a camera. Right there.", "There's a CAMERA! On that POLE! Pointing at US!", "There's a camera on that pole, and it's pointing right at us.", "There's a camera. It has seen the sign. It has seen us.") },
        { by: 'a', say: "It's probably not on." },
        { beat: 'A little red light on the camera blinks.' },
        { by: 'b', say: "It's on. It's very on." },
      ] },
    ],
    'course-sabotage.backfires': [
      { id: 'sb.cb1', turns: [
        { by: 'a', say: "Done. I've turned the sign. Everybody behind us goes the wrong way." },
        { by: 'b', ...V("Great. Which way were we going?", "Which way were we going?", "And which way are we going?", "GREAT! Which way were WE going?", "Great. Which way were we supposed to be going?", "Wonderful. Which way do we go? Now that the sign lies.") },
        { beat: 'They both look at the sign. Neither of them can remember which way it pointed before.' },
        { by: 'a', say: "Left. It was definitely left." },
        { beat: 'It was not left. They lose ten minutes to their own sign.' },
        { by: 'b', say: "We sabotaged ourselves." },
      ] },
      { id: 'sb.cb2', turns: [
        { beat: '{a} moves a flag to send the next team the wrong way, then forgets which way is right.' },
        { by: 'b', ...V("You moved the flag. Which flag is the real flag?", "Which flag's the real one?", "Which one's real now?", "You MOVED the flag! WHICH flag is the REAL flag?", "You moved the flag. So which flag is the real one now?", "You moved the flag. The flags are lying. Even to us.") },
        { by: 'a', say: "The one I didn't move." },
        { by: 'b', say: "Which one didn't you move?" },
        { beat: 'They follow the wrong flag for fifteen minutes. {c} and {d} go past them the right way.' },
        { by: 'a', say: "That's a great flag, actually. Very convincing." },
      ] },
    ],

    'fake-shortcut.works': [
      { id: 'sb.fw1', turns: [
        { by: 'a', ...V("Hey! The crew says there's a faster way, through the back. We're taking it.", "There's a faster way through the back. We're taking it.", "Faster way, through the back.", "HEY! The crew says there's a FASTER way, through the BACK! We're taking it!", "Hey, the crew says there's a faster way through the back. We're taking it.", "Psst. A secret faster way. Through the back. The crew said so.") },
        { by: 'c', say: "Through the back? Okay, we're coming too. {d}, come on." },
        { beat: '{c} and {d} race off down the back way. {a} and {b} carry straight on along the main road.' },
        { by: 'b', say: "There's no faster way through the back." },
        { by: 'a', say: "There's a back. I never said it was faster for them." },
        { beat: 'Forty minutes later, {c} and {d} come out of the back way, a very long way behind.' },
      ] },
      { id: 'sb.fw2', turns: [
        { by: 'a', ...V("Don't take the bridge. Everybody's saying the bridge is closed. Go round by the river.", "Bridge is closed. Go round by the river.", "Skip the bridge. River way.", "DON'T take the bridge! Everybody says it's CLOSED! Go round by the RIVER!", "Don't take the bridge. Everyone's saying it's closed. Go round by the river.", "Avoid the bridge. The bridge is closed. The river welcomes you.") },
        { by: 'd', say: "Oh. Thanks. That's really nice of you." },
        { beat: '{c} and {d} go round by the river. {a} and {b} cross the bridge, which is open.' },
        { by: 'b', say: "That was really nice of you. That's what {d} said." },
        { by: 'a', say: "And I am really nice. Just not today." },
        { beat: 'The river way takes {c} and {d} forty minutes longer.' },
      ] },
    ],
    'fake-shortcut.seen': [
      { id: 'sb.fs1', turns: [
        { by: 'a', say: "Psst. There's a shortcut. Down that alley. Trust me." },
        { by: 'd', ...V("Weird. Because the team behind you just told us you said that to them too.", "The team behind told us you said that to them too.", "You told the last team that too.", "WEIRD! Because the team behind you just told us you said that to THEM too!", "Weird, because the team behind you told us you said that to them too.", "Odd. You told the last team that. You're a shortcut salesman.") },
        { by: 'b', say: "Oh no." },
        { by: 'c', say: "And the crew heard you say it." },
        { beat: 'A crew member nods slowly and writes something down.' },
        { by: 'a', say: "That alley is a perfectly good alley." },
      ] },
      { id: 'sb.fs2', turns: [
        { by: 'a', say: "Shortcut's through the car park. Promise." },
        { by: 'c', ...V("Through the car park that says no entry?", "The car park marked no entry?", "That one? It says no entry.", "Through the car park that says NO ENTRY?", "Through the car park with the big no entry sign?", "Through the car park that says no entry, in very big letters?") },
        { by: 'b', say: "It's a very small no entry." },
        { beat: 'A crew member standing beside the sign looks at {a} and shakes their head.' },
        { by: 'd', say: "Even the crew doesn't believe you." },
        { by: 'a', say: "Fine. Go the long way. See if I care." },
      ] },
    ],
    'fake-shortcut.backfires': [
      { id: 'sb.fb1', turns: [
        { by: 'a', say: "Tell them the shortcut is down there. Then we go the real way." },
        { beat: '{c} and {d} take the fake shortcut. It turns out to be a real shortcut.' },
        { by: 'b', ...V("Why are they ahead of us? Why are they ahead?", "Why are they ahead?", "They're ahead. Why?", "WHY are they AHEAD of us? WHY?", "Why are they ahead of us? How are they ahead?", "Why are they ahead? We invented their shortcut!") },
        { by: 'a', say: "Because the fake shortcut was a real shortcut." },
        { by: 'b', say: "You made up a shortcut, and it was real?" },
        { by: 'a', say: "I'm as surprised as you are." },
      ] },
      { id: 'sb.fb2', turns: [
        { by: 'a', say: "Tell them to go left. We go right. Right is the real way." },
        { beat: '{c} and {d} go left. {a} and {b} go right, and right is a dead end.' },
        { by: 'b', ...V("Right's a dead end. You sent them the right way.", "You sent them the right way.", "Dead end. They're on the real way.", "Right's a DEAD END! You sent THEM the RIGHT way!", "Right's a dead end. You sent them the right way.", "Right is a wall. Left was the way. We gave them the way.") },
        { by: 'a', say: "On purpose. I meant to. That was a double bluff." },
        { by: 'b', say: "It was a single mistake." },
        { beat: 'They turn round and walk back the way they came, past the corner where {c} and {d} went left.' },
      ] },
    ],

    'admin-sabotage.worse-seats': [
      { id: 'sb.aw1', turns: [
        { by: 'a', say: "Hi. Those two teams behind us? They'd love the seats at the very back. By the toilets." },
        { beat: 'The agent smiles, and types something.' },
        { by: 'b', ...V("Did you just book them the seats by the toilets?", "You booked them by the toilets?", "The seats by the toilets?", "Did you just book them the seats by the TOILETS?", "Did you really just book them the seats by the toilets?", "Did you just exile them to the toilet seats? Of the plane?") },
        { by: 'a', say: "They'll sleep like babies. Loud, smelly babies." },
        { beat: 'An hour later, {c} and {d} are wedged in the very last row, next to the door that never stops opening.' },
        { by: 'd', say: "Why does it keep flushing? Why does it never stop flushing?" },
      ] },
      { id: 'sb.aw2', turns: [
        { by: 'a', say: "Hi! The team behind us is really tall. Please give them the seats with no legroom." },
        { by: 'b', ...V("They're not tall. They're normal-sized.", "They're not tall.", "They're normal height.", "They're NOT tall! They're NORMAL-sized!", "They're not tall, though. They're completely normal-sized.", "They're average. They're aggressively average.") },
        { by: 'a', say: "They'll be tall by the time they land." },
        { beat: 'Six hours later, {c} and {d} get off the plane folded up like deckchairs.' },
        { by: 'c', say: "I can't feel my knees. My knees have gone." },
        { by: 'd', say: "Somebody did this to us. I can feel it." },
      ] },
    ],
    'admin-sabotage.later-flight-attempt': [
      { id: 'sb.al1', turns: [
        { by: 'a', say: "Excuse me. Can you move that team to the later flight? They told me they'd prefer it." },
        { by: 'b', ...V("They never said that. Nobody wants the later flight.", "They never said that.", "Nobody wants the later flight.", "They NEVER said that! NOBODY wants the LATER flight!", "They never said that, though. Nobody wants the later flight.", "Nobody has ever wanted the later flight. Not once.") },
        { beat: 'The agent looks at {a} for a long time, and calls a supervisor.' },
        { by: 'a', say: "That's fine. We'll wait." },
        { beat: 'The supervisor takes twenty minutes. The flight boards. {c} and {d} are on it. {a} and {b} nearly aren\'t.' },
        { by: 'b', say: "We nearly missed our own flight trying to make them miss theirs." },
      ] },
      { id: 'sb.al2', turns: [
        { by: 'a', say: "Could you put that team on the later flight? They'd like the extra time to rest." },
        { by: 'b', say: "Nobody wants extra time to rest in this race." },
        { beat: 'The agent looks at {a}, then at {c} and {d}, then back at {a}, and doesn\'t move them.' },
        { by: 'a', ...V("Worth a try. It was worth a try.", "Worth a try.", "It was worth a try.", "Worth a TRY! It was WORTH a try!", "It was worth a try, I think.", "Worth a try. Most things are worth a try once.") },
        { by: 'b', say: "We're now at the back of the line, though. Behind them." },
        { beat: 'The trick costs them twenty minutes and does nothing at all to {c} and {d}.' },
      ] },
    ],
  },
};
