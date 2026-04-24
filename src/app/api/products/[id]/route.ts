import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { updateProductSchema } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
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
    const data = updateProductSchema.parse(body);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return apiSuccess(product);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") return apiError("Forbidden", 403);

    const { id } = await params;
    // Soft-delete: keeps product reference intact for existing order items
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    return apiSuccess({ message: "Product deactivated" });
  } catch (err) {
    return handleApiError(err);
  }
}
