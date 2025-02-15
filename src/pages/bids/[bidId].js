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

  if (loading) return <div className="p-6 text-center">Loading bid details...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  if (!bid) return <div className="p-6 text-center">No bid found</div>;

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Bid Details</h1>
      <div className="border p-4 rounded mb-4">
        <h2 className="text-xl font-semibold">
          Crop: {bid.cropDetails?.fruitVegetable || "N/A"}
        </h2>
        <p>
          <strong>District:</strong>{" "}
          {bid.cropDetails?.district || "N/A"}, {bid.cropDetails?.village || "N/A"}
        </p>
        <p>
          <strong>Area:</strong> {bid.cropDetails?.area || "N/A"} acres
        </p>
        <p>
          <strong>Minimum Bid:</strong> ₹{bid.minimumBid} per acre
        </p>
        <p>
          <strong>Bidding Ends:</strong> {new Date(bid.endTime).toLocaleString()}
        </p>
        <p className="bg-yellow-300 text-black px-2 py-1 rounded inline-block">
          <strong>Time Remaining:</strong> {timeLeft}
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Submit Your Bid</h2>
          <form onSubmit={handleBidSubmit} className="flex items-center gap-2">
            <input
              type="number"
              value={newBid}
              onChange={(e) => setNewBid(e.target.value)}
              placeholder="Bid amount"
              className="border p-2 rounded w-32 dark:text-black"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Submit Bid
            </button>
          </form>
          {bidStatus && (
            <p className={`mt-2 ${bidStatus.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {bidStatus}
            </p>
          )}
        </div>
      )}

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
        <div>
          <h2 className="text-xl font-semibold mb-2">All Bids</h2>
          {bid.bids && bid.bids.length > 0 ? (
            <ul>
              {bid.bids
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
          {bid.bids && bid.bids.some((b) => b.traderEmail === user?.email) ? (
            <ul>
              {bid.bids
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
                          Bid: ₹{bidItem.bidPerAcre} per acre
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

      <div className="mt-6 text-center">
        <Link href="/bids" className="text-blue-500 hover:underline">
          ← Back to Ongoing Bids
        </Link>
      </div>
    </section>
  );
}