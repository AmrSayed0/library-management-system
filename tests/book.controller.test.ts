import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import {
  addBook,
  updateBook,
  deleteBook,
  listBooks,
  searchBooks,
} from "../src/features/book/book.controller";

// Mock PrismaClient
vi.mock("@prisma/client", () => {
  const mockPrisma = {
    book: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $disconnect: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

describe("Book Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJson = vi.fn();
    mockSend = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson, send: mockSend });

    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      send: mockSend,
    };
  });

  describe("addBook", () => {
    it("should create a new book successfully", async () => {
      // Arrange
      const bookData = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
        location: "A1",
      };

      mockRequest.body = bookData;

      // Act
      await addBook(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it("should return 400 for invalid book data", async () => {
      // Arrange
      const invalidBookData = {
        title: "", // Invalid: empty title
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
      };

      mockRequest.body = invalidBookData;

      // Act
      await addBook(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe("listBooks", () => {
    it("should return all books", async () => {
      // Act
      await listBooks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe("searchBooks", () => {
    it("should search books with query", async () => {
      // Arrange
      mockRequest.query = { search: "Test" };

      // Act
      await searchBooks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalled();
    });

    it("should return all books when no search term provided", async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await searchBooks(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe("updateBook", () => {
    it("should update a book successfully", async () => {
      // Arrange
      const bookId = "1";
      const updateData = {
        title: "Updated Book Title",
        quantity: 10,
      };

      mockRequest.params = { id: bookId };
      mockRequest.body = updateData;

      // Act
      await updateBook(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe("deleteBook", () => {
    it("should delete a book successfully", async () => {
      // Arrange
      const bookId = "1";
      mockRequest.params = { id: bookId };

      // Act
      await deleteBook(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(204);
      expect(mockSend).toHaveBeenCalled();
    });
  });
});
