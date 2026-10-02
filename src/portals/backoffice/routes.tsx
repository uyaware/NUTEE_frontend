import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { backofficeTheme } from "../../shared/theme";
import { RequireAuth } from "../../shared/auth/RequireAuth";
import { LoginPage } from "../../shared/components/LoginPage";
import {
  OrdersPage,
  OrderDetailPage,
} from "../../shared/components/OrdersPage";
import { SystemPage } from "../../shared/components/SystemPage";
import { ManagementLayout } from "./layouts/ManagementLayout";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
export default function BackofficeRoutes() {
  return (
    <ThemeProvider theme={backofficeTheme}>
      <Routes>
        <Route path="login" element={<LoginPage portal="backoffice" />} />
        <Route element={<RequireAuth portal="backoffice" />}>
          <Route element={<ManagementLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage portal="backoffice" />} />
            <Route
              path="orders/:id"
              element={<OrderDetailPage portal="backoffice" />}
            />
            <Route
              element={
                <RequireAuth portal="backoffice" permission="products:write" />
              }
            >
              <Route path="products" element={<ProductsPage />} />
            </Route>
            <Route
              element={
                <RequireAuth portal="backoffice" permission="users:read" />
              }
            >
              <Route path="users" element={<UsersPage />} />
            </Route>
            <Route path="403" element={<SystemPage forbidden management />} />
            <Route path="*" element={<SystemPage management />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
