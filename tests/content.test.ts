import { beforeAll, describe, expect, it } from "vitest";
import { content } from "../src/data/content";
import { validateContent, type Content } from "../src/domain/content-schema";
import { importContent } from "../scripts/import-content";
import { readWorkbook } from "../scripts/read-office";
import { initialPlan } from "../scripts/plan";
import { fileURLToPath } from "node:url";

const mutate = (change: (c: Content) => void) => {
  const c = structuredClone(content);
  change(c);
  return validateContent(c);
};
describe("附件导入与内容合同", () => {
  let source: Awaited<ReturnType<typeof importContent>>;
  beforeAll(async () => {
    source = await importContent();
  });
  it("从真实Excel/Word完整复现当前静态内容", () => {
    expect(source.content).toEqual(content);
    expect(validateContent(content)).toEqual([]);
    expect(source.manifest.sourceFiles).toHaveLength(3);
    expect(source.linkAudit).toHaveLength(150);
  });
  it("处理源XLSX的命名空间及原始公式，读取所有9张表", async () => {
    const file = fileURLToPath(
      new URL(
        "../materials/2026上海系统分析师_7天冲刺题库与学习打卡.xlsx",
        import.meta.url,
      ),
    );
    const book = await readWorkbook(file);
    expect(book.worksheets).toHaveLength(9);
    expect(book.getWorksheet("必背清单76")?.getRow(5).getCell(2).value).toBe(
      "需求类型",
    );
    expect(
      book.getWorksheet("冲刺总览")?.getRow(6).getCell(2).value,
    ).toHaveProperty("formula");
  });
  it("指定知识卡抽查与原始稳定行号一致", () => {
    expect(content.knowledge.find((k) => k.id === "K001")).toMatchObject({
      title: "需求类型",
      priority: "A",
      sourceRef: { row: 5 },
      relatedQuestionIds: ["RK025"],
    });
    expect(content.knowledge.find((k) => k.id === "K013")).toMatchObject({
      title: "开发模型",
      priority: "A",
      sourceRef: { row: 17 },
    });
    expect(content.knowledge.find((k) => k.id === "K075")).toMatchObject({
      title: "BPR/价值链",
      priority: "B",
      sourceRef: { row: 79 },
    });
  });
  it("指定单选题准确关联答案及来源，不混卷", () => {
    expect(content.questions.find((q) => q.id === "RK001")).toMatchObject({
      answer: "A",
      set: "chapter",
      sourceRef: { row: 5 },
      answerSourceRef: { row: 5 },
    });
    expect(content.questions.find((q) => q.id === "RK076")).toMatchObject({
      answer: "D",
      set: "mock",
      sourceRef: { row: 5 },
      answerSourceRef: { row: 80 },
    });
    expect(content.questions.find((q) => q.id === "RK150")).toMatchObject({
      answer: "A",
      set: "mock",
      sourceRef: { row: 79 },
      answerSourceRef: { row: 154 },
    });
  });
  it("C01和C09保留完整场景、参考答案和原文采分组", () => {
    const c01 = content.cases.find((c) => c.id === "C01")!;
    expect(c01.scenario).toContain("客户已拉黑");
    expect(c01.questions[0].referenceAnswer).toContain("适合include");
    expect(
      c01.questions.map((q) => q.scoringRubric.map((r) => r.points)),
    ).toEqual([
      [4, 4],
      [6, 3],
      [4, 4],
    ]);
    const c09 = content.cases.find((c) => c.id === "C09")!;
    expect(c09.scenario).toContain("编造产品价格");
    expect(c09.questions[1].referenceAnswer).toContain("提示注入");
    expect(
      c09.questions.map((q) => q.scoringRubric.map((r) => r.points)),
    ).toEqual([[8], [9], [4, 4]]);
  });
  it("E01和E10及论文通用写法完整且无假造项目经历", () => {
    expect(content.essays[0]).toMatchObject({
      id: "E01",
      title: "需求分析/业务流程重构",
    });
    expect(content.essays[9]).toMatchObject({
      id: "E10",
      title: "企业信息系统集成与AI Agent",
    });
    expect(content.essayGuide.notice).toContain(
      "切勿把下面的示例场景作为自己的真实履历",
    );
    expect(content.essayGuide.selfChecks.map((c) => c.dimension)).toEqual([
      "审题完整",
      "真实项目",
      "技术深度",
      "逻辑过程",
      "效果反思",
      "表达与时间",
    ]);
  });
  it("RK057借用RK046原文情形，保留原始题干与解析", () => {
    const q = content.questions.find((q) => q.id === "RK057")!;
    expect(q.stem).toBe("同一情形下进度绩效指数SPI约为？");
    expect(q.contextQuestionId).toBe("RK046");
    expect(
      content.questions.find((item) => item.id === q.contextQuestionId)?.stem,
    ).toContain("EV=80、AC=100、PV=90");
    expect(q.explanation).toContain("80/90");
  });
  it("保留仅自评卡并且独立模考不作为关联通关题", () => {
    const unlinked = content.knowledge.filter(
      (k) => k.relatedQuestionIds.length === 0,
    );
    expect(unlinked.length).toBeGreaterThan(0);
    expect(
      unlinked.every((k) => k.validationMethod === "self-check-only"),
    ).toBe(true);
    expect(
      content.knowledge
        .flatMap((k) => k.relatedQuestionIds)
        .every((id) => Number(id.slice(2)) <= 75),
    ).toBe(true);
  });
  it("拒绝缺卡、重复ID与A/B数量变化", () => {
    expect(mutate((c) => c.knowledge.pop())).not.toEqual([]);
    expect(mutate((c) => (c.knowledge[1].id = "K001"))).toContain(
      "K 存在重复 ID",
    );
    expect(mutate((c) => (c.knowledge[0].priority = "B"))).toContain(
      "知识 A 级应为 57",
    );
  });
  it("拒绝空选项、缺解析及非法答案", () => {
    expect(mutate((c) => (c.questions[0].options.A = ""))).not.toEqual([]);
    expect(mutate((c) => (c.questions[0].explanation = ""))).not.toEqual([]);
    const c = structuredClone(content) as unknown as {
      questions: { answer: string }[];
    };
    c.questions[0].answer = "E";
    expect(validateContent(c)).not.toEqual([]);
  });
  it("拒绝重复题干、混卷、断裂关联及模考泄漏到知识卡", () => {
    expect(
      mutate((c) => (c.questions[1].stem = c.questions[0].stem)),
    ).toContain("存在重复题干");
    expect(mutate((c) => (c.questions[0].set = "mock"))).toContain(
      "RK001 试卷归属错误",
    );
    expect(
      mutate((c) => (c.questions[0].relatedKnowledgeIds = ["K076"])),
    ).not.toEqual([]);
    expect(
      mutate((c) => (c.knowledge[0].relatedQuestionIds = ["RK135"])),
    ).not.toEqual([]);
  });
  it("拒绝缺失案例答案、错误采分总分及危险资料链接", () => {
    expect(
      mutate((c) => (c.cases[0].questions[0].referenceAnswer = "")),
    ).not.toEqual([]);
    expect(
      mutate((c) => (c.cases[0].questions[0].scoringRubric[0].points = 3)),
    ).toContain("C01-Q1 采分点与小问分值不符");
    expect(
      mutate((c) => (c.sources[0].url = "javascript:alert(1)")),
    ).not.toEqual([]);
  });
  it("静态资料不包含旧用户学习/作答状态", () => {
    expect(JSON.stringify(content)).not.toMatch(
      /"(status|selectedOption|score|firstPassAt|hours)"\s*:/,
    );
  });
});
describe("README规定的首轮通关计划", () => {
  it("D1—D5数量15/15/15/15/16且不缺不重", () => {
    expect(initialPlan.map((d) => d.knowledgeIds.length)).toEqual([
      15, 15, 15, 15, 16, 0, 0,
    ]);
    const ids = initialPlan.flatMap((d) => d.knowledgeIds);
    expect(ids).toHaveLength(76);
    expect(new Set(ids).size).toBe(76);
    expect([...ids].sort()).toEqual(content.knowledge.map((k) => k.id));
  });
  it("跨章节补充卡和每天案例分配符合说明", () => {
    expect(initialPlan[0].knowledgeIds).toContain("K075");
    expect(initialPlan[2].knowledgeIds.slice(-3)).toEqual([
      "K069",
      "K070",
      "K071",
    ]);
    expect(initialPlan[3].knowledgeIds).toContain("K074");
    expect(initialPlan[4].knowledgeIds.slice(-3)).toEqual([
      "K072",
      "K073",
      "K076",
    ]);
    expect(initialPlan.slice(0, 5).map((d) => d.caseIds)).toEqual([
      ["C01", "C02"],
      ["C04"],
      ["C03", "C07"],
      ["C05", "C06"],
      ["C08", "C09"],
    ]);
  });
});
