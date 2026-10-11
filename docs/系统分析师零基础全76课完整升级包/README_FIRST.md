# 零基础系统分析师完整课程内容包（内容版 V1）

> 此包是面向 Codex 的**实际教学内容**，不是仅有需求描述的开发计划。当前仓库已有 D1 的15课；本包新增剩余D2—D5的61课、122道原创入门理解题、33个概念图示，以及9套案例/10个论文专题的入门辅导。所有新增内容均未直接部署，需 Codex 接入并测试。

## 文件使用方式

- **`day2_day5_beginner_lessons.json`** — Codex 仅把此文件作为新增课程内容导入；ID沿用 K015—K074等原卡ID，共61课。
- **`all_76_lessons_reference.json`** — 76课全量**只读校对文件**，含之前已部署的D1 15课；**不要同时导入它**，否则出现重复课！
- **`day2_beginner_guide.md` — `day5_beginner_guide.md`** — 每组课程的完整可读讲义，包含正确答案用于线下教师核对；**不要将该文件用于未交卷时的答题UI**。
- **`case_paper_beginner_coaching.json`** — 9案例和10论文“解题教学辅导层”，保留原始题干、答案和评分点。
- **`case_paper_beginner_guide.md`** — 辅导讲义，供离线阅读/教师核查。
- **`CODEX_INTEGRATION.md`** — 完整编码与验收指令。
- **`CONTENT_QA_REPORT.md`** — 静态内容检查结果与仍需人工审定的项目。

## 学习教学原则

零基础学一课按：**一句话理解 → 同一业务场景 → 逐步讲解 → 手把手做例 → 两道理解题 → 闭卷复述 → 原卡考前速记**。

**新增152道入门题（含旧D1的30道）不能被当作正式真题。** 它们与原来的150道原创模拟题分池，答对不自动算客观掌握，不偷偷改历史 `CardAttempt`/24小时复习判断。

学生不必每天学习固定小时数。任务以知识点通关为准：每课至少能解释概念、独立做例和闭卷复述；隔天再判断巩固程度。案例及论文练习独立安排，不能只刷选择题。

## 内容范围与示例

四组新增课程：

- D2：K015–K029，软件架构、CI/CD、设计模式（15课）
- D3：K030–K041、K069–K071，数据库/SQL/金融与项目计算（15课）
- D4：K042–K055、K074，测试、AI辅助测试、安全与容灾（15课）
- D5：K056–K068、K072/K073/K076，网络、分布式、云、Agent、工程数学（16课）

关键知识处理细节：K037提供可复制的SQL；K069/070/071/063/072提供逐步代入计算；K036区分SQL标准与实际数据库实现；K065区分readiness与liveness；K060强调网络分区时CAP取舍，而非简单“三选二”。

## 仍需独立实施的工作（不可伪称已完成）

- 本轮课程新增的是 **practice-only 教学练习**，尚不能修复 Codex 原报告所列的20张A级卡“客观验证缺题”；要把题纳入验证池，须另行审核内容、覆盖checkpoint、设置独立未曝光题池。
- 原有150道原创模拟题没有被覆盖或重写；此前报告指出的53题弱干扰项/9题场景迁移不足仍需要单独进行真题级难度升级与审核。
- v2的261项checkpoint提案没有在本包中自动批准，历史学习状态不迁移。
- 案例与论文辅导是新教学解释层，不替代原25分采分标准、也不自动判论文合格。
- 未在真实 iPhone 上完成验收，部署属于 Codex 后续操作。

## 关键可靠知识依据（教师交叉核验）

- PostgreSQL 的Repeatable Read实现差异： https://www.postgresql.org/docs/current/transaction-iso.html
- AWS RPO/RTO 概念： https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_objective_defined_recovery.html
- Kubernetes readiness/liveness 探针： https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/

这些为关键技术定义的参考，不代表题库来自官方真题。
