import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";
import { BorrowingInput, BorrowingSchema } from "./borrowing.validator";

const prisma = new PrismaClient();

export const checkoutBook = async (req: Request, res: Response) => {
  try {
    const data: BorrowingInput = BorrowingSchema.parse(req.body);

    // Check if borrower exists
    const borrower = await prisma.borrower.findUnique({
      where: { id: data.borrowerId },
    });
    if (!borrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    // Check if book exists and is available
    const book = await prisma.book.findUnique({ where: { id: data.bookId } });
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    if (book.quantity <= 0) {
      return res.status(400).json({ error: "Book not available for checkout" });
    }

    // Using transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update book quantity
      await tx.book.update({
        where: { id: data.bookId },
        data: { quantity: book.quantity - 1 },
      });

      // Create borrowing record
      const dueDate = addDays(new Date(), 14);
      const borrowing = await tx.borrowing.create({
        data: { ...data, dueDate },
        include: { book: true, borrower: true },
      });

      return borrowing;
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const returnBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: parseInt(id) },
      include: { book: true, borrower: true },
    });

    if (!borrowing) {
      return res.status(404).json({ error: "Borrowing record not found" });
    }

    if (borrowing.returnDate) {
      return res.status(400).json({ error: "Book has already been returned" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: { quantity: borrowing.book.quantity + 1 },
      });

      // Update borrowing record with return date
      const updated = await tx.borrowing.update({
        where: { id: parseInt(id) },
        data: { returnDate: new Date() },
        include: { book: true, borrower: true },
      });

      return updated;
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getBorrowerBooks = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Check if borrower exists
    const borrower = await prisma.borrower.findUnique({
      where: { id: parseInt(id) },
    });
    if (!borrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    const borrowings = await prisma.borrowing.findMany({
      where: { borrowerId: parseInt(id), returnDate: null },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            location: true,
          },
        },
      },
      orderBy: { checkoutDate: "desc" },
    });

    res.json(borrowings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getOverdueBooks = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const overdue = await prisma.borrowing.findMany({
      where: {
        dueDate: { lt: now },
        returnDate: null,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            location: true,
          },
        },
        borrower: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Calculate days overdue for each item
    const overdueWithDays = overdue.map((item) => ({
      ...item,
      daysOverdue: Math.floor(
        (now.getTime() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    res.json(overdueWithDays);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllBorrowings = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let whereCondition: any = {};
    if (status === "active") {
      whereCondition.returnDate = null;
    } else if (status === "returned") {
      whereCondition.returnDate = { not: null };
    }

    const borrowings = await prisma.borrowing.findMany({
      where: whereCondition,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            location: true,
          },
        },
        borrower: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { checkoutDate: "desc" },
    });

    res.json(borrowings);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
