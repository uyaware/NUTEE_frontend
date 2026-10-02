import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { RequireAuth } from "../../shared/auth/RequireAuth";
import { LoginPage } from "../../shared/components/LoginPage";
import {
  OrderDetailPage,
  OrdersPage,
} from "../../shared/components/OrdersPage";
import { SystemPage } from "../../shared/components/SystemPage";
const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const DemoPage = lazy(() => import("../../shared/components/DemoPage"));
const DesignSystemPage = lazy(
  () => import("../../shared/components/DesignSystemPage"),
);
export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage portal="customer" />} />
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="design-system" element={<DesignSystemPage />} />
        <Route element={<RequireAuth portal="customer" />}>
          <Route
            path="account"
            element={<Navigate to="/account/profile" replace />}
          />
          <Route path="account/profile" element={<ProfilePage />} />
          <Route
            path="account/orders"
            element={<OrdersPage portal="customer" />}
          />
          <Route
            path="account/orders/:id"
            element={<OrderDetailPage portal="customer" />}
          />
        </Route>
        <Route path="403" element={<SystemPage forbidden />} />
        <Route path="*" element={<SystemPage />} />
      </Route>
    </Routes>
  );
}
