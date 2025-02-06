import { useContext, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function MyCrops() {
  const { user, isLoading: authLoading } = useContext(AuthContext) || {};
  const [userInputs, setUserInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state: 10 items per page
  const rowsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch only the current user's inputs using both email and phone as query parameters.
  useEffect(() => {
    if (!user) return;
    const fetchUserInputs = async () => {
      try {
        setLoading(true);
        setError(null);
        const email = user.email;
        const phone = user.mobile;
        const response = await fetch(
          `/api/get-user-inputs?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`
        );
        if (!response.ok) {
          const text = await response.text();
          throw new Error("Failed to fetch your input data: " + text);
        }
        const data = await response.json();
        // Extra client-side filtering (in case the API returns more than expected)
        const myData = data.filter(
          (item) => item.email === email && item.phone === phone
        );
        setUserInputs(myData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchUserInputs();
  }, [user]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(userInputs.length / rowsPerPage), [userInputs]);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return userInputs.slice(start, start + rowsPerPage);
  }, [userInputs, currentPage]);

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  // Reset pagination when userInputs change
  useEffect(() => {
    setCurrentPage(1);
  }, [userInputs]);

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-blue-500 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p>Please log in to view your crops.</p>
        <Link href="/login" className="text-blue-500 hover:underline">
          Log In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">My Crops</h1>
      
      {userInputs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedData.map((input) => (
              <MyCropCard
                key={input._id}
                input={input}
                refreshData={async () => {
                  if (!user) return;
                  try {
                    setLoading(true);
                    const email = user.email;
                    const phone = user.mobile;
                    const res = await fetch(
                      `/api/get-user-inputs?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`
                    );
                    if (res.ok) {
                      const data = await res.json();
                      const myData = data.filter(
                        (item) => item.email === email && item.phone === phone
                      );
                      setUserInputs(myData);
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-4">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400 text-center">No crops found for you.</p>
      )}

      <div className="mt-6 text-center">
        <Link href="/crops" className="text-blue-500 hover:underline">
          ← Back to All Crops
        </Link>
      </div>
    </section>
  );
}

// MyCropCard Component: Renders each submission with editing, deletion, and bidding functionality.
function MyCropCard({ input, refreshData }) {
  // Correctly destructure bidStarted along with its setter.
  //const [bidStarted, setBidStarted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [formData, setFormData] = useState({ ...input });
  const [editError, setEditError] = useState("");
  const [showBids, setShowBids] = useState(false);

  // Fields that are not editable.
  const nonEditableFields = ["name", "email", "phone", "_id", "createdAt"];

  // Static trader bids sorted descending by bidPerAcre.
  const staticBids = [
    { traderName: "Trader One", bidPerAcre: 200 },
    { traderName: "Trader Two", bidPerAcre: 220 },
    { traderName: "Trader Three", bidPerAcre: 210 },
  ].sort((a, b) => b.bidPerAcre - a.bidPerAcre);

  // Handle input changes for editable fields.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Save (update)
  const handleSave = async () => {
    try {
      setEditError("");
      const response = await fetch("/api/update-user-input", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Update failed");
      }
      setIsEditing(false);
      refreshData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Update failed");
    }
  };

  // Handle Delete with confirmation.
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this input?")) return;
    try {
      const response = await fetch("/api/delete-user-input", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: input._id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }
      refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  // Start Bidding: Compute last day of harvesting month and start countdown timer.
  const handleStartBidding = () => {
    if (!formData.harvestingMonth) {
      alert("Harvesting month is not set.");
      return;
    }
    const [year, month] = formData.harvestingMonth.split("-");
    // Calculate the last day of the month by setting day to 0 of next month.
    const endDate = new Date(Number(year), Number(month), 0);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    if (diffMs <= 0) {
      alert("Harvesting month is over. Cannot start bidding.");
      return;
    }
    //setBidStarted(true);
    setShowBids(true);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Bidding ended");
        setBidStarted(false);
      } else {
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        setTimeLeft(`${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`);
      }
    }, 1000);
  };

  // Stop Bidding: Cancel bidding.
  const handleStopBidding = () => {
    //setBidStarted(false);
    setShowBids(false);
    setTimeLeft("");
  };

  return (
    <div className="border p-4 rounded-md bg-gray-800 text-white shadow-md">
      {isEditing ? (
        <div>
          {Object.keys(formData).map((key) => {
            if (nonEditableFields.includes(key)) return null;
            return (
              <div key={key} className="mb-2">
                <label className="block text-sm font-medium capitalize">{key}</label>
                <input
                  type="text"
                  name={key}
                  value={formData[key]}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-black"
                />
              </div>
            );
          })}
          {editError && <p className="text-red-500 text-sm mb-2">{editError}</p>}
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-1">{input.name}</h3>
          <p className="text-sm text-gray-300">{input.email} | {input.phone}</p>
          <p className="text-sm text-gray-300">📍 {input.district}, {input.village}</p>
          <p className="text-sm text-gray-300">🌿 {input.fruitVegetable} ({input.variety})</p>
          <p className="text-sm text-gray-300">📏 Area: {input.area} acres</p>
          <p className="text-sm text-gray-300">📅 Sown: {input.sownMonth} | Harvest: {input.harvestingMonth}</p>
          <p className="text-xs text-gray-400 mt-2">
            Submitted on: {new Date(input.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
            {!showBids ? (
              <button
                onClick={handleStartBidding}
                className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                Start Bidding
              </button>
            ) : (
              <button
                onClick={handleStopBidding}
                className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                Stop Bidding
              </button>
            )}
          </div>
          {showBids && (
            <div className="mt-4 p-2 bg-gray-700 rounded">
              <p className="mb-2">Bidding Timer: {timeLeft}</p>
              <div className="grid grid-cols-1 gap-2">
                {staticBids.map((bid, index) => (
                  <div
                    key={index}
                    className={`p-2 border rounded bg-gray-800 ${index === 0 ? "bg-green-600" : ""}`}
                  >
                    <p className="text-sm">Trader: {bid.traderName}</p>
                    <p className="text-sm">Bid per acre: ₹{bid.bidPerAcre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
