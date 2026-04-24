import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  company: z.string().min(2),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(0), // 0 = remove
});

export const createOrderSchema = z.object({
  notes: z.string().optional(),
});

export const orderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  unit: z.string().default("box"),
  categoryId: z.string(),
  imageUrl: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});
