import { useState } from "react";
import {
  Alert,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "../../../services";
import { useSession } from "../../../shared/auth/useSession";
import { ErrorState, LoadingState } from "../../../shared/components/Feedback";
import { errorMessage } from "../../../shared/lib/errors";

export default function ProfilePage() {
  const session = useSession("customer");
  const client = useQueryClient();
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
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h1">Hồ sơ cá nhân</Typography>
        <Typography color="text.secondary">
          Cập nhật thông tin để NUTEE hỗ trợ bạn tốt hơn.
        </Typography>
      </Stack>
      <Paper variant="outlined">
        <Stack spacing={0.5} sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h3" component="h2">
            Thông tin cơ bản
          </Typography>
          <Typography color="text.secondary">
            Thông tin gắn với tài khoản của bạn.
          </Typography>
        </Stack>
        <Divider />
        <Stack
          spacing={2}
          sx={{ p: { xs: 2.5, sm: 3 } }}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (edit) save.mutate();
          }}
        >
          <TextField
            label="Tên hiển thị"
            autoComplete="name"
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
            label="Email"
            value={profile.data.user.email}
            slotProps={{ input: { readOnly: true } }}
            helperText="Email được sử dụng để đăng nhập."
          />
          <TextField
            label="Số điện thoại"
            value={
              profile.data.user.phone ??
              profile.data.addresses.find((address) => address.isDefault)
                ?.phone ??
              ""
            }
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
            sx={{ alignSelf: { xs: "stretch", sm: "flex-end" }, minWidth: 160 }}
          >
            {save.isPending ? "Đang lưu…" : "Lưu hồ sơ"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
