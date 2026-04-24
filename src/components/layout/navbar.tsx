"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  userName: string;
  userRole: string;
  cartCount?: number;
}

export function Navbar({ userName, userRole, cartCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = userRole === "ADMIN";

  const clientLinks = [
    { href: "/catalog", label: "Каталог" },
    { href: "/cart", label: cartCount > 0 ? `Корзина (${cartCount})` : "Корзина" },
    { href: "/orders", label: "Мои заказы" },
  ];

  const adminLinks = [
    { href: "/admin", label: "Дашборд" },
    { href: "/admin/orders", label: "Заказы" },
    { href: "/admin/products", label: "Товары" },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href={isAdmin ? "/admin" : "/catalog"}
            className="text-sm font-bold text-gray-900"
          >
            BevDist
            {isAdmin && (
              <span className="ml-1.5 text-xs font-normal text-gray-400">/ Администратор</span>
            )}
          </Link>

          <nav className="hidden md:flex items-center">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  pathname === href || (href.length > 1 && pathname.startsWith(href + "/"))
                    ? "font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm">
          <span className="truncate max-w-[160px] text-gray-500">{userName}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            Выйти
          </button>
        </div>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pb-3 pt-2">
          <nav className="flex flex-col">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "border-b border-gray-100 py-2.5 text-sm",
                  pathname === href ? "font-medium text-gray-900" : "text-gray-600"
                )}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="py-2.5 text-left text-sm text-red-600"
            >
              Выйти
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
