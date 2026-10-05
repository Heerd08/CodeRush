const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        competition: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition",
            required: true
        },
        problem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
            required: true
        },
        code: {
            type: String,
            required: true
        },
        sourceCode: {
            type: String
        },
        language: {
            type: String,
            required: true,
            enum: ["cpp", "python", "java", "javascript"]
        },
        status: {
            type: String,
            enum: [
                "Accepted",
                "Wrong Answer",
                "Time Limit Exceeded",
                "Runtime Error",
                "Compilation Error",
                "Pending"
            ],
            default: "Pending"
        },
        score: {
            type: Number,
            default: 0
        },
        passedTestCases: {
            type: Number,
            default: 0
        },
        totalTestCases: {
            type: Number,
            default: 0
        },
        executionTime: {
            type: String,
            default: "0.0s"
        },
        memory: {
            type: String,
            default: "0 KB"
        },
        compileOutput: {
            type: String,
            default: ""
        },
        testCaseResults: [
            {
                testCaseNumber: Number,
                passed: Boolean,
                isHidden: Boolean,
                input: String,
                expectedOutput: String,
                actualOutput: String,
                status: String,
                executionTime: String,
                errorMessage: String
            }
        ],
        evaluationMessage: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Submission", submissionSchema);
