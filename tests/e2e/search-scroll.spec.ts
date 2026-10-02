import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  for (const path of ["/", "/products"]) {
    test(`navbar search preserves page position on ${path} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const search = page
        .getByRole("search", { name: "Tìm sản phẩm toàn cửa hàng" })
        .getByRole("textbox");
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
      await search.click();
      await expect(search).toBeFocused();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
      await search.pressSequentially("MacBook", { delay: 30 });
      await expect(search).toHaveValue("MacBook");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
      await search.press("Backspace");
      await expect(search).toHaveValue("MacBoo");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
      await search.fill("");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(500);
      await expect(page).toHaveURL(path);
    });
  }
}

test("desktop filters stay accessible while browsing and quick prices persist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/products");
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "29 sản phẩm",
  );
  await page.evaluate(() => window.scrollTo(0, 600));
  const filters = page.getByRole("complementary", { name: "Bộ lọc sản phẩm" });
  const header = page.getByRole("banner");
  await expect
    .poll(async () => {
      const panel = await filters.boundingBox();
      const navbar = await header.boundingBox();
      return (
        !!panel &&
        !!navbar &&
        panel.y >= navbar.y + navbar.height &&
        panel.y < 160
      );
    })
    .toBe(true);
  await filters.getByLabel("Khoảng giá nhanh", { exact: true }).click();
  await page.getByRole("option", { name: "Dưới 5 triệu", exact: true }).click();
  await expect(page).toHaveURL(/maxPrice=4999999/);
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "9 sản phẩm",
  );
  await page.reload();
  await expect(
    filters.getByLabel("Khoảng giá nhanh", { exact: true }),
  ).toContainText("Dưới 5 triệu");
  await filters.getByRole("button", { name: "Đặt lại bộ lọc" }).click();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "29 sản phẩm",
  );
});
