import rateLimit from "express-rate-limit";

export const exportRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: {
    error:
      "Too many export requests from this IP, please try again in 5 minutes.",
    details:
      "Export operations are resource-intensive. Please limit your requests.",
    retryAfter: "5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Export rate limit exceeded",
      message:
        "Too many export requests. Export operations are resource-intensive and limited to 3 requests per 5 minutes.",
      retryAfter: "5 minutes",
      suggestion:
        "Please wait before requesting another export, or contact admin for bulk export needs.",
    });
  },
});

export const borrowingRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    error:
      "Too many borrowing requests from this IP, please try again in 1 minute.",
    details:
      "Borrowing operations are limited to prevent abuse and ensure system stability.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Borrowing rate limit exceeded",
      message:
        "Too many borrowing requests. Please wait 1 minute before trying again.",
      retryAfter: "1 minute",
      suggestion:
        "If you need to process multiple borrowings, please contact library staff.",
    });
  },
});
