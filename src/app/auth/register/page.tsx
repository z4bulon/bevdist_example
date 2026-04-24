"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
  });

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast(json.error ?? "Ошибка регистрации", "error");
    } else {
      toast("Аккаунт создан! Войдите в систему.", "success");
      router.push("/auth/login");
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">BevDist</h1>
          <p className="text-sm text-gray-500 mt-1">Регистрация аккаунта</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 bg-white p-6 rounded-md">
          {[
            { id: "name", label: "Имя", type: "text", placeholder: "Иван Иванов", required: true },
            { id: "company", label: "Название магазина", type: "text", placeholder: "ТОО Супермаркет", required: true },
            { id: "email", label: "Email", type: "email", placeholder: "ivan@store.kz", required: true },
            { id: "phone", label: "Телефон", type: "tel", placeholder: "+7 777 000 0000", required: false },
            { id: "password", label: "Пароль (мин. 6 символов)", type: "password", placeholder: "••••••••", required: true },
          ].map(({ id, label, type, placeholder, required }) => (
            <div key={id} className="space-y-1.5">
              <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
              <Input
                id={id}
                type={type}
                placeholder={placeholder}
                required={required}
                {...field(id as keyof typeof form)}
              />
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Создание..." : "Создать аккаунт"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Уже есть аккаунт?{" "}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
