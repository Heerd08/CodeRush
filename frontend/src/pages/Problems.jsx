import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FileCode,
    Search,
    CheckCircle2,
    Clock,
    Award,
    ArrowRight,
    Trophy,
    ExternalLink,
    Lock,
    Check
} from "lucide-react";
import Navbar from "../components/Navbar";

function Problems() {
    const navigate = useNavigate();

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem("token");

    const [problems, setProblems] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, Easy, Medium, Hard

    useEffect(() => {
        const fetchProblemsData = async () => {
            try {
                setLoading(true);
                const [probRes, compRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/problems"),
                    axios.get("http://localhost:5000/api/competitions")
                ]);

                setProblems(probRes.data.problems || []);
                setCompetitions(compRes.data.competitions || []);

                if (token) {
                    try {
                        const subRes = await axios.get("http://localhost:5000/api/submissions/my", {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setMySubmissions(subRes.data.submissions || []);
                    } catch (e) {
                        console.error("Submissions load error:", e);
                    }
                }
            } catch (err) {
                console.error("Failed to load problem set:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProblemsData();
    }, [token]);

    // Check if user has solved problem
    const isProblemSolved = (probId) => {
        return mySubmissions.some(
            (s) =>
                (s.problem?._id || s.problem || "").toString() === probId.toString() &&
                s.status === "Accepted"
        );
    };

    // Find competition for a problem
    const getProblemCompetition = (probId) => {
        return competitions.find((c) =>
            c.problems?.some((p) => (p._id || p).toString() === probId.toString())
        );
    };

    // Filter problems
    const filteredProblems = problems.filter((prob) => {
        const matchesSearch =
            prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (prob.description && prob.description.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (difficultyFilter !== "all" && prob.difficulty !== difficultyFilter) {
            return false;
        }

        return true;
    });

    const handleProblemClick = (problem) => {
        const comp = getProblemCompetition(problem._id);
        if (comp) {
            navigate(`/problem/${problem._id}`, {
                state: {
                    competitionId: comp._id,
                    competitionTitle: comp.title
                }
            });
        } else {
            navigate(`/problem/${problem._id}`);
        }
    };

    const easyCount = problems.filter((p) => p.difficulty === "Easy").length;
    const mediumCount = problems.filter((p) => p.difficulty === "Medium").length;
    const hardCount = problems.filter((p) => p.difficulty === "Hard").length;

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                <div className="welcome-section" style={{ marginBottom: "25px" }}>
                    <div className="welcome-header">
                        <div>
                            <p className="small-text">ALGORITHMIC PROBLEM SET</p>
                            <h1>Problem Library 💻</h1>
                            <p>
                                Browse competitive coding questions across various difficulty levels. Join active contest arenas to submit solutions.
                            </p>
                        </div>
                    </div>
                </div>

                <section className="competition-section">
                    {/* TOOLBAR */}
                    <div className="section-toolbar" style={{ flexWrap: "wrap", gap: "15px" }}>
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${difficultyFilter === "all" ? "active" : ""}`}
                                onClick={() => setDifficultyFilter("all")}
                            >
                                All ({problems.length})
                            </button>
                            <button
                                className={`filter-tab ${difficultyFilter === "Easy" ? "active" : ""}`}
                                onClick={() => setDifficultyFilter("Easy")}
                            >
                                Easy ({easyCount})
                            </button>
                            <button
                                className={`filter-tab ${difficultyFilter === "Medium" ? "active" : ""}`}
                                onClick={() => setDifficultyFilter("Medium")}
                            >
                                Medium ({mediumCount})
                            </button>
                            <button
                                className={`filter-tab ${difficultyFilter === "Hard" ? "active" : ""}`}
                                onClick={() => setDifficultyFilter("Hard")}
                            >
                                Hard ({hardCount})
                            </button>
                        </div>

                        <div className="search-box">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search problems by title or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <Clock size={40} className="spin-icon" />
                            <h3>Loading Problems...</h3>
                            <p>Preparing the problem catalog.</p>
                        </div>
                    ) : filteredProblems.length === 0 ? (
                        <div className="empty-state">
                            <FileCode size={40} />
                            <h3>No Problems Found</h3>
                            <p>No problems match your current search query or difficulty filter.</p>
                        </div>
                    ) : (
                        <div className="admin-table-wrap" style={{ background: "#111525", borderRadius: "16px", border: "1px solid #222941" }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "80px" }}>Status</th>
                                        <th>Problem Title</th>
                                        <th>Difficulty</th>
                                        <th>Points</th>
                                        <th>Associated Arena</th>
                                        <th style={{ textAlign: "right" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProblems.map((prob) => {
                                        const solved = isProblemSolved(prob._id);
                                        const comp = getProblemCompetition(prob._id);

                                        return (
                                            <tr
                                                key={prob._id}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleProblemClick(prob)}
                                            >
                                                <td>
                                                    {solved ? (
                                                        <span
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                color: "#4ade80",
                                                                gap: "4px",
                                                                fontSize: "0.85rem",
                                                                fontWeight: "600"
                                                            }}
                                                            title="Problem Solved"
                                                        >
                                                            <CheckCircle2 size={18} color="#4ade80" />
                                                            Solved
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#4e5774", fontSize: "0.85rem" }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong style={{ fontSize: "0.98rem", color: "#f1f3f9" }}>
                                                            {prob.title}
                                                        </strong>
                                                        {prob.description && (
                                                            <p
                                                                className="table-subtext"
                                                                style={{
                                                                    margin: "4px 0 0",
                                                                    maxWidth: "400px",
                                                                    whiteSpace: "nowrap",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis"
                                                                }}
                                                            >
                                                                {prob.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`difficulty-tag diff-${(prob.difficulty || "Easy").toLowerCase()}`}>
                                                        {prob.difficulty}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="points-tag" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <Award size={13} />
                                                        {prob.points || 50} pts
                                                    </span>
                                                </td>
                                                <td>
                                                    {comp ? (
                                                        <span
                                                            className="comp-ref-badge"
                                                            style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                                fontSize: "0.78rem"
                                                            }}
                                                        >
                                                            <Trophy size={12} />
                                                            {comp.title}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Unassigned</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        className="table-action-pill"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleProblemClick(prob);
                                                        }}
                                                    >
                                                        View Problem <ArrowRight size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Problems;
