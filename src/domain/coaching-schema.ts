import { z } from "zod";
const text=z.string().min(1).refine(s=>!!s.trim()&&!/<\s*(script|iframe|object|embed|foreignObject)\b|javascript:|<[^>]+\bon\w+\s*=/i.test(s),"不安全或空辅导文本");
const cardIds=z.array(z.string().regex(/^K\d{3}$/)).min(1);
const caseSchema=z.object({caseId:z.string().regex(/^C0[1-9]$/),title:text,relatedCardIds:cardIds,
 lessonType:z.literal("beginner-case-walkthrough"),primer:text,solveSteps:z.array(text).length(5),
 answerPointExamples:z.array(text).length(3),commonMistakes:text,transferPractice:text,selfCheck:z.array(text).length(4),note:text}).strict();
const essaySchema=z.object({essayId:z.string().regex(/^E(0[1-9]|10)$/),title:text,relatedCardIds:cardIds,
 lessonType:z.literal("beginner-essay-coach"),focus:text,sectionOutline:z.array(z.object({heading:text,prompt:text}).strict()).length(5),
 requiredRealProjectEvidence:z.array(text).length(3),avoid:text,starterExercise:text,note:text}).strict();
export const coachingSchema=z.object({packageId:z.literal("ruankao-case-essay-beginner-20261011-v1"),formatVersion:z.literal(1),currentState:text,
 originalExistingCaseAndEssayIds:z.literal("preserve"),originalScoringRubrics:z.literal("preserve"),noAutogradingClaim:z.literal(true),
 caseWalkthroughs:z.array(caseSchema).length(9),essayCoaches:z.array(essaySchema).length(10)}).strict();
export type CaseCoach=z.infer<typeof caseSchema>;
export type EssayCoach=z.infer<typeof essaySchema>;
export function validateCoaching(input:unknown,catalog:{knowledge:{id:string}[];cases:{id:string;title:string}[];essays:{id:string;title:string}[]}){
 const p=coachingSchema.parse(input);
 for(const [items,original,idKey] of [[p.caseWalkthroughs,catalog.cases,"caseId"],[p.essayCoaches,catalog.essays,"essayId"]] as const){
  const ids=items.map(c=>idKey==="caseId"?(c as CaseCoach).caseId:(c as EssayCoach).essayId);
  if(JSON.stringify(ids)!==JSON.stringify(original.map(c=>c.id)))throw Error("辅导模块顺序、ID或数量失配");
  items.forEach((c,i)=>{
   if(c.title!==original[i].title||new Set(c.relatedCardIds).size!==c.relatedCardIds.length||
    c.relatedCardIds.some(id=>!catalog.knowledge.some(k=>k.id===id)))throw Error(`辅导标题或关联卡失配 ${ids[i]}`);
  });
 }
 return p;
}
