"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface ReorderButtonProps {
  items: { productId: string; quantity: number }[];
}

export function ReorderButton({ items }: ReorderButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleReorder() {
    setLoading(true);

    const results = await Promise.allSettled(
      items.map((item) =>
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
      )
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    setLoading(false);

    if (failed === 0) {
      toast("Товары добавлены в корзину", "success");
    } else {
      toast(`${failed} из ${items.length} товаров недоступны`, "error");
    }

    router.push("/cart");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleReorder} disabled={loading}>
      <RotateCcw className="mr-2 h-4 w-4" />
      {loading ? "Добавление..." : "Повторить заказ"}
    </Button>
  );
}
