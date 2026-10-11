# 知识验证 v2 数据结构方案（待审阅，尚未接入运行应用）

基线：main 的第二轮 P1 修复。按本轮最后一项执行顺序，先完成 P1，再提交本方案；第二阶段的 checkpoint 与统计改造尚未上线。本文同时定义第三阶段内容包接口和第四阶段考场模式，便于一次审阅其兼容关系。原始 76/150/9/10 内容、ID、来源和历史记录均保持不变，不包含待发布的新题库。

## 1. 版本与稳定身份

分别管理四种版本，不能用一个版本同时表示全部结构：

| 版本 | 用途 | 建议下一版 |
|---|---|---|
| contentFormatVersion | 教学内容 JSON 字段契约 | 2；v1 适配读取 |
| contentVersion / packVersion | 不可变内容发布版本 | 保留原 `2026.10.11.1`；审核后的新增包自有版本 |
| IndexedDB version | 用户表/索引升级 | 接入新训练类型时 v2→v3，增量升级 |
| backup schemaVersion | 完整可恢复 JSON 契约 | v3 接受 v2 导入；保留旧字段 |

K001—K076、RK001—RK150、C01—C09、E01—E10 永久保留。新增记录使用包命名空间，如 `teacher-reviewed-pack:Q001`，不能占用或替换原 ID。相同概念的后续修订保持 ID，以 revision/内容 hash 区分文字版本；换个措辞或升级 revision 不构成新题独立验证。无来源或关联审核时不自动填充“已审定”。

P1 阶段只给新建 mock session 增加可选 `mockKind`，数据库和备份版本仍为 2，旧 12 类记录不改写；旧 session 显示“验证类型未记录”。旧版严格备份读取器不能读取含该新字段的备份，因此恢复新备份需使用本轮或之后的应用。v2 完整结构升级时应正式采用上表的 v3 备份适配器，而非继续无限添加隐式字段。

## 2. 显式 checkpoints

```ts
type Checkpoint = {
  id: string;                 // 例如 K001.CP01，稳定且永不按数组位置生成身份
  revision: number;
  text: string;               // 经审阅的对照要点；原 essentials 保留作讲解
  required: boolean;
  sourceRefs: SourceRef[];    // 文件 hash + 表/行或章/段，至少一项
};
type KnowledgeCardV2 = KnowledgeCardV1 & {
  checkpoints: Checkpoint[];
};
```

仅展示一张原卡的格式示例：以下两个要点逐字复制 K001 原文，未创造题目，未作为新学习资料发布。

```json
{
  "id": "K001",
  "essentials": "功能描述系统做什么；非功能描述性能、安全、可用性等质量约束",
  "checkpoints": [
    {"id": "K001.CP01", "revision": 1, "text": "功能描述系统做什么", "required": true,
     "sourceRefs": [{"file": "2026上海系统分析师_7天冲刺题库与学习打卡.xlsx", "sheet": "必背清单76", "row": 5}]},
    {"id": "K001.CP02", "revision": 1, "text": "非功能描述性能、安全、可用性等质量约束", "required": true,
     "sourceRefs": [{"file": "2026上海系统分析师_7天冲刺题库与学习打卡.xlsx", "sheet": "必背清单76", "row": 5}]}
  ]
}
```

源文件 hash 在包级 source registry 中必填；示例的 sourceRef 解析到该 registry。每卡至少一项 required checkpoint，卡内/全包 ID 唯一，revision 为正整数，非空纯文本；所有 coverage 引用都必须存在。删除要点时标记退役并保留旧 revision，不重新分配 CP ID。运行时和备份校验均使用显式 checkpoint 数组，不再按分号、标点或字数推断要点。

v1 只读兼容适配：将整段 essentials 作为一个 `Kxxx.LEGACY` 对照项，标记 `legacy-unstructured`，不拆分分号。旧 cardAttempts 的 `checks: boolean[]` 保持原样并标记为 legacy 证据；没有经过人工映射时，不把第 N 个旧布尔值强行变成 CPxx 结果。76 卡的结构化要点须逐卡核对来源后提交审核，不能自动拆分后宣称审核完成。

## 3. 验证证据与三项指标

新 CardAttempt 追加以下字段；老字段、时间戳和通过结果保留，历史缺字段不补造：

```ts
type ValidationEvidence = {
  method: 'self-check-only' | 'question-and-self-check';
  checkpointResults: { checkpointId: string; checkpointRevision: number; checked: boolean }[];
  attemptRefs: { table: 'questionAttempts' | 'trainingAttempts'; id: string }[];
  contentRef: { packId: string; packVersion: string; itemRevision: number; sha256: string };
  questionNovelty: 'unseen-item' | 'same-item-repeat' | 'legacy-unknown' | 'no-question';
};
```

不能从当前卡的 validationMethod 反推旧尝试的方法，也不能把“现在有题”视作“以前答过题”。按保存的证据统计：

| 指标 | 条件 | 不得混入 |
|---|---|---|
| 首轮通过 /76 | 保存的 firstPassAt；本次完整自检且有首轮关联题时通过至少一道 | 阅读、未交答案 |
| 客观验证 /76 | 实际正确的、经审定直接关联的客观判分证据，并完成 required 自检；标签说明“至少1道关联题正确” | 仅自评、手工自评分、被撤销的关系、未知旧关联 |
| 隔天巩固 /76 | 首轮后绝对时间 ≥86,400,000ms，再次闭卷自检和该卡复测要求通过，且未失败/逾期 | 跨日但不足24h、自动到期、单纯重复阅读 |

三个指标独立；self-check-only 也可计首轮/巩固，不能计客观验证。首页/进度同时展示各方法的通过与巩固数，如“巩固 12，其中仅自评 4”。在内容不足时允许原规则下的同题复测巩固，但必须显示“同题复测”，不声称“新题独立验证”。新题独立验证为额外证据维度，只有该题 ID/题族从未接触且审核关系可信时成立，不代替三项基础指标。

复测挑题：优先该卡巩固池未接触题 → 已接触题（明确同题）→ 无题仅自评。整包升级或改题文字不会清空 exposure ledger。新场首次作答过的题，后续再做不算 unseen；旧记录没有完整接触信息时采用 legacy-unknown，不推断为全新。组卷时固定本场 novelty，交卷后不能因记录新增把同场类型反向改写。

K014/RK027 等已撤销关联保留原先 firstPassAt、历史原判分与版本，显示“历史关系待重新验证”，不算当前可信客观证据。历史 contentVersion 缺失时不重新判分，也不伪造来源/审核结论。

统计由追加记录推导，避免保存多个可能漂移的累计计数；复测失败清除当前巩固状态，保留历史成功、失败、首次通过时间。日期和到期计算继续共用本轮响应式时钟。

## 4. 多题、多类型和分池接口（设计）

```ts
type TrainingBase = {
  id: string;
  revision: number;
  familyId: string;           // 同题变体属于同一题族，不能靠换 ID 伪造新题
  stem: string;
  origin: 'original-simulation' | 'official-authorized';
  sourceRefs: SourceRef[];
  poolRoles: ('initial-validation' | 'consolidation' | 'mock')[];
};
type TrainingItem = TrainingBase & (
  | { type: 'single-choice'; options: Record<'A'|'B'|'C'|'D', string>; answer: 'A'|'B'|'C'|'D'; explanation: string }
  | { type: 'short-answer'; referenceAnswer: string; rubric: RubricPoint[]; grading: 'self-assessment' }
  | { type: 'diagram-analysis'; assetRefs: string[]; referenceAnswer: string; rubric: RubricPoint[]; grading: 'self-assessment' }
  | { type: 'calculation'; expected: string; unit: string; absoluteTolerance: string; solutionSteps: string[]; grading: 'numeric-rule' }
);
type KnowledgeTrainingLink = {
  cardId: string;
  trainingItemId: string;
  checkpointIds: string[];
  role: 'initial-validation' | 'consolidation' | 'mock';
  rationale: string;
  reviewRef: string;          // 必须指向真实已审定记录，不能仅由模块名生成
};
```

一张卡允许多条经审定关系，同一题允许覆盖多卡但每条均需 checkpoint 覆盖依据。现有 relatedQuestionIds 可作为兼容视图，从已审定首轮单选关系派生；不能作为全部新类型唯一入口。模考题池与首轮/巩固题池隔离；同一 ID/题族禁止同时发布到 mock 与日常验证池，避免提前练到独立模考题。

简答/图表默认本人按采分点评分，只算自评；不会把手动勾选转换成客观成绩。计算题的 expected/tolerance 使用十进制字符串、单位及完整推导，数值容差必须非负，单位不匹配不得通过；需要可复核的数值判分器之后才允许该类型成为客观证据。图表只接受包内 hash 校验的 PNG/WebP 或经过审定的安全 SVG，不执行 HTML/脚本或外链代码。

## 5. 独立版本化 JSON 内容包

```ts
type ContentPack = {
  app: 'ruankao-system-analyst';
  contentFormatVersion: 2;
  packId: string;
  packVersion: string;
  baseContentVersion: string;
  sources: { id: string; title: string; sha256: string; origin: string; authorization: string }[];
  reviewManifest: { id: string; status: 'approved'; reviewer: string; reviewedAt: string; rationale: string }[];
  knowledgeRevisions: KnowledgeCardV2[];
  trainingItems: TrainingItem[];
  knowledgeLinks: KnowledgeTrainingLink[];
  assets: { id: string; mimeType: string; sha256: string; base64: string }[];
};
```

`RubricPoint` 为 `{id,text,points,sourceRefs}`；`SourceRef` 为 source registry 的文件/来源标识加原表行、章节段落或 URL/页码。当前 attachment 的 file/sheet/row 字段仍保留，适配器解析到 source registry，不删历史原始来源。origin=official-authorized 必须同时有确切官方出处与授权状态的审定证据；原始附件永远保持 original-simulation，禁止仅改标签。

建议导入 API：`validateContentPack(input, installedRegistry, approvedManifest) → preview`；`installContentPack(previewToken) → atomic commit`。审核清单属于维护者确认的允许发布清单，匹配整个包 hash；JSON 自填 approved/reviewer 字段不构成审核授权。未获得内容审核的包只能校验预览，不能进入可学习注册表、预缓存或构建发布。

导入前阻断：格式/引用错误、ID 冲突、同一版本 hash 不同、来源缺失、无审核依据、非法池混用、答案或采分标准缺失、unsupported renderer、资源 hash 错误、过大文件。默认限制 JSON 20MB，与现有备份约束一致；上限在评审后固定。新类型渲染/判分器未实现时明确拒绝安装，不能假装已支持。

包安装保留不可变 payload 和 hash；当前 active pointer 可切换。旧版本不能在有历史引用时删除。QuestionAttempt/CardAttempt/CaseAttempt 增加 contentRef，新训练类型另追加 trainingAttempts 表；既有单选 questionAttempts 不迁移或复制，以只读适配器合并分析。attemptRefs 明确表名，避免旧单选和新类型的引用混淆。新增 contentPacks 表保存完整包/版本与激活状态；备份 v3 包含这些表及历史引用的资源，离线恢复无需网络，也不能只恢复 active 包导致历史失联。

trainingAttempts 的最低记录契约：`{id, trainingItemId, familyId, contentRef, role, sessionId?, presentedAt, response?, submittedAt?, grading?}`。response 按 single-choice/text/diagram-text/numeric 判别；grading 保存原判分方式、正确性或自评得分及判分器版本，不由当前题目重算。题目首次显示即记录 presentedAt，未交卷也留下接触证据，只有 submittedAt 存在才计答题/成绩。已有原题的新曝光也可写该表而让已提交单选结果仍写原 questionAttempts；借助 attemptRefs 关联，统计不重复计数。这份接触台账用于判断题族是否 unseen；旧版没有记录的观看行为采用 legacy-unknown，而不是默认未接触。

## 6. 升级及兼容步骤

1. 新应用首先只读验证当前 v2 数据，升级事务仅新增表/索引；旧 12 表每一条记录逐字段保留，不删除/重判/重新编号。
2. 从 v2 恢复时，旧字段原样写入，新增表为空；缺少 contentRef 的尝试读取为 legacy-unknown，保留已有 contentVersion，禁止猜测。当存在旧待交闭卷草稿时，保留 recall、旧 checks 与选项，提示“要点结构已升级，请重新对照确认”，不将旧布尔位置自动视为新 checkpoint 通过。
3. 启用显式要点后，新尝试写 checkpoint ID + revision；旧草稿若仍引用 v1，提交前强制确认新要点，保留旧草稿快照供回看。恢复前预览、二次确认、事务回滚延续当前机制。
4. v3 导出包含原 12 表和新增包/训练表，引用、原判分和素材快照完整；恢复不允许重判历史。新备份由新应用恢复，旧严格 v2 读取器会拒绝 v3，不提供可能丢失新训练/来源的默认降级导出。
5. 内容回滚切换 active pointer，保留已写证据引用的旧 payload；数据库升级后旧应用代码不应直接回滚。发布必须先通过真实旧 profile → 新版本 → 导出 → 清空 → 恢复的全表核对。

## 7. 考场仿真设计（尚未实现）

保留 `mode: daily-training` 的任意三案例、可选参考计时和自由继续。新增 `mode: exam-simulation`，按独立、经审核的 paper manifest 固定题序、题族、内容版本、案例五选结构、规则版本及时间限制。新增模式不复用或改写旧 ExamRun。

| 项目 | 考场模式设计 |
|---|---|
| 案例 | paper 的第 1 题必答；其余第 2—5 题中选 2；不是把全库 C01 永久当作必答。保存全部五题草稿，只计提交选择的三题，未选两题不影响成绩。 |
| 连考 | 总 deadline 从开考绝对时间计算；综合知识交卷后进入案例，剩余总时间沿用；锁定上一科选项。计时不靠累计 interval 次数，刷新/后台停留也消耗时间。 |
| 参考规则 | 2026 年上半年公开高级连考规则：总 240 分钟，综合最短 120/最长 150 分钟，余时用于案例；作为可配置规则草案，不直接宣称适用上海下半年批次。 |
| 提交 | 按冻结规则限制综合最早交卷/最晚转科；到期原子保存当前答案、选择和结束原因。UI 与数据层共用状态机，多标签重复提交幂等。调整设备时钟可检测并提示，但无后端无法提供抗作弊认证。 |
| 论文 | 独立的 120 分钟参考场次，不挤入综合+案例的连考总计时。 |
| 训练标签 | 当前固定 75 题池再做均为同卷复练；即使更换案例/论文也不能变成新的独立综合卷。新模拟需审核后未接触的独立题池；否则标明题目复用比例与复练。 |
| 答案 | 延续本轮统一锁定；先提交一科时不会提前泄漏进行中的同题答案。必要时按 paper 的进行中科目更精细锁定，避免只看任意历史已交状态。 |

连考参考来自[湖南省工信厅 2026 年上半年批次通知](https://gxt.hunan.gov.cn/gxt/rkb/jsjtzgg/202605/t20260515_33978082.html)，核对日期 2026-10-11。该通知依据全国考试批次文件，但不是上海下半年准考证。本轮案例“一必答、四选二”来自用户本轮明确要求；现有案例为原创模拟，不称官方题目。正式启用前再核对上海对应考次规则和批准 paper 内容。

## 8. 第二阶段落地验收（计划，未宣称已测试）

- 数据：76 卡显式 checkpoint 来源审核、ID 唯一；不依赖分号；空数组/未知覆盖关系构建阻断。
- 证据：仅阅读不计首轮；自评与客观各统计；24h前后、同题/新题/未知历史、撤销关系及复测失败均覆盖。
- 包：多题多类型、独立池、冲突、缺来源/审核、未实现 renderer、离线安装和损坏包事务回滚。
- 兼容：旧 12 表逐字段保留，v2/v3 备份往返，旧 pending 草稿不丢文字或错配要点，历史判分/包资源可追溯。
- 考场：必答+四选二，120/150/240 分钟边界、刷新/后台、切科锁定、重复交卷、同卷复练标签；实体 iPhone 另行测试。

待审阅的内容是显式要点整理、可信题卡覆盖及包/paper 的审核依据。本轮未批量生成、导入或发布任何新题，未提前实施以上未审阅的数据契约。
