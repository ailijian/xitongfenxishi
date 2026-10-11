import { useEffect } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { content, manifest } from "./data/content";
import { Badge, PageTitle, Source } from "./components/ui";
import { Today, Learn, LearnDetail, Practice } from "./pages/StudyPages";
import { TrainingList, CasePage, EssayPage } from "./pages/TrainingPages";
import { MockPage } from "./pages/MockPage";
import { PWAStatus } from "./components/PWAStatus";
import { ProgressPage } from "./pages/ProgressPage";

function ContentReport() {
  return (
    <>
      <PageTitle
        eyebrow="CONTENT & SOURCES"
        title="资料校验与来源"
        description="完整保留原始训练内容与来源标签。"
      />
      <section className="paper">
        <Badge>构建前自动校验</Badge>
        <h2>内容验收通过</h2>
        <p>
          76 知识卡（A57 / B19）
          <br />
          150 单选题（章节75 / 模考75）
          <br />9 套案例 · 各25分
          <br />
          10 论文专题 · 11 资料来源
        </p>
        <p>缺失核心字段 0 · 重复 ID 0 · 非法答案 0</p>
        <p className="subtle">
          版本 {manifest.contentVersion}。仅自评验证{" "}
          {manifest.selfCheckOnlyIds.length}{" "}
          张卡；独立模考题不进入日常知识练习。
        </p>
        <details>
          <summary>查看来源问题与处理</summary>
          {manifest.sourceIssues.map((i) => (
            <p key={i.id}>
              {i.id}：{i.description}
            </p>
          ))}
        </details>
      </section>
      <section>
        <h2>案例采分核对</h2>
        <div className="audit-list">
          {content.cases.map((c) => (
            <Link to={`/cases/${c.id}`} key={c.id}>
              <span>{c.id} · 3问</span>
              <strong>
                {c.questions.map((q) => q.points).join(" + ")} = 25
              </strong>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2>原始资料链接</h2>
        <p className="subtle">
          链接与说明来自附件，外部网页可用性及最新考试规则需另行核对。
        </p>
        <div className="sources">
          {content.sources.map((s) => (
            <article className="paper" key={s.id}>
              <Badge>{s.category}</Badge>
              <h3>
                <a href={s.url} target="_blank" rel="noreferrer noopener">
                  {s.title} ↗
                </a>
              </h3>
              <p>{s.notice}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="phase-note">
        全部静态资料与学习记录分开保存，内容升级保留原有进度。
      </p>
    </>
  );
}
function NotFound() {
  return (
    <>
      <PageTitle
        eyebrow="404"
        title="没有找到这份资料"
        description="请从资料目录重新选择。"
      />
      <Link className="primary" to="/">
        返回首页
      </Link>
    </>
  );
}
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>
      <div className="app-shell">
        <header className="brand">
          <Link to="/">
            <span className="brand-mark" aria-hidden="true">
              析
            </span>
            <span>
              软考冲刺<small>系统分析师</small>
            </span>
          </Link>
          <span className="edition">2026 · 原创资料</span>
        </header>
        <main id="main">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:id" element={<LearnDetail />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/cases" element={<TrainingList />} />
            <Route path="/cases/:id" element={<CasePage />} />
            <Route path="/essays" element={<TrainingList essays />} />
            <Route path="/essays/:id" element={<EssayPage />} />
            <Route path="/mock" element={<MockPage />} />
            <Route path="/sources" element={<ContentReport />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <PWAStatus />
        <footer className="site-footer">
          软考冲刺 · 系统分析师
          <br />
          知识点掌握驱动 · 原创模拟训练
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="主导航">
        {[
          ["/", "今日", "⌂"],
          ["/learn", "知识", "▤"],
          ["/practice", "刷题", "✓"],
          ["/cases", "实战", "◇"],
          ["/progress", "我的", "◎"],
        ].map(([to, label, icon]) => (
          <NavLink
            to={to}
            end={to === "/"}
            key={to}
            className={({ isActive }) =>
              isActive ||
              (to === "/cases" && location.pathname.startsWith("/essays"))
                ? "active"
                : ""
            }
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
