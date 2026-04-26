import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp, UserRole } from "../context/AppContext";
import { PasswordStrengthIndicator, calculatePasswordStrength } from "../components/PasswordStrength";
import { TermsModal } from "../components/TermsModal";

export function Signup() {
  const { registerUser, currentUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentUser) return <Navigate to="/dashboard" replace />;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    // Enhanced password validation
    const passwordStrength = calculatePasswordStrength(form.password);
    if (passwordStrength.strength === "weak") {
      setError("Password is too weak. Please meet all requirements.");
      setLoading(false);
      return;
    }
    
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    
    try {
      const result = await registerUser({
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName,
        email: form.email,
        password: form.password,
        role: "Employee" as UserRole,
      });
      
      if (result.success) {
        navigate("/verify-otp", { state: { otp: result.otp, email: form.email } });
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create an Account</h1>
          <p className="text-sm text-gray-500">Join us! It only takes a minute.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">First Name</label>
              <input
                name="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Last Name</label>
              <input
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              name="middleName"
              placeholder="Quincy"
              value={form.middleName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthIndicator password={form.password} showRequirements={true} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={() => setAcceptTerms(!acceptTerms)}
              className="w-4 h-4 text-[#C2185B] bg-gray-100 border-gray-300 rounded focus:ring-[#C2185B] focus:ring-2"
            />
            <label className="ml-2 text-sm text-gray-500">
              I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#C2185B] font-medium hover:underline">terms and conditions</button>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptTerms}
            className="w-full flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} />
            {loading ? "Sending OTP..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-[#C2185B] font-medium hover:underline">
            Log In
          </button>
        </p>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setAcceptTerms(true)}
      />
    </div>
  );
}