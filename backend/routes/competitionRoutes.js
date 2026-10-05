const express = require("express");
const Competition = require("../models/Competition");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


// =========================
// CREATE COMPETITION
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
            startTime,
            endTime,
            duration
        } = req.body;

        if (
            !title ||
            !description ||
            !startTime ||
            !endTime ||
            !duration
        ) {
            return res.status(400).json({
                message: "Please fill all competition fields"
            });
        }

        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        if (Number(duration) <= 0) {
            return res.status(400).json({
                message: "Duration must be a positive number of minutes"
            });
        }

        const competition = new Competition({
            title,
            description,
            startTime,
            endTime,
            duration,
            createdBy: req.user.userId
        });

        await competition.save();

        res.status(201).json({
            message: "Competition created successfully!",
            competition
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// GET ALL COMPETITIONS
// =========================

router.get("/", async (req, res) => {
    try {

        const competitions = await Competition.find()
            .populate("createdBy", "name email")
            .sort({ startTime: 1 });

        res.json({
            competitions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// GET USER JOINED COMPETITIONS
// =========================
router.get("/user/joined", authMiddleware, async (req, res) => {
    try {
        const competitions = await Competition.find({
            participants: req.user.userId
        })
            .populate("createdBy", "name email")
            .populate("problems")
            .sort({ startTime: 1 });

        res.json({
            competitions
        });
    } catch (error) {
        console.error("Get joined competitions error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// GET SINGLE COMPETITION
// =========================
router.get("/:id", async (req, res) => {
    try {

        const competition = await Competition.findById(
            req.params.id
        )
            .populate("createdBy", "name email")
            .populate("problems");

        if (!competition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        res.json({
            competition
        });

    } catch (error) {

        if (error.name === "CastError") {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// JOIN COMPETITION
// =========================

router.post("/:id/join", authMiddleware, async (req, res) => {
    try {

        const competition = await Competition.findById(
            req.params.id
        );

        if (!competition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        // Check if already joined
        if (
            competition.participants.includes(
                req.user.userId
            )
        ) {
            return res.status(400).json({
                message: "You have already joined this competition"
            });
        }

        competition.participants.push(req.user.userId);

        await competition.save();

        res.json({
            message: "Successfully joined the competition!",
            competition
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// =========================
// DELETE COMPETITION
// =========================

router.delete(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
            try {

        const competition = await Competition.findById(
            req.params.id
        );

        if (!competition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        await Competition.findByIdAndDelete(req.params.id);

        res.json({
            message: "Competition deleted successfully!"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});
// Add a problem to a competition
router.post(
    "/:competitionId/problems/:problemId",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { competitionId, problemId } = req.params;

            const competition = await Competition.findById(competitionId);

            if (!competition) {
                return res.status(404).json({
                    message: "Competition not found"
                });
            }

            const problem = await Problem.findById(problemId);

            if (!problem) {
                return res.status(404).json({
                    message: "Problem not found"
                });
            }

            // Check if problem is already added
            const isAlreadyAdded = competition.problems.some(
                (p) => p.toString() === problemId.toString()
            );

            if (isAlreadyAdded) {
                return res.status(400).json({
                    message: "Problem already added to this competition"
                });
            }

            competition.problems.push(problemId);

            await competition.save();

            res.json({
                message: "Problem added to competition successfully!",
                competition
            });
        } catch (error) {
            if (error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid ID format"
                });
            }

            console.error(error);

            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// =========================
// REMOVE PROBLEM FROM COMPETITION (Admin)
// =========================
router.delete(
    "/:competitionId/problems/:problemId",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { competitionId, problemId } = req.params;

            const competition = await Competition.findById(competitionId);
            if (!competition) {
                return res.status(404).json({
                    message: "Competition not found"
                });
            }

            competition.problems = competition.problems.filter(
                (p) => p.toString() !== problemId.toString()
            );

            await competition.save();

            res.json({
                message: "Problem removed from competition successfully!",
                competition
            });
        } catch (error) {
            if (error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid ID format"
                });
            }
            console.error("Remove problem error:", error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// =========================
// EDIT COMPETITION (Admin)
// =========================
router.put(
    "/:id",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const { title, description, startTime, endTime, duration } = req.body;

            const competition = await Competition.findById(req.params.id);
            if (!competition) {
                return res.status(404).json({
                    message: "Competition not found"
                });
            }

            if (title) competition.title = title;
            if (description) competition.description = description;
            if (startTime) competition.startTime = startTime;
            if (endTime) competition.endTime = endTime;
            if (duration) competition.duration = duration;

            await competition.save();

            res.json({
                message: "Competition updated successfully!",
                competition
            });
        } catch (error) {
            if (error.name === "CastError") {
                return res.status(400).json({
                    message: "Invalid competition ID format"
                });
            }
            console.error("Update competition error:", error);
            res.status(500).json({
                message: "Server error"
            });
        }
    }
);

// =========================
// GET COMPETITION PARTICIPANTS
// =========================
router.get("/:id/participants", authMiddleware, async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate("participants", "name email college studentId");

        if (!competition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        res.json({
            competitionTitle: competition.title,
            participants: competition.participants || []
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({
                message: "Competition not found"
            });
        }
        console.error("Get participants error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// =========================
// GET COMPETITION LEADERBOARD
// =========================
router.get("/:id/leaderboard", async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate("participants", "name email college studentId");

        if (!competition) {
            return res.status(404).json({
                message: "Competition not found"
            });
        }

        // Fetch submissions for this competition
        const submissions = await Submission.find({ competition: req.params.id })
            .populate("user", "name email college studentId")
            .populate("problem", "points");

        // Calculate participant rankings using best-score per problem rule
        const userMap = {};

        // Initialize all joined participants with 0 score
        (competition.participants || []).forEach((p) => {
            userMap[p._id.toString()] = {
                userId: p._id,
                name: p.name,
                email: p.email,
                college: p.college,
                studentId: p.studentId,
                totalScore: 0,
                submissionsCount: 0,
                solvedProblemsCount: 0,
                problemScores: {},
                problemSolved: {},
                lastSubmissionTime: null
            };
        });

        // Tally submissions
        submissions.forEach((sub) => {
            if (!sub.user) return;
            const uId = sub.user._id.toString();
            if (!userMap[uId]) {
                userMap[uId] = {
                    userId: sub.user._id,
                    name: sub.user.name,
                    email: sub.user.email,
                    college: sub.user.college,
                    studentId: sub.user.studentId,
                    totalScore: 0,
                    submissionsCount: 0,
                    solvedProblemsCount: 0,
                    problemScores: {},
                    problemSolved: {},
                    lastSubmissionTime: null
                };
            }

            userMap[uId].submissionsCount += 1;

            const probId = sub.problem?._id ? sub.problem._id.toString() : (sub.problem ? sub.problem.toString() : null);
            if (probId) {
                const currentBest = userMap[uId].problemScores[probId] || 0;
                const thisScore = sub.score || 0;
                if (thisScore > currentBest) {
                    userMap[uId].problemScores[probId] = thisScore;
                }

                if (sub.status === "Accepted") {
                    userMap[uId].problemSolved[probId] = true;
                }
            }

            if (
                !userMap[uId].lastSubmissionTime ||
                new Date(sub.createdAt) > new Date(userMap[uId].lastSubmissionTime)
            ) {
                userMap[uId].lastSubmissionTime = sub.createdAt;
            }
        });

        // Sum best scores across distinct problems
        Object.values(userMap).forEach((userEntry) => {
            userEntry.totalScore = Object.values(userEntry.problemScores).reduce((a, b) => a + b, 0);
            userEntry.solvedProblemsCount = Object.keys(userEntry.problemSolved).length;
            delete userEntry.problemScores;
            delete userEntry.problemSolved;
        });

        const leaderboard = Object.values(userMap).sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            if (b.solvedProblemsCount !== a.solvedProblemsCount) {
                return b.solvedProblemsCount - a.solvedProblemsCount;
            }
            if (a.lastSubmissionTime && b.lastSubmissionTime) {
                return new Date(a.lastSubmissionTime) - new Date(b.lastSubmissionTime);
            }
            return 0;
        }).map((entry, index) => ({
            rank: index + 1,
            ...entry
        }));

        res.json({
            competition: {
                _id: competition._id,
                title: competition.title
            },
            competitionTitle: competition.title,
            scoringRule: "Total score is the sum of your highest score on each distinct problem. Full credit requires passing all test cases. Ties broken by earliest last submission.",
            leaderboard
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({
                message: "Competition not found"
            });
        }
        console.error("Leaderboard error:", error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

module.exports = router;