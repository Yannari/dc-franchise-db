// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-auction.js — the auction, back at camp
// ══════════════════════════════════════════════════════════════════════
//
// director.js auctionTalk (auction.js decides who bid, who lent, who refused):
//   story.auction.refused   a ran out of money mid-bid and asked b for a loan; b said no
//   story.auction.outbid    a and b fought over the same lot ({lot} when it was not a covered one); b won
//   story.auction.power     a (a strategist) tells an ally b that {target} bought an advantage, everyone saw
//   story.auction.immunity  the same, but {target} bought immunity for tonight
//   story.auction.loan      a won a lot with b's money
//   story.auction.letter    a spent the money on {lot}, a piece of home, and shares it with b
// Ids: 'nau.'.

export default {
  'story.auction.refused': [
    { id: 'nau.r1', turns: [
      { by: 'a', say: "So, about the auction. I asked you for twenty bucks, {b}. Twenty.", v: { loud: "Twenty bucks, {b}! I asked you for TWENTY BUCKS!", quiet: "...You could've just said yes, you know.", dry: "I asked for twenty dollars, {b}. Not a kidney." } },
      { by: 'b', say: "It was my money. I didn't owe you anything.", v: { cruel: "And I said no. That's how money works.", warm: "I'm sorry, I just... I was saving it, okay?" } },
      { by: 'a', say: "No, you didn't owe me, but now I know exactly where I stand with you." },
      { by: 'b', move: 'deflect' },
      { by: 'a', conf: "Everybody at that table saw {b} say no to me, and I'm not going to forget it, because that told me everything." },
    ] },
    { id: 'nau.r2', when: { voice: ['emotional', 'anxious', 'warm', 'earnest'] }, turns: [
      { by: 'a', say: "Why wouldn't you help me at the auction? I'd have paid you back." },
      { by: 'b', say: "I didn't think you'd ask me, honestly." },
      { by: 'a', say: "I asked you because I thought we were friends." },
      { by: 'b', say: "We are. It was just money." },
      { by: 'a', conf: "It wasn't about the money. It was about {b} looking right at me and saying no in front of everybody." },
    ] },
    { id: 'nau.r3', when: { voice: ['tough', 'competitive', 'proud', 'blunt'] }, turns: [
      { by: 'b', say: "You're still mad about the auction?" },
      { by: 'a', say: "Mad? No. I'm just keeping track." },
      { by: 'b', say: "Of what?" },
      { by: 'a', say: "Of who helps me and who doesn't, and you just moved to the second list." },
      { by: 'b', conf: "{a} asked me for money in front of everybody and I said no, and now {a} acts like I stabbed {a.obj} in the back. It was an auction." },
    ] },
    { id: 'nau.r4', when: { voice: ['schemer', 'calm', 'dry'] }, turns: [
      { by: 'a', conf: "I didn't even want that lot that much. I wanted to see who'd lend me the money, and {b} wouldn't." },
      { by: 'a', conf: "So now I know who I can't count on, and that cost me nothing, which honestly makes it the best thing I got all night." },
    ] },
  ],
  'story.auction.outbid': [
    { id: 'nau.o1', when: { lot: true, eats: true }, turns: [
      { by: 'a', say: "Enjoy {lot}, {b}. I hope it was worth it.", v: { cruel: "Hope {lot} was worth it, {b}. You looked really desperate.", goofy: "You stole {lot} from me, {b}. I'll never recover. Never." } },
      { by: 'b', say: "It was. Thanks for driving the price up, by the way." },
      { by: 'a', say: "I wasn't going to just let you have it." },
      { by: 'b', say: "Anytime. It tasted even better knowing you wanted it.", v: { warm: "Sorry, really. Do you want a bite?", cruel: "Anytime. It tasted even better knowing you wanted it." } },
      { by: 'a', conf: "{b} spent almost everything just to beat me. That wasn't about {lot}, that was about me." },
    ] },
    { id: 'nau.o2', turns: [
      { by: 'b', say: "No hard feelings about the auction, right?" },
      { by: 'a', say: "You kept bidding until I had nothing left. What do you think?", v: { calm: "It's fine. I just didn't expect you to go that high.", anxious: "No, it's fine! It's fine. I just really wanted that." } },
      { by: 'b', say: "I just wanted it more." },
      { by: 'a', say: "Yeah, everybody saw how much you wanted it." },
      { by: 'b', conf: "Me and {a} went back and forth like ten times. I won, and {a} is still sulking about it." },
    ] },
    { id: 'nau.o3', when: { voice: ['loud', 'competitive', 'tough', 'proud'] }, turns: [
      { by: 'a', say: "Next time, I'm not stopping. I'll spend every dollar I have just so you don't get it." },
      { by: 'b', say: "There isn't going to be a next time." },
      { by: 'a', say: "Then you'd better hope there's never another challenge either." },
      { by: 'a', conf: "I lost the bidding war to {b}, and I hate losing to {b} more than I hate losing, period." },
    ] },
    { id: 'nau.o4', when: { lot: true, eats: true, voice: ['food', 'emotional', 'warm'] }, turns: [
      { by: 'a', conf: "I wanted {lot} so bad, and {b} kept bidding and bidding until I couldn't anymore, and then {b} ate it right in front of me." },
      { by: 'a', conf: "I know it's just food, but I'm going to remember that." },
    ] },
    { id: 'nau.o5', when: { lot: true, eats: false }, turns: [
      { by: 'a', say: "So how's {lot}? Worth every dollar?", v: { dry: "So, {lot}. Was it everything you dreamed of?", anxious: "Is {lot} nice? I really wanted it, that's all." } },
      { by: 'b', say: "Honestly? Yeah, it's great." },
      { by: 'a', say: "Great. I'm really happy for you." },
      { by: 'b', say: "You don't sound happy." },
      { by: 'a', conf: "I had {lot} in my hands, basically, until {b} kept bidding just to push me out, and I don't think that was an accident." },
    ] },
  ],
  'story.auction.power': [
    { id: 'nau.p1', turns: [
      { by: 'a', say: "Did you see what {target} bought?", v: { anxious: "Did you see what {target} bought? Because I can't stop thinking about it.", loud: "Okay, did EVERYBODY see what {target} just bought?!" } },
      { by: 'b', say: "Everybody saw. {target} spent almost everything on it." },
      { by: 'a', say: "Nobody spends that much on a covered lot unless they know it's going to be something good." },
      { by: 'b', say: "So what do we do?" },
      { by: 'a', say: "We make sure it's {target} before {target} gets to use it." },
      { by: 'a', conf: "{target} walked out of that auction with real power, and everybody at the table saw it, so now {target} is the biggest target here, whether {target} likes it or not." },
    ] },
    { id: 'nau.p2', when: { voice: ['schemer', 'calm', 'dry', 'competitive'] }, turns: [
      { by: 'a', say: "{target} has an advantage now. We don't know what it is, which is worse." },
      { by: 'b', say: "Could be nothing." },
      { by: 'a', say: "Nobody bids like that on nothing." },
      { by: 'b', say: "Okay. So we watch {target}." },
      { by: 'a', say: "We don't just watch, we split the vote if we have to." },
    ] },
    { id: 'nau.p3', when: { third: true }, turns: [
      { by: 'a', say: "Okay, quick, before {target} comes back. What did {target} get?" },
      { by: 'b', say: "No idea, but {target} looked really happy about it." },
      { by: 'c', say: "Happy is bad. Happy means it's something big." },
      { by: 'a', say: "Then that's our name, unless somebody has a better one." },
      { by: 'b', conf: "Two days ago nobody was even talking about {target}, and then one auction later everybody is." },
    ] },
  ],
  'story.auction.immunity': [
    { id: 'nau.i1', turns: [
      { by: 'a', say: "{target} bought immunity. Bought it. With money.", v: { dry: "Well, {target} bought immunity, which is a sentence I never thought I'd say.", loud: "{target} BOUGHT IMMUNITY? Is that even allowed?" } },
      { by: 'b', say: "So {target}'s safe tonight." },
      { by: 'a', say: "Tonight, sure, but {target} has nothing left for the next one." },
      { by: 'b', say: "And next time, nobody's selling immunity." },
      { by: 'a', conf: "{target} is safe tonight, so fine, we move to plan B, but I'm putting {target} at the top of my list for next time." },
    ] },
    { id: 'nau.i2', when: { voice: ['schemer', 'calm', 'competitive'] }, turns: [
      { by: 'a', say: "{target} just bought the one thing nobody else could afford, so that's one name off the table tonight." },
      { by: 'b', say: "Which means somebody else is going home who wasn't worried an hour ago." },
      { by: 'a', say: "Exactly, and I'd rather it was somebody we picked than somebody who picked us." },
      { by: 'b', conf: "{target} is safe, everybody's money is gone, and now the whole vote is up for grabs." },
    ] },
  ],
  'story.auction.loan': [
    { id: 'nau.l1', turns: [
      { by: 'a', say: "Thank you for the money, {b}, seriously. I wouldn't have won without you.", v: { quiet: "...Thanks. For the money.", loud: "{b}! You're the best! I owe you SO big!", dry: "Thanks for bankrolling me, {b}. I'll put you in my will." } },
      { by: 'b', say: "Don't worry about it." },
      { by: 'a', say: "No, I mean it, I owe you one." },
      { by: 'b', say: "I know you do." },
      { by: 'b', conf: "I lent {a} the money because I like {a}, and also because now {a} owes me, and owing someone in this game means something." },
    ] },
    { id: 'nau.l2', when: { voice: ['schemer', 'calm', 'dry', 'proud'] }, turns: [
      { by: 'b', say: "So, about that loan." },
      { by: 'a', say: "I'll pay you back. Well, I can't actually pay you back, can I?" },
      { by: 'b', say: "Not with money, no." },
      { by: 'a', say: "Then with what?" },
      { by: 'b', say: "I'll let you know." },
      { by: 'a', conf: "{b} lent me the money, and I just realized I have no idea what it's going to cost me." },
    ] },
    { id: 'nau.l3', when: { voice: ['warm', 'emotional', 'earnest', 'anxious'] }, turns: [
      { by: 'a', say: "I can't believe you did that for me." },
      { by: 'b', say: "You looked so sad when you ran out of money." },
      { by: 'a', say: "I was sad! But now I'm not, because of you." },
      { by: 'a', conf: "{b} didn't have to help me, and {b} did anyway, in front of everybody, and I'm not going to forget that." },
    ] },
  ],
  'story.auction.letter': [
    { id: 'nau.e1', when: { lot: true }, turns: [
      { beat: "{a} sits with {b} at the edge of camp, holding {lot}." },
      { by: 'a', say: "Can I read you a bit? I don't want to read it alone.", v: { tough: "Don't make it weird, but I want somebody to hear this.", quiet: "...Can you stay while I read it?" } },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "They say they're proud of me. They say everybody back home is watching." },
      { by: 'b', move: 'reassure' },
      { by: 'a', conf: "Everybody else bought food or power, and I spent my money on this, and I'd do it again every single time." },
    ] },
    { id: 'nau.e2', turns: [
      { by: 'b', say: "Was it worth it? Spending everything on that?" },
      { by: 'a', say: "Yeah, totally. I'd forgotten what home even sounds like.", v: { teen: "Yeah, like, a hundred percent. I didn't know how much I missed them.", grown: "Every penny. I've got people back home who are counting on me." } },
      { by: 'b', say: "I kind of wish I'd bid on it now." },
      { by: 'a', conf: "I don't care that I didn't get an advantage. I needed to hear from home more than I needed a vote." },
    ] },
    { id: 'nau.e3', when: { voice: ['schemer', 'competitive', 'proud'] }, turns: [
      { by: 'a', conf: "I know buying a letter from home looks soft, and everybody probably thinks I wasted my money." },
      { by: 'a', conf: "Let them think that. The people who think you're soft are the people who don't see you coming." },
    ] },
  ],
};
