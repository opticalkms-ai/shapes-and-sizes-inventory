import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";

export function OTPVerify() {
  const { verifyOtp, registerUser, pendingUser, generatedOtp } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoOtp, setDemoOtp] = useState<string>(location.state?.otp || generatedOtp || "");
  const [email] = useState<string>(location.state?.email || pendingUser?.email || "");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

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

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    
    const otpStr = otp.join("");
    if (otpStr.length < 6) { 
      setError("Please enter all 6 digits"); 
      setLoading(false);
      return; 
    }
    
    if (!email) {
      setError("Email not found. Please sign up again.");
      setLoading(false);
      return;
    }
    
    try {
      const result = await verifyOtp(email, otpStr);
      if (result.success) {
        setSuccess("Account verified! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
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
    if (!pendingUser) return;
    
    setResending(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await registerUser(pendingUser);
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo size="lg" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
          <p className="text-sm text-gray-500">
            {demoOtp 
              ? "A verification code has been generated for you. In production, this would be sent to your email."
              : "An OTP has been sent to your email. Please enter it below to complete your registration."
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
            onClick={handleVerify}
            className="w-full flex items-center justify-center gap-2 bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
              </svg>
            ) : (
              <ShieldCheck size={16} />
            )}
            Verify Account
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-[#C2185B] font-medium hover:underline inline-flex items-center gap-1" disabled={resending}>
            {resending ? (
              <svg className="animate-spin h-5 w-5 text-[#C2185B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
              </svg>
            ) : (
              <RefreshCw size={12} />
            )}
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}