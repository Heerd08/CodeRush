import { useState, useEffect } from "react";
import axios from "axios";
import {
    Shield,
    Trophy,
    FileCode,
    Users,
    History,
    Plus,
    Edit2,
    Trash2,
    Settings,
    Check,
    X,
    Clock,
    AlertCircle,
    Eye,
    EyeOff,
    ListPlus,
    UserCheck
} from "lucide-react";
import Navbar from "../../components/Navbar";

function AdminDashboard() {
    const token = localStorage.getItem("token");

    const [activeTab, setActiveTab] = useState("overview"); // overview, competitions, problems, participants, submissions

    // Data states
    const [stats, setStats] = useState(null);
    const [competitions, setCompetitions] = useState([]);
    const [problems, setProblems] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState("");

    // Modal states
    const [showCompModal, setShowCompModal] = useState(false);
    const [editingComp, setEditingComp] = useState(null);
    const [compForm, setCompForm] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        duration: 60
    });

    const [showProbModal, setShowProbModal] = useState(false);
    const [editingProb, setEditingProb] = useState(null);
    const [probForm, setProbForm] = useState({
        title: "",
        description: "",
        difficulty: "Easy",
        inputFormat: "",
        outputFormat: "",
        constraints: "",
        sampleInput: "",
        sampleOutput: "",
        points: 100
    });

    // Assign problem modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedCompForAssign, setSelectedCompForAssign] = useState(null);
    const [probToAssignId, setProbToAssignId] = useState("");

    // Participants modal
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [compParticipants, setCompParticipants] = useState([]);
    const [compParticipantsTitle, setCompParticipantsTitle] = useState("");

    // View submission code modal
    const [viewingSubCode, setViewingSubCode] = useState(null);

    // Initial load
    const loadAllData = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, compRes, probRes, subRes] = await Promise.all([
                axios.get("http://localhost:5000/api/admin/stats", { headers }),
                axios.get("http://localhost:5000/api/competitions"),
                axios.get("http://localhost:5000/api/problems"),
                axios.get("http://localhost:5000/api/submissions", { headers })
            ]);

            setStats(statsRes.data.stats);
            setCompetitions(compRes.data.competitions || []);
            setProblems(probRes.data.problems || []);
            setSubmissions(subRes.data.submissions || []);
        } catch (err) {
            console.error("Failed to load admin data:", err);
            setActionMsg("Failed to connect to admin services.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const flashMessage = (msg) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(""), 3500);
    };

    // ==========================================
    // COMPETITIONS ACTIONS
    // ==========================================
    const openCreateComp = () => {
        setEditingComp(null);
        setCompForm({
            title: "",
            description: "",
            startTime: "",
            endTime: "",
            duration: 60
        });
        setShowCompModal(true);
    };

    const openEditComp = (comp) => {
        setEditingComp(comp);
        setCompForm({
            title: comp.title,
            description: comp.description,
            startTime: comp.startTime ? new Date(comp.startTime).toISOString().slice(0, 16) : "",
            endTime: comp.endTime ? new Date(comp.endTime).toISOString().slice(0, 16) : "",
            duration: comp.duration
        });
        setShowCompModal(true);
    };

    const handleSaveComp = async (e) => {
        e.preventDefault();

        if (!compForm.title.trim()) {
            alert("Competition title cannot be empty.");
            return;
        }
        if (!compForm.description.trim()) {
            alert("Competition description cannot be empty.");
            return;
        }
        if (!compForm.duration || Number(compForm.duration) <= 0) {
            alert("Invalid duration. Duration must be a positive number of minutes.");
            return;
        }
        if (!compForm.startTime || !compForm.endTime) {
            alert("Please specify both start time and end time.");
            return;
        }
        if (new Date(compForm.endTime) <= new Date(compForm.startTime)) {
            alert("End time must be after start time.");
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (editingComp) {
                await axios.put(
                    `http://localhost:5000/api/competitions/${editingComp._id}`,
                    compForm,
                    { headers }
                );
                flashMessage("Competition updated successfully!");
            } else {
                await axios.post(
                    "http://localhost:5000/api/competitions",
                    compForm,
                    { headers }
                );
                flashMessage("Competition created successfully!");
            }
            setShowCompModal(false);
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save competition");
        }
    };

    const handleDeleteComp = async (id, title) => {
        if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;

        try {
            await axios.delete(`http://localhost:5000/api/competitions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            flashMessage("Competition deleted.");
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete competition");
        }
    };

    // ==========================================
    // PROBLEMS ASSIGNMENT ACTIONS
    // ==========================================
    const openAssignModal = async (comp) => {
        try {
            // Fetch updated single competition with populated problems
            const res = await axios.get(`http://localhost:5000/api/competitions/${comp._id}`);
            setSelectedCompForAssign(res.data.competition);
            setProbToAssignId("");
            setShowAssignModal(true);
        } catch (err) {
            alert("Failed to load competition details.");
        }
    };

    const handleAssignProblem = async () => {
        if (!probToAssignId || !selectedCompForAssign) return;

        try {
            await axios.post(
                `http://localhost:5000/api/competitions/${selectedCompForAssign._id}/problems/${probToAssignId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage("Problem assigned successfully!");
            // Refresh modal data
            const res = await axios.get(`http://localhost:5000/api/competitions/${selectedCompForAssign._id}`);
            setSelectedCompForAssign(res.data.competition);
            setProbToAssignId("");
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to assign problem");
        }
    };

    const handleUnassignProblem = async (problemId) => {
        if (!window.confirm("Remove this problem from the competition?")) return;

        try {
            await axios.delete(
                `http://localhost:5000/api/competitions/${selectedCompForAssign._id}/problems/${problemId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            flashMessage("Problem removed from competition.");
            const res = await axios.get(`http://localhost:5000/api/competitions/${selectedCompForAssign._id}`);
            setSelectedCompForAssign(res.data.competition);
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove problem");
        }
    };

    // ==========================================
    // PARTICIPANTS VIEW
    // ==========================================
    const openParticipantsModal = async (comp) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/competitions/${comp._id}/participants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompParticipants(res.data.participants || []);
            setCompParticipantsTitle(res.data.competitionTitle || comp.title);
            setShowParticipantsModal(true);
        } catch (err) {
            alert("Failed to load participants.");
        }
    };

    // ==========================================
    // PROBLEM MANAGEMENT ACTIONS
    // ==========================================
    const openCreateProb = () => {
        setEditingProb(null);
        setProbForm({
            title: "",
            description: "",
            difficulty: "Easy",
            inputFormat: "",
            outputFormat: "",
            constraints: "",
            sampleInput: "",
            sampleOutput: "",
            points: 100,
            testCases: [
                { input: "", expectedOutput: "", isHidden: false },
                { input: "", expectedOutput: "", isHidden: true }
            ]
        });
        setShowProbModal(true);
    };

    const openEditProb = async (prob) => {
        try {
            // Fetch single problem with auth so admin receives all test cases (including hidden)
            const res = await axios.get(`http://localhost:5000/api/problems/${prob._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const p = res.data.problem || prob;
            setEditingProb(p);
            setProbForm({
                title: p.title || "",
                description: p.description || "",
                difficulty: p.difficulty || "Easy",
                inputFormat: p.inputFormat || "",
                outputFormat: p.outputFormat || "",
                constraints: p.constraints || "",
                sampleInput: p.sampleInput || "",
                sampleOutput: p.sampleOutput || "",
                points: p.points || 100,
                testCases: p.testCases && p.testCases.length > 0 ? p.testCases : [
                    { input: p.sampleInput || "", expectedOutput: p.sampleOutput || "", isHidden: false }
                ]
            });
            setShowProbModal(true);
        } catch (err) {
            console.error("Failed to load problem details:", err);
            // Fallback to table data
            setEditingProb(prob);
            setProbForm({
                title: prob.title,
                description: prob.description,
                difficulty: prob.difficulty,
                inputFormat: prob.inputFormat,
                outputFormat: prob.outputFormat,
                constraints: prob.constraints,
                sampleInput: prob.sampleInput,
                sampleOutput: prob.sampleOutput,
                points: prob.points || 100,
                testCases: [
                    { input: prob.sampleInput || "", expectedOutput: prob.sampleOutput || "", isHidden: false }
                ]
            });
            setShowProbModal(true);
        }
    };

    const handleAddTestCase = () => {
        setProbForm((prev) => ({
            ...prev,
            testCases: [
                ...(prev.testCases || []),
                { input: "", expectedOutput: "", isHidden: false }
            ]
        }));
    };

    const handleRemoveTestCase = (index) => {
        setProbForm((prev) => ({
            ...prev,
            testCases: prev.testCases.filter((_, i) => i !== index)
        }));
    };

    const handleTestCaseChange = (index, field, value) => {
        setProbForm((prev) => {
            const updated = [...(prev.testCases || [])];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, testCases: updated };
        });
    };

    const handleSaveProb = async (e) => {
        e.preventDefault();
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (editingProb) {
                await axios.put(
                    `http://localhost:5000/api/problems/${editingProb._id}`,
                    probForm,
                    { headers }
                );
                flashMessage("Problem updated successfully!");
            } else {
                await axios.post(
                    "http://localhost:5000/api/problems",
                    probForm,
                    { headers }
                );
                flashMessage("Problem created successfully!");
            }
            setShowProbModal(false);
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save problem");
        }
    };

    const handleDeleteProb = async (id, title) => {
        if (!window.confirm(`Delete problem "${title}"?`)) return;

        try {
            await axios.delete(`http://localhost:5000/api/problems/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            flashMessage("Problem deleted.");
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete problem");
        }
    };

    return (
        <div className="dashboard">
            <Navbar />

            <main className="dashboard-content">
                {/* ADMIN HEADER */}
                <div className="welcome-section" style={{ marginBottom: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                        <div>
                            <p className="small-text" style={{ color: "#f59e0b" }}>ADMINISTRATION CONTROL CONSOLE</p>
                            <h1>Platform Management ⚙️</h1>
                            <p>Author challenges, manage competitions, monitor participant activity, and inspect submissions.</p>
                        </div>

                        {actionMsg && (
                            <div className="admin-toast">
                                <Check size={16} />
                                <span>{actionMsg}</span>
                            </div>
                        )}
                    </div>

                    {/* STATS OVERVIEW CARDS */}
                    <div className="metrics-row" style={{ marginTop: "25px" }}>
                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-purple">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{stats?.competitionsCount ?? competitions.length}</span>
                                <span className="metric-label">Competitions</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-blue">
                                <FileCode size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{stats?.problemsCount ?? problems.length}</span>
                                <span className="metric-label">Problem Bank</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-green">
                                <Users size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{stats?.studentsCount ?? 0}</span>
                                <span className="metric-label">Students Registered</span>
                            </div>
                        </div>

                        <div className="metric-box">
                            <div className="metric-icon-wrap icon-orange">
                                <History size={22} />
                            </div>
                            <div>
                                <span className="metric-num">{stats?.submissionsCount ?? submissions.length}</span>
                                <span className="metric-label">Total Submissions</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ADMIN TABS NAVIGATION */}
                <div className="admin-nav-tabs">
                    <button
                        className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        <Shield size={16} />
                        Overview
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "competitions" ? "active" : ""}`}
                        onClick={() => setActiveTab("competitions")}
                    >
                        <Trophy size={16} />
                        Competitions ({competitions.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "problems" ? "active" : ""}`}
                        onClick={() => setActiveTab("problems")}
                    >
                        <FileCode size={16} />
                        Problems ({problems.length})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === "submissions" ? "active" : ""}`}
                        onClick={() => setActiveTab("submissions")}
                    >
                        <History size={16} />
                        Submissions ({submissions.length})
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="admin-overview-grid">
                        <div className="profile-section-card">
                            <div className="section-card-title">
                                <Trophy size={20} color="#a79dff" />
                                <h3>Quick Actions</h3>
                            </div>
                            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", padding: "10px 0" }}>
                                <button className="auth-button" style={{ width: "auto", padding: "12px 20px" }} onClick={openCreateComp}>
                                    <Plus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
                                    New Competition
                                </button>
                                <button className="view-problem-btn" style={{ padding: "12px 20px" }} onClick={openCreateProb}>
                                    <Plus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
                                    New Problem
                                </button>
                            </div>
                        </div>

                        <div className="profile-section-card">
                            <div className="section-card-title">
                                <Users size={20} color="#a79dff" />
                                <h3>Platform Summary</h3>
                            </div>
                            <p style={{ color: "#9da8c7", lineHeight: "1.6" }}>
                                CodeRush is running connected to MongoDB Atlas. Students can register, enter competitive arenas, view challenge specifications, and submit solutions. Submissions are saved and tracked in real-time.
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB 2: COMPETITIONS */}
                {activeTab === "competitions" && (
                    <div className="admin-content-pane">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2>Manage Competitions</h2>
                            <button className="auth-button" style={{ width: "auto", padding: "10px 20px" }} onClick={openCreateComp}>
                                <Plus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
                                Add Competition
                            </button>
                        </div>

                        {competitions.length === 0 ? (
                            <div className="empty-state">
                                <Trophy size={40} />
                                <h3>No Competitions Yet</h3>
                                <p>Click Add Competition to launch your first coding contest.</p>
                            </div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Duration</th>
                                            <th>Schedule</th>
                                            <th>Participants</th>
                                            <th>Problems</th>
                                            <th style={{ textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {competitions.map((comp) => (
                                            <tr key={comp._id}>
                                                <td>
                                                    <strong>{comp.title}</strong>
                                                    <p className="table-subtext">{comp.description?.slice(0, 60)}...</p>
                                                </td>
                                                <td>{comp.duration} mins</td>
                                                <td>
                                                    <span style={{ fontSize: "12px", color: "#a5adc7" }}>
                                                        Start: {new Date(comp.startTime).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="table-action-pill"
                                                        onClick={() => openParticipantsModal(comp)}
                                                    >
                                                        <Users size={14} />
                                                        {comp.participants?.length || 0} View
                                                    </button>
                                                </td>
                                                <td>
                                                    <button
                                                        className="table-action-pill pill-purple"
                                                        onClick={() => openAssignModal(comp)}
                                                    >
                                                        <ListPlus size={14} />
                                                        {comp.problems?.length || 0} Manage
                                                    </button>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "8px" }}>
                                                        <button
                                                            className="icon-btn-edit"
                                                            onClick={() => openEditComp(comp)}
                                                            title="Edit Competition"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            className="icon-btn-delete"
                                                            onClick={() => handleDeleteComp(comp._id, comp.title)}
                                                            title="Delete Competition"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: PROBLEMS */}
                {activeTab === "problems" && (
                    <div className="admin-content-pane">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2>Problem Bank</h2>
                            <button className="auth-button" style={{ width: "auto", padding: "10px 20px" }} onClick={openCreateProb}>
                                <Plus size={16} style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }} />
                                Add Problem
                            </button>
                        </div>

                        {problems.length === 0 ? (
                            <div className="empty-state">
                                <FileCode size={40} />
                                <h3>No Problems in Bank</h3>
                                <p>Create problems to assign them into competition arenas.</p>
                            </div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Difficulty</th>
                                            <th>Points</th>
                                            <th>Constraints</th>
                                            <th>Created Date</th>
                                            <th style={{ textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {problems.map((prob) => (
                                            <tr key={prob._id}>
                                                <td>
                                                    <strong>{prob.title}</strong>
                                                    <p className="table-subtext">{prob.description?.slice(0, 70)}...</p>
                                                </td>
                                                <td>
                                                    <span className={`difficulty-tag diff-${(prob.difficulty || "Easy").toLowerCase()}`}>
                                                        {prob.difficulty}
                                                    </span>
                                                </td>
                                                <td>{prob.points || 100} pts</td>
                                                <td>
                                                    <span className="code-inline">{prob.constraints?.slice(0, 30)}</span>
                                                </td>
                                                <td>{new Date(prob.createdAt).toLocaleDateString()}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "8px" }}>
                                                        <button
                                                            className="icon-btn-edit"
                                                            onClick={() => openEditProb(prob)}
                                                            title="Edit Problem"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            className="icon-btn-delete"
                                                            onClick={() => handleDeleteProb(prob._id, prob.title)}
                                                            title="Delete Problem"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: SUBMISSIONS */}
                {activeTab === "submissions" && (
                    <div className="admin-content-pane">
                        <div style={{ marginBottom: "20px" }}>
                            <h2>Platform Submissions Monitor</h2>
                            <p style={{ color: "#9da8c7" }}>Real student code submissions across all competitions.</p>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="empty-state">
                                <History size={40} />
                                <h3>No Submissions Yet</h3>
                                <p>When students submit code solutions, they will be tracked here in real time.</p>
                            </div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Competition</th>
                                            <th>Problem</th>
                                            <th>Language</th>
                                            <th>Status</th>
                                            <th>Submitted At</th>
                                            <th style={{ textAlign: "right" }}>Code</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map((sub) => (
                                            <tr key={sub._id}>
                                                <td>
                                                    <strong>{sub.user?.name || "Student"}</strong>
                                                    <p className="table-subtext">{sub.user?.email}</p>
                                                </td>
                                                <td>{sub.competition?.title || "N/A"}</td>
                                                <td>{sub.problem?.title || "N/A"}</td>
                                                <td>
                                                    <span className="lang-tag">
                                                        {sub.language?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-pill status-upcoming">
                                                        {sub.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(sub.createdAt).toLocaleString()}</td>
                                                <td style={{ textAlign: "right" }}>
                                                    <button
                                                        className="table-action-pill"
                                                        onClick={() => setViewingSubCode(sub)}
                                                    >
                                                        <Eye size={14} /> View Code
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* MODAL 1: CREATE / EDIT COMPETITION */}
                {showCompModal && (
                    <div className="modal-backdrop">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>{editingComp ? "Edit Competition" : "Create New Competition"}</h3>
                                <button className="modal-close" onClick={() => setShowCompModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveComp}>
                                <label>Competition Title</label>
                                <div className="input-box">
                                    <input
                                        type="text"
                                        value={compForm.title}
                                        onChange={(e) => setCompForm({ ...compForm, title: e.target.value })}
                                        placeholder="e.g. CodeRush Intra-College Hack"
                                        required
                                    />
                                </div>

                                <label>Description</label>
                                <textarea
                                    className="modal-textarea"
                                    value={compForm.description}
                                    onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                                    placeholder="Describe rules, eligibility, topics..."
                                    required
                                />

                                <div className="grid-2col">
                                    <div>
                                        <label>Start Time</label>
                                        <div className="input-box">
                                            <input
                                                type="datetime-local"
                                                value={compForm.startTime}
                                                onChange={(e) => setCompForm({ ...compForm, startTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label>End Time</label>
                                        <div className="input-box">
                                            <input
                                                type="datetime-local"
                                                value={compForm.endTime}
                                                onChange={(e) => setCompForm({ ...compForm, endTime: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <label>Duration (Minutes)</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        value={compForm.duration}
                                        onChange={(e) => setCompForm({ ...compForm, duration: Number(e.target.value) })}
                                        min="5"
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="back-nav-button" onClick={() => setShowCompModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="auth-button" style={{ width: "auto" }}>
                                        {editingComp ? "Update Competition" : "Create Competition"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: CREATE / EDIT PROBLEM */}
                {showProbModal && (
                    <div className="modal-backdrop">
                        <div className="modal-card modal-card-lg">
                            <div className="modal-header">
                                <h3>{editingProb ? "Edit Problem" : "Create New Problem"}</h3>
                                <button className="modal-close" onClick={() => setShowProbModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProb}>
                                <div className="grid-2col">
                                    <div>
                                        <label>Problem Title</label>
                                        <div className="input-box">
                                            <input
                                                type="text"
                                                value={probForm.title}
                                                onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
                                                placeholder="e.g. Reverse an Array"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label>Difficulty</label>
                                        <div className="input-box">
                                            <select
                                                value={probForm.difficulty}
                                                onChange={(e) => setProbForm({ ...probForm, difficulty: e.target.value })}
                                                style={{ width: "100%", background: "transparent", color: "white", border: "none", outline: "none" }}
                                            >
                                                <option value="Easy" style={{ background: "#111525" }}>Easy</option>
                                                <option value="Medium" style={{ background: "#111525" }}>Medium</option>
                                                <option value="Hard" style={{ background: "#111525" }}>Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <label>Description</label>
                                <textarea
                                    className="modal-textarea"
                                    value={probForm.description}
                                    onChange={(e) => setProbForm({ ...probForm, description: e.target.value })}
                                    placeholder="Problem statement..."
                                    required
                                />

                                <div className="grid-2col">
                                    <div>
                                        <label>Input Format</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={probForm.inputFormat}
                                            onChange={(e) => setProbForm({ ...probForm, inputFormat: e.target.value })}
                                            placeholder="Input specifications..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label>Output Format</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={probForm.outputFormat}
                                            onChange={(e) => setProbForm({ ...probForm, outputFormat: e.target.value })}
                                            placeholder="Output specifications..."
                                            required
                                        />
                                    </div>
                                </div>

                                <label>Constraints</label>
                                <div className="input-box">
                                    <input
                                        type="text"
                                        value={probForm.constraints}
                                        onChange={(e) => setProbForm({ ...probForm, constraints: e.target.value })}
                                        placeholder="e.g. 1 <= N <= 10^5"
                                        required
                                    />
                                </div>

                                <div className="grid-2col">
                                    <div>
                                        <label>Sample Input</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={probForm.sampleInput}
                                            onChange={(e) => setProbForm({ ...probForm, sampleInput: e.target.value })}
                                            placeholder="Sample input text..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label>Sample Output</label>
                                        <textarea
                                            className="modal-textarea"
                                            value={probForm.sampleOutput}
                                            onChange={(e) => setProbForm({ ...probForm, sampleOutput: e.target.value })}
                                            placeholder="Sample output text..."
                                            required
                                        />
                                    </div>
                                </div>

                                {/* TEST CASES SECTION */}
                                <div className="admin-testcases-section" style={{ marginTop: "15px", marginBottom: "15px", padding: "14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#e2e8f0" }}>Evaluation Test Cases</h4>
                                            <p className="table-subtext" style={{ margin: 0, fontSize: "0.78rem" }}>
                                                Executed when students submit code. Hidden test cases conceal their input and expected output from students.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            className="action-btn action-edit"
                                            onClick={handleAddTestCase}
                                            style={{ fontSize: "0.78rem", padding: "6px 12px" }}
                                        >
                                            <Plus size={14} /> Add Test Case
                                        </button>
                                    </div>

                                    {(!probForm.testCases || probForm.testCases.length === 0) ? (
                                        <p className="table-subtext" style={{ fontStyle: "italic", padding: "8px 0" }}>
                                            No evaluation test cases configured yet. Add at least one test case to evaluate code submissions.
                                        </p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {probForm.testCases.map((tc, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        background: "rgba(0,0,0,0.25)",
                                                        border: "1px solid rgba(255,255,255,0.06)",
                                                        borderRadius: "8px",
                                                        padding: "10px 12px"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#a5b4fc" }}>
                                                            Test Case #{index + 1}
                                                        </span>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.78rem", color: tc.isHidden ? "#f59e0b" : "#94a3b8", margin: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!tc.isHidden}
                                                                    onChange={(e) => handleTestCaseChange(index, "isHidden", e.target.checked)}
                                                                />
                                                                {tc.isHidden ? (
                                                                    <>
                                                                        <EyeOff size={13} color="#f59e0b" /> Hidden from Students
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye size={13} /> Public (Visible Sample)
                                                                    </>
                                                                )}
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveTestCase(index)}
                                                                style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
                                                                title="Delete Test Case"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid-2col" style={{ gap: "10px" }}>
                                                        <div>
                                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Input (stdin)</span>
                                                            <textarea
                                                                className="modal-textarea"
                                                                style={{ minHeight: "55px", fontSize: "0.82rem", fontFamily: "monospace" }}
                                                                value={tc.input || ""}
                                                                onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                                                                placeholder="Test case input..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Expected Output (stdout)</span>
                                                            <textarea
                                                                className="modal-textarea"
                                                                style={{ minHeight: "55px", fontSize: "0.82rem", fontFamily: "monospace" }}
                                                                value={tc.expectedOutput || ""}
                                                                onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                                                                placeholder="Expected stdout..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <label>Points</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        value={probForm.points}
                                        onChange={(e) => setProbForm({ ...probForm, points: Number(e.target.value) })}
                                        min="10"
                                        required
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="back-nav-button" onClick={() => setShowProbModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="auth-button" style={{ width: "auto" }}>
                                        {editingProb ? "Update Problem" : "Save Problem"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 3: ASSIGN PROBLEMS TO COMPETITION */}
                {showAssignModal && selectedCompForAssign && (
                    <div className="modal-backdrop">
                        <div className="modal-card">
                            <div className="modal-header">
                                <div>
                                    <h3>Assign Problems</h3>
                                    <p className="table-subtext">{selectedCompForAssign.title}</p>
                                </div>
                                <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* CURRENTLY ASSIGNED */}
                            <div style={{ marginBottom: "20px" }}>
                                <h4>Assigned Problems ({selectedCompForAssign.problems?.length || 0})</h4>
                                {!selectedCompForAssign.problems || selectedCompForAssign.problems.length === 0 ? (
                                    <p className="table-subtext" style={{ padding: "10px 0" }}>No problems assigned yet.</p>
                                ) : (
                                    <div className="assigned-problems-pills">
                                        {selectedCompForAssign.problems.map((p) => (
                                            <div key={p._id || p} className="assigned-pill">
                                                <span>{p.title || `Problem ID: ${p}`}</span>
                                                <button
                                                    type="button"
                                                    className="pill-remove-btn"
                                                    onClick={() => handleUnassignProblem(p._id || p)}
                                                    title="Remove problem"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ASSIGN NEW PROBLEM */}
                            <div>
                                <h4>Add from Problem Bank</h4>
                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <select
                                        className="modal-select"
                                        value={probToAssignId}
                                        onChange={(e) => setProbToAssignId(e.target.value)}
                                    >
                                        <option value="">Select a problem to add...</option>
                                        {problems
                                            .filter(
                                                (p) =>
                                                    !selectedCompForAssign.problems?.some(
                                                        (assigned) => (assigned._id || assigned).toString() === p._id.toString()
                                                    )
                                            )
                                            .map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.title} ({p.difficulty} - {p.points} pts)
                                                </option>
                                            ))}
                                    </select>

                                    <button
                                        type="button"
                                        className="auth-button"
                                        style={{ width: "auto", marginTop: 0 }}
                                        onClick={handleAssignProblem}
                                        disabled={!probToAssignId}
                                    >
                                        Assign Problem
                                    </button>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: "25px" }}>
                                <button type="button" className="auth-button" style={{ width: "auto" }} onClick={() => setShowAssignModal(false)}>
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 4: VIEW PARTICIPANTS */}
                {showParticipantsModal && (
                    <div className="modal-backdrop">
                        <div className="modal-card">
                            <div className="modal-header">
                                <div>
                                    <h3>Competition Participants</h3>
                                    <p className="table-subtext">{compParticipantsTitle}</p>
                                </div>
                                <button className="modal-close" onClick={() => setShowParticipantsModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            {compParticipants.length === 0 ? (
                                <div className="empty-subtle" style={{ margin: "20px 0" }}>
                                    <p>No students have joined this competition yet.</p>
                                </div>
                            ) : (
                                <div className="admin-table-wrap" style={{ maxHeight: "350px", overflowY: "auto" }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>College</th>
                                                <th>Student ID</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {compParticipants.map((p) => (
                                                <tr key={p._id}>
                                                    <td><strong>{p.name}</strong></td>
                                                    <td>{p.email}</td>
                                                    <td>{p.college}</td>
                                                    <td><span className="id-tag-subtle">{p.studentId}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="auth-button" style={{ width: "auto" }} onClick={() => setShowParticipantsModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 5: VIEW SUBMISSION CODE */}
                {viewingSubCode && (
                    <div className="modal-backdrop">
                        <div className="modal-card modal-card-lg">
                            <div className="modal-header">
                                <div>
                                    <h3>Submitted Code Preview</h3>
                                    <p className="table-subtext">
                                        {viewingSubCode.user?.name} • {viewingSubCode.problem?.title} ({viewingSubCode.language?.toUpperCase()})
                                    </p>
                                </div>
                                <button className="modal-close" onClick={() => setViewingSubCode(null)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="code-modal-box">
                                <pre className="code-display">{viewingSubCode.code}</pre>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="auth-button" style={{ width: "auto" }} onClick={() => setViewingSubCode(null)}>
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
