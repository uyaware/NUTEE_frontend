import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "../../../services";
import { useLogout, useSession } from "../../../shared/auth/useSession";
import { ErrorState, LoadingState } from "../../../shared/components/Feedback";
import { errorMessage } from "../../../shared/lib/errors";

export default function ProfilePage() {
  const session = useSession("customer");
  const client = useQueryClient();
  const logout = useLogout("customer");
  const profile = useQuery({
    queryKey: ["customer", session.data?.id, "profile"],
    queryFn: services.profile.get,
  });
  const [edit, setEdit] = useState<{ name: string; revision: number } | null>(
    null,
  );
  const save = useMutation({
    mutationFn: () => services.profile.updateName(edit!.name, edit!.revision),
    onSuccess: async () => {
      setEdit(null);
      await client.invalidateQueries();
    },
  });
  if (profile.isPending) return <LoadingState />;
  if (profile.isError)
    return (
      <ErrorState error={profile.error} retry={() => void profile.refetch()} />
    );
  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography variant="h1">Tài khoản của bạn</Typography>
      <Typography color="text.secondary">
        Hồ sơ demo của {profile.data.user.name}. Thay đổi được giữ sau khi tải
        lại trang.
      </Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack
          spacing={2}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (edit) save.mutate();
          }}
        >
          <TextField
            label="Tên hiển thị"
            value={edit?.name ?? profile.data.user.name}
            onChange={(event) => {
              setEdit({
                name: event.target.value,
                revision: edit?.revision ?? profile.data.revision,
              });
              save.reset();
            }}
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
          <TextField
            label="Email demo"
            value={profile.data.user.email}
            slotProps={{ input: { readOnly: true } }}
          />
          {save.isError && (
            <Alert severity="error">
              {errorMessage(save.error)}
              <Button
                onClick={() => {
                  setEdit(null);
                  save.reset();
                  void profile.refetch();
                }}
              >
                Tải lại hồ sơ mới
              </Button>
            </Alert>
          )}
          {save.isSuccess && <Alert severity="success">Đã lưu hồ sơ.</Alert>}
          <Button
            type="submit"
            variant="contained"
            disabled={save.isPending || !edit}
          >
            {save.isPending ? "Đang lưu…" : "Lưu hồ sơ"}
          </Button>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Địa chỉ giao hàng
        </Typography>
        {profile.data.addresses.map((a) => (
          <Typography key={a.id}>
            {a.recipient} · {a.line}
          </Typography>
        ))}
        <Button component={Link} to="/account/addresses" sx={{ mt: 2 }}>
          Quản lý địa chỉ
        </Button>
      </Paper>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button component={Link} to="/account/orders" variant="outlined">
          Đơn hàng mẫu của tôi
        </Button>
        <Button onClick={() => logout.mutate()} disabled={logout.isPending}>
          Đăng xuất cửa hàng
        </Button>
      </Stack>
      {logout.isError && <ErrorState error={logout.error} />}
    </Stack>
  );
}
