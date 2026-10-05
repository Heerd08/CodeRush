import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    GraduationCap,
    IdCard,
    Shield,
    Clock,
    Trophy,
    History,
    CheckCircle,
    ArrowRight,
    Award
} from "lucide-react";
import Navbar from "../components/Navbar";

function Profile() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [user, setUser] = useState(null);
    const [joinedCompetitions, setJoinedCompetitions] = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError("");

                const [profileRes, joinedRes, subRes] = await Promise.all([
                    axios.get("http://localhost:5000/api/auth/profile", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get("http://localhost:5000/api/competitions/user/joined", {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get("http://localhost:5000/api/submissions/my", {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setUser(profileRes.data.user);
                setJoinedCompetitions(joinedRes.data.competitions || []);
                setMySubmissions(subRes.data.submissions || []);
            } catch (err) {
                console.error("Failed to load profile:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch profile. Please log in again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [token, navigate]);

    // Computed real statistics
    const competitionsJoinedCount = joinedCompetitions.length;
    const problemsAttemptedSet = new Set(
        mySubmissions.map((s) => (s.problem?._id || s.problem || "").toString())
    );
    const problemsAttemptedCount = problemsAttemptedSet.size;

    const acceptedSubs = mySubmissions.filter((s) => s.status === "Accepted");
    const acceptedSubmissionsCount = acceptedSubs.length;
    const totalSubmissionsCount = mySubmissions.length;
    const accuracy = totalSubmissionsCount > 0 ? Math.round((acceptedSubmissionsCount / totalSubmissionsCount) * 100) : 0;

    // Distinct solved problems
    const solvedProblemsMap = new Map();
    acceptedSubs.forEach((s) => {
        const probId = (s.problem?._id || s.problem || "").toString();
        if (probId && !solvedProblemsMap.has(probId)) {
            solvedProblemsMap.set(probId, s.problem);
        }
    });
    const problemsSolvedCount = solvedProblemsMap.size;

    let easySolvedCount = 0;
    let mediumSolvedCount = 0;
    let hardSolvedCount = 0;
    solvedProblemsMap.forEach((prob) => {
        const diff = prob?.difficulty || "Easy";
        if (diff === "Hard") hardSolvedCount++;
        else if (diff === "Medium") mediumSolvedCount++;
        else easySolvedCount++;
    });

    // Highest score per problem
    const bestScoreMap = {};
    mySubmissions.forEach((s) => {
        const probId = (s.problem?._id || s.problem || "").toString();
        if (probId) {
            const cur = bestScoreMap[probId] || 0;
            if ((s.score || 0) > cur) {
                bestScoreMap[probId] = s.score || 0;
            }
        }
    });
    const totalScore = Object.values(bestScoreMap).reduce((a, b) => a + b, 0);

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                <div className="welcome-section" style={{ marginBottom: "25px" }}>
                    <p className="small-text">USER ACCOUNT</p>
                    <h1>Student Profile 👤</h1>
                    <p>Verified account information, competition statistics, and submission history.</p>

                    {/* REAL CODING STATISTICS ROW */}
                    {user && (
                        <>
                            <div className="metrics-row" style={{ marginTop: "20px" }}>
                                <div className="metric-box">
                                    <div className="metric-icon-wrap icon-purple">
                                        <Trophy size={22} />
                                    </div>
                                    <div>
                                        <span className="metric-num">{competitionsJoinedCount}</span>
                                        <span className="metric-label">Competitions Joined</span>
                                    </div>
                                </div>

                                <div className="metric-box">
                                    <div className="metric-icon-wrap icon-green">
                                        <CheckCircle size={22} />
                                    </div>
                                    <div>
                                        <span className="metric-num">{problemsSolvedCount}</span>
                                        <span className="metric-label">Problems Solved</span>
                                    </div>
                                </div>

                                <div className="metric-box">
                                    <div className="metric-icon-wrap icon-orange">
                                        <Award size={22} />
                                    </div>
                                    <div>
                                        <span className="metric-num">{totalScore}</span>
                                        <span className="metric-label">Total Score</span>
                                    </div>
                                </div>

                                <div className="metric-box">
                                    <div className="metric-icon-wrap icon-blue">
                                        <History size={22} />
                                    </div>
                                    <div>
                                        <span className="metric-num">{accuracy}%</span>
                                        <span className="metric-label">Accuracy Rate</span>
                                    </div>
                                </div>
                            </div>

                            {/* PROBLEM SOLVING BREAKDOWN BY DIFFICULTY */}
                            <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
                                <div style={{ background: "#111525", border: "1px solid #1f2742", borderRadius: "10px", padding: "14px 18px" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#4ade80", fontWeight: "700", textTransform: "uppercase" }}>Easy Solved</span>
                                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc", marginTop: "4px" }}>{easySolvedCount}</div>
                                </div>
                                <div style={{ background: "#111525", border: "1px solid #1f2742", borderRadius: "10px", padding: "14px 18px" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#facc15", fontWeight: "700", textTransform: "uppercase" }}>Medium Solved</span>
                                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc", marginTop: "4px" }}>{mediumSolvedCount}</div>
                                </div>
                                <div style={{ background: "#111525", border: "1px solid #1f2742", borderRadius: "10px", padding: "14px 18px" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#f87171", fontWeight: "700", textTransform: "uppercase" }}>Hard Solved</span>
                                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc", marginTop: "4px" }}>{hardSolvedCount}</div>
                                </div>
                                <div style={{ background: "#111525", border: "1px solid #1f2742", borderRadius: "10px", padding: "14px 18px" }}>
                                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase" }}>Submissions</span>
                                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "#f8fafc", marginTop: "4px" }}>
                                        {acceptedSubmissionsCount} / {totalSubmissionsCount}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Profile...</h3>
                    </div>
                ) : error ? (
                    <div className="empty-state error-border">
                        <h3>Error Loading Profile</h3>
                        <p>{error}</p>
                    </div>
                ) : user ? (
                    <div className="profile-grid-layout">
                        {/* LEFT: USER DETAILS CARD */}
                        <div className="profile-card">
                            <div className="profile-avatar-wrap">
                                <div className="avatar-circle">
                                    <User size={42} />
                                </div>
                                <h2>{user.name}</h2>
                                <span className={`role-tag role-${user.role}`}>
                                    {user.role === "admin" ? "Platform Administrator" : "Student Competitor"}
                                </span>
                            </div>

                            <div className="profile-fields-list">
                                <div className="profile-field-item">
                                    <div className="field-icon">
                                        <Mail size={18} />
                                    </div>
                                    <div>
                                        <label>Email Address</label>
                                        <p>{user.email}</p>
                                    </div>
                                </div>

                                <div className="profile-field-item">
                                    <div className="field-icon">
                                        <GraduationCap size={18} />
                                    </div>
                                    <div>
                                        <label>College / Institution</label>
                                        <p>{user.college}</p>
                                    </div>
                                </div>

                                <div className="profile-field-item">
                                    <div className="field-icon">
                                        <IdCard size={18} />
                                    </div>
                                    <div>
                                        <label>Student Roll Number</label>
                                        <p>{user.studentId}</p>
                                    </div>
                                </div>

                                <div className="profile-field-item">
                                    <div className="field-icon">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <label>Registered Date</label>
                                        <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="readonly-notice">
                                <Shield size={14} />
                                <span>Official student credentials are read-only. Contact your administrator for profile updates.</span>
                            </div>
                        </div>

                        {/* RIGHT: JOINED COMPETITIONS & RECENT ACTIVITY */}
                        <div className="profile-activity-column">
                            {/* JOINED COMPETITIONS */}
                            <div className="profile-section-card">
                                <div className="section-card-title">
                                    <Trophy size={20} color="#a79dff" />
                                    <h3>My Competitions ({joinedCompetitions.length})</h3>
                                </div>

                                {joinedCompetitions.length === 0 ? (
                                    <div className="empty-subtle">
                                        <p>You haven't joined any competitions yet.</p>
                                        <button
                                            className="auth-button"
                                            style={{ maxWidth: "200px", marginTop: "10px" }}
                                            onClick={() => navigate("/dashboard")}
                                        >
                                            Explore Competitions
                                        </button>
                                    </div>
                                ) : (
                                    <div className="joined-comp-list">
                                        {joinedCompetitions.map((comp) => (
                                            <div key={comp._id} className="joined-comp-item">
                                                <div>
                                                    <h4>{comp.title}</h4>
                                                    <span className="sub-detail">
                                                        Duration: {comp.duration} mins • {comp.problems?.length || 0} problems
                                                    </span>
                                                </div>
                                                <button
                                                    className="view-problem-btn"
                                                    onClick={() => navigate(`/competition/${comp._id}`)}
                                                >
                                                    Enter Arena <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* RECENT SUBMISSIONS */}
                            <div className="profile-section-card">
                                <div className="section-card-title">
                                    <History size={20} color="#a79dff" />
                                    <h3>Recent Submissions ({mySubmissions.length})</h3>
                                </div>

                                {mySubmissions.length === 0 ? (
                                    <div className="empty-subtle">
                                        <p>No submissions recorded yet. Join an arena to start coding!</p>
                                    </div>
                                ) : (
                                    <div className="recent-sub-list">
                                        {mySubmissions.slice(0, 5).map((sub) => (
                                            <div key={sub._id} className="recent-sub-item">
                                                <div>
                                                    <strong>{sub.problem?.title || "Problem"}</strong>
                                                    <div className="sub-meta-line">
                                                        <span>{sub.competition?.title}</span>
                                                        <span>•</span>
                                                        <span className="lang-tag-sm">
                                                            {sub.language?.toUpperCase()}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`status-pill ${
                                                        sub.status === "Accepted"
                                                            ? "status-live"
                                                            : "status-upcoming"
                                                    }`}
                                                >
                                                    {sub.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default Profile;
