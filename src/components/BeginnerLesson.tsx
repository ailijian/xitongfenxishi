import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { BeginnerLesson as Lesson, LessonQuestion } from "../domain/lesson-schema";
import type { KnowledgeCard } from "../domain/content-schema";
import { courseCardIds, lessonDiagrams, teachingContentVersion } from "../data/lessons";
import { copyText } from "./download";
import { Badge, Source } from "./ui";

// Deliberately local teaching practice: no storage, RK submission, or mastery API.
function UnderstandingQuestion({ question: q, number }: { question: LessonQuestion; number: number }) {
  const [selected, setSelected] = useState<LessonQuestion["answer"]>();
  const [submitted, setSubmitted] = useState<LessonQuestion["answer"]>();
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => { if (submitted) result.current?.focus(); }, [submitted]);
  return (
    <article className="lesson-question" aria-labelledby={`${q.id}-title`} data-question-id={q.id}>
      <h3 id={`${q.id}-title`}>理解题 {number} · {q.assesses}</h3>
      <p>{q.stem}</p>
      <div aria-label={`理解题 ${number} 选项`}>
        {(Object.keys(q.options) as LessonQuestion["answer"][]).map((letter) => (
          <button key={letter} className={`option-button ${selected === letter ? "selected" : ""}`}
            aria-pressed={selected === letter} disabled={!!submitted}
            onClick={() => setSelected(letter)}>
            <span>{letter}</span>{q.options[letter]}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button className="primary" disabled={!selected} onClick={() => setSubmitted(selected)}>提交理解题 {number}</button>
      ) : (
        <>
          <div ref={result} tabIndex={-1} className="lesson-feedback" role="status">
            <strong>{submitted === q.answer ? "理解题答对了" : "再对照解析想一想"} · 正确答案 {q.answer}</strong>
            <p>本题只帮助理解，不计入首轮通过或客观掌握，也不进入错题本。</p>
          </div>
          <details className="lesson-explanations" open>
            <summary>逐项解析 · 理解题 {number}</summary>
            {Object.entries(q.optionExplanations).map(([letter, explanation]) => (
              <p key={letter}><strong>{letter}{letter === q.answer ? "（正确）" : "（干扰项）"}</strong>：{explanation}</p>
            ))}
          </details>
          <button onClick={() => { setSubmitted(undefined); setSelected(undefined); }}>重做理解题 {number}</button>
        </>
      )}
    </article>
  );
}

export function BeginnerLesson({ lesson, card, onRecall }: {
  lesson: Lesson; card: KnowledgeCard; onRecall: () => void;
}) {
  const [step, setStep] = useState(0), [all, setAll] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) stepHeading.current?.focus();
  }, [step, all]);
  const diagram = lessonDiagrams[card.id as keyof typeof lessonDiagrams];
  const index = courseCardIds.indexOf(card.id);
  const nextId = courseCardIds[index + 1];
  return (
    <div className="beginner-course" data-lesson-id={card.id}>
      <section className="paper lesson-intro">
        <Badge>零基础课程版 · 第 {index + 1} / {courseCardIds.length} 课</Badge>
        <h2>这一课要解决什么</h2>
        <p className="lesson-one-sentence">{lesson.oneSentence}</p>
        <div className="lesson-scenario">
          <h3>业务场景 · {lesson.scenario.name}</h3>
          <p>{lesson.scenario.narrative}</p>
        </div>
        <details><summary>为什么要学这一课</summary><p>{lesson.whyLearn}</p></details>
        <a className="back-link" href="#closed-book">已理解，跳到闭卷自述 ↓</a>
      </section>

      <section className="paper" aria-labelledby="lesson-explanation-title">
        <h2 id="lesson-explanation-title">循序讲解</h2>
        <p className="subtle">{all ? `全部 ${lesson.explanationSteps.length} 步` : `第 ${step + 1} / ${lesson.explanationSteps.length} 步`} · 阅读不会自动计入掌握</p>
        {(all ? lesson.explanationSteps : [lesson.explanationSteps[step]]).map((s, i) => (
          <div className="lesson-step" key={s.heading}>
            <h3 ref={i === 0 ? stepHeading : undefined} tabIndex={-1}>{s.heading}</h3>
            <p className="reading">{s.body}</p>
          </div>
        ))}
        <div className="button-row">
          {!all && step > 0 && <button onClick={() => { moved.current = true; setStep(step - 1); }}>上一步</button>}
          {!all && step < lesson.explanationSteps.length - 1 && (
            <button className="primary" onClick={() => { moved.current = true; setStep(step + 1); }}>懂了，下一步</button>
          )}
          <button onClick={() => { moved.current = true; setAll(!all); }}>{all ? "逐步看" : "看全部"}</button>
        </div>
      </section>

      <section className="paper" aria-labelledby="lesson-worked-title">
        <h2 id="lesson-worked-title">一步步做示例</h2>
        <h3>{lesson.workedExample.prompt}</h3>
        <ol className="lesson-worked">{lesson.workedExample.solutionSteps.map((s) => <li key={s}>{s}</li>)}</ol>
      </section>

      {lesson.supplement && <SqlExample sql={lesson.supplement.copyableSql} />}

      {lesson.conceptVisual && diagram && (
        <section className="paper lesson-visual" aria-labelledby="lesson-visual-title">
          <h2 id="lesson-visual-title">概念图示</h2>
          <figure>
            <figcaption>{lesson.conceptVisual.title}</figcaption>
            <p className="subtle">图示可以左右滑动；也可以展开下方文字版本。</p>
            <div className="lesson-diagram-scroll" tabIndex={0} role="region" aria-label={`${lesson.conceptVisual.title} · 左右滑动`}>
              <img src={`${import.meta.env.BASE_URL}${diagram.src}`} alt={diagram.alt} />
            </div>
            <p className="subtle">{lesson.conceptVisual.note}</p>
            <details><summary>图示的文字版本</summary><p>{diagram.alt}</p></details>
          </figure>
        </section>
      )}

      <section className="paper">
        <h2>容易混淆</h2><p className="reading">{lesson.distinguish}</p>
        <h3>在考试中怎么用</h3><p>{lesson.examTip}</p>
        <h3>记忆线索</h3><p>{lesson.memoryHook}</p>
      </section>
      <section className="paper" aria-labelledby="lesson-practice-title">
        <h2 id="lesson-practice-title">原创课后理解练习</h2>
        <p className="subtle">原创教学题 · 非官方真题 · 不进入原 150 道题库，不计客观掌握。作答只保留在当前页面，重做会收起答案。</p>
        {lesson.practiceQuestions.map((q, i) => <UnderstandingQuestion key={q.id} question={q} number={i + 1} />)}
      </section>
      <section className="paper" id="closed-book">
        <h2>闭卷自述</h2>
        <p>离开讲解，试着用自己的话回答。进入自测后会隐藏课程资料，沿用原知识卡的验收规则。</p>
        <ol>{lesson.recallPrompts.map((p) => <li key={p}>{p}</li>)}</ol>
        <button className="primary" onClick={onRecall}>开始闭卷自测 →</button>
      </section>
      <section className="lesson-connection">
        <p>{lesson.nextConnection}</p>
        {nextId && <Link className="text-link" to={`/learn/${nextId}`}>继续零基础课程 · {nextId} →</Link>}
        <p className="subtle">课程讲解、业务示例与理解题均为原创教学内容。课程版本 {teachingContentVersion}。</p>
      </section>
      <details className="paper lesson-speed" data-testid="exam-speed-notes">
        <summary>考前速记 · 原始必背概念</summary>
        <h2>必会概念</h2><p className="reading">{card.essentials}</p>
        <h2>易错点</h2><p className="reading">{card.pitfalls}</p>
        <Source source={card.sourceRef} />
      </details>
    </div>
  );
}

function SqlExample({ sql }: { sql: string }) {
  const [notice, setNotice] = useState("");
  return <section className="paper lesson-sql" aria-labelledby="sql-example-title">
    <h2 id="sql-example-title">对照 SQL 看查询</h2>
    <p>先按示例理解筛选与分组，再对照完整语句；代码可以左右滑动。</p>
    <pre tabIndex={0} role="region" aria-label="完整 SQL，左右滑动"><code>{sql}</code></pre>
    <button onClick={() => void copyText(sql).then(() => setNotice("SQL 已复制"))
      .catch(() => setNotice("复制未成功，可在代码区域选中文字复制"))}>复制 SQL</button>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
