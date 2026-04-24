import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { startTimer } from "@/lib/logger";
import { createProductSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const done = startTimer("GET /api/products");
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const categorySlug = searchParams.get("category") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(categorySlug && { category: { slug: categorySlug } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    done(200);
    return apiSuccess({ products, total, page, limit });
  } catch (err) {
    done(500);
    return handleApiError(err, "GET /api/products");
  }
}

export async function POST(req: NextRequest) {
  const done = startTimer("POST /api/products");
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      done(403); return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const data = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        unit: data.unit,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
      },
      include: { category: true },
    });

    done(201);
    return apiSuccess(product, 201);
  } catch (err) {
    done(500);
    return handleApiError(err, "POST /api/products");
  }
}
