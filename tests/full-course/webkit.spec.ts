import {test,expect,devices} from '@playwright/test';
import {records} from '../audit/helpers';
const phone=devices['iPhone 13'];test.use({...phone,browserName:'webkit'});
for(const width of [375,390])test(`WebKit ${width}px SQL/RPO/CAP/Agent/公式/图示`,async({page})=>{
 await page.setViewportSize({width,height:844});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const id of ['K037','K054','K060','K068','K069','K070','K071','K063']){
  await page.goto(`/learn/${id}`);await expect(page.locator('.beginner-course')).toBeVisible();await page.getByRole('button',{name:'看全部',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id).toBe(true);
  const img=page.locator('.lesson-visual img');await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  const scroll=page.locator('.lesson-diagram-scroll');if(await scroll.evaluate(el=>el.scrollWidth>el.clientWidth)){
   await scroll.evaluate(el=>el.scrollLeft=el.scrollWidth);expect(await scroll.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  }
  if(id==='K037'){const sql=page.locator('.lesson-sql pre');expect(await sql.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);await sql.evaluate(el=>el.scrollLeft=100);expect(await sql.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
  const q=page.locator('.lesson-question').first();await expect(q.locator('.lesson-explanations')).toHaveCount(0);
  await q.locator('.option-button').first().click();await q.getByRole('button',{name:'提交理解题 1',exact:true}).click();await expect(q.locator('.lesson-explanations p')).toHaveCount(4);
  await q.getByRole('button',{name:'重做理解题 1',exact:true}).click();await expect(q.locator('.lesson-explanations')).toHaveCount(0);
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  expect(await page.evaluate(()=>document.querySelector('.site-footer')!.getBoundingClientRect().bottom<=document.querySelector('.bottom-nav')!.getBoundingClientRect().top+1)).toBe(true);
 }
 expect(errors).toEqual([]);expect(await records(page,'questionAttempts')).toEqual([]);expect(await records(page,'cardAttempts')).toEqual([]);
});
for(const width of [375,390])test(`WebKit ${width}px C09/E02辅导与缩小视口草稿刷新`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.goto('/cases/C09');await page.getByText('不会做？先看拆题思路',{exact:true}).click();
 await expect(page.getByTestId('coach-answer-examples')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const answer=page.getByRole('textbox',{name:'C09-Q1 我的独立回答',exact:true});await answer.focus();await page.setViewportSize({width,height:500});await answer.evaluate(el=>el.scrollIntoView({block:'center'}));await answer.fill('手机缩小视口独立案例草稿');
 await expect.poll(async()=>(await records(page,'caseDrafts'))[0]?.answers['C09-Q1']).toBe('手机缩小视口独立案例草稿');
 await page.reload();await expect(answer).toHaveValue('手机缩小视口独立案例草稿');
 await page.goto('/essays/E02');await page.getByText('写作教练 · 从真实项目开始',{exact:true}).click();
 const body=page.getByRole('textbox',{name:'我的论文正文',exact:true});await body.focus();await body.evaluate(el=>el.scrollIntoView({block:'center'}));await body.fill('真实架构权衡正文');
 await expect.poll(async()=>(await records(page,'essayDrafts'))[0]?.body).toBe('真实架构权衡正文');await page.reload();await expect(body).toHaveValue('真实架构权衡正文');
 expect(await records(page,'projects')).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
