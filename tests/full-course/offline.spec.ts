import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {BeginnerLesson} from '../../src/domain/lesson-schema';
import type {CaseCoach,EssayCoach} from '../../src/domain/coaching-schema';
import {records} from '../audit/helpers';
const lessons=['day1_beginner_lessons.json','day2_day5_beginner_lessons.json'].flatMap(f=>JSON.parse(readFileSync(`src/data/lessons/${f}`,'utf8')).lessons) as BeginnerLesson[];
const coaching=JSON.parse(readFileSync('src/data/lessons/case_paper_beginner_coaching.json','utf8')) as {caseWalkthroughs:CaseCoach[];essayCoaches:EssayCoach[]};
test('PWA首次联网后关页重开，76课/41图/19辅导离线全部可用，SQL/答题与草稿正常',async({page,context})=>{
 test.setTimeout(240000);const errors:string[]=[];
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await context.setOffline(true);await page.close();const offline=await context.newPage();offline.on('pageerror',e=>errors.push(e.message));
 let diagrams=0;
 for(const l of lessons){await offline.goto(`/learn/${l.cardId}`);await expect(offline.getByText(l.oneSentence,{exact:true})).toBeVisible();await expect(offline.getByText(l.scenario.narrative,{exact:true})).toBeVisible();
  if(l.conceptVisual){const img=offline.locator('.lesson-visual img');await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);diagrams++;}
  if(['K037','K054','K060','K068'].includes(l.cardId)){
   const q=l.practiceQuestions[0];const box=offline.locator(`[data-question-id="${q.id}"]`);await expect(box.locator('.lesson-explanations')).toHaveCount(0);
   await box.getByRole('button',{name:`${q.answer} ${q.options[q.answer]}`,exact:true}).click();await box.getByRole('button',{name:'提交理解题 1',exact:true}).click();await expect(box.getByRole('status')).toContainText(`正确答案 ${q.answer}`);
  }
  if(l.cardId==='K037')await expect(offline.locator('.lesson-sql code')).toHaveText(l.supplement!.copyableSql);
 }
 expect(diagrams).toBe(41);expect(await records(offline,'questionAttempts')).toEqual([]);expect(await records(offline,'cardAttempts')).toEqual([]);
 for(const c of coaching.caseWalkthroughs){await offline.goto(`/cases/${c.caseId}`);await offline.getByText('不会做？先看拆题思路',{exact:true}).click();await expect(offline.getByText(c.primer,{exact:true})).toBeVisible();await expect(offline.getByTestId('coach-answer-examples')).toHaveCount(0);}
 for(const e of coaching.essayCoaches){await offline.goto(`/essays/${e.essayId}`);await offline.getByText('写作教练 · 从真实项目开始',{exact:true}).click();await expect(offline.getByText(e.focus,{exact:true})).toBeVisible();}
 await offline.goto('/essays/E02');await offline.getByRole('textbox',{name:'我的论文正文',exact:true}).fill('离线真实架构正文');await expect.poll(async()=>(await records(offline,'essayDrafts')).find(d=>d.essayId==='E02')?.body).toBe('离线真实架构正文');
 await offline.close();const reopened=await context.newPage();await reopened.goto('/essays/E02');await expect(reopened.getByRole('textbox',{name:'我的论文正文',exact:true})).toHaveValue('离线真实架构正文');await expect(reopened.getByText('离线模式',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});
