# D5 集成验收

PASS：16课、32道原创理解题、11个新图示。累计全部76课/152教学题/41图。

- Mermaid实际渲染11/11，K060 CAP分区与K068 Agent服务端权限门禁完整，无源语法修改。
- `npm run test`：71/71；`npm run build`：通过。
- `COURSE_DAY=5 FULL_COURSE_EVIDENCE=tmp/full-course/d5 npm run test:full-course -- course.spec.ts`：最终20/20。
- 初次19通过/1失败：K072课程步骤标题“关键路径”与页面h1同名，测试定位器产生歧义。限定到课程步骤内后，保留焦点断言并全批重跑20通过。初次失败原日志为 `logs/d5-browser-initial.log`。
- 16课逐卡正文/题解门禁/闭卷刷新/掌握隔离；320/375/390/430px通过。
- 全76课校对、122新增题唯一ID、A31/B31/C30/D30、源文件及数据库原样保留通过。

证据位于 `logs/d5-*`。尚未部署，等待案例论文和完整回归。
