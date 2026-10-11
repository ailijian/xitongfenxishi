import fs from 'node:fs';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
const ledger=JSON.parse(fs.readFileSync('src/data/lessons/expanded-diagrams.json','utf8'));
const server=createServer((req,res)=>{if(!/^\/lesson-diagrams\/K\d{3}\.svg$/.test(req.url||'')){res.writeHead(404).end();return;}res.setHeader('Content-Type','image/svg+xml');res.end(fs.readFileSync(`public${req.url}`));});
await new Promise(resolve=>server.listen(4189,'127.0.0.1',resolve));
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:1000}});
const rows=[];fs.mkdirSync('tmp/diagram-qa',{recursive:true});
try {
 for(const [id,d] of Object.entries(ledger)){
  // Local renderer has completed; inspect the shipped SVG directly, without app injection.
  await page.goto(`http://127.0.0.1:4189/${d.src}`);
  const row=await page.locator('svg').evaluate(async root=>{
   await document.fonts.ready;const view=root.viewBox.baseVal;
   const bounds=[];
   for(const text of root.querySelectorAll('text')){
    const b=text.getBBox();const m=root.getCTM().inverse().multiply(text.getCTM());const p=root.createSVGPoint();
    for(const [x,y] of [[b.x,b.y],[b.x+b.width,b.y+b.height]]){p.x=x;p.y=y;const t=p.matrixTransform(m);bounds.push({x:t.x,y:t.y,label:text.textContent});}
   }
   return {width:view.width,height:view.height,texts:root.querySelectorAll('text').length,empty:!root.querySelector('text'),
    outOfBounds:bounds.filter(p=>p.x<view.x-3||p.x>view.x+view.width+3||p.y<view.y-3||p.y>view.y+view.height+3)};
  });
  if(row.empty||row.outOfBounds.length)throw Error(`${id}: missing/clipped text ${JSON.stringify(row)}`);
  // Phone screenshots are captured on the actual H5, separately from SVG layout inspection.
  rows.push({id,...row});console.log(`PASS ${id} visible text inside SVG viewBox (${row.texts} text elements)`);
 }
 fs.writeFileSync('docs/full-course/diagram-layout.json',JSON.stringify({result:'PASS',rows},null,2)+'\n');
} finally {await browser.close();server.close();}
