import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function BidDetailPage() {
  const router = useRouter();
  const { bidId } = router.query;
  const { user } = useContext(AuthContext) || {};
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newBid, setNewBid] = useState("");
  const [bidStatus, setBidStatus] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [activeBidTab, setActiveBidTab] = useState("existing");
  const [editingBidId, setEditingBidId] = useState(null);
  const [editBidAmount, setEditBidAmount] = useState("");

  const isAdmin = user?.role === "admin";

  // Fetch Bid Details
  useEffect(() => {
    if (!bidId) return;
    const fetchBid = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-bid?bidId=${bidId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch bid details");
        }
        const data = await res.json();
        setBid(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchBid();
  }, [bidId]);

  // Timer Calculation
  useEffect(() => {
    if (!bid) return;
    const calculateTimeLeft = () => {
      const endDate = new Date(bid.endTime);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      if (diff <= 0) return "Bidding ended";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${days}d ${hours}h ${minutes}m remaining`;
    };
    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);
    return () => clearInterval(interval);
  }, [bid]);

  // Bid Validation
  const validateBidAmount = (amount) => {
    const bidNumber = Number(amount);
    if (!amount || isNaN(bidNumber)) {
      return "Please enter a valid bid amount";
    }
    if (bidNumber < Number(bid.minimumBid)) {
      return `Bid must be at least ₹${bid.minimumBid} per acre`;
    }
    if (bid.bids && bid.bids.length > 0) {
      const highestBid = Math.max(...bid.bids.map((b) => Number(b.bidPerAcre)));
      if (bidNumber < highestBid) {
        return `Bid must be higher than the current highest bid of ₹${highestBid} per acre`;
      }
    }
    return null;
  };

  // Submit Bid Handler
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateBidAmount(newBid);
    if (validationError) {
      setBidStatus(validationError);
      return;
    }

    try {
      setBidStatus("Submitting bid...");
      const res = await fetch("/api/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biddingId: bidId,
          traderName: user?.name || "",
          traderEmail: user?.email || "",
          bidPerAcre: Number(newBid),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit bid");
      }

      setBidStatus("Bid submitted successfully!");
      setNewBid("");
      
      const res2 = await fetch(`/api/get-bid?bidId=${bidId}`);
      const updatedData = await res2.json();
      setBid(updatedData);
    } catch (err) {
      setBidStatus(err instanceof Error ? err.message : "Error submitting bid");
    }
  };

  // Update Bid Handler
  const handleBidUpdate = async (bidToUpdateId) => {
    const validationError = validateBidAmount(editBidAmount);
    if (validationError) {
      setBidStatus(validationError);
      return;
    }

    try {
      setBidStatus("Updating bid...");
      const currentBid = bid.bids.find(b => b._id === bidToUpdateId);
      
      if (!currentBid) {
        throw new Error("Original bid not found");
      }

      const res = await fetch("/api/update-bid", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biddingId: bidId,
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

      const res2 = await fetch(`/api/get-bid?bidId=${bidId}`);
      const updatedData = await res2.json();
      setBid(updatedData);
    } catch (err) {
      setBidStatus(err instanceof Error ? err.message : "Error updating bid");
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-t-4 border-green-500 rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading bid details...</p>
          <p className="text-sm text-gray-500">Preparing market insights</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Bid Retrieval Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t fetch the bid details at the moment. 
            Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // No Bid Found
  if (!bid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-2xl text-gray-600 mb-4">No bid found</p>
          <Link 
            href="/bids" 
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Back to Bids
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <header className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-green-800">Bid Details</h1>
            <Link href="/bids" className="text-green-600 hover:underline flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Back to Bids
            </Link>
          </div>
        </header>

        {/* Crop and Bid Information */}
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                {bid.cropDetails?.fruitVegetable || "Unspecified Crop"}
              </h2>
              <div className="space-y-2">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Location:</strong> {bid.cropDetails?.district || "N/A"}, {bid.cropDetails?.village || "N/A"}
                  </span>
                </p>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Area:</strong> {bid.cropDetails?.area || "N/A"} acres
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <p className="text-lg font-semibold text-green-800">Bidding Details</p>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  timeLeft.includes('remaining') 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-red-200 text-red-800'
                }`}>
                  {timeLeft}
                </span>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>Minimum Bid:</strong> ₹{bid.minimumBid} per acre
                </p>
                <p>
                  <strong>Bidding Ends:</strong> {new Date(bid.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bid Submission Section */}
        {!isAdmin && (
          <section className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Submit Your Bid</h2>
            <form onSubmit={handleBidSubmit} className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-grow w-full md:w-auto">
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Amount (per acre)
                </label>
                <input
                  id="bidAmount"
                  type="number"
                  value={newBid}
                  onChange={(e) => setNewBid(e.target.value)}
                  placeholder="Enter bid amount"
                  className="w-full border p-3 rounded-md focus:ring-2 focus:ring-green-500 dark:text-black"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition mt-4 md:mt-6"
              >
                Place Bid
              </button>
            </form>
            {bidStatus && (
  <p className={`mt-4 text-center ${
    bidStatus.includes("success") 
      ? "text-green-600" 
      : "text-red-600"
  }`}>
    {bidStatus}
  </p>
)}
          </section>
        )}

        {/* Bidding Tabs Section */}
        <section className="bg-white shadow-md rounded-lg">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveBidTab("existing")}
              className={`flex-1 py-4 text-lg font-semibold transition-colors ${
                activeBidTab === "existing"
                  ? "border-b-2 border-green-600 text-green-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Current Bids
            </button>
            <button
              onClick={() => setActiveBidTab("my")}
              className={`flex-1 py-4 text-lg font-semibold transition-colors ${
                activeBidTab === "my"
                  ? "border-b-2 border-green-600 text-green-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              My Bids
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeBidTab === "existing" ? (
              <div>
                <h2 className="text-2xl font-semibold text-green-800 mb-4">
                  All Bids
                </h2>
                {bid.bids && bid.bids.length > 0 ? (
                  <div className="space-y-2">
                    {bid.bids
                      .sort((a, b) => b.bidPerAcre - a.bidPerAcre)
                      .map((bidItem, index) => (
                        <div 
                          key={bidItem._id || index} 
                          className={`p-4 rounded-lg ${
                            index === 0 
                              ? "bg-green-100 border-l-4 border-green-600" 
                              : "bg-gray-50 border-l-4 border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800">
                                {bidItem.traderName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Bid: ₹{bidItem.bidPerAcre} per acre
                              </p>
                            </div>
                            {index === 0 && (
                              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                                Highest Bid
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No bids have been placed yet.</p>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold text-green-800 mb-4">
                  My Bids
                </h2>
                {bid.bids && bid.bids.some((b) => b.traderEmail === user?.email) ? (
                  <div className="space-y-4">
                    {bid.bids
                      .filter((b) => b.traderEmail === user?.email)
                      .map((bidItem) => (
                        <div 
                          key={bidItem._id} 
                          className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500"
                        >
                          {editingBidId === bidItem._id ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleBidUpdate(bidItem._id);
                              }}
                              className="flex items-center gap-4"
                            >
                              <div className="flex-grow">
                                <label 
                                  htmlFor="editBidAmount" 
                                  className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                  Update Bid Amount
                                </label>
                                <input
                                  id="editBidAmount"
                                  type="number"
                                  value={editBidAmount}
                                  onChange={(e) => setEditBidAmount(e.target.value)}
                                  className="w-full border p-2 rounded dark:text-black"
                                  required
                                />
                              </div>
                              <div className="flex gap-2 mt-6">
                                <button
                                  type="submit"
                                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                  Update
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBidId(null);
                                    setEditBidAmount("");
                                    setBidStatus("");
                                  }}
                                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-800">
                                  Your Bid
                                </p>
                                <p className="text-sm text-gray-600">
                                  ₹{bidItem.bidPerAcre} per acre
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingBidId(bidItem._id);
                                  setEditBidAmount(bidItem.bidPerAcre.toString());
                                  setBidStatus("");
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                              >
                                Edit Bid
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    You haven&apos;t submitted any bids for this crop.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Additional Information Section */}
        <section className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">
            Bidding Guidelines
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Minimum Bid
              </h3>
              <p className="text-gray-600 text-sm">
                All bids must be at or above the minimum bid amount 
                specified for this crop.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Bid Updates
              </h3>
              <p className="text-gray-600 text-sm">
                You can modify your bid multiple times before 
                the bidding period ends.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-green-700">
                Transparency
              </h3>
              <p className="text-gray-600 text-sm">
                All bids are visible to participants to ensure 
                fair and open trading.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}