import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { services } from "../../../services";
import { useSession } from "../../../shared/auth/useSession";
import { addressInputSchema } from "../../../shared/types/account";
import type { AddressInput } from "../../../shared/types/account";
import type { Database } from "../../../shared/types/database";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../shared/components/Feedback";
import { ServiceError } from "../../../shared/lib/errors";
import { FormErrorSummary } from "../../../shared/components/FormErrorSummary";

type Address = Database["addresses"][number];
function AddressEditor({
  address,
  revision,
  close,
}: {
  address: Address | null;
  revision: number;
  close: () => void;
}) {
  const client = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, submitCount },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    shouldFocusError: false,
    defaultValues: address ?? {
      recipient: "",
      phone: "",
      line: "",
      isDefault: false,
    },
  });
  const save = useMutation({
    mutationFn: (fields: AddressInput) =>
      services.profile.saveAddress(address?.id ?? null, fields, revision),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["customer"] });
      close();
    },
    onError: (error) => {
      if (error instanceof ServiceError && error.fieldErrors)
        for (const field of ["recipient", "phone", "line"] as const) {
          if (error.fieldErrors[field])
            setError(field, { message: error.fieldErrors[field] });
        }
    },
  });
  const { ref: recipientRef, ...recipientField } = register("recipient");
  const { ref: phoneRef, ...phoneField } = register("phone");
  const { ref: lineRef, ...lineField } = register("line");
  return (
    <Dialog
      open
      onClose={() => {
        if (!save.isPending) close();
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby="address-editor-title"
      slotProps={{
        transition: {
          onEntered: () =>
            document.getElementById("address-recipient")?.focus(),
        },
      }}
    >
      <form
        noValidate
        onSubmit={handleSubmit((fields) => {
          if (!save.isPending) save.mutate(fields);
        })}
      >
        <DialogTitle id="address-editor-title">
          {address ? "Sửa địa chỉ" : "Thêm địa chỉ"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormErrorSummary
              submitCount={submitCount}
              errors={[
                {
                  fieldId: "address-recipient",
                  message: errors.recipient?.message ?? "",
                },
                {
                  fieldId: "address-phone",
                  message: errors.phone?.message ?? "",
                },
                {
                  fieldId: "address-line",
                  message: errors.line?.message ?? "",
                },
              ].filter((error) => !!error.message)}
            />
            {save.isError && <ErrorState error={save.error} />}
            {save.error instanceof ServiceError &&
              save.error.code === "CONFLICT" && (
                <Alert severity="info">
                  Đóng form và tải lại danh sách để kiểm tra dữ liệu mới. Nội
                  dung đang nhập được giữ cho đến khi bạn đóng.
                </Alert>
              )}
            <TextField
              label="Người nhận"
              id="address-recipient"
              autoFocus
              {...recipientField}
              inputRef={recipientRef}
              error={!!errors.recipient}
              helperText={errors.recipient?.message}
              autoComplete="name"
              slotProps={{ htmlInput: { maxLength: 80 } }}
            />
            <TextField
              label="Số điện thoại"
              id="address-phone"
              {...phoneField}
              inputRef={phoneRef}
              error={!!errors.phone}
              helperText={errors.phone?.message ?? "Ví dụ: 0900000000"}
              type="tel"
              autoComplete="tel"
            />
            <TextField
              label="Địa chỉ giao hàng"
              id="address-line"
              {...lineField}
              inputRef={lineRef}
              error={!!errors.line}
              helperText={
                errors.line?.message ??
                "Số nhà, đường, phường/xã, tỉnh/thành phố."
              }
              autoComplete="street-address"
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: 240 } }}
            />
            <Controller
              name="isDefault"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      disabled={address?.isDefault}
                    />
                  }
                  label="Địa chỉ mặc định"
                />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              Địa chỉ đầu tiên tự trở thành mặc định. Muốn thay đổi, chọn một
              địa chỉ khác làm mặc định.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={save.isPending}>
            Hủy
          </Button>
          <Button type="submit" variant="contained" disabled={save.isPending}>
            {save.isPending ? "Đang lưu…" : "Lưu địa chỉ"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function AddressesPage() {
  const session = useSession("customer");
  const client = useQueryClient();
  const profile = useQuery({
    queryKey: ["customer", session.data?.id, "profile"],
    queryFn: services.profile.get,
  });
  const [edit, setEdit] = useState<{
    address: Address | null;
    revision: number;
    ownerId: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<{
    address: Address;
    revision: number;
    ownerId: string;
  } | null>(null);
  const action = useMutation({
    mutationFn: ({
      id,
      revision,
      remove,
    }: {
      id: string;
      revision: number;
      remove?: boolean;
    }) =>
      remove
        ? services.profile.removeAddress(id, revision)
        : services.profile.setDefaultAddress(id, revision),
    onSuccess: async () => {
      setDeleting(null);
      await client.invalidateQueries({ queryKey: ["customer"] });
    },
  });
  if (profile.isPending) return <LoadingState />;
  if (profile.isError)
    return (
      <ErrorState error={profile.error} retry={() => void profile.refetch()} />
    );
  const data = profile.data;
  return (
    <Stack spacing={3} sx={{ maxWidth: 800 }}>
      <Typography variant="h1">Địa chỉ giao hàng</Typography>
      <Typography color="text.secondary">
        Quản lý địa chỉ nhận hàng của bạn. Địa chỉ trên đơn đã tạo được giữ
        nguyên.
      </Typography>
      {action.isError && (
        <ErrorState
          error={action.error}
          retry={() => {
            action.reset();
            void profile.refetch();
          }}
        />
      )}
      {action.isSuccess && (
        <Alert severity="success" role="status">
          Đã cập nhật địa chỉ.
        </Alert>
      )}
      <Button
        variant="contained"
        sx={{ alignSelf: "flex-start" }}
        onClick={() =>
          setEdit({
            address: null,
            revision: data.revision,
            ownerId: data.user.id,
          })
        }
      >
        Thêm địa chỉ
      </Button>
      {!data.addresses.length && (
        <EmptyState
          title="Chưa có địa chỉ"
          description="Thêm người nhận và địa chỉ giao hàng đầu tiên."
        />
      )}
      {data.addresses.map((address) => (
        <Paper
          key={address.id}
          variant="outlined"
          sx={{ p: 3, overflowWrap: "anywhere" }}
        >
          <Stack spacing={1}>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              gap={1}
              alignItems="center"
            >
              <Typography variant="h3" component="h2">
                {address.recipient}
              </Typography>
              {address.isDefault && (
                <Chip size="small" label="Mặc định" color="primary" />
              )}
            </Stack>
            <Typography>{address.phone}</Typography>
            <Typography>{address.line}</Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              <Button
                disabled={action.isPending}
                onClick={() =>
                  setEdit({
                    address,
                    revision: data.revision,
                    ownerId: data.user.id,
                  })
                }
                aria-label={`Sửa địa chỉ ${address.recipient}`}
              >
                Sửa
              </Button>
              {!address.isDefault && (
                <Button
                  disabled={action.isPending}
                  onClick={() =>
                    action.mutate({ id: address.id, revision: data.revision })
                  }
                  aria-label={`Đặt ${address.recipient} làm mặc định`}
                >
                  Đặt làm mặc định
                </Button>
              )}
              <Button
                color="error"
                disabled={action.isPending}
                onClick={() => {
                  action.reset();
                  setDeleting({
                    address,
                    revision: data.revision,
                    ownerId: data.user.id,
                  });
                }}
                aria-label={`Xóa địa chỉ ${address.recipient}`}
              >
                Xóa
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ))}
      {edit && edit.ownerId === data.user.id && (
        <AddressEditor
          key={`${edit.ownerId}:${edit.address?.id ?? "new"}`}
          address={edit.address}
          revision={edit.revision}
          close={() => setEdit(null)}
        />
      )}
      <Dialog
        open={!!deleting && deleting.ownerId === data.user.id}
        onClose={() => {
          if (!action.isPending) setDeleting(null);
        }}
        aria-labelledby="delete-address-title"
      >
        <DialogTitle id="delete-address-title">Xóa địa chỉ này?</DialogTitle>
        <DialogContent>
          <Typography>{deleting?.address.line}</Typography>
          <Typography sx={{ mt: 1 }}>
            Nếu xóa địa chỉ mặc định, địa chỉ còn lại đầu tiên sẽ thay thế.
          </Typography>
          {action.isError && <ErrorState error={action.error} />}
        </DialogContent>
        <DialogActions>
          <Button disabled={action.isPending} onClick={() => setDeleting(null)}>
            Hủy
          </Button>
          <Button
            color="error"
            disabled={action.isPending}
            onClick={() => {
              if (deleting)
                action.mutate({
                  id: deleting.address.id,
                  revision: deleting.revision,
                  remove: true,
                });
            }}
          >
            Xác nhận xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
