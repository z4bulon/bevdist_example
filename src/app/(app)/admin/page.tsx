import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export default async function AdminDashboard() {
  await requireAdmin();

  const [
    totalOrders,
    pendingOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    revenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, company: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const stats = [
    { label: "Всего заказов", value: totalOrders },
    { label: "Ожидают обработки", value: pendingOrders },
    { label: "Активных товаров", value: totalProducts },
    { label: "Клиентов", value: totalUsers },
  ];

  return (
    <div>
      <h1 className="mb-5 text-lg font-semibold text-gray-900">Панель управления</h1>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-md border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-md border border-gray-200 bg-white p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
          Выручка (без отменённых)
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(revenue._sum.total?.toString() ?? "0")}
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Последние заказы</h2>
          <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">
            Все заказы →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 pl-4 pr-4 font-medium">Заказ</th>
                <th className="py-2.5 pr-4 font-medium">Клиент</th>
                <th className="py-2.5 pr-4 font-medium hidden sm:table-cell">Товаров</th>
                <th className="py-2.5 pr-4 font-medium text-right">Сумма</th>
                <th className="py-2.5 pr-4 font-medium text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pl-4 pr-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-gray-900">{order.user.name}</p>
                    <p className="text-xs text-gray-400">{order.user.company}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 hidden sm:table-cell">
                    {order._count.items}
                  </td>
                  <td className="py-2.5 pr-4 text-right font-semibold text-gray-900">
                    {formatCurrency(order.total.toString())}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
