import { UserProfileData } from "./types";

export const API_BASE_URL = "http://localhost:8000";

export const setToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
    }
};

export const getToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("access_token");
    }
    return null;
};

export const removeToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
    }
};

export async function registerUser(username: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || "Registration failed");
    }

    return response.json();
}

export async function loginUser(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
    }

    return response.json();
}

export async function getUserProfile() {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/user-profile`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch profile");
    }

    return response.json();
}

export async function saveUserDetails(data: UserProfileData) {
    const token = getToken();
    if (!token) throw new Error("No token found");

    const response = await fetch(`${API_BASE_URL}/userdetails`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error("Failed to save user details");
    }

    return response.json();
}

export async function requestPasswordReset(email: string) {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to request password reset");
    }

    return response.json();
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to reset password");
    }

    return response.json();
}
