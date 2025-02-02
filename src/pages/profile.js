import React, { useContext } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  // If no user exists (which should not happen if protected by AuthGuard), show a simple message.
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
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
      </div>
      
    </div>
  );
}
