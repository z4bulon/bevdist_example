import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/catalog");
  return session!;
}

export async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  return session!;
}
