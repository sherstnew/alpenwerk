import { expect, test } from "@playwright/test";
import { calculateDeposit, clampAmount, products } from "../src/bank";
import { dictionaries, locales } from "../src/i18n";
import type { Language } from "../src/i18n";

test("known formula results, bounds and monthly breakdown", () => {
  const simple = calculateDeposit({
    principal: 100000,
    annualRate: 1.8,
    months: 12,
    compound: false,
  });
  expect(simple.income).toBeCloseTo(1800, 8);
  expect(simple.total).toBeCloseTo(101800, 8);
  const compound = calculateDeposit({
    principal: 100000,
    annualRate: 1.8,
    months: 12,
    compound: true,
  });
  expect(compound.income).toBeCloseTo(1814.9245012, 5);
  expect(compound.points).toHaveLength(13);
  expect(compound.points[0].total).toBe(100000);
  expect(compound.points[12].total).toBe(compound.total);
  expect(
    calculateDeposit({
      principal: 10000,
      annualRate: 0,
      months: 24,
      compound: true,
    }).income,
  ).toBe(0);
  expect(clampAmount(1)).toBe(10000);
  expect(clampAmount(9999999)).toBe(1000000);
  expect(clampAmount(NaN)).toBe(10000);
  expect(() =>
    calculateDeposit({
      principal: -1,
      annualRate: 2,
      months: 6,
      compound: true,
    }),
  ).toThrow();
  expect(() =>
    calculateDeposit({
      principal: 10000,
      annualRate: 2,
      months: 6.5,
      compound: true,
    }),
  ).toThrow();
  expect(Object.keys(dictionaries.de).sort()).toEqual(
    Object.keys(dictionaries.ru).sort(),
  );
  expect(Object.keys(dictionaries.en).sort()).toEqual(
    Object.keys(dictionaries.ru).sort(),
  );
});

test("language persistence, private form data, focus trap and reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page
    .locator("header")
    .getByRole("button", { name: "Deutsch", exact: true })
    .click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.locator(".result-apply").click();
  await page.locator("#application-name").fill("Lena Baumann");
  await page.locator("#application-email").fill("lena@example.com");
  await page.locator(".close-button").focus();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.locator(".result-apply")).toBeFocused();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "lena",
  );
  const duration = await page
    .locator(".chart-dot")
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration).toBe("0s");
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await expect(page.locator(".skip-link")).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await page.locator(".result-apply").click();
  await expect(page.locator("#application-name")).toHaveValue("");
  await expect(page.locator("#application-email")).toHaveValue("");
});

for (const lang of ["ru", "de", "en"] as Language[]) {
  for (const width of [375, 768, 1440]) {
    test(`${lang} / ${width}: calculation, dialogs, application and responsive layout`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (l) => localStorage.setItem("alpenwerk-language", l),
        lang,
      );
      const failures: string[] = [];
      page.on("pageerror", (e) => failures.push(e.message));
      await page.goto("/");
      const t = dictionaries[lang];
      const grouped = (value: number) =>
        new Intl.NumberFormat(locales[lang], {
          maximumFractionDigits: 0,
        }).format(value);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page).toHaveTitle(t.title);
      await expect(page.locator("h1")).toContainText(t.heroFirst);
      await expect(page.locator(".hero-panorama img")).toHaveJSProperty(
        "naturalWidth",
        1400,
      );
      await expect(page.locator("#compound")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await page.locator("#deposit-amount").fill("250000");
      await expect(page.locator("#amount-slider")).toHaveValue("250000");
      await page
        .locator(".segmented")
        .getByRole("button", { name: "EUR", exact: true })
        .click();
      await expect(page.locator("#deposit-amount")).toHaveValue(
        grouped(250000),
      );
      await page.locator("#compound").click();
      await page.locator(".term-buttons button").last().click();
      await expect(page.locator(".result-heading")).toContainText("Horizon");
      const expectedIncome = new Intl.NumberFormat(locales[lang], {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(15000);
      await expect(page.locator(".income-value")).toContainText(expectedIncome);
      await expect(page.locator(".quick-meta")).toContainText("Horizon");
      await page.locator("#term-slider").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator(".result-heading")).toContainText("Panorama");
      await expect(page.locator(".product.is-selected h3")).toHaveText(
        "Panorama",
      );
      await page.locator("#amount-slider").focus();
      await page.keyboard.press("Home");
      await expect(page.locator("#deposit-amount")).toHaveValue(grouped(10000));
      await page.keyboard.press("End");
      await expect(page.locator("#deposit-amount")).toHaveValue(
        grouped(1000000),
      );
      await page.locator("#deposit-amount").fill("9000000");
      await expect(page.locator("#amount-error")).toBeVisible();
      await page.locator("#deposit-amount").blur();
      await expect(page.locator("#deposit-amount")).toHaveValue(
        grouped(1000000),
      );
      await page.locator("#deposit-amount").fill("");
      await page.locator("#deposit-amount").blur();
      await expect(page.locator("#deposit-amount")).toHaveValue(grouped(10000));
      await page.locator(".monthly-details summary").click();
      await expect(page.locator(".monthly-details tbody tr")).toHaveCount(13);
      await page.locator(".monthly-details summary").click();
      await page.getByRole("button", { name: t.compare, exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator(".comparison-table")).toContainText("Basis");
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await expect(
        page.getByRole("button", { name: t.compare, exact: true }),
      ).toBeFocused();
      await page.locator(".product-details").first().click();
      await expect(page.locator("#dialog-title")).toContainText("Basis");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: t.choose, exact: true })
        .click();
      await expect(page.locator(".result-heading")).toContainText("Basis");
      await page.locator(".result-apply").click();
      await page
        .getByRole("button", { name: t.formSubmit, exact: true })
        .click();
      await expect(page.locator("#name-error")).toBeVisible();
      await expect(page.locator("#application-name")).toBeFocused();
      await page.locator("#application-name").fill("Mara Keller");
      await page.locator("#application-email").fill("invalid");
      await page
        .getByRole("button", { name: t.formSubmit, exact: true })
        .click();
      await expect(page.locator("#email-error")).toBeVisible();
      await page.locator("#application-email").fill("mara@example.com");
      const otherLang = lang === "de" ? "ru" : "de";
      await page
        .getByRole("dialog")
        .getByRole("button", {
          name: otherLang === "ru" ? "Русский" : "Deutsch",
          exact: true,
        })
        .click();
      await expect(page.locator("#application-name")).toHaveValue(
        "Mara Keller",
      );
      await expect(page.locator("#application-email")).toHaveValue(
        "mara@example.com",
      );
      await page
        .getByRole("dialog")
        .getByRole("button", {
          name:
            lang === "ru" ? "Русский" : lang === "de" ? "Deutsch" : "English",
          exact: true,
        })
        .click();
      const submitted: string[] = [];
      page.on("request", (r) => {
        if (r.method() === "POST") submitted.push(r.url());
      });
      await page
        .getByRole("button", { name: t.formSubmit, exact: true })
        .click();
      await expect(page.locator("#success-heading")).toHaveText(t.successTitle);
      await expect(page.locator(".dialog-description")).toContainText(
        t.successDescription,
      );
      expect(submitted).toHaveLength(0);
      await page
        .getByRole("button", { name: t.successBack, exact: true })
        .click();
      await page.locator(".faq-list summary").first().click();
      await expect(page.locator(".faq-list details").first()).toHaveAttribute(
        "open",
        "",
      );
      if (width < 901) {
        await page.locator(".menu-toggle").click();
        await expect(page.locator(".mobile-nav")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator(".mobile-nav")).not.toBeVisible();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      expect(failures).toHaveLength(0);
      expect(products.map((p) => p.months)).toEqual([6, 12, 24]);
    });
  }
}
