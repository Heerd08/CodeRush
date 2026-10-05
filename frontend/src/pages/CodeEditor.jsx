import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Clock,
    Play,
    Send,
    RotateCcw,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    FileCode,
    Award,
    Terminal,
    History,
    Check,
    Copy,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Editor from "@monaco-editor/react";
import Navbar from "../components/Navbar";

const STARTER_TEMPLATES = {
    python: `def main():
    # Write your code here
    pass

if __name__ == "__main__":
    main()`,

    cpp: `// C++ (GCC 9.2.0) Solution
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your code here

    return 0;
}`,

    java: `// Java (OpenJDK 13) Solution
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        // Write your code here

    }
}`,

    javascript: `// JavaScript (Node.js) Solution
const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    // Write your code here
}

main();`
};

function CodeEditor() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const competitionIdParam = searchParams.get("competitionId");
    const [competitionId, setCompetitionId] = useState(competitionIdParam || "");

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const [problem, setProblem] = useState(null);
    const [competition, setCompetition] = useState(null);
    const [isJoined, setIsJoined] = useState(true);
    const [joining, setJoining] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Editor state
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState(() => {
        const saved = localStorage.getItem(`coderush_code_${id}_python`);
        return saved || STARTER_TEMPLATES.python;
    });
    const [customInput, setCustomInput] = useState("");
    const [inputMode, setInputMode] = useState("sample"); // 'sample' or 'custom'

    // Execution states
    const [running, setRunning] = useState(false);
    const [runOutput, setRunOutput] = useState(null);

    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);

    // Bottom console active tab: 'console', 'result', 'history'
    const [bottomTab, setBottomTab] = useState("console");
    const [mySubmissions, setMySubmissions] = useState([]);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(null);
    const [compStatus, setCompStatus] = useState("live"); // 'upcoming', 'live', 'ended'

    // Copy states
    const [copiedInput, setCopiedInput] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const textareaRef = useRef(null);

    // Save code to localStorage whenever it changes
    const updateCode = (newCode) => {
        setCode(newCode);
        localStorage.setItem(`coderush_code_${id}_${language}`, newCode);
    };

    // 1. Fetch Problem, Competition, and Submissions
    useEffect(() => {
        const loadArenaData = async () => {
            try {
                setLoading(true);
                setError("");

                const [probRes, compsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/problems/${id}`),
                    axios.get("http://localhost:5000/api/competitions")
                ]);

                setProblem(probRes.data.problem);
                const allComps = compsRes.data.competitions || [];

                let matchedComp = null;
                if (competitionIdParam) {
                    matchedComp = allComps.find((c) => c._id === competitionIdParam);
                }
                if (!matchedComp && allComps.length > 0) {
                    matchedComp = allComps.find((c) =>
                        c.problems?.some((p) => (p._id || p).toString() === id.toString())
                    ) || allComps[0];
                }

                if (matchedComp) {
                    setCompetition(matchedComp);
                    setCompetitionId(matchedComp._id);

                    // Check if current student has joined this competition
                    if (user && matchedComp.participants) {
                        const joined = matchedComp.participants.some(
                            (p) => (p?._id || p).toString() === (user?.id || user?._id || "").toString()
                        );
                        setIsJoined(joined);
                    }
                }

                // Load past submissions
                if (token) {
                    try {
                        const subRes = await axios.get(
                            `http://localhost:5000/api/submissions/my?problemId=${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        setMySubmissions(subRes.data.submissions || []);
                    } catch (e) {
                        console.error("Submissions load error:", e);
                    }
                }
            } catch (err) {
                console.error("Error loading problem arena:", err);
                setError(err.response?.data?.message || "Failed to load coding arena");
            } finally {
                setLoading(false);
            }
        };

        loadArenaData();
    }, [id, competitionIdParam, token]);

    const handleJoinFromArena = async () => {
        if (!token || !competition) return;
        try {
            setJoining(true);
            await axios.post(
                `http://localhost:5000/api/competitions/${competition._id}/join`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setIsJoined(true);
            alert("Successfully joined competition! You can now solve this problem.");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to join competition");
        } finally {
            setJoining(false);
        }
    };

    // 2. Countdown Timer
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

    // Handle Tab key inside textarea
    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const { selectionStart, selectionEnd } = e.target;
            const newCode =
                code.substring(0, selectionStart) + "    " + code.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
                        selectionStart + 4;
                }
            }, 0);
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        const saved = localStorage.getItem(`coderush_code_${id}_${newLang}`);
        if (saved) {
            setCode(saved);
        } else {
            setCode(STARTER_TEMPLATES[newLang]);
        }
    };

    const handleResetCode = () => {
        if (window.confirm(`Reset code to initial ${language.toUpperCase()} template?`)) {
            const template = STARTER_TEMPLATES[language];
            updateCode(template);
        }
    };

    // ==========================================
    // RUN CODE (Sandbox testing)
    // ==========================================
    const handleRunCode = async () => {
        if (!token) {
            alert("Please log in to run your code.");
            return;
        }

        if (compStatus === "ended") {
            alert("Competition has ended. Code execution is locked.");
            return;
        }

        if (!code.trim()) {
            alert("Please write your code before running.");
            return;
        }

        setRunning(true);
        setRunOutput(null);
        setBottomTab("console");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/submissions/run",
                {
                    problemId: id,
                    competitionId,
                    language,
                    code,
                    customInput: inputMode === "custom" ? customInput : (problem?.sampleInput || "")
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setRunOutput(response.data);
        } catch (err) {
            console.error("Run Code error:", err);
            setRunOutput({
                stderr: err.response?.data?.message || "Failed to execute code in sandbox",
                status: "Error"
            });
        } finally {
            setRunning(false);
        }
    };

    // ==========================================
    // SUBMIT CODE (Grading against test cases)
    // ==========================================
    const handleSubmitCode = async () => {
        if (!token) {
            alert("Please log in to submit your solution.");
            return;
        }

        if (compStatus === "ended") {
            alert("Competition has ended. Submissions are closed.");
            return;
        }

        if (compStatus === "upcoming") {
            alert("Competition has not started yet. Submissions open when timer starts.");
            return;
        }

        if (!code.trim()) {
            alert("Please write code before submitting.");
            return;
        }

        setSubmitting(true);
        setSubmissionResult(null);
        setBottomTab("result");

        try {
            const response = await axios.post(
                "http://localhost:5000/api/submissions",
                {
                    problemId: id,
                    competitionId,
                    language,
                    code
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const sub = response.data.submission;
            setSubmissionResult(sub);

            // Refresh student past submissions
            const subRes = await axios.get(
                `http://localhost:5000/api/submissions/my?problemId=${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMySubmissions(subRes.data.submissions || []);
        } catch (err) {
            console.error("Submission failed:", err);
            setSubmissionResult({
                status: "Submission Error",
                score: 0,
                evaluationMessage: err.response?.data?.message || "Submission failed"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const copyText = (txt, type) => {
        navigator.clipboard.writeText(txt);
        if (type === "input") {
            setCopiedInput(true);
            setTimeout(() => setCopiedInput(false), 2000);
        } else {
            setCopiedOutput(true);
            setTimeout(() => setCopiedOutput(false), 2000);
        }
    };

    const getStatusBadgeClass = (status) => {
        if (status === "Accepted") return "verdict-accepted";
        if (status === "Wrong Answer") return "verdict-wrong";
        if (status === "Compilation Error") return "verdict-compile";
        if (status === "Time Limit Exceeded") return "verdict-tle";
        return "verdict-runtime";
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="editor-main-container">
                {/* ARENA HEADER TOOLBAR */}
                <div className="arena-header-bar">
                    <div className="arena-title-col">
                        <button
                            className="back-nav-button"
                            onClick={() =>
                                competitionId
                                    ? navigate(`/competition/${competitionId}`)
                                    : navigate("/dashboard")
                            }
                        >
                            <ArrowLeft size={16} />
                            Exit Arena
                        </button>
                        <h2 className="arena-title">
                            {problem ? problem.title : "Challenge Problem"}
                        </h2>
                        {problem && (
                            <span
                                className={`difficulty-tag diff-${(
                                    problem.difficulty || "Easy"
                                ).toLowerCase()}`}
                            >
                                {problem.difficulty}
                            </span>
                        )}
                        {problem && (
                            <span className="points-tag">
                                <Award size={14} />
                                {problem.points || 100} pts
                            </span>
                        )}
                    </div>

                    {/* LIVE TIMER BANNER */}
                    {competition && (
                        <div className={`arena-timer-pill timer-${compStatus}`}>
                            <Clock size={16} />
                            <div className="timer-text">
                                <span className="timer-label">
                                    {compStatus === "live"
                                        ? "TIME REMAINING"
                                        : compStatus === "upcoming"
                                        ? "STARTS IN"
                                        : "STATUS"}
                                </span>
                                <span className="timer-countdown">
                                    {compStatus === "ended" ? "COMPETITION ENDED" : timeLeft}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* STATUS ALERT BANNERS */}
                {compStatus === "ended" && (
                    <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px 20px", borderRadius: "10px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <span><strong>Competition Ended:</strong> Submissions are closed. You can view your previous submissions in the "My Submissions" tab below.</span>
                    </div>
                )}

                {compStatus === "upcoming" && (
                    <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b", color: "#fcd34d", padding: "12px 20px", borderRadius: "10px", margin: "0 0 20px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Clock size={18} color="#f59e0b" />
                        <span><strong>Competition has not started yet:</strong> Code submission is disabled until the competition begins.</span>
                    </div>
                )}

                {loading ? (
                    <div className="empty-state">
                        <Clock size={40} className="spin-icon" />
                        <h3>Loading Coding Arena...</h3>
                        <p>Preparing problem specifications and code sandbox.</p>
                    </div>
                ) : error ? (
                    <div className="empty-state error-border">
                        <AlertTriangle size={40} color="#ff7b7b" />
                        <h3>Error Loading Arena</h3>
                        <p>{error}</p>
                    </div>
                ) : !isJoined ? (
                    <div className="empty-state error-border" style={{ marginTop: "30px", padding: "40px" }}>
                        <AlertTriangle size={48} color="#f59e0b" style={{ margin: "0 auto 16px" }} />
                        <h3>Access Restricted</h3>
                        <p style={{ maxWidth: "450px", margin: "0 auto 20px", color: "#8b93ad" }}>
                            Students cannot open or solve problems belonging to competitions they have not joined. Please join this competition first to access the problem.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                            <button
                                className="join-button"
                                style={{ padding: "10px 24px", fontSize: "0.95rem" }}
                                onClick={handleJoinFromArena}
                                disabled={joining}
                            >
                                {joining ? "Joining..." : "Join Competition"}
                            </button>
                            <button
                                className="back-nav-button"
                                onClick={() => navigate(competition ? `/competition/${competition._id}` : "/dashboard")}
                            >
                                Back to Competition
                            </button>
                        </div>
                    </div>
                ) : problem ? (
                    <div className="arena-split-layout">
                        {/* LEFT PANE: PROBLEM STATEMENT */}
                        <div className="arena-left-pane">
                            <div className="pane-header">
                                <FileCode size={18} />
                                <span>Problem Statement</span>
                            </div>

                            <div className="pane-content-scroll">
                                <h3>Description</h3>
                                <p className="rich-text-desc">{problem.description}</p>

                                <h3>Input Format</h3>
                                <p className="format-text">{problem.inputFormat}</p>

                                <h3>Output Format</h3>
                                <p className="format-text">{problem.outputFormat}</p>

                                <h3>Constraints</h3>
                                <div className="constraints-box">
                                    <pre>{problem.constraints}</pre>
                                </div>

                                <div className="samples-grid">
                                    <div className="sample-card">
                                        <div className="sample-header">
                                            <span>Sample Input</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() => copyText(problem.sampleInput, "input")}
                                            >
                                                {copiedInput ? <Check size={14} /> : <Copy size={14} />}
                                                {copiedInput ? "Copied" : "Copy"}
                                            </button>
                                        </div>
                                        <pre className="code-display">{problem.sampleInput}</pre>
                                    </div>

                                    <div className="sample-card">
                                        <div className="sample-header">
                                            <span>Sample Output</span>
                                            <button
                                                className="copy-btn"
                                                onClick={() => copyText(problem.sampleOutput, "output")}
                                            >
                                                {copiedOutput ? <Check size={14} /> : <Copy size={14} />}
                                                {copiedOutput ? "Copied" : "Copy"}
                                            </button>
                                        </div>
                                        <pre className="code-display">{problem.sampleOutput}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANE: CODE EDITOR & RUN/SUBMIT CONSOLE */}
                        <div className="arena-right-pane">
                            {/* EDITOR TOP CONTROL BAR */}
                            <div className="editor-action-strip">
                                <div className="lang-picker">
                                    <label>Language:</label>
                                    <select
                                        value={language}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                    >
                                        <option value="python">Python 3 (3.8.1)</option>
                                        <option value="cpp">C++ (GCC 9.2)</option>
                                        <option value="java">Java 13</option>
                                        <option value="javascript">JavaScript (Node.js)</option>
                                    </select>
                                </div>

                                <div className="action-buttons-row">
                                    <button
                                        className="reset-btn"
                                        onClick={handleResetCode}
                                        title="Reset to starter template"
                                    >
                                        <RotateCcw size={14} />
                                        Reset
                                    </button>

                                    <button
                                        className="run-btn"
                                        onClick={handleRunCode}
                                        disabled={running || submitting || compStatus === "ended" || compStatus === "upcoming"}
                                    >
                                        <Play size={14} fill="currentColor" />
                                        {running ? "Running..." : "Run Code"}
                                    </button>

                                    <button
                                        className="submit-btn"
                                        onClick={handleSubmitCode}
                                        disabled={submitting || running || compStatus === "ended" || compStatus === "upcoming"}
                                    >
                                        <Send size={14} />
                                        {submitting ? "Evaluating..." : "Submit Code"}
                                    </button>
                                </div>
                            </div>

                            {/* MONACO CODE EDITOR */}
                            <div className="editor-input-wrapper" style={{ height: "420px", minHeight: "380px", borderRadius: "8px", overflow: "hidden", border: "1px solid #1f253d" }}>
                                <Editor
                                    height="100%"
                                    language={language === "cpp" ? "cpp" : language === "javascript" ? "javascript" : language}
                                    theme="vs-dark"
                                    value={code}
                                    onChange={(val) => updateCode(val || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: "on",
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 4,
                                        wordWrap: "on",
                                        fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
                                        readOnly: compStatus === "ended"
                                    }}
                                />
                            </div>

                            {/* RUN CODE INPUT SELECTOR */}
                            <div className="custom-input-section" style={{ background: "#0e1322", padding: "12px 16px", borderRadius: "8px", border: "1px solid #1e263d", marginTop: "12px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        Run Code Input (stdin)
                                    </span>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            className={`filter-tab ${inputMode === "sample" ? "active" : ""}`}
                                            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                                            onClick={() => setInputMode("sample")}
                                        >
                                            Sample Input
                                        </button>
                                        <button
                                            type="button"
                                            className={`filter-tab ${inputMode === "custom" ? "active" : ""}`}
                                            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                                            onClick={() => setInputMode("custom")}
                                        >
                                            Custom Input
                                        </button>
                                    </div>
                                </div>

                                {inputMode === "sample" ? (
                                    <pre className="code-display" style={{ margin: 0, padding: "8px 12px", fontSize: "0.85rem", maxHeight: "80px", overflow: "auto" }}>
                                        {problem?.sampleInput || "(No sample input specified)"}
                                    </pre>
                                ) : (
                                    <textarea
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        placeholder="Type custom standard input (stdin) for Run Code..."
                                        rows="3"
                                        style={{
                                            width: "100%",
                                            background: "#141a2e",
                                            border: "1px solid #283353",
                                            borderRadius: "6px",
                                            color: "#e2e8f0",
                                            padding: "8px",
                                            fontFamily: "monospace",
                                            fontSize: "0.85rem",
                                            resize: "vertical"
                                        }}
                                    />
                                )}
                            </div>

                            {/* BOTTOM RESULTS DRAWER */}
                            <div className="console-drawer">
                                <div className="console-tabs">
                                    <button
                                        className={`console-tab ${bottomTab === "console" ? "active" : ""}`}
                                        onClick={() => setBottomTab("console")}
                                    >
                                        <Terminal size={14} />
                                        Run Output
                                    </button>
                                    <button
                                        className={`console-tab ${bottomTab === "result" ? "active" : ""}`}
                                        onClick={() => setBottomTab("result")}
                                    >
                                        <CheckCircle2 size={14} />
                                        Submission Result
                                        {submissionResult && ` (${submissionResult.status})`}
                                    </button>
                                    <button
                                        className={`console-tab ${bottomTab === "history" ? "active" : ""}`}
                                        onClick={() => setBottomTab("history")}
                                    >
                                        <History size={14} />
                                        My Submissions ({mySubmissions.length})
                                    </button>
                                </div>

                                <div className="console-body">
                                    {/* TAB 1: RUN OUTPUT */}
                                    {bottomTab === "console" && (
                                        <div className="tab-pane-output">
                                            {running ? (
                                                <div className="running-hint">
                                                    <Clock size={16} className="spin-icon" />
                                                    <span>Compiling and executing in sandbox...</span>
                                                </div>
                                            ) : runOutput ? (
                                                <div className="run-results-view">
                                                    <div className="output-status-bar">
                                                        <span className="output-tag">
                                                            Status: <strong>{runOutput.status}</strong>
                                                        </span>
                                                        {runOutput.executionTime && (
                                                            <span className="output-tag">
                                                                Time: {runOutput.executionTime}
                                                            </span>
                                                        )}
                                                        {runOutput.memory && (
                                                            <span className="output-tag">
                                                                Memory: {runOutput.memory}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {runOutput.stdout && (
                                                        <div className="output-block">
                                                            <label>Standard Output (stdout):</label>
                                                            <pre className="output-stdout">{runOutput.stdout}</pre>
                                                        </div>
                                                    )}

                                                    {runOutput.stderr && (
                                                        <div className="output-block">
                                                            <label className="label-error">Standard Error (stderr):</label>
                                                            <pre className="output-stderr">{runOutput.stderr}</pre>
                                                        </div>
                                                    )}

                                                    {runOutput.compile_output && (
                                                        <div className="output-block">
                                                            <label className="label-error">Compilation Output:</label>
                                                            <pre className="output-stderr">{runOutput.compile_output}</pre>
                                                        </div>
                                                    )}

                                                    {!runOutput.stdout && !runOutput.stderr && !runOutput.compile_output && (
                                                        <p className="no-output-text">Program executed successfully with no output.</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="console-placeholder">
                                                    Click <strong>Run Code</strong> to execute your code against custom or sample inputs.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 2: SUBMISSION RESULT */}
                                    {bottomTab === "result" && (
                                        <div className="tab-pane-output">
                                            {submitting ? (
                                                <div className="running-hint">
                                                    <Clock size={16} className="spin-icon" />
                                                    <span>Evaluating solution against test cases...</span>
                                                </div>
                                            ) : submissionResult ? (
                                                <div className="submission-result-card">
                                                    <div className="result-banner">
                                                        <div className="result-verdict">
                                                            {submissionResult.status === "Accepted" ? (
                                                                <CheckCircle2 size={24} color="#4ade80" />
                                                            ) : (
                                                                <XCircle size={24} color="#f87171" />
                                                            )}
                                                            <div>
                                                                <span
                                                                    className={`verdict-pill ${getStatusBadgeClass(
                                                                        submissionResult.status
                                                                    )}`}
                                                                >
                                                                    {submissionResult.status}
                                                                </span>
                                                                <span className="score-summary">
                                                                    Score: <strong>{submissionResult.score}</strong> / {problem.points || 100}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="result-meta">
                                                            <span>Passed: {submissionResult.passedTestCases} / {submissionResult.totalTestCases}</span>
                                                            {submissionResult.executionTime && <span>Time: {submissionResult.executionTime}</span>}
                                                        </div>
                                                    </div>

                                                    {/* TEST CASES BREAKDOWN */}
                                                    {submissionResult.testCaseResults && submissionResult.testCaseResults.length > 0 && (
                                                        <div className="testcase-results-list">
                                                            <h4>Test Case Evaluation Breakdown:</h4>
                                                            <div className="testcase-grid">
                                                                {submissionResult.testCaseResults.map((tc) => (
                                                                    <div
                                                                        key={tc.testCaseNumber}
                                                                        className={`testcase-pill ${tc.passed ? "tc-passed" : "tc-failed"}`}
                                                                    >
                                                                        <div className="tc-header">
                                                                            {tc.passed ? (
                                                                                <CheckCircle2 size={16} />
                                                                            ) : (
                                                                                <XCircle size={16} />
                                                                            )}
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

                                                    {submissionResult.compileOutput && (
                                                        <div className="output-block" style={{ marginTop: "15px" }}>
                                                            <label className="label-error">Compilation Error Details:</label>
                                                            <pre className="output-stderr">{submissionResult.compileOutput}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="console-placeholder">
                                                    Click <strong>Submit Code</strong> to execute your solution against all problem test cases.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* TAB 3: MY SUBMISSIONS */}
                                    {bottomTab === "history" && (
                                        <div className="tab-pane-output">
                                            {mySubmissions.length === 0 ? (
                                                <p className="console-placeholder">No submissions recorded for this problem yet.</p>
                                            ) : (
                                                <div className="submissions-table-wrap">
                                                    <table className="submissions-table">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Language</th>
                                                                <th>Verdict</th>
                                                                <th>Score</th>
                                                                <th>Time</th>
                                                                <th>Submitted</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mySubmissions.map((sub, i) => (
                                                                <tr key={sub._id || i}>
                                                                    <td>#{mySubmissions.length - i}</td>
                                                                    <td>
                                                                        <span className="lang-tag">
                                                                            {sub.language?.toUpperCase()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span
                                                                            className={`verdict-pill-sm ${getStatusBadgeClass(
                                                                                sub.status
                                                                            )}`}
                                                                        >
                                                                            {sub.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <strong>{sub.score || 0}</strong> pts
                                                                    </td>
                                                                    <td>{sub.executionTime || "0.0s"}</td>
                                                                    <td>{new Date(sub.createdAt).toLocaleTimeString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}

export default CodeEditor;
