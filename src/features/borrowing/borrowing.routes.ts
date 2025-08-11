import { Router } from "express";

import {
  checkoutBook,
  getAllBorrowings,
  getOverdueBooks,
  returnBook,
} from "./borrowing.controller";

const router = Router();

router.post("/borrowings", checkoutBook);
router.get("/borrowings", getAllBorrowings);
router.put("/borrowings/:id/return", returnBook);
router.get("/borrowings/overdue", getOverdueBooks);

export default router;
