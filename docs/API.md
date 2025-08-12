# API Documentation

This document provides Detailed documentation for the Library Management System API endpoints.

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

The API uses JWT (JSON Web Token) based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Roles

- **ADMIN**: Full system access
- **LIBRARIAN**: Can manage books, borrowers, and borrowings
- **USER**: Limited read access

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": {
    // Additional error details (optional)
  }
}
```

## Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Borrowing operations**: 10 requests per 15 minutes
- **Export operations**: 5 requests per 15 minutes

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Register a new user in the system.

**Request Body:**

```json
{
  "username": "string (required, min: 3 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min: 6 chars)",
  "role": "string (optional, default: USER)" // USER, LIBRARIAN, ADMIN
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "amrsayed",
      "email": "amr@example.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-08-12T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Responses:**

- `400`: Missing required fields or invalid data
- `409`: User with email/username already exists

### Login

**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "amrsayed",
      "email": "amr@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses:**

- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account is inactive

### Get Profile

**GET** `/auth/profile`

Get current user's profile information.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "amrsayed",
      "email": "amr@example.com",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-08-12T10:00:00.000Z",
      "updatedAt": "2025-08-12T10:00:00.000Z"
    }
  }
}
```

### Update Profile

**PUT** `/auth/profile`

Update current user's profile information.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "username": "string (optional)",
  "email": "string (optional, valid email)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "newusername",
      "email": "newemail@example.com",
      "role": "USER",
      "updatedAt": "2025-08-12T10:30:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

### Change Password

**PUT** `/auth/change-password`

Change current user's password.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min: 6 chars)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Get All Users (Admin Only)

**GET** `/auth/users`

Get list of all users (Admin access required).

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `role`: Filter by role (USER, LIBRARIAN, ADMIN)
- `isActive`: Filter by active status (true/false)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "amrsayed",
        "email": "amr@example.com",
        "role": "USER",
        "isActive": true,
        "createdAt": "2025-08-12T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "itemsPerPage": 10
    }
  }
}
```

### Update User (Admin Only)

**PUT** `/auth/users/:id`

Update any user's information (Admin access required).

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Request Body:**

```json
{
  "username": "string (optional)",
  "email": "string (optional)",
  "role": "string (optional)",
  "isActive": "boolean (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "updatedusername",
      "email": "updated@example.com",
      "role": "LIBRARIAN",
      "isActive": true,
      "updatedAt": "2025-08-12T10:45:00.000Z"
    }
  },
  "message": "User updated successfully"
}
```

## Book Management Endpoints

### Add Book

**POST** `/books`

Add a new book to the library inventory.

**Request Body:**

```json
{
  "title": "string (required)",
  "author": "string (required)",
  "isbn": "string (required, unique)",
  "quantity": "number (optional, default: 1)",
  "location": "string (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "book": {
      "id": 1,
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "quantity": 3,
      "location": "Fiction-A1",
      "createdAt": "2025-08-12T10:00:00.000Z",
      "updatedAt": "2025-08-12T10:00:00.000Z"
    }
  },
  "message": "Book added successfully"
}
```

### Search Books

**GET** `/books`

Search and retrieve books with filtering options.

**Query Parameters:**

- `q`: Search query (searches title, author, ISBN)
- `title`: Filter by title
- `author`: Filter by author
- `isbn`: Filter by ISBN
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (title, author, createdAt)
- `sortOrder`: Sort order (asc, desc)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "978-0-7432-7356-5",
        "quantity": 3,
        "availableQuantity": 2,
        "location": "Fiction-A1",
        "createdAt": "2025-08-12T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

### Update Book

**PUT** `/books/:id`

Update book information.

**Request Body:**

```json
{
  "title": "string (optional)",
  "author": "string (optional)",
  "isbn": "string (optional)",
  "quantity": "number (optional)",
  "location": "string (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "book": {
      "id": 1,
      "title": "The Great Gatsby - Updated Edition",
      "author": "F. Scott Fitzgerald",
      "isbn": "978-0-7432-7356-5",
      "quantity": 5,
      "location": "Fiction-A1",
      "updatedAt": "2025-08-12T11:00:00.000Z"
    }
  },
  "message": "Book updated successfully"
}
```

### Delete Book

**DELETE** `/books/:id`

Remove a book from the inventory.

**Response (200):**

```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Cannot delete book",
  "message": "Book has active borrowings and cannot be deleted"
}
```

## Borrower Management Endpoints

### Register Borrower

**POST** `/borrowers`

Register a new borrower.

**Request Body:**

```json
{
  "name": "string (required)",
  "email": "string (required, unique, valid email)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "borrower": {
      "id": 1,
      "name": "amr Smith",
      "email": "amrsmith@example.com",
      "registeredAt": "2025-08-12T10:00:00.000Z"
    }
  },
  "message": "Borrower registered successfully"
}
```

### List Borrowers

**GET** `/borrowers`

Get list of all borrowers.

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search by name or email
- `sortBy`: Sort field (name, email, registeredAt)
- `sortOrder`: Sort order (asc, desc)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "borrowers": [
      {
        "id": 1,
        "name": "amr Smith",
        "email": "amrsmith@example.com",
        "registeredAt": "2025-08-12T10:00:00.000Z",
        "activeBorrowings": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### Get Borrower's Books

**GET** `/borrowers/:id/books`

Get all books currently borrowed by a specific borrower.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "borrower": {
      "id": 1,
      "name": "amr Smith",
      "email": "amrsmith@example.com"
    },
    "borrowings": [
      {
        "id": 1,
        "book": {
          "id": 1,
          "title": "The Great Gatsby",
          "author": "F. Scott Fitzgerald",
          "isbn": "978-0-7432-7356-5"
        },
        "checkoutDate": "2025-08-10T10:00:00.000Z",
        "dueDate": "2025-08-24T10:00:00.000Z",
        "status": "active",
        "daysUntilDue": 12
      }
    ]
  }
}
```

### Update Borrower

**PUT** `/borrowers/:id`

Update borrower information.

**Request Body:**

```json
{
  "name": "string (optional)",
  "email": "string (optional, valid email)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "borrower": {
      "id": 1,
      "name": "amr Smith Updated",
      "email": "amrsmith.updated@example.com",
      "updatedAt": "2025-08-12T11:00:00.000Z"
    }
  },
  "message": "Borrower updated successfully"
}
```

### Delete Borrower

**DELETE** `/borrowers/:id`

Remove a borrower from the system.

**Response (200):**

```json
{
  "success": true,
  "message": "Borrower deleted successfully"
}
```

## Borrowing Operations Endpoints

### Checkout Book

**POST** `/borrowings`

Check out a book to a borrower.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

**Request Body:**

```json
{
  "bookId": "number (required)",
  "borrowerId": "number (required)",
  "dueDate": "string (optional, ISO date)" // Defaults to 2 weeks from now
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "borrowing": {
      "id": 1,
      "bookId": 1,
      "borrowerId": 1,
      "checkoutDate": "2025-08-12T10:00:00.000Z",
      "dueDate": "2025-08-26T10:00:00.000Z",
      "book": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald"
      },
      "borrower": {
        "name": "amr Smith",
        "email": "amrsmith@example.com"
      }
    }
  },
  "message": "Book checked out successfully"
}
```

### Get All Borrowings

**GET** `/borrowings`

Get list of all borrowings with filtering options.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (active, returned, overdue)
- `borrowerId`: Filter by borrower ID
- `bookId`: Filter by book ID
- `fromDate`: Filter from date (ISO format)
- `toDate`: Filter to date (ISO format)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "borrowings": [
      {
        "id": 1,
        "book": {
          "id": 1,
          "title": "The Great Gatsby",
          "author": "F. Scott Fitzgerald"
        },
        "borrower": {
          "id": 1,
          "name": "amr Smith",
          "email": "amrsmith@example.com"
        },
        "checkoutDate": "2025-08-12T10:00:00.000Z",
        "dueDate": "2025-08-26T10:00:00.000Z",
        "returnDate": null,
        "status": "active",
        "daysUntilDue": 14
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalItems": 35,
      "itemsPerPage": 10
    }
  }
}
```

### Return Book

**PUT** `/borrowings/:id/return`

Return a borrowed book.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "borrowing": {
      "id": 1,
      "book": {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald"
      },
      "borrower": {
        "name": "amr Smith"
      },
      "checkoutDate": "2025-08-12T10:00:00.000Z",
      "dueDate": "2025-08-26T10:00:00.000Z",
      "returnDate": "2025-08-20T14:30:00.000Z",
      "status": "returned",
      "wasOverdue": false
    }
  },
  "message": "Book returned successfully"
}
```

### Get Overdue Books

**GET** `/borrowings/overdue`

Get list of all overdue borrowings.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "overdueBorrowings": [
      {
        "id": 2,
        "book": {
          "title": "To Kill a Mockingbird",
          "author": "Harper Lee"
        },
        "borrower": {
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "checkoutDate": "2025-07-20T10:00:00.000Z",
        "dueDate": "2025-08-03T10:00:00.000Z",
        "daysOverdue": 9
      }
    ],
    "summary": {
      "totalOverdue": 5,
      "totalFines": 25.5
    }
  }
}
```

## Reports Endpoints

### Get Borrowing Report

**GET** `/reports/borrowings`

Get Detailed borrowing statistics and analytics.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `fromDate`: Start date (ISO format)
- `toDate`: End date (ISO format)
- `groupBy`: Group results by (day, week, month)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalBorrowings": 150,
      "activeBorrowings": 45,
      "returnedBooks": 105,
      "overdueBooks": 8,
      "totalBorrowers": 75,
      "totalBooks": 200,
      "averageBorrowingDuration": 12.5
    },
    "trends": [
      {
        "period": "2025-08-01",
        "checkouts": 15,
        "returns": 12,
        "newBorrowers": 3
      }
    ],
    "popularBooks": [
      {
        "bookId": 1,
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "borrowCount": 25
      }
    ],
    "topBorrowers": [
      {
        "borrowerId": 1,
        "name": "amr Smith",
        "borrowCount": 8
      }
    ]
  }
}
```

### Export Borrowings CSV

**GET** `/exports/borrowings/csv`

Export borrowings data as CSV file.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

**Query Parameters:**

- `fromDate`: Start date (ISO format)
- `toDate`: End date (ISO format)
- `status`: Filter by status (active, returned, overdue)

**Response (200):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="borrowings_2025-08-12.csv"

ID,Book Title,Book Author,Borrower Name,Borrower Email,Checkout Date,Due Date,Return Date,Status
1,"The Great Gatsby","F. Scott Fitzgerald","amr Smith","amr@example.com","2025-08-12","2025-08-26","","active"
```

### Export Borrowings XLSX

**GET** `/exports/borrowings/xlsx`

Export borrowings data as Excel file.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

**Response (200):**

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="borrowings_2025-08-12.xlsx"

[Excel file content]
```

### Export Overdue Last Month CSV

**GET** `/exports/overdue/last-month/csv`

Export last month's overdue books as CSV.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

### Export All Borrowings Last Month CSV

**GET** `/exports/all-borrowings/last-month/csv`

Export all borrowings from last month as CSV.

**Headers:**

```
Authorization: Bearer <librarian-token>
```

## Error Codes

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 200         | Success                                 |
| 201         | Created                                 |
| 400         | Bad Request - Invalid input data        |
| 401         | Unauthorized - Invalid or missing token |
| 403         | Forbidden - Insufficient permissions    |
| 404         | Not Found - Resource doesn't exist      |
| 409         | Conflict - Resource already exists      |
| 422         | Unprocessable Entity - Validation error |
| 429         | Too Many Requests - Rate limit exceeded |
| 500         | Internal Server Error                   |

## Request/Response Examples

### Pagination Example

Most list endpoints support pagination:

**Request:**

```
GET /api/v1/books?page=2&limit=5&sortBy=title&sortOrder=asc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "books": [...],
    "pagination": {
      "currentPage": 2,
      "totalPages": 10,
      "totalItems": 47,
      "itemsPerPage": 5,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

### Validation Error Example

**Request:**

```json
{
  "email": "invalid-email",
  "password": "123"
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "email": "Must be a valid email address",
    "password": "Must be at least 6 characters long"
  }
}
```

## Webhook Events (Future Implementation)

The API is designed to support webhook events for real-time notifications:

- `book.checked_out`
- `book.returned`
- `book.overdue`
- `borrower.registered`
- `user.created`

## API Versioning

The API uses URL versioning (`/api/v1/`). Future versions will be available at:

- `/api/v2/` (planned)
- `/api/v3/` (future)

## SDKs and Client Libraries

Official client libraries are planned for:

- JavaScript/TypeScript
- Python
- Java
- C#

## Support

For API support and questions:

- Review this documentation
- Check the troubleshooting guide
- Submit issues via the repository issue tracker
