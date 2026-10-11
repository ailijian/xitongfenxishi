# 零基础课程上线：数据保护与备份恢复报告

结论 **PASS**。本次是静态教学内容和知识页的升级，无数据库迁移。Dexie版本2、备份schemaVersion 2、基础内容版本2026.10.11.1保留。原卡、原题、内容关联、原自测、24小时判定、模考答案门禁、备份实现均未改；基线字节比对见 `preserved-baseline.json`。

## 实际升级实验

在单独合成浏览器profile中，通过上线前的真实staging正常UI建立12类非空记录并导出备份。新版本部署后，点击Service Worker更新按钮，导出新备份，与旧备份的 `data` 整体深比较；再刷新K001、恢复K002旧自测草稿、重新导出比较。全部原字段、记录顺序、ID、时间戳、文字、分数和历史判断均一致。

随后仅在该合成profile里执行二次确认清空、导入旧备份、二次确认恢复；全部12表深比较一致。导入损坏JSON后记录仍一致。真实用户浏览器、学习资料和用户数据没有被读取或清空。

| 表 | 旧记录数 | 升级后逐字段相同 | 清空恢复后逐字段相同 |
|---|---:|---|---|
| settings | 1 | PASS | PASS |
| cards | 2 | PASS | PASS |
| cardAttempts | 1 | PASS | PASS |
| questionAttempts | 2 | PASS | PASS |
| learningDrafts | 1 | PASS | PASS |
| sessions | 2 | PASS | PASS |
| bookmarks | 1 | PASS | PASS |
| caseDrafts | 1 | PASS | PASS |
| caseAttempts | 1 | PASS | PASS |
| essayDrafts | 1 | PASS | PASS |
| projects | 1 | PASS | PASS |
| exams | 1 | PASS | PASS |

现场证据：`pre-release-backup.json`、`staging-upgrade.json`、`logs/staging-seed.log`、`logs/staging-upgrade.log`。命令：`npx tsx scripts/audit-beginner-upgrade.ts seed`（发布前）、`npx tsx scripts/audit-beginner-upgrade.ts verify`（发布后）。

## 回归及边界

- 本地与线上课程用例独立生成12类非空数据，执行理解题、刷新和旧草稿继续；原备份数据深比较一致。新理解题只保存在组件状态，不产生questionAttempts、cardAttempts或sessions记录。
- 63项单元测试全部通过，包括数据库v1→v2时已有知识状态/题目尝试/启动日保留、缺少mockKind的旧schema2备份、旧K014/RK027历史不重判、无效/未知引用拒绝、恢复中途故障的完整事务回滚及历史成绩保留。
- 原14项流程、20项审计、2项PWA回归通过：原知识首轮、24小时复测、跨日、重启、同卷答案隔离、案例/论文、整卷评分和备份均保持原有行为。
- 没有重映射旧布尔数组、没有把课程理解题计入客观证据、没有覆盖学习历史；K004/K005/K010/K011仍仅自评验证。
- 不新增schema3，不安装新内容包；这两者不属于本轮课程接入。原始教学包审核状态保留。
- 用户的实体iPhone、Safari主屏幕安装、真实软键盘和系统存储回收 **NOT TESTED**，按约定由用户验收。已执行WebKit手机模拟及375/390px触摸测试，并与320/430px、500px缩小视口滚动测试区分记录。
