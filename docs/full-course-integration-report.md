# 全76课零基础内容升级验收

课程内容版本：`2026.10.12.beginner.2`。基线：`8ecdd0e`。完成D2、D3、D4、D5、案例论文五批真实内容集成；最终本地242项、线上17项全部通过，已部署[staging](https://ruankao.staging.haaboo.com/)。

## 数量与来源

|内容|原有|新增|最终|
|---|---:|---:|---:|
|零基础课程|15|61|76（A57/B19）|
|原创教学理解题|30|122|152|
|离线概念图|8|33|41|
|案例拆题辅导|0|9|9|
|论文写作教练|0|10|10|
|原知识卡/章节题/独立模考题|76/75/75|0|76/75/75|
|原案例/论文专题|9/10|0|9/10|

原包的13个文件完整保留。原D1 JSON与新包只读D1文件逐字节相同；61新课、19辅导的运行JSON与提供文件逐字节相同；组合课程与全76校对文件逐对象相同。课程ID、题目ID、标题、优先级和D1—D5顺序严格校验。新122题答案分布A31/B31/C30/D30，每题保留4个选项和4项解析。

2859项在D2—D5及辅导Markdown中出现的正文/题解字段逐项核对；D1讲义另核对734项。新包Markdown省略的Mermaid、SQL补充、题ID、衔接语等以同包JSON为来源，进行字节、schema、图示引擎和实际页面校验。全部61课逐课浏览、练习、闭卷及刷新测试覆盖。

**来源问题（未修改原包）**：FILE_MANIFEST.json自身的大小/哈希记录与实际文件不匹配；其他12个内容文件记录均匹配。自身SHA实际值为`3abc9f26633d1fb9f590dd7191c709633bf3bc0035741f8f9eb0dd3f73b2d9e7`。本项目另外记录真实来源哈希，见[内容校验JSON](full-course/content-integrity.json)。这不影响运行内容的源字节一致性。

## 页面实现与边界

76卡沿用已认可的K001体验：通俗解释、连续医院预约场景、逐步讲解（上一/下一/全部）、至少4步带做、概念图、原创理解练习、闭卷自述、最后折叠的原始考前速记。D1内容原样保留，课程序列自然连接D2—D5。

K037提供原字符保真的SQL代码块、局部横滑、复制与明确失败反馈。公式使用原有分步解释及带做过程，NPV、EMV、EVM、停机预算和关键路径数值独立核算通过。33新图逐个用Mermaid12.1.0实际渲染，无语法改写，输出安全SVG并校验来源/输出SHA；33图所有文字均在viewBox内。在线及离线应用只加载SVG，保留原示意图备注和文字替代，不加载Mermaid运行时。

案例有9套完整“不会做？先看拆题思路”：5步拆解、常见错误、迁移练习、自查及课程链接。采分要点示例只有原`draft.revealed`成立才进入DOM，仍须先完成全部3问草稿再揭示原答案。原题干、参考答案、采分组、25分自评和历史不变。论文有10个写作教练：5段写作引导、3项真实证据、避坑与起步练习；不自动创建项目或填入草稿。

理解题交卷前没有答案与解析DOM，交卷后显示正确答案及四项解析，重做重新关闭；只存于当前页面，不写入原题库、错题本、学习成绩或客观掌握。所有新题仍标原创教学练习、非官方真题，原reviewStatus保持不变。

## 数据安全

没有知识验证v2迁移，也没有批准261项待审checkpoint。IndexedDB schema=2、备份schema=2、原正式内容版本`2026.10.11.1`保持不变。独立课程版本显示在页面及离线状态区域；PWA沿用手动更新提示，输入过程中不会强制重载。

原六个核心JSON、数据库、备份、训练写入、掌握判定、模考门禁、时钟、D1课程及图示绑定等16个核心文件与基线逐字节相同。原8图SHA校验通过。只在独立测试浏览器建立升级前备份，不访问或清空用户浏览器。真实旧PWA更新后、JSON二次清空恢复后，12类学习数据逐字段一致；非法导入后原数据不变。见[数据保留及恢复报告](full-course/data-preservation-report.md)。

## 五批验收与提交

|批次|新增课/题/图|浏览器专项|提交|
|---|---|---|---|
|D2|15/30/8|19通过|`2e22b67`|
|D3|15/30/8|20通过（含SQL复制）|`144229b`|
|D4|15/30/6|19通过|`f1c5f41`|
|D5|16/32/11|20通过|`b6427d7`|
|案例论文|9案例+10论文教练|19通过|`d0f88b2`|

每批附[验收记录](full-course/)与实际命令输出 `full-course/logs/`。完成全部五批后才进行完整回归及staging发布。

## 完整自动化验收

|检查|实际结果|日志|
|---|---|---|
|单元|75/75 PASS（原56＋D1 7＋新课程8＋辅导4）|[final-unit](full-course/logs/final-unit.log)|
|原流程|14/14 PASS|[final-e2e](full-course/logs/final-e2e.log)|
|D1课程与全站按钮布局回归|36/36 PASS|[final-beginner](full-course/logs/final-beginner.log)|
|全61新课/19辅导/手机/PWA专项|95/95 PASS|[final-full-course](full-course/logs/final-full-course.log)|
|日期/复测/模考门禁/旧数据审计|20/20 PASS|[final-audit](full-course/logs/final-audit.log)|
|原PWA/JSON恢复|2/2 PASS|[final-pwa](full-course/logs/final-pwa.log)|
|TypeScript / 生产构建|PASS，62项预缓存约1656.33KiB|[final-build](full-course/logs/final-build.log)|
|真实Mermaid / 图中文字边界|33/33 + 33/33 PASS|[渲染](full-course/logs/final-mermaid-render.log)、[布局JSON](full-course/diagram-layout.json)|

最终本地合计242项全部通过，零跳过；8项WebKit包含于36/95项中，不重复计数。新离线专项逐一打开76课、41图、19辅导，断网重开后答题/SQL/草稿继续可用。95项覆盖全部61新课两题、全部4选项解析、交卷门禁、重做、闭卷草稿及无客观写入；19辅导检查原采分与草稿历史保持。

实际命令及初次失败原因见[命令记录](full-course/test-commands.md)，[汇总结果](full-course/test-results.json)与`full-course/local/*-results.json`保留原浏览器报告。视觉复核发现E02关联链接相接，改为每行一条并增加19个辅导的真实几何断言，随后在最终状态重新完成全部回归。

## 手机页面对比

基线和升级后均为真实浏览器截图，目录[手机截图](full-course/screenshots/)。重点：首页、K037 SQL、K054 RPO/RTO、K060 CAP、K068 Agent、C09案例、E02论文；升级后375px/390px，另自动化检查320px/430px。新旧截图真实采集，视觉复核SQL、RPO/RTO、案例与论文区域通过。

|页面|旧390px|新390px|新375px|
|---|---|---|---|
|首页|[旧](full-course/screenshots/before-home-390.png)|[新](full-course/screenshots/after-home-390.png)|[新](full-course/screenshots/after-home-375.png)|
|K037 SQL|[旧](full-course/screenshots/before-K037-390.png)|[新](full-course/screenshots/after-K037-390.png)|[新](full-course/screenshots/after-K037-375.png)|
|K054 RPO/RTO|[旧](full-course/screenshots/before-K054-390.png)|[新](full-course/screenshots/after-K054-390.png)|[新](full-course/screenshots/after-K054-375.png)|
|K060 CAP|[旧](full-course/screenshots/before-K060-390.png)|[新](full-course/screenshots/after-K060-390.png)|[新](full-course/screenshots/after-K060-375.png)|
|K068 Agent安全|[旧](full-course/screenshots/before-K068-390.png)|[新](full-course/screenshots/after-K068-390.png)|[新](full-course/screenshots/after-K068-375.png)|
|C09案例|[旧](full-course/screenshots/before-C09-390.png)|[新](full-course/screenshots/after-C09-390.png)|[新](full-course/screenshots/after-C09-375.png)|
|E02论文|[旧](full-course/screenshots/before-E02-390.png)|[新](full-course/screenshots/after-E02-390.png)|[新](full-course/screenshots/after-E02-375.png)|

## 尚未通过或未测试

- 上游FILE_MANIFEST.json自身记录不一致，保留并报告，未伪造修正。
- 实体iPhone：NOT TESTED，由用户统一安排；WebKit模拟及缩小视口输入测试不等于真实键盘/真机验收。
- 教学内容专家正式审定：NOT TESTED，保留原审阅状态；不能据此宣称考试难度充分校准或保证考试通过。
- 原RK150弱干扰项、20张A级卡缺少可信客观题：本轮未扩充正式题库；教学理解题不补造独立客观证据。
- 构建内容chunk为528.18kB（gzip153.08kB），Vite给出超过500kB的性能提示，构建及离线预缓存均成功；未隐藏提示或改变阈值。
- 知识验证v2数据库迁移、261项checkpoint批准、全新考场状态机不在本轮发布范围。

## 实际staging发布

|身份|实际值|
|---|---|
|教学课程版本|`2026.10.12.beginner.2`|
|应用package / 原内容 / DB / 备份版本|`1.0.0` / `2026.10.11.1` / `2` / `2`|
|应用源码提交|[`8889870427ea86af4fe9287579c0679ff9433fc8`](https://github.com/ailijian/xitongfenxishi/commit/8889870427ea86af4fe9287579c0679ff9433fc8)，含上方5批提交|
|release|`staging-20261011T164428Z-aa95525b727c`（UTC命名；北京时间2026-10-12）|
|源码归档SHA-256|`aa95525b727cef8160ee3de5e8ea1fd1859f0e369629cc64b5a09884346ec0d9`|
|镜像ID|`sha256:43257b5f864cf1178ebc499fa40ca73b0ac3fb7e07610622eee1bcd36fcd12f2`，linux/amd64|
|当前目录|`/opt/azao-staging/projects/ruankao/releases/staging-20261011T164428Z-aa95525b727c`|
|回滚目录|`/opt/azao-staging/projects/ruankao/releases/staging-20261011T132846Z-cc902d4a6375`|

线上13项：C09/E02全文及答案门禁/历史、SQL复制、76课41图19辅导离线关页重开、7页面375/390截图、320/430辅导布局、76课目录/衔接、4项WebKit；另3项托管与1项资源比对，17/17 PASS。58资源（含全部41SVG、SW及workbox）与本机独立候选dist逐字节相同。升级后[真实HTTPS手机截图](full-course/screenshots/staging/)已保存，未以本地截图冒充线上截图。

独立发布包重复执行npm ci、75单元及生产构建，归档175个源码文件与上述提交逐字节一致。[机器发布结果](full-course/deployment-result.json)、[源码比对](full-course/candidate-source-verification.json)、[发布日志](full-course/logs/staging-activation.log)、[服务器隔离结果](full-course/server-isolation.json)。bundle脚本写入的通用snapshot标志保持原样；本轮额外字节比对证明归档源码来自已提交树。

只重建`ruankao-staging-web-1`，共享代理和其他15容器ID/启动时间/镜像均不变，原主站、judgment页面及bootstrap入口部署前后均200。全部检查通过后才更新current，保留当前与至少2个旧release。回滚时在上述旧目录执行`bash activate-web.sh`，验证后恢复current；不操作共享代理，不执行全局清理或`down -v`。

[完整变更文件](full-course/changed-files.txt)包含代码、33新SVG、原包13文件、日志和手机截图；后续交付提交仅补录报告及README命令说明，不改变已验收应用产物。

## 本地运行

`npm ci && npm run dev`。手机与电脑同网，在手机访问Vite输出的局域网URL（本地HTTP开发预览不提供PWA缓存）；离线验收使用HTTPS staging或`npm run build && npm run preview`的localhost构建版。真机最终验收由用户安排。
