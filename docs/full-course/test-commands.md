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

部署构建使用 `bash ops/staging/bundle.sh`，隔离源码目录再次npm ci、75单元与生产构建，仅发布本项目静态Web镜像。候选源码与提交逐文件比对；线上定向执行重点课程、WebKit、辅导、PWA、托管及58资源字节比对。实际发布命令与结果见下方。


## 已实际执行的线上命令

独立候选目录为 `tmp/staging/candidate-20261011T164428Z/source`，其dist与实际Docker镜像一致；线上命令在该目录执行，证据输出到本仓库绝对路径，以免覆盖历史验收。

```bash
FULL_COURSE_BASE_URL=https://ruankao.staging.haaboo.com FULL_COURSE_EVIDENCE=/Users/lijian/Documents/projects/xitongfenxishi/docs/full-course/staging FULL_COURSE_SCREENSHOTS=/Users/lijian/Documents/projects/xitongfenxishi/docs/full-course/screenshots/staging npm run test:full-course -- --grep 'WebKit|实际截图|辅导不溢出|全部76|PWA首次联网|C09 原题|E02 写作|K037 SQL复制'
STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts tests/staging/hosting.spec.ts
AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=/Users/lijian/Documents/projects/xitongfenxishi/docs/full-course/staging-assets npx playwright test --config playwright.audit.config.ts tests/audit/mobile-offline.spec.ts --grep '线上资源版本'
```

结果分别13、3、1通过，共17项；`staging-course.log`、`staging-hosting.log`、`staging-assets.log`及对应JSON包含真实输出。旧profile的verify在主仓库执行，退出码0，12表逐字段一致，见 `staging-upgrade.log`。`staging-bundle.log`及`staging-activation.log`记录生产构建、SHA校验与仅本项目Web的no-deps更新；`staging-current.log`记录检查通过后正式current与previous。

源码/配置diff检查通过；保留的原始构建与单元日志含工具输出的行末空格/末尾空行，未为消除日志空白警告改写原证据。
