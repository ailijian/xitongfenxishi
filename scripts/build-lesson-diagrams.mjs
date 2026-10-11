// Eight explicitly transcribed diagrams from the supplied, fixed course package.
// No Mermaid runtime, HTML insertion, external URLs, or user-code execution.
// Changes to teaching relations require checking this transcription against source.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const hash = (s) => createHash('sha256').update(s).digest('hex');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function text(x, y, lines, cls = '') {
  return `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${lines.map((s, i) => `<tspan x="${x}" dy="${i ? 24 : 0}">${esc(s)}</tspan>`).join('')}</text>`;
}
function box(x, y, w, lines, kind = 'box') {
  const h = lines.length * 24 + 24;
  const shape = kind === 'diamond'
    ? `<path d="M${x + w/2} ${y-16} L${x+w+12} ${y+h/2} L${x+w/2} ${y+h+16} L${x-12} ${y+h/2} Z"/>`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${kind === 'round' ? h/2 : 10}"/>`;
  return `<g class="node">${shape}${text(x+w/2,y+30,lines)}</g>`;
}
function edge(points, label = '', tx = 0, ty = 0, both = false, dashed = false) {
  return `<path class="edge" d="${points}" marker-end="url(#arrow)"${both ? ' marker-start="url(#back)"' : ''}${dashed ? ' stroke-dasharray="8 5"' : ''}/>${label ? text(tx,ty,[label],'edge-label') : ''}`;
}
function svg(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#196455"/></marker><marker id="back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#196455"/></marker></defs><style>svg{background:#f5f9f6}text{font:17px system-ui,'PingFang SC',sans-serif;fill:#203c37}.node rect,.node path{fill:#fff;stroke:#71978a;stroke-width:2}.edge{fill:none;stroke:#196455;stroke-width:2}.edge-label{font-size:15px;paint-order:stroke;stroke:#f5f9f6;stroke-width:6px;stroke-linejoin:round}.frame{fill:none;stroke:#71978a;stroke-width:2;stroke-dasharray:7 4}.lifeline{stroke:#a4baae;stroke-dasharray:5 4}.small{font-size:15px}</style>${body}</svg>\n`;
}
const diagrams = {
  K004: {
    alt: '提交变更请求→分析范围、成本、工期、风险→获得批准？否：记录拒绝原因；是：更新需求基线、设计和测试→通知相关方并实施。',
    render: (title) => svg(680,530,title,
      box(200,20,280,['提交变更请求'])+box(200,105,280,['分析范围 成本 工期 风险'])+
      box(245,218,190,['获得批准?'],'diamond')+box(20,370,235,['记录拒绝原因'])+
      box(365,365,285,['更新需求基线','设计和测试'])+box(365,465,285,['通知相关方并实施'])+
      edge('M340 68 V105')+edge('M340 153 V202')+edge('M233 242 H138 V370','否',180,232)+
      edge('M447 242 H507 V365','是',487,232)+edge('M507 437 V465')),
  },
  K005: {
    alt: '业务来源↔需求 R17↔设计 D05↔实现 cancelAppointment↔测试 T33。每一段都可正向和反向追踪，不是网络调用。',
    render: (title) => svg(1050,140,title,
      box(20,40,150,['业务来源'])+box(220,40,150,['需求 R17'])+box(420,40,150,['设计 D05'])+
      box(620,28,225,['实现','cancelAppointment'])+box(890,40,140,['测试 T33'])+
      edge('M170 64 H220','',0,0,true)+edge('M370 64 H420','',0,0,true)+
      edge('M570 64 H620','',0,0,true)+edge('M845 64 H890','',0,0,true)),
  },
  K006: {
    alt: '系统边界外：患者、短信平台。边界内：预约门诊、校验号源、获取提醒。患者→预约门诊；预约门诊→校验号源（include，必须执行）；获取提醒→预约门诊（extend，条件性扩展）；短信平台→获取提醒。',
    render: (title) => svg(700,500,title,
      '<rect class="frame" x="245" y="20" width="430" height="445" rx="16"/>'+text(460,55,['预约系统 · 系统边界'])+
      box(20,100,170,['患者','外部角色'])+box(20,330,170,['短信平台','外部系统'])+
      box(325,110,255,['预约门诊'],'round')+box(325,250,255,['校验号源'],'round')+
      box(325,375,255,['获取提醒'],'round')+
      edge('M190 135 H325')+edge('M453 158 V250','include 必须执行',452,207)+
      edge('M580 399 H640 V135 H580')+
      '<text x="640" y="270" text-anchor="middle" class="edge-label" transform="rotate(-90 640 270)">extend 条件性扩展</text>'+
      edge('M190 366 H230 V399 H325')),
  },
  K007: {
    alt: '生命线从左到右为患者、手机 App、预约服务、号源库。依次提交预约、请求预约、检查并占用号源。alt 有可用号源：占用成功→返回预约编号→预约成功；else 无可用号源：占用失败→返回号源不足→提示选择其他时段。虚线为返回消息。',
    render: (title) => {
      const xs = [90,285,480,675];
      let b = xs.map((x,i)=>box(x-75,20,150,[['患者','手机App','预约服务','号源库'][i]])+`<line class="lifeline" x1="${x}" y1="68" x2="${x}" y2="620"/>`).join('');
      const msg = (a,c,y,label,dashed=false) => edge(`M${xs[a]} ${y} H${xs[c]}`,label,(xs[a]+xs[c])/2,y-12,false,dashed);
      b += msg(0,1,120,'提交预约')+msg(1,2,175,'请求预约')+msg(2,3,230,'检查并占用号源');
      b += '<rect class="frame" x="10" y="260" width="735" height="365"/>'+text(135,286,['alt · 有可用号源'],'small');
      b += msg(3,2,325,'占用成功',true)+msg(2,1,375,'返回预约编号',true)+msg(1,0,425,'预约成功',true);
      b += '<line class="frame" x1="10" y1="450" x2="745" y2="450"/>'+text(135,475,['else · 无可用号源'],'small');
      b += msg(3,2,515,'占用失败',true)+msg(2,1,565,'返回号源不足',true)+msg(1,0,615,'提示选择其他时段',true);
      return svg(760,650,title,b);
    },
  },
  K008: {
    alt: '患者提交预约→并行分叉，同时校验号源、校验资格→两支并行汇合→两项均通过？是：确认预约；否：提示失败原因。并行检查是两件都做，结果分支只走一条。',
    render: (title) => svg(650,560,title,
      box(215,15,220,['患者提交预约'])+box(215,95,220,['并行分叉'],'round')+
      box(40,205,220,['校验号源'])+box(390,205,220,['校验资格'])+
      box(215,315,220,['并行汇合'],'round')+box(230,395,190,['两项均通过?'],'diamond')+
      box(25,495,235,['确认预约'])+box(390,495,235,['提示失败原因'])+
      edge('M325 63 V95')+edge('M215 119 H150 V205')+edge('M435 119 H500 V205')+
      edge('M150 253 V339 H215')+edge('M500 253 V339 H435')+edge('M325 363 V379')+
      edge('M218 419 H143 V495','是',180,409)+edge('M432 419 H508 V495','否',477,409)),
  },
  K009: {
    alt: '开始→待确认→通过号源校验→已确认。已确认在满足取消时间条件时迁移到已取消，并释放号源；医生完成接诊后迁移到已就诊；已取消和已就诊均可结束。违规取消不产生迁移。',
    render: (title) => svg(700,470,title,
      '<circle cx="350" cy="28" r="9" fill="#196455"/>'+box(240,75,220,['待确认'],'round')+
      box(240,210,220,['已确认'],'round')+box(20,350,220,['已取消'],'round')+box(460,350,220,['已就诊'],'round')+
      '<circle cx="350" cy="445" r="13" fill="none" stroke="#196455" stroke-width="2"/><circle cx="350" cy="445" r="8" fill="#196455"/>'+
      edge('M350 37 V75')+edge('M350 123 V210','通过号源校验',350,170)+
      edge('M240 234 H130 V350','满足取消时间条件 / 释放号源',170,310)+
      edge('M460 234 H570 V350','医生完成接诊',540,310)+edge('M130 398 V445 H337')+edge('M570 398 V445 H363')),
  },
  K010: {
    alt: 'Patient 类：name:String、book()；Appointment 类：status:String、cancel()；Doctor 类：name:String、changeSchedule()。Patient 的 1 对应 Appointment 的 0..*（books）；Doctor 的 1 对应 Appointment 的 0..*（receives）。图中是关联、多重性，没有组合或泛化关系。',
    render: (title) => {
      const c = (x,y,name,attr,op) => `<g class="node"><rect x="${x}" y="${y}" width="225" height="145" rx="6"/><path d="M${x} ${y+46} H${x+225} M${x} ${y+95} H${x+225}"/>${text(x+112,y+30,[name])}${text(x+112,y+78,[attr],'small')}${text(x+112,y+126,[op],'small')}</g>`;
      return svg(730,420,title,c(20,25,'Patient','+name: String','+book()')+c(470,140,'Appointment','+status: String','+cancel()')+c(20,245,'Doctor','+name: String','+changeSchedule()')+
        edge('M245 98 H365 V177 H470','books',352,88)+text(265,85,['1'],'small')+text(445,162,['0..*'],'small')+
        edge('M245 318 H365 V248 H470','receives',352,349)+text(265,303,['1'],'small')+text(445,235,['0..*'],'small'));
    },
  },
  K011: {
    alt: '患者（外部实体）→预约申请（数据流）→受理预约（加工）。加工↔数据存储：读写号源、预约记录。加工→预约结果（数据流）→患者。患者与存储之间没有直接连线。',
    render: (title) => svg(760,300,title,
      box(15,105,175,['患者','外部实体'])+box(295,105,175,['受理预约','加工'],'round')+box(575,105,170,['数据存储'])+
      '<path d="M585 109 V149 M735 109 V149" stroke="#71978a" stroke-width="2"/>'+
      edge('M190 124 H295','预约申请 数据流',244,93)+edge('M470 141 H575','读写号源 预约记录',519,215,true)+
      edge('M295 155 H242 V258 H102 V177','预约结果 数据流',197,285)),
  },
};
const pack = JSON.parse(fs.readFileSync('src/data/lessons/day1_beginner_lessons.json','utf8'));
const manifest = {};
const check = process.argv.includes('--check');
if (!check) fs.mkdirSync('public/lesson-diagrams', {recursive:true});
for (const l of pack.lessons.filter((l)=>l.conceptVisual)) {
  const model = diagrams[l.cardId];
  if (!model) throw new Error(`缺少图示转录：${l.cardId}`);
  const rendered = model.render(l.conceptVisual.title);
  const path = `public/lesson-diagrams/${l.cardId}.svg`;
  if (check) {
    if (fs.readFileSync(path,'utf8') !== rendered) throw new Error(`静态图示过期：${path}`);
  } else fs.writeFileSync(path,rendered);
  manifest[l.cardId] = {src:`lesson-diagrams/${l.cardId}.svg`,alt:model.alt,
    sourceSha256:hash(l.conceptVisual.code),svgSha256:hash(rendered)};
}
const manifestText = JSON.stringify(manifest,null,2)+'\n';
if (check) {
  if (fs.readFileSync('src/data/lessons/diagrams.json','utf8') !== manifestText) throw new Error('图示来源/文字版清单过期');
} else fs.writeFileSync('src/data/lessons/diagrams.json',manifestText);
console.log(`PASS: ${Object.keys(manifest).length} safe static SVG diagrams; source/asset hashes and text alternatives ${check ? 'verified' : 'written'}.`);
