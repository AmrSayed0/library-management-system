import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { BookInput, BookSchema } from "./book.validator";

const prisma = new PrismaClient();

export const addBook = async (req: Request, res: Response) => {
  try {
    const data: BookInput = BookSchema.parse(req.body);
    const book = await prisma.book.create({ data });
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data: Partial<BookInput> = BookSchema.partial().parse(req.body);
    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(book);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.book.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: "Book not found" });
  }
};

export const listBooks = async (req: Request, res: Response) => {
  const books = await prisma.book.findMany();
  res.json(books);
};

export const searchBooks = async (req: Request, res: Response) => {
  const { search } = req.query;
  if (!search) return res.json(await prisma.book.findMany());

  const books = await prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: search as string, mode: "insensitive" } },
        { author: { contains: search as string, mode: "insensitive" } },
        { isbn: { contains: search as string, mode: "insensitive" } },
      ],
    },
  });
  res.json(books);
};
