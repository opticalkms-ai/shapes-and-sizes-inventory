import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ShieldCheck, RefreshCw, Eye, EyeOff, Check } from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";
import { PasswordStrengthIndicator, calculatePasswordStrength } from "../components/PasswordStrength";
import { api } from "../utils/api";

export function ResetPassword() {
  const { resetPassword, generatedOtp, users } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string>(location.state?.otp || generatedOtp || "");
  const [email] = useState<string>(location.state?.email || "");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      inputs.current[0]?.focus();
    }
  }, [step]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[i] = val.slice(-1);
    setOtp(newOtp);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    
    const otpStr = otp.join("");
    if (otpStr.length < 6) { 
      setError("Please enter all 6 digits"); 
      setLoading(false);
      return; 
    }
    
    if (!email) {
      setError("Email not found. Please try again.");
      setLoading(false);
      return;
    }
    
    try {
      const result = await api.verifyResetOtp(email, otpStr);
      if (result.success) {
        setSuccess("OTP verified! Please set your new password.");
        setTimeout(() => {
          setSuccess("");
          setStep("password");
        }, 1000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await api.sendResetOtp(email);
      if (result.success) {
        if (result.otp) {
          setDemoOtp(result.otp);
        }
        setSuccess("New OTP sent to your email!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Enhanced password validation
    const passwordStrength = calculatePasswordStrength(password);
    if (passwordStrength.strength === "weak") {
      setError("Password is too weak. Please meet all requirements.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const result = resetPassword(email, password);
    if (result.success) {
      setSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        {step === "otp" ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Reset Code</h1>
              <p className="text-sm text-gray-500">
                {demoOtp 
                  ? "A verification code has been generated for you. In production, this would be sent to your email."
                  : "An OTP has been sent to your email. Please enter it below to proceed."
                }
              </p>
            </div>

            {demoOtp && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2 text-sm text-center mb-4">
                <span className="font-medium">Demo OTP:</span> {demoOtp}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm text-center mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm text-center mb-4">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">One-Time Password</label>
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-11 h-11 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={16} />
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-5">
              Didn't receive the code?{" "}
              <button 
                onClick={handleResend} 
                disabled={resending}
                className="text-[#C2185B] font-medium hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw size={12} />
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
              <p className="text-sm text-gray-500">
                Create a strong password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && <PasswordStrengthIndicator password={password} />}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2185B] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}`}>
                    <Check size={14} className={passwordStrength.hasMinLength ? "" : "opacity-30"} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasUpperCase ? "text-green-600" : "text-gray-500"}`}>
                    <Check size={14} className={passwordStrength.hasUpperCase ? "" : "opacity-30"} />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-500"}`}>
                    <Check size={14} className={passwordStrength.hasLowerCase ? "" : "opacity-30"} />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                    <Check size={14} className={passwordStrength.hasNumber ? "" : "opacity-30"} />
                    One number
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${passwordStrength.hasSpecialChar ? "text-green-600" : "text-gray-500"}`}>
                    <Check size={14} className={passwordStrength.hasSpecialChar ? "" : "opacity-30"} />
                    One special character (!@#$%^&*)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={16} />
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
