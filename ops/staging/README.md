# 腾讯云 staging 发布

入口：`https://ruankao.staging.haaboo.com`。项目 slug `ruankao`，Compose project
`ruankao-staging`，独立网络 `ruankao-staging_edge`，Web alias
`ruankao-staging-web:8080`。发布根目录 `/opt/azao-staging/projects/ruankao/`。
应用为无账号静态 PWA，学习数据保存在用户浏览器，服务器不保存学习记录。

先读取共享服务器的新项目部署手册，检查服务器、DNS、已有入口和资源。
所有构建在本机或 CI 完成。Docker 镜像只含 `dist/` 和静态服务配置，
不包含原始 Office/PDF、源码、Node、账号凭据或本机依赖。

```bash
bash ops/staging/bundle.sh
bundle_dir=$(cat tmp/staging/latest-bundle-path)
release_id=$(basename "$bundle_dir")
ssh azao-staging-tencent "mkdir -p '/opt/azao-staging/projects/ruankao/releases/$release_id'; chmod 700 '/opt/azao-staging/projects/ruankao/releases/$release_id'"
scp "$bundle_dir"/* "azao-staging-tencent:/opt/azao-staging/projects/ruankao/releases/$release_id/"
ssh azao-staging-tencent "cd '/opt/azao-staging/projects/ruankao/releases/$release_id' && bash activate-web.sh"
```

`bundle.sh`使用显式源码清单创建独立快照，执行锁文件安装、单元测试、
资料校验和生产构建，再打包 `linux/amd64` 镜像。发布身份由源码归档
SHA-256、镜像 ID 和 release ID 确定；同时记录原仓库 base commit。
当前工作区未提交，不能把 base commit 当作应用源码版本。本脚本不会提交或推送。

首次接入前，核对 `Caddyfile.proxy-site` 及已有完整代理配置。
部署授权必须覆盖共享代理短暂重启；`connect-proxy.sh`追加完整独立站点，
备份并验证配置、检查当前文件未被并发修改、原位写入并核对 bind mount
哈希后，定向重启同一代理容器。已有入口检查失败时恢复原配置。

```bash
ssh azao-staging-tencent "cd '/opt/azao-staging/projects/ruankao/releases/$release_id' && bash connect-proxy.sh"
source_dir=$(cat tmp/staging/latest-source-path)
cd "$source_dir"
STAGING_BASE_URL=https://ruankao.staging.haaboo.com npx playwright test --config playwright.staging.config.ts
```

完成 HTTPS、所有页面、资源/MIME/缓存、真实 Service Worker 断网重开、
备份恢复和既有入口回归后，把项目 `current` 链接指向验证通过的 release，
记录镜像 ID、源码哈希、测试结果、完整代理备份及网络连接。失败时不要更新链接。

首次发布没有旧应用版本，撤销入口使用本次完整代理备份，再定向停止本项目 Web。
后续应用回滚：从 `previous-release.txt` 找到旧 release，在旧目录执行
`activate-web.sh`并验证，再恢复 `current`。不使用全局清理或 `down -v`。
当前及至少两个最近版本保留。用户数据不随发布覆盖，但域名改变需要用户导出/恢复 JSON。

代理网络连接在同一容器 restart 后保留；代理重建时需要由其维护者在正式
Compose 配置中加入此网络，或按发布记录恢复连接。普通应用更新无需重启代理。
