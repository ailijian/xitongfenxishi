# 系统分析师 H5 上线功能审计与 P0 整改

这是首轮历史报告。第二轮已针对下面两项 P1 修复，并保留原失败证据；当前代码改动与数据结构提案见 [知识验证 v2 方案](docs/knowledge-validation-v2.md)，最新验收以第二轮发布记录为准。

审计日期：2026-10-11（Asia/Shanghai）。依据：[原始开发要求](README-Codex.md)、三份原始资料、当前代码及实际入口 <https://ruankao.staging.haaboo.com/>。本轮只改题卡关联、内容版本及审计管线；没有改知识、题目、答案、案例采分原文，没有扩展功能或重新设计 UI。

**验收结论：审计及已确认 P0 整改完成并上线；完整产品验收仍有 2 项 P1 FAIL，真机部分 NOT TESTED。** 最终线上专项审计 **17 项：15 PASS / 2 FAIL / 0 skipped**。失败断言保留，命令退出码为 1，不能把这次审计表述为全量通过。

## 1. 发布与证据身份

| 项目 | 审计基线 | P0 整改后 |
|---|---|---|
| 内容版本 | 2026.10.10.1 | 2026.10.11.1 |
| Web release | staging-20261011T041333Z-a7b9ec9f3fb6 | staging-20261011T093420Z-497df7be0303 |
| 代码提交 | [93a6d0f](https://github.com/ailijian/xitongfenxishi/commit/93a6d0f1ac0c4e83a9c7ccf68d30a144bfbf6c23) | [09dc54b](https://github.com/ailijian/xitongfenxishi/commit/09dc54b06bae6fb2c7ce65546c284cb9ab357eac) |
| 镜像 ID | sha256:59f9c85883b60c0781d21176e11fd1a2749b912aa38d305e777437375795265e | sha256:cf78da5d37eb995c56fb4328e639ba94f518c63f3c18ffa973589587b92721e4 |

当前发布源码归档 SHA-256：`497df7be03032b1b9dd79b0dcacca8fdc180ca4486ff089f4365d3d7f13cfd6f`。发布脚本记录的是显式清单工作区快照，包含当时的 README 文档改动；归档、镜像和下面的资源逐字节检查一起确定实际发布物，不能仅用 base Git commit 代替发布源码身份。

线上 HTML、JS、CSS、图标、manifest、SW 和 Workbox 共 **17 个文件**与当前构建逐字节一致：[资源比对](docs/audit/final/staging/served-artifacts.json)。[发布 manifest](docs/audit/final/release-manifest.txt)、[发布校验和](docs/audit/final/release-sha256sums.txt)、[最终服务器状态](docs/audit/final/server-state.json)可核对 release、镜像和 current 链接。

所有作答、清空、恢复和浏览器重启测试使用隔离的自动化浏览器或专用测试 profile；没有操作用户正在使用的浏览器数据库。浏览器测试输入是明确的验收文字，未加入学习题库。

## 2. 数据审计

| 要求 | 状态 | 实际结果与证据 |
|---|---|---|
| 76 知识卡，A57/B19，ID 稳定 | PASS | K001—K076；逐字段核对 Excel A—E 和 Word，旧掌握列不导入。[字段校验](docs/audit/final/content-fields.log) |
| 75 章节题 + 75 独立模考题 | PASS | RK001—RK075 / RK076—RK150；0 重复题干、0 重复 ID、150 道答案和解析完整。构建会阻断缺字段、混卷和非法答案。[构建日志](docs/audit/final/build.log) |
| 9 套完整案例，题干、分问、答案、25 分采分标准 | PASS | C01—C09，27 个分问；9 套原文各 8+9+8=25。独立 Python 逐段核对 Word，包括每组采分文字和分值。[内容报告](content-import-report.md) |
| 10 个论文专题及原始写法 | PASS | E01—E10；每题 3 段 Word 提示与 Excel 主线、情境、准备材料一致；标题前缀以页面标题呈现，30 段实质文字均可正常读取。[论文覆盖测试](tests/audit/training-content.spec.ts) |
| 来源可追溯，不伪称官方真题 | PASS | 所有训练题/案例均为“原创模拟”；每条保留 Excel 表/行或 Word 章节/文本块。[逐条来源与文件指纹](content-import-report.md) |
| 题卡关系必须有可信考查依据 | PASS（基线 FAIL，P0 已修） | 移除 5 组同大主题但不直接验证卡片要点的关系；30 组抽样、29 张不同卡均列出原文、题干、正确选项和依据。见第 6 节及[抽样记录](scripts/audit-link-review.json)。 |
| 缺少可信关联题须完整列出并明确自评 | PASS | 47 卡有可信章节题，29 卡仅自评；其中 20 A / 9 B。两卷均无已确认关联的卡为 K010/K020/K028/K039/K045。[29 卡完整清单](content-import-report.md) |

独立读取工具使用 openpyxl、OOXML 和 pypdf，共 **2,551 项字段核对 PASS**，读取 Excel 9 表、Word 489 段、PDF 16 页/21,273 字符。导入脚本另有完整结构、唯一性、反向关联和原始文件哈希检查。数据文字保真不等同于官方命题审定或实测难度校准。

整改后 150 题中 **104 题有已确认关联（章节 60 / 模考 44），46 题不强行归卡**。模考关联仅用于交卷后分析，不充当知识首轮通关题。29 张仅自评卡的清单在内容报告中同时列出保留的独立模考关联，避免把“有模考题”误当作“有日常客观验证”。

## 3. 学习状态、任务和持久化

统一使用 Playwright 可控时钟及 `timezoneId: Asia/Shanghai`，直接读取**已提交**的 IndexedDB 记录核查结果。主流程固定在 `2026-10-11T02:00:00Z`（上海 10:00），24 小时边界使用绝对时间差，不把次日日历日期误当作满 24 小时。[状态测试](tests/audit/state.spec.ts)、[线上结果](docs/audit/final/staging/browser-results.json)。

| 要求 | 状态 | 实际结果与证据 |
|---|---|---|
| 打开 K001 仅阅读，不计首轮掌握 | PASS | 刷新后 status=learning，firstPassAt 不存在。 |
| 自检全部通过 + 可信关联练习正确才初步掌握 | PASS | K001 使用 RK025；保存 initial、firstPassAt 和有版本的尝试。缺自检或使用无关正确题不能通过，单元测试覆盖。[单元日志](docs/audit/final/unit-tests.log) |
| ≥24h 复测通过才巩固 | PASS | 首轮后 86,399,999ms 仍 initial；86,400,000ms 才 consolidated。 |
| 复测失败进入待复习 | PASS | K001 巩固后答错关联题，status=needs-review，consolidatedAt 清除，首次通过时间和 4 次闭卷记录保留；刷新仍一致。 |
| 前一日未完成自动进入后续任务 | PASS | 次日重新载入后 15 条历史欠账进入队列；第 6 日欠账不会被隐藏，单元测试覆盖全部 76 条欠账情形。 |
| 提前完成减少后续未学任务 | PASS | D1 提前通过 K015 后 D2 剩余 14；上海次日显示历史欠账 15、新增 14。 |
| D1—D5 为 15/15/15/15/16，无重复遗漏 | PASS | 全部 76 ID 唯一，分配与 README 的补充卡位置一致；D6/D7 新增为 0。 |
| 修改起始日不清空学习记录 | PASS | 修改后 cards/cardAttempts 逐字段不变，重新载入后保存的启动日仍存在。 |
| 刷新、关页重开保留未交答案和状态 | PASS | K001、章节选项、模考第 35 题选项、论文和案例均复核。 |
| 实际浏览器进程关闭再启动保留草稿 | PASS | 专用 Chromium 持久 profile 中逐字输入论文 510 字符、案例 240 字符；确认写入后关闭并重新启动，内容逐字一致。 |
| 上海午夜刷新后进入新学习日 | PASS | `15:59:59Z → 16:00:00Z` 对应上海 23:59:59 → 次日 00:00；D1→D2，携带 15 欠账。 |
| 停留首页跨午夜自动更新任务 | FAIL | 日期前进后仍显示 DAY 1，必须刷新/重新进入；P1-01，原始失败保留。 |
| 版本/数据库升级保留旧记录 | PASS | v1→v2 单元测试保留原表；旧版本真实 profile 经 SW 更新后，12 类数据逐字段不变；旧 K014/RK027 历史保留，新自测改用 RK039。[升级实测](docs/audit/final/staging-upgrade.json) |

日期取自设备当地日历；本次明确验证了 Asia/Shanghai，跨月、跨年及非法日期另有单元测试。README 未要求设备在其他时区时强制采用上海日期，本轮未改变此策略。已通过首轮但旧版本关联有问题的 K014 历史按原版本保留，没有伪造新的可信通过记录；使用者应按新关联题重新复测。

## 4. 应试功能

| 要求 | 状态 | 实际结果与证据 |
|---|---|---|
| 单选作答、提交、解析、错题二刷 | PASS | RK001 答错→入错题本→二刷答对→移出待复习；原始 false/true 两次尝试仍保留。原有测试另抽查 10 道章节题。[原有流程结果](docs/audit/final/e2e.log) |
| 首次模考正常 UI 交卷前不泄漏答案 | PASS | 75 题逐题检查未显示解析；收藏入口在整卷提交前锁定；交卷确认阶段仍不显示答案。 |
| 重复模考交卷前，同卷历史/收藏入口也应隔离 | FAIL | 先交过一场，再创建未交新场；收藏 RK076 可单题提交并看到“正确答案 D”。P1-02。 |
| 完整 75 题分数正确、交卷不能改本场答案 | PASS | 全 75 题作答，前 50 正确、后 25 错误，结果 50/75，75 条 mock 尝试；原有整卷全对测试另得 75/75。未答计 0，交卷幂等与拒绝修改有单元测试。 |
| 案例独立作答、逐组自评及历史记录 | PASS | 9 套逐套填写三问、勾选部分组计分、刷新、重新作答勾满得到 25/25；每套两次历史，旧答案/分数未覆盖。[9 套 UI 测试](tests/audit/training-content.spec.ts) |
| 三案例 + 一论文完整模考 | PASS | 本場 C01/C04/C06 保存自评，论文完成 6 项自查后提交；缺前序作答拒绝提交，提交快照与后续草稿修改互不覆盖。 |
| 10 个论文草稿持续保存且互不串题 | PASS | E01—E10 分别填写独立提纲/正文，刷新、关页重开逐项恢复；另覆盖 Unicode 字数、项目素材、TXT 导出。 |
| 进度统计依据实际记录 | PASS | 章节正确/错误历史、知识状态、模考 50/75、案例自评分、论文进度及完整模考快照均由保存数据产生；UI 明示自评和训练指标，不称官方预测成绩。 |

本次验证规则及持久化行为，没有用自动化输入的“自检通过”证明用户实际掌握知识，也没有进行真实考生的教学效度/试题难度实验。

## 5. 移动端、离线与备份

| 要求 | 状态 | 实际结果与证据 |
|---|---|---|
| 320/375/390/430px 无整页横向滚动 | PASS | 原有 8 条路由及专项 7 条路由检查；长题干/长选项 Range 边界无溢出。 |
| 固定底部导航允许内容滚动露出 | PASS（仿真） | 各宽度最大滚动处 footer 位于导航上方；按钮、导航与采分点标签热区 ≥44px。此结果不覆盖真实 iOS safe-area 值。 |
| 缩小视口后输入与滚动保存 | PASS（仿真） | 高度缩小至 500px，聚焦、滚动论文框后可输入并保存。 |
| 实体 iPhone 软键盘、刘海/底部安全区 | NOT TESTED | 本机没有连接实体 iPhone。源码包含底部 `env(safe-area-inset-bottom)` 和滚动预留；仿真不能证明 Safari 软键盘、横竖屏及主屏幕模式行为。 |
| 首次联网后的 PWA 离线使用 | PASS（Chromium） | 15 个唯一预缓存 URL 包含整包学习内容；构建日志的 21 entries 含重复条目。断网关页重开可读知识、RK057 前置题干、案例参考答案、保存论文、创建/继续 75 题模考。 |
| 实体 iPhone 主屏幕安装及系统存储回收 | NOT TESTED | 真实 iOS PWA 进程重启、系统清理/存储压力未验证；不将 Chromium 关页或持久 profile 重启等同于 iOS 验收。 |
| 完整 JSON 导出、清空、恢复一致 | PASS | 12 个表均非空；正常 UI 导出→第一次清空提示不删除→二次确认全部为空→恢复预览不写入→二次恢复→再次导出，整个 data 逐字段一致，包含模考论文快照。 |
| 损坏备份不破坏原数据 | PASS | 浏览器损坏 JSON 保持全部 12 表不变；单元测试验证 schemaVersion 99、重复 ID、错误引用、当前版本篡改分数均拒绝，并注入写入故障验证事务整体回滚。 |

12 类数据：settings、cards、cardAttempts、questionAttempts、learningDrafts、sessions、bookmarks、caseDrafts、caseAttempts、essayDrafts、projects、exams。错题从完整作答历史推导，恢复原始记录后结果一致。草稿重启测试在提交成功/已保存后关闭；未验证系统在写入未提交瞬间强制终止的行为。

## 6. P0/P1/P2 问题及处理建议

### P0-01：偏宽关联污染客观验证和需复习判定——已修复并上线

复现：K014 的关键要点为 PO/Scrum Master/团队职责，旧版首个通关题 RK027 仅考敏捷宣言。另有模考题的宽泛授权/缓存等主题使无关卡片可能被误标需复习。单元及线上关联断言在旧版失败，在新版通过。

移除：RK027→K014、RK092→K039、RK103→K020、RK119→K052、RK141→K040。RK103→K029 保留；K014 仍有直接章节题 RK039。没有增删题目或改写原文。内容版本升级为 2026.10.11.1，旧版尝试、时间戳、成绩与备份兼容。另以 OAuth 错题不误改 RBAC/ABAC、真正 RBAC 错题仍提醒复习验证邻近路径。

证据：[旧版失败日志](docs/audit/baseline/link-regression.log)、[旧版线上 K014 失败](docs/audit/baseline/complete-browser.log)、[最终 49 项单元测试](docs/audit/final/unit-tests.log)、[最终线上 K014 PASS](docs/audit/final/staging-browser.log)、[旧版浏览器升级保留记录](docs/audit/final/staging-upgrade.json)。

### P1-01：停留首页跨午夜仍显示上一日任务——未修，本轮按范围保留

根因：Today 在渲染时读取 `Date.now()/localDate()`，没有日期/到期时钟订阅；数据库无变更时不会重新渲染。23:59:59→00:00:01 后仍 DAY 1，刷新后正确 DAY 2。无记录丢失，但会延迟显示新日欠账/复习。建议统一订阅当前日期与复习到期时刻，并在 visibilitychange/focus 后重算；保留计划和历史表。

证据：[最终失败日志](docs/audit/final/staging-browser.log)、[失败截图](docs/audit/final/staging/artifacts/state-亚洲上海午夜：停留首页时任务自动更新/test-failed-1.png)、[trace](docs/audit/final/staging/artifacts/state-亚洲上海午夜：停留首页时任务自动更新/trace.zip)。

### P1-02：重复模考的历史交卷状态解锁本场同卷答案——未修，本轮按范围保留

根因：Practice 和 submitQuestion 使用“任意已交 mock session 包含此题”作为权限门槛，没有排除当前未交的新场。仅在已有相同 75 题卷交卷历史后可复现；首次模考门禁、本场提交前记录、不可改答案和计分规则正常，因此定为 P1。建议按进行中的模考锁定对应题号的单题判分/解析入口，明确历史复习与当前考试的切换规则，同时保留历史成绩。

证据：[最终失败日志](docs/audit/final/staging-browser.log)、[收藏入口显示答案截图](docs/audit/final/staging/artifacts/exam-backup-重复模考时，正常收藏入口不能在本场交卷前打开同卷答案/test-failed-1.png)、[trace](docs/audit/final/staging/artifacts/exam-backup-重复模考时，正常收藏入口不能在本场交卷前打开同卷答案/trace.zip)。

### P2：教学内容优化需求——未自行生成或扩充

| 优先处理内容 | 已观察到的限制 | 后续建议 |
|---|---|---|
| 29 张仅自评卡，优先其中 20 张 A 级 | 没有日常客观验证；K010/K020/K028/K039/K045 两卷均无已确认对应题 | 由学科人员补充直接覆盖要点的章节练习及解析，另保留独立模考题池；逐题复核关联和出处。 |
| 知识讲解深度 | 当前“必会概念”为原始速记，字符数最少 10、中位 23、最多 63 | 为薄弱概念补充定义边界、反例、计算步骤、具体工程场景；保留原始要点与补充内容的区别。 |
| 模拟题难度 | 题干字符数中位 19、最长 46；多数为概念识别。没有真实作答难度/区分度校准证据 | 增加经审核的多约束情境、图表/SQL/计算和易混选项；通过真实作答数据校准。不可凭当前界面分数声称接近官方考试水平。 |
| 案例评分粒度 | 原文部分采分组一次占 8 或 9 分，当前按整组勾选 | 在有明确来源/学科审核后再提供更细的答题反馈，不擅自发明分值或宣称官方阅卷。 |
| 论文教学反馈 | 10 专题、素材、提纲、正文和原文自查完整；评分依赖本人 | 增加经过授权审核的不同质量样例和人工评阅建议；不编造项目经历，不冒称自动官方评分。 |

新增教学内容应明确标为原创补充；本次附件题目继续标记原创模拟。本轮没有生成所谓“官方真题”。

## 7. 实际执行命令、结果与原始日志

| 实际命令 | 观察到的结果 | 日志 |
|---|---|---|
| `npm run data:import` | PASS：76/150/9/10，29 张仅自评 | [导入](docs/audit/final/data-import.log) |
| `npm run build` | PASS：导入一致性、TypeScript、Vite、SW 构建 | [构建](docs/audit/final/build.log) |
| `npm run test` | PASS：6 文件，49 测试 | [单元](docs/audit/final/unit-tests.log) |
| `npm run test:e2e` | PASS：14 测试 | [流程](docs/audit/final/e2e.log) |
| `npx playwright test --config playwright.production.config.ts` | PASS：2 测试 | [PWA](docs/audit/final/pwa.log) |
| `AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=docs/audit/baseline/complete npx playwright test --config playwright.audit.config.ts`（整改前） | 13 测试：11 PASS / 2 FAIL；另专项复现重复卷 P1 | [原版基线](docs/audit/baseline/complete-browser.log)、[重复卷](docs/audit/baseline/repeat-confirmed.log) |
| `AUDIT_EVIDENCE_DIR=docs/audit/final/local npx playwright test --config playwright.audit.config.ts` | 当时 14 测试：12 PASS / 2 FAIL；K014 已 PASS | [本地专项](docs/audit/final/local-browser.log) |
| `STAGING_BASE_URL=http://127.0.0.1:4176 npx playwright test --config playwright.staging.config.ts tests/staging tests/production` | 候选 Docker 镜像：5 PASS | [镜像实测](docs/audit/final/container-browser.log) |
| `AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=docs/audit/final/staging npx playwright test --config playwright.audit.config.ts` | 最终 17 测试：15 PASS / 2 FAIL，无跳过 | [完整日志](docs/audit/final/staging-browser.log)、[JSON](docs/audit/final/staging/browser-results.json) |
| `STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts tests/staging` | PASS：健康/路由/MIME/缓存/手机加载，3 测试 | [托管检查](docs/audit/final/staging-hosting.log) |
| `npx tsx scripts/audit-upgrade.ts seed`（发布前）→`verify`（发布后） | PASS：真实旧 profile 更新后 12 类 data 完全相同，新 K014 使用 RK039 | [种子](docs/audit/baseline/upgrade-seed.log)、[升级](docs/audit/final/staging-upgrade.log) |
| `bash ops/staging/bundle.sh` →上传发布包→服务器 `bash activate-web.sh` | PASS：linux/amd64、49 测试、生产构建、9 项 SHA 校验、healthy | [本机发布构建](docs/audit/final/release-build.log)、[激活](docs/audit/final/release-activate.log) |

独立内容核对的实际 Python 命令：

```sh
/Users/lijian/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/read-materials.py
/Users/lijian/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/audit-content.py
```

结果见[全文提取摘要](docs/audit/baseline/source-extraction.log)和[最终字段核对](docs/audit/final/content-fields.log)。其他电脑可安装 openpyxl/pypdf 后使用 `python3`；这是可选的独立核对工具，运行 H5 不需要 Python。

专项审计保留上述两项 P1 的真实失败，不使用 skip、软化断言或把已知失败改为 expected success。探索阶段发现的测试等待、缓存唯一数量及 Word 标题前缀匹配问题已核对来源并纠正；正式结果以表内完整重跑日志为准，不将测试脚本错误计为产品缺陷。

## 8. 手机截图与发布保留行为

截图来自最终真实 staging 版本的隔离 Chromium 手机视口，没有修图。页面可以继续滚动露出底部内容；截图不是实体 iPhone 验收。

| 页面 | 视口 | 截图 |
|---|---|---|
| 今日任务 | 375×844 | [首页](docs/audit/screenshots/today-375.png) |
| 知识卡 | 390×844 | [知识](docs/audit/screenshots/knowledge-390.png) |
| 模考成绩 | 390×844 | [模考](docs/audit/screenshots/mock-390.png) |
| 案例采分与漏分项 | 390×844 | [案例](docs/audit/screenshots/case-390.png) |
| 持续保存的论文草稿 | 390×844 | [论文](docs/audit/screenshots/essay-390.png) |
| 备份恢复 | 390×844 | [备份](docs/audit/screenshots/progress-390.png) |

此次更新仅替换 `ruankao-staging` Web；共享代理容器 ID 与 StartedAt 前后一致，没有重启。主站、Judgment 和 bootstrap API 前后均 200：[之前](docs/audit/baseline/existing-routes.json)、[之后](docs/audit/final/existing-routes.json)。新容器 healthy、非 root、只读、无公网端口映射、128MiB/0.5CPU；旧 release 保留，当前链接已指向验证后的新 release。

已有 PWA 用户联网等待更新提示，确认草稿已保存后点击“更新并重新载入”。真实旧 profile 已验证数据不变；无需清空 IndexedDB。旧 K014 历史保留原版本，下一次复测应使用 RK039。

回滚只更新本项目 Web：进入 `/opt/azao-staging/projects/ruankao/releases/staging-20261011T041333Z-a7b9ec9f3fb6` 执行 `bash activate-web.sh`，验证健康和旧资源，再恢复本项目 current 链接；无需改共享代理。此次没有执行回滚，因为新增代码/数据验证没有出现阻断回归。

## 9. 正式验收摘要

- 审计交付与 P0 关联整改：**完成**，代码已提交推送，修复已部署，原始资料数量/文字保持一致，升级及备份的 12 类记录一致性已实测。
- 全量产品验收：**尚未全部通过**。P1-01 跨午夜停留刷新、P1-02 重复卷答案隔离仍 FAIL；实体 iPhone 安装、软键盘与系统存储回收 NOT TESTED。
- 教学内容效度：已列出原始速记和题库的优化需求；未擅自新增训练题、经历、评分点或官方真题标签。
- 后续工作：按两项 P1 建议整改并用保留的失败测试回归，再进行实体 iPhone 验收；教学内容扩充另行审核。

本报告和补充测试/证据的最终提交可在[仓库提交记录](https://github.com/ailijian/xitongfenxishi/commits/main)查看。本地运行、手机同局域网预览和静态部署方法仍见 [README](README.md)。
