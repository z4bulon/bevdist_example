"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";

type ProductWithCategory = Product & {
  category: { id: string; name: string; slug: string };
};

interface CatalogClientProps {
  initialProducts: ProductWithCategory[];
  totalProducts: number;
  categories: Category[];
  initialSearch: string;
  initialCategory: string;
  limit: number;
}

export function CatalogClient({
  initialProducts,
  totalProducts,
  categories,
  initialSearch,
  initialCategory,
  limit,
}: CatalogClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [search, setSearch] = useState(initialSearch);
  const [products, setProducts] = useState(initialProducts);
  const [nextPage, setNextPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = products.length < totalProducts;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const sp = new URLSearchParams();
    if (initialSearch) sp.set("search", initialSearch);
    if (initialCategory) sp.set("category", initialCategory);
    sp.set("page", String(nextPage));
    sp.set("limit", String(limit));

    try {
      const res = await fetch(`/api/products?${sp.toString()}`);
      const json = await res.json();
      setProducts((prev) => [...prev, ...json.data.products]);
      setNextPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, nextPage, initialSearch, initialCategory, limit]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  function navigate(params: { search: string; category: string }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set("search", params.search);
    if (params.category) sp.set("category", params.category);
    router.push(`/catalog?${sp.toString()}`);
  }

  function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    navigate({ search, category: initialCategory });
  }

  async function addToCart(productId: string) {
    const qty = quantities[productId] ?? 1;
    if (qty < 1) return;

    setAddingId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });

      if (res.ok) {
        toast("Добавлено в корзину", "success");
        router.refresh();
      } else {
        const json = await res.json();
        toast(json.error ?? "Ошибка", "error");
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Прайс-лист</h1>
          <p className="text-xs text-gray-400">{totalProducts} позиций</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Найти
          </button>
        </form>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => navigate({ search, category: "" })}
          className={cn(
            "rounded px-2.5 py-1 text-xs transition-colors",
            !initialCategory
              ? "bg-gray-800 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          )}
        >
          Все
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate({ search, category: cat.slug })}
            className={cn(
              "rounded px-2.5 py-1 text-xs transition-colors",
              initialCategory === cat.slug
                ? "bg-gray-800 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded py-12 text-center">
          <p className="text-sm text-gray-500">Товары не найдены</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="py-2.5 pl-4 pr-4 font-medium">Товар</th>
                    <th className="py-2.5 pr-4 font-medium hidden sm:table-cell">Категория</th>
                    <th className="py-2.5 pr-4 font-medium text-right">Цена</th>
                    <th className="py-2.5 pr-4 font-medium text-right hidden md:table-cell">Остаток</th>
                    <th className="py-2.5 pr-3 font-medium text-center w-20">Кол-во</th>
                    <th className="py-2.5 pr-4 font-medium w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={cn("hover:bg-gray-50", product.stock === 0 && "opacity-50")}
                    >
                      <td className="py-2.5 pl-4 pr-4">
                        <p className="font-medium text-gray-900 leading-snug">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {product.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-gray-500 hidden sm:table-cell">
                        {product.category.name}
                      </td>
                      <td className="py-2.5 pr-4 text-right whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(product.price.toString())}
                        </span>
                        <span className="block text-xs text-gray-400">/{product.unit}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right hidden md:table-cell">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            product.stock > 10
                              ? "text-green-700"
                              : product.stock > 0
                              ? "text-yellow-700"
                              : "text-red-600"
                          )}
                        >
                          {product.stock > 0 ? `${product.stock} шт.` : "Нет"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={product.stock}
                          value={quantities[product.id] ?? 1}
                          onChange={(e) =>
                            setQuantities((q) => ({
                              ...q,
                              [product.id]: Math.max(1, Number(e.target.value)),
                            }))
                          }
                          disabled={product.stock === 0}
                          className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm outline-none focus:border-gray-400 disabled:opacity-40"
                        />
                      </td>
                      <td className="py-2.5 pr-4">
                        <button
                          disabled={product.stock === 0 || addingId === product.id}
                          onClick={() => addToCart(product.id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                          {addingId === product.id ? "..." : "В корзину"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={sentinelRef} className="mt-6 flex justify-center py-4">
            {loadingMore && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
            {!loadingMore && hasMore && (
              <button
                onClick={loadMore}
                className="text-sm text-gray-500 hover:text-gray-900 underline"
              >
                Загрузить ещё
              </button>
            )}
            {!hasMore && products.length > limit && (
              <p className="text-xs text-gray-400">Все {totalProducts} позиций загружены</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
