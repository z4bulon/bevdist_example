import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { cartItemSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { category: { select: { name: true } } },
        },
      },
      orderBy: { product: { name: "asc" } },
    });

    return apiSuccess(items);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { productId, quantity } = cartItemSchema.parse(body);

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: session.user.id, productId },
      });
      return apiSuccess({ removed: true });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) return apiError("Product not found", 404);

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: session.user.id, productId } },
      update: { quantity },
      create: { userId: session.user.id, productId, quantity },
      include: { product: true },
    });

    return apiSuccess(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });

    return apiSuccess({ cleared: true });
  } catch (err) {
    return handleApiError(err);
  }
}
