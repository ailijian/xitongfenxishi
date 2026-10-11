import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../storage/db";
import { content } from "../data/content";
import { startExam, chooseMock, submitMock } from "../storage/training";
import { characterCount } from "../domain/training";
import { mockQuestionAccess, mockKindLabel } from "../domain/mock-access";
import {
  PageTitle,
  Badge,
  Source,
  ErrorMessage,
  friendlyError,
} from "../components/ui";
export function MockPage() {
  const [params, setParams] = useSearchParams(),
    runId = params.get("run");
  const runs = useLiveQuery(
    () => db.exams.orderBy("createdAt").reverse().toArray(),
    [],
  );
  const sessions = useLiveQuery(() => db.sessions.where("set").equals("mock").toArray(), []);
  const priorMockAttempts = useLiveQuery(() => db.questionAttempts.where("set").equals("mock").count(), []);
  const [cases, setCases] = useState(["C01", "C04", "C06"]),
    [essay, setEssay] = useState("E01"),
    [timed, setTimed] = useState(false),
    [error, setError] = useState("");
  async function create() {
    try {
      setError("");
      const id = await startExam(cases, essay, timed);
      setParams({ run: id });
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  if (runId) return <Exam key={runId} id={runId} />;
  return (
    <>
      <PageTitle
        eyebrow="FULL MOCK EXAM"
        title="完整综合模考"
        description="75道单选（独立于章节题池）+ 任选3套案例 + 1篇论文。原创模拟；再次开始同卷记为复练。"
      />
      <ErrorMessage message={error} />
      <section className="paper">
        <h2>创建本场训练</h2>
        <p className="notice">{sessions?.length || priorMockAttempts ? "同卷复练：已接触本题池，新场成绩用于重复训练，不代表新题独立验证。" : "首次独立模考：完成本场后，再做同一题池会标记为同卷复练。"}</p>
        <p>
          选择卷整卷交卷后才显示答案，未答题计0分；离开页面可随时继续。案例与论文由本人对照原文自评。
        </p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={timed}
            onChange={(e) => setTimed(e.target.checked)}
          />
          <span>开启选择卷150分钟参考倒计时（不自动交卷）</span>
        </label>
        <h3>任选三套案例 · 已选 {cases.length}/3</h3>
        {content.cases.map((c) => (
          <label className="check-row" key={c.id}>
            <input
              type="checkbox"
              checked={cases.includes(c.id)}
              onChange={(e) =>
                setCases(
                  e.target.checked
                    ? [...cases, c.id]
                    : cases.filter((id) => id !== c.id),
                )
              }
            />
            <span>
              {c.id} · {c.title}
            </span>
          </label>
        ))}
        <label className="field-label">
          本场论文专题
          <select value={essay} onChange={(e) => setEssay(e.target.value)}>
            {content.essays.map((e) => (
              <option key={e.id} value={e.id}>
                {e.id} · {e.title}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={cases.length !== 3 || sessions === undefined || priorMockAttempts === undefined}
          onClick={() => void create()}
        >
          开始本场完整模考
        </button>
      </section>
      <section className="paper">
        <h2>历史模考 · {runs?.length ?? 0}场</h2>
        {runs?.map((r) => (
          <Link className="list-card" to={`/mock?run=${r.id}`} key={r.id}>
            <h3>{new Date(r.createdAt).toLocaleString("zh-CN")}</h3>
            <p>{mockKindLabel(sessions?.find((s) => s.id === r.sessionId))}</p>
            <p>
              {r.caseIds.join(" / ")} · {r.essayId}
            </p>
            <Badge>{r.essaySubmittedAt ? "三项已完成" : "继续训练"}</Badge>
          </Link>
        ))}
        {!runs?.length && <p>尚未开始模考。</p>}
      </section>
    </>
  );
}
function Exam({ id }: { id: string }) {
  const exam = useLiveQuery(() => db.exams.get(id), [id]),
    session = useLiveQuery(
      () => (exam ? db.sessions.get(exam.sessionId) : undefined),
      [exam?.sessionId],
    ),
    attempts = useLiveQuery(() => db.caseAttempts.toArray(), []),
    bookmarks = useLiveQuery(() => db.bookmarks.toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.where("set").equals("mock").toArray(), []);
  const [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [time, setTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  if (!exam || !session)
    return (
      <>
        <p role="status">正在载入本场模考…</p>
        <Link to="/mock">返回模考目录</Link>
      </>
    );
  const q = content.questions.find(
      (q) => q.id === session.questionIds[session.index],
    )!,
    selected = session.answers[q.id],
    submitted = !!session.submittedAt;
  const showAnswers = submitted && !!sessions && mockQuestionAccess(sessions, q.id) === "review";
  const completedCases = exam.caseIds.filter(
      (id) => exam.caseAttemptIds[id],
    ).length,
    caseTotal = exam.caseIds.reduce(
      (sum, id) =>
        sum +
        (attempts?.find((a) => a.id === exam.caseAttemptIds[id])?.selfScore ??
          0),
      0,
    );
  const seconds = Math.max(
    0,
    9000 - Math.floor((time - new Date(session.startedAt!).getTime()) / 1000),
  );
  async function grade() {
    setBusy(true);
    await run(() => submitMock(session!.id));
    setConfirm(false);
    setBusy(false);
  }
  return (
    <>
      <Link className="back-link" to="/mock">
        ← 所有模考记录
      </Link>
      <PageTitle
        eyebrow="75 MCQ / 3 CASES / 1 ESSAY"
        title="本场综合模考"
        description={
          exam.essaySubmittedAt
            ? "选择、案例与论文已完成，记录全部保留。"
            : "依次完成选择卷、案例自评与完整论文。"
        }
      />
      <ErrorMessage message={error} />
      <p className="notice">{mockKindLabel(session)}{session.mockKind === "same-paper-practice" ? "：沿用已接触过的题池，成绩不代表新题独立验证。" : " · 原创模拟训练"}</p>
      <section className="paper">
        <h2>
          选择卷 ·{" "}
          {submitted
            ? `${session.correctCount} / 75分`
            : `已答 ${Object.keys(session.answers).length} / 75题`}
        </h2>
        {session.timed && !submitted && (
          <p className="timer" role="timer">
            参考剩余 {Math.floor(seconds / 60)}:
            {String(seconds % 60).padStart(2, "0")}
            {seconds === 0 ? " · 已到时，请检查后交卷" : ""}
          </p>
        )}
        {submitted && (
          <p>
            交卷时间：{new Date(session.submittedAt!).toLocaleString("zh-CN")}
            。未答题 {75 - Object.keys(session.answers).length} 道计0分。
          </p>
        )}
        {submitted && session.contentVersion !== content.contentVersion && (
          <p className="notice">
            历史试卷成绩保留原判分，以下展示当前题库参考答案；重新训练可验证当前掌握。
          </p>
        )}
        <details>
          <summary>题号导航 · 点击跳题</summary>
          <div className="question-grid">
            {session.questionIds.map((qid, i) => (
              <button
                key={qid}
                aria-current={i === session.index ? "step" : undefined}
                className={session.answers[qid] ? "answered" : ""}
                onClick={() =>
                  void run(() => db.sessions.update(session.id, { index: i }))
                }
              >
                {i + 1}
                {session.answers[qid] ? " ✓" : ""}
              </button>
            ))}
          </div>
        </details>
        <Badge>
          第 {session.index + 1} / 75 题 · {q.id} · 原创模拟
        </Badge>
        <p className="question-stem">{q.stem}</p>
        {q.contextQuestionId && (
          <p className="question-context">
            前置情形：
            {
              content.questions.find((item) => item.id === q.contextQuestionId)
                ?.stem
            }
          </p>
        )}
        {Object.entries(q.options).map(([letter, text]) => (
          <button
            key={letter}
            disabled={submitted || busy}
            className={`option-button ${selected === letter ? "selected" : ""}`}
            onClick={() => void run(() => chooseMock(session.id, q.id, letter))}
          >
            <span>{letter}</span>
            {text}
          </button>
        ))}
        <Source source={q.sourceRef} />
        <button
          onClick={() =>
            void run(async () => {
              if (bookmarks?.some((b) => b.questionId === q.id))
                await db.bookmarks.delete(q.id);
              else
                await db.bookmarks.put({
                  questionId: q.id,
                  createdAt: new Date().toISOString(),
                });
            })
          }
        >
          {bookmarks?.some((b) => b.questionId === q.id)
            ? "取消收藏"
            : "收藏本题"}
        </button>
        {submitted && !showAnswers && (
          <p className="notice">有尚未交卷的同卷训练，历史试卷解析暂时锁定。完成所有进行中的同卷选择卷后恢复。</p>
        )}
        {showAnswers && (
          <div className="answer">
            <h3>
              {session.contentVersion !== content.contentVersion
                ? `原作答 ${selected ?? "未答"}`
                : selected
                  ? selected === q.answer
                    ? "回答正确"
                    : "回答错误"
                  : "本题未作答"}{" "}
              · 正确答案 {q.answer}
            </h3>
            <p>{q.explanation}</p>
            <Link to={`/practice?mode=wrong&question=${q.id}`}>
              进入错题重练 →
            </Link>
          </div>
        )}
        <div className="button-row">
          <button
            disabled={session.index === 0}
            onClick={() =>
              void run(() =>
                db.sessions.update(session.id, { index: session.index - 1 }),
              )
            }
          >
            上一题
          </button>
          <button
            disabled={session.index === 74}
            onClick={() =>
              void run(() =>
                db.sessions.update(session.id, { index: session.index + 1 }),
              )
            }
          >
            下一题
          </button>
        </div>
        {!submitted &&
          (!confirm ? (
            <button className="primary" onClick={() => setConfirm(true)}>
              交整卷，查看成绩
            </button>
          ) : (
            <div className="confirm-box" role="region" aria-label="确认交卷">
              <p>
                已答 {Object.keys(session.answers).length}
                /75题。未答题计0分，提交后无法改动本场选择答案。
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={() => void grade()}
              >
                确认交卷
              </button>
              <button onClick={() => setConfirm(false)}>返回继续作答</button>
            </div>
          ))}
        <p className="subtle">
          选项显示为已选时已保存到本设备。整卷交卷前不显示解析与成绩。
        </p>
      </section>
      <section className="paper">
        <h2>案例卷 · 已自评 {completedCases}/3 套</h2>
        {completedCases === 3 && (
          <p>自评合计 {caseTotal} / 75 分，来自原文采分组。</p>
        )}
        {exam.caseIds.map((cid) => {
          const c = content.cases.find((c) => c.id === cid)!,
            a = attempts?.find((a) => a.id === exam.caseAttemptIds[cid]);
          return (
            <div className="history-row" key={cid}>
              <h3>
                {c.id} · {c.title}
              </h3>
              <p>{a ? `自评 ${a.selfScore}/25 分` : "尚未提交自评"}</p>
              {submitted ? (
                <Link
                  className="secondary"
                  to={
                    exam.essaySubmittedAt
                      ? `/cases/${cid}`
                      : `/cases/${cid}?exam=${id}`
                  }
                >
                  {a ? "再次训练" : "独立作答与自评"} →
                </Link>
              ) : (
                <p className="subtle">选择卷交卷后开启</p>
              )}
            </div>
          );
        })}
      </section>
      <section className="paper">
        <h2>论文卷 · {exam.essaySubmittedAt ? "已提交" : "尚未完成"}</h2>
        <p>{content.essays.find((e) => e.id === exam.essayId)?.title}</p>
        {exam.essaySnapshot && (
          <>
            <p>
              提交快照：正文 {characterCount(exam.essaySnapshot.body)} 字，
              {new Date(exam.essaySubmittedAt!).toLocaleString("zh-CN")}
            </p>
            <details>
              <summary>查看本场论文快照</summary>
              <p className="reading">{exam.essaySnapshot.outline}</p>
              <p className="reading">{exam.essaySnapshot.body}</p>
            </details>
          </>
        )}
        {submitted && completedCases === 3 ? (
          <Link
            className="primary"
            to={
              exam.essaySubmittedAt
                ? `/essays/${exam.essayId}`
                : `/essays/${exam.essayId}?exam=${id}`
            }
          >
            继续论文写作 →
          </Link>
        ) : (
          <p className="subtle">选择卷及三套案例完成后提交论文。</p>
        )}
        <p className="subtle">
          论文通过本人确认完成与六项自查，不做机器评分。字数要求以当次正式试题为准。
        </p>
      </section>
      <Link className="secondary" to="/progress">
        查看全部学习分析 →
      </Link>
    </>
  );
}
