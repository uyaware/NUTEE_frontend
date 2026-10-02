import { z } from "zod";
import type {
  DataRepository,
  SessionRepository,
  GuestCartRepository,
} from "../repositories/contracts";
import type { Database, Portal, User } from "../shared/types/database";
import { createCatalogService, productSummary } from "./catalog";
import { belongsToPortal, hasPermission } from "../shared/auth/permissions";
import type { Permission } from "../shared/auth/permissions";
import { ServiceError } from "../shared/lib/errors";
import { DEMO_PASSWORD } from "../mocks/seed";
import type { Services } from "./contracts";
import { createCartService, mergeGuestItems } from "./cart";
import {
  addressInputSchema,
  registrationCredentialsSchema,
  profileSetupSchema,
} from "../shared/types/account";

export function createServices(
  repository: DataRepository & GuestCartRepository,
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
  async function establishSession(user: User, portal: Portal) {
    let cartMergeNotices: string[] = [];
    if (portal === "customer")
      await repository.mergeGuest(user.id, (current, guest) => {
        cartMergeNotices = mergeGuestItems(current, guest, user.id);
      });
    sessions.set(portal, {
      userId: user.id,
      expiresAt: Date.now() + 8 * 3600000,
    });
    return { ...user, cartMergeNotices };
  }
  return {
    auth: {
      async register(email, password) {
        const parsed = registrationCredentialsSchema.safeParse({
          email,
          password,
        });
        if (!parsed.success)
          throw new ServiceError(
            "VALIDATION",
            "Kiểm tra email và mật khẩu đăng ký.",
            Object.fromEntries(
              parsed.error.issues.map((issue) => [
                String(issue.path[0]),
                issue.message,
              ]),
            ),
          );
        const db = await repository.read();
        const user: User = {
          id: crypto.randomUUID(),
          email: parsed.data.email,
          name: "",
          profileCompleted: false,
          role: "customer",
          isActive: true,
        };
        await repository.update(db.revision, (current) => {
          if (current.users.some((u) => u.email.toLowerCase() === user.email))
            throw new ServiceError("VALIDATION", "Email đã được sử dụng.", {
              email: "Email đã được dùng.",
            });
          current.users.push(user);
          current.credentials.push({
            id: crypto.randomUUID(),
            userId: user.id,
            password: parsed.data.password,
          });
          current.carts.push({ id: crypto.randomUUID(), userId: user.id });
        });
        return establishSession(user, "customer");
      },
      async login(portal, email, password) {
        const db = await repository.read();
        const user = db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        );
        const credential =
          user && db.credentials.find((c) => c.userId === user.id);
        if (!user || password !== (credential?.password ?? DEMO_PASSWORD))
          throw new ServiceError(
            "VALIDATION",
            "Email hoặc mật khẩu không đúng.",
            { password: "Kiểm tra thông tin đăng nhập." },
          );
        if (!user.isActive || !belongsToPortal(user.role, portal))
          throw new ServiceError(
            "FORBIDDEN",
            portal === "customer"
              ? "Portal cửa hàng chỉ dành cho tài khoản customer."
              : "Portal vận hành chỉ dành cho staff hoặc admin.",
          );
        return establishSession(user, portal);
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
    catalog: createCatalogService(repository),
    cart: createCartService(repository, (db) =>
      sessions.get("customer")
        ? requireActor(db, "customer", "profile:own")
        : null,
    ),
    profile: {
      async completeProfile(input, expectedRevision) {
        const ownerId = sessions.get("customer")?.userId;
        const parsed = profileSetupSchema.safeParse(input);
        if (!parsed.success)
          throw new ServiceError(
            "VALIDATION",
            "Kiểm tra thông tin cá nhân và địa chỉ.",
            Object.fromEntries(
              parsed.error.issues.map((issue) => [
                String(issue.path[0]),
                issue.message,
              ]),
            ),
          );
        const updated = await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          if (user.id !== ownerId)
            throw new ServiceError(
              "CONFLICT",
              "Phiên khách hàng đã thay đổi. Tải lại trước khi lưu.",
            );
          if (user.profileCompleted !== false)
            throw new ServiceError(
              "CONFLICT",
              "Hồ sơ đã được hoàn thiện. Tải lại để tiếp tục.",
            );
          user.name = parsed.data.name;
          user.phone = parsed.data.phone;
          user.profileCompleted = true;
          if (parsed.data.line) {
            db.addresses
              .filter((a) => a.userId === user.id)
              .forEach((a) => {
                a.isDefault = false;
              });
            db.addresses.push({
              id: crypto.randomUUID(),
              userId: user.id,
              recipient: user.name,
              phone: parsed.data.phone,
              line: parsed.data.line,
              isDefault: true,
            });
          }
        });
        return updated.users.find((user) => user.id === ownerId)!;
      },
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
        const ownerId = sessions.get("customer")?.userId;
        const parsed = z.string().trim().min(2).max(80).safeParse(name);
        if (!parsed.success)
          throw new ServiceError("VALIDATION", "Tên cần từ 2 đến 80 ký tự.", {
            name: "Tên cần từ 2 đến 80 ký tự.",
          });
        await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          if (user.id !== ownerId)
            throw new ServiceError(
              "CONFLICT",
              "Phiên khách hàng đã thay đổi. Tải lại hồ sơ trước khi lưu.",
            );
          user.name = parsed.data;
        });
      },
      async saveAddress(id, input, expectedRevision) {
        const ownerId = sessions.get("customer")?.userId;
        const parsed = addressInputSchema.safeParse(input);
        if (!parsed.success)
          throw new ServiceError(
            "VALIDATION",
            "Kiểm tra người nhận, số điện thoại và địa chỉ.",
            Object.fromEntries(
              parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
            ),
          );
        await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          if (user.id !== ownerId)
            throw new ServiceError(
              "CONFLICT",
              "Phiên khách hàng đã thay đổi. Tải lại địa chỉ trước khi lưu.",
            );
          const owned = db.addresses.filter((a) => a.userId === user.id);
          const address = id ? owned.find((a) => a.id === id) : undefined;
          if (id && !address)
            throw new ServiceError(
              "NOT_FOUND",
              "Không tìm thấy địa chỉ của bạn.",
            );
          const isDefault =
            !owned.some((a) => a.isDefault) ||
            parsed.data.isDefault ||
            (address?.isDefault ?? false);
          if (isDefault)
            owned.forEach((a) => {
              a.isDefault = false;
            });
          if (address) Object.assign(address, parsed.data, { isDefault });
          else
            db.addresses.push({
              id: crypto.randomUUID(),
              userId: user.id,
              ...parsed.data,
              isDefault,
            });
        });
      },
      async removeAddress(id, expectedRevision) {
        await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          const address = db.addresses.find(
            (a) => a.id === id && a.userId === user.id,
          );
          if (!address)
            throw new ServiceError(
              "NOT_FOUND",
              "Không tìm thấy địa chỉ của bạn.",
            );
          db.addresses = db.addresses.filter((a) => a.id !== id);
          if (address.isDefault) {
            const replacement = db.addresses.find((a) => a.userId === user.id);
            if (replacement) replacement.isDefault = true;
          }
        });
      },
      async setDefaultAddress(id, expectedRevision) {
        await repository.update(expectedRevision, (db) => {
          const user = requireActor(db, "customer", "profile:own");
          if (!db.addresses.some((a) => a.id === id && a.userId === user.id))
            throw new ServiceError(
              "NOT_FOUND",
              "Không tìm thấy địa chỉ của bạn.",
            );
          db.addresses
            .filter((a) => a.userId === user.id)
            .forEach((a) => {
              a.isDefault = a.id === id;
            });
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
          items: db.products.map((p) => productSummary(db, p)),
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
