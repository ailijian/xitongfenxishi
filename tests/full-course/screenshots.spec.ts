import {test,expect} from '@playwright/test';
const output=process.env.FULL_COURSE_SCREENSHOTS||'tmp/full-course/screenshots';
for(const width of [375,390])test(`${width}px 首页/SQL/RPO/CAP/Agent/C09/E02实际截图与布局`,async({page})=>{
 await page.setViewportSize({width,height:844});
 for(const [id,path] of [['home','/'],['K037','/learn/K037'],['K054','/learn/K054'],['K060','/learn/K060'],['K068','/learn/K068'],['C09','/cases/C09'],['E02','/essays/E02']]){
  await page.goto(path);await expect(page.locator('h1')).toBeVisible();
  if(id.startsWith('K')){await expect(page.locator('.beginner-course')).toBeVisible();await page.getByRole('button',{name:'看全部',exact:true}).click();const img=page.locator('.lesson-visual img');await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.complete&&e.naturalWidth>0)).toBe(true);}
  if(id==='C09')await page.getByText('不会做？先看拆题思路',{exact:true}).click();
  if(id==='E02')await page.getByText('写作教练 · 从真实项目开始',{exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id).toBe(true);
  if(id==='C09'||id==='E02'){
   const small=await page.locator('main button,main summary,.bottom-nav>a').evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)?[el.textContent]:[]}));expect(small).toEqual([]);
  }
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  expect(await page.evaluate(()=>document.querySelector('.site-footer')!.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav')!.getBoundingClientRect().top+1),id).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${output}/after-${id}-${width}.png`,fullPage:true});
 }
});
for(const width of [320,430])test(`${width}px C09/E02辅导不溢出且按钮可点`,async({page})=>{
 await page.setViewportSize({width,height:844});
 for(const path of ['/cases/C09','/essays/E02']){
  await page.goto(path);await page.locator('.practical-coach summary').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const small=await page.locator('main button,main summary,.bottom-nav>a').evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)?[el.textContent]:[]}));expect(small).toEqual([]);
 }
});
test('全部76张卡都有真实课程版，可搜索新内容且序列D1—D5完整',async({page})=>{
 await page.goto('/learn');await expect(page.getByText('零基础课程版',{exact:true})).toHaveCount(76);await expect(page.getByText('考前速记版 · 暂无完整入门课程',{exact:true})).toHaveCount(0);
 await page.getByRole('searchbox',{name:'搜索知识',exact:true}).fill('SQL');await expect(page.getByRole('link',{name:/K037/})).toBeVisible();
 await page.goto('/learn/K075');await expect(page.getByRole('link',{name:'继续零基础课程 · K015 →',exact:true})).toHaveAttribute('href','/learn/K015');
 await page.goto('/learn/K076');await expect(page.getByRole('link',{name:/继续零基础课程/})).toHaveCount(0);
});
