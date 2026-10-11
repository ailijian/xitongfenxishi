import { describe, expect, it } from "vitest";
import { nextStudyClockAt } from "../src/domain/study-clock";
import type { CardProgress } from "../src/domain/study";

describe("学习时钟边界", () => {
  it("在本地午夜刷新，并保留跨月边界", () => {
    const now = new Date(2026, 9, 31, 23, 59, 59).getTime();
    expect(nextStudyClockAt([], now)).toBe(new Date(2026, 10, 1).getTime());
  });
  it("准确调度到24小时首轮复测边界和复习到期时刻", () => {
    const first = Date.parse("2026-10-11T02:00:00Z"), now = first + 86_400_000 - 1;
    const p: CardProgress = { cardId: "K001", status: "initial", firstPassAt: new Date(first).toISOString(), reviewDueAt: new Date(first + 86_400_000).toISOString(), updatedAt: new Date(first).toISOString() };
    expect(nextStudyClockAt([p], now)).toBe(now + 1);
    expect(nextStudyClockAt([{ ...p, firstPassAt: undefined, reviewDueAt: new Date(now + 12_000).toISOString() }], now)).toBe(now + 12_000);
  });
  it("已过期或非法时刻不造成零延迟循环；前台设备改时至多30秒重算", () => {
    const now = Date.parse("2026-10-12T02:00:00Z");
    const p: CardProgress = { cardId: "K001", status: "initial", firstPassAt: "invalid", reviewDueAt: new Date(now - 1).toISOString(), updatedAt: new Date(now).toISOString() };
    expect(nextStudyClockAt([p], now)).toBe(now + 30_000);
  });
});
