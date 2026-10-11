import { z } from "zod";
import type { KnowledgeCard } from "./content-schema";

// Teaching text is rendered as escaped text, never HTML or executable Mermaid.
const text = z.string().min(1).refine((s) => !!s.trim() &&
  !/<\s*(script|iframe|object|embed|foreignObject)\b|javascript:|<[^>]+\bon\w+\s*=/i.test(s),
  "课程包含空文本或可执行标记");
const choices = z.object({ A: text, B: text, C: text, D: text }).strict();
export const lessonQuestionSchema = z.object({
  id: z.string().regex(/^LQ-D1-K\d{3}-0[12]$/),
  stem: text, options: choices, answer: z.enum(["A", "B", "C", "D"]),
  optionExplanations: choices, assesses: text,
  status: z.literal("original-teaching-practice"),
  scoreUsage: z.literal("practice-only-not-objective-mastery"),
}).strict();
export const beginnerLessonSchema = z.object({
  cardId: z.string().regex(/^K\d{3}$/), title: text, priority: z.enum(["A", "B"]),
  audience: z.literal("zero-foundation"), lessonType: z.literal("beginner-expansion"),
  oneSentence: text, whyLearn: text,
  scenario: z.object({ name: text, narrative: text }).strict(),
  explanationSteps: z.array(z.object({ heading: text, body: text }).strict()).min(4),
  workedExample: z.object({ prompt: text, solutionSteps: z.array(text).min(4) }).strict(),
  distinguish: text, examTip: text, memoryHook: text,
  recallPrompts: z.array(text).length(2),
  practiceQuestions: z.array(lessonQuestionSchema).length(2), nextConnection: text,
  provenance: z.object({
    kind: z.literal("independently-authored-explanation"), baseCardId: text,
    baseCardSource: z.literal("main/src/data/knowledge.json"),
    originalOfficialQuestion: z.literal(false),
  }).strict(),
  reviewStatus: z.literal("instructional-draft-for-human-and-integration-review"),
  conceptVisual: z.object({
    kind: z.literal("mermaid"), title: text, code: text, note: text,
    rendering: z.literal("safe-static-diagram-with-accessible-text-fallback"),
  }).strict().optional(),
}).strict();
export const beginnerPackageSchema = z.object({
  packageId: z.literal("ruankao-beginner-d1-20261011-v1"), formatVersion: z.literal(1),
  baseKnowledgeCatalog: z.literal("src/data/knowledge.json"),
  targetCardIds: z.array(text).length(15), audience: text, teachingMethod: text, currentState: text,
  migrationSafety: z.object({
    existingCardIds: z.literal("preserve"), existingQuestionIds: z.literal("preserve"),
    existingCheckpointCatalog: z.literal("unmodified"), existingStudyRecords: z.literal("preserve"),
    studyPlan: z.literal("unmodified"), newQuestionsDoNotCountAsObjectiveMastery: z.literal(true),
  }).strict(),
  lessons: z.array(beginnerLessonSchema).length(15),
}).strict();
export type BeginnerLesson = z.infer<typeof beginnerLessonSchema>;
export type LessonQuestion = z.infer<typeof lessonQuestionSchema>;
export const dayOneCardIds = [
  ...Array.from({ length: 14 }, (_, i) => `K${String(i + 1).padStart(3, "0")}`), "K075",
];

export function validateBeginnerPackage(input: unknown, cards: KnowledgeCard[]) {
  const pack = beginnerPackageSchema.parse(input);
  const ids = pack.lessons.map((l) => l.cardId);
  if (JSON.stringify(ids) !== JSON.stringify(dayOneCardIds) ||
      JSON.stringify(pack.targetCardIds) !== JSON.stringify(ids)) {
    throw new Error("课程必须按 D1 的 K001—K014、K075 排列，不得重复或遗漏");
  }
  const questionIds = new Set<string>();
  for (const lesson of pack.lessons) {
    const card = cards.find((k) => k.id === lesson.cardId);
    if (!card || card.title !== lesson.title || card.priority !== lesson.priority ||
        lesson.provenance.baseCardId !== lesson.cardId) {
      throw new Error(`课程原卡来源、标题或优先级不一致：${lesson.cardId}`);
    }
    lesson.practiceQuestions.forEach((q, i) => {
      if (q.id !== `LQ-D1-${lesson.cardId}-0${i + 1}` || questionIds.has(q.id)) {
        throw new Error(`原创练习 ID 不一致或重复：${q.id}`);
      }
      questionIds.add(q.id);
    });
  }
  const visuals = pack.lessons.filter((l) => l.conceptVisual).map((l) => l.cardId);
  if (JSON.stringify(visuals) !== JSON.stringify(dayOneCardIds.slice(3, 11))) {
    throw new Error("8 个概念图示必须对应 K004—K011");
  }
  return pack;
}
