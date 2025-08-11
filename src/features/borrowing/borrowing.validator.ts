import { z } from "zod";

export const BorrowingSchema = z.object({
  bookId: z.number().int(),
  borrowerId: z.number().int(),
});

export type BorrowingInput = z.infer<typeof BorrowingSchema>;
