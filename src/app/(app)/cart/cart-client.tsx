"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { CartItem, Product } from "@prisma/client";

type CartItemFull = CartItem & {
  product: Product & { category: { name: string } };
};

interface CartClientProps {
  initialItems: CartItemFull[];
}

export function CartClient({ initialItems }: CartClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  async function updateQuantity(productId: string, quantity: number) {
    setUpdatingId(productId);
    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    if (quantity === 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
    setUpdatingId(null);
    router.refresh(); // refresh navbar cart count
  }

  async function placeOrder() {
    if (items.length === 0) return;
    setSubmitting(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (res.ok) {
      toast("Заказ успешно создан!", "success");
      router.push(`/orders/${json.data.id}`);
      router.refresh();
    } else {
      toast(json.error ?? "Ошибка создания заказа", "error");
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-12 border border-dashed border-gray-300 rounded-md text-center">
        <p className="text-sm text-gray-500">
          Корзина пуста —{" "}
          <Link href="/catalog" className="text-blue-600 hover:underline">
            перейти в каталог
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-gray-900">Корзина</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-md border border-gray-200 bg-white p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium">{item.product.category.name}</p>
                <p className="font-semibold text-gray-900 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(item.product.price.toString())} / {item.product.unit}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={item.product.stock + item.quantity}
                  value={item.quantity}
                  disabled={updatingId === item.productId}
                  onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                  className="w-16 text-center px-1"
                />
                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency((Number(item.product.price) * item.quantity).toString())}
                  </p>
                </div>
                <button
                  onClick={() => updateQuantity(item.productId, 0)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-16 rounded-md border border-gray-200 bg-white p-5 space-y-4">
            <h2 className="font-semibold text-lg text-gray-900">Итог заказа</h2>

            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-gray-600">
                  <span className="truncate max-w-[60%]">{item.product.name} ×{item.quantity}</span>
                  <span>{formatCurrency((Number(item.product.price) * item.quantity).toString())}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>Итого</span>
              <span>{formatCurrency(total.toString())}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Примечание к заказу</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Особые пожелания..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <Button className="w-full" disabled={submitting} onClick={placeOrder}>
              {submitting ? "Оформление..." : "Оформить заказ"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
