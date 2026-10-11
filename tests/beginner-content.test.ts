import { describe, expect, it } from "vitest";
import { content } from "../src/data/content";
import raw from "../src/data/lessons/day1_beginner_lessons.json";
import { validateBeginnerPackage } from "../src/domain/lesson-schema";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import diagrams from "../src/data/lessons/diagrams.json";

const parse = (data: unknown) => validateBeginnerPackage(data, content.knowledge);
describe("supplied beginner teaching package", () => {
  it("imports all 15 actual lessons/30 practice-only questions/8 diagrams without changing the original pool", () => {
    const p = parse(raw);
    expect(p.lessons).toHaveLength(15);
    expect(p.lessons.flatMap(l=>l.practiceQuestions)).toHaveLength(30);
    expect(p.lessons.filter(l=>l.conceptVisual)).toHaveLength(8);
    expect(content.questions).toHaveLength(150);
    for (const l of p.lessons) expect(content.questions.map(q=>q.id)).not.toContain(l.practiceQuestions[0].id);
    for (const id of ["K004","K005","K010","K011"]) expect(content.knowledge.find(k=>k.id===id)?.validationMethod).toBe("self-check-only");
  });
  it("keeps the supplied source bytes and its authorship/review metadata", () => {
    expect(readFileSync("src/data/lessons/day1_beginner_lessons.json")).toEqual(readFileSync("docs/零基础学习包/day1_beginner_lessons.json"));
    for (const l of parse(raw).lessons) {
      expect(l.provenance.originalOfficialQuestion).toBe(false);
      expect(l.reviewStatus).toBe("instructional-draft-for-human-and-integration-review");
    }
  });
  it("rejects unknown/repeated/reordered cards and conflicting original-card provenance", () => {
    for (const field of ["cardId","title","priority"] as const) {
      const bad=structuredClone(raw); bad.lessons[0][field]="wrong"; expect(()=>parse(bad)).toThrow();
    }
    const bad=structuredClone(raw); bad.lessons[0].provenance.baseCardId="K002"; expect(()=>parse(bad)).toThrow();
    const repeated=structuredClone(raw); repeated.lessons[1]=repeated.lessons[0]; expect(()=>parse(repeated)).toThrow();
  });
  it("rejects a missing explanation, worked step, recall prompt, question or option explanation", () => {
    const mutations = [
      (p: typeof raw)=>p.lessons[0].explanationSteps.pop(),
      (p: typeof raw)=>p.lessons[0].workedExample.solutionSteps.pop(),
      (p: typeof raw)=>p.lessons[0].recallPrompts.pop(),
      (p: typeof raw)=>p.lessons[0].practiceQuestions.pop(),
      (p: typeof raw)=>p.lessons[0].practiceQuestions[0].optionExplanations.D=" ",
    ];
    for (const change of mutations) { const bad=structuredClone(raw);change(bad);expect(()=>parse(bad)).toThrow(); }
  });
  it("rejects RK pool IDs, duplicate teaching IDs, invalid answers and an official/mastery claim", () => {
    for (const [field,value] of [["id","RK001"],["answer","E"],["status","official"],["scoreUsage","objective-mastery"]]) {
      const bad=structuredClone(raw);Object.assign(bad.lessons[0].practiceQuestions[0],{[field]:value});expect(()=>parse(bad)).toThrow();
    }
    const bad=structuredClone(raw);bad.lessons[0].practiceQuestions[1].id=bad.lessons[0].practiceQuestions[0].id;expect(()=>parse(bad)).toThrow();
  });
  it("rejects executable markup and altered migration guarantees", () => {
    for (const code of ["<script>alert(1)</script>","<svg onload='alert(1)'>","javascript:alert(1)"]) {
      const bad=structuredClone(raw);bad.lessons[0].oneSentence=code;expect(()=>parse(bad)).toThrow();
    }
    const bad=structuredClone(raw);Object.assign(bad.migrationSafety,{newQuestionsDoNotCountAsObjectiveMastery:false});expect(()=>parse(bad)).toThrow();
  });
  it("preserves diagram source bindings, SVG assets and accessible text alternatives", () => {
    for (const l of parse(raw).lessons.filter(l=>l.conceptVisual)) {
      const d=diagrams[l.cardId as keyof typeof diagrams];
      const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
      expect(sha(l.conceptVisual!.code)).toBe(d.sourceSha256);
      expect(sha(readFileSync(`public/${d.src}`,"utf8"))).toBe(d.svgSha256);
      expect(d.alt.length).toBeGreaterThan(30);
    }
  });
});
