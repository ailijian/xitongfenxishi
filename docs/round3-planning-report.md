# 第三轮首批交付：阶段 A 迁移计划和阶段 B 缺口报告

日期：2026-10-11，Asia/Shanghai；基线 main `fc087c0f811b8eaca565134320e4930b2313c03e`，远端 main 已只读核对为同一提交。

本次完成用户要求“先提交”的计划和清单。**未实现知识验证 v2、未执行用户数据库迁移、未生成40道题草稿、未部署 staging。** 内容文件均为待人工审核的提案，不能作为安装包。后续代码、v3备份实测、手机前后截图在阶段 A 实现后交付。

## 交付和重要结论

- [迁移计划](knowledge-v2-migration-plan.md)：旧12类只读兼容，自动恢复副本、升级竞争屏障、两个必要新 store、checkpoint级新证据、required覆盖统计、v2→v3 JSON及事务失败回滚、验收门槛。
- [完整缺口报告](learning-content-gap.md)：全部76卡的要点数量/优先级/章节与模考关联数；20张 A缺题卡逐项考核需求；已有题部分覆盖；8组已撤销关系；53道弱干扰项题和9道迁移能力不足题。
- [结构化审核需求](learning-content-gap.json)：261个 proposed required CP（ID/revision/原文范围/源文件hash），逐卡拆分理由，当前104道有卡级关联题的覆盖候选、全部150题筛查清单及40项首批起草需求。当前 checkpoint 覆盖全部尚未审定，不当作运行数据。

数据数量：76（A57/B19）/150（75章节+75模考）/9案例/10论文，原文未改。29卡没有可信章节题，其中 A20/B9；47卡有可信章节关联。题数60章节/44模考为有卡级关联的题数，不是完整 CP覆盖数。5卡任何题池均无关联。所有模考仍隔离于日常验证。

撤销共8组：上轮审计的RK027/K014、RK092/K039、RK103/K020、RK119/K052、RK141/K040，以及更早脚本保守复核的RK127/K059、RK131/K053、RK147/K055。不会删除这些题或历史作答。

定性题目质量筛查不等于测得难度/区分度；需未来学生作答及内容专家复核。新增教学讲解、题目覆盖和所有补题都须人工审核，不能自称官方真题。两道起草需求不保证复杂卡全要点已得到客观验证。

## 实际执行的校验

| 校验 | 本次结果 | 证据 |
|---|---|---|
| `node scripts/build-learning-gap.mjs --check` | PASS：76卡、261项原文片段/ID/revision、题池、关联双向性、CP引用、20A/9B、8撤销、40需求、报告一致 | [日志](round3/planning/gap-check.log) |
| bundled Python `scripts/audit-content.py` | PASS：2,551项字段一致，Word489段/PDF16页，76/150/9/10 | [日志](round3/planning/source-fields.log) |
| `npm run data:check` | PASS：原始资料完整、29张仅自评卡 | [日志](round3/planning/data-check.log) |
| `npm test` | PASS：原56项，7文件；未新增运行代码测试 | [日志](round3/planning/unit-baseline.log) |
| `npm run build` | PASS：原始内容检查、TypeScript、Vite、PWA生成 | [日志](round3/planning/build.log) |
| `node scripts/check-review-scope.mjs` | PASS：基线所有已跟踪文件逐字节一致，待审文件未进入 dist | [范围与产物检查](round3/planning/scope-check.log) |
| `git diff --cached --check` | PASS，无空白错误 | 提交前实际执行 |

bundled Python 的实际路径：`/Users/lijian/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`。这里只读分析原附件，不编辑 Excel/Word/PDF。首次临时范围检查命令因 Git 中文路径转义解析失败，已改为 NUL 分隔并完整重跑；[失败与修正说明](round3/planning/verification-notes.log)。应用测试没有失败项。

## 尚未执行的阶段 A/D 验收

| 项目 | 状态与原因 |
|---|---|
| v3 迁移前自动备份及升级后12类逐字段一致 | NOT TESTED：仅完成详细计划，尚无 v3实现 |
| v2备份升级/v3备份恢复、损坏目录/写入失败回滚 | NOT TESTED：当前仍为 schema2；现有56项通过不等于新 schema3通过 |
| 原14流程/2PWA/20审计流程在新版回归 | NOT TESTED：本次无新版运行应用；实施后必须重跑，不能沿用上轮通过作为本轮证据 |
| 新旧首页/知识页/进度页手机对比截图 | NOT TESTED：页面未改，不制造新版截图；上轮截图仅为已审阅基线 |
| 重复模考取消或终止 | NOT IMPLEMENTED / 待办：无入口和保存状态，退出页面继续保持进行中锁定；不伪造交卷解锁 |
| 实体 iPhone 键盘/后台/PWA挂起 | NOT TESTED：本轮仅资料审核和规划 |
| staging 发布及线上 v2安全验收 | NOT TESTED：本次未发布，也未变更共享代理或其他项目 |

完整新增文件见 [changed-files.txt](round3/planning/changed-files.txt)。本次运行源码、原数据、既有测试及部署配置均不改。审核后按迁移计划实施 MVP，再给出完整实现报告和实测数据，不将方案报告当作实施完成。
