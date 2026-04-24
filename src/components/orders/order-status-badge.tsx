import { type OrderStatus } from "@prisma/client";
import { ORDER_STATUS_MAP } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const info = ORDER_STATUS_MAP[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.color}`}>
      {info.label}
    </span>
  );
}
