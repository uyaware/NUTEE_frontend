import { lazy } from "react";
import { Paper } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { StorefrontLayout } from "./layouts/StorefrontLayout";
import { RequireAuth } from "../../shared/auth/RequireAuth";
import { LoginPage } from "../../shared/components/LoginPage";
import { AccountLayout } from "./layouts/AccountLayout";
import {
  OrderDetailPage,
  OrdersPage,
} from "../../shared/components/OrdersPage";
import { SystemPage } from "../../shared/components/SystemPage";
const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AddressesPage = lazy(() => import("./pages/AddressesPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const AuthDemoPage = lazy(() => import("./pages/AuthDemoPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfileSetupPage = lazy(() => import("./pages/ProfileSetupPage"));
export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage portal="customer" />} />
      <Route element={<StorefrontLayout />}>
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="verify-email"
          element={<AuthDemoPage mode="verify-email" />}
        />
        <Route
          path="forgot-password"
          element={<AuthDemoPage mode="forgot-password" />}
        />
        <Route
          path="reset-password"
          element={<AuthDemoPage mode="reset-password" />}
        />
        <Route path="cart" element={<CartPage />} />
        <Route index element={<HomePage />} />
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route element={<RequireAuth portal="customer" />}>
          <Route path="account/setup" element={<ProfileSetupPage />} />
          <Route element={<AccountLayout />}>
            <Route
              path="account"
              element={<Navigate to="/account/profile" replace />}
            />
            <Route path="account/profile" element={<ProfilePage />} />
            <Route path="account/addresses" element={<AddressesPage />} />
            <Route
              path="account/security"
              element={
                <Paper
                  variant="outlined"
                  aria-label="Bảo mật tài khoản"
                  sx={{ minHeight: 420 }}
                />
              }
            />
            <Route
              path="account/orders"
              element={<OrdersPage portal="customer" />}
            />
            <Route
              path="account/orders/:id"
              element={<OrderDetailPage portal="customer" />}
            />
          </Route>
        </Route>
        <Route path="403" element={<SystemPage forbidden />} />
        <Route path="*" element={<SystemPage />} />
      </Route>
    </Routes>
  );
}
