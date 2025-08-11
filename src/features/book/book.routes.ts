import { Router } from "express";
import {
  addBook,
  deleteBook,
  searchBooks,
  updateBook,
} from "./book.controller";

const router = Router();

router.post("/books", addBook);
router.get("/books", searchBooks);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

export default router;
