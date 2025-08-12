# Database Documentation

This document provides Detailed information about the Library Management System database schema, setup, and management.

## Database Overview

The Library Management System uses **PostgreSQL** as the primary database with **Prisma ORM** for type-safe database operations and migrations.

### Key Features

- ACID-compliant transactions
- Referential integrity with foreign keys
- Optimized indexes for query performance
- Automated timestamp tracking
- Cascade deletions for data consistency

## Schema Overview

The database consists of four main entities with well-defined relationships:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │    Book     │    │  Borrower   │    │  Borrowing  │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ title       │    │ name        │    │ bookId (FK) │
│ email       │    │ author      │    │ email       │    │ borrowerId  │
│ password    │    │ isbn        │    │ registeredAt│    │ checkoutDate│
│ role        │    │ quantity    │    │ updatedAt   │    │ dueDate     │
│ isActive    │    │ location    │    └─────────────┘    │ returnDate  │
│ createdAt   │    │ createdAt   │                       │ createdAt   │
│ updatedAt   │    │ updatedAt   │                       │ updatedAt   │
└─────────────┘    └─────────────┘                       └─────────────┘
                          │                                     │
                          └─────────────────────────────────────┘
                                      One-to-Many
```

## Table Specifications

### Users Table

Stores system users with role-based access control.

```sql
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(255) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" "UserRole" DEFAULT 'USER' NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- User roles enum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LIBRARIAN', 'USER');
```

**Fields:**

- `id`: Auto-incrementing primary key
- `username`: Unique username for login (3-50 characters)
- `email`: Unique email address
- `password`: Hashed password using bcrypt (min 6 characters)
- `role`: User role (ADMIN, LIBRARIAN, USER)
- `isActive`: Account status flag
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

**Indexes:**

- Primary key on `id`
- Unique index on `username`
- Unique index on `email`
- Index on `username` for login queries
- Index on `email` for lookup queries

### Books Table

Manages the library's book inventory.

```sql
CREATE TABLE "Book" (
  "id" SERIAL PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "author" VARCHAR(255) NOT NULL,
  "isbn" VARCHAR(20) UNIQUE NOT NULL,
  "quantity" INTEGER DEFAULT 1 NOT NULL,
  "location" VARCHAR(100),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Fields:**

- `id`: Auto-incrementing primary key
- `title`: Book title (required)
- `author`: Author name (required)
- `isbn`: International Standard Book Number (unique)
- `quantity`: Total copies available (default: 1)
- `location`: Physical location in library (optional)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last modification timestamp

**Indexes:**

- Primary key on `id`
- Unique index on `isbn`
- Index on `title` for search queries
- Index on `author` for search queries
- Index on `isbn` for lookup queries

### Borrowers Table

Stores information about library members who can borrow books.

```sql
CREATE TABLE "Borrower" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "registeredAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
```

**Fields:**

- `id`: Auto-incrementing primary key
- `name`: Full name of the borrower
- `email`: Unique email address
- `registeredAt`: Registration timestamp
- `updatedAt`: Last modification timestamp

**Indexes:**

- Primary key on `id`
- Unique index on `email`

### Borrowings Table

Tracks book checkout and return transactions.

```sql
CREATE TABLE "Borrowing" (
  "id" SERIAL PRIMARY KEY,
  "bookId" INTEGER NOT NULL,
  "borrowerId" INTEGER NOT NULL,
  "checkoutDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "returnDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Borrowing_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE,
  CONSTRAINT "Borrowing_borrowerId_fkey"
    FOREIGN KEY ("borrowerId") REFERENCES "Borrower"("id") ON DELETE CASCADE
);
```

**Fields:**

- `id`: Auto-incrementing primary key
- `bookId`: Foreign key reference to Books table
- `borrowerId`: Foreign key reference to Borrowers table
- `checkoutDate`: When the book was borrowed
- `dueDate`: When the book should be returned
- `returnDate`: When the book was actually returned (NULL if active)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last modification timestamp

**Indexes:**

- Primary key on `id`
- Index on `borrowerId` for borrower queries
- Index on `bookId` for book queries
- Index on `dueDate` for overdue queries

**Relationships:**

- Many-to-One with Books (CASCADE delete)
- Many-to-One with Borrowers (CASCADE delete)

## Database Setup

### Prerequisites

- PostgreSQL 13 or higher
- Node.js 18 or higher
- Prisma CLI

### Initial Setup

1. **Install PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql

   # Windows
   # Download from https://www.postgresql.org/download/
   ```

2. **Create Database**

   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql

   # Create database
   CREATE DATABASE library_management;

   # Create user (optional)
   CREATE USER library_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE library_management TO library_user;
   ```

3. **Configure Environment**

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/library_management"
   ```

4. **Run Migrations**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev --name init

   # Seed database (optional)
   npx prisma db seed
   ```

### Docker Setup

For development with Docker:

```yaml
services:
  postgres:
    image: postgres:15
    container_name: library_postgres
    environment:
      POSTGRES_DB: library_management
      POSTGRES_USER: library_user
      POSTGRES_PASSWORD: library_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  postgres_data:
```

## Database Operations

### Common Queries

#### User Management

```sql
-- Get all active users
SELECT * FROM "User" WHERE "isActive" = true;

-- Count users by role
SELECT role, COUNT(*) FROM "User" GROUP BY role;

-- Find user by email
SELECT * FROM "User" WHERE email = 'user@example.com';
```

#### Book Management

```sql
-- Search books by title or author
SELECT * FROM "Book"
WHERE title ILIKE '%search%' OR author ILIKE '%search%';

-- Get available books (with stock)
SELECT *,
       quantity - (
         SELECT COUNT(*) FROM "Borrowing"
         WHERE "bookId" = "Book".id AND "returnDate" IS NULL
       ) AS available_quantity
FROM "Book";

-- Most borrowed books
SELECT b.title, b.author, COUNT(br.id) as borrow_count
FROM "Book" b
LEFT JOIN "Borrowing" br ON b.id = br."bookId"
GROUP BY b.id, b.title, b.author
ORDER BY borrow_count DESC;
```

#### Borrowing Operations

```sql
-- Current active borrowings
SELECT
  br.id,
  b.title,
  b.author,
  bor.name as borrower_name,
  br."checkoutDate",
  br."dueDate",
  CASE
    WHEN br."dueDate" < CURRENT_DATE THEN 'overdue'
    ELSE 'active'
  END as status
FROM "Borrowing" br
JOIN "Book" b ON br."bookId" = b.id
JOIN "Borrower" bor ON br."borrowerId" = bor.id
WHERE br."returnDate" IS NULL;

-- Overdue books
SELECT
  br.id,
  b.title,
  bor.name,
  bor.email,
  br."dueDate",
  CURRENT_DATE - br."dueDate" as days_overdue
FROM "Borrowing" br
JOIN "Book" b ON br."bookId" = b.id
JOIN "Borrower" bor ON br."borrowerId" = bor.id
WHERE br."returnDate" IS NULL
AND br."dueDate" < CURRENT_DATE;

-- Borrower history
SELECT
  b.title,
  br."checkoutDate",
  br."dueDate",
  br."returnDate",
  CASE
    WHEN br."returnDate" IS NULL THEN 'active'
    WHEN br."returnDate" > br."dueDate" THEN 'returned_late'
    ELSE 'returned_on_time'
  END as status
FROM "Borrowing" br
JOIN "Book" b ON br."bookId" = b.id
WHERE br."borrowerId" = $1
ORDER BY br."checkoutDate" DESC;
```

### Performance Optimization

#### Index Usage

```sql
-- Explain query performance
EXPLAIN ANALYZE
SELECT * FROM "Book" WHERE title ILIKE '%gatsby%';

-- Create additional indexes if needed
CREATE INDEX idx_book_title_gin ON "Book" USING gin(to_tsvector('english', title));
CREATE INDEX idx_borrowing_checkout_date ON "Borrowing"("checkoutDate");
CREATE INDEX idx_borrowing_due_date_active ON "Borrowing"("dueDate")
  WHERE "returnDate" IS NULL;
```

#### Query Optimization Tips

1. Use indexes on frequently queried columns
2. Limit result sets with LIMIT and OFFSET
3. Use JOIN instead of subqueries when possible
4. Consider materialized views for complex reporting

### Backup and Recovery

#### Backup Database

```bash
# Full database backup
pg_dump -h localhost -U library_user -d library_management > backup.sql

# Compressed backup
pg_dump -h localhost -U library_user -d library_management | gzip > backup.sql.gz

# Schema only
pg_dump -h localhost -U library_user -d library_management --schema-only > schema.sql
```

#### Restore Database

```bash
# Restore from backup
psql -h localhost -U library_user -d library_management < backup.sql

# Restore compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U library_user -d library_management
```

### Database Maintenance

#### Regular Maintenance Tasks

```sql
-- Update table statistics
ANALYZE;

-- Vacuum tables to reclaim space
VACUUM;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;

-- Reindex tables
REINDEX DATABASE library_management;
```

#### Monitoring Queries

```sql
-- Check database size
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT * FROM pg_stat_activity
WHERE datname = 'library_management';

-- Lock information
SELECT * FROM pg_locks
WHERE granted = false;
```

## Migration Management

### Prisma Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_new_field

# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate migration from schema changes
npx prisma db push
```

### Manual Migrations

When Prisma migrations are not sufficient:

```sql
-- Add column with default value
ALTER TABLE "Book" ADD COLUMN "publisher" VARCHAR(255);

-- Create index concurrently
CREATE INDEX CONCURRENTLY idx_book_publisher ON "Book"("publisher");

-- Add constraint
ALTER TABLE "Book" ADD CONSTRAINT chk_quantity_positive
  CHECK (quantity >= 0);
```

## Troubleshooting

### Common Issues

1. **Connection Refused**

   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql

   # Start PostgreSQL
   sudo systemctl start postgresql
   ```

2. **Permission Denied**

   ```sql
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE library_management TO library_user;
   GRANT ALL ON SCHEMA public TO library_user;
   ```

3. **Migration Conflicts**

   ```bash
   # Check migration status
   npx prisma migrate status

   # Resolve conflicts manually
   npx prisma migrate resolve --rolled-back "migration_name"
   ```

### Performance Issues

1. **Slow Queries**

   - Check query execution plans with EXPLAIN
   - Add appropriate indexes
   - Consider query rewriting

2. **High CPU Usage**

   - Monitor with pg_stat_activity
   - Check for long-running queries
   - Optimize expensive operations

3. **Memory Issues**
   - Adjust PostgreSQL configuration
   - Monitor buffer cache hit ratio
   - Consider connection pooling

### Debugging Tools

```sql
-- Enable query logging
ALTER DATABASE library_management SET log_statement = 'all';

-- Monitor query performance
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY total_time DESC;
```

## Security Considerations

### Access Control

- Use role-based permissions
- Limit database user privileges
- Regular security audits

### Data Protection

- Enable SSL connections
- Encrypt sensitive data
- Regular backup verification
- Implement audit logging

### Best Practices

- Use prepared statements (handled by Prisma)
- Validate all inputs
- Monitor for suspicious activity
- Keep PostgreSQL updated

## Data Seeding

Sample data for development and testing:

```sql
-- Insert sample users
INSERT INTO "User" (username, email, password, role) VALUES
('admin', 'admin@library.com', '$2a$12$encrypted_password', 'ADMIN'),
('librarian', 'librarian@library.com', '$2a$12$encrypted_password', 'LIBRARIAN');

-- Insert sample books
INSERT INTO "Book" (title, author, isbn, quantity, location) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 3, 'Fiction-A1'),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 2, 'Fiction-A2'),
('1984', 'George Orwell', '978-0-452-28423-4', 4, 'Fiction-B1');

-- Insert sample borrowers
INSERT INTO "Borrower" (name, email) VALUES
('amr Smith', 'amr.smith@email.com'),
('Jane Doe', 'jane.doe@email.com'),
('Bob Wilson', 'bob.wilson@email.com');
```

## Monitoring and Analytics

### Key Metrics to Monitor

- Active borrowings count
- Overdue books percentage
- Popular books and authors
- Borrower activity patterns
- System performance metrics

### Reporting Queries

```sql
-- Monthly borrowing report
SELECT
    DATE_TRUNC('month', "checkoutDate") as month,
    COUNT(*) as total_checkouts,
    COUNT(CASE WHEN "returnDate" IS NOT NULL THEN 1 END) as returns,
    COUNT(CASE WHEN "returnDate" IS NULL THEN 1 END) as active
FROM "Borrowing"
WHERE "checkoutDate" >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY month
ORDER BY month;

-- Book availability report
SELECT
    b.title,
    b.quantity,
    COUNT(br.id) FILTER (WHERE br."returnDate" IS NULL) as checked_out,
    b.quantity - COUNT(br.id) FILTER (WHERE br."returnDate" IS NULL) as available
FROM "Book" b
LEFT JOIN "Borrowing" br ON b.id = br."bookId"
GROUP BY b.id, b.title, b.quantity
ORDER BY available ASC;
```
