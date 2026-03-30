import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Define PORT
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});