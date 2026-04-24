import { requireAuth } from "@/lib/guards";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ReorderButton } from "./reorder-button";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await requireAuth();

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, company: true, email: true, phone: true } },
      items: {
        include: { product: { select: { id: true, name: true, unit: true, imageUrl: true } } },
      },
    },
  });

  if (!order) notFound();

  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    redirect("/orders");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Все заказы
      </Link>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Заказ #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        <div className="p-6">
          <h2 className="mb-3 font-semibold text-gray-900">Состав заказа</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-2 pr-4 font-medium">Товар</th>
                  <th className="pb-2 pr-4 font-medium text-right">Кол-во</th>
                  <th className="pb-2 pr-4 font-medium text-right">Цена</th>
                  <th className="pb-2 font-medium text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {item.product.name}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-600">
                      {item.quantity} {item.product.unit}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-600">
                      {formatCurrency(item.unitPrice.toString())}
                    </td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {formatCurrency((Number(item.unitPrice) * item.quantity).toString())}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="pt-3 pr-4 text-right font-bold text-gray-900">
                    Итого
                  </td>
                  <td className="pt-3 text-right font-bold text-gray-900 text-base">
                    {formatCurrency(order.total.toString())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {order.notes && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <p className="text-sm text-gray-500 font-medium">Примечание:</p>
            <p className="text-sm text-gray-700 mt-1">{order.notes}</p>
          </div>
        )}

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <ReorderButton
            items={order.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
