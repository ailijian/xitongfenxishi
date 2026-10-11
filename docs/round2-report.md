# 第二轮整改验收：P1 稳定性修复与知识验证方案

日期：2026-10-11，Asia/Shanghai。基线 main：[dd07ec2](https://github.com/ailijian/xitongfenxishi/commit/dd07ec2a4e812e787462115581c477ab896733a1)。P1 代码及数据结构提案：[4ff9a28](https://github.com/ailijian/xitongfenxishi/commit/4ff9a28899ace2a66203a9c9e557a6bedcbc4dfa)。

本轮按用户最后指定的顺序交付：先修复两个 P1，再提交第二阶段结构方案。第二阶段显式 checkpoints、三项掌握指标以及第三/四阶段的运行实现尚未上线；它们的接口、兼容与验收要求已写入[知识验证 v2 方案](knowledge-validation-v2.md)。没有新增题库、改内容 ID、清空用户记录或重写项目。

**正式结论：两个 P1 已修复、推送并部署；最终线上 20/20 PASS，0 FAIL / 0 skipped。真实旧 PWA 升级及旧 JSON 恢复的 12 类记录逐字段一致。第二阶段交付为方案，实体 iPhone 验收仍 NOT TESTED。**

## 1. 第一阶段整改

| 检查 | 状态 | 行为与证据 |
|---|---|---|
| 停留首页跨上海午夜 | PASS | 保留首轮审计原断言，无需刷新从 DAY 1 自动进入 DAY 2，欠账重新排队。 |
| 后台恢复 / focus / pageshow | PASS（事件仿真） | 事件触发即重算真实 Date.now；不等待周期、不写入学习表。visibilitychange 用合成事件验证，未冒称实体 iOS 挂起验收。 |
| 24h 复习到期 | PASS | 前 1ms 不到期，精确到期后待复习从 0 变 1，继续按钮指向 K001；原 cards 全部字段不变，不自动把到期当作巩固。 |
| 收藏 / 错题 / 历史卷答案隔离 | PASS | 任一含该题的未交 mock 存在时锁定；旧已交卷不能放行。已打开收藏解析在另一标签新建同卷后自动隐藏；交完后恢复。 |
| 数据操作层一致校验 | PASS | 单题提交在同一 IndexedDB 事务中检查所有相关 session；调用者伪造 q.set/answer 也按稳定 ID 查权威内容。拒绝时不新增尝试、不改旧成绩。 |
| 多场未交卷与交卷原子性 | PASS | 一场交卷不被另一未交场阻断；私有写入器仅在整卷校验事务中使用。全部活动同卷交完前，单题和历史解析仍锁定；重复交卷不重复写记录。 |
| 首次 / 同卷复练 / 未知历史区分 | PASS | 新 session 保存可选 mockKind；已有相同题池 session 或 mock 作答则为复练。首页、模考、进度区分显示；旧记录不补造类型。更换案例或论文不会将同一选择卷伪装成全新试卷。 |

时钟优先按本地午夜、reviewDueAt、首轮后 24h 的最近边界调度，最长 30 秒重查设备改时；同时监听恢复/聚焦。知识列表、详情、进度统计共用该时钟，避免首页与状态标签不一致。仍沿用设备当地日历，本轮在 Asia/Shanghai 验证，没有修改学习启动日或时间戳。

答案门禁为同一纯函数，UI 读取和事务写入共同使用。练习题号列表保留稳定位置，锁定期间不移除题号或覆盖未交选项；交卷后恢复显示，不再依赖刷新空列表。全部模考仍标记原创模拟；同卷复练是重复训练，不能消除先前已经见题的记忆。

## 2. 实际验证

| 命令 | 结果 | 证据 |
|---|---|---|
| `npm run test` | 56 PASS，7 文件 | [单元日志](round2/local/unit.log)；发布包中再次执行相同 56 项 |
| `npm run build` | PASS，原始数据完整、TS、Vite、SW | [构建](round2/local/build.log) |
| `npm run test:e2e` | 14 PASS | [完整回归](round2/local/e2e.log) |
| `npx playwright test --config playwright.production.config.ts` | 2 PASS | [PWA / 备份](round2/local/pwa.log) |
| `AUDIT_EVIDENCE_DIR=docs/round2/local/full-browser AUDIT_SCREENSHOTS=docs/round2/screenshots npx playwright test --config playwright.audit.config.ts` | 20 PASS，0 skipped | [完整本地审计](round2/local/full-browser.log)、[JSON](round2/local/full-browser/browser-results.json) |
| `python3 scripts/audit-content.py`（本机使用现有 bundled Python） | 2,551 字段 PASS：76 /150 /9 /10 | [独立字段核对](round2/content-fields.log) |
| `bash ops/staging/bundle.sh` | PASS：锁文件安装、56 测试、构建、linux/amd64 镜像 | [发布构建](round2/release-build.log) |
| `STAGING_BASE_URL=http://127.0.0.1:4176 npx playwright test --config playwright.staging.config.ts tests/staging tests/production` | 5 PASS，候选 Docker 镜像 | [镜像检查](round2/container-browser.log) |
| `AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=docs/round2/staging AUDIT_SCREENSHOTS=docs/round2/screenshots npx playwright test --config playwright.audit.config.ts` | 最终 20 PASS，0 skipped | [线上完整日志](round2/staging-browser.log)、[JSON](round2/staging/browser-results.json) |
| `STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts tests/staging` | 3 PASS | [线上托管检查](round2/staging-hosting.log) |
| `npx tsx scripts/audit-round2-upgrade.ts seed` → 发布 → `verify` | 12 类旧数据全量一致、旧备份恢复一致 | [种子](round2/upgrade-seed.log)、[升级日志](round2/staging-upgrade.log)、[JSON](round2/staging-upgrade.json) |

保留上一轮的跨午夜和重复卷失败断言，本轮没有 skip 或把失败改为 expected success。新增 7 项单元回归（3 时钟、3 模考、1 旧备份）和 3 项浏览器场景。原流程测试更新了提示文案，并用交卷后直接恢复题目代替旧手动刷新步骤，仍断言交卷前无提交按钮/答案、交卷后可正确二刷。[旧文案匹配失败日志](round2/local/e2e-pre-update.log)保留，最终完整重跑通过；不将该测试交互差异当作尚存产品缺陷。

首趟线上 19/20：旧测试点击收藏后立即完整导航，没有等待事务完成，目标页显示“收藏0”，不是解析解锁。补充等待“取消收藏”这个已保存反馈后完整重跑 20/20；两处加入该等待，未改答案隔离断言。[首趟日志](round2/staging-first-run.log)、[失败上下文](round2/staging-first-run/artifacts/exam-backup-单选错题全过程，75题计分，案例采分及论文快照，12类JSON清空恢复逐字段一致/error-context.md)保留。另把已解锁模考复习的 320/375/390/430px 几何检查加入跨标签测试，线上通过；布局没有为此改版。

## 3. 旧版数据升级与恢复

数据库 version=2、备份 schemaVersion=2、contentVersion=2026.10.11.1 保持不变。只给新建 mock session 增加可选 mockKind，原始 12 表记录不补写、不重判。新增可选字段的备份只能由本轮或更新应用读取；此前严格 v2 读取器不认识该字段。历史老备份仍可完整恢复。

发布前使用独立自动化 Chromium 持久 profile，在旧线上版本通过正常 UI 创建 12 类非空数据，包含闭卷历史、错题、未交草稿、案例自评、真实输入素材、已提交论文快照、未交模考及已泄漏过答案的收藏练习记录。通过 SW 缓存旧应用后关闭进程。它不是用户日常浏览器。

发布后已验证：点击真正的“更新并重新载入”→导出逐字段相等→正常 UI 二次确认清空该测试 profile→选择旧备份、预览与二次恢复→再次导出完全一致。只对已提交记录检查，不保证写入尚未完成时操作系统强杀的恢复结果。

发布前已复现两项旧缺陷：[升级样本日志](round2/upgrade-seed.log)。发布后全部一致：[升级结果](round2/staging-upgrade.json)。12 表行数依次为 settings1、cards2、cardAttempts1、questionAttempts4、learningDrafts1、sessions4、bookmarks1、caseDrafts3、caseAttempts3、essayDrafts1、projects1、exams2；已提交论文快照原样保留，旧已泄漏收藏答案记录也原样保留，但正常入口现在锁定。

## 4. 手机页面对比

两张 before 来自本轮发布前的真实 staging 旧应用，after 来自同一个旧 profile 更新后的 staging；数据保持相同，日期使用可控上海时钟。起始日已设 10-10，故该对照为 DAY 2→DAY 3，而通用回归为 DAY 1→DAY 2。截图滚动位置以展示缺陷/门禁为准，不用于比较页面风格。

| 场景 | 修改前 | 修改后 |
|---|---|---|
| 午夜已经过去，首页仍停在上一日 | [旧首页](round2/screenshots/before-midnight-390.png) | [新首页 DAY3](round2/screenshots/after-midnight-390.png) |
| 新场未交，收藏显示旧正确答案 | [旧收藏](round2/screenshots/before-repeat-gate-390.png) | [新收藏锁定](round2/screenshots/after-upgrade-repeat-gate-390.png) |

补充截图：[24h 到期优先队列](round2/screenshots/after-review-due-390.png)、[同卷复练标记](round2/screenshots/after-repeat-kind-390.png)。均已由最终线上重跑采集；目录还包含 375px 首页、知识、案例、论文和进度截图。320/375/390/430px 和离线测试仍包含在 20 项专项中。实体 iPhone 安装、软键盘和系统存储回收仍为 NOT TESTED。

## 5. 完整修改文件

实现文件（9）：

- `src/domain/study-clock.ts`：时钟边界计算。
- `src/hooks/useStudyClock.ts`：边界、focus、pageshow、visibilitychange 订阅和清理。
- `src/domain/mock-access.ts`：共享答案门禁及训练类型标签。
- `src/pages/StudyPages.tsx`：日期/队列响应式更新、稳定练习题号、答案锁定及首次/复练统计。
- `src/pages/MockPage.tsx`：当前场/历史场统一锁定、训练类型显示。
- `src/pages/ProgressPage.tsx`：到期统计和训练类型。
- `src/storage/db.ts`：单题权威身份校验、整卷原子判分和私有记录写入。
- `src/storage/training.ts`：新场类型持久化，保留原 submitMock 导出接口。
- `src/storage/backup.ts`：兼容旧记录并支持新可选字段校验。

测试与脚本（8）：`tests/study-clock.test.ts`、`tests/training.test.ts`、`tests/backup.test.ts`、`tests/e2e/training.spec.ts`、`tests/audit/round2.spec.ts`、`tests/audit/exam-backup.spec.ts`、`tests/audit/mobile-offline.spec.ts`、`scripts/audit-round2-upgrade.ts`。审计截图支持指定目录，保留首轮原证据。

文档：`README.md`、`audit-report.md`（保留首轮历史报告并注明新轮次）、`docs/knowledge-validation-v2.md`、本报告及 `docs/staging-deployment.md`。所有新增日志、JSON、截图和完整路径见 [changed-files.txt](round2/changed-files.txt)。原始 materials、src/data、导入器、所有内容 ID 均无修改；原数量仍为 A57/B19、章节75/模考75、案例9/论文10。

## 6. 第二阶段方案交付范围

[完整规范](knowledge-validation-v2.md)定义显式 checkpoint ID/revision/sourceRef、旧布尔数组只读兼容、新旧验证证据、首轮/客观/隔天巩固指标和同题复测标签。第三阶段给出多类型、多题关联、独立题池及经审核 JSON 内容包接口；第四阶段给出一必答四选二、综合+案例连考、自由训练并存及同卷复练规则。

这些是待审阅规范，不是已经实现的内容导入器或新考场模式。审批前没有整理/发布新题库；现有运行版本仍使用原知识卡自检结构和自由选三案例模式。

## 7. 正式发布身份与运行边界

入口：<https://ruankao.staging.haaboo.com/>。

| 项目 | 值 |
|---|---|
| release / current | `staging-20261011T102610Z-ca1338b7ed8b` |
| base Git commit | `4ff9a28899ace2a66203a9c9e557a6bedcbc4dfa` |
| 源码归档 SHA-256 | `ca1338b7ed8bfbdec9cf21927a9f5852e3f360e2fd743e80d333d3a119efd4f8` |
| 镜像 ID | `sha256:3c7e65e597812f36b9a4276e3f7db63fa89924936243634f7fe7424ecd71488f` |
| previous release | `staging-20261011T093420Z-497df7be0303`，继续保留 |

代码先提交再构建，发布脚本仍用显式 allowlist 工作区快照（manifest 的 snapshot 标志），按归档 hash 固定发布物。最终线上 HTML、JS、CSS、SW、manifest、图标共 17 个文件与构建逐字节一致：[资源比对](round2/staging/served-artifacts.json)、[manifest](round2/release-manifest.txt)、[9 项 SHA 校验](round2/release-sha256sums.txt)、[健康激活日志](round2/release-activate.log)。后续补充的是文档/测试/证据，运行应用源码保持本次发布版本。

仅替换本项目 Web，非 root、只读根文件系统、无公网端口映射、128MiB /0.5CPU。共享代理 ID 和 StartedAt 前后一致，主站、Judgment、bootstrap 三个既有入口前后全 200：[服务器之前](round2/server-before.json)、[之后](round2/server-after.json)、[入口之前](round2/existing-routes-before.json)、[之后](round2/existing-routes-after.json)。通过验证后才原子切换 current；没有重启代理、修改共享路由或清理其他项目。

已有 PWA 用户等待更新提示、确认已保存后点击“更新并重新载入”，无需清空数据。实体 iPhone 验证及第二阶段运行改造仍未完成，本轮未将它们表述为通过。所有测试操作只作用于隔离自动化 profile；新字段备份需本轮客户端恢复，不能把旧严格备份读取器当作新格式的回滚读取器。
