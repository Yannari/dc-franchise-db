// Voices keyed by the FINAL turn index (after the long cut rebuilt the entry: lines/index.js applies these last),
// written against the audit's work list (npm run audit:ch-voice; the turns airing most without the speaker's
// voice, 2026-10-16). Families: sharp (cruel, schemer, proud, bossy), soft (warm, earnest, emotional, anxious,
// flirty), loud (blunt, tough, competitive, chaotic), dry (calm, quiet, nerdy), odd (goofy, ditzy, theatrical).
// `cruel` is the villain's own take where the sharp one is too polite. Every variant means the same thing as the
// line: the next line still answers it.
export default {
  // ── the goodbye at the Arena ──
  'gb.f1': {
    1: { sharp: 'Get my friends down here. I have notes for them.', soft: 'Can my friends come down? Please? Just for a second?', loud: "Get down here, all of you! Come on!", dry: 'Can my friends come down for a minute? I would like to do this properly.', odd: "Can I get my people down here? I need a group hug. It's medical." },
    5: { sharp: "Don't you dare make me cry in front of these people.", soft: "Please don't. I'm going to cry, and I'll never stop.", loud: "Don't you dare! I'm not crying in front of TJ!", dry: "If I cry, TJ is going to make it a highlight.", odd: "If I cry, my mascara goes, and then it's a whole thing." },
    8: { sharp: "Win it. And don't let anybody in that house forget who sent me home.", cruel: "Win it. Step on whoever you have to. They'd do it to you.", soft: "Win it, okay? For me. One of you has to win it.", loud: "Win it! You hear me? One of you wins this thing!", dry: "Win it. One of you has to. There's enough of you left.", odd: "Win it, and buy me something nice with the money." },
    9: { sharp: "I came here to win, not to make friends. I made a few anyway. Annoying.", cruel: "I don't do friends. Turns out I did a couple. That's the part I'll be mad about on the plane.", soft: "I didn't come here to make friends. I made them anyway. Leaving them is so much worse than losing.", loud: "Losing I can handle. Leaving them behind is what's killing me.", dry: "I planned for losing. I didn't plan for missing people." },
  },
  'gb.f2': {
    1: { sharp: "I'll keep it short. {b}, you were the only person in that house worth talking to.", soft: "I just want to say thank you. To {b} especially. You kept me sane in there. You really did.", loud: "Thank you, {b}! You kept me sane in that house! Somebody had to!", dry: "Thank you to {b}, who kept me sane. It was a big job.", odd: "I'd like to thank {b}, my emotional support human." },
    2: { sharp: "You kept me sane. Don't take all the credit.", soft: "No, you kept me sane. Don't you dare flip it.", loud: "You kept ME sane! Don't flip it!", dry: "No, you're the one who kept me sane. Don't flip it." },
    5: { sharp: "Who am I supposed to complain to now?", soft: "I'm going to be so lost without you.", loud: "What am I supposed to do in there without you?", dry: "I'm going to be lost without you. That's not a figure of speech." },
    6: { sharp: "No, you're not. You're going to be angry, and you're going to use it.", soft: "No, you won't. You'll be angry, and that's good. Use it.", loud: "No! You're going to be angry! Use it!", dry: "You won't be lost. You'll be angry. Angry is more useful." },
    7: { sharp: "I lost. Fine. That's the deal. Leaving {b} with those people is the part I hate.", cruel: "I lost to somebody I'd beat on any other day. And now {b} is alone in a house full of snakes.", soft: "I lost in the Arena. That's the deal. But walking away from {b} is the part I wasn't ready for.", loud: "Losing stinks. Leaving {b} in there stinks more.", dry: "I knew the Arena could take me. I didn't account for how much leaving {b} would." },
  },
  'gb.f3': {
    1: { sharp: "You had it. You had it, and you let it go.", soft: "That was so close. You had it. You really had it.", loud: "That was SO close! You had it!", dry: "That was close. A few seconds, maybe." },
    2: { sharp: "Close is for people who lose.", cruel: "Close is what losers say on the way home.", soft: "Close doesn't count, though. Not in here.", loud: "Close doesn't get you anything!", dry: "Close gets you a plane ticket, apparently." },
    4: { sharp: "Look after each other. And don't trust anybody who hugged me tonight.", soft: "Look after each other, okay? Promise me. Don't let this house turn you on each other.", loud: "Look after each other! Don't let them split you up!", dry: "Look after each other. The house will try to turn you on each other. It's what it does." },
    7: { sharp: "I played well. Better than most of them. It ended badly. Both are true.", cruel: "I played better than half the people in that stand. That's the part that'll eat at me.", soft: "I'm proud of how I played. I'm not proud of how it ended. And that's okay.", loud: "I played hard! I lost hard! Both of those are true!", dry: "Good game, bad ending. It happens." },
  },
  'gb.f5': {
    1: { soft: "Just that I loved this. Even the bad days. I loved every single one of them.", odd: "Just that this was the best summer camp I've ever been kicked out of.", dry: "Just that I enjoyed it more than I expected. Even the bad days." },
    2: { sharp: "Stop. You'll make me cry, and I don't cry.", soft: "Stop it. You're going to set me off.", loud: "Stop! You're going to make me cry!" },
    5: { sharp: "This house is going to get so much meaner without you, and I'll be the one who has to live in it.", soft: "This house is going to be so much meaner without you.", loud: "It's going to be so mean in there without you!" },
    7: { soft: "I'm leaving with friends I'll have for the rest of my life. I know that sounds cheesy. I don't care.", odd: "I came for the money and left with friends. Terrible trade. Love it.", dry: "I'm leaving with friends I expect to keep. That's more than most people get out of this." },
  },
  'gb.f6': {
    1: { sharp: "Oh, I've got a few.", cruel: "I've been saving these.", soft: "Yeah. I'm sorry. I have to say something.", loud: "Yeah! Yeah, I've got a few!", dry: "I do, actually." },
    2: { sharp: "{target}, I hope you're comfortable. Everybody in this house knows what you did to get me here.", cruel: "{target}, take a good look. That's what you did. Everybody saw you do it, and they'll remember it at the vote.", soft: "{target}, I trusted you. And everybody in this house knows what you did to get me in here.", loud: "{target}! Everybody in this house knows what you did to get me in here!", dry: "{target}, I just want you to know that everybody knows what you did to get me in here." },
    5: { sharp: "I'm going. But you watch {target}. Every single day.", soft: "I'm going. But please, watch {target}. Promise me.", loud: "I'm going! But you watch {target}! Promise me!", dry: "I'm going. Just keep an eye on {target}. Promise me." },
    7: { sharp: "If I'm going home, I'm taking {target}'s sleep with me.", cruel: "I want {target} lying awake tonight. That's my parting gift.", soft: "I'm not proud of it. But {target} needed to hear it, and now everybody has.", loud: "If I'm going home, I'm going home loud! {target} doesn't get to sleep easy tonight!", dry: "I only needed one sentence. Now everybody in that house is looking at {target}." },
  },
  'gb.f7': {
    1: { sharp: "Listen to me. It was {target}. It was always {target}.", soft: "Please listen. It was {target}. It was {target} the whole time.", loud: "Listen! It was {target}! The whole time!", dry: "Listen carefully. It was {target}. All along." },
    3: { sharp: "Don't believe a word out of {target}'s mouth. Not one.", soft: "Please don't trust {target}. Not one word.", loud: "Don't trust a word {target} says! Not one!", dry: "Assume everything {target} tells you is a lie. It saves time." },
    6: { sharp: "I said it loud for one person. {target} heard every word.", soft: "I didn't want to make a scene. But {target} needed to hear it.", loud: "I said it loud on purpose! I wanted {target} to hear every word!", dry: "I said it loud so {target} would hear it. Everybody else hearing it was a bonus." },
  },
  // ── the alliance meeting and the vote talk ──
  'mt.u8': {
    1: { sharp: "Okay, we're all here. Let's not waste time. Who is it?", soft: "Okay, we're all here. So... who is it?", loud: "Okay, everybody's here! Who is it?", dry: "Everybody's here. Who is it?", odd: "Okay, secret club meeting is in session. Who is it?" },
    2: { sharp: "It's {target}. But go on, tell me what you all think.", cruel: "It's {target}. You can all agree with me now, or later.", soft: "I think it's {target}. But I really want to hear everybody first.", loud: "It's {target}! But go ahead, say what you think!", dry: "I think it's {target}. I'd like to hear everybody first." },
    6: { sharp: "Then it's {target}. And if anybody changes their mind tomorrow, I'll know.", cruel: "Then it's {target}. Nobody flips. If somebody flips, they're next.", soft: "Then it's {target}. Please, nobody change their mind tomorrow, okay?", loud: "Then it's {target}! Nobody changes their mind tomorrow! Got it?", dry: "Then it's {target}. If anybody has a problem, now's the time." },
    8: { sharp: "{a} asked everybody. Polite. I would have just told us.", soft: "I like that {a} asked everybody. It makes me feel like I actually matter in here.", loud: "{a} asked all of us! That never happens in here!", dry: "{a} asked everybody. Most people in here just give instructions." },
  },
  'mt.ux6': {
    7: { sharp: "Then somebody here has a big mouth, and I'll find out whose.", cruel: "Then somebody here has a big mouth, and they won't have it for long.", soft: "Then somebody here let it slip, and that would really hurt.", loud: "Then somebody's got a big mouth, and we'll find out who!", dry: "Then one of us talked. It won't be hard to work out who." },
    8: { sharp: "{a} runs {alliance} like a business. I'd run it better.", soft: "{a} runs {alliance} like a business. It's a little scary. But I feel safe.", loud: "{a} runs {alliance} like a boot camp! I love it!", dry: "{a} runs {alliance} like a business. I just wish there were snacks." },
  },
  'mt.ux2': {
    0: { sharp: "Fine. I'll say it, since none of you have the nerve. {target}.", cruel: "Since nobody here has a spine, I'll say it. {target}.", soft: "Okay. I'll say it first, so nobody else has to. {target}.", loud: "I'll say it! {target}!", dry: "I'll go first. {target}." },
    4: { sharp: "Well, now I'm the one who said it. You're welcome.", soft: "Well, now I've said it, so nobody else has to feel bad.", loud: "Now I said it! You're all welcome!", dry: "Now I've said it. You're welcome." },
    9: { sharp: "I like {alliance}. Somebody else always says the scary name, and I get the credit.", soft: "I like being in {alliance}. Somebody else always says the scary name first.", loud: "{alliance} works because somebody's got the guts to say the name! Usually not me, but still!", dry: "In {alliance}, somebody else always says the name first. It's a good system." },
  },
  'mt.ux4': {
    0: { sharp: "Before we start: who's been making promises to {target}?", cruel: "Before we start, who's been sneaking around with {target}? I'd like names.", soft: "Before we start... has anybody promised {target} anything?", loud: "Before we start! Who promised {target} something?", dry: "Before we start: has anybody promised {target} anything?" },
    7: { sharp: "Then it's {target}. And we smile at {target} until the vote.", cruel: "Then it's {target}. Be extra nice at breakfast. It's funnier that way.", soft: "Then it's {target}. And we're kind to {target} until the vote. It's the least we can do.", loud: "It's {target}! And everybody stays nice till the vote!", dry: "{target}, then. And we're nice to {target} until the vote." },
    8: { sharp: "Everybody promises everybody something in here. I just remember who keeps them.", soft: "Everybody promises everybody something in here. I just hope ours mean something.", loud: "Everybody makes promises in here! Keeping them is the hard part!", dry: "Everybody in this game promises everybody something. The trick is knowing which ones get kept." },
  },
  'mt.ux3': {
    5: { sharp: "Too easy. Somebody in here is lying.", soft: "That was too easy. Doesn't that worry anybody?", loud: "Too easy! Doesn't anybody else think that's weird?", dry: "Too easy. That usually means something." },
    6: { sharp: "It worries me. Easy votes have a way of turning on you.", soft: "It worries me a little. But I'd rather easy than a fight.", loud: "Easy's fine! I'll take easy!", dry: "A little. But I'd rather easy than a fight." },
    9: { sharp: "If six of us walk back together, the whole house knows. So we don't. It isn't hard.", soft: "If we all walk back together, everybody will know. So we have to be careful.", loud: "Six people walking back from the beach together? Everybody would know!", dry: "If six of us walk back from the beach together, the whole house knows we've got a plan. So we don't." },
  },
  // ── recruiting ──
  'rc.ax5': {
    0: { sharp: "I don't have time for small talk. {target}. Yes or no?", cruel: "I'm not here to be your friend. {target}. Yes or no?", soft: "I don't want to waste your time. {target}. Are you in?", loud: "Straight up: {target}. Yes or no?", dry: "Short version. {target}. Yes or no?" },
    4: { sharp: "Fine. {target} beats one of us in the final if we let {target} get there. Better?", soft: "Okay. If {target} gets to the final, one of us loses to {target}. Does that help?", loud: "Fine! {target} gets to the final, one of us loses! Better?", dry: "{target} is a threat in the final. Is that better?" },
    8: { sharp: "I'd have said yes without the speech. I just wanted to see if {a} could make one.", soft: "I would have said yes anyway. I just wanted to hear {a} explain it.", loud: "I was always saying yes! I just wanted a speech!", dry: "I'd have said yes without the speech. I wanted to see if {a} had one." },
  },
  'rc.ax2': {
    4: { sharp: "Fair. {target}. This week. I want your vote.", soft: "That's fair. It's {target}. This week. I'd really like your vote.", loud: "Fair! It's {target}, and I want your vote!", dry: "Fair. {target}, this week. I'd like your vote." },
    6: { sharp: "Nothing yet. That's the point. {target} is too good at being liked.", cruel: "Nothing. That's what scares me. Everybody loves {target}, and I can't stand it.", soft: "Nothing yet. But {target} is so easy to like, and that worries me.", loud: "Nothing! That's the problem! {target} is too likable!", dry: "Nothing yet. {target} is too good at being liked." },
    10: { sharp: "I don't need {b} to like me. I need {b} to say {target}.", cruel: "{b} can hate me all the way to the vote, as long as {b} says {target}.", soft: "I don't need {b} to like me. I'd like it. But I just need {b} to say {target}.", loud: "{b} doesn't have to like me! {b} just has to say {target}!", dry: "{b} doesn't have to like me. {b} just has to say {target}." },
  },
  'rc.a1': {
    4: { sharp: "That's the answer until you're in. I don't hand out names to people who might say no.", soft: "I'm sorry, that's all I can say until you're in. I can't name people to somebody who might say no.", loud: "That's what you get until you're in!", dry: "That's all you get until you're in. You hear names after." },
    6: { sharp: "Because {target} is working everybody at once, and sooner or later one of us pays for it.", soft: "Because {target} is talking to everybody, and sooner or later that's going to hurt one of us.", loud: "Because {target} is playing everybody! Sooner or later it lands on one of us!", dry: "Because {target} is working everybody at once. Eventually that lands on one of us." },
    9: { sharp: "I don't know who else is in. I don't like that. But saying no to the numbers is how you end up next.", soft: "I don't know who else is in, and that scares me a little. But saying no to a group that has the numbers is how you end up next.", loud: "I don't even know who's in! But saying no to the numbers? That's how you go next!", dry: "I don't know who else is in. But refusing a group with the numbers is how you end up next." },
  },
  // ── the house debate ──
  'hd.sx3': {
    1: { sharp: "Can we just be honest? We're all voting {b}.", cruel: "Let's stop pretending. It's {b}. Everybody knows it's {b}.", soft: "Can we just be honest with each other? I think we're all voting {b}.", loud: "Can we just say it? It's {b}!", dry: "To save time: we're all voting {b}." },
    4: { sharp: "I'm not voting {b}. I'm voting {alt}, and you should too.", soft: "I'm sorry, but I'm not voting {b}. I'm voting {alt}.", loud: "I'm not voting {b}! I'm voting {alt}!", dry: "I'm voting {alt}, not {b}." },
    8: { sharp: "{c} is the only one in this house with a working brain.", cruel: "{c} is the only person in this house who isn't a sheep.", soft: "{c} is the only one in this house who actually thought about it.", loud: "{c} is the only one using {c.posAdj} brain in here!", dry: "{c} is the only one in this house thinking for {c.posAdj}self." },
    9: { sharp: "One person stood up for me tonight. One. I'll remember the rest.", cruel: "One person stood up for me. Everybody else is on a list now.", soft: "I had one person stand up for me tonight. Just one. But it's a start.", loud: "One person! ONE! Stood up for me!", dry: "One person stood up for me tonight. It's not much, but it's a start." },
  },
  'hd.s4': {
    1: { sharp: "Before we all say {b} like sheep, let me make a case for somebody else.", soft: "Before we all just say {b}, can I please make a case for somebody else?", loud: "Wait! Before we all say {b}, hear me out!", dry: "Before we all say {b}, I'd like to make a case for somebody else." },
    5: { sharp: "I'm standing right here. Do go on.", soft: "I'm... standing right here, you know.", loud: "Hello? I'm standing right here!", dry: "I'm standing right here, for what it's worth." },
    8: { sharp: "{c} stood up for me. I'll remember that. And I'll remember everybody who didn't.", cruel: "{c} stood up for me. The rest of them just made my list for me.", soft: "{c} stood up for me. I'll never forget that. I'll remember who didn't, too.", loud: "{c} stood up for me! I won't forget it! I won't forget who didn't, either!", dry: "{c} stood up for me. I also saw everybody who stayed quiet." },
  },
  // ── power rankings ──
  'st.prx4': {
    2: { sharp: "Let me be clear. I didn't ask TJ to do that.", soft: "I just want to say one thing. I didn't ask TJ to do that, I promise.", loud: "One thing! I didn't ask TJ to do that!", dry: "I just want everybody to know I didn't ask TJ to do that." },
    7: { sharp: "Ten minutes ago they were all smiling at me. Then TJ read a list. Now I see who they really are.", soft: "Ten minutes ago we were all friends. Then TJ read a list, and now everybody needs to beat me.", loud: "We were all friends ten minutes ago! Then TJ read a list!", dry: "TJ read one list, and the whole house started looking at me differently." },
  },
  'st.pr4': {
    2: { sharp: "Don't get comfortable, anybody. This list changes every week, and so will you.", soft: "Don't get too comfortable, anybody. This list changes every week.", loud: "Nobody get comfortable! This list changes every week!", dry: "Don't get comfortable. The list changes weekly." },
    4: { sharp: "Last gets voted in because last is easy.", cruel: "Last gets voted in because nobody will miss them.", soft: "Last gets voted in, though. Because they're easy.", loud: "Last gets voted in! Easy target!", dry: "Last gets voted in because last is easy." },
    6: { sharp: "TJ's list doesn't vote. People do. And people love an easy name, so I won't be one.", soft: "TJ's list doesn't vote. People do. I just really hope I'm not the easy name.", loud: "TJ's list doesn't vote! People do! And I won't be easy!", dry: "TJ's list doesn't vote. People do, and people like an easy name. I'd better not be one." },
  },
  // ── after the vote ──
  'av.3': {
    2: { sharp: "Yeah. I didn't want to look at any of them.", cruel: "Yeah. If I stayed in there, I'd have said something I meant.", soft: "Yeah. I just couldn't be in there with all of them.", loud: "Yeah! I couldn't stand looking at them!", dry: "Yes. I didn't want to be in there with all of them." },
    4: { sharp: "I know. I just hate how easy it was for them.", cruel: "I know. I just want them all to watch me win.", soft: "I know. It just hurts how easy it was for them.", loud: "I know! It was just so easy for them!", dry: "I know. What bothers me is how easy it was for them." },
    5: { sharp: "{count} votes. They didn't even argue about it. I'm going to remember that.", cruel: "{count} votes. Every one of them is going to regret it.", soft: "{count} votes. They didn't even argue about it. That's the part that hurts.", loud: "{count} votes! Not even an argument!", dry: "{count} votes, and nobody even argued. That tells me a lot." },
  },
  // ── the Arena ──
  'an.wx4': {
    6: { sharp: "Whoever voted me in tonight, I hope they were watching. That's what happens.", cruel: "Whoever voted me in tonight: that was a preview. You're next.", soft: "Whoever voted me in tonight... I hope they saw that. I'm still here.", loud: "Whoever voted me in, I hope you were watching! That's what happens!", dry: "Whoever voted me in tonight knows better now." },
  },
  'rt.c3': {
    7: { sharp: "{gone} picked me because {gone} thought I was the easy one. Now everybody knows better.", cruel: "{gone} thought I was easy. {gone} is on a plane. I'm in the villa.", soft: "{gone} picked me because {gone} thought I was the easy one. I'm so glad I proved {gone} wrong.", loud: "{gone} thought I was easy! Now everybody knows I'm not!", dry: "{gone} thought I'd be easy. {gone} found out I wasn't." },
  },
  'rt.cx1': {
    2: { sharp: "{gone} picked me because {gone} thought I'd be easy.", cruel: "{gone} thought I'd be easy. Look how that went.", soft: "{gone} picked me because {gone} thought I'd be easy. I guess I wasn't.", loud: "{gone} thought I'd be easy!", dry: "{gone} picked me because {gone} thought I'd be easy. That was a mistake." },
    7: { sharp: "{gone} chose me. Out of everybody. Worst decision {gone} made in this game.", cruel: "{gone} chose me out of everybody. I hope {gone} thinks about that on the plane.", soft: "{gone} chose me out of everybody. I almost feel bad. Almost.", loud: "{gone} chose ME! Worst decision of the season!", dry: "{gone} chose me out of everybody. That was the wrong choice." },
  },
  // ── pick-guess and the Arena eve ──
  'guess.x3': {
    6: { sharp: "Whoever it is, I hope they're ready. I'm not saying I'm ready. I'm saying I hope they are.", soft: "Whoever it is, I hope they're ready. I'm not ready. I just hope they are.", loud: "Whoever it is, they'd better be ready!", dry: "Whoever it is, I hope they're ready. I'm not saying I am." },
    8: { sharp: "I trained twice today. If {target} says my name, {target} will regret it.", soft: "I trained this morning and this afternoon. If {target} says my name, at least I tried.", loud: "I trained twice today! If {target} says my name, bring it!", dry: "I trained twice today. If {target} picks me, my arms will at least be tired for a reason." },
  },
  // ── injuries ──
  'st.ik1': {
    5: { sharp: "It hurts more than I'm showing. If anybody sees it, I'm the easiest name on the board. So they won't.", soft: "It hurts more than I'm letting on. But if anybody in that house thinks I'm hurt, I'm the easiest name on the board.", loud: "It hurts! But nobody in that house is going to know it!", dry: "It hurts more than I'm letting on. If people can see I'm hurt, I'm the easy vote." },
  },
  'st.ik3': {
    5: { sharp: "Nobody in here feels sorry for you when you're hurt. They smell blood. I know, because I do.", cruel: "When somebody's hurt in here, I don't feel sorry for them. I start counting votes. So will they.", soft: "The last thing you want in here is people seeing you hurt. They don't feel sorry for you. They smell blood.", loud: "Nobody in here feels sorry for you when you're hurt! They smell blood!", dry: "If you look hurt in here, people start counting votes." },
  },
  // ── the vet who won't help ──
  'vd.x3': {
    3: { sharp: "Why would I tell you that? So you can practice?", cruel: "Why would I tell you anything? So you can beat me with it?", loud: "Why would I tell you that? So you can practice?", dry: "Why would I tell you that? So you can practice?" },
    5: { sharp: "Nothing's just conversation in here. You'll learn that, and I bet you learn it the hard way.", cruel: "Nothing's just conversation in here. Rookies learn that right before they go home.", loud: "Nothing's just conversation in here! Learn that fast!", dry: "Nothing in here is just conversation. You'll learn." },
  },
  // ── bunk whispers ──
  'bw2.s2': {
    0: { sharp: "Psst. Did you see who they were all sucking up to after dinner?", soft: "Psst. Are you awake? Did you see who they were all talking to after dinner?", loud: "Psst! Did you see who they were all talking to after dinner?", dry: "Did you notice who they were all talking to after dinner?" },
    2: { sharp: "We get to them first. Tomorrow, before anybody else does.", soft: "We should talk to them first. Tomorrow, before anybody else does. Okay?", loud: "We talk to them first thing tomorrow! Before anybody else!", dry: "We talk to them first. Early, before anybody else does." },
    5: { sharp: "Nobody can hear you in here if you whisper. And if they can, I want them to.", soft: "Nobody can hear you in here if you whisper. At least, that's what I tell myself so I can sleep.", loud: "Whispering in the bunks is the only quiet thing I've done all week.", dry: "Nobody can hear you in here if you whisper. At least, I hope they can't." },
  },
};
