const express = require("express");
const Competition = require("../models/Competition");
const Problem = require("../models/Problem");
const User = require("../models/User");
const Submission = require("../models/Submission");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =========================
// ADMIN STATS OVERVIEW
// =========================
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [
            competitionsCount,
            problemsCount,
            studentsCount,
            submissionsCount
        ] = await Promise.all([
            Competition.countDocuments(),
            Problem.countDocuments(),
            User.countDocuments({ role: "student" }),
            Submission.countDocuments()
        ]);

        res.json({
            stats: {
                competitionsCount,
                problemsCount,
                studentsCount,
                submissionsCount
            }
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({
            message: "Failed to fetch admin stats"
        });
    }
});

module.exports = router;
