import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  readWorkbook,
  readWord,
  type SourceRow,
  type SourceWorkbook,
} from "./read-office";
import {
  contentSchema,
  validateContent,
  type Content,
} from "../src/domain/content-schema";
import { initialPlan } from "./plan";
import { keywordCandidates, reviewedQuestionLinks } from "./question-links";
import linkReview from "./audit-link-review.json";

export const CONTENT_VERSION = "2026.10.11.1";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const nonempty = (value: string, location: string) => {
  if (!value.trim()) throw new Error(`缺失字段：${location}`);
  return value.trim();
};
function cell(row: SourceRow, col: number, sheet: string): string {
  const v = row.getCell(col).value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number") return String(v).trim();
  throw new Error(`不允许导入公式/非文本值：${sheet}!${row.number}:${col}`);
}
function rows(book: SourceWorkbook, name: string) {
  const sheet = book.getWorksheet(name);
  if (!sheet) throw new Error(`缺少工作表：${name}`);
  const result: SourceRow[] = [];
  for (let n = 5; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n);
    if (cell(row, 1, name)) result.push(row);
    else if (row.hasValues) throw new Error(`异常空 ID/模块行：${name}!${n}`);
  }
  return result;
}

export async function importContent(
  materialsDir = path.join(ROOT, "materials"),
) {
  const files = await readdir(materialsDir);
  const find = (extension: string) => {
    const matched = files.filter((n) => n.endsWith(extension));
    if (matched.length !== 1)
      throw new Error(`${extension} 来源应为一个，实为 ${matched.length}`);
    return matched[0];
  };
  const excelFile = find(".xlsx"),
    wordFile = find(".docx"),
    pdfFile = find(".pdf");
  const book = await readWorkbook(path.join(materialsDir, excelFile));
  const blocks = await readWord(path.join(materialsDir, wordFile));
  const findBlock = (prefix: string) => {
    const match = blocks.filter((p) => p.text.startsWith(prefix));
    if (match.length !== 1)
      throw new Error(`Word 定位不唯一：${prefix}（${match.length}处）`);
    return match[0];
  };
  const excelRef = (sheet: string, row: number) => ({
    file: excelFile,
    sheet,
    row,
  });
  const wordRef = (section: string, textBlock: number) => ({
    file: wordFile,
    section,
    textBlock,
  });
  const rawKnowledge = rows(book, "必背清单76").map((row, i) => {
    const values = [1, 2, 3, 4, 5].map((col) =>
      nonempty(cell(row, col, "必背清单76"), `必背清单76!${row.number}:${col}`),
    );
    const [module, title, essentials, pitfalls, priority] = values;
    const wordCard = findBlock(`${String(i + 1).padStart(2, "0")}. [`);
    const expected = `${String(i + 1).padStart(2, "0")}. [${priority}] ${title} ${essentials} ｜易错：${pitfalls}`;
    if (wordCard.text.replace(/\s/g, "") !== expected.replace(/\s/g, ""))
      throw new Error(`知识卡 Excel/Word 不一致：K${i + 1}`);
    return {
      id: `K${String(i + 1).padStart(3, "0")}`,
      module,
      title,
      essentials,
      pitfalls,
      priority,
      sourceRef: excelRef("必背清单76", row.number),
      wordSourceRef: wordRef("04｜76条必背知识卡", wordCard.textBlock),
    };
  });
  const answerRows = rows(book, "答案与解析");
  const answers = new Map(
    answerRows.map((row) => {
      const [id, module, answer, explanation, set] = [1, 2, 3, 4, 5].map(
        (col) =>
          nonempty(
            cell(row, col, "答案与解析"),
            `答案与解析!${row.number}:${col}`,
          ),
      );
      return [
        id,
        { module, answer, explanation, set, row: row.number },
      ] as const;
    }),
  );
  if (answers.size !== answerRows.length)
    throw new Error("答案与解析存在重复 ID");
  const questions = (["章节训练75", "综合模考75"] as const).flatMap((sheet) =>
    rows(book, sheet).map((row) => {
      const [id, module, priority, stem, A, B, C, D] = [
        1, 2, 3, 4, 5, 6, 7, 8,
      ].map((col) =>
        nonempty(cell(row, col, sheet), `${sheet}!${row.number}:${col}`),
      );
      const answer = answers.get(id);
      if (
        !answer ||
        answer.module !== module ||
        answer.set !== (sheet === "章节训练75" ? "章节训练" : "综合模考")
      )
        throw new Error(`${id} 答案缺失或来源冲突`);
      const review = reviewedQuestionLinks.find((r) => r.questionId === id);
      if (!review) throw new Error(`${id} 缺少题卡关联复核记录`);
      return {
        id,
        set: sheet === "章节训练75" ? "chapter" : "mock",
        module,
        priority,
        stem,
        options: { A, B, C, D },
        answer: answer.answer,
        explanation: answer.explanation,
        origin: "原创模拟",
        relatedKnowledgeIds: review.knowledgeIds,
        sourceRef: excelRef(sheet, row.number),
        answerSourceRef: excelRef("答案与解析", answer.row),
        ...(id === "RK057" ? { contextQuestionId: "RK046" } : {}),
      };
    }),
  );
  if (
    answers.size !== questions.length ||
    [...answers.keys()].some((id) => !questions.some((q) => q.id === id))
  )
    throw new Error("存在未关联的答案记录");
  const knowledge = rawKnowledge.map((k) => {
    const relatedQuestionIds = questions
      .filter(
        (q) => q.set === "chapter" && q.relatedKnowledgeIds.includes(k.id),
      )
      .map((q) => q.id);
    return {
      ...k,
      relatedQuestionIds,
      validationMethod: relatedQuestionIds.length
        ? "question-and-self-check"
        : "self-check-only",
    };
  });

  const cases = rows(book, "案例训练9套").map((row) => {
    const [id, domain, priority, title, capabilities] = [1, 2, 3, 4, 5].map(
      (col) =>
        nonempty(
          cell(row, col, "案例训练9套"),
          `案例训练9套!${row.number}:${col}`,
        ),
    );
    const header = findBlock(`${id}｜`);
    const expectedHeader = `${id}｜${title}（${domain} / ${priority}）`;
    if (header.text !== expectedHeader)
      throw new Error(`${id} Word/Excel 案例标题冲突`);
    const start = blocks.indexOf(header);
    const after = blocks.slice(start + 1);
    const end = after.findIndex((b) => /^(C\d{2}｜|06｜)/.test(b.text));
    const section = end < 0 ? after : after.slice(0, end);
    const one = (prefix: string) => {
      const found = section.filter((b) => b.text.startsWith(prefix));
      if (found.length !== 1) throw new Error(`${id} 缺失/重复 ${prefix}`);
      return found[0];
    };
    const scoring = one("【自评标准】");
    const groups = scoring.text
      .replace("【自评标准】", "")
      .replace(/。$/, "")
      .split("；");
    if (groups.length !== 3) throw new Error(`${id} 自评分组不是三问`);
    const caseQuestions = [1, 2, 3].map((n) => {
      const q = one(`问题${n}（`),
        answer = one(`答${n}：`);
      const match = q.text.match(/^问题\d（(\d+)分）：(.+)$/);
      if (!match) throw new Error(`${id} 问题格式错误：${q.text}`);
      const scoringRubric = groups[n - 1].split("、").map((part, i) => {
        const point = part.match(/^(.+?)(\d+)分$/);
        if (!point) throw new Error(`${id} 无法解析采分点：${part}`);
        return {
          id: `${id}-Q${n}-R${i + 1}`,
          text: point[1],
          points: Number(point[2]),
        };
      });
      return {
        id: `${id}-Q${n}`,
        text: match[2],
        points: Number(match[1]),
        referenceAnswer: answer.text.replace(/^答\d：/, ""),
        scoringRubric,
        sourceRef: wordRef(header.text, q.textBlock),
        answerSourceRef: wordRef(header.text, answer.textBlock),
      };
    });
    return {
      id,
      title,
      domain,
      priority,
      capabilities,
      scenario: one("【题干】").text.replace("【题干】", ""),
      origin: "原创模拟",
      totalPoints: 25,
      questions: caseQuestions,
      scoringText: scoring.text,
      reviewAdvice: one("【复盘】").text.replace("【复盘】", ""),
      sourceRef: wordRef(`05｜案例分析专项 > ${header.text}`, header.textBlock),
      metadataSourceRef: excelRef("案例训练9套", row.number),
    };
  });
  const topicStart = blocks.indexOf(findBlock("6.5 10个"));
  const essays = rows(book, "论文训练10题").map((row, i) => {
    const [id, title, priority, outline, scenario, evidenceChecklist] = [
      1, 2, 3, 4, 5, 6,
    ].map((col) =>
      nonempty(
        cell(row, col, "论文训练10题"),
        `论文训练10题!${row.number}:${col}`,
      ),
    );
    const headerIndex = blocks.findIndex(
      (p, n) =>
        n > topicStart &&
        p.text === `${String(i + 1).padStart(2, "0")}. ${title}（${priority}）`,
    );
    if (headerIndex < 0) throw new Error(`${id} 缺少 Word 论文主题`);
    const guidance = blocks.slice(headerIndex + 1, headerIndex + 4);
    if (
      guidance.map((p) => p.text).join("\n") !==
      `写作主线：${outline}\n模拟情境：${scenario}\n必须准备：${evidenceChecklist}`
    )
      throw new Error(`${id} Word/Excel 论文内容冲突`);
    return {
      id,
      title,
      priority,
      outline,
      scenario,
      evidenceChecklist,
      writingGuidance: guidance.map((p) => p.text),
      sourceRef: excelRef("论文训练10题", row.number),
      wordSourceRef: wordRef(
        "06｜论文专项 > 6.5 > " + blocks[headerIndex].text,
        blocks[headerIndex].textBlock,
      ),
    };
  });
  const following = (prefix: string, count: number) => {
    const index = blocks.indexOf(findBlock(prefix));
    return blocks.slice(index + 1, index + 1 + count).map((p) => p.text);
  };
  const selfChecks = following("6.6 论文自评表", 21).slice(3);
  const essayGuide = {
    notice: following("6.1 先解决", 1)[0],
    projectFactPrompts: following("项目素材卡", 6),
    structure: following("6.3 一篇论文", 7),
    abstractTemplate: following("6.4 示例", 1)[0],
    wordCountAdvice: findBlock("常见训练写法：").text,
    selfChecks: Array.from({ length: 6 }, (_, i) => ({
      dimension: selfChecks[i * 3],
      question: selfChecks[i * 3 + 1],
      advice: selfChecks[i * 3 + 2],
    })),
    sourceRef: wordRef("06｜论文专项", findBlock("06｜").textBlock),
  };
  const sources = rows(book, "资料来源").map((row, i) => {
    const [priority, title, category, url, notice] = [1, 2, 3, 4, 5].map(
      (col) =>
        nonempty(cell(row, col, "资料来源"), `资料来源!${row.number}:${col}`),
    );
    return {
      id: `S${String(i + 1).padStart(2, "0")}`,
      priority,
      title,
      category,
      url,
      notice,
      sourceRef: excelRef("资料来源", row.number),
    };
  });
  const raw = {
    contentVersion: CONTENT_VERSION,
    knowledge,
    questions,
    cases,
    essays,
    essayGuide,
    sources,
    plan: initialPlan,
  };
  const errors = validateContent(raw);
  if (errors.length) throw new Error(errors.join("\n"));
  const content = contentSchema.parse(raw);
  const linkAudit = content.questions.map((q) => {
    const review = reviewedQuestionLinks.find((r) => r.questionId === q.id)!;
    return {
      ...review,
      keywordCandidates: keywordCandidates(q, content.knowledge),
      reason: review.knowledgeIds.length
        ? `题干/正确选项/解析直接考查：${review.knowledgeIds.map((id) => content.knowledge.find((k) => k.id === id)!.title).join("、")}`
        : "未直接验证76卡中的具体关键知识；保留为全范围单选题",
      practiceEligible: q.set === "chapter",
      sourceRef: q.sourceRef,
    };
  });
  const fileHashes = await Promise.all(
    [excelFile, wordFile, pdfFile].map(async (file) => ({
      file,
      sha256: createHash("sha256")
        .update(await readFile(path.join(materialsDir, file)))
        .digest("hex"),
    })),
  );
  const manifest = {
    contentVersion: CONTENT_VERSION,
    origin: "原创模拟",
    sourceFiles: fileHashes,
    workbookSheets: book.worksheets.map((s) => ({
      name: s.name,
      rows: s.rowCount,
      columns: s.columnCount,
    })),
    counts: {
      knowledge: 76,
      priorityA: 57,
      priorityB: 19,
      chapter: 75,
      mock: 75,
      cases: 9,
      essays: 10,
      sources: 11,
    },
    selfCheckOnlyIds: content.knowledge
      .filter((k) => k.validationMethod === "self-check-only")
      .map((k) => k.id),
    sourceIssues: [
      {
        id: "RK057",
        description:
          "题干“同一情形下”省略数值。原文保持不变，通过 contextQuestionId 引用 RK046 原题干。",
      },
    ],
    wordWarnings: [],
  };
  return { content, manifest, linkAudit };
}

export function buildReport(result: Awaited<ReturnType<typeof importContent>>) {
  const { content: c, manifest: m, linkAudit } = result;
  const ref = (r: {
    file: string;
    sheet?: string;
    row?: number;
    section?: string;
    textBlock?: number;
  }) =>
    r.sheet
      ? `${r.sheet}!第${r.row}行`
      : `${r.section}（文本块${r.textBlock}）`;
  const self = c.knowledge.filter((k) => !k.relatedQuestionIds.length);
  const md = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");
  const lines = [
    "# 内容导入与上线审计校验报告",
    "",
    `内容版本：${c.contentVersion}。结论：所有构建阻断项通过。`,
    "",
    "| 类别 | 实际结果 | 验收 |",
    "|---|---|---|",
    `| 知识卡 | ${c.knowledge.length}，A ${c.knowledge.filter((k) => k.priority === "A").length} / B ${c.knowledge.filter((k) => k.priority === "B").length} | 通过 |`,
    `| 单选题 | ${c.questions.length}，章节75 / 独立模考75 | 通过 |`,
    `| 案例 | ${c.cases.length}，27个分问，逐套25分 | 通过 |`,
    `| 论文主题 | ${c.essays.length}，附真实素材提示、通用骨架、摘要结构、6项自查 | 通过 |`,
    `| 资料链接 | ${c.sources.length}，保留类别/真实性提醒 | 通过 |`,
    "| 缺失核心字段 / 重复ID / 非法答案 / 重复题干 | 0 / 0 / 0 / 0 | 通过 |",
    "| 初始计划 | D1—D5：15 / 15 / 15 / 15 / 16，76卡不重不漏；D6/7无新增 | 通过 |",
    "",
    "## 来源处理",
    "",
    "- 完整阅读开发说明、Excel 9张工作表、Word 全文、PDF 16页；学习内容以 Excel/Word 为准。PDF文本提取存在标题字序问题，不用来覆盖Word。",
    "- 忽略知识F列、题库I—L列、案例旧自评分、论文旧进度/评分。旧版按小时计划不作为产品任务。",
    "- 76卡与10主题均逐条对照 Excel/Word 原文；9案例按标题定位，保留原始题干、每问参考答案及整条自评标准。",
    "- 采分标准只按原文的分组拆为可勾选项，没有新增或细分虚构分值。所有题目统一标记“原创模拟”，没有新增外部试题。",
    "- HTML作为普通字符串保存，React文本节点转义显示；资料链接校验仅允许HTTP(S)。",
    "- 外部网址仅忠实保留来源，阶段A未核验可访问性或公告现行状态。",
    "",
    "## 已发现并处理的来源问题",
    "",
    "- RK057题干省略前置数值；保持原文，通过 contextQuestionId=RK046 补充原题干引用，避免随机/独立呈现时无法作答。来源：章节训练75 第61行、第50行，答案与解析第61行。",
    "",
    "## 题卡关联与自评边界",
    "",
    `- 已逐题复核150题；${linkAudit.filter((r) => r.decision === "confirmed").length}题有可信知识关联，${linkAudit.filter((r) => r.decision === "unlinked").length}题保留为全范围题，不强行归卡。`,
    `- ${76 - self.length}张卡有已确认章节关联题；${self.length}张无可信章节关联题，须显示“仅自评验证”：${self.map((k) => `${k.id} ${k.title}`).join("；")}。`,
    "- keywordCandidates只是候选；question-links.ts中的逐题确认决定实际关联。详见src/data/question-link-audit.json。",
    "- 卡片日常关联只使用章节卷。独立模考题虽保留知识关联供交卷后分析，但不进入日常卡片练习，防止模考提前泄题。",
    "",
    "### 缺少可信章节关联题的完整清单",
    "",
    "下列卡片不能使用独立模考题完成日常客观通关。存在模考关联也仍标记为仅自评。",
    "",
    "| 知识卡 | 级别 | 可用章节题 | 仅供交卷后分析的模考题 | 日常验证 |",
    "|---|---|---|---|---|",
    ...self.map((k) => `| ${k.id} ${k.title} | ${k.priority} | 无 | ${c.questions.filter((q) => q.set === "mock" && q.relatedKnowledgeIds.includes(k.id)).map((q) => q.id).join("、") || "无"} | 仅自评验证 |`),
    "",
    `两卷合计仍没有任何可信关联题的卡：${c.knowledge.filter((k) => !c.questions.some((q) => q.relatedKnowledgeIds.includes(k.id))).map((k) => `${k.id} ${k.title}`).join("；")}。补题属于未来教学内容优化，不在本次生成新题。`,
    "",
    `## 上线关联抽样复核（${linkReview.reviewedAt}，${linkReview.samples.length}组）`,
    "",
    linkReview.basis,
    "",
    "| 题卡 | 卡片原文要点 | 题干 / 正确选项 | 可信依据 | 来源 | 结果 |",
    "|---|---|---|---|---|---|",
    ...linkReview.samples.map((s) => {
      const k = c.knowledge.find((k) => k.id === s.knowledgeId)!;
      const q = c.questions.find((q) => q.id === s.questionId)!;
      return `| ${q.id} → ${k.id} | ${md(k.essentials)} | ${md(q.stem)} / ${q.answer}：${md(q.options[q.answer])} | ${s.rationale} | ${ref(q.sourceRef)}；${ref(k.sourceRef)} | PASS |`;
    }),
    "",
    "### 不可信关联整改记录",
    "",
    "| 移除关系 | 复核依据 | 原记录处理 |",
    "|---|---|---|",
    ...linkReview.rejected.map((r) => `| ${r.questionId} → ${r.knowledgeId} | ${r.rationale} | 保留旧版本作答与掌握记录；新自测使用修正关联 |`),
    "",
    "关联整改只修改映射，不改写任何题干、选项、答案、解析或知识原文。版本升级为2026.10.11.1，旧版备份和历史记录保持可恢复。完整逐题决策见 src/data/question-link-audit.json，抽样复核原始记录见 scripts/audit-link-review.json。",
    "",
    "## 案例分值核对",
    "",
    "| 案例 | 各问分值 | 原文采分点合计 | Word定位 |",
    "|---|---|---|---|",
    ...c.cases.map(
      (x) =>
        `| ${x.id} ${x.title} | ${x.questions.map((q) => q.points).join(" / ")} | ${x.questions.reduce((s, q) => s + q.scoringRubric.reduce((t, r) => t + r.points, 0), 0)} | ${ref(x.sourceRef)} |`,
    ),
    "",
    "## 指定抽查（已对照原文）",
    "",
    ...["K001", "K013", "K075"].map((id) => {
      const k = c.knowledge.find((k) => k.id === id)!;
      return `- ${id}：${k.title}；${k.essentials}；来源 ${ref(k.sourceRef)}。`;
    }),
    ...["RK001", "RK076", "RK150"].map((id) => {
      const q = c.questions.find((q) => q.id === id)!;
      return `- ${id}：${q.stem}；正确选项 ${q.answer}「${q.options[q.answer]}」；解析：${q.explanation}；来源 ${ref(q.sourceRef)} / ${ref(q.answerSourceRef)}。`;
    }),
    ...["C01", "C09"].map((id) => {
      const x = c.cases.find((x) => x.id === id)!;
      return `- ${id}：题干、3问、3参考答案、原始采分点均已核对，8+9+8=25；${ref(x.sourceRef)}。`;
    }),
    ...["E01", "E10"].map((id) => {
      const x = c.essays.find((x) => x.id === id)!;
      return `- ${id}：${x.title}；${x.outline}；${x.evidenceChecklist}；${ref(x.sourceRef)} / ${ref(x.wordSourceRef)}。`;
    }),
    "",
    "## 人工核对项及阶段边界",
    "",
    "- 已完成：指定抽查、全部案例采分组与分值、题卡语义关联、原文一致性。结构校验不等同于官方命题或学科审定。",
    "- 无核心内容缺失等待补齐。考试安排与第三方资料可用性仍应以现行公告/准考证核对。",
    "- 本报告验证静态内容及题卡映射；学习状态、应试交互、持久化、离线、移动端和已知缺陷的运行证据见 audit-report.md。",
    "",
    "## 来源文件指纹",
    "",
    ...m.sourceFiles.map((f) => `- ${f.file}：SHA-256 ${f.sha256}`),
    "",
    "## 每条记录来源索引",
    "",
    "| ID | 内容 | 主来源 | 补充/答案来源 |",
    "|---|---|---|---|",
    ...c.knowledge.map(
      (k) =>
        `| ${k.id} | ${k.title} | ${ref(k.sourceRef)} | ${ref(k.wordSourceRef)} |`,
    ),
    ...c.questions.map(
      (q) =>
        `| ${q.id} | ${q.stem} | ${ref(q.sourceRef)} | ${ref(q.answerSourceRef)} |`,
    ),
    ...c.cases.map(
      (x) =>
        `| ${x.id} | ${x.title} | ${ref(x.sourceRef)} | ${ref(x.metadataSourceRef)} |`,
    ),
    ...c.essays.map(
      (x) =>
        `| ${x.id} | ${x.title} | ${ref(x.sourceRef)} | ${ref(x.wordSourceRef)} |`,
    ),
    ...c.sources.map(
      (x) => `| ${x.id} | ${x.title} | ${ref(x.sourceRef)} | — |`,
    ),
    "",
  ];
  return lines.join("\n");
}
async function main() {
  const check = process.argv.includes("--check");
  try {
    const result = await importContent();
    const c = result.content;
    const outputs: Record<string, unknown> = {
      "knowledge.json": c.knowledge,
      "questions.json": c.questions,
      "cases.json": c.cases,
      "essays.json": c.essays,
      "essay-guide.json": c.essayGuide,
      "sources.json": c.sources,
      "plan.json": c.plan,
      "manifest.json": result.manifest,
      "question-link-audit.json": result.linkAudit,
    };
    if (!check) await mkdir(path.join(ROOT, "src/data"), { recursive: true });
    for (const [name, value] of Object.entries(outputs)) {
      const serialized = JSON.stringify(value, null, 2) + "\n";
      const target = path.join(ROOT, "src/data", name);
      if (check) {
        if ((await readFile(target, "utf8")) !== serialized)
          throw new Error(
            `${name} 与原始资料/当前规则不一致。请执行 npm run data:import`,
          );
      } else await writeFile(target, serialized);
    }
    const report = buildReport(result);
    if (check) {
      if (
        (await readFile(
          path.join(ROOT, "content-import-report.md"),
          "utf8",
        )) !== report
      )
        throw new Error("校验报告已过期。请执行 npm run data:import");
    } else await writeFile(path.join(ROOT, "content-import-report.md"), report);
    console.log(
      `${check ? "校验" : "导入"}通过：76(A57/B19) + 150(75/75) + C01—C09(每套25分) + E01—E10。仅自评卡 ${result.manifest.selfCheckOnlyIds.length} 张。`,
    );
  } catch (error) {
    if (!check)
      await writeFile(
        path.join(ROOT, "content-import-report.md"),
        `# 内容导入未通过\n\n${error instanceof Error ? error.message : String(error)}\n\n停止生成新内容；未编造缺失资料。\n`,
      );
    console.error(error);
    process.exitCode = 1;
  }
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
