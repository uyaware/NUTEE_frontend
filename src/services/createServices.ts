import { z } from "zod";
import type {
  DataRepository,
  SessionRepository,
} from "../repositories/contracts";
import type { Database, Portal, Product, User } from "../shared/types/database";
import { belongsToPortal, hasPermission } from "../shared/auth/permissions";
import type { Permission } from "../shared/auth/permissions";
import { ServiceError } from "../shared/lib/errors";
import { DEMO_PASSWORD } from "../mocks/seed";
import type { Services } from "./contracts";

export function createServices(
  repository: DataRepository,
  sessions: SessionRepository,
): Services {
  async function actor(
    db: Database,
    portal: Portal,
    permission?: Permission,
  ): Promise<User> {
    const session = sessions.get(portal);
    const user = session && db.users.find((u) => u.id === session.userId);
    if (!user || !user.isActive || session.expiresAt <= Date.now())
      throw new ServiceError(
        "UNAUTHORIZED",
        "Phiên đăng nhập đã hết hạn hoặc tài khoản không còn hoạt động.",
      );
    if (
      !belongsToPortal(user.role, portal) ||
      (permission && !hasPermission(user.role, permission))
    )
      throw new ServiceError(
        "FORBIDDEN",
        "Tài khoản không có quyền thực hiện thao tác này.",
      );
    return user;
  }
  function requireActor(
    db: Database,
    portal: Portal,
    permission: Permission,
  ): User {
    const session = sessions.get(portal);
    const user = session && db.users.find((u) => u.id === session.userId);
    if (!user || !user.isActive || session.expiresAt <= Date.now())
      throw new ServiceError("UNAUTHORIZED", "Vui lòng đăng nhập lại.");
    if (
      !belongsToPortal(user.role, portal) ||
      !hasPermission(user.role, permission)
    )
      throw new ServiceError(
        "FORBIDDEN",
        "Tài khoản không có quyền thực hiện thao tác này.",
      );
    return user;
  }
  const summary = (db: Database, p: Product) => ({
    ...p,
    brandName: db.brands.find((b) => b.id === p.brandId)?.name ?? "",
    imageUrl:
      db.productImages
        .filter((i) => i.productId === p.id)
        .sort((a, b) => a.position - b.position)[0]?.url ?? "",
  });
  return {
    auth: {
      async login(portal, email, password) {
        const db = await repository.read();
        const user = db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        if (!user || password !== DEMO_PASSWORD)
          throw new ServiceError(
            "VALIDATION",
            "Email hoặc mật khẩu demo không đúng.",
            { password: "Kiểm tra thông tin đăng nhập demo." },
          );
        if (!user.isActive || !belongsToPortal(user.role, portal))
          throw new ServiceError(
            "FORBIDDEN",
            portal === "customer"
              ? "Portal cửa hàng chỉ dành cho tài khoản customer."
              : "Portal vận hành chỉ dành cho staff hoặc admin.",
          );
        sessions.set(portal, {
          userId: user.id,
          expiresAt: Date.now() + 8 * 3600000,
        });
        return user;
      },
      async currentUser(portal) {
        const db = await repository.read();
        try {
          return await actor(db, portal);
        } catch (error) {
          if (
            error instanceof ServiceError &&
            ["UNAUTHORIZED", "FORBIDDEN"].includes(error.code)
          )
            return null;
          throw error;
        }
      },
      async logout(portal) {
        sessions.remove(portal);
      },
    },
    catalog: {
      async featured() {
        const db = await repository.read();
        return db.products
          .filter((p) => p.status === "published")
          .slice(0, 8)
          .map((p) => summary(db, p));
      },
    },
    profile: {
      async get() {
        const db = await repository.read();
        const user = await actor(db, "customer", "profile:own");
        return {
          user,
          addresses: db.addresses.filter((a) => a.userId === user.id),
          revision: db.revision,
        };
      },
      async updateName(name, expectedRevision) {
        const parsed = z.string().trim().min(2).max(80).safeParse(name);
        if (!parsed.success)
          throw new ServiceError("VALIDATION", "Tên cần từ 2 đến 80 ký tự.", {
            name: "Tên cần từ 2 đến 80 ký tự.",
          });
        await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          user.name = parsed.data;
        });
      },
    },
    orders: {
      async list(portal) {
        const db = await repository.read();
        const user = await actor(
          db,
          portal,
          portal === "customer" ? "orders:own" : "operations:read",
        );
        const items = db.orders
          .filter((o) => portal === "backoffice" || o.userId === user.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return { items, total: items.length, page: 1, pageSize: 20 };
      },
      async detail(portal, id) {
        const db = await repository.read();
        const user = await actor(
          db,
          portal,
          portal === "customer" ? "orders:own" : "operations:read",
        );
        const order = db.orders.find((o) => o.id === id);
        if (!order)
          throw new ServiceError("NOT_FOUND", "Không tìm thấy đơn hàng.");
        if (portal === "customer" && order.userId !== user.id)
          throw new ServiceError(
            "FORBIDDEN",
            "Bạn chỉ được xem đơn hàng của mình.",
          );
        return order;
      },
    },
    management: {
      async dashboard() {
        const db = await repository.read();
        const user = await actor(db, "backoffice", "operations:read");
        return {
          orders: db.orders.length,
          pending: db.orders.filter((o) => o.status === "pending").length,
          afterSales: db.afterSaleRequests.filter((r) =>
            ["pending", "reviewing"].includes(r.status),
          ).length,
          paidRevenue:
            user.role === "admin"
              ? db.orders
                  .filter(
                    (o) =>
                      o.paymentStatus === "paid" && o.status !== "cancelled",
                  )
                  .reduce((sum, o) => sum + o.total, 0)
              : null,
          products: db.products.filter((p) => p.status === "published").length,
        };
      },
      async products() {
        const db = await repository.read();
        await actor(db, "backoffice", "products:write");
        return {
          items: db.products.map((p) => summary(db, p)),
          revision: db.revision,
        };
      },
      async updateProduct(id, input, expectedRevision) {
        const parsed = z
          .object({
            name: z.string().trim().min(2).max(160),
            price: z.number().int().min(1000).max(1000000000),
            status: z.enum(["published", "hidden"]),
          })
          .safeParse(input);
        if (!parsed.success)
          throw new ServiceError(
            "VALIDATION",
            "Tên cần 2–160 ký tự, giá cần là số nguyên từ 1.000 đến 1.000.000.000₫.",
          );
        await repository.update(expectedRevision, (db) => {
          requireActor(db, "backoffice", "products:write");
          const product = db.products.find((p) => p.id === id);
          if (!product)
            throw new ServiceError("NOT_FOUND", "Không tìm thấy sản phẩm.");
          Object.assign(product, parsed.data, {
            updatedAt: new Date().toISOString(),
          });
        });
      },
      async users() {
        const db = await repository.read();
        await actor(db, "backoffice", "users:read");
        return db.users;
      },
    },
    demo: {
      async stats() {
        const db = await repository.read();
        return {
          revision: db.revision,
          seededAt: db.seededAt,
          counts: [
            { label: "Sản phẩm", count: db.products.length },
            { label: "Thương hiệu", count: db.brands.length },
            { label: "Tài khoản", count: db.users.length },
            { label: "Đơn hàng", count: db.orders.length },
            { label: "Khuyến mãi", count: db.promotions.length },
            { label: "Hậu mãi", count: db.afterSaleRequests.length },
          ],
        };
      },
      async reset() {
        await repository.reset();
      },
    },
  };
}
