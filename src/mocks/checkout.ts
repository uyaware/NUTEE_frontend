import { createSeed } from "./seed";
import type { Database, Order } from "../shared/types/database";

// Read-only fixtures for the M4 prototype. No storage or service mutations.
const seed = createSeed(new Date("2026-10-03T03:00:00.000Z"));
export type OrderItem = Database["orderItems"][number];
export type OrderDisplayItem = Pick<
  OrderItem,
  | "id"
  | "productId"
  | "name"
  | "imageUrl"
  | "configuration"
  | "quantity"
  | "price"
> &
  Partial<Pick<OrderItem, "warrantyCode" | "warrantyExpiresAt">>;
export type PrototypeOrder = Order & { items: OrderDisplayItem[] };

/** Temporary screen data only; navigation never persists an order. */
export function findPrototypeOrder(
  id: string | undefined,
  navigationState?: { order?: PrototypeOrder } | null,
) {
  const preview = navigationState?.order;
  return preview?.id === id
    ? preview
    : prototypeOrders.find((order) => order.id === id);
}

export const checkoutAddresses = [
  {
    id: "home",
    label: "Nhà riêng",
    recipient: "Minh Anh",
    phone: "0900000000",
    line: "12 Đường Lê Lợi, Phường Bến Thành, TP. Hồ Chí Minh",
  },
  {
    id: "office",
    label: "Văn phòng",
    recipient: "Minh Anh",
    phone: "0900000000",
    line: "45 Đường Nguyễn Huệ, Phường Sài Gòn, TP. Hồ Chí Minh",
  },
];

export const checkoutItems: OrderItem[] = [
  {
    id: "demo-item-1",
    orderId: "demo-cod",
    productId: "product-1",
    name: "MacBook Air M3",
    imageUrl: "/images/laptop.svg",
    configuration: "16GB · 256GB · 13 inch",
    quantity: 1,
    price: 24990000,
    warrantyCode: "NT-DEMO-001",
    warrantyExpiresAt: "2027-10-03T03:00:00.000Z",
  },
  {
    id: "demo-item-2",
    orderId: "demo-cod",
    productId: "product-7",
    name: "Keychron K2 Pro",
    imageUrl: "/images/keyboard.svg",
    configuration: "75% · Wireless · RGB",
    quantity: 1,
    price: 2490000,
    warrantyCode: "NT-DEMO-002",
    warrantyExpiresAt: "2027-10-03T03:00:00.000Z",
  },
];

export const checkoutQuote = {
  subtotal: 27480000,
  discount: 100000,
  shipping: 30000,
  total: 27410000,
};

const sampleOrder: PrototypeOrder = {
  id: "demo-cod",
  userId: "customer-1",
  status: "pending",
  paymentMethod: "cod",
  paymentStatus: "pending",
  ...checkoutQuote,
  address: {
    recipient: checkoutAddresses[0].recipient,
    phone: checkoutAddresses[0].phone,
    line: checkoutAddresses[0].line,
  },
  createdAt: "2026-10-03T03:00:00.000Z",
  history: [
    {
      status: "pending",
      at: "2026-10-03T03:00:00.000Z",
      actorId: "customer-1",
    },
  ],
  items: checkoutItems,
};

export const prototypeOrders: PrototypeOrder[] = [
  sampleOrder,
  {
    ...sampleOrder,
    id: "demo-qr",
    paymentMethod: "qr",
    items: checkoutItems.map((item) => ({
      ...item,
      id: `${item.id}-qr`,
      orderId: "demo-qr",
    })),
  },
  {
    ...sampleOrder,
    id: "demo-shipping",
    status: "shipping",
    paymentStatus: "paid",
    createdAt: "2026-10-01T03:00:00.000Z",
    history: [
      {
        status: "pending",
        at: "2026-10-01T03:00:00.000Z",
        actorId: "customer-1",
      },
      {
        status: "confirmed",
        at: "2026-10-01T05:00:00.000Z",
        actorId: "staff-1",
      },
      { status: "packing", at: "2026-10-02T03:00:00.000Z", actorId: "staff-1" },
      {
        status: "shipping",
        at: "2026-10-03T02:00:00.000Z",
        actorId: "staff-1",
      },
    ],
    items: checkoutItems.map((item) => ({
      ...item,
      id: `${item.id}-shipping`,
      orderId: "demo-shipping",
    })),
  },
  {
    ...sampleOrder,
    id: "demo-cancelled",
    status: "cancelled",
    createdAt: "2026-09-30T03:00:00.000Z",
    history: [
      {
        status: "pending",
        at: "2026-09-30T03:00:00.000Z",
        actorId: "customer-1",
      },
      {
        status: "cancelled",
        at: "2026-09-30T04:00:00.000Z",
        actorId: "customer-1",
      },
    ],
    items: checkoutItems.map((item) => ({
      ...item,
      id: `${item.id}-cancelled`,
      orderId: "demo-cancelled",
    })),
  },
  ...seed.orders.map((order) => ({
    ...order,
    items: seed.orderItems.filter((item) => item.orderId === order.id),
  })),
];

export const paymentLabels: Record<Order["paymentStatus"], string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  expired: "Đã hết hạn",
};
