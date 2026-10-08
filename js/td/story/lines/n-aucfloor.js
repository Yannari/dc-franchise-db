// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-aucfloor.js — the auction floor, lot by lot
// ══════════════════════════════════════════════════════════════════════
//
// td/story/twist.js writeAuctionScript (auction.js decides every bid). h is the host.
//   auc.open.any          h opens the auction; a and b (the boldest two) react
//   auc.lot.<kind>        h puts a lot up: food / comfort / letter ({lot}), covered, immunity
//                         (a covered lot nobody is told is immunity); {amount} is the starting bid
//   auc.nobid.any         nobody bids
//   auc.bid.open          a opens the bidding at {amount}
//   auc.bid.raise         a outbids b at {amount}
//   auc.bid.jump          a jumps straight to {amount} over b
//   auc.bid.loan          a is out of money and b lends it; a bids {amount}
//   auc.bid.refused       a is out of money, asks b, and b says no
//   auc.bid.broke         a is out of money and has to stop
//   auc.bid.war           a and b go back and forth, past {amount}, until b wins at {top}
//   auc.sold.any          h sells it to a for {amount}
//   auc.win.<kind>        a sees what they bought ({lot}, lowercase): food, comfort, letter,
//                         blindfood (a covered lot that was only food), immunity, power, idol,
//                         clue (an idol clue that went cold), intel; b (sharp-eyed) may react
//   auc.switch.<how>      h offers to swap it for what's behind the curtain: kept, upgrade, dud
//                         ({thing} is what was behind it)
//   auc.close.any / .noimmunity   h ends it
//   auc.saver.any         a kept {amount}; auc.spender.any  a spent everything
// Ids: 'naf.'.

export default {
  'auc.open.any': [
    { id: 'naf.op1', turns: [
      { by: 'h', say: "Welcome to the auction! Everybody gets five hundred bucks. Food, comfort, and a few covered lots that might be something great or might be a bowl of bugs. And I'm not telling you when it ends." },
      { by: 'a', say: "Wait, it could just end? Whenever?", v: { loud: "WAIT. It could end whenever? That's evil!", dry: "Oh, good. Uncertainty. My favourite." } },
      { by: 'h', say: "Whenever I feel like it. So if you want something, don't wait." },
      { by: 'b', opt: true, say: "I've been eating rice for two weeks. I'm spending all of it.", v: { schemer: "Five hundred bucks, and everybody's going to watch what everybody else buys. This is going to be fun." } },
    ] },
    { id: 'naf.op2', turns: [
      { by: 'h', say: "Five hundred each, twenty-dollar bids, and you can lend each other money. You can't share what you win, though. You eat it alone, in front of everybody." },
      { by: 'a', say: "That's actually so mean." },
      { by: 'h', say: "Thank you." },
      { by: 'b', opt: true, say: "Can we start? I can smell the food from here." },
    ] },
  ],
  'auc.lot.food': [
    { id: 'naf.f1', turns: [{ by: 'h', say: "Something for the hungry ones: {lot}. Bidding starts at {amount}." }] },
    { id: 'naf.f2', turns: [{ by: 'h', say: "Next lot: {lot}. Who wants it? {amount} to start." }] },
    { id: 'naf.f3', turns: [{ by: 'h', say: "Here's {lot}, and I'll be honest, it smells incredible. {amount}, anybody?" }] },
  ],
  'auc.lot.comfort': [
    { id: 'naf.m1', turns: [{ by: 'h', say: "Not food this time: {lot}. You look like you need it. {amount} to start." }] },
    { id: 'naf.m2', turns: [{ by: 'h', say: "For anybody who's tired of sleeping on the ground: {lot}. Opening at {amount}." }] },
  ],
  'auc.lot.letter': [
    { id: 'naf.l1', turns: [{ beat: "The room goes quiet as the host holds it up." }, { by: 'h', say: "This one's a little different: {lot}. Starting at {amount}." }] },
    { id: 'naf.l2', turns: [{ by: 'h', say: "Who's missing their family? It's {lot}. I'll start it at {amount}, and I'm guessing it won't stay there." }] },
  ],
  'auc.lot.covered': [
    { id: 'naf.c1', turns: [{ by: 'h', say: "Covered lot. Could be an advantage, could be a plate of eyeballs. {amount} to find out." }] },
    { id: 'naf.c2', turns: [{ by: 'h', say: "Another covered one. I know what's under there, and you don't. {amount} to start." }] },
    { id: 'naf.c3', turns: [{ by: 'h', say: "Mystery lot! Don't look at me like that, I'm not giving you a hint. {amount}." }] },
  ],
  'auc.lot.immunity': [
    { id: 'naf.i1', turns: [{ by: 'h', say: "This covered lot is a big one. That's all I'll say. Opening at {amount}." }] },
  ],
  'auc.nobid.any': [
    { id: 'naf.n1', turns: [{ by: 'h', say: "Nobody? Really? Fine, it goes back in the box." }] },
    { id: 'naf.n2', turns: [{ beat: "Nobody raises a hand." }, { by: 'h', say: "Wow. Okay. Moving on." }] },
  ],

  'auc.bid.open': [
    { id: 'naf.bo1', turns: [{ by: 'a', say: "{amount}.", v: { loud: "{amount}! Right here! {amount}!", anxious: "Um, {amount}? Is that how this works?", calm: "I'll start at {amount}.", goofy: "{amount}, and I'm not ashamed." } }] },
    { id: 'naf.bo2', turns: [{ by: 'a', say: "I'll open it. {amount}.", v: { schemer: "{amount}. Let's see who wants it.", food: "{amount}, and I need it more than any of you." } }] },
  ],
  'auc.bid.raise': [
    { id: 'naf.br1', turns: [{ by: 'a', say: "{amount}.", v: { loud: "{amount}! Sorry, {b}!", dry: "{amount}. Sorry, {b}. Not really.", warm: "{amount}! Sorry, {b}, I really want this one." } }] },
    { id: 'naf.br2', turns: [{ by: 'a', say: "I'll go {amount}.", v: { competitive: "{amount}. Your move, {b}.", anxious: "Okay, okay, {amount}. Oh no, I'm doing this." } }] },
    { id: 'naf.br3', turns: [{ by: 'b', say: "Oh, come on." }, { by: 'a', say: "{amount}." }] },
    { id: 'naf.br4', turns: [{ beat: "{a} raises a hand without even looking up." }, { by: 'a', say: "{amount}." }] },
  ],
  'auc.bid.jump': [
    { id: 'naf.bj1', turns: [{ by: 'a', say: "Let's skip ahead. {amount}.", v: { tough: "{amount}. Done playing.", schemer: "{amount}. That should end the conversation." } }, { by: 'b', say: "Are you serious?" }] },
    { id: 'naf.bj2', turns: [{ beat: "{a} stands up." }, { by: 'a', say: "{amount}." }, { beat: "The whole table turns to look." }] },
  ],
  'auc.bid.loan': [
    { id: 'naf.bn1', turns: [{ by: 'a', say: "I'm out. {b}, can I borrow some? Please?", v: { tough: "{b}. Money. I'll owe you.", goofy: "{b}, I will name my firstborn after you." } }, { by: 'b', say: "Fine. Go." }, { by: 'a', say: "{amount}!" }] },
    { id: 'naf.bn2', turns: [{ beat: "{b} leans over and whispers something to {a}." }, { by: 'a', say: "{amount}. And {b} is paying for part of it." }] },
  ],
  'auc.bid.refused': [
    { id: 'naf.bf1', turns: [{ by: 'a', say: "{b}, lend me twenty? Just twenty.", v: { anxious: "{b}, I know we're not close, but could you lend me a little? Please?" } }, { by: 'b', say: "No.", v: { warm: "Sorry, I really can't.", cruel: "Absolutely not.", dry: "I'm going to say no, but I want you to know I enjoyed being asked." } }, { by: 'a', say: "Wow. Okay.", v: { tough: "Noted, {b}. Noted." } }] },
    { id: 'naf.bf2', turns: [{ by: 'a', say: "Can anybody spot me? {b}?" }, { beat: "{b} folds both arms and looks the other way." }, { by: 'a', conf: "I asked {b} for a little money in front of everybody, and {b} looked straight past me. I'm not forgetting that." }] },
  ],
  'auc.bid.broke': [
    { id: 'naf.bk1', turns: [{ by: 'a', say: "I'm out. I'm actually out.", v: { loud: "NO! I'm out of money!", dry: "And that's my entire fortune. Gone. Lovely." } }] },
  ],
  'auc.bid.war': [
    { id: 'naf.bw1', turns: [
      { by: 'h', say: "Sixty... eighty... a hundred, from the two of you, and nobody else is even trying." },
      { by: 'b', say: "Higher." },
      { by: 'a', say: "Higher.", v: { loud: "HIGHER!" } },
      { by: 'b', say: "Higher than that." },
      { by: 'h', say: "We're at {amount}, people. For one lot." },
      { by: 'a', say: "I'm not letting {b} have it." },
      { by: 'b', say: "{top}." },
      { beat: "{a} opens {a.posAdj} mouth, looks at {a.posAdj} money, and closes it again." },
    ] },
    { id: 'naf.bw2', turns: [
      { beat: "{a} and {b} both put their hands up at the same time, and neither of them puts it down." },
      { by: 'a', say: "You don't even want it, {b}. You just don't want me to have it." },
      { by: 'b', say: "Both of those can be true." },
      { by: 'h', say: "{amount}! Does anybody else want in on this? No? Just you two? Great." },
      { by: 'a', say: "Fine. One more." },
      { by: 'b', say: "{top}." },
      { by: 'a', say: "...I'm done.", v: { tough: "Take it. Choke on it.", warm: "Okay, it's yours, enjoy it." } },
    ] },
    { id: 'naf.bw3', turns: [
      { beat: "{a} and {b} keep raising, twenty at a time, staring right at each other." },
      { by: 'h', say: "This is the best thing that's happened to me all season. {amount}!" },
      { by: 'b', say: "{top}, and I'll keep going." },
      { by: 'a', say: "Then keep it.", v: { cruel: "You can have it. You clearly need it." } },
    ] },
    { id: 'naf.bw4', turns: [
      { by: 'b', say: "Fine. I'll just keep going until you stop.", v: { competitive: "I don't lose auctions. I don't lose anything." } },
      { by: 'a', say: "Same.", v: { anxious: "Okay, but, um, I'm also going to keep going? I think?" } },
      { by: 'h', say: "Ladies and gentlemen, we have a grudge match. {amount}!" },
      { by: 'b', say: "{top}." },
      { by: 'a', say: "...You win. Enjoy it, I guess." },
      { by: 'a', conf: "I didn't even want it that much. I just really, really didn't want {b} to have it." },
    ] },
    { id: 'naf.bw5', turns: [
      { by: 'h', say: "We've got two bidders and nobody else is even trying. {amount}, going up..." },
      { by: 'a', say: "This is ridiculous. One more." },
      { by: 'b', say: "{top}." },
      { by: 'a', say: "Nope. I'm out. Somebody stop me if I try again.", v: { goofy: "Somebody hold my arms down. I'm out." } },
    ] },
    { id: 'naf.bw6', turns: [
      { beat: "The bidding between {a} and {b} goes so long the others start eating their own snacks just to watch." },
      { by: 'b', say: "{top}, final offer." },
      { by: 'a', say: "Take it.", v: { tough: "Take it. You're going to need the energy, because I'm coming for you." } },
    ] },
  ],
  'auc.sold.any': [
    { id: 'naf.s1', turns: [{ by: 'h', say: "Going once, going twice... sold to {a} for {amount}!" }] },
    { id: 'naf.s2', turns: [{ by: 'h', say: "Sold! {a}, {amount}. Pay the man. The man is me." }] },
    { id: 'naf.s3', turns: [{ by: 'h', say: "{amount}, sold, to {a}." }] },
  ],
  'auc.win.food': [
    { id: 'naf.wf1', turns: [{ by: 'a', say: "Oh my god. Oh my god, it's real food.", v: { food: "I'm going to eat this so slowly that every single one of you has to watch.", dry: "Nobody talk to me for the next ten minutes.", warm: "I'd share if I was allowed. I'm really sorry, everybody." } }] },
    { id: 'naf.wf2', turns: [{ beat: "{a} eats it in about ninety seconds while everybody else watches." }, { by: 'a', conf: "Was it worth it? Absolutely. I don't care what it costs me later." }] },
  ],
  'auc.win.comfort': [
    { id: 'naf.wc1', turns: [{ by: 'a', say: "I don't even care what anybody thinks. I needed this.", v: { tough: "Don't judge me. I'm tired." } }] },
  ],
  'auc.win.letter': [
    { id: 'naf.we1', turns: [{ beat: "{a} holds it with both hands and doesn't say anything for a while." }, { by: 'a', say: "Sorry. Give me a second.", v: { tough: "I'm fine. It's just dusty in here.", goofy: "I'm not crying, you're crying." } }] },
  ],
  'auc.win.blindfood': [
    { id: 'naf.wb1', turns: [{ by: 'h', say: "Let's see what you won, {a}!" }, { beat: "The cover comes off. It's {lot}." }, { by: 'a', say: "...For {amount}?", v: { loud: "I PAID {amount} FOR THIS?", dry: "Well. That's a very expensive lesson.", food: "Honestly? I'll take it. Food is food." } }] },
    { id: 'naf.wb2', turns: [{ beat: "{a} lifts the cover and stares at {lot}." }, { by: 'a', say: "This is fine. This is totally fine." }] },
  ],
  'auc.win.immunity': [
    { id: 'naf.wi1', turns: [{ by: 'h', say: "Let's see what's under there!" }, { beat: "The cover comes off: individual immunity." }, { by: 'a', say: "Wait. Is that... I'm safe?", v: { loud: "I'M SAFE! I BOUGHT IMMUNITY!", schemer: "Well. That changes tonight, doesn't it." } }, { by: 'b', opt: true, say: "You've got to be kidding me.", v: { cruel: "Great. {a} bought a way out. Love that for us." } }] },
  ],
  'auc.win.power': [
    { id: 'naf.wp1', turns: [{ beat: "{a} reads the note under the cover and quickly folds it up." }, { by: 'a', say: "It's... nice. It's a nice thing." }, { by: 'b', opt: true, conf: "{a} just spent a fortune on a covered lot and hid it in two seconds. That's an advantage. Everybody here knows it's an advantage." }] },
    { id: 'naf.wp2', turns: [{ by: 'a', say: "Huh. Okay. Interesting.", v: { anxious: "Oh. Oh no. Everybody's looking at me now, aren't they?" } }, { by: 'b', opt: true, say: "What is it?" }, { by: 'a', say: "Nothing. Food. Don't worry about it." }] },
  ],
  'auc.win.idol': [
    { id: 'naf.wd1', turns: [{ beat: "Under the cover is a clue. {a} reads it once and looks up, trying very hard to keep a straight face." }, { by: 'a', say: "It's a clue. It's probably nothing." }, { by: 'b', opt: true, conf: "{a} said it was probably nothing and then left the auction in a hurry. It was not nothing." }] },
  ],
  'auc.win.clue': [
    { id: 'naf.wl1', turns: [{ by: 'a', say: "An idol clue! Okay! I'll find it, I'll totally find it.", v: { dry: "A clue. To an idol that's probably already gone. Great." } }] },
  ],
  'auc.win.intel': [
    { id: 'naf.wn1', turns: [{ beat: "{a} unfolds a note, reads it, and goes very quiet." }, { by: 'a', conf: "That note told me exactly who's been talking about who. I paid a lot for it, and it was worth every cent." }] },
  ],
  'auc.switch.kept': [
    { id: 'naf.xk1', turns: [{ by: 'h', say: "Or... you could trade it for whatever's behind the curtain." }, { by: 'a', say: "No way. I'm keeping it.", v: { anxious: "No, no, no, I'm not risking it, I'm keeping this.", tough: "Tempting, but no." } }] },
  ],
  'auc.switch.upgrade': [
    { id: 'naf.xu1', turns: [{ by: 'h', say: "Want to trade {lot} for whatever's behind the curtain?" }, { by: 'a', say: "...Yeah. Let's do it." }, { beat: "Behind the curtain: {thing}." }, { by: 'a', say: "YES! I knew it!" }] },
  ],
  'auc.switch.dud': [
    { id: 'naf.xd1', turns: [{ by: 'h', say: "Want to trade {lot} for whatever's behind the curtain?" }, { by: 'a', say: "Sure, why not." }, { beat: "Behind the curtain: {thing}." }, { by: 'a', say: "No. No, no, no. Give it back!", v: { dry: "Well. That's what I get for gambling.", loud: "THAT'S NOT FAIR!" } }, { by: 'h', say: "No take-backs!" }] },
  ],
  'auc.close.any': [
    { id: 'naf.e1', turns: [{ by: 'h', say: "And that's it! The auction is over. Whatever you didn't spend, you don't get to keep." }] },
    { id: 'naf.e2', turns: [{ by: 'h', say: "Aaand we're done! Hope you spent it, because the money's gone either way." }] },
  ],
  'auc.close.noimmunity': [
    { id: 'naf.en1', turns: [{ by: 'h', say: "That's the auction. And just so you know, nobody bought immunity tonight, because nobody got the chance. Everybody's vulnerable." }] },
  ],
  'auc.saver.any': [
    { id: 'naf.sv1', turns: [{ by: 'a', conf: "I still have {amount}. I was waiting for the good stuff, and then the whole thing just ended. I'm so mad at myself." }] },
    { id: 'naf.sv2', turns: [{ by: 'a', say: "I didn't spend {amount}. I was saving it!", v: { dry: "I have {amount} left. Can I keep it? No? Cool." } }] },
  ],
  'auc.spender.any': [
    { id: 'naf.sp1', turns: [{ by: 'a', conf: "I spent every single dollar, and I'd do it again, because I'm the only one here who's not hungry right now." }] },
  ],
};
