# Library Management System API

A modern, feature-rich library management system built with Node.js, Express.js, TypeScript, and PostgreSQL. This system provides a simple functionality for managing books, borrowers, borrowing operations, user authentication, and generating detailed reports.

## Features

- **User authentication & Profile Management**

  - JWT-based authentication
  - Role-based access control (Admin, Librarian, User)
  - Secure password hashing with bcrypt
  - User profile management

- **Book Management**

  - Add, update, delete, and search books
  - ISBN validation and unique constraints
  - Track book availability and location
  - Inventory management

- **Borrower Management**

  - Register and manage borrowers
  - Track borrower history and current Borrowing
  - Update borrower information

- **Borrowing Operations**

  - Check out and return books
  - Automated due date calculation
  - Overdue book tracking
  - Rate limiting for borrowing operations

- **Reporting & Analytics**

  - Detailed borrowing reports
  - Export data in CSV and XLSX formats
  - Overdue books reporting
  - Monthly and custom date range reports

- **Security & Error Handling**
  - Rate limiting
  - CORS protection
  - Helmet security headers
  - Request logging with Morgan
  - Detailed error handling

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schemas validation
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston + Morgan
- **Testing**: Vitest + Jest + Supertest
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 22+
- PostgreSQL 17
- Docker & Docker Compose (optional)
- npm or yarn

## Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**

   ```bash
   git clone https://github.com/AmrSayed0/library-management-system.git
   cd library-management-system
   ```

2. **Configure environment variables**

   ```bash
   touch .env
   # Edit .env with your configuration
   ```

   Create a `.env` file with your specific configuration values.

3. **Start with Docker Compose**

   ```bash
   docker compose up --build
   ```

4. **Verify installation**
   - API: <http://localhost:3001>
   - Health check: <http://localhost:3001/api/v1/health>

### Option 2: Local Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/AmrSayed0/library-management-system.git
   cd library-management-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup database**

   ```bash
   # Create your PostgreSQL database
   createdb library_management

   # Run migrations
   npm run prisma:migrate
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
library-management-backend/
├── src/
│   ├── features/          # Feature-based modules
│   │   ├── auth/          # Authentication & user management
│   │   ├── book/          # Book management
│   │   ├── borrower/      # Borrower management
│   │   ├── borrowing/     # Borrowing operations
│   │   └── reports/       # Reporting & analytics
│   ├── middlewares/       # Express middlewares
│   └── index.ts           # Application entry point
├── prisma/                # Database schema & migrations
├── tests/                 # Test files
├── docs/                  # Documentation
├── docker-compose.yml     # Docker orchestration
├── Dockerfile             # Container definition
└── package.json           # Dependencies & scripts
|....|
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Application Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/library_management"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Rate Limiting Configuration
BORROWING_RATE_LIMIT=10
EXPORT_RATE_LIMIT=5

# Security Configuration (Optional)
CORS_ORIGIN=http://localhost:3000
```

**Important Notes:**

- Replace `username`, `password` with your actual database credentials
- For Docker: Use `postgresql://postgres:password@db:5432/library_management`
- JWT_SECRET should be at least 32 characters long for security
- Generate a secure JWT secret: `openssl rand -hex 32`

## API Documentation

The API follows RESTful conventions with the base URL: `http://localhost:3001/api/v1`

### Quick API Overview

| Module    | Endpoint        | Description                        |
| --------- | --------------- | ---------------------------------- |
| Auth      | `/auth/*`       | User authentication & management   |
| Books     | `/books/*`      | Book inventory management          |
| Borrowers | `/borrowers/*`  | Borrower registration & management |
| Borrowing | `/borrowings/*` | Check-out/return operations        |
| Reports   | `/reports/*`    | Analytics & data export            |

> 📚 **Detailed API documentation** is available in [docs/API.md](./docs/API.md)

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test:book
```

## Deployment

### Production Setup

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

   ```bash
   export NODE_ENV=production
   export DATABASE_URL="your-production-db-url"
   export JWT_SECRET="your-production-jwt-secret"
   ```

3. **Start production server**
   ```bash
   npm start
   ```

### Docker Production Deployment

```bash
# Build production image
docker build -t library-management-api .

# Run with production environment
docker run -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-production-db-url" \
  -e JWT_SECRET="your-production-jwt-secret" \
  library-management-api
```

## Schema Diagram

![Database Schema](docs/schema.png)

The system uses PostgreSQL with the following main entities:

- **Users**: System users with role-based access
- **Books**: Book inventory with availability tracking
- **Borrowers**: Library members who can borrow books
- **Borrowings**: Records of book checkout/return operations

> 🗄️ **Detailed database documentation** is available in [docs/DATABASE.md](./docs/DATABASE.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Scripts Reference

| Script                    | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start development server with hot reload |
| `npm run build`           | Build TypeScript to JavaScript           |
| `npm start`               | Start production server                  |
| `npm run prisma:generate` | Generate Prisma client                   |
| `npm run prisma:migrate`  | Run database migrations                  |
| `npm run prisma:studio`   | Open Prisma Studio                       |
| `npm test`                | Run test suite                           |
| `npm run lint`            | Run ESLint                               |

## Security Features

- **Authentication**: JWT-based with refresh token support
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Configurable limits per endpoint
- **Input Validation**: Zod schema validation
- **Security Headers**: Helmet.js protection
- **Password Security**: bcrypt hashing with salt rounds
- **CORS**: Configurable cross-origin resource sharing

## Performance Features

- **Database Optimization**: Indexed queries and optimized schema
- **Rate Limiting**: Prevents API abuse
- **Caching**: Redis-ready architecture (configurable)
- **Monitoring**: Detailed logging with Winston
- **Error Handling**: Centralized error management

## Authors

- **Amr Sayed** <https://amrdev.me>

## Production Deployment

**Backend APIs:** Deployed on DigitalOcean: [View Here](https://library-management-system-9ywxz.ondigitalocean.app/api/v1/books)
