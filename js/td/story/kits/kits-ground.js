// td/story/kits/kits-ground.js — what each character's life has in it, so two people can find out they share it
//
// The user, 2026-10-10: "do we also have bond by backstory?", then "stay true to the character always,
// especially if the character exists in another show". So every tag below is a plain reading of that
// character's roster profile (backstory, personality), and the profile's own words are quoted beside it.
// Nothing is inferred and nothing is added: where a profile says a thing "has not been revealed" (Aaron's
// scar), it isn't here. A character from another show (Total Drama, Disventure Camp) has a profile written
// from that show's canon, so the tags are that canon.
//
// Merged into the kits as `ground` by kits/index.js. A Studio kit can carry its own `ground` (same tags).
// GROUND is the whole vocabulary: a tag not in it is a typo (tests/td-kits.test.js).

export const GROUND = {
  'lost-parent':       'a parent died',
  'widowed':           'their partner died',
  'lost-child':        'their child died',
  'parent-left':       'a parent walked out',
  'estranged':         'cut off from family, or barely speaking',
  'hard-home':         'grew up in a home that was unsafe',
  'strict-parents':    'grew up under strict, controlling parents',
  'golden-child':      'the one the family pinned its hopes on',
  'family-doubts':     'family thinks their path is a mistake',
  'raised-siblings':   'helped raise younger siblings',
  'big-family':        'a big, loud family',
  'twin':              'has a twin',
  'sibling-bully':     'bullied by a sibling',
  'close-sibling':     'a sibling they are close to',
  'grandma':           'close to a grandmother',
  'immigrant-family':  'family that moved countries',
  'moved-countries':   'moved countries themselves',
  'left-home-young':   'left home young, on their own',
  'lonely-child':      'a lonely or friendless childhood',
  'shy-child':         'a shy child',
  'parent':            'has children',
  'grandparent':       'has grandchildren',
  'divorced':          'was married or partnered, and it ended',
  'parents-split':     'their parents split up',
  'came-out':          'came out, and it shaped them',
  'mental-health':     'lives with a mental-health struggle',
  'trauma':            'carries a trauma',
  'needs-money':       'needs the prize, for real',
  'supports-family':   'sends money home, or wants the prize for family',
  'online-fame':       'built a career on social media',
  'performer':         'a performer',
  'drag':              'a drag performer',
  'athlete':           'an athlete',
  'farm':              'grew up on a farm or in a trade family',
  'followed-parent':   'followed a parent into their work',
  'left-school':       'left school or college early',
  'pets':              'an animal person, with pets at home',
  'writer':            'writes',
  'artist':            'makes visual art',
  'career-slipped':    'had success and lost it',
  'underestimated':    'gets written off, and wants to prove otherwise',
  'stuck':             'feels stuck in their life',
  'wealthy':           'comes from money',
  'tight-money':       'grew up without much money',
  'cook':              'cooks, and learned it from family',
};

export default {
  Alejandro: { ground: ['big-family', 'sibling-bully', 'moved-countries', 'wealthy'] }, // "older brothers José and Carlos"; "José's bullying"; "born in Spain, moved to Latin America ... later moved to Canada"; "a successful Hispanic family"
  Bowie: { ground: ['performer', 'athlete', 'came-out'] }, // "a practiced performer"; "basketball-playing student"; "Total Drama's first openly gay contestant"
  DJ: { ground: ['cook', 'pets'] }, // "learned compassion and cooking from the mother he deeply admires, cared for animals"
  Gwen: { ground: ['close-sibling', 'grandma', 'artist'] }, // "has a brother and grandmother", "a nana who shares her taste for hair dye"; "art"
  Julia: { ground: ['online-fame', 'farm'] }, // "built an online identity as a wellness and lifestyle influencer"; "parents Greg and Judy, who ran a bake shop where she worked as a child" (a trade family)
  Mike: { ground: ['mental-health'] }, // "hiding a deeply personal part of his mental-health history"
  Millie: { ground: ['lonely-child', 'writer'] }, // "a lonely childhood"; "An aspiring journalist"
  Thom: { ground: ['close-sibling', 'trauma', 'came-out', 'hard-home', 'parents-split', 'raised-siblings', 'family-doubts'] }, // "a younger brother, Tony, whom he gets along with well"; PTSD; "Tom's parents suspected that he was gay"; wiki: "Tom's father was abusive toward him when he was a child, which led to Jackie leaving him and filing for a restraining order"
  Miriam: { ground: ['widowed', 'lost-child', 'lonely-child', 'athlete', 'pets'] }, // "an elderly widow and bereaved mother whose husband and only son died"; "her family did not understand her and she struggled to fit in"; "sports gave her a sense of purpose"; "a cat named Biscuit"
  Grett: { ground: ['online-fame', 'athlete'] }, // "a public career as a fitness influencer"
  Gabby: { ground: ['pets', 'mental-health', 'family-doubts', 'moved-countries'] }, // "caretaker of a remarkable number of pets"; "intrusive thoughts"; wiki: "her father thinks that her living with Ellie in Canada is just a phase" (from Warsaw)
  James: { ground: ['lonely-child', 'close-sibling', 'online-fame', 'performer'] }, // "few friends beyond his sister"; "a career as an influencer and later an actor"
  Lake: { ground: ['strict-parents', 'writer', 'estranged', 'family-doubts', 'lonely-child'] }, // "grew up under strict parents"; "Chess and writing"; wiki: "a phone call from her parents that resulted in her being disowned"
  Yul: { ground: ['online-fame', 'performer', 'career-slipped', 'strict-parents'] }, // "A dance performance went viral"; "cost him dancing work"; wiki: "his parents forced him to dance on stage"
  Natalia: { ground: ['came-out', 'mental-health'] }, // "Her parents supported her transition; accepting herself as a transgender woman was frightening and liberating"
  Natasha: { ground: [] }, // the profile gives a family background and law school, and nothing that matches the vocabulary
  Aaron: { ground: ['followed-parent', 'family-doubts', 'farm'] }, // "followed his father into logging"; "tension with his father, who believes Aaron should remain with one company"; "a forestry family"
  Amberly: { ground: ['big-family', 'farm', 'left-school'] }, // "youngest of seven children, with six older brothers"; "her family's working cattle farm"; "left high school without graduating"
  Dylon: { ground: ['wealthy', 'family-doubts', 'left-school', 'followed-parent'] }, // "an affluent London family"; "parents ... regard the unfinished degree as an unnecessary blemish"; "left before graduating"; "both of his parents worked in finance"
  Felipe: { ground: ['estranged', 'family-doubts', 'close-sibling', 'came-out', 'career-slipped', 'artist', 'tight-money', 'needs-money'] }, // "barely speaks with his parents"; "considered art an impractical career"; "private contact with his younger brother"; "after Felipe came out as gay"; "his professional reputation did [disappear]"; "a working-class family"; "the prize money is his strongest private motivation"
  Gyselle: { ground: ['immigrant-family', 'moved-countries', 'online-fame', 'left-school', 'underestimated'] }, // "to Ghanaian parents who had immigrated"; "her family moved to Los Angeles"; "momentum through social media"; "chose to focus on modeling rather than attend college"; "prove that she has substance beyond her appearance"
  Harriett: { ground: ['twin', 'immigrant-family'] }, // "alongside her twin sister, Jane"; "immigrant grandparents"
  Jane: { ground: ['twin', 'immigrant-family', 'writer', 'family-doubts', 'shy-child', 'came-out'] }, // "her twin sister, Harriett"; "immigrant grandparents"; "aspiring novelist"; "The rest of the family is more dismissive"; "speak roughly twenty words on an average day"; "openly bisexual with her family"
  Hasan: { ground: ['lost-parent', 'raised-siblings', 'big-family', 'immigrant-family', 'moved-countries', 'supports-family', 'needs-money'] }, // "His father died when he was young"; "Hasan helped with childcare ... household responsibilities"; "the oldest of four children"; "moved to Chicago in early childhood"; "support his family"
  Ireland: { ground: ['hard-home', 'estranged', 'left-home-young', 'left-school', 'needs-money'] }, // "an abusive household"; "cut contact with her family"; "At 16 ... moved alone to Las Vegas"; "left school without graduating"; "The prize is Ireland's primary reason"
  Joel: { ground: ['big-family', 'athlete', 'pets', 'underestimated'] }, // "a large, loud, sports-obsessed Florida family"; "played football"; "Joel's dog, Lola"; "sensitive to the 'dumb jock' label"
  Jules: { ground: ['parent-left', 'raised-siblings', 'left-home-young', 'supports-family', 'tight-money'] }, // "his father abandoned the family"; "caring for his younger siblings"; "At 18, Jules moved to New York City"; "sends money to his mother and siblings"; "Money became tight"
  Misha: { ground: ['grandma', 'athlete', 'needs-money'] }, // "close to her maternal grandmother, whom she calls Nana"; "a strong semi-professional surfer"; "to win money for travel, competition fees"
  Nico: { ground: ['parent', 'divorced', 'big-family'] }, // "his 12-year-old daughter, Canzada"; "with his former partner"; "a large Italian American family"
  Stella: { ground: ['parent', 'stuck'] }, // "their two children, both of whom are under five"; "an experience that belongs solely to her"
  Tobias: { ground: ['family-doubts', 'online-fame'] }, // "his father would prefer that Tobias attend college"; "turned streaming into his full-time job"
  Zella: { ground: ['performer', 'family-doubts'] }, // "lead singer and rhythm guitarist"; "regularly argue with her about money, rehearsal noise, late nights"
  Aubrey: { ground: ['shy-child', 'pets'] }, // "much shyer as a child"; "a Siamese cat named Ziggy"
  Ara: { ground: ['immigrant-family', 'golden-child', 'cook', 'strict-parents'] }, // "her parents left Korea for love"; "regarded as the golden child in her family"; "she enjoyed ... cooking"
  Bruno: { ground: ['immigrant-family', 'pets', 'shy-child'] }, // wiki: his mother "is from Puno, Peru", his father "from Huancavelica, Peru"; "one of fourteen characters who have pets"
  Dunia: { ground: ['came-out', 'pets', 'left-school'] }, // wiki: "Dunia's word of advice is that the closet can be a lonely place to reside"; "one of fourteen characters who have pets"
  Ernesto: { ground: ['parent', 'grandparent', 'cook'] }, // "has children, and is a grandfather"; "helped his mother make gazpacho"
  Evie: { ground: ['wealthy', 'underestimated', 'lost-parent'] }, // "extreme inherited wealth"; "feeling judged as someone who had never worked"; wiki: her mother's saying, "back when she was still alive"
  Finn: { ground: ['performer', 'big-family'] }, // "a young performing-arts student"; wiki: "four older siblings, making him the youngest of five children"
  Manu: { ground: ['parents-split', 'close-sibling', 'divorced'] }, // "His father Fetuu divorced his biological mother Naomi"; "a close bond with his younger brother Aleki"
  Nura: { ground: ['stuck', 'writer', 'needs-money'] }, // the user, 2026-10-11: she needs the prize to become a playwright, a cashier for now; "felt stuck, wanting something more"; "a habit of writing"; wiki: "her true dream of becoming a writer"
  Oliwia: { ground: ['lonely-child', 'pets', 'big-family', 'underestimated'] }, // "difficult for her to make friends"; "She kept many pets"
  Ren: { ground: ['artist', 'athlete', 'left-school'] }, // "a graphic designer with a background in acrobatics"
  Sami: { ground: ['widowed', 'estranged'] }, // wiki (Sam): it was "his husband's favorite" season, now "technically" single; "does not speak much with his family"
  Spencer: { ground: ['close-sibling'] }, // wiki: "he spent a lot of time with Alice in-between seasons"; he and his sisters "would swipe a few pounds from their parents' wallets"
  Zoey: { ground: ['lonely-child', 'pets'] }, // wiki: "Born an only child in a small town ... did not have many friends"; "a pet hamster", "an unnamed cat"
  'Anita Crown Davenport': { ground: ['drag', 'underestimated'] }, // "frequently landing First Alternate", "desperate for validation"
  Autumnatic: { ground: ['drag', 'performer'] }, // "a beloved staple of the underground New York drag scene"
  'Cheryl Hole': { ground: ['drag'] }, // "the lively club scene of Essex", a drag queen ("every lip sync for her life")
  Cupcakke: { ground: ['drag', 'underestimated'] }, // "local queens often dismissed her as a novelty act"
  'Gigi Cherie': { ground: ['drag', 'artist'] }, // "performed experimental mime shows ... while designing costumes"
  'Ginger Hollywood': { ground: ['drag', 'performer'] }, // "one of Los Angeles' most dependable drag entertainers"
  'Marge Stache': { ground: ['drag', 'performer'] }, // "performing character comedy in improv theatres"
  'Minnie Skurr': { ground: ['drag', 'athlete', 'underestimated'] }, // "competing in jazz, hip-hop, and cheer-dance competitions"; "prove that being young and polished does not make her disposable"
  'Paige Turner': { ground: ['drag', 'performer'] }, // "began performing in neighborhood bars more than twenty years before"
  Quin: { ground: ['drag', 'artist', 'underestimated'] }, // "studied contemporary visual art"; "treated as a mannequin rather than a creative artist"
  Riot: { ground: ['drag'] }, // "began developing a full drag character only two years before"
  'Sharon Needles': { ground: ['drag', 'performer'] }, // "producing underground horror revues"
  Taystee: { ground: ['drag', 'underestimated'] }, // "repeatedly struggled to get signed by agencies"
  'Velvet Vixen': { ground: ['drag', 'athlete', 'underestimated'] }, // "training in jazz, contemporary dance, hip-hop, Bollywood, and bhangra"; "auditions that treated her as interchangeable"
};
