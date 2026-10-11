# D3 集成验收

PASS：15课、30道原创理解题、8个新图示。累计45课/90教学题/24图。

- `node scripts/render-expanded-diagrams.mjs --day=3`：8图实际渲染通过，包含K036 sequenceDiagram，无源语法修改。
- `npm run test`：71/71；独立核算NPV≈4.54545、EMV=8、CPI≈0.889。
- `npm run build`：通过。
- `COURSE_DAY=3 FULL_COURSE_EVIDENCE=tmp/full-course/d3 npm run test:full-course`：20/20。逐课覆盖正文、题解门禁、闭卷刷新及掌握隔离；320/375/390/430px；K037完整SQL本地横滑与复制逐字符一致。
- 完整JSON源校对和17项核心文件逐字节保留检查通过。

证据位于 `logs/d3-*`。SQL只展示及复制，未执行数据库查询。尚未部署。
