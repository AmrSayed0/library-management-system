import { describe, it, expect } from "vitest";
import { BookSchema, BookInput } from "../src/features/book/book.validator";

describe("Book Validator", () => {
  describe("BookSchema", () => {
    it("should validate a valid book object", () => {
      // Arrange
      const validBook = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
        location: "A1",
      };

      // Act
      const result = BookSchema.safeParse(validBook);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBook);
      }
    });

    it("should validate a book without optional location", () => {
      // Arrange
      const validBookWithoutLocation = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
      };

      // Act
      const result = BookSchema.safeParse(validBookWithoutLocation);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBookWithoutLocation);
      }
    });

    it("should reject book with empty title", () => {
      // Arrange
      const invalidBook = {
        title: "",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
      };

      // Act
      const result = BookSchema.safeParse(invalidBook);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject book with empty author", () => {
      // Arrange
      const invalidBook = {
        title: "Test Book",
        author: "",
        isbn: "978-0123456789",
        quantity: 5,
      };

      // Act
      const result = BookSchema.safeParse(invalidBook);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject book with empty ISBN", () => {
      // Arrange
      const invalidBook = {
        title: "Test Book",
        author: "Test Author",
        isbn: "",
        quantity: 5,
      };

      // Act
      const result = BookSchema.safeParse(invalidBook);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject book with negative quantity", () => {
      // Arrange
      const invalidBook = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: -1,
      };

      // Act
      const result = BookSchema.safeParse(invalidBook);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should accept zero quantity", () => {
      // Arrange
      const validBook = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 0,
      };

      // Act
      const result = BookSchema.safeParse(validBook);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(0);
      }
    });

    it("should handle partial schema for updates", () => {
      // Arrange
      const partialUpdate = {
        quantity: 10,
        location: "B2",
      };

      // Act
      const result = BookSchema.partial().safeParse(partialUpdate);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialUpdate);
      }
    });

    it("should reject partial update with invalid data", () => {
      // Arrange
      const invalidPartialUpdate = {
        quantity: -5,
        location: "B2",
      };

      // Act
      const result = BookSchema.partial().safeParse(invalidPartialUpdate);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("BookInput type", () => {
    it("should allow proper typing of book input", () => {
      // This test verifies that the BookInput type works correctly
      const bookInput: BookInput = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
        location: "A1",
      };

      expect(bookInput.title).toBe("Test Book");
      expect(bookInput.author).toBe("Test Author");
      expect(bookInput.isbn).toBe("978-0123456789");
      expect(bookInput.quantity).toBe(5);
      expect(bookInput.location).toBe("A1");
    });

    it("should allow optional location in BookInput type", () => {
      const bookInputWithoutLocation: BookInput = {
        title: "Test Book",
        author: "Test Author",
        isbn: "978-0123456789",
        quantity: 5,
        // location is optional
      };

      expect(bookInputWithoutLocation.location).toBeUndefined();
    });
  });
});
