import { describe, it, expect } from "vitest";
import { content } from "../src/data/content";
import {
  defaultSettings,
  dateOrdinal,
  evaluateMastery,
  getDailyPlan,
  studyDay,
  type CardProgress,
} from "../src/domain/study";
const now = Date.parse("2026-10-11T02:00:00Z"),
  k = content.knowledge[0];
const good = {
  recall: "功能描述做什么；非功能描述质量约束",
  checks: [true, true],
  questionCorrect: true,
};
describe("掌握状态判定", () => {
  it("仅阅读和空闭卷回答不能掌握", () => {
    expect(() =>
      evaluateMastery(k, undefined, { ...good, recall: "" }, now),
    ).toThrow();
  });
  it("必须通过所有原文要点和关联题", () => {
    expect(
      evaluateMastery(k, undefined, { ...good, checks: [true, false] }, now)
        .status,
    ).toBe("learning");
    expect(
      evaluateMastery(k, undefined, { ...good, questionCorrect: false }, now)
        .status,
    ).toBe("learning");
    expect(evaluateMastery(k, undefined, good, now)).toMatchObject({
      status: "initial",
      firstPassAt: new Date(now).toISOString(),
      validationMethod: "question-and-self-check",
    });
  });
  it("没有可信章节关联的卡允许仅自评", () => {
    const self = content.knowledge.find((c) => c.id === "K004")!;
    const p = evaluateMastery(
      self,
      undefined,
      {
        recall: "先请求分析再审批更新通知",
        checks: [true],
        questionCorrect: false,
      },
      now,
    );
    expect(p.status).toBe("initial");
    expect(p.validationMethod).toBe("self-check-only");
  });
  it("24小时前复测不能升级，边界时刻才能巩固", () => {
    const initial = evaluateMastery(k, undefined, good, now);
    expect(evaluateMastery(k, initial, good, now + 86400000 - 1).status).toBe(
      "initial",
    );
    expect(evaluateMastery(k, initial, good, now + 86400000).status).toBe(
      "consolidated",
    );
  });
  it("复测失败不维持巩固，保留首次通过审计时间", () => {
    const initial = evaluateMastery(k, undefined, good, now),
      master = evaluateMastery(k, initial, good, now + 86400000);
    const failed = evaluateMastery(
      k,
      master,
      { ...good, questionCorrect: false },
      now + 172800000,
    );
    expect(failed.status).toBe("needs-review");
    expect(failed.consolidatedAt).toBeUndefined();
    expect(failed.firstPassAt).toBe(initial.firstPassAt);
  });
  it("A/B卡复习频率有区别", () => {
    const b = content.knowledge.find(
      (k) => k.priority === "B" && k.relatedQuestionIds.length,
    )!;
    const aProgress = evaluateMastery(k, undefined, good, now);
    const bProgress = evaluateMastery(
      b,
      undefined,
      {
        recall: "独立回忆",
        checks: b.essentials.split(/[；;]/).map(() => true),
        questionCorrect: true,
      },
      now,
    );
    expect(
      Date.parse(bProgress.reviewDueAt!) - Date.parse(aProgress.reviewDueAt!),
    ).toBe(86400000);
  });
});
describe("跨日和动态任务", () => {
  it("学习启动日可变，跨月跨年按日期而非小时计算", () => {
    expect(studyDay("2026-10-11", "2026-10-11")).toBe(1);
    expect(studyDay("2026-10-11", "2026-10-12")).toBe(2);
    expect(studyDay("2026-12-31", "2027-01-01")).toBe(2);
    expect(studyDay("2026-10-12", "2026-10-11")).toBe(0);
    expect(() => dateOrdinal("2026-02-30")).toThrow();
  });
  it("起始5天计划15/15/15/15/16不缺不重", () => {
    const p = getDailyPlan([], defaultSettings, "2026-10-11", now);
    expect(p.fresh).toHaveLength(15);
    expect(p.upcoming.map((d) => d.remaining)).toEqual([
      15, 15, 15, 15, 16, 0, 0,
    ]);
  });
  it("未完成任务次日自动携带，第6天仍显示全部欠账", () => {
    const day2 = getDailyPlan(
      [],
      defaultSettings,
      "2026-10-12",
      now + 86400000,
    );
    expect(day2.backlog).toHaveLength(15);
    expect(day2.fresh).toHaveLength(15);
    expect(day2.target).toBe(30);
    const day6 = getDailyPlan(
      [],
      defaultSettings,
      "2026-10-16",
      now + 5 * 86400000,
    );
    expect(day6.backlog).toHaveLength(76);
    expect(day6.fresh).toHaveLength(0);
  });
  it("超前完成后未来新增任务减少且到期复习优先", () => {
    const p: CardProgress = {
      cardId: "K015",
      status: "initial",
      firstPassAt: new Date(now).toISOString(),
      reviewDueAt: new Date(now + 86400000).toISOString(),
      updatedAt: new Date(now).toISOString(),
    };
    const day1 = getDailyPlan([p], defaultSettings, "2026-10-11", now);
    expect(day1.upcoming[1].remaining).toBe(14);
    const day2 = getDailyPlan(
      [p],
      defaultSettings,
      "2026-10-12",
      now + 86400000,
    );
    expect(day2.queue[0].id).toBe("K015");
    expect(day2.fresh).toHaveLength(14);
  });
  it("修改启动日和手动重排保留掌握记录", () => {
    const p = evaluateMastery(k, undefined, good, now),
      settings = {
        ...defaultSettings,
        studyStartDate: "2026-10-10",
        dayOverrides: { K002: 3 },
      };
    const plan = getDailyPlan([p], settings, "2026-10-11", now);
    expect(plan.remaining).toBe(75);
    expect(plan.upcoming[2].remaining).toBe(16);
    expect(plan.queue.some((k) => k.id === "K001")).toBe(false);
  });
});
