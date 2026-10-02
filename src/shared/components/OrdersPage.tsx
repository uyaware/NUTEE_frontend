import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { services } from "../../services";
import type { Portal } from "../types/database";
import { useSession } from "../auth/useSession";
import { dateTime, money } from "../lib/format";
import { EmptyState, ErrorState, LoadingState } from "./Feedback";
import { StatusBadge } from "./StatusBadge";

export function OrdersPage({
  portal,
  compact = false,
}: {
  portal: Portal;
  compact?: boolean;
}) {
  const session = useSession(portal);
  const orders = useQuery({
    queryKey: [portal, session.data?.id, "orders"],
    queryFn: () => services.orders.list(portal),
  });
  if (orders.isPending) return <LoadingState />;
  if (orders.isError)
    return (
      <ErrorState error={orders.error} retry={() => void orders.refetch()} />
    );
  return (
    <Stack spacing={3}>
      {!compact && (
        <BoxTitle
          title={portal === "customer" ? "Đơn hàng của bạn" : "Đơn hàng mẫu"}
          description="Danh sách đọc từ seed. Luồng tạo và xử lý đơn được triển khai ở M4–M5."
        />
      )}
      <Paper variant="outlined">
        {compact && (
          <Typography variant="h3" component="h2" sx={{ p: 3 }}>
            Đơn hàng gần đây
          </Typography>
        )}
        {!orders.data.items.length ? (
          <EmptyState
            title="Chưa có đơn hàng"
            description="Đơn hàng mới sẽ xuất hiện tại đây."
          />
        ) : (
          <TableContainer>
            <Table aria-label="Danh sách đơn hàng" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Mã đơn</TableCell>
                  <TableCell>Ngày tạo</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell align="right">Chi tiết</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.data.items.slice(0, compact ? 5 : 20).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell component="th" scope="row">
                      {o.id.toUpperCase()}
                    </TableCell>
                    <TableCell>{dateTime(o.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {money(o.total)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={Link}
                        to={`${portal === "customer" ? "/account/orders" : "/management/orders"}/${o.id}`}
                        aria-label={`Xem đơn ${o.id}`}
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}
export function OrderDetailPage({ portal }: { portal: Portal }) {
  const { id = "" } = useParams();
  const session = useSession(portal);
  const query = useQuery({
    queryKey: [portal, session.data?.id, "order", id],
    queryFn: () => services.orders.detail(portal, id),
  });
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  const order = query.data;
  return (
    <Stack spacing={3}>
      <BoxTitle
        title={`Đơn ${order.id.toUpperCase()}`}
        description="Thông tin và địa chỉ được snapshot tại thời điểm mua trong seed."
      />
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <StatusBadge status={order.status} />
          <Typography>Người nhận: {order.address.recipient}</Typography>
          <Typography>{order.address.line}</Typography>
          <Typography>
            Tổng thanh toán: <strong>{money(order.total)}</strong>
          </Typography>
          <Typography>
            Thanh toán mẫu: {order.paymentMethod.toUpperCase()} ·{" "}
            {order.paymentStatus}
          </Typography>
          <Typography variant="h3" component="h2">
            Lịch sử
          </Typography>
          {order.history.map((h, i) => (
            <Stack key={i} direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StatusBadge status={h.status} />
              <Typography variant="body2">{dateTime(h.at)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
      <Button
        component={Link}
        to={portal === "customer" ? "/account/orders" : "/management/orders"}
      >
        Quay lại danh sách
      </Button>
    </Stack>
  );
}
export function BoxTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="h2" component="h1">
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Stack>
  );
}
