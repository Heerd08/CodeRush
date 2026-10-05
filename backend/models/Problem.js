const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            required: true
        },

        inputFormat: {
            type: String,
            required: true
        },

        outputFormat: {
            type: String,
            required: true
        },

        constraints: {
            type: String,
            required: true
        },

        sampleInput: {
            type: String,
            required: true
        },

        sampleOutput: {
            type: String,
            required: true
        },

        points: {
            type: Number,
            required: true,
            default: 100
        },

        testCases: [
            {
                input: {
                    type: String,
                    default: ""
                },
                expectedOutput: {
                    type: String,
                    required: true
                },
                isHidden: {
                    type: Boolean,
                    default: false
                }
            }
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Problem", problemSchema);