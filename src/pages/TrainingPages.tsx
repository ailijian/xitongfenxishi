import { useEffect, useState } from "react";
import { Link, NavLink, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { content } from "../data/content";
import { db, recordId } from "../storage/db";
import {
  ensureCase,
  patchCase,
  revealCase,
  saveCase,
  ensureEssay,
  patchEssay,
  checkEssay,
  patchProject,
  submitExamEssay,
} from "../storage/training";
import {
  caseScore,
  characterCount,
  essayText,
  type ProjectFacts,
} from "../domain/training";
import {
  Badge,
  PageTitle,
  Source,
  ErrorMessage,
  friendlyError,
} from "../components/ui";
import { copyText, downloadText } from "../components/download";
export function TrainingList({ essays = false }: { essays?: boolean }) {
  const records = useLiveQuery(
    async () =>
      essays
        ? (await db.essayDrafts.toArray()).map((d) => d.essayId)
        : (await db.caseAttempts.toArray()).map((a) => a.caseId),
    [essays],
  );
  return (
    <>
      <PageTitle
        eyebrow="PRACTICAL TRAINING"
        title={essays ? "论文专题" : "案例与论文"}
        description="先独立作答，再核对原文。以真实项目支撑论文推导。"
      />
      <div className="tabs">
        <NavLink to="/cases">案例 9 套</NavLink>
        <NavLink to="/essays">论文 10 题</NavLink>
      </div>
      <Link className="secondary" to="/mock">
        完整综合模考 →
      </Link>
      <div className="card-list">
        {(essays ? content.essays : content.cases).map((item) => (
          <Link
            className="list-card"
            key={item.id}
            to={`/${essays ? "essays" : "cases"}/${item.id}`}
          >
            <div className="list-meta">
              <span>{item.id}</span>
              <Badge>{item.priority} 级</Badge>
            </div>
            <h2>{item.title}</h2>
            <p>
              {"domain" in item
                ? `${item.domain} · 3 问 · 25 分 · 原创模拟`
                : item.outline}
            </p>
            <span className="subtle">
              {records?.filter((r) => r === item.id).length
                ? essays
                  ? "已有保存草稿"
                  : "已有训练记录"
                : "尚未训练"}
            </span>
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>
    </>
  );
}
export function CasePage() {
  const { id } = useParams();
  const c = content.cases.find((c) => c.id === id);
  return c ? <CaseEditor key={id} caseId={c.id} /> : <p>案例不存在</p>;
}
function CaseEditor({ caseId }: { caseId: string }) {
  const c = content.cases.find((c) => c.id === caseId)!,
    [params] = useSearchParams(),
    examId = params.get("exam") ?? undefined;
  const draft = useLiveQuery(() => db.caseDrafts.get(caseId), [caseId]),
    history = useLiveQuery(
      () =>
        db.caseAttempts
          .where("caseId")
          .equals(caseId)
          .reverse()
          .sortBy("createdAt"),
      [caseId],
    );
  const [error, setError] = useState(""),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  useEffect(() => {
    void run(() => ensureCase(caseId));
  }, [caseId]);
  const all = c.questions.flatMap((q) => q.scoringRubric);
  async function submit() {
    setBusy(true);
    await run(async () => {
      const a = await saveCase(caseId, examId);
      setSaved(`自评 ${a.selfScore} / 25 分，训练记录已保存。`);
    });
    setBusy(false);
  }
  return (
    <>
      <Link
        className="back-link"
        to={examId ? `/mock?run=${examId}` : "/cases"}
      >
        ← {examId ? "返回本场模考" : "案例训练"}
      </Link>
      <PageTitle
        eyebrow={`${c.id} / 原创模拟 / 25分`}
        title={c.title}
        description={c.domain}
      />
      <ErrorMessage message={error} />
      {saved && (
        <p role="status" className="success-message">
          {saved}
        </p>
      )}
      <section className="paper">
        <h2>题干</h2>
        <p className="reading">{c.scenario}</p>
        <Source source={c.sourceRef} />
      </section>
      {draft && (
        <div key={draft.id}>
          {c.questions.map((q) => (
            <details className="paper case-question" open key={q.id}>
              <summary>
                {q.text} · {q.points}分
              </summary>
              <label className="field-label">
                {q.id} 我的独立回答
                <textarea
                  rows={6}
                  defaultValue={draft.answers[q.id] ?? ""}
                  onChange={(e) =>
                    void run(() =>
                      patchCase(caseId, "answers", q.id, e.target.value),
                    )
                  }
                />
              </label>
              {draft.revealed && (
                <>
                  <h3>参考答案</h3>
                  <p className="reading">{q.referenceAnswer}</p>
                  <h3>采分点自评</h3>
                  {q.scoringRubric.map((r) => (
                    <label className="check-row" key={r.id}>
                      <input
                        type="checkbox"
                        defaultChecked={!!draft.checks[r.id]}
                        onChange={(e) =>
                          void run(() =>
                            patchCase(caseId, "checks", r.id, e.target.checked),
                          )
                        }
                      />
                      <span>
                        {r.text} <strong>{r.points} 分</strong>
                      </span>
                    </label>
                  ))}
                  <Source source={q.answerSourceRef} />
                </>
              )}
            </details>
          ))}
        </div>
      )}
      {!draft ? (
        <p role="status">正在载入作答…</p>
      ) : !draft.revealed ? (
        <button
          className="primary"
          onClick={() => void run(() => revealCase(caseId))}
        >
          作答完成，揭示参考答案
        </button>
      ) : (
        <section className="paper">
          <h2>本次自评 {caseScore(caseId, draft.checks)} / 25 分</h2>
          <p className="subtle">
            采分组与分值逐字来自原文，整组达到才勾选。此分数是本人自评。
          </p>
          <h3>漏掉的采分点</h3>
          {all
            .filter((r) => !draft.checks[r.id])
            .map((r) => (
              <p className="history-row" key={r.id}>
                {r.text} · {r.points}分
              </p>
            ))}
          {all.every((r) => draft.checks[r.id]) && <p>全部采分组已覆盖。</p>}
          <div className="button-row">
            <button
              className="primary"
              disabled={busy}
              onClick={() => void submit()}
            >
              保存本次案例训练
            </button>
            <button
              className="secondary"
              onClick={() =>
                void run(async () => {
                  await db.caseDrafts.delete(caseId);
                  await ensureCase(caseId);
                  setSaved("已新建独立作答，历史记录保留。");
                })
              }
            >
              开始新一次作答
            </button>
          </div>
        </section>
      )}
      <section className="paper">
        <h2>训练历史 · {history?.length ?? 0}次</h2>
        {history?.map((a) => (
          <details key={a.id}>
            <summary>
              {new Date(a.createdAt).toLocaleString("zh-CN")} · 自评{" "}
              {a.selfScore}/25
            </summary>
            {c.questions.map((q) => (
              <p className="reading" key={q.id}>
                {q.id}：{a.answers[q.id]}
              </p>
            ))}
          </details>
        ))}
        <p className="subtle">
          草稿自动保存在本设备，保存训练记录后仍可继续修改草稿。
        </p>
        {draft && (
          <p className="save-note">
            草稿已保存：{new Date(draft.updatedAt).toLocaleTimeString("zh-CN")}
          </p>
        )}
      </section>
      {examId && (
        <Link className="primary" to={`/mock?run=${examId}`}>
          返回本场模考 →
        </Link>
      )}
    </>
  );
}
export function EssayPage() {
  const { id } = useParams();
  return content.essays.some((e) => e.id === id) ? (
    <EssayEditor key={id} essayId={id!} />
  ) : (
    <p>论文专题不存在</p>
  );
}
function EssayEditor({ essayId }: { essayId: string }) {
  const e = content.essays.find((e) => e.id === essayId)!,
    [params] = useSearchParams(),
    examId = params.get("exam") ?? undefined;
  const draft = useLiveQuery(() => db.essayDrafts.get(essayId), [essayId]),
    projects = useLiveQuery(() => db.projects.toArray(), []);
  const [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  useEffect(() => {
    void run(() => ensureEssay(essayId));
  }, [essayId]);
  const p = projects?.find((p) => p.id === draft?.projectId);
  async function newProject() {
    const id = recordId();
    await db.projects.add({
      id,
      name: "新项目素材",
      background: "",
      role: "",
      decisions: "",
      problems: "",
      results: "",
      reflection: "",
      updatedAt: new Date().toISOString(),
    });
    await patchEssay(essayId, { projectId: id });
  }
  return (
    <>
      <Link
        className="back-link"
        to={examId ? `/mock?run=${examId}` : "/essays"}
      >
        ← {examId ? "返回本场模考" : "论文专题"}
      </Link>
      <PageTitle
        eyebrow={`${e.id} / ${e.priority} 级`}
        title={e.title}
        description="写下你的真实经历，形成可推导、可验证的技术过程。"
      />
      <ErrorMessage message={error} />
      {saved && (
        <p className="success-message" role="status">
          {saved}
        </p>
      )}
      <section className="paper">
        <h2>写作主线</h2>
        <p>{e.outline}</p>
        <h3>建议情境</h3>
        <p>{e.scenario}</p>
        <h3>必须准备</h3>
        <p>{e.evidenceChecklist}</p>
        <Source source={e.sourceRef} />
        <details>
          <summary>通用骨架与原文写作提示</summary>
          <ol>
            {content.essayGuide.structure.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p>{content.essayGuide.abstractTemplate}</p>
          <p>{content.essayGuide.notice}</p>
          <Source source={content.essayGuide.sourceRef} />
        </details>
      </section>
      {draft && (
        <>
          <section className="paper">
            <h2>真实项目素材库</h2>
            <p className="subtle">
              素材在各专题间共享，可对敏感名称匿名化。请按实际情况填写，不编造职责或数据。
            </p>
            <label className="field-label">
              选择项目
              <select
                value={draft.projectId ?? ""}
                onChange={(ev) =>
                  void run(() =>
                    patchEssay(essayId, {
                      projectId: ev.target.value || undefined,
                    }),
                  )
                }
              >
                <option value="">尚未选择</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => void run(newProject)}>新建项目素材</button>
            {p && (
              <div key={p.id}>
                {(
                  [
                    ["name", "项目名称"],
                    ["background", "项目背景与业务约束"],
                    ["role", "本人真实职责"],
                    ["decisions", "架构与决策依据"],
                    ["problems", "难点与解决过程"],
                    ["results", "验证结果与证据"],
                    ["reflection", "不足与反思"],
                  ] as const
                ).map(([field, label]) => (
                  <label className="field-label" key={field}>
                    {label}
                    <textarea
                      rows={field === "name" ? 2 : 4}
                      defaultValue={p[field]}
                      onChange={(ev) =>
                        void run(() =>
                          patchProject(p.id, {
                            [field]: ev.target.value,
                          } as Partial<ProjectFacts>),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            )}
          </section>
          <section className="paper">
            <h2>提纲编辑器</h2>
            <label className="field-label">
              我的论文提纲
              <textarea
                rows={8}
                defaultValue={draft.outline}
                onChange={(ev) =>
                  void run(() =>
                    patchEssay(essayId, { outline: ev.target.value }),
                  )
                }
              />
            </label>
            <p>{characterCount(draft.outline)} 字（不含空白）</p>
          </section>
          <section className="paper">
            <h2>正文草稿</h2>
            <label className="field-label">
              我的论文正文
              <textarea
                className="essay-body"
                rows={18}
                defaultValue={draft.body}
                onChange={(ev) =>
                  void run(() => patchEssay(essayId, { body: ev.target.value }))
                }
              />
            </label>
            <p className="word-count">
              正文 {characterCount(draft.body)} 字（不含空白，按 Unicode
              字符计数）
            </p>
            <p className="subtle">{content.essayGuide.wordCountAdvice}</p>
            <p className="save-note">
              已保存到本设备：
              {new Date(draft.updatedAt).toLocaleTimeString("zh-CN")}
            </p>
            <div className="button-row">
              <button
                onClick={() =>
                  void run(async () => {
                    await copyText(essayText(draft));
                    setSaved("论文提纲和正文已复制。");
                  })
                }
              >
                复制全文
              </button>
              <button
                onClick={() =>
                  downloadText(`${essayId}-论文.txt`, essayText(draft))
                }
              >
                导出 TXT
              </button>
              <button
                onClick={() =>
                  downloadText(
                    `${essayId}-论文.md`,
                    essayText(draft, true),
                    "text/markdown;charset=utf-8",
                  )
                }
              >
                导出 Markdown
              </button>
            </div>
          </section>
          <section className="paper">
            <h2>写作自查</h2>
            {content.essayGuide.selfChecks.map((c) => (
              <label className="check-row" key={c.dimension}>
                <input
                  type="checkbox"
                  defaultChecked={!!draft.checks[c.dimension]}
                  onChange={(ev) =>
                    void run(() =>
                      checkEssay(essayId, c.dimension, ev.target.checked),
                    )
                  }
                />
                <span>
                  <strong>{c.dimension}</strong>：{c.question}
                  <small>{c.advice}</small>
                </span>
              </label>
            ))}
            <p className="subtle">自查由本人判断，不自动阅卷或预测官方分数。</p>
            {examId && (
              <>
                <p>
                  确认这是一篇完成的论文后提交。本场保留提交时的完整快照；后续修改草稿不改动该记录。
                </p>
                <button
                  className="primary"
                  onClick={() =>
                    void run(async () => {
                      await submitExamEssay(examId);
                      setSaved("本场论文已提交并保存快照。");
                    })
                  }
                >
                  确认完整论文并提交本场模考
                </button>
              </>
            )}
          </section>
        </>
      )}
      {!draft && <p role="status">正在载入论文草稿…</p>}
      {examId && (
        <Link className="primary" to={`/mock?run=${examId}`}>
          查看本场模考进度 →
        </Link>
      )}
    </>
  );
}
