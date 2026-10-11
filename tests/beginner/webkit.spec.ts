import { test, expect, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { BeginnerLesson } from "../../src/domain/lesson-schema";
import { records } from "../audit/helpers";

const lessons=(JSON.parse(readFileSync(new URL("../../src/data/lessons/day1_beginner_lessons.json",import.meta.url),"utf8")) as {lessons:BeginnerLesson[]}).lessons;
const {defaultBrowserType: _browser, ...phone}=devices["iPhone 13"];
test.use({...phone,browserName:"webkit"});
for(const width of [375,390]) test(`WebKit ${width}px移动浏览器：四个重点课程、触摸图示、答案门禁及刷新草稿`,async({page})=>{
  await page.setViewportSize({width,height:700});
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  for(const id of ["K001","K006","K010","K011"]) {
    const lesson=lessons.find(l=>l.cardId===id)!;
    await page.goto(`/learn/${id}`);
    await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
    await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.getByRole("button",{name:"懂了，下一步",exact:true}).click();
    await expect(page.getByRole("heading",{name:lesson.explanationSteps[1].heading,exact:true})).toBeFocused();
    if(lesson.conceptVisual) {
      const img=page.locator(".lesson-visual img");await expect.poll(()=>img.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
      const diagram=page.locator(".lesson-diagram-scroll");await diagram.evaluate(el=>el.scrollLeft=150);
      expect(await diagram.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
      await page.getByText("图示的文字版本",{exact:true}).click();
      await expect(page.locator(".lesson-visual details")).toHaveAttribute("open","");
    }
    const q=lesson.practiceQuestions[0], article=page.locator(`[data-question-id="${q.id}"]`);
    await expect(article.locator(".lesson-explanations")).toHaveCount(0);
    await article.getByRole("button",{name:`${q.answer} ${q.options[q.answer]}`,exact:true}).tap();
    await article.getByRole("button",{name:"提交理解题 1"}).tap();
    await expect(article.getByRole("status")).toContainText(`正确答案 ${q.answer}`);
    await article.getByRole("button",{name:"重做理解题 1"}).tap();
    await expect(article.locator(".lesson-explanations")).toHaveCount(0);
    await expect(article.getByText(/正确答案/)).toHaveCount(0);
  }
  expect(await records(page,"questionAttempts")).toEqual([]);expect(await records(page,"cardAttempts")).toEqual([]);
  await page.goto("/learn/K001");await page.getByRole("button",{name:/开始闭卷自测/}).tap();
  await page.getByRole("textbox",{name:"闭卷回答"}).fill("WebKit独立自述刷新保存");
  await expect.poll(async()=> (await records(page,"learningDrafts"))[0]?.recall).toBe("WebKit独立自述刷新保存");
  await page.reload();await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("WebKit独立自述刷新保存");
  expect(errors).toEqual([]);
});
