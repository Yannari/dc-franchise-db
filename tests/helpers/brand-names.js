// Brand, product, platform and event names no generated line may carry (the
// user, 2026-10-22: "dont use brand names again"). The simulator is its own
// world: "a takeaway", "the phone", "a dating app", never the real name.
// Matched as whole words, case-blind. Grows whenever one is found.
export const BRAND_NAMES = [
  // shops, food and drink
  'tesco', 'sainsbury', 'asda', 'lidl', 'aldi', 'waitrose', 'primark', 'greggs', "nando's", 'nandos', 'mcdonalds', "mcdonald's",
  'starbucks', 'costa', 'kfc', 'burger king', "domino's", 'dominos', 'subway', 'pret', 'deliveroo', 'just eat', 'uber eats',
  'coca-cola', 'coke', 'pepsi', 'red bull', 'pringles', 'haribo', 'nutella', 'cadbury', 'kitkat', 'mars bar', 'doritos',
  'walkers crisps', 'prosecco', 'aperol', 'baileys', 'smirnoff', 'jagermeister', 'jägermeister', 'bacardi', 'heineken',
  'budweiser', 'corona', 'malibu', 'tango',
  // apps, sites, tech
  'instagram', 'insta', 'tiktok', 'snapchat', 'facebook', 'twitter', 'whatsapp', 'youtube', 'netflix', 'spotify', 'google',
  'tinder', 'hinge', 'bumble', 'uber', 'amazon', 'iphone', 'ipad', 'apple watch', 'samsung', 'airpods', 'xbox', 'playstation',
  'nintendo', 'fifa', 'zoom', 'onlyfans',
  // clothes, beauty, cars, travel
  'gucci', 'prada', 'chanel', 'louis vuitton', 'versace', 'rolex', 'nike', 'adidas', 'zara', 'asos', 'boohoo', 'superdrug',
  'boots', 'sephora', 'botox', 'range rover', 'ferrari', 'lamborghini', 'ryanair', 'easyjet', 'airbnb',
  // films, toys, events, other shows
  'disney', 'barbie', 'lego', 'ikea', 'monopoly', 'jenga', 'olympics', 'world cup', 'premier league', 'champions league',
  'love island', 'big brother', 'the traitors', 'drag race', 'total drama', 'eurovision', 'glastonbury', 'ibiza', 'magaluf',
];

/** The brand names a line carries ("Walking boots" is not Boots: a whole word, and boots alone is checked by context). */
export function brandsIn(text) {
  const t = ` ${String(text).toLowerCase()} `;
  return BRAND_NAMES.filter(b => {
    if (b === 'boots') return /\bboots\b/.test(t) && !/\b(walking|wellington|football|hiking|riding|knee-high|ankle|cowboy|wellie|snow|running) boots\b/.test(t) && /\b(at|from|in) boots\b/.test(t);
    if (b === 'corona' || b === 'malibu' || b === 'tango' || b === 'zoom' || b === 'subway' || b === 'costa' || b === 'pret' || b === 'insta') {
      return new RegExp(`(^|[^a-z])${b}([^a-z]|$)`).test(t) && /[A-Z]/.test(String(text).match(new RegExp(b, 'i'))?.[0]?.[0] || '');
    }
    return new RegExp(`(^|[^a-z])${b.replace(/[.*+?^${}()|[\]\\']/g, m => `\\${m}`)}([^a-z]|$)`).test(t);
  });
}
