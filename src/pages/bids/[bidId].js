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

  // Fetch bid details based on the bidId from the URL
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

  // Handle bid submission by the trader
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    try {
      setBidStatus("Submitting bid...");
      const res = await fetch("/api/submit-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biddingId: bidId, // Use biddingId instead of bidId
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
      // Refresh bid details after submitting a bid
      const res2 = await fetch(`/api/get-bid?bidId=${bidId}`);
      const updatedData = await res2.json();
      setBid(updatedData);
    } catch (err) {
      setBidStatus(err instanceof Error ? err.message : "Error submitting bid");
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
      </div>
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
      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Bids</h2>
        {bid.bids && bid.bids.length > 0 ? (
          <ul>
            {bid.bids
              .sort((a, b) => b.amount - a.amount) // Sort descending by amount
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
      <div className="mt-6 text-center">
        <Link href="/bids" className="text-blue-500 hover:underline">
          ← Back to Ongoing Bids
        </Link>
      </div>
    </section>
  );
}
