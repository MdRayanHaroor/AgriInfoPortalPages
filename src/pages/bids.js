// pages/bids.js
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/AuthContext";

export default function BidsPage() {
  const { user } = useContext(AuthContext) || {};
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all ongoing bids (irrespective of the logged in user)
  useEffect(() => {
    // Optional: if you want to force login before viewing bids, you can check for user
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchBids = async () => {
      try {
        const response = await fetch("/api/get-ongoing-bids");
        if (!response.ok) throw new Error("Failed to fetch bids");
        const data = await response.json();
        setBids(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [user, router]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <div className="animate-spin h-10 w-10 border-t-2 border-blue-500 rounded-full mx-auto"></div>
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
      <h1 className="text-3xl font-bold mb-6 text-center">Ongoing Bids</h1>
      
      <div className="grid grid-cols-1 gap-4">
        {bids.length > 0 ? (
          bids.map((bid) => (
            <BidCard key={bid._id} bid={bid} />
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No ongoing bids available
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/crops" className="text-blue-500 hover:underline">
          ← Back to All Crops
        </Link>
      </div>
    </section>
  );
}

function BidCard({ bid }) {
    const [timeLeft, setTimeLeft] = useState("");
  
    // Use a default empty object if bid.cropDetails is undefined
    const cropDetails = bid.cropDetails || {};
  
    useEffect(() => {
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
    }, [bid.endTime]);
  
    return (
      <div className="border p-4 rounded-md bg-gray-800 text-white shadow-md">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-semibold">
              {cropDetails.fruitVegetable || "N/A"}
            </h3>
            <p className="text-sm text-gray-300">
              {cropDetails.district || "N/A"}, {cropDetails.village || "N/A"}
            </p>
          </div>
          <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
            {timeLeft}
          </span>
        </div>
  
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm">
              <span className="text-gray-400">Area:</span> {cropDetails.area || "N/A"} acres
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Minimum Bid:</span> ₹{bid.minimumBid}/acre
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="text-gray-400">Total Bids:</span> {bid.bids}
            </p>
            <p className="text-sm">
              <span className="text-gray-400">Harvest Date:</span>{" "}
              {new Date(bid.endTime).toLocaleDateString()}
            </p>
          </div>
        </div>
  
        <div className="mt-4 flex justify-end">
          <Link
            href={`/bids/${bid._id}`}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            View Details & Bid
          </Link>
        </div>
      </div>
    );
  }
  
