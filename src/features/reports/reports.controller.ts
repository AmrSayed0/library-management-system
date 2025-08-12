import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { isAfter } from "date-fns";
import { Parser } from "json2csv";
import * as ExcelJS from "exceljs";
import { DateRangeSchema } from "./reports.validator";

const prisma = new PrismaClient();

export const getBorrowingReport = async (req: Request, res: Response) => {
  try {
    const { from, to } = DateRangeSchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isAfter(fromDate, toDate)) {
      return res
        .status(400)
        .json({ error: "From date must be before to date" });
    }

    const borrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: fromDate, lte: toDate },
      },
      include: { book: true, borrower: true },
    });

    const total = borrowings.length;
    const returned = borrowings.filter((b) => b.returnDate !== null).length;
    const active = borrowings.filter(
      (b) => b.returnDate === null && b.dueDate >= new Date()
    ).length;
    const overdue = borrowings.filter(
      (b) => b.returnDate === null && b.dueDate < new Date()
    ).length;

    // Calculate additional analytics
    const mostBorrowedBooks = await prisma.borrowing.groupBy({
      by: ["bookId"],
      where: {
        checkoutDate: { gte: fromDate, lte: toDate },
      },
      _count: {
        bookId: true,
      },
      orderBy: {
        _count: {
          bookId: "desc",
        },
      },
      take: 5,
    });

    const topBorrowers = await prisma.borrowing.groupBy({
      by: ["borrowerId"],
      where: {
        checkoutDate: { gte: fromDate, lte: toDate },
      },
      _count: {
        borrowerId: true,
      },
      orderBy: {
        _count: {
          borrowerId: "desc",
        },
      },
      take: 5,
    });

    res.json({
      summary: {
        total,
        returned,
        active,
        overdue,
        period: { from, to },
      },
      analytics: {
        returnRate: total > 0 ? Math.round((returned / total) * 100) : 0,
        overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
        mostBorrowedBooksCount: mostBorrowedBooks.length,
        topBorrowersCount: topBorrowers.length,
      },
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const exportBorrowingsCSV = async (req: Request, res: Response) => {
  try {
    const { from, to } = DateRangeSchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isAfter(fromDate, toDate)) {
      return res
        .status(400)
        .json({ error: "From date must be before to date" });
    }

    const borrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: fromDate, lte: toDate },
      },
      include: { book: true, borrower: true },
    });

    // Transform data for CSV export
    const csvData = borrowings.map((borrowing) => ({
      id: borrowing.id,
      bookTitle: borrowing.book.title,
      bookAuthor: borrowing.book.author,
      bookISBN: borrowing.book.isbn,
      borrowerName: borrowing.borrower.name,
      borrowerEmail: borrowing.borrower.email,
      checkoutDate: borrowing.checkoutDate.toISOString().split("T")[0],
      dueDate: borrowing.dueDate.toISOString().split("T")[0],
      returnDate: borrowing.returnDate
        ? borrowing.returnDate.toISOString().split("T")[0]
        : null,
      status: borrowing.returnDate
        ? "Returned"
        : borrowing.dueDate < new Date()
        ? "Overdue"
        : "Active",
    }));

    const fields = [
      "id",
      "bookTitle",
      "bookAuthor",
      "bookISBN",
      "borrowerName",
      "borrowerEmail",
      "checkoutDate",
      "dueDate",
      "returnDate",
      "status",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(`borrowings_${from}_to_${to}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const exportBorrowingsXLSX = async (req: Request, res: Response) => {
  try {
    const { from, to } = DateRangeSchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isAfter(fromDate, toDate)) {
      return res
        .status(400)
        .json({ error: "From date must be before to date" });
    }

    const borrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: fromDate, lte: toDate },
      },
      include: { book: true, borrower: true },
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Borrowings Report");

    // Add headers
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Book Title", key: "bookTitle", width: 30 },
      { header: "Book Author", key: "bookAuthor", width: 25 },
      { header: "Book ISBN", key: "bookISBN", width: 15 },
      { header: "Borrower Name", key: "borrowerName", width: 25 },
      { header: "Borrower Email", key: "borrowerEmail", width: 30 },
      { header: "Checkout Date", key: "checkoutDate", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Return Date", key: "returnDate", width: 15 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data
    borrowings.forEach((borrowing) => {
      const status = borrowing.returnDate
        ? "Returned"
        : borrowing.dueDate < new Date()
        ? "Overdue"
        : "Active";

      worksheet.addRow({
        id: borrowing.id,
        bookTitle: borrowing.book.title,
        bookAuthor: borrowing.book.author,
        bookISBN: borrowing.book.isbn,
        borrowerName: borrowing.borrower.name,
        borrowerEmail: borrowing.borrower.email,
        checkoutDate: borrowing.checkoutDate.toISOString().split("T")[0],
        dueDate: borrowing.dueDate.toISOString().split("T")[0],
        returnDate: borrowing.returnDate
          ? borrowing.returnDate.toISOString().split("T")[0]
          : null,
        status: status,
      });
    });

    // Add summary section
    worksheet.addRow([]);
    worksheet.addRow(["Summary"]);
    worksheet.addRow(["Total Borrowings:", borrowings.length]);
    worksheet.addRow([
      "Returned:",
      borrowings.filter((b) => b.returnDate !== null).length,
    ]);
    worksheet.addRow([
      "Overdue:",
      borrowings.filter((b) => b.returnDate === null && b.dueDate < new Date())
        .length,
    ]);
    worksheet.addRow([
      "Active:",
      borrowings.filter((b) => b.returnDate === null && b.dueDate >= new Date())
        .length,
    ]);

    // Style summary section
    const summaryStartRow = worksheet.rowCount - 4;
    for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
    }

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=borrowings_${from}_to_${to}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
