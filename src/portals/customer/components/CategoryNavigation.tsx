import { useId, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { services } from "../../../services";
import { ErrorState } from "../../../shared/components/Feedback";

export function CategoryNavigation() {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const location = useLocation();
  const selected =
    location.pathname === "/products"
      ? new URLSearchParams(location.search).get("category")
      : null;
  const categories = useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: services.catalog.categories,
  });
  return (
    <>
      <Button
        id={`${id}-trigger`}
        startIcon={<MenuRounded />}
        aria-haspopup="menu"
        aria-controls={anchor ? `${id}-menu` : undefined}
        aria-expanded={!!anchor}
        variant={anchor ? "contained" : "outlined"}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ px: { xs: 1.25, sm: 2 }, whiteSpace: "nowrap" }}
      >
        Danh mục
      </Button>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          list: { "aria-labelledby": `${id}-trigger` },
          paper: {
            sx: { mt: 1, minWidth: 260, maxWidth: "calc(100vw - 32px)" },
          },
        }}
      >
        <MenuItem
          component={Link}
          to="/products"
          selected={location.pathname === "/products" && !selected}
          onClick={() => setAnchor(null)}
          sx={{ minHeight: { xs: 48, sm: 48 } }}
        >
          Tất cả sản phẩm
        </MenuItem>
        <Divider />
        {categories.isPending && (
          <MenuItem disabled>Đang tải danh mục…</MenuItem>
        )}
        {categories.isError && (
          <Box sx={{ p: 2 }}>
            <ErrorState
              error={categories.error}
              retry={() => void categories.refetch()}
            />
          </Box>
        )}
        {categories.data?.map((category) => (
          <MenuItem
            key={category.id}
            component={Link}
            to={`/products?${new URLSearchParams({ category: category.id })}`}
            selected={selected === category.id}
            onClick={() => setAnchor(null)}
            sx={{
              minHeight: { xs: 48, sm: 48 },
              pl: category.parentId ? 4 : 2,
              whiteSpace: "normal",
            }}
          >
            <Typography
              component="span"
              variant="body2"
              fontWeight={category.parentId ? 400 : 600}
            >
              {category.name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
