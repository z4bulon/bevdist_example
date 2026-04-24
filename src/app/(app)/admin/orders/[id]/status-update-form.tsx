"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ORDER_STATUS_MAP } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

interface StatusUpdateFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

const STATUS_ORDER: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function StatusUpdateForm({ orderId, currentStatus }: StatusUpdateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (selected === currentStatus) return;
    setLoading(true);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: selected }),
    });

    setLoading(false);

    if (res.ok) {
      toast("Статус обновлён", "success");
      router.refresh();
    } else {
      const json = await res.json();
      toast(json.error ?? "Ошибка", "error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => {
          const info = ORDER_STATUS_MAP[s];
          return (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                selected === s
                  ? `${info.color} ring-1 ring-inset ring-gray-400`
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {info.label}
            </button>
          );
        })}
      </div>
      <Button
        size="sm"
        disabled={loading || selected === currentStatus}
        onClick={handleUpdate}
      >
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>
    </div>
  );
}
