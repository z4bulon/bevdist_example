import { requireAuth } from "@/lib/guards";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();

  let cartCount = 0;
  if (session.user.role === "CLIENT") {
    cartCount = await prisma.cartItem.count({ where: { userId: session.user.id } });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        userName={session.user.name}
        userRole={session.user.role}
        cartCount={cartCount}
      />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
