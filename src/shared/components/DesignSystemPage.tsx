import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { tokens } from "../theme/tokens";
import { BoxTitle } from "./OrdersPage";
import { StatusBadge } from "./StatusBadge";
export default function DesignSystemPage() {
  return (
    <Stack spacing={4}>
      <BoxTitle
        title="NUTEE Design System"
        description="Một ngôn ngữ giao diện, hai nhịp sử dụng. Màu lấy cảm hứng trực tiếp từ logo NUTEE."
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        {[
          { label: "Electric blue", value: tokens.color.electric },
          { label: "NUTEE blue / Primary", value: tokens.color.blue },
          { label: "Deep blue", value: tokens.color.deepBlue },
          { label: "Charcoal / Secondary", value: tokens.color.charcoal },
        ].map((c) => (
          <Paper variant="outlined" key={c.label} sx={{ overflow: "hidden" }}>
            <Box sx={{ height: 100, bgcolor: c.value }} />
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2">{c.label}</Typography>
              <Typography variant="caption" color="text.secondary">
                {c.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2" component="h2">
          Rõ ràng. Nhất quán. Dễ sử dụng.
        </Typography>
        <Typography sx={{ my: 2 }}>
          Be Vietnam Pro · Nội dung 16px · Khoảng cách theo bội số 8px · Góc bo
          8/12/24px.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Typography, màu semantic, focus bàn phím và reduced motion dùng chung.
          Portal vận hành dùng bảng gọn hơn.
        </Typography>
      </Paper>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Typography variant="h3" component="h2">
            Thành phần dùng chung
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <Button variant="contained">Hành động chính</Button>
            <Button variant="outlined">Hành động phụ</Button>
            <Button disabled variant="contained">
              Vô hiệu hóa
            </Button>
          </Stack>
          <TextField
            label="Trường biểu mẫu"
            helperText="Label luôn hiển thị; lỗi được đặt ngay dưới trường."
            sx={{ maxWidth: 480 }}
          />
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <StatusBadge status="pending" />
            <StatusBadge status="delivered" />
            <StatusBadge status="cancelled" />
            <Chip label="Seed data" variant="outlined" />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
