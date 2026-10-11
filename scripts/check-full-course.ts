import fs from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { XMLValidator } from "fast-xml-parser";
import { content } from "../src/data/content";
import { beginnerPackage, expandedPackage, beginnerLessons, integratedCourseDays, teachingContentVersion, lessonDiagrams } from "../src/data/lessons";
import coaching from "../src/data/lessons/case_paper_beginner_coaching.json";
const sha=(s:string|Buffer)=>createHash("sha256").update(s).digest("hex");
const assert=(ok:unknown,message:string)=>{if(!ok)throw Error(message);};
const lessons=[...beginnerPackage.lessons,...expandedPackage.lessons];
assert(lessons.length===76&&new Set(lessons.map(l=>l.cardId)).size===76,"课程未完整覆盖76卡");
assert(content.knowledge.length===76&&content.questions.length===150&&content.cases.length===9&&content.essays.length===10,"原题卡数量改变");
const questions=lessons.flatMap(l=>l.practiceQuestions);
assert(questions.length===152&&new Set(questions.map(q=>q.id)).size===152,"教学题重复或遗漏");
assert(questions.every(q=>!content.questions.some(r=>r.id===q.id)),"教学题混入正式题库");
const rows=lessons.map(l=>({cardId:l.cardId,day:content.plan.find(d=>d.knowledgeIds.includes(l.cardId))!.day,title:l.title,
  integrated:beginnerLessons.has(l.cardId),steps:l.explanationSteps.length,workedSteps:l.workedExample.solutionSteps.length,
  recallPrompts:l.recallPrompts.length,questionIds:l.practiceQuestions.map(q=>q.id),diagram:!!l.conceptVisual}));
for(const l of beginnerLessons.values())if(l.conceptVisual){
 const d=lessonDiagrams[l.cardId];assert(d,`图示缺失 ${l.cardId}`);
 const svg=fs.readFileSync(`public/${d.src}`,"utf8");
 assert(XMLValidator.validate(svg)===true&&!/<\s*(script|foreignObject|iframe)|\bon\w+\s*=|javascript:|(?:href|src)\s*=|@import|url\(\s*[^#]/i.test(svg),`SVG不安全 ${l.cardId}`);
 assert(sha(l.conceptVisual.code)===d.sourceSha256&&sha(svg)===d.svgSha256&&d.alt.length>30,`图示来源/输出/文字版本失配 ${l.cardId}`);
}
assert(coaching.caseWalkthroughs.length===9&&coaching.essayCoaches.length===10,"19项辅导模块缺失");
const sourceDir="docs/系统分析师零基础全76课完整升级包";
let guideFields=0;const manifestIssues:string[]=[];const sourceHashes:{file:string;sha256:string}[]=[];
if(process.argv.includes("--source")){
 for(const file of ["day2_day5_beginner_lessons.json","case_paper_beginner_coaching.json"]){
  const bytes=fs.readFileSync(`${sourceDir}/${file}`);assert(bytes.equals(fs.readFileSync(`src/data/lessons/${file}`)),`课程源被改写 ${file}`);
 }
 assert(fs.readFileSync(`${sourceDir}/day1_original_readonly.json`).equals(fs.readFileSync("src/data/lessons/day1_beginner_lessons.json")),"原D1被改写");
 const ref=JSON.parse(fs.readFileSync(`${sourceDir}/all_76_lessons_reference.json`,"utf8"));
 const byId=new Map(ref.lessons.map((l:any)=>[l.cardId,l]));
 for(const l of lessons)assert(isDeepStrictEqual(l,byId.get(l.cardId)),`全76校对失配 ${l.cardId}`);
 const norm=(s:string)=>s.replace(/\s/g,"");
 const check=(v:unknown,guide:string)=>{if(typeof v==="string"){assert(guide.includes(norm(v)),`指南缺少字段：${v}`);guideFields++;}
 else if(Array.isArray(v))v.forEach(i=>check(i,guide));else if(v&&typeof v==="object")Object.values(v).forEach(i=>check(i,guide));};
 for(const day of [2,3,4,5]){
  const guide=norm(fs.readFileSync(`${sourceDir}/day${day}_beginner_guide.md`,"utf8"));
  for(const l of expandedPackage.lessons.filter(l=>rows.find(r=>r.cardId===l.cardId)!.day===day)){
   check({cardId:l.cardId,title:l.title,oneSentence:l.oneSentence,whyLearn:l.whyLearn,scenario:l.scenario.narrative,explanationSteps:l.explanationSteps,
    workedExample:l.workedExample.solutionSteps,distinguish:l.distinguish,examTip:l.examTip,memoryHook:l.memoryHook,recallPrompts:l.recallPrompts},guide);
   for(const q of l.practiceQuestions)check({stem:q.stem,options:q.options,answer:q.answer,optionExplanations:q.optionExplanations},guide);
  }
 }
 const cg=norm(fs.readFileSync(`${sourceDir}/case_paper_beginner_guide.md`,"utf8"));
 for(const c of coaching.caseWalkthroughs)check({caseId:c.caseId,title:c.title,primer:c.primer,solveSteps:c.solveSteps,answerPointExamples:c.answerPointExamples,commonMistakes:c.commonMistakes,transferPractice:c.transferPractice},cg);
 for(const e of coaching.essayCoaches)check({essayId:e.essayId,title:e.title,focus:e.focus,sectionOutline:e.sectionOutline,requiredRealProjectEvidence:e.requiredRealProjectEvidence,avoid:e.avoid,starterExercise:e.starterExercise},cg);
 const manifest=JSON.parse(fs.readFileSync(`${sourceDir}/FILE_MANIFEST.json`,"utf8"));
 for(const f of manifest.files){const bytes=fs.readFileSync(`${sourceDir}/${f.file}`);const actual=sha(bytes);sourceHashes.push({file:f.file,sha256:actual});
  if(actual!==f.sha256||bytes.length!==f.sizeBytes)manifestIssues.push(f.file);
 }
 assert(manifestIssues.length===1&&manifestIssues[0]==="FILE_MANIFEST.json","来源清单的内容文件校验失败");
}
const baseline="8ecdd0eaea31caefe5e778053d22641f8b7afe49";
const preserved:string[]=[];
if(process.argv.includes("--preserved"))for(const file of ["src/data/knowledge.json","src/data/questions.json","src/data/cases.json","src/data/essays.json","src/data/plan.json","src/data/manifest.json","src/storage/db.ts","src/storage/backup.ts","src/storage/training.ts","src/domain/study.ts","src/domain/content-schema.ts","src/domain/mock-access.ts","src/domain/study-clock.ts","src/hooks/useStudyClock.ts","src/data/lessons/day1_beginner_lessons.json","src/data/lessons/diagrams.json"]){
 assert(execFileSync("git",["show",`${baseline}:${file}`]).equals(fs.readFileSync(file)),`保留约束被修改 ${file}`);preserved.push(file);
}
const report={result:"PASS",teachingContentVersion,originalContentVersion:content.contentVersion,integratedCourseDays,
 original:{knowledge:76,questions:150,cases:9,essays:10},supplied:{lessons:76,teachingQuestions:152,diagrams:41,caseCoaches:9,essayCoaches:10},
 integrated:{lessons:beginnerLessons.size,questions:beginnerLessons.size*2,diagrams:[...beginnerLessons.values()].filter(l=>l.conceptVisual).length},
 newAnswerDistribution:Object.fromEntries("ABCD".split("").map(a=>[a,expandedPackage.lessons.flatMap(l=>l.practiceQuestions).filter(q=>q.answer===a).length])),
 sourceHashes,upstreamManifestIssues:manifestIssues,guideFields,preservedBaseline:baseline,preservedFiles:preserved,databaseMigration:false,checkpointApprovals:0,rows};
if(process.argv.includes("--write-report")){fs.mkdirSync("docs/full-course",{recursive:true});fs.writeFileSync("docs/full-course/content-integrity.json",JSON.stringify(report,null,2)+"\n");}
console.log(JSON.stringify(report,null,2));
