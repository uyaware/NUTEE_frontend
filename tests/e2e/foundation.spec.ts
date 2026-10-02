import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
async function login(page: Page, role: "customer" | "staff" | "admin") {
  await page.goto(role === "customer" ? "/login" : "/management/login");
  await page.getByLabel("Email", { exact: true }).fill(`${role}@nutee.demo`);
  await page.getByLabel("Mật khẩu demo", { exact: true }).fill("Nutee@123");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(
    role === "customer" ? /\/account\/profile$/ : /\/management$/,
  );
}
test("two sessions coexist, customer logout leaves staff authenticated, staff is denied admin routes", async ({
  page,
}) => {
  await login(page, "customer");
  await login(page, "staff");
  await page.goto("/management/users");
  await expect(
    page.getByRole("heading", { name: "Bạn chưa có quyền truy cập" }),
  ).toBeVisible();
  await page.goto("/account/profile");
  await page.getByRole("button", { name: "Đăng xuất cửa hàng" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/management");
  await expect(
    page.getByRole("heading", { name: "Chào Linh Nguyễn." }),
  ).toBeVisible();
});
test("admin mutation persists and invalidates storefront in another tab", async ({
  page,
  context,
}) => {
  await login(page, "admin");
  const storefront = await context.newPage();
  await storefront.goto("/");
  await page.goto("/management/products");
  await page.getByRole("button", { name: "Sửa", exact: true }).first().click();
  await page.getByLabel("Tên sản phẩm").fill("MacBook demo persistence");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(
    storefront.getByRole("heading", { name: "MacBook demo persistence" }),
  ).toBeVisible();
  await storefront.reload();
  await expect(
    storefront.getByRole("heading", { name: "MacBook demo persistence" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("rowheader", { name: /MacBook demo persistence/ }),
  ).toBeVisible();
});
test("reset confirms, preserves unrelated storage, clears both sessions and restores seed", async ({
  page,
}) => {
  await login(page, "customer");
  await login(page, "admin");
  await page.goto("/management/demo");
  await page.evaluate(() => localStorage.setItem("unrelated-key", "keep"));
  await page.getByRole("button", { name: "Đặt lại demo", exact: true }).click();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(
    await page.evaluate(() => localStorage.getItem("nutee:session:customer")),
  ).not.toBeNull();
  await page.getByRole("button", { name: "Đặt lại demo", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận đặt lại" }).click();
  await expect(page).toHaveURL(/\/management\/login$/);
  expect(await page.evaluate(() => localStorage.getItem("unrelated-key"))).toBe(
    "keep",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("nutee:session:customer")),
  ).toBeNull();
  expect(
    await page.evaluate(() => localStorage.getItem("nutee:session:backoffice")),
  ).toBeNull();
});
test("corrupt DB is preserved until explicit recovery", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("nutee:db:v1", "{bad"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Cần khôi phục dữ liệu demo" }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("nutee:db:v1"))).toBe(
    "{bad",
  );
  await page.getByRole("button", { name: "Đặt lại demo", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận đặt lại" }).click();
  await expect(
    page.getByRole("heading", { name: /Công nghệ cho/ }),
  ).toBeVisible();
});
for (const width of [375, 768, 1024, 1440]) {
  test(`storefront fits viewport ${width}px and mobile navigation works`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Công nghệ cho/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width < 900) {
      await page.getByRole("button", { name: "Mở menu cửa hàng" }).click();
      await page.getByRole("button", { name: "Đóng menu" }).click();
    }
  });
}
