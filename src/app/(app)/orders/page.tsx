import { requireAuth } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";


export default async function OrdersPage() {
  const session = await requireAuth();

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, unit: true } } },
        take: 3,
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-gray-900">Мои заказы</h1>

      {orders.length === 0 ? (
        <div className="py-12 border border-dashed border-gray-300 rounded-md text-center">
          <p className="text-sm text-gray-500">
            Заказов пока нет —{" "}
            <Link href="/catalog" className="text-blue-600 hover:underline">
              перейти в каталог
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-md border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Заказ #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(order.total.toString())}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-500">
                {order.items.map((item) => item.product.name).join(", ")}
                {order._count.items > 3 && ` и ещё ${order._count.items - 3} тов.`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
