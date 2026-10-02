import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import LaptopMacRounded from "@mui/icons-material/LaptopMacRounded";
import SmartphoneRounded from "@mui/icons-material/SmartphoneRounded";
import KeyboardRounded from "@mui/icons-material/KeyboardRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { services } from "../../../services";
import { money } from "../../../shared/lib/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../../shared/components/Feedback";
import { tokens } from "../../../shared/theme/tokens";

export default function HomePage() {
  const products = useQuery({
    queryKey: ["catalog", "featured"],
    queryFn: services.catalog.featured,
  });
  return (
    <Stack spacing={5}>
      <Paper
        sx={{
          bgcolor: tokens.color.blueTint,
          borderRadius: 4,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.15fr 1fr" },
        }}
      >
        <Box sx={{ p: { xs: 3, sm: 5, lg: 7 } }}>
          <Chip
            label="CHÀO MỪNG ĐẾN NUTEE"
            variant="outlined"
            color="primary"
            size="small"
            sx={{ fontWeight: 600, mb: 3 }}
          />
          <Typography variant="h1">
            Công nghệ cho
            <br />
            <Box component="span" sx={{ color: "primary.main" }}>
              nhịp sống của bạn.
            </Box>
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 3, mb: 4, maxWidth: 440 }}
          >
            Từ góc làm việc đến những kết nối mỗi ngày. Khám phá không gian điện
            tử được xây dựng cho bạn.
          </Typography>
          <Button
            variant="contained"
            component={Link}
            to="/demo"
            endIcon={<ArrowForwardRounded />}
          >
            Khám phá bản demo
          </Button>
          <Typography
            variant="caption"
            display="block"
            sx={{ mt: 2 }}
            color="text.secondary"
          >
            Nền tảng M0–M1 · Sản phẩm và giá là dữ liệu mẫu
          </Typography>
        </Box>
        <Box
          sx={{
            minHeight: { xs: 240, md: 420 },
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            overflow: "hidden",
          }}
        >
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              width: 370,
              height: 370,
              border: "1px solid",
              borderColor: "primary.contrastText",
              borderRadius: "50%",
              opacity: 0.18,
            }}
          />
          <Box
            component="img"
            src="/images/laptop.svg"
            alt="Minh họa laptop NUTEE"
            sx={{
              width: "90%",
              maxWidth: 430,
              height: 290,
              zIndex: 1,
              objectFit: "contain",
            }}
          />
          <Chip
            label="WORK. CREATE. CONNECT."
            sx={{
              position: "absolute",
              bottom: 24,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              fontSize: 11,
              letterSpacing: ".12em",
            }}
          />
        </Box>
      </Paper>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        {[
          {
            icon: LaptopMacRounded,
            title: "Laptop",
            desc: "Làm việc & sáng tạo",
          },
          {
            icon: SmartphoneRounded,
            title: "Điện thoại",
            desc: "Kết nối mỗi ngày",
          },
          {
            icon: KeyboardRounded,
            title: "Bàn phím",
            desc: "Hoàn thiện góc làm việc",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Paper
            key={title}
            variant="outlined"
            sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: tokens.color.blueTint,
                borderRadius: 2,
                color: "primary.main",
                display: "flex",
              }}
            >
              <Icon />
            </Box>
            <Box>
              <Typography fontWeight={600}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {desc}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
      <Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="overline" color="primary">
              THE NUTEE EDIT
            </Typography>
            <Typography variant="h2">Một góc công nghệ</Typography>
          </Box>
          <Chip label="Preview dữ liệu seed" variant="outlined" size="small" />
        </Stack>
        {products.isPending ? (
          <LoadingState />
        ) : products.isError ? (
          <ErrorState
            error={products.error}
            retry={() => void products.refetch()}
          />
        ) : !products.data.length ? (
          <EmptyState
            title="Chưa có sản phẩm"
            description="Sản phẩm công khai sẽ xuất hiện tại đây."
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            {products.data.map((p) => (
              <Card key={p.id}>
                <Box
                  sx={{
                    bgcolor: "background.default",
                    p: 3,
                    height: 190,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={p.imageUrl}
                    alt={`Minh họa ${p.name}`}
                    loading="lazy"
                    sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {p.brandName} · {p.sku}
                  </Typography>
                  <Typography
                    component="h3"
                    variant="h4"
                    sx={{ mt: 1, minHeight: 50 }}
                  >
                    {p.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {p.specifications[0]?.value}
                  </Typography>
                  <Typography
                    sx={{
                      mt: 2,
                      fontWeight: 700,
                      color: "primary.main",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {money(p.price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.stock ? `Còn ${p.stock} sản phẩm mẫu` : "Hết hàng"}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
        }}
      >
        <CheckCircleOutlineRounded color="primary" />
        <Box>
          <Typography variant="h3" component="h2">
            Hai portal. Một nguồn dữ liệu.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Đăng nhập khách hàng hoặc mở cổng vận hành để kiểm chứng phiên
            riêng, phân quyền và persistence trong cùng trình duyệt.
          </Typography>
        </Box>
      </Paper>
    </Stack>
  );
}
