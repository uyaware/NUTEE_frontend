import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
export function SystemPage({
  forbidden = false,
  management = false,
}: {
  forbidden?: boolean;
  management?: boolean;
}) {
  return (
    <Stack
      alignItems="center"
      spacing={2}
      sx={{ py: 8, px: 3, textAlign: "center" }}
    >
      <Typography sx={{ fontSize: 80, fontWeight: 700, color: "primary.main" }}>
        {forbidden ? "403" : "404"}
      </Typography>
      <Typography variant="h2" component="h1">
        {forbidden ? "Bạn chưa có quyền truy cập" : "Không tìm thấy trang"}
      </Typography>
      <Typography color="text.secondary">
        {forbidden
          ? "Chọn portal và tài khoản phù hợp để tiếp tục."
          : "Đường dẫn không tồn tại trong bản nền tảng này."}
      </Typography>
      <Button
        variant="contained"
        component={Link}
        to={management ? "/management" : "/"}
      >
        Về {management ? "workspace" : "trang chủ"}
      </Button>
      <Button component={Link} to={management ? "/management/login" : "/login"}>
        Đăng nhập tài khoản khác
      </Button>
    </Stack>
  );
}
