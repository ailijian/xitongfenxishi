# 旧数据保留与备份恢复验收

结果：PASS。测试在真实 `https://ruankao.staging.haaboo.com/` 执行，使用独立自动化持久化Chromium profile，未读取、导出或清空用户浏览器。升级前即在旧线上版本建立非空的12类代表性学习记录，并自动导出[可恢复备份](pre-release-backup.json)；该文件只含合成测试资料。

原内容版本 `2026.10.11.1`、IndexedDB schema=2、备份schema=2保持不变。新增课程仅以独立教学版本 `2026.10.12.beginner.2` 接入，无知识验证v2迁移、无261项checkpoint审批，无旧布尔证据映射。

|表|测试记录数|旧PWA升级后逐字段相同|清空/恢复后逐字段相同|
|---|---:|---|---|
|settings|1|PASS|PASS|
|cards|2|PASS|PASS|
|cardAttempts|1|PASS|PASS|
|questionAttempts|2|PASS|PASS|
|learningDrafts|1|PASS|PASS|
|sessions|2|PASS|PASS|
|bookmarks|1|PASS|PASS|
|caseDrafts|1|PASS|PASS|
|caseAttempts|1|PASS|PASS|
|essayDrafts|1|PASS|PASS|
|projects|1|PASS|PASS|
|exams|1|PASS|PASS|

比较使用导出JSON的整个 `data` 深度相等，包含嵌套内容、ID、Unicode正文、时间戳、答题证据、自评分、模考答案/状态及历史。不以只核对记录数替代逐字段比较。

实际步骤：

1. 旧版本联网注册并激活旧Service Worker，填入首轮自检、错题、案例历史、真实项目素材、论文正文、未提交闭卷草稿、模考答案与收藏、学习起始日，确认12表均非空，再导出。
2. 保留原profile与旧缓存，发布后重新打开；出现“更新并重新载入”才手动更新，等待真实新教学版本显示。导出后整个data与旧备份相等。
3. 刷新K001，打开K002，旧未提交闭卷草稿原样恢复，再次全表导出比对相等。
4. 在该合成测试profile中二次确认清空，12表全部空；导入旧schema=2备份，完成校验预览与二次确认，12表逐字段完整恢复。
5. 导入非法JSON，明确提示原数据未改动；再导出与旧备份仍相等。

实际命令：`npx tsx scripts/audit-full-course-upgrade.ts seed`（旧发布）及 `verify`（新发布）。[升级前日志](logs/staging-pre-upgrade.log)、[升级/恢复日志](logs/staging-upgrade.log)、[机器结果](staging-upgrade.json)。未重新seed，也未删除profile后把新安装当作旧版本升级。

课程理解题不写入原questionAttempts/cardAttempts，辅导不自动填入项目或正文；上述性质另外由75单元、14原流程、20审计、36旧课程和95新课程/辅导专项验证。原DB、备份和掌握/门禁等16核心文件与基线逐字节一致。

未测试：实体iPhone的数据存储回收及系统升级；此处是代表性12表真实旧PWA升级，未声称枚举所有用户历史组合。schema=3备份与知识验证v2迁移未进入本轮应用，不应将不存在的迁移标记为通过。
