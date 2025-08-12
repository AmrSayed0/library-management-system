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
import { exportRateLimit } from "../../middlewares/rateLimiters";
import { authenticateToken, requireLibrarian } from "../../middlewares/auth";

const router = Router();

router.get("/reports/borrowings", authenticateToken, getBorrowingReport);

const exportRouter = Router();
exportRouter.use(authenticateToken);
exportRouter.use(requireLibrarian);
exportRouter.use(exportRateLimit);

exportRouter.get("/borrowings/csv", exportBorrowingsCSV);
exportRouter.get("/borrowings/xlsx", exportBorrowingsXLSX);
exportRouter.get("/overdue/last-month/csv", exportOverdueLastMonthCSV);
exportRouter.get("/overdue/last-month/xlsx", exportOverdueLastMonthXLSX);
exportRouter.get(
  "/all-borrowings/last-month/csv",
  exportAllBorrowingsLastMonthCSV
);
exportRouter.get(
  "/all-borrowings/last-month/xlsx",
  exportAllBorrowingsLastMonthXLSX
);

router.use("/exports", exportRouter);

export default router;
