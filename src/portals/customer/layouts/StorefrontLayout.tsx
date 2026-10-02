import { useState } from "react";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  TextField,
  Typography,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import { useCart } from "../components/useCart";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Brand } from "../../../shared/components/Brand";
import { useLogout, useSession } from "../../../shared/auth/useSession";
import { ErrorState } from "../../../shared/components/Feedback";
import { tokens } from "../../../shared/theme/tokens";

export function StorefrontLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search).get("q") ?? "";
  const session = useSession("customer");
  const logout = useLogout("customer");
  const cart = useCart();
  const state = location.state as { cartMergeNotices?: unknown } | null;
  const mergeNotices = Array.isArray(state?.cartMergeNotices)
    ? state.cartMergeNotices.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const nav = (
    <>
      <Button component={NavLink} to="/" end>
        Trang chủ
      </Button>
      <Button component={NavLink} to="/design-system">
        Design system
      </Button>
      <Button component={NavLink} to="/products">
        Sản phẩm
      </Button>
      <Button component={NavLink} to="/demo">
        Demo & dữ liệu
      </Button>
    </>
  );
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          py: 0.75,
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="caption">
            NUTEE Demo · Sản phẩm và giá là dữ liệu mẫu
          </Typography>
        </Container>
      </Box>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          height: tokens.layout.storefrontHeaderHeight,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              gap: 2,
              minHeight: "64px !important",
              justifyContent: "space-between",
            }}
          >
            <Brand />
            <Stack
              direction="row"
              sx={{
                display: { xs: "none", md: "flex" },
                "& .active": { bgcolor: "action.selected" },
              }}
            >
              {nav}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton
                component={Link}
                to="/cart"
                aria-label={`Giỏ hàng${cart.data ? `, ${cart.data.quantity} sản phẩm` : ""}`}
              >
                <Badge badgeContent={cart.data?.quantity ?? 0} color="primary">
                  <ShoppingCartOutlined />
                </Badge>
              </IconButton>
              <Button
                component={Link}
                to={session.data ? "/account/profile" : "/login"}
                startIcon={<PersonOutlineRounded />}
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
              >
                {session.data?.name ?? "Đăng nhập"}
              </Button>
              <IconButton
                aria-label="Mở menu cửa hàng"
                onClick={() => setMenuOpen(true)}
                sx={{ display: { md: "none" } }}
              >
                <MenuRounded />
              </IconButton>
            </Stack>
          </Toolbar>
          <Box
            component="form"
            key={search}
            role="search"
            aria-label="Tìm sản phẩm toàn cửa hàng"
            onSubmit={(event) => {
              event.preventDefault();
              const q = String(
                new FormData(event.currentTarget).get("q") ?? "",
              ).trim();
              navigate(`/products${q ? `?${new URLSearchParams({ q })}` : ""}`);
            }}
            sx={{ display: "flex", gap: 1, pb: 1.5 }}
          >
            <TextField
              name="q"
              label="Tìm sản phẩm"
              defaultValue={search}
              size="small"
              slotProps={{ htmlInput: { maxLength: 160 } }}
            />
            <IconButton type="submit" aria-label="Tìm sản phẩm" color="primary">
              <SearchRounded />
            </IconButton>
          </Box>
        </Container>
      </AppBar>
      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Stack
          sx={{ width: 290, p: 3 }}
          spacing={2}
          onClick={() => setMenuOpen(false)}
        >
          <Brand />
          {nav}
          <Button
            component={Link}
            to={session.data ? "/account/profile" : "/login"}
          >
            Tài khoản khách hàng
          </Button>
          <Button onClick={() => setMenuOpen(false)}>Đóng menu</Button>
        </Stack>
      </Drawer>
      <Container
        component="main"
        id="main-content"
        tabIndex={-1}
        maxWidth="xl"
        sx={{ py: { xs: 2.5, md: 3 }, flex: 1 }}
      >
        {session.isError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Không đọc được phiên khách hàng.{" "}
            <Button onClick={() => logout.mutate()}>Xóa phiên này</Button>
          </Alert>
        )}
        {logout.isError && <ErrorState error={logout.error} />}
        {!!mergeNotices.length && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Stack spacing={1}>
              {mergeNotices.map((notice, index) => (
                <Typography key={index}>{notice}</Typography>
              ))}
              <Button component={Link} to="/cart">
                Kiểm tra giỏ hàng
              </Button>
            </Stack>
          </Alert>
        )}
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{
          bgcolor: "background.paper",
          borderTop: "1px solid",
          borderColor: "divider",
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={3}
          >
            <Brand />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button component={Link} to="/demo">
                Hướng dẫn demo
              </Button>
              <Button
                component={Link}
                to="/management"
                endIcon={<ArrowOutwardRounded />}
              >
                Cổng vận hành
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} NUTEE. Khám phá danh mục công nghệ
            trong bản demo.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
