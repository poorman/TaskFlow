"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const { login, register, isLoading } = useAuthStore();
  const router = useRouter();

  // Test backend connectivity on mount
  useEffect(() => {
    const testBackend = async () => {
      try {
        // Try to reach the health endpoint (if accessible) or root
        const response = await api.get('/health').catch(() => null);
        if (response) {
          console.log('Backend health check:', response.data);
        } else {
          console.warn('Backend health endpoint not accessible, but this is OK if it\'s not routed');
        }
      } catch (err) {
        console.error('Backend connectivity test failed:', err);
      }
    };
    testBackend();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate inputs
    if (!email || !email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password || !password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName || undefined, orgName || undefined);
      }
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      
      // More detailed error handling
      let errorMessage = "Authentication failed";
      
      // Use enhanced error message from API interceptor if available
      if (err.response?.data?.detail) {
        // Handle validation errors from FastAPI
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Multiple validation errors
          errorMessage = detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(", ");
        } else if (typeof detail === "string") {
          errorMessage = detail;
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (err.message && err.message !== "Network Error") {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.request || err.isNetworkError) {
        // Request was made but no response received (network error)
        errorMessage = "Unable to connect to server. Please check your connection and try again.";
      } else if (err.message) {
        // Error in request setup
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="neumorphism-container">
      <div className="neumorphism-card">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="neumorphism-logo">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h1 className="neumorphism-title">TaskFlow</h1>
          <p className="neumorphism-subtitle">
            {isLogin ? "Welcome back! Please sign in to your account" : "Create your account to get started"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="neumorphism-error">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name (Sign Up Only) */}
          {!isLogin && (
            <div>
              <label htmlFor="fullName" className="neumorphism-label">
                Full Name
              </label>
              <div className="neumorphism-input-wrapper">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="neumorphism-input"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {/* Organization Name (Sign Up Only) */}
          {!isLogin && (
            <div>
              <label htmlFor="orgName" className="neumorphism-label">
                Organization Name
              </label>
              <div className="neumorphism-input-wrapper">
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="neumorphism-input"
                  placeholder="My Company"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="neumorphism-label">
              Email Address
            </label>
            <div className="neumorphism-input-wrapper">
              <svg
                className="neumorphism-input-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neumorphism-input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="neumorphism-label">
              Password
            </label>
            <div className="neumorphism-input-wrapper">
              <svg
                className="neumorphism-input-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neumorphism-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="neumorphism-button-primary w-full"
            style={{ marginTop: '1.5rem' }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>

          {/* Toggle Login/Signup */}
          <div className="text-center" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="neumorphism-link"
            >
              {isLogin ? (
                <>
                  Don't have an account? <span className="font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="neumorphism-divider">
          <span>OR</span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (
              typeof window !== 'undefined' 
                ? `${window.location.protocol}//${window.location.host}`
                : 'http://localhost:8000'
            );
            window.location.href = `${apiUrl}/api/v1/auth/google`;
          }}
          className="neumorphism-button-google"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
