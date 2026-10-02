import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type {
  CatalogFacets,
  CatalogFilters as Filters,
} from "../../../shared/types/catalog";

export function CatalogFilters({
  filters,
  facets,
  onChange,
}: {
  filters: Filters;
  facets: CatalogFacets;
  onChange: (changes: Partial<Filters>) => void;
}) {
  const toggle = (values: string[], value: string) =>
    values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
  return (
    <Stack spacing={3}>
      <Typography variant="h3" component="h2">
        Bộ lọc sản phẩm
      </Typography>
      <TextField
        select
        label="Danh mục"
        value={filters.category}
        onChange={(e) =>
          onChange({ category: e.target.value, brands: [], specifications: {} })
        }
      >
        <MenuItem value="">Tất cả danh mục</MenuItem>
        {facets.categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.parentId ? "— " : ""}
            {c.name}
          </MenuItem>
        ))}
        {filters.category &&
          !facets.categories.some((c) => c.id === filters.category) && (
            <MenuItem value={filters.category}>
              Danh mục không còn tồn tại
            </MenuItem>
          )}
      </TextField>
      <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" fontWeight={600}>
          Thương hiệu
        </Typography>
        {facets.brands.map((b) => (
          <FormControlLabel
            key={b.id}
            sx={{ display: "flex", minHeight: 44 }}
            control={
              <Checkbox
                checked={filters.brands.includes(b.id)}
                onChange={() =>
                  onChange({ brands: toggle(filters.brands, b.id) })
                }
              />
            }
            label={b.name}
          />
        ))}
        {!facets.brands.length && (
          <Typography variant="body2" color="text.secondary">
            Không có thương hiệu trong danh mục này.
          </Typography>
        )}
      </Box>
      <Box
        component="form"
        key={`${filters.minPrice}-${filters.maxPrice}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const number = (key: string) =>
            data.get(key) ? Number(data.get(key)) : undefined;
          onChange({
            minPrice: number("minPrice"),
            maxPrice: number("maxPrice"),
          });
        }}
      >
        <Typography fontWeight={600} sx={{ mb: 2 }}>
          Khoảng giá (VND)
        </Typography>
        <Stack spacing={2}>
          <TextField
            type="number"
            name="minPrice"
            label="Giá từ"
            defaultValue={filters.minPrice ?? ""}
            slotProps={{
              htmlInput: { min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
            }}
          />
          <TextField
            type="number"
            name="maxPrice"
            label="Giá đến"
            defaultValue={filters.maxPrice ?? ""}
            slotProps={{
              htmlInput: { min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
            }}
          />
          <Button type="submit" variant="outlined">
            Áp dụng khoảng giá
          </Button>
        </Stack>
      </Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={filters.inStock}
            onChange={(e) => onChange({ inStock: e.target.checked })}
          />
        }
        label="Chỉ sản phẩm còn hàng"
      />
      {!!facets.specifications.length && <Divider />}
      {facets.specifications.map((s) => (
        <Box
          component="fieldset"
          key={s.key}
          sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
        >
          <Typography component="legend" fontWeight={600}>
            {s.label}
          </Typography>
          {s.values.map((value) => (
            <FormControlLabel
              key={value}
              sx={{
                display: "flex",
                minHeight: 44,
                "& .MuiFormControlLabel-label": { overflowWrap: "anywhere" },
              }}
              control={
                <Checkbox
                  checked={
                    filters.specifications[s.key]?.includes(value) ?? false
                  }
                  onChange={() =>
                    onChange({
                      specifications: {
                        ...filters.specifications,
                        [s.key]: toggle(
                          filters.specifications[s.key] ?? [],
                          value,
                        ),
                      },
                    })
                  }
                />
              }
              label={value}
            />
          ))}
        </Box>
      ))}
    </Stack>
  );
}
