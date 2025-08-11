import { z } from "zod";

export const BookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().min(1),
  quantity: z.number().int().min(0),
  location: z.string().optional(),
});

export type BookInput = z.infer<typeof BookSchema>;
