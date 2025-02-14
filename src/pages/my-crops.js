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

function MyCropCard({ input, refreshData }) {
  const { user } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [formData, setFormData] = useState({ ...input, minimumBid: input.minimumBid || 100 });
  const [editError, setEditError] = useState("");
  const [showBids, setShowBids] = useState(false);
  const [activeBidTab, setActiveBidTab] = useState("existing");
  const [minimumBid, setMinimumBid] = useState("");
  const [biddingSession, setBiddingSession] = useState(null);
  const [bidStatus, setBidStatus] = useState("");
  const [editingBidId, setEditingBidId] = useState(null);
  const [editBidAmount, setEditBidAmount] = useState("");
  const [stopBiddingLoading, setStopBiddingLoading] = useState(false);

  const nonEditableFields = ["name", "email", "phone", "_id", "createdAt"];

  // Validate bid amount
  const validateBidAmount = (amount) => {
    const bidNumber = Number(amount);
    if (!amount || isNaN(bidNumber)) {
      return "Please enter a valid bid amount";
    }
    if (bidNumber < Number(biddingSession.minimumBid)) {
      return `Bid must be at least ₹${biddingSession.minimumBid} per acre`;
    }
    if (biddingSession.bids && biddingSession.bids.length > 0) {
      const highestBid = Math.max(...biddingSession.bids.map((b) => Number(b.bidPerAcre)));
      if (bidNumber < highestBid) {
        return `Bid must be higher than the current highest bid of ₹${highestBid} per acre`;
      }
    }
    return null;
  };

  // Check if a bidding session exists and update timer
  useEffect(() => {
    const fetchBiddingSession = async () => {
      try {
        const res = await fetch(`/api/get-bidding-session?inputId=${input._id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === "ongoing") {
            setBiddingSession(data);
            setShowBids(true);

            // Update timer
            const updateTimer = () => {
              const endDate = new Date(data.biddingEndTime);
              const now = new Date();
              const diff = endDate.getTime() - now.getTime();
              
              if (diff <= 0) {
                setTimeLeft("Bidding ended");
                return;
              }
              
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000);
            return () => clearInterval(interval);
          }
        }
      } catch (error) {
        console.error("Error fetching bidding session:", error);
      }
    };
    fetchBiddingSession();
  }, [input._id]);

  // Handle input changes for editable fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Save (update crop input)
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

  // Handle Delete
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

  // Handle Start Bidding
  const handleStartBidding = async () => {
    if (!formData.harvestingMonth || formData.harvestingMonth.trim() === "") {
      alert("Harvesting month is not set.");
      return;
    }
    if (!minimumBid) {
      alert("Please set a minimum bid.");
      return;
    }
    try {
      setBidStatus("Starting bidding session...");
      const response = await fetch("/api/start-bidding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputId: input._id,
          minimumBid: Number(minimumBid),
          harvestingMonth: formData.harvestingMonth,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start bidding.");
      }
      const data = await response.json();
      setBiddingSession({
        _id: data.biddingId,
        endTime: data.biddingEndTime,
        minimumBid: Number(minimumBid),
        bids: data.bids || [],
      });
      setShowBids(true);
      setBidStatus("Bidding session started.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start bidding.");
    }
  };

  // Handle Stop Bidding
  const handleStopBidding = async () => {
    if (!confirm("If stopped all the existing bids will be deleted. Are you sure?")) {
      return;
    }
    setStopBiddingLoading(true);
    try {
      const response = await fetch("/api/stop-bidding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ biddingId: biddingSession?._id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to stop bidding.");
      }
      setShowBids(false);
      setTimeLeft("");
      setBidStatus("Bidding session stopped successfully.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to stop bidding.");
    } finally {
      setStopBiddingLoading(false);
    }
  };

  // Handle Bid Update
  const handleBidUpdate = async (bidToUpdateId) => {
    const validationError = validateBidAmount(editBidAmount);
    if (validationError) {
      setBidStatus(validationError);
      return;
    }

    try {
      setBidStatus("Updating bid...");
      const currentBid = biddingSession.bids.find(b => b._id === bidToUpdateId);
      
      if (!currentBid) {
        throw new Error("Original bid not found");
      }

      const res = await fetch("/api/update-bid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biddingId: biddingSession._id,
          bidId: bidToUpdateId,
          traderEmail: user.email,
          oldBidPerAcre: currentBid.bidPerAcre,
          bidPerAcre: Number(editBidAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update bid");
      }

      setBidStatus("Bid updated successfully!");
      setEditingBidId(null);
      setEditBidAmount("");

      // Refresh bidding session
      const res2 = await fetch(`/api/get-bidding-session?inputId=${input._id}`);
      const updatedData = await res2.json();
      setBiddingSession(updatedData);
    } catch (err) {
      setBidStatus(err instanceof Error ? err.message : "Error updating bid");
    }
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
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex space-x-2">
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
            </div>
            {!showBids ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minimumBid}
                  onChange={(e) => setMinimumBid(e.target.value)}
                  placeholder="Min Bid"
                  className="border p-2 rounded w-24 dark:text-black"
                  required
                />
                <button
                  onClick={handleStartBidding}
                  className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Start Bidding
                </button>
              </div>
            ) : (
              <button
                onClick={handleStopBidding}
                disabled={stopBiddingLoading}
                className="bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                {stopBiddingLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full inline-block mr-2"></div>
                    Stopping...
                  </>
                ) : (
                  "Stop Bidding"
                )}
              </button>
            )}
          </div>
          {showBids && biddingSession && (
            <div className="mt-4">
              <p className="mb-2 bg-gray-700 px-2 py-1 rounded inline-block">
                Bidding Timer: {timeLeft}
              </p>
              {/* Bidding Tabs */}
              <div className="mb-4 flex border-b">
                <button
                  onClick={() => setActiveBidTab("existing")}
                  className={`px-4 py-2 ${
                    activeBidTab === "existing"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Existing Bids
                </button>
                <button
                  onClick={() => setActiveBidTab("my")}
                  className={`px-4 py-2 ${
                    activeBidTab === "my"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  My Bids
                </button>
              </div>
              {activeBidTab === "existing" ? (
                <div>
                  <h2 className="text-xl font-semibold mb-2">All Bids</h2>
                  {biddingSession.bids && biddingSession.bids.length > 0 ? (
                    <ul>
                      {biddingSession.bids
                        .sort((a, b) => b.bidPerAcre - a.bidPerAcre)
                        .map((bidItem, index) => (
                          <li
                            key={bidItem._id || index}
                            className={`${index === 0 ? "bg-green-600 text-white" : ""} p-2 rounded mb-1`}
                          >
                            Trader: {bidItem.traderName}, Bid: ₹{bidItem.bidPerAcre} per acre
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p>No bids yet.</p>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-2">My Bids</h2>
                  {biddingSession.bids && biddingSession.bids.some((b) => b.traderEmail === user?.email) ? (
                    <ul>
                      {biddingSession.bids
                        .filter((b) => b.traderEmail === user?.email)
                        .map((bidItem) => (
                          <li key={bidItem._id} className="p-2 border rounded mb-2">
                            {editingBidId === bidItem._id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editBidAmount}
                                  onChange={(e) => setEditBidAmount(e.target.value)}
                                  className="border p-1 rounded w-24 dark:text-black"
                                />
                                <button
                                  onClick={() => handleBidUpdate(bidItem._id)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded"
                                >
                                  Update
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingBidId(null);
                                    setEditBidAmount("");
                                    setBidStatus("");
                                  }}
                                  className="bg-gray-600 text-white px-3 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <span>
                                  Bid: ₹{bidItem.bidPerAcre} per acre (Trader: {bidItem.traderName})
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingBidId(bidItem._id);
                                    setEditBidAmount(bidItem.bidPerAcre.toString());
                                    setBidStatus("");
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1 rounded"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p>No bids submitted by you.</p>
                  )}
                  {bidStatus && (
                    <p className={`mt-2 ${bidStatus.includes("success") ? "text-green-600" : "text-red-600"}`}>
                      {bidStatus}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}