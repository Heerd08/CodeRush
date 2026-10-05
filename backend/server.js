
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Home route
app.get("/", (req, res) => {
    res.json({
        message: "CodeRush backend is running! 🚀"
    });
});


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);

// Connect MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log("Connecting to primary MongoDB URI...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("✅ MongoDB connected successfully!");
    } catch (error) {
        console.warn("⚠️ Primary MongoDB connection failed:", error.message);
        console.log("Attempting fallback to local MongoDB instance (mongodb://127.0.0.1:27017/coderush)...");
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/coderush");
            console.log("✅ Local MongoDB fallback connected successfully!");
        } catch (localErr) {
            console.error("❌ Both primary and local MongoDB connections failed:");
            console.error(localErr.message);
            process.exit(1);
        }
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();