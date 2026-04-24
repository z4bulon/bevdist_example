"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, PowerOff, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category } from "@prisma/client";

type ProductWithCategory = Product & { category: { id: string; name: string } };

interface ProductsClientProps {
  initialProducts: ProductWithCategory[];
  categories: Category[];
}

interface FormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  unit: string;
  categoryId: string;
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: "", description: "", price: "", stock: "", unit: "box", categoryId: "", imageUrl: "",
};

export function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(product: ProductWithCategory) {
    setEditId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? "",
    });
    setShowForm(true);
  }

  async function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      unit: form.unit,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl || undefined,
    };

    const url = editId ? `/api/products/${editId}` : "/api/products";
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSaving(false);

    if (res.ok) {
      toast(editId ? "Товар обновлён" : "Товар создан", "success");
      setShowForm(false);
      router.refresh();
      if (editId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editId
              ? { ...p, ...json.data, category: categories.find((c) => c.id === payload.categoryId) ?? p.category }
              : p
          )
        );
      } else {
        setProducts((prev) => [...prev, json.data]);
      }
    } else {
      toast(json.error ?? "Ошибка", "error");
    }
  }

  async function toggleActive(product: ProductWithCategory) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !product.isActive }),
    });

    if (res.ok) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
      );
      toast(product.isActive ? "Товар деактивирован" : "Товар активирован", "success");
    }
  }

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Управление товарами</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Добавить товар
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-900">
            {editId ? "Редактирование товара" : "Новый товар"}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Название</label>
              <Input required placeholder="Coca-Cola 1L (ящик 12 шт.)" {...field("name")} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">Описание</label>
              <textarea
                rows={2}
                placeholder="Краткое описание..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                {...field("description")}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Цена (₸)</label>
              <Input required type="number" min="0" step="0.01" placeholder="1500" {...field("price")} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Остаток</label>
              <Input required type="number" min="0" placeholder="100" {...field("stock")} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Единица</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                {...field("unit")}
              >
                <option value="box">Ящик</option>
                <option value="pallet">Паллет</option>
                <option value="bottle">Бутылка</option>
                <option value="can">Банка</option>
                <option value="pack">Упаковка</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Категория</label>
              <select
                required
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                {...field("categoryId")}
              >
                <option value="">Выберите категорию</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">URL изображения (необязательно)</label>
              <Input type="url" placeholder="https://..." {...field("imageUrl")} />
            </div>

            <div className="sm:col-span-2 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Сохранение..." : editId ? "Обновить" : "Создать"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wider">
                <th className="py-3 pl-6 pr-4 font-medium">Товар</th>
                <th className="py-3 pr-4 font-medium">Категория</th>
                <th className="py-3 pr-4 font-medium text-right">Цена</th>
                <th className="py-3 pr-4 font-medium text-right">Остаток</th>
                <th className="py-3 pr-4 font-medium text-center">Статус</th>
                <th className="py-3 pr-6 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className={`hover:bg-gray-50 ${!product.isActive ? "opacity-50" : ""}`}>
                  <td className="py-3 pl-6 pr-4">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{product.category.name}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                    {formatCurrency(product.price.toString())}
                    <span className="text-xs font-normal text-gray-400"> /{product.unit}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={
                      product.stock > 10 ? "text-green-600 font-medium" :
                      product.stock > 0 ? "text-yellow-600 font-medium" :
                      "text-red-500 font-medium"
                    }>
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    <span className={`text-xs font-medium ${
                      product.isActive ? "text-green-700" : "text-gray-400"
                    }`}>
                      {product.isActive ? "Активен" : "Скрыт"}
                    </span>
                  </td>
                  <td className="py-3 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        title={product.isActive ? "Деактивировать" : "Активировать"}
                      >
                        {product.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
