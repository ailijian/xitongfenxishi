# Staging 发布记录 · 2026-10-11

已上线：<https://ruankao.staging.haaboo.com/>。这是无账号的静态 H5/PWA；
用户进度、错题和草稿保存在当前浏览器 IndexedDB，服务器不保存学习数据。

## 当前发布：按钮对齐与组件规范化

正式 release `staging-20261011T132846Z-cc902d4a6375`，代码提交 `1d6b3d10df836bd027bf0829f6734885a2ac62e2`。知识课程的“看全部”与“懂了，下一步”已等高对齐，统一按钮组间距、窄屏换行，完善任务设置、案例操作、备份/交卷/PWA确认区和操作链接的点击区域。原内容、学习判定、数据库及备份格式不变。

本地63单元、14流程、36课程与布局（原25＋新增11）、2 PWA通过；线上11布局与3托管测试通过，25资源与候选dist字节一致。只更新本项目Web，其他15个容器和共享代理的ID/启动时间保持一致，已有入口均200。current指向 `/opt/azao-staging/projects/ruankao/releases/staging-20261011T132846Z-cc902d4a6375`。回滚版本为下方零基础课程版本。文件清单、实际日志、新旧手机截图和发布身份见[本轮验收](ui-polish-report.md)。

## 零基础第1天课程升级（历史）

正式 release `staging-20261011T124350Z-4bf2db1dc3be`，代码提交 `5612c321d2cc1de9103be98c062a42fd5e4b7645`。15课、30道原创理解题和8张概念图均已真实接入，K001默认展示通俗解释与医院预约案例，原速记折叠保留；理解题不进入原题库或掌握统计。

本地63单元、14流程、20审计、2 PWA及25课程测试通过。线上25课程（包含WebKit手机）、3托管、25资源字节核对、真实旧PWA升级与12类记录清空恢复通过。其他15个容器ID/启动时间和共享代理均保持一致。当前版本、备份格式及原学习历史未改变，实体iPhone由用户最终验收。

该轮发布时current指向 `/opt/azao-staging/projects/ruankao/releases/staging-20261011T124350Z-4bf2db1dc3be`。完整内容检查、新旧截图、实际命令、日志和回滚见[零基础课程验收报告](beginner-course-integration-report.md)，机器结果见 `beginner-course/deployment-result.json`。下面保留各轮历史发布记录。

## 第二轮 P1 整改（历史）

正式 release `staging-20261011T102610Z-ca1338b7ed8b`，代码提交 `4ff9a28899ace2a66203a9c9e557a6bedcbc4dfa`。两个 P1 已修复；56 单元、14 原流程、2 PWA、20 线上专项和3托管检查通过。真实旧 PWA 升级、旧备份清空恢复的12类记录逐字段一致。仅更新本项目 Web，共享代理没有重启。

该轮身份、完整测试命令、新旧手机截图、文件清单和边界见[第二轮验收](round2-report.md)。发布时 current 指向 `/opt/azao-staging/projects/ruankao/releases/staging-20261011T102610Z-ca1338b7ed8b`，上轮 release 继续保留。contentVersion、IndexedDB version、备份版本分别保持 `2026.10.11.1` /2 /2，原学习记录未补写；新 session 的可选 mockKind 字段需该轮或新客户端读取。

第二阶段 checkpoints 与三个独立指标暂以[方案](knowledge-validation-v2.md)交付，尚未接入运行应用。未生成或发布新题库，考场模式仍使用现有自由训练；实体 iPhone 验收仍 NOT TESTED。

## 上一轮发布：P0 审计整改（历史）

2026-10-11 已更新为内容版本 `2026.10.11.1`，修复 5 组偏宽题卡关联；原始资料与用户记录保持完整。详细验收、失败日志和手机截图见 [audit-report.md](../audit-report.md)。

| 项目 | 当前值 |
| --- | --- |
| release | `staging-20261011T093420Z-497df7be0303` |
| 修复提交 | `09dc54b06bae6fb2c7ce65546c284cb9ab357eac` |
| 源码快照 SHA-256 | `497df7be03032b1b9dd79b0dcacca8fdc180ca4486ff089f4365d3d7f13cfd6f` |
| 镜像 ID | `sha256:cf78da5d37eb995c56fb4328e639ba94f518c63f3c18ffa973589587b92721e4` |
| current 链接 | `/opt/azao-staging/projects/ruankao/releases/staging-20261011T093420Z-497df7be0303` |
| 最终线上专项审计 | 17 项：15 PASS / 2 FAIL；跨午夜停留刷新、重复卷答案隔离两项 P1 未整改 |
| 其他验证 | 49 单元、14 原有流程、2 PWA、3 线上托管检查全部通过；17 个线上资源与构建逐字节相同 |
| 用户数据升级 | 真实旧 profile 经 PWA 更新，12 类数据逐字段一致；无需清空浏览器数据 |

当前发布包为显式工作区快照，包含当时 README 的未提交文档变更；完整身份以归档 SHA-256 与 [manifest](audit/final/release-manifest.txt) 为准。本次仅更新本项目 Web 容器，没有重启共享代理；原 release 保留供回滚。实体 iPhone 验收仍为 NOT TESTED。

下文是首次发布的历史记录，不代表最新审计结论。其机器记录和截图仍保留；本次结果见 [最终服务器状态](audit/final/server-state.json)、[线上专项结果](audit/final/staging/browser-results.json)。

## 首次发布身份（历史）

| 项目 | 实际值 |
| --- | --- |
| release | `staging-20261011T041333Z-a7b9ec9f3fb6` |
| 源码快照 SHA-256 | `a7b9ec9f3fb65fb03c62e251fb6aaafc5d0f44eb189f2c428d97d14465f44433` |
| 镜像 | `ruankao-web:staging-20261011T041333Z-a7b9ec9f3fb6`，`linux/amd64` |
| 镜像 ID | `sha256:59f9c85883b60c0781d21176e11fd1a2749b912aa38d305e777437375795265e` |
| Compose project | `ruankao-staging` |
| 当前发布链接 | `/opt/azao-staging/projects/ruankao/current` |
| 实际发布目录 | `/opt/azao-staging/projects/ruankao/releases/staging-20261011T041333Z-a7b9ec9f3fb6` |
| Web alias / 网络 | `ruankao-staging-web:8080` / `ruankao-staging_edge` |

源代码使用显式清单复制到独立目录并以归档 SHA-256 固定，未提交或推送原仓库。
原 Git HEAD `1a3ffc111a67a2eb699fb51280c367292b91c3a2` 仅为 base commit，
不能视为应用源版本。部署前比对 73 个代码、配置及资料文件，无差异。
全部构建在本机完成；镜像只包含网页产物和静态服务配置。服务器上传包全部校验通过。

## 首次发布实际验证（历史）

| 检查 | 结果 |
| --- | --- |
| 资料及生产构建 | 76 知识点、150 单选、9 案例、10 论文；TypeScript 与构建通过 |
| 单元测试 | 45 / 45 通过 |
| 本地生产容器 | 5 / 5 通过，含离线重开、作答写作及备份恢复 |
| 真实 HTTPS 浏览器测试 | 19 / 19 通过，含 75 题整卷、三案例和论文完整模考流程 |
| 移动视口 | 320 / 375 / 390 / 430px，8 个关键页面无整页横向滚动 |
| 路由及资源 | 深层路径刷新成功；JS/CSS MIME 正确；缺失资源真实返回 404 |
| 缓存 | 首页、SW、manifest 为 `no-cache`；带哈希资源为一年 `immutable` |
| PWA | 预缓存 21 项、735.94 KiB；真实域名断网关页重开通过 |
| HTTPS | Let’s Encrypt YE2；客户端证书验证通过；HTTP 308 跳转 HTTPS |
| 容器健康和隔离 | healthy；非 root `10001:10001`、只读根文件系统、无公网端口映射 |
| 资源 | 限制 128 MiB / 0.5 CPU；验收时约 18.68 MiB 内存 |
| 既有入口 | 主站、`/judgment/`、`/api/judgment/bootstrap` 部署前后均 200 |

机器记录：`staging-deployment-result.json`、`staging-server-state.json`。
详细浏览器结果：`staging-browser-tests.json`、`staging-local-tests.json`。
线上截图：`screenshots/staging-today.png`、`screenshots/staging-knowledge.png`。

## 首次发布共享代理及回滚（历史）

本次只在原完整 Caddyfile 后追加独立域名站点；原有规则保持逐字一致。
候选配置及实际挂载配置校验通过，宿主机和容器哈希一致后重启同一代理容器。
代理配置实际来源：
`/opt/azao-staging/releases/20260829-v3-d10-ee7987c-af0155c/staging/Caddyfile`。

本次完整回滚备份：
`/opt/azao-staging/projects/ruankao/shared/proxy-backups/Caddyfile.20261011T042113Z.before`。
原配置 SHA-256：`18b1edfb0db4cc06735c65f66a171252b9119ecca15c197322a1050e12d8fd4b`。
上线配置 SHA-256：`272dfbf8d0246514ce0a13e12fb080d8185e434d2093e23bd40e2aeab2f00c7d`。

首次发布没有旧应用版本。撤销本次上线需恢复经过核对的完整代理配置，
原位写入保留 bind mount inode，校验后定向重启代理并检查既有入口，
再定向停止本项目 Web。若之后已有其他项目修改共享配置，应在最新完整
配置中撤销本站规则，不能直接用旧备份覆盖后续变更。

已将共享代理连接到 `ruankao-staging_edge`；此连接在同一容器 restart 后保留，
代理重新创建前必须由维护者把网络纳入正式 Compose 配置，或按记录恢复连接。
后续应用更新使用同一 project 和 alias，无需重启共享代理。
构建、上传及更新步骤见 `../ops/staging/README.md`（仓库内实际路径为 `ops/staging/README.md`）。

## 手机使用和数据迁移

手机打开 HTTPS 地址，等待“全部核心资料已缓存”。Android 在浏览器安装菜单
安装；iPhone 使用 Safari 分享菜单“添加到主屏幕”。本次验证使用浏览器移动视口，
未进行实体手机安装、软键盘及系统存储回收验收。

旧 Sites 域名、本地地址和新 staging 域名拥有独立 IndexedDB。
在旧地址“我的”导出完整 JSON 备份，再到新地址“我的”校验并恢复。
应用无账号或云同步，不会自动迁移或同步记录。
