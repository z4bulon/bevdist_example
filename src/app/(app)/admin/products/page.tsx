import { requireAdmin } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage() {
  await requireAdmin();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <ProductsClient initialProducts={serializePrisma(products)} categories={serializePrisma(categories)} />;
}
