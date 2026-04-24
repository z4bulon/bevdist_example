import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download } from "lucide-react";
import { formatCurrency, ORDER_STATUS_MAP } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { type OrderStatus } from "@prisma/client";

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireAdmin();

  const { status, page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page));
  const limit = 15;

  const validStatus = ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;
  const where = validStatus ? { status: validStatus } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, company: true, email: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildLink(params: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.page && params.page !== "1") sp.set("page", params.page);
    return `/admin/orders?${sp.toString()}`;
  }

  const exportHref = `/api/admin/orders/export${validStatus ? `?status=${validStatus}` : ""}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Все заказы</h1>
        <a
          href={exportHref}
          className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </a>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/admin/orders"
          className={`rounded px-2.5 py-1 text-xs transition-colors ${
            !status ? "bg-gray-800 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Все ({total})
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildLink({ status: s })}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              status === s ? "bg-gray-800 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {ORDER_STATUS_MAP[s].label}
          </Link>
        ))}
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 pl-4 pr-4 font-medium">Заказ</th>
                <th className="py-2.5 pr-4 font-medium">Клиент</th>
                <th className="py-2.5 pr-4 font-medium hidden sm:table-cell">Дата</th>
                <th className="py-2.5 pr-4 font-medium hidden md:table-cell">Товаров</th>
                <th className="py-2.5 pr-4 font-medium text-right">Сумма</th>
                <th className="py-2.5 pr-4 font-medium text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pl-4 pr-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-gray-900">{order.user.name}</p>
                    <p className="text-xs text-gray-400">{order.user.company}</p>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500 hidden sm:table-cell">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600 hidden md:table-cell">
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">
              Стр. {pageNum} из {totalPages} · {total} заказов
            </p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link
                  href={buildLink({ status: status ?? "", page: String(pageNum - 1) })}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
                >
                  ←
                </Link>
              )}
              {pageNum < totalPages && (
                <Link
                  href={buildLink({ status: status ?? "", page: String(pageNum + 1) })}
                  className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
                >
                  →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
