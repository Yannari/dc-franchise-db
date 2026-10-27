// Shapes every show shares, for the type checker only (tsconfig.bb.json today;
// the other shows' configs as they are added). Nothing loads this at runtime.
// Use them from JSDoc as `DC.Stat`, `DC.Archetype`, `DC.Pronouns`, with no import.

declare namespace DC {
  /** The nine stats. There are no others (CLAUDE.md, "Valid Stats"). */
  type Stat = 'physical' | 'endurance' | 'mental' | 'social' | 'strategic'
    | 'loyalty' | 'boldness' | 'intuition' | 'temperament';

  /** The fifteen archetypes (CLAUDE.md, "Valid Archetypes"). */
  type Archetype = 'mastermind' | 'schemer' | 'hothead' | 'challenge-beast' | 'social-butterfly'
    | 'loyal-soldier' | 'wildcard' | 'chaos-agent' | 'floater' | 'underdog' | 'hero' | 'villain'
    | 'goat' | 'perceptive-player' | 'showmancer';

  /** `pronouns(name)`: `posAdj` goes before a noun, `pos` stands alone, and there is no `Pos`. */
  interface Pronouns {
    sub: string; obj: string; pos: string; posAdj: string; ref: string;
    Sub: string; Obj: string; PosAdj: string;
  }
}
