import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Code2,
    User,
    Mail,
    Lock,
    GraduationCap,
    IdCard,
    Eye,
    EyeOff
} from "lucide-react";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        college: "",
        studentId: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        setMessage("");
        setIsSuccess(false);

        // Validation: passwords match
        if (formData.password !== formData.confirmPassword) {
            setMessage("Passwords do not match. Please verify and try again.");
            return;
        }

        if (formData.password.length < 6) {
            setMessage("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);

        try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    college: formData.college.trim(),
                    studentId: formData.studentId.trim(),
                    password: formData.password
                }
            );

            setIsSuccess(true);
            setMessage("Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/");
            }, 1200);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Registration failed. Please check the details and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card register-card">
                <div className="logo">
                    <Code2 size={32} />
                    <span>CodeRush</span>
                </div>

                <h1>Join CodeRush 🚀</h1>

                <p className="subtitle">
                    Create your student account and enter competitive coding arenas.
                </p>

                <form onSubmit={handleRegister}>
                    <label>Full Name</label>
                    <div className="input-box">
                        <User size={19} />
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>Email Address</label>
                    <div className="input-box">
                        <Mail size={19} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>College / University</label>
                    <div className="input-box">
                        <GraduationCap size={19} />
                        <input
                            type="text"
                            name="college"
                            placeholder="Enter your college name"
                            value={formData.college}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>Student ID / Roll No</label>
                    <div className="input-box">
                        <IdCard size={19} />
                        <input
                            type="text"
                            name="studentId"
                            placeholder="e.g. 21CS045"
                            value={formData.studentId}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>Password</label>
                    <div className="input-box">
                        <Lock size={19} />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Create a password (min 6 chars)"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <label>Confirm Password</label>
                    <div className="input-box">
                        <Lock size={19} />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {message && (
                        <div
                            className={
                                isSuccess ? "success-message" : "error-message"
                            }
                        >
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading || isSuccess}
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="switch-text">
                    Already have an account?
                    <Link to="/">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;