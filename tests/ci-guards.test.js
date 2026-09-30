import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, makePool, circleSetup } from './helpers/ci-cast.js';

const DIR = join(process.cwd(), 'js/ci');
const files = readdirSync(DIR).filter(f => f.endsWith('.js'));
const src = f => readFileSync(join(DIR, f), 'utf8').replace(/\/\/.*$/gm, '');

const KINDS = ['profiles', 'recognise', 'status', 'likes', 'chat', 'circle-chat', 'arrival',
  'after-party', 'ratings', 'hangout', 'blocking', 'visit', 'report', 'goodbye',
  'final-ratings', 'meet', 'reveal', 'game', 'party', 'life', 'home-video', 'alert', 'save', 'offer', 'plead', 'vote', 'statement', 'antivirus', 'date', 'invites', 'race', 'newparty', 'lurk', 'chosen', 'pair-arrival', 'power-reveal', 'hack', 'hack-undone', 'joker-chat', 'joker-pick', 'burner-exposed', 'no-block', 'mission', 'disrupter', 'swap', 'swap-back', 'clone', 'ride-or-die', 'sacrifice'];

function seasons(n = 4) {
  return Array.from({ length: n }, (_, i) => {
    const cast = makePlayers(13, 40 + i);
    setPlayers(cast);
    const names = cast.map(p => p.name);
    return playCircleSeason({ cast: names, setup: circleSetup(names, { newcomers: 5 }), pool: makePool(7, 40 + i), seed: 40 + i });
  });
}

describe('The Circle guards', () => {
  it('rolls no bare dice', () => {
    for (const f of files) expect(src(f), f).not.toMatch(/Math\.random/);
  });

  it('lets only public.js touch the audience ledger, and no decision read it', () => {
    for (const f of files) {
      if (f === 'public.js') continue;
      expect(src(f), f).not.toMatch(/pm\/ledger\.js|readApproval|readFame/);
    }
    const readers = files.filter(f => /from '\.\/public\.js'/.test(src(f)));
    expect(readers.sort()).toEqual(['season.js']);
  });

  it('keeps relationships in the shared store only', () => {
    const direct = files.filter(f => /relationships\.js/.test(src(f)));
    expect(direct.sort()).toEqual(['reveal.js', 'state.js']);
  });

  it('writes only known scene kinds, and every belief change was witnessed', () => {
    for (const { state } of seasons()) {
      const byId = Object.fromEntries(state.scenes.map(s => [s.id, s]));
      for (const s of state.scenes) expect(KINDS, s.kind).toContain(s.kind);
      for (const e of state.beliefLog) expect(byId[e.scene].seenBy, `scene ${e.scene}`).toContain(e.obs);
    }
  });

  it('never lets a nice player lie: false credit, visit reports and plants are schemers\' only', () => {
    const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
    for (const { state } of seasons()) {
      const nice = h => state.profiles[h].players.some(n => NICE.has(state.people[n].archetype));
      for (const c of state.claims) {
        if (['saved', 'visitSaid'].includes(c.kind) && !c.truth) expect(nice(c.origin.by), `${c.kind} ${c.id}`).toBe(false);
      }
      for (const s of state.scenes.filter(x => x.kind === 'chat' && x.data.intent === 'plant')) {
        expect(nice(s.who[0]), `plant in scene ${s.id}`).toBe(false);
      }
    }
  });

  it('never writes English into a scene', () => {
    for (const { state } of seasons(2)) {
      for (const s of state.scenes) {
        const text = JSON.stringify(s.data);
        expect(text, `scene ${s.id}`).not.toMatch(/"[A-Z][a-z]+ [a-z]+ [a-z]+/);
      }
    }
  });
});
