# D4 集成验收

PASS：15课、30道原创理解题、6个新图示。累计60课/120教学题/30图。

- Mermaid实际渲染6/6，无源语法修改；质量场景、RPO/RTO恢复时间线、容灾演练完整。
- `npm run test`：71/71；`npm run build`：通过。
- `COURSE_DAY=4 FULL_COURSE_EVIDENCE=tmp/full-course/d4 npm run test:full-course`：19/19。
- 15课逐卡正文/带做/解析门禁/闭卷刷新/掌握隔离通过；重点K043/K044/K049/K054/K055/K074在320/375/390/430px通过。
- 完整JSON校对、原内容及数据库逐字节保留检查通过。

证据位于 `logs/d4-*`。尚未部署。
