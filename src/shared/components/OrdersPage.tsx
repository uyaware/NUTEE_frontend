import { Stack, Typography } from "@mui/material";
import type { Portal } from "../types/database";
import { PrototypeOrderHistory } from "./PrototypeOrderHistory";
import { PrototypeOrderDetail } from "./PrototypeOrderDetail";

export function OrdersPage({
  portal,
  compact = false,
}: {
  portal: Portal;
  compact?: boolean;
}) {
  return <PrototypeOrderHistory portal={portal} compact={compact} />;
}

export function OrderDetailPage({ portal }: { portal: Portal }) {
  return <PrototypeOrderDetail portal={portal} />;
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
