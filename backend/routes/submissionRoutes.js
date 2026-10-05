const express = require("express");
const Submission = require("../models/Submission");
const Competition = require("../models/Competition");
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { executeCode, LANGUAGE_MAP } = require("../utils/executionService");

const router = express.Router();

// ========================================================
// 1. RUN CODE (Testing only - no score awarded)
// ========================================================
router.post("/run", authMiddleware, async (req, res) => {
    try {
        const { problemId, competitionId, language, customInput } = req.body;
        const code = req.body.sourceCode || req.body.code;

        if (!problemId || !competitionId || !language || !code) {
            return res.status(400).json({
                message: "problemId, competitionId, language, and code are required"
            });
        }

        if (!LANGUAGE_MAP[language]) {
            return res.status(400).json({
                message: `Unsupported language: ${language}. Allowed: python, cpp, java, javascript`
            });
        }

        // Verify competition
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        // Verify participation
        const isParticipant = competition.participants.some(
            (p) => p.toString() === req.user.userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                message: "You must join this competition before running code"
            });
        }

        // Verify timing
        const now = new Date();
        if (now < new Date(competition.startTime)) {
            return res.status(400).json({
                message: "Competition has not started yet"
            });
        }
        if (now > new Date(competition.endTime)) {
            return res.status(400).json({
                message: "Competition has ended"
            });
        }

        // Verify problem belongs to competition
        const hasProblem = competition.problems.some(
            (p) => p.toString() === problemId.toString()
        );
        if (!hasProblem) {
            return res.status(400).json({
                message: "Problem is not part of this competition"
            });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // Input to run with (customInput takes priority, then problem.sampleInput)
        const stdinToUse = customInput !== undefined ? customInput : (problem.sampleInput || "");

        // Execute in sandbox
        const execResult = await executeCode(language, code, stdinToUse);

        res.json({
            output: execResult.stdout,
            error: execResult.stderr || execResult.compile_output || "",
            stdout: execResult.stdout,
            stderr: execResult.stderr,
            compile_output: execResult.compile_output,
            status: execResult.status,
            executionTime: execResult.time,
            memory: execResult.memory,
            inputUsed: stdinToUse
        });
    } catch (error) {
        console.error("Run Code error:", error);
        res.status(500).json({
            message: error.message || "Failed to execute code in sandbox"
        });
    }
});

// ========================================================
// 2. SUBMIT CODE (Graded against problem test cases)
// ========================================================
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { problemId, competitionId, language } = req.body;
        const code = req.body.sourceCode || req.body.code;

        if (!problemId || !competitionId || !language || !code) {
            return res.status(400).json({
                message: "problemId, competitionId, language, and code are required"
            });
        }

        if (!LANGUAGE_MAP[language]) {
            return res.status(400).json({
                message: `Unsupported language: ${language}. Allowed: python, cpp, java, javascript`
            });
        }

        // Verify competition
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competition not found" });
        }

        // Verify participation
        const isParticipant = competition.participants.some(
            (p) => p.toString() === req.user.userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                message: "You must join this competition before submitting code"
            });
        }

        // Enforce Competition Timing on Backend
        const now = new Date();
        if (now < new Date(competition.startTime)) {
            return res.status(400).json({
                message: "Competition has not started yet. Submissions are not open."
            });
        }
        if (now > new Date(competition.endTime)) {
            return res.status(400).json({
                message: "Competition has ended. Submissions are closed."
            });
        }

        // Verify problem belongs to competition
        const hasProblem = competition.problems.some(
            (p) => p.toString() === problemId.toString()
        );
        if (!hasProblem) {
            return res.status(400).json({
                message: "Problem is not part of this competition"
            });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // Determine test cases to evaluate against
        let testCases = [];
        if (problem.testCases && problem.testCases.length > 0) {
            testCases = problem.testCases;
        } else {
            // Backward compatibility fallback to sampleInput/sampleOutput
            testCases = [
                {
                    input: problem.sampleInput || "",
                    expectedOutput: problem.sampleOutput || "",
                    isHidden: false
                }
            ];
        }

        const totalTestCases = testCases.length;
        let passedCount = 0;
        let compilationErrorOccurred = false;
        let firstCompileError = "";
        let maxExecutionTime = 0;
        let maxMemory = 0;
        const testCaseResults = [];

        // Evaluate against all test cases
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const testNum = i + 1;

            try {
                const execResult = await executeCode(language, code, tc.input || "");

                // Check compile error
                if (execResult.isCompileError || execResult.compile_output) {
                    compilationErrorOccurred = true;
                    firstCompileError = execResult.compile_output || execResult.stderr || "Compilation failed";
                    testCaseResults.push({
                        testCaseNumber: testNum,
                        passed: false,
                        isHidden: tc.isHidden || false,
                        input: tc.isHidden ? "[Hidden]" : tc.input,
                        expectedOutput: tc.isHidden ? "[Hidden]" : tc.expectedOutput,
                        actualOutput: "[Compilation Error]",
                        status: "Compilation Error",
                        executionTime: execResult.time,
                        errorMessage: firstCompileError
                    });
                    break; // Stop further execution if code doesn't compile
                }

                // Check output matching
                const actual = (execResult.stdout || "").replace(/\r\n/g, "\n").trim();
                const expected = (tc.expectedOutput || "").replace(/\r\n/g, "\n").trim();
                const isPassed = actual === expected && !execResult.stderr && !execResult.isRuntimeError && !execResult.isTimeLimit;

                let tcStatus = "Wrong Answer";
                if (isPassed) {
                    tcStatus = "Passed";
                    passedCount++;
                } else if (execResult.isTimeLimit) {
                    tcStatus = "Time Limit Exceeded";
                } else if (execResult.isRuntimeError || execResult.stderr) {
                    tcStatus = "Runtime Error";
                }

                const execSeconds = parseFloat(execResult.time) || 0;
                if (execSeconds > maxExecutionTime) maxExecutionTime = execSeconds;

                const memKb = parseFloat(execResult.memory) || 0;
                if (memKb > maxMemory) maxMemory = memKb;

                testCaseResults.push({
                    testCaseNumber: testNum,
                    passed: isPassed,
                    isHidden: tc.isHidden || false,
                    input: tc.isHidden ? "[Hidden]" : tc.input,
                    expectedOutput: tc.isHidden ? "[Hidden]" : tc.expectedOutput,
                    actualOutput: tc.isHidden ? (isPassed ? "[Hidden - Passed]" : "[Hidden - Failed]") : actual,
                    status: tcStatus,
                    executionTime: execResult.time,
                    errorMessage: execResult.stderr || ""
                });
            } catch (tcErr) {
                testCaseResults.push({
                    testCaseNumber: testNum,
                    passed: false,
                    isHidden: tc.isHidden || false,
                    input: tc.isHidden ? "[Hidden]" : tc.input,
                    expectedOutput: tc.isHidden ? "[Hidden]" : tc.expectedOutput,
                    actualOutput: "[Error]",
                    status: "Runtime Error",
                    executionTime: "0.0s",
                    errorMessage: tcErr.message
                });
            }
        }

        // Determine overall submission status and score
        let overallStatus = "Wrong Answer";
        let score = 0;
        const totalPoints = problem.points || 100;

        if (compilationErrorOccurred) {
            overallStatus = "Compilation Error";
            score = 0;
        } else if (passedCount === totalTestCases) {
            overallStatus = "Accepted";
            score = totalPoints;
        } else if (passedCount > 0) {
            overallStatus = "Wrong Answer";
            score = Math.round((passedCount / totalTestCases) * totalPoints);
        } else {
            // Check if any was Runtime Error or Time Limit
            const hasRuntime = testCaseResults.some((t) => t.status === "Runtime Error");
            const hasTLE = testCaseResults.some((t) => t.status === "Time Limit Exceeded");
            if (hasTLE) overallStatus = "Time Limit Exceeded";
            else if (hasRuntime) overallStatus = "Runtime Error";
            else overallStatus = "Wrong Answer";
            score = 0;
        }

        // Save submission
        const submission = new Submission({
            user: req.user.userId,
            competition: competitionId,
            problem: problemId,
            code,
            sourceCode: code,
            language,
            status: overallStatus,
            score,
            passedTestCases: passedCount,
            totalTestCases,
            executionTime: `${maxExecutionTime.toFixed(3)}s`,
            memory: `${maxMemory.toFixed(0)} KB`,
            compileOutput: firstCompileError,
            testCaseResults,
            evaluationMessage:
                overallStatus === "Accepted"
                    ? `All ${totalTestCases} test cases passed successfully!`
                    : `Passed ${passedCount} of ${totalTestCases} test cases.`
        });

        await submission.save();

        const populated = await Submission.findById(submission._id)
            .populate("problem", "title difficulty points")
            .populate("competition", "title");

        res.status(201).json({
            message: `Evaluation completed: ${overallStatus}`,
            submission: populated
        });
    } catch (error) {
        console.error("Submit Code error:", error);
        res.status(500).json({
            message: error.message || "Failed to process submission"
        });
    }
});

// ========================================================
// 3. GET MY SUBMISSIONS (Student)
// ========================================================
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const { competitionId, problemId } = req.query;
        const filter = { user: req.user.userId };

        if (competitionId) filter.competition = competitionId;
        if (problemId) filter.problem = problemId;

        const submissions = await Submission.find(filter)
            .populate("problem", "title difficulty points")
            .populate("competition", "title")
            .sort({ createdAt: -1 });

        res.json({
            submissions
        });
    } catch (error) {
        console.error("Get my submissions error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ========================================================
// 4. GET ALL SUBMISSIONS (Admin only)
// ========================================================
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { competitionId } = req.query;
        const filter = {};
        if (competitionId) filter.competition = competitionId;

        const submissions = await Submission.find(filter)
            .populate("user", "name email college studentId")
            .populate("problem", "title difficulty points")
            .populate("competition", "title")
            .sort({ createdAt: -1 })
            .limit(150);

        res.json({
            submissions
        });
    } catch (error) {
        console.error("Admin get submissions error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ========================================================
// 5. GET SINGLE SUBMISSION (Auth: Owner or Admin)
// ========================================================
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id)
            .populate("user", "name email college studentId")
            .populate("problem", "title difficulty points")
            .populate("competition", "title");

        if (!submission) {
            return res.status(404).json({ message: "Submission not found" });
        }

        if (
            submission.user._id.toString() !== req.user.userId &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({
            submission
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
