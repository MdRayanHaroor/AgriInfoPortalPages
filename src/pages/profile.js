import React, { useContext, useState } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";
import { Eye, EyeOff } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  
  // State to toggle the change password form visibility
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  
  // Toggle password reveal states for current and new password fields
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  // Alert message for password change success/failure
  const [alertMessage, setAlertMessage] = useState("");

  // If no user exists, prompt to log in (this should not occur if protected by an AuthGuard)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  // Handle password change submission
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus("");

    // Validate that the new password and confirmation match
    if (newPassword !== confirmPassword) {
      setPasswordStatus("New password and confirmation do not match.");
      return;
    }
    
    setIsChanging(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        setPasswordStatus(data.error || "Password change failed.");
      } else {
        // Set a persistent toast message
        setAlertMessage("Password changed successfully!");
        setTimeout(() => setAlertMessage(""), 3000);
        // Reset the fields and hide the form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
        // Also reset reveal states
        setShowCurrent(false);
        setShowNew(false);
      }
    } catch {
      setPasswordStatus("An error occurred. Please try again.");
    } finally {
      setIsChanging(false);
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
        <h1 className="text-3xl font-bold text-center mb-6 dark:text-black">Your Profile</h1>
        <div className="space-y-4 text-gray-800">
          <p>
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-semibold">Mobile:</span> {user.mobile}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {user.role}
          </p>
          <p>
            <span className="font-semibold">Type:</span> {user.type}
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="w-full text-center mt-4">
          <Link href="/">
            <span className="text-blue-600 hover:underline">Back to Home</span>
          </Link>
        </div>
        
        {/* Change Password Toggle */}
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-center">
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {showChangePassword ? "Cancel Change Password" : "Change Password"}
            </button>
          </div>
          
          {showChangePassword && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
              {/* Current Password with Reveal Toggle */}
              <div className="relative">
                <label className="block text-gray-700">Current Password</label>
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute top-10 right-3 text-gray-600 hover:text-gray-900"
                >
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* New Password with Reveal Toggle */}
              <div className="relative">
                <label className="block text-gray-700">New Password</label>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute top-10 right-3 text-gray-600 hover:text-gray-900"
                >
                  {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Confirm New Password (No reveal toggle as per norm) */}
              <div>
                <label className="block text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="dark:text-black mt-1 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {passwordStatus && (
                <p className="text-center text-sm text-gray-700">{passwordStatus}</p>
              )}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isChanging}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  {isChanging ? "Changing..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
