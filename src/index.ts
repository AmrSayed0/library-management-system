import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

import bookRoutes from "./features/book/book.routes";
import borrowerRoutes from "./features/borrower/borrower.routes";
import borrowingRoutes from "./features/borrowing/borrowing.routes";

dotenv.config({ override: true });
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

/* ROUTES */
app.use("/api/v1", bookRoutes);
app.use("/api/v1", borrowerRoutes);
app.use("/api/v1", borrowingRoutes);

const port = Number(process.env.PORT) || 3002;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
