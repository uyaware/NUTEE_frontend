import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function login(
  page: Page,
  email = "customer@nutee.demo",
  returnTo = "/cart",
) {
  await page.goto(`/login?${new URLSearchParams({ returnTo })}`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${returnTo}$`));
}
async function addGuest(page: Page, quantity = "2") {
  await page.goto("/products/product-1");
  await page.getByLabel("Số lượng", { exact: true }).fill(quantity);
  await page.getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã thêm vào giỏ");
  await page.getByRole("link", { name: "Xem giỏ hàng" }).click();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
  ).toBeVisible();
}

test("guest cart persists, login merges once, quantity/remove persist, logout and switching users isolate carts", async ({
  page,
}) => {
  await addGuest(page);
  let item = page.getByRole("article");
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("2");
  await page.reload();
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("2");
  await page.getByRole("link", { name: "Đăng nhập và gộp giỏ" }).click();
  await page.getByLabel("Email", { exact: true }).fill("customer@nutee.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("3");
  await item
    .getByRole("button", { name: "Tăng số lượng MacBook Air M3" })
    .click();
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("4");
  await page.reload();
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("4");
  await page.goto("/account/profile");
  await page.getByRole("button", { name: "Đăng xuất cửa hàng" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/cart");
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
  await login(page, "customer2@nutee.demo");
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
  await login(page);
  item = page.getByRole("article");
  await expect(
    item.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("4");
  await item
    .getByRole("button", { name: "Xóa MacBook Air M3 khỏi giỏ" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
});

test("guest mutations invalidate another tab, and admin price/hide changes revalidate cart lines", async ({
  page,
  context,
}) => {
  await addGuest(page, "1");
  const other = await context.newPage();
  await other.goto("/cart");
  await expect(
    other.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("1");
  await page
    .getByRole("button", { name: "Tăng số lượng MacBook Air M3" })
    .click();
  await expect(
    other.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("2");
  const admin = await context.newPage();
  await admin.goto("/management/login");
  await admin.getByLabel("Email", { exact: true }).fill("admin@nutee.demo");
  await admin.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await admin.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(admin).toHaveURL(/\/management$/);
  await admin.goto("/management/products");
  await admin.getByRole("button", { name: "Sửa", exact: true }).first().click();
  await admin.getByLabel("Giá (VND)").fill("12000000");
  await admin.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(other.getByRole("article")).toContainText("12.000.000");
  await expect(page.getByRole("article")).toContainText("24.000.000");
  await admin.getByRole("button", { name: "Sửa", exact: true }).first().click();
  await admin.getByLabel("Trạng thái").click();
  await admin.getByRole("option", { name: "Ẩn" }).click();
  await admin.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByRole("article")).toContainText(
    "Sản phẩm đã ngừng bán",
  );
  await expect(
    page.getByRole("button", { name: "Tăng số lượng MacBook Air M3" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Xóa MacBook Air M3 khỏi giỏ" })
    .click();
  await expect(
    other.getByRole("heading", { name: "Giỏ hàng đang trống" }),
  ).toBeVisible();
});

test("address validation, CRUD, defaults and persistence keep another customer unchanged", async ({
  page,
}) => {
  await login(page, "customer@nutee.demo", "/account/addresses");
  await page.getByRole("button", { name: "Thêm địa chỉ", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Lưu địa chỉ" }).click();
  await expect(
    dialog.getByRole("alert").filter({ hasText: "Kiểm tra các trường sau" }),
  ).toBeFocused();
  await dialog
    .getByRole("link", { name: "Tên người nhận cần từ 2 đến 80 ký tự." })
    .click();
  await expect(dialog.getByLabel("Người nhận")).toBeFocused();
  await expect(
    dialog.getByText("Tên người nhận cần từ 2 đến 80 ký tự.").last(),
  ).toBeVisible();
  await dialog.getByLabel("Người nhận").fill("Người nhận mới");
  await dialog.getByLabel("Số điện thoại").fill("0912345678");
  await dialog
    .getByLabel("Địa chỉ giao hàng", { exact: true })
    .fill("123 Đường Mẫu, TP. Hồ Chí Minh");
  await dialog.getByRole("button", { name: "Lưu địa chỉ" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Đặt Người nhận mới làm mặc định" })
    .click();
  const card = page
    .getByRole("heading", { name: "Người nhận mới" })
    .locator("../..");
  await expect(card).toContainText("Mặc định");
  await page.reload();
  await expect(card).toContainText("Mặc định");
  await page
    .getByRole("button", { name: "Sửa địa chỉ Người nhận mới" })
    .click();
  await dialog
    .getByLabel("Địa chỉ giao hàng", { exact: true })
    .fill("456 Đường Mẫu, TP. Hồ Chí Minh");
  await dialog.getByRole("button", { name: "Lưu địa chỉ" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(card).toContainText("456 Đường Mẫu");
  await page
    .getByRole("button", { name: "Xóa địa chỉ Người nhận mới" })
    .click();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(card).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa địa chỉ Người nhận mới" })
    .click();
  await dialog.getByRole("button", { name: "Xác nhận xóa" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Mặc định", { exact: true })).toHaveCount(1);
  await login(page, "customer2@nutee.demo", "/account/addresses");
  await expect(page.getByRole("heading", { name: "Hoàng Nam" })).toBeVisible();
  await expect(page.getByText("123 Đường Mẫu")).toHaveCount(0);
});

test("a stale address editor retains draft and reports conflict after a change in another tab", async ({
  page,
  context,
}) => {
  await login(page, "customer@nutee.demo", "/account/addresses");
  await page.getByRole("button", { name: "Sửa địa chỉ Minh Anh" }).click();
  await page.getByLabel("Người nhận").fill("Bản sửa chưa lưu");
  const other = await context.newPage();
  await other.goto("/account/addresses");
  await other.getByRole("button", { name: "Sửa địa chỉ Minh Anh" }).click();
  await other.getByLabel("Người nhận").fill("Bản sửa mới hơn");
  await other.getByRole("button", { name: "Lưu địa chỉ" }).click();
  await expect(other.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Lưu địa chỉ" }).click();
  await expect(
    page.getByRole("dialog").getByRole("alert").first(),
  ).toContainText("Dữ liệu đã thay đổi");
  await expect(page.getByLabel("Người nhận")).toHaveValue("Bản sửa chưa lưu");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Bản sửa mới hơn" }),
  ).toBeVisible();
});

test("registration validates passwords, requires profile completion, preserves cart and uses personal credentials", async ({
  page,
}) => {
  await addGuest(page, "1");
  await page.goto("/register?returnTo=%2Fcart");
  await page.getByLabel("Email", { exact: true }).fill("new@nutee.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Personal@456");
  await page
    .getByLabel("Xác nhận mật khẩu", { exact: true })
    .fill("Different@456");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Kiểm tra các trường sau" }),
  ).toBeFocused();
  await page
    .getByRole("link", { name: "Mật khẩu xác nhận không khớp." })
    .click();
  await expect(
    page.getByLabel("Xác nhận mật khẩu", { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("Xác nhận mật khẩu", { exact: true })
    .fill("Personal@456");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(page).toHaveURL(/\/account\/setup\?returnTo=%2Fcart$/);
  await expect(page.getByRole("status")).toContainText("new@nutee.demo");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hoàn thiện thông tin" }),
  ).toBeVisible();
  await page.goto("/account/profile");
  await expect(page).toHaveURL(/\/account\/setup/);
  await page.goto("/products");
  await expect(page).toHaveURL(/\/account\/setup/);
  await page.goto("/account/setup?returnTo=%2Fcart");
  await page.getByRole("button", { name: "Hoàn tất đăng ký" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Kiểm tra các trường sau" }),
  ).toBeFocused();
  await page.getByLabel("Họ và tên").fill("Khách mới");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page
    .getByLabel("Địa chỉ giao hàng")
    .fill("123 Đường Mẫu, TP. Hồ Chí Minh");
  await page.getByRole("button", { name: "Hoàn tất đăng ký" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("1");
  await page.goto("/account/profile");
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue("Khách mới");
  await page.reload();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue("Khách mới");
  await page
    .getByRole("navigation", { name: "Tài khoản khách hàng" })
    .getByRole("link", { name: "Địa chỉ", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Khách mới", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("123 Đường Mẫu, TP. Hồ Chí Minh", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Mặc định", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất cửa hàng" }).click();
  await page.goto("/login?returnTo=%2Fcart");
  await page.getByLabel("Email", { exact: true }).fill("new@nutee.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Email hoặc mật khẩu không đúng",
  );
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Personal@456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(
    page.getByLabel("Số lượng MacBook Air M3", { exact: true }),
  ).toHaveText("1");
  await page.goto("/account/profile");
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue("Khách mới");
  await page.reload();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue("Khách mới");
  await page.goto("/verify-email");
  await expect(
    page.getByRole("heading", { name: "Xác minh email" }),
  ).toBeVisible();
  await page.goto("/forgot-password");
  await expect(
    page.getByText(/Khôi phục mật khẩu qua email hiện chưa khả dụng/),
  ).toBeVisible();
  await page.goto("/reset-password");
  await expect(
    page.getByRole("heading", { name: "Đặt lại mật khẩu" }),
  ).toBeVisible();
  await page.goto("/account/security");
  await expect(
    page.getByLabel("Bảo mật tài khoản", { exact: true }),
  ).toBeEmpty();
  await expect(
    page
      .getByRole("navigation", { name: "Tài khoản khách hàng" })
      .getByRole("link", { name: "Bảo mật", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("out-of-stock and invalid quantities block add, corrupt guest cart stays intact", async ({
  page,
}) => {
  await page.goto("/products/product-29");
  await expect(
    page.getByRole("button", { name: "Thêm vào giỏ" }),
  ).toBeDisabled();
  await page.goto("/products/product-1");
  await page.getByLabel("Số lượng", { exact: true }).fill("0");
  await expect(
    page.getByRole("button", { name: "Thêm vào giỏ" }),
  ).toBeDisabled();
  await page.evaluate(() => localStorage.setItem("nutee:cart:guest", "{bad"));
  await page.goto("/cart");
  await expect(page.getByRole("alert")).toContainText("Giỏ khách bị lỗi");
  expect(
    await page.evaluate(() => localStorage.getItem("nutee:cart:guest")),
  ).toBe("{bad");
});

for (const width of [375, 768, 1024, 1440]) {
  test(`cart and address dialog fit ${width}px, keyboard dialog closes and restores focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await addGuest(page, "1");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await login(page, "customer@nutee.demo", "/account/addresses");
    const sidebar = await page.getByRole("complementary").boundingBox();
    const content = await page
      .getByRole("heading", { name: "Địa chỉ giao hàng", exact: true })
      .boundingBox();
    expect(sidebar).not.toBeNull();
    expect(content).not.toBeNull();
    if (width >= 900)
      expect(sidebar!.x + sidebar!.width).toBeLessThan(content!.x);
    else expect(sidebar!.y + sidebar!.height).toBeLessThan(content!.y);
    await page
      .getByRole("button", { name: "Thêm địa chỉ", exact: true })
      .click();
    await expect(page.getByLabel("Người nhận")).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Thêm địa chỉ", exact: true }),
    ).toBeFocused();
  });
}

test("unfinished registration resumes after login and completes without a shipping address", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Email", { exact: true }).fill("unfinished@nutee.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Personal@456");
  await page
    .getByLabel("Xác nhận mật khẩu", { exact: true })
    .fill("Personal@456");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hoàn thiện thông tin" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.goto("/login?returnTo=%2Faccount%2Forders");
  await page.getByLabel("Email", { exact: true }).fill("unfinished@nutee.demo");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Personal@456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(
    /\/account\/setup\?returnTo=%2Faccount%2Forders$/,
  );
  await page.getByLabel("Họ và tên").fill("Khách mới");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await expect(page.getByLabel("Địa chỉ giao hàng")).not.toHaveAttribute(
    "required",
  );
  await page.getByRole("button", { name: "Hoàn tất đăng ký" }).click();
  await expect(page).toHaveURL(/\/account\/orders$/);
  await expect(
    page.getByRole("heading", { name: "Chưa có đơn hàng" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Tài khoản khách hàng" })
    .getByRole("link", { name: "Hồ sơ", exact: true })
    .click();
  await expect(page.getByLabel("Số điện thoại")).toHaveValue("0912345678");
  await page
    .getByRole("navigation", { name: "Tài khoản khách hàng" })
    .getByRole("link", { name: "Địa chỉ", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Chưa có địa chỉ" }),
  ).toBeVisible();
});
