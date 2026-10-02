import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { services } from "../../../services";
import { useCart } from "../components/useCart";
import { ProductImage } from "../components/ProductImage";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../shared/components/Feedback";
import { money } from "../../../shared/lib/format";
import { MAX_CART_QUANTITY } from "../../../shared/types/cart";
import { DataRecovery } from "../../../shared/components/DataRecovery";
import { ServiceError } from "../../../shared/lib/errors";
import { tokens } from "../../../shared/theme/tokens";

const issueLabels = {
  hidden: "Sản phẩm đã ngừng bán",
  "out-of-stock": "Tạm hết hàng",
  "insufficient-stock": "Số lượng vượt tồn kho",
  available: "Còn hàng",
};
export default function CartPage() {
  const cart = useCart();
  const client = useQueryClient();
  const change = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity?: number }) =>
      quantity === undefined
        ? services.cart.remove(id, cart.data!.revision, cart.data!.ownerId)
        : services.cart.setQuantity(
            id,
            quantity,
            cart.data!.revision,
            cart.data!.ownerId,
          ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["customer"] }),
  });
  if (cart.isPending) return <LoadingState />;
  if (cart.isError)
    return (
      <Stack spacing={2}>
        <ErrorState error={cart.error} retry={() => void cart.refetch()} />
        {cart.error instanceof ServiceError &&
          cart.error.code === "CORRUPT_DATA" && <DataRecovery />}
      </Stack>
    );
  const data = cart.data;
  return (
    <Stack spacing={3}>
      <Typography variant="h1">Giỏ hàng của bạn</Typography>
      <Typography color="text.secondary">
        {data.ownerId
          ? "Giỏ được lưu theo tài khoản."
          : "Giỏ khách được lưu trên trình duyệt này. Đăng nhập để gộp vào giỏ tài khoản."}{" "}
        Giá và tình trạng bán được cập nhật khi mở giỏ.
      </Typography>
      {change.isError && (
        <ErrorState
          error={change.error}
          retry={() => {
            change.reset();
            void cart.refetch();
          }}
        />
      )}
      {change.isSuccess && (
        <Alert severity="success" role="status">
          Đã cập nhật giỏ hàng.
        </Alert>
      )}
      {!data.items.length ? (
        <>
          <EmptyState
            title="Giỏ hàng đang trống"
            description="Khám phá sản phẩm và thêm món bạn muốn mua."
          />
          <Button
            component={Link}
            to="/products"
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            Khám phá sản phẩm
          </Button>
        </>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 320px" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Stack spacing={2}>
            {data.items.map((item) => (
              <Paper
                component="article"
                key={item.productId}
                variant="outlined"
                sx={{ p: { xs: 2, sm: 3 } }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: { xs: 72, sm: 112 },
                        height: 90,
                        flexShrink: 0,
                      }}
                    >
                      <ProductImage
                        src={item.imageUrl}
                        alt={`Minh họa ${item.name}`}
                      />
                    </Box>
                    <Stack spacing={1} sx={{ minWidth: 0 }}>
                      <Typography
                        component="h2"
                        variant="h3"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        {item.status === "hidden" ? (
                          item.name
                        ) : (
                          <Link to={`/products/${item.productId}`}>
                            {item.name}
                          </Link>
                        )}
                      </Typography>
                      <Typography>{money(item.price)} / sản phẩm</Typography>
                      <Chip
                        label={issueLabels[item.status]}
                        color={
                          item.status === "available" ? "success" : "warning"
                        }
                        size="small"
                        sx={{ alignSelf: "flex-start" }}
                      />
                    </Stack>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      sx={{
                        height: tokens.layout.controlHeight,
                        boxShadow: (theme) =>
                          `inset 0 0 0 1px ${theme.palette.divider}`,
                        borderRadius: 1,
                        "& .MuiIconButton-root": { borderRadius: 1 },
                      }}
                    >
                      <IconButton
                        aria-label={`Giảm số lượng ${item.name}`}
                        disabled={
                          change.isPending ||
                          item.quantity <= 1 ||
                          item.stock < 1 ||
                          item.status === "hidden"
                        }
                        onClick={() =>
                          change.mutate({
                            id: item.productId,
                            quantity: Math.min(item.quantity - 1, item.stock),
                          })
                        }
                      >
                        <RemoveRounded />
                      </IconButton>
                      <Typography
                        aria-label={`Số lượng ${item.name}`}
                        sx={{ minWidth: 24, textAlign: "center" }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        aria-label={`Tăng số lượng ${item.name}`}
                        disabled={
                          change.isPending ||
                          item.quantity >=
                            Math.min(item.stock, MAX_CART_QUANTITY) ||
                          item.status === "hidden"
                        }
                        onClick={() =>
                          change.mutate({
                            id: item.productId,
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        <AddRounded />
                      </IconButton>
                    </Stack>
                    <Typography fontWeight={600}>
                      {money(item.lineTotal)}
                    </Typography>
                    <Button
                      color="error"
                      disabled={change.isPending}
                      onClick={() => change.mutate({ id: item.productId })}
                      aria-label={`Xóa ${item.name} khỏi giỏ`}
                    >
                      Xóa
                    </Button>
                  </Stack>
                  {item.status === "insufficient-stock" && (
                    <Alert severity="warning">
                      Chỉ còn {item.stock} sản phẩm. Giảm số lượng trước khi
                      mua.
                    </Alert>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h2">Tạm tính</Typography>
              <Typography>{data.quantity} sản phẩm</Typography>
              <Typography variant="h2" component="p">
                {money(data.subtotal)}
              </Typography>
              <Typography color="text.secondary">
                Chưa gồm phí giao hàng và ưu đãi.
              </Typography>
              {data.hasIssues && (
                <Alert severity="warning">
                  Giỏ có sản phẩm không thể mua. Kiểm tra tình trạng và số
                  lượng.
                </Alert>
              )}
              {!data.ownerId && (
                <Button
                  component={Link}
                  to="/login?returnTo=%2Fcart"
                  variant="contained"
                >
                  Đăng nhập và gộp giỏ
                </Button>
              )}
              <Button component={Link} to="/products" variant="outlined">
                Tiếp tục mua sắm
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
    </Stack>
  );
}
