import { Link } from "react-router-dom";
import type { CaseCoach,EssayCoach } from "../domain/coaching-schema";
import { content } from "../data/content";
function RelatedLessons({ids}:{ids:string[]}){
 return <div className="coach-related"><h3>回到课程补基础</h3>{ids.map(id=><Link className="text-link" key={id} to={`/learn/${id}`}>{id} · {content.knowledge.find(k=>k.id===id)!.title} →</Link>)}</div>;
}
// Read-only teaching. Original draft.revealed is the sole answer-example gate.
export function CaseCoaching({coach,revealed}:{coach:CaseCoach;revealed:boolean}){
 return <details className="paper practical-coach" data-coach-id={coach.caseId}>
  <summary>不会做？先看拆题思路</summary>
  <p className="subtle">先尝试独立作答。看过思路后按辅导练习使用，自评分数仍由原采分标准决定。</p>
  <p className="reading">{coach.primer}</p><h3>解题顺序</h3>
  <ol className="lesson-worked">{coach.solveSteps.map(s=><li key={s}>{s}</li>)}</ol>
  {revealed?<section data-testid="coach-answer-examples"><h3>采分要点示例 · 非新增评分标准</h3><ul>{coach.answerPointExamples.map(s=><li key={s}>{s}</li>)}</ul></section>
   :<p className="subtle">采分要点示例将在完成各问草稿并揭示原参考答案后显示。</p>}
  <h3>容易丢分的地方</h3><p>{coach.commonMistakes}</p>
  <h3>换个场景试一试</h3><p>{coach.transferPractice}</p>
  <h3>自查问题</h3><ul>{coach.selfCheck.map(s=><li key={s}>{s}</li>)}</ul>
  <RelatedLessons ids={coach.relatedCardIds}/><p className="subtle">{coach.note}</p>
 </details>;
}
export function EssayCoaching({coach}:{coach:EssayCoach}){
 return <details className="paper practical-coach" data-coach-id={coach.essayId}>
  <summary>写作教练 · 从真实项目开始</summary>
  <p className="reading">{coach.focus}</p><h3>先准备真实项目证据</h3>
  <ul>{coach.requiredRealProjectEvidence.map(s=><li key={s}>{s}</li>)}</ul>
  <h3>一步步组织论文</h3><ol className="lesson-worked">{coach.sectionOutline.map(s=><li key={s.heading}><strong>{s.heading}</strong><p>{s.prompt}</p></li>)}</ol>
  <h3>避免这样写</h3><p>{coach.avoid}</p>
  <h3>先做一个小练习</h3><p>{coach.starterExercise}</p>
  <p className="subtle">教练只提供提示，请在下方编辑自己的提纲与正文。</p>
  <RelatedLessons ids={coach.relatedCardIds}/><p className="subtle">{coach.note}</p>
 </details>;
}
