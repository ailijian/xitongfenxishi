# 按钮对齐与组件规范化验收 · 2026-10-11

基线 `a22e300`，修复提交 `1d6b3d10df836bd027bf0829f6734885a2ac62e2`。修复范围为现有界面布局和点击区域，原始资料、内容 ID、学习判定、IndexedDB 结构及备份格式均未修改。

## 问题与处理

| 检查项 | 结果 | 证据与处理 |
| --- | --- | --- |
| “看全部”与“懂了，下一步”错位 | PASS | 原 `.primary` 的 `14px / 4px` 上下外边距叠加按钮组拉伸；390px 下实测顶部相差14px、高度相差18px。按钮组统一清零子控件外边距，同排按钮等高、居中，修复后边缘差小于1px。 |
| 中间步骤三个按钮挤压 | PASS | 改为可换行的120px基础宽度。手机呈现两列与下一行“看全部”，320px 主按钮文字也有足够空间；桌面可容纳三列。首步、末步、全部/逐步切换均测量。 |
| 设置页任务操作贴合 | PASS | 两个任务操作使用统一按钮组，10px间距，自然换行。 |
| 备份恢复、重置和交卷确认间距 | PASS | 确认操作使用纵向等宽按钮组，保留二次确认、禁用及取消逻辑。取消备份恢复/重置前后JSON的12类数据一致；取消交卷保留答案并继续锁定解析。 |
| 案例保存/新作答、论文导出 | PASS | 案例操作加入统一按钮组；论文现有按钮组继承统一对齐和换行规则。 |
| 模考入口、继续课程等文字链接 | PASS | 操作链接有48px高点击区域、明确链接样式，修复原模考入口仅22px高的问题。 |
| 单选选项、筛选输入、复选标签、折叠区域、题号导航、底部导航 | PASS | 320/375/390/430px无整页横向溢出，实际可见控件点击区域不小于44px。复选框图标22px，由大于48px的整个标签提供点击区域。75个题号按钮保留。 |
| 暗色外观、键盘焦点、WebKit手机布局 | PASS | 760px暗色外观Tab/Shift+Tab可见焦点与Enter操作；WebKit375/390px步骤布局与课程交互通过。 |
| 内容、学习状态与答案门禁回归 | PASS | 原16个核心内容/存储/掌握/时钟/来源文件字节一致；15课、30题、8图及原76卡/150题校验通过；12类记录与JSON恢复、离线关闭重开、模考门禁回归通过。 |
| 实体iPhone软键盘与安装 | NOT TESTED | 本次使用Chromium/WebKit自动化移动视口；实体iPhone验收沿用用户安排。 |

## 修改文件

- `src/styles.css`：合并重复按钮组规则，统一尺寸、对齐、间距和换行，补齐操作链接点击区域。
- `src/components/BackupPanel.tsx`：恢复、重置操作区布局。
- `src/components/PWAStatus.tsx`：更新/稍后更新按钮组布局。
- `src/pages/MockPage.tsx`：交卷确认按钮组布局。
- `src/pages/ProgressPage.tsx`：任务设置操作组布局。
- `src/pages/TrainingPages.tsx`：案例保存/新作答操作组布局。
- `tests/beginner/layout-helpers.ts`、`layout.spec.ts`、`webkit.spec.ts`：新增11项布局/交互回归测试。

## 实际验证

| 命令 | 实际结果 | 日志 |
| --- | --- | --- |
| `npm run build` | PASS：原资料、课程完整性、TypeScript、Vite、PWA生产构建 | [build.log](ui-polish/logs/build.log) |
| `npx tsc --noEmit` | PASS：最终测试代码类型检查 | [typecheck.log](ui-polish/logs/typecheck.log) |
| `node scripts/check-beginner-preservation.mjs` | PASS：16个核心文件字节一致 | [content-preservation.log](ui-polish/logs/content-preservation.log) |
| `npm test` | 63 / 63 PASS | [unit.log](ui-polish/logs/unit.log) |
| `npm run test:e2e -- --workers=1` | 14 / 14 PASS | [e2e.log](ui-polish/logs/e2e.log) |
| `npx playwright test --config playwright.production.config.ts` | 2 / 2 PASS：离线、备份恢复 | [pwa.log](ui-polish/logs/pwa.log) |
| `BEGINNER_EVIDENCE_DIR=tmp/ui-polish/full BEGINNER_SCREENSHOTS=tmp/ui-polish/course-screenshots UI_SCREENSHOTS=docs/ui-polish/screenshots npm run test:beginner` | 36 / 36 PASS：原25项＋新增11项 | [beginner-full.log](ui-polish/logs/beginner-full.log)、[机器结果](ui-polish/browser-results.json) |

修复前实测与原CSS复现：[测量数据](ui-polish/baseline-layout.json)、[14px错位日志](ui-polish/logs/baseline-regression-failure.log)。初次新增测试有案例未填写答案、程序焦点未切入键盘模式等测试准备问题，期间一次页面加载未成功；保留[初次日志](ui-polish/logs/initial-layout-failures.log)和[键盘测试修正日志](ui-polish/logs/keyboard-test-correction.log)。补齐独立作答、使用真实Tab导航并等待构建完成后执行全套36项，全部通过，未削弱断言或变更业务门禁。

## 手机截图

| 页面 | 修复前 | 修复后 |
| --- | --- | --- |
| K001首步 · 390px | [原布局](ui-polish/screenshots/before-K001-390-step1.png) | [新布局](ui-polish/screenshots/after-K001-390-chromium-step1.png) |
| K001中间步 · 390px | [原布局](ui-polish/screenshots/before-K001-390-step2.png) | [新布局](ui-polish/screenshots/after-K001-390-chromium-step2.png) |
| K001中间步 · 375px | [原布局](ui-polish/screenshots/before-K001-375-step2.png) | [新布局](ui-polish/screenshots/after-K001-375-chromium-step2.png) |
| 任务设置 · 390px | [原布局](ui-polish/screenshots/before-plan-390.png) | [新布局](ui-polish/screenshots/after-plan-390.png) |
| 重置确认 · 390px | [原布局](ui-polish/screenshots/before-reset-390.png) | [新布局](ui-polish/screenshots/after-reset-390.png) |

补充：[WebKit390px](ui-polish/screenshots/after-K001-390-webkit-step2.png)、[案例](ui-polish/screenshots/after-case-375.png)、[论文](ui-polish/screenshots/after-essay-375.png)。原验收截图保留，本轮证据独立存放。

## Staging发布

已发布到 <https://ruankao.staging.haaboo.com/>，GitHub代码提交：[1d6b3d1](https://github.com/ailijian/xitongfenxishi/commit/1d6b3d10df836bd027bf0829f6734885a2ac62e2)。

- release / current：`staging-20261011T132846Z-cc902d4a6375`。
- 镜像：`sha256:660bddf4e2baa7e14a44e696a6c25f6cddb7093f21d80dcd2854bafc7db305ab`，`linux/amd64`，容器healthy。
- 所有构建在本机隔离目录完成，锁文件重新安装、63单元及生产构建通过；源码候选与Git提交逐文件核对。发布包9项SHA校验通过，仅更新`ruankao-staging`的Web服务。
- HTTPS上的11项新增布局/取消回归和3项托管检查全部PASS，线上25项资源字节与候选dist完全一致。
- 其他15个容器及共享代理的ID/启动时间保持一致，4个已有HTTPS入口发布前后均200。
- 回滚目录：`/opt/azao-staging/projects/ruankao/releases/staging-20261011T124350Z-4bf2db1dc3be`；在旧目录执行原`activate-web.sh`并验收，再恢复current。保留旧版本，不涉及学习数据迁移。

实际线上命令：

```bash
BEGINNER_BASE_URL=https://ruankao.staging.haaboo.com BEGINNER_EVIDENCE_DIR=tmp/ui-polish/staging UI_SCREENSHOTS=docs/ui-polish/screenshots/staging npx playwright test --config playwright.beginner.config.ts layout.spec.ts webkit.spec.ts --grep '按钮|全站|暗色'
STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts tests/staging/hosting.spec.ts
```

证据：[发布构建](ui-polish/logs/release-build.log)、[上传/校验/激活](ui-polish/logs/deploy.log)、[发布身份](ui-polish/release-manifest.txt)、[候选源码核对](ui-polish/candidate-source-check.json)、[线上布局日志](ui-polish/logs/staging-layout.log)、[11项机器结果](ui-polish/staging-browser-results.json)、[托管日志](ui-polish/logs/staging-hosting.log)、[3项机器结果](ui-polish/staging-hosting-results.json)、[25资源核对](ui-polish/served-artifacts.json)、[服务器隔离](ui-polish/server-isolation.json)、[current](ui-polish/logs/current-release.log)。

实际线上手机截图：[K001首步390px](ui-polish/screenshots/staging/after-K001-390-chromium-step1.png)、[K001中间步390px](ui-polish/screenshots/staging/after-K001-390-chromium-step2.png)、[WebKit375px](ui-polish/screenshots/staging/after-K001-375-webkit-step2.png)、[任务设置](ui-polish/screenshots/staging/after-plan-390.png)、[重置确认](ui-polish/screenshots/staging/after-reset-390.png)。旧PWA若仍显示旧布局，请等输入保存后使用“更新并重新载入”。
