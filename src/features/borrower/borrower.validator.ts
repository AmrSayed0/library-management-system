import { z } from "zod";

export const BorrowerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export type BorrowerInput = z.infer<typeof BorrowerSchema>;
