import fs from "node:fs";
import { createHash } from "node:crypto";
import { XMLValidator } from "fast-xml-parser";
import { content } from "../src/data/content";
import raw from "../src/data/lessons/day1_beginner_lessons.json";
import diagrams from "../src/data/lessons/diagrams.json";
import { validateBeginnerPackage } from "../src/domain/lesson-schema";

const pack = validateBeginnerPackage(raw, content.knowledge);
const hash = (s: string | Buffer) => createHash("sha256").update(s).digest("hex");
const questionIds = pack.lessons.flatMap((l) => l.practiceQuestions.map((q) => q.id));
if (content.knowledge.length !== 76 || content.questions.length !== 150 ||
    questionIds.some((id) => content.questions.some((q) => q.id === id))) throw new Error("原题卡数量或命名隔离失败");
for (const l of pack.lessons.filter((l) => l.conceptVisual)) {
  const d = diagrams[l.cardId as keyof typeof diagrams];
  const svg = fs.readFileSync(`public/${d.src}`, "utf8");
  if (XMLValidator.validate(svg) !== true ||
      /<\s*(script|foreignObject|iframe)|\bon\w+\s*=|javascript:|(?:href|src)\s*=/i.test(svg) ||
      hash(l.conceptVisual!.code) !== d.sourceSha256 || hash(svg) !== d.svgSha256 || !d.alt.trim()) {
    throw new Error(`图示 XML、安全、文字替代或来源校验失败：${l.cardId}`);
  }
}
let sourceChecked = false, guideFields = 0;
const sourceDir = "docs/零基础学习包";
if (process.argv.includes("--source")) {
  const original = fs.readFileSync(`${sourceDir}/day1_beginner_lessons.json`);
  if (!original.equals(fs.readFileSync("src/data/lessons/day1_beginner_lessons.json"))) throw new Error("课程源文件被改写");
  const normalize = (s: string) => s.replace(/\s/g, "");
  const guide = normalize(fs.readFileSync(`${sourceDir}/day1_beginner_guide.md`, "utf8"));
  function checkText(value: unknown) {
    if (typeof value === "string") {
      if (!guide.includes(normalize(value))) throw new Error(`指南与 JSON 内容不一致：${value}`);
      guideFields++;
    } else if (Array.isArray(value)) value.forEach(checkText);
    else if (value && typeof value === "object") Object.values(value).forEach(checkText);
  }
  for (const l of pack.lessons) {
    checkText({cardId:l.cardId,title:l.title,oneSentence:l.oneSentence,whyLearn:l.whyLearn,
      scenario:l.scenario,explanationSteps:l.explanationSteps,workedExample:l.workedExample,
      distinguish:l.distinguish,examTip:l.examTip,memoryHook:l.memoryHook,
      recallPrompts:l.recallPrompts,nextConnection:l.nextConnection});
    for (const q of l.practiceQuestions) checkText({id:q.id,stem:q.stem,options:q.options,answer:q.answer,optionExplanations:q.optionExplanations});
    if (l.conceptVisual) checkText({title:l.conceptVisual.title,code:l.conceptVisual.code,note:l.conceptVisual.note});
  }
  sourceChecked = true;
}
const report = {
  result: "PASS", packageId: pack.packageId, sourceSha256: hash(fs.readFileSync("src/data/lessons/day1_beginner_lessons.json")),
  sourceByteIdentical: sourceChecked ? true : "not requested", guideTextFieldsChecked: guideFields,
  originalKnowledge: content.knowledge.length, originalQuestions: content.questions.length,
  lessons: pack.lessons.length, teachingQuestions: questionIds.length, diagrams: Object.keys(diagrams).length,
  objectiveMasteryWrites: false, schemaMigration: false,
  rows: pack.lessons.map((l) => ({cardId:l.cardId,title:l.title,priority:l.priority,
    explanationSteps:l.explanationSteps.length,workedExampleSteps:l.workedExample.solutionSteps.length,
    questions:l.practiceQuestions.map((q)=>q.id),optionExplanations:l.practiceQuestions.reduce((n,q)=>n+Object.keys(q.optionExplanations).length,0),
    recallPrompts:l.recallPrompts.length,diagram:!!l.conceptVisual})),
};
if (process.argv.includes("--write-report")) {
  fs.mkdirSync("docs/beginner-course", {recursive:true});
  fs.writeFileSync("docs/beginner-course/content-integrity.json", JSON.stringify(report,null,2)+"\n");
}
console.log(JSON.stringify(report,null,2));
