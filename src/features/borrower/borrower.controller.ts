import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { BorrowerInput, BorrowerSchema } from "./borrower.validator";

const prisma = new PrismaClient();

export const registerBorrower = async (req: Request, res: Response) => {
  try {
    const data: BorrowerInput = BorrowerSchema.parse(req.body);
    const borrower = await prisma.borrower.create({ data });
    res.status(201).json(borrower);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateBorrower = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data: Partial<BorrowerInput> = BorrowerSchema.partial().parse(
      req.body
    );
    const borrower = await prisma.borrower.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(borrower);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteBorrower = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.borrower.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: "Borrower not found" });
  }
};

export const listBorrowers = async (req: Request, res: Response) => {
  const borrowers = await prisma.borrower.findMany();
  res.json(borrowers);
};
