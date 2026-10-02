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
  security: {
    title: "Bảo mật tài khoản",
    description:
      "Phiên đăng nhập có thời hạn 8 giờ. Bạn nên đăng xuất khi sử dụng thiết bị dùng chung. Đổi mật khẩu và liên kết tài khoản hiện chưa khả dụng.",
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
          title: "Tạo tài khoản",
          description:
            "Tạo tài khoản NUTEE để quản lý hồ sơ, địa chỉ giao hàng và giỏ hàng của bạn.",
        }
      : copy[mode];
  return (
    <Stack spacing={3} sx={{ maxWidth: 640, mx: "auto" }}>
      <Typography variant="h1">{text.title}</Typography>
      <Typography color="text.secondary">{text.description}</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
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
                {create.isPending ? "Đang tạo…" : "Tạo tài khoản"}
              </Button>
            </Stack>
          )}
          {email && (
            <Alert severity="success" role="status">
              Đã tạo tài khoản {email}.
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
