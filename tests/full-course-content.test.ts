import { describe,it,expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { content } from "../src/data/content";
import { beginnerPackage,expandedPackage,beginnerLessons,courseCardIds,lessonDiagrams } from "../src/data/lessons";
import { validateExpandedPackage } from "../src/domain/lesson-schema";
import raw from "../src/data/lessons/day2_day5_beginner_lessons.json";
const parse=(p:unknown)=>validateExpandedPackage(p,content.knowledge,content.plan);
const source="docs/系统分析师零基础全76课完整升级包";
describe("full supplied beginner curriculum",()=>{
 it("preserves approved D1 bytes and all 61 new source lessons",()=>{
  expect(readFileSync('src/data/lessons/day1_beginner_lessons.json')).toEqual(readFileSync(`${source}/day1_original_readonly.json`));
  expect(readFileSync('src/data/lessons/day2_day5_beginner_lessons.json')).toEqual(readFileSync(`${source}/day2_day5_beginner_lessons.json`));
  const ref=JSON.parse(readFileSync(`${source}/all_76_lessons_reference.json`,'utf8'));
  const all=[...beginnerPackage.lessons,...parse(raw).lessons];
  expect(all).toHaveLength(76);for(const l of all)expect(l).toEqual(ref.lessons.find((r:any)=>r.cardId===l.cardId));
 });
 it("orders days exactly15/15/15/15/16 without changing the original study plan",()=>{
  expect(content.plan.slice(0,5).map(d=>d.knowledgeIds.length)).toEqual([15,15,15,15,16]);
  expect(expandedPackage.targetCardIds).toEqual(content.plan.slice(1,5).flatMap(d=>d.knowledgeIds));
  expect([...beginnerLessons.keys()]).toEqual(courseCardIds);
 });
 it("isolates122 new practice-only original questions, preserving every answer/option reason",()=>{
  const qs=parse(raw).lessons.flatMap(l=>l.practiceQuestions);expect(qs).toHaveLength(122);expect(new Set(qs.map(q=>q.id)).size).toBe(122);
  expect(content.questions).toHaveLength(150);
  expect('ABCD'.split('').map(a=>qs.filter(q=>q.answer===a).length)).toEqual([31,31,30,30]);
  for(const q of qs){expect(Object.keys(q.options)).toEqual(['A','B','C','D']);expect(Object.keys(q.optionExplanations)).toEqual(['A','B','C','D']);
   expect(q.optionExplanations[q.answer]).toMatch(/^正确/);expect(q.scoreUsage).toBe('practice-only-not-objective-mastery');expect(content.questions.some(r=>r.id===q.id)).toBe(false);}
 });
 it("rejects shifted day/card IDs, duplicate courses and altered provenance",()=>{
  for(const f of [(p:any)=>p.lessons[0].practiceQuestions[0].id='LQ-D3-K015-01',(p:any)=>p.lessons[1]=p.lessons[0],
   (p:any)=>p.lessons[0].provenance.baseCardSource='main/src/data/knowledge.json',(p:any)=>p.lessons[0].title='wrong']){
   const bad=structuredClone(raw);f(bad);expect(()=>parse(bad)).toThrow();}
 });
 it("rejects incomplete steps, missing option reasons, executable markup and mastery claims",()=>{
  for(const f of [(p:any)=>p.lessons[0].explanationSteps.pop(),(p:any)=>p.lessons[0].workedExample.solutionSteps.pop(),
   (p:any)=>p.lessons[0].practiceQuestions[0].optionExplanations.A='',(p:any)=>p.lessons[0].oneSentence='<img onerror="x">',
   (p:any)=>p.lessons[0].practiceQuestions[0].scoreUsage='objective-mastery',(p:any)=>p.migrationSafety.existingStudyRecords='replace']){
    const bad=structuredClone(raw);f(bad);expect(()=>parse(bad)).toThrow();}
 });
 it("contains33 supplied diagrams and checks every integrated SVG provenance/output",()=>{
  expect(expandedPackage.lessons.filter(l=>l.conceptVisual)).toHaveLength(33);
  for(const l of beginnerLessons.values())if(l.conceptVisual){const d=lessonDiagrams[l.cardId];const svg=readFileSync(`public/${d.src}`,'utf8');
   const sha=(s:string)=>createHash('sha256').update(s).digest('hex');expect(sha(l.conceptVisual.code)).toBe(d.sourceSha256);expect(sha(svg)).toBe(d.svgSha256);
   expect(svg).not.toMatch(/<\s*(script|foreignObject|iframe)|\bon\w+\s*=|javascript:|(?:href|src)\s*=|@import|url\(\s*[^#]/i);expect(d.alt.length).toBeGreaterThan(30);}
 });
 it("preserves exact K037 SQL operators, joins, half-open date interval and clauses",()=>{
  const sql=expandedPackage.lessons.find(l=>l.cardId==='K037')!.supplement!.copyableSql;
  expect(sql).toContain("a.visit_date >= '2026-10-01' AND a.visit_date < '2026-11-01'");expect(sql).toContain('HAVING COUNT(*) > 20');expect(sql).toContain('ORDER BY cnt DESC;');
  const bad=structuredClone(raw);delete (bad.lessons.find(l=>l.cardId==='K037') as any).supplement;expect(()=>parse(bad)).toThrow();
 });
 it("checks the supplied calculation results independently",()=>{
  expect(-100+55/1.1+66/1.1**2).toBeCloseTo(4.54545,4);expect(.6*20+.4*-10).toBe(8);
  expect(80/90).toBeCloseTo(.889,3);expect(30*24*60*(1-.999)).toBeCloseTo(43.2,6);
  expect(2+Math.max(5,3)+4).toBe(11);
  for(const [id,value] of [['K069','4.55'],['K070','8万'],['K071','0.889'],['K063','43.2'],['K072','11天']]){
    const l=expandedPackage.lessons.find(l=>l.cardId===id)!;expect(JSON.stringify(l)).toContain(value);}
 });
});
