# 知识验证 v2 最小版：阶段 A 数据迁移计划

状态：**方案提交，尚未执行迁移或发布**。基线 `fc087c0`（包含 `4ff9a28` 两个 P1 修复），2026-10-11。以第三轮要求为准；本计划收窄并修正第二轮 `knowledge-validation-v2.md` 中的宽范围建议。内容拆分、题目覆盖候选均待人工审核，不能由文件自填 approved 获得发布资格。

## 1. 本次边界及现状

本次交付迁移计划、76 卡缺口报告及审核 JSON。后续阶段 A 只接入显式 checkpoints、证据记录、三指标、兼容读取和可靠备份恢复；不开发内容包安装器、多训练类型判分器或考场状态机。原 K/RK/C/E ID、150 题的题干/答案/来源及所有历史成绩保持。

现状：内容版本 `2026.10.11.1`，IndexedDB `ruankao-system-analyst` 的 version=2，JSON 备份 schemaVersion=2。`recallPoints()` 按分号拆分；`CardAttempt.checks` 没有 checkpoint 身份；`evaluateMastery()` 在全部布尔自检加一道可信章节题正确后通过，不能证明整卡客观覆盖。备份当前严格检查布尔长度及当前关联，接入新检查点时不能原样复用这些旧约束。

版本分别推进：contentFormatVersion=2；原知识/试题来源 contentVersion 保留，新增 `checkpointCatalogVersion` 和 hash；IndexedDB version=3；备份 schemaVersion=3（同时读取 schemaVersion=2）。内容版本更新不能改写用户记录的 contentVersion。

## 2. 最小持久化契约

### 2.1 内容身份和审核

`KnowledgeCardV2 = 原卡 + checkpoints`。checkpoint 为 `{id, revision, text, required, sourceRefs}`，ID 如 `K010.CP04`，revision 正整数，本轮提案全部 required。源引用保留文件、SHA-256、sheet/row/column、原文片段及 UTF-16 `[start,end)` 定位；原 `sourceRef`、`wordSourceRef`、essentials、pitfalls 完整保留。原稿只有“黄金信号”等名称而没有定义时，明确列出讲解补强需求，不能编造原文定义。

逐卡语义拆分输入在 `review/knowledge-checkpoint-proposals.json`；报告 JSON 展开来源。该输入保留显式 CP 编号，之后改文字只递增 revision，不重排编号、不回收旧 ID。审批前不能复制到 `src/data`、`public`、服务工作线程缓存或 staging 构建。

审核通过后仅在构建时发布一个不可变目录：76 卡检查点，以及经复核的 `{questionId, cardId, checkpointIds, rationale, reviewRef}` 关系。本次直接/部分覆盖候选不自动成为关系：partial 不能算 required 覆盖；一道组合选项只包含关键词也不能算所有对应检查点已考核。该目录保留来源 hash 和真实审核记录，构建阻断未知 ID、空 required、失效 revision、缺来源/审核、模考与日常池混用。

### 2.2 旧、新尝试采用判别联合

旧 `CardAttempt` 原字段原样读取，缺 `evidenceVersion` 时只读为 legacy，**不回填**该字段，不根据旧数组长度/次序推导 CP，不把当前关系追溯成过去验证。

新 CardAttempt 保留 id/cardId/recall/passed/createdAt/kind/order/contentVersion，另有：

```ts
type EvidenceV2 = {
  evidenceVersion: 2;
  checkpointCatalogRef: { version: string; sha256: string };
  method: 'self-check-only' | 'question-and-self-check';
  checkpointResults: {
    checkpointId: string;
    checkpointRevision: number;
    checked: boolean;
  }[];
  questionEvidence: {
    questionAttemptId: string;
    questionId: string;
    reviewRef: string;
    coveredCheckpointIds: string[];
    novelty: 'same-item-repeat' | 'history-unknown';
  }[];
};
```

新记录不写表示位置的 `checks`，也不制造旧格式的空布尔数组。校验要求 required 项恰好出现一次，ID/revision 属于该冻结目录，引用题目确为当前卡经审核章节题，选择及正确性来自实际 questionAttempts，提交时间不得晚于知识验证时间。浏览器数据层重复验证 UI 条件，不能信任组件传入的 passed/coverage。历史正确题不能直接伪装成本次闭卷作答。

MVP 不宣称“新题独立验证”：此前没有完整呈现台账，有既往答题为 same-item-repeat，无既往作答为 history-unknown。同题判断只查询本次引用 QA 之前的记录（排除本次 QA），在提交知识证据时冻结；不能因为当前作答刚写入就反向改写本次类型。当前题族/原题 ID 换措辞、重复答对均不产生新题证据。以后接入新内容及呈现台账时另行审核独立性契约。

### 2.3 数据库 v3 只新增两个必要 store

| store | 主键/索引 | 内容及用途 |
|---|---|---|
| checkpointCatalogs | `version`；hash 字段校验 | 不可变、已审核的检查点及关系快照；尝试/草稿按 version+hash 引用，离线恢复不丢来源 |
| validationDrafts | `cardId` | 新闭卷草稿，CP ID/revision 结果、目录引用、问答引用；旧 learningDrafts 不改写 |

原 12 store 的 schema/主键及历史记录不变。新验证尝试追加到原 cardAttempts（新/旧联合），题目尝试继续写 questionAttempts，避免第二套答题台账和重复统计。目录与新草稿随完整备份导出，实际总 store 数为 14；“旧 12 类一致”专指升级前已经存在的记录。

旧 pending 草稿原文、checks、选项、题目引用继续可查看。首次继续学习时可复制 recall 到新 validationDrafts，但所有新 CP checked 初始为 false，提示重新对照；旧 learningDrafts 留作原始快照。正常新作答可更新 cards 的当前状态、追加尝试和删除新草稿，**不是迁移重写旧历史**。旧草稿有对应新稿时以新稿继续，界面不重复展示两个待办。

## 3. 三指标与覆盖判定

| 指标 | 新版判定 | 历史及不足说明 |
|---|---|---|
| 首轮通过 /76 | 闭卷 recall 非空、全部 required 自检通过，有可信章节题的卡完成本次至少一道关联题并答对；无题采用 self-check-only | 原 firstPassAt 保留参与原任务调度，数字注明其中“历史证据未知 N”；不等于全卡客观验证 |
| 客观验证 /76 | 在有效 v2 证据中，全部 required 已自检且每项都有经审核直接覆盖的正确客观作答；未被之后同 CP 失败失效 | 仅自评、partial 关系、模考隔离池、旧布尔证据、撤销关系不计；不足显示“客观覆盖 x/y”，不能把一道题默认扩成整卡 |
| 隔天巩固 /76 | 首轮后绝对时间 ≥86,400,000ms，本次重新闭卷并通过自检/有关联题时的可信练习；失败转待复习，到期不自动升级 | 分列 self-check-only / question-and-self-check、同题复测及历史证据未知；巩固成功也不等于客观全覆盖 |

首轮/巩固按原学习规则延续，客观验证独立收紧。保留旧 status/firstPassAt/consolidatedAt/reviewDueAt/validationMethod，读取层给 legacy 标识；不能为使新指标好看重写状态、删除首次通过或让计划把旧首轮卡重新计成未学。旧 validationMethod 存在也只代表当时记录的方法，不能补造 checkpoint 证据。

覆盖由尝试引用目录计算，不保存可能漂移的全局计数。允许不同实际正确题累计覆盖多个 required，latest failed checkpoint 使其对应当前覆盖失效；之后正确重测可恢复这一项。自评勾选不填 objective。目录 revision 改变后旧记录保留、显示旧版本证据；跨 revision 不能自动视为新要求通过。暂无当前审核题覆盖的 CP 会诚实呈现缺口，不能标成题库缺陷已解决。

复测“失败”的明确来源是本次未通过 required 自检或可信关联题答错；客观覆盖不足属于证据不足而非自动失败。同一道题重做只恢复其审定覆盖范围，仍标同题。继续共用已通过的响应式时钟，24h 使用绝对时间，学习日按亚洲/上海验收边界；修改学习起始日只影响任务分配。

## 4. 自动建立可恢复副本，解决多标签页竞争

恢复副本存放于同源独立 IndexedDB `ruankao-system-analyst-recovery`，不能放在会被清空/恢复的主库内，也不依赖浏览器允许自动下载。至少保留最近一次成功的升级前副本和最近一次恢复前副本，直到下次成功操作；导出按钮允许取出这两个副本。浏览器存储被系统清除仍会同时失去两库，因此用户导出 JSON 仍必要。此库只是本地恢复点，不是账号/云备份。

启动顺序必须改变：bootstrap recovery barrier → main DB v3 → 内容快照就绪 → React/useLiveQuery/写操作开放。禁止模块导入时提前打开 v3 或挂载页面后再补备份。初次安装无旧库时不创建假历史；恢复库失败时展示保留本机数据的错误，禁止尝试清空。

1. 以**不指定 version** 的原生 IDB 只读打开现有库，确认旧库版本/12 store，单个只读事务抓取全部原始记录及主键。不通过会默认补字段/strip 字段的解析器重序列化旧对象。
2. 固定规范化规则：表名及主键排序，对象键排序，数组次序/false/0/空串/原时间戳保持，缺字段与显式字段严格区分。备份由 JSON 可表达的现有记录构成；若存在 undefined 或非 JSON 类型，恢复副本用 structured-clone 存原始行，另阻断无损 JSON 导出，不静默丢字段。
3. 将原始 12 表 snapshot、原 schemaVersion、数据库版本、源文件版本、每表数量/规范值 SHA-256、创建时间和整体 hash 写入恢复库。读回原始行逐字段比对、校验 hash，并运行独立 legacy 读取校验。校验不能按新 CP 数量检查旧 checks，也不能把撤销关系导致的证据降级当成损坏数据。
4. 确认备份持久化后请求主库 v3；浏览器 versionchange 关闭旧连接，blocked 时提示关闭旧标签页，不强制删除库。新版标签页通过 Web Locks（支持时）协调 owner；不支持时仍以 IDB 的独占 versionchange 作为最终屏障，不能把 BroadcastChannel 通知当成旧客户端已停写的保证。
5. **在 v3 versionchange 事务内**只读抓取旧 12 表，与刚读回的恢复副本逐字段比较。此时独占屏障已建立，避免“备份后、升级前另一标签又写入”的漏洞。只在相等时新增两个 store，不 put/update/clear 原 12 表。不在事务里等待网络/其他数据库/异步 Web Crypto；比较使用先前固定的规范值，同库请求由升级事务等待。
6. 有差异则抛错中止 versionchange（仍保留 v2），释放连接，重新抓取并验证恢复副本，再试升级，最多三次。持续竞争则保持旧库/恢复副本并提示稍后重试，不使用落后的副本继续升级。
7. 升级提交后，写操作尚未开放，再次比对旧 12 表；写入已审核目录到新 store，用单独事务校验 hash/reference；完成标记后开放 UI。未完成首次配置的 v3 再启动仅补写新 store，不回放旧历史/不覆盖旧数据。

副本存在但升级未提交属于可重试；备份写入/读回/hash 失败或 quota 不足则主库不升级；升级事务失败由 IDB 回滚，保留已完成副本。v3 后不能重新打开 v2 写库代码来“降级”，修复版本需沿用 v3 读取器；临时回到旧静态版本只能读展示或使用隔离测试 profile，不能静默降级/丢弃新记录。

## 5. v2/v3 JSON 恢复及失败回滚

解析入口依据 schemaVersion 分支。v2 使用冻结旧字段契约：保留 12 表、缺 contentVersion/mockKind、原布尔数组和原成绩，不按现 CP 数量或现关系重判；撤销关系及缺版本只变为读取层 unknown。若保留原长度完整性检查，使用对应 v1 内容版本的冻结计数清单，仅校验旧格式，不运行标点拆分生成新要点，更不将旧数组映射 CP。已知 ID/主键/引用/时间/合法选项/表结构仍检查。未知字段不能 strip：明确拒绝并保留原文件/本机库，或经单独审核的兼容规则完整保留，禁止猜测。

v2→v3 预览器在内存构造容器：data 的原 12 表逐字段相同，两个新表为空，新的已审核内置目录由启动配置加入；旧记录不添加 evidenceVersion/CP 映射。导出 v3 再恢复应逐字段恢复这 12 表和所有新增表。旧严格 v2 客户端不会读取 v3 文件，不提供会丢新证据的默认降级导出。

v3 备份包含全部 14 表、目录 version/hash、导出时间和应用标识。恢复前校验 catalog 及 CP revision、尝试/草稿/QA 引用、记录唯一性、来源/审核快照和文件大小；历史目录不认识时可保留为历史未知展示，不能激活成当前已审核关系。当前目录必须匹配随应用审核发布的可信 hash，备份自写 approved 不能获得教学审核权限。

恢复操作：解析与预览 → 用户确认 → 暂停本客户端写入并协调其他新版连接 → 自动备份**当前** 14 表并读回验证 → 单个 rw 事务 clear+bulkPut **全部 14 表** → 事务内逐字段/引用复核 → commit。注入任意 store bulkPut 或比对失败都 throw，事务整体 rollback；失败后的库等于恢复前库。存储压力造成恢复副本失败时，禁止先清空。恢复前备份及记录 hash 保留，直到恢复完成并可再次导出。

清空仅操作主学习库，不能连同 recovery 库删除；否则恢复点失去意义。用户主动执行“删除恢复副本”要有明确单独动作，MVP 不需要新增这个操作。所有破坏性试验使用隔离 test profile，不对真实用户库进行清空验证。

## 6. 旧 12 类逐字段验收矩阵

下表同时比较迁移前后、v2 导入→v3 导出→恢复、恢复失败前后。排序只用于比较，原字段及数组顺序不改。存在记录和可选字段缺失两种 fixture 都必须测试。

| 表 | 必查字段（全部字段仍需 deepEqual） |
|---|---|
| settings | id、studyStartDate、dayOverrides 的未知顺序/零值 |
| cards | cardId、status、三个时间、validationMethod 缺省、updatedAt |
| cardAttempts | id/cardId、recall、checks 数组、questionAttemptId、passed、createdAt/kind/order/contentVersion |
| questionAttempts | id/questionId/set、selectedOption/correct、submittedAt/order/contentVersion |
| learningDrafts | phase/recall/checks、题号/选项/尝试引用、updatedAt/version；保持 pending |
| sessions | questionIds/answers/submittedQuestionIds/index、createdAt/submittedAt/correctCount、timed/startedAt/mockKind/version |
| bookmarks | questionId、createdAt |
| caseDrafts | id/caseId、answers、checks、revealed、updatedAt |
| caseAttempts | 原回答、采分点勾选、自评分、时间、来源版本；不重判 |
| essayDrafts | essayId/projectId、outline/body/checks/updatedAt，中文换行逐字符 |
| projects | id/name/background/role/decisions/problems/results/reflection/updatedAt |
| exams | sessionId、三个 caseIds/caseAttemptIds、essayId、essaySnapshot、各时间及原版本/计时字段 |

## 7. 安全验收和发布门槛（未来执行，当前 NOT TESTED）

实现后必须在最终状态真实重跑，保留日志而非引用上轮结果充作本轮结果：`npm run data:check`、原始来源 `scripts/audit-content.py`、`npm test`（原 56 项及新增）、`npm run test:e2e`（原 14 项及新增）、`npm run test:pwa`（原 2 项及新增）、`npx playwright test --config playwright.audit.config.ts`（原审计 20 项及新增）。原断言不能为通过升级被削弱。

新增至少覆盖：

- 76 卡来源、CP ID/revision 唯一、所有 required、空/重复/未知 CP；拒绝旧布尔映射；目录 partial 不计完整覆盖。
- 阅读不通过、全自检首轮、客观 1/n 与 n/n、同题重复、撤销旧关系/未知历史、多个题累计及之后答错失效；24h-1ms/24h、失败待复习、起始日保留和动态任务。
- 旧 12 类逐字段/缺字段/原数组/中文长稿一致；v2→v3 容器升级、新旧混合 v3 往返、目录 hash/revision/引用损坏拒绝、每 store 注入失败整体回滚。
- 备份写入失败、quota、回读损坏、中途关闭/重启、两标签升级竞争及“snapshot 后旧标签写入”强制 abort，再启动不重复插入历史。
- 跨亚洲/上海午夜、后台恢复、focus/pageshow、24h 到期保持 P1；重复 mock 未交答案 UI/数据层继续隔离；75 题/评分/错题、9 案例、10 论文保存无回归。
- 320/375/390/430px 截图，首页/知识闭卷/进度三个指标，旧历史未知/覆盖不足标签；真实旧 profile 升级、生产构建 PWA 离线重启与全表导出清空恢复。

**重复模考取消/终止：当前 NOT IMPLEMENTED / 待办。** `PracticeSession` 仅用 submittedAt 区分交卷，页面及数据层没有取消/终止入口（代码检索只发现取消收藏）。退出页面继续保持未交卷锁定，不能把退出当取消，更不能伪造 submittedAt 解锁。未来若实现，需保存未交答案与结束原因、UI/数据层共用终止判定、取消不计成绩/新独立模拟、跨标签和幂等测试；本 MVP 不扩充完整考场状态机，验收明确保留该项 NOT TESTED。

发布门槛：人工内容审核通过 → MVP 实现 → 自动及隔离旧 profile 验收 → 保存前后手机截图/日志/变更清单/commit → 只发布 ruankao 的 staging release → HTTPS/PWA 及线上隔离 profile 复验。不得改其他项目 proxy 配置或清空其他项目数据。此次文档提交不触发部署，不将 review/ 目录引入运行包。

## 8. 建议实施文件及当前交付

未来必改：`src/domain/content-schema.ts`、`src/data/content.ts`/构建导入脚本（审核后的目录接入）、`src/domain/study.ts`（移除标点拆分、证据统计）、`src/storage/db.ts`（v3 barrier/新表/新尝试）、`src/storage/backup.ts`（v2/v3 分支、完整恢复）、启动入口（先 recovery 后渲染）、`src/pages/StudyPages.tsx` 和进度页、相关测试。自动恢复副本模块独立于主库开库，避免 import 环。

当前只提交本计划、`learning-content-gap.md` / `.json`、逐卡检查点/题目审核输入及只读校验生成脚本。`knowledge-v2-implementation-report.md`、迁移实际报告、40 道 draft 题、升级后截图和测试日志在对应阶段完成后交付，当前不冒称已实现。接下来先审核 CP 拆分与覆盖候选，再按阶段 A 最小契约实施；阶段 C 草稿仍须逐题人工审核后才能发布。
