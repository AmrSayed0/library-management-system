import { Router } from "express";

import {
  checkoutBook,
  getAllBorrowings,
  getOverdueBooks,
  returnBook,
} from "./borrowing.controller";
import { borrowingRateLimit } from "../../middlewares/rateLimiters";

const router = Router();

router.post("/borrowings", borrowingRateLimit, checkoutBook);
router.get("/borrowings", getAllBorrowings);
router.put("/borrowings/:id/return", borrowingRateLimit, returnBook);
router.get("/borrowings/overdue", getOverdueBooks);

export default router;
