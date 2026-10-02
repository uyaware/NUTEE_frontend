import { lazy, Suspense, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { Route, Routes, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { services, localRepository } from "../services";
import {
  OWNED_KEYS,
  SESSION_KEYS,
} from "../repositories/local/LocalStorageRepository";
import { LoadingState } from "../shared/components/Feedback";
import { DataRecovery } from "../shared/components/DataRecovery";
import { errorMessage } from "../shared/lib/errors";
const CustomerRoutes = lazy(() => import("../portals/customer/routes"));
const BackofficeRoutes = lazy(() => import("../portals/backoffice/routes"));
const customerTitles: Record<string, string> = {
  "/cart": "Giỏ hàng",
  "/account/addresses": "Địa chỉ giao hàng",
  "/account/security": "Bảo mật tài khoản",
  "/register": "Đăng ký demo",
  "/verify-email": "Xác minh email demo",
  "/forgot-password": "Quên mật khẩu demo",
  "/reset-password": "Đặt lại mật khẩu demo",
};

export default function App() {
  const client = useQueryClient();
  const location = useLocation();
  const ready = useQuery({
    queryKey: ["demo", "boot"],
    queryFn: services.demo.stats,
  });
  useEffect(() => {
    const unsubscribe = localRepository.subscribe(() => {
      void client.invalidateQueries();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && !OWNED_KEYS.includes(event.key)) return;
      for (const portal of ["customer", "backoffice"] as const) {
        if (event.key === null || event.key === SESSION_KEYS[portal]) {
          void client.cancelQueries({ queryKey: [portal] });
          client.removeQueries({ queryKey: [portal] });
        }
      }
      localRepository.notifyExternalChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, [client]);
  useEffect(() => {
    const name =
      location.pathname === "/"
        ? "Không gian công nghệ"
        : location.pathname.includes("login")
          ? "Đăng nhập"
          : location.pathname.startsWith("/management")
            ? "Workspace"
            : location.pathname === "/products"
              ? "Sản phẩm"
              : location.pathname.startsWith("/products/")
                ? "Chi tiết sản phẩm"
                : location.pathname.includes("profile")
                  ? "Tài khoản"
                  : location.pathname.includes("orders")
                    ? "Đơn hàng"
                    : "Cửa hàng";
    if (!location.pathname.startsWith("/products/"))
      document.title = `NUTEE · ${customerTitles[location.pathname] ?? name}`;
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "fixed",
          left: 16,
          top: -100,
          zIndex: 1600,
          bgcolor: "background.paper",
          p: 2,
          "&:focus": { top: 16 },
        }}
      >
        Đi đến nội dung chính
      </Box>
      {ready.isPending ? (
        <LoadingState />
      ) : ready.isError ? (
        <Container
          component="main"
          id="main-content"
          tabIndex={-1}
          maxWidth="sm"
          sx={{ py: 8 }}
        >
          <Stack spacing={3}>
            <Typography variant="h2" component="h1">
              Cần khôi phục dữ liệu demo
            </Typography>
            <Alert severity="error">{errorMessage(ready.error)}</Alert>
            <Button onClick={() => void ready.refetch()} variant="outlined">
              Thử đọc lại dữ liệu
            </Button>
            <DataRecovery />
          </Stack>
        </Container>
      ) : (
        <Suspense fallback={<LoadingState />}>
          <Routes>
            <Route path="/management/*" element={<BackofficeRoutes />} />
            <Route path="/*" element={<CustomerRoutes />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
}
