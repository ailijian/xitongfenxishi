# 零基础课程升级集成验收报告

基线：`22e3f07aabd9d1aa0cd33831aa3599cbe6d9db97`，main。范围：接入已提供的第1天教学包，不实施 checkpoint v2 迁移、内容包安装器或考场状态机。

验收结论：**PASS**，15课/30理解题/8图已真实集成并发布 [staging](https://ruankao.staging.haaboo.com/learn/K001)。本地63项单元、14项流程、20项审计、2项PWA、25项课程测试全部通过；线上25项课程测试、3项服务测试、资源逐字节校验及旧12类数据升级/恢复全部通过。实体iPhone最终验收由用户执行。

## 已交付的学习页面

K001 默认展示“功能需求管要做什么，非功能需求管做到什么标准”和社区医院预约案例。课程依次呈现循序讲解、带做示例、概念图示（原包提供时）、易混点、原创理解题、闭卷自述。原卡必会概念和易错点完整保留在最后折叠的“考前速记”。首次只显示一个讲解步骤，支持“懂了，下一步”“上一步”“看全部”，切换后焦点落在讲解标题。

课程入口沿用 `/learn/K001` 等已有路由。列表明确区分15张零基础课程版和61张考前速记版，没有补空模板。课程的继续入口按 K001—K014、K075 排列，原知识卡导航和 D1—D5 计划保持原有行为。

理解题使用 `LQ-D1-*` 命名空间和独立组件；答题不调用原题库提交、错题或掌握 API。提交前没有答案或选项解析节点；提交后显示判分和全部 A—D 解析，并锁定选项。重做会清空选择并移除答案。理解练习只保留在当前页面，刷新或离开后重置；此限制在页面明确说明。阅读、带做、理解题均不算首轮通过或客观验证。

进入闭卷自测会隐藏全部课程讲解和理解练习，显示原自测输入区及该课两个自述问题。输入沿用已有 IndexedDB 草稿保存和原验收规则。已有未交自测会继续恢复，不因课程上线强行返回阅读或覆盖回答。

## 内容完整性

完整阅读接入说明、清单、指南及静态QA报告；教学JSON所有字段均经过解析校验，并与指南核对734个教学文本字段。附件原JSON逐字节复制，不改作者提供的命题、答案、解析或审核状态。

来源：`docs/零基础学习包/day1_beginner_lessons.json`。运行时副本：`src/data/lessons/day1_beginner_lessons.json`。SHA-256：`1773cc76a8266b0987caf1b8f4c3f7a46be254c1700ef670d71eafd83854a4ec`。

| 内容 | 数量 | 结果与证据 |
|---|---:|---|
| 真实课程 | 15 | PASS；每课4步讲解、至少4步带做、2题、2自述问题 |
| 讲解步骤 / 带做步骤 | 60 / 65 | PASS；逐课DOM核对原文 |
| 原创理解题 / 选项解析 | 30 / 120 | PASS；逐题正确/错误分支、A—D完整解析及重做门禁 |
| 闭卷自述问题 | 30 | PASS；学习及闭卷页完整呈现 |
| 概念图示 | 8 | PASS；K004—K011，静态SVG、原说明和文字替代 |
| 原始知识卡 | 76，A57/B19 | PASS；原JSON逐字节未改 |
| 原题库 | 150，章节75/独立模考75 | PASS；原JSON、关联和提交门禁未改 |
| 原案例 / 论文专题 | 9 / 10 | PASS；原JSON未改，现有流程回归通过 |

| 知识点 | 级别 | 讲解步骤 | 带做步骤 | 理解题 | 图示 |
|---|---|---:|---:|---:|---|
| K001 需求类型 | A | 4 | 4 | 2 | 原包未提供 |
| K002 好需求6项 | A | 4 | 4 | 2 | 原包未提供 |
| K003 需求获取 | A | 4 | 5 | 2 | 原包未提供 |
| K004 需求基线/变更 | A | 4 | 5 | 2 | 有 |
| K005 需求追踪 | A | 4 | 5 | 2 | 有 |
| K006 用例图 | A | 4 | 4 | 2 | 有 |
| K007 顺序图 | A | 4 | 4 | 2 | 有 |
| K008 活动图 | A | 4 | 4 | 2 | 有 |
| K009 状态图 | A | 4 | 4 | 2 | 有 |
| K010 类图 | A | 4 | 5 | 2 | 有 |
| K011 DFD四元素 | A | 4 | 5 | 2 | 有 |
| K012 业务流程重构 | B | 4 | 4 | 2 | 原包未提供 |
| K013 开发模型 | A | 4 | 4 | 2 | 原包未提供 |
| K014 敏捷/Scrum | A | 4 | 4 | 2 | 原包未提供 |
| K075 BPR/价值链 | B | 4 | 4 | 2 | 原包未提供 |

逐卡字段及题目ID见 [content-integrity.json](beginner-course/content-integrity.json)。K004、K005、K010、K011 原 `self-check-only` 状态未变。该包是原创教学，未标为官方真题、已审定客观题或全新独立模考；原 `reviewStatus` 原样保留，集成验证不替代教学内容的人工审核。

图示直接根据已提供的8个固定关系图明确转录为SVG，不运行 Mermaid，不引入运行时图形库。保留原 Mermaid 源文，记录源文及SVG哈希，检查XML、安全、文字替代和生成文件一致性；已逐图查看渲染截图，修正了K006扩展箭头的可读布局。用例/活动/DFD示意仍展示原包“非正式规范图”的说明；K010图只展示关联和多重性，组合生命周期在原讲解和带做中讲清。图示独立横向滚动，不扩大整页宽度。

## 数据和门禁保护

没有修改 Dexie schema、12个表、备份schemaVersion 2、基础内容版本 `2026.10.11.1`、旧布尔数组或掌握判定。没有自动映射旧 checkpoint 证据，也没有覆盖既有历史。

16个原内容、数据存储、掌握、时钟和原资料文件已与基线逐字节比对，见 [preserved-baseline.json](beginner-course/preserved-baseline.json)。本地测试生成12类全部非空数据，执行课程作答、刷新、旧自测恢复，导出前后 `data` 深比较一致；清空/恢复后逐字段一致，损坏导入无副作用。原备份单元测试继续覆盖写入中途事务回滚。

线上旧版隔离浏览器已在发布前通过正常UI产生并导出12类数据，备份为 [pre-release-backup.json](beginner-course/pre-release-backup.json)，仅含合成验收输入，不是用户真实资料。发布后已经确认Service Worker升级、刷新、旧闭卷草稿恢复后，12类数据逐字段一致；清空/恢复后仍一致，损坏导入不改记录。见 [数据保护报告](beginner-course/data-preservation-report.md) 和 [staging-upgrade.json](beginner-course/staging-upgrade.json)。

## 实际自动化验证

| 实际命令 | 结果 | 日志 |
|---|---|---|
| `npm run lessons:check` | PASS：15/30/8，严格字段和来源、SVG安全与一致性 | [static-check.log](beginner-course/logs/static-check.log) |
| `npx tsx scripts/check-beginner-content.ts --source --write-report` | PASS：原附件字节一致，734字段核对 | [source-check.log](beginner-course/logs/source-check.log) |
| `node scripts/check-beginner-preservation.mjs` | PASS：16原文件字节一致 | [preservation.log](beginner-course/logs/preservation.log) |
| `npm run test` | PASS：原56项+新增7项=63项 | [unit.log](beginner-course/logs/unit.log) |
| `npm run test:e2e -- --workers=1` | PASS：14项；完整75题、案例、论文、首轮/24小时及原答案门禁 | [e2e.log](beginner-course/logs/e2e.log) |
| `npx playwright test --config playwright.production.config.ts` | PASS：2项，实际Service Worker离线及备份 | [pwa.log](beginner-course/logs/pwa.log) |
| `AUDIT_EVIDENCE_DIR=docs/beginner-course/audit-local AUDIT_SCREENSHOTS=docs/beginner-course/screenshots ROUND2_SCREENSHOTS=docs/beginner-course/screenshots npx playwright test --config playwright.audit.config.ts` | PASS：20项，跨日/24h/恢复/同卷隔离、12类备份、全部案例及论文 | [audit.log](beginner-course/logs/audit.log) |
| `npm run test:beginner` | PASS：25项，包括23项Chromium课程测试及2项WebKit手机测试 | [mobile.log](beginner-course/logs/mobile.log)、[结果JSON](beginner-course/local/browser-results.json) |
| `npm run build` | PASS：内容校验、TypeScript、Vite和PWA构建 | [build.log](beginner-course/logs/build.log) |

新增测试覆盖所有15课和30题，不只抽查。重点K001/K006/K010/K011在320/375/390/430px检查长文、局部图示滚动、至少44px按钮区域及底部导航不遮挡页尾。WebKit使用375/390px手机模拟、触摸操作，检验四个重点课程及自测刷新保存。离线关页重开验证全部15课和8张图，并实际提交理解题，确认原作答及掌握表未产生记录。

初次试运行日志保留：Node JSON导入方式与Playwright加载不兼容已改用项目现有的文件读取模式；K011重复解析句导致严格定位歧义已改为逐字母完整比较；并发流程测试3处超时后单线程14项全部通过；全15课放在一个用例内超时，拆成15个逐课用例，断言全部保留；WebKit测试曾与课程测试服务共用端口，顺序运行后全25项通过。见 `beginner-course/logs/mobile-initial.log`、`mobile-second.log`、`mobile-focused.log`、`e2e-initial.log`、`webkit-initial.log` 和 [失败上下文](beginner-course/initial-failure/error-context.md)。没有修改答案、内容或掌握规则来通过测试。

## 手机截图与人工验收

| 知识点 | 旧版staging，390px | 新版本地生产首屏，390px |
|---|---|---|
| K001 | [旧首屏](beginner-course/screenshots/before-staging-K001-390.png) | [通俗解释与医院案例](beginner-course/screenshots/after-initial-K001-390.png) |
| K006 | [旧首屏](beginner-course/screenshots/before-staging-K006-390.png) | [课程入口](beginner-course/screenshots/after-initial-K006-390.png) |
| K010 | [旧首屏](beginner-course/screenshots/before-staging-K010-390.png) | [课程入口](beginner-course/screenshots/after-initial-K010-390.png) |
| K011 | [旧首屏](beginner-course/screenshots/before-staging-K011-390.png) | [课程入口](beginner-course/screenshots/after-initial-K011-390.png) |

375/390px完整课程截图 `screenshots/after-K*-375.png`、`after-K*-390.png`，8张图的完整渲染截图 `screenshots/diagram-K004.png` 至 `diagram-K011.png`。真实设备验收 **NOT TESTED**，依用户安排由用户统一执行；这里的WebKit及视口缩小测试不是实体iPhone、Safari安装或软键盘弹出的实测。

验收路径：联网进入K001，阅读场景、逐步讲解、带做；完成两题后看解析并重做，答案应重新隐藏；进入闭卷、输入自己的解释，刷新后恢复。K006核对 include/extend；K010核对所有权与生命周期而非“属于”；K011核对实体不能直连存储及父子图平衡。联网首次页底提示资料已缓存后，再断网重开课程和图示。

## 发布验收

代码已推送GitHub main：[5612c32](https://github.com/ailijian/xitongfenxishi/commit/5612c321d2cc1de9103be98c062a42fd5e4b7645)。本任务只更新独立 `ruankao-staging` 静态服务，共享代理及另外15个容器的ID和启动时间均与发布前一致；主站、judgment页面及bootstrap接口发布前后均返回200。

- 发布：`staging-20261011T124350Z-4bf2db1dc3be`，staging current已指向该版本。
- 源码归档SHA-256：`4bf2db1dc3be0714a5870b2bfd43df15cc73531c2f0d7c2e10ef5ab68fe2f172`。
- Linux/amd64镜像：`ruankao-web:staging-20261011T124350Z-4bf2db1dc3be`；image ID `sha256:b14fc23b622d04fc5dfde2f601605d4184b2c33582919a12588bb9c245fd2ba4`。
- 容器healthy；10001非root、只读文件系统、0.5 CPU、128MiB，未添加宿主机公开端口。
- 发布包全部27个dist文件与已经测试的本地生产构建逐字节相同；HTTP可访问25个应用资源与本地逐字节相同（另两个为未对外提供的托管配置文件）。

| 发布后实际命令/操作 | 结果与证据 |
|---|---|
| `bash ops/staging/bundle.sh` | PASS；干净源码副本npm ci、63项单元、资料检查、TypeScript、Vite、PWA及linux/amd64构建；[release-build.log](beginner-course/logs/release-build.log) |
| 本地发布镜像 + `STAGING_BASE_URL=http://127.0.0.1:4180 npx playwright test --config playwright.staging.config.ts tests/staging/hosting.spec.ts --reporter=list` | PASS 3项；实际Caddy、8个SVG MIME/缓存、路由、404和手机页面；[image-preflight.log](beginner-course/logs/image-preflight.log) |
| 上传校验、`bash activate-web.sh` | PASS；仅更新本项目web；[activate.log](beginner-course/logs/activate.log) |
| `BEGINNER_BASE_URL=https://ruankao.staging.haaboo.com BEGINNER_EVIDENCE_DIR=docs/beginner-course/staging BEGINNER_SCREENSHOTS=docs/beginner-course/screenshots/staging npm run test:beginner` | PASS 25项，包括全部课程、30理解题、8图、WebKit、离线及完整备份；[staging-mobile.log](beginner-course/logs/staging-mobile.log)、[结果JSON](beginner-course/staging/browser-results.json) |
| `STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts tests/staging/hosting.spec.ts --reporter=list` | PASS 3项；在发布源码副本执行；[staging-hosting.log](beginner-course/logs/staging-hosting.log) |
| `AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=docs/beginner-course/staging-assets npx playwright test --config playwright.audit.config.ts --grep '线上资源版本'` | PASS 1项，25资源逐字节一致；[staging-assets.log](beginner-course/logs/staging-assets.log) |
| `npx tsx scripts/audit-beginner-upgrade.ts seed` / `verify` | PASS；发布前真实旧版备份、发布后更新/恢复/失败无副作用；[staging-upgrade.log](beginner-course/logs/staging-upgrade.log) |

线上新版首屏：[K001](beginner-course/screenshots/staging/initial-K001-390.png)、[K006](beginner-course/screenshots/staging/initial-K006-390.png)、[K010](beginner-course/screenshots/staging/initial-K010-390.png)、[K011](beginner-course/screenshots/staging/initial-K011-390.png)。线上完整375/390px课程截图位于 `beginner-course/screenshots/staging/`。部署记录见 [deployment-result.json](beginner-course/deployment-result.json)、[发布清单](beginner-course/release-manifest.txt)、[文件哈希](beginner-course/release-artifacts.json)。

若已有PWA仍显示旧页面，等待当前输入保存后点击“更新并重新载入”；旧记录升级实测已通过，无需清空浏览器。回滚版本 `staging-20261011T102610Z-ca1338b7ed8b` 保留。按 `ops/staging/README.md`，进入该旧release运行 `activate-web.sh`，通过HTTPS和浏览器检查后再将current指回旧release；仅操作ruankao项目，无数据库迁移需要回退。

## 修改文件

生产：`src/components/BeginnerLesson.tsx`、`src/pages/StudyPages.tsx`、`src/styles.css`、`src/domain/lesson-schema.ts`、`src/data/lessons/{index.ts,day1_beginner_lessons.json,diagrams.json}`、`public/lesson-diagrams/K004.svg`至`K011.svg`。

验证/构建：`scripts/{check-beginner-content.ts,build-lesson-diagrams.mjs,check-beginner-preservation.mjs,audit-beginner-upgrade.ts}`、`tests/beginner-content.test.ts`、`tests/beginner/{course.spec.ts,webkit.spec.ts}`、`tests/audit/mobile-offline.spec.ts`、`tests/staging/hosting.spec.ts`、`playwright.beginner.config.ts`、`package.json`、`tsconfig.json`、`ops/staging/{bundle.sh,Caddyfile.web}`。

文档：`README.md`、`.gitignore`、`docs/staging-deployment.md`、本报告、用户提供的5份原始教学包文件、`docs/beginner-course/`下的内容检查、基线保留证据、合成备份、实际日志、JSON结果与截图。失败trace保留本地且通过`.gitignore`排除，不上传大体积临时录制；失败日志和上下文已交付。

包含所有原始资料副本、日志和截图的逐文件清单：[changed-files.txt](beginner-course/changed-files.txt)。
