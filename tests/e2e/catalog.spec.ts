import { test, expect } from "@playwright/test";

test("home categories and header search lead to the matching products", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Laptop Làm việc & sáng tạo" }).click();
  await expect(page).toHaveURL(/category=laptop/);
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "11 sản phẩm",
  );
  const search = page.getByRole("search", {
    name: "Tìm sản phẩm toàn cửa hàng",
  });
  await search
    .getByRole("textbox", { name: "Tìm sản phẩm", exact: true })
    .fill("NUT-0005");
  await search.getByRole("button", { name: "Tìm sản phẩm" }).click();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "1 sản phẩm",
  );
  await page.getByRole("link", { name: /iPhone 15/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("iPhone 15");
  await expect(page).toHaveTitle("iPhone 15 · NUTEE");
});

test("filters, sort and pagination survive refresh, detail navigation and browser back", async ({
  page,
}) => {
  await page.goto("/products");
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "29 sản phẩm",
  );
  await page.getByRole("button", { name: "Trang 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Trang 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByLabel("Sắp xếp", { exact: true }).click();
  await page.getByRole("option", { name: "Giá tăng dần" }).click();
  await expect(page).toHaveURL(/sort=price-asc$/);
  await page.getByLabel("Keychron", { exact: true }).click();
  await expect(page.getByLabel("Keychron", { exact: true })).toBeChecked();
  await page.getByLabel("Giá đến", { exact: true }).fill("2600000");
  await page.getByRole("button", { name: "Áp dụng khoảng giá" }).click();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "3 sản phẩm",
  );
  const listUrl = page.url();
  await page
    .getByRole("link", { name: /Keychron K8/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Keychron K8",
  );
  await page.getByRole("link", { name: "Quay lại danh sách" }).click();
  await expect(page).toHaveURL(listUrl);
  await expect(page.getByLabel("Keychron", { exact: true })).toBeChecked();
  await page.reload();
  await expect(page.getByLabel("Giá đến", { exact: true })).toHaveValue(
    "2600000",
  );
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "29 sản phẩm",
  );
  await page.goBack();
  await expect(page).toHaveURL(listUrl);
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "3 sản phẩm",
  );
});

test("specification facets and empty results can be cleared", async ({
  page,
}) => {
  await page.goto("/products?category=laptop");
  await page.getByLabel("256GB", { exact: true }).click();
  await expect(page.getByLabel("256GB", { exact: true })).toBeChecked();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "3 sản phẩm",
  );
  await expect(page).toHaveURL(/spec.storage=256GB/);
  const search = page.getByRole("search", { name: "Tìm trong danh mục" });
  await search.getByLabel("Tìm tên, mã hoặc cấu hình").fill("khongtimthay");
  await search.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy sản phẩm" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "29 sản phẩm",
  );
});

test("detail gallery works by keyboard, shows specifications and purchased reviews", async ({
  page,
}) => {
  await page.goto("/products/product-5");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("iPhone 15");
  const thumbnail = page.getByRole("button", { name: /Xem ảnh 2:/ });
  await thumbnail.focus();
  await page.keyboard.press("Enter");
  await expect(thumbnail).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("img", { name: "Góc nhìn tổng quan iPhone 15 (minh họa)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("table", { name: "Thông số kỹ thuật" }),
  ).toContainText("128GB");
  await expect(page.getByText("Minh Anh", { exact: true })).toBeVisible();
  await expect(page.getByText(/Đã mua hàng/)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Đường dẫn danh mục" })
    .getByRole("link", { name: "Điện thoại", exact: true })
    .click();
  await expect(page).toHaveURL(/category=smartphone/);
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "9 sản phẩm",
  );
});

test("hidden and missing products are unavailable, sold-out items remain readable", async ({
  page,
}) => {
  for (const id of ["product-30", "missing"]) {
    await page.goto(`/products/${id}`);
    await expect(
      page.getByRole("heading", { name: "Không tìm thấy sản phẩm" }),
    ).toBeVisible();
  }
  await page.goto("/products/product-29");
  await expect(page.getByText("Hết hàng", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chưa có đánh giá" }),
  ).toBeVisible();
  await page.goto("/products?inStock=true&page=999&sort=invalid");
  await expect(page).toHaveURL(/inStock=true&page=3$/);
  await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "28 sản phẩm",
  );
});

test("open catalog and detail react to price and visibility changes from management", async ({
  page,
  context,
}) => {
  await page.goto("/products/product-1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "MacBook Air M3",
  );
  const list = await context.newPage();
  await list.goto("/products?q=NUT-0001");
  await expect(list.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "1 sản phẩm",
  );
  const admin = await context.newPage();
  await admin.goto("/management/login");
  await admin.getByLabel("Email", { exact: true }).fill("admin@nutee.demo");
  await admin.getByLabel("Mật khẩu demo", { exact: true }).fill("Nutee@123");
  await admin.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await admin.goto("/management/products");
  await admin.getByRole("button", { name: "Sửa", exact: true }).first().click();
  await admin.getByLabel("Tên sản phẩm").fill("MacBook M2 live update");
  await admin.getByLabel("Giá (VND)").fill("15000000");
  await admin.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "MacBook M2 live update",
  );
  await expect(
    list.getByRole("heading", { name: "MacBook M2 live update" }),
  ).toBeVisible();
  await admin.getByRole("button", { name: "Sửa", exact: true }).first().click();
  await admin.getByLabel("Trạng thái", { exact: true }).click();
  await admin.getByRole("option", { name: "Ẩn", exact: true }).click();
  await admin.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy sản phẩm" }),
  ).toBeVisible();
  await expect(list.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
    "0 sản phẩm",
  );
});

for (const width of [375, 768, 1024, 1440]) {
  test(`catalog and detail fit ${width}px, filter drawer restores focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/products");
    await expect(page.getByRole("status", { name: "Số sản phẩm" })).toHaveText(
      "29 sản phẩm",
    );
    if (width < 900) {
      const trigger = page.getByRole("button", { name: "Bộ lọc", exact: true });
      await trigger.click();
      const checkbox = page.getByRole("checkbox", {
        name: "Keychron",
        exact: true,
      });
      await checkbox.click();
      await expect(checkbox).toBeChecked();
      await expect(checkbox).toBeFocused();
      await page.getByRole("button", { name: "Xem kết quả" }).click();
      await expect(
        page.getByRole("status", { name: "Số sản phẩm" }),
      ).toHaveText("6 sản phẩm");
      await expect(trigger).toBeFocused();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("link", {
        name: width < 900 ? /Keychron K2 Pro/ : /MacBook Air M3/,
      })
      .first()
      .click();
    await expect(
      page.getByRole("heading", { name: "Thông số kỹ thuật" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 375) {
      await page.setViewportSize({ width: 812, height: 375 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
}
