import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { BeginnerLesson } from "../../src/domain/lesson-schema";
import type { KnowledgeCard } from "../../src/domain/content-schema";
const expandedPackage=JSON.parse(readFileSync("src/data/lessons/day2_day5_beginner_lessons.json","utf8")) as {lessons:BeginnerLesson[]};
const content={plan:JSON.parse(readFileSync("src/data/plan.json","utf8")) as {day:number;knowledgeIds:string[]}[],
 knowledge:JSON.parse(readFileSync("src/data/knowledge.json","utf8")) as KnowledgeCard[]};
const integratedCourseDays=[1,2,3,4,5];
import { records } from "../audit/helpers";
const day=Number(process.env.COURSE_DAY);
const lessons=expandedPackage.lessons.filter(l=>!day||content.plan.find(d=>d.knowledgeIds.includes(l.cardId))!.day===day);
for(const lesson of lessons)test(`${lesson.cardId} 全文/带做/两题门禁解析重做/闭卷/原卡隔离`,async({page})=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(`/learn/${lesson.cardId}`);
 await expect(page.locator(".beginner-course")).toHaveAttribute("data-lesson-id",lesson.cardId);
 await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
 await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toBeVisible();
 await page.getByText("为什么要学这一课",{exact:true}).click();await expect(page.getByText(lesson.whyLearn,{exact:true})).toBeVisible();
 await expect(page.locator(".lesson-step")).toHaveCount(1);
 for(let i=1;i<lesson.explanationSteps.length;i++){
  await page.getByRole("button",{name:"懂了，下一步",exact:true}).click();
  await expect(page.locator(".lesson-step").getByRole("heading",{name:lesson.explanationSteps[i].heading,exact:true})).toBeFocused();
 }
 await page.getByRole("button",{name:"看全部",exact:true}).click();
 for(const step of lesson.explanationSteps)await expect(page.getByText(step.body,{exact:true})).toBeVisible();
 await expect(page.locator(".lesson-worked li")).toHaveText(lesson.workedExample.solutionSteps);
 for(const text of [lesson.distinguish,lesson.examTip,lesson.memoryHook,lesson.nextConnection])await expect(page.getByText(text,{exact:true})).toBeVisible();
 await expect(page.locator("#closed-book li")).toHaveText(lesson.recallPrompts);
 if(lesson.conceptVisual){
  const image=page.locator(".lesson-visual img");await expect(image).toBeVisible();
  await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  await expect(page.getByText(lesson.conceptVisual.note,{exact:true})).toBeVisible();
  await page.getByText("图示的文字版本",{exact:true}).click();
  await expect(page.locator(".lesson-visual details p")).toBeVisible();
 }
 for(let i=0;i<2;i++){
  const q=lesson.practiceQuestions[i];const box=page.locator(`[data-question-id="${q.id}"]`);
  await expect(box.locator(".lesson-explanations")).toHaveCount(0);await expect(box.getByText(/正确答案/)).toHaveCount(0);
  const submit=box.getByRole("button",{name:`提交理解题 ${i+1}`,exact:true});await expect(submit).toBeDisabled();
  const choice=i===0?q.answer:(q.answer==='A'?'B':'A');
  await box.getByRole("button",{name:`${choice} ${q.options[choice]}`,exact:true}).click();await submit.click();
  await expect(box.getByRole("status")).toContainText(`正确答案 ${q.answer}`);
  await expect(box.getByRole("status")).toContainText(i===0?"理解题答对了":"再对照解析想一想");
  for(const [letter,reason] of Object.entries(q.optionExplanations))await expect(box.locator(".lesson-explanations p").nth("ABCD".indexOf(letter))).toHaveText(`${letter}${letter===q.answer?"（正确）":"（干扰项）"}：${reason}`);
  await expect(box.locator(".option-button:disabled")).toHaveCount(4);
  await box.getByRole("button",{name:`重做理解题 ${i+1}`,exact:true}).click();await expect(box.locator(".lesson-explanations")).toHaveCount(0);await expect(submit).toBeDisabled();
 }
 const original=content.knowledge.find(k=>k.id===lesson.cardId)!;
 await page.getByTestId("exam-speed-notes").locator("summary").click();
 await expect(page.getByTestId("exam-speed-notes").getByText(original.essentials,{exact:true})).toBeVisible();
 for(const table of ["cardAttempts","questionAttempts","sessions"])expect(await records(page,table)).toEqual([]);
 expect((await records(page,"cards")).every(k=>!k.firstPassAt)).toBe(true);
 await page.getByRole("button",{name:/开始闭卷自测/}).click();
 await expect(page.locator(".beginner-course")).toHaveCount(0);await expect(page.locator(".lesson-recall-prompts li")).toHaveText(lesson.recallPrompts);
 const text=`${lesson.cardId} 自己的闭卷回答`;
 await page.getByRole("textbox",{name:"闭卷回答",exact:true}).fill(text);
 await expect.poll(async()=>(await records(page,"learningDrafts")).find(d=>d.cardId===lesson.cardId)?.recall).toBe(text);
 await page.reload();await expect(page.getByRole("textbox",{name:"闭卷回答",exact:true})).toHaveValue(text);
 expect(await records(page,"cardAttempts")).toEqual([]);expect(errors).toEqual([]);
});

const keyCards:Record<number,string[]>={2:["K015","K017","K020","K024","K029"],3:["K032","K034","K036","K037","K069","K070","K071"],4:["K043","K044","K049","K054","K055","K074"],5:["K060","K061","K062","K063","K065","K067","K068","K072","K073"]};
const activeKeys=Object.entries(keyCards).filter(([d])=>day?+d===day:integratedCourseDays.includes(+d)).flatMap(([,ids])=>ids);
for(const width of [320,375,390,430])test(`${width}px 新课程长文/图示/SQL局部滚动/底部导航与缩小视口`,async({page})=>{
 await page.setViewportSize({width,height:844});
 for(const id of activeKeys){
  await page.goto(`/learn/${id}`);await expect(page.locator(".beginner-course")).toBeVisible();
  await page.getByRole("button",{name:"看全部",exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id).toBe(true);
  const small=await page.locator("main button, main summary, .bottom-nav>a").evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)?[el.textContent]:[]}));expect(small,id).toEqual([]);
  const diagram=page.locator(".lesson-diagram-scroll");if(await diagram.count()){
   const img=diagram.locator("img");await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.naturalWidth>0)).toBe(true);
   if(await diagram.evaluate(el=>el.scrollWidth>el.clientWidth)){await diagram.evaluate(el=>el.scrollLeft=el.scrollWidth);expect(await diagram.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
  }
  if(id==="K037"){
   const code=page.locator(".lesson-sql pre");await expect(code).toHaveText(expandedPackage.lessons.find(l=>l.cardId===id)!.supplement!.copyableSql);
   expect(await code.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);await code.evaluate(el=>el.scrollLeft=el.scrollWidth);expect(await code.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  }
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  const bounds=await page.evaluate(()=>({footer:document.querySelector('.site-footer')!.getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav')!.getBoundingClientRect().top}));expect(bounds.footer,id).toBeLessThanOrEqual(bounds.nav+1);
 }
 await page.goto(`/learn/${activeKeys[0]}`);await page.getByRole("button",{name:/开始闭卷自测/}).click();await page.setViewportSize({width,height:500});
 const editor=page.getByRole("textbox",{name:"闭卷回答",exact:true});await editor.focus();await editor.evaluate(el=>el.scrollIntoView({block:'center'}));await editor.fill("缩小视口仍可输入");
 await expect.poll(async()=>(await records(page,"learningDrafts")).find(d=>d.cardId===activeKeys[0])?.recall).toBe("缩小视口仍可输入");
});
if(!day||day===3)test("K037 SQL复制逐字符一致，不执行查询",async({page,context})=>{
 await context.grantPermissions(["clipboard-read","clipboard-write"]);await page.goto("/learn/K037");
 const sql=expandedPackage.lessons.find(l=>l.cardId==="K037")!.supplement!.copyableSql;
 await expect(page.locator(".lesson-sql code")).toHaveText(sql);
 await page.getByRole("button",{name:"复制 SQL",exact:true}).click();await expect(page.getByRole("status")).toHaveText("SQL 已复制");
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(sql);
 expect(await records(page,"questionAttempts")).toEqual([]);
});
