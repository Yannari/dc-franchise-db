// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/about.js — each place, presented by Don over its own wide shots
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-20: "we need presentation of the actual place with a description and image by don". Before a leg
// opens, Don says what the place is: one line a shot, over the place's wide shots (the user's plates), the way the
// show cuts to the location before the first team arrives. No real place names (the world is its own).
//
// aboutOf(place): [{ plate, text }] (the plate as plates.js knows it, else a plate nobody stands on).
import { PLACE_PLATES } from './plates.js';

export const ABOUT = {
  'home-city': {
    tag: "A lake city in the north, and the starting line of the race.",
    facts: ["Home of the city tower, the tallest thing for a very long way.", "The lake is beautiful all year round, and colder than it looks.", "The geese here are famous, and not for being friendly."],
    say: "Every race has to start somewhere, and this one starts right here in Home City!",
    shots: [
      ["present-9434583", "The skyline on the lake", "Home City! A skyline on a lake, one very tall tower, and the starting line of the race."],
      ["arrive-9434588", "The old central station", "Teams come in at the old central station, take a good look around, and say goodbye to normal life."],
      ["task-9434810", "The foot of the city tower", "This is the city tower, and our teams are about to get to know it a lot better than they'd like.", true],
      ["task-9435028", "A cable over the lake", "See that wire running out over the water? Remember it, because that's all I'm going to say.", true],
      ["travel-9435210", "The island airport", "And past the tower, there's a little island airport, where the rest of the world is waiting."],
    ] },
  'red-sand-desert': {
    tag: "A sea of red dunes, with an old market town on its edge.",
    facts: ["It hasn't rained here in a very long time, and nobody misses it.", "The market on the edge of town has been trading for hundreds of years.", "Camels are the fastest way across the sand, and they know it."],
    say: "I hope you packed sunscreen, because welcome to the Red Sand Desert!",
    shots: [
      ["present-9435500", "Dunes as far as you can see", "This is the Red Sand Desert, with dunes as far as you can see and the sun doing its absolute best."],
      ["arrive-9435392", "The last bus stop before the sand", "This is the last bus stop before the sand, and after this, it's camels or walking."],
      ["task-9435287", "The old market", "Somewhere in this market is the smell of the next tip, so try not to sneeze.", true],
      ["task-9435484", "A kitchen in the middle of nowhere", "Way out in the dunes there's a kitchen, and the chef has been cooking all morning. For you.", true],
      ["present-9435572", "The camel road", "Somewhere out here are a lot of camels, and every single one of them has opinions."],
      ["chill-9434777", "An oasis, with shade", "And at the end of it all, the only shade for fifty kilometres. Teams will want it."],
    ] },
  'iron-tower-city': {
    tag: "An old river city of caf\u00e9s, painters and one very big iron tower.",
    facts: ["The iron tower was only meant to stand for a few years, and nobody ever took it down.", "There are more museums here than there are days in the year.", "Under the streets runs a maze of tunnels that's older than the city above it."],
    say: "Welcome to the most romantic city in the race, where the bread is long and the stairs are longer!",
    shots: [
      ["present-9435854", "The iron tower, lit up at night", "Iron Tower City, the most romantic city in the world. Unless you're racing through it. Then it's just stairs."],
      ["arrive-9435851", "A caf\u00e9 on every corner", "Every street here has a caf\u00e9, a painter and somebody carrying bread longer than their arm."],
      ["travel-9436549", "The great arch", "The avenues are wide, the arches are grand, and the traffic follows no rules at all."],
      ["task-9435855", "The foot of the tower", "Somebody is waiting at the foot of the tower with a pencil, and that's all you get.", true],
      ["task-catacombs", "Tunnels under the city", "And under the city there are tunnels lined with things I won't describe before lunch.", true],
      ["present-9436193", "The palace by the river", "Museums, painters on every corner, and a river running right through the middle of it all."],
    ] },
  'great-wall-hills': {
    tag: "Green mountains, a very long wall, and a city with a huge stadium.",
    facts: ["The wall was built over hundreds of years, one stone at a time.", "The street stalls here cook all day and most of the night.", "The roofs curl up at the corners to keep bad spirits off."],
    say: "From the mountains to the markets, this is Great Wall Hills!",
    shots: [
      ["present-9440465", "The wall on the mountains", "Great Wall Hills: green mountains, and a wall that goes on for thousands of kilometres."],
      ["task-9440340", "Red roofs and dragons", "Every roof here has a dragon on it, for luck, and our teams are going to need some."],
      ["task-9440310", "Inside the great stadium", "This is the great stadium, and today nobody is coming in through the gates.", true],
      ["task-9440338", "A street food stall", "This stall sells things you have never eaten, and maybe things you never wanted to eat.", true],
      ["task-9440527", "The mountain road", "And this road goes up, and up, and up. I'm so glad I'm not walking it.", true],
      ["task-9440641", "Steps along the wall", "The wall runs for thousands of kilometres, and luckily our teams only need a little bit of it."],
    ] },
  'rock-north': {
    tag: "A snowy northern town that loves its saunas and its loud guitars.",
    facts: ["In winter the sun comes up for a few hours, if it feels like it.", "Almost every house here has a sauna, and some have two.", "The locals take rock music very, very seriously."],
    say: "Grab a coat and turn it up to eleven, because this is Rock North!",
    shots: [
      ["present-9440796", "Snow on every roof", "Rock North! Snow, cabins, saunas, and a town that's very, very serious about loud guitars."],
      ["present-9440799", "The old house on the hill", "Up the hill there's an old wooden mansion, and the lamps stay on all day because the sun barely bothers."],
      ["task-9440922", "A wooden hut by the river", "Down by the river is a little wooden hut, the warmest place for miles. Enjoy it while you can.", true],
      ["task-9440942", "The river, half frozen", "The river here is half frozen, and the other half is worse.", true],
      ["task-9441025", "A stage in the street", "And in town, there's a stage, a crowd and a lot of very loud speakers. Somebody's performing tonight.", true],
      ["arrive-9440832", "The little airport", "The planes in and out of here are small, and the pilots wear two coats."],
    ] },
  'savanna-falls': {
    tag: "Open grassland, acacia trees and one of the biggest waterfalls in the world.",
    facts: ["You can hear the falls long before you can see them.", "The spray from the water rises so high that it makes its own rain.", "The animals here have right of way. Always."],
    say: "Hold on to your hats, because Savanna Falls is loud, wet and very, very big!",
    shots: [
      ["present-9441413", "One of the biggest falls on the planet", "Savanna Falls is one of the biggest waterfalls on the planet, and it does not care how you feel about heights."],
      ["present-9441461", "The open savanna", "Around it lies the open savanna: acacia trees, long grass, and animals who were here long before the tourists."],
      ["arrive-9441458", "Jeeps at the lodge", "The only way around out here is by jeep, so the lodge keeps a lot of them."],
      ["task-9441568", "The river, just above the edge", "Up here the river looks calm, but it doesn't stay calm for long.", true],
      ["task-9441524", "The waterhole", "This is the waterhole, where the animals come to drink, and some of them are very, very big.", true],
      ["chill-9441823", "A village in the grass", "And at the end of the day, there's a village with cold drinks, for the teams who make it."],
    ] },
  'treasure-isles': {
    tag: "Sunny islands of white sand, warm sea and old pirate legends.",
    facts: ["Pirates hid out here for hundreds of years, and the locals never let you forget it.", "The water is so clear that you can see the bottom from a boat.", "Every island has a story about buried gold, and most of them are made up."],
    say: "Ahoy, racers! Welcome to the Treasure Isles, where the sand is white and the pirates never really left!",
    shots: [
      ["present-9449351", "A cove of white sand", "The Treasure Isles! White sand, warm water, and a lot of people who still talk like pirates."],
      ["arrive-9449521", "The taxi rank", "The taxis here are yellow, slow and very proud of their horns."],
      ["task-9449549", "An old pirate museum", "This museum is full of old maps, old chests and old pirates, and some of them are made of wax.", true],
      ["task-9449576", "Jet skis on the beach", "Those jet skis aren't for the tourists today."],
      ["task-9449759", "Caves under the islands", "Under the islands there are caves, and nobody who goes in comes out dry.", true],
      ["present-9449449", "A beach with one umbrella", "And the Chill Zone? Let's just say the view from it is very, very nice."],
    ] },
  'skyline-finale': {
    tag: "The biggest city of them all, and the end of the race.",
    facts: ["The towers here are so tall that the tops are sometimes in the clouds.", "The streets never get quiet, not even at four in the morning.", "In the middle of it all is a huge green park, and a stage is waiting there today."],
    say: "This is it, racers! The final leg, in the biggest city of them all!",
    shots: [
      ["present-9450080", "The biggest skyline of them all", "This is the Skyline, the biggest city of them all, and the last stop of the race."],
      ["present-9450040", "The square of bright lights", "Billboards, taxis and a hundred thousand people, and every one of them is in a hurry."],
      ["task-9450269", "One very tall building", "Somewhere near the top of one of these, something with a name on it is waiting.", true],
      ["task-9450434", "The boathouse in the park", "In the middle of the city there's a park, and in the park there's a lake. Hold that thought.", true],
      ["task-9450373", "The angel fountain", "The park has fountains, statues and, today, one very big stage."],
      ["present-9450374", "The park and the towers", "This is where the race ends, and where one team becomes a pair of millionaires."],
    ] },
  'tomb-sands': {
    tag: "A sea of sand, with one huge, very old pyramid in the middle.",
    facts: ["The pyramid is older than any other city in the race.", "Nobody knows exactly how many tunnels run beneath it.", "The river is the only water for miles, so everything comes to drink there, including the crocodiles."],
    say: "Welcome to Tomb Sands, racers, where everything is old, sandy or trying to eat you!",
    shots: [
      ["present-22410404", "The great pyramid", "This is Tomb Sands, where a pyramid older than anything you own stands in the sand like it owns the place, and it does."],
      ["present-22410572", "The dunes around it", "All around it there's sand, then more sand, and then, eventually, a river."],
      ["task-22409901", "Inside the tomb", "Inside, it's dark and narrow, and some of the doors were built by people who didn't want visitors.", true],
      ["task-22410503", "A skull in the sand", "Out here, the desert keeps whatever it finds."],
      ["task-22410534", "Reeds by the river", "And down at the river there are tall reeds, and crocodiles with nothing to do all day.", true],
      ["arrive-22410042", "A door into the stone", "Inside the pyramid there are tunnels, traps and the odd mummy. Pick your favourite."],
    ] },
  'torch-statue-harbour': {
    tag: "A busy harbour city with a giant statue holding up a torch.",
    facts: ["The statue is green because it's made of copper, and copper goes green in the rain.", "Ferries cross the harbour all day, every day.", "Under the streets there are old tunnels that nobody has ever mapped properly."],
    say: "Welcome to Torch Statue Harbour, the city that never stops waving!",
    shots: [
      ["present-22412488", "The lady with the torch", "Torch Statue Harbour! The giant lady with the torch has been waving at boats for more than a hundred years."],
      ["present-22413470", "The old bridge", "The bridge has carried people across the harbour for over a hundred years, and it still looks good."],
      ["task-22412320", "Up at the crown", "Way up there the crown has windows, and today somebody's been very busy up there.", true],
      ["task-22412499", "Down in the sewers", "Under the streets run the old sewers, dark, damp and, I'm told, very echoey.", true],
      ["task-park-pond", "The pond in the park", "And in the park there's a pond, with something rather large floating in it.", true],
      ["present-22412601", "The arch in the park", "The park is the green heart of the city, and today it's where the leg ends."],
    ] },
  'red-outback': {
    tag: "A red desert in the middle of nowhere, around one giant rock.",
    facts: ["The great red rock changes colour as the sun goes down.", "Out here, sheep outnumber people by a very long way.", "The nearest town is a day's drive away, on a good day."],
    say: "Welcome to the Red Outback, where the earth is red, the sky is huge and everything is a long way from everything else!",
    shots: [
      ["present-22419827", "The great red rock", "The Red Outback: a giant red rock in the middle of nothing, and a lot of nothing around it."],
      ["arrive-22419610", "Red earth for miles", "Out here the ground is red, the sky is enormous, and there isn't a tree to hide under."],
      ["task-22419889", "A corral on the plain", "Something very fast lives in this corral, and it does not like being caught.", true],
      ["task-22419968", "The edge of the hanging rock", "This is the hanging rock, and it's a very long way down from here. Remember that.", true],
      ["task-22419762", "The sheep station", "Down on the plain there's a sheep station, and the sheep here are very fluffy. For now.", true],
      ["present-22419696", "Night over the outback", "At night the stars come out, and there are more of them here than anywhere else in the race."],
    ] },
  'fire-mountain-isle': {
    tag: "A tropical island with beaches, a lagoon and a live volcano.",
    facts: ["The volcano erupted not long ago, and it's still grumbling.", "The water around the island is warm, clear and full of fish.", "The islanders say the volcano has moods, and they always know which one it's in."],
    say: "Welcome to Fire-Mountain Isle, where the beaches are hot and the mountain is hotter!",
    shots: [
      ["present-22425124", "A volcano by the sea", "Fire-Mountain Isle! A tropical island with a beach, a lagoon and a live volcano. Two out of three are relaxing."],
      ["present-22426250", "The jungle under the mountain", "The jungle runs all the way up the volcano, and it gets hotter the higher you go."],
      ["task-22426413", "A river of lava", "That orange stuff is lava, and it's real, it's hot and it's not going anywhere.", true],
      ["task-22425199", "The waterfall", "On the other side of the island there's a waterfall, which is much nicer. Mostly.", true],
      ["task-22425972", "Something in the water", "And out in the bay there's something old and round floating, and I wouldn't touch it.", true],
      ["chill-22426500", "The crater", "Right at the top is the crater, where the island keeps its temper."],
    ] },
  'coast-palace': {
    tag: "A tiny kingdom on the sea, all cliffs, yachts and royal gold.",
    facts: ["The whole country is smaller than most city parks.", "There are more yachts in the harbour than people living on land.", "The royal family has lived in the same palace for hundreds of years."],
    say: "Welcome to Coast Palace, racers, the smallest and shiniest country in the race!",
    shots: [
      ["present-9436727", "The royal palace", "Coast Palace is a tiny kingdom on the sea, with a royal palace, a casino and more yachts than people."],
      ["present-9436479", "Cliffs over the sea", "The whole country fits on one stretch of cliffs, and every house has a sea view."],
      ["task-9436715", "A yacht in the harbour", "The yachts here are bigger than most people's houses, and some of them carry smaller yachts inside."],
      ["task-9436629", "Out past the cliffs", "Out past the cliffs the water is deep and blue, and something big is swimming around in it.", true],
      ["task-9436921", "The beach below the palace", "And down on the beach, somebody has been very busy with a bucket and spade.", true],
      ["present-9437028", "Sunset on the beach", "When the sun goes down here, even the sea looks expensive."],
    ] },
  'geyser-island': {
    tag: "An island of ice and fire, where the ground boils and steams.",
    facts: ["The water in the hot springs stays warm all year, even in a snowstorm.", "The geysers here go off every few minutes, like clockwork.", "The local food is famous for being an acquired taste."],
    say: "Welcome to Geyser Island, racers, the only place in the race where the ground is hotter than I am!",
    shots: [
      ["present-9437594", "Mountains and lava fields", "Geyser Island: mountains, lava fields, and holes in the ground that shoot boiling water at the sky."],
      ["arrive-9437005", "The harbour, and the ice", "Boats come in through the ice, and the harbour smells of fish and adventure."],
      ["task-9437137", "The geyser field", "These holes go off every few minutes, so stand well back. Or don't, it's your race.", true],
      ["task-9437341", "A hut down in the canyon", "Deep in the canyon there's a little hut, and something is cooking in there. Something strong.", true],
      ["task-9437548", "A cave made of ice", "And behind the frozen waterfall there's a cave that's very, very old.", true],
      ["chill-9436909", "A red house by the shore", "And by the shore, a little red house, with the best view on the island."],
    ] },
  'carnival-rainforest': {
    tag: "A rainforest on the hills above a party city by the sea.",
    facts: ["The rainforest here is home to more kinds of animal than anywhere else in the race.", "The carnival lasts a whole week, and nobody here sleeps for any of it.", "Some of the insects in the forest have the most painful stings on the planet."],
    say: "Put your dancing shoes on, racers, because this is the Carnival Rainforest!",
    shots: [
      ["present-9438215", "Green hills by the sea", "The Carnival Rainforest! Green hills, a jungle full of surprises, and a party that never stops."],
      ["arrive-9437915", "The airstrip in the jungle", "The airport here is a strip of road in the middle of the jungle, and the trees grow right up to it."],
      ["task-9437989", "The forest floor", "Down on the forest floor, the ants are the size of my thumb, and they are not friendly.", true],
      ["task-9437835", "A gorge with a waterfall", "There's a gorge here with a waterfall at the bottom. Somebody always falls in, and I'm counting on it.", true],
      ["task-9438128", "A table full of feathers", "And in a tent at the edge of the trees, a table covered in feathers and sequins. Somebody's getting dressed up.", true],
      ["present-9438171", "The city on the bay", "And at the end of it all, a city on the bay, and a beach where the party has already started."],
    ] },
  'haunted-castle': {
    tag: "A dark mountain land of castles, forests and old legends.",
    facts: ["The castle on the hill is over five hundred years old, and it creaks like it.", "The locals hang garlic over their doors, just in case.", "The town's old gym has trained champions for a hundred years."],
    say: "Good evening, racers, and welcome to the Haunted Castle! Try not to scream.",
    shots: [
      ["present-9438456", "The castle under the moon", "Welcome to the Haunted Castle, with a full moon, a crumbling castle and a legend about a count who never sleeps."],
      ["present-9438330", "The dark woods", "The woods around it have eyes, and some of them are glowing."],
      ["present-9438433", "Rain over the towers", "It rains here most nights, and on the other nights it thinks about it."],
      ["task-9438457", "A hall inside the castle", "Inside the castle there's a hall full of something wooden and person-sized. I'll let you guess.", true],
      ["task-9438665", "An old gymnasium", "And in town there's an old gym with a very strict coach who has never once smiled.", true],
      ["chill-9438461", "The cemetery gate", "The roads are dark, the gates are locked, and nobody here goes out after sunset. Except you."],
    ] },
  'lei-island': {
    tag: "A tropical island of beaches, flowers and very warm welcomes.",
    facts: ["Every visitor gets a necklace of flowers the moment they arrive.", "Couples come from all over the world to get married on the beach.", "The volcano in the hills has been asleep for a thousand years."],
    say: "Welcome to Lei Island, racers, where every hello comes with flowers!",
    shots: [
      ["present-9439460", "Sunset over the island", "Lei Island! Sunsets, palm trees, and the friendliest welcome in the ocean."],
      ["present-9439148", "A beach of white sand", "The beaches here are long and white, and the water is the colour of a swimming pool."],
      ["present-9439132", "The jungle path", "Behind the beach, an old path winds up into the jungle and the hills."],
      ["task-9439101", "Under the old pier", "Under the old pier the water is deep, and there's something shiny at the bottom.", true],
      ["task-9439223", "A clearing on the path", "And in a clearing on the path, the ground is glowing. That's never a good sign.", true],
      ["chill-9439226", "The tiki hut", "And at the end of it all, a tiki hut, and a hammock with my name on it."],
    ] },
  'glass-tower-gulf': {
    tag: "A glittering city on the gulf, where the hotels touch the sky.",
    facts: ["The sail-shaped tower is one of the tallest hotels in the world.", "In summer it gets so hot here that the air shimmers.", "The gold market in the old town sells gold by weight, like vegetables."],
    say: "Welcome to Glass Tower Gulf, racers, where everything is tall, shiny and a little bit too hot!",
    shots: [
      ["present-9439561", "The sail-shaped tower", "Glass Tower Gulf has the tallest, shiniest, sail-shaped hotel in the world, right in the middle of the desert sea."],
      ["arrive-9439667", "The airport by the mountains", "The airport is all glass and air conditioning, which is lucky, because outside it's forty degrees."],
      ["task-9439718", "A long way down the glass", "Every window on that tower needs cleaning, and it's a very long way down.", true],
      ["task-9439713", "A rooftop over the gulf", "And right at the top there's a rooftop with a view of the whole gulf, and something waiting on it.", true],
      ["don-rooftop-pool", "A pool in the sky", "There's a pool up here too, with no edge, which is either relaxing or terrifying."],
      ["chill-9440136", "The gold market", "And in the old town, a market where they sell gold by the kilo."],
    ] },
  'swamp-prison': {
    tag: "An old abandoned prison on the edge of a slow, brown swamp.",
    facts: ["The prison closed decades ago, and nobody ever really cleaned it out.", "The swamp is home to alligators, snakes and some very big mosquitoes.", "The river is so slow that a floating leaf takes a whole day to cross the bayou."],
    say: "Welcome to Swamp Prison, racers, where the only way out is through!",
    shots: [
      ["present-9442102", "The old jail", "Swamp Prison: an old jail on the edge of the bayou, closed for years. Mostly."],
      ["present-9442604", "The prison walls", "The walls are high, the windows are barred, and the paint gave up a long time ago."],
      ["task-9442108", "A cell inside", "Inside, the cells still have their beds, their bars and a lot of very old scratches on the walls.", true],
      ["task-9442380", "The bayou", "Out the back, the bayou is slow, brown and full of things that bite.", true],
      ["task-9442424", "A house in the swamp", "Out on the water there's the odd house on stilts, and nobody's quite sure who lives in them."],
      ["chill-9442555", "A dock with a flag", "And at the end of the river, a dock, a flag and a very welcome bit of dry land."],
    ] },
  'outback-farm': {
    tag: "A wheat farm on red dirt, on the edge of an enormous valley.",
    facts: ["The farm grows enough wheat every year to fill a stadium.", "On a hazy day you can't see the other side of the valley.", "The farmer has worked this land for forty years and has never once taken a holiday."],
    say: "Welcome to Outback Farm, racers, where the fields are gold and the dirt is red!",
    shots: [
      ["present-9442701", "Wheat behind the fence", "Outback Farm is all wheat fields and red dirt, and the farmer here has a very serious problem."],
      ["present-9442822", "Red dirt and grey trees", "Out here the ground is red, and the nearest neighbour is an hour's drive away."],
      ["task-9442852", "The farmhouse and its wheat", "Something has been getting into the farmer's wheat, and the farmer would like it out.", true],
      ["task-9442855", "The old jetty on the dam", "There's a dam by the farm with an old jetty, and somebody small and white is sitting on the end of it."],
      ["travel-9443065", "The edge of the valley", "Past the farm the land just stops, and there's a valley so big you could fly over it."],
      ["present-9442909", "Mountains past the valley", "On the far side there are mountains and a patch of green, and that's where the leg ends."],
    ] },
  'fjord-peaks': {
    tag: "Snowy peaks, deep gorges and an island people proud of their dances.",
    facts: ["The steam trains here have run the same mountain line for a hundred years.", "The rivers in the gorges are so cold they never quite freeze.", "Every village has its own dance, and every dance tells a story."],
    say: "All aboard, racers, for Fjord Peaks, where the mountains are high and the bridges are higher!",
    shots: [
      ["travel-9443418", "A steam train in the mountains", "Fjord Peaks! Steam trains, snowy mountains, and an island people who are very, very proud of their dances."],
      ["arrive-9443367", "The mountain station", "The trains still stop at the old station, the way they have for a hundred years."],
      ["task-9443600", "The gorge and its bridge", "Up the line a bridge crosses a gorge, and the river at the bottom is a very long way down."],
      ["task-9443374", "On the old bridge", "Somebody has set something up on the old bridge today, and it isn't a picnic.", true],
      ["task-9443382", "A stage under a straw roof", "And down by the river there's a stage, a curtain and some elders with very high standards.", true],
      ["chill-9443386", "The lake under the peaks", "And at the end, a lake as blue as a swimming pool, right under the peaks."],
    ] },
  'prairie-ranch': {
    tag: "Wide-open ranch land under big blue mountains.",
    facts: ["The ranch has been run by the same family for five generations.", "The cowboys here still ride out at dawn to check on the cattle.", "The barn dances on a Saturday night can go on until sunrise."],
    say: "Saddle up, racers, and welcome to Prairie Ranch!",
    shots: [
      ["present-9443998", "Big mountains, big skies", "Prairie Ranch: big mountains, big skies, and cowboys who mean every word they say."],
      ["present-9444391", "The open range", "The range out here goes on until it hits the mountains, and then it just goes up."],
      ["task-beans-table", "A long table on the hill", "Somebody has laid a very long table out on the hill, and lunch is going to be a big one.", true],
      ["task-9444134", "The old ranch barn", "Inside the barn there's hay, a bar and something in the corner that has never once lost.", true],
      ["present-9443881", "Cliffs over the plain", "And at the end of the trail, cliffs looking out over the whole plain."],
    ] },
  'ice-floe': {
    tag: "Frozen sea, snowy mountains and endless ice at the top of the world.",
    facts: ["In summer the sun never sets here, and in winter it never rises.", "The sea ice moves a little every day, so no map stays right for long.", "The people here have built houses out of snow for thousands of years."],
    say: "Wrap up warm, racers, because Ice Floe is the coldest stop on the race!",
    shots: [
      ["present-9444530", "The top of the world", "Ice Floe is the top of the world, where the snow never melts and the sea is full of ice."],
      ["arrive-9444551", "The airstrip in the snow", "The planes land on a strip of snow, and the pilots seem very relaxed about it."],
      ["task-9444731", "Open water at the edge of the ice", "At the edge of the ice the sea is still open, and every now and then, something pokes out of it.", true],
      ["task-9445014", "A village of igloos", "And out on the ice there's a whole village of igloos, built by hand, block by block.", true],
      ["task-9445108", "A swan made of ice", "Somebody out here carves swans out of ice, just because they can."],
      ["chill-ice-mat", "The camp on the ice", "And at the end of it, a camp on the ice, and a very welcome heated tent."],
    ] },
  'dragon-isle': {
    tag: "A jungle island that's home to the biggest lizards on the planet.",
    facts: ["The lizards on this island can grow longer than a car.", "The villagers build their houses on stilts, to stay out of reach.", "The jungle is so thick that some of its valleys have never been walked."],
    say: "Welcome to Dragon Isle, where the dragons are real, and, thankfully, mostly asleep!",
    shots: [
      ["travel-9445205", "A green island", "Dragon Isle! A green island where the biggest lizards in the world sleep in the shade."],
      ["arrive-9445132", "Huts on stilts", "The village is built on stilts over the beach, so the high tide and the lizards stay downstairs."],
      ["task-9445138", "Under the stilt huts", "Under the huts, in the shade, something big is sleeping, and it would like to keep sleeping.", true],
      ["task-rug-clearing", "A clearing in the jungle", "And in a clearing in the jungle, there's a pile of something colourful that's taller than a house.", true],
      ["arrive-9445165", "Cliffs by the sea", "The island ends in red cliffs, with the sea crashing at the bottom."],
    ] },
  'neon-desert': {
    tag: "A desert of red rock and sand, with a strip of neon in the middle.",
    facts: ["The strip is so bright that you can see it from the sky at night.", "It hardly ever rains here, and when it does, the whole desert flowers.", "There are more slot machines on the strip than people in the town."],
    say: "Welcome to the Neon Desert, racers, where everything is bright, loud and open all night!",
    shots: [
      ["present-9446140", "Dunes by day", "The Neon Desert: dunes by day, and the brightest strip of lights on the planet by night."],
      ["don-neon-strip", "The strip at night", "When the sun goes down the strip lights up, and nobody here goes to bed."],
      ["don-card-table", "Inside a casino", "Inside, the carpets are red, the lights never dim, and the house always wins."],
      ["task-9445891", "A course in the sand", "Out in the dunes somebody has put flags up all over the sand, and something with wheels is coming.", true],
      ["task-9445798", "An old theatre", "And back in town there's an old theatre with a show tonight, and a guest who doesn't like loud noises.", true],
      ["present-9445818", "The desert at sunset", "Out here the sand goes on forever, and the cactuses are the only locals."],
    ] },
  'pyramid-coast': {
    tag: "Warm sea, tall cliffs and jungle, with an old pyramid in the trees.",
    facts: ["The cliffs here drop straight down into the sea.", "The peppers grown on this coast are some of the hottest in the world.", "The pyramid in the jungle was built over a thousand years ago."],
    say: "Welcome to Pyramid Coast, racers, where it's hot, it's high and it's very, very spicy!",
    shots: [
      ["present-9446346", "A rock tower over the sea", "Pyramid Coast has warm sea, steep cliffs, thick jungle and a sun that never takes a day off."],
      ["arrive-9446385", "The bus with everything on the roof", "The buses here carry people inside and everything else on the roof."],
      ["task-9446542", "A cart on the cliffs", "On top of the cliffs there's a little cart selling something red, green and very, very hot.", true],
      ["present-9446663", "The burro trail", "The trail through the jungle is slow and dusty, and the burros on it are in no hurry at all."],
      ["chill-9446872", "The old pyramid", "And at the end of the trail, an old stone pyramid in the jungle, where the leg ends."],
    ] },
  'stilt-river': {
    tag: "A muddy river with a village on stilts, and jungle hills behind it.",
    facts: ["Every house in the village stands on stilts, to stay above the floods.", "The fish in the river can grow bigger than a person.", "The temples in the hills are older than any city in the region."],
    say: "Welcome to Stilt River, racers! Watch your step, because it's a long way down to the mud.",
    shots: [
      ["present-9447233", "A village on stilts", "Stilt River: a whole village on stilts, above a muddy river."],
      ["arrive-9447014", "The city first", "First there's the city, all fences, traffic and noise, and then the river takes you away from it."],
      ["task-9447243", "The muddy riverbank", "The river here is brown and slow, and it's full of something big with whiskers.", true],
      ["task-9447354", "A hole in the hillside", "Up in the hills there's a hole in the ground, and it goes a lot further than it looks.", true],
      ["present-9447259", "Up into the jungle hills", "Up in the hills it's all palm trees and heat, and the jungle is very good at hiding things."],
      ["present-9447043", "The old temple", "And at the end of the path, an old temple with a face carved into the stone, watching you."],
    ] },
  'frozen-mine': {
    tag: "A frozen lake over an old mine, deep in the snowy north.",
    facts: ["The lake freezes so thick in winter that cars can drive across it.", "The mine went deeper than any other on earth before it closed.", "Every house in town has a sauna, and the locals use it every day."],
    say: "Welcome to the Frozen Mine, racers, where it's cold up top and even colder down below!",
    shots: [
      ["present-9447601", "The frozen lake", "This is the Frozen Mine, where there's a frozen lake, an old mine beneath it and very cold air on top."],
      ["arrive-9447691", "Taxis in the snow", "The taxis here have chains on their tyres and the heaters on full blast."],
      ["task-9447678", "Sails on the ice", "Out on the lake there are boats on the ice. On the ice, not in the water.", true],
      ["task-9447861", "The old mine", "And at the old mine there's a hole that goes down further than anybody likes to talk about.", true],
      ["task-9447866", "The winding wheel", "The mine closed a long time ago, but the old winding gear still turns."],
      ["chill-sauna-mat", "The sauna at the end", "And at the end of the day, a sauna, which is the nicest thing here by a long way."],
    ] },
  'tea-hills': {
    tag: "Green hills of tea terraces, with a little steam train running through.",
    facts: ["Tea has been grown on these hills for over a hundred and fifty years.", "The mist rolls in every afternoon and burns off every morning.", "The little steam train climbs so slowly that people hop on and off as it goes."],
    say: "Welcome to the Tea Hills, racers! Try to keep your cool, and your cup of tea.",
    shots: [
      ["present-9448187", "Tea, as far as you can see", "The Tea Hills: green terraces as far as the eye can see, and every single one of them is covered in tea."],
      ["don-veranda", "A veranda over the valley", "From the old verandas up here, the whole valley disappears into the mist."],
      ["task-tea-terraces", "The terraces", "The terraces go up the hills like giant green steps, and somebody has left baskets out.", true],
      ["task-9448388", "A little blue steam train", "Through the hills runs a little blue steam train that's been puffing up these slopes for a hundred years.", true],
      ["chill-9448671", "The hill station", "And up at the top there's a hill station with a clock that's always five minutes slow."],
    ] },
  'pampas-ranch': {
    tag: "A city of grand old buildings, and endless grassland under the mountains.",
    facts: ["The grassland is so flat that you can see a storm coming hours away.", "The riders out here can throw a rope while galloping at full speed.", "The city's famous dance was born in its old dance halls."],
    say: "Welcome to Pampas Ranch, racers, where the dancing is hot and the grass goes on forever!",
    shots: [
      ["present-9449000", "Grassland under the mountains", "Pampas Ranch! Huge grasslands under huge mountains, and riders who never seem to get off their horses."],
      ["arrive-9448812", "The grand old city", "In the city the buildings are grand, old and very, very yellow."],
      ["task-dance-academy", "A hall with a wall of mirrors", "In town there's a hall with a wooden floor and a wall of mirrors, and the teachers there accept nothing less than passion.", true],
      ["task-9449177", "Out on the grassland", "And out on the grassland, something with long legs and a bad attitude is running around.", true],
      ["present-9449278", "The road to the mountains", "The road out of town runs straight at the mountains and doesn't stop."],
      ["chill-9449230", "A cliff over the plain", "And at the end of the road, a cliff with a view over the whole plain."],
    ] },
  'game-show-city': {
    tag: "A neon city of game shows, where everything flashes and everything is loud.",
    facts: ["More game shows are made here than anywhere else in the world.", "The busiest crossing in town has thousands of people on it at once.", "Some hotels here rent you a sleeping capsule instead of a room."],
    say: "Welcome to Game Show City, racers, where the lights are bright and everybody is a contestant!",
    shots: [
      ["task-22411100", "The scoreboard", "Game Show City, where every street is a set, and every set is louder than the last."],
      ["don-neon-crossing", "The neon crossing", "The crossing in the middle of town is the busiest on the planet, and every billboard on it is shouting."],
      ["arrive-22411160", "A quieter old street", "Away from the lights there are quieter old streets, with little shops and a lot of bicycles."],
      ["don-capsule-hotel", "A capsule hotel", "The hotels here are tiny. You don't get a room, you get a drawer."],
      ["task-22411046", "A game show set", "And in the biggest studio in town there's a game show where the contestants are part of the game.", true],
      ["arrive-22411016", "A very big bowl of rice", "Even the sets are huge here. That's a bowl of rice the size of a bus."],
    ] },
  'ice-river': {
    tag: "A frozen land of snow plains, ice cliffs and a river full of ice.",
    facts: ["The ice river never freezes all the way across, and it never stops moving.", "In the middle of summer the sun is still up at midnight.", "Polar bears cross the snow plain on their way to the sea."],
    say: "Welcome to Ice River, racers, where everything is cold, white and slowly melting!",
    shots: [
      ["present-22411652", "A frozen peak", "Ice River! A frozen peak, a snow plain full of little red flags, and a river of floating ice."],
      ["arrive-22411592", "A plane on the ice", "The only way in is by bush plane, and the runway is a strip of ice."],
      ["task-22411646", "A river of floating ice", "The river here is full of ice drifting past in chunks, and every chunk is melting a little.", true],
      ["task-22411924", "The snow plain", "And past the river there's a snow plain so flat and white that you can't tell where it ends.", true],
      ["task-22412015", "An ice cliff in the sun", "At the far end of it, there are cliffs of ice, glowing in the sun."],
      ["chill-22411653", "The finish on the cliff", "Follow the flags across the snow, and they lead you to the Chill Zone, right on the edge of an ice cliff."],
    ] },
  'snow-peaks': {
    tag: "Snowy mountains, cable cars, and villages that love their music and their sausages.",
    facts: ["The cable cars here have carried people up the mountains for a hundred years.", "Every village has its own traditional dance, and it's very proud of it.", "Every butcher on the mountain has a secret sausage recipe."],
    say: "Welcome to Snow Peaks, racers! Take a deep breath of that mountain air, and then hold it.",
    shots: [
      ["present-22413727", "Rainbows over the mountains", "Snow Peaks: mountains, rainbows, cable cars, and a village that loves a sausage."],
      ["don-mountain-hut", "A hut with a fire", "Every hut on the mountain has a fire going and something melting in a pot."],
      ["present-22413612", "The slopes", "The slopes go on for miles, and the snow is perfect for anything except running."],
      ["task-22413818", "The top of the slope", "At the top of the slope there's a hut where they make something very long, very slowly.", true],
      ["task-22414020", "Two pads on a stage", "And down in the village, two very strange pads on a stage, and some very loud music waiting to start.", true],
      ["chill-22413855", "The finish flags", "And at the bottom, the finish flags, and a hot drink if you're lucky."],
    ] },
  'jungle-ruins': {
    tag: "Ancient stone ruins high on a mountain, with jungle all the way up.",
    facts: ["The city at the top was built without a single wheel or iron tool.", "The jungle around it is home to thousands of kinds of bird.", "Most mornings, clouds roll over the ruins and hide them completely."],
    say: "Welcome to the Jungle Ruins, racers, where the jungle is thick and the history is thicker!",
    shots: [
      ["present-22414265", "An ancient city in the clouds", "These are the Jungle Ruins, an ancient city in the clouds with a jungle all the way up to it."],
      ["arrive-22414256", "An old plane on the road", "The plane lands on the jungle road, and the jungle doesn't move out of the way."],
      ["task-22414359", "The river", "A river runs through the jungle, with a cable across it and something in the water you don't want to meet."],
      ["task-22414793", "A path through the trees", "A trail runs through the trees from the river to the ruins, and the trees were there long before the trail.", true],
      ["task-22414655", "A wall of carvings", "And at the foot of the ruins there's a stone wall full of faces, and some of them are worth a fortune.", true],
      ["chill-22414582", "The top of the ruins", "Right at the very top, the ruins open up onto the sky."],
    ] },
  'glass-pyramid-city': {
    tag: "An old city of art and lights, with a museum under a glass pyramid.",
    facts: ["The museum here holds some of the most famous paintings in the world.", "The tower of lights sparkles for a few minutes every hour after dark.", "There are caf\u00e9s on every corner, and every one of them has tables outside."],
    say: "Welcome to Glass Pyramid City, racers, where the art is priceless and the clumsy are very, very nervous!",
    shots: [
      ["present-22414919", "The tower of lights", "Glass Pyramid City: a tower of lights, a museum with a glass pyramid, and the most famous art in the world."],
      ["don-pavement-cafe", "A caf\u00e9 on the square", "Every square here has a caf\u00e9, and every caf\u00e9 has a view of something old and beautiful."],
      ["chill-22415411", "The glass pyramid", "Tonight the museum is closed to everyone except you, so please don't break anything again."],
      ["task-22415175", "A gallery inside", "Inside the museum, somebody has been very careless with one of the exhibits.", true],
      ["task-museum-runway", "The grand hall", "And in the grand hall, somebody has set up lights, chairs and a very long, very white walkway.", true],
      ["task-22415189", "A painting of sunflowers", "The paintings on these walls are worth more than everything every team owns put together."],
    ] },
  'fishing-cove': {
    tag: "A grey, windy cove where the fishermen have seen it all twice.",
    facts: ["The boats here go out before sunrise, whatever the weather.", "Icebergs drift past the cove every spring.", "Visitors are welcome, but only once they've been properly welcomed."],
    say: "Welcome to Fishing Cove, racers! Mind the rocks, mind the fish, and mind your manners.",
    shots: [
      ["present-22415793", "Rocks in a cold sea", "Fishing Cove has grey rocks, a cold sea and fishermen who have seen everything twice."],
      ["task-22415659", "Boats in the bay", "The little boats go out every morning and come back with whatever the sea felt like giving."],
      ["task-22415804", "Icebergs offshore", "And yes, those are icebergs, just floating past, like that's a normal thing."],
      ["arrive-22415967", "A red shack on the beach", "Down on the beach there's a little red shack, and a fisherman inside it has been expecting you.", true],
      ["don-fish-kitchen", "A kitchen by the sea", "In this cove, every kitchen smells of fish, coffee and wet boots."],
      ["chill-22416099", "The cove from the hill", "To be welcome here you drink what they drink, say what they say, and kiss what they kiss. It's a fish."],
    ] },
  'cliff-pool-isle': {
    tag: "A sunny island of waterfalls, cliffs and turquoise pools.",
    facts: ["The waterfalls here fall straight into the sea.", "The islanders built their own sled track on the hillside, out of wood and concrete.", "The water is so warm that people swim at midnight."],
    say: "Welcome to Cliff Pool Isle, racers, where the water is warm and the drops are long!",
    shots: [
      ["present-22416412", "Waterfalls into the sea", "Cliff Pool Isle! Waterfalls into turquoise pools, and cliffs high enough to make you think twice."],
      ["arrive-22416267", "A white beach", "There's a white beach, a lot of sun, and nobody here seems to be in a hurry."],
      ["task-22416440", "The bottom of the lagoon", "At the bottom of the lagoon under the falls, there's something worth diving for.", true],
      ["task-22416594", "A wooden track on the hill", "And up on the hillside there's an old wooden track that should probably have been closed years ago.", true],
      ["present-22416727", "An old plane at sunset", "At sunset the old planes on the airstrip glow orange, and the whole island goes quiet."],
      ["chill-22416513", "The resort pool", "And at the end of the day, a resort with a pool, a slide and a deckchair with your name on it."],
    ] },
  'twin-tower-bridge': {
    tag: "An old foggy city on a river, with a fortress full of treasure.",
    facts: ["The fortress by the river is nearly a thousand years old.", "The red buses here have two floors, and the top one has the best seats.", "The guards at the fortress aren't allowed to smile while on duty."],
    say: "Good evening, racers, and welcome to Twin Tower Bridge, where the fog is thick and the guards are stiff!",
    shots: [
      ["present-22417609", "The bridge with two towers", "Twin Tower Bridge is a city of fog, double-decker buses and a bridge with a tower at each end."],
      ["arrive-22417628", "A red double-decker", "The buses here have two floors, and the drivers take the corners very fast."],
      ["present-22417669", "The old fortress", "That's the fortress, which has guarded the city's treasure for centuries, and tonight something is missing.", true],
      ["task-22417886", "Down in the dungeon", "Under the fortress there are dungeons, and somebody has been leaving notes down there.", true],
      ["task-22417865", "A table full of treasure", "And deep in the vault, a table covered in gold, and not all of it is real.", true],
      ["don-pub", "An old pub with a fire", "After all that, every corner here has a pub with a fire, and you'll want one."],
    ] },
  'marble-temple-hill': {
    tag: "An ancient hill of marble temples, where the first games were held.",
    facts: ["The temple at the top has stood for nearly two and a half thousand years.", "The first athletes here competed with no shoes and no clothes.", "Winners were given a crown of olive leaves, and nothing else."],
    say: "Welcome to Marble Temple Hill, racers, where the games are ancient and the rules are older!",
    shots: [
      ["present-22418524", "The temple on the hill", "Marble Temple Hill, where the first games were held thousands of years ago."],
      ["Ancient temple with empty stone steps", "The temple steps", "The temple is older than almost anything else in the race, and it still looks good."],
      ["task-22418528", "The old track", "Down in the old stadium, there's a sandy track and some things standing across it.", true],
      ["task-22418529", "A bar across the sky", "Beside the track there's a bar set very high, higher than most people's heads.", true],
      ["task-22418324", "Among the columns", "And among the columns, a dusty arena that has been waiting a very long time for a contest.", true],
      ["chill-22418530", "The finish line", "And at the end of it all, a finish line, a flag and a lot of very old stones."],
    ] },
  'secret-base-desert': {
    tag: "A dark desert where, officially, there is absolutely nothing at all.",
    facts: ["Officially, nothing has ever crashed out here.", "The base out in the desert doesn't appear on any map.", "People in the nearest town keep their telescopes pointed at the sky."],
    say: "Welcome to the Secret Base Desert, racers! Officially, you're not here, and neither am I.",
    shots: [
      ["present-22418960", "A rock under the stars", "This is the Secret Base Desert, where, officially, there is nothing out here at all."],
      ["arrive-22418994", "The base on the horizon", "Unofficially, there's a base with searchlights, radar dishes and a lot of very serious guards."],
      ["task-22419053", "A fence with wire on top", "The fence buzzes, the signs say keep out, and our teams are going to ignore both.", true],
      ["task-22419433", "Inside the hangar", "Inside the hangar there are crates, machines and something that fell from the sky a long time ago.", true],
      ["don-trailer-roof", "A trailer in the desert", "Out here, some people live in trailers, watching the sky all night."],
      ["chill-desert-night-mat", "The desert at night", "And out in the dark, a Chill Zone that, officially, doesn't exist."],
    ] },
  'fjord-sea': {
    tag: "Cold water, snowy mountains and the old home of the great wooden ships.",
    facts: ["Longships sailed out of these waters over a thousand years ago.", "The sea here is so cold that it can freeze around a boat overnight.", "The locals put meatballs in almost everything, and they're proud of it."],
    say: "Welcome to Fjord Sea, racers! Grab an oar, because the only way around here is by boat.",
    shots: [
      ["arrive-22420234", "Ice on the water", "Fjord Sea! Cold water, snowy mountains, and longships that sailed here a thousand years ago."],
      ["present-22420232", "Mountains over the fjord", "The mountains here come straight down into the sea, and the sea is very, very cold."],
      ["task-22420280", "A heap of planks on the shore", "Somebody has left a very big heap of wood on the shore, with an instruction sheet that's only pictures.", true],
      ["task-22420282", "Shields on the shore", "There are shields in that heap too, and something heavy and made of iron.", true],
      ["don-fjord-cabin", "A cabin with a fire", "Every cabin on the fjord has a fire, a view and a pot of something warm."],
      ["chill-buoy-mat", "A dock by the buoy", "And out on the water, a dock by a bright orange buoy. You'll need to row there."],
    ] },
  'great-falls': {
    tag: "Huge waterfalls on a river, with a town of wedding chapels on the edge.",
    facts: ["Millions of litres of water go over the edge every second.", "More couples get married here every year than in any other town in the race.", "On a sunny day there's always a rainbow in the spray."],
    say: "Welcome to Great Falls, racers, where the water is loud and the love is louder!",
    shots: [
      ["present-22421498", "The great falls", "At Great Falls, millions of litres of water go over the edge every second, and there's a town full of wedding chapels right beside it."],
      ["task-22421517", "Swans on the river", "Below the falls, the river is calm enough for swans, and some of them are made of plastic."],
      ["task-22421546", "An old theatre", "In town there's an old theatre turned into a wedding chapel, with something big and shiny on the stage.", true],
      ["task-22421939", "A rope across the falls", "And right over the falls, there's a rope stretched across the gorge. Just hanging there.", true],
      ["don-honeymoon-suite", "The honeymoon suite", "The hotels here are all honeymoon suites, with heart-shaped everything."],
      ["chill-falls-mat", "A deck by the falls", "And at the end, a deck right by the falls, so close you'll get wet."],
    ] },
  'bamboo-wall-hills': {
    tag: "Bamboo forests, misty mountains and a wall that runs along the ridges.",
    facts: ["The bamboo here can grow taller than a house in a few months.", "The monks at the temple ring the same gong every evening.", "The banquets here have dishes that are older than most countries."],
    say: "Welcome to Bamboo Wall Hills, racers, where the hills are steep and the food is brave!",
    shots: [
      ["present-22422729", "The wall on the ridge", "Bamboo Wall Hills: bamboo forests, an ancient wall, and monks who have been ringing the same gong for centuries."],
      ["present-22422490", "Purple mountains in the mist", "Beyond the wall there are purple mountains, and most mornings they're hidden in mist."],
      ["task-22422301", "Steps along the wall", "The wall goes up the hill in steep stone steps, from one watchtower to the next.", true],
      ["task-eating-table", "A long banquet table", "And at the end of the wall, a long banquet table, and the cook is still cooking.", true],
      ["don-tea-room", "A tea room by the wall", "There's a tea room by the wall, with the best view in the hills."],
      ["arrive-22422216", "A rickshaw and a donkey", "The roads here are narrow, and the traffic is mostly donkeys."],
    ] },
  'grass-savanna': {
    tag: "Golden grassland under flat-topped trees, and a village in the middle of it.",
    facts: ["The grass here can grow taller than a person by the end of the rains.", "The village has grown the same plums for generations.", "Most of the animals out here are faster than anything on two legs."],
    say: "Welcome to the Grass Savanna, racers! Keep your eyes open, because something out there is watching.",
    shots: [
      ["present-22423390", "Golden grass to the hills", "The Grass Savanna is golden grass, flat-topped trees and a lot of animals that are faster than you."],
      ["arrive-22422915", "The village huts", "In the middle of it all there's a village of round huts, and the children here are very, very good at football.", true],
      ["task-22422938", "Something balanced on posts", "In a clearing, there's a row of posts with something round balanced on top of each one.", true],
      ["task-22423157", "The tall grass", "And out in the tall grass, something is hiding, and the rangers want to know where.", true],
      ["task-22423089", "Tracks in the dust", "Tracks in the dust here tell you exactly who walked past, and how hungry they were."],
      ["chill-22423238", "A rock in the grass", "And at the end of it, a rock in the shade of the trees, and a long, cold drink."],
    ] },
  'stone-head-island': {
    tag: "A lonely island far out at sea, watched over by giant stone heads.",
    facts: ["The stone heads were carved hundreds of years ago, and nobody's sure how they were moved.", "The island is one of the most remote places in the world.", "Seabirds nest on the rocks here by the thousand."],
    say: "Welcome to Stone Head Island, racers, and try not to stare. They're staring back.",
    shots: [
      ["present-22423539", "An island far out at sea", "Stone Head Island, way out in the ocean, where giant stone heads have watched the sea for a thousand years."],
      ["arrive-22423541", "Rock stacks off the shore", "The coast here is all black rock and white surf, and the plane only lands twice a week."],
      ["task-22423574", "The stone heads", "The heads stand in rows along the beach, and there's something hidden in the cracks.", true],
      ["task-22423848", "A rock spire", "And on top of that very tall rock, there's a very big nest. Somebody lives up there.", true],
      ["task-22423850", "The nest", "Whoever built this nest is big, has wings, and is very protective."],
      ["task-22423611", "A cave by the shore", "And at the end of it all, a cave by the sea, out of the wind."],
    ] },
  'badlands': {
    tag: "Striped rock towers and dry riverbeds, with dinosaur bones underfoot.",
    facts: ["The rocks here are millions of years old, and they're full of fossils.", "It can be scorching in the day and freezing at night.", "An old jet came down out here years ago, and nobody ever moved it."],
    say: "Welcome to the Badlands, racers, where the rocks are old, the bones are older, and the sun is not your friend!",
    shots: [
      ["arrive-22424402", "Rock towers in the dust", "The Badlands: rock towers, dry riverbeds, and dinosaur bones under every step."],
      ["Fossil dig site cleared-6", "A dig site in the hills", "Out on the striped hills there's a dig site, and the ground here is full of surprises.", true],
      ["Dinosaur skeleton among desert rocks-8", "Bones in the rocks", "Somebody out here has been putting bones back together, and hasn't quite finished."],
      ["Empty quarry, jet, barrels, and drill rig-9", "An old drilling rig", "Out past the hills there's an old drilling rig, and something is buried under the ground near it.", true],
      ["Moonlit Wreckage with Rising Smoke-3", "The wreck of a jet", "And out past the oil rigs, the wreck of a jet that landed a little harder than it meant to."],
      ["Lantern-lit campfire beside a fossil wall-3", "A camp by the fossils", "And at night, a campfire by the fossil wall, which is where the leg ends."],
    ] },
};

const slugOf = f => String(f).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// the plates of a place, as plates.js knows them (a plate nobody stands on: the presentation is the place alone)
function knownPlates(place) {
  const pl = PLACE_PLATES[place];
  const known = new Map();
  if (!pl) return known;
  const add = p => { if (p?.f && !known.has(p.f)) known.set(p.f, p); };
  add(pl.opener); (pl.arrive || []).forEach(add); (pl.views || []).forEach(add);
  for (const s of Object.values(pl.st)) {
    (s.talk || []).forEach(add); add(s.act); add(s.act2); (s.wide || []).forEach(add); (s.alt || []).forEach(add);
    for (const sd of Object.values(s.sides || {})) { (sd.talk || []).forEach(add); add(sd.act); }
  }
  return known;
}
const plateFor = (known, f) => ({ g: 90, x: [12, 88], ...(known.get(f) || { f }), people: false, mode: undefined, path: undefined, prop: undefined,
  judge: undefined, deco: undefined, fx: undefined, slug: slugOf(f) });

/** The shots a place is presented on: [{ plate, text: Don's line, cap: the caption, tease: a look at a challenge }]. */
export function aboutOf(place) {
  const a = ABOUT[place];
  if (!PLACE_PLATES[place]) return [];
  const known = knownPlates(place);
  const shots = Array.isArray(a) ? a.map(([f, text]) => [f, '', text]) : a?.shots || [[PLACE_PLATES[place].title, '', `${place}`]];
  return shots.map(([f, cap, text, tease]) => ({ plate: plateFor(known, f), text, cap, tease: !!tease }));
}

/** The card a place opens on: { tag, facts: [3], say: Don's line, plate: its first shot, behind the card }. */
export function cardOf(place) {
  const a = ABOUT[place];
  if (!a || Array.isArray(a)) return null;
  return { tag: a.tag, facts: a.facts, say: a.say, plate: aboutOf(place)[0]?.plate || null };
}
