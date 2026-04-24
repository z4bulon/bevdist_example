import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";
import { type OrderStatus } from "@prisma/client";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
];

function escapeCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return apiError("Forbidden", 403);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const validStatus = ALL_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : undefined;

  const orders = await prisma.order.findMany({
    where: validStatus ? { status: validStatus } : {},
    include: {
      user: { select: { name: true, company: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["ID", "Дата", "Клиент", "Компания", "Email", "Товаров", "Сумма (₸)", "Статус"];

  const rows = orders.map((o) => [
    o.id.slice(-8).toUpperCase(),
    new Date(o.createdAt).toLocaleDateString("ru-RU"),
    o.user.name,
    o.user.company,
    o.user.email,
    o._count.items,
    Number(o.total).toFixed(2),
    o.status,
  ]);

  const csv =
    "﻿" + // BOM for correct UTF-8 rendering in Excel
    [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");

  const filename = `orders-${validStatus ?? "all"}-${Date.now()}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
