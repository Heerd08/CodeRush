import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false, studentOnly = false }) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!token || !user) {
        return <Navigate to="/" replace />;
    }

    if (adminOnly && user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    if (studentOnly && user.role === "admin") {
        return <Navigate to="/admin" replace />;
    }

    return children;
}

export default ProtectedRoute;
