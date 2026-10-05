import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Trophy,
    Clock,
    Calendar,
    Users,
    Search,
    FileCode,
    ArrowRight,
    CheckCircle,
    Flame,
    Filter
} from "lucide-react";
import Navbar from "../components/Navbar";

function Competitions() {
    const navigate = useNavigate();

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem("token");

    const [competitions, setCompetitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, LIVE, UPCOMING, COMPLETED
    const [difficultyFilter, setDifficultyFilter] = useState("all"); // all, Easy, Medium, Hard
    const [joiningId, setJoiningId] = useState(null);

    const fetchCompetitions = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:5000/api/competitions");
            setCompetitions(response.data.competitions || []);
        } catch (error) {
            console.error("Failed to fetch competitions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetitions();
    }, []);

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
            await fetchCompetitions();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to join competition"
            );
        } finally {
            setJoiningId(null);
        }
    };

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
        if (!comp.problems || comp.problems.length === 0) return "All Levels";
        const diffs = comp.problems.map((p) => p.difficulty || "Easy");
        if (diffs.includes("Hard")) return "Hard";
        if (diffs.includes("Medium")) return "Medium";
        return "Easy";
    };

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

    // Filter logic
    const filteredCompetitions = competitions.filter((comp) => {
        const matchesSearch =
            comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comp.description.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const status = getCompetitionStatus(comp).label;
        if (statusFilter !== "all" && status !== statusFilter) return false;

        const diff = getCompetitionDifficulty(comp);
        if (difficultyFilter !== "all") {
            if (diff !== difficultyFilter) return false;
        }

        return true;
    });

    const liveCount = competitions.filter((c) => getCompetitionStatus(c).label === "LIVE").length;
    const upcomingCount = competitions.filter((c) => getCompetitionStatus(c).label === "UPCOMING").length;
    const completedCount = competitions.filter((c) => getCompetitionStatus(c).label === "COMPLETED").length;

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                <div className="welcome-section" style={{ marginBottom: "25px" }}>
                    <div className="welcome-header">
                        <div>
                            <p className="small-text">CODING ARENAS & CONTESTS</p>
                            <h1>All Competitions 🏆</h1>
                            <p>
                                Compete in real-time college coding challenges, test your algorithmic skills, and win glory on the leaderboard.
                            </p>
                        </div>
                    </div>
                </div>

                <section className="competition-section">
                    {/* TOOLBAR */}
                    <div className="section-toolbar" style={{ flexWrap: "wrap", gap: "15px" }}>
                        <div className="filter-tabs">
                            <button
                                className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
                                onClick={() => setStatusFilter("all")}
                            >
                                All ({competitions.length})
                            </button>
                            <button
                                className={`filter-tab ${statusFilter === "LIVE" ? "active" : ""}`}
                                onClick={() => setStatusFilter("LIVE")}
                            >
                                🟢 LIVE ({liveCount})
                            </button>
                            <button
                                className={`filter-tab ${statusFilter === "UPCOMING" ? "active" : ""}`}
                                onClick={() => setStatusFilter("UPCOMING")}
                            >
                                ⏳ UPCOMING ({upcomingCount})
                            </button>
                            <button
                                className={`filter-tab ${statusFilter === "COMPLETED" ? "active" : ""}`}
                                onClick={() => setStatusFilter("COMPLETED")}
                            >
                                🏁 COMPLETED ({completedCount})
                            </button>
                        </div>

                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                            {/* DIFFICULTY FILTER */}
                            <div className="comp-picker-box" style={{ margin: 0, padding: 0 }}>
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    style={{ padding: "9px 14px", fontSize: "0.85rem", borderRadius: "10px" }}
                                >
                                    <option value="all">All Difficulties</option>
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>

                            {/* SEARCH BOX */}
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Search competitions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <Clock size={40} className="spin-icon" />
                            <h3>Loading Competitions...</h3>
                            <p>Fetching active and upcoming programming contests.</p>
                        </div>
                    ) : filteredCompetitions.length === 0 ? (
                        <div className="empty-state">
                            <Trophy size={40} />
                            <h3>No competitions found</h3>
                            <p>No competitions match your search or filter criteria.</p>
                        </div>
                    ) : (
                        <div className="competition-grid">
                            {filteredCompetitions.map((competition) => {
                                const status = getCompetitionStatus(competition);
                                const joined = isUserJoined(competition);
                                const difficulty = getCompetitionDifficulty(competition);

                                return (
                                    <div className="competition-card" key={competition._id}>
                                        <div className="card-top-row">
                                            <div className="competition-icon">
                                                <Trophy size={24} />
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <span className={`difficulty-tag diff-${difficulty.toLowerCase()}`}>
                                                    {difficulty}
                                                </span>
                                                <span className={`status-pill ${status.class}`}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>

                                        <h3>{competition.title}</h3>
                                        <p>{competition.description}</p>

                                        <div className="competition-info-grid">
                                            <span>
                                                <Clock size={15} />
                                                {competition.duration} mins
                                            </span>
                                            <span>
                                                <Users size={15} />
                                                {competition.participants?.length || 0} participants
                                            </span>
                                            <span>
                                                <FileCode size={15} />
                                                {competition.problems?.length || 0} problems
                                            </span>
                                            <span title="Start date and time">
                                                <Calendar size={15} />
                                                Start: {formatDateTime(competition.startTime)}
                                            </span>
                                            <span title="End date and time">
                                                <Calendar size={15} />
                                                End: {formatDateTime(competition.endTime)}
                                            </span>
                                        </div>

                                        <div className="card-actions">
                                            {status.label === "LIVE" ? (
                                                <>
                                                    {!joined ? (
                                                        <button
                                                            className="join-button"
                                                            onClick={() => joinCompetition(competition._id)}
                                                            disabled={joiningId === competition._id}
                                                        >
                                                            {joiningId === competition._id ? "Joining..." : "Join Competition"}
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        className="view-competition-btn"
                                                        style={{
                                                            background: joined ? "#6366f1" : "transparent",
                                                            color: "#fff",
                                                            border: joined ? "none" : "1px solid #3b4261",
                                                            flex: joined ? "1" : "initial"
                                                        }}
                                                        onClick={() => navigate(`/competition/${competition._id}`)}
                                                    >
                                                        ENTER COMPETITION →
                                                    </button>
                                                </>
                                            ) : status.label === "UPCOMING" ? (
                                                <>
                                                    <button
                                                        className={`join-button ${joined ? "joined-btn" : ""}`}
                                                        onClick={() => !joined && joinCompetition(competition._id)}
                                                        disabled={joined || joiningId === competition._id}
                                                    >
                                                        {joined ? "Joined ✓" : "Register / Join"}
                                                    </button>
                                                    <button
                                                        className="view-competition-btn"
                                                        onClick={() => navigate(`/competition/${competition._id}`)}
                                                    >
                                                        VIEW DETAILS
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="view-competition-btn"
                                                        style={{ width: "100%", justifyContent: "center" }}
                                                        onClick={() => navigate(`/competition/${competition._id}/leaderboard`)}
                                                    >
                                                        VIEW RESULTS
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Competitions;
