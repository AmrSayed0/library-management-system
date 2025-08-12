import { z } from "zod";

export const DateRangeSchema = z.object({
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});
