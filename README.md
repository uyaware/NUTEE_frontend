# NUTEE frontend — M0–M3

React + Vite + TypeScript strict, Material UI/MUI Icons, TanStack Query, React Hook Form/Zod. Giao diện tiếng Việt, VND; palette xanh/than theo `public/logo_nutee.png`.

## Chạy trên Windows PowerShell

Node 22.12+ (môi trường hiện tại 22.13.0).

```powershell
npm.cmd install
npm.cmd run dev
```

Sau lần cài đầu tiên, dùng `npm.cmd ci` để cài đúng phiên bản dependencies trong `package-lock.json` trên máy khác hoặc CI.

Mở `http://localhost:5173/` cho customer; `http://localhost:5173/management` cho staff/admin. Chạy cùng server/origin để chia sẻ localStorage. Auth riêng tại `/login` và `/management/login`. `/demo` kiểm tra dữ liệu/reset; `/design-system` preview theme.

Catalog tại `/products`, chi tiết tại `/products/:id`. Tìm theo tên/SKU/hãng/cấu hình; lọc danh mục/hãng/giá/còn hàng/thông số, sắp xếp và phân trang. Bộ lọc nằm trong URL nên reload hoặc chia sẻ link giữ lựa chọn. Mobile dùng Drawer. Gallery/thông số/đánh giá hiện chỉ đọc.

M3: thêm sản phẩm từ trang chi tiết vào `/cart`, tăng/giảm/xóa và lưu giỏ sau reload. Guest chỉ lưu ID sản phẩm/số lượng; login customer gộp với giỏ tài khoản, kiểm tra tồn kho và báo điều chỉnh. Logout giữ giỏ tài khoản; giỏ khách mới rỗng. Hai customer có giỏ riêng; phiên backoffice giữ độc lập.

Tài khoản có navigation hồ sơ/địa chỉ/bảo mật/đơn hàng. `/account/addresses` hỗ trợ thêm/sửa/xóa/chọn mặc định, validation, xác nhận xóa và conflict giữa các tab. `/register` tạo customer demo với mật khẩu chung bên dưới. `/verify-email`, `/forgot-password`, `/reset-password`, `/account/security` là màn hướng dẫn giới hạn auth demo: chưa gửi email, đổi mật khẩu hay OAuth. Checkout/đặt hàng/thanh toán thuộc M4. Xem [nghiệm thu M3](docs/m3-acceptance.md).

| Role     | Email               | Mật khẩu demo |
| -------- | ------------------- | ------------- |
| Customer | customer@nutee.demo | Nutee@123     |
| Staff    | staff@nutee.demo    | Nutee@123     |
| Admin    | admin@nutee.demo    | Nutee@123     |

Customer thứ hai: `customer2@nutee.demo`, cùng mật khẩu; dùng kiểm tra ownership. Phiên mỗi portal 8 giờ. Không dùng thông tin đăng nhập thật.

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run format:check
npm.cmd run build
npm.cmd run test:e2e
npm.cmd run preview
```

E2E dùng Chrome đã cài (`channel: chrome`) và tự mở Vite port 4173. Nếu chưa có Chrome, cài Chrome hoặc chuyển cấu hình Playwright sang Chromium và chạy `npx.cmd playwright install chromium`.

`build` tạo `dist/`; preview tại port 4173. Production static hosting cần fallback mọi deep link về `index.html`. Dev/preview là hai origin theo port: dữ liệu demo ở 5173 không tự chuyển sang 4173. Dùng `localhost` nhất quán; địa chỉ IP LAN là origin khác và Web Locks có thể không có trên HTTP LAN.

## Kiểm chứng nền tảng

1. Login customer, sửa tên ở hồ sơ; reload giữ tên. Login backoffice admin cùng trình duyệt: customer vẫn đăng nhập.
2. Admin mở “Sản phẩm demo”, sửa tên/giá/trạng thái một sản phẩm đầu danh sách. Mở storefront ở tab khác cùng origin: thay đổi cập nhật; reload giữ dữ liệu. Đơn cũ giữ snapshot tên/giá.
3. Login staff, truy cập thẳng `/management/users` hoặc `/management/products`: 403. Customer xem `/account/orders/order-2` bị service từ chối vì thuộc customer khác.
4. Logout customer: backoffice vẫn đăng nhập. Mở editor trong hai tab admin; save tab thứ nhất rồi tab thứ hai: conflict, không ghi đè dữ liệu mới.
5. `/demo` → xuất backup nếu cần → “Đặt lại demo” → xác nhận: seed khôi phục, cả hai phiên xóa; keys của ứng dụng khác giữ nguyên.

Seed 30 products / 6 brands / 12 orders / 4 promotions / 6 after-sales, quan hệ validate khi đọc và ghi. Storage lỗi có màn recovery, giữ raw data, export/retry/reset. Không tự reset dữ liệu khi JSON/schema lỗi hoặc seedVersion đổi.

Seed v2 bổ sung ảnh gallery và RAM/storage/connection mẫu. Dữ liệu seed v1 đã lưu vẫn chạy bình thường, giữ mọi chỉnh sửa. Nếu muốn thử fixtures mới, xuất backup rồi reset qua `/demo`; reset cũng xóa phiên demo. Nghiệm thu M2 xem `docs/m2-acceptance.md`.

## Tổ chức

- `src/app`: providers/root routing, storage cache invalidation.
- `src/portals/customer`, `src/portals/backoffice`: route trees, layouts, auth entry riêng, lazy routes.
- `src/shared`: token/theme, DTO/schema, permissions/guards, components, format.
- `src/services`: async contracts/orchestration; UI không gọi localStorage.
- `src/repositories/local`: persistence/session adapter, revision, Web Locks, reset/export.
- `src/mocks`: relational seed và test utilities.
- `design-system/nutee`: master + catalog/dashboard/checkout overrides.

M1 gồm shell, login/session, guards, seed/persistence/recovery/reset và preview dữ liệu. Profile mutation/product editor là luồng nhỏ để kiểm chứng nền tảng. M2 bổ sung catalog/search/filter/detail/gallery/specs/reviews read. M3 bổ sung account/address/cart/register demo. Checkout, payment, workflow staff và CRUD admin đầy đủ thuộc M4–M6. API thật/M8 chưa triển khai.
