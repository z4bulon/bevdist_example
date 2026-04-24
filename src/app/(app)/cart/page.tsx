import { requireAuth } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/utils";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const session = await requireAuth();

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: { include: { category: { select: { name: true } } } },
    },
    orderBy: { product: { name: "asc" } },
  });

  return <CartClient initialItems={serializePrisma(cartItems)} />;
}
