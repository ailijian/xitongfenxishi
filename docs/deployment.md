# 部署说明

当前工作区是完整源代码，原有GitHub远端仍为`https://github.com/ailijian/xitongfenxishi.git`。未向该远端推送，也未修改其部署设置。

本次使用Sites插件登记私有站点：

- project_id：`appgprj_6acb03edea588191b293111a12c595f3`
- 私有地址：<https://ruankao-system-analyst-20261011-lijian.mightylynx8.chatgpt.site>
- 地址是否已上线以本地`deployment-result.json`中的终态验证为准；登记地址本身不是上线证明。
- 托管入口需要当前所有者的ChatGPT登录。应用学习数据仍只写本设备IndexedDB，不向Sites服务器保存进度。

发布源在被忽略的`tmp/site-deploy/`独立副本中准备；Sites官方source helper同步该副本、构建与打包。工作区Git历史及GitHub远端不参与此次源同步。`.openai/hosting.json`保留站点身份，后续必须复用该project_id。

静态产物为`dist/`，全部学习内容已编入应用资源，原始Office/PDF文件不进入公开静态目录。发布包携带同一源版本的Service Worker、manifest和静态资源。新站点保持私有访问，未请求改变分享范围。

本地、局域网IP和托管域名是不同origin，IndexedDB不会自动迁移。上线后在“我的”导出旧origin的JSON，再在新域名恢复。请勿用改域名代替备份。

另外提供Vercel/Netlify配置和GitHub Pages手动部署模板，具体操作见工作区README。这三个平台没有在本次任务中发布，不把配置文件当作已上线证明。
