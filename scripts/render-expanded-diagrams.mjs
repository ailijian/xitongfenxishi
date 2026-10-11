// Build-time only. Render the supplied Mermaid, ship inert SVG to every browser/PWA.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
const hash = s => createHash('sha256').update(s).digest('hex');
const pack = JSON.parse(fs.readFileSync('src/data/lessons/day2_day5_beginner_lessons.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync('src/data/plan.json', 'utf8'));
const day = Number(process.argv.find(a => a.startsWith('--day='))?.split('=')[1]);
const verify = process.argv.includes('--verify');
const lessons = pack.lessons.filter(l => l.conceptVisual && (!day || plan.find(d => d.knowledgeIds.includes(l.cardId)).day === day));
const alt = JSON.parse(fs.readFileSync('scripts/expanded-diagram-text.json', 'utf8'));
const ledgerPath = 'src/data/lessons/expanded-diagrams.json';
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
fs.mkdirSync('tmp', {recursive:true});
fs.writeFileSync('tmp/diagram-renderer.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><body><script type="module">
import mermaid from '/node_modules/mermaid/dist/mermaid.esm.min.mjs';
mermaid.initialize({startOnLoad:false,securityLevel:'strict',htmlLabels:false,theme:'base',
  fontFamily:'Arial, PingFang SC, sans-serif',themeVariables:{fontSize:'18px',primaryColor:'#f5f9f6',primaryTextColor:'#203c37',primaryBorderColor:'#71978a',lineColor:'#196455'},
  flowchart:{htmlLabels:false,useMaxWidth:false},sequence:{useMaxWidth:false,actorFontSize:18,messageFontSize:18,noteFontSize:18}});
window.renderDiagram=async(id,code)=>{await document.fonts.ready; const {svg}=await mermaid.render(id,code);
 const dom=new DOMParser().parseFromString(svg,'image/svg+xml');const root=dom.documentElement;
 if(dom.querySelector('parsererror'))throw Error('Invalid SVG');
 const box=root.getAttribute('viewBox').split(/\\s+/).map(Number);
 root.setAttribute('width',String(Math.ceil(box[2])));root.setAttribute('height',String(Math.ceil(box[3])));
 root.removeAttribute('style');root.setAttribute('role','img');
 return new XMLSerializer().serializeToString(root)+'\\n';};
</script></body></html>`);
const server = await createServer({configFile:false,root:process.cwd(),appType:'mpa',optimizeDeps:{entries:['tmp/diagram-renderer.html']},server:{host:'127.0.0.1',port:4188,strictPort:true}});
let browser;
try {
 await server.listen(); browser=await chromium.launch();const page=await browser.newPage();page.on('response',r=>{if(r.status()>=400)console.error(r.status(),r.url());});page.on('pageerror',e=>console.error(e));page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
 await page.goto('http://127.0.0.1:4188/tmp/diagram-renderer.html');await page.waitForFunction(()=>!!window.renderDiagram);
 for(const l of lessons) {
  const svg=await page.evaluate(async({id,code})=>await window.renderDiagram(id,code),{id:`diagram-${l.cardId}`,code:l.conceptVisual.code});
  if(/<\s*(script|foreignObject|iframe)|\bon\w+\s*=|javascript:|(?:href|src)\s*=|@import|url\(\s*[^#]/i.test(svg))throw Error(`Unsafe SVG: ${l.cardId}`);
  if(!alt[l.cardId])throw Error(`Missing accessible explanation: ${l.cardId}`);
  const src=`lesson-diagrams/${l.cardId}.svg`;
  if(!verify){fs.writeFileSync(`public/${src}`,svg);ledger[l.cardId]={src,alt:alt[l.cardId],sourceSha256:hash(l.conceptVisual.code),svgSha256:hash(svg),renderer:'mermaid@12.1.0',sourceUnmodified:true};}
  console.log(`PASS ${l.cardId} ${l.conceptVisual.kind} (${svg.length} characters)`);
 }
 if(!verify)fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
 console.log(`PASS actual Mermaid render: ${lessons.length} diagrams; original source syntax unchanged`);
} finally {await browser?.close();await server.close();}
