# 全76课验收实际命令

运行目录为本仓库；日志均位于 `docs/full-course/logs/`。下列本地全量命令在最终页面实现上实际执行，结果见 `test-results.json` 和对应 `final-*.log`。不是只列出建议命令。

```bash
npm run test
npx tsc --noEmit
npm run build
npm run test:e2e -- --workers=1
BEGINNER_EVIDENCE_DIR=tmp/full-course/d1-regression BEGINNER_SCREENSHOTS=tmp/full-course/d1-regression/screenshots UI_SCREENSHOTS=tmp/full-course/ui-regression npm run test:beginner
FULL_COURSE_EVIDENCE=tmp/full-course/final FULL_COURSE_SCREENSHOTS=docs/full-course/screenshots npm run test:full-course
AUDIT_EVIDENCE_DIR=tmp/full-course/audit AUDIT_SCREENSHOTS=tmp/full-course/audit/screenshots ROUND2_SCREENSHOTS=tmp/full-course/audit/round2 npx playwright test --config playwright.audit.config.ts
npx playwright test --config playwright.production.config.ts
npx tsx scripts/check-full-course.ts --source --preserved --write-report
npx tsx scripts/check-beginner-content.ts --source
node scripts/render-expanded-diagrams.mjs --verify
node scripts/check-rendered-diagram-layout.mjs
```

`test:pwa`中的构建和两项production测试均执行；为避免两套浏览器并行期间改写dist，先完成生产构建，再执行production配置。WebKit 8项包含在36项原课程回归和95项新课程专项中。PWA除原2项外，新专项还断网关闭再打开，逐一核验76课、41图与19辅导。

五批局部验收采用同一full-course配置，按当批ID筛选；真实命令保留在 `batch-d2.md` 至 `batch-coaching.md`。初次失败、诊断与修复日志保留，不用最终通过日志覆盖：

- `d5-browser-initial.log`：K072标题与步骤标题同名导致测试定位不唯一，改为步骤区域定位，保留原内容断言。
- `final-beginner-initial.log`：进度页IndexedDB加载尚未完成即读取按钮几何，增加可见性等待，原按钮对齐/点击区域断言不变；聚焦和36项完整回归通过。
- `diagram-layout-initial.log` / `diagram-layout.log`：诊断工具依赖已退出的preview及直接SVG截图超时，改为独立只读SVG服务，移除诊断截图；33图文字边界全部检查通过，真实H5手机截图另有专项测试。
- `focused-coach-links.log`：视觉复核后关联课程链接每行一条的19项专项结果；其后完整回归仍重新执行。
- `pre-links-final-*.log`：链接视觉修正前的第一轮全量结果，仅供追溯；最终结果以 `final-*.log` 为准。

## 发布验收

旧线上版本先执行 `npx tsx scripts/audit-full-course-upgrade.ts seed`。独立持久化测试profile中的12类表均非空，`pre-release-backup.json`只含自动化生成的测试数据。

发布完成后执行 `npx tsx scripts/audit-full-course-upgrade.ts verify`，检查旧Service Worker提示手动升级、12类数据逐字段保留、闭卷草稿继续、清空恢复及失败导入不改动；不得重新seed以掩盖升级问题。

部署构建使用 `bash ops/staging/bundle.sh`，隔离源码目录再次npm ci、75单元与生产构建，仅发布本项目静态Web镜像。候选源码与提交逐文件比对；线上定向执行重点课程、WebKit、辅导、PWA、托管及58资源字节比对。实际发布命令与结果在上线后附到本文件。
