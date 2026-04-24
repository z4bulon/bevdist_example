import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { orderStatusSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorized", 401);

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, company: true, email: true, phone: true } },
        items: {
          include: { product: { select: { id: true, name: true, unit: true, imageUrl: true } } },
        },
      },
    });

    if (!order) return apiError("Order not found", 404);

    if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
      return apiError("Forbidden", 403);
    }

    return apiSuccess(order);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return apiError("Forbidden", 403);

    const { id } = await params;
    const body = await req.json();
    const { status } = orderStatusSchema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return apiSuccess(order);
  } catch (err) {
    return handleApiError(err);
  }
}
