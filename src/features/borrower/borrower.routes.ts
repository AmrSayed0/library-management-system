import { Router } from "express";
import {
  deleteBorrower,
  listBorrowers,
  registerBorrower,
  updateBorrower,
} from "./borrower.controller";

const router = Router();

router.post("/borrowers", registerBorrower);
router.get("/borrowers", listBorrowers);
router.put("/borrowers/:id", updateBorrower);
router.delete("/borrowers/:id", deleteBorrower);

export default router;
