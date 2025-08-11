import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// test
app.get("/", (req, res) => {
  res.json({ message: "LMS route test..." });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
