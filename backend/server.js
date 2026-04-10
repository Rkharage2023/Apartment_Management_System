import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import societyRoutes from "./routes/societyRoutes.js";
import flatRoutes from "./routes/flatRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import wasteRoutes from "./routes/wasteRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Error Middleware
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Vercel URL added after deploy
];

app.use(
  cors({
    origin: "*",
    credentials: false,
  }),
);
app.options("*", cors());

// Security & Parsing
app.use(helmet());
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "API Running ✅" });
});

// All Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/societies", societyRoutes);
app.use("/api/v1/flats", flatRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/notices", noticeRoutes);
app.use("/api/v1/visitors", visitorRoutes);
app.use("/api/v1/parking", parkingRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/waste", wasteRoutes);
app.use("/api/v1/users", userRoutes);

// Error Middleware — must be LAST
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
