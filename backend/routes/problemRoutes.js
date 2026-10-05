const express = require("express");
const jwt = require("jsonwebtoken");
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// =========================
// CREATE PROBLEM
// ADMIN ONLY
// =========================
router.post(
    "/",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const {
                title,
                description,
                difficulty,
                inputFormat,
                outputFormat,
                constraints,
                sampleInput,
                sampleOutput,
                points,
                testCases
            } = req.body;

            if (
                !title ||
                !description ||
                !difficulty ||
                !inputFormat ||
                !outputFormat ||
                !constraints ||
                !sampleInput ||
                !sampleOutput
            ) {
                return res.status(400).json({
                    message: "Please fill all required problem fields"
                });
            }

            const problem = new Problem({
                title,
                description,
                difficulty,
                inputFormat,
                outputFormat,
                constraints,
                sampleInput,
                sampleOutput,
                points: points || 100,
                testCases: Array.isArray(testCases) ? testCases : [],
                createdBy: req.user.userId
            });

            await problem.save();

            res.status(201).json({
                message: "Problem created successfully!",
                problem
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// =========================
// GET ALL PROBLEMS
// =========================
router.get("/", async (req, res) => {
    try {
        const problems = await Problem.find()
            .populate("createdBy", "name email");

        res.json({
            problems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// =========================
// GET SINGLE PROBLEM
// =========================
router.get("/:id", async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .populate("createdBy", "name email");

        if (!problem) {
            return res.status(404).json({
                message: "Problem not found"
            });
        }

        // Check if admin is requesting to see hidden test cases
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(" ")[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && decoded.role === "admin") {
                    isAdmin = true;
                }
            } catch (e) {
                // not admin token
            }
        }

        const problemObj = problem.toObject();

        // If not admin, mask hidden test case content
        if (!isAdmin && problemObj.testCases) {
            problemObj.testCases = problemObj.testCases.map((tc, idx) => ({
                _id: tc._id,
                testCaseNumber: idx + 1,
                isHidden: tc.isHidden,
                input: tc.isHidden ? "[Hidden Test Case]" : tc.input,
                expectedOutput: tc.isHidden ? "[Hidden Test Case]" : tc.expectedOutput
            }));
        }

        res.json({
            problem: problemObj
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({
                message: "Problem not found"
            });
        }

        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// =========================
// DELETE PROBLEM
// ADMIN ONLY
// =========================
router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const problem = await Problem.findById(req.params.id);

            if (!problem) {
                return res.status(404).json({
                    message: "Problem not found"
                });
            }

            await Problem.findByIdAndDelete(req.params.id);

            res.json({
                message: "Problem deleted successfully!"
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// =========================
// EDIT PROBLEM
// ADMIN ONLY
// =========================
router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const {
                title,
                description,
                difficulty,
                inputFormat,
                outputFormat,
                constraints,
                sampleInput,
                sampleOutput,
                points,
                testCases
            } = req.body;

            const problem = await Problem.findById(req.params.id);
            if (!problem) {
                return res.status(404).json({
                    message: "Problem not found"
                });
            }

            if (title) problem.title = title;
            if (description) problem.description = description;
            if (difficulty) problem.difficulty = difficulty;
            if (inputFormat) problem.inputFormat = inputFormat;
            if (outputFormat) problem.outputFormat = outputFormat;
            if (constraints) problem.constraints = constraints;
            if (sampleInput) problem.sampleInput = sampleInput;
            if (sampleOutput) problem.sampleOutput = sampleOutput;
            if (points !== undefined) problem.points = points;
            if (testCases !== undefined && Array.isArray(testCases)) {
                problem.testCases = testCases;
            }

            await problem.save();

            res.json({
                message: "Problem updated successfully!",
                problem
            });
        } catch (error) {
            if (error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid problem ID format"
                });
            }
            console.error("Update problem error:", error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

module.exports = router;