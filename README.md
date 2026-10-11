# 软考冲刺 · 系统分析师

移动端优先、知识点掌握驱动的 React + TypeScript + Vite H5/PWA。阶段 A—D 的功能已在当前工作区实现；实际验收见 `docs/stage-a.md` 至 `docs/stage-d.md`。第一版没有应用账号、后端或云同步，用户数据保存于本设备 IndexedDB。

## 本地运行

Node.js 22.12+，本次运行环境24.20.0。

```sh
npm install
npm run dev
```

打开终端显示的 Local 地址，通常为 `http://localhost:5173`。学习资料已导入，不需要在H5上传Excel。固定依赖可用 `npm ci`。

```sh
npm run data:import              # 从原始Excel/Word重新导入
npm run data:check               # 原文、来源指纹、数量及生成文件一致性
npm run test                    # 内容、状态机、计划、评分、存储升级和备份测试
npx playwright install chromium # 首次浏览器测试前安装
npm run test:e2e                # 手机学习、75题模考、案例、论文及四种宽度
npm run build                   # data:check → TypeScript → Vite → Service Worker
npm run test:pwa                # 重新构建并验证真实Service Worker断网和备份流程
npm run preview -- --port 4174   # 本机生产预览，http://localhost:4174
```

生产产物为 `dist/`。构建遇到缺字段、重复ID、混卷、非法答案、错误采分或生成文件与原文不一致时阻断。不要修改JSON绕过导入校验；从原资料修改并重新运行导入。

## 手机使用

电脑和手机连接同一Wi-Fi，运行 `npm run dev` 后，手机打开终端的 Network 地址，例如 `http://192.168.x.x:5173`。开发服务已监听 `0.0.0.0`；访问失败时检查防火墙和无线隔离。

局域网HTTP适合检查界面和本设备保存；正式安装与离线缓存需要HTTPS部署地址。构建版的本机localhost也可测试Service Worker。

正式HTTPS地址首次打开需联网，等待页底“全部核心资料已缓存”。Android支持的浏览器可选择安装，iPhone使用Safari分享菜单“添加到主屏幕”。之后可断网打开知识、章节题、完整模考、案例、论文和进度页。系统安装行为、软键盘、安全区和浏览器存储回收仍需真机验收；本次使用375px自动化及320/375/390/430px视口，没有声称做过实体手机安装。

## 学习流程

- 默认启动日2026-10-11，可在“我的”修改并保留记录。D1—D5按15/15/15/15/16首轮通关，D6整卷模考，D7复习及论文修订。
- 到期复习优先，欠账自动顺延，提前通关减少后续任务。首页分别显示原计划、新增、欠账、首轮与巩固指标，可手动重排单卡日期。
- 阅读不算掌握。先闭卷写要点，再对照自检；有可信章节关联时还需答对一道关联题。首轮通过满24小时后成功闭卷复测才巩固；复测或关联题失败需要复习。
- 章节题提交后显示解析；独立75题模考整卷提交后才显示答案与成绩，未答计0分，不伪造作答记录。支持退出续考、题号导航、收藏与错题二刷。
- 案例三问先作答，再按原文完整采分组自评，显示漏分项并保存多次历史。论文共享真实项目素材库，支持提纲、正文、自查、复制与TXT/Markdown导出。
- 完整模考按75单选→任选3案例→1论文进行，已完成场次的论文快照保留。论文完成由本人确认与六项自查决定，系统不自动评阅技术质量、不预测官方分数。
- 字数为不含空白的Unicode字符数，正式字数与考试时长以当次题目/机考界面为准。倒计时150分钟是附件提供的训练参考。

## 全量备份与数据限制

“我的”→“导出完整 JSON 备份”。备份包括全部12类数据：计划设置、掌握状态、闭卷尝试、选择尝试、自测草稿、未交试卷、收藏、案例草稿/历史、论文、项目素材和完整模考快照。记录保留原始时间戳与提交序号；静态题库不混入用户状态。

恢复先检查schemaVersion、字段、ID引用和成绩一致性，再显示数量预览，二次确认后整体替换当前数据；建议先导出当前数据。损坏文件不改动已有记录；写入中途失败回滚整个事务。重置也需二次确认。内容版本不同但稳定ID仍可用时保留历史作答判断，使用当前资料文字；未知ID、未来数据库版本或异常采分不接受。

每个浏览器、设备、协议和域名分别保存记录，localhost与局域网IP也不共享进度。换设备/域名需手动导出导入。隐私浏览、卸载、浏览器清理、系统回收可能删除本地数据；持久存储申请不能替代备份。外部资料链接和原始Office/PDF文件不属于离线应用缓存。首次缓存完成前不能保证离线可用。

## 真实资料与导入审计

完整读取9个Excel工作表、Word全部489段、PDF全部16页。权威顺序按开发说明为Excel→Word，PDF用于交叉核对。旧按小时计划、Excel旧答题与状态未导入。

实际导入76卡（A57/B19）、150单选（章节75/独立模考75）、9案例（27分问及原文25分采分组）、10论文专题、11资料来源。学习内容均来自附件；单选和案例标为“原创模拟”，不伪装成官方真题。

XLSX带命名空间前缀，ExcelJS实际无法读入，因此用`fflate + fast-xml-parser`按OOXML关系、共享字符串与单元格地址读取。Word按文档顺序解析，包含表内段落；`sourceRef.textBlock`保留原始段落位置，空段计入。完整来源与抽查见 [`content-import-report.md`](content-import-report.md)。原始附件未修改。

知识题关联先产生关键词候选再逐题核对：47卡有可信章节题，29卡只做自评并明确标注。模考关联只用于交卷后复习，不进入日常知识卡。RK057保留原题，通过引用RK046补齐“同一情形”的原始数值。全部内容以React文本渲染，不执行资料HTML。源链接和预设考试窗口来自附件，未重新核验最新官方公告。

独立审计（非运行前置依赖）：

```sh
python3 -m pip install openpyxl pypdf
python3 scripts/audit-content.py
```

2551项原文字段核对已通过。导入生成`src/data/*.json`及内容报告，`contentVersion`和稳定ID与用户状态分开维护。

## 截图与验证

手机截图来自实际运行交互（测试草稿注明为验收输入）：

- [今日任务](docs/screenshots/final-today.png)
- [知识通关](docs/screenshots/final-knowledge.png)
- [案例自評](docs/screenshots/final-case.png)
- [论文编辑器](docs/screenshots/final-essay.png)
- [整卷模考成绩](docs/screenshots/final-mock.png)

阶段说明列出实际测试及验证范围，不把浏览器仿真等同于真机验收。测试涉及全量数据合同、日期边界、24小时状态机、动态计划、全部75题整卷流程、案例采分、数据库v1→v2、备份全部数据往返和失败回滚，以及生产Service Worker断网重开。

## 部署

第二轮已修复响应式日期/复习时钟和重复模考答案隔离，见[第二轮验收](docs/round2-report.md)。新场区分首次独立模考与同卷复练，旧记录不补造分类。[知识验证 v2 方案](docs/knowledge-validation-v2.md)包含显式 checkpoints、三项指标、内容包规范和考场仿真设计，尚未接入应用，不包含新题库。

上线功能审计见 [audit-report.md](audit-report.md)，包括 P0 题卡关联整改、内容来源、逐项验收、实际失败日志和手机视口截图。复现审计：

```sh
npm run build
npx playwright test --config playwright.audit.config.ts
AUDIT_BASE_URL=https://ruankao.staging.haaboo.com AUDIT_EVIDENCE_DIR=docs/audit/recheck npx playwright test --config playwright.audit.config.ts
```

专项审计保留未整改 P1 的失败断言；完整结果和退出码以审计报告为准。普通单元及原有流程回归仍分别使用 `npm run test`、`npm run test:e2e` 和 `npm run test:pwa`。

腾讯云 staging 已上线：<https://ruankao.staging.haaboo.com/>。实际发布身份、测试和回滚记录见 [staging 发布记录](docs/staging-deployment.md)，后续更新步骤见 [staging 操作说明](ops/staging/README.md)。

Sites私有预览的最终结果见 `docs/deployment.md`。私有托管入口需要当前所有者的ChatGPT登录；应用本身没有账号系统。Sites同步使用独立发布副本，不改动工作区现有GitHub远端或推送该远端。

Vercel：导入仓库，构建`npm run build`，输出`dist`。项目包含`vercel.json`的SPA路由回退及Service Worker不缓存响应头。

Netlify：导入仓库，配置由`netlify.toml`提供，构建同上；`public/_redirects`保留深层路由，`public/_headers`允许检查Service Worker更新。也可将构建后的`dist`上传至支持HTTPS与SPA回退的静态托管。

GitHub Pages：项目子目录必须设置base，使用HashRouter避免静态站点深层路径404：

```sh
BASE_PATH=/xitongfenxishi/ VITE_ROUTER_MODE=hash npm run build
```

将`dist`通过GitHub Pages Actions发布；仓库Settings→Pages选择GitHub Actions。可复制 `docs/github-pages.yml` 到 `.github/workflows/deploy-pages.yml`，手动运行；仓库名不同则调整BASE_PATH。根域名部署使用`BASE_PATH=/`。GitHub/Vercel/Netlify的配置已提供，本次没有执行这些平台的发布。

部署与插件配置参考：[Vite静态部署](https://vite.dev/guide/static-deploy.html)、[Vite PWA React](https://vite-pwa-org.netlify.app/frameworks/react)、[Rolldown代码分块](https://rolldown.rs/reference/OutputOptions.codeSplitting)。样式采用原生响应式CSS，以当前页面规模避免额外Tailwind构建配置。生产缓存使用更新提示，等待草稿“已保存”后再更新，已有IndexedDB记录保留。
