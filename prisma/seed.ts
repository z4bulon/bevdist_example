/**
 * Prisma Seed Script
 * Run: npm run db:seed
 *
 * Creates:
 *   - 1 admin user  (admin@bevdist.kz / admin123)
 *   - 1 client user (client@store.kz / client123)
 *   - 5 categories
 *   - 20 sample products
 */

import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 12);
  const clientPassword = await bcrypt.hash("client123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bevdist.kz" },
    update: {},
    create: {
      email: "admin@bevdist.kz",
      password: adminPassword,
      name: "Диас Администратор",
      company: "BevDist Kazakhstan",
      phone: "+7 700 000 0001",
      role: "ADMIN",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@store.kz" },
    update: {},
    create: {
      email: "client@store.kz",
      password: clientPassword,
      name: "Асет Магазинов",
      company: 'ТОО "Алматы Маркет"',
      phone: "+7 701 234 5678",
      role: "CLIENT",
    },
  });

  console.log(`✅  Users: ${admin.email}, ${client.email}`);

  // ── Categories ─────────────────────────────────────────────────────────────

  const categoryData = [
    { name: "Газированные напитки",  slug: "sodas" },
    { name: "Соки и нектары",        slug: "juices" },
    { name: "Воды",                  slug: "waters" },
    { name: "Энергетики",            slug: "energy" },
    { name: "Молочные напитки",      slug: "dairy" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = c.id;
  }

  console.log("✅  Categories created");

  // ── Products ───────────────────────────────────────────────────────────────

  const products: Prisma.ProductCreateInput[] = [
    // Sodas
    { name: "Coca-Cola 1L (ящик 12 шт.)", description: "Классическая газировка 1 литр", price: 4800, stock: 200, unit: "ящик", category: { connect: { id: categories["sodas"] } } },
    { name: "Pepsi 1L (ящик 12 шт.)", description: "Пепси-Cola 1 литр", price: 4500, stock: 150, unit: "ящик", category: { connect: { id: categories["sodas"] } } },
    { name: "Sprite 0.5L (ящик 24 шт.)", description: "Лайм-лимон газировка", price: 3600, stock: 300, unit: "ящик", category: { connect: { id: categories["sodas"] } } },
    { name: "Fanta Orange 0.5L (ящик 24 шт.)", price: 3600, stock: 250, unit: "ящик", category: { connect: { id: categories["sodas"] } } },
    { name: "7UP 2L (ящик 6 шт.)", price: 2400, stock: 120, unit: "ящик", category: { connect: { id: categories["sodas"] } } },
    // Juices
    { name: "Сок Rich Апельсин 1L (упак. 12 шт.)", price: 5400, stock: 100, unit: "упаковка", category: { connect: { id: categories["juices"] } } },
    { name: "Нектар Добрый Персик 1L (упак. 12 шт.)", price: 4800, stock: 80, unit: "упаковка", category: { connect: { id: categories["juices"] } } },
    { name: "Сок J7 Яблоко 0.2L (упак. 27 шт.)", description: "Маленькие коробочки для розницы", price: 2700, stock: 400, unit: "упаковка", category: { connect: { id: categories["juices"] } } },
    { name: "Нектар Аmazon Манго 1L (упак. 12 шт.)", price: 5200, stock: 60, unit: "упаковка", category: { connect: { id: categories["juices"] } } },
    // Waters
    { name: "Вода Bonaqua 0.5L (упак. 24 шт.)", description: "Негазированная вода", price: 1800, stock: 500, unit: "упаковка", category: { connect: { id: categories["waters"] } } },
    { name: "Вода Evian 0.75L (упак. 12 шт.)", description: "Французская природная вода", price: 3600, stock: 80, unit: "упаковка", category: { connect: { id: categories["waters"] } } },
    { name: "Вода Shymkent 5L (упак. 4 шт.)", price: 2000, stock: 200, unit: "упаковка", category: { connect: { id: categories["waters"] } } },
    { name: "Газированная вода BonAqua 0.5L (упак. 24 шт.)", price: 2000, stock: 300, unit: "упаковка", category: { connect: { id: categories["waters"] } } },
    // Energy
    { name: "Red Bull 0.25L (ящик 24 шт.)", description: "Классический энергетик", price: 8400, stock: 60, unit: "ящик", category: { connect: { id: categories["energy"] } } },
    { name: "Monster Energy 0.5L (ящик 24 шт.)", price: 9600, stock: 40, unit: "ящик", category: { connect: { id: categories["energy"] } } },
    { name: "Burn 0.5L (ящик 24 шт.)", price: 7200, stock: 50, unit: "ящик", category: { connect: { id: categories["energy"] } } },
    // Dairy
    { name: "Чай Lipton Молочный 0.3L (упак. 12 шт.)", price: 3600, stock: 120, unit: "упаковка", category: { connect: { id: categories["dairy"] } } },
    { name: "Якобс Кофе с молоком 0.25L (упак. 12 шт.)", price: 4200, stock: 90, unit: "упаковка", category: { connect: { id: categories["dairy"] } } },
    { name: "Milky Way Shake 0.2L (упак. 24 шт.)", price: 5400, stock: 70, unit: "упаковка", category: { connect: { id: categories["dairy"] } } },
    { name: "Nesquik 0.2L (упак. 24 шт.)", description: "Шоколадный молочный напиток", price: 4800, stock: 100, unit: "упаковка", category: { connect: { id: categories["dairy"] } } },
  ];

  // Remove the manually set undefined field
  for (const p of products) {
    if ("categoryId" in p) delete (p as Record<string, unknown>)["categoryId"];
    await prisma.product.upsert({
      where: { id: "seed_" + p.name.slice(0, 20).replace(/\s/g, "_") },
      update: {},
      create: {
        id: "seed_" + p.name.slice(0, 20).replace(/\s/g, "_"),
        ...p,
      } as Prisma.ProductCreateInput,
    });
  }

  console.log(`✅  ${products.length} products seeded`);
  console.log("");
  console.log("─────────────────────────────────────");
  console.log("  Admin:  admin@bevdist.kz / admin123");
  console.log("  Client: client@store.kz  / client123");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
