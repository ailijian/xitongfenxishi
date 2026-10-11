import type { KnowledgeCard } from "./content-schema";
import { content } from "../data/content";
export type MasteryStatus =
  "learning" | "initial" | "consolidated" | "needs-review";
export type CardProgress = {
  cardId: string;
  status: MasteryStatus;
  firstPassAt?: string;
  consolidatedAt?: string;
  reviewDueAt?: string;
  validationMethod?: "self-check-only" | "question-and-self-check";
  updatedAt: string;
};
export type Settings = {
  id: "settings";
  studyStartDate: string;
  dayOverrides: Record<string, number>;
};
export const defaultSettings: Settings = {
  id: "settings",
  studyStartDate: "2026-10-11",
  dayOverrides: {},
};
export function localDate(at: Date = new Date()) {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
}
export function dateOrdinal(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("日期格式应为 YYYY-MM-DD");
  const [y, m, d] = value.split("-").map(Number),
    at = new Date(Date.UTC(y, m - 1, d));
  if (
    at.getUTCFullYear() !== y ||
    at.getUTCMonth() !== m - 1 ||
    at.getUTCDate() !== d
  )
    throw new Error("日期不存在");
  return at.getTime() / 86400000;
}
export function studyDay(start: string, today = localDate()) {
  return dateOrdinal(today) - dateOrdinal(start) + 1;
}
export function dueForReview(p: CardProgress | undefined, now = Date.now()) {
  return (
    !!p &&
    (p.status === "needs-review" ||
      (!!p.reviewDueAt && Date.parse(p.reviewDueAt) <= now))
  );
}
export function statusLabel(p: CardProgress | undefined, now = Date.now()) {
  return !p
    ? "未开始"
    : dueForReview(p, now)
      ? "需复习"
      : {
          learning: "学习中",
          initial: "初步掌握",
          consolidated: "巩固掌握",
          "needs-review": "需复习",
        }[p.status];
}
export function recallPoints(card: KnowledgeCard) {
  return card.essentials
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
export function evaluateMastery(
  card: KnowledgeCard,
  previous: CardProgress | undefined,
  check: { recall: string; checks: boolean[]; questionCorrect: boolean },
  now = Date.now(),
): CardProgress {
  if (!check.recall.trim()) throw new Error("请先记录你的闭卷回答");
  const passed =
    check.checks.length === recallPoints(card).length &&
    check.checks.every(Boolean) &&
    (!card.relatedQuestionIds.length || check.questionCorrect);
  const at = new Date(now).toISOString();
  if (!passed)
    return {
      ...previous,
      cardId: card.id,
      status: previous?.firstPassAt ? "needs-review" : "learning",
      consolidatedAt: undefined,
      reviewDueAt: at,
      updatedAt: at,
    };
  if (
    previous?.firstPassAt &&
    now - Date.parse(previous.firstPassAt) < 86400000
  ) {
    // Repeated attempts inside 24h cannot become consolidated.
    return {
      ...previous,
      status: "initial",
      consolidatedAt: undefined,
      reviewDueAt:
        previous.reviewDueAt ??
        new Date(Date.parse(previous.firstPassAt) + 86400000).toISOString(),
      updatedAt: at,
    };
  }
  const consolidating = !!previous?.firstPassAt;
  const days = consolidating
    ? card.priority === "A"
      ? 2
      : 4
    : card.priority === "A"
      ? 1
      : 2;
  return {
    cardId: card.id,
    status: consolidating ? "consolidated" : "initial",
    firstPassAt: previous?.firstPassAt ?? at,
    consolidatedAt: consolidating ? at : undefined,
    reviewDueAt: new Date(now + days * 86400000).toISOString(),
    validationMethod: card.validationMethod,
    updatedAt: at,
  };
}
export function plannedDay(id: string, settings: Settings) {
  return (
    settings.dayOverrides[id] ??
    content.plan.find((d) => d.knowledgeIds.includes(id))!.day
  );
}
export function getDailyPlan(
  progress: CardProgress[],
  settings: Settings,
  today = localDate(),
  now = Date.now(),
) {
  const rawDay = studyDay(settings.studyStartDate, today),
    day = Math.max(1, rawDay);
  const byId = new Map(progress.map((p) => [p.cardId, p]));
  const sort = (a: KnowledgeCard, b: KnowledgeCard) =>
    a.priority.localeCompare(b.priority) ||
    plannedDay(a.id, settings) - plannedDay(b.id, settings) ||
    a.id.localeCompare(b.id);
  const unpassed = content.knowledge.filter(
    (k) => !byId.get(k.id)?.firstPassAt,
  );
  const due = content.knowledge
    .filter((k) => dueForReview(byId.get(k.id), now))
    .sort(sort);
  const backlog = unpassed
    .filter((k) => plannedDay(k.id, settings) < day)
    .sort(sort);
  const fresh = unpassed
    .filter((k) => plannedDay(k.id, settings) === day)
    .sort(sort);
  const future = unpassed
    .filter((k) => plannedDay(k.id, settings) > day)
    .sort(sort);
  const doneToday = progress.filter(
    (p) => p.firstPassAt && localDate(new Date(p.firstPassAt)) === today,
  ).length;
  const upcoming = content.plan.map((d) => ({
    ...d,
    remaining: unpassed.filter((k) => plannedDay(k.id, settings) === d.day)
      .length,
  }));
  const queue = [...due, ...backlog, ...fresh, ...future].filter(
    (k, i, a) => a.findIndex((v) => v.id === k.id) === i,
  );
  return {
    rawDay,
    day,
    due,
    backlog,
    fresh,
    future,
    doneToday,
    queue,
    upcoming,
    remaining: unpassed.length,
    originalGoal:
      content.plan.find((d) => d.day === day)?.knowledgeIds.length ?? 0,
    target: doneToday + backlog.length + fresh.length,
    requiredDaily: Math.ceil(unpassed.length / Math.max(1, 6 - day)),
    aConsolidated: progress.filter(
      (p) =>
        p.status === "consolidated" &&
        !dueForReview(p, now) &&
        content.knowledge.find((k) => k.id === p.cardId)?.priority === "A",
    ).length,
    consolidated: progress.filter(
      (p) => p.status === "consolidated" && !dueForReview(p, now),
    ).length,
  };
}
