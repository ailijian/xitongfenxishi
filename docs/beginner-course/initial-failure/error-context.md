# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course.spec.ts >> 全部15课/30题/8图可学习，逐题交卷解析、错答、重做门禁与练习隔离
- Location: tests/beginner/course.spec.ts:37:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-question-id="LQ-D1-K011-01"]').getByText('是常见合法路径。')
Expected: visible
Error: strict mode violation: locator('[data-question-id="LQ-D1-K011-01"]').getByText('是常见合法路径。') resolved to 3 elements:
    1) <p>…</p> aka getByText('B（干扰项）：是常见合法路径。')
    2) <p>…</p> aka getByText('C（干扰项）：是常见合法路径。')
    3) <p>…</p> aka getByText('D（干扰项）：是常见合法路径。')

Call log:
  - Expect "toBeVisible" locator('[data-question-id="LQ-D1-K011-01"]').getByText('是常见合法路径。') with timeout 5000ms
  - waiting for locator('[data-question-id="LQ-D1-K011-01"]').getByText('是常见合法路径。')

```

# Page snapshot

```yaml
- generic [ref=f10e2]:
  - link "跳到主要内容" [ref=f10e3] [cursor=pointer]:
    - /url: "#main"
  - generic [ref=f10e4]:
    - banner [ref=f10e5]:
      - link "软考冲刺 系统分析师" [ref=f10e6] [cursor=pointer]:
        - /url: /
        - generic [aria-hidden] [ref=f10e7]: 析
        - generic [ref=f10e8]:
          - text: 软考冲刺
          - generic [ref=f10e9]: 系统分析师
      - generic [ref=f10e10]: 2026 · 原创资料
    - main [ref=f10e11]:
      - link "← 知识通关" [ref=f10e12] [cursor=pointer]:
        - /url: /learn
      - generic [ref=f10e13]:
        - text: K011 / A 级 / 学习中
        - heading "DFD四元素" [level=1] [ref=f10e14]
        - paragraph [ref=f10e15]: 需求/UML/建模
      - generic [ref=f10e16]:
        - generic [ref=f10e17]:
          - generic [ref=f10e18]: 零基础课程版 · 第 11 / 15 课
          - heading "这一课要解决什么" [level=2] [ref=f10e19]
          - paragraph [ref=f10e20]: DFD 数据流图像“数据物流图”：数据从谁来，经过什么处理，存到哪里，最后给谁。
          - generic [ref=f10e21]:
            - heading "业务场景 · 社区医院预约系统" [level=3] [ref=f10e22]
            - paragraph [ref=f10e23]: 患者提交姓名、就诊日期，预约系统检查号源并生成预约记录，再把结果返回给患者。
          - group [ref=f10e24]:
            - generic "为什么要学这一课" [ref=f10e25] [cursor=pointer]
            - paragraph [ref=f10e26]: 需求分析常常需要证明数据不会凭空出现、没有遗漏输入输出。DFD能发现流程描述中缺少的处理环节。
          - link "已理解，跳到闭卷自述 ↓" [ref=f10e27] [cursor=pointer]:
            - /url: "#closed-book"
        - region [ref=f10e28]:
          - heading "循序讲解" [level=2] [ref=f10e29]
          - paragraph [ref=f10e30]: 全部 4 步 · 阅读不会自动计入掌握
          - generic [ref=f10e31]:
            - heading "四种元素" [level=3] [ref=f10e32]
            - paragraph [ref=f10e33]: 外部实体：系统外发送或接收数据者，如患者；数据流：有名称的数据箭头，如预约申请；加工（Process）：转换/处理数据，如校验号源；数据存储：保存数据的地方，如预约记录库。
          - generic [ref=f10e34]:
            - heading "一个合法流动示例" [level=3] [ref=f10e35]
            - paragraph [ref=f10e36]: 患者（外部实体）→“预约申请”（数据流）→“受理预约”（加工）→“预约记录库”（存储）；加工→“预约结果”（数据流）→患者。
          - generic [ref=f10e37]:
            - heading "常见结构性错误" [level=3] [ref=f10e38]
            - paragraph [ref=f10e39]: 外部实体不应不经加工直接访问数据存储；数据存储间通常也要经过加工；一项加工不能没有输入就凭空产出业务数据。
          - generic [ref=f10e40]:
            - heading "分层和平衡" [level=3] [ref=f10e41]
            - paragraph [ref=f10e42]: 父图把“预约处理”视为一个加工，细化为“校验号源”“保存预约”等子加工。分解前后，与外界交换的数据流应保持平衡，不能无缘无故多出外部输入或少了外部输出。
          - button "逐步看" [ref=f10e44] [cursor=pointer]
        - region [ref=f10e45]:
          - heading "一步步做示例" [level=2] [ref=f10e46]
          - heading "检查这张医院数据流图" [level=3] [ref=f10e47]
          - list [ref=f10e48]:
            - listitem [ref=f10e49]: 输入：患者→预约申请→受理预约加工。
            - listitem [ref=f10e50]: 加工访问号源存储，必要时写预约存储。
            - listitem [ref=f10e51]: 输出：加工→预约成功/失败结果→患者。
            - listitem [ref=f10e52]: 如果画成“患者→预约记录库”，指出缺少接收、验证、存储等加工步骤。
            - listitem [ref=f10e53]: 若子图新增了“身份证照片”外部输入，而父图没有对应输入，应检查是否失去平衡。
        - region [ref=f10e54]:
          - heading "概念图示" [level=2] [ref=f10e55]
          - figure "DFD 简化示意：预约数据从哪里来" [ref=f10e56]:
            - paragraph [ref=f10e58]: 图示可以左右滑动；也可以展开下方文字版本。
            - region "DFD 简化示意：预约数据从哪里来 · 左右滑动" [ref=f10e59]:
              - img "患者（外部实体）→预约申请（数据流）→受理预约（加工）。加工↔数据存储：读写号源、预约记录。加工→预约结果（数据流）→患者。患者与存储之间没有直接连线。" [ref=f10e60]
            - paragraph [ref=f10e61]: 仅为理解 DFD 四元素的示意：正式 DFD 要使用规范的数据存储及加工符号；不要理解为患者可直接操作存储。
            - group [ref=f10e62]:
              - generic "图示的文字版本" [ref=f10e63] [cursor=pointer]
        - generic [ref=f10e64]:
          - heading "容易混淆" [level=2] [ref=f10e65]
          - paragraph [ref=f10e66]: DFD 中“外部实体→数据存储”直连是不规范的；DFD 的箭头承载“数据”，不是 UML 活动图那样的控制流。
          - heading "在考试中怎么用" [level=3] [ref=f10e67]
          - paragraph [ref=f10e68]: 案例题常考补 DFD 四元素、找非法数据路径和父子图平衡。
          - heading "记忆线索" [level=3] [ref=f10e69]
          - paragraph [ref=f10e70]: 谁来（实体）→送什么（流）→怎样处理（加工）→存哪里（存储）。
        - region [ref=f10e71]:
          - heading "原创课后理解练习" [level=2] [ref=f10e72]
          - paragraph [ref=f10e73]: 原创教学题 · 非官方真题 · 不进入原 150 道题库，不计客观掌握。作答只保留在当前页面，重做会收起答案。
          - article [ref=f10e74]:
            - heading "理解题 1 · DFD合法流向" [level=3] [ref=f10e75]
            - paragraph [ref=f10e76]: 哪一种 DFD 数据流连接一般应判为不合规范？
            - generic "理解题 1 选项" [ref=f10e77]:
              - button "A 外部实体→数据存储，不经过任何加工" [disabled] [pressed] [ref=f10e78]:
                - generic [ref=f10e79]: A
                - text: 外部实体→数据存储，不经过任何加工
              - button "B 加工→数据存储" [disabled] [ref=f10e80]:
                - generic [ref=f10e81]: B
                - text: 加工→数据存储
              - button "C 外部实体→加工" [disabled] [ref=f10e82]:
                - generic [ref=f10e83]: C
                - text: 外部实体→加工
              - button "D 数据存储→加工" [disabled] [ref=f10e84]:
                - generic [ref=f10e85]: D
                - text: 数据存储→加工
            - status [active] [ref=f10e86]:
              - strong [ref=f10e87]: 理解题答对了 · 正确答案 A
              - paragraph [ref=f10e88]: 本题只帮助理解，不计入首轮通过或客观掌握，也不进入错题本。
            - group [ref=f10e89]:
              - generic "逐项解析 · 理解题 1" [ref=f10e90] [cursor=pointer]
              - paragraph [ref=f10e91]:
                - strong [ref=f10e92]: A（正确）
                - text: ：正确：外部实体与存储间应通过加工处理。
              - paragraph [ref=f10e93]:
                - strong [ref=f10e94]: B（干扰项）
                - text: ：是常见合法路径。
              - paragraph [ref=f10e95]:
                - strong [ref=f10e96]: C（干扰项）
                - text: ：是常见合法路径。
              - paragraph [ref=f10e97]:
                - strong [ref=f10e98]: D（干扰项）
                - text: ：是常见合法路径。
            - button "重做理解题 1" [ref=f10e99] [cursor=pointer]
          - article [ref=f10e100]:
            - heading "理解题 2 · DFD分层平衡" [level=3] [ref=f10e101]
            - paragraph [ref=f10e102]: 父级 DFD“处理预约”从患者获取“预约申请”并向患者输出“处理结果”。子图只有读取号源和写记录，忘记“处理结果”。重点违反了？
            - generic "理解题 2 选项" [ref=f10e103]:
              - button "A 父图与子图的输入输出平衡" [ref=f10e104] [cursor=pointer]:
                - generic [ref=f10e105]: A
                - text: 父图与子图的输入输出平衡
              - button "B 接口调用必须同步返回的技术实现要求" [ref=f10e106] [cursor=pointer]:
                - generic [ref=f10e107]: B
                - text: 接口调用必须同步返回的技术实现要求
              - button "C 预约单的状态迁移规则" [ref=f10e108] [cursor=pointer]:
                - generic [ref=f10e109]: C
                - text: 预约单的状态迁移规则
              - button "D 类之间的组合所有权" [ref=f10e110] [cursor=pointer]:
                - generic [ref=f10e111]: D
                - text: 类之间的组合所有权
            - button "提交理解题 2" [disabled] [ref=f10e112]
        - generic [ref=f10e113]:
          - heading "闭卷自述" [level=2] [ref=f10e114]
          - paragraph [ref=f10e115]: 离开讲解，试着用自己的话回答。进入自测后会隐藏课程资料，沿用原知识卡的验收规则。
          - list [ref=f10e116]:
            - listitem [ref=f10e117]: 从“患者申请预约”中识别四个 DFD 元素并说出一个合法数据流。
            - listitem [ref=f10e118]: 为什么父图有“预约结果”输出时，子图也不能无故漏掉？
          - button "开始闭卷自测 →" [ref=f10e119] [cursor=pointer]
        - generic [ref=f10e120]:
          - paragraph [ref=f10e121]: 下一张 K012：如果发现医院预约流程本身太繁琐，怎样从业务流程层面改进。
          - link "继续零基础课程 · K012 →" [ref=f10e122] [cursor=pointer]:
            - /url: /learn/K012
          - paragraph [ref=f10e123]: 课程讲解、业务示例与理解题均为原创教学内容。
        - group [ref=f10e124]:
          - generic "考前速记 · 原始必背概念" [ref=f10e125] [cursor=pointer]
      - generic [ref=f10e126]:
        - heading "掌握记录" [level=2] [ref=f10e127]
        - paragraph [ref=f10e128]: 0 次闭卷尝试。仅自评验证，不能替代客观考试能力验证。
      - link "下一知识：业务流程重构 →" [ref=f10e129] [cursor=pointer]:
        - /url: /learn/K012
    - region "离线学习状态" [ref=f10e130]:
      - paragraph [ref=f10e131]:
        - strong [ref=f10e132]: 已联网
        - text: · 全部核心资料已缓存，可离线学习
      - button "请求浏览器持久保存本设备数据" [ref=f10e133] [cursor=pointer]
    - contentinfo [ref=f10e134]: 软考冲刺 · 系统分析师知识点掌握驱动 · 原创模拟训练
  - navigation "主导航" [ref=f10e135]:
    - link "今日" [ref=f10e136] [cursor=pointer]:
      - /url: /
      - generic [aria-hidden] [ref=f10e137]: ⌂
      - text: 今日
    - link "知识" [ref=f10e138] [cursor=pointer]:
      - /url: /learn
      - generic [aria-hidden] [ref=f10e139]: ▤
      - text: 知识
    - link "刷题" [ref=f10e140] [cursor=pointer]:
      - /url: /practice
      - generic [aria-hidden] [ref=f10e141]: ✓
      - text: 刷题
    - link "实战" [ref=f10e142] [cursor=pointer]:
      - /url: /cases
      - generic [aria-hidden] [ref=f10e143]: ◇
      - text: 实战
    - link "我的" [ref=f10e144] [cursor=pointer]:
      - /url: /progress
      - generic [aria-hidden] [ref=f10e145]: ◎
      - text: 我的
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { readFileSync } from "node:fs";
  3   | import type { BeginnerLesson } from "../../src/domain/lesson-schema";
  4   | import { knowledge, records, selfTest, answerCase, downloadBackup } from "../audit/helpers";
  5   | const raw=JSON.parse(readFileSync(new URL("../../src/data/lessons/day1_beginner_lessons.json",import.meta.url),"utf8")) as {lessons:BeginnerLesson[]};
  6   | 
  7   | const screenshotDir=process.env.BEGINNER_SCREENSHOTS || "docs/beginner-course/screenshots";
  8   | test("K001默认通俗解释/医院案例、循序讲解、带做和闭卷，速记最后折叠", async ({page}) => {
  9   |   const lesson=raw.lessons[0];
  10  |   await page.goto("/learn/K001");
  11  |   await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
  12  |   await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toBeVisible();
  13  |   await expect(page.getByRole("heading",{name:"必会概念",exact:true})).not.toBeVisible();
  14  |   await expect(page.locator(".lesson-step")).toHaveCount(1);
  15  |   for(let i=1;i<lesson.explanationSteps.length;i++) {
  16  |     await page.getByRole("button",{name:"懂了，下一步",exact:true}).click();
  17  |     await expect(page.getByRole("heading",{name:lesson.explanationSteps[i].heading,exact:true})).toBeFocused();
  18  |   }
  19  |   await page.getByRole("button",{name:"看全部",exact:true}).click();
  20  |   await expect(page.locator(".lesson-step")).toHaveCount(4);
  21  |   await expect(page.locator(".lesson-worked li")).toHaveCount(4);
  22  |   const card=(await records(page,"cards"))[0];expect(card.firstPassAt).toBeUndefined();
  23  |   await page.getByRole("button",{name:/开始闭卷自测/}).click();
  24  |   await expect(page.locator(".beginner-course")).toHaveCount(0);
  25  |   await expect(page.getByText(lesson.scenario.narrative,{exact:true})).toHaveCount(0);
  26  |   await expect(page.locator(".lesson-recall-prompts li")).toHaveCount(2);
  27  |   await expect(page.locator(".answer")).toHaveCount(0);
  28  |   await page.getByRole("textbox",{name:"闭卷回答"}).fill("保存我的独立理解，未交卷不算通过");
  29  |   await expect.poll(async()=> (await records(page,"learningDrafts"))[0]?.recall).toBe("保存我的独立理解，未交卷不算通过");
  30  |   await page.reload();
  31  |   await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("保存我的独立理解，未交卷不算通过");
  32  |   await page.getByRole("button",{name:"重新阅读资料"}).click();
  33  |   await expect(page.getByText(lesson.oneSentence,{exact:true})).toBeVisible();
  34  |   expect((await records(page,"cardAttempts"))).toEqual([]);
  35  | });
  36  | 
  37  | test("全部15课/30题/8图可学习，逐题交卷解析、错答、重做门禁与练习隔离", async ({page}) => {
  38  |   const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  39  |   for(const lesson of raw.lessons) {
  40  |     await page.goto(`/learn/${lesson.cardId}`);
  41  |     await expect(page.locator(".beginner-course")).toHaveAttribute("data-lesson-id",lesson.cardId);
  42  |     await page.getByText("为什么要学这一课",{exact:true}).click();
  43  |     await expect(page.getByText(lesson.whyLearn,{exact:true})).toBeVisible();
  44  |     await page.getByRole("button",{name:"看全部",exact:true}).click();
  45  |     await expect(page.locator(".lesson-step")).toHaveCount(lesson.explanationSteps.length);
  46  |     for(const s of lesson.explanationSteps) await expect(page.getByText(s.body,{exact:true})).toBeVisible();
  47  |     await expect(page.locator(".lesson-worked li")).toHaveText(lesson.workedExample.solutionSteps);
  48  |     await expect(page.locator("#closed-book li")).toHaveText(lesson.recallPrompts);
  49  |     await expect(page.getByText(lesson.distinguish,{exact:true})).toBeVisible();
  50  |     if(lesson.conceptVisual) {
  51  |       const image=page.locator(".lesson-visual img");await expect(image).toBeVisible();
  52  |       await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
  53  |       await expect(page.getByText(lesson.conceptVisual.note,{exact:true})).toBeVisible();
  54  |     }
  55  |     for(let i=0;i<2;i++) {
  56  |       const q=lesson.practiceQuestions[i]; const question=page.locator(`[data-question-id="${q.id}"]`);
  57  |       await expect(question.locator(".lesson-explanations")).toHaveCount(0);
  58  |       await expect(question.getByText(/正确答案/)).toHaveCount(0);
  59  |       await expect(question.getByRole("button",{name:`提交理解题 ${i+1}`})).toBeDisabled();
  60  |       // First question correct; second wrong, to exercise both grading paths.
  61  |       const selected=i===0?q.answer:(q.answer==='A'?'B':'A');
  62  |       await question.getByRole("button",{name:`${selected} ${q.options[selected as keyof typeof q.options]}`,exact:true}).click();
  63  |       await question.getByRole("button",{name:`提交理解题 ${i+1}`} ).click();
  64  |       await expect(question.getByRole("status")).toContainText(i===0?"理解题答对了":"再对照解析想一想");
  65  |       await expect(question.getByRole("status")).toContainText(`正确答案 ${q.answer}`);
> 66  |       for(const reason of Object.values(q.optionExplanations)) await expect(question.getByText(reason,{exact:false})).toBeVisible();
      |                                                                                                                       ^ Error: expect(locator).toBeVisible() failed
  67  |       await expect(question.locator(".option-button:disabled")).toHaveCount(4);
  68  |       await question.getByRole("button",{name:`重做理解题 ${i+1}`} ).click();
  69  |       await expect(question.locator(".lesson-explanations")).toHaveCount(0);
  70  |       await expect(question.getByText(/正确答案/)).toHaveCount(0);
  71  |       await expect(question.getByRole("button",{name:`提交理解题 ${i+1}`})).toBeDisabled();
  72  |     }
  73  |     await page.getByTestId("exam-speed-notes").locator("summary").click();
  74  |     const card=knowledge.find(k=>k.id===lesson.cardId)!;
  75  |     await expect(page.getByTestId("exam-speed-notes").getByText(card.essentials,{exact:true})).toBeVisible();
  76  |     await expect(page.getByTestId("exam-speed-notes").getByText(card.pitfalls,{exact:true})).toBeVisible();
  77  |   }
  78  |   for(const table of ["cardAttempts","questionAttempts","sessions"]) expect(await records(page,table)).toEqual([]);
  79  |   expect((await records(page,"cards")).every(k=>!k.firstPassAt)).toBe(true);
  80  |   expect(errors).toEqual([]);
  81  | });
  82  | 
  83  | test("K006 include/extend、K010生命周期、K011非法流向与分层平衡，未提供课程的卡明确标记", async ({page}) => {
  84  |   const keyText:Record<string,string[]>={
  85  |     K006:["include 与 extend","条件可选行为","extend 的箭头指向被扩展用例"],
  86  |     K010:["聚合与组合","整体生命周期约束","不把医生作为医院的组合部分"],
  87  |     K011:["四种元素","外部实体不应不经加工直接访问数据存储","分解前后，与外界交换的数据流应保持平衡"],
  88  |   };
  89  |   for(const [id,texts] of Object.entries(keyText)) {
  90  |     await page.goto(`/learn/${id}`);await page.getByRole("button",{name:"看全部",exact:true}).click();
  91  |     for(const text of texts) await expect(page.locator(".beginner-course").getByText(text,{exact:false}).first()).toBeVisible();
  92  |   }
  93  |   await page.goto("/learn/K015");
  94  |   await expect(page.getByText("考前速记版",{exact:true})).toBeVisible();
  95  |   await expect(page.getByText(/此知识点暂无完整入门课程/)).toBeVisible();
  96  |   await expect(page.locator(".beginner-course")).toHaveCount(0);
  97  |   await expect(page.getByRole("heading",{name:"必会概念",exact:true})).toBeVisible();
  98  |   await page.goto("/learn");
  99  |   await expect(page.getByText("零基础课程版",{exact:true})).toHaveCount(15);
  100 |   await expect(page.getByText("考前速记版 · 暂无完整入门课程",{exact:true})).toHaveCount(61);
  101 | });
  102 | 
  103 | for(const width of [320,375,390,430]) test(`${width}px课程长文、8图局部滚动、点击区域与闭卷缩小视口`, async ({page})=>{
  104 |   await page.setViewportSize({width,height:844});
  105 |   for(const id of ["K001","K006","K010","K011"]) {
  106 |     await page.goto(`/learn/${id}`);await expect(page.locator(".beginner-course")).toBeVisible();
  107 |     expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  108 |     await page.getByRole("button",{name:"看全部",exact:true}).click();
  109 |     const small=await page.locator("main button,main summary,.bottom-nav>a").evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44)?[el.textContent]:[]}));
  110 |     expect(small).toEqual([]);
  111 |     if(id!=='K001') {
  112 |       const diagram=page.locator(".lesson-diagram-scroll");
  113 |       expect(await diagram.evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(true);
  114 |       await diagram.evaluate(el=>el.scrollLeft=el.scrollWidth);
  115 |       expect(await diagram.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  116 |       expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  117 |     }
  118 |     await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  119 |     const bounds=await page.evaluate(()=>({footer:document.querySelector('.site-footer')!.getBoundingClientRect().bottom,nav:document.querySelector('.bottom-nav')!.getBoundingClientRect().top}));
  120 |     expect(bounds.footer).toBeLessThanOrEqual(bounds.nav+1);
  121 |     await page.evaluate(()=>window.scrollTo(0,0));
  122 |     if(width===375||width===390) await page.screenshot({path:`${screenshotDir}/after-${id}-${width}.png`,fullPage:true});
  123 |   }
  124 |   await page.goto("/learn/K001");await page.getByRole("button",{name:/开始闭卷自测/}).click();
  125 |   const editor=page.getByRole("textbox",{name:"闭卷回答"});await editor.focus();
  126 |   await page.setViewportSize({width,height:500});await editor.evaluate(el=>el.scrollIntoView({block:'center'}));
  127 |   await editor.fill("缩小视口仍能输入自己的理解");
  128 |   await expect.poll(async()=> (await records(page,"learningDrafts"))[0]?.recall).toBe("缩小视口仍能输入自己的理解");
  129 |   const box=await editor.boundingBox();expect(box!.y).toBeLessThan(420);expect(box!.y+box!.height).toBeGreaterThan(0);
  130 | });
  131 | 
  132 | test("12类旧数据逐字段保留、理解练习不污染、JSON清空/恢复及损坏备份无副作用",async({page})=>{
  133 |   await page.goto("/learn/K001");await selfTest(page);
  134 |   await page.goto("/practice?question=RK001");await page.getByRole("button",{name:/B.*包含过多接口细节/}).click();
  135 |   await page.getByRole("button",{name:"提交答案",exact:true}).click();await expect(page.getByText("已加入错题本",{exact:true})).toBeVisible();
  136 |   await page.goto("/cases/C01");await answerCase(page,"C01","alternate");
  137 |   await page.goto("/essays/E01");await page.getByRole("button",{name:"新建项目素材"}).click();
  138 |   await page.getByRole("textbox",{name:"项目名称",exact:true}).fill("课程升级兼容性素材");
  139 |   await page.getByRole("textbox",{name:"我的论文提纲"}).fill("旧提纲保留");
  140 |   await page.getByRole("textbox",{name:"我的论文正文"}).fill("旧正文📝逐字段保持");
  141 |   await expect.poll(async()=> (await records(page,"essayDrafts"))[0]?.body).toBe("旧正文📝逐字段保持");
  142 |   await page.goto("/learn/K002");await page.getByRole("button",{name:/开始闭卷自测/}).click();
  143 |   await page.getByRole("textbox",{name:"闭卷回答"}).fill("课程上线前的未完成独立回答");
  144 |   await expect.poll(async()=> (await records(page,"learningDrafts")).find(d=>d.cardId==='K002')?.recall).toBe("课程上线前的未完成独立回答");
  145 |   await page.goto("/mock");await page.getByRole("button",{name:"开始本场完整模考"}).click();
  146 |   await page.getByRole("button",{name:"收藏本题",exact:true}).click();
  147 |   await page.getByRole("button",{name:/D.*输入输出数据流平衡/}).click();
  148 |   await expect(page.getByRole("heading",{name:"选择卷 · 已答 1 / 75题"})).toBeVisible();
  149 |   await page.goto("/progress");await page.getByLabel("学习启动日期").fill("2026-10-10");
  150 |   await page.getByRole("button",{name:"保存启动日"}).click();await expect(page.getByRole("status")).toContainText("启动日已保存");
  151 |   const {backup,path}=await downloadBackup(page);
  152 |   expect(Object.keys(backup.data)).toHaveLength(12);
  153 |   for(const [table,rows] of Object.entries(backup.data)) expect((rows as unknown[]).length,table).toBeGreaterThan(0);
  154 |   await page.goto("/learn/K001");
  155 |   const q=raw.lessons[0].practiceQuestions[0];
  156 |   await page.locator(`[data-question-id="${q.id}"]`).getByRole("button",{name:`${q.answer} ${q.options[q.answer as keyof typeof q.options]}`,exact:true}).click();
  157 |   await page.getByRole("button",{name:"提交理解题 1"}).click();
  158 |   await page.reload();await expect(page.locator(".lesson-explanations")).toHaveCount(0);
  159 |   await page.goto("/learn/K002");await expect(page.getByRole("textbox",{name:"闭卷回答"})).toHaveValue("课程上线前的未完成独立回答");
  160 |   await page.goto("/progress");expect((await downloadBackup(page)).backup.data).toEqual(backup.data);
  161 |   await page.getByRole("button",{name:"重置学习数据…"}).click();
  162 |   await page.getByRole("button",{name:"再次确认，清空全部学习数据"}).click();
  163 |   await expect(page.getByRole("status").filter({hasText:"已重置"})).toBeVisible();
  164 |   for(const table of Object.keys(backup.data)) expect(await records(page,table)).toEqual([]);
  165 |   await page.getByLabel("选择备份 JSON（最多20MB）").setInputFiles(path);
  166 |   await expect(page.getByRole("heading",{name:"校验通过 · 恢复预览"})).toBeVisible();
```