// Authored chat voices for reading transcripts (Plan 3a+ Task 14). Test
// fixtures only: the engine never looks for a sheet by name, it reads the
// fields. Each is a kind of player an author might write, taken from the
// user's example casts. A phrase ending in "," or ":" leads into the message;
// any other phrase stands as its own sentence.
export const VOICE_SHEETS = {
  loudUncle: { register: 'hype', caps: 'all', nicknames: true, rate: 0.45,
    greetings: ['MY BEAUTIFUL PEOPLE!', 'GOOD MORNING MY BEAUTIFUL PEOPLE!'],
    openers: ['Listen to me,', 'Sweetheart,'], fillers: ['forgetaboutit'] },
  psychic: { register: 'formal', ellipses: true, rate: 0.45,
    openers: ["I'm sensing something today.", 'The cards are saying a lot this morning.', 'The energy in here is shifting.'] },
  boardChair: { register: 'formal', rate: 0.5,
    openers: ['Per my last message,', "Let's circle back.", 'Friendly reminder:'], signoffs: ['Thanks! {e:smile}'] },
  wrestler: { register: 'hype', caps: 'often', rate: 0.5,
    openers: ['THE RATTLESNAKE STRIKES!', 'Hear me, Circle!'], fillers: ['brother'], signoffs: ['OOOH YEAH!'] },
  cuddler: { register: 'warm', rate: 0.45,
    greetings: ['Sending everybody a big hug {e:hug}'], openers: ["How's your heart today?"], fillers: ['love'] },
  showgirl: { register: 'flirty', rate: 0.45, brackets: ['[takes a bow]', '[blows a kiss]', '[exits stage left]'],
    fillers: ['doll'], signoffs: ['Thank you, thank you very much.'] },
  // A grandmother catfishing as somebody young: her own words leak through.
  grandma: { register: 'hype', rate: 0.35, fillers: ["let's gooo"], leaks: ['Love, Grandma', 'Bless your heart', 'sweetheart'] },
};

/** Which synthetic cast member carries which sheet in the transcript. */
export const VOICE_CAST = { Frank: 'loudUncle', 'Yu Ling': 'psychic', Raven: 'boardChair', Chris: 'wrestler', Sammie: 'cuddler', Kyle: 'showgirl', Chloe: 'grandma' };

/** How some personas in the fixture Catfish Pool talk (persona.chatVoice):
 *  what the catfish has to keep up. */
export const PERSONA_VOICES = {
  Rebecca: { register: 'warm', fillers: ["y'all", 'bless'], rate: 0.4 },
  Adam: { register: 'hype', openers: ["Let's gooo!"], fillers: ['bro'], rate: 0.4 },
  Carol: { register: 'flirty', signoffs: ['xo'], rate: 0.35 },
};
