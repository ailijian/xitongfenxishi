import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageTitle, ErrorMessage, friendlyError } from "../components/ui";
import { content } from "../data/content";
import { db, useStudyData, unresolvedWrong } from "../storage/db";
import { dateOrdinal, statusLabel } from "../domain/study";
import { useLiveQuery } from "dexie-react-hooks";
import { characterCount } from "../domain/training";
import { BackupPanel } from "../components/BackupPanel";

export function ProgressPage() {
  const training = useLiveQuery(
    async () => ({
      cases: await db.caseAttempts.toArray(),
      essays: await db.essayDrafts.toArray(),
      exams: await db.exams.toArray(),
    }),
    [],
  );
  const data = useStudyData(),
    [date, setDate] = useState("2026-10-11"),
    [cardId, setCardId] = useState("K001"),
    [day, setDay] = useState(1),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("");
  useEffect(() => {
    if (data) setDate(data.settings.studyStartDate);
  }, [data?.settings.studyStartDate]);
  if (!data) return <p role="status">正在载入学习统计…</p>;
  const chapter = data.questionAttempts.filter((a) => a.set === "chapter"),
    counts = new Map<string, number>();
  for (const k of content.knowledge) {
    const label = statusLabel(data.cards.find((p) => p.cardId === k.id));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  async function saveDate() {
    try {
      dateOrdinal(date);
      await db.settings.put({ ...data!.settings, studyStartDate: date });
      setSaved("启动日已保存，已有学习记录全部保留。");
      setError("");
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  async function move() {
    try {
      await db.settings.put({
        ...data!.settings,
        dayOverrides: { ...data!.settings.dayOverrides, [cardId]: day },
      });
      setSaved(`${cardId} 已重排至D${day}，掌握记录保留。`);
      setError("");
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="PROGRESS & SETTINGS"
        title="我的学习进度"
        description="以下为真实训练记录与自评指标，不是官方成绩预测。"
      />
      <ErrorMessage message={error} />
      {saved && (
        <p className="success-message" role="status">
          {saved}
        </p>
      )}
      <section className="paper">
        <h2>知识掌握分布</h2>
        {["未开始", "学习中", "初步掌握", "巩固掌握", "需复习"].map((label) => (
          <div className="stat-row" key={label}>
            <span>{label}</span>
            <strong>{counts.get(label) ?? 0} / 76</strong>
            <progress
              max={76}
              value={counts.get(label) ?? 0}
              aria-label={label}
            />
          </div>
        ))}
        <p className="subtle">
          阅读或选择未提交的选项不会增加掌握度。巩固需要首轮通过至少24小时后的成功闭卷复测。
        </p>
      </section>
      <div className="metrics">
        {["A", "B"].map((level) => (
          <div className="metric" key={level}>
            <strong>
              {
                data.cards.filter(
                  (p) =>
                    p.firstPassAt &&
                    content.knowledge.find((k) => k.id === p.cardId)
                      ?.priority === level,
                ).length
              }{" "}
              / {level === "A" ? 57 : 19}
            </strong>
            <span>{level}级首轮通过</span>
          </div>
        ))}
      </div>
      <section className="paper">
        <h2>章节练习</h2>
        <p>
          已提交 {chapter.length} 次 · 正确{" "}
          {chapter.filter((a) => a.correct).length} 次<br />
          正确率{" "}
          {chapter.length
            ? `${Math.round((chapter.filter((a) => a.correct).length / chapter.length) * 100)}%`
            : "尚未作答"}
          <br />
          覆盖 {new Set(chapter.map((a) => a.questionId)).size} / 75 题
        </p>
        <Link className="primary" to="/practice?mode=wrong">
          待复习错题 {unresolvedWrong(data.questionAttempts).length} 道 →
        </Link>
        {[
          ...new Set(
            chapter.map(
              (a) =>
                content.questions.find((q) => q.id === a.questionId)!.module,
            ),
          ),
        ].map((module) => {
          const attempts = chapter.filter(
            (a) =>
              content.questions.find((q) => q.id === a.questionId)?.module ===
              module,
          );
          return (
            <p className="history-row" key={module}>
              {module}：{attempts.filter((a) => a.correct).length} /{" "}
              {attempts.length} 次正确
            </p>
          );
        })}
      </section>
      <section className="paper">
        <h2>模考记录</h2>
        {training?.exams.map((e) => {
          const s = data.sessions.find((s) => s.id === e.sessionId);
          return (
            <Link className="list-card" key={e.id} to={`/mock?run=${e.id}`}>
              <h3>{new Date(e.createdAt).toLocaleDateString("zh-CN")}</h3>
              <p>
                选择卷 {s?.submittedAt ? `${s.correctCount}/75分` : "未交卷"} ·
                案例 {Object.keys(e.caseAttemptIds).length}/3 · 论文{" "}
                {e.essaySubmittedAt ? "已提交" : "未提交"}
              </p>
            </Link>
          );
        })}
        {!training?.exams.length && <Link to="/mock">开始完整模考 →</Link>}
      </section>
      <section className="paper">
        <h2>案例自评与论文进度</h2>
        <p>
          案例训练 {training?.cases.length ?? 0} 次 · 覆盖{" "}
          {new Set(training?.cases.map((c) => c.caseId)).size}/9 套
        </p>
        {content.cases.map((c) => {
          const a = training?.cases
            .filter((a) => a.caseId === c.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          return a ? (
            <p className="history-row" key={c.id}>
              {c.id} 最近自评 {a.selfScore}/25分 ·{" "}
              <Link to={`/cases/${c.id}`}>继续训练</Link>
            </p>
          ) : null;
        })}
        <p>
          提纲 {training?.essays.filter((e) => e.outline.trim()).length ?? 0}/10
          · 正文 {training?.essays.filter((e) => e.body.trim()).length ?? 0}/10
        </p>
        {training?.essays
          .filter((e) => e.outline.trim() || e.body.trim())
          .map((e) => (
            <p className="history-row" key={e.essayId}>
              <Link to={`/essays/${e.essayId}`}>
                {e.essayId} ·{" "}
                {content.essays.find((t) => t.id === e.essayId)?.title}
              </Link>
              <br />
              提纲 {characterCount(e.outline)} 字 · 正文{" "}
              {characterCount(e.body)} 字 · 自查{" "}
              {Object.values(e.checks).filter(Boolean).length}/6
            </p>
          ))}
        <p className="subtle">
          案例为本人自评；论文有正文不等于达到正式考试要求，需逐项检查题干、技术推导和真实证据。
        </p>
      </section>
      <section className="paper">
        <h2>计划启动日</h2>
        <label className="field-label">
          学习启动日期
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <button className="primary" onClick={() => void saveDate()}>
          保存启动日
        </button>
        <p className="subtle">
          修改日期只重新计算Day N，不清空成绩、错题或掌握记录。
        </p>
        <h2>手动重排知识任务</h2>
        <label className="field-label">
          知识点
          <select value={cardId} onChange={(e) => setCardId(e.target.value)}>
            {content.knowledge.map((k) => (
              <option key={k.id} value={k.id}>
                {k.id} · {k.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          安排到
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>
                D{d}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void move()}>重排该知识点</button>
        <button
          className="secondary"
          onClick={() =>
            void db.settings
              .put({ ...data.settings, dayOverrides: {} })
              .then(() => setSaved("已恢复原始任务分配，学习记录保留。"))
              .catch((e) => setError(friendlyError(e)))
          }
        >
          恢复原始任务分配
        </button>
      </section>
      <BackupPanel />
      <section className="paper">
        <h2>本设备数据</h2>
        <p>
          记录保存于IndexedDB。当前浏览器/设备独立保存，没有账号或云同步。换设备需要全量导出/恢复，清理存储可能删除数据。
        </p>
        <Link className="primary" to="/sources">
          资料来源与内容校验 →
        </Link>
        <p className="subtle">请定期备份；本设备数据没有云同步。</p>
      </section>
    </>
  );
}
