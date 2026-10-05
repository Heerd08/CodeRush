import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    Award,
    Clock,
    Terminal,
    AlertCircle,
    ArrowLeft,
    Check
} from "lucide-react";
import Navbar from "../components/Navbar";

function ProblemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copiedInput, setCopiedInput] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const competitionId = location.state?.competitionId;
    const competitionTitle = location.state?.competitionTitle;

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                setLoading(true);
                setError("");
                const response = await axios.get(
                    `http://localhost:5000/api/problems/${id}`
                );
                setProblem(response.data.problem);
            } catch (err) {
                console.error("Failed to fetch problem:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to load problem details. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProblem();
    }, [id]);

    const handleBack = () => {
        if (competitionId) {
            navigate(`/competition/${competitionId}`);
        } else {
            navigate("/dashboard");
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === "input") {
            setCopiedInput(true);
            setTimeout(() => setCopiedInput(false), 2000);
        } else {
            setCopiedOutput(true);
            setTimeout(() => setCopiedOutput(false), 2000);
        }
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                {/* BACK LINK */}
                <div style={{ marginBottom: "20px" }}>
                    <button className="back-nav-button" onClick={handleBack}>
                        <ArrowLeft size={16} />
                        {competitionTitle
                            ? `Back to ${competitionTitle}`
                            : "Back to Competitions"}
                    </button>
                </div>

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Problem...</h3>
                        <p>Preparing problem statement and specifications.</p>
                    </div>
                ) : error ? (
                    <div className="empty-state error-border">
                        <AlertCircle size={40} color="#ff7b7b" />
                        <h3>Problem Not Found</h3>
                        <p>{error}</p>
                        <button
                            className="auth-button"
                            style={{ maxWidth: "200px", marginTop: "15px" }}
                            onClick={handleBack}
                        >
                            Go Back
                        </button>
                    </div>
                ) : problem ? (
                    <div className="problem-view-container">
                        {/* TOP HEADER */}
                        <div className="problem-header-card">
                            <div className="problem-title-area">
                                <div className="badge-row">
                                    <span
                                        className={`difficulty-tag diff-${(
                                            problem.difficulty || "Easy"
                                        ).toLowerCase()}`}
                                    >
                                        {problem.difficulty}
                                    </span>
                                    <span className="points-tag">
                                        <Award size={14} />
                                        {problem.points || 100} Points
                                    </span>
                                    {competitionTitle && (
                                        <span className="comp-ref-badge">
                                            {competitionTitle}
                                        </span>
                                    )}
                                </div>
                                <h1>{problem.title}</h1>
                            </div>

                            <div className="editor-cta-box">
                                <button
                                    className="solve-problem-btn-primary"
                                    onClick={() =>
                                        navigate(
                                            `/problem/${problem._id}/solve${
                                                competitionId
                                                    ? `?competitionId=${competitionId}`
                                                    : ""
                                            }`,
                                            {
                                                state: {
                                                    competitionId,
                                                    competitionTitle
                                                }
                                            }
                                        )
                                    }
                                >
                                    <Terminal size={18} />
                                    Open Code Editor & Submit
                                </button>
                            </div>
                        </div>

                        {/* PROBLEM BODY CONTENT */}
                        <div className="problem-body-layout">
                            <div className="problem-content-card">
                                <h2>Problem Description</h2>
                                <div className="rich-text-desc">
                                    {problem.description}
                                </div>

                                <h2>Input Format</h2>
                                <div className="format-text">
                                    {problem.inputFormat}
                                </div>

                                <h2>Output Format</h2>
                                <div className="format-text">
                                    {problem.outputFormat}
                                </div>

                                <h2>Constraints</h2>
                                <div className="constraints-box">
                                    <pre>{problem.constraints}</pre>
                                </div>

                                {/* SAMPLES */}
                                <div className="samples-grid">
                                    <div className="sample-card">
                                        <div className="sample-header">
                                            <span>Sample Input</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        problem.sampleInput,
                                                        "input"
                                                    )
                                                }
                                            >
                                                {copiedInput ? (
                                                    <>
                                                        <Check size={14} /> Copied
                                                    </>
                                                ) : (
                                                    "Copy"
                                                )}
                                            </button>
                                        </div>
                                        <pre className="code-display">
                                            {problem.sampleInput}
                                        </pre>
                                    </div>

                                    <div className="sample-card">
                                        <div className="sample-header">
                                            <span>Sample Output</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        problem.sampleOutput,
                                                        "output"
                                                    )
                                                }
                                            >
                                                {copiedOutput ? (
                                                    <>
                                                        <Check size={14} /> Copied
                                                    </>
                                                ) : (
                                                    "Copy"
                                                )}
                                            </button>
                                        </div>
                                        <pre className="code-display">
                                            {problem.sampleOutput}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default ProblemDetails;
