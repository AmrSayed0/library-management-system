import { Router } from "express";
import {
  deleteBorrower,
  listBorrowers,
  registerBorrower,
  updateBorrower,
} from "./borrower.controller";
import { getBorrowerBooks } from "../borrowing/borrowing.controller";

const router = Router();

router.post("/borrowers", registerBorrower);
router.get("/borrowers", listBorrowers);
router.get("/borrowers/:id/books", getBorrowerBooks);
router.put("/borrowers/:id", updateBorrower);
router.delete("/borrowers/:id", deleteBorrower);

export default router;
