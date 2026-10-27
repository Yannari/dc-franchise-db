// npm run typecheck:bb — type-check the Big Brother code (tsconfig.bb.json).
//
// Plain `tsc -p tsconfig.bb.json` would also report every error in the shared
// Total Drama files Big Brother imports (about 5,700 of them on the first run,
// against 650 in Big Brother's own folders), so this asks the compiler for the
// diagnostics of the CHECKED files only. It is also quicker: the other files are
// parsed for their types but never checked.
import ts from 'typescript';
import path from 'node:path';

const CHECKED = /^(js\/(bb|bb-events|vp-bb-ep)\/|types\/)/;

const root = process.cwd();
const cfgFile = path.join(root, 'tsconfig.bb.json');
const read = ts.readConfigFile(cfgFile, ts.sys.readFile);
if (read.error) { console.error(ts.formatDiagnostic(read.error, host())); process.exit(2); }
const cfg = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
const program = ts.createProgram(cfg.fileNames, cfg.options);

const rel = f => path.relative(root, f).split(path.sep).join('/');
const diags = [...program.getOptionsDiagnostics(), ...program.getGlobalDiagnostics()];
let files = 0;
for (const sf of program.getSourceFiles()) {
  if (!CHECKED.test(rel(sf.fileName))) continue;
  files++;
  diags.push(...program.getSyntacticDiagnostics(sf), ...program.getSemanticDiagnostics(sf));
}

function host() {
  return { getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n' };
}

if (diags.length) {
  const out = process.stdout.isTTY ? ts.formatDiagnosticsWithColorAndContext(diags, host()) : ts.formatDiagnostics(diags, host());
  console.log(out);
  console.log(`${diags.length} type error${diags.length === 1 ? '' : 's'} in ${files} checked files.`);
  process.exit(1);
}
console.log(`No type errors in ${files} checked files.`);
