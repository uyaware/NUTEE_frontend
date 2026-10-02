import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { services } from "../../../services";
import { useSession } from "../../../shared/auth/useSession";
import { roleLabels } from "../../../shared/auth/permissions";
import { ErrorState, LoadingState } from "../../../shared/components/Feedback";
import { OrdersPage } from "../../../shared/components/OrdersPage";
import { money } from "../../../shared/lib/format";
import { tokens } from "../../../shared/theme/tokens";

export default function DashboardPage() {
  const session = useSession("backoffice");
  const query = useQuery({
    queryKey: ["backoffice", session.data?.id, "dashboard"],
    queryFn: services.management.dashboard,
  });
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const data = query.data;
  const metrics =
    session.data?.role === "admin"
      ? [
          {
            label: "Doanh thu đã thanh toán",
            value: money(data.paidRevenue ?? 0),
            note: "Tổng đơn paid, không gồm đơn hủy",
          },
          {
            label: "Tổng đơn hàng",
            value: data.orders,
            note: "Tất cả đơn trong seed",
          },
          {
            label: "Chờ xác nhận",
            value: data.pending,
            note: "Trạng thái pending",
          },
          {
            label: "Sản phẩm công khai",
            value: data.products,
            note: "Trạng thái published",
          },
        ]
      : [
          {
            label: "Tổng đơn vận hành",
            value: data.orders,
            note: "Phạm vi demo: toàn bộ đơn",
          },
          {
            label: "Chờ xác nhận",
            value: data.pending,
            note: "Trạng thái pending",
          },
          {
            label: "Hậu mãi cần xem",
            value: data.afterSales,
            note: "Pending và reviewing",
          },
        ];
  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="overline" color="text.secondary">
            WORKSPACE / TỔNG QUAN
          </Typography>
          <Typography variant="h2" component="h1">
            Chào {session.data?.name}.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Không gian vận hành dành cho{" "}
            {roleLabels[session.data!.role].toLowerCase()}.
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/management/demo"
          variant="outlined"
          endIcon={<ArrowForwardRounded />}
          sx={{ alignSelf: "flex-start" }}
        >
          Kiểm tra nền tảng
        </Button>
      </Stack>
      <Alert severity="info">
        Bản nền tảng M0–M1. Số liệu được tính từ dữ liệu seed dùng chung với cửa
        hàng.
      </Alert>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: `repeat(${metrics.length}, 1fr)`,
          },
          gap: 2.5,
        }}
      >
        {metrics.map((m, i) => (
          <Paper
            key={m.label}
            variant="outlined"
            sx={{
              p: 3,
              ...(i === 0 ? { bgcolor: tokens.color.blueTint } : {}),
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {m.label}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "clamp(1.6rem, 2.5vw, 2rem)",
                my: 2,
                fontVariantNumeric: "tabular-nums",
                color: i === 0 ? "primary.main" : "text.primary",
              }}
            >
              {m.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {m.note}
            </Typography>
          </Paper>
        ))}
      </Box>
      <OrdersPage portal="backoffice" compact />
      <Paper
        sx={{
          p: 3,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
        }}
      >
        <Typography variant="h3" component="h2">
          Dữ liệu được kết nối
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Thay đổi tên, giá hoặc trạng thái sản phẩm bằng tài khoản admin, rồi
          mở cửa hàng ở tab khác để kiểm tra đồng bộ.
        </Typography>
      </Paper>
    </Stack>
  );
}
