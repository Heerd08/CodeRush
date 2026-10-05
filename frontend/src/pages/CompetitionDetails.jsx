import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Clock,
    Calendar,
    Award,
    FileCode,
    CheckCircle,
    Users,
    AlertCircle,
    ArrowLeft,
    Trophy,
    Terminal
} from "lucide-react";
import Navbar from "../components/Navbar";

function CompetitionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [competition, setCompetition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [joining, setJoining] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState("");

    // Live Timer
    const [timeLeft, setTimeLeft] = useState(null);
    const [compStatus, setCompStatus] = useState("live");
    const [compSubmissions, setCompSubmissions] = useState([]);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem("token");

    const fetchCompetition = async () => {
        try {
            setLoading(true);
            setError("");
            const [compRes, subRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/competitions/${id}`),
                token
                    ? axios.get(`http://localhost:5000/api/submissions/my?competitionId=${id}`, {
                          headers: { Authorization: `Bearer ${token}` }
                      }).catch(() => ({ data: { submissions: [] } }))
                    : Promise.resolve({ data: { submissions: [] } })
            ]);
            setCompetition(compRes.data.competition);
            setCompSubmissions(subRes.data.submissions || []);
        } catch (err) {
            console.error("Failed to fetch competition:", err);
            setError(
                err.response?.data?.message ||
                "Failed to load competition details. Please verify the link and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompetition();
    }, [id, token]);

    useEffect(() => {
        if (!competition) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const start = new Date(competition.startTime).getTime();
            const end = new Date(competition.endTime).getTime();

            if (now < start) {
                setCompStatus("upcoming");
                const diff = start - now;
                setTimeLeft(formatTimeDiff(diff));
            } else if (now >= start && now <= end) {
                setCompStatus("live");
                const diff = end - now;
                setTimeLeft(formatTimeDiff(diff));
            } else {
                setCompStatus("ended");
                setTimeLeft("00:00:00");
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [competition]);

    const formatTimeDiff = (ms) => {
        if (ms <= 0) return "00:00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [
            hours.toString().padStart(2, "0"),
            minutes.toString().padStart(2, "0"),
            seconds.toString().padStart(2, "0")
        ].join(" : ");
    };

    const handleJoin = async () => {
        if (!token) {
            alert("Please login to join this competition.");
            navigate("/");
            return;
        }

        try {
            setJoining(true);
            const response = await axios.post(
                `http://localhost:5000/api/competitions/${id}/join`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setJoinSuccess(response.data.message || "Successfully joined!");
            await fetchCompetition();
        } catch (err) {
            alert(
                err.response?.data?.message ||
                "Unable to join this competition."
            );
        } finally {
            setJoining(false);
        }
    };

    const isJoined =
        competition?.participants?.some(
            (p) => (p?._id || p).toString() === (user?.id || user?._id || "").toString()
        );

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime())
            ? "N/A"
            : d.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
              });
    };

    const totalPoints = (competition?.problems || []).reduce(
        (acc, p) => acc + (p.points || 50),
        0
    );

    const isProblemSolved = (probId) => {
        return compSubmissions.some(
            (s) =>
                (s.problem?._id || s.problem || "").toString() === probId.toString() &&
                s.status === "Accepted"
        );
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                {/* BACK BUTTON */}
                <div style={{ marginBottom: "20px" }}>
                    <button
                        className="back-nav-button"
                        onClick={() => navigate("/competitions")}
                    >
                        <ArrowLeft size={16} />
                        Back to All Competitions
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Competition Arena...</h3>
                        <p>Preparing the challenge arena and problem set.</p>
                    </div>
                ) : error ? (
                    <div className="empty-state error-border">
                        <AlertCircle size={40} color="#ff7b7b" />
                        <h3>Competition Not Found</h3>
                        <p>{error}</p>
                        <button
                            className="auth-button"
                            style={{ maxWidth: "200px", marginTop: "15px" }}
                            onClick={() => navigate("/competitions")}
                        >
                            Return to Competitions
                        </button>
                    </div>
                ) : competition ? (
                    <>
                        {/* COMPETITION HERO */}
                        <div className="competition-hero">
                            <div className="hero-content">
                                <div className="badge-row">
                                    <span className="live-badge">CONTEST ARENA</span>
                                    {isJoined && (
                                        <span className="joined-badge">
                                            <CheckCircle size={14} /> Registered Participant
                                        </span>
                                    )}
                                    {/* LIVE COUNTDOWN TIMER */}
                                    <span className={`status-pill ${compStatus === "live" ? "status-live" : compStatus === "upcoming" ? "status-upcoming" : "status-ended"}`}>
                                        {compStatus === "live" ? `LIVE • ⏱ ${timeLeft} remaining` : compStatus === "upcoming" ? `STARTS IN ${timeLeft}` : "COMPETITION ENDED"}
                                    </span>
                                </div>
                                <h1>{competition.title}</h1>
                                <p className="hero-desc">{competition.description}</p>

                                <div className="meta-stats-row">
                                    <div className="stat-pill">
                                        <Clock size={16} />
                                        <span>⏱ {timeLeft} remaining</span>
                                    </div>
                                    <div className="stat-pill">
                                        <FileCode size={16} />
                                        <span>{competition.problems?.length || 0} Problems</span>
                                    </div>
                                    <div className="stat-pill">
                                        <Award size={16} />
                                        <span>{totalPoints} Points</span>
                                    </div>
                                    <div className="stat-pill">
                                        <Users size={16} />
                                        <span>{competition.participants?.length || 0} Participants</span>
                                    </div>
                                    <div className="stat-pill">
                                        <Calendar size={16} />
                                        <span>{competition.duration} mins</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-action">
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    <button
                                        className="leaderboard-link-btn"
                                        onClick={() =>
                                            navigate(`/competition/${competition._id}/leaderboard`)
                                        }
                                    >
                                        <Trophy size={16} />
                                        Leaderboard
                                    </button>

                                    {!isJoined ? (
                                        <button
                                            className="join-button hero-join-btn"
                                            onClick={handleJoin}
                                            disabled={joining || compStatus === "ended"}
                                        >
                                            {joining ? "Joining..." : compStatus === "ended" ? "Competition Ended" : "JOIN COMPETITION"}
                                        </button>
                                    ) : (
                                        <button
                                            className="solve-problem-btn hero-join-btn"
                                            style={{ background: "#22c55e", color: "#000", fontWeight: "700" }}
                                            onClick={() => {
                                                if (competition.problems && competition.problems.length > 0) {
                                                    const firstProb = competition.problems[0];
                                                    navigate(`/problem/${firstProb._id}/solve?competitionId=${competition._id}`, {
                                                        state: {
                                                            competitionId: competition._id,
                                                            competitionTitle: competition.title
                                                        }
                                                    });
                                                } else {
                                                    document.querySelector(".problems-section")?.scrollIntoView({ behavior: "smooth" });
                                                }
                                            }}
                                        >
                                            <Terminal size={16} /> ENTER COMPETITION →
                                        </button>
                                    )}
                                </div>

                                {joinSuccess && (
                                    <p className="success-hint">{joinSuccess}</p>
                                )}
                            </div>
                        </div>

                        {/* PROBLEMS LIST SECTION */}
                        <section className="problems-section">
                            <div className="section-heading">
                                <div>
                                    <h2>
                                        <FileCode size={24} />
                                        PROBLEMS ({competition.problems?.length || 0})
                                    </h2>
                                    <p>
                                        {isJoined
                                            ? "Select any problem to open the interactive code editor, test in sandbox, and submit for evaluation."
                                            : "You must click [ JOIN COMPETITION ] before accessing or submitting solutions to these problems."}
                                    </p>
                                </div>
                            </div>

                            {!competition.problems || competition.problems.length === 0 ? (
                                <div className="empty-state">
                                    <FileCode size={40} />
                                    <h3>No Problems Assigned Yet</h3>
                                    <p>
                                        The administrator has not yet assigned problems to this competition. Please check back before the start time!
                                    </p>
                                </div>
                            ) : (
                                <div className="problem-cards-list">
                                    {competition.problems.map((problem, index) => {
                                        const solved = isProblemSolved(problem._id);
                                        const probNumberStr = String(index + 1).padStart(2, "0");

                                        const handleOpenProblem = () => {
                                            if (!isJoined) {
                                                alert("Students must join the competition before opening problems. Please click [ JOIN COMPETITION ] first.");
                                                return;
                                            }
                                            navigate(`/problem/${problem._id}/solve?competitionId=${competition._id}`, {
                                                state: {
                                                    competitionId: competition._id,
                                                    competitionTitle: competition.title
                                                }
                                            });
                                        };

                                        return (
                                            <div
                                                className={`problem-item-card ${!isJoined ? "problem-card-locked" : "problem-card-clickable"}`}
                                                key={problem._id || index}
                                                onClick={handleOpenProblem}
                                                style={{ cursor: isJoined ? "pointer" : "not-allowed" }}
                                            >
                                                <div className="problem-main-info">
                                                    <div className="problem-number-badge">
                                                        {probNumberStr}
                                                    </div>
                                                    <div className="problem-text">
                                                        <div className="problem-title-row">
                                                            <h3>{problem.title}</h3>
                                                            <span
                                                                className={`difficulty-tag diff-${(
                                                                    problem.difficulty || "Easy"
                                                                ).toLowerCase()}`}
                                                            >
                                                                {problem.difficulty}
                                                            </span>
                                                            <span className="points-tag">
                                                                <Award size={14} />
                                                                {problem.points || 50} Points
                                                            </span>
                                                            {solved && (
                                                                <span
                                                                    style={{
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        color: "#4ade80",
                                                                        fontSize: "0.82rem",
                                                                        fontWeight: "700",
                                                                        background: "rgba(74, 222, 128, 0.12)",
                                                                        padding: "3px 8px",
                                                                        borderRadius: "6px"
                                                                    }}
                                                                >
                                                                    <CheckCircle size={14} /> Solved
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="problem-snippet">
                                                            {problem.description?.length > 150
                                                                ? `${problem.description.substring(0, 150)}...`
                                                                : problem.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="problem-action" style={{ display: "flex", gap: "10px" }} onClick={(e) => e.stopPropagation()}>
                                                    {!isJoined ? (
                                                        <button
                                                            className="join-button"
                                                            style={{ padding: "8px 14px", fontSize: "0.85rem" }}
                                                            onClick={handleJoin}
                                                            disabled={joining || compStatus === "ended"}
                                                        >
                                                            Join Competition
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="solve-problem-btn"
                                                            onClick={handleOpenProblem}
                                                            disabled={compStatus === "ended"}
                                                            style={{
                                                                background: solved ? "rgba(74, 222, 128, 0.15)" : "#6366f1",
                                                                color: solved ? "#4ade80" : "#fff",
                                                                border: solved ? "1px solid #4ade80" : "none"
                                                            }}
                                                        >
                                                            <Terminal size={15} />
                                                            {compStatus === "ended" ? "View Problem" : solved ? "Re-Solve" : "Solve"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                ) : null}
            </main>
        </div>
    );
}

export default CompetitionDetails;
