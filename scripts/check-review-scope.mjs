/** Read-only evidence that planning files do not alter the approved runtime baseline. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = args => execFileSync('git', args, {cwd:root, maxBuffer:20_000_000});
const baseline = 'fc087c0';
// NUL delimiters preserve Chinese paths without interpreting Git's C-quoted output.
const tracked = git(['ls-tree','-r','-z','--name-only',baseline]).toString('utf8').split('\0').filter(Boolean);
for (const file of tracked) {
  assert(fs.readFileSync(path.join(root,file)).equals(git(['show',`${baseline}:${file}`])), `${file}: baseline changed`);
}
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory()
  ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const artifacts = walk(path.join(root,'dist'));
const forbidden = ['knowledge-checkpoint-proposals','learning-content-gap.json',
  'question-coverage-proposals','gap-v2:','K010.CP04','pending-human-review'];
for (const file of artifacts) {
  const relative = path.relative(root,file);
  assert(!/review|learning-content-gap|migration-plan/.test(relative),relative);
  if (/\.(js|json|html|webmanifest)$/.test(file)) {
    const text = fs.readFileSync(file,'utf8');
    for (const token of forbidden) assert(!text.includes(token),`${relative}: contains ${token}`);
  }
}
console.log(JSON.stringify({result:'PASS',baseline,unchangedTrackedFiles:tracked.length,
  productionFiles:artifacts.length,reviewContentInProduction:false},null,2));
