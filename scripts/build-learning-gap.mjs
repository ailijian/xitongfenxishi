/** Review reports only. This script never writes src/data, public, or user databases. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, p))).digest('hex');
const cards = read('src/data/knowledge.json');
const questions = read('src/data/questions.json');
const proposals = read('docs/review/knowledge-checkpoint-proposals.json');
const coverage = read('docs/review/question-coverage-proposals.json');
const quality = read('docs/review/question-quality-findings.json');
const prior = read('scripts/audit-link-review.json');
const manifest = read('src/data/manifest.json');
const qById = new Map(questions.map(q => [q.id, q]));
const inputById = new Map(proposals.cards.map(k => [k.id, k]));
for (const input of [proposals, coverage]) {
  assert.equal(input.status, 'pending-human-review');
  assert.equal(input.publicationAllowed, false);
}
assert.equal(quality.status, 'pending-human-review');
assert.equal(inputById.size, 76);
assert.equal(proposals.cards.length, 76);
assert.equal(cards.length, 76);
assert(cards.every(k => !('checkpoints' in k)), 'This planning baseline has not installed runtime checkpoints; update the phase/report contract before regenerating after implementation.');
assert.equal(cards.filter(k => k.priority === 'A').length, 57);
assert.equal(cards.filter(k => k.priority === 'B').length, 19);
assert.equal(questions.length, 150);
assert.equal(questions.filter(q => q.set === 'chapter').length, 75);
assert.equal(questions.filter(q => q.set === 'mock').length, 75);

// Card-specific authoring requirements, not generated questions or approved coverage.
const requests = {
  K004: [['CP01'], '受监管需求变更后，核验请求、影响分析、审批、基线/测试和通知的完整顺序。', ['CP02'], '紧急变更下辨析先实施后审批与批准后更新的边界。'],
  K005: [['CP01'], '根据来源、需求、设计、代码、测试制品构建双向矩阵并分析一项变更影响。', ['CP02'], '在只有编号或缺关联的追踪表中找出无法回溯或无法验证的缺口。'],
  K010: [['CP01','CP03'], '给类职责/成员和调用或继承场景，区分属性操作、泛化和依赖。', ['CP02','CP04'], '给整体/部分对象生命周期，区分关联、聚合、组合及删除后果；需审核图示出处。'],
  K011: [['CP01','CP03'], '从 DFD 场景辨认四元素，找出实体直连存储等非法路径；不得仅背名称。', ['CP02'], '比较父加工及子图外部输入输出，找出层次分解不平衡；图例需人工核验。'],
  K015: [['CP01','CP02'], '比较频繁构建测试与通过人工发布门禁的流水线，辨认 CI 和持续交付。', ['CP03','CP04'], '比较人工批准发布与自动投产，识别持续部署边界及术语互换错误。'],
  K017: [['CP01'], '在具体架构场景中逐一核验刺激源、刺激、环境、制品、响应、度量，定位缺项。', ['CP01','CP02'], '将“性能好”对应的场景改为可验收约束，保持六要素并判断阈值是否有效。'],
  K020: [['CP01','CP03'], '根据领域职责、跨边界数据修改需求确定有界上下文和数据所有权。', ['CP02','CP04'], '比较独立部署能力与过细拆分造成的调用/运维代价，判断实际边界。'],
  K029: [['CP01','CP03'], '给延迟、一致性和安全/易用约束，比较可行方案的具体取舍。', ['CP02','CP04','CP05'], '给成本、容灾及交付演进约束，要求选方案并解释替代方案为何不符合前提。'],
  K037: [['CP01','CP04'], '给客户订单数据与过滤条件，判断 JOIN 和 WHERE 对保留行的影响。', ['CP02','CP03','CP05'], '用分组汇总要求判断 GROUP BY/HAVING/WHERE 顺序及结果；四个 SQL 选项均应可解析。'],
  K040: [['CP01','CP02'], '给读未命中和写更新路径，识别回源填充与写库后删除的正确顺序。', ['CP03'], '给并发读取与更新的交错时间线，找出旧值回填窗口并评价处理策略。'],
  K048: [['CP01','CP02'], '给过程审核与产品检查计划，区分预防性 SQA 和结果性 QC。', ['CP03'], '在质量控制措施中辨析测试以外的检查验证，避免把 QC 等同测试。'],
  K049: [['CP01','CP02'], '给模型生成的用例/断言/数据草案及实际执行结果，识别遗漏和错误断言。', ['CP03'], '给隐私数据、模型输出及重复执行条件，判断幻觉/泄露/不可重复风险；扩展依据需审核。'],
  K050: [['CP01','CP02','CP03'], '给日志排障和数据分类目的，判断最小必要采集及脱敏方案。', ['CP04','CP05','CP06','CP07'], '比较传输与存储加密、访问授权、审计和保留删除方案，找出只靠 HTTPS 的遗漏。'],
  K054: [['CP01'], '给故障时刻、最后可恢复点及备份记录，计算数据损失窗口并判 RPO。', ['CP02'], '给服务中断/重建/业务恢复时间线，计算恢复耗时并判 RTO，与 RPO 干扰项辨析。'],
  K055: [['CP01','CP02'], '给勒索影响范围及备份恢复测试结果，判断隔离/不可变与可恢复性。', ['CP03','CP04'], '给切换回切依赖和验证记录，识别备份成功但恢复/回切不可用的方案。'],
  K058: [['CP01','CP03'], '给健康探针、存量连接及故障流量，判断摘除/恢复/转移策略。', ['CP02','CP04'], '给会话位置、水平扩容及数据库瓶颈，判断无状态改造和负载均衡边界。'],
  K062: [['CP01','CP03'], '给副本更新与读取时间线，判断收敛范围、允许旧值期限及业务承诺。', ['CP02'], '给多服务局部提交及失败序列，选择补偿处理；补偿失败等扩展细节需新依据审核。'],
  K063: [['CP01','CP03'], '给不同测量周期及可用性，计算中断预算并核验比例和单位转换。', ['CP01','CP02'], '替换原 30 天/99.9% 数值，计算预算或是否超标，避免仅回忆 43.2 分钟。'],
  K064: [['CP01'], '给跨服务故障样本，组合日志、指标、trace 证据定位问题。', ['CP02','CP03'], '为具体服务给可执行的信号与告警方案；先补充并审核黄金信号定义、测量口径及出处。'],
  K068: [['CP01','CP02','CP03'], '给工具调用、参数范围和敏感操作，识别白名单/最小权限/确认时机漏洞。', ['CP04','CP05','CP06'], '给外部文档中的注入指令及调用审计，辨析数据与指令边界和可追溯性。'],
};

const historicalRevocations = [
  ...prior.rejected.map(r => ({...r, evidence: 'scripts/audit-link-review.json#rejected', scope: '第一轮功能审计撤销'})),
  {questionId:'RK127', knowledgeId:'K059', rationale:'API 网关统一入口治理不直接验证熔断/限流/降级各机制。', evidence:'scripts/question-links.ts#delete-confirmed-127', scope:'更早的保守关联复核'},
  {questionId:'RK131', knowledgeId:'K053', rationale:'零信任整体理念不直接验证最小角色/工具范围、按需及到期回收。', evidence:'scripts/question-links.ts#delete-confirmed-131', scope:'更早的保守关联复核'},
  {questionId:'RK147', knowledgeId:'K055', rationale:'混沌注入韧性验证不直接验证不可变/隔离备份、恢复测试及切换回切。', evidence:'scripts/question-links.ts#delete-confirmed-147', scope:'更早的保守关联复核'},
];
for (const r of historicalRevocations) {
  assert(!qById.get(r.questionId).relatedKnowledgeIds.includes(r.knowledgeId), `revoked link active: ${r.questionId}/${r.knowledgeId}`);
}

const sourceFiles = [
  ...new Set(cards.flatMap(k => [k.sourceRef.file, k.wordSourceRef.file])),
  '2026上海系统分析师_7天通关冲刺手册_知识点案例论文.pdf',
].map(file => ({file, sha256:sha(`materials/${file}`), role:file.endsWith('.xlsx')?'权威结构化原文':file.endsWith('.docx')?'知识原文复核/案例论文来源':'排版复核参考'}));
const sources = new Map(sourceFiles.map(s => [s.file,s]));
const allCpIds = new Set();
const cardReports = cards.map(k => {
  const p = inputById.get(k.id);
  assert(p?.rationale?.length > 8, `${k.id}: missing semantic rationale`);
  const checkpoints = Object.entries(p.checkpoints).map(([suffix, text]) => {
    assert(/^CP\d{2}$/.test(suffix));
    const id = `${k.id}.${suffix}`;
    assert(!allCpIds.has(id), id);
    allCpIds.add(id);
    const field = k.essentials.includes(text) ? 'essentials' : k.pitfalls.includes(text) ? 'pitfalls' : undefined;
    assert(field, `${id}: proposed text is not an exact source fragment: ${text}`);
    const start = k[field].indexOf(text);
    return {id, revision:1, text, required:true, reviewStatus:'pending-human-review', sourceRefs:[{
      ...k.sourceRef, column:field==='essentials'?'C':'D', sha256:sources.get(k.sourceRef.file).sha256,
      sourceField:field, quote:text, spanUtf16:{start,end:start+text.length},
    }], wordCrossReference:{...k.wordSourceRef,sha256:sources.get(k.wordSourceRef.file).sha256}};
  });
  assert(checkpoints.length > 0);
  const linked = questions.filter(q => q.relatedKnowledgeIds.includes(k.id));
  const chapter = linked.filter(q => q.set === 'chapter');
  assert.deepEqual(chapter.map(q => q.id), k.relatedQuestionIds, `${k.id}: reverse chapter links`);
  const relations = linked.map(q => {
    const candidate = coverage.links[q.id]?.[k.id];
    assert(candidate, `${q.id}/${k.id}: missing manual coverage proposal`);
    const direct = (candidate.direct ?? []).map(n => `${k.id}.${n}`);
    const partial = (candidate.partial ?? []).map(n => `${k.id}.${n}`);
    assert(direct.length+partial.length > 0);
    assert.equal(new Set([...direct,...partial]).size, direct.length+partial.length);
    for (const id of [...direct,...partial]) assert(checkpoints.some(cp=>cp.id===id), `${q.id}: invalid checkpoint ${id}`);
    return {questionId:q.id,set:q.set, sourceRef:q.sourceRef, answerSourceRef:q.answerSourceRef,
      proposedDirectCheckpointIds:direct,proposedPartialCheckpointIds:partial, reviewStatus:'pending-human-review',
      currentApprovedCheckpointCoverage:'unknown',
      basis:{stem:q.stem,correctOption:q.options[q.answer],explanation:q.explanation,
        note:coverage.specialReviewNotes[q.id] ?? '逐题核对以上原文与所列 checkpoint；保留未覆盖项，不以卡级关联推断全项覆盖。'}};
  });
  const candidateDirectIds = [...new Set(relations.filter(r=>r.set==='chapter').flatMap(r=>r.proposedDirectCheckpointIds))];
  const noDirectCandidate = checkpoints.filter(cp=>!candidateDirectIds.includes(cp.id)).map(cp=>cp.id);
  const request = requests[k.id];
  if (request) assert(k.priority === 'A' && chapter.length === 0, k.id);
  const draftRequests = !request ? [] : [0,1].map(i=>({
    requestId:`gap-v2:${k.id}:application-${i+1}`, requestedStatus:'draft', publicationAllowed:false,
    type:'single-choice', origin:'original-simulation', requestedPools:['initial-validation','consolidation'],
    targetCheckpointIds:request[i*2].map(n=>`${k.id}.${n}`), assessmentRequirement:request[i*2+1],
    difficultyTarget:'application', measuredDifficulty:'unknown',
    requiredFields:['stem','options.A','options.B','options.C','options.D','answer','explanation',
      'checkpointIds','sourceRefs','authoringBasis','difficulty','distractorRationales.A','distractorRationales.B','distractorRationales.C','distractorRationales.D'],
    acceptance:'题干场景信息足以判唯一答案；错误选项来自真实近邻误解；解析逐项说明；覆盖范围须逐项审定，不能因目标引用存在即视为通过。',
  }));
  for (const r of draftRequests) for (const id of r.targetCheckpointIds) assert(checkpoints.some(cp=>cp.id===id));
  if (request) assert(checkpoints.every(cp=>draftRequests.some(r=>r.targetCheckpointIds.includes(cp.id))), `${k.id}: requirement omitted checkpoint`);
  return {cardId:k.id,title:k.title,module:k.module,priority:k.priority,
    originalEssentials:k.essentials, originalPitfalls:k.pitfalls, sourceRef:k.sourceRef,wordSourceRef:k.wordSourceRef,
    currentRuntimeCheckpointCount:0, proposedCheckpointCount:checkpoints.length, checkpoints,
    semanticReview:{status:'author-proposal',humanApproval:'pending',rationale:p.rationale},
    currentValidationMethod:k.validationMethod,
    credibleChapterQuestionIds:chapter.map(q=>q.id), credibleMockQuestionIds:linked.filter(q=>q.set==='mock').map(q=>q.id),
    credibleChapterQuestionCount:chapter.length, credibleMockQuestionCount:linked.length-chapter.length,
    credibleQuestionCount:linked.length,
    missingCredibleDailyValidation:chapter.length===0, priorityDraftTarget:!!request,
    currentApprovedRequiredCoverage:'unknown',proposedChapterDirectCheckpointIds:candidateDirectIds,
    checkpointIdsWithoutDirectChapterCandidate:noDirectCandidate, questionCoverageProposals:relations,
    draftQuestionRequests:draftRequests,
  };
});
assert.equal(allCpIds.size, cardReports.reduce((n,k)=>n+k.proposedCheckpointCount,0));
assert.equal(questions.filter(q=>q.relatedKnowledgeIds.length).length, Object.keys(coverage.links).length);
for (const [qid, links] of Object.entries(coverage.links)) assert.deepEqual(Object.keys(links).sort(),[...qById.get(qid).relatedKnowledgeIds].sort(), `${qid}: proposal invented/reinstated link`);
const missing = cardReports.filter(k=>k.missingCredibleDailyValidation);
assert.equal(missing.length,29);
assert.equal(missing.filter(k=>k.priority==='A').length,20);
assert.equal(missing.filter(k=>k.priority==='B').length,9);
assert.deepEqual(Object.keys(requests).sort(),missing.filter(k=>k.priority==='A').map(k=>k.cardId).sort());
const uniqueFindingIds = new Set();
const expandedWeaknesses = quality.weakDistractorFindings.map(f=>{
  const q=qById.get(f.id); assert(q);
  assert(!uniqueFindingIds.has(q.id)); uniqueFindingIds.add(q.id);
  assert(f.options.length>=2 && !f.options.includes(q.answer));
  return {...f,stem:q.stem,set:q.set,sourceRef:q.sourceRef,
    weakDistractors:f.options.map(option=>({option,text:q.options[option],rationale:f.gap})),
    reviewStatus:'pending-human-review', measuredDifficulty:'unknown'};
});
const transferIds = new Set(quality.singleStepTransferFindings.map(f=>f.id));
assert.equal(transferIds.size,quality.singleStepTransferFindings.length);
for (const id of transferIds) assert(qById.has(id));

const summary = {
  knowledgeCards:76,priorityA:57,priorityB:19,chapterQuestions:75,mockQuestions:75,
  proposedCheckpoints:allCpIds.size, runtimeExplicitCheckpoints:0, currentApprovedCheckpointMappings:0,
  cardsWithCredibleChapterQuestions:76-missing.length,missingCredibleChapterCards:missing.length,
  missingACards:20,missingBCards:9,cardsWithoutAnyPoolQuestion:cardReports.filter(k=>k.credibleQuestionCount===0).map(k=>k.cardId),
  linkedChapterQuestions:questions.filter(q=>q.set==='chapter'&&q.relatedKnowledgeIds.length).length,
  linkedMockQuestions:questions.filter(q=>q.set==='mock'&&q.relatedKnowledgeIds.length).length,
  unlinkedQuestions:questions.filter(q=>!q.relatedKnowledgeIds.length).length,
  revokedAssociations:historicalRevocations.length,weakDistractorQuestions:expandedWeaknesses.length,
  transferGapQuestions:transferIds.size,minimumRequestedDraftQuestions:40,
};
assert.equal(summary.linkedChapterQuestions,60);
assert.equal(summary.linkedMockQuestions,44);
assert.equal(summary.unlinkedQuestions,46);
const report = {
  app:'ruankao-system-analyst',requirementsFormatVersion:1,reviewStatus:'pending-human-review',publicationAllowed:false,
  auditDate:'2026-10-11', baselineCommit:'fc087c0f811b8eaca565134320e4930b2313c03e',baseContentVersion:manifest.contentVersion,
  scope:'阶段 B 审核需求，不是可安装内容包或已审定新题库',sources:sourceFiles,
  inputHashes:Object.fromEntries(['src/data/knowledge.json','src/data/questions.json',
    'docs/review/knowledge-checkpoint-proposals.json','docs/review/question-coverage-proposals.json',
    'docs/review/question-quality-findings.json'].map(p=>[p,sha(p)])),
  summary,cards:cardReports,revokedAssociations:historicalRevocations,
  questionQualityReview:{basis:quality.basis,weakDistractorFindings:expandedWeaknesses,
    singleStepTransferFindings:quality.singleStepTransferFindings,
    allQuestionInventory:questions.map(q=>({questionId:q.id,set:q.set,origin:q.origin,sourceRef:q.sourceRef,
      reviewPass:'stem-options-answer-explanation-read',
      findings:[...(uniqueFindingIds.has(q.id)?['weak-distractors']:[]),...(transferIds.has(q.id)?['transfer-gap']:[])],
      unflaggedMeaning:'本次未列明确意见，不代表应用能力/难度已达标',measuredDifficulty:'unknown'}))},
  reviewInstructions:[
    '逐卡确认 required 检查点及原文范围；编号在审核修订中保持稳定。',
    '逐题核验 direct/partial 候选；卡级可信不等于 checkpoint 覆盖已审定。',
    '模考题保持隔离，不提前用作日常验证，不能用已有模考数量冲抵20张A卡缺题。',
    '首批每卡两道是起草需求，复杂卡可能仍需更多题才能有效覆盖，不能承诺两题即可全部掌握。',
    '新题须为draft且待审核文件，不进入src/data/public/预缓存或staging；原创题不标官方真题。',
    '补充定义/场景/解法需独立命题依据和来源审核；此文件原文片段不包含新增讲解。',
  ],
};
const line = (cells)=>`| ${cells.map(s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ')).join(' | ')} |`;
const md = [
  '# 学习内容缺口清单（阶段 B，待人工审核）','',
  '基线 `fc087c0`，内容版本 `'+report.baseContentVersion+'`，核对日期 2026-10-11。当前运行应用没有显式 checkpoints；下列要点数量为逐卡语义核对后提出的拆分数量，不是已发布/已审定数据。未改原题、答案、ID、历史记录或 staging。','',
  '## 1. 数量、来源及判定口径','',
  `76 卡（A57/B19），75 章节题、75 独立模考题、9 案例、10 论文。提出 ${summary.proposedCheckpoints} 个 required 检查点。47 卡有可信章节题，29 卡无可信日常验证题（A20/B9）。题库有卡级关联的题：章节60、模考44；其余46题保留为全范围训练。5卡两池都没有关联：${summary.cardsWithoutAnyPoolQuestion.join('、')}。`, '',
  '知识原文及全部150题的题干、四选项、答案、解析均逐项读取。原附件字段由独立只读来源核对脚本校验；生成脚本仅检查完整性及引用，不代替语义审核。每卡拆分理由、每项原文范围、文件哈希及每题覆盖候选见结构化 `learning-content-gap.json`。','',
  ...sourceFiles.map(s=>`- ${s.file}；SHA-256：\`${s.sha256}\`；${s.role}。`),'',
  '原 Excel `必背清单76` 第5—80行 C/D列、Word第04章逐卡来源保留。章节/模考题各第5—79行，答案与解析第5—154行。原始资料均为原创训练。','',
  '卡级关联沿用已有保守复核结果。章节题和模考题分开计数：仅模考有题仍算日常缺题，模考池不能提前泄漏用于首轮练习。direct/partial 是本次 checkpoint 覆盖候选，全部 pending-human-review；现有已审核 checkpoint 覆盖为 unknown，不能从题数推断知识掌握。','',
  '## 2. 全部76卡要点与关联数','',
  line(['ID','优先级','主题','提案要点数','章节题数 / IDs','模考题数 / IDs','日常验证缺口']),
  line(['---','---','---','---:','---','---','---']),
  ...cardReports.map(k=>line([k.cardId,k.priority,k.title,k.proposedCheckpointCount,
    `${k.credibleChapterQuestionCount} / ${k.credibleChapterQuestionIds.join('、')||'—'}`,
    `${k.credibleMockQuestionCount} / ${k.credibleMockQuestionIds.join('、')||'—'}`,
    k.priorityDraftTarget?'**A缺题，首批起草目标**':k.missingCredibleDailyValidation?'B缺题，自评':'有题，仍需覆盖审核'])), '',
  '## 3. 20张A级缺题卡：具体核验需求','',
  '每卡先起草两道应用型单选的需求；下文仅写考核场景和目标检查点，没有新题干/选项/答案。首批两题不能保证复杂卡全部要点被有效验证，审核时需要缩小覆盖声明或追加题数。每题均要求完整解析、逐选项干扰依据、来源、难度目标和实际未知难度，不得复用模考题充数。','',
  ...cardReports.filter(k=>k.priorityDraftTarget).flatMap(k=>[
    `### ${k.cardId} ${k.title}`,'',
    `原文：${k.sourceRef.sheet} 第${k.sourceRef.row}行；章节可信题 **0**；模考关联 ${k.credibleMockQuestionIds.join('、')||'无'}。`, '',
    ...k.checkpoints.map(cp=>`- \`${cp.id}\` r${cp.revision}：${cp.text}（${cp.sourceRefs[0].column}列原文）`),'',
    ...k.draftQuestionRequests.map((r,i)=>`${i+1}. ${r.assessmentRequirement} 目标：${r.targetCheckpointIds.map(id=>'\`'+id+'\`').join('、')}。`),'',
    `拆分理由：${k.semanticReview.rationale}`,'',
  ]),
  '## 4. 已有题仍不足以证明整卡覆盖','',
  '以下是具代表性的 checkpoint 缺口；全部76卡的候选缺口 ID 已在 JSON 中列全。不是把候选 direct 当成已通过审核。','',
  '- K001：章节 RK025 仅涉及性能 NFR，功能能力 CP01 只有独立模考 RK135；不能由一道章节题宣称全部需求类型掌握。',
  '- K002：RK001 只验证 CP05 可验证性，正确/无歧义/完整/一致/可追溯及可行性/必要性仍缺对应日常验证。',
  '- K006：RK037/RK048 有 include/extend 候选，但参与者/边界/用例 CP01 仍无章节完整覆盖。',
  '- K014：RK039 只验证 PO；Scrum Master、团队职责及零文档误区不能由敏捷宣言题补足。',
  '- K018：RK004 只涉及进程视图，其余四视图仍需按制品具体辨析。',
  '- K035：RK063/RK070 涉及 I/D，不能默认覆盖 A/C 或全部事务异常。',
  '- K043/K044：语句/判定和边界值/判定表不覆盖条件判定组合及其他测试设计技术。',
  '- K047：P95 含义题不验证吞吐、错误率、利用率和饱和度诊断。',
  '- K067：现题检索后生成缺权限前提，CP01 只能记部分候选；还需效果和幻觉边界应用训练。',
  '- K071：现题 CV/SPI 计算不覆盖 SV/CPI；RK057 的 RK046 情形依赖必须保留。','',
  '## 5. 已撤销的不可信关系','',
  '全部已知撤销共8组：前一轮明示5组，以及脚本更早保守复核撤销的3组。撤销的是关联，不删除题目或历史答题。未知旧证据保留原判分，仅不计当前可信覆盖。','',
  line(['题目','原关联卡','撤销依据','记录']),line(['---','---','---','---']),
  ...historicalRevocations.map(r=>line([r.questionId,r.knowledgeId,r.rationale,r.evidence])), '',
  '## 6. 选项与实际理解的缺口','',
  `对全部150题做定性筛查，列出 ${summary.weakDistractorQuestions} 道具有明确弱干扰项的题，另有 ${summary.transferGapQuestions} 道基础计算/概念向场景迁移不足。缺少学生数据，实际难度和区分度 **unknown**；未列题不代表已经足够难。现有基础题可作热身，不能替代应用验证。原题均保持。`, '',
  line(['题目 / 池','弱干扰项原文','未验证能力及补强方向']),line(['---','---','---']),
  ...expandedWeaknesses.map(f=>line([`${f.id} / ${f.set==='chapter'?'章节':'模考'}`,
    f.weakDistractors.map(d=>`${d.option}. ${d.text}`).join('；'),`${f.gap} ${f.request}`])), '',
  line(['题目','计算或场景迁移缺口']),line(['---','---']),
  ...quality.singleStepTransferFindings.map(f=>line([f.id,f.gap])), '',
  '## 7. 讲解补强与人工审核交接','',
  '- 76张讲解多为记忆提要；需补应用步骤、反例、适用前提和完整解析，优先覆盖本报告 A缺题及已有题覆盖不足卡。不是新增内容已完成。',
  '- K064 仅出现“四个黄金信号”名称，没有具体定义与计算口径；命题前须补独立出处并审核，不能凭生成内容冒充附件原文。K033保留“简化记忆”的形式化边界。',
  '- SQL、DFD、类图、变更/追踪、缓存并发、补偿等场景须有可复核数据或图；原素材缺具体场景时，新创作材料单列命题依据、标 draft。',
  '- 外部审核读取 `learning-content-gap.json`：76卡、全部检查点源片段、卡级题数、逐关系direct/partial候选、8撤销关系、150题筛查清单、40项起草需求。',
  '- 审核先确认 CP边界与 required，再确认真实题目覆盖，最后审核新增题。版本化审核结论必须对应整个待审文件 hash；自行填写 approved 不等于批准。',
  '- 本次未生成 `draft-question-pack.json`，未接入 CP、迁移数据或发布 staging。补题文件后续只保存待审核目录，人工批准前不进入运行题库。','',
  '## 8. 校验方式与证据','',
  '`node scripts/build-learning-gap.mjs --check` 只读核验76卡/优先级/题池/来源片段/CP引用/40需求/撤销关系与已保存报告一致。`npm run data:check` 检查原内容仍完整。独立来源检查使用 `scripts/audit-content.py`（bundled Python/openpyxl/pypdf，只读）。实际执行日志见 `round3/planning/`；详情见 `round3-planning-report.md`。这些检查不等于未来 v2迁移/新备份/手机 UI已经验收。','',
].join('\n');
const files = {'docs/learning-content-gap.json':JSON.stringify(report,null,2)+'\n','docs/learning-content-gap.md':md};
for (const [p,data] of Object.entries(files)) {
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(path.join(root,p),'utf8'),data,`${p}: stale review report`);
  else fs.writeFileSync(path.join(root,p),data);
}
console.log(JSON.stringify({result:'PASS',mode:process.argv.includes('--check')?'read-only-check':'review-report-generation',...summary},null,2));
