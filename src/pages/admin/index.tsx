// pages/admin/index.tsx
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  type: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

interface UserInputData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  village: string;
  fruitVegetable: string;
  variety: string;
  area: number;
  sownMonth: string;
  harvestingMonth: string;
  createdAt: Date;
}

export default function AdminDashboard() {
  const { user, isLoading } = useContext(AuthContext) || {};
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "userInputs">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [userInputs, setUserInputs] = useState<UserInputData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not an admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      setError("");
      try {
        if (activeTab === "users") {
          // Fetch all users
          const response = await fetch("/api/get-users");
          if (!response.ok) {
            throw new Error("Failed to fetch users.");
          }
          const data = await response.json();
          setUsers(data);
        } else if (activeTab === "userInputs") {
          // Fetch all user inputs
          const response = await fetch("/api/get-user-inputs");
          if (!response.ok) {
            throw new Error("Failed to fetch user inputs.");
          }
          const data = await response.json();
          setUserInputs(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // Optional: Sorting for user inputs or users can be added here via useMemo if needed.

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return <div className="p-6 text-center">Unauthorized</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Navigation Tabs */}
      <div className="mb-4">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 mr-2 rounded ${
            activeTab === "users" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setActiveTab("userInputs")}
          className={`px-4 py-2 rounded ${
            activeTab === "userInputs" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
          }`}
        >
          Manage User Inputs
        </button>
      </div>

      {loadingData ? (
        <div className="text-center">Loading data...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : activeTab === "users" ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          {users.length ? (
  <div className="overflow-x-auto">
    <table className="min-w-full border">
      <thead>
        <tr className="bg-gray-100 dark:text-black">
          <th className="px-4 py-2 border whitespace-nowrap">Name</th>
          <th className="px-4 py-2 border whitespace-nowrap">Email</th>
          <th className="px-4 py-2 border whitespace-nowrap">Mobile</th>
          <th className="px-4 py-2 border whitespace-nowrap">Role</th>
          <th className="px-4 py-2 border whitespace-nowrap">Type</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id}>
            <td className="px-4 py-2 border whitespace-nowrap">{u.name}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{u.email}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{u.mobile}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{u.role}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{u.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p>No users found.</p>
)}
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-semibold mb-4">User Inputs</h2>
          {userInputs.length ? (
  <div className="overflow-x-auto">
    <table className="min-w-full border">
      <thead>
        <tr className="bg-gray-100 dark:text-black">
          <th className="px-4 py-2 border">Name</th>
          <th className="px-4 py-2 border">Email</th>
          <th className="px-4 py-2 border">Phone</th>
          <th className="px-4 py-2 border">District</th>
          <th className="px-4 py-2 border">Crop</th>
          <th className="px-4 py-2 border">Area</th>
          <th className="px-4 py-2 border">Sown</th>
          <th className="px-4 py-2 border">Harvest</th>
        </tr>
      </thead>
      <tbody>
        {userInputs.map((input) => (
          <tr key={input._id}>
            <td className="px-4 py-2 border whitespace-nowrap">{input.name}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.email}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.phone}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.district}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.fruitVegetable}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.area}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.sownMonth}</td>
            <td className="px-4 py-2 border whitespace-nowrap">{input.harvestingMonth}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p>No user inputs found.</p>
)}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link href="/"
          className="text-blue-500 hover:underline">← Back to Home
        </Link>
      </div>
    </div>
  );
}
