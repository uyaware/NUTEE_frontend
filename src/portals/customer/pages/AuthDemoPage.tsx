import { Button, Paper, Stack, Typography } from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { safeReturnTo } from "../../../shared/auth/redirect";

type Mode = "verify-email" | "forgot-password" | "reset-password";
const copy: Record<Mode, { title: string; description: string }> = {
  "verify-email": {
    title: "Xác minh email",
    description:
      "Bạn có thể đăng nhập sau khi tạo tài khoản. Xác minh qua email hiện chưa khả dụng.",
  },
  "forgot-password": {
    title: "Quên mật khẩu",
    description:
      "Khôi phục mật khẩu qua email hiện chưa khả dụng. Vui lòng liên hệ NUTEE để được hỗ trợ tài khoản.",
  },
  "reset-password": {
    title: "Đặt lại mật khẩu",
    description:
      "Đặt lại mật khẩu hiện chưa khả dụng. Vui lòng liên hệ NUTEE để được hỗ trợ tài khoản.",
  },
};

export default function AuthDemoPage({ mode }: { mode: Mode }) {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "customer");
  return (
    <Stack spacing={3} sx={{ maxWidth: 640, mx: "auto" }}>
      <Typography variant="h1">{copy[mode].title}</Typography>
      <Typography color="text.secondary">{copy[mode].description}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Button
            component={Link}
            to={`/login?${new URLSearchParams({ returnTo })}`}
            variant="contained"
          >
            Đến đăng nhập
          </Button>
          {mode === "forgot-password" && (
            <Button component={Link} to="/reset-password">
              Thông tin đặt lại mật khẩu
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
