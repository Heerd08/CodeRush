async function runComprehensiveVerification() {
    const baseUrl = "http://localhost:5000/api";
    console.log("==================================================");
    console.log("🚀 STARTING CODERUSH FULL END-TO-END VERIFICATION");
    console.log("==================================================");

    const testTimestamp = Date.now();
    const studentEmail = `student_${testTimestamp}@testcoderush.com`;
    const studentPass = "StudentPass123!";

    // 1. REGISTER NEW STUDENT
    console.log("\n[1] Testing Student Registration...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Test Competitor",
            email: studentEmail,
            college: "Delhi Technological University",
            studentId: `DTU-${testTimestamp.toString().slice(-4)}`,
            password: studentPass
        })
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error("Registration failed: " + JSON.stringify(regData));
    console.log("✅ Student registered:", regData.user.name, "| Email:", regData.user.email);

    // 2. STUDENT LOGIN
    console.log("\n[2] Testing Student Login...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: studentEmail, password: studentPass })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error("Student login failed: " + JSON.stringify(loginData));
    const token = loginData.token;
    console.log("✅ Student logged in successfully. Role:", loginData.user.role);

    // 3. FETCH COMPETITIONS (DASHBOARD)
    console.log("\n[3] Fetching Competitions from Dashboard...");
    const compRes = await fetch(`${baseUrl}/competitions`);
    const compData = await compRes.json();
    const liveComp = compData.competitions.find((c) => c.title === "CodeRush Beginner Challenge")
        || compData.competitions.find((c) => c.title.includes("Beginner") || c.title.includes("Grand Prix"));
    if (!liveComp) throw new Error("Target live competition not found!");
    console.log("✅ Found LIVE competition:", liveComp.title, "| Duration:", liveComp.duration, "mins");

    // 4. JOIN COMPETITION
    console.log("\n[4] Student Joins Competition...");
    const joinRes = await fetch(`${baseUrl}/competitions/${liveComp._id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
    });
    const joinData = await joinRes.json();
    if (!joinRes.ok && !joinData.message?.includes("already joined")) {
        throw new Error("Join competition failed: " + JSON.stringify(joinData));
    }
    console.log("✅ Join response:", joinData.message);

    // 5. FETCH SINGLE COMPETITION & PROBLEM
    console.log("\n[5] Fetching Competition Arena Details & Target Problem...");
    const arenaRes = await fetch(`${baseUrl}/competitions/${liveComp._id}`);
    const arenaData = await arenaRes.json();
    const testProblem = arenaData.competition.problems.find(
        (p) => p.title === "Check Positive or Negative"
    );
    if (!testProblem) throw new Error("Problem 'Check Positive or Negative' not found in competition!");
    console.log("✅ Found problem in arena:", testProblem.title, "| Points:", testProblem.points);

    // 6. RUN CODE IN SANDBOX
    console.log("\n[6] Testing Run Code (Python solution)...");
    const pythonSolution = `n = int(input())
if n > 0:
    print("Positive")
elif n < 0:
    print("Negative")
else:
    print("Zero")`;

    const runRes = await fetch(`${baseUrl}/submissions/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            problemId: testProblem._id,
            competitionId: liveComp._id,
            language: "python",
            code: pythonSolution,
            customInput: "5"
        })
    });
    const runData = await runRes.json();
    if (!runRes.ok) throw new Error("Run Code failed: " + JSON.stringify(runData));
    console.log("✅ Run Code Result:", {
        status: runData.status,
        output: runData.output?.trim(),
        executionTime: runData.executionTime
    });
    if (runData.output?.trim() !== "Positive") {
        throw new Error(`Expected output 'Positive' but got '${runData.output}'`);
    }

    // 7. SUBMIT CODE FOR OFFICIAL EVALUATION
    console.log("\n[7] Submitting Code for Official Evaluation...");
    const submitRes = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            problemId: testProblem._id,
            competitionId: liveComp._id,
            language: "python",
            code: pythonSolution
        })
    });
    const submitData = await submitRes.json();
    if (!submitRes.ok) throw new Error("Submission failed: " + JSON.stringify(submitData));
    const sub = submitData.submission;
    console.log("✅ Official Evaluation Result:", {
        verdict: sub.status,
        score: `${sub.score} / ${testProblem.points || 50}`,
        passedTestCases: `${sub.passedTestCases} / ${sub.totalTestCases}`,
        executionTime: sub.executionTime
    });

    if (sub.status !== "Accepted") {
        throw new Error(`Expected status 'Accepted' but got '${sub.status}'`);
    }
    if (sub.score !== 50) {
        throw new Error(`Expected score 50 but got ${sub.score}`);
    }

    // 8. VERIFY MY SUBMISSIONS
    console.log("\n[8] Checking 'My Submissions' for Current Student...");
    const mySubRes = await fetch(`${baseUrl}/submissions/my?problemId=${testProblem._id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const mySubData = await mySubRes.json();
    if (!mySubRes.ok) throw new Error("Fetch my submissions failed");
    console.log("✅ Submissions found:", mySubData.submissions.length);
    console.log("Latest submission verified:", {
        problem: mySubData.submissions[0].problem?.title,
        status: mySubData.submissions[0].status,
        score: mySubData.submissions[0].score,
        codeSnippet: mySubData.submissions[0].code.slice(0, 30) + "..."
    });

    // 9. VERIFY LEADERBOARD UPDATES
    console.log("\n[9] Checking Real-time Competition Leaderboard...");
    const lbRes = await fetch(`${baseUrl}/competitions/${liveComp._id}/leaderboard`);
    const lbData = await lbRes.json();
    if (!lbRes.ok) throw new Error("Fetch leaderboard failed");
    const myRank = lbData.leaderboard.find((entry) => entry.email === studentEmail);
    if (!myRank) throw new Error("Student did not appear in competition leaderboard!");
    console.log("✅ Student appears in leaderboard:", {
        rank: myRank.rank,
        name: myRank.name,
        score: myRank.totalScore,
        solvedProblems: myRank.solvedProblemsCount
    });

    // 10. SECURITY: STUDENT CANNOT ACCESS ADMIN ROUTES
    console.log("\n[10] Testing Security: Student Blocked from Admin Endpoints...");
    const adminCheckRes = await fetch(`${baseUrl}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Admin endpoint status for student:", adminCheckRes.status);
    if (adminCheckRes.status !== 403) {
        throw new Error("Security breach: student was able to access admin endpoint!");
    }
    console.log("✅ Access correctly denied (403 Forbidden)");

    // 11. SECURITY: STUDENT CANNOT SUBMIT WITHOUT JOINING
    console.log("\n[11] Testing Security: Submissions Blocked if Student Not Joined...");
    // Register separate non-joined student
    const unjoinedEmail = `unjoined_${testTimestamp}@testcoderush.com`;
    const unjoinedReg = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Unjoined User",
            email: unjoinedEmail,
            college: "Test University",
            studentId: "TU-001",
            password: studentPass
        })
    });
    const unjoinedData = await unjoinedReg.json();
    const unjoinedLogin = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unjoinedEmail, password: studentPass })
    });
    const unjoinedToken = (await unjoinedLogin.json()).token;

    const unjoinedSubmit = await fetch(`${baseUrl}/submissions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${unjoinedToken}`
        },
        body: JSON.stringify({
            problemId: testProblem._id,
            competitionId: liveComp._id,
            language: "python",
            code: pythonSolution
        })
    });
    console.log("Unjoined submit status:", unjoinedSubmit.status);
    if (unjoinedSubmit.status !== 403) {
        throw new Error("Security breach: Unjoined student was allowed to submit code!");
    }
    console.log("✅ Unjoined submission correctly rejected (403 Forbidden)");

    // 12. SECURITY: HIDDEN TEST CASES ARE MASKED FOR STUDENTS
    console.log("\n[12] Testing Security: Hidden Test Cases Masked from Students...");
    const publicProblemRes = await fetch(`${baseUrl}/problems/${testProblem._id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const publicProbData = await publicProblemRes.json();
    const hiddenTcs = (publicProbData.problem.testCases || []).filter((tc) => tc.isHidden);
    console.log("Total hidden test cases on problem:", hiddenTcs.length);
    if (hiddenTcs.length > 0) {
        const exposed = hiddenTcs.some((tc) => tc.input !== "[Hidden Test Case]" || tc.expectedOutput !== "[Hidden Test Case]");
        if (exposed) {
            throw new Error("Security breach: Hidden test case input or expected output exposed to student!");
        }
        console.log("✅ Hidden test case inputs and outputs are strictly masked ('[Hidden Test Case]')");
    }

    // 13. ADMIN CAPABILITIES: CREATE PROBLEM, ADD TEST CASES, ASSIGN TO COMPETITION
    console.log("\n[13] Testing Admin Operations (Create Problem, Test Cases, Assign)...");
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@coderush.com", password: "admin123" })
    });
    const adminToken = (await adminLoginRes.json()).token;

    // Admin creates problem
    const newProbTitle = `Auto Test Problem ${testTimestamp}`;
    const createProbRes = await fetch(`${baseUrl}/problems`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            title: newProbTitle,
            description: "Automated test problem created by test suite",
            difficulty: "Medium",
            points: 75,
            inputFormat: "Integer N",
            outputFormat: "Double of N",
            constraints: "1 <= N <= 100",
            sampleInput: "4",
            sampleOutput: "8",
            testCases: [
                { input: "4", expectedOutput: "8", isHidden: false },
                { input: "10", expectedOutput: "20", isHidden: true }
            ]
        })
    });
    const createdProbData = await createProbRes.json();
    if (!createProbRes.ok) throw new Error("Admin create problem failed: " + JSON.stringify(createdProbData));
    const createdProbId = createdProbData.problem._id;
    console.log("✅ Admin created problem:", createdProbData.problem.title, "| ID:", createdProbId);

    // Admin assigns problem to competition
    const assignRes = await fetch(`${baseUrl}/competitions/${liveComp._id}/problems/${createdProbId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    const assignData = await assignRes.json();
    if (!assignRes.ok) throw new Error("Admin problem assignment failed: " + JSON.stringify(assignData));
    console.log("✅ Admin assigned problem to competition:", assignData.message);

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO FAILURES!");
    console.log("==================================================");
}

runComprehensiveVerification().catch((err) => {
    console.error("\n❌ VERIFICATION TEST FAILED:", err);
    process.exit(1);
});
