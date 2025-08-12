# Development Guide

This guide provides Detailed information for developers working on the Library Management System API.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Structure](#code-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Standards](#code-standards)
- [API Development](#api-development)
- [Database Development](#database-development)
- [Contributing Guidelines](#contributing-guidelines)

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 13+
- Git
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Prisma
  - REST Client

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/AmrSayed0/library-management-system.git
   cd library-management-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Set up database**

   ```bash
   # Create database
   createdb library_management_dev

   # Run migrations
   npm run prisma:migrate

   # Generate Prisma client
   npm run prisma:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Configuration

Create `.env` file with development settings:

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/library_management_dev"

# JWT
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Development
DEBUG=library:*
LOG_LEVEL=debug
```

## Code Structure

### Project Architecture

The project follows a feature-based architecture with clear separation of concerns:

```
src/
├── features/              # Feature modules
│   ├── auth/             # Authentication & authorization
│   │   ├── auth.controller.ts
│   │   ├── auth.routes.ts
│   │   ├── auth.validator.ts
│   │   └── auth.types.ts
│   ├── book/             # Book management
│   ├── borrower/         # Borrower management
│   ├── borrowing/        # Borrowing operations
│   └── reports/          # Reports & analytics
├── middlewares/          # Express middlewares
│   ├── auth.ts          # Authentication middleware
│   ├── errorHandler.ts  # Error handling
│   ├── logger.ts        # Request logging
│   └── rateLimiters.ts  # Rate limiting
├── utils/               # Utility functions
│   ├── validation.ts    # Common validations
│   ├── responses.ts     # Response formatting
│   └── helpers.ts       # Helper functions
├── types/              # TypeScript type definitions
│   ├── auth.ts         # Authentication types
│   ├── api.ts          # API types
│   └── database.ts     # Database types
├── config/             # Configuration
│   └── index.ts        # App configuration
└── index.ts           # Application entry point
```

### Feature Module Structure

Each feature follows a consistent structure:

```
feature/
├── feature.controller.ts  # Business logic & HTTP handlers
├── feature.routes.ts      # Route definitions
├── feature.validator.ts   # Input validation schemas
├── feature.types.ts       # TypeScript interfaces
├── feature.service.ts     # Business logic (optional)
└── __tests__/            # Feature tests
    ├── feature.controller.test.ts
    └── feature.routes.test.ts
```

### Naming Conventions

- **Files**: kebab-case (e.g., `auth.controller.ts`)
- **Directories**: kebab-case (e.g., `src/features/`)
- **Classes**: PascalCase (e.g., `AuthController`)
- **Functions**: camelCase (e.g., `validateUser`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IUser`)
- **Types**: PascalCase (e.g., `UserRole`)

## Development Workflow

### Git Workflow

1. **Create feature branch**

   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make changes and commit**

   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/feature-name
   # Create pull request on GitHub
   ```

### Commit Message Format

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```bash
git commit -m "feat(auth): add JWT token refresh functionality"
git commit -m "fix(books): resolve search pagination issue"
git commit -m "docs: update API documentation"
```

### Development Commands

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run prisma:migrate     # Run migrations
npm run prisma:generate    # Generate client
npm run prisma:studio      # Open Prisma Studio
npm run prisma:reset       # Reset database

# Testing
npm test                   # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:book          # Run specific test suite

# Code quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run format             # Format code with Prettier
```

## Testing Guidelines

### Test Structure

```
tests/
├── unit/                 # Unit tests
│   ├── controllers/
│   ├── services/
│   └── utils/
├── integration/          # Integration tests
│   ├── auth.test.ts
│   ├── books.test.ts
│   └── borrowing.test.ts
├── e2e/                  # End-to-end tests
└── fixtures/             # Test data
    ├── users.json
    ├── books.json
    └── borrowers.json
```

### Writing Tests

#### Unit Tests

```typescript
// tests/unit/controllers/auth.controller.test.ts
import { Request, Response } from "express";
import { register } from "../../../src/features/auth/auth.controller";
import { prismaMock } from "../../mocks/prisma";

describe("Auth Controller", () => {
  describe("register", () => {
    it("should create a new user successfully", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "USER",
      };

      prismaMock.user.create.mockResolvedValue(mockUser);

      const req = {
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: mockUser,
          token: expect.any(String),
        }),
      });
    });
  });
});
```

#### Integration Tests

```typescript
// tests/integration/auth.test.ts
import request from "supertest";
import app from "../../src/index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Auth API", () => {
  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```

### Test Database Setup

Create a separate test database:

```bash
# Create test database
createdb library_management_test

# Set test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://username:password@localhost:5432/library_management_test"
```

### Mocking

#### Prisma Mock

```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
```

#### External Service Mocks

```typescript
// tests/mocks/emailService.ts
export const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordReset: jest.fn().mockResolvedValue(true),
};
```

## Code Standards

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Code Style Guidelines

#### Function Definitions

```typescript
// Good: Clear function signature with types
export const createUser = async (
  userData: CreateUserRequest
): Promise<ApiResponse<User>> => {
  try {
    const user = await prisma.user.create({
      data: userData,
    });

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    throw new ApiError("Failed to create user", 500);
  }
};

// Bad: No types, unclear purpose
export const create = async (data: any) => {
  // implementation
};
```

#### Error Handling

```typescript
// Good: Structured error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Usage
if (!user) {
  throw new ApiError("User not found", 404, "USER_NOT_FOUND");
}
```

#### Response Formatting

```typescript
// Good: Consistent response structure
export const successResponse = <T>(
  data: T,
  message: string = "Success"
): ApiResponse<T> => ({
  success: true,
  data,
  message,
});

export const errorResponse = (
  message: string,
  statusCode: number = 500,
  details?: any
): ApiErrorResponse => ({
  success: false,
  error: message,
  statusCode,
  details,
});
```

## API Development

### Creating New Endpoints

1. **Define types**

   ```typescript
   // src/features/book/book.types.ts
   export interface CreateBookRequest {
     title: string;
     author: string;
     isbn: string;
     quantity?: number;
     location?: string;
   }

   export interface BookResponse {
     id: number;
     title: string;
     author: string;
     isbn: string;
     quantity: number;
     availableQuantity: number;
     location?: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **Create validator**

   ```typescript
   // src/features/book/book.validator.ts
   import { z } from "zod";

   export const createBookSchema = z.object({
     title: z.string().min(1).max(255),
     author: z.string().min(1).max(255),
     isbn: z.string().regex(/^[\d-]+$/),
     quantity: z.number().int().positive().optional(),
     location: z.string().max(100).optional(),
   });

   export const validateCreateBook = (
     req: Request,
     res: Response,
     next: NextFunction
   ) => {
     try {
       createBookSchema.parse(req.body);
       next();
     } catch (error) {
       res
         .status(400)
         .json(errorResponse("Invalid input data", 400, error.errors));
     }
   };
   ```

3. **Implement controller**

   ```typescript
   // src/features/book/book.controller.ts
   export const createBook = async (
     req: Request,
     res: Response
   ): Promise<void> => {
     try {
       const bookData: CreateBookRequest = req.body;

       const book = await prisma.book.create({
         data: bookData,
       });

       res.status(201).json(successResponse(book, "Book created successfully"));
     } catch (error) {
       if (error.code === "P2002") {
         res
           .status(409)
           .json(errorResponse("Book with this ISBN already exists", 409));
         return;
       }
       throw error;
     }
   };
   ```

4. **Define routes**

   ```typescript
   // src/features/book/book.routes.ts
   import { Router } from "express";
   import { createBook } from "./book.controller";
   import { validateCreateBook } from "./book.validator";
   import { authenticateToken, requireLibrarian } from "../../middlewares/auth";

   const router = Router();

   router.post(
     "/books",
     authenticateToken,
     requireLibrarian,
     validateCreateBook,
     createBook
   );

   export default router;
   ```

5. **Add tests**

   ```typescript
   // tests/integration/books.test.ts
   describe("POST /api/v1/books", () => {
     it("should create a new book", async () => {
       const bookData = {
         title: "Test Book",
         author: "Test Author",
         isbn: "978-0123456789",
         quantity: 3,
       };

       const response = await request(app)
         .post("/api/v1/books")
         .set("Authorization", `Bearer ${authToken}`)
         .send(bookData)
         .expect(201);

       expect(response.body.success).toBe(true);
       expect(response.body.data.title).toBe(bookData.title);
     });
   });
   ```

### Middleware Development

```typescript
// src/middlewares/rateLimiters.ts
import rateLimit from "express-rate-limit";

export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string
) =>
  rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: "Rate limit exceeded",
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

export const borrowingRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests
  "Too many borrowing requests, please try again later"
);
```

## Database Development

### Schema Design

```prisma
// prisma/schema.prisma
model Book {
  id        Int      @id @default(autoincrement())
  title     String
  author    String
  isbn      String   @unique
  quantity  Int      @default(1)
  location  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  borrowings Borrowing[]

  @@index([title])
  @@index([author])
  @@index([isbn])
}
```

### Creating Migrations

```bash
# Create migration
npx prisma migrate dev --name add_book_location

# Check migration status
npx prisma migrate status

# Reset development database
npx prisma migrate reset
```

### Database Queries

```typescript
// Complex queries with Prisma
export const getAvailableBooks = async (
  page: number = 1,
  limit: number = 10,
  searchTerm?: string
) => {
  const where = searchTerm
    ? {
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { author: { contains: searchTerm, mode: "insensitive" } },
          { isbn: { contains: searchTerm } },
        ],
      }
    : {};

  const books = await prisma.book.findMany({
    where,
    include: {
      _count: {
        select: {
          borrowings: {
            where: { returnDate: null },
          },
        },
      },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { title: "asc" },
  });

  return books.map((book) => ({
    ...book,
    availableQuantity: book.quantity - book._count.borrowings,
  }));
};
```

### Seeding Data

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@library.com",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  // Create sample books
  const books = await prisma.book.createMany({
    data: [
      {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        isbn: "978-0-7432-7356-5",
        quantity: 3,
      },
      // More books...
    ],
  });

  console.log({ admin, books });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Contributing Guidelines

### Before Contributing

1. Check existing issues and PRs
2. Create an issue for new features
3. Follow the coding standards
4. Write tests for new code
5. Update documentation

### Pull Request Process

1. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**

   - Write clean, documented code
   - Add/update tests
   - Update documentation

3. **Test your changes**

   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit and push**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

5. **Create pull request**
   - Clear title and description
   - Link related issues
   - Include testing notes

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate
- [ ] API changes are documented

### Development Best Practices

1. **Keep functions small and focused**
2. **Use meaningful variable names**
3. **Write self-documenting code**
4. **Handle errors gracefully**
5. **Use TypeScript features effectively**
6. **Follow SOLID principles**
7. **Write tests first (TDD)**
8. **Keep dependencies up to date**

This development guide provides the foundation for contributing to the Library Management System API. Follow these guidelines to maintain code quality and consistency across the project.
