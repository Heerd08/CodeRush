import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Competitions from "./pages/Competitions";
import Problems from "./pages/Problems";
import CompetitionDetails from "./pages/CompetitionDetails";
import ProblemDetails from "./pages/ProblemDetails";
import CodeEditor from "./pages/CodeEditor";
import Submissions from "./pages/Submissions";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* STUDENT PROTECTED ROUTES */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/competitions"
                    element={
                        <ProtectedRoute>
                            <Competitions />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/problems"
                    element={
                        <ProtectedRoute>
                            <Problems />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/competition/:id"
                    element={
                        <ProtectedRoute>
                            <CompetitionDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/problem/:id"
                    element={
                        <ProtectedRoute>
                            <ProblemDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/problem/:id/solve"
                    element={
                        <ProtectedRoute>
                            <CodeEditor />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/leaderboard"
                    element={
                        <ProtectedRoute>
                            <Leaderboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/competition/:id/leaderboard"
                    element={
                        <ProtectedRoute>
                            <Leaderboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/submissions"
                    element={
                        <ProtectedRoute>
                            <Submissions />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* ADMIN PROTECTED ROUTES */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;