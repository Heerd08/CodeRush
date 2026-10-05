const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Problem = require("./models/Problem");
const Competition = require("./models/Competition");

async function seed() {
    try {
        console.log("Connecting to database for seeding...");
        try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
            console.log("Connected to Atlas.");
        } catch (e) {
            console.log("Falling back to local Mongo at mongodb://127.0.0.1:27017/coderush...");
            await mongoose.connect("mongodb://127.0.0.1:27017/coderush");
        }

        console.log("Connected successfully. Seeding initial accounts & test problem...");

        // 1. Admin user
        let admin = await User.findOne({ email: "admin@coderush.com" });
        if (!admin) {
            const adminPass = await bcrypt.hash("admin123", 10);
            admin = await User.create({
                name: "Admin Moderator",
                email: "admin@coderush.com",
                college: "CodeRush HQ",
                studentId: "CR-ADM-01",
                password: adminPass,
                role: "admin"
            });
            console.log("✅ Admin user created: admin@coderush.com / admin123");
        }

        // 2. Student user
        let student = await User.findOne({ email: "student@coderush.com" });
        if (!student) {
            const studentPass = await bcrypt.hash("student123", 10);
            student = await User.create({
                name: "Alex Rivera",
                email: "student@coderush.com",
                college: "MIT College of Engineering",
                studentId: "CR-STU-2026",
                password: studentPass,
                role: "student"
            });
            console.log("✅ Student user created: student@coderush.com / student123");
        }

        // 3. Official Test Problem: "Check Positive or Negative"
        let testProblem = await Problem.findOne({ title: "Check Positive or Negative" });
        if (!testProblem) {
            testProblem = await Problem.create({
                title: "Check Positive or Negative",
                difficulty: "Easy",
                points: 50,
                description: "Write a program that takes an integer and checks whether the number is positive, negative, or zero.",
                inputFormat: "The input contains a single integer N.",
                outputFormat: 'Print "Positive" if N is greater than 0, "Negative" if N is less than 0, and "Zero" if N equals 0.',
                constraints: "-100000 <= N <= 100000",
                sampleInput: "5",
                sampleOutput: "Positive",
                testCases: [
                    {
                        input: "5",
                        expectedOutput: "Positive",
                        isHidden: false
                    },
                    {
                        input: "-3",
                        expectedOutput: "Negative",
                        isHidden: false
                    },
                    {
                        input: "10",
                        expectedOutput: "Positive",
                        isHidden: false
                    },
                    {
                        input: "0",
                        expectedOutput: "Zero",
                        isHidden: true
                    },
                    {
                        input: "-100",
                        expectedOutput: "Negative",
                        isHidden: true
                    }
                ],
                createdBy: admin._id
            });
            console.log("✅ Created requested problem: Check Positive or Negative");
        }

        // 4. Second Problem: "Check Even or Odd"
        let problemEvenOdd = await Problem.findOne({ title: "Check Even or Odd" });
        if (!problemEvenOdd) {
            problemEvenOdd = await Problem.create({
                title: "Check Even or Odd",
                difficulty: "Easy",
                points: 50,
                description: "Write a program that takes an integer N and determines whether it is Even or Odd.",
                inputFormat: "The input contains a single integer N.",
                outputFormat: 'Print "Even" if N is an even number, or "Odd" if N is an odd number.',
                constraints: "-1000000 <= N <= 1000000",
                sampleInput: "4",
                sampleOutput: "Even",
                testCases: [
                    {
                        input: "4",
                        expectedOutput: "Even",
                        isHidden: false
                    },
                    {
                        input: "7",
                        expectedOutput: "Odd",
                        isHidden: false
                    },
                    {
                        input: "0",
                        expectedOutput: "Even",
                        isHidden: true
                    },
                    {
                        input: "-9",
                        expectedOutput: "Odd",
                        isHidden: true
                    }
                ],
                createdBy: admin._id
            });
            console.log("✅ Created problem: Check Even or Odd");
        }

        // 5. Third Problem: "Add Two Numbers"
        let problemAddTwo = await Problem.findOne({ title: "Add Two Numbers" });
        if (!problemAddTwo) {
            problemAddTwo = await Problem.create({
                title: "Add Two Numbers",
                difficulty: "Easy",
                points: 50,
                description: "Write a program that takes two integers from standard input and prints their sum.",
                inputFormat: "The input contains two space-separated integers A and B.",
                outputFormat: "Print the sum of A and B.",
                constraints: "-100000 <= A, B <= 100000",
                sampleInput: "2 3",
                sampleOutput: "5",
                testCases: [
                    {
                        input: "2 3",
                        expectedOutput: "5",
                        isHidden: false
                    },
                    {
                        input: "10 20",
                        expectedOutput: "30",
                        isHidden: false
                    },
                    {
                        input: "-5 5",
                        expectedOutput: "0",
                        isHidden: true
                    },
                    {
                        input: "100 -50",
                        expectedOutput: "50",
                        isHidden: true
                    }
                ],
                createdBy: admin._id
            });
            console.log("✅ Created problem: Add Two Numbers");
        }

        // 6. Competitions
        const now = new Date();

        // LIVE Requested Competition: "CodeRush Beginner Challenge"
        let beginnerComp = await Competition.findOne({ title: "CodeRush Beginner Challenge" });
        if (!beginnerComp) {
            const start = new Date(now.getTime() - 20 * 60 * 1000); // 20 mins ago
            const end = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
            beginnerComp = await Competition.create({
                title: "CodeRush Beginner Challenge",
                description: "A beginner-friendly coding competition for college students.",
                startTime: start,
                endTime: end,
                duration: 60,
                createdBy: admin._id,
                problems: [testProblem._id, problemAddTwo._id, problemEvenOdd._id],
                participants: []
            });
            console.log("✅ Created LIVE competition: CodeRush Beginner Challenge");
        } else {
            // Ensure problems are assigned
            const currentProbIds = (beginnerComp.problems || []).map(p => p.toString());
            const neededProbIds = [testProblem._id.toString(), problemAddTwo._id.toString(), problemEvenOdd._id.toString()];
            const missing = neededProbIds.filter(id => !currentProbIds.includes(id));
            if (missing.length > 0) {
                beginnerComp.problems.push(...missing);
                await beginnerComp.save();
                console.log("✅ Updated CodeRush Beginner Challenge with all 3 problems");
            }
        }

        // LIVE Competition
        let liveComp = await Competition.findOne({ title: "CodeRush Grand Prix 2026" });
        if (!liveComp) {
            const start = new Date(now.getTime() - 30 * 60 * 1000); // 30 mins ago
            const end = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
            liveComp = await Competition.create({
                title: "CodeRush Grand Prix 2026",
                description: "The official competitive coding arena! Solve algorithmic challenges, execute in the sandbox, submit your verified code, and rise on the live leaderboard.",
                startTime: start,
                endTime: end,
                duration: 90,
                createdBy: admin._id,
                problems: [testProblem._id, problemEvenOdd._id],
                participants: []
            });
            console.log("✅ Created LIVE competition: CodeRush Grand Prix 2026");
        }

        // UPCOMING Competition
        let upcomingComp = await Competition.findOne({ title: "CodeRush NextGen Championship" });
        if (!upcomingComp) {
            const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
            const end = new Date(now.getTime() + 28 * 60 * 60 * 1000);
            upcomingComp = await Competition.create({
                title: "CodeRush NextGen Championship",
                description: "Upcoming inter-collegiate championship featuring data structure puzzles and speed programming challenges.",
                startTime: start,
                endTime: end,
                duration: 120,
                createdBy: admin._id,
                problems: [testProblem._id],
                participants: []
            });
            console.log("✅ Created UPCOMING competition: CodeRush NextGen Championship");
        }

        // COMPLETED Competition
        let completedComp = await Competition.findOne({ title: "CodeRush Alpha Warmup" });
        if (!completedComp) {
            const start = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
            const end = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            completedComp = await Competition.create({
                title: "CodeRush Alpha Warmup",
                description: "Archived introductory speed contest. Submissions are closed and final rankings are posted.",
                startTime: start,
                endTime: end,
                duration: 60,
                createdBy: admin._id,
                problems: [problemEvenOdd._id],
                participants: []
            });
            console.log("✅ Created COMPLETED competition: CodeRush Alpha Warmup");
        }

        console.log("🌟 Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
