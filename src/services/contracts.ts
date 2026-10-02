import type {
  Database,
  Order,
  Page,
  Portal,
  ProductSummary,
  User,
} from "../shared/types/database";

export interface AuthService {
  login(portal: Portal, email: string, password: string): Promise<User>;
  currentUser(portal: Portal): Promise<User | null>;
  logout(portal: Portal): Promise<void>;
}
export interface CatalogService {
  featured(): Promise<ProductSummary[]>;
}
export interface ProfileService {
  get(): Promise<{
    user: User;
    addresses: Database["addresses"];
    revision: number;
  }>;
  updateName(name: string, expectedRevision: number): Promise<void>;
}
export interface OrderService {
  list(portal: Portal): Promise<Page<Order>>;
  detail(portal: Portal, id: string): Promise<Order>;
}
export interface ManagementService {
  dashboard(): Promise<{
    orders: number;
    pending: number;
    afterSales: number;
    paidRevenue: number | null;
    products: number;
  }>;
  products(): Promise<{ items: ProductSummary[]; revision: number }>;
  updateProduct(
    id: string,
    input: { name: string; price: number; status: "published" | "hidden" },
    expectedRevision: number,
  ): Promise<void>;
  users(): Promise<User[]>;
}
export interface DemoService {
  stats(): Promise<{
    revision: number;
    seededAt: string;
    counts: { label: string; count: number }[];
  }>;
  reset(): Promise<void>;
}
export interface Services {
  auth: AuthService;
  catalog: CatalogService;
  profile: ProfileService;
  orders: OrderService;
  management: ManagementService;
  demo: DemoService;
}
