import { expect, type Locator, type Page } from "@playwright/test";
import { records } from "../audit/helpers";

const screenshots = process.env.UI_SCREENSHOTS || "tmp/ui-polish/screenshots";

// Check actual geometry: a visible row must have equal button edges, no overlap,
// comfortable tap targets and a gap even when a narrow viewport wraps it.
export async function aligned(row: Locator) {
  // IndexedDB-backed pages can still be loading immediately after navigation.
  await expect(row).toBeVisible();
  await expect(row.locator(":scope > button, :scope > a").first()).toBeVisible();
  const bounds = await row.locator(":scope > button, :scope > a").evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return { x: r.x, y: r.y, width: r.width, height: r.height, top: s.marginTop, bottom: s.marginBottom };
    }),
  );
  expect(bounds.length).toBeGreaterThan(0);
  for (const b of bounds) {
    expect(b.height).toBeGreaterThanOrEqual(48);
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.top).toBe("0px");
    expect(b.bottom).toBe("0px");
  }
  for (let i = 1; i < bounds.length; i++) {
    const previous = bounds[i - 1], current = bounds[i];
    if (Math.abs(previous.y - current.y) < 1) {
      expect(Math.abs(previous.height - current.height)).toBeLessThan(1);
      expect(current.x - previous.x - previous.width).toBeGreaterThanOrEqual(9);
    } else {
      expect(current.y - previous.y - previous.height).toBeGreaterThanOrEqual(9);
    }
  }
}

export async function controlsFit(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bad = await page.locator("main button, main summary, main input:not([type=checkbox]), main select, main textarea, main .secondary, main .text-link, .pwa-status button, .check-row, .bottom-nav > a").evaluateAll((els) =>
    els.flatMap((el) => {
      const r = el.getBoundingClientRect();
      // Inputs inside folded details are not rendered. Checkbox targets are
      // their enclosing labels; audit those separately rather than the icon.
      return r.width && r.height && (r.height < 44 || r.width < 44 || r.left < -1 || r.right > innerWidth + 1)
        ? [{ text: el.textContent, class: el.className, x: r.x, width: r.width, height: r.height }] : [];
    }),
  );
  expect(bad).toEqual([]);
  for (const row of await page.locator(".button-row").all()) if (await row.isVisible()) await aligned(row);
}

export async function courseSteps(page: Page, width: number, name = "chromium") {
  await page.setViewportSize({ width, height: 844 });
  await page.goto("/learn/K001");
  const section = page.locator('section[aria-labelledby="lesson-explanation-title"]');
  await expect(section).toBeVisible();
  const next = section.getByRole("button", { name: "懂了，下一步", exact: true });
  const all = section.getByRole("button", { name: "看全部", exact: true });
  for (let step = 1; step <= 4; step++) {
    const row = section.locator(".button-row");
    await aligned(row);
    if (step <= 2) {
      // The requested first pair / previous-next pair must stay together.
      const buttons = await row.getByRole("button").all();
      const a = await buttons[0].boundingBox(), b = await buttons[1].boundingBox();
      expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
      expect(Math.abs(a!.height - b!.height)).toBeLessThan(1);
      if (width === 375 || width === 390) await section.screenshot({ path: `${screenshots}/after-K001-${width}-${name}-step${step}.png` });
    }
    if (step < 4) await next.click();
  }
  await all.click();
  await expect(section.locator(".lesson-step")).toHaveCount(4);
  await aligned(section.locator(".button-row"));
  await section.getByRole("button", { name: "逐步看", exact: true }).click();
  await section.getByRole("button", { name: "上一步", exact: true }).click();
  await aligned(section.locator(".button-row"));
  await controlsFit(page);
  expect(await records(page, "cardAttempts")).toEqual([]);
  expect(await records(page, "questionAttempts")).toEqual([]);
}

