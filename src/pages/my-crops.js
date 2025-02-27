import { useContext, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

// Crop Icon Component
const CropIcon = ({ cropType }) => {
  const cropIcons = {
    rice: "🌾",
    wheat: "🌾",
    maize: "🌽",
    cotton: "🧶",
    sugarcane: "🍬",
    default: "🌱"
  };

  const icon = cropIcons[cropType.toLowerCase()] || cropIcons.default;
  return <span className="mr-2 text-xl">{icon}</span>;
};

// Crop Card Component
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

  // const formatBiddingEndTime = (endTimeStr) => {
  //   const endTime = new Date(endTimeStr);
  //   return endTime.toLocaleString('en-US', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     hour12: true
  //   });
  // };

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
              const endDate = new Date(data.endTime);
              const now = new Date();
              const diff = endDate.getTime() - now.getTime();
              
              if (diff <= 0) {
                setTimeLeft("Bidding ended");
                return;
              }
              
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
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
    <div className="bg-white shadow-md rounded-lg p-6 mb-4 border-l-4 border-green-500">
      {isEditing ? (
        <div className="text-black">
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
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <CropIcon cropType={input.fruitVegetable} />
                {input.fruitVegetable} 
                {input.variety && <span className="text-sm text-gray-500 ml-2">({input.variety})</span>}
              </h3>
              <p className="text-sm text-gray-600">
                {input.district}, {input.village}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-gray-500">
                Submitted on: {new Date(input.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4 dark:text-gray-800">
            <div>
              <p className="text-sm">
                <strong>Area:</strong> {input.area} acres
              </p>
              <p className="text-sm">
                <strong>Sown:</strong> {input.sownMonth}
              </p>
              <p className="text-sm">
                <strong>Expected Harvest:</strong> {input.harvestingMonth}
              </p>
            </div>
            <div>
              {showBids && biddingSession && (
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-sm">
                    <strong>Bidding Status:</strong>{' '}
                    <span className={
                      biddingSession.status === 'ongoing' 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }>
                      {biddingSession.status === 'ongoing' ? 'Active' : 'Not Listed'}
                    </span>
                  </p>
                  {biddingSession.status === 'ongoing' && (
                    <p className="text-sm">
                      <strong>Minimum Bid:</strong> ₹{biddingSession.minimumBid}/acre
                    </p>
                  )}
                  <p className="text-sm font-medium text-blue-400">
                    {timeLeft}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
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
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                >
                  Start Bidding
                </button>
              </div>
            ) : (
              <button
                onClick={handleStopBidding}
                disabled={stopBiddingLoading}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
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
              <p className="mb-2 bg-gray-700 px-2 py-1 rounded inline-block text-white">
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
                  Current Bids
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
                <div className="dark:text-black">
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
                <div className="dark:text-black">
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

  // Agricultural Insights Component
  const AgriculturalInsights = () => (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Agricultural Management Insights</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <h3 className="font-semibold text-lg mb-2 dark:text-gray-800">Crop Tracking</h3>
          <p className="text-gray-600 text-sm">
            Effectively monitor your agricultural production from sowing to harvest. 
            Keep detailed records of each crop&apos;s lifecycle and performance.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2 dark:text-gray-800">Bidding Strategies</h3>
          <p className="text-gray-600 text-sm">
            Maximize your crop&apos;s market value through our integrated bidding platform. 
            Get real-time market insights and competitive pricing.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2 dark:text-gray-800">Data-Driven Decisions</h3>
          <p className="text-gray-600 text-sm">
            Leverage historical crop data and market trends to make informed 
            agricultural decisions and improve your farming strategies.
          </p>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-t-4 border-green-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your crops...</p>
        </div>
      </div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agricultural Crop Management</h1>
          <p className="mb-4">
            Track, manage, and optimize your agricultural production. 
            Log in to access your personalized crop dashboard.
          </p>
          <Link 
            href="/login" 
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-green-600">My Crops</h1>
            <Link 
              href="/user-input" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Add New Crop
            </Link>
          </div>
          <p className="text-gray-600">
            Manage and track your agricultural inputs. View details, 
            start bidding, or remove crop entries.
          </p>
        </div>

        {/* Agricultural Insights */}
        <AgriculturalInsights />

        {/* Crops List */}
        {userInputs.length > 0 ? (
          <>
            <div className="space-y-4">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              You haven&apos;t added any crop entries yet.
            </p>
            <Link 
              href="/user-input" 
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Add Your First Crop
            </Link>
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">
            Why Track Your Crops?
          </h2>
          <ul className="space-y-3 text-blue-700 list-disc list-inside">
            <li>Monitor your agricultural production</li>
            <li>Access potential bidding opportunities</li>
            <li>Keep a digital record of your crop history</li>
            <li>Get personalized agricultural insights</li>
            </ul>
        </div>

        {/* Descriptive Footer */}
        <div className="mt-6 text-center bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-green-700 mb-4">
            Your Agricultural Journey Starts Here
          </h3>
          <p className="text-gray-600 mb-4">
            Agri Info Portal is committed to empowering farmers and traders 
            by providing a comprehensive platform for crop management, 
            market insights, and agricultural networking.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/crops" 
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Explore Crops
            </Link>
            <Link 
              href="/bids" 
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              View Ongoing Bids
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}