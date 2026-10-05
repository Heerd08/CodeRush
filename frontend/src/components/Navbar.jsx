import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    Code2,
    LogOut,
    Trophy,
    User as UserIcon,
    Shield,
    Layers,
    ExternalLink,
    History,
    FileCode
} from "lucide-react";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const isAdmin = user?.role === "admin";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div
                className="logo"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
            >
                <Code2 size={28} />
                <span>CodeRush</span>
            </div>

            {/* NAV LINKS */}
            <div className="nav-links">
                {isAdmin ? (
                    <>
                        <Link
                            to="/admin"
                            className={`nav-link ${isActive("/admin") ? "active" : ""}`}
                        >
                            <Shield size={16} />
                            Admin Console
                        </Link>
                        <Link
                            to="/dashboard"
                            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                        >
                            <ExternalLink size={16} />
                            Student View
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            to="/dashboard"
                            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                        >
                            <Layers size={16} />
                            Dashboard
                        </Link>
                        <Link
                            to="/competitions"
                            className={`nav-link ${location.pathname.startsWith("/competition") && !location.pathname.includes("/leaderboard") || location.pathname === "/competitions" ? "active" : ""}`}
                        >
                            <Trophy size={16} />
                            Competitions
                        </Link>
                        <Link
                            to="/problems"
                            className={`nav-link ${location.pathname.startsWith("/problem") || location.pathname === "/problems" ? "active" : ""}`}
                        >
                            <FileCode size={16} />
                            Problems
                        </Link>
                        <Link
                            to="/submissions"
                            className={`nav-link ${isActive("/submissions") ? "active" : ""}`}
                        >
                            <History size={16} />
                            My Submissions
                        </Link>
                        <Link
                            to="/leaderboard"
                            className={`nav-link ${location.pathname.includes("/leaderboard") ? "active" : ""}`}
                        >
                            <Trophy size={16} />
                            Leaderboard
                        </Link>
                        <Link
                            to="/profile"
                            className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                        >
                            <UserIcon size={16} />
                            Profile
                        </Link>
                    </>
                )}
            </div>

            {/* USER & LOGOUT */}
            <div className="nav-user-actions">
                <div className="user-profile-badge">
                    <span className="user-name">{user?.name || "User"}</span>
                    <span
                        className={`role-tag ${
                            isAdmin ? "role-admin" : "role-student"
                        }`}
                    >
                        {isAdmin ? "Admin" : "Student"}
                    </span>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                    title="Sign Out"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
