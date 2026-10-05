import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

// Attach Authorization header automatically if token exists
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const currentPath = window.location.pathname;
            // Only redirect if not already on login/register page
            if (currentPath !== "/" && currentPath !== "/register") {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default API;
