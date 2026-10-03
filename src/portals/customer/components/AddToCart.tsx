import { useState } from "react";
import { Alert, Button, Stack, TextField } from "@mui/material";
import ShoppingCartOutlined from "@mui/icons-material/ShoppingCartOutlined";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { services } from "../../../services";
import { ErrorState } from "../../../shared/components/Feedback";
import { MAX_CART_QUANTITY } from "../../../shared/types/cart";

export function AddToCart({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [quantity, setQuantity] = useState("1");
  const client = useQueryClient();
  const add = useMutation({
    mutationFn: () => services.cart.add(productId, Number(quantity)),
    onSuccess: () => client.invalidateQueries({ queryKey: ["customer"] }),
  });
  const valid =
    Number.isInteger(Number(quantity)) &&
    Number(quantity) >= 1 &&
    Number(quantity) <= Math.min(stock, MAX_CART_QUANTITY);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <TextField
          label="Số lượng"
          type="number"
          value={quantity}
          disabled={!stock || add.isPending}
          onChange={(e) => {
            setQuantity(e.target.value);
            add.reset();
          }}
          error={!!stock && !valid}
          helperText={
            stock && !valid
              ? `Chọn từ 1 đến ${Math.min(stock, MAX_CART_QUANTITY)}.`
              : undefined
          }
          slotProps={{
            htmlInput: {
              min: 1,
              max: Math.min(stock, MAX_CART_QUANTITY),
              step: 1,
            },
          }}
          sx={{ width: 112 }}
        />
        <Button
          variant="contained"
          startIcon={<ShoppingCartOutlined />}
          disabled={!stock || !valid || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? "Đang thêm…" : "Thêm vào giỏ"}
        </Button>
      </Stack>
      {add.isError && <ErrorState error={add.error} />}
      {add.isSuccess && (
        <Alert
          severity="success"
          role="status"
          sx={{
            alignItems: "center",
            "& .MuiAlert-message": { width: "100%", py: 0 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="space-between"
          >
            <span>Đã thêm vào giỏ.</span>
            <Button component={Link} to="/cart">
              Xem giỏ hàng
            </Button>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}
