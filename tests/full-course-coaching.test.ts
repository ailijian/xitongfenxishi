import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {content} from '../src/data/content';
import raw from '../src/data/lessons/case_paper_beginner_coaching.json';
import {validateCoaching} from '../src/domain/coaching-schema';
it('imports all9 case and10 essay coaches with unchanged source/IDs/titles/rubric guarantees',()=>{
 expect(readFileSync('src/data/lessons/case_paper_beginner_coaching.json')).toEqual(readFileSync('docs/系统分析师零基础全76课完整升级包/case_paper_beginner_coaching.json'));
 const p=validateCoaching(raw,content);expect(p.caseWalkthroughs.map(c=>c.caseId)).toEqual(content.cases.map(c=>c.id));expect(p.essayCoaches.map(e=>e.essayId)).toEqual(content.essays.map(e=>e.id));
 expect(content.cases.map(c=>c.questions.reduce((n,q)=>n+q.points,0))).toEqual(Array(9).fill(25));
});
it('rejects repeated/mismatched coaches and unknown or duplicated related cards',()=>{
 for(const change of [(p:any)=>p.caseWalkthroughs[1]=p.caseWalkthroughs[0],(p:any)=>p.essayCoaches[0].title='wrong',
  (p:any)=>p.caseWalkthroughs[0].relatedCardIds=['K999'],(p:any)=>p.essayCoaches[0].relatedCardIds=['K001','K001']]){
  const bad=structuredClone(raw);change(bad);expect(()=>validateCoaching(bad,content)).toThrow();}
});
it('rejects incomplete instruction, unsafe markup, autograding or modified-rubric claims',()=>{
 for(const change of [(p:any)=>p.caseWalkthroughs[0].solveSteps.pop(),(p:any)=>p.essayCoaches[0].sectionOutline.pop(),
  (p:any)=>p.caseWalkthroughs[0].answerPointExamples[0]='<script>x</script>',(p:any)=>p.noAutogradingClaim=false,(p:any)=>p.originalScoringRubrics='replace']){
  const bad=structuredClone(raw);change(bad);expect(()=>validateCoaching(bad,content)).toThrow();}
});
it('read-only teaching components cannot call record/migrate/mastery APIs or inject HTML',()=>{
 for(const file of ['src/components/PracticalCoaching.tsx','src/components/BeginnerLesson.tsx']){
  const code=readFileSync(file,'utf8');expect(code).not.toMatch(/from\s+["'][^"']*storage|dangerouslySetInnerHTML|submitQuestion|submitSelfTest|\.version\(/);
 }
});
