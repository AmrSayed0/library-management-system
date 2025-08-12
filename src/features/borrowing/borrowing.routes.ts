import { Router } from "express";

import {
  checkoutBook,
  getAllBorrowings,
  getOverdueBooks,
  returnBook,
} from "./borrowing.controller";
import { borrowingRateLimit } from "../../middlewares/rateLimiters";
import { authenticateToken, requireLibrarian } from "../../middlewares/auth";

const router = Router();

router.post(
  "/borrowings",
  authenticateToken,
  requireLibrarian,
  borrowingRateLimit,
  checkoutBook
);
router.get("/borrowings", authenticateToken, getAllBorrowings);
router.put(
  "/borrowings/:id/return",
  authenticateToken,
  requireLibrarian,
  borrowingRateLimit,
  returnBook
);
router.get("/borrowings/overdue", authenticateToken, getOverdueBooks);

export default router;
