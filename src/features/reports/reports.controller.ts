import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { isAfter, subMonths } from "date-fns";
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

export const exportOverdueLastMonthCSV = async (
  req: Request,
  res: Response
) => {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // get all overdue borrowings from the last month
    const overdueBorrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: lastMonth, lte: now },
        returnDate: null,
        dueDate: { lt: now },
      },
      include: { book: true, borrower: true },
      orderBy: { dueDate: "asc" },
    });

    // transform data for CSV export with overdue days calculation
    const csvData = overdueBorrowings.map((borrowing) => {
      const daysOverdue = Math.floor(
        (now.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: borrowing.id,
        bookTitle: borrowing.book.title,
        bookAuthor: borrowing.book.author,
        bookISBN: borrowing.book.isbn,
        borrowerName: borrowing.borrower.name,
        borrowerEmail: borrowing.borrower.email,
        checkoutDate: borrowing.checkoutDate.toISOString().split("T")[0],
        dueDate: borrowing.dueDate.toISOString().split("T")[0],
        daysOverdue: daysOverdue,
        status: "Overdue",
      };
    });

    const fields = [
      "id",
      "bookTitle",
      "bookAuthor",
      "bookISBN",
      "borrowerName",
      "borrowerEmail",
      "checkoutDate",
      "dueDate",
      "daysOverdue",
      "status",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    const fromDate = lastMonth.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    res.header("Content-Type", "text/csv");
    res.attachment(
      `overdue_borrowings_last_month_${fromDate}_to_${toDate}.csv`
    );
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const exportOverdueLastMonthXLSX = async (
  req: Request,
  res: Response
) => {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // get all overdue borrowings from the last month
    const overdueBorrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: lastMonth, lte: now },
        returnDate: null,
        dueDate: { lt: now },
      },
      include: { book: true, borrower: true },
      orderBy: { dueDate: "asc" },
    });

    // create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Overdue Borrowings - Last Month");

    // add title and date range
    worksheet.mergeCells("A1:J1");
    worksheet.getCell("A1").value = "Overdue Borrowings Report - Last Month";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:J2");
    worksheet.getCell(
      "A2"
    ).value = `Period: ${lastMonth.toDateString()} to ${now.toDateString()}`;
    worksheet.getCell("A2").font = { italic: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    // add empty row
    worksheet.addRow([]);

    // add headers starting from row 4
    const headerRow = worksheet.addRow([
      "ID",
      "Book Title",
      "Book Author",
      "Book ISBN",
      "Borrower Name",
      "Borrower Email",
      "Checkout Date",
      "Due Date",
      "Days Overdue",
      "Status",
    ]);

    // style the header row
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      // red background for overdue theme
      fgColor: { argb: "FFFF6B6B" },
    };

    // set column widths
    worksheet.columns = [
      { width: 10 }, // ID
      { width: 30 }, // Book Title
      { width: 25 }, // Book Author
      { width: 15 }, // Book ISBN
      { width: 25 }, // Borrower Name
      { width: 30 }, // Borrower Email
      { width: 15 }, // Checkout Date
      { width: 15 }, // Due Date
      { width: 15 }, // Days Overdue
      { width: 12 }, // Status
    ];

    // add data
    overdueBorrowings.forEach((borrowing) => {
      const daysOverdue = Math.floor(
        (now.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const dataRow = worksheet.addRow([
        borrowing.id,
        borrowing.book.title,
        borrowing.book.author,
        borrowing.book.isbn,
        borrowing.borrower.name,
        borrowing.borrower.email,
        borrowing.checkoutDate.toISOString().split("T")[0],
        borrowing.dueDate.toISOString().split("T")[0],
        daysOverdue,
        "Overdue",
      ]);

      // Highlight rows based on how overdue they are
      if (daysOverdue > 30) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFCCCC" },
        }; // Light red
      } else if (daysOverdue > 14) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFEECC" },
        }; // Light orange
      } else if (daysOverdue > 7) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFCC" },
        }; // Light yellow
      }
    });

    // add summary section
    worksheet.addRow([]);
    const summaryTitleRow = worksheet.addRow(["Summary"]);
    summaryTitleRow.font = { bold: true, size: 14 };

    worksheet.addRow(["Total Overdue Borrowings:", overdueBorrowings.length]);
    worksheet.addRow([
      "Report Period:",
      `${lastMonth.toDateString()} to ${now.toDateString()}`,
    ]);
    worksheet.addRow(["Generated On:", now.toDateString()]);

    // categorize by overdue duration
    const overdue30Plus = overdueBorrowings.filter((b) => {
      const days = Math.floor(
        (now.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 30;
    }).length;

    const overdue14to30 = overdueBorrowings.filter((b) => {
      const days = Math.floor(
        (now.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 14 && days <= 30;
    }).length;

    const overdue7to14 = overdueBorrowings.filter((b) => {
      const days = Math.floor(
        (now.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days > 7 && days <= 14;
    }).length;

    const overdueUnder7 = overdueBorrowings.filter((b) => {
      const days = Math.floor(
        (now.getTime() - b.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return days <= 7;
    }).length;

    worksheet.addRow([]);
    worksheet.addRow(["Overdue Categories:"]);
    worksheet.addRow(["1-7 days overdue:", overdueUnder7]);
    worksheet.addRow(["8-14 days overdue:", overdue7to14]);
    worksheet.addRow(["15-30 days overdue:", overdue14to30]);
    worksheet.addRow(["30+ days overdue:", overdue30Plus]);

    // style summary section
    const summaryStartRow = worksheet.rowCount - 8;
    for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
    }

    const fromDate = lastMonth.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    // set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=overdue_borrowings_last_month_${fromDate}_to_${toDate}.xlsx`
    );

    // write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const exportAllBorrowingsLastMonthCSV = async (
  req: Request,
  res: Response
) => {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // Get all borrowings from the last month (regardless of status)
    const borrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: lastMonth, lte: now },
      },
      include: { book: true, borrower: true },
      orderBy: { checkoutDate: "desc" },
    });

    // Transform data for CSV export with comprehensive information
    const csvData = borrowings.map((borrowing) => {
      const daysFromCheckout = Math.floor(
        (now.getTime() - borrowing.checkoutDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let status = "Active";
      let daysOverdue = null;

      if (borrowing.returnDate) {
        status = "Returned";
        const returnDays = Math.floor(
          (borrowing.returnDate.getTime() - borrowing.checkoutDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        daysOverdue = `Returned after ${returnDays} days`;
      } else if (borrowing.dueDate < now) {
        status = "Overdue";
        daysOverdue = Math.floor(
          (now.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        id: borrowing.id,
        bookTitle: borrowing.book.title,
        bookAuthor: borrowing.book.author,
        bookISBN: borrowing.book.isbn,
        bookLocation: borrowing.book.location || "Not specified",
        borrowerName: borrowing.borrower.name,
        borrowerEmail: borrowing.borrower.email,
        checkoutDate: borrowing.checkoutDate.toISOString().split("T")[0],
        dueDate: borrowing.dueDate.toISOString().split("T")[0],
        returnDate: borrowing.returnDate
          ? borrowing.returnDate.toISOString().split("T")[0]
          : "Not returned",
        status: status,
        daysFromCheckout: daysFromCheckout,
        daysOverdueOrReturned: daysOverdue || "N/A",
      };
    });

    const fields = [
      "id",
      "bookTitle",
      "bookAuthor",
      "bookISBN",
      "bookLocation",
      "borrowerName",
      "borrowerEmail",
      "checkoutDate",
      "dueDate",
      "returnDate",
      "status",
      "daysFromCheckout",
      "daysOverdueOrReturned",
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    const fromDate = lastMonth.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    res.header("Content-Type", "text/csv");
    res.attachment(`all_borrowings_last_month_${fromDate}_to_${toDate}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const exportAllBorrowingsLastMonthXLSX = async (
  req: Request,
  res: Response
) => {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // Get all borrowings from the last month (regardless of status)
    const borrowings = await prisma.borrowing.findMany({
      where: {
        checkoutDate: { gte: lastMonth, lte: now },
      },
      include: { book: true, borrower: true },
      orderBy: { checkoutDate: "desc" },
    });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("All Borrowings - Last Month");

    // Add title and date range
    worksheet.mergeCells("A1:M1");
    worksheet.getCell("A1").value = "Complete Borrowings Report - Last Month";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    worksheet.mergeCells("A2:M2");
    worksheet.getCell(
      "A2"
    ).value = `Period: ${lastMonth.toDateString()} to ${now.toDateString()}`;
    worksheet.getCell("A2").font = { italic: true };
    worksheet.getCell("A2").alignment = { horizontal: "center" };

    // Add empty row
    worksheet.addRow([]);

    // Add headers starting from row 4
    const headerRow = worksheet.addRow([
      "ID",
      "Book Title",
      "Book Author",
      "Book ISBN",
      "Book Location",
      "Borrower Name",
      "Borrower Email",
      "Checkout Date",
      "Due Date",
      "Return Date",
      "Status",
      "Days from Checkout",
      "Days Overdue/Returned",
    ]);

    // Style the header row
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4CAF50" },
    };

    // Set column widths
    worksheet.columns = [
      { width: 10 }, // ID
      { width: 30 }, // Book Title
      { width: 25 }, // Book Author
      { width: 15 }, // Book ISBN
      { width: 15 }, // Book Location
      { width: 25 }, // Borrower Name
      { width: 30 }, // Borrower Email
      { width: 15 }, // Checkout Date
      { width: 15 }, // Due Date
      { width: 15 }, // Return Date
      { width: 12 }, // Status
      { width: 18 }, // Days from Checkout
      { width: 20 }, // Days Overdue/Returned
    ];

    // Add data with color coding
    borrowings.forEach((borrowing) => {
      const daysFromCheckout = Math.floor(
        (now.getTime() - borrowing.checkoutDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      let status = "Active";
      let daysOverdueOrReturned = "N/A";

      if (borrowing.returnDate) {
        status = "Returned";
        const returnDays = Math.floor(
          (borrowing.returnDate.getTime() - borrowing.checkoutDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        daysOverdueOrReturned = `Returned after ${returnDays} days`;
      } else if (borrowing.dueDate < now) {
        status = "Overdue";
        daysOverdueOrReturned = `${Math.floor(
          (now.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )} days overdue`;
      }

      const dataRow = worksheet.addRow([
        borrowing.id,
        borrowing.book.title,
        borrowing.book.author,
        borrowing.book.isbn,
        borrowing.book.location || "Not specified",
        borrowing.borrower.name,
        borrowing.borrower.email,
        borrowing.checkoutDate.toISOString().split("T")[0],
        borrowing.dueDate.toISOString().split("T")[0],
        borrowing.returnDate
          ? borrowing.returnDate.toISOString().split("T")[0]
          : "Not returned",
        status,
        daysFromCheckout,
        daysOverdueOrReturned,
      ]);

      // Color code rows based on status
      if (status === "Returned") {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F5E8" },
        }; // Light green
      } else if (status === "Overdue") {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE8E8" },
        }; // Light red
      } else if (status === "Active") {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0F8FF" },
        }; // Light blue
      }
    });

    // Calculate statistics
    const totalBorrowings = borrowings.length;
    const returnedCount = borrowings.filter(
      (b) => b.returnDate !== null
    ).length;
    const overdueCount = borrowings.filter(
      (b) => b.returnDate === null && b.dueDate < now
    ).length;
    const activeCount = borrowings.filter(
      (b) => b.returnDate === null && b.dueDate >= now
    ).length;

    // Add summary section
    worksheet.addRow([]);
    const summaryTitleRow = worksheet.addRow(["Summary Statistics"]);
    summaryTitleRow.font = { bold: true, size: 14 };

    worksheet.addRow(["Total Borrowings (Last Month):", totalBorrowings]);
    worksheet.addRow(["Returned Books:", returnedCount]);
    worksheet.addRow(["Currently Active:", activeCount]);
    worksheet.addRow(["Currently Overdue:", overdueCount]);
    worksheet.addRow([
      "Return Rate:",
      `${
        totalBorrowings > 0
          ? Math.round((returnedCount / totalBorrowings) * 100)
          : 0
      }%`,
    ]);
    worksheet.addRow([
      "Overdue Rate:",
      `${
        totalBorrowings > 0
          ? Math.round((overdueCount / totalBorrowings) * 100)
          : 0
      }%`,
    ]);

    worksheet.addRow([]);
    worksheet.addRow(["Report Details:"]);
    worksheet.addRow([
      "Report Period:",
      `${lastMonth.toDateString()} to ${now.toDateString()}`,
    ]);
    worksheet.addRow(["Generated On:", now.toDateString()]);
    worksheet.addRow(["Generated At:", now.toTimeString().split(" ")[0]]);

    // Get most borrowed books in the period
    const bookBorrowCounts: { [key: string]: number } = {};
    borrowings.forEach((b) => {
      const key = `${b.book.title} by ${b.book.author}`;
      bookBorrowCounts[key] = (bookBorrowCounts[key] || 0) + 1;
    });

    const topBooks = Object.entries(bookBorrowCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    if (topBooks.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(["Top 5 Most Borrowed Books:"]);
      topBooks.forEach(([book, count], index) => {
        worksheet.addRow([`${index + 1}. ${book}:`, `${count} time(s)`]);
      });
    }

    // Style summary section
    const summaryStartRow =
      worksheet.rowCount -
      (12 + (topBooks.length > 0 ? topBooks.length + 2 : 0));
    for (let i = summaryStartRow; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).font = { bold: true };
    }

    const fromDate = lastMonth.toISOString().split("T")[0];
    const toDate = now.toISOString().split("T")[0];

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=all_borrowings_last_month_${fromDate}_to_${toDate}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
