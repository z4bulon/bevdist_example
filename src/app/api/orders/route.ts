import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { startTimer } from "@/lib/logger";
import { Decimal } from "@prisma/client/runtime/library";
import { type OrderStatus } from "@prisma/client";
import { createOrderSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const done = startTimer("GET /api/orders");
  try {
    const session = await auth();
    if (!session) { done(401); return apiError("Unauthorized", 401); }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
    const status = searchParams.get("status") ?? undefined;

    const where = {
      ...(session.user.role !== "ADMIN" && { userId: session.user.id }),
      ...(status && { status: status as OrderStatus }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, company: true, email: true } },
          items: {
            include: { product: { select: { id: true, name: true, unit: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    done(200);
    return apiSuccess({ orders, total, page, limit });
  } catch (err) {
    done(500);
    return handleApiError(err, "GET /api/orders");
  }
}

export async function POST(req: NextRequest) {
  const done = startTimer("POST /api/orders");
  try {
    const session = await auth();
    if (!session) { done(401); return apiError("Unauthorized", 401); }

    const body = await req.json();
    const { notes } = createOrderSchema.parse(body);

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) return apiError("Cart is empty", 400);

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return apiError(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`,
          409
        );
      }
    }

    const total = cartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          total: new Decimal(total),
          notes,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price, // price at checkout time
            })),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      });

      await Promise.all(
        cartItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      await tx.cartItem.deleteMany({ where: { userId: session.user.id } });

      return newOrder;
    });

    done(201);
    return apiSuccess(order, 201);
  } catch (err) {
    done(500);
    return handleApiError(err, "POST /api/orders");
  }
}
