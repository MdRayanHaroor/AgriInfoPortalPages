//src/pages/bids/[bidId].js
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
  const [activeBidTab, setActiveBidTab] = useState("existing"); // "existing" or "my"
  const [editingBidId, setEditingBidId] = useState(null);
  const [editBidAmount, setEditBidAmount] = useState("");
  

  // Determine if the logged-in user is an admin.
  const isAdmin = user?.role === "admin";

  // Fetch bid details based on the bidId from the URL.
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

  // Calculate and update the time remaining.
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
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [bid]);

  const handleBidUpdate = async (oldBidPerAcre) => {
    if (!editBidAmount || Number(editBidAmount) <= 0) {
        setBidStatus("Invalid bid amount");
        return;
    }

    try {
        setBidStatus("Updating bid...");

        const res = await fetch("/api/update-bid", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                biddingId: bidId, // The ID of the bidding session
                traderEmail: user.email, // Identify trader
                oldBidPerAcre: Number(oldBidPerAcre), // Old bid to find & replace
                bidPerAcre: Number(editBidAmount), // New bid amount
            }),
        });

        const data = await res.json(); // Get API response
        if (!res.ok) {
            console.error("API Error:", data);
            throw new Error(data.error || "Failed to update bid");
        }

        setBidStatus("Bid updated successfully!");
        setEditingBidId(null);
        setEditBidAmount("");

        // Refresh bid details after updating
        const res2 = await fetch(`/api/get-bid?bidId=${bidId}`);
        const updatedData = await res2.json();
        setBid(updatedData);
    } catch (err) {
        setBidStatus(err instanceof Error ? err.message : "Error updating bid");
    }
};


  // Handle bid submission by the trader (only for non-admin users).
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    try {
      setBidStatus("Submitting bid...");
      const res = await fetch("/api/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biddingId: bidId, // Using biddingId instead of bidId.
          traderName: user ? user.name : "",
          traderEmail: user ? user.email : "",
          bidPerAcre: Number(newBid),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit bid");
      }
      setBidStatus("Bid submitted successfully!");
      setNewBid("");
      // Refresh bid details after submitting a bid.
      const res2 = await fetch(`/api/get-bid?bidId=${bidId}`);
      const updatedData = await res2.json();
      setBid(updatedData);
    } catch (err) {
      setBidStatus(err instanceof Error ? err.message : "Error submitting bid");
    }
  };

  if (loading)
    return <div className="p-6 text-center">Loading bid details...</div>;
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
  
      {/* Show the bid submission form only for non-admin users */}
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
          {bidStatus && <p className="mt-2">{bidStatus}</p>}
        </div>
      )}
  
      {/* Tabs for Existing Bids & My Bids */}
      <div className="mb-4 flex border-b">
        <button
          className={`px-4 py-2 ${activeBidTab === "existing" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveBidTab("existing")}
        >
          Existing Bids
        </button>
        <button
          className={`px-4 py-2 ${activeBidTab === "my" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          onClick={() => setActiveBidTab("my")}
        >
          My Bids
        </button>
      </div>
  
      {/* Existing Bids Section */}
      {activeBidTab === "existing" ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">All Bids</h2>
          {bid.bids && bid.bids.length > 0 ? (
            <ul>
              {bid.bids
                .sort((a, b) => b.bidPerAcre - a.bidPerAcre)
                .map((b, i) => (
                  <li key={i} className={i === 0 ? "bg-green-600 p-2" : "p-2"}>
                    Trader: {b.traderName}, Bid: ₹{b.bidPerAcre} per acre
                  </li>
                ))}
            </ul>
          ) : (
            <p>No bids yet.</p>
          )}
        </div>
      ) : (
        /* My Bids Section */
        <div>
          <h2 className="text-xl font-semibold mb-2">My Bids</h2>
          {bid.bids && bid.bids.some((b) => b.traderEmail === user.email) ? (
            <ul>
              {bid.bids
  .filter((b) => b.traderEmail === user.email)
  .map((bidItem, i) => (
    <li key={i} className="p-2 border rounded mb-2">
      {editingBidId === bidItem.bidPerAcre ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={editBidAmount}
            onChange={(e) => setEditBidAmount(e.target.value)}
            className="border p-1 rounded w-24 dark:text-black"
          />
          <button
            onClick={() => handleBidUpdate(bidItem.bidPerAcre)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Update
          </button>
          <button
            onClick={() => setEditingBidId(null)}
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
              setEditingBidId(bidItem.bidPerAcre);
              setEditBidAmount(bidItem.bidPerAcre.toString());
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
          {bidStatus && <p className="mt-2">{bidStatus}</p>}
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
