import { Box, Button, Stack } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";

export function AccountLayout() {
  return (
    <Stack spacing={3}>
      <Box component="nav" aria-label="Tài khoản khách hàng">
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ "& .active": { bgcolor: "action.selected" } }}
        >
          <Button component={NavLink} to="/account/profile">
            Hồ sơ
          </Button>
          <Button component={NavLink} to="/account/addresses">
            Địa chỉ
          </Button>
          <Button component={NavLink} to="/account/security">
            Bảo mật
          </Button>
          <Button component={NavLink} to="/account/orders">
            Đơn hàng
          </Button>
        </Stack>
      </Box>
      <Outlet />
    </Stack>
  );
}
