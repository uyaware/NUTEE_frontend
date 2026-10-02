import { useEffect, useState } from "react";
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Link as MuiLink,
  Pagination,
  Paper,
  Rating,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { services } from "../../../services";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../shared/components/Feedback";
import { money, dateTime } from "../../../shared/lib/format";
import type { ProductDetail } from "../../../shared/types/catalog";
import { ProductImage } from "../components/ProductImage";
import { ServiceError } from "../../../shared/lib/errors";

function ProductGallery({ product }: { product: ProductDetail }) {
  const [selectedId, setSelectedId] = useState(product.images[0]?.id);
  const selected =
    product.images.find((i) => i.id === selectedId) ?? product.images[0];
  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          height: { xs: 280, sm: 380 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ProductImage
          src={selected?.url ?? ""}
          alt={selected?.alt ?? `Minh họa ${product.name}`}
          eager
        />
      </Paper>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        aria-label="Chọn ảnh sản phẩm"
      >
        {product.images.map((image, index) => (
          <Button
            key={image.id}
            aria-label={`Xem ảnh ${index + 1}: ${image.alt}`}
            aria-pressed={selected?.id === image.id}
            variant={selected?.id === image.id ? "outlined" : "text"}
            onClick={() => setSelectedId(image.id)}
            sx={{ width: 88, height: 70, p: 1 }}
          >
            <ProductImage src={image.url} alt="" />
          </Button>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Ảnh minh họa cho dữ liệu mẫu.
      </Typography>
    </Stack>
  );
}

function Reviews({
  id,
  rating,
}: {
  id: string;
  rating: ProductDetail["rating"];
}) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["catalog", "reviews", id, page],
    queryFn: () => services.catalog.reviews(id, page),
  });
  return (
    <Stack spacing={3}>
      <Typography variant="h2">Đánh giá sản phẩm</Typography>
      {!!rating.count && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          useFlexGap
          flexWrap="wrap"
        >
          <Rating
            value={rating.average}
            precision={0.1}
            readOnly
            aria-label={`Trung bình ${rating.average.toFixed(1)} trên 5 sao`}
          />
          <Typography>
            {rating.average.toFixed(1)}/5 · {rating.count} đánh giá
          </Typography>
        </Stack>
      )}
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : !query.data.total ? (
        <EmptyState
          title="Chưa có đánh giá"
          description="Đánh giá từ khách đã mua sẽ xuất hiện tại đây."
        />
      ) : (
        <>
          {query.data.items.map((review) => (
            <Paper
              key={review.id}
              variant="outlined"
              sx={{ p: 3, overflowWrap: "anywhere" }}
            >
              <Stack spacing={1}>
                <Typography fontWeight={600}>{review.authorName}</Typography>
                <Rating
                  value={review.rating}
                  readOnly
                  aria-label={`${review.rating} trên 5 sao`}
                />
                <Typography variant="caption" color="text.secondary">
                  Đã mua hàng · {dateTime(review.createdAt)}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {review.comment}
                </Typography>
              </Stack>
            </Paper>
          ))}
          {query.data.total > query.data.pageSize && (
            <Pagination
              count={Math.ceil(query.data.total / query.data.pageSize)}
              page={query.data.page}
              onChange={(_, value) => setPage(value)}
              getItemAriaLabel={(type, value) =>
                type === "page"
                  ? `Trang đánh giá ${value}`
                  : type === "next"
                    ? "Đánh giá tiếp"
                    : "Đánh giá trước"
              }
            />
          )}
        </>
      )}
    </Stack>
  );
}

export default function ProductDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const query = useQuery({
    queryKey: ["catalog", "detail", id],
    queryFn: () => services.catalog.detail(id),
  });
  const state = location.state as { catalogReturnTo?: unknown } | null;
  const returnTo =
    typeof state?.catalogReturnTo === "string" &&
    /^\/products(?:\?|$)/.test(state.catalogReturnTo)
      ? state.catalogReturnTo
      : "/products";
  useEffect(() => {
    document.title = query.data
      ? `${query.data.name} · NUTEE`
      : "Chi tiết sản phẩm · NUTEE";
  }, [query.data, id]);
  if (query.isPending) return <LoadingState />;
  if (query.isError)
    return (
      <Stack spacing={3}>
        {query.error instanceof ServiceError &&
        query.error.code === "NOT_FOUND" ? (
          <EmptyState
            title="Không tìm thấy sản phẩm"
            description="Sản phẩm không tồn tại hoặc đã ngừng hiển thị. Khám phá các sản phẩm khác trong danh mục."
          />
        ) : (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        )}
        <Button component={Link} to={returnTo}>
          Quay lại danh sách
        </Button>
      </Stack>
    );
  const product = query.data;
  return (
    <Stack spacing={5}>
      <Breadcrumbs
        aria-label="Đường dẫn danh mục"
        sx={{ overflowWrap: "anywhere" }}
      >
        <MuiLink component={Link} to="/">
          Trang chủ
        </MuiLink>
        {product.breadcrumb.map((c) => (
          <MuiLink
            key={c.id}
            component={Link}
            to={`/products?category=${encodeURIComponent(c.id)}`}
          >
            {c.name}
          </MuiLink>
        ))}
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "repeat(2, minmax(0, 1fr))",
          },
          gap: { xs: 3, md: 5 },
        }}
      >
        <ProductGallery key={id} product={product} />
        <Stack spacing={3} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
          <Box>
            <MuiLink
              component={Link}
              to={`/products?brand=${encodeURIComponent(product.brandId)}`}
            >
              {product.brandName}
            </MuiLink>
            <Typography variant="h2" component="h1" sx={{ mt: 1 }}>
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Mã sản phẩm: {product.sku}
            </Typography>
          </Box>
          <Typography
            variant="h2"
            component="p"
            color="primary"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {money(product.price)}
          </Typography>
          <Chip
            label={product.stock ? "Còn hàng" : "Hết hàng"}
            color={product.stock ? "success" : "warning"}
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
          <Typography>
            {product.specifications[0]?.value ?? "Thông số đang được cập nhật."}
          </Typography>
          <Typography color="text.secondary">
            Sản phẩm và giá là dữ liệu mẫu. Bản demo hiện chưa hỗ trợ đặt hàng.
          </Typography>
          <Button
            component={Link}
            to={returnTo}
            variant="contained"
            sx={{ alignSelf: "flex-start" }}
          >
            Quay lại danh sách
          </Button>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography fontWeight={600}>Giao hàng & bảo hành</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Thông tin giao hàng và điều kiện bảo hành cần được xác nhận trước
              khi mua. Ảnh minh họa không đại diện cho màu sắc hoặc cấu hình
              thực tế.
            </Typography>
          </Paper>
        </Stack>
      </Box>
      <Box>
        <Typography variant="h2" sx={{ mb: 3 }}>
          Thông số kỹ thuật
        </Typography>
        {!product.specifications.length ? (
          <Typography color="text.secondary">
            Thông số đang được cập nhật.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table aria-label="Thông số kỹ thuật" sx={{ tableLayout: "fixed" }}>
              <TableBody>
                {product.specifications.map((spec, index) => (
                  <TableRow key={`${spec.key}-${index}`}>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{
                        width: "35%",
                        overflowWrap: "anywhere",
                        fontWeight: 600,
                      }}
                    >
                      {spec.label}
                    </TableCell>
                    <TableCell sx={{ overflowWrap: "anywhere" }}>
                      {spec.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      <Reviews key={id} id={id} rating={product.rating} />
    </Stack>
  );
}
