// pm/lines/voices/batch14.js — see index.js. Every tag on each line (batch4's rule).
// Shared replies, the replies inside variant blocks, loyalty turn-downs (whoever says
// no still says no in every voice), friendship friction, couple chat.
const T = (text, v) => ['*', text, v];

export const BATCH14 = [
  T("I don't.", {
    earnest: "I don't.", warm: "I don't.", calm: "I don't.", quiet: "I don't.", dry: "I don't.", nerdy: "I don't.",
    loud: "I don't!", blunt: "I don't.", tough: "I don't.", competitive: "I don't.", chaotic: "I don't! I don't!", schemer: "I don't.",
    cruel: "I don't.", bossy: "I don't.", proud: "I don't.", flirty: "I don't.",
    anxious: "I don't. I don't think.", goofy: "I don't. Not a bit.", ditzy: "I don't?", theatrical: "I do not!" }),
  T("Fair.", {
    earnest: "Fair.", warm: "Fair enough.", calm: "Fair.", quiet: "Fair.", dry: "Fair.", nerdy: "That's fair.",
    loud: "Fair!", blunt: "Fair.", tough: "Fair.", competitive: "Fair.", chaotic: "Fair! Very fair!", schemer: "Fair.",
    cruel: "Fair.", bossy: "Fair.", proud: "Fair.", flirty: "Fair.",
    anxious: "Fair. Sorry.", goofy: "Fair. Very fair.", ditzy: "Fair!", theatrical: "Fair!" }),
  T("Then stop talking.", {
    earnest: "Then stop talking.", warm: "Then stop talking.", calm: "Then stop talking.", quiet: "Stop talking.", dry: "Then stop talking.", nerdy: "Then stop talking.",
    loud: "Then stop talking!", blunt: "Stop talking.", tough: "Stop talking.", competitive: "Then stop talking.", chaotic: "Stop talking! Now!", schemer: "Then stop talking.",
    cruel: "Then stop talking.", bossy: "Then stop talking.", proud: "Then stop talking.", flirty: "Then stop talking.",
    anxious: "Then stop talking?", goofy: "Then stop talking. Shh.", ditzy: "Then stop talking!", theatrical: "Then stop talking!" }),
  T("…Not really.", {
    earnest: "…Not really.", warm: "…Not really.", calm: "…Not really.", quiet: "…No.", dry: "…Not really.", nerdy: "…Not really, no.",
    loud: "…Not really!", blunt: "…No.", tough: "…No.", competitive: "…Not really.", chaotic: "…No! Not really!", schemer: "…Not really.",
    cruel: "…Not really.", bossy: "…Not really.", proud: "…Not really.", flirty: "…Not really.",
    anxious: "…Not really. No.", goofy: "…Not really. Not even slightly.", ditzy: "…Not really?", theatrical: "…Not really!" }),
  T("Don't go anywhere.", {
    earnest: "Don't go anywhere.", warm: "Don't go anywhere. Stay.", calm: "Don't go anywhere.", quiet: "Stay.", dry: "Don't go anywhere.", nerdy: "Don't go anywhere.",
    loud: "Don't go anywhere!", blunt: "Stay.", tough: "Stay.", competitive: "Don't go anywhere.", chaotic: "Don't go! Stay! Anywhere!", schemer: "Don't go anywhere.",
    cruel: "Don't go anywhere.", bossy: "Don't go anywhere.", proud: "Don't go anywhere.", flirty: "Don't go anywhere.",
    anxious: "Don't go anywhere. Please.", goofy: "Don't go anywhere. Glue yourself here.", ditzy: "Don't go anywhere!", theatrical: "Don't go anywhere!" }),
  T("You.", {
    earnest: "You.", warm: "You.", calm: "You.", quiet: "You.", dry: "You.", nerdy: "You.",
    loud: "You!", blunt: "You.", tough: "You.", competitive: "You.", chaotic: "You! Obviously!", schemer: "You.",
    cruel: "You.", bossy: "You.", proud: "You.", flirty: "You.",
    anxious: "You.", goofy: "You. Obviously.", ditzy: "You!", theatrical: "You!" }),
  T("How did you know?", {
    earnest: "How did you know?", warm: "How did you know?", calm: "How did you know?", quiet: "How'd you know?", dry: "How did you know?", nerdy: "How did you know that?",
    loud: "How did you know?", blunt: "How'd you know?", tough: "How'd you know?", competitive: "How did you know?", chaotic: "How?! How did you know?!", schemer: "How did you know?",
    cruel: "How did you know? Who told you?", bossy: "How did you know?", proud: "How did you know?", flirty: "How did you know?",
    anxious: "How did you know? Who else knows?", goofy: "How did you know? Are you psychic?", ditzy: "How did you know?", theatrical: "How did you know?!" }),
  T("Stay out of it.", {
    earnest: "Stay out of it.", warm: "Stay out of it. Please.", calm: "Stay out of it.", quiet: "Stay out of it.", dry: "Stay out of it.", nerdy: "Stay out of it.",
    loud: "Stay out of it!", blunt: "Stay out of it.", tough: "Stay out of it.", competitive: "Stay out of it.", chaotic: "Out! Stay out of it!", schemer: "Stay out of it.",
    cruel: "Stay out of it. It's not your business.", bossy: "Stay out of it.", proud: "Stay out of it.", flirty: "Stay out of it.",
    anxious: "Stay out of it. Please.", goofy: "Stay out of it. Private drama.", ditzy: "Stay out of it!", theatrical: "Stay out of it!" }),
  T("No reason.", {
    earnest: "No reason.", warm: "No reason.", calm: "No reason.", quiet: "No reason.", dry: "No reason.", nerdy: "No particular reason.",
    loud: "No reason!", blunt: "No reason.", tough: "No reason.", competitive: "No reason.", chaotic: "No reason! None!", schemer: "No reason.",
    cruel: "No reason.", bossy: "No reason.", proud: "No reason.", flirty: "No reason.",
    anxious: "No reason. Why?", goofy: "No reason. Suspicious, I know.", ditzy: "No reason!", theatrical: "No reason!" }),
  T("Can I be honest with you?", {
    earnest: "Can I be honest with you?", warm: "Can I be honest with you?", calm: "Can I be honest?", quiet: "Can I be honest?", dry: "Can I be honest with you?", nerdy: "Can I be completely honest with you?",
    loud: "Can I be honest with you?", blunt: "Honestly?", tough: "Straight up?", competitive: "Can I be honest with you?", chaotic: "Can I be honest?! Can I?!", schemer: "Can I be honest with you?",
    cruel: "Can I be honest with you? You won't like it.", bossy: "I'm going to be honest with you.", proud: "Can I be honest with you?", flirty: "Can I be honest with you?",
    anxious: "Can I be honest with you? Don't be upset.", goofy: "Can I be honest with you? Brutally?", ditzy: "Can I be honest?", theatrical: "May I be honest with you?" }),
  T("I'm flattered. Honestly.", {
    earnest: "I'm flattered. Honestly.", warm: "I'm flattered. Honestly. That's lovely.", calm: "I'm flattered.", quiet: "Flattered.", dry: "I'm flattered. Honestly.", nerdy: "I'm genuinely flattered.",
    loud: "I'm flattered! Honestly!", blunt: "Flattered.", tough: "Flattered.", competitive: "I'm flattered.", chaotic: "Flattered! So flattered!", schemer: "I'm flattered. Honestly.",
    cruel: "I'm flattered. Obviously.", bossy: "I'm flattered.", proud: "I'm flattered. Understandably.", flirty: "I'm flattered. Honestly.",
    anxious: "I'm flattered. Honestly. Sorry.", goofy: "I'm flattered. Blushing.", ditzy: "I'm flattered!", theatrical: "I'm flattered!" }),
  T("Is it that obvious?", {
    earnest: "Is it that obvious?", warm: "Is it that obvious?", calm: "Is it that obvious?", quiet: "Obvious?", dry: "Is it that obvious?", nerdy: "Is it that obvious?",
    loud: "Is it that obvious?", blunt: "Obvious?", tough: "That obvious?", competitive: "Is it that obvious?", chaotic: "Is it obvious?! Really?!", schemer: "Is it that obvious?",
    cruel: "Is it that obvious?", bossy: "Is it that obvious?", proud: "Is it that obvious?", flirty: "Is it that obvious?",
    anxious: "Is it that obvious? Oh no.", goofy: "Is it that obvious? Neon sign?", ditzy: "Is it obvious?", theatrical: "Is it that obvious?" }),
  T("Closer.", {
    earnest: "Closer.", warm: "Closer.", calm: "Closer.", quiet: "Closer.", dry: "Closer.", nerdy: "Closer.",
    loud: "Closer!", blunt: "Closer.", tough: "Closer.", competitive: "Closer.", chaotic: "Closer! Closer!", schemer: "Closer.",
    cruel: "Closer.", bossy: "Closer.", proud: "Closer.", flirty: "Come closer.",
    anxious: "Closer?", goofy: "Closer. Closer still.", ditzy: "Closer?", theatrical: "Closer!" }),
  T("I'm getting there.", {
    earnest: "I'm getting there.", warm: "I'm getting there.", calm: "I'm getting there.", quiet: "Getting there.", dry: "I'm getting there.", nerdy: "I'm getting there. Slowly.",
    loud: "I'm getting there!", blunt: "Getting there.", tough: "Getting there.", competitive: "I'm getting there.", chaotic: "Getting there! Ish!", schemer: "I'm getting there.",
    cruel: "I'm getting there.", bossy: "I'm getting there.", proud: "I'm getting there.", flirty: "I'm getting there.",
    anxious: "I'm getting there. I think.", goofy: "I'm getting there. Loading.", ditzy: "I'm getting there!", theatrical: "I'm getting there!" }),
  // ── replies inside variant blocks ──
  T("{~Yeah}. You look happy.", {
    earnest: "{~Yeah}. You look happy.", warm: "{~Yeah}. You look so happy.", calm: "You look happy.", quiet: "You look happy.", dry: "{~Yeah}. You look happy.", nerdy: "{~Yeah}. You look happy. Genuinely.",
    loud: "{~Yeah}! You look so happy!", blunt: "You look happy.", tough: "You look happy.", competitive: "{~Yeah}. Happiest couple in here.", chaotic: "Happy! You look happy!", schemer: "{~Yeah}. You look happy.",
    cruel: "{~Yeah}. You look happy. Sickeningly.", bossy: "You look happy. Stop worrying.", proud: "{~Yeah}. You look happy.", flirty: "{~Yeah}. You look happy.",
    anxious: "{~Yeah}. You look happy. I think so.", goofy: "{~Yeah}. You look happy. Gross, but happy.", ditzy: "You look happy!", theatrical: "You look radiantly happy!" }),
  T("I wouldn't say it if I didn't think it.", {
    earnest: "I wouldn't say it if I didn't think it.", warm: "I wouldn't say it if I didn't mean it.", calm: "I wouldn't say it otherwise.", quiet: "I mean it.", dry: "I wouldn't say it if I didn't think it.", nerdy: "I wouldn't say it if I didn't think it.",
    loud: "I wouldn't say it if I didn't think it!", blunt: "I don't say things I don't mean.", tough: "I don't lie.", competitive: "I wouldn't say it if I didn't think it.", chaotic: "I wouldn't say it! If I didn't! Think it!", schemer: "I wouldn't say it if I didn't think it.",
    cruel: "I wouldn't say it if I didn't think it. Trust me, I'd tell you.", bossy: "I wouldn't say it if I didn't think it.", proud: "I wouldn't say it if I didn't think it.", flirty: "I wouldn't say it if I didn't think it.",
    anxious: "I wouldn't say it if I didn't think it. Honestly.", goofy: "I wouldn't say it if I didn't think it. Brain to mouth.", ditzy: "I wouldn't say it if I didn't think it!", theatrical: "I'd never say it if I didn't believe it!" }),
  T("Yeah, I do. I think you'd see it if you stopped overthinking.", {
    earnest: "Yeah, I do. I think you'd see it if you stopped overthinking.", warm: "Yeah, I do. You'd see it if you stopped overthinking.", calm: "I do. You'd see it if you stopped overthinking.", quiet: "I do. Stop overthinking.",
    dry: "Yeah. You'd see it if you stopped overthinking.", nerdy: "Yes. All the signs are there. You'd see them if you stopped overthinking.", loud: "Yeah, I do! Stop overthinking!", blunt: "Yes. Stop overthinking.",
    tough: "Yeah. Stop overthinking.", competitive: "Yeah, I do. Stop overthinking it.", chaotic: "Yes! Obviously! Stop overthinking!", schemer: "Yeah, I do. I've watched. You'd see it too if you stopped overthinking.",
    cruel: "Yeah, I do. Stop overthinking, it's boring.", bossy: "Yes. Stop overthinking.", proud: "Yeah, I do. Trust me, I'm good at reading people.", flirty: "Yeah, I do. You'd see it if you stopped overthinking.",
    anxious: "Yeah, I do. I think you'd see it if you stopped overthinking. I overthink too.", goofy: "Yeah, I do. Stop overthinking. Brain off.", ditzy: "Yeah! I think so!", theatrical: "Yes! You'd see it if you stopped overthinking!" }),
  T("Not yet. I'm not going to push it.", {
    earnest: "Not yet. I'm not going to push it.", warm: "Not yet. I don't want to push it.", calm: "Not yet. No pushing.", quiet: "Not yet.",
    dry: "Not yet. I'm not pushing it.", nerdy: "Not yet. I'm not going to push it.", loud: "Not yet! I'm not pushing it!", blunt: "Not yet.",
    tough: "Not yet.", competitive: "Not yet. It'll happen.", chaotic: "Not yet! Not pushing! Not!", schemer: "Not yet. I'm not going to push it.",
    cruel: "Not yet. Mind your own.", bossy: "Not yet. It'll happen when I decide.", proud: "Not yet. {pb} will get there.", flirty: "Not yet. I'm not going to push it.",
    anxious: "Not yet. I'm not going to push it. Should I?", goofy: "Not yet. I'm not going to push it. Patience.", ditzy: "Not yet!", theatrical: "Not yet! I'll not push it!" }),
  T("You're allowed to push it a {~little} bit.", {
    earnest: "You're allowed to push it a {~little} bit.", warm: "You're allowed to push it a {~little} bit.", calm: "You can push a {~little}.", quiet: "Push a {~little}.",
    dry: "You're allowed to push it a {~little} bit.", nerdy: "You're allowed to push it a {~little} bit.", loud: "You're allowed to push it a {~little} bit!", blunt: "Push it a bit.",
    tough: "Push it a bit.", competitive: "Push it a {~little} bit. Go on.", chaotic: "Push it! A {~little}! Go on!", schemer: "You're allowed to push it a {~little} bit.",
    cruel: "Push it a {~little} bit. You're too soft.", bossy: "Push it a {~little} bit.", proud: "You're allowed to push it a {~little} bit.", flirty: "You're allowed to push it a {~little} bit.",
    anxious: "You're allowed to push it a {~little} bit. Gently.", goofy: "You're allowed to push it a {~little} bit. Little nudge.", ditzy: "You can push it a {~little}!", theatrical: "You may push it a {~little} bit!" }),
  T("I'm not laughing. I'm {~buzzing} for you.", {
    earnest: "I'm not laughing. I'm {~buzzing} for you.", warm: "I'm not laughing. I'm so {~buzzing} for you.", calm: "Not laughing. {~Buzzing} for you.", quiet: "{~Buzzing} for you.",
    dry: "I'm not laughing. I'm {~buzzing} for you.", nerdy: "I'm not laughing. I'm {~buzzing} for you.", loud: "I'm not laughing! I'm {~buzzing} for you!", blunt: "Not laughing. {~Buzzing}.",
    tough: "Not laughing. {~Buzzing} for you.", competitive: "I'm not laughing. I'm {~buzzing} for you.", chaotic: "Not laughing! {~Buzzing}! For you!", schemer: "I'm not laughing. I'm {~buzzing} for you.",
    cruel: "I'm not laughing. I'm {~buzzing} for you. Surprisingly.", bossy: "I'm not laughing. I'm {~buzzing} for you.", proud: "I'm not laughing. I'm {~buzzing} for you.", flirty: "I'm not laughing. I'm {~buzzing} for you.",
    anxious: "I'm not laughing. I'm {~buzzing} for you.", goofy: "I'm not laughing. I'm {~buzzing} for you. Little bit laughing.", ditzy: "I'm not laughing! I'm {~buzzing}!", theatrical: "I'm not laughing! I'm {~buzzing} for you!" }),
  T("They think you're funny, and they think you're a good friend. Because you are.", {
    earnest: "They think you're funny, and they think you're a good friend. Because you are.", warm: "They think you're funny, and a good friend. Because you are.", calm: "Funny, and a good friend. Because you are.", quiet: "Funny. A good friend.",
    dry: "Funny. Good friend. Accurate, for once.", nerdy: "They think you're funny, and a good friend. Because you are.", loud: "They think you're funny! And a good friend!", blunt: "Funny. Good friend. True.",
    tough: "Funny. Good friend.", competitive: "They think you're funny and a good friend. Probably winning.", chaotic: "Funny! Good friend! All of it!", schemer: "They think you're funny, and they think you're a good friend. Because you are.",
    cruel: "They think you're funny and a good friend. They're right, for once.", bossy: "Funny, and a good friend. Because you are.", proud: "They think you're funny, and a good friend. You learned from me.", flirty: "They think you're funny, and they think you're a good friend. Because you are.",
    anxious: "They think you're funny, and a good friend. I'm sure of it.", goofy: "They think you're funny and a good friend. And slightly mad.", ditzy: "They think you're funny! And a good friend!", theatrical: "They adore you! Funny, loyal, wonderful!" }),
  T("{~Yeah}. Really nice.", {
    earnest: "{~Yeah}. Really nice.", warm: "{~Yeah}. Really nice.", calm: "Really nice.", quiet: "Nice.", dry: "{~Yeah}. Really nice.", nerdy: "{~Yeah}. Really nice.",
    loud: "{~Yeah}! Really nice!", blunt: "Yes. Nice.", tough: "Yeah. Nice.", competitive: "{~Yeah}. Really nice.", chaotic: "Nice! Really nice!", schemer: "{~Yeah}. Really nice.",
    cruel: "{~Yeah}. Really nice.", bossy: "{~Yeah}. Really nice.", proud: "{~Yeah}. Really nice. As {pb} should be.", flirty: "{~Yeah}. Really nice.",
    anxious: "{~Yeah}. Really nice. I think.", goofy: "{~Yeah}. Really nice. Suspiciously nice.", ditzy: "Really nice!", theatrical: "Wonderfully nice!" }),
  T("Good. Because I was ready to have a word.", {
    earnest: "Good. Because I was ready to have a word.", warm: "Good. Because I'd have had a word.", calm: "Good. I'd have had a word.", quiet: "Good.",
    dry: "Good. I was ready to have a word.", nerdy: "Good. I'd prepared a word.", loud: "Good! Because I was ready to have a word!", blunt: "Good. I'd have had a word.",
    tough: "Good. Or I'd have a word.", competitive: "Good. Because I was ready to have a word.", chaotic: "Good! I was ready! A word! Several!", schemer: "Good. Because I was ready to have a word.",
    cruel: "Good. Because I'd have made {pb} regret it.", bossy: "Good. I'd have had a word.", proud: "Good. Because I was ready to have a word.", flirty: "Good. Because I was ready to have a word.",
    anxious: "Good. Because I was worried.", goofy: "Good. Because I was ready to have a word. Several words.", ditzy: "Good!", theatrical: "Good! I was ready to have words!" }),
  T("There's not much to tell. It's nice. It's easy.", {
    earnest: "There's not much to tell. It's nice. It's easy.", warm: "There's not much to tell. It's nice. It's easy.", calm: "Not much to tell. It's easy.", quiet: "Nice. Easy.",
    dry: "Not much to tell. It's nice. It's easy.", nerdy: "There's not much to tell. It's nice. It's easy.", loud: "Not much to tell! It's nice! It's easy!", blunt: "Nice. Easy.",
    tough: "Nice. Easy.", competitive: "Not much to tell. It's nice. It's easy.", chaotic: "Not much! Nice! Easy!", schemer: "There's not much to tell. It's nice. It's easy.",
    cruel: "Not much to tell. It's fine.", bossy: "Not much to tell. It's nice. It's easy.", proud: "There's not much to tell. It's nice. It's easy.", flirty: "There's not much to tell. It's nice. It's easy.",
    anxious: "There's not much to tell. It's nice. It's easy. I think.", goofy: "Not much to tell. It's nice. It's easy. Boring, really.", ditzy: "Not much! It's nice!", theatrical: "Not much to tell! It's nice! It's easy!" }),
  T("Nice and easy is good.", {
    earnest: "Nice and easy is good.", warm: "Nice and easy is good.", calm: "Nice and easy is good.", quiet: "That's good.",
    dry: "Nice and easy is good.", nerdy: "Nice and easy is good.", loud: "Nice and easy is good!", blunt: "That's good.",
    tough: "That's good.", competitive: "Nice and easy is good.", chaotic: "Nice and easy! Good!", schemer: "Nice and easy is good.",
    cruel: "Nice and easy is good. Boring, though.", bossy: "Nice and easy is good.", proud: "Nice and easy is good.", flirty: "Nice and easy is good.",
    anxious: "Nice and easy is good. Isn't it?", goofy: "Nice and easy is good. No drama.", ditzy: "Nice and easy is good!", theatrical: "Nice and easy is good!" }),
  T("Is it, though? I keep waiting for the sparks.", {
    earnest: "Is it, though? I keep waiting for the sparks.", warm: "Is it, though? I keep waiting for the sparks.", calm: "Is it? I'm waiting for sparks.", quiet: "No sparks yet.",
    dry: "Is it, though? Still waiting for sparks.", nerdy: "Is it, though? I keep waiting for the sparks.", loud: "Is it, though?! Where are the sparks?", blunt: "No sparks.",
    tough: "No sparks yet.", competitive: "Is it? I want the sparks.", chaotic: "Is it?! Where are the sparks?! I want sparks!", schemer: "Is it, though? I keep waiting for the sparks.",
    cruel: "Is it, though? No sparks. Nothing.", bossy: "Is it? I want sparks.", proud: "Is it, though? I deserve sparks.", flirty: "Is it, though? I keep waiting for the sparks.",
    anxious: "Is it, though? I keep waiting for the sparks. What if they never come?", goofy: "Is it, though? I keep waiting for the sparks. Still waiting.", ditzy: "Is it? Where are the sparks?", theatrical: "Is it, though? Where are the fireworks?" }),
  T("{~Mate}, I'm with {pb}. I'm not making a move on anyone.", {
    earnest: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.", warm: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.", calm: "I'm with {pb}. No moves.", quiet: "I'm with {pb}.",
    dry: "{~Mate}, I'm with {pb}. No moves.", nerdy: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.", loud: "{~Mate}! I'm with {pb}! No moves!", blunt: "I'm with {pb}. No.",
    tough: "I'm with {pb}. No moves.", competitive: "{~Mate}, I'm with {pb}. I've already won.", chaotic: "{~Mate}! I'm with {pb}! No moves! None!", schemer: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.",
    cruel: "{~Mate}, I'm with {pb}. Keep up.", bossy: "{~Mate}, I'm with {pb}.", proud: "{~Mate}, I'm with {pb}. Why would I?", flirty: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.",
    anxious: "{~Mate}, I'm with {pb}. I'm not making a move on anyone.", goofy: "{~Mate}, I'm with {pb}. Retired from moves.", ditzy: "{~Mate}, I'm with {pb}!", theatrical: "{~Mate}! I'm with {pb}!" }),
  T("Just checking.", {
    earnest: "Just checking.", warm: "Just checking.", calm: "Just checking.", quiet: "Just checking.", dry: "Just checking.", nerdy: "Just checking.",
    loud: "Just checking!", blunt: "Checking.", tough: "Checking.", competitive: "Just checking.", chaotic: "Just checking! Checking!", schemer: "Just checking.",
    cruel: "Just checking.", bossy: "Just checking.", proud: "Just checking.", flirty: "Just checking.",
    anxious: "Just checking. Sorry.", goofy: "Just checking. Routine.", ditzy: "Just checking!", theatrical: "Just checking!" }),
  // ── loyalty and couple chat ──
  T("I'd know. That's the whole point.", {
    earnest: "I'd know. That's the whole point.", warm: "I'd know. That's the whole point.", calm: "I'd know.", quiet: "I'd know.", dry: "I'd know. That's the point.", nerdy: "I'd know. That's the whole point.",
    loud: "I'd know! That's the whole point!", blunt: "I'd know.", tough: "I'd know.", competitive: "I'd know.", chaotic: "I'd know! That's the point!", schemer: "I'd know. That's the whole point.",
    cruel: "I'd know. And so would you.", bossy: "I'd know. That's the point.", proud: "I'd know. And I don't do that.", flirty: "I'd know. That's the whole point.",
    anxious: "I'd know. I couldn't live with it.", goofy: "I'd know. My conscience is loud.", ditzy: "I'd know!", theatrical: "I would know! That's the point!" }),
  T("Right. I'm going to get changed.", {
    earnest: "Right. I'm going to get changed.", warm: "Right. I'm going to get changed.", calm: "Getting changed.", quiet: "Getting changed.", dry: "Right. Getting changed.", nerdy: "Right. I'm going to get changed.",
    loud: "Right! Getting changed!", blunt: "Getting changed.", tough: "Getting changed.", competitive: "Right. Getting changed. Watch this.", chaotic: "Getting changed! Bye!", schemer: "Right. I'm going to get changed.",
    cruel: "Right. Getting changed.", bossy: "Right. I'm getting changed.", proud: "Right. I'm going to get changed. Prepare yourself.", flirty: "Right. I'm going to get changed.",
    anxious: "Right. I'm going to get changed. I'm late.", goofy: "Right. I'm going to get changed. Costume change.", ditzy: "Getting changed!", theatrical: "I must change!" }),
  T("Can you stop giving me advice I didn't ask for?", {
    earnest: "Can you stop giving me advice I didn't ask for?", warm: "Can you stop giving me advice I didn't ask for?", calm: "Can you stop with the advice?", quiet: "Stop with the advice.", dry: "Can you stop with the advice I didn't ask for?", nerdy: "Can you stop giving me advice I didn't ask for?",
    loud: "Can you stop giving me advice I didn't ask for?", blunt: "Stop with the advice.", tough: "Stop with the advice.", competitive: "Stop giving me advice I didn't ask for.", chaotic: "Stop! Advice! I didn't ask!", schemer: "Can you stop giving me advice I didn't ask for?",
    cruel: "Can you stop giving me advice? You're not good at it.", bossy: "Stop giving me advice I didn't ask for.", proud: "Can you stop giving me advice? I don't need it.", flirty: "Can you stop giving me advice I didn't ask for?",
    anxious: "Can you stop giving me advice I didn't ask for? Sorry.", goofy: "Can you stop giving me advice I didn't ask for? Unsubscribe.", ditzy: "Can you stop with the advice?", theatrical: "Enough unasked-for advice!" }),
  T("I was trying to help.", {
    earnest: "I was trying to help.", warm: "I was trying to help. I'm sorry.", calm: "I was trying to help.", quiet: "I was helping.", dry: "I was trying to help.", nerdy: "I was trying to help.",
    loud: "I was trying to help!", blunt: "I was helping.", tough: "I was helping.", competitive: "I was trying to help.", chaotic: "I was helping! Trying!", schemer: "I was trying to help.",
    cruel: "I was trying to help. Clearly wasted.", bossy: "I was trying to help.", proud: "I was trying to help. My advice is good.", flirty: "I was trying to help.",
    anxious: "I was trying to help. I'm sorry.", goofy: "I was trying to help. Helpful-ish.", ditzy: "I was trying to help!", theatrical: "I was only trying to help!" }),
  T("I know. It's not helping.", {
    earnest: "I know. It's not helping.", warm: "I know. It's not helping, though.", calm: "I know. It's not helping.", quiet: "Not helping.", dry: "I know. It's not helping.", nerdy: "I know. It's not helping.",
    loud: "I know! It's not helping!", blunt: "Not helping.", tough: "Not helping.", competitive: "I know. It's not helping.", chaotic: "I know! Not helping!", schemer: "I know. It's not helping.",
    cruel: "I know. It's not helping. At all.", bossy: "I know. It's not helping.", proud: "I know. It's not helping.", flirty: "I know. It's not helping.",
    anxious: "I know. It's not helping. Sorry.", goofy: "I know. It's not helping. Zero help.", ditzy: "I know! Not helping!", theatrical: "I know! It's not helping!" }),
  T("Okay. I'll stay out of it.", {
    earnest: "Okay. I'll stay out of it.", warm: "Okay. I'll stay out of it. I'm here if you need me.", calm: "Okay. I'll stay out of it.", quiet: "Okay.", dry: "Okay. I'll stay out of it.", nerdy: "Okay. I'll stay out of it.",
    loud: "Okay! I'll stay out of it!", blunt: "Fine.", tough: "Fine. I'm out.", competitive: "Okay. I'll stay out of it.", chaotic: "Okay! Out! Staying out!", schemer: "Okay. I'll stay out of it.",
    cruel: "Fine. Good luck without me.", bossy: "Okay. I'll stay out of it.", proud: "Okay. I'll stay out of it.", flirty: "Okay. I'll stay out of it.",
    anxious: "Okay. I'll stay out of it. Sorry.", goofy: "Okay. I'll stay out of it. Zipping it.", ditzy: "Okay! I'll stay out of it!", theatrical: "Very well! I'll stay out of it!" }),
  T("Can you do my back? I can't reach.", {
    earnest: "Can you do my back? I can't reach.", warm: "Can you do my back? I can't reach.", calm: "Do my back?", quiet: "Do my back?", dry: "Can you do my back? I can't reach.", nerdy: "Can you do my back? I physically can't reach.",
    loud: "Do my back? I can't reach!", blunt: "Do my back.", tough: "Do my back.", competitive: "Do my back. I can't reach.", chaotic: "My back! Can't reach! Help!", schemer: "Can you do my back? I can't reach.",
    cruel: "Do my back. I can't reach.", bossy: "Do my back.", proud: "Can you do my back? I can't reach.", flirty: "Can you do my back? I can't reach.",
    anxious: "Can you do my back? I can't reach. Sorry.", goofy: "Can you do my back? I can't reach. Short arms.", ditzy: "Can you do my back?", theatrical: "Would you do my back? I can't reach!" }),
  T("Suncream again? You had some an hour ago.", {
    earnest: "Suncream again? You had some an hour ago.", warm: "Suncream again? You had some an hour ago.", calm: "Again? You had some an hour ago.", quiet: "Again?", dry: "Suncream again? You had some an hour ago.", nerdy: "Suncream again? You applied some an hour ago.",
    loud: "Suncream again? You had some an hour ago!", blunt: "Again? You had some.", tough: "Again?", competitive: "Suncream again? You had some an hour ago.", chaotic: "Again?! An hour ago!", schemer: "Suncream again? You had some an hour ago.",
    cruel: "Suncream again? Obvious.", bossy: "Suncream again? You had some.", proud: "Suncream again?", flirty: "Suncream again? You had some an hour ago.",
    anxious: "Suncream again? You had some an hour ago.", goofy: "Suncream again? You had some an hour ago. Suspicious.", ditzy: "Suncream again?", theatrical: "Suncream again?" }),
  T("I know. It's more of an excuse.", {
    earnest: "I know. It's more of an excuse.", warm: "I know. It's more of an excuse.", calm: "I know. It's an excuse.", quiet: "It's an excuse.", dry: "I know. It's an excuse.", nerdy: "I know. It's more of an excuse.",
    loud: "I know! It's an excuse!", blunt: "It's an excuse.", tough: "It's an excuse.", competitive: "I know. It's more of an excuse.", chaotic: "I know! Excuse! It's an excuse!", schemer: "I know. It's more of an excuse.",
    cruel: "I know. It's an excuse.", bossy: "I know. It's an excuse.", proud: "I know. It's more of an excuse.", flirty: "I know. It's more of an excuse.",
    anxious: "I know. It's more of an excuse. Is that okay?", goofy: "I know. It's more of an excuse. A good one.", ditzy: "I know! It's an excuse!", theatrical: "I know! It's merely an excuse!" }),
  T("I know it is.", {
    earnest: "I know it is.", warm: "I know it is.", calm: "I know.", quiet: "I know.", dry: "I know it is.", nerdy: "I know it is.",
    loud: "I know it is!", blunt: "I know.", tough: "I know.", competitive: "I know it is.", chaotic: "I know! I know!", schemer: "I know it is.",
    cruel: "I know it is.", bossy: "I know it is.", proud: "I know it is.", flirty: "I know it is.",
    anxious: "I know it is.", goofy: "I know it is. Smooth.", ditzy: "I know!", theatrical: "I know it is!" }),
  T("You said you'd come and find me after the chat. You didn't.", {
    earnest: "You said you'd come and find me after the chat. You didn't.", warm: "You said you'd come and find me after the chat. You didn't.", calm: "You said you'd find me. You didn't.", quiet: "You didn't find me.", dry: "You said you'd find me after the chat. You didn't.", nerdy: "You said you'd come and find me after the chat. You didn't.",
    loud: "You said you'd find me after the chat! You didn't!", blunt: "You said you'd find me. You didn't.", tough: "You said you'd find me. Didn't.", competitive: "You said you'd find me after. You didn't.", chaotic: "You said! After the chat! You didn't!", schemer: "You said you'd come and find me after the chat. You didn't.",
    cruel: "You said you'd find me. You didn't. Typical.", bossy: "You said you'd find me after the chat. You didn't.", proud: "You said you'd come and find me. You didn't.", flirty: "You said you'd come and find me after the chat. You didn't.",
    anxious: "You said you'd come and find me after the chat. You didn't. I waited.", goofy: "You said you'd come and find me. You didn't. I waited like a lemon.", ditzy: "You said you'd find me!", theatrical: "You promised to find me! You didn't!" }),
  T("I got caught up.", {
    earnest: "I got caught up.", warm: "I got caught up. I'm sorry.", calm: "I got caught up.", quiet: "Caught up.", dry: "I got caught up.", nerdy: "I got caught up.",
    loud: "I got caught up!", blunt: "Got caught up.", tough: "Got caught up.", competitive: "I got caught up.", chaotic: "Caught up! Things happened!", schemer: "I got caught up.",
    cruel: "I got caught up. Something better came up.", bossy: "I got caught up.", proud: "I got caught up.", flirty: "I got caught up.",
    anxious: "I got caught up. I'm so sorry.", goofy: "I got caught up. Life happened.", ditzy: "I got caught up!", theatrical: "I got swept away!" }),
  T("You always get caught up.", {
    earnest: "You always get caught up.", warm: "You always get caught up.", calm: "You always get caught up.", quiet: "Always.", dry: "You always get caught up.", nerdy: "You always get caught up.",
    loud: "You always get caught up!", blunt: "Always.", tough: "Always.", competitive: "You always get caught up.", chaotic: "Always! Every time!", schemer: "You always get caught up.",
    cruel: "You always get caught up. Funny, that.", bossy: "You always get caught up.", proud: "You always get caught up.", flirty: "You always get caught up.",
    anxious: "You always get caught up.", goofy: "You always get caught up. Like a fly.", ditzy: "You always get caught up!", theatrical: "You always get caught up!" }),
  T("Maybe not. It's how it feels.", {
    earnest: "Maybe not. It's how it feels.", warm: "Maybe not. It's how it feels, though.", calm: "Maybe not. It's how it feels.", quiet: "It's how it feels.", dry: "Maybe not. It's how it feels.", nerdy: "Maybe not. But it's how it feels.",
    loud: "Maybe not! It's how it feels!", blunt: "It's how it feels.", tough: "It's how it feels.", competitive: "Maybe not. It's how it feels.", chaotic: "Maybe not! But it feels like it!", schemer: "Maybe not. It's how it feels.",
    cruel: "Maybe not. It's how it feels.", bossy: "Maybe not. It's how it feels.", proud: "Maybe not. It's how it feels.", flirty: "Maybe not. It's how it feels.",
    anxious: "Maybe not. It's how it feels.", goofy: "Maybe not. It's how it feels. Feelings are stupid.", ditzy: "Maybe not! It's how it feels!", theatrical: "Perhaps not! But it's how it feels!" }),
  T("What would it take?", {
    earnest: "What would it take?", warm: "What would it take?", calm: "What would it take?", quiet: "What would it take?", dry: "What would it take?", nerdy: "What would it take, realistically?",
    loud: "What would it take?", blunt: "What would it take?", tough: "What would it take?", competitive: "What would it take? Name it.", chaotic: "What would it take?! Anything!", schemer: "What would it take?",
    cruel: "What would it take?", bossy: "What would it take?", proud: "What would it take?", flirty: "What would it take?",
    anxious: "What would it take? If anything?", goofy: "What would it take? Flowers? A song?", ditzy: "What would it take?", theatrical: "What would it take?" }),
  T("For you to go on a date with me.", {
    earnest: "For you to go on a date with me.", warm: "For you to go on a date with me.", calm: "For a date with me.", quiet: "A date with me.", dry: "For you to go on a date with me.", nerdy: "For you to go on a date with me.",
    loud: "For you to go on a date with me!", blunt: "A date. With me.", tough: "A date with me.", competitive: "For you to pick me for a date.", chaotic: "A date! With me! What would it take?!", schemer: "For you to go on a date with me.",
    cruel: "For you to go on a date with me. Someone better.", bossy: "For a date with me.", proud: "For you to go on a date with me. You'd love it.", flirty: "For you to go on a date with me.",
    anxious: "For you to go on a date with me. If that's not weird.", goofy: "For you to go on a date with me. I'd bring snacks.", ditzy: "For a date! With me!", theatrical: "For you to go on a date with me!" }),
  T("Me being single. And I'm not.", {
    earnest: "Me being single. And I'm not.", warm: "Me being single. And I'm not. Sorry.", calm: "Me being single. I'm not.", quiet: "I'm not single.", dry: "Me being single. Which I'm not.", nerdy: "Me being single. Which I'm not.",
    loud: "Me being single! And I'm not!", blunt: "I'm not single.", tough: "I'm not single.", competitive: "Me being single. I'm not.", chaotic: "Single! I'm not! So no!", schemer: "Me being single. And I'm not.",
    cruel: "Me being single. And I'm not. Bad luck.", bossy: "Me being single. I'm not.", proud: "Me being single. And I'm very much not.", flirty: "Me being single. And I'm not.",
    anxious: "Me being single. And I'm not. Sorry.", goofy: "Me being single. And I'm not. Plot hole.", ditzy: "Me being single! I'm not!", theatrical: "Me being single! Which I'm not!" }),
  T("I feel like I know you a lot better than I did this morning.", {
    earnest: "I feel like I know you a lot better than I did this morning.", warm: "I feel like I know you so much better than this morning.", calm: "I know you better than this morning.", quiet: "I know you better now.", dry: "I know you a lot better than this morning.", nerdy: "I feel like I know you a lot better than I did this morning.",
    loud: "I know you so much better than this morning!", blunt: "I know you better now.", tough: "Know you better now.", competitive: "I know you better than anyone in here now.", chaotic: "I know you! Better! Than this morning!", schemer: "I feel like I know you a lot better than I did this morning.",
    cruel: "I know you better than this morning. Not bad.", bossy: "I know you better than this morning.", proud: "I feel like I know you a lot better than I did this morning.", flirty: "I feel like I know you a lot better than I did this morning.",
    anxious: "I feel like I know you a lot better than this morning. That's good, right?", goofy: "I feel like I know you a lot better than I did this morning. Speed-friending.", ditzy: "I know you better now!", theatrical: "I know you so much better than this morning!" }),
  T("You do. More than most people.", {
    earnest: "You do. More than most people.", warm: "You do. More than most people.", calm: "You do. More than most.", quiet: "More than most.", dry: "You do. More than most people.", nerdy: "You do. More than most people.",
    loud: "You do! More than most!", blunt: "More than most.", tough: "More than most.", competitive: "You do. More than anyone.", chaotic: "You do! More than anyone!", schemer: "You do. More than most people.",
    cruel: "You do. More than most. Don't waste it.", bossy: "You do. More than most.", proud: "You do. More than most people. Lucky you.", flirty: "You do. More than most people.",
    anxious: "You do. More than most people.", goofy: "You do. More than most people. Exclusive access.", ditzy: "You do!", theatrical: "You do! More than most!" }),
  T("This feels different. I know everyone says that.", {
    earnest: "This feels different. I know everyone says that.", warm: "This feels different. I know everyone says that.", calm: "This feels different.", quiet: "This feels different.", dry: "This feels different. I know. Everyone says that.", nerdy: "This feels different. I know everyone says that.",
    loud: "This feels different! I know everyone says that!", blunt: "This feels different.", tough: "This feels different.", competitive: "This feels different. Better than everyone else's.", chaotic: "Different! This feels different! I know! Everyone says it!", schemer: "This feels different. I know everyone says that.",
    cruel: "This feels different. I know everyone says that. They're lying.", bossy: "This feels different.", proud: "This feels different. I know everyone says that.", flirty: "This feels different. I know everyone says that.",
    anxious: "This feels different. I know everyone says that.", goofy: "This feels different. I know everyone says that. Classic line.", ditzy: "This feels different!", theatrical: "This feels different!" }),
  T("Everyone does say that.", {
    earnest: "Everyone does say that.", warm: "Everyone does say that.", calm: "Everyone says that.", quiet: "Everyone says that.", dry: "Everyone does say that.", nerdy: "Everyone does say that.",
    loud: "Everyone does say that!", blunt: "Everyone says that.", tough: "Everyone says that.", competitive: "Everyone does say that.", chaotic: "Everyone says it!", schemer: "Everyone does say that.",
    cruel: "Everyone does say that.", bossy: "Everyone says that.", proud: "Everyone does say that.", flirty: "Everyone does say that.",
    anxious: "Everyone does say that.", goofy: "Everyone does say that. Every single one.", ditzy: "Everyone says that?", theatrical: "Everyone says that!" }),
  T("I've never said it before, though.", {
    earnest: "I've never said it before, though.", warm: "I've never said it before, though.", calm: "I've never said it before.", quiet: "Never said it before.", dry: "I've never said it before, though.", nerdy: "I've never said it before, though.",
    loud: "I've never said it before!", blunt: "Never said it before.", tough: "Never said it before.", competitive: "I've never said it before.", chaotic: "Never! Never said it!", schemer: "I've never said it before, though.",
    cruel: "I've never said it before.", bossy: "I've never said it before.", proud: "I've never said it before. Remember that.", flirty: "I've never said it before, though.",
    anxious: "I've never said it before, though.", goofy: "I've never said it before, though. First time.", ditzy: "I've never said it before!", theatrical: "I've never said it before!" }),
];
