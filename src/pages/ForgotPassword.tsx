import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";

export function ForgotPassword() {
  const { sendPasswordResetOtp, users } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Check if user exists
    const userExists = users.find(u => u.email === email);
    if (!userExists) {
      setError("No account found with this email address");
      setLoading(false);
      return;
    }

    try {
      const result = await sendPasswordResetOtp(email);
      if (result.success) {
        navigate("/reset-password", { state: { email, otp: result.otp } });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-sm text-gray-500">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={16} />
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 mt-4 text-sm font-medium"
        >
          <ArrowLeft size={14} />
          Back to Login
        </button>
      </div>
    </div>
  );
}
