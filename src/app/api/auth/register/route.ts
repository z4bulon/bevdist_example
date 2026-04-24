import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return apiError("Email already in use", 409);

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashed,
        role: "CLIENT",
      },
      select: { id: true, email: true, name: true, company: true, role: true },
    });

    return apiSuccess(user, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
