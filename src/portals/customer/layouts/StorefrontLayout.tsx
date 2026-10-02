import { useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Brand } from "../../../shared/components/Brand";
import { useLogout, useSession } from "../../../shared/auth/useSession";
import { ErrorState } from "../../../shared/components/Feedback";

export function StorefrontLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const session = useSession("customer");
  const logout = useLogout("customer");
  const nav = (
    <>
      <Button component={NavLink} to="/" end>
        Trang chủ
      </Button>
      <Button component={NavLink} to="/design-system">
        Design system
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
            NUTEE Demo · Dữ liệu mẫu trong trình duyệt · M0–M1
          </Typography>
        </Container>
      </Box>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              gap: 2,
              minHeight: "80px !important",
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
        sx={{ py: { xs: 3, md: 5 }, flex: 1 }}
      >
        {session.isError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Không đọc được phiên khách hàng.{" "}
            <Button onClick={() => logout.mutate()}>Xóa phiên này</Button>
          </Alert>
        )}
        {logout.isError && <ErrorState error={logout.error} />}
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
            © {new Date().getFullYear()} NUTEE. Bản nền tảng — danh mục và mua
            hàng sẽ được triển khai ở M2–M4.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
