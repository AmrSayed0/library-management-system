import { Router } from "express";
import {
  exportBorrowingsCSV,
  exportBorrowingsXLSX,
  getBorrowingReport,
} from "./reports.controller";

const router = Router();

router.get("/reports/borrowings", getBorrowingReport);
router.get("/exports/borrowings/csv", exportBorrowingsCSV);
router.get("/exports/borrowings/xlsx", exportBorrowingsXLSX);

export default router;
