import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return apiSuccess(categories);
  } catch (err) {
    return handleApiError(err);
  }
}
