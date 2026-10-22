import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { challengeCast } from './helpers/ch-cast.js';
it('stakes', () => {
  for (const [seed, options] of [[5, {}], [9, { finalPass: 'skull', redemption: true }], [21, { finalPass: 'ring', redemption: true }], [33, { redemption: true }]]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options });
    const st = r.state;
    const kinds = {};
    for (const s of st.scenes) if (/^(bank|injury|power|pass|redemption|ranking|money)/.test(s.kind)) kinds[s.kind] = (kinds[s.kind] || 0) + 1;
    const bank = Object.entries(st.bank).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n, v]) => `${n} ${v}`).join(', ');
    const places = Object.values(r.placements).sort((a, b) => a - b);
    const dup = places.filter((p, i) => places.indexOf(p) !== i);
    console.log('SEED', seed, JSON.stringify(options), 'eps', st.episodes.length, 'finalists', st.final?.finalists?.length, 'champs', (st.champions || []).join('/'));
    console.log('  kinds', JSON.stringify(kinds));
    console.log('  bank', bank);
    console.log('  ranks', st.scenes.filter(s => s.kind === 'power-rankings').map(s => (s.data.drop ? 'D' : '-') + (s.data.passer ? 'P' : '-') + (s.data.rise ? 'R' : '-')).join(' '));
    console.log('  skulls', JSON.stringify(st.skulls), 'cut', JSON.stringify(st.finalEp?.cut));
    console.log('  redemption', JSON.stringify(st.redemption && { returned: st.redemption.returned, out: st.redemption.out.length, left: st.redemption.residents.length }));
    console.log('  places', places.length, 'of', names.length, 'dup', JSON.stringify(dup), 'missing', names.filter(n => r.placements[n] == null).join(','));
    console.log('  injuries', Object.entries(st.injury).map(([n, i]) => `${n}:${i.part}${i.sev}@${i.ep}`).join(' '));
  }
});
