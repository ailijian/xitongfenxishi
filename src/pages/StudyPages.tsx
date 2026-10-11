import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { content } from "../data/content";
import {
  Badge,
  PageTitle,
  Source,
  ErrorMessage,
  friendlyError,
} from "../components/ui";
import {
  dateOrdinal,
  getDailyPlan,
  localDate,
  recallPoints,
  statusLabel,
} from "../domain/study";
import {
  beginCard,
  db,
  toggleRecallCheck,
  patchLearningDraft,
  submitQuestion,
  unresolvedWrong,
  useStudyData,
  validateCard,
  type PracticeSession,
} from "../storage/db";
import type { KnowledgeCard } from "../domain/content-schema";
import { useStudyClock } from "../hooks/useStudyClock";
import { mockQuestionAccess } from "../domain/mock-access";
import { beginnerLessons } from "../data/lessons";
import { BeginnerLesson } from "../components/BeginnerLesson";

export function Today() {
  const data = useStudyData();
  const now = useStudyClock(data?.cards);
  const training = useLiveQuery(
    async () => ({
      cases: await db.caseAttempts.toArray(),
      essays: await db.essayDrafts.toArray(),
      exams: await db.exams.toArray(),
    }),
    [],
  );
  if (!data) return <p role="status">正在载入本设备学习记录…</p>;
  const today = localDate(new Date(now));
  const plan = getDailyPlan(data.cards, data.settings, today, now),
    examDays = Math.max(
      0,
      dateOrdinal("2026-10-24") - dateOrdinal(today),
    );
  const next = plan.queue[0];
  return (
    <>
      <PageTitle
        eyebrow={`DAY ${plan.day} / 7 · ${examDays} 天后考试首日`}
        title="今天，掌握一个再向前。"
        description="考试窗口2026-10-24/25，具体日期与批次以准考证为准。"
      />
      <section className="hero">
        <div className="hero-top">
          <Badge>
            {plan.rawDay < 1
              ? "尚未到启动日"
              : plan.day > 7
                ? "冲刺后的复习"
                : content.plan[plan.day - 1].title}
          </Badge>
          <span>知识点达标制</span>
        </div>
        <h2>
          今日首轮通过
          <br />
          <span className="hero-count">{plan.doneToday}</span> / {plan.target}{" "}
          个
        </h2>
        <p>
          原计划 {plan.originalGoal} 个 · 待新增 {plan.fresh.length} 个 ·
          历史欠账 {plan.backlog.length} 个
        </p>
        <Link
          className="primary light"
          to={next ? `/learn/${next.id}` : "/practice"}
        >
          {next
            ? `继续${plan.due.some((k) => k.id === next.id) ? "复习" : "学习"}：${next.title}`
            : "知识首轮已完成，继续练习"}{" "}
          →
        </Link>
      </section>
      {plan.day >= 6 && plan.remaining > 0 && (
        <p className="notice">
          还有 {plan.remaining}{" "}
          个知识点未通过。补学会挤占模考与复习，请优先处理到期复习和历史欠账。
        </p>
      )}
      <div className="metrics">
        {[
          [76 - plan.remaining, "首轮通过 / 76"],
          [plan.consolidated, "巩固掌握 / 76"],
          [plan.aConsolidated, "A 级巩固 / 57"],
          [plan.due.length, "到期与失败待复习"],
        ].map(([n, label]) => (
          <div className="metric" key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section>
        <div className="section-head">
          <h2>今天的优先队列</h2>
          <Link to="/learn">全部知识 →</Link>
        </div>
        <div className="card-list">
          {plan.queue.slice(0, 5).map((k) => (
            <Link className="list-card" key={k.id} to={`/learn/${k.id}`}>
              <div className="list-meta">
                <span>
                  {k.id} · {k.priority}级
                </span>
                <Badge>
                  {plan.due.includes(k)
                    ? "到期复习"
                    : plan.backlog.includes(k)
                      ? "历史欠账"
                      : plan.fresh.includes(k)
                        ? "今日新增"
                        : "可提前学习"}
                </Badge>
              </div>
              <h2>{k.title}</h2>
              <span className="arrow">→</span>
            </Link>
          ))}
        </div>
        {!plan.queue.length && <p>全部知识已完成首轮，继续复习与练习。</p>}
      </section>
      <section>
        <h2>后续任务随掌握量调整</h2>
        <div className="day-strip">
          {plan.upcoming.map((d) => (
            <div key={d.day}>
              <span>D{d.day}</span>
              <strong>
                {d.day < 6 ? d.remaining : d.day === 6 ? "模考" : "复习"}
              </strong>
            </div>
          ))}
        </div>
        <p className="subtle">
          剩余 {plan.remaining} 个。若在D5前完成，后续学习日预计每天需通过{" "}
          {plan.requiredDaily} 个；允许自由继续下一天。到期复习 → 历史欠账 →
          今日新增 → 配套练习。
        </p>
      </section>
      <section className="paper">
        <h2>各科训练指标</h2>
        <p>
          章节覆盖{" "}
          {
            new Set(
              data.questionAttempts
                .filter((a) => a.set === "chapter")
                .map((a) => a.questionId),
            ).size
          }
          /75题 · 待复习错题 {unresolvedWrong(data.questionAttempts).length}道
        </p>
        <p>
          案例已练 {new Set(training?.cases.map((a) => a.caseId)).size}/9套 ·
          论文提纲{" "}
          {training?.essays.filter((e) => e.outline.trim()).length ?? 0}/10题
        </p>
        <p>
          完整模考已完成{" "}
          {training?.exams.filter((e) => e.essaySubmittedAt).length ?? 0}场
        </p>
        <p className="subtle">重复同一试卷记为同卷复练，不代表新题独立模拟成绩。</p>
        <p className="subtle">
          首次独立 {training?.exams.filter((e) => e.essaySubmittedAt && data.sessions.find((s) => s.id === e.sessionId)?.mockKind === "first-independent").length ?? 0} 场 ·
          同卷复练 {training?.exams.filter((e) => e.essaySubmittedAt && data.sessions.find((s) => s.id === e.sessionId)?.mockKind === "same-paper-practice").length ?? 0} 场 ·
          历史类型未记录 {training?.exams.filter((e) => e.essaySubmittedAt && !data.sessions.find((s) => s.id === e.sessionId)?.mockKind).length ?? 0} 场
        </p>
        <Link
          className="primary"
          to={
            plan.day <= 5
              ? `/practice?mode=daily&day=${plan.day}`
              : "/practice?mode=wrong"
          }
        >
          {plan.day <= 5 ? "配套章节练习" : "错题复习"} →
        </Link>
        <Link className="back-link" to="/progress">
          查看真实成绩与准备情况 →
        </Link>
      </section>
      <section className="paper">
        <h2>案例与论文任务</h2>
        <div className="chips">
          {(content.plan.find((d) => d.day === plan.day)?.caseIds ?? []).map(
            (id) => (
              <Link key={id} to={`/cases/${id}`}>
                {id} →
              </Link>
            ),
          )}
        </div>
        <p>
          {content.plan.find((d) => d.day === plan.day)?.essayGoal ??
            "复习逾期知识、错题和论文素材"}
        </p>
        <Link to={plan.day === 6 ? "/mock" : "/essays"} className="primary">
          {plan.day === 6 ? "进入完整模考" : "准备论文素材"} →
        </Link>
      </section>
      <p className="phase-note">
        学习记录保存在当前浏览器。换设备不会自动同步，清理存储可能删除记录；请在“我的”定期导出完整备份。
      </p>
    </>
  );
}
export function Learn() {
  const data = useStudyData(),
    [search, setSearch] = useState(""),
    [priority, setPriority] = useState(""),
    [module, setModule] = useState(""),
    [status, setStatus] = useState("");
  const now = useStudyClock(data?.cards);
  const cards = content.knowledge.filter(
    (k) =>
      (!priority || k.priority === priority) &&
      (!module || k.module === module) &&
      (!status ||
        statusLabel(data?.cards.find((p) => p.cardId === k.id), now) === status) &&
      `${k.title}${k.essentials}${k.pitfalls}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="KNOWLEDGE"
        title="知识通关"
        description="理解、闭卷回忆、要点自检与关联选择题。仅打开卡片不计掌握。"
      />
      <label>
        <span className="sr-only">搜索知识</span>
        <input
          type="search"
          placeholder="搜索知识点或关键词"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div className="filters">
        <select
          aria-label="优先级"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="">全部优先级</option>
          <option>A</option>
          <option>B</option>
        </select>
        <select
          aria-label="知识模块"
          value={module}
          onChange={(e) => setModule(e.target.value)}
        >
          <option value="">全部模块</option>
          {[...new Set(content.knowledge.map((k) => k.module))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <select
        aria-label="掌握状态"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">全部掌握状态</option>
        {["未开始", "学习中", "初步掌握", "巩固掌握", "需复习"].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <p className="subtle" role="status">
        共 {cards.length} 个知识点
      </p>
      <div className="card-list">
        {cards.map((k) => (
          <Link className="list-card" key={k.id} to={`/learn/${k.id}`}>
            <div className="list-meta">
              <span>
                {k.id} · {k.priority}级
              </span>
              <Badge>
                {statusLabel(data?.cards.find((p) => p.cardId === k.id), now)}
              </Badge>
            </div>
            <h2>{k.title}</h2>
            <p>{k.module}</p>
            <p className="subtle">{beginnerLessons.has(k.id) ? "零基础课程版" : "考前速记版 · 暂无完整入门课程"}</p>
            <span className="subtle">
              {k.relatedQuestionIds.length
                ? `${k.relatedQuestionIds.length} 道章节关联题`
                : "仅自评验证"}
            </span>
            <span className="arrow">→</span>
          </Link>
        ))}
      </div>
      {!cards.length && <p>没有匹配的知识点。</p>}
    </>
  );
}
export function LearnDetail() {
  const { id } = useParams(),
    card = content.knowledge.find((k) => k.id === id);
  return card ? (
    <LearningCard key={card.id} card={card} />
  ) : (
    <p>
      知识点不存在。<Link to="/learn">返回知识</Link>
    </p>
  );
}
function LearningCard({ card: k }: { card: KnowledgeCard }) {
  const draft = useLiveQuery(() => db.learningDrafts.get(k.id), [k.id]),
    progress = useLiveQuery(() => db.cards.get(k.id), [k.id]),
    history = useLiveQuery(
      () => db.cardAttempts.where("cardId").equals(k.id).toArray(),
      [k.id],
    );
  const now = useStudyClock(progress ? [progress] : undefined);
  const question = content.questions.find(
    (q) => q.id === (draft?.questionId ?? k.relatedQuestionIds[0]),
  );
  const answer = useLiveQuery(
    () =>
      draft?.questionAttemptId
        ? db.questionAttempts.get(draft.questionAttemptId)
        : undefined,
    [draft?.questionAttemptId],
  );
  const [error, setError] = useState(""),
    [result, setResult] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    beginCard(k.id).catch((e) => setError(friendlyError(e)));
  }, [k.id]);
  const patch = (value: Parameters<typeof patchLearningDraft>[1]) =>
    patchLearningDraft(k.id, value).catch((e) => setError(friendlyError(e)));
  const phase = draft?.phase ?? "read",
    points = recallPoints(k),
    next = content.knowledge[content.knowledge.indexOf(k) + 1];
  const lesson = beginnerLessons.get(k.id);
  function startRecall() {
    setResult("");
    void patch({
      phase: "recall", contentVersion: content.contentVersion, recall: "",
      checks: points.map(() => false), questionId: k.relatedQuestionIds[0],
      questionAttemptId: undefined, selectedOption: undefined,
    });
    window.scrollTo(0, 0);
  }
  async function grade() {
    if (!question || !draft?.selectedOption) return;
    setBusy(true);
    setError("");
    try {
      const a = await submitQuestion(question, draft.selectedOption);
      await patchLearningDraft(k.id, {
        questionId: question.id,
        questionAttemptId: a.id,
      });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function complete() {
    setBusy(true);
    setError("");
    try {
      const r = await validateCard(k.id);
      setResult(
        r.passed
          ? `${r.progress.status === "consolidated" ? "巩固掌握" : "首轮验收通过"}。${k.relatedQuestionIds.length ? "已通过自检与关联选择题。" : "仅自评验证。"}`
          : "本次未通过，已记录学习尝试，请重新复习。",
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/learn">
        ← 知识通关
      </Link>
      <PageTitle
        eyebrow={`${k.id} / ${k.priority} 级 / ${statusLabel(progress, now)}`}
        title={k.title}
        description={k.module}
      />
      <ErrorMessage message={error} />
      {result && (
        <p className="success-message" role="status">
          {result}
        </p>
      )}
      {phase === "read" && lesson && <BeginnerLesson lesson={lesson} card={k} onRecall={startRecall} />}
      {phase === "read" && !lesson && (
        <section className="paper">
          <Badge>考前速记版</Badge>
          <p className="subtle">此知识点暂无完整入门课程，以下为原始速记资料。</p>
          <h2>必会概念</h2>
          <p className="reading">{k.essentials}</p>
          <h2>易错点</h2>
          <p className="reading">{k.pitfalls}</p>
          <Source source={k.sourceRef} />
          <button
            className="primary"
            onClick={startRecall}
          >
            开始闭卷自测 →
          </button>
        </section>
      )}
      {phase !== "read" && (
        <section className="paper">
          <Badge>
            {k.relatedQuestionIds.length ? "自检 + 关联选择题" : "仅自评验证"}
          </Badge>
          <h2>先独立回答</h2>
          <p>不看资料，解释“{k.title}”，写出关键要点和容易混淆的地方。</p>
          {lesson && <ol className="lesson-recall-prompts">{lesson.recallPrompts.map((p) => <li key={p}>{p}</li>)}</ol>}
          <label className="field-label">
            闭卷回答
            <textarea
              aria-label="闭卷回答"
              defaultValue={draft?.recall ?? ""}
              onChange={(e) => void patch({ recall: e.target.value })}
              rows={5}
            />
          </label>
          {phase === "recall" && (
            <button
              className="primary"
              disabled={!draft?.recall.trim()}
              onClick={() => void patch({ phase: "check" })}
            >
              揭示对照要点
            </button>
          )}
          {phase === "check" && (
            <>
              <h2>逐项对照原文</h2>
              <p className="subtle">只有你刚才独立回答中覆盖的要点才勾选。</p>
              {points.map((point, i) => (
                <label key={point} className="check-row">
                  <input
                    type="checkbox"
                    defaultChecked={draft?.checks[i] ?? false}
                    onChange={(e) => {
                      void toggleRecallCheck(k.id, i, e.target.checked).catch(
                        (e) => setError(friendlyError(e)),
                      );
                    }}
                  />
                  <span>{point}</span>
                </label>
              ))}
              <p className="reading">易错：{k.pitfalls}</p>
              {question && (
                <div className="answer">
                  <h2>关联选择题 · {question.id}</h2>
                  <p>{question.stem}</p>
                  {Object.entries(question.options).map(([letter, text]) => (
                    <button
                      key={letter}
                      className={`option-button ${draft?.selectedOption === letter ? "selected" : ""}`}
                      disabled={busy}
                      onClick={() =>
                        void patch({
                          selectedOption: letter,
                          questionAttemptId: undefined,
                        })
                      }
                    >
                      <span>{letter}</span>
                      {text}
                    </button>
                  ))}
                  <button
                    className="primary"
                    disabled={busy || !draft?.selectedOption}
                    onClick={() => void grade()}
                  >
                    提交关联答案
                  </button>
                  {answer && (
                    <div
                      className={
                        answer.correct ? "success-message" : "error-message"
                      }
                    >
                      <strong>
                        {answer.correct ? "回答正确" : "回答错误，已加入错题本"}{" "}
                        · 答案 {question.answer}
                      </strong>
                      <p>{question.explanation}</p>
                    </div>
                  )}
                </div>
              )}
              <button
                className="primary"
                disabled={busy}
                onClick={() => void complete()}
              >
                提交本次自测
              </button>
              <p className="subtle">
                自检全部通过且关联题答对后才算初步掌握。首轮通过至少24小时后，再次闭卷复测成功才算巩固掌握。
              </p>
            </>
          )}
          <button
            onClick={() =>
              void patch({
                phase: "read",
                questionAttemptId: undefined,
                selectedOption: undefined,
                checks: [],
              })
            }
          >
            重新阅读资料
          </button>
        </section>
      )}
      <section>
        <h2>掌握记录</h2>
        {progress?.firstPassAt && (
          <p>
            首次通过：{new Date(progress.firstPassAt).toLocaleString()}
            <br />
            复习提醒：
            {progress.reviewDueAt
              ? new Date(progress.reviewDueAt).toLocaleString()
              : "待安排"}
          </p>
        )}
        <p className="subtle">
          {history?.length ?? 0} 次闭卷尝试。
          {k.relatedQuestionIds.length
            ? "有客观关联题验证"
            : "仅自评验证，不能替代客观考试能力验证"}
          。
        </p>
        {history
          ?.sort((a, b) => a.order - b.order)
          .slice(-5)
          .reverse()
          .map((a) => (
            <p className="history-row" key={a.id}>
              {new Date(a.createdAt).toLocaleString()} ·{" "}
              {a.kind === "review" ? "复测" : "首轮"} ·{" "}
              {a.passed ? "通过" : "未通过"}
            </p>
          ))}
      </section>
      {next && (
        <Link className="primary" to={`/learn/${next.id}`}>
          下一知识：{next.title} →
        </Link>
      )}
    </>
  );
}

export function Practice() {
  const location = useLocation();
  return <PracticeFlow key={location.search} search={location.search} />;
}
function PracticeFlow({ search }: { search: string }) {
  const navigate = useNavigate();
  const params = new URLSearchParams(search),
    mode = params.get("mode") ?? "chapter",
    requested = params.get("question"),
    module = params.get("module") ?? "";
  const day = Math.max(1, Math.min(5, Number(params.get("day")) || 1)),
    dailyIds = new Set(
      content.plan
        .find((d) => d.day === day)!
        .knowledgeIds.flatMap(
          (id) =>
            content.knowledge.find((k) => k.id === id)!.relatedQuestionIds,
        ),
    );
  const data = useStudyData(),
    id =
      mode === "daily"
        ? `practice:daily:${day}:${module}`
        : `practice:${mode}:${module}`,
    session = useLiveQuery(
      async () => (await db.sessions.get(id)) ?? null,
      [id],
    );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const wrong = unresolvedWrong(data?.questionAttempts ?? []),
    favorites = data?.bookmarks.map((b) => b.questionId) ?? [];
  const canReview = (questionId: string) => mockQuestionAccess(data?.sessions ?? [], questionId) === "review";
  const eligible = content.questions.filter(
    (q) =>
      (mode === "wrong"
        ? wrong.includes(q.id)
        : mode === "favorites"
          ? favorites.includes(q.id)
          : mode === "daily"
            ? q.set === "chapter" && dailyIds.has(q.id)
            : q.set === "chapter") &&
      (!module || q.module === module),
  );
  const questions = (session?.questionIds ?? eligible.map((q) => q.id))
    .map((id) => content.questions.find((q) => q.id === id)!)
    .filter((q) => !!q);
  useEffect(() => {
    if (!data || session !== null) return;
    const index = Math.max(
      0,
      eligible.findIndex((q) => q.id === requested),
    );
    void db
      .transaction("rw", db.sessions, async () => {
        if (await db.sessions.get(id)) return;
        await db.sessions.add({
          contentVersion: content.contentVersion,
          id,
          set: "chapter",
          questionIds: eligible.map((q) => q.id),
          answers: {},
          submittedQuestionIds: [],
          index,
          createdAt: new Date().toISOString(),
        });
      })
      .catch((e) => setError(friendlyError(e)));
  }, [data?.settings, session, id, requested]);
  useEffect(() => {
    if (requested && session) {
      const index = session.questionIds.indexOf(requested);
      if (index >= 0 && index !== session.index)
        void db.sessions
          .update(id, { index })
          .catch((e) => setError(friendlyError(e)));
    }
  }, [requested, session?.id]);
  const q = session ? questions[session.index] : undefined,
    currentAttempt = q
      ? data?.questionAttempts
          .filter((a) => a.questionId === q.id)
          .sort((a, b) => a.order - b.order)
          .at(-1)
      : undefined,
    submitted = !!q && !!session?.submittedQuestionIds.includes(q.id),
    context = q?.contextQuestionId
      ? content.questions.find((v) => v.id === q.contextQuestionId)
      : undefined;
  const locked = !!q && q.set === "mock" && !canReview(q.id);
  async function grade() {
    if (!q || !session?.answers[q.id]) return;
    setBusy(true);
    setError("");
    try {
      await db.transaction(
        "rw",
        db.questionAttempts,
        db.cards,
        db.sessions,
        async () => {
          await submitQuestion(q, session.answers[q.id]);
          await db.sessions.update(id, {
            submittedQuestionIds: [
              ...new Set([...session.submittedQuestionIds, q.id]),
            ],
          });
        },
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function update(patch: Partial<PracticeSession>) {
    try {
      await db.sessions.update(id, patch);
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  async function restart() {
    await db.sessions.delete(id);
  }
  async function toggleFavorite() {
    if (!q) return;
    try {
      if (favorites.includes(q.id)) await db.bookmarks.delete(q.id);
      else
        await db.bookmarks.put({
          questionId: q.id,
          createdAt: new Date().toISOString(),
        });
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="PRACTICE / 原创模拟"
        title={
          mode === "wrong"
            ? "错题重练"
            : mode === "favorites"
              ? "收藏练习"
              : mode === "daily"
                ? `D${day}配套章节练习`
                : "章节练习"
        }
        description="答题自动保存，提交后可看解析。错题保留历史，二刷答对后移出待复习列表。"
      />
      <div className="tabs">
        <Link to="/practice">章节75题</Link>
        <Link to="/practice?mode=wrong">错题 {wrong.length}</Link>
      </div>
      <div className="chips">
        <Link to="/practice?mode=favorites">收藏 {favorites.length}</Link>
        <Link to="/mock">独立完整模考75题 →</Link>
      </div>
      <label className="field-label">
        按模块练习
        <select
          value={module}
          onChange={(e) => {
            navigate(
              `/practice?mode=${mode}&day=${day}&module=${encodeURIComponent(e.target.value)}`,
            );
          }}
        >
          <option value="">全部模块</option>
          {[...new Set(content.questions.map((q) => q.module))].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <ErrorMessage message={error} />
      {!session ? (
        <p role="status">正在载入本轮答题记录…</p>
      ) : locked || (!q && mode === "favorites" && favorites.some(
          (id) =>
            content.questions.find((q) => q.id === id)?.set === "mock" &&
            !canReview(id),
        )) ? (
        <section className="paper">
          <p>模考收藏题在整卷交卷后开放单题练习。正在进行的同卷训练必须先交卷；历史成绩、错题和已提交的单题记录不会解锁本场答案。</p>
          <Link className="primary" to="/mock">
            继续完整模考 →
          </Link>
          <button onClick={() => void restart()}>刷新本轮题目</button>
        </section>
      ) : !q ? (
        <section className="paper">
          <h2>{mode === "wrong" ? "没有待复习错题" : "暂无可练习题目"}</h2>
          <button onClick={() => void restart()}>刷新本轮题目</button>
        </section>
      ) : (
        <>
          <div className="question-toolbar">
            <Badge>{q.id}</Badge>
            {q.set === "mock" && <Badge>同卷复练 · 已交卷题目复习</Badge>}
            <span>
              {(session?.index ?? 0) + 1} / {questions.length}
            </span>
            <select
              aria-label="跳至题号"
              value={session?.index ?? 0}
              onChange={(e) => void update({ index: Number(e.target.value) })}
            >
              {questions.map((q, i) => (
                <option key={q.id} value={i}>
                  {q.id}
                  {session?.answers[q.id] ? " · 已选" : ""}
                </option>
              ))}
            </select>
          </div>
          <section className="paper question">
            <p className="subtle">{q.module}</p>
            {context && (
              <aside className="question-context">
                <strong>前置情形（{context.id} 原题干）</strong>
                <p>{context.stem}</p>
              </aside>
            )}
            <h2>{q.stem}</h2>
            {Object.entries(q.options).map(([letter, text]) => (
              <button
                key={letter}
                className={`option-button ${session?.answers[q.id] === letter ? "selected" : ""}`}
                disabled={submitted || busy}
                onClick={() =>
                  void update({
                    answers: { ...session?.answers, [q.id]: letter },
                  })
                }
              >
                <span>{letter}</span>
                {text}
              </button>
            ))}
            <button
              className="primary"
              disabled={!session?.answers[q.id] || submitted || busy}
              onClick={() => void grade()}
            >
              {submitted ? "已提交答案" : "提交答案"}
            </button>
            {submitted && currentAttempt && (
              <div className="answer">
                <Badge>
                  {currentAttempt.correct ? "回答正确" : "已加入错题本"}
                </Badge>
                <strong> 正确答案 {q.answer}</strong>
                <p>{q.explanation}</p>
                {!currentAttempt.correct &&
                  q.relatedKnowledgeIds.length > 0 && (
                    <p>
                      相关知识建议重新复习：
                      {q.relatedKnowledgeIds.map((k) => (
                        <Link key={k} to={`/learn/${k}`}>
                          {k}{" "}
                        </Link>
                      ))}
                    </p>
                  )}
                <Source source={q.answerSourceRef} />
              </div>
            )}
            <button onClick={() => void toggleFavorite()}>
              {favorites.includes(q.id) ? "取消收藏" : "收藏本题"}
            </button>
            <Source source={q.sourceRef} />
          </section>
          <div className="button-row">
            <button
              disabled={(session?.index ?? 0) === 0}
              onClick={() => void update({ index: (session?.index ?? 0) - 1 })}
            >
              上一题
            </button>
            <button
              disabled={(session?.index ?? 0) >= questions.length - 1}
              onClick={() => void update({ index: (session?.index ?? 0) + 1 })}
            >
              下一题 →
            </button>
          </div>
          <p className="subtle">
            本轮已答 {session?.submittedQuestionIds.length ?? 0} /{" "}
            {questions.length}。退出可继续；需要二刷时重开本轮。
          </p>
          <button
            onClick={() =>
              void restart().catch((e) => setError(friendlyError(e)))
            }
          >
            重开本轮练习
          </button>
        </>
      )}
    </>
  );
}
