import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Trophy,
    Clock,
    Calendar,
    Users,
    Search,
    CheckCircle,
    CheckCircle2,
    FileCode,
    Sparkles,
    Flame,
    ArrowRight,
    Terminal,
    Code2,
    Layers,
    Award
} from "lucide-react";
import Navbar from "../components/Navbar";

function Dashboard() {
    const navigate = useNavigate();

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem("token");

    const [competitions, setCompetitions] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // all, active, upcoming, completed, joined
    const [joiningId, setJoiningId] = useState(null);

    // =========================
    // FETCH DATA
    // =========================
    const fetchData = async () => {
        try {
            setLoading(true);
            const [compRes, subRes] = await Promise.all([
                axios.get("http://localhost:5000/api/competitions"),
                token
                    ? axios.get("http://localhost:5000/api/submissions/my", {
                          headers: { Authorization: `Bearer ${token}` }
                      }).catch(() => ({ data: { submissions: [] } }))
                    : Promise.resolve({ data: { submissions: [] } })
            ]);

            setCompetitions(compRes.data.competitions || []);
            setSubmissions(subRes.data.submissions || []);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // =========================
    // JOIN COMPETITION
    // =========================
    const joinCompetition = async (id) => {
        if (!token) {
            alert("Please log in to join this competition.");
            navigate("/");
            return;
        }

        try {
            setJoiningId(id);
            const response = await axios.post(
                `http://localhost:5000/api/competitions/${id}/join`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message || "Successfully joined!");
            await fetchData();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to join competition"
            );
        } finally {
            setJoiningId(null);
        }
    };

    // =========================
    // STATUS COMPUTATION
    // =========================
    const getCompetitionStatus = (comp) => {
        const now = new Date();
        const start = new Date(comp.startTime);
        const end = new Date(comp.endTime);

        if (now < start) {
            return { label: "UPCOMING", class: "status-upcoming" };
        } else if (now >= start && now <= end) {
            return { label: "LIVE", class: "status-live" };
        } else {
            return { label: "COMPLETED", class: "status-ended" };
        }
    };

    const isUserJoined = (comp) => {
        if (!user || !comp.participants) return false;
        return comp.participants.some(
            (p) => (p?._id || p).toString() === (user?.id || user?._id || "").toString()
        );
    };

    const getCompetitionDifficulty = (comp) => {
        if (!comp.problems || comp.problems.length === 0) return "Easy";
        const diffs = comp.problems.map((p) => p.difficulty || "Easy");
        if (diffs.includes("Hard")) return "Hard";
        if (diffs.includes("Medium")) return "Medium";
        return "Easy";
    };

    // Real metric calculations from API data
    const totalCompetitions = competitions.length;
    const joinedCompetitions = competitions.filter(isUserJoined).length;
    const liveCompetitionsList = competitions.filter((c) => getCompetitionStatus(c).label === "LIVE");
    const upcomingCompetitionsList = competitions.filter((c) => getCompetitionStatus(c).label === "UPCOMING");
    const activeCompetitionsCount = liveCompetitionsList.length;

    const totalProblems = competitions.reduce(
        (acc, curr) => acc + (curr.problems?.length || 0),
        0
    );

    // Recently solved problems
    const acceptedSubmissions = submissions.filter((s) => s.status === "Accepted");
    const uniqueSolvedMap = new Map();
    acceptedSubmissions.forEach((s) => {
        const pId = (s.problem?._id || s.problem || "").toString();
        if (pId && !uniqueSolvedMap.has(pId)) {
            uniqueSolvedMap.set(pId, s);
        }
    });
    const recentlySolvedProblems = Array.from(uniqueSolvedMap.values()).slice(0, 5);

    // Continue Coding calculation:
    // Look for joined competitions, especially LIVE ones or the most recently attempted one
    const joinedComps = competitions.filter(isUserJoined);
    let continueComp = null;
    let continueCompSolvedCount = 0;
    let continueCompTotalCount = 0;
    let lastAttemptedProblemTitle = null;

    if (joinedComps.length > 0) {
        // Prefer live joined comp, otherwise latest joined
        continueComp = joinedComps.find((c) => getCompetitionStatus(c).label === "LIVE") || joinedComps[0];
    } else if (liveCompetitionsList.length > 0) {
        continueComp = liveCompetitionsList[0];
    }

    if (continueComp) {
        continueCompTotalCount = continueComp.problems?.length || 0;
        const compProblemIds = (continueComp.problems || []).map((p) => (p._id || p).toString());

        // Count solved in this competition
        const solvedInComp = new Set();
        submissions.forEach((s) => {
            const pId = (s.problem?._id || s.problem || "").toString();
            if (compProblemIds.includes(pId) && s.status === "Accepted") {
                solvedInComp.add(pId);
            }
        });
        continueCompSolvedCount = solvedInComp.size;

        // Find last attempted problem in this competition
        const compSubmissions = submissions.filter((s) => {
            const sCompId = (s.competition?._id || s.competition || "").toString();
            const pId = (s.problem?._id || s.problem || "").toString();
            return sCompId === continueComp._id.toString() || compProblemIds.includes(pId);
        });

        if (compSubmissions.length > 0) {
            lastAttemptedProblemTitle = compSubmissions[0].problem?.title || "Problem Challenge";
        } else if (continueComp.problems && continueComp.problems.length > 0) {
            lastAttemptedProblemTitle = continueComp.problems[0].title || "Check Positive or Negative";
        }
    }

    // Filtering for main competition list
    const filteredCompetitions = competitions.filter((comp) => {
        const matchesSearch =
            comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comp.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const status = getCompetitionStatus(comp).label;
        if (activeFilter === "active" || activeFilter === "LIVE") return status === "LIVE";
        if (activeFilter === "upcoming" || activeFilter === "UPCOMING") return status === "UPCOMING";
        if (activeFilter === "completed" || activeFilter === "COMPLETED") return status === "COMPLETED";
        if (activeFilter === "joined") return isUserJoined(comp);

        return true;
    });

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime())
            ? "N/A"
            : d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
              });
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                {/* WELCOME SECTION */}
                <div className="welcome-section">
                    <div className="welcome-header">
                        <div>
                            <p className="small-text">STUDENT DASHBOARD</p>
                            <h1>
                                Welcome, {user?.name || "Coder"} 👋
                            </h1>
                            <p>
                                Test your skills, solve real programming challenges, and climb the college leaderboard.
                            </p>
                        </div>

                        <div className="user-quick-profile">
                            <span className="college-tag">
                                🎓 {user?.college || "College Student"}
                            </span>
                            <span className="id-tag">
                                🆔 {user?.studentId || "Student"}
                            </span>
                        </div>
                    </div>

                    {/* REAL SUMMARY STATS CARDS */}
                    <div className="metrics-row">
                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-purple">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{totalCompetitions}</span>
                                <span className="metric-label">Competitions</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-green">
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{joinedCompetitions}</span>
                                <span className="metric-label">Joined by You</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-orange">
                                <Flame size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{activeCompetitionsCount}</span>
                                <span className="metric-label">Live Now</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-blue">
                                <FileCode size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{acceptedSubmissions.length}</span>
                                <span className="metric-label">Accepted Solves</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. CONTINUE CODING SECTION */}
                {continueComp && (
                    <div
                        className="continue-coding-banner"
                        style={{
                            background: "linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)",
                            border: "1px solid #4338ca",
                            borderRadius: "16px",
                            padding: "24px 28px",
                            marginBottom: "35px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "20px",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)"
                        }}
                    >
                        <div style={{ flex: "1 1 350px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                <span
                                    style={{
                                        fontSize: "0.75rem",
                                        fontWeight: "800",
                                        letterSpacing: "0.08em",
                                        color: "#a5b4fc",
                                        textTransform: "uppercase"
                                    }}
                                >
                                    CONTINUE CODING
                                </span>
                                <span className="status-pill status-live" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>
                                    {getCompetitionStatus(continueComp).label}
                                </span>
                            </div>

                            <h2 style={{ fontSize: "1.45rem", fontWeight: "700", color: "#f8fafc", margin: "0 0 8px 0" }}>
                                {continueComp.title}
                            </h2>

                            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "0.9rem", color: "#94a3b8" }}>
                                <span style={{ color: "#38bdf8", fontWeight: "600" }}>
                                    {continueCompSolvedCount} / {continueCompTotalCount} Problems Solved
                                </span>
                                {lastAttemptedProblemTitle && (
                                    <span>
                                        Last attempted: <strong style={{ color: "#e2e8f0" }}>{lastAttemptedProblemTitle}</strong>
                                    </span>
                                )}
                            </div>

                            {/* PROGRESS BAR */}
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: "400px",
                                    height: "6px",
                                    background: "#1e293b",
                                    borderRadius: "4px",
                                    marginTop: "12px",
                                    overflow: "hidden"
                                }}
                            >
                                <div
                                    style={{
                                        width: `${continueCompTotalCount > 0 ? (continueCompSolvedCount / continueCompTotalCount) * 100 : 0}%`,
                                        height: "100%",
                                        background: "linear-gradient(90deg, #6366f1, #38bdf8)",
                                        borderRadius: "4px",
                                        transition: "width 0.4s ease"
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                className="auth-button"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "12px 24px",
                                    fontSize: "0.95rem",
                                    fontWeight: "600",
                                    background: "#6366f1",
                                    borderRadius: "10px",
                                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
                                    cursor: "pointer",
                                    border: "none",
                                    color: "#ffffff"
                                }}
                                onClick={() => navigate(`/competition/${continueComp._id}`)}
                            >
                                Continue Competition <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. LIVE COMPETITIONS SECTION */}
                <section className="competition-section" style={{ marginBottom: "35px" }}>
                    <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Flame size={22} color="#f97316" />
                                Live Competitions ({liveCompetitionsList.length})
                            </h2>
                            <p style={{ color: "#8b93ad", margin: "4px 0 0", fontSize: "0.9rem" }}>
                                Currently ongoing competitions. Enter now and solve challenges to submit live code.
                            </p>
                        </div>
                        <button
                            className="table-action-pill"
                            onClick={() => navigate("/competitions")}
                        >
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    {liveCompetitionsList.length === 0 ? (
                        <div className="empty-subtle" style={{ padding: "24px", background: "#111525", borderRadius: "12px", border: "1px solid #1f253d" }}>
                            <p>No competitions are currently live. Check upcoming contests below!</p>
                        </div>
                    ) : (
                        <div className="competition-grid">
                            {liveCompetitionsList.map((comp) => {
                                const joined = isUserJoined(comp);
                                const difficulty = getCompetitionDifficulty(comp);

                                return (
                                    <div className="competition-card" key={comp._id}>
                                        <div className="card-top-row">
                                            <div className="competition-icon">
                                                <Trophy size={24} />
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <span className={`difficulty-tag diff-${difficulty.toLowerCase()}`}>
                                                    {difficulty}
                                                </span>
                                                <span className="status-pill status-live">
                                                    LIVE
                                                </span>
                                            </div>
                                        </div>

                                        <h3>{comp.title}</h3>
                                        <p>{comp.description}</p>

                                        <div className="competition-info-grid">
                                            <span>
                                                <Clock size={15} />
                                                {comp.duration} mins
                                            </span>
                                            <span>
                                                <Users size={15} />
                                                {comp.participants?.length || 0} participants
                                            </span>
                                            <span>
                                                <FileCode size={15} />
                                                {comp.problems?.length || 0} problems
                                            </span>
                                            <span>
                                                <Calendar size={15} />
                                                Ends: {formatDateTime(comp.endTime)}
                                            </span>
                                        </div>

                                        <div className="card-actions">
                                            {!joined && (
                                                <button
                                                    className="join-button"
                                                    onClick={() => joinCompetition(comp._id)}
                                                    disabled={joiningId === comp._id}
                                                >
                                                    {joiningId === comp._id ? "Joining..." : "Join Competition"}
                                                </button>
                                            )}
                                            <button
                                                className="view-competition-btn"
                                                style={{
                                                    background: joined ? "#6366f1" : "transparent",
                                                    color: "#fff",
                                                    border: joined ? "none" : "1px solid #3b4261",
                                                    flex: joined ? "1" : "initial"
                                                }}
                                                onClick={() => navigate(`/competition/${comp._id}`)}
                                            >
                                                ENTER COMPETITION →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 3. UPCOMING COMPETITIONS SECTION */}
                <section className="competition-section" style={{ marginBottom: "35px" }}>
                    <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Clock size={22} color="#38bdf8" />
                                Upcoming Competitions ({upcomingCompetitionsList.length})
                            </h2>
                            <p style={{ color: "#8b93ad", margin: "4px 0 0", fontSize: "0.9rem" }}>
                                Register and prepare your environment before the countdown ends.
                            </p>
                        </div>
                    </div>

                    {upcomingCompetitionsList.length === 0 ? (
                        <div className="empty-subtle" style={{ padding: "24px", background: "#111525", borderRadius: "12px", border: "1px solid #1f253d" }}>
                            <p>No upcoming competitions scheduled at this time.</p>
                        </div>
                    ) : (
                        <div className="competition-grid">
                            {upcomingCompetitionsList.map((comp) => {
                                const joined = isUserJoined(comp);
                                const difficulty = getCompetitionDifficulty(comp);

                                return (
                                    <div className="competition-card" key={comp._id}>
                                        <div className="card-top-row">
                                            <div className="competition-icon">
                                                <Trophy size={24} />
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <span className={`difficulty-tag diff-${difficulty.toLowerCase()}`}>
                                                    {difficulty}
                                                </span>
                                                <span className="status-pill status-upcoming">
                                                    UPCOMING
                                                </span>
                                            </div>
                                        </div>

                                        <h3>{comp.title}</h3>
                                        <p>{comp.description}</p>

                                        <div className="competition-info-grid">
                                            <span>
                                                <Clock size={15} />
                                                {comp.duration} mins
                                            </span>
                                            <span>
                                                <Users size={15} />
                                                {comp.participants?.length || 0} participants
                                            </span>
                                            <span>
                                                <FileCode size={15} />
                                                {comp.problems?.length || 0} problems
                                            </span>
                                            <span>
                                                <Calendar size={15} />
                                                Starts: {formatDateTime(comp.startTime)}
                                            </span>
                                        </div>

                                        <div className="card-actions">
                                            <button
                                                className={`join-button ${joined ? "joined-btn" : ""}`}
                                                onClick={() => !joined && joinCompetition(comp._id)}
                                                disabled={joined || joiningId === comp._id}
                                            >
                                                {joined ? "Registered ✓" : "Register / Join"}
                                            </button>
                                            <button
                                                className="view-competition-btn"
                                                onClick={() => navigate(`/competition/${comp._id}`)}
                                            >
                                                VIEW DETAILS
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* 4. RECENTLY SOLVED PROBLEMS SECTION */}
                <section className="competition-section" style={{ marginBottom: "35px" }}>
                    <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <CheckCircle2 size={22} color="#4ade80" />
                                Recently Solved Problems ({recentlySolvedProblems.length})
                            </h2>
                            <p style={{ color: "#8b93ad", margin: "4px 0 0", fontSize: "0.9rem" }}>
                                Challenges you have successfully solved with 100% test case pass rate.
                            </p>
                        </div>
                        <button
                            className="table-action-pill"
                            onClick={() => navigate("/submissions")}
                        >
                            View Submissions History <ArrowRight size={14} />
                        </button>
                    </div>

                    {recentlySolvedProblems.length === 0 ? (
                        <div className="empty-subtle" style={{ padding: "24px", background: "#111525", borderRadius: "12px", border: "1px solid #1f253d" }}>
                            <p>You haven't solved any problems yet. Join a live competition to solve your first challenge!</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap" style={{ background: "#111525", borderRadius: "14px", border: "1px solid #222941" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Problem</th>
                                        <th>Difficulty</th>
                                        <th>Score</th>
                                        <th>Language</th>
                                        <th>Execution Time</th>
                                        <th>Solved At</th>
                                        <th style={{ textAlign: "right" }}>Review</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentlySolvedProblems.map((sub) => (
                                        <tr key={sub._id}>
                                            <td>
                                                <strong style={{ color: "#f8fafc" }}>
                                                    {sub.problem?.title || "Problem"}
                                                </strong>
                                            </td>
                                            <td>
                                                <span className={`difficulty-tag diff-${(sub.problem?.difficulty || "Easy").toLowerCase()}`}>
                                                    {sub.problem?.difficulty || "Easy"}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ color: "#4ade80", fontWeight: "700" }}>
                                                    {sub.score || 0} pts
                                                </span>
                                            </td>
                                            <td>
                                                <span className="lang-tag">
                                                    {sub.language?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>{sub.executionTime || "0.0s"}</td>
                                            <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    className="table-action-pill"
                                                    onClick={() => navigate(`/problem/${sub.problem?._id || sub.problem}/solve`)}
                                                >
                                                    Open Arena <ArrowRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;