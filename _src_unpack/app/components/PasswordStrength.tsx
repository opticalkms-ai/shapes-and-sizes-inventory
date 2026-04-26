import React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export interface PasswordStrengthResult {
  strength: "weak" | "medium" | "strong";
  score: number;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("At least 8 characters");
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("One uppercase letter");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("One lowercase letter");
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("One number");
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push("One special character (!@#$%...)");
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong";
  if (score >= 5) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  } else {
    strength = "weak";
  }

  return { strength, score, feedback };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const result = calculatePasswordStrength(password);
  const { strength, score, feedback } = result;

  const getColor = () => {
    switch (strength) {
      case "weak":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "strong":
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getBarColor = () => {
    switch (strength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getIcon = () => {
    switch (strength) {
      case "weak":
        return <ShieldAlert size={14} />;
      case "medium":
        return <Shield size={14} />;
      case "strong":
        return <ShieldCheck size={14} />;
    }
  };

  const barWidth = `${(score / 6) * 100}%`;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: barWidth }}
        />
      </div>

      {/* Strength label */}
      <div className={`flex items-center gap-1.5 text-xs font-medium ${getColor().split(' ')[0]}`}>
        {getIcon()}
        <span className="capitalize">{strength} Password</span>
      </div>

      {/* Requirements */}
      {showRequirements && feedback.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-medium text-gray-700">Password must contain:</p>
          <ul className="space-y-0.5 pl-4">
            {feedback.map((item, idx) => (
              <li key={idx} className="list-disc">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PasswordRequirements() {
  return (
    <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
      <p className="font-semibold text-gray-700 mb-1.5">Password Requirements:</p>
      <ul className="space-y-0.5 pl-4">
        <li className="list-disc">At least 8 characters (12+ recommended)</li>
        <li className="list-disc">One uppercase letter (A-Z)</li>
        <li className="list-disc">One lowercase letter (a-z)</li>
        <li className="list-disc">One number (0-9)</li>
        <li className="list-disc">One special character (!@#$%...)</li>
      </ul>
    </div>
  );
}
