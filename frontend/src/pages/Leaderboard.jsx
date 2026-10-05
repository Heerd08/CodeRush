import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import {
    Trophy,
    Medal,
    Clock,
    Users,
    AlertCircle,
    Info,
    Calendar,
    ArrowLeft,
    CheckCircle
} from "lucide-react";
import Navbar from "../components/Navbar";

function Leaderboard() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const selectedCompIdParam = id || searchParams.get("competitionId");

    const [competitions, setCompetitions] = useState([]);
    const [selectedCompId, setSelectedCompId] = useState(selectedCompIdParam || "");
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [studentSearch, setStudentSearch] = useState("");

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.id || user?._id || "";

    // 1. Fetch competitions list
    useEffect(() => {
        const fetchCompetitions = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5000/api/competitions"
                );
                const comps = response.data.competitions || [];
                setCompetitions(comps);

                if (!selectedCompIdParam && comps.length > 0) {
                    setSelectedCompId(comps[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch competitions for leaderboard:", err);
                setError("Unable to load competitions.");
            }
        };

        fetchCompetitions();
    }, [selectedCompIdParam]);

    // 2. Fetch leaderboard for selected competition
    useEffect(() => {
        if (!selectedCompId) return;

        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await axios.get(
                    `http://localhost:5000/api/competitions/${selectedCompId}/leaderboard`
                );
                setLeaderboardData(response.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch competition leaderboard."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [selectedCompId]);

    const handleCompChange = (newId) => {
        setSelectedCompId(newId);
        setSearchParams({ competitionId: newId });
    };

    const getMedalColor = (rank) => {
        if (rank === 1) return "#fbbf24"; // Gold
        if (rank === 2) return "#cbd5e1"; // Silver
        if (rank === 3) return "#d97706"; // Bronze
        return "#8b93ad";
    };

    const formatLastTime = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const allEntries = leaderboardData?.leaderboard || [];
    const myRankEntry = allEntries.find(
        (e) => (e.userId?._id || e.userId || "").toString() === currentUserId.toString()
    );

    const filteredEntries = allEntries.filter((entry) => {
        if (!studentSearch.trim()) return true;
        const q = studentSearch.toLowerCase();
        return (
            (entry.name && entry.name.toLowerCase().includes(q)) ||
            (entry.studentId && entry.studentId.toLowerCase().includes(q)) ||
            (entry.email && entry.email.toLowerCase().includes(q)) ||
            (entry.college && entry.college.toLowerCase().includes(q))
        );
    });

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                <div className="leaderboard-header" style={{ flexWrap: "wrap", gap: "20px" }}>
                    <div>
                        <p className="small-text">COMPETITIVE STANDINGS</p>
                        <h1>
                            <Trophy
                                size={36}
                                color="#fbbf24"
                                style={{
                                    display: "inline-block",
                                    verticalAlign: "middle",
                                    marginRight: "12px"
                                }}
                            />
                            Live Leaderboard
                        </h1>
                        <p>Track student performance, problem solves, and real-time rankings.</p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        {/* SELECT COMPETITION DROPDOWN */}
                        <div className="comp-picker-box">
                            <label>Competition:</label>
                            <select
                                value={selectedCompId}
                                onChange={(e) => handleCompChange(e.target.value)}
                            >
                                {competitions.length === 0 && (
                                    <option value="">No competitions available</option>
                                )}
                                {competitions.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SEARCH PARTICIPANT */}
                        <div className="search-box" style={{ marginTop: "18px" }}>
                            <input
                                type="text"
                                placeholder="Search student name or ID..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                style={{ minWidth: "220px" }}
                            />
                        </div>
                    </div>
                </div>

                {/* CURRENT STUDENT RANK CARD HIGHLIGHT */}
                {myRankEntry && (
                    <div
                        style={{
                            background: "rgba(99, 102, 241, 0.12)",
                            border: "1px solid #6366f1",
                            borderRadius: "12px",
                            padding: "14px 20px",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "1.3rem", fontWeight: "800", color: "#a5b4fc" }}>
                                #{myRankEntry.rank}
                            </span>
                            <div>
                                <strong style={{ color: "#f8fafc", fontSize: "1rem" }}>Your Standings ({myRankEntry.name})</strong>
                                <p style={{ margin: "2px 0 0", color: "#c7d2fe", fontSize: "0.85rem" }}>
                                    Solved: {myRankEntry.solvedProblemsCount} problems • Submissions: {myRankEntry.submissionsCount}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="score-badge" style={{ fontSize: "1.05rem", padding: "6px 14px" }}>
                                {myRankEntry.totalScore} Points
                            </span>
                        </div>
                    </div>
                )}

                {/* SCORING RULE & STATUS BANNER */}
                <div className="leaderboard-banner">
                    <Info size={18} />
                    <div>
                        <strong>Scoring Rule: </strong>
                        <span>
                            {leaderboardData?.scoringRule ||
                                "Total score is the sum of your highest score on each distinct problem in this competition. Full points require passing all test cases. Ties broken by earlier submission time."}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Leaderboard...</h3>
                        <p>Aggregating evaluated testcase scores and standings.</p>
                    </div>
                ) : error ? (
                    <div className="empty-state error-border">
                        <AlertCircle size={40} color="#ff7b7b" />
                        <h3>Error Loading Leaderboard</h3>
                        <p>{error}</p>
                    </div>
                ) : !leaderboardData || leaderboardData.leaderboard?.length === 0 ? (
                    <div className="empty-state">
                        <Users size={40} />
                        <h3>No Participants Registered Yet</h3>
                        <p>
                            Once students join this competition and submit code, their rankings will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="leaderboard-table-container">
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "90px" }}>RANK</th>
                                    <th>STUDENT</th>
                                    <th style={{ textAlign: "center" }}>SOLVED</th>
                                    <th style={{ textAlign: "center" }}>SCORE</th>
                                    <th style={{ textAlign: "center" }}>TIME</th>
                                    <th>COLLEGE / ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((entry) => {
                                    const isMe = (entry.userId?._id || entry.userId || "").toString() === currentUserId.toString();

                                    return (
                                        <tr
                                            key={entry.userId}
                                            className={`${
                                                entry.rank <= 3 ? `top-rank rank-${entry.rank}` : ""
                                            } ${isMe ? "current-user-row" : ""}`}
                                            style={isMe ? { background: "rgba(99, 102, 241, 0.15)", borderLeft: "3px solid #6366f1" } : {}}
                                        >
                                            <td>
                                                <div
                                                    className="rank-badge"
                                                    style={{
                                                        color: getMedalColor(entry.rank)
                                                    }}
                                                >
                                                    {entry.rank <= 3 ? (
                                                        <Medal size={20} />
                                                    ) : (
                                                        `#${entry.rank}`
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="participant-info">
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <strong className="participant-name">
                                                            {entry.name || "Coder"}
                                                        </strong>
                                                        {isMe && (
                                                            <span
                                                                style={{
                                                                    fontSize: "0.72rem",
                                                                    background: "#6366f1",
                                                                    color: "#fff",
                                                                    padding: "1px 6px",
                                                                    borderRadius: "4px",
                                                                    fontWeight: "700"
                                                                }}
                                                            >
                                                                YOU
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="participant-email">
                                                        {entry.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span className="solved-count">
                                                    {entry.solvedProblemsCount}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <span className="score-badge">
                                                    {entry.totalScore}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.9rem" }}>
                                                {formatLastTime(entry.lastSubmissionTime)}
                                            </td>
                                            <td>
                                                <div>
                                                    <span style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>{entry.college || "N/A"}</span>
                                                    {entry.studentId && (
                                                        <span className="id-tag-subtle" style={{ marginLeft: "8px" }}>
                                                            {entry.studentId}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Leaderboard;
