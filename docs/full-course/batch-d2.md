# D2 集成验收

PASS：15课、30道原创理解题、8个新图示。新增课程原JSON逐字节保留；D1 15课与原8图保持原样。未集成的后续卡仍显示速记版。

- `node scripts/render-expanded-diagrams.mjs --day=2`：8图实际 Mermaid 渲染通过，无语法修改。
- `npm run test`：71/71（原63 + 新8）。
- `npm run build`：通过，PWA预缓存37项。
- `COURSE_DAY=2 FULL_COURSE_EVIDENCE=tmp/full-course/d2 npm run test:full-course`：19/19；含15课全文、题目交卷/错答/解析/重做、闭卷刷新、掌握隔离，以及320/375/390/430px。
- `npx tsx scripts/check-full-course.ts --source --preserved --write-report`：通过；完整JSON与全76校对文件一致，原数据库与核心资料逐字节保留。

来源问题：上游 FILE_MANIFEST.json 自身大小及哈希记录不一致，其他12项均匹配。原包保持不改写，本项目记录实际哈希。

原始讲义只包含课程正文与题解；SQL补充、Mermaid、衔接语、题ID等来自同包JSON，分别进行源字节、schema和实际页面检查。

证据位于 `logs/d2-*`；课程只用于理解，不计客观掌握。尚未部署。
