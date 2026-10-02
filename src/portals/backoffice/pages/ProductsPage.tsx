import { useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "../../../services";
import type { ProductSummary } from "../../../shared/types/database";
import { useSession } from "../../../shared/auth/useSession";
import { ErrorState, LoadingState } from "../../../shared/components/Feedback";
import { BoxTitle } from "../../../shared/components/OrdersPage";
import { money } from "../../../shared/lib/format";
import { errorMessage } from "../../../shared/lib/errors";

export default function ProductsPage() {
  const session = useSession("backoffice");
  const client = useQueryClient();
  const products = useQuery({
    queryKey: ["backoffice", session.data?.id, "products"],
    queryFn: services.management.products,
  });
  const [edit, setEdit] = useState<{
    product: ProductSummary;
    revision: number;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const save = useMutation({
    mutationFn: (input: {
      name: string;
      price: number;
      status: "published" | "hidden";
    }) =>
      services.management.updateProduct(
        edit!.product.id,
        input,
        edit!.revision,
      ),
    onSuccess: async () => {
      setEdit(null);
      setSuccess(true);
      await client.invalidateQueries();
    },
  });
  if (products.isPending) return <LoadingState />;
  if (products.isError)
    return (
      <ErrorState
        error={products.error}
        retry={() => void products.refetch()}
      />
    );
  return (
    <Stack spacing={3}>
      <BoxTitle
        title="Sản phẩm"
        description="Quản lý tên, giá và trạng thái hiển thị của sản phẩm."
      />
      <Paper variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="Sản phẩm">
            <TableHead>
              <TableRow>
                <TableCell>Sản phẩm</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Giá</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell component="th" scope="row">
                    {p.name}
                    <br />
                    <small>
                      {p.sku} · {p.brandName}
                    </small>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.status === "published" ? "Công khai" : "Đã ẩn"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">{money(p.price)}</TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => {
                        save.reset();
                        setEdit({
                          product: p,
                          revision: products.data.revision,
                        });
                      }}
                    >
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Dialog
        open={!!edit}
        onClose={() => {
          if (!save.isPending) setEdit(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Sửa sản phẩm</DialogTitle>
        {edit && (
          <Stack
            key={`${edit.product.id}:${edit.revision}`}
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget as HTMLFormElement);
              save.mutate({
                name: String(data.get("name")),
                price: Number(data.get("price")),
                status: data.get("status") as "published" | "hidden",
              });
            }}
          >
            <DialogContent>
              <Stack spacing={3} sx={{ pt: 1 }}>
                <TextField
                  name="name"
                  label="Tên sản phẩm"
                  defaultValue={edit.product.name}
                  required
                  slotProps={{ htmlInput: { maxLength: 160 } }}
                />
                <TextField
                  name="price"
                  label="Giá (VND)"
                  type="number"
                  defaultValue={edit.product.price}
                  required
                  slotProps={{
                    htmlInput: { min: 1000, max: 1000000000, step: 1 },
                  }}
                />
                <TextField
                  select
                  name="status"
                  label="Trạng thái"
                  defaultValue={edit.product.status}
                >
                  <MenuItem value="published">Công khai</MenuItem>
                  <MenuItem value="hidden">Ẩn</MenuItem>
                </TextField>
                {save.isError && (
                  <Alert severity="error">
                    {errorMessage(save.error)}
                    <Button
                      onClick={() => {
                        void products.refetch().then((result) => {
                          if (result.data) {
                            const fresh = result.data.items.find(
                              (p) => p.id === edit.product.id,
                            );
                            if (fresh) {
                              setEdit({
                                product: fresh,
                                revision: result.data.revision,
                              });
                              save.reset();
                            }
                          }
                        });
                      }}
                    >
                      Tải lại bản mới
                    </Button>
                  </Alert>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEdit(null)} disabled={save.isPending}>
                Hủy
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={save.isPending}
              >
                {save.isPending ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </DialogActions>
          </Stack>
        )}
      </Dialog>
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Đã lưu sản phẩm và cập nhật cửa hàng.
        </Alert>
      </Snackbar>
    </Stack>
  );
}
