import { requireAuth } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { CatalogClient } from "./catalog-client";

interface CatalogPageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

const LIMIT = 20;

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  await requireAuth();

  const { search = "", category = "" } = await searchParams;

  const where = {
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category: { slug: category } }),
  };

  const [products, totalProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: "asc" },
      take: LIMIT,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <CatalogClient
      key={`${search}-${category}`}
      initialProducts={serializePrisma(products)}
      totalProducts={totalProducts}
      categories={serializePrisma(categories)}
      initialSearch={search}
      initialCategory={category}
      limit={LIMIT}
    />
  );
}
