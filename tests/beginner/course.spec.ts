import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { BeginnerLesson } from "../../src/domain/lesson-schema";
import { knowledge, records, selfTest, answerCase, downloadBackup } from "../audit/helpers";
const raw=JSON.parse(readFileSync(new URL("../../src/data/lessons/day1_beginner_lessons.json",import.meta.url),"utf8")) as {lessons:BeginnerLesson[]};

const screenshotDir=process.env.BEGINNER_SCREENSHOTS || "docs/beginner-course/screenshots";
test("K001默认通俗解释/医院案例、循序讲解、带做和闭卷，速记最后折叠", async ({page}) => {
  const lesson=raw.lessons[0];
  await page.goto("/learn/K001");
  await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
  await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"必会概念",exact:true})).not.toBeVisible();
  await expect(page.locator(".lesson-step")).toHaveCount(1);
  for(let i=1;i<lesson.explanationSteps.length;i++) {
    await page.getByRole("button",{name:"懂了，下一步",exact:true}).click();
    await expect(page.getByRole("heading",{name:lesson.explanationSteps[i].heading,exact:true})).toBeFocused();
  }
  await page.getByRole("button",{name:"看全部",exact:true}).click();
  await expect(page.locator(".lesson-step")).toHaveCount(4);
  await expect(page.locator(".lesson-worked li")).toHaveCount(4);
  const card=(await records(page,"cards"))[0];expect(card.firstPassAt).toBeUndefined();
  await page.getByRole("button",{name:/开始闭卷自测/}).click();
  await expect(page.locator(".beginner-course")).toHaveCount(0);
  await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toHaveCount(0);
  await expect(page.locator(".lesson-recall-prompts li")).toHaveCount(2);
  await expect(page.locator(".answer")).toHaveCount(0);
  await page.getByRole("textbox",{name:"闭卷回答"}).fill("保存我的独立理解，未交卷不算通过");
  await expect.poll(async()=> (await records(page,"learningDrafts"))[0]?.recall).toBe("保存我的独立理解，未交卷不算通过");
  await page.reload();
  await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("保存我的独立理解，未交卷不算通过");
  await page.getByRole("button",{name:"重新阅读资料"}).click();
  await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
  expect((await records(page,"cardAttempts"))).toEqual([]);
});

for(const lesson of raw.lessons) test(`${lesson.cardId}课程完整、两道理解题交卷解析/错答/重做、掌握隔离`, async ({page}) => {
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto(`/learn/${lesson.cardId}`);
    await expect(page.locator(".beginner-course")).toHaveAttribute("data-lesson-id",lesson.cardId);
    await page.getByText("为什么要学这一课",{exact:true}).click();
    await expect(page.getByText(lesson.whyLearn,{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"看全部",exact:true}).click();
    await expect(page.locator(".lesson-step")).toHaveCount(lesson.explanationSteps.length);
    for(const s of lesson.explanationSteps) await expect(page.getByText(s.body,{exact:true})).toBeVisible();
    await expect(page.locator(".lesson-worked li")).toHaveText(lesson.workedExample.solutionSteps);
    await expect(page.locator("#closed-book li")).toHaveText(lesson.recallPrompts);
    await expect(page.getByText(lesson.distinguish,{exact:true})).toBeVisible();
    if(lesson.conceptVisual) {
      const image=page.locator(".lesson-visual img");await expect(image).toBeVisible();
      await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
      await expect(page.getByText(lesson.conceptVisual.note,{exact:true})).toBeVisible();
    }
    for(let i=0;i<2;i++) {
      const q=lesson.practiceQuestions[i]; const question=page.locator(`[data-question-id="${q.id}"]`);
      await expect(question.locator(".lesson-explanations")).toHaveCount(0);
      await expect(question.getByText(/正确答案/)).toHaveCount(0);
      await expect(question.getByRole("button",{name:`提交理解题 ${i+1}`})).toBeDisabled();
      // First question correct; second wrong, to exercise both grading paths.
      const selected=i===0?q.answer:(q.answer==='A'?'B':'A');
      await question.getByRole("button",{name:`${selected} ${q.options[selected as keyof typeof q.options]}`,exact:true}).click();
      await question.getByRole("button",{name:`提交理解题 ${i+1}`} ).click();
      await expect(question.getByRole("status")).toContainText(i===0?"理解题答对了":"再对照解析想一想");
      await expect(question.getByRole("status")).toContainText(`正确答案 ${q.answer}`);
      for(const [letter,reason] of Object.entries(q.optionExplanations)) {
        const explanation=question.locator(".lesson-explanations p").nth("ABCD".indexOf(letter));
        await expect(explanation).toHaveText(`${letter}${letter===q.answer?"（正确）":"（干扰项）"}：${reason}`);
        await expect(explanation).toBeVisible();
      }
      await expect(question.locator(".option-button:disabled")).toHaveCount(4);
      await question.getByRole("button",{name:`重做理解题 ${i+1}`} ).click();
      await expect(question.locator(".lesson-explanations")).toHaveCount(0);
      await expect(question.getByText(/正确答案/)).toHaveCount(0);
      await expect(question.getByRole("button",{name:`提交理解题 ${i+1}`})).toBeDisabled();
    }
    await page.getByTestId("exam-speed-notes").locator("summary").click();
    const card=knowledge.find(k=>k.id===lesson.cardId)!;
    await expect(page.getByTestId("exam-speed-notes").getByText(card.essentials,{exact:true})).toBeVisible();
    await expect(page.getByTestId("exam-speed-notes").getByText(card.pitfalls,{exact:true})).toBeVisible();
  for(const table of ["cardAttempts","questionAttempts","sessions"]) expect(await records(page,table)).toEqual([]);
  expect((await records(page,"cards")).every(k=>!k.firstPassAt)).toBe(true);
  expect(errors).toEqual([]);
});

test("K006 include/extend、K010生命周期、K011非法流向与分层平衡，未提供课程的卡明确标记", async ({page}) => {
  const keyText:Record<string,string[]>={
    K006:["include 与 extend","条件可选行为","extend 的箭头指向被扩展用例"],
    K010:["聚合与组合","整体生命周期约束","不把医生作为医院的组合部分"],
    K011:["四种元素","外部实体不应不经加工直接访问数据存储","分解前后，与外界交换的数据流应保持平衡"],
  };
  for(const [id,texts] of Object.entries(keyText)) {
    await page.goto(`/learn/${id}`);await page.getByRole("button",{name:"看全部",exact:true}).click();
    for(const text of texts) await expect(page.locator(".beginner-course").getByText(text,{exact:false}).first()).toBeVisible();
  }
  await page.goto("/learn/K015");
  await expect(page.getByText("考前速记版",{exact:true})).toBeVisible();
  await expect(page.getByText(/此知识点暂无完整入门课程/)).toBeVisible();
  await expect(page.locator(".beginner-course")).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"必会概念",exact:true})).toBeVisible();
  await page.goto("/learn");
  await expect(page.getByText("零基础课程版",{exact:true})).toHaveCount(15);
  await expect(page.getByText("考前速记版 · 暂无完整入门课程",{exact:true})).toHaveCount(61);
});

for(const width of [320,375,390,430]) test(`${width}px课程长文、8图局部滚动、点击区域与闭卷缩小视口`, async ({page})=>{
  await page.setViewportSize({width,height:844});
  for(const id of ["K001","K006","K010","K011"]) {
    await page.goto(`/learn/${id}`);await expect(page.locator(".beginner-course")).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole("button",{name:"看全部",exact:true}).click();
    const small=await page.locator("main button,main summary,.bottom-nav>a").evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)?[el.textContent]:[]}));
    expect(small).toEqual([]);
    if(id!=='K001') {
      const diagram=page.locator(".lesson-diagram-scroll");
      expect(await diagram.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
      await diagram.evaluate(el=>el.scrollLeft=el.scrollWidth);
      expect(await diagram.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    const bounds=await page.evaluate(()=>({footer:document.querySelector('.site-footer')!.getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav')!.getBoundingClientRect().top}));
    expect(bounds.footer).toBeLessThanOrEqual(bounds.nav+1);
    await page.evaluate(()=>window.scrollTo(0,0));
    if(width===375||width===390) await page.screenshot({path:`${screenshotDir}/after-${id}-${width}.png`,fullPage:true});
  }
  await page.goto("/learn/K001");await page.getByRole("button",{name:/开始闭卷自测/}).click();
  const editor=page.getByRole("textbox",{name:"闭卷回答"});await editor.focus();
  await page.setViewportSize({width,height:500});await editor.evaluate(el=>el.scrollIntoView({block:'center'}));
  await editor.fill("缩小视口仍能输入自己的理解");
  await expect.poll(async()=> (await records(page,"learningDrafts"))[0]?.recall).toBe("缩小视口仍能输入自己的理解");
  const box=await editor.boundingBox();expect(box!.y).toBeLessThan(420);expect(box!.y+box!.height).toBeGreaterThan(0);
});

test("12类旧数据逐字段保留、理解练习不污染、JSON清空/恢复及损坏备份无副作用",async({page})=>{
  await page.goto("/learn/K001");await selfTest(page);
  await page.goto("/practice?question=RK001");await page.getByRole("button",{name:/B.*包含过多接口细节/}).click();
  await page.getByRole("button",{name:"提交答案",exact:true}).click();await expect(page.getByText("已加入错题本",{exact:true})).toBeVisible();
  await page.goto("/cases/C01");await answerCase(page,"C01","alternate");
  await page.goto("/essays/E01");await page.getByRole("button",{name:"新建项目素材"}).click();
  await page.getByRole("textbox",{name:"项目名称",exact:true}).fill("课程升级兼容性素材");
  await page.getByRole("textbox",{name:"我的论文提纲"}).fill("旧提纲保留");
  await page.getByRole("textbox",{name:"我的论文正文"}).fill("旧正文📝逐字段保持");
  await expect.poll(async()=> (await records(page,"essayDrafts"))[0]?.body).toBe("旧正文📝逐字段保持");
  await page.goto("/learn/K002");await page.getByRole("button",{name:/开始闭卷自测/}).click();
  await page.getByRole("textbox",{name:"闭卷回答"}).fill("课程上线前的未完成独立回答");
  await expect.poll(async()=> (await records(page,"learningDrafts")).find(d=>d.cardId==='K002')?.recall).toBe("课程上线前的未完成独立回答");
  await page.goto("/mock");await page.getByRole("button",{name:"开始本场完整模考"}).click();
  await page.getByRole("button",{name:"收藏本题",exact:true}).click();
  await page.getByRole("button",{name:/D.*输入输出数据流平衡/}).click();
  await expect(page.getByRole("heading",{name:"选择卷 · 已答 1 / 75题"})).toBeVisible();
  await page.goto("/progress");await page.getByLabel("学习启动日期").fill("2026-10-10");
  await page.getByRole("button",{name:"保存启动日"}).click();await expect(page.getByRole("status")).toContainText("启动日已保存");
  const {backup,path}=await downloadBackup(page);
  expect(Object.keys(backup.data)).toHaveLength(12);
  for(const [table,rows] of Object.entries(backup.data)) expect((rows as unknown[]).length,table).toBeGreaterThan(0);
  await page.goto("/learn/K001");
  const q=raw.lessons[0].practiceQuestions[0];
  await page.locator(`[data-question-id="${q.id}"]`).getByRole("button",{name:`${q.answer} ${q.options[q.answer as keyof typeof q.options]}`,exact:true}).click();
  await page.getByRole("button",{name:"提交理解题 1"}).click();
  await page.reload();await expect(page.locator(".lesson-explanations")).toHaveCount(0);
  await page.goto("/learn/K002");await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("课程上线前的未完成独立回答");
  await page.goto("/progress");expect((await downloadBackup(page)).backup.data).toEqual(backup.data);
  await page.getByRole("button",{name:"重置学习数据…"}).click();
  await page.getByRole("button",{name:"再次确认，清空全部学习数据"}).click();
  await expect(page.getByRole("status").filter({hasText:"已重置"})).toBeVisible();
  for(const table of Object.keys(backup.data)) expect(await records(page,table)).toEqual([]);
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(path);
  await expect(page.getByRole("heading",{name:"校验通过 · 恢复预览"})).toBeVisible();
  await page.getByRole("button",{name:"准备恢复此备份"}).click();
  await page.getByRole("button",{name:"确认替换并恢复"}).click();
  await expect(page.getByRole("status").filter({hasText:"完整恢复"})).toBeVisible();
  expect((await downloadBackup(page)).backup.data).toEqual(backup.data);
  await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles({name:"broken.json",mimeType:"application/json",buffer:Buffer.from('{damaged')});
  await expect(page.getByRole("alert")).toContainText("原数据未改动");
  expect((await downloadBackup(page)).backup.data).toEqual(backup.data);
});

test("首次联网后全部15课和8图离线关页重开可用，练习交卷仍隔离掌握",async({page,context})=>{
  await page.goto("/");await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.close();const offline=await context.newPage();
  for(const l of raw.lessons) {
    await offline.goto(`/learn/${l.cardId}`);await expect(offline.getByText(l.oneSentence,{exact:true})).toBeVisible();
    if(l.conceptVisual) await expect.poll(()=>offline.locator('.lesson-visual img').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  }
  await offline.goto("/learn/K001");const q=raw.lessons[0].practiceQuestions[0];
  await offline.locator(`[data-question-id="${q.id}"]`).getByRole('button',{name:`${q.answer} ${q.options[q.answer as keyof typeof q.options]}`,exact:true}).click();
  await offline.getByRole('button',{name:'提交理解题 1'}).click();await expect(offline.locator('.lesson-feedback')).toContainText(`正确答案 ${q.answer}`);
  expect(await records(offline,'questionAttempts')).toEqual([]);expect(await records(offline,'cardAttempts')).toEqual([]);
});
