import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type OrderStatus } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  currency = "KZT",
  locale = "ru-KZ"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  PENDING:    { label: "Ожидает",     color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED:  { label: "Подтверждён", color: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "В обработке", color: "bg-purple-100 text-purple-800" },
  SHIPPED:    { label: "Отправлен",   color: "bg-indigo-100 text-indigo-800" },
  DELIVERED:  { label: "Доставлен",   color: "bg-green-100 text-green-800" },
  CANCELLED:  { label: "Отменён",     color: "bg-red-100 text-red-800" },
};

/**
 * Converts Prisma result to a plain JSON-serializable object.
 * Needed because Prisma returns Decimal/Date class instances that Next.js
 * cannot pass from Server Components to Client Components as props.
 */
export function serializePrisma<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
