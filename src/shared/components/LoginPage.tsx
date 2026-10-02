import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Portal } from "../types/database";
import { services } from "../../services";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../mocks/seed";
import { errorMessage } from "../lib/errors";
import { safeReturnTo } from "../auth/redirect";
import { Brand } from "./Brand";
import { tokens } from "../theme/tokens";

const schema = z.object({
  email: z.email("Nhập địa chỉ email hợp lệ."),
  password: z.string().min(1, "Nhập mật khẩu demo."),
});
type Fields = z.infer<typeof schema>;
export function LoginPage({ portal }: { portal: Portal }) {
  const management = portal === "backoffice";
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const client = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const login = useMutation({
    mutationFn: (fields: Fields) =>
      services.auth.login(portal, fields.email, fields.password),
    onSuccess: async (user) => {
      await client.cancelQueries({ queryKey: [portal] });
      client.removeQueries({ queryKey: [portal] });
      client.setQueryData(["session", portal], user);
      navigate(safeReturnTo(params.get("returnTo"), portal), {
        replace: true,
        state: { cartMergeNotices: user.cartMergeNotices },
      });
    },
  });
  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 9 },
          bgcolor: "secondary.main",
          color: "primary.contrastText",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Chip
          label={management ? "NUTEE / WORKSPACE" : "NUTEE / STORE"}
          sx={{
            color: "inherit",
            border: "1px solid",
            borderColor: "primary.light",
            alignSelf: "flex-start",
          }}
        />
        <Box sx={{ py: 8, position: "relative", zIndex: 1 }}>
          <Typography variant="h1" component="h2">
            {management
              ? "Một không gian.\nVận hành kết nối."
              : "Công nghệ tốt.\nTrải nghiệm tốt hơn."}
          </Typography>
          <Typography sx={{ mt: 3, maxWidth: 430, opacity: 0.85 }}>
            {management
              ? "Theo dõi dữ liệu bán hàng và cộng tác trong một workspace dành riêng cho đội ngũ NUTEE."
              : "Chào mừng bạn đến với không gian công nghệ NUTEE. Những thiết bị cho công việc và cuộc sống mỗi ngày."}
          </Typography>
        </Box>
        <Typography variant="body2">
          {management
            ? "Dành cho nhân viên & quản trị viên"
            : "Dành cho khách hàng"}{" "}
          · Bản demo M0–M1
        </Typography>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            border: "70px solid",
            borderColor: "primary.main",
            borderRadius: "50%",
            right: -230,
            bottom: 90,
            opacity: 0.6,
          }}
        />
      </Box>
      <Stack
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          px: { xs: 3, sm: 6 },
          py: 5,
          maxWidth: 600,
          width: "100%",
          mx: "auto",
          justifyContent: "center",
        }}
        spacing={3}
      >
        <Brand management={management} />
        <Box>
          <Typography variant="h2" component="h1">
            {management ? "Đăng nhập vận hành" : "Đăng nhập cửa hàng"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Sử dụng tài khoản demo để khám phá nền tảng.
          </Typography>
        </Box>
        <Alert severity="info">
          Phiên mô phỏng, không gửi email. Chỉ dùng thông tin demo bên dưới.
        </Alert>
        <Stack
          component="form"
          onSubmit={handleSubmit((fields) => login.mutate(fields))}
          noValidate
          spacing={2}
        >
          <TextField
            label="Email"
            autoComplete="username"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Mật khẩu demo"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <VisibilityOffOutlined />
                      ) : (
                        <VisibilityOutlined />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {login.isError && (
            <Alert severity="error">{errorMessage(login.error)}</Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={login.isPending}
            endIcon={<ArrowForwardRounded />}
          >
            {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </Stack>
        <Paper
          variant="outlined"
          sx={{ p: 2.5, bgcolor: tokens.color.blueTint }}
        >
          <Typography variant="subtitle2">Tài khoản trải nghiệm</Typography>
          <Typography variant="body2" sx={{ my: 1 }}>
            Mật khẩu chung: <strong>{DEMO_PASSWORD}</strong>
          </Typography>
          <Stack spacing={1}>
            {DEMO_ACCOUNTS.filter((a) =>
              management ? a.role !== "customer" : a.role === "customer",
            ).map((a) => (
              <Button
                key={a.email}
                variant="outlined"
                sx={{
                  justifyContent: "space-between",
                  textAlign: "left",
                  flexWrap: "wrap",
                }}
                onClick={() => {
                  setValue("email", a.email, { shouldValidate: true });
                  setValue("password", DEMO_PASSWORD, { shouldValidate: true });
                  login.reset();
                }}
              >
                <span>{a.label}</span>
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ overflowWrap: "anywhere" }}
                >
                  {a.email}
                </Typography>
              </Button>
            ))}
          </Stack>
        </Paper>
        {!management && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              component={Link}
              to={`/register?${new URLSearchParams({ returnTo: safeReturnTo(params.get("returnTo"), portal) })}`}
            >
              Tạo tài khoản demo
            </Button>
            <Button component={Link} to="/forgot-password">
              Quên mật khẩu
            </Button>
          </Stack>
        )}
        <Button
          component={Link}
          to={management ? "/login" : "/management/login"}
          color="secondary"
        >
          {management
            ? "Đến đăng nhập khách hàng"
            : "Đến đăng nhập nhân viên / admin"}
        </Button>
      </Stack>
    </Box>
  );
}
