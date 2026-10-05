const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        startTime: {
            type: Date,
            required: true
        },

        endTime: {
            type: Date,
            required: true
        },

        duration: {
            type: Number,
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        problems: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem"
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Competition", competitionSchema);