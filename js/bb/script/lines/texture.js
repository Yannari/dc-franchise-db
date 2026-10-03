// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/texture.js — a slice of life in every room (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/location-texture.js. Each family belongs to one
// room, so its staging can name it.
//
//   texture.kitchen    a teaches b to cook (kitchen)                       scene
//   texture.backyard   a, b and c play a made-up game (backyard)            scene
//   texture.snoring    a snores; b did not sleep (bedroom)                  scene
//   texture.haircut    a cuts b's hair (washroom)                           good | bad
//   texture.trial      a puts b on a joke trial; c is the witness (living room)   fun | bad
//   texture.namedrop   a tells b the plan is c; c overhears (storage room)   scene
//   texture.rant       a vents about {target} (Diary Room)                  scene
//   texture.letter     a, the HOH, shares the letter from home with b (HOH room)   scene

export default {
  'texture.kitchen.scene': [
    { id: 'xk.1', turns: [{ by: 'b', say: "Can you show me how to cut an onion? Honestly, I've got no idea." }, { by: 'a', say: "Like this. Now you try." }] },
    { id: 'xk.2', turns: [{ by: 'b', say: "Can I help?" }, { by: 'a', say: "Sure. Stir this." }, { beat: 'Five minutes later, it is burnt.' }, { by: 'a', say: "...We'll call it crispy." }] },
    { id: 'xk.3', turns: [{ beat: '{b} burns one side of dinner and tries to hide it.' }, { by: 'a', say: "I saw that." }, { by: 'b', say: "Saw what?" }, { by: 'a', say: "I'll flip it. Nobody needs to know." }] },
    { id: 'xk.4', turns: [{ by: 'a', say: "This is the only thing I can actually cook. I'll teach you." }, { by: 'b', say: "Is it hard?" }, { by: 'a', say: "Not if you stop talking game while you stir." }] },
    { id: 'xk.5', turns: [{ by: 'a', dr: "{b} can't cook at all. It was the most fun I've had in here all week." }] },
    { id: 'xk.6', turns: [{ by: 'b', dr: "{a} taught me to make pasta. We didn't talk about the game once." }] },
    { id: 'xk.7', turns: [{ by: 'a', say: "Taste this." }, { by: 'b', say: "That's actually good." }, { by: 'a', say: "You sound surprised." }, { by: 'b', say: "I am." }] },
    { id: 'xk.8', turns: [{ by: 'b', say: "How much salt?" }, { by: 'a', say: "A pinch." }, { by: 'b', say: "How much is a pinch?" }, { by: 'a', say: "Less than that." }] },
  ],
  'texture.backyard.scene': [
    { id: 'xy.1', turns: [{ by: 'a', say: "New game. Get the ball in the basket. The rules change when I say." }, { by: 'b', say: "That's not a game, that's cheating." }, { by: 'c', say: "I'm keeping score anyway." }] },
    { id: 'xy.2', turns: [{ by: 'b', say: "That didn't count!" }, { by: 'a', say: "It totally counted." }, { by: 'c', say: "What are the rules again?" }, { by: 'a', say: "...Different rules." }] },
    { id: 'xy.3', turns: [{ by: 'c', say: "Winner gets the last clean towel." }, { by: 'b', say: "Then I'm not losing." }] },
    { id: 'xy.4', turns: [{ beat: '{c} wins and stands on a patio chair to give a speech.' }, { by: 'c', say: "I'd like to thank..." }, { by: 'a', say: "Get down!" }, { beat: '{a} and {b} throw cushions.' }] },
    { id: 'xy.5', turns: [{ by: 'a', say: "Best of three?" }, { by: 'b', say: "Best of five." }, { by: 'c', say: "Best of whatever it takes for me to win." }] },
    { id: 'xy.6', turns: [{ by: 'b', dr: "We played a silly game in the backyard for two hours. Best afternoon in weeks." }] },
    { id: 'xy.7', turns: [{ by: 'a', say: "I invented this game, so I can't lose." }, { by: 'c', say: "That's not how games work." }] },
    { id: 'xy.8', turns: [{ by: 'c', dr: "{a} and {b} argued about the rules for half an hour. They were playing two different games." }] },
  ],
  'texture.snoring.scene': [
    { id: 'xs.1', turns: [{ by: 'b', say: "You know the whole room was awake last night?" }, { by: 'a', say: "Was I snoring?" }, { by: 'b', say: "Like a lawnmower." }, { by: 'a', say: "Sorry!" }, { by: 'b', dr: "{a} laughed. I didn't." }] },
    { id: 'xs.2', turns: [{ beat: '{b} builds a wall of pillows between the beds.' }, { by: 'a', say: "Is this a nomination?" }, { by: 'b', say: "It's a warning." }] },
    { id: 'xs.3', turns: [{ by: 'b', dr: "Every time someone says {a}'s name, the snoring stops. Then it starts again. It's three in the morning and I'm taking it personally." }] },
    { id: 'xs.4', turns: [{ by: 'a', say: "Here. Earplugs. Sorry about last night." }, { by: 'b', say: "I'll take the earplugs." }] },
    { id: 'xs.5', turns: [{ by: 'b', say: "I slept on the floor." }, { by: 'a', say: "Why?" }, { by: 'b', say: "Guess." }] },
    { id: 'xs.6', turns: [{ by: 'a', dr: "Apparently I snore. Nobody told me until today. Everyone is very tired and very cross with me." }] },
    { id: 'xs.7', turns: [{ by: 'b', say: "Can you sleep on your side tonight?" }, { by: 'a', say: "I can try." }, { by: 'b', say: "Please try hard." }] },
    { id: 'xs.8', turns: [{ by: 'a', say: "Morning! Sleep well?" }, { by: 'b', say: "No. Because of you." }, { by: 'a', say: "...Oh." }] },
    { id: 'xs.9', turns: [{ beat: '{b} throws a pillow across the room at three in the morning.' }, { by: 'a', say: "Hey!" }, { by: 'b', say: "You were snoring." }] },
    { id: 'xs.10', turns: [{ by: 'b', dr: "I've heard of people snoring. I didn't know a person could snore like {a}." }] },
  ],
  'texture.haircut.good': [
    { id: 'xh.g1', turns: [{ by: 'b', say: "Can you trim my hair? It's driving me crazy." }, { by: 'a', say: "I can try. Sit still." }, { beat: 'It turns out well.' }] },
    { id: 'xh.g2', turns: [{ beat: 'Half the house watches from the doorway, giving bad advice.' }, { by: 'a', say: "Ignore them." }, { beat: '{a} finishes the cut. It looks good.' }, { by: 'b', say: "Oh! That's actually really good." }] },
    { id: 'xh.g3', turns: [{ by: 'b', say: "Be honest. How does it look?" }, { by: 'a', say: "Look for yourself." }, { by: 'b', say: "...Wow. Okay. You're doing everyone's now." }] },
    { id: 'xh.g4', turns: [{ by: 'a', dr: "I've never cut anyone's hair in my life. Don't tell {b}." }, { by: 'b', say: "This looks amazing!" }] },
    { id: 'xh.g5', turns: [{ by: 'b', dr: "{a} gave me a haircut and it's actually good. I've got a new best friend." }] },
    { id: 'xh.g6', turns: [{ by: 'a', say: "Check the back." }, { by: 'b', say: "Perfect. Thank you!" }] },
  ],
  'texture.haircut.bad': [
    { id: 'xh.b1', turns: [{ by: 'a', say: "I can fix that." }, { beat: 'Ten minutes later, {b} is wearing a hat indoors.' }] },
    { id: 'xh.b2', turns: [{ by: 'b', say: "Is it even?" }, { by: 'a', say: "...Mostly." }, { by: 'b', say: "Mostly?" }] },
    { id: 'xh.b3', turns: [{ beat: '{a} turns {b} to face the mirror.' }, { by: 'b', say: "Can I have a minute alone?" }] },
    { id: 'xh.b4', turns: [{ by: 'b', say: "What have you done?" }, { by: 'a', say: "It grows back." }, { by: 'b', say: "That's not helping." }] },
    { id: 'xh.b5', turns: [{ by: 'b', dr: "{a} cut my hair. I'm wearing a hat until I go home." }] },
    { id: 'xh.b6', turns: [{ by: 'a', dr: "The first cut was too short. The second was me trying to fix the first. It went downhill from there." }] },
  ],
  'texture.trial.fun': [
    { id: 'xt.f1', turns: [{ by: 'a', say: "Order in the court! {b} is charged with stealing all the blankets." }, { by: 'b', say: "Objection!" }, { by: 'c', say: "I saw it happen. Probably." }] },
    { id: 'xt.f2', turns: [{ by: 'a', say: "How do you plead to leaving mugs in three different rooms?" }, { by: 'b', say: "Guilty, but I had a good reason." }, { by: 'c', say: "There's no good reason." }] },
    { id: 'xt.f3', turns: [{ beat: '{c} bangs a wooden spoon like a gavel.' }, { by: 'b', say: "I want a jury of people who actually do the dishes!" }, { beat: 'The house finds {b} not guilty.' }] },
    { id: 'xt.f4', turns: [{ by: 'a', say: "Exhibit A: one dirty sock, found on the sofa." }, { by: 'b', say: "That's not even mine." }, { by: 'c', say: "It's definitely {b}'s." }, { by: 'b', say: "The witness is lying!" }] },
    { id: 'xt.f5', turns: [{ by: 'b', dr: "{a} put me on trial for stealing blankets. I won. Justice." }] },
    { id: 'xt.f6', turns: [{ by: 'a', say: "The court finds {b}..." }, { beat: 'Everyone leans in.' }, { by: 'a', say: "...not guilty, but very annoying." }] },
  ],
  'texture.trial.bad': [
    { id: 'xt.b1', turns: [{ by: 'a', say: "Next charge: {b} talks in {b.posAdj} sleep." }, { by: 'b', say: "Why is it always me?" }] },
    { id: 'xt.b2', turns: [{ beat: '{b} gets up halfway through the fourth charge and leaves.' }, { by: 'a', say: "{b}, come on, it's a joke!" }] },
    { id: 'xt.b3', turns: [{ by: 'b', say: "Is making fun of me what we do for fun now?" }, { by: 'a', say: "It was just a bit." }, { by: 'b', say: "Not for me." }] },
    { id: 'xt.b4', turns: [{ by: 'c', say: "Charge number five..." }, { beat: '{b} does not smile.' }, { by: 'a', dr: "That joke only worked if {b} played along. {b} didn't." }] },
    { id: 'xt.b5', turns: [{ by: 'b', dr: "Everyone laughed. I didn't. It's always me they make fun of." }] },
    { id: 'xt.b6', turns: [{ by: 'a', say: "Lighten up!" }, { by: 'b', say: "You lighten up." }] },
  ],
  'texture.namedrop.scene': [
    { id: 'xn.1', turns: [{ by: 'a', say: "We have to get {c} out before {c} comes after us." }, { beat: '{c} stops outside the door and listens.' }] },
    { id: 'xn.2', turns: [{ by: 'b', say: "Is {c} really the plan?" }, { by: 'a', say: "{c} is the plan." }, { beat: 'Something falls outside the door. When {a} opens it, nobody is there.' }] },
    { id: 'xn.3', turns: [{ by: 'a', say: "...and then next week, {c}." }, { beat: '{c} walks in.' }, { by: 'b', say: "We're just looking for the cereal." }] },
    { id: 'xn.4', turns: [{ by: 'c', dr: "I walked past the storage room and heard my name. I kept walking. Then I went back to listen." }] },
    { id: 'xn.5', turns: [{ by: 'a', say: "Keep your voice down." }, { by: 'b', say: "Sorry. So, {c}?" }, { by: 'a', say: "{c}." }, { beat: '{c} hears every word through the door.' }] },
    { id: 'xn.6', turns: [{ by: 'c', dr: "{a} and {b} are planning to come after me. I heard it with my own ears." }] },
  ],
  'texture.rant.scene': [
    { id: 'xr.1', turns: [{ by: 'a', dr: "I came in here to be calm. Then I started talking about {target}. So much for calm." }] },
    { id: 'xr.2', turns: [{ by: 'a', dr: "I'm not mad. I'm really not. Okay, I'm mad. And it's {target}." }] },
    { id: 'xr.3', turns: [{ by: 'a', dr: "I keep practising what I'll say to {target}. The polite version is never leaving this room." }] },
    { id: 'xr.4', turns: [{ by: 'a', dr: "Living with {target} is harder than trying to vote {target} out. Maybe it's time to try both." }] },
    { id: 'xr.5', turns: [{ by: 'a', dr: "Every day, {target} does something that drives me up the wall. I've had enough." }] },
    { id: 'xr.6', when: { early: false }, turns: [{ by: 'a', dr: "I've been nice about {target} for weeks. I'm done being nice." }] },
    { id: 'xr.7', turns: [{ by: 'a', dr: "Can I just say something about {target}? Thank you. I'll be here a while." }] },
  ],
  'texture.letter.scene': [
    { id: 'xl.1', turns: [{ by: 'a', say: "Can I read you a bit of my letter?" }, { by: 'b', say: "Of course." }, { beat: '{a} reads one paragraph and has to stop.' }] },
    { id: 'xl.2', turns: [{ beat: '{b} finds {a} on the floor with the letter open.' }, { by: 'a', say: "I'm fine. Happy tears." }, { by: 'b', say: "Budge up." }] },
    { id: 'xl.3', turns: [{ by: 'a', say: "I wasn't going to cry. I'm crying." }, { by: 'b', say: "Everyone cries at the letter. Everyone." }] },
    { id: 'xl.4', turns: [{ by: 'a', say: "Will you finish reading it? I can't." }, { beat: '{b} takes the letter and finishes it quietly.' }] },
    { id: 'xl.5', turns: [{ by: 'a', dr: "I wanted to share the letter with someone. {b} was the first person I thought of." }] },
    { id: 'xl.6', turns: [{ by: 'b', dr: "{a} read me the letter from home. For ten minutes, nobody was thinking about the vote." }] },
    { id: 'xl.7', turns: [{ by: 'a', say: "Look at this photo." }, { by: 'b', say: "That's lovely. You must miss home." }, { by: 'a', say: "Every day." }] },
  ],
};
