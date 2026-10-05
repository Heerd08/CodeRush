import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    History,
    Clock,
    FileCode,
    CheckCircle2,
    XCircle,
    Eye,
    X,
    Trophy,
    ArrowLeft
} from "lucide-react";
import Navbar from "../components/Navbar";

function Submissions() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSub, setSelectedSub] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate("/");
            return;
        }

        const fetchSubmissions = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:5000/api/submissions/my", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSubmissions(response.data.submissions || []);
            } catch (err) {
                console.error("Failed to load submissions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [token, navigate]);

    const getStatusClass = (status) => {
        if (status === "Accepted") return "verdict-accepted";
        if (status === "Wrong Answer") return "verdict-wrong";
        if (status === "Compilation Error") return "verdict-compile";
        return "verdict-runtime";
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                <div className="welcome-section" style={{ marginBottom: "25px" }}>
                    <p className="small-text">RECORDED ATTEMPTS</p>
                    <h1>My Submissions History 📜</h1>
                    <p>Review your evaluated solutions, scores, test case results, and submission timestamps.</p>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Submissions...</h3>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="empty-state">
                        <History size={40} />
                        <h3>No Submissions Found</h3>
                        <p>Enter an active competition and submit a solution to see your history here.</p>
                        <button
                            className="auth-button"
                            style={{ maxWidth: "200px", marginTop: "15px" }}
                            onClick={() => navigate("/dashboard")}
                        >
                            View Competitions
                        </button>
                    </div>
                ) : (
                    <div className="admin-table-wrap" style={{ background: "#111525", borderRadius: "16px", border: "1px solid #222941" }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Problem</th>
                                    <th>Competition</th>
                                    <th>Language</th>
                                    <th>Verdict</th>
                                    <th>Score</th>
                                    <th>Time</th>
                                    <th>Submitted At</th>
                                    <th style={{ textAlign: "right" }}>Inspect</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub, idx) => (
                                    <tr
                                        key={sub._id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setSelectedSub(sub)}
                                    >
                                        <td>#{submissions.length - idx}</td>
                                        <td>
                                            <strong>{sub.problem?.title || "Problem"}</strong>
                                        </td>
                                        <td>{sub.competition?.title || "Competition"}</td>
                                        <td>
                                            <span className="lang-tag">
                                                {sub.language?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`verdict-pill-sm ${getStatusClass(sub.status)}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td>
                                            <strong style={{ color: sub.status === "Accepted" ? "#4ade80" : "#f1f3f9" }}>
                                                {sub.score || 0}/{sub.problem?.points || 50}
                                            </strong>
                                        </td>
                                        <td>{sub.executionTime || "0.0s"}</td>
                                        <td>{new Date(sub.createdAt).toLocaleString()}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <button
                                                className="table-action-pill"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSub(sub);
                                                }}
                                            >
                                                <Eye size={14} /> Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* MODAL: SUBMISSION DETAILS */}
                {selectedSub && (
                    <div className="modal-backdrop">
                        <div className="modal-card modal-card-lg">
                            <div className="modal-header">
                                <div>
                                    <h3>Submission #{selectedSub._id.slice(-6)}</h3>
                                    <p className="table-subtext">
                                        {selectedSub.problem?.title} • {selectedSub.competition?.title} ({selectedSub.language?.toUpperCase()})
                                    </p>
                                </div>
                                <button className="modal-close" onClick={() => setSelectedSub(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                                <span className={`verdict-pill ${getStatusClass(selectedSub.status)}`}>
                                    {selectedSub.status}
                                </span>
                                <span className="score-summary">
                                    Score: <strong>{selectedSub.score || 0}</strong> points
                                </span>
                                <span className="table-subtext" style={{ alignSelf: "center" }}>
                                    Passed: {selectedSub.passedTestCases || 0} / {selectedSub.totalTestCases || 0}
                                </span>
                            </div>

                            {/* SOURCE CODE */}
                            <h4>Submitted Source Code:</h4>
                            <div className="code-modal-box" style={{ marginTop: "8px", marginBottom: "20px" }}>
                                <pre className="code-display">{selectedSub.code}</pre>
                            </div>

                            {/* TEST CASES BREAKDOWN */}
                            {selectedSub.testCaseResults && selectedSub.testCaseResults.length > 0 && (
                                <div>
                                    <h4>Test Case Results:</h4>
                                    <div className="testcase-grid" style={{ marginTop: "10px" }}>
                                        {selectedSub.testCaseResults.map((tc) => (
                                            <div
                                                key={tc.testCaseNumber}
                                                className={`testcase-pill ${tc.passed ? "tc-passed" : "tc-failed"}`}
                                            >
                                                <div className="tc-header">
                                                    {tc.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                    <span>
                                                        Test Case {tc.testCaseNumber}
                                                        {tc.isHidden && " (Hidden)"}
                                                    </span>
                                                </div>
                                                <span className="tc-status">{tc.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: "25px" }}>
                                <button
                                    type="button"
                                    className="auth-button"
                                    style={{ width: "auto" }}
                                    onClick={() => setSelectedSub(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Submissions;
