import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { services, localRepository } from "../../services";
import type { Portal } from "../types/database";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../../mocks/seed";
import { errorMessage } from "../lib/errors";
import { dateTime } from "../lib/format";
import { BoxTitle } from "./OrdersPage";
import { ErrorState, LoadingState } from "./Feedback";

function exportData() {
  const blob = new Blob([localRepository.exportRaw()], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "nutee-demo-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
export function ResetDemo({
  portal = "customer",
  recovery = false,
}: {
  portal?: Portal;
  recovery?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [exportError, setExportError] = useState("");
  const client = useQueryClient();
  const navigate = useNavigate();
  const reset = useMutation({
    mutationFn: services.demo.reset,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      setOpen(false);
      navigate(portal === "customer" ? "/" : "/management/login", {
        replace: true,
      });
    },
  });
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="outlined"
          startIcon={<DownloadRounded />}
          onClick={() => {
            try {
              exportData();
              setExportError("");
            } catch (error) {
              setExportError(errorMessage(error));
            }
          }}
        >
          Xuất dữ liệu hiện tại
        </Button>
        <Button
          variant={recovery ? "contained" : "outlined"}
          color="error"
          startIcon={<RestartAltRounded />}
          onClick={() => {
            reset.reset();
            setOpen(true);
          }}
        >
          Đặt lại demo
        </Button>
      </Stack>
      {exportError && <Alert severity="error">{exportError}</Alert>}
      <Dialog
        open={open}
        onClose={() => {
          if (!reset.isPending) setOpen(false);
        }}
        aria-labelledby="reset-title"
      >
        <DialogTitle id="reset-title">Đặt lại toàn bộ demo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Thay đổi trong cả hai portal sẽ bị xóa. Các phiên demo và giỏ khách
            sẽ được xóa, dữ liệu seed được tạo lại. Dữ liệu của ứng dụng khác
            được giữ nguyên. Bạn có thể xuất dữ liệu trước khi tiếp tục.
          </DialogContentText>
          {reset.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(reset.error)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={reset.isPending} onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={reset.isPending}
            onClick={() => reset.mutate()}
          >
            {reset.isPending ? "Đang đặt lại…" : "Xác nhận đặt lại"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
export default function DemoPage({ portal = "customer" }: { portal?: Portal }) {
  const stats = useQuery({
    queryKey: ["demo", "stats"],
    queryFn: services.demo.stats,
  });
  if (stats.isPending) return <LoadingState />;
  if (stats.isError)
    return (
      <ErrorState error={stats.error} retry={() => void stats.refetch()} />
    );
  return (
    <Stack spacing={3}>
      <BoxTitle
        title="Demo & dữ liệu"
        description="Kiểm tra nền tảng NUTEE: seed, phiên đăng nhập, quyền truy cập và lưu trữ."
      />
      <Alert severity="info">
        Bản M0–M1 sử dụng seed + localStorage trên cùng origin. Tài khoản, đơn
        và giao dịch đều là dữ liệu mô phỏng.
      </Alert>
      {!navigator.locks && (
        <Alert severity="warning">
          Trình duyệt không hỗ trợ Web Locks. Chỉ sửa dữ liệu trong một tab tại
          một thời điểm để tránh ghi đè đồng thời.
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {stats.data.counts.map((c) => (
          <Paper variant="outlined" key={c.label} sx={{ p: 3 }}>
            <Typography color="text.secondary" variant="body2">
              {c.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 32,
                fontWeight: 700,
                color: "primary.main",
                mt: 1,
              }}
            >
              {c.count}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3" component="h2">
            Phiên & tài khoản
          </Typography>
          {DEMO_ACCOUNTS.map((a) => (
            <Typography
              key={a.email}
              variant="body2"
              sx={{ overflowWrap: "anywhere" }}
            >
              <strong>{a.label}</strong> — {a.email}
            </Typography>
          ))}
          <Typography variant="body2">
            Mật khẩu chung: <strong>{DEMO_PASSWORD}</strong> · Phiên hết hạn sau
            8 giờ.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer và backoffice có phiên riêng. Đăng xuất một portal giữ
            nguyên phiên portal còn lại. Customer chỉ đọc đơn của mình; staff
            không được mở màn hình sản phẩm/tài khoản admin.
          </Typography>
        </Stack>
      </Paper>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h3" component="h2">
            Thử persistence
          </Typography>
          <Typography>
            1. Đăng nhập admin và mở “Sản phẩm demo”. Đổi tên/giá một sản phẩm
            đầu danh sách hoặc ẩn nó.
          </Typography>
          <Typography>
            2. Mở cửa hàng ở tab khác cùng địa chỉ và kiểm tra dữ liệu cập nhật.
            Tải lại trang để kiểm tra persistence.
          </Typography>
          <Typography>
            3. Đăng nhập customer, sửa tên hồ sơ. Đăng xuất customer rồi kiểm
            tra backoffice vẫn đăng nhập.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Schema v1 · Seed v1 · Revision {stats.data.revision}
            <br />
            Lần seed: {dateTime(stats.data.seededAt)}
          </Typography>
          <ResetDemo portal={portal} />
        </Stack>
      </Paper>
    </Stack>
  );
}
