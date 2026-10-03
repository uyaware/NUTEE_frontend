import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { prototypeOrders } from "../../../mocks/checkout";
import { EmptyState } from "../../../shared/components/Feedback";
import { OrderProducts } from "../components/CheckoutSummary";

export default function ReviewPage() {
  const { id, itemId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState<number | null>(5);
  const [comment, setComment] = useState(
    "Sản phẩm đẹp, giao hàng nhanh và đóng gói cẩn thận. Mình rất hài lòng!",
  );
  const order = prototypeOrders.find(
    (item) => item.id === id && item.userId === "customer-1",
  );
  const item = order?.items.find((product) => product.id === itemId);
  if (!order || !item || order.status !== "delivered")
    return (
      <Stack spacing={2}>
        <EmptyState
          title="Chưa thể đánh giá"
          description="Chọn sản phẩm từ một đơn mẫu đã giao để xem form đánh giá."
        />
        <Button component={Link} to="/account/orders">
          Về danh sách đơn hàng
        </Button>
      </Stack>
    );
  const detailPath = `/account/orders/${order.id}`;
  return (
    <Paper
      variant="outlined"
      sx={{ maxWidth: 720, mx: "auto", p: { xs: 2, sm: 4 } }}
    >
      {params.get("sent") === "1" ? (
        <Stack spacing={3} alignItems="center" textAlign="center">
          <CheckCircleOutlineRounded color="success" sx={{ fontSize: 72 }} />
          <Typography variant="h1">Cảm ơn đánh giá của bạn!</Typography>
          <Typography color="text.secondary">
            Đây là màn hình xác nhận mẫu. Nội dung đánh giá không được lưu hoặc
            đăng lên sản phẩm.
          </Typography>
          <Button component={Link} to={detailPath} variant="contained">
            Quay lại đơn hàng
          </Button>
          <Button component={Link} to={`/products/${item.productId}`}>
            Xem sản phẩm
          </Button>
        </Stack>
      ) : (
        <Stack
          component="form"
          spacing={3}
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/account/orders/${order.id}/review/${item.id}?sent=1`);
          }}
        >
          <Typography variant="h1">Đánh giá sản phẩm</Typography>
          <Typography color="text.secondary">
            Chia sẻ trải nghiệm của bạn với sản phẩm đã nhận.
          </Typography>
          <OrderProducts items={[item]} />
          <Stack spacing={1}>
            <Typography component="label" id="review-rating-label">
              Mức độ hài lòng
            </Typography>
            <Rating
              aria-labelledby="review-rating-label"
              name="product-rating"
              value={rating}
              onChange={(_, value) => setRating(value)}
              size="large"
              getLabelText={(value) => `${value} sao`}
              sx={{ alignSelf: "flex-start", "& .MuiRating-label": { p: 0.5 } }}
            />
          </Stack>
          <TextField
            label="Nhận xét của bạn"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            multiline
            minRows={4}
            helperText="Nội dung mẫu có thể chỉnh sửa để xem giao diện."
          />
          <Alert severity="info">Form minh họa cho đơn hàng đã giao.</Alert>
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            gap={1.5}
            justifyContent="space-between"
          >
            <Button component={Link} to={detailPath} variant="outlined">
              Quay lại đơn hàng
            </Button>
            <Button type="submit" variant="contained">
              Gửi đánh giá
            </Button>
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
