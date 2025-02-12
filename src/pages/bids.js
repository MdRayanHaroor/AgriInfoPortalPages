// pages/bids.js
import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AuthContext } from "@/context/AuthContext";

// Custom hook for bid timer
function useBidTimer(endTime) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(endTime);
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
  }, [endTime]);

  return timeLeft;
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <div className="animate-spin h-10 w-10 border-t-2 border-blue-500 rounded-full mx-auto"></div>
      <p className="mt-2 text-gray-500">Loading bids...</p>
    </div>
  );
}

// Error Message Component
function ErrorMessage({ message }) {
  return (
    <div className="p-6 max-w-4xl mx-auto text-center">
      <div className="text-red-500 bg-red-100 p-4 rounded-md">
        <p className="font-medium">Error:</p>
        <p>{message}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
}

// BidCard component
function BidCard({ bid }) {
  const timeLeft = useBidTimer(bid.endTime);
  const { user } = useContext(AuthContext);
  const cropDetails = bid.cropDetails || {};
  
  // Safely access bids array
  const bidsArray = Array.isArray(bid.bids) ? bid.bids : [];
  const userBid = bidsArray.find(b => b.traderEmail === user?.email);

  return (
    <div className="border p-4 rounded-md bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-semibold dark:text-black">
            {cropDetails.fruitVegetable || "N/A"}
            {userBid && (
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                Your Bid: ₹{userBid.bidPerAcre}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-700">
            {cropDetails.district || "N/A"}, {cropDetails.village || "N/A"}
          </p>
        </div>
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
          {timeLeft}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4  text-gray-700">
        <div>
          <p className="text-sm">
            <span className="text-gray-700">Area:</span> {cropDetails.area || "N/A"} acres
          </p>
          <p className="text-sm">
            <span className="text-gray-700">Minimum Bid:</span> ₹{bid.minimumBid}/acre
          </p>
        </div>
        <div>
          <p className="text-sm">
            <span className="text-gray-700">Total Bids:</span> {bidsArray.length}
          </p>
          <p className="text-sm">
            <span className="text-gray-700">Harvest Date:</span>{" "}
            {new Date(bid.endTime).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/bids/${bid._id}`}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm text-white"
        >
          {userBid ? 'Manage Bid' : 'Place Bid'}
        </Link>
      </div>
    </div>
  );
}

// Main BidsPage component
export default function BidsPage() {
  const { user } = useContext(AuthContext) || {};
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchBids = async () => {
      try {
        const response = await fetch("/api/get-ongoing-bids");
        if (!response.ok) throw new Error("Failed to fetch bids");
        const data = await response.json();
        
        // Ensure bids is an array
        const formattedBids = Array.isArray(data) ? data : [];
        setBids(formattedBids);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchBids, 300); // Small delay for better UX

    return () => clearTimeout(timeoutId);
  }, [user, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <section className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ongoing Bids</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {bids.length > 0 ? (
          bids.map((bid) => (
            <BidCard key={bid._id} bid={bid} />
          ))
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500 mb-4">No ongoing bids available</p>
            <Link 
              href="/crops" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Explore Available Crops
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}