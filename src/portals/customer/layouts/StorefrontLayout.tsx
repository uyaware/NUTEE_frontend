import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Brand } from "../../../shared/components/Brand";
import { useLogout, useSession } from "../../../shared/auth/useSession";
import { ErrorState } from "../../../shared/components/Feedback";
import { StorefrontHeader } from "../components/StorefrontHeader";

export function StorefrontLayout() {
  const location = useLocation();
  const session = useSession("customer");
  const logout = useLogout("customer");
  const state = location.state as { cartMergeNotices?: unknown } | null;
  const mergeNotices = Array.isArray(state?.cartMergeNotices)
    ? state.cartMergeNotices.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <StorefrontHeader />
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
            © {new Date().getFullYear()} NUTEE. Không gian công nghệ của bạn.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
