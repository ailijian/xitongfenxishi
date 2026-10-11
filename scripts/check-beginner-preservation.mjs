import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const baseline='22e3f07aabd9d1aa0cd33831aa3599cbe6d9db97';
const materialFiles=execFileSync('git',['ls-files','-z','materials'],{encoding:'utf8'}).split('\0').filter(Boolean);
const files=[
  'src/data/knowledge.json','src/data/questions.json','src/data/cases.json','src/data/essays.json','src/data/plan.json','src/data/manifest.json',
  'src/storage/db.ts','src/storage/backup.ts','src/domain/study.ts','src/domain/content-schema.ts',
  'src/domain/mock-access.ts','src/domain/study-clock.ts','src/hooks/useStudyClock.ts',...materialFiles,
];
const rows=files.map(file=>{
  const before=execFileSync('git',['show',`${baseline}:${file}`]);
  const after=fs.readFileSync(file);
  if(!before.equals(after))throw Error(`Unexpected baseline modification: ${file}`);
  return {file,sha256:createHash('sha256').update(after).digest('hex'),byteIdentical:true};
});
fs.writeFileSync('docs/beginner-course/preserved-baseline.json',JSON.stringify({result:'PASS',baseline,files:rows},null,2)+'\n');
console.log(`PASS: ${rows.length} original content/storage/mastery/clock/source files byte-identical.`);
