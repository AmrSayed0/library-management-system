import { Router } from "express";
import {
  exportAllBorrowingsLastMonthCSV,
  exportAllBorrowingsLastMonthXLSX,
  exportBorrowingsCSV,
  exportBorrowingsXLSX,
  exportOverdueLastMonthCSV,
  exportOverdueLastMonthXLSX,
  getBorrowingReport,
} from "./reports.controller";

const router = Router();

router.get("/reports/borrowings", getBorrowingReport);
router.get("/exports/borrowings/csv", exportBorrowingsCSV);
router.get("/exports/borrowings/xlsx", exportBorrowingsXLSX);
router.get("/exports/overdue/last-month/csv", exportOverdueLastMonthCSV);
router.get("/exports/overdue/last-month/xlsx", exportOverdueLastMonthXLSX);
router.get(
  "/exports/all-borrowings/last-month/csv",
  exportAllBorrowingsLastMonthCSV
);
router.get(
  "/exports/all-borrowings/last-month/xlsx",
  exportAllBorrowingsLastMonthXLSX
);

export default router;
