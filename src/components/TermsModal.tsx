import React from "react";
import { X, FileText } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  if (!isOpen) return null;

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C2185B]/10 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-[#C2185B]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Terms and Conditions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-gray-700">
          <div>
            <p className="text-xs text-gray-500 mb-4">
              Last Updated: March 27, 2026
            </p>
            <p className="mb-4">
              Welcome to <strong>Shapes and Sizes</strong> inventory management system. By creating an account and using our services, you agree to be bound by these Terms and Conditions. Please read them carefully.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and using Shapes and Sizes, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">2. Account Registration</h3>
            <p className="mb-2">When you create an account with us, you must provide accurate, complete, and up-to-date information. You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your password meets our security requirements</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">3. User Roles and Permissions</h3>
            <p className="mb-2">
              Our system provides different access levels based on user roles:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Employee:</strong> Limited access to view and manage assigned inventory</li>
              <li><strong>Manager:</strong> Extended permissions including sales tracking and reporting</li>
              <li><strong>Admin:</strong> Full system access including user management and settings</li>
            </ul>
            <p className="mt-2">
              Role assignments are determined by system administrators and may not be self-selected during registration.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">4. Data Privacy and Security</h3>
            <p className="mb-2">
              We take your privacy seriously. By using our service, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>We collect and store information necessary to provide our services</li>
              <li>Your data is encrypted and stored securely</li>
              <li>We do not sell or share your personal information with third parties</li>
              <li>You have the right to request deletion of your data</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">5. Acceptable Use Policy</h3>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the system</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Upload malicious code or engage in harmful activities</li>
              <li>Share your account credentials with unauthorized individuals</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">6. Inventory Management</h3>
            <p>
              You are responsible for the accuracy of all inventory data you enter into the system. We are not liable for any business losses resulting from inaccurate inventory records, stock discrepancies, or data entry errors.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">7. Service Availability</h3>
            <p>
              While we strive to provide continuous service availability, we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service with or without notice.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">8. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Shapes and Sizes shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">9. Termination</h3>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">10. Changes to Terms</h3>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">11. Contact Information</h3>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <p className="mt-2 font-medium">
              support@shapesandsizes.com
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-600">
              By clicking "I Accept" and creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleAccept}
            className="w-full bg-[#C2185B] hover:bg-[#9D1050] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}