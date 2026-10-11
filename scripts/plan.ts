const cards = (from: number, to: number) =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `K${String(from + i).padStart(3, "0")}`,
  );
/** README-Codex §5 is the plan authority; old hourly schedules are not imported. */
export const initialPlan = [
  {
    day: 1,
    title: "需求与建模",
    knowledgeIds: [...cards(1, 14), "K075"],
    caseIds: ["C01", "C02"],
    essayGoal: "收集真实项目素材",
  },
  {
    day: 2,
    title: "软件工程与架构",
    knowledgeIds: cards(15, 29),
    caseIds: ["C04"],
    essayGoal: "形成需求或架构论文提纲",
  },
  {
    day: 3,
    title: "数据库与工程计算",
    knowledgeIds: [...cards(30, 41), ...cards(69, 71)],
    caseIds: ["C03", "C07"],
    essayGoal: "形成数据或规划论文提纲",
  },
  {
    day: 4,
    title: "测试、质量与安全",
    knowledgeIds: [...cards(42, 55), "K074"],
    caseIds: ["C05", "C06"],
    essayGoal: "形成测试或安全论文提纲",
  },
  {
    day: 5,
    title: "分布式与补强",
    knowledgeIds: [...cards(56, 68), "K072", "K073", "K076"],
    caseIds: ["C08", "C09"],
    essayGoal: "完善提纲与项目证据",
  },
  {
    day: 6,
    title: "综合模考",
    knowledgeIds: [],
    caseIds: [],
    essayGoal: "75道单选 + 推荐或自选3套案例 + 1篇完整论文",
  },
  {
    day: 7,
    title: "复习与修订",
    knowledgeIds: [],
    caseIds: [],
    essayGoal: "复习逾期知识与错题，至少2个论文提纲并修订论文",
  },
];
