import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { services } from "../../../services";
import { registrationSchema } from "../../../shared/types/account";
import { DEMO_PASSWORD } from "../../../mocks/seed";
import { ErrorState } from "../../../shared/components/Feedback";
import { ServiceError } from "../../../shared/lib/errors";
import { safeReturnTo } from "../../../shared/auth/redirect";
import { FormErrorSummary } from "../../../shared/components/FormErrorSummary";

type Mode =
  | "register"
  | "verify-email"
  | "forgot-password"
  | "reset-password"
  | "security";
const copy: Record<
  Exclude<Mode, "register">,
  { title: string; description: string }
> = {
  "verify-email": {
    title: "Xác minh email demo",
    description:
      "Tài khoản demo có thể đăng nhập ngay sau khi đăng ký. Bản demo chưa hỗ trợ xác minh qua email.",
  },
  "forgot-password": {
    title: "Quên mật khẩu demo",
    description:
      "Các tài khoản trong bản demo dùng chung mật khẩu bên dưới. Bản demo chưa gửi email hoặc liên kết khôi phục mật khẩu.",
  },
  "reset-password": {
    title: "Đặt lại mật khẩu demo",
    description:
      "Mật khẩu demo được cố định trong ứng dụng. Bản demo chưa hỗ trợ nhập mật khẩu mới qua liên kết xác thực.",
  },
  security: {
    title: "Bảo mật tài khoản",
    description:
      "Đây là phiên trải nghiệm lưu trên trình duyệt, có thời hạn 8 giờ. Bản demo dùng mật khẩu cố định; chưa hỗ trợ đổi mật khẩu hoặc liên kết tài khoản bên ngoài.",
  },
};
export default function AuthDemoPage({ mode }: { mode: Mode }) {
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo"), "customer");
  const loginUrl = `/login?${new URLSearchParams({ returnTo })}`;
  const [email, setEmail] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, submitCount },
  } = useForm<{ name: string; email: string }>({
    resolver: zodResolver(registrationSchema),
    shouldFocusError: false,
    defaultValues: { name: "", email: "" },
  });
  const create = useMutation({
    mutationFn: (fields: { name: string; email: string }) =>
      services.auth.register(fields.name, fields.email),
    onSuccess: (user) => setEmail(user.email),
    onError: (error) => {
      if (error instanceof ServiceError && error.fieldErrors?.email)
        setError("email", { message: error.fieldErrors.email });
    },
  });
  const { ref: nameRef, ...nameField } = register("name");
  const { ref: emailRef, ...emailField } = register("email");
  const text =
    mode === "register"
      ? {
          title: "Tạo tài khoản demo",
          description:
            "Tài khoản mới luôn là khách hàng. Hồ sơ, địa chỉ và giỏ hàng được lưu trong trình duyệt này.",
        }
      : copy[mode];
  return (
    <Stack spacing={3} sx={{ maxWidth: 640, mx: "auto" }}>
      <Typography variant="h1">{text.title}</Typography>
      <Typography color="text.secondary">{text.description}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Alert severity="info">
            Chỉ dùng dữ liệu mẫu. Mật khẩu chung:{" "}
            <strong>{DEMO_PASSWORD}</strong>. Không nhập thông tin đăng nhập
            thật.
          </Alert>
          {mode === "register" && !email && (
            <Stack
              component="form"
              noValidate
              spacing={2}
              onSubmit={handleSubmit((fields) => {
                if (!create.isPending) create.mutate(fields);
              })}
            >
              <FormErrorSummary
                submitCount={submitCount}
                errors={[
                  {
                    fieldId: "registration-name",
                    message: errors.name?.message ?? "",
                  },
                  {
                    fieldId: "registration-email",
                    message: errors.email?.message ?? "",
                  },
                ].filter((error) => !!error.message)}
              />
              <TextField
                label="Tên hiển thị"
                id="registration-name"
                {...nameField}
                inputRef={nameRef}
                error={!!errors.name}
                helperText={errors.name?.message}
                autoComplete="name"
                slotProps={{ htmlInput: { maxLength: 80 } }}
              />
              <TextField
                label="Email"
                id="registration-email"
                {...emailField}
                inputRef={emailRef}
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="email"
                type="email"
              />
              {create.isError && <ErrorState error={create.error} />}
              <Button
                type="submit"
                variant="contained"
                disabled={create.isPending}
              >
                {create.isPending ? "Đang tạo…" : "Tạo tài khoản demo"}
              </Button>
            </Stack>
          )}
          {email && (
            <Alert severity="success" role="status">
              Đã tạo tài khoản {email}. Đăng nhập với mật khẩu demo để gộp giỏ
              khách.
            </Alert>
          )}
          <Button
            component={Link}
            to={loginUrl}
            variant={mode === "register" && !email ? "text" : "contained"}
          >
            Đến đăng nhập
          </Button>
          {mode === "forgot-password" && (
            <Button component={Link} to="/reset-password">
              Thông tin đặt lại mật khẩu
            </Button>
          )}
          {mode === "register" && email && (
            <Button component={Link} to="/verify-email">
              Thông tin xác minh email
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
