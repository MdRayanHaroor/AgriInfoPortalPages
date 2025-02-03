import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Step 1: Send OTP to the user's email.
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Failed to send OTP.");
      } else {
        setStatus(data.message || "OTP sent. Please check your email.");
        setStep(2);
      }
    } catch {
      setStatus("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset the password after verifying the OTP.
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatus("");
    if (newPassword !== confirmPassword) {
      setStatus("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Failed to reset password.");
      } else {
        // On success, show a toast message and redirect to login after 3 seconds.
        setAlertMessage("Password reset successfully. You may now log in.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setStatus("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
      {/* Toast message */}
      {alertMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
          {alertMessage}
        </div>
      )}
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {step === 1 && (
          <>
            <h1 className="dark:text-black text-3xl font-bold text-center mb-6">Forgot Password</h1>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  placeholder="Enter Your Registered Email ID"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="dark:text-black text-3xl font-bold text-center mb-6">Reset Password</h1>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-gray-700">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* New Password Field with Reveal Toggle */}
              <div className="relative">
                <label className="block text-gray-700">New Password</label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="dark:text-black dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-11 right-3 text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div>
                <label className="block text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </>
        )}
        {status && (
          <p className="mt-4 text-center text-lg text-gray-700">{status}</p>
        )}
        {step === 2 && (
          <p className="mt-4 text-center text-sm">
            <Link href="/login">
              <span className="text-blue-600 hover:underline">Back to Login</span>
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
